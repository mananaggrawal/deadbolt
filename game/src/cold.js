const ROOM_COLD = (() => {

/* =====================================================================
   MYSTERY #3 — "COLD STORAGE"  ·  St Agnes County Hospital mortuary, 3 Feb 1974
   part A: palette, textures, bodies, geometry, lights
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {};
const OSW = '"Oswald", "Arial Narrow", sans-serif', MARK = '"Permanent Marker", "Comic Sans MS", cursive', PEN = '"Kalam", "Segoe Print", cursive';
const W = 3.5, D = 3.0, H = 2.8;                     // half-width (x), half-depth (z), height
const DR = { x0: -1.35, w: 0.9, rows: [1.9, 1.2, 0.5], h: 0.66 };   // drawer bank on the north wall
const drawerPos = n => { const i = n - 1, c = i % 3, r = Math.floor(i / 3); return { x: DR.x0 + DR.w * (c + 0.5), y: DR.rows[r] }; };
const CARDS = { 1: 'VACANT', 2: 'UNKNOWN (M)', 3: 'VACANT', 4: 'VACANT', 5: 'CRANE, E.', 6: 'VACANT', 7: 'HALE, V.', 8: 'VACANT', 9: 'ROURKE, T.' };
const POS = {
  door: new THREE.Vector3(W - 0.02, 1.1, 1.2), btn: new THREE.Vector3(W - 0.04, 1.3, 0.38), panel: new THREE.Vector3(-W + 0.05, 1.45, -1.0),
  bank: new THREE.Vector3(0, 1.2, -D + 0.1), d2: new THREE.Vector3(drawerPos(2).x, drawerPos(2).y, -D + 0.2), d5: new THREE.Vector3(drawerPos(5).x, drawerPos(5).y, -D + 0.2),
  d7: new THREE.Vector3(drawerPos(7).x, drawerPos(7).y, -D + 0.2), table: new THREE.Vector3(-0.6, 0.95, 0.4), gurney: new THREE.Vector3(2.25, 0.8, -1.3),
  box: new THREE.Vector3(W - 0.06, 1.5, -1.55), comp: new THREE.Vector3(0, 2.4, -D - 0.3), sink: new THREE.Vector3(-W + 0.4, 1.0, 1.7),
};

/* ---------------- textures ---------------- */
function makeTextures() {
  T.tile = ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#b9c7bd'; g.fillRect(0, 0, w, h);
    const s = 64; for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '120,140,125'},${Math.random() * 0.08})`; g.fillRect(x + 2, y + 2, s - 4, s - 4); }
    g.strokeStyle = 'rgba(80,90,82,0.7)'; g.lineWidth = 3; for (let i = 0; i <= w; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    speckle(g, w, h, 5000, 0.12, '0,0,0', 2); for (let i = 0; i < 9; i++) blot(g, rand(0, w), rand(h * 0.4, h), rand(20, 70), rand(0.1, 0.25), '90,80,50');
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(80,70,40,0.18)'; g.fillRect(rand(0, w), rand(0, h), rand(2, 4), rand(40, 180)); }
  }, { repeat: [3, 1.2] });
  T.floor = ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#6f7a73'; g.fillRect(0, 0, w, h); const s = 64;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { g.fillStyle = ((x + y) / s) % 2 ? 'rgba(40,50,45,0.25)' : 'rgba(200,210,200,0.1)'; g.fillRect(x, y, s, s); }
    g.strokeStyle = 'rgba(30,35,32,0.6)'; g.lineWidth = 2; for (let i = 0; i <= w; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    speckle(g, w, h, 14000, 0.2, '0,0,0', 2); for (let i = 0; i < 8; i++) blot(g, rand(0, w), rand(0, h), rand(30, 90), rand(0.12, 0.3), '60,40,30');
  }, { repeat: [4, 3.4] });
  T.steel = ctex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9aa3a6'); gr.addColorStop(1, '#7c858a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(0, y, w, 1); } speckle(g, w, h, 1500, 0.15); for (let i = 0; i < 4; i++) blot(g, rand(0, w), rand(0, h), rand(10, 40), 0.18, '40,50,50'); });
  T.ceil = ctex(256, 256, (g, w, h) => { g.fillStyle = '#9ea69f'; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 0.18, '0,0,0', 2); for (let i = 0; i < 5; i++) blot(g, rand(0, w), rand(0, h), rand(20, 60), 0.2, '90,70,40'); }, { repeat: [3, 3] });
  T.sheet = ctex(256, 256, (g, w, h) => { g.fillStyle = '#e8e6df'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(150,150,140,${rand(0.05, 0.18)})`; g.lineWidth = rand(1, 3); g.beginPath(); g.moveTo(rand(0, w), 0); g.bezierCurveTo(rand(0, w), h * 0.3, rand(0, w), h * 0.7, rand(0, w), h); g.stroke(); } speckle(g, w, h, 1500, 0.08); blot(g, rand(60, 190), rand(60, 190), 30, 0.18, '120,90,60'); });
  T.card = {};
  for (const n in CARDS) T.card[n] = ctex(256, 64, (g, w, h) => { g.fillStyle = CARDS[n] === 'VACANT' ? '#1d1d1d' : '#8e1c16'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f1ea'; g.font = `bold 30px ${OSW}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(CARDS[n], w / 2, h / 2 + 2); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, 4, w, 3); });
  T.num = {}; for (let n = 1; n <= 9; n++) T.num[n] = ctex(64, 64, (g, w, h) => { g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#151515'; g.font = `bold 44px ${OSW}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), w / 2, h / 2 + 3); });
  T.dial = ctex(256, 256, () => {});
  T.clock = ctex(128, 128, (g, w, h) => { g.fillStyle = '#efece2'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 5; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.lineWidth = 3; g.beginPath(); g.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); g.lineTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); g.stroke(); } const hA = (3 + 10 / 60) / 12 * TAU - Math.PI / 2, mA = 10 / 60 * TAU - Math.PI / 2; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(hA) * 28, 64 + Math.sin(hA) * 28); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(mA) * 44, 64 + Math.sin(mA) * 44); g.stroke(); g.fillStyle = '#b3261e'; g.font = `11px ${OSW}`; g.textAlign = 'center'; g.fillText('ST AGNES', 64, 96); });
  T.xray = ctex(256, 192, (g, w, h) => { g.fillStyle = '#0c1115'; g.fillRect(0, 0, w, h); const film = (x, draw) => { g.save(); g.translate(x, 12); g.fillStyle = '#10171c'; g.fillRect(0, 0, 118, 168); draw(); g.restore(); };
    film(6, () => { g.strokeStyle = 'rgba(220,235,245,0.8)'; g.lineWidth = 5; g.beginPath(); g.ellipse(59, 60, 36, 44, 0, 0, TAU); g.stroke(); g.fillStyle = 'rgba(0,0,0,0.9)'; g.beginPath(); g.ellipse(46, 62, 10, 12, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(72, 62, 10, 12, 0, 0, TAU); g.fill(); g.lineWidth = 3; g.beginPath(); g.moveTo(40, 100); g.lineTo(78, 100); g.stroke(); for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(42 + i * 5, 96); g.lineTo(42 + i * 5, 104); g.stroke(); } });
    film(132, () => { g.strokeStyle = 'rgba(220,235,245,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(59, 10); g.lineTo(59, 160); g.stroke(); for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(59, 40 + i * 12, 44 - i, 7, 0, Math.PI, TAU); g.stroke(); } }); });
  T.bag = ctex(128, 128, (g, w, h) => { g.fillStyle = '#b8ab8a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2000, 0.15); g.fillStyle = '#6a2018'; g.fillRect(10, 20, 108, 30); g.fillStyle = '#f2ecdc'; g.font = `bold 15px ${OSW}`; g.fillText('PERSONAL EFFECTS', 14, 40); g.fillStyle = '#1b2a4a'; g.font = `20px ${PEN}`; g.fillText('Hale, V.  #7', 16, 84); });
  T.notice = ctex(256, 180, (g, w, h) => { g.fillStyle = '#f0ede2'; g.fillRect(0, 0, w, h); g.fillStyle = '#8e1c16'; g.fillRect(0, 0, w, 36); g.fillStyle = '#fff'; g.font = `bold 22px ${OSW}`; g.fillText('MORTUARY — NOTICE', 12, 26); g.fillStyle = '#1a1a1a'; g.font = `17px ${OSW}`; ['The cold room must be kept', 'BELOW 4°C at all times.', 'If the power fails, call', 'Maintenance at once (ext. 212).'].forEach((t, i) => g.fillText(t, 14, 64 + i * 26)); g.fillStyle = '#1b2a4a'; g.font = `22px ${MARK}`; g.save(); g.translate(150, 165); g.rotate(-0.08); g.fillText('keep them cold', 0, 0); g.restore(); });
  T.window = ctex(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0c0c'); gr.addColorStop(1, '#141816'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(210,190,120,0.55)'; g.fillRect(52, 44, 26, 40); g.strokeStyle = 'rgba(200,200,200,0.35)'; g.lineWidth = 1; for (let i = 0; i < w; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i - h, h); g.stroke(); } });
  T.glow = ctex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  M.tile = toon(0xffffff, T.tile); M.floor = toon(0xffffff, T.floor); M.ceil = toon(0xffffff, T.ceil); M.steel = toon(0xffffff, T.steel); M.dsteel = toon(0x5d6569);
  M.sheet = toon(0xffffff, T.sheet); M.black = toon(0x151616); M.rubber = toon(0x1c1c1c); M.wood = toon(0x5c3d25); M.cream = toon(0xe7e1cf); M.green = toon(0x3d5d4a);
  M.skin = toon(0xa9aaa0); M.glove = toon(0xd9892a); M.bag = toon(0x1a1c1d); M.paper = toon(0xece6d6); M.red = toon(0x8e1c16);
  M.lamp = basic(0x551010); M.tube = basic(0x6b7475); M.btn = basic(0x1d3a22); M.box = basic(0x1a2226, { map: T.xray });
  M.fig = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: GRAD });
  M.glowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}

/* ---------------- bodies ---------------- */
function mergeParts(parts) {
  const pos = [], nor = [], col = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
const m4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
const FIGS = {};
// the dead on their feet: gowned, grey, arms hanging. kind: crane (old woman), doe (the river man), hale (burnt)
function figGeo(kind) {
  if (FIGS[kind]) return FIGS[kind];
  const P = [], add = (geo, color, m) => P.push({ geo, color, m });
  const skin = kind === 'hale' ? 0x6f625a : kind === 'doe' ? 0x8e9a95 : 0xb1b0a6, gown = kind === 'hale' ? 0x3a3530 : 0xc9d3d0, dark = 0x0b0b0b;
  const tall = kind === 'crane' ? 0.92 : 1;
  add(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 8), skin, m4(-0.09, 0.4, 0)); add(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 8), skin, m4(0.09, 0.4, 0));
  add(new THREE.CylinderGeometry(0.17, kind === 'doe' ? 0.3 : 0.26, 0.8, 12), gown, m4(0, 1.05, 0, 0, 0, 0, 1, 1, 0.75));
  add(new THREE.CylinderGeometry(0.045, 0.038, 0.78, 7), skin, m4(-0.23, 1.08, 0.02, 0, 0, 0.07)); add(new THREE.CylinderGeometry(0.045, 0.038, 0.78, 7), skin, m4(0.23, 1.08, 0.02, 0, 0, -0.07));
  add(new THREE.SphereGeometry(0.05, 8, 6), skin, m4(-0.25, 0.68, 0.03, 0, 0, 0, 1, 1.8, 1)); add(new THREE.SphereGeometry(0.05, 8, 6), skin, m4(0.25, 0.68, 0.03, 0, 0, 0, 1, 1.8, 1));
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 8), skin, m4(0, 1.52, 0));
  add(new THREE.SphereGeometry(0.115, 14, 10), skin, m4(0, 1.68, 0.01, 0.12, 0, 0, 0.92, 1.22, 1));
  add(new THREE.SphereGeometry(0.02, 8, 6), dark, m4(-0.04, 1.7, 0.1, 0, 0, 0, 1.2, 0.8, 0.6)); add(new THREE.SphereGeometry(0.02, 8, 6), dark, m4(0.04, 1.7, 0.1, 0, 0, 0, 1.2, 0.8, 0.6));
  add(new THREE.SphereGeometry(0.022, 8, 6), dark, m4(0, 1.6, 0.098, 0, 0, 0, 1, 2.0, 0.5));
  if (kind === 'crane') { add(new THREE.SphereGeometry(0.12, 12, 8, 0, TAU, 0, Math.PI / 2), 0x9a9890, m4(0, 1.71, -0.01)); add(new THREE.SphereGeometry(0.06, 10, 8), 0x9a9890, m4(0, 1.74, -0.12)); }
  if (kind === 'doe') { for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; add(new THREE.BoxGeometry(0.025, 0.28, 0.02), 0x1c211f, m4(Math.sin(a) * 0.1, 1.62, Math.cos(a) * 0.09 - 0.03, 0, a, 0)); } }
  if (kind === 'hale') { add(new THREE.SphereGeometry(0.12, 12, 8, 0, TAU, 0, Math.PI / 2.2), 0x1a1614, m4(0, 1.71, -0.01)); }
  const g = mergeParts(P); g.scale(tall, tall, tall); return (FIGS[kind] = g);
}
function makeFigure(kind) { const m = new THREE.Mesh(figGeo(kind), M.fig); m.castShadow = false; m.userData.noRay = true; scene.add(m); m.visible = false; return m; }
// a body under a sheet, lying along local +x (head at -x), with bare feet and a toe tag at +x.
// torso is a separate group so it can sit up.
function sheetBody(parent, len = 1.75) {
  const g = new THREE.Group(); parent.add(g);
  const legs = new THREE.Group(); g.add(legs);
  const sh = mesh(new THREE.CylinderGeometry(0.2, 0.24, len * 0.55, 12, 1), M.sheet, len * 0.2, 0.12, 0, legs); sh.rotation.z = Math.PI / 2; sh.scale.z = 0.62;
  const drape = mesh(new THREE.BoxGeometry(len * 0.58, 0.02, 0.56), M.sheet, len * 0.2, 0.02, 0, legs);
  [-0.07, 0.07].forEach(z => { const f = mesh(new THREE.BoxGeometry(0.08, 0.13, 0.07), M.skin, len * 0.5 + 0.03, 0.14, z, legs); });
  const tag = mesh(new THREE.BoxGeometry(0.004, 0.06, 0.04), M.paper, len * 0.5 + 0.08, 0.13, 0.07, legs); tag.rotation.y = 0.3;
  const torso = new THREE.Group(); torso.position.set(-len * 0.08, 0.1, 0); g.add(torso);
  const ch = mesh(new THREE.CylinderGeometry(0.24, 0.22, len * 0.42, 12, 1), M.sheet, -len * 0.2, 0.04, 0, torso); ch.rotation.z = Math.PI / 2; ch.scale.z = 0.64;
  const head = mesh(new THREE.SphereGeometry(0.15, 14, 10), M.sheet, -len * 0.45, 0.07, 0, torso); head.scale.set(1.2, 0.85, 0.95);
  const dr2 = mesh(new THREE.BoxGeometry(len * 0.5, 0.02, 0.58), M.sheet, -len * 0.22, -0.08, 0, torso);
  const hand = mesh(new THREE.BoxGeometry(0.18, 0.05, 0.08), M.skin, -len * 0.08, -0.02, 0.3, torso); hand.visible = false;
  g.userData = { legs, torso, hand }; g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

/* ---------------- geometry ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x050606, 0.06);
  camera.far = 40; camera.near = 0.03; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  // shell
  const fl = plane(W * 2, D * 2, M.floor, 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const ce = plane(W * 2, D * 2, M.ceil, 0, H, 0); ce.rotation.x = Math.PI / 2;
  const wall = (w, h, x, y, z, ry) => { const p = plane(w, h, M.tile, x, y, z, ry); p.material = toon(0xffffff, T.tile.clone()); p.material.map.repeat.set(w / 2.2, h / 2.3); p.material.map.needsUpdate = true; return p; };
  wall(W * 2, H, 0, H / 2, D, Math.PI);                                  // south
  wall(D * 2, H, -W, H / 2, 0, Math.PI / 2);                             // west
  // east wall with a doorway at z 0.65..1.75
  wall(D + 0.65, H, W, H / 2, (-D + 0.65) / 2, -Math.PI / 2);
  wall(D - 1.75, H, W, H / 2, (1.75 + D) / 2, -Math.PI / 2);
  wall(1.1, H - 2.12, W, (H + 2.12) / 2, 1.2, -Math.PI / 2);
  // north wall: tiles round the drawer bank
  wall(W * 2, H, 0, H / 2, -D, 0);
  // skirting & a grimy dado line
  [[0, D - 0.01, Math.PI, W * 2], [0, -D + 0.01, 0, W * 2]].forEach(([x, z, ry, w]) => { const s = plane(w, 0.12, M.dsteel, x, 0.06, z, ry); });
  // floor drain
  const dr = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 16), M.black, 0.3, 0.005, 0.5); dr.castShadow = false;

  // the drawer bank
  box(DR.w * 3 + 0.14, 2.3, 0.08, M.dsteel, 0, 1.15, -D + 0.04);
  O.drawers = {};
  for (let n = 1; n <= 9; n++) {
    const p = drawerPos(n), g = grp(p.x, p.y, -D + 0.09);
    const front = new THREE.Group(); g.add(front);
    box(DR.w - 0.06, DR.h - 0.06, 0.05, M.steel, 0, 0, 0.025, front);
    box(0.32, 0.05, 0.05, M.dsteel, 0, -0.08, 0.075, front); box(0.05, 0.1, 0.04, M.dsteel, -0.14, -0.06, 0.06, front); box(0.05, 0.1, 0.04, M.dsteel, 0.14, -0.06, 0.06, front);
    plane(0.34, 0.085, basic(0xffffff, { map: T.card[n] }), 0, 0.17, 0.052, 0, front);
    plane(0.09, 0.09, basic(0xffffff, { map: T.num[n] }), -0.33, 0.2, 0.052, 0, front);
    // inside: the tray (slides out with the front)
    const tray = new THREE.Group(); front.add(tray); tray.position.z = 0;
    box(0.66, 0.03, 1.9, M.steel, 0, -0.24, -0.95, tray);
    const cav = box(DR.w - 0.08, DR.h - 0.08, 0.02, M.black, 0, 0, -0.02, g); cav.castShadow = false;
    let body = null;
    if (CARDS[n] !== 'VACANT') { body = sheetBody(tray, 1.7); body.rotation.y = -Math.PI / 2; body.position.set(0, -0.23, -0.95); }
    O.drawers[n] = { g, front, tray, body, open: 0 };
  }
  // Victor's effects bag on his tray
  const d7 = O.drawers[7];
  O.bag7 = grp(0.18, -0.2, -0.22, d7.tray); const bb = box(0.26, 0.1, 0.18, toon(0xffffff, T.bag), 0, 0, 0, O.bag7); bb.rotation.y = 0.2;
  O.keysOnTray = grp(-0.05, 0.06, 0.02, O.bag7); mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 12), M.dsteel, 0, 0, 0, O.keysOnTray).rotation.x = Math.PI / 2; box(0.05, 0.004, 0.015, toon(0xb5a060), 0.04, 0, 0.01, O.keysOnTray); box(0.05, 0.004, 0.015, toon(0xc02a1e), 0.02, 0.003, -0.02, O.keysOnTray);
  // thermometer dial over the bank
  O.dial = grp(0, 2.5, -D + 0.1); cyl(0.26, 0.26, 0.05, M.dsteel, 0, 0, 0, O.dial, 24).rotation.x = Math.PI / 2;
  plane(0.46, 0.46, basic(0xffffff, { map: T.dial, transparent: true }), 0, 0, 0.028, 0, O.dial);
  // compressor grille above the bank
  for (let i = 0; i < 6; i++) box(1.2, 0.02, 0.03, M.dsteel, 1.9, 2.35 + i * 0.05, -D + 0.03);
  plane(0.46, 0.33, basic(0xffffff, { map: T.notice }), -1.95, 1.55, -D + 0.012, 0);

  // exit door (east wall), with its wired window and the release button
  O.door = grp(W - 0.03, 0, 0.65); O.doorLeaf = grp(0, 0, 0, O.door);
  box(0.06, 2.1, 1.1, M.dsteel, 0, 1.05, 0.55, O.doorLeaf);
  plane(0.28, 0.36, basic(0xffffff, { map: T.window }), -0.035, 1.55, 0.55, -Math.PI / 2, O.doorLeaf);
  box(0.06, 0.05, 0.6, M.steel, -0.07, 1.0, 0.55, O.doorLeaf);
  box(0.04, 2.16, 0.06, M.black, -0.02, 1.08, -0.02, O.door); box(0.04, 2.16, 0.06, M.black, -0.02, 1.08, 1.12, O.door); box(0.04, 0.06, 1.2, M.black, -0.02, 2.14, 0.55, O.door);
  O.btnBox = grp(W - 0.03, 1.3, 0.35); box(0.04, 0.2, 0.14, M.dsteel, 0, 0, 0, O.btnBox);
  O.btn = cyl(0.035, 0.035, 0.03, M.btn, -0.03, 0.02, 0, O.btnBox, 16); O.btn.rotation.z = Math.PI / 2; O.btn.material = M.btn.clone();
  // red emergency lamp over the door
  O.redLamp = cyl(0.07, 0.09, 0.08, M.lamp, W - 0.08, 2.48, 1.2); O.redLamp.material = M.lamp.clone();
  // x-ray lightbox (east wall, north end)
  O.xbox = grp(W - 0.05, 1.5, -1.55); box(0.06, 0.66, 0.92, M.dsteel, 0, 0, 0, O.xbox);
  O.xface = plane(0.86, 0.6, M.box, -0.035, 0, 0, -Math.PI / 2, O.xbox); O.xface.material = M.box.clone();

  // the fuse panel (west wall)
  O.panel = grp(-W + 0.02, 1.45, -1.0);
  box(0.12, 0.72, 0.52, M.green, 0.06, 0, 0, O.panel);
  O.panelDoor = grp(0.125, 0, -0.26, O.panel); box(0.02, 0.7, 0.5, M.green, 0, 0, 0.25, O.panelDoor);
  box(0.01, 0.04, 0.04, M.black, 0.012, 0.02, 0.44, O.panelDoor); plane(0.3, 0.07, basic(0xe8d24a), 0.012, 0.25, 0.25, Math.PI / 2, O.panelDoor);
  O.panelIn = grp(0.1, 0, 0, O.panel); O.panelIn.visible = false;
  plane(0.44, 0.62, basic(0x202624), 0.001, 0, 0, Math.PI / 2, O.panelIn);
  O.fuses = {}; ['MAIN', 'LIGHTS', 'COLD', 'DOOR'].forEach((k, i) => { const f = cyl(0.025, 0.025, 0.11, toon(0xd8d2c0), 0.02, 0.2 - i * 0.12, -0.05, O.panelIn, 10); O.fuses[k] = f; });
  O.lever = grp(0.02, -0.2, 0.12, O.panelIn); box(0.03, 0.18, 0.03, M.black, 0.02, 0.07, 0, O.lever); O.lever.rotation.z = 0.6;

  // desk, clipboard, clock, chair
  O.desk = grp(-1.6, 0, D - 0.4);
  tbox(1.3, 0.05, 0.62, M.wood, 0, 0.76, 0, O.desk); [[-0.6, -0.26], [0.6, -0.26], [-0.6, 0.26], [0.6, 0.26]].forEach(([x, z]) => box(0.05, 0.75, 0.05, M.dsteel, x, 0.375, z, O.desk));
  O.clip = grp(-0.15, 0.79, -0.05, O.desk); box(0.24, 0.012, 0.32, toon(0x6b4a2a), 0, 0, 0, O.clip); plane(0.22, 0.28, M.paper, 0, 0.008, 0.01, 0, O.clip).rotation.x = -Math.PI / 2; box(0.1, 0.02, 0.03, M.dsteel, 0, 0.012, -0.14, O.clip);
  cyl(0.04, 0.035, 0.1, toon(0xe3ddcc), 0.3, 0.84, 0.05, O.desk); cyl(0.07, 0.07, 0.02, M.dsteel, -0.45, 0.8, 0.12, O.desk);
  const lampArm = grp(0.48, 0.78, -0.12, O.desk); cyl(0.07, 0.08, 0.03, M.black, 0, 0.015, 0, lampArm); box(0.02, 0.35, 0.02, M.black, 0, 0.2, 0, lampArm); cyl(0.04, 0.09, 0.12, M.black, 0.05, 0.38, 0, lampArm).rotation.z = 0.7;
  O.clock = grp(-1.6, 2.1, D - 0.02); cyl(0.17, 0.17, 0.05, M.black, 0, 0, 0, O.clock, 20).rotation.x = Math.PI / 2; plane(0.3, 0.3, basic(0xffffff, { map: T.clock, transparent: true }), 0, 0, -0.028, Math.PI, O.clock);
  O.chair = grp(-1.5, 0, D - 1.05); tbox(0.45, 0.04, 0.42, M.wood, 0, 0.46, 0, O.chair); [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([x, z]) => box(0.03, 0.46, 0.03, M.dsteel, x, 0.23, z, O.chair)); box(0.45, 0.4, 0.03, M.wood, 0, 0.7, 0.2, O.chair);

  // autopsy table with the covered body, instrument trolley with the gloves
  O.table = grp(-0.6, 0, 0.4);
  box(2.0, 0.06, 0.78, M.steel, 0, 0.88, 0, O.table); box(2.02, 0.05, 0.05, M.dsteel, 0, 0.93, 0.39, O.table); box(2.02, 0.05, 0.05, M.dsteel, 0, 0.93, -0.39, O.table);
  cyl(0.12, 0.2, 0.84, M.dsteel, 0, 0.42, 0, O.table, 12); box(0.8, 0.05, 0.6, M.dsteel, 0, 0.03, 0, O.table);
  O.tbody = sheetBody(O.table, 1.75); O.tbody.position.set(0, 0.91, 0);
  O.trolley = grp(-0.6, 0, 1.4); box(0.8, 0.03, 0.45, M.steel, 0, 0.82, 0, O.trolley); box(0.8, 0.03, 0.45, M.steel, 0, 0.3, 0, O.trolley); [[-0.37, -0.2], [0.37, -0.2], [-0.37, 0.2], [0.37, 0.2]].forEach(([x, z]) => box(0.02, 0.82, 0.02, M.dsteel, x, 0.41, z, O.trolley));
  for (let i = 0; i < 5; i++) box(0.16, 0.008, 0.012, M.steel, -0.25 + i * 0.06, 0.84, -0.1, O.trolley).rotation.y = 0.1 * i;
  O.gloves = grp(0.2, 0.84, 0.05, O.trolley); box(0.2, 0.02, 0.1, M.glove, 0, 0, 0, O.gloves).rotation.y = 0.3; box(0.18, 0.02, 0.09, M.glove, 0.03, 0.02, 0.06, O.gloves).rotation.y = -0.2;

  // gurney with a body bag, by the x-ray box
  O.gurney = grp(2.25, 0, -1.2); box(0.62, 0.04, 1.9, M.steel, 0, 0.78, 0, O.gurney); [[-0.28, -0.88], [0.28, -0.88], [-0.28, 0.88], [0.28, 0.88]].forEach(([x, z]) => { box(0.03, 0.74, 0.03, M.dsteel, x, 0.39, z, O.gurney); cyl(0.05, 0.05, 0.03, M.black, x, 0.05, z, O.gurney).rotation.z = Math.PI / 2; });
  O.bagBody = mesh(new THREE.CapsuleGeometry(0.22, 1.3, 4, 12), M.bag, 0, 0.95, 0, O.gurney); O.bagBody.rotation.x = Math.PI / 2; O.bagBody.scale.set(1.2, 1, 0.7);
  O.zip = box(0.012, 0.012, 1.4, M.dsteel, 0, 1.1, 0, O.gurney);
  O.bagGap = box(0.1, 0.01, 0.6, M.black, 0, 1.105, -0.45, O.gurney); O.bagGap.scale.z = 0.01;
  O.bagHand = grp(0.32, 0.92, 0.1, O.gurney); box(0.04, 0.34, 0.05, M.skin, 0, -0.14, 0, O.bagHand); box(0.07, 0.1, 0.03, M.skin, 0, -0.34, 0, O.bagHand); O.bagHand.visible = false;

  // sink and cabinet (west wall, south end)
  O.sink = grp(-W + 0.35, 0, 1.7); box(0.6, 0.85, 0.7, M.steel, 0, 0.425, 0, O.sink); box(0.5, 0.12, 0.55, M.black, 0, 0.8, 0, O.sink); cyl(0.015, 0.015, 0.25, M.dsteel, -0.2, 1.0, 0, O.sink).rotation.z = 0.6;
  O.cab = grp(-W + 0.3, 0, 2.55); box(0.55, 1.9, 0.8, M.cream, 0, 0.95, 0, O.cab);

  // ceiling tubes
  O.tube1 = grp(-1.2, H - 0.06, 0); box(1.3, 0.06, 0.22, M.dsteel, 0, 0, 0, O.tube1); O.tubeGlow1 = box(1.2, 0.03, 0.1, M.tube, 0, -0.04, 0, O.tube1); O.tubeGlow1.material = M.tube.clone();
  O.tube2 = grp(1.4, H - 0.06, 0); box(1.3, 0.06, 0.22, M.dsteel, 0, 0, 0, O.tube2); O.tubeGlow2 = box(1.2, 0.03, 0.1, M.tube, 0, -0.04, 0, O.tube2); O.tubeGlow2.material = M.tube.clone();

  // the corridor beyond the door: dark, with the lift open at the far end
  const cf = plane(6, 1.3, M.floor, W + 3, 0.001, 1.2); cf.rotation.x = -Math.PI / 2;
  plane(6, H, M.tile, W + 3, H / 2, 0.55, 0); plane(6, H, M.tile, W + 3, H / 2, 1.85, Math.PI);
  const cc = plane(6, 1.3, M.ceil, W + 3, H, 1.2); cc.rotation.x = Math.PI / 2;
  O.lift = plane(1.1, 2.1, basic(0xc9b36a), W + 5.95, 1.05, 1.2, -Math.PI / 2);
  // the dead on their feet
  O.crane = makeFigure('crane'); O.doe = makeFigure('doe'); O.hale = makeFigure('hale');
  O.craneEye = new THREE.Object3D(); O.craneEye.position.y = 1.25; O.crane.add(O.craneEye);   // look-checks aim at her chest, not her feet
  O.spark = new THREE.Sprite(M.glowS.clone()); O.spark.scale.set(0.5, 0.5, 1); O.spark.material.color.set(0xcfe8ff); O.spark.visible = false; layer1(O.spark); scene.add(O.spark);

  buildLights();
  colliders.length = 0;
  const col = (x0, x1, z0, z1) => addCol('c', x0, x1, z0, z1);
  col(-W - 1, W + 1, -D - 1, -D + 0.12); col(-W - 1, W + 1, D - 0.02, D + 1); col(-W - 1, -W + 0.02, -D, D); col(W - 0.02, W + 1, -D, D);
  col(-1.62, 0.42, 0.0, 0.8);          // table
  col(-1.02, -0.18, 1.16, 1.64);       // trolley
  col(1.93, 2.57, -2.17, -0.23);       // gurney
  col(-2.28, -0.92, D - 0.72, D);      // desk
  col(-W, -W + 0.68, 1.33, 2.97);      // sink + cabinet
  O.colChair = col(-1.75, -1.25, D - 1.28, D - 0.82);
  O.colDrawer = {}; for (const n of [2, 5, 7]) { const p = drawerPos(n); O.colDrawer[n] = addCol('d' + n, p.x - 0.36, p.x + 0.36, -D, -D + 0.1, false); }
  scene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
}

function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x7d8e96, 0x2a1512, 0.22); scene.add(L.hemi);
  L.red = new THREE.PointLight(0xff2c1c, 7, 0, 1.6); L.red.position.set(W - 0.3, 2.35, 1.2); scene.add(L.red);
  L.tube = new THREE.PointLight(0xd9f2ff, 0, 0, 1.8); L.tube.position.set(-1.2, H - 0.25, 0); scene.add(L.tube);
  L.tube2 = new THREE.PointLight(0xd9f2ff, 0, 0, 1.8); L.tube2.position.set(1.4, H - 0.25, 0); scene.add(L.tube2);
  L.box = new THREE.PointLight(0xe4f2ff, 0, 0, 1.6); L.box.position.set(W - 0.5, 1.5, -1.55); scene.add(L.box);
  L.btn = new THREE.PointLight(0x44ff66, 0, 0, 2); L.btn.position.set(W - 0.45, 1.32, 0.35); scene.add(L.btn);
}


/* =====================================================================
   COLD STORAGE · part B: items, documents, voices, hints
   ===================================================================== */
const ITEMS = {
  keys: { name: 'Victor\'s key ring', short: 'Key ring', desc: 'Six keys on a steel ring, still warm from his belt. One has red tape wound round it, with PANEL scratched into the tape.' },
  gloves: { name: 'Rubber gloves', short: 'Gloves', desc: 'Thick orange rubber gloves from the instrument trolley, still powdered inside.' },
  fuse: { name: 'Fuse', short: 'Fuse', desc: 'A ceramic cartridge fuse, borrowed from the panel.' },
};
const HEARD = {
  doe1: { title: 'From inside drawer 2', text: '"It\'s so cold in here."' },
  doe2: { title: 'From inside drawer 2, again', text: '"Let me out. Please. I\'m not dead. I\'m not dead."' },
  doe3: { title: 'Drawer 2, when the light burst', text: '"Why is it getting warm?"' },
  crane1: { title: 'Right behind you', text: 'An old woman\'s voice: "Is it morning yet, dear?"' },
  crane2: { title: 'Somewhere in the dark', text: '"I can\'t find my bed."' },
  victor: { title: 'From drawer 7, as you took the keys', text: '"Those are mine."' },
};
const DOCS = {
  clip: { title: 'The night book (clipboard)', style: 'clip', pages: [
    `<h3>St Agnes County Hospital &middot; Mortuary &middot; Night book</h3><p class="sub3">Sunday 3 February 1974 &middot; Admissions since 6 p.m.</p>
     <table class="intake"><tr><th>Drawer</th><th>Name</th><th>In</th><th>Notes</th></tr>
     <tr><td>2</td><td>Unknown male</td><td>9.15</td><td>From the river. No I.D.</td></tr>
     <tr><td>5</td><td>Mrs Edith Crane, 81</td><td>10.40</td><td>Ward 6. Natural causes. Family in the morning.</td></tr>
     <tr><td>7</td><td>Victor Hale, 44</td><td>7.40</td><td>Hospital electrician. Electrocuted at substation B. Tool belt and keys bagged with him.</td></tr>
     <tr><td>9</td><td>T. Rourke</td><td>Fri</td><td>For collection.</td></tr>
     <tr><td>Table</td><td>Unknown</td><td>11.55</td><td>Post-mortem 9 a.m. Do not move.</td></tr></table>`,
    `<div class="pen"><p>New fella &mdash; welcome to nights. Three things.</p>
     <p><b>1.</b> Keep them <u>COLD</u>. Below 4. If the power goes, the backup's dead (has been since August), so fix it quick.</p>
     <p><b>2.</b> The fuse panel's locked, and the only key is on Victor Hale's ring. He never gave it back. Poor sod came in at 7.40 with it still on his belt. <b>Drawer 7.</b> Don't be squeamish.</p>
     <p><b>3.</b> If you hear knocking from the drawers, it's the pipes. It's always the pipes.</p>
     <p class="sig">&mdash; Harold</p></div>`,
  ], onRead: () => flag('readLog') },
  note: { title: 'Taped inside the panel door', style: 'marker', pages: [
    `<p>MAIN BLOWN? (again)</p><p>Borrow the <b>LIGHTS</b> fuse and put it in MAIN.<br>You'll be in the dark, but you'll be out.</p><p class="big">NEVER take the COLD ROOM fuse.<br>NEVER.</p><p>Then throw the big switch. &mdash; H.</p>`,
  ], onRead: () => flag('readNote') },
  card: { title: 'Victor\'s union card', style: 'print', pages: [
    `<h3>International Brotherhood of Electrical Workers</h3><p>Local 38 &middot; Member: <b>Victor J. Hale</b> &middot; Journeyman wireman<br>Dues paid to 31 March 1974.</p><p class="muted">On the back, in pencil: "Never work it live."</p>`,
  ] },
};

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'Where do I start?', when: s => s.flags.readLog ? 'solved' : 'active', tiers: [
    'The desk under the stopped clock has a clipboard on it.',
    'Read both pages. Harold, the evening attendant, left you a note.',
    'The note says the fuse panel key is on a dead man\'s key ring, in drawer 7.',
    'Read the clipboard on the desk, then open drawer 7 and take Victor\'s keys.' ] },
  { id: 'door', title: 'The door', when: s => s.flags.escaped ? 'solved' : 'active', tiers: [
    'The door has an electric lock, and the power is out.',
    'You need the power back on. Everything runs through the fuse panel on the far wall.',
    'Once there\'s power, the button beside the door lights up green.',
    'Get the power on at the fuse panel, then press the green button by the door.' ] },
  { id: 'drawer', title: 'Victor\'s drawer', when: s => !s.flags.readLog ? 'hidden' : s.flags.keys ? 'solved' : 'active', tiers: [
    'Harold\'s note says who has the only key to the fuse panel.',
    'Victor Hale, the electrician, came in tonight with his keys still on his belt.',
    'He\'s in drawer 7. The drawers have name cards: look for HALE, V.',
    'Open drawer 7 (bottom row, on the left) and take the key ring from the bag at his feet.' ] },
  { id: 'panel', title: 'The locked fuse panel', when: s => !s.flags.triedPanel ? 'hidden' : s.flags.panelOpen ? 'solved' : 'active', tiers: [
    'It takes a key.',
    'Harold\'s note says where the only key is.',
    'It\'s on Victor Hale\'s key ring, in drawer 7. The panel key has red tape on it.',
    'Take the key ring from drawer 7, then use the panel.' ] },
  { id: 'gloves', title: 'Touching the fuses', when: s => !(s.flags.shocked || s.flags.panelOpen) ? 'hidden' : s.flags.gloves ? 'solved' : 'active', tiers: [
    'The yellow sticker on the panel door is a warning.',
    'You need rubber gloves.',
    'There are rubber gloves on the instrument trolley beside the covered body.',
    'Take the orange rubber gloves from the trolley next to the table, then handle the fuses.' ] },
  { id: 'power', title: 'Getting the power back', when: s => !s.flags.panelOpen ? 'hidden' : s.flags.power ? 'solved' : 'active', tiers: [
    'The MAIN fuse is blown, and there\'s no spare.',
    'Harold taped a note inside the panel door.',
    'Borrow the fuse from LIGHTS and put it in MAIN. Leave COLD ROOM alone.',
    'With the gloves on: pull the blown MAIN fuse, pull the LIGHTS fuse, put it in MAIN, then throw the main switch.' ] },
];


/* =====================================================================
   COLD STORAGE · part C: the fuse board, the warming, scares, sound, ending
   ===================================================================== */
const heard = id => { if (!S.heard.includes(id)) { S.heard.push(id); save(); } };
const look = (txt, ms = 4800) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const behindPos = (d = 0.6) => new THREE.Vector3(P.x + Math.sin(G.yaw) * d, G.eye - 0.1, P.z + Math.cos(G.yaw) * d);
const V = { fl: { on: true, t: 2 }, tube: 0, dialT: -1, craneT: 20, craneWatch: null, knockT: 20, warmT: 30, dripT: 3, climax: -1, rev: 0 };
const FUSE_NAMES = { MAIN: 'Main', LIGHTS: 'Lights', COLD: 'Cold room', DOOR: 'Door &amp; X-ray' };
function tempStr() { return (Math.round(S.temp * 10) / 10).toFixed(1); }

/* ---------------- the dial ---------------- */
function drawDial() {
  const t = T.dial, g = t.userData.g, w = t.userData.canvas.width, c = w / 2;
  g.fillStyle = '#ebe7db'; g.beginPath(); g.arc(c, c, c - 4, 0, TAU); g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a2a2a'; g.stroke();
  const a0 = Math.PI * 0.75, span = Math.PI * 1.5, v2a = v => a0 + (v + 5) / 25 * span;
  g.lineWidth = 16; g.strokeStyle = '#b3261e'; g.beginPath(); g.arc(c, c, c - 30, v2a(4), v2a(20)); g.stroke();
  g.lineWidth = 16; g.strokeStyle = '#2f6d8a'; g.beginPath(); g.arc(c, c, c - 30, v2a(-5), v2a(4)); g.stroke();
  g.fillStyle = '#1a1a1a'; g.font = `bold 20px ${OSW}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let v = -5; v <= 20; v += 5) { const a = v2a(v); g.fillText(String(v), c + Math.cos(a) * (c - 58), c + Math.sin(a) * (c - 58)); }
  g.font = `bold 18px ${OSW}`; g.fillText('COLD ROOM °C', c, c + 56);
  const a = v2a(clamp(S ? S.temp : 2, -5, 20)); g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * (c - 36), c + Math.sin(a) * (c - 36)); g.stroke();
  g.fillStyle = '#111'; g.beginPath(); g.arc(c, c, 10, 0, TAU); g.fill();
  t.needsUpdate = true;
}

/* ---------------- drawers ---------------- */
function setDrawer(n, v, dur = 0.9, sound = true) {
  const d = O.drawers[n]; const from = d.front.position.z; S.open[n] = v; save();
  if (sound) { sScrape(new THREE.Vector3(drawerPos(n).x, drawerPos(n).y, -D + 0.3), dur * 0.9, 0.4); sClick(null, 0.2, 700); }
  tween(dur, k => { d.front.position.z = lerp(from, v, k); });
  if (O.colDrawer[n]) O.colDrawer[n].on = v > 0.3;
  if (O.colDrawer[n] && v > 0.3) { const p = drawerPos(n); O.colDrawer[n].minZ = -D; O.colDrawer[n].maxZ = -D + 0.1 + v; }
}
function openDrawer7() {
  setDrawer(7, 0.95, 1.2); flag('d7');
  after(1.0, () => subtitle('', '<i>The tray rolls out on its runners. Under the sheet, the shape of a big man. His feet are black at the toes. A canvas bag sits by them.</i>', 5600));
}
function bagContents() {
  openContainer('Victor Hale\'s effects', 'A canvas bag at his feet, tied with string.', [
    { name: 'Key ring', desc: 'Six keys. One has red tape round it, with PANEL scratched into the tape.', take: 'keys', onTake: takeKeys },
    { name: 'Union card', desc: 'IBEW Local 38. Something is pencilled on the back.', read: 'card' },
    { name: 'Wallet', desc: 'Nine dollars and a photo of two girls on a beach.' },
  ]);
}
function takeKeys() {
  flag('keys'); O.keysOnTray.visible = false;
  after(1.0, () => { heard('victor'); UI.kind === 'box' && UI.close(true); say('', 'Those are mine.', { clip: 'c_victor', fx: 'muffled', pos: POS.d7, volume: 1.2, speed: 0.9 }); G.fearT = 0.9; sStinger(0.6);
    const b = O.drawers[7].body; if (b) b.userData.hand.visible = true; });
}

/* ---------------- the fuse board ---------------- */
function openFuses() {
  openPanel('<div id="fusep"></div>', () => refreshFuses());
}
function refreshFuses(msg = '') {
  const p = $('#fusep'); if (!p) return;
  const f = S.fuses, hand = S.hand;
  const slot = k => {
    const st = f[k]; let btn = '';
    if (st && !hand) btn = `<button class="btn" data-pull="${k}">Pull it</button>`;
    else if (!st && hand) btn = `<button class="btn" data-put="${k}">Put the fuse in</button>`;
    else if (st) btn = '<span class="muted" style="font-size:11px">Your hand is full</span>';
    else btn = '<span class="muted" style="font-size:11px">Empty</span>';
    const look = st === 'good' ? 'fz good' : st === 'blown' ? 'fz blown' : 'fz none';
    return `<div class="grp"><span class="lbl">${FUSE_NAMES[k]}</span><span class="${look}" title="${st || 'empty'}"></span>${btn}</div>`;
  };
  p.innerHTML = `<h3>Fuse board &middot; Mortuary</h3>
    ${['MAIN', 'LIGHTS', 'COLD', 'DOOR'].map(slot).join('')}
    <div class="grp"><span class="lbl">Main switch</span><span class="muted" style="font-size:12px">${S.main ? 'ON' : 'OFF'}</span><button class="btn ${S.main ? '' : 'primary'}" id="fMain">${S.main ? (S.flags.power ? 'Leave it on' : 'Switch it off') : 'Throw it on'}</button></div>
    <p class="muted" style="font-size:12px;margin:10px 0 0">In your hand: ${hand ? `the ${FUSE_NAMES[hand].toLowerCase()} fuse` : 'nothing'}${has('gloves') ? ' &middot; gloves on' : ''}</p>
    ${msg ? `<p style="font-size:12.5px;margin:10px 0 0;color:#e7dec6">${msg}</p>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn" id="fNote">Read the taped note</button><button class="btn" id="fBack">Step back</button></div>`;
  p.querySelectorAll('[data-pull]').forEach(b => b.onclick = () => pullFuse(b.dataset.pull));
  p.querySelectorAll('[data-put]').forEach(b => b.onclick = () => putFuse(b.dataset.put));
  $('#fMain').onclick = () => throwMain();
  $('#fNote').onclick = () => { closePanel(true); openDoc('note'); };
  $('#fBack').onclick = () => closePanel();
}
function gloved() {
  if (has('gloves')) return true;
  if (G.time < (G.lockout || 0)) { refreshFuses('Your arm is still numb. Give it a few seconds.'); return false; }
  shock(); return false;
}
function pullFuse(k) {
  if (!gloved()) return;
  sClick(POS.panel, 0.5, 1500);
  if (S.fuses[k] === 'blown') { S.fuses[k] = null; save(); showFuses(); refreshFuses('The main fuse is cracked and black. You drop it in the sink. There\'s no spare.'); return; }
  S.fuses[k] = null; S.hand = k; give('fuse', true); save(); showFuses();
  if (k === 'COLD') {
    S.wrong++; S.temp += 1.5; save(); bangAll(); G.fearT = 1; sStinger(0.9);
    refreshFuses('The second it leaves its clips, every drawer in the wall bangs at once.'); return;
  }
  if (S.main) powerCheck();
  refreshFuses();
}
function putFuse(k) {
  if (!gloved()) return;
  S.fuses[k] = 'good'; S.hand = null; S.inv = S.inv.filter(i => i !== 'fuse'); renderInv(); save(); showFuses(); sThunk(POS.panel, 0.4, 260);
  if (S.main) powerCheck();
  refreshFuses(k === 'MAIN' ? 'The fuse snaps into the main clips.' : '');
}
function throwMain() {
  if (S.main) { if (S.flags.power) { refreshFuses('Leave it on.'); return; } S.main = false; save(); sThunk(POS.panel, 0.7, 90); O.lever.rotation.z = 0.6; powerCheck(); refreshFuses('The switch clunks down. Dark again.'); return; }
  if (!gloved()) return;
  const f = S.fuses;
  if (f.MAIN !== 'good') { spark(); refreshFuses(f.MAIN === 'blown' ? 'The switch won\'t hold. The main fuse is blown.' : 'Nothing happens. There\'s no fuse in the main.'); return; }
  if (f.COLD !== 'good') { S.wrong++; save(); spark(); bangAll(); refreshFuses('The main won\'t hold without the cold-room circuit. It bangs back down in a shower of sparks.'); return; }
  S.main = true; save(); O.lever.rotation.z = -0.6; sThunk(POS.panel, 1, 70);
  powerCheck(true);
  if (!S.flags.power) refreshFuses();
}
// what the mains does with the fuses in place
function powerCheck(justOn) {
  const f = S.fuses, on = S.main && f.MAIN === 'good' && f.COLD === 'good';
  const door = on && f.DOOR === 'good', lights = on && f.LIGHTS === 'good';
  V.mainsLights = lights; V.doorLive = door; V.cold = on;
  if (on && door && !lights && !S.flags.power) { flag('power'); closePanel(true); climax(); return; }
  if (on && lights && !door && justOn) {
    S.wrong++; save(); flag('wrongLights');
    subtitle('', '<i>The ceiling lights stutter on, hard and white. The cold room starts to hum. But the button by the door stays dark.</i>', 6000);
    // in the full light, the ones who've left their drawers are standing in the corner, facing the wall
    showCornerDead(true); after(0.4, () => sStinger(0.8));
  }
  if (!lights) showCornerDead(false);
}
function showCornerDead(on) {
  const spots = [[-2.9, -2.45, -3.3], [-2.45, -2.6, -3.4], [-3.05, -1.95, -3.6]];
  [O.crane, O.doe, O.hale].forEach((f, i) => { if (on) { const [x, z] = spots[i]; f.position.set(x, 0, z); f.rotation.y = Math.atan2(-3.5 - x, -3.5 - z); } f.visible = on; });
  if (!on && S.flags.craneOut) O.crane.visible = false;
}
function showFuses() { for (const k in O.fuses) { const st = S.fuses[k]; O.fuses[k].visible = !!st; O.fuses[k].material.color.set(st === 'blown' ? 0x2a2522 : 0xd8d2c0); } }
function spark() {
  sThunk(POS.panel, 0.9, 80); for (let i = 0; i < 6; i++) after(i * 0.05, () => sClick(POS.panel, 0.6, 3000 + i * 300));
  O.spark.position.copy(POS.panel).add(new THREE.Vector3(0.25, 0, 0)); O.spark.visible = true; G.flash = 0.35; after(0.25, () => O.spark.visible = false);
}
function shock() {
  flag('shocked'); S.wrong++; save(); G.lockout = G.time + 5;
  spark(); G.red = 0.5; G.shake = 0.6; G.fearT = 0.9; sHeart(5, 0.5, 0.6);
  refreshFuses('A crack and a blue flash. Your arm goes numb to the elbow. The sticker on the door said gloves.');
  // and for a second she's right beside you
  if (S.flags.craneOut) { const p = behindPos(-0.9); O.crane.position.set(p.x + Math.cos(G.yaw) * 0.6, 0, p.z - Math.sin(G.yaw) * 0.6); O.crane.rotation.y = Math.atan2(P.x - O.crane.position.x, P.z - O.crane.position.z); O.crane.visible = true; after(0.9, () => { O.crane.visible = false; }); }
}
function penalty() { shock(); }
function bangAll() { for (let n = 1; n <= 9; n++) { const p = drawerPos(n); after(rand(0, 0.25), () => sKnock(new THREE.Vector3(p.x, p.y, -D + 0.2), 1.1, 0, 1)); } G.shake = Math.max(G.shake || 0, 0.5); }

/* ---------------- the power comes back ---------------- */
function climax() {
  V.climax = 0; G.fearT = 1;
  subtitle('', '<i>The main switch slams home. Somewhere behind the drawers, the compressor shudders and starts. The knocking stops.</i>', 5200);
  compressor(true);
  after(1.6, () => {
    // the lightbox is on the door circuit: it flickers up behind you, and someone is standing between you and the door
    const toDoor = new THREE.Vector3(POS.btn.x - P.x, 0, POS.btn.z - P.z); const dd = toDoor.length(); toDoor.normalize();
    const d = clamp(dd * 0.45, 1.1, 1.8); const cx = clamp(P.x + toDoor.x * d, -W + 0.4, W - 0.4), cz = clamp(P.z + toDoor.z * d, -D + 0.5, D - 0.4);
    O.crane.position.set(cx, 0, cz); O.crane.rotation.y = Math.atan2(P.x - cx, P.z - cz); O.crane.visible = true;
    V.box = 1; V.reveal = { t: 0, seen: 0 };
    heard('crane2'); playClip('c_crane2', { fx: 'whisper', pos: new THREE.Vector3(cx, 1.6, cz), volume: 1.2, speed: 0.92 });
    subtitle('', '<i>Behind you, the X-ray box flickers into light.</i>', 3600);
  });
}
function endReveal() {
  V.reveal = null; sStinger(1); G.shake = 0.6; G.fearT = 1; O.crane.visible = false; V.box = 0; sClick(POS.box, 0.6, 900);
  after(1.4, () => { subtitle('', '<i>In the dark, by the door, a green button has lit up.</i>', 4200); V.btn = 1; });
}

/* ---------------- warming: what the heat does, in order ---------------- */
const WARM = [
  [3.0, () => { sKnocks(POS.d2, 3, 0.5, 0.9, 1); }],
  [3.8, () => { heard('doe1'); say('Drawer 2', 'It\'s so cold in here.', { clip: 'c_doe1', fx: 'muffled', pos: POS.d2, volume: 1.2 }); }],
  [4.5, () => watchFree(() => setDrawer(5, 0.07, 1.4))],
  [5.3, () => { sKnocks(POS.d2, 5, 0.35, 1.1, 1); after(1.8, () => { heard('doe2'); say('Drawer 2', 'Let me out. Please. I\'m not dead. I\'m not dead.', { clip: 'c_doe2', fx: 'muffled', pos: POS.d2, volume: 1.2 }); }); }],
  [6.0, () => watchFree(unzip, O.gurney)],
  [6.8, () => watchFree(() => { setDrawer(5, 0.95, 0.4, false); const b = O.drawers[5].body; if (b) b.visible = false; flag('craneOut'); V.craneT = 3; sScrape(POS.d5, 0.3, 0.5); }, O.drawers[5].front)],
  [7.5, () => watchFree(() => { O.tbody.userData.hand.visible = true; flag('handOut'); }, O.table)],
  [8.3, () => { heard('crane1'); const p = behindPos(0.7); playClip('c_crane1', { fx: 'whisper', pos: p, volume: 1.2, speed: 0.92 }); subtitle('', '<i>Right behind you, an old woman\'s voice: "Is it morning yet, dear?"</i>', 4600); G.fearT = 0.9; }],
  [9.0, bigEvent],
  [10.0, () => watchFree(() => { flag('satUp'); tween(1.2, k => { O.tbody.userData.torso.rotation.z = -1.25 * k; }); }, O.table)],
];
function watchFree(fn, obj) {
  // changes happen only when you're not looking (or the light is off)
  if (!obj || !inView(obj, 1.0) || !V.fl.on || V.tubeDead) { fn(); return true; }
  V.pending = V.pending || []; V.pending.push({ fn, obj, t: 0 }); return true;
}
function unzip() {
  flag('unzipped');
  for (let i = 0; i < 10; i++) after(i * 0.12, () => sClick(POS.gurney, 0.18, 3200 + i * 90));
  tween(1.4, k => { O.bagGap.scale.z = 0.01 + k; O.bagGap.position.z = -0.45 + k * 0.0; }, () => { O.bagHand.visible = true; });
}
function bigEvent() {
  flag('tubeDead'); V.tubeDead = true; bangAll(); after(0.5, bangAll);
  after(0.9, () => { sThunk(new THREE.Vector3(-1.2, H, 0), 1, 110); for (let i = 0; i < 8; i++) after(i * 0.04, () => sClick(new THREE.Vector3(-1.2, H, 0), 0.7, 4000 + i * 250)); O.spark.position.set(-1.2, H - 0.1, 0); O.spark.visible = true; after(0.2, () => O.spark.visible = false); G.fearT = 1; sStinger(1); });
  after(2.4, () => { heard('doe3'); say('Drawer 2', 'Why is it getting warm?', { clip: 'c_doe3', fx: 'muffled', pos: POS.d2, volume: 1.2 }); });
  subtitle('', '<i>Every drawer in the wall bangs at once. Then the last tube bursts.</i>', 4200);
}

/* ---------------- Mrs Crane, out of her drawer ---------------- */
const CRANE_SPOTS = [[-3.1, -2.6, 'wall'], [3.1, -2.6, 'wall'], [-3.1, 2.1, 'wall'], [3.0, 2.6, 'wall'], [0.9, -1.4, 'you'], [-2.4, -1.6, 'you'], [1.2, 2.2, 'you']];
function craneStep() {
  if (!S.flags.craneOut || S.flags.power || G.ending) return;
  if (O.crane.visible && V.craneWatch) return;
  // somewhere you aren't looking
  const opts = CRANE_SPOTS.slice().sort(() => Math.random() - 0.5);
  for (const [x, z, face] of opts) {
    if (Math.hypot(x - P.x, z - P.z) < 1.3) continue;
    O.crane.position.set(x, 0, z); O.crane.updateMatrixWorld();
    if (inView(O.craneEye, 1.15)) continue;
    O.crane.rotation.y = face === 'wall' ? Math.atan2((Math.abs(x) > 2.5 ? Math.sign(x) * 5 : x) - x, (Math.abs(x) > 2.5 ? z : Math.sign(z) * 5) - z) : Math.atan2(P.x - x, P.z - z);
    O.crane.visible = true; V.craneWatch = { seen: 0, t: 0 }; return;
  }
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  for (let n = 1; n <= 9; n++) {
    const d = O.drawers[n], name = () => `Drawer ${n} · ${CARDS[n]}`;
    let acts;
    if (n === 7) acts = () => S.open[7] > 0.5 ? [look('Victor Hale, under a sheet. His black toes are sticking out. The bag of his things is by his feet.')] : [{ label: 'Pull it open', run: openDrawer7 }];
    else if (n === 2) acts = () => [{ label: 'Pull it open', run: () => { sKnock(POS.d2, 1, 0, 1); subtitle('', '<i>It won\'t move. Something inside is holding the handle.</i>', 3800); G.fearT = 0.5; } }];
    else if (n === 5) acts = () => S.flags.craneOut ? [look('Empty. The sheet is folded neatly at the end of the tray, the way you\'d fold a bedspread.')] : [{ label: 'Pull it open', run: () => subtitle('', '<i>It\'s stuck. Frost in the runners.</i>', 3000) }];
    else if (n === 9) acts = () => [{ label: 'Pull it open', run: () => subtitle('', '<i>Frozen shut. Whoever Rourke is, he\'s staying put.</i>', 3000) }];
    else acts = () => [look('Vacant. There\'s an empty tray behind it, beaded with water now it\'s warming up.')];
    inter('drawer' + n, d.front, { name, actions: acts });
  }
  inter('bag7', O.bag7, { name: 'Victor Hale\'s effects', enabled: () => S.open[7] > 0.5, actions: () => [{ label: 'Look in the bag', run: bagContents }] }); hitbox('bag7', O.bag7, 0.08);
  inter('desk', O.desk, { name: 'Desk', actions: () => [look('A dead desk lamp, a cold mug of coffee and an ashtray. The coffee has a skin on it.')] });
  inter('clip', O.clip, { name: 'Clipboard', actions: () => [{ label: 'Read it', run: () => openDoc('clip') }] }); hitbox('clip', O.clip, 0.05);
  inter('clock', O.clock, { name: 'Clock', actions: () => [look('Electric. It stopped at ten past three, when the power went.')] });
  inter('trolley', O.trolley, { name: 'Instrument trolley', actions: () => [look('Saws, a rib spreader, forceps in a tray. Laid out for the nine o\'clock post-mortem.')] });
  inter('gloves', O.gloves, { name: 'Rubber gloves', enabled: () => !has('gloves'), actions: () => [{ label: 'Take them', run: () => { give('gloves'); flag('gloves'); O.gloves.visible = false; } }] }); hitbox('gloves', O.gloves, 0.08);
  inter('table', O.table, { name: 'Autopsy table', actions: () => [look('Stainless steel with a drain at one end. It\'s cold through your sleeve.')] });
  inter('tbody', O.tbody, { name: 'Covered body', actions: () => [look(S.flags.satUp ? 'It\'s sitting up. You didn\'t hear it move. The sheet has slipped off one grey shoulder.' : S.flags.handOut ? 'A hand has slid out from under the sheet and hangs off the edge of the table.' : 'A body under a sheet, waiting for the pathologist. The toe tag says: P.M. 9 A.M. DO NOT MOVE.')] });
  inter('gurney', O.gurney, { name: 'Body bag', actions: () => [look(S.flags.unzipped ? 'The zip is open a foot. A grey hand hangs out of the gap. Nobody unzipped it.' : 'A black body bag on a gurney. The tag says: TRANSFER, COUNTY. Nobody has filled in the name.')] });
  inter('panel', O.panel, { name: 'Fuse panel', note: () => S.flags.panelOpen ? '' : 'DANGER: rubber gloves when handling fuses', actions: () => {
    if (S.flags.panelOpen) return [{ label: 'Work the fuses', run: openFuses }, { label: 'Read the taped note', run: () => openDoc('note') }];
    return [{ label: has('keys') ? 'Unlock it' : 'Open it', run: () => {
      flag('triedPanel');
      if (!has('keys')) { sThunk(POS.panel, 0.3, 200); subtitle('', '<i>Locked. The panel key is on Victor Hale\'s ring, and Victor Hale is in drawer 7.</i>', 4200); return; }
      flag('panelOpen'); sClick(POS.panel, 0.5, 1200); tween(0.7, k => { O.panelDoor.rotation.y = 1.9 * k; }); O.panelIn.visible = true; after(0.7, () => { openFuses(); });
    } }];
  } });
  inter('door', O.doorLeaf, { name: 'Steel door', actions: () => [{ label: 'Push it', run: () => { sThunk(POS.door, 0.5, 120); subtitle('', S.flags.power ? '<i>Still locked. Press the green release button beside it.</i>' : '<i>Locked. The bolt is electric, and there\'s no power to throw it back.</i>', 3600); } }] });
  inter('btn', O.btnBox, { name: 'Door release', actions: () => [{ label: 'Press it', run: () => { if (V.doorLive && S.flags.power) endSequence(); else { sClick(POS.btn, 0.3, 1500); subtitle('', V.doorLive ? '<i>Nothing yet.</i>' : '<i>Dead. No power to the door.</i>', 2600); } } }] }); hitbox('btn', O.btnBox, 0.08);
  inter('dial', O.dial, { name: () => `Cold room · ${tempStr()}°C`, reach: 3.2, actions: () => [look(S.flags.power ? 'The needle is creeping back down. The compressor hums behind the wall.' : `${tempStr()} degrees and rising. The notice says it must stay below 4.`)] });
  inter('xbox', O.xbox, { name: 'X-ray lightbox', actions: () => [look('Two films clipped up: a skull, and a chest with the ribs caved in. The box is dead without power.')] });
  inter('sink', O.sink, { name: 'Sink', actions: () => [look('A deep steel sink. The tap drips, slow as a clock.')] });
  inter('cab', O.cab, { name: 'Cabinet', actions: () => [look('Shrouds, toe tags, a box of pencils, a bottle of formalin. No fuses.')] });
  inter('chair', O.chair, { name: 'Chair', actions: () => [look('Your chair. It\'s still warm from you.')] });
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    temp: 2.0, fuses: { MAIN: 'blown', LIGHTS: 'good', COLD: 'good', DOOR: 'good' }, hand: null, main: false, open: { 2: 0, 5: 0, 7: 0 }, ev: {} };
}
function applyState() {
  for (const n of [2, 5, 7]) { const v = S.open[n] || 0; O.drawers[n].front.position.z = v; if (O.colDrawer[n]) { O.colDrawer[n].on = v > 0.3; O.colDrawer[n].maxZ = -D + 0.1 + v; } }
  const b5 = O.drawers[5].body; if (b5) b5.visible = !S.flags.craneOut;
  O.keysOnTray.visible = !has('keys'); O.gloves.visible = !has('gloves');
  const b7 = O.drawers[7].body; if (b7) b7.userData.hand.visible = !!S.flags.keys;
  O.tbody.userData.hand.visible = !!S.flags.handOut; O.tbody.userData.torso.rotation.z = S.flags.satUp ? -1.25 : 0;
  O.bagGap.scale.z = S.flags.unzipped ? 1 : 0.01; O.bagHand.visible = !!S.flags.unzipped;
  O.panelDoor.rotation.y = S.flags.panelOpen ? 1.9 : 0; O.panelIn.visible = !!S.flags.panelOpen;
  O.lever.rotation.z = S.main ? -0.6 : 0.6; showFuses();
  V.tubeDead = !!S.flags.tubeDead; V.box = 0; V.btn = S.flags.power ? 1 : 0;
  [O.crane, O.doe, O.hale].forEach(f => f.visible = false);
  if (S.hand && !has('fuse')) S.inv.push('fuse');
  powerCheck(false); if (S.flags.power) compressor(true);
  drawDial(); renderInv();
}

/* ---------------- sound ---------------- */
function compressor(on) { if (!A.ready || !A.loops.comp) return; setGain(A.loops.comp, on ? 0.09 : 0, 1.5); }
function startAmbience() {
  if (!A.ready || A.loops.room) return;
  A.loops.room = loopNoise({ type: 'lowpass', f: 180, q: 0.7, vol: 0.05, brown: true, wet: 0.2 });
  A.loops.buzz = loopNoise({ pos: new THREE.Vector3(-1.2, H - 0.1, 0), type: 'bandpass', f: 2400, q: 3, vol: 0, wet: 0.1, ref: 0.6 });
  A.loops.comp = loopNoise({ pos: POS.comp, type: 'lowpass', f: 90, q: 1.2, vol: 0, brown: true, wet: 0.2 });
  const ctx = A.ctx, hum = ctx.createOscillator(), hg = ctx.createGain(); hum.frequency.value = 120; hum.type = 'sawtooth'; hg.gain.value = 0; hum.connect(hg); hum.start();
  const lp = filt('lowpass', 400, 0.7); hg.connect(lp); route(lp, { pos: new THREE.Vector3(-1.2, H - 0.1, 0), wet: 0.1 }); A.loops.hum = { gain: hg };
  const tg = ctx.createGain(); tg.gain.value = 0.003; [73.4, 77.8, 146.8].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(tg); o.start(); }); route(tg, { wet: 0.5 }); A.loops.tension = { gain: tg };
  if (S.flags.power) compressor(true);
}

/* ---------------- per-frame ---------------- */
function roomUpdate(dt) {
  const t = G.time;
  // the cold room warms until the power is back, then cools
  if (!G.ending) {
    if (S.flags.power) S.temp = Math.max(2, S.temp - dt * 0.05);
    else if (!G.cutscene) S.temp = Math.min(16, S.temp + dt * 0.022);
    if (Math.abs(S.temp - V.dialT) > 0.05) { V.dialT = S.temp; drawDial(); }
  }
  if (!S.flags.power && !G.cutscene) for (const [th, fn] of WARM) { const key = 'w' + th; if (S.temp >= th && !S.ev[key]) { S.ev[key] = true; save(); fn(); } }
  // changes waiting for you to look away
  if (V.pending && V.pending.length) V.pending = V.pending.filter(p => { p.t += dt; if (!inView(p.obj, 1.0) || !V.fl.on || V.tubeDead || p.t > 20) { p.fn(); return false; } return true; });
  // the dying tube on the emergency battery
  let tubeK = 0;
  if (!V.tubeDead && !S.flags.power) {
    V.fl.t -= dt; if (V.fl.t <= 0) { V.fl.on = !V.fl.on; V.fl.t = V.fl.on ? rand(2.2, 7) * (1 - Math.min(0.6, (S.temp - 2) / 14)) : rand(0.1, 0.25 + (S.temp - 2) * 0.12); if (!V.fl.on) sClick(new THREE.Vector3(-1.2, H, 0), 0.08, 5000); }
    tubeK = V.fl.on ? 0.92 + Math.sin(t * 60) * 0.05 + (Math.random() < 0.03 ? -0.5 : 0) : 0;
  }
  const bright = V.mainsLights ? 1 : 0;
  L.tube.intensity = Math.max(tubeK * 7, bright * 11); L.tube2.intensity = bright * 11;
  O.tubeGlow1.material.color.setScalar(0.35 + Math.max(tubeK, bright) * 0.65); O.tubeGlow2.material.color.setScalar(0.35 + bright * 0.65);
  if (A.ready && A.loops.buzz) { setGain(A.loops.buzz, tubeK > 0 || bright ? 0.012 : 0, 0.02); setGain(A.loops.hum, tubeK > 0 || bright ? 0.02 : 0, 0.02); }
  G.flash = Math.max(0, G.flash - dt * 2.2);
  // the turn-around: she stays in the lightbox glow until you've seen her
  if (V.reveal) { V.reveal.t += dt; if (inView(O.craneEye, 0.8)) V.reveal.seen += dt; if (V.reveal.seen > 0.45 || V.reveal.t > 12) endReveal(); }
  // the red lamp, the lightbox, the green button
  L.red.intensity = (S.flags.power ? 3 : 7) * (0.95 + Math.sin(t * 3.1) * 0.03);
  V.boxK = lerp(V.boxK || 0, V.box || 0, Math.min(1, dt * 18)); const bf = V.box ? (Math.random() < 0.15 ? 0.3 : 1) : 0;
  L.box.intensity = V.boxK * 5 * bf; O.xface.material.color.setScalar(0.25 + V.boxK * bf * 0.9);
  const bk = V.btn ? 0.75 + Math.sin(t * 4) * 0.25 : 0; L.btn.intensity = bk * 0.22; O.btn.material.color.setRGB(0.1 + bk * 0.2, 0.2 + bk * 0.8, 0.12 + bk * 0.3);
  L.hemi.intensity = V.mainsLights ? 0.5 : 0.22;
  // Mrs Crane goes where you aren't looking, and goes again once you've seen her
  if (S.flags.craneOut && !S.flags.power && !G.ending) {
    V.craneT -= dt; if (V.craneT <= 0 && !O.crane.visible) { craneStep(); V.craneT = rand(14, 30) * (1 - Math.min(0.5, (S.temp - 7) / 14)); }
    if (O.crane.visible && V.craneWatch) { const w = V.craneWatch; w.t += dt; const vis = inView(O.craneEye, 0.85) && (V.fl.on || V.tubeDead); if (vis) { if (!w.seen) { G.fearT = Math.max(G.fearT, 0.7); if (Math.random() < 0.5) sStinger(0.35); } w.seen += dt; }
      if ((w.seen > 1.2 && (!vis || !V.fl.on)) || w.t > 30 || (!V.tubeDead && !V.fl.on && w.seen > 0)) { O.crane.visible = false; V.craneWatch = null; } }
  }
  // drawer 2 keeps knocking while it's warm; the others whisper when it's very warm
  if (!S.flags.power && !G.ending) {
    if (S.temp > 6) { V.knockT -= dt; if (V.knockT <= 0) { V.knockT = rand(12, 26); sKnocks(POS.d2, irand(2, 5), rand(0.3, 0.6), rand(0.7, 1.1), 1); } }
    if (S.temp > 11) { V.warmT -= dt; if (V.warmT <= 0) { V.warmT = rand(10, 20); const n = irand(1, 4), p = drawerPos(pick([1, 3, 4, 6, 8, 9])); playClip('c_w' + n, { fx: 'whisper', pos: new THREE.Vector3(p.x, p.y, -D + 0.3), volume: 0.8 }); } }
  }
  V.dripT -= dt; if (V.dripT <= 0) { V.dripT = rand(1.8, 3.2); sClick(POS.sink, 0.12, 2600); }
  director(dt);
}
const DIR = { t: 40, last: '' };
const EVENTS = [
  { id: 'breath', ok: () => !S.flags.power, run: () => { sBreath(behindPos(0.5), 2, 0.35, true); } },
  { id: 'steps', ok: () => S.flags.craneOut && !S.flags.power, run: () => { for (let i = 0; i < 4; i++) after(i * 0.55, () => sStep(0.13)); } },
  { id: 'lift', ok: () => true, run: () => { sBell(new THREE.Vector3(W + 5, 1.8, 1.2), 1.2); } },
  { id: 'gurney', ok: () => !S.flags.power, run: () => { if (inView(O.gurney, 1)) return false; O.gurney.position.x += rand(-0.06, 0.06); O.gurney.position.z += rand(0.05, 0.12); sSqueak(POS.gurney, 0.12); } },
  { id: 'handle', ok: () => true, run: () => { for (let i = 0; i < 3; i++) after(i * 0.18, () => sClick(POS.door, 0.35, 900)); } },
  { id: 'flick', ok: () => !V.tubeDead && !S.flags.power, run: () => { V.fl.on = false; V.fl.t = 1.6; } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || G.ending) return;
  DIR.t -= dt * (1 + Math.min(1, (S.temp - 2) / 10) * 0.6);
  if (DIR.t > 0) return;
  const opts = EVENTS.filter(e => e.id !== DIR.last && e.ok());
  for (let tr = 0; tr < 4 && opts.length; tr++) { const e = opts.splice(Math.floor(Math.random() * opts.length), 1)[0]; if (e.run() !== false) { DIR.last = e.id; break; } }
  DIR.t = rand(35, 60);
}

/* ---------------- ending ---------------- */
function endSequence() {
  flag('escaped'); G.ending = true; G.cutscene = true; V.btn = 0;
  sTone([120, 121], 0.5, 0.05); after(0.5, () => { sThunk(POS.door, 0.9, 140); sClick(POS.door, 0.6, 1100); });
  after(0.8, () => { sCreak(POS.door, 1.4, 0.35, 70); tween(1.4, k => { O.doorLeaf.rotation.y = 1.3 * k; }); });
  const x0 = P.x, z0 = P.z, y0 = G.yaw, p0 = G.pitch, yOut = Math.atan2(-1, 0);
  after(1.6, () => tween(1.8, k => { P.x = lerp(x0, W + 0.35, k); P.z = lerp(z0, 1.2, k); G.yaw = y0 + wrapA(yOut - y0) * k; G.pitch = lerp(p0, 0, k); }));
  after(3.6, () => {
    // behind you, while you're looking down the corridor, the room rearranges itself
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) { O.drawers[n].front.position.z = 0.95; if (O.drawers[n].body) O.drawers[n].body.visible = false; }
    O.tbody.visible = false; showCornerDead(true); V.box = 1;
    subtitle('', '<i>You look back once.</i>', 0);
    tween(1.6, k => { G.yaw = yOut + Math.PI * k; });
  });
  after(6.0, () => { sStinger(0.7); });
  after(7.2, () => { G.blackT = 1; subtitle('', '', 1); });
  after(8.4, showEnd);
}
function wrapA(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
function endFrame() {
  const Wd = 480, Ht = 360, rt = new THREE.WebGLRenderTarget(Wd, Ht), cam = new THREE.PerspectiveCamera(58, Wd / Ht, 0.05, 40); cam.layers.enable(1);
  cam.position.set(W - 0.25, 1.62, 1.2); cam.lookAt(-2.3, 1.05, -2.0);
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) { O.drawers[n].front.position.z = 0.95; if (O.drawers[n].body) O.drawers[n].body.visible = false; }
  O.tbody.visible = false; showCornerDead(true);
  L.box.intensity = 6; L.red.intensity = 5; L.hemi.intensity = 0.5; L.tube.intensity = 0; L.tube2.intensity = 0; O.xface.material.color.setScalar(1.1);
  let url = null;
  try {
    renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, cam);
    const buf = new Uint8Array(Wd * Ht * 4); renderer.readRenderTargetPixels(rt, 0, 0, Wd, Ht, buf);
    const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d'); const img = g.createImageData(Wd, Ht);
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
      const si = ((Ht - 1 - y) * Wd + x) * 4, di = (y * Wd + x) * 4;
      let l = Math.pow(buf[si] / 255, 0.45) * 0.3 + Math.pow(buf[si + 1] / 255, 0.45) * 0.59 + Math.pow(buf[si + 2] / 255, 0.45) * 0.11;
      l = clamp((l - 0.05) * 1.7, 0, 1); const dx = x / Wd - 0.5, dy = y / Ht - 0.5, v = 1 - Math.min(1, (dx * dx + dy * dy) * 2.2);
      l = l * (0.35 + 0.65 * v) + (Math.random() - 0.5) * 0.08;
      img.data[di] = clamp(l * 212, 0, 255); img.data[di + 1] = clamp(l * 238 + 4, 0, 255); img.data[di + 2] = clamp(l * 236 + 10, 0, 255); img.data[di + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    url = c.toDataURL('image/jpeg', 0.84);
  } catch (e) { console.warn(e); }
  renderer.setRenderTarget(null); rt.dispose();
  return url;
}
function showEnd() { finishRoom(endFrame()); }

/* ---------------- title: a wall of drawers under a dying light ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const Wd = 480, Ht = 270;
  const cyc = t % 5.3, on = !(cyc > 4.6 && cyc < 4.72) && !(cyc > 4.8 && cyc < 5.05) && !(cyc > 2.1 && cyc < 2.16);
  g.fillStyle = on ? '#141a18' : '#0a0606'; g.fillRect(0, 0, Wd, Ht);
  const red = g.createRadialGradient(Wd * 0.72, 30, 10, Wd * 0.72, 30, 320); red.addColorStop(0, 'rgba(160,20,12,0.45)'); red.addColorStop(1, 'rgba(60,5,5,0)'); g.fillStyle = red; g.fillRect(0, 0, Wd, Ht);
  const x0 = Wd * 0.5, y0 = 38, cw = 64, ch = 50;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = x0 + c * (cw + 6), y = y0 + r * (ch + 6), n = r * 3 + c + 1;
    g.fillStyle = on ? '#4a5356' : '#2a1a1a'; g.fillRect(x, y, cw, ch);
    g.fillStyle = on ? '#2d3437' : '#1c1010'; g.fillRect(x + 20, y + 32, 24, 5);
    g.fillStyle = CARDS[n] === 'VACANT' ? '#1d1d1d' : '#7d1a14'; g.fillRect(x + 14, y + 8, 36, 8);
    if (n === 5) { const o = (Math.sin(t * 0.7) * 0.5 + 0.5) * 4; g.fillStyle = '#000'; g.fillRect(x - o, y - o, cw, 3 + o); }
  }
  if (on) { const tl = g.createLinearGradient(0, 0, 0, Ht); tl.addColorStop(0, 'rgba(200,235,240,0.18)'); tl.addColorStop(1, 'rgba(200,235,240,0)'); g.fillStyle = tl; g.fillRect(0, 0, Wd, Ht); g.fillStyle = 'rgba(220,245,250,0.8)'; g.fillRect(Wd * 0.55, 4, 110, 3); }
  const temp = 2 + ((t * 0.05) % 12); const el = document.getElementById('tTemp'); if (el) el.textContent = temp.toFixed(1);
}

/* ---------------- the room module ---------------- */
return {
  id: 'cold', title: 'Cold Storage', saveKey: 'lethe.roomcold.v1',
  DOCS, ITEMS, HEARD, HINTS, openDoc, inspectItem, penalty, titleFx,
  markSkip: ['start'], markMerge: { gloves: 'power' },
  backText: 'Back on shift.',
  invNote: id => id === 'fuse' && S.hand ? ` <span class="muted">(from ${FUSE_NAMES[S.hand].toLowerCase()})</span>` : '',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Crouch', 'C'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (G.cutscene) return; G.crouch = !G.crouch; G.eyeT = G.crouch ? 0.8 : 1.62; },
  onPanelClose() {},
  update: roomUpdate,
  preRender() {},
  build() { makeTextures(); makeMaterials(); buildRoom(); registerInteractions(); },
  defaults, applyState, startAmbience,
  spawn: { x: -1.25, z: 1.75, yaw: 0 },
  wake() {
    P.x = -1.25; P.z = 1.75; G.yaw = 0.25; G.pitch = -0.1; G.eye = G.eyeT = 1.62;
    G.cutscene = true; $('#fx').className = 'lids'; V.fl.on = false; V.fl.t = 3.2;
    after(0.4, () => { sThunk(null, 0.8, 60); });
    after(1.0, () => subtitle('', '<i>Ten past three. The lights die with a clunk, and the hum of the cold room stops.</i>', 4600));
    after(3.3, () => { V.fl.on = true; V.fl.t = 1.2; sClick(new THREE.Vector3(-1.2, H, 0), 0.3, 3000); });
    after(4.0, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); subtitle('', '<i>One tube flickers back on, running off the emergency battery. Behind you, the door\'s electric bolt has shut.</i>', 5200); toast(ctrlHint(), 7000); });
  },
  debug: { O, L, V, T, M, climax, bigEvent, craneStep, shock, pullFuse, putFuse, throwMain, endFrame, drawDial, WARM },
};

})();
