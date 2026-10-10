const ROOM_NIGHT = (() => {

/* =====================================================================
   MYSTERY #5 — "NIGHT MAIL"  ·  Inspection Saloon No. 9, Kasheli Ghat, tonight
   part A: layout, noise, textures, materials (realistic: PBR, lamplight, a moving world)
   The saloon stands still at the origin and the world runs past it toward +z.
   Front of the train is -z, the rear balcony is +z.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {};
const TEKO = 'Teko, "Oswald", "Arial Narrow", sans-serif', DEVA = '"Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
const CORM = '"Cormorant Garamond", Georgia, serif', PLAY = '"Playfair Display", Georgia, serif', FELL = '"IM Fell English", Georgia, serif';
const HW = 1.45, ZF = -5.2, ZR = 5.2;               // interior half-width; front (gangway) and rear (balcony) end walls
const WALL_H = 2.12, ROOF_H = 2.7;                  // side walls rise to WALL_H, the arched roof crowns at ROOF_H
const RAIL = -1.22, GAUGE = 1.676;                  // top of rail below the saloon floor; broad gauge
const PART = -3.9;                                  // partition between the vestibule and the lounge
const PDOOR = { x0: -0.8, x1: 0.15 };               // opening in the partition
const WC = { x0: 0.25, x1: HW, z0: PART, z1: -2.2, dz0: -2.95, dz1: -2.35 };   // washroom box and its door (west face)
const WIN = { y0: 0.86, y1: 1.76, w: 0.74 };        // side windows
const WINZ = [-1.35, 0.35, 2.05, 3.65];
const RWIN = { y0: 0.8, y1: 1.92, xs: [[-1.34, -0.5], [0.5, 1.34]] };   // the two rear windows either side of the rear door
const RDOOR = { x0: -0.42, x1: 0.42, h: 2.02 };
const CDOOR = { x0: -0.38, x1: 0.38, h: 2.0 };       // connecting door at the front
const DESK = { x0: 0.8, x1: HW, z0: 2.95, z1: 4.15, h: 0.76 };
const BALC = { z0: ZR, z1: ZR + 0.95 };
const LAMP = new THREE.Vector3(1.12, 0.46, ZR + 0.86);   // the tail lamp, on the balcony's right corner post
const POS = {
  cdoor: new THREE.Vector3(0, 1.2, ZF + 0.05), slip: new THREE.Vector3(-0.95, 1.0, ZF + 0.12), box: new THREE.Vector3(0.9, 0.3, ZF + 0.25),
  bells: new THREE.Vector3(0.85, 1.9, PART - 0.05), wcMirror: new THREE.Vector3(0.58, 1.45, PART + 0.03), basin: new THREE.Vector3(0.58, 0.82, PART + 0.25),
  geyser: new THREE.Vector3(1.3, 1.95, -3.4), desk: new THREE.Vector3(1.1, 0.8, 3.55), rwin: new THREE.Vector3(0.92, 1.35, ZR - 0.02),
  rdoor: new THREE.Vector3(0, 1.3, ZR), brake: new THREE.Vector3(-1.18, 0.95, ZR - 0.3), lamp: LAMP, roof: new THREE.Vector3(0, ROOF_H + 0.3, 1.0),
  under: new THREE.Vector3(0, -0.6, 0.0), engine: new THREE.Vector3(0, 2.5, -160), balcony: new THREE.Vector3(0, 1.3, ZR + 0.5),
  gangway: new THREE.Vector3(0, 1.2, ZF - 0.6), clock: new THREE.Vector3(-0.3, 2.3, PART + 0.03), profile: new THREE.Vector3(HW - 0.02, 1.35, 1.2),
  photo: new THREE.Vector3(-HW + 0.02, 1.45, -0.5), umbrella: new THREE.Vector3(1.22, 0.4, PART - 0.22),
};

/* ---------------- noise ---------------- */
const NP = new Uint8Array(512); { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) NP[i] = p[i & 255]; }
const fade = t => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
  const a = NP[NP[X] + Y] / 255, b = NP[NP[X + 1] + Y] / 255, c = NP[NP[X] + Y + 1] / 255, d = NP[NP[X + 1] + Y + 1] / 255, u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// tileable value noise: period in lattice cells
function tnoise(x, y, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => NP[NP[((i % px) + px) % px & 255] + (((j % py) + py) % py & 255)] / 255;
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += vnoise(x * f, y * f) * a; f *= 2.03; a *= 0.5; } return s; }
// tileable fbm over a w x h texture with base cell count c
function tfbm(x, y, w, h, c, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += tnoise(x / w * c * f, y / h * c * f, c * f, c * f) * a; f *= 2; a *= 0.5; } return s; }
function pix(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y), i = (y * w + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] ?? 255; } g.putImageData(img, 0, 0); return c; }
function tex(c, { srgb = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t; }
function canv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------------- textures ---------------- */
function makeTextures() {
  // teak: straight golden grain along u; one span = 1 m
  const wood = (dark, light, n = 512, figure = 1) => pix(n, n, (x, y) => {
    const u = x / n, v = y / n;
    const warp = tfbm(x, y, n, n, 3, 3) * 2.2 * figure + tfbm(x, y, n, n, 1, 2) * 1.2;
    let gr = Math.sin((v * 52 + warp) * Math.PI) * 0.5 + 0.5; gr = Math.pow(gr, 2.2);
    const fl = tfbm(x * 6, y * 30, n, n, 4, 2), pore = tnoise(x / n * 256, y / n * 1024, 256, 1024) > 0.74 ? 1 : 0;
    const t = 0.5 * gr + 0.35 * fl + 0.15 * tfbm(x, y, n, n, 4, 2);
    const c = mixc(dark, light, t); const p = pore ? 0.84 : 1; return [c[0] * p, c[1] * p, c[2] * p];
  });
  const woodRough = (n = 256) => pix(n, n, (x, y) => { const v = y / n; const warp = tfbm(x, y, n, n, 3, 3) * 2.2; const gr = Math.pow(Math.sin((v * 52 + warp) * Math.PI) * 0.5 + 0.5, 2.2); const r = 110 + gr * 40 + tfbm(x, y, n, n, 6, 2) * 40; return [r, r, r]; });
  T.teak = tex(wood([74, 46, 26], [142, 98, 60]));
  T.teakR = tex(woodRough(), { srgb: false });
  T.teakDark = tex(wood([40, 24, 14], [90, 56, 32]));
  // burr walnut for the inlaid panels
  T.burr = tex(pix(512, 512, (x, y) => {
    const n = tfbm(x, y, 512, 512, 8, 5), m = tfbm(x + 97, y + 31, 512, 512, 24, 3);
    const eyes = Math.pow(Math.max(0, tfbm(x, y, 512, 512, 40, 2) - 0.55) * 3, 2);
    let t = Math.sin((n * 14 + m * 4) * Math.PI) * 0.5 + 0.5; t = 0.55 * t + 0.45 * m - eyes * 0.7;
    return mixc([60, 38, 22], [118, 80, 48], clamp(t, 0, 1));
  }), { repeat: [3, 3] });
  // carpet: deep red field, small gold lozenges, a dark border band down each side of the runner
  T.carpet = tex(canv(512, 1024, (g, w, h) => {
    g.fillStyle = '#4a1214'; g.fillRect(0, 0, w, h);
    for (let y = 16; y < h; y += 64) for (let x = 64 + ((y / 64) % 2) * 32; x < w - 50; x += 64) { g.fillStyle = '#5e1a18'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 14, y); g.lineTo(x, y + 18); g.lineTo(x - 14, y); g.fill(); g.fillStyle = '#b08840'; g.fillRect(x - 2, y - 2, 4, 4); }
    for (const x0 of [0, w - 46]) { g.fillStyle = '#1e1a22'; g.fillRect(x0, 0, 46, h); g.fillStyle = '#9c7a3a'; g.fillRect(x0 + (x0 ? 0 : 40), 0, 4, h); for (let y = 10; y < h; y += 32) { g.fillStyle = '#6a1a18'; g.beginPath(); g.arc(x0 + 23, y, 7, 0, TAU); g.fill(); } }
    const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const px = (i / 4) % w, py = Math.floor(i / 4 / w); const n = 0.8 + tnoise(px / 1.4, py / 1.4, w / 1.4 | 0, h / 1.4 | 0) * 0.2 + (tfbm(px, py, w, h, 6, 2) - 0.5) * 0.2; const wear = Math.max(0, tfbm(px + 50, py, w, h, 3, 3) - 0.5) * (1 - Math.abs(px / w - 0.5) * 2) * 1.3; for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, d.data[i + k] * n * (1 - wear * 0.35) + wear * 26); } g.putImageData(d, 0, 0);
  }));
  T.pileN = heightToNormal(pix(256, 256, (x, y) => { const v = 120 + tnoise(x / 1.2, y / 1.2, 213, 213) * 110; return [v, v, v]; }), 1.2); T.pileN.repeat.set(8, 16);
  // floor boards (teak) under the carpet edges and in the vestibule
  T.boards = tex(pix(512, 512, (x, y) => {
    const bw = 64, b = Math.floor(x / bw), bx = (x % bw) / bw, seg = Math.floor((y / 512 + NP[b] / 255) * 2);
    const warp = tfbm(x, y, 512, 512, 3, 3) * 2; let gr = Math.pow(Math.sin((bx * 5 + y / 512 * 3 + warp + seg) * Math.PI) * 0.5 + 0.5, 2);
    let c = mixc([62, 34, 16], [118, 70, 34], 0.5 * gr + 0.5 * tfbm(x * 4, y, 512, 512, 6, 2));
    if (Math.min(bx, 1 - bx) * bw < 1.4) c = c.map(q => q * 0.4);
    return c;
  }));
  // cream enamel ceiling with a faint crackle
  T.ceil = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 6, 4), cr = Math.abs(tnoise(x / 9, y / 9, 28, 28) - 0.5) < 0.012 ? 0.9 : 1; const v = (218 + n * 22) * cr; return [v, v * 0.95, v * 0.84]; }));
  // buttoned green leather
  T.leatherN = heightToNormal(canv(256, 256, (g, w, h) => {
    g.fillStyle = '#909090'; g.fillRect(0, 0, w, h);
    for (let y = 0; y <= h; y += 64) for (let x = (y / 64 % 2) * 32; x <= w; x += 64) { const gr = g.createRadialGradient(x, y, 0, x, y, 36); gr.addColorStop(0, '#303030'); gr.addColorStop(0.18, '#707070'); gr.addColorStop(1, 'rgba(200,200,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 36, 0, TAU); g.fill(); }
    speckle(g, w, h, 5000, 0.12, '255,255,255', 1);
  }), 3); T.leatherN.repeat.set(3, 3);
  T.leather = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 5, 4), crease = tfbm(x * 3, y * 3, 256, 256, 8, 2); const c = mixc([20, 40, 30], [42, 68, 50], n * 0.7 + crease * 0.3); return c; }), { repeat: [3, 3] });
  // velvet (curtains, sofa back)
  T.velvetN = heightToNormal(pix(256, 256, (x, y) => { const v = 128 + (tnoise(x / 1.5, y / 3, 170, 85) - 0.5) * 120; return [v, v, v]; }), 1.0); T.velvetN.repeat.set(6, 6);
  T.tarnish = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 8, 4); const r = 80 + n * 120; return [r, r, r]; }), { srgb: false, repeat: [2, 2] });
  // white glazed tiles for the washroom (10 cm), with dark grout
  T.tiles = tex(pix(256, 256, (x, y) => { const tx = x % 64, ty = y % 64, grout = tx < 2 || ty < 2; const n = tfbm(x, y, 256, 256, 8, 2); if (grout) return [70, 64, 56]; const v = 222 + n * 20; return [v, v * 0.985, v * 0.95]; }), { repeat: [1, 1] });
  T.tilesN = heightToNormal(pix(128, 128, (x, y) => { const tx = x % 32, ty = y % 32; const e = (tx < 1 || ty < 1) ? 70 : 170; return [e, e, e]; }), 2);
  T.chequer = tex(pix(256, 256, (x, y) => { const c = ((x >> 6) + (y >> 6)) % 2; const n = tfbm(x, y, 256, 256, 8, 2) * 24; return c ? [26 + n, 24 + n, 22 + n] : [214 + n * 0.5, 206 + n * 0.5, 188 + n * 0.5]; }));
  // glow sprite and flame
  T.glow = tex(canv(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  T.flame = tex(canv(64, 128, (g, w, h) => { const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.25, 'rgba(255,214,140,0.95)'); gr.addColorStop(0.55, 'rgba(255,140,40,0.6)'); gr.addColorStop(1, 'rgba(255,90,10,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 6); g.bezierCurveTo(52, 50, 50, 100, 32, 118); g.bezierCurveTo(14, 100, 12, 50, 32, 6); g.fill(); }));

  /* ----- outside ----- */
  // wet basalt cutting, dark with moss and seeping water; 1 tile = 8 m along the line, 6 m high
  T.rock = tex(pix(512, 384, (x, y) => {
    const n = tfbm(x, y, 512, 384, 4, 5), blk = tfbm(x * 2, y * 0.6, 512, 384, 6, 2), jt = Math.abs(tnoise(x / 40, y / 90, 13, 5) - 0.5) < 0.03 ? 0.45 : 1;
    const moss = Math.max(0, tfbm(x + 300, y, 512, 384, 5, 4) - 0.48) * 2.4 * (0.5 + y / 384);
    const seep = Math.pow(Math.max(0, tnoise(x / 18, 0.5, 29, 1) - 0.72) * 3.5, 1.5) * (0.3 + 0.7 * tfbm(x, y * 0.2, 512, 384, 3, 2));
    let c = mixc([22, 22, 24], [58, 56, 54], n * 0.7 + blk * 0.3); c = c.map(q => q * jt);
    c = mixc(c, [28, 46, 20], clamp(moss, 0, 0.85)); c = mixc(c, [10, 12, 14], clamp(seep, 0, 0.7));
    return c;
  }));
  T.rockN = heightToNormal(pix(256, 192, (x, y) => { const v = 60 + tfbm(x, y, 256, 192, 6, 5) * 190; return [v, v, v]; }), 4);
  // ballast with wooden sleepers; one tile = 3.9 m of track (six sleepers), 4 m wide
  T.track = tex(pix(512, 512, (x, y) => {
    const u = x / 512, v = y / 512; let c = null;
    const sl = (v * 6) % 1, onSleeper = sl > 0.12 && sl < 0.44 && u > 0.08 && u < 0.92;
    const st = tnoise(x / 3.2, y / 3.2, 160, 160), st2 = tnoise(x / 1.4, y / 1.4, 365, 365);
    if (onSleeper) { const gr = Math.pow(Math.sin((u * 30 + tfbm(x, y, 512, 512, 4, 2) * 3) * Math.PI) * 0.5 + 0.5, 2); c = mixc([30, 22, 16], [66, 50, 36], gr * 0.6 + tfbm(x * 4, y, 512, 512, 8, 2) * 0.4); if (Math.abs(sl - 0.12) < 0.012 || Math.abs(sl - 0.44) < 0.012) c = c.map(q => q * 0.4); }
    else { const v2 = 40 + st * 70 + st2 * 40; c = [v2, v2 * 0.97, v2 * 0.92]; if (st > 0.72) c = c.map(q => q * 1.25); if (st < 0.25) c = c.map(q => q * 0.5); }
    const wet = 0.7 + tfbm(x, y, 512, 512, 4, 2) * 0.3; return c.map(q => q * wet);
  }));
  T.trackN = heightToNormal(pix(256, 256, (x, y) => { const sl = (y / 256 * 6) % 1, on = sl > 0.12 && sl < 0.44 && x > 20 && x < 236; const v = on ? 200 : 40 + tnoise(x / 1.6, y / 1.6, 160, 160) * 160; return [v, v, v]; }), 3);
  // tunnel lining: squared stone courses blackened by a century of smoke; 1 tile = 4 m along, full arch round
  T.tunnel = tex(pix(512, 512, (x, y) => {
    const course = Math.floor(y / 32), off = (course % 2) * 40, bx = (x + off) % 80, by = y % 32;
    const joint = bx < 3 || by < 3; const n = tfbm(x, y, 512, 512, 6, 4), soot = 0.45 + 0.55 * tfbm(x + 77, y, 512, 512, 3, 3);
    let c = joint ? [16, 15, 14] : mixc([34, 31, 28], [74, 68, 60], n); c = c.map(q => q * soot);
    const wet = Math.max(0, tnoise(x / 14, y / 60, 36, 8) - 0.62) * 2; c = mixc(c, [12, 14, 13], clamp(wet, 0, 0.8));
    return c;
  }));
  T.tunnelN = heightToNormal(pix(256, 256, (x, y) => { const course = Math.floor(y / 16), off = (course % 2) * 20, bx = (x + off) % 40, by = y % 16; const v = (bx < 2 || by < 2) ? 40 : 150 + tfbm(x, y, 256, 256, 8, 3) * 90; return [v, v, v]; }), 3);
  // stone parapet on the ravine side
  T.parapet = tex(pix(256, 128, (x, y) => { const bx = x % 64, by = y % 32, j = bx < 2 || by < 2; const n = tfbm(x, y, 256, 128, 6, 3); const moss = Math.max(0, n - 0.55) * 2; let c = j ? [30, 28, 26] : mixc([70, 66, 58], [110, 104, 92], n); c = mixc(c, [40, 56, 30], clamp(moss, 0, 0.7)); return c; }));
  // the valley: ridges, waterfalls and mist, drawn on a long wrap-around strip (1 tile = the whole 360 degrees)
  T.hills = tex(canv(2048, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const ridge = (base, amp, oct, col, seed) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) { const y = base - (tfbm(x + seed, seed, w, 64, 3, oct) - 0.35) * amp - Math.max(0, tfbm(x * 3 + seed * 2, 7, w, 64, 12, 2) - 0.6) * amp * 0.6; g.lineTo(x, y); } g.lineTo(w, h); g.fill(); };
    ridge(250, 300, 4, '#0b0f12', 11); ridge(300, 220, 4, '#07090b', 400);
    // waterfalls on the far wall: pale threads
    for (let i = 0; i < 18; i++) { const x = rand(40, w - 40), y0 = rand(170, 260), l = rand(60, 180); const gr = g.createLinearGradient(0, y0, 0, y0 + l); gr.addColorStop(0, 'rgba(190,200,205,0)'); gr.addColorStop(0.15, 'rgba(190,200,205,0.55)'); gr.addColorStop(1, 'rgba(190,200,205,0.05)'); g.strokeStyle = gr; g.lineWidth = rand(1.2, 3.2); g.beginPath(); g.moveTo(x, y0); for (let k = 1; k <= 8; k++) g.lineTo(x + Math.sin(k * 1.7 + i) * 3, y0 + l * k / 8); g.stroke(); }
    ridge(360, 140, 4, '#030405', 900);
    // mist lying in the valley
    for (let i = 0; i < 40; i++) { const x = rand(0, w), y = rand(330, 420); const gr = g.createRadialGradient(x, y, 0, x, y, rand(80, 200)); gr.addColorStop(0, 'rgba(110,120,130,0.07)'); gr.addColorStop(1, 'rgba(110,120,130,0)'); g.fillStyle = gr; g.fillRect(x - 220, y - 220, 440, 440); }
  }));
  T.hills.wrapT = THREE.ClampToEdgeWrapping;
  // storm clouds
  T.clouds = tex(pix(512, 256, (x, y) => { const n = tfbm(x, y, 512, 256, 4, 5), m = tfbm(x + 200, y * 2, 512, 256, 8, 3); const v = 10 + Math.pow(n, 1.6) * 60 + m * 10; return [v * 0.9, v * 0.95, v * 1.05]; }));
  // rain on glass: drops and runnels (alpha), scrolled
  T.rainGlass = tex(canv(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) { const x = rand(0, w), y = rand(0, h), r = rand(0.5, 1.8); g.fillStyle = `rgba(255,255,255,${rand(0.2, 0.55)})`; g.beginPath(); g.ellipse(x, y, r, r * rand(1, 1.6), 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 16; i++) { let x = rand(0, w), y = rand(0, h); g.strokeStyle = `rgba(255,255,255,${rand(0.15, 0.35)})`; g.lineWidth = rand(0.6, 1.3); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += rand(3, 9); y += rand(-2, 5); g.lineTo(x, y); } g.stroke(); }
  }));
  // platform flags
  T.flags = tex(pix(256, 256, (x, y) => { const bx = x % 128, by = y % 96, j = bx < 2 || by < 2; const n = tfbm(x, y, 256, 256, 6, 3), wet = 0.7 + tfbm(x + 5, y, 256, 256, 3, 2) * 0.3; const c = j ? [24, 22, 20] : mixc([60, 58, 54], [100, 96, 88], n); return c.map(q => q * wet); }));
  T.whitewash = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 5, 4), st = Math.max(0, tfbm(x, y * 0.3, 256, 256, 6, 3) - 0.45) * (y / 256) * 2; const c = mixc([150, 146, 132], [112, 104, 88], n * 0.4); return mixc(c, [70, 64, 50], clamp(st, 0, 0.7)); }));
  T.roofTiles = tex(pix(256, 256, (x, y) => { const row = Math.floor(y / 20), bx = (x + (row % 2) * 16) % 32, by = y % 20; const sh = by / 20; const n = tfbm(x, y, 256, 256, 8, 3); let c = mixc([70, 30, 20], [120, 54, 34], n); c = c.map(q => q * (0.55 + sh * 0.5)); if (bx < 1.5) c = c.map(q => q * 0.5); return c; }));
}

/* ---------------- materials ---------------- */
function std(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.45 }, o)); }
function phys(o) { return new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.45 }, o)); }
function makeMaterials() {
  M.teak = phys({ map: T.teak, roughnessMap: T.teakR, roughness: 0.85, clearcoat: 0.7, clearcoatRoughness: 0.3 });
  M.teakMatte = phys({ map: T.teak, roughnessMap: T.teakR, roughness: 0.9, clearcoat: 0.35, clearcoatRoughness: 0.45, color: 0xd8c0a8 });
  M.teakDark = phys({ map: T.teakDark, roughnessMap: T.teakR, roughness: 0.85, clearcoat: 0.7, clearcoatRoughness: 0.28 });
  M.burr = phys({ map: T.burr, roughness: 0.6, clearcoat: 0.9, clearcoatRoughness: 0.18 });
  M.carpet = phys({ map: T.carpet, normalMap: T.pileN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 1, sheen: 0.6, sheenColor: new THREE.Color(0x8a4a3a), sheenRoughness: 0.6 });
  M.boards = phys({ map: T.boards, roughnessMap: T.teakR, roughness: 0.7, clearcoat: 0.3, clearcoatRoughness: 0.5 });
  M.ceil = std({ map: T.ceil, roughness: 0.6, color: 0xf6efe0 });
  M.gilt = std({ color: 0xc09848, metalness: 1, roughness: 0.38, roughnessMap: T.tarnish, envMapIntensity: 0.9 });
  M.brass = std({ color: 0xc9a060, metalness: 1, roughness: 0.32, roughnessMap: T.tarnish, envMapIntensity: 0.9 });
  M.nickel = std({ color: 0xd8d8d0, metalness: 1, roughness: 0.25, roughnessMap: T.tarnish, envMapIntensity: 1.0 });
  M.iron = std({ color: 0x1a1918, metalness: 0.6, roughness: 0.6 });
  M.ironRed = std({ color: 0x5a1a14, metalness: 0.3, roughness: 0.55 });
  M.steel = std({ color: 0x3a3c3e, metalness: 0.7, roughness: 0.45 });
  M.leather = phys({ map: T.leather, normalMap: T.leatherN, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  M.velvet = phys({ color: 0x4a0c12, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color(0xc0404f), sheenRoughness: 0.4, normalMap: T.velvetN, normalScale: new THREE.Vector2(0.3, 0.3) });
  M.cream = std({ color: 0xe8dcc0, roughness: 0.7 });
  M.blind = std({ color: 0x8a7a5e, roughness: 0.85 });
  M.enamel = phys({ color: 0xf2efe8, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  M.tiles = phys({ map: T.tiles, normalMap: T.tilesN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  M.chequer = phys({ map: T.chequer, roughness: 0.3, clearcoat: 0.6 });
  M.paper = std({ color: 0xe6dcc4, roughness: 0.92 });
  M.black = std({ color: 0x0c0b0a, roughness: 0.6 });
  M.rubber = std({ color: 0x141414, roughness: 0.9 });
  M.glass = std({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.07, envMapIntensity: 0.35, depthWrite: false });
  M.frosted = std({ color: 0xdfe6e8, roughness: 0.6, transparent: true, opacity: 0.72, envMapIntensity: 0.5, depthWrite: false });
  M.bowl = std({ color: 0xf6ead0, roughness: 0.35, transparent: true, opacity: 0.86, emissive: new THREE.Color(0xffd8a0), emissiveIntensity: 0, depthWrite: false });
  M.rainGlass = new THREE.MeshBasicMaterial({ color: 0x8a98a4, alphaMap: T.rainGlass, transparent: true, opacity: 0.16, depthWrite: false });
  M.glowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffc27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 });
  M.redS = new THREE.SpriteMaterial({ map: T.glow, color: 0xff2a14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
  // outside
  M.rock = std({ map: T.rock, normalMap: T.rockN, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.55, envMapIntensity: 0.2, emissive: new THREE.Color(0x2a3444), emissiveMap: T.rock, emissiveIntensity: 0.55 });
  M.track = std({ map: T.track, normalMap: T.trackN, normalScale: new THREE.Vector2(1, 1), roughness: 0.8, envMapIntensity: 0.15, emissive: new THREE.Color(0x2a3444), emissiveMap: T.track, emissiveIntensity: 0.4 });
  M.rail = std({ color: 0x4a3a30, metalness: 0.7, roughness: 0.5 });
  M.railTop = std({ color: 0xb8bcc0, metalness: 1, roughness: 0.18 });
  M.tunnel = std({ map: T.tunnel, normalMap: T.tunnelN, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 0.75, side: THREE.BackSide, envMapIntensity: 0.1 });
  M.portal = std({ map: T.parapet, roughness: 0.8, envMapIntensity: 0.1 });
  M.parapet = std({ map: T.parapet, roughness: 0.75, envMapIntensity: 0.1, emissive: new THREE.Color(0x2a3444), emissiveMap: T.parapet, emissiveIntensity: 0.4 });
  M.hills = new THREE.MeshBasicMaterial({ map: T.hills, transparent: true, depthWrite: false, fog: false, color: 0x6a7278 });
  M.sky = new THREE.MeshBasicMaterial({ map: T.clouds, fog: false, side: THREE.BackSide, color: 0xa8b0bc });
  M.flags = std({ map: T.flags, roughness: 0.45, envMapIntensity: 0.3 });
  M.white = std({ map: T.whitewash, roughness: 0.9 });
  M.roof = std({ map: T.roofTiles, roughness: 0.7 });
  M.pole = std({ color: 0x2a2622, roughness: 0.7, metalness: 0.3 });
  M.leaf = phys({ color: 0x1f3a1c, roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide });
}

/* =====================================================================
   NIGHT MAIL · part B: the saloon (shell, windows, doors, furniture, washroom, balcony)
   ===================================================================== */
/* ---------------- geometry helpers ---------------- */
function bevGeo(w, h, d, b = 0.006, seg = 2) {
  b = Math.max(0.0005, Math.min(b, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005));
  const s = new THREE.Shape(), x = w / 2 - b, y = h / 2 - b; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: 1 });
  g.translate(0, 0, -Math.max(0.0005, d - 2 * b) / 2); return g;
}
function bev(w, h, d, mat, x, y, z, parent = scene, b = 0.006) { return mesh(bevGeo(w, h, d, b), mat, x, y, z, parent); }
function lathe(pts, mat, x, y, z, parent = scene, seg = 28) { return mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg), mat, x, y, z, parent); }
function tube(pts, r, mat, parent = scene, seg = 32, rs = 8, closed = false) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), closed); return mesh(new THREE.TubeGeometry(c, seg, r, rs, closed), mat, 0, 0, 0, parent); }
function frameGeo(w, h, iw, ih, d, b = 0.008) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  const hole = new THREE.Path(); hole.moveTo(-iw / 2, -ih / 2); hole.lineTo(-iw / 2, ih / 2); hole.lineTo(iw / 2, ih / 2); hole.lineTo(iw / 2, -ih / 2); hole.closePath(); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - b), bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 2, curveSegments: 1 });
}
function uvScale(g, su, sv, ou = 0, ov = 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov); uv.needsUpdate = true; return g; }
function drapeGeo(w, h, folds, amp) {
  const g = new THREE.PlaneGeometry(w, h, Math.max(8, folds * 8), 10), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), k = (h / 2 - y) / h; const ph = x / w * folds * TAU; p.setZ(i, Math.sin(ph) * amp * (0.6 + 0.4 * k) + Math.sin(ph * 2.3 + 1) * amp * 0.25); }
  g.computeVertexNormals(); return g;
}
// a flat slab with rectangular holes, UVs in metres: shape in (u, v), extruded d
function holedGeo(u0, u1, v0, v1, holes, d, top = null) {
  const s = new THREE.Shape(); s.moveTo(u0, v0); s.lineTo(u1, v0);
  if (top) { s.lineTo(u1, v1); top.forEach(([u, v]) => s.lineTo(u, v)); } else { s.lineTo(u1, v1); s.lineTo(u0, v1); }
  s.closePath();
  for (const [a, b, c, e] of holes) { const hp = new THREE.Path(); hp.moveTo(a, c); hp.lineTo(a, e); hp.lineTo(b, e); hp.lineTo(b, c); hp.closePath(); s.holes.push(hp); }
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 });
}
// the roof arc between the wall tops, as an open ribbon seen from inside
const ARC = (() => { const s = ROOF_H - WALL_H, R = (HW * HW + s * s) / (2 * s); return { R, yc: ROOF_H - R, A: Math.asin(HW / R) }; })();
function roofY(x) { return ARC.yc + Math.sqrt(Math.max(0, ARC.R * ARC.R - x * x)); }
function arcPts(n = 24) { const pts = []; for (let i = 0; i <= n; i++) { const a = -ARC.A + 2 * ARC.A * i / n; pts.push([ARC.R * Math.sin(a), ARC.yc + ARC.R * Math.cos(a)]); } return pts; }
function roofGeo(z0, z1, n = 28) {
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const a = -ARC.A + 2 * ARC.A * i / n, x = ARC.R * Math.sin(a), y = ARC.yc + ARC.R * Math.cos(a), nx = -Math.sin(a), ny = -Math.cos(a);
    for (const z of [z0, z1]) { pos.push(x, y, z); nor.push(nx, ny, 0); uv.push(ARC.R * (a + ARC.A), z); }
  }
  for (let i = 0; i < n; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
// place a thing on a side wall: side -1 = left (x = -HW), +1 = right; d = distance out from the wall into the room
function onWall(side, obj, z, y, d = 0) { obj.position.set(side * (HW - d), y, z); obj.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; return obj; }

/* ---------------- the shell ---------------- */
function buildShell() {
  const TH = 0.05;
  // floor: teak boards, a carpet runner down the lounge
  const fl = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(HW * 2, ZR - ZF), HW * 2 / 1.0, (ZR - ZF) / 1.0), M.boards); fl.rotation.x = -Math.PI / 2; fl.position.z = (ZF + ZR) / 2; fl.receiveShadow = true; scene.add(fl);
  const cw = 2.2, cl = ZR - 0.25 - (PART + 0.1);
  const cp = mesh(new THREE.BoxGeometry(cw, 0.012, cl), M.carpet, -0.05, 0.006, (ZR - 0.25 + PART + 0.1) / 2); cp.castShadow = false;
  uvScale(cp.geometry, 1, cl / 4.4);
  // side walls with their window and door openings (u = world z on the left, -z on the right)
  const DZ = [-4.92, -4.22];   // the vestibule's outside doors
  for (const side of [-1, 1]) {
    const holes = WINZ.map(z => [z - WIN.w / 2, z + WIN.w / 2, WIN.y0, WIN.y1]);
    holes.push([DZ[0], DZ[1], 0.02, 2.02]);
    if (side > 0) holes.push([-3.3, -2.8, 1.25, 1.78]);   // washroom window
    const hs = side < 0 ? holes : holes.map(([a, b, c, e]) => [-b, -a, c, e]);
    const g = holedGeo(side < 0 ? ZF : -ZR, side < 0 ? ZR : -ZF, 0, WALL_H, hs, TH);
    uvScale(g, 1, 1); const w = new THREE.Mesh(g, M.teak); w.position.set(side * HW, 0, 0); w.rotation.y = side * Math.PI / 2; w.receiveShadow = true; scene.add(w);
    // dado rail, cornice, and the skirting
    for (const [y, h, d, m] of [[0.84, 0.05, 0.03, M.teakDark], [WALL_H - 0.03, 0.06, 0.06, M.teakDark], [0.06, 0.12, 0.02, M.teakDark]]) {
      // break the dado for the windows? the windows start above it, so it runs through; break for the doors
      const runs = [[ZF, DZ[0]], [DZ[1], ZR]];
      for (const [a, b] of runs) { const r = bev(b - a, h, d, m, side * (HW - d / 2), y, (a + b) / 2, scene, 0.008); r.rotation.y = Math.PI / 2; }
    }
    // burr walnut panels on the piers between the windows (upper and lower)
    const piers = [];
    let prev = PART + 0.05; for (const z of WINZ) { piers.push([prev, z - WIN.w / 2 - 0.06]); prev = z + WIN.w / 2 + 0.06; } piers.push([prev, ZR - 0.05]);
    for (const [a, b] of piers) {
      if (b - a < 0.2) continue;
      for (const [y0, y1] of [[0.18, 0.76], [1.0, 1.95]]) {
        if (side > 0 && b < WC.z1 + 0.1) continue;
        const p = bev(b - a - 0.08, y1 - y0, 0.012, y0 > 0.5 ? M.teakMatte : M.burr, side * (HW - 0.006), (y0 + y1) / 2, (a + b) / 2, scene, 0.004); p.rotation.y = Math.PI / 2;
        const f = mesh(frameGeo(b - a - 0.02, y1 - y0 + 0.06, b - a - 0.1, y1 - y0 - 0.02, 0.018, 0.006), M.teakDark, side * (HW - 0.004), (y0 + y1) / 2, (a + b) / 2); f.rotation.y = -side * Math.PI / 2;
      }
    }
    // lower panels under each window
    for (const z of WINZ) { const p = bev(WIN.w - 0.06, 0.56, 0.012, M.burr, side * (HW - 0.006), 0.5, z, scene, 0.004); p.rotation.y = Math.PI / 2; const f = mesh(frameGeo(WIN.w + 0.02, 0.62, WIN.w - 0.08, 0.54, 0.018, 0.006), M.teakDark, side * (HW - 0.004), 0.5, z); f.rotation.y = -side * Math.PI / 2; }
  }
  // the arched roof and its gilt lines
  const rf = new THREE.Mesh(roofGeo(ZF, ZR), M.ceil); rf.receiveShadow = true; scene.add(rf);
  for (const a of [-0.62, -0.3, 0.3, 0.62]) { const x = ARC.R * Math.sin(a), y = ARC.yc + ARC.R * Math.cos(a); const ln = bev(0.012, 0.004, ZR - ZF - 0.1, M.gilt, x * 0.998, y - 0.002, 0, scene, 0.001); ln.rotation.z = -a; }
  // roof ribs every ~1.3 m
  const ribPts = arcPts(26);
  for (let z = ZF + 0.6; z < ZR; z += 1.3) { const pts = ribPts.map(([x, y]) => [x * 0.995, y - 0.01, z]); tube(pts, 0.012, M.teakDark, scene, 32, 6); }
  // wall-top cornice into the roof
  for (const side of [-1, 1]) { const c = bev(0.08, 0.06, ZR - ZF, M.teakDark, side * (HW - 0.04), WALL_H + 0.02, 0, scene, 0.01); }

  // end walls: front (connecting door) and rear (door + two windows), shaped to the roof
  const topPts = side => arcPts(24).map(([x, y]) => [x, y]).reverse();
  const endWall = (z, holes, face) => {
    const top = arcPts(24).slice().reverse().map(([x, y]) => [x, y]);
    const g = holedGeo(-HW, HW, 0, WALL_H, holes, TH, top); const w = new THREE.Mesh(g, M.teak);
    w.position.set(0, 0, z); if (face < 0) { w.rotation.y = Math.PI; } w.receiveShadow = true; scene.add(w); return w;
  };
  // front wall at ZF, inner face toward +z: the extrusion runs +z from the shape plane, so offset it back
  const fw = endWall(ZF - TH, [[CDOOR.x0, CDOOR.x1, 0.0, CDOOR.h]], 1);
  // rear wall at ZR: mirror so the inner face looks to -z
  const rwHoles = [[RDOOR.x0, RDOOR.x1, 0.0, RDOOR.h], ...RWIN.xs.map(([a, b]) => [a, b, RWIN.y0, RWIN.y1])];
  const rw = endWall(ZR + TH, rwHoles.map(([a, b, c, e]) => [-b, -a, c, e]), -1);
  // partition between vestibule and lounge (the washroom's front wall is part of it)
  const pw = endWall(PART - TH / 2, [[PDOOR.x0, PDOOR.x1, 0.0, 2.02]], 1); pw.material = M.teak;
  // door casings and panels on the partition (lounge side and vestibule side)
  for (const zz of [PART + TH / 2 + 0.004, PART - TH / 2 - 0.004]) {
    const cs = mesh(frameGeo(PDOOR.x1 - PDOOR.x0 + 0.16, 2.1 + 0.08, PDOOR.x1 - PDOOR.x0, 2.04, 0.03, 0.008), M.teakDark, (PDOOR.x0 + PDOOR.x1) / 2, 1.03, zz); if (zz < PART) cs.rotation.y = Math.PI;
  }
  // washroom box: west wall (with door) and back wall, and its flat ceiling
  const ww = holedGeo(PART, WC.z1, 0, WALL_H, [[WC.dz0, WC.dz1, 0.0, 1.98]], TH); const wwm = new THREE.Mesh(ww, M.teak); wwm.position.set(WC.x0, 0, 0); wwm.rotation.y = -Math.PI / 2; scene.add(wwm);
  const bw = holedGeo(-HW, -WC.x0, 0, WALL_H, [], TH); const bwm = new THREE.Mesh(bw, M.teak); bwm.position.set(0, 0, WC.z1); bwm.rotation.y = Math.PI; scene.add(bwm);
  const wceil = mesh(new THREE.BoxGeometry(HW - WC.x0, 0.03, WC.z1 - PART), M.ceil, (WC.x0 + HW) / 2, WALL_H + 0.015, (PART + WC.z1) / 2);
  // outside faces of the washroom box get teak panelling (lounge side)
  for (const [a, b] of [[PART + 0.05, WC.dz0 - 0.06], [WC.dz1 + 0.06, WC.z1 - 0.05]]) { if (b - a < 0.15) continue; for (const [y0, y1] of [[0.18, 0.8], [1.0, 1.95]]) { const p = bev(b - a - 0.06, y1 - y0, 0.012, M.burr, WC.x0 - TH - 0.006, (y0 + y1) / 2, (a + b) / 2, scene, 0.004); p.rotation.y = Math.PI / 2; } }
  { const p = bev(HW - WC.x0 - 0.2, 0.7, 0.012, M.burr, (WC.x0 + HW) / 2, 1.45, WC.z1 + TH + 0.006, scene, 0.004); }
  O.shellRoof = rf;
}

/* ---------------- windows ---------------- */
function buildWindows() {
  O.windows = [];
  for (const side of [-1, 1]) for (const z of WINZ) {
    const g = grp(side * HW, 0, z); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;   // local +z points into the room
    const w = WIN.w, h = WIN.y1 - WIN.y0, yc = (WIN.y0 + WIN.y1) / 2;
    mesh(frameGeo(w + 0.08, h + 0.08, w - 0.02, h - 0.02, 0.03, 0.008), M.brass, 0, yc, 0.0, g);
    const gl = plane(w, h, M.glass, 0, yc, -0.02, 0, g); layer1(gl);
    const rn = plane(w, h, M.rainGlass, 0, yc, -0.03, 0, g); layer1(rn); rn.userData.rain = true; O.windows.push({ g, rn, side, z });
    bev(w + 0.14, 0.035, 0.12, M.teakDark, 0, WIN.y0 - 0.01, 0.05, g, 0.008);   // sill
    // roller blind, rolled up at the top, and a pair of velvet curtains tied back
    cyl(0.022, 0.022, w + 0.04, M.blind, 0, WIN.y1 + 0.07, 0.06, g, 12).rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) { const c = mesh(drapeGeo(0.18, 1.3, 3, 0.018), M.velvet, sx * (w / 2 + 0.09), yc + 0.1, 0.07, g); c.material = M.velvet; }
    bev(w + 0.46, 0.1, 0.07, M.teakDark, 0, WIN.y1 + 0.16, 0.06, g, 0.01);   // pelmet
  }
  // the vestibule's outside doors (teak, with a drop window)
  O.sideDoors = [];
  for (const side of [-1, 1]) {
    const g = grp(side * HW, 0, -4.57); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    bev(0.7, 1.2, 0.045, M.teak, 0, 0.61, -0.02, g, 0.008); bev(0.7, 0.2, 0.045, M.teak, 0, 1.91, -0.02, g, 0.008);
    for (const sx of [-1, 1]) bev(0.12, 0.6, 0.045, M.teak, sx * 0.29, 1.5, -0.02, g, 0.006);
    const pane = plane(0.46, 0.6, M.glass, 0, 1.5, 0.004, 0, g); layer1(pane);
    const rn = plane(0.46, 0.6, M.rainGlass, 0, 1.5, -0.05, 0, g); layer1(rn); O.windows.push({ g, rn, side, z: -4.57 });
    mesh(frameGeo(0.52, 0.66, 0.46, 0.6, 0.02, 0.005), M.brass, 0, 1.5, 0.005, g);
    // the dark outside behind the pane is the real world; the rest of the door is panelled
    for (const y of [0.45, 0.95]) bev(0.5, 0.36, 0.012, M.burr, 0, y, 0.004, g, 0.004);
    cyl(0.012, 0.012, 0.3, M.brass, 0.27, 1.05, 0.03, g, 10);
    O.sideDoors.push(g);
  }
  // washroom window: frosted
  { const g = grp(HW, 0, -3.05); g.rotation.y = -Math.PI / 2; const f = plane(0.5, 0.53, M.frosted, 0, 1.515, -0.01, 0, g); layer1(f); mesh(frameGeo(0.56, 0.59, 0.5, 0.53, 0.02, 0.005), M.nickel, 0, 1.515, 0.0, g); }
}

/* ---------------- the rear end: door, two windows, the handbrake ---------------- */
function buildRearEnd() {
  // window frames and panes (the right-hand one lowers: a drop-light held by a leather strap)
  O.rearPanes = [];
  RWIN.xs.forEach(([a, b], i) => {
    const w = b - a, h = RWIN.y1 - RWIN.y0, xc = (a + b) / 2, yc = (RWIN.y0 + RWIN.y1) / 2;
    const f = mesh(frameGeo(w + 0.08, h + 0.08, w - 0.02, h - 0.02, 0.03, 0.008), M.brass, xc, yc, ZR - 0.01); f.rotation.y = Math.PI;
    const pg = grp(xc, yc, ZR + 0.012); const gl = plane(w, h, M.glass, 0, 0, 0, Math.PI, pg); layer1(gl);
    const rn = plane(w, h, M.rainGlass, 0, 0, 0.02, Math.PI, pg); layer1(rn); O.windows.push({ g: pg, rn, side: 0, z: ZR });
    bev(w + 0.12, 0.035, 0.14, M.teakDark, xc, RWIN.y0 - 0.01, ZR - 0.06, scene, 0.008);
    O.rearPanes.push(pg);
    if (i === 1) {
      O.drop = pg; O.dropTop = yc;
      // the strap: leather, with holes, hooked on a brass stud under the frame
      O.strap = grp(xc, RWIN.y0 - 0.02, ZR - 0.035); bev(0.05, 0.3, 0.006, std({ color: 0x3a2014, roughness: 0.6 }), 0, -0.13, 0, O.strap, 0.002); cyl(0.008, 0.008, 0.02, M.brass, 0, -0.26, -0.01, O.strap, 10).rotation.x = Math.PI / 2;
      // a small brass window lock on the frame
      O.winLock = grp(xc + w / 2 - 0.06, RWIN.y1 - 0.06, ZR - 0.03); bev(0.05, 0.07, 0.015, M.brass, 0, 0, 0, O.winLock, 0.004); cyl(0.006, 0.006, 0.02, M.black, 0, 0, -0.01, O.winLock, 8).rotation.x = Math.PI / 2;
    }
  });
  // the rear door: teak, glazed above; bolted on the outside
  O.rdoorPivot = grp(RDOOR.x1, 0, ZR);
  O.rdoor = grp(-(RDOOR.x1 - RDOOR.x0) / 2, 0, 0, O.rdoorPivot);
  const dw = RDOOR.x1 - RDOOR.x0;
  bev(dw - 0.01, 0.95, 0.045, M.teak, 0, 0.48, 0.0, O.rdoor, 0.008); bev(dw - 0.01, 0.12, 0.045, M.teak, 0, RDOOR.h - 0.06, 0, O.rdoor, 0.008);
  for (const sx of [-1, 1]) bev(0.08, RDOOR.h - 0.95, 0.045, M.teak, sx * (dw / 2 - 0.045), 0.95 + (RDOOR.h - 0.95) / 2, 0, O.rdoor, 0.006);
  for (const y of [0.28, 0.7]) bev(dw - 0.2, 0.3, 0.012, M.burr, 0, y, -0.026, O.rdoor, 0.004);
  const dp = plane(dw - 0.17, RDOOR.h - 1.08, M.glass, 0, 0.95 + (RDOOR.h - 1.08) / 2 + 0.01, 0, Math.PI, O.rdoor); layer1(dp);
  const drn = plane(dw - 0.17, RDOOR.h - 1.08, M.rainGlass, 0, 0.95 + (RDOOR.h - 1.08) / 2 + 0.01, 0.03, Math.PI, O.rdoor); layer1(drn); O.windows.push({ g: O.rdoor, rn: drn, side: 0, z: ZR });
  O.rdoorGlass = { w: dw - 0.17, h: RDOOR.h - 1.08, yc: 0.95 + (RDOOR.h - 1.08) / 2 + 0.01 };
  lathe([[0.001, 0], [0.024, 0], [0.024, 0.02], [0.012, 0.03], [0.02, 0.06], [0.001, 0.07]], M.brass, -dw / 2 + 0.08, 1.02, -0.04, O.rdoor, 14).rotation.x = -Math.PI / 2;
  // the bolt, outside
  O.rbolt = grp(-dw / 2 + 0.06, 1.25, 0.045, O.rdoor); bev(0.1, 0.03, 0.018, M.iron, 0, 0, 0, O.rbolt, 0.004); O.rboltBar = bev(0.14, 0.014, 0.014, M.iron, -0.08, 0, 0.004, O.rbolt, 0.003);
  // the handbrake: an iron column with a wheel, in the rear left corner (the slip guard's brake)
  O.brake = grp(-1.14, 0, ZR - 0.32);
  cyl(0.035, 0.05, 0.9, M.ironRed, 0, 0.45, 0, O.brake, 16); lathe([[0.001, 0], [0.09, 0], [0.08, 0.03], [0.04, 0.05], [0.001, 0.06]], M.ironRed, 0, 0, 0, O.brake, 20);
  O.brakeWheel = grp(0, 0.95, 0, O.brake);
  mesh(new THREE.TorusGeometry(0.2, 0.016, 10, 40), M.iron, 0, 0, 0, O.brakeWheel).rotation.x = Math.PI / 2;
  for (let k = 0; k < 5; k++) { const sp = cyl(0.01, 0.01, 0.2, M.iron, 0, 0, 0, O.brakeWheel, 8); sp.rotation.z = Math.PI / 2; sp.rotation.y = k / 5 * TAU; sp.position.set(Math.cos(k / 5 * TAU) * 0.1, 0, -Math.sin(k / 5 * TAU) * 0.1); }
  cyl(0.03, 0.03, 0.04, M.iron, 0, 0, 0, O.brakeWheel, 12);
  cyl(0.012, 0.012, 0.12, M.brass, 0.19, 0.06, 0, O.brakeWheel, 8);
  plane(0.16, 0.08, std({ map: ctex(256, 128, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#1a1a1a'; g.font = `600 44px ${TEKO}`; g.textAlign = 'center'; g.fillText('HAND BRAKE', w / 2, 58); g.font = `500 28px ${TEKO}`; g.fillText('TURN RIGHT TO APPLY', w / 2, 100); }), roughness: 0.4 }), 0, 0.72, 0.052, 0, O.brake);
}

/* ---------------- the front end: connecting door, slip gear, guard's box, bell board ---------------- */
function buildFrontEnd() {
  // the connecting door, hinged on its left, glazed with a small window onto the gangway
  O.cdoorPivot = grp(CDOOR.x0, 0, ZF);
  O.cdoor = grp((CDOOR.x1 - CDOOR.x0) / 2, 0, 0, O.cdoorPivot);
  const dw = CDOOR.x1 - CDOOR.x0;
  bev(dw - 0.01, 1.32, 0.045, M.teak, 0, 0.66, 0, O.cdoor, 0.008); bev(dw - 0.01, CDOOR.h - 1.78, 0.045, M.teak, 0, (CDOOR.h + 1.78) / 2, 0, O.cdoor, 0.008);
  for (const sx of [-1, 1]) bev(0.13, 0.48, 0.045, M.teak, sx * (dw / 2 - 0.07), 1.55, 0, O.cdoor, 0.006);
  for (const y of [0.4, 0.95]) bev(dw - 0.18, 0.4, 0.012, M.burr, 0, y, 0.026, O.cdoor, 0.004);
  const cp = plane(dw - 0.26, 0.42, M.glass, 0, 1.55, 0.024, 0, O.cdoor); layer1(cp);
  mesh(frameGeo(dw - 0.2, 0.48, dw - 0.26, 0.42, 0.02, 0.005), M.brass, 0, 1.55, 0.024, O.cdoor);
  lathe([[0.001, 0], [0.024, 0], [0.024, 0.02], [0.012, 0.03], [0.02, 0.06], [0.001, 0.07]], M.brass, dw / 2 - 0.08, 1.02, 0.03, O.cdoor, 14).rotation.x = Math.PI / 2;
  O.cLock = grp(dw / 2 - 0.08, 1.14, 0.03, O.cdoor); bev(0.05, 0.1, 0.012, M.brass, 0, 0, 0, O.cLock, 0.004); const kh = bev(0.012, 0.012, 0.012, M.black, 0, 0.01, 0.004, O.cLock, 0.001); kh.rotation.z = Math.PI / 4;
  // the interlock bolt (brass) at the top of the door: shot while the slip gear is armed
  O.ibolt = bev(0.035, 0.12, 0.035, M.brass, dw / 2 - 0.1, CDOOR.h + 0.05, 0.03, O.cdoor, 0.006);
  // the attendant's note, taped at eye level
  T.anote = ctex(256, 300, () => {}); O.anote = mesh(new THREE.PlaneGeometry(0.13, 0.15), std({ map: T.anote, roughness: 0.9 }), -0.06, 1.27, 0.03, O.cdoor); O.anote.rotation.z = 0.05;
  // behind the door: a dark stub of gangway (bellows), glimpsed through the glass
  O.gang = grp(0, 0, ZF);
  const bel = std({ color: 0x141312, roughness: 0.95 });
  for (let k = 0; k < 7; k++) { const z = -0.12 - k * 0.12; mesh(frameGeo(1.3, 2.34, 0.98, 2.08, 0.07, 0.012), bel, 0, 1.12, z - 0.03, O.gang); }
  for (const sx of [-1, 1]) { const sd = mesh(new THREE.PlaneGeometry(0.84, 2.1), std({ color: 0x0c0b0a, roughness: 1, side: THREE.DoubleSide }), sx * 0.49, 1.1, -0.5, O.gang); sd.rotation.y = Math.PI / 2; }
  bev(1.1, 0.03, 0.9, M.steel, 0, -0.02, -0.45, O.gang, 0.004);
  // the next coach's end door, seen at the end of the gangway in the finale
  O.nextDoor = grp(0, 0, ZF - 1.0); bev(0.7, 2.0, 0.05, std({ color: 0x6a1c1a, roughness: 0.6 }), 0, 1.0, 0, O.nextDoor, 0.008);
  O.nextDoor.visible = true;
  // the slip gear: a lever in a toothed quadrant on the end wall, left of the door
  O.slip = grp(-0.98, 0, ZF + 0.04);
  bev(0.42, 1.3, 0.03, M.teakDark, 0, 0.9, 0, O.slip, 0.008);
  const quad = new THREE.Shape(); quad.moveTo(0, 0); quad.absarc(0, 0, 0.32, Math.PI * 0.2, Math.PI * 0.8, false); quad.lineTo(0, 0);
  const qg = new THREE.ExtrudeGeometry(quad, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 }); mesh(qg, M.brass, 0, 0.72, 0.02, O.slip);
  O.slipLever = grp(0, 0.72, 0.045, O.slip);
  bev(0.03, 0.5, 0.02, M.iron, 0, 0.25, 0, O.slipLever, 0.006); lathe([[0.001, 0], [0.022, 0], [0.026, 0.06], [0.018, 0.1], [0.001, 0.11]], M.brass, 0, 0.5, 0, O.slipLever, 14);
  cyl(0.03, 0.03, 0.03, M.brass, 0, 0, 0, O.slipLever, 14).rotation.x = Math.PI / 2;
  // the keyhole for the slip key, and the key once fitted
  O.slipHole = grp(0, 0.58, 0.03, O.slip); cyl(0.022, 0.022, 0.012, M.brass, 0, 0, 0, O.slipHole, 16).rotation.x = Math.PI / 2; bev(0.006, 0.02, 0.01, M.black, 0, 0, 0.006, O.slipHole, 0.001);
  O.slipKeyIn = grp(0, 0.58, 0.05, O.slip); cyl(0.005, 0.005, 0.05, M.brass, 0, 0, 0, O.slipKeyIn, 8).rotation.x = Math.PI / 2; bev(0.07, 0.012, 0.012, M.brass, 0, 0, 0.03, O.slipKeyIn, 0.003); O.slipKeyIn.visible = false;
  // the enamel instruction plate
  T.slipPlate = ctex(512, 360, () => {}); O.slipPlate = mesh(new THREE.PlaneGeometry(0.34, 0.24), std({ map: T.slipPlate, roughness: 0.25, metalness: 0.1 }), 0, 1.3, 0.018, O.slip);
  // the builder's plate by the door
  plane(0.22, 0.09, std({ map: ctex(512, 200, (g, w, h) => { g.fillStyle = '#b8914a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a4020'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#2a1c0c'; g.textAlign = 'center'; g.font = `600 44px ${TEKO}`; g.fillText('G. I. P. RLY.  INSPECTION SALOON No. 9', w / 2, 80); g.font = `500 36px ${TEKO}`; g.fillText('MATUNGA WORKS  ·  1911', w / 2, 140); speckle(g, w, h, 1500, 0.2, '60,40,10', 2); }), metalness: 0.9, roughness: 0.35, color: 0xd8b070 }), 0.62, 1.6, ZF + 0.004);
  // the guard's box: a steel trunk on the floor, right of the door, with a signal-arm lock plate
  O.box = grp(0.88, 0, ZF + 0.3);
  const boxM = std({ map: ctex(512, 256, (g, w, h) => { g.fillStyle = '#23302a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, 0.25, '0,0,0', 3); for (let i = 0; i < 30; i++) blot(g, rand(0, w), rand(0, h), rand(8, 40), 0.25, '90,50,20'); g.fillStyle = 'rgba(230,220,190,0.85)'; g.font = `600 58px ${TEKO}`; g.textAlign = 'center'; g.fillText('GUARD · SLIP · S.9', w / 2, 120); g.font = `500 38px ${TEKO}`; g.fillText('J. D’SOUZA', w / 2, 180); }), roughness: 0.55, metalness: 0.4 });
  const body = bev(0.72, 0.36, 0.42, M.steel, 0, 0.19, 0, O.box, 0.01);
  const face = plane(0.68, 0.3, boxM, 0, 0.19, 0.212, 0, O.box);
  O.boxLid = grp(0, 0.37, -0.21, O.box); bev(0.74, 0.06, 0.44, M.steel, 0, 0.03, 0.21, O.boxLid, 0.012);
  for (const sx of [-1, 1]) { tube([[sx * 0.34, 0.23, -0.1], [sx * 0.4, 0.26, 0], [sx * 0.34, 0.23, 0.1]], 0.008, M.iron, O.box, 10, 6); }
  for (const x of [-0.3, 0.3]) bev(0.04, 0.4, 0.44, M.iron, x, 0.2, 0, O.box, 0.004);
  // a hasp and a heavy padlock (the guard's own key ring opens it)
  O.boxLock = grp(0, 0.3, 0.222, O.box); bev(0.06, 0.1, 0.012, M.iron, 0, 0.02, 0, O.boxLock, 0.003);
  O.padlock = grp(0, -0.04, 0.03, O.boxLock); bev(0.07, 0.06, 0.03, M.brass, 0, -0.02, 0, O.padlock, 0.006); mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 14, Math.PI), M.iron, 0, 0.012, 0, O.padlock);
  O.padlock.scale.setScalar(1.6); O.boxLock.scale.setScalar(1.3);   // big enough to read as a padlock from standing height in that dark corner
  O.boxArms = [];
  // inside the box: the slip key on a tag, a hand lamp, flags
  O.boxIn = grp(0, 0.05, 0, O.box);
  O.slipKey = grp(-0.1, 0.02, 0.05, O.boxIn); cyl(0.006, 0.006, 0.08, M.brass, 0, 0, 0, O.slipKey, 8).rotation.z = Math.PI / 2; bev(0.02, 0.05, 0.008, M.brass, -0.05, 0, 0, O.slipKey, 0.002); cyl(0.018, 0.018, 0.004, M.brass, 0.05, 0, 0, O.slipKey, 14).rotation.x = Math.PI / 2;
  O.handLamp = grp(0.14, 0.02, -0.02, O.boxIn); cyl(0.05, 0.055, 0.14, M.iron, 0, 0.07, 0, O.handLamp, 14); cyl(0.03, 0.03, 0.02, std({ color: 0x3a8a3a, roughness: 0.2 }), 0, 0.09, 0.05, O.handLamp, 12).rotation.x = Math.PI / 2; tube([[-0.04, 0.14, 0], [0, 0.2, 0], [0.04, 0.14, 0]], 0.005, M.iron, O.handLamp, 8, 4);
  for (const [c, x] of [[0xa8201a, -0.2], [0x2a6a2a, -0.24]]) { const f = bev(0.3, 0.02, 0.03, std({ color: c, roughness: 0.9 }), x + 0.15, 0.015, -0.12, O.boxIn, 0.004); f.rotation.y = 0.2; }
  O.boxIn.visible = false;
  // the attendant's bell board, on the vestibule side of the partition
  O.bells = grp(0.85, 1.9, PART - TH_P() - 0.0);
  O.bells.rotation.y = Math.PI;
  bev(0.46, 0.22, 0.06, M.teakDark, 0, 0, 0.03, O.bells, 0.008);
  T.bells = ctex(512, 240, () => {}); O.bellFace = plane(0.42, 0.18, std({ map: T.bells, roughness: 0.4 }), 0, 0, 0.061, 0, O.bells);
  cyl(0.04, 0.04, 0.05, M.nickel, 0, 0.16, 0.04, O.bells, 16).rotation.x = Math.PI / 2;
  // an umbrella stand by the washroom wall, and a black umbrella with a crook handle
  O.ustand = grp(POS.umbrella.x, 0, POS.umbrella.z);
  lathe([[0.001, 0], [0.1, 0], [0.11, 0.05], [0.1, 0.45], [0.115, 0.5], [0.105, 0.52], [0.09, 0.5], [0.001, 0.49]], std({ color: 0x2a3a4a, roughness: 0.25, metalness: 0.3 }), 0, 0, 0, O.ustand, 24);
  O.umb = grp(0, 0.12, 0, O.ustand); O.umb.rotation.z = 0.08;
  cyl(0.006, 0.006, 0.9, M.black, 0, 0.45, 0, O.umb, 8); const canopy = lathe([[0.001, 0.05], [0.035, 0.12], [0.045, 0.5], [0.02, 0.8], [0.001, 0.84]], std({ color: 0x0c0c0e, roughness: 0.7 }), 0, 0, 0, O.umb, 10);
  tube([[0, 0.88, 0], [0, 0.98, 0], [0.03, 1.04, 0], [0.07, 1.02, 0], [0.08, 0.96, 0]], 0.011, M.teakDark, O.umb, 16, 8);
  // coat hooks on the partition with the guard's white coat, damp
  for (const x of [-1.1, -1.25]) { const hk = tube([[x, 1.78, PART - 0.03], [x, 1.8, PART - 0.08], [x, 1.86, PART - 0.1]], 0.008, M.brass, scene, 8, 5); }
}
function TH_P() { return 0.025; }

/* ---------------- lounge furniture ---------------- */
function buildFurniture() {
  // sofa-berth under the left windows: buttoned green leather on a teak base
  O.sofa = grp(-HW + 0.33, 0, -1.05);
  bev(0.6, 0.34, 2.3, M.teakDark, 0, 0.17, 0, O.sofa, 0.02); bev(0.58, 0.14, 2.26, M.leather, 0.02, 0.41, 0, O.sofa, 0.05);
  bev(0.12, 0.5, 2.26, M.leather, -0.24, 0.72, 0, O.sofa, 0.05);
  for (const sz of [-1, 1]) bev(0.6, 0.3, 0.08, M.teakDark, 0, 0.5, sz * 1.15, O.sofa, 0.02);
  // bolster
  cyl(0.09, 0.09, 0.5, M.leather, 0.04, 0.56, 0.95, O.sofa, 20).rotation.x = Math.PI / 2;
  // dining table under the third left window, two chairs
  O.table = grp(-HW + 0.42, 0, 2.05);
  bev(0.78, 0.04, 1.1, M.teak, 0, 0.74, 0, O.table, 0.012);
  for (const sz of [-1, 1]) { lathe([[0.001, 0], [0.04, 0], [0.03, 0.04], [0.03, 0.6], [0.05, 0.66], [0.001, 0.72]], M.teakDark, 0.1, 0, sz * 0.35, O.table, 16); }
  bev(0.4, 0.03, 0.03, M.teakDark, 0.1, 0.12, 0, O.table, 0.006).rotation.y = Math.PI / 2;
  // cloth runner, two cups and a thermos
  bev(0.3, 0.004, 1.0, std({ color: 0xece4d0, roughness: 0.95 }), 0, 0.762, 0, O.table, 0.001);
  for (const z of [-0.25, 0.3]) { lathe([[0.001, 0], [0.03, 0], [0.036, 0.06], [0.037, 0.075], [0.001, 0.07]], M.enamel, 0.05, 0.76, z, O.table, 18); lathe([[0.001, 0], [0.07, 0], [0.072, 0.008], [0.001, 0.008]], M.enamel, 0.05, 0.76, z, O.table, 22); }
  lathe([[0.001, 0], [0.045, 0], [0.045, 0.24], [0.03, 0.27], [0.03, 0.3], [0.001, 0.3]], std({ color: 0x2a5a6a, roughness: 0.4, metalness: 0.4 }), -0.2, 0.76, 0.05, O.table, 20);
  O.chairs = [];
  for (const sz of [-1, 1]) { const c = diningChair(); c.position.set(-HW + 0.48, 0, 2.05 + sz * 0.8); c.rotation.y = sz < 0 ? 0 : Math.PI; O.chairs.push(c); }
  // sideboard (the pantry) at the front left of the lounge: cupboard, and a brass tray
  O.side = grp(-HW + 0.28, 0, -3.2);
  bev(0.52, 0.9, 1.2, M.teak, 0, 0.45, 0, O.side, 0.012); bev(0.56, 0.035, 1.24, M.teakDark, 0.01, 0.915, 0, O.side, 0.01);
  for (const sz of [-1, 1]) { bev(0.012, 0.36, 0.5, M.burr, 0.262, 0.52, sz * 0.28, O.side, 0.004); lathe([[0.001, 0], [0.012, 0], [0.008, 0.018], [0.001, 0.022]], M.brass, 0.27, 0.62, sz * 0.08, O.side, 10).rotation.z = -Math.PI / 2; }
  lathe([[0.001, 0], [0.2, 0], [0.21, 0.02], [0.001, 0.01]], M.brass, 0, 0.935, 0.2, O.side, 30);
  lathe([[0.001, 0], [0.06, 0], [0.07, 0.1], [0.05, 0.2], [0.02, 0.24], [0.03, 0.25], [0.001, 0.26]], M.nickel, 0, 0.955, 0.2, O.side, 18);
  // armchair on the right, under the first window
  O.arm1 = armChair(); O.arm1.position.set(HW - 0.42, 0, -1.3); O.arm1.rotation.y = -Math.PI / 2 - 0.25;
  // low bookcase on the right, under the gradient profile
  O.books = grp(HW - 0.17, 0, 1.2);
  bev(0.3, 0.8, 0.9, M.teak, 0, 0.4, 0, O.books, 0.01); bev(0.3, 0.03, 0.94, M.teakDark, 0, 0.815, 0, O.books, 0.008);
  const spines = ctex(1024, 256, (g, w, h) => { let x = 0; const cols = ['#4a1a14', '#1f2d22', '#2a2230', '#5b3a1a', '#3a1010', '#18222e', '#6a4a2a', '#2c1c12']; while (x < w) { const bw = rand(14, 34), bh = rand(170, 250), c = pick(cols); g.fillStyle = c; g.fillRect(x, h - bh, bw - 1, bh); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + bw - 3, h - bh, 2, bh); g.fillStyle = '#b8913f'; for (const yy of [h - bh + 14, h - 22]) g.fillRect(x + 3, yy, bw - 7, 2); x += bw; } speckle(g, w, h, 3000, 0.15); });
  for (const y of [0.1, 0.46]) { const s = plane(0.84, 0.3, std({ map: spines, roughness: 0.7 }), -0.151, y + 0.16, 0, -Math.PI / 2, O.books); bev(0.28, 0.02, 0.86, M.teakDark, 0, y, 0, O.books, 0.004); }
  // observation end: an armchair facing the back windows, a little table
  O.arm2 = armChair(); O.arm2.position.set(-0.62, 0, 4.25); O.arm2.rotation.y = Math.PI + 0.15;
  O.stable = grp(-0.12, 0, 4.55); lathe([[0.001, 0], [0.16, 0], [0.16, 0.02], [0.03, 0.05], [0.025, 0.55], [0.001, 0.56]], M.teakDark, 0, 0, 0, O.stable, 20); mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 36), M.teak, 0, 0.57, 0, O.stable);
  lathe([[0.001, 0], [0.07, 0], [0.075, 0.015], [0.05, 0.02], [0.001, 0.012]], M.brass, 0.05, 0.585, 0.02, O.stable, 24);
}
function diningChair() {
  const c = grp(0, 0, 0);
  bev(0.42, 0.04, 0.4, M.teak, 0, 0.45, 0, c, 0.01); bev(0.4, 0.05, 0.38, M.leather, 0, 0.49, 0, c, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) lathe([[0.001, 0], [0.018, 0], [0.02, 0.1], [0.016, 0.3], [0.02, 0.44], [0.001, 0.45]], M.teakDark, sx * 0.18, 0, sz * 0.17, c, 12);
  for (const sx of [-1, 1]) bev(0.035, 0.5, 0.035, M.teakDark, sx * 0.18, 0.72, -0.18, c, 0.008);
  bev(0.4, 0.14, 0.025, M.teakDark, 0, 0.9, -0.18, c, 0.008); bev(0.34, 0.2, 0.02, M.leather, 0, 0.74, -0.18, c, 0.008);
  return c;
}
function armChair() {
  const c = grp(0, 0, 0);
  bev(0.7, 0.3, 0.66, M.teakDark, 0, 0.2, 0, c, 0.02); bev(0.62, 0.14, 0.6, M.leather, 0, 0.42, 0.02, c, 0.05);
  bev(0.66, 0.6, 0.14, M.leather, 0, 0.72, -0.28, c, 0.05);
  for (const sx of [-1, 1]) { bev(0.12, 0.36, 0.64, M.leather, sx * 0.32, 0.54, 0, c, 0.04); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.025, 0.02, 0.06, M.teakDark, sx * 0.3, 0.03, sz * 0.28, c, 10);
  return c;
}

/* ---------------- the writing desk, the register ---------------- */
function buildDesk() {
  const D = DESK, dx = D.x1 - D.x0, dz = D.z1 - D.z0, cx = (D.x0 + D.x1) / 2, cz = (D.z0 + D.z1) / 2;
  O.desk = grp(cx, 0, cz);
  // top with a leather writing surface
  bev(dx + 0.02, 0.04, dz + 0.02, M.teak, 0, D.h - 0.02, 0, O.desk, 0.012);
  const skiver = plane(dz - 0.24, dx - 0.2, std({ color: 0x1e3a2a, roughness: 0.6 }), 0.02, D.h + 0.001, 0, 0, O.desk); skiver.rotation.x = -Math.PI / 2; skiver.rotation.z = Math.PI / 2;
  // two pedestals of drawers facing the aisle (-x), a kneehole between
  const pw = 0.36;
  for (const sz of [-1, 1]) {
    const pz = sz * (dz / 2 - pw / 2);
    bev(dx, D.h - 0.08, pw, M.teak, 0, (D.h - 0.08) / 2 + 0.02, pz, O.desk, 0.01);
    for (let k = 0; k < 3; k++) { const y = 0.14 + k * 0.2; bev(0.012, 0.17, pw - 0.04, M.burr, -dx / 2 - 0.004, y, pz, O.desk, 0.004); lathe([[0.001, 0], [0.012, 0], [0.008, 0.02], [0.001, 0.024]], M.brass, -dx / 2 - 0.012, y, pz, O.desk, 10).rotation.z = Math.PI / 2; }
  }
  // the kneehole back panel, and the hidden drawer set into the right pedestal's inner side (toward the kneehole)
  bev(0.02, D.h - 0.2, dz - 2 * pw, M.teak, dx / 2 - 0.03, (D.h - 0.2) / 2 + 0.1, 0, O.desk, 0.006);
  // the middle drawer over the kneehole: opens toward -x
  O.mdrawer = grp(0, D.h - 0.1, 0, O.desk);
  const mw = dz - 2 * pw - 0.02;
  bev(0.012, 0.08, mw, M.burr, -dx / 2 - 0.004, 0, 0, O.mdrawer, 0.003);
  bev(dx - 0.08, 0.07, 0.012, M.teak, -0.04, 0, mw / 2 - 0.01, O.mdrawer, 0.002); bev(dx - 0.08, 0.07, 0.012, M.teak, -0.04, 0, -mw / 2 + 0.01, O.mdrawer, 0.002);
  bev(dx - 0.08, 0.008, mw - 0.02, M.teak, -0.04, -0.03, 0, O.mdrawer, 0.002); bev(0.012, 0.07, mw - 0.02, M.teak, dx / 2 - 0.08, 0, 0, O.mdrawer, 0.002);
  lathe([[0.001, 0], [0.014, 0], [0.01, 0.022], [0.001, 0.026]], M.brass, -dx / 2 - 0.012, 0, 0, O.mdrawer, 10).rotation.z = Math.PI / 2;
  // in the drawer: a folded document and a pencil
  O.report = grp(-0.02, -0.02, 0.02, O.mdrawer); bev(0.22, 0.012, 0.3, M.paper, 0, 0, 0, O.report, 0.002); bev(0.006, 0.006, 0.15, std({ color: 0xb8902a, roughness: 0.6 }), 0.07, 0.008, 0.02, O.report, 0.002);
  // the dark slot left when the middle drawer is taken right out
  O.slot = bev(dx - 0.1, 0.07, mw - 0.02, std({ color: 0x0a0806, roughness: 1 }), 0.02, D.h - 0.1, 0, O.desk, 0.002); O.slot.visible = false;
  // the secret tray: hidden at the very back of the middle drawer's slot; it springs forward when the catch is found
  O.sdrawer = grp(0.12, D.h - 0.115, 0, O.desk);
  bev(0.012, 0.045, 0.2, M.burr, -0.1, 0.0, 0, O.sdrawer, 0.002); bev(0.004, 0.006, 0.2, M.brass, -0.107, 0.02, 0, O.sdrawer, 0.001); bev(0.004, 0.006, 0.2, M.brass, -0.107, -0.02, 0, O.sdrawer, 0.001); bev(0.2, 0.006, 0.19, M.teak, 0, -0.02, 0, O.sdrawer, 0.001);
  const kg = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffe0a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })); kg.scale.set(0.07, 0.07, 1); layer1(kg);
  for (const sz of [-1, 1]) bev(0.2, 0.035, 0.008, M.teak, 0, -0.004, sz * 0.095, O.sdrawer, 0.001);
  O.winKey = grp(-0.01, -0.012, 0, O.sdrawer); O.winKey.rotation.y = 0.5; O.winKey.add(kg); cyl(0.004, 0.004, 0.05, M.brass, 0, 0, 0, O.winKey, 8).rotation.z = Math.PI / 2; bev(0.012, 0.018, 0.004, M.brass, -0.028, 0, 0, O.winKey, 0.001); mesh(new THREE.TorusGeometry(0.01, 0.003, 6, 14), M.brass, 0.03, 0, 0, O.winKey).rotation.x = Math.PI / 2;
  O.sdrawer.userData.base = O.sdrawer.position.x; O.sdrawer.visible = false;
  // on the desk: the register (open), a brass lamp, an inkstand
  O.register = grp(0.04, D.h + 0.004, -0.05, O.desk); O.register.rotation.y = -Math.PI / 2 + 0.08;
  bev(0.44, 0.02, 0.3, std({ color: 0x3a1c12, roughness: 0.55 }), 0, 0.01, 0, O.register, 0.004);
  T.register = ctex(1024, 700, () => {}); const pg = plane(0.42, 0.28, std({ map: T.register, roughness: 0.85 }), 0, 0.022, 0, 0, O.register); pg.rotation.x = -Math.PI / 2;
  for (const sx of [-1, 1]) { const curl = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.28, 10, 1, false, 0, Math.PI), M.paper, sx * 0.21, 0.022, 0, O.register); curl.rotation.x = Math.PI / 2; curl.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2; }
  bev(0.004, 0.004, 0.14, std({ color: 0x4a3a20, roughness: 0.6 }), 0.1, 0.03, 0.08, O.register, 0.001);
  O.dlamp = grp(0.25, D.h, 0.38, O.desk);
  lathe([[0.001, 0], [0.08, 0], [0.08, 0.02], [0.03, 0.04], [0.02, 0.1], [0.012, 0.36], [0.02, 0.37], [0.001, 0.38]], M.brass, 0, 0, 0, O.dlamp, 22);
  O.dshade = lathe([[0.06, 0.34], [0.13, 0.26], [0.135, 0.255], [0.066, 0.335]], std({ color: 0xe8d8b0, roughness: 0.7, side: THREE.DoubleSide, emissive: new THREE.Color(0xffb060), emissiveIntensity: 0.4 }), 0, 0, 0, O.dlamp, 28);
  const inks = grp(0.1, D.h, -0.42, O.desk); bev(0.14, 0.02, 0.22, M.teakDark, 0, 0.01, 0, inks, 0.004); for (const z of [-0.05, 0.05]) lathe([[0.001, 0], [0.03, 0], [0.032, 0.05], [0.015, 0.06], [0.018, 0.07], [0.001, 0.07]], M.glass, 0, 0.02, z, inks, 14);
  // the desk chair
  O.dchair = diningChair(); O.dchair.position.set(D.x0 - 0.5, 0, D.z0 + 0.05); O.dchair.rotation.y = Math.PI / 2 + 0.7;
}

/* ---------------- the washroom ---------------- */
function buildWashroom() {
  const x0 = WC.x0, x1 = HW, z0 = PART, z1 = WC.z1;
  // tiles to 1.5 m on the inside walls, cream above
  const tileWall = (w, h, mat, x, y, z, ry) => { const m = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(w, h), w / 0.4, h / 0.4), mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); return m; };
  tileWall(x1 - x0, 1.5, M.tiles, (x0 + x1) / 2, 0.75, z0 + 0.03, 0);           // front (partition)
  tileWall(x1 - x0, 1.5, M.tiles, (x0 + x1) / 2, 0.75, z1 - 0.053, Math.PI);     // back
  tileWall(z1 - z0, 1.5, M.tiles, x1 - 0.004, 0.75, (z0 + z1) / 2, -Math.PI / 2);   // outer wall (has the frosted window above 1.25: tiles stop at 1.5 so the window sits in the cream)
  const west = [[z0, WC.dz0], [WC.dz1, z1]]; for (const [a, b] of west) tileWall(b - a, 1.5, M.tiles, x0 + TH_W(), 0.75, (a + b) / 2, Math.PI / 2);
  for (const [w, x, z, ry] of [[x1 - x0, (x0 + x1) / 2, z0 + 0.03, 0], [x1 - x0, (x0 + x1) / 2, z1 - 0.053, Math.PI], [z1 - z0, x1 - 0.004, (z0 + z1) / 2, -Math.PI / 2]]) tileWall(w, WALL_H - 1.5, M.cream, x, 1.5 + (WALL_H - 1.5) / 2, z, ry);
  for (const [a, b] of west) tileWall(b - a, WALL_H - 1.5, M.cream, x0 + TH_W(), 1.5 + (WALL_H - 1.5) / 2, (a + b) / 2, Math.PI / 2);
  // chequered floor
  const f = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 0.5, (z1 - z0) / 0.5), M.chequer); f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0.004, (z0 + z1) / 2); scene.add(f);
  // basin on the front wall, with hot and cold taps, and the mirror above
  O.basin = grp(0.58, 0, z0 + 0.03);
  lathe([[0.001, 0], [0.03, 0], [0.04, 0.4], [0.05, 0.62], [0.001, 0.62]], M.enamel, 0, 0, 0.2, O.basin, 18);
  const bowl = lathe([[0.001, 0.66], [0.12, 0.66], [0.2, 0.74], [0.215, 0.82], [0.21, 0.83], [0.19, 0.83], [0.18, 0.76], [0.1, 0.7], [0.001, 0.69]], M.enamel, 0, 0, 0.2, O.basin, 36); bowl.scale.z = 0.85;
  O.waterSurf = mesh(new THREE.CircleGeometry(0.1, 20), std({ color: 0x9aa8b0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.0 }), 0, 0.705, 0.2, O.basin); O.waterSurf.rotation.x = -Math.PI / 2;
  O.taps = [];
  for (const [sx, col] of [[-1, 0xb02a20], [1, 0x2a4ab0]]) {
    const t = grp(sx * 0.1, 0.84, 0.07, O.basin);
    cyl(0.014, 0.018, 0.06, M.nickel, 0, 0.03, 0, t, 12); tube([[0, 0.06, 0], [0, 0.09, 0.03], [0, 0.07, 0.07]], 0.01, M.nickel, t, 10, 8);
    O[sx < 0 ? 'hotHead' : 'coldHead'] = grp(0, 0.075, 0, t); for (let k = 0; k < 4; k++) { const sp = cyl(0.005, 0.005, 0.05, M.nickel, 0, 0, 0, O[sx < 0 ? 'hotHead' : 'coldHead'], 6); sp.rotation.z = Math.PI / 2; sp.rotation.y = k * Math.PI / 4; }
    cyl(0.01, 0.01, 0.004, std({ color: col, roughness: 0.3 }), 0, 0.095, 0, t, 12);
    O.taps.push(t);
  }
  O.stream = cyl(0.004, 0.006, 0.12, std({ color: 0xc8d4dc, roughness: 0.05, transparent: true, opacity: 0.55 }), -0.1, 0.77, 0.14, O.basin, 8); layer1(O.stream); O.stream.visible = false;
  // mirror (a real reflection) in a nickel frame, and the fog that forms on it
  O.wcMirrorG = grp(0.58, 1.45, z0 + 0.035);
  mesh(frameGeo(0.46, 0.56, 0.4, 0.5, 0.02, 0.005), M.nickel, 0, 0, 0, O.wcMirrorG);
  O.wcMirror = makeMirror(0.4, 0.5, { res: 384, tint: 0xe4e2dc }); O.wcMirror.position.set(0, 0, 0.012); O.wcMirrorG.add(O.wcMirror); O.wcMirror.userData.noRay = false;
  O.fog = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), fogMaterial()); O.fog.position.set(0, 0, 0.016); O.wcMirrorG.add(O.fog); layer1(O.fog); O.fog.userData.noEnv = true;
  // a glass shelf under the mirror
  bev(0.36, 0.008, 0.08, M.glass, 0, -0.3, 0.04, O.wcMirrorG, 0.002);
  // the commode (front right corner), the geyser above it with its switch and red light
  O.wc = grp(1.05, 0, z0 + 0.3);
  lathe([[0.001, 0], [0.12, 0], [0.13, 0.1], [0.16, 0.36], [0.19, 0.4], [0.001, 0.4]], M.enamel, 0, 0, 0, O.wc, 28).scale.z = 1.25;
  mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 28), M.teakDark, 0, 0.415, 0.02, O.wc).rotation.x = Math.PI / 2;
  bev(0.36, 0.3, 0.14, M.enamel, 0, 0.62, -0.22, O.wc, 0.02);
  O.geyser = grp(HW - 0.2, 1.86, -3.62);
  cyl(0.15, 0.15, 0.48, M.enamel, 0, 0, 0, O.geyser, 24); lathe([[0.001, 0.24], [0.15, 0.24], [0.1, 0.28], [0.001, 0.29]], M.enamel, 0, 0, 0, O.geyser, 24); lathe([[0.001, -0.24], [0.15, -0.24], [0.1, -0.28], [0.001, -0.29]], M.enamel, 0, 0, 0, O.geyser, 24);
  tube([[HW - 0.2, 1.57, -3.62], [HW - 0.2, 1.3, -3.62], [0.9, 1.2, -3.84], [0.5, 1.0, -3.86], [0.48, 0.9, -3.84]], 0.011, M.nickel, scene, 24, 6);
  O.gLight = mesh(new THREE.SphereGeometry(0.012, 10, 8), std({ color: 0x300808, emissive: new THREE.Color(0xff2010), emissiveIntensity: 0 }), -0.15, -0.12, 0, O.geyser);
  O.gSwitch = grp(0.93, 1.36, PART + 0.03);
  bev(0.07, 0.1, 0.02, M.cream, 0, 0, 0, O.gSwitch, 0.004); O.gToggle = bev(0.014, 0.03, 0.02, M.black, 0, 0.01, 0.012, O.gSwitch, 0.003);
  plane(0.1, 0.04, std({ map: ctex(200, 80, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = `600 40px ${TEKO}`; g.textAlign = 'center'; g.fillText('GEYSER', w / 2, 52); }), roughness: 0.5 }), 0, 0.08, 0.012, 0, O.gSwitch);
  // a towel ring and a soap dish
  mesh(new THREE.TorusGeometry(0.08, 0.008, 8, 24), M.nickel, 0.95, 1.1, WC.z1 - 0.05);
  // the washroom door (teak, hinged on its front edge, opens into the lounge)
  O.wcPivot = grp(WC.x0 - TH_W(), 0, WC.dz0);
  O.wcDoor = grp(0, 0, (WC.dz1 - WC.dz0) / 2, O.wcPivot);
  bev(0.04, 1.96, WC.dz1 - WC.dz0 - 0.01, M.teak, -0.02, 0.99, 0, O.wcDoor, 0.008);
  for (const y of [0.5, 1.4]) { const p = bev(0.012, 0.6, WC.dz1 - WC.dz0 - 0.14, M.burr, -0.043, y, 0, O.wcDoor, 0.004); }
  lathe([[0.001, 0], [0.022, 0], [0.022, 0.02], [0.012, 0.03], [0.018, 0.06], [0.001, 0.065]], M.brass, -0.05, 1.0, (WC.dz1 - WC.dz0) / 2 - 0.08, O.wcDoor, 12).rotation.z = Math.PI / 2;
  plane(0.14, 0.05, std({ map: ctex(256, 96, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = `600 56px ${TEKO}`; g.textAlign = 'center'; g.fillText('LAVATORY', w / 2, 68); }), roughness: 0.4 }), -0.046, 1.72, 0, -Math.PI / 2, O.wcDoor);
}
function TH_W() { return 0.003; }
function fogMaterial() {
  // fog on the mirror: fog amount everywhere except where a finger once drew (the mask); a handprint can press in later
  T.fogNoise = tex(pix(128, 128, (x, y) => { const v = 170 + tfbm(x, y, 128, 128, 6, 4) * 85; return [v, v, v]; }), { srgb: false });
  T.fogMask = ctex(256, 320, () => {}, { linear: true });
  T.handMask = ctex(256, 320, () => {}, { linear: true });
  return new THREE.ShaderMaterial({
    uniforms: { fog: { value: 0 }, hand: { value: 0 }, tN: { value: T.fogNoise }, tM: { value: T.fogMask }, tH: { value: T.handMask }, lit: { value: new THREE.Color(0.55, 0.52, 0.48) } },
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float fog, hand; uniform sampler2D tN, tM, tH; uniform vec3 lit; varying vec2 vU;
      void main(){ float n = texture2D(tN, vU*1.6).r; float m = texture2D(tM, vU).r; float h = texture2D(tH, vU).r*hand;
        float edge = smoothstep(0.0, 0.35, min(min(vU.x, 1.0-vU.x), min(vU.y, 1.0-vU.y))*3.0);
        float a = fog*(0.62+0.38*n)*edge*(1.0-m*0.92)*(1.0-h*0.9);
        gl_FragColor = vec4(lit*(0.75+0.25*n), a); }`,
    transparent: true, depthWrite: false,
  });
}

/* ---------------- lamps, fans, the alarm chain, framed things, the clock ---------------- */
function buildFittings() {
  O.bowls = [];
  for (const z of [-2.9, -0.55, 1.75, 3.95]) {
    const y = roofY(0) - 0.02, g = grp(0, y, z);
    lathe([[0.001, 0], [0.09, 0], [0.09, -0.02], [0.05, -0.04], [0.001, -0.04]], M.brass, 0, 0, 0, g, 24);
    const b = mesh(new THREE.SphereGeometry(0.15, 28, 14, 0, TAU, Math.PI / 2, Math.PI / 2), M.bowl.clone(), 0, -0.02, 0, g); b.scale.y = 0.55; layer1(b);
    mesh(new THREE.TorusGeometry(0.15, 0.008, 8, 36), M.brass, 0, -0.02, 0, g).rotation.x = Math.PI / 2;
    const gl = new THREE.Sprite(M.glowS.clone()); gl.scale.set(0.5, 0.5, 1); gl.position.set(0, -0.06, 0); layer1(gl); g.add(gl);
    O.bowls.push({ g, b, gl, z });
  }
  // two caged ceiling fans
  O.fans = [];
  for (const z of [-1.55, 2.85]) {
    const y = roofY(0.55) - 0.02, g = grp(0.55, y, z); g.rotation.z = 0.25;
    cyl(0.03, 0.03, 0.08, M.cream, 0, -0.04, 0, g, 14); const hub = grp(0, -0.12, 0, g);
    lathe([[0.001, 0], [0.07, 0], [0.08, -0.04], [0.06, -0.08], [0.001, -0.09]], M.cream, 0, 0.02, 0, hub, 20);
    const rot = grp(0, -0.09, 0, hub); for (let k = 0; k < 3; k++) { const bl = bev(0.24, 0.006, 0.07, M.steel, 0.14, 0, 0, grp(0, 0, 0, rot), 0.002); bl.parent.rotation.y = k * TAU / 3; bl.rotation.x = 0.25; }
    const cage = grp(0, -0.09, 0, hub);
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; tube([[0, 0.02, 0], [Math.cos(a) * 0.2, 0.0, Math.sin(a) * 0.2], [Math.cos(a) * 0.3, -0.03, Math.sin(a) * 0.3], [Math.cos(a) * 0.2, -0.06, Math.sin(a) * 0.2], [0, -0.07, 0]], 0.002, M.cream, cage, 10, 3); }
    mesh(new THREE.TorusGeometry(0.3, 0.004, 4, 40), M.cream, 0, -0.03, 0, cage).rotation.x = Math.PI / 2;
    O.fans.push({ g, rot, spd: 0 });
  }
  // fan and light switches by the partition door (lounge side)
  O.switches = grp(PDOOR.x0 - 0.2, 1.4, PART + 0.03);
  bev(0.16, 0.22, 0.02, M.teakDark, 0, 0, 0, O.switches, 0.005);
  O.fanSw = bev(0.02, 0.04, 0.02, M.brass, -0.04, 0.03, 0.02, O.switches, 0.004); bev(0.02, 0.04, 0.02, M.brass, 0.04, 0.03, 0.02, O.switches, 0.004);
  plane(0.14, 0.05, std({ map: ctex(280, 100, (g, w, h) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = `600 44px ${TEKO}`; g.textAlign = 'center'; g.fillText('FANS    LIGHTS', w / 2, 62); }), roughness: 0.5 }), 0, -0.06, 0.011, 0, O.switches);
  // the alarm chain along the left side of the roof, a red handle by the sofa
  const cy = WALL_H + 0.1; tube([[-HW + 0.08, cy, ZF + 0.2], [-HW + 0.08, cy, ZR - 0.2]], 0.008, M.iron, scene, 4, 5);
  O.chain = grp(-HW + 0.1, cy - 0.02, -0.2); for (let k = 0; k < 12; k++) { const lk = mesh(new THREE.TorusGeometry(0.012, 0.003, 4, 10), M.iron, 0, -k * 0.02, 0, O.chain); lk.rotation.y = k % 2 ? Math.PI / 2 : 0; lk.scale.y = 1.5; }
  const ch = grp(0, -0.26, 0, O.chain); bev(0.08, 0.03, 0.03, std({ color: 0xb01a14, roughness: 0.5 }), 0, 0, 0, ch, 0.008);
  plane(0.22, 0.12, std({ map: ctex(360, 200, (g, w, h) => { g.fillStyle = '#b01a14'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4ecd8'; g.textAlign = 'center'; g.font = `600 40px ${TEKO}`; g.fillText('TO STOP THE TRAIN', w / 2, 50); g.fillText('PULL THE CHAIN', w / 2, 94); g.font = `500 28px ${TEKO}`; g.fillText('PENALTY FOR IMPROPER USE RS. 50', w / 2, 140); g.font = `500 30px ${DEVA}`; g.fillText('गाड़ी रोकने के लिए ज़ंजीर खींचें', w / 2, 182); }), roughness: 0.35 }), -HW + 0.006, 1.95, -0.2, Math.PI / 2);
  // the wall clock over the partition door (lounge side): a railway clock stopped at twenty to three
  O.clock = grp(POS.clock.x, POS.clock.y - 0.28, PART + 0.03);
  mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 40), M.teakDark, 0, 0, 0.025, O.clock).rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 40), M.brass, 0, 0, 0.052, O.clock);
  T.clockFace = ctex(256, 256, (g, w, h) => { g.fillStyle = '#efe8d4'; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill(); g.fillStyle = '#1a1a1a'; g.font = `600 30px ${TEKO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let k = 1; k <= 12; k++) { const a = k / 12 * TAU - Math.PI / 2; g.fillText(String(k), 128 + Math.cos(a) * 98, 131 + Math.sin(a) * 98); } for (let k = 0; k < 60; k++) { const a = k / 60 * TAU; g.fillRect(128 + Math.cos(a) * 116 - 1, 128 + Math.sin(a) * 116 - 1, k % 5 ? 2 : 4, k % 5 ? 2 : 4); } g.font = `500 16px ${TEKO}`; g.fillText('G. I. P. RAILWAY', 128, 170); speckle(g, w, h, 400, 0.1); });
  mesh(new THREE.CircleGeometry(0.165, 40), std({ map: T.clockFace, roughness: 0.3 }), 0, 0, 0.051, O.clock);
  O.hHour = grp(0, 0, 0.056, O.clock); bev(0.012, 0.09, 0.003, M.black, 0, 0.04, 0, O.hHour, 0.001);
  O.hMin = grp(0, 0, 0.059, O.clock); bev(0.008, 0.13, 0.003, M.black, 0, 0.06, 0, O.hMin, 0.001);
  // gradient profile of the ghat (framed, right wall)
  T.profile = ctex(1024, 560, () => {});
  O.profile = grp(HW - 0.02, 1.38, 1.2); O.profile.rotation.y = -Math.PI / 2;
  mesh(frameGeo(0.84, 0.5, 0.76, 0.42, 0.03, 0.008), M.teakDark, 0, 0, 0, O.profile); plane(0.76, 0.42, std({ map: T.profile, roughness: 0.8 }), 0, 0, 0.012, 0, O.profile);
  plane(0.76, 0.42, M.glass, 0, 0, 0.022, 0, O.profile).userData.noRay = true;
  // the staff photograph, 1926 (framed, left wall over the sofa)
  T.photo = ctex(640, 420, () => {});
  O.photo = grp(-HW + 0.02, 1.52, -0.5); O.photo.rotation.y = Math.PI / 2;
  mesh(frameGeo(0.5, 0.36, 0.42, 0.28, 0.025, 0.006), M.teakDark, 0, 0, 0, O.photo); plane(0.42, 0.28, std({ map: T.photo, roughness: 0.6 }), 0, 0, 0.01, 0, O.photo);
  // a no-smoking plate in the vestibule, enamel
  plane(0.2, 0.07, std({ map: ctex(320, 112, (g, w, h) => { g.fillStyle = '#f0ead8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a3a7a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#1a3a7a'; g.font = `600 46px ${TEKO}`; g.textAlign = 'center'; g.fillText('NO SMOKING', w / 2, 72); }), roughness: 0.25 }), -1.05, 1.95, PART - 0.03, Math.PI);
}

/* ---------------- the rear balcony, outside ---------------- */
function buildBalcony() {
  O.balc = grp(0, 0, 0);
  const z0 = BALC.z0, z1 = BALC.z1;
  // grating floor, headstock and buffers under it
  const grate = std({ map: ctex(128, 128, (g, w, h) => { g.fillStyle = '#0c0c0c'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3836'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 6, h); for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 4); }, { repeat: [8, 3] }), metalness: 0.5, roughness: 0.7 });
  bev(HW * 2 + 0.05, 0.04, z1 - z0, grate, 0, -0.03, (z0 + z1) / 2, O.balc, 0.004);
  bev(HW * 2 + 0.1, 0.3, 0.12, M.ironRed, 0, -0.25, z1 - 0.06, O.balc, 0.01);
  for (const sx of [-1, 1]) { cyl(0.2, 0.2, 0.06, M.iron, sx * 0.95, -0.3, z1 + 0.25, O.balc, 24).rotation.x = Math.PI / 2; cyl(0.06, 0.08, 0.22, M.steel, sx * 0.95, -0.3, z1 + 0.11, O.balc, 14).rotation.x = Math.PI / 2; }
  // railings
  const rl = M.brass;
  for (const sx of [-1, 1]) { tube([[sx * (HW - 0.05), 1.0, z0 + 0.02], [sx * (HW - 0.05), 1.0, z1 - 0.05]], 0.02, rl, O.balc, 4, 8); for (const z of [z0 + 0.3, z1 - 0.05]) cyl(0.015, 0.015, 1.0, rl, sx * (HW - 0.05), 0.5, z, O.balc, 8); }
  tube([[-HW + 0.05, 1.0, z1 - 0.05], [HW - 0.05, 1.0, z1 - 0.05]], 0.02, rl, O.balc, 4, 8);
  for (let x = -1.2; x <= 1.21; x += 0.3) cyl(0.01, 0.01, 1.0, M.iron, x, 0.5, z1 - 0.05, O.balc, 6);
  tube([[-HW + 0.05, 0.45, z1 - 0.05], [HW - 0.05, 0.45, z1 - 0.05]], 0.01, M.iron, O.balc, 4, 6);
  // canopy: the roof overhangs the balcony
  const cz = z1 - z0 + 0.1; const can = new THREE.Mesh(roofGeo(z0, z1 + 0.05), std({ color: 0x2a1a14, roughness: 0.7, side: THREE.DoubleSide })); can.position.y = 0.06; O.balc.add(can);
  // the outer rear face of the saloon: maroon paint, with the number
  T.rearFace = ctex(512, 512, (g, w, h) => { g.fillStyle = '#4a1414'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) blot(g, rand(0, w), rand(0, h), rand(10, 50), 0.2, '10,4,4'); for (let i = 0; i < 12; i++) { g.strokeStyle = `rgba(20,8,6,${rand(0.2, 0.5)})`; g.lineWidth = rand(1, 3); const x = rand(0, w); g.beginPath(); g.moveTo(x, rand(0, h * 0.3)); g.lineTo(x + rand(-4, 4), rand(h * 0.5, h)); g.stroke(); } });
  // the tail lamp on the right corner post, with the key ring hanging from its handle
  O.tail = grp(LAMP.x, LAMP.y, LAMP.z);
  bev(0.03, 0.4, 0.03, M.iron, 0, -0.2, 0.03, O.tail, 0.004);
  const body = cyl(0.085, 0.095, 0.24, M.iron, 0, 0.12, 0, O.tail, 18);
  lathe([[0.001, 0.24], [0.09, 0.24], [0.05, 0.3], [0.02, 0.31], [0.001, 0.32]], M.iron, 0, 0, 0, O.tail, 18);
  O.redLens = mesh(new THREE.CircleGeometry(0.06, 24), std({ color: 0x400404, emissive: new THREE.Color(0xff1a08), emissiveIntensity: 6, roughness: 0.2 }), 0, 0.12, 0.096, O.tail);
  mesh(new THREE.TorusGeometry(0.063, 0.008, 6, 24), M.brass, 0, 0.12, 0.096, O.tail);
  const ws = mesh(new THREE.CircleGeometry(0.03, 16), std({ color: 0x302010, emissive: new THREE.Color(0xffc070), emissiveIntensity: 2 }), 0, 0.12, -0.096, O.tail); ws.rotation.y = Math.PI;
  tube([[-0.05, 0.3, 0], [0, 0.4, 0], [0.05, 0.3, 0]], 0.006, M.iron, O.tail, 10, 5);
  O.redGlow = new THREE.Sprite(M.redS.clone()); O.redGlow.scale.set(0.5, 0.5, 1); O.redGlow.position.set(0, 0.12, 0.15); layer1(O.redGlow); O.tail.add(O.redGlow);
  // the key ring: iron ring, three keys and a brass tag, swinging from the handle
  O.ring = grp(0, 0.37, 0, O.tail);
  mesh(new THREE.TorusGeometry(0.03, 0.003, 6, 18), M.iron, 0, -0.03, 0, O.ring);
  O.keys = grp(0, -0.06, 0, O.ring);
  for (const [a, l] of [[-0.3, 0.07], [0.1, 0.09], [0.4, 0.06]]) { const k = grp(0, 0, 0, O.keys); k.rotation.z = a; cyl(0.0035, 0.0035, l, M.brass, 0, -l / 2, 0, k, 6); bev(0.012, 0.016, 0.004, M.brass, 0.006, -l + 0.006, 0, k, 0.001); }
  const tag = grp(-0.01, -0.02, 0.004, O.keys); tag.rotation.z = -0.6; bev(0.028, 0.04, 0.003, M.brass, 0, -0.03, 0, tag, 0.001);
  hitbox('ringOut', O.ring, 0.05);
}

/* =====================================================================
   NIGHT MAIL · part C: the world outside (it moves, the saloon doesn't),
   the loop, the figures, the wreck in the glass, the lights
   ===================================================================== */
/* ---------------- the loop: one lap of the same stretch of line ----------------
   0-44 s climbing the ghat; 44-66 through the tunnel; 66-70 easing; 70-80 creeping
   through the level halt (couplings slack); 80-86 picking up; 86-96 climbing again. */
const LOOP = { len: 96, tun0: 44, tun1: 66, ease: 66, halt0: 70, halt1: 80, pick: 86, slack0: 68.2, slack1: 77.5, whistle: 40.5 };
function speedAt(t) {
  if (t < LOOP.ease) return 12.5;
  if (t < LOOP.halt0) return lerp(12.5, 5.2, smooth((t - LOOP.ease) / (LOOP.halt0 - LOOP.ease)));
  if (t < LOOP.halt1) return 5.2;
  if (t < LOOP.pick) return lerp(5.2, 12.5, smooth((t - LOOP.halt1) / (LOOP.pick - LOOP.halt1)));
  return 12.5;
}
const STAB = (() => { const dt = 0.02, n = Math.ceil(LOOP.len / dt) + 2, a = new Float32Array(n); let s = 0; for (let i = 0; i < n; i++) { a[i] = s; s += speedAt(i * dt) * dt; } return { dt, a }; })();
function sAt(t) { const f = clamp(t, 0, LOOP.len) / STAB.dt, i = Math.floor(f), k = f - i; return STAB.a[i] + (STAB.a[Math.min(i + 1, STAB.a.length - 1)] - STAB.a[i]) * k; }
const S_T0 = sAt(LOOP.tun0), S_T1 = sAt(LOOP.tun1), S_H0 = sAt(LOOP.halt0) - 16, S_H1 = S_H0 + 60;
const TUN = { half: 2.6, wall: 3.4 };     // tunnel half-width and wall height above rail, then the arch

/* ---------------- a few more textures for outside ---------------- */
function makeOutsideTextures() {
  // a fern frond (alpha), for the cutting and for the wreck
  T.fern = tex(canv(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 3;
    const stem = (x0, y0, a, len, lf) => { g.beginPath(); g.moveTo(x0, y0); const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = x0 + Math.sin(a + t * 0.5) * len * t, y = y0 - Math.cos(a + t * 0.5) * len * t; pts.push([x, y, t]); g.lineTo(x, y); } g.stroke(); for (const [x, y, t] of pts) { if (t < 0.08) continue; const l = lf * (1 - t) + 4; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * l * 0.5 * Math.cos(a), y + s * l * 0.5 * Math.sin(a) - 1, l * 0.55, 3, a + s * 0.3, 0, TAU); g.fill(); } } };
    stem(128, 250, -0.5, 200, 26); stem(128, 250, 0.1, 230, 30); stem(128, 250, 0.7, 190, 24);
  }));
  // moss / damp for the wreck walls (alpha)
  T.moss = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 6, 5), m = clamp((n - 0.42) * 3, 0, 1); const edge = Math.min(x, 255 - x, y, 255 - y) / 40; return [255, 255, 255, 255 * m * clamp(edge, 0, 1)]; }), { srgb: false });
  T.mossCol = tex(pix(128, 128, (x, y) => { const n = tfbm(x, y, 128, 128, 6, 3); return mixc([30, 44, 20], [70, 84, 36], n); }));
  // station nameboard: yellow, three lines
  T.board = ctex(1024, 384, (g, w, h) => {
    g.fillStyle = '#e8b82a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `400 96px ${DEVA}`; g.fillText('काशेली घाट', w / 2, 92);
    g.font = `600 118px ${TEKO}`; g.fillText('KASHELI GHAT', w / 2, 212);
    g.font = `500 44px ${TEKO}`; g.fillText('HT. ABOVE M.S.L. 562.45 M  ·  समुद्र सतह से ऊँचाई 562.45 मी', w / 2, 320);
    for (let i = 0; i < 40; i++) blot(g, rand(0, w), rand(0, h), rand(10, 60), 0.12, '80,50,10');
  });
  T.caution = ctex(512, 320, (g, w, h) => { g.fillStyle = '#f2ede0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b01a14'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#b01a14'; g.textAlign = 'center'; g.font = `600 64px ${TEKO}`; g.fillText('CAUTION', w / 2, 80); g.fillStyle = '#141414'; g.font = `500 40px ${TEKO}`; g.fillText('1 IN 37 FALLING GRADIENT', w / 2, 150); g.fillText('BEYOND THIS POINT', w / 2, 196); g.font = `500 32px ${TEKO}`; g.fillText('KASHELI GHAT HALT IS ON THE LEVEL', w / 2, 262); for (let i = 0; i < 20; i++) blot(g, rand(0, w), rand(0, h), rand(8, 40), 0.15, '90,60,20'); });
  T.hutClock = ctex(256, 256, (g, w, h) => { g.fillStyle = '#f2ecd8'; g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#1a1a1a'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.save(); g.translate(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); g.rotate(a + Math.PI / 2); g.fillRect(-3, -12, 6, 24); g.restore(); } const hand = (ang, len, wd) => { g.save(); g.translate(128, 128); g.rotate(ang); g.fillRect(-wd / 2, -len, wd, len + 14); g.restore(); }; hand((2 + 40 / 60) / 12 * TAU, 62, 12); hand(40 / 60 * TAU, 96, 7); });
  T.hutWin = ctex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 70, 4, 64, 64, 90); gr.addColorStop(0, '#ffd890'); gr.addColorStop(1, '#8a4a18'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1a0c'; g.fillRect(60, 0, 8, h); g.fillRect(0, 60, w, 8); });
}

/* ---------------- the line ---------------- */
function buildOutside() {
  makeOutsideTextures();
  O.world = grp(0, 0, 0); O.world.userData.keep = true;
  const Z0 = -170, Z1 = 240, LEN = Z1 - Z0, ZC = (Z0 + Z1) / 2;
  // ballast and sleepers (the texture scrolls), two rails
  O.trackBed = mesh(new THREE.PlaneGeometry(4.2, LEN, 1, 80), M.track, 0, RAIL - 0.17, ZC, O.world); O.trackBed.rotation.x = -Math.PI / 2; O.trackBed.material = M.track.clone();
  for (const t of [O.trackBed.material.map, O.trackBed.material.normalMap]) { t.repeat.set(1, LEN / 3.9); }
  O.trackBed.castShadow = false;
  for (const sx of [-1, 1]) {
    const x = sx * GAUGE / 2; mesh(new THREE.BoxGeometry(0.075, 0.13, LEN, 1, 1, 120), M.rail, x, RAIL - 0.065, ZC, O.world).castShadow = false;
    mesh(new THREE.BoxGeometry(0.07, 0.012, LEN, 1, 1, 120), M.railTop, x, RAIL + 0.004, ZC, O.world).castShadow = false;
  }
  // shoulders beyond the ballast: dark wet earth
  for (const sx of [-1, 1]) { const e = mesh(new THREE.PlaneGeometry(2.4, LEN, 1, 60), std({ color: 0x14120f, roughness: 0.6 }), sx * 3.2, RAIL - 0.3, ZC, O.world); e.rotation.x = -Math.PI / 2; e.castShadow = false; }
  // the cutting on the left: wet basalt, 9 m high
  O.cut = mesh(new THREE.PlaneGeometry(LEN, 9.5, 80, 2), M.rock.clone(), -4.6, RAIL + 4.4, ZC, O.world); O.cut.rotation.y = Math.PI / 2; O.cut.castShadow = false;
  for (const t of [O.cut.material.map, O.cut.material.normalMap]) t.repeat.set(LEN / 8, 9.5 / 6);
  // ferns clinging to the cutting
  O.ferns = [];
  const fernM = std({ color: 0x2a4a22, alphaMap: T.fern, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5 });
  for (let i = 0; i < 26; i++) { const f = mesh(new THREE.PlaneGeometry(rand(0.6, 1.4), rand(0.6, 1.2)), fernM, -4.5, RAIL + rand(0.2, 3.5), 0, O.world); f.rotation.y = Math.PI / 2 + rand(-0.4, 0.4); f.rotation.z = rand(-0.4, 0.4); f.castShadow = false; f.userData.off = rand(0, 280); O.ferns.push(f); }
  // the parapet on the ravine side
  O.parapet = mesh(new THREE.BoxGeometry(0.45, 0.75, LEN, 1, 1, 80), M.parapet.clone(), 2.75, RAIL + 0.1, ZC, O.world); O.parapet.castShadow = false;
  O.parapet.material.map = T.parapet.clone(); O.parapet.material.map.needsUpdate = true; O.parapet.material.map.repeat.set(LEN / 2, 1);
  // the valley: far ridges on a wrap-round strip, and a stormy sky
  const hg = new THREE.CylinderGeometry(190, 190, 100, 72, 1, true, 0, Math.PI * 2); O.hills = mesh(hg, M.hills, 0, 20, 0, O.world); O.hills.material.side = THREE.BackSide; O.hills.castShadow = O.hills.receiveShadow = false; layer1(O.hills);
  const vf = mesh(new THREE.PlaneGeometry(300, 560), std({ color: 0x040506, roughness: 1 }), 152, -45, 0, O.world); vf.rotation.x = -Math.PI / 2; vf.castShadow = false;
  O.sky = mesh(new THREE.SphereGeometry(260, 32, 16), M.sky, 0, 0, 0, O.world); O.sky.castShadow = O.sky.receiveShadow = false; layer1(O.sky);
  T.clouds.repeat.set(3, 2);
  // telegraph poles on the ravine side, every 55 m
  O.poles = [];
  for (let i = 0; i < 6; i++) {
    const p = grp(3.35, RAIL - 0.3, 0, O.world);
    cyl(0.07, 0.1, 7.2, M.pole, 0, 3.6, 0, p, 10); bev(1.1, 0.08, 0.08, M.pole, 0, 6.8, 0, p, 0.01); bev(0.9, 0.06, 0.06, M.pole, 0, 6.3, 0, p, 0.01);
    for (const x of [-0.45, -0.15, 0.15, 0.45]) lathe([[0.001, 0], [0.03, 0], [0.035, 0.05], [0.02, 0.09], [0.001, 0.1]], M.white, x, 6.84, 0, p, 10);
    p.userData.off = i * 55; O.poles.push(p);
  }
  // wires: straight runs along the line (the sag between poles is lost at this distance)
  for (const [x, y] of [[-0.45, 6.92], [-0.15, 6.92], [0.15, 6.92], [0.45, 6.92]]) { const w = mesh(new THREE.CylinderGeometry(0.008, 0.008, LEN, 4, 160), M.pole, 3.35 + x, RAIL - 0.3 + y - 0.1, ZC, O.world); w.rotation.x = Math.PI / 2; w.castShadow = false; }
  // rain: short streaks falling past the carriage (never inside it)
  const N = IS_TOUCH ? 700 : 1400, rp = new Float32Array(N * 6);
  O.rain = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x9aa6b4, transparent: true, opacity: 0.45, depthWrite: false }));
  O.rain.geometry.setAttribute('position', new THREE.BufferAttribute(rp, 3)); O.rain.frustumCulled = false; layer1(O.rain); O.world.add(O.rain);
  O.rainP = []; for (let i = 0; i < N; i++) O.rainP.push([rand(-7, 7), rand(-1.6, 6), rand(-14, 40)]);
  buildTunnel(); buildHalt();
}

/* ---------------- the tunnel (No. 17) ---------------- */
function tunnelProfile(n = 30) {
  const pts = [], h = TUN.wall, r = TUN.half, y0 = RAIL - 0.3;
  pts.push([r, y0]); pts.push([r, RAIL + h]);
  for (let i = 1; i < n; i++) { const a = i / n * Math.PI; pts.push([Math.cos(a) * r, RAIL + h + Math.sin(a) * r * 0.9]); }
  pts.push([-r, RAIL + h]); pts.push([-r, y0]);
  return pts;
}
function buildTunnel() {
  const L = S_T1 - S_T0, prof = tunnelProfile(), pos = [], uv = [], idx = [];
  let acc = 0; const lens = [0]; for (let i = 1; i < prof.length; i++) { acc += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); lens.push(acc); }
  const segs = 40;
  for (let i = 0; i < prof.length; i++) for (let j = 0; j <= segs; j++) { const z = -L * j / segs; pos.push(prof[i][0], prof[i][1], z); uv.push(lens[i] / 4, -z / 4); }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  O.tunnel = grp(0, 0, 0, O.world); O.tunnel.visible = false;
  const tm = mesh(g, M.tunnel, 0, 0, 0, O.tunnel); tm.castShadow = false;
  // refuge niches: dark recesses every 40 m on alternate sides
  for (let z = -18, k = 0; z > -L; z -= 40, k++) { const sx = k % 2 ? 1 : -1; const n = bev(0.05, 1.9, 1.1, std({ color: 0x050505, roughness: 1 }), sx * (TUN.half - 0.02), RAIL + 0.95, z, O.tunnel, 0.01); n.castShadow = false; }
  // the two portals: a face of dressed stone with the horseshoe hole, set in the hillside
  const portal = (z, facing) => {
    const p = grp(0, 0, z, O.tunnel); if (facing < 0) p.rotation.y = Math.PI;
    const s = new THREE.Shape(); s.moveTo(-9, RAIL - 0.3); s.lineTo(9, RAIL - 0.3); s.lineTo(9, RAIL + 11); s.lineTo(-9, RAIL + 11); s.closePath();
    const hole = new THREE.Path(); const pr = tunnelProfile(); hole.moveTo(pr[0][0], pr[0][1] + 0.001); for (let i = 1; i < pr.length; i++) hole.lineTo(pr[i][0], pr[i][1]); hole.closePath(); s.holes.push(hole);
    const fg = new THREE.ExtrudeGeometry(s, { depth: 1.2, bevelEnabled: false, curveSegments: 1 }); uvScale(fg, 1 / 3, 1 / 3);
    const face = mesh(fg, M.portal, 0, 0, 0, p); face.castShadow = false;
    // voussoirs round the arch, a keystone with the tunnel's number
    for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI, r = TUN.half + 0.35; const v = bev(0.5, 0.7, 0.3, M.parapet, Math.cos(a) * r, RAIL + TUN.wall + Math.sin(a) * r * 0.9, 1.3, p, 0.03); v.rotation.z = a - Math.PI / 2; }
    const ks = plane(1.2, 0.6, std({ map: ctex(256, 128, (g, w, h) => { g.fillStyle = '#6a665c'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2000, 0.3); g.fillStyle = '#1e1c18'; g.font = `600 64px ${TEKO}`; g.textAlign = 'center'; g.fillText('No. 17', w / 2, 60); g.font = `500 40px ${TEKO}`; g.fillText('1863', w / 2, 108); }), roughness: 0.8 }), 0, RAIL + TUN.wall + TUN.half + 1.2, 1.25, 0, p);
    // the hillside above: a wall of rock
    const hill = mesh(new THREE.PlaneGeometry(40, 20), M.rock, 0, RAIL + 18, 0.4, p); hill.castShadow = false;
    return p;
  };
  O.portalIn = portal(0, 1); O.portalOut = portal(-L, -1);
}

/* ---------------- Kasheli Ghat halt ---------------- */
function buildHalt() {
  O.halt = grp(0, 0, 0, O.world); O.halt.visible = false;
  const PL = 60, PX0 = -1.72, PX1 = -4.5, PY = RAIL + 0.72;
  const pl = bev(PX0 - PX1, 0.9, PL, M.flags, (PX0 + PX1) / 2, PY - 0.45, -PL / 2, O.halt, 0.02); pl.castShadow = false;
  uvScale(pl.geometry, 1 / 1.5, 1 / 1.5);
  const edge = bev(0.3, 0.06, PL, std({ color: 0x8c877c, roughness: 0.6 }), PX0 - 0.15, PY + 0.005, -PL / 2, O.halt, 0.01); edge.castShadow = false;
  bev(0.06, 0.004, PL, std({ color: 0xd8d0b8, roughness: 0.5 }), PX0 - 0.35, PY + 0.03, -PL / 2, O.halt, 0.001);
  // lamp posts with kerosene lanterns
  O.haltLamps = [];
  for (const z of [-8, -27, -46]) {
    const p = grp(PX1 + 0.35, PY, z, O.halt);
    cyl(0.05, 0.07, 3.1, M.iron, 0, 1.55, 0, p, 10); lathe([[0.001, 0], [0.14, 0], [0.12, 0.08], [0.07, 0.2], [0.001, 0.22]], M.iron, 0, 0, 0, p, 14);
    bev(0.5, 0.04, 0.04, M.iron, 0.2, 3.05, 0, p, 0.006);
    const lan = grp(0.42, 2.8, 0, p); cyl(0.09, 0.07, 0.26, std({ color: 0xf8e0a0, emissive: new THREE.Color(0xffb048), emissiveIntensity: 3, transparent: true, opacity: 0.9 }), 0, 0, 0, lan, 12); lathe([[0.001, 0.13], [0.13, 0.13], [0.04, 0.24], [0.001, 0.26]], M.iron, 0, 0, 0, lan, 12);
    const gl = new THREE.Sprite(M.glowS.clone()); gl.material.color.set(0xffa040); gl.material.opacity = 0.7; gl.scale.set(1.6, 1.6, 1); gl.position.set(0, 0, 0); layer1(gl); lan.add(gl);
    O.haltLamps.push({ p, lan, z });
  }
  // the nameboard on two posts
  const nb = grp(PX1 + 0.3, PY, -22, O.halt); for (const z of [-1.1, 1.1]) cyl(0.04, 0.04, 2.4, M.iron, 0, 1.2, z, nb, 8);
  const board = plane(2.6, 0.98, std({ map: T.board, roughness: 0.5 }), 0.03, 1.95, 0, Math.PI / 2, nb); board.castShadow = false;
  bev(0.04, 1.04, 2.66, M.iron, -0.01, 1.95, 0, nb, 0.006);
  // a bench
  const bench = grp(PX1 + 0.55, PY, -15, O.halt); bev(0.45, 0.05, 1.8, M.teakDark, 0, 0.45, 0, bench, 0.01); bev(0.06, 0.4, 1.8, M.teakDark, -0.2, 0.75, 0, bench, 0.01); for (const z of [-0.8, 0.8]) bev(0.4, 0.45, 0.05, M.iron, 0, 0.22, z, bench, 0.005);
  // the stationmaster's hut, backed against the rock: lit window, the clock, the bell
  const hut = grp(PX1 + 0.55, PY, -35, O.halt);
  bev(1.1, 2.6, 3.2, M.white, 0, 1.3, 0, hut, 0.02);
  const roof = bev(1.9, 0.08, 3.6, M.roof, 0.05, 2.7, 0, hut, 0.01); roof.rotation.z = -0.18;
  const win = plane(0.7, 0.6, std({ map: T.hutWin, emissive: new THREE.Color(0xffb060), emissiveMap: T.hutWin, emissiveIntensity: 0.8 }), 0.552, 1.5, 0.6, Math.PI / 2, hut);
  bev(0.04, 2.0, 0.9, M.teakDark, 0.56, 1.0, -0.8, hut, 0.01);
  const clk = grp(0.58, 2.25, 0.6, hut); clk.rotation.y = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 36), M.iron, 0, 0, 0.04, clk).rotation.x = Math.PI / 2; plane(0.52, 0.52, std({ map: T.hutClock, roughness: 0.3, emissive: new THREE.Color(0x604020), emissiveMap: T.hutClock, emissiveIntensity: 0.25 }), 0, 0, 0.085, 0, clk);
  const bell = grp(0.75, 2.1, -1.6, hut); bev(0.06, 0.06, 0.4, M.iron, -0.1, 0.1, 0, bell, 0.01); lathe([[0.001, 0.0], [0.05, -0.02], [0.08, -0.12], [0.1, -0.2], [0.001, -0.2]], M.brass, 0.05, 0.05, 0, bell, 20);
  O.hutLight = { hut, pos: new THREE.Vector3(PX1 + 1.5, PY + 1.6, -35) };
  // fire buckets on a stand
  const fb = grp(PX1 + 0.25, PY, -41, O.halt); bev(0.08, 1.2, 1.1, M.iron, 0, 0.6, 0, fb, 0.01); plane(0.9, 0.18, std({ map: ctex(256, 64, (g, w, h) => { g.fillStyle = '#b01a14'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2e8d0'; g.font = `600 44px ${TEKO}`; g.textAlign = 'center'; g.fillText('FIRE  आग', w / 2, 48); }) }), 0.045, 1.1, 0, Math.PI / 2, fb);
  for (const z of [-0.33, 0, 0.33]) lathe([[0.001, -0.2], [0.09, -0.2], [0.12, 0.0], [0.11, 0.01], [0.001, -0.18]], std({ color: 0xb01a14, roughness: 0.4 }), 0.12, 0.8, z, fb, 16);
  // the caution board at the far end
  const cb = grp(PX1 + 0.3, PY, -56, O.halt); cyl(0.04, 0.04, 2.2, M.iron, 0, 1.1, 0, cb, 8); plane(1.1, 0.7, std({ map: T.caution, roughness: 0.5 }), 0.05, 2.0, 0, Math.PI / 2, cb);
  // those who got off here: they stand along the platform and watch the train go by
  O.riders = [];
  const RIDERS = [
    { z: -12, suit: 0xd8d4c8, legs: 0xd0ccc0, hat: 'topi', skin: 0x8a6a50 },          // Mehta, 1926
    { z: -19, suit: 0x8a7a52, legs: 0x7a6c48, hat: 'beret', skin: 0x7a5a42 },         // Lt Varghese, 1948
    { z: -30.5, suit: 0xe0dcd0, legs: 0x2a2a30, hat: null, skin: 0x8a6a50 },           // Mr Kulkarni, 1963
    { z: -31.3, suit: 0x8aa890, legs: 0x8aa890, hat: 'bun', skin: 0x9a7458, sari: true },  // Mrs Kulkarni
    { z: -40, suit: 0xb86a3a, legs: 0x3a4a6a, hat: 'hair', skin: 0x8a6a50, flare: true },  // Vikram, 1979
    { z: -49, suit: 0x2a5a8a, legs: 0x2a2a2a, hat: 'blond', skin: 0xd8b8a0, pack: true },  // Ilse, 2004
  ];
  RIDERS.forEach((r, i) => { const m = figure(r); m.position.set(PX0 - 0.7 - (i % 2) * 0.25, PY, r.z); m.rotation.y = Math.PI / 2 + rand(-0.15, 0.15); m.visible = false; O.halt.add(m); O.riders.push(m); });
}

/* ---------------- figures: one vertex-coloured mesh each ---------------- */
function mergeParts(parts) {
  const pos = [], nor = [], col = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
const m4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
// a standing person facing +z, feet at y = 0
function figure(o) {
  const P = [], a = (geo, color, m) => P.push({ geo, color, m });
  const sk = o.skin || 0x8a6a50, su = o.suit, lg = o.legs || su, H = o.h || 1.0;
  if (o.sari) { a(new THREE.CylinderGeometry(0.17, 0.3, 1.0, 16), su, m4(0, 0.5, 0)); a(new THREE.CylinderGeometry(0.15, 0.18, 0.5, 14), su, m4(0, 1.16, 0, 0, 0, 0, 1, 1, 0.75)); a(new THREE.BoxGeometry(0.08, 0.7, 0.04), su, m4(0.12, 1.0, -0.13, 0.1, 0, -0.35)); }
  else {
    for (const sx of [-1, 1]) { a(new THREE.CylinderGeometry(o.flare ? 0.075 : 0.065, o.flare ? 0.1 : 0.06, 0.82, 10), lg, m4(sx * 0.09, 0.42, 0)); a(new THREE.BoxGeometry(0.1, 0.06, 0.24), 0x1a1612, m4(sx * 0.09, 0.03, 0.04)); }
    a(new THREE.CylinderGeometry(0.17, 0.15, 0.62, 16), su, m4(0, 1.12, 0, 0, 0, 0, 1, 1, 0.72));
    a(new THREE.CylinderGeometry(0.155, 0.17, 0.12, 16), su, m4(0, 0.8, 0, 0, 0, 0, 1, 1, 0.72));
  }
  for (const sx of [-1, 1]) { a(new THREE.CylinderGeometry(0.05, 0.045, 0.6, 10), su, m4(sx * 0.21, 1.1, 0, 0, 0, sx * 0.08)); a(new THREE.SphereGeometry(0.045, 8, 6), sk, m4(sx * 0.235, 0.78, 0.01)); }
  a(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10), sk, m4(0, 1.47, 0));
  const head0 = P.length;
  a(new THREE.SphereGeometry(0.105, 16, 12), o.voidFace ? 0x0a0806 : sk, m4(0, 1.6, 0.01, 0, 0, 0, 0.9, 1.12, 1));
  if (o.hat === 'topi') { a(new THREE.SphereGeometry(0.14, 14, 8, 0, TAU, 0, Math.PI / 2), 0xe0dccc, m4(0, 1.66, 0, 0, 0, 0, 1, 0.75, 1.1)); a(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 18), 0xe0dccc, m4(0, 1.66, 0, 0, 0, 0, 1, 1, 1.15)); }
  else if (o.hat === 'beret') a(new THREE.SphereGeometry(0.12, 12, 8), 0x3a2a1a, m4(0.02, 1.71, 0, 0, 0, 0.2, 1, 0.4, 1));
  else if (o.hat === 'bun') { a(new THREE.SphereGeometry(0.11, 12, 8), 0x0c0a08, m4(0, 1.64, -0.01, 0, 0, 0, 0.95, 1.0, 1.02)); a(new THREE.SphereGeometry(0.06, 10, 8), 0x0c0a08, m4(0, 1.62, -0.11)); }
  else if (o.hat === 'hair') a(new THREE.SphereGeometry(0.125, 12, 8), 0x0c0a08, m4(0, 1.62, -0.02, 0, 0, 0, 1.05, 1.1, 1.05));
  else if (o.hat === 'blond') a(new THREE.SphereGeometry(0.118, 12, 8), 0xc8a868, m4(0, 1.63, -0.02, 0, 0, 0, 1.0, 1.05, 1.05));
  else if (o.hat === 'guard') { a(new THREE.CylinderGeometry(0.12, 0.115, 0.08, 16), 0xe8e4d8, m4(0, 1.73, 0)); a(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 16), 0x141210, m4(0, 1.69, 0.06, 0.25, 0, 0, 1, 1, 0.7)); a(new THREE.CylinderGeometry(0.118, 0.118, 0.025, 16), 0x141210, m4(0, 1.695, 0)); }
  // a head that hangs a little to one side
  if (o.tilt) { const nk = new THREE.Vector3(0, 1.47, 0), R = new THREE.Matrix4().makeTranslation(nk.x, nk.y, nk.z).multiply(new THREE.Matrix4().makeRotationZ(o.tilt)).multiply(new THREE.Matrix4().makeTranslation(-nk.x, -nk.y, -nk.z)); for (let i = head0; i < P.length; i++) P[i].m = R.clone().multiply(P[i].m); }
  if (o.pack) a(new THREE.BoxGeometry(0.3, 0.45, 0.18), 0x7a2a1a, m4(0, 1.12, -0.19));
  if (o.lamp) { a(new THREE.CylinderGeometry(0.06, 0.065, 0.17, 12), 0x1a1816, m4(0.24, 0.64, 0.05)); a(new THREE.TorusGeometry(0.05, 0.008, 4, 10, Math.PI), 0x1a1816, m4(0.24, 0.74, 0.05)); }
  if (o.flag) a(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), 0x2a5a2a, m4(-0.2, 1.0, 0.08, 0.2, 0, 0.1));
  const g = mergeParts(P);
  // the dead are paler toward the feet, as if the rain were washing them out
  if (o.fade !== false) { const cc = g.attributes.color, pp = g.attributes.position; for (let i = 0; i < cc.count; i++) { const k = 0.45 + 0.55 * clamp(pp.getY(i) / 1.6, 0, 1); cc.setXYZ(i, cc.getX(i) * k, cc.getY(i) * k, cc.getZ(i) * k); } }
  const m = new THREE.Mesh(g, std({ vertexColors: true, roughness: o.wet ? 0.35 : 0.85, envMapIntensity: 0.3 }));
  m.castShadow = true; noRay(m); m.scale.setScalar(H);
  m.userData.eye = new THREE.Object3D(); m.userData.eye.position.set(0, 1.35, 0); m.add(m.userData.eye);
  return m;
}
function buildGuard() {
  const spec = { suit: 0xe8e4d8, legs: 0xd8d4c8, hat: 'guard', skin: 0x6a4a34, lamp: true, flag: true, wet: true, h: 1.04, fade: false, voidFace: true, tilt: 0.16 };
  O.man = figure(spec); O.man.userData.keep = true; scene.add(O.man);                 // on the line behind
  O.manIn = figure(spec); O.manIn.userData.keep = true; O.manIn.visible = false; scene.add(O.manIn);   // in the finale, inside
  O.manRefl = figure(spec); O.manRefl.visible = false; O.manRefl.layers.set(5); O.manRefl.traverse(c => c.layers.set(5)); scene.add(O.manRefl);   // only in the black glass
  // the face at the rear door: his head and shoulders, close
  O.manDoor = figure(Object.assign({}, spec, { suit: 0x6a665e, legs: 0x4a4640, tilt: 0.26 })); O.manDoor.visible = false; O.manDoor.userData.keep = true; scene.add(O.manDoor);
  // his hand lamp's light, used when he comes in
  L.manLamp = new THREE.PointLight(0x9aff9a, 0, 6, 2); scene.add(L.manLamp);
}

/* ---------------- the wreck: only ever seen in the tunnel glass (layer 5) ---------------- */
function wreckLayer(o) { o.traverse(c => { c.layers.set(5); c.userData.noRay = true; }); o.userData.keep = true; return o; }
function buildWreck() {
  O.wreck = grp(0, 0, 0); wreckLayer(O.wreck);
  const fernM = std({ color: 0x3a5a2a, alphaMap: T.fern, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.55 });
  const add = o => { O.wreck.add(o); wreckLayer(o); return o; };
  // ferns along the walls and up through the floor
  for (let i = 0; i < 140; i++) {
    const side = Math.random() < 0.5 ? -1 : 1, z = rand(PART, ZR - 0.2), x = side * rand(0.2, 1.4), s = rand(0.35, 1.1);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(s, s), fernM); f.position.set(x, s * 0.45, z); f.rotation.y = rand(0, TAU); f.rotation.z = rand(-0.3, 0.3); add(f);
  }
  // moss creeping up the walls
  const mossM = std({ map: T.mossCol, alphaMap: T.moss, transparent: true, depthWrite: false, roughness: 0.9 });
  for (const side of [-1, 1]) for (let z = PART + 0.4; z < ZR; z += rand(0.8, 1.6)) { const w = rand(0.7, 1.6), h = rand(0.5, 1.4); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mossM); m.position.set(side * (HW - 0.012), h * 0.4, z); m.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; add(m); }
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.6, 1.2), rand(0.4, 0.9)), mossM); m.position.set(rand(-1.2, 1.2), rand(1.8, 2.5), ZR - 0.012); m.rotation.y = Math.PI; add(m); }
  // roots and creepers hanging from the roof
  const vineM = std({ color: 0x2a3a1c, roughness: 0.8 });
  for (let i = 0; i < 40; i++) { const x = rand(-1.3, 1.3), z = rand(PART, ZR - 0.3), y = roofY(x), l = rand(0.4, 1.8); const pts = []; for (let k = 0; k <= 6; k++) pts.push([x + Math.sin(k * 1.3 + i) * 0.04, y - l * k / 6, z + Math.cos(k * 0.9 + i) * 0.04]); add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 12, rand(0.006, 0.014), 5), vineM)); }
  // silt and stones banked against the rear wall; glass on the floor; a black puddle
  const silt = std({ color: 0x2a241c, roughness: 0.95 });
  for (let i = 0; i < 22; i++) { const r = rand(0.05, 0.25), m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), silt); m.position.set(rand(-1.3, 1.3), r * 0.4, rand(ZR - 1.2, ZR - 0.1)); m.rotation.set(rand(0, 3), rand(0, 3), 0); add(m); }
  const pud = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), std({ color: 0x050605, roughness: 0.04, metalness: 0.3 })); pud.rotation.x = -Math.PI / 2; pud.position.set(-0.2, 0.014, 2.2); pud.scale.set(1, 1.8, 1); add(pud);
  const shard = std({ color: 0xcfe0e8, roughness: 0.05, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 30; i++) { const g = new THREE.BufferGeometry(); const s = rand(0.03, 0.1); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, s, 0, rand(-s, s), rand(0, s), 0, s], 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, shard); m.position.set(rand(-1.2, 1.2), 0.016, rand(ZR - 0.9, ZR - 0.1)); m.rotation.y = rand(0, TAU); add(m); }
  // the desk, as it is in the ravine: the middle drawer lies on the floor, and the hidden tray hangs open with its key
  const D = DESK, dx = D.x1 - D.x0, cx = (D.x0 + D.x1) / 2, cz = (D.z0 + D.z1) / 2;
  O.wDrawer = grp(D.x0 - 0.5, 0.05, cz - 0.1); O.wDrawer.rotation.set(0.1, 0.9, 0.15);
  bev(0.012, 0.08, 0.46, M.burr, -0.3, 0, 0, O.wDrawer, 0.003); bev(0.57, 0.07, 0.012, M.teak, 0, 0, 0.22, O.wDrawer); bev(0.57, 0.07, 0.012, M.teak, 0, 0, -0.22, O.wDrawer); bev(0.57, 0.008, 0.44, M.teak, 0, -0.03, 0, O.wDrawer);
  add(O.wDrawer);
  // the hidden tray, sprung right out of the slot and hanging at an angle, the key still in it
  O.wTray = grp(cx - 0.08 - dx / 2 + 0.1, D.h - 0.13, cz); O.wTray.rotation.z = 0.25; bev(0.012, 0.045, 0.2, M.burr, -0.1, 0, 0, O.wTray, 0.002); bev(0.2, 0.006, 0.19, M.teak, 0, -0.02, 0, O.wTray, 0.001);
  const wk = grp(-0.01, -0.012, 0, O.wTray); cyl(0.004, 0.004, 0.05, M.brass, 0, 0, 0, wk, 8).rotation.z = Math.PI / 2; bev(0.012, 0.018, 0.004, M.brass, -0.028, 0, 0, wk, 0.001);
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xfff0c0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1 })); glint.scale.set(0.2, 0.2, 1); glint.position.set(0, 0.01, 0); wk.add(glint); O.wGlint = glint;
  add(O.wTray);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.35, 2.1, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xb8d0b8, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); shaft.position.set(cx - 0.3, 1.5, cz); shaft.rotation.z = 0.25; add(shaft);
  // ferns sprouting from the desk top, the register swollen and black
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), fernM); f.position.set(cx + rand(-0.2, 0.2), D.h + 0.18, cz + rand(-0.4, 0.4)); f.rotation.y = rand(0, TAU); add(f); }
  // the little table, overturned
  const st = grp(0.2, 0.2, 4.6); st.rotation.set(Math.PI / 2 - 0.1, 0.4, 0); lathe([[0.001, 0], [0.16, 0], [0.16, 0.02], [0.03, 0.05], [0.025, 0.55], [0.001, 0.56]], M.teakDark, 0, 0, 0, st, 16); mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 30), M.teak, 0, 0.57, 0, st); add(st);
  // a roof panel hanging down, and the dining chairs on their backs
  const pnl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), std({ color: 0x6a6450, roughness: 0.9, side: THREE.DoubleSide })); pnl.position.set(0.3, 2.2, 1.0); pnl.rotation.set(-0.9, 0.2, 0.3); add(pnl);
  for (const [x, z, r] of [[-0.8, 1.2, 1.4], [-0.6, 2.9, -1.2]]) { const c = diningChair(); c.position.set(x, 0.2, z); c.rotation.set(Math.PI / 2 - 0.2, r, 0); add(c); }
  // in the wreck, the lamps are dead: dark bowls
  O.wreckHide = [];   // intact things hidden while the glass shows the wreck
}

/* ---------------- lights ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x3a4658, 0x0e0c0a, 0.05); scene.add(L.hemi);
  const pl = (c, i, d, x, y, z, shadow) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); if (shadow) { l.castShadow = true; l.shadow.mapSize.set(IS_TOUCH ? 512 : 1024, IS_TOUCH ? 512 : 1024); l.shadow.bias = -0.002; l.shadow.normalBias = 0.02; l.shadow.camera.near = 0.05; l.shadow.camera.far = 12; } scene.add(l); return l; };
  const yb = 2.18;
  L.front = pl(0xffdcae, 0, 0, 0, yb, -2.9, false);
  L.mid = pl(0xffdcae, 0, 0, 0, yb, 0.6, true);
  L.rear = pl(0xffdcae, 0, 0, 0, yb, 3.95, false);
  L.desk = pl(0xffb060, 0, 3, DESK.x0 + 0.33, DESK.h + 0.3, 3.93, false);
  L.wc = pl(0xfff0d8, 0, 4, 0.85, 2.0, -3.1, false);
  L.vest = pl(0xffc27a, 0, 4, 0, 2.1, -4.55, false);
  // outside: the tail lamp's red glow on the track, two moving halt lamps, the stationmaster's window, lightning
  // the tail lamp throws its red light back down the line only (a spot, so it never lights the inside)
  L.tail = new THREE.SpotLight(0xff2a14, 0, 48, 0.62, 0.55, 1.5); L.tail.position.copy(LAMP).add(new THREE.Vector3(-0.1, 0.12, 0.12)); L.tail.target.position.set(0, RAIL, ZR + 30); scene.add(L.tail); scene.add(L.tail.target);
  L.tailNear = new THREE.PointLight(0xff2a14, 0, 1.1, 2); L.tailNear.position.copy(LAMP).add(new THREE.Vector3(-0.15, 0.2, 0.2)); scene.add(L.tailNear);
  L.halt = [0, 1].map(() => { const l = new THREE.PointLight(0xffa040, 0, 22, 1.8); scene.add(l); return l; });
  L.hut = new THREE.PointLight(0xffb060, 0, 10, 2); scene.add(L.hut);
  L.bolt = new THREE.DirectionalLight(0xb8c8ff, 0); L.bolt.position.set(30, 60, 20); scene.add(L.bolt); scene.add(L.bolt.target);
  if (IS_TOUCH) { L.front.intensity = 0; }
}

/* =====================================================================
   NIGHT MAIL · part D: items, documents, the register, voices, hints, painted things
   ===================================================================== */
const TONIGHT = '29.9.2026';
const BOX_CODE = ['up', 'down', 'up'];          // the guard's box: left raised, middle lowered, right raised
const ARM_ANG = { up: 0.72, level: 0, down: -0.72 };

const ITEMS = {
  phone: { name: 'Your phone', short: 'Phone', desc: 'Dead. It died somewhere after Karjat, while you were filming the rain on the window. No charger in the saloon fits it.' },
  booking: { name: 'Your booking', short: 'Booking', doc: 'booking' },
  umbrella: { name: 'Umbrella', short: 'Umbrella', desc: 'A big black railway umbrella with a hooked teak handle. The crook of the handle would catch on anything.' },
  winKey: { name: 'Small brass key', short: 'Brass key', desc: 'A little brass key on a split ring. Stamped along the shank: <b>WINDOWS · S.9</b>.' },
  keys: { name: 'Key ring', short: 'Key ring', desc: 'An iron ring of old railway keys, dripping wet. A brass tag: <b>S.9 · GUARD</b>. One of them is a square carriage key, the kind that opens any carriage door on the line.' },
  slipKey: { name: 'Slip key', short: 'Slip key', desc: 'A heavy brass key shaped like a T, stamped <b>SLIP GEAR · S.9</b>. It was in the guard\'s box, on a tag in his handwriting: "Mine. Do not lend."' },
};
const HEARD = {
  far: { title: 'A voice from far down the line', text: 'A man, calling up the track through the rain, polite and patient: "Sir? Is the brake on, sir?"' },
  door: { title: 'At the back door', text: 'Right outside the glass: "Let me in, sir. Only the brake. It is my carriage. Let me set the brake."' },
  refl: { title: 'Behind you, in the black glass', text: 'A whisper, very close: "She is my carriage."' },
  ramesh: { title: 'Through the next coach\'s door', text: 'The attendant, half asleep: "Sir? What saloon, sir? There is no saloon. This is the last coach."' },
};

/* ---------------- the register: everyone the saloon has carried since ---------------- */
const REG = [
  { d: '16.7.1926', who: 'A. R. Mehta, Asst. Engineer, G.I.P. Rly.', cls: 'ink',
    r: 'D\'Souza, the slip guard, was left at the halt. He is standing on the line behind us, and he is not getting any smaller.' },
  { d: '9.8.1948', who: 'Lt. P. Varghese', cls: 'pencil',
    r: 'In the tunnel the back window goes black, like a looking-glass. It shows this carriage as it is <u>now</u>. It is not lying.' },
  { d: '21.7.1963', who: 'Mrs S. Kulkarni', cls: 'biro',
    r: 'He knocks and asks for the brake. DO NOT TOUCH THE BRAKE WHEEL.' },
  { d: '2.8.1979', who: 'Vikram R.', cls: 'felt',
    r: 'the lever by the front door only gives when the train goes slack, at the little halt after the tunnel. you FEEL the jolt. needs his slip key' },
  { d: '14.7.2004', who: 'Ilse B., Hamburg', cls: 'round',
    r: 'His keys are on the tail lamp. One of them opens his box. I am going for the door now.' },
];
function regEntry(e) {
  return `<div class="nreg-e"><div class="nreg-h"><span class="d ${e.cls}">${e.d}</span><span class="w ${e.cls}">${e.who}</span></div><p class="${e.cls}">${e.r}</p></div>`;
}
const REG_HEAD = '<div class="nreg-top"><b>INSPECTION SALOON No. 9</b><span>Register of Journeys</span><i>Officers travelling will enter their names, the journey, and any remarks.</i></div>';

/* ---------------- documents ---------------- */
const DOCS = {
  booking: { title: 'Your booking (from your pocket)', style: 'nbook', pages: [
    `<div class="nb-top"><b>HERITAGE SALOON · ONE-NIGHT CHARTER</b><span>PNR 492-7713806 · CONFIRMED</span></div>
     <div class="nb-row"><span>Passengers</span><b>1 (one)</b></div><div class="nb-row"><span>Saloon</span><b>Inspection Saloon (1911), teak, one berth</b></div>
     <div class="nb-row"><span>Attached to</span><b>17 Up Night Mail, last vehicle</b></div><div class="nb-row"><span>Journey</span><b>Karjat 23:55 → Lonavala 04:10, via Kasheli Ghat</b></div><div class="nb-row"><span>Date</span><b>${TONIGHT}</b></div>
     <p class="nb-fine">Your attendant travels in the next coach. Tea at Lonavala.</p>`] },
  anote: { title: 'Note taped to the gangway door', style: 'npencil', pages: [
    `<p>Sir —</p><p>Gangway door locked for the ghat, as per rules. I am in the next coach. If you need anything, knock.</p><p>Tea at Lonavala.</p><p class="sig">— Ramesh (attendant)</p><p class="ps">P.S. Please do not touch the brass lever by this door. It is very old. They say it is not connected to anything.</p>`] },
  register: { title: 'The saloon register (on the desk)', style: 'nreg', pages: () => [
    REG_HEAD + REG.map(regEntry).join('') + `<div class="nreg-e last"><div class="nreg-h"><span class="d ink">${TONIGHT}</span><span class="w ink"></span></div><p class="nreg-blank">&nbsp;</p><p class="nreg-note">Tonight\'s date is already written in, in the same neat ink as the first entry. The rest of the line is waiting for a name.</p></div>`,
  ], onRead: () => { flag('readRegister'); } },
  inquiry: { title: 'Folded report (in the desk drawer)', style: 'ntype', pages: [
    `<h3>Report of the Inquiry into the Runaway of Inspection Saloon No. 9</h3><p class="sub3">near Kasheli Ghat, G.I.P. Railway, night of 16th July 1926 · extract</p>
     <ol><li>The Up Night Mail left Kasheli Ghat halt at 2.38 a.m. with Inspection Saloon No. 9 at the rear, fitted as a <b>slip coach</b>: to be let go from the moving train and brought to a stand by its own guard at the handbrake.</li>
     <li>Guard J. D\'Souza, who had charge of the slip gear and the handbrake, had got down at the halt to trim the tail lamp. He hung his keys on the lamp, and was left behind when the train moved off.</li>
     <li>At about 2.40 a.m., at the mouth of No. 17 Tunnel, the slip gear was tripped from inside the saloon, it is supposed by Mr A. R. Mehta, who could not have known that no guard was aboard.</li>
     <li>With nobody at the brake, the saloon ran back down the 1 in 37, left the rails at the Horseshoe Curve and fell some 400 feet into the ravine. It could not be recovered.</li>
     <li>The stationmaster saw Guard D\'Souza walking down the line after it. He has not been traced.</li>
     <li>The number 9 is not to be reissued.</li></ol>`] },
  profile: { title: 'Gradient profile of the ghat (framed)', style: 'nprof', pages: () => [profileSVG()] },
  plate: { title: 'Enamel plate on the slip gear', style: 'nplate', pages: [
    `<h3>SLIP GEAR · SALOON No. 9</h3><div class="np-pos"><span>LOCKED</span><span class="on">ARMED</span><span>SLIP</span></div>
     <p>The gangway door <b>will not open</b> while the gear is ARMED.</p><p>Slip key frees the lever. It moves only when the couplings are <b>slack</b>.</p>
     <p class="warn2">Never move to SLIP unless the slip guard is at the handbrake.</p>`] },
  photo: { title: 'Framed photograph over the sofa', style: 'photo', pages: () => [`<div class="plate print"><img src="${T.photoURL || ''}" alt="A faded photograph of three railwaymen on a little platform: a stationmaster, a pointsman, and a guard in white holding a hand lamp."></div><h3>Kasheli Ghat, monsoon 1926</h3><p class="sub3">Pencilled on the mount</p><p>"Stationmaster G. Pawar, pointsman Dhondu, and J. D\'Souza, slip guard, with his lamp."</p>`] },
  mirror: { title: 'Drawn in the steam on the washroom mirror', style: 'photo', pages: () => [`<div class="plate fogged"><img src="${T.mirrorURL || ''}" alt="Written with a fingertip in the steam: NOT THE WHEEL, and under it, HE IS IN THE GLASS."></div><p>Written with a fingertip, where he never looks: NOT THE WHEEL. And under it, smaller: HE IS IN THE GLASS.</p>`] },
};

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'Where do I start?', when: s => s.flags.readRegister || s.flags.sawKeys ? 'solved' : 'active', tiers: [
    'The door to the rest of the train, at the front, is locked. Everything you need is in this carriage.',
    'There\'s a register open on the desk at the back, by the windows. And look out of the back window.',
    'A ring of keys is hanging on the tail lamp outside the back window.',
    'Read the register on the desk, look at the keys on the tail lamp, and keep an eye on the back window when the train goes through the tunnel.' ] },
  { id: 'glass', title: 'The back window, in the tunnel', when: s => !(s.flags.tunnelSeen || s.flags.readRegister) ? 'hidden' : s.flags.winKey ? 'solved' : 'active', tiers: [
    'In the tunnel, the back window goes black and works like a mirror.',
    'It doesn\'t show the saloon as it is. It shows it as it is now, down in the ravine. Look at the desk in it.',
    'In the reflection, the desk\'s middle drawer is lying on the floor, and a little hidden tray is sticking out of the gap where it was, with something shining in it.',
    'Open the desk\'s middle drawer, take it right out, then reach into the slot. A hidden tray springs out with a small brass key in it.' ] },
  { id: 'keys', title: 'The keys on the tail lamp', when: s => !s.flags.sawKeys ? 'hidden' : s.flags.keys ? 'solved' : 'active', tiers: [
    'The keys hang from the tail lamp, just outside the left-hand back window (as you face the back).',
    'That window lowers, but it\'s locked, and the keys are further than your arm can reach.',
    'The small brass key from the desk unlocks the window. Then you need something with a hook on it.',
    'Unlock the left-hand back window with the small brass key, lower it, and hook the key ring with the umbrella from the stand by the gangway door, at the front.' ] },
  { id: 'box', title: 'The guard\'s box', when: s => !(s.flags.boxSeen || s.flags.keys) ? 'hidden' : s.flags.boxOpen ? 'solved' : 'active', tiers: [
    'The green steel trunk by the gangway door is the slip guard\'s box. It\'s padlocked.',
    'His own keys would open it. They\'re on the tail lamp.',
    'Get the key ring off the tail lamp, then try the box again.',
    'With the key ring from the tail lamp, unlock the guard\'s box and take the slip key.' ] },
  { id: 'lever', title: 'The slip lever', when: s => !(s.flags.triedDoor || s.flags.readPlate || s.flags.boxOpen) ? 'hidden' : s.slip === 'locked' ? 'solved' : 'active', tiers: [
    'The gangway door can\'t open while the slip gear beside it is ARMED. The lever needs a key.',
    'The slip key is in the guard\'s box. Even with it, the lever only moves when the couplings go slack.',
    'The only level stretch is the little halt just after the tunnel. As the train eases through it, the buffers bump. That\'s your moment.',
    'Fit the slip key. Wait by the lever through the tunnel, and when the carriage jolts at the halt, move it to LOCKED.' ] },
  { id: 'door', title: 'The gangway door', when: s => !(s.flags.triedDoor) ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'It needs a carriage key, and the slip gear set to LOCKED.',
    'The key ring from the tail lamp has a square carriage key on it.',
    'With the lever at LOCKED, unlock the door with the key ring.',
    'Unlock it and go through. Then do what the saloon has been waiting a hundred years for somebody to do.' ] },
];

/* ---------------- painting ---------------- */
function inkFont(cls) { return { ink: `italic 30px ${CORM}`, pencil: '26px Kalam', biro: '600 30px Caveat', felt: '24px "Permanent Marker"', round: '34px "Reenie Beanie"' }[cls] || `28px ${CORM}`; }
function inkCol(cls) { return { ink: '#1c2748', pencil: '#4a4a4a', biro: '#1f3a8a', felt: '#1a1a1a', round: '#3a2a5a' }[cls] || '#222'; }
function paintRegister() {
  const c = T.register.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#ece2c8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) blot(g, rand(0, w), rand(0, h), rand(20, 90), 0.06, '120,90,40');
  g.fillStyle = 'rgba(60,30,10,0.25)'; g.fillRect(w / 2 - 3, 0, 6, h);
  g.strokeStyle = 'rgba(90,110,160,0.35)'; g.lineWidth = 2; for (let y = 90; y < h; y += 44) { g.beginPath(); g.moveTo(24, y); g.lineTo(w / 2 - 20, y); g.moveTo(w / 2 + 20, y); g.lineTo(w - 24, y); g.stroke(); }
  g.strokeStyle = 'rgba(160,40,40,0.4)'; for (const x of [130, w / 2 + 130]) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x, h - 20); g.stroke(); }
  const scrib = (x0, y0, x1, cls, lines) => { g.fillStyle = inkCol(cls); g.font = inkFont(cls).replace(/\d+px/, m => Math.round(parseInt(m) * 0.62) + 'px'); for (let k = 0; k < lines; k++) { let x = x0; const y = y0 + k * 44; while (x < x1 - 30) { const ww = rand(20, 70); g.fillRect(x, y - 4 + rand(-1, 1), ww, 2.2); x += ww + rand(8, 16); } } };
  g.fillStyle = '#2a1a0c'; g.font = `600 26px ${TEKO}`; g.fillText('INSPECTION SALOON No. 9 · REGISTER', 30, 42);
  scrib(30, 130, w / 2 - 20, 'ink', 3); scrib(30, 262, w / 2 - 20, 'pencil', 4); scrib(30, 438, w / 2 - 20, 'biro', 3);
  scrib(w / 2 + 30, 86, w - 20, 'felt', 4); scrib(w / 2 + 30, 262, w - 20, 'round', 4);
  g.fillStyle = inkCol('ink'); g.font = `italic 26px ${CORM}`; g.fillText(TONIGHT + '  —', w / 2 + 30, 480);
  T.register.needsUpdate = true;
}
function paintNote() {
  const c = T.anote.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#e9e2cc'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(220,210,170,0.8)'; g.fillRect(w / 2 - 40, 0, 80, 18);
  g.fillStyle = '#3a3a3a'; g.font = '22px Kalam'; ['Sir —', 'Gangway door', 'locked for the', 'ghat, as per rules.', 'I am in the next', 'coach. Knock.', '— Ramesh'].forEach((l, i) => g.fillText(l, 16, 48 + i * 34));
  T.anote.needsUpdate = true;
}
function paintPlate() {
  const c = T.slipPlate.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#f2ede0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a3a7a'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.fillStyle = '#1a3a7a'; g.textAlign = 'center'; g.font = `600 52px ${TEKO}`; g.fillText('SLIP GEAR', w / 2, 70);
  g.font = `500 34px ${TEKO}`; const pos = ['LOCKED', 'ARMED', 'SLIP'], cur = S ? (S.slip === 'locked' ? 0 : 1) : 1;
  pos.forEach((p, i) => { const x = w / 2 + (i - 1) * 150; if (i === cur) { g.fillStyle = '#1a3a7a'; g.fillRect(x - 64, 96, 128, 44); g.fillStyle = '#f2ede0'; } else g.fillStyle = '#1a3a7a'; g.fillText(p, x, 130); });
  g.fillStyle = '#1a1a1a'; g.font = `500 28px ${TEKO}`; ['Door cannot be opened while ARMED.', 'Insert slip key to free the lever.', 'Lever moves only when couplings are slack.'].forEach((l, i) => g.fillText(l, w / 2, 196 + i * 40));
  g.fillStyle = '#b01a14'; g.font = `600 26px ${TEKO}`; g.fillText('NEVER TO SLIP UNLESS THE GUARD IS AT THE BRAKE', w / 2, 330);
  for (let i = 0; i < 14; i++) blot(g, rand(0, w), rand(0, h), rand(6, 26), 0.25, '40,30,20');
  T.slipPlate.needsUpdate = true;
}
function paintBells(balcony) {
  const c = T.bells.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#1c1410'; g.fillRect(0, 0, w, h);
  ['LOUNGE', 'OFFICE', 'BATH', 'BALCONY'].forEach((n, i) => {
    const x = 18 + i * 124; g.fillStyle = '#0a0806'; g.fillRect(x, 30, 104, 130);
    const down = n === 'BALCONY' && balcony; g.fillStyle = down ? '#b01a14' : '#2a2420'; g.fillRect(x + 8, down ? 70 : 38, 88, 80);
    g.fillStyle = '#d8c8a0'; g.font = `600 30px ${TEKO}`; g.textAlign = 'center'; g.fillText(n, x + 52, 200);
  });
  T.bells.needsUpdate = true;
}
function paintProfile() {
  const c = T.profile.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#e8dfc6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1a1a1a'; g.font = `600 40px ${TEKO}`; g.textAlign = 'left'; g.fillText('KARJAT – LONAVALA  ·  KASHELI GHAT  ·  GRADIENT PROFILE', 30, 52);
  const pts = profilePts(w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.fillStyle = 'rgba(60,40,20,0.15)'; g.beginPath(); g.moveTo(pts[0][0], h - 40); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(pts[pts.length - 1][0], h - 40); g.fill();
  g.font = `500 26px ${TEKO}`; g.fillStyle = '#1a1a1a';
  for (const [x, y, t] of profileLabels(w, h)) g.fillText(t, x, y);
  for (let i = 0; i < 20; i++) blot(g, rand(0, w), rand(0, h), rand(10, 60), 0.08, '120,90,40');
  T.profile.needsUpdate = true;
}
function profilePts(w, h) { const X = x => 40 + x * (w - 80), Y = y => h - 60 - y * (h - 150); return [[X(0), Y(0)], [X(0.12), Y(0.04)], [X(0.52), Y(0.62)], [X(0.56), Y(0.64)], [X(0.63), Y(0.64)], [X(0.9), Y(0.98)], [X(1), Y(1)]]; }
function profileLabels(w, h) { const X = x => 40 + x * (w - 80), Y = y => h - 60 - y * (h - 150); return [[X(0), Y(0) + 34, 'KARJAT'], [X(0.25), Y(0.3) - 16, '1 in 37'], [X(0.38), Y(0.44) + 44, 'HORSESHOE CURVE'], [X(0.47), Y(0.55) - 22, 'No. 17 TUNNEL'], [X(0.555), Y(0.64) - 60, 'KASHELI GHAT'], [X(0.555), Y(0.64) - 30, 'HALT (LEVEL)'], [X(0.74), Y(0.8) - 16, '1 in 37'], [X(0.86), Y(1) - 18, 'LONAVALA']]; }
function profileSVG() {
  const w = 640, h = 330, X = x => 30 + x * (w - 60), Y = y => h - 40 - y * (h - 110);
  const P = [[0, 0], [0.12, 0.04], [0.52, 0.62], [0.56, 0.64], [0.63, 0.64], [0.9, 0.98], [1, 1]];
  const d = P.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
  const tun = `M${X(0.47).toFixed(1)},${Y(0.54).toFixed(1)} L${X(0.52).toFixed(1)},${Y(0.62).toFixed(1)}`;
  return `<svg viewBox="0 0 ${w} ${h}" class="nsvg" role="img" aria-label="A profile of the line climbing from Karjat to Lonavala at 1 in 37, through No. 17 Tunnel, with a short level stretch at Kasheli Ghat halt.">
    <text x="${w / 2}" y="26" text-anchor="middle" class="t1">Karjat – Lonavala · Kasheli Ghat · gradient profile</text>
    <path d="${d} L${X(1)},${h - 30} L${X(0)},${h - 30} Z" fill="rgba(80,60,30,.12)"/><path d="${d}" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>
    <path d="${tun}" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-dasharray="3 3"/>
    <path d="M${X(0.56)},${Y(0.64) - 6} L${X(0.63)},${Y(0.64) - 6}" stroke="#b01a14" stroke-width="3"/>
    <text x="${X(0)}" y="${Y(0) + 22}" class="t2">KARJAT</text><text x="${X(0.26)}" y="${Y(0.32) - 10}" class="t3">1 in 37 rising</text>
    <text x="${X(0.3)}" y="${Y(0.36) + 28}" class="t3">Horseshoe Curve</text><text x="${X(0.43)}" y="${Y(0.6) - 10}" class="t3" text-anchor="end">No. 17 Tunnel</text>
    <text x="${X(0.595)}" y="${Y(0.64) - 30}" class="t2" text-anchor="middle">KASHELI GHAT HALT</text><text x="${X(0.595)}" y="${Y(0.64) - 14}" class="t4" text-anchor="middle">LEVEL</text>
    <text x="${X(0.76)}" y="${Y(0.82) - 10}" class="t3">1 in 37 rising</text><text x="${X(1)}" y="${Y(1) - 10}" class="t2" text-anchor="end">LONAVALA</text></svg>
    <p class="nprof-note">Everything on the ghat climbs at 1 in 37, except a few hundred feet at Kasheli Ghat halt, where the line runs level.</p>`;
}
// the staff photograph, 1926: three men on the little platform, the guard in white with his lamp
function paintPhoto() {
  const c = T.photo.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a7a60'); gr.addColorStop(1, '#4a3e2e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a3226'; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#6a5c46'; g.fillRect(0, h * 0.6, w, 10);
  g.fillStyle = '#524634'; g.fillRect(w * 0.62, h * 0.12, w * 0.3, h * 0.5); g.fillStyle = '#2a2218'; g.fillRect(w * 0.7, h * 0.28, w * 0.1, h * 0.14);
  g.fillStyle = '#c8a830'; g.fillRect(w * 0.08, h * 0.16, w * 0.4, h * 0.13); g.fillStyle = '#2a2218'; g.font = `600 30px ${TEKO}`; g.textAlign = 'center'; g.fillText('KASHELI GHAT', w * 0.28, h * 0.25);
  const man = (x, s, white, lamp) => { g.fillStyle = white ? '#ddd4c0' : '#2a241c'; g.fillRect(x - 22 * s, h * 0.38, 44 * s, 150 * s); g.fillRect(x - 18 * s, h * 0.38 + 150 * s, 14 * s, 70 * s); g.fillRect(x + 4 * s, h * 0.38 + 150 * s, 14 * s, 70 * s); g.fillStyle = '#4a3a2a'; g.beginPath(); g.ellipse(x, h * 0.34, 16 * s, 20 * s, 0, 0, TAU); g.fill(); g.fillStyle = white ? '#e8e0cc' : '#1a1610'; g.fillRect(x - 17 * s, h * 0.28, 34 * s, 12 * s); if (lamp) { g.fillStyle = '#1a1610'; g.fillRect(x + 26 * s, h * 0.56, 16 * s, 26 * s); } };
  man(w * 0.2, 1, false); man(w * 0.36, 0.95, false); man(w * 0.52, 1.05, true, true);
  const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) / 255 + (Math.random() - 0.5) * 0.08; const x = (i / 4) % w, y = Math.floor(i / 4 / w), v = 1 - clamp(Math.hypot(x / w - 0.5, y / h - 0.5) * 1.3 - 0.3, 0, 1) * 0.6; d.data[i] = clamp((40 + l * 200) * v, 0, 255); d.data[i + 1] = clamp((30 + l * 170) * v, 0, 255); d.data[i + 2] = clamp((20 + l * 120) * v, 0, 255); } g.putImageData(d, 0, 0);
  // the guard's face has been rubbed away, as if by a thumb
  g.filter = 'blur(4px)'; g.fillStyle = 'rgba(190,170,130,0.9)'; g.beginPath(); g.ellipse(w * 0.52, h * 0.34, 22, 26, 0, 0, TAU); g.fill(); g.filter = 'none';
  T.photo.needsUpdate = true; T.photoURL = c.toDataURL('image/jpeg', 0.85);
}
// what the finger drew on the mirror: three signals, and BOX (white = cleared by the finger)
function paintFogMask() {
  const c = T.fogMask.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  // the canvas is only 256 wide: maxWidth keeps every line inside the glass whatever the font measures
  const mw = w - 84;
  g.textAlign = 'center'; g.font = '700 50px Kalam'; g.fillText('NOT THE', w / 2, 100, mw); g.fillText('WHEEL', w / 2, 160, mw);
  g.font = '700 30px Kalam'; g.fillText('HE IS IN', w / 2, 232, mw); g.fillText('THE GLASS', w / 2, 268, mw);
  // blur a touch, like a real fingertip
  const b = document.createElement('canvas'); b.width = w; b.height = h; const bg = b.getContext('2d'); bg.filter = 'blur(2.5px)'; bg.drawImage(c, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(b, 0, 0);
  T.fogMask.needsUpdate = true;
  // a picture of it for the notebook: dark glass with the lines showing through a grey fog
  const p = document.createElement('canvas'); p.width = w; p.height = h; const pg = p.getContext('2d');
  pg.fillStyle = '#23262a'; pg.fillRect(0, 0, w, h); const fg = pg.createImageData(w, h), md = g.getImageData(0, 0, w, h).data;
  for (let i = 0; i < fg.data.length; i += 4) { const m = md[i] / 255, n = 170 + Math.random() * 30; const a = (1 - m * 0.92); fg.data[i] = n * a + 35 * (1 - a); fg.data[i + 1] = n * a + 38 * (1 - a); fg.data[i + 2] = n * a + 42 * (1 - a); fg.data[i + 3] = 255; }
  pg.putImageData(fg, 0, 0); T.mirrorURL = p.toDataURL('image/jpeg', 0.85);
}
function paintHandMask() {
  const c = T.handMask.userData.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff';
  g.save(); g.translate(186, 110); g.rotate(0.25); g.scale(0.9, 0.9);
  g.beginPath(); g.ellipse(0, 20, 30, 36, 0, 0, TAU); g.fill();
  [[-30, -12, -0.5, 36], [-14, -30, -0.15, 50], [2, -34, 0.05, 54], [18, -28, 0.22, 48], [32, 0, 0.9, 32]].forEach(([x, y, a, l]) => { g.save(); g.translate(x, y + 20); g.rotate(a); g.beginPath(); g.ellipse(0, -l / 2, 7, l / 2, 0, 0, TAU); g.fill(); g.restore(); });
  g.restore();
  const b = document.createElement('canvas'); b.width = w; b.height = h; const bg = b.getContext('2d'); bg.filter = 'blur(3px)'; bg.drawImage(c, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(b, 0, 0);
  T.handMask.needsUpdate = true;
}
function paintThings() { paintRegister(); paintNote(); paintPlate(); paintBells(false); paintProfile(); paintPhoto(); paintFogMask(); paintHandMask(); }

/* =====================================================================
   NIGHT MAIL · part E: the loop, the man on the line, puzzles, scares, sound, ending
   ===================================================================== */
const V = { lt: 3, odo: 0, spd: 12.5, phase: 'ghat', black: 0, lightK: 1, dipT: 0, boltT: 9, bolt: 0, clackAcc: 0, slack: false, jolt: 0, reflK: 0, envDone: false,
  heat: 0, fog: 0, water: 0, hand: 0, steam: [], winK: 0, stuckT: 0, progKey: '', lastPhase: '', finale: 0, recede: 0, pullReady: false, dawn: 0, lookRear: 0, reflT: 0, rearView: 0 };
const heard = id => { if (!S.heard.includes(id)) { S.heard.push(id); save(); } };
const look = (txt, ms = 5200) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5200) => subtitle('', `<i>${txt}</i>`, ms);
function wrapA(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
function isIn(o, root) { while (o) { if (o === root) return true; o = o.parent; } return false; }
const took = id => S.inv.includes(id);
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }

/* ---------------- where the saloon is on the lap ---------------- */
function lapState(lt) {
  const s = sAt(lt), front = s + 5.4, rear = s - 5.4;
  const inTun = front > S_T0 && rear < S_T1;                 // any part of the saloon in the tunnel
  const rearIn = rear > S_T0 + 1 && rear < S_T1 + 3;         // the back windows are in the dark
  const halt = s + 20 > S_H0 && s - 20 < S_H1;
  return { s, inTun, rearIn, halt, slack: lt >= LOOP.slack0 && lt <= LOOP.slack1 };
}
function progCount() { const f = S.flags; return [f.winKey, f.keys, f.boxOpen, f.slipFitted, S.slip === 'locked'].filter(Boolean).length; }
const DIST = [62, 48, 36, 25, 16, 10];   // by puzzles done (five now), down to his last few steps when the lever goes to LOCKED
const distTarget = () => DIST[Math.min(DIST.length - 1, progCount())];
const onBalcony = () => !!(S.flags.keys && S.slip === 'locked');

/* ---------------- sounds ---------------- */
function sClack(z, vol = 0.3) {
  if (!A.ready) return; const t = now(), ctx = A.ctx;
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  const n = noiseSrc(false), bp = filt('bandpass', 1300 + Math.random() * 400, 2), ng = ctx.createGain(); ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g); n.connect(bp); bp.connect(ng);
  const mix = ctx.createGain(); g.connect(mix); ng.connect(mix); route(mix, { pos: new THREE.Vector3(0, -0.8, z), wet: 0.15, ref: 1.2 }); o.start(t); o.stop(t + 0.16); n.start(t, Math.random()); n.stop(t + 0.06);
}
function sHorn(steam = false, vol = 0.22) {
  if (!A.ready) return; const t = now(), ctx = A.ctx, dur = 2.6, out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(vol, t + 0.25); out.gain.setValueAtTime(vol, t + dur - 0.4); out.gain.linearRampToValueAtTime(0.0001, t + dur);
  const fs = steam ? [466, 554, 698] : [311, 370];
  fs.forEach(f => { const o = ctx.createOscillator(); o.type = steam ? 'sine' : 'sawtooth'; o.frequency.setValueAtTime(f * (steam ? 0.97 : 1), t); if (steam) o.frequency.linearRampToValueAtTime(f, t + 0.4); o.connect(out); o.start(t); o.stop(t + dur); });
  if (steam) { const n = noiseSrc(false), bp = filt('bandpass', 1800, 0.8), ng = ctx.createGain(); ng.gain.value = 0.25; n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t); n.stop(t + dur); }
  const lp = filt('lowpass', steam ? 2600 : 1400, 0.7); out.connect(lp); route(lp, { pos: POS.engine, wet: 0.7, ref: 30, roll: 0.3 });
}
function sBuffers() {
  // slack running back down the train, coach by coach, until it reaches you
  for (let i = 0; i < 9; i++) after(i * 0.16, () => sThunk(new THREE.Vector3(0, -0.6, -60 + i * 7), 0.12 + i * 0.03, 110));
  after(1.5, () => { sThunk(new THREE.Vector3(0, -0.5, ZF - 0.3), 0.9, 90); sClick(POS.slip, 0.5, 900); G.shake = 0.9; V.jolt = 1; });
  after(1.62, () => sThunk(new THREE.Vector3(0, -0.5, ZR), 0.5, 80));
}
function bellTone(pos, vol, base, parts, decay, wet = 0.5) { if (!A.ready) return; const t = now(); parts.forEach(([r, a, dk]) => { const o = A.ctx.createOscillator(); o.frequency.value = base * r; const g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + decay * dk); o.connect(g); route(g, { pos, wet }); o.start(t); o.stop(t + decay * dk + 0.05); }); }
function stationBell(pos) { bellTone(pos, 0.09, 740, [[1, 1, 1], [2.0, 0.5, 0.6], [2.76, 0.4, 0.45], [5.4, 0.12, 0.2]], 3.2, 0.6); }
function sSqueal(pos, dur = 2, vol = 0.12) { if (!A.ready) return; const t = now(), ctx = A.ctx; const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(1900, t); o.frequency.linearRampToValueAtTime(2300, t + dur * 0.4); o.frequency.linearRampToValueAtTime(1700, t + dur); const bp = filt('bandpass', 2100, 6), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.setValueAtTime(vol, t + dur - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(bp); bp.connect(g); route(g, { pos, wet: 0.3 }); o.start(t); o.stop(t + dur + 0.05); }
function sWhump(vol = 0.6) { if (!A.ready) return; const t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 180, 0.8), g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); n.connect(lp); lp.connect(g); route(g, { wet: 0.4 }); n.start(t, Math.random()); n.stop(t + 1.3); }
function roofSteps(n = 8, from = ZR - 0.5, to = -2) { for (let i = 0; i < n; i++) after(i * 0.62, () => sKnock(new THREE.Vector3(rand(-0.3, 0.3), ROOF_H + 0.2, lerp(from, to, i / (n - 1))), 0.45, 0, 1)); }
const guardLine = (id, text, opts = {}) => { heard(id); return say('', `<i>${text}</i>`, Object.assign({ clip: 'n_' + id, fx: 'whisper', volume: 1.1 }, opts)); };

/* ---------------- the black glass: the saloon as it is now ---------------- */
function makeWreckGlass() {
  const res = IS_TOUCH ? 360 : 720, GW = 2.9, GH = 1.25;
  const rt = new THREE.WebGLRenderTarget(res, Math.round(res * GH / GW), { type: REAL.on ? REAL.hdr : THREE.UnsignedByteType });
  const vcam = new THREE.PerspectiveCamera(); vcam.layers.enable(1); vcam.layers.enable(5);
  const root = grp(0, 0, ZR + 0.004); root.rotation.y = Math.PI;
  const grime = ctex(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 60; i++) blot(g, rand(0, w), rand(0, h), rand(4, 26), 0.6, '40,34,24'); speckle(g, w, h, 1200, 0.6, '30,25,20', 2); }, { linear: true });
  const panes = [];
  const rects = [[(RWIN.xs[0][0] + RWIN.xs[0][1]) / 2, (RWIN.y0 + RWIN.y1) / 2, RWIN.xs[0][1] - RWIN.xs[0][0], RWIN.y1 - RWIN.y0, 'L'], [(RWIN.xs[1][0] + RWIN.xs[1][1]) / 2, (RWIN.y0 + RWIN.y1) / 2, RWIN.xs[1][1] - RWIN.xs[1][0], RWIN.y1 - RWIN.y0, 'R'], [0, O.rdoorGlass.yc, O.rdoorGlass.w, O.rdoorGlass.h, 'D']];
  for (const [x, y, w, h, id] of rects) {
    const texMat = new THREE.Matrix4();
    const mat = new THREE.ShaderMaterial({
      uniforms: { tM: { value: rt.texture }, texMat: { value: texMat }, k: { value: 0 }, tG: { value: grime } },
      vertexShader: `uniform mat4 texMat; varying vec4 vP; varying vec2 vU; void main(){ vU = uv; vP = texMat*vec4(position,1.0); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D tM; uniform sampler2D tG; uniform float k; varying vec4 vP; varying vec2 vU;
        void main(){ vec3 c = texture2DProj(tM, vP).rgb; float l = dot(c, vec3(0.3,0.59,0.11)); c = mix(vec3(l), c, 0.45)*vec3(0.62,0.8,0.68);
          float g = texture2D(tG, vU).a; c *= 1.0-g*0.6; gl_FragColor = vec4(c, k*(0.82+0.18*(1.0-g))); }`,
      transparent: true, depthWrite: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(-x, y, 0); root.add(m); m.userData.noEnv = true; m.userData.noRay = true; m.userData.id = id; m.renderOrder = 2;
    panes.push({ m, texMat, mat });
  }
  const P0 = new THREE.Vector3(), C0 = new THREE.Vector3(), N0 = new THREE.Vector3(), R = new THREE.Matrix4(), lk = new THREE.Vector3(), tgt = new THREE.Vector3(), view = new THREE.Vector3();
  const plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4(), bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const G2 = {
    root, panes,
    setK(v) { panes.forEach(p => { p.mat.uniforms.k.value = (p.m.userData.id === 'R' && S && S.win === 'open') || (p.m.userData.id === 'D' && V.finale) ? 0 : v; p.m.visible = p.mat.uniforms.k.value > 0.004; }); },
    update() {
      if (!panes.some(p => p.m.visible)) return;
      root.updateMatrixWorld(); camera.updateMatrixWorld();
      P0.setFromMatrixPosition(root.matrixWorld); C0.setFromMatrixPosition(camera.matrixWorld);
      R.extractRotation(root.matrixWorld); N0.set(0, 0, 1).applyMatrix4(R);
      view.subVectors(P0, C0); if (view.dot(N0) > 0) return;
      view.reflect(N0).negate().add(P0);
      R.extractRotation(camera.matrixWorld); lk.set(0, 0, -1).applyMatrix4(R).add(C0);
      tgt.subVectors(P0, lk).reflect(N0).negate().add(P0);
      vcam.position.copy(view); vcam.up.set(0, 1, 0).applyMatrix4(R).reflect(N0); vcam.lookAt(tgt);
      vcam.far = 40; vcam.near = camera.near; vcam.updateMatrixWorld(); vcam.projectionMatrix.copy(camera.projectionMatrix);
      for (const p of panes) { p.m.updateMatrixWorld(); p.texMat.copy(bias).multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse).multiply(p.m.matrixWorld); }
      plane.setFromNormalAndCoplanarPoint(N0, P0); plane.applyMatrix4(vcam.matrixWorldInverse);
      clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
      const e = vcam.projectionMatrix.elements;
      q.x = (Math.sign(clip.x) + e[8]) / e[0]; q.y = (Math.sign(clip.y) + e[9]) / e[5]; q.z = -1; q.w = (1 + e[10]) / e[14];
      clip.multiplyScalar(2 / clip.dot(q)); e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1 - 0.003; e[14] = clip.w;
      const hide = [root, O.world, O.man, ...O.wreckHide]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); const sv = O.slot.visible; O.slot.visible = true;
      const bg = scene.background; scene.background = new THREE.Color(0x020303);
      const li = [L.front, L.mid, L.rear, L.desk, L.vest].map(l => l.intensity); [L.front, L.mid, L.rear, L.desk, L.vest].forEach(l => l.intensity *= 0.75); const hi = L.hemi.intensity, hc = L.hemi.color.getHex(); L.hemi.intensity = 0.9; L.hemi.color.set(0xa8c0a8);
      renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, vcam);
      [L.front, L.mid, L.rear, L.desk, L.vest].forEach((l, i) => l.intensity = li[i]); L.hemi.intensity = hi; L.hemi.color.setHex(hc);
      scene.background = bg; hide.forEach((o, i) => o.visible = was[i]); O.slot.visible = sv;
    },
  };
  return G2;
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: ['booking'], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    lt: 4, dist: 110, riders: 0, loops: 0, slip: 'armed', arms: ['level', 'level', 'level'], drawer: 'shut', win: 'shut', wcOpen: false, geyser: false, hot: false, cold: false, fans: false, ev: {} };
}
function applyState() {
  const f = S.flags;
  V.lt = S.lt || 4; V.heat = S.geyser ? 1 : 0; V.fog = 0; V.hand = 0; V.envDone = false; V.finale = 0; V.recede = 0; V.pullReady = false; V.dawn = 0;
  // desk
  O.mdrawer.position.set(S.drawer === 'open' ? -0.3 : 0, DESK.h - 0.1, 0); O.mdrawer.rotation.set(0, 0, 0);
  if (S.drawer === 'out') { O.mdrawer.position.set(-0.62, 0.05, -0.62); O.mdrawer.rotation.set(0, 0.35, 0); }
  O.slot.visible = S.drawer === 'out'; O.report.visible = false;
  O.sdrawer.position.x = O.sdrawer.userData.base + (f.trayOut ? -0.42 : 0); O.sdrawer.visible = S.drawer === 'out'; O.winKey.visible = !f.winKey;
  // window, keys, umbrella
  O.drop.position.y = O.dropTop - (S.win === 'open' ? 0.5 : 0); O.strap.visible = S.win !== 'open';
  // saved in the second between losing the umbrella and the keys landing: they landed
  if (f.umbLost && !f.keys) { f.keys = true; if (!S.inv.includes('keys')) S.inv.push('keys'); }
  O.ring.visible = !f.keys; O.umb.visible = !took('umbrella') && !f.umbLost;
  // washroom
  O.wcPivot.rotation.y = S.wcOpen ? -1.45 : 0; O.colWc.on = !S.wcOpen;
  O.gToggle.position.y = S.geyser ? 0.03 : -0.01; O.stream.visible = S.hot || S.cold;
  // box and slip gear
  O.padlock.visible = !f.boxOpen;
  O.boxLid.rotation.x = f.boxOpen ? -1.7 : 0; O.boxIn.visible = !!f.boxOpen; O.slipKey.visible = !took('slipKey') && !f.slipFitted;
  O.slipKeyIn.visible = !!f.slipFitted; O.slipLever.rotation.z = S.slip === 'locked' ? 0.55 : 0;
  O.ibolt.position.y = CDOOR.h + (S.slip === 'locked' ? 0.14 : 0.05);
  O.cdoorPivot.rotation.y = 0; O.rdoorPivot.rotation.y = 0; O.manIn.visible = false; L.manLamp.intensity = 0;
  paintPlate(); paintBells(!!S.ev.balconyBell);
  O.fans.forEach(fa => fa.spd = S.fans ? 1 : 0);
  O.riders.forEach((r, i) => r.visible = i < S.riders);
  renderInv(); renderer.shadowMap.needsUpdate = true;
}

/* ---------------- sound beds ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.rumble) return;
  A.loops.rumble = loopNoise({ pos: POS.under, type: 'lowpass', f: 110, q: 0.8, vol: 0.12, brown: true, wet: 0.1, ref: 2 });
  A.loops.hiss = loopNoise({ pos: POS.under, type: 'bandpass', f: 700, q: 0.6, vol: 0.02, wet: 0.05, ref: 2 });
  A.loops.rain = loopNoise({ pos: POS.roof, type: 'bandpass', f: 1600, q: 0.35, vol: 0.05, wet: 0.2, ref: 2 });
  A.loops.roar = loopNoise({ type: 'lowpass', f: 320, q: 0.7, vol: 0, brown: true, wet: 0.5 });
  A.loops.wind = loopNoise({ pos: POS.rwin, type: 'bandpass', f: 900, q: 0.4, vol: 0, wet: 0.15, ref: 1 });
  A.loops.geyser = loopNoise({ pos: POS.geyser, type: 'bandpass', f: 220, q: 6, vol: 0, wet: 0.05, ref: 0.6 });
  A.loops.tap = loopNoise({ pos: POS.basin, type: 'bandpass', f: 2600, q: 0.5, vol: 0, wet: 0.1, ref: 0.6 });
  A.loops.fan = loopNoise({ pos: new THREE.Vector3(0.5, 2.4, 0.5), type: 'bandpass', f: 180, q: 3, vol: 0, wet: 0.1, ref: 2 });
  const ctx = A.ctx, tg = ctx.createGain(); tg.gain.value = 0; [41.2, 61.7, 82.4, 87.3].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = rand(-7, 7); o.connect(tg); o.start(); }); route(tg, { wet: 0.6 }); A.loops.tension = { gain: tg };
}

/* ---------------- the lap: move the world, light it, time the events ---------------- */
function worldUpdate(dt) {
  const prev = V.lt;
  const rate = V.slipping ? (speedAt(V.lt) - V.recedeV) / Math.max(1, speedAt(V.lt)) : 1;
  V.lt += dt * rate; if (V.lt >= LOOP.len) { V.lt -= LOOP.len; S.loops = (S.loops || 0) + 1; } if (V.lt < 0) V.lt += LOOP.len;
  S.lt = V.lt;
  const st = lapState(V.lt); V.spd = speedAt(V.lt); V.odo += V.spd * rate * dt; V.st = st;
  const crossed = x => prev < x && V.lt >= x;
  // scrolling surfaces and repeated things
  O.trackBed.material.map.offset.y = O.trackBed.material.normalMap.offset.y = -V.odo / 3.9;
  O.cut.material.map.offset.x = O.cut.material.normalMap.offset.x = -V.odo / 8;
  O.parapet.material.map.offset.x = V.odo / 2;
  O.hills.material.map.offset.x = V.odo / 2400; T.clouds.offset.x = V.odo / 9000;
  const span = 6 * 55; O.poles.forEach(p => { p.position.z = ((p.userData.off + V.odo) % span) - 60; });
  O.ferns.forEach(f => { f.position.z = ((f.userData.off + V.odo) % 280) - 40; });
  // the tunnel and the halt ride on the lap position
  O.tunnel.position.z = st.s - S_T0; O.tunnel.visible = O.tunnel.position.z > -320 && O.tunnel.position.z - (S_T1 - S_T0) < 260;
  O.halt.position.z = st.s - S_H0; O.halt.visible = O.halt.position.z > -150 && O.halt.position.z - 60 < 200;
  let inside = st.inTun && st.s + 5.4 > S_T0 + 6 && st.s - 5.4 < S_T1 - 2;
  if (V.slipping) { const cz = camera.position.z, tz = O.tunnel.position.z; inside = cz > tz - (S_T1 - S_T0) - 2 && cz < tz + 2; O.rain.position.z = -V.recede; }
  const open = !inside; O.cut.visible = O.parapet.visible = O.hills.visible = O.sky.visible = open || V.finale > 0;
  O.poles.forEach(p => p.visible = open); O.rain.visible = open && V.dawn < 0.9;
  // crossing the portals: the lights die for a moment, and he moves
  const frontAt = S_T0 - 5.4, frontOut = S_T1 - 5.4;
  const sPrev = sAt(prev);
  if (sPrev < frontAt && st.s >= frontAt && !V.finale) tunnelIn();
  if (sPrev < frontOut && st.s >= frontOut && !V.finale) tunnelOut();
  // the whistle before the tunnel; steam, once the dead have started gathering
  if (crossed(LOOP.whistle) && !V.finale) sHorn(S.riders >= 3, 0.2);
  // easing onto the level: the buffers close up
  if (crossed(LOOP.slack0 - 1.5) && !V.finale) sBuffers();
  V.slack = st.slack;
  if (crossed(LOOP.halt0 + 1) && !V.finale) haltArrive();
  if (crossed(LOOP.halt0 + 5)) after(0.1, () => stationBell(new THREE.Vector3(-3.0, 1.5, -6)));
  // halt lamps: two lights follow the nearest lanterns
  if (O.halt.visible) {
    const lz = O.haltLamps.map(h => ({ h, z: O.halt.position.z + h.z })).sort((a, b) => Math.abs(a.z) - Math.abs(b.z));
    L.halt.forEach((l, i) => { const e = lz[i]; e.h.lan.getWorldPosition(l.position); l.position.x += 0.2; l.position.y -= 0.3; l.intensity = Math.abs(e.z) < 60 ? 22 : 0; });
    L.hut.position.set(O.hutLight.pos.x, O.hutLight.pos.y, O.halt.position.z + O.hutLight.pos.z); L.hut.intensity = 3.5;
  } else { L.halt.forEach(l => l.intensity = 0); L.hut.intensity = 0; }
  // rain streaks: fall and blow backward; none inside the saloon or the tunnel
  if (O.rain.visible) {
    const a = O.rain.geometry.attributes.position.array, vy = 9, vz = V.spd, len = 0.32 / Math.hypot(vy, vz);
    for (let i = 0; i < O.rainP.length; i++) {
      const p = O.rainP[i]; p[1] -= vy * dt; p[2] += vz * dt;
      if (p[1] < -1.8 || p[2] > 40) { p[0] = rand(-7, 7); p[1] = rand(2, 6.5); p[2] = rand(-14, 30); }
      const inBody = Math.abs(p[0]) < 1.62 && p[2] > ZF - 1 && p[2] < BALC.z1 + 0.2 && p[1] > -1.4 && p[1] < ROOF_H + 0.3;
      const k = i * 6; if (inBody) { a[k] = a[k + 3] = 0; a[k + 1] = a[k + 4] = -50; a[k + 2] = a[k + 5] = 0; continue; }
      a[k] = p[0]; a[k + 1] = p[1]; a[k + 2] = p[2]; a[k + 3] = p[0]; a[k + 4] = p[1] + vy * len; a[k + 5] = p[2] - vz * len;
    }
    O.rain.geometry.attributes.position.needsUpdate = true;
  }
  // rain on the glass runs backward faster at speed
  T.rainGlass.offset.x = (T.rainGlass.offset.x + dt * V.spd * 0.004) % 1; T.rainGlass.offset.y = (T.rainGlass.offset.y + dt * 0.05) % 1;
  O.windows.forEach(w => { w.rn.visible = open; });
  // lightning, only out on the ghat
  if (open && !st.halt && !V.finale) { V.boltT -= dt; if (V.boltT <= 0) { flashBolt(); V.boltT = rand(7, 17); } }
  V.bolt = Math.max(0, V.bolt - dt * 5);
  const bk = V.bolt > 0 ? (Math.sin(V.bolt * 40) > -0.3 ? V.bolt : V.bolt * 0.2) : 0;
  L.bolt.intensity = bk * 16 + V.dawn * 1.2; M.sky.color.setRGB(1.1 + bk * 3 + V.dawn * 1.5, 1.2 + bk * 3.2 + V.dawn * 1.6, 1.45 + bk * 3.4 + V.dawn * 1.8); M.hills.color.setRGB(0.45 + bk * 1.8 + V.dawn * 0.6, 0.5 + bk * 1.9 + V.dawn * 0.65, 0.55 + bk * 2 + V.dawn * 0.75);
  L.hemi.intensity = 0.04 + bk * 0.8 + V.dawn * 0.5; if (bk > 0.3 && !V.st.inTun) G.flash = Math.max(G.flash, bk * 0.05); else G.flash = Math.max(0, G.flash - 0.02);
  // the tail lamp's glow on the track
  L.tail.intensity = 60 * (0.96 + Math.sin(G.time * 7) * 0.03); L.tailNear.intensity = 0.6;
  // the man on the line
  manUpdate(dt, st);
}
function flashBolt(forced) {
  V.bolt = 1; sThunder(rand(0.6, 2.4), rand(0.35, 0.65));
  if (A.ready && A.loops.rain) { setGain(A.loops.rain, 0.1, 0.1); after(2, () => setGain(A.loops.rain, 0.05, 1)); }
}
function tunnelIn() {
  V.black = 1.15; sWhump(0.7); G.shake = 0.4; S.flags.tunnelSeen = true;
  if (A.ready) { setGain(A.loops.roar, 0.34, 0.25); setGain(A.loops.rain, 0.0, 0.3); }
  // he moves in the dark
  if (!onBalcony()) S.dist = Math.max(distTarget(), S.dist - 16);
  if (!S.ev.tun1) { S.ev.tun1 = true; after(1.6, () => sayI('The train roars into a tunnel. The back window has gone black as a mirror, and the whole saloon hangs in it, reflected.', 6000)); }
  save();
}
function tunnelOut() {
  V.black = 0.9; sWhump(0.4);
  if (A.ready) { setGain(A.loops.roar, 0.0, 0.6); setGain(A.loops.rain, 0.05, 1.5); }
  if (S.ev.tun1 && !S.ev.lap2) { S.ev.lap2 = true; save(); after(3, () => sayI('You come out of the tunnel into the rain. And ahead, along the cutting, the line looks exactly the same as before.', 5600)); }
}
function haltArrive() {
  if ((S.loops || 0) >= 1 && S.riders < 6) { S.riders++; O.riders.forEach((r, i) => r.visible = i < S.riders); save(); }
  if (!S.ev.halt1) { S.ev.halt1 = true; save(); after(1.4, () => sayI('The train eases through a little station on the level. Yellow board, lamps, a clock on the hut: twenty to three. Nobody on the platform.', 6200)); }
  else if (S.riders === 1 && !S.ev.rider1) { S.ev.rider1 = true; save(); after(1.4, () => sayI('Somebody is standing on the platform now. A man in a white suit, soaked through, watching the train go by.', 5600)); }
  else if (S.riders === 3 && !S.ev.rider3) { S.ev.rider3 = true; save(); after(1.4, () => sayI('There are more of them on the platform every time. They stand in the rain and watch the saloon go past.', 5600)); }
}

/* ---------------- the man ---------------- */
function manUpdate(dt, st) {
  const bal = !!onBalcony();
  O.man.visible = !bal && !V.finale;
  O.man.position.set(Math.sin(G.time * 0.3) * 0.05, RAIL - 0.05, BALC.z1 + 0.5 + S.dist);
  O.man.rotation.y = Math.PI;   // facing the train
  // at the back door, once he's caught up
  if (bal && !S.ev.doorShown && (V.black > 0.2 || !inView(O.rdoor, 1.1))) { S.ev.doorShown = true; save(); after(2.0, () => { if (V.finale) return; sKnocks(POS.rdoor, 3, 0.7, 0.9); after(2.2, () => guardLine('door', 'Right outside the back door, polite and patient: "Let me in, sir. Only the brake. It is my carriage. Let me set the brake."', { pos: POS.rdoor, fx: 'muffled', volume: 1.3 })); }); }
  O.manDoor.visible = !!(bal && S.ev.doorShown && !V.finale);
  O.manDoor.position.set(0.12, 0.02, ZR + 0.42); O.manDoor.rotation.y = Math.PI;
  // the first time you look out of the back: lightning shows him
  const lookingBack = inView(O.man.userData.eye, 0.7) && P.z > 1.0 && !G.uiOpen;
  if (lookingBack && !S.flags.sawMan && !V.st.inTun) { V.rearView += dt; if (V.rearView > 1.2) { S.flags.sawMan = true; save(); flashBolt(true); after(0.4, () => sayI('Lightning. Far down the line behind the train, a man is standing between the rails, in a pale uniform. He isn\'t walking. He just keeps up.', 7000)); } }
  if (lookingBack && !S.flags.sawKeys && P.z > 3.2) { S.flags.sawKeys = true; save(); after(S.flags.sawMan ? 0.2 : 7.5, () => sayI('On the tail lamp just outside the left-hand back window hangs a ring of keys, swinging with the carriage.', 5400)); }
  // he calls, once, from far away
  if (S.flags.boxOpen && !S.ev.far && !st.inTun) { S.ev.far = true; save(); after(1, () => guardLine('far', 'From far down the line, through the rain, a man\'s voice: "Sir? Is the brake on, sir?"', { pos: O.man.position.clone().setY(1.2), fx: 'whisper', volume: 1.6 })); }
}

/* ---------------- lights inside ---------------- */
function lightsUpdate(dt) {
  V.black = Math.max(0, V.black - dt); V.dipT = Math.max(0, V.dipT - dt);
  const st = V.st, inT = st && st.inTun;
  let k = 1;
  if (inT) k *= 0.82 + Math.sin(G.time * 17) * 0.05 + (Math.random() < 0.03 ? -0.4 : 0);
  if (V.black > 0) k = V.black > 0.15 ? 0.0 : 0.3;
  if (V.dipT > 0) k *= 0.35 + Math.abs(Math.sin(V.dipT * 22)) * 0.4;
  if (V.finale > 0) k *= V.finaleK ?? 1;
  V.lightK = lerp(V.lightK, k, Math.min(1, dt * 20));
  const kk = V.lightK;
  L.front.intensity = IS_TOUCH ? 0 : 3.6 * kk; L.mid.intensity = (IS_TOUCH ? 6 : 4.4) * kk; L.rear.intensity = 4.0 * kk; L.desk.intensity = 1.1 * kk; L.wc.intensity = 2.2 * kk; L.vest.intensity = 2.0 * kk;
  O.bowls.forEach(b => { b.b.material.emissiveIntensity = 1.5 * kk; b.gl.material.opacity = 0.35 * kk; });
  O.dshade.material.emissiveIntensity = 0.5 * kk;
  // the black glass: when the back of the saloon is in the tunnel and the lights are on
  const target = st && st.rearIn && !V.finale ? kk : 0;
  V.reflK = lerp(V.reflK, target, Math.min(1, dt * 6));
  O.wglass.setK(V.reflK);
}

/* ---------------- the desk ---------------- */
function openDrawer() { S.drawer = 'open'; save(); sScrape(POS.desk, 0.4, 0.14); tween(0.5, k => O.mdrawer.position.x = -0.3 * k); }
function shutDrawer() { S.drawer = 'shut'; save(); sScrape(POS.desk, 0.3, 0.1); tween(0.4, k => O.mdrawer.position.x = -0.3 * (1 - k)); }
function readReport() { flag('readReport'); O.report.visible = false; openDoc('inquiry'); }
function drawerOut() {
  S.drawer = 'out'; save(); sScrape(POS.desk, 0.6, 0.14);
  const p0 = O.mdrawer.position.clone();
  tween(0.9, k => { O.mdrawer.position.set(lerp(p0.x, -0.62, k), lerp(p0.y, 0.05, k) + Math.sin(k * Math.PI) * 0.15, lerp(p0.z, -0.62, k)); O.mdrawer.rotation.y = 0.35 * k; }, () => { sThunk(POS.desk.clone().setY(0.1), 0.35, 150); renderer.shadowMap.needsUpdate = true; });
  O.slot.visible = true; O.sdrawer.visible = true;
  after(1.0, () => sayI('You lift the drawer right out and set it on the floor. Where it was, a dark slot runs back into the desk.', 4600));
}
function reachSlot() {
  if (S.flags.trayOut) { sayI('Just the empty slot. The hidden drawer is already out.', 3200); return; }
  flag('trayOut'); sClick(POS.desk, 0.4, 1600);
  after(0.5, () => { sClick(POS.desk, 0.5, 900); tween(0.35, k => O.sdrawer.position.x = O.sdrawer.userData.base - 0.42 * k, () => sThunk(POS.desk, 0.2, 300)); });
  after(1.0, () => sayI('Your fingers find a little wooden catch right at the back of the slot. Click. A shallow hidden tray springs forward out of the dark, and in it lies a small brass key.', 6400));
}
function takeWinKey() { give('winKey'); flag('winKey'); O.winKey.visible = false; save(); }

/* ---------------- the back window, the keys, the umbrella ---------------- */
function unlockWindow() { flag('winUnlocked'); sClick(POS.rwin, 0.5, 1800); sayI('The little brass key turns in the window lock. The drop window is free.', 3600); }
function lowerWindow() {
  if (V.st.inTun) { sayI('Not in the tunnel. The smoke and the noise would come straight in.', 3800); return; }
  S.win = 'open'; save(); O.strap.visible = false; sScrape(POS.rwin, 0.8, 0.2);
  tween(0.9, k => O.drop.position.y = O.dropTop - 0.5 * k);
  after(0.6, () => { if (A.ready) setGain(A.loops.wind, 0.14, 0.3); });
  if (!S.ev.opened) { S.ev.opened = true; save(); after(1.0, () => sayI('The window drops into the door with a bang. Rain and wind pour in. The key ring hangs from the tail lamp below you, an arm\'s length and a bit beyond your fingers.', 6400)); }
}
function raiseWindow() { S.win = 'shut'; save(); O.strap.visible = true; sScrape(POS.rwin, 0.6, 0.15); tween(0.7, k => O.drop.position.y = O.dropTop - 0.5 * (1 - k)); if (A.ready) setGain(A.loops.wind, 0, 0.3); }
function reachKeys() { sayI('You lean out into the rain as far as you dare. Your fingertips are a good foot short of the ring.', 4200); }
function hookKeys() {
  if (V.st.inTun) { sayI('You can\'t see a thing out there in the tunnel. Wait till you\'re back out in the open.', 4000); return; }
  G.cutscene = true; releasePointer(); flag('tug');
  const y0 = G.yaw, p0 = G.pitch, x0 = P.x, z0 = P.z;
  tween(0.8, k => { P.x = lerp(x0, 0.9, k); P.z = lerp(z0, ZR - 0.4, k); G.yaw = y0 + wrapA(Math.PI - 0.15 - y0) * k; G.pitch = lerp(p0, -0.55, k); });
  after(0.9, () => { sayI('You lean out with the umbrella and reach down. The crook catches the ring...', 3000); sScrape(POS.lamp, 0.4, 0.1); });
  after(2.4, () => {
    // something on the other end
    G.shake = 1.4; G.fearT = 0.8; sStinger(0.8); sScrape(POS.lamp, 0.9, 0.35);
    sayI('...and something pulls back. Hard. The umbrella is torn out of your hands and gone into the dark. The keys come loose and fly back at you.', 6000);
    S.dist = Math.max(distTarget(), S.dist - 30);
    drop('umbrella'); flag('umbLost');
  });
  after(3.4, () => { sClick(POS.rwin.clone().setY(0.1), 0.6, 2600); sThunk(POS.rwin.clone().setY(0.05), 0.3, 400); give('keys'); flag('keys'); O.ring.visible = false; });
  after(4.6, () => { G.cutscene = false; updatePrompt(true); tween(1.0, k => { G.pitch = lerp(-0.55, -0.1, k); }); });
}

/* ---------------- the washroom ---------------- */
function toggleWcDoor() { S.wcOpen = !S.wcOpen; save(); O.colWc.on = !S.wcOpen; sCreak(POS.basin.clone().setX(0.2), 0.7, 0.18, 150); const a = O.wcPivot.rotation.y, b = S.wcOpen ? -1.45 : 0; tween(0.7, k => O.wcPivot.rotation.y = lerp(a, b, k), () => renderer.shadowMap.needsUpdate = true); }
function toggleGeyser() {
  S.geyser = !S.geyser; save(); sClick(POS.geyser, 0.4, 2200); O.gToggle.position.y = S.geyser ? 0.03 : -0.01;
  if (S.geyser && V.heat < 1) sayI('The geyser clicks on. Its little red light comes on, and it starts to hum.', 3800);
  if (!S.geyser) sayI('The geyser clicks off.', 2400);
}
function toggleTap(hot) {
  const k = hot ? 'hot' : 'cold'; S[k] = !S[k]; save(); sSqueak(POS.basin, 0.08);
  const head = hot ? O.hotHead : O.coldHead, from = head.rotation.y, to = S[k] ? 1.4 : 0; tween(0.3, t => head.rotation.y = lerp(from, to, t));
  if (hot && S.hot) { if (V.heat >= 1) sayI('Hot water gushes into the basin, steaming.', 3400); else sayI('The hot tap runs cold. The water in the geyser hasn\'t heated.', 4200); }
}
function mirrorActions() {
  const a = [];
  if (V.fog > 0.55) a.push({ label: 'Look closely at the steam', run: () => { flag('mirrorSeen'); openDoc('mirror'); } });
  else if (S.flags.mirrorSeen) a.push({ label: 'Remember the writing', run: () => openDoc('mirror') });
  a.push(look(V.fog > 0.55 ? 'The glass has steamed right over. In the grey, some lines stay clear where a finger once drew.' : 'Your own face in the glass, grey with tiredness. Behind you, the washroom door.'));
  return a;
}

/* ---------------- the guard's box ---------------- */
function openBoxLock() {
  flag('boxSeen');
  if (!S.flags.keys) { sThunk(POS.box, 0.4, 140); sayI('Locked. A heavy padlock through the hasp. The guard\'s own key would open it.', 4200); return; }
  sClick(POS.box, 0.6, 1500); sThunk(POS.box, 0.6, 220);
  after(0.4, () => { sayI('One of the keys on his ring fits the padlock. It turns, stiff with rust.', 3600); openBox(); });
}
function openBox() {
  flag('boxOpen'); O.boxIn.visible = true; sCreak(POS.box, 1.0, 0.25, 120); tween(0.3, k => { O.padlock.position.y = -0.04 - 0.3 * k; }, () => { O.padlock.visible = false; });
  tween(1.0, k => O.boxLid.rotation.x = -1.7 * k, () => renderer.shadowMap.needsUpdate = true);
  after(1.1, () => sayI('The lid comes up. Inside: a guard\'s hand lamp, two rolled flags, and a heavy brass key on a tag.', 5000));
}
function takeSlipKey() { give('slipKey'); O.slipKey.visible = false; save(); }

/* ---------------- the slip gear and the door ---------------- */
function fitSlipKey() { drop('slipKey'); flag('slipFitted'); O.slipKeyIn.visible = true; sClick(POS.slip, 0.6, 1400); sThunk(POS.slip, 0.3, 300); sayI('The slip key goes into the socket by the lever and turns a quarter. The lever is free now, but still stiff as iron.', 5200); }
function tryLever() {
  if (V.slack) {
    S.slip = 'locked'; save(); paintPlate(); sThunk(POS.slip, 1.0, 140); sClick(POS.slip, 0.7, 700); G.shake = 0.5;
    tween(0.5, k => O.slipLever.rotation.z = 0.55 * k); tween(0.4, k => O.ibolt.position.y = CDOOR.h + 0.05 + 0.09 * k);
    after(0.5, () => { sClick(POS.cdoor.clone().setY(2.05), 0.6, 1800); sayI('The couplings go slack, and the lever comes back with a clank to LOCKED. At the top of the gangway door, the brass bolt shoots back out of the frame.', 6000); });
    if (!S.flags.keys) after(6.5, () => sayI('Now the door only wants its key.', 3000));
    return;
  }
  sThunk(POS.slip, 0.4, 90); G.shake = 0.15;
  sayI(V.st.inTun ? 'It won\'t move. The whole coupling is dragging at it, as the engine hauls the train through the tunnel.' : 'It won\'t budge an inch. The couplings are stretched tight, with the engine hauling hard up the bank.', 4600);
}
function doorActions() {
  const a = [];
  if (S.flags.keys && S.slip === 'locked') a.push({ label: 'Unlock it and go through', run: endSequence });
  else a.push({ label: 'Try the door', run: tryDoor });
  a.push({ label: 'Knock', run: knockDoor });
  a.push({ label: 'Read the note', run: () => openDoc('anote') });
  return a;
}
function tryDoor() {
  flag('triedDoor'); sThunk(POS.cdoor, 0.4, 120);
  if (!S.flags.keys) sayI(S.slip === 'locked' ? 'Locked. It needs a carriage key.' : 'Locked. It needs a carriage key. And a brass bolt has shot out of the top of the door into the frame. A rod runs from it down to the old lever beside the door.', 5600);
  else sayI('The square carriage key turns the lock, but the door still won\'t open. The brass bolt at the top is shot, and a rod runs from it down to the lever of the slip gear beside the door.', 6200);
}
function knockDoor() {
  sKnocks(POS.cdoor, 3, 0.4, 0.8);
  after(1.8, () => sayI(S.ev.knocked ? 'Nothing. Only the gangway, grinding.' : 'You knock, and wait. Nothing comes back but the gangway grinding and the roar of the train. Ramesh must be asleep.', 4600));
  S.ev.knocked = true; save();
}

/* ---------------- the handbrake: don't ---------------- */
function turnBrake() {
  S.wrong++; save(); G.cutscene = true;
  tween(1.2, k => O.brakeWheel.rotation.y = -k * 2.5);
  sSqueal(POS.under.clone().setZ(ZR), 2.4, 0.16); after(0.3, () => { G.shake = 1.6; sThunk(POS.under, 0.8, 70); });
  after(1.4, () => { V.dipT = 1.6; sStinger(0.7); G.fearT = 0.7; S.dist = Math.max(distTarget(), S.dist - 25); if (onBalcony()) sKnocks(POS.rdoor, 4, 0.3, 1); });
  after(1.5, () => sayI('The brake blocks bite with a shriek and the whole carriage shudders, dragging. You spin the wheel back as fast as you can. Out on the line, he is nearer.', 6200));
  after(2.2, () => tween(1.0, k => O.brakeWheel.rotation.y = -2.5 * (1 - k), () => { G.cutscene = false; updatePrompt(true); }));
}

/* ---------------- the slow burn, turned up ---------------- */
const DIR = { t: 50, last: '' };
const EVENTS = [
  { id: 'roof', ok: () => progCount() >= 1 && !V.st.inTun, run: () => { roofSteps(8, ZR - 0.5, rand(-3, 0)); if (!S.ev.roof) { S.ev.roof = true; save(); after(2.5, () => sayI('Footsteps. On the roof. Slow ones, walking up the carriage toward the engine, in the rain.', 5000)); } } },
  { id: 'dip', ok: () => true, run: () => { V.dipT = 1.3; } },
  { id: 'floor', ok: () => true, run: () => { sThunk(POS.under.clone().setZ(rand(-3, 3)), 0.8, 60); after(0.4, () => sThunk(POS.under.clone().setZ(rand(-3, 3)), 0.6, 60)); } },
  { id: 'fan', ok: () => !S.fans, run: () => { const f = O.fans[irand(0, 1)]; if (inView(f.g, 1.0)) return false; f.spd = 0.6; sClick(null, 0.3, 700); after(6, () => { if (!S.fans) f.spd = 0; }); } },
  { id: 'tap', ok: () => progCount() >= 2 && V.st && !V.st.inTun, run: () => { const w = O.windows[irand(0, 7)]; for (let i = 0; i < 4; i++) after(i * 0.35, () => sKnock(new THREE.Vector3(w.side * (HW + 0.05), 1.4, w.z), 0.25, 0, 0)); } },
  { id: 'bell', ok: () => progCount() >= 3, run: () => { if (!S.ev.balconyBell) { S.ev.balconyBell = true; save(); paintBells(true); } sBell(POS.bells, 1.4); after(1.6, () => { if (!S.ev.bellSaid) { S.ev.bellSaid = true; save(); sayI('The attendant\'s bell rings in the vestibule. Someone has pressed a bell push.', 4200); } }); } },
  { id: 'handle', ok: () => progCount() >= 3, run: () => { for (let i = 0; i < 5; i++) after(i * 0.12, () => sClick(POS.rdoor, 0.4, 1200 + rand(-200, 200))); } },
  { id: 'chair', ok: () => progCount() >= 2, run: () => { const c = O.chairs[irand(0, 1)]; if (inView(c, 1.05)) return false; c.position.x += rand(-0.08, 0.08); c.rotation.y += rand(-0.3, 0.3); renderer.shadowMap.needsUpdate = true; sScrape(c.position.clone().setY(0.1), 0.35, 0.1); } },
  { id: 'brakeWheel', ok: () => progCount() >= 4, run: () => { if (inView(O.brake, 1.0)) return false; sSqueal(POS.brake, 0.8, 0.07); tween(0.6, k => O.brakeWheel.rotation.y = -0.4 * Math.sin(k * Math.PI)); } },
  { id: 'whisper', ok: () => progCount() >= 2, run: () => { sBreath(POS.balcony, 2, 0.35); } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || G.ending || V.finale) return;
  DIR.t -= dt; if (DIR.t > 0) return;
  const opts = EVENTS.filter(e => e.id !== DIR.last && e.ok());
  for (let tr = 0; tr < 4 && opts.length; tr++) { const e = opts.splice(Math.floor(Math.random() * opts.length), 1)[0]; if (e.run() !== false) { DIR.last = e.id; break; } }
  const p = progCount(); DIR.t = rand(38, 64) - p * 3;
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  // desk and register
  // with the drawer out, the slot is a narrow dark gap under the desk top and hard to point at from standing,
  // so the desk itself offers the reach (and the key, once the tray is out)
  inter('desk', O.desk, { name: 'Writing desk', actions: () => [S.drawer === 'out' && !S.flags.trayOut ? { label: 'Reach into the slot', run: reachSlot } : null, S.flags.trayOut && !S.flags.winKey ? { label: 'Take the small brass key', run: takeWinKey } : null, look('A teak writing desk with a green leather top and brass handles. The officers who used this saloon did their paperwork here, facing the window.')] });
  inter('register', O.register, { name: 'Register', actions: () => [{ label: 'Read it', run: () => openDoc('register') }] }); hitbox('register', O.register, 0.03);
  inter('mdrawer', O.mdrawer, { name: 'Middle drawer', enabled: () => S.drawer !== 'out', actions: () => S.drawer === 'shut' ? [{ label: 'Open it', run: openDrawer }] : [{ label: 'Take the drawer right out', run: drawerOut }, { label: 'Shut it', run: shutDrawer }] }); hitbox('mdrawer', O.mdrawer, 0.03);
  inter('slot', O.slot, { name: 'Slot where the drawer was', enabled: () => S.drawer === 'out', actions: () => [{ label: 'Reach inside', run: reachSlot }] }); hitbox('slot', O.slot, 0.03);
  inter('tray', O.sdrawer, { name: 'Hidden drawer', enabled: () => S.flags.trayOut && !S.flags.winKey, actions: () => [{ label: 'Take the small brass key', run: takeWinKey }] }); hitbox('tray', O.sdrawer, 0.04);
  inter('dlamp', O.dlamp, { name: 'Desk lamp', actions: () => [look('A brass reading lamp with a cream shade, bolted to the desk against the swaying.')] });
  inter('dchair', O.dchair, { name: 'Desk chair', actions: () => [look('The chair you fell asleep in. There\'s a dent in the leather where your head was.')] });
  // back of the saloon
  inter('drop', O.drop, { name: 'Left-hand back window', reach: 2.2, actions: dropActions }); hitbox('drop', O.drop, 0.02);
  inter('winlock', O.winLock, { name: 'Window lock', reach: 2.2, enabled: () => !S.flags.winUnlocked, actions: dropActions }); hitbox('winlock', O.winLock, 0.03);
  inter('ringOut', O.ring, { name: 'Keys on the tail lamp', reach: 2.4, enabled: () => !S.flags.keys, actions: dropActions });
  inter('lwin', O.rearPanes[0], { name: 'Right-hand back window', reach: 2.2, actions: () => [look(V.st && V.st.rearIn ? 'Black glass. The saloon in it is not the saloon you are standing in.' : 'The line behind, running away into the rain and the dark. This one has been painted shut.')] });
  inter('rdoor', O.rdoor, { name: 'Balcony door', actions: () => [{ label: 'Try the door', run: () => { sThunk(POS.rdoor, 0.4, 120); sayI(S.flags.keys ? 'The carriage key turns, but the door won\'t move. It\'s bolted on the outside: through the glass you can see the iron bolt shot home.' : 'It won\'t open. Through the glass you can see why: an iron bolt, shot home on the outside.', 5200); } }, look('The door to the little open balcony at the back. Rain drives across it, lit red by the tail lamp.')] });
  inter('brake', O.brake, { name: 'Handbrake', actions: () => [{ label: 'Turn the wheel', run: turnBrake }, look('The slip guard\'s handbrake: an iron column with a wheel on top. A plate says TURN RIGHT TO APPLY.')] });
  inter('arm2', O.arm2, { name: 'Armchair', actions: () => [look('A deep leather armchair turned to face the back windows, for watching the line run away behind.')] });
  inter('stable', O.stable, { name: 'Little table', actions: () => [look('A brass ashtray, polished. Nobody has used it in a very long time.')] });
  // lounge
  inter('sofa', O.sofa, { name: 'Sofa-berth', actions: () => [look('Buttoned green leather, cold to the touch. At night it makes up into a bed.')] });
  inter('table', O.table, { name: 'Dining table', actions: () => [look('Two cups laid out for tea, and a thermos. The tea in it has been cold for hours.')] });
  O.chairs.forEach((c, i) => inter('chair' + i, c, { name: 'Chair', actions: () => [look('A teak dining chair with a leather seat.')] }));
  inter('side', O.side, { name: 'Sideboard', actions: () => [look('The pantry sideboard: crockery rattling in its racks, a nickel teapot on a brass tray.')] });
  inter('arm1', O.arm1, { name: 'Armchair', actions: () => [look('An armchair by the window. Out there, the ravine.')] });
  inter('books', O.books, { name: 'Bookcase', actions: () => [look('Working timetables, a General Rules book, Bradshaw\'s Guide for 1926, a novel with the cover missing.')] });
  inter('profile', O.profile, { name: 'Framed gradient profile', actions: () => [{ label: 'Look at it', run: () => openDoc('profile') }] });
  inter('photo', O.photo, { name: 'Framed photograph', actions: () => [{ label: 'Look at it', run: () => openDoc('photo') }] });
  inter('clock', O.clock, { name: 'Clock', reach: 2.6, actions: () => [look('A railway clock. It has stopped at twenty to three.')] });
  inter('chain', O.chain, { name: 'Alarm chain', reach: 2.6, actions: () => [{ label: 'Pull it', run: () => { sScrape(POS.photo, 0.5, 0.12); sayI(S.ev.chain ? 'Slack.' : 'The chain comes down slack in your hand. It\'s been cut, somewhere up in the roof.', 4000); S.ev.chain = true; save(); } }] }); hitbox('chain', O.chain, 0.05);
  inter('switches', O.switches, { name: 'Switches', actions: () => [{ label: S.fans ? 'Switch the fans off' : 'Switch the fans on', run: () => { S.fans = !S.fans; save(); O.fans.forEach(f => f.spd = S.fans ? 1 : 0); sClick(null, 0.4, 1800); } }, { label: 'Switch the lights off', run: () => { sClick(null, 0.4, 1800); sayI('The switch clicks down. Nothing happens. The lights stay on, as if they had a reason to.', 4400); } }] }); hitbox('switches', O.switches, 0.03);
  O.windows.forEach((w, i) => { if (w.side === 0) return; inter('win' + i, w.g, { name: 'Window', actions: () => [look(winLook(w))] }); });
  inter('bowls', O.bowls[1].g, { name: 'Lamp', reach: 3, actions: () => [look('A frosted glass bowl with a brass rim. The bulb inside buzzes faintly.')] });
  // front: the door, the lever, the box, the bell board, the umbrella
  inter('cdoor', O.cdoor, { name: 'Gangway door', actions: doorActions });
  inter('anote', O.anote, { name: 'Note taped to the door', actions: () => [{ label: 'Read it', run: () => openDoc('anote') }] }); hitbox('anote', O.anote, 0.03);
  inter('slip', O.slip, { name: () => `Slip gear (${S.slip === 'locked' ? 'LOCKED' : 'ARMED'})`, actions: slipActions });
  inter('box', O.box, { name: 'Guard\'s box', actions: () => S.flags.boxOpen ? [!took('slipKey') && !S.flags.slipFitted ? { label: 'Take the slip key', run: takeSlipKey } : null, look('The hand lamp has a green glass on one side and a red on the other. The flags are soft with damp.')] : [{ label: S.flags.keys ? 'Unlock it with the key ring' : 'Try the lock', run: openBoxLock }, look('A green steel trunk, stencilled GUARD · SLIP · S.9, and a name: J. D\'SOUZA. A heavy padlock through the hasp.')] });
  inter('bells', O.bells, { name: 'Bell board', actions: () => [look(S.ev.balconyBell ? 'The attendant\'s bell board. The BALCONY flag has dropped. Somebody rang from out on the balcony.' : 'The attendant\'s bell board, with a flag for each bell push in the saloon: LOUNGE, OFFICE, BATH, BALCONY.')] });
  inter('ustand', O.ustand, { name: 'Umbrella stand', actions: () => [!took('umbrella') && !S.flags.umbLost ? { label: 'Take the umbrella', run: () => { give('umbrella'); O.umb.visible = false; } } : look('An empty umbrella stand.')] });
  inter('umb', O.umb, { name: 'Umbrella', enabled: () => !took('umbrella') && !S.flags.umbLost, actions: () => [{ label: 'Take it', run: () => { give('umbrella'); O.umb.visible = false; } }] }); hitbox('umb', O.umb, 0.1); hitbox('ustand', O.ustand, 0.06);
  O.sideDoors.forEach((d, i) => inter('sdoor' + i, d, { name: 'Outside door', actions: () => [look('Locked. Just as well. Beyond the glass is the dark and a long drop.')] }));
  // washroom
  inter('wcdoor', O.wcDoor, { name: 'Washroom door', actions: () => [{ label: S.wcOpen ? 'Close it' : 'Open it', run: toggleWcDoor }] });
  inter('gswitch', O.gSwitch, { name: () => `Geyser switch (${S.geyser ? 'on' : 'off'})`, actions: () => [{ label: S.geyser ? 'Switch it off' : 'Switch it on', run: toggleGeyser }] }); hitbox('gswitch', O.gSwitch, 0.03);
  inter('geyser', O.geyser, { name: 'Geyser', reach: 2.6, actions: () => [look(S.geyser ? (V.heat >= 1 ? 'The geyser ticks as it cools. The little red light has gone out: the water is hot.' : 'The geyser hums. Its little red light is on while it heats.') : 'A white enamel water heater on the wall. Its switch is by the mirror.')] });
  inter('basin', O.basin, { name: 'Basin', actions: () => [look('A white enamel basin with a hot and a cold tap. A crack runs down the enamel like a hair.')] });
  inter('hot', O.taps[0], { name: () => `Hot tap (${S.hot ? 'running' : 'off'})`, actions: () => [{ label: S.hot ? 'Turn it off' : 'Turn it on', run: () => toggleTap(true) }] }); hitbox('hot', O.taps[0], 0.03);
  inter('cold', O.taps[1], { name: () => `Cold tap (${S.cold ? 'running' : 'off'})`, actions: () => [{ label: S.cold ? 'Turn it off' : 'Turn it on', run: () => toggleTap(false) }] }); hitbox('cold', O.taps[1], 0.03);
  inter('wcmirror', O.wcMirrorG, { name: 'Mirror', actions: mirrorActions });
  inter('wc', O.wc, { name: 'Lavatory', actions: () => [look('The pan opens straight onto the track. Through it, sleepers flicker past in the red light.')] });
}
function winLook(w) {
  const st = V.st || {};
  if (st.inTun) return 'Black rock rushes past a foot from the glass, lit by the saloon\'s own windows.';
  if (st.halt && w.side < 0) return 'The little platform slides past outside, close enough to touch.';
  if (w.side < 0) return 'Wet black rock, running past close to the glass. Ferns and water streaming down it.';
  return 'The ravine. Somewhere below, in the rain and the dark, the valley. Far off, the white threads of waterfalls on the other side.';
}
function dropActions() {
  const a = [];
  if (!S.flags.winUnlocked) {
    if (took('winKey')) a.push({ label: 'Unlock it with the small brass key', run: unlockWindow });
    a.push(look('A drop window: it lowers into the wall on a leather strap. There\'s a small brass lock on the frame, locked. Outside and below it, a ring of keys hangs on the tail lamp.'));
    return a;
  }
  if (S.win === 'shut') { a.push({ label: 'Lower the window', run: lowerWindow }); a.push(look('Outside and below, the key ring swings on the tail lamp.')); return a; }
  if (!S.flags.keys) a.push(took('umbrella') ? { label: 'Hook the keys with the umbrella', run: hookKeys } : { label: 'Reach for the keys', run: reachKeys });
  a.push({ label: 'Raise the window', run: raiseWindow });
  return a;
}
function slipActions() {
  const a = [];
  if (S.slip === 'locked') { a.push(look('The lever stands at LOCKED. The door\'s bolt is drawn.')); a.push({ label: 'Read the plate', run: () => { flag('readPlate'); openDoc('plate'); } }); return a; }
  if (!S.flags.slipFitted) a.push(took('slipKey') ? { label: 'Fit the slip key', run: fitSlipKey } : { label: 'Try the lever', run: () => { sThunk(POS.slip, 0.3, 100); sayI('Locked solid. There\'s a keyhole beside it, for a key shaped like a T.', 4200); } });
  else a.push({ label: V.slack ? 'Pull it back to LOCKED, now' : 'Pull it back to LOCKED', run: tryLever });
  a.push({ label: 'Read the plate', run: () => { flag('readPlate'); openDoc('plate'); } });
  if (S.flags.slipFitted) a.push({ label: 'Push it forward to SLIP', run: () => sayI('If you let the carriage go now, you go with it: back down the bank, into the dark, towards him.', 5000) });
  return a.slice(0, 2).concat(a.slice(2));
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  worldUpdate(dt);
  lightsUpdate(dt);
  const t = G.time, st = V.st;
  // the carriage sways; the jolt at the halt
  V.jolt = Math.max(0, V.jolt - dt * 1.5);
  const sw = V.spd / 12.5;
  if (!V.finale || V.recede <= 0) {
    camera.position.x += Math.sin(t * 1.1) * 0.012 * sw + Math.sin(t * 2.9) * 0.004 * sw;
    camera.position.y += Math.sin(t * 7.3) * 0.0025 * sw + (Math.random() - 0.5) * 0.0018 * sw;
    camera.rotation.z = Math.sin(t * 1.1 + 0.6) * 0.006 * sw + Math.sin(V.jolt * 18) * V.jolt * 0.02;
  }
  if (V.recede > 0) { camera.position.z -= V.recede; O.gang.position.z = ZF - V.recede; O.nextDoor.position.z = ZF - 1.0 - V.recede; O.frontFace.visible = true; }
  camera.updateMatrixWorld();
  // swinging things
  O.ring.rotation.z = Math.sin(t * 2.1) * 0.25 * sw + Math.sin(V.jolt * 12) * V.jolt * 0.6; O.ring.rotation.x = Math.sin(t * 1.7) * 0.15;
  O.slipLever.rotation.x = V.slack && S.slip !== 'locked' ? Math.sin(t * 40) * 0.02 : 0;
  // fans
  O.fans.forEach(f => { f.cur = lerp(f.cur || 0, f.spd, Math.min(1, dt * 0.8)); f.rot.rotation.y += f.cur * dt * 18; });
  if (A.ready) setGain(A.loops.fan, O.fans.reduce((s, f) => s + (f.cur || 0), 0) * 0.02, 0.3);
  // clickety-clack: two bogies over every rail joint (13 m)
  V.clackAcc += V.spd * dt;
  if (V.clackAcc > 13) { V.clackAcc -= 13; const v = Math.max(2, V.spd), vol = 0.18 + 0.12 * (V.spd / 12.5), tv = st && st.inTun ? 1.4 : 1; for (const [z, d] of [[-3.8, 0], [-3.8, 2.4], [3.8, 15], [3.8, 17.4]]) after(d / v, () => sClack(z, vol * tv)); }
  // sound beds
  if (A.ready && A.loops.rumble) {
    const sp = V.spd / 12.5;
    setGain(A.loops.rumble, (0.08 + 0.1 * sp) * (st && st.inTun ? 1.6 : 1), 0.3); setGain(A.loops.hiss, 0.012 + 0.02 * sp, 0.3);
    setGain(A.loops.geyser, S.geyser && V.heat < 1 ? 0.05 : 0, 0.3); setGain(A.loops.tap, (S.hot || S.cold) ? 0.05 : 0, 0.2);
    setGain(A.loops.wind, S.win === 'open' && !(st && st.inTun) ? 0.12 * sp + 0.03 : S.win === 'open' ? 0.2 : 0, 0.3);
    setGain(A.loops.tension, 0.0014 + progCount() * 0.0009 + (onBalcony() ? 0.003 : 0), 2);
  }
  // the geyser, the taps, the steam and the fog on the mirror
  if (S.geyser) V.heat = Math.min(1, V.heat + dt / 16);
  if (V.heat >= 1 && !S.ev.hotSaid && S.geyser) { S.ev.hotSaid = true; save(); sClick(POS.geyser, 0.3, 1400); if (Math.hypot(P.x - 0.8, P.z + 3.1) < 1.6) sayI('The geyser clicks, and its red light goes out. The water is hot.', 3800); }
  O.gLight.material.emissiveIntensity = S.geyser && V.heat < 1 ? 3 : 0;
  O.stream.visible = S.hot || S.cold; O.stream.position.x = S.hot ? -0.1 : 0.1;
  O.waterSurf.material.opacity = lerp(O.waterSurf.material.opacity, (S.hot || S.cold) ? 0.7 : 0, Math.min(1, dt));
  const steaming = S.hot && V.heat >= 1;
  V.fog = clamp(V.fog + (steaming ? dt / 7 : -dt / 45), 0, 1);
  O.fog.material.uniforms.fog.value = smooth(V.fog);
  steamUpdate(dt, steaming);
  if (V.fog > 0.6 && !S.ev.fogSaid && Math.hypot(P.x - 0.7, P.z + 3.2) < 1.3) { S.ev.fogSaid = true; save(); sayI('The mirror steams over. And in the grey, lines appear where a fingertip once drew on the glass.', 5200); }
  if (V.fog > 0.6 && !S.flags.mirrorSeen && inView(O.wcMirror, 0.6) && Math.hypot(P.x - 0.7, P.z + 3.2) < 1.3) { V.mirT = (V.mirT || 0) + dt; if (V.mirT > 1.2) { flag('mirrorSeen'); sayI('Written in the steam with a fingertip: NOT THE WHEEL. And under it, smaller: HE IS IN THE GLASS.', 6400); } }
  // and then a hand presses into the steam, from the other side
  if (S.flags.mirrorSeen && V.fog > 0.7 && !S.ev.hand && inView(O.wcMirror, 0.7)) { S.ev.hand = true; save(); after(3.5, () => { V.handGo = true; sSqueak(POS.wcMirror, 0.1); after(0.2, () => sSqueak(POS.wcMirror, 0.07)); G.fearT = 0.5; sayI('A hand presses flat into the steam. Not your hand. From the other side of the glass.', 5000); }); }
  if (V.handGo) V.hand = Math.min(1, V.hand + dt * 1.2);
  O.fog.material.uniforms.hand.value = V.hand * (V.fog > 0.2 ? 1 : 0);
  if (st && st.rearIn && V.reflK > 0.6 && !S.flags.wreckSeen && !G.uiOpen && P.z > 1.2 && inView(O.reflEye, 0.55)) {
    V.wreckT = (V.wreckT || 0) + dt;
    if (V.wreckT > 1.4) { flag('wreckSeen'); G.fearT = 0.4; sayI('In the black glass the saloon is a wreck. Ferns grow up through the floor, moss covers the walls, and water drips from the roof. By the desk, the middle drawer lies on the floor, and in the gap where it was, something small and brass is shining.', 9000); }
  }
  // the figure in the black glass, standing behind you
  O.manRefl.visible = false;
  if (S.flags.winKey && st && st.rearIn && V.reflK > 0.4 && !V.finale) {
    const fwd = new THREE.Vector3(-Math.sin(G.yaw), 0, -Math.cos(G.yaw));
    if (fwd.z > 0.6 && P.z > 1.5) {
      O.manRefl.visible = true; O.manRefl.position.set(P.x - fwd.x * 1.3, 0, P.z - fwd.z * 1.3); O.manRefl.rotation.y = Math.atan2(fwd.x, fwd.z);
      V.reflT += dt; if (V.reflT > 1.5 && !S.ev.refl) { S.ev.refl = true; save(); guardLine('refl', 'In the black glass, a man in a wet white uniform is standing right behind you. A whisper, very close: "She is my carriage."', { pos: new THREE.Vector3(P.x - fwd.x * 0.6, 1.6, P.z - fwd.z * 0.6), volume: 1.4 }); G.fearT = 0.8; }
    }
  }
  // the dead on the platform turn their heads to follow you
  if (O.halt.visible) O.riders.forEach(r => { if (!r.visible) return; const wz = O.halt.position.z + r.position.z; r.rotation.y = clamp(Math.atan2(2.4, P.z - wz), 0.3, 2.85); });
  // the slow burn
  const pk = progCount() + ':' + Object.keys(S.flags).length; if (pk !== V.progKey) { V.progKey = pk; V.stuckT = 0; } else V.stuckT += dt;
  director(dt);
  if (V.finale) finaleUpdate(dt);
}
function steamUpdate(dt, on) {
  if (!O.steam) { O.steam = []; for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xc8ccd0, transparent: true, depthWrite: false, opacity: 0 })); layer1(s); scene.add(s); O.steam.push({ s, t: i / 8 }); } }
  O.steam.forEach(p => { p.t += dt / 3; if (p.t > 1) p.t -= 1; const k = p.t; p.s.position.set(0.58 + Math.sin(k * 6 + p.s.id) * 0.05, 0.75 + k * 0.9, PART + 0.24 - k * 0.05); p.s.scale.setScalar(0.12 + k * 0.4); p.s.material.opacity = on ? Math.sin(k * Math.PI) * 0.22 : Math.max(0, p.s.material.opacity - dt); });
}

/* ---------------- the ending ---------------- */
function endSequence() {
  flag('escaped'); G.ending = true; G.cutscene = true; releasePointer(); if (UI.kind) UI.close(true);
  drop('keys'); V.finale = 0.001; V.finaleK = 1; V.frozenLap = false;
  // jump the lap to just inside the tunnel, under cover of the lights going
  V.black = 1.3; sWhump(0.8); G.shake = 0.6; V.lt = LOOP.tun0 + 1.5; if (A.ready) { setGain(A.loops.roar, 0.38, 0.2); setGain(A.loops.rain, 0, 0.3); setGain(A.loops.wind, 0, 0.3); }
  sClick(POS.cdoor, 0.6, 1400); after(0.3, () => sThunk(POS.cdoor, 0.6, 180));
  after(0.7, () => { sCreak(POS.cdoor, 1.1, 0.3, 90); tween(1.1, k => O.cdoorPivot.rotation.y = -1.55 * k); });
  const x0 = P.x, z0 = P.z, y0 = G.yaw, p0 = G.pitch;
  after(1.3, () => tween(2.1, k => { P.x = lerp(x0, 0.0, k); P.z = lerp(z0, ZF - 0.55, k); G.yaw = y0 + wrapA(0 - y0) * k; G.pitch = lerp(p0, 0, k); }));
  after(2.2, () => sayI('You step through into the gangway. The floor plates grind and shift under your feet, and the rain blows in through the joins.', 5000));
  after(3.6, () => tween(1.6, k => { G.yaw = Math.PI * k; }));
  after(4.2, () => { playClip('n_ramesh', { pos: new THREE.Vector3(0, 1.5, ZF - 1.6), fx: 'muffled', volume: 1.3 }); heard('ramesh'); subtitle('', '<i>Behind you, through the next coach\'s door, a sleepy voice: "Sir? What saloon, sir? There is no saloon. This is the last coach."</i>', 5600); });
  // the saloon's lights die, and the balcony door opens
  after(6.4, () => { V.finaleK = 0.12; sClick(POS.rdoor, 0.6, 900); sScrape(POS.rdoor, 0.6, 0.2); after(0.4, () => { sCreak(POS.rdoor, 1.4, 0.35, 70); tween(1.2, k => O.rdoorPivot.rotation.y = 1.3 * k); if (A.ready) setGain(A.loops.wind, 0.12, 0.4); }); });
  const steps = [ZR - 0.5, 2.8, 0.6, -1.6, -3.3];
  steps.forEach((z, i) => after(7.8 + i * 1.25, () => { V.finaleK = 0.02; after(0.18, () => { O.manIn.visible = true; O.manIn.position.set(rand(-0.1, 0.1), 0, z); O.manIn.rotation.y = Math.PI; L.manLamp.position.set(0.3, 0.75, z - 0.2); L.manLamp.intensity = 1.2; V.finaleK = 0.12 + (i === 0 ? 0.1 : 0); if (i === 1) sStinger(0.6); sThunk(new THREE.Vector3(0, 0.1, z), 0.4, 80); }); }));
  after(9.2, () => { G.cutscene = false; G.frozen = true; V.pullReady = true; updatePrompt(true); sayI('He is coming up the carriage. Beside you, on the saloon\'s end, is the slip coupling\'s release handle.', 6000); });
}
function pullSlip() {
  if (!V.pullReady) return; V.pullReady = false; G.frozen = true; G.cutscene = true; updatePrompt(true);
  sThunk(new THREE.Vector3(0, 0.5, ZF - 0.3), 1.0, 70); sClick(new THREE.Vector3(0, 0.5, ZF - 0.3), 0.8, 700); G.shake = 1.2; V.lt = LOOP.tun1 - 6.8; V.finaleK = 0.02;
  V.slipT = 0; V.recedeV = 0; V.slipping = true; O.gang.visible = true; O.frontFace.visible = true;
  // he stops in the doorway and lifts his lamp: green, all right
  after(0.2, () => { O.manIn.position.set(0, 0, ZF + 0.55); L.manLamp.position.set(0.3, 1.5, ZF + 0.3); L.manLamp.intensity = 2.4; V.finaleK = 0.25; });
  after(1.6, () => guardLine('end', 'The guard, in the doorway of his carriage, lifts his lamp to you. Green. "All right, sir. All right."', { pos: new THREE.Vector3(0, 1.5, ZF + 3), fx: 'whisper', volume: 1.3 }));
  after(3.5, () => sSqueal(new THREE.Vector3(0, -0.8, ZR + 8), 4.5, 0.12));
  after(5.0, () => sayI('Far back in the tunnel, a brake bites. The saloon\'s lights go out, one by one.', 5000));
  after(5.2, () => { V.finaleK = 0.12; }); after(6.2, () => { V.finaleK = 0.04; }); after(7.0, () => { V.finaleK = 0; L.manLamp.intensity = 0.6; });
  after(15.0, () => { G.blackT = 1; });
  after(16.8, showEnd);
}
function finaleUpdate(dt) {
  V.finale += dt;
  if (V.slipping) { V.slipT += dt; V.recedeV = Math.min(22, 1.3 * V.slipT); V.recede = Math.min(150, V.recede + V.recedeV * dt); }
  // while he walks up the carriage, keep the train in the tunnel (the jump hides in a flicker)
  if (!V.slipping && V.lt > LOOP.tun1 - 6) { V.lt = LOOP.tun0 + 3; V.finaleK = 0.02; after(0.15, () => { if (!V.slipping) V.finaleK = 0.12; }); }
  // out of the tunnel: the camera, riding with the front of the train, passes the far portal
  if (V.slipping && !V.dawnGo && O.tunnel.position.z - (S_T1 - S_T0) > camera.position.z + 1) { V.dawnGo = true; after(1.0, () => sayI('The train bursts out of the tunnel into a grey dawn. There is no halt. There never was.', 5000)); }
  if (V.dawnGo) O.halt.visible = false;
  if (V.dawnGo) { V.dawn = Math.min(1, V.dawn + dt / 4); scene.fog.color.setRGB(0.18 * V.dawn, 0.2 * V.dawn, 0.23 * V.dawn); }
  if (V.slipping && V.recede > 20) { L.manLamp.intensity *= 0.99; }
}
function showEnd() { finishRoom(endFrame()); }
// the survey party's photograph: the saloon where it has lain since 1926
function endFrame() {
  let url = null;
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, lay: cam.layers.mask };
    O.world.visible = false; O.man.visible = O.manIn.visible = O.manDoor.visible = O.manRefl.visible = false; O.wglass.setK(0);
    O.wreckHide.forEach(o => o.visible = false); O.mdrawer.visible = false; O.sdrawer.visible = false;
    const lv = {}; for (const k in L) if (L[k] && L[k].isLight) { lv[k] = L[k].intensity; L[k].intensity = 0; }
    L.hemi.intensity = 1.7; L.hemi.color.set(0xb8c8b0); L.hemi.groundColor.set(0x3a3a2a);
    L.bolt.intensity = 3.6; L.bolt.color.set(0xe8f0e0); L.bolt.position.set(-8, 30, 12);
    const bg = scene.background, fogc = scene.fog.color.clone(); scene.background = new THREE.Color(0x9aa894); scene.fog.color.set(0x8a9884);
    O.bowls.forEach(b => { b.b.material.emissiveIntensity = 0; b.gl.material.opacity = 0; }); O.dshade.material.emissiveIntensity = 0;
    cam.layers.enable(5); cam.fov = 58; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(-0.35, 1.25, PART + 0.6); cam.lookAt(0.55, 0.85, ZR - 0.6); cam.rotateZ(-0.12); cam.updateMatrixWorld();
    G.blackT = 0; G.black = 0; const pu = post.uniforms; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0;
    renderer.shadowMap.needsUpdate = true; render(0.016);
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; g.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // an expedition print: a little faded and green, with grain
    const d = g.getImageData(0, 0, Wd, Ht);
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
      const i = (y * Wd + x) * 4; let r = d.data[i] / 255, gg = d.data[i + 1] / 255, b = d.data[i + 2] / 255; const l = r * 0.3 + gg * 0.59 + b * 0.11;
      r = lerp(l, r, 0.55); gg = lerp(l, gg, 0.55); b = lerp(l, b, 0.55);
      const dx = x / Wd - 0.5, dy = y / Ht - 0.5, v = 1 - clamp((dx * dx + dy * dy) * 1.8 - 0.1, 0, 1) * 0.5, nz = (Math.random() - 0.5) * 0.07;
      d.data[i] = clamp((r * 0.95 + 0.04 + nz) * v * 255, 0, 255); d.data[i + 1] = clamp((gg * 1.0 + 0.05 + nz) * v * 255, 0, 255); d.data[i + 2] = clamp((b * 0.85 + 0.03 + nz) * v * 255, 0, 255);
    }
    g.putImageData(d, 0, 0);
    url = c.toDataURL('image/jpeg', 0.86);
    cam.layers.mask = saved.lay; cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.updateProjectionMatrix(); updateProj();
    for (const k in lv) L[k].intensity = lv[k]; scene.background = bg; scene.fog.color.copy(fogc); O.world.visible = true;
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- title: the view from the back of a night train ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const Wd = 480, Ht = 270, hx = 250, hy = 118;
  g.fillStyle = '#06070a'; g.fillRect(0, 0, Wd, Ht);
  // the track running away from the tail lamp
  const red = g.createRadialGradient(hx, Ht + 40, 10, hx, Ht, 260); red.addColorStop(0, 'rgba(210,40,20,0.55)'); red.addColorStop(0.5, 'rgba(90,10,6,0.25)'); red.addColorStop(1, 'rgba(20,4,2,0)'); g.fillStyle = red; g.fillRect(0, 0, Wd, Ht);
  const sp = (t * 1.6) % 1;
  for (let k = 0; k < 14; k++) { const u = (k + sp) / 14, z = 1 / (0.06 + u * 0.94); const y = hy + (Ht - hy) / z * 1.0; const w = 260 / z; if (y > Ht + 20) continue; g.fillStyle = `rgba(60,30,20,${0.9 - 0.8 / z})`; g.fillRect(hx - w * 0.75, y, w * 1.5, Math.max(1, 10 / z)); }
  g.strokeStyle = 'rgba(200,190,180,0.55)'; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(hx + s * 4, hy); g.lineTo(hx + s * 150, Ht + 20); g.stroke(); }
  // the cutting on the left, the valley on the right
  g.fillStyle = '#0a0c0e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(hx - 30, hy - 6); g.lineTo(hx - 30, hy + 4); g.lineTo(0, Ht); g.fill();
  // him, small, on the line
  const fl = (Math.sin(t * 0.7) > 0.93) ? 1 : 0.35;
  g.fillStyle = `rgba(210,200,190,${0.55 * fl})`; g.fillRect(hx - 2, hy - 13, 4, 12); g.beginPath(); g.arc(hx, hy - 15, 2.2, 0, TAU); g.fill();
  // rain
  g.strokeStyle = 'rgba(160,170,190,0.25)'; g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = (i * 97 + t * 260) % Wd, y = (i * 53 + t * 420) % Ht; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 9); g.stroke(); }
  // lightning, now and then
  if (Math.sin(t * 0.7) > 0.93) { g.fillStyle = 'rgba(180,200,255,0.12)'; g.fillRect(0, 0, Wd, Ht); }
  // the window frame
  g.strokeStyle = '#2a1a10'; g.lineWidth = 26; g.strokeRect(0, 0, Wd, Ht); g.lineWidth = 10; g.beginPath(); g.moveTo(Wd / 2 + 60, 0); g.lineTo(Wd / 2 + 60, Ht); g.stroke();
  g.fillStyle = 'rgba(255,40,20,0.9)'; g.beginPath(); g.arc(Wd - 70, Ht - 36, 7, 0, TAU); g.fill(); const rg = g.createRadialGradient(Wd - 70, Ht - 36, 0, Wd - 70, Ht - 36, 40); rg.addColorStop(0, 'rgba(255,40,20,0.5)'); rg.addColorStop(1, 'rgba(255,40,20,0)'); g.fillStyle = rg; g.fillRect(Wd - 120, Ht - 86, 100, 100);
}

/* ---------------- build ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x000000, 0.011);
  camera.far = 320; camera.near = 0.03; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.15, ao: 0.85, aoRad: 0.28, bloom: 0.5, bloomThr: 1.4, vig: 0.6, grain: 0.024, sat: 0.9 });
  makeTextures(); makeMaterials(); M.tunnel.side = THREE.DoubleSide;
  buildShell(); buildWindows(); buildRearEnd(); buildFrontEnd(); buildFurniture(); buildDesk(); buildWashroom(); buildFittings(); buildBalcony();
  buildOutside(); buildGuard(); buildWreck(); buildLights();
  // the saloon's outer front face, seen only when it drops away from the train
  const ff = holedGeo(-HW - 0.12, HW + 0.12, -0.9, ROOF_H + 0.1, [[CDOOR.x0 - 0.02, CDOOR.x1 + 0.02, 0, CDOOR.h + 0.02]], 0.02);
  O.frontFace = new THREE.Mesh(ff, std({ map: T.rearFace, roughness: 0.6 })); O.frontFace.position.set(0, 0, ZF - 0.052); O.frontFace.visible = false; O.frontFace.userData.keep = true; scene.add(O.frontFace);
  // shadows: glass, sprites, big shells and the outside don't cast
  scene.traverse(o => { if (o.isMesh) { o.receiveShadow = true; if (o.userData.noShadow || (o.material && (o.material.transparent || o.material === M.teak || o.material === M.ceil))) o.castShadow = false; } });
  O.world.traverse(o => { if (o.isMesh) o.castShadow = false; });
  O.wglass = makeWreckGlass();
  O.reflEye = new THREE.Object3D(); O.reflEye.position.set(0.3, 1.35, ZR); scene.add(O.reflEye);
  O.wreckHide = [O.stable, O.mdrawer, O.sdrawer, ...O.bowls.map(b => b.gl), ...O.bowls.map(b => b.b), ...O.chairs];
  // collisions: walls, the washroom box, furniture
  colliders.length = 0;
  const col = (x0, x1, z0, z1) => addCol('c', x0, x1, z0, z1);
  col(-HW - 1, -HW + 0.02, ZF - 1, ZR + 1); col(HW - 0.02, HW + 1, ZF - 1, ZR + 1);
  O.colFront = col(-HW, HW, ZF - 1, ZF + 0.02); O.colRear = col(-HW, HW, ZR - 0.02, ZR + 1);
  col(-HW, PDOOR.x0, PART - 0.03, PART + 0.03); col(PDOOR.x1, WC.x0 - 0.05, PART - 0.03, PART + 0.03);
  col(WC.x0 - 0.05, WC.x0, PART, WC.dz0); col(WC.x0 - 0.05, WC.x0, WC.dz1, WC.z1); col(WC.x0 - 0.05, HW, WC.z1 - 0.05, WC.z1);
  O.colWc = col(WC.x0 - 0.06, WC.x0, WC.dz0, WC.dz1);
  col(WC.x0, 0.9, PART, PART + 0.42);            // basin
  col(0.82, HW, PART, PART + 0.62);               // lavatory
  col(0.55, HW, ZF, ZF + 0.52);                   // guard's box
  col(-1.2, -0.72, ZF, ZF + 0.12);                // slip gear
  col(POS.umbrella.x - 0.14, HW, POS.umbrella.z - 0.14, PART);
  col(-HW, -HW + 0.66, -2.2, 0.1);                // sofa
  col(-HW, -HW + 0.82, 1.45, 2.65); O.chairs.forEach(c => col(c.position.x - 0.22, c.position.x + 0.22, c.position.z - 0.22, c.position.z + 0.22));
  col(-HW, -HW + 0.56, -3.8, -2.6);               // sideboard
  col(HW - 0.78, HW, -1.72, -0.9);                // armchair
  col(HW - 0.34, HW, 0.72, 1.68);                 // bookcase
  col(DESK.x0 - 0.02, HW, DESK.z0, DESK.z1); col(O.dchair.position.x - 0.22, O.dchair.position.x + 0.22, O.dchair.position.z - 0.22, O.dchair.position.z + 0.22);
  col(-1.02, -0.22, 3.9, 4.6);                    // observation armchair
  col(-0.34, 0.1, 4.33, 4.77);                    // little table
  col(-1.38, -0.9, ZR - 0.55, ZR);                // handbrake
}

/* ---------------- the room module ---------------- */
return {
  id: 'night', title: 'Night Mail', saveKey: 'lethe.roomnight.v2',
  DOCS, ITEMS, HEARD, HINTS, openDoc, inspectItem, titleFx,
  penalty() { G.lockout = G.time + 5; V.dipT = 1.6; after(0.5, () => roofSteps(4, 1, -1)); sayI('The lights stutter. On the roof, right over your head, footsteps.', 3600); },
  markSkip: ['start'], markMerge: {},
  backText: 'Back in the saloon. The train is still climbing.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other actions', 'R T or right-click'], ['Run', 'Shift'], ['Crouch', 'C'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (G.cutscene) return; G.crouch = !G.crouch; G.eyeT = G.crouch ? 0.9 : 1.62; },
  constrain(p) { p.x = clamp(p.x, -HW + 0.24, HW - 0.24); p.z = clamp(p.z, ZF + 0.24, ZR - 0.24); },
  actOverride(i) { if (V.pullReady) { if (i === 0) pullSlip(); return true; } return false; },
  promptOverride() { return V.pullReady ? `<span class="nm">Slip coupling</span><span class="act"><kbd>E</kbd>Pull the release handle</span>` : ''; },
  touchOverride() { return V.pullReady ? [{ label: 'Pull the release handle', run: pullSlip, main: true }] : null; },
  invHidden: id => id === 'booking',
  update: roomUpdate,
  preRender() {
    if (!V.envDone) { V.envDone = true; const hide = [O.wcMirror, O.wglass.root, O.fog]; hide.forEach(o => o.visible = false); if (scene.environment) scene.environment.dispose(); scene.environment = envFromScene(new THREE.Vector3(0, 1.5, 0.5)).texture; hide.forEach(o => o.visible = true); }
    O.wcMirror.userData.update();
    O.wglass.update();
  },
  build() {
    buildRoom(); paintThings(); registerInteractions();
    DOCS.register.bind = () => flag('readIlse');
    [O.mdrawer, O.sdrawer, O.slot, O.drop, O.strap, O.rdoorPivot, O.cdoorPivot, O.brakeWheel, O.slipLever, O.slipKeyIn, O.boxLid, O.boxIn, O.boxLock, O.umb, O.ring, O.tail, O.gang, O.nextDoor, O.wcPivot, O.gToggle, O.stream, O.waterSurf, O.fog, O.world, O.ibolt, O.report, O.winKey, O.hHour, O.hMin, O.register, O.chairs[0], O.chairs[1]].forEach(o => { if (o) o.userData.keep = true; });
    O.fans.forEach(f => f.rot.userData.keep = true);
    O.hHour.rotation.z = -(2 + 40 / 60) / 12 * TAU; O.hMin.rotation.z = -40 / 60 * TAU;
    
    mergeStatic(scene);
  },
  defaults, applyState, startAmbience,
  spawn: { x: 0.45, z: 3.55, yaw: -Math.PI / 2 },
  wake() {
    P.x = 0.3; P.z = 3.55; G.yaw = -Math.PI / 2 + 0.2; G.pitch = -0.28; G.eye = G.eyeT = 1.1;
    G.cutscene = true; $('#fx').className = 'lids'; V.lt = 6;
    after(0.6, () => sClack(-3.8, 0.4));
    after(0.9, () => sayI('You wake with your head on the desk and your neck stiff. The saloon is swaying. Rain is hammering on the roof.', 5600));
    after(2.6, () => tween(1.4, k => { G.eyeT = lerp(1.1, 1.62, k); G.pitch = lerp(-0.28, -0.05, k); }));
    after(4.2, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); sayI('Your phone is dead. The clock on the wall says twenty to three. The train is climbing hard, up into the hills.', 5800); toast(ctrlHint(), 7000); });
  },
  debug: { O, L, V, T, M, S_T0, S_T1, S_H0, S_H1, LOOP, sAt, lapState, endSequence, pullSlip, endFrame, openBox, tryLever, hookKeys, drawerOut, reachSlot, progCount, flashBolt, tunnelIn },
};

})();

