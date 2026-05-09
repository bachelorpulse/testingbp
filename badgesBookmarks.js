const BadgeSystem = (() => {
const STATS_KEY  = 'bp_stats';
const EARNED_KEY = 'bp_badges';
const BADGES = [
{ id:'mcq_1',     cat:'MCQ',      icon:'🌱', name:'First Step',       sub:'Complete your first quiz',          req: s => (s.totalMCQ||0) >= 1    },
{ id:'mcq_100',   cat:'MCQ',      icon:'📝', name:'First 100',        sub:'100 MCQs done',                     req: s => (s.totalMCQ||0) >= 100  },
{ id:'mcq_500',   cat:'MCQ',      icon:'✏️', name:'500 Club',         sub:'500 MCQs done',                     req: s => (s.totalMCQ||0) >= 500  },
{ id:'mcq_1k',    cat:'MCQ',      icon:'🎯', name:'1K Champ',         sub:'1,000 MCQs done',                   req: s => (s.totalMCQ||0) >= 1000 },
{ id:'mcq_5k',    cat:'MCQ',      icon:'🚀', name:'5K Legend',        sub:'5,000 MCQs done',                   req: s => (s.totalMCQ||0) >= 5000 },
{ id:'acc_50',    cat:'Accuracy', icon:'🎯', name:'Getting There',    sub:'Score 50%+ in any quiz',            req: s => (s.bestAccuracy||0) >= 50  },
{ id:'acc_80',    cat:'Accuracy', icon:'✅', name:'Sharpshooter',     sub:'Score 80%+ in any quiz',            req: s => (s.bestAccuracy||0) >= 80  },
{ id:'acc_90',    cat:'Accuracy', icon:'🎖️', name:'Excellence',       sub:'Score 90%+ in any quiz',            req: s => (s.bestAccuracy||0) >= 90  },
{ id:'acc_100',   cat:'Accuracy', icon:'🏆', name:'Perfect Score',    sub:'Score 100% in any quiz',            req: s => (s.bestAccuracy||0) >= 100 },
{ id:'acc80_5',   cat:'Accuracy', icon:'💫', name:'Consistent',       sub:'Score 80%+ in 5 quizzes',           req: s => (s.acc80Count||0) >= 5  },
{ id:'acc80_10',  cat:'Accuracy', icon:'🌠', name:'Sharp Mind',       sub:'Score 80%+ in 10 quizzes',          req: s => (s.acc80Count||0) >= 10 },
{ id:'acc90_5',   cat:'Accuracy', icon:'🔬', name:'Precision',        sub:'Score 90%+ in 5 quizzes',           req: s => (s.acc90Count||0) >= 5  },
{ id:'acc90_10',  cat:'Accuracy', icon:'🧠', name:'Mastermind',       sub:'Score 90%+ in 10 quizzes',          req: s => (s.acc90Count||0) >= 10 },
{ id:'acc100_5',  cat:'Accuracy', icon:'💎', name:'Diamond Brain',    sub:'Score 100% in 5 quizzes',           req: s => (s.acc100Count||0) >= 5 },
{ id:'str_1',     cat:'Streak',   icon:'✨', name:'Day One',          sub:'Study for 1 day',                   req: s => (s.bestStreak||0) >= 1  },
{ id:'str_3',     cat:'Streak',   icon:'🔥', name:'On Fire',          sub:'3-day streak',                      req: s => (s.bestStreak||0) >= 3  },
{ id:'str_7',     cat:'Streak',   icon:'⚡', name:'Week Warrior',     sub:'7-day streak',                      req: s => (s.bestStreak||0) >= 7  },
{ id:'str_14',    cat:'Streak',   icon:'🌟', name:'Fortnight Pro',    sub:'14-day streak',                     req: s => (s.bestStreak||0) >= 14 },
{ id:'str_30',    cat:'Streak',   icon:'💎', name:'Iron Scholar',     sub:'30-day streak',                     req: s => (s.bestStreak||0) >= 30 },
{ id:'bm_1',      cat:'Focus',    icon:'🔖', name:'Bookmarker',       sub:'Bookmark 1 question',               req: s => (s.totalBM||0) >= 1     },
{ id:'bm_10',     cat:'Focus',    icon:'📌', name:'Collector',        sub:'Bookmark 10 questions',             req: s => (s.totalBM||0) >= 10    },
{ id:'comeback',  cat:'Special',  icon:'💪', name:'Never Give Up',    sub:'Retake after scoring below 60%',    req: s => !!s.retakeAfterFail     },
{ id:'allsub',    cat:'Special',  icon:'🌍', name:'All-Rounder',      sub:'Practice all 3 subjects',           req: s => (s.subjectsDone||0) >= 3},
{ id:'yt_visit',  cat:'Special',  icon:'▶️', name:'Subscriber',       sub:'Visit BachelorPulse YouTube channel', req: s => !!s.ytVisited          },
{ id:'fbk_short', cat:'Special',  icon:'💬', name:'Voice Heard',      sub:'Fill the short feedback form',      req: s => !!s.fbkShortFilled      },
{ id:'fbk_long',  cat:'Special',  icon:'📋', name:'Super Reviewer',   sub:'Fill the detailed feedback form',   req: s => !!s.fbkLongFilled       },
];
function loadStats()  {
try {
  const d = JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  return Object.assign({ totalMCQ:0, bestAccuracy:0, bestStreak:0, currentStreak:0, totalBM:0, retakeAfterFail:false, subjectsDone:0, lastAccuracy:0, sessions:0, acc80Count:0, acc90Count:0, acc100Count:0, ytVisited:false, fbkShortFilled:false, fbkLongFilled:false }, d);
} catch(e) { return { totalMCQ:0, bestAccuracy:0, bestStreak:0, currentStreak:0, totalBM:0, retakeAfterFail:false, subjectsDone:0, lastAccuracy:0, sessions:0, acc80Count:0, acc90Count:0, acc100Count:0, ytVisited:false, fbkShortFilled:false, fbkLongFilled:false }; }
}
function loadEarned() {
try { return JSON.parse(localStorage.getItem(EARNED_KEY)) || {}; }
catch { return {}; }
}
function saveStats(s) {
try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch(e) {}
}
function saveEarned(e) { localStorage.setItem(EARNED_KEY, JSON.stringify(e)); }
function showToast(badge) {
const t = document.getElementById('badgeToast');
if (!t) return;
t.textContent = `${badge.icon} Badge Unlocked: ${badge.name}!`;
t.classList.add('show');
setTimeout(() => t.classList.remove('show'), 3200);
}
function checkBadges(stats, earned) {
let changed = false;
BADGES.forEach(b => {
if (!earned[b.id] && b.req(stats)) {
earned[b.id] = Date.now();
changed = true;
setTimeout(() => showToast(b), 400);
}
});
if (changed) {
saveEarned(earned);
updateChip();
renderBadgeGrid();
if (typeof window._bpSyncToCloud === 'function') {
  window._bpSyncToCloud();
}
}
}
function recordQuiz(totalQs, correctQs) {
if (!totalQs || totalQs < 1) return;
const accuracy = Math.round((correctQs / totalQs) * 100);
const stats  = loadStats();
const earned = loadEarned();
const lastAcc = stats.lastAccuracy || 0;
stats.totalMCQ     = (stats.totalMCQ    || 0) + totalQs;
stats.sessions     = (stats.sessions    || 0) + 1;
stats.lastAccuracy = accuracy;
if (accuracy > (stats.bestAccuracy || 0)) stats.bestAccuracy = accuracy;
if (accuracy >= 80)  stats.acc80Count  = (stats.acc80Count  || 0) + 1;
if (accuracy >= 90)  stats.acc90Count  = (stats.acc90Count  || 0) + 1;
if (accuracy >= 100) stats.acc100Count = (stats.acc100Count || 0) + 1;
if (lastAcc > 0 && lastAcc < 60) stats.retakeAfterFail = true;
try {
  const subs = new Set(JSON.parse(localStorage.getItem('bp_subjects_done') || '[]'));
  if (window.BPQuizState.selSubject) subs.add(window.BPQuizState.selSubject);
  localStorage.setItem('bp_subjects_done', JSON.stringify([...subs]));
  stats.subjectsDone = subs.size;
} catch(e) {}
try {
  const sd = JSON.parse(localStorage.getItem('bp_strike')) || {};
  const cur = Math.max(sd.high || 0, sd.current || 0);
  if (cur > (stats.bestStreak || 0)) stats.bestStreak = cur;
} catch(e) {}
try {
  stats.totalBM = (JSON.parse(localStorage.getItem('bp_bookmarks') || '[]')).length;
} catch(e) {}
saveStats(stats);
checkBadges(stats, earned);
}
function syncStreak() {
try {
const strData = JSON.parse(localStorage.getItem('bp_strike')) || {};
const cur  = strData.current || 0;
const best = strData.high    || 0;
const stats = loadStats();
let changed = false;
if (best > (stats.bestStreak || 0)) { stats.bestStreak = best; changed = true; }
if (cur  !== (stats.currentStreak || 0)) { stats.currentStreak = cur; changed = true; }
if (changed) { saveStats(stats); checkBadges(stats, loadEarned()); }
} catch(e) {}
}
function updateChip() {  }
function renderBadgeGrid() {
const grid = document.getElementById('badgeGrid');
const label = document.getElementById('badgeCountLabel');
if (!grid) return;
const earned = loadEarned();
const earnedCount = BADGES.filter(b => !!earned[b.id]).length;
if (label) label.textContent = `(${earnedCount}/${BADGES.length})`;
const frag = document.createDocumentFragment();
BADGES.forEach(b => {
const isUnlocked = !!earned[b.id];
const stats = loadStats();
// Build progress text for locked badges
function getBadgeProgress(b, s) {
  if (b.id==='mcq_1')    return s.totalMCQ>=1    ? null : `${s.totalMCQ||0}/1`;
  if (b.id==='mcq_100')  return s.totalMCQ>=100  ? null : `${s.totalMCQ||0}/100`;
  if (b.id==='mcq_500')  return s.totalMCQ>=500  ? null : `${s.totalMCQ||0}/500`;
  if (b.id==='mcq_1k')   return s.totalMCQ>=1000 ? null : `${s.totalMCQ||0}/1K`;
  if (b.id==='mcq_5k')   return s.totalMCQ>=5000 ? null : `${s.totalMCQ||0}/5K`;
  if (b.id==='acc_50')   return s.bestAccuracy>=50  ? null : `Best: ${s.bestAccuracy||0}%`;
  if (b.id==='acc_80')   return s.bestAccuracy>=80  ? null : `Best: ${s.bestAccuracy||0}%`;
  if (b.id==='acc_90')   return s.bestAccuracy>=90  ? null : `Best: ${s.bestAccuracy||0}%`;
  if (b.id==='acc_100')  return s.bestAccuracy>=100 ? null : `Best: ${s.bestAccuracy||0}%`;
  if (b.id==='acc80_5')  return s.acc80Count>=5  ? null : `${s.acc80Count||0}/5`;
  if (b.id==='acc80_10') return s.acc80Count>=10 ? null : `${s.acc80Count||0}/10`;
  if (b.id==='acc90_5')  return s.acc90Count>=5  ? null : `${s.acc90Count||0}/5`;
  if (b.id==='acc90_10') return s.acc90Count>=10 ? null : `${s.acc90Count||0}/10`;
  if (b.id==='acc100_5') return s.acc100Count>=5 ? null : `${s.acc100Count||0}/5`;
  if (b.id==='str_1')    return s.bestStreak>=1  ? null : `${s.currentStreak||0}/1 day`;
  if (b.id==='str_3')    return s.bestStreak>=3  ? null : `${s.currentStreak||0}/3 days`;
  if (b.id==='str_7')    return s.bestStreak>=7  ? null : `${s.currentStreak||0}/7 days`;
  if (b.id==='str_14')   return s.bestStreak>=14 ? null : `${s.currentStreak||0}/14 days`;
  if (b.id==='str_30')   return s.bestStreak>=30 ? null : `${s.currentStreak||0}/30 days`;
  if (b.id==='bm_1')     return s.totalBM>=1  ? null : `${s.totalBM||0}/1`;
  if (b.id==='bm_10')    return s.totalBM>=10 ? null : `${s.totalBM||0}/10`;
  return null;
}
const progress = getBadgeProgress(b, stats);
const progressHtml = (!isUnlocked && progress)
  ? `<span class="bdg-prog">${progress}</span>`
  : '';
const card = document.createElement('div');
card.className = 'bdg-card ' + (isUnlocked ? 'unlocked' : 'locked');
card.title = isUnlocked ? `${b.name}: ${b.sub}` : `Locked — ${b.sub}`;
card.innerHTML =
`<span class="bdg-icon">${isUnlocked ? b.icon : '🔒'}</span>` +
`<span class="bdg-name">${b.name}</span>` +
`<span class="bdg-sub">${b.sub}</span>` +
progressHtml;
frag.appendChild(card);
});
grid.innerHTML = '';
grid.appendChild(frag);
}
function onPanelOpen() {
renderBadgeGrid();
}
function init() {
updateChip();
syncStreak();
}
return { recordQuiz, syncStreak, onPanelOpen, init, _ls:loadStats, _ss:saveStats, _cb:(s)=>checkBadges(s,loadEarned()) };
})();
BadgeSystem.init();
const BookmarkSystem = (() => {
const BM_KEY = 'bp_bookmarks';
const MAX_BM = 200;
function load() { try { return JSON.parse(localStorage.getItem(BM_KEY)) || []; } catch { return []; } }
function save(arr) { try { localStorage.setItem(BM_KEY, JSON.stringify(arr.length > MAX_BM ? arr.slice(-MAX_BM) : arr)); } catch(e) {} }
function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function makeId(t) { let h=0; for(let i=0;i<t.length;i++) h=((h<<5)-h+t.charCodeAt(i))|0; return 'bm_'+Math.abs(h).toString(36); }
function _showToast(msg) {
const t = document.getElementById('bm-toast');
if (!t) return;
t.textContent = msg; t.classList.add('show');
clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}
function _updateHamCount() {
const el = document.getElementById('bmHamCount');
if (!el) return;
const n = load().length;
el.textContent = n; el.style.display = n > 0 ? 'inline' : 'none';
}
function toggle(idx) {
const q = window.BPQuizState.questions[idx];
const ua = (window.BPQuizState.userAnswers && window.BPQuizState.userAnswers[idx] !== undefined) ? window.BPQuizState.userAnswers[idx] : null;
const id = makeId(q.question);
const list = load();
const pos = list.findIndex(b => b.id === id);
if (pos !== -1) {
list.splice(pos, 1); save(list); _showToast('Bookmark removed');
} else {
const chapter = (window.BPQuizState.selChapter && window.BPQuizState.selChapter !== '__ALL__')
? window.BPQuizState.selChapter.replace(/^Chapter\s*\d+:\s*/i,'').slice(0,40)
: (window.BPQuizState.selSubject || '');
list.push({ id, question: q.question, options: q.options, correct: q.correct, userAnswer: ua, chapter, ts: Date.now() });
save(list); _showToast('🔖 Bookmarked!');
try{if(typeof BadgeSystem!=='undefined'){const _bs=BadgeSystem._ls();_bs.totalBM=load().length;BadgeSystem._ss(_bs);BadgeSystem._cb(_bs);}}catch(e){}
}
if (typeof window._bpSyncToCloud === 'function') window._bpSyncToCloud();
const qcard = document.getElementById('optCont')?.closest('.qcard') || document.querySelector('.qcard');
if (qcard) { const btn = qcard.querySelector('.bm-btn'); if (btn) { const saved = load().some(b=>b.id===id); btn.textContent = saved?'🔖 Bookmarked':'🔖 Bookmark'; btn.classList.toggle('saved',saved); } }
_updateHamCount();
}
function isSaved(q) { return load().some(b => b.id === makeId(q.question)); }
function updateAnswers() {
if (!window.BPQuizState.questions?.length) return;
const list = load(); let changed = false;
window.BPQuizState.questions.forEach((q,idx) => {
const pos = list.findIndex(b => b.id === makeId(q.question));
if (pos !== -1 && window.BPQuizState.userAnswers) { const ua = window.BPQuizState.userAnswers[idx]??null; if (list[pos].userAnswer !== ua) { list[pos].userAnswer = ua; changed = true; } }
});
if (changed) save(list);
}
function _renderList() {
const list = load();
const count = document.getElementById('bmCount');
const listEl = document.getElementById('bmList');
if (!listEl) return;
if (count) count.innerHTML = `<span>${list.length}</span> bookmark${list.length!==1?'s':''}`;
if (!list.length) { listEl.innerHTML = `<div class="bm-empty"><span class="big">🔖</span><p>No bookmarks yet.<br>Tap <strong>🔖 Bookmark</strong> on any question.</p></div>`; return; }
const frag = document.createDocumentFragment();
list.forEach(b => {
const isCorrect = b.userAnswer!==null && b.userAnswer===b.correct;
const isWrong   = b.userAnswer!==null && b.userAnswer!==b.correct;
const cardClass = isCorrect?'correct':isWrong?'wrong':'unanswered';
const tagClass  = isCorrect?'c':isWrong?'w':'';
const tagLabel  = isCorrect?'✅ Correct':isWrong?'❌ Wrong':'⬜ Skipped';
const yourPill  = b.userAnswer===null
? `<span class="bm-pill your-u">Not Answered</span>`
: `<span class="bm-pill ${isCorrect?'your-c':'your-w'}">${isCorrect?'✔':'✘'} ${window.BPQuizState.LABELS[b.userAnswer]||'?'}) ${_esc(b.options?.[b.userAnswer]||'')}</span>`;
const corrPill  = `<span class="bm-pill correct-ans">✔ ${window.BPQuizState.LABELS[b.correct]||'?'}) ${_esc(b.options?.[b.correct]||'')}</span>`;
const card = document.createElement('div');
card.className = `bm-card ${cardClass}`;
card.innerHTML = `<div class="bm-card-meta"><span class="bm-tag ${tagClass}">${tagLabel}</span>${b.chapter?`<span class="bm-tag">${_esc(b.chapter)}</span>`:''}</div><div class="bm-q-text">${_esc(b.question)}</div><div class="bm-ans-row">${yourPill}${corrPill}</div><div class="bm-actions"><button class="bm-action-btn remove">🗑️ Remove</button></div>`;
card.querySelector('.bm-action-btn.remove').addEventListener('click', () => {
save(load().filter(x=>x.id!==b.id)); _updateHamCount();
card.style.transition='opacity .18s'; card.style.opacity='0';
setTimeout(()=>_renderList(),200);
});
frag.appendChild(card);
});
listEl.innerHTML=''; listEl.appendChild(frag);
}
function open() {
const ov = document.getElementById('bm-overlay');
if (!ov) return;
ov.style.display='block'; requestAnimationFrame(()=>ov.classList.add('open'));
document.body.style.overflow='hidden'; _renderList(); _updateHamCount();
}
function close() {
const ov = document.getElementById('bm-overlay');
if (!ov) return;
ov.classList.remove('open');
setTimeout(()=>{ if(!ov.classList.contains('open')) ov.style.display=''; },320);
document.body.style.overflow='';
}
function _refreshUI() { _renderList(); _updateHamCount(); }
const ov = document.getElementById('bm-overlay');
if (ov) ov.addEventListener('click', e => { if(e.target===ov) close(); });
_updateHamCount();
return { toggle, isSaved, open, close, remove:(id)=>{save(load().filter(b=>b.id!==id));_updateHamCount();}, updateAnswers, _refreshUI };
})();

Object.assign(window, { BadgeSystem, BookmarkSystem });
