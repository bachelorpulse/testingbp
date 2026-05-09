const BPBadgeUnlock = (() => {
  const ov  = document.getElementById('bpBadgeUnlockOverlay');
  const card = document.getElementById('bpBadgeUnlockCard');
  let _queue = [], _showing = false, _timer = null;

  const CAT_COLORS = {
    'MCQ'      : { border:'#3b82f6', glow:'rgba(59,130,246,.5)',  text:'#93c5fd' },
    'Accuracy' : { border:'#10b981', glow:'rgba(16,185,129,.5)',  text:'#6ee7b7' },
    'Streak'   : { border:'#f59e0b', glow:'rgba(245,158,11,.5)',  text:'#fbbf24' },
    'Focus'    : { border:'#8b5cf6', glow:'rgba(139,92,246,.5)',  text:'#c4b5fd' },
    'Special'  : { border:'#ec4899', glow:'rgba(236,72,153,.5)',  text:'#f9a8d4' },
    'Session'  : { border:'#f59e0b', glow:'rgba(245,158,11,.5)',  text:'#fbbf24' },
  };

  function _burstParticles(color) {
    const wrap = document.getElementById('bpBadgeUnlockBurst');
    wrap.innerHTML = '';
    const COLORS = [color, '#fbbf24', '#fff', '#a78bfa', '#34d399'];
    for (let i = 0; i < 22; i++) {
      const el = document.createElement('div');
      el.className = 'bpBurst';
      const sz = 6 + Math.random() * 10;
      const angle = Math.random() * 360;
      const dist  = 60 + Math.random() * 100;
      const tx = Math.cos(angle * Math.PI/180) * dist;
      const ty = Math.sin(angle * Math.PI/180) * dist;
      el.style.cssText = `
        width:${sz}px;height:${sz}px;
        background:${COLORS[Math.floor(Math.random()*COLORS.length)]};
        left:calc(50% - ${sz/2}px);top:calc(50% - ${sz/2}px);
        transform:translate(${tx}px,${ty}px);
        animation:bpBadgeBurst .8s ease-out ${i*0.03}s both;
        opacity:0;
      `;
      wrap.appendChild(el);
    }
  }

  function show(badge) {
    const col = CAT_COLORS[badge.cat] || CAT_COLORS['Special'];
    card.style.borderColor = col.border;
    card.style.boxShadow   = `0 30px 80px rgba(0,0,0,.7), 0 0 60px ${col.glow}`;
    document.getElementById('bpBadgeUnlockCat').textContent  = badge.cat + ' — Achievement Unlocked! 🎉';
    document.getElementById('bpBadgeUnlockCat').style.color   = col.text;
    document.getElementById('bpBadgeUnlockIcon').textContent  = badge.icon;
    document.getElementById('bpBadgeUnlockName').textContent  = badge.name;
    document.getElementById('bpBadgeUnlockName').style.color  = col.text;
    document.getElementById('bpBadgeUnlockSub').textContent   = badge.sub;
    card.style.animation = 'none';
    ov.style.display = 'flex';
    requestAnimationFrame(() => {
      card.style.animation = 'bpBadgePopIn .55s cubic-bezier(.34,1.56,.64,1) both';
    });
    document.getElementById('bpBadgeUnlockIcon').style.animation = 'none';
    requestAnimationFrame(() => {
      document.getElementById('bpBadgeUnlockIcon').style.animation =
        'bpBadgeIconBounce 1.2s ease .45s infinite';
    });
    _burstParticles(col.border);
    fireConfetti && fireConfetti();
    _timer = setTimeout(close, 5000);
    _showing = true;
  }

  function close() {
    clearTimeout(_timer);
    ov.style.display = 'none';
    _showing = false;
    if (_queue.length) setTimeout(() => show(_queue.shift()), 300);
  }

  function queue(badge) {
    if (_showing) { _queue.push(badge); return; }
    show(badge);
  }

  // Override window.BadgeSystem._cb to also trigger animation
  const _origCb = typeof window.BadgeSystem !== 'undefined' ? window.BadgeSystem._cb : null;
  if (_origCb) {
    window.BadgeSystem._cb = function(stats) {
      const before = Object.keys(window.BadgeSystem._le ? window.BadgeSystem._le() : {});
      _origCb.call(BadgeSystem, stats);
      // Detect newly unlocked badges
      setTimeout(() => {
        const after = window.BadgeSystem._le ? window.BadgeSystem._le() : {};
        Object.keys(after).forEach(id => {
          if (!before.includes(id)) {
            const b = (window.BadgeSystem._badges || []).find(x => x.id === id);
            if (b) queue(b);
          }
        });
      }, 100);
    };
  }

  // Patch BadgeSystem to expose internals
  if (typeof window.BadgeSystem !== 'undefined') {
    window.BadgeSystem._le = window.BadgeSystem._le || function() {
      try { return JSON.parse(localStorage.getItem('bp_badges')) || {}; } catch(e) { return {}; }
    };
  }

  return { show, queue, close };
})();

/* ════════════════════════════════════════════════════════
   SESSION MILESTONE BADGES (1, 10, 25, 50, 100 correct)
════════════════════════════════════════════════════════ */
const BPSessionMilestone = (() => {
  const MILESTONES = [
    { at:1,   cls:'s1',  icon:'🌱', title:'First One!',       sub:'You answered your first MCQ correctly!' },
    { at:10,  cls:'s10', icon:'🎯', title:'Perfect 10!',      sub:'10 correct answers in this session!' },
    { at:25,  cls:'s25', icon:'⚡', title:'Silver Shield',    sub:'25 correct! You\'re halfway to greatness!' },
    { at:50,  cls:'s50', icon:'🏅', title:'Golden 50!',       sub:'50 correct answers — Board exam ready!' },
    { at:100, cls:'s100',icon:'👑', title:'Century King!',    sub:'100 correct! You\'re an absolute legend!' },
  ];

  function showToast(m) {
    const toast = document.getElementById('bpMilestoneBadgeToast');
    document.getElementById('bpMilestoneIcon').textContent  = m.icon;
    document.getElementById('bpMilestoneTitle').textContent = m.title;
    document.getElementById('bpMilestoneSub').textContent   = m.sub;
    toast.style.opacity   = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateX(-50%) translateY(80px)';
    }, 3500);
  }

  function getBadgesEarned(correct) {
    return MILESTONES.filter(m => correct >= m.at);
  }

  function renderOnResults(correct, containerEl) {
    const earned = getBadgesEarned(correct);
    if (!earned.length) return;
    const html = `
      <div style="text-align:center;margin-bottom:6px;">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:#93a8c0;font-weight:700;margin-bottom:8px;">🏅 Session Badges Earned</div>
        <div class="bp-session-badges">
          ${earned.map((m,i) => `
            <div class="bp-session-badge ${m.cls}" style="animation-delay:${i*0.12}s">
              <span>${m.icon}</span>
              <span>${m.title}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    containerEl.innerHTML = html;
    containerEl.style.display = 'block';
  }

  function checkAndToast(correct) {
    MILESTONES.forEach(m => {
      if (correct === m.at) setTimeout(() => showToast(m), 600);
    });
  }

  return { checkAndToast, renderOnResults, MILESTONES };
})();

/* ════════════════════════════════════════════════════════
   DAILY CHALLENGE SYSTEM — Auto-generated, Ego-hitting
════════════════════════════════════════════════════════ */
const BPChallengeSystem = (() => {
  const KEY_PROG  = 'bp_chal_prog';
  const KEY_DATE  = 'bp_chal_date';
  const KEY_GEN   = 'bp_chal_gen';

  // Challenge templates — ego-hitting, designed so students MUST try
  const TEMPLATES = [
    // Accuracy challenges
    { id:'acc_80',  icon:'🎯', cat:'Accuracy Challenge', reward:'🏅 Sharpshooter Badge',
      title:'Prove you\'re not average.',
      desc:'80% of students fail to score 80%+ on their first try. Bet you can\'t either.',
      tasks:[
        { id:'t1', label:'Score 80%+ in any MCQ quiz today', type:'accuracy', target:80 },
        { id:'t2', label:'Attempt at least 25 questions', type:'mcq_count', target:25 },
      ]
    },
    { id:'acc_90',  icon:'🔥', cat:'Elite Challenge', reward:'💎 Top 1% Badge',
      title:'Only 1 in 10 students can do this.',
      desc:'Score 90%+ in two back-to-back quizzes. Easy? Then prove it.',
      tasks:[
        { id:'t1', label:'Score 90%+ in any quiz', type:'accuracy', target:90 },
        { id:'t2', label:'Complete a 50-question quiz', type:'mcq_count', target:50 },
      ]
    },
    // Volume challenges
    { id:'vol_50',  icon:'⚡', cat:'Hustle Challenge', reward:'🚀 Grinder Badge',
      title:'50 MCQs. Can you even?',
      desc:'Your classmates averaged 12 questions yesterday. Think you can do 50 today?',
      tasks:[
        { id:'t1', label:'Attempt 50 MCQs total today', type:'mcq_total', target:50 },
        { id:'t2', label:'Don\'t skip more than 5 questions', type:'no_skip', target:5 },
      ]
    },
    { id:'vol_100', icon:'💯', cat:'Century Challenge', reward:'👑 Century King Badge',
      title:'100 MCQs or nothing.',
      desc:'Board exams have 80 questions in 3 hours. If you can\'t do 100 now, you\'re not ready.',
      tasks:[
        { id:'t1', label:'Attempt 100 MCQs in one session', type:'mcq_single_session', target:100 },
        { id:'t2', label:'Score at least 60%+', type:'accuracy', target:60 },
      ]
    },
    // Subject challenges
    { id:'sci',     icon:'🔬', cat:'Science Duel', reward:'🧪 Science Nerd Badge',
      title:'Science is for the brave.',
      desc:'Most students avoid Science MCQs. Are you in that crowd, or do you stand out?',
      tasks:[
        { id:'t1', label:'Complete a Science MCQ quiz today', type:'subject', target:'science' },
        { id:'t2', label:'Score 70%+ in Science', type:'accuracy', target:70 },
      ]
    },
    { id:'math',    icon:'➗', cat:'Maths Gauntlet', reward:'📐 Maths Master Badge',
      title:'Maths separates toppers from the rest.',
      desc:'75% of Class 10 students score below 70% in Maths. Where do you stand?',
      tasks:[
        { id:'t1', label:'Attempt a Maths MCQ quiz', type:'subject', target:'math' },
        { id:'t2', label:'Score 75%+ in Maths', type:'accuracy', target:75 },
      ]
    },
    { id:'sst',     icon:'🌍', cat:'SST Showdown', reward:'🗺️ History Buff Badge',
      title:'Social Science is actually hard.',
      desc:'Everyone thinks SST is easy. Prove you\'re not one of them.',
      tasks:[
        { id:'t1', label:'Complete a Social Science quiz', type:'subject', target:'social' },
        { id:'t2', label:'Score 80%+ in SST', type:'accuracy', target:80 },
      ]
    },
    // Streak challenges
    { id:'str',     icon:'🔥', cat:'Streak Builder', reward:'⚡ Fire Starter Badge',
      title:'One day means nothing. Two days means something.',
      desc:'You practiced yesterday? Cool. Come back again today to build a real streak.',
      tasks:[
        { id:'t1', label:'Complete any quiz today', type:'any_quiz', target:1 },
        { id:'t2', label:'Maintain your daily streak', type:'streak', target:2 },
      ]
    },
    // Perfect score challenge
    { id:'perfect', icon:'🏆', cat:'Perfection Challenge', reward:'💫 Perfectionist Badge',
      title:'Can you actually score 100%?',
      desc:'Less than 3% of students get a perfect score. It\'s probably too hard for you anyway.',
      tasks:[
        { id:'t1', label:'Score 100% in a 10-question quiz', type:'perfect_score', target:100 },
        { id:'t2', label:'Do it without skipping any question', type:'no_skip', target:0 },
      ]
    },
    // All-rounder challenge
    { id:'allaround',icon:'⭐',cat:'All-Rounder Test', reward:'🌟 All-Rounder Badge',
      title:'Topper material? Prove it.',
      desc:'Toppers don\'t avoid subjects. Attempt all 3 subjects today and we\'ll believe you.',
      tasks:[
        { id:'t1', label:'Attempt Science MCQs', type:'subject', target:'science' },
        { id:'t2', label:'Attempt Maths MCQs', type:'subject', target:'math' },
        { id:'t3', label:'Attempt Social Science MCQs', type:'subject', target:'social' },
      ]
    },
  ];

  function todayStr() { return new Date().toISOString().slice(0,10); }

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(KEY_PROG)) || {}; } catch(e) { return {}; }
  }
  function saveProgress(p) { localStorage.setItem(KEY_PROG, JSON.stringify(p)); }

  function getTodayChallenge() {
    const today = todayStr();
    // Check if we already generated one today
    const stored = (() => { try { return JSON.parse(localStorage.getItem(KEY_GEN)); } catch { return null; } })();
    if (stored && stored.date === today) return stored.challenge;
    // Pick based on day-of-year for determinism + some randomness
    const doy = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
    const idx = doy % TEMPLATES.length;
    const challenge = TEMPLATES[idx];
    localStorage.setItem(KEY_GEN, JSON.stringify({ date:today, challenge }));
    return challenge;
  }

  function getChallengeProgress() {
    const p = loadProgress();
    const today = todayStr();
    if (p.date !== today) return {};
    return p.tasks || {};
  }

  function updateTask(taskId, done) {
    const today = todayStr();
    const p = loadProgress();
    if (p.date !== today) { saveProgress({ date:today, tasks:{} }); return updateTask(taskId, done); }
    p.tasks = p.tasks || {};
    p.tasks[taskId] = done;
    saveProgress(p);
    window.BPChallengeSystem.refresh();
    _checkAllComplete();
  }

  function _checkAllComplete() {
    const ch = getTodayChallenge();
    const prog = getChallengeProgress();
    const allDone = ch.tasks.every(t => prog[t.id]);
    if (allDone) {
      const doneKey = 'bp_chal_done_' + todayStr();
      if (!localStorage.getItem(doneKey)) {
        localStorage.setItem(doneKey, '1');
        setTimeout(() => {
          window.BPBadgeUnlock.queue({
            icon:'🎖️', name:'Daily Challenge Complete!', cat:'Special',
            sub:"You crushed today's challenge. India's toppers would be proud! 🇮🇳"
          });
          fireConfetti && fireConfetti();
        }, 400);
      }
    }
  }

  function _taskAutoCheck(quizCorrect, quizTotal, quizAccuracy, quizSubject) {
    const ch = getTodayChallenge();
    const prog = getChallengeProgress();
    ch.tasks.forEach(t => {
      if (prog[t.id]) return; // already done
      let done = false;
      if (t.type === 'accuracy'            && quizAccuracy >= t.target) done = true;
      if (t.type === 'mcq_count'           && quizTotal >= t.target)    done = true;
      if (t.type === 'mcq_total'           && quizTotal >= t.target)    done = true;
      if (t.type === 'mcq_single_session'  && quizTotal >= t.target)    done = true;
      if (t.type === 'any_quiz'            && quizTotal > 0)            done = true;
      if (t.type === 'perfect_score'       && quizAccuracy === 100)     done = true;
      if (t.type === 'subject'             && quizSubject === t.target) done = true;
      if (done) updateTask(t.id, true);
    });
  }

  function _buildWidget(containerId, compact) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const ch   = getTodayChallenge();
    const prog = getChallengeProgress();
    const completed = ch.tasks.filter(t => prog[t.id]).length;
    const total     = ch.tasks.length;
    const pct       = Math.round(completed / total * 100);
    const allDone   = completed === total;

    const taskHtml = ch.tasks.map(t => {
      const done = !!prog[t.id];
      return `<li class="bp-chal-item ${done ? 'completed' : ''}" onclick="window.BPChallengeSystem._clickTask('${t.id}','${containerId}')">
        <span class="bp-chal-check">${done ? '✓' : ''}</span>
        <span style="flex:1">${t.label}</span>
        ${done ? '<span style="font-size:.8rem">✅</span>' : '<span style="font-size:.7rem;color:#6366f1">→ Try it</span>'}
      </li>`;
    }).join('');

    el.style.display = 'block';
    el.innerHTML = `
      <div class="bp-chal-card ${allDone ? '' : ''}" id="bpChalCard_${containerId}">
        <div class="bp-chal-header">
          <span class="bp-chal-badge-label">⚡ Daily Challenge</span>
          <span style="font-size:1.4rem">${ch.icon}</span>
          <span class="bp-chal-reward">${ch.reward}</span>
        </div>
        <div class="bp-chal-title">${ch.title}</div>
        <div class="bp-chal-exp">${ch.desc}</div>
        <ul class="bp-chal-list">${taskHtml}</ul>
        <div class="bp-chal-progress-wrap">
          <div class="bp-chal-progress-meta">
            <span>${allDone ? '🎉 All tasks complete!' : `${completed} / ${total} tasks done`}</span>
            <span style="font-weight:700;color:${pct===100?'#10b981':'#6366f1'}">${pct}%</span>
          </div>
          <div class="bp-chal-progress-bar">
            <div class="bp-chal-progress-fill" style="width:${pct}%;${pct===100?'background:linear-gradient(90deg,#10b981,#059669)':''}"></div>
          </div>
        </div>
        ${allDone ? `<div style="text-align:center;margin-top:12px;font-size:.85rem;font-weight:700;color:#10b981;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:12px;padding:8px;">🏆 Challenge Crushed! See you tomorrow for more! 💪</div>` : ''}
      </div>`;
  }

  function _clickTask(taskId, containerId) {
    // Manual mark — user taps to acknowledge
    const prog = getChallengeProgress();
    if (prog[taskId]) return;
    // Shake the card as a fun ego-prod
    const card = document.getElementById('bpChalCard_' + containerId);
    if (card) {
      card.classList.remove('bp-chal-shake');
      void card.offsetWidth;
      card.classList.add('bp-chal-shake');
    }
    // Redirect to home to attempt
    if (typeof window.goHome === 'function') { window.goHome(); }
  }

  function refresh() {
    _buildWidget('bpChallengeWidget', false);
    _buildWidget('bpResultChallengeWidget', true);
  }

  function showOnHome() { _buildWidget('bpChallengeWidget', false); }
  function showOnResults() { _buildWidget('bpResultChallengeWidget', true); }

  function recordQuizResult(correct, total, accuracy, subject) {
    _taskAutoCheck(correct, total, accuracy, subject);
    refresh();
  }

  return { refresh, showOnHome, showOnResults, recordQuizResult, updateTask, _clickTask, getTodayChallenge, getChallengeProgress };
})();

/* ════════════════════════════════════════════════════════
   HOOK INTO EXISTING SYSTEMS
════════════════════════════════════════════════════════ */

// 1. Show challenge on home screen on load


window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => window.BPChallengeSystem.showOnHome(), 300);
});
// Also refresh when goHome is called
const _origGoHome = window.goHome;
if (typeof window.goHome === 'function') {
  window.goHome = function() {
    _origGoHome && _origGoHome();
    setTimeout(() => window.BPChallengeSystem.showOnHome(), 350);
  };
}

// 2. Hook into showResults to show session badges + challenge + trigger milestone
const _origShowResults = window.showResults;
if (typeof window.showResults === 'function') {
  window.showResults = function() {
    _origShowResults && _origShowResults.apply(this, arguments);
    // After results render, inject session badges and challenge
    setTimeout(() => {
      const correct     = window.BPQuizState.userAnswers.filter((a,i) => a !== null && a === window.BPQuizState.questions[i].correct).length;
      const total       = window.BPQuizState.userAnswers.filter(a => a !== null).length;
      const accuracy    = total ? Math.round(correct / total * 100) : 0;
      const subject     = typeof window.BPQuizState.selSubject !== 'undefined' ? window.BPQuizState.selSubject : '';

      // Session milestone badges — insert above result hero
      const resultHero = document.getElementById('bpResultHero');
      if (resultHero) {
        const sessDiv = document.createElement('div');
        sessDiv.id = 'bpSessionBadgeWrap';
        window.BPSessionMilestone.renderOnResults(correct, sessDiv);
        resultHero.parentNode.insertBefore(sessDiv, resultHero.nextSibling);
      }

      // Challenge widget after results
      const resultWrap = document.querySelector('.result-wrap');
      if (resultWrap) {
        const chalDiv = document.getElementById('bpResultChallengeWidget');
        if (chalDiv) { chalDiv.style.margin='16px 0 0'; resultWrap.appendChild(chalDiv); }
        window.BPChallengeSystem.showOnResults();
      }

      // Milestone toast check
      window.BPSessionMilestone.checkAndToast(correct);

      // Record challenge progress
      window.BPChallengeSystem.recordQuizResult(correct, total, accuracy, subject);

      // Check and animate newly unlocked badges
      setTimeout(() => {
        if (typeof window.BadgeSystem !== 'undefined') {
          const earned = window.BadgeSystem._le ? window.BadgeSystem._le() : {};
          const stats  = window.BadgeSystem._ls ? window.BadgeSystem._ls() : {};
          // We let BadgeSystem handle it, but we now patch _cb for animation
        }
      }, 200);
    }, 200);
  };
}

// 3. Patch window.BadgeSystem._cb to trigger unlock animation
if (typeof window.BadgeSystem !== 'undefined') {
  const _origLe     = window.BadgeSystem._le  || (() => { try { return JSON.parse(localStorage.getItem('bp_badges')) || {}; } catch { return {}; } });
  const _origCbPrev = window.BadgeSystem._cb;
  let _prevEarned   = JSON.stringify(_origLe());

  window.BadgeSystem._cb = function(stats) {
    const before = JSON.parse(_prevEarned);
    _origCbPrev && _origCbPrev.call(this, stats);
    const after = _origLe();
    // Queue animations for newly unlocked badges
    Object.keys(after).forEach(id => {
      if (!before[id]) {
        const badges = window.BadgeSystem._badges ||
          (window.BadgeSystem._allBadges ? window.BadgeSystem._allBadges() : []);
        const b = Array.isArray(badges) ? badges.find(x => x.id === id) : null;
        if (b) setTimeout(() => window.BPBadgeUnlock.queue(b), 300);
      }
    });
    _prevEarned = JSON.stringify(after);
  };

  // Also expose badges list
  try {
    const _bs = (function(){
      // Try to find BADGES constant from BadgeSystem closure — use recordQuiz side-effect
      return [];
    })();
  } catch(e){}
}

// 4. Session milestone toast during poll mode too
const _origPollAnswer = window.pollAnswer;
if (typeof window.pollAnswer === 'function') {
  window.pollAnswer = function(idx, oi) {
    _origPollAnswer && _origPollAnswer(idx, oi);
    const correct = window.BPQuizState.userAnswers.filter((a,i) => a !== null && a === window.BPQuizState.questions[i].correct).length;
    window.BPSessionMilestone.checkAndToast(correct);
  };
}

// Initial challenge widget render
setTimeout(() => window.BPChallengeSystem.showOnHome(), 500);

/* inline block extracted from BP_clean-2.html */
// Defer AdSense until first interaction or 4s fallback
(function () {
  let _adsLoaded = false;
  function _loadAds() {
    if (_adsLoaded) return;
    _adsLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7620622498248402';
    s.async = true;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(evt =>
    addEventListener(evt, _loadAds, { once: true, passive: true })
  );
  setTimeout(_loadAds, 4000);
})();

/* inline block extracted from BP_clean-2.html */
// Google Analytics deferred
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-8HB9BRCDNP');
(function () {
  let _gaLoaded = false;
  function _loadGA() {
    if (_gaLoaded) return;
    _gaLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-8HB9BRCDNP';
    s.async = true;
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(evt =>
    addEventListener(evt, _loadGA, { once: true, passive: true })
  );
  setTimeout(_loadGA, 4000);
})();

/* inline block extracted from BP_clean-2.html */
// Text Protection — blocks copy/right-click/shortcuts BUT allows login/input fields
(function() {
  function isInput(el) { return el && el.matches && el.matches('input, textarea, button, [contenteditable], a, .auth-btn, .bp-google-btn, .bp-uname-input, .bp-uname-submit, .bp-auth-close, [onclick], [role="button"]'); }
  document.addEventListener('copy', e => { if (!isInput(e.target)) e.preventDefault(); });
  document.addEventListener('cut', e => { if (!isInput(e.target)) e.preventDefault(); });
  document.addEventListener('contextmenu', e => { if (!isInput(e.target)) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    if (!isInput(e.target) && (e.ctrlKey || e.metaKey)) {
      if (['c','x','a','u','s'].includes(e.key.toLowerCase())) { e.preventDefault(); return false; }
    }
    if (e.key === 'F12') { e.preventDefault(); return false; }
  });
  document.addEventListener('selectstart', e => { if (!isInput(e.target)) e.preventDefault(); });
})();

/* External script preserved from bachelorpulse-chatbot.js */
(function(){
  var s = document.createElement('script');
  s.src = "bachelorpulse-chatbot.js";
  s.defer = true;
  document.head.appendChild(s);
})();






Object.assign(window, { BPBadgeUnlock, BPSessionMilestone, BPChallengeSystem });
