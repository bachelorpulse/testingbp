/* inline block extracted from BP_clean-2.html */
(function(){
const DATA_VER = 'bp_dv_3'; // bump this string whenever you publish major content updates
if(!localStorage.getItem(DATA_VER)){
['bp_guide_done','bp_complete'].forEach(k=>localStorage.removeItem(k));
localStorage.setItem(DATA_VER,'1');
}
})();
// ────────────────────────────────────────────────────────────────────────────
const BASE_URL = (() => {
const h = window.location.hostname;
const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '';
return isLocal ? './data/' : 'https://bachelorpulse.in/';
})();
const SUBJECT_CODE = { science:'sci', math:'math', social:'sst' };
const TYPE_MAP = {
mcq      : { suffix:'mcq', ext:'json' },
solution : { suffix:'sol', ext:'pdf'  },
shortnote: { suffix:'sn',  ext:'pdf'  },
mindmap  : { suffix:'mm',  ext:'jpg'  }
};
function buildURL(classNum, subject, chapterStr, type) {
const sub = SUBJECT_CODE[subject];
const t   = TYPE_MAP[type];
if(!sub || !t) return null;
const chNum = String(chapterStr).match(/chapter\s*(\d+)/i)?.[1];
if(!chNum) return null;
const file = `${classNum}_${sub}_ch${chNum}_${t.suffix}.${t.ext}`.toLowerCase();
return `${BASE_URL}${file}`;
}
let selClass=null, selSubject=null, selChapter=null, selCount=null, selMode=null;
let selLearnType=null, urlViewerFrom=null;
let questions=[], userAnswers=[], currentIdx=0;
const subjectNames = { science:'Science 🔬', math:'Mathematics ➗', social:'Social Science 🌍' };
function getClassChapters(classNum){
const key = 'class' + classNum;
return (window.BPClassDataByClass && window.BPClassDataByClass[key]) ||
       (window.selectedClass === key && window.BPClassData) ||
       { science:[], math:[], social:[] };
}
const LABELS = ['A','B','C','D'];
const ALL_KEY = '__ALL__';
function showScreen(id){
const screens=document.querySelectorAll('.screen');
const el=document.getElementById('s-'+id);
requestAnimationFrame(()=>{
screens.forEach(s=>{s.classList.remove('active');s.classList.remove('animated');});
el.classList.add('active');
requestAnimationFrame(()=>{
el.classList.add('animated');
window.scrollTo({top:0,behavior:'smooth'});
});
});
}
function updateBreadcrumb(){
const bc=document.getElementById('breadcrumb');
let p=['<span onclick="goHome()" style="cursor:pointer;color:var(--accent)">🏠 Home</span>'];
if(selClass)   p.push(`<span class="sep">›</span><span onclick="if(selSubject||selChapter){selSubject=null;selChapter=null;selCount=null;selMode=null;selLearnType=null;updateBreadcrumb();showScreen('subject');}" style="cursor:${selSubject?'pointer':'default'};${selSubject?'color:var(--accent)':''}">Class ${selClass}</span>`);
if(selSubject) p.push(`<span class="sep">›</span><span onclick="if(selChapter){selChapter=null;selCount=null;selMode=null;selLearnType=null;buildChapterScreen();updateBreadcrumb();showScreen('chapter');}" style="cursor:${selChapter?'pointer':'default'};${selChapter?'color:var(--accent)':''}">${subjectNames[selSubject]}</span>`);
if(selChapter) p.push(`<span class="sep">›</span><span>${selChapter===ALL_KEY?'All Chapters':selChapter}</span>`);
if(selMode){
const modeLabel = selMode==='mcq'?'MCQ':selMode==='solution'?'Solution':'Learn';
p.push(`<span class="sep">›</span><span>${modeLabel}</span>`);
}
if(selLearnType) p.push(`<span class="sep">›</span><span>${selLearnType==='shortnote'?'Short Note':'Mind Map'}</span>`);
if(selCount)   p.push(`<span class="sep">›</span><span>${selCount} MCQ</span>`);
bc.innerHTML=p.join(' ');
}
function selectClass(c){
selClass=c; selSubject=null; selChapter=null; selCount=null; selMode=null; selLearnType=null;
document.getElementById('subjectTitle').textContent=`📘 Class ${c} — Select Subject`;
const ready = window.BPLoadClassData ? window.BPLoadClassData('class' + c) : Promise.resolve();
ready.finally(() => { updateBreadcrumb(); showScreen('subject'); });
}
function selectSubject(s){
selSubject=s; selChapter=null; selCount=null; selMode=null; selLearnType=null;
buildChapterScreen(); updateBreadcrumb(); showScreen('chapter');
}
function buildChapterScreen(){
const chapterList = getClassChapters(selClass)[selSubject];
document.getElementById('chapterTitle').textContent =
`📑 Class ${selClass} ${subjectNames[selSubject]} — Select Chapter`;
const subjectLabel = subjectNames[selSubject].replace(/[🔬➗🌍]/g,'').trim();
document.getElementById('pabSubText').textContent =
`Attempt every MCQ from all ${chapterList.length} chapters of ${subjectLabel} in one go!`;
const grid = document.getElementById('chapterGrid');
grid.innerHTML = '';
if(chapterList.length === 0){
grid.innerHTML = `<div class="empty-quiz"><div class="big">🚧</div>
<p>No chapters found for <strong>Class ${selClass} ${subjectNames[selSubject]}</strong>.</p></div>`;
return;
}
chapterList.forEach((ch, i) => {
const card = document.createElement('div');
card.className = 'chapter-card';
card.onclick = () => selectChapter(ch);
const numEl = document.createElement('div');
numEl.className = 'ch-num';
numEl.textContent = i + 1;
const info = document.createElement('div');
info.className = 'ch-info';
const displayName = ch.replace(/^Chapter\s*\d+:\s*/i, '');
info.innerHTML = `<div class="ch-name">${displayName}</div>
<div class="ch-count">${ch}</div>`;
card.appendChild(numEl);
card.appendChild(info);
grid.appendChild(card);
});
}
function selectChapter(ch){
selChapter = ch; selCount = null; selMode = null; selLearnType = null;
const label = ch.replace(/^Chapter\s*\d+:\s*/i, '');
document.getElementById('modeTitle').textContent = `⚡ ${label} — What do you want to do?`;
updateBreadcrumb(); showScreen('mode');
}
function practiceAllSubject(){
selChapter = ALL_KEY;
selMode    = 'mcq';
selCount   = null;
updateBreadcrumb();
const chapterList  = getClassChapters(selClass)[selSubject];
const subjectLabel = subjectNames[selSubject].replace(/[🔬➗🌍]/g,'').trim();
const urlsToFetch = chapterList
.map(ch => ({ ch, url: buildURL(selClass, selSubject, ch, 'mcq') }))
.filter(x => x.url);
const qs = document.getElementById('quizScreen');
if(urlsToFetch.length === 0){
qs.innerHTML = `<div class="coming-soon">
<div style="font-size:4rem;margin-bottom:16px">🚀</div>
<h2 style="font-size:1.6rem">Coming Soon!</h2>
<p style="color:var(--muted);margin-top:10px;font-size:.9rem">
MCQ files not available yet for <strong>${subjectLabel}</strong>.
</p>
<br>
<button class="qbtn qbtn-sec" onclick="goBack('chapter')" style="margin:auto;display:flex">← Go Back</button>
</div>`;
showScreen('quiz');
return;
}
qs.innerHTML = LOADING_HTML;
showScreen('quiz');
Promise.all(
urlsToFetch.map(({ ch, url }) => {
const chTag = ch.replace(/^Chapter\s*\d+:\s*/i,'');
const cached = mcqCacheGet(url);
if(cached) return Promise.resolve(cached.map(q => ({...q, _chapter:chTag})));
return fetch(url)
.then(r => r.ok ? r.json() : [])
.then(data => {
if(!Array.isArray(data)) return [];
const norm = normalizeMCQ(data);
mcqCacheSet(url, norm);
return norm.map(q => ({...q, _chapter:chTag}));
})
.catch(() => []);
})
).then(allArrays => {
const merged = allArrays.flat().sort(() => Math.random() - 0.5);
if(merged.length === 0){
qs.innerHTML = `<div class="url-error">
<div class="big">⚠️</div>
<p>Could not load questions. Check your network and try again.</p>
<br>
<button class="qbtn qbtn-sec" onclick="goBack('chapter')" style="margin:auto;display:flex;">← Go Back</button>
</div>`;
return;
}
selCount = merged.length;
startPollMode(merged);
});
}
function selectMode(mode){
selMode = mode;
updateBreadcrumb();
if(mode === 'mcq'){
const label = selChapter.replace(/^Chapter\s*\d+:\s*/i, '');
document.getElementById('countTitle').textContent = `🎯 ${label} — How Many Questions?`;
showScreen('count');
} else if(mode === 'solution'){
fetchChapterContent('solution');
} else if(mode === 'learn'){
const label = selChapter.replace(/^Chapter\s*\d+:\s*/i, '');
document.getElementById('learnTitle').textContent = `📖 ${label} — Choose Learning Style`;
showScreen('learn');
}
}
function selectLearn(type){
selLearnType = type;
updateBreadcrumb();
fetchChapterContent(type);
}
function selectCount(n){
selCount = n;
updateBreadcrumb();
fetchChapterContent('mcq');
}
function fetchChapterContent(type){
const chapterLabel = selChapter.replace(/^Chapter\s*\d+:\s*/i, '');
const url = buildURL(selClass, selSubject, selChapter, type);
if(!url){ showComingSoon(type, chapterLabel); return; }
if(type === 'mcq'){
fetchMCQFromURL(url, selCount);
} else if(type === 'solution'){
openUrlViewer(url, '✅ Solutions', 'mode', chapterLabel);
} else if(type === 'shortnote'){
openUrlViewer(url, '📋 Short Notes', 'learn', chapterLabel);
} else if(type === 'mindmap'){
openUrlViewer(url, '🧠 Mind Map', 'learn', chapterLabel);
}
}
function showComingSoon(type, chapterLabel){
const html = `<div class="coming-soon">
<div class="big" style="font-size:5rem;margin-bottom:18px">🚀</div>
<h2 style="font-size:2rem;letter-spacing:.02em">Coming Soon</h2>
<p style="font-size:.95rem;margin-top:10px;color:var(--muted)">We're working hard to bring this to you!</p>
</div>`;
if(type === 'mcq'){
const qs = document.getElementById('quizScreen');
qs.innerHTML = html + `<div style="text-align:center;margin-top:8px"><button class="qbtn qbtn-sec" onclick="goBack('count')" style="margin:auto;display:inline-flex">← Go Back</button></div>`;
showScreen('quiz');
} else {
urlViewerFrom = (type === 'solution') ? 'mode' : 'learn';
document.getElementById('urlViewerContainer').innerHTML = html;
showScreen('urlviewer');
}
}
const LOADING_HTML = `<div class="bp-loading">
<div class="bp-loading-dots"><span></span><span></span><span></span></div>
<div class="bp-loading-text">Loading questions...</div>
<div class="bp-loading-sub">Just a moment! ⚡</div>
</div>`;
const _mcqMemCache = {};
function mcqCacheKey(url){ return btoa(url).replace(/=/g,''); }
function mcqCacheGet(url){
  return _mcqMemCache[mcqCacheKey(url)] || null;
}
function mcqCacheSet(url, data){
  _mcqMemCache[mcqCacheKey(url)] = data;
}
function normalizeMCQ(data){
return data.map(item => ({
question: item.question || item.q  || '',
options : item.options  || item.o  || [],
correct : item.correct  !== undefined ? item.correct
: item.a        !== undefined ? item.a : 0,
sol     : item.sol || item.solution || ''
}));
}
async function fetchMCQFromURL(url, count){
const qs = document.getElementById('quizScreen');
qs.innerHTML = LOADING_HTML;
showScreen('quiz');
const cached = mcqCacheGet(url);
if(cached){
const pool = [...cached].sort(() => Math.random() - 0.5);
startInlineQuiz(pool.slice(0, Math.min(count, pool.length)));
return;
}
try {
const res = await fetch(url);
if(res.status === 404){ showComingSoon('mcq', ''); return; }
if(!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
if(!Array.isArray(data) || data.length === 0)
throw new Error('Empty or invalid JSON');
const normalized = normalizeMCQ(data);
mcqCacheSet(url, normalized);
const pool = [...normalized].sort(() => Math.random() - 0.5);
startInlineQuiz(pool.slice(0, Math.min(count, pool.length)));
} catch(err) {
qs.innerHTML = `<div class="url-error">
<div class="big">⚠️</div>
<p>Could not load data. Please retry.<br>
<small style="color:var(--muted)">${err.message}</small></p>
<br>
<button class="qbtn qbtn-pri" onclick="fetchChapterContent('mcq')" style="margin:auto;display:flex">🔄 Retry</button>
<br>
<button class="qbtn qbtn-sec" onclick="goBack('count')" style="margin:auto;display:flex">← Go Back</button>
</div>`;
}
}
const GDRIVE_PLACEHOLDER = 'https://drive.google.com/uc?export=download&id=YOUR_FILE_ID_HERE';
function urlViewerBack(){
if(urlViewerFrom === 'mode') goBack('mode');
else if(urlViewerFrom === 'learn') goBack('learn');
else goBack('mode');
}
function goBack(to){
if(to==='class')  {selClass=null;selSubject=null;selChapter=null;selCount=null;selMode=null;selLearnType=null;updateBreadcrumb();showScreen('class');}
if(to==='subject'){selSubject=null;selChapter=null;selCount=null;selMode=null;selLearnType=null;updateBreadcrumb();showScreen('subject');}
if(to==='chapter'){selChapter=null;selCount=null;selMode=null;selLearnType=null;updateBreadcrumb();showScreen('chapter');}
if(to==='mode')   {selCount=null;selMode=null;selLearnType=null;updateBreadcrumb();showScreen('mode');}
if(to==='learn')  {selLearnType=null;updateBreadcrumb();showScreen('learn');}
if(to==='count')  {selCount=null;updateBreadcrumb();showScreen('count');}
}
function goHome(){selClass=null;selSubject=null;selChapter=null;selCount=null;selMode=null;selLearnType=null;updateBreadcrumb();showScreen('class');
}
let pollIdx = 0; // current question index in poll mode
function startPollMode(pool){
questions   = pool;
userAnswers = new Array(questions.length).fill(null);
pollIdx     = 0;
StrikeManager.updateStrike();
if(typeof PerfDash !== 'undefined') PerfDash.quizStart();
showScreen('quiz');
pollRender(pollIdx);
}
function pollRender(idx){
const q     = questions[idx];
const total = questions.length;
const label = selChapter === ALL_KEY ? 'All Chapters' : selChapter.replace(/^Chapter\s*\d+:\s*/i,'');
const attempted = userAnswers.filter(a => a !== null).length;
const pct = Math.round(attempted / total * 100);
let scoreC = 0, scoreW = 0;
userAnswers.forEach((a,i) => {
if(a === null) return;
if(a === questions[i].correct) scoreC++; else scoreW++;
});
const alreadyAns = userAnswers[idx] !== null;
const chosen     = userAnswers[idx];
const correct    = q.correct;
const optsHtml = q.options.map((opt, oi) => {
let cls = 'poll-opt';
let barW = '0%', iconHtml = '';
if(alreadyAns){
cls += ' locked';
if(oi === correct)            { cls += ' opt-correct'; barW = '100%'; iconHtml = '✅'; }
else if(oi === chosen)        { cls += ' opt-wrong';   barW = '55%';  iconHtml = '❌'; }
else                          { cls += ' opt-neutral'; }
if(oi === chosen) cls += ' opt-chosen';
}
return `<div class="${cls}" onclick="pollAnswer(${idx},${oi})">
<div class="poll-opt-bar" style="width:${barW}"></div>
<div class="poll-opt-lbl">${LABELS[oi]}</div>
<div class="poll-opt-content">
<span class="poll-opt-txt">${opt}</span>
</div>
<span class="poll-opt-icon">${iconHtml}</span>
</div>`;
}).join('');
let fbHtml = '';
if(alreadyAns){
const isRight = chosen === correct;
fbHtml = isRight
? `<div class="poll-feedback show fb-correct">🎉 Correct! Well done!</div>`
: `<div class="poll-feedback show fb-wrong">❌ Oops! Correct answer: ${LABELS[correct]}) ${q.options[correct]}</div>`;
}
const hasSol = (q.sol || '').toString().trim().length > 0;
const explHtml = (alreadyAns && hasSol)
? `<button class="poll-expl-btn show" id="poll-expl-btn" onclick="pollToggleExpl()">💡 View Explanation</button>
<div class="poll-expl-box" id="poll-expl-box">
<div class="poll-expl-label">📖 Explanation</div>
<div class="poll-expl-text">${q.sol}</div>
</div>`
: '';
const isBm = typeof BookmarkSystem !== 'undefined' && BookmarkSystem.isSaved(q);
const bmCls = isBm ? 'poll-bm-btn saved' : 'poll-bm-btn';
const bmTxt = isBm ? '🔖 Bookmarked' : '🔖 Bookmark';
const cardCls = alreadyAns
? (chosen === correct ? 'poll-qcard answered-correct' : 'poll-qcard answered-wrong')
: 'poll-qcard';
const isLast = idx === total - 1;
const nextBtnHtml = isLast
? `<button class="poll-done-btn" onclick="pollFinish()">🏁 Done — See Results</button>`
: `<button class="poll-next-btn" id="pollNextBtn" onclick="pollNext()">Next →</button>`;
document.getElementById('quizScreen').innerHTML = `
<div class="poll-shell">
<div class="poll-topbar">
<div class="poll-topbar-left">
<div class="poll-topbar-label">⚡ ${label}</div>
<div class="poll-progress" style="width:100%;max-width:none">
<div class="poll-progress-fill" style="width:${pct}%"></div>
</div>
</div>
<div class="poll-score-live">
<span class="poll-sc poll-sc-c">✅ ${scoreC}</span>
<span class="poll-sc poll-sc-w">❌ ${scoreW}</span>
</div>
</div>
<div class="${cardCls}" id="pollCard">
<div class="poll-q-meta">
<span class="poll-q-num">Q${idx+1} / ${total}</span>
<button class="${bmCls}" id="pollBmBtn" onclick="pollToggleBm()">${bmTxt}</button>
</div>
<div class="poll-q-text">${q.question}</div>
<div class="poll-options">${optsHtml}</div>
${fbHtml}
${explHtml}
</div>
<div class="poll-nav">
<div class="poll-nav-left">
<button class="poll-skip-btn" onclick="goHome()" title="Home" style="padding:9px 12px;">🏠</button>
<button class="poll-skip-btn" onclick="pollSkip()">Skip ⏭</button>
</div>
${nextBtnHtml}
</div>
</div>`;
window.scrollTo({top:0,behavior:'smooth'});
}
function pollAnswer(idx, oi){
if(userAnswers[idx] !== null) return; // already answered
userAnswers[idx] = oi;
pollRender(idx); // re-render same card with feedback
}
function pollNext(){
if(pollIdx < questions.length - 1){
pollIdx++;
pollRender(pollIdx);
}
}
function pollSkip(){
if(pollIdx < questions.length - 1){
pollIdx++;
pollRender(pollIdx);
} else {
pollFinish();
}
}
function pollToggleExpl(){
const box = document.getElementById('poll-expl-box');
const btn = document.getElementById('poll-expl-btn');
if(!box) return;
const open = box.classList.toggle('open');
if(btn) btn.textContent = open ? '🔼 Hide Explanation' : '💡 View Explanation';
}
function pollToggleBm(){
if(typeof BookmarkSystem === 'undefined') return;
BookmarkSystem.toggle(pollIdx);
const isBm = BookmarkSystem.isSaved(questions[pollIdx]);
const btn = document.getElementById('pollBmBtn');
if(btn){
btn.textContent = isBm ? '🔖 Bookmarked' : '🔖 Bookmark';
btn.className = isBm ? 'poll-bm-btn saved' : 'poll-bm-btn';
}
}
function pollFinish(){
const attempted = userAnswers.filter(a => a !== null).length;
if(attempted === 0){
alert('No questions attempted yet! Please answer at least one question. 😊');
return;
}
const trimmedQ = [];
const trimmedA = [];
questions.forEach((q, i) => {
if(userAnswers[i] !== null){
trimmedQ.push(q);
trimmedA.push(userAnswers[i]);
}
});
questions   = trimmedQ;
userAnswers = trimmedA;
showResults();
}
function pollShowResults(){ pollFinish(); }
function startInlineQuiz(pool){
questions = pool.slice(0, Math.min(selCount || pool.length, pool.length));
userAnswers = new Array(questions.length).fill(null);
currentIdx = 0;
StrikeManager.updateStrike(); // 🔥 Student started a quiz — credit activity
if (typeof PerfDash !== 'undefined') PerfDash.quizStart();
const label = selChapter === ALL_KEY ? 'All Chapters' : selChapter.replace(/^Chapter\s*\d+:\s*/i,'');
document.getElementById('quizScreen').innerHTML = `
<div class="quiz-header-row">
<div class="quiz-info" id="quizInfoLabel">Class ${selClass} › ${subjectNames[selSubject]} › ${label} › ${questions.length} MCQ</div>
<div class="progress-wrap">
<div class="progress-meta"><span id="progressText">0 answered</span><span id="progressPct">0%</span></div>
<div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
</div>
</div>
<div class="grid-wrap"><div class="grid-title">Questions Navigator</div><div class="q-grid" id="qGrid"></div></div>
<div class="qcard"><div class="q-num" id="qNum"></div><div class="q-text" id="qText"></div><div class="options" id="optCont"></div></div>
<div class="nav-row">
<div class="grp">
<button class="qbtn qbtn-sec" onclick="goHome()" title="Go to Home" style="padding:9px 13px;font-size:.82rem;">🏠</button>
<button class="qbtn qbtn-sec" id="prevBtn" onclick="prevQ()">← Prev</button>
</div>
<div class="grp">
<button class="qbtn qbtn-pri" id="nextBtn" onclick="nextQ()">Next →</button>
<button class="qbtn qbtn-sub" onclick="submitQuiz()">✅ Submit</button>
</div>
</div>`;
initGrid(); renderQ(0); updateProgress(); showScreen('quiz');
}
function renderQ(idx){
const q = questions[idx];
document.getElementById('qNum').textContent = `Question ${idx+1} of ${questions.length}`;
document.getElementById('qText').textContent = q.question;
const oc = document.getElementById('optCont'); oc.innerHTML='';
q.options.forEach((opt, i) => {
const d = document.createElement('div');
d.className = 'opt' + (userAnswers[idx]===i ? ' selected' : '');
d.innerHTML = `<span class="opt-lbl">${LABELS[i]}</span><span class="opt-txt">${opt}</span>`;
d.onclick = () => { userAnswers[idx]=i; renderQ(idx); updateProgress(); updateGrid(); };
oc.appendChild(d);
});
const pb = document.getElementById('prevBtn'), nb = document.getElementById('nextBtn');
if(pb) pb.disabled = idx===0;
if(nb) nb.disabled = idx===questions.length-1;
const qcard = document.querySelector('.qcard');
if (qcard) {
let bmBtn = qcard.querySelector('.bm-btn');
if (!bmBtn) {
bmBtn = document.createElement('button');
bmBtn.className = 'bm-btn';
qcard.appendChild(bmBtn);
}
const isSaved = typeof BookmarkSystem !== 'undefined' && BookmarkSystem.isSaved(q);
bmBtn.textContent = isSaved ? '🔖 Bookmarked' : '🔖 Bookmark';
bmBtn.classList.toggle('saved', isSaved);
bmBtn.onclick = (e) => {
e.stopPropagation();
if (typeof BookmarkSystem !== 'undefined') BookmarkSystem.toggle(idx);
};
let rptBtn = qcard.querySelector('.rpt-btn');
if (!rptBtn) {
rptBtn = document.createElement('button');
rptBtn.className = 'rpt-btn';
rptBtn.title = 'See a mistake in this question? Click to report it!';
qcard.appendChild(rptBtn);
}
const rptKey = 'bp_rpt_' + idx;
const alreadyReported = sessionStorage.getItem(rptKey);
rptBtn.textContent = alreadyReported ? '✓ Error Reported' : '⚠️ Question has an error?';
rptBtn.classList.toggle('reported', !!alreadyReported);
rptBtn.onclick = (e) => {
e.stopPropagation();
if (rptBtn.classList.contains('reported')) return;
var fabEvt = new MouseEvent('click', {bubbles:true});
document.getElementById('rprtFab').dispatchEvent(fabEvt);
sessionStorage.setItem(rptKey, '1');
rptBtn.textContent = '✓ Error Reported';
rptBtn.classList.add('reported');
};
}
}
function updateProgress(){
const ans = userAnswers.filter(a=>a!==null).length;
const pct = Math.round(ans/questions.length*100);
const pt=document.getElementById('progressText'),pp=document.getElementById('progressPct'),pf=document.getElementById('progressFill');
if(pt) pt.textContent = `${ans} / ${questions.length} answered`;
if(pp) pp.textContent = pct+'%';
if(pf) pf.style.width = pct+'%';
}
function initGrid(){
const grid = document.getElementById('qGrid'); grid.innerHTML='';
for(let i=0;i<questions.length;i++){
const b = document.createElement('button');
b.className='gi gi-skip'; b.textContent=i+1; b.dataset.i=i;
b.onclick=()=>{currentIdx=i;renderQ(i);updateGrid();};
grid.appendChild(b);
}
updateGrid();
}
function updateGrid(){
document.querySelectorAll('.gi').forEach(b => {
const i = parseInt(b.dataset.i);
b.classList.remove('gi-cur','gi-ans','gi-skip');
if(i===currentIdx) b.classList.add('gi-cur');
else if(userAnswers[i]!==null) b.classList.add('gi-ans');
else b.classList.add('gi-skip');
});
}
function prevQ(){if(currentIdx>0){currentIdx--;renderQ(currentIdx);updateGrid();}}
function nextQ(){if(currentIdx<questions.length-1){currentIdx++;renderQ(currentIdx);updateGrid();}}
function submitQuiz(){
const u = userAnswers.filter(a=>a===null).length;
const msg = u>0 ? `You have left ${u} question(s) unanswered. Submit anyway?` : 'Submit the quiz?';
if(!confirm(msg)) return;
showResults();
}
function showResults(){
let correct=0, wrong=0, unanswered=0;
userAnswers.forEach((a,i)=>{
if(a===null) unanswered++;
else if(a===questions[i].correct) correct++;
else wrong++;
});
const pct = Math.round(correct/questions.length*100);
let trophy='💪', msg='Keep Trying!', heroClass='', trophyClass='', extraHtml='';
if(pct===100){
trophy='🏆'; msg='🔥 PERFECT SCORE!';
heroClass='ultra'; trophyClass='ultra-bounce';
extraHtml=`<div class="ultra-stars"><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span></div><span class="ultra-label">🎊 Ultra Pro Max — 100% Legend! 🎊</span>`;
setTimeout(()=>{ fireConfetti(); fireConfetti(); setTimeout(fireConfetti,400); },100);
} else if(pct>90){
trophy='🏆'; msg='🎉 Outstanding!';
heroClass='great'; trophyClass='bounce';
extraHtml=`<span class="ultra-label">🌟 Amazing! You're in the top tier!</span>`;
setTimeout(()=>fireConfetti(),100);
} else if(pct>=80){trophy='🏆';msg='🎉 Excellent!';}
else if(pct>=60){trophy='✨';msg='👍 Well Done!';}
else if(pct>=40){trophy='📚';msg='📖 Keep Learning!';}
let dh = '';
questions.forEach((q,i)=>{
const a=userAnswers[i],isC=a===q.correct,isU=a===null;
const solText = (q.sol || '').toString().trim();
const solBtn = solText ? `<button class="sol-toggle-btn" onclick="toggleSol(this)" aria-expanded="false">💡 View Explanation</button>` : '';
const solBox = solText ? `<div class="sol-box"><div class="sol-label">📖 Solution</div><div class="sol-text">${solText}</div></div>` : '';
dh+=`<div class="res-item">
<div class="res-q-row"><span class="res-q-num">Q${i+1}</span><span class="res-mark">${isC?'✅ +1':'❌ 0'}</span>${sessionStorage.getItem('bp_rpt_'+i)?'<span style="font-size:.72rem;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);color:#6ee7b7;border-radius:12px;padding:2px 9px;font-weight:700;flex-shrink:0;">✓ Reported</span>':''}</div>
<div class="res-q-text">${q.question}</div>
<div class="ans-row">
${isU?`<span class="pill pill-u">Not Answered</span>`:
isC?`<span class="pill pill-c">✔ ${LABELS[a]}) ${q.options[a]}</span>`:
`<span class="pill pill-w">✘ ${LABELS[a]}) ${q.options[a]}</span>`}
<span class="pill pill-ans">Correct: ${LABELS[q.correct]}) ${q.options[q.correct]}</span>
${solBtn}
</div>${solBox}</div>`;
});
const _displayUname = (typeof _uname !== 'undefined' && _uname) ? _uname : null;
const _userBannerHtml = _displayUname
? `<div class="result-user-banner">
<div class="result-user-avatar">${_displayUname[0].toUpperCase()}</div>
<div class="result-user-name">@${_displayUname}</div>
</div>`
: '';
const _chapterLabel = selChapter && selChapter !== '__ALL__'
? selChapter.replace(/^Chapter\s*\d+:\s*/i,'')
: (selSubject ? subjectNames[selSubject].replace(/[🔬➗🌍]/g,'').trim() : 'Quiz');
document.getElementById('quizScreen').innerHTML = `
<div class="result-wrap">
${_userBannerHtml}
<div class="result-hero ${heroClass}" id="bpResultHero">
<div class="result-trophy ${trophyClass}">${trophy}</div>
<div class="result-msg">${msg}</div>
${extraHtml}
<div class="result-score">Score: ${correct} / ${questions.length}</div>
<div class="result-percent">Percentage: ${pct}%</div>
<div class="badges">
<span class="badge badge-c">✅ Correct: ${correct}</span>
<span class="badge badge-w">❌ Wrong: ${wrong}</span>
<span class="badge badge-u">⬜ Skipped: ${unanswered}</span>
</div>
</div>
<div class="bp-share-score-badge">
<div class="bp-score-badge-top">
<span class="bp-score-badge-label">🏆 Your Score</span>
<span class="bp-score-badge-value">${correct} / ${questions.length} &nbsp;•&nbsp; ${pct}%</span>
</div>
<button class="share-score-btn bp-share-hero-btn" id="bpShareBtn" onclick="shareScore(${correct},${questions.length},${pct},'${_chapterLabel.replace(/'/g,"\\'")}','${_displayUname || ''}')">📤 Share My Score</button>
</div>
<div class="res-list-wrap">
<div class="res-list-title">📋 Detailed Review</div>
<div>${dh}</div>
</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px;">
<button class="qbtn qbtn-rst" onclick="fetchChapterContent('mcq')">🔄 Try Again</button>
<button class="qbtn qbtn-sec" onclick="goHome()">🏠 Go Home</button>
</div>
</div>`;
window.scrollTo({top:0,behavior:'smooth'});
StrikeManager.recordActivity(); // 🔥 Quiz completed → update strike
const _attempted = userAnswers.filter(a => a !== null).length;
BadgeSystem.recordQuiz(_attempted, correct);
if (typeof BookmarkSystem !== 'undefined') BookmarkSystem.updateAnswers();
if (typeof PerfDash !== 'undefined') {
const chKey = (selChapter && selChapter !== '__ALL__')
? selChapter.replace(/^Chapter\s*\d+:\s*/i,'').slice(0,30)
: (selSubject ? selSubject : 'General');
PerfDash.recordSession(_attempted, correct, chKey);
}
if (typeof window._bpSyncToCloud === 'function') {
  window._bpSyncToCloud();
}
}
function toggleSol(btn){
const box = btn.closest('.ans-row').nextElementSibling;
if(!box || !box.classList.contains('sol-box')) return;
const open = box.classList.toggle('open');
btn.textContent = open ? '🔼 Hide Explanation' : '💡 View Explanation';
btn.setAttribute('aria-expanded', open);
}
function _showShareToast(msg) {
  const t = document.getElementById('bpShareToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
function _buildShareCard(correct, total, pct, chapterLabel, uname) {
  const medal = pct === 100 ? '🏆' : pct >= 80 ? '🏆' : pct >= 60 ? '✨' : '📚';
  const grade = pct === 100 ? 'PERFECT SCORE!' : pct >= 90 ? 'Outstanding!' : pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Well Done!' : 'Keep Going!';
  const barW  = Math.max(4, pct);
  const unameHtml = uname
    ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:900;color:#fff;flex-shrink:0;">${uname[0].toUpperCase()}</div>
<span style="font-family:Arial,sans-serif;font-size:.88rem;font-weight:700;color:#93c5fd;">@${uname}</span>
</div>`
    : '';
  return `
    <div style="background:linear-gradient(145deg,#0f1724,#1a2538);border-radius:24px;padding:36px 32px 28px;width:480px;font-family:Arial,sans-serif;box-sizing:border-box;overflow:hidden;position:relative;">
<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#f59e0b,#7c3aed,#3b82f6);border-radius:24px 24px 0 0;"></div>
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
<div style="font-size:.88rem;font-weight:800;color:#f59e0b;letter-spacing:.05em;">BachelorPulse</div>
<div style="font-size:.7rem;color:#64748b;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:3px 11px;">bachelorpulse.in</div>
</div>
      ${unameHtml}
      <div style="text-align:center;margin-bottom:18px;">
<div style="font-size:3.5rem;line-height:1;margin-bottom:8px;">${medal}</div>
<div style="font-size:1.45rem;font-weight:900;color:#f59e0b;letter-spacing:.01em;">${grade}</div>
<div style="font-size:.82rem;color:#64748b;margin-top:4px;">${chapterLabel}</div>
</div>
<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px 20px;text-align:center;margin-bottom:14px;">
<div style="font-size:3rem;font-weight:900;color:#e8edf5;line-height:1;">${correct}<span style="font-size:1.4rem;color:#64748b;font-weight:700;">/${total}</span></div>
<div style="font-size:.78rem;color:#93a8c0;margin-top:4px;text-transform:uppercase;letter-spacing:.06em;">Questions Correct</div>
</div>
<div style="margin-bottom:14px;">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
<span style="font-size:.72rem;color:#93a8c0;font-weight:700;">Accuracy</span>
<span style="font-size:.85rem;font-weight:900;color:${pct>=80?'#10b981':pct>=60?'#f59e0b':'#ef4444'};">${pct}%</span>
</div>
<div style="height:10px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden;">
<div style="height:100%;width:${barW}%;background:${pct>=80?'linear-gradient(90deg,#10b981,#059669)':pct>=60?'linear-gradient(90deg,#f59e0b,#d97706)':'linear-gradient(90deg,#ef4444,#dc2626)'};border-radius:999px;"></div>
</div>
</div>
<div style="display:flex;gap:8px;margin-bottom:20px;">
<div style="flex:1;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:12px;padding:10px;text-align:center;">
<div style="font-size:1.2rem;font-weight:900;color:#10b981;">${correct}</div>
<div style="font-size:.65rem;color:#6ee7b7;text-transform:uppercase;letter-spacing:.05em;">Correct</div>
</div>
<div style="flex:1;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:12px;padding:10px;text-align:center;">
<div style="font-size:1.2rem;font-weight:900;color:#ef4444;">${total-correct}</div>
<div style="font-size:.65rem;color:#fca5a5;text-transform:uppercase;letter-spacing:.05em;">Wrong</div>
</div>
<div style="flex:1;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:12px;padding:10px;text-align:center;">
<div style="font-size:1.2rem;font-weight:900;color:#f59e0b;">${total}</div>
<div style="font-size:.65rem;color:#fcd34d;text-transform:uppercase;letter-spacing:.05em;">Total</div>
</div>
</div>
<div style="background:linear-gradient(135deg,rgba(245,158,11,.12),rgba(59,130,246,.1));border:1.5px solid rgba(245,158,11,.35);border-radius:14px;padding:13px 16px;text-align:center;">
<div style="font-size:.82rem;font-weight:700;color:#fbbf24;margin-bottom:2px;">🚀 Practice Free NCERT MCQs</div>
<div style="font-size:.72rem;color:#93a8c0;">bachelorpulse.in — No login · No fees</div>
</div>
</div>`;
}
async function shareScore(correct, total, pct, chapterLabel, uname) {
  const btn = document.getElementById('bpShareBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Preparing…'; }
  // Build the off-screen card HTML
  const card = document.getElementById('bp-share-card');
  if (!card) { if (btn) { btn.disabled = false; btn.innerHTML = '📤 Share My Score'; } return; }
  card.innerHTML = _buildShareCard(correct, total, pct, chapterLabel, uname);
  card.style.display = 'block';
  try {
    // Load html2canvas if not already loaded
    if (typeof html2canvas === 'undefined') {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const canvas = await html2canvas(card.firstElementChild, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    card.style.display = 'none';
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png', 1));
    const fileName = 'bachelorpulse_score.png';
    // Try Web Share API (mobile-friendly)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
      const file = new File([blob], fileName, { type: 'image/png' });
      await navigator.share({
        title: `I scored ${pct}% on ${chapterLabel} — BachelorPulse`,
        text: `🎯 I just scored ${correct}/${total} (${pct}%) on "${chapterLabel}" MCQs!\nPractice free NCERT MCQs at bachelorpulse.in 🚀`,
        files: [file],
      });
      _showShareToast('✅ Shared successfully!');
    } else {
      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 2000);
      _showShareToast('📥 Score card saved! Share it with your friends.');
    }
  } catch (err) {
    card.style.display = 'none';
    if (err && err.name !== 'AbortError') {
      _showShareToast('❌ Could not share. Try again.');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '📤 Share My Score'; }
  }
}


function __bpExposePollGlobals(){
  window.BPQuizState = {
    get selClass(){ return selClass; }, set selClass(v){ selClass = v; },
    get selSubject(){ return selSubject; }, set selSubject(v){ selSubject = v; },
    get selChapter(){ return selChapter; }, set selChapter(v){ selChapter = v; },
    get selCount(){ return selCount; }, set selCount(v){ selCount = v; },
    get selMode(){ return selMode; }, set selMode(v){ selMode = v; },
    get selLearnType(){ return selLearnType; }, set selLearnType(v){ selLearnType = v; },
    get urlViewerFrom(){ return urlViewerFrom; }, set urlViewerFrom(v){ urlViewerFrom = v; },
    get questions(){ return questions; }, set questions(v){ questions = v; },
    get userAnswers(){ return userAnswers; }, set userAnswers(v){ userAnswers = v; },
    get currentIdx(){ return currentIdx; }, set currentIdx(v){ currentIdx = v; },
    get pollIdx(){ return pollIdx; }, set pollIdx(v){ pollIdx = v; },
    get LABELS(){ return LABELS; }
  };
  Object.assign(window, {
    buildURL, showScreen, updateBreadcrumb, selectClass, selectSubject, buildChapterScreen,
    selectChapter, practiceAllSubject, selectMode, selectLearn, selectCount, fetchChapterContent,
    showComingSoon, normalizeMCQ, fetchMCQFromURL, urlViewerBack, goBack, goHome,
    startPollMode, pollRender, pollAnswer, pollNext, pollSkip, pollToggleExpl, pollToggleBm,
    pollFinish, pollShowResults, startInlineQuiz, renderQ, updateProgress, initGrid, updateGrid,
    prevQ, nextQ, submitQuiz, showResults, toggleSol, shareScore
  });
}
__bpExposePollGlobals();
