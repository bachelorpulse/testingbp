const StrikeManager = (() => {
const KEY = 'bp_strike';
const MILESTONES = [5, 10, 15, 20, 30, 50, 100];
function todayStr() { return new Date().toISOString().slice(0, 10); }
function load() {
try { return JSON.parse(localStorage.getItem(KEY)) || { current: 0, lastDate: null, high: 0 }; }
catch { return { current: 0, lastDate: null, high: 0 }; }
}
function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function recordActivity() {
const data = load();
const today = todayStr();
if (data.lastDate === today) return; // already counted today
const diff = data.lastDate ? daysBetween(data.lastDate, today) : null;
data.current = (diff === 1) ? data.current + 1 : 1;
data.lastDate = today;
if (data.current > data.high) data.high = data.current;
save(data);
renderBadge(data);
if (MILESTONES.includes(data.current)) {
fireConfetti();
showMilestoneToast(data.current);
}
if (typeof window.BadgeSystem !== 'undefined') window.BadgeSystem.syncStreak();
}
function renderBadge(data) {
data = data || load();
const badge = document.getElementById('strikeBadge');
const icon  = document.getElementById('strikeIcon');
const text  = document.getElementById('strikeText');
if (!badge) return;
const cur = data.current || 0;
const hi  = data.high || 0;
icon.textContent = cur > 0 ? '🔥' : '❄️';
text.textContent = `${cur} Day${cur !== 1 ? 's' : ''} Strike`;
badge.classList.toggle('hot',  cur > 0);
badge.classList.toggle('cold', cur === 0);
}
function init() { renderBadge(load()); }
return { recordActivity, updateStrike: recordActivity, init };
})();
window.StrikeManager.init();
function toggleStrikeTooltip(e) {
e.stopPropagation();
document.getElementById('strikeTooltip').classList.toggle('open');
}
document.addEventListener('click', () => {
const tip = document.getElementById('strikeTooltip');
if (tip) tip.classList.remove('open');
});
function showMilestoneToast(days) {
const toast = document.getElementById('strikeMilestoneToast');
if (!toast) return;
const msgs = {
5:'🎉 5-Day Strike! You\'re on fire!', 10:'🏆 10-Day Strike! Legend!',
15:'⚡ 15 Days Strong! Keep going!',   20:'🌟 20-Day Strike! Unstoppable!',
30:'💎 30-Day Strike! True Scholar!',  50:'👑 50 Days! Hall of Fame!',
100:'🚀 100-Day Strike! You\'re a Legend!'
};
toast.textContent = msgs[days] || `🔥 ${days}-Day Strike! Amazing!`;
toast.classList.add('show');
setTimeout(() => toast.classList.remove('show'), 3800);
}
function fireConfetti() {
const canvas = document.getElementById('confettiCanvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
const COLORS = ['#f59e0b','#7c6af7','#3b82f6','#10b981','#ef4444','#ec4899','#fbbf24','#a78bfa'];
const particles = Array.from({ length: 140 }, () => ({
x: Math.random() * canvas.width, y: Math.random() * -canvas.height * 0.4,
r: 5 + Math.random() * 7, d: 2 + Math.random() * 3,
color: COLORS[Math.floor(Math.random() * COLORS.length)],
tilt: Math.random() * 12 - 6, tiltSpeed: (Math.random() - 0.5) * 0.2,
spin: (Math.random() - 0.5) * 0.15, angle: Math.random() * Math.PI * 2,
shape: Math.random() > 0.5 ? 'rect' : 'circle'
}));
let frame, elapsed = 0;
const MAX = 180;
function draw() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
particles.forEach(p => {
ctx.save();
ctx.translate(p.x, p.y);
ctx.rotate(p.angle);
ctx.fillStyle = p.color;
ctx.globalAlpha = Math.max(0, 1 - elapsed / MAX);
if (p.shape === 'rect') { ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r * 0.6); }
else { ctx.beginPath(); ctx.arc(0, 0, p.r/2, 0, Math.PI*2); ctx.fill(); }
ctx.restore();
p.y += p.d + 1; p.x += Math.sin(p.angle) * 1.5;
p.tilt += p.tiltSpeed; p.angle += p.spin;
});
elapsed++;
if (elapsed < MAX) { frame = requestAnimationFrame(draw); }
else { ctx.clearRect(0, 0, canvas.width, canvas.height); }
}
cancelAnimationFrame(frame); elapsed = 0; draw();
}
const GUIDE_STEPS = [
{
icon: '👋',
title: 'Welcome to BachelorPulse!',
body: `This short tour will show you exactly how to use the app — step by step. It only takes 30 seconds!
<div class="tip"><span class="tip-icon">💡</span>You can reopen this guide any time from the <strong>☰ Menu</strong> → How to Use.</div>`
},
{
icon: '🏫',
title: 'Step 1 — Pick Your Class',
body: `The first screen shows <strong>Class 6 to 10</strong>. Tap the card that matches your current class.
<div class="tip"><span class="tip-icon">📌</span>All content is based on the official <strong>NCERT syllabus</strong>, so it perfectly matches your school textbooks.</div>`
},
{
icon: '📘',
title: 'Step 2 — Choose a Subject',
body: `After selecting your class, choose one of three subjects:<br><br>
🔬 <strong>Science</strong> — Biology, Physics, Chemistry<br>
➗ <strong>Mathematics</strong> — Concepts, Problems, Formulas<br>
🌍 <strong>Social Science</strong> — History, Geography, Civics`
},
{
icon: '📑',
title: 'Step 3 — Select a Chapter',
body: `You will see all chapters for your subject. Tap any chapter to continue.
<div class="tip"><span class="tip-icon">⭐</span>Tap <strong>"All Chapters"</strong> (the golden card at the top) to get mixed questions from every chapter at once — great for full revision!</div>`
},
{
icon: '⚡',
title: 'Step 4 — What Do You Want to Do?',
body: `You have <strong>three modes</strong> to choose from:<br><br>
📝 <strong>MCQ</strong> — Take a multiple-choice quiz and test yourself.<br>
✅ <strong>Solution</strong> — Read step-by-step solved answers.<br>
📚 <strong>Learn</strong> — Study short notes or a visual mind map.`
},
{
icon: '📝',
title: 'Step 5 — Taking an MCQ Quiz',
body: `If you chose MCQ, first select how many questions you want — <strong>10, 25, 50, or 100</strong>. Questions are picked randomly, so every quiz is different!
<div class="tip"><span class="tip-icon">🎯</span>Use the <strong>question grid</strong> at the top to jump between questions. Green = answered, Grey = skipped.</div>`
},
{
icon: '📊',
title: 'Step 6 — Your Quiz Results',
body: `After you submit, you'll see your <strong>score, percentage, and a full review</strong> of every question.<br><br>
For each question you can tap <strong>💡 View Explanation</strong> to read the solution from your study material.
<div class="tip"><span class="tip-icon">🔄</span>Hit <strong>Try Again</strong> to retake the same chapter with a fresh set of random questions!</div>`
},
{
icon: '🧠',
title: 'Step 7 — Learn Mode',
body: `In <strong>Learn</strong> mode you get two options:<br><br>
📋 <strong>Short Note</strong> — A concise bullet-point summary, perfect for last-minute revision.<br>
🧠 <strong>Mind Map</strong> — A visual diagram connecting all key topics. Tap the image to <strong>zoom in</strong> and read every detail clearly.`
},
{
icon: '✅',
title: 'Step 8 — Mark Chapters Done',
body: `At the bottom of every Solution, Short Note, or Mind Map page, there is a <strong>"Mark Chapter as Completed"</strong> checkbox. Tick it to track which chapters you have already studied.
<div class="tip"><span class="tip-icon">💾</span>Your progress is saved on this device automatically — no account needed!</div>`
},
{
icon: '📬',
title: 'Need Help or Found a Bug?',
body: `Scroll to the bottom of any page to find the <strong>footer links</strong>:<br><br>
📖 <strong>About</strong> — Learn what BachelorPulse is all about.<br>
🔒 <strong>Privacy</strong> — See how your data is handled.<br>
📬 <strong>Contact</strong> — Email us with suggestions or bug reports.
<div class="tip"><span class="tip-icon">🚀</span>We read every email! If a chapter is missing, just let us know your class, subject, and chapter name.</div>`
},
{
icon: '🏆',
title: "You're All Set!",
body: `You now know everything you need to use BachelorPulse like a pro. Go ahead and start your first quiz — good luck! 🎉
<div class="tip"><span class="tip-icon">☰</span>Remember: open the <strong>Menu</strong> → How to Use anytime to revisit this guide.</div>`
}
];
let guideIdx = 0;
function openGuide() {
guideIdx = 0;
renderGuideStep();
document.getElementById('guideOverlay').classList.add('open');
document.body.style.overflow = 'hidden';
}
function closeGuide() {
document.getElementById('guideOverlay').classList.remove('open');
document.body.style.overflow = '';
}
function guideStep(dir) {
guideIdx = Math.max(0, Math.min(GUIDE_STEPS.length - 1, guideIdx + dir));
renderGuideStep();
}
function renderGuideStep() {
const s = GUIDE_STEPS[guideIdx];
const total = GUIDE_STEPS.length;
const isLast = guideIdx === total - 1;
const isFirst = guideIdx === 0;
document.getElementById('guideIcon').textContent = s.icon;
document.getElementById('guideTitle').textContent = s.title;
document.getElementById('guideBody').innerHTML = s.body;
document.getElementById('guideProgress').textContent = `Step ${guideIdx + 1} of ${total}`;
const dots = document.getElementById('guideDots');
dots.innerHTML = GUIDE_STEPS.map((_,i) =>
`<div class="guide-dot ${i===guideIdx?'active':i<guideIdx?'done':''}"></div>`
).join('');
const prev = document.getElementById('guidePrev');
prev.style.display = isFirst ? 'none' : 'inline-flex';
const next = document.getElementById('guideNext');
if (isLast) {
next.textContent = '🎉 Start Learning!';
next.className = 'guide-btn guide-btn-finish';
next.onclick = closeGuide;
} else {
next.textContent = 'Next →';
next.className = 'guide-btn guide-btn-next';
next.onclick = () => guideStep(1);
}
}
function toggleHamPanel() {
const p=document.getElementById('hamPanel'), o=document.getElementById('hamOverlay');
p.classList.toggle('open'); o.classList.toggle('open');
if (p.classList.contains('open') && typeof window.BadgeSystem !== 'undefined') {
window.BadgeSystem.onPanelOpen();
}
}
function closeHamPanel() {
document.getElementById('hamPanel').classList.remove('open');
document.getElementById('hamOverlay').classList.remove('open');
}

Object.assign(window, { StrikeManager, toggleStrikeTooltip, openGuide, closeGuide, guideStep, renderGuideStep, toggleHamPanel, closeHamPanel });
