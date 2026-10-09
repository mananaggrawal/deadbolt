/* =====================================================================
   BODY — a body for rooms that want one (Mystery #8 on). Rooms opt in with bodyOn().
   You can jump, crouch and crawl under low things, step up stairs, climb onto
   what you've dragged into place, drag furniture, and carry one thing in your hands.
   The world is "solids": boxes with a bottom and a top (y0..y1). You stand on their
   tops, bump into their sides, and duck under their bottoms.
   ===================================================================== */
const BODY = {
  on: false, y: 0, ys: 0, vy: 0, ground: true, crouch: false, eye: 1.62, r: 0.26,
  standH: 1.74, crouchH: 1.04, standEye: 1.62, crouchEye: 0.92,
  STEP: 0.33, AIRSTEP: 0.5, JUMP: 3.75, GRAV: 11.5,
  solids: [], low: 0, airT: 0, lastLand: 0, speedK: 1, noJump: false,
};
function bodyOn(o = {}) { Object.assign(BODY, o); BODY.on = true; }
function solid(id, x0, x1, y0, y1, z0, z1, o = {}) {
  const s = Object.assign({ id, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0, y1, z0: Math.min(z0, z1), z1: Math.max(z0, z1), on: true }, o);
  BODY.solids.push(s); return s;
}
function solidSet(s, x0, x1, y0, y1, z0, z1) { s.x0 = x0; s.x1 = x1; s.y0 = y0; s.y1 = y1; s.z0 = z0; s.z1 = z1; }
/* A solid can also be turned about y (for furniture set at an angle, as in a round room): rot is its yaw the
   way three.js measures rotation.y, (cx, cz) its middle and hx, hz its half sizes along its own x and z.
   x0..x1, z0..z1 are then its bounding box, which is all a dragged box tests against. */
function solidTurn(s, cx, cz, rot, hx, hz, y0, y1) {
  const c = Math.cos(rot), n = Math.sin(rot), ex = Math.abs(c) * hx + Math.abs(n) * hz, ez = Math.abs(n) * hx + Math.abs(c) * hz;
  Object.assign(s, { turned: true, cx, cz, c, n, hx, hz, y0, y1, x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez }); return s;
}
function solidRot(id, cx, cz, rot, hx, hz, y0, y1, o = {}) { const s = solid(id, 0, 0, y0, y1, 0, 0, o); return solidTurn(s, cx, cz, rot, hx, hz, y0, y1); }
// and a round one (a pool's rail, a drum): rad round (cx, cz)
function solidRound(id, cx, cz, rad, y0, y1, o = {}) { return solid(id, cx - rad, cx + rad, y0, y1, cz - rad, cz + rad, Object.assign({ round: rad, cx, cz }, o)); }
// a point in a turned solid's own frame, and back
const solidLocal = (s, x, z) => { const dx = x - s.cx, dz = z - s.cz; return [dx * s.c - dz * s.n, dx * s.n + dz * s.c]; };
const solidWorld = (s, lx, lz) => [s.cx + lx * s.c + lz * s.n, s.cz - lx * s.n + lz * s.c];
function circleHits(s, x, z, r) {
  if (s.round) return Math.hypot(x - s.cx, z - s.cz) < r + s.round;
  if (s.turned) { const [lx, lz] = solidLocal(s, x, z), dx = lx - clamp(lx, -s.hx, s.hx), dz = lz - clamp(lz, -s.hz, s.hz); return dx * dx + dz * dz < r * r; }
  const cx = clamp(x, s.x0, s.x1), cz = clamp(z, s.z0, s.z1), dx = x - cx, dz = z - cz; return dx * dx + dz * dz < r * r;
}
function rectHits(s, x0, x1, z0, z1) { return x0 < s.x1 && x1 > s.x0 && z0 < s.z1 && z1 > s.z0; }
// the highest top you could be standing on at (x, z), no higher than yMax
function bodySupport(x, z, r, yMax, skip) {
  let best = -50;
  for (const s of BODY.solids) { if (!s.on || s === skip || s.noStand || s.y1 > yMax + 1e-4 || !circleHits(s, x, z, r)) continue; if (s.y1 > best) best = s.y1; }
  return best;
}
// the lowest bottom over your head at (x, z), no lower than yMin
function bodyCeil(x, z, r, yMin, skip) {
  let best = 50;
  for (const s of BODY.solids) { if (!s.on || s === skip || s.y0 < yMin - 1e-4 || !circleHits(s, x, z, r)) continue; if (s.y0 < best) best = s.y0; }
  return best;
}
const bodyHeadH = () => BODY.crouch ? BODY.crouchH : BODY.standH;
// push the body out of everything it can neither step over nor duck under
function bodyResolve(p, y, allow, skip) {
  const r = BODY.r, h = bodyHeadH(); let hit = null;
  for (let it = 0; it < 3; it++) for (const s of BODY.solids) {
    if (!s.on || s === skip || s.ghost) continue;
    if (s.y1 <= y + allow || s.y0 >= y + h - 0.02) continue;
    if (s.round) {
      const dx = p.x - s.cx, dz = p.z - s.cz, d = Math.hypot(dx, dz), R = r + s.round; if (d >= R) continue;
      hit = s; if (d < 1e-6) p.x = s.cx + R; else { p.x = s.cx + dx / d * R; p.z = s.cz + dz / d * R; } continue;
    }
    if (s.turned) {
      const [lx, lz] = solidLocal(s, p.x, p.z), qx = clamp(lx, -s.hx, s.hx), qz = clamp(lz, -s.hz, s.hz), ex = lx - qx, ez = lz - qz, e2 = ex * ex + ez * ez;
      if (e2 >= r * r) continue;
      hit = s; let nx = lx, nz = lz;
      if (e2 < 1e-9) { const l = lx + s.hx, rr = s.hx - lx, t = lz + s.hz, b = s.hz - lz, m = Math.min(l, rr, t, b); if (m === l) nx = -s.hx - r; else if (m === rr) nx = s.hx + r; else if (m === t) nz = -s.hz - r; else nz = s.hz + r; }
      else { const d = Math.sqrt(e2); nx = qx + ex / d * r; nz = qz + ez / d * r; }
      [p.x, p.z] = solidWorld(s, nx, nz); continue;
    }
    const cx = clamp(p.x, s.x0, s.x1), cz = clamp(p.z, s.z0, s.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    hit = s;
    if (d2 < 1e-9) {
      const l = p.x - s.x0, rr = s.x1 - p.x, t = p.z - s.z0, b = s.z1 - p.z, m = Math.min(l, rr, t, b);
      if (m === l) p.x = s.x0 - r; else if (m === rr) p.x = s.x1 + r; else if (m === t) p.z = s.z0 - r; else p.z = s.z1 + r;
    } else { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
  }
  return hit;
}
// standing up needs headroom
function bodyCanStand() { return bodyCeil(P.x, P.z, BODY.r * 0.9, BODY.y + 0.2) >= BODY.y + BODY.standH; }
function bodyCrouch(want) {
  if (!BODY.on || G.cutscene || G.frozen) return;
  const to = want === undefined ? !BODY.crouch : want;
  if (!to && !bodyCanStand()) { if (!BODY.toldRoom || G.time - BODY.toldRoom > 4) { BODY.toldRoom = G.time; toast('There isn\'t room to stand up here.', 2400); } return; }
  BODY.crouch = to; G.crouch = to; updatePrompt(true);
}
function bodyJump() {
  if (!BODY.on || G.mode !== 'play' || G.uiOpen || G.cutscene || G.frozen || BODY.noJump || DRAG.cur) return;
  if (!BODY.ground) return;
  if (BODY.crouch) { if (bodyCanStand()) { BODY.crouch = false; G.crouch = false; } return; }
  if (bodyCeil(P.x, P.z, BODY.r * 0.9, BODY.y + 0.2) < BODY.y + BODY.standH + 0.25) return;
  BODY.vy = BODY.JUMP; BODY.ground = false; BODY.airT = 0;
  ROOM.onJump && ROOM.onJump();
}
// the whole body, every frame: walking (if allowed), gravity, steps, ledges, ceilings
function bodyTick(dt, f, s, run, mag) {
  const B = BODY, r = B.r;
  const len = Math.hypot(f, s); G.moving = len > 0;
  const x0 = P.x, z0 = P.z;
  const skip = DRAG.cur ? DRAG.cur.solid : null;
  if (len) {
    f /= len; s /= len;
    let sp = (B.crouch ? 0.9 : DRAG.cur ? 0.95 : run ? 2.9 : 1.55) * (TOUCH.stick ? 1.2 * mag : 1) * B.speedK;
    if (!B.ground) sp *= 0.9;
    const sin = Math.sin(G.yaw), cos = Math.cos(G.yaw);
    const dx = (-sin * f + cos * s) * sp * dt, dz = (-cos * f - sin * s) * sp * dt;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
    for (let i = 0; i < n; i++) {
      const px = P.x, pz = P.z;
      P.x += dx / n; P.z += dz / n;
      const allow = B.ground ? B.STEP : B.AIRSTEP;
      bodyResolve(P, B.y, allow, skip);
      if (typeof colliders !== 'undefined' && colliders.length) collide(P, r);
      // step up (on the ground) or scramble up onto a ledge (in the air)
      const sup = bodySupport(P.x, P.z, r * 0.55, B.y + allow, skip);
      if (sup > B.y + 0.001) {
        if (bodyCeil(P.x, P.z, r * 0.9, sup + 0.02, skip) < sup + bodyHeadH() - 0.02) { P.x = px; P.z = pz; continue; }
        B.y = sup; if (!B.ground) { B.ground = true; B.vy = 0; landed(0.4); }
      }
      // a low overhang ahead while standing: tell the player once in a while
      if (!B.crouch && B.ground) {
        const fx = P.x - sin * 0.35 * f + cos * 0.35 * s, fz = P.z - cos * 0.35 * f - sin * 0.35 * s;
        const c = bodyCeil(fx, fz, r * 0.8, B.y + 0.5, skip);
        if (c < B.y + B.standH && c > B.y + B.crouchH + 0.02) B.low = G.time;
      }
    }
    ROOM.constrain && ROOM.constrain(P, r);
  }
  if (DRAG.cur) dragFollow(x0, z0);
  // vertical
  if (B.ground) {
    const sup = bodySupport(P.x, P.z, r * 0.55, B.y + 0.01, skip);
    if (sup < B.y - 0.005) {
      if (B.y - sup <= B.STEP * 0.8) B.y = sup;      // down a step
      else { B.ground = false; B.vy = 0; B.airT = 0; } // off an edge
    }
  }
  if (!B.ground) {
    B.airT += dt;
    const yPrev = B.y;
    B.vy -= B.GRAV * dt; B.vy = Math.max(B.vy, -16);
    B.y += B.vy * dt;
    if (B.vy > 0) {
      const c = bodyCeil(P.x, P.z, r * 0.9, yPrev + bodyHeadH() - 0.03, skip);
      if (B.y + bodyHeadH() > c) { B.y = c - bodyHeadH(); B.vy = 0; }
    }
    const sup = bodySupport(P.x, P.z, r * 0.55, Math.max(yPrev, B.y) + 0.01, skip);
    if (B.y <= sup) { const v = -B.vy; B.y = sup; B.vy = 0; B.ground = true; landed(v); }
  }
  // the camera follows: quick on stairs, exact in the air
  B.ys = B.ground ? lerp(B.ys, B.y, Math.min(1, dt * 16)) : B.y;
  if (Math.abs(B.ys - B.y) > 0.6) B.ys = B.y;
  B.eye = lerp(B.eye, B.crouch ? B.crouchEye : B.standEye, Math.min(1, dt * 9));
  G.eye = G.eyeT = B.ys + B.eye;
  // footsteps
  const d = Math.hypot(P.x - x0, P.z - z0);
  if (B.ground) { G.bob += d * 7.5; G.stepAcc += d; }
  if (G.stepAcc > (run && !B.crouch ? 0.8 : 0.62)) { G.stepAcc = 0; const v = B.crouch ? 0.07 : run ? 0.24 : 0.15; if (ROOM.stepSound) ROOM.stepSound(v); else sStep(v); }
}
function landed(v) { if (v > 2.2) { G.shake = Math.max(G.shake || 0, Math.min(0.5, v * 0.06)); } if (ROOM.onLand) ROOM.onLand(v); else if (v > 1.5) sStep(0.3); }
function bodyPlace(x, y, z, yaw, crouch = false) {
  P.x = x; P.z = z; BODY.y = BODY.ys = y; BODY.vy = 0; BODY.ground = true; BODY.crouch = crouch; G.crouch = crouch;
  BODY.eye = crouch ? BODY.crouchEye : BODY.standEye; G.eye = G.eyeT = y + BODY.eye;
  if (yaw !== undefined) G.yaw = yaw;
}

/* ---------------- dragging furniture ----------------
   A draggable is a box sitting on whatever is under it. While you drag it, it stays in front of you
   at the distance you grabbed it; it never turns, so its solid stays a box. It slides over small
   bumps, refuses to go through things, and falls if you push it off an edge. */
const DRAG = { cur: null, defs: {} };
function draggable(id, obj, o) {
  const d = Object.assign({ id, obj, w: 0.5, dd: 0.5, h: 0.5, name: id, heavy: 1 }, o);
  d.solid = solid('drag_' + id, 0, 0, 0, 0, 0, 0, { drag: d });
  d.sync = () => { const p = d.obj.position; solidSet(d.solid, p.x - d.w / 2, p.x + d.w / 2, p.y, p.y + d.h, p.z - d.dd / 2, p.z + d.dd / 2); };
  d.sync(); DRAG.defs[id] = d; return d;
}
function dragFree(d, x, z, y) {
  const x0 = x - d.w / 2 + 0.01, x1 = x + d.w / 2 - 0.01, z0 = z - d.dd / 2 + 0.01, z1 = z + d.dd / 2 - 0.01;
  for (const s of BODY.solids) {
    if (!s.on || s === d.solid || s.ghost) continue;
    if (s.y1 <= y + 0.07 || s.y0 >= y + d.h) continue;
    if (rectHits(s, x0, x1, z0, z1)) return false;
  }
  // and not through you
  const cx = clamp(P.x, x0, x1), cz = clamp(P.z, z0, z1);
  if (Math.hypot(P.x - cx, P.z - cz) < BODY.r - 0.02 && BODY.y < y + d.h) return false;
  return true;
}
function dragSupport(d, x, z, yMax) {
  let best = -50; const x0 = x - d.w * 0.3, x1 = x + d.w * 0.3, z0 = z - d.dd * 0.3, z1 = z + d.dd * 0.3;
  for (const s of BODY.solids) { if (!s.on || s === d.solid || s.noStand || s.y1 > yMax + 1e-4 || !rectHits(s, x0, x1, z0, z1)) continue; if (s.y1 > best) best = s.y1; }
  return best;
}
function dragStart(id) {
  const d = DRAG.defs[id]; if (!d || DRAG.cur) return;
  const p = d.obj.position;
  if (Math.abs(BODY.y - p.y) > 0.25) { toast(`You can't get a grip on the ${d.name} from here.`, 2600); return; }
  if (BODY.y > p.y + d.h - 0.05 && circleHits(d.solid, P.x, P.z, BODY.r)) { toast(`You're standing on it.`, 2000); return; }
  const fx = -Math.sin(G.yaw), fz = -Math.cos(G.yaw);
  const ext = Math.abs(fx) * d.w / 2 + Math.abs(fz) * d.dd / 2;
  d.hold = Math.max(BODY.r + ext + 0.12, Math.min(BODY.r + ext + 0.5, Math.hypot(p.x - P.x, p.z - P.z)));
  d.offAng = Math.atan2(p.x - P.x, p.z - P.z) - Math.atan2(fx, fz);
  DRAG.cur = d; BODY.crouch = false; G.crouch = false;
  d.onStart && d.onStart(); ROOM.onDrag && ROOM.onDrag(d, true); updatePrompt(true);
}
function dragEnd(quiet) {
  const d = DRAG.cur; if (!d) return; DRAG.cur = null; d.sync();
  d.onEnd && d.onEnd(); ROOM.onDrag && ROOM.onDrag(d, false); if (!quiet) updatePrompt(true);
}
// after the body moved: bring the thing along, or, if it can't come, hold the body back
function dragFollow(x0, z0) {
  const d = DRAG.cur, p = d.obj.position;
  const fx = -Math.sin(G.yaw), fz = -Math.cos(G.yaw);
  const tx = P.x + fx * d.hold, tz = P.z + fz * d.hold;
  let nx = p.x, nz = p.z, moved = false;
  const step = (x, z) => {
    const sup = dragSupport(d, x, z, p.y + 0.07);
    if (sup < p.y - 0.06) return 'edge';
    if (!dragFree(d, x, z, sup)) return false;
    nx = x; nz = z; p.y = sup; return true;
  };
  const sx = p.x, sz = p.z, dist = Math.hypot(tx - sx, tz - sz);
  if (dist > 0.002) {
    const n = Math.max(1, Math.ceil(dist / 0.05));
    for (let i = 1; i <= n; i++) {
      const k = i / n, x = lerp(sx, tx, k), z = lerp(sz, tz, k);
      let r = step(x, z); if (r === true) { moved = true; continue; }
      if (r === 'edge') { dragFall(d, x, z); return; }
      r = step(x, nz); if (r === true) { moved = true; continue; }
      if (r === 'edge') { dragFall(d, x, nz); return; }
      r = step(nx, z); if (r === true) { moved = true; continue; }
      if (r === 'edge') { dragFall(d, nx, z); return; }
      break;
    }
  }
  p.x = nx; p.z = nz; d.sync();
  // it stuck: you can't walk away from it while you've got hold of it
  const gap = Math.hypot(p.x - P.x, p.z - P.z);
  if (gap > d.hold + 0.12 || gap < BODY.r + 0.05) { P.x = x0; P.z = z0; }
  if (moved) { d.moveT = (d.moveT || 0) + 1; if (d.moveT % 9 === 0) ROOM.dragSound ? ROOM.dragSound(d) : sScrape(p.clone().setY(p.y + 0.1), 0.25, 0.18 * d.heavy); }
}
function dragFall(d, x, z) {
  const p = d.obj.position; p.x = x; p.z = z;
  const sup = dragSupport(d, x, z, p.y - 0.02), y0 = p.y;
  dragEnd();
  tween(Math.sqrt(Math.max(0.05, (y0 - sup) * 2 / 9.8)), k => { p.y = lerp(y0, sup, k); d.obj.rotation.z = Math.sin(k * 3) * 0.04; }, () => { p.y = sup; d.obj.rotation.z = 0; d.sync(); sThunk(p.clone().setY(sup + 0.2), 0.6 * d.heavy, 110); ROOM.onDragFell && ROOM.onDragFell(d); }, k => k * k);
}

/* ---------------- carrying one thing in your hands ----------------
   Each holdable has a mesh in the world and a mesh for your hand (a child of the camera).
   Taking one when your hands are full puts the other down at your feet first. */
const HOLD = { cur: null, defs: {} };
function holdable(id, o) {
  const d = Object.assign({ id, name: id, world: null, hand: null, droppable: true, r: 0.12 }, o);
  if (d.hand) { d.hand.visible = false; d.hand.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; c.castShadow = false; }); }
  HOLD.defs[id] = d; return d;
}
function holdTake(id, quiet) {
  const d = HOLD.defs[id]; if (!d) return;
  if (HOLD.cur && HOLD.cur !== id) holdDrop(true, true);
  HOLD.cur = id;
  if (d.world) d.world.visible = false;
  if (d.hand) { d.hand.visible = true; d.handT = 0; }
  d.onTake && d.onTake();
  if (!quiet) sClick(null, 0.15, 900);
  ROOM.onHold && ROOM.onHold(id, true); updatePrompt(true); save();
}
// put it down in front of you on whatever is there (a table, the floor, the ground)
function holdDrop(atFeet, quiet) {
  const id = HOLD.cur; if (!id) return; const d = HOLD.defs[id];
  if (!d.droppable && !atFeet) { toast(d.noDrop || 'You hold on to it.', 2200); return; }
  let x = P.x, z = P.z;
  if (!atFeet) { const fx = -Math.sin(G.yaw), fz = -Math.cos(G.yaw); for (const k of [0.55, 0.4, 0.25]) { const tx = P.x + fx * k, tz = P.z + fz * k; let ok = true; for (const s of BODY.solids) { if (!s.on || s.ghost || s.y1 <= BODY.y + 1.0 || s.y0 >= BODY.y + 1.2) continue; if (circleHits(s, tx, tz, d.r)) { ok = false; break; } } if (ok) { x = tx; z = tz; break; } } }
  else { x = P.x - Math.sin(G.yaw) * 0.25; z = P.z - Math.cos(G.yaw) * 0.25; }
  const y = bodySupport(x, z, 0.04, BODY.y + 1.05);
  HOLD.cur = null;
  if (d.hand) d.hand.visible = false;
  if (d.world) { d.world.visible = true; d.world.position.set(x, y, z); d.world.rotation.set(0, G.yaw + (d.dropRy || 0), 0); }
  if (!S.props) S.props = {};
  S.props[id] = { x, y, z, ry: G.yaw + (d.dropRy || 0) };
  d.onDrop && d.onDrop(x, y, z);
  if (!quiet) sThunk(new THREE.Vector3(x, y + 0.1, z), 0.25, 220);
  ROOM.onHold && ROOM.onHold(id, false); updatePrompt(true); save();
}
// the thing in your hand sways as you walk, and dips when you crouch
function holdTick(dt) {
  for (const id in HOLD.defs) {
    const d = HOLD.defs[id]; if (!d.hand || !d.hand.visible) continue;
    d.handT = Math.min(1, (d.handT || 0) + dt * 4);
    const b = G.moving ? Math.sin(G.bob) : 0, base = d.handPos || [0.2, -0.22, -0.42];
    d.hand.position.set(base[0] + b * 0.006, base[1] - (1 - smooth(d.handT)) * 0.25 + Math.abs(b) * 0.008 - (DRAG.cur ? 0.3 : 0), base[2]);
    if (d.handRot) d.hand.rotation.set(d.handRot[0], d.handRot[1], d.handRot[2] + b * 0.02);
  }
}

