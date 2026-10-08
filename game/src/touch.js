/* =====================================================================
   TOUCH — phones and tablets, played in landscape.
   Left thumb: a floating stick to walk (push to the edge to run).
   Right thumb: drag anywhere to look. Buttons: use things, hints, notebook, pause.
   ===================================================================== */
const TOUCH = { on: IS_TOUCH, mx: 0, my: 0, stick: null, look: null, key: '', extraKey: '' };
const STICK_R = 58;

function initTouch() {
  if (!TOUCH.on) return;
  G.touch = true; document.body.classList.add('touch');
  const hud = $('#hud');
  const tc = document.createElement('div'); tc.id = 'tc';
  tc.innerHTML = `<div id="tcStick" hidden><i></i></div>
    <div class="tc-top"><button class="tcb" data-tc="hints">Hints</button><button class="tcb" data-tc="nb">Notebook</button><button class="tcb sq" data-tc="pause" aria-label="Pause">&#10074;&#10074;</button></div>
    <div class="tc-acts" id="tcActs"></div><div class="tc-extra" id="tcExtra"></div>`;
  hud.appendChild(tc);
  const tap = (el, fn) => { el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(e); }); };
  tc.querySelectorAll('[data-tc]').forEach(b => tap(b, () => { const k = b.dataset.tc; if (G.mode !== 'play' || G.cutscene) return; if (k === 'hints') openHints(); else if (k === 'nb') openNotebook(); else openPause(); }));
  // the look/walk surface is the canvas itself
  const cv = canvas;
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || G.mode !== 'play' || G.uiOpen) return;
    e.preventDefault();
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
  // turning the phone upright pauses the game
  addEventListener('resize', () => { if (G.mode === 'play' && innerHeight > innerWidth && !UI.kind) { touchRelease(); openPause(); } });
  // swap keyboard wording for touch wording
  const f = $('#tKeys'); if (f) f.textContent = 'Left thumb to walk · drag with the right thumb to look · buttons to use things';
}
function touchRelease() { TOUCH.stick = TOUCH.look = null; TOUCH.mx = TOUCH.my = 0; const s = $('#tcStick'); if (s) s.hidden = true; }
function showStick(x, y, dx, dy) { const s = $('#tcStick'); s.hidden = false; s.style.left = x + 'px'; s.style.top = y + 'px'; s.firstChild.style.transform = `translate(${dx}px,${dy}px)`; }

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
// on phones, ask for the whole screen and a sideways lock (both are allowed to fail)
function touchFullscreen() {
  if (!G.touch) return;
  try { const el = document.documentElement, p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null; if (p && p.then) p.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {}
}
// the one-line controls reminder rooms show on waking
const ctrlHint = () => G.touch ? 'Left thumb to walk, right thumb to look. The buttons at the bottom right use things.' : '<kbd>H</kbd> hints &middot; <kbd>Tab</kbd> notebook &middot; <kbd>Esc</kbd> pause';


