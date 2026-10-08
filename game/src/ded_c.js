/* =====================================================================
   DEDUSHKA · part C: outside. The yard with its plank fence and nailed-up gates, the barn and
   the woodpile, the well sweep, the dug-over garden, the bank, the landing and Grandfather's
   boat; the black river and the far shore; the lane and the neighbours' houses, burning one by
   one. Fire, smoke and sparks. The cat, Dedushka himself, a hand in the dark. The lights.
   ===================================================================== */

/* ---------------- the ground ---------------- */
function buildGround() {
  O.out = grp(); const g = O.out;
  { const W2 = 170, D2 = 100, sx = 136, sz = 120; const geo = new THREE.PlaneGeometry(W2, D2, sx, sz); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -16);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundY(x, z) - (z > 26 ? 0.02 : 0)); uv.setXY(i, x / 3, z / 3); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M.grass); m.receiveShadow = true; g.add(m); O.groundMesh = m; }
  // the shingle at the water's edge
  { const geo = new THREE.PlaneGeometry(60, 5, 60, 10); geo.rotateX(-Math.PI / 2); geo.translate(9, 0, 27.0); const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, groundY(x, z) + 0.012); uv.setXY(i, x / 2, z / 2); } geo.computeVertexNormals(); const m = new THREE.Mesh(geo, M.shingle); m.receiveShadow = true; g.add(m); }
  // the lane: wheel ruts in mud
  { const geo = new THREE.PlaneGeometry(170, 7, 80, 4); geo.rotateX(-Math.PI / 2); geo.translate(0, 0.015, -11.2); uvScale(geo, 170 / 2.5, 7 / 2.5); const m = new THREE.Mesh(geo, std({ map: T.earth, normalMap: T.earthN, color: 0x8a7a68, roughness: 1 })); m.receiveShadow = true; g.add(m); }
  // trodden paths in the yard: porch to barn, to the woodpile, down to the landing
  for (const [x0, z0, x1, z1, w] of [[8.4, 1.5, 15, -0.4, 1.2], [8.4, 1.5, 14, 4.5, 1.0], [9.5, 6, 9.2, 25.5, 1.1], [8.4, 1.5, 3.0, 4.2, 0.9]]) { const len = Math.hypot(x1 - x0, z1 - z0); const geo = new THREE.PlaneGeometry(w, len, 2, Math.ceil(len)); geo.rotateX(-Math.PI / 2); uvScale(geo, w / 2, len / 2); const p = geo.attributes.position; const m = new THREE.Mesh(geo, std({ map: T.earth, normalMap: T.earthN, color: 0x9a8a72, roughness: 1, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })); m.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); m.rotation.y = Math.atan2(x1 - x0, z1 - z0); for (let i = 0; i < p.count; i++) { const wx = m.position.x + p.getX(i) * Math.cos(m.rotation.y) + p.getZ(i) * Math.sin(m.rotation.y), wz = m.position.z - p.getX(i) * Math.sin(m.rotation.y) + p.getZ(i) * Math.cos(m.rotation.y); p.setY(i, groundY(wx, wz) + 0.01); } geo.computeVertexNormals(); m.receiveShadow = true; m.userData.noRay = true; g.add(m); }
  // solids for the ground: flat in the yard, stepped strips down the bank (not under the house's cellar)
  solid('gW', -40, OUT.x0, -5, 0, -30, 21); solid('gE', OUT.x1, 40, -5, 0, -30, 21); solid('gN', OUT.x0, OUT.x1, -5, 0, -30, OUT.z0); solid('gS', OUT.x0, OUT.x1, -5, 0, OUT.z1, 21);
  for (let z = 21; z < 31; z += 0.25) solid('bank', -40, 40, -6, groundY(9, z + 0.125), z, z + 0.25);
  // the river
  { const geo = new THREE.PlaneGeometry(800, 400, 1, 1); geo.rotateX(-Math.PI / 2); geo.translate(0, WATER_Y, 27 + 200); const m = new THREE.Mesh(geo, M.water); m.receiveShadow = false; m.userData.noRay = true; scene.add(m); O.river = m; }
  // the far shore: a low black line of taiga, half a kilometre off
  { const pts = []; for (let i = 0; i <= 200; i++) { const x = -900 + i * 9; pts.push(x, 6 + fbm(i * 0.15, 3) * 16 + (hash1(i) > 0.7 ? hash1(i * 3) * 6 : 0)); }
    const sh = new THREE.Shape(); sh.moveTo(-900, -2); for (let i = 0; i < pts.length; i += 2) sh.lineTo(pts[i], pts[i + 1]); sh.lineTo(900, -2); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), std({ color: 0x040506, roughness: 1, fog: false })); m.position.set(0, WATER_Y, 330); m.scale.set(0.45, 0.6, 1); m.rotation.y = Math.PI; m.userData.noRay = true; scene.add(m); }
  // the sky
  { const sg = new THREE.SphereGeometry(380, 40, 20, 0, TAU, 0, Math.PI * 0.55); const sm = new THREE.MeshBasicMaterial({ map: T.sky, side: THREE.BackSide, fog: false, depthWrite: false, color: 0xffffff }); const sky = new THREE.Mesh(sg, sm); sky.userData.noRay = true; sky.userData.noEnv = false; sky.layers.set(1); scene.add(sky); O.sky = sky; O.skyMat = sm; }
}

/* ---------------- fences and gates ---------------- */
function buildFences() {
  O.fences = grp(); const g = O.fences;
  const parts = [];
  // a run of vertical boards between two points, with posts and two rails behind
  const run = (x0, z0, x1, z1, h = 1.9, gap = 0.03, skip = null) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0), n = Math.floor(len / (0.13 + gap));
    for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k; if (skip && skip(x, z)) continue; const hh = h + (hash1(i + x0 * 7) - 0.5) * 0.12 - (hash1(i * 3 + z0) > 0.93 ? 0.4 : 0); const y0 = Math.max(groundY(x, z), -1.5); const b = new THREE.BoxGeometry(0.13, hh, 0.025); uvScale(b, 0.13 / 0.5, hh / 2); parts.push({ geo: b, m: m4(x, y0 + hh / 2 - 0.05, z, 0, -ang + (hash1(i) - 0.5) * 0.04, (hash1(i * 5) - 0.5) * 0.03) }); }
    const np = Math.ceil(len / 2.4); for (let i = 0; i <= np; i++) { const k = i / np, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k, y0 = Math.max(groundY(x, z), -1.5); parts.push({ geo: new THREE.CylinderGeometry(0.06, 0.07, h + 0.1, 7), m: m4(x - Math.sin(ang) * 0.06, y0 + (h + 0.1) / 2 - 0.1, z + Math.cos(ang) * 0.06) }); }
    for (const yy of [0.35, h - 0.35]) { const b = new THREE.BoxGeometry(len, 0.08, 0.05); uvScale(b, len / 1.5, 0.1); const y0 = Math.max(groundY((x0 + x1) / 2, (z0 + z1) / 2), -1.5); parts.push({ geo: b, m: m4((x0 + x1) / 2 - Math.sin(ang) * 0.05, y0 + yy, (z0 + z1) / 2 + Math.cos(ang) * 0.05, 0, -ang, 0) }); }
  };
  const gateGap = (x, z) => x > 9.0 && x < 12.8 && z < -7.0;
  run(OUT.x1, FENCE.n, FENCE.e, FENCE.n, 1.95, 0.025, gateGap);
  run(OUT.x1, OUT.z0, OUT.x1, FENCE.n, 1.95);
  run(FENCE.e, FENCE.n, FENCE.e, 26.6, 1.9);
  run(FENCE.w, OUT.z1, FENCE.w, 26.6, 1.9);
  run(FENCE.w, OUT.z1, OUT.x0, OUT.z1, 1.9);
  // a low picket palisade along the front of the house, onto the lane
  for (let x = -2.4; x < 6.3; x += 0.16) { const b = new THREE.BoxGeometry(0.07, 1.1, 0.02); parts.push({ geo: b, m: m4(x, 0.5, -7.35) }); }
  { const b = new THREE.BoxGeometry(8.7, 0.06, 0.04); parts.push({ geo: b, m: m4(1.95, 0.85, -7.32) }); }
  const fm = new THREE.Mesh(mergeParts(parts.map(p => ({ geo: p.geo, m: p.m, color: 0xffffff }))), M.board); fm.castShadow = true; fm.receiveShadow = true; fm.userData.noRay = true; g.add(fm);
  // the big gates onto the lane, under their little roof: nailed shut with planks and marked with a cross
  { const gt = grp(10.9, 0, FENCE.n, scene);
    for (const s of [-1, 1]) { const leaf = grp(s * 0.9, 0, 0, gt); for (let i = 0; i < 12; i++) bev(0.14, 2.1, 0.04, M.board, -0.82 + i * 0.15, 1.1, 0, leaf, 0.006); for (const yy of [0.4, 1.8]) bev(1.75, 0.12, 0.05, M.boardDark, 0, yy, 0.04, leaf, 0.006); }
    for (const s of [-1, 1]) cyl(0.12, 0.13, 2.9, M.logOut, s * 1.95, 1.45, 0, gt, 10);
    bev(4.4, 0.12, 0.6, M.boardDark, 0, 2.9, 0, gt, 0.01); const rr = bev(4.4, 0.04, 0.8, M.roof, 0, 3.05, 0, gt, 0.008);
    for (const [ry] of [[0.35], [-0.35]]) { const p = bev(2.9, 0.18, 0.05, M.board, 0, 1.15, 0.09, gt, 0.008); p.rotation.z = ry; }
    decal(1.5, 1.2, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.strokeStyle = 'rgba(236,236,226,.85)'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(30, 30); c.lineTo(W2 - 30, H2 - 30); c.moveTo(W2 - 30, 30); c.lineTo(30, H2 - 30); c.stroke(); c.fillStyle = 'rgba(236,236,226,.9)'; c.font = 'bold 70px "Russo One", Impact, sans-serif'; c.fillText('14', W2 * 0.62, H2 * 0.4); }, 0, 1.3, 0.04, 0, gt, 256);
    O.gates = gt; }
  // fence solids
  solid('fN1', OUT.x1, 8.95, -1, 2.2, FENCE.n - 0.1, FENCE.n + 0.1); solid('fN2', 12.85, FENCE.e, -1, 2.2, FENCE.n - 0.1, FENCE.n + 0.1); solid('fGate', 8.95, 12.85, -1, 2.6, FENCE.n - 0.12, FENCE.n + 0.12);
  solid('fNE', OUT.x1 - 0.05, OUT.x1 + 0.1, -1, 2.2, FENCE.n, OUT.z0);
  solid('fE', FENCE.e - 0.1, FENCE.e + 0.1, -2, 2.2, FENCE.n, 27.5); solid('fW', FENCE.w - 0.1, FENCE.w + 0.1, -2, 2.2, OUT.z1, 27.5); solid('fSW', FENCE.w, OUT.x0, -1, 2.2, OUT.z1 - 0.05, OUT.z1 + 0.1);
}

/* ---------------- the porch ---------------- */
function buildPorch() {
  const g = grp(); O.porch = g;
  bev(PORCH.x1 - PORCH.x0, 0.06, PORCH.z1 - PORCH.z0, M.board, (PORCH.x0 + PORCH.x1) / 2, FY - 0.03, (PORCH.z0 + PORCH.z1) / 2, g, 0.006);
  for (const [x, z] of [[6.4, 0.65], [7.6, 0.65], [6.4, 2.25], [7.6, 2.25]]) cyl(0.08, 0.08, FY, M.logOut, x, FY / 2, z, g, 8);
  for (let i = 0; i < 3; i++) { const y = FY - (i + 1) * 0.233; bev(0.3, 0.05, 1.5, M.board, PORCH.x1 + 0.15 + i * 0.28, y - 0.025 + 0.05, 1.45, g, 0.006); mbox(0.3, y, 1.5, M.boardDark, PORCH.x1 + 0.15 + i * 0.28, y / 2, 1.45, g, 1); }
  // the rail and the little roof on two carved posts
  for (const z of [PORCH.z0 + 0.05]) { pole([PORCH.x0, FY + 0.9, z], [PORCH.x1, FY + 0.9, z], 0.03, M.board, g, 6); for (let x = PORCH.x0 + 0.15; x < PORCH.x1; x += 0.18) bev(0.06, 0.88, 0.025, M.blue, x, FY + 0.45, z, g, 0.006); }
  for (const z of [PORCH.z0 + 0.05, PORCH.z1 - 0.05]) cyl(0.06, 0.06, 2.3, M.boardDark, PORCH.x1 - 0.05, FY + 1.15, z, g, 8);
  { const r = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 2.3), M.roof); r.position.set(7.05, FY + 2.42, 1.45); r.rotation.z = -0.35; r.castShadow = true; g.add(r); }
  solid('porch', PORCH.x0, PORCH.x1, -1, FY, PORCH.z0, PORCH.z1);
  for (let i = 0; i < 3; i++) solid('pstep', PORCH.x1 + i * 0.28, PORCH.x1 + 0.28 + i * 0.28, -1, FY - (i + 1) * 0.233, 0.7, 2.2);
  solid('prail', PORCH.x0, PORCH.x1, FY, FY + 1.0, PORCH.z0, PORCH.z0 + 0.1);
}

/* ---------------- the barn, the woodpile, the chopping block ---------------- */
function buildBarn() {
  O.barn = grp(); const g = O.barn; const B = BARN;
  const wallH = (x) => lerp(3.2, 2.7, (x - B.x0) / (B.x1 - B.x0));
  const boards = (x0, z0, x1, z1, h0, h1, skip) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(len / 0.2), ang = Math.atan2(z1 - z0, x1 - x0); for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k; if (skip && skip(z)) continue; const h = lerp(h0, h1, k); const b = mbox(0.19, h, 0.03, M.boardDark, x, h / 2, z, g, 1); b.rotation.y = -ang; } };
  boards(B.x0, B.z0, B.x1, B.z0, 3.2, 2.7); boards(B.x0, B.z1, B.x1, B.z1, 3.2, 2.7);
  boards(B.x1, B.z0, B.x1, B.z1, 2.7, 2.7);
  boards(B.x0, B.z0, B.x0, B.z1, 3.2, 3.2, z => z > BARN_DOOR.z0 && z < BARN_DOOR.z1);
  mbox(0.06, 1.0, BARN_DOOR.z1 - BARN_DOOR.z0, M.boardDark, B.x0, 2.7, (BARN_DOOR.z0 + BARN_DOOR.z1) / 2, g, 1);
  // the doors, open
  for (const [z, s] of [[BARN_DOOR.z0, -1], [BARN_DOOR.z1, 1]]) { const d = grp(B.x0 - 0.03, 0, z, g); for (let i = 0; i < 5; i++) mbox(0.03, 2.15, 0.19, M.board, 0, 1.08, -s * (0.1 + i * 0.19), d, 1); d.rotation.y = s * 1.9; }
  // the roof, one slope, and the beams inside
  { const r = new THREE.Mesh(new THREE.BoxGeometry(B.x1 - B.x0 + 0.8, 0.05, B.z1 - B.z0 + 0.8), M.roof); r.position.set((B.x0 + B.x1) / 2, 3.0, (B.z0 + B.z1) / 2); r.rotation.z = -Math.atan2(0.5, B.x1 - B.x0); r.castShadow = true; r.receiveShadow = true; g.add(r); uvScale(r.geometry, 3, 4); }
  for (const z of [-2.5, -0.5, 1.5]) mbox(B.x1 - B.x0, 0.16, 0.14, M.logIn, (B.x0 + B.x1) / 2, 2.32, z, g, 1);
  // the floor of beaten earth with straw
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(B.x1 - B.x0, B.z1 - B.z0), std({ map: T.earth, normalMap: T.earthN, color: 0x8a7a62, roughness: 1 })); f.rotation.x = -Math.PI / 2; f.position.set((B.x0 + B.x1) / 2, 0.01, (B.z0 + B.z1) / 2); f.receiveShadow = true; g.add(f); }
  // workbench, tools on the wall, hay in the corner
  bev(2.2, 0.08, 0.6, M.wood, 18.4, 0.85, B.z0 + 0.35, g, 0.01); for (const x of [17.4, 19.4]) for (const z of [B.z0 + 0.12, B.z0 + 0.58]) bev(0.07, 0.85, 0.07, M.wood, x, 0.42, z, g, 0.006);
  solid('wbench', 17.3, 19.5, 0, 0.9, B.z0, B.z0 + 0.66);
  { const saw = grp(16.6, 1.6, B.z0 + 0.04, g); mbox(0.7, 0.18, 0.004, M.tin, 0, 0, 0, saw, 1); mbox(0.12, 0.14, 0.02, M.wood, 0.4, 0.02, 0, saw, 1); }
  { const sc = grp(B.x1 - 0.05, 1.9, -2.0, g); pole([0, 0, -0.9], [0, 0, 0.9], 0.016, M.wood, sc, 6); const bl = mbox(0.004, 0.08, 0.7, M.iron, 0, -0.05, 0.9, sc, 1); bl.rotation.x = 0.3; }
  for (let i = 0; i < 3; i++) { const t = grp(B.x1 - 0.06, 1.2, 0.0 + i * 0.35, g); pole([0, -0.6, 0], [0, 0.6, 0], 0.014, M.wood, t, 6); mbox(0.02, 0.06, 0.2, M.iron, 0, 0.6, 0, t, 1); }
  { const h = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 10), M.hay); h.scale.set(1.3, 0.55, 1.1); h.position.set(18.6, 0.3, 1.8); h.receiveShadow = true; h.castShadow = true; g.add(h); solid('hay', 17.6, 19.9, 0, 0.6, 0.9, 2.9); }
  // a shelf by the door with the tar pot; the hank of oakum on a nail by the bench
  O.tar = grp(POS.tar0.x, POS.tar0.y, POS.tar0.z, scene); O.tar.userData.keep = true; buildTarPotMesh(O.tar);
  O.oakum = grp(POS.oakum.x, POS.oakum.y, POS.oakum.z, scene); O.oakum.userData.keep = true;
  { pole([0.03, 0.05, 0], [-0.03, 0.05, 0], 0.005, M.iron, O.oakum, 4); for (let i = 0; i < 9; i++) { const t = tube([[0, 0.04, 0], [(hash1(i) - 0.5) * 0.06, -0.15, (hash1(i * 3) - 0.5) * 0.04], [(hash1(i * 5) - 0.5) * 0.08, -0.35 - hash1(i * 7) * 0.1, (hash1(i * 9) - 0.5) * 0.06]], 0.012, M.oakum, O.oakum, 8, 4); } }
  // the oar up across the beams, and the two empty pegs on the wall where the other one hung
  // it lies across the first two beams (z -2.5 and -0.5), blade toward the door's line, so it shows in the gap from below
  O.oar1 = grp(POS.oar1.x, POS.oar1.y, POS.oar1.z, scene); O.oar1.userData.keep = true; buildOarMesh(O.oar1); O.oar1.rotation.set(-Math.PI / 2, 0, 0.04);
  for (const y of [1.3, 1.7]) pole([B.x0 + 0.08, y, -3.6], [B.x0 + 0.25, y + 0.02, -3.6], 0.012, M.wood, g, 5);
  O.pegHit = mbox(0.4, 0.8, 0.4, HITMAT, B.x0 + 0.2, 1.5, -3.6, scene, 1); O.pegHit.layers.set(2); O.pegHit.userData.hit = true;
  // the crate you can drag about
  O.crate = grp(POS.crate0.x, 0, POS.crate0.z, scene); O.crate.userData.keep = true;
  { const c = O.crate; for (let i = 0; i < 4; i++) { bev(0.6, 0.11, 0.025, M.board, 0, 0.06 + i * 0.125, -0.24, c, 0.004); bev(0.6, 0.11, 0.025, M.board, 0, 0.06 + i * 0.125, 0.24, c, 0.004); bev(0.025, 0.11, 0.5, M.board, -0.29, 0.06 + i * 0.125, 0, c, 0.004); bev(0.025, 0.11, 0.5, M.board, 0.29, 0.06 + i * 0.125, 0, c, 0.004); } bev(0.6, 0.025, 0.5, M.board, 0, 0.49, 0, c, 0.004); c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  // solids: the barn's walls with the door gap
  solid('bN', B.x0, B.x1, -1, 3.3, B.z0 - 0.05, B.z0 + 0.05); solid('bS', B.x0, B.x1, -1, 3.3, B.z1 - 0.05, B.z1 + 0.05); solid('bE', B.x1 - 0.05, B.x1 + 0.05, -1, 3.3, B.z0, B.z1);
  solid('bW1', B.x0 - 0.05, B.x0 + 0.05, -1, 3.3, B.z0, BARN_DOOR.z0); solid('bW2', B.x0 - 0.05, B.x0 + 0.05, -1, 3.3, BARN_DOOR.z1, B.z1); solid('bW3', B.x0 - 0.05, B.x0 + 0.05, 2.2, 3.3, BARN_DOOR.z0, BARN_DOOR.z1);
  solid('bRoof', B.x0, B.x1, 2.4, 3.3, B.z0, B.z1);
  // the woodpile under a lean-to on the barn's south side
  O.woodpile = grp(); const wp = O.woodpile;
  { const ends = []; for (let r = 0; r < 7; r++) for (let i = 0; i < 26; i++) { const x = WOOD.x0 + 0.1 + i * 0.185 + (r % 2) * 0.09, y = 0.1 + r * 0.19; if (x > WOOD.x1 - 0.08) continue; ends.push({ x, y, s: 0.85 + hash1(i * 7 + r) * 0.3, a: hash1(i + r * 31) * TAU }); }
    const parts = []; for (const e of ends) { const geo = new THREE.CylinderGeometry(0.09 * e.s, 0.09 * e.s, 0.78, 3 + (hash1(e.x) > 0.5 ? 1 : 0), 1); geo.rotateX(Math.PI / 2); geo.rotateZ(e.a); parts.push({ geo, m: m4(e.x, e.y, (WOOD.z0 + WOOD.z1) / 2), color: 0xffffff }); }
    const lg = mergeParts(parts); const m = new THREE.Mesh(lg, M.birch); m.castShadow = true; m.receiveShadow = true; wp.add(m);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(WOOD.x1 - WOOD.x0, 1.36), std({ map: tex(canv(512, 160, (c, W2, H2) => { c.fillStyle = '#2a2018'; c.fillRect(0, 0, W2, H2); for (const e of ends) { const x = (e.x - WOOD.x0) / (WOOD.x1 - WOOD.x0) * W2, y = H2 - e.y / 1.36 * H2, r = 0.09 * e.s / 1.36 * H2; c.save(); c.translate(x, y); c.rotate(e.a); c.drawImage(T.woodEnd.userData.canvas, -r, -r, r * 2, r * 2); c.restore(); } })), roughness: 0.95 })); face.position.set((WOOD.x0 + WOOD.x1) / 2, 0.68, WOOD.z1 + 0.002); wp.add(face); face.receiveShadow = true;
    const r = new THREE.Mesh(new THREE.BoxGeometry(WOOD.x1 - WOOD.x0 + 0.4, 0.04, 1.4), M.roof); r.position.set((WOOD.x0 + WOOD.x1) / 2, 2.0, WOOD.z0 + 0.5); r.rotation.x = 0.3; r.castShadow = true; wp.add(r); for (const x of [WOOD.x0, WOOD.x1]) cyl(0.05, 0.05, 1.8, M.logOut, x, 0.9, WOOD.z1 + 0.3, wp, 6); }
  solid('wood', WOOD.x0, WOOD.x1, -1, 1.4, WOOD.z0, WOOD.z1);
  O.woodHit = mbox(WOOD.x1 - WOOD.x0, 1.4, 0.3, HITMAT, (WOOD.x0 + WOOD.x1) / 2, 0.7, WOOD.z1 + 0.1, scene, 1); O.woodHit.layers.set(2); O.woodHit.userData.hit = true;
  // the chopping block, the axe in it, and a birch log beside it with its bark coming away
  O.block = grp(POS.block.x, 0, POS.block.z, scene); O.block.userData.keep = true;
  { const b = O.block; cyl(0.28, 0.32, 0.55, M.logOut, 0, 0.27, 0, b, 14); const top = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), M.woodEnd); top.rotation.x = -Math.PI / 2; top.position.y = 0.552; b.add(top); const ax = grp(0.05, 0.56, 0.02, b); mbox(0.02, 0.12, 0.17, M.iron, 0, 0.02, 0, ax, 1); pole([0, 0.06, 0.06], [0, 0.6, 0.35], 0.018, M.wood, ax, 6); ax.rotation.y = 0.6;
    O.birchLog = grp(0.6, 0.12, 0.25, b); const bl = cyl(0.12, 0.12, 0.9, M.birch, 0, 0, 0, O.birchLog, 12); bl.rotation.z = Math.PI / 2; O.birchLog.rotation.y = 0.4;
    O.barkCurl = grp(0, 0.1, 0, O.birchLog); const cg = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10, 1, true, 0, Math.PI * 1.3); const cm = new THREE.Mesh(cg, std({ map: T.birch, side: THREE.DoubleSide, roughness: 0.9 })); cm.rotation.z = Math.PI / 2; O.barkCurl.add(cm); }
  solid('block', POS.block.x - 0.3, POS.block.x + 0.3, -1, 0.55, POS.block.z - 0.3, POS.block.z + 0.3);
  // the well with its sweep
  { const w = grp(WELL.x, 0, WELL.z, scene); for (let r = 0; r < 4; r++) for (const [dx, dz, ry] of [[0, -0.5, 0], [0, 0.5, 0], [-0.5, 0, Math.PI / 2], [0.5, 0, Math.PI / 2]]) { const l = mesh(logGeo(1.2, 0.1), M.logOut, dx, 0.1 + r * 0.19 + (ry ? 0.095 : 0), dz, w); l.rotation.set(0, ry, Math.PI / 2); }
    bev(1.0, 0.05, 1.0, M.board, 0, 0.85, 0, w, 0.008); cyl(0.02, 0.02, 0.02, M.iron, 0.3, 0.88, 0, w, 6);
    cyl(0.13, 0.15, 3.4, M.logOut, 2.4, 1.7, 0, w, 10); for (const s of [-1, 1]) pole([2.4, 3.3, s * 0.08], [2.4, 3.6, s * 0.12], 0.05, M.logOut, w, 6);
    const sweep = grp(2.4, 3.45, 0, w); pole([3.0, -2.0, 0], [-3.4, 1.5, 0], 0.06, M.logOut, sweep, 8, 0.04); const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), std({ color: 0x5a564e, roughness: 1 })); st.position.set(2.9, -2.0, 0); sweep.add(st);
    pole([-3.3, 1.45, 0], [-2.4, -2.35, 0], 0.02, M.logOut, w, 5); const bk = lathe([[0, 0], [0.12, 0], [0.15, 0.28], [0.16, 0.29]], M.board, -2.4, -2.6 + 3.45 - 0.9, 0, w, 14); bk.position.set(0, 0.95, 0);
    w.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); }
  solid('well', WELL.x - 0.6, WELL.x + 0.6, -1, 0.9, WELL.z - 0.6, WELL.z + 0.6); solid('wellPost', WELL.x + 2.25, WELL.x + 2.55, -1, 3.4, WELL.z - 0.15, WELL.z + 0.15);
  // the bathhouse down by the bank, its door shut for good
  { const b = grp(15.5, 0, 18.0, scene); for (let r = 0; r < 9; r++) { for (const [dx, dz, ry, len] of [[0, -1.5, 0, 3.6], [0, 1.5, 0, 3.6], [-1.6, 0, Math.PI / 2, 3.4], [1.6, 0, Math.PI / 2, 3.4]]) { const l = mesh(logGeo(len, 0.12), M.logOut, dx, 0.12 + r * 0.22 + (ry ? 0.11 : 0), dz, b); l.rotation.set(0, ry, Math.PI / 2); } }
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.05, 2.0), M.roof); r.position.set(0, 2.4, s * 0.85); r.rotation.x = s * 0.45; r.castShadow = true; b.add(r); }
    bev(0.7, 1.5, 0.05, M.boardDark, -0.6, 0.8, -1.63, b, 0.006); b.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); }
  solid('banya', 13.8, 17.2, -2, 2.4, 16.4, 19.6);
  // the dug-over garden: ridges of black earth, the stumps of cabbages
  { const parts = []; for (let r = 0; r < 9; r++) { const z = 13.2 + r * 0.8; const geo = new THREE.CylinderGeometry(0.22, 0.22, 11.5, 6, 1, false, 0, Math.PI); geo.rotateZ(Math.PI / 2); parts.push({ geo, m: m4(7.2, 0.0, z, 0, 0, 0, 1, 0.5, 1), color: 0xffffff }); } const m = new THREE.Mesh(mergeParts(parts), std({ map: T.earth, normalMap: T.earthN, color: 0x6a5a48, roughness: 1 })); m.receiveShadow = true; m.castShadow = true; scene.add(m); m.userData.noRay = true;
    for (let i = 0; i < 26; i++) { const st = cyl(0.03, 0.04, 0.12, std({ color: 0x8a8a5a, roughness: 1 }), 2 + hash1(i) * 10, 0.08, 13.2 + Math.floor(hash1(i * 3) * 9) * 0.8, scene, 5); st.userData.noRay = true; } }
  // the landing: planks on posts out into the river
  { const L2 = LANDING; const g2 = grp(); for (let z = L2.z0; z < L2.z1; z += 0.2) { const b = bev(L2.x1 - L2.x0, 0.05, 0.18, M.board, (L2.x0 + L2.x1) / 2, L2.y - 0.025, z + 0.1, g2, 0.004); b.rotation.y = (hash1(z * 9) - 0.5) * 0.03; }
    for (const z of [L2.z0 + 0.3, L2.z0 + 2.0, L2.z0 + 3.6, L2.z1 - 0.1]) for (const x of [L2.x0 + 0.05, L2.x1 - 0.05]) cyl(0.06, 0.07, 2.2, M.logOut, x, L2.y - 1.1, z, g2, 7);
    cyl(0.07, 0.08, 1.2, M.logOut, L2.x0 - 0.05, L2.y + 0.3, L2.z1 - 1.2, g2, 8); O.boatPost = new THREE.Vector3(L2.x0 - 0.05, L2.y + 0.5, L2.z1 - 1.2); }
  solid('landing', LANDING.x0, LANDING.x1, -3, LANDING.y, LANDING.z0, LANDING.z1);
}
function buildTarPotMesh(par) {
  // a small iron pot of pine tar, with a bail handle and a brush stuck in it
  const g = grp(0, 0, 0, par);
  lathe([[0, 0], [0.08, 0.005], [0.1, 0.05], [0.1, 0.13], [0.105, 0.135]], M.iron, 0, 0, 0, g, 18);
  const tarTop = new THREE.Mesh(new THREE.CircleGeometry(0.097, 16), M.tar); tarTop.rotation.x = -Math.PI / 2; tarTop.position.y = 0.11; g.add(tarTop);
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.004, 4, 16, Math.PI), M.iron); bail.position.y = 0.13; g.add(bail);
  const br = grp(0.03, 0.1, 0.0, g); pole([0, 0, 0], [0.05, 0.22, 0.02], 0.009, M.wood, br, 6); const bristle = cyl(0.018, 0.022, 0.05, std({ color: 0x1a1612, roughness: 0.6 }), 0, 0.0, 0, br, 8);
  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  par.userData.steam = []; return g;
}

/* ---------------- Grandfather's boat ---------------- */
// a lofted hull: sections along her length, narrowing to a sharp bow and a small transom
function hullGeo(len, beam, depth, inner) {
  const NL = 26, NS = 14, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NL; i++) {
    const t = i / NL, z = (t - 0.5) * len;
    const w = beam / 2 * (t > 0.62 ? Math.pow(Math.max(0, 1 - (t - 0.62) / 0.38), 0.75) : 0.72 + 0.28 * Math.sin(Math.min(1, t / 0.62) * Math.PI / 2));
    const d = depth * (0.9 + 0.1 * Math.sin(t * Math.PI)) * (t > 0.85 ? 1 + (t - 0.85) * 0.8 : 1);
    const sheer = depth + (t > 0.7 ? (t - 0.7) * 0.5 : 0) + (t < 0.15 ? (0.15 - t) * 0.4 : 0);
    for (let j = 0; j <= NS; j++) {
      const a = j / NS * Math.PI, sx = -Math.cos(a), sy = Math.sin(a);
      const x = sx * Math.max(0.004, w) * (inner ? 0.94 : 1), y = sheer - (sy * d) * (inner ? 0.92 : 1) - (inner ? 0 : 0);
      pos.push(x, y - sheer + depth, z); uv.push(j / NS * 1.4, t * len / 1.0);
    }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; if (inner) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildBoat() {
  const LEN = 4.4, BEAM = 1.25, DEP = 0.46;
  O.boat = grp(BOAT0.x, 0, BOAT0.z, scene); O.boat.userData.keep = true;
  O.hull = grp(0, 0, 0, O.boat);             // the hull pivots about its keel line for turning over
  const tarred = std({ map: T.plank, normalMap: T.plankN, color: 0x2a2018, roughness: 0.55 });
  const insideM = std({ map: T.plank, normalMap: T.plankN, color: 0x8a7458, roughness: 0.85 });
  const outer = new THREE.Mesh(hullGeo(LEN, BEAM, DEP, false), tarred); outer.castShadow = true; outer.receiveShadow = true; O.hull.add(outer);
  const inner = new THREE.Mesh(hullGeo(LEN, BEAM, DEP, true), insideM); inner.castShadow = false; inner.receiveShadow = true; O.hull.add(inner);
  // strakes: dark lines along the outside
  // gunwales, thwarts, ribs, the transom, thole pins
  for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, z = (t - 0.5) * LEN, w = BEAM / 2 * (t > 0.62 ? Math.pow(Math.max(0, 1 - (t - 0.62) / 0.38), 0.75) : 0.72 + 0.28 * Math.sin(Math.min(1, t / 0.62) * Math.PI / 2)); pts.push([s * Math.max(0.01, w), DEP + (t > 0.7 ? (t - 0.7) * 0.5 : 0) + (t < 0.15 ? (0.15 - t) * 0.4 : 0) - 0 + 0.0, z]); } tube(pts, 0.025, M.woodDark, O.hull, 30, 6); }
  O.thwarts = [];
  for (const [z, w] of [[-1.35, 0.98], [0.0, 1.2], [1.05, 1.02]]) { const t = bev(w, 0.04, 0.24, insideM, 0, DEP - 0.12, z, O.hull, 0.006); O.thwarts.push(t); }
  for (let i = 0; i < 9; i++) { const z = -1.8 + i * 0.42; const t = (z / LEN) + 0.5; const w = BEAM / 2 * (t > 0.62 ? Math.pow(Math.max(0, 1 - (t - 0.62) / 0.38), 0.75) : 0.72 + 0.28 * Math.sin(Math.min(1, t / 0.62) * Math.PI / 2)) * 0.9; const rib = new THREE.Mesh(new THREE.TorusGeometry(w, 0.018, 4, 12, Math.PI), insideM); rib.rotation.z = Math.PI; rib.position.set(0, DEP, z); rib.scale.y = DEP / Math.max(0.1, w) * 0.9; O.hull.add(rib); }
  { const tr = bev(BEAM * 0.72 * 0.95, DEP * 0.9, 0.04, tarred, 0, DEP * 0.55, -LEN / 2 + 0.02, O.hull, 0.008); }
  O.tholes = []; for (const s of [-1, 1]) for (const dz of [-0.12, 0.12]) { const p = cyl(0.012, 0.012, 0.12, M.woodDark, s * BEAM / 2 * 0.98, DEP + 0.06, 0.25 + dz, O.hull, 6); O.tholes.push(p); }
  // the split seam along her bottom, and what you do to it
  O.seam = grp(0, 0, 0, O.hull);
  { const mk = (col, rough, w) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.2), std({ color: col, roughness: rough, polygonOffset: true, polygonOffsetFactor: -3 })); m.rotation.x = Math.PI / 2; m.position.set(0.18, -0.005, 0.35); m.rotation.z = 0.06; O.seam.add(m); return m; };
    O.seamGap = mk(0x020101, 1, 0.022); O.seamOak = mk(0x8a7452, 1, 0.026); O.seamTar = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 1.25), phys({ color: 0x050403, roughness: 0.2, clearcoat: 1, polygonOffset: true, polygonOffsetFactor: -4 })); O.seamTar.rotation.x = Math.PI / 2; O.seamTar.position.set(0.18, -0.006, 0.35); O.seamTar.rotation.z = 0.06; O.seam.add(O.seamTar); }
  // the oars in her, once they're in
  O.boatOars = []; for (const s of [-1, 1]) { const o = grp(s * 0.5, DEP - 0.04, 0.2, O.hull); buildOarMesh(o); o.rotation.set(Math.PI / 2, 0, 0); o.position.z = -1.0; o.visible = false; O.boatOars.push(o); }
  // the two logs she's propped on, upside down
  O.props = []; for (const z of [-1.2, 1.1]) { const l = mesh(logGeo(1.5, 0.1), M.birch, 0, 0.1, z, O.boat); l.rotation.z = Math.PI / 2; O.props.push(l); }
  O.boatHit = mbox(1.4, 0.8, 4.5, HITMAT, 0, 0.45, 0, O.boat, 1); O.boatHit.layers.set(2); O.boatHit.userData.hit = true;
  O.boatSolid = solid('boat', 0, 0, 0, 0, 0, 0);
  O.boatLen = LEN; O.boatDep = DEP;
  // the rollers, lying in the grass
  O.rollers = POS.roller0.map((p, i) => { const r = grp(p.x, 0.1, p.z, scene); r.userData.keep = true; const l = mesh(logGeo(1.5, 0.1), M.birch, 0, 0, 0, r); l.rotation.z = Math.PI / 2; for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), M.woodEnd); e.position.x = s * 0.75; e.rotation.y = s * Math.PI / 2; r.add(e); } r.rotation.y = 0.3 + i * 0.5; return r; });
  // the boat hook, leaning on the fence
  O.hook = grp(POS.hook.x, 0, POS.hook.z, scene); O.hook.userData.keep = true;
  { pole([0, 0, 0], [0, 2.6, 0], 0.022, M.wood, O.hook, 7); const hk = grp(0, 2.6, 0, O.hook); pole([0, 0, 0], [0, 0.18, 0], 0.012, M.iron, hk, 5); const c = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 5, 10, Math.PI * 1.2), M.iron); c.position.set(0.05, 0.12, 0); hk.add(c); O.hook.rotation.z = -0.12; }
  // the ladder, lying by the barn
  O.ladder = grp(POS.ladder0.x, 0.05, POS.ladder0.z, scene); O.ladder.userData.keep = true; buildLadderMesh(O.ladder); O.ladder.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
}
function buildLadderMesh(par, len = 4.3) {
  const g = grp(0, 0, 0, par);
  for (const s of [-1, 1]) pole([s * 0.22, 0, 0], [s * 0.2, len, 0], 0.03, M.boardDark, g, 6);
  for (let i = 1; i < 13; i++) { const y = i * len / 13; pole([-0.22, y, 0], [0.22, y, 0], 0.017, M.boardDark, g, 5); }
  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return g;
}

/* ---------------- the village ---------------- */
function buildVillage() {
  O.village = grp();
  O.burn = HOUSES.map((h, i) => {
    const g = grp(h.x, 0, h.z, scene); g.rotation.y = h.ry;
    // a log box, its gable to the lane, three windows, a plank roof
    const w = h.w, d = h.d, eave = 3.2, ridge = 5.4;
    const lm = M.logOut.clone(); lm.color.setHex(0x8a8680);
    for (let y = 0.15; y < eave; y += 0.24) { for (const [dx, dz, ry, len] of [[0, -d / 2, 0, w + 0.4], [0, d / 2, 0, w + 0.4], [-w / 2, 0, Math.PI / 2, d + 0.4], [w / 2, 0, Math.PI / 2, d + 0.4]]) { const l = mesh(logGeo(len, 0.13, 7), lm, dx, y + (ry ? 0.12 : 0), dz, g); l.rotation.set(0, ry, Math.PI / 2); } }
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(w / 2 + 0.5, ridge - eave + 0.3), 0.05, d + 0.8), M.roof); r.position.set(s * (w / 4 + 0.25), (eave + ridge) / 2, 0); r.rotation.z = -s * Math.atan2(ridge - eave, w / 2); r.castShadow = true; g.add(r); }
    for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.1, eave); sh.lineTo(w / 2 + 0.1, eave); sh.lineTo(0, ridge); sh.closePath(); const gm = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.board); gm.position.z = s * (d / 2 + 0.14); if (s < 0) gm.rotation.y = Math.PI; g.add(gm); }
    const wins = []; for (const x of [-w * 0.3, 0, w * 0.3]) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), std({ color: 0x050505, roughness: 0.3, emissive: 0xff5010, emissiveIntensity: 0 })); wn.position.set(x, 1.95, -d / 2 - 0.15); wn.rotation.y = Math.PI; g.add(wn); wins.push(wn); const fr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), M.blue); fr.position.set(x, 1.95, -d / 2 - 0.148); fr.rotation.y = Math.PI; g.add(fr); wn.position.z -= 0.004; }
    g.traverse(c => { if (c.isMesh) { c.castShadow = !h.dark || true; c.receiveShadow = true; } });
    // the fire that will take it
    const F = h.dark ? null : makeFire(g, { w, d, eave, ridge });
    // a little dark figure that stands in a burning window and keens
    let fig = null; if (!h.dark) { fig = smallFigure(0x050403); fig.position.set(w * 0.3, 1.3, -d / 2 + 0.25); fig.rotation.y = Math.PI; fig.scale.setScalar(0.85); g.add(fig); fig.visible = false; }
    return { h, g, F, wins, fig, lm, k: 0, state: 'whole', t: 0 };
  });
  L.firePool = [0].map(() => { const l = new THREE.PointLight(0xff7a30, 0, 45, 1.6); scene.add(l); return l; });
  // telegraph poles along the lane, the wires down
  for (let x = -60; x <= 40; x += 22) { const p = grp(x, 0, -8.2, scene); cyl(0.09, 0.11, 6.5, M.logOut, 0, 3.25, 0, p, 7); pole([-0.6, 6.1, 0], [0.6, 6.1, 0], 0.04, M.logOut, p, 5); }
  // birches: pale trunks, the last yellow leaves
  const birch = (x, z, s = 1) => { const t = grp(x, 0, z, scene); const pts = [[0, 0, 0], [0.1 * s, 2.5 * s, 0.05], [-0.15 * s, 5 * s, 0.1], [0.05 * s, 7.5 * s, -0.1]]; tube(pts, 0.14 * s, M.birch, t, 16, 8); for (let i = 0; i < 7; i++) { const a = i * 2.1, y = (3.5 + i * 0.6) * s; tube([[0, y, 0], [Math.cos(a) * 1.2 * s, y + 0.8 * s, Math.sin(a) * 1.2 * s], [Math.cos(a) * 2.0 * s, y + 0.9 * s, Math.sin(a) * 2.0 * s]], 0.035 * s, M.birch, t, 8, 5); } for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 * s, 1), std({ color: 0x7a6a2a, roughness: 1, transparent: true, opacity: 0.85 })); b.position.set((hash1(i + x) - 0.5) * 3 * s, (5 + hash1(i * 3 + z) * 3) * s, (hash1(i * 7 + x) - 0.5) * 3 * s); b.scale.set(1, 0.6, 1); b.castShadow = true; t.add(b); } t.traverse(c => { if (c.isMesh) c.userData.noRay = true; }); return t; };
  birch(-3.6, -8.6, 1.1); birch(13.5, -9.5, 0.9); birch(22.5, 10, 1.0); birch(-1.0, 22.5, 0.8); birch(-22, -9, 1.0); birch(19.5, 24.6, 0.7);
  solid('birch1', 21.9, 23.1, -1, 4, 9.4, 10.6); solid('birch2', -1.5, -0.5, -2, 4, 22, 23);
  // beyond the near houses, the rest of the village: dark roofs, and a glow where they've already gone
  for (let i = 0; i < 8; i++) { const x = -110 + i * 13, z = i % 2 ? -21 : -3; const r = grp(x, 0, z, scene); const b = mbox(6, 3.2, 8, std({ color: 0x0a0908, roughness: 1 }), 0, 1.6, 0, r, 1); }
  O.farGlow = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(M.glowO.clone()); s.position.set(-80 - i * 16, 1.5, -12 + (i % 2 ? -9 : 9)); s.scale.set(46, 18, 1); s.material.opacity = 0.16; s.material.color.setHex(0xff6a28); s.userData.noRay = true; scene.add(s); O.farGlow.push(s); }
  // columns of smoke going up from the far end of the village, lit from underneath
  for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(M.smokeLit.clone()); s.position.set(-85 - (i % 3) * 14, 10 + Math.floor(i / 3) * 12, -12 + (i % 2 ? -6 : 6)); s.scale.set(22 + i * 3, 22 + i * 3, 1); s.material.opacity = 0.28 - Math.floor(i / 3) * 0.1; s.material.rotation = i; s.userData.noRay = true; scene.add(s); O.farGlow.push(s); }
}

/* ---------------- fire: tongues of flame, smoke, sparks, a light ---------------- */
function makeFire(par, o, withLight = false) {
  const F = { g: grp(0, 0, 0, par), flames: [], smoke: [], sparks: [], k: 0, t: Math.random() * 10, light: null, o };
  const { w, d, eave, ridge } = o;
  // flame points: along the ridge, the eaves, in the windows
  const pts = [];
  for (let i = 0; i < 7; i++) pts.push([0, ridge - 0.2, -d / 2 + (i + 0.5) * d / 7, 2.6]);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) pts.push([s * w * 0.32, (eave + ridge) / 2, -d / 2 + (i + 0.5) * d / 5, 2.0]);
  for (const x of [-w * 0.3, 0, w * 0.3]) pts.push([x, 1.9, -d / 2 - 0.3, 1.3]);
  for (const p of pts) { const s = new THREE.Sprite(M.flames[0]); s.position.set(p[0], p[1], p[2]); s.userData.base = p[3]; s.userData.ph = Math.random() * 10; s.userData.p0 = new THREE.Vector3(p[0], p[1], p[2]); s.scale.set(0.01, 0.01, 1); s.userData.noRay = true; F.g.add(s); F.flames.push(s); }
  for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(M.smoke.clone()); s.userData.life = Math.random(); s.userData.noRay = true; s.visible = false; F.g.add(s); F.smoke.push(s); }
  const glow = new THREE.Sprite(M.glowO.clone()); glow.position.set(0, ridge, 0); glow.scale.set(14, 10, 1); glow.material.opacity = 0; glow.userData.noRay = true; F.g.add(glow); F.glow = glow;
  // sparks: one Points cloud per fire
  const N = 50, geo = new THREE.BufferGeometry(), arr = new Float32Array(N * 3); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const pm = new THREE.PointsMaterial({ size: 0.12, map: T.glow, color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false });
  const pp = new THREE.Points(geo, pm); pp.userData.noRay = true; pp.frustumCulled = false; F.g.add(pp); F.pts = pp; F.sp = []; for (let i = 0; i < N; i++) F.sp.push({ p: new THREE.Vector3(0, -100, 0), v: new THREE.Vector3(), life: 0 });
  if (withLight) { F.light = new THREE.PointLight(0xff7a30, 0, 40, 1.6); F.light.position.set(0, eave + 1, -d / 2 - 2); F.g.add(F.light); }
  return F;
}
function fireUpdate(F, dt, k, wind = 0.6) {
  F.t += dt; F.k = k;
  const on = k > 0.01; F.g.visible = on; if (!on) { if (F.light) F.light.intensity = 0; return; }
  const fr = Math.floor(F.t * 12);
  for (const s of F.flames) { const u = s.userData; const n = fbm(F.t * 2.2 + u.ph, u.ph, 2); const sc = u.base * k * (0.75 + n * 0.6); s.material = M.flames[(fr + Math.floor(u.ph * 7)) % 8]; s.scale.set(sc * 0.65, sc, 1); s.position.copy(u.p0); s.position.y += sc * 0.38; s.position.x += Math.sin(F.t * 3 + u.ph) * 0.06 * sc; }
  for (const s of F.smoke) { const u = s.userData; u.life += dt / 7; if (u.life > 1) { u.life -= 1; u.x0 = (Math.random() - 0.5) * F.o.w * 0.6; u.z0 = (Math.random() - 0.5) * F.o.d * 0.6; } s.visible = true; const L2 = u.life; s.position.set((u.x0 || 0) + L2 * 6 * wind, F.o.ridge + L2 * 14, (u.z0 || 0) + L2 * 9 * wind); const sc = 3 + L2 * 10; s.scale.set(sc, sc, 1); s.material.opacity = Math.sin(L2 * Math.PI) * 0.5 * k; s.material.rotation = u.life * 2 + (u.x0 || 0); }
  const arr = F.pts.geometry.attributes.position.array;
  F.sp.forEach((p, i) => { p.life -= dt; if (p.life <= 0) { p.life = 1 + Math.random() * 2.5; p.p.set((Math.random() - 0.5) * F.o.w * 0.8, F.o.ridge - 0.5 + Math.random(), (Math.random() - 0.5) * F.o.d * 0.8); p.v.set((Math.random() - 0.5) * 1.5 + wind * 1.4, 2 + Math.random() * 3, (Math.random() - 0.5) * 1.5 + wind * 2); } p.v.y -= dt * 0.4; p.v.x += (Math.random() - 0.5) * dt * 3; p.p.addScaledVector(p.v, dt); const vis = k > 0.15; arr[i * 3] = p.p.x; arr[i * 3 + 1] = vis ? p.p.y : -100; arr[i * 3 + 2] = p.p.z; });
  F.pts.geometry.attributes.position.needsUpdate = true; F.pts.material.opacity = clamp(k * 1.5, 0, 1);
  if (F.light) F.light.intensity = k * (60 + fbm(F.t * 6, 1, 2) * 40);
  F.glow.material.opacity = k * 0.45;
}

/* ---------------- people and creatures ---------------- */
// a small dark figure, for the windows of burning houses: hunched, head down
function smallFigure(col) {
  const parts = [];
  parts.push({ geo: new THREE.SphereGeometry(0.22, 10, 8), m: m4(0, 0.25, 0, 0, 0, 0, 1, 1.3, 0.85), color: col });
  parts.push({ geo: new THREE.SphereGeometry(0.13, 10, 8), m: m4(0, 0.62, 0.06, 0, 0, 0), color: col });
  for (const s of [-1, 1]) parts.push({ geo: new THREE.CylinderGeometry(0.035, 0.03, 0.35, 6), m: m4(s * 0.2, 0.25, 0.05, 0.3, 0, s * 0.3), color: col });
  const m = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 1 })); m.userData.noRay = true; return m;
}
// Dedushka: small, hunched, shaggy and grey, in a quilted jacket three sizes too big for him
function buildDedushka() {
  const D = grp(0, -50, 0, scene); O.ded = D; D.userData.keep = true; D.scale.setScalar(1.12);
  const body = grp(0, 0, 0, D); O.dedBody = body;
  // the jacket: a cone of quilting, the sleeves hanging past his hands
  M.dedQuilt = std({ map: T.quilt, normalMap: T.quiltN, roughness: 0.95, emissive: 0xff6a30, emissiveMap: T.quilt, emissiveIntensity: 0 });
  const jk = lathe([[0.0, 0.72], [0.1, 0.71], [0.17, 0.66], [0.22, 0.52], [0.25, 0.3], [0.27, 0.08], [0.25, 0.0]], M.dedQuilt, 0, 0, 0, body, 20); jk.scale.z = 0.8; O.dedJacket = jk;
  const col = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 14), M.dedQuilt); col.rotation.x = Math.PI / 2 - 0.3; col.position.set(0, 0.7, 0.01); body.add(col);
  for (const s of [-1, 1]) { const sl = pole([s * 0.17, 0.62, 0.02], [s * 0.2, 0.35, 0.16], 0.06, M.dedQuilt, body, 10, 0.075); }
  // the head: a painted old face under a mat of grey hair, the beard to his chest
  const hd = grp(0, 0.8, 0.05, body); O.dedHead = hd;
  M.dedFace = std({ map: T.dedFace, roughness: 0.75, emissive: 0xff7a40, emissiveMap: T.dedFace, emissiveIntensity: 0 }); const face = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), M.dedFace); face.scale.set(0.95, 1.1, 0.95); hd.add(face);
  // shaggy grey hair falling every way from the crown, over the brow and the ears; a long beard
  M.dedHair = std({ map: T.hair, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.8, color: 0x8a8478, emissive: 0x6a3a20, emissiveMap: T.hair, emissiveIntensity: 0 });
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + hash1(i) * 0.3, len = 0.22 + hash1(i * 3) * 0.14; const g = new THREE.PlaneGeometry(0.16, len, 1, 3); g.translate(0, -len / 2, 0); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const yy = -p.getY(k) / len; p.setZ(k, yy * yy * 0.06); } const cm = new THREE.Mesh(g, M.dedHair); const front = Math.cos(a) > 0.75; cm.position.set(Math.sin(a) * 0.085, 0.1, Math.cos(a) * 0.085); cm.rotation.set(front ? 0.9 : 0.25 + hash1(i * 7) * 0.2, a, 0, 'YXZ'); if (front) cm.scale.y = 0.45; hd.add(cm); }
  for (let i = 0; i < 9; i++) { const len = 0.26 + hash1(i * 5) * 0.16; const g = new THREE.PlaneGeometry(0.12, len, 1, 3); g.translate(0, -len / 2, 0); const cm = new THREE.Mesh(g, M.dedHair); cm.position.set((i - 4) * 0.022, -0.05, 0.09 - Math.abs(i - 4) * 0.012); cm.rotation.set(-0.12 - hash1(i) * 0.1, (i - 4) * 0.18, 0, 'YXZ'); hd.add(cm); }
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.112, 12, 8, 0, TAU, 0, Math.PI / 2), M.dedHair.clone()); top.material.alphaTest = 0; top.material.map = T.fur; top.material.color.setHex(0x8a8478); top.position.y = 0.03; hd.add(top);
  // eyes that catch the light
  O.dedEyes = []; for (const s of [-1, 1]) { const e = new THREE.Sprite(M.eye.clone()); e.position.set(s * 0.035, 0.015, 0.11); e.scale.set(0.035, 0.035, 1); e.userData.noRay = true; hd.add(e); O.dedEyes.push(e); }
  // small hairy hands with long nails
  O.dedHands = []; for (const s of [-1, 1]) { const h = grp(s * 0.2, 0.33, 0.2, body); const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M.fur); p.scale.set(1, 0.7, 1.3); h.add(p); for (let f = 0; f < 4; f++) { const fg = pole([(f - 1.5) * 0.014, 0, 0.03], [(f - 1.5) * 0.018, -0.03, 0.07], 0.006, M.fur, h, 4); } O.dedHands.push(h); }
  D.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; c.userData.noRay = true; } });
  D.visible = false;
}
// Murka, Babushka's cat, left behind when they carried her out
function buildCat() {
  const C = grp(0, -50, 0, scene); O.cat = C; C.userData.keep = true;
  const b = grp(0, 0, 0, C); O.catBody = b;
  const bodyM = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), M.tabby); bodyM.scale.set(0.85, 1.05, 1.3); bodyM.position.set(0, 0.13, -0.03); b.add(bodyM);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), M.tabby); chest.position.set(0, 0.2, 0.07); b.add(chest);
  const hd = grp(0, 0.3, 0.1, b); O.catHead = hd; const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10), M.tabby); head.scale.set(1.1, 0.95, 1); hd.add(head);
  const muz = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M.tabby); muz.position.set(0, -0.02, 0.05); muz.scale.set(1.2, 0.8, 0.8); hd.add(muz);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 6), M.tabby); e.position.set(s * 0.04, 0.06, 0); e.rotation.z = -s * 0.25; hd.add(e); }
  O.catEyes = []; for (const s of [-1, 1]) { const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xc8e070, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0 })); e.position.set(s * 0.024, 0.01, 0.058); e.scale.set(0.022, 0.022, 1); e.userData.noRay = true; hd.add(e); O.catEyes.push(e); }
  for (const s of [-1, 1]) { pole([s * 0.04, 0.0, 0.08], [s * 0.04, 0.2, 0.08], 0.014, M.tabby, b, 5); const hp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M.tabby); hp.position.set(s * 0.07, 0.06, -0.08); hp.scale.set(0.8, 1, 1.4); b.add(hp); }
  O.catTail = tube([[0, 0.04, -0.17], [0.08, 0.02, -0.24], [0.16, 0.02, -0.18], [0.18, 0.03, -0.06]], 0.016, M.tabby, b, 12, 5);
  C.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  O.catHit = mbox(0.3, 0.4, 0.4, HITMAT, 0, 0.2, 0, C, 1); O.catHit.layers.set(2); O.catHit.userData.hit = true;
}
// the rower in the brigade's photograph: you, from the bank, in your shirt
function buildRower() {
  const R = grp(0, -50, 0, scene); O.rower = R;
  const parts = [];
  parts.push({ geo: new THREE.CylinderGeometry(0.17, 0.2, 0.6, 10), m: m4(0, 0.55, 0, -0.2, 0, 0), color: 0xb8b0a0 });
  parts.push({ geo: new THREE.SphereGeometry(0.11, 10, 8), m: m4(0, 0.98, 0.04), color: 0x6a5040 });
  for (const s of [-1, 1]) parts.push({ geo: new THREE.CylinderGeometry(0.045, 0.04, 0.6, 6), m: m4(s * 0.24, 0.65, 0.22, 1.2, 0, -s * 0.3), color: 0xb8b0a0 });
  parts.push({ geo: new THREE.BoxGeometry(0.36, 0.2, 0.45), m: m4(0, 0.2, 0.18), color: 0x2a2a30 });
  const m = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 0.95 })); m.castShadow = true; R.add(m); R.visible = false;
}
// your hand, and his: for the moment in the dark at the stove
function buildHands() {
  // the ritual, in the dark: your hand on the rim of her basket, and his, out of the oven mouth over yours.
  // A world-space rig at the basket's near rim; local +z points back toward you. Lit only by the embers, so dim self-light.
  O.handScene = grp(0, 0, 0, scene); O.handScene.visible = false;
  const skin = std({ color: 0x8a5a44, emissive: 0xb06040, emissiveIntensity: 0.55, roughness: 0.6 }), shirt = std({ color: 0x8a8478, emissive: 0x6a5040, emissiveIntensity: 0.3, roughness: 0.95 });
  const furH = std({ map: T.fur, color: 0x9a948a, emissive: 0xa07858, emissiveIntensity: 0.6, emissiveMap: T.fur, roughness: 1 });
  const mine = grp(0, 0, 0, O.handScene);
  // forearm and sleeve, coming in from below the camera
  pole([0.06, 0.17, 0.38], [0.02, 0.07, 0.17], 0.048, shirt, mine, 10, 0.044);
  pole([0.025, 0.08, 0.2], [0.0, 0.035, 0.06], 0.03, skin, mine, 8, 0.027);
  // the hand: palm on the rim, fingers curled over it
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.026, 0.085), skin); palm.position.set(0, 0.03, 0.02); palm.rotation.x = 0.25; mine.add(palm);
  for (let f = 0; f < 4; f++) { const x = -0.03 + f * 0.02; pole([x, 0.022, -0.02], [x, 0.018, -0.05], 0.0095, skin, mine, 5); pole([x, 0.018, -0.05], [x * 1.05, -0.02, -0.065], 0.009, skin, mine, 5); }
  pole([0.04, 0.025, 0.04], [0.05, 0.0, -0.01], 0.011, skin, mine, 5);
  // his: small, grey, furry, out of the dark of the oven
  const his = grp(0, 0, 0, mine); O.hisHand = his;
  const hp = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), furH); hp.scale.set(1.15, 0.5, 1.2); hp.position.set(0, 0.058, 0.02); his.add(hp);
  for (let f = 0; f < 4; f++) { const x = -0.024 + f * 0.016; pole([x, 0.058, 0.04], [x * 1.1, 0.045, 0.075], 0.0065, furH, his, 4); const nail = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.016, 4), std({ color: 0x3a3228, emissive: 0x5a4030, emissiveIntensity: 0.3, roughness: 0.4 })); nail.position.set(x * 1.1, 0.041, 0.084); nail.rotation.x = 2.1; his.add(nail); }
  // a thin, shaggy arm, bent at the elbow, back into the dark of the oven
  const elbow = [-0.035, 0.095, -0.2];
  pole([0.0, 0.06, 0.0], elbow, 0.024, furH, his, 7, 0.028); pole(elbow, [-0.07, 0.2, -0.44], 0.03, furH, his, 7, 0.026);
  for (let i = 0; i < 14; i++) { const k = i / 13, a2 = i * 2.4; const p0 = k < 0.5 ? new THREE.Vector3(0, 0.06, 0).lerp(new THREE.Vector3(...elbow), k * 2) : new THREE.Vector3(...elbow).lerp(new THREE.Vector3(-0.07, 0.2, -0.44), k * 2 - 1); const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 4), furH); tuft.position.set(p0.x + Math.cos(a2) * 0.024, p0.y + Math.sin(a2) * 0.024, p0.z); tuft.rotation.set(-1.2 + Math.sin(a2) * 0.4, 0, Math.cos(a2) * 1.2); his.add(tuft); }
  O.handScene.traverse(c => { if (c.isMesh) { c.castShadow = false; c.userData.noRay = true; } });
}
/* ---------------- lights ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x223040, 0x0a0806, 0.25); scene.add(L.hemi);
  // a little cold moonlight, no shadows (kept faint so it doesn't leak indoors)
  L.moon = new THREE.DirectionalLight(0x8090c0, 0.1); L.moon.position.set(28, 40, 34); L.moon.target.position.set(8, 0, 4); scene.add(L.moon); scene.add(L.moon.target);
  // the village burning to the west: the key light of the night, low and orange, with shadows, so it only comes indoors through the windows
  L.west = new THREE.DirectionalLight(0xff8a48, 0.4); L.west.position.set(-42, 30, -40); L.west.target.position.set(6, 0, 4); scene.add(L.west); scene.add(L.west.target);
  if (!IS_TOUCH) { L.west.castShadow = true; L.west.shadow.mapSize.set(2048, 2048); const c = L.west.shadow.camera; c.left = -28; c.right = 28; c.top = 26; c.bottom = -26; c.near = 5; c.far = 160; L.west.shadow.bias = -0.0006; L.west.shadow.normalBias = 0.035; }
  // a faint cold bounce inside the house, so the dark has a shape
  L.inFill = new THREE.PointLight(0x5a6890, 0.35, 8, 1.4); L.inFill.position.set(3, FY + 2.0, -2.8); scene.add(L.inFill);
  // Babushka's kerosene lamp on the table
  L.lamp = new THREE.PointLight(0xffb060, 0, 9, 1.7); L.lamp.position.set(4.72, FY + 1.06, -5.08);
  if (!IS_TOUCH) { L.lamp.castShadow = true; L.lamp.shadow.mapSize.set(512, 512); L.lamp.shadow.bias = -0.004; L.lamp.shadow.normalBias = 0.02; L.lamp.shadow.camera.near = 0.06; L.lamp.shadow.camera.far = 9; }
  scene.add(L.lamp);
  // the fire in the stove, thrown out of the mouth into the room
  L.stove = new THREE.PointLight(0xff8a3a, 0, 8, 1.6); L.stove.position.set(MOUTH.x, MOUTH.y0 + 0.25, MOUTH.z - 0.35); scene.add(L.stove);
  // your torch: a dim yellow flat battery torch, on a spot from the camera
  L.torch = new THREE.SpotLight(0xffe2b0, 0, 16, 0.55, 0.75, 1.4); L.torch.position.set(0.12, -0.12, 0); camera.add(L.torch); L.torch.target.position.set(0.05, -0.08, -2); camera.add(L.torch.target);
  // the embers in the pot
  L.ember = new THREE.PointLight(0xff5a1a, 0, 1.8, 2); scene.add(L.ember);
  // the house itself burning, at the end
  L.house = new THREE.PointLight(0xff7a30, 0, 26, 1.5); L.house.position.set(3, 5.5, 1); scene.add(L.house);
}
