function toGDriveViewUrl(url) {
if (!url) return url;
if (/drive\.google\.com\/uc\?export=view/.test(url)) return url;
if (/drive\.google\.com\/uc.*export=download/.test(url))
return url.replace('export=download', 'export=view');
const id = url.match(/\/d\/([a-zA-Z0-9_-]{15,})/)?.[1]
|| url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/)?.[1];
if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
return url;
}
function openUrlViewer(url, title, backTo, chapterLabel){
window.BPQuizState.urlViewerFrom = backTo;
const container = document.getElementById('urlViewerContainer');
const isImage    = /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url);
const isGDrive   = /drive\.google\.com/.test(url);
const isGHRaw    = /raw\.githubusercontent\.com/.test(url);
const isMindMap  = title.toLowerCase().includes('mind map') || isImage || isGDrive || isGHRaw;
const isSolution  = title.toLowerCase().includes('solution');
const isShortNote = title.toLowerCase().includes('short note');
let contentHtml = '';
const mmViewUrl     = isGHRaw ? url : toGDriveViewUrl(url);
const mmDownloadUrl = isGDrive ? mmViewUrl.replace('export=view', 'export=download') : url;
if(isMindMap){
contentHtml = `
<div class="mindmap-wrap" id="mindmapWrap">
<div class="mm-skeleton" id="mmSkeleton">
<span style="animation:spin 1s linear infinite;display:inline-block">⏳</span>
Loading Mind Map…
</div>
<div class="mm-img-error" id="mmImgError">
<span class="err-icon">🖼️</span>
<h3>Mind Map Could Not Load</h3>
<p>Check your internet connection or try again.</p>
</div>
<div id="mmScrollWrap"
style="display:none;overflow:auto;width:100%;height:80vh;
-webkit-overflow-scrolling:touch;border-radius:12px;
background:var(--bg);touch-action:pan-x pan-y pinch-zoom;
-ms-touch-action:pan-x pan-y pinch-zoom;">
<img id="mindmapImg"
src="${mmViewUrl}"
crossorigin="anonymous"
alt="${chapterLabel} Mind Map"
width="800" height="450"
style="display:block;width:100%;height:auto;cursor:zoom-in;
transition:width 0.3s ease;
image-rendering:high-quality;
image-rendering:-webkit-optimize-contrast;
-ms-interpolation-mode:nearest-neighbor;"
onload="(function(){
document.getElementById('mmSkeleton').style.display='none';
document.getElementById('mmImgError').style.display='none';
document.getElementById('mmScrollWrap').style.display='block';
var h=document.getElementById('mmZoomHint');
if(h) h.style.display='flex';
})()"
onerror="(function(){
document.getElementById('mmSkeleton').style.display='none';
document.getElementById('mmImgError').style.display='flex';
})()"
onclick="toggleMmZoom(this)"
oncontextmenu="return false;"
ondragstart="return false;"
</div>
</div>
<div class="mm-dual-action">
<button class="mm-action-btn mm-dl-btn" id="mmDlBtn"
onclick="downloadMindMapJpg('${mmViewUrl}', '${chapterLabel}')">
<span class="mm-btn-icon">📥</span>
<div class="mm-btn-text">
<div class="mm-btn-label">Save as JPG</div>
<div class="mm-btn-sub">Max quality · 100%</div>
</div>
</button>
</div>
`;
StrikeManager.updateStrike();
} else {
contentHtml = `<iframe class="url-content-frame" src="${url}"
title="${title} – ${chapterLabel}"
allow="fullscreen"
></iframe>`;
}
const headerRight = isMindMap
? `<span style="font-size:.75rem;color:var(--muted);padding:5px 12px;">🔍 Click image to zoom</span>`
: `<a class="url-viewer-open" href="${url}" target="_blank" rel="noopener">⬡ Open in New Tab</a>`;
let actionHub = '';
if(isSolution || isShortNote){
StrikeManager.updateStrike(); // 🔥 Student opened study content — credit activity
const downloadUrl = GDRIVE_PLACEHOLDER;
actionHub = `<div class="action-hub">
<a class="action-btn action-btn-download"
href="${downloadUrl}" target="_blank" rel="noopener">
⬇️ Download PDF
</a>`;
if(isShortNote){
actionHub += `<button class="action-btn action-btn-copy" id="copyNoteBtn"
onclick="copyShortNoteText('${url}')">
📋 Copy Text
</button>`;
}
actionHub += `</div>`;
}
const storageKey = `bp_done_${window.BPQuizState.selClass}_${window.BPQuizState.selSubject}_${encodeURIComponent(window.BPQuizState.selChapter)}`;
const isDone = localStorage.getItem(storageKey) === '1';
const progressHtml = `
<div class="chapter-complete-wrap" id="chapterCompleteWrap">
<div class="chapter-complete-left">
<div class="complete-checkbox ${isDone ? 'done' : ''}" id="completeCheckbox"
onclick="toggleChapterDone('${storageKey}')">
${isDone ? '✅' : ''}
</div>
<div>
<div class="complete-text">Mark Chapter as Completed</div>
<div class="complete-sub">Your progress is saved on this device</div>
</div>
</div>
<div class="complete-badge ${isDone ? 'visible' : ''}" id="completeBadge">🏆 Done!</div>
</div>`;
container.innerHTML = `
<div class="url-viewer-wrap">
<div class="url-viewer-header">
<div class="url-viewer-title">${title} — ${chapterLabel}</div>
<div style="display:flex;align-items:center;gap:8px;">
${headerRight}
</div>
</div>
${contentHtml}
${actionHub}
</div>
${progressHtml}`;
const wrap = document.getElementById('mindmapWrap');
if(wrap) wrap.addEventListener('contextmenu', e => e.preventDefault());
window.showScreen('urlviewer');
}
function toggleMmZoom(img) {
const isZoomed = img.dataset.zoomed === '1';
if (!isZoomed) {
img.style.width  = '250%';
img.style.cursor = 'zoom-out';
img.dataset.zoomed = '1';
const hint = document.getElementById('mmZoomHint');
if (hint) hint.innerHTML = '🔍 Zoomed in &nbsp;·&nbsp; Tap again to zoom out &nbsp;·&nbsp; Scroll/drag to pan';
} else {
img.style.width  = '100%';
img.style.cursor = 'zoom-in';
img.dataset.zoomed = '0';
const hint = document.getElementById('mmZoomHint');
if (hint) hint.innerHTML = '🔍 Tap image to zoom in &nbsp;·&nbsp; Tap again to zoom out';
}
}
async function downloadMindMapJpg(url, chapterLabel) {
const btn = document.getElementById('mmDlBtn') || (event && event.currentTarget ? event.currentTarget : null);
const origLabel = btn ? btn.querySelector('.mm-btn-label') : null;
const origSub   = btn ? btn.querySelector('.mm-btn-sub')   : null;
if (origLabel) origLabel.textContent = 'Downloading…';
if (origSub)   origSub.textContent   = 'Please wait';
try {
const resp = await fetch(url, { mode: 'cors' });
if (!resp.ok) throw new Error('fetch failed');
const blob = await resp.blob();
let finalBlob = blob;
if (!blob.type.includes('jpeg')) {
finalBlob = await new Promise((res, rej) => {
const img = new Image();
const blobUrl = URL.createObjectURL(blob);
img.onload = () => {
const c = document.createElement('canvas');
c.width  = img.naturalWidth  || img.width;
c.height = img.naturalHeight || img.height;
const ctx = c.getContext('2d');
const isBright = document.getElementById('mmModeBright') &&
document.getElementById('mmModeBright').classList.contains('active');
ctx.fillStyle = isBright ? '#ffffff' : '#0f1724';
ctx.fillRect(0, 0, c.width, c.height);
ctx.drawImage(img, 0, 0);
URL.revokeObjectURL(blobUrl);
c.toBlob(b => b ? res(b) : rej(new Error('canvas failed')), 'image/jpeg', 1.0);
};
img.onerror = () => { URL.revokeObjectURL(blobUrl); rej(new Error('img load failed')); };
img.src = blobUrl;
});
}
const fileName = (chapterLabel || 'mindmap').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_mindmap.jpg';
const a = document.createElement('a');
a.href = URL.createObjectURL(finalBlob);
a.download = fileName;
document.body.appendChild(a);
a.click();
setTimeout(() => { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 2000);
if (origLabel) origLabel.textContent = 'Saved! ✓';
if (origSub)   origSub.textContent   = 'Check your downloads';
setTimeout(() => {
if (origLabel) origLabel.textContent = 'Save as JPG';
if (origSub)   origSub.textContent   = 'Max quality · 100%';
}, 3000);
} catch(err) {
if (origLabel) origLabel.textContent = 'Save as JPG';
if (origSub)   origSub.textContent   = 'Max quality · 100%';
window.open(url, '_blank', 'noopener');
}
}
(function () {
let mmInitDist = 0, mmInitWidth = 0, mmPinching = false;
function getMmDist(t) {
const dx = t[0].clientX - t[1].clientX;
const dy = t[0].clientY - t[1].clientY;
return Math.hypot(dx, dy);
}
document.addEventListener('touchstart', function (e) {
const img = document.getElementById('mindmapImg');
const wrap = document.getElementById('mmScrollWrap');
if (!img || !wrap || e.touches.length !== 2) return;
if (!wrap.contains(e.target)) return;
mmPinching = true;
mmInitDist = getMmDist(e.touches);
mmInitWidth = img.offsetWidth;
mmInitWrapWidth = wrap.offsetWidth; 
e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', function (e) {
const img = document.getElementById('mindmapImg');
const wrap = document.getElementById('mmScrollWrap');
if (!mmPinching || !img || !wrap || e.touches.length !== 2) return;
const dist = getMmDist(e.touches);
const ratio = dist / mmInitDist;
const wrapWidth = mmInitWrapWidth; 
const newPct = Math.min(400, Math.max(100, (mmInitWidth * ratio / wrapWidth) * 100));
img.style.width = newPct + '%';
img.dataset.zoomed = newPct > 110 ? '1' : '0';
img.style.cursor = newPct > 110 ? 'zoom-out' : 'zoom-in';
e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', function (e) {
if (e.touches.length < 2) mmPinching = false;
});
})();
let lbScale = 1;
function lbZoom(factor) {
const img = document.getElementById('lightboxImg');
if (!img) return;
lbScale = Math.min(4, Math.max(0.5, lbScale * factor));
img.style.transform = `scale(${lbScale})`;
const pct = document.getElementById('lbZoomPct');
if (pct) pct.textContent = Math.round(lbScale * 100) + '%';
}
function lbZoomReset() {
const img = document.getElementById('lightboxImg');
if (!img) return;
lbScale = 1;
img.style.transform = 'scale(1)';
const pct = document.getElementById('lbZoomPct');
if (pct) pct.textContent = '100%';
const scroll = document.getElementById('lightboxScroll');
if (scroll) { scroll.scrollLeft = 0; scroll.scrollTop = 0; }
}
(function () {
let initDist = 0, initScale = 1, lbPinching = false;
function getDistance(t) {
const dx = t[0].clientX - t[1].clientX;
const dy = t[0].clientY - t[1].clientY;
return Math.hypot(dx, dy);
}
document.addEventListener('touchstart', function (e) {
const overlay = document.getElementById('lightboxOverlay');
if (!overlay || !overlay.classList.contains('open')) return;
if (e.touches.length === 2) {
lbPinching = true;
initDist  = getDistance(e.touches);
initScale = lbScale;
e.preventDefault();
}
}, { passive: false });
document.addEventListener('touchmove', function (e) {
const overlay = document.getElementById('lightboxOverlay');
const img = document.getElementById('lightboxImg');
if (!lbPinching || !img || !overlay || !overlay.classList.contains('open')) return;
if (e.touches.length === 2) {
const dist = getDistance(e.touches);
lbScale = Math.min(4, Math.max(0.5, initScale * (dist / initDist)));
img.style.transform = `scale(${lbScale})`;
const pct = document.getElementById('lbZoomPct');
if (pct) pct.textContent = Math.round(lbScale * 100) + '%';
e.preventDefault();
}
}, { passive: false });
document.addEventListener('touchend', function (e) {
if (e.touches.length < 2) lbPinching = false;
});
})();
function openLightbox(src, label) {
const overlay = document.getElementById('lightboxOverlay');
const img     = document.getElementById('lightboxImg');
const lbl     = document.getElementById('lightboxLabel');
const scroll  = document.getElementById('lightboxScroll');
img.style.transition = 'none';
img.style.opacity = '0';
img.src = '';
lbl.textContent = label;
if (scroll) scroll.scrollTop = 0;
lbScale = 1;
img.style.transform = 'scale(1)';
const zoomPct = document.getElementById('lbZoomPct');
if (zoomPct) zoomPct.textContent = '100%';
const zoomCtrl = document.getElementById('lbZoomControls');
overlay.classList.add('open');
document.body.style.overflow = 'hidden';
const spinner = document.getElementById('lightboxSpinner');
if (spinner) { spinner.style.display = 'flex'; }
img.style.display = 'none';
const loader = new Image();
loader.onload = function () {
img.src = src;
if (spinner) spinner.style.display = 'none';
img.style.display = 'block';
if (zoomCtrl) zoomCtrl.style.display = 'flex';
requestAnimationFrame(() => {
img.style.transition = 'opacity 0.4s ease-in-out';
requestAnimationFrame(() => {
img.style.opacity = '1';
});
});
};
loader.onerror = function () {
if (spinner) spinner.style.display = 'none';
if (zoomCtrl) zoomCtrl.style.display = 'flex';
img.src = src;
img.style.display = 'block';
img.style.transition = 'opacity 0.4s ease-in-out';
img.style.opacity = '1';
};
loader.src = src;
let isDragging = false, startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;
let mmInitWrapWidth = 0;
function onMouseDown(e) {
if (e.button !== 0) return;
isDragging = true;
const cachedLeft = scroll.offsetLeft; 
const cachedTop  = scroll.offsetTop;
startX = e.pageX - cachedLeft;
startY = e.pageY - cachedTop;
scrollLeft = scroll.scrollLeft;
scrollTop  = scroll.scrollTop;
img.style.cursor = 'grabbing';
e.preventDefault();
}
function onMouseMove(e) {
if (!isDragging) return;
const dx = e.pageX - startX; 
const dy = e.pageY - startY;
scroll.scrollLeft = scrollLeft - dx;
scroll.scrollTop  = scrollTop  - dy;
}
function onMouseUp() {
isDragging = false;
img.style.cursor = 'grab';
}
img.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
overlay._dragCleanup = () => {
img.removeEventListener('mousedown', onMouseDown);
document.removeEventListener('mousemove', onMouseMove);
document.removeEventListener('mouseup', onMouseUp);
};
}
function closeLightbox() {
const overlay  = document.getElementById('lightboxOverlay');
const img      = document.getElementById('lightboxImg');
const spinner  = document.getElementById('lightboxSpinner');
const zoomCtrl = document.getElementById('lbZoomControls');
img.style.opacity = '0';
overlay.classList.remove('open');
document.body.style.overflow = '';
if (zoomCtrl) zoomCtrl.style.display = 'none';
lbScale = 1;
img.style.transform = 'scale(1)';
if (overlay._dragCleanup) { overlay._dragCleanup(); overlay._dragCleanup = null; }
setTimeout(() => {
if (!overlay.classList.contains('open')) {
img.src = '';
img.style.display = 'none';
if (spinner) spinner.style.display = 'flex';
}
}, 450);
}
function closeLightboxOutside(e) {
if (e.target === document.getElementById('lightboxOverlay') ||
e.target === document.getElementById('lightboxScroll')) {
closeLightbox();
}
}
document.addEventListener('keydown', e => {
if (e.key === 'Escape') { closeLightbox(); if(typeof BookmarkSystem!=='undefined') BookmarkSystem.close(); }
});
async function copyShortNoteText(url){
const btn = document.getElementById('copyNoteBtn');
if(!btn) return;
btn.textContent = '⏳ Fetching...';
btn.disabled = true;
try {
const r = await fetch(url);
const text = await r.text();
const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, '\n').trim();
await navigator.clipboard.writeText(clean);
btn.innerHTML = '✅ Copied!';
btn.classList.add('copied');
setTimeout(() => {
btn.innerHTML = '📋 Copy Text';
btn.classList.remove('copied');
btn.disabled = false;
}, 2500);
} catch(err) {
btn.innerHTML = '❌ Failed';
btn.disabled = false;
setTimeout(() => { btn.innerHTML = '📋 Copy Text'; }, 2000);
}
}
function toggleChapterDone(key){
const cb = document.getElementById('completeCheckbox');
const badge = document.getElementById('completeBadge');
const isDone = localStorage.getItem(key) === '1';
if(isDone){
localStorage.removeItem(key);
cb.classList.remove('done');
cb.innerHTML = '';
badge.classList.remove('visible');
} else {
localStorage.setItem(key, '1');
cb.classList.add('done');
cb.innerHTML = '✅';
badge.classList.add('visible');
StrikeManager.recordActivity(); // 🔥 Trigger strike update
try{if(typeof BadgeSystem!=='undefined'){const _bs=BadgeSystem._ls();_bs.chapDone=Object.keys(localStorage).filter(k=>k.startsWith('bp_done_')&&localStorage.getItem(k)==='1').length;BadgeSystem._ss(_bs);BadgeSystem._cb(_bs);}}catch(e){}
}
}


Object.assign(window, {
  toGDriveViewUrl, openUrlViewer, toggleMmZoom, downloadMindMapJpg, lbZoom, lbZoomReset,
  openLightbox, closeLightbox, closeLightboxOutside, copyShortNoteText, toggleChapterDone
});
