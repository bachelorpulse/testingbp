let _authModule = null;
async function getAuthModule() {
  if (_authModule) return _authModule;
  const [appMod, authMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js')
  ]);
  const app = appMod.initializeApp({
    apiKey:            "AIzaSyCIL8vGCepu1ZZSk-UIVhBxJs3ExHHD8x8",
    authDomain:        "bachelorpulse19.firebaseapp.com",
    projectId:         "bachelorpulse19",
    storageBucket:     "bachelorpulse19.firebasestorage.app",
    messagingSenderId: "784421328477",
    appId:             "1:784421328477:web:dfdba9bd894de03a52dfb4"
  });
  const auth = authMod.getAuth(app);
  _authModule = { app, auth, ...authMod };
  return _authModule;
}
let db = null;
async function getDB() {
  if (db) return db;
  const { app } = await getAuthModule();
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  db = getFirestore(app);
  return db;
}
async function getFirestoreFns() {
  return import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
}
async function syncDataToCloud() {
  if (!_user) return;
  try {
    const { doc, setDoc, serverTimestamp } = await getFirestoreFns();
    const _db = await getDB();
    const stats    = (() => { try { return JSON.parse(localStorage.getItem('bp_stats')    || '{}'); } catch(e) { return {}; } })();
    const earned   = (() => { try { return JSON.parse(localStorage.getItem('bp_badges')   || '{}'); } catch(e) { return {}; } })();
    const bmarks   = (() => { try { return JSON.parse(localStorage.getItem('bp_bookmarks')|| '[]'); } catch(e) { return []; } })();
    const strike   = (() => { try { return JSON.parse(localStorage.getItem('bp_strike')   || '{}'); } catch(e) { return {}; } })();
    await setDoc(doc(_db, 'users', _user.uid), {
      bp_stats:     stats,
      bp_badges:    earned,
      bp_bookmarks: bmarks,
      bp_strike:    strike,
      lastSync:     serverTimestamp()
    }, { merge: true });
  } catch(err) {
  }
}
async function loadDataFromCloud(uid) {
  try {
    const { doc, getDoc } = await getFirestoreFns();
    const _db = await getDB();
    const snap = await getDoc(doc(_db, 'users', uid));
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.bp_stats     && typeof data.bp_stats === 'object')
      localStorage.setItem('bp_stats',     JSON.stringify(data.bp_stats));
    if (data.bp_badges    && typeof data.bp_badges === 'object')
      localStorage.setItem('bp_badges',    JSON.stringify(data.bp_badges));
    if (data.bp_bookmarks && Array.isArray(data.bp_bookmarks))
      localStorage.setItem('bp_bookmarks', JSON.stringify(data.bp_bookmarks));
    if (data.bp_strike    && typeof data.bp_strike === 'object')
      localStorage.setItem('bp_strike',    JSON.stringify(data.bp_strike));
    if (typeof window.BadgeSystem !== 'undefined') window.BadgeSystem.init();
    if (typeof window.BookmarkSystem !== 'undefined') { try { window.BookmarkSystem._refreshUI(); } catch(_) {} }
    if (typeof window.StrikeManager !== 'undefined') window.StrikeManager.init();
  } catch(err) {
  }
}
window._bpSyncToCloud = syncDataToCloud;
let _user     = null;   // Firebase user object
let _uname    = null;   // confirmed username
let _valid    = false;  // current typed username passed availability check
let _debounce    = null;   // debounce timer
let _charWarnTimer = null;   // invalid-char warning auto-clear timer
let _busy     = false;  // true while signInGoogle is handling Firestore itself
let _sessionId       = null;   // Is device ka unique session ID
let _sessionUnsub    = null;   // onSnapshot unsubscribe function
let _kickedOut       = false;  // Ek baar kicked hone ke baad dobara fire na ho
function _genSessionId() {
  return 'sess_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
}
function _showKickedScreen() {
  if (_kickedOut) return;
  _kickedOut = true;
  document.querySelectorAll('.bp-auth-overlay, .bp-profile-overlay').forEach(el => {
    el.classList.remove('open');
  });
  document.body.style.overflow = 'hidden';
  let kicked = document.getElementById('bpKickedOverlay');
  if (!kicked) {
    kicked = document.createElement('div');
    kicked.id = 'bpKickedOverlay';
    kicked.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(3,6,18,0.97);
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      padding:32px;text-align:center;
      backdrop-filter:blur(8px);
      animation:fadeUp .35s ease both;
    `;
    kicked.innerHTML = `
      <div style="font-size:3.5rem;margin-bottom:16px;filter:drop-shadow(0 0 24px rgba(239,68,68,.5))">📵</div>
<div style="font-family:Arial,sans-serif;font-size:1.5rem;font-weight:900;
        background:linear-gradient(135deg,#ef4444,#f87171);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;
        background-clip:text;margin-bottom:10px;line-height:1.2;">
        You're Active on Another Device!
      </div>
<div style="font-size:.95rem;color:#93a8c0;max-width:320px;line-height:1.6;margin-bottom:8px;">
        Your account was just signed in on <strong style="color:#fbbf24">another device</strong> using the same ID at the same time.
      </div>
<div style="font-size:.82rem;color:#64748b;max-width:300px;line-height:1.55;margin-bottom:28px;">
        For your security, this session has been automatically ended.<br>
        Only one device is allowed at a time. 🔒
      </div>
<button id="bpKickedReloginBtn"
        style="padding:13px 32px;background:linear-gradient(90deg,#2563eb,#4f46e5);
        border:none;border-radius:14px;color:#fff;font-family:Arial,sans-serif;
        font-size:1rem;font-weight:800;cursor:pointer;
        box-shadow:0 6px 24px rgba(59,130,246,.4);
        transition:transform .2s,box-shadow .2s;letter-spacing:.02em;">
        🔄 Login on This Device
      </button>
<div style="margin-top:14px;font-size:.75rem;color:#475569;">
        Close the other tab or device, then log in here
      </div>
    `;
    document.body.appendChild(kicked);
  }
  kicked.style.display = 'flex';
  document.getElementById('bpKickedReloginBtn').onclick = async () => {
    _kickedOut = false;
    kicked.style.display = 'none';
    document.body.style.overflow = '';
    try { const { auth: _a, signOut: _so } = await getAuthModule(); await _so(_a); } catch(_) {}
    showSection('login');
  };
}
async function _registerSession(uid) {
  _sessionId = _genSessionId();
  _kickedOut = false;
  try {
    const { doc, updateDoc, setDoc } = await getFirestoreFns();
    const _db = await getDB();
    try {
      await updateDoc(doc(_db, 'users', uid), { activeSessionId: _sessionId });
    } catch(e) {
      try { await setDoc(doc(_db, 'users', uid), { activeSessionId: _sessionId }, { merge: true }); } catch(e2) {}
    }
  } catch(e) {}
  _startSessionWatch(uid);
}
async function _startSessionWatch(uid) {
  if (_sessionUnsub) { _sessionUnsub(); _sessionUnsub = null; }
  const { doc, onSnapshot } = await getFirestoreFns();
  const _db = await getDB();
  _sessionUnsub = onSnapshot(doc(_db, 'users', uid), (snap) => {
    if (!snap.exists() || !_sessionId) return;
    const cloudSession = snap.data().activeSessionId;
    if (cloudSession && cloudSession !== _sessionId) {
      _stopSessionWatch();
      try { getAuthModule().then(({auth:_a,signOut:_so})=>_so(_a)); } catch(_) {}
      _showKickedScreen();
    }
  });
}
function _stopSessionWatch() {
  if (_sessionUnsub) { _sessionUnsub(); _sessionUnsub = null; }
  _sessionId = null;
}
const $ = id => document.getElementById(id);
const GOOGLE_SVG = `<svg class="bp-google-icon" viewBox="0 0 48 48">
<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>Continue with Google`;
if (!$('bpSpinStyle')) {
  const s = document.createElement('style');
  s.id = 'bpSpinStyle';
  s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}
function showSection(name) {
  const loginOv = $('bpLoginOverlay');
  const unameOv = $('bpUsernameOverlay');
  const btn     = $('authBtn');
  const btnTxt  = $('authBtnText');
  if (loginOv) loginOv.classList.remove('open');
  if (unameOv) unameOv.classList.remove('open');
  document.body.style.overflow = '';
  if (name === 'login') {
    const gb = $('bpGoogleBtn');
    if (gb) { gb.disabled = false; gb.innerHTML = GOOGLE_SVG; }
    if (loginOv) {
      loginOv.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  } else if (name === 'setup') {
    if (_user) {
      const firstName = _user.displayName?.split(' ')[0] || 'there';
      const greet = $('bpUnameGreeting');
      if (greet) greet.textContent = `Hey ${firstName}, almost there!`;
      const avatar = $('bpUnameAvatar');
      const wrap   = $('bpUnameAvatarWrap');
      if (_user.photoURL && avatar) {
        avatar.src           = _user.photoURL;
        avatar.style.display = 'block';
        if (wrap) wrap.style.display = 'none';
      } else {
        if (avatar) avatar.style.display = 'none';
        if (wrap)   wrap.style.display   = 'flex';
      }
    }
    const inp = $('bpUnameInput');
    const sv  = $('bpUnameSave');
    if (inp) { inp.value = ''; inp.disabled = false; }
    if (sv)  { sv.disabled = true; sv.textContent = 'Confirm Username ✓'; }
    setUnameStatus('', '');
    _valid = false;
    const pb = $('bpUnameProgressBar');
    if (pb) pb.style.width = '66%';
    if (unameOv) {
      unameOv.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    setTimeout(() => $('bpUnameInput')?.focus(), 350);
  } else if (name === 'dashboard') {
    if (btn && btnTxt) {
      btnTxt.textContent = _uname
        ? '@' + _uname
        : (_user?.displayName?.split(' ')[0] || 'You');
      btn.disabled = false;
      btn.classList.add('logged-in');
    }
    if ($('bpProfileName'))  $('bpProfileName').textContent  = _uname ? '@' + _uname : '';
    if ($('bpProfileEmail')) $('bpProfileEmail').textContent = _user?.email || '';
  } else if (name === 'loading') {
    if (btn && btnTxt) {
      btnTxt.textContent = '...';
      btn.disabled = true;
      btn.classList.remove('logged-in');
    }
  } else if (name === 'out') {
    if (btn && btnTxt) {
      btnTxt.textContent = 'Login';
      btn.disabled = false;
      btn.classList.remove('logged-in');
    }
  }
}
async function checkAndRoute(user) {
  showSection('loading');
  try {
    const { doc, getDoc } = await getFirestoreFns();
    const _db = await getDB();
    const snap = await getDoc(doc(_db, 'users', user.uid));
    if (snap.exists() && snap.data().username) {
      _uname = snap.data().username;
      await loadDataFromCloud(user.uid);
      await _registerSession(user.uid);
      showSection('dashboard');
    } else {
      showSection('setup');
    }
  } catch (err) {
    showErr('bpAuthError', 'Connection error. Please try again.');
    showSection('login');
  }
}
// Setup auth listener lazily — deferred until idle or first user interaction
// This prevents Firebase from blocking LCP on initial paint
(function deferAuthInit() {
  let _authInitStarted = false;
  async function _initAuthListener() {
    if (_authInitStarted) return;
    _authInitStarted = true;
    const { auth, onAuthStateChanged } = await getAuthModule();
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        _user  = null;
        _uname = null;
        _stopSessionWatch();
        showSection('out');
        return;
      }
      _user = user;
      if (_busy) { _busy = false; return; }
      await checkAndRoute(user);
    });
  }
  const _interactionEvts = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
  _interactionEvts.forEach(evt =>
    window.addEventListener(evt, _initAuthListener, { once: true, passive: true, capture: true })
  );
  if ('requestIdleCallback' in window) {
    requestIdleCallback(_initAuthListener, { timeout: 3500 });
  } else {
    setTimeout(_initAuthListener, 3500);
  }
})();
async function signInGoogle() {
  const btn = $('bpGoogleBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
  try {
    if (location.protocol === 'file:') {
      throw {
        code: 'auth/file-origin',
        message: 'Google login needs a real http/https origin. Open this site through localhost or bachelorpulse.in.'
      };
    }
    const { auth, signInWithPopup, GoogleAuthProvider } = await getAuthModule();
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    _user  = result.user;
    _busy  = true;
    await checkAndRoute(_user);
  } catch (err) {
    _busy = false;
    if (btn) { btn.disabled = false; btn.innerHTML = GOOGLE_SVG; }
    console.warn('[BPAuth] Google sign-in failed:', err?.code || err?.message || err);
    if (err.code === 'auth/file-origin') {
      showErr('bpAuthError', 'Login file mode me work nahi karta. Site ko localhost ya live domain se open karo.');
    } else if (err.code === 'auth/unauthorized-domain') {
      showErr('bpAuthError', 'Firebase me ye domain authorized nahi hai. Firebase Auth > Settings > Authorized domains me domain add karo.');
    } else if (err.code !== 'auth/popup-closed-by-user') {
      showErr('bpAuthError', 'Sign-in failed. Please try again. (' + (err.code || 'auth-error') + ')');
    }
  }
}
async function saveUsername() {
  const inp = $('bpUnameInput');
  const val = inp?.value.trim().toLowerCase();
  if (!_valid || !_user || !val) return;
  const sv = $('bpUnameSave');
  if (sv) { sv.disabled = true; sv.textContent = 'Saving…'; }
  try {
    const { doc, getDoc, writeBatch, serverTimestamp } = await getFirestoreFns();
    const _db = await getDB();
    const guard = await getDoc(doc(_db, 'usernames', val));
    if (guard.exists()) {
      setUnameStatus('@' + val + ' abhi abhi kisi ne le liya! Doosra try karo.', 'err');
      if (sv) { sv.disabled = false; sv.textContent = 'Confirm Username ✓'; }
      _valid = false;
      return;
    }
    const batch = writeBatch(_db);
    batch.set(doc(_db, 'usernames', val), { uid: _user.uid, createdAt: serverTimestamp() });
    batch.set(doc(_db, 'users', _user.uid), {
      username:  val,
      email:     _user.email,
      photoURL:  _user.photoURL || '',
      points:    0,
      isPremium: false,
      streak:    0,
      createdAt: serverTimestamp()
    });
    await batch.commit();
    _uname = val;
    showSection('dashboard');
  } catch (err) {
    showErr('bpUnameError', 'Save nahi hua — please try again.');
    if (sv) { sv.disabled = false; sv.textContent = 'Confirm Username ✓'; }
  }
}
async function checkUname(val) {
  const sv = $('bpUnameSave');
  _valid = false;
  if (sv) sv.disabled = true;
  if (!val)           { setUnameStatus('', '');                                      return; }
  if (val.length < 3) { setUnameStatus('Kam se kam 3 characters chahiye.', 'err'); return; }
  if (!/^[a-z0-9_]+$/.test(val)) {
    setUnameStatus('Sirf lowercase letters, numbers aur _ allowed hain.', 'err');
    return;
  }
  setUnameStatus('', 'checking');
  try {
    const { doc, getDoc } = await getFirestoreFns();
    const _db = await getDB();
    const snap = await getDoc(doc(_db, 'usernames', val));
    if (snap.exists()) {
      setUnameStatus('@' + val + ' pehle se liya hua hai.', 'err');
    } else {
      setUnameStatus(val, 'ok');
      _valid = true;
      if (sv) sv.disabled = false;
    }
  } catch (err) {
    setUnameStatus('Check nahi ho pa raha — dobara try karo.', 'err');
  }
}
function loginOrProfile() {
  if (!_user) {
    showSection('login');
  } else {
    const dd   = $('bpProfileDropdown');
    const ov   = $('bpProfileOverlay');
    const open = dd?.style.display === 'block';
    if (dd) dd.style.display = open ? 'none' : 'block';
    if (ov) ov.style.display = open ? 'none' : 'block';
  }
}
function closeLogin() {
  const loginOv = $('bpLoginOverlay');
  if (loginOv) loginOv.classList.remove('open');
  document.body.style.overflow = '';
  const gb = $('bpGoogleBtn');
  if (gb) { gb.disabled = false; gb.innerHTML = GOOGLE_SVG; }
}
function closeProfile() {
  const dd = $('bpProfileDropdown');
  const ov = $('bpProfileOverlay');
  if (dd) dd.style.display = 'none';
  if (ov) ov.style.display = 'none';
}
async function doSignOut() {
  closeProfile();
  _uname = null;
  _stopSessionWatch();
  try { const { auth, signOut } = await getAuthModule(); await signOut(auth); } catch (_) {}
}
function showErr(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}
function setUnameStatus(msg, type) {
  const st = $('bpUnameStatus');
  if (!st) return;
  st.className = 'bp-uname-status' + (type ? ' ' + type : '');
  if      (type === 'checking') st.innerHTML  = '<span style="display:inline-block;animation:spin .7s linear infinite">⏳</span> Check ho raha hai…';
  else if (type === 'ok')       st.innerHTML  = '✅ <strong>@' + msg + '</strong> available hai!';
  else if (type === 'err')      st.innerHTML  = '❌ ' + msg;
  else                          st.textContent = msg;
}
const inp = $('bpUnameInput');
if (inp) {
  inp.addEventListener('input', () => {
    const cursor  = inp.selectionStart;
    const raw     = inp.value;
    const cleaned = raw.replace(/[^a-z0-9_]/g, '').toLowerCase();
    if (cleaned !== raw) {
      inp.value = cleaned;
      try { inp.setSelectionRange(cursor - 1, cursor - 1); } catch (_) {}
      setUnameStatus('Only lowercase letters, numbers and _ allowed.', 'err');
      clearTimeout(_charWarnTimer);
      _charWarnTimer = setTimeout(() => {
        if (inp.value.trim()) setUnameStatus('', '');
      }, 2000);
    }
    const v  = inp.value.trim();
    const sv = $('bpUnameSave');
    clearTimeout(_debounce);
    _valid = false;
    if (sv) sv.disabled = true;
    if (!v) { setUnameStatus('', ''); return; }
    const pb  = $('bpUnameProgressBar');
    const pct = Math.min(66 + Math.floor((v.length / 20) * 34), 100);
    if (pb) pb.style.width = pct + '%';
    _debounce = setTimeout(() => checkUname(v), 500);
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && _valid) saveUsername();
  });
}
$('bpLoginOverlay')?.addEventListener('click', e => {
  if (e.target === $('bpLoginOverlay')) closeLogin();
});
window.BPAuth = {
  loginOrProfile,
  closeLogin,
  signInGoogle,
  saveUsername,
  closeProfile,
  signOut: doSignOut
};

/* inline block extracted from BP_clean-2.html */
/* ════════════════════════════════════════════════════════
   BP BADGE UNLOCK ANIMATION SYSTEM
════════════════════════════════════════════════════════ */