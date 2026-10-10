const ROOM_LAMP = (() => {

/* =====================================================================
   MYSTERY #2 — "THE LAMP ROOM"  ·  Skerrow Rock Light, 21 December 1911
   part A: palette, textures, figures, geometry, sea, sky, beam
   (this whole room lives inside one closure, so its names never meet Room 406's)
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {};
const FELL = '"IM Fell English", Georgia, serif', FELLSC = '"IM Fell English SC", Georgia, serif', HAND = '"Caveat", "Segoe Print", cursive';
const DEG = Math.PI / 180;
const R_IN = 3.0, R_OUT = 3.22, R_RAIL = 4.3, APO = 3.11, WALL_H = 1.05, GLASS_TOP = 3.3, EYE = 1.62;
const SEA_Y = -36, ROCK_Y = -33.2, MORSE_R = 21;
const pol = (r, a, y = 0) => new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a));
const angOf = (x, z) => Math.atan2(z, x);
const wrapA = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const faceIn = a => Math.atan2(-Math.cos(a), -Math.sin(a));   // rotation.y so local +z points at the centre
const faceOut = a => Math.atan2(Math.cos(a), Math.sin(a));
// where things are (angles measured from +x toward +z; +x is the land side)
const A_ = { door: 90 * DEG, coat: 114 * DEG, tank: 150 * DEG, desk: 186 * DEG, locker: 223 * DEG, hatch: 270 * DEG, tube: 293 * DEG,
  chest: 318 * DEG, stove: 36 * DEG, bench: 62 * DEG, flag: 202 * DEG, scope: 12 * DEG, morse: 7 * DEG, boat: 232 * DEG, baro: 168.75 * DEG,
  can: 101 * DEG, lip: 160 * DEG, hook: 22.5 * DEG };
const SECTOR = 33.75 * DEG;            // the landward screen: the beam never shows between -SECTOR and +SECTOR
const HATCH = { x: 0, z: -2.05 };
const POS = {
  tube: pol(2.86, A_.tube, 1.25), hatch: new THREE.Vector3(HATCH.x, 0.1, HATCH.z), door: pol(3.1, A_.door, 1.2), lens: new THREE.Vector3(0, 1.8, 0),
  tank: pol(2.55, A_.tank, 0.6), below: new THREE.Vector3(0, -3, 0), rocks: pol(12, A_.morse, ROCK_Y + 1), gallery: pol(3.9, 150 * DEG, 1.2),
};
const LENS_REST = -A_.flag;          // lens yaw that points the main beam at the flagstaff

/* ---------------- flags: one spec drawn both as SVG (chart) and on canvas (the hoist) ---------------- */
const FC = { R: '#c42a2c', W: '#f1ede2', B: '#1d4b97', Y: '#efbf2e', K: '#161616' };
const FLAGSPEC = (() => {
  const q = (tl, tr, bl, br) => [['r', 0, 0, 30, 20, tl], ['r', 30, 0, 30, 20, tr], ['r', 0, 20, 30, 20, bl], ['r', 30, 20, 30, 20, br]];
  const saltire = (bg, fg) => [['r', 0, 0, 60, 40, bg], ['l', 0, 0, 60, 40, 8, fg], ['l', 60, 0, 0, 40, 8, fg]];
  const cross = (bg, fg) => [['r', 0, 0, 60, 40, bg], ['r', 26, 0, 8, 40, fg], ['r', 0, 16, 60, 8, fg]];
  const checker = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) checker.push(['r', c * 15, r * 10, 15, 10, (r + c) % 2 ? 'W' : 'B']);
  const ystripes = [['r', 0, 0, 60, 40, 'Y']]; for (let k = -40; k < 60; k += 16) ystripes.push(['l', k, 40, k + 40, 0, 7, 'R']);
  return {
    A: [['r', 0, 0, 30, 40, 'W'], ['p', [30, 0, 60, 0, 45, 20, 60, 40, 30, 40], 'B']],
    B: [['p', [0, 0, 60, 0, 45, 20, 60, 40, 0, 40], 'R']],
    C: [['r', 0, 0, 60, 8, 'B'], ['r', 0, 8, 60, 8, 'W'], ['r', 0, 16, 60, 8, 'R'], ['r', 0, 24, 60, 8, 'W'], ['r', 0, 32, 60, 8, 'B']],
    D: [['r', 0, 0, 60, 10, 'Y'], ['r', 0, 10, 60, 20, 'B'], ['r', 0, 30, 60, 10, 'Y']],
    E: [['r', 0, 0, 60, 20, 'B'], ['r', 0, 20, 60, 20, 'R']],
    F: [['r', 0, 0, 60, 40, 'W'], ['p', [30, 0, 60, 20, 30, 40, 0, 20], 'R']],
    G: [0, 1, 2, 3, 4, 5].map(i => ['r', i * 10, 0, 10, 40, i % 2 ? 'B' : 'Y']),
    H: [['r', 0, 0, 30, 40, 'W'], ['r', 30, 0, 30, 40, 'R']],
    I: [['r', 0, 0, 60, 40, 'Y'], ['c', 30, 20, 10, 'K']],
    J: [['r', 0, 0, 60, 13.3, 'B'], ['r', 0, 13.3, 60, 13.4, 'W'], ['r', 0, 26.7, 60, 13.3, 'B']],
    K: [['r', 0, 0, 30, 40, 'Y'], ['r', 30, 0, 30, 40, 'B']],
    L: q('Y', 'K', 'K', 'Y'),
    M: saltire('B', 'W'),
    N: checker,
    O: [['p', [0, 0, 60, 0, 60, 40], 'R'], ['p', [0, 0, 0, 40, 60, 40], 'Y']],
    P: [['r', 0, 0, 60, 40, 'B'], ['r', 20, 13.3, 20, 13.4, 'W']],
    Q: [['r', 0, 0, 60, 40, 'Y']],
    R: cross('R', 'Y'),
    S: [['r', 0, 0, 60, 40, 'W'], ['r', 20, 13.3, 20, 13.4, 'B']],
    T: [['r', 0, 0, 20, 40, 'R'], ['r', 20, 0, 20, 40, 'W'], ['r', 40, 0, 20, 40, 'B']],
    U: q('R', 'W', 'W', 'R'),
    V: saltire('W', 'R'),
    W: [['r', 0, 0, 60, 40, 'B'], ['r', 9, 6, 42, 28, 'W'], ['r', 19, 13, 22, 14, 'R']],
    X: cross('W', 'B'),
    Y: ystripes,
    Z: [['p', [0, 0, 60, 0, 30, 20], 'Y'], ['p', [60, 0, 60, 40, 30, 20], 'B'], ['p', [0, 40, 60, 40, 30, 20], 'R'], ['p', [0, 0, 0, 40, 30, 20], 'K']],
  };
})();
function flagSVG(ch) {
  const sh = FLAGSPEC[ch].map(s => {
    if (s[0] === 'r') return `<rect x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" fill="${FC[s[5]]}"/>`;
    if (s[0] === 'p') return `<polygon points="${s[1].join(' ')}" fill="${FC[s[2]]}"/>`;
    if (s[0] === 'c') return `<circle cx="${s[1]}" cy="${s[2]}" r="${s[3]}" fill="${FC[s[4]]}"/>`;
    return `<line x1="${s[1]}" y1="${s[2]}" x2="${s[3]}" y2="${s[4]}" stroke="${FC[s[6]]}" stroke-width="${s[5]}"/>`;
  }).join('');
  const swallow = ch === 'A' || ch === 'B';
  return `<svg viewBox="0 0 60 40" role="img" aria-label="Signal flag ${ch}" style="${swallow ? 'border:none' : ''}">${sh}</svg>`;
}
function drawFlag(g, ch, W, H) {
  g.save(); g.scale(W / 60, H / 40);
  for (const s of FLAGSPEC[ch]) {
    if (s[0] === 'r') { g.fillStyle = FC[s[5]]; g.fillRect(s[1], s[2], s[3], s[4]); }
    else if (s[0] === 'p') { g.fillStyle = FC[s[2]]; g.beginPath(); for (let i = 0; i < s[1].length; i += 2) g[i ? 'lineTo' : 'moveTo'](s[1][i], s[1][i + 1]); g.closePath(); g.fill(); }
    else if (s[0] === 'c') { g.fillStyle = FC[s[4]]; g.beginPath(); g.arc(s[1], s[2], s[3], 0, TAU); g.fill(); }
    else { g.strokeStyle = FC[s[6]]; g.lineWidth = s[5]; g.beginPath(); g.moveTo(s[1], s[2]); g.lineTo(s[3], s[4]); g.stroke(); }
  }
  g.restore();
}
const HOIST = ['N', 'C'];            // N over C: "I am in distress and need help"
const HAULS = 6, CUP_TURNS = 3, HOOK_TRIES = 3;
const FLAG_TOP = 4.9, FLAG_LOW = 1.0;

/* ---------------- textures ---------------- */
function makeTextures() {
  T.floor = ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#51302a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 14000, 0.22, '0,0,0', 2); speckle(g, w, h, 3000, 0.08, '255,220,190', 1);
    g.strokeStyle = 'rgba(20,8,6,0.55)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); }
    g.fillStyle = 'rgba(30,14,10,0.6)'; for (let y = 0; y <= 4; y++) for (let x = 0; x <= 4; x++) { g.beginPath(); g.arc(x * 128, y * 128, 5, 0, TAU); g.fill(); }
    for (let i = 0; i < 7; i++) blot(g, rand(0, w), rand(0, h), rand(20, 70), rand(0.15, 0.3), '10,20,24');
  }, { repeat: [3, 3] });
  T.paint = ctex(256, 256, (g, w, h) => { g.fillStyle = '#8f9c8a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, 0.12, '0,0,0', 2); for (let i = 0; i < 5; i++) blot(g, rand(0, w), rand(0, h), rand(20, 60), 0.18, '60,50,30'); for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(60,40,20,0.15)'; g.fillRect(rand(0, w), rand(h * 0.6, h), 2, rand(10, 60)); } }, { repeat: [2, 1] });
  T.tower = ctex(256, 512, (g, w, h) => { g.fillStyle = '#dcd8cc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,80,70,0.22)'; g.lineWidth = 1.5; for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); const off = (y / 24) % 2 ? 0 : 32; for (let x = off; x < w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 24); g.stroke(); } } speckle(g, w, h, 5000, 0.12, '0,0,0', 2); for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(70,60,40,0.12)'; g.fillRect(rand(0, w), rand(0, h), rand(3, 8), rand(40, 160)); } }, { repeat: [6, 8] });
  T.rock = ctex(256, 256, (g, w, h) => { g.fillStyle = '#2c302e'; g.fillRect(0, 0, w, h); speckle(g, w, h, 12000, 0.35, '0,0,0', 3); speckle(g, w, h, 3000, 0.15, '160,170,150', 2); for (let i = 0; i < 10; i++) blot(g, rand(0, w), rand(0, h), rand(20, 50), 0.3, '30,50,30'); }, { repeat: [2, 2] });
  T.wood = ctex(256, 256, (g, w, h) => { g.fillStyle = '#5b3a22'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,15,5' : '120,80,45'},${Math.random() * 0.14})`; g.fillRect(0, y, w, 2); } speckle(g, w, h, 1500, 0.15); });
  T.grate = ctex(256, 256, (g, w, h) => { g.fillStyle = '#2a2d2c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 4; for (let i = 0; i < w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } g.strokeStyle = 'rgba(120,130,125,0.25)'; g.lineWidth = 2; for (let i = 0; i < h; i += 16) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } speckle(g, w, h, 4000, 0.2, '0,0,0', 2); }, { repeat: [24, 1] });
  // rain running down the glass
  T.rain = ctex(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { const x = rand(0, w), y = rand(0, h), l = rand(20, 140); const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, 'rgba(220,235,245,0)'); gr.addColorStop(1, 'rgba(220,235,245,0.55)'); g.strokeStyle = gr; g.lineWidth = rand(1, 2.4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-3, 3), y + l); g.stroke(); g.fillStyle = 'rgba(230,240,250,0.6)'; g.beginPath(); g.arc(x, y + l, rand(1.5, 3), 0, TAU); g.fill(); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(230,240,250,${rand(0.15, 0.5)})`; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(0.6, 1.8), 0, TAU); g.fill(); }
  }, { repeat: [1, 1] });
  T.rain.wrapS = T.rain.wrapT = THREE.RepeatWrapping;
  T.prism = ctex(64, 256, (g, w, h) => { for (let y = 0; y < h; y++) { const k = (y % 16) / 16; g.fillStyle = `rgba(${200 + k * 55},${230 + k * 25},${235 + k * 20},${0.25 + k * 0.6})`; g.fillRect(0, y, w, 1); } }, { linear: false });
  T.bull = ctex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let r = 124; r > 4; r -= 11) { g.strokeStyle = `rgba(235,250,255,${0.25 + (124 - r) / 200})`; g.lineWidth = 5; g.beginPath(); g.arc(128, 128, r, 0, TAU); g.stroke(); } const gr = g.createRadialGradient(128, 128, 0, 128, 128, 60); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  T.glow = ctex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,230,180,0.85)'); gr.addColorStop(0.45, 'rgba(255,190,110,0.25)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  T.print = ctex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(200,215,220,0.55)'; const blob = (x, y, rx, ry, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill(); g.restore(); }; blob(64, 78, 24, 30); [[38, 36, -0.5], [52, 24, -0.2], [66, 20, 0], [80, 24, 0.2], [92, 44, 0.7]].forEach(([x, y, r]) => blob(x, y, 7, 20, r)); for (let i = 0; i < 12; i++) { g.fillRect(rand(44, 84), rand(90, 128), 2, rand(6, 26)); } });
  T.foot = ctex(64, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(20,35,40,0.55)'; g.beginPath(); g.ellipse(32, 80, 15, 34, 0, 0, TAU); g.fill(); [[22, 34], [30, 28], [38, 29], [45, 33], [50, 40]].forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, 5 - i * 0.5, 0, TAU); g.fill(); }); });
  T.names = ctex(512, 256, (g, w, h) => {
    g.fillStyle = '#141414'; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 0.3, '60,60,60', 2);
    g.font = `22px ${FELL}`; g.fillStyle = 'rgba(190,182,166,0.8)';
    const rows = ['J. Munro 1851', 'W. Gunn 1868', 'R. Sinclair 1874', 'A. Mackay 1890', 'H. Bain 1902', 'A. Rigg 1909'];
    rows.forEach((t, i) => { g.save(); g.translate(40 + (i % 2) * 230, 40 + Math.floor(i / 2) * 44); g.rotate(rand(-0.04, 0.04)); g.fillText(t, 0, 0); g.restore(); });
    g.fillStyle = 'rgba(236,228,210,0.95)'; ['E. Rigg 1911', 'D. Moar 1911', 'T. Lennie 1911'].forEach((t, i) => { g.save(); g.translate(60 + i * 150, 200); g.rotate(rand(-0.06, 0.06)); g.fillText(t, 0, 0); g.restore(); });
  });
  T.gauge = ctex(128, 128, (g, w, h) => { g.fillStyle = '#efe6cc'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.strokeStyle = '#3a2d18'; g.lineWidth = 4; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#b3261e'; g.beginPath(); g.arc(64, 64, 44, -0.35 * Math.PI + 1.05 * Math.PI, 0.25 * Math.PI + 0.15); g.stroke(); g.fillStyle = '#2a2016'; g.font = `bold 14px ${FELL}`; g.textAlign = 'center'; g.fillText('PRESSURE', 64, 100); for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.75 + i * 0.15); g.lineWidth = 2; g.strokeStyle = '#2a2016'; g.beginPath(); g.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); g.lineTo(64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40); g.stroke(); } });
  T.baro = ctex(128, 128, (g, w, h) => { g.fillStyle = '#f0e8d2'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.strokeStyle = '#6a4d1e'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#2a2016'; g.font = `12px ${FELLSC}`; g.textAlign = 'center'; [['Stormy', 0.8], ['Rain', 1.1], ['Change', 1.5], ['Fair', 1.9], ['Dry', 2.2]].forEach(([t, a]) => { const aa = Math.PI * (a - 0.25); g.fillText(t, 64 + Math.cos(aa) * 40, 64 + Math.sin(aa) * 40 + 4); }); g.strokeStyle = '#1a1208'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); const na = Math.PI * 0.5; g.lineTo(64 + Math.cos(na) * 44, 64 + Math.sin(na) * 44); g.stroke(); });
  T.clock = ctex(128, 128, () => {});
  T.logbook = ctex(256, 192, (g, w, h) => { g.fillStyle = '#e8dfc6'; g.fillRect(0, 0, w, h); g.fillStyle = '#6d5a3a'; g.fillRect(w / 2 - 2, 0, 4, h); g.strokeStyle = 'rgba(80,60,40,0.35)'; for (let y = 24; y < h; y += 12) { g.beginPath(); g.moveTo(10, y); g.lineTo(w / 2 - 10, y); g.moveTo(w / 2 + 10, y); g.lineTo(w - 10, y); g.stroke(); } g.strokeStyle = 'rgba(30,40,70,0.7)'; g.lineWidth = 1.2; for (let y = 22; y < h - 10; y += 12) { if (Math.random() < 0.2) continue; g.beginPath(); let x = w / 2 + 12; g.moveTo(x, y); while (x < w - 16) { x += rand(4, 10); g.lineTo(x, y + rand(-2, 1)); } g.stroke(); } });
  T.canLabel = ctex(128, 128, (g, w, h) => { g.fillStyle = '#7d2620'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1800, 0.25, '0,0,0', 2); g.fillStyle = '#e8d9b0'; g.fillRect(14, 40, 100, 48); g.fillStyle = '#3a1410'; g.font = `bold 15px ${FELLSC}`; g.textAlign = 'center'; g.fillText('PARAFFIN', 64, 62); g.font = `10px ${FELL}`; g.fillText('N.L.B. \u00b7 5 gal.', 64, 79); for (let i = 0; i < 6; i++) blot(g, rand(0, w), rand(0, h), rand(8, 22), 0.25, '20,10,5'); });
  HOIST.forEach(ch => { T['flag' + ch] = ctex(120, 80, (g, w, h) => { drawFlag(g, ch, w, h); speckle(g, w, h, 600, 0.12); }); });
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  M.floor = toon(0xffffff, T.floor); M.paint = toon(0xffffff, T.paint); M.tower = toon(0xffffff, T.tower); M.rock = toon(0xffffff, T.rock); M.wood = toon(0xffffff, T.wood);
  M.iron = toon(0x2d3431); M.ironRed = toon(0x5a2e26); M.black = toon(0x161716); M.brass = toon(0xb68b3b); M.dbrass = toon(0x7d5f2a); M.green = toon(0x2e4a3c);
  M.grate = toon(0xffffff, T.grate); M.white = toon(0xd9d4c7); M.cream = toon(0xe2d7bb); M.rope = toon(0x8c7a55); M.oil = toon(0x9a8634); M.rag = toon(0x3b403d);
  M.can = toon(0xffffff, T.canLabel); M.canRed = toon(0xa0392b); M.stone = toon(0x8f8b80); M.paper = toon(0xece3cd);
  M.glass = new THREE.MeshBasicMaterial({ color: 0xa9c2cc, map: T.rain, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
  M.lens = new THREE.MeshBasicMaterial({ color: 0x9fb8bd, map: T.prism, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
  M.bull = new THREE.MeshBasicMaterial({ color: 0xa7c4c8, map: T.bull, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
  M.glowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffd9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  M.fig = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: GRAD });
  M.print = new THREE.MeshBasicMaterial({ map: T.print, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
  M.foot = new THREE.MeshBasicMaterial({ map: T.foot, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
}

/* ---------------- figures (merged, vertex-coloured, one draw call each) ---------------- */
function mergeParts(parts) {
  const pos = [], nor = [], col = [];
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo; g.applyMatrix4(p.m);
    const pa = g.attributes.position, na = g.attributes.normal, c = new THREE.Color(p.color);
    for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const FIG_GEO = {};
function figGeo(kind) {
  if (FIG_GEO[kind]) return FIG_GEO[kind];
  const parts = [], m4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  const keeper = kind !== 'drowned', skin = kind === 'drowned' ? 0x8e9a93 : 0x9aa39c, cloth = keeper ? 0xb08a28 : 0x3a403d, dark = 0x0c0d0d, hair = 0x161a19;
  const add = (geo, color, m) => parts.push({ geo, color, m });
  add(new THREE.CylinderGeometry(0.075, 0.06, 0.86, 8), keeper ? 0x2a2a28 : cloth, m4(-0.1, 0.43, 0));
  add(new THREE.CylinderGeometry(0.075, 0.06, 0.86, 8), keeper ? 0x2a2a28 : cloth, m4(0.1, 0.43, 0));
  add(new THREE.CylinderGeometry(keeper ? 0.21 : 0.17, keeper ? 0.27 : 0.16, keeper ? 0.95 : 0.72, 10), cloth, m4(0, keeper ? 1.05 : 1.2, 0));
  add(new THREE.CylinderGeometry(0.05, 0.042, 0.8, 7), keeper ? cloth : skin, m4(-0.24, 1.1, 0.02, 0, 0, 0.1));
  add(new THREE.CylinderGeometry(0.05, 0.042, 0.8, 7), keeper ? cloth : skin, m4(0.24, 1.1, 0.02, 0, 0, -0.1));
  add(new THREE.SphereGeometry(0.055, 8, 6), skin, m4(-0.28, 0.68, 0.03, 0, 0, 0, 1, 1.6, 1));
  add(new THREE.SphereGeometry(0.055, 8, 6), skin, m4(0.28, 0.68, 0.03, 0, 0, 0, 1, 1.6, 1));
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.14, 8), skin, m4(0, 1.6, 0));
  add(new THREE.SphereGeometry(0.12, 12, 10), skin, m4(0, 1.74, 0.01, 0, 0, 0, 0.9, 1.3, 1));
  add(new THREE.SphereGeometry(0.02, 8, 6), dark, m4(-0.042, 1.775, 0.103, 0, 0, 0, 1.1, 0.8, 0.6));
  add(new THREE.SphereGeometry(0.02, 8, 6), dark, m4(0.042, 1.775, 0.103, 0, 0, 0, 1.1, 0.8, 0.6));
  add(new THREE.SphereGeometry(0.022, 8, 6), dark, m4(0, 1.665, 0.098, 0, 0, 0, 0.9, 2.2, 0.5));
  if (keeper) {
    add(new THREE.CylinderGeometry(0.2, 0.24, 0.03, 12), cloth, m4(0, 1.86, -0.02, -0.18, 0, 0));
    add(new THREE.SphereGeometry(0.13, 12, 8, 0, TAU, 0, Math.PI / 2), cloth, m4(0, 1.85, -0.01, 0, 0, 0, 1, 0.9, 1));
  } else {
    for (let i = 0; i < 9; i++) { const a = -1.1 + i * 0.28; add(new THREE.BoxGeometry(0.03, 0.34 + Math.random() * 0.2, 0.02), hair, m4(Math.sin(a) * 0.11, 1.66, Math.cos(a) * 0.1 - 0.02, 0, a, 0)); }
    add(new THREE.SphereGeometry(0.125, 12, 8, 0, TAU, 0, Math.PI / 2.2), hair, m4(0, 1.78, -0.01));
  }
  return (FIG_GEO[kind] = mergeParts(parts));
}
function makeFigure(kind = 'drowned', parent = scene) { const m = new THREE.Mesh(figGeo(kind), M.fig); m.castShadow = false; m.receiveShadow = true; parent.add(m); m.userData.noRay = true; return m; }
function placeFigure(f, x, y, z, faceX, faceZ) { f.position.set(x, y, z); f.rotation.set(0, Math.atan2(faceX - x, faceZ - z), 0); }

/* ---------------- geometry ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x0a0f14, 0.0065);
  camera.far = 900; camera.near = 0.04; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;

  // floor & hatch
  const fl = mesh(new THREE.CircleGeometry(R_OUT + 0.02, 48), M.floor, 0, 0, 0); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
  O.hatch = grp(HATCH.x, 0, HATCH.z);
  box(0.96, 0.03, 0.96, M.iron, 0, 0.012, 0, O.hatch).castShadow = false;
  O.hatchLid = grp(0, 0.03, 0.42, O.hatch);
  box(0.84, 0.035, 0.84, M.ironRed, 0, 0.018, -0.42, O.hatchLid);
  for (let i = -1; i <= 1; i++) box(0.84, 0.012, 0.03, M.iron, 0, 0.04, -0.42 + i * 0.26, O.hatchLid);
  O.hatchRing = mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 14), M.iron, 0, 0.045, -0.7, O.hatchLid); O.hatchRing.rotation.x = Math.PI / 2;
  O.hatchBar = box(1.1, 0.04, 0.07, M.iron, 0, 0.08, 0, O.hatch);
  box(0.05, 0.1, 0.05, M.iron, -0.52, 0.05, 0, O.hatch); box(0.05, 0.1, 0.05, M.iron, 0.52, 0.05, 0, O.hatch);
  O.padlock = grp(0.44, 0.1, 0.06, O.hatch);
  box(0.09, 0.1, 0.035, M.dbrass, 0, 0, 0, O.padlock);
  const sh = mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 12, Math.PI), M.iron, 0, 0.05, 0, O.padlock);
  O.hatchNote = grp(-0.24, 0.115, 0.07, O.hatch); const hn = plane(0.22, 0.16, M.paper, 0, 0, 0, 0, O.hatchNote); hn.rotation.x = -1.25;
  box(0.006, 0.06, 0.006, M.rope, 0, 0.05, -0.03, O.hatchNote);
  O.hatchSpanner = grp(0.18, 0.105, 0.09, O.hatch); box(0.24, 0.024, 0.045, M.brass, 0, -0.035, 0, O.hatchSpanner); cyl(0.036, 0.036, 0.026, M.brass, 0.12, -0.035, 0, O.hatchSpanner, 10); box(0.006, 0.05, 0.006, M.rope, -0.08, 0, 0, O.hatchSpanner);
  // lower wall, glazing, mullions, screen, cornice, roof — a 16-sided lantern
  O.screen = [];
  const facetW = 2 * APO * Math.tan(11.25 * DEG) + 0.03;
  for (let k = 0; k < 16; k++) {
    const a = k * 22.5 * DEG, isDoor = k === 4, isScreen = k === 0 || k === 1 || k === 15;
    const c = pol(APO, a);
    if (!isDoor) {
      const w = tbox(facetW, WALL_H, 0.22, M.paint, c.x, WALL_H / 2, c.z, scene, 1); w.rotation.y = faceIn(a);
      const ledge = box(facetW, 0.04, 0.3, M.wood, 0, WALL_H / 2 + 0.02, -0.02, w); ledge.castShadow = false;
      const out = tbox(facetW + 0.02, WALL_H, 0.02, M.white, 0, 0, -0.12, w); out.castShadow = false;
    }
    // glass pane (outside the ledge)
    const gy0 = isDoor ? 1.95 : WALL_H + 0.02;
    const gp = plane(facetW, GLASS_TOP - gy0, M.glass, 0, 0, 0, 0); gp.position.copy(pol(APO + 0.05, a, (GLASS_TOP + gy0) / 2)); gp.rotation.y = faceIn(a); layer1(gp);
    if (isScreen) {
      const s = box(facetW, GLASS_TOP - WALL_H - 0.02, 0.03, M.black, 0, 0, 0); s.position.copy(pol(APO - 0.03, a, (GLASS_TOP + WALL_H) / 2)); s.rotation.y = faceIn(a);
      if (k === 0) { s.material = new THREE.MeshToonMaterial({ color: 0xffffff, map: T.names, gradientMap: GRAD }); }
      O.screen.push(s);
    }
    // mullion at the vertex and horizontal astragals
    const va = a + 11.25 * DEG, vp = pol(APO / Math.cos(11.25 * DEG) + 0.02, va);
    const mu = box(0.07, GLASS_TOP - WALL_H + 0.05, 0.1, M.black, vp.x, (GLASS_TOP + WALL_H) / 2, vp.z); mu.rotation.y = faceIn(va);
    const mu2 = box(0.1, WALL_H, 0.26, M.paint, vp.x, WALL_H / 2, vp.z); mu2.rotation.y = faceIn(va); mu2.position.copy(pol(APO / Math.cos(11.25 * DEG) - 0.02, va, WALL_H / 2));
    const as = box(facetW, 0.045, 0.06, M.black, 0, 0, 0); as.position.copy(pol(APO + 0.05, a, 2.2)); as.rotation.y = faceIn(a);
    const co = box(facetW + 0.05, 0.22, 0.3, M.black, 0, 0, 0); co.position.copy(pol(APO + 0.04, a, GLASS_TOP + 0.1)); co.rotation.y = faceIn(a);
  }
  // roof: dome inside, cone outside, ventilator ball
  const roofIn = mesh(new THREE.ConeGeometry(R_OUT + 0.25, 1.7, 16, 1, true), M.iron, 0, GLASS_TOP + 0.2 + 0.85, 0); roofIn.material = toon(0x3a3f3b, null, { side: THREE.DoubleSide }); roofIn.rotation.y = 11.25 * DEG; roofIn.castShadow = false;
  mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12), M.iron, 0, GLASS_TOP + 2.0, 0);
  mesh(new THREE.SphereGeometry(0.34, 14, 10), M.black, 0, GLASS_TOP + 2.35, 0);
  const vane = grp(0, GLASS_TOP + 2.7, 0); cyl(0.015, 0.015, 0.9, M.black, 0, 0.3, 0, vane); O.vane = box(0.6, 0.18, 0.01, M.black, 0.22, 0.6, 0, vane);

  // gallery door
  O.door = grp(0, 0, 0); O.door.position.copy(pol(APO, A_.door)); O.door.rotation.y = faceIn(A_.door);
  O.doorLeaf = grp(-0.5, 0, 0, O.door);
  box(1.0, 1.1, 0.05, M.iron, 0.5, 0.55, 0, O.doorLeaf);
  box(1.0, 0.07, 0.06, M.black, 0.5, 1.93, 0, O.doorLeaf); box(0.06, 0.8, 0.06, M.black, 0.03, 1.5, 0, O.doorLeaf); box(0.06, 0.8, 0.06, M.black, 0.97, 1.5, 0, O.doorLeaf); box(1.0, 0.05, 0.06, M.black, 0.5, 1.12, 0, O.doorLeaf);
  const dg = plane(0.9, 0.78, M.glass, 0.5, 1.52, 0, 0, O.doorLeaf); layer1(dg);
  O.doorHandle = box(0.04, 0.16, 0.05, M.brass, 0.9, 1.0, 0.05, O.doorLeaf);
  box(0.12, 1.95, 0.24, M.paint, -0.56, 0.97, 0, O.door); box(0.12, 1.95, 0.24, M.paint, 0.56, 0.97, 0, O.door); box(1.24, 0.05, 0.26, M.black, 0, 1.97, 0, O.door);

  // pedestal, clockwork, lens and burner
  O.ped = grp(0, 0, 0);
  cyl(0.5, 0.58, 1.0, M.green, 0, 0.5, 0, O.ped, 20);
  cyl(0.6, 0.6, 0.06, M.brass, 0, 0.03, 0, O.ped, 20); cyl(0.52, 0.52, 0.05, M.brass, 0, 0.98, 0, O.ped, 20); cyl(0.51, 0.51, 0.03, M.brass, 0, 0.62, 0, O.ped, 20);
  const sockA = 200 * DEG, sp = pol(0.53, sockA, 0.55);
  O.socket = grp(sp.x, sp.y, sp.z, O.ped); O.socket.rotation.y = faceOut(sockA);
  box(0.12, 0.12, 0.04, M.brass, 0, 0, 0, O.socket); box(0.04, 0.04, 0.03, M.black, 0, 0, 0.03, O.socket);
  O.crank = grp(0, 0, 0.06, O.socket); O.crank.visible = false;
  box(0.03, 0.03, 0.12, M.iron, 0, 0, 0.04, O.crank); box(0.03, 0.26, 0.03, M.iron, 0, -0.12, 0.1, O.crank); cyl(0.025, 0.025, 0.12, M.wood, 0, -0.24, 0.16, O.crank).rotation.x = Math.PI / 2;
  const brA = 232 * DEG, bp = pol(0.55, brA, 0.4);
  O.brakeBase = grp(bp.x, bp.y, bp.z, O.ped); O.brakeBase.rotation.y = faceOut(brA);
  box(0.08, 0.1, 0.04, M.brass, 0, 0, 0, O.brakeBase);
  O.brake = grp(0, 0, 0.03, O.brakeBase); box(0.025, 0.34, 0.025, M.brass, 0, 0.16, 0, O.brake); mesh(new THREE.SphereGeometry(0.035, 8, 6), M.black, 0, 0.34, 0, O.brake);
  O.brake.rotation.x = -0.5;
  const gw = pol(0.51, 160 * DEG, 0.78); const gwin = plane(0.2, 0.14, basic(0x0d0d0c), gw.x, gw.y, gw.z, faceOut(160 * DEG)); gwin.position.copy(pol(0.515, 160 * DEG, 0.8));
  O.gears = []; for (let i = 0; i < 2; i++) { const gr = mesh(new THREE.CylinderGeometry(0.045 + i * 0.02, 0.045 + i * 0.02, 0.01, 12), M.brass, 0, 0, 0); gr.position.copy(pol(0.5, (157 + i * 7) * DEG, 0.79 + i * 0.01)); gr.rotation.x = Math.PI / 2; gr.rotation.z = faceOut(160 * DEG); O.gears.push(gr); }
  // the lens (turns) — centred on the burner
  O.lens = grp(0, 1.02, 0); O.lens.rotation.y = LENS_REST;
  cyl(0.84, 0.84, 0.06, M.brass, 0, 0.03, 0, O.lens, 24);
  cyl(0.8, 0.8, 0.05, M.brass, 0, 1.62, 0, O.lens, 24); cyl(0.5, 0.8, 0.22, M.brass, 0, 1.76, 0, O.lens, 24);
  const lensBar = toon(0x8a6a2c); for (let i = 0; i < 12; i++) { const bb = box(0.022, 1.56, 0.022, lensBar, 0, 0, 0, O.lens); bb.position.copy(pol(0.8, i * 30 * DEG, 0.84)); }
  const lg = mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.52, 24, 1, true), M.lens, 0, 0.84, 0, O.lens); layer1(lg); lg.castShadow = false;
  O.bulls = [];
  [-9, 0, 9].forEach(d => { const a = d * DEG, p = new THREE.Vector3(Math.cos(a) * 0.79, 0.78, -Math.sin(a) * 0.79); const b = plane(0.46, 0.46, M.bull, p.x, p.y, p.z, 0, O.lens); b.rotation.y = Math.atan2(p.x, p.z); layer1(b); O.bulls.push(b); });
  O.lens.traverse(o => { if (o.isMesh) o.castShadow = false; });
  // burner (fixed, inside the lens)
  O.burner = grp(0, 1.02, 0);
  cyl(0.09, 0.12, 0.4, M.brass, 0, 0.26, 0, O.burner); cyl(0.13, 0.13, 0.06, M.dbrass, 0, 0.48, 0, O.burner);
  O.cup = cyl(0.07, 0.06, 0.08, M.brass, 0, 0.1, 0, O.burner);
  O.mantle = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 12), basic(0x4a4640), 0, 0.62, 0, O.burner);
  O.chimney = mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.36, 12, 1, true), M.lens, 0, 0.66, 0, O.burner); layer1(O.chimney);
  O.flame = new THREE.Sprite(M.glowS.clone()); O.flame.scale.set(0.9, 1.1, 1); O.flame.position.set(0, 0.64, 0); O.burner.add(O.flame); layer1(O.flame); O.flame.material.opacity = 0;
  O.burner.traverse(o => { if (o.isMesh) o.castShadow = false; });
  O.feedPipe = cyl(0.018, 0.018, 1.9, M.brass, 0, 0, 0); O.feedPipe.rotation.z = Math.PI / 2; O.feedPipe.rotation.y = -A_.tank; O.feedPipe.position.copy(pol(1.52, A_.tank, 0.05)); O.feedPipe.castShadow = false;

  // paraffin tank with pump and gauge
  O.tank = grp(0, 0, 0); O.tank.position.copy(pol(2.5, A_.tank)); O.tank.rotation.y = faceIn(A_.tank);
  cyl(0.2, 0.2, 0.55, M.brass, 0, 0.45, 0, O.tank, 16); mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, TAU, 0, Math.PI / 2), M.brass, 0, 0.72, 0, O.tank);
  [[-0.14, -0.14], [0.14, -0.14], [0, 0.16]].forEach(([x, z]) => box(0.03, 0.2, 0.03, M.iron, x, 0.1, z, O.tank));
  O.plunger = grp(0.08, 0.8, 0, O.tank); cyl(0.012, 0.012, 0.36, M.iron, 0, 0.1, 0, O.plunger); box(0.2, 0.03, 0.03, M.wood, 0, 0.28, 0, O.plunger);
  O.gauge = grp(-0.06, 0.62, 0.2, O.tank); cyl(0.07, 0.07, 0.03, M.brass, 0, 0, 0, O.gauge).rotation.x = Math.PI / 2;
  plane(0.12, 0.12, basic(0xffffff, { map: T.gauge }), 0, 0, 0.017, 0, O.gauge);
  O.needle = grp(0, 0, 0.022, O.gauge); box(0.004, 0.05, 0.002, basic(0x111111), 0, 0.022, 0, O.needle); O.needle.rotation.z = 2.3;

  // desk, log, clock, stool, barometer
  O.desk = grp(0, 0, 0); O.desk.position.copy(pol(2.5, A_.desk)); O.desk.rotation.y = faceIn(A_.desk);
  tbox(0.95, 0.05, 0.5, M.wood, 0, 0.74, 0, O.desk); [[-0.42, -0.2], [0.42, -0.2], [-0.42, 0.2], [0.42, 0.2]].forEach(([x, z]) => box(0.05, 0.72, 0.05, M.wood, x, 0.36, z, O.desk));
  tbox(0.9, 0.18, 0.46, M.wood, 0, 0.62, 0, O.desk);
  O.log = grp(-0.08, 0.77, 0.04, O.desk); box(0.5, 0.025, 0.36, basic(0x3d2616), 0, 0, 0, O.log); const lp = plane(0.48, 0.34, basic(0xffffff, { map: T.logbook }), 0, 0.014, 0, 0, O.log); lp.rotation.x = -Math.PI / 2;
  cyl(0.025, 0.03, 0.05, M.black, 0.3, 0.79, -0.12, O.desk); box(0.16, 0.008, 0.01, M.black, 0.26, 0.772, 0.02, O.desk).rotation.y = 0.4;
  O.clock = grp(0.33, 0.9, -0.14, O.desk); cyl(0.1, 0.1, 0.05, M.wood, 0, 0, 0, O.clock).rotation.x = Math.PI / 2; plane(0.16, 0.16, basic(0xffffff, { map: T.clock }), 0, 0, 0.027, 0, O.clock); box(0.05, 0.08, 0.05, M.wood, 0, -0.1, 0, O.clock);
  O.stool = grp(0, 0, 0); O.stool.position.copy(pol(2.0, A_.desk + 0.05)); cyl(0.18, 0.18, 0.04, M.wood, 0, 0.45, 0, O.stool); [0, 1, 2].forEach(i => { const p = pol(0.13, i * 2.09); box(0.035, 0.44, 0.035, M.wood, p.x, 0.22, p.z, O.stool); });
  O.baro = grp(0, 0, 0); O.baro.position.copy(pol(APO / Math.cos(11.25 * DEG) - 0.08, A_.baro, 1.55)); O.baro.rotation.y = faceIn(A_.baro);
  cyl(0.11, 0.11, 0.04, M.dbrass, 0, 0, 0, O.baro).rotation.x = Math.PI / 2; plane(0.19, 0.19, basic(0xffffff, { map: T.baro }), 0, 0, 0.022, 0, O.baro);

  // oilskin coat by the door
  O.coat = grp(0, 0, 0); O.coat.position.copy(pol(2.9, A_.coat)); O.coat.rotation.y = faceIn(A_.coat);
  box(0.1, 0.03, 0.08, M.brass, 0, 1.86, -0.03, O.coat);
  const body = mesh(new THREE.CylinderGeometry(0.13, 0.3, 1.05, 14), M.oil, 0, 1.24, 0.03, O.coat); body.scale.z = 0.42;
  const col = mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.12, 12), M.oil, 0, 1.8, 0.03, O.coat); col.scale.z = 0.6;
  [-1, 1].forEach(sd => { const sl = mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.7, 8), M.oil, sd * 0.17, 1.4, 0.07, O.coat); sl.rotation.z = sd * 0.1; });
  O.coatPocket = box(0.13, 0.1, 0.02, toon(0x7d6c28), 0.09, 1.08, 0.16, O.coat);
  const hat = mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.08, 14), M.oil, -0.02, 1.92, 0.02, O.coat); hat.rotation.x = 0.3;
  // flag locker (lid open, chart inside)
  O.locker = grp(0, 0, 0); O.locker.position.copy(pol(2.72, A_.locker)); O.locker.rotation.y = faceIn(A_.locker);
  tbox(0.8, 0.95, 0.42, M.wood, 0, 0.475, 0, O.locker);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const cols = [0xc42a2c, 0x1d4b97, 0xefbf2e, 0xf1ede2, 0x161616]; const f = cyl(0.06, 0.06, 0.3, toon(cols[(r * 4 + c) % 5]), -0.28 + c * 0.19, 0.25 + r * 0.25, 0.14, O.locker); f.rotation.x = Math.PI / 2; }
  box(0.8, 0.02, 0.01, M.black, 0, 0.36, 0.215, O.locker); box(0.8, 0.02, 0.01, M.black, 0, 0.61, 0.215, O.locker);
  O.lid = grp(0, 0.95, -0.2, O.locker); tbox(0.8, 0.04, 0.42, M.wood, 0, 0.02, 0.21, O.lid); O.lid.rotation.x = -1.75;
  // Duncan's hoist, bent together and rolled, with a luggage tag
  O.flagBundle = grp(0.05, 0.99, 0.06, O.locker);
  const fb1 = cyl(0.07, 0.07, 0.42, toon(0xf1ede2), -0.02, 0, 0, O.flagBundle, 12); fb1.rotation.z = Math.PI / 2;
  const fb2 = cyl(0.072, 0.072, 0.1, toon(0x1d4b97), -0.12, 0, 0, O.flagBundle, 12); fb2.rotation.z = Math.PI / 2;
  const fb3 = cyl(0.072, 0.072, 0.08, toon(0xc42a2c), 0.1, 0, 0, O.flagBundle, 12); fb3.rotation.z = Math.PI / 2;
  box(0.01, 0.15, 0.15, M.rope, 0.02, 0, 0, O.flagBundle); const tag = plane(0.06, 0.09, M.paper, 0.12, 0.06, 0.07, 0, O.flagBundle); tag.rotation.x = -0.6;

  // speaking tube
  O.tube = grp(0, 0, 0); O.tube.position.copy(pol(2.84, A_.tube)); O.tube.rotation.y = faceIn(A_.tube);
  cyl(0.035, 0.035, 1.2, M.brass, 0, 0.6, 0, O.tube); const tb = cyl(0.035, 0.035, 0.2, M.brass, 0, 1.22, 0.07, O.tube); tb.rotation.x = Math.PI / 2 - 0.3;
  const mouth = mesh(new THREE.CylinderGeometry(0.075, 0.04, 0.12, 14, 1, true), M.brass, 0, 1.26, 0.2, O.tube); mouth.rotation.x = Math.PI / 2;
  O.whistle = grp(0, 1.26, 0.27, O.tube); cyl(0.07, 0.07, 0.03, M.dbrass, 0, 0, 0, O.whistle).rotation.x = Math.PI / 2; cyl(0.012, 0.012, 0.05, M.dbrass, 0, 0, 0.03, O.whistle).rotation.x = Math.PI / 2;

  // Duncan's sea chest
  O.chest = grp(0, 0, 0); O.chest.position.copy(pol(2.62, A_.chest)); O.chest.rotation.y = faceIn(A_.chest);
  tbox(0.95, 0.42, 0.5, M.wood, 0, 0.21, 0, O.chest); box(0.97, 0.03, 0.52, M.iron, 0, 0.12, 0, O.chest); box(0.97, 0.03, 0.52, M.iron, 0, 0.34, 0, O.chest);
  O.chestLid = grp(0, 0.43, -0.25, O.chest); tbox(0.97, 0.08, 0.52, M.wood, 0, 0.04, 0.25, O.chestLid); box(0.99, 0.02, 0.54, M.iron, 0, 0.08, 0.25, O.chestLid);
  [-0.5, 0.5].forEach(x => { const h = mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), M.rope, x, 0.3, 0, O.chest); h.rotation.y = Math.PI / 2; });
  O.chestLock = grp(0, 0.34, 0.262, O.chest); box(0.06, 0.08, 0.02, M.iron, 0, 0, 0, O.chestLock);
  O.chestIn = grp(0, 0.3, 0, O.chest);
  O.letterIn = plane(0.16, 0.11, M.cream, -0.15, 0.03, 0.05, 0, O.chestIn); O.letterIn.rotation.x = -Math.PI / 2; O.letterIn.rotation.z = 0.3;
  box(0.18, 0.05, 0.24, basic(0x1d1a17), 0.18, 0.02, 0, O.chestIn);
  O.chestIn.visible = false;

  // the paraffin can, lashed to the railing outside the balcony door
  O.can = grp(0, 0, 0); O.can.position.copy(pol(4.08, A_.can)); O.can.rotation.y = faceIn(A_.can);
  buildCan(O.can);
  O.canRope = grp(0, 0, 0); O.canRope.position.copy(pol(4.22, A_.can)); O.canRope.rotation.y = faceIn(A_.can);
  box(0.36, 0.012, 0.02, M.rope, 0, 0.22, 0.02, O.canRope); box(0.36, 0.012, 0.02, M.rope, 0, 0.05, 0.02, O.canRope);
  O.canHeld = grp(-0.34, -0.52, -0.55, camera); buildCan(O.canHeld); O.canHeld.scale.setScalar(0.8); O.canHeld.rotation.set(0.1, 0.5, 0.06); O.canHeld.visible = false;
  O.canHeld.traverse(o => { o.castShadow = false; o.userData.noRay = true; });

  // stove, kettle & mugs; bench with a Bible
  O.stove = grp(0, 0, 0); O.stove.position.copy(pol(2.65, A_.stove)); O.stove.rotation.y = faceIn(A_.stove);
  cyl(0.14, 0.16, 0.34, M.black, 0, 0.17, 0, O.stove); cyl(0.17, 0.17, 0.03, M.iron, 0, 0.35, 0, O.stove);
  cyl(0.1, 0.12, 0.14, toon(0x8c8f8d), 0, 0.44, 0, O.stove); const sp2 = cyl(0.012, 0.012, 0.12, toon(0x8c8f8d), 0.12, 0.46, 0, O.stove); sp2.rotation.z = -1.0;
  [0, 1, 2].forEach(i => { const p = pol(APO - 0.18, A_.stove + (i - 1) * 0.12, WALL_H + 0.08); cyl(0.04, 0.035, 0.09, toon([0xe6e0cf, 0x2f5a8a, 0xe6e0cf][i]), p.x, p.y, p.z); });
  O.bench = grp(0, 0, 0); O.bench.position.copy(pol(2.72, A_.bench)); O.bench.rotation.y = faceIn(A_.bench);
  tbox(1.05, 0.05, 0.34, M.wood, 0, 0.44, 0, O.bench); box(0.05, 0.42, 0.3, M.wood, -0.46, 0.21, 0, O.bench); box(0.05, 0.42, 0.3, M.wood, 0.46, 0.21, 0, O.bench);
  box(0.16, 0.05, 0.22, basic(0x1d1a17), -0.2, 0.49, 0, O.bench); box(0.22, 0.04, 0.14, toon(0x6e4b6b), 0.25, 0.48, 0.02, O.bench);

  // storm lantern (starts on the floor where you woke)
  O.lantern = grp(0, 0, 0); O.lantern.position.copy(pol(1.55, 208 * DEG));
  buildLantern(O.lantern);
  O.held = grp(0.3, -0.33, -0.62, camera); buildLantern(O.held, true); O.held.visible = false; O.held.scale.setScalar(0.5);

  // prints & footprints pools
  O.prints = []; for (let i = 0; i < 10; i++) { const p = plane(0.2, 0.2, M.print, 0, 0, 0, 0); p.visible = false; layer1(p); O.prints.push(p); }
  O.feet = []; for (let i = 0; i < 12; i++) { const f = plane(0.12, 0.26, M.foot, 0, 0.004, 0, 0); f.rotation.x = -Math.PI / 2; f.visible = false; layer1(f); O.feet.push(f); }

  buildGallery();
  buildExterior();
  buildLights();
  colliders.length = 0;
  const boxCol = (obj, hw, hd) => { const p = obj.getWorldPosition(new THREE.Vector3()); const a = obj.rotation.y; const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); const ex = hw * c + hd * s, ez = hw * s + hd * c; return addCol(obj.name || 'c', p.x - ex, p.x + ex, p.z - ez, p.z + ez); };
  boxCol(O.desk, 0.5, 0.27); boxCol(O.locker, 0.42, 0.23); boxCol(O.chest, 0.5, 0.27); boxCol(O.stove, 0.18, 0.18); boxCol(O.bench, 0.55, 0.2); boxCol(O.tank, 0.24, 0.24);
  const fp = pol(4.12, A_.flag); addCol('flagstaff', fp.x - 0.08, fp.x + 0.08, fp.z - 0.08, fp.z + 0.08);
  O.colStool = boxCol(O.stool, 0.2, 0.2);
  // only walls, screen and furniture throw the lamp's shadow
  scene.traverse(o => { if (o.isMesh) o.castShadow = false; });
  [O.screen].flat().forEach(o => o.castShadow = true);
  scene.traverse(o => { if (o.isMesh && (o.material === M.paint || o.material === M.black) && o.position.lengthSq() > 4) o.castShadow = true; });
  [O.desk, O.locker, O.chest, O.stove, O.bench, O.door, O.coat, O.tank].forEach(g => g.traverse(o => { if (o.isMesh) o.castShadow = true; }));
}
function buildLantern(g, held) {
  cyl(0.07, 0.08, 0.03, M.black, 0, 0.015, 0, g, 12); cyl(0.07, 0.07, 0.025, M.black, 0, 0.23, 0, g, 12);
  const gl = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.18, 12, 1, true), M.lens, 0, 0.12, 0, g); layer1(gl);
  for (let i = 0; i < 3; i++) { const p = pol(0.068, i * 2.09); box(0.01, 0.2, 0.01, M.black, p.x, 0.12, p.z, g); }
  const h = mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 14, Math.PI), M.black, 0, 0.25, 0, g);
  const fl = new THREE.Sprite(M.glowS.clone()); fl.scale.set(0.2, 0.24, 1); fl.position.set(0, 0.11, 0); g.add(fl); layer1(fl); fl.material.color.set(0xffc27a);
  g.userData.flame = fl;
  if (held) g.traverse(o => { o.castShadow = false; o.userData.noRay = true; });
}

function buildCan(g) {
  box(0.24, 0.34, 0.15, M.canRed, 0, 0.17, 0, g); plane(0.2, 0.2, M.can, 0, 0.18, 0.077, 0, g);
  box(0.25, 0.015, 0.16, M.dbrass, 0, 0.345, 0, g);
  cyl(0.022, 0.022, 0.05, M.dbrass, 0.08, 0.37, 0, g, 8); box(0.12, 0.018, 0.02, M.black, -0.03, 0.39, 0, g);
  box(0.012, 0.04, 0.012, M.black, -0.085, 0.37, 0, g); box(0.012, 0.04, 0.012, M.black, 0.025, 0.37, 0, g);
}

function buildGallery() {
  // grating floor ring and outer edge
  const gf = mesh(new THREE.RingGeometry(R_OUT - 0.01, R_RAIL + 0.03, 64, 1), M.grate, 0, -0.005, 0); gf.rotation.x = -Math.PI / 2; gf.material.side = THREE.DoubleSide;
  const edge = mesh(new THREE.CylinderGeometry(R_RAIL + 0.03, R_RAIL + 0.03, 0.2, 48, 1, true), M.black, 0, -0.1, 0);
  // railing
  // (the railing never blocks what you're aiming at: you reach over it and between the bars)
  for (let i = 0; i < 32; i++) { const p = pol(R_RAIL, i * 11.25 * DEG); box(0.035, 1.05, 0.035, M.black, p.x, 0.525, p.z).userData.noRay = true; }
  [1.05, 0.55].forEach(y => { const r = mesh(new THREE.TorusGeometry(R_RAIL, y > 1 ? 0.03 : 0.018, 6, 96), M.black, 0, y, 0); r.rotation.x = Math.PI / 2; r.userData.noRay = true; });
  // corbels under the gallery (seen from over the rail)
  for (let i = 0; i < 24; i++) { const p = pol(3.75, i * 15 * DEG, -0.55); const c = box(0.18, 0.6, 0.9, M.white, p.x, p.y, p.z); c.rotation.y = faceIn(i * 15 * DEG); }
  // flagstaff and the hoist
  const fp = pol(4.12, A_.flag);
  cyl(0.035, 0.05, 5.8, M.wood, fp.x, 2.9, fp.z); box(0.5, 0.03, 0.03, M.wood, fp.x, 5.3, fp.z).rotation.y = faceIn(A_.flag);
  O.flags = [];
  const tang = new THREE.Vector3(-Math.sin(A_.flag), 0, Math.cos(A_.flag));
  HOIST.forEach((ch, i) => {
    const geo = new THREE.PlaneGeometry(0.72, 0.48, 10, 4); geo.translate(0.36, 0, 0);
    const mat = toon(0xffffff, T['flag' + ch], { side: THREE.DoubleSide });
    const f = new THREE.Mesh(geo, mat); f.position.set(fp.x + tang.x * 0.04, FLAG_TOP - i * 0.6, fp.z + tang.z * 0.04);
    f.rotation.y = Math.atan2(tang.x, tang.z) - Math.PI / 2; scene.add(f); f.userData.base = geo.attributes.position.array.slice(); f.userData.ph = i * 0.7;
    f.visible = false; O.flags.push(f);
  });
  const hal = cyl(0.004, 0.004, 5.2, M.rope, fp.x + tang.x * 0.04, 2.6, fp.z + tang.z * 0.04);
  // the cleat where the flag rope is made fast, at hand height on the pole
  box(0.12, 0.025, 0.03, M.iron, fp.x + tang.x * 0.06, 1.05, fp.z + tang.z * 0.06).rotation.y = faceIn(A_.flag);
  O.cleatHit = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.5, 0.55), HITMAT); O.cleatHit.position.set(fp.x, 0.85, fp.z); O.cleatHit.layers.set(2); scene.add(O.cleatHit);
  // a narrow stone ledge outside the railing, above the drop; the crank went over onto it
  const lip = mesh(new THREE.RingGeometry(R_RAIL + 0.02, R_RAIL + 0.42, 96, 1), M.stone, 0, -0.2, 0); lip.rotation.x = -Math.PI / 2; lip.material.side = THREE.DoubleSide;
  const lipEdge = mesh(new THREE.CylinderGeometry(R_RAIL + 0.42, R_RAIL + 0.42, 0.14, 96, 1, true), M.stone, 0, -0.27, 0); lipEdge.castShadow = false;
  O.lipCrank = grp(0, 0, 0); O.lipCrank.position.copy(pol(4.56, A_.lip, -0.19)); O.lipCrank.rotation.y = faceIn(A_.lip) + 0.6;
  box(0.035, 0.035, 0.36, M.iron, 0, 0.018, 0, O.lipCrank); box(0.035, 0.035, 0.14, M.iron, 0.07, 0.018, 0.17, O.lipCrank).rotation.y = Math.PI / 2;
  cyl(0.026, 0.026, 0.13, M.wood, 0.14, 0.03, 0.17, O.lipCrank, 8).rotation.x = Math.PI / 2;
  // the boat hook, on its brackets on the outside wall, round on the land side
  O.hookRack = grp(0, 0, 0); O.hookRack.position.copy(pol(3.38, A_.hook, 0.82)); O.hookRack.rotation.y = faceOut(A_.hook);
  [-0.42, 0.42].forEach(x => { box(0.04, 0.1, 0.22, M.iron, x, -0.05, -0.07, O.hookRack); });
  O.hookPole = grp(0, 0, 0.02, O.hookRack);
  const hp = cyl(0.024, 0.024, 1.4, M.wood, 0, 0, 0, O.hookPole, 8); hp.rotation.z = Math.PI / 2;
  cyl(0.028, 0.022, 0.1, M.iron, 0.73, 0, 0, O.hookPole, 8).rotation.z = Math.PI / 2;
  const hk = mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 10, Math.PI * 1.2), M.iron, 0.8, 0.06, 0, O.hookPole); hk.rotation.z = -0.5;
  // telescope on the land side
  O.scope = grp(0, 0, 0); O.scope.position.copy(pol(R_RAIL - 0.05, A_.scope, 1.08)); O.scope.rotation.y = faceOut(A_.scope);
  cyl(0.03, 0.04, 0.12, M.black, 0, 0.04, 0, O.scope);
  O.scopeTube = grp(0, 0.12, 0, O.scope); O.scopeTube.rotation.x = 0.75;
  cyl(0.032, 0.045, 0.85, M.brass, 0, 0, 0.1, O.scopeTube).rotation.x = Math.PI / 2; cyl(0.05, 0.05, 0.06, M.dbrass, 0, 0, 0.52, O.scopeTube).rotation.x = Math.PI / 2;
}

function buildExterior() {
  // tower, base and rocks
  const tw = mesh(new THREE.CylinderGeometry(3.25, 4.9, 33.5, 40, 1, true), M.tower, 0, -0.3 - 16.75, 0); tw.receiveShadow = false;
  for (let i = 0; i < 7; i++) { const a = (i * 97) * DEG, y = -3 - i * 4.2, r = 3.3 + (Math.abs(y) / 33.5) * 1.62; const w = box(0.35, 0.6, 0.1, M.black, 0, 0, 0); w.position.copy(pol(r, a, y)); w.rotation.y = faceOut(a); w.rotation.x = -0.05; }
  cyl(5.8, 6.2, 2.4, M.white, 0, ROCK_Y - 1.6, 0, scene, 32);
  O.rocks = []; const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 26; i++) {
    const a = rng() * TAU, r = 7 + rng() * 22, s = 1.5 + rng() * 3.8;
    const g = new THREE.DodecahedronGeometry(s, 0); const m = mesh(g, M.rock, 0, 0, 0); m.position.copy(pol(r, a, SEA_Y + s * 0.35 - rng() * 1.2)); m.scale.set(1 + rng() * 0.6, 0.45 + rng() * 0.4, 1 + rng() * 0.6); m.rotation.set(rng(), rng() * 3, rng());
    O.rocks.push(m);
  }
  // a rock under the lantern on the land side
  const lr = mesh(new THREE.DodecahedronGeometry(2.6, 0), M.rock, 0, 0, 0); lr.position.copy(pol(MORSE_R, A_.morse, ROCK_Y - 1.7)); lr.scale.set(1.5, 0.7, 1.4);
  const slab = box(8, 2.2, 6, M.rock, 0, 0, 0); slab.position.copy(pol(8, 200 * DEG, SEA_Y + 0.6)); slab.rotation.y = 0.3;
  // sea
  O.sea = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, IS_TOUCH ? 110 : 200, IS_TOUCH ? 110 : 200), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, flash: { value: 0 }, beamA: { value: 0 }, beamOn: { value: 0 }, dawn: { value: 0 }, fogC: { value: new THREE.Color(0x0a0f14) }, fogD: { value: 0.0065 } }, side: THREE.DoubleSide,
    vertexShader: `uniform float time; varying vec3 vW; varying float vH;
      void main(){ vec3 p = position.xzy; p.z = -p.z; float d = length(p.xz);
        float amp = clamp(d/40.0, 0.25, 1.0);
        float h = sin(p.x*0.09+time*0.9)*0.9 + sin(p.z*0.07-time*0.7)*0.8 + sin((p.x+p.z)*0.21+time*1.7)*0.35 + sin((p.x-p.z*0.6)*0.5+time*2.3)*0.12;
        p.y += h*amp; vH = h; vec4 w = modelMatrix*vec4(p,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float time, flash, beamA, beamOn, dawn, fogD; uniform vec3 fogC; varying vec3 vW; varying float vH;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*43758.5); }
      void main(){ float d = length(vW.xz);
        vec3 c = mix(vec3(0.018,0.03,0.04), vec3(0.05,0.075,0.085), smoothstep(-1.2,1.6,vH));
        float crest = smoothstep(1.35,1.9,vH); c += crest*vec3(0.12,0.14,0.15);
        float foam = smoothstep(26.0,7.0,d) * (0.45+0.55*hash(floor(vW.xz*1.3)+floor(time*3.0)));
        c = mix(c, vec3(0.55,0.6,0.62), foam*0.55);
        float a = atan(vW.z, vW.x); float da = abs(mod(a-beamA+3.14159,6.28318)-3.14159);
        float beam = exp(-da*da*160.0) * smoothstep(20.0,90.0,d) * smoothstep(700.0,180.0,d);
        c += beam*beamOn*vec3(0.5,0.45,0.32);
        c += flash*vec3(0.18,0.2,0.26);
        c = mix(c, c*vec3(1.6,1.25,1.1)+vec3(0.05,0.04,0.03), dawn);
        float f = 1.0-exp(-pow(fogD*length(vW-cameraPosition),2.0));
        gl_FragColor = vec4(mix(c, fogC*(1.0+flash*1.5), f), 1.0); }`,
  }));
  O.sea.position.y = SEA_Y; layer1(O.sea); scene.add(O.sea);
  // sky dome
  O.sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, flash: { value: 0 }, dawn: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float time, flash, dawn; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
      void main(){ float y = vD.y; vec2 uv = vD.xz/(0.25+max(y,0.0))*1.6 + vec2(time*0.03, time*0.012);
        float cl = fbm(uv); vec3 top = vec3(0.012,0.016,0.022), hor = vec3(0.045,0.055,0.065);
        vec3 c = mix(hor, top, smoothstep(0.0,0.5,y)); c = mix(c, c*1.9+vec3(0.01), smoothstep(0.45,0.8,cl));
        c += flash*vec3(0.35,0.38,0.5)*(0.4+cl);
        vec3 dw = mix(vec3(0.62,0.5,0.42), vec3(0.2,0.24,0.3), smoothstep(-0.05,0.45,y)); dw = mix(dw, dw*0.8, smoothstep(0.5,0.8,cl));
        c = mix(c, dw, dawn);
        gl_FragColor = vec4(c,1.0); }`,
  }));
  layer1(O.sky); scene.add(O.sky);
  // rain: short streaks that fall past the lantern
  const N = IS_TOUCH ? 800 : 1400, pos = new Float32Array(N * 6), off = new Float32Array(N * 2 * 4);
  for (let i = 0; i < N; i++) { const a = rand(0, TAU), r = Math.sqrt(rand(0, 1)) * 16 + 1; const x = Math.cos(a) * r, z = Math.sin(a) * r; const y = rand(0, 1); for (let k = 0; k < 2; k++) { pos.set([x, y, z], i * 6 + k * 3); off.set([k, rand(0.8, 1.2), rand(0, 1), r < 3.35 ? 0 : 1], (i * 2 + k) * 4); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('info', new THREE.BufferAttribute(off, 4));
  O.rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, flash: { value: 0 }, beam: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: `uniform float time; attribute vec4 info; varying float vA;
      void main(){ vec3 p = position; float sp = 11.0*info.y; float y = fract(p.y - time*sp/22.0 + info.z)*22.0 - 12.0;
        vec3 wind = vec3(3.5, 0.0, 1.8)/sp; p.y = y + info.x*0.24; p.xz += wind.xz*(y)*0.4 + info.x*wind.xz*0.24;
        vA = info.w; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p,1.0); }`,
    fragmentShader: `uniform float flash, beam; varying float vA; void main(){ if (vA < 0.5) discard; gl_FragColor = vec4(vec3(0.6,0.68,0.75)*(0.35+flash*1.5+beam*0.4), 0.13+flash*0.2); }`,
  }));
  O.rain.frustumCulled = false; layer1(O.rain); scene.add(O.rain);
  // the beam: three shafts (group flashing 3) from the lens
  O.beams = [];
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { k: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying float vL; varying vec3 vN, vV; void main(){ vL = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float k; varying float vL; varying vec3 vN, vV; void main(){ float e = pow(abs(dot(vN, vV)), 2.0); float near = smoothstep(0.012, 0.06, 1.0-vL); float a = pow(vL, 2.4) * e * k * 0.2 * near; gl_FragColor = vec4(vec3(1.0,0.92,0.76)*a, 1.0); }`,
  });
  [-9, 0, 9].forEach(d => {
    const g = new THREE.CylinderGeometry(0.42, 7.5, 110, 24, 1, true); g.rotateZ(Math.PI / 2); g.translate(55 + 0.8, 0, 0);
    const m = new THREE.Mesh(g, beamMat); m.rotation.y = d * DEG; layer1(m); m.frustumCulled = false; m.renderOrder = 5; O.lens.add(m); m.position.y = 0.78; O.beams.push(m);
  });
  O.beamMat = beamMat;
  // lights far away: the Ardnish lightship, the relief boat, and Ewan's lantern on the rocks
  const far = (col, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.set(s, s, 1); layer1(sp); scene.add(sp); return sp; };
  O.lightship = far(0xfff0d0, 14); O.lightship.position.copy(pol(620, 128 * DEG, SEA_Y + 9));
  O.boat = grp(0, 0, 0); O.boat.visible = false;
  O.boatMast = far(0xfff6e0, 7); O.boatRed = far(0xff4030, 4); O.boatGreen = far(0x40ff70, 4);
  O.boatPos = pol(330, A_.boat, SEA_Y + 3);
  O.morse = far(0xffc070, 3.2); O.morse.material.fog = false; O.morse.position.copy(pol(MORSE_R, A_.morse, ROCK_Y + 0.35)); O.morse.visible = false;
  O.ewan = makeFigure('keeper');
  const ep = pol(MORSE_R + 0.35, A_.morse + 0.9 * DEG); O.ewan.position.set(ep.x, ROCK_Y - 0.62, ep.z); O.ewan.rotation.y = Math.atan2(-ep.x, -ep.z); O.ewan.rotation.order = 'YXZ'; O.ewan.rotation.x = -0.45; O.ewan.visible = false;
  // the drowned standing on the rocks, facing the tower
  O.rockFigs = [];
  for (let i = 0; i < 13; i++) {
    const a = (40 + i * 25) * DEG + rand(-0.12, 0.12), r = 14 + (i % 3) * 4 + rand(0, 3);
    const f = makeFigure('drowned'); const p = pol(r, a); f.position.set(p.x, SEA_Y + 1.1 + rand(0, 1.5), p.z); f.rotation.y = Math.atan2(-p.x, -p.z); f.scale.setScalar(1.15);
    f.userData.a = a; O.rockFigs.push(f);
  }
  // three that come onto the gallery, and a ring of them for the dark
  O.galFigs = [0, 1, 2].map(() => { const f = makeFigure('drowned'); f.visible = false; return f; });
  O.ring = [];
  for (let k = 0; k < 16; k++) { if (k === 4) continue; const kind = k === 9 ? 'keeper' : k === 11 ? 'keeper' : 'drowned'; const f = makeFigure(kind); const a = k * 22.5 * DEG + rand(-0.06, 0.06); const p = pol(APO + 0.36, a); f.position.set(p.x, -0.02, p.z); f.rotation.y = Math.atan2(-p.x, -p.z); f.visible = false; O.ring.push(f); }
  O.intruder = makeFigure('drowned'); O.intruder.visible = false;
  // keepers for the last picture
  O.keepers = [0, 1, 2].map(() => { const f = makeFigure('keeper'); f.visible = false; return f; });
}

function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x6a7c92, 0x1a1512, 0.42); scene.add(L.hemi);
  L.burner = new THREE.PointLight(0xffc98a, 0, 0, 2); L.burner.position.set(0, 1.85, 0); scene.add(L.burner);
  L.burner.castShadow = true; L.burner.shadow.mapSize.set(512, 512); L.burner.shadow.bias = -0.004; L.burner.shadow.normalBias = 0.03; L.burner.shadow.camera.near = 0.3; L.burner.shadow.camera.far = 14;
  L.beam = new THREE.SpotLight(0xfff0d8, 0, 0, 0.26, 0.6, 1.1); L.beam.position.set(0, 1.8, 0); scene.add(L.beam, L.beam.target);
  L.lantern = new THREE.PointLight(0xffb566, 2.4, 0, 2); scene.add(L.lantern);
  L.bolt = new THREE.DirectionalLight(0xbcd0ff, 0); L.bolt.position.set(-30, 40, 20); scene.add(L.bolt);
  L.morse = new THREE.PointLight(0xffb060, 0, 0, 2); L.morse.position.copy(pol(MORSE_R, A_.morse, ROCK_Y + 0.6)); scene.add(L.morse);
}


/* =====================================================================
   THE LAMP ROOM · part B: items, documents, voices, hints
   ===================================================================== */
const ITEMS = {
  lantern: { name: 'Storm lantern', short: 'Lantern', desc: 'A hurricane lantern, burning low. The glass is sooted on one side, and the handle is still warm from someone else\'s hand.' },
  matches: { name: 'Box of matches', short: 'Matches', desc: 'Bryant &amp; May safety matches, damp at the corners. There are a few left.' },
  hook: { name: 'Boat hook', short: 'Boat hook', desc: 'A long ash pole with an iron hook on the end, for fending off and fishing things out of the water.' },
  crank: { name: 'Winding crank', short: 'Crank', desc: 'An iron crank with a square socket, the wooden handle worn pale and wet from the ledge. It fits the machine that turns the lens.' },
  flags: { name: 'Signal flags', short: 'Flags', desc: 'Two signal flags, already clipped together and rolled tight. Duncan\'s tag: <i>N over C. In distress. Run up for the boat.</i>' },
  spanner: { name: 'Burner spanner', short: 'Spanner', desc: 'A short brass spanner stamped N.L.B. Duncan\'s note says it opens the cup under the burner.' },
  key: { name: 'Hatch key', short: 'Hatch key', desc: 'A heavy iron key, still warm from the lamp.' },
};

const HEARD = {
  tube1: { title: 'The speaking tube: "Ewan"', text: '"Hello? &hellip; Who\'s that up there? Tam? Is that you? &hellip; It\'s Ewan. I\'m at the foot of the stair. I\'ve hurt my leg on the steps, and the lantern\'s gone out. Open the hatch, man. It\'s that cold down here."' },
  tube2: { title: 'The speaking tube, after you lit the lamp', text: '"Why did you light her? &hellip; It hurts them, Tam. It hurts me. &hellip; Put her out. Just for a wee minute, so I can come up."' },
  tube3: { title: 'The speaking tube, once the lens was turning', text: '"You\'re not Tam. &hellip; Tam\'s down here with us. Where did you come from?"' },
  tube4: { title: 'The speaking tube, once the boat was in sight', text: '"Duncan says you\'ve found his note. He says it\'s all right now. Put her out, and come down. We\'ll wait for you at the bottom."' },
  duncan: { title: 'In the dark, from the tube', text: 'A different voice, older: "Quick, lad. They\'re on the balcony. Don\'t look at the glass."' },
  sea: { title: 'A woman\'s voice outside', text: '"Ewan. Ewan, come away down to the water." &hellip; "It\'s warm in the water. Come down."' },
  ewanEnd: { title: 'The last thing up the tube', text: '"Next year, then."' },
};

const DOCS = {
  log: { title: 'Keeper\'s log, the last page', style: 'ledger', pages: [
    `<span class="h">Thursday 21 December &middot; T. Lennie, Asst. Keeper</span>
     <span class="pencil" style="display:block;margin:4px 0 12px">Keep her lit. Keep her turning. Nothing from the sea can stand where the light falls. &mdash; D.M.</span>
     <div class="ent shaky"><span class="tm">2.40</span>Ewan answered the pipe and went down the stair to the voice. He has not come back.</div>
     <div class="ent shaky"><span class="tm">2.55</span>D. has padlocked the hatch and put the key inside the lamp, so none of us can go down while she burns.</div>
     <div class="ent shaky"><span class="tm">3.10</span>Machine stopped. D. went out with the crank and the wind took it out of his hand. It is lying on the ledge outside the railing. He has not come back in.</div>
     <div class="ent shaky"><span class="tm">3.25</span>Out of paraffin. She is out. The full can is lashed to the railing by the door.</div>
     <div class="ent shaky"><span class="tm">3.30</span>If you find this: matches in Duncan's coat. Fill her, pump her to the red and light her. Get her turning. Run the flags up for the boat. Do not answer the pipe.</div>`,
  ], onRead: () => flag('readLog') },
  margaret: { title: 'A letter in the chest', style: 'letter', pages: [
    `<p style="text-align:right;margin:0 0 14px">Stornoway, 2nd December</p>
     <p style="margin:0 0 12px">My dear Duncan,</p>
     <p style="margin:0 0 12px">Mrs Rigg was at the door again about Alick. She says he walks the shore road after dark and calls up at her window. The old folk say Skerrow was never lit for ships. It was lit to keep the drowned in the water, and on the longest night it wants a keeper.</p>
     <p style="margin:0 0 12px">Keep it lit, love. Come home.</p>
     <p style="margin:0">Your Margaret</p>`,
  ] },
  note: { title: 'Duncan\'s note, tied to the hatch', style: 'note2', pages: [
    `<p style="margin:0 0 14px">The key is in the lamp, in the brass cup under the burner. This spanner opens it. She must be out to do it.</p>
     <p style="margin:0 0 14px">Not before you see the boat. Then be quick, and don't look at the glass.</p>
     <p style="margin:0 0 14px">Light her again before you go near the hatch.</p>
     <p style="margin:0;text-align:right">D. Moar, P.K.</p>`,
  ], onRead: () => flag('readNote') },
  names: { title: 'Names scratched into the landward screen', style: 'names', pages: [
    `<p>J. Munro 1851 &middot; W. Gunn 1868 &middot; R. Sinclair 1874</p><p>A. Mackay 1890 &middot; H. Bain 1902 &middot; A. Rigg 1909</p><p class="fresh">E. Rigg 1911 &middot; D. Moar 1911 &middot; T. Lennie 1911</p><p style="font-size:15px;color:#8b8375;margin-top:30px">The last three are so fresh that the black paint is still curling up out of the letters.</p>`,
  ] },
};

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'Where do I start?', when: s => s.flags.readLog ? 'solved' : 'active', tiers: [
    'You need light before anything else. Something next to where you woke up is still burning.',
    'Pick up the storm lantern, then look at the desk. The keepers kept a log.',
    'Read the log. The last keeper wrote down exactly what has to be done.',
    'Read the log on the desk: fill the lamp from the can outside, pump it, light it with the matches in the coat, fetch the crank off the ledge, get the lens turning, and run the flags up.' ] },
  { id: 'tube', title: 'The voice in the speaking tube', when: s => s.heard.includes('tube1') ? (s.flags.turning ? 'solved' : 'active') : 'hidden', tiers: [
    'It isn\'t a puzzle, and nothing it says will get you out.',
    'The log says: do not answer the pipe.',
    'You can listen if you want to. It wants the light out. Keep working.',
    'Ignore it. Everything you need is in the lamp room and out on the balcony.' ] },
  { id: 'light', title: 'The great lamp', when: s => s.flags.lit ? 'solved' : 'active', tiers: [
    'The lamp burns paraffin under pressure. It needs paraffin, pressure and a flame.',
    'The tank beside the lamp is empty. There\'s a full can out on the balcony.',
    'Go out through the balcony door: the can is tied to the railing right outside. Carry it in and pour it into the brass tank. The matches are in the coat by the door.',
    'Pick up the can outside the door, carry it to the tank and pour it in. Pump the tank until the needle is in the red. Take the matches from the coat. Then light the lamp.' ] },
  { id: 'crank', title: 'Getting the lens to turn', when: s => s.flags.turning ? 'solved' : (s.flags.readLog || s.flags.sawCrank || s.flags.triedPed) ? 'active' : 'hidden', tiers: [
    'The machine under the lens needs its winding crank. The log says where it went.',
    'It\'s lying on the narrow ledge outside the railing, out of arm\'s reach. You need something long with a hook on it.',
    'Walk round the balcony to the land side, where the beam never shines. A boat hook hangs on the wall there. Then look over the railing on the sea side, near the paraffin tank.',
    'Take the boat hook from the wall on the land side, fish the crank off the ledge, fit it to the pedestal under the lens, wind it until it\'s tight, then take the brake off.' ] },
  { id: 'flags', title: 'Signalling the boat', when: s => s.flags.flagsUp ? 'solved' : (s.flags.readLog || s.inv.includes('flags')) ? 'active' : 'hidden', tiers: [
    'The log says to run the flags up for the boat.',
    'Duncan left a pair of signal flags ready, on top of the flag locker.',
    'Take them out to the flagpole on the balcony, clip them to the rope and haul them up.',
    'Take the flags from the top of the flag locker, go out to the flagpole, clip them on and haul six times until they\'re at the top.' ] },
  { id: 'boat', title: 'Waiting for the boat', when: s => s.flags.boatSeen ? 'solved' : (s.flags.flagsUp || s.flags.turning) ? 'active' : 'hidden', tiers: [
    'The relief boat will only come in if it can see you need it.',
    'It needs the light turning and the flags flying.',
    'If one of those isn\'t done yet, do it, then keep watch out to sea.',
    'Get the lens turning and the flags at the top of the pole. A few seconds later the boat\'s lights appear to the south-west.' ] },
  { id: 'key', title: 'The hatch key', when: s => s.flags.escaped ? 'solved' : (s.flags.readNote || s.flags.triedHatch || s.flags.boatSeen) ? 'active' : 'hidden', tiers: [
    'Duncan tied a note and a spanner to the hatch bar.',
    'The key is in the brass cup under the burner. The lamp has to be out, and you must wait until you can see the boat.',
    'Once the boat is in sight: put the lamp out, unscrew the cup with the spanner, take the key, and light the lamp again before you go near the hatch. Be quick.',
    'Take the spanner from the hatch. When the boat is in sight, use the lamp to put it out, unscrew the cup three turns, take the key, light the lamp again, then unlock the hatch.' ] },
];


/* =====================================================================
   THE LAMP ROOM · part C: puzzles, scares, sound, per-frame, ending
   ===================================================================== */
const heard = id => { if (!S.heard.includes(id)) { S.heard.push(id); save(); } };
const look = (txt, ms = 4800) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const outside = () => Math.hypot(P.x, P.z) > R_OUT;
const lit = () => S.flags.lit && !S.flags.dark;
const behindPos = (d = 0.6) => new THREE.Vector3(P.x + Math.sin(G.yaw) * d, G.eye - 0.1, P.z + Math.cos(G.yaw) * d);
function fmtClock(m) { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60) % 12 || 12; return `${h}:${String(m % 60).padStart(2, '0')}`; }
function progress() { const k = ['readLog', 'lit', 'crankBack', 'turning', 'flagsUp', 'keyTaken']; return k.filter(f => S.flags[f]).length / k.length; }
const V = { flash: 0, g: 0, gutter: 0, gutterT: 0, lightningT: 12, boltK: 0, tickT: 0, whistleT: 0, darkT: 0, relitT: -1, scope: null, burnerK: 0, beamK: 0, feetT: 0 };

/* ---------------- lantern ---------------- */
function takeLantern() { flag('lanternHeld'); give('lantern', true); O.lantern.visible = false; O.held.visible = true; sClick(null, 0.3, 1400); toast('You pick up the storm lantern. It goes where you go.'); }

/* ---------------- the great lamp ---------------- */
function pump() {
  if (!S.flags.fuel) { sScrape(POS.tank, 0.3, 0.2); subtitle('', '<i>The pump wheezes and sucks air. The tank is bone dry. It needs paraffin before it can take any pressure.</i>', 4200); return; }
  if (S.pressure >= 6) { subtitle('', '<i>The needle is in the red. The tank won\'t take any more.</i>', 3000); return; }
  S.pressure++; save(); sScrape(POS.tank, 0.35, 0.28); sThunk(POS.tank, 0.25, 260);
  tween(0.35, k => { O.plunger.position.y = 0.8 - Math.sin(k * Math.PI) * 0.18; });
  if (S.pressure >= 5 && !S.flags.pumped) { flag('pumped'); subtitle('', '<i>The needle creeps into the red.</i>', 3000); }
}
const needleFor = p => 2.3 - Math.min(p, 6) / 6 * 4.1;
function lightLamp(relight) {
  if (!has('matches')) { subtitle('', '<i>You need a flame. Your pockets are empty and soaked.</i>', 3600); return; }
  if (!S.flags.fuel && !relight) { subtitle('', '<i>The burner is dry. There\'s no paraffin in the tank to feed it.</i>', 3600); return; }
  if (S.pressure < 5) { subtitle('', '<i>You strike a match and hold it to the mantle. A blue flicker, and nothing. There isn\'t enough pressure in the tank.</i>', 5200); sClick(null, 0.3, 3000); return; }
  sClick(null, 0.4, 3000); sThunk(POS.lens, 0.35, 120);
  if (relight) { endDark(); return; }
  flag('lit'); renderer.shadowMap.needsUpdate = true;
  V.burnerK = 0.05;
  subtitle('', '<i>The mantle catches with a soft thump and burns white. Light pours through the lens and out across the sea.</i>', 5200);
  // the thing on the gallery is simply not there any more
  const f = O.galFigs[0]; const a = A_.flag + 0.35; placeFigure(f, ...[pol(3.8, a).x, 0, pol(3.8, a).z], 0, 0); f.visible = true;
  after(0.25, () => { f.visible = false; sStinger(0.5); });
}
function putOut() {
  if (!S.flags.boatSeen) { subtitle('', '<i>Duncan\'s note: not until you see the boat. Look out to sea.</i>', 4200); return; }
  startDark();
}
function openCup() {
  if (!has('spanner')) { subtitle('', '<i>A brass cup under the burner, screwed tight. You\'d need a spanner.</i>', 3600); return; }
  S.cup = (S.cup || 0) + 1; save(); sClick(POS.lens, 0.45, 1500 + S.cup * 120); sScrape(POS.lens, 0.25, 0.2);
  tween(0.3, k => { O.cup.rotation.y = (S.cup - 1 + k) * Math.PI / 2; });
  if (S.cup < CUP_TURNS) { subtitle('', S.cup === 1 ? '<i>The spanner bites. The cup turns a quarter, gritty with soot.</i>' : '<i>Another turn. It\'s coming.</i>', 2400); return; }
  give('key'); flag('keyTaken'); sThunk(POS.lens, 0.3, 300); O.cup.position.y = 0.06;
  subtitle('', '<i>The cup drops into your hand. The key is inside, still warm. Now light her again.</i>', 4600);
}
function lampActions() {
  const a = [];
  if (S.flags.dark) {
    if (!S.flags.keyTaken) a.push({ label: S.cup ? `Unscrew the cup (${S.cup}/${CUP_TURNS})` : 'Unscrew the brass cup', run: openCup });
    a.push({ label: 'Light the burner', run: () => lightLamp(true) });
  } else if (!S.flags.lit) a.push({ label: 'Light the burner', run: () => lightLamp(false) });
  else if (has('spanner') && !S.flags.keyTaken) a.push({ label: 'Put her out', run: putOut });
  a.push(look(S.flags.lit && !S.flags.dark ? 'A thousand pieces of cut glass, all bending one small flame into a beam you could see from Ireland. In every prism there\'s a tiny copy of you.' : 'The great lens, taller than you, built around a burner no bigger than a fist. The glass is cold and beaded with salt.'));
  return a;
}

/* ---------------- clockwork ---------------- */
function fitCrank() { flag('crankFitted'); O.crank.visible = true; sThunk(O.socket.getWorldPosition(new THREE.Vector3()), 0.4, 200); subtitle('', '<i>The crank slides onto the square arbor.</i>', 2600); }
function wind() {
  if (S.wound >= 8) { subtitle('', '<i>It won\'t wind any tighter.</i>', 2400); return; }
  S.wound++; save();
  for (let i = 0; i < 4; i++) after(i * 0.09, () => sClick(POS.lens, 0.3, 900 + i * 60));
  const r0 = O.crank.rotation.z; tween(0.4, k => { O.crank.rotation.z = r0 - k * Math.PI; });
  if (S.wound >= 8) subtitle('', '<i>Somewhere down the tower the weight has come right up to the top. It\'s wound tight.</i>', 3800);
}
function releaseBrake() {
  if (!S.flags.crankFitted || S.wound < 8) { subtitle('', '<i>The brake lever is on. There\'s no point taking it off until the machine is wound.</i>', 3600); sClick(null, 0.2, 1600); return; }
  flag('turning'); sThunk(POS.lens, 0.6, 90); sCreak(POS.lens, 1.6, 0.25, 60);
  tween(0.5, k => { O.brake.rotation.x = lerp(-0.5, 0.55, k); });
  subtitle('', '<i>The lens shudders, and begins to turn.</i>', 3600);
  checkBoat();
  after(14, () => { if (!S.flags.sawRockFigs) { flag('sawRockFigs'); subtitle('', '<i>Down on the land side, where the beam never reaches, someone is standing on the rocks with a lantern.</i>', 5200); } });
}
function pedActions() {
  if (!S.flags.crankFitted) return has('crank') ? [{ label: 'Fit the crank', run: fitCrank }] : [{ label: 'Look', run: () => { flag('triedPed'); subtitle('', '<i>The iron pedestal holds the clockwork that turns the lens. There\'s a square socket for a winding crank, and no crank.</i>', 4600); } }];
  if (S.wound < 8) return [{ label: 'Wind it', run: wind }];
  return [look(S.flags.turning ? 'The clockwork ticks steadily. Down inside the tower, the weight is sinking.' : 'Wound tight. The brake is still holding it.')];
}

/* ---------------- door, telescope ---------------- */
function setDoor(open, gust) {
  if (S.door === open) return; S.door = open; save();
  const a0 = O.doorLeaf.rotation.y, a1 = open ? 1.55 : 0;
  if (gust) { sThunk(POS.door, 0.9, 70); sCreak(POS.door, 0.6, 0.45, 110); } else { sCreak(POS.door, 0.8, 0.3, 95); }
  tween(gust ? 0.35 : 0.9, k => { O.doorLeaf.rotation.y = lerp(a0, a1, k); renderer.shadowMap.needsUpdate = true; }, () => { if (!open) sThunk(POS.door, 0.5, 120); renderer.shadowMap.needsUpdate = true; });
}
function enterScope() {
  G.scope = true; G.frozen = true; V.scope = { x: P.x, z: P.z, yaw: G.yaw, pitch: G.pitch };
  const sp = pol(R_RAIL - 0.3, A_.scope); P.x = sp.x; P.z = sp.z; O.scope.visible = false;
  const ep = pol(R_RAIL + 0.05, A_.scope, 1.45), tg = O.morse.position, dx = tg.x - ep.x, dy = tg.y - ep.y, dz = tg.z - ep.z;
  G.yaw = Math.atan2(-dx, -dz) + 0.03; G.pitch = Math.atan2(dy, Math.hypot(dx, dz)) + 0.02;
  $('#fx').className = 'scope'; camera.fov = 11; camera.updateProjectionMatrix(); O.held.visible = false; updatePrompt(true);
  sClick(null, 0.3, 2200);
}
function exitScope() {
  G.scope = false; G.frozen = false; O.scope.visible = true; $('#fx').className = ''; camera.fov = 70; camera.updateProjectionMatrix(); O.held.visible = !!S.flags.lanternHeld;
  G.pitch = clamp(G.pitch, -0.6, 0.6); updatePrompt(true);
  // something came up behind you while you were looking
  if (S.flags.turning && !S.flags.scopeScare && Math.random() < 0.9) {
    flag('scopeScare'); const f = O.galFigs[1], a = A_.scope + 0.32, p = pol(3.75, a); placeFigure(f, p.x, 0, p.z, P.x, P.z); f.visible = true; sBreath(new THREE.Vector3(p.x, 1.6, p.z), 1, 0.5, true);
    V.gone = () => { f.visible = false; }; after(2.2, () => { if (f.visible && !inView(f)) f.visible = false; });
    after(3.5, () => { f.visible = false; });
  }
}

/* ---------------- the chest (no lock now: a letter, a Bible, oilskins) ---------------- */
function openChest() {
  if (!S.flags.chestOpen) { flag('chestOpen'); O.chestIn.visible = true; tween(0.9, k => { O.chestLid.rotation.x = -1.2 * k; }); sCreak(O.chest.position, 0.9, 0.3, 80); after(0.9, chestContents); return; }
  chestContents();
}
function chestContents() {
  openContainer('Duncan\'s sea chest', 'Oilskins, a Bible, a photograph of a woman on a pier, and a letter.', [
    { name: 'A letter', desc: 'From Margaret, in Stornoway. The envelope has been opened many times.', read: 'margaret' },
  ]);
}

/* ---------------- the paraffin can: carry it in and pour it into the tank ---------------- */
const tankPos = () => O.tank.getWorldPosition(new THREE.Vector3());
function nearTank() { const t = tankPos(); return !outside() && Math.hypot(P.x - t.x, P.z - t.z) < 1.3; }
function pickCan() {
  if (!S.can) { sCreak(O.can.position, 0.4, 0.2, 200); O.canRope.visible = false; }
  S.can = 'held'; save(); G.carrying = { name: 'Paraffin can' }; O.can.visible = false; O.canHeld.visible = true;
  sThunk(null, 0.3, 140); if (G.crouch) { G.crouch = false; G.eyeT = EYE; }
  if (!S.flags.canLifted) { flag('canLifted'); subtitle('', '<i>Five gallons of paraffin. It drags at your arm. The tank is beside the lamp.</i>', 3800); }
}
function dropCarried() { if (S.can !== 'held') { G.carrying = false; return; } if (nearTank()) pourCan(); else setCanDown(); }
function setCanDown() {
  const x = P.x + Math.sin(G.yaw) * -0.45, z = P.z + Math.cos(G.yaw) * -0.45, c = new THREE.Vector3(x, 0, z); constrain(c, 0.2);
  S.can = { x: c.x, z: c.z, r: G.yaw }; save(); placeCan(); G.carrying = false; O.canHeld.visible = false; sThunk(O.can.position, 0.35, 150);
}
function placeCan() {
  const c = S.can;
  if (!c) { O.can.position.copy(pol(4.08, A_.can)); O.can.rotation.set(0, faceIn(A_.can), 0); O.can.visible = true; O.canRope.visible = true; return; }
  O.canRope.visible = false;
  if (c === 'held') { O.can.visible = false; return; }
  if (c === 'tank') { const p = pol(2.05, A_.tank + 0.16); O.can.position.copy(p); O.can.rotation.set(0, faceIn(A_.tank) + 0.5, 0); O.can.visible = true; return; }
  O.can.position.set(c.x, 0, c.z); O.can.rotation.set(0, c.r, 0); O.can.visible = true;
}
function pourCan() {
  G.cutscene = true; updatePrompt(true);
  const r0 = O.canHeld.rotation.clone(), p0 = O.canHeld.position.clone();
  tween(0.8, k => { O.canHeld.rotation.z = r0.z + k * 1.5; O.canHeld.position.x = p0.x + k * 0.22; O.canHeld.position.y = p0.y + k * 0.12; });
  for (let i = 0; i < 9; i++) after(0.8 + i * 0.22, () => sThunk(POS.tank, 0.18, rand(160, 260)));
  after(0.9, () => { if (A.ready) { const t = now(), n = noiseSrc(false), bp = filt('bandpass', 700, 1.5), g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.2); g.gain.setValueAtTime(0.18, t + 1.6); g.gain.linearRampToValueAtTime(0.0001, t + 2.1); n.connect(bp); bp.connect(g); route(g, { pos: POS.tank, wet: 0.2 }); n.start(t); n.stop(t + 2.2); } });
  after(3.0, () => {
    tween(0.5, k => { O.canHeld.rotation.z = r0.z + (1 - k) * 1.5; O.canHeld.position.copy(p0); });
    flag('fuel'); S.can = 'tank'; save(); G.carrying = false;
    after(0.5, () => { O.canHeld.visible = false; O.canHeld.rotation.copy(r0); placeCan(); G.cutscene = false; updatePrompt(true); });
    subtitle('', '<i>The paraffin glugs into the tank until it gurgles at the brim. Now it needs pressure.</i>', 4200);
  });
}

/* ---------------- the boat hook and the crank on the ledge ---------------- */
function takeHook() {
  give('hook'); O.hookPole.visible = false; sScrape(O.hookRack.getWorldPosition(new THREE.Vector3()), 0.4, 0.3);
  // something stood behind you while you were lifting it down
  after(0.8, () => { sBreath(behindPos(0.5), 2, 0.45, true); G.fearT = Math.max(G.fearT, 0.6); addPrint(null, true); });
}
function hookCrank() {
  S.hookTries = (S.hookTries || 0) + 1; save();
  const c = O.lipCrank, a0 = A_.lip, cp = c.position.clone();
  sScrape(cp, 0.35, 0.35);
  if (S.hookTries === 1) {
    tween(0.5, k => { c.position.copy(pol(4.56, a0 + 0.035 * k, -0.19)); c.rotation.y = faceIn(a0) + 0.6 + 0.4 * k; });
    subtitle('', '<i>The hook skids off the iron. The crank scrapes along the ledge, a little nearer the edge.</i>', 3600); return;
  }
  if (S.hookTries === 2) {
    tween(0.9, k => { const u = Math.sin(k * Math.PI); c.position.copy(pol(4.5 - u * 0.1, a0 + 0.035, -0.19 + u * 0.35)); });
    after(0.9, () => sThunk(cp, 0.5, 260)); after(1.2, () => { sScrape(pol(4.3, a0, -2.5), 0.8, 0.25); G.fearT = Math.max(G.fearT, 0.7); });
    subtitle('', '<i>You get the hook under the handle. It lifts, swings, and drops back onto the stone with a clang. Below the ledge, something scrapes on the tower wall.</i>', 5200); return;
  }
  tween(0.8, k => { c.position.copy(pol(4.56 - k * 0.5, a0 + 0.035, -0.19 + k * 1.1)); c.rotation.x = k * 1.2; }, () => { c.visible = false; });
  give('crank'); flag('crankBack'); sThunk(null, 0.4, 200);
  subtitle('', '<i>You drag it up between the bars. The winding crank, cold and dripping.</i>', 3600);
}

/* ---------------- the flags: clip them on, haul them up ---------------- */
function takeFlags() { give('flags'); O.flagBundle.visible = false; sScrape(O.locker.getWorldPosition(new THREE.Vector3()), 0.25, 0.2); }
function placeFlags() {
  const k = S.flags.flagsUp ? 1 : (S.haul || 0) / HAULS;
  O.flags.forEach((f, i) => { f.visible = !!S.flags.flagsClipped; f.position.y = FLAG_LOW + (FLAG_TOP - FLAG_LOW) * k - i * 0.6; });
}
function clipFlags() {
  flag('flagsClipped'); S.inv = S.inv.filter(i => i !== 'flags'); S.haul = 0; save(); renderInv(); placeFlags();
  sClick(O.cleatHit.position, 0.4, 1600); subtitle('', '<i>You clip the two flags to the rope. The wind tries to tear them out of your fingers.</i>', 3400);
}
function haul() {
  if (S.flags.flagsUp) return;
  S.haul = (S.haul || 0) + 1; save();
  const y0 = O.flags[0].position.y; sSqueak(O.cleatHit.position, 0.18); sScrape(O.cleatHit.position, 0.35, 0.25);
  const k1 = S.haul / HAULS; tween(0.5, k => { O.flags.forEach((f, i) => { f.position.y = lerp(y0 - i * 0.6, FLAG_LOW + (FLAG_TOP - FLAG_LOW) * k1 - i * 0.6, k); }); });
  if (S.haul === 3) { G.shake = 0.8; lightning(); sThunk(null, 0.5, 70); subtitle('', '<i>A gust nearly takes the rope out of your hands. You hang on.</i>', 3200); }
  if (S.haul >= HAULS) {
    flag('flagsUp'); sFlutter(O.cleatHit.position, 2, 0.4);
    subtitle('', '<i>The flags snap out at the top of the pole: N over C. Anyone at sea will know what it means.</i>', 4600);
    checkBoat();
  }
}
function checkBoat() { if (S.flags.flagsUp && S.flags.turning && !S.flags.boatSeen && !V.boatQueued) { V.boatQueued = true; after(8, boatArrives); } }
function coatPockets() {
  openContainer('Duncan\'s oilskin coat', 'Stiff with salt and still dripping.', [
    { name: 'Box of matches', desc: 'Bryant &amp; May. Damp at the corners, but they\'ll strike.', take: 'matches' },
    { name: 'Pipe and pouch', desc: 'The tobacco is soaked through.' },
  ]);
}

/* ---------------- speaking tube ---------------- */
const TUBE = [['tube1', 'l_tube1'], ['tube2', 'l_tube2'], ['tube3', 'l_tube3'], ['tube4', 'l_tube4']];
function whistle() { if (!A.ready) return; const t = now(), o = A.ctx.createOscillator(), g = A.ctx.createGain(), n = noiseSrc(false), bp = filt('bandpass', 2600, 2), ng = A.ctx.createGain();
  o.frequency.setValueAtTime(1500, t); o.frequency.linearRampToValueAtTime(2300, t + 0.25); o.frequency.setValueAtTime(2300, t + 1.1); o.frequency.linearRampToValueAtTime(1900, t + 1.4);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.08); g.gain.setValueAtTime(0.16, t + 1.2); g.gain.linearRampToValueAtTime(0.0001, t + 1.45);
  ng.gain.setValueAtTime(0.12, t); ng.gain.linearRampToValueAtTime(0.0001, t + 1.4); o.connect(g); n.connect(bp); bp.connect(ng); ng.connect(g);
  route(g, { pos: POS.tube, wet: 0.2, ref: 0.5 }); o.start(t); o.stop(t + 1.5); n.start(t); n.stop(t + 1.5);
  const w = O.whistle; tween(1.4, k => { w.position.y = 1.26 + Math.sin(k * 40) * 0.004 * (1 - k); }); }
async function listenTube() {
  if (S.tubeReady && S.tube < TUBE.length) {
    const [hid, clip] = TUBE[S.tube]; S.tubeReady = false; S.tube++; V.tubeCool = 25; save();
    sClick(POS.tube, 0.3, 1300); heard(hid); G.fearT = Math.max(G.fearT, 0.35);
    await say('Voice in the tube', HEARD[hid].text.replace(/^"|"$/g, ''), { clip, fx: 'tube', pos: POS.tube, voice: 'm', rate: 0.88, pitch: 0.95 });
    if (hid === 'tube1') flag('heardTube1');
    return;
  }
  sBreath(POS.tube, 1, 0.25, true);
  subtitle('', '<i>You put your ear to the mouthpiece. Wind, a long way down. And under the wind, something breathing, slow and wet.</i>', 4800);
}

/* ---------------- the boat, the dark, the key ---------------- */
function boatArrives() {
  if (S.flags.boatSeen) return; flag('boatSeen'); O.boat.visible = true;
  sTone([98, 147], 2.4, 0.05); after(2.6, () => sTone([98, 147], 3.2, 0.05));
  subtitle('', '<i>Far out to the south-west, a masthead light, rising and falling on the swell. The relief boat.</i>', 5600);
  toast('The relief boat is in sight.');
}
function startDark() {
  flag('dark'); V.darkT = 0; V.relitT = -1;
  sThunk(POS.lens, 0.5, 90); subtitle('', '<i>You shut the valve. The flame shrinks to a blue bead, and goes out.</i>', 4200);
  G.fearT = 0.9; renderer.shadowMap.needsUpdate = true;
  after(1.4, () => { setDoor(true, true); flag('lanternOut'); sStinger(1); lightning(true);
    O.ring.forEach((f, i) => { f.visible = true; f.userData.lean = 0; });
    [1, 2, 3, 4, 5].forEach(i => after(0.6 + i * 0.7, () => playClip('l_k' + i, { fx: 'whisper', pos: pol(3.6, rand(0, TAU), 1.6), volume: 0.9 })));
    after(2.5, () => { for (let i = 0; i < 5; i++) after(i * 0.4, () => addPrint(null, true)); });
  });
  after(5, () => { heard('duncan'); say('Another voice in the tube', 'Quick, lad. They\'re on the balcony. Don\'t look at the glass.', { clip: 'l_duncan', fx: 'tube', pos: POS.tube, speed: 0.94 }); });
}
function endDark() {
  S.flags.dark = false; flag('relit'); V.relitT = 0;
  V.flash = 0.6; sStinger(0.5); renderer.shadowMap.needsUpdate = true;
  O.ring.forEach(f => f.visible = false); O.intruder.visible = false;
  // a hiss as they go
  if (A.ready) { const t = now(), n = noiseSrc(false), hp = filt('highpass', 2500, 0.7), g = A.ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); n.connect(hp); hp.connect(g); route(g, { wet: 0.5 }); n.start(t); n.stop(t + 1.7); }
  subtitle('', '<i>The mantle blazes. For a moment every pane is full of grey faces, and then there is only the storm.</i>', 5400);
  if (S.flags.keyTaken) after(5, () => { heard('ewanEnd'); say('The tube, very quietly', 'Next year, then.', { clip: 'l_ewanEnd', fx: 'tube', pos: POS.tube, volume: 0.7 }); });
}
function hatchActions() {
  if (!has('key')) return [{ label: 'Try the hatch', run: () => { flag('triedHatch'); sThunk(POS.hatch, 0.4, 120); sClick(POS.hatch, 0.3, 1200); subtitle('', '<i>An iron bar across the hatch, padlocked down. The padlock takes a key, and you haven\'t got it. Someone has tied a note to the bar.</i>', 4400); } }];
  if (S.flags.dark) return [{ label: 'Unlock the hatch', run: () => subtitle('', '<i>Not in the dark. <b>Never go down in the dark.</b> Light her first.</i>', 3800) }];
  return [{ label: 'Unlock the hatch', run: endSequence }];
}

/* ---------------- prints, footprints, figures ---------------- */
function addPrint(near, fromDark) {
  // a wet handprint on the outside of a pane you aren't looking at
  let best = null;
  for (let t = 0; t < 14; t++) {
    const a = fromDark ? rand(0, TAU) : Math.atan2(P.z, P.x) + rand(-1.8, 1.8);
    const k = Math.round(a / (22.5 * DEG)); if (((k % 16) + 16) % 16 === 4) continue;
    const pa = k * 22.5 * DEG + rand(-0.12, 0.12), y = rand(1.35, 2.3);
    const p = pol(APO + 0.075, pa, y); const d = { x: p.x, y, z: p.z, ry: faceIn(pa), rz: rand(-0.4, 0.4) };
    O.prints[0].position.set(d.x, d.y, d.z); O.prints[0].updateMatrixWorld();
    if (fromDark || !inView(O.prints[0], 1.05)) { best = d; break; }
  }
  if (!best) return;
  S.prints.push(best); if (S.prints.length > O.prints.length) S.prints.shift(); save(); showPrints();
  if (!fromDark) sSqueak(new THREE.Vector3(best.x, best.y, best.z), 0.1);
}
function showPrints() { O.prints.forEach((p, i) => { const d = S.prints[i]; p.visible = !!d; if (d) { p.position.set(d.x, d.y, d.z); p.rotation.set(0, d.ry, d.rz); } }); }
function footprints() {
  // a wet trail from the gallery door toward where you're standing
  const from = pol(2.8, A_.door), to = new THREE.Vector3(P.x, 0, P.z), n = O.feet.length;
  const dir = to.clone().sub(from); const len = dir.length(); if (len < 1) return false; dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x); const steps = Math.min(n, Math.floor((len - 0.9) / 0.34));
  for (let i = 0; i < n; i++) { const f = O.feet[i]; if (i >= steps) { f.visible = false; continue; } const p = from.clone().addScaledVector(dir, i * 0.34).addScaledVector(side, i % 2 ? 0.1 : -0.1); f.position.set(p.x, 0.004 + i * 0.0001, p.z); f.rotation.z = -Math.atan2(dir.x, dir.z) + Math.PI; f.visible = true; f.material.opacity = 1; }
  V.feetT = 45; return true;
}
function galleryFigure() {
  // somewhere on the gallery you'll see through the glass, but not right now
  const f = O.galFigs[2];
  for (let t = 0; t < 12; t++) {
    const a = Math.atan2(P.z, P.x) + rand(-2.4, 2.4); if (!lit() || Math.abs(wrapA(a)) < SECTOR - 0.1) {
      const p = pol(3.72, a); placeFigure(f, p.x, 0, p.z, P.x, P.z); f.updateMatrixWorld();
      if (!inView(f, 1.2)) { f.visible = true; V.watchFig = { f, seen: false, t: 0 }; return true; }
    }
  }
  return false;
}
function lightning(big) {
  V.flash = big ? 1 : rand(0.55, 0.85); V.boltK = 1; sThunder(big ? 0.3 : rand(0.8, 2.6), big ? 0.8 : rand(0.35, 0.6));
}

/* ---------------- penalty ---------------- */
function penalty() {
  G.lockout = G.time + 7; G.fearT = 0.9; sStinger(0.9); sHeart(6, 0.5, 0.7);
  V.gutter = 1; V.gutterT = 5;
  // a face at the pane in front of you, and the print it leaves stays
  const a = Math.atan2(P.z - Math.cos(G.yaw) * 1, P.x - Math.sin(G.yaw) * 1);
  const f = O.galFigs[0], p = pol(APO + 0.36, a); placeFigure(f, p.x, 0, p.z, 0, 0); f.visible = true;
  V.flash = 0.8; V.boltK = 0.8;
  after(1.4, () => { f.visible = false; addPrint(null, true); });
}

/* ---------------- scares ---------------- */
const DIR = { t: 45, last: '' };
const EVENTS = [
  { id: 'galFig', ok: () => !S.flags.lit || (outside() && Math.abs(wrapA(Math.atan2(P.z, P.x))) < 1.2), run: galleryFigure },
  { id: 'print', ok: () => S.prints.length < 8, run: () => { addPrint(); return true; } },
  { id: 'feet', ok: () => !outside() && S.door, run: footprints },
  { id: 'door', ok: () => !S.door && !outside(), run: () => { setDoor(true, true); subtitle('', '<i>The balcony door bangs open.</i>', 2600); return true; } },
  { id: 'doorShut', ok: () => S.door && outside() && progress() > 0.3 && !G.carrying, run: () => { setDoor(false, true); return true; } },
  { id: 'climb', ok: () => true, run: () => { const a = Math.atan2(P.z, P.x) + Math.PI + rand(-0.8, 0.8); for (let i = 0; i < 7; i++) after(i * 0.75, () => sScrape(pol(3.7, a, -7 + i * 1.1), 0.5, 0.3)); after(5.6, () => sThunk(pol(3.8, a, 0.2), 0.7, 90)); return true; } },
  { id: 'hatch', ok: () => !outside(), run: () => { sThunk(POS.hatch, 1, 70); after(0.5, () => { sThunk(POS.hatch, 0.8, 75); sClick(POS.hatch, 0.5, 900); }); tween(0.6, k => { O.padlock.rotation.z = Math.sin(k * 30) * 0.3 * (1 - k); }); return true; } },
  { id: 'gutter', ok: () => lit(), run: () => { V.gutter = 1; V.gutterT = 2.2; return true; } },
  { id: 'sea', ok: () => true, run: () => { heard('sea'); const a = Math.atan2(P.z, P.x) + rand(1.5, 3), one = !S.flags.seaOnce; flag('seaOnce'); playClip(one ? 'l_sea1' : pick(['l_sea1', 'l_sea2']), { fx: 'whisper', pos: pol(6, a, -4), volume: 0.8 }); subtitle('', one ? '<i>A woman\'s voice, somewhere outside and below: "Ewan. Ewan, come away down to the water."</i>' : '<i>The woman\'s voice again, out in the storm.</i>', 5200); return true; } },
  { id: 'bell', ok: () => true, run: () => { sBell(pol(28, rand(0, TAU), -2), 2.6); return true; } },
  { id: 'breath', ok: () => !S.flags.lit, run: () => { sBreath(behindPos(0.55), 2, 0.4, true); return true; } },
  { id: 'bolt', ok: () => true, run: () => { lightning(); return true; } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || G.scope || S.flags.dark || G.ending) return;
  DIR.t -= dt * (1 + progress() * 0.6);
  if (DIR.t > 0) return;
  const opts = EVENTS.filter(e => e.id !== DIR.last && e.ok());
  for (let t = 0; t < 5 && opts.length; t++) { const e = opts.splice(Math.floor(Math.random() * opts.length), 1)[0]; if (e.run() !== false) { DIR.last = e.id; break; } }
  DIR.t = rand(40, 75);
}
function highWater() {
  flag('highWater'); G.shake = 2.2; G.fearT = 0.8; sThunder(0, 1); sThunk(null, 1, 55);
  after(0.3, () => { V.flash = 0.7; V.spray = 1; if (lit()) { V.gutter = 1; V.gutterT = 3; } });
  after(0.8, () => { setDoor(true, true); footprints(); });
  subtitle('', '<i>The whole tower shudders. Spray bursts over the balcony, a hundred feet above the sea.</i>', 5200);
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  inter('desk', O.desk, { name: 'Writing desk', actions: () => [look('Ink, a steel pen, a ration of candles. The wood is scored with a hundred winters of elbows.')] });
  inter('log', O.log, { name: 'Keeper\'s log', actions: () => [{ label: 'Read it', run: () => openDoc('log') }] }); hitbox('log', O.log, 0.05);
  inter('clock', O.clock, { name: () => `Clock, ${fmtClock(S.clock)}`, actions: () => [look(`The clock says ${fmtClock(S.clock)}. Sunrise isn't until nine.`)] }); hitbox('clock', O.clock, 0.04);
  inter('baro', O.baro, { name: 'Barometer', actions: () => [look('The needle is hard down past STORMY. Someone has tapped the glass so often it has cracked.')] }); hitbox('baro', O.baro, 0.04);
  inter('lantern', O.lantern, { name: 'Storm lantern', enabled: () => !S.flags.lanternHeld, actions: () => [{ label: 'Pick it up', run: takeLantern }] }); hitbox('lantern', O.lantern, 0.08);
  inter('coat', O.coat, { name: 'Oilskin coat', actions: () => [{ label: 'Search the pockets', run: coatPockets }] });
  inter('tank', O.tank, { name: () => S.flags.fuel ? 'Paraffin tank' : 'Paraffin tank (empty)', note: () => !S.flags.fuel ? 'Dry' : S.pressure >= 5 ? 'Gauge: in the red' : S.pressure > 0 ? 'Gauge: rising' : 'Gauge: nothing', actions: () => [{ label: S.pressure >= 5 ? 'Pump it (it\'s full)' : 'Pump it', run: pump }] });
  inter('can', O.can, { name: () => S.can === 'tank' ? 'Paraffin can (empty)' : 'Paraffin can', reach: 2.2, enabled: () => !G.carrying, actions: () => S.can === 'tank' ? [look('Empty now. It still stinks of paraffin.')] : [{ label: S.can ? 'Pick it up' : 'Untie it and pick it up', run: pickCan }] }); hitbox('can', O.can, 0.06);
  const lampHit = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 1.55, 16), HITMAT); lampHit.position.set(0, 2.0, 0); lampHit.layers.set(2); scene.add(lampHit);
  inter('lamp', lampHit, { name: () => S.flags.dark ? 'The lamp (out)' : S.flags.lit ? 'The great lamp' : 'The great lamp (out)', reach: 2.2, actions: lampActions });
  [O.lens, O.burner].forEach(g => g.traverse(o => { o.userData.iid = 'lamp'; }));   // aiming at the brass or the bars is aiming at the lamp
  const pedHit = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 16), HITMAT); pedHit.position.set(0, 0.6, 0); pedHit.layers.set(2); scene.add(pedHit);
  inter('ped', pedHit, { name: 'Clockwork pedestal', actions: pedActions, note: () => S.flags.crankFitted && !S.flags.turning ? `Wound ${S.wound}/8` : '' });
  O.ped.traverse(o => { o.userData.iid = 'ped'; });   // the pedestal itself and the fitted crank, not just the invisible cylinder
  inter('brake', O.brakeBase, { name: 'Brake lever', enabled: () => !S.flags.turning, actions: () => [{ label: 'Release the brake', run: releaseBrake }] }); hitbox('brake', O.brakeBase, 0.08);
  inter('door', O.doorLeaf, { name: 'Balcony door', actions: () => [{ label: S.door ? 'Close it' : 'Open it', run: () => setDoor(!S.door) }] });
  inter('locker', O.locker, { name: 'Flag locker', actions: () => [look('Pigeonholes of rolled signal flags, damp and smelling of tar.')] });
  inter('flagBundle', O.flagBundle, { name: 'Signal flags, rolled', enabled: () => !has('flags') && !S.flags.flagsClipped, actions: () => [{ label: 'Take them', run: takeFlags }] }); hitbox('flagBundle', O.flagBundle, 0.06);
  inter('cleat', O.cleatHit, { name: 'Flagpole rope', note: () => S.flags.flagsClipped && !S.flags.flagsUp ? `Hauled ${S.haul || 0}/${HAULS}` : '',
    actions: () => S.flags.flagsUp ? [look('Your flags are cracking at the top of the pole.')] : S.flags.flagsClipped ? [{ label: 'Haul them up', run: haul }] : has('flags') ? [{ label: 'Clip the flags on', run: clipFlags }] : [look('The flagpole rope, slapping against the pole. Nothing is flying.')] });
  inter('chest', O.chest, { name: 'Duncan\'s sea chest', actions: () => [{ label: S.flags.chestOpen ? 'Look inside' : 'Open it', run: openChest }] });
  inter('hookRack', O.hookPole, { name: 'Boat hook', enabled: () => !has('hook'), actions: () => [{ label: 'Lift it down', run: takeHook }] }); hitbox('hookRack', O.hookPole, 0.08);
  inter('lip', O.lipCrank, { name: 'The winding crank, on the ledge', reach: 2.7, enabled: () => !S.flags.crankBack,
    actions: () => { flag('sawCrank'); return has('hook') ? [{ label: 'Fish for it with the boat hook', run: hookCrank }] : [look('The winding crank is lying on the narrow ledge outside the railing, right above the drop, a long way past your fingertips. You\'d need something long, with a hook on the end.')]; } });
  hitbox('lip', O.lipCrank, 0.14);
  inter('tube', O.tube, { name: 'Speaking tube', note: () => S.tubeReady ? 'Someone is whistling up it' : '', actions: () => [{ label: S.tubeReady ? 'Open the cap and listen' : 'Listen', run: listenTube }] });
  inter('hatch', O.hatch, { name: 'Hatch to the stair', actions: hatchActions });
  inter('hnote', O.hatchNote, { name: 'A note, tied to the hatch bar', actions: () => [{ label: 'Read it', run: () => openDoc('note') }] }); hitbox('hnote', O.hatchNote, 0.05);
  inter('hspanner', O.hatchSpanner, { name: 'A brass spanner, tied to the bar', enabled: () => !has('spanner') && !S.flags.keyTaken, actions: () => [{ label: 'Take it', run: () => { give('spanner'); O.hatchSpanner.visible = false; sClick(POS.hatch, 0.3, 1800); } }] }); hitbox('hspanner', O.hatchSpanner, 0.05);
  O.screen.forEach(s => inter('screen' + O.screen.indexOf(s), s, { name: 'Landward screen', actions: () => [{ label: 'Read the names', run: () => openDoc('names') }, look('Iron shutters painted black on the land side of the glass. The beam never shines this way.')] }));
  inter('scope', O.scope, { name: 'Telescope', actions: () => [{ label: 'Look through it', run: enterScope }] }); hitbox('scope', O.scope, 0.1);
  inter('stove', O.stove, { name: 'Paraffin stove', actions: () => [look('The kettle is still warm. Three mugs are waiting on the sill.')] });
  inter('bench', O.bench, { name: 'Bench', actions: () => [look('A Bible with a ribbon at the Book of Jonah, and a half-knitted sock with the needles still in it.')] });
  inter('stool', O.stool, { name: 'Stool', actions: () => [look('Worn smooth. Somebody sat here a long time, watching the glass.')] });
}

/* ---------------- movement limits: a round room, a doorway, a railing ---------------- */
function constrain(p, r) {
  const d = Math.hypot(p.x, p.z) || 1e-6, a = Math.atan2(p.z, p.x);
  if (d < R_IN - r) { const mn = 1.0 + r; if (d < mn) { p.x *= mn / d; p.z *= mn / d; } return; }
  if (d > R_OUT + r) { const mx = R_RAIL - 0.04 - r; if (d > mx) { p.x *= mx / d; p.z *= mx / d; } return; }
  const da = wrapA(a - A_.door), t = Math.sin(da) * d, half = 0.5 - r * 0.55;
  if (S.door && Math.cos(da) > 0 && Math.abs(t) < 0.5) {
    if (Math.abs(t) > half) { const tt = Math.sign(t) * half, rr = Math.sqrt(Math.max(0, d * d - t * t)); const ca = Math.cos(A_.door), sa = Math.sin(A_.door); p.x = ca * rr - sa * tt; p.z = sa * rr + ca * tt; }
    return;
  }
  const target = (d - (R_IN - r)) < ((R_OUT + r) - d) ? R_IN - r : R_OUT + r; p.x *= target / d; p.z *= target / d;
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    pressure: 0, wound: 0, door: true, tube: 0, tubeReady: false, prints: [], clock: 221, clockAcc: 0, lens: LENS_REST,
    can: null, haul: 0, cup: 0, hookTries: 0 };
}
function applyState() {
  const held = !!S.flags.lanternHeld; O.lantern.visible = !held; O.held.visible = held;
  O.doorLeaf.rotation.y = S.door ? 1.55 : 0;
  O.needle.rotation.z = needleFor(S.pressure); O.plunger.position.y = 0.8;
  O.crank.visible = !!S.flags.crankFitted;
  O.chestIn.visible = !!S.flags.chestOpen; O.chestLid.rotation.x = S.flags.chestOpen ? -1.2 : 0;
  if (S.can === 'held') { const c = new THREE.Vector3(P.x, 0, P.z); S.can = { x: c.x, z: c.z, r: G.yaw }; }   // never wake up carrying it
  G.carrying = false; O.canHeld.visible = false; placeCan();
  O.hookPole.visible = !has('hook'); O.lipCrank.visible = !S.flags.crankBack;
  O.flagBundle.visible = !has('flags') && !S.flags.flagsClipped; placeFlags();
  O.hatchSpanner.visible = !has('spanner') && !S.flags.keyTaken; O.cup.rotation.y = (S.cup || 0) * Math.PI / 2; O.cup.position.y = S.flags.keyTaken ? 0.06 : 0.1;
  V.boatQueued = false; if (S.flags.flagsUp && S.flags.turning && !S.flags.boatSeen) checkBoat();
  O.brake.rotation.x = S.flags.turning ? 0.55 : -0.5;
  O.lens.rotation.y = S.lens;
  O.boat.visible = !!S.flags.boatSeen;
  O.ring.forEach(f => f.visible = !!S.flags.dark);
  O.galFigs.forEach(f => f.visible = false); O.intruder.visible = false;
  if (S.flags.dark) { V.darkT = 0; }
  V.burnerK = lit() ? 1 : 0;
  showPrints(); drawClock(); renderInv();
  renderer.shadowMap.needsUpdate = true;
}
function drawClock() {
  const t = T.clock, g = t.userData.g, c = t.userData.canvas; const w = c.width;
  g.fillStyle = '#efe6cc'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, TAU); g.fill(); g.strokeStyle = '#3a2d18'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#2a2016'; g.font = `14px ${FELL}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; g.fillText(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i - 1], w / 2 + Math.cos(a) * 46, w / 2 + Math.sin(a) * 46); }
  const m = S ? S.clock : 221, hA = ((m / 60) % 12) / 12 * TAU - Math.PI / 2, mA = (m % 60) / 60 * TAU - Math.PI / 2;
  g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 + Math.cos(hA) * 26, w / 2 + Math.sin(hA) * 26); g.stroke();
  g.lineWidth = 2.5; g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 + Math.cos(mA) * 38, w / 2 + Math.sin(mA) * 38); g.stroke();
  t.needsUpdate = true;
}

/* ---------------- sound ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.windL) return;
  A.loops.windL = loopNoise({ type: 'lowpass', f: 420, q: 0.7, vol: 0.06, brown: true, wet: 0.15 });
  A.loops.windH = loopNoise({ type: 'bandpass', f: 900, q: 1.2, vol: 0.015, wet: 0.2 });
  A.loops.rainL = loopNoise({ type: 'highpass', f: 2200, q: 0.5, vol: 0.03, wet: 0.1 });
  A.loops.sea = loopNoise({ type: 'lowpass', f: 140, q: 0.8, vol: 0.12, brown: true, wet: 0.2 });
  A.loops.hiss = loopNoise({ pos: POS.lens, type: 'bandpass', f: 1800, q: 0.9, vol: 0, wet: 0.1, ref: 0.6 });
  const ctx = A.ctx, tg = ctx.createGain(); tg.gain.value = 0.0035; [110, 116.5, 164.8].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(tg); o.start(); });
  route(tg, { wet: 0.4 }); A.loops.tension = { gain: tg };
}
function ambience(dt) {
  if (!A.ready || !A.loops.windL) return;
  const out = outside(), d = Math.hypot(P.x, P.z), open = S.door;
  V.g += dt; const gust = 0.7 + 0.3 * Math.sin(V.g * 0.37) + 0.25 * Math.sin(V.g * 1.13 + 1);
  setGain(A.loops.windL, (out ? 0.2 : open ? 0.1 : 0.055) * gust, 0.4);
  setGain(A.loops.windH, (out ? 0.06 : open ? 0.03 : 0.012) * gust, 0.4);
  setGain(A.loops.rainL, out ? 0.09 : 0.035, 0.4);
  setGain(A.loops.sea, 0.1 + 0.05 * Math.sin(V.g * 0.21), 0.6);
  setGain(A.loops.hiss, lit() ? 0.03 : 0, 0.3);
  setGain(A.loops.tension, 0.0025 + progress() * 0.006 + (S.flags.dark ? 0.01 : 0), 1);
  if (S.flags.turning) { V.tickT -= dt; if (V.tickT <= 0) { V.tickT = 0.5; sClick(POS.lens, 0.06, 700); } }
}

/* ---------------- per-frame ---------------- */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function roomUpdate(dt) {
  const t = G.time;
  // clock: one minute every twenty seconds
  S.clockAcc += dt; if (S.clockAcc >= 20) { S.clockAcc -= 20; S.clock++; drawClock(); if (S.clock >= 246 && !S.flags.highWater && !S.flags.dark && !G.cutscene && !G.uiOpen && !G.scope) highWater(); }
  // lightning
  V.lightningT -= dt; if (V.lightningT <= 0) { lightning(); V.lightningT = S.flags.dark ? rand(2.2, 4.5) : rand(10, 26); }
  V.flash = Math.max(0, (V.flash || 0) - dt * (V.flash > 0.5 ? 3.2 : 1.6)); V.boltK = Math.max(0, V.boltK - dt * 2.6);
  if (reduceMotion) V.flash = Math.min(V.flash, 0.5);
  G.flash = V.flash * 0.16; L.bolt.intensity = V.boltK * 2.6;
  // lamp
  V.gutterT = Math.max(0, V.gutterT - dt); if (V.gutterT <= 0) V.gutter = Math.max(0, V.gutter - dt * 2);
  const want = lit() ? 1 : 0; V.burnerK = lerp(V.burnerK, want, Math.min(1, dt * (want ? 1.2 : 2.5)));
  const fl = 1 - V.gutter * (0.75 + 0.2 * Math.sin(t * 37)) + Math.sin(t * 13) * 0.02;
  const bk = V.burnerK * fl;
  L.burner.intensity = 24 * bk; O.flame.material.opacity = bk; O.mantle.material.color.setRGB(0.29 + bk * 0.7, 0.28 + bk * 0.66, 0.25 + bk * 0.5);
  M.lens.opacity = 0.4 + bk * 0.2; M.lens.color.setRGB(0.62 + bk * 0.3, 0.72 + bk * 0.16, 0.74 + bk * 0.04); M.bull.color.setRGB(0.65 + bk * 0.35, 0.77 + bk * 0.19, 0.78 + bk * 0.08);
  L.hemi.intensity = S.flags.dark ? 0.16 : 0.2 + bk * 0.22;
  // lens & beam
  if (S.flags.turning) { S.lens -= dt * TAU / 20; O.lens.rotation.y = S.lens; O.gears.forEach((g, i) => g.rotation.y += dt * (i ? -2 : 3)); }
  const beamOn = bk; O.beamMat.uniforms.k.value = beamOn * (0.85 + V.boltK * 0.1);
  const offs = [-9, 0, 9]; let mainA = wrapA(-S.lens);
  O.beams.forEach((b, i) => { const a = wrapA(-(S.lens + offs[i] * DEG)); b.visible = beamOn > 0.02 && Math.abs(a) > SECTOR + 0.05; });
  const mainOut = Math.abs(mainA) > SECTOR + 0.05;
  L.beam.intensity = mainOut ? 60 * beamOn : 0; L.beam.target.position.copy(pol(10, mainA, 1.8)); L.beam.target.updateMatrixWorld();
  O.sea.material.uniforms.beamA.value = mainA; O.sea.material.uniforms.beamOn.value = mainOut ? beamOn : 0;
  // sky, sea, rain
  O.sea.material.uniforms.time.value = t; O.sea.material.uniforms.flash.value = V.flash * 0.45; O.sky.material.uniforms.time.value = t; O.sky.material.uniforms.flash.value = V.flash * 0.6;
  O.rain.material.uniforms.time.value = t; O.rain.material.uniforms.flash.value = V.flash * 0.4; O.rain.material.uniforms.beam.value = beamOn;
  T.rain.offset.y = (T.rain.offset.y + dt * 0.05) % 1;
  if (V.spray) V.spray = Math.max(0, V.spray - dt * 0.4);
  M.glass.opacity = 0.18 + (V.spray || 0) * 0.5 + V.flash * 0.12;
  // flags in the wind
  O.flags.forEach(f => { const pa = f.geometry.attributes.position, b = f.userData.base; for (let i = 0; i < pa.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; pa.setZ(i, Math.sin(x * 7 - t * 9 + f.userData.ph + y * 2) * 0.07 * (x / 0.72) + Math.sin(t * 3.1 + f.userData.ph) * 0.02 * x); } pa.needsUpdate = true; f.geometry.computeVertexNormals(); });
  // the lantern in your hand, or on the floor
  const lf = 0.85 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23.7) * 0.05;
  if (S.flags.lanternHeld) { O.held.getWorldPosition(L.lantern.position); L.lantern.position.y += 0.15; }
  else L.lantern.position.set(O.lantern.position.x, 0.25, O.lantern.position.z);
  const lo = S.flags.lanternOut ? 0 : 1;
  L.lantern.intensity = 2.4 * lf * lo; O.held.userData.flame.material.opacity = lo; O.lantern.userData.flame.material.opacity = lo;
  O.held.rotation.z = Math.sin(V.g * 2) * 0.03; O.held.position.y = -0.36 + (G.moving ? Math.sin(G.bob) * 0.012 : 0);
  // Ewan stands on the land-side rocks with his lantern while the lens is turning
  const mOn = S.flags.turning && !G.ending;
  O.morse.visible = mOn; L.morse.intensity = mOn ? 4.5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4 : 0; O.ewan.visible = mOn;
  // the drowned on the rocks: never where the beam falls, and all at the glass when the lamp is out
  O.rockFigs.forEach(f => { let hide = S.flags.dark || G.ending; if (!hide && beamOn > 0.1) for (const o of offs) { if (Math.abs(wrapA(f.userData.a - wrapA(-(S.lens + o * DEG)))) < 0.1) hide = true; } f.visible = !hide; });
  // a figure seen on the gallery goes once you look away
  if (V.watchFig) { const w = V.watchFig; w.t += dt; const vis = inView(w.f, 0.9); if (vis) w.seen = true; if ((w.seen && !vis) || w.t > 25 || (lit() && Math.abs(wrapA(Math.atan2(w.f.position.z, w.f.position.x))) > SECTOR)) { w.f.visible = false; V.watchFig = null; } else if (w.seen && w.t > 0) { G.fearT = Math.max(G.fearT, 0.4); } }
  // footprints dry out
  if (V.feetT > 0) { V.feetT -= dt; const o = clamp(V.feetT / 10, 0, 1); O.feet.forEach(f => f.material.opacity = o); if (V.feetT <= 0) O.feet.forEach(f => f.visible = false); }
  // the tube whistles when it has something to say
  // the next voice in the tube waits for its moment: after waking, after the lamp is lit, once it turns, once the box is open
  V.tubeCool = Math.max(0, (V.tubeCool || 0) - dt);
  if (!S.tubeReady && V.tubeCool <= 0 && S.tube < TUBE.length && !S.flags.dark && !G.ending) { const f = S.flags, cond = [f.woke && G.play > 50, f.lit, f.turning, f.boatSeen][S.tube]; if (cond) { S.tubeReady = true; V.whistleT = 4; } }
  if (S.tubeReady && !G.cutscene) { V.whistleT -= dt; if (V.whistleT <= 0) { whistle(); V.whistleT = rand(22, 34); } }
  // the dark: they come to the glass, and one of them comes in
  if (S.flags.dark) {
    V.darkT += dt; G.fearT = Math.max(G.fearT, 0.55);
    O.ring.forEach((f, i) => { f.visible = true; });
    if (V.darkT > 16 && !O.intruder.visible) { const p = pol(2.55, A_.door); placeFigure(O.intruder, p.x, 0, p.z, P.x, P.z); O.intruder.visible = true; sScrape(POS.door, 0.6, 0.3); }
    if (O.intruder.visible) {
      V.intrT = (V.intrT || 0) - dt;
      if (V.intrT <= 0) { V.intrT = 3.2; const ip = O.intruder.position, dx = P.x - ip.x, dz = P.z - ip.z, dd = Math.hypot(dx, dz);
        if (dd < 1.1) { sStinger(1); sBreath(behindPos(0.3), 1, 0.7, true); G.red = 0.6; G.shake = 0.6; O.intruder.visible = false; V.darkT = 4; S.wrong++; save(); subtitle('', '<i>A cold, wet hand closes on the back of your neck, and lets go. Light her, quickly.</i>', 3600); }
        else { const step = Math.min(0.7, dd - 0.9); ip.x += dx / dd * step; ip.z += dz / dd * step; const c = new THREE.Vector3(ip.x, 0, ip.z); constrain(c, 0.25); ip.x = c.x; ip.z = c.z; O.intruder.rotation.y = Math.atan2(dx, dz); sStep(0.14); } }
    }
  }
  // scope view follows the mouse, within the mount's reach
  if (G.scope) {
    const base = Math.atan2(-Math.cos(A_.scope), -Math.sin(A_.scope));
    G.yaw = base + clamp(wrapA(G.yaw - base), -0.9, 0.9); G.pitch = clamp(G.pitch, -1.35, 0.15);
    const ep = pol(R_RAIL + 0.05, A_.scope, 1.45); camera.position.copy(ep); camera.rotation.set(G.pitch, G.yaw, 0); camera.updateMatrixWorld();
    O.scopeTube.rotation.x = -G.pitch; O.scope.rotation.y = G.yaw + Math.PI;
    if (mOn && O.ewan.visible && inView(O.ewan, 0.5) && !S.flags.sawEwan) { flag('sawEwan'); sStinger(0.7); G.fearT = 0.8; subtitle('', '<i>Under the sou\'wester, the face looking up at you is as grey as the rock.</i>', 4800); }
  }
  director(dt);
  ambience(dt);
}

/* ---------------- ending ---------------- */
function endSequence() {
  flag('escaped'); G.ending = true; G.cutscene = true; if (G.scope) exitScope();
  sClick(POS.hatch, 0.6, 1400); sThunk(POS.hatch, 0.7, 110);
  tween(0.5, k => { O.padlock.position.y = 0.1 - k * 0.08; O.padlock.rotation.z = k * 1.2; });
  after(0.6, () => { sScrape(POS.hatch, 0.6, 0.35); tween(0.8, k => { O.hatchBar.rotation.y = k * 1.35; }); });
  after(1.5, () => { sCreak(POS.hatch, 1.3, 0.45, 70); tween(1.4, k => { O.hatchLid.rotation.x = k * 1.95; }); });
  const x0 = P.x, z0 = P.z, y0 = G.yaw, p0 = G.pitch, yT = Math.atan2(-(HATCH.x - x0), -(HATCH.z - z0));
  after(2.8, () => tween(2.2, k => { P.x = lerp(x0, HATCH.x, k * 0.8); P.z = lerp(z0, HATCH.z + 0.25, k * 0.8); G.yaw = y0 + wrapA(yT - y0) * k; G.pitch = lerp(p0, -1.3, k); }));
  after(3.2, () => subtitle('', '<i>Under the hatch the stair turns down into the dark. Far below, a door is banging in the wind.</i>', 0));
  after(5.6, () => { tween(1.4, k => { G.eyeT = 1.62 - k * 1.2; }); G.blackT = 1; for (let i = 0; i < 8; i++) after(0.3 + i * 0.55, () => sStep(0.2)); });
  after(9, showEnd);
}
function endFrame() {
  const W = 480, H = 360, rt = new THREE.WebGLRenderTarget(W, H), cam = new THREE.PerspectiveCamera(15, W / H, 0.5, 900); cam.layers.enable(1);
  const cp = pol(210, 236 * DEG, SEA_Y + 6); cam.position.copy(cp); cam.lookAt(0, 0.9, 0); cam.fov = 3.4; cam.far = 1200; cam.updateProjectionMatrix();
  const keep = { hemi: L.hemi.intensity, fog: scene.fog.density, fogC: scene.fog.color.getHex(), bolt: L.bolt.intensity };
  O.sky.material.uniforms.dawn.value = 1; O.sea.material.uniforms.dawn.value = 1; O.sky.material.uniforms.flash.value = 0; O.sea.material.uniforms.flash.value = 0;
  O.sea.material.uniforms.fogC.value.set(0x6f7275); O.sea.material.uniforms.fogD.value = 0.0035; scene.fog.color.set(0x6f7275); scene.fog.density = 0.0035;
  L.hemi.intensity = 1.6; L.bolt.intensity = 0; O.rain.visible = false; O.held.visible = false; O.morse.visible = false; O.ewan.visible = false;
  O.rockFigs.forEach(f => f.visible = false); O.ring.forEach(f => f.visible = false); O.galFigs.forEach(f => f.visible = false); O.intruder.visible = false; O.boat.visible = false;
  L.burner.intensity = 24; O.flame.material.opacity = 1; O.flame.scale.set(2.2, 2.4, 1); O.beamMat.uniforms.k.value = 0.5;
  M.lens.opacity = 0.7; M.lens.color.setRGB(1, 0.94, 0.8); O.sea.material.uniforms.beamOn.value = 0;
  const toCam = Math.atan2(cp.z, cp.x);
  O.keepers.forEach((f, i) => { const a = toCam + (i - 1) * 0.3; const p = pol(APO - 0.42, a); placeFigure(f, p.x, 0, p.z, cp.x, cp.z); f.visible = true; });
  let url = null;
  try {
    renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, cam);
    const buf = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const si = ((H - 1 - y) * W + x) * 4, di = (y * W + x) * 4;
      let l = Math.pow(buf[si] / 255, 0.45) * 0.3 + Math.pow(buf[si + 1] / 255, 0.45) * 0.59 + Math.pow(buf[si + 2] / 255, 0.45) * 0.11;
      l = clamp((l - 0.12) * 1.6, 0, 1); const dx = x / W - 0.5, dy = y / H - 0.5, v = 1 - Math.min(1, (dx * dx + dy * dy) * 1.9);
      l = l * (0.45 + 0.55 * v) + (Math.random() - 0.5) * 0.07;
      img.data[di] = clamp(l * 255 * 1.02 + 18, 0, 255); img.data[di + 1] = clamp(l * 232 + 12, 0, 255); img.data[di + 2] = clamp(l * 196 + 6, 0, 255); img.data[di + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = 'rgba(255,245,220,0.18)'; for (let i = 0; i < 6; i++) { g.lineWidth = rand(0.5, 1.2); g.beginPath(); const x = rand(0, W); g.moveTo(x, 0); g.lineTo(x + rand(-20, 20), H); g.stroke(); }
    url = c.toDataURL('image/jpeg', 0.84);
  } catch (e) { console.warn(e); }
  renderer.setRenderTarget(null); rt.dispose();
  return url;
}
function showEnd() { const frame = endFrame(); finishRoom(frame); }

/* ---------------- title screen: a beam turning over a black sea ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const W = 480, H = 270, hz = H * 0.66, lx = W * 0.8, ly = hz - 70;
  const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#04070a'); sky.addColorStop(1, '#101820'); g.fillStyle = sky; g.fillRect(0, 0, W, hz);
  const sea = g.createLinearGradient(0, hz, 0, H); sea.addColorStop(0, '#0b1217'); sea.addColorStop(1, '#030507'); g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
  const ph = (t / 20) * TAU;
  for (const o of [-0.16, 0, 0.16]) {
    const a = ph + o, facing = Math.sin(a), sx = Math.cos(a);
    const len = 420 * Math.abs(sx) + 20, dir = sx >= 0 ? 1 : -1, bright = 0.18 + Math.max(0, facing) * 0.5;
    const gr = g.createLinearGradient(lx, ly, lx + dir * len, ly); gr.addColorStop(0, `rgba(255,236,190,${bright})`); gr.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(lx, ly - 2); g.lineTo(lx + dir * len, ly - 6 - len * 0.12); g.lineTo(lx + dir * len, ly + 6 + len * 0.12); g.lineTo(lx, ly + 2); g.closePath(); g.fill();
    if (facing > 0.9) { g.fillStyle = `rgba(255,240,210,${(facing - 0.9) * 1.2})`; g.fillRect(0, 0, W, H); }
  }
  g.fillStyle = '#0a0d10'; g.beginPath(); g.moveTo(lx - 6, ly + 4); g.lineTo(lx + 6, ly + 4); g.lineTo(lx + 11, hz + 4); g.lineTo(lx - 11, hz + 4); g.closePath(); g.fill();
  g.fillRect(lx - 7, ly - 6, 14, 10); g.beginPath(); g.moveTo(lx - 8, ly - 6); g.lineTo(lx, ly - 13); g.lineTo(lx + 8, ly - 6); g.fill();
  const glow = g.createRadialGradient(lx, ly, 0, lx, ly, 18); glow.addColorStop(0, 'rgba(255,230,170,0.9)'); glow.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = glow; g.fillRect(lx - 18, ly - 18, 36, 36);
  g.fillStyle = '#05070a'; g.beginPath(); g.moveTo(lx - 40, hz + 6); g.quadraticCurveTo(lx, hz - 4, lx + 46, hz + 6); g.fill();
  g.strokeStyle = 'rgba(160,180,200,0.16)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = (i * 97 + t * 260) % (W + 60) - 30, y = (i * 53 + t * 520) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 12); g.stroke(); }
}

/* ---------------- the room module ---------------- */
return {
  id: 'lamp', title: 'The Lamp Room', saveKey: 'lethe.roomlamp.v2',
  DOCS, ITEMS, HEARD, HINTS, openDoc, inspectItem, penalty, constrain, titleFx, dropCarried,
  markSkip: ['start', 'tube', 'boat'], markMerge: {},
  backText: 'Back on watch.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other actions', 'R T or right-click'], ['Run', 'Shift'], ['Crouch', 'C'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (G.cutscene || G.scope || G.carrying) return; G.crouch = !G.crouch; G.eyeT = G.crouch ? 0.8 : EYE; },
  stepDown() { if (G.scope) exitScope(); },
  actOverride(i) { if (G.scope) { exitScope(); return true; } return false; },
  promptOverride() {
    if (G.scope) return '<span class="nm">Telescope</span><span class="act"><kbd>E</kbd>Stop looking</span>';
    if (G.carrying && S.can === 'held' && nearTank()) return '<span class="nm">Paraffin can</span><span class="act"><kbd>E</kbd>Pour it into the tank</span>';
    return '';
  },
  touchOverride() {
    if (G.scope) return [{ label: 'Stop looking', run: exitScope }];
    if (G.carrying && S.can === 'held') return [{ label: nearTank() ? 'Pour it into the tank' : 'Set it down', run: dropCarried }];
    return null;
  },
  onPanelClose() {},
  update: roomUpdate,
  preRender() {},
  build() { makeTextures(); makeMaterials(); buildRoom(); registerInteractions(); },
  defaults, applyState, startAmbience,
  spawn: { x: pol(1.9, 206 * DEG).x, z: pol(1.9, 206 * DEG).z, yaw: 0 },
  wake() {
    const sp = pol(1.9, 206 * DEG); P.x = sp.x; P.z = sp.z; G.yaw = Math.atan2(sp.x, sp.z); G.pitch = 1.15; G.eye = 0.28; G.eyeT = 0.28;
    G.cutscene = true; $('#fx').className = 'lids';
    tween(3.6, k => { G.pitch = lerp(1.15, 0.05, k); });
    after(1.2, () => subtitle('', '<i>You wake on the iron floor under the great lens. Your clothes are wet through, and they smell of the sea.</i>', 5600));
    after(2.2, () => { G.eyeT = EYE; sStep(0.2); });
    after(3.9, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); toast(ctrlHint(), 7000); });
    after(6.5, () => { lightning(true); });
  },
  debug: { O, L, V, T, M, lightLamp, startDark, endDark, boatArrives, enterScope, exitScope, endFrame, penalty, highWater, addPrint, footprints, galleryFigure, pickCan, pourCan, nearTank, hookCrank, haul, clipFlags, openCup, putOut },
};

})();
