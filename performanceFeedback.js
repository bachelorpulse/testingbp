const PERF_KEY = 'bp_perf_sessions';

function loadPerf() {
  try {
    return JSON.parse(localStorage.getItem(PERF_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function savePerf(rows) {
  try {
    localStorage.setItem(PERF_KEY, JSON.stringify(rows.slice(-300)));
  } catch (_) {}
}

const PerfDash = (() => {
  function quizStart() {
    // Reserved hook; kept for compatibility.
  }

  function recordSession(attempted, correct, chapterKey) {
    const pct = attempted ? Math.round((correct / attempted) * 100) : 0;
    const rows = loadPerf();
    rows.push({
      ts: Date.now(),
      attempted: attempted || 0,
      correct: correct || 0,
      accuracy: pct,
      chapter: chapterKey || 'unknown'
    });
    savePerf(rows);
  }

  function open() {
    const ov = document.getElementById('pdOverlay');
    if (!ov) return;
    ov.classList.add('open');
    ov.style.display = 'block';
    document.body.style.overflow = 'hidden';
    renderOverview();
  }

  function close() {
    const ov = document.getElementById('pdOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    ov.style.display = '';
    document.body.style.overflow = '';
  }

  function tab(btn, name) {
    document.querySelectorAll('.pd-tab').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.pd-panel').forEach((el) => el.classList.remove('active'));
    btn?.classList.add('active');
    document.getElementById(`pd-panel-${name}`)?.classList.add('active');
  }

  function renderOverview() {
    const rows = loadPerf();
    const attempted = rows.reduce((a, r) => a + (r.attempted || 0), 0);
    const correct = rows.reduce((a, r) => a + (r.correct || 0), 0);
    const sessions = rows.length;
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const stat = document.getElementById('pdStatCards');
    if (stat) {
      stat.innerHTML =
        `<div class="pd-card"><strong>Sessions:</strong> ${sessions}</div>` +
        `<div class="pd-card"><strong>Attempted:</strong> ${attempted}</div>` +
        `<div class="pd-card"><strong>Correct:</strong> ${correct}</div>` +
        `<div class="pd-card"><strong>Accuracy:</strong> ${accuracy}%</div>`;
    }
    const consistency = document.getElementById('pdConsistency');
    if (consistency) consistency.innerHTML = `<strong>Consistency</strong><br/>Practice data auto-saves on this device.`;
    const timeCard = document.getElementById('pdTimeCard');
    if (timeCard) timeCard.innerHTML = `<strong>Latest Activity</strong><br/>${rows.length ? new Date(rows[rows.length - 1].ts).toLocaleString() : 'No data yet'}`;
    const graph = document.getElementById('pdOverviewGraph');
    if (graph) graph.innerHTML = `<strong>Overview</strong><br/>Detailed charts will appear as more attempts are recorded.`;
  }

  return { open, close, tab, quizStart, recordSession };
})();

const FeedbackSystem = (() => {
  function open() {
    document.getElementById('fbkOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('fbkOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function recordClick(type) {
    try {
      localStorage.setItem('bp_feedback_last', JSON.stringify({ type, ts: Date.now() }));
      if (window.BadgeSystem && typeof window.BadgeSystem._ls === 'function') {
        const s = window.BadgeSystem._ls();
        if (type === 'short') s.fbkShortFilled = true;
        if (type === 'long') s.fbkLongFilled = true;
        window.BadgeSystem._ss(s);
        window.BadgeSystem._cb(s);
      }
    } catch (_) {}
  }

  return { open, close, recordClick };
})();

Object.assign(window, { PerfDash, FeedbackSystem });
