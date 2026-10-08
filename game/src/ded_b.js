/* =====================================================================
   DEDUSHKA · part B: the house. A log izba with its gable to the lane: the one warm room
   with the big whitewashed stove in its corner, the kitchen corner behind a curtain, the icon
   corner diagonally across; the cold seni behind it with the ladder to the attic; the cellar
   under the floor; the attic under the roof. Logs inside and out, a plank roof, carved blue frames.
   ===================================================================== */
const LR = 0.135, LS = 0.24;     // log radius and course spacing
// one course of a log wall along x (a north or south wall) or z (a west or east wall): two half-logs,
// warm inside and grey outside, broken where the holes are
function logCourse(axis, line, a0, a1, y, holes, inSign, par, ends = true) {
  const segs = []; let s = a0;
  const hs = holes.filter(h => y + LR > h[2] && y - LR < h[3]).sort((p, q) => p[0] - q[0]);
  for (const h of hs) { if (h[0] > s) segs.push([s, h[0]]); s = Math.max(s, h[1]); }
  if (a1 > s) segs.push([s, a1]);
  for (const [u0, u1] of segs) {
    const len = u1 - u0; if (len < 0.05) continue;
    const mid = (u0 + u1) / 2;
    for (const inside of [true, false]) {
      let t0;
      if (axis === 'x') t0 = (inSign > 0) === inside ? -Math.PI / 2 : Math.PI / 2;
      else t0 = (inSign > 0) === inside ? 0 : Math.PI;
      const g = new THREE.CylinderGeometry(LR, LR, len, 7, 1, true, t0, Math.PI);
      uvScale(g, Math.PI * LR / 0.8, len, hash1(y * 9 + mid), hash1(y * 3 + len));
      if (axis === 'x') g.rotateZ(Math.PI / 2); else g.rotateX(Math.PI / 2);
      const m = new THREE.Mesh(g, inside ? M.logIn : M.logOut); m.castShadow = true; m.receiveShadow = true;
      if (axis === 'x') m.position.set(mid, y, line); else m.position.set(line, y, mid);
      par.add(m);
    }
    // the sawn ends where a log stops at a door or a window
    if (ends) for (const [u, sg] of [[u0, -1], [u1, 1]]) {
      const isEdge = Math.abs(u - a0) < 1e-3 || Math.abs(u - a1) < 1e-3;
      const c = new THREE.Mesh(new THREE.CircleGeometry(LR, 10), M.logEnd); c.castShadow = false; c.receiveShadow = true;
      if (axis === 'x') { c.position.set(u + sg * 0.001, y, line); c.rotation.y = sg * Math.PI / 2; } else { c.position.set(line, y, u + sg * 0.001); c.rotation.y = sg > 0 ? 0 : Math.PI; }
      if (!isEdge || ends === 'all' || isEdge) par.add(c);
    }
  }
}
// a whole wall: the chinked core with its holes, then the courses of logs over it
function logWall(axis, line, a0, a1, y0, y1, holes, inSign, par, phase = 0) {
  const core = new THREE.Mesh(holedGeo(a0 + 0.12, a1 - 0.12, y0, y1, holes.map(h => [h[0], h[1], h[2], h[3]]), 0.17), M.chink);
  if (axis === 'x') core.position.set(0, 0, line); else { core.rotation.y = -Math.PI / 2; core.position.set(line, 0, 0); }
  core.castShadow = true; core.receiveShadow = true; par.add(core);
  for (let y = y0 + LR + phase; y < y1 - LR * 0.5; y += LS) logCourse(axis, line, a0, a1, y, holes, inSign, par);
}

// a window: deep reveal, a sash with six panes, a sill, a little lace half-curtain inside
function windowAt(axis, line, u, v0, v1, w, inSign, par, opts = {}) {
  const g = grp(0, 0, 0, par), h = v1 - v0;
  const place = (o, du, dv, dn) => { if (axis === 'x') o.position.set(u + du, v0 + dv, line + dn * inSign); else o.position.set(line + dn * inSign, v0 + dv, u + du); if (axis === 'z') o.rotation.y = Math.PI / 2; return o; };
  const fr = M.woodDark;
  // reveal boards
  for (const s of [-1, 1]) place(bev(0.04, h, 0.3, M.wood, 0, 0, 0, g, 0.004), s * (w / 2 - 0.02), h / 2, 0);
  place(bev(w, 0.04, 0.3, M.wood, 0, 0, 0, g, 0.004), 0, h - 0.02, 0);
  place(bev(w + 0.12, 0.04, 0.34, M.wood, 0, 0, 0, g, 0.004), 0, 0.0, 0.05);
  // the sash: frame, mullions, glass
  const sw = w - 0.06, sh = h - 0.06;
  for (const s of [-1, 1]) place(bev(0.04, sh, 0.05, fr, 0, 0, 0, g, 0.004), s * (sw / 2 - 0.02), h / 2, -0.04);
  for (const dv of [0.03, h - 0.03, h * 0.62]) place(bev(sw, 0.04, 0.05, fr, 0, 0, 0, g, 0.004), 0, dv, -0.04);
  place(bev(0.025, sh, 0.04, fr, 0, 0, 0, g, 0.003), 0, h / 2, -0.04);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), M.glass); gl.userData.noRay = true; gl.castShadow = false; gl.receiveShadow = false; place(gl, 0, h / 2, -0.04); if (axis === 'x') gl.rotation.y = inSign > 0 ? 0 : Math.PI; else gl.rotation.y = inSign > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(gl); gl.layers.set(1);
  if (opts.lace) { const lc = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh * 0.45, 12, 1), std({ map: opts.lace, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 1 })); const p = lc.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.012); lc.geometry.computeVertexNormals(); place(lc, 0, sh * 0.25 + 0.03, 0.08); if (axis === 'x') lc.rotation.y = 0; g.add(lc); lc.castShadow = true; }
  return g;
}
// carved blue frames round a window outside, with a fretted top
function nalichnik(axis, line, u, v0, v1, w, outSign, par) {
  const g = grp(0, 0, 0, par);
  const place = (o, du, dv, dn) => { if (axis === 'x') o.position.set(u + du, v0 + dv, line + dn * outSign); else { o.position.set(line + dn * outSign, v0 + dv, u + du); o.rotation.y = Math.PI / 2; } return o; };
  const h = v1 - v0;
  for (const s of [-1, 1]) place(bev(0.09, h + 0.18, 0.04, M.blue, 0, 0, 0, g, 0.01), s * (w / 2 + 0.045), h / 2, 0.02);
  place(bev(w + 0.32, 0.07, 0.07, M.blue, 0, 0, 0, g, 0.01), 0, -0.07, 0.04);
  // the top: a carved board with a scalloped edge and a sunburst
  const t = tex(canv(256, 96, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#e8e4dc'; c.beginPath(); c.moveTo(0, H2); c.lineTo(0, 40); c.quadraticCurveTo(W2 / 2, -10, W2, 40); c.lineTo(W2, H2); c.fill(); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(16 + i * 28, H2 - 4, 9, 0, TAU); c.fill(); } for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI; c.beginPath(); c.moveTo(W2 / 2, 70); c.lineTo(W2 / 2 + Math.cos(a - 0.08) * 40, 70 + Math.sin(a - 0.08) * 40); c.lineTo(W2 / 2 + Math.cos(a + 0.08) * 40, 70 + Math.sin(a + 0.08) * 40); c.fill(); } c.globalCompositeOperation = 'source-over'; }));
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.34, 0.34 * 96 / 256 * 3), std({ map: t, color: 0x6a94c0, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85 }));
  place(top, 0, h + 0.18, 0.045); if (axis === 'x') top.rotation.y = outSign > 0 ? 0 : Math.PI; else top.rotation.y = outSign > 0 ? Math.PI / 2 : -Math.PI / 2; top.castShadow = true; g.add(top);
  return g;
}

/* ---------------- the house: walls, roof, floors ---------------- */
function buildHouse() {
  O.house = grp(); const Hs = O.house;
  const WIN_N = [1.25, 3.0, 4.75].map(x => [x - 0.31, x + 0.31, 1.52, 2.34]);
  const WIN_E = [[-4.95 - 0.31, -4.95 + 0.31, 1.52, 2.34], [-2.4 - 0.31, -2.4 + 0.31, 1.52, 2.34], [DOOR_P.z0, DOOR_P.z1, FY - 0.02, FY + 1.9]];
  const WIN_W = [[-3.2 - 0.3, -3.2 + 0.3, 1.52, 2.3], [1.42, 1.86, 1.86, 2.26]];
  const DOOR_PART = [[DOOR_I.x0, DOOR_I.x1, FY - 0.02, FY + 1.85]];
  const ext = 0.24;
  logWall('x', -6.125, -0.25 - ext, 6.25 + ext, 0.05, EAVE, WIN_N, 1, Hs, 0);
  logWall('x', 2.925, -0.25 - ext, 6.25 + ext, 0.05, EAVE, [], -1, Hs, 0);
  logWall('x', 0.125, -0.25 - ext, 6.25 + ext, 0.05, CEIL + 0.05, DOOR_PART, -1, Hs, 0);
  logWall('z', -0.125, -6.25 - ext, 3.05 + ext, 0.05, EAVE, WIN_W, 1, Hs, LS / 2);
  logWall('z', 6.125, -6.25 - ext, 3.05 + ext, 0.05, EAVE, WIN_E, -1, Hs, LS / 2);
  // stones under the bottom course
  for (let i = 0; i < 26; i++) { const k = i / 26; const on = i < 7 ? ['x', -6.13, -0.2 + k / (7 / 26) * 6.4] : i < 13 ? ['x', 2.93, -0.2 + (k - 7 / 26) / (6 / 26) * 6.4] : i < 20 ? ['z', -0.13, -6.2 + (k - 13 / 26) / (7 / 26) * 9.2] : ['z', 6.13, -6.2 + (k - 20 / 26) / (6 / 26) * 9.2]; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), std({ color: 0x5a564e, roughness: 0.95 })); s.scale.set(1.3, 0.5, 1.1); if (on[0] === 'x') s.position.set(on[2], 0.02, on[1]); else s.position.set(on[1], 0.02, on[2]); s.rotation.y = i; s.castShadow = true; s.receiveShadow = true; Hs.add(s); }
  // the windows, inside and out
  const lace = tex(canv(128, 64, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = 'rgba(236,232,222,.92)'; c.fillRect(0, 0, W2, H2 - 12); c.globalCompositeOperation = 'destination-out'; for (let x = 4; x < W2; x += 10) for (let y = 4; y < H2 - 16; y += 10) { c.beginPath(); c.arc(x + ((y / 10) % 2) * 5, y, 3, 0, TAU); c.fill(); } c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(236,232,222,.92)'; for (let x = 0; x < W2; x += 12) { c.beginPath(); c.arc(x + 6, H2 - 12, 6, 0, Math.PI); c.fill(); } }));
  O.windows = [];
  for (const [u0, u1, v0, v1] of WIN_N) { O.windows.push(windowAt('x', -6.125, (u0 + u1) / 2, v0, v1, u1 - u0, 1, Hs, { lace })); nalichnik('x', -6.26, (u0 + u1) / 2, v0, v1, u1 - u0, -1, Hs); }
  for (const [u0, u1, v0, v1] of WIN_E.slice(0, 2)) { O.windows.push(windowAt('z', 6.125, (u0 + u1) / 2, v0, v1, u1 - u0, -1, Hs, { lace })); nalichnik('z', 6.26, (u0 + u1) / 2, v0, v1, u1 - u0, 1, Hs); }
  O.windows.push(windowAt('z', -0.125, -3.2, 1.52, 2.3, 0.6, 1, Hs, {})); nalichnik('z', -0.26, -3.2, 1.52, 2.3, 0.6, -1, Hs);
  windowAt('z', -0.125, 1.64, 1.86, 2.26, 0.44, 1, Hs, {});
  // shutters on the street windows, open and hooked back
  for (const [u0, u1, v0, v1] of WIN_N) for (const s of [-1, 1]) { const sh = bev(0.34, v1 - v0 + 0.12, 0.03, M.blue, (u0 + u1) / 2 + s * ((u1 - u0) / 2 + 0.28), (v0 + v1) / 2, -6.32, Hs, 0.008); const d = bev(0.22, 0.22, 0.01, std({ color: 0xd8d4c8, roughness: 0.9 }), 0, 0, -0.02, sh, 0.004); d.rotation.z = Math.PI / 4; }
  // the gables: vertical boards over the top of the end walls, with a little window in each
  for (const [z, sg, win] of [[-6.27, -1, [2.72, 3.28, 4.2, 4.75]], [3.07, 1, [2.65, 3.35, 3.95, 4.55]]]) {
    const s = new THREE.Shape(); s.moveTo(-0.3, EAVE - 0.05); s.lineTo(6.3, EAVE - 0.05); s.lineTo(3, RIDGE + 0.02); s.closePath();
    const hp = new THREE.Path(); hp.moveTo(win[0], win[2]); hp.lineTo(win[1], win[2]); hp.lineTo(win[1], win[3]); hp.lineTo(win[0], win[3]); hp.closePath(); s.holes.push(hp);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false }); g.translate(0, 0, -0.02);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.0, uv.getY(i) / 2.0);
    const gm = new THREE.Mesh(g, M.board); gm.position.z = z; gm.castShadow = true; gm.receiveShadow = true; Hs.add(gm);
    // window in the gable
    const cx = (win[0] + win[1]) / 2, w = win[1] - win[0];
    const wg = windowAt('x', z - sg * 0.01, cx, win[2], win[3], w, -sg, Hs, {});
    nalichnik('x', z + sg * 0.03, cx, win[2], win[3], w, sg, Hs);
    if (sg > 0) O.gableWin = wg;
    // carved bargeboards and the towel-board at the peak
    for (const side of [-1, 1]) { const a = new THREE.Vector3(3, RIDGE + 0.05, z + sg * 0.06), b = new THREE.Vector3(3 + side * (3.25 + OVER), EAVE - 0.05 - (RIDGE - EAVE) * OVER / 3.25, z + sg * 0.06); const pl = pole(a, b, 0.04, M.blue, Hs, 4); pl.scale.set(1, 1, 3); }
    bev(0.22, 0.9, 0.04, M.blue, 3, RIDGE - 0.4, z + sg * 0.08, Hs, 0.01);
  }
  // the roof: plank slopes with an overhang, a ridge board, battens underneath
  O.roof = grp(0, 0, 0, scene);
  const slopeLen = Math.hypot(3.25 + OVER, (RIDGE - EAVE) * (3.25 + OVER) / 3.25), ang = Math.atan2(RIDGE - EAVE, 3.25);
  const rz0 = OUT.z0 - 0.45, rz1 = OUT.z1 + 0.45;
  for (const side of [-1, 1]) {
    const g = new THREE.BoxGeometry(slopeLen, 0.05, rz1 - rz0); uvScale(g, slopeLen / 1.2, (rz1 - rz0) / 2.0);
    const r = new THREE.Mesh(g, M.roof); r.castShadow = true; r.receiveShadow = true;
    const mid = 3 + side * (3.25 + OVER) / 2; r.position.set(mid, RIDGE - (RIDGE - EAVE) * ((3.25 + OVER) / 2) / 3.25 + 0.04, (rz0 + rz1) / 2); r.rotation.z = -side * ang; O.roof.add(r);
    // rafters seen from the attic
    for (let z = OUT.z0 + 0.2; z < OUT.z1; z += 0.95) { const a = new THREE.Vector3(3, RIDGE - 0.08, z), b = new THREE.Vector3(3 + side * 3.3, EAVE - 0.06, z); pole(a, b, 0.065, M.logIn, O.roof, 6); }
  }
  pole([3, RIDGE + 0.08, rz0], [3, RIDGE + 0.08, rz1], 0.07, M.boardDark, O.roof, 6);
  // the chimney stack through the roof
  mbox(0.55, 1.5, 0.55, std({ color: 0x8a4a36, roughness: 0.9 }), 0.9, roofY(0.9) + 0.45, -0.9, O.roof, 1);
  mbox(0.65, 0.08, 0.65, M.iron, 0.9, roofY(0.9) + 1.22, -0.9, O.roof, 1);
  // the brigade's mark on the front: a white cross and the number
  decal(1.2, 0.9, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.strokeStyle = 'rgba(236,236,226,.88)'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(30, 30); c.lineTo(W2 * 0.5, H2 - 30); c.moveTo(W2 * 0.5, 30); c.lineTo(30, H2 - 30); c.stroke(); c.fillStyle = 'rgba(236,236,226,.9)'; c.font = 'bold 90px "Russo One", Impact, sans-serif'; c.fillText('14', W2 * 0.56, H2 * 0.68); }, 5.4, 1.15, -6.29, Math.PI, Hs);
  decal(0.9, 0.7, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.strokeStyle = 'rgba(236,236,226,.85)'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(25, 25); c.lineTo(W2 - 25, H2 - 25); c.moveTo(W2 - 25, 25); c.lineTo(25, H2 - 25); c.stroke(); }, 6.29, 2.5, -1.4, Math.PI / 2, Hs);

  // floors: wide planks, with a hole for the cellar hatch
  const fl = (x0, x1, z0, z1, mat = M.floor) => { const g = new THREE.BoxGeometry(x1 - x0, 0.06, z1 - z0); uvScale(g, (x1 - x0) / 1.2, (z1 - z0) / 1.2); const m = new THREE.Mesh(g, mat); m.position.set((x0 + x1) / 2, FY - 0.03, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = true; Hs.add(m); return m; };
  const fixUV = m => { const uv = m.geometry.attributes.uv, p = m.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + m.position.x) / 1.2, (p.getZ(i) + m.position.z) / 1.2); uv.needsUpdate = true; };
  [fl(0, 6, -6, TRAP.z0), fl(0, 6, TRAP.z1, 0), fl(0, TRAP.x0, TRAP.z0, TRAP.z1), fl(TRAP.x1, 6, TRAP.z0, TRAP.z1), fl(0, 6, 0.25, 2.8)].forEach(fixUV);
  // the floor's underside and joists, seen from the cellar
  for (let x = 0.5; x < 6; x += 0.9) mbox(0.16, 0.14, 6.0, M.logIn, x, FY - 0.13, -3, Hs, 1);
  // ceiling boards (and the attic floor on top of them) with the big beam across
  const ce = (x0, x1, z0, z1) => { const g = new THREE.BoxGeometry(x1 - x0, AF - CEIL, z1 - z0); uvScale(g, (x1 - x0) / 1.2, (z1 - z0) / 1.2); const m = new THREE.Mesh(g, M.ceil); m.position.set((x0 + x1) / 2, (CEIL + AF) / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = true; Hs.add(m); };
  ce(0, 6, -6, 0.25); ce(0, 6, 0.25, HATCH.z0); ce(0, 6, HATCH.z1, 2.8); ce(0, HATCH.x0, HATCH.z0, HATCH.z1); ce(HATCH.x1, 6, HATCH.z0, HATCH.z1);
  mbox(6.0, 0.26, 0.28, M.logIn, 3, CEIL - 0.13, -3.0, Hs, 1);
  // the attic floor: dry earth and sawdust packed over the boards, a plank walk down the middle
  { const g = new THREE.PlaneGeometry(6.4, 9.2); g.rotateX(-Math.PI / 2); uvScale(g, 3, 4); const m = new THREE.Mesh(g, std({ map: T.earth, normalMap: T.earthN, color: 0xb8a890, roughness: 1 })); m.position.set(3, AF + 0.002, -1.6); m.receiveShadow = true; Hs.add(m); }
  for (let i = 0; i < 3; i++) mbox(0.3, 0.03, 9.0, M.board, 2.7 + i * 0.31, AF + 0.016, -1.6, Hs, 1);

  // solids: walls (with the door gaps), floors, the cellar box under the izba
  const S2 = (id, x0, x1, y0, y1, z0, z1, o) => solid(id, x0, x1, y0, y1, z0, z1, o);
  S2('wN', -0.3, 6.3, -2, EAVE, -6.25, -6.0); S2('wS', -0.3, 6.3, -2, EAVE, 2.8, 3.05);
  S2('wW', -0.25, 0.0, -2, EAVE, -6.25, 3.05);
  S2('wE1', 6.0, 6.25, -2, EAVE, -6.25, DOOR_P.z0); S2('wE2', 6.0, 6.25, -2, EAVE, DOOR_P.z1, 3.05); S2('wE3', 6.0, 6.25, FY + 1.9, EAVE, DOOR_P.z0, DOOR_P.z1);
  S2('wP1', -0.1, DOOR_I.x0, -2, CEIL, 0, 0.25); S2('wP2', DOOR_I.x1, 6.1, -2, CEIL, 0, 0.25); S2('wP3', DOOR_I.x0, DOOR_I.x1, FY + 1.85, CEIL, 0, 0.25); S2('wP4', DOOR_I.x0, DOOR_I.x1, -2, FY, 0, 0.25);
  // the floors
  S2('fl1', 0, 6, FY - 0.14, FY, -6, TRAP.z0); S2('fl2', 0, 6, FY - 0.14, FY, TRAP.z1, 0); S2('fl3', 0, TRAP.x0, FY - 0.14, FY, TRAP.z0, TRAP.z1); S2('fl4', TRAP.x1, 6, FY - 0.14, FY, TRAP.z0, TRAP.z1);
  S2('flS', 0, 6, -2, FY, 0.25, 2.8);
  O.trapSolid = S2('trap', TRAP.x0, TRAP.x1, FY - 0.14, FY, TRAP.z0, TRAP.z1);
  O.trapGuard = S2('trapGuard', TRAP.x0 + 0.05, TRAP.x1 - 0.05, FY - 0.1, FY + 0.95, TRAP.z0 + 0.05, TRAP.z1 - 0.05); O.trapGuard.on = false;
  // ceilings
  S2('ceilI', -0.25, 6.25, CEIL, AF, -6.25, HATCH.z0); S2('ceilS2', -0.25, 6.25, CEIL, AF, HATCH.z1, 3.05); S2('ceilS3', -0.25, HATCH.x0, CEIL, AF, HATCH.z0, HATCH.z1); S2('ceilS4', HATCH.x1, 6.25, CEIL, AF, HATCH.z0, HATCH.z1);
  O.hatchSolid = S2('hatch', HATCH.x0, HATCH.x1, CEIL, AF, HATCH.z0, HATCH.z1);
  // the cellar: earth all round, its floor, the stove's foundation going down through it
  S2('cFloor', CELL.x0, CELL.x1, -3, CY, CELL.z0, CELL.z1);
  S2('cW', 0, CELL.x0, -3, FY - 0.14, -6, 0); S2('cE', CELL.x1, 6, -3, FY - 0.14, -6, 0); S2('cN', 0, 6, -3, FY - 0.14, -6, CELL.z0); S2('cS', 0, 6, -3, FY - 0.14, CELL.z1, 0);
  S2('cStove', 0, 2.05, -3, FY - 0.14, -2.45, 0);
  // the roof, from inside the attic: stepped boxes under each slope so your head finds it
  for (let i = 0; i < 12; i++) { const x0 = -0.3 + i * 0.27, x1 = x0 + 0.27, y = roofY(x1); S2('rfW' + i, x0, x1, y - 0.15, y + 0.6, OUT.z0, OUT.z1); const xa = 6.3 - i * 0.27, xb = xa - 0.27, y2 = roofY(xb); S2('rfE' + i, xb, xa, y2 - 0.15, y2 + 0.6, OUT.z0, OUT.z1); }
  S2('aN', -0.3, 6.3, AF - 0.1, RIDGE + 1, OUT.z0 - 0.1, -6.15); S2('aS', -0.3, 6.3, AF - 0.1, 3.75, 2.95, 3.15); S2('aS2', -0.3, 2.62, 3.75, RIDGE + 1, 2.95, 3.15); S2('aS3', 3.38, 6.3, 3.75, RIDGE + 1, 2.95, 3.15); S2('aS4', 2.62, 3.38, 4.58, RIDGE + 1, 2.95, 3.15);
  S2('aChim', 0.55, 1.25, AF - 0.1, RIDGE + 1, -1.25, -0.55);

  buildCellar(); buildAttic();
}

/* ---------------- the stove ---------------- */
function buildStove() {
  O.stove = grp(); const g = O.stove;
  const Wm = M.white;
  const s = STOVE, base = FY, mx = MOUTH.x, mw = MOUTH.w;
  // the base, with the dark hole underneath where the oven forks and kindling live
  mbox(s.x1 - s.x0, 0.42, s.z1 - (s.z0 + 0.5), Wm, (s.x0 + s.x1) / 2, base + 0.21, (s.z0 + 0.5 + s.z1) / 2, g, 1);
  mbox(0.42, 0.42, 0.5, Wm, s.x0 + 0.21, base + 0.21, s.z0 + 0.25, g, 1); mbox(s.x1 - 1.4, 0.42, 0.5, Wm, (1.4 + s.x1) / 2, base + 0.21, s.z0 + 0.25, g, 1);
  mbox(1.4 - 0.47, 0.06, 0.5, Wm, (0.47 + 1.4) / 2, base + 0.39, s.z0 + 0.25, g, 1);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.36, 0.5), std({ color: 0x0c0a08, roughness: 1, side: THREE.BackSide })); b.position.set((0.47 + 1.4) / 2, base + 0.18, s.z0 + 0.25); g.add(b); }
  // the body, hollow behind the mouth: the oven chamber
  const y0 = base + 0.42, y1 = s.top, ch = { x0: mx - 0.5, x1: mx + 0.5, y0: MOUTH.y0, y1: MOUTH.y1 + 0.12, z0: s.z0 + 0.22, z1: -0.55 };
  mbox(ch.x0 - s.x0, y1 - y0, s.z1 - s.z0 - 0.22, Wm, (s.x0 + ch.x0) / 2, (y0 + y1) / 2, (s.z0 + 0.22 + s.z1) / 2, g, 1);
  mbox(s.x1 - ch.x1, y1 - y0, s.z1 - s.z0 - 0.22, Wm, (ch.x1 + s.x1) / 2, (y0 + y1) / 2, (s.z0 + 0.22 + s.z1) / 2, g, 1);
  mbox(ch.x1 - ch.x0, y1 - y0, s.z1 - ch.z1, Wm, mx, (y0 + y1) / 2, (ch.z1 + s.z1) / 2, g, 1);
  mbox(ch.x1 - ch.x0, ch.y0 - y0, ch.z1 - ch.z0, Wm, mx, (y0 + ch.y0) / 2, (ch.z0 + ch.z1) / 2, g, 1);
  mbox(ch.x1 - ch.x0, y1 - ch.y1, ch.z1 - ch.z0, Wm, mx, (ch.y1 + y1) / 2, (ch.z0 + ch.z1) / 2, g, 1);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(ch.x1 - ch.x0, ch.y1 - ch.y0, ch.z1 - ch.z0), M.ovenIn.clone()); b.material.side = THREE.BackSide; b.material.color.setHex(0x1c1610); b.position.set(mx, (ch.y0 + ch.y1) / 2, (ch.z0 + ch.z1) / 2); g.add(b); O.ovenBox = b; }
  // the front face with its arched mouth
  { const sh = new THREE.Shape(); sh.moveTo(s.x0, y0); sh.lineTo(s.x1, y0); sh.lineTo(s.x1, y1); sh.lineTo(s.x0, y1); sh.closePath();
    const hp = new THREE.Path(); const r = mw / 2, top = MOUTH.y1 - r; hp.moveTo(mx - r, MOUTH.y0); hp.lineTo(mx + r, MOUTH.y0); hp.lineTo(mx + r, top); hp.absarc(mx, top, r, 0, Math.PI, false); hp.lineTo(mx - r, MOUTH.y0); sh.holes.push(hp);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 14 });
    const uv = fg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
    const f = new THREE.Mesh(fg, Wm); f.position.z = s.z0; f.castShadow = true; f.receiveShadow = true; g.add(f); }
  // a cornice round the top, a plinth round the bottom
  for (const [y, hgt, out] of [[s.top - 0.08, 0.07, 0.04], [s.top - 0.16, 0.04, 0.02], [base + 0.06, 0.12, 0.025]]) { bev(s.x1 - s.x0 + out * 2, hgt, out * 2 + 0.02, Wm, (s.x0 + s.x1) / 2, y, s.z0 - out + 0.01, g, 0.01); bev(out * 2 + 0.02, hgt, s.z1 - s.z0 + out, Wm, s.x1 + out - 0.01, y, (s.z0 + s.z1) / 2 - out / 2, g, 0.01); }
  // the hearth ledge in front of the mouth
  mbox(0.9, 0.06, 0.16, Wm, mx, MOUTH.y0 - 0.03, s.z0 - 0.06, g, 1);
  // the top, with a lip; the chimney up to the ceiling
  mbox(CHIM.x1 - CHIM.x0, CEIL - s.top, CHIM.z1 - CHIM.z0, Wm, (CHIM.x0 + CHIM.x1) / 2, (s.top + CEIL) / 2, (CHIM.z0 + CHIM.z1) / 2, g, 1);
  // soot round the mouth and up the face
  decal(1.1, 0.95, (c, W2, H2) => { c.drawImage(T.soot.userData.canvas, 0, 0, W2, H2); }, mx, MOUTH.y1 - 0.1, s.z0 - 0.018, Math.PI, g, 256);
  // little niches in the side for drying mittens
  for (const [z, y] of [[-1.6, FY + 1.1], [-0.9, FY + 1.1]]) decal(0.16, 0.16, (c, W2, H2) => { c.fillStyle = 'rgba(20,16,12,.85)'; c.beginPath(); c.moveTo(10, H2); c.lineTo(10, H2 * 0.4); c.arc(W2 / 2, H2 * 0.4, W2 / 2 - 10, Math.PI, 0); c.lineTo(W2 - 10, H2); c.fill(); }, s.x1 + 0.016, y, z, Math.PI / 2, g, 64);
  // the step-bench up the side
  bev(STEPB.x1 - STEPB.x0, 0.5, STEPB.z1 - STEPB.z0, M.wood, (STEPB.x0 + STEPB.x1) / 2, FY + 0.25, (STEPB.z0 + STEPB.z1) / 2, g, 0.012);
  // the iron door that closes the mouth
  O.zas = grp(mx, MOUTH.y0, s.z0 - 0.08, scene); O.zas.userData.keep = true;
  { const sh = new THREE.Shape(); const r = mw / 2 + 0.03, top = MOUTH.y1 - r + 0.02; sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, top - MOUTH.y0); sh.absarc(0, top - MOUTH.y0, r, 0, Math.PI, false); sh.lineTo(-r, 0); const zg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false, curveSegments: 12 }); const zm = new THREE.Mesh(zg, M.iron); zm.castShadow = true; O.zas.add(zm); const hd = pole([-0.08, 0.32, 0.03], [0.08, 0.32, 0.03], 0.012, M.iron, O.zas, 6); hd.position.z = 0.04; }
  // the damper door high on the chimney's east face
  O.damper = grp(DAMPER.x + 0.006, DAMPER.y, DAMPER.z, scene); O.damper.userData.keep = true;
  { const d = bev(0.012, 0.17, 0.19, M.iron, 0.006, 0, 0.095, O.damper, 0.003); d.position.z = 0.095; O.damperLeaf = d; const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 12), M.iron); ring.position.set(0.02, 0, 0.17); ring.rotation.y = Math.PI / 2; d.add(ring); }
  O.damperDoor = O.damper;
  decal(0.2, 0.22, (c, W2, H2) => { c.fillStyle = 'rgba(14,10,8,.8)'; c.fillRect(8, 8, W2 - 16, H2 - 16); }, DAMPER.x + 0.004, DAMPER.y, DAMPER.z + 0.095, Math.PI / 2, g, 64);
  O.damperLid = grp(1.6, s.top + 0.06, -0.4, scene); { const lid = cyl(0.11, 0.11, 0.02, M.iron, 0, 0, 0, O.damperLid, 16); const k = cyl(0.015, 0.015, 0.03, M.iron, 0, 0.02, 0, O.damperLid, 6); } O.damperLid.visible = false; O.damperLid.userData.keep = true;
  // the oven fork and the poker in the corner by the stove
  pole([2.02, FY, -2.45], [1.95, FY + 1.75, -2.38], 0.018, M.wood, scene, 6); { const fk = grp(1.95, FY + 1.75, -2.38, scene); }
  O.poker = grp(2.15, FY, -2.5, scene); pole([0, 0, 0], [-0.05, 1.5, 0.05], 0.012, M.iron, O.poker, 6); pole([-0.05, 1.5, 0.05], [-0.05, 1.52, -0.12], 0.012, M.iron, O.poker, 6);
  // felt boots drying on the stove top, and a sheepskin
  for (let i = 0; i < 2; i++) { const b = grp(1.55 + i * 0.16, s.top + 0.05, -1.75, scene); mbox(0.11, 0.42, 0.12, std({ color: 0x3a3632, roughness: 1 }), 0, 0.06, 0, b, 1).rotation.x = Math.PI / 2; mbox(0.11, 0.1, 0.24, std({ color: 0x3a3632, roughness: 1 }), 0, 0.1, 0.2, b, 1); }
  { const sk = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8, 8, 6), std({ color: 0x8a7a62, roughness: 1, map: T.fur, side: THREE.DoubleSide })); const p = sk.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 6) * 0.03 + Math.cos(p.getY(i) * 5) * 0.02); sk.geometry.computeVertexNormals(); sk.rotation.x = -Math.PI / 2; sk.position.set(0.9, s.top + 0.06, -1.85); sk.receiveShadow = true; scene.add(sk); }
  // solids: the stove, the step, the chimney
  solid('stove', s.x0, s.x1, FY - 0.1, s.top, s.z0 - 0.1, s.z1, { noStand: false });
  solid('stoveStep', STEPB.x0, STEPB.x1, FY - 0.1, STEPB.top, STEPB.z0, STEPB.z1);
  solid('chim', CHIM.x0, CHIM.x1, s.top, CEIL, CHIM.z0, CHIM.z1);
  solid('pokers', 1.95, 2.25, FY, FY + 1.6, -2.6, -2.32);
}

/* ---------------- furniture and things in the izba ---------------- */
function buildFurniture() {
  O.furn = grp();
  const F = O.furn;
  // the kitchen corner: the curtain on its rod, the shelf, the water tub, a little table
  pole([KUT_X, FY + 1.95, -4.18], [KUT_X, FY + 1.95, -2.3], 0.012, M.woodDark, F, 6);
  { const g = new THREE.PlaneGeometry(1.86, 1.8, 40, 6); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 26) * 0.035 + Math.sin(x * 7) * 0.02); } g.computeVertexNormals(); const c = new THREE.Mesh(g, M.chintz); c.rotation.y = Math.PI / 2; c.position.set(KUT_X, FY + 1.05, -3.24); c.castShadow = true; c.receiveShadow = true; scene.add(c); O.curtain = c; c.userData.keep = true;
    // drawn back a little at the stove end so you can get in
    const g2 = new THREE.PlaneGeometry(0.5, 1.8, 10, 6); const p2 = g2.attributes.position; for (let i = 0; i < p2.count; i++) { const x = p2.getX(i); p2.setZ(i, Math.sin(x * 40) * 0.05); } g2.computeVertexNormals(); }
  // shelf on the west wall north of the window, with crocks and plates
  O.shelf = grp(0.22, FY, -3.85, scene);
  for (const y of [0.9, 1.3, 1.7]) bev(0.34, 0.03, 0.55, M.woodDark, 0, y, 0, O.shelf, 0.006);
  for (const s of [-1, 1]) bev(0.34, 1.8, 0.03, M.woodDark, 0, 0.9 + 0.0, s * 0.27, O.shelf, 0.006);
  const crock = (x, y, z, s, par) => { const g = grp(x, y, z, par); lathe([[0, 0], [0.07, 0.005], [0.095, 0.05], [0.1, 0.1], [0.085, 0.15], [0.075, 0.17], [0.085, 0.185], [0.08, 0.19]].map(([r, h]) => [r * s, h * s]), M.clay, 0, 0, 0, g, 18); return g; };
  crock(0, 1.33, -0.15, 0.8, O.shelf); crock(0.02, 1.73, 0.12, 0.7, O.shelf); crock(0.0, 0.93, 0.15, 1.0, O.shelf);
  for (let i = 0; i < 4; i++) { const p = cyl(0.11, 0.08, 0.02, std({ color: 0xe8e4d8, roughness: 0.4 }), 0.05, 1.42 + i * 0.002, -0.05 + i * 0.07, O.shelf, 18); p.rotation.x = 1.2; }
  // the clay pot for the embers, on the bottom shelf, with its lid
  O.pot = grp(0.24, FY + 0.93, -3.95 - 0.05, scene); O.pot.userData.keep = true;
  { lathe([[0, 0], [0.08, 0.005], [0.105, 0.06], [0.11, 0.12], [0.095, 0.18], [0.082, 0.2], [0.092, 0.215], [0.088, 0.22]], M.clay, 0, 0, 0, O.pot, 20); O.potLid = lathe([[0, 0.05], [0.04, 0.045], [0.095, 0.01], [0.098, 0]], M.clay, 0, 0.215, 0, O.pot, 18); O.potGlow = new THREE.Mesh(new THREE.CircleGeometry(0.085, 14), M.ember); O.potGlow.rotation.x = -Math.PI / 2; O.potGlow.position.y = 0.17; O.pot.add(O.potGlow); }
  // the water tub and its dipper
  lathe([[0, 0], [0.26, 0], [0.28, 0.55], [0.3, 0.56]], M.wood, 1.62, FY, -3.85, F, 20);
  { const w = new THREE.Mesh(new THREE.CircleGeometry(0.27, 20), M.water); w.rotation.x = -Math.PI / 2; w.position.set(1.62, FY + 0.5, -3.85); F.add(w); }
  for (const yy of [0.12, 0.42]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 6, 24), M.iron); hoop.rotation.x = Math.PI / 2; hoop.position.set(1.62, FY + yy, -3.85); F.add(hoop); }
  { const k = grp(1.85, FY + 0.6, -3.7, F); lathe([[0, 0], [0.05, 0.005], [0.06, 0.04], [0.058, 0.05]], M.tin, 0, 0, 0, k, 14); pole([0.05, 0.04, 0], [0.16, 0.08, 0.02], 0.008, M.tin, k, 5); }
  // the little table under the kitchen window
  bev(0.55, 0.04, 0.7, M.wood, 0.32, FY + 0.76, -3.2, F, 0.008);
  for (const [dx, dz] of [[-0.22, -0.3], [0.22, -0.3], [-0.22, 0.3], [0.22, 0.3]]) bev(0.04, 0.74, 0.04, M.wood, 0.32 + dx, FY + 0.37, -3.2 + dz, F, 0.006);
  { const bowl = lathe([[0, 0], [0.09, 0.01], [0.15, 0.08], [0.16, 0.09]], std({ color: 0xc8b8a0, roughness: 0.5 }), 0.32, FY + 0.78, -3.1, F, 18); }
  solid('kTable', 0.05, 0.6, FY, FY + 0.78, -3.55, -2.85); solid('tub', 1.32, 1.92, FY, FY + 0.56, -4.15, -3.55); solid('shelf', 0.05, 0.4, FY, FY + 1.85, -4.15, -3.55);

  // the icon corner: the table with its oilcloth, the benches along the walls, the icon shelf
  O.table = grp(4.92, FY, -5.0, scene); O.table.userData.keep = true;
  bev(1.36, 0.05, 1.12, M.woodDark, 0, 0.735, 0, O.table, 0.01);
  { const g = new THREE.BoxGeometry(1.46, 0.006, 1.22); const m = new THREE.Mesh(g, M.oil); m.position.y = 0.764; O.table.add(m); m.receiveShadow = true; for (const [w, d, x, z, ry] of [[1.46, 0.12, 0, 0.61, 0], [1.46, 0.12, 0, -0.61, 0], [1.22, 0.12, 0.73, 0, Math.PI / 2], [1.22, 0.12, -0.73, 0, Math.PI / 2]]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.oil); f.position.set(x, 0.708, z); f.rotation.y = ry; f.material.side = THREE.DoubleSide; O.table.add(f); } }
  O.legs = [];
  for (const [dx, dz] of [[-0.6, -0.48], [0.6, -0.48], [-0.6, 0.48], [0.6, 0.48]]) { const l = lathe([[0.03, 0], [0.032, 0.06], [0.025, 0.12], [0.03, 0.3], [0.022, 0.5], [0.028, 0.71], [0.03, 0.72]], M.woodDark, dx, 0, dz, O.table, 10); O.legs.push(l); }
  bev(1.2, 0.08, 0.06, M.woodDark, 0, 0.68, 0.5, O.table, 0.006); bev(1.2, 0.08, 0.06, M.woodDark, 0, 0.68, -0.5, O.table, 0.006);
  // the red thread, tied round the leg nearest the room once you tie it
  O.thread = grp(-0.6, 0.32, 0.48, O.table); { const t = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.004, 6, 16), std({ color: 0xc01810, roughness: 0.8 })); t.rotation.x = Math.PI / 2; O.thread.add(t); for (const s of [-1, 1]) pole([0.03, 0, 0.01], [0.05 + s * 0.02, -0.12, 0.03], 0.0025, std({ color: 0xc01810, roughness: 0.8 }), O.thread, 4); } O.thread.visible = false;
  solid('table', 4.24, 5.6, FY + 0.7, FY + 0.77, -5.56, -4.44);
  for (const [dx, dz] of [[-0.6, -0.48], [0.6, -0.48], [-0.6, 0.48], [0.6, 0.48]]) solid('tleg', 4.92 + dx - 0.04, 4.92 + dx + 0.04, FY, FY + 0.7, -5.0 + dz - 0.04, -5.0 + dz + 0.04);
  // benches
  bev(2.55, 0.05, 0.34, M.woodDark, 4.68, FY + 0.43, -5.8, F, 0.01); for (const x of [3.5, 4.7, 5.85]) bev(0.05, 0.42, 0.3, M.woodDark, x, FY + 0.21, -5.8, F, 0.006);
  bev(0.34, 0.05, 2.05, M.woodDark, 5.8, FY + 0.43, -4.95, F, 0.01); for (const z of [-4.0, -4.9]) bev(0.3, 0.42, 0.05, M.woodDark, 5.8, FY + 0.21, z, F, 0.006);
  solid('benchN', 3.4, 5.95, FY, FY + 0.45, -5.97, -5.63); solid('benchE', 5.63, 5.97, FY, FY + 0.45, -5.97, -3.92);
  // a stool
  { const st = grp(3.95, FY, -4.25, F); bev(0.34, 0.04, 0.34, M.wood, 0, 0.46, 0, st, 0.008); for (const [dx, dz] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) bev(0.035, 0.45, 0.035, M.wood, dx, 0.225, dz, st, 0.005); solid('stool', 3.78, 4.12, FY, FY + 0.48, -4.42, -4.08); }
  // the samovar and the kerosene lamp on the table
  { const sm = grp(5.3, FY + 0.766, -5.3, F); lathe([[0.06, 0], [0.07, 0.03], [0.05, 0.06], [0.12, 0.08], [0.14, 0.2], [0.12, 0.34], [0.06, 0.36], [0.05, 0.42], [0.07, 0.43], [0.03, 0.45]], M.brass, 0, 0, 0, sm, 24); pole([-0.13, 0.12, 0], [-0.2, 0.08, 0], 0.01, M.brass, sm, 6); for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 12, Math.PI), M.woodDark); h.position.set(s * 0.14, 0.3, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; sm.add(h); } }
  O.lamp = grp(4.72, FY + 0.766, -5.08, scene); O.lamp.userData.keep = true;
  { lathe([[0, 0], [0.07, 0], [0.07, 0.015], [0.03, 0.04], [0.025, 0.09], [0.075, 0.12], [0.08, 0.17], [0.05, 0.2], [0.02, 0.21]], M.brass, 0, 0, 0, O.lamp, 22); lathe([[0.022, 0.21], [0.03, 0.24], [0.034, 0.27], [0.04, 0.31], [0.032, 0.36], [0.026, 0.42], [0.028, 0.44]], phys({ color: 0xeeeedd, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0, 0, O.lamp, 18);
    O.lampFlame = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.flames[3], color: 0xffd090, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); O.lampFlame.scale.set(0.035, 0.07, 1); O.lampFlame.position.y = 0.285; O.lamp.add(O.lampFlame); O.lampFlame.visible = false; O.lampFlame.userData.noRay = true; }
  // the icon shelf, high in the corner, with the towel over it and a little red lamp
  { const ic = grp(5.72, FY + 1.95, -5.72, scene); ic.rotation.y = -Math.PI / 4; O.iconG = ic;
    bev(0.42, 0.03, 0.2, M.woodDark, 0, 0, 0.0, ic, 0.006);
    O.iconBoard = bev(0.26, 0.32, 0.025, M.woodDark, 0, 0.18, -0.05, ic, 0.006);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), std({ map: T.icon, roughness: 0.45, metalness: 0.15 })); face.position.set(0, 0.18, -0.036); ic.add(face);
    // the towel over the top of the icon, its embroidered ends hanging down both sides
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.08), M.towel); top.position.set(0, 0.36, -0.03); ic.add(top);
    for (const s of [-1, 1]) { const tw = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.78, 2, 10), M.towel); const p = tw.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getY(i) * 8) * 0.01); tw.geometry.computeVertexNormals(); tw.position.set(s * 0.19, 0.0, -0.025); ic.add(tw); }
    const lp = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), phys({ color: 0x8a1010, roughness: 0.1, transparent: true, opacity: 0.8 })); lp.position.set(0, -0.16, 0.05); ic.add(lp); pole([0, -0.13, 0.05], [0, 0.0, 0.05], 0.0015, M.brass, ic, 3); }
  // the iron bed with its stack of pillows and its lace valance
  { const bd = grp(5.36, FY, -2.42, scene); O.bed = bd; bd.userData.keep = true;
    const ni = std({ color: 0x3a3a3c, roughness: 0.5, metalness: 0.6 }); const knob = std({ color: 0xc8c8c0, roughness: 0.2, metalness: 1, envMapIntensity: 1 });
    for (const [dx, dz, h] of [[-0.55, -1.12, 1.15], [0.55, -1.12, 1.15], [-0.55, 1.12, 0.85], [0.55, 1.12, 0.85]]) { cyl(0.018, 0.018, h, ni, dx, h / 2, dz, bd, 8); const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), knob); k.position.set(dx, h + 0.02, dz); bd.add(k); }
    for (const [dz, h] of [[-1.12, 1.15], [1.12, 0.85]]) { for (const y of [0.42, h - 0.06]) pole([-0.55, y, dz], [0.55, y, dz], 0.012, ni, bd, 6); for (let i = 0; i < 7; i++) pole([-0.42 + i * 0.14, 0.42, dz], [-0.42 + i * 0.14, h - 0.06, dz], 0.007, ni, bd, 5); }
    bev(1.08, 0.18, 2.2, std({ color: 0x8a7a68, roughness: 1 }), 0, 0.5, 0, bd, 0.05);
    { const q = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.06, 2.0, 1, 1, 1), std({ map: T.quilt, color: 0x9a5a4a, roughness: 1 })); q.position.set(0, 0.6, 0.08); bd.add(q); q.castShadow = true; }
    const val = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.32, 30, 1), std({ map: tex(canv(256, 48, (c, W2, H2) => { c.fillStyle = '#e8e2d4'; c.fillRect(0, 0, W2, H2 - 8); c.globalCompositeOperation = 'destination-out'; for (let x = 0; x < W2; x += 8) { c.beginPath(); c.arc(x + 4, 18, 2.5, 0, TAU); c.fill(); } c.globalCompositeOperation = 'source-over'; c.fillStyle = '#e8e2d4'; for (let x = 0; x < W2; x += 16) { c.beginPath(); c.arc(x + 8, H2 - 8, 8, 0, Math.PI); c.fill(); } })), alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }));
    val.rotation.y = Math.PI / 2; val.position.set(-0.56, 0.27, 0); const vp = val.geometry.attributes.position; for (let i = 0; i < vp.count; i++) vp.setZ(i, Math.sin(vp.getX(i) * 30) * 0.015); bd.add(val);
    for (let i = 0; i < 3; i++) { const w = 0.86 - i * 0.14, d = 0.5 - i * 0.06, h = 0.16 - i * 0.02; const pw = bev(w, h, d, M.linen, 0, 0.7 + i * 0.15 + h / 2, -0.82, bd, 0.06); pw.rotation.y = (i - 1) * 0.04; }
    const lc = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), std({ map: tex(canv(128, 96, (c, W2, H2) => { c.fillStyle = 'rgba(240,236,228,.95)'; c.fillRect(0, 0, W2, H2); c.globalCompositeOperation = 'destination-out'; for (let x = 6; x < W2; x += 12) for (let y = 6; y < H2; y += 12) { c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); } })), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide })); lc.position.set(0, 1.18, -0.72); lc.rotation.x = -1.2; lc.scale.set(0.8, 0.9, 1); bd.add(lc);
    solid('bed', 4.78, 5.95, FY, FY + 0.62, -3.56, -1.28); }
  // the chest against the partition: painted, banded with iron; it can be dragged
  O.chest = grp(POS.chest0.x, POS.chest0.y, POS.chest0.z, scene); O.chest.userData.keep = true;
  { const ch = O.chest; const pm = std({ map: T.plank, color: 0x6a3a2a, roughness: 0.7 }); bev(1.1, 0.5, 0.55, pm, 0, 0.25, 0, ch, 0.012); const lid = bev(1.13, 0.1, 0.58, pm, 0, 0.55, 0, ch, 0.02);
    for (const x of [-0.42, 0, 0.42]) { mbox(0.05, 0.61, 0.565, M.iron, x, 0.3, 0, ch, 1); }
    const lock = bev(0.08, 0.1, 0.02, M.brass, 0, 0.42, -0.285, ch, 0.004);
    const pain = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.3), std({ map: tex(canv(128, 112, (c, W2, H2) => { c.fillStyle = '#6a3a2a'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#d8a040'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(W2 / 2 + Math.cos(i * 1.256) * 22, H2 / 2 + Math.sin(i * 1.256) * 22, 14, 0, TAU); c.fill(); } c.fillStyle = '#b02a20'; c.beginPath(); c.arc(W2 / 2, H2 / 2, 14, 0, TAU); c.fill(); c.strokeStyle = '#3a6a2a'; c.lineWidth = 4; c.beginPath(); c.arc(W2 / 2, H2 / 2, 46, 0.3, 2.8); c.stroke(); })), roughness: 0.7 })); pain.position.set(-0.21, 0.27, -0.277); pain.rotation.y = Math.PI; ch.add(pain); const p2 = pain.clone(); p2.position.x = 0.21; ch.add(p2);
    ch.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); }
  // the cellar hatch: a plank square with an iron ring, hinged on its north edge
  O.trap = grp(TRAP.x0 + 0.4, FY, TRAP.z0, scene); O.trap.userData.keep = true;
  { const leaf = bev(0.8, 0.05, 0.8, M.floor, 0, -0.025, 0.4, O.trap, 0.004); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 14), M.iron); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.004, 0.68); O.trap.add(ring); O.trapLeaf = leaf; }
  { const hole = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.8), std({ color: 0x050404, roughness: 1 })); hole.position.set(TRAP.x0 + 0.4, FY - 0.16, TRAP.z0 + 0.4); scene.add(hole); }
  // pegs by the door: Babushka's shawl, and your quilted jacket, still damp from the river
  pole([3.7, FY + 1.78, -0.01], [4.4, FY + 1.78, -0.01], 0.02, M.woodDark, F, 6);
  for (const x of [3.85, 4.15]) pole([x, FY + 1.78, -0.02], [x, FY + 1.76, -0.12], 0.012, M.woodDark, F, 5);
  O.jacket = grp(4.15, FY + 1.75, -0.13, scene); O.jacket.userData.keep = true;
  { const j = O.jacket; const body = lathe([[0.02, 0.04], [0.14, 0], [0.2, -0.1], [0.21, -0.45], [0.22, -0.72], [0.2, -0.74]], M.quilt, 0, 0, 0, j, 18); body.scale.z = 0.45; for (const s of [-1, 1]) { const sl = pole([s * 0.17, -0.05, 0], [s * 0.2, -0.62, 0.03], 0.06, M.quilt, j, 10, 0.07); } const col = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 14), M.quilt); col.rotation.x = Math.PI / 2; col.position.y = 0.02; j.add(col); j.traverse(c => { if (c.isMesh) c.castShadow = true; }); }
  O.shawl = grp(3.85, FY + 1.75, -0.1, scene); { const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.85, 8, 10), std({ map: tex(canv(128, 256, (c, W2, H2) => { c.fillStyle = '#5a5a62'; c.fillRect(0, 0, W2, H2); for (let i = 0; i < W2; i += 6) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(i, 0, 2, H2); } c.fillStyle = '#8a2a2a'; c.fillRect(0, H2 - 30, W2, 6); for (let x = 0; x < W2; x += 4) { c.fillStyle = '#4a4a50'; c.fillRect(x, H2 - 22, 2, 22); } })), side: THREE.DoubleSide, roughness: 1 })); const p = sw.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.02 - Math.max(0, p.getY(i)) * 0.06); sw.geometry.computeVertexNormals(); sw.position.y = -0.4; O.shawl.add(sw); sw.castShadow = true; }
  // the wall clock with its pine-cone weights
  O.clock = grp(2.1, FY + 2.0, -5.97, scene); O.clock.userData.keep = true;
  { const c = O.clock; bev(0.26, 0.26, 0.05, M.woodDark, 0, 0, 0.025, c, 0.01); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), std({ map: T.clockFace, roughness: 0.6 })); f.position.z = 0.052; c.add(f);
    O.clockHands = []; for (const [l, w] of [[0.07, 0.006], [0.09, 0.004]]) { const h = grp(0, 0, 0.056, c); const hm = mbox(w, l, 0.002, std({ color: 0x1a1a1a, roughness: 0.6 }), 0, l / 2, 0, h, 1); O.clockHands.push(h); } O.clockHands[0].rotation.z = -2.6; O.clockHands[1].rotation.z = -4.2;
    O.pend = grp(0, -0.13, 0.03, c); pole([0, 0, 0], [0, -0.35, 0], 0.003, M.brass, O.pend, 4); const bob = cyl(0.035, 0.035, 0.006, M.brass, 0, -0.36, 0, O.pend, 16); bob.rotation.x = Math.PI / 2;
    for (const [x, y] of [[-0.05, -0.75], [0.05, -0.55]]) { pole([x, -0.13, 0.03], [x, y, 0.03], 0.0025, M.iron, c, 3); const cone = lathe([[0, 0], [0.018, 0.02], [0.022, 0.06], [0.016, 0.1], [0.004, 0.11]], M.iron, x, y - 0.11, 0.03, c, 8); } }
  // the family photographs in one frame, on the wall between the windows
  { bev(0.56, 0.44, 0.03, M.woodDark, 3.88, FY + 1.95, -5.98, F, 0.008); const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.38), std({ map: T.photos, roughness: 0.3 })); ph.position.set(3.88, FY + 1.95, -5.962); scene.add(ph); O.photos = ph; ph.userData.keep = true; }
  // the spinning wheel by the bed, the basket on the bench, the sewing tin on the sill
  { const sp = grp(0.75, FY, -5.45, F); sp.rotation.y = 0.9; bev(0.5, 0.05, 0.16, M.wood, 0, 0.18, 0, sp, 0.008); for (const s of [-1, 1]) bev(0.035, 0.6, 0.035, M.wood, s * 0.2, 0.0 + 0.3, 0, sp, 0.005); const wh = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 6, 28), M.wood); wh.position.set(0.05, 0.62, 0); sp.add(wh); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; pole([0.05, 0.62, 0], [0.05 + Math.cos(a) * 0.22, 0.62 + Math.sin(a) * 0.22, 0], 0.005, M.wood, sp, 4); } bev(0.03, 0.85, 0.03, M.wood, -0.2, 0.62, 0, sp, 0.004); solid('spin', 0.45, 1.05, FY, FY + 0.6, -5.75, -5.15); }
  O.basket = grp(POS.basket0.x, POS.basket0.y, POS.basket0.z, scene); O.basket.userData.keep = true; buildBasketMesh(O.basket);
  O.sewing = grp(POS.sewing.x, FY + 0.842, -6.02, scene); O.sewing.userData.keep = true;
  { const t = lathe([[0, 0], [0.08, 0], [0.08, 0.05]], M.tin, 0, 0, 0, O.sewing, 18); const lid = lathe([[0, 0.055], [0.083, 0.052], [0.083, 0.04]], std({ color: 0x3a5a7a, roughness: 0.4, metalness: 0.6 }), 0, 0, 0, O.sewing, 18); O.spool = grp(0.04, 0.055, 0.02, O.sewing); const sp = cyl(0.016, 0.016, 0.03, std({ color: 0xc01810, roughness: 0.8 }), 0, 0.015, 0, O.spool, 10); O.spool.rotation.z = Math.PI / 2; }
  // rag runners on the floor
  for (const [x, z, w, d, ry] of [[3.0, -4.6, 0.7, 2.4, 0], [5.05, -0.75, 0.62, 1.1, 0], [4.5, -2.4, 0.55, 1.2, 0]]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.rug); r.rotation.x = -Math.PI / 2; r.rotation.z = ry; r.position.set(x, FY + 0.003, z); r.receiveShadow = true; F.add(r); }
  // a geranium that died on the sill when the house was emptied
  { const gp = grp(4.75, FY + 0.86, -6.02, F); lathe([[0, 0], [0.05, 0], [0.065, 0.1], [0.07, 0.105]], M.clay, 0, 0, 0, gp, 14); for (let i = 0; i < 6; i++) { const a = i; pole([0, 0.09, 0], [Math.cos(a) * 0.08, 0.2 + hash1(i) * 0.08, Math.sin(a) * 0.06], 0.004, std({ color: 0x4a3a20, roughness: 1 }), gp, 4); } }
  // your bag by the bed
  { const bg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), std({ color: 0x4a4a32, roughness: 1 })); bg.scale.set(1, 1.1, 0.7); bg.position.set(4.55, FY + 0.2, -3.4); bg.castShadow = true; F.add(bg); O.bag = bg; }
}
function buildBasketMesh(par) {
  // Babushka's birch-bark basket: a stitched oval with a bentwood handle
  const b = grp(0, 0, 0, par);
  const g = new THREE.CylinderGeometry(0.19, 0.16, 0.24, 20, 1, true); g.scale(1.25, 1, 0.85); uvScale(g, 2, 0.5);
  const side = new THREE.Mesh(g, M.birch); side.position.y = 0.12; side.material = M.birch; b.add(side);
  const inn = new THREE.Mesh(g.clone(), std({ color: 0x8a6a42, roughness: 1, side: THREE.BackSide, map: T.bast })); inn.position.y = 0.12; inn.scale.setScalar(0.98); b.add(inn);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18), std({ color: 0x7a5a36, roughness: 1 })); bot.scale.set(1.25, 0.85, 1); bot.rotation.x = -Math.PI / 2; bot.position.y = 0.01; b.add(bot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 24), M.wood); rim.scale.set(1.25, 0.85, 1); rim.rotation.x = Math.PI / 2; rim.position.y = 0.24; b.add(rim);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 20, Math.PI), M.wood); hd.position.y = 0.24; b.add(hd);
  b.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  // what goes in it, hidden until it does
  const shoe = grp(-0.06, 0.06, 0, b); buildLaptiMesh(shoe, 0.8); shoe.rotation.y = 0.3; shoe.visible = false;
  const pot = grp(0.1, 0.02, 0, b); lathe([[0, 0], [0.06, 0.004], [0.08, 0.045], [0.083, 0.09], [0.07, 0.135], [0.062, 0.15], [0.07, 0.162]], M.clay, 0, 0, 0, pot, 16); lathe([[0, 0.04], [0.03, 0.035], [0.072, 0.008], [0.074, 0]], M.clay, 0, 0.16, 0, pot, 14); pot.visible = false;
  par.userData.shoe = shoe; par.userData.pot = pot;
  return b;
}
function buildLaptiMesh(par, s = 1, red = false) {
  // a bast shoe: a woven boat-shaped sole and toe, open at the top, with a red woollen tie if it's hers
  const g = new THREE.SphereGeometry(0.1, 16, 10, 0, TAU, 0.45 * Math.PI, 0.55 * Math.PI); g.scale(0.75, 0.75, 1.5); uvScale(g, 2, 1);
  const m = new THREE.Mesh(g, M.bast); m.scale.setScalar(s); m.position.y = 0.075 * s; m.castShadow = true; par.add(m);
  const m2 = new THREE.Mesh(g, std({ color: 0x5a4428, roughness: 1, side: THREE.BackSide })); m2.scale.setScalar(s * 0.97); m2.position.y = 0.075 * s; par.add(m2);
  const sole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 14), M.bast); sole.scale.set(s, s * 1.5, 1); sole.rotation.x = -Math.PI / 2; sole.position.y = 0.002; par.add(sole);
  if (red) { for (const d of [-1, 1]) { const t = tube([[d * 0.05 * s, 0.07 * s, 0.02 * s], [d * 0.08 * s, 0.03 * s, 0.06 * s], [d * 0.06 * s, -0.02 * s, 0.12 * s], [d * 0.03 * s, -0.08 * s, 0.14 * s]], 0.005 * s, std({ color: 0xb01a14, roughness: 0.9 }), par, 10, 5); } const loop = new THREE.Mesh(new THREE.TorusGeometry(0.06 * s, 0.005 * s, 5, 14), std({ color: 0xb01a14, roughness: 0.9 })); loop.rotation.x = Math.PI / 2; loop.position.y = 0.07 * s; loop.scale.set(1, 1.4, 1); par.add(loop); }
  return par;
}

/* ---------------- the seni ---------------- */
function buildSeni() {
  O.seni = grp(); const g = O.seni;
  // the bench along the west wall, Grandfather's tool tray on it
  bev(0.45, 0.05, 2.1, M.board, 0.27, FY + 0.45, 1.55, g, 0.008); for (const z of [0.6, 2.5]) bev(0.4, 0.44, 0.05, M.board, 0.27, FY + 0.22, z, g, 0.006);
  solid('sBench', 0.05, 0.5, FY, FY + 0.47, 0.5, 2.6);
  O.toolbox = grp(POS.toolbox.x, POS.toolbox.y, POS.toolbox.z, scene); O.toolbox.userData.keep = true;
  { const tb = O.toolbox; bev(0.3, 0.12, 0.55, M.wood, 0, 0.06, 0, tb, 0.006); bev(0.02, 0.28, 0.55, M.wood, 0, 0.14, 0, tb, 0.004); pole([0, 0.28, -0.25], [0, 0.28, 0.25], 0.012, M.wood, tb, 6);
    O.tools = grp(0, 0.12, 0, tb); const mal = grp(0.08, 0, -0.08, O.tools); cyl(0.04, 0.04, 0.12, M.woodDark, 0, 0.03, 0, mal, 10).rotation.z = Math.PI / 2; pole([0, 0.03, 0], [0, 0.03, 0.22], 0.01, M.wood, mal, 6); const ci = grp(-0.08, 0.02, 0.05, O.tools); mbox(0.02, 0.012, 0.18, M.iron, 0, 0, 0, ci, 1); mbox(0.04, 0.012, 0.03, M.iron, 0, 0, -0.1, ci, 1);
    for (let i = 0; i < 6; i++) mbox(0.004, 0.004, 0.06, M.iron, -0.02 + (i % 3) * 0.02, 0.01, 0.15 + Math.floor(i / 3) * 0.02, tb, 1); }
  // the ladder up to the attic hatch
  O.seniLadder = grp(2.85, FY, 2.62, scene); O.seniLadder.userData.keep = true;
  { const top = new THREE.Vector3(0, CEIL - FY + 0.05, HATCH.z1 - 2.62 + 0.02); for (const s of [-1, 1]) pole([s * 0.22, 0, 0], [s * 0.22, top.y, top.z], 0.025, M.board, O.seniLadder, 6); for (let i = 1; i < 9; i++) { const k = i / 9; pole([-0.22, top.y * k, top.z * k], [0.22, top.y * k, top.z * k], 0.016, M.board, O.seniLadder, 5); } }
  solid('sLadder', 2.55, 3.15, FY, FY + 1.4, 2.35, 2.75);
  // the hatch itself, seen from below
  O.hatch = grp(HATCH.x0, CEIL, HATCH.z0, scene); O.hatch.userData.keep = true; bev(HATCH.x1 - HATCH.x0, 0.05, HATCH.z1 - HATCH.z0, M.board, (HATCH.x1 - HATCH.x0) / 2, 0.06, (HATCH.z1 - HATCH.z0) / 2, O.hatch, 0.004);
  O.hatchBolt = grp(HATCH.x1 - 0.12, AF + 0.03, (HATCH.z0 + HATCH.z1) / 2, scene); O.hatchBolt.userData.keep = true; mbox(0.18, 0.025, 0.04, M.iron, 0, 0, 0, O.hatchBolt, 1); mbox(0.04, 0.05, 0.04, M.iron, 0.06, 0.02, 0, O.hatchBolt, 1);
  // the water barrel, buckets, brooms, a sack, felt boots, the yoke on the wall, an axe
  lathe([[0, 0], [0.3, 0], [0.33, 0.35], [0.31, 0.75], [0.32, 0.76]], M.board, 5.45, FY, 2.38, g, 22); for (const yy of [0.15, 0.6]) { const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.012, 6, 24), M.iron); hoop.rotation.x = Math.PI / 2; hoop.position.set(5.45, FY + yy, 2.38); g.add(hoop); }
  { const lid = cyl(0.33, 0.33, 0.03, M.board, 5.45, FY + 0.78, 2.38, g, 20); } solid('sBarrel', 5.1, 5.8, FY, FY + 0.8, 2.03, 2.73);
  const enamel = std({ color: 0xd8d4c8, roughness: 0.35 });
  for (const [x, z] of [[4.6, 2.55], [4.95, 2.6]]) { lathe([[0, 0], [0.11, 0], [0.14, 0.26], [0.145, 0.27]], enamel, x, FY, z, g, 18); const h = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.004, 4, 16, Math.PI), M.iron); h.position.set(x, FY + 0.27, z); g.add(h); }
  for (let i = 0; i < 3; i++) { const bm = grp(5.85, FY, 0.55 + i * 0.12, g); pole([0, 0, 0], [-0.05, 1.3, 0.02], 0.012, M.wood, bm, 5); const br = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8, 1, true), M.hay); br.position.set(0, 0.2, 0); br.rotation.x = Math.PI; bm.add(br); }
  { const sk = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), std({ color: 0x8a7a5a, roughness: 1 })); sk.scale.set(1, 1.2, 0.8); sk.position.set(4.0, FY + 0.32, 2.5); sk.castShadow = true; g.add(sk); solid('sSack', 3.7, 4.3, FY, FY + 0.6, 2.25, 2.75); }
  for (let i = 0; i < 2; i++) { const b = grp(1.2 + i * 0.16, FY, 0.5, g); mbox(0.11, 0.48, 0.12, std({ color: 0x2a2826, roughness: 1 }), 0, 0.24, 0, b, 1); mbox(0.11, 0.1, 0.24, std({ color: 0x2a2826, roughness: 1 }), 0, 0.05, 0.08, b, 1); }
  { const y = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 6, 20, Math.PI * 0.7), M.wood); y.position.set(3.6, FY + 1.3, 0.28); y.rotation.z = Math.PI * 0.15 + Math.PI; g.add(y); }
  { const ax = grp(5.7, FY, 1.0, g); pole([0, 0, 0], [0.05, 0.62, 0.05], 0.018, M.wood, ax, 6); mbox(0.04, 0.12, 0.16, M.iron, 0.05, 0.62, 0.1, ax, 1); }
  // coats on pegs on the seni side of the partition
  for (let i = 0; i < 2; i++) { const c = lathe([[0.02, 0.0], [0.16, -0.05], [0.24, -0.3], [0.26, -1.0], [0.24, -1.05]], std({ color: i ? 0x5a4a3a : 0x3a3430, roughness: 1, map: T.fur }), 1.4 + i * 0.6, FY + 1.85, 0.42, g, 14); c.scale.z = 0.5; }
  // a single bulb on a flex, dead: they cut the island off in August
  { pole([3, CEIL, 1.0], [3, CEIL - 0.45, 1.0], 0.004, std({ color: 0x1a1a1a, roughness: 0.6 }), g, 4); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), phys({ color: 0xddddcc, roughness: 0.1, transparent: true, opacity: 0.5 })); bulb.position.set(3, CEIL - 0.49, 1.0); g.add(bulb); }
  // the porch door, standing open against the wall outside
  { const d = grp(6.25, FY, DOOR_P.z1, scene); const leaf = bev(0.05, 1.9, 0.9, M.board, 0.03, 0.95, -0.45, d, 0.006); d.rotation.y = -Math.PI / 2 - 0.25; for (const y of [0.3, 1.6]) mbox(0.02, 0.06, 0.85, M.iron, 0.06, y, -0.45, d, 1); }
  // the door between the izba and the seni, open into the seni
  { const d = grp(DOOR_I.x1, FY, 0.25, scene); const leaf = bev(0.9, 1.84, 0.06, M.woodDark, -0.45, 0.92, 0.03, d, 0.008); d.rotation.y = -1.25; O.izbaDoor = d; d.userData.keep = true; }
}

/* ---------------- the cellar ---------------- */
function buildCellar() {
  O.cellar = grp(); const g = O.cellar;
  // walls of earth held back by old boards, the floor of beaten earth
  { const fl = new THREE.PlaneGeometry(CELL.x1 - CELL.x0, CELL.z1 - CELL.z0); fl.rotateX(-Math.PI / 2); uvScale(fl, 2, 2); const m = new THREE.Mesh(fl, M.earth); m.position.set((CELL.x0 + CELL.x1) / 2, CY, (CELL.z0 + CELL.z1) / 2); m.receiveShadow = true; g.add(m); }
  for (const [axis, line, a0, a1, sg] of [['x', CELL.z0, CELL.x0, CELL.x1, 1], ['x', CELL.z1, CELL.x0, CELL.x1, -1], ['z', CELL.x0, CELL.z0, CELL.z1, 1], ['z', CELL.x1, CELL.z0, CELL.z1, -1]]) {
    const len = a1 - a0, h = FY - CY; const w = new THREE.PlaneGeometry(len, h); uvScale(w, len / 1.5, h / 1.5); const m = new THREE.Mesh(w, M.earth);
    if (axis === 'x') { m.position.set((a0 + a1) / 2, (CY + FY) / 2, line); m.rotation.y = sg > 0 ? 0 : Math.PI; } else { m.position.set(line, (CY + FY) / 2, (a0 + a1) / 2); m.rotation.y = sg > 0 ? Math.PI / 2 : -Math.PI / 2; }
    m.receiveShadow = true; g.add(m);
    for (let i = 0; i < 3; i++) { const bh = 0.22, y = CY + 0.2 + i * 0.42; const b = mbox(axis === 'x' ? len : 0.04, bh, axis === 'x' ? 0.04 : len, M.boardDark, 0, 0, 0, g, 1); if (axis === 'x') b.position.set((a0 + a1) / 2, y, line + sg * 0.03); else b.position.set(line + sg * 0.03, y, (a0 + a1) / 2); }
  }
  // the stove's foundation: rough brick and stone, going down through the cellar
  mbox(2.0, FY - CY, 2.45, std({ color: 0x6a3a2a, roughness: 0.95, map: T.earth }), 1.0, (CY + FY) / 2, -1.22, g, 0.6);
  // potato bins, a shelf of jars, barrels of cabbage
  for (let i = 0; i < 2; i++) { const x = 0.95 + i * 1.15; for (const [w, d, dx, dz] of [[1.05, 0.04, 0, 0.45], [0.04, 0.9, -0.52, 0], [0.04, 0.9, 0.52, 0]]) mbox(w, 0.7, d, M.boardDark, x + dx, CY + 0.35, -5.15 + dz, g, 1); for (let k = 0; k < 18; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), std({ color: 0x8a6a42, roughness: 1 })); p.scale.set(1.2, 0.9, 1); p.position.set(x + (hash1(k + i * 30) - 0.5) * 0.9, CY + 0.38 + hash1(k * 3) * 0.12, -5.15 + (hash1(k * 7 + i) - 0.5) * 0.8); g.add(p); } }
  solid('bins', 0.4, 2.6, CY, CY + 0.7, -5.65, -4.65);
  bev(0.3, 0.03, 2.8, M.boardDark, 5.52, CY + 0.95, -4.0, g, 0.004); bev(0.3, 0.03, 2.8, M.boardDark, 5.52, CY + 0.5, -4.0, g, 0.004);
  const jarG = [0x3a5a2a, 0x7a3a1a, 0x5a6a3a, 0x8a6a2a];
  for (let i = 0; i < 14; i++) { const j = lathe([[0, 0], [0.055, 0], [0.06, 0.02], [0.06, 0.15], [0.045, 0.18], [0.045, 0.2]], phys({ color: jarG[i % 4], roughness: 0.15, transparent: true, opacity: 0.75 }), 5.5 + (i % 2) * 0.08, CY + (i < 7 ? 0.52 : 0.97), -5.2 + (i % 7) * 0.38, g, 12); }
  solid('shelfC', 5.35, 5.7, CY, CY + 1.0, -5.45, -2.55);
  for (const [x, z] of [[4.75, -1.0], [5.15, -1.7]]) { lathe([[0, 0], [0.24, 0], [0.27, 0.3], [0.25, 0.6], [0.26, 0.61]], M.boardDark, x, CY, z, g, 18); for (const yy of [0.1, 0.5]) { const hp = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.01, 6, 20), M.iron); hp.rotation.x = Math.PI / 2; hp.position.set(x, CY + yy, z); g.add(hp); } solid('cBarrel', x - 0.27, x + 0.27, CY, CY + 0.62, z - 0.27, z + 0.27); }
  O.barrelHide = new THREE.Vector3(5.15, CY + 0.45, -1.7);
  // the ladder down from the hatch
  for (const s of [-1, 1]) pole([3.0 + s * 0.2, CY, -2.0], [3.0 + s * 0.2, FY - 0.05, -2.45], 0.022, M.boardDark, g, 6);
  for (let i = 1; i < 6; i++) { const k = i / 6; pole([2.8, CY + (FY - CY) * k, -2.0 - 0.45 * k], [3.2, CY + (FY - CY) * k, -2.0 - 0.45 * k], 0.014, M.boardDark, g, 5); }
  // his nest against the warm foundation: straw, rags, and the things he took
  O.nest = grp(POS.nest.x, CY, POS.nest.z, scene); O.nest.userData.keep = true;
  { const n = O.nest; const st = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 8, 0, TAU, 0, Math.PI / 2), M.hay); st.scale.set(1, 0.32, 0.8); n.add(st); st.receiveShadow = true;
    const rag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3, 4, 4), std({ color: 0x6a3a3a, roughness: 1, side: THREE.DoubleSide })); rag.rotation.x = -Math.PI / 2 + 0.2; rag.position.set(0.1, 0.1, 0.05); n.add(rag);
    for (let i = 0; i < 4; i++) { const sp = grp(-0.15 + i * 0.07, 0.12, -0.1 + (i % 2) * 0.05, n); pole([0, 0, 0], [0.11, 0, 0.03], 0.004, M.tin, sp, 4); const bw = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.tin); bw.scale.set(1.3, 0.4, 1); bw.position.set(0.13, 0, 0.035); sp.add(bw); sp.rotation.y = i * 0.8; }
    const th = cyl(0.008, 0.007, 0.016, M.brass, 0.18, 0.13, 0.08, n, 8);
    const gl = grp(0.0, 0.135, 0.15, n); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.002, 4, 14), M.iron); r.position.x = s * 0.028; gl.add(r); } gl.rotation.x = -Math.PI / 2;
    const sol = grp(-0.2, 0.13, 0.12, n); cyl(0.006, 0.007, 0.035, std({ color: 0x3a5a3a, roughness: 0.5, metalness: 0.5 }), 0, 0.017, 0, sol, 6); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 5), std({ color: 0xd8b088, roughness: 0.5 })); hd.position.y = 0.04; sol.add(hd); sol.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const b = cyl(0.007, 0.007, 0.003, std({ color: [0x8a2a2a, 0xd8d0b8, 0x1a1a1a, 0x3a5a8a, 0xc8a040][i], roughness: 0.4 }), -0.1 + hash1(i) * 0.25, 0.125, -0.15 + hash1(i * 3) * 0.2, n, 8); } }
  // the second oar, lying across the cellar floor
  O.oar2 = grp(POS.oar2.x, POS.oar2.y, POS.oar2.z, scene); O.oar2.userData.keep = true; buildOarMesh(O.oar2); O.oar2.rotation.set(0, Math.PI / 2, Math.PI / 2);
}
function buildOarMesh(par) {
  // a spruce oar: round loom, flat blade, worn grip
  const o = grp(0, 0, 0, par);
  cyl(0.024, 0.026, 1.7, M.wood, 0, 0.85, 0, o, 8);
  { const g = new THREE.BoxGeometry(0.14, 0.62, 0.018); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (0.55 + 0.45 * clamp((0.31 - y) / 0.62 + 0.3, 0, 1))); } g.computeVertexNormals(); const b = new THREE.Mesh(g, M.wood); b.position.y = 1.95; b.castShadow = true; o.add(b); b.position.y = -0.3; }
  cyl(0.022, 0.022, 0.18, M.woodDark, 0, 1.78, 0, o, 8);
  o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return o;
}

/* ---------------- the attic ---------------- */
function buildAttic() {
  O.attic = grp(); const g = O.attic;
  // the pole under the ridge where the old shoes and herbs hang
  pole([3.0, AF + 1.62, -3.6], [3.0, AF + 1.62, 0.4], 0.035, M.logIn, g, 8);
  O.shoes = [];
  const zs = [-3.2, -2.8, -2.4, -2.0, -1.6, -1.2, -0.8, -0.4];
  zs.forEach((z, i) => {
    const s = grp(3.0 + (i % 2 ? 0.05 : -0.05), AF + 1.55, z, scene); s.userData.keep = true;
    const hang = grp(0, 0, 0, s); const shoe = grp(0, -0.42, 0, hang); buildLaptiMesh(shoe, 1.0, i === 4); shoe.rotation.set(-Math.PI / 2 + 0.2, 0, 0);
    pole([0, 0, 0], [0, -0.3, 0], 0.003, M.rope, hang, 3); hang.rotation.y = hash1(i) * 1.2; hang.rotation.z = (hash1(i * 3) - 0.5) * 0.1;
    O.shoes.push(s);
  });
  // bundles of herbs and birch brooms hanging between
  for (const [z, kind] of [[-3.4, 0], [-2.6, 1], [-1.0, 0], [0.0, 1], [0.25, 0]]) { const b = grp(2.95, AF + 1.6, z, g); pole([0, 0, 0], [0, -0.15, 0], 0.003, M.rope, b, 3); const c = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 8, 1, true), kind ? std({ color: 0x5a4a2a, roughness: 1, map: T.hay, side: THREE.DoubleSide }) : std({ color: 0x5a6a3a, roughness: 1, map: T.hay, side: THREE.DoubleSide })); c.position.y = -0.4; b.add(c); }
  // a trunk, a broken spinning wheel, an old horse collar, a sieve on a nail
  { const tr = grp(4.2, AF, -4.2, g); bev(0.8, 0.45, 0.5, std({ map: T.plank, color: 0x4a3a2a, roughness: 0.8 }), 0, 0.225, 0, tr, 0.01); for (const x of [-0.3, 0.3]) mbox(0.04, 0.47, 0.52, M.iron, x, 0.23, 0, tr, 1); solid('trunk', 3.8, 4.6, AF, AF + 0.45, -4.45, -3.95); }
  { const kh = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 8, 18), std({ color: 0x2a1a12, roughness: 0.6 })); kh.scale.set(0.8, 1.15, 1); kh.position.set(1.95, AF + 0.6, -3.0); kh.rotation.y = 1.2; kh.rotation.z = 0.25; g.add(kh); }
  { const sv = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 20), M.wood); sv.position.set(4.15, AF + 0.7, -1.6); sv.rotation.y = Math.PI / 2 - 0.4; sv.rotation.x = 0.3; g.add(sv); }
  { const wh = grp(2.0, AF, 0.9, g); wh.rotation.z = 1.2; wh.position.y = AF + 0.25; const t = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 6, 28, 4.5), M.wood); wh.add(t); }
  // the chimney going up through the attic, brick here
  mbox(CHIM.x1 - CHIM.x0, roofY(0.9) - AF, CHIM.z1 - CHIM.z0, std({ color: 0x7a3e2c, roughness: 0.95, map: T.earth }), (CHIM.x0 + CHIM.x1) / 2, (AF + roofY(0.9)) / 2, (CHIM.z0 + CHIM.z1) / 2, g, 0.5);
  // little footprints in the dust, from the hatch to the shoes
  decal(0.5, 3.6, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); for (let i = 0; i < 16; i++) { const y = 40 + i * (H2 - 80) / 16, x = W2 / 2 + (i % 2 ? 22 : -22); c.fillStyle = 'rgba(30,24,18,.55)'; c.beginPath(); c.ellipse(x, y, 9, 16, 0, 0, TAU); c.fill(); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 8 + k * 5.5, y - 20, 3, 0, TAU); c.fill(); } } }, 3.12, AF + 0.006, -0.2, 0, g, 128, -Math.PI / 2);
}
