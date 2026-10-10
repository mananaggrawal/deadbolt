/* =====================================================================
   SATURATION · part E: the gas wall, the moon pool and its level, the supply pot, the scrubber,
   the intercom and the voices in the bunk room, knocking, the pass-through, the lamp, the floods,
   the telephone, swimming, your body, the bell and the rise; the slow presence, sound, saving, the module
   ===================================================================== */
const A_ = (label, run) => ({ label, run });
const holding = id => HOLD.cur === id;
const took = id => S.inv.includes(id);
const inWet = () => V.mode === 'station' && Math.hypot(P.x, P.z) < WR.r + 0.05 && P.x < 2.3;
const inMM = () => V.mode === 'station' && P.x > TUN.x0;
const camFwd = () => new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
const progress = () => { const f = S.flags; return [f.capOff, f.airFound, f.potOpen, f.scrubbed, S.heard.includes('c2'), f.keyGot, f.knifeGot, f.bellBlown, f.kitReady].filter(Boolean).length; };

/* ---------------- sound ---------------- */
function sHissOnce(pos, vol = 0.2, dur = 1.2, f = 3200) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', f, 0.8), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.25 }); n.start(t, Math.random() * 2); n.stop(t + dur + 0.1); }
function sKlaxon(dur = 3.2) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = filt('lowpass', 2200, 0.7); o.type = 'square'; o2.type = 'square'; o.frequency.value = 520; o2.frequency.value = 523; for (let k = 0; k < dur / 0.5; k++) { g.gain.setValueAtTime(0.0001, t + k * 0.5); g.gain.linearRampToValueAtTime(0.13, t + k * 0.5 + 0.02); g.gain.setValueAtTime(0.13, t + k * 0.5 + 0.32); g.gain.linearRampToValueAtTime(0.0001, t + k * 0.5 + 0.36); } o.connect(lp); o2.connect(lp); lp.connect(g); route(g, { pos: POS.manifold.clone(), wet: 0.35 }); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur); }
function sBurp() { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 180, 0.8), g = ctx.createGain(); lp.frequency.setValueAtTime(90, t); lp.frequency.linearRampToValueAtTime(260, t + 0.4); lp.frequency.exponentialRampToValueAtTime(70, t + 3); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6); n.connect(lp); lp.connect(g); route(g, { pos: new THREE.Vector3(0, FY - 2.2, 0), wet: 0.6, ref: 3 }); n.start(t); n.stop(t + 3.7); for (let i = 0; i < 9; i++) after(0.1 + i * 0.18, () => sThunk(new THREE.Vector3(rand(-1, 1), FY - 1.5, rand(-1, 1)), 0.3, rand(60, 110))); }
function sSlap(pos, vol = 0.25) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 700, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.4 }); n.start(t, Math.random()); n.stop(t + 0.8); }
function sDrip(pos, vol = 0.06) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(rand(1400, 2200), t); o.frequency.exponentialRampToValueAtTime(rand(500, 800), t + 0.06); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); route(g, { pos, wet: 0.5 }); o.start(t); o.stop(t + 0.15); }
function sGroan(pos, vol = 0.22, dur = 3.2) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = filt('lowpass', 300, 2), g = ctx.createGain(); o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.setValueAtTime(48, t); o.frequency.linearRampToValueAtTime(61, t + dur * 0.5); o.frequency.linearRampToValueAtTime(44, t + dur); o2.frequency.setValueAtTime(97, t); o2.frequency.linearRampToValueAtTime(121, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.6); g.gain.linearRampToValueAtTime(vol * 0.6, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(lp); o2.connect(lp); lp.connect(g); route(g, { pos, wet: 0.7, ref: 3 }); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); }
function sClank(pos, vol = 0.4) { sThunk(pos, vol, 240); sClick(pos, vol * 0.7, rand(1500, 2400)); after(0.05, () => sClick(pos, vol * 0.4, rand(3000, 4200))); }
function sSqueal(pos, vol = 0.08) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), bp = filt('bandpass', 1800, 6), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(rand(900, 1300), t); o.frequency.linearRampToValueAtTime(rand(700, 1000), t + 0.35); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(bp); bp.connect(g); route(g, { pos, wet: 0.3 }); o.start(t); o.stop(t + 0.45); }
function sSob(pos, vol = 0.07) { if (!A.ready) return; for (let k = 0; k < 4; k++) { const ctx = A.ctx, t = now() + k * 0.55 + Math.random() * 0.1, n = noiseSrc(false), bp = filt('bandpass', 600, 2.5), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); const lp = filt('lowpass', 800, 0.7); n.connect(bp); bp.connect(lp); lp.connect(g); route(g, { pos, wet: 0.3 }); n.start(t, Math.random()); n.stop(t + 0.4); } }
function sRing(dur = 2.6) { if (typeof sBell === 'function') { sBell(POS.phone.clone(), dur); return; } }
function knocks4(pos, loud = 0.5, muffle = 1) { for (let i = 0; i < 4; i++) sKnock(pos, loud * rand(0.85, 1.1), i * 0.62 + Math.random() * 0.06, muffle); }

/* ---------------- holding things ---------------- */
function setupHold() {
  O.leads.forEach((b, k) => holdable('lead' + k, { name: HOLD_NAMES['lead' + k], world: b, hand: O.leadHand, handPos: [0.05, -0.36, -0.48], handRot: [0.15, 0.2, 0], onDrop: (x, y, z) => { b.rotation.set(0, G.yaw + 0.3, 0); b.position.set(x, y, z); placeAway(b); } }));
  holdable('tankE', { name: () => tankName(), world: null, hand: O.tankHand, handPos: [0.1, -0.42, -0.5], handRot: [0.1, 0, 0], droppable: true, onDrop: () => { S.tankAt = 'floor'; returnTankToRack(); } });
  holdable('canOld', { name: HOLD_NAMES.canOld, world: O.canOld, hand: O.canHand, handPos: [0.15, -0.4, -0.5], handRot: [0.1, 0.1, 0], onDrop: (x, y, z) => { O.canOld.position.set(x, y, z); O.canOld.rotation.set(0, 0, 0); S.canOldAt = { x, y, z }; } });
}
// a lead block put down on the cover would go straight back on it: set it beside the pool instead
function placeAway(b) { const p = b.position; const r = Math.hypot(p.x, p.z); if (r < MP.r + 0.35) { const a = Math.atan2(p.z, p.x); p.x = Math.cos(a) * (MP.r + 0.45); p.z = Math.sin(a) * (MP.r + 0.45); p.y = FY; } S.props[HOLD.cur || ''] = undefined; }
const tankName = () => ['Morel\'s tank', 'Vasseur\'s tank', 'Hamid\'s tank', 'Ribes\'s tank'][S.tankSlot ?? 1] || 'A tank';
function pickUp(id) {
  if (G.cutscene) return;
  holdTake(id); if (!S.inv.includes(id)) S.inv.push(id); S.held = id; renderInv(id);
  if (!S.ev.toldHold) { S.ev.toldHold = true; toast(`In your hands: <b>${esc(typeof HOLD.defs[id].name === 'function' ? HOLD.defs[id].name() : HOLD.defs[id].name)}</b>. ${G.touch ? 'The Put down button' : '<kbd>Q</kbd>'} puts it down. You can carry one thing at a time.`, 6500); }
  save();
}
function useUpHeld() { const id = HOLD.cur; if (!id) return; const d = HOLD.defs[id]; HOLD.cur = null; if (d.hand) d.hand.visible = false; S.inv = S.inv.filter(i => i !== id); S.held = null; renderInv(); updatePrompt(true); save(); }
function onHold(id, on) { renderer.shadowMap.needsUpdate = true; if (!on) { S.inv = S.inv.filter(i => i !== id); if (S.held === id) S.held = null; renderInv(); if (/^lead/.test(id)) { const b = HOLD.defs[id].world; S.leadAt = S.leadAt || {}; S.leadAt[id] = { x: b.position.x, y: b.position.y, z: b.position.z, ry: b.rotation.y }; } } }

/* ---------------- climbing (the moon pool's ladder) ---------------- */
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
    G.eye = G.eyeT = p.y + BODY.standEye; BODY.eye = BODY.standEye;
    const rung = Math.floor(k * (o.rungs || 8)); if (rung !== V.climb.rung) { V.climb.rung = rung; sKnock(camera.position.clone().add(new THREE.Vector3(0, -0.6, 0)), 0.12, 0, 0.3); }
    if (o.look) o.look(k);
  }, () => {
    V.climb = null; G.cutscene = false; O.climbSolid.on = false;
    bodyPlace(end.x, end.y, end.z, end.yaw ?? G.yaw, !!end.crouch); G.pitch = end.pitch ?? 0;
    o.done && o.done(); updatePrompt(true); save();
  }, k => k);
}
function ledgeDown() {
  if (S.lvl < LVL.ledge) { sayI('The water\'s up over the ledge. You\'d be climbing down into the black.', 4000); return; }
  const top = new THREE.Vector3(-MP.r - 0.3, FY, 0), lip = new THREE.Vector3(-MP.r + 0.24, FY + 0.12, 0), bot = new THREE.Vector3(-MP.r + 0.24, FY - LEDGE_D, 0), end = new THREE.Vector3(-0.42, FY - LEDGE_D, 0.0);
  climbPath([top, lip, bot, end], 3.6, { x: end.x, y: end.y, z: end.z, yaw: -Math.PI / 2 + 0.6, pitch: -0.5 }, { noHold: 'Not with your hands full.', yaw: Math.PI / 2, pitch: -0.4, rungs: 7, done: () => { V.onLedge = true; O.ledgeSolid.on = true; O.poolSolid.on = false; flag('onLedgeOnce'); if (!S.ev.ledgeSeen) { S.ev.ledgeSeen = true; after(0.6, () => sayI('You stand on the ledge inside the skirt, steel walls round you running with water. Below your feet the tube opens into the sea, black and still, two metres of it and then nothing.', 8000)); after(9, () => { if (V.onLedge) { V.handPast = 3; sSlap(new THREE.Vector3(0, FY - SKIRT - 0.2, 0), 0.08); } }); } } });
}
function ledgeUp() {
  const p0 = new THREE.Vector3(P.x, BODY.y, P.z), bot = new THREE.Vector3(-MP.r + 0.24, FY - LEDGE_D, 0), lip = new THREE.Vector3(-MP.r + 0.24, FY + 0.12, 0), top = new THREE.Vector3(-MP.r - 0.48, FY, 0);
  V.onLedge = false; O.ledgeSolid.on = false; O.poolSolid.on = true;
  climbPath([p0, bot, lip, top], 3.4, { x: top.x, y: FY, z: 0, yaw: -Math.PI / 2 }, { yaw: -Math.PI / 2, pitch: 0.4, rungs: 7 });
}

/* ---------------- light: the lamp, the red light, real colours ---------------- */
function lampOn() { return !!(S.flags.lampTaken && S.lampOn); }
function toggleLamp() { if (!S.flags.lampTaken || G.cutscene) return; S.lampOn = !S.lampOn; sClick(camera.position, 0.2, 1800); save(); if (S.lampOn && !S.ev.toldLampRed && !S.flags.capOff) { S.ev.toldLampRed = true; after(0.6, () => sayI('The lamp throws a red beam, through the red glass cap screwed over its lens. For the night watch, so as not to wake anyone.', 6500)); } }
function trueLightAt(p) { if (!lampOn() || !S.flags.capOff || V.mode !== 'station') return false; const d = p.clone().sub(camera.position); if (d.length() > 2.8) return false; return d.normalize().dot(camFwd()) > 0.82; }
function unscrewCap() { if (S.flags.capOff) return; flag('capOff'); sScrape(camera.position, 0.3, 0.12); sClick(camera.position, 0.2, 2600); O.lampCap.visible = false; M.lampLens.emissive.setHex(0xfff0d8); syncLamp(); toast('You unscrew the red cap and drop it in your pocket. The lamp\'s beam is white now: real light.', 6000); renderInv(); }
function syncLamp() { L.lamp.color.setHex(S.flags.capOff ? 0xfff2dc : 0xff2010); O.lampCap.visible = !S.flags.capOff; M.lampLens.emissive.setHex(S.flags.capOff ? 0xfff0d8 : 0xff2a10); }
function lampDesc() { return S.flags.capOff ? 'A heavy diving lamp in a black rubber case. You\'ve taken the red cap off, and its beam is white. ' + (G.touch ? 'The Lamp button' : 'F') + ' turns it on and off.' : 'A heavy diving lamp in a black rubber case. A cap of red glass is screwed over the lens, for the night watch, so its beam is red. ' + (G.touch ? 'The Lamp button' : 'F') + ' turns it on and off.'; }
function myInspect(id, back) {
  if (id !== 'lamp') { inspectItem(id, back); return; }
  UI.show('item', `<button class="x">${back ? 'Back' : 'Close'} &middot; Esc</button><h2>The hand lamp</h2><p style="font-size:14px;line-height:1.65;margin:0 0 14px">${lampDesc()}</p>${S.flags.capOff ? '' : '<button class="btn primary" id="satCap">Unscrew the red cap</button>'}`, { closeOnE: true, onClose: back === 'notebook' ? () => { if (G.mode === 'play') openNotebook(); } : null });
  const b = $('#satCap'); if (b) b.onclick = () => { unscrewCap(); myInspect('lamp', back); };
}
// what colour a band looks: the truth in real light, otherwise pale or dark
function bandLook(col, at) {
  if (trueLightAt(at)) return { white: 'white', yellow: 'yellow', brown: 'brown', black: 'black' }[col];
  if (!S.flags.redSeen) flag('redSeen');
  return col === 'white' || col === 'yellow' ? 'pale pink in this red light, like the other pale ones' : 'dark, almost black in this light';
}

/* ---------------- the gas wall ---------------- */
const bankPos = k => { const v = new THREE.Vector3(); O.bankWheels[k].getWorldPosition(v); return v; };
function bankActions(k) {
  const b = BANKS[k], open = S.bankOpen[k], at = bankPos(k);
  if (!S.flags.manifoldSeen) flag('manifoldSeen');
  return [A_(open ? `Close bank ${b.n}` : `Open bank ${b.n}`, () => turnBank(k)), A_('Look', () => sayI(`Bank ${b.n}. The collar on its pipe is ${bandLook(b.col, at)}. Its gauge reads ${Math.round(S.bank[k])} bar.${open ? ' Its wheel is open.' : ''}`, 6500))];
}
function outletActions(k) {
  const o = OUTLETS[k], open = S.outOpen[o], nm = ['CLOCHE', 'STATION', 'REMPL.'][k];
  if (!S.flags.manifoldSeen) flag('manifoldSeen');
  const what = ['the hose out through the wall to the bell', 'straight into the station: it tops up the pressure that holds the sea down in the moon pool', 'the fill whip, the hose that hangs down to the tank stand'][k];
  return [A_(open ? `Close ${nm}` : `Open ${nm}`, () => turnOutlet(k)), A_('Look', () => sayI(`The ${nm} outlet: ${what}.${open ? ' Open.' : ' Shut.'}`, 6000))];
}
function turnBank(k) {
  if (G.time < (G.lockout || 0)) { sayI('Your hands are shaking. Give it a moment.', 2500); return; }
  S.bankOpen[k] = !S.bankOpen[k]; sSqueal(bankPos(k), 0.07); sClick(bankPos(k), 0.2, 1400);
  const w = O.bankWheels[k], r0 = w.rotation.z; tween(0.5, t => { w.rotation.z = r0 + (S.bankOpen[k] ? 1 : -1) * t * Math.PI * 1.5; });
  if (S.bankOpen[k] && BANKS[k].bar === 0 && S.bank[k] < 1) after(0.6, () => sayI(`Bank ${BANKS[k].n}'s gauge doesn't stir from zero. It's empty.`, 4000));
  gasCheck(); save();
}
function turnOutlet(k) {
  if (G.time < (G.lockout || 0)) { sayI('Your hands are shaking. Give it a moment.', 2500); return; }
  const o = OUTLETS[k]; S.outOpen[o] = !S.outOpen[o]; const v = new THREE.Vector3(); O.outWheels[k].getWorldPosition(v); sSqueal(v, 0.07); sClick(v, 0.2, 1400);
  const w = O.outWheels[k], r0 = w.rotation.z; tween(0.5, t => { w.rotation.z = r0 + (S.outOpen[o] ? 1 : -1) * t * Math.PI * 1.5; });
  gasCheck(); save();
}
function anyOutlet() { return OUTLETS.find(o => S.outOpen[o]); }
// oxygen or helium reaching an outlet: something bad, the alarm, everything shut, a mistake
function gasCheck() {
  const out = anyOutlet(); if (!out) return;
  const bad = BANKS.findIndex((b, k) => S.bankOpen[k] && b.gas !== 'air' && S.bank[k] > 5);
  if (bad < 0) return;
  const gas = BANKS[bad].gas;
  S.wrong++; G.lockout = G.time + 6; save();
  sKlaxon(3.2); G.fearT = Math.max(G.fearT || 0, 0.4); V.alarmT = 3.2;
  const why = gas === 'o2'
    ? { bell: 'Pure oxygen, into the bell. Breathe that at thirty metres and you\'re in convulsions inside a minute.', station: 'Pure oxygen, into the station. At this pressure one spark from the hot plate and the whole place goes up like a torch.', fill: 'Pure oxygen, into a diving tank. At thirty metres it would kill you before you reached the bell.' }[out]
    : { bell: 'Helium, on its own, into the bell: nothing in it to keep you alive. You\'d go to sleep and never know it.', station: 'Helium, on its own, into the station: the air thinning out round you with nothing in it to breathe.', fill: 'Helium, on its own, into a diving tank: two breaths of it at depth and you\'d black out.' }[out];
  after(0.3, () => sayI(`The alarm screams. ${why} You spin every wheel shut.`, 8000));
  for (let k = 0; k < BANKS.length; k++) if (S.bankOpen[k]) { S.bankOpen[k] = false; const w = O.bankWheels[k], r0 = w.rotation.z; tween(0.4, t => { w.rotation.z = r0 - t * Math.PI * 1.5; }); }
  OUTLETS.forEach((o, k) => { if (S.outOpen[o]) { S.outOpen[o] = false; const w = O.outWheels[k], r0 = w.rotation.z; tween(0.4, t => { w.rotation.z = r0 - t * Math.PI * 1.5; }); } });
  // somebody in the bunk room hears the alarm too
  after(3.6, () => { if (!S.flags.keyGot) sSob(POS.hatch.clone(), 0.06); });
}
const RESERVE = 172;
function gasUpdate(dt) {
  const airOpen = S.bankOpen[3], outs = OUTLETS.filter(o => S.outOpen[o]);
  V.flowing = false;
  if (!airOpen || !outs.length || BANKS.some((b, k) => S.bankOpen[k] && b.gas !== 'air' && S.bank[k] > 5)) return;
  V.flowing = true;
  if (!S.flags.airFound) { flag('airFound'); }
  let use = 0;
  for (const o of outs) {
    if (o === 'station') { use += 0.7; S.lvl = Math.min(2.4, S.lvl + dt * 0.05); }
    else if (o === 'bell') { use += 1.0; S.bellAir = Math.min(1.2, (S.bellAir || 0) + dt / 16); if (S.bellAir >= 1 && !S.flags.bellBlown) { flag('bellBlown'); after(0.4, () => { if (S.floods && nearNorthPort()) sayI('Round the bottom of the bell the gas comes boiling out in a skirt of silver bubbles. She\'s full. Shut it off.', 6000); }); } }
    else if (o === 'fill') { use += 0.4; if (S.tankAt === 'stand') { S.tankBar = Math.min(S.bank[3] - 2, S.tankBar + (S.bank[3] - S.tankBar) * dt * 0.3); } else { V.whipLoose = 1; if (!S.ev.toldWhip) { S.ev.toldWhip = true; sayI('Air roars out of the end of the fill whip, thrashing on the deck. There\'s no tank on it.', 5000); } } }
  }
  S.bank[3] = Math.max(RESERVE, S.bank[3] - use * dt * 0.9);
}
const nearNorthPort = () => V.mode === 'station' && P.x > 5.8 && P.x < 10.2 && P.z < -0.2;

/* ---------------- the moon pool: its level, the burp, the cover ---------------- */
function levelUpdate(dt) {
  if (!S.outOpen.station || !V.flowing) S.lvl = Math.max(LVL.start, S.lvl - dt * 0.0035);
  if (S.lvl > LVL.burp) burp();
  // the water's surface, and the dark under it
  const y = FY - S.lvl; O.water.position.y = y + Math.sin(G.time * 0.7) * 0.006 + (V.bulge > 0 ? Math.sin((1 - V.bulge / 2.4) * Math.PI) * 0.06 : 0); O.waterDark.position.y = y - 0.03;
  if (V.bulge > 0) V.bulge -= dt;
  T.waterN.offset.x += dt * 0.01; T.waterN.offset.y -= dt * 0.006;
  // the knife shows once the water is below the ledge
  O.knife.visible = !S.flags.knifeGot;
}
function burp() {
  S.lvl = 0.3; S.wrong++; save(); G.shake = Math.max(G.shake || 0, 0.9); G.fearT = Math.max(G.fearT || 0, 0.5);
  sBurp(); sSlap(new THREE.Vector3(0, FY, 0), 0.6); for (let i = 0; i < 26; i++) after(i * 0.05, () => bubble(new THREE.Vector3(rand(-1.4, 1.4), FY - SKIRT - 0.2, rand(-1.4, 1.4)), rand(0.05, 0.16), 1.6));
  if (S.outOpen.station) { S.outOpen.station = false; const w = O.outWheels[1], r0 = w.rotation.z; tween(0.4, t => { w.rotation.z = r0 - t * Math.PI * 1.5; }); }
  if (V.onLedge) { V.onLedge = false; O.ledgeSolid.on = false; O.poolSolid.on = true; after(0.2, () => { bodyPlace(-MP.r - 0.48, FY, 0, -Math.PI / 2); G.pitch = 0; }); }
  after(0.3, () => sayI('The water drops past the bottom of the skirt and the gas goes out under it all at once, with a roar. The whole station heaves and bangs down on its legs, and the sea comes slapping back up the moon pool almost to the deck. You lunge for the STATION wheel and shut it.', 9000));
  after(4, () => sSob(POS.hatch.clone(), 0.07));
}
const leadsOn = () => S.leadOn.some(Boolean);
function coverActions() {
  if (S.coverOpen) return poolActions();
  if (leadsOn()) return [A_('Lift the cover', () => sayI('Four blocks of lead have been stacked on it, twenty-five kilos each. You\'d never lift it with those on.', 4500)), look('The moon pool\'s steel cover, shut and clamped. Someone has piled lead on it and hung a crucifix over one of the clamps. Under it, the knocking.')];
  if (S.crucifixOn) return [A_('Lift the cover', () => sayI('The crucifix is still hanging over the clamp.', 3000)), look('The cover, with the lead off it. The crucifix still hangs on its chain over one of the clamps.')];
  if (S.dogsOn) return [A_('Knock off the clamps', knockDogs), look('Four steel clamps hold the cover down on the rim.')];
  return [A_('Lift the cover', openCover)];
}
function knockDogs() {
  S.dogsOn = false; save();
  O.dogs.forEach((d, k) => after(k * 0.35, () => { const p = d.position.clone().setY(FY + 0.2); sClank(p, 0.45); const a = d.userData.arm, r0 = a.rotation.y; tween(0.3, t => { a.rotation.y = r0 + t * 1.6; }); }));
  after(1.6, () => { if (!S.coverOpen) { stopKnocking(); sayI('The last clamp swings off. Under the cover, the knocking stops.', 4500); } });
}
function stopKnocking() { V.knockQuiet = 20; }
function openCover() {
  S.coverOpen = true; flag('poolOpen'); save(); G.cutscene = true;
  sCreak(new THREE.Vector3(0.6, FY + 0.3, 0), 1.4, 0.3, 70); sThunk(new THREE.Vector3(0.6, FY + 0.3, 0), 0.5, 130);
  tween(1.6, t => { O.coverHinge.rotation.z = -1.5 * t; }, () => { G.cutscene = false; sThunk(new THREE.Vector3(0.9, FY + 0.6, 0), 0.4, 160); renderer.shadowMap.needsUpdate = true; RAYLIST = null; updatePrompt(true); });
  after(1.8, () => sayI('Black water, right up to the lip of the pool. Still as oil. Nothing in it. Nothing at all.', 6000));
  after(8.5, () => { V.bulge = 2.4; sSlap(new THREE.Vector3(0, FY, 0), 0.12); after(1.2, () => sayI('The surface lifts, slowly, in the middle, as if something had passed under it. Then it\'s still again.', 6000)); });
}
function poolActions() {
  const a = [];
  if (S.flags.kitReady) a.push(A_('Go down into the sea', startDive));
  if (S.lvl >= LVL.ledge && !V.onLedge) a.push(A_('Climb down onto the ledge', ledgeDown));
  a.push(look(poolLook()));
  return a.slice(0, 2);
}
function poolLook() {
  const d = S.lvl;
  if (d < LVL.normal - 0.1) { if (trueLightAt(new THREE.Vector3(0, FY - 1.0, 0)) && !S.flags.knifeGot) { S.ev.glint = true; return 'Black water, almost up to the deck. Your lamp goes down into it a long way: far down, on the ledge at the bottom of the skirt, something metal glints.'; } return 'Black water, almost up to the deck. It should sit lower: down at NIVEAU on the scale painted inside the skirt.'; }
  if (d < LEDGE_D) return `The water has sunk ${d < 1 ? 'a way' : 'well'} down the skirt. The scale says ${d < LVL.normal + 0.2 ? 'NIVEAU' : 'below NIVEAU'}; REBORD is still under it${!S.flags.knifeGot ? ', and on the ledge under the water something glints' : ''}.`;
  if (d < SKIRT) return `The water is below REBORD. The ledge round the inside of the skirt is out of the water, streaming${!S.flags.knifeGot ? ', and on it lies a knife' : ''}. Below it, the tube goes down to JUPE and opens into the sea.`;
  return 'The water is almost out of the skirt.';
}

/* ---------------- the supply pot ---------------- */
function potActions() {
  if (!S.flags.potSeen) flag('potSeen');
  if (S.potOpen) {
    const a = [];
    if (!took('cans') && !S.cansUsed) a.push(A_('Take the canisters', () => { give('cans'); S.cansTaken = true; O.potCans.children.slice(0, 2).forEach(c => c.visible = false); save(); }));
    if (!took('letter')) a.push(A_('Take the post', () => { give('letter'); S.docs.includes('letter') || S.docs.push('letter'); O.potCans.children[2].visible = false; save(); after(0.5, () => sayI('Among the post, a letter addressed to you, in Maman\'s handwriting.', 4500)); }));
    if (!a.length) a.push(look('The pot is empty, apart from three spare bulbs in a box.'));
    return a.slice(0, 2);
  }
  return [A_('Open the lid', tryPot), A_('Read the tag', () => openDoc('tag'))];
}
function tryPot() {
  if (S.potPurge >= 1) { openPot(); return; }
  flag('potTried'); sThunk(O.potG.position.clone().setY(FY + 0.6), 0.4, 120);
  if (V.purging) { sayI('Not yet. It\'s still hissing.', 2500); return; }
  sayI(S.ev.potTriedOnce ? 'The lid still won\'t move a hair. It isn\'t locked; something is pressing it down.' : 'You undo the clamps and heave at the handle. The lid doesn\'t move a millimetre. It isn\'t locked. It\'s as if the whole sea were sitting on it.', 6500);
  S.ev.potTriedOnce = true; save();
}
function purgeActions() {
  if (S.potOpen) return [look('The bleed screw on the lid, open.')];
  if (S.potPurge >= 1) return [look('The bleed screw is open. The hissing has stopped.')];
  if (V.purging) return [look('Gas is hissing in through the little screw, on and on.')];
  return [A_('Open the little screw', () => { V.purging = true; flag('purgeOpened'); sClick(O.potG.position.clone().setY(FY + 0.65), 0.2, 2200); after(0.4, () => sayI('A thin, high hiss, going on and on. The station\'s air is rushing in through the screw, into the pot.', 6000)); }), look('A little knurled brass screw on the lid, stamped PURGE.')];
}
function openPot() {
  S.potOpen = true; flag('potOpen'); save(); const p = O.potG.position.clone().setY(FY + 0.65);
  sScrape(p, 0.4, 0.2); sThunk(p, 0.4, 160);
  tween(0.9, t => { O.potLid.position.set(t * 0.35, 0.56 + Math.sin(t * Math.PI) * 0.15, t * 0.1); O.potLid.rotation.z = -t * 0.3; }, () => { O.potLid.position.set(0.33, 0.04, 0.32); O.potLid.rotation.set(0, 0, 0); });
  O.potCans.visible = true;
  after(0.8, () => sayI('The lid lifts off easily now. Inside: two scrubber canisters, a little box of bulbs, and a bundle of post tied with string.', 6000));
}

/* ---------------- the scrubber ---------------- */
function scrubActions() {
  const a = [];
  if (!S.scrubOpen) {
    if (S.flags.scrubbed) return [look('The scrubber, humming, a fresh canister in it. The air in the station already feels thinner, cleaner.'), A_('Read its plate', () => openDoc('plate'))];
    a.push(A_('Undo the wing nuts', () => { S.scrubOpen = true; save(); O.wingnuts.forEach((w, k) => after(k * 0.2, () => sClick(w.getWorldPosition(new THREE.Vector3()), 0.2, 2400))); after(0.9, () => { tween(0.6, t => { O.scrubLid.position.set(0, 0.76 + t * 0.08, t * 0.32); O.scrubLid.rotation.x = t * 0.25; }); sScrape(O.scrubG.position.clone().setY(FY + 0.8), 0.3, 0.12); }); }));
    a.push(A_('Read its plate', () => openDoc('plate')));
    return a;
  }
  if (S.canOldIn) return [A_('Lift out the old canister', () => { S.canOldIn = false; scene.attach(O.canOld); pickUp('canOld'); after(0.3, () => sayI('Heavy and warm. The crystals at the top of it have gone violet: spent.', 4500)); }), look('Inside, the canister. The crystals at the top of it have gone violet.')];
  if (!S.canNewIn) { if (took('cans')) return [A_('Fit a fresh canister', () => { S.canNewIn = true; S.cansUsed = true; drop('cans'); O.canNew.visible = true; sThunk(O.scrubG.position.clone().setY(FY + 0.5), 0.3, 200); save(); })]; return [look('The housing is empty. It needs a fresh canister.')]; }
  return [A_('Close it and tighten the nuts', () => { S.scrubOpen = false; flag('scrubbed'); save(); tween(0.6, t => { O.scrubLid.position.set(0, 0.84 - t * 0.08, 0.32 * (1 - t)); O.scrubLid.rotation.x = 0.25 * (1 - t); }); O.wingnuts.forEach((w, k) => after(0.7 + k * 0.2, () => sClick(w.getWorldPosition(new THREE.Vector3()), 0.2, 2400))); after(1.8, () => sayI('The fan spins up with a whine and a rush of air. Somewhere behind the bulkhead, someone coughs, and coughs, and takes a long breath.', 7000)); after(2.4, () => sBreath(POS.hatch.clone(), 1, 0.12)); })];
}

/* ---------------- the intercom, the voices ---------------- */
const IC_SEL = ['chambre', 'sas', 'cloche', 'navire'], IC_NAME = { chambre: 'CHAMBRE', sas: 'SAS', cloche: 'CLOCHE', navire: 'NAVIRE' };
function icActions() {
  if (!S.flags.icSeen) flag('icSeen');
  return [A_(`Turn the selector (${IC_NAME[S.icSel]})`, () => { S.icSel = IC_SEL[(IC_SEL.indexOf(S.icSel) + 1) % 4]; O.icKnob.rotation.z = -IC_SEL.indexOf(S.icSel) * Math.PI / 2; sClick(POS.intercom, 0.3, 2000); icChanged(); save(); }),
    A_(`Output: ${S.icOut === 'ici' ? 'ICI' : 'SAS'} · lever: ${S.icListen ? 'ÉCOUTE' : 'PARLER'}`, () => openIcPanel())];
}
function openIcPanel() {
  // a small card with the intercom's switches, so each is one click
  const draw = () => UI.show('box', `<button class="x">Close &middot; Esc</button><h2>The intercom</h2><p class="sub">A grey steel box with a speaker grille. Whatever it picks up comes out of the speaker you choose.</p>
    <div class="sat-ic"><div><span>Selector</span>${IC_SEL.map(s => `<button class="btn ${S.icSel === s ? 'primary' : ''}" data-sel="${s}">${IC_NAME[s]}</button>`).join('')}</div>
    <div><span>Output (SORTIE)</span><button class="btn ${S.icOut === 'ici' ? 'primary' : ''}" data-out="ici">ICI · this speaker</button><button class="btn ${S.icOut === 'sas' ? 'primary' : ''}" data-out="sas">SAS · the wet room</button></div>
    <div><span>Lever</span><button class="btn ${!S.icListen ? 'primary' : ''}" data-l="0">PARLER · talk</button><button class="btn ${S.icListen ? 'primary' : ''}" data-l="1">ÉCOUTE · listen</button></div></div>`, { closeOnE: true });
  draw();
  const bind = () => { $('#card').querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { S.icSel = b.dataset.sel; O.icKnob.rotation.z = -IC_SEL.indexOf(S.icSel) * Math.PI / 2; sClick(null, 0.3, 2000); icChanged(); save(); draw(); bind(); });
    $('#card').querySelectorAll('[data-out]').forEach(b => b.onclick = () => { S.icOut = b.dataset.out; O.icOut.rotation.z = S.icOut === 'sas' ? 0.6 : -0.6; sClick(null, 0.3, 1600); icChanged(); save(); draw(); bind(); });
    $('#card').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { S.icListen = b.dataset.l === '1'; O.icLever.rotation.z = S.icListen ? 0.5 : -0.5; sClick(null, 0.3, 1400); icChanged(); save(); draw(); bind(); }); };
  bind();
}
function icChanged() {
  O.icLamp.material.emissiveIntensity = S.icListen ? 2 : 0; O.speakerLamp.material.emissiveIntensity = S.icListen && S.icOut === 'sas' ? 2 : 0;
  if (S.icListen && S.icOut === 'ici') {
    after(0.8, () => {
      if (!(S.icListen && S.icOut === 'ici')) return;
      if (S.icSel === 'chambre') { flag('voicesStopped'); sBreath(POS.intercom.clone(), 1, 0.05); after(1.6, () => sayI('Out of the little speaker: someone breathing, close to the box over there. Then a click on the line, and silence. They heard it open. They\'re listening to you listening.', 8000)); }
      else if (S.icSel === 'sas') sayI('The wet room: water lapping in the moon pool, and the drip of the suits on the rack.', 4500);
      else if (S.icSel === 'cloche') sayI('The bell: a hollow, empty sound, like a shell held to your ear.', 4500);
      else sayI('The ship\'s line: nothing but a hiss.', 3500);
    });
  }
}
// the conversations, through the wet room's speaker
const CONVS = {
  c1: [['r', 'c1a'], ['v', 'c1b'], ['m', 'c1c'], ['v', 'c1d'], ['i', 'c1e', () => after(1.2, () => knocks4(new THREE.Vector3(0, FY - 0.5, 0), 0.4, 1))]],
  c2: [['r', 'c2a'], ['v', 'c2b'], ['i', 'c2c'], ['r', 'c2d'], ['m', 'c2e'], ['m', 'c2f'], ['m', 'c2g']],
  c3: [['i', 'c3a'], ['v', 'c3b'], ['i', 'c3c'], ['m', 'c3d'], ['v', 'c3e']],
};
const SUBS = { c1a: 'My head\'s pounding. The air\'s getting heavy.', c1b: 'It\'s the CO2. The canister\'s spent.', c1c: 'The new ones are in the pot. Out by the moon pool.', c1d: 'I\'m not going out there. Not with him out there.', c1e: 'Shh. He\'s knocking again.',
  c2a: 'The air\'s better. Someone\'s changed the canister.', c2b: 'Nobody\'s left this room.', c2c: 'It\'s him all right. He\'s helping us.', c2d: 'Jean. What happened down there?', c2e: 'His line caught in the hold. I was out of air.', c2f: 'He was pulling me down with him. So I cut it.', c2g: 'I threw the knife down the well. I never want to see it again.',
  c3a: 'He knocks four times. Always four.', c3b: 'So?', c3c: 'Four pulls on a line means: haul me up.', c3d: 'If he wants to go up, I\'ll give him the key myself.', c3e: 'And how are you going to ask him?',
  k4a: 'He knocked four times.', k4b: 'Give him the key.', kx: 'Go away!', k0: 'Who... who\'s there?', mu1: 'Nobody goes out before dawn.', mu2: 'It\'s gone cold all of a sudden.', mu3: 'He\'s behind the door.',
  so1: 'Jean, look. Footprints.', so2: 'Don\'t look. Come back.', p1: 'Méduse, Méduse, this is Aldébaran. Come in.', p2: 'Jean, can you hear me? All I can hear is water.', p3: 'Méduse, the surface is calm. We\'ll be waiting for you at dawn.' };
const relayOn = () => S.icListen && S.icOut === 'sas' && S.icSel === 'chambre';
function convWanted() {
  if (!S.heard.includes('c1') && !S.flags.scrubbed) return 'c1';
  if (S.flags.scrubbed && !S.heard.includes('c2')) return 'c2';
  if (S.heard.includes('c2') && !S.heard.includes('c3') && G.time - (V.c2At || -999) > 25) return 'c3';
  return null;
}
async function playConv(id) {
  V.conv = { id, tok: (V.convTok = (V.convTok || 0) + 1) }; const tok = V.convTok;
  if (!S.ev['convStart_' + id]) { S.ev['convStart_' + id] = true; sClick(POS.speaker, 0.2, 1800); }
  await wait(1200);
  for (const [who, clip, fx] of CONVS[id]) {
    if (V.convTok !== tok || !convCanRun()) { if (V.convTok === tok) { V.conv = null; sayI('The voices on the speaker stop. You\'re too close: they can feel you.', 4500); } return; }
    if (fx) fx();
    await line(clip, NAMES[who] + ' · on the speaker', SUBS[clip], { fx: 'phone', pos: POS.speaker.clone(), volume: 1.05, wet: 0.12 });
    await wait(500 + Math.random() * 500);
  }
  if (V.convTok !== tok) return;
  V.conv = null; heard(id); if (id === 'c2') { V.c2At = G.time; flag('knifeKnown'); } if (id === 'c3') flag('signalKnown');
}
const convCanRun = () => relayOn() && inWet() && !G.uiOpen;
function convUpdate() {
  if (V.conv && !convCanRun()) { V.convTok++; V.conv = null; stopSpeech(); sayI('The voices on the speaker stop. You\'ve gone too near: they can feel you.', 4500); return; }
  if (V.conv || G.cutscene) return;
  if (!relayOn() || !inWet()) return;
  const w = convWanted(); if (!w) return;
  if (G.time - (V.convEnd || -99) < 3) return;
  playConv(w).then(() => { V.convEnd = G.time; });
}
// muffled voices through the bulkhead, when you're in the main module but not near the hatch; they stop as you come close
function muffleUpdate(dt) {
  if (V.mode !== 'station' || G.cutscene) return;
  V.muT = (V.muT ?? 12) - dt;
  if (V.mu && P.x > MM.x1 - 1.9) { V.mu = null; stopSpeech(); if (!S.flags.voicesStopped) { flag('voicesStopped'); after(0.3, () => sayI('The voices stop the moment you come near the hatch. Not a sound from the other side now. Someone is holding their breath.', 7000)); } }
  if (V.muT > 0 || !inMM() || P.x > MM.x1 - 2.4 || P.x < 5.0 || V.conv || (S.ev.muN || 0) >= 4) return;
  V.muT = rand(40, 70); S.ev.muN = (S.ev.muN || 0) + 1; const k = ['mu1', 'mu2', 'mu3'][(S.ev.muN - 1) % 3]; V.mu = { k, at: G.time };
  line(k, '', `<i>(muffled, through the bunk-room hatch)</i> ${SUBS[k]}`, { fx: 'muffled', pos: POS.hatch.clone(), volume: 0.75, wet: 0.2 }).then(() => { heard('mu'); after(4, () => { V.mu = null; }); });
}

/* ---------------- knocking on the bunk-room hatch, the pass-through ---------------- */
function hatchActions() {
  return [A_('Knock', knock), A_('Try the wheel', () => { sClank(POS.hatch.clone(), 0.3); sayI(S.ev.wheelTried ? 'It won\'t turn. Someone on the other side is holding it.' : 'You take the wheel in both hands and heave. It gives a finger\'s width, then jerks back hard: it\'s dogged from the other side, and someone over there is hanging on to the wheel with all their weight.', 7000); S.ev.wheelTried = true; save(); })];
}
function knock() {
  sKnock(POS.hatch.clone().add(new THREE.Vector3(-0.1, 0, 0)), 0.8, 0, 0.2); flag('knocked');
  V.knock = V.knock || { n: 0 }; V.knock.n++; V.knock.t = 0;
}
function knockUpdate(dt) {
  const k = V.knock; if (!k) return; k.t += dt; if (k.t < 1.7) return;
  const n = k.n; V.knock = null; const hp = POS.hatch.clone();
  if (G.time < (V.sulk || 0)) { after(0.6, () => sayI('Nothing. Not a sound from the other side.', 3000)); return; }
  if (!S.flags.scrubbed) { if (!S.ev.slurred) { S.ev.slurred = true; after(1.0, () => line('k0', 'Ribes · through the hatch', SUBS.k0, { fx: 'muffled', pos: hp, volume: 0.85 }).then(() => sayI('Thick-tongued and slow, like a drunk. Then nothing. The air in there must be bad.', 6000))); } else after(0.8, () => sayI('Somebody shifts behind the hatch and mumbles. That\'s all.', 3500)); return; }
  if (S.flags.keyGot) { after(0.9, () => sKnock(hp, 0.5, 0, 0.6)); return; }
  if (n === 1) { after(1.1, () => { sKnock(hp.clone().add(new THREE.Vector3(0.05, 0.1, 0)), 0.6, 0, 0.6); if (!S.ev.oneBack) { S.ev.oneBack = true; after(0.8, () => sayI('One knock comes back from the other side. Then silence.', 4500)); } }); return; }
  if (n === 4) {
    after(1.0, async () => { await line('k4a', 'Idris · through the hatch', SUBS.k4a, { fx: 'muffled', pos: hp, volume: 0.9 }); await wait(1400); await line('k4b', 'Morel · through the hatch', SUBS.k4b, { fx: 'muffled', pos: hp, volume: 0.9 }); heard('k4');
      await wait(5000); S.passReady = true; save(); sScrape(POS.pass.clone(), 0.5, 0.2); after(0.6, () => sClank(POS.pass.clone(), 0.4)); after(1.2, () => sayI('Something clunks into the little box in the bulkhead, beside the hatch. Then the far door of it shuts.', 6000)); });
    return;
  }
  S.wrong++; save(); V.sulk = G.time + 45;
  after(0.9, () => line('kx', 'Vasseur · through the hatch', SUBS.kx, { fx: 'muffled', pos: hp, volume: 1.0 }).then(() => { heard('kx'); after(0.5, () => sayI('Then silence, and the sound of someone crying.', 4000)); after(1.5, () => sSob(hp, 0.06)); }));
}
function passActions() {
  if (!S.passOpen) return [A_('Open the little door', () => { S.passOpen = true; save(); sCreak(POS.pass.clone(), 0.5, 0.12, 140); tween(0.5, t => { O.passDoor.rotation.y = -t * 1.8; }); if (S.passReady && !S.flags.keyGot) O.passKey.visible = true; updatePrompt(true); }), look('A small steel box through the bulkhead, with a door on each side, for passing things into the bunk room.')];
  if (S.passReady && !S.flags.keyGot) return [A_('Take what\'s inside', takeKey)];
  return [A_('Close the little door', () => { S.passOpen = false; save(); tween(0.5, t => { O.passDoor.rotation.y = -1.8 * (1 - t); }); }), look('Empty.')];
}
function takeKey() {
  flag('keyGot'); O.passKey.visible = false; give('key', true); give('page', true); S.docs.includes('torn') || S.docs.push('torn'); renderInv('key'); save();
  toast('Picked up: <b>The release key</b>, wrapped in <b>a torn page</b>', 4500);
  after(0.8, () => openDoc('torn'));
  after(30, () => { if (!S.ev.p3) { S.ev.p3 = true; ringPhone(); } });
}

/* ---------------- the telephone ---------------- */
function ringPhone() { V.ringing = 9; V.ringT = 0; S.ev.rings = (S.ev.rings || 0) + 1; }
function phoneActions() {
  return [A_(V.ringing > 0 ? 'Pick it up' : 'Pick up the telephone', pickPhone), look('The telephone to the ship, up a cable inside the umbilical: a bakelite handset on a hook box marked NAVIRE.')];
}
async function pickPhone() {
  const was = V.ringing > 0; V.ringing = 0; sClick(POS.phone, 0.25, 1200); O.handset.position.y = 0.12; after(5, () => { O.handset.position.y = 0.02; });
  if (!was) { sHissOnce(POS.phone.clone(), 0.04, 2.5, 2000); sayI('The hiss of the line, and far off, the sea. You say your name into it. Nobody answers.', 5500); return; }
  const o = { fx: 'phone', volume: 1.0 };
  if (S.ev.p3 && !S.ev.p3done) { S.ev.p3done = true; await line('p3', 'The ship · on the telephone', SUBS.p3, o); heard('ph3'); return; }
  await line('p1', 'The ship · on the telephone', SUBS.p1, o); await wait(900);
  sayI('"It\'s Lucien," you say. "Ferrand. Can you hear me?"', 3500); await wait(3200);
  await line('p2', 'The ship · on the telephone', SUBS.p2, o); heard('ph');
  after(0.6, () => sayI('You shout it this time. The man on the ship sighs, and puts the receiver down.', 5000));
}

/* ---------------- the floods, the face at the glass ---------------- */
function floodActions() { return [A_(S.floods ? 'Switch the floods off' : 'Switch the floods on', toggleFloods), look('A lever box: PROJECTEURS. The floodlights on the roof, outside.')]; }
function toggleFloods() {
  S.floods = !S.floods; flag('floodsUsed'); save(); sClank(POS.floods.clone(), 0.35); tween(0.3, t => { O.floodLever.rotation.x = S.floods ? 0.6 - t * 1.2 : -0.6 + t * 1.2; });
  if (S.floods && !S.ev.faceSeen && !V.face) after(1.4, () => { V.face = { t: 0, seen: 0, look: 0 }; O.faceGhost.visible = true; });
  if (S.floods) after(0.6, () => { if (!S.ev.floodsTold) { S.ev.floodsTold = true; sayI('Outside, the floodlights come up blue-white over the sand. Through the glass the sea is suddenly there, full of drifting specks, and fish turning in the light.', 7000); } });
}
function faceUpdate(dt) {
  const f = V.face; if (!f) return; f.t += dt;
  const iv = inView(O.faceGhost, 0.55) && camera.position.distanceTo(O.faceGhost.position) < 4;
  if (iv) { f.look += dt; if (!f.seen && f.look > 0.15) { f.seen = 1; G.fearT = Math.max(G.fearT || 0, 0.45); sBreath(camera.position.clone().add(new THREE.Vector3(0.3, 0, 0.2)), 1, 0.12, true); } }
  O.faceGhost.position.x = Math.sin(G.time * 0.6) * 0.03; O.faceGhost.rotation.z = Math.sin(G.time * 0.5) * 0.1;
  if ((f.seen && f.look > 0.5) || f.t > 20) {
    O.faceGhost.visible = false; V.face = null; S.ev.faceSeen = true; save(); if (f.seen) { V.flick = 0.6; after(0.6, () => sayI('There was a face at the glass. A man\'s face, close against it, no mask, eyes wide open. And not one bubble came out of its mouth.', 8000)); }
  }
}

/* ---------------- the tank, the fill stand, the kit ---------------- */
function tankActions(k) {
  const slot = O.tanks[k].userData.slot;
  if (slot === 5) return [look('The white tank, tagged on its valve: O₂ · DÉCO. Pure oxygen, for decompression stops in the shallows. Never below six metres.')];
  const nm = ['Morel', 'Vasseur', 'Hamid', 'Ribes'][slot], bar = [20, 25, 15, 200][slot];
  if (slot === 3) return [look('Ribes\'s tank: full, 200 bar, and the valve wired shut with a seal and a tag in Morel\'s hand: RÉSERVE · NE PAS TOUCHER. The emergency tank. You\'d need pliers, and a reason.')];
  if (S.tankAt !== 'rack') return [look(`${nm}\'s tank. Its gauge reads ${bar} bar: tonight's dive nearly emptied it.`)];
  return [A_(`Pick up ${nm}\'s tank`, () => { S.tankSlot = slot; S.tankBar = bar; S.tankAt = 'hand'; O.tanks[k].visible = false; pickUp('tankE'); }), look(`${nm}\'s tank. Its gauge reads ${bar} bar: tonight's dive nearly emptied it. You need 150 or more.`)];
}
function returnTankToRack() { const t = O.tanks.find(x => x.userData.slot === S.tankSlot); if (t) t.visible = true; S.tankAt = 'rack'; }
function fillActions() {
  if (S.tankAt === 'stand') return [A_('Take the tank', () => { if (S.tankBar >= 150) { S.tankAt = 'taken'; O.standTank.visible = false; give('tank'); save(); after(0.3, () => sayI(`${Math.round(S.tankBar)} bar. Enough for thirty metres.`, 3500)); } else { O.standTank.visible = false; S.tankAt = 'hand'; pickUp('tankE'); after(0.3, () => sayI(`Only ${Math.round(S.tankBar)} bar. Not enough.`, 3500)); } }), look(`${tankName()} in the stand, the fill whip on its valve. Its gauge reads ${Math.round(S.tankBar)} bar.`)];
  if (holding('tankE')) return [A_('Stand the tank in the fill stand', () => { useUpHeld(); S.tankAt = 'stand'; O.standTank.visible = true; sThunk(POS.fill.clone().setY(FY + 0.1), 0.4, 160); sClick(POS.fill.clone().setY(FY + 0.6), 0.25, 1800); save(); after(0.3, () => sayI('You stand it in the cradle and screw the fill whip onto its valve.', 4000)); })];
  return [look(S.tankAt === 'taken' ? 'The fill stand, empty.' : 'The fill stand, under the gas wall: a cradle for a tank, and the fill whip hanging down from the REMPL. outlet to screw onto its valve.')];
}
function kitCheck() { if (!S.flags.kitReady && took('mask') && took('knife') && took('tank')) { flag('kitReady'); after(0.5, () => sayI('Mask, knife, a full tank. Everything the card asks for.', 4000)); } }

/* ---------------- the knife ---------------- */
function knifeActions() { if (!V.onLedge) return [look('A knife, lying on the ledge down inside the skirt. From up here you can\'t reach it.')]; return [A_('Take the knife', () => { flag('knifeGot'); give('knife'); kitCheck(); sClick(O.knife.position, 0.25, 2600); after(0.4, () => sayI('Jean\'s diving knife. A frayed end of yellow line is still caught in its teeth. Yellow, like yours.', 6000)); })]; }

/* ---------------- swimming ---------------- */
function startDive() {
  if (!took('mask') || !took('knife') || !took('tank')) { sayI('The card: mask, knife, a full tank. Not without all three.', 3500); return; }
  if (HOLD.cur) { toast('Put down what you\'re carrying first (Q).', 2500); return; }
  G.cutscene = true; flag('dived'); save();
  if (S.flags.lampTaken) S.lampOn = true;
  const top = new THREE.Vector3(-MP.r - 0.3, FY, 0), lip = new THREE.Vector3(-MP.r + 0.24, FY + 0.12, 0), wat = new THREE.Vector3(-MP.r + 0.3, FY - S.lvl - 0.9, 0);
  sayI('You spit in the mask, pull it on, settle the tank on your back and climb down the ladder into the black water.', 6000);
  const p0 = new THREE.Vector3(P.x, BODY.y, P.z);
  tween(4.5, k => { const p = k < 0.3 ? p0.clone().lerp(top, k / 0.3) : k < 0.55 ? top.clone().lerp(lip, (k - 0.3) / 0.25) : lip.clone().lerp(wat, (k - 0.55) / 0.45); P.x = p.x; P.z = p.z; BODY.y = BODY.ys = p.y; BODY.vy = 0; BODY.ground = true; solidSet(O.climbSolid, p.x - 0.15, p.x + 0.15, p.y - 0.2, p.y, p.z - 0.15, p.z + 0.15); O.climbSolid.on = true; G.eye = G.eyeT = p.y + BODY.standEye; G.yaw = Math.PI / 2; G.pitch = lerp(0, -0.9, k); if (k > 0.82 && !V.splashed) { V.splashed = true; sSlap(new THREE.Vector3(0, FY - S.lvl, 0), 0.5); } }, () => { V.splashed = false; O.climbSolid.on = false; enterWater(new THREE.Vector3(-0.2, FY - S.lvl - 0.6, 0)); }, k => k);
}
function enterWater(at) {
  V.mode = 'swim'; S.mode = 'swim'; BODY.on = false; G.cutscene = false; G.crouch = false;
  P.x = at.x; P.z = at.z; G.eye = G.eyeT = at.y; V.sp = { x: P.x, z: P.z };
  setWorldLook('sea'); $('#satMask').hidden = false; O.gaugeHand.visible = true; O.lampHand.visible = false;
  if (!S.ev.inWater) { S.ev.inWater = true;
    after(3.0, () => sayI('Cold, black water, and your lamp shining down the inside of the skirt to where it opens into the sea.', 6000));
    after(9.5, () => sayI('You breathe in. You breathe out. Your regulator should roar with bubbles at every breath. It isn\'t making a sound.', 7500));
    after(18, () => sayI('Not one bubble goes up past your mask. The gauge on your strap says 190 bar, and its needle hasn\'t moved.', 7500));
    after(6, () => { if (!S.ev.swimTold) { S.ev.swimTold = true; toast(G.touch ? 'You swim the way you look. The Up and Down buttons rise and sink.' : 'You swim the way you look. <kbd>Space</kbd> rises, <kbd>C</kbd> sinks, <kbd>Shift</kbd> kicks harder.', 7000); } });
  }
  updatePrompt(true); save();
}
function leaveWater() {
  V.mode = 'station'; S.mode = 'station'; BODY.on = true; setWorldLook('station'); $('#satMask').hidden = true; O.gaugeHand.visible = false;
  bodyPlace(-MP.r - 0.48, FY, 0, -Math.PI / 2); G.pitch = 0; sSlap(new THREE.Vector3(0, FY - S.lvl, 0), 0.3);
  if (S.flags.bodyTow && !S.flags.bodyClipped) { S.flags.bodyTow = false; sayI('You can\'t haul him up the ladder. You let him go, and he drifts down below the skirt.', 5000); placeBodyFree(); }
  sayI('You climb out onto the deck, streaming water.', 3000); save();
}
const swimDown = () => !!(keys.KeyC || keys.ControlLeft || V.tDown > 0), swimUp = () => !!(keys.Space || V.tUp > 0);
function swimConstrain(p) {
  // the engine moved you horizontally at a walk: slow it to a swim, and less so the more you look up or down
  const pr = V.sp || { x: p.x, z: p.z }; const k = (keys.ShiftLeft || keys.ShiftRight ? 0.62 : 0.42) * (0.3 + 0.7 * Math.cos(G.pitch));
  p.x = pr.x + (p.x - pr.x) * k; p.z = pr.z + (p.z - pr.z) * k;
  if (G.cutscene) return;
  const y = swimCollide(p, G.eye, pr); if (Math.abs(y - G.eye) > 1e-6) G.eye = G.eyeT = y;
}
/* ---------------- swimming: what you bump into ----------------
   Everything outside is solid: the station's hulls (sides, roofs and undersides), the gas banks, the legs and their
   braces, the ballast, the coral heads, the bell with her bottles and weights, the frame and the clump she stands on,
   the umbilical, the floods, and him on the line. You're pushed out whichever way is shortest, so you slide over a
   roof, under a hull, round a leg. Returns your height, which a roof or an underside can change. */
const SW = { r: 0.3, thin: 0.25, under: 0.32 };
function swimPushSeg(q, ax, ay, az, bx, by, bz, R) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz;
  const t = l2 ? clamp(((q.x - ax) * dx + (q.y - ay) * dy + (q.z - az) * dz) / l2, 0, 1) : 0;
  const cx = ax + dx * t, cy = ay + dy * t, cz = az + dz * t, ex = q.x - cx, ey = q.y - cy, ez = q.z - cz, d = Math.hypot(ex, ey, ez);
  if (d >= R) return;
  if (d < 1e-6) { q.y = cy + R; return; }
  q.x = cx + ex / d * R; q.y = cy + ey / d * R; q.z = cz + ez / d * R;
}
// a box (turned about y by rot, as three.js measures it) that you leave by the nearest of the faces allowed
function swimPushBox(q, cx, cz, hx, hz, y0, y1, rot = 0, faces = 'XxZzUD') {
  const c = Math.cos(rot), n = Math.sin(rot), dx = q.x - cx, dz = q.z - cz;
  let lx = dx * c - dz * n, lz = dx * n + dz * c; const ex = hx + SW.r, ez = hz + SW.r, top = y1 + SW.r, bot = y0 - SW.under;
  if (Math.abs(lx) >= ex || Math.abs(lz) >= ez || q.y >= top || q.y <= bot) return;
  const opts = [['X', ex - lx], ['x', lx + ex], ['Z', ez - lz], ['z', lz + ez], ['U', top - q.y], ['D', q.y - bot]].filter(o => faces.includes(o[0]));
  let best = opts[0]; for (const o of opts) if (o[1] < best[1]) best = o;
  if (best[0] === 'X') lx = ex; else if (best[0] === 'x') lx = -ex; else if (best[0] === 'Z') lz = ez; else if (best[0] === 'z') lz = -ez; else if (best[0] === 'U') { q.y = top; return; } else { q.y = bot; return; }
  q.x = cx + lx * c + lz * n; q.z = cz - lx * n + lz * c;
}
// the wet room: a standing cylinder with a domed roof; its floor has the moon pool's skirt through it
function swimPushWet(q) {
  const Rh = WR.r + 0.1, Ro = Rh + SW.r, h = Math.hypot(q.x, q.z); if (h >= Ro) return;
  const bot = FY - 0.16 - SW.under, dR = Rh / Math.sin(0.62), dC = WR.top + 0.1 - dR * Math.cos(0.62), hh = Math.min(h, Rh), top = dC + Math.sqrt(dR * dR - hh * hh) + SW.r;
  if (q.y <= bot || q.y >= top) return;
  const side = Ro - h, down = q.y - bot, up = top - q.y;
  if (side <= down && side <= up) { if (h < 1e-6) q.x = Ro; else { q.x *= Ro / h; q.z *= Ro / h; } }
  else if (down <= up) q.y = bot; else q.y = top;
}
// the main module and the bunk room: one lying cylinder with a shallow dome at each end
function swimPushMain(q) {
  const Ro = MM.r + 0.1 + SW.r, rad = Ro;
  // the domes: out along the dome's own shape (an ellipsoid), so swimming at one head-on pushes you back, not sideways
  if (q.x < MM.x0 || q.x > BUNK.x1) {
    const x0 = q.x < MM.x0 ? MM.x0 : BUNK.x1, a = (q.x < MM.x0 ? MM.dome : BUNK.dome) + SW.r, ux = (q.x - x0) / a, uy = (q.y - MM.ay) / Ro, uz = q.z / Ro, u = Math.hypot(ux, uy, uz);
    if (u >= 1) return; if (u < 1e-6) { q.x = x0 + Math.sign(q.x - x0 || 1) * a; return; }
    q.x = x0 + ux / u * a; q.y = MM.ay + uy / u * Ro; q.z = uz / u * Ro; return;
  }
  const dy = q.y - MM.ay, d = Math.hypot(dy, q.z); if (d >= rad) return;
  if (d < 1e-6) { q.y = MM.ay - rad; return; }
  q.y = MM.ay + dy / d * rad; q.z = q.z / d * rad;
}
// a coral head or a reef rock: a height field from its own triangles (see buildSea), widened by your size
function rockTop(k, x, z) { const i = Math.floor((x - k.x0) / k.cell), j = Math.floor((z - k.z0) / k.cell); if (i < 0 || j < 0 || i >= k.nx || j >= k.nz) return -Infinity; return k.h[j * k.nx + i]; }
function swimPushRock(q, k) {
  if (q.x < k.x0 || q.x > k.x0 + k.nx * k.cell || q.z < k.z0 || q.z > k.z0 + k.nz * k.cell || q.y > k.top + SW.r) return;
  const H = rockTop(k, q.x, q.z); if (q.y >= H + SW.r) return;
  const up = H + SW.r - q.y; let dx = q.x - k.cx, dz = q.z - k.cz; const d = Math.hypot(dx, dz) || 1e-6; dx /= d; dz /= d;
  for (let s = k.cell; s < up; s += k.cell) if (rockTop(k, q.x + dx * s, q.z + dz * s) + SW.r <= q.y) { q.x += dx * s; q.z += dz * s; return; }
  q.y += up;
}
function swimCollide(p, y, pr) {
  const r = SW.r, q = { x: p.x, y, z: p.z }, prr = Math.hypot(pr.x, pr.z), inSkirt = prr < 0.62 && y < FY + 0.2;   /* in the skirt's tube, not over the roof */
  for (let it = 0; it < 2; it++) {
    // the skirt: inside it you stay inside, outside it you stay out (between its bottom and the deck)
    const hr = Math.hypot(q.x, q.z);
    if (q.y > FY - SKIRT - 0.15 && q.y < FY + 0.2) {
      const ri = q.y < FY - LEDGE_D + 0.1 ? 0.56 - SW.thin : MP.r - SW.thin;   // the tube is narrower below the ledge
      if (inSkirt) { if (hr > ri) { q.x *= ri / hr; q.z *= ri / hr; } }
      else if (hr < 1.0) { const a = Math.atan2(q.z, q.x); q.x = Math.cos(a) * 1.0; q.z = Math.sin(a) * 1.0; }
    }
    // the hulls: wet room, tunnel, main module and bunk room
    if (!inSkirt) swimPushWet(q);
    swimPushBox(q, (TUN.out0 + MM.x0) / 2, 0, (MM.x0 - TUN.out0) / 2, TUN.w / 2 + 0.1, FY - 0.02, FY + 0.08 + TUN.h + 0.1, 0, 'ZzUD');
    swimPushMain(q);
    // the legs and their braces, the ballast blocks chained to them
    for (const [x, z] of LEGS) { const dx = q.x - x, dz = q.z - z, d = Math.hypot(dx, dz); if (d < 0.38 && q.y < 3) { q.x = x + dx / (d || 1) * 0.38; q.z = z + dz / (d || 1) * 0.38; } }
    for (const b of BRACES) swimPushSeg(q, b[0], b[1], b[2], b[3], b[4], b[5], 0.05 + SW.thin);
    for (const [x, z] of BALLAST) swimPushBox(q, x, z, 0.45, 0.45, 0, 0.5, hash1(x), 'XxZzU');
    // the gas banks on their bracket outside the south porthole, and their pipes up to the hull
    swimPushBox(q, 0, 3.035, 1.35, 0.585, FY - 1.05, FY + 1.6, 0, 'XxZUD');
    // the floods on the roofs, and the umbilical going up from the main module into the dark
    swimPushSeg(q, 8.6, MM.ay + MM.r + 0.08, -0.7, 8.6, MM.ay + MM.r + 0.4, -0.7, 0.14 + SW.thin);
    swimPushSeg(q, -0.4, WR.top + 0.12, 2.0, -0.4, WR.top + 0.44, 2.0, 0.14 + SW.thin);
    for (let i = 0; i < UMB.length - 1; i++) swimPushSeg(q, ...UMB[i], ...UMB[i + 1], 0.09 + SW.thin);
    // the bell: her hull (in from underneath, through the door, is an action), her bottles and weights, her cable,
    // the frame she sits in and the concrete clump under it
    { const bx = BELL.x, bz = BELL.z, by = BELL.cy, vpA = Math.atan2(O.bellViewDir.z, O.bellViewDir.x);
      if (!(Math.hypot(q.x - bx, q.z - bz) < 0.32 && q.y < by - 1.05)) swimPushSeg(q, bx, by, bz, bx, by, bz, BELL.r + r);   /* up to her door, not through her */
      if (!V.ride) {
        for (const s of [-1, 0, 1]) { const a = vpA + Math.PI + s * 0.32, cx = bx + Math.cos(a) * 1.14, cz = bz + Math.sin(a) * 1.14; swimPushSeg(q, cx, by - 0.32, cz, cx, by + 0.6, cz, 0.09 + SW.thin); }
        for (const w of O.ballast) { const wp = w.getWorldPosition(V.tmpV || (V.tmpV = new THREE.Vector3())); swimPushSeg(q, wp.x, wp.y - 0.2, wp.z, wp.x, wp.y + 0.5, wp.z, 0.2 + SW.thin); }
        swimPushSeg(q, bx, by + BELL.r + 0.1, bz, bx, 40, bz, 0.03 + SW.thin);
      }
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + vpA + Math.PI / 4; swimPushSeg(q, bx + Math.cos(a), PLINTH.h, bz + Math.sin(a), bx + Math.cos(a) * 0.95, by - 0.45, bz + Math.sin(a) * 0.95, 0.06 + SW.thin); }
      swimPushBox(q, bx, bz, PLINTH.w / 2, PLINTH.w / 2, -1, PLINTH.h, -vpA, 'XxZzU'); }
    // him, on the line or drifting free (once you've got hold of him he comes with you)
    if (O.body.visible && O.body.parent === scene && !S.flags.bodyTow && !S.flags.bodyClipped) { const b = O.body.position, w = V.limbV || (V.limbV = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
      O.bodyPivot.updateWorldMatrix(true, false); O.bodyPivot.localToWorld(w[0].set(0, -0.4, 0)); O.bodyPivot.localToWorld(w[1].set(0, 0.5, 0)); swimPushSeg(q, w[0].x, w[0].y, w[0].z, w[1].x, w[1].y, w[1].z, 0.2 + SW.thin);   // his trunk and head
      for (const limb of O.bodyLimbs) for (let i = 0; i < limb.length - 1; i++) { limb[i].getWorldPosition(w[0]); limb[i + 1].getWorldPosition(w[1]); swimPushSeg(q, w[0].x, w[0].y, w[0].z, w[1].x, w[1].y, w[1].z, 0.08 + SW.thin); } }   /* his arms floating out in front of him, his legs trailing */
    // the coral heads and the reef
    for (const k of O.rockCols) swimPushRock(q, k);
    for (const f of O.fanCols) swimPushBox(q, f.x, f.z, f.hx, 0.03, f.y0, f.y1, f.rot);   // the sea fans on them
  }
  // how far you can go before the dark turns you round
  const cx = 4.5, cz = -2.5, dd = Math.hypot(q.x - cx, q.z - cz); if (dd > SWIM_R) { q.x = cx + (q.x - cx) / dd * SWIM_R; q.z = cz + (q.z - cz) / dd * SWIM_R; if (G.time - (V.toldDark || -99) > 15) { V.toldDark = G.time; toast('Beyond the floodlight the water is black as ink. Go any further and you\'d never find your way back.', 4500); } }
  p.x = q.x; p.z = q.z; return clamp(q.y, 0.42, swimCeil(q.x, q.z, y));
}
const LEGS = [[1.75, 1.75], [-1.75, 1.75], [1.75, -1.75], [-1.75, -1.75], [4.6, -1.05], [4.6, 1.05], [8.0, -1.05], [8.0, 1.05], [11.4, -1.05], [11.4, 1.05], [13.6, -1.05], [13.6, 1.05]];
const BRACES = [[1.75, 1.0, 1.75, -1.75, 1.0, 1.75], [1.75, 1.0, -1.75, -1.75, 1.0, -1.75], [4.6, 0.9, -1.05, 13.6, 0.9, -1.05], [4.6, 0.9, 1.05, 13.6, 0.9, 1.05]];
const BALLAST = [[2.6, 2.4], [-2.6, -2.2], [7.0, 2.1], [12.0, -2.1]];
const UMB = [[6.0, MM.ay + MM.r + 0.1, 0.3], [6.1, MM.ay + 2.6, 0.6], [5.6, 9, 2.4]];
// the only ceiling left is the moon pool's surface (the hulls' undersides are part of their shapes above)
function swimCeil(x, z, y) {
  if (Math.hypot(x, z) < 0.5 && (y === undefined || y < FY + 0.2)) return FY - S.lvl - 0.12;
  return 7.5;
}
function swimUpdate(dt) {
  if (V.mode !== 'swim') return;
  // up and down: the way you look as you kick, and the rise and sink keys
  let vy = 0; const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + (TOUCH.stick ? -TOUCH.my : 0);
  vy += fwd * Math.sin(G.pitch) * 0.9; if (swimUp()) vy += 0.75; if (swimDown()) vy -= 0.75; if (keys.ShiftLeft || keys.ShiftRight) vy *= 1.4;
  if (V.tUp > 0) V.tUp -= dt; if (V.tDown > 0) V.tDown -= dt;
  let y = G.eye + vy * dt; const ceil = swimCeil(P.x, P.z, G.eye); y = clamp(y, 0.42, ceil); if (y > 7.4 && G.time - (V.toldUp || -99) > 15) { V.toldUp = G.time; toast('Thirty metres of black water over your head. Without the bell, the bends would kill you before you reached the surface.', 5000); }
  if (!G.cutscene) y = swimCollide(P, y, { x: P.x, z: P.z });
  G.eye = G.eyeT = y + Math.sin(G.time * 1.1) * 0.004;
  V.sp = { x: P.x, z: P.z };
  // the snow around you, and the light
  O.nearSnow.position.set(Math.floor(P.x / 6) * 6, Math.floor(y / 6) * 6, Math.floor(P.z / 6) * 6);
  // the body: the reveal, then cut free, tow, clip
  bodyUpdate(dt);
  // the surface inside the skirt: climb out
  V.atSurface = Math.hypot(P.x, P.z) < 0.5 && y > FY - S.lvl - 0.5 && y < FY;
  V.underBell = Math.hypot(P.x - BELL.x, P.z - BELL.z) < 0.55 && y < BELL.cy - 0.75 && y > 0.4;
  updatePrompt();
}
function swimPrompt() {
  const acts = swimActs(); if (!acts.length) return '';
  return `<span class="nm">${esc(acts.nm)}</span>` + acts.map((a, i) => `<span class="act"><kbd>${i === 0 ? 'E' : 'R'}</kbd>${esc(a.label)}</span>`).join('');
}
function swimActs() {
  let a = [], nm = '';
  if (V.atSurface) { nm = 'The moon pool'; a.push(A_('Climb out', leaveWater)); }
  else if (V.nearBody && !S.flags.bodyClipped) {
    nm = S.flags.bodyRevealed ? 'You' : 'A diver on the line';
    if (S.flags.bodyRevealed && !S.flags.bodyCut) a.push(A_('Cut him free', cutBody));
    else if (S.flags.bodyCut && !S.flags.bodyTow) a.push(A_('Take hold of him', () => { flag('bodyTow'); save(); sayI('You take him under the arms. He weighs nothing in the water.', 4000); }));
    else if (S.flags.bodyTow && V.nearClip) a.push(A_('Clip him to the bell', clipBody));
  }
  if (!a.length && V.nearClip && S.flags.bodyTow) { nm = 'The shackle on the bell'; a.push(A_('Clip him to the bell', clipBody)); }
  if (!a.length && V.underBell) {
    nm = 'Under the bell';
    if (!S.flags.bellBlown) a.push(A_('Swim up into the bell', () => sayI('You put your head up into the door. It\'s full of water: no air in her. She needs blowing down from the gas wall first.', 6000)));
    else if (S.flags.bodyTow && !S.flags.bodyClipped) a.push(A_('Swim up into the bell', () => sayI('Not yet. Clip him on first: there\'s a shackle on the bell\'s side, toward the station.', 5000)));
    else if (!S.flags.bodyClipped) a.push(A_('Swim up into the bell', () => sayI(S.flags.bodyRevealed ? 'Not without him.' : 'Something under the station is still knocking. Four times, and four times. You can\'t go without seeing what it is.', 5500)));
    else a.push(A_('Swim up into the bell', enterBell));
  }
  a.nm = nm; return a;
}

/* ---------------- your body ---------------- */
function bodyUpdate(dt) {
  const b = O.body; if (!b.visible) return;
  const cam = camera.position, bp = new THREE.Vector3(); O.bodyLook.getWorldPosition(bp);
  const d = cam.distanceTo(bp);
  V.nearBody = d < 1.9 && !S.flags.bodyClipped;
  const clipW = new THREE.Vector3(); O.bellClip.getWorldPosition(clipW); V.nearClip = cam.distanceTo(clipW) < 1.7;
  // the reveal: the first time you come close with him in view
  const outOfSkirt = Math.hypot(P.x, P.z) > 0.75 || G.eye < FY - SKIRT - 0.1;   /* not through the skirt's steel */
  if (!S.flags.bodyRevealed && !V.reveal && outOfSkirt && d < 3.4 && inView(O.bodyLook, 0.8)) { V.reveal = { t: 0, y0: G.yaw, p0: G.pitch, r0: O.bodyPivot.rotation.y, c0: new THREE.Vector3(P.x, G.eye, P.z) }; G.cutscene = true; }
  if (V.reveal) {
    const r = V.reveal; r.t += dt; const t = r.t;
    // you drift in close, to an arm's length from his face
    if (!r.c1) { const h = new THREE.Vector3(r.c0.x - b.position.x, 0, r.c0.z - b.position.z); if (h.lengthSq() < 1e-4) h.set(1, 0, 0); h.normalize(); r.want = Math.atan2(h.x, h.z); r.c1 = new THREE.Vector3(b.position.x + h.x * 0.82, Math.min(bp.y - 0.03, swimCeil(b.position.x + h.x, b.position.z + h.z) - 0.05), b.position.z + h.z * 0.82); }
    const km = smooth(clamp((t - 0.5) / 6.5, 0, 1)), cp = r.c0.clone().lerp(r.c1, km); P.x = cp.x; P.z = cp.z; G.eye = G.eyeT = cp.y; V.sp = { x: P.x, z: P.z };
    // he turns, slowly, to face you
    let dr = r.want - r.r0; while (dr > Math.PI) dr -= TAU; while (dr < -Math.PI) dr += TAU;
    O.bodyPivot.rotation.y = r.r0 + dr * smooth(clamp((t - 1.5) / 5.5, 0, 1));
    // and your eyes stay on him
    O.bodyLook.getWorldPosition(bp); const dir = bp.clone().sub(cp).normalize(); const wy = Math.atan2(-dir.x, -dir.z), wp = Math.asin(clamp(dir.y, -1, 1)); let dy = wy - r.y0; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; const kk = smooth(clamp(t / 1.5, 0, 1)); G.yaw = r.y0 + dy * kk; G.pitch = lerp(r.p0, wp, kk);
    L.face.intensity = 0.4 * smooth(clamp((t - 2) / 4, 0, 1));
    if (t > 0.3 && !r.a) { r.a = 1; sayI('A diver, hanging on the yellow guideline, tangled at the leg of the station. His tank bumps the steel as he swings: knock, and knock.', 7000); knocks4(b.position.clone(), 0.5, 0.6); }
    if (t > 6.8 && !r.b) { r.b = 1; V.flick = 0.5; G.fearT = Math.max(G.fearT || 0, 0.5); sayI('He turns in the current. No mask. Eyes open. Grey. The name stencilled on his tank is FERRAND.', 7000); }
    if (t > 13 && !r.c) { r.c = 1; sayI('It\'s you.', 4000); sHeart(5, 0.4, 0.7); }
    if (t > 17.5) { V.reveal = null; G.cutscene = false; flag('bodyRevealed'); save(); after(0.5, () => sayI('Four pulls: haul me up. You came back for him.', 5000)); }
  }
  // tangled: he swings on the line and bumps the leg; cut: he drifts; towed: he follows; clipped: he hangs on the bell
  if (!S.flags.bodyCut) { O.bodyPivot.rotation.z = Math.sin(G.time * 0.5) * 0.12; if (!V.reveal) O.bodyPivot.rotation.y += Math.sin(G.time * 0.21) * dt * 0.1; b.position.y = 1.75 + Math.sin(G.time * 0.43) * 0.06; V.bumpT = (V.bumpT ?? 9) - dt; if (V.bumpT <= 0 && V.mode === 'swim') { V.bumpT = rand(10, 16); knocks4(new THREE.Vector3(-1.75, 1.6, -1.75), 0.45, 0.5); } }
  else if (S.flags.bodyTow && !S.flags.bodyClipped) { const f = camFwd(); const want = cam.clone().add(new THREE.Vector3(-f.x, 0, -f.z).normalize().multiplyScalar(1.0)).add(new THREE.Vector3(0, -0.35, 0)); b.position.lerp(want, Math.min(1, dt * 2.0)); O.bodyPivot.rotation.y = lerp(O.bodyPivot.rotation.y, G.yaw + Math.PI, Math.min(1, dt)); O.bodyPivot.rotation.x = lerp(O.bodyPivot.rotation.x, 0.9, Math.min(1, dt)); }
  else if (!S.flags.bodyClipped) { b.position.y = Math.max(0.9, b.position.y - dt * 0.05); }
  // his hair lifts and settles in the water
  if (O.bodyHair) O.bodyHair.forEach((h, k) => { h.rotation.x = Math.sin(G.time * 0.7 + k) * 0.35; });
}
function cutBody() {
  if (!took('knife')) { sayI('You need a knife for that line.', 3000); return; }
  flag('bodyCut'); save(); sScrape(camera.position, 0.5, 0.15);
  O.bodyLine.visible = false; O.bodyLineCut.visible = true;
  sayI('You saw at the yellow line with Jean\'s knife, where it\'s wound round the tank and round your arm. Strand by strand it parts. You drift free together.', 7000);
}
function placeBodyFree() { O.body.position.set(-1.2, 1.2, -2.2); }
function clipBody() {
  flag('bodyClipped'); S.flags.bodyTow = false; save(); sClank(camera.position.clone(), 0.3);
  O.bodyBell.add(O.body); O.body.position.set(-0.5, -1.0, 1.08); O.body.rotation.set(0, 0, 0); O.bodyPivot.rotation.set(0.9, Math.PI * 0.85, 0.05);
  sayI('You snap the shackle onto his harness. He hangs under the bell\'s side, turning slowly, as if he were waiting for you.', 6500);
}

/* ---------------- the bell ---------------- */
function enterBell() {
  G.cutscene = true; save();
  const a = new THREE.Vector3(BELL.x, G.eye, BELL.z), b = new THREE.Vector3(BELL.x, BELL_FLOOR + 0.82, BELL.z);
  tween(2.6, k => { const p = a.clone().lerp(b, smooth(k)); P.x = p.x; P.z = p.z; G.eye = G.eyeT = p.y; G.pitch = lerp(1.0, -0.2, k); if (k > 0.55 && !V.breached) { V.breached = true; sSlap(new THREE.Vector3(BELL.x, BELL_FLOOR, BELL.z), 0.4); setWorldLook('bell'); $('#satMask').hidden = true; O.gaugeHand.visible = false; } }, () => {
    V.breached = false; V.mode = 'bell'; S.mode = 'bell'; G.cutscene = false; flag('inBell'); save();
    sayI('You come up into air, and dry steel, and a little yellow light. You push the mask up onto your forehead. The bell rings faintly with every move you make.', 7500);
  });
}
function bellDoorActions() {
  if (S.flags.released) return [];
  if (!S.doorShut) return [A_('Close the door', () => { S.doorShut = true; save(); sCreak(O.bellDoor.getWorldPosition(new THREE.Vector3()), 0.6, 0.2, 130); tween(0.9, t => { O.bellDoorHinge.rotation.z = 1.75 * (1 - t); }, () => { sClank(O.bellDoor.getWorldPosition(new THREE.Vector3()), 0.5); }); }), A_('Go back down into the water', exitBell)];
  if (!S.doorDogged) return [A_('Dog it shut', () => { S.doorDogged = true; flag('doorShut'); save(); tween(1.2, t => { O.bellDoorWheel.rotation.y = t * Math.PI * 2; }); for (let i = 0; i < 4; i++) after(i * 0.28, () => sClick(O.bellDoor.getWorldPosition(new THREE.Vector3()), 0.25, 1800)); after(1.3, () => sayI('Four turns of the wheel and the dogs bite home. The door is sealed. Sound changes: close, dull, your own blood in your ears.', 6000)); }), A_('Open it again', () => { S.doorShut = false; save(); tween(0.9, t => { O.bellDoorHinge.rotation.z = 1.75 * t; }); })];
  return [look('Shut and dogged.'), A_('Undog it', () => { S.doorDogged = false; S.flags.doorShut = false; save(); tween(1.0, t => { O.bellDoorWheel.rotation.y = (1 - t) * Math.PI * 2; }); })];
}
function exitBell() {
  G.cutscene = true; setWorldLook('sea'); $('#satMask').hidden = false;
  const a = new THREE.Vector3(BELL.x, G.eye, BELL.z), b = new THREE.Vector3(BELL.x, BELL.cy - 1.55, BELL.z);
  tween(2.0, k => { const p = a.clone().lerp(b, smooth(k)); P.x = p.x; P.z = p.z; G.eye = G.eyeT = p.y; G.pitch = lerp(-0.6, -0.1, k); }, () => { G.cutscene = false; enterWater(new THREE.Vector3(BELL.x + 0.7, BELL.cy - 1.55, BELL.z + 0.7)); });
}
function releaseActions() {
  if (S.flags.released) return [];
  if (!S.keyIn) return [took('key') ? A_('Put the key in the release', () => { S.keyIn = true; O.bellKey.visible = true; sClick(O.bellRelease.getWorldPosition(new THREE.Vector3()), 0.3, 2000); save(); }) : look('A brass lock in a red plate: LARGAGE. The release. It takes the station chief\'s key.'), look('LARGAGE: the ballast release. Turn the key and the weights drop, and the bell goes up on her own.')];
  return [A_('Turn the key', () => {
    if (!S.doorDogged) { sayI('Not with the door open. Going up, the air in her would swell and pour out under the rim, and the sea would come in after it.', 6500); return; }
    release();
  }), look('The key is in the release.')];
}
function release() {
  flag('released'); save(); G.cutscene = true; V.ride = { t: 0 }; S.lampOn = false;
  tween(0.6, t => { O.bellKey.rotation.z = t * Math.PI / 2; });
  sClank(O.bellRelease.getWorldPosition(new THREE.Vector3()), 0.6);
  O.ballast.forEach((w, k) => { const p0 = w.position.clone(); const wp = new THREE.Vector3(); w.getWorldPosition(wp); scene.attach(w); const y0 = w.position.y; tween(1.1, t => { w.position.y = lerp(y0, 0.25, t * t); }, () => sThunk(w.position.clone(), 0.8, 70)); });
  after(1.4, () => sayI('The weights drop away with a clang you feel in your teeth. Then, slowly, she lifts.', 6000));
}
function rideUpdate(dt) {
  const r = V.ride; if (!r) return; r.t += dt; const t = r.t;
  const v = t < 1.6 ? 0 : Math.min(0.18, (t - 1.6) * 0.1);
  r.h = (r.h || 0) + v * dt;
  O.bellBody.position.y = BELL.cy + r.h + Math.sin(t * 0.8) * 0.01;
  O.bellBody.rotation.z = Math.sin(t * 0.5) * 0.015;
  O.bellBody.updateMatrixWorld(true);
  // you lean to the little window, your face against the glass
  const lean = smooth(clamp((t - 2.0) / 2.6, 0, 1)) * (1 - smooth(clamp((t - 16.5) / 3.5, 0, 1)));   /* and at the end you sit back from it */
  const c = new THREE.Vector3().setFromMatrixPosition(O.bellBody.matrixWorld);
  const seat = new THREE.Vector3(0, BELL_FLOOR - BELL.cy + 0.82, 0).applyMatrix4(O.bellBody.matrixWorld);
  const p = seat.lerp(c.clone().add(O.bellViewDir.clone().multiplyScalar(0.7)).add(new THREE.Vector3(0, -0.03, 0)), lean);
  P.x = p.x; P.z = p.z; G.eye = G.eyeT = p.y;
  L.bell.position.copy(new THREE.Vector3(0.3, 0.45, -0.5).applyMatrix4(O.bellBody.matrixWorld));
  // and look out at the one lit porthole, as far as the glass lets you
  if (r.y0 === undefined) { r.y0 = G.yaw; r.p0 = G.pitch; r.fov0 = camera.fov; }
  const dir = O.bunkWinPos.clone().sub(p).normalize(); let wy = Math.atan2(-dir.x, -dir.z), wp = Math.asin(clamp(dir.y, -1, 1));
  const vy = Math.atan2(-O.bellViewDir.x, -O.bellViewDir.z); let dd = wy - vy; while (dd > Math.PI) dd -= TAU; while (dd < -Math.PI) dd += TAU; wy = vy + clamp(dd, -0.42, 0.42); wp = clamp(wp, -0.48, 0.48);
  let dy = wy - r.y0; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; const k = smooth(clamp((t - 2.0) / 3, 0, 1)); G.yaw = r.y0 + dy * k; G.pitch = lerp(lerp(r.p0, wp, k), -0.55, smooth(clamp((t - 16.5) / 3.5, 0, 1)));
  if (!r.done) { camera.fov = lerp(r.fov0, 34, k * (1 - smooth(clamp((t - 16.5) / 3.5, 0, 1)))); camera.updateProjectionMatrix(); updateProj(); }
  if (t > 3.0 && !r.a) { r.a = 1; O.crewG.visible = true; O.bunkWinGlass.material.color.setHex(0xd8a060); O.bunkWinGlass.material.opacity = 0.1; sayI('You put your face to the little window. The station\'s side slides down past you, yellow in its own lights.', 6500); }
  if (t > 8.0 && !r.b) { r.b = 1; sayI('One porthole is lit. Four faces are crowded at it, looking out at you.', 6500); }
  if (t > 12.5 && !r.c) { r.c = 1; O.crewHand.visible = true; tween(1.2, kk => { O.crewHand.position.y = lerp(-0.12, -0.02, kk); }); sayI('Jean Morel lifts his hand and lays it flat against the glass.', 6000); }
  if (t > 17.5 && !r.d) { r.d = 1; sayI('They fall away below you into the dark. Under the bell, on its shackle, you are coming up too, turning slowly.', 6500); }
  if (t > 23.0 && !r.fade) { r.fade = true; G.blackT = 1; V.black = 4; }
  if (t > 26.0 && !r.done) { r.done = true; camera.fov = r.fov0; camera.updateProjectionMatrix(); updateProj(); flag('escaped'); const frame = endFrame(); finishRoom(frame); }
}

/* ---------------- the world's look: in the station (red, clear), in the sea, in the bell ---------------- */
function setWorldLook(m) {
  V.look = m;
  if (m === 'sea') { scene.fog.color.setHex(0x031216); scene.fog.density = 0.115; L.hemi.color.setHex(0x0a2a30); L.hemi.groundColor.setHex(0x020606); L.hemi.intensity = 0.35; O.nearSnow.visible = true; }
  else if (m === 'bell') { scene.fog.color.setHex(0x031216); scene.fog.density = 0.085; L.hemi.color.setHex(0x1a1408); L.hemi.groundColor.setHex(0x040302); L.hemi.intensity = 0.2; O.nearSnow.visible = false; }
  else { scene.fog.color.setHex(0x02080a); scene.fog.density = 0.1; L.hemi.color.setHex(0x1a0402); L.hemi.groundColor.setHex(0x080202); L.hemi.intensity = 0.18; O.nearSnow.visible = false; }
  scene.background = scene.fog.color.clone();
  V.envDue = true;
}

/* ---------------- footprints: you are always dripping ---------------- */
function footUpdate(dt) {
  for (const f of O.feet) { if (f.life > 0) { f.life -= dt; f.m.material.opacity = clamp(f.life / 20, 0, 0.75); if (f.life <= 0) f.m.visible = false; } }
  if (V.mode !== 'station' || !BODY.ground || G.cutscene) return;
  const d = Math.hypot(P.x - (V.fx ?? P.x), P.z - (V.fz ?? P.z));
  if (d > 0.62) { V.fx = P.x; V.fz = P.z; V.side = -(V.side || 1); const f = O.feet[(V.fi = ((V.fi || 0) + 1) % O.feet.length)]; const s = V.side * 0.1; f.m.position.set(P.x + Math.cos(G.yaw) * s, BODY.y + 0.004, P.z - Math.sin(G.yaw) * s); f.m.rotation.set(-Math.PI / 2, 0, G.yaw + (V.side > 0 ? 0 : 0)); f.m.scale.x = V.side; f.m.visible = true; f.life = 45; if (!S.ev.feetTold && G.play > 40) { S.ev.feetTold = true; after(1, () => sayI('Your bare feet leave wet prints on the deck. You\'re still dripping. You\'re still dripping after all this time.', 6000)); } }
}

/* ---------------- the crew come out, once ---------------- */
function sortieUpdate() {
  if (S.ev.sortie || !S.flags.scrubbed || V.mode !== 'station' || G.cutscene || V.conv) return;
  if (G.time - (V.scrubAt ?? G.time) < 25) { if (V.scrubAt === undefined) V.scrubAt = G.time; return; }
  if (!inWet() || P.x > 0.6) return;
  S.ev.sortie = true; save();
  const h = POS.hatch.clone(), mid = new THREE.Vector3(7.0, FY + 1.5, 0);
  sClank(h, 0.35); after(0.4, () => sCreak(h, 1.0, 0.2, 110));
  for (let i = 0; i < 5; i++) after(1.6 + i * 0.55, () => sStep(0.1));
  after(4.4, () => line('so1', 'A whisper, in the main module', SUBS.so1, { fx: 'whisper', pos: mid, volume: 1.0 }).then(() => line('so2', 'Another whisper', SUBS.so2, { fx: 'whisper', pos: mid.clone().add(new THREE.Vector3(1.5, 0, 0)), volume: 1.0 })).then(() => { heard('so'); sBreath(mid, 1, 0.2, false); for (let i = 0; i < 6; i++) after(0.2 + i * 0.25, () => sStep(0.16)); after(1.9, () => { sThunk(h, 0.7, 120); sClank(h, 0.5); }); O.slateText.visible = true; O.coffeeSteam.visible = true; after(2.6, () => sayI('Footsteps, running, and the bunk-room hatch slamming. Somebody was out there. They saw something, and ran.', 6500)); }));
}

/* ---------------- the slow presence: the director ---------------- */
const EVENTS = [
  { id: 'groan', ok: () => V.mode === 'station', run: () => sGroan(new THREE.Vector3(P.x + rand(-3, 3), FY + 1, P.z + rand(-2, 2)), 0.2, rand(2.5, 4)) },
  { id: 'knock', ok: () => V.mode === 'station' && S.coverOpen, run: () => { const a = rand(0, TAU); knocks4(new THREE.Vector3(Math.cos(a) * (WR.r + 0.2), FY - 0.2, Math.sin(a) * (WR.r + 0.2)), 0.4, 1); } },
  { id: 'drip', ok: () => inWet(), run: () => { for (let i = 0; i < 6; i++) after(i * rand(0.3, 0.7), () => sDrip(new THREE.Vector3(-1.5 + rand(-0.6, 0.6), FY + 0.1, -1.5), 0.08)); } },
  { id: 'dip', ok: () => V.mode === 'station', run: () => { V.dip = 1.4; sClick(null, 0.1, 6000); } },
  { id: 'phone', ok: () => V.mode === 'station' && (S.ev.rings || 0) < 2 && inMM(), run: () => ringPhone() },
  { id: 'sob', ok: () => inMM() && !S.flags.keyGot, run: () => sSob(POS.hatch.clone(), 0.05) },
  { id: 'fish', ok: () => S.floods && V.mode === 'station', run: () => { V.fishBurst = 2.5; } },
  { id: 'shark', ok: () => S.floods && (S.ev.sharks || 0) < 2, run: () => { S.ev.sharks = (S.ev.sharks || 0) + 1; V.shark = { t: 0 }; O.shark.visible = true; } },
  { id: 'slap', ok: () => S.coverOpen && V.mode === 'station', run: () => sSlap(new THREE.Vector3(0, FY - S.lvl, 0), 0.15) },
  { id: 'cold', ok: () => inMM() && P.x > 7, run: () => { sBreath(POS.hatch.clone(), 1, 0.06); } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || V.climb || V.ride || !S.flags.woke || V.mode === 'bell') return;
  V.dirT = (V.dirT ?? 40) - dt; if (V.dirT > 0) return;
  const opts = EVENTS.filter(e => e.id !== V.last && e.ok());
  if (opts.length) { const e = pick(opts); e.run(); V.last = e.id; }
  V.dirT = rand(55, 92) - progress() * 3;
}
// the knocking under the floor while the cover is shut: fours, with the surge
function knockUnderUpdate(dt) {
  if (S.coverOpen || V.mode !== 'station') return;
  if (V.knockQuiet > 0) { V.knockQuiet -= dt; return; }
  V.kuT = (V.kuT ?? 6) - dt; if (V.kuT > 0) return;
  V.kuT = rand(13, 22); knocks4(new THREE.Vector3(0, FY - 0.2, 0), inWet() ? 0.55 : 0.3, 1);
}

/* ---------------- sound beds ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.hum) return;
  const ctx = A.ctx, ir = ctx.createBuffer(2, ctx.sampleRate * 1.8, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < ch.length; i++) { ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.4) * (0.6 + 0.4 * Math.sin(i * 0.013)); } }
  A.rev.buffer = ir;
  A.loops.hum = loopNoise({ type: 'lowpass', f: 160, q: 1.2, vol: 0, brown: true, wet: 0.2 });
  A.loops.fan = loopNoise({ pos: POS.scrubber.clone().setY(FY + 0.9), type: 'bandpass', f: 1100, q: 0.9, vol: 0, wet: 0.15, ref: 1.2 });
  A.loops.sea = loopNoise({ type: 'lowpass', f: 90, q: 0.7, vol: 0, brown: true, wet: 0.5 });
  A.loops.gas = loopNoise({ pos: POS.manifold.clone(), type: 'bandpass', f: 3600, q: 0.6, vol: 0, wet: 0.2, ref: 1 });
  A.loops.pool = loopNoise({ pos: new THREE.Vector3(0, FY, 0), type: 'bandpass', f: 500, q: 0.8, vol: 0, wet: 0.4, ref: 1.2 });
  A.loops.purge = loopNoise({ pos: POS.pot.clone().setY(FY + 0.65), type: 'highpass', f: 5200, q: 0.7, vol: 0, wet: 0.1, ref: 0.8 });
  A.loops.bub = loopNoise({ pos: new THREE.Vector3(BELL.x, BELL.cy - 1.0, BELL.z), type: 'lowpass', f: 420, q: 1.4, vol: 0, brown: true, wet: 0.5, ref: 2 });
  A.loops.water = loopNoise({ type: 'lowpass', f: 260, q: 0.5, vol: 0, brown: true, wet: 0.6 });
  const tg = ctx.createGain(); tg.gain.value = 0; [36.7, 49, 55, 73.4].forEach(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = rand(-8, 8); o.connect(tg); o.start(); }); route(tg, { wet: 0.7 }); A.loops.drone = { gain: tg };
}
function soundUpdate(dt) {
  if (!A.ready || !A.loops.hum) return;
  const st = V.mode === 'station', sw = V.mode === 'swim';
  setGain(A.loops.hum, st ? 0.02 : 0.006, 1);
  setGain(A.loops.fan, st && !S.scrubOpen ? (S.flags.scrubbed ? 0.04 : 0.022) : 0, 0.5);
  setGain(A.loops.sea, sw ? 0.0 : 0.03, 1);
  setGain(A.loops.water, sw ? 0.09 : 0, 1);
  setGain(A.loops.gas, V.flowing ? 0.06 : 0, 0.2);
  setGain(A.loops.pool, S.coverOpen && st ? 0.025 : 0, 1);
  setGain(A.loops.purge, V.purging && S.potPurge < 1 ? 0.07 * (1 - S.potPurge * 0.6) : 0, 0.3);
  setGain(A.loops.bub, V.flowing && S.outOpen.bell ? (S.bellAir >= 1 ? 0.09 : 0.03) : 0, 0.5);
  setGain(A.loops.drone, 0.004 + progress() * 0.0008 + (sw ? 0.01 : 0), 2);
  // the phone ringing
  if (V.ringing > 0) { V.ringing -= dt; V.ringT -= dt; if (V.ringT <= 0) { V.ringT = 3.2; sRing(1.6); } }
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  G.flash = Math.max(0, (G.flash || 0) - dt * 2.2);
  V.black = Math.max(0, (V.black || 0) - dt);
  const f = S.flags;
  // where you are, the first times
  if (inMM() && !f.mmSeen) { flag('mmSeen'); after(0.4, () => sayI('The main module, red and quiet. A table with four cups on it. The galley. Your berth at the far end, by the bunk-room hatch, which is shut.', 7000)); }
  // the purge hissing the pot full
  if (V.purging && S.potPurge < 1) { S.potPurge = Math.min(1, S.potPurge + dt / 11); if (S.potPurge >= 1) { V.purging = false; save(); after(0.2, () => sayI('The hiss thins, and stops.', 3000)); } }
  // CO2: climbing at the rate of the four of them breathing, until the scrubber is fixed
  if (!f.scrubbed) S.co2 = Math.min(3.4, S.co2 + dt * 0.00012); else S.co2 = Math.max(0.35, S.co2 - dt * 0.012);
  // gauges
  O.panelNeedles.co2.rotation.z = dialAngle(S.co2, 0, 4); O.panelNeedles.depth.rotation.z = dialAngle(30.2, 0, 50); O.panelNeedles.pres.rotation.z = dialAngle(4.02 + (S.lvl - LVL.normal) * 0.1, 0, 6); O.panelNeedles.o2.rotation.z = dialAngle(20.4 - (S.co2 - 1) * 0.6, 0, 40);
  O.bankNeedles.forEach((n, k) => { n.rotation.z = dialAngle(S.bank[k], 0, 250); }); O.stationNeedle.rotation.z = dialAngle(4.02 + (S.lvl - LVL.normal) * 0.1, 0, 6);
  O.bellNeedle.rotation.z = dialAngle(V.ride ? 4.0 : (S.flags.bellBlown ? 4.0 : 4.0), 0, 6);
  // the fan
  if (!S.scrubOpen) O.fan.rotation.y += dt * (f.scrubbed ? 30 : 9);
  // the pot's cans, the scrubber's canister
  O.canOld.visible = !holding('canOld'); O.canNew.visible = !!S.canNewIn;
  gasUpdate(dt); levelUpdate(dt); knockUpdate(dt); convUpdate(); muffleUpdate(dt); faceUpdate(dt); sortieUpdate(); footUpdate(dt); swimUpdate(dt); rideUpdate(dt);
  knockUnderUpdate(dt); director(dt); soundUpdate(dt); bubblesUpdate(dt); kitCheck();
  // bubbles round the bell's skirt once she's full and the gas still comes
  if (V.flowing && S.outOpen.bell && S.bellAir >= 1 && Math.random() < dt * 22) bubble(new THREE.Vector3(BELL.x + rand(-0.4, 0.4), BELL.cy - 1.0, BELL.z + rand(-0.4, 0.4)), rand(0.04, 0.12), 1.2);
  if (V.mode === 'swim' && O.body.visible && !S.flags.bodyClipped && Math.random() < dt * 0.3) bubble(new THREE.Vector3(rand(-2, 12), 0.3, rand(-6, 3)), 0.03, 0.6);
  // lights: the red night lamps, dipping now and then; the lamp; the floods
  if (V.dip > 0) V.dip -= dt; if (V.flick > 0) V.flick -= dt;
  const dip = V.dip > 0 ? 0.35 + 0.65 * Math.abs(Math.cos(V.dip * 9)) : 1, fl = V.flick > 0 ? (Math.random() < 0.5 ? 0.15 : 1) : 1;
  const stK = V.look === 'station' ? 1 : V.look === 'sea' ? 0.55 : 0.3;
  L.wet.intensity = 2.2 * dip * stK; L.mm1.intensity = 1.8 * dip * stK; L.mm2.intensity = 1.8 * dip * stK;
  M.bulbRed.emissiveIntensity = 2.2 * dip;
  L.lamp.intensity = lampOn() && V.mode !== 'bell' && !V.ride ? (S.flags.capOff ? 3.2 : 3.4) * fl : 0; O.lampHand.visible = lampOn() && V.mode === 'station' && !G.cutscene; M.lampLens.emissiveIntensity = lampOn() ? 2 : 0;
  const fk = S.floods ? 1 : 0; L.floodN.intensity = fk * 70; L.floodS.intensity = fk * 45; O.floodHouses.forEach(l => l.material.emissiveIntensity = fk * 3);
  if (!V.reveal && L.face.intensity > 0) L.face.intensity = V.mode === 'swim' && V.nearBody ? Math.max(0.15, L.face.intensity - dt * 0.1) : Math.max(0, L.face.intensity - dt * 0.25); L.bell.intensity = (V.mode === 'bell' || V.ride) ? 0.75 : (S.flags.bellBlown ? 0.0 : 0); M.bulbWarm.emissiveIntensity = (V.mode === 'bell' || V.ride) ? 3 : 0;
  // the fish circle in the light; a shark crosses now and then
  fishUpdate(dt); if (V.shark) { V.shark.t += dt; const t = V.shark.t, x = lerp(-8, 18, t / 14); O.shark.position.set(x, 2.4 + Math.sin(t * 0.7) * 0.3, -9.5 + Math.sin(t * 0.3) * 1.2); O.shark.rotation.set(0, Math.PI / 2 + Math.sin(t * 2.2) * 0.08, 0); if (t > 14) { V.shark = null; O.shark.visible = false; } }
  O.snow.position.y = Math.sin(G.time * 0.05) * 0.4; O.snow.position.x = (G.time * 0.03) % 2;
  // the steam off the coffee they left
  if (O.coffeeSteam.visible) { O.coffeeSteam.position.y = 1.08 + (G.time * 0.1) % 0.12; O.coffeeSteam.material.opacity = 0.18 + Math.sin(G.time * 2) * 0.05; }
  G.blackT = Math.max(V.black > 0 ? 1 : 0, V.ride && V.ride.fade ? 1 : 0);
  if (BODY.low && G.time - BODY.low < 0.1 && !S.ev.toldCrouch) { S.ev.toldCrouch = true; toast(`Too low to stand. ${G.touch ? 'Crouch' : '<kbd>C</kbd>'} to get under.`, 4000); }
  // the hand of something passing below the skirt, once, while you stand on the ledge
  if (V.handPast > 0) { V.handPast -= dt; O.passHand.visible = V.onLedge && V.handPast > 0; O.passHand.position.set(lerp(-0.5, 0.5, 1 - V.handPast / 3), FY - SKIRT - 0.35, 0.05); if (V.handPast <= 0 && !S.ev.handSaid) { S.ev.handSaid = true; sayI('Something pale went past, down there, below the end of the skirt. Like a hand, open, drifting.', 6000); } } else O.passHand.visible = false;
  if (V.envDue) { V.envDue = false; V.envNow = true; }
}
function fishUpdate(dt) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  const burst = V.fishBurst > 0 ? 3 : 1; if (V.fishBurst > 0) V.fishBurst -= dt;
  O.fishP.forEach((f, i) => { f.ph += f.sp * dt * burst / f.r; const a = f.ph; p.set(f.c.x + Math.cos(a) * f.r, f.c.y + f.y + Math.sin(a * 2.3 + i) * 0.15, f.c.z + Math.sin(a) * f.r); e.set(0, -a + (f.sp > 0 ? 0 : Math.PI), Math.sin(G.time * 8 + i) * 0.15); q.setFromEuler(e); s.setScalar(f.s); m.compose(p, q, s); O.fish.setMatrixAt(i, m); });
  O.fish.instanceMatrix.needsUpdate = true;
}

/* ---------------- footsteps ---------------- */
function stepSound(v) { sStep(v * 0.7); if (Math.random() < 0.5) sDrip(camera.position.clone().setY(BODY.y + 0.1), 0.05); }

/* ---------------- interactions ---------------- */
function registerInteractions() {
  scene.updateMatrixWorld(true);
  const hb = (id, obj, pad) => { obj.updateWorldMatrix(true, true); return hitbox(id, obj, pad); };
  const hit = (w, h, d, x, y, z) => { const m = mbox(w, h, d, HITMAT, x, y, z, scene, 1); m.layers.set(2); m.userData.hit = true; return m; };
  // --- the wet room
  BANKS.forEach((b, k) => { inter('bank' + k, O.bankWheels[k], { name: `Bank ${b.n}`, reach: 1.7, actions: () => bankActions(k) }); hb('bank' + k, O.bankWheels[k], 0.035); const gg = O.bankGauges[k]; inter('bankG' + k, gg, { name: `Bank ${b.n}'s gauge`, reach: 1.7, actions: () => [look(`Bank ${b.n}: ${Math.round(S.bank[k])} bar.`)] }); hb('bankG' + k, gg, 0.02); const col = O.bankCollars[k]; col.userData.iid = 'bank' + k; });
  OUTLETS.forEach((o, k) => { inter('out' + k, O.outWheels[k], { name: ['Outlet: CLOCHE', 'Outlet: STATION', 'Outlet: REMPL.'][k], reach: 1.7, actions: () => outletActions(k) }); hb('out' + k, O.outWheels[k], 0.035); });
  inter('stationGauge', O.stationGauge, { name: 'Station pressure', reach: 1.8, actions: () => [look(`The station's pressure: ${(4.02 + (S.lvl - LVL.normal) * 0.1).toFixed(2)} bar, absolute. Thirty metres of sea, pressing on the moon pool's water, held down by the air in here.`)] }); hb('stationGauge', O.stationGauge, 0.02);
  inter('chart', O.chartG, { name: 'The colour plate', actions: () => [A_('Read it', () => openDoc('chart'))] }); hb('chart', O.chartG, 0.03);
  inter('card', O.cardG, { name: 'The transfer card', actions: () => [A_('Read it', () => openDoc('card'))] }); hb('card', O.cardG, 0.04);
  inter('fill', O.fillG, { name: 'The fill stand', reach: 2.0, actions: fillActions }); hb('fill', O.fillG, 0.06);
  inter('floods', O.floodBox, { name: 'The floods switch', actions: floodActions }); hb('floods', O.floodBox, 0.04);
  O.suits.forEach((s, k) => { inter('suit' + k, s, { name: ['Morel\'s wetsuit', 'Vasseur\'s wetsuit', 'Hamid\'s wetsuit', 'Ribes\'s wetsuit'][k], reach: 2.0, actions: () => [look(k === 3 ? 'Ribes\'s suit: bone dry. He stayed on watch tonight.' : `${['Jean Morel', 'Paul Vasseur', 'Idris Hamid'][k]}\'s suit, hung up by its shoulders, still dripping into the drain. They came back, then. All three of them.`)] }); });
  O.masks.forEach((m, k) => { inter('mask' + k, m, { name: 'A diving mask', reach: 2.0, enabled: () => !(k === 2 && took('mask')), actions: () => k === 2 ? [A_('Take the mask', () => { give('mask'); m.visible = false; kitCheck(); })] : [look(['Morel\'s mask, the strap mended with tape.', 'Vasseur\'s mask, the glass cracked across one corner.', '', 'Ribes\'s mask, dry.'][k]), took('mask') ? null : A_('Take it', () => sayI('Idris\'s fits you better: the one next to it.', 3000))] }); hb('mask' + k, m, 0.03); });
  O.tanks.forEach((t, k) => { inter('tank' + k, t, { name: () => t.userData.slot === 5 ? 'A white tank' : 'A yellow tank', reach: 2.0, enabled: () => t.visible, actions: () => tankActions(k) }); hb('tank' + k, t, 0.03); });
  O.rackShelfHit = hit(0.6, 0.15, 0.6, -1.46, FY + 0.47, -1.41); inter('fins', O.rackShelfHit, { name: 'Fins', actions: () => [look('Fins on the shelf. Yours are somewhere at sixty metres.')] });
  inter('locker', O.lockerG, { name: 'The dive locker', reach: 2.0, actions: () => { if (!S.lockerOpen) return [A_('Open it', () => { S.lockerOpen = true; save(); sCreak(POS.locker.clone().setY(FY + 1), 0.6, 0.15, 160); tween(0.7, t => { O.lockerDoor.rotation.y = -t * 1.7; }, syncDoorSolids); })]; if (!S.flags.lampTaken) return [A_('Take the hand lamp', () => { flag('lampTaken'); give('lamp'); O.lampWorld.visible = false; syncLamp(); toast(`${G.touch ? 'The Lamp button' : '<kbd>F</kbd>'} turns the lamp on and off.`, 5000); }), look('Spare straps, a coil of line, a red lift bag, and on the shelf a heavy hand lamp in a rubber case.')]; return [look('Spare straps, a coil of line, a red lift bag.')]; } });
  O.lockerHit = hit(0.55, 1.95, 0.5, POS.locker.x, FY + 0.97, POS.locker.z); O.lockerHit.userData.iid = 'locker';
  inter('pot', O.potG, { name: 'The supply pot', reach: 2.0, actions: potActions }); { const m = hit(0.56, 0.6, 0.56, POS.pot.x, FY + 0.3, POS.pot.z); m.userData.iid = 'pot'; } /* the body only: the purge screw on the lid stands above it */
  inter('purge', O.purge, { name: 'A little screw on the lid', reach: 1.6, enabled: () => !S.potOpen, actions: purgeActions }); hb('purge', O.purge, 0.03);
  inter('speaker', O.speakerG, { name: 'The wet room\'s speaker', reach: 2.6, actions: () => [look(relayOn() ? 'The intercom\'s speaker, its little lamp lit: it\'s carrying the bunk room.' : 'The intercom\'s speaker for the wet room, high on the wall. Silent.')] }); hb('speaker', O.speakerG, 0.05);
  inter('signals', O.signalsG, { name: 'A card on the rail', actions: () => [A_('Read it', () => openDoc('signals'))] }); hb('signals', O.signalsG, 0.04);
  O.coverHit = hit(1.6, 0.1, 1.6, 0, FY + 0.07, 0); /* thin, so the lead and the crucifix on top of it can be aimed at */ inter('cover', O.coverHit, { name: () => S.coverOpen ? 'The moon pool' : 'The moon pool\'s cover', reach: 2.2, enabled: () => !V.onLedge, actions: coverActions });
  O.cover.traverse(o => { if (o.isMesh) o.userData.iid = 'cover'; });
  O.leads.forEach((b, k) => { inter('lead' + k, b, { name: 'A block of lead', reach: 2.0, enabled: () => HOLD.cur !== 'lead' + k, actions: () => [A_('Pick up the lead', () => { S.leadOn[k] = false; pickUp('lead' + k); save(); })] }); hb('lead' + k, b, 0.04); });
  inter('crucifix', O.crucifix, { name: 'A crucifix', reach: 2.0, actions: () => S.crucifixOn ? [A_('Lift it off', () => { S.crucifixOn = false; save(); placeCrucifix(); sClick(O.crucifix.position, 0.2, 3000); sayI('A small brass crucifix on a chain. Jean\'s: he wears it under his shirt. You hang it on the rail.', 5000); })] : [look('Jean\'s crucifix, hanging on the rail.')] }); hb('crucifix', O.crucifix, 0.05);
  O.dogs.forEach((d, k) => { d.traverse(o => { if (o.isMesh) o.userData.iid = 'cover'; }); });
  inter('knife', O.knife, { name: 'A knife', reach: 2.4, enabled: () => !S.flags.knifeGot && S.lvl > LEDGE_D - 0.02, actions: knifeActions }); hb('knife', O.knife, 0.05);
  O.ledgeUpHit = hit(0.16, 1.4, 0.5, -MP.r + 0.06, FY - LEDGE_D + 0.7, 0); inter('ledgeUp', O.ledgeUpHit, { name: 'The ladder', reach: 2.0, enabled: () => !!V.onLedge, actions: () => [A_('Climb up', ledgeUp)] });
  for (const [p, nm, side] of [[POS.portN, 'A porthole', 'n'], [POS.portS, 'A porthole', 's'], [POS.portW, 'A porthole', 'w']]) { const m = hit(0.5, 0.5, 0.5, p.x * 0.96, p.y, p.z * 0.96); inter('port' + side, m, { name: nm, reach: 2.0, actions: () => [look(portLook(side))] }); }
  // --- the main module
  O.logHit = hit(0.44, 0.08, 0.32, POS.table.x - 0.4, FY + 0.8, -MMW + 0.2); inter('log', O.logHit, { name: 'The logbook', actions: () => [A_('Read it', () => openDoc('log'))] });
  O.cupsHit = hit(1.0, 0.12, 0.3, POS.table.x, FY + 0.82, -MMW + 0.48); inter('cups', O.cupsHit, { name: 'Cups', actions: () => [look('Four cups. Not five.')] });
  inter('ashtray', O.ashtray, { name: 'An ashtray', actions: () => [look('Jean\'s pipe, in the ashtray. You touch the bowl: it\'s still warm.')] }); hb('ashtray', O.ashtray, 0.04);
  inter('chess', O.chess, { name: 'A chess game', actions: () => [look('Your game with Paul, half played. It was your move. It\'s been your move since yesterday.')] }); hb('chess', O.chess, 0.02);
  inter('slate', O.slate, { name: 'A diver\'s slate', actions: () => [look(O.slateText.visible ? 'Somebody has written on the slate in grease pencil, in a hurry, and left it on the table where you\'d see it: merci. Thank you.' : 'A diver\'s slate and a grease pencil. Blank.')] }); hb('slate', O.slate, 0.03);
  inter('coffee', O.coffee, { name: 'The coffee pot', actions: () => [look(O.coffeeSteam.visible ? 'The coffee pot, hot. Someone has made fresh coffee, and poured a cup, and left it.' : 'The coffee pot on the hot plate. You touch it: still warm. Somebody was here not long ago.')] }); hb('coffee', O.coffee, 0.04);
  inter('knifeRack', O.knifeRack, { name: 'The knife rack', actions: () => [look('The knife rack over the counter is empty. Every knife in the galley is gone.')] }); hb('knifeRack', O.knifeRack, 0.05);
  inter('mirror', O.mirror, { name: 'The shaving mirror', actions: () => [A_('Lift the towel', () => { sayI(S.ev.towel ? 'You can\'t make yourself do it.' : 'You reach for the towel, and your hand stops an inch from it. You don\'t want to see. You couldn\'t say why.', 5500); S.ev.towel = true; save(); }), look('Somebody has hung a towel over the shaving mirror above the basin.')] }); hb('mirror', O.mirror, 0.04);
  inter('clock', O.clockG, { name: 'The galley clock', actions: () => [look('The galley clock has stopped at 23:52. Someone has taken out its battery and stood it on the shelf beside it.')] }); hb('clock', O.clockG, 0.04);
  O.berthHit = hit(1.9, 0.4, 0.72, POS.berth.x, POS.berth.y + 0.15, POS.berth.z); inter('berth', O.berthHit, { name: 'Your berth', actions: () => [look('Your berth. The mattress is bare. Your blanket has been folded into a square at the foot of it, very neatly, the way you never fold it.')] });
  inter('kitbag', O.kitbag, { name: 'Your kitbag', actions: () => [look('Your kitbag, packed and tied, on your stripped berth. Tied to the handle, a luggage label in Jean\'s hand: L. Ferrand. À remettre à Mme Ferrand, Saint-Malo. To be handed to Madame Ferrand.', 8000)] }); hb('kitbag', O.kitbag, 0.03);
  inter('photo', O.photo, { name: 'A photograph', actions: () => [look('You and Maman on the sea wall at Saint-Malo, the summer before you left. She made you wear a tie.')] }); hb('photo', O.photo, 0.04);
  inter('board', O.boardG, { name: 'The tag board', actions: () => [look('The tag board by the hatch: À BORD and DEHORS, aboard and outside. Four tags hang under À BORD: MOREL, VASSEUR, HAMID, RIBES. Yours hangs on its own under DEHORS.', 8000)] }); hb('board', O.boardG, 0.03);
  inter('hatch', O.hatchG, { name: 'The bunk-room hatch', reach: 1.9, actions: hatchActions }); hb('hatch', O.hatchG, 0.04);
  O.hatchWinHit = hit(0.1, 0.2, 0.2, MM.x1 - 0.06, POS.hatch.y + 0.24, POS.hatch.z); inter('hatchWin', O.hatchWinHit, { name: 'The hatch window', actions: () => [look('A little round window in the hatch. Someone has drawn a curtain across it on the other side. There\'s a light on in there.')] });
  inter('pass', O.passG, { name: 'The pass-through box', reach: 1.9, actions: passActions }); hb('pass', O.passG, 0.03);
  inter('passKey', O.passKey, { name: 'Something wrapped in paper', reach: 1.9, enabled: () => S.passOpen && S.passReady && !S.flags.keyGot, actions: () => [A_('Take it', takeKey)] }); hb('passKey', O.passKey, 0.05);
  inter('panel', O.panelG, { name: 'The control panel', reach: 2.0, actions: () => { if (!S.flags.co2Seen) flag('co2Seen'); return [look(`Depth 30 metres. Station pressure ${(4.02 + (S.lvl - LVL.normal) * 0.1).toFixed(1)} bar. Oxygen about 20%. CO₂ ${S.co2.toFixed(1)}%${S.flags.scrubbed ? ', and falling' : ', and climbing: green is under 1, red from 2'}. The lights are on NUIT, night setting, and the switch takes a key.`, 8000)]; } });
  O.co2Hit = hit(0.3, 0.3, 0.1, POS.panel.x + 0.5, FY + 1.42, -MMW + 0.18); inter('co2', O.co2Hit, { name: 'The CO₂ meter', actions: () => { if (!S.flags.co2Seen) flag('co2Seen'); return [look(`CO₂: ${S.co2.toFixed(2)}%${S.flags.scrubbed ? ', and falling.' : ', and climbing, slowly. Green is under 1%, red from 2%.'}`)]; } });
  O.keyHit = hit(0.12, 0.12, 0.1, POS.panel.x + 0.42, FY + 1.08, -MMW + 0.18); inter('keySwitch', O.keyHit, { name: 'The light switch', actions: () => [look('ÉCLAIRAGE: NUIT / JOUR. Lighting, night or day. It\'s on night, red, so the crew can sleep. It takes a key, and the key isn\'t here.')] });
  inter('intercom', O.icG, { name: 'The intercom', reach: 1.8, actions: icActions }); hb('intercom', O.icG, 0.04);
  inter('phone', O.phoneG, { name: () => V.ringing > 0 ? 'The telephone, ringing' : 'The telephone', reach: 1.8, actions: phoneActions }); hb('phone', O.phoneG, 0.04);
  inter('scrubber', O.scrubG, { name: 'The scrubber', reach: 1.8, actions: scrubActions }); hb('scrubber', O.scrubG, 0.04);
  inter('canOld', O.canOld, { name: () => S.canOldIn ? 'The scrubber' : 'The spent canister', reach: 1.8, enabled: () => HOLD.cur !== 'canOld', actions: () => S.canOldIn ? scrubActions() : [A_('Pick it up', () => pickUp('canOld'))] });
  O.mmPorts.forEach((o, k) => { const m = hit(0.45, 0.45, 0.4, o.x, o.p.y, o.s * (o.p.z * o.s - 0.1)); inter('mport' + k, m, { name: 'A porthole', reach: 2.0, actions: () => [look(mportLook(o))] }); });
  // --- the bell, from inside
  inter('bellDoor', O.bellDoor, { name: 'The bell\'s door', reach: 1.6, enabled: () => V.mode === 'bell', actions: bellDoorActions }); hb('bellDoor', O.bellDoor, 0.05);
  O.bellDoorHit = hit(0.7, 0.3, 0.7, BELL.x, BELL.cy - 0.85, BELL.z); O.bellDoorHit.userData.iid = 'bellDoor';
  inter('release', O.bellRelease, { name: 'The release', reach: 1.6, enabled: () => V.mode === 'bell', actions: releaseActions }); hb('release', O.bellRelease, 0.05);
  inter('bellVP', O.bellVP, { name: 'The bell\'s window', reach: 1.8, enabled: () => V.mode === 'bell', actions: () => [look('Through the thick little window, the station: yellow in its floodlights, one porthole warmly lit at the far end.')] }); hb('bellVP', O.bellVP, 0.05);
  inter('bellGauge', O.bellGauge, { name: 'The bell\'s gauge', reach: 1.6, enabled: () => V.mode === 'bell', actions: () => [look('4.0 bar: the pressure at the bottom. Sealed, she\'ll hold it all the way up.')] }); hb('bellGauge', O.bellGauge, 0.03);
}
function placeCrucifix() { if (S.crucifixOn) { O.crucifix.position.set(0.52, FY + 0.32, 0.52); O.crucifix.rotation.set(0, 0.8, 0); } else { O.crucifix.position.set(-0.55, FY + 0.97, -0.62); O.crucifix.rotation.set(0, 0.6, 0); } }
function portLook(side) {
  if (!S.floods) return 'Black glass. In it, the red room behind you looks back at you. Only the room.';
  if (side === 's') { if (!S.ev.banksSeen) S.ev.banksSeen = true; return 'Outside, in the blue-white floodlight, the five gas banks stand on their bracket below the porthole, numbered on their caps, each with a painted shoulder. In this light you can see their real colours.'; }
  if (side === 'n') return 'The sea floor in the floodlight: pale sand, coral heads, fish turning. The yellow guideline runs off from a leg of the station into the dark, toward the wreck.';
  return 'Sand, and the dark beyond the light, and things drifting in it like snow.';
}
function mportLook(o) {
  if (!S.floods) return 'Black glass, and the red room in it. Only the room.';
  if (o.s < 0) { const b = S.flags.bellBlown ? (V.flowing && S.outOpen.bell ? 'Gas is boiling out round the bottom of the bell in a skirt of silver bubbles: she\'s full.' : 'She\'s full of air now.') : (V.flowing && S.outOpen.bell ? 'Nothing to see yet. The gas going in is pushing the water out of her, quietly, from underneath.' : 'She sits in her frame, full of seawater, waiting.'); return `The bell, in its frame on the sand, orange in the floodlight, a few metres away. ${b}`; }
  return 'Sand and coral, in the floodlight. Fish. A long way off, the reef.';
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null, props: {}, held: null, ev: {},
    lampOn: false, floods: false, bank: BANKS.map(b => b.bar), bankOpen: BANKS.map(() => false), outOpen: { bell: false, station: false, fill: false },
    lvl: LVL.start, leadOn: [true, true, true, true], leadAt: {}, crucifixOn: true, dogsOn: true, coverOpen: false,
    potPurge: 0, potOpen: false, scrubOpen: false, canOldIn: true, canNewIn: false, canOldAt: null, co2: 1.8,
    icSel: 'sas', icOut: 'ici', icListen: false, passReady: false, passOpen: false, lockerOpen: false,
    bellAir: 0, tankAt: 'rack', tankSlot: 1, tankBar: 25, mode: 'station', doorShut: false, doorDogged: false, keyIn: false };
}
function applyState() {
  const f = S.flags;
  Object.assign(V, { climb: null, ride: null, reveal: null, conv: null, convTok: (V.convTok || 0) + 1, face: null, knock: null, mu: null, purging: false, onLedge: false, dirT: 40, kuT: 6, ringing: 0, dip: 0, flick: 0, black: 0, bulge: 0, shark: null, handPast: 0, sulk: 0, mode: 'station', tUp: 0, tDown: 0 });
  O.climbSolid.on = false; O.ledgeSolid.on = false; O.poolSolid.on = true; G.frozen = false; BODY.on = true;
  // a save in the water or in the bell resumes at the moon pool's ladder (the bell's door left open)
  if (S.mode !== 'station') { S.mode = 'station'; if (!f.released) { f.inBell = false; S.doorShut = false; S.doorDogged = false; S.keyIn = false; } if (f.bodyTow && !f.bodyClipped) { f.bodyTow = false; } }
  setWorldLook('station'); $('#satMask').hidden = true;
  // the gas wall
  BANKS.forEach((b, k) => { O.bankWheels[k].rotation.z = S.bankOpen[k] ? Math.PI * 1.5 : 0; });
  OUTLETS.forEach((o, k) => { O.outWheels[k].rotation.z = S.outOpen[o] ? Math.PI * 1.5 : 0; });
  // the cover, the lead, the crucifix, the clamps
  O.coverHinge.rotation.z = S.coverOpen ? -1.5 : 0;
  O.dogs.forEach(d => { d.userData.arm.rotation.y = S.dogsOn ? 0 : 1.6; });
  O.leads.forEach((b, k) => { const p = S.leadAt && S.leadAt['lead' + k]; if (!S.leadOn[k] && p) { b.position.set(p.x, p.y, p.z); b.rotation.set(0, p.ry || 0, 0); } else { b.position.copy(b.userData.home); b.rotation.set(0, b.userData.homeR, 0); } b.visible = true; });
  placeCrucifix();
  // the pot, the scrubber
  O.potLid.position.set(S.potOpen ? 0.33 : 0, S.potOpen ? 0.04 : 0.56, S.potOpen ? 0.32 : 0); O.potLid.rotation.set(0, 0, 0); O.potCans.visible = !!S.potOpen;
  O.potCans.children.forEach((c, i) => { c.visible = i < 2 ? !(took('cans') || S.cansUsed) : !took('letter'); });
  O.scrubLid.position.set(0, S.scrubOpen ? 0.84 : 0.76, S.scrubOpen ? 0.32 : 0); O.scrubLid.rotation.x = S.scrubOpen ? 0.25 : 0;
  if (S.canOldAt && !S.canOldIn) { scene.attach(O.canOld); O.canOld.position.set(S.canOldAt.x, S.canOldAt.y, S.canOldAt.z); O.canOld.rotation.set(0, 0, 0); } else { O.scrubG.add(O.canOld); O.canOld.position.set(0, 0.06, 0); O.canOld.rotation.set(0, 0, 0); if (!S.canOldIn) S.canOldIn = true; }
  // the intercom
  O.icKnob.rotation.z = -IC_SEL.indexOf(S.icSel) * Math.PI / 2; O.icOut.rotation.z = S.icOut === 'sas' ? 0.6 : -0.6; O.icLever.rotation.z = S.icListen ? 0.5 : -0.5; icChangedQuiet();
  // the locker, the lamp, the masks, the tanks, the stand
  O.lockerDoor.rotation.y = S.lockerOpen ? -1.7 : 0; syncDoorSolids(); O.lampWorld.visible = !f.lampTaken; syncLamp();
  O.masks[2].visible = !took('mask');
  O.tanks.forEach(t => { t.visible = !(t.userData.slot === S.tankSlot && S.tankAt !== 'rack'); });
  O.standTank.visible = S.tankAt === 'stand';
  if (S.tankAt === 'hand') S.tankAt = 'rack', O.tanks.forEach(t => { if (t.userData.slot === S.tankSlot) t.visible = true; });
  // the floods, the pass-through, the bunk-room things
  O.floodLever.rotation.x = S.floods ? -0.6 : 0.6;
  O.passDoor.rotation.y = S.passOpen ? -1.8 : 0; O.passKey.visible = S.passOpen && S.passReady && !f.keyGot;
  O.slateText.visible = !!S.ev.sortie; O.coffeeSteam.visible = !!S.ev.sortie;
  // the knife, the body, the bell
  O.knife.visible = !f.knifeGot;
  O.body.visible = true; O.bodyLine.visible = !f.bodyCut; O.bodyLineCut.visible = !!f.bodyCut && !f.bodyClipped;
  if (f.bodyClipped) { O.bodyBell.add(O.body); O.body.position.set(-0.5, -1.0, 1.08); O.bodyPivot.rotation.set(0.9, Math.PI * 0.85, 0.05); }
  else { scene.attach(O.body); if (f.bodyCut) placeBodyFree(); else { O.body.position.set(-1.45, 1.75, -2.0); O.bodyPivot.rotation.set(0, 2.4, 0); } }
  O.bellDoorHinge.rotation.z = S.doorShut ? 0 : 1.75; O.bellKey.visible = !!S.keyIn; O.bellBody.position.y = BELL.cy; O.ballast.forEach(w => { if (w.parent !== O.bellBody) O.bellBody.add(w); w.position.copy(w.userData.home); });
  O.crewG.visible = false; O.crewHand.visible = false; O.bunkWinGlass.material.color.setHex(0x3a2410); O.bunkWinGlass.material.opacity = 0.85;
  // what you carry
  for (const id in HOLD.defs) { const d = HOLD.defs[id]; if (d.hand) d.hand.visible = false; }
  HOLD.cur = null; S.inv = S.inv.filter(i => !HOLD.defs[i]);
  if (S.held && HOLD.defs[S.held] && S.held !== 'tankE') { const id = S.held; holdTake(id, true); S.inv.push(id); } else S.held = null;
  if (O.faceGhost) O.faceGhost.visible = false;
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDue = true; RAYLIST = null;
}
function icChangedQuiet() { O.icLamp.material.emissiveIntensity = S.icListen ? 2 : 0; O.speakerLamp.material.emissiveIntensity = S.icListen && S.icOut === 'sas' ? 2 : 0; }
function resumed() {
  // saved on the way up: you are still in the bell, and she goes up again
  if (S.flags.released && !S.flags.escaped) { S.flags.released = false; V.mode = 'bell'; S.mode = 'bell'; BODY.on = false; P.x = BELL.x; P.z = BELL.z; G.eye = G.eyeT = BELL_FLOOR + 0.82; G.pitch = -0.1; setWorldLook('bell'); S.doorShut = S.doorDogged = true; S.keyIn = true; O.bellDoorHinge.rotation.z = 0; O.bellKey.visible = true; after(1.2, release); return; }
  if ((!inWet() && !inMM()) || BODY.y < FY - 0.1 || BODY.y > FY + 0.6) { bodyPlace(-MP.r - 0.48, FY, 0, -Math.PI / 2); G.pitch = 0; }
}

/* ---------------- title: a porthole at night, the sea outside, the dark ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const W2 = 480, H2 = 270;
  g.fillStyle = '#05080a'; g.fillRect(0, 0, W2, H2);
  // the red room round the porthole
  const rg = g.createRadialGradient(W2 * 0.3, H2 * 0.1, 10, W2 * 0.4, H2 * 0.5, W2 * 0.7); rg.addColorStop(0, 'rgba(120,16,8,.55)'); rg.addColorStop(1, 'rgba(20,2,2,.9)'); g.fillStyle = rg; g.fillRect(0, 0, W2, H2);
  const cx = W2 * 0.66, cy = H2 * 0.52, R = 86;
  // the sea in the glass: blue-black, a floodlight cone, drifting snow
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  const sg = g.createLinearGradient(0, cy - R, 0, cy + R); sg.addColorStop(0, '#0a2a30'); sg.addColorStop(1, '#020a0c'); g.fillStyle = sg; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  const cone = g.createRadialGradient(cx - 30, cy - 70, 4, cx, cy + 40, 140); cone.addColorStop(0, 'rgba(150,210,220,.35)'); cone.addColorStop(1, 'rgba(40,90,100,0)'); g.fillStyle = cone; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  for (let i = 0; i < 70; i++) { const x = cx - R + ((i * 37.3 + t * 6 * (0.4 + (i % 5) * 0.12)) % (R * 2)), y = cy - R + ((i * 53.1 + t * 3 * (0.3 + (i % 3) * 0.2)) % (R * 2)); g.fillStyle = `rgba(200,230,230,${0.25 + (i % 4) * 0.1})`; g.fillRect(x, y, 1.5, 1.5); }
  // a face drifts past the glass now and then, and no bubbles rise from it
  const ph = (t % 23) / 23; if (ph > 0.62 && ph < 0.8) { const k = (ph - 0.62) / 0.18, fx = cx - R * 0.9 + k * R * 1.8, fy = cy + Math.sin(k * 3) * 6; const fg = g.createRadialGradient(fx, fy, 2, fx, fy, 26); fg.addColorStop(0, 'rgba(180,192,196,.75)'); fg.addColorStop(1, 'rgba(120,140,150,0)'); g.fillStyle = fg; g.beginPath(); g.ellipse(fx, fy, 20, 26, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(10,14,18,.85)'; g.beginPath(); g.arc(fx - 7, fy - 4, 2.6, 0, TAU); g.arc(fx + 7, fy - 4, 2.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(fx, fy + 11, 4, 2.4, 0, 0, TAU); g.fill(); }
  g.restore();
  // the porthole's heavy ring and bolts, catching the red light
  g.strokeStyle = '#2a0c08'; g.lineWidth = 22; g.beginPath(); g.arc(cx, cy, R + 11, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(200,60,40,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R + 4, Math.PI * 1.05, Math.PI * 1.7); g.stroke();
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.fillStyle = 'rgba(150,40,30,.7)'; g.beginPath(); g.arc(cx + Math.cos(a) * (R + 12), cy + Math.sin(a) * (R + 12), 3, 0, TAU); g.fill(); }
  // the glass: a red reflection of the room across it
  g.fillStyle = 'rgba(160,30,20,.08)'; g.beginPath(); g.ellipse(cx - 30, cy - 40, 40, 16, -0.5, 0, TAU); g.fill();
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(Math.random() * W2, Math.random() * H2, 1, 1); }
}

/* ---------------- the end: the ship's photographer, at dawn ---------------- */
function endFrame(skipEnv) {
  let url = null;
  /*DEBUG*/ if (window.__efs && window.__efs.skip) return null; if (window.__efs && window.__efs.env) skipEnv = true; /*END*/
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, far: cam.far }, fog = scene.fog.density, fogC = scene.fog.color.clone();
    for (const id in HOLD.defs) { const d = HOLD.defs[id]; if (d.hand) d.hand.visible = false; } O.lampHand.visible = false; O.gaugeHand.visible = false;
    // the bell on the deck, its door open; the station and the sea floor far below, hidden
    O.deckScene.visible = true; O.sea.visible = false; O.ext.visible = false; O.crewG.visible = false;
    const bb = O.bellBody, was = { par: bb.parent, p: bb.position.clone(), r: bb.rotation.clone() };
    O.deckScene.add(bb); bb.position.set(0, BELL.r + 0.32, 0); bb.rotation.set(0, 2.2, 0); O.bellDoorHinge.rotation.z = 2.4; O.bellKey.visible = true; O.bellCable.visible = false;
    if (O.body.parent === O.bodyBell) O.body.visible = false;
    O.bellFrameDeck.visible = true;
    const pu = post.uniforms, ex = pu.exposure.value; pu.exposure.value = 1.0; V.black = 0; G.black = 0; G.blackT = 0; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0;
    const lights = [L.wet, L.mm1, L.mm2, L.lamp, L.floodN, L.floodS, L.bell, L.face], li = lights.map(l => l.intensity); lights.forEach(l => l.intensity = 0);
    L.sun.intensity = 2.4; L.hemi.color.setHex(0x8aa0c0); L.hemi.groundColor.setHex(0x3a3028); L.hemi.intensity = 0.9;
    scene.fog.density = 0.004; scene.fog.color.setHex(0x9aa8b8);
    cam.fov = 46; cam.far = 1200; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(-4.6, 201.75, 3.9); cam.lookAt(0.6, 200.85, 0.3);
    /*DEBUG*/ if (window.__efs && window.__efs.cam) { const c = window.__efs.cam; cam.fov = c.fov; cam.updateProjectionMatrix(); cam.position.fromArray(c.p); cam.lookAt(...c.t); } /*END*/
    cam.updateMatrixWorld();
    const envWas = scene.environment; if (!skipEnv) { scene.environment = null; const rt = envFromScene(new THREE.Vector3(0, 202, 0)); scene.environment = rt.texture; }
    renderer.shadowMap.needsUpdate = true; render(0.016);
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const gg = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; gg.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // a black-and-white expedition print: contrasty, grainy, the corners dark
    const d = gg.getImageData(0, 0, Wd, Ht); for (let i = 0; i < d.data.length; i += 4) { const l = d.data[i] * 0.3 + d.data[i + 1] * 0.55 + d.data[i + 2] * 0.15; const v = clamp((l - 18) * 1.25 + 10, 0, 255); d.data[i] = v; d.data[i + 1] = v * 0.99; d.data[i + 2] = v * 0.96; } gg.putImageData(d, 0, 0);
    const vg = gg.createRadialGradient(Wd / 2, Ht / 2, Ht * 0.3, Wd / 2, Ht / 2, Wd * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); gg.fillStyle = vg; gg.fillRect(0, 0, Wd, Ht);
    speckle(gg, Wd, Ht, 2800, 0.16, '0,0,0', 2); speckle(gg, Wd, Ht, 900, 0.1, '255,255,255', 1.5);
    gg.fillStyle = 'rgba(240,236,226,.85)'; gg.font = '13px "Allerta Stencil", monospace'; gg.fillText('ALDÉBARAN · 4.III.65 · 6 h 20', 12, Ht - 12);
    url = c.toDataURL('image/jpeg', 0.88);
    // put it all back
    O.deckScene.visible = false; O.sea.visible = true; O.ext.visible = true; O.bellFrameDeck.visible = false; O.bellCable.visible = true; O.body.visible = true;
    was.par.add(bb); bb.position.copy(was.p); bb.rotation.copy(was.r);
    lights.forEach((l, i) => l.intensity = li[i]); L.sun.intensity = 0; setWorldLook(V.look || 'station');
    scene.environment = envWas; pu.exposure.value = ex; scene.fog.density = fog; scene.fog.color.copy(fogC);
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.far = saved.far; cam.updateProjectionMatrix(); updateProj();
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- build ---------------- */
// a solid set on a group's own axes (lx, lz in its frame; y absolute): furniture turned to face the middle of a round room
function solidOn(id, g, lx0, lx1, lz0, lz1, y0, y1) {
  g.updateWorldMatrix(true, false);
  const e = g.matrixWorld.elements, c = new THREE.Vector3((lx0 + lx1) / 2, 0, (lz0 + lz1) / 2).applyMatrix4(g.matrixWorld);
  return solidRot(id, c.x, c.z, Math.atan2(-e[2], e[0]), (lx1 - lx0) / 2, (lz1 - lz0) / 2, y0, y1);
}
function syncDoorSolids() {
  const d = O.lockerDoorSolid; if (!d) return; d.on = !!S.lockerOpen; if (!d.on) return;
  const g = O.lockerDoor; g.updateWorldMatrix(true, false); const e = g.matrixWorld.elements, c = new THREE.Vector3(0.245, 0, 0.02).applyMatrix4(g.matrixWorld);
  solidTurn(d, c.x, c.z, Math.atan2(-e[2], e[0]), 0.255, 0.05, FY, FY + 1.9);
}
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x02080a, 0.1);
  camera.far = 90; camera.near = 0.03; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.35, ao: 0.75, aoRad: 0.28, bloom: 0.75, bloomThr: 1.0, vig: 0.5, grain: 0.04, sat: 0.95 });
  bodyOn({});
  makeTextures(); paintThings(); makeMaterials();
  buildStation(); buildSea(); buildBell(); buildBody(); buildCrew(); buildLights(); buildHands(); buildDeck(); paintStation();
  // the knife, on the ledge inside the skirt
  O.knife = grp(0.05, FY - LEDGE_D + 0.015, -0.63, scene); O.knife.userData.keep = true; { const k = O.knife; mbox(0.16, 0.008, 0.028, M.chrome, 0.06, 0, 0, k, 1); mbox(0.1, 0.022, 0.03, M.cork, -0.075, 0, 0, k, 1); mbox(0.014, 0.03, 0.05, M.steel, -0.02, 0, 0, k, 1); pole([0.1, 0.003, 0.012], [0.16, 0.003, 0.05], 0.004, M.rope, k, 4); k.rotation.y = 0.5; }
  // the lamp on the locker shelf
  O.lampWorld = grp(POS.locker.x, FY + 1.27, POS.locker.z, scene); O.lampWorld.userData.keep = true; { const l = O.lampWorld; const b = cyl(0.04, 0.048, 0.2, M.rubber, 0, 0.05, 0, l, 12); b.rotation.z = Math.PI / 2; const c2 = cyl(0.06, 0.06, 0.03, std({ color: 0x8a1408, roughness: 0.3 }), 0.12, 0.05, 0, l, 12); c2.rotation.z = Math.PI / 2; l.rotation.y = 0.6; }
  // the tank standing in the fill stand
  O.standTank = buildTank('yellow', ''); O.standTank.position.set(POS.fill.x, FY + 0.05, POS.fill.z); scene.add(O.standTank); O.standTank.visible = false;
  // steam off a fresh cup of coffee, later
  O.coffeeSteam = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0x8a6a5a, transparent: true, opacity: 0.2, depthWrite: false })); O.coffeeSteam.scale.set(0.12, 0.2, 1); O.coffeeSteam.position.set(POS.table.x + 0.45, 1.08, -MMW + 0.4); O.coffeeSteam.position.y = FY + 0.9; O.coffeeSteam.visible = false; O.coffeeSteam.userData.noRay = true; scene.add(O.coffeeSteam);
  O.coffeeSteam.position.set(POS.table.x + 0.45, FY + 0.92, -MMW + 0.42);
  // wet footprints: a pool of them
  O.feet = []; for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.24), new THREE.MeshStandardMaterial({ map: T.foot, color: 0x050505, roughness: 0.05, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, fog: false })); m.visible = false; m.userData.noRay = true; m.layers.set(1); scene.add(m); O.feet.push({ m, life: 0 }); }
  // the face at the north porthole, once
  O.faceGhost = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), std({ map: T.face, roughness: 0.6, emissive: 0x405058, emissiveIntensity: 0.25, emissiveMap: T.face })); O.faceGhost.scale.set(0.92, 1.12, 1); O.faceGhost.position.set(0, POS.portN.y - 0.02, -WR.r - 0.42); O.faceGhost.rotation.set(0, 0, 0); O.faceGhost.visible = false; O.faceGhost.userData.noRay = true; scene.add(O.faceGhost);
  // a pale hand passing below the skirt, once
  O.passHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.16), M.dead); O.passHand.visible = false; O.passHand.userData.noRay = true; scene.add(O.passHand);
  // the snow close round you underwater
  { const n = 500, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = rand(-3, 9); p[i * 3 + 1] = rand(-3, 9); p[i * 3 + 2] = rand(-3, 9); } g.setAttribute('position', new THREE.BufferAttribute(p, 3)); O.nearSnow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xc8d8d0, size: 0.014, transparent: true, opacity: 0.6, depthWrite: false })); O.nearSnow.visible = false; O.nearSnow.frustumCulled = false; O.nearSnow.userData.noRay = true; O.nearSnow.layers.set(1); scene.add(O.nearSnow); }
  // the cut end of the line, after
  O.bodyLineCut = tube([[-1.75, 0.9, -1.75], [-1.6, 1.25, -1.85], [-1.5, 1.45, -1.9]], 0.011, M.rope, scene, 8, 4); O.bodyLineCut.visible = false; O.bodyLineCut.userData.keep = true;
  // where he hangs once clipped: a group on the bell body
  O.bodyBell = grp(0, 0, 0, O.bellBody);
  // the bell's deck cradle for the photograph
  O.bellFrameDeck = grp(0, 0, 0, O.deckScene); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + Math.PI / 4; pole([Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9], [Math.cos(a) * 0.7, 0.55, Math.sin(a) * 0.7], 0.05, M.hullOut, O.bellFrameDeck, 8); } torus(0.72, 0.05, M.hullOut, 0, 0.55, 0, O.bellFrameDeck, 32, 6).rotation.x = Math.PI / 2; O.bellFrameDeck.visible = false;
  // a solid you stand on while climbing
  O.climbSolid = solid('climb', 0, 0, -50, -50, 0, 0); O.climbSolid.on = false;
  // furniture you bump into
  solidRound('pot', POS.pot.x, POS.pot.z, 0.24, FY, FY + 0.62);
  solidRound('pool', 0, 0, MP.r + 0.2, FY - 3, FY + 2.0, { noStand: true });   // the rail round the moon pool (too tall to jump, and nothing to stand on)
  solidRound('scrub', POS.scrubber.x, POS.scrubber.z, 0.24, FY, FY + 1.0);
  solid('console', POS.panel.x - 0.76, POS.panel.x + 0.76, FY, FY + 0.85, -MMW, -MMW + 0.58);
  solid('galley', 5.28, 8.42, FY, FY + 0.92, MMW - 0.62, MMW + 0.2);
  solid('table', POS.table.x - 0.76, POS.table.x + 0.76, FY + 0.7, FY + 0.78, -MMW, -MMW + 0.64);
  solid('berth', POS.berth.x - 0.96, POS.berth.x + 0.96, FY, FY + 0.7, POS.berth.z - 0.38, POS.berth.z + 0.5);
  // the wet room's furniture stands at angles round its wall: solids turned to match each piece
  solidOn('tanks', O.tankRack, -0.77, 0.77, -0.24, 0.13, FY, FY + 1.25);   /* taller than it is, so you can't climb on top */
  solidOn('locker', O.lockerG, -0.26, 0.26, -0.22, 0.25, FY, FY + 1.95);
  O.lockerDoorSolid = solidOn('lockerDoor', O.lockerDoor, -0.01, 0.5, -0.03, 0.07, FY, FY + 1.9); O.lockerDoorSolid.on = false;
  solidOn('bench', O.benchG, -0.46, 0.46, -0.17, 0.17, FY, FY + 0.485);
  solidOn('rack', O.rackG, -0.79, 0.79, -0.04, 0.42, FY, FY + 2.2);                    // the suits, the fin shelf and the belts under it
  solidOn('fill', O.fillG, -0.17, 0.17, -0.07, 0.28, FY, FY + 1.25);                    // the fill stand (and a tank standing in it)
  solidOn('fillHose', O.manifoldG, 0.3, 0.7, -0.02, 0.36, FY + 0.1, FY + 0.98);          // the whip hanging from the gas wall down to it
  solidOn('gasWall', O.manifoldG, -0.64, 0.64, -0.04, 0.13, FY + 0.93, FY + 1.9);        // the wheels and gauges on the gas wall
  solidOn('hatchDoor', O.wetHatchDoor, -0.01, 1.0, -0.05, 0.1, FY, FY + 2.06);          // the hatch door, swung back against the wall
  solid('tunFloor', TUN.in0, TUN.in1, FY - 0.2, FY + 0.08, -TUN.w / 2, TUN.w / 2);      // the tunnel's floor plate, a step up
  // the main module: the two stools at the table, the gap between the galley and your berth, the kitbag on the berth
  for (const sx of [-0.4, 0.4]) solidOn('stool', O.tableG, sx - 0.19, sx + 0.19, 0.43, 0.81, FY, FY + 0.5);
  solid('galleyEnd', 8.4, POS.berth.x - 0.95, FY, FY + 0.92, MMW - 0.62, MMW + 0.2);
  solid('kitbag', POS.berth.x - 0.62, POS.berth.x + 0.12, FY + 0.6, FY + 1.1, POS.berth.z - 0.24, POS.berth.z + 0.24);
  // the main module's curved roof, in strips along it: your head can't go through it, so nothing up against the
  // wall (the counter, the table, the console, the scrubber, the berth) is somewhere you can climb up and stand
  for (let z = -1.4; z < 1.39; z += 0.2) { const zc = z + 0.1, top = Math.max(FY + 1.78, MM.ay + Math.sqrt(MM.r * MM.r - zc * zc)); solid('mmRoof', MM.x0, MM.x1, top, FY + 3.5, z, z + 0.2); }
  // the deck you stand on: four slabs round the moon pool's hole, and the main module's floor
  solid('deckA', -2.7, -0.76, FY - 0.2, FY, -2.7, 2.7); solid('deckB', 0.76, MM.x1 + 0.2, FY - 0.2, FY, -2.7, 2.7);
  solid('deckC', -0.76, 0.76, FY - 0.2, FY, -2.7, -0.76); solid('deckD', -0.76, 0.76, FY - 0.2, FY, 0.76, 2.7);
  O.poolSolid = BODY.solids.find(s => s.id === 'pool');
  O.ledgeSolid = solid('ledge', -0.6, -0.34, FY - LEDGE_D - 0.1, FY - LEDGE_D, -0.26, 0.26); O.ledgeSolid.on = false;
  // the mask's frame round your eyes underwater
  if (!$('#satMask')) { const d = document.createElement('div'); d.id = 'satMask'; d.hidden = true; const v = $('#view'); if (v) v.after(d); else document.body.appendChild(d); }   /* over the view, under the fades and the HUD */
  O.bellFrameDeck.userData.keep = true;
  setupHold();
  fogPass(); bellInterior();
}
// the inside of the station is air and doesn't fog; everything out in the water does
// inside the bell nothing from outside reaches you: its inside surfaces ignore spotlights (the floods would otherwise shine
// straight through the hull, and on phones there are no shadows to stop them)
function bellInterior() {
  const B = O.bellBody, inv = new THREE.Matrix4(), v = new THREE.Vector3(), cache = new Map(); B.updateMatrixWorld(true); inv.copy(B.matrixWorld).invert();
  B.traverse(o => {
    if (!o.isMesh || o === O.bellOut || Array.isArray(o.material) || o.material.isShaderMaterial) return;
    for (let p = o; p && p !== B; p = p.parent) if (p === O.bodyBell || O.ballast.includes(p)) return;
    o.geometry.computeBoundingSphere(); v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld).applyMatrix4(inv); if (v.length() > 0.93) return;
    const m = o.material;
    if (!cache.has(m)) { const c = m.clone(), prev = m.onBeforeCompile && m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ? m.onBeforeCompile : null;
      c.onBeforeCompile = (sh, r) => { if (prev) prev.call(c, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace('#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')); };
      c.customProgramCacheKey = () => (prev ? prev.toString() : '') + '|nospot'; cache.set(m, c); }
    o.material = cache.get(m);
  });
}
function fogPass() {
  const outside = [O.ext, O.sea, O.bellG, O.body, O.crewG, O.deckScene, O.faceGhost, O.bodyLine, O.bodyLineCut, O.nearSnow, O.passHand];
  const isOut = o => { for (let p = o; p; p = p.parent) if (outside.includes(p)) return true; return false; };
  const inMats = new Set(), outMeshes = [];
  scene.traverse(o => { if (!o.material || Array.isArray(o.material)) return; if (isOut(o)) outMeshes.push(o); else inMats.add(o.material); });
  const clones = new Map();
  for (const o of outMeshes) { const m = o.material; if (!inMats.has(m)) { m.fog = true; continue; } if (!clones.has(m)) { const c = m.clone(); c.fog = true; if (m.onBeforeCompile) c.onBeforeCompile = m.onBeforeCompile; clones.set(m, c); } o.material = clones.get(m); }
  inMats.forEach(m => { m.fog = false; m.needsUpdate = true; });
}

function bodyStuck(p, r) {
  const allow = BODY.ground ? BODY.STEP : BODY.AIRSTEP, h = BODY.crouch ? BODY.crouchH : BODY.standH, skip = DRAG.cur ? DRAG.cur.solid : null;
  for (const s of BODY.solids) { if (!s.on || s === skip || s.ghost || s.y1 <= BODY.y + allow || s.y0 >= BODY.y + h - 0.02) continue; if (circleHits(s, p.x, p.z, r - 0.02)) return true; }
  const q = { x: p.x, z: p.z }; stationWalls(q, r); return Math.hypot(q.x - p.x, q.z - p.z) > 0.005;
}
// the station's walls: the round wet room with the hatch in its east side, the tunnel, the main module with the
// tunnel's mouth in its west bulkhead; the four door jambs are corners you slide round
function stationWalls(p, r) {
  const hw = TUN.w / 2, tw = hw - r, Rw = WR.r - 0.06, jx = Math.sqrt(Rw * Rw - hw * hw);
  if (p.x < jx) {
    const d = Math.hypot(p.x, p.z), R = Rw - r;
    if (d > R && !(p.x > 0 && Math.abs(p.z) / d * Rw < hw)) { p.x *= R / d; p.z *= R / d; }   // the wall, except where the hatch is
  } else if (p.x < MM.x0) p.z = clamp(p.z, -tw, tw);                                          // the tunnel
  else {
    p.z = clamp(p.z, -MMW + r + 0.02, MMW - r - 0.02); p.x = Math.min(p.x, MM.x1 - r - 0.05);
    if (Math.abs(p.z) > hw && p.x < MM.x0 + r) p.x = MM.x0 + r;                              // the west bulkhead, either side of the tunnel
  }
  for (const [cx, cz] of [[jx, hw], [jx, -hw], [MM.x0, hw], [MM.x0, -hw]]) { const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz); if (d < r && d > 1e-6) { p.x = cx + dx / d * r; p.z = cz + dz / d * r; } }
}

/* ---------------- the room module ---------------- */
return {
  id: 'sat', title: 'Saturation', saveKey: 'lethe.roomsat.v1',
  DOCS, ITEMS: Object.assign({}, ITEMS, Object.fromEntries(Object.entries(HOLD_NAMES).map(([k, v]) => [k, { name: v, short: HOLD_SHORT[k], desc: 'In your hands. ' + (G.touch ? 'Put down' : 'Q') + ' puts it down.' }]))), HEARD, HINTS, openDoc, inspectItem: myInspect,
  titleFx,
  penalty() { G.lockout = G.time + 4; },
  markSkip: ['goal', 'out'], markMerge: { pool: 'knife', kit: 'bell' },
  backText: 'Back in Station Méduse.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other actions', 'R T or right-click'], ['Run', 'Shift'], ['Crouch, swim down', 'C'], ['Swim up', 'Space'], ['Lamp on and off', 'F'], ['Put down', 'Q'], ['Notebook', 'Tab'], ['Hints', 'H']],
  get toggleCrouch() { return V.mode === 'station' ? () => { if (!V.climb) bodyCrouch(); } : undefined; },   /* no Crouch button in the water or the bell */
  stepDown() { if (V.climb || V.mode !== 'station') return; bodyJump(); },
  toggleFlash() { toggleLamp(); },
  dropHeld() { if (G.cutscene || V.mode !== 'station') return; if (HOLD.cur) holdDrop(); },
  onHold, stepSound,
  onLand(v) { if (v > 1.5) sStep(0.3); },
  savePlayer(p) { if (V.mode !== 'station' || V.climb) { p.x = -MP.r - 0.48; p.z = 0; p.y = FY; } },
  resumed,
  constrain(p, r) {
    if (V.mode === 'swim') { swimConstrain(p); return; }
    if (V.mode === 'bell' || V.ride) { if (!V.ride) { p.x = BELL.x; p.z = BELL.z; } return; }
    if (V.onLedge) { p.x = clamp(p.x, -0.55, -0.4); p.z = clamp(p.z, -0.2, 0.2); return; }
    // the walls, then the furniture again (the walls can push you back into it), then the walls once more
    for (let it = 0; it < 3; it++) { stationWalls(p, r); if (it < 2) bodyResolve(p, BODY.y, BODY.ground ? BODY.STEP : BODY.AIRSTEP, DRAG.cur ? DRAG.cur.solid : null); }
    // a gap narrower than you (a stool and the table, the console and the bulkhead): the pushes can't get you clear,
    // so you stay where you last stood clear instead of being shoved back and forth through it
    if (bodyStuck(p, r)) { if (V.okP && Math.hypot(p.x - V.okP.x, p.z - V.okP.z) < 0.5) { p.x = V.okP.x; p.z = V.okP.z; } } else V.okP = { x: p.x, z: p.z };
  },
  actOverride(i) { if (V.mode === 'swim') { const a = swimActs()[i]; if (a) { a.run(); updatePrompt(true); } return true; } return false; },
  promptOverride() { if (V.mode === 'swim' && !G.cutscene) return swimPrompt() || ' '; return ''; },
  touchOverride() { if (V.mode === 'swim') { return swimActs().map((a, i) => ({ label: a.label, run: () => { a.run(); updatePrompt(true); }, main: i === 0 })); } return null; },
  touchExtras() { const x = []; if (V.mode === 'swim') { x.push({ label: 'Up', run: () => { V.tUp = 0.7; } }); x.push({ label: 'Down', run: () => { V.tDown = 0.7; } }); } else if (V.mode === 'station' && !V.climb) { if (HOLD.cur) x.push({ label: 'Put down', run: () => holdDrop() }); } if (S.flags.lampTaken && V.mode !== 'bell') x.push({ label: lampOn() ? 'Lamp off' : 'Lamp', run: () => toggleLamp() }); return x; },
  invNote: id => id === 'lamp' ? `<span class="muted" style="font-size:11px"> · ${S.flags.capOff ? 'white' : 'red cap on'}</span>` : '',
  update: roomUpdate,
  preRender() {
    if (V.envNow) { V.envNow = false; const old = scene.environment; scene.environment = null; const hide = [O.lampHand, O.gaugeHand, O.leadHand, O.tankHand, O.canHand]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); const at = V.look === 'sea' ? new THREE.Vector3(P.x, Math.max(1, G.eye), P.z) : V.look === 'bell' ? new THREE.Vector3(BELL.x, BELL.cy, BELL.z) : new THREE.Vector3(0.6, FY + 1.5, 0.4); const rt = envFromScene(at); scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); }
  },
  build() {
    buildRoom(); registerInteractions();
    mergeGroup(O.wet); mergeGroup(O.mmG); mergeGroup(O.ext); mergeGroup(O.sea); mergeGroup(O.bellFrame); mergeGroup(O.deckScene);
  },
  defaults, applyState, startAmbience,
  spawn: { x: -1.0, z: 0.6, yaw: Math.PI / 2 },
  wake() {
    bodyPlace(-1.05, FY, 0.75, -0.5, true); G.pitch = -0.25;
    G.cutscene = true; $('#fx').className = 'lids';
    after(0.4, () => knocks4(new THREE.Vector3(0, FY - 0.2, 0), 0.5, 1));
    after(1.2, () => sayI('You wake on the steel deck of the wet room, on your side, soaked and shivering in your wetsuit. Your mask is gone. Your tank is gone. Your fins are gone.', 8000));
    after(4.0, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); renderInv(); updatePrompt(true); });
    after(9.5, () => { knocks4(new THREE.Vector3(0, FY - 0.2, 0), 0.55, 1); after(3.2, () => sayI('Under the floor, something knocks. Four times. Then four times again.', 5500)); });
    after(19, () => sayI('The last thing you remember is the wreck: the black of the forward hold, your line snagging on something, Jean\'s lamp swinging away above you. Then nothing.', 8500));
    after(29, () => { if (!S.ev.toldKeys) { S.ev.toldKeys = true; toast(G.touch ? 'The notebook and hints are top right.' : '<kbd>Tab</kbd> notebook &middot; <kbd>H</kbd> hints &middot; <kbd>C</kbd> crouch', 7000); } });
  },
  debug: { O, L, V, T, M, BODY, HOLD, POS, BANKS, progress, applyState, turnBank, turnOutlet, gasCheck, openCover, knockDogs, openPot, tryPot, toggleFloods, toggleLamp, unscrewCap, ledgeDown, ledgeUp, startDive, enterWater, leaveWater, cutBody, clipBody, enterBell, release, endFrame, knock, takeKey, playConv, pickUp, scrubActions, potActions, purgeActions, coverActions, fillActions, tankActions, bankActions, outletActions, bellDoorActions, releaseActions, passActions, hatchActions, icActions, swimActs, swimCollide, swimCeil, stationWalls, setWorldLook, inWet, inMM, trueLightAt },
};
