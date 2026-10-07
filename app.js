(function () {
  var STORAGE_CHECK = 'grace60-check-v1';
  var STORAGE_CALC = 'grace60-calc-v1';
  var ITEMS = [
    { id: 'end-letter', phase: 'From your employer', label: 'Written confirmation of your official employment end date (termination or separation letter)' },
    { id: 'paystubs', phase: 'From your employer', label: 'Last 3+ pay stubs and your most recent W-2 saved' },
    { id: 'i797', phase: 'From your employer', label: 'Copies of every I-797 approval notice and the LCA / petition copy if your employer will share it' },
    { id: 'evl', phase: 'From your employer', label: 'Employment verification / experience letter requested' },
    { id: 'severance', phase: 'From your employer', label: 'Severance terms read carefully (ask an attorney how they interact with your end date before signing)' },
    { id: 'i94', phase: 'Your status documents', label: 'Most recent I-94 downloaded from CBP and its end date written down' },
    { id: 'passport', phase: 'Your status documents', label: 'Passport validity checked (renewals for Indians: see Mohlat)' },
    { id: 'visa-stamp', phase: 'Your status documents', label: 'Visa stamp, previous I-20s / EADs and degree certificates collected in one folder' },
    { id: 'family', phase: 'Your status documents', label: 'Spouse / children: H-4 or L-2 I-94s and approval notices collected (their status usually depends on yours)' },
    { id: 'attorney', phase: 'Plan', label: 'Immigration attorney consultation booked (many offer a short paid consult)' },
    { id: 'deadline', phase: 'Plan', label: 'Grace-period last day written on your calendar with a reminder 2 weeks before' },
    { id: 'path', phase: 'Plan', label: 'Main path chosen with your attorney: new employer petition, change of status, adjustment, compelling-circumstances EAD, or departure' },
    { id: 'no-work', phase: 'Plan', label: 'No work (including freelance) until you have new work authorization' },
    { id: 'backup', phase: 'Plan', label: 'Backup plan written down if the main path is not filed in time' },
    { id: 'insurance', phase: 'Money & life', label: 'Health insurance after the last day checked (COBRA or a private plan)' },
    { id: '401k', phase: 'Money & life', label: '401(k) and HSA options reviewed; do not cash out in a panic' },
    { id: 'lease', phase: 'Money & life', label: 'Lease, car loan and phone contract exit terms checked in case you need to leave' }
  ];

  function loadJSON(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }
  function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  function renderChecklist() {
    var state = loadJSON(STORAGE_CHECK, {});
    var box = document.getElementById('check-list');
    box.innerHTML = '';
    var lastPhase = null;
    ITEMS.forEach(function (item) {
      if (item.phase !== lastPhase) {
        var ph = document.createElement('div');
        ph.className = 'phase';
        ph.textContent = item.phase;
        box.appendChild(ph);
        lastPhase = item.phase;
      }
      var row = document.createElement('label');
      row.className = 'check-row';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!state[item.id];
      cb.addEventListener('change', function () {
        state[item.id] = cb.checked;
        saveJSON(STORAGE_CHECK, state);
        updateStatus(state);
      });
      var span = document.createElement('span');
      span.textContent = item.label;
      row.appendChild(cb);
      row.appendChild(span);
      box.appendChild(row);
    });
    updateStatus(state);
  }
  function updateStatus(state) {
    var done = ITEMS.filter(function (i) { return state[i.id]; }).length;
    document.getElementById('check-status').textContent = done + ' of ' + ITEMS.length + ' items ready on this device.';
  }

  function parseDate(v) { if (!v) return null; var d = new Date(v + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
  function addDays(date, days) { var d = new Date(date.getTime()); d.setDate(d.getDate() + days); return d; }
  function fmt(d) {
    if (!d) return '\u2014';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

  function calc() {
    var end = parseDate(document.getElementById('end-date').value);
    var i94 = parseDate(document.getElementById('i94-date').value);
    var used = document.getElementById('used-before').checked;
    var out = document.getElementById('calc-result');
    var detail = document.getElementById('calc-detail');
    if (!end) { out.textContent = 'Enter your employment end date first.'; detail.textContent = ''; return; }
    if (used) {
      out.textContent = 'No grace period may be left';
      detail.textContent = 'The rule allows the grace period once per authorized validity period. Speak to an immigration attorney today.';
      save(end, i94, used, '');
      return;
    }
    var sixty = addDays(end, 60);
    var last = sixty;
    var why = '60 consecutive days after your employment end date (' + fmt(end) + ').';
    if (i94 && i94 < sixty) {
      last = i94;
      why = 'Your I-94 / validity end date comes before day 60, so it is the limit.';
    }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var left = daysBetween(today, last);
    out.textContent = fmt(last);
    detail.textContent = why + ' ' + (left >= 0 ? left + ' day(s) left from today.' : 'This date has passed; speak to an attorney now.') +
      ' File any new petition or application before this date. DHS can shorten the period, and a proposed rule would remove it; check current status.';
    save(end, i94, used, fmt(last));
  }
  function save(end, i94, used, last) {
    saveJSON(STORAGE_CALC, { end: end ? fmt(end) : '', i94: i94 ? fmt(i94) : '', used: used, notes: document.getElementById('calc-notes').value || '', last: last });
  }
  function loadCalc() {
    var g = loadJSON(STORAGE_CALC, {});
    if (g.end) document.getElementById('end-date').value = g.end;
    if (g.i94) document.getElementById('i94-date').value = g.i94;
    if (g.used) document.getElementById('used-before').checked = true;
    if (g.notes) document.getElementById('calc-notes').value = g.notes;
    if (g.end) calc();
  }

  function exportSummary() {
    var state = loadJSON(STORAGE_CHECK, {});
    var g = loadJSON(STORAGE_CALC, {});
    var lines = ['Grace60 summary (not legal or immigration advice)', 'Generated locally ' + new Date().toISOString().slice(0, 10), '',
      'Employment end date: ' + (g.end || '\u2014'), 'I-94 / validity end: ' + (g.i94 || '\u2014'),
      'Latest possible grace-period day: ' + (g.last || '\u2014'), 'Notes: ' + (g.notes || '\u2014'), '', 'Checklist:'];
    var lastPhase = null;
    ITEMS.forEach(function (i) {
      if (i.phase !== lastPhase) { lines.push(''); lines.push('## ' + i.phase); lastPhase = i.phase; }
      lines.push((state[i.id] ? '[x] ' : '[ ] ') + i.label);
    });
    lines.push('', 'Source: 8 CFR 214.1(l)(2); USCIS options after termination. Confirm with an immigration attorney.');
    var text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        document.getElementById('check-status').textContent = 'Summary copied to clipboard.';
      }).catch(function () { window.prompt('Copy this summary:', text); });
    } else { window.prompt('Copy this summary:', text); }
  }

  document.getElementById('btn-calc').addEventListener('click', calc);
  document.getElementById('btn-clear-calc').addEventListener('click', function () {
    saveJSON(STORAGE_CALC, {});
    ['end-date', 'i94-date', 'calc-notes'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('used-before').checked = false;
    document.getElementById('calc-result').textContent = '\u2014';
    document.getElementById('calc-detail').textContent = '';
  });
  document.getElementById('btn-export').addEventListener('click', exportSummary);
  document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  document.getElementById('btn-reset-check').addEventListener('click', function () { saveJSON(STORAGE_CHECK, {}); renderChecklist(); });

  renderChecklist();
  loadCalc();
})();
