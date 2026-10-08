/* =====================================================================
   TOUCH — phones and tablets, played in landscape.
   Left thumb: a floating stick to walk (push to the edge to run).
   Right thumb: drag anywhere to look. Buttons: use things, hints, notebook, pause.
   Upright phones can read the title and end screens; Begin waits for the phone to turn.
   ===================================================================== */
const TOUCH = { on: IS_TOUCH, mx: 0, my: 0, stick: null, look: null, key: '', extraKey: '' };
const STICK_R = 58;
const isPortrait = () => innerHeight > innerWidth;
const FS_ICON = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 6.5V2h4.5M11.5 2H16v4.5M16 11.5V16h-4.5M6.5 16H2v-4.5"/></svg>';
const fsAllowed = () => !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);

function initTouch() {
  if (!TOUCH.on) return;
  G.touch = true; document.body.classList.add('touch');
  const hud = $('#hud');
  const tc = document.createElement('div'); tc.id = 'tc';
  tc.innerHTML = `<div id="tcStick" hidden><i></i></div>
    <div class="tc-top"><button class="tcb sq fs" data-tc="fs" aria-label="Full screen" hidden>${FS_ICON}</button><button class="tcb" data-tc="hints">Hints</button><button class="tcb" data-tc="nb">Notebook</button><button class="tcb sq" data-tc="pause" aria-label="Pause">&#10074;&#10074;</button></div>
    <div class="tc-acts" id="tcActs"></div><div class="tc-extra" id="tcExtra"></div>`;
  hud.appendChild(tc);
  const tap = (el, fn) => { el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(e); }); };
  tc.querySelectorAll('[data-tc]').forEach(b => tap(b, () => {
    const k = b.dataset.tc;
    if (k === 'fs') { touchFullscreen(); return; }
    if (G.mode !== 'play') return;
    if (k === 'pause') { touchRelease(); openPause(); return; }   // pausing works mid-cutscene (it stops game time)
    if (G.cutscene) return;
    if (k === 'hints') openHints(); else openNotebook();
  }));
  // the look/walk surface is the canvas itself
  const cv = canvas;
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || G.mode !== 'play' || G.uiOpen) return;
    e.preventDefault(); wakeAudio();
    const leftSide = e.clientX < innerWidth * 0.42;
    if (leftSide && !TOUCH.stick) { TOUCH.stick = { id: e.pointerId, x: e.clientX, y: e.clientY }; showStick(e.clientX, e.clientY, 0, 0); }
    else if (!TOUCH.look) TOUCH.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  }, { passive: false });
  cv.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') return;
    const s = TOUCH.stick, l = TOUCH.look;
    if (s && e.pointerId === s.id) {
      let dx = e.clientX - s.x, dy = e.clientY - s.y; const d = Math.hypot(dx, dy);
      if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
      TOUCH.mx = dx / STICK_R; TOUCH.my = dy / STICK_R; showStick(s.x, s.y, dx, dy);
    } else if (l && e.pointerId === l.id) {
      const dx = e.clientX - l.x, dy = e.clientY - l.y; l.x = e.clientX; l.y = e.clientY;
      if (G.mode !== 'play' || G.uiOpen || Math.abs(dx) > 200 || Math.abs(dy) > 200) return;
      const k = (3.1 / Math.max(480, innerWidth)) * (camera.fov / 70);
      G.yaw -= dx * k; G.pitch = clamp(G.pitch - dy * k, -1.45, 1.45);
    }
  }, { passive: false });
  const end = e => {
    if (TOUCH.stick && e.pointerId === TOUCH.stick.id) { TOUCH.stick = null; TOUCH.mx = TOUCH.my = 0; $('#tcStick').hidden = true; }
    if (TOUCH.look && e.pointerId === TOUCH.look.id) TOUCH.look = null;
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('lostpointercapture', end);
  // turning the phone: upright pauses a room in play; sideways starts one that is waiting to begin
  const orient = () => {
    if (G.pendingStart && !isPortrait()) { const p = G.pendingStart; G.pendingStart = null; document.body.classList.remove('starting'); beginGame(p.cont); return; }
    if (G.mode === 'play' && isPortrait() && !UI.kind) { touchRelease(); openPause(); }
  };
  addEventListener('resize', orient);
  addEventListener('orientationchange', () => setTimeout(orient, 250));
  $('#rotBack').addEventListener('click', () => { G.pendingStart = null; document.body.classList.remove('starting'); wakeLock(false); });
  document.addEventListener('fullscreenchange', fsButton);
  // swap keyboard wording for touch wording
  const f = $('#tKeys'); if (f) f.textContent = 'Left thumb to walk · right thumb to look · buttons to use things';
  const ph = $('#tPhone');
  if (ph) {
    const ua = navigator.userAgent || '', iphone = /iPhone|iPod/.test(ua), standalone = navigator.standalone === true || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    const lines = [];
    if (iphone && !standalone && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) lines.push('For full screen on iPhone: tap Share, then Add to Home Screen.');
    if (iphone && !navigator.audioSession) lines.push('No sound? Check the silent switch on the side of your phone.');
    if (lines.length) { ph.textContent = lines.join(' '); ph.hidden = false; }
  }
}
function touchRelease() { TOUCH.stick = TOUCH.look = null; TOUCH.mx = TOUCH.my = 0; const s = $('#tcStick'); if (s) s.hidden = true; }
function showStick(x, y, dx, dy) { const s = $('#tcStick'); s.hidden = false; s.style.left = x + 'px'; s.style.top = y + 'px'; s.firstChild.style.transform = `translate(${dx}px,${dy}px)`; }
// Begin on an upright phone: keep the tap (sound and full screen need it) and start once the phone is sideways
function touchAwaitLandscape(cont) {
  G.pendingStart = { cont };
  $('#rotMsg').textContent = 'Turn your phone sideways to begin.';
  document.body.classList.add('starting');
}
// a full-screen button for phones that left full screen (Android back gesture, notifications)
function fsButton() {
  const b = document.querySelector('#tc .fs'); if (!b) return;
  b.hidden = !fsAllowed() || !!document.fullscreenElement;
}

// the action buttons mirror the on-screen prompt
function touchActions() {
  if (G.mode !== 'play' || G.uiOpen || G.cutscene) return [];
  const ov = ROOM.touchOverride && ROOM.touchOverride(); if (ov) return ov;
  if (G.carrying) return [{ label: 'Set it down', run: () => act(0) }];
  const out = [];
  if (G.hover) actionsOf(G.hover).slice(0, 2).forEach((a, i) => out.push({ label: a.label, run: () => act(i), main: i === 0 }));
  if (G.onChair) out.push({ label: 'Step down', run: () => ROOM.stepDown && ROOM.stepDown() });
  return out;
}
function touchRefresh() {
  if (!G.touch) return;
  const tc = $('#tc'); if (tc) tc.classList.toggle('busy', !!G.cutscene);
  const acts = touchActions(), key = acts.map(a => a.label).join('|');
  if (key !== TOUCH.key) {
    TOUCH.key = key; const box = $('#tcActs'); box.innerHTML = '';
    acts.forEach((a, i) => { const b = document.createElement('button'); b.className = 'tcb act' + (i === 0 ? ' main' : ''); b.textContent = a.label; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const cur = touchActions()[i]; if (cur) { cur.run(); updatePrompt(true); } }); box.appendChild(b); });
  }
  const ex = [];
  if (G.mode === 'play' && !G.uiOpen && !G.cutscene) {
    if (ROOM.toggleCrouch && !G.onChair && !G.carrying && !G.frozen) ex.push({ label: G.crouch ? 'Stand' : 'Crouch', run: () => ROOM.toggleCrouch() });
    if (ROOM.touchExtras) ex.push(...ROOM.touchExtras());
  }
  const ek = ex.map(a => a.label).join('|');
  if (ek !== TOUCH.extraKey) {
    TOUCH.extraKey = ek; const box = $('#tcExtra'); box.innerHTML = '';
    ex.forEach((a, i) => { const b = document.createElement('button'); b.className = 'tcb small'; b.textContent = a.label; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); a.run(); TOUCH.extraKey = ''; }); box.appendChild(b); });
  }
}
// on phones, ask for the whole screen and a sideways lock (both are allowed to fail; iPhones have neither)
function touchFullscreen() {
  if (!G.touch) return;
  const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
  try {
    if (document.fullscreenElement) { lock(); return; }
    const el = document.documentElement, p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null;
    if (p && p.then) p.then(lock).catch(() => {});
  } catch (e) {}
}
// keep the screen awake while a room is being played (phones dim after half a minute of no touches,
// and some rooms ask you to stand still or hide)
const WAKE = { lock: null, want: false };
async function wakeLock(on) {
  WAKE.want = on;
  try {
    if (on && !WAKE.lock && navigator.wakeLock && document.visibilityState === 'visible') {
      const l = await navigator.wakeLock.request('screen');
      if (!WAKE.want) { l.release().catch(() => {}); return; }
      WAKE.lock = l; l.addEventListener('release', () => { if (WAKE.lock === l) WAKE.lock = null; });
    } else if (!on && WAKE.lock) { const l = WAKE.lock; WAKE.lock = null; await l.release(); }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && WAKE.want) wakeLock(true); });
// a short buzz on phones that can (Android) when something jumps out
function buzz(pattern) { if (G.touch && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} } }
// the one-line controls reminder rooms show on waking
const ctrlHint = () => G.touch ? 'Left thumb to walk, right thumb to look. The buttons at the bottom right use things.' : '<kbd>H</kbd> hints &middot; <kbd>Tab</kbd> notebook &middot; <kbd>Esc</kbd> pause';
