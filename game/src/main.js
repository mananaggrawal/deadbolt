/* =====================================================================
   MAIN — loop, movement, boot, title
   ===================================================================== */
const ROOMS = { '406': ROOM406, lamp: ROOM_LAMP, sitting: ROOM_SITTING, night: ROOM_NIGHT, lift: ROOM_LIFT, tik: ROOM_TIK, tio: ROOM_TIO, ded: ROOM_DED, sat: ROOM_SAT };
let BUILT = null;   // the mystery whose room this page has built (one per page load)
ROOM = ROOM406;

function movePlayer(dt) {
  // a room with a body (jump, crawl, climb) keeps its gravity going even while you can't walk
  if (BODY.on) {
    const stop = G.mode !== 'play' || G.uiOpen || G.cutscene || G.frozen;
    let f = 0, s = 0, mag = 1;
    if (!stop) {
      if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
      if (keys.KeyA || keys.ArrowLeft) s -= 1; if (keys.KeyD || keys.ArrowRight) s += 1;
      if (TOUCH.stick && (TOUCH.mx || TOUCH.my)) { s = TOUCH.mx; f = -TOUCH.my; mag = Math.min(1, Math.hypot(f, s)); if (mag < 0.12) { f = s = 0; } }
    }
    const run = ((keys.ShiftLeft || keys.ShiftRight) || (TOUCH.stick && mag > 0.92)) && !BODY.crouch && !DRAG.cur;
    bodyTick(dt, f, s, run, mag); holdTick(dt);
    return;
  }
  if (G.mode !== 'play' || G.uiOpen || G.cutscene || G.onChair || G.frozen) { G.moving = false; return; }
  let f = 0, s = 0, mag = 1;
  if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyA || keys.ArrowLeft) s -= 1; if (keys.KeyD || keys.ArrowRight) s += 1;
  if (TOUCH.stick && (TOUCH.mx || TOUCH.my)) { s = TOUCH.mx; f = -TOUCH.my; mag = Math.min(1, Math.hypot(f, s)); if (mag < 0.12) { f = s = 0; } }
  const run = (keys.ShiftLeft || keys.ShiftRight) && !G.crouch && !G.carrying;
  const sp = (G.crouch ? 0.85 : G.carrying ? 1.0 : run ? 2.7 : 1.5) * (TOUCH.stick ? 1.2 * mag : 1);
  const len = Math.hypot(f, s); G.moving = len > 0;
  if (!len) return;
  f /= len; s /= len;
  const sin = Math.sin(G.yaw), cos = Math.cos(G.yaw);
  const x0 = P.x, z0 = P.z;
  P.x += (-sin * f + cos * s) * sp * dt; P.z += (-cos * f - sin * s) * sp * dt;
  collide(P, 0.24, G.carrying ? O.colChair : null);
  ROOM.constrain && ROOM.constrain(P, 0.24);
  const d = Math.hypot(P.x - x0, P.z - z0);
  G.bob += d * 7.5; G.stepAcc += d;
  if (G.stepAcc > (run ? 0.8 : 0.62)) { G.stepAcc = 0; sStep(G.crouch ? 0.08 : run ? 0.24 : 0.15); }
}

let autoT = 10;
function update(dt) {
  if (G.paused) return;   // pause (and hints or the notebook opened from it): game time stops
  G.time += dt; G.play = (G.play || 0) + dt; S.elapsed += dt;
  stepTweens(dt); stepTimers(dt);
  movePlayer(dt);
  freeLookTick(dt);
  G.eye = lerp(G.eye, G.eyeT, Math.min(1, dt * 6));
  const bob = G.moving ? Math.sin(G.bob) * 0.022 : 0;
  const sh = G.shake > 0 ? (Math.random() - 0.5) * 0.03 * G.shake : 0;
  camera.position.set(P.x, G.eye + bob, P.z);
  camera.rotation.set(G.pitch + sh, G.yaw + sh, 0);
  camera.updateMatrixWorld();
  G.probeT = (G.probeT || 0) + 1;
  if (G.probeT % 2 === 0 || G.uiOpen || G.cutscene || G.frozen) G.hover = (!G.uiOpen && !G.cutscene && !G.carrying && !G.frozen) ? probe() : null;
  updatePrompt();
  ROOM.update(dt);
  clickHintTick();
  G.fearT = Math.max(0, (G.fearT || 0) - dt * 0.12);
  G.fear = Math.max(G.fearT, G.fear - dt * 0.22);
  G.black = lerp(G.black, G.blackT || 0, Math.min(1, dt * 3));
  G.red = Math.max(0, G.red - dt * 0.2);
  G.shake = Math.max(0, (G.shake || 0) - dt);
  const pu = post.uniforms; pu.fear.value = G.fear * 0.55; pu.black.value = G.black; pu.flash.value = G.flash; pu.red.value = G.red; pu.time.value = G.time;
  updateListener();
  if (saveT > 0) { saveT -= dt; if (saveT <= 0) flushSave(); }
  autoT -= dt; if (autoT <= 0) { autoT = 10; flushSave(); }
}

function render(dt) {
  if (REAL.on) updateProj();
  const su = renderer.shadowMap.needsUpdate; renderer.shadowMap.needsUpdate = false;
  ROOM.preRender(dt);
  renderer.shadowMap.needsUpdate = su;
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  renderer.shadowMap.needsUpdate = false;
  if (!REAL.on || REAL.ao) {
    camera.layers.disable(1); scene.overrideMaterial = normalMat;
    renderer.setRenderTarget(rtNormal); renderer.setClearColor(0x8080ff, 1); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; camera.layers.enable(1);
  }
  renderBloom();
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}

/* title static */
const stc = $('#static'), sg = stc.getContext('2d'); stc.width = 160; stc.height = 96; const simg = sg.createImageData(160, 96);
let stFlip = 0;
function drawStatic() { if ((stFlip ^= 1)) return; const d = simg.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } sg.putImageData(simg, 0, 0); }

// phones that can't hold ~24 frames a second step down to a lower resolution (twice at most)
const PERF = { acc: 0, n: 0 };
function perfTick(raw) {
  if (!G.touch || G.mode !== 'play' || UI.kind || document.hidden || (G.play || 0) < 6 || raw > 0.5) { PERF.acc = PERF.n = 0; return; }
  PERF.acc += raw; PERF.n++;
  if (PERF.acc < 4) return;
  const fps = PERF.n / PERF.acc; PERF.acc = PERF.n = 0;
  if (fps < 24 && PR > 0.74) setRenderScale(PR > 0.9 ? 0.85 : 0.72);
}

let last = performance.now();
function frame(t) {
  const raw = Math.max(0, (t - last) / 1000), dt = Math.min(0.05, raw); last = t;
  requestAnimationFrame(frame);
  try {
    if (G.mode === 'home') drawHome(t / 1000);
    else if (G.mode === 'title') { if (ROOM.titleFx) ROOM.titleFx(stc, sg, t / 1000); else drawStatic(); }
    else if (G.mode === 'play') { update(dt); render(dt); perfTick(raw); }
  } catch (e) { if (!G.errLogged) { G.errLogged = true; console.error(e); } }
}

// Begin / Continue on the title screen. Sound, full screen and the screen wake lock all need the tap itself;
// on an upright phone the room then waits until the phone is turned sideways (touchAwaitLandscape).
function startGame(cont) {
  initAudio(); touchFullscreen(); wakeLock(true);
  if (G.touch && isPortrait()) { touchAwaitLandscape(cont); return; }
  beginGame(cont);
}
function beginGame(cont) {
  document.body.classList.add('playing'); if (G.touch) fsButton();
  const saved = store.get(ROOM.saveKey);
  if (cont && saved) S = Object.assign(ROOM.defaults(), saved); else { store.del(ROOM.saveKey); S = ROOM.defaults(); }
  ROOM.applyState();
  ROOM.startAmbience();
  HOST.emit('room_start', { room: ROOM.id, cont: !!(cont && saved) });
  $('#title').hidden = true; $('#hud').classList.remove('hide');
  G.mode = 'play'; G.lockFromClick = true; lockPointer();
  if (cont && S.player) { P.x = S.player.x; P.z = S.player.z; G.yaw = S.player.yaw; G.pitch = S.player.pitch || 0; G.eye = G.eyeT = 1.62; if (BODY.on) bodyPlace(S.player.x, S.player.y || 0, S.player.z, S.player.yaw, !!S.player.cr); ROOM.resumed && ROOM.resumed(); updatePrompt(true); toast(ROOM.backText || 'Back where you left off.'); }
  else ROOM.wake();
  canvas.focus();
}

// open a mystery's title screen, building its room on first entry; a different room needs a fresh page
function enterMystery(id) {
  const m = releasedMysteries().find(x => x.id === id); if (!m) return;
  if (BUILT && BUILT.id !== id) { reloadInto(id); return; }
  if (!BUILT) ROOM = ROOMS[id];
  $('#home').hidden = true; $('#end').hidden = true; $('#title').hidden = false; G.mode = 'title';
  $('#title').scrollTop = 0;
  renderLobby(m, startGame);
  if (!BUILT) buildMystery(m); else if (BUILT.ready) lobbyReady();
}
async function buildMystery(m) {
  BUILT = { id: m.id, ready: false };
  try { await Promise.race([Promise.all(['40px "Reenie Beanie"', '24px VT323', '20px "Special Elite"', '14px "IBM Plex Mono"', '20px "IM Fell English"', '20px "Caveat"', '20px "Oswald"', '20px "Permanent Marker"', '20px "Kalam"', '20px "Playfair Display"', 'italic 20px "Cormorant Garamond"', '20px "Cormorant Garamond"', '20px "Pinyon Script"', '20px Teko', '600 20px Teko', '20px "Tiro Devanagari Hindi"', '20px "Noto Sans KR"', '700 20px "Noto Sans KR"', '900 20px "Noto Sans KR"', '20px "Nanum Pen Script"', '20px "Nanum Myeongjo"', '20px "Rubik Dirt"', '20px "Saira Stencil One"', '20px "Ruslan Display"', '20px "Marck Script"', '20px "Russo One"', '20px "Allerta Stencil"', '20px "La Belle Aurore"'].map(f => document.fonts.load(f))), wait(3500)]); } catch (e) {}
  ROOM.build();
  S = ROOM.defaults(); ROOM.applyState();
  renderer.shadowMap.needsUpdate = true;
  buildRayList();
  const hidden = []; scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (e) {}
  hidden.forEach(o => o.visible = false);
  BUILT.ready = true;
  if (G.mode === 'title') lobbyReady();
}
async function boot() {
  onResize();
  initTouch();
  // the website syncs results from the player's account before the first screen draws
  const mr = HOST.mr();
  if (mr) { try { mr.attach && mr.attach(hostState); if (mr.ready) await Promise.race([mr.ready, wait(3000)]); } catch (e) {} }
  const sel = takeSelection();
  if (sel) enterMystery(sel.id); else renderHome();
  const bootEl = $('#boot'); if (bootEl) { bootEl.classList.add('gone'); setTimeout(() => bootEl.remove(), 500); }
  try { window.claude?.hot?.snapshot?.(() => { if (G.mode === 'play') flushSave(); return {}; }); } catch (e) {}
}



requestAnimationFrame(frame);
boot();
/*DEBUG*/
// test handle for headless runs (dev build only; build.py prod and site strip this block)
window.__lethe = {
  G, P, ROOMS, scene, camera, render, update, UI, INTER, probe, act, results, enterMystery, reloadInto, finishRoom, envFromScene, hostState, A, PZ,
  THREE, collide, colliders, isShown, BODY, DRAG, HOLD, bodySupport, bodyResolve, bodyPlace, touchActions, updatePrompt, openHints, openPause,
  get S() { return S; }, set S(v) { S = v; },
  get ROOM() { return ROOM; },
  get renderer() { return renderer; },
};
/*END*/


