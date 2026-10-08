const ROOM_SITTING = (() => {

/* =====================================================================
   MYSTERY #4 — "THE LAST SITTING"  ·  9 Pellam Street, Bloomsbury, 3 March 1893
   part A: layout, noise, textures, materials (realistic: PBR + gaslight)
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {};
const FELL = '"IM Fell English", Georgia, serif', PLAY = '"Playfair Display", Georgia, serif', CORM = '"Cormorant Garamond", Georgia, serif', CHALK = '"Caveat", "Comic Sans MS", cursive';
const W = 2.9, D = 2.5, H = 3.2;                 // half-width (x), half-depth (z), height
const TB = { x: 0, z: 0.15, r: 0.62, y: 0.74 };   // the seance table
const CAB = { x0: -W, x1: -W + 0.8, z0: -1.75, z1: -0.45 };   // spirit cabinet against the west wall
const DOOR = { z: 1.65, w: 0.95, h: 2.2 };       // door in the west wall
const POS = {
  table: new THREE.Vector3(TB.x, TB.y + 0.05, TB.z), under: new THREE.Vector3(TB.x, 0.5, TB.z), mchair: new THREE.Vector3(-0.98, 0.5, TB.z),
  cab: new THREE.Vector3(CAB.x1 - 0.1, 1.4, (CAB.z0 + CAB.z1) / 2), back: new THREE.Vector3(-W + 0.2, 1.2, (CAB.z0 + CAB.z1) / 2),
  door: new THREE.Vector3(-W + 0.05, 1.2, DOOR.z), tap: new THREE.Vector3(-W + 0.05, 1.45, 0.45), clock: new THREE.Vector3(0, 1.4, -D + 0.3),
  mirror: new THREE.Vector3(0, 1.98, -D + 0.39), bureau: new THREE.Vector3(1.85, 1.0, -D + 0.3), books: new THREE.Vector3(-1.8, 1.3, -D + 0.2),
  camera: new THREE.Vector3(1.95, 1.45, 0.35), plates: new THREE.Vector3(2.45, 0.8, 1.05), window: new THREE.Vector3(W, 1.7, -0.3),
  gas: new THREE.Vector3(TB.x, 2.2, TB.z), street: new THREE.Vector3(W + 3, 1.5, -0.3), hall: new THREE.Vector3(-W - 1.5, 1.5, DOOR.z), upstairs: new THREE.Vector3(0.5, H + 1.2, -0.5),
};

/* ---------------- noise ---------------- */
const NP = new Uint8Array(512); { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) NP[i] = p[i & 255]; }
const fade = t => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
  const a = NP[NP[X] + Y] / 255, b = NP[NP[X + 1] + Y] / 255, c = NP[NP[X] + Y + 1] / 255, d = NP[NP[X + 1] + Y + 1] / 255, u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += vnoise(x * f, y * f) * a; f *= 2.03; a *= 0.5; } return s; }
// per-pixel canvas painter: fn(x, y) -> [r, g, b] (0-255)
function pix(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y), i = (y * w + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] ?? 255; } g.putImageData(img, 0, 0); return c; }
function tex(c, { srgb = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t; }
function canv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------------- textures ---------------- */
function makeTextures() {
  // wood: long grain along u. one texture span = 1 metre (UVs on bevelled furniture are in metres)
  const wood = (dark, light, n = 512) => pix(n, n, (x, y) => {
    const u = x / n, v = y / n;
    const warp = fbm(u * 3, v * 22, 3) * 3.2 + fbm(u * 0.8, v * 3, 2) * 1.5;
    let gr = Math.sin((v * 46 + warp) * Math.PI) * 0.5 + 0.5; gr = Math.pow(gr, 2.6);
    const fl = fbm(u * 40, v * 160, 2), pore = fbm(u * 180, v * 900, 1) > 0.72 ? 1 : 0;
    const t = 0.55 * gr + 0.35 * fl + 0.1 * fbm(u * 4, v * 4, 2);
    const c = mixc(dark, light, t); const p = pore ? 0.82 : 1; return [c[0] * p, c[1] * p, c[2] * p];
  });
  const woodRough = (n = 512) => pix(n, n, (x, y) => { const u = x / n, v = y / n; const warp = fbm(u * 3, v * 22, 3) * 3.2; let gr = Math.pow(Math.sin((v * 46 + warp) * Math.PI) * 0.5 + 0.5, 2.6); const pore = fbm(u * 180, v * 900, 1) > 0.72 ? 1 : 0; const r = 105 + gr * 45 + pore * 70 + fbm(u * 8, v * 8, 2) * 30; return [r, r, r]; });
  T.mahog = tex(wood([52, 20, 11], [118, 52, 28]), { repeat: [1, 1] });
  T.mahogR = tex(woodRough(), { srgb: false });
  T.oak = tex(wood([62, 42, 24], [128, 92, 55]), { repeat: [1, 1] });

  // floorboards (oak, stained dark) — 1 texture = 1.2 m square, 8 boards
  T.floor = tex(pix(1024, 1024, (x, y) => {
    const bw = 1024 / 8, b = Math.floor(x / bw), bx = (x % bw) / bw, seg = Math.floor((y / 1024 + NP[b] / 255) * 2);
    const u = bx * 0.15 + b * 0.37 + seg * 0.21, v = y / 1024 * 1.2;
    const warp = fbm(u * 6, v * 8 + seg * 3, 3) * 2.5; let gr = Math.pow(Math.sin((u * 60 + warp) * Math.PI) * 0.5 + 0.5, 2.4);
    let t = 0.5 * gr + 0.4 * fbm(u * 30, v * 120, 2) + 0.1 * (NP[b * 7 + seg] / 255);
    let c = mixc([34, 22, 13], [92, 62, 36], t);
    const edge = Math.min(bx, 1 - bx) * bw; if (edge < 1.6) c = c.map(q => q * 0.35);
    const joint = Math.abs(((y / 1024 + NP[b] / 255) * 2) % 1) * 1024 / 2; if (joint < 1.2) c = c.map(q => q * 0.4);
    const wear = fbm(x / 140, y / 140, 3); c = c.map(q => q * (0.8 + wear * 0.35));
    return c;
  }), { repeat: [W * 2 / 1.2, D * 2 / 1.2] });
  T.floorN = heightToNormal(pix(512, 512, (x, y) => { const bx = (x % 64) / 64; const e = Math.min(bx, 1 - bx) * 64 < 1.2 ? 60 : 160 + fbm(x / 6, y / 40, 2) * 40; return [e, e, e]; }), 2.5); T.floorN.repeat.copy(T.floor.repeat);

  // flocked damask wallpaper: olive-green ground, raised darker flock; one tile = 0.56 m
  const DAM = 512;
  const damaskMask = canv(DAM, DAM, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const motif = (cx, cy, s) => {
      g.save(); g.translate(cx, cy); g.scale(s, s);
      for (const sx of [1, -1]) {
        g.save(); g.scale(sx, 1);
        // palmette: central stem, flame leaves and scrolls
        g.beginPath(); g.moveTo(0, -120); g.bezierCurveTo(26, -90, 34, -52, 10, -18); g.bezierCurveTo(40, -30, 62, -6, 54, 26); g.bezierCurveTo(46, 10, 30, 8, 16, 18);
        g.bezierCurveTo(38, 40, 40, 74, 20, 96); g.bezierCurveTo(16, 74, 8, 60, 0, 56); g.closePath(); g.fill();
        g.lineWidth = 7; g.beginPath(); g.moveTo(8, -60); g.bezierCurveTo(60, -80, 92, -40, 74, -10); g.bezierCurveTo(64, 6, 44, 0, 50, -14); g.stroke();
        g.beginPath(); g.moveTo(14, 70); g.bezierCurveTo(70, 70, 96, 110, 70, 132); g.bezierCurveTo(52, 144, 40, 124, 56, 118); g.stroke();
        g.beginPath(); g.ellipse(84, 40, 14, 26, -0.5, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(0, 104); g.bezierCurveTo(12, 118, 10, 132, 0, 146); g.fill();
        g.restore();
      }
      g.beginPath(); g.ellipse(0, -140, 8, 14, 0, 0, TAU); g.fill();
      g.restore();
    };
    // half-drop repeat
    for (const [x, y] of [[w / 2, h * 0.32], [0, h * 0.82], [w, h * 0.82], [0, -h * 0.18], [w, -h * 0.18], [w / 2, h * 1.32]]) motif(x, y, 0.95);
    // small sprigs between
    g.lineWidth = 4; for (const [x, y] of [[w / 4, h * 0.07], [w * 0.75, h * 0.07], [w / 4, h * 0.57], [w * 0.75, h * 0.57]]) { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 10, x + Math.cos(a) * 26, y + Math.sin(a) * 26); g.stroke(); } }
  });
  const dm = damaskMask.getContext('2d').getImageData(0, 0, DAM, DAM).data;
  T.wall = tex(pix(DAM, DAM, (x, y) => {
    const m = dm[(y * DAM + x) * 4] / 255, n = fbm(x / 40, y / 40, 3), fine = vnoise(x / 1.6, y / 1.6);
    const ground = mixc([46, 58, 40], [60, 72, 50], n * 0.8 + fine * 0.2), flock = mixc([26, 34, 22], [36, 44, 28], fine);
    let c = mixc(ground, flock, m);
    const stripe = (Math.sin(x / DAM * TAU * 14) * 0.5 + 0.5) * 0.06 * (1 - m); c = c.map(q => q * (0.97 + stripe));
    return c;
  }), { repeat: [1, 1] });
  const flockH = canv(DAM, DAM, (g, w, h) => { g.filter = 'blur(2px)'; g.drawImage(damaskMask, 0, 0); g.filter = 'none'; const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i] * 0.7 + Math.random() * 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; } g.putImageData(d, 0, 0); });
  T.wallN = heightToNormal(flockH, 3.5);
  T.wallR = tex(pix(DAM, DAM, (x, y) => { const m = dm[(y * DAM + x) * 4] / 255; const r = 150 + m * 95; return [r, r, r]; }), { srgb: false });
  // stains and soot on the paper: a big overlay per wall, used as the AO-ish darkening via the colour map of a second layer
  T.grime = tex(canv(512, 512, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 22; i++) blot(g, rand(0, w), rand(0, h), rand(30, 120), rand(0.04, 0.12), '70,55,30'); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(40,30,15,0.28)'); gr.addColorStop(0.35, 'rgba(40,30,15,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));

  // plaster (ceiling, frieze, cornice)
  T.plaster = tex(pix(256, 256, (x, y) => { const n = fbm(x / 20, y / 20, 4); const v = 200 + n * 40; return [v, v * 0.96, v * 0.88]; }), { repeat: [4, 4] });
  T.ceil = tex(canv(512, 512, (g, w, h) => { for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) g.drawImage(T.plaster.userData.canvas, x, y, 128, 128); const gr = g.createRadialGradient(w / 2, h / 2 + 12, 0, w / 2, h / 2 + 12, w * 0.35); gr.addColorStop(0, 'rgba(30,20,10,0.75)'); gr.addColorStop(0.4, 'rgba(40,28,14,0.35)'); gr.addColorStop(1, 'rgba(40,28,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));

  // marble (mantel)
  T.marble = tex(pix(512, 512, (x, y) => { const u = x / 512, v = y / 512; const t = fbm(u * 3, v * 3, 5) * 6 + u * 4 + v * 2; const vein = Math.pow(1 - Math.abs(Math.sin(t * Math.PI)), 12); const base = 212 + fbm(u * 10, v * 10, 3) * 30; const c = base - vein * 110 - Math.pow(1 - Math.abs(Math.sin(t * 2.3)), 30) * 40; return [c, c * 0.985, c * 0.96]; }), { repeat: [1, 1] });

  // Persian rug (field, medallion, borders)
  T.rug = tex(canv(1024, 768, (g, w, h) => {
    const RED = '#6a1714', NAVY = '#1c2440', IVORY = '#d8c9a3', GOLD = '#b0813c', RUST = '#8c3a1c';
    g.fillStyle = RED; g.fillRect(0, 0, w, h);
    // field lattice of small botehs
    for (let y = 60; y < h - 40; y += 42) for (let x = 60 + ((y / 42) % 2) * 21; x < w - 40; x += 42) { g.fillStyle = (x + y) % 3 ? '#4d1210' : '#7e2a1c'; g.beginPath(); g.ellipse(x, y, 7, 11, 0.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(216,201,163,0.35)'; g.fillRect(x - 1, y - 1, 2, 2); }
    // medallion
    g.save(); g.translate(w / 2, h / 2);
    for (const [r, col] of [[230, NAVY], [205, IVORY], [196, RUST], [150, NAVY], [118, GOLD], [96, RED], [70, IVORY], [40, NAVY]]) { g.fillStyle = col; g.beginPath(); for (let k = 0; k <= 32; k++) { const a = k / 32 * TAU, rr = r * (1 + 0.1 * Math.cos(a * 8)); g.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.8); } g.fill(); }
    g.restore();
    // spandrels
    for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]]) { g.save(); g.translate(cx, cy); g.scale(sx, sy); g.fillStyle = NAVY; g.beginPath(); g.moveTo(40, 40); g.quadraticCurveTo(260, 60, 300, 40); g.quadraticCurveTo(200, 150, 40, 220); g.fill(); g.fillStyle = GOLD; g.beginPath(); g.ellipse(110, 100, 30, 18, 0.5, 0, TAU); g.fill(); g.restore(); }
    // borders
    const band = (o, t, col) => { g.strokeStyle = col; g.lineWidth = t; g.strokeRect(o + t / 2, o + t / 2, w - 2 * o - t, h - 2 * o - t); };
    band(0, 14, IVORY); band(14, 34, NAVY); band(48, 8, GOLD); band(56, 4, IVORY);
    g.fillStyle = RUST; for (let x = 30; x < w; x += 36) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x + 12, 31); g.lineTo(x, 44); g.lineTo(x - 12, 31); g.fill(); g.beginPath(); g.moveTo(x, h - 18); g.lineTo(x + 12, h - 31); g.lineTo(x, h - 44); g.lineTo(x - 12, h - 31); g.fill(); }
    for (let y = 30; y < h; y += 36) { g.beginPath(); g.moveTo(18, y); g.lineTo(31, y + 12); g.lineTo(44, y); g.lineTo(31, y - 12); g.fill(); g.beginPath(); g.moveTo(w - 18, y); g.lineTo(w - 31, y + 12); g.lineTo(w - 44, y); g.lineTo(w - 31, y - 12); g.fill(); }
    // wear, pile noise
    const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const px = (i / 4) % w, py = Math.floor(i / 4 / w); const n = 0.78 + vnoise(px / 1.3, py / 1.3) * 0.2 + fbm(px / 90, py / 90, 2) * 0.12; const wear = Math.max(0, fbm(px / 160 + 3, py / 160, 3) - 0.55) * 1.2; for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, d.data[i + k] * n * (1 - wear * 0.5) + wear * 40); } g.putImageData(d, 0, 0);
  }));
  T.rugN = heightToNormal(pix(256, 256, (x, y) => { const v = 120 + vnoise(x / 1.1, y / 1.1) * 110; return [v, v, v]; }), 1.2); T.rugN.repeat.set(12, 9);

  // velvet: slight nap noise
  T.velvetN = heightToNormal(pix(256, 256, (x, y) => { const v = 128 + (vnoise(x / 1.5, y / 3) - 0.5) * 120; return [v, v, v]; }), 1.0); T.velvetN.repeat.set(6, 6);
  // brass/gilt tarnish
  T.tarnish = tex(pix(256, 256, (x, y) => { const n = fbm(x / 24, y / 24, 4); const r = 90 + n * 120; return [r, r, r]; }), { srgb: false, repeat: [2, 2] });
  // fireplace tiles (Minton-style)
  T.tiles = tex(canv(256, 256, (g, w, h) => {
    const s = 128; for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) { const x0 = tx * s, y0 = ty * s; g.fillStyle = '#c9b98f'; g.fillRect(x0, y0, s, s); g.fillStyle = '#6b2a1d'; g.beginPath(); g.arc(x0 + s / 2, y0 + s / 2, 38, 0, TAU); g.fill(); g.fillStyle = '#2d4a3a'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.beginPath(); g.ellipse(x0 + s / 2 + Math.cos(a) * 46, y0 + s / 2 + Math.sin(a) * 46, 14, 26, a, 0, TAU); g.fill(); } g.fillStyle = '#d9c9a0'; g.beginPath(); g.arc(x0 + s / 2, y0 + s / 2, 14, 0, TAU); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.strokeRect(x0 + 1.5, y0 + 1.5, s - 3, s - 3); }
    speckle(g, w, h, 2000, 0.12);
  }), { repeat: [1, 5] });
  // book spines
  T.books = tex(canv(1024, 256, (g, w, h) => {
    let x = 0; const cols = ['#4a1a14', '#1f2d22', '#2a2230', '#5b3a1a', '#3a1010', '#18222e', '#6a4a2a', '#2c1c12'];
    while (x < w) { const bw = rand(14, 34), bh = rand(170, 250), c = pick(cols); g.fillStyle = c; g.fillRect(x, h - bh, bw - 1, bh); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + bw - 3, h - bh, 2, bh); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 2, h - bh, 2, bh);
      g.fillStyle = '#b8913f'; for (const yy of [h - bh + 14, h - bh + 20, h - 22]) g.fillRect(x + 3, yy, bw - 7, 2); if (Math.random() < 0.6) g.fillRect(x + 4, h - bh + 40, bw - 9, 16); x += bw; }
    speckle(g, w, h, 3000, 0.15);
  }));
  // luminous paint: what the marks look like when they glow (emissive map)
  T.glowNums = {};
  for (let n = 1; n <= 4; n++) T.glowNums[n] = tex(canv(64, 64, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `bold 44px ${FELL}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), w / 2, h / 2 + 3); g.filter = 'blur(1px)'; g.drawImage(g.canvas, 0, 0); }));
  T.glowHand = tex(canv(128, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.save(); g.translate(64, 76); g.beginPath(); g.ellipse(0, 10, 26, 30, 0, 0, TAU); g.fill(); [[-26, -18, -0.5, 30], [-12, -34, -0.15, 40], [4, -38, 0.05, 44], [18, -32, 0.22, 40], [30, -8, 0.8, 26]].forEach(([x, y, a, l]) => { g.save(); g.translate(x, y + 20); g.rotate(a); g.beginPath(); g.ellipse(0, -l / 2, 6.5, l / 2, 0, 0, TAU); g.fill(); g.restore(); }); g.restore(); }));
  T.childHand = tex(canv(128, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.save(); g.translate(64, 76); g.scale(0.62, 0.62); g.beginPath(); g.ellipse(0, 10, 26, 30, 0, 0, TAU); g.fill(); [[-26, -18, -0.5, 28], [-12, -34, -0.15, 36], [4, -38, 0.05, 40], [18, -32, 0.22, 36], [30, -8, 0.8, 24]].forEach(([x, y, a, l]) => { g.save(); g.translate(x, y + 20); g.rotate(a); g.beginPath(); g.ellipse(0, -l / 2, 7, l / 2, 0, 0, TAU); g.fill(); g.restore(); }); g.restore(); }));
  T.flame = tex(canv(64, 128, (g, w, h) => { const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.25, 'rgba(255,214,140,0.95)'); gr.addColorStop(0.55, 'rgba(255,140,40,0.6)'); gr.addColorStop(1, 'rgba(255,90,10,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 6); g.bezierCurveTo(52, 50, 50, 100, 32, 118); g.bezierCurveTo(14, 100, 12, 50, 32, 6); g.fill(); g.fillStyle = 'rgba(60,90,255,0.35)'; g.beginPath(); g.ellipse(32, 112, 7, 6, 0, 0, TAU); g.fill(); }));
  T.glow = tex(canv(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  // night outside the window: rain on glass, a gas lamp across the street
  T.night = tex(canv(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070b'); gr.addColorStop(1, '#0b0e13'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const lamp = g.createRadialGradient(w * 0.62, h * 0.42, 0, w * 0.62, h * 0.42, 120); lamp.addColorStop(0, 'rgba(255,214,150,0.9)'); lamp.addColorStop(0.1, 'rgba(255,190,110,0.35)'); lamp.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = lamp; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(20,24,30,1)'; g.fillRect(0, h * 0.62, w, h * 0.38); for (let i = 0; i < 220; i++) { const x = rand(0, w), y = rand(0, h), l = rand(6, 30); g.strokeStyle = `rgba(200,210,230,${rand(0.05, 0.22)})`; g.lineWidth = rand(0.6, 1.6); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-2, 2), y + l); g.stroke(); } }));
}

/* ---------------- materials ---------------- */
function std(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.45 }, o)); }
function phys(o) { return new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.45 }, o)); }
function makeMaterials() {
  M.wall = std({ map: T.wall, normalMap: T.wallN, normalScale: new THREE.Vector2(0.9, 0.9), roughnessMap: T.wallR, roughness: 1 });
  M.mahog = phys({ map: T.mahog, roughnessMap: T.mahogR, roughness: 0.9, clearcoat: 0.75, clearcoatRoughness: 0.28 });
  M.wain = phys({ map: T.mahog, roughnessMap: T.mahogR, roughness: 0.9, clearcoat: 0.45, clearcoatRoughness: 0.4, color: 0xb89a88 });
  M.ebony = phys({ color: 0x1a110c, roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.25 });
  M.oak = phys({ map: T.oak, roughnessMap: T.mahogR, roughness: 0.9, clearcoat: 0.4, clearcoatRoughness: 0.35 });
  M.floor = phys({ map: T.floor, normalMap: T.floorN, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.45 });
  M.rug = phys({ map: T.rug, normalMap: T.rugN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 1, sheen: 0.7, sheenColor: new THREE.Color(0x8a5a4a), sheenRoughness: 0.6 });
  M.plaster = std({ map: T.plaster, roughness: 0.95, color: 0xf2eee4 });
  M.ceil = std({ map: T.ceil, roughness: 0.95 });
  M.marble = phys({ map: T.marble, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  M.brass = std({ color: 0xc9a060, metalness: 1, roughness: 0.34, roughnessMap: T.tarnish, envMapIntensity: 0.9 });
  M.gilt = std({ color: 0xb58d45, metalness: 1, roughness: 0.42, roughnessMap: T.tarnish, envMapIntensity: 0.8 });
  M.iron = std({ color: 0x141312, metalness: 0.55, roughness: 0.62 });
  M.soot = std({ color: 0x080706, roughness: 1 });
  M.velvet = phys({ color: 0x4e0a10, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color(0xc0404f), sheenRoughness: 0.4, normalMap: T.velvetN, normalScale: new THREE.Vector2(0.3, 0.3) });
  M.velvetG = phys({ color: 0x173222, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color(0x5a9a70), sheenRoughness: 0.45, normalMap: T.velvetN, normalScale: new THREE.Vector2(0.3, 0.3) });
  M.cloth = phys({ color: 0x3c0d11, roughness: 1, sheen: 0.9, sheenColor: new THREE.Color(0xa8504a), sheenRoughness: 0.55, normalMap: T.velvetN, normalScale: new THREE.Vector2(0.5, 0.5) });
  M.fringe = std({ color: 0x8a6a2a, roughness: 0.8 });
  M.wax = phys({ color: 0xece2c6, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffe8c0) });
  M.paper = std({ color: 0xe6dcc4, roughness: 0.92 });
  M.slate = std({ color: 0x2a2e32, roughness: 0.85 });
  M.tiles = phys({ map: T.tiles, roughness: 0.3, clearcoat: 0.8 });
  M.books = std({ map: T.books, roughness: 0.7 });
  M.black = std({ color: 0x0c0b0a, roughness: 0.6 });
  M.glass = std({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.18, envMapIntensity: 1.2, depthWrite: false });
  M.globe = std({ color: 0xf0e2c8, roughness: 0.4, transparent: true, opacity: 0.7, emissive: new THREE.Color(0xff9a48), emissiveIntensity: 0, depthWrite: false });
  M.lace = std({ color: 0xe8e0cc, roughness: 1, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  M.night = new THREE.MeshBasicMaterial({ map: T.night, color: 0x9aa4b0 });
  M.leaf = phys({ color: 0x1f3a1c, roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide });
  M.pot = phys({ color: 0x6b3a22, roughness: 0.4, clearcoat: 0.7 });
  M.flameS = new THREE.SpriteMaterial({ map: T.flame, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  M.glowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffc27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 });
  // luminous paint: invisible until charged, then a green-white glow
  M.lum = new THREE.MeshBasicMaterial({ color: 0x9dffc8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
}


/* =====================================================================
   THE LAST SITTING · part B: geometry, furniture, lights
   ===================================================================== */
/* ---------------- geometry helpers ---------------- */
// a bevelled box with UVs in metres (so wood grain has a real scale)
function bevGeo(w, h, d, b = 0.006, seg = 2) {
  b = Math.max(0.0005, Math.min(b, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005));
  const s = new THREE.Shape(), x = w / 2 - b, y = h / 2 - b; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: 1 });
  g.translate(0, 0, -Math.max(0.0005, d - 2 * b) / 2); return g;
}
function bev(w, h, d, mat, x, y, z, parent = scene, b = 0.006) { return mesh(bevGeo(w, h, d, b), mat, x, y, z, parent); }
function lathe(pts, mat, x, y, z, parent = scene, seg = 28) { return mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg), mat, x, y, z, parent); }
function tube(pts, r, mat, parent = scene, seg = 32, rs = 8, closed = false) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), closed); return mesh(new THREE.TubeGeometry(c, seg, r, rs, closed), mat, 0, 0, 0, parent); }
// a rectangular frame (picture frames, mirror, door architrave): outer w x h, inner iw x ih, depth d
function frameGeo(w, h, iw, ih, d, b = 0.008) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  const hole = new THREE.Path(); hole.moveTo(-iw / 2, -ih / 2); hole.lineTo(-iw / 2, ih / 2); hole.lineTo(iw / 2, ih / 2); hole.lineTo(iw / 2, -ih / 2); hole.closePath(); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - b), bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 3, curveSegments: 1 }); return g;
}
// a disc slab (table tops) lying flat, UVs in metres
function discGeo(r, t, b = 0.01, seg = 64) { const s = new THREE.Shape(); s.absarc(0, 0, r - b, 0, TAU, false); const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, t - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: seg }); g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return g; }
// a hanging cloth: a plane with vertical folds, pinned along the top
function drapeGeo(w, h, folds, amp, gather = 0) {
  const g = new THREE.PlaneGeometry(w, h, Math.max(8, folds * 8), 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), k = (h / 2 - y) / h; const ph = x / w * folds * TAU; p.setZ(i, Math.sin(ph) * amp * (0.6 + 0.4 * k) + Math.sin(ph * 2.3 + 1) * amp * 0.25); if (gather) p.setX(i, x * (1 - gather * (1 - k) * 0.0)); }
  g.computeVertexNormals(); return g;
}
function uvScale(g, su, sv, ou = 0, ov = 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov); uv.needsUpdate = true; return g; }
// walls: s runs along the wall; each face knows how to place a rect on it
const FACE = {
  N: { ry: 0, at: (s, y, i) => [s, y, -D + i] }, S: { ry: Math.PI, at: (s, y, i) => [-s, y, D - i] },
  W: { ry: Math.PI / 2, at: (s, y, i) => [-W + i, y, -s] }, E: { ry: -Math.PI / 2, at: (s, y, i) => [W - i, y, s] },
};
function wallRect(f, s0, s1, y0, y1, mat, tile = 0.56, inset = 0) {
  const w = s1 - s0, h = y1 - y0, g = new THREE.PlaneGeometry(w, h); uvScale(g, w / tile, h / tile, s0 / tile, y0 / tile);
  const m = new THREE.Mesh(g, mat); m.position.set(...FACE[f].at((s0 + s1) / 2, (y0 + y1) / 2, inset)); m.rotation.y = FACE[f].ry; m.receiveShadow = true; scene.add(m); return m;
}
function wallBox(f, s0, s1, yc, h, d, mat, inset = 0, b = 0.004) {
  const m = mesh(bevGeo(s1 - s0, h, d, b), mat, 0, 0, 0); m.position.set(...FACE[f].at((s0 + s1) / 2, yc, inset + d / 2)); m.rotation.y = FACE[f].ry; return m;
}
// runs of wall between openings: [s0, s1] pairs for full-height paper
const RUNS = {
  N: [[-W, -0.95], [0.95, W]], S: [[-W, W]],
  W: [[-D, -(DOOR.z + DOOR.w / 2)], [-(DOOR.z - DOOR.w / 2), D]], E: [[-D, -1.0], [0.4, D]],
};

/* ---------------- the shell ---------------- */
function buildShell() {
  const shell = new THREE.Group(); scene.add(shell);
  // floor & ceiling
  const fl = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(W * 2, D * 2), 1, 1), M.floor); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, D * 2), M.ceil); ce.rotation.x = Math.PI / 2; ce.position.y = H; ce.receiveShadow = true; scene.add(ce);
  // rug
  const rug = mesh(new THREE.BoxGeometry(3.7, 0.012, 2.8), M.rug, TB.x + 0.05, 0.006, TB.z + 0.05); rug.castShadow = false;
  // walls: wainscot (0-0.95), paper (0.95-2.72), frieze (2.72-3.02), cornice
  const Y0 = 0.95, Y1 = 2.72;
  for (const f of 'NSWE') for (const [s0, s1] of RUNS[f]) {
    wallRect(f, s0, s1, Y0, Y1, M.wall);
    wallRect(f, s0, s1, Y1, H, M.plaster, 1.2);
    wallRect(f, s0, s1, 0, Y0, M.wain, 1.0);
    // wainscot panels
    const n = Math.max(1, Math.round((s1 - s0) / 0.62)), pw = (s1 - s0) / n;
    for (let k = 0; k < n; k++) { const a = s0 + k * pw; wallBox(f, a + 0.07, a + pw - 0.07, 0.56, 0.5, 0.018, M.wain, 0, 0.009); }
    wallBox(f, s0, s1, 0.12, 0.24, 0.028, M.mahog, 0, 0.006);           // skirting
    wallBox(f, s0, s1, 0.255, 0.03, 0.036, M.mahog, 0, 0.01);
    wallBox(f, s0, s1, Y0, 0.055, 0.04, M.mahog, 0, 0.012);             // dado rail
    wallBox(f, s0, s1, Y1, 0.035, 0.028, M.mahog, 0, 0.008);            // picture rail
    wallBox(f, s0, s1, 3.06, 0.06, 0.07, M.plaster, 0, 0.01);          // cornice steps
    wallBox(f, s0, s1, 3.13, 0.09, 0.13, M.plaster, 0, 0.012);
    wallBox(f, s0, s1, 3.185, 0.03, 0.2, M.plaster, 0, 0.008);
  }
  // over the door, above/below the window
  const ds0 = -(DOOR.z + DOOR.w / 2), ds1 = -(DOOR.z - DOOR.w / 2);
  wallRect('W', ds0, ds1, DOOR.h, Y1, M.wall); wallRect('W', ds0, ds1, Y1, H, M.plaster, 1.2);
  wallBox('W', ds0, ds1, Y1, 0.035, 0.028, M.mahog, 0, 0.008); wallBox('W', ds0, ds1, 3.13, 0.09, 0.13, M.plaster, 0, 0.012); wallBox('W', ds0, ds1, 3.185, 0.03, 0.2, M.plaster, 0, 0.008);
  wallRect('E', -1.0, 0.4, 2.65, Y1, M.wall); wallRect('E', -1.0, 0.4, Y1, H, M.plaster, 1.2); wallRect('E', -1.0, 0.4, Y0, 0.85, M.wall); wallRect('E', -1.0, 0.4, 0, Y0 - 0.1, M.wain, 1.0);
  wallBox('E', -1.0, 0.4, 0.12, 0.24, 0.028, M.mahog); wallBox('E', -1.0, 0.4, 3.13, 0.09, 0.13, M.plaster, 0, 0.012); wallBox('E', -1.0, 0.4, 3.185, 0.03, 0.2, M.plaster, 0, 0.008);
  // chimney breast (north): front face at z = -D + 0.38 and two short sides
  const BZ = 0.38;
  wallRect('N', -0.95, 0.95, Y1, H, M.plaster, 1.2, BZ); wallRect('N', -0.95, 0.95, Y0, Y1, M.wall, 0.56, BZ);
  wallRect('N', -0.95, -0.66, 0, Y0, M.wain, 1, BZ); wallRect('N', 0.66, 0.95, 0, Y0, M.wain, 1, BZ);
  wallBox('N', -0.95, 0.95, 3.13, 0.09, 0.13, M.plaster, BZ, 0.012); wallBox('N', -0.95, 0.95, 3.185, 0.03, 0.2, M.plaster, BZ, 0.008); wallBox('N', -0.95, 0.95, Y1, 0.035, 0.028, M.mahog, BZ, 0.008);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(BZ, Y1 - Y0), BZ / 0.56, (Y1 - Y0) / 0.56), M.wall); side.position.set(sx * 0.95, (Y0 + Y1) / 2, -D + BZ / 2); side.rotation.y = sx * Math.PI / 2; scene.add(side);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(BZ, H - Y1), M.plaster); top.position.set(sx * 0.95, (Y1 + H) / 2, -D + BZ / 2); top.rotation.y = sx * Math.PI / 2; scene.add(top);
    const low = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(BZ, Y0), BZ, Y0), M.wain); low.position.set(sx * 0.95, Y0 / 2, -D + BZ / 2); low.rotation.y = sx * Math.PI / 2; scene.add(low);
    bev(0.03, 0.24, BZ, M.mahog, sx * 0.964, 0.12, -D + BZ / 2); bev(0.04, 0.055, BZ, M.mahog, sx * 0.97, Y0, -D + BZ / 2, scene, 0.012);
  }
  // ceiling rose over the table
  lathe([[0.001, 0], [0.34, 0], [0.33, -0.015], [0.28, -0.02], [0.26, -0.035], [0.18, -0.04], [0.14, -0.06], [0.08, -0.07], [0.04, -0.09], [0.001, -0.095]], M.plaster, TB.x, H, TB.z, scene, 40);
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; const lf = mesh(new THREE.SphereGeometry(0.035, 10, 6), M.plaster, TB.x + Math.cos(a) * 0.22, H - 0.03, TB.z + Math.sin(a) * 0.22); lf.scale.set(1, 0.35, 0.55); lf.rotation.y = -a; }
  return shell;
}

/* ---------------- fireplace, mirror, mantel ---------------- */
function buildFireplace() {
  const Z = -D + 0.38;
  // marble surround
  for (const sx of [-1, 1]) bev(0.2, 1.02, 0.1, M.marble, sx * 0.56, 0.51, Z + 0.05, scene, 0.012);
  bev(1.32, 0.2, 0.1, M.marble, 0, 1.12, Z + 0.05, scene, 0.012);
  bev(1.72, 0.05, 0.32, M.marble, 0, 1.245, Z + 0.1, scene, 0.018);                   // mantel shelf
  bev(1.6, 0.03, 0.26, M.marble, 0, 1.21, Z + 0.08, scene, 0.01);
  for (const sx of [-1, 1]) { bev(0.1, 0.1, 0.14, M.marble, sx * 0.56, 1.05, Z + 0.1, scene, 0.02); }
  // tiled cheeks and the cast-iron insert with its arch
  for (const sx of [-1, 1]) { const t = mesh(uvScale(new THREE.PlaneGeometry(0.1, 0.95), 1, 1), M.tiles, sx * 0.41, 0.475, Z + 0.004); }
  bev(0.72, 0.95, 0.04, M.iron, 0, 0.475, Z - 0.005, scene, 0.008);
  const arch = new THREE.Shape(); arch.moveTo(-0.24, 0); arch.lineTo(0.24, 0); arch.lineTo(0.24, 0.5); arch.absarc(0, 0.5, 0.24, 0, Math.PI, false); arch.lineTo(-0.24, 0);
  const opening = mesh(new THREE.ShapeGeometry(arch), M.soot, 0, 0.04, Z + 0.017);
  const firebox = bev(0.5, 0.78, 0.3, M.soot, 0, 0.4, Z - 0.16); firebox.material = std({ color: 0x050404, roughness: 1, side: THREE.BackSide });
  // grate and dead coals
  for (let i = 0; i < 6; i++) bev(0.012, 0.18, 0.012, M.iron, -0.2 + i * 0.08, 0.16, Z + 0.04);
  bev(0.44, 0.02, 0.1, M.iron, 0, 0.08, Z - 0.02);
  for (let i = 0; i < 14; i++) { const c = mesh(new THREE.IcosahedronGeometry(rand(0.025, 0.045), 0), std({ color: 0x0e0d0c, roughness: 0.9 }), rand(-0.18, 0.18), rand(0.1, 0.16), Z + rand(-0.12, 0.02)); c.rotation.set(rand(0, 3), rand(0, 3), 0); }
  // hearth & fender
  bev(1.5, 0.03, 0.42, M.marble, 0, 0.015, Z + 0.21, scene, 0.008);
  const fp = []; for (let i = 0; i <= 20; i++) { const t = i / 20, a = Math.PI * (0.08 + t * 0.84); fp.push([Math.cos(a) * -0.66, 0.07, Z + 0.06 + Math.sin(a) * 0.28]); }
  tube(fp, 0.014, M.brass, scene, 40, 8);
  const fp2 = fp.map(([x, y, z]) => [x, 0.02, z]); tube(fp2, 0.02, M.brass, scene, 40, 8);
  // fire irons
  O.irons = grp(0.78, 0, Z + 0.22); lathe([[0.05, 0], [0.05, 0.01], [0.012, 0.02], [0.01, 0.25], [0.02, 0.27], [0.012, 0.3]], M.brass, 0, 0, 0, O.irons);
  for (const [a, l] of [[0.1, 0.62], [-0.08, 0.66], [0.02, 0.6]]) { const r = grp(0, 0.28, 0, O.irons); r.rotation.set(a, 0, a * 0.7); cyl(0.006, 0.006, l, M.iron, 0, l / 2, 0, r, 8); lathe([[0.001, 0], [0.012, 0.01], [0.014, 0.04], [0.008, 0.07], [0.001, 0.075]], M.brass, 0, l, 0, r, 12); }

  // overmantel mirror in a gilt frame
  O.mirrorG = grp(0, 1.96, Z + 0.004);
  const fr = mesh(frameGeo(1.24, 1.12, 1.06, 0.94, 0.05, 0.02), M.gilt, 0, 0, 0, O.mirrorG);
  mesh(frameGeo(1.1, 0.98, 1.06, 0.94, 0.03, 0.008), M.gilt, 0, 0, 0.02, O.mirrorG);
  lathe([[0.001, 0], [0.05, 0.01], [0.06, 0.05], [0.03, 0.09], [0.001, 0.12]], M.gilt, 0, 0.56, 0.02, O.mirrorG, 16);
  O.mirror = makeMirror(1.06, 0.94, { res: 640 }); O.mirror.position.set(0, 0, 0.012); O.mirrorG.add(O.mirror);
  O.mirror.userData.noRay = false;

  // the mantel clock: black slate, gilt feet, enamel dial, and a drawer in the plinth
  O.clock = grp(0, 1.27, Z + 0.12);
  bev(0.38, 0.05, 0.16, M.black, 0, 0.025, 0, O.clock, 0.012);
  O.clockDrawer = grp(0, 0.025, 0.0, O.clock); bev(0.2, 0.034, 0.012, M.black, 0, 0, 0.081, O.clockDrawer, 0.004); cyl(0.006, 0.006, 0.008, M.gilt, 0, 0, 0.09, O.clockDrawer, 10).rotation.x = Math.PI / 2;
  O.crankIn = grp(0, 0, 0.05, O.clockDrawer); bev(0.14, 0.012, 0.01, M.brass, 0, 0.004, 0, O.crankIn, 0.003); O.crankIn.visible = false;
  bev(0.3, 0.3, 0.13, M.black, 0, 0.2, 0, O.clock, 0.01);
  bev(0.34, 0.035, 0.15, M.black, 0, 0.365, 0, O.clock, 0.01);
  lathe([[0.001, 0], [0.05, 0], [0.04, 0.02], [0.012, 0.05], [0.02, 0.07], [0.001, 0.09]], M.gilt, 0, 0.383, 0, O.clock, 16);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe([[0.001, 0], [0.022, 0], [0.016, 0.02], [0.001, 0.026]], M.gilt, sx * 0.16, -0.02, sz * 0.06, O.clock, 12);
  for (const sx of [-1, 1]) { cyl(0.018, 0.018, 0.3, M.marble, sx * 0.135, 0.2, 0.06, O.clock, 14); }
  T.clockFace = ctex(256, 256, () => {}); O.dial = mesh(new THREE.CircleGeometry(0.085, 48), std({ map: T.clockFace, roughness: 0.25 }), 0, 0.2, 0.066, O.clock);
  mesh(new THREE.TorusGeometry(0.088, 0.008, 8, 48), M.gilt, 0, 0.2, 0.066, O.clock);
  O.bezel = mesh(new THREE.SphereGeometry(0.088, 24, 8, 0, TAU, 0, 0.5), M.glass, 0, 0.2, 0.03, O.clock); O.bezel.rotation.x = Math.PI / 2; O.bezel.scale.set(1, 0.35, 1); layer1(O.bezel);
  O.hHour = grp(0, 0.2, 0.072, O.clock); bev(0.008, 0.05, 0.002, M.black, 0, 0.022, 0, O.hHour, 0.0008);
  O.hMin = grp(0, 0.2, 0.075, O.clock); bev(0.005, 0.072, 0.002, M.black, 0, 0.034, 0, O.hMin, 0.0008);
  O.pend = grp(0, 0.1, 0.04, O.clock);

  // the mourning card on a little brass easel, left of the clock
  O.mcard = grp(-0.32, 1.27, Z + 0.14); O.mcard.rotation.y = 0.18;
  tube([[-0.04, 0, -0.06], [0, 0.13, -0.075], [0.04, 0, -0.06]], 0.002, M.brass, O.mcard, 12, 4); tube([[0, 0.12, -0.075], [0, 0, -0.13]], 0.002, M.brass, O.mcard, 6, 4); bev(0.1, 0.006, 0.012, M.brass, 0, 0.003, -0.035, O.mcard, 0.001);
  T.mcard = ctex(256, 360, () => {}); O.mcardFace = mesh(new THREE.PlaneGeometry(0.1, 0.14), std({ map: T.mcard, roughness: 0.7 }), 0, 0.075, -0.045, O.mcard); O.mcardFace.rotation.x = -0.2;
  // brass candlesticks (unlit) and a pair of vases
  for (const sx of [-1, 1]) {
    lathe([[0.001, 0], [0.055, 0], [0.055, 0.012], [0.03, 0.03], [0.015, 0.05], [0.012, 0.18], [0.022, 0.2], [0.012, 0.22], [0.012, 0.25], [0.022, 0.26], [0.001, 0.265]], M.brass, sx * 0.72, 1.27, Z + 0.12);
    cyl(0.011, 0.011, 0.14, M.wax, sx * 0.72, 1.27 + 0.33, Z + 0.12, scene, 12);
    lathe([[0.001, 0], [0.04, 0], [0.05, 0.05], [0.042, 0.13], [0.022, 0.18], [0.03, 0.22], [0.001, 0.22]], phys({ color: 0x24324a, roughness: 0.15, clearcoat: 1 }), sx * 0.5, 1.27, Z + 0.1, scene, 24);
  }
}

/* ---------------- the seance table and chairs ---------------- */
function buildTable() {
  O.table = grp(TB.x, 0, TB.z);
  // pedestal and tripod feet
  lathe([[0.001, 0.2], [0.12, 0.2], [0.13, 0.24], [0.08, 0.3], [0.06, 0.4], [0.075, 0.5], [0.05, 0.62], [0.06, 0.66], [0.12, 0.69], [0.001, 0.7]], M.mahog, 0, 0, 0, O.table, 28);
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; const f = grp(0, 0, 0, O.table); f.rotation.y = a; const leg = tube([[0.08, 0.26, 0], [0.22, 0.16, 0], [0.34, 0.05, 0], [0.4, 0.02, 0]], 0.028, M.mahog, f, 16, 8); lathe([[0.001, 0], [0.025, 0], [0.028, 0.01], [0.001, 0.03]], M.brass, 0.41, -0.005, 0, f, 12); }
  mesh(discGeo(TB.r, 0.03, 0.01), M.mahog, 0, TB.y - 0.03, 0, O.table);
  // the chenille cloth with a bullion fringe
  const top = mesh(new THREE.CircleGeometry(TB.r + 0.02, 64), M.cloth, 0, TB.y + 0.002, 0, O.table); top.rotation.x = -Math.PI / 2;
  const sk = new THREE.CylinderGeometry(TB.r + 0.03, TB.r + 0.07, 0.26, 96, 4, true), p = sk.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), k = (0.13 - y) / 0.26, r = Math.hypot(x, z) + Math.sin(a * 22) * 0.018 * k + Math.sin(a * 9 + 1) * 0.01 * k; p.setX(i, Math.cos(a) * r); p.setZ(i, Math.sin(a) * r); }
  sk.computeVertexNormals(); const skirt = mesh(sk, M.cloth, 0, TB.y - 0.13, 0, O.table); skirt.material = M.cloth.clone(); skirt.material.side = THREE.DoubleSide;
  const fr = new THREE.CylinderGeometry(TB.r + 0.075, TB.r + 0.08, 0.07, 96, 1, true); const fringe = mesh(fr, std({ color: 0x7a5a24, roughness: 0.85, side: THREE.DoubleSide, alphaMap: ctex(512, 32, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 2, h - rand(0, 6)); g.fillRect(0, 0, w, 6); }, { linear: true, repeat: [8, 1] }), alphaTest: 0.5 }), 0, TB.y - 0.29, 0, O.table);
  // under the cloth: the clapper box, and the cord from Madame's pedal
  O.clapper = grp(-0.2, TB.y - 0.06, 0, O.table); bev(0.16, 0.05, 0.1, M.oak, 0, 0, 0, O.clapper, 0.004); bev(0.12, 0.012, 0.02, M.brass, 0, -0.03, 0.03, O.clapper, 0.002);
  O.clockKey = grp(-0.07, TB.y - 0.1, 0.06, O.table); tube([[0, 0.05, 0], [0, 0.01, 0]], 0.0015, std({ color: 0x2a1a3a }), O.clockKey, 4, 3); lathe([[0.001, -0.03], [0.004, -0.03], [0.004, 0], [0.008, 0.002], [0.012, 0.01], [0.001, 0.012]], M.brass, 0, 0, 0, O.clockKey, 10);
  tube([[-0.2, TB.y - 0.08, 0], [-0.4, 0.3, 0.02], [-0.7, 0.02, 0.02], [-0.98, 0.02, 0]], 0.003, std({ color: 0x3a2e22 }), O.table, 20, 4);

  // candelabrum with three candles
  O.cand = grp(0.05, TB.y, -0.03, O.table);
  lathe([[0.001, 0], [0.09, 0], [0.09, 0.01], [0.06, 0.025], [0.03, 0.04], [0.018, 0.08], [0.026, 0.1], [0.014, 0.12], [0.012, 0.26], [0.024, 0.28], [0.014, 0.3], [0.001, 0.31]], M.brass, 0, 0, 0, O.cand, 28);
  O.flames = []; O.candleTops = [];
  const cups = [[0, 0.33, 0], [-0.13, 0.3, 0], [0.13, 0.3, 0]];
  for (const [i, [x, y, z]] of cups.entries()) {
    if (i) tube([[0, 0.24, 0], [x * 0.5, 0.26, 0], [x * 0.9, 0.24, 0], [x, 0.27, 0]], 0.007, M.brass, O.cand, 12, 6);
    lathe([[0.001, 0], [0.018, 0], [0.028, 0.015], [0.024, 0.02], [0.015, 0.012], [0.001, 0.012]], M.brass, x, y - 0.02, z, O.cand, 16);
    const hgt = [0.19, 0.15, 0.17][i]; const c = cyl(0.011, 0.012, hgt, M.wax, x, y - 0.005 + hgt / 2, z, O.cand, 14);
    const drip = mesh(new THREE.SphereGeometry(0.013, 10, 6, 0, TAU, 0, Math.PI / 2), M.wax, x, y - 0.005 + hgt, z, O.cand); drip.scale.y = 0.4;
    cyl(0.0012, 0.0012, 0.012, M.black, x, y + hgt, z, O.cand, 4);
    const fl = new THREE.Sprite(M.flameS.clone()); fl.scale.set(0.022, 0.048, 1); fl.position.set(x, y + hgt + 0.022, z); layer1(fl); O.cand.add(fl);
    const gl = new THREE.Sprite(M.glowS.clone()); gl.scale.set(0.14, 0.14, 1); gl.position.set(x, y + hgt + 0.02, z); layer1(gl); O.cand.add(gl);
    O.flames.push({ fl, gl, base: fl.position.y, ph: rand(0, 10) }); O.candleTops.push(new THREE.Vector3(x, y + hgt + 0.02, z));
  }

  // chairs: Madame's high-backed armchair at the west, four balloon-backs round the rest
  O.mchair = madameChair(); O.mchair.position.set(-0.98, 0, TB.z); O.mchair.rotation.y = -Math.PI / 2;
  O.chairs = [];
  for (const a of [118, 42, -42, -118]) { const r = 0.9, c = balloonChair(); const ar = a * Math.PI / 180; c.position.set(TB.x + Math.cos(ar) * r, 0, TB.z + Math.sin(ar) * r); c.rotation.y = Math.atan2(Math.cos(ar), Math.sin(ar)); O.chairs.push(c); c.userData.home = { x: c.position.x, z: c.position.z, ry: c.rotation.y }; }

  // on the table: talking board and planchette, the slates, a tambourine, a hand bell, the programme and the note
  O.board = grp(-0.3, TB.y + 0.004, 0, O.table); O.board.rotation.y = -Math.PI / 2;
  T.board = ctex(1024, 640, () => {}); bev(0.46, 0.012, 0.29, M.oak, 0, 0.006, 0, O.board, 0.004);
  const bf = mesh(new THREE.PlaneGeometry(0.44, 0.275), phys({ map: T.board, roughness: 0.45, clearcoat: 0.6 }), 0, 0.0125, 0, O.board); bf.rotation.x = -Math.PI / 2;
  O.planch = grp(0.02, 0.013, 0.03, O.board); { const s = new THREE.Shape(); s.moveTo(0, 0.06); s.bezierCurveTo(0.05, 0.05, 0.055, -0.02, 0.028, -0.045); s.bezierCurveTo(0.015, -0.055, -0.015, -0.055, -0.028, -0.045); s.bezierCurveTo(-0.055, -0.02, -0.05, 0.05, 0, 0.06); const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); mesh(g, M.mahog, 0, 0.012, 0, O.planch); mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.003, 20), M.glass, 0, 0.02, -0.008, O.planch); for (const [x, z] of [[0.03, 0.03], [-0.03, 0.03], [0, -0.04]]) cyl(0.003, 0.003, 0.012, M.brass, x, 0.006, z, O.planch, 6); }
  // two school slates bound with string (the lid can lift)
  O.slates = grp(0.3, TB.y + 0.004, -0.18, O.table); O.slates.rotation.y = 0.35;
  const slate = (parent, y) => { const g = grp(0, y, 0, parent); bev(0.27, 0.014, 0.2, M.oak, 0, 0, 0, g, 0.003); const s = mesh(new THREE.PlaneGeometry(0.24, 0.17), M.slate, 0, 0.0075, 0, g); s.rotation.x = -Math.PI / 2; return g; };
  O.slateLo = slate(O.slates, 0.007); O.slateHi = grp(0, 0.022, 0, O.slates); const hi = slate(O.slateHi, 0); hi.rotation.x = Math.PI; O.slateHi.position.x = 0;
  O.slateString = grp(0, 0, 0, O.slates); for (const x of [-0.06, 0.06]) { const r = mesh(new THREE.TorusGeometry(0.02, 0.0015, 4, 16), std({ color: 0xd8cfb4 }), x, 0.015, 0, O.slateString); r.scale.set(0.9, 1.1, 5.4); r.rotation.y = Math.PI / 2; }
  O.flap = grp(0, 0.016, 0, O.slates); O.flap.visible = false; const flp = mesh(new THREE.PlaneGeometry(0.235, 0.165), M.slate, 0, 0, 0, O.flap); flp.rotation.x = -Math.PI / 2; T.flapMirror = ctex(512, 360, () => {}); const fx = mesh(new THREE.PlaneGeometry(0.235, 0.165), std({ map: T.flapMirror, transparent: true, roughness: 0.9 }), 0, 0.0006, 0, O.flap); fx.rotation.x = -Math.PI / 2;
  // tambourine and bell
  O.tamb = grp(0.22, TB.y + 0.004, 0.3, O.table); O.tamb.rotation.set(0.04, 0.3, 0); { const ring = new THREE.CylinderGeometry(0.1, 0.1, 0.045, 40, 1, true); mesh(ring, phys({ map: T.oak, roughness: 0.6, side: THREE.DoubleSide, clearcoat: 0.3 }), 0, 0.023, 0, O.tamb); const skin = mesh(new THREE.CircleGeometry(0.1, 40), std({ color: 0x8a7552, roughness: 0.85 }), 0, 0.045, 0, O.tamb); skin.rotation.x = -Math.PI / 2; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; for (const dy of [-0.004, 0.004]) cyl(0.012, 0.012, 0.002, M.brass, Math.cos(a) * 0.1, 0.023 + dy, Math.sin(a) * 0.1, O.tamb, 12).rotation.set(0, 0, Math.PI / 2); } const rb = tube([[0.09, 0.02, 0.03], [0.14, -0.005, 0.05], [0.2, -0.01, 0.02]], 0.004, std({ color: 0x7a1a2a }), O.tamb, 10, 4); }
  O.bell = grp(-0.05, TB.y + 0.004, -0.38, O.table); lathe([[0.001, 0.065], [0.012, 0.065], [0.02, 0.05], [0.028, 0.02], [0.038, 0.002], [0.04, 0], [0.036, 0.0], [0.024, 0.02], [0.016, 0.05], [0.001, 0.058]], M.brass, 0, 0, 0, O.bell, 24); lathe([[0.001, 0], [0.008, 0], [0.01, 0.03], [0.014, 0.06], [0.001, 0.075]], M.ebony, 0, 0.065, 0, O.bell, 12);
  // the programme card and Madame's note (an envelope propped against the candlestick)
  T.prog = ctex(360, 512, () => {}); O.prog = grp(0.38, TB.y + 0.005, 0.22, O.table); O.prog.rotation.y = -0.5; const pc = mesh(new THREE.PlaneGeometry(0.1, 0.14), std({ map: T.prog, roughness: 0.85 }), 0, 0, 0, O.prog); pc.rotation.x = -Math.PI / 2;
  T.env = ctex(512, 340, () => {}); O.note = grp(0.12, TB.y + 0.003, -0.13, O.table); O.note.rotation.y = -Math.PI / 2 + 0.25; const env = mesh(new THREE.PlaneGeometry(0.15, 0.1), std({ map: T.env, roughness: 0.85, side: THREE.DoubleSide }), 0, 0.048, 0.03, O.note); env.rotation.x = -0.35;
}
function balloonChair() {
  const c = grp(0, 0, 0);
  bev(0.44, 0.05, 0.4, M.mahog, 0, 0.44, 0.02, c, 0.012);
  const cush = bev(0.42, 0.06, 0.38, M.velvetG, 0, 0.49, 0.02, c, 0.028);
  for (const sx of [-1, 1]) {
    lathe([[0.001, 0], [0.016, 0], [0.02, 0.05], [0.016, 0.12], [0.024, 0.2], [0.018, 0.3], [0.022, 0.4], [0.022, 0.43], [0.001, 0.43]], M.mahog, sx * 0.19, 0, 0.19, c, 14);
    tube([[sx * 0.19, 0, -0.2], [sx * 0.19, 0.2, -0.18], [sx * 0.19, 0.43, -0.17], [sx * 0.18, 0.62, -0.2], [sx * 0.16, 0.8, -0.24]], 0.017, M.mahog, c, 16, 8);
  }
  // the balloon back
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, a = Math.PI * (1 - t); pts.push([Math.cos(a) * 0.17, 0.8 + Math.sin(a) * 0.14 - (1 - Math.sin(a)) * 0.02, -0.24 + Math.sin(a) * -0.01]); }
  tube(pts, 0.017, M.mahog, c, 40, 8);
  tube([[-0.165, 0.66, -0.21], [0, 0.63, -0.23], [0.165, 0.66, -0.21]], 0.014, M.mahog, c, 16, 8);
  return c;
}
function madameChair() {
  const c = grp(0, 0, 0);
  bev(0.56, 0.06, 0.5, M.mahog, 0, 0.45, 0.02, c, 0.014);
  bev(0.52, 0.08, 0.46, M.velvet, 0, 0.51, 0.02, c, 0.035);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe([[0.001, 0], [0.02, 0], [0.026, 0.06], [0.02, 0.14], [0.03, 0.25], [0.022, 0.36], [0.028, 0.42], [0.001, 0.43]], M.mahog, sx * 0.24, 0, sz * 0.22, c, 14);
  // tall carved back with a velvet panel and a crest
  for (const sx of [-1, 1]) { bev(0.06, 1.0, 0.06, M.mahog, sx * 0.25, 0.96, -0.23, c, 0.012); lathe([[0.001, 0], [0.035, 0], [0.04, 0.04], [0.02, 0.08], [0.028, 0.1], [0.001, 0.14]], M.mahog, sx * 0.25, 1.46, -0.23, c, 16); }
  bev(0.44, 0.7, 0.03, M.velvet, 0, 0.95, -0.235, c, 0.012);
  bev(0.56, 0.14, 0.05, M.mahog, 0, 1.38, -0.23, c, 0.012);
  const crest = new THREE.Shape(); crest.moveTo(-0.24, 0); crest.bezierCurveTo(-0.2, 0.1, -0.06, 0.06, 0, 0.16); crest.bezierCurveTo(0.06, 0.06, 0.2, 0.1, 0.24, 0); crest.lineTo(-0.24, 0);
  const cg = new THREE.ExtrudeGeometry(crest, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }); mesh(cg, M.mahog, 0, 1.44, -0.245, c);
  // arms
  for (const sx of [-1, 1]) { tube([[sx * 0.27, 0.5, 0.2], [sx * 0.28, 0.68, 0.16], [sx * 0.28, 0.7, -0.05], [sx * 0.26, 0.72, -0.22]], 0.022, M.mahog, c, 16, 8); }
  // the pedal under the seat (hidden by the fringe until you look)
  O.pedal = grp(0.12, 0.05, 0.12, c); bev(0.08, 0.012, 0.12, M.brass, 0, 0, 0, O.pedal, 0.003); cyl(0.008, 0.008, 0.03, M.brass, 0, -0.02, -0.05, O.pedal, 8);
  const fb = std({ color: 0x6a4a1a, roughness: 0.85, side: THREE.DoubleSide, alphaMap: ctex(256, 32, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 2, h - rand(0, 5)); g.fillRect(0, 0, w, 5); }, { linear: true, repeat: [4, 1] }), alphaTest: 0.5 });
  for (const [x, z, ry, w] of [[0, 0.275, 0, 0.56], [0.285, 0.02, Math.PI / 2, 0.5], [-0.285, 0.02, Math.PI / 2, 0.5]]) { const f = plane(w, 0.1, fb, x, 0.38, z, ry, c); }
  return c;
}

/* ---------------- the spirit cabinet ---------------- */
function buildCabinet() {
  const cz = (CAB.z0 + CAB.z1) / 2, wz = CAB.z1 - CAB.z0, dx = CAB.x1 - CAB.x0;
  O.cab = grp(CAB.x0, 0, cz);
  // carcass: sides, top, plinth, back, floor — open to the room (+x)
  for (const sz of [-1, 1]) bev(dx, 2.3, 0.05, M.ebony, dx / 2, 1.15, sz * (wz / 2 - 0.025), O.cab, 0.008);
  bev(dx + 0.06, 0.08, wz + 0.08, M.ebony, dx / 2 + 0.02, 2.34, 0, O.cab, 0.015);
  bev(dx + 0.1, 0.06, wz + 0.14, M.ebony, dx / 2 + 0.04, 2.41, 0, O.cab, 0.02);
  bev(dx, 0.1, wz, M.ebony, dx / 2, 0.05, 0, O.cab, 0.01);
  const inside = std({ color: 0x0d0907, roughness: 0.9 });
  bev(0.04, 2.2, wz - 0.1, inside, 0.04, 1.2, 0, O.cab, 0.004);
  // the front frame: pilasters with carved roses, a frieze on top
  for (const sz of [-1, 1]) { bev(0.06, 2.24, 0.12, M.ebony, dx - 0.03, 1.2, sz * (wz / 2 - 0.06), O.cab, 0.01); }
  bev(0.07, 0.2, wz, M.ebony, dx - 0.03, 2.22, 0, O.cab, 0.01);
  O.roses = [];
  const roseGeo = () => { const g = grp(0, 0, 0); lathe([[0.001, 0.02], [0.02, 0.018], [0.03, 0.01], [0.034, 0], [0.001, 0]], M.ebony, 0, 0, 0, g, 20).rotation.z = -Math.PI / 2; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; const p = mesh(new THREE.SphereGeometry(0.014, 8, 6), M.ebony, 0.012, Math.cos(a) * 0.022, Math.sin(a) * 0.022, g); p.scale.set(0.6, 1, 1); } return g; };
  // roses numbered 1-6: left pilaster top to bottom (1-3), right pilaster top to bottom (4-6), as seen from the room
  const RY = [1.95, 1.55, 1.15];
  for (const [side, sz] of [[0, 1], [1, -1]]) for (let r = 0; r < 3; r++) {
    const g = roseGeo(); g.position.set(dx + 0.005, RY[r], sz * (wz / 2 - 0.06)); O.cab.add(g); O.roses.push(g); g.userData.base = g.position.x;
  }
  // luminous marks, invisible until charged by strong light: numbers by four roses, a hand on the frieze
  O.lum = [];
  const ORDER = { 1: 5, 2: 1, 3: 6, 4: 3 };   // glowing number n sits by rose ORDER[n] (1-based)
  for (const n in ORDER) { const rose = O.roses[ORDER[n] - 1]; const m = plane(0.07, 0.07, M.lum.clone(), dx + 0.041, rose.position.y + 0.075, rose.position.z, Math.PI / 2, O.cab); m.material.map = T.glowNums[n]; m.material.alphaMap = null; O.lum.push(m); layer1(m); }
  { const m = plane(0.22, 0.22, M.lum.clone(), dx + 0.07, 2.2, 0.0, Math.PI / 2, O.cab); m.material.map = T.glowHand; O.lum.push(m); layer1(m); }
  // curtain rod and velvet curtains, drawn back to each side
  cyl(0.012, 0.012, wz - 0.1, M.brass, dx - 0.07, 2.08, 0, O.cab, 10).rotation.x = Math.PI / 2;
  for (const sz of [-1, 1]) {
    const cg = drapeGeo(0.36, 2.0, 5, 0.03); const cur = mesh(cg, M.velvet, dx - 0.08, 1.07, sz * (wz / 2 - 0.26), O.cab); cur.rotation.y = Math.PI / 2; cur.material = M.velvet;
    const tie = mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20), M.gilt, dx - 0.08, 1.1, sz * (wz / 2 - 0.26), O.cab); tie.rotation.y = Math.PI / 2; tie.scale.set(1, 0.35, 1);
  }
  // inside: a coil of rope and a stool
  for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(0.1 - k * 0.012, 0.008, 6, 24), std({ color: 0x8a7650, roughness: 1 }), 0.6, 0.12 + k * 0.012, 0.36, O.cab).rotation.x = Math.PI / 2;
  const st = grp(0.55, 0, -0.1, O.cab); bev(0.3, 0.03, 0.3, M.oak, 0, 0.45, 0, st, 0.006); for (const [x, z] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) cyl(0.013, 0.013, 0.45, M.oak, x, 0.225, z, st, 8);
  // the false back: a panel 30cm in from the real back, hinged at one side; the phonograph lives behind it
  O.backPanel = grp(0.31, 0, -wz / 2 + 0.06, O.cab); bev(0.02, 2.0, wz - 0.12, inside, 0, 1.12, (wz - 0.12) / 2, O.backPanel, 0.004);
  O.cavity = grp(0, 0, 0, O.cab); bev(0.28, 0.025, wz - 0.12, M.oak, 0.17, 0.8, 0, O.cavity, 0.004);
  O.phono = grp(0.15, 0.8125, 0.0, O.cavity); O.phono.rotation.y = Math.PI / 2; buildPhonograph(O.phono);
}
function buildPhonograph(g) {
  bev(0.3, 0.14, 0.2, M.mahog, 0, 0.07, 0, g, 0.01);
  bev(0.31, 0.02, 0.21, M.mahog, 0, 0.145, 0, g, 0.006);
  // mandrel and the brown wax cylinder
  cyl(0.028, 0.028, 0.16, M.brass, 0, 0.2, 0, g, 20).rotation.x = Math.PI / 2;
  O.cyl = cyl(0.031, 0.031, 0.105, std({ color: 0x5a3a1c, roughness: 0.35 }), 0, 0.2, 0.01, g, 24); O.cyl.rotation.x = Math.PI / 2;
  for (const z of [-0.09, 0.09]) bev(0.02, 0.07, 0.012, M.brass, 0, 0.18, z, g, 0.003);
  // reproducer and the horn
  bev(0.03, 0.02, 0.24, M.brass, -0.05, 0.25, 0, g, 0.004);
  O.horn = grp(-0.06, 0.26, 0.0, g); const hp = []; for (let i = 0; i <= 12; i++) { const t = i / 12; hp.push([0.008 + Math.pow(t, 3.2) * 0.12, t * 0.3]); }
  const horn = lathe(hp, std({ color: 0x14100c, roughness: 0.35, metalness: 0.3, side: THREE.DoubleSide }), 0, 0, 0, O.horn, 32); O.horn.rotation.set(0, 0, 0.5);
  mesh(new THREE.TorusGeometry(0.122, 0.005, 6, 32), M.brass, 0, 0.3, 0, O.horn).rotation.x = Math.PI / 2;
  // the speed lever on the front, and the crank socket on the side
  O.lever = grp(0.1, 0.1, 0.101, g); bev(0.012, 0.05, 0.008, M.brass, 0, 0.02, 0, O.lever, 0.002);
  T.speed = ctex(128, 64, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1208'; c.font = `bold 16px ${FELL}`; c.textAlign = 'center'; c.fillText('SLOW', 22, 58); c.fillText('FAST', 106, 58); c.fillText('·', 64, 50); c.font = `11px ${FELL}`; c.fillText('SPEED', 64, 14); c.fillStyle = '#2a2a6a'; c.font = `italic 18px ${CORM}`; c.fillText('L.', 112, 30); });
  plane(0.07, 0.035, std({ map: T.speed, roughness: 0.7 }), 0.1, 0.07, 0.1005, 0, g);
  O.crankSock = cyl(0.01, 0.01, 0.02, M.brass, 0.155, 0.08, 0, g, 10); O.crankSock.rotation.z = Math.PI / 2;
  O.crankOn = grp(0.17, 0.08, 0, g); bev(0.012, 0.012, 0.09, M.brass, 0, 0, 0.04, O.crankOn, 0.003); cyl(0.01, 0.01, 0.04, M.ebony, 0.02, 0, 0.085, O.crankOn, 10).rotation.z = Math.PI / 2; O.crankOn.visible = false;
}

/* ---------------- bureau, bookcase, camera, door, window ---------------- */
function buildFurniture() {
  // the bureau (fall-front) in the right-hand alcove
  O.bureau = grp(1.85, 0, -D + 0.28);
  bev(1.05, 0.78, 0.52, M.mahog, 0, 0.42, 0, O.bureau, 0.01);
  for (let k = 0; k < 3; k++) { bev(0.95, 0.2, 0.02, M.mahog, 0, 0.15 + k * 0.24, 0.265, O.bureau, 0.008); for (const sx of [-1, 1]) lathe([[0.001, 0], [0.018, 0], [0.018, 0.006], [0.008, 0.01], [0.012, 0.02], [0.001, 0.022]], M.brass, sx * 0.26, 0.15 + k * 0.24, 0.275, O.bureau, 12).rotation.x = Math.PI / 2; }
  bev(1.07, 0.03, 0.54, M.mahog, 0, 0.825, 0, O.bureau, 0.008);
  // the sloped upper part: sides and a fall-front hinged at the bottom
  const side = new THREE.Shape(); side.moveTo(0, 0); side.lineTo(0.5, 0); side.lineTo(0.5, 0.4); side.lineTo(0.18, 0.4); side.lineTo(0, 0.02); side.lineTo(0, 0);
  for (const sx of [-1, 1]) { const g = new THREE.ExtrudeGeometry(side, { depth: 0.02, bevelEnabled: false }); const m = mesh(g, M.mahog, sx * 0.51 - 0.01, 0.84, 0.25, O.bureau); m.rotation.y = Math.PI / 2; }
  bev(1.04, 0.4, 0.02, M.mahog, 0, 1.04, -0.25, O.bureau, 0.004); bev(1.04, 0.02, 0.33, M.mahog, 0, 1.245, -0.08, O.bureau, 0.004);
  // pigeonholes and papers inside (seen when open)
  O.bInside = grp(0, 0.86, -0.1, O.bureau);
  for (let k = 0; k < 6; k++) bev(0.012, 0.22, 0.2, M.oak, -0.45 + k * 0.18, 0.12, -0.02, O.bInside, 0.002);
  bev(0.94, 0.012, 0.2, M.oak, 0, 0.22, -0.02, O.bInside, 0.002);
  for (let k = 0; k < 5; k++) { const p = bev(0.14, rand(0.1, 0.16), 0.004, M.paper, -0.36 + k * 0.18, 0.08, -0.04, O.bInside, 0.001); p.rotation.x = -0.1; }
  O.blueBook = grp(-0.2, 0.012, 0.12, O.bInside); bev(0.16, 0.025, 0.22, std({ color: 0x1c2a4a, roughness: 0.8 }), 0, 0, 0, O.blueBook, 0.004); O.blueBook.rotation.y = 0.2;
  O.rodIn = grp(0.1, 0.02, 0.17, O.bInside); cyl(0.008, 0.008, 0.6, std({ color: 0x0c0c0c, roughness: 0.5, metalness: 0.4 }), 0, 0, 0, O.rodIn, 8).rotation.z = Math.PI / 2; tube([[0.3, 0, 0], [0.33, 0.01, 0], [0.34, 0.03, 0], [0.33, 0.045, 0]], 0.004, M.brass, O.rodIn, 8, 4); tube([[-0.2, 0, 0], [-0.25, -0.01, 0.03], [-0.3, -0.005, 0.05]], 0.006, std({ color: 0x7a1a2a }), O.rodIn, 8, 4);
  O.fall = grp(0, 0.855, 0.25, O.bureau); const ff = bev(1.0, 0.42, 0.022, M.mahog, 0, 0.2, 0, O.fall, 0.006); O.fall.rotation.x = -0.46;
  // brass letter lock on the fall-front: five rings
  O.letterLock = grp(0, 0.3, 0.014, O.fall); bev(0.14, 0.045, 0.006, M.brass, 0, 0, 0, O.letterLock, 0.002); for (let k = 0; k < 5; k++) cyl(0.011, 0.011, 0.018, M.brass, -0.048 + k * 0.024, 0, 0.008, O.letterLock, 12).rotation.z = Math.PI / 2;
  // a gas lamp? no: a brass inkstand and a letter rack on top
  bev(0.2, 0.02, 0.12, M.brass, -0.3, 1.265, -0.1, O.bureau, 0.004); lathe([[0.001, 0], [0.025, 0], [0.025, 0.04], [0.012, 0.05], [0.001, 0.055]], M.glass, -0.34, 1.275, -0.1, O.bureau, 12);

  // bookcase in the left-hand alcove, with the tin of luminous paint on a shelf
  O.books = grp(-1.8, 0, -D + 0.2);
  for (const sx of [-1, 1]) bev(0.03, 2.1, 0.36, M.mahog, sx * 0.6, 1.05, 0, O.books, 0.006);
  bev(1.26, 0.04, 0.38, M.mahog, 0, 2.12, 0.01, O.books, 0.01); bev(1.2, 0.012, 0.36, M.mahog, 0, 1.05, -0.17, O.books, 0.002);
  for (const y of [0.1, 0.55, 0.98, 1.4, 1.8]) { bev(1.17, 0.025, 0.34, M.mahog, 0, y, 0, O.books, 0.004); if (y < 1.8) { const bw = rand(0.8, 1.05); const b = mesh(uvScale(tiledBoxGeo(bw, 0.24, 0.22, 1), 1, 1), M.books, -0.57 + bw / 2 + rand(0, 0.08), y + 0.14, 0.04, O.books); const uv = b.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * bw * 0.9 + y, uv.getY(i)); } }
  O.tin = grp(0.42, 1.425, 0.08, O.books); cyl(0.045, 0.045, 0.07, std({ map: ctex(256, 64, (g, w, h) => { g.fillStyle = '#1d3b2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8dcb8'; g.fillRect(0, 14, w, 36); g.fillStyle = '#1d1a14'; g.font = `bold 15px ${FELL}`; g.textAlign = 'center'; g.fillText("BALMAIN'S LUMINOUS PAINT", w / 2, 36); }), metalness: 0.4, roughness: 0.5 }), 0, 0.035, 0, O.tin, 24); lathe([[0.001, 0], [0.047, 0], [0.047, 0.006], [0.001, 0.006]], M.brass, 0, 0.07, 0, O.tin, 24);
  const brush = grp(0.08, 0.005, 0.02, O.tin); cyl(0.005, 0.004, 0.14, M.oak, 0, 0.006, 0, brush, 6).rotation.z = Math.PI / 2; brush.rotation.y = 0.5;

  // the camera on its tripod, pointed at the table (and the door beyond)
  O.cam = grp(POS.camera.x, 0, POS.camera.z); O.cam.rotation.y = Math.PI / 2 + 0.06;
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5; const l = tube([[0, 1.25, 0], [Math.cos(a) * 0.18, 0.62, Math.sin(a) * 0.18], [Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34]], 0.016, M.oak, O.cam, 12, 6); }
  bev(0.16, 0.03, 0.16, M.oak, 0, 1.27, 0, O.cam, 0.006);
  O.camBox = grp(0, 1.4, 0, O.cam);
  bev(0.22, 0.24, 0.2, M.mahog, 0, 0, 0.08, O.camBox, 0.008); for (const y of [-0.1, 0.1]) bev(0.225, 0.012, 0.205, M.brass, 0, y, 0.08, O.camBox, 0.002);
  for (let k = 0; k < 7; k++) { const s = 0.2 - k * 0.012; bev(s, s, 0.03, std({ color: 0x100c0a, roughness: 0.55 }), 0, 0, -0.02 - k * 0.028, O.camBox, 0.006); }
  bev(0.16, 0.16, 0.02, M.mahog, 0, 0, -0.22, O.camBox, 0.004);
  const lens = cyl(0.045, 0.05, 0.1, M.brass, 0, 0, -0.28, O.camBox, 24); lens.rotation.x = Math.PI / 2;
  const cloth = mesh(drapeGeo(0.3, 0.42, 3, 0.02), phys({ color: 0x080808, roughness: 1, sheen: 0.6, sheenColor: new THREE.Color(0x333333), side: THREE.DoubleSide }), 0, -0.08, 0.19, O.camBox);
  // flash lamp (a magnesium tray on a stick)
  O.flashT = grp(0.14, 0.2, -0.1, O.camBox); bev(0.1, 0.008, 0.04, M.brass, 0, 0, 0, O.flashT, 0.002); cyl(0.004, 0.004, 0.14, M.brass, -0.04, -0.07, 0, O.flashT, 6);
  // the plate box on a small table beside it
  O.pTable = grp(POS.plates.x, 0, POS.plates.z);
  lathe([[0.001, 0], [0.16, 0], [0.16, 0.02], [0.03, 0.05], [0.02, 0.3], [0.035, 0.5], [0.02, 0.62], [0.03, 0.66], [0.001, 0.67]], M.mahog, 0, 0, 0, O.pTable, 20);
  mesh(discGeo(0.26, 0.025, 0.008), M.mahog, 0, 0.67, 0, O.pTable);
  O.plateBox = grp(0, 0.695, 0, O.pTable); O.plateBox.rotation.y = 0.4; bev(0.26, 0.09, 0.2, M.oak, 0, 0.045, 0, O.plateBox, 0.006); O.plateLid = grp(0, 0.09, -0.1, O.plateBox); bev(0.27, 0.015, 0.21, M.oak, 0, 0.007, 0.1, O.plateLid, 0.004);
  plane(0.16, 0.05, std({ map: ctex(256, 80, (g, w, h) => { g.fillStyle = '#e4d8b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a140c'; g.font = `bold 20px ${FELL}`; g.textAlign = 'center'; g.fillText('DRY PLATES', w / 2, 32); g.font = `italic 17px ${CORM}`; g.fillText('open only in the dark', w / 2, 60); }), roughness: 0.8 }), 0, 0.05, 0.101, 0, O.plateBox);

  // the door (west wall): four panels, brass knob, a keyhole with the key in it on the far side
  const dz0 = DOOR.z - DOOR.w / 2, dz1 = DOOR.z + DOOR.w / 2;
  const arch = mesh(frameGeo(DOOR.w + 0.2, DOOR.h + 0.1, DOOR.w, DOOR.h + 0.02, 0.03, 0.012), M.mahog, 0, 0, 0); arch.position.set(-W + 0.001, DOOR.h / 2 + 0.04, DOOR.z); arch.rotation.y = Math.PI / 2;
  for (const z of [dz0, dz1]) { const j = bev(0.2, DOOR.h, 0.04, M.plaster, -W - 0.1, DOOR.h / 2, z + (z === dz0 ? -0.02 : 0.02)); }
  bev(0.2, 0.04, DOOR.w, M.plaster, -W - 0.1, DOOR.h + 0.02, DOOR.z);
  O.doorPivot = grp(-W - 0.03, 0, dz1); O.door = grp(0, 0, 0, O.doorPivot);
  bev(0.045, DOOR.h - 0.01, DOOR.w - 0.01, M.mahog, 0, DOOR.h / 2, -DOOR.w / 2, O.door, 0.006);
  for (const [y, h] of [[0.5, 0.62], [1.45, 0.95]]) for (const z of [-0.26, -0.69]) { mesh(frameGeo(0.36, h, 0.3, h - 0.06, 0.02, 0.008), M.mahog, 0.024, y, z, O.door).rotation.y = Math.PI / 2; bev(0.012, h - 0.1, 0.26, M.mahog, 0.022, y, z, O.door, 0.004); }
  O.knob = grp(0.04, 1.0, -DOOR.w + 0.09, O.door); lathe([[0.001, 0], [0.025, 0], [0.028, 0.006], [0.01, 0.012], [0.01, 0.03], [0.028, 0.04], [0.03, 0.055], [0.02, 0.068], [0.001, 0.07]], M.brass, 0, 0, 0, O.knob, 24).rotation.z = -Math.PI / 2;
  O.escut = grp(0.028, 0.88, -DOOR.w + 0.09, O.door); { const s = new THREE.Shape(); s.absellipse(0, 0, 0.022, 0.04, 0, TAU); const kh = new THREE.Path(); kh.absarc(0, 0.008, 0.006, 0, TAU); s.holes.push(kh); const eg = new THREE.ExtrudeGeometry(s, { depth: 0.003, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 2 }); const e = mesh(eg, M.brass, 0, 0, 0, O.escut); e.rotation.y = Math.PI / 2; const hole = bev(0.004, 0.02, 0.005, M.black, 0.001, -0.006, 0, O.escut, 0.001); const kh2 = mesh(new THREE.CircleGeometry(0.006, 12), M.black, 0.0035, 0.008, 0, O.escut); kh2.rotation.y = Math.PI / 2; }
  bev(0.004, 0.3, 0.07, M.brass, 0.026, 1.25, -DOOR.w + 0.09, O.door, 0.002);
  // the key on the far side, and the newspaper you slide under the door
  O.keyOut = grp(-0.04, 0.888, -DOOR.w + 0.09, O.door); lathe([[0.001, 0], [0.004, 0], [0.004, 0.05], [0.001, 0.05]], M.iron, 0, 0, 0, O.keyOut, 8).rotation.z = Math.PI / 2; mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 16), M.iron, -0.06, 0, 0, O.keyOut).rotation.y = Math.PI / 2;
  O.paperIn = grp(-W + 0.02, 0.002, DOOR.z - 0.1); { const pp = mesh(new THREE.PlaneGeometry(0.42, 0.58), std({ map: ctex(256, 350, (g, w, h) => { g.fillStyle = '#d9d0ba'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(30,25,15,0.55)'; for (let c = 0; c < 4; c++) for (let y = 20; y < h - 10; y += 5) g.fillRect(10 + c * 60, y, rand(30, 54), 2); }), roughness: 0.9, side: THREE.DoubleSide }), 0, 0, 0, O.paperIn); pp.rotation.x = -Math.PI / 2; } O.paperIn.visible = false;
  O.keyOnPaper = grp(-W - 0.02, 0.006, DOOR.z - 0.06); lathe([[0.001, 0], [0.004, 0], [0.004, 0.05], [0.001, 0.05]], M.iron, 0, 0, 0, O.keyOnPaper, 8).rotation.z = Math.PI / 2; mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 16), M.iron, -0.06, 0, 0, O.keyOnPaper).rotation.x = Math.PI / 2; O.keyOnPaper.visible = false;
  // the hall beyond: dark, a stair rail, faint light from a fanlight
  const hf = mesh(new THREE.PlaneGeometry(2.4, 2.4), M.floor, -W - 1.3, 0.001, DOOR.z); hf.rotation.x = -Math.PI / 2;
  for (const [x, z, ry, w] of [[-W - 1.3, DOOR.z - 1.2, 0, 2.4], [-W - 1.3, DOOR.z + 1.2, Math.PI, 2.4], [-W - 2.5, DOOR.z, Math.PI / 2, 2.4]]) plane(w, H, M.wall, x, H / 2, z, ry);
  const hc = mesh(new THREE.PlaneGeometry(2.4, 2.4), M.plaster, -W - 1.3, H, DOOR.z); hc.rotation.x = Math.PI / 2;
  // the gas tap by the door: a brass pipe down the wall and a lever tap
  O.tap = grp(-W + 0.03, 1.45, 0.45);
  cyl(0.01, 0.01, H - 1.45, M.brass, 0, (H - 1.45) / 2, 0, O.tap, 8);
  lathe([[0.001, 0], [0.022, 0], [0.022, 0.06], [0.001, 0.06]], M.brass, 0, -0.03, 0, O.tap, 14);
  O.tapLever = grp(0.03, 0, 0, O.tap); bev(0.012, 0.012, 0.12, M.brass, 0, 0, 0.045, O.tapLever, 0.003); lathe([[0.001, 0], [0.012, 0], [0.012, 0.012], [0.001, 0.014]], M.ebony, 0, 0, 0.1, O.tapLever, 10).rotation.x = Math.PI / 2;
  plane(0.07, 0.035, std({ map: ctex(128, 64, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#1a1a1a'; g.font = `bold 30px ${FELL}`; g.textAlign = 'center'; g.fillText('GAS', w / 2, 44); }), roughness: 0.3, metalness: 0.2 }), -W + 0.005, 1.56, 0.45, Math.PI / 2);

  // window (east): sash, rain outside, heavy drapes nearly closed, a pelmet
  const wz0 = -1.0, wz1 = 0.4, wy0 = 0.85, wy1 = 2.65, wzc = (wz0 + wz1) / 2;
  plane(wz1 - wz0, wy1 - wy0, M.night, W + 0.12, (wy0 + wy1) / 2, wzc, -Math.PI / 2);
  for (const z of [wz0, wz1]) bev(0.14, wy1 - wy0, 0.03, M.plaster, W + 0.06, (wy0 + wy1) / 2, z + (z === wz0 ? 0.015 : -0.015));
  bev(0.14, 0.03, wz1 - wz0, M.plaster, W + 0.06, wy1, wzc); bev(0.22, 0.04, wz1 - wz0 + 0.1, M.plaster, W - 0.02, wy0 - 0.02, wzc, scene, 0.01);
  const sash = std({ color: 0xe0d8c8, roughness: 0.5 });
  for (const y of [wy0 + 0.03, (wy0 + wy1) / 2, wy1 - 0.03]) bev(0.04, 0.05, wz1 - wz0, sash, W + 0.08, y, wzc, scene, 0.006);
  for (const z of [wz0 + 0.02, wzc, wz1 - 0.02]) bev(0.04, wy1 - wy0, 0.04, sash, W + 0.08, (wy0 + wy1) / 2, z, scene, 0.006);
  const glass = plane(wz1 - wz0, wy1 - wy0, M.glass, W + 0.09, (wy0 + wy1) / 2, wzc, -Math.PI / 2); layer1(glass);
  cyl(0.018, 0.018, 2.0, M.brass, W - 0.1, 2.78, wzc, scene, 10).rotation.x = Math.PI / 2;
  for (const [zc, wd] of [[-0.74, 0.76], [0.14, 0.76]]) { const dg = drapeGeo(wd, 2.74, 7, 0.05); const dr = mesh(dg, M.velvet, W - 0.1, 1.39, zc); dr.rotation.y = -Math.PI / 2; }
  O.pelmet = bev(0.08, 0.26, 1.9, M.mahog, W - 0.06, 2.9, wzc, scene, 0.01);
  const pf = mesh(new THREE.PlaneGeometry(1.9, 0.08), std({ color: 0x7a5a24, roughness: 0.85, side: THREE.DoubleSide, alphaMap: ctex(256, 32, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 2, h - rand(0, 6)); g.fillRect(0, 0, w, 5); }, { linear: true, repeat: [8, 1] }), alphaTest: 0.5 }), W - 0.105, 2.73, wzc); pf.rotation.y = -Math.PI / 2;

  // south wall: a chaise, a side table with the newspaper and an aspidistra, the spirit photograph
  O.sofa = grp(0.1, 0, D - 0.36);
  bev(1.6, 0.26, 0.6, M.mahog, 0, 0.3, 0, O.sofa, 0.02); bev(1.54, 0.12, 0.56, M.velvetG, 0, 0.47, 0.02, O.sofa, 0.05);
  const sb = new THREE.Shape(); sb.moveTo(-0.8, 0); sb.lineTo(0.8, 0); sb.lineTo(0.8, 0.3); sb.bezierCurveTo(0.5, 0.38, 0.2, 0.5, -0.2, 0.52); sb.bezierCurveTo(-0.5, 0.55, -0.75, 0.62, -0.8, 0.7); sb.lineTo(-0.8, 0);
  const sbg = new THREE.ExtrudeGeometry(sb, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 16 }); const back = mesh(sbg, M.velvetG, 0, 0.45, 0.14, O.sofa); back.rotation.y = Math.PI;
  for (const x of [-0.72, 0.72]) for (const z of [-0.24, 0.24]) lathe([[0.001, 0], [0.025, 0], [0.03, 0.08], [0.02, 0.17], [0.001, 0.17]], M.mahog, x, 0, z, O.sofa, 12);
  O.sideT = grp(1.95, 0, D - 0.4);
  lathe([[0.001, 0], [0.2, 0], [0.2, 0.02], [0.04, 0.05], [0.03, 0.35], [0.05, 0.55], [0.03, 0.7], [0.001, 0.72]], M.mahog, 0, 0, 0, O.sideT, 20); mesh(discGeo(0.3, 0.025, 0.008), M.mahog, 0, 0.72, 0, O.sideT);
  O.paper = grp(-0.08, 0.747, 0.05, O.sideT); O.paper.rotation.y = 0.5; T.times = ctex(512, 360, () => {}); const np = mesh(new THREE.PlaneGeometry(0.28, 0.2), std({ map: T.times, roughness: 0.9 }), 0, 0.002, 0, O.paper); np.rotation.x = -Math.PI / 2; bev(0.28, 0.006, 0.2, M.paper, 0, -0.002, 0, O.paper, 0.001);
  // aspidistra in a glazed pot
  const pot = grp(0.12, 0.745, -0.1, O.sideT); lathe([[0.001, 0], [0.07, 0], [0.09, 0.08], [0.1, 0.16], [0.105, 0.17], [0.001, 0.17]], M.pot, 0, 0, 0, pot, 24);
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + rand(-0.2, 0.2), l = rand(0.35, 0.55), tilt = rand(0.3, 0.8); const lg = new THREE.PlaneGeometry(0.07, l, 1, 6); const lp = lg.attributes.position; for (let i = 0; i < lp.count; i++) { const y = lp.getY(i) + l / 2, t = y / l; lp.setX(i, lp.getX(i) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05))); lp.setZ(i, t * t * 0.18); lp.setY(i, y); } lg.computeVertexNormals(); const lf = mesh(lg, M.leaf, 0, 0.16, 0, pot); lf.rotation.set(-tilt, a, 0, 'YXZ'); }
  // pictures on the south wall: the spirit photograph over the chaise, Madame and Lily either side
  T.spiritPhoto = ctex(512, 380, () => {}); T.portraitM = ctex(256, 340, () => {}); T.portraitL = ctex(256, 340, () => {});
  const pic = (w, h, tx, x, y, fmat = M.gilt) => { const g = grp(x, y, D - 0.02); g.rotation.y = Math.PI; mesh(frameGeo(w + 0.12, h + 0.12, w, h, 0.035, 0.012), fmat, 0, 0, 0, g); mesh(new THREE.PlaneGeometry(w + 0.02, h + 0.02), std({ color: 0xd8ccb0, roughness: 0.9 }), 0, 0, 0.004, g); mesh(new THREE.PlaneGeometry(w, h), std({ map: tx, roughness: 0.6 }), 0, 0, 0.006, g); return g; };
  O.photoFrame = pic(0.5, 0.37, T.spiritPhoto, 0.1, 1.72);
  O.madamePic = pic(0.24, 0.32, T.portraitM, -1.6, 1.72, M.ebony); O.lilyPic = pic(0.24, 0.32, T.portraitL, 1.85, 1.72, M.ebony);
  // wall gas brackets either side of the chaise
  O.sconces = [];
  for (const x of [-0.85, 1.05]) { const g = grp(x, 1.9, D); g.rotation.y = Math.PI; lathe([[0.001, 0], [0.05, 0], [0.05, 0.01], [0.001, 0.02]], M.brass, 0, 0, 0, g, 16).rotation.x = Math.PI / 2; tube([[0, 0, 0.01], [0, -0.05, 0.12], [0, 0.02, 0.22], [0, 0.08, 0.24]], 0.009, M.brass, g, 16, 6); const gb = lathe([[0.016, 0], [0.036, 0.025], [0.048, 0.065], [0.042, 0.1], [0.036, 0.11]], M.globe.clone(), 0, 0.08, 0.24, g, 24); layer1(gb); const f = new THREE.Sprite(M.flameS.clone()); f.scale.set(0.02, 0.035, 1); f.position.set(0, 0.11, 0.24); layer1(f); g.add(f); O.sconces.push({ g, gb, f }); }
}

/* ---------------- the gasolier ---------------- */
function buildGasolier() {
  O.gasolier = grp(TB.x, 0, TB.z);
  cyl(0.012, 0.012, H - 2.36, M.brass, 0, (H + 2.36) / 2, 0, O.gasolier, 10);
  lathe([[0.001, 0], [0.05, 0.01], [0.07, 0.05], [0.05, 0.1], [0.02, 0.14], [0.03, 0.18], [0.001, 0.2]], M.brass, 0, 2.2, 0, O.gasolier, 24);
  lathe([[0.001, 0], [0.03, 0], [0.012, 0.04], [0.001, 0.05]], M.brass, 0, 2.15, 0, O.gasolier, 16);
  O.globes = []; O.gasFlames = [];
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * TAU + 0.5, ex = Math.cos(a) * 0.42, ez = Math.sin(a) * 0.42;
    tube([[Math.cos(a) * 0.05, 2.28, Math.sin(a) * 0.05], [Math.cos(a) * 0.2, 2.2, Math.sin(a) * 0.2], [Math.cos(a) * 0.34, 2.18, Math.sin(a) * 0.34], [ex, 2.24, ez]], 0.011, M.brass, O.gasolier, 24, 8);
    lathe([[0.001, 0], [0.02, 0], [0.026, 0.02], [0.014, 0.035], [0.001, 0.036]], M.brass, ex, 2.23, ez, O.gasolier, 14);
    const gb = lathe([[0.025, 0], [0.06, 0.04], [0.085, 0.1], [0.08, 0.16], [0.065, 0.19], [0.07, 0.2]], M.globe.clone(), ex, 2.26, ez, O.gasolier, 28); layer1(gb); O.globes.push(gb);
    const f = new THREE.Sprite(M.flameS.clone()); f.scale.set(0.03, 0.05, 1); f.position.set(ex, 2.3, ez); layer1(f); O.gasolier.add(f); O.gasFlames.push(f);
  }
  O.gasolier.traverse(o => { o.userData.noShadow = true; });
}

/* ---------------- lights ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x3a3040, 0x1a120c, 0.06); scene.add(L.hemi);
  L.gas = new THREE.PointLight(0xffb070, 0, 0, 2); L.gas.position.set(TB.x, 2.12, TB.z); L.gas.castShadow = true;
  L.gas.shadow.mapSize.set(IS_TOUCH ? 512 : 1024, IS_TOUCH ? 512 : 1024); L.gas.shadow.bias = -0.002; L.gas.shadow.normalBias = 0.02; L.gas.shadow.camera.near = 0.05; L.gas.shadow.camera.far = 12; scene.add(L.gas);
  L.cand = new THREE.PointLight(0xff9a48, 0, 0, 2); L.cand.position.set(TB.x + 0.05, TB.y + 0.52, TB.z - 0.03); L.cand.castShadow = true;
  L.cand.shadow.mapSize.set(IS_TOUCH ? 256 : 512, IS_TOUCH ? 256 : 512); L.cand.shadow.bias = -0.003; L.cand.shadow.normalBias = 0.02; L.cand.shadow.camera.near = 0.03; L.cand.shadow.camera.far = 8; scene.add(L.cand);
  L.sconce = O.sconces.map(s => { const l = new THREE.PointLight(0xffb070, 0, 0, 2); s.g.localToWorld(l.position.set(0, 0.12, 0.24)); scene.add(l); return l; });
  // cold street light through the gap in the drapes
  L.street = new THREE.SpotLight(0x8aa4d0, 6, 0, 0.2, 0.7, 1.2); L.street.position.set(W + 3.0, 2.6, -0.3); L.street.castShadow = true; L.street.shadow.mapSize.set(512, 512); L.street.shadow.bias = -0.002; L.street.target.position.set(0.2, 0, 0.1); scene.add(L.street); scene.add(L.street.target);
  if (IS_TOUCH) { L.cand.castShadow = false; L.street.castShadow = false; }   // phones: one shadowed light
  L.lum = new THREE.PointLight(0x7dffb0, 0, 3, 2); L.lum.position.copy(POS.cab).add(new THREE.Vector3(0.4, 0.4, 0)); scene.add(L.lum);
  L.flash = new THREE.PointLight(0xf4f0ff, 0, 0, 2); L.flash.position.copy(POS.camera).add(new THREE.Vector3(-0.2, 0.3, 0)); scene.add(L.flash);
}

/* ---------------- the whole room ---------------- */
function buildRoom() {
  scene.fog = null;
  camera.far = 30; camera.near = 0.02; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.25, ao: 0.9, aoRad: 0.3, bloom: 0.55, bloomThr: 1.4, vig: 0.62, grain: 0.02, sat: 0.95 });
  buildShell(); buildFireplace(); buildTable(); buildCabinet(); buildFurniture(); buildGasolier(); buildLights();
  // everything casts and receives by default; glass, sprites and cloth edges don't cast
  scene.traverse(o => { if (o.isMesh) { o.receiveShadow = true; if (o.userData.noShadow || (o.material && (o.material.transparent || o.material === M.plaster || o.material === M.wall || o.material === M.wain || o.material === M.ceil))) o.castShadow = false; } });
  O.sconces.forEach(s => s.g.traverse(o => { o.castShadow = false; }));
  // collisions
  colliders.length = 0;
  const col = (x0, x1, z0, z1) => addCol('c', x0, x1, z0, z1);
  col(-W - 1, W + 1, -D - 1, -D + 0.02); col(-W - 1, W + 1, D - 0.02, D + 1); col(W - 0.02, W + 1, -D, D);
  O.colDoorWall = [col(-W - 1, -W + 0.02, -D, DOOR.z - DOOR.w / 2), col(-W - 1, -W + 0.02, DOOR.z + DOOR.w / 2, D)];
  O.colDoor = col(-W - 1, -W + 0.02, DOOR.z - DOOR.w / 2, DOOR.z + DOOR.w / 2);
  col(-1.0, 1.0, -D, -D + 0.62);                       // chimney breast + hearth
  col(TB.x - 0.66, TB.x + 0.66, TB.z - 0.66, TB.z + 0.66); // table
  col(-1.3, -0.72, TB.z - 0.3, TB.z + 0.3);            // Madame's chair
  col(CAB.x0, CAB.x1 + 0.02, CAB.z0, CAB.z1);          // cabinet
  col(1.3, 2.4, -D, -D + 0.62);                        // bureau
  col(-2.45, -1.15, -D, -D + 0.42);                    // bookcase
  col(POS.camera.x - 0.3, POS.camera.x + 0.3, POS.camera.z - 0.3, POS.camera.z + 0.3);
  col(POS.plates.x - 0.2, POS.plates.x + 0.3, POS.plates.z - 0.22, POS.plates.z + 0.22);
  col(-0.72, 0.92, D - 0.7, D);                        // chaise
  col(1.62, 2.28, D - 0.72, D);                        // side table
}


/* =====================================================================
   THE LAST SITTING · part C: items, documents, voices, hints, painted things
   ===================================================================== */
// the six wonders on tonight's programme, and how each one is really done
const WONDERS = [
  { id: 'raps', n: 'I', name: 'The Spirit Raps', how: 'A brass pedal under Madame\'s chair works a wooden clapper screwed under the table. One rap for yes, two for no, and her feet never seem to move.' },
  { id: 'slate', n: 'II', name: 'The Slate Writing', how: 'The message is chalked in advance on a loose flap of slate. When the two slates are opened, the flap drops into the bottom one, writing side up.' },
  { id: 'hand', n: 'III', name: 'The Luminous Hand', how: 'Balmain\'s luminous paint. It soaks up strong light and glows in the dark for a while afterwards. She turns the gas up full while the sitters take their seats.' },
  { id: 'voice', n: 'IV', name: 'The Voice of Little Lily', how: 'A phonograph behind the cabinet\'s false back. Madame recorded herself speaking slowly; played fast, her own voice comes out high and quick, like a child\'s.' },
  { id: 'photo', n: 'V', name: 'The Spirit Photograph', how: 'The "spirits" are glass plates exposed in advance, each with a face on it. Photograph the sitters on the same plate and the dead appear beside them.' },
  { id: 'tamb', n: 'VI', name: 'The Floating Tambourine', how: 'A telescoping rod, blacked so it can\'t be seen in the dark, with a hook on the end. She lifts the tambourine over the circle and shakes it.' },
];
const ITEMS = {
  clockKey: { name: 'Clock key', short: 'Clock key', desc: 'A little brass key on a black ribbon, for winding a mantel clock. It was hanging under the table, beside the clapper.' },
  flap: { name: 'Slate flap', short: 'Slate flap', doc: 'flap' },
  crank: { name: 'Brass crank', short: 'Crank', desc: 'A small brass winding crank with an ebony knob, the kind that fits the side of a clockwork machine. It was in the drawer under the mantel clock.' },
  paper: { name: 'The London Argus', short: 'Newspaper', doc: 'argus' },
  rod: { name: 'Telescoping rod', short: 'Rod', desc: 'Four feet of blacked brass tube that slides out to nearly eight. One end has a fine hook, the other a scrap of red ribbon from the tambourine. The tip is thin enough to go into a keyhole.' },
  key: { name: 'Door key', short: 'Door key', desc: 'The key to the parlour door. It came in under the door on the newspaper, just like the burglar in the Argus.' },
};
const HEARD = {
  lily: { title: 'The phonograph, at FAST', text: 'A little girl: "Mamma? Mamma, it\'s Lily. I\'m here, Mamma. It isn\'t cold where I am. Tell the lady in grey that Arthur is here with me, and he isn\'t frightened any more. I have to go now. Goodnight, Mamma." Then a gabble of chatter, far too fast to follow.' },
  madame: { title: 'The phonograph, at SLOW', text: 'Madame Kell\'s own voice, drawn out and sing-song, saying Lily\'s words. Then, briskly, to herself: "There. That will do for the Ashdown woman. Tuesday, the Colonel. Mother\'s plate for him. And the bureau word is Mother\'s name, if I forget again. God forgive me."' },
  real1: { title: 'Behind you, when the phonograph stopped', text: 'A child\'s whisper: "That isn\'t me."' },
  real2: { title: 'While you read the blue book', text: 'Very close, a child\'s voice: "She never heard me."' },
  raps1: { title: 'The table, by itself', text: 'One rap. Yes. Nobody was near the pedal.' },
};

/* ---------------- documents ---------------- */
const SIGN = '<p class="sig">A. K.</p>';
function notesPage() {
  const done = S.exposed.length;
  return `<h3>Notes: the sitting at Madame Kell's</h3><p class="sub3">Wonders worked out: ${done} of 6</p><ol class="won">${WONDERS.map(w => S.exposed.includes(w.id) ? `<li class="ok"><b>${w.name}.</b> ${w.how}</li>` : `<li><b>${w.name}.</b> <span class="muted">Not yet.</span></li>`).join('')}</ol>`;
}
function plateImg(k) { return T.plateURL ? T.plateURL[k] : ''; }
function platePage(k) {
  const P = { a: ['Grandfather', 'for Mrs Ashdown', 'An old man with white side-whiskers and a high collar. In the negative his face is dark and his collar glows.'],
    b: ['Soldier', 'for Miss Wren', 'A young officer in a dress tunic, hand on a sword hilt. Someone has painted a soft blur round him on the glass, like mist.'],
    c: ['Mother', 'for Col. Pryor', 'An old woman in a lace cap, hands folded. Scratched into the corner of the plate, in careful capitals: MOTHER · AGNES · 1880.'] }[k];
  if (S.gas !== 'full') return `<h3>Glass plate: "${P[0]}"</h3><p class="sub3">Pencilled on the paper sleeve: ${P[1]}</p><div class="plate dark"></div><p>You hold it up, but there's nothing to see: just dark glass. A negative needs a strong light behind it. The gas is ${S.gas === 'off' ? 'off' : 'turned down low'}.</p>`;
  return `<h3>Glass plate: "${P[0]}"</h3><p class="sub3">Pencilled on the paper sleeve: ${P[1]}</p><div class="plate"><img src="${plateImg(k)}" alt="${P[2]}"></div><p>${P[2]}</p>`;
}
const DOCS = {
  note: { title: 'Madame\'s note (envelope on the table)', style: 'kl', pages: [
    `<p class="to">To my uninvited guest</p><p>You hid behind my curtain. I heard you breathing through the whole of the sitting.</p><p>Very well. You came to find out how it is done, so stay and find out. There were six wonders tonight. Work out every one of them and you will find your own way out.</p><p>I have turned down the gas and locked the door. The key is still in the lock, on my side of it.</p><p>Do not be frightened of the raps. It is only ever me.</p>${SIGN}`,
  ], onRead: () => flag('readNote') },
  prog: { title: 'Programme of the sitting', style: 'kprog', pages: [
    `<p class="pk">Madame Ada Kell</p><p class="pk2">Clairvoyante &amp; Trance Medium</p><div class="rule"></div><p class="pd">A SITTING &middot; Friday, 3rd March 1893, at nine o'clock</p><p class="pi">Tonight the circle will be favoured with</p>
     <ol class="pw"><li><b>The Spirit Raps.</b> The table answers the sitters' questions. One rap, Yes. Two raps, No.</li><li><b>The Slate Writing.</b> A message from the other side, written between two sealed slates.</li><li><b>The Luminous Hand.</b> A spirit hand appears upon the cabinet in the dark.</li><li><b>The Voice of Little Lily.</b> Madame's own dear daughter, who passed over in 1889, speaks from the cabinet.</li><li><b>The Spirit Photograph.</b> The departed appear upon the plate beside those they loved.</li><li><b>The Floating Tambourine.</b> It will pass over the heads of the circle in the dark.</li></ol>
     <div class="rule"></div><p class="pf">Sitters are asked to keep their hands joined and on no account to break the circle. Two guineas.</p>`,
  ], onRead: () => flag('readProg') },
  mcard: { title: 'Mourning card, on the mantelpiece', style: 'kmourn', pages: [
    `<p class="m1">In Loving Memory of</p><p class="m2">LILY ADA KELL</p><p class="m3">the only child of Ada and the late Thomas Kell,<br>who fell asleep on the 9th of January 1889<br>at a quarter past four in the morning,<br>aged 7 years.</p><p class="m4">"Not lost, but gone before."</p>`,
  ], onRead: () => flag('readCard') },
  flap: { title: 'The slate flap', style: 'kslate', pages: [
    `<div class="chalk rev"><p>MAMMA STOPPED THE CLOCK</p><p>AT THE HOUR I FELL ASLEEP.</p><p>SET IT GOING AGAIN.</p><p class="lil">LILY</p></div><p class="under">The chalk runs backwards, right to left, every letter reversed.</p>`,
  ] },
  mirror: { title: 'The slate flap, in the looking-glass', style: 'kslate', pages: [
    `<div class="chalk"><p>MAMMA STOPPED THE CLOCK</p><p>AT THE HOUR I FELL ASLEEP.</p><p>SET IT GOING AGAIN.</p><p class="lil">LILY</p></div><p class="under">In the glass the writing comes out the right way round. (Madame wrote it backwards so she could check it in the mirror before the sitting.)</p>`,
  ], onRead: () => flag('readMirror') },
  tin: { title: 'Tin on the bookcase', style: 'klabel', pages: [
    `<p class="lb1">BALMAIN'S</p><p class="lb2">LUMINOUS PAINT</p><p class="lb3">By Royal Letters Patent</p><div class="rule"></div><p>Articles painted with this preparation, when exposed to strong daylight or gaslight, will afterwards <b>shine in the dark</b> with a soft light, the brightness fading by degrees. <b>They do not shine unless first exposed to light.</b></p><p class="pen2">Pencilled inside the lid: <i>gas up full while they take their seats, then down. Never forget.</i></p>`,
  ], onRead: () => flag('readTin') },
  argus: { title: 'The London Argus, 3 March 1893', style: 'knews', pages: [
    `<div class="mast">THE LONDON ARGUS</div><div class="dateline">FRIDAY, MARCH 3, 1893 &middot; ONE PENNY &middot; WEATHER: RAIN, COLD</div>
     <div class="cols"><div><h4>A BURGLAR'S TRICK</h4><p>At Marylebone Police Court yesterday, Henry Coote, 31, was charged with breaking into a house in Wimpole Street. The Court heard how he got past a locked door. Finding the key left in the lock on the far side, he slid a sheet of newspaper under the door, pushed the key out of the lock with a hatpin so that it fell upon the paper, and drew the paper back under the door with the key upon it. The magistrate observed that householders would do well to take their keys out of their doors at night.</p></div>
     <div><h4>SPIRITUALISM IN BLOOMSBURY</h4><p>A correspondent writes that the sittings of Madame Kell in Pellam Street continue to draw large and fashionable crowds, at two guineas a head. The Society for Psychical Research is understood to be taking an interest.</p><h4>THE WEATHER</h4><p>Rain and a cold east wind will continue through the night.</p></div></div>`,
  ], onRead: () => flag('readArgus') },
  bluebook: { title: 'Madame\'s blue book (from the bureau)', style: 'kl kblue', pages: [
    `<p class="to">Sitters: what they must hear</p><p><b>Mrs Ashdown.</b> Son Arthur, drowned in the Serpentine, June 1891, aged 11. Sailor collar. Called her "Mumsie". Always wears grey.</p><p><b>Col. Pryor.</b> Mother d. 1886, Bath. Has never seen a photograph of her. Use <u>Mother's plate</u>.</p><p><b>Miss Wren.</b> Lieut. Hart, killed at Suakin, 1885. Soldier plate.</p>`,
    `<p class="to">The wonders, for my own memory</p><p><b>Raps:</b> the pedal. <b>Slates:</b> flap, chalked backwards so I can read it in the glass. <b>Hand:</b> the roses. Gas up full while they sit, then down. <b>Voice:</b> the cylinder at FAST. <b>Photograph:</b> the plates. <b>Tambourine:</b> the rod.</p><p><b>Door:</b> key left in the lock, my side. They never think of it.</p>`,
    `<p class="to">L.</p><p>Four years this January. Every Friday I call her, and every Friday I hear nothing but my own voice coming out of that horn.</p><p>If she were anywhere at all she would come. She would come for me.</p>`,
  ], onRead: () => { flag('readBlue'); } },
  plate_a: { title: 'Glass plate', style: 'photo', pages: () => [platePage('a')], onRead: () => plateSeen('a') },
  plate_b: { title: 'Glass plate', style: 'photo', pages: () => [platePage('b')], onRead: () => plateSeen('b') },
  plate_c: { title: 'Glass plate', style: 'photo', pages: () => [platePage('c')], onRead: () => plateSeen('c') },
  sphoto: { title: 'Framed photograph over the chaise', style: 'photo', pages: () => [`<div class="plate print"><img src="${T.sphotoURL || ''}" alt="A sepia photograph of five sitters round the table, and a pale little girl standing behind Madame's chair."></div><p>Printed on the mount: <i>Spirit photograph taken at a sitting of Madame Kell's, 3rd February 1893. The form of Little Lily appeared beside the medium.</i> The little girl is pale and a bit see-through, and she's standing very still. The sitters around her are all slightly blurred.</p>`] },
  notes: { title: 'Your notes', style: 'kl knotes', pages: () => [notesPage()] },
};

/* ---------------- hints ---------------- */
const X = id => S.exposed.includes(id);
const HINTS = [
  { id: 'start', title: 'Where do I start?', when: s => s.flags.readNote && s.flags.readProg ? 'solved' : 'active', tiers: [
    'There\'s an envelope propped against the candlestick on the table, and a printed card beside it.',
    'Read Madame\'s note, then the programme card.',
    'The programme lists six wonders. Each one is a trick. Work out how each is done and it leads you on.',
    'Read the note and the programme on the table. Your notebook keeps track of the wonders you\'ve worked out.' ] },
  { id: 'raps', title: 'The Spirit Raps', when: s => !s.flags.readProg ? 'hidden' : X('raps') && s.flags.clockKey ? 'solved' : 'active', tiers: [
    'The raps came from the table, and Madame\'s hands were held by the sitters either side of her.',
    'Look closely at Madame\'s own chair, and under the tablecloth.',
    'There\'s a pedal under the seat of her chair. Under the cloth is the clapper it works, and a little key.',
    'Look under the seat of Madame\'s chair and press the pedal. Then lift the tablecloth and take the clock key.' ] },
  { id: 'slate', title: 'The Slate Writing', when: s => !s.flags.readProg ? 'hidden' : s.flags.readMirror ? 'solved' : 'active', tiers: [
    'The two slates tied with string are on the table.',
    'Open them. The message was written beforehand on something loose.',
    'The writing on the flap is backwards. What turns writing the right way round?',
    'Hold the slate flap up to the mirror over the fireplace to read it.' ] },
  { id: 'clock', title: 'The stopped clock', when: s => !(s.flags.readMirror || s.flags.clockKey) ? 'hidden' : (has('crank') || s.flags.crankFitted) ? 'solved' : 'active', tiers: [
    'The slate says to set the clock going again, at the hour Lily fell asleep.',
    'The mourning card on the mantelpiece gives the time.',
    'You need the clock key from under the table to wind it and move the hands.',
    'With the clock key, set the mantel clock to 4:15 (a quarter past four) and start it. Take what comes out of the drawer.' ] },
  { id: 'hand', title: 'The Luminous Hand', when: s => !s.flags.readProg ? 'hidden' : X('hand') ? 'solved' : 'active', tiers: [
    'The hand appeared on the cabinet in the dark. Look at the tin on the bookcase.',
    'Luminous paint only glows after it has soaked up strong light.',
    'The gas tap is on the wall by the door. Turn the gas up full, wait a few seconds, then turn it off.',
    'Gas up full for a few seconds, then off, then look at the spirit cabinet.' ] },
  { id: 'roses', title: 'The carved roses', when: s => !X('hand') ? 'hidden' : s.flags.cabOpen ? 'solved' : 'active', tiers: [
    'In the dark, numbers glowed beside four of the carved roses on the cabinet front.',
    'The roses can be pressed.',
    'Press the four marked roses in the order of their numbers, 1 to 4. You can charge the paint again if it fades.',
    'Press: right pilaster middle, left top, right bottom, left bottom.' ] },
  { id: 'voice', title: 'The Voice of Little Lily', when: s => !s.flags.readProg ? 'hidden' : X('voice') ? 'solved' : 'active', tiers: [
    'The voice came from the spirit cabinet. Something is hidden behind its back panel.',
    'Behind the false back is a phonograph. It needs a crank to wind it, and the crank is in the mantel clock.',
    'Listen to it at a different speed. There\'s a pencil mark by FAST.',
    'Fit the crank, move the speed lever to SLOW and play it. The last thing Madame says tells you the word for her bureau.' ] },
  { id: 'photo', title: 'The Spirit Photograph', when: s => !s.flags.readProg ? 'hidden' : s.flags.plateMother ? 'solved' : 'active', tiers: [
    'The camera stands by the window. Her glass plates are in the box on the little table beside it.',
    'A glass negative shows nothing unless there\'s strong light behind it.',
    'Turn the gas up full, then hold the plates up to the light. One of them is "Mother".',
    'With the gas up full, look at the plate marked Mother. Her name is scratched in the corner.' ] },
  { id: 'bureau', title: 'Madame\'s bureau', when: s => !s.flags.triedBureau ? 'hidden' : s.flags.bureauOpen ? 'solved' : 'active', tiers: [
    'A letter lock: five letters.',
    'Madame says on the phonograph recording what the word is.',
    'It\'s her mother\'s name. Her mother is on one of the glass plates.',
    'AGNES.' ] },
  { id: 'tamb', title: 'The Floating Tambourine', when: s => !s.flags.readProg ? 'hidden' : X('tamb') ? 'solved' : 'active', tiers: [
    'The tambourine floated over the sitters in the dark. Something long lifted it.',
    'Madame keeps her apparatus locked in her bureau.',
    'Open the bureau. Its lock takes a five-letter word.',
    'Take the telescoping rod from the open bureau.' ] },
  { id: 'door', title: 'The locked door', when: s => !s.flags.triedDoor ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'Madame says the key is still in the lock, on her side.',
    'Look through the keyhole. Then read the newspaper on the little table.',
    'A burglar used a newspaper and a hatpin. You have something long and thin too.',
    'Slide the newspaper under the door, push the key out with the rod so it drops onto the paper, then pull the paper back.' ] },
];

/* ---------------- painted things (canvas) ---------------- */
function paintThings() {
  // clock dial: enamel, Roman numerals, maker's name
  { const g = T.clockFace.userData.g, w = 256, c = 128; g.fillStyle = '#efe8d6'; g.fillRect(0, 0, w, w); const gr = g.createRadialGradient(c, c, 20, c, c, 128); gr.addColorStop(0, 'rgba(255,255,255,0.2)'); gr.addColorStop(1, 'rgba(120,100,60,0.25)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.strokeStyle = '#2a2218'; g.lineWidth = 2; g.beginPath(); g.arc(c, c, 118, 0, TAU); g.stroke(); g.beginPath(); g.arc(c, c, 92, 0, TAU); g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; g.lineWidth = i % 5 ? 1 : 3; g.beginPath(); g.moveTo(c + Math.sin(a) * 116, c - Math.cos(a) * 116); g.lineTo(c + Math.sin(a) * (i % 5 ? 110 : 104), c - Math.cos(a) * (i % 5 ? 110 : 104)); g.stroke(); }
    const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; g.fillStyle = '#1a140c'; g.font = `600 22px ${CORM}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    R.forEach((r, i) => { const a = i / 12 * TAU; g.save(); g.translate(c + Math.sin(a) * 78, c - Math.cos(a) * 78); g.rotate(a); g.fillText(r, 0, 0); g.restore(); });
    g.font = `italic 14px ${CORM}`; g.fillText('Leroy · Paris', c, c + 40); g.fillStyle = '#222'; g.beginPath(); g.arc(c - 34, c + 8, 5, 0, TAU); g.fill(); g.beginPath(); g.arc(c + 34, c + 8, 5, 0, TAU); g.fill(); T.clockFace.needsUpdate = true; }
  // mourning card (small on the mantel)
  { const g = T.mcard.userData.g, w = 256, h = 360; g.fillStyle = '#f2ece0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#0a0a0a'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.font = `italic 18px ${CORM}`; g.fillText('In Loving Memory of', w / 2, 70); g.font = `600 24px ${PLAY}`; g.fillText('LILY ADA KELL', w / 2, 110); g.font = `14px ${CORM}`; ['who fell asleep', '9th January 1889', 'at a quarter past four', 'in the morning,', 'aged 7 years'].forEach((t, i) => g.fillText(t, w / 2, 150 + i * 22)); g.font = `italic 15px ${CORM}`; g.fillText('"Not lost, but gone before."', w / 2, 300); T.mcard.needsUpdate = true; }
  // talking board: YES / NO, two arcs of letters, numbers, GOOD BYE
  { const g = T.board.userData.g, w = 1024, h = 640; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c9a46a'); gr.addColorStop(1, '#b38a52'); g.fillStyle = gr; g.fillRect(0, 0, w, h); speckle(g, w, h, 6000, 0.12, '60,40,20', 2);
    g.fillStyle = '#1e140a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 48px ${PLAY}`; g.fillText('YES', 110, 80); g.fillText('NO', w - 110, 80); g.font = `italic 30px ${CORM}`; g.fillText('The Talking Board', w / 2, 60);
    g.beginPath(); g.arc(210, 90, 26, 0, TAU); g.fill(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.fillRect(210 + Math.cos(a) * 36 - 2, 90 + Math.sin(a) * 36 - 2, 4, 4); }
    g.beginPath(); g.arc(w - 210, 90, 26, 0, TAU); g.fill(); g.fillStyle = '#c3a068'; g.beginPath(); g.arc(w - 200, 84, 24, 0, TAU); g.fill(); g.fillStyle = '#1e140a';
    const arc = (letters, r, cy) => { letters.split('').forEach((L2, i) => { const a = Math.PI * (1.2 + 0.6 * i / (letters.length - 1)); g.save(); g.translate(w / 2 + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55); g.rotate(a + Math.PI / 2); g.font = `700 50px ${PLAY}`; g.fillText(L2, 0, 0); g.restore(); }); };
    arc('ABCDEFGHIJKLM', 400, 450); arc('NOPQRSTUVWXYZ', 330, 530);
    g.font = `700 44px ${PLAY}`; '1234567890'.split('').forEach((n, i) => g.fillText(n, w / 2 - 270 + i * 60, 520));
    g.font = `700 46px ${PLAY}`; g.fillText('GOOD BYE', w / 2, 598);
    g.strokeStyle = 'rgba(30,20,10,0.6)'; g.lineWidth = 4; g.strokeRect(16, 16, w - 32, h - 32); T.board.needsUpdate = true; }
  // programme card
  { const g = T.prog.userData.g, w = 360, h = 512; g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a5020'; g.lineWidth = 3; g.strokeRect(12, 12, w - 24, h - 24); g.fillStyle = '#1a140c'; g.textAlign = 'center';
    g.font = `italic 30px ${CORM}`; g.fillText('Madame Ada Kell', w / 2, 62); g.font = `12px ${PLAY}`; g.fillText('A SITTING  ·  3rd MARCH 1893', w / 2, 92); g.font = `15px ${CORM}`;
    ['I.  The Spirit Raps', 'II.  The Slate Writing', 'III.  The Luminous Hand', 'IV.  The Voice of Little Lily', 'V.  The Spirit Photograph', 'VI.  The Floating Tambourine'].forEach((t, i) => g.fillText(t, w / 2, 150 + i * 44)); g.font = `italic 12px ${CORM}`; g.fillText('Two guineas', w / 2, 460); T.prog.needsUpdate = true; }
  // envelope
  { const g = T.env.userData.g, w = 512, h = 340; g.fillStyle = '#ece2cb'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1500, 0.08); g.fillStyle = '#2a1c10'; g.font = `44px ${'"Pinyon Script", cursive'}`; g.textAlign = 'center'; g.fillText('To my uninvited guest', w / 2, h / 2 + 10); g.fillStyle = '#6a1a1a'; g.beginPath(); g.arc(w - 70, 70, 26, 0, TAU); g.fill(); T.env.needsUpdate = true; }
  // the flap, chalked backwards
  { const g = T.flapMirror.userData.g, w = 512, h = 360; g.clearRect(0, 0, w, h); g.save(); g.translate(w, 0); g.scale(-1, 1); g.fillStyle = 'rgba(235,235,225,0.85)'; g.font = `40px ${CHALK}`; g.textAlign = 'center'; ['MAMMA STOPPED THE CLOCK', 'AT THE HOUR I FELL ASLEEP.', 'SET IT GOING AGAIN.', 'LILY'].forEach((t, i) => g.fillText(t, w / 2, 80 + i * 70)); g.restore(); T.flapMirror.needsUpdate = true; }
  // the newspaper, folded on the side table
  { const g = T.times.userData.g, w = 512, h = 360; g.fillStyle = '#d8cfb8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = `700 34px ${PLAY}`; g.textAlign = 'center'; g.fillText('THE LONDON ARGUS', w / 2, 44); g.fillRect(20, 56, w - 40, 2); g.font = `11px ${CORM}`; g.fillText('FRIDAY, MARCH 3, 1893', w / 2, 72);
    g.textAlign = 'left'; g.font = `700 14px ${PLAY}`; g.fillText("A BURGLAR'S TRICK", 22, 98); for (let c = 0; c < 3; c++) for (let y = (c ? 90 : 108); y < h - 12; y += 7) { g.fillStyle = `rgba(20,20,20,${rand(0.35, 0.6)})`; g.fillRect(22 + c * 162, y, rand(120, 150), 3); } T.times.needsUpdate = true; }
  // photographs: portraits, the spirit photograph, and the glass negatives
  const sepia = (g, w, h) => { const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) / 255; const px = (i / 4) % w, py = Math.floor(i / 4 / w), dx = px / w - 0.5, dy = py / h - 0.5, v = 1 - Math.min(1, (dx * dx + dy * dy) * 1.6); const L2 = clamp(l * (0.55 + 0.5 * v) + (Math.random() - 0.5) * 0.05, 0, 1); d.data[i] = 40 + L2 * 205; d.data[i + 1] = 28 + L2 * 170; d.data[i + 2] = 16 + L2 * 120; } g.putImageData(d, 0, 0); };
  // a Victorian studio sitter: shaded face, parted hair, bodice, collar; o = { dress, skin, hair, collar, cap, whiskers, ringlets, eyes }
  const figure = (g, x, y, s, o) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const shade = (col, k) => { const c = new THREE.Color(col); c.multiplyScalar(k); return '#' + c.getHexString(); };
    // shoulders and bodice
    let gr = g.createLinearGradient(-70, 60, 70, 200); gr.addColorStop(0, shade(o.dress, 1.25)); gr.addColorStop(0.6, o.dress); gr.addColorStop(1, shade(o.dress, 0.6));
    g.fillStyle = gr; g.beginPath(); g.moveTo(-78, 230); g.bezierCurveTo(-80, 120, -58, 72, -14, 62); g.lineTo(14, 62); g.bezierCurveTo(58, 72, 80, 120, 78, 230); g.fill();
    g.strokeStyle = shade(o.dress, 0.55); g.lineWidth = 1.2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-40 + k * 20, 100); g.quadraticCurveTo(-44 + k * 22, 160, -46 + k * 23, 230); g.stroke(); }
    if (!o.cap) { g.fillStyle = shade(o.dress, 0.5); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(0, 82 + k * 22, 2.4, 0, TAU); g.fill(); } }
    // neck and face
    gr = g.createLinearGradient(-10, 40, 10, 66); gr.addColorStop(0, shade(o.skin, 0.8)); gr.addColorStop(1, shade(o.skin, 0.6)); g.fillStyle = gr; g.fillRect(-9, 38, 18, 26);
    gr = g.createRadialGradient(-5, 12, 4, 0, 18, 34); gr.addColorStop(0, shade(o.skin, 1.12)); gr.addColorStop(0.65, o.skin); gr.addColorStop(1, shade(o.skin, 0.62));
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 18, 21, 27, 0, 0, TAU); g.fill();
    // features: brow shadow, eyes, nose, mouth
    g.fillStyle = 'rgba(40,25,15,0.18)'; g.beginPath(); g.ellipse(0, 12, 17, 5, 0, 0, TAU); g.fill();
    g.fillStyle = o.eyes || 'rgba(25,15,10,0.85)'; for (const ex of [-8, 8]) { g.beginPath(); g.ellipse(ex, 15, 3.4, 1.8, 0, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(40,25,15,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(1, 16); g.quadraticCurveTo(3, 25, -1, 28); g.stroke();
    g.strokeStyle = 'rgba(80,35,30,0.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-6, 35); g.quadraticCurveTo(0, 36.5, 6, 35); g.stroke();
    // hair, parted in the middle and drawn back; or a lace cap
    g.fillStyle = o.hair; g.beginPath(); g.moveTo(-22, 16); g.bezierCurveTo(-26, -8, -8, -12, 0, -9); g.bezierCurveTo(8, -12, 26, -8, 22, 16); g.bezierCurveTo(18, 2, 8, -2, 0, -1); g.bezierCurveTo(-8, -2, -18, 2, -22, 16); g.fill();
    if (o.ringlets) for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(sx * (23 + k * 1.5), 14 + k * 11, 5.5, 7, sx * 0.3, 0, TAU); g.fill(); }
    if (o.cap) { g.fillStyle = o.cap; g.beginPath(); g.ellipse(0, -4, 32, 16, 0, Math.PI * 0.95, Math.PI * 2.05); g.fill(); g.strokeStyle = o.cap; g.lineWidth = 2; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(-28 + k * 7, 6, 3.5, 0, Math.PI); g.stroke(); } for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 26, 8); g.quadraticCurveTo(sx * 30, 40, sx * 16, 62); g.lineWidth = 5; g.stroke(); } }
    if (o.whiskers) { g.fillStyle = o.whiskers; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 20, 8); g.quadraticCurveTo(sx * 30, 30, sx * 12, 44); g.quadraticCurveTo(sx * 16, 26, sx * 18, 10); g.fill(); } }
    if (o.collar) { g.fillStyle = o.collar; g.beginPath(); g.moveTo(-20, 62); g.quadraticCurveTo(0, 80, 20, 62); g.lineTo(14, 58); g.quadraticCurveTo(0, 68, -14, 58); g.fill(); }
    // hands folded in the lap
    if (o.hands !== false) { gr = g.createRadialGradient(0, 196, 2, 0, 196, 26); gr.addColorStop(0, shade(o.skin, 1.05)); gr.addColorStop(1, shade(o.skin, 0.7)); g.fillStyle = gr; g.beginPath(); g.ellipse(-8, 198, 20, 11, 0.25, 0, TAU); g.fill(); g.beginPath(); g.ellipse(9, 196, 19, 10, -0.2, 0, TAU); g.fill(); }
    g.restore();
  };
  const backdrop = (g, w, h, a = '#9a9892', b = '#55534e') => { const gr = g.createRadialGradient(w * 0.45, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.9); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = 0.18; for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#fff' : '#000'; g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(40, 120), rand(20, 60), rand(0, 3), 0, TAU); g.fill(); } g.globalAlpha = 1; };
  const photo = (w, h, draw) => { const c = canv(w, h, (g) => { draw(g, w, h); }); const g = c.getContext('2d'); g.filter = 'blur(1.2px)'; g.drawImage(c, 0, 0); g.filter = 'none'; sepia(g, w, h); return c; };
  const pM = photo(256, 340, (g, w, h) => { backdrop(g, w, h); figure(g, w / 2, 96, 1.4, { dress: '#161412', skin: '#d8cfc4', hair: '#2a2622', collar: '#e8e8e0' }); });
  T.portraitM.userData.g.drawImage(pM, 0, 0); T.portraitM.needsUpdate = true;
  const pL = photo(256, 340, (g, w, h) => { backdrop(g, w, h, '#8e8c86', '#4a4844'); figure(g, w / 2, 108, 1.3, { dress: '#eeeeea', skin: '#e2dad0', hair: '#5a4a38', ringlets: true, collar: '#fff' }); });
  T.portraitL.userData.g.drawImage(pL, 0, 0); T.portraitL.needsUpdate = true;
  const sp = photo(512, 380, (g, w, h) => { g.fillStyle = '#7a7a78'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a4a48'; g.fillRect(0, 250, w, 130); g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(w / 2, 290, 190, 40, 0, 0, TAU); g.fill();
    [[110, 150, { dress: '#1a1a1a', skin: '#cfc8c0', hair: '#2a2622', collar: '#ddd' }], [190, 140, { dress: '#3a3a3a', skin: '#d0c8c0', hair: '#4a4038', whiskers: '#bbb' }], [320, 140, { dress: '#555', skin: '#d0c8c0', hair: '#3a3028', cap: '#ddd' }], [400, 150, { dress: '#202020', skin: '#cfc8c0', hair: '#2a2622' }], [256, 130, { dress: '#0e0e0e', skin: '#d8d0c8', hair: '#1e1a16', collar: '#eee' }]].forEach(([x, y, o]) => figure(g, x, y, 0.62, o));
    g.globalAlpha = 0.45; g.filter = 'blur(2px)'; figure(g, 300, 80, 0.72, { dress: '#fbfbf8', skin: '#f4f0ea', hair: '#b8b0a0', ringlets: true, eyes: 'rgba(30,20,10,0.5)' }); g.filter = 'none'; g.globalAlpha = 1; });
  T.spiritPhoto.userData.g.drawImage(sp, 0, 0); T.spiritPhoto.needsUpdate = true; T.sphotoURL = sp.toDataURL('image/jpeg', 0.85);
  // glass negatives: tones reversed, the scratch reads bright
  const neg = (o, scratch) => { const c = canv(300, 380, (g, w, h) => { backdrop(g, w, h, '#b0aea8', '#6a6862'); figure(g, w / 2, 84, 1.3, o); if (o.mist) { g.globalAlpha = 0.5; g.filter = 'blur(10px)'; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, 190, 120, 170, 0, 0, TAU); g.fill(); g.filter = 'none'; g.globalAlpha = 1; } });
    const g = c.getContext('2d'); g.filter = 'blur(1.1px)'; g.drawImage(c, 0, 0); g.filter = 'none'; const d = g.getImageData(0, 0, 300, 380); for (let i = 0; i < d.data.length; i += 4) { const l = clamp(255 - (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) + (Math.random() - 0.5) * 22, 0, 255); d.data[i] = l * 0.8; d.data[i + 1] = l * 0.84; d.data[i + 2] = l * 0.86; } g.putImageData(d, 0, 0);
    g.strokeStyle = 'rgba(40,40,40,0.9)'; g.lineWidth = 10; g.strokeRect(0, 0, 300, 380);
    if (scratch) { g.fillStyle = '#fbfbf4'; g.font = `600 22px ${PLAY}`; g.textAlign = 'right'; g.shadowColor = 'rgba(255,255,255,0.6)'; g.shadowBlur = 4; g.fillText(scratch, 286, 364); g.shadowBlur = 0; }
    for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(230,230,220,${rand(0.1, 0.3)})`; g.lineWidth = 0.7; g.beginPath(); const x = rand(0, 300), y = rand(0, 380); g.moveTo(x, y); g.lineTo(x + rand(-40, 40), y + rand(-40, 40)); g.stroke(); }
    return c.toDataURL('image/jpeg', 0.85); };
  T.plateURL = { a: neg({ dress: '#202020', skin: '#e8e0d8', hair: '#eee', whiskers: '#f4f4f4', collar: '#fff' }), b: neg({ dress: '#303030', skin: '#e0d8d0', hair: '#3a3028', collar: '#bbb', mist: true }), c: neg({ dress: '#141414', skin: '#e0d8d0', hair: '#aaa', cap: '#f4f4f4' }, 'MOTHER · AGNES · 1880') };
}


/* =====================================================================
   THE LAST SITTING · part D: the wonders, the slow burn, sound, ending
   ===================================================================== */
const heard = id => { if (!S.heard.includes(id)) { S.heard.push(id); save(); } };
const look = (txt, ms = 5200) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const behindPos = (d = 0.6) => new THREE.Vector3(P.x + Math.sin(G.yaw) * d, G.eye - 0.15, P.z + Math.cos(G.yaw) * d);
const GAS = { off: 0, low: 0.35, full: 1 };
const ROSE_ORDER = [5, 1, 6, 3];
const V = { gasK: 0.35, dip: 0, envDone: false, envGas: 'low', envT: 0, charge: 0, glow: 0, glowSeenT: 0, clockRun: false, tickT: 0, tickA: 0, phono: false, stuckT: 0, progKey: '', drapeT: 0, childHand: 0, rev: 0 };

/* ---------------- the wonders ---------------- */
function expose(id) {
  if (S.exposed.includes(id)) return;
  S.exposed.push(id); save();
  const w = WONDERS.find(x => x.id === id);
  sTone([523.25, 783.99], 1.4, 0.05); after(0.18, () => sTone([659.25], 1.2, 0.04));
  toast(`<b>Worked out, ${S.exposed.length} of 6: ${w.name}</b><br>${w.how}<br><span class="muted">In your notes (${G.touch ? 'Notebook' : '<kbd>Tab</kbd>'}).</span>`, 10000);
  V.stuckT = 0;
  if (S.exposed.length === 3 && !S.ev.midnight) { S.ev.midnight = true; after(14, midnight); }
}

/* ---------------- gas ---------------- */
function setGas(v) {
  const was = S.gas; if (was === v) return; S.gas = v; save();
  sSqueak(POS.tap, 0.08); sClick(POS.tap, 0.25, 900);
  O.tapLever.rotation.x = v === 'full' ? -0.9 : v === 'low' ? -0.35 : 0.5;
  if (v === 'off') { after(0.2, () => { sThunk(POS.gas, 0.18, 300); }); if (!S.flags.gasOffOnce) { flag('gasOffOnce'); subtitle('', '<i>The gas flames shrink to blue beads and go out. Only the three candles on the table are left burning.</i>', 5200); } }
  else if (was === 'off') { after(0.15, () => sThunk(POS.gas, 0.25, 160)); subtitle('', '<i>A soft pop, and the gas catches again.</i>', 2600); }
  else if (v === 'full' && !S.flags.gasFullOnce) { flag('gasFullOnce'); subtitle('', '<i>The gas roars up. For the first time you can see the whole room properly.</i>', 4200); }
  V.envT = 1.2;
}
function gasActions() {
  if (S.gas === 'low') return [{ label: 'Turn the gas up full', run: () => setGas('full') }, { label: 'Turn it off', run: () => setGas('off') }];
  if (S.gas === 'full') return [{ label: 'Turn it down low', run: () => setGas('low') }, { label: 'Turn it off', run: () => setGas('off') }];
  return [{ label: 'Turn it back on, low', run: () => setGas('low') }, { label: 'Turn it on full', run: () => setGas('full') }];
}

/* ---------------- I. the raps ---------------- */
function findPedal() {
  flag('pedalFound'); sClick(POS.mchair, 0.2, 1400);
  subtitle('', '<i>You crouch and lift the fringe of her seat. Screwed to the underside, where her heel would rest: a flat brass pedal, and a cord running from it under the rug towards the table.</i>', 6200);
}
function pressPedal() {
  sClick(POS.mchair, 0.3, 700); after(0.08, () => sKnock(POS.under, 1.0, 0, 0));
  if (!X('raps')) after(0.6, () => { expose('raps'); if (!S.flags.underSeen) after(1.2, () => subtitle('', '<i>The rap came from under the table.</i>', 3600)); });
}
function lookUnder() {
  flag('underSeen'); sScrape(POS.under, 0.3, 0.12);
  subtitle('', `<i>You lift the heavy cloth. Screwed under the table top is a wooden box with a sprung clapper in it, and a cord running out of it towards Madame's chair.${S.flags.clockKey ? '' : ' A little brass key hangs beside it on a black ribbon.'}</i>`, 6400);
}
function takeClockKey() { give('clockKey'); flag('clockKey'); O.clockKey.visible = false; save(); }

/* ---------------- II. the slates, the mirror, the clock ---------------- */
function openSlates() {
  flag('slatesOpen'); sScrape(POS.table, 0.3, 0.1);
  O.slateString.visible = false;
  tween(0.9, k => { O.slateHi.position.set(-0.05 * k, 0.022 + Math.sin(k * Math.PI) * 0.12, 0.2 * k); O.slateHi.rotation.x = -Math.PI * k * 0.98; }, () => { renderer.shadowMap.needsUpdate = true; });
  after(0.6, () => { O.flap.visible = true; sClick(POS.table, 0.3, 1200); });
  after(1.4, () => {
    subtitle('', '<i>The slates are blank inside, but a thin loose sheet of slate drops out of the top frame into the bottom one, chalk side up. The writing on it runs backwards.</i>', 6200);
    expose('slate'); give('flap'); O.flap.visible = false;
  });
}
function drawHands() {
  const h = S.clock.h % 12, m = S.clock.m;
  O.hMin.rotation.z = -(m / 60) * TAU; O.hHour.rotation.z = -((h + m / 60) / 12) * TAU;
}
function openClockPanel() {
  const draw = (msg = '') => {
    const p = $('#clockp'); if (!p) return;
    p.innerHTML = `<h3>Mantel clock</h3><p class="muted" style="font-size:12px;margin:0 0 8px">You fit the key, wind it, and open the glass to move the hands.</p>
      <div class="grp"><span class="lbl">Hour</span><span class="clk"><button class="btn" data-h="-1">&minus;</button><b>${S.clock.h}</b><button class="btn" data-h="1">+</button></span></div>
      <div class="grp"><span class="lbl">Minutes</span><span class="clk"><button class="btn" data-m="-5">&minus;</button><b>${String(S.clock.m).padStart(2, '0')}</b><button class="btn" data-m="5">+</button></span></div>
      <div class="grp"><span class="lbl">The clock says</span><b class="clkread">${S.clock.h}:${String(S.clock.m).padStart(2, '0')}</b></div>
      ${msg ? `<p style="font-size:12.5px;margin:10px 0 0;color:#e7dec6">${msg}</p>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn primary" id="cpGo">Start it</button><button class="btn" id="cpBack">Step back</button></div>`;
    p.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { S.clock.h = ((S.clock.h - 1 + +b.dataset.h + 12) % 12) + 1; sClick(POS.clock, 0.15, 3800); drawHands(); save(); draw(); });
    p.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { S.clock.m = (S.clock.m + +b.dataset.m + 60) % 60; sClick(POS.clock, 0.12, 4200); drawHands(); save(); draw(); });
    $('#cpGo').onclick = () => startClock(draw);
    $('#cpBack').onclick = () => closePanel();
  };
  openPanel('<div id="clockp"></div>', () => draw());
}
function startClock(draw) {
  if (G.time < (G.lockout || 0)) { draw('Give it a moment.'); return; }
  if (S.clock.h === 4 && S.clock.m === 15) {
    closePanel(true); flag('clockSet'); V.clockRun = true; S.inv = S.inv.filter(i => i !== 'clockKey'); renderInv(); resumeLook();
    subtitle('', '<i>The pendulum catches. The clock ticks, whirrs, and strikes four.</i>', 4200);
    for (let i = 0; i < 4; i++) after(0.8 + i * 1.1, () => chime(POS.clock, 0.5));
    after(5.4, () => { sScrape(POS.clock, 0.4, 0.2); O.crankIn.visible = true; tween(0.5, k => { O.clockDrawer.position.z = 0.09 * k; }); subtitle('', '<i>On the last stroke a shallow drawer slides out of the base of the clock. Inside it: a small brass crank.</i>', 5200); });
    return;
  }
  S.wrong++; save(); G.lockout = G.time + 3;
  draw('It ticks a few times and stops. Wrong hour.');
  after(1.2, () => { sKnock(POS.under, 0.8, 0, 0); after(0.5, () => sKnock(POS.under, 0.8, 0, 0)); });
}
function takeCrank() { give('crank'); O.crankIn.visible = false; tween(0.4, k => { O.clockDrawer.position.z = 0.09 * (1 - k); }); }
// struck bells: partials with their own decays. chime (clock), hand bell, church bell far off
function bell(pos, vol, base, parts, decay, wet = 0.4) { if (!A.ready) return; const t = now(); parts.forEach(([r, a, dk]) => { const o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.type = 'sine'; o.frequency.value = base * r * (1 + rand(-0.002, 0.002)); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + decay * dk); o.connect(g); route(g, { pos, wet }); o.start(t); o.stop(t + decay * dk + 0.05); }); }
function chime(pos, vol) { bell(pos, vol * 0.12, 880, [[1, 1, 1], [1.5, 0.4, 0.7], [2, 0.25, 0.5], [3, 0.1, 0.3]], 2.4); }
function handBell(pos, vol = 1) { bell(pos, vol * 0.09, 1320, [[1, 1, 1], [2.02, 0.5, 0.6], [2.76, 0.35, 0.45], [4.1, 0.15, 0.3], [5.4, 0.08, 0.2]], 2.2, 0.35); }
function churchBell(pos) { bell(pos, 0.06, 220, [[0.5, 0.6, 1.4], [1, 1, 1], [1.19, 0.5, 0.8], [1.5, 0.35, 0.6], [2, 0.3, 0.5], [2.52, 0.12, 0.3]], 4.5, 0.7); }

/* ---------------- III. the luminous paint, the roses ---------------- */
function pressRose(n) {
  const r = O.roses[n - 1]; sClick(POS.cab, 0.35, 1800);
  tween(0.12, k => { r.position.x = r.userData.base - 0.008 * k; }, () => tween(0.15, k => { r.position.x = r.userData.base - 0.008 * (1 - k); }));
  S.roses.push(n); save();
  if (S.roses.length < 4) return;
  const ok = S.roses.every((v, i) => v === ROSE_ORDER[i]); S.roses = []; save();
  if (ok) { after(0.4, openCabinet); return; }
  if (S.flags.glowSeen) { S.wrong++; save(); after(0.5, () => { subtitle('', '<i>The roses click back out. Nothing happens.</i>', 2600); sKnock(POS.under, 0.8, 0, 0); after(0.5, () => sKnock(POS.under, 0.8, 0, 0)); }); }
  else after(0.5, () => subtitle('', '<i>Click, click, click, click. The roses spring back out. Nothing else happens.</i>', 2800));
}
function openCabinet() {
  flag('cabOpen'); sClick(POS.back, 0.5, 900); sCreak(POS.back, 1.6, 0.3, 110);
  tween(1.6, k => { O.backPanel.rotation.y = 1.35 * k; }, () => { renderer.shadowMap.needsUpdate = true; });
  after(1.8, () => subtitle('', '<i>Something clicks inside the cabinet, and its back panel swings out like a door. Behind it, in a hollow, is a phonograph with a brown wax cylinder on it.</i>', 6200));
}

/* ---------------- IV. the phonograph ---------------- */
function fitCrank() {
  flag('crankFitted'); S.inv = S.inv.filter(i => i !== 'crank'); renderInv(); save(); O.crankOn.visible = true;
  for (let i = 0; i < 8; i++) after(i * 0.16, () => sClick(POS.back, 0.12, 2400 + (i % 2) * 400));
  subtitle('', '<i>The crank fits the socket in the side. You wind the spring until it\'s tight.</i>', 3600);
}
function toggleSpeed() {
  S.speed = S.speed === 'fast' ? 'slow' : 'fast'; save(); sClick(POS.back, 0.25, 1600);
  O.lever.rotation.z = S.speed === 'fast' ? -0.5 : 0.5;
  subtitle('', `<i>You push the speed lever over to ${S.speed.toUpperCase()}.${S.speed === 'fast' ? ' It sits by a pencilled "L."' : ''}</i>`, 3000);
}
async function playPhono() {
  if (V.phono) return; V.phono = true; const fast = S.speed === 'fast', rate = fast ? 1.55 : 1.0, pos = POS.back.clone().add(new THREE.Vector3(0.2, 0.2, 0));
  if (A.ready && A.loops.phono) setGain(A.loops.phono, 0.035, 0.1);
  let crackle = true; const crack = () => { if (!crackle) return; sClick(pos, rand(0.01, 0.05), rand(1800, 6000)); after(rand(0.03, 0.14), crack); }; crack();
  const tone = fast ? { who: 'Little Lily', a: '"Mamma? Mamma, it\'s Lily. I\'m here, Mamma. It isn\'t cold where I am. Tell the lady in grey that Arthur is here with me, and he isn\'t frightened any more. I have to go now. Goodnight, Mamma."' }
    : { who: 'The phonograph, slowed down', a: 'It\'s Madame Kell\'s own voice, drawn out and sing-song: "Mamma? Mamma, it\'s Lily. I\'m here, Mamma..."' };
  await wait(700);
  await say(tone.who, tone.a, { clip: 's_lily', fx: 'phono', pos, speed: rate, volume: 1.2 });
  if (fast) { heard('lily'); await say('The phonograph', '<i>[then a gabble of chatter, far too fast to follow]</i>', { clip: 's_memo', fx: 'phono', pos, speed: rate, volume: 1.1 }); }
  else { await say('Madame Kell, to herself', '"There. That will do for the Ashdown woman. Tuesday, the Colonel. Mother\'s plate for him. And the bureau word is Mother\'s name, if I forget again. God forgive me."', { clip: 's_memo', fx: 'phono', pos, speed: rate, volume: 1.1 }); heard('madame'); }
  crackle = false; if (A.ready && A.loops.phono) setGain(A.loops.phono, 0, 0.2);
  V.phono = false;
  if (fast && !S.flags.heardFast) { flag('heardFast'); after(1.0, () => subtitle('', '<i>The needle lifts. The pencilled "L." by the speed lever is right beside FAST.</i>', 4200)); }
  if (!fast && !X('voice')) {
    expose('voice');
    after(4.0, () => { heard('real1'); playClip('s_real1', { fx: 'whisper', pos: behindPos(0.5), volume: 1.3, speed: 1.0 }); subtitle('', '<i>Right behind you, a child whispers: "That isn\'t me."</i>', 4200); G.fearT = 0.45; });
  }
}

/* ---------------- V. the plates ---------------- */
function openPlates() {
  if (!S.flags.platesOpen) { flag('platesOpen'); sCreak(POS.plates, 0.5, 0.12, 300); tween(0.6, k => { O.plateLid.rotation.x = -1.9 * k; }); }
  openContainer('Dry plates', 'Three glass negatives in paper sleeves, each with a name pencilled on it. Negatives only show their picture with a strong light behind them.', [
    { name: '"Grandfather"', desc: 'for Mrs Ashdown', read: 'plate_a', verb: 'Hold it to the light' },
    { name: '"Soldier"', desc: 'for Miss Wren', read: 'plate_b', verb: 'Hold it to the light' },
    { name: '"Mother"', desc: 'for Col. Pryor', read: 'plate_c', verb: 'Hold it to the light' },
  ]);
}
function plateSeen(k) {
  if (S.gas !== 'full') return;
  flag('plate_' + k); if (k === 'c') flag('plateMother');
  if (!X('photo')) after(0.3, () => expose('photo'));
}

/* ---------------- the bureau, VI. the rod ---------------- */
function tryBureau() {
  flag('triedBureau');
  openLock({ id: 'bureau', n: 5, letters: true, brass: true, answer: 'AGNES', title: 'Letter lock', sub: 'Five brass rings, each lettered A to Z, set into the fall-front of the bureau.', btn: 'Try the lid', pos: POS.bureau, onOpen: openBureau, failMsg: 'The lid won\'t move.' });
}
function openBureau() {
  flag('bureauOpen'); sCreak(POS.bureau, 0.9, 0.2, 180);
  tween(1.1, k => { O.fall.rotation.x = lerp(-0.46, Math.PI / 2, k); }, () => { renderer.shadowMap.needsUpdate = true; });
  after(1.2, () => subtitle('', '<i>The fall-front comes down to make a writing desk. Pigeonholes full of letters, a blue cloth notebook, and lying across it all, a long black rod with a hook on the end.</i>', 6200));
}
function takeRod() { give('rod'); O.rodIn.visible = false; after(0.6, () => expose('tamb')); }

/* ---------------- the door ---------------- */
function doorActions() {
  if (S.flags.escaped) return [];
  if (has('key')) return [{ label: 'Unlock the door', run: endSequence }, keyholeAct()];
  if (S.flags.keyPushed) return [{ label: 'Draw the newspaper back in', run: pullPaper }, keyholeAct()];
  let a;
  if (S.flags.paperIn) a = has('rod') ? { label: 'Push the key out with the rod', run: pushKey } : look('The newspaper is under the door, a corner showing on your side. Now you need something long and thin to push the key out with.');
  else if (has('paper')) a = { label: 'Slide the newspaper under the door', run: slidePaper };
  else if (has('rod')) a = { label: 'Push the key out with the rod', run: () => subtitle('', '<i>You stop yourself. If the key drops onto the bare boards out there, you\'ll never reach it.</i>', 4600) };
  else a = { label: 'Try the handle', run: () => { flag('triedDoor'); sThunk(POS.door, 0.4, 150); sClick(POS.door, 0.3, 800); subtitle('', '<i>Locked. Madame\'s note said the key is still in the lock, on her side.</i>', 4200); } };
  return [a, keyholeAct()];
}
function keyholeAct() { return { label: 'Look through the keyhole', run: () => { flag('triedDoor'); flag('keyhole'); subtitle('', S.flags.keyPushed ? '<i>You can see through it now: a dark landing, and the bottom of a staircase.</i>' : '<i>You can\'t see through. The end of a key is filling the keyhole: it\'s still in the lock, on the far side.</i>', 4600); } }; }
function slidePaper() {
  flag('paperIn'); S.inv = S.inv.filter(i => i !== 'paper'); renderInv(); save(); O.paperIn.visible = true; sScrape(POS.door, 0.5, 0.15);
  subtitle('', '<i>You unfold the newspaper and slide it under the door, until only a corner is left on your side.</i>', 4600);
}
function pushKey() {
  flag('keyPushed'); sScrape(POS.door, 0.3, 0.1);
  after(0.9, () => { sClick(POS.door, 0.5, 2600); O.keyOut.visible = false; O.keyOnPaper.visible = true; after(0.25, () => sClick(POS.door, 0.35, 3400)); });
  after(1.1, () => subtitle('', '<i>You feed the thin end of the rod into the keyhole and push. Something gives. A key drops on the far side with a soft clink. Onto the paper, you hope.</i>', 5600));
}
function pullPaper() {
  sScrape(POS.door, 0.9, 0.14);
  const px = O.paperIn.position.x, kx = O.keyOnPaper.position.x;
  tween(1.4, k => { O.paperIn.position.x = px + 0.3 * k; O.keyOnPaper.position.x = kx + 0.3 * k; }, () => {
    O.keyOnPaper.visible = false; give('key'); flag('key');
    subtitle('', '<i>You draw the newspaper back under the door, slowly. The key comes with it.</i>', 4200);
  });
}

/* ---------------- slow burn ---------------- */
function midnight() { subtitle('', '<i>Somewhere out in the rain, a church clock strikes midnight.</i>', 5200); for (let i = 0; i < 12; i++) after(1.2 + i * 2.2, () => churchBell(POS.street.clone().add(new THREE.Vector3(8, 6, -12)))); }
function hintWord() {
  const h = HINTS.find(x => x.id !== 'start' && x.when(S) === 'active');
  return h ? { raps: 'CHAIR', slate: 'MIRROR', clock: 'FOUR', hand: 'LIGHT', roses: 'ROSES', voice: 'SLOW', photo: 'PLATES', bureau: 'MOTHER', tamb: 'BUREAU', door: 'PAPER' }[h.id] : null;
}
function spell() {
  if (inView(O.board, 1.0)) return false;
  const w = hintWord(); if (!w || w === S.spelled) return false;
  S.spelled = w; save(); sScrape(POS.table, 1.2, 0.05);
  O.planch.position.set(rand(-0.1, 0.1), 0.013, rand(-0.06, 0.08)); O.planch.rotation.y = rand(-0.6, 0.6); renderer.shadowMap.needsUpdate = true;
  return true;
}
const DIR = { t: 70, last: '' };
const EVENTS = [
  { id: 'upstairs', ok: () => S.exposed.length < 4, run: () => { for (let i = 0; i < 5; i++) after(i * 0.7, () => sKnock(POS.upstairs.clone().add(new THREE.Vector3(i * 0.5, 0, 0)), 0.22, 0, 1)); } },
  { id: 'cab', ok: () => true, run: () => { for (let i = 0; i < 14; i++) after(i * 0.26 + (i % 2) * 0.06, () => sKnock(POS.street.clone().add(new THREE.Vector3(0, -1, -6 + i * 0.9)), 0.16, 0, 1)); } },
  { id: 'gust', ok: () => true, run: () => { V.drapeT = 3; if (A.ready && A.loops.rain) { setGain(A.loops.rain, 0.09, 0.4); after(3, () => setGain(A.loops.rain, 0.045, 1.2)); } } },
  { id: 'dip', ok: () => S.gas !== 'off', run: () => { V.dip = 1.4; } },
  { id: 'rap', ok: () => X('raps') && Math.hypot(P.x - POS.mchair.x, P.z - POS.mchair.z) > 1.2, run: () => { sKnock(POS.under, 0.9, 0, 0); if (!S.heard.includes('raps1')) { heard('raps1'); after(0.6, () => subtitle('', '<i>The table raps once. Yes. Nobody is anywhere near the pedal.</i>', 4200)); } } },
  { id: 'chair', ok: () => S.exposed.length >= 2, run: () => { const c = O.chairs[irand(0, 3)]; if (inView(c, 1.05)) return false; const a = Math.atan2(P.x - c.position.x, P.z - c.position.z) + Math.PI; c.rotation.y = a; c.position.x += rand(-0.05, 0.05); renderer.shadowMap.needsUpdate = true; sScrape(c.position.clone().setY(0.1), 0.35, 0.08); } },
  { id: 'bell', ok: () => S.exposed.length >= 3, run: () => { if (inView(O.bell, 1.0)) return false; handBell(POS.table, 0.35); } },
  { id: 'tamb', ok: () => S.exposed.length >= 4, run: () => { for (let i = 0; i < 6; i++) after(i * 0.07, () => sClick(POS.table, 0.08, 5200 + rand(-400, 400))); } },
  { id: 'spell', ok: () => S.flags.readProg && V.stuckT > 120, run: () => spell() },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || G.ending) return;
  DIR.t -= dt;
  if (DIR.t > 0) return;
  const opts = EVENTS.filter(e => e.id !== DIR.last && e.ok());
  for (let tr = 0; tr < 4 && opts.length; tr++) { const e = opts.splice(Math.floor(Math.random() * opts.length), 1)[0]; if (e.run() !== false) { DIR.last = e.id; break; } }
  DIR.t = rand(55, 95);
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  inter('table', O.table, { name: 'The seance table', actions: () => [S.flags.underSeen && !S.flags.clockKey ? { label: 'Take the clock key', run: takeClockKey } : { label: 'Lift the tablecloth', run: lookUnder }, look('A round table under a heavy red cloth with a gold fringe. The cloth hangs almost to the floor.')] });
  inter('note', O.note, { name: 'Envelope: "To my uninvited guest"', actions: () => [{ label: 'Read it', run: () => openDoc('note') }] }); hitbox('note', O.note, 0.05);
  inter('prog', O.prog, { name: 'Programme card', actions: () => [{ label: 'Read it', run: () => openDoc('prog') }] }); hitbox('prog', O.prog, 0.04);
  inter('slates', O.slates, { name: () => S.flags.slatesOpen ? 'Two slates' : 'Two slates, tied with string', actions: () => S.flags.slatesOpen ? [look('Two ordinary school slates, both blank now.')] : [{ label: 'Untie them and open them', run: openSlates }] }); hitbox('slates', O.slates, 0.03);
  inter('board', O.board, { name: 'Talking board', actions: () => [look(S.spelled ? `The planchette has moved on its own. It has left a trail in the chalk dust on the board, from letter to letter: ${S.spelled.split('').join('-')}.` : 'A varnished board painted with the alphabet, YES and NO, and GOOD BYE. A little heart-shaped planchette sits on it, with a glass eye to read the letters through.')] }); hitbox('board', O.board, 0.02);
  inter('tamb', O.tamb, { name: 'Tambourine', actions: () => [{ label: 'Shake it', run: () => { for (let i = 0; i < 8; i++) after(i * 0.06, () => sClick(POS.table, 0.12, 5000 + rand(-500, 500))); } }, look('A tambourine with red ribbons. Tonight it flew round the room in the dark, jingling over everybody\'s heads.')] }); hitbox('tamb', O.tamb, 0.02);
  inter('bell', O.bell, { name: 'Hand bell', actions: () => [{ label: 'Ring it', run: () => handBell(POS.table, 1) }] }); hitbox('bell', O.bell, 0.03);
  inter('cand', O.cand, { name: 'Candelabrum', actions: () => [look('Three candles, burning low. They were lit before the sitting. They\'ll last another hour, perhaps.')] });
  inter('mchair', O.mchair, { name: 'Madame\'s chair', actions: () => S.flags.pedalFound ? [{ label: 'Press the pedal', run: pressPedal }, look('A tall carved chair, red velvet, with the medium\'s pedal hidden under the seat.')] : [{ label: 'Look under the seat', run: findPedal }, look('Madame\'s chair: tall, carved, red velvet. Her back was to the cabinet all night, and her hands were held by the sitters either side.')] });
  O.chairs.forEach((c, i) => inter('chair' + i, c, { name: 'Chair', actions: () => [look(['Mrs Ashdown\'s chair. A grey glove has been left on the seat.', 'Colonel Pryor\'s chair.', 'Miss Wren\'s chair. There\'s a damp handkerchief on the floor under it.', 'Your chair, the one they gave the gentleman from the Society.'][i])] }));
  inter('mirror', O.mirrorG, { name: 'Looking-glass', reach: 2.6, actions: () => has('flap') || S.flags.readMirror ? [{ label: 'Hold the slate flap up to it', run: () => openDoc('mirror') }, look('An old looking-glass in a gilt frame, freckled at the edges. The room hangs in it, a little darker than the real one.')] : [look('An old looking-glass in a gilt frame, freckled at the edges. The room hangs in it, a little darker than the real one.')] });
  inter('mcard', O.mcard, { name: 'Mourning card', reach: 2.4, actions: () => [{ label: 'Read it', run: () => openDoc('mcard') }] }); hitbox('mcard', O.mcard, 0.03);
  inter('clock', O.clock, { name: 'Mantel clock', reach: 2.4, actions: () => {
    if (S.flags.clockSet) return [look('Ticking again, for the first time in years, by the look of the dust.')];
    if (!has('clockKey')) return [look('A black slate clock. It has stopped at twenty to eight. There\'s a winding hole in the dial, but no key.')];
    return [{ label: 'Wind it and set the hands', run: openClockPanel }];
  } });
  inter('cdrawer', O.clockDrawer, { name: 'Drawer in the clock', reach: 2.4, enabled: () => S.flags.clockSet && O.crankIn.visible, actions: () => [{ label: 'Take the brass crank', run: takeCrank }] }); hitbox('cdrawer', O.clockDrawer, 0.03);
  inter('fire', O.irons, { name: 'Fireplace', actions: () => [look('The fire has been out for hours. Cold ash and a few dead coals.')] });
  inter('tap', O.tap, { name: () => `Gas tap (${S.gas === 'full' ? 'full on' : S.gas === 'low' ? 'turned low' : 'off'})`, actions: gasActions }); hitbox('tap', O.tap, 0.05);
  inter('books', O.books, { name: 'Bookcase', actions: () => [look('Home\'s "Incidents in My Life", a run of "Light", Mrs Hardinge Britten, a Bradshaw, a book of hymns. Every spiritualist in London on one shelf.')] });
  inter('tin', O.tin, { name: 'Tin of paint', actions: () => [{ label: 'Read the label', run: () => openDoc('tin') }] }); hitbox('tin', O.tin, 0.04);
  inter('cab', O.cab, { name: 'Spirit cabinet', actions: () => [look(S.flags.cabOpen ? 'The false back stands open. The phonograph sits in the hollow behind it.' : 'A tall black cabinet with velvet curtains, where the spirits "appear". Six carved roses run down the two front posts, three on each side.')] });
  O.roses.forEach((r, i) => { inter('rose' + (i + 1), r, { name: 'Carved rose', reach: 2.2, actions: () => S.flags.cabOpen ? [look('A carved wooden rose. It moves in and out a little, like a button.')] : [{ label: 'Press it', run: () => pressRose(i + 1) }] }); hitbox('rose' + (i + 1), r, 0.02); });
  inter('phono', O.phono, { name: () => `Phonograph (speed: ${S.speed.toUpperCase()})`, enabled: () => S.flags.cabOpen, reach: 2.2, actions: () => {
    const a = [];
    if (!S.flags.crankFitted) a.push(has('crank') ? { label: 'Fit the crank and wind it', run: fitCrank } : look('An Edison phonograph with a brown wax cylinder on it, its horn pointed out through the curtains. The winding crank is missing: there\'s an empty square socket in the side.'));
    else a.push({ label: V.phono ? 'Listen' : 'Play the cylinder', run: () => playPhono() });
    a.push({ label: `Move the speed lever to ${S.speed === 'fast' ? 'SLOW' : 'FAST'}`, run: toggleSpeed });
    return a;
  } }); hitbox('phono', O.phono, 0.04);
  inter('bureau', O.bureau, { name: 'Bureau', actions: () => S.flags.bureauOpen ? [look('Madame\'s bureau, open. Letters, bills, and her appointments for next week.')] : [{ label: 'Try the fall-front', run: tryBureau }, look('A mahogany bureau. The sloping lid is held shut by a brass letter lock with five rings.')] });
  inter('bbook', O.blueBook, { name: 'Blue notebook', enabled: () => S.flags.bureauOpen, actions: () => [{ label: 'Read it', run: () => { openDoc('bluebook'); if (!S.ev.real2) { S.ev.real2 = true; save(); after(8, () => { heard('real2'); playClip('s_real2', { fx: 'whisper', pos: behindPos(0.45), volume: 1.2 }); subtitle('', '<i>Very close to you, a child\'s voice: "She never heard me."</i>', 4200); }); } } }] }); hitbox('bbook', O.blueBook, 0.04);
  inter('rod', O.rodIn, { name: 'Black rod', enabled: () => S.flags.bureauOpen && !has('rod'), actions: () => [{ label: 'Take it', run: takeRod }] }); hitbox('rod', O.rodIn, 0.03);
  inter('camera', O.cam, { name: 'Camera', actions: () => [look('A mahogany field camera on its tripod, aimed at the table and the door beyond it. The lens cap is off and the flash tray is loaded with magnesium powder, ready.')] });
  inter('plates', O.plateBox, { name: 'Box of glass plates', actions: () => [{ label: S.flags.platesOpen ? 'Look at the plates' : 'Open it', run: openPlates }] }); hitbox('plates', O.plateBox, 0.04);
  inter('paper', O.paper, { name: 'Newspaper', enabled: () => !has('paper') && !S.flags.paperIn, actions: () => [{ label: 'Read it', run: () => openDoc('argus') }, { label: 'Take it', run: () => { give('paper'); O.paper.visible = false; } }] }); hitbox('paper', O.paper, 0.04);
  inter('door', O.door, { name: 'Parlour door', actions: doorActions });
  inter('window', O.pelmet, { name: 'Window', actions: () => [look('Heavy velvet drapes, pulled almost shut. Through the gap: rain, and a street lamp across the road.')] });
  inter('sphoto', O.photoFrame, { name: 'Framed photograph', actions: () => [{ label: 'Look at it', run: () => openDoc('sphoto') }] });
  inter('lilypic', O.lilyPic, { name: 'Photograph of a little girl', actions: () => [look('A little girl in a white dress with ringlets, about six. Written on the mount: "Lily, Christmas 1887".')] });
  inter('madpic', O.madamePic, { name: 'Photograph of a woman', actions: () => [look('Madame Kell, younger, in full mourning black. She isn\'t looking at the camera.')] });
  inter('sofa', O.sofa, { name: 'Chaise', actions: () => [look('Green velvet, worn shiny where people have sat and waited to be told their dead were happy.')] });
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: ['notes'], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    gas: 'low', exposed: [], clock: { h: 7, m: 40 }, speed: 'fast', roses: [], spelled: null, ev: {} };
}
function applyState() {
  const f = S.flags;
  V.gasK = GAS[S.gas]; O.tapLever.rotation.x = S.gas === 'full' ? -0.9 : S.gas === 'low' ? -0.35 : 0.5;
  O.clockKey.visible = !f.clockKey;
  O.slateString.visible = !f.slatesOpen; O.flap.visible = false;
  if (f.slatesOpen) { O.slateHi.position.set(-0.05, 0.022, 0.2); O.slateHi.rotation.x = -Math.PI * 0.98; } else { O.slateHi.position.set(0, 0.022, 0); O.slateHi.rotation.x = 0; }
  drawHands(); V.clockRun = !!f.clockSet; O.crankIn.visible = !!f.clockSet && !has('crank') && !f.crankFitted; O.clockDrawer.position.z = O.crankIn.visible ? 0.09 : 0;
  O.backPanel.rotation.y = f.cabOpen ? 1.35 : 0;
  O.crankOn.visible = !!f.crankFitted; O.lever.rotation.z = S.speed === 'fast' ? -0.5 : 0.5;
  O.plateLid.rotation.x = f.platesOpen ? -1.9 : 0;
  O.fall.rotation.x = f.bureauOpen ? Math.PI / 2 : -0.46; O.rodIn.visible = !has('rod');
  O.paper.visible = !has('paper') && !f.paperIn; O.paperIn.visible = !!f.paperIn; O.keyOut.visible = !f.keyPushed; O.keyOnPaper.visible = !!f.keyPushed && !f.key;
  if (f.key) { O.paperIn.position.x = -W + 0.32; }
  O.doorPivot.rotation.y = 0; O.colDoor.on = true;
  O.childHand.visible = false;
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDone = false;
}

/* ---------------- sound ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.rain) return;
  A.loops.rain = loopNoise({ pos: POS.window, type: 'bandpass', f: 1500, q: 0.35, vol: 0.045, wet: 0.25, ref: 1.5 });
  A.loops.rainLo = loopNoise({ pos: POS.window, type: 'lowpass', f: 260, q: 0.6, vol: 0.03, brown: true, wet: 0.2, ref: 1.5 });
  A.loops.room = loopNoise({ type: 'lowpass', f: 140, q: 0.7, vol: 0.03, brown: true, wet: 0.1 });
  A.loops.gas = loopNoise({ pos: POS.gas, type: 'highpass', f: 3800, q: 0.5, vol: 0, wet: 0.05, ref: 0.8 });
  A.loops.phono = loopNoise({ pos: POS.back, type: 'bandpass', f: 3200, q: 0.8, vol: 0, wet: 0.1, ref: 0.6 });
  const ctx = A.ctx, tg = ctx.createGain(); tg.gain.value = 0; [55, 82.4, 110.3].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = rand(-6, 6); o.connect(tg); o.start(); }); route(tg, { wet: 0.6 }); A.loops.tension = { gain: tg };
}

/* ---------------- per-frame ---------------- */
function roomUpdate(dt) {
  const t = G.time;
  // gaslight (with the odd dip), the globes, the wall brackets
  V.dip = Math.max(0, V.dip - dt); const dip = V.dip > 0 ? 0.45 + Math.sin(V.dip * 20) * 0.2 : 1;
  V.gasK = lerp(V.gasK, GAS[S.gas], Math.min(1, dt * 5));
  const g = V.gasK * dip, flick = 1 + Math.sin(t * 13.1) * 0.012 + Math.sin(t * 29.7) * 0.008;
  L.gas.intensity = g * 30 * flick; L.sconce.forEach(l => l.intensity = g * 3.2 * flick);
  O.globes.forEach(b => b.material.emissiveIntensity = g * 1.6);
  O.sconces.forEach(s => { s.gb.material.emissiveIntensity = g * 1.4; s.f.visible = g > 0.04; s.f.scale.set(0.008 + g * 0.012, 0.014 + g * 0.022, 1); });
  O.gasFlames.forEach(f => { f.visible = g > 0.04; f.scale.set(0.012 + g * 0.02, 0.022 + g * 0.035, 1); });
  L.hemi.intensity = 0.03 + g * 0.08;
  // candles
  let ck = 0;
  O.flames.forEach(f => { const k = 0.85 + Math.sin(t * 9 + f.ph) * 0.06 + Math.sin(t * 23 + f.ph * 2) * 0.05 + (Math.random() - 0.5) * 0.06; ck += k; f.fl.scale.set(0.02 * k, 0.046 * k, 1); f.fl.position.y = f.base + (k - 0.9) * 0.004; f.gl.material.opacity = 0.3 * k; });
  L.cand.intensity = 1.5 * ck / 3;
  // luminous paint: charged by strong light, glows in the dark, fades
  if (S.gas === 'full' && V.gasK > 0.8) V.charge = Math.min(1, V.charge + dt / 3.5);
  else V.charge = Math.max(0, V.charge - dt / (S.gas === 'off' ? 80 : 45));
  const dark = S.gas === 'off' ? 1 - V.gasK / 0.35 : 0;
  V.glow = lerp(V.glow, V.charge * clamp(dark, 0, 1), Math.min(1, dt * 3));
  O.lum.forEach(m => m.material.opacity = V.glow * 0.95); L.lum.intensity = V.glow * 0.35;
  if (V.glow > 0.3 && !S.flags.glowSeen && inView(O.lumEye, 0.9) && !G.uiOpen) {
    V.glowSeenT += dt;
    if (V.glowSeenT > 0.5) { flag('glowSeen'); heard('glow'); expose('hand'); subtitle('', '<i>In the dark the cabinet comes alive: a pale green hand glows on the top of it, and small numbers shine beside four of the carved roses.</i>', 6400); }
  }
  // in the dark, after you've seen the paint: a small hand on the tablecloth that nobody painted
  if (S.gas === 'off' && S.flags.glowSeen && V.gasK < 0.05 && !G.ending) {
    V.childHand = Math.min(1, V.childHand + dt * 0.25); O.childHand.visible = true; O.childHand.material.opacity = V.childHand * 0.8;
    if (V.childHand > 0.6 && !S.ev.childHand && inView(O.childHand, 0.8)) { S.ev.childHand = true; save(); subtitle('', '<i>On the tablecloth, where nobody painted anything, a small hand is glowing. A child\'s.</i>', 5200); G.fearT = 0.35; }
  } else { V.childHand = Math.max(0, V.childHand - dt); O.childHand.material.opacity = V.childHand * 0.8; if (V.childHand <= 0) O.childHand.visible = false; }
  // the clock, once it's going
  if (V.clockRun) { V.tickT -= dt; if (V.tickT <= 0) { V.tickT = 1; V.tickA ^= 1; sClick(POS.clock, 0.05, V.tickA ? 3200 : 2700); } O.pend.rotation.z = Math.sin(t * Math.PI) * 0.2; }
  // drapes breathe in the gusts
  V.drapeT = Math.max(0, V.drapeT - dt);
  // sound levels
  if (A.ready && A.loops.gas) { setGain(A.loops.gas, g * 0.012, 0.2); setGain(A.loops.tension, 0.0012 + S.exposed.length * 0.0006, 2); }
  // refresh the reflections when the light changes a lot (desktop only)
  if (V.envT > 0) { V.envT -= dt; if (V.envT <= 0 && !IS_TOUCH) V.envDone = false; }
  // the slow burn
  const pk = S.exposed.length + ':' + Object.keys(S.flags).length; if (pk !== V.progKey) { V.progKey = pk; V.stuckT = 0; } else V.stuckT += dt;
  director(dt);
}

/* ---------------- ending ---------------- */
function endSequence() {
  flag('escaped'); G.ending = true; G.cutscene = true; releasePointer();
  sClick(POS.door, 0.5, 1100); after(0.25, () => sThunk(POS.door, 0.5, 200));
  S.inv = S.inv.filter(i => i !== 'key'); renderInv();
  O.colDoor.on = false;
  after(0.8, () => { sCreak(POS.door, 1.8, 0.35, 80); tween(1.8, k => { O.doorPivot.rotation.y = -1.45 * k; }); });
  const x0 = P.x, z0 = P.z, y0 = G.yaw, p0 = G.pitch, yOut = Math.PI / 2;
  after(1.2, () => tween(1.8, k => { P.x = lerp(x0, -W + 0.35, k); P.z = lerp(z0, DOOR.z + 0.05, k); G.yaw = y0 + wrapA(yOut - y0) * k; G.pitch = lerp(p0, 0, k); }));
  after(3.4, () => { subtitle('', '<i>The landing is dark and cold. The stairs go down to the street door.</i>', 3200); });
  after(5.0, () => {
    // behind you, the camera goes off by itself
    L.flash.intensity = 900; G.flash = 0.55; sFlash(); tween(0.5, k => { L.flash.intensity = 900 * (1 - k); G.flash = 0.55 * (1 - k); });
    subtitle('', '<i>Behind you there is a soft thump and a white flash: the camera\'s flash powder has gone off, all by itself.</i>', 4200);
  });
  after(7.0, () => tween(1.4, k => { G.yaw = yOut - Math.PI * k; }));
  after(8.8, () => { playClip('s_real3', { fx: 'whisper', pos: POS.mchair.clone().setY(1.0), volume: 1.2 }); subtitle('', '<i>From the empty chair at the head of the table, very softly: "Thank you."</i>', 3600); });
  after(12.0, () => { G.blackT = 1; });
  after(13.4, showEnd);
}
function sFlash() { if (!A.ready) return; const s = noiseSrc(false), g = A.ctx.createGain(), f = filt('lowpass', 1200, 0.7); s.connect(f); f.connect(g); g.gain.setValueAtTime(0.35, now()); g.gain.exponentialRampToValueAtTime(0.001, now() + 0.7); route(g, { pos: POS.camera, wet: 0.35 }); s.start(); s.stop(now() + 0.8); sThunk(POS.camera, 0.4, 70); }
function wrapA(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
// the last plate in the camera: the room from the lens, with a double exposure nobody set up
function endFrame() {
  let url = null;
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, aspect: cam.aspect };
    O.doorPivot.rotation.y = -1.45; O.flap.visible = false; L.flash.intensity = 0; S.gas = S.gas === 'off' ? 'low' : S.gas;
    V.gasK = GAS[S.gas]; roomUpdate(0);
    O.you.visible = true; O.ghost.visible = false;
    cam.fov = 52; cam.updateProjectionMatrix(); updateProj(); cam.position.set(POS.camera.x - 0.45, 1.38, POS.camera.z + 0.02); cam.lookAt(-2.2, 1.0, 0.55); cam.updateMatrixWorld();
    L.flash.intensity = 32;   // the flash lights the room from the camera
    G.blackT = 0; G.black = 0; post.uniforms.black.value = 0; post.uniforms.flash.value = 0; post.uniforms.fear.value = 0; post.uniforms.red.value = 0;
    
    renderer.shadowMap.needsUpdate = true; render(0.016); 
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360;
    const grab = () => { const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d'); const sa = Math.min(cw / Wd, ch / Ht); const sw = Wd * sa, sh = Ht * sa; g.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht); return c; };
    const A1 = grab(); 
    // the ghost alone, on black
    const shown = []; scene.traverse(o => { if ((o.isMesh || o.isSprite) && o.visible && !isIn(o, O.ghost)) { shown.push(o); o.visible = false; } });
    O.ghost.visible = true; const bg = scene.background; scene.background = new THREE.Color(0); render(0.016); const B = grab(); 
    shown.forEach(o => o.visible = true); O.ghost.visible = false; O.you.visible = false; scene.background = bg; L.flash.intensity = 0;
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.updateProjectionMatrix(); updateProj();
    // double-expose, then make it a sepia print
    const c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d');
    g.filter = 'blur(0.6px)'; g.drawImage(A1, 0, 0); g.filter = 'blur(1.6px)'; g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.62; g.drawImage(B, 0, 0); g.filter = 'blur(6px)'; g.globalAlpha = 0.35; g.drawImage(B, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const d = g.getImageData(0, 0, Wd, Ht);
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
      const i = (y * Wd + x) * 4; let l = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) / 255;
      const dx = x / Wd - 0.5, dy = y / Ht - 0.5, v = 1 - clamp((dx * dx * 1.2 + dy * dy * 1.6) * 2.6 - 0.25, 0, 1);
      l = clamp((Math.pow(l, 1.05) - 0.03) * 1.3, 0, 1) * (0.2 + 0.8 * v) + (Math.random() - 0.5) * 0.06;
      d.data[i] = clamp(34 + l * 214, 0, 255); d.data[i + 1] = clamp(24 + l * 176, 0, 255); d.data[i + 2] = clamp(14 + l * 118, 0, 255);
    }
    g.putImageData(d, 0, 0);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(250,236,200,${rand(0.05, 0.16)})`; g.lineWidth = rand(0.5, 1.2); g.beginPath(); const x = rand(0, Wd); g.moveTo(x, rand(0, Ht)); g.lineTo(x + rand(-8, 8), rand(0, Ht)); g.stroke(); }
    url = c.toDataURL('image/jpeg', 0.86); 
  } catch (e) { console.warn(e); }
  return url;
}
function isIn(o, root) { while (o) { if (o === root) return true; o = o.parent; } return false; }
function showEnd() { finishRoom(endFrame()); }

/* ---------------- the figures for the last plate ---------------- */
function mergeParts(parts) {
  const pos = [], nor = [], col = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
const m4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
function buildFigures() {
  // you, in the doorway, seen from behind: a dark overcoat and a hat
  const P1 = [], a1 = (geo, color, m) => P1.push({ geo, color, m });
  a1(new THREE.CylinderGeometry(0.2, 0.3, 1.25, 16), 0x16130f, m4(0, 0.72, 0, 0, 0, 0, 1, 1, 0.7)); a1(new THREE.SphereGeometry(0.1, 14, 10), 0x2a2220, m4(0, 1.58, 0, 0, 0, 0, 0.9, 1.1, 1));
  a1(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 16), 0x0c0b0a, m4(0, 1.71, 0)); a1(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 20), 0x0c0b0a, m4(0, 1.65, 0));
  a1(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 8), 0x16130f, m4(-0.24, 1.08, 0.06, -0.5, 0, 0.1)); a1(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 8), 0x16130f, m4(0.24, 1.08, 0, 0, 0, -0.08));
  O.you = new THREE.Mesh(mergeParts(P1), std({ vertexColors: true, roughness: 0.9 })); O.you.position.set(-W - 0.15, 0, DOOR.z + 0.05); O.you.rotation.y = Math.PI / 2; O.you.visible = false; noRay(O.you); scene.add(O.you);
  // Lily, standing beside Madame's chair with her hands folded; she fades out towards the floor
  const P2 = [], a2 = (geo, color, m) => P2.push({ geo, color, m });
  a2(new THREE.CylinderGeometry(0.1, 0.26, 0.62, 18), 0xffffff, m4(0, 0.62, 0)); a2(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 16), 0xffffff, m4(0, 1.02, 0, 0, 0, 0, 1, 1, 0.8));
  a2(new THREE.SphereGeometry(0.095, 18, 14), 0xf4f0ea, m4(0, 1.3, 0.01, 0, 0, 0, 0.92, 1.1, 1));
  for (const sx of [-1, 1]) { for (let k = 0; k < 3; k++) a2(new THREE.SphereGeometry(0.028, 8, 6), 0xe0d8c8, m4(sx * (0.085 + k * 0.006), 1.26 - k * 0.05, -0.01, 0, 0, 0, 1, 1.4, 1)); a2(new THREE.CylinderGeometry(0.028, 0.026, 0.3, 8), 0xffffff, m4(sx * 0.1, 0.98, 0.05, 0.5, 0, sx * 0.35)); }
  a2(new THREE.SphereGeometry(0.04, 10, 8), 0xf4f0ea, m4(0, 0.86, 0.1));
  const gg = mergeParts(P2), cc = gg.attributes.color, pp = gg.attributes.position;
  for (let i = 0; i < cc.count; i++) { const k = clamp((pp.getY(i) - 0.25) / 0.75, 0, 1); cc.setXYZ(i, cc.getX(i) * k, cc.getY(i) * k, cc.getZ(i) * k); }
  O.ghost = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ vertexColors: true })); O.ghost.position.set(POS.mchair.x - 0.3, 0, TB.z + 0.62); O.ghost.rotation.y = Math.PI / 2 + 0.15; O.ghost.visible = false; noRay(O.ghost); scene.add(O.ghost);
  // a small glowing handprint on the tablecloth (in the dark only)
  O.childHand = plane(0.12, 0.12, M.lum.clone(), TB.x + 0.3, TB.y + 0.008, TB.z + 0.3); O.childHand.rotation.x = -Math.PI / 2; O.childHand.rotation.z = 0.6; O.childHand.material.map = T.childHand; layer1(O.childHand); O.childHand.visible = false;
  // a point to aim look-checks at, in the middle of the cabinet front
  O.lumEye = new THREE.Object3D(); O.lumEye.position.set(CAB.x1, 1.6, (CAB.z0 + CAB.z1) / 2); scene.add(O.lumEye);
}

/* ---------------- title: a talking board by candlelight ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const Wd = 480, Ht = 270, f = 0.92 + Math.sin(t * 9) * 0.04 + Math.sin(t * 23.3) * 0.03 + Math.sin(t * 2.1) * 0.02;
  g.fillStyle = '#080404'; g.fillRect(0, 0, Wd, Ht);
  const cx = 350, cy = 118;
  const gr = g.createRadialGradient(cx, cy, 2, cx, cy + 40, 260 * f); gr.addColorStop(0, 'rgba(255,190,110,0.5)'); gr.addColorStop(0.25, 'rgba(170,70,30,0.28)'); gr.addColorStop(1, 'rgba(20,6,4,0)'); g.fillStyle = gr; g.fillRect(0, 0, Wd, Ht);
  // the board, in perspective
  g.save(); g.translate(cx - 10, 205); g.scale(1, 0.42);
  g.fillStyle = `rgba(150,105,55,${0.55 * f})`; g.beginPath(); g.ellipse(0, 0, 150, 120, 0, 0, TAU); g.fill();
  g.fillStyle = `rgba(30,18,8,${0.85})`; g.font = `700 22px ${PLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  'ABCDEFGHIJKLM'.split('').forEach((c, i) => { const a = Math.PI * (1.15 + 0.7 * i / 12); g.fillText(c, Math.cos(a) * 118, 40 + Math.sin(a) * 92); });
  g.restore();
  // the planchette drifting
  const px = cx - 10 + Math.sin(t * 0.37) * 60, py = 190 + Math.sin(t * 0.23) * 6;
  g.fillStyle = 'rgba(70,35,15,0.95)'; g.beginPath(); g.ellipse(px, py, 20, 9, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,220,160,0.35)'; g.beginPath(); g.ellipse(px, py - 1, 5, 2.5, 0, 0, TAU); g.fill();
  // the candle
  g.fillStyle = '#e8dcc0'; g.fillRect(cx - 4, cy + 8, 8, 50); const fl = g.createRadialGradient(cx, cy, 0, cx, cy, 16 * f); fl.addColorStop(0, 'rgba(255,245,220,1)'); fl.addColorStop(0.4, 'rgba(255,190,90,0.7)'); fl.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = fl; g.beginPath(); g.ellipse(cx, cy, 7 * f, 16 * f, 0, 0, TAU); g.fill();
}

/* ---------------- the room module ---------------- */
return {
  id: 'sitting', title: 'The Last Sitting', saveKey: 'lethe.roomsitting.v1',
  DOCS, ITEMS, HEARD: Object.assign(HEARD, { glow: { title: 'Seen in the dark, on the spirit cabinet', text: 'A glowing hand on the top of the cabinet, and glowing numbers by four of the six carved roses: <b>1</b> by the right-hand middle rose, <b>2</b> by the left-hand top rose, <b>3</b> by the right-hand bottom rose, <b>4</b> by the left-hand bottom rose.' } }),
  HINTS, openDoc, inspectItem, titleFx,
  penalty() { G.lockout = G.time + 5; V.dip = 1.6; after(0.6, () => { sKnock(POS.under, 0.9, 0, 0); after(0.5, () => sKnock(POS.under, 0.9, 0, 0)); }); subtitle('', '<i>The gas gutters. Under the table, two raps. No.</i>', 3200); },
  markSkip: ['start'], markMerge: { clock: 'slate', roses: 'hand', bureau: 'photo' },
  backText: 'Back in the parlour.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Crouch', 'C'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (G.cutscene) return; G.crouch = !G.crouch; G.eyeT = G.crouch ? 0.85 : 1.62; },
  update: roomUpdate,
  preRender() {
    if (!V.envDone) { V.envDone = true; V.envGas = S ? S.gas : 'low'; const hide = [O.mirror]; hide.forEach(o => o.visible = false); if (scene.environment) scene.environment.dispose(); scene.environment = envFromScene(new THREE.Vector3(0.3, 1.5, 0.6)).texture; hide.forEach(o => o.visible = true); }
    O.mirror.userData.update();
  },
  build() {
    makeTextures(); makeMaterials(); buildRoom(); buildFigures(); paintThings(); registerInteractions();
    // everything that never moves and can't be used becomes a handful of big meshes
    [O.paperIn, O.keyOnPaper, O.you, O.ghost].forEach(o => o.userData.keep = true);
    
    mergeStatic(scene);
    
  },
  defaults, applyState, startAmbience,
  spawn: { x: -1.6, z: -1.1, yaw: -Math.PI / 2 },
  wake() {
    P.x = -1.75; P.z = -1.1; G.yaw = -Math.PI / 2 - 0.25; G.pitch = -0.12; G.eye = G.eyeT = 1.62;
    G.cutscene = true; $('#fx').className = 'lids';
    sScrape(POS.cab, 1.2, 0.12);
    after(0.8, () => subtitle('', '<i>You step out from behind the cabinet curtain. The sitters have gone. The gas has been turned down low, and the candles on the table are still burning.</i>', 6000));
    after(2.4, () => { sClick(POS.door, 0.3, 700); sThunk(POS.door, 0.3, 160); });
    after(3.6, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); subtitle('', '<i>Out on the landing, a key turns in the parlour door. Footsteps go away down the stairs. On the table, an envelope is propped against the candlestick.</i>', 6400); toast(ctrlHint(), 7000); });
  },
  debug: { O, L, V, T, M, expose, setGas, openCabinet, openBureau, playPhono, endFrame, endSequence, pressRose, startClock, spell, midnight, ROSE_ORDER },
};

})();
