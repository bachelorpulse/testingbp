const uiShellMarkup = `
<div class="pd-overlay" id="pdOverlay">
  <div class="pd-shell">
    <div class="pd-topbar">
      <div class="pd-title">📊 Performance Dashboard</div>
      <button class="pd-close" onclick="PerfDash.close()" title="Close" aria-label="Close performance dashboard">✕</button>
    </div>
    <div class="pd-tabs">
      <button class="pd-tab active" data-tab="overview" onclick="PerfDash.tab(this,'overview')">Overview</button>
      <button class="pd-tab" data-tab="weekly" onclick="PerfDash.tab(this,'weekly')">Weekly</button>
      <button class="pd-tab" data-tab="monthly" onclick="PerfDash.tab(this,'monthly')">Monthly</button>
      <button class="pd-tab" data-tab="chapters" onclick="PerfDash.tab(this,'chapters')">Chapters</button>
      <button class="pd-tab" data-tab="insights" onclick="PerfDash.tab(this,'insights')">Insights</button>
    </div>
    <div class="pd-panel active" id="pd-panel-overview">
      <div class="pd-stats-row" id="pdStatCards"></div>
      <div class="pd-card" id="pdConsistency"></div>
      <div class="pd-card" id="pdTimeCard"></div>
      <div class="pd-card" id="pdOverviewGraph"></div>
    </div>
    <div class="pd-panel" id="pd-panel-weekly">
      <div class="pd-card" id="pdWeeklyBar"></div>
      <div class="pd-card" id="pdAccuracyBar"></div>
    </div>
    <div class="pd-panel" id="pd-panel-monthly">
      <div class="pd-card" id="pdMonthlyBar"></div>
      <div class="pd-card" id="pdMonthlyAcc"></div>
      <div class="pd-card" id="pdMonthlyStats"></div>
    </div>
    <div class="pd-panel" id="pd-panel-chapters">
      <div class="pd-card" id="pdChapterList"></div>
    </div>
    <div class="pd-panel" id="pd-panel-insights">
      <div id="pdInsightsList"></div>
    </div>
  </div>
</div>
<div id="bm-toast"></div>
<div class="bp-share-toast" id="bpShareToast"></div>
<div id="bp-share-card"></div>
<div id="bm-overlay">
  <div id="bm-shell">
    <div id="bm-topbar">
      <div id="bm-title">🔖 Bookmarked Questions</div>
      <button id="bm-close" onclick="BookmarkSystem.close()" title="Close" aria-label="Close bookmarks panel">✕</button>
    </div>
    <div class="bm-count" id="bmCount"></div>
    <div id="bmList"></div>
  </div>
</div>
<div class="lightbox-overlay" id="lightboxOverlay" onclick="closeLightboxOutside(event)">
  <button class="lightbox-close" onclick="closeLightbox()" title="Close (Esc)" aria-label="Close fullscreen image">✕</button>
  <div class="lightbox-label" id="lightboxLabel"></div>
  <div class="lb-zoom-controls" id="lbZoomControls" style="display:none;">
    <button class="lb-zoom-btn" onclick="lbZoom(1.25)" title="Zoom In" aria-label="Zoom In">＋</button>
    <span class="lb-zoom-pct" id="lbZoomPct">100%</span>
    <button class="lb-zoom-btn" onclick="lbZoom(0.8)" title="Zoom Out" aria-label="Zoom Out">－</button>
    <button class="lb-zoom-btn lb-zoom-reset" onclick="lbZoomReset()" title="Reset" aria-label="Reset zoom">↺</button>
  </div>
  <div class="lightbox-scroll" id="lightboxScroll">
    <div class="lightbox-img-wrap" id="lightboxImgWrap" onclick="event.stopPropagation()">
      <div class="lightbox-img-spinner" id="lightboxSpinner">
        <span class="lightbox-spin-icon">⏳</span>
        <span>Loading HD Image...</span>
      </div>
      <img id="lightboxImg" src="" alt="Mind Map" width="960" height="540" loading="lazy"
        oncontextmenu="return false;" ondragstart="return false;"
        style="image-rendering:crisp-edges;image-rendering:-webkit-optimize-contrast;-ms-interpolation-mode:nearest-neighbor;cursor:grab;user-select:none;" />
    </div>
  </div>
  <div class="lightbox-mobile-hint">📱 Pinch to zoom &nbsp;·&nbsp; Scroll to pan</div>
  <div class="lightbox-adsense-strip" id="lightboxAdStrip">
    <span class="lb-ad-label">Advertisement</span>
  </div>
</div>
<div class="ham-overlay" id="hamOverlay" onclick="closeHamPanel()"></div>
<div class="ham-panel" id="hamPanel">
  <div class="ham-header">
    <span class="ham-title">BachelorPulse</span>
    <button class="ham-close" onclick="closeHamPanel()" aria-label="Close navigation menu">✕</button>
  </div>
  <div class="ham-body">
    <div class="ham-section-label">Navigation</div>
    <div class="ham-item" onclick="closeHamPanel(); goHome()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">🏠 Home</div>
    <div class="ham-item" onclick="closeHamPanel(); openGuide()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">📖 How to Use</div>
    <div class="ham-divider"></div>
    <div class="ham-section-label">Features</div>
    <div class="ham-item" onclick="closeHamPanel(); PerfDash.open()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">📊 Performance</div>
    <div class="ham-item" onclick="closeHamPanel(); BookmarkSystem.open()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">🔖 Bookmarks <span id="bmHamCount" style="margin-left:auto;font-size:.7rem;background:rgba(245,158,11,.15);color:var(--accent);border-radius:999px;padding:1px 8px;font-weight:700;display:none;">0</span></div>
    <div class="ham-item" onclick="closeHamPanel(); FeedbackSystem.open()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">💬 Feedback</div>
    <div class="ham-divider"></div>
    <div class="badge-section-label">🏆 My Badges <span id="badgeCountLabel" style="color:var(--accent);font-size:.7rem;"></span></div>
    <div class="badge-grid" id="badgeGrid">
      <div style="grid-column:1/-1;text-align:center;padding:18px 0;color:var(--muted);font-size:.82rem;">Opening...</div>
    </div>
    <div class="ham-divider"></div>
    <div class="ham-section-label">📺 Watch & Learn</div>
    <div class="ham-item" onclick="closeHamPanel(); window.open('https://www.youtube.com/@BachelorPulse', '_blank'); (function(){ try{ var s=BadgeSystem._ls(); if(!s.ytVisited){ s.ytVisited=true; BadgeSystem._ss(s); BadgeSystem._cb(s); } }catch(e){} })()" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}" style="background:linear-gradient(135deg,rgba(255,0,0,.10),rgba(255,80,0,.06));border-radius:10px;border:1px solid rgba(255,0,0,.18);">
      <span style="font-size:1.2rem;">▶️</span>
      <div style="flex:1;">
        <div style="font-size:.87rem;font-weight:700;color:#ff4444;">BachelorPulse YouTube</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:1px;">Video lectures & explanations</div>
      </div>
      <span style="font-size:.75rem;color:var(--muted);">↗</span>
    </div>
    <div class="ham-divider"></div>
    <div class="ham-section-label">Info</div>
    <a class="ham-item ham-info-card" href="about.html" onclick="closeHamPanel()" style="background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(59,130,246,.06));border-radius:10px;border:1px solid rgba(99,102,241,.2);text-decoration:none;">
      <span style="font-size:1.2rem;">🎓</span>
      <div style="flex:1;">
        <div style="font-size:.87rem;font-weight:700;color:#a5b4fc;">About Us</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:1px;">Our mission & story</div>
      </div>
      <span style="font-size:.75rem;color:var(--muted);">↗</span>
    </a>
    <a class="ham-item ham-info-card" href="contact.html" onclick="closeHamPanel()" style="background:linear-gradient(135deg,rgba(16,185,129,.10),rgba(5,150,105,.06));border-radius:10px;border:1px solid rgba(16,185,129,.2);text-decoration:none;margin-top:6px;">
      <span style="font-size:1.2rem;">📬</span>
      <div style="flex:1;">
        <div style="font-size:.87rem;font-weight:700;color:#6ee7b7;">Contact Us</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:1px;">Suggestions & bug reports</div>
      </div>
      <span style="font-size:.75rem;color:var(--muted);">↗</span>
    </a>
    <a class="ham-item ham-info-card" href="disclaimer.html" onclick="closeHamPanel()" style="background:linear-gradient(135deg,rgba(245,158,11,.10),rgba(217,119,6,.06));border-radius:10px;border:1px solid rgba(245,158,11,.2);text-decoration:none;margin-top:6px;">
      <span style="font-size:1.2rem;">⚖️</span>
      <div style="flex:1;">
        <div style="font-size:.87rem;font-weight:700;color:#fcd34d;">Disclaimer</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:1px;">Terms & content policy</div>
      </div>
      <span style="font-size:.75rem;color:var(--muted);">↗</span>
    </a>
    <a class="ham-item ham-info-card" href="privacy_policy.html" onclick="closeHamPanel()" style="background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(79,70,229,.06));border-radius:10px;border:1px solid rgba(99,102,241,.2);text-decoration:none;margin-top:6px;">
      <span style="font-size:1.2rem;">🔒</span>
      <div style="flex:1;">
        <div style="font-size:.87rem;font-weight:700;color:#a5b4fc;">Privacy Policy</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:1px;">How we handle your data</div>
      </div>
      <span style="font-size:.75rem;color:var(--muted);">↗</span>
    </a>
    <div class="ham-divider"></div>
    <div class="ham-section-label">📚 All Chapters</div>
    <div class="seo-nav-toggle" onclick="var l=this.nextElementSibling;l.classList.toggle('open');this.querySelector('.seo-nav-toggle-arrow').style.transform=l.classList.contains('open')?'rotate(180deg)':'rotate(0deg)'" role="button" tabindex="0" aria-expanded="false">
      Class 6 <span class="seo-nav-toggle-arrow">▾</span>
    </div>
    <div class="seo-nav-links">
      <a class="seo-nav-link" href="https://bachelorpulse.in/Class6_Science_Chapter1_the_wonderfull_world_of_science_mcq.html">Science Ch 1 · The Wonderful World of Science</a>
    </div>
    <div class="seo-nav-toggle" onclick="var l=this.nextElementSibling;l.classList.toggle('open');this.querySelector('.seo-nav-toggle-arrow').style.transform=l.classList.contains('open')?'rotate(180deg)':'rotate(0deg)'" role="button" tabindex="0" aria-expanded="false">
      Class 9 <span class="seo-nav-toggle-arrow">▾</span>
    </div>
    <div class="seo-nav-links">
      <a class="seo-nav-link" href="https://bachelorpulse.in/Class9_Science_Chapter4_Describing_Motion_Around_Us_mcq.html">Science Ch 4 · Describing Motion Around Us</a>
    </div>
    <div class="seo-nav-toggle" onclick="var l=this.nextElementSibling;l.classList.toggle('open');this.querySelector('.seo-nav-toggle-arrow').style.transform=l.classList.contains('open')?'rotate(180deg)':'rotate(0deg)'" role="button" tabindex="0" aria-expanded="false">
      Class 10 <span class="seo-nav-toggle-arrow">▾</span>
    </div>
    <div class="seo-nav-links">
      <a class="seo-nav-link" href="https://bachelorpulse.in/ncert-class-10-maths-chapter-1-real-numbers-mcq.html">Maths Ch 1 · Real Numbers</a>
      <a class="seo-nav-link" href="https://bachelorpulse.in/ncert-class-10-maths-chapter-2-polynomials-mcq.html">Maths Ch 2 · Polynomials</a>
      <a class="seo-nav-link" href="https://bachelorpulse.in/ncert-class-10-science-chapter-1-chemical-reactions-equations-mcq.html">Science Ch 1 . Chemical Reactions and Equations</a>
    </div>
  </div>
</div>
<div class="guide-overlay" id="guideOverlay">
  <div class="guide-card">
    <div class="guide-dots" id="guideDots"></div>
    <span class="guide-step-icon" id="guideIcon"></span>
    <div class="guide-step-title" id="guideTitle"></div>
    <div class="guide-step-body" id="guideBody"></div>
    <div class="guide-nav">
      <button class="guide-skip" onclick="closeGuide()" aria-label="Skip the tour">Skip Tour</button>
      <div class="guide-nav-right">
        <button class="guide-btn guide-btn-prev" id="guidePrev" onclick="guideStep(-1)" aria-label="Previous step">← Back</button>
        <button class="guide-btn guide-btn-next" id="guideNext" onclick="guideStep(1)" aria-label="Next step">Next →</button>
      </div>
    </div>
    <div class="guide-progress-text" id="guideProgress"></div>
  </div>
</div>
<button id="rprtFab" title="Koi dikkat? Report karein" aria-label="Report a problem">🚩</button>
<div id="rprtToast"></div>
<div class="bp-auth-overlay" id="bpLoginOverlay">
  <div class="bp-auth-modal">
    <button class="bp-auth-close" onclick="BPAuth.closeLogin()">✕</button>
    <span class="bp-auth-emoji">🎓</span>
    <div class="bp-auth-title">Welcome to BachelorPulse</div>
    <div class="bp-auth-sub">Sign in to sync your progress, earn badges, and unlock your full potential.</div>
    <button class="bp-google-btn" id="bpGoogleBtn" onclick="BPAuth.signInGoogle()">
      <svg class="bp-google-icon" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Continue with Google
    </button>
    <div class="bp-auth-error" id="bpAuthError"></div>
  </div>
</div>
<div class="bp-auth-overlay" id="bpUsernameOverlay">
  <div class="bp-auth-modal">
    <div class="bp-uname-progress"><div class="bp-uname-progress-bar" id="bpUnameProgressBar" style="width:66%"></div></div>
    <div id="bpUnameAvatarWrap" class="bp-uname-avatar-placeholder" style="display:none">🎓</div>
    <img id="bpUnameAvatar" class="bp-uname-avatar" src="" alt="" style="display:none" onerror="this.style.display='none';document.getElementById('bpUnameAvatarWrap').style.display='flex'"/>
    <div class="bp-uname-greeting" id="bpUnameGreeting">Almost there!</div>
    <div class="bp-uname-step-badge">Step 2 of 2 &mdash; Set Username</div>
    <div class="bp-auth-title" style="margin-bottom:6px">Pick your username</div>
    <div class="bp-auth-sub" style="margin-bottom:20px">This is your public identity on BachelorPulse.<br>Choose wisely - it <strong style="color:#f59e0b">cannot be changed</strong> later.</div>
    <div class="bp-uname-wrap">
      <label class="bp-uname-label" for="bpUnameInput">Your username</label>
      <div class="bp-uname-row" id="bpUnameRow">
        <span class="bp-uname-prefix">@</span>
        <input class="bp-uname-input" id="bpUnameInput" type="text" maxlength="20" placeholder="e.g. rohit_class10" autocomplete="off" spellcheck="false" autocapitalize="none"/>
      </div>
      <div class="bp-uname-rules">
        <span class="bp-uname-rule">🔡 lowercase only</span>
        <span class="bp-uname-rule">🔢 numbers ok</span>
        <span class="bp-uname-rule">_ underscores ok</span>
        <span class="bp-uname-rule">3-20 chars</span>
      </div>
      <div class="bp-uname-status" id="bpUnameStatus"></div>
    </div>
    <button class="bp-uname-submit" id="bpUnameSave" disabled onclick="BPAuth.saveUsername()">Confirm Username ✓</button>
    <div class="bp-auth-error" id="bpUnameError"></div>
  </div>
</div>
<div class="bp-profile-overlay" id="bpProfileOverlay" onclick="BPAuth.closeProfile()"></div>
<div class="bp-profile-dropdown" id="bpProfileDropdown">
  <div class="bp-profile-name" id="bpProfileName">@username</div>
  <div class="bp-profile-email" id="bpProfileEmail"></div>
  <div class="bp-profile-divider"></div>
  <div class="bp-profile-item danger" onclick="BPAuth.signOut()">🚪 Sign Out</div>
</div>
<div id="bpBadgeUnlockOverlay" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;">
  <div id="bpBadgeUnlockCard" style="background:linear-gradient(145deg,#1a1a2e,#16213e,#0f3460);border:2px solid;border-radius:28px;padding:36px 32px 28px;text-align:center;max-width:340px;width:90%;position:relative;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7);">
    <div id="bpBadgeUnlockBurst" style="position:absolute;inset:0;pointer-events:none;"></div>
    <div style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;font-weight:800;margin-bottom:12px;opacity:.8;" id="bpBadgeUnlockCat">Achievement Unlocked</div>
    <div id="bpBadgeUnlockIcon" style="font-size:5rem;line-height:1;margin-bottom:6px;display:block;"></div>
    <div id="bpBadgeUnlockName" style="font-family:Arial,sans-serif;font-size:1.6rem;font-weight:900;margin-bottom:4px;"></div>
    <div id="bpBadgeUnlockSub" style="font-size:.88rem;opacity:.75;margin-bottom:20px;line-height:1.5;"></div>
    <button onclick="BPBadgeUnlock.close()" style="background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:999px;color:#111;font-weight:800;font-size:.92rem;padding:11px 32px;cursor:pointer;font-family:Arial,sans-serif;transition:filter .2s;" onmouseover="this.style.filter='brightness(1.12)'" onmouseout="this.style.filter=''">🚀 Keep Going!</button>
  </div>
</div>
<div id="bpMilestoneBadgeToast" style="position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(80px);z-index:9800;opacity:0;pointer-events:none;transition:opacity .4s ease,transform .4s cubic-bezier(.34,1.56,.64,1);white-space:nowrap;">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid #f59e0b;border-radius:999px;padding:10px 22px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(245,158,11,.35);">
    <span id="bpMilestoneIcon" style="font-size:1.5rem;"></span>
    <div>
      <div id="bpMilestoneTitle" style="font-family:Arial,sans-serif;font-size:.88rem;font-weight:800;color:#fbbf24;"></div>
      <div id="bpMilestoneSub" style="font-size:.7rem;color:#93a8c0;"></div>
    </div>
  </div>
</div>
`;

export function injectUiShell() {
  if (document.getElementById('pdOverlay')) return;
  document.body.insertAdjacentHTML('beforeend', uiShellMarkup);
}
