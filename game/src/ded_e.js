/* =====================================================================
   DEDUSHKA · part E: what you carry and drag, the stove, the boat, the ladders, the cellar and the
   attic, asking him for things back, the slow presence in the house, the village burning, the
   ritual, the fire, the river; sound, saving, the module
   ===================================================================== */
const NEAR2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const inIzba = () => P.x > IZ.x0 - 0.05 && P.x < IZ.x1 + 0.05 && P.z > IZ.z0 && P.z < IZ.z1 + 0.05 && BODY.y > FY - 0.3 && BODY.y < CEIL - 0.5;
const inSeni = () => P.x > SN.x0 && P.x < SN.x1 + 0.1 && P.z > SN.z0 - 0.05 && P.z < SN.z1 && BODY.y > FY - 0.3 && BODY.y < CEIL - 0.5;
const inCellar = () => BODY.y < FY - 0.5 && P.x > CELL.x0 - 0.1 && P.x < CELL.x1 + 0.1 && P.z > CELL.z0 - 0.1 && P.z < CELL.z1 + 0.1;
const inAttic = () => BODY.y > CEIL && P.x > OUT.x0 && P.x < OUT.x1 && P.z > OUT.z0 && P.z < OUT.z1;
const inBarn = () => P.x > BARN.x0 && P.x < BARN.x1 && P.z > BARN.z0 && P.z < BARN.z1;
const outdoors = () => !inIzba() && !inSeni() && !inCellar() && !inAttic();
const holding = id => HOLD.cur === id;
const took = id => S.inv.includes(id);
const camF = () => new THREE.Vector3(-Math.sin(G.yaw), 0, -Math.cos(G.yaw));
const A_ = (label, run) => ({ label, run });

/* ---------------- sound ---------------- */
function sMatch(pos) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 2600, 0.8), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.02, t + 0.25); g.gain.linearRampToValueAtTime(0.0001, t + 0.9); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.2 }); n.start(t); n.stop(t + 1); }
function sWhoosh(pos, vol = 0.4) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 300, 0.7), g = ctx.createGain(); lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(1800, t + 0.6); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); n.connect(lp); lp.connect(g); route(g, { pos, wet: 0.3 }); n.start(t); n.stop(t + 2); }
function sCrackle(pos, n = 6, vol = 0.12) { for (let i = 0; i < n; i++) after(Math.random() * 0.8, () => sClick(pos, vol * rand(0.4, 1.2), rand(900, 4200))); }
function sCough() { if (!A.ready) return; for (let k = 0; k < 3; k++) { const ctx = A.ctx, t = now() + k * 0.32, n = noiseSrc(false), bp = filt('bandpass', 700, 1.2), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); n.connect(bp); bp.connect(g); route(g, { wet: 0.15 }); n.start(t); n.stop(t + 0.3); } }
function sMeow(pos, vol = 0.22, pitch = 1) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), f1 = filt('bandpass', 900, 3), f2 = filt('bandpass', 2400, 4), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520 * pitch, t); o.frequency.linearRampToValueAtTime(760 * pitch, t + 0.22); o.frequency.linearRampToValueAtTime(480 * pitch, t + 0.62); f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1300, t + 0.25); f1.frequency.linearRampToValueAtTime(800, t + 0.6); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol, t + 0.42); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); o.connect(f1); o.connect(f2); const m = ctx.createGain(); m.gain.value = 0.6; f1.connect(g); f2.connect(m); m.connect(g); route(g, { pos, wet: 0.2 }); o.start(t); o.stop(t + 0.75); }
function sPurr(pos, dur = 3, vol = 0.12) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 220, 1), g = ctx.createGain(), am = ctx.createOscillator(), amg = ctx.createGain(); am.frequency.value = 26; amg.gain.value = vol * 0.8; am.connect(amg); amg.connect(g.gain); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.4); g.gain.setValueAtTime(vol, t + dur - 0.5); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(lp); lp.connect(g); route(g, { pos, wet: 0.1, ref: 0.4 }); n.start(t); am.start(t); n.stop(t + dur + 0.1); am.stop(t + dur + 0.1); }
function sHiss(pos, vol = 0.18) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), hp = filt('highpass', 2500, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); n.connect(hp); hp.connect(g); route(g, { pos, wet: 0.2 }); n.start(t); n.stop(t + 1); }
function sKeen(pos, vol = 0.12, dur = 4) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), bp = filt('bandpass', 1400, 6), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(820, t); o.frequency.linearRampToValueAtTime(980, t + dur * 0.4); o.frequency.linearRampToValueAtTime(700, t + dur); vib.frequency.value = 6.5; vg.gain.value = 14; vib.connect(vg); vg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.8); g.gain.setValueAtTime(vol, t + dur - 1); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(bp); bp.connect(g); route(g, { pos, wet: 0.6, ref: 6 }); o.start(t); vib.start(t); o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1); }
function sHowl(vol = 0.06) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), bp = filt('bandpass', 900, 5), g = ctx.createGain(), dur = 3.2; o.type = 'sawtooth'; o.frequency.setValueAtTime(380, t); o.frequency.linearRampToValueAtTime(560, t + 0.8); o.frequency.linearRampToValueAtTime(520, t + 2.2); o.frequency.linearRampToValueAtTime(330, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.5); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(bp); bp.connect(g); route(g, { pos: new THREE.Vector3(-70 + Math.random() * 30, 1, -30), wet: 0.8, ref: 20 }); o.start(t); o.stop(t + dur + 0.1); }
function sSplash(pos, vol = 0.3) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 1100, 0.6), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.3 }); n.start(t); n.stop(t + 1.3); }
function sOar() { if (!A.ready) return; sCreak(camera.position.clone().add(new THREE.Vector3(0.6, -0.3, 0)), 0.45, 0.1, 140); after(0.5, () => sSplash(camera.position.clone().add(new THREE.Vector3(0.8, -0.8, -0.5)), 0.12)); }
function sBoom(pos, vol = 0.5) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 140, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5); n.connect(lp); lp.connect(g); route(g, { pos, wet: 0.6, ref: 8 }); n.start(t); n.stop(t + 2.6); }
function sTractor(dur = 9) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), lp = filt('lowpass', 260, 1), g = ctx.createGain(), am = ctx.createOscillator(), amg = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 42; am.frequency.value = 11; amg.gain.value = 0.03; am.connect(amg); amg.connect(g.gain); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 2); g.gain.linearRampToValueAtTime(0.05, t + dur - 2); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(lp); lp.connect(g); route(g, { pos: new THREE.Vector3(-40, 1, -11), wet: 0.6, ref: 15 }); o.start(t); am.start(t); o.stop(t + dur); am.stop(t + dur); }
function sPatter(pos) { for (let i = 0; i < 7; i++) after(i * 0.17 + Math.random() * 0.04, () => sKnock(pos.clone().add(new THREE.Vector3(i * 0.18, 0, 0)), 0.12, 0, 0.7)); }

/* ---------------- holding things ---------------- */
function handMeshes() {
  // what each thing looks like in your hands (children of the camera)
  const mk = (build, pos, rot) => { const h = grp(0, 0, 0, camera); build(h); return h; };
  O.woodArm = grp(0, -50, 0, scene); O.woodArm.userData.keep = true; for (let i = 0; i < 5; i++) { const l = cyl(0.06, 0.06, 0.5, M.birch, (i % 3 - 1) * 0.11, 0.06 + Math.floor(i / 3) * 0.1, 0, O.woodArm, 6); l.rotation.x = Math.PI / 2; l.rotation.y = (hash1(i) - 0.5) * 0.2; }
  O.woodHand = mk(h => { for (let i = 0; i < 5; i++) { const l = cyl(0.055, 0.055, 0.46, M.birch, (i % 3 - 1) * 0.1, Math.floor(i / 3) * 0.09, 0, h, 6); l.rotation.z = Math.PI / 2; l.rotation.y = (hash1(i) - 0.5) * 0.15; } });
  O.tarHand = mk(h => { buildTarPotMesh(h); });
  O.oarHand1 = mk(h => { const o = grp(0, 0, 0, h); buildOarMesh(o); o.rotation.set(-Math.PI / 2 + 0.25, 0.2, 0); o.position.set(0, 0, 0.9); });
  O.oarHand2 = mk(h => { const o = grp(0, 0, 0, h); buildOarMesh(o); o.rotation.set(-Math.PI / 2 + 0.25, 0.2, 0); o.position.set(0, 0, 0.9); });
  O.potHand = mk(h => { lathe([[0, 0], [0.08, 0.005], [0.105, 0.06], [0.11, 0.12], [0.095, 0.18], [0.082, 0.2], [0.092, 0.215], [0.088, 0.22]], M.clay, 0, 0, 0, h, 20); O.potHandLid = lathe([[0, 0.05], [0.04, 0.045], [0.095, 0.01], [0.098, 0]], M.clay, 0, 0.215, 0, h, 18); const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2, 4, 3), std({ color: 0x8a7a68, roughness: 1, side: THREE.DoubleSide })); cloth.position.set(0, 0.06, 0.06); cloth.rotation.x = -0.3; h.add(cloth); });
  O.basketHand = mk(h => { const b = grp(0, 0, 0, h); buildBasketMesh(b); O.basketHandB = b; });
  O.ladderHand = mk(h => { const l = grp(0, 0, 0, h); buildLadderMesh(l, 4.3); l.rotation.set(-Math.PI / 2, 0, 0.15); l.position.set(0.1, 0, 1.2); });
  O.rollerHands = [0, 1].map(() => mk(h => { const l = mesh(logGeo(1.5, 0.1), M.birch, 0, 0, 0, h); l.rotation.z = Math.PI / 2; l.rotation.y = 0.5; }));
  O.hookHand = mk(h => { const p = grp(0, 0, 0, h); pole([0, 0, 0], [0, 2.6, 0], 0.022, M.wood, p, 7); const hk = grp(0, 2.6, 0, p); pole([0, 0, 0], [0, 0.18, 0], 0.012, M.iron, hk, 5); p.rotation.set(-Math.PI / 2 + 0.35, 0.1, 0); p.position.set(0, 0, 0.8); });
}
function setupHold() {
  const lay = (obj, r = 0.03) => (x, y, z) => { obj.rotation.order = 'YXZ'; obj.rotation.set(-Math.PI / 2, G.yaw, 0); obj.position.y = y + r; };
  holdable('wood', { name: HOLD_NAMES.wood, world: O.woodArm, hand: O.woodHand, handPos: [0, -0.3, -0.48], handRot: [0.1, 0, 0] });
  holdable('tar', { name: HOLD_NAMES.tar, world: O.tar, hand: O.tarHand, handPos: [0.24, -0.39, -0.56], handRot: [0.2, 0, 0] });
  holdable('oar1', { name: HOLD_NAMES.oar1, world: O.oar1, hand: O.oarHand1, handPos: [0.25, -0.3, -0.3], handRot: [0, 0, 0], onDrop: lay(O.oar1, 0.03) });
  holdable('oar2', { name: HOLD_NAMES.oar2, world: O.oar2, hand: O.oarHand2, handPos: [0.25, -0.3, -0.3], handRot: [0, 0, 0], onDrop: lay(O.oar2, 0.03) });
  holdable('pot', { name: HOLD_NAMES.pot, world: O.pot, hand: O.potHand, handPos: [0.21, -0.4, -0.56], handRot: [0.25, 0, 0] });
  holdable('basket', { name: HOLD_NAMES.basket, world: O.basket, hand: O.basketHand, handPos: [0.2, -0.42, -0.5], handRot: [0.25, 0.2, 0], droppable: true, noDrop: 'Not until you\'re across the water.' });
  holdable('ladder', { name: HOLD_NAMES.ladder, world: O.ladder, hand: O.ladderHand, handPos: [0.35, -0.35, -0.2], handRot: [0, 0, 0], onDrop: (x, y, z) => { O.ladder.rotation.order = 'YXZ'; O.ladder.rotation.set(-Math.PI / 2, G.yaw, 0); O.ladder.position.y = y + 0.04; } });
  O.rollers.forEach((r, i) => holdable('roller' + i, { name: HOLD_NAMES['roller' + i], world: r, hand: O.rollerHands[i], handPos: [0.15, -0.32, -0.45], handRot: [0.1, 0, 0], onDrop: (x, y, z) => { r.rotation.set(0, G.yaw, 0); r.position.y = y + 0.1; } }));
  holdable('hook', { name: HOLD_NAMES.hook, world: O.hook, hand: O.hookHand, handPos: [0.25, -0.35, -0.25], handRot: [0, 0, 0], onDrop: lay(O.hook, 0.025) });
}
function pickUp(id) {
  if (G.cutscene) return;
  if (S.flags.ritual && HOLD.cur === 'basket' && id !== 'basket') { toast('Not with him in your arms.', 2400); return; }
  holdTake(id); if (!S.inv.includes(id)) S.inv.push(id); S.held = id; renderInv(id);
  if (!S.ev.toldHold) { S.ev.toldHold = true; toast(`In your hands: <b>${esc(HOLD_NAMES[id])}</b>. ${G.touch ? 'The Put down button' : '<kbd>Q</kbd>'} puts it down. You can carry one thing at a time.`, 6500); }
  syncHands(); save();
}
// the thing leaves your hands without being put down (it went into the stove, the boat, the basket...)
function useUpHeld() { const id = HOLD.cur; if (!id) return; const d = HOLD.defs[id]; HOLD.cur = null; if (d.hand) d.hand.visible = false; S.inv = S.inv.filter(i => i !== id); S.held = null; renderInv(); updatePrompt(true); save(); }
function onHold(id, on) { renderer.shadowMap.needsUpdate = true; if (!on) { S.inv = S.inv.filter(i => i !== id); if (S.held === id) S.held = null; renderInv(); } syncHands(); }
function syncHands() {
  // the basket shows what's in it, in the world and in your hands
  const c = (S && S.basket) || {};
  for (const ud of [O.basket && O.basket.userData, O.basketHandB && O.basketHandB.userData]) { if (!ud) continue; if (ud.shoe) ud.shoe.visible = !!c.shoe; if (ud.pot) ud.pot.visible = !!c.pot; }
}

/* ---------------- climbing ---------------- */
function climbPath(pts, dur, end, o = {}) {
  if (V.climb || G.cutscene) return;
  if (HOLD.cur && o.noHold) { toast(o.noHold, 2800); return; }
  G.cutscene = true; V.climb = { t: 0 }; BODY.crouch = false; G.crouch = false;
  const segs = []; let total = 0; for (let i = 1; i < pts.length; i++) { const l = pts[i].distanceTo(pts[i - 1]); segs.push(l); total += l; }
  if (o.yaw !== undefined) G.yaw = o.yaw; if (o.pitch !== undefined) G.pitch = o.pitch;
  O.climbSolid.on = true;
  tween(dur, k => {
    let d = k * total, i = 0; while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const p = pts[i].clone().lerp(pts[i + 1], segs[i] ? Math.min(1, d / segs[i]) : 1);
    P.x = p.x; P.z = p.z; BODY.y = BODY.ys = p.y; BODY.vy = 0; BODY.ground = true; solidSet(O.climbSolid, p.x - 0.15, p.x + 0.15, p.y - 0.2, p.y, p.z - 0.15, p.z + 0.15);
    G.eye = G.eyeT = p.y + (o.crouchEye && k > o.crouchEye ? BODY.crouchEye : BODY.standEye); BODY.eye = G.eye - p.y;
    const rung = Math.floor(k * (o.rungs || 10)); if (rung !== V.climb.rung) { V.climb.rung = rung; if (o.rungs) { sCreak(camera.position.clone(), 0.3, 0.12, 120); sKnock(camera.position.clone().add(new THREE.Vector3(0, -0.4, 0)), 0.12, 0, 1); } }
    if (o.look) o.look(k);
  }, () => {
    V.climb = null; G.cutscene = false; O.climbSolid.on = false;
    bodyPlace(end.x, end.y, end.z, end.yaw ?? G.yaw, !!end.crouch); G.pitch = end.pitch ?? 0;
    o.done && o.done(); updatePrompt(true); save();
  }, k => k);
}
function climbSeni(up) {
  if (up) {
    if (S.hatchBolt) {
      // a few rungs, a shove at the hatch, and back down
      const b = new THREE.Vector3(2.85, FY, 2.6), t = new THREE.Vector3(2.85, FY + 1.05, 2.25);
      climbPath([b, t, t.clone(), b], 3.0, { x: 2.85, y: FY, z: 2.0, yaw: Math.PI, pitch: 0.2 }, { noHold: 'Not with your hands full.', yaw: Math.PI, pitch: 0.7, rungs: 6, look: k => { if (k > 0.4 && k < 0.6 && !V.climb.shoved) { V.climb.shoved = true; sThunk(new THREE.Vector3(2.85, CEIL, 1.7), 0.5, 140); after(0.15, () => sThunk(new THREE.Vector3(2.85, CEIL, 1.7), 0.4, 120)); } }, done: () => { flag('hatchTried'); sayI('You put your shoulder to the hatch. It lifts a finger\'s width and stops dead, with a clank of iron: it\'s bolted from above. From up there. Somebody bolted it from up there.', 7500); } });
      return;
    }
    climbPath([new THREE.Vector3(2.85, FY, 2.6), new THREE.Vector3(2.85, CEIL - 1.3, 2.15), new THREE.Vector3(2.85, AF, 1.7), new THREE.Vector3(2.85, AF, 1.0)], 3.2, { x: 2.85, y: AF, z: 1.0, yaw: 0 }, { noHold: 'Not with your hands full. Put it down first (Q).', yaw: Math.PI, pitch: 0.9, rungs: 8, done: () => flag('atticSeen') });
  } else {
    climbPath([new THREE.Vector3(2.85, AF, 1.0), new THREE.Vector3(2.85, AF, 1.7), new THREE.Vector3(2.85, CEIL - 1.3, 2.15), new THREE.Vector3(2.85, FY, 2.6)], 3.2, { x: 2.85, y: FY, z: 2.0, yaw: 0 }, { noHold: 'Not with your hands full. Put it down first (Q).', yaw: 0, pitch: -0.9, rungs: 8 });
  }
}
function climbGable(up) {
  if (up) climbPath([new THREE.Vector3(3.0, 0, 4.3), new THREE.Vector3(3.0, 3.0, 3.42), new THREE.Vector3(3.0, AF, 3.0), new THREE.Vector3(3.0, AF, 2.2)], 4.2, { x: 3.0, y: AF, z: 2.2, yaw: 0 }, { noHold: 'You need both hands for the ladder. Put it down first (Q).', yaw: 0, pitch: 0.55, rungs: 13, crouchEye: 0.7, done: () => { if (!S.flags.atticSeen) { flag('atticSeen'); after(0.8, () => sayI('The attic: dry dust, cobwebs, the smell of old herbs. Old bast shoes hang in a row from a pole under the ridge, and there are small footprints in the dust, going toward them.', 8000)); } } });
  else climbPath([new THREE.Vector3(3.0, AF, 2.3), new THREE.Vector3(3.0, AF, 3.0), new THREE.Vector3(3.0, 3.0, 3.42), new THREE.Vector3(3.0, 0, 4.35)], 4.0, { x: 3.0, y: 0, z: 4.45, yaw: Math.PI }, { noHold: 'You need both hands for the ladder. Put it down first (Q).', yaw: Math.PI, pitch: -0.5, rungs: 13 });
}
function climbCellar(down) {
  if (down) climbPath([new THREE.Vector3(3.0, FY, -1.45), new THREE.Vector3(3.0, FY, -2.15), new THREE.Vector3(3.0, CY, -2.1), new THREE.Vector3(3.0, CY, -2.85)], 3.0, { x: 3.0, y: CY, z: -2.85, yaw: 0, crouch: true }, { noHold: 'Not with your hands full. Put it down first (Q).', yaw: 0, pitch: -0.6, rungs: 6, crouchEye: 0.55, done: () => { if (!S.flags.cellarSeen) { flag('cellarSeen'); cellarArrive(); } } });
  else climbPath([new THREE.Vector3(3.0, CY, -2.7), new THREE.Vector3(3.0, CY, -2.1), new THREE.Vector3(3.0, FY, -2.15), new THREE.Vector3(3.0, FY, -1.4)], 3.0, { x: 3.0, y: FY, z: -1.35, yaw: Math.PI }, { noHold: 'Not with your hands full. You\'ll need both hands for the ladder.', yaw: Math.PI, pitch: 0.4, rungs: 6 });
}

/* ---------------- the torch, the lamp ---------------- */
function torchOn() { return S.torch !== 0; }
function toggleTorch() { if (G.cutscene) return; S.torch = torchOn() ? 0 : 1; sClick(camera.position, 0.2, 1800); save(); }
function lightLamp() {
  if (!took('matches')) { needMatches(); return; }
  flag('lampLit'); sMatch(O.lamp.position); after(0.4, () => { sWhoosh(O.lamp.position, 0.08); }); renderer.shadowMap.needsUpdate = true;
  sayI('You lift the glass, strike a match and touch it to the wick. A yellow flame climbs, and the room comes up out of the dark around you: her table, her icon, her bed with its pillows.', 7000);
}
function needMatches() {
  if (S.flags.matchesMissing) { sayI('Your matches are gone. You had them in your pocket when you lay down.', 4000); return; }
  flag('matchesMissing');
  sayI('You feel in your pockets for your matches. They\'re not there. You had them when you lay down. You turn out every pocket.', 6500);
  after(5.5, async () => { const o = { fx: 'tape', volume: 0.95 }; sayI('Babushka\'s voice, in the hospital, holding your wrist:', 2600); await wait(2200); await line('b2', BABA + ', yesterday', 'If he hides something, don\'t swear at him. Tie a red thread to the table leg and say: domovoi, domovoi, play with it and give it back.', o); heard('b2'); await line('b3', BABA + ', yesterday', 'And go out of the room. He doesn\'t like being watched.', o); heard('b3'); });
}

/* ---------------- asking him for things back ---------------- */
function missingThing() {
  if (S.flags.matchesMissing && !S.flags.matchesBack) return 'matches';
  if ((S.flags.pegsSeen || S.flags.oar1Taken) && !S.flags.chestMoved && !S.flags.oar2Taken) return 'oar';
  return null;
}
function askHim() {
  const m = missingThing();
  line('m1', MITYA, 'Domovoi, domovoi, play with it and give it back.', { volume: 0.85 });
  if (!m) { after(3.0, () => sayI('Nothing answers. Nothing of yours is missing that he has.', 4000)); return; }
  S.asked = m; V.ask = { phase: 'said', t: 0 }; save();
  after(3.2, () => { if (S.asked) sayI('The house is very quiet. Babushka said to go out of the room.', 4500); });
}
function askUpdate(dt) {
  if (!S.asked || !V.ask) { if (S.asked && !V.ask) V.ask = { phase: 'said', t: 0 }; return; }
  const a = V.ask; a.t += dt;
  if (a.phase === 'said' && !inIzba()) { a.phase = 'out'; a.t = 0; }
  if (a.phase === 'out' && inIzba()) { a.phase = 'said'; a.t = 0; }
  if (a.phase === 'out' && a.t > 2.5) {
    a.phase = 'given';
    if (S.asked === 'matches') { O.matchBox.visible = true; S.ev.matchesOnTable = true; sKnock(new THREE.Vector3(4.9, FY + 0.8, -5.0), 0.25, 0, 0.6); }
    else if (S.asked === 'oar') { moveChestToTrap(); flag('chestMoved'); sScrape(new THREE.Vector3(3, FY + 0.2, -1.5), 1.4, 0.45); after(1.0, () => sThunk(new THREE.Vector3(3, FY + 0.2, -2.1), 0.6, 90)); placeCat('chest'); }
    save();
  }
  if (a.phase === 'given' && inIzba()) {
    if (S.asked === 'matches') after(0.8, () => sayI('On the table, in the middle of the oilcloth, standing on its end: your box of matches.', 5500));
    else after(0.8, () => { sayI('The chest has moved. Somebody has dragged it across the floor and stood it right on top of the cellar hatch, and the cat is sitting on it, staring down at the boards. Under the floor, something knocks.', 8000); sKnocks(new THREE.Vector3(3, FY - 0.3, -2.1), 3, 0.5, 0.5, 1); });
    S.asked = null; V.ask = null; save();
  }
}
function moveChestToTrap() { O.chest.position.copy(POS.chestTrap); DRAG.defs.chest.sync(); S.props.chest = { x: POS.chestTrap.x, y: POS.chestTrap.y, z: POS.chestTrap.z }; S.chestOnTrap = true; }
const chestOnTrap = () => { const p = O.chest.position; return rectHits(DRAG.defs.chest.solid, TRAP.x0 + 0.1, TRAP.x1 - 0.1, TRAP.z0 + 0.1, TRAP.z1 - 0.1); };

/* ---------------- the stove ---------------- */
function stoveActions() {
  const st = S.stove, a = [];
  if (S.zas) return [A_('Take the iron door off the mouth', () => { S.zas = false; placeZas(); sScrape(O.zas.position, 0.4, 0.2); sThunk(O.zas.position, 0.3, 160); save(); }), look('The big whitewashed stove that takes up a quarter of the room. Its arched mouth is closed with an iron door.')];
  if (st === 'cold') {
    if (holding('wood')) a.push(A_('Put the logs in', () => { useUpHeld(); S.woodIn = true; showStoveFuel(); sThunk(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, -1.6), 0.4, 200); sKnock(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, -1.6), 0.25, 0.15, 0.4); save(); }));
    if (S.woodIn && !S.barkIn && took('bark')) a.push(A_('Tuck the birch bark under the logs', () => { drop('bark'); S.barkIn = true; showStoveFuel(); sScrape(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, -1.8), 0.3, 0.1); save(); }));
    if (S.woodIn && S.barkIn) a.push(took('matches') ? A_('Light it', lightStove) : A_('Light it', needMatches));
    if (a.length < 2) a.push(look(S.woodIn ? (S.barkIn ? 'Logs and bark, laid ready.' : 'The logs are in. Logs won\'t catch from a match by themselves: they need something to start them.') : 'The oven is cold and swept, and empty. It needs wood.'));
    return a.slice(0, 2);
  }
  if (holding('tar') && !S.tarIn) a.push(A_('Put the tar pot in to warm', () => { useUpHeld(); S.tarIn = true; S.tarT = 0; O.tar.visible = true; O.tar.position.set(MOUTH.x + 0.2, MOUTH.y0 + 0.01, -2.0); O.tar.rotation.set(0, 0, 0); sKnock(O.tar.position, 0.2, 0, 0.3); save(); }));
  if (S.tarIn) a.push(A_(S.tarT > 18 ? 'Take the tar pot out' : 'Take the tar pot out (still stiff)', () => { S.tarIn = false; S.tarHot = S.tarT > 18; S.tarHot2 = S.tarHot; pickUp('tar'); if (!S.tarHot) sayI('Still stiff as toffee. It needs longer in the heat.', 3500); else sayI('The tar has melted to a black syrup that smokes and smells of pine.', 4000); }));
  if (st === 'burning') { if (a.length < 2) a.push(look(S.stoveT < 30 ? 'The fire is roaring up inside, pulling hard up the chimney. The whole stove ticks and creaks as it warms.' : 'Burning down. The logs have gone to glowing coals at the edges.')); return a.slice(0, 2); }
  if (st === 'embers') {
    if (holding('pot') && !S.potEmbers) a.push(A_('Rake embers into the pot', rakeEmbers));
    if (a.length < 2) a.push(look(S.potEmbers ? 'A bed of embers, breathing red.' : 'The fire has burned down to a deep bed of embers, breathing red. The whole house is warm.'));
    return a.slice(0, 2);
  }
  return [look('The stove.')];
}
function placeZas() { if (S.zas) { O.zas.position.set(MOUTH.x, MOUTH.y0, STOVE.z0 - 0.08); O.zas.rotation.set(0, 0, 0); } else { O.zas.position.set(2.0, FY + 0.02, -2.42); O.zas.rotation.set(-0.12, Math.PI / 2 + 0.2, 0); } }
function showStoveFuel() { O.ovenWood.visible = !!S.woodIn && S.stove !== 'embers'; O.ovenBark.visible = !!S.barkIn && S.stove === 'cold'; O.ovenEmbers.visible = S.stove === 'embers' || (S.stove === 'burning' && S.stoveT > 25); }
function lightStove() {
  if (!S.damper) {
    // the damper's shut: smoke rolls out of the mouth into the room
    sMatch(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, MOUTH.z)); S.barkIn = false; showStoveFuel(); S.wrong++; save();
    V.smoke = 6; sWhoosh(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.2, MOUTH.z), 0.15); after(0.6, sCough); after(2.4, sCough);
    G.lockout = G.time + 5;
    sayI('The bark flares, and then thick yellow smoke rolls straight back out of the mouth and up the face of the stove, into the room, into your eyes and throat. Nothing is drawing it up. The chimney is shut. The bark burns away to nothing and the logs only blacken.', 9000);
    return;
  }
  sMatch(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, MOUTH.z)); S.barkIn = false; S.stove = 'burning'; S.stoveT = 0; flag('stoveLit'); showStoveFuel(); save();
  after(0.5, () => sWhoosh(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.2, -1.6), 0.3));
  after(1.0, () => sayI('The bark catches with a crackle and a curl of black smoke that streams back into the mouth and up the chimney. The logs take. The fire roars.', 6500));
  if (!S.ev.toldEmbers) { S.ev.toldEmbers = true; after(9, () => toast('A Russian stove takes a while to burn down to embers.', 5000)); }
}
function rakeEmbers() {
  S.potEmbers = true; save(); sScrape(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, MOUTH.z), 0.8, 0.2); sCrackle(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.1, MOUTH.z), 8, 0.15);
  O.poker.visible = false; after(1.2, () => { O.poker.visible = true; });
  sayI('You draw the poker through the bed of coals and rake a heap of embers to the lip, then shovel them into the pot with its edge and put the lid on. The pot grows warm in your hands, then hot.', 7000);
}

/* ---------------- the damper ---------------- */
function damperActions() {
  const onStep = BODY.y > FY + 0.35;
  if (S.damper) return [look('Open. You can feel the chimney drawing.')];
  if (!onStep) return [look('A little iron door high on the chimney, up near the ceiling: the damper. You can\'t reach it from the floor. The step at the side of the stove would get you up there.')];
  return [A_('Open the damper', () => { S.damper = true; flag('damperOpen'); placeDamper(); sScrape(DAMPER, 0.5, 0.2); sClick(DAMPER, 0.3, 1400); sWhoosh(DAMPER, 0.06); save(); sayI('You swing the little door open and lift out the round iron lid behind it. A cold breath comes down the chimney: the way is clear.', 6000); })];
}
function placeDamper() { O.damper.rotation.y = S.damper ? 1.6 : 0; O.damperLid.visible = !!S.damper; }

/* ---------------- the basket ---------------- */
function basketActions() {
  const b = S.basket, a = [];
  if (S.flags.ritual) return [];
  if (took('shoe') && !b.shoe) a.push(A_('Put her shoe in the basket', () => { b.shoe = true; drop('shoe'); syncHands(); sScrape(O.basket.position, 0.2, 0.08); save(); }));
  if (b.shoe && took('bread') && !b.bread) a.push(A_('Put bread in the shoe', () => { b.bread = true; flag('basketBread'); drop('bread'); sayI('You tear a crust from the loaf and push it down into the toe of her shoe.', 4000); save(); }));
  if (holding('pot') && S.potEmbers && !b.pot) a.push(A_('Put the pot of embers in', () => { useUpHeld(); O.pot.visible = false; b.pot = true; flag('basketPot'); syncHands(); sKnock(O.basket.position, 0.15, 0, 0.5); save(); }));
  if (holding('pot') && !S.potEmbers && !b.pot) a.push(look('The pot\'s empty. Her letter says embers from the stove go in it first.'));
  if (b.shoe) flag('basketShoe');
  if (a.length < 2) a.push(A_('Pick up the basket', () => pickUp('basket')));
  if (a.length < 2) a.push(look(basketLook()));
  return a.slice(0, 2);
}
function basketLook() { const b = S.basket; const parts = []; if (b.shoe) parts.push(b.bread ? 'her shoe with a crust of bread in its toe' : 'her bast shoe'); if (b.pot) parts.push('the pot of embers, warm through the birch bark'); return parts.length ? 'Her birch-bark basket. In it: ' + parts.join(', and ') + '.' : 'Her birch-bark basket, stitched with root, with a bentwood handle. She packed it and left it here on the bench. It\'s empty.'; }
const basketReady = () => S.basket.shoe && S.basket.bread && S.basket.pot;

/* ---------------- the ritual ---------------- */
function stoveTopActions() {
  // with the basket in your hands at the stove
  if (!holding('basket') || S.flags.ritual) return null;
  return [A_('Set it on the stove and ask him', ritual)];
}
function ritual() {
  if (S.stove === 'cold') { sayI('Her letter: light the stove first. He won\'t leave a cold house.', 4500); return; }
  if (!basketReady()) {
    line('m2', MITYA, 'Dedushka, come with us to the new house.', { volume: 0.85 });
    S.wrong++; save(); G.lockout = G.time + 5;
    after(3.0, () => { for (let i = 0; i < 8; i++) after(i * 0.07, () => sKnock(new THREE.Vector3(0.4 + Math.random(), FY + 1.2 + Math.random() * 0.8, -3.9 + Math.random() * 0.6), rand(0.3, 0.6), 0, 0.3)); sayI('The house goes very still. Then every pot on the shelf in the kitchen corner rattles at once, and stops. He won\'t come to an empty basket. Her letter says what goes in it.', 8000); });
    return;
  }
  // set the basket on the hearth ledge, and ask
  useUpHeld(); O.basket.visible = true; O.basket.position.set(MOUTH.x + 0.05, MOUTH.y0 - 0.0, STOVE.z0 - 0.12); O.basket.rotation.set(0, 0.3, 0); syncHands();
  G.cutscene = true; V.rit = { t: 0 }; flag('ritualStarted');
  line('m2', MITYA, 'Dedushka, come with us to the new house.', { volume: 0.85 });
}
function ritualUpdate(dt) {
  const r = V.rit; if (!r) return; r.t += dt; const t = r.t;
  // the lamp and the torch die, the stove sinks to a red glow, and in the dark something takes your hand
  if (t > 3.2 && !r.dark) { r.dark = true; V.dimAll = 1; sBreath(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.3, MOUTH.z - 0.3), 2, 0.3, true); V.clockStop = 9999; }
  if (t > 4.2 && !r.hand) {
    r.hand = true;
    // in the dark you're standing square to the hearth, looking down at the basket, your hand on its rim
    bodyPlace(MOUTH.x + 0.03, FY, STOVE.z0 - 0.64, Math.PI, false); G.yaw = Math.PI; G.pitch = -0.98;
    const b = O.basket; b.updateMatrixWorld(true); const rim = new THREE.Vector3(0, 0.24, -0.15).applyMatrix4(b.matrixWorld);
    O.handScene.position.copy(rim); O.handScene.rotation.set(0, Math.PI, 0); O.handScene.visible = true; O.hisHand.visible = false;
  }
  if (t > 5.4 && !r.his) { r.his = true; O.hisHand.visible = true; O.hisHand.position.set(0.02, 0.07, -0.26); tween(1.6, k => { O.hisHand.position.set(lerp(0.02, 0, k), lerp(0.07, 0, k), lerp(-0.26, 0, k)); }, null, k => 1 - Math.pow(1 - k, 3)); sayI('A small hand closes over the back of yours. Warm, and dry, and furry, like a cat\'s paw. It stays there.', 7000); }
  if (t > 8.2 && !r.voice) { r.voice = true; line('d1', '', '<i>I\'m coming, I\'m coming.</i>', { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(0.25, -0.2, -0.3)), volume: 1.25 }); }
  if (t > 11.0 && !r.go) { r.go = true; tween(0.9, k => { O.hisHand.position.set(0, k * 0.05, -k * 0.24); }); }
  if (t > 12.0 && !r.done) {
    r.done = true; O.handScene.visible = false; V.dimAll = 0; G.cutscene = false; V.rit = null; G.pitch = -0.1;
    flag('ritual'); HOLD.defs.basket.droppable = false; pickUp('basket');
    sayI('When the lamp comes back the basket is heavier, as if a cat had climbed into it. Something in it is breathing, slowly.', 6500);
    after(4.0, startFinale);
  }
}

/* ---------------- the finale: the house catches ---------------- */
function startFinale() {
  if (S.flags.fire) return; flag('fire'); S.houseFire = 0; save();
  igniteHouse(4);
  after(2.0, () => { sBoom(new THREE.Vector3(3, 2, -21), 0.6); G.shake = 0.3; sayI('Across the lane the roof of the house opposite falls in with a roar, and a whirl of sparks pours over the street onto Babushka\'s roof.', 7000); });
  after(6.0, () => { line('r4', MEN, 'Fourteen\'s caught by itself! Leave it!', { pos: new THREE.Vector3(-4, 1.6, -12), volume: 1.3 }); heard('men'); });
  after(9.0, () => { sCrackle(new THREE.Vector3(3, CEIL + 0.5, -2), 14, 0.25); sayI('Overhead, in the attic, something is crackling. Smoke is seeping down between the ceiling boards.', 6000); placeCat('flee'); });
  after(14.0, () => { if (!S.ev.toldSmoke) { S.ev.toldSmoke = true; toast(`Smoke rises. ${G.touch ? 'Crouch' : '<kbd>C</kbd>'} to stay under it. Don't put him down.`, 7000); } });
}
function finaleUpdate(dt) {
  if (!S.flags.fire || S.flags.escaped) return;
  S.houseFire = Math.min(1, (S.houseFire || 0) + dt / 45);
  const hf = S.houseFire;
  // the smoke layer comes down from the ceiling
  const smokeBot = lerp(CEIL - 0.05, FY + 1.22, smooth(clamp(hf * 1.7, 0, 1)));
  O.smokeLayer.visible = hf > 0.05; O.smokeLayer.position.y = smokeBot; O.smokeLayer.material.uniforms.t.value = G.time; O.smokeLayer.material.uniforms.k.value = clamp(hf * 3, 0, 1);
  O.smokeSeni.visible = O.smokeLayer.visible; O.smokeSeni.position.y = smokeBot + 0.1; O.smokeSeni.material = O.smokeLayer.material;
  const eyeY = camera.position.y, inside = inIzba() || inSeni();
  if (inside && eyeY > smokeBot && hf > 0.15) {
    V.smokeT = (V.smokeT || 0) + dt; V.coughT = (V.coughT || 0) - dt; if (V.coughT <= 0) { V.coughT = 2.2; sCough(); }
    if (V.smokeT > 6.5) blackout();
  } else V.smokeT = Math.max(0, (V.smokeT || 0) - dt * 2);
  V.smokeDark = inside ? clamp((eyeY - smokeBot) * 2.5, 0, 1) * clamp(hf * 3, 0, 1) * 0.85 : 0;
  // flames inside, along the ceiling, once it's well alight
  for (const f of O.inFlames) { f.visible = hf > 0.35; }
  fireUpdate(O.houseFireFx, dt, clamp(hf * 1.4, 0, 1), 0.4);
  L.house.intensity = hf * 120 * (0.85 + Math.sin(G.time * 13) * 0.08 + Math.sin(G.time * 5.3) * 0.07);
  V.crackT = (V.crackT || 0) - dt; if (V.crackT <= 0) { V.crackT = rand(0.3, 1.2); sCrackle(new THREE.Vector3(P.x + rand(-2, 2), (inside ? CEIL : 4.5) + rand(0, 1), P.z + rand(-2, 2)), 3, 0.18 * hf); }
}
function blackout() {
  V.smokeT = 0; S.wrong++; save(); V.black = 2.0; G.blackT = 1; sCough();
  after(1.2, () => { bodyPlace(8.0, 0, 1.45, Math.PI / 2, true); G.pitch = 0; sayI('Your knees go. The next thing you know you\'re on your hands and knees at the foot of the porch steps, coughing, with the basket still clutched against you. You don\'t remember getting out.', 7500); });
}

/* ---------------- the boat ---------------- */
function boatActions() {
  const st = S.boat, a = [];
  if (!S.flags.boatSeen) flag('boatSeen');
  if (st === 'up') {
    if (S.caulk < 4) {
      if (took('oakum') && took('tools')) return [A_(`Hammer the oakum into the seam (${S.caulk + 1}/4)`, caulkBlow)];
      if (holding('hook') && !S.flags.tarred) return [look('Not yet: patch her first, while she\'s bottom up.')];
      return [look(took('oakum') ? 'You\'d need something to drive the oakum in with.' : took('tools') ? 'You need something to drive into the seam: oakum.' : 'Grandfather\'s boat, upside down on two logs for the winter that\'s coming. One seam along her bottom has sprung: there\'s a dark gap you could slide a knife into the whole length of your hand. She\'d fill in a minute.')];
    }
    if (!S.flags.tarred) {
      if (holding('tar')) return [S.tarHot ? A_('Brush the hot tar over the seam', tarSeam) : look('The tar\'s set as hard as stone in the cold. It needs warming first.')];
      if (holding('hook')) return [look('Seal the seam first. The oakum won\'t keep the water out by itself.')];
      return [look('The oakum is driven in, a pale line along her bottom. It needs tar over it, or it\'ll just soak and leak.')];
    }
    if (holding('hook')) return [A_('Lever her over with the boat hook', flipBoat)];
    return [look('Sound now, the seam black and shining. She needs turning the right way up, but she\'s far too heavy to lift. Something long to lever her with.')];
  }
  if (st === 'right') {
    const free = S.rollers.indexOf(false);
    if (/^roller/.test(HOLD.cur || '') && free >= 0) return [A_('Lay the log in front of her bow', () => placeRoller(free))];
    if (free < 0) return [A_('Push her down to the water', launchBoat)];
    return [look(S.rollers.some(Boolean) ? 'One log under her bow. Another, and she\'d roll.' : 'The right way up. She\'s far too heavy to drag over the grass. Logs under her would roll.')];
  }
  if (st === 'launched') {
    if (holding('oar1') || holding('oar2')) return [A_('Put the oar in the boat', putOar)];
    if (holding('basket') && S.flags.ritual) return (S.oarsIn || 0) >= 2 ? [A_('Step into the boat', boardBoat)] : [look('She has only one oar. You\'d go round in circles.')];
    return [look((S.oarsIn || 0) >= 2 ? 'Afloat, tied to the landing, both oars in her. Ready.' : (S.oarsIn || 0) === 1 ? 'Afloat, tied to the landing. One oar in her. She needs the other.' : 'Afloat, tied to the landing post, riding high and dry. She needs both oars.')];
  }
  return [];
}
function caulkBlow() {
  S.caulk++; save(); const p = O.boat.position.clone().setY(0.9);
  sThunk(p, 0.6, 260); sClick(p, 0.35, 1600);
  O.seamOak.visible = true; O.seamOak.scale.y = S.caulk / 4; O.seamOak.position.z = 0.35 - 0.6 + 0.6 * S.caulk / 4;
  if (S.caulk >= 4) { flag('caulked'); drop('oakum'); drop('tools'); sayI('Four blows of the mallet along the seam, and the oakum is driven in tight, a pale twisted line along her bottom.', 5000); }
}
function tarSeam() { flag('tarred'); S.tarHot = false; sScrape(O.boat.position.clone().setY(0.9), 1.6, 0.18); syncSeam(); save(); sayI('You brush the hot tar along the seam in long strokes. It smokes and soaks into the oakum and sets black and shining. She\'ll hold.', 6000); }
function syncSeam() { O.seamGap.visible = S.caulk < 4; O.seamOak.visible = S.caulk > 0 && !S.flags.tarred; O.seamOak.scale.y = Math.max(0.01, S.caulk / 4); O.seamOak.position.z = 0.35 - 0.6 + 0.6 * S.caulk / 4; O.seamTar.visible = !!S.flags.tarred; }
function placeBoat() {
  const b = O.boat, st = S.boat;
  O.props.forEach(p => p.visible = st === 'up');
  if (st === 'up') { b.position.set(BOAT0.x, 0, BOAT0.z); O.hull.rotation.z = Math.PI; O.hull.position.y = O.boatDep + 0.2; solidSet(O.boatSolid, BOAT0.x - 0.65, BOAT0.x + 0.65, -1, O.boatDep + 0.2, BOAT0.z - 2.2, BOAT0.z + 2.2); }
  else if (st === 'right') { b.position.set(BOAT0.x, 0, BOAT0.z); O.hull.rotation.z = 0; O.hull.position.y = 0.02; solidSet(O.boatSolid, BOAT0.x - 0.65, BOAT0.x + 0.65, -1, O.boatDep, BOAT0.z - 2.2, BOAT0.z + 2.2); }
  else { b.position.set(BOATW.x, WATER_Y - 0.16, BOATW.z); O.hull.rotation.z = 0; O.hull.position.y = 0; solidSet(O.boatSolid, BOATW.x - 0.62, BOATW.x + 0.62, -3, WATER_Y + 0.3, BOATW.z - 2.2, BOATW.z + 2.2); }
  O.boatOars.forEach((o, i) => o.visible = i < (S.oarsIn || 0));
  O.boatSolid.on = true;
}
function flipBoat() {
  G.cutscene = true; sCreak(O.boat.position.clone().setY(0.5), 1.6, 0.4, 70);
  const y0 = O.boatDep + 0.2;
  tween(2.0, k => { O.hull.rotation.z = Math.PI * (1 - k); O.hull.position.y = lerp(y0, 0.02, k) + Math.sin(k * Math.PI) * 0.65; O.hull.position.x = Math.sin(k * Math.PI) * 0.4; }, () => {
    O.hull.position.x = 0; S.boat = 'right'; save(); placeBoat(); G.cutscene = false; sThunk(O.boat.position.clone().setY(0.2), 0.9, 90); sThunk(O.boat.position.clone().setY(0.2), 0.6, 70);
    sayI('You get the hook under her gunwale and heave, and she rolls up and over and comes down the right way up with a thump that you feel in your feet.', 6000); renderer.shadowMap.needsUpdate = true; updatePrompt(true);
  });
}
function placeRoller(i) {
  const id = HOLD.cur; useUpHeld(); S.rollers[i] = true; const r = O.rollers[+id.slice(-1)];
  // whichever log you were carrying goes to this spot
  r.visible = true; r.position.set(ROLL_SPOTS[i].x, groundY(ROLL_SPOTS[i].x, ROLL_SPOTS[i].z) + 0.1, ROLL_SPOTS[i].z); r.rotation.set(0, 0, 0); S.rollerAt = S.rollerAt || {}; S.rollerAt[id] = i;
  sThunk(r.position, 0.4, 180); save(); renderer.shadowMap.needsUpdate = true;
}
function launchBoat() {
  G.cutscene = true; flag('launchStarted');
  const z0 = BOAT0.z, z1 = BOATW.z, x0 = BOAT0.x, x1 = BOATW.x;
  sScrape(O.boat.position.clone(), 3.5, 0.5);
  for (let i = 0; i < 6; i++) after(0.4 + i * 0.5, () => sThunk(O.boat.position.clone(), 0.35, 120));
  tween(4.2, k => {
    const z = lerp(z0, z1, k), x = lerp(x0, x1, k), gy = Math.max(groundY(x, z + 1.2), WATER_Y - 0.16);
    O.boat.position.set(x, k > 0.8 ? lerp(gy, WATER_Y - 0.16, (k - 0.8) / 0.2) : gy, z); O.hull.rotation.x = k < 0.8 ? -0.12 * Math.sin(k / 0.8 * Math.PI) : 0;
    for (const id in (S.rollerAt || {})) { const r = HOLD.defs[id].world, i = S.rollerAt[id]; r.rotation.x += 0.12; if (k > 0.25 * (i + 1)) r.position.z = Math.min(r.position.z + 0.02, 26); }
  }, () => {
    S.boat = 'launched'; flag('launched'); save(); placeBoat(); G.cutscene = false; sSplash(O.boat.position.clone(), 0.5);
    sayI('She runs down over the logs, faster and faster, and slides into the river with a slap and a shove of black water. You catch her painter and make it fast round the landing post.', 7000); renderer.shadowMap.needsUpdate = true; updatePrompt(true);
  }, k => k * k * (3 - 2 * k));
}
function putOar() { const id = HOLD.cur; useUpHeld(); S.oarsIn = (S.oarsIn || 0) + 1; S.oarsUsed = S.oarsUsed || {}; S.oarsUsed[id] = true; HOLD.defs[id].world.visible = false; placeBoat(); sThunk(O.boat.position.clone().setY(WATER_Y + 0.3), 0.3, 200); save(); if (S.oarsIn >= 2) sayI('Both oars across her thwarts. She\'s ready. Now Dedushka.', 4000); }

/* ---------------- the river: the end ---------------- */
function boardBoat() {
  useUpHeld(); flag('boarded'); save();
  G.frozen = true; V.ride = { t: 0 }; DRAG.cur = null; G.yaw = 0; G.pitch = -0.22; S.torch = 0;
  // the basket on the stern seat, facing you
  const b = O.basket; O.hull.add(b); b.visible = true; b.position.set(0.0, O.boatDep - 0.1, -1.35); b.rotation.set(0, Math.PI, 0); syncHands();
  L.ember.intensity = 0.0;
  sThunk(O.boat.position.clone(), 0.5, 140); sSplash(O.boat.position.clone(), 0.15);
  placeCat('boat');
  sayI('You step down into her with the basket held against you and set it on the stern seat, facing you, and cast off. She swings out into the current.', 6500);
}
function rideUpdate(dt) {
  const r = V.ride; if (!r) return; r.t += dt; const t = r.t;
  // row away from the shore: you face the stern, and the burning house
  const spd = t < 2 ? t / 2 * 1.1 : 1.1, row = Math.sin(t * 2.4);
  r.dist = (r.dist || 0) + spd * dt * (0.8 + 0.4 * Math.max(0, row));
  O.boat.position.set(BOATW.x + Math.sin(t * 0.2) * 0.3, WATER_Y - 0.16 + Math.sin(t * 1.3) * 0.03, BOATW.z + r.dist);
  O.boat.rotation.set(Math.sin(t * 1.1) * 0.02, Math.sin(t * 0.15) * 0.08, Math.sin(t * 0.9) * 0.025);
  O.boatOars.forEach((o, i) => { o.visible = true; o.rotation.set(Math.PI / 2 + Math.sin(t * 2.4) * 0.15, (i ? -1 : 1) * (0.6 + row * 0.4), 0); o.position.set((i ? 1 : -1) * 0.55, O.boatDep, 0.25); });
  r.rowT = (r.rowT || 0) - dt; if (r.rowT <= 0) { r.rowT = TAU / 2.4; sOar(); }
  O.boat.updateMatrixWorld(true); const seat = new THREE.Vector3(0, O.boatDep - 0.12, 0.15).applyMatrix4(O.boat.matrixWorld);
  P.x = seat.x; P.z = seat.z; BODY.y = BODY.ys = seat.y + 0.95 - BODY.standEye; BODY.vy = 0; BODY.ground = true; solidSet(O.climbSolid, seat.x - 0.2, seat.x + 0.2, BODY.y - 0.2, BODY.y, seat.z - 0.2, seat.z + 0.2); O.climbSolid.on = true;
  // he's there, in the stern, in your jacket, when the embers flare
  if (t > 12 && !r.reveal) { r.reveal = true; O.hull.add(O.ded); O.ded.visible = true; O.ded.position.set(0.12, O.boatDep - 0.35, -1.75); O.ded.rotation.set(0, 0, 0); setDed('boat'); G.cutscene = true; r.y0 = G.yaw; r.p0 = G.pitch; }
  // you look down at the basket, and past it (the view is yours again once he's nodded)
  if (r.reveal && t < 21.5) { const k = smooth(clamp((t - 12) / 2.5, 0, 1)); let dy = (0 - r.y0) % TAU; if (dy > Math.PI) dy -= TAU; if (dy < -Math.PI) dy += TAU; G.yaw = r.y0 + dy * k; G.pitch = lerp(r.p0, -0.3, k); }
  if (r.reveal && t >= 21.5 && G.cutscene && !r.free) { r.free = true; G.cutscene = false; }
  if (r.reveal) {
    const k = clamp((t - 12) / 3, 0, 1);
    L.ember.position.copy(new THREE.Vector3(0, O.boatDep + 0.42, -1.5).applyMatrix4(O.hull.matrixWorld)); L.ember.intensity = k * (0.75 + Math.sin(t * 9) * 0.12);
    O.dedEyes.forEach(e => e.material.opacity = k * 0.6); M.dedFace.emissiveIntensity = k * (0.16 + Math.sin(t * 9) * 0.03); M.dedQuilt.emissiveIntensity = k * 0.1; M.dedHair.emissiveIntensity = k * 0.12;
    if (t > 14.5 && !r.saw) { r.saw = true; sayI('In the glow from the pot there is someone sitting in the stern beside the basket, small, in your jacket, with Murka curled against him, purring. He looks at you for a long time.', 9000); }
    if (t > 19 && !r.nod) { r.nod = true; tween(1.2, k2 => { O.dedHead.rotation.x = Math.sin(k2 * Math.PI) * 0.35; }); after(1.0, () => sayI('Then he nods, slowly, the way you do.', 4500)); }
  }
  if (t > 25 && !r.fade) { r.fade = true; V.black = 3; G.blackT = 1; after(1.0, () => line('r6', MEN, 'Look, a boat! Someone\'s on the river!', { pos: new THREE.Vector3(10, 1, 24), volume: 1.2 })); }
  if (t > 28.5 && !r.done) { r.done = true; flag('escaped'); const frame = endFrame(); finishRoom(frame); }
}
function endFrame(skipEnv) {
  let url = null;
  /*DEBUG*/ if (window.__efs && window.__efs.skip) return null; if (window.__efs && window.__efs.env) skipEnv = true; /*END*/
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, far: cam.far }, fog = scene.fog.density, fogC = scene.fog.color.clone();
    for (const id in HOLD.defs) { const d = HOLD.defs[id]; if (d.hand) d.hand.visible = false; } O.handScene.visible = false;
    // the brigade's photographer on the bank downstream: the house burning, and the boat out on the river
    O.boat.parent !== scene && scene.attach(O.boat);
    O.hull.rotation.set(0, 0, 0); O.hull.position.set(0, 0, 0); O.boat.position.set(29, WATER_Y - 0.16, 29.3); O.boat.rotation.set(0, -0.55, 0); O.boatOars.forEach((o, i) => { o.visible = true; o.rotation.set(Math.PI / 2, (i ? -1 : 1) * 0.9, 0); });
    O.rower.visible = true; O.hull.add(O.rower); O.rower.position.set(0, O.boatDep - 0.25, 0.15); O.rower.rotation.set(0, Math.PI, 0);
    O.hull.add(O.ded); O.ded.visible = true; O.ded.position.set(0.1, O.boatDep - 0.35, -1.75); setDed('boat'); O.basket.visible = true;
    O.cat.visible = false; O.farGlow.forEach(s => s.visible = false);
    const pu = post.uniforms; const ex = pu.exposure.value; pu.exposure.value = 0.85; V.black = 0; G.black = 0; G.blackT = 0; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0;
    const moonWas = { i: L.moon.intensity, c: L.moon.color.clone(), p: L.moon.position.clone() }; L.moon.intensity = 0.9; L.moon.color.setHex(0xc8d0e0); L.moon.position.set(48, 20, 70); L.hemi.intensity = 0.5; L.hemi.color.setHex(0x8a94a8); const torchI = L.torch.intensity; L.torch.intensity = 0;
    scene.fog.density = 0.006; scene.fog.color.setRGB(0.32, 0.33, 0.36); O.skyMat.color.setRGB(1.5, 1.45, 1.5);
    cam.fov = 40; cam.far = 1200; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(45, 1.9, 27.4); cam.lookAt(-3.9, 1.0, 17.0);
    /*DEBUG*/ if (window.__efs && window.__efs.cam) { const c = window.__efs.cam; if (c.b) O.boat.position.set(c.b[0], WATER_Y - 0.16, c.b[1]), O.boat.rotation.y = c.b[2]; cam.fov = c.fov; cam.updateProjectionMatrix(); cam.position.fromArray(c.p); cam.lookAt(...c.t); } /*END*/
    cam.updateMatrixWorld();
    const envWas = scene.environment; if (!skipEnv) { scene.environment = null; const rt = envFromScene(new THREE.Vector3(20, 2, 20)); scene.environment = rt.texture; }
    renderer.shadowMap.needsUpdate = true; render(0.016);
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const gg = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; gg.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // a grey official print: black and white, grainy, a little soft
    const d = gg.getImageData(0, 0, Wd, Ht); for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] * 0.3 + d.data[i + 1] * 0.55 + d.data[i + 2] * 0.15); const v = clamp((l - 10) * 1.15 + 14, 0, 255); d.data[i] = v * 1.0; d.data[i + 1] = v * 0.98; d.data[i + 2] = v * 0.93; } gg.putImageData(d, 0, 0);
    speckle(gg, Wd, Ht, 2600, 0.18, '0,0,0', 2); speckle(gg, Wd, Ht, 900, 0.12, '255,255,255', 1.5);
    gg.fillStyle = 'rgba(240,236,226,.85)'; gg.font = '13px "Russo One", monospace'; gg.fillText('д. Каменка · дом № 14 · 1.X.74 · 6:05', 12, Ht - 12);
    url = c.toDataURL('image/jpeg', 0.88);
    O.farGlow.forEach(s => s.visible = true); L.moon.intensity = moonWas.i; L.moon.color.copy(moonWas.c); L.moon.position.copy(moonWas.p); L.hemi.color.setHex(0x223040); L.torch.intensity = torchI; scene.environment = envWas; pu.exposure.value = ex; scene.fog.density = fog; scene.fog.color.copy(fogC); O.skyMat.color.setRGB(1, 1, 1);
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.far = saved.far; cam.updateProjectionMatrix(); updateProj();
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- Dedushka: where he is, how he looks ---------------- */
function setDed(mode) {
  // before he takes your jacket he's only grey and shaggy; after, he wears it
  const jacket = !!S.flags.jacketGone || mode === 'boat';
  O.dedJacket.material = jacket ? M.dedQuilt : M.furDark; M.dedFace.emissiveIntensity = 0; M.dedQuilt.emissiveIntensity = 0; M.dedHair.emissiveIntensity = 0;
  O.dedHead.rotation.set(mode === 'peer' ? 0.35 : 0.15, 0, 0);
  O.dedEyes.forEach(e => { e.material.opacity = mode === 'boat' ? 0 : 0.5; });
}
function showDed(pos, ry, mode) { O.ded.visible = true; if (O.ded.parent !== scene) scene.attach(O.ded); O.ded.position.copy(pos); O.ded.rotation.set(0, ry, 0); setDed(mode); O.ded.updateMatrixWorld(true); }
function hideDed() { O.ded.visible = false; O.ded.position.y = -50; }
// the glimpses: once each, never a jump, always gone when you look properly
const GLIMPSES = [
  { id: 'stoveTop', ok: () => S.flags.woke && inIzba() && !S.flags.lampLit && camera.position.distanceTo(new THREE.Vector3(1.0, STOVE.top, -1.5)) > 2.6 && G.play > 25, pos: new THREE.Vector3(1.05, STOVE.top + 0.02, -1.3), ry: 0.6, mode: 'sit', look: 0.9 },
  { id: 'barnDoor', ok: () => S.flags.jacketGone && outdoors() && P.z < 8 && P.x < 13.5 && NEAR2(P, new THREE.Vector3(15, 0, -0.4)) > 6.5, pos: new THREE.Vector3(15.35, 0, -0.4), ry: -Math.PI / 2, mode: 'stand', look: 1.1 },
  { id: 'cellar', ok: () => inCellar() && S.flags.cellarSeen && G.time - (V.cellarAt || 0) > 4, pos: new THREE.Vector3(5.2, CY, -2.25), ry: -2.4, mode: 'peer', look: 0.6 },
  { id: 'atticWin', ok: () => S.flags.shoeFound && outdoors() && P.z > 6 && P.z < 20 && Math.abs(P.x - 3) < 7, pos: new THREE.Vector3(3.0, AF, 2.75), ry: Math.PI, mode: 'peer', look: 1.0 },
];
function glimpseUpdate(dt) {
  if (G.cutscene || V.ride) return;
  const g = V.glimpse;
  if (!g) {
    if (V.glimpseCool > 0) { V.glimpseCool -= dt; return; }
    for (const q of GLIMPSES) { if (S.ev['gl_' + q.id] || !q.ok()) continue; showDed(q.pos, q.ry, q.mode); O.dedMark.position.set(0, 0.55, 0); if (!inView(O.dedMark, 1.6)) { V.glimpse = { q, seen: 0, t: 0, lookT: 0 }; S.ev['gl_' + q.id] = true; save(); return; } hideDed(); }
    return;
  }
  g.t += dt;
  const iv = inView(O.dedMark, 0.85);
  if (iv) { g.lookT += dt; if (!g.seen && g.lookT > 0.12) { g.seen = 1; sCreak(O.ded.position.clone().setY(O.ded.position.y + 0.5), 0.6, 0.08, 60); G.fearT = Math.max(G.fearT || 0, 0.35); V.flick = 0.6; } }
  // gone the moment you look properly, or come close, or after a while out of sight
  const close = camera.position.distanceTo(O.ded.position) < 1.8;
  if ((g.seen && (g.lookT > g.q.look || close)) || (!g.seen && g.t > 25)) { if (!iv || close || g.lookT > g.q.look + 0.4) { if (iv) { V.flick = 0.35; } hideDed(); V.glimpse = null; V.glimpseCool = 40; if (g.seen && g.q.id === 'barnDoor' && !S.ev.saidJacket) { S.ev.saidJacket = true; after(0.6, () => sayI('Something small was standing in the barn door. It was wearing a quilted jacket, much too big for it. Yours.', 6000)); } } }
}

/* ---------------- the cat ---------------- */
const CAT_SPOTS = {
  bed: { p: new THREE.Vector3(5.5, FY + 0.63, -1.6), ry: Math.PI * 1.2, curl: true },
  step: { p: new THREE.Vector3(2.2, FY + 0.5, -1.45), ry: -Math.PI / 2 - 0.3 },
  chest: { p: new THREE.Vector3(3.0, FY + 0.61, -2.15), ry: Math.PI },
  hole: { p: new THREE.Vector3(3.55, FY, -2.0), ry: Math.PI / 2 + 0.4 },
  bench: { p: new THREE.Vector3(5.75, FY + 0.45, -4.4), ry: -Math.PI / 2 - 0.5 },
  flee: { p: new THREE.Vector3(8.6, 0, 3.0), ry: 2.6 },
  boat: { p: new THREE.Vector3(0, 0, 0), ry: 0 },
};
function placeCat(spot) {
  S.cat = spot; const s = CAT_SPOTS[spot]; if (!s) return;
  if (spot === 'boat') { O.hull.add(O.cat); O.cat.position.set(-0.22, O.boatDep - 0.32, -1.6); O.cat.rotation.set(0, 0.4, 0); }
  else { if (O.cat.parent !== scene) scene.attach(O.cat); O.cat.position.copy(s.p); O.cat.rotation.set(0, s.ry, 0); }
  O.catBody.scale.set(1, s.curl ? 0.55 : 1, 1); O.catHead.position.set(0, s.curl ? 0.15 : 0.3, s.curl ? 0.14 : 0.1);
  O.cat.visible = true;
}
function catUpdate(dt) {
  if (!O.cat.visible) return;
  // she watches you, and sometimes the top of the stove
  const hp = new THREE.Vector3(); O.catHead.getWorldPosition(hp);
  const target = V.catStare ? new THREE.Vector3(1.0, STOVE.top + 0.3, -1.4) : camera.position;
  const local = O.cat.worldToLocal(target.clone()); const yaw = clamp(Math.atan2(local.x, local.z), -1.2, 1.2);
  O.catHead.rotation.y = lerp(O.catHead.rotation.y, S.cat === 'bed' && !S.flags.lampLit ? 0 : yaw, Math.min(1, dt * 3));
  if (V.catStare > 0) V.catStare -= dt;
  const eyeK = torchOn() && inView(O.catHead, 0.5) && camera.position.distanceTo(hp) < 6 ? 0.9 : 0;
  O.catEyes.forEach(e => e.material.opacity = lerp(e.material.opacity, eyeK, Math.min(1, dt * 6)));
  // she leaves the bed once you're up, and goes where she likes when you're not looking
  if (S.cat === 'bed' && S.flags.matchesMissing && !inView(O.cat, 1.1)) placeCat('step');
  if (S.cat === 'chest' && !chestOnTrap() && !inView(O.cat, 1.0)) placeCat('hole');
  if (S.cat === 'hole' && S.flags.oar2Taken && !inView(O.cat, 1.0)) placeCat('bench');
  if (S.cat === 'flee' && !inView(O.cat, 1.0) && S.boat === 'launched' && NEAR2(P, BOATW) > 7) placeCat('boat');
  O.catTail.rotation.y = Math.sin(G.time * 1.3) * 0.2;
  V.meowT = (V.meowT ?? 20) - dt;
  if (V.meowT <= 0) { V.meowT = rand(25, 60); if (S.cat === 'chest' || (S.cat === 'hole' && !S.trap)) { sMeow(hp, 0.25); V.meowT = rand(6, 12); } else if (camera.position.distanceTo(hp) < 7) sMeow(hp, 0.14, rand(0.9, 1.1)); }
}

/* ---------------- the village burning ---------------- */
const BURN_AT = [0, 1, 3, 5, 99];
function progress() { const f = S.flags; return [f.matchesBack, f.stoveLit, f.tarred, f.oar1Taken, f.shoeFound, f.oar2Taken, f.launched, f.ritual].filter(Boolean).length; }
function igniteHouse(i) {
  if (S.burnT[i] !== undefined && S.burnT[i] >= 0) return;
  S.burnT[i] = 0; save(); const B = O.burn[i];
  const pos = new THREE.Vector3(B.h.x, 2, B.h.z);
  sWhoosh(pos, 0.25);
  if (i === 3) after(1.5, () => { line('r1', MEN, 'Hey! Light number twelve!', { pos: new THREE.Vector3(-12, 1.6, -11), volume: 1.3 }); heard('men'); });
  else if (i === 1 || i === 2) after(2.5, () => { line(i === 1 ? 'r2' : 'r5', MEN, i === 1 ? 'Come on, lads! The water won\'t wait!' : 'Petrovich! Bring the cans!', { pos: new THREE.Vector3(B.h.x + 6, 1.6, -11), volume: 1.2 }); heard('men'); });
  // the one who was left behind in it
  if (B.fig) after(10, () => { B.fig.visible = true; V.keenAt = i; sKeen(pos.clone().setY(2), 0.1, 5); after(14, () => { B.fig.visible = false; }); });
}
function villageUpdate(dt) {
  const pr = progress();
  for (let i = 0; i < 4; i++) if (pr >= BURN_AT[i] && !(S.burnT[i] >= 0)) igniteHouse(i);
  O.burn.forEach((B, i) => {
    if (!B.F) return;
    const bt = S.burnT[i]; if (!(bt >= 0)) { fireUpdate(B.F, dt, 0); return; }
    S.burnT[i] = bt + dt;
    // it takes, roars, then falls in and smoulders
    const age = S.burnT[i] + (i === 0 ? 15 : 0);
    let k = clamp(age / 25, 0, 1);
    const fallAt = i === 4 ? 8 : (i === 0 ? 150 : 240);
    if (age > fallAt) { k = lerp(1, 0.35, clamp((age - fallAt) / 20, 0, 1)); if (!B.fallen) { B.fallen = true; sBoom(new THREE.Vector3(B.h.x, 2, B.h.z), 0.35); } }
    fireUpdate(B.F, dt, k);
    B.lm.color.setHex(0x8a8680).lerp(new THREE.Color(0x120e0c), clamp(age / 60, 0, 1));
    B.wins.forEach(w => { w.material.emissiveIntensity = k * (2.5 + Math.sin(G.time * 9 + w.id) * 0.8); });
    if (B.fallen && !B.roofDown) { B.roofDown = true; B.g.children.forEach(c => { if (c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y > 3) { c.position.y -= 2.2; c.rotation.x += 0.4; } }); }
  });
  // two lights for the two nearest fires, thrown out into the lane
  const burning = O.burn.filter((B, i) => B.F && S.burnT[i] >= 0 && B.F.k > 0.05).sort((a, b) => NEAR2(P, a.h) - NEAR2(P, b.h));
  L.firePool.forEach((l, j) => { const B = burning[j]; if (!B) { l.intensity = 0; return; } l.position.set(B.h.x, 4.5, B.h.z + (B.h.ry ? 1 : -1) * (B.h.d / 2 + 2)); l.intensity = B.F.k * (70 + fbm(G.time * 6 + j * 3, 1, 2) * 40) * lerp(0.1, 1, V.outK ?? 1); });
  // the general glow from the west grows with the night
  const glow = 0.5 + pr * 0.09;
  L.west.intensity = glow * (0.9 + Math.sin(G.time * 2.3) * 0.06 + Math.sin(G.time * 7.1) * 0.04) * (IS_TOUCH ? lerp(0.15, 1, V.outK ?? 1) : 1);
  O.farGlow.forEach((s, i) => s.material.opacity = 0.3 + Math.sin(G.time * 1.5 + i) * 0.06);
}

/* ---------------- the jacket ---------------- */
function jacketUpdate() {
  O.pegsHit.visible = !!S.flags.jacketGone; O.gableHit.visible = !S.ladderAt;
  if (!S.flags.jacketGone && S.flags.stoveLit && !inIzba() && G.time - (V.leftIzbaAt || G.time) > 6) { flag('jacketGone'); O.jacket.visible = false; renderer.shadowMap.needsUpdate = true; }
  if (inIzba()) V.leftIzbaAt = G.time; else if (V.leftIzbaAt === undefined) V.leftIzbaAt = G.time;
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  scene.updateMatrixWorld(true);
  const hb = (id, obj, pad) => { obj.updateWorldMatrix(true, true); return hitbox(id, obj, pad); };
  const hit = (w, h, d, x, y, z) => { const m = mbox(w, h, d, HITMAT, x, y, z, scene, 1); m.layers.set(2); m.userData.hit = true; return m; };
  // --- the izba
  inter('bed', O.bed, { name: 'Babushka\'s bed', actions: () => [look('Her iron bed, the pillows stacked the way she liked them under their lace. You lay down on top of the covers for five minutes at ten o\'clock. The quilt still has the shape of you in it.')] });
  inter('cat', O.cat, { name: 'Murka', reach: 2.2, actions: () => [A_('Stroke her', () => { const p = new THREE.Vector3(); O.catHead.getWorldPosition(p); sPurr(p, 3.5, 0.14); if (!S.ev.petCat) { S.ev.petCat = true; sayI('Babushka\'s cat. They couldn\'t catch her when they carried Babushka out. She pushes her head hard into your hand and purrs, and keeps looking past you.', 6500); } else sayI('She purrs, and watches something behind you.', 3500); })] });
  O.catHit.userData.iid = 'cat';
  inter('jacket', O.jacket, { name: 'Your jacket', actions: () => [look('Your quilted jacket, still damp from the river. You hung it on the peg when you came in.')] });
  O.pegsHit = hit(0.7, 0.5, 0.25, 4.05, FY + 1.6, -0.12);
  inter('pegs', O.pegsHit, { name: 'The pegs by the door', enabled: () => S.flags.jacketGone, actions: () => [look(pegsLook())] });
  inter('shawl', O.shawl, { name: 'Babushka\'s shawl', actions: () => [look('Her grey shawl. She went to the hospital without it, in the brigade\'s lorry, in her slippers.')] });
  inter('clock', O.clock, { name: 'The wall clock', actions: () => [look(V.clockStop > 0 ? 'The clock has stopped. The pendulum hangs still.' : 'The wall clock with its pine-cone weights, ticking. Somebody wound it. You didn\'t.')] });
  hb('clock', O.clock, 0.04);
  inter('photos', O.photos, { name: 'Photographs', actions: () => [look('Photographs in one frame: a wedding; Grandfather in uniform, 1941; haymaking; the village from the river. And you, eight years old, on this porch, holding her hand. Митя, 1957, she wrote on it.', 8500)] });
  inter('icon', O.iconG, { name: 'The icon corner', actions: () => [look('The icon in the corner, with an embroidered towel over it. She left it behind. It belongs to the house, she said.')] });
  hb('icon', O.iconG, 0.05);
  inter('table', O.table, { name: 'The table', reach: 2.2, actions: tableActions });
  O.matchBox = grp(4.9, FY + 0.77, -4.85, scene); O.matchBox.userData.keep = true; { const mb = mbox(0.035, 0.05, 0.014, std({ color: 0xd8c8a0, roughness: 0.8 }), 0, 0.025, 0, O.matchBox, 1); const lb = mbox(0.036, 0.03, 0.002, std({ color: 0xb02a1a, roughness: 0.8 }), 0, 0.03, 0.008, O.matchBox, 1); } O.matchBox.visible = false;
  inter('matchBox', O.matchBox, { name: 'Your matches', actions: () => [A_('Take your matches', () => { O.matchBox.visible = false; give('matches'); flag('matchesBack'); S.ev.matchesOnTable = false; save(); })] });
  hb('matchBox', O.matchBox, 0.06);
  inter('lamp', O.lamp, { name: 'The kerosene lamp', actions: () => S.flags.lampLit ? [look('The lamp burns steadily, yellow, a little smoky. Her lamp.')] : [took('matches') ? A_('Light the lamp', lightLamp) : A_('Light the lamp', needMatches)] });
  hb('lamp', O.lamp, 0.05);
  inter('sewing', O.sewing, { name: 'Her sewing tin', actions: () => S.flags.threadTaken ? [look('Needles, buttons, a thimble, a darning mushroom.')] : [A_('Take the red thread', () => { flag('threadTaken'); give('thread'); O.spool.visible = false; })] });
  hb('sewing', O.sewing, 0.05);
  inter('basket', O.basket, { name: 'Babushka\'s basket', actions: basketActions, enabled: () => !S.flags.boarded });
  hb('basket', O.basket, 0.04);
  O.stoveHit = hit(1.2, 1.1, 0.5, MOUTH.x, MOUTH.y0 + 0.2, STOVE.z0 - 0.05);
  inter('stove', O.stoveHit, { name: () => S.stove === 'burning' ? 'The stove, burning' : S.stove === 'embers' ? 'The stove: embers' : 'The stove', reach: 2.0, actions: () => stoveTopActions() || stoveActions() });
  O.zas.traverse(o => { o.userData.iid = 'stove'; });
  inter('damper', O.damper, { name: 'The damper', reach: 1.6, actions: damperActions });
  hb('damper', O.damper, 0.05);
  O.damperHit2 = hit(0.12, 0.3, 0.3, DAMPER.x + 0.05, DAMPER.y, DAMPER.z + 0.08); O.damperHit2.userData.iid = 'damper';
  O.stoveTopHit = hit(1.8, 0.3, 2.1, 1.0, STOVE.top + 0.15, -1.15);
  inter('stoveTop', O.stoveTopHit, { name: 'The top of the stove', actions: () => [look('The broad top of the stove, where she slept in winter, with her felt boots drying on it and a sheepskin to lie on.')] });
  O.stoveSide = hit(0.1, 1.5, 2.2, STOVE.x1 + 0.03, FY + 0.8, -1.15);
  inter('stoveSide', O.stoveSide, { name: 'The stove', actions: () => [look('The side of the stove: two little arched niches for drying mittens, and the wooden step that gets you up onto it.')] });
  inter('pot', O.pot, { name: 'A clay pot', enabled: () => HOLD.cur !== 'pot' && !S.basket.pot, actions: () => [A_('Take the clay pot', () => { pickUp('pot'); if (!S.ev.potTold) { S.ev.potTold = true; sayI('An old clay pot with a lid, blackened at the bottom from years in the oven.', 4000); } })] });
  hb('pot', O.pot, 0.05);
  O.curtainHit = hit(0.1, 1.8, 1.86, KUT_X, FY + 1.0, -3.24);
  inter('curtain', O.curtainHit, { name: 'The curtain', actions: () => [A_('Look behind it', () => { sayI('Behind the chintz curtain: the kitchen corner, in front of the oven mouth. A shelf of crocks and plates, a tub of water, a little table under the window.', 6000); })] });
  inter('chest', O.chest, { name: () => chestOnTrap() ? 'The chest, over the cellar hatch' : 'Her chest', reach: 2.0, actions: () => DRAG.cur ? [] : [A_('Drag the chest', () => { dragStart('chest'); if (!S.ev.toldDrag) { S.ev.toldDrag = true; toast(`Walk to drag it. ${G.touch ? 'Tap <b>Let go</b> when it\'s in place' : '<kbd>Q</kbd> or <kbd>E</kbd> lets go'}.`, 4500); } }), look(chestOnTrap() ? 'Her dowry chest, dragged across the floor and stood on the cellar hatch. There are scrape marks in the boards all the way from the wall.' : 'Her dowry chest, painted with roses and banded with iron. Locked. The key went with her.')] });
  O.trapHit = hit(0.85, 0.25, 0.85, (TRAP.x0 + TRAP.x1) / 2, FY + 0.05, (TRAP.z0 + TRAP.z1) / 2);
  inter('trap', O.trapHit, { name: 'The cellar hatch', reach: 2.2, enabled: () => !chestOnTrap() || true, actions: trapActions });
  O.winHits = [];
  for (const [x, z, w, d, which] of [[1.25, -6.08, 0.62, 0.15, 'n'], [3.0, -6.08, 0.62, 0.15, 'n'], [4.75, -6.08, 0.62, 0.15, 'n'], [6.08, -4.95, 0.15, 0.62, 'e'], [6.08, -2.4, 0.15, 0.62, 'e'], [-0.08, -3.2, 0.15, 0.6, 'w']]) { const m = hit(w, 0.8, d, x, 1.93, z); m.userData.win = which; O.winHits.push(m); inter('win' + O.winHits.length, m, { name: 'The window', reach: 2.2, actions: () => [look(windowLook(which))] }); }
  inter('bag', O.bag, { name: 'Your bag', actions: () => [look('Your canvas bag: a clean shirt, a newspaper, the hospital pass. Nothing you need now.')] });
  // --- the seni
  inter('toolbox', O.toolbox, { name: 'Grandfather\'s tool tray', actions: () => took('tools') || S.flags.caulked ? [look('Nails, a rasp, a plane with no blade.')] : [A_('Take the caulking iron and mallet', () => { give('tools'); O.tools.visible = false; })] });
  hb('toolbox', O.toolbox, 0.05);
  O.seniLadderHit = hit(0.6, 1.6, 0.4, 2.85, FY + 0.9, 2.45);
  inter('seniLadder', O.seniLadderHit, { name: 'The ladder to the attic hatch', reach: 2.0, actions: () => [A_('Climb up to the hatch', () => climbSeni(true))] });
  inter('hatchTop', O.hatchBolt, { name: () => S.hatchBolt ? 'The hatch, bolted' : 'The hatch down to the seni', reach: 2.2, enabled: () => inAttic(), actions: () => S.hatchBolt ? [A_('Draw the bolt', () => { S.hatchBolt = false; flag('hatchOpen'); O.hatchBolt.position.x = HATCH.x1 + 0.02; sScrape(O.hatchBolt.position, 0.4, 0.2); sClick(O.hatchBolt.position, 0.3, 1200); save(); sayI('A plain iron bolt, shot home from this side. You draw it back.', 4500); })] : [A_('Climb down to the seni', () => climbSeni(false))] });
  hb('hatchTop', O.hatchBolt, 0.12);
  O.hatchHit2 = hit(0.7, 0.2, 0.7, (HATCH.x0 + HATCH.x1) / 2, AF + 0.05, (HATCH.z0 + HATCH.z1) / 2); O.hatchHit2.userData.iid = 'hatchTop';
  // --- the yard
  inter('woodpile', O.woodHit, { name: 'The woodpile', reach: 2.2, actions: () => S.woodIn ? [look('Split birch, stacked to last the winter. Nobody will burn it now except the brigade.')] : holding('wood') ? [look('You have an armful.')] : [A_('Take an armful of logs', () => { O.woodArm.visible = false; pickUp('wood'); sKnock(O.woodHit.position, 0.25, 0, 0.6); sKnock(O.woodHit.position, 0.2, 0.15, 0.6); })] });
  inter('woodArm', O.woodArm, { name: 'An armful of logs', enabled: () => !holding('wood') && !S.woodIn, actions: () => [A_('Pick up the logs', () => pickUp('wood'))] }); hb('woodArm', O.woodArm, 0.05);
  inter('block', O.block, { name: 'The chopping block', actions: () => [look('Grandfather\'s chopping block, the axe still in it.')] });
  inter('birchLog', O.birchLog, { name: 'A birch log', actions: () => took('bark') || S.barkIn ? [look('A birch log, its bark peeling in papery curls.')] : [A_('Peel off a curl of bark', () => { give('bark'); sScrape(O.birchLog.position.clone().add(O.block.position), 0.3, 0.12); })] });
  hb('birchLog', O.birchLog, 0.05);
  O.wellHit = hit(1.2, 1.0, 1.2, WELL.x, 0.5, WELL.z);
  inter('well', O.wellHit, { name: 'The well', actions: () => [look('The well, with its long sweep pole. The bucket still hangs from it. The water down there will be under the reservoir by spring, with everything else.')] });
  inter('gates', O.gates, { name: 'The gates', reach: 2.4, actions: () => [look('The gates onto the lane, nailed shut with planks across them and painted with a white cross and 14. The brigade\'s mark: this one\'s cleared, burn it.')] });
    inter('oakum', O.oakum, { name: 'A hank of oakum', enabled: () => !took('oakum') && !S.flags.caulked, actions: () => [A_('Take the oakum', () => { give('oakum'); O.oakum.visible = false; })] });
  hb('oakum', O.oakum, 0.06);
  inter('tar', O.tar, { name: () => S.tarIn ? 'The tar pot, warming' : 'A pot of tar', enabled: () => HOLD.cur !== 'tar', actions: () => S.tarIn ? stoveActions() : S.flags.tarred ? [look('The tar pot, nearly empty now.')] : [A_('Pick up the tar pot', () => pickUp('tar')), look(S.tarHot ? 'Hot tar, runny and smoking.' : 'Pine tar in a small iron pot, set as hard as stone with cold. A stiff brush is stuck in it.')] });
  hb('tar', O.tar, 0.05);
  inter('oar1', O.oar1, { name: 'An oar', reach: 2.1, enabled: () => HOLD.cur !== 'oar1' && !(S.oarsUsed && S.oarsUsed.oar1), actions: () => {
    if (!S.flags.oar1Taken) { if (BODY.y > 0.35) return [A_('Take the oar', () => { flag('oar1Taken'); pickUp('oar1'); })]; return [look('An oar, laid up across the crossbeams under the roof. You can just touch the blade with your fingertips. You\'d need something to stand on.')]; }
    return [A_('Pick up the oar', () => pickUp('oar1'))];
  } });
  hb('oar1', O.oar1, 0.04);
  inter('pegs2', O.pegHit, { name: 'Two pegs on the wall', actions: () => { if (!S.flags.pegsSeen) flag('pegsSeen'); return [look('Two wooden pegs where an oar hung. Grandfather kept the pair here, one up on the beams, one on the pegs. The pegs are empty. The dust on them has been wiped clean, recently, by a small hand.')]; } });
  inter('crate', O.crate, { name: 'A crate', actions: () => DRAG.cur ? [] : [A_('Drag the crate', () => { dragStart('crate'); if (!S.ev.toldDrag) { S.ev.toldDrag = true; toast(`Walk to drag it. ${G.touch ? 'Tap <b>Let go</b> when it\'s in place' : '<kbd>Q</kbd> or <kbd>E</kbd> lets go'}.`, 4500); } })] });
  inter('ladder', O.ladder, { name: () => S.ladderAt ? 'The ladder, against the gable' : 'A ladder', reach: 2.3, enabled: () => HOLD.cur !== 'ladder', actions: () => {
    if (S.ladderAt) return [A_('Climb the ladder', () => climbGable(true)), A_('Take the ladder down', () => { S.ladderAt = null; pickUp('ladder'); })];
    return [A_('Pick up the ladder', () => pickUp('ladder'))];
  } });
  hb('ladder', O.ladder, 0.05);
  O.gableHit = hit(2.0, 2.6, 0.5, 3.0, 1.4, 3.3);
  inter('gable', O.gableHit, { name: 'The back gable', reach: 2.5, enabled: () => holding('ladder') || (!S.ladderAt && !inAttic()), actions: () => holding('ladder') ? [A_('Set the ladder against the gable', placeLadder)] : [look('The back of the house. Up in the gable, under the eaves, a little window into the attic. Too high to reach.')] });
  O.atticWinHit = hit(0.8, 0.8, 0.3, 3.0, 4.25, 2.95);
  inter('atticWin', O.atticWinHit, { name: 'The gable window', reach: 2.2, enabled: () => inAttic(), actions: () => S.ladderAt ? [A_('Climb out onto the ladder', () => climbGable(false))] : [look('The little window in the gable. There\'s no ladder outside any more.')] });
  // the old shoes in the attic: hers is the one with the red tie
  O.shoes.forEach((s, i) => { inter('shoe' + i, s, { name: i === 4 ? 'A bast shoe with a red tie' : 'An old bast shoe', reach: 2.2, enabled: () => !(i === 4 && S.flags.shoeFound), actions: () => i === 4 ? [A_('Take her shoe', takeShoe)] : [look(['A lapot worn through at the heel.', 'A child\'s lapot, small enough for your hand.', 'A pair tied together with bast, stiff with age.', 'Mouse-eaten at the toe.', '', 'This one was Grandfather\'s: big, mended with string.', 'A bast shoe full of dried peas.', 'An old lapot, brittle as paper.'][i])] }); hb('shoe' + i, s, 0.06); });
  O.trunkHit = hit(0.8, 0.5, 0.5, 4.2, AF + 0.25, -4.2);
  inter('trunk', O.trunkHit, { name: 'A trunk', actions: () => [look('Grandfather\'s army trunk. Inside, under mothballs: his greatcoat, his medals in a tobacco tin, and a bundle of letters tied with string, hers to him, 1941 to 1945.')] });
  // --- the cellar
  O.cellarLadderHit = hit(0.6, 1.3, 0.5, 3.0, CY + 0.7, -2.3);
  inter('cellarLadder', O.cellarLadderHit, { name: 'The ladder up', reach: 2.0, enabled: () => inCellar(), actions: () => [A_('Climb up', () => climbCellar(false))] });
  inter('nest', O.nest, { name: 'A nest', reach: 2.0, actions: () => [look('Against the warm bricks of the stove\'s foundation: a nest of straw and rags. Spoons. A thimble. Babushka\'s spare glasses. A row of buttons. And a little tin soldier with his paint worn off, the one you lost here the summer you were eight and cried for a week.', 9500)] });
  hb('nest', O.nest, 0.05);
  inter('oar2', O.oar2, { name: () => S.flags.oar2Taken ? 'The oar' : 'An oar', reach: 2.1, enabled: () => HOLD.cur !== 'oar2' && !(S.oarsUsed && S.oarsUsed.oar2), actions: () => [A_(S.flags.oar2Taken ? 'Pick up the oar' : 'Take the oar', () => { if (!S.flags.oar2Taken) { flag('oar2Taken'); after(0.6, () => sayI('Grandfather\'s other oar. It\'s dry, and somebody has rubbed the blade with fat, the way he used to.', 5000)); } pickUp('oar2'); })] });
  hb('oar2', O.oar2, 0.04);
  O.binsHit = hit(2.2, 0.8, 1.0, 1.5, CY + 0.4, -5.15); inter('bins', O.binsHit, { name: 'Potato bins', actions: () => [look('Bins of potatoes, last year\'s, sprouting white in the dark. Nobody will eat them now.')] });
  O.jarsHit = hit(0.35, 0.8, 2.8, 5.5, CY + 0.7, -4.0); inter('jars', O.jarsHit, { name: 'Jars', actions: () => [look('Shelves of jars: pickled cucumbers, mushrooms, lingonberries. Her handwriting on the lids: 1972, 1973.')] });
  // --- the boat, the rollers, the hook, the landing
  inter('boat', O.boat, { name: () => 'Grandfather\'s boat', reach: 2.6, actions: boatActions });
  O.boatHit.userData.iid = 'boat';
  O.rollers.forEach((r, i) => { inter('roller' + i, r, { name: 'A round log', enabled: () => HOLD.cur !== 'roller' + i && !(S.rollerAt && ('roller' + i) in S.rollerAt), actions: () => [A_('Pick up the log', () => pickUp('roller' + i))] }); hb('roller' + i, r, 0.05); });
  inter('hook', O.hook, { name: 'A boat hook', reach: 2.2, enabled: () => HOLD.cur !== 'hook', actions: () => [A_('Pick up the boat hook', () => pickUp('hook'))] });
  hb('hook', O.hook, 0.06);
  O.landHit = hit(1.0, 0.2, 2.0, 9.1, LANDING.y, 27.8);
  inter('landing', O.landHit, { name: 'The landing', actions: () => [look('Grey planks on posts, where she rinsed the washing every Monday of her life. The black river slides past, cold, fast, a kilometre across. On the far shore, the brigade\'s lights.')] });
}
function tableActions() {
  const a = [];
  if (took('thread') && !S.flags.threadTied) a.push(A_('Tie the red thread round the leg', () => { flag('threadTied'); drop('thread'); O.thread.visible = true; sScrape(O.table.position, 0.2, 0.06); sayI('You kneel and wind the red thread three times round the table leg nearest the room, and knot it.', 4500); }));
  if (S.flags.threadTied && !S.asked) a.push(A_('Ask him to give it back', askHim));
  if (S.flags.threadTied && S.asked) a.push(look('You\'ve asked. Babushka said to go out of the room.'));
  if (a.length < 2) a.push(look(S.flags.threadTied ? 'Her table, the red thread knotted round its leg.' : 'Her table in the icon corner, under its oilcloth: the samovar, the lamp.'));
  return a.slice(0, 2);
}
function trapActions() {
  if (chestOnTrap()) return [look('The cellar hatch, with the chest standing on it. Something under the floor knocks, softly, three times.')];
  if (!S.flags.chestMoved && !S.trap) return [A_('Lift the hatch', () => { sThunk(O.trap.position, 0.3, 120); sCreak(O.trap.position, 0.6, 0.15, 90); sayI('You hook your finger in the ring and pull. The hatch lifts a little and then pulls back down out of your hand, firmly, as if somebody underneath has hold of the other side.', 7500); flag('trapTried'); })];
  if (!S.trap) return [A_('Lift the hatch', () => { S.trap = true; placeTrap(true); sCreak(O.trap.position, 0.8, 0.2, 80); save(); })];
  return [A_('Climb down into the cellar', () => climbCellar(true)), A_('Close the hatch', () => { S.trap = false; placeTrap(true); sThunk(O.trap.position, 0.4, 120); save(); })];
}
function placeTrap(anim) {
  const to = S.trap ? -Math.PI / 2 - 0.12 : 0;
  if (anim) { const from = O.trap.rotation.x; tween(0.7, k => { O.trap.rotation.x = lerp(from, to, k); }); } else O.trap.rotation.x = to;
  O.trapSolid.on = !S.trap; O.trapGuard.on = !!S.trap;
}
function placeLadder() {
  useUpHeld(); S.ladderAt = 'gable'; save(); placeLadderMesh(); sThunk(new THREE.Vector3(3, 3.4, 3.1), 0.4, 160); sKnock(new THREE.Vector3(3, 3.4, 3.1), 0.2, 0.1, 0.5);
  renderer.shadowMap.needsUpdate = true; RAYLIST = null;
}
function placeLadderMesh() { const l = O.ladder; l.visible = true; if (S.ladderAt) { l.rotation.order = 'XYZ'; l.position.set(3.0, 0.0, 3.95); l.rotation.set(-0.22, 0, 0); solidSet(O.ladderSolid, 2.75, 3.25, -1, 0.6, 3.6, 4.1); O.ladderSolid.on = true; } else O.ladderSolid.on = false; }
function takeShoe() {
  flag('shoeFound'); give('shoe'); O.shoes[4].visible = false; save();
  after(0.4, () => sayI('Her shoe. The red woollen tie has been wound round it and knotted, neatly, many times, like something kept for a long while. It\'s warm, as if somebody had been holding it.', 7500));
}
function pegsLook() {
  if (!S.ev.jacketSeen) { S.ev.jacketSeen = true; after(3.5, async () => { sayI('You remember Babushka in the hospital bed, her hand on your wrist:', 3000); await wait(2500); await line('b4', BABA + ', yesterday', 'He always looks like the master of the house, you know.', { fx: 'tape', volume: 0.95 }); heard('b4'); }); }
  return 'The peg where you hung your jacket is empty. Babushka\'s shawl is still there. The wood of the peg is warm.';
}
function windowLook(which) {
  const pr = progress();
  if (which === 'n') return pr < 3 ? 'The lane, and the houses across it, dark. Far off to the left, at the end of the village, a house is burning: a tall orange flame with sparks going up into the low cloud.' : pr < 7 ? 'Down the lane to the left the fire is nearer: two, three houses burning, black figures moving in front of them with cans. The brigade.' : 'The house across the lane is burning, its roof gone. Sparks blow over the street toward you.';
  if (which === 'w') return S.burnT[3] >= 0 ? 'Next door, number twelve is burning. The heat comes through the glass.' : 'Number twelve next door, dark, its windows boarded.';
  return 'The yard, the barn and the well sweep, black against the glow.';
}
function cellarArrive() {
  V.cellarAt = G.time;
  after(1.0, () => sayI('Earth walls, the cold smell of potatoes and pickles. The ladder comes down beside the stove\'s foundation, and against the warm bricks something has made itself a nest.', 7500));
}

/* ---------------- the slow presence: the director ---------------- */
const EVENTS = [
  { id: 'knock', ok: () => !outdoors(), run: () => sKnocks(new THREE.Vector3(P.x + rand(-2, 2), BODY.y + rand(0.5, 1.8), P.z + rand(-2, 2)), irand(2, 3), 0.6, 0.3, 0.8) },
  { id: 'attic', ok: () => (inIzba() || inSeni()) && !inAttic(), run: () => sPatter(new THREE.Vector3(P.x - 0.6, CEIL + 0.2, P.z + rand(-1, 1))) },
  { id: 'stoveCreak', ok: () => inIzba(), run: () => { sCreak(new THREE.Vector3(1.0, STOVE.top + 0.2, -1.3), 1.2, 0.12, 80); V.catStare = 4; } },
  { id: 'clock', ok: () => inIzba() && !(V.clockStop > 0), run: () => { V.clockStop = 9; } },
  { id: 'spoons', ok: () => inIzba() || inSeni(), run: () => { for (let i = 0; i < 4; i++) after(i * 0.12, () => sClick(new THREE.Vector3(0.3, FY + 1.3, -3.9), 0.12, rand(2600, 3800))); } },
  { id: 'sigh', ok: () => inIzba(), run: () => sBreath(new THREE.Vector3(1.4, FY + 1.6, -1.8), 1, 0.12) },
  { id: 'hiss', ok: () => inIzba() && O.cat.visible && S.cat !== 'boat', run: () => { const p = new THREE.Vector3(); O.catHead.getWorldPosition(p); sHiss(p, 0.12); V.catStare = 5; } },
  { id: 'lamp', ok: () => S.flags.lampLit && inIzba(), run: () => { V.lampDip = 1.2; } },
  { id: 'master', ok: () => S.flags.jacketGone && (S.ev.masterN || 0) < 2 && !outdoors(), run: () => { S.ev.masterN = (S.ev.masterN || 0) + 1; playClip('dd_d2', { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(Math.sin(G.yaw + 2.4) * 0.5, 0.0, Math.cos(G.yaw + 2.4) * 0.5)), volume: 1.2 }); heard('ded'); G.fearT = Math.max(G.fearT || 0, 0.4); } },
  { id: 'wind', ok: () => true, run: () => { if (A.loops.wind) { setGain(A.loops.wind, 0.08, 1.5); after(3.5, () => setGain(A.loops.wind, 0.03, 2)); } } },
  { id: 'dog', ok: () => true, run: () => sHowl(0.05) },
  { id: 'tractor', ok: () => true, run: () => sTractor(10) },
  { id: 'door', ok: () => inIzba() || inSeni(), run: () => { sCreak(new THREE.Vector3(5.0, FY + 1.0, 0.2), 2.2, 0.1, 110); const d = O.izbaDoor, r0 = d.rotation.y; tween(2.2, k => { d.rotation.y = r0 - Math.sin(k * Math.PI) * 0.25; }); } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || V.climb || V.ride || S.flags.fire || !S.flags.woke) return;
  V.dirT = (V.dirT ?? 40) - dt; if (V.dirT > 0) return;
  const opts = EVENTS.filter(e => e.id !== V.last && e.ok());
  if (opts.length) { const e = pick(opts); e.run(); V.last = e.id; }
  V.dirT = rand(55, 92) - progress() * 3;
}

/* ---------------- sound beds ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.wind) return;
  const ctx = A.ctx, ir = ctx.createBuffer(2, ctx.sampleRate * 2.2, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); let lp = 0; for (let i = 0; i < ch.length; i++) { lp = lp * 0.7 + (Math.random() * 2 - 1) * 0.3; ch[i] = lp * Math.pow(1 - i / ch.length, 3) * (i < 600 ? i / 600 : 1); } }
  A.rev.buffer = ir;
  A.loops.wind = loopNoise({ type: 'bandpass', f: 380, q: 0.6, vol: 0, brown: true, wet: 0.3 });
  A.loops.river = loopNoise({ pos: new THREE.Vector3(9, WATER_Y, 28), type: 'bandpass', f: 900, q: 0.4, vol: 0, wet: 0.2, ref: 3 });
  A.loops.fireFar = loopNoise({ pos: new THREE.Vector3(-40, 3, -12), type: 'lowpass', f: 600, q: 0.5, vol: 0, brown: true, wet: 0.5, ref: 12 });
  A.loops.stove = loopNoise({ pos: new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.2, -1.5), type: 'lowpass', f: 420, q: 0.6, vol: 0, brown: true, wet: 0.2, ref: 1.2 });
  A.loops.house = loopNoise({ pos: new THREE.Vector3(3, 4, -1), type: 'lowpass', f: 900, q: 0.4, vol: 0, brown: true, wet: 0.3, ref: 3 });
  const tg = ctx.createGain(); tg.gain.value = 0; [41.2, 55, 61.7, 82.4].forEach(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = rand(-8, 8); o.connect(tg); o.start(); }); route(tg, { wet: 0.7 }); A.loops.drone = { gain: tg };
}
function soundUpdate(dt) {
  if (!A.ready || !A.loops.wind) return;
  const out = outdoors(), pr = progress();
  setGain(A.loops.wind, out ? 0.035 : 0.012, 1.5);
  setGain(A.loops.river, 0.05, 1);
  const nearFire = O.burn.reduce((m, B, i) => S.burnT[i] >= 0 ? Math.max(m, clamp(1 - NEAR2(P, B.h) / 70, 0, 1)) : m, 0);
  setGain(A.loops.fireFar, (out ? 0.06 : 0.025) * (0.3 + nearFire), 1.5);
  setGain(A.loops.stove, S.stove === 'burning' ? 0.09 : S.stove === 'embers' ? 0.02 : 0, 1);
  setGain(A.loops.house, S.flags.fire ? 0.12 * (S.houseFire || 0) : 0, 1);
  setGain(A.loops.drone, 0.004 + pr * 0.0008 + (inCellar() || inAttic() ? 0.006 : 0), 2);
  // the clock ticks, unless it has stopped
  V.tickT = (V.tickT ?? 1) - dt; if (V.tickT <= 0) { V.tickT = 1; if (!(V.clockStop > 0) && inIzba()) sClick(O.clock.position, 0.05, 2400); }
  if (V.clockStop > 0) { V.clockStop -= dt; }
  if (S.stove === 'burning' && Math.random() < dt * 2.5) sClick(new THREE.Vector3(MOUTH.x, MOUTH.y0 + 0.3, -1.6), rand(0.04, 0.12), rand(800, 3000));
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  G.flash = Math.max(0, (G.flash || 0) - dt * 2.2);
  V.black = Math.max(0, (V.black || 0) - dt);
  const f = S.flags;
  // where you are, the first times
  if (inBarn() && !f.barnSeen) { flag('barnSeen'); sayI('Grandfather\'s barn: a workbench, tools on the walls, the smell of hay and tar.', 5000); }
  if (outdoors() && !f.firstOut && f.woke) { flag('firstOut'); after(0.5, () => sayI('Cold air, smoke on it. Over the roofs to the west the sky is orange, and somewhere a dog is barking and barking, left behind.', 7000)); }
  if (P.z > 18 && P.x > 2 && P.x < 12 && !f.boatSeen && outdoors()) { flag('boatSeen'); sayI('Down the garden, on the top of the bank, Grandfather\'s boat lies upside down on two logs, the way he always put her up for the winter.', 6500); }
  // the stove burning down
  if (S.stove === 'burning') { S.stoveT += dt; if (S.stoveT > 70) { S.stove = 'embers'; showStoveFuel(); save(); sCrackle(new THREE.Vector3(MOUTH.x, MOUTH.y0, -1.5), 6, 0.1); } else if (S.stoveT > 25 && !O.ovenEmbers.visible) showStoveFuel(); }
  if (S.tarIn) { S.tarT += dt; if (S.tarT > 18 && !S.ev.tarToldHot) { S.ev.tarToldHot = true; if (inIzba()) sayI('A sharp smell of hot pine tar comes out of the oven.', 4000); } }
  // lights
  const lampK = (f.lampLit ? 1 : 0) * (V.dimAll ? 0.05 : 1) * (V.lampDip > 0 ? 0.35 + 0.65 * (1 - Math.sin(V.lampDip / 1.2 * Math.PI)) : 1);
  if (V.lampDip > 0) V.lampDip -= dt;
  L.lamp.intensity = lampK * (2.6 + Math.sin(G.time * 11) * 0.06 + Math.sin(G.time * 23) * 0.04); O.lampFlame.visible = !!f.lampLit && !V.dimAll;
  if (O.lampFlame.visible) { O.lampFlame.material.map = T.flames[Math.floor(G.time * 10) % 8]; O.lampFlame.scale.set(0.03, 0.065 * (0.9 + Math.sin(G.time * 13) * 0.08), 1); }
  const sb = S.stove === 'burning' ? clamp(S.stoveT / 4, 0, 1) * (S.stoveT > 40 ? lerp(1, 0.45, (S.stoveT - 40) / 30) : 1) : S.stove === 'embers' ? 0.28 : 0;
  L.stove.intensity = sb * (S.zas ? 0.1 : 1) * (V.dimAll ? 0.12 : 1) * (5 + Math.sin(G.time * 9) * 1.2 + Math.sin(G.time * 21) * 0.8);
  O.ovenFlames.forEach((s, i) => { s.visible = S.stove === 'burning'; if (s.visible) { const u = s.userData; s.material = M.flames[(Math.floor(G.time * 12) + i * 3) % 8]; const sc = (S.stoveT > 40 ? lerp(1, 0.4, (S.stoveT - 40) / 30) : clamp(S.stoveT / 3, 0, 1)) * u.base * (0.8 + Math.sin(G.time * 7 + i) * 0.2); s.scale.set(sc * 0.7, sc, 1); s.position.y = u.y0 + sc * 0.35; } });
  M.ember.emissiveIntensity = S.stove === 'embers' ? 1.6 + Math.sin(G.time * 2) * 0.4 : S.stove === 'burning' && S.stoveT > 25 ? 2.5 : 0;
  const tFlick = (V.flick > 0 ? (Math.random() < 0.5 ? 0.15 : 1) : 1) * (V.dimAll ? 0 : 1);
  L.torch.intensity = torchOn() ? 7.5 * tFlick * (0.92 + Math.sin(G.time * 3.1) * 0.04) : 0; if (V.flick > 0) V.flick -= dt;
  // outdoors the sky and the fires; indoors only what comes through the windows
  const out = outdoors() || !!V.ride;
  V.outK = lerp(V.outK ?? (out ? 1 : 0), out ? 1 : 0, Math.min(1, dt * 2.5));
  L.hemi.intensity = lerp(0.07, 0.32, V.outK); L.moon.intensity = lerp(0.03, 0.12, V.outK);
  L.inFill.intensity = (1 - V.outK) * (inCellar() || inAttic() ? 0.12 : 0.35);
  // the clay pot glows when it holds embers
  const potGlow = S.potEmbers && !S.flags.escaped;
  if (potGlow) { const src = holding('pot') ? O.potHand : (S.basket.pot ? (holding('basket') ? O.basketHand : O.basket) : O.pot); if (!V.ride) { src.getWorldPosition(L.ember.position); L.ember.position.y += 0.25; L.ember.intensity = 0.55 + Math.sin(G.time * 5) * 0.1; } } else if (!V.ride) L.ember.intensity = 0;
  // the smoke in the room when the damper's shut
  if (V.smoke > 0) { V.smoke -= dt; }
  G.blackT = Math.max(V.black > 0 ? 1 : 0, V.smoke > 0 ? clamp(V.smoke / 6, 0, 0.55) : 0, V.smokeDark || 0);
  O.puff.visible = V.smoke > 0; if (O.puff.visible) { O.puff.material.opacity = clamp(V.smoke / 6, 0, 1) * 0.6; O.puff.position.y = FY + 1.9 + Math.sin(G.time) * 0.05; }
  // the clock's pendulum
  O.pend.rotation.z = V.clockStop > 0 ? lerp(O.pend.rotation.z, 0, dt * 2) : Math.sin(G.time * Math.PI) * 0.18;
  askUpdate(dt); ritualUpdate(dt); finaleUpdate(dt); rideUpdate(dt); villageUpdate(dt); glimpseUpdate(dt); catUpdate(dt); jacketUpdate(); soundUpdate(dt); director(dt);
  // knocking under the floor until you get the chest off
  if (f.chestMoved && chestOnTrap() && inIzba()) { V.knockT = (V.knockT ?? 6) - dt; if (V.knockT <= 0) { V.knockT = rand(7, 12); sKnocks(new THREE.Vector3(3, FY - 0.3, -2.1), 3, 0.5, 0.35, 1); } }
  // the river moves
  T.waterN.offset.y -= dt * 0.012; T.waterN.offset.x += dt * 0.004;
  if (O.boat && S.boat === 'launched' && !V.ride) O.boat.position.y = WATER_Y - 0.16 + Math.sin(G.time * 1.1) * 0.025;
  // a toast the first time something is too low to walk under standing up
  if (BODY.low && G.time - BODY.low < 0.1 && !S.ev.toldCrouch) { S.ev.toldCrouch = true; toast(`Too low to stand. ${G.touch ? 'Crouch' : '<kbd>C</kbd>'} to get under.`, 4000); }
  if (V.envDue) { V.envDue = false; V.envNow = true; }
}

/* ---------------- footsteps ---------------- */
function stepSound(v) {
  if (inIzba() || inSeni() || inAttic()) { sStep(v * 0.9); if (Math.random() < 0.35) sCreak(camera.position.clone().setY(BODY.y), 0.25, 0.04, rand(90, 160)); return; }
  if (P.z > BEACH_Z - 0.5) { sClick(camera.position.clone().setY(BODY.y), v * 0.5, rand(2000, 3500)); sStep(v * 0.5); return; }
  sStep(v * 0.8);
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null, props: {}, held: null, ev: {},
    torch: 1, zas: true, stove: 'cold', woodIn: false, barkIn: false, damper: false, stoveT: 0, tarIn: false, tarT: 0, tarHot: false,
    caulk: 0, boat: 'up', rollers: [false, false], rollerAt: {}, oarsIn: 0, oarsUsed: {}, trap: false, hatchBolt: true, ladderAt: null,
    asked: null, basket: { shoe: false, bread: false, pot: false }, potEmbers: false, burnT: [], houseFire: 0, cat: 'bed' };
}
function applyState() {
  const f = S.flags;
  Object.assign(V, { climb: null, rit: null, ride: null, ask: null, glimpse: null, glimpseCool: 20, smoke: 0, smokeT: 0, smokeDark: 0, dimAll: 0, flick: 0, lampDip: 0, clockStop: 0, black: 0, dirT: 40, leftIzbaAt: undefined, catStare: 0 });
  O.climbSolid.on = false; G.frozen = false;
  // the house
  O.spool.visible = !f.threadTaken; O.thread.visible = !!f.threadTied;
  O.matchBox.visible = !!S.ev.matchesOnTable && !f.matchesBack;
  O.jacket.visible = !f.jacketGone;
  placeZas(); placeDamper(); showStoveFuel();
  O.tools.visible = !took('tools') && !f.caulked; O.oakum.visible = !took('oakum') && !f.caulked;
  S.hatchBolt = S.hatchBolt !== false; O.hatchBolt.position.x = S.hatchBolt ? HATCH.x1 - 0.12 : HATCH.x1 + 0.02;
  O.shoes[4].visible = !f.shoeFound;
  placeTrap(false);
  // the drag-abouts
  for (const id in DRAG.defs) { const d = DRAG.defs[id], p = S.props[id]; if (p) d.obj.position.set(p.x, p.y, p.z); else d.obj.position.copy(d.home); d.sync(); }
  if (f.chestMoved && !S.props.chest) moveChestToTrap();
  // what you carry
  for (const id in HOLD.defs) {
    const d = HOLD.defs[id], p = S.props[id]; if (d.hand) d.hand.visible = false;
    if (!d.world) continue;
    if (p) { d.world.position.set(p.x, p.y, p.z); d.world.rotation.order = 'YXZ'; if (/^oar|hook/.test(id)) d.world.rotation.set(-Math.PI / 2, p.ry || 0, 0), d.world.position.y = p.y + 0.03; else if (id === 'ladder') d.world.rotation.set(-Math.PI / 2, p.ry || 0, 0), d.world.position.y = p.y + 0.04; else d.world.rotation.set(0, p.ry || 0, 0); if (/^roller/.test(id)) d.world.position.y = p.y + 0.1; }
    else if (d.home) { d.world.position.copy(d.home.p); d.world.rotation.order = d.home.order || 'XYZ'; d.world.rotation.copy(d.home.r); }
    d.world.visible = true;
  }
  O.woodArm.visible = !!S.props.wood && !S.woodIn;
  if (S.oarsUsed) { for (const id in S.oarsUsed) if (HOLD.defs[id]) HOLD.defs[id].world.visible = false; }
  if (S.rollerAt) for (const id in S.rollerAt) { const i = S.rollerAt[id], r = HOLD.defs[id].world; r.position.set(ROLL_SPOTS[i].x, groundY(ROLL_SPOTS[i].x, ROLL_SPOTS[i].z) + 0.1, ROLL_SPOTS[i].z); r.rotation.set(0, 0, 0); if (S.boat === 'launched') r.position.z = 26; }
  if (S.tarIn) { O.tar.position.set(MOUTH.x + 0.2, MOUTH.y0 + 0.01, -2.0); O.tar.rotation.set(0, 0, 0); }
  O.pot.visible = !S.basket.pot;
  placeLadderMesh();
  HOLD.cur = null; S.inv = S.inv.filter(i => !HOLD.defs[i]);
  HOLD.defs.basket.droppable = !f.ritual;
  if (S.held && HOLD.defs[S.held]) { const id = S.held; holdTake(id, true); S.inv.push(id); }
  syncHands();
  // the boat
  placeBoat(); syncSeam();
  // the cat
  placeCat(S.cat === 'boat' && !f.boarded ? 'flee' : (S.cat || 'bed'));
  // the village, the fire
  O.burn.forEach((B, i) => { B.fallen = false; });
  hideDed();
  if (f.fire && !f.escaped) { S.houseFire = Math.max(S.houseFire || 0, 0.2); }
  if (f.boarded && !f.escaped) { f.boarded = false; S.held = 'basket'; }
  if (f.ritual && !f.fire) after(1, startFinale);
  if (f.ritualStarted && !f.ritual) { f.ritualStarted = false; }
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDue = true; RAYLIST = null;
}
function resumed() {
  if (S.flags.fire && !S.flags.escaped && (inIzba() || inSeni())) { bodyPlace(8.0, 0, 1.45, Math.PI / 2, false); }
  if (inCellar()) { BODY.crouch = true; G.crouch = true; }
}

/* ---------------- title: a window at night, a lamp in it, the glow of fire behind the roofs ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const W2 = 480, H2 = 270;
  const sky = g.createLinearGradient(0, 0, 0, H2); sky.addColorStop(0, '#05060a'); sky.addColorStop(0.55, '#1a0e0a'); sky.addColorStop(0.8, '#3a1408'); sky.addColorStop(1, '#0a0605'); g.fillStyle = sky; g.fillRect(0, 0, W2, H2);
  // fire glow on the horizon, breathing
  const fl = 0.75 + Math.sin(t * 2.1) * 0.12 + Math.sin(t * 5.3) * 0.06;
  const gl = g.createRadialGradient(W2 * 0.18, H2 * 0.72, 4, W2 * 0.18, H2 * 0.72, 180); gl.addColorStop(0, `rgba(255,120,40,${0.55 * fl})`); gl.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = gl; g.fillRect(0, 0, W2, H2);
  // sparks going up
  for (let i = 0; i < 26; i++) { const p = (t * 0.12 + i / 26) % 1, x = W2 * 0.18 + Math.sin(i * 7.3 + t) * 30 + p * 60, y = H2 * 0.72 - p * 200; g.fillStyle = `rgba(255,${150 + (i % 5) * 20},60,${(1 - p) * 0.8})`; g.fillRect(x, y, 2, 2); }
  // the house: a log gable with three windows, one lit
  g.fillStyle = '#060504'; g.beginPath(); g.moveTo(W2 * 0.48, H2 * 0.35); g.lineTo(W2 * 0.72, H2 * 0.55); g.lineTo(W2 * 0.72, H2); g.lineTo(W2 * 0.24, H2); g.lineTo(W2 * 0.24, H2 * 0.55); g.closePath(); g.fill();
  g.fillStyle = '#0c0a08'; for (let y = H2 * 0.56; y < H2; y += 9) g.fillRect(W2 * 0.24, y, W2 * 0.48, 1);
  for (let i = 0; i < 3; i++) { const x = W2 * 0.3 + i * W2 * 0.14, y = H2 * 0.66; g.fillStyle = '#16120e'; g.fillRect(x - 3, y - 3, 42, 54); if (i === 1) { const lk = 0.8 + Math.sin(t * 7) * 0.05; const wg = g.createRadialGradient(x + 18, y + 26, 2, x + 18, y + 26, 40); wg.addColorStop(0, `rgba(255,190,100,${0.95 * lk})`); wg.addColorStop(1, `rgba(140,60,20,${0.6 * lk})`); g.fillStyle = wg; g.fillRect(x, y, 36, 48); g.fillStyle = '#16120e'; g.fillRect(x + 17, y, 2, 48); g.fillRect(x, y + 28, 36, 2); // a small figure in the window, now and then
        if (Math.sin(t * 0.37) > 0.82) { g.fillStyle = 'rgba(10,6,4,.92)'; g.beginPath(); g.arc(x + 9, y + 34, 5, 0, TAU); g.fill(); g.fillRect(x + 4, y + 38, 10, 10); } } else { g.fillStyle = '#0a0808'; g.fillRect(x, y, 36, 48); } }
  // the white cross on the logs
  g.strokeStyle = 'rgba(220,220,210,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(W2 * 0.62, H2 * 0.82); g.lineTo(W2 * 0.68, H2 * 0.94); g.moveTo(W2 * 0.68, H2 * 0.82); g.lineTo(W2 * 0.62, H2 * 0.94); g.stroke();
  // grain
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * W2, Math.random() * H2, 1, 1); }
}

/* ---------------- build ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x07090c, 0.012);
  camera.far = 900; camera.near = 0.03; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.3, ao: 0.8, aoRad: 0.3, bloom: 0.8, bloomThr: 1.1, vig: 0.55, grain: 0.035, sat: 0.9 });
  bodyOn({});
  makeTextures(); paintThings(); makeMaterials();
  M.furDark = std({ map: T.fur, color: 0x6a6660, roughness: 1 });
  buildHouse(); buildStove(); buildFurniture(); buildSeni(); buildGround(); buildFences(); buildPorch(); buildBarn(); buildBoat(); buildVillage();
  buildDedushka(); buildCat(); buildRower(); buildHands(); buildLights(); handMeshes();
  O.dedMark = grp(0, 0.55, 0, O.ded);
  // the fire in the oven, its logs, its bark, its embers
  O.ovenWood = grp(MOUTH.x, MOUTH.y0 + 0.02, -1.55, scene); O.ovenWood.userData.keep = true; for (let i = 0; i < 5; i++) { const l = cyl(0.05, 0.05, 0.55, M.birch, (i % 3 - 1) * 0.12, 0.05 + Math.floor(i / 3) * 0.09, 0, O.ovenWood, 6); l.rotation.x = Math.PI / 2; l.rotation.y = (hash1(i) - 0.5) * 0.4; }
  O.ovenBark = grp(MOUTH.x, MOUTH.y0 + 0.01, -1.85, scene); O.ovenBark.userData.keep = true; { const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10, 1, true, 0, 4), std({ map: T.birch, side: THREE.DoubleSide })); cm.rotation.z = Math.PI / 2; O.ovenBark.add(cm); }
  O.ovenEmbers = grp(MOUTH.x, MOUTH.y0 + 0.005, -1.5, scene); O.ovenEmbers.userData.keep = true; { const e = new THREE.Mesh(new THREE.CircleGeometry(0.35, 18), M.ember); e.rotation.x = -Math.PI / 2; e.scale.set(1.2, 1.5, 1); O.ovenEmbers.add(e); for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035, 0), M.ember); c.position.set((hash1(i) - 0.5) * 0.5, 0.02, (hash1(i * 3) - 0.5) * 0.6); O.ovenEmbers.add(c); } }
  O.ovenFlames = []; for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(M.flames[0]); s.userData.base = 0.32 + hash1(i) * 0.12; s.userData.y0 = MOUTH.y0 + 0.08; s.position.set(MOUTH.x + (i - 2) * 0.09, MOUTH.y0 + 0.2, -1.55 + (i % 2) * 0.12); s.userData.noRay = true; s.visible = false; scene.add(s); O.ovenFlames.push(s); }
  // the smoke when you light it with the damper shut
  O.puff = new THREE.Sprite(M.smoke.clone()); O.puff.scale.set(3.2, 1.6, 1); O.puff.position.set(1.8, FY + 1.9, -3.0); O.puff.visible = false; O.puff.userData.noRay = true; scene.add(O.puff);
  // the smoke layer for the end: a slab of slow-moving dark under the ceiling
  { const mat = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; varying vec3 vW; void main(){ vU = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform float t; uniform float k; varying vec2 vU; varying vec3 vW; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); } void main(){ vec2 p = vW.xz*0.9 + vec2(t*0.08, t*0.05); float v = n(p)*0.5 + n(p*2.1 - t*0.1)*0.3 + n(p*4.3)*0.2; gl_FragColor = vec4(vec3(0.08,0.07,0.065), k*(0.55 + v*0.4)); }' });
    O.smokeLayer = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.0, 6.0), mat); O.smokeLayer.geometry.translate(0, 1.0, 0); O.smokeLayer.position.set(3, CEIL, -3); O.smokeLayer.visible = false; O.smokeLayer.userData.noRay = true; O.smokeLayer.layers.set(1); scene.add(O.smokeLayer);
    O.smokeSeni = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.0, 2.55), mat); O.smokeSeni.geometry.translate(0, 1.0, 0); O.smokeSeni.position.set(3, CEIL, 1.52); O.smokeSeni.visible = false; O.smokeSeni.userData.noRay = true; O.smokeSeni.layers.set(1); scene.add(O.smokeSeni); }
  // flames in the house at the end: in the ceiling, in the seni, and on the roof outside
  O.inFlames = []; for (const [x, y, z, s] of [[1.2, CEIL - 0.15, -4.5, 0.7], [4.2, CEIL - 0.15, -1.5, 0.6], [2.4, CEIL - 0.15, 1.2, 0.8], [5.2, CEIL - 0.15, 2.2, 0.7], [0.4, CEIL - 0.2, 1.8, 0.6]]) { const sp = new THREE.Sprite(M.flames[(x * 3 | 0) % 8]); sp.position.set(x, y, z); sp.scale.set(s * 0.8, s, 1); sp.visible = false; sp.userData.noRay = true; scene.add(sp); O.inFlames.push(sp); }
  O.houseFireFx = makeFire(grp(3, 0, -1.6, scene), { w: 6.5, d: 9.3, eave: EAVE, ridge: RIDGE });
  // a solid you stand on while climbing, and one for the ladder at the gable
  O.climbSolid = solid('climb', 0, 0, -50, -50, 0, 0); O.climbSolid.on = false;
  O.ladderSolid = solid('ladderFoot', 0, 0, -50, -50, 0, 0); O.ladderSolid.on = false;
  // the draggables
  const dc = draggable('chest', O.chest, { w: 1.1, dd: 0.55, h: 0.61, name: 'chest', heavy: 2 }); dc.home = POS.chest0.clone();
  const dk = draggable('crate', O.crate, { w: 0.6, dd: 0.5, h: 0.5, name: 'crate', heavy: 1 }); dk.home = POS.crate0.clone();
  setupHold();
  // remember where the carryables start, for restarts
  for (const id in HOLD.defs) { const d = HOLD.defs[id]; if (d.world) d.home = { p: d.world.position.clone(), r: d.world.rotation.clone(), order: d.world.rotation.order }; }
}

/* ---------------- the room module ---------------- */
return {
  id: 'ded', title: 'Dedushka', saveKey: 'lethe.roomded.v1',
  // getters, not values: touch mode is only known once the page boots, after this object is made
  DOCS, ITEMS: (() => { const all = Object.defineProperties({}, Object.getOwnPropertyDescriptors(ITEMS)); for (const [k, v] of Object.entries(HOLD_NAMES)) all[k] = { name: v, short: HOLD_SHORT[k], get desc() { return 'In your hands. ' + (G.touch ? 'The Put down button' : 'Q') + ' puts it down.'; } }; return all; })(), HEARD, HINTS, openDoc, inspectItem,
  titleFx,
  penalty() { G.lockout = G.time + 3; },
  markSkip: ['start', 'out'], markMerge: {},
  backText: 'Back in Babushka\'s house.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Jump', 'Space'], ['Crouch', 'C'], ['Put down, let go', 'Q'], ['Torch on and off', 'F'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (V.climb || V.ride) return; bodyCrouch(); },
  stepDown() { if (V.climb || V.ride) return; bodyJump(); },
  toggleFlash() { toggleTorch(); },
  dropHeld() { if (G.cutscene || V.ride) return; if (DRAG.cur) { dragEnd(); return; } if (HOLD.cur) holdDrop(); },
  onHold, stepSound,
  onDrag(d, on) { renderer.shadowMap.needsUpdate = true; if (!on) { S.props[d.id] = { x: d.obj.position.x, y: d.obj.position.y, z: d.obj.position.z }; save(); } },
  onDragFell(d) { S.props[d.id] = { x: d.obj.position.x, y: d.obj.position.y, z: d.obj.position.z }; save(); },
  onLand(v) { if (v > 1.5) sStep(0.3); },
  savePlayer(p) { if (V.climb) { p.x = P.x; p.z = P.z; } if (V.ride) { p.x = 9.1; p.z = LANDING.z1 - 0.6; p.y = LANDING.y; } },
  resumed,
  constrain(p, r) {
    // the river: you can walk out on the landing, nowhere else
    const onLanding = p.x > LANDING.x0 - 0.1 && p.x < LANDING.x1 + 0.1 && p.z > LANDING.z0;
    if (!onLanding && p.z > WATER_Z - 0.25) { p.z = WATER_Z - 0.25; if (!S.ev.toldWater || G.time - S.ev.toldWater > 20) { S.ev.toldWater = G.time; toast('The river is black and fast and cold as a knife. Not without the boat.', 3500); } }
    if (onLanding && p.z > WATER_Z - 0.3) { p.x = clamp(p.x, LANDING.x0 + r * 0.6, LANDING.x1 - r * 0.6); p.z = Math.min(p.z, LANDING.z1 - 0.15); }
  },
  actOverride(i) { if (DRAG.cur) { dragEnd(); return true; } return false; },
  promptOverride() { if (DRAG.cur) return `<span class="nm">Dragging the ${esc(DRAG.cur.name)}</span><span class="act"><kbd>E</kbd>Let go</span>`; return ''; },
  touchOverride() { if (DRAG.cur) return [{ label: 'Let go', run: () => dragEnd(), main: true }]; return null; },
  touchExtras() { const x = []; if (!V.climb && !V.ride) x.push({ label: 'Jump', run: () => bodyJump() }); if (HOLD.cur && !V.ride) x.push({ label: 'Put down', run: () => holdDrop() }); x.push({ label: torchOn() ? 'Torch off' : 'Torch', run: () => toggleTorch() }); return x; },
  invNote: id => '',
  update: roomUpdate,
  preRender() {
    if (V.envNow) { V.envNow = false; const old = scene.environment; scene.environment = null; const hide = [O.handScene, O.smokeLayer, O.smokeSeni]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); for (const id in HOLD.defs) if (HOLD.defs[id].hand) HOLD.defs[id].hand.visible = false; const rt = envFromScene(new THREE.Vector3(3, FY + 1.5, -3)); scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); if (HOLD.cur && HOLD.defs[HOLD.cur].hand) HOLD.defs[HOLD.cur].hand.visible = true; }
  },
  build() {
    buildRoom(); registerInteractions();
    mergeGroup(O.house); mergeGroup(O.furn); mergeGroup(O.seni); mergeGroup(O.cellar); mergeGroup(O.attic); mergeGroup(O.out); mergeGroup(O.fences); mergeGroup(O.porch); mergeGroup(O.barn); mergeGroup(O.woodpile); mergeGroup(O.stove); mergeGroup(O.roof);
  },
  defaults, applyState, startAmbience,
  spawn: { x: 4.5, z: -2.4, yaw: Math.PI / 2 },
  wake() {
    bodyPlace(4.5, FY, -2.35, Math.PI * 0.62, false); G.pitch = -0.05;
    G.cutscene = true; $('#fx').className = 'lids';
    after(0.6, () => sayI('You wake on top of Babushka\'s quilt with your boots still on. The room is dark and cold. You only meant to lie down for five minutes.', 7000));
    after(3.4, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); give('torch', true); give('bread', true); give('letter', true); S.docs.push('letter'); renderInv(); updatePrompt(true); toast(`Your torch is on. ${G.touch ? 'The Torch button' : '<kbd>F</kbd>'} turns it off and on.`, 6500); });
    after(7.5, async () => { const o = { fx: 'tape', volume: 0.95 }; sayI('Outside, far off, men are shouting. Through the window the sky over the end of the village is orange. You remember Babushka in the hospital bed yesterday, gripping your wrist.', 7500); await wait(6500); await line('b1', BABA + ', yesterday', 'Mitenka, bring Dedushka. Don\'t leave him to burn.', o); heard('b1'); after(1.5, () => { if (!S.ev.toldLetter) { S.ev.toldLetter = true; toast(G.touch ? 'Her letter is in the notebook (top right). Hints too.' : 'Her letter is in your pocket: <kbd>Tab</kbd> notebook &middot; <kbd>H</kbd> hints &middot; <kbd>C</kbd> crouch', 8000); } }); });
  },
  debug: { O, L, V, T, M, BODY, DRAG, HOLD, POS, progress, placeBoat, applyState, igniteHouse, startFinale, ritual, lightStove, lightLamp, askHim, moveChestToTrap, flipBoat, launchBoat, placeRoller, putOar, boardBoat, climbSeni, climbGable, climbCellar, placeLadder, takeShoe, caulkBlow, tarSeam, rakeEmbers, pickUp, placeCat, showDed, hideDed, setDed, endFrame, stoveActions, boatActions, basketActions, tableActions, trapActions, inIzba, inSeni, inCellar, inAttic, outdoors, chestOnTrap },
};
