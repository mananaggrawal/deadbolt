const ROOM_ORLOJ = (() => {
/* =====================================================================
   MYSTERY #6 — "THE BLIND HOUR"  ·  inside the Prague astronomical clock, 8 January 2018
   Reworked 9 Oct 2026 to be hands-on: one plain rule (he is blind and hunts by sound; while a bell
   rings he stands still and counts), a bell sign on screen while it is safe to be loud, a body
   (jump, drag the restorers' crate), and physical steps instead of documents and dial maths.
   part A: layout, noise, the clock's lettering (Schwabacher numerals, zodiac signs),
   textures and materials (realistic: limestone, old oak, wrought iron, worn brass, gilding)
   The mechanism room: x -3..3, z -2.6 (the dial wall, facing the square) .. 2.4, floor y 0.
   A wooden loft along the dial wall at y 2.5 holds the apostles' wheel behind its two windows.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {}, D = {};
const BLACK = '"UnifrakturMaguntia", "Old English Text MT", serif', ROMAN = 'Cinzel, "Trajan Pro", Georgia, serif', HAND = 'Caveat, "Segoe Print", cursive', FELL = '"IM Fell English", Georgia, serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';
const RM = { x0: -3.0, x1: 3.0, z0: -2.6, z1: 2.4, spring: 3.2, crown: 4.7 };  // inside faces; a barrel vault runs front to back
const LOFT = { x0: -2.6, x1: 2.3, z0: -2.6, z1: -0.6, y: 2.5 };               // the apostles' loft
const HOUS = { x: -0.4, z: -1.98, r: 0.6, y0: 2.5, h: 0.95 };                  // the drum the apostles stand in
const APW = { y0: 2.7, y1: 3.48, xs: [-0.72, -0.08], w: 0.36 };               // the two apostle windows in the dial wall
const SIDEWIN = { x: 2.25, y0: 1.15, y1: 2.15, w: 0.5 };                       // a small window beside the dial, under the loft (on your right as you face the dial)
const FR = { x0: -1.5, x1: 1.1, z0: -0.25, z1: 0.75, y0: 0.25, y1: 2.05 };     // the clock's iron frame (on a stone plinth)
const LADDER = { x: -1.9, z0: -0.02, z1: -0.62 };
const EYE_LOFT = LOFT.y + 1.42;
const CRATE = { x: 2.3, z: -0.3, w: 0.66, d: 0.5, h: 0.52 };                  // the restorers' crate 3: the crank and the pendulum, nailed shut
const SH = { x0: -2.82, x1: -2.12, z0: 1.5, z1: 2.22 };                        // the weight shaft in the back left corner
const WEIGHT_Y = [-4.2, -0.95];                                               // the strike weight: run right down, and fully wound
const POS = {
  dial: new THREE.Vector3(-0.85, 1.42, FR.z1 + 0.04), knob: new THREE.Vector3(-0.4, 1.18, FR.z1 + 0.05), count: new THREE.Vector3(0.62, 1.4, FR.z1 + 0.04),
  wind: new THREE.Vector3(0.28, 0.82, FR.z1 + 0.05), fly: new THREE.Vector3(0.8, 2.22, 0.3), clutch: new THREE.Vector3(0.12, 2.12, 0.25),
  bell: new THREE.Vector3(0.75, 3.95, 0.25), hammer: new THREE.Vector3(0.75, 3.55, 0.25), frame: new THREE.Vector3(-0.2, 1.3, 0.25),
  cupboard: new THREE.Vector3(-2.95, 1.4, 0.75), lectern: new THREE.Vector3(2.35, 1.1, -1.4), bench: new THREE.Vector3(1.3, 1.0, 2.05), cal: new THREE.Vector3(1.3, 1.78, RM.z1 - 0.01),
  door: new THREE.Vector3(2.98, 1.1, 1.05), death: new THREE.Vector3(-1.75, 1.65, RM.z0 + 0.06), shaft: new THREE.Vector3(-2.45, -1.5, 1.85), dialBack: new THREE.Vector3(-0.2, 1.3, RM.z0 + 0.04),
  housDoor: new THREE.Vector3(HOUS.x, LOFT.y + 0.42, HOUS.z + HOUS.r), crank: new THREE.Vector3(HOUS.x + 0.66, LOFT.y + 0.5, HOUS.z + 0.25), loftMid: new THREE.Vector3(0, LOFT.y + 0.6, -1.4),
  tyn: new THREE.Vector3(-34, 18, -48), square: new THREE.Vector3(0, -8, -30), light: new THREE.Vector3(-2.3, 1.75, 0.95), workbench: new THREE.Vector3(1.3, 0.95, 2.1),
};

/* ---------------- noise ---------------- */
const NP = new Uint8Array(512); { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) NP[i] = p[i & 255]; }
const fade = t => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
  const a = NP[NP[X] + Y] / 255, b = NP[NP[X + 1] + Y] / 255, c = NP[NP[X] + Y + 1] / 255, d = NP[NP[X + 1] + Y + 1] / 255, u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function tnoise(x, y, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => NP[NP[((i % px) + px) % px & 255] + (((j % py) + py) % py & 255)] / 255;
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1), u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += vnoise(x * f, y * f) * a; f *= 2.03; a *= 0.5; } return s; }
function tfbm(x, y, w, h, c, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += tnoise(x / w * c * f, y / h * c * f, c * f, c * f) * a; f *= 2; a *= 0.5; } return s; }
function pix(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y), i = (y * w + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] ?? 255; } g.putImageData(img, 0, 0); return c; }
function tex(c, { srgb = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t; }
function canv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function live(w, h, draw, { srgb = true } = {}) { const c = canv(w, h, draw); const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.userData.canvas = c; t.userData.redraw = fn => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); fn(g, w, h); t.needsUpdate = true; }; return t; }

/* ---------------- the clock's lettering ----------------
   Old Schwabacher digits, as on the clock's outer ring (a "half-eight" 4, a 5 like a hooked h, a 7 like a roof),
   and the twelve signs of the zodiac. Paths are drawn as strokes in a box (digits 60 x 100, signs 100 x 100). */
const DIG = {
  0: 'M30 14 C7 14 7 86 30 86 C53 86 53 14 30 14 Z',
  1: 'M20 24 L33 12 L33 88 M20 88 L46 88',
  2: 'M12 30 C12 10 48 8 47 31 C46 48 24 62 11 88 L50 88',
  3: 'M13 16 L47 16 L27 45 C53 42 55 87 28 89 C18 90 12 85 9 80',
  4: 'M30 52 C8 42 9 12 30 12 C51 12 52 42 30 52 L9 92 M30 52 L51 92',
  5: 'M14 10 L14 54 C15 38 47 34 46 57 L46 90 C46 99 37 101 29 95',
  6: 'M45 15 C20 13 9 50 13 70 C17 93 47 92 47 70 C47 50 18 51 13 66',
  7: 'M8 90 L30 13 L52 90',
  8: 'M30 50 C10 46 10 13 30 13 C50 13 50 46 30 50 C7 54 7 89 30 89 C53 89 53 54 30 50 Z',
  9: 'M46 40 C46 13 14 13 14 33 C14 54 46 54 46 36 L42 70 C38 89 24 93 13 86',
};
const ZOD = [
  { id: 'ari', name: 'Aries', d: 'M22 40 C10 14 42 8 50 40 L50 88 M78 40 C90 14 58 8 50 40' },
  { id: 'tau', name: 'Taurus', d: 'M30 60 A20 20 0 1 0 70 60 A20 20 0 1 0 30 60 M16 16 C28 42 72 42 84 16' },
  { id: 'gem', name: 'Gemini', d: 'M24 18 L76 18 M24 82 L76 82 M40 18 L40 82 M60 18 L60 82' },
  { id: 'can', name: 'Cancer', d: 'M82 32 C62 12 26 14 18 36 M38 36 A9 9 0 1 0 20 36 A9 9 0 1 0 38 36 M18 68 C38 88 74 86 82 64 M80 64 A9 9 0 1 0 62 64 A9 9 0 1 0 80 64' },
  { id: 'leo', name: 'Leo', d: 'M42 62 A12 12 0 1 0 18 62 A12 12 0 1 0 42 62 M42 60 C40 30 50 14 64 16 C82 18 80 40 68 52 C58 64 62 84 82 86' },
  { id: 'vir', name: 'Virgo', d: 'M14 30 L14 80 M14 36 C22 22 32 26 32 38 L32 80 M32 36 C40 22 50 26 50 38 L50 80 M50 44 C70 22 86 52 66 66 C58 74 54 86 66 94' },
  { id: 'lib', name: 'Libra', d: 'M14 82 L86 82 M14 66 L34 66 C22 50 28 30 50 30 C72 30 78 50 66 66 L86 66' },
  { id: 'sco', name: 'Scorpio', d: 'M14 30 L14 80 M14 36 C22 22 32 26 32 38 L32 80 M32 36 C40 22 50 26 50 38 L50 76 C50 88 62 90 74 80 M64 76 L75 80 L73 69' },
  { id: 'sag', name: 'Sagittarius', d: 'M18 84 L82 18 M54 18 L82 18 L82 46 M32 46 L56 70' },
  { id: 'cap', name: 'Capricorn', d: 'M12 26 L28 76 L44 26 L44 70 C44 92 82 92 80 70 C78 54 58 56 58 70 C58 84 50 92 40 90' },
  { id: 'aqu', name: 'Aquarius', d: 'M10 44 L26 30 L42 44 L58 30 L74 44 L90 30 M10 72 L26 58 L42 72 L58 58 L74 72 L90 58' },
  { id: 'pis', name: 'Pisces', d: 'M22 14 C44 34 44 66 22 86 M78 14 C56 34 56 66 78 86 M26 50 L74 50' },
];
const ZLAT = ['ARIES', 'TAVRVS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIVS', 'CAPRICORNVS', 'AQVARIVS', 'PISCES'];
const P2D = {}; const path2d = d => P2D[d] || (P2D[d] = new Path2D(d));
// digits of n, laid out left to right, centred on (cx, cy), h tall
function numLayout(n) { const s = String(n).split(''), w = 60, gap = -2; const tot = s.length * w + (s.length - 1) * gap; return s.map((c, i) => ({ d: DIG[c], x: i * (w + gap) - tot / 2 })); }
function drawNum(g, n, cx, cy, h, col, lw = 9, rot = 0) {
  const k = h / 100; g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(k, k); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const p of numLayout(n)) { g.save(); g.translate(p.x, -50); g.stroke(path2d(p.d)); g.restore(); }
  g.restore();
}
function svgNum(n, cx, cy, h, col, sw = 9, rot = 0) { const k = h / 100; return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k})" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${numLayout(n).map(p => `<path transform="translate(${p.x} -50)" d="${p.d}"/>`).join('')}</g>`; }
function drawZod(g, i, cx, cy, s, col, lw = 7, rot = 0) { const k = s / 100; g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(k, k); g.translate(-50, -50); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(path2d(ZOD[i].d)); g.restore(); }
function svgZod(i, cx, cy, s, col, sw = 7, rot = 0) { const k = s / 100; return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k}) translate(-50 -50)" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="${ZOD[i].d}"/></g>`; }
const ROMAN_N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/* ---------------- time on the dial ----------------
   Angles are clockwise from the top. The Roman ring is the town's 24-hour clock: noon at the top, midnight at the bottom.
   The gold outer ring is her own reckoning, Old Bohemian time: hours counted from sunset. On 8 January the sun sets
   at four, so her 24 sits against IIII in the afternoon, and her hour n is the town's 16 + n. */
const SUNSET = 16;
const angHour = h => (h - 12) * 15 * Math.PI / 180;                 // the town's hour h (0..24)
const angOld = n => (SUNSET + n - 12) * 15 * Math.PI / 180;          // her hour n (1..24)
const oldOf = h => ((h - SUNSET) % 24 + 24) % 24 || 24;              // the town's whole hour -> hers
// the zodiac ring turns with the sun hand so the sun stays in Capricorn; signs run anticlockwise round the ring
const SUN_SIGN = 9, MOON_SIGN = 6;                                   // Capricorn; the Moon at last quarter, in Libra
const zodRingRot = h => angHour(h) + SUN_SIGN * Math.PI / 6;         // ring rotation that puts Capricorn under the sun
const signAngLocal = k => -k * Math.PI / 6;                          // where sign k's centre sits on the unrotated ring

/* ---------------- textures ---------------- */
function makeTextures() {
  // limestone ashlar, courses of about 35 cm, soot higher up and damp low down (512 px = 2 m)
  const courses = []; { let y = 0; while (y < 512) { const h = Math.round(rand(80, 100)); const row = []; let x = -rand(0, 120); while (x < 512) { const w = rand(110, 230); row.push([x, w, rand(0, 1)]); x += w; } courses.push({ y, h, row }); y += h; } }
  const stoneAt = (x, y) => { for (const c of courses) if (y >= c.y && y < c.y + c.h) { for (const b of c.row) { const bx = ((x - b[0]) % 512 + 512) % 512; if (bx < b[1]) return { c, b, lx: bx, ly: y - c.y }; } return { c, b: c.row[0], lx: 0, ly: y - c.y }; } return null; };
  T.stone = tex(pix(512, 512, (x, y) => {
    const s = stoneAt(x, y) || stoneAt(x, 511); const edge = Math.min(s.lx, s.b[1] - s.lx, s.ly, s.c.h - s.ly);
    if (edge < 3) { const m = 120 + tfbm(x, y, 512, 512, 24, 2) * 40; return [m * 0.95, m * 0.9, m * 0.82]; }
    const n = tfbm(x, y, 512, 512, 8, 5), pit = tnoise(x / 2, y / 2, 256, 256) > 0.82 ? 0.82 : 1, tone = s.b[2];
    let c = mixc([168, 156, 136], [198, 186, 162], n * 0.7 + tone * 0.3); c = c.map(v => v * pit * (0.9 + Math.min(1, edge / 14) * 0.1));
    const soot = Math.max(0, tfbm(x * 0.6, y * 0.2, 512, 512, 4, 3) - 0.45) * 0.9; return mixc(c, [62, 56, 50], clamp(soot, 0, 0.55));
  }));
  T.stoneN = heightToNormal(pix(512, 512, (x, y) => { const s = stoneAt(x, y) || stoneAt(x, 511); const edge = Math.min(s.lx, s.b[1] - s.lx, s.ly, s.c.h - s.ly); const v = edge < 3 ? 40 : 150 + (tfbm(x, y, 512, 512, 16, 4) - 0.5) * 120 - Math.max(0, 8 - edge) * 8; return [v, v, v]; }), 2.4);
  T.stoneR = tex(pix(256, 256, (x, y) => { const v = 190 + (tfbm(x, y, 256, 256, 6, 3) - 0.5) * 80; return [v, v, v]; }), { srgb: false });
  // the vault: rough lime plaster, smoke-dark, a few cracks
  T.plaster = tex(pix(512, 512, (x, y) => { const n = tfbm(x, y, 512, 512, 6, 5), st = Math.max(0, tfbm(x * 0.4, y, 512, 512, 3, 4) - 0.42) * 1.1; let c = mixc([176, 168, 152], [204, 196, 180], n); c = mixc(c, [70, 64, 58], clamp(st, 0, 0.7)); const cr = Math.abs(tnoise(x / 30, y / 6, 17, 85) - 0.5) < 0.012 ? 0.55 : 1; return c.map(v => v * cr); }));
  T.plasterN = heightToNormal(pix(256, 256, (x, y) => { const v = 128 + (tfbm(x, y, 256, 256, 12, 4) - 0.5) * 120; return [v, v, v]; }), 1.6);
  // wide oak floorboards, 22 cm, worn pale along the walking line (512 px = 2 m)
  T.oak = tex(pix(512, 512, (x, y) => {
    const pw = 56.3, bi = Math.floor(x / pw), bx = x - bi * pw, seam = bx < 1.6 || bx > pw - 1.2 ? 0.45 : 1, off = (bi * 977) % 512;
    const yy = (y + off) % 512, jn = (yy % 360) < 2 ? 0.5 : 1;
    const gr = Math.pow(Math.abs(Math.sin((bx / pw * 3 + tfbm(bx, yy, 512, 512, 6, 3) * 6 + bi) * Math.PI)), 0.6), k = tnoise(x / 9, yy / 70, 57, 7);
    let c = mixc([88, 62, 40], [132, 98, 64], gr * 0.6 + k * 0.4); const wear = Math.max(0, tfbm(x, y, 512, 512, 3, 3) - 0.5) * 0.6; c = mixc(c, [150, 126, 96], wear);
    return c.map(v => v * seam * jn);
  }));
  T.oakR = tex(pix(256, 256, (x, y) => { const v = 150 + (tfbm(x, y, 256, 256, 8, 3) - 0.5) * 90; return [v, v, v]; }), { srgb: false });
  T.oakN = heightToNormal(pix(256, 256, (x, y) => { const bx = (x % 28.15), v = bx < 1.2 ? 40 : 140 + (tnoise(x / 2, y / 30, 128, 9) - 0.5) * 30; return [v, v, v]; }), 1.2);
  // old dark beam wood: long grain, adze marks, worm holes
  T.wood = tex(pix(256, 512, (x, y) => { const g = Math.abs(Math.sin((x / 256 * 9 + tfbm(x, y, 256, 512, 3, 4) * 5) * Math.PI)); const wh = tnoise(x / 1.5, y / 1.5, 171, 341) > 0.9 ? 0.3 : 1; const c = mixc([46, 32, 22], [86, 62, 42], g * 0.7 + tfbm(x, y, 256, 512, 8, 2) * 0.3); return c.map(v => v * wh); }));
  T.woodN = heightToNormal(pix(128, 256, (x, y) => { const v = 128 + (tnoise(x / 1.4, y / 24, 91, 11) - 0.5) * 90; return [v, v, v]; }), 1.4);
  // painted wood for the apostles' drum and the loft rail: oxblood paint worn through to the wood
  T.paintWood = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 6, 4), wear = tfbm(x + 50, y, 256, 256, 4, 3) > 0.62; return wear ? mixc([70, 50, 34], [100, 74, 50], n) : mixc([92, 26, 22], [128, 40, 32], n); }));
  // wrought iron: black-brown, rust blooms, filed bright where hands have rubbed
  T.iron = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 6, 5), r = Math.max(0, tfbm(x + 77, y + 13, 256, 256, 4, 4) - 0.52) * 2.2; let c = mixc([30, 28, 26], [52, 48, 44], n); c = mixc(c, [104, 52, 26], clamp(r, 0, 0.75)); return c; }));
  T.ironR = tex(pix(256, 256, (x, y) => { const r = Math.max(0, tfbm(x + 77, y + 13, 256, 256, 4, 4) - 0.52) * 2.2; const v = 120 + r * 120 + (tfbm(x, y, 256, 256, 10, 3) - 0.5) * 40; return [v, v, v]; }), { srgb: false });
  // worn brass: tarnish in the hollows, rubbed bright on the edges
  T.brassC = tex(pix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 5, 4), t = Math.max(0, tfbm(x + 31, y + 9, 256, 256, 3, 4) - 0.45) * 1.6; return mixc([226, 184, 108], [96, 80, 52], clamp(t + n * 0.2, 0, 0.8)); }));
  T.brassR = tex(pix(256, 256, (x, y) => { const t = Math.max(0, tfbm(x + 31, y + 9, 256, 256, 3, 4) - 0.45) * 1.6; const v = 70 + t * 150 + (tnoise(x / 1.2, y / 18, 213, 14) - 0.5) * 40; return [v, v, v]; }), { srgb: false });
  // gilding: leaf joins and a little wear
  T.gold = tex(pix(256, 256, (x, y) => { const j = (x % 64 < 1 || y % 64 < 1) ? 0.85 : 1, n = tfbm(x, y, 256, 256, 6, 3), w = tfbm(x + 9, y, 256, 256, 3, 3) > 0.66 ? 0.6 : 1; return mixc([240, 200, 120], [200, 150, 70], n).map(v => v * j * w); }));
  T.glow = tex(canv(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  T.dust = tex(canv(32, 32, (g, w, h) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,250,240,0.9)'); gr.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  T.cobweb = tex(canv(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(220,220,214,0.35)'; g.lineWidth = 0.8; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 0.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 250, Math.sin(a) * 250); g.stroke(); } for (let r = 20; r < 250; r += rand(14, 26)) { g.beginPath(); for (let i = 0; i <= 9; i++) { const a = i / 9 * Math.PI * 0.5, rr = r + rand(-4, 4); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i) g.quadraticCurveTo(Math.cos(a - 0.08) * rr * 0.94, Math.sin(a - 0.08) * rr * 0.94, x, y); else g.moveTo(x, y); } g.stroke(); } }));
}

/* ---------------- materials ---------------- */
function std(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.5 }, o)); }
function phys(o) { return new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.5 }, o)); }
function makeMaterials() {
  M.stone = std({ map: T.stone, normalMap: T.stoneN, normalScale: new THREE.Vector2(1.1, 1.1), roughnessMap: T.stoneR, roughness: 0.95 });
  M.stoneDark = std({ map: T.stone, color: 0x8a847a, normalMap: T.stoneN, roughness: 0.95 });
  M.plaster = std({ map: T.plaster, normalMap: T.plasterN, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.96, side: THREE.DoubleSide });
  M.oak = phys({ map: T.oak, roughnessMap: T.oakR, normalMap: T.oakN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.75, clearcoat: 0.12, clearcoatRoughness: 0.6 });
  M.wood = std({ map: T.wood, normalMap: T.woodN, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.8 });
  M.paintWood = std({ map: T.paintWood, normalMap: T.woodN, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.7 });
  M.iron = std({ map: T.iron, roughnessMap: T.ironR, metalness: 0.7, roughness: 0.75, envMapIntensity: 0.6 });
  M.ironBlack = std({ color: 0x1c1b1a, metalness: 0.6, roughness: 0.6, envMapIntensity: 0.5 });
  M.brass = std({ map: T.brassC, roughnessMap: T.brassR, metalness: 1, roughness: 0.45, envMapIntensity: 1.0 });
  M.brassBright = std({ color: 0xe8c47a, metalness: 1, roughness: 0.25, envMapIntensity: 1.1 });
  M.steel = std({ color: 0x9a9894, metalness: 1, roughness: 0.38, envMapIntensity: 0.9 });
  M.gold = std({ map: T.gold, metalness: 1, roughness: 0.32, envMapIntensity: 1.1 });
  M.bronze = std({ color: 0x6a4a2a, metalness: 1, roughness: 0.42, envMapIntensity: 0.9 });
  M.black = std({ color: 0x0b0a0a, roughness: 0.7 });
  M.rope = std({ color: 0x5a4a34, roughness: 0.95 });
  M.cable = std({ color: 0x3a3836, metalness: 0.7, roughness: 0.45 });
  M.glass = std({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.12, envMapIntensity: 0.6, depthWrite: false });
  M.glassOld = std({ color: 0x9aa8a4, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.32, envMapIntensity: 0.7, depthWrite: false });
  M.lead = std({ color: 0x2a2a2c, metalness: 0.6, roughness: 0.55 });
  M.paper = std({ color: 0xe8e2d2, roughness: 0.9 });
  M.cloth = std({ color: 0x3a3632, roughness: 0.98 });
  M.plastic = std({ color: 0x1a1c1e, roughness: 0.45 });
  M.yellow = std({ color: 0xd8a018, roughness: 0.5 });
  M.ledPanel = std({ color: 0xf0f4ff, roughness: 0.4, emissive: new THREE.Color(0xeaf0ff), emissiveIntensity: 1.6 });
  M.skin = std({ color: 0xc8a888, roughness: 0.62 });
  M.glowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffd8a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 });
  M.dustS = new THREE.SpriteMaterial({ map: T.dust, color: 0xfff4e0, transparent: true, depthWrite: false, opacity: 0.0, blending: THREE.AdditiveBlending });
  M.web = std({ map: T.cobweb, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1 });
  M.snowS = new THREE.SpriteMaterial({ map: T.dust, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0.85 });
}

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
function frameGeo(w, h, iw, ih, d, b = 0.006) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  const hole = new THREE.Path(); hole.moveTo(-iw / 2, -ih / 2); hole.lineTo(-iw / 2, ih / 2); hole.lineTo(iw / 2, ih / 2); hole.lineTo(iw / 2, -ih / 2); hole.closePath(); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - b), bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 2, curveSegments: 1 });
}
function uvScale(g, su, sv, ou = 0, ov = 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov); uv.needsUpdate = true; return g; }
// a flat wall with holes (rectangles [u0,u1,v0,v1], or arched ones with a 5th value = arch rise); shape in (u, v), extruded d, UVs in metres
function holedGeo(u0, u1, v0, v1, holes, d) {
  const s = new THREE.Shape(); s.moveTo(u0, v0); s.lineTo(u1, v0); s.lineTo(u1, v1); s.lineTo(u0, v1); s.closePath();
  for (const [a, b, c, e, arch] of holes) { const hp = new THREE.Path(); hp.moveTo(a, c); if (arch) { hp.lineTo(a, e - arch); hp.quadraticCurveTo(a, e, (a + b) / 2, e); hp.quadraticCurveTo(b, e, b, e - arch); } else { hp.lineTo(a, e); hp.lineTo(b, e); } hp.lineTo(b, c); hp.closePath(); s.holes.push(hp); }
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 8 });
}
function wallPlane(w, h, mat, s = 1, parent = scene) { const g = new THREE.PlaneGeometry(w, h); uvScale(g, w / s, h / s); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; parent.add(m); return m; }
function mergeGroup(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), kill = [];
  const kept = o => { for (let p = o; p && p !== root; p = p.parent) if (p.userData.keep) return true; return false; };
  root.traverse(o => {
    if (!o.isMesh || o.userData.iid || o.layers.mask !== 1 || !o.visible || kept(o) || o.material.isShaderMaterial || Array.isArray(o.material) || o.userData.hit || o.isInstancedMesh) return;
    const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    buckets.get(key).geos.push(g); kill.push(o);
  });
  kill.forEach(o => o.parent && o.parent.remove(o));
  for (const b of buckets.values()) {
    const out = new THREE.BufferGeometry();
    for (const a of ['position', 'normal', 'uv']) {
      if (!b.geos.every(g => g.attributes[a])) continue;
      const size = b.geos[0].attributes[a].itemSize, total = b.geos.reduce((s, g) => s + g.attributes[a].count, 0), arr = new Float32Array(total * size);
      let off = 0; for (const g of b.geos) { arr.set(g.attributes[a].array, off); off += g.attributes[a].count * size; }
      out.setAttribute(a, new THREE.BufferAttribute(arr, size));
    }
    const m = new THREE.Mesh(out, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.userData.noRay = !!root.userData.noRayMerged; root.add(m);
  }
}
const m4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
function mergeParts(parts) {
  const pos = [], nor = [], col = [], uv = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
}
// a toothed wheel lying in the XY plane, axis along z: r is the pitch radius, n teeth, d thick; spokes leave holes in big wheels
function gearGeo(r, n, d, { hub = 0.18, spokes = 0, rim = 0.16, tooth = null } = {}) {
  const th = tooth || Math.min(0.03, r * 0.11), s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 0.5) / n * TAU, aw = TAU / n;
    const pts = [[r - th * 0.6, a0], [r - th * 0.6, a0 + aw * 0.1], [r + th * 0.5, a0 + aw * 0.2], [r + th * 0.5, a0 + aw * 0.45], [r - th * 0.6, a0 + aw * 0.55]];
    pts.forEach(([rr, a], k) => { const x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); });
  }
  s.closePath();
  if (spokes) {
    const rin = r * (1 - rim) - th, rh = r * hub;
    for (let k = 0; k < spokes; k++) {
      const a0 = k / spokes * TAU + 0.12, a1 = (k + 1) / spokes * TAU - 0.12, h = new THREE.Path();
      h.moveTo(Math.cos(a0) * rh * 1.3, Math.sin(a0) * rh * 1.3); h.absarc(0, 0, rin, a0 + 0.04, a1 - 0.04, false); h.lineTo(Math.cos(a1) * rh * 1.3, Math.sin(a1) * rh * 1.3); h.closePath(); s.holes.push(h);
    }
  }
  const hole = new THREE.Path(); hole.absarc(0, 0, Math.max(0.006, r * 0.05), 0, TAU, true); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: Math.min(0.002, d * 0.2), bevelSize: Math.min(0.002, th * 0.2), bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -d / 2); return g;
}
// a hit box needs the whole chain of parents placed first, or it lands in the wrong frame
function hb(id, obj, pad) { obj.updateWorldMatrix(true, true); return hitbox(id, obj, pad); }
function gear(r, n, d, mat, x, y, z, parent = scene, o = {}) { const m = mesh(gearGeo(r, n, d, o), mat, x, y, z, parent); return m; }

/* =====================================================================
   THE BLIND HOUR · part B: the mechanism room (walls, vault, floor, loft, ladder, windows,
   the keepers' cupboard and lectern, the restorers' bench, the weight shaft, the stair door),
   the clock itself (frame, trains, dials, count wheel, fly, bell) and the apostles' drum
   ===================================================================== */
function vaultY(x) { const R = 3.75, cy = RM.crown - R; return cy + Math.sqrt(Math.max(0, R * R - x * x)); }
function gableShape() {
  const R = 3.75, cy = RM.crown - R, a = Math.atan2(RM.spring - cy, RM.x1);
  const s = new THREE.Shape(); s.moveTo(RM.x0 - 0.4, -0.3); s.lineTo(RM.x1 + 0.4, -0.3); s.lineTo(RM.x1 + 0.4, RM.spring); s.lineTo(RM.x1, RM.spring); s.absarc(0, cy, R, a, Math.PI - a, false); s.lineTo(RM.x0 - 0.4, RM.spring); s.closePath(); return s;
}
function buildShell() {
  O.shell = grp(0, 0, 0);
  const g = O.shell;
  // floor, with the weight shaft cut out of the back left corner
  const fg = holedGeo(RM.x0, RM.x1, -RM.z1, -RM.z0, [[SH.x0, SH.x1, -SH.z1, -SH.z0]], 0.06); uvScale(fg, 0.5, 0.5); fg.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(fg, M.oak); floor.position.y = -0.06; floor.receiveShadow = true; g.add(floor);
  // the dial wall (front) and the back wall: gables under the vault
  const holesF = [[SIDEWIN.x - SIDEWIN.w / 2, SIDEWIN.x + SIDEWIN.w / 2, SIDEWIN.y0, SIDEWIN.y1, 0.25], ...APW.xs.map(x => [x - APW.w / 2, x + APW.w / 2, APW.y0, APW.y1, 0.18])];
  const front = new THREE.Shape(); front.copy(gableShape());
  for (const [a, b, c, e, arch] of holesF) { const hp = new THREE.Path(); hp.moveTo(a, c); hp.lineTo(a, e - arch); hp.quadraticCurveTo(a, e, (a + b) / 2, e); hp.quadraticCurveTo(b, e, b, e - arch); hp.lineTo(b, c); hp.closePath(); front.holes.push(hp); }
  const fgeo = new THREE.ExtrudeGeometry(front, { depth: 0.45, bevelEnabled: false, curveSegments: 24 }); uvScale(fgeo, 0.5, 0.5);
  O.frontWall = new THREE.Mesh(fgeo, M.stone); O.frontWall.position.z = RM.z0 - 0.45; O.frontWall.receiveShadow = true; O.frontWall.castShadow = true; g.add(O.frontWall);
  const bgeo = new THREE.ExtrudeGeometry(gableShape(), { depth: 0.45, bevelEnabled: false, curveSegments: 24 }); uvScale(bgeo, 0.5, 0.5);
  const back = new THREE.Mesh(bgeo, M.stone); back.position.z = RM.z1; back.receiveShadow = true; g.add(back);
  // side walls; the right one has the stair door in it
  const DOORZ = { z0: 0.6, z1: 1.5, h: 2.05 };
  // (shape u runs along z for the left wall, along -z for the right; both are extruded outwards from their inner face)
  const lw = new THREE.Mesh(uvScale(holedGeo(RM.z0, RM.z1, -0.1, RM.spring, [], 0.4), 0.5, 0.5), M.stone); lw.rotation.y = -Math.PI / 2; lw.position.x = RM.x0; lw.receiveShadow = true; g.add(lw);
  const rw = new THREE.Mesh(uvScale(holedGeo(-RM.z1, -RM.z0, -0.1, RM.spring, [[-DOORZ.z1, -DOORZ.z0, -0.1, DOORZ.h, 0.12]], 0.4), 0.5, 0.5), M.stone); rw.rotation.y = Math.PI / 2; rw.position.x = RM.x1; rw.receiveShadow = true; g.add(rw);
  // the vault: a segment of a cylinder whose axis runs front to back
  {
    const R = 3.75, cy = RM.crown - R, a = Math.asin(RM.x1 / R), nu = 28, nz = 10, pos = [], nor = [], uv = [], idx = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nu; i++) { const p = -a + 2 * a * i / nu, z = RM.z0 + (RM.z1 - RM.z0) * j / nz; pos.push(R * Math.sin(p), cy + R * Math.cos(p), z); nor.push(-Math.sin(p), -Math.cos(p), 0); uv.push(R * p / 2.2, z / 2.2); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nu; i++) { const k = j * (nu + 1) + i; idx.push(k, k + 1, k + nu + 1, k + 1, k + nu + 2, k + nu + 1); }
    const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); vg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); vg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); vg.setIndex(idx);
    const v = new THREE.Mesh(vg, M.plaster); v.receiveShadow = true; g.add(v);
    // a stone string course where the vault springs
    for (const sx of [-1, 1]) bev(0.16, 0.14, RM.z1 - RM.z0, M.stoneDark, sx * (RM.x1 - 0.06), RM.spring - 0.04, (RM.z0 + RM.z1) / 2, g, 0.02);
    // two old tie beams across the vault
    for (const z of [0.9, 2.0]) { bev(RM.x1 - RM.x0, 0.2, 0.22, M.wood, 0, RM.spring + 0.25, z, g, 0.015); }
  }
  // the stair door: oak planks, iron straps, a big lock
  O.door = grp(RM.x1 - 0.12, 0, (DOORZ.z0 + DOORZ.z1) / 2, g);
  for (let i = 0; i < 5; i++) bev(0.06, DOORZ.h - 0.06, (DOORZ.z1 - DOORZ.z0) / 5 - 0.004, M.wood, 0, (DOORZ.h - 0.06) / 2, -0.36 + i * 0.18, O.door, 0.006);
  for (const y of [0.35, 1.0, 1.7]) bev(0.075, 0.06, DOORZ.z1 - DOORZ.z0 - 0.04, M.ironBlack, -0.01, y, 0, O.door, 0.006);
  O.doorLock = grp(-0.05, 1.02, -0.3, O.door); bev(0.04, 0.2, 0.16, M.iron, 0, 0, 0, O.doorLock, 0.008); cyl(0.012, 0.012, 0.05, M.black, -0.022, -0.04, 0, O.doorLock, 8).rotation.z = Math.PI / 2;
  O.doorRing = grp(-0.06, 1.0, -0.15, O.door); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 20), M.ironBlack); ring.rotation.y = Math.PI / 2; O.doorRing.add(ring);
  bev(0.1, 0.06, DOORZ.z1 - DOORZ.z0 + 0.12, M.stoneDark, 0.02, DOORZ.h + 0.03, 0, O.door, 0.01);
  hb('door', O.door, 0.03);
  // the side window by the dial: leaded diamonds, deep in the wall
  O.sideWin = grp(SIDEWIN.x, 0, RM.z0 - 0.3, g);
  const swp = []; { const w = SIDEWIN.w, h = SIDEWIN.y1 - SIDEWIN.y0; const gl = plane(w, h, M.glassOld, 0, (SIDEWIN.y0 + SIDEWIN.y1) / 2, 0, 0, O.sideWin); gl.userData.noRay = true; gl.renderOrder = 2; for (let i = -3; i <= 3; i++) { const l = bev(0.008, h * 1.5, 0.01, M.lead, i * 0.1, (SIDEWIN.y0 + SIDEWIN.y1) / 2, 0.005, O.sideWin, 0.002); l.rotation.z = 0.7; const l2 = bev(0.008, h * 1.5, 0.01, M.lead, i * 0.1, (SIDEWIN.y0 + SIDEWIN.y1) / 2, 0.005, O.sideWin, 0.002); l2.rotation.z = -0.7; swp.push(l, l2); } }
  // the clip so the lead strips stay inside the window: a mask of wall around it, drawn after
  O.sideWin.children.forEach(c => { if (c !== swp[0]) c.userData.noRay = true; });
  { const sill = bev(SIDEWIN.w + 0.1, 0.05, 0.36, M.stoneDark, SIDEWIN.x, SIDEWIN.y0 - 0.02, RM.z0 - 0.16, g, 0.01); }
  hb('sidewin', O.sideWin, 0.02);
  // apostle window reveals and frames (the shutters are outside, part C)
  O.apwFrames = APW.xs.map(x => { const f = grp(x, 0, RM.z0 - 0.02, g); bev(APW.w + 0.08, 0.06, 0.06, M.wood, 0, APW.y0 - 0.03, 0, f, 0.008); for (const sx of [-1, 1]) bev(0.05, APW.y1 - APW.y0, 0.06, M.wood, sx * (APW.w / 2 + 0.02), (APW.y0 + APW.y1) / 2, 0, f, 0.006); return f; });
  // cobwebs in the corners
  for (const [x, y, z, ry, s] of [[RM.x0 + 0.02, RM.spring - 0.2, RM.z1 - 0.02, Math.PI / 2, 0.8], [RM.x1 - 0.02, RM.spring - 0.1, RM.z0 + 0.02, -Math.PI / 2, 0.6], [RM.x1 - 0.02, 2.1, RM.z1 - 0.02, Math.PI, 0.5], [-1.6, LOFT.y - 0.12, -0.62, 0, 0.5]]) { const w = plane(s, s, M.web, x, y, z, ry, g); w.rotation.z = Math.PI; w.userData.noRay = true; w.castShadow = false; }
  buildLoft(); buildShaft(SH); buildFurniture(); buildCrate();
}

/* ---------------- the loft and the ladder ---------------- */
function buildLoft() {
  O.loft = grp(0, 0, 0);
  const g = O.loft, { x0, x1, z0, z1, y } = LOFT;
  const fl = bev(x1 - x0, 0.09, z1 - z0, M.oak, (x0 + x1) / 2, y - 0.045, (z0 + z1) / 2, g, 0.01); uvScale(fl.geometry, 0.5, 0.5);
  for (const z of [-2.2, -1.5, -0.8]) bev(x1 - x0, 0.16, 0.12, M.wood, (x0 + x1) / 2, y - 0.17, z, g, 0.012);
  for (const x of [-1.25, 1.55]) { bev(0.16, y - 0.09, 0.16, M.wood, x, (y - 0.09) / 2, z1 - 0.08, g, 0.012); const br = bev(0.08, 0.7, 0.08, M.wood, x + (x < 0 ? 0.25 : -0.25), y - 0.45, z1 - 0.08, g, 0.008); br.rotation.z = x < 0 ? -0.75 : 0.75; }
  // the rail along the open edge, with a gap for the ladder
  const rail = (a, b) => { bev(b - a, 0.05, 0.05, M.wood, (a + b) / 2, y + 0.9, z1 - 0.03, g, 0.006); for (let x = a + 0.02; x <= b; x += 0.4) bev(0.04, 0.9, 0.04, M.wood, x, y + 0.45, z1 - 0.03, g, 0.005); };
  rail(x0 + 0.1, LADDER.x - 0.32); rail(LADDER.x + 0.3, x1);
  // the ladder: two rails and rungs, leaning against the loft edge, standing proud of it by a hand's height
  O.ladder = grp(LADDER.x, 0, 0, g);
  const len = Math.hypot(LOFT.y + 0.9, LADDER.z0 - LADDER.z1), ang = Math.atan2(LADDER.z0 - LADDER.z1, LOFT.y + 0.9);
  const lg = grp(0, 0, LADDER.z0, O.ladder); lg.rotation.x = -ang;
  for (const sx of [-1, 1]) bev(0.05, len, 0.07, M.wood, sx * 0.19, len / 2, 0, lg, 0.008);
  for (let i = 1; i < 12; i++) { const r = cyl(0.016, 0.016, 0.38, M.wood, 0, i * len / 12, 0, lg, 8); r.rotation.z = Math.PI / 2; }
  hb('ladder', O.ladder, 0.05);
  O.loftEdgeHit = box(0.62, 1.0, 0.42, HITMAT, LADDER.x, LOFT.y + 0.5, LOFT.z1 - 0.21, g); O.loftEdgeHit.layers.set(2);
  buildDrum();
}

/* ---------------- the apostles' drum and wheel ---------------- */
// in the order they come round: the restorers tagged them A1 to A12
const APOSTLES = [
  { tag: 'A1', name: 'St James the Less', attr: 'club', robe: 0x6a3a2a, cloak: 0x2a3a5a, look: 'a heavy wooden club, a fuller\'s bat, over his shoulder. A blue cloak' },
  { tag: 'A2', name: 'St Peter', attr: 'keys', robe: 0xd8c8a0, cloak: 0x8a1a18, look: 'two gilded keys in his right hand. Grey curls, a gold-yellow robe and a red cloak' },
  { tag: 'A3', name: 'St Andrew', attr: 'xcross', robe: 0x3a5a3a, cloak: 0x6a5a3a, look: 'a big X-shaped cross of two crossed beams behind him' },
  { tag: 'A4', name: 'St Matthias', attr: 'axe', robe: 0x5a2a4a, cloak: 0xc8b890, look: 'an axe, its long handle over his shoulder and the blade above his head' },
  { tag: 'A5', name: 'St Thaddeus', attr: 'halberd', robe: 0x2a4a6a, cloak: 0x8a6a2a, look: 'a halberd, a tall pole with a spike and a broad axe blade at the top' },
  { tag: 'A6', name: 'St Philip', attr: 'cross', robe: 0x8a5a2a, cloak: 0x2a4a3a, look: 'a tall thin cross on a staff, higher than his head' },
  { tag: 'A7', name: 'St Thomas', attr: 'spear', robe: 0x2a5a3a, cloak: 0x9a7a3a, look: 'a long spear, its point well above his head, resting against his shoulder. A green robe' },
  { tag: 'A8', name: 'St Paul', attr: 'sword', robe: 0xa8302a, cloak: 0x3a3a5a, look: 'a sword held upright in front of him, the blade rising past his face. A red robe' },
  { tag: 'A9', name: 'St John', attr: 'chalice', robe: 0x9a2a2a, cloak: 0x4a7a4a, look: 'a little gold chalice in his hand. Long fair hair, no beard, a red robe' },
  { tag: 'A10', name: 'St Simon', attr: 'saw', robe: 0x4a4a6a, cloak: 0xa87a4a, look: 'a big two-handed saw held across him, its toothed blade sticking out on both sides' },
  { tag: 'A11', name: 'St Barnabas', attr: 'scroll', robe: 0x5a6a3a, cloak: 0x7a2a3a, look: 'a rolled scroll in his hand. A bald crown, a green robe' },
  { tag: 'A12', name: 'St Bartholomew', attr: 'knife', robe: 0x7a4a2a, cloak: 0x3a5a6a, look: 'a short knife in one hand, and something pale and loose, like an empty skin, over his other arm' },
];
const AP_R = 0.43, AP_N = 12;
function buildDrum() {
  const { x, z, r, y0, h } = HOUS;
  O.drum = grp(x, y0, z, O.loft);
  // the drum wall: painted boards round a circle, open towards the two windows and with a little door at the back
  const N = 28;
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) / N * TAU, sx = Math.sin(a), cz = Math.cos(a);
    // a = 0 points to +z (the back, towards the room); the windows are at about a = pi +- 0.56
    const toFront = Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI)));
    if (toFront < 0.92) continue;                                 // open at the front: the windows look in here
    if (Math.abs(Math.atan2(sx, cz)) < 0.3) { // the access door at the back: a lintel above it only
      const b = bev(0.14, h - 0.78, 0.03, M.paintWood, sx * r, h - (h - 0.78) / 2, cz * r, O.drum, 0.004); b.rotation.y = a; continue;
    }
    const b = bev(r * TAU / N + 0.004, h, 0.03, M.paintWood, sx * r, h / 2, cz * r, O.drum, 0.004); b.rotation.y = a;
  }
  // rim mouldings, the floor ring and a lid
  const rimG = new THREE.TorusGeometry(r + 0.01, 0.02, 6, 40); for (const yy of [0.02, h]) { const t = new THREE.Mesh(rimG, M.wood); t.rotation.x = Math.PI / 2; t.position.y = yy; O.drum.add(t); }
  const lid = cyl(r + 0.03, r + 0.03, 0.03, M.wood, 0, h + 0.02, 0, O.drum, 40);
  // the door frame, a hand-painted number and the restorers' tape across the lintel
  for (const s of [-1, 1]) { const p = bev(0.035, 0.74, 0.04, M.wood, Math.sin(s * 0.3) * (r + 0.01), 0.37, Math.cos(s * 0.3) * (r + 0.01), O.drum, 0.004); p.rotation.y = s * 0.3; }
  // the wheel: a turntable on a vertical axle
  O.wheel = grp(0, 0.05, 0, O.drum);
  cyl(0.52, 0.52, 0.03, M.wood, 0, 0, 0, O.wheel, 40);
  cyl(0.03, 0.03, h - 0.1, M.iron, 0, (h - 0.1) / 2, 0, O.wheel, 10);
  O.aps = [];
  APOSTLES.forEach((ap, i) => {
    const a = i / AP_N * TAU, f = apostle(ap); f.position.set(Math.sin(a) * AP_R, 0.015, Math.cos(a) * AP_R); f.rotation.y = a; O.wheel.add(f); O.aps.push(f);
    f.userData.tag = ap.tag;
  });
  // the thirteenth: not on the wheel, a gap where nothing should stand. He is put there for one look (part E)
  // the crank on the right of the drum: a spoked handwheel and an iron pawl on a ratchet
  O.crank = grp(r + 0.06, 0.5, 0.25, O.drum);
  const hw = grp(0, 0, 0, O.crank); hw.rotation.z = Math.PI / 2;
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 8, 28), M.wood); t.rotation.x = Math.PI / 2; hw.add(t);
  for (let i = 0; i < 6; i++) { const s = bev(0.016, 0.3, 0.02, M.wood, 0, 0, 0, hw, 0.004); s.rotation.y = i / 6 * Math.PI; s.rotation.x = Math.PI / 2; }
  cyl(0.03, 0.03, 0.06, M.iron, 0, 0, 0, hw, 12);
  const knob = cyl(0.014, 0.012, 0.08, M.wood, 0, 0.16, 0.04, hw, 8); knob.rotation.x = Math.PI / 2;
  O.crankWheel = hw;
  O.pawl = bev(0.02, 0.012, 0.09, M.iron, -0.01, -0.1, 0.12, O.crank, 0.003);
  hb('crank', O.crank, 0.05);
  O.housDoorHit = box(0.36, 0.72, 0.1, HITMAT, 0, 0.4, r + 0.02, O.drum); O.housDoorHit.layers.set(2);
  // the shaft that brings the clock's drive up to the wheel, under the loft floor, with a bevel gear
  tube([[POS.clutch.x, POS.clutch.y + 0.06, POS.clutch.z], [POS.clutch.x, 2.2, POS.clutch.z], [POS.clutch.x, 2.2, -0.6], [POS.clutch.x, 2.2, z]], 0.012, M.iron, scene, 24, 6);
  tube([[POS.clutch.x, 2.2, z], [x, 2.2, z]], 0.012, M.iron, scene, 8, 6);
  gear(0.05, 14, 0.015, M.brass, x, 2.38, z, scene).rotation.x = Math.PI / 2;
}
// a carved, painted apostle, about 60 cm, facing +z (outwards from the wheel): robe, cloak, head, halo, and what he carries
function apostle(ap) {
  const root = new THREE.Group(), parts = [], add = (geo, color, m) => parts.push({ geo, color, m });
  const L2 = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  add(L2([[0.001, 0], [0.095, 0], [0.1, 0.03], [0.085, 0.2], [0.07, 0.36], [0.06, 0.44], [0.001, 0.45]]), ap.robe, m4(0, 0, 0, 0, 0, 0, 1, 1, 0.7));
  add(L2([[0.001, 0.05], [0.1, 0.06], [0.09, 0.25], [0.075, 0.4], [0.05, 0.46], [0.001, 0.47]], 14), ap.cloak, m4(0, 0, -0.012, 0, 0, 0, 1.05, 1, 0.62));
  add(new THREE.SphereGeometry(0.048, 14, 10), 0xb48a66, m4(0, 0.5, 0.008, 0, 0, 0, 0.9, 1.1, 0.95));
  for (const sx of [-1, 1]) { add(new THREE.SphereGeometry(0.0075, 8, 6), 0x1a120c, m4(sx * 0.017, 0.512, 0.05)); add(new THREE.BoxGeometry(0.02, 0.004, 0.006), 0x3a2416, m4(sx * 0.017, 0.524, 0.05, 0, 0, sx * -0.2)); }
  add(new THREE.ConeGeometry(0.008, 0.022, 6), 0xa07a58, m4(0, 0.498, 0.054, Math.PI / 2 + 0.3, 0, 0));
  const hair = { A2: 0xb8b0a0, A9: 0xc8a050, A11: 0x8a6a4a }[ap.tag] ?? 0x3a2a1a;
  add(new THREE.SphereGeometry(0.052, 12, 8, 0, TAU, 0, Math.PI * 0.62), hair, m4(0, 0.51, -0.006, -0.25, 0, 0));
  if (ap.tag !== 'A9') add(new THREE.SphereGeometry(0.036, 10, 6, 0, TAU, Math.PI * 0.45, Math.PI * 0.4), hair, m4(0, 0.47, 0.02, 0.1, 0, 0));   // beard
  add(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 24), 0xd8b050, m4(0, 0.52, -0.06, Math.PI / 2, 0, 0));                              // halo behind the head
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.022, 0.018, 0.2, 8), ap.robe, m4(sx * 0.07, 0.32, 0.04, -0.7, 0, sx * 0.2)); // forearms forward
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.018, 8, 6), 0xb48a66, m4(sx * 0.075, 0.27, 0.11));
  const wood = 0x6a4a2a, iron = 0x9a9a98, gold = 0xd8b050;
  const A = {
    club: () => { add(new THREE.CylinderGeometry(0.018, 0.009, 0.4, 8), wood, m4(0.08, 0.5, -0.02, 0.4, 0, -0.2)); },
    keys: () => { for (const k of [-1, 1]) { add(new THREE.BoxGeometry(0.012, 0.11, 0.006), gold, m4(0.075 + k * 0.012, 0.25, 0.13, 0, 0, k * 0.3)); add(new THREE.TorusGeometry(0.016, 0.004, 6, 10), gold, m4(0.075 + k * 0.022, 0.31, 0.13, 0, 0, 0)); } },
    xcross: () => { for (const k of [-1, 1]) add(new THREE.BoxGeometry(0.03, 0.62, 0.025), wood, m4(0, 0.33, -0.08, 0, 0, k * 0.75)); },
    axe: () => { add(new THREE.CylinderGeometry(0.009, 0.009, 0.5, 6), wood, m4(0.08, 0.42, -0.03, 0.25, 0, -0.15)); add(new THREE.BoxGeometry(0.07, 0.06, 0.008), iron, m4(0.11, 0.66, -0.09, 0.25, 0, -0.15)); },
    halberd: () => { add(new THREE.CylinderGeometry(0.008, 0.008, 0.82, 6), wood, m4(0.09, 0.44, 0.0)); add(new THREE.BoxGeometry(0.008, 0.09, 0.07), iron, m4(0.09, 0.82, 0.03)); add(new THREE.ConeGeometry(0.01, 0.08, 6), iron, m4(0.09, 0.9, 0.0)); },
    cross: () => { add(new THREE.CylinderGeometry(0.007, 0.007, 0.82, 6), wood, m4(-0.09, 0.44, 0.0)); add(new THREE.BoxGeometry(0.12, 0.012, 0.012), wood, m4(-0.09, 0.76, 0.0)); },
    spear: () => { add(new THREE.CylinderGeometry(0.007, 0.007, 0.92, 6), wood, m4(0.07, 0.5, -0.03, 0.12, 0, -0.08)); add(new THREE.ConeGeometry(0.014, 0.09, 6), iron, m4(0.1, 0.99, -0.09, 0.12, 0, -0.08)); },
    sword: () => { add(new THREE.BoxGeometry(0.018, 0.42, 0.006), iron, m4(0.08, 0.5, 0.06)); add(new THREE.BoxGeometry(0.08, 0.012, 0.014), gold, m4(0.08, 0.3, 0.06)); },
    chalice: () => { add(new THREE.CylinderGeometry(0.022, 0.008, 0.04, 10), gold, m4(-0.07, 0.3, 0.12)); add(new THREE.CylinderGeometry(0.018, 0.018, 0.005, 10), gold, m4(-0.07, 0.275, 0.12)); },
    saw: () => { add(new THREE.BoxGeometry(0.44, 0.06, 0.004), iron, m4(0, 0.34, 0.1)); for (const k of [-1, 1]) add(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), wood, m4(k * 0.23, 0.34, 0.1)); },
    scroll: () => { add(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 10), 0xe8dcc0, m4(-0.07, 0.28, 0.12, 0, 0, Math.PI / 2)); },
    knife: () => { add(new THREE.BoxGeometry(0.012, 0.09, 0.004), iron, m4(0.075, 0.27, 0.13)); add(new THREE.BoxGeometry(0.08, 0.2, 0.01), 0xd8c0a8, m4(-0.08, 0.3, 0.06, 0, 0, 0.2)); },
  };
  A[ap.attr]();
  const m = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 0.55, envMapIntensity: 0.4 })); m.castShadow = true; root.add(m);
  root.userData.body = m;
  root.userData.chest = new THREE.Object3D(); root.userData.chest.position.set(0, 0.4, 0); root.add(root.userData.chest);
  noRay(root);
  return root;
}

/* ---------------- the weight shaft ---------------- */
function buildShaft(SH) {
  O.shaftG = grp(0, 0, 0);
  const g = O.shaftG, d = 7;
  const sw = (w, x, z, ry) => { const p = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(w, d), w / 2, d / 2), M.stoneDark); p.position.set(x, -d / 2, z); p.rotation.y = ry; g.add(p); };
  sw(SH.z1 - SH.z0, SH.x0, (SH.z0 + SH.z1) / 2, Math.PI / 2); sw(SH.z1 - SH.z0, SH.x1, (SH.z0 + SH.z1) / 2, -Math.PI / 2);
  sw(SH.x1 - SH.x0, (SH.x0 + SH.x1) / 2, SH.z0, 0); sw(SH.x1 - SH.x0, (SH.x0 + SH.x1) / 2, SH.z1, Math.PI);
  const bot = new THREE.Mesh(new THREE.PlaneGeometry(SH.x1 - SH.x0, SH.z1 - SH.z0), M.black); bot.rotation.x = -Math.PI / 2; bot.position.set((SH.x0 + SH.x1) / 2, -d, (SH.z0 + SH.z1) / 2); g.add(bot);
  // a rail round the opening on the two open sides
  const rx = SH.x1 + 0.04, rz = SH.z0 - 0.04;
  for (const [x, z] of [[rx, rz], [rx, SH.z1 - 0.02], [SH.x0 + 0.02, rz]]) bev(0.05, 1.0, 0.05, M.wood, x, 0.5, z, g, 0.006);
  bev(0.05, 0.05, SH.z1 - rz, M.wood, rx, 1.0, (rz + SH.z1) / 2, g, 0.006); bev(rx - SH.x0, 0.05, 0.05, M.wood, (SH.x0 + rx) / 2, 1.0, rz, g, 0.006);
  // pulleys on a beam over the shaft; cables from the barrels over them and down to the weights
  bev(0.12, 0.14, SH.z1 - SH.z0 + 0.3, M.wood, (SH.x0 + SH.x1) / 2, 3.05, (SH.z0 + SH.z1) / 2, g, 0.01);
  O.pulleys = [];
  for (const [k, z] of [[0, 1.68], [1, 2.02]]) { const p = gear(0.08, 18, 0.03, M.iron, (SH.x0 + SH.x1) / 2, 2.9, z, g, { tooth: 0.006 }); p.rotation.y = Math.PI / 2; O.pulleys.push(p); }
  O.weights = [];
  const wx = (SH.x0 + SH.x1) / 2;
  for (const [k, z, y] of [[0, 1.68, -2.6], [1, 2.02, -4.2]]) {   // the going weight (stopped, high), the strike weight (run right down)
    const w = grp(wx, y, z, g); cyl(0.11, 0.11, 0.6, M.iron, 0, 0, 0, w, 16); cyl(0.02, 0.02, 0.1, M.iron, 0, 0.34, 0, w, 6);
    const cab = cyl(0.007, 0.007, 1, M.cable, 0, 0, 0, w, 6); cab.userData.cable = true; w.userData.cab = cab; O.weights.push(w);
  }
  // the apostles' pin, lying on top of the strike weight where it fell, a little brass glint far down in the dark
  O.pinW = grp(0.05, 0.315, 0.02, O.weights[1]); O.pinW.userData.keep = true;
  { const p = cyl(0.007, 0.007, 0.11, M.brassBright, 0, 0, 0, O.pinW, 8); p.rotation.z = Math.PI / 2; p.rotation.y = 0.6; }
  O.pinGlint = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffe0a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
  O.pinGlint.scale.setScalar(0.16); O.pinGlint.position.set(0, 0.02, 0); layer1(O.pinGlint); O.pinW.add(O.pinGlint);
  // what you aim at when you look down the shaft: its mouth
  O.shaftHit = box(SH.x1 - SH.x0, 0.5, SH.z1 - SH.z0, HITMAT, (SH.x0 + SH.x1) / 2, -0.2, (SH.z0 + SH.z1) / 2, scene); O.shaftHit.layers.set(2);
  // the cables run from the barrels in the frame up and over to the pulleys
  tube([[0.32, 0.86, FR.z0 + 0.4], [0.32, 2.9, 0.4], [-1.0, 2.95, 1.2], [wx + 0.08, 2.98, 2.02]], 0.007, M.cable, g, 30, 5);
  tube([[-0.25, 0.86, FR.z0 + 0.5], [-0.25, 2.88, 0.5], [-1.2, 2.93, 1.1], [wx + 0.08, 2.98, 1.68]], 0.007, M.cable, g, 30, 5);
  noRay(g);
}

/* ---------------- furniture: the keepers' cupboard and lectern, the restorers' bench ---------------- */
function buildFurniture() {
  // the keepers' cupboard: an iron door set in the left wall, a lock of two brass rings in its middle
  O.cup = grp(RM.x0 + 0.02, 0, 0.75);
  bev(0.04, 1.02, 0.7, M.stoneDark, 0, 1.38, 0, O.cup, 0.01);
  O.cupDoor = grp(0.03, 1.38, -0.31, O.cup);             // hinged at its back edge
  bev(0.03, 0.92, 0.62, M.iron, 0, 0, 0.31, O.cupDoor, 0.008);
  for (const y of [-0.36, 0.36]) bev(0.036, 0.05, 0.62, M.ironBlack, 0.003, y, 0.31, O.cupDoor, 0.004);
  for (const yz of [[-0.4, 0.04], [0.4, 0.04], [-0.4, 0.58], [0.4, 0.58]]) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), M.ironBlack); r.position.set(0.02, yz[0], yz[1]); O.cupDoor.add(r); }
  O.cupLock = grp(0.024, 0.02, 0.31, O.cupDoor); O.cupLock.rotation.y = Math.PI / 2;
  // a plain old lock plate with a keyhole, and an iron handle (the keepers never locked it)
  bev(0.1, 0.16, 0.012, M.iron, 0, 0, 0.004, O.cupLock, 0.004); cyl(0.008, 0.008, 0.016, M.black, 0, -0.03, 0.01, O.cupLock, 8).rotation.x = Math.PI / 2;
  O.cupKnob = cyl(0.022, 0.024, 0.03, M.brass, 0, 0.04, 0.02, O.cupLock, 16); O.cupKnob.rotation.x = Math.PI / 2;
  const hd = grp(0.03, -0.18, 0.5, O.cupDoor); tube([[0, 0, -0.05], [0.04, 0, -0.04], [0.04, 0, 0.04], [0, 0, 0.05]], 0.007, M.ironBlack, hd, 10, 6);
  // inside: shelves, an oil can, old rags, the keepers' lantern (shown when it opens)
  O.cupIn = grp(0, 1.38, 0, O.cup);
  bev(0.02, 0.9, 0.6, M.black, -0.05, 0, 0, O.cupIn, 0.004);
  bev(0.18, 0.02, 0.6, M.wood, 0.04, -0.12, 0, O.cupIn, 0.004);
  { const r = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.cloth); r.scale.set(0.9, 0.5, 1.3); r.position.set(0.06, -0.08, 0.12); O.cupIn.add(r); }
  { const ln = grp(0.06, -0.11, -0.12, O.cupIn); bev(0.09, 0.012, 0.09, M.ironBlack, 0, 0.006, 0, ln, 0.003); cyl(0.035, 0.035, 0.11, M.glassOld, 0, 0.07, 0, ln, 10); bev(0.09, 0.012, 0.09, M.ironBlack, 0, 0.13, 0, ln, 0.003); const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 12, Math.PI), M.ironBlack); h.position.y = 0.14; ln.add(h); }
  const oil = grp(0.06, -0.31, -0.2, O.cupIn); lathe([[0.001, 0], [0.04, 0], [0.04, 0.06], [0.012, 0.09], [0.004, 0.16]], M.brass, 0, 0, 0, oil, 14);
  O.cupIn.visible = false;
  hb('cup', O.cup, 0.02);
  // the lectern by the little window, with the keepers' book on it
  O.lect = grp(POS.lectern.x, 0, POS.lectern.z); O.lect.rotation.y = 0.5;
  bev(0.08, 1.0, 0.08, M.wood, 0, 0.5, 0, O.lect, 0.008); bev(0.4, 0.04, 0.4, M.wood, 0, 0.02, 0, O.lect, 0.006);
  const top = grp(0, 1.08, 0, O.lect); top.rotation.x = -0.45; bev(0.5, 0.03, 0.38, M.wood, 0, 0, 0, top, 0.006); bev(0.5, 0.04, 0.02, M.wood, 0, 0.02, 0.18, top, 0.004);
  O.book = grp(0, 0.035, -0.01, top);
  bev(0.42, 0.03, 0.3, std({ color: 0x3a2018, roughness: 0.7 }), 0, 0, 0, O.book, 0.006);
  O.bookPages = plane(0.38, 0.27, std({ map: T.bookTex, roughness: 0.9 }), 0, 0.017, 0, 0, O.book); O.bookPages.rotation.x = -Math.PI / 2;
  hb('book', O.book, 0.03);
  // the restorers' bench against the back wall
  O.bench = grp(1.3, 0, RM.z1 - 0.36);
  bev(2.0, 0.06, 0.66, M.wood, 0, 0.86, 0, O.bench, 0.008);
  for (const [x, z] of [[-0.92, -0.28], [0.92, -0.28], [-0.92, 0.28], [0.92, 0.28]]) bev(0.07, 0.83, 0.07, M.wood, x, 0.415, z, O.bench, 0.006);
  bev(1.9, 0.03, 0.58, M.wood, 0, 0.2, 0, O.bench, 0.006);
  // on it: a laptop (dead), a toolbox, parts in labelled bags, a thermos, the clipboard
  const lap = grp(-0.6, 0.89, 0.02, O.bench); lap.rotation.y = 0.25; bev(0.34, 0.018, 0.24, std({ color: 0x2a2c30, metalness: 0.6, roughness: 0.4 }), 0, 0.009, 0, lap, 0.004); const scr = grp(0, 0.018, -0.12, lap); scr.rotation.x = -1.9; bev(0.34, 0.012, 0.23, std({ color: 0x2a2c30, metalness: 0.6, roughness: 0.4 }), 0, 0, 0.115, scr, 0.004); O.laptop = lap;
  const tb = grp(0.55, 0.89, -0.05, O.bench); bev(0.46, 0.18, 0.22, std({ color: 0xa81c14, metalness: 0.4, roughness: 0.4 }), 0, 0.09, 0, tb, 0.01); tube([[-0.15, 0.18, 0], [-0.15, 0.24, 0], [0.15, 0.24, 0], [0.15, 0.18, 0]], 0.01, M.ironBlack, tb, 10, 6); O.toolbox = tb;
  for (let i = 0; i < 6; i++) { const b = grp(-0.15 + (i % 3) * 0.14, 0.9, 0.12 + Math.floor(i / 3) * 0.12, O.bench); b.rotation.y = rand(-0.4, 0.4); bev(0.1, 0.02, 0.13, std({ color: 0xd8dce0, roughness: 0.3, transparent: true, opacity: 0.7 }), 0, 0.01, 0, b, 0.004); bev(0.06, 0.004, 0.03, std({ color: 0x2a5ad8, roughness: 0.6 }), 0, 0.022, -0.04, b, 0.001); for (let k = 0; k < 3; k++) cyl(0.008, 0.008, 0.02, M.brass, rand(-0.03, 0.03), 0.012, rand(-0.03, 0.04), b, 6); }
  const th = grp(0.2, 0.89, -0.2, O.bench); cyl(0.04, 0.04, 0.28, std({ color: 0x3a4a5a, metalness: 0.6, roughness: 0.35 }), 0, 0.14, 0, th, 14); cyl(0.042, 0.042, 0.05, M.plastic, 0, 0.3, 0, th, 14);
  O.clip = grp(-0.1, 0.895, -0.08, O.bench); O.clip.rotation.y = -0.15;
  bev(0.24, 0.008, 0.33, std({ color: 0x8a6a40, roughness: 0.7 }), 0, 0.004, 0, O.clip, 0.003); plane(0.21, 0.28, std({ map: T.sheetTex, roughness: 0.9 }), 0, 0.009, 0.02, 0, O.clip).rotation.x = -Math.PI / 2; bev(0.1, 0.012, 0.03, M.steel, 0, 0.012, -0.15, O.clip, 0.003);
  // a crowbar lying along the front edge of the bench, red paint worn off the claw
  O.crowbar = grp(0.22, 0.905, -0.25, O.bench); O.crowbar.rotation.y = 0.12;
  { const red = std({ color: 0x8a1a14, metalness: 0.4, roughness: 0.5 }); tube([[-0.3, 0, 0], [0.22, 0, 0], [0.27, 0.0, 0.0], [0.31, 0.025, 0], [0.33, 0.06, 0]], 0.011, red, O.crowbar, 20, 6);
    const tip = bev(0.04, 0.008, 0.024, M.steel, -0.31, 0, 0, O.crowbar, 0.002); tip.rotation.z = 0.1; }
  hb('clip', O.clip, 0.03); hb('laptop', O.laptop, 0.02); hb('toolbox', O.toolbox, 0.02); hb('crowbar', O.crowbar, 0.05);
  // the calendar plate: a big photographic print the restorers taped up
  O.cal = grp(POS.cal.x, POS.cal.y, POS.cal.z);
  O.calPrint = plane(0.82, 0.82, std({ map: T.calTex, roughness: 0.6 }), 0, 0, 0, Math.PI, O.cal);
  for (const [x, y] of [[-0.38, 0.38], [0.38, 0.38], [-0.38, -0.38], [0.38, -0.38]]) plane(0.08, 0.03, std({ color: 0xd8cfa8, roughness: 0.7, transparent: true, opacity: 0.85 }), x, y, -0.002, Math.PI, O.cal).rotation.z = 0.7 * Math.sign(x * y);
  hb('cal', O.cal, 0.02);
  // the work lamp on its tripod, aimed at the back of the clock
  O.lamp = grp(POS.light.x, 0, POS.light.z);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4; const l = cyl(0.01, 0.01, 1.72, M.steel, Math.cos(a) * 0.18, 0.84, Math.sin(a) * 0.18, O.lamp, 6); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); }
  cyl(0.012, 0.012, 0.4, M.steel, 0, 1.5, 0, O.lamp, 6);
  O.lampHead = grp(0, 1.75, 0, O.lamp); O.lamp.updateMatrixWorld(true); O.lampHead.lookAt(-0.2, 1.15, 0.55);
  bev(0.28, 0.2, 0.06, std({ color: 0x1a1c1e, metalness: 0.5, roughness: 0.5 }), 0, 0, 0, O.lampHead, 0.01);
  O.lampLens = plane(0.24, 0.16, M.ledPanel, 0, 0, 0.031, 0, O.lampHead); O.lampLens.userData.noRay = true;
  tube([[0, 1.6, 0], [-0.1, 0.6, 0.05], [-0.25, 0.02, 0.2], [-0.4, 0.02, 0.32]], 0.006, M.black, O.lamp, 16, 5);
  bev(0.2, 0.12, 0.12, M.yellow, -0.5, 0.06, 0.36, O.lamp, 0.01);
  hb('lamp', O.lamp, 0.04);
  // the dial's back, on the dial wall: a great wooden disc with iron straps, the arbors coming through its middle
  O.dialBack = grp(POS.dialBack.x, POS.dialBack.y, RM.z0 + 0.04);
  cyl(1.15, 1.15, 0.06, M.wood, 0, 0, 0, O.dialBack, 56).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) { const s = bev(2.25, 0.06, 0.02, M.ironBlack, 0, 0, 0.035, O.dialBack, 0.004); s.rotation.z = i / 4 * Math.PI; }
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.025, 8, 64), M.ironBlack); rimT.position.z = 0.03; O.dialBack.add(rimT);
  for (let i = 0; i < 3; i++) { const a = cyl(0.03 - i * 0.008, 0.03 - i * 0.008, 0.25 + i * 0.12, M.brass, 0, 0, 0.12 + i * 0.06, O.dialBack, 12); a.rotation.x = Math.PI / 2; }
  // the drive from the clock to the dial, under the loft
  tube([[POS.dialBack.x, 1.3, FR.z0], [POS.dialBack.x, 1.3, -1.2], [POS.dialBack.x, 1.3, RM.z0 + 0.35]], 0.016, M.iron, scene, 12, 8);
  hb('dialBack', O.dialBack, 0.02);
  // Death's linkage: a box on the wall with a lever and the wire to his arm outside
  O.death = grp(POS.death.x, POS.death.y, RM.z0 + 0.08);
  bev(0.36, 0.5, 0.14, M.wood, 0, 0, 0, O.death, 0.01);
  O.deathLever = grp(0.0, 0.12, 0.08, O.death); bev(0.02, 0.34, 0.02, M.iron, 0, -0.17, 0, O.deathLever, 0.003); cyl(0.02, 0.02, 0.03, M.brass, 0, 0, 0, O.deathLever, 10).rotation.x = Math.PI / 2;
  tube([[0, 0.25, 0], [0, 0.6, -0.05], [0.3, 1.2, -0.08]], 0.004, M.cable, O.death, 10, 4);
  hb('death', O.death, 0.03);
}

/* ---------------- the clock ---------------- */
function buildClock() {
  O.clock = grp(0, 0, 0);
  const g = O.clock, { x0, x1, z0, z1, y0, y1 } = FR;
  // stone plinth
  bev(x1 - x0 + 0.3, y0, z1 - z0 + 0.3, M.stoneDark, (x0 + x1) / 2, y0 / 2, (z0 + z1) / 2, g, 0.02);
  // the iron frame: four corner posts with pinnacles, rails top and bottom, middle uprights
  for (const x of [x0, x1]) for (const z of [z0, z1]) {
    bev(0.07, y1 - y0, 0.07, M.iron, x, (y0 + y1) / 2, z, g, 0.008);
    const fin = grp(x, y1, z, g); lathe([[0.001, 0], [0.05, 0], [0.04, 0.05], [0.02, 0.12], [0.001, 0.22]], M.iron, 0, 0, 0, fin, 8);
  }
  for (const y of [y0 + 0.04, y1 - 0.02, 1.2]) { for (const z of [z0, z1]) bev(x1 - x0, 0.05, 0.06, M.iron, (x0 + x1) / 2, y, z, g, 0.006); for (const x of [x0, x1]) bev(0.06, 0.05, z1 - z0, M.iron, x, y, (z0 + z1) / 2, g, 0.006); }
  for (const x of [-0.55, 0.12]) for (const z of [z0, z1]) bev(0.05, y1 - y0, 0.05, M.iron, x, (y0 + y1) / 2, z, g, 0.006);
  // arbors running front to back through the trains
  const arbor = (x, y, l = z1 - z0) => { const a = cyl(0.012, 0.012, l, M.steel, x, y, (z0 + z1) / 2, g, 8); a.rotation.x = Math.PI / 2; return a; };
  // the astronomical drive (left): three great wheels of 365, 366 and 379 teeth that turn the sun, the stars and the moon
  O.great = [];
  [[0.04, 0.48, 120], [0.2, 0.46, 122], [0.36, 0.45, 126]].forEach(([dz, r, n], i) => { const w = gear(r, n, 0.018, M.brass, -1.0, 1.25, z0 + 0.15 + dz, g, { spokes: 6, hub: 0.14, tooth: 0.012 }); O.great.push(w); });
  arbor(-1.0, 1.25);
  gear(0.09, 24, 0.03, M.brass, -0.62, 1.68, z0 + 0.5, g, { tooth: 0.01 }); arbor(-0.62, 1.68);
  // the going train (middle): wheels stacked up to the escapement; the pendulum hook hangs empty
  O.going = [];
  [[-0.32, 0.6, 0.2, 60], [-0.2, 0.95, 0.13, 48], [-0.34, 1.32, 0.11, 40], [-0.22, 1.62, 0.08, 30]].forEach(([x, y, r, n]) => { O.going.push(gear(r, n, 0.016, M.brass, x, y, 0.25, g, { spokes: r > 0.12 ? 4 : 0, tooth: 0.009 })); arbor(x, y); });
  O.going.push(gear(0.06, 15, 0.012, M.brass, -0.2, 1.88, 0.25, g, { tooth: 0.016 }));   // the escape wheel, sharp teeth
  O.goBarrel = cyl(0.11, 0.11, 0.22, M.iron, -0.25, 0.62, 0.0, g, 18); O.goBarrel.rotation.x = Math.PI / 2;
  { const h = grp(-0.2, y1 + 0.12, 0.25, g); tube([[0, 0, 0], [0, -0.08, 0], [0.03, -0.12, 0], [0.04, -0.09, 0]], 0.006, M.steel, h, 10, 5); bev(0.06, 0.03, 0.03, M.iron, 0, 0.02, 0, h, 0.004); }
  // the strike train (right): barrel, great wheel, pin wheel with lifting pins, warning wheel, the fly on top
  O.strike = [];
  O.stBarrel = cyl(0.12, 0.12, 0.26, M.iron, 0.32, 0.82, 0.25, g, 20); O.stBarrel.rotation.x = Math.PI / 2;
  [[0.32, 0.82, 0.26, 72, 0.06], [0.62, 1.12, 0.16, 56, 0.3], [0.5, 1.48, 0.12, 48, 0.16], [0.78, 1.72, 0.07, 30, 0.3], [0.8, 1.98, 0.05, 20, 0.25]].forEach(([x, y, r, n, z]) => { O.strike.push(gear(r, n, 0.016, M.brass, x, y, z, g, { spokes: r > 0.12 ? 5 : 0, tooth: 0.01 })); arbor(x, y); });
  // lifting pins on the pin wheel
  O.pins = grp(0.62, 1.12, 0.3, g); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; const p = cyl(0.007, 0.007, 0.04, M.steel, Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.02, O.pins, 6); p.rotation.x = Math.PI / 2; }
  // the fly: a vertical arbor above the frame with two vanes that can be set edge-on or face-on
  O.fly = grp(POS.fly.x, POS.fly.y - 0.12, POS.fly.z, g);
  cyl(0.008, 0.008, 0.32, M.steel, 0, 0.1, 0, O.fly, 8);
  O.vanes = [];
  for (const s of [-1, 1]) { const v = grp(s * 0.075, 0.14, 0, O.fly); bev(0.12, 0.13, 0.004, M.brassBright, 0, 0, 0, v, 0.002); O.vanes.push(v); }
  O.flyNut = cyl(0.016, 0.016, 0.02, M.brass, 0, 0.23, 0, O.fly, 6);
  hb('fly', O.fly, 0.05);
  // the hammer: a lever on the right that the pins lift, and a wire up to the bell
  O.hammer = grp(0.92, 1.45, 0.3, g); bev(0.32, 0.03, 0.03, M.iron, 0.16, 0, 0, O.hammer, 0.004);
  tube([[1.24, 1.45, 0.3], [1.24, 2.4, 0.3], [POS.hammer.x + 0.2, POS.hammer.y, POS.hammer.z]], 0.004, M.cable, g, 12, 4);
  // the count wheel (locking plate) on the back of the frame, with its click above it
  O.count = grp(POS.count.x, POS.count.y, POS.count.z, g);
  O.countPlate = new THREE.Mesh(new THREE.CircleGeometry(0.22, 64), std({ map: T.countTex, metalness: 0.85, roughness: 0.36, envMapIntensity: 1 })); O.count.add(O.countPlate);
  const ct = new THREE.Mesh(new THREE.TorusGeometry(0.222, 0.006, 6, 64), M.brass); O.count.add(ct);
  cyl(0.02, 0.02, 0.04, M.steel, 0, 0, 0.01, O.count, 12).rotation.x = Math.PI / 2;
  O.countClick = grp(0, 0.26, 0.02, O.count); bev(0.03, 0.08, 0.012, M.iron, 0, -0.01, 0, O.countClick, 0.003); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 3), M.ironBlack); tip.rotation.z = Math.PI; tip.position.y = -0.06; O.countClick.add(tip);
  hb('count', O.count, 0.03);
  // the winding square of the strike train, behind a locked iron cover
  O.wind = grp(POS.wind.x, POS.wind.y, POS.wind.z, g);
  O.windSq = bev(0.03, 0.03, 0.05, M.steel, 0, 0, 0.0, O.wind, 0.004);
  O.windCover = grp(-0.07, 0, 0.03, O.wind);
  bev(0.15, 0.15, 0.012, M.iron, 0.07, 0, 0, O.windCover, 0.004);
  O.windHole = cyl(0.008, 0.008, 0.014, M.black, 0.11, -0.04, 0.003, O.windCover, 8); O.windHole.rotation.x = Math.PI / 2;
  O.windCrank = grp(0, 0, 0.04, O.wind); O.windCrank.visible = false;
  { const c = O.windCrank; bev(0.03, 0.28, 0.03, M.iron, 0, 0.12, 0, c, 0.004); const hd = cyl(0.014, 0.014, 0.1, M.wood, 0, 0.25, 0.06, c, 8); hd.rotation.x = Math.PI / 2; }
  hb('wind', O.wind, 0.04);
  // the apostles' clutch on top of the frame: two iron dogs on the upright shaft, and a cross-hole for the pin
  O.clutch = grp(POS.clutch.x, POS.clutch.y, POS.clutch.z, g);
  cyl(0.035, 0.035, 0.06, M.iron, 0, -0.04, 0, O.clutch, 14); cyl(0.035, 0.035, 0.06, M.iron, 0, 0.04, 0, O.clutch, 14);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; bev(0.02, 0.025, 0.02, M.iron, Math.cos(a) * 0.026, 0.0, Math.sin(a) * 0.026, O.clutch, 0.003); }
  cyl(0.014, 0.014, 0.14, M.steel, 0, -0.14, 0, O.clutch, 8);
  O.pinIn = cyl(0.007, 0.007, 0.11, M.brassBright, 0, 0.04, 0, O.clutch, 8); O.pinIn.rotation.z = Math.PI / 2; O.pinIn.visible = false;
  hb('clutch', O.clutch, 0.09);
  // the bell, hung from a beam under the vault, with the hammer under its lip
  O.bell = grp(POS.bell.x, POS.bell.y, POS.bell.z);
  bev(0.16, 0.16, 1.2, M.wood, 0, 0.36, 0, O.bell, 0.012);
  lathe([[0.001, 0.25], [0.08, 0.25], [0.15, 0.2], [0.19, 0.06], [0.24, -0.08], [0.29, -0.16], [0.28, -0.18], [0.22, -0.13], [0.15, 0.0], [0.07, 0.18], [0.001, 0.2]], M.bronze, 0, 0, 0, O.bell, 32);
  O.bellHammer = grp(0.2, -0.24, 0, O.bell); bev(0.25, 0.02, 0.02, M.iron, -0.1, 0, 0, O.bellHammer, 0.003); const hh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M.iron); hh.position.set(-0.24, 0, 0); O.bellHammer.add(hh);
  // the setting dial: a little copy of the great dial outside, for setting the hands
  buildSettingDial(g);
  // restorers' tags on strings: little blue labels everywhere
  O.tags = [];
  for (const [x, y, z] of [[-1.0, 0.72, z0 - 0.02], [-0.2, 1.97, z1 + 0.02], [0.62, 1.68, z1 + 0.02], [0.8, 2.42, 0.3], [-0.62, 1.82, z1 + 0.02], [0.32, 1.06, z1 + 0.02], [1.1, 0.6, z1 + 0.02]]) { const t = grp(x, y, z, g); tube([[0, 0.05, 0], [0.005, 0, 0.01]], 0.0015, M.paper, t, 3, 3); const p = bev(0.035, 0.05, 0.003, std({ color: 0x2a5ad8, roughness: 0.6 }), 0.005, -0.025, 0.012, t, 0.001); p.rotation.y = rand(-0.4, 0.4); O.tags.push(t); }
  O.frameHit = box(x1 - x0 - 0.2, 1.1, z1 - z0 - 0.3, HITMAT, (x0 + x1) / 2, 0.95, (z0 + z1) / 2, g); O.frameHit.layers.set(2); O.frameHit.castShadow = false;
}
function buildSettingDial(parent) {
  const D0 = O.dial = grp(POS.dial.x, POS.dial.y, POS.dial.z, parent);
  const R0 = 0.3;
  // a gilt bezel with little crockets, the painted face, the turning zodiac ring, the hands
  const bz = new THREE.Mesh(new THREE.TorusGeometry(R0 + 0.012, 0.016, 10, 72), M.gold); D0.add(bz);
  bev(0.72, 0.72, 0.02, M.iron, 0, 0, -0.03, D0, 0.006);
  O.dialFace = new THREE.Mesh(new THREE.CircleGeometry(R0, 72), std({ map: T.dialTex, roughness: 0.42, metalness: 0.15, envMapIntensity: 0.8, emissive: new THREE.Color(0xffffff), emissiveMap: T.dialTex, emissiveIntensity: 0.0 })); D0.add(O.dialFace);
  O.zodRing = new THREE.Mesh(new THREE.RingGeometry(R0 * 0.46, R0 * 0.65, 72, 1), std({ map: T.zodTex, transparent: true, metalness: 0.9, roughness: 0.32, envMapIntensity: 1.1 })); O.zodRing.position.z = 0.004; D0.add(O.zodRing);
  // hands: the sun hand (gilt arm, a pointing hand at the Roman ring, the sun on the zodiac), the moon hand (silver, the half-dark ball)
  O.sunHand = grp(0, 0, 0.01, D0);
  bev(0.012, R0 * 0.8, 0.004, M.gold, 0, R0 * 0.4, 0, O.sunHand, 0.002);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), std({ map: T.sunTex, metalness: 1, roughness: 0.3, transparent: true, emissive: new THREE.Color(0x3a2a08), emissiveIntensity: 0.4 })); sun.position.set(0, R0 * 0.555, 0.003); O.sunHand.add(sun);
  const fing = bev(0.016, 0.036, 0.004, M.gold, 0, R0 * 0.8, 0.002, O.sunHand, 0.002);
  O.moonHand = grp(0, 0, 0.016, D0);
  bev(0.008, R0 * 0.6, 0.003, M.steel, 0, R0 * 0.3, 0, O.moonHand, 0.0015);
  O.moonBall = grp(0, R0 * 0.555, 0.008, O.moonHand);
  const mb1 = new THREE.Mesh(new THREE.SphereGeometry(0.017, 16, 12, 0, Math.PI), std({ color: 0xe8e8e4, metalness: 1, roughness: 0.25 })); mb1.rotation.y = -Math.PI / 2; O.moonBall.add(mb1);
  const mb2 = new THREE.Mesh(new THREE.SphereGeometry(0.017, 16, 12, 0, Math.PI), std({ color: 0x0a0a0c, metalness: 0.2, roughness: 0.5 })); mb2.rotation.y = Math.PI / 2; O.moonBall.add(mb2);
  cyl(0.014, 0.014, 0.012, M.gold, 0, 0, 0.02, D0, 12).rotation.x = Math.PI / 2;
  hb('dial', D0, 0.02);
  // the setting knob: a little brass crank on a square arbor beside the dial
  O.knob = grp(POS.knob.x, POS.knob.y, POS.knob.z, parent);
  cyl(0.012, 0.012, 0.05, M.steel, 0, 0, 0, O.knob, 6).rotation.x = Math.PI / 2;
  O.knobArm = grp(0, 0, 0.03, O.knob); bev(0.014, 0.08, 0.008, M.brass, 0, 0.035, 0, O.knobArm, 0.002); const kh = cyl(0.008, 0.008, 0.035, M.wood, 0, 0.07, 0.018, O.knobArm, 8); kh.rotation.x = Math.PI / 2;
  hb('knob', O.knob, 0.03);
}
/* ---------------- the restorers' crate ---------------- */
// crate 3, nailed shut: the pendulum and the winding crank packed in straw. Once it's open and empty you can drag it and stand on it.
function buildCrate() {
  const { w, d, h } = CRATE;
  O.crate = grp(CRATE.x, 0, CRATE.z); O.crate.userData.keep = true;
  // new pale pine with a few grain lines, the way the restorers' crates come
  if (!T.pine) T.pine = tex(pix(256, 256, (x, y) => { const g = Math.sin((x + fbm(x / 40, y / 90, 3) * 60) * 0.32) * 0.5 + 0.5, n = fbm(x / 9, y / 70, 3); const k = 0.82 + g * 0.1 - n * 0.12; return [Math.round(214 * k), Math.round(176 * k), Math.round(118 * k)]; }));
  const pine = std({ map: T.pine, roughness: 0.8 }), batten = std({ map: T.pine, color: 0xcfb894, roughness: 0.82 });
  // four sides of three boards each, with gaps, and corner battens
  for (let i = 0; i < 3; i++) { const y = 0.04 + i * (h - 0.06) / 3 + (h - 0.06) / 6;
    for (const s of [-1, 1]) { bev(w, (h - 0.06) / 3 - 0.012, 0.018, pine, 0, y, s * (d / 2 - 0.009), O.crate, 0.003); bev(0.018, (h - 0.06) / 3 - 0.012, d - 0.036, pine, s * (w / 2 - 0.009), y, 0, O.crate, 0.003); } }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bev(0.04, h - 0.02, 0.04, batten, sx * (w / 2 - 0.02), (h - 0.02) / 2 + 0.01, sz * (d / 2 - 0.02), O.crate, 0.004);
  bev(w - 0.02, 0.02, d - 0.02, batten, 0, 0.015, 0, O.crate, 0.003);
  // stencils: a big 3, ORLOJ 2018 and what's inside, on the two sides you see from the room
  const st = tex(canv(256, 160, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(12,10,9,0.92)'; g.font = '700 92px ' + MONO; g.textAlign = 'left'; g.fillText('3', 18, 96); g.font = '700 22px ' + MONO; g.fillText('ORLOJ 2018', 92, 44); g.fillText('KYVADLO', 92, 78); g.fillText('+ KLIKA', 92, 104); g.font = '600 15px ' + MONO; g.fillText('PENDULUM + CRANK', 18, 140); }));
  const sm = std({ map: st, transparent: true, roughness: 0.9, depthWrite: false });
  plane(0.42, 0.26, sm, -w / 2 - 0.003, h * 0.52, 0, -Math.PI / 2, O.crate).userData.noRay = true;
  plane(0.42, 0.26, sm, 0, h * 0.52, d / 2 + 0.003, 0, O.crate).userData.noRay = true;
  // inside: straw, the pendulum rod and bob lying corner to corner, the crank on top
  { const straw = std({ color: 0xb89a52, roughness: 1 }); bev(w - 0.05, 0.05, d - 0.05, straw, 0, h - 0.16, 0, O.crate, 0.02); }
  { const pd = grp(0, h - 0.12, 0, O.crate); pd.rotation.y = 0.6; cyl(0.01, 0.01, 0.72, M.steel, 0, 0, 0, pd, 6).rotation.z = Math.PI / 2; const bob = cyl(0.11, 0.11, 0.025, M.brass, 0.3, 0.0, 0, pd, 24); bob.rotation.x = Math.PI / 2; bob.rotation.z = Math.PI / 2; }
  O.crateCrank = grp(-0.1, h - 0.1, 0.08, O.crate); O.crateCrank.rotation.y = -0.4;
  { const c = O.crateCrank; bev(0.26, 0.026, 0.026, M.iron, 0, 0, 0, c, 0.004); bev(0.03, 0.03, 0.05, M.iron, -0.13, 0, 0, c, 0.004); const hnd = cyl(0.014, 0.014, 0.1, M.wood, 0.13, 0.05, 0, c, 8); hnd.rotation.x = 0; }
  // the lid: three boards and two battens, nailed down; it tips off over the far edge
  O.crateLid = grp(0, h, -d / 2, O.crate);
  for (let i = 0; i < 3; i++) bev(w, 0.018, d / 3 - 0.008, pine, 0, 0.009, (i + 0.5) * d / 3, O.crateLid, 0.003);
  for (const sx of [-1, 1]) bev(0.05, 0.016, d - 0.02, batten, sx * (w / 2 - 0.06), 0.026, d / 2, O.crateLid, 0.003);
  for (const sx of [-1, 1]) for (const k of [0.08, d / 2, d - 0.08]) cyl(0.006, 0.006, 0.004, M.ironBlack, sx * (w / 2 - 0.06), 0.035, k, O.crateLid, 6);
  hb('crate', O.crate, 0.03);
}

/* =====================================================================
   THE BLIND HOUR · part C: outside the dial wall (the clock's face as the square sees it,
   the apostles' shutters, Death, the scaffold, the square in the snow, Týn church),
   the blind clockmaker himself, his face and hand for the scares, and the lights
   ===================================================================== */
const FZ = RM.z0 - 0.45;   // the outside face of the dial wall
function buildOutside() {
  O.out = grp(0, 0, 0);
  const g = O.out;
  // the tower face round the clock: big ashlar, painted with the clock's gothic surround (holes at the windows)
  // (the wall is turned to face the square, so the shape's u runs along -x: holes are mirrored)
  const holes = [[-SIDEWIN.x - SIDEWIN.w / 2, -SIDEWIN.x + SIDEWIN.w / 2, SIDEWIN.y0, SIDEWIN.y1, 0.25], ...APW.xs.map(x => [-x - APW.w / 2, -x + APW.w / 2, APW.y0, APW.y1, 0.18])];
  const fg = holedGeo(-4.6, 4.6, -8.2, 7.6, holes, 0.02); uvScale(fg, 1 / 9.2, 1 / 15.8, 4.6 / 9.2, 8.2 / 15.8);
  O.facade = new THREE.Mesh(fg, std({ map: T.facadeTex, normalMap: T.stoneN, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.92 }));
  O.facade.rotation.y = Math.PI; O.facade.position.set(0, 0, FZ - 0.001); O.facade.receiveShadow = true; g.add(O.facade);
  // a little pitched roof over the apostles' windows, and the gilt cockerel
  const roof = grp(-0.4, APW.y1 + 0.32, FZ - 0.22, g);
  for (const s of [-1, 1]) { const r = bev(1.0, 0.04, 0.5, std({ color: 0x3a4a44, metalness: 0.5, roughness: 0.5 }), s * 0.45, 0, 0, roof, 0.006); r.rotation.z = -s * 0.5; }
  const cock = grp(0, 0.34, 0.05, roof); lathe([[0.001, 0], [0.05, 0.02], [0.06, 0.1], [0.03, 0.16], [0.001, 0.18]], M.gold, 0, 0, 0, cock, 10); bev(0.02, 0.08, 0.1, M.gold, 0, 0.1, -0.06, cock, 0.004);
  // the shutters on the apostles' windows: two leaves each, opening outwards
  O.shutters = [];
  for (const x of APW.xs) for (const s of [-1, 1]) {
    const hinge = grp(x + s * APW.w / 2, (APW.y0 + APW.y1) / 2, FZ - 0.02, g);
    const leaf = grp(0, 0, 0, hinge); bev(APW.w / 2, APW.y1 - APW.y0 - 0.02, 0.03, std({ color: 0x2a3a2e, roughness: 0.6 }), -s * APW.w / 4, 0, -0.015, leaf, 0.004);
    for (const yy of [-0.25, 0.0, 0.25]) bev(APW.w / 2 - 0.02, 0.02, 0.01, M.gold, -s * APW.w / 4, yy, -0.034, leaf, 0.002);
    hinge.userData.s = s; O.shutters.push(hinge);
  }
  // the great dial: the same face as the little one inside, two metres across, with its zodiac ring and hands
  O.bigDial = grp(POS.dialBack.x, POS.dialBack.y, FZ - 0.03, g); O.bigDial.rotation.y = Math.PI;
  const BR = 1.45;
  O.bigFace = new THREE.Mesh(new THREE.CircleGeometry(BR, 96), std({ map: T.dialTex, roughness: 0.45, metalness: 0.15, envMapIntensity: 0.8 })); O.bigDial.add(O.bigFace);
  const bb = new THREE.Mesh(new THREE.TorusGeometry(BR + 0.04, 0.05, 10, 96), M.gold); O.bigDial.add(bb);
  O.bigZod = new THREE.Mesh(new THREE.RingGeometry(BR * 0.46, BR * 0.65, 96, 1), std({ map: T.zodTex, transparent: true, metalness: 0.9, roughness: 0.32 })); O.bigZod.position.z = 0.01; O.bigDial.add(O.bigZod);
  O.bigSun = grp(0, 0, 0.03, O.bigDial); bev(0.05, BR * 0.8, 0.012, M.gold, 0, BR * 0.4, 0, O.bigSun, 0.004); const bsun = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), std({ map: T.sunTex, metalness: 1, roughness: 0.3, transparent: true })); bsun.position.set(0, BR * 0.555, 0.01); O.bigSun.add(bsun); bev(0.07, 0.15, 0.012, M.gold, 0, BR * 0.8, 0.006, O.bigSun, 0.004);
  O.bigMoon = grp(0, 0, 0.05, O.bigDial); bev(0.03, BR * 0.6, 0.01, M.steel, 0, BR * 0.3, 0, O.bigMoon, 0.003); const bm = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), std({ color: 0xd8d8d0, metalness: 1, roughness: 0.3 })); bm.position.set(0, BR * 0.555, 0.03); O.bigMoon.add(bm);
  // the calendar plate below
  O.bigCal = grp(POS.dialBack.x, -2.3, FZ - 0.03, g); O.bigCal.rotation.y = Math.PI;
  const cf = new THREE.Mesh(new THREE.CircleGeometry(1.2, 96), std({ map: T.calTex, roughness: 0.55 })); O.bigCal.add(cf);
  const cb = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.04, 8, 96), M.gold); O.bigCal.add(cb);
  // Death, at the dial's right hand as you face it from the square (the -x side of the wall outside): a skeleton with an hourglass and a bell rope
  O.deathFig = grp(-1.95, 1.0, FZ - 0.25, g); O.deathFig.rotation.y = Math.PI;
  { const bone = std({ color: 0xd8d0b8, roughness: 0.6 }), parts = [], add = (geo, color, mm) => parts.push({ geo, color, m: mm });
    add(new THREE.SphereGeometry(0.1, 14, 10), 0xd8d0b8, m4(0, 1.02, 0, 0, 0, 0, 0.9, 1.05, 1)); add(new THREE.SphereGeometry(0.03, 8, 6), 0x080606, m4(-0.035, 1.04, 0.075)); add(new THREE.SphereGeometry(0.03, 8, 6), 0x080606, m4(0.035, 1.04, 0.075));
    add(new THREE.BoxGeometry(0.06, 0.03, 0.05), 0xd8d0b8, m4(0, 0.94, 0.05));
    for (let i = 0; i < 6; i++) add(new THREE.TorusGeometry(0.1 - i * 0.006, 0.008, 6, 14, Math.PI * 1.4), 0xd8d0b8, m4(0, 0.82 - i * 0.05, 0, Math.PI / 2, 0, -Math.PI * 0.2));
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), 0xd8d0b8, m4(0, 0.62, -0.03));
    for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.012, 0.01, 0.6, 6), 0xd8d0b8, m4(sx * 0.07, 0.1, 0)); add(new THREE.CylinderGeometry(0.012, 0.01, 0.5, 6), 0xd8d0b8, m4(sx * 0.16, 0.66, 0.04, 0, 0, sx * 0.2)); }
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), 0xc8a050, m4(-0.22, 0.42, 0.08)); add(new THREE.CylinderGeometry(0.004, 0.004, 0.9, 4), 0x5a4a34, m4(0.22, 0.85, 0.06));
    const dm = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 0.6 })); dm.castShadow = true; O.deathFig.add(dm); }
  // the scaffold the restorers have started to put up: tubes, a plank walk just under the windows, a ladder down
  O.scaf = grp(0, 0, 0, g);
  const tubeM = std({ color: 0x8a8a86, metalness: 0.8, roughness: 0.4 }), plank = std({ map: T.wood, color: 0xb8a080, roughness: 0.85 });
  for (const x of [-2.4, -0.9, 0.6, 2.1]) for (const z of [FZ - 0.25, FZ - 1.15]) { const t = cyl(0.024, 0.024, 12.4, tubeM, x, -1.9, z, O.scaf, 8); t.castShadow = false; }
  for (const y of [-6.0, -3.6, -1.2, APW.y0 - 0.32, 4.6]) for (const z of [FZ - 0.25, FZ - 1.15]) { const t = cyl(0.022, 0.022, 4.7, tubeM, -0.15, y, z, O.scaf, 8); t.rotation.z = Math.PI / 2; t.castShadow = false; }
  for (let i = 0; i < 4; i++) bev(4.6, 0.04, 0.22, plank, -0.15, APW.y0 - 0.28, FZ - 0.36 - i * 0.24, O.scaf, 0.006);
  for (let i = 0; i < 4; i++) bev(4.6, 0.04, 0.22, plank, -0.15, -1.16, FZ - 0.36 - i * 0.24, O.scaf, 0.006);
  { const lg = grp(2.0, -1.16, FZ - 0.9, O.scaf); lg.rotation.x = -0.22; for (const s of [-1, 1]) bev(0.05, 4.0, 0.06, std({ color: 0x9a9a96, metalness: 0.7, roughness: 0.4 }), s * 0.2, 2.0, 0, lg, 0.006); for (let i = 1; i < 13; i++) { const r = cyl(0.014, 0.014, 0.4, tubeM, 0, i * 0.3, 0, lg, 6); r.rotation.z = Math.PI / 2; } }
  // the restorers' banner on the scaffold
  O.banner = plane(1.6, 0.5, std({ map: T.bannerTex, roughness: 0.8, side: THREE.DoubleSide }), 0.9, -2.0, FZ - 1.17, Math.PI, O.scaf);
  // the square: cobbles under snow, a lamp or two, the houses opposite, Týn church, the sky
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(300, 80), std({ map: T.cobbleTex, roughness: 0.9 })); sq.rotation.x = -Math.PI / 2; sq.position.set(0, -8.2, -42); g.add(sq);
  O.back = plane(150, 60, new THREE.MeshBasicMaterial({ map: T.squareTex, color: 0xffffff, fog: false }), -12, 14, -78, 0, g); O.back.userData.noRay = true;
  // more houses either side (the right-hand part of the same painting, without the church), so a wide phone screen never sees the edge
  { const t2 = T.squareTex.clone(); t2.repeat.set(0.6, 1); t2.offset.set(0.38, 0); t2.needsUpdate = true;
    for (const [x, ry] of [[-87 - 44, 0.35], [63 + 44, -0.35]]) { const sp = plane(90, 60, new THREE.MeshBasicMaterial({ map: t2, color: 0xffffff, fog: false }), x, 14, -78 + 15, ry, g); sp.userData.noRay = true; } }
  O.sky = plane(400, 140, new THREE.MeshBasicMaterial({ color: 0x080a12, fog: false }), 0, 40, -120, 0, g); O.sky.userData.noRay = true;
  O.lamps = [];
  for (const [x, z] of [[-5, -12], [6, -16], [-12, -26]]) { const lp = grp(x, -8.2, z, g); cyl(0.07, 0.1, 4.2, std({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 }), 0, 2.1, 0, lp, 10); lathe([[0.001, 0], [0.18, 0.05], [0.14, 0.4], [0.001, 0.45]], std({ color: 0x1a1a1a, metalness: 0.5 }), 0, 4.2, 0, lp, 8); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); gl.scale.set(2.2, 2.2, 1); gl.position.y = 4.4; lp.add(gl); layer1(gl); O.lamps.push(gl); }
  // snow, drifting down past the windows
  O.snow = [];
  for (let i = 0; i < 320; i++) { const s = new THREE.Sprite(M.snowS); const k = rand(0.025, 0.06); s.scale.set(k, k, 1); s.position.set(rand(-7, 6), rand(-8, 7), FZ - rand(0.3, 9)); s.userData.v = rand(0.3, 0.7); s.userData.ph = rand(0, TAU); layer1(s); g.add(s); O.snow.push(s); }
  O.out.traverse(o => { if (o.isMesh) o.castShadow = false; });
}

/* ---------------- the blind clockmaker ---------------- */
// a tall gaunt man in a long dark gown and a leather apron, bare-headed, his eyes burned out; the head is on its own neck pivot.
// Kept dark on purpose: a grey shape that the light only just finds.
function hanus() {
  const root = new THREE.Group(), body = [], head = [], add = (arr, geo, color, mm) => arr.push({ geo, color, m: mm });
  const L2 = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const gown = 0x0c0b0a, skin = 0x37332d, dark = 0x1c1a17, apron = 0x1e140c;
  add(body, L2([[0.001, 0], [0.27, 0], [0.25, 0.04], [0.21, 0.45], [0.18, 0.95], [0.19, 1.22], [0.2, 1.38], [0.15, 1.47], [0.06, 1.52], [0.001, 1.53]], 22), gown, m4(0, 0, 0, 0.06, 0, 0, 1, 1, 0.68));
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; add(body, new THREE.BoxGeometry(0.07, rand(0.06, 0.18), 0.01), gown, m4(Math.sin(a) * 0.26, 0.02, Math.cos(a) * 0.18, 0, a, rand(-0.25, 0.25))); }
  add(body, new THREE.BoxGeometry(0.3, 0.7, 0.02), apron, m4(0, 0.85, 0.13, -0.06, 0, 0));
  // hunched shoulders and long arms, hanging a little forward, the fingers too long
  for (const sx of [-1, 1]) {
    add(body, new THREE.SphereGeometry(0.07, 10, 8), gown, m4(sx * 0.17, 1.42, 0.03, 0, 0, 0, 1, 0.8, 1));
    add(body, L2([[0.001, 0], [0.032, 0], [0.036, 0.1], [0.038, 0.4], [0.046, 0.6], [0.052, 0.68], [0.04, 0.71], [0.001, 0.72]], 12), gown, m4(sx * 0.2, 0.72, 0.06, -0.12, 0, sx * 0.05, 1, 1, 0.9));
    add(body, new THREE.CylinderGeometry(0.018, 0.016, 0.1, 8), skin, m4(sx * 0.205, 0.69, 0.1, -0.12, 0, 0));
    add(body, new THREE.SphereGeometry(0.034, 10, 8), skin, m4(sx * 0.205, 0.62, 0.11, 0, 0, 0, 0.8, 1.3, 0.5));
    for (let f = 0; f < 4; f++) { const fx = sx * 0.205 + (f - 1.5) * 0.012; add(body, new THREE.CylinderGeometry(0.0055, 0.0045, 0.13, 6), skin, m4(fx, 0.52, 0.125 + f * 0.002, 0.22, 0, 0)); add(body, new THREE.CylinderGeometry(0.0045, 0.0035, 0.065, 6), dark, m4(fx, 0.43, 0.155, 0.75, 0, 0)); }
  }
  add(body, new THREE.CylinderGeometry(0.04, 0.05, 0.16, 10), skin, m4(0, 1.57, 0.04, 0.3, 0, 0));
  add(body, L2([[0.22, 1.36], [0.2, 1.44], [0.16, 1.52], [0.12, 1.6], [0.11, 1.66]], 20), gown, m4(0, 0, 0.0, 0, 0, 0, 1, 1, 0.82));   // the cowl of his hood, over the shoulders
  // the head, round a neck pivot at y 1.64: a long skull, sunken cheeks, the jaw hanging open, burned sockets
  add(head, new THREE.SphereGeometry(0.1, 22, 18), skin, m4(0, 0.11, 0, 0, 0, 0, 0.84, 1.2, 0.98));
  add(head, new THREE.SphereGeometry(0.06, 14, 10), skin, m4(0, 0.155, 0.055, 0, 0, 0, 1.25, 0.32, 0.6));            // brow ridge
  for (const sx of [-1, 1]) {
    add(head, new THREE.SphereGeometry(0.027, 12, 10), 0x020101, m4(sx * 0.036, 0.122, 0.07, 0, 0, 0, 1.15, 0.9, 0.7));   // the burned sockets
    add(head, new THREE.TorusGeometry(0.026, 0.006, 6, 14), 0x3a0e0a, m4(sx * 0.036, 0.122, 0.078, 0, 0, 0, 1.15, 0.9, 1));
    add(head, new THREE.SphereGeometry(0.03, 10, 8), 0x22201c, m4(sx * 0.058, 0.055, 0.058, 0, 0, 0, 0.8, 1.3, 0.55));     // hollow cheeks
    add(head, new THREE.SphereGeometry(0.02, 8, 6), skin, m4(sx * 0.085, 0.1, -0.005, 0, 0, 0, 0.5, 1, 0.8));            // ears
  }
  add(head, new THREE.ConeGeometry(0.014, 0.05, 6), skin, m4(0, 0.085, 0.092, Math.PI / 2 + 0.25, 0, 0));
  add(head, new THREE.SphereGeometry(0.032, 10, 8), 0x050303, m4(0, 0.0, 0.07, 0, 0, 0, 0.9, 1.6, 0.5));              // the mouth, hanging open
  add(head, new THREE.SphereGeometry(0.05, 12, 8), skin, m4(0, -0.035, 0.03, 0.25, 0, 0, 0.8, 0.8, 0.9));             // long jaw
  add(head, new THREE.SphereGeometry(0.104, 16, 10, 0, TAU, 0, Math.PI * 0.45), 0x1c1a17, m4(0, 0.13, -0.012, -0.3, 0, 0, 0.86, 1.12, 1.0));   // what's left of his hair
  // his hood, up: open at the front, so the face sits back in it, in its shadow
  add(head, new THREE.SphereGeometry(0.135, 22, 14, Math.PI / 2 + 0.72, TAU - 1.44, 0, Math.PI * 0.74), gown, m4(0, 0.115, -0.008, -0.12, 0, 0, 0.98, 1.15, 1.08));
  const vc = () => std({ vertexColors: true, roughness: 0.9, envMapIntensity: 0.1, side: THREE.DoubleSide });
  const bm = new THREE.Mesh(mergeParts(body), vc()); bm.castShadow = true; root.add(bm);
  const neck = new THREE.Group(); neck.position.set(0, 1.64, 0.06); root.add(neck);
  const hm = new THREE.Mesh(mergeParts(head), vc()); hm.castShadow = true; neck.add(hm);
  // lank grey hair hanging from the back and sides of the skull
  const hairM = std({ color: 0x3a3834, map: T.hairTex, alphaMap: T.hairTex, alphaTest: 0.3, roughness: 0.7, side: THREE.DoubleSide });
  for (const [x, z, ry, l] of [[-0.075, 0.03, -Math.PI / 2 + 0.25, 0.34], [0.075, 0.03, Math.PI / 2 - 0.25, 0.3]]) {
    const gg = new THREE.PlaneGeometry(0.1, l, 1, 6); gg.translate(0, -l / 2, 0); const m = new THREE.Mesh(gg, hairM); m.position.set(x, 0.2, z); m.rotation.set(0.12, ry, 0); m.castShadow = true; neck.add(m);
  }
  root.userData.neck = neck; root.userData.body = bm; root.userData.head = hm;
  root.userData.chest = new THREE.Object3D(); root.userData.chest.position.set(0, 1.35, 0); root.add(root.userData.chest);
  noRay(root);
  return root;
}
function buildHim() {
  O.han = hanus(); O.han.visible = false; O.han.userData.keep = true; scene.add(O.han);
  // the face, for the moment he finds you: filling your eyes, the burned holes where his eyes were
  O.face = grp(0, 0, 0); O.face.visible = false; camera.add(O.face);
  const fg = new THREE.PlaneGeometry(0.27, 0.405, 18, 24); const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setZ(i, -x * x * 2.2 - y * y * 0.5); }
  fg.computeVertexNormals();
  O.faceMat = new THREE.MeshBasicMaterial({ map: T.faceTex, fog: false, transparent: true });
  O.face.add(new THREE.Mesh(fg, O.faceMat));
  for (let i = 0; i < 7; i++) { const st = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.002, 0.004), 0.4), new THREE.MeshBasicMaterial({ color: 0x3a3836, fog: false, transparent: true, opacity: 0.8 })); st.position.set(rand(-0.11, 0.11), rand(0.0, 0.12), rand(0.01, 0.04)); st.rotation.z = rand(-0.15, 0.15); O.face.add(st); }
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, transparent: true })); bk.position.set(0, 0, -0.12); O.face.add(bk);
  O.face.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; if (c.material) { c.material.depthTest = false; c.material.depthWrite = false; c.renderOrder = c === bk ? 20 : c.geometry === fg ? 21 : 22; } });
  // his hand, closing round yours: long grey burned fingers, from below and in front
  O.hand = grp(0.05, -0.12, -0.32); O.hand.visible = false; camera.add(O.hand);
  const hs = std({ color: 0x8a847a, roughness: 0.65, envMapIntensity: 0.12 }), burn = std({ color: 0x241410, roughness: 0.85 }), nail = std({ color: 0x1a1412, roughness: 0.35 });
  { const palm = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), hs); palm.scale.set(1, 0.4, 1.25); palm.position.z = 0.06; O.hand.add(palm);
    // a thin grey wrist, then the long black sleeve of his gown running back out of sight
    const wrist = cyl(0.022, 0.026, 0.16, hs, 0, 0, 0.16, O.hand, 10); wrist.rotation.x = Math.PI / 2;
    const slv = cyl(0.034, 0.05, 0.9, std({ color: 0x0c0b0a, roughness: 0.95 }), 0, 0.004, 0.66, O.hand, 12); slv.rotation.x = Math.PI / 2; }
  for (let i = 0; i < 4; i++) {
    const f = grp(-0.026 + i * 0.0175, 0.004, 0.02, O.hand); f.rotation.set(0.2, 0, (i - 1.5) * 0.06);
    const l1 = 0.07 - Math.abs(i - 1.5) * 0.007, l2 = 0.055 - Math.abs(i - 1.5) * 0.005;
    const s1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, l1, 4, 8), i === 1 ? burn : hs); s1.rotation.x = Math.PI / 2; s1.position.z = -l1 / 2; f.add(s1);
    const k = grp(0, 0, -l1, f); k.rotation.x = -0.7; const s2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0068, l2, 4, 8), hs); s2.rotation.x = Math.PI / 2; s2.position.z = -l2 / 2; k.add(s2);
    const tip = grp(0, 0, -l2, k); tip.rotation.x = -0.5; const s3 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.022, 4, 8), hs); s3.rotation.x = Math.PI / 2; s3.position.z = -0.013; tip.add(s3); bev(0.009, 0.003, 0.014, nail, 0, 0.004, -0.024, tip, 0.001);
  }
  const th = grp(0.04, 0.0, 0.05, O.hand); th.rotation.set(0.3, 0.6, 0.4); const t1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.045, 4, 8), hs); t1.rotation.x = Math.PI / 2; t1.position.z = -0.025; th.add(t1);
  O.hand.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; });
  // your own hand, holding the pin into the clutch (only in that close view)
  O.myHand = grp(-0.06, -0.1, -0.3); O.myHand.visible = false; camera.add(O.myHand);
  const mine = std({ color: 0x5a5e66, roughness: 0.85, envMapIntensity: 0.2 }), sleeve = std({ color: 0x262c38, roughness: 0.95 });
  { const palm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), mine); palm.scale.set(1, 0.42, 1.15); palm.position.z = 0.05; O.myHand.add(palm);
    const cuff = cyl(0.045, 0.05, 0.12, sleeve, 0, -0.004, 0.15, O.myHand, 14); cuff.rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) { const f = grp(-0.027 + i * 0.018, 0.004, 0.0, O.myHand); f.rotation.set(-0.35, 0, (i - 1.5) * 0.05); const l1 = 0.04 - Math.abs(i - 1.5) * 0.004; const s1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, l1, 4, 8), mine); s1.rotation.x = Math.PI / 2; s1.position.z = -l1 / 2; f.add(s1); const k = grp(0, 0, -l1, f); k.rotation.x = -0.9; const s2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, 0.025, 4, 8), mine); s2.rotation.x = Math.PI / 2; s2.position.z = -0.016; k.add(s2); }
    const th = grp(0.04, -0.005, 0.03, O.myHand); th.rotation.set(-0.2, 0.7, 0.3); const t1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.035, 4, 8), mine); t1.rotation.x = Math.PI / 2; t1.position.z = -0.02; th.add(t1); }
  O.myPin = cyl(0.006, 0.006, 0.1, M.brassBright, 0.0, -0.012, -0.03, O.myHand, 8); O.myPin.rotation.z = Math.PI / 2;
  O.myHand.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; });
}

/* ---------------- lights ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x6a7890, 0x1a1612, 0.05); scene.add(L.hemi);
  // your headlamp: a warm LED spot riding just above your eyes
  L.head = new THREE.SpotLight(0xfff0dc, 0, 13, 0.55, 0.6, 1.6); L.head.position.set(0.0, 0.07, 0.02); camera.add(L.head);
  L.head.target.position.set(0, -0.03, -1); camera.add(L.head.target);
  L.head.castShadow = true; L.head.shadow.mapSize.set(IS_TOUCH ? 512 : 1024, IS_TOUCH ? 512 : 1024); L.head.shadow.bias = -0.0015; L.head.shadow.normalBias = 0.02; L.head.shadow.camera.near = 0.08; L.head.shadow.camera.far = 12;
  // the restorers' work lamp: a cold battery panel on a tripod, aimed at the back of the clock
  L.work = new THREE.SpotLight(0xe6eeff, 0, 10, 0.75, 0.6, 1.6); L.work.position.set(POS.light.x, 1.75, POS.light.z); L.work.target.position.set(-0.2, 1.15, 0.55); scene.add(L.work); scene.add(L.work.target);
  if (!IS_TOUCH) { L.work.castShadow = true; L.work.shadow.mapSize.set(1024, 1024); L.work.shadow.bias = -0.002; L.work.shadow.normalBias = 0.02; L.work.shadow.camera.near = 0.2; L.work.shadow.camera.far = 9; }
  L.workFill = new THREE.PointLight(0xdfe8ff, 0, 6, 2); L.workFill.position.set(1.4, 2.4, 1.6); scene.add(L.workFill);
  // the town's light, blue-orange, through the little window and the apostles' windows
  L.win = new THREE.PointLight(0x8090c0, 0, 4.5, 2); L.win.position.set(SIDEWIN.x, 1.7, RM.z0 + 0.3); scene.add(L.win);
  L.apw = new THREE.PointLight(0x8a94c0, 0, 3.5, 2); L.apw.position.set(-0.4, 3.1, RM.z0 + 0.25); scene.add(L.apw);
  // outside: a street lamp's sodium glow on the tower, and the night sky
  L.street = new THREE.PointLight(0xffa860, 0, 40, 1.4); L.street.position.set(-3, -3.5, -12); scene.add(L.street);
  L.moon = new THREE.DirectionalLight(0x8090b8, 0); L.moon.position.set(10, 20, -30); L.moon.target.position.set(0, 0, -3); scene.add(L.moon); scene.add(L.moon.target);
  // the drum, lit faintly from its windows
  L.drum = new THREE.PointLight(0xa0a8d0, 0, 1.6, 2); L.drum.position.set(HOUS.x, LOFT.y + 0.7, HOUS.z - 0.2); scene.add(L.drum);
  L.rim = new THREE.PointLight(0x5a6aa8, 0, 2.6, 2); scene.add(L.rim);
}

/* =====================================================================
   THE BLIND HOUR · part D: items, documents, things heard, hints, the painted things
   (both dials, the zodiac ring, the count wheel, the calendar plate, the tower face, the square, his face)
   ===================================================================== */
const TONIGHT = '8 January 2018';
const VM_TEXT = '"Hi, it\'s Tomáš. We locked up at ten. The watchman has the key until six. I hope you\'re not still up there. Listen. Old Kroupa made us promise: if anyone\'s up in the works while she\'s stopped, keep quiet. The old master is blind. He finds you by sound. But when a bell rings, he stands still, and he counts the strokes. So anything noisy, do it while a bell is ringing. Crazy old man. Six o\'clock."';
// the voicemail's subtitles come up a sentence or two at a time, with the recording
const VM_PARTS = [[0, 'Hi, it\'s Tomáš. We locked up at ten. The watchman has the key until six. I hope you\'re not still up there.'], [10.1, 'Listen. Old Kroupa made us promise: if anyone\'s up in the works while she\'s stopped, keep quiet.'], [18.5, 'The old master is blind. He finds you by sound. But when a bell rings, he stands still, and he counts the strokes.'], [28.9, 'So anything noisy, do it while a bell is ringing. Crazy old man. Six o\'clock.']];
const ITEMS = {
  phone: { name: 'Your phone', short: 'Phone', desc: 'Three per cent battery and no signal up here: the tower walls are a metre and a half thick. One voicemail, from Tomáš, at 22:14.' },
  crowbar: { name: 'Crowbar', short: 'Crowbar', desc: 'A short steel crowbar from the restorers\' bench, the red paint worn off the claw. Good for prising up nailed boards. Not quietly.' },
  key: { name: 'Iron key', short: 'Key', desc: 'A plain iron key on a loop of wire. It was hanging on St Peter\'s gilded keys.' },
  crank: { name: 'Winding crank', short: 'Crank', desc: 'A heavy iron crank with a square socket and a wooden handle, worn smooth by a hundred and fifty years of keepers\' hands. It fits a winding square.' },
  pin: { name: 'Brass pin', short: 'Pin', desc: 'A brass pin as long as your finger, filed square at one end and engraved with twelve tiny figures. The apostles\' pin: it couples their wheel to the strike.' },
};
const HEARD = {
  vm: { title: 'Voicemail from Tomáš, 22:14', text: VM_TEXT },
  rule: { title: 'The rule', text: 'He is blind, and he finds you by sound. While a bell is ringing he stands still and counts the strokes, so that is the only time you can make a noise. Anything marked "loud": do it while the bell sign is showing at the top of the screen.' },
  count: { title: 'At midnight, as Týn struck twelve', text: 'A grey figure standing in the works, head on one side, whispering each stroke in Czech: "Jedna... dvě... tři..." all the way to "Dvanáct." Twelve. On the last stroke the light stuttered, and he was gone.' },
  kdo: { title: 'When you made a noise', text: 'A whisper, close: "Kdo je tam?" Who\'s there?' },
  watch: { title: 'At the stair door', text: 'Knocking, and a man\'s voice in Czech: "Haló? Je tam nahoře někdo?" (Hello? Is somebody up there?) ... "To jsem já, hlídač. Otevřete mi." (It\'s me, the watchman. Open up for me.) ... Then, at the keyhole, a whisper: "Slyším tě." (I can hear you.)' },
  dech: { title: 'In the dark', text: 'A whisper, inches from your face: "Slyším tvůj dech." I can hear your breath.' },
};

/* ---------------- documents: two short ones, both optional ---------------- */
const DOCS = {
  book: { title: 'The keepers\' book (on the lectern)', style: 'okbook', pages: [
    `<p class="okh">Kniha hodinářů &middot; The Keepers' Book</p>
     <p class="okfell"><b>The rules of the keepers.</b> &mdash; Jan Brabec, keeper, 1866</p>
     <ol class="okrules"><li>He cannot see. He hears. Make no sound up here that you need not make.</li>
     <li>When a bell strikes, he stands where he is and counts the strokes. Do your loud work then, and only then.</li>
     <li>If she stops, go down, and do not come up into the works again until she is going.</li></ol>
     <p class="okink">In 1490 the councillors put out the eyes of Master Hanuš, who made her, so that he should never make her like again. Blind, he had himself led up here, put his hands into the works and stopped her. They say he never went down.</p>
     <p class="okink">1948. When the hall burned she stopped, and he came for me. I made her strike slow, and while he stood and counted I went out between the apostles, through their window. &mdash; K.&nbsp;Brož</p>`] },
  sheet: { title: 'Restorers\' notes (clipboard on the bench)', style: 'osheet', pages: [
    `<div class="osh"><b>STAROMĚSTSKÝ ORLOJ &middot; RESTORATION 2018</b><span>Day 1 &middot; Monday 8 January &middot; T. Šimek</span></div>
     <p>Clock stopped 11:00. Dismantling starts tomorrow. Nothing leaves the tower tonight.</p>
     <ul class="oshn">
     <li>Strike train: weight run right down.</li>
     <li>Winding cover LOCKED. Kroupa says the key hangs on St Peter's keys. On the apostle?!</li>
     <li>Winding crank and pendulum: packed in crate 3, nailed.</li>
     <li>Apostles' clutch, top of frame: pin missing.</li>
     <li>Fly vanes: narrow (Hainz, 1866).</li></ul>`] },
};

/* ---------------- hints ---------------- */
const crankIn = s => !!s.crankTaken || s.inv.includes('crank');
const HINTS = [
  { id: 'start', title: 'Getting out', when: s => s.flags.escaped ? 'solved' : 'active', tiers: [
    'The stair door is locked from outside until six. The only other way out is through the apostles\' windows, up on the loft, over the square.',
    'Those windows only open while the clock strikes and the apostles go round.',
    'The restorers\' notes on the bench say what\'s wrong with her: the strike isn\'t wound, and the apostles\' pin is missing.',
    'Wind the strike, fit the pin, then turn the hands to the next hour. While she strikes, go up the ladder and out through the drum.' ] },
  { id: 'rule', title: 'Something that hears', when: s => !(s.flags.counted || s.ev.warned) ? 'hidden' : s.flags.loudOk ? 'solved' : 'active', tiers: [
    'He\'s blind. He finds you by sound.',
    'While a bell is ringing, he stands still and counts the strokes.',
    'Týn church across the square rings every quarter of an hour. While a bell rings, a bell sign shows at the top of the screen.',
    'Only do things marked "loud" while the bell sign is showing.' ] },
  { id: 'key', title: 'The locked cover', when: s => !(s.flags.coverSeen || s.flags.clipRead || s.flags.doorSeen || s.keyTaken) ? 'hidden' : s.keyTaken ? 'solved' : 'active', tiers: [
    'The winding cover on the back of the clock is locked. The tag on it says the key hangs on St Peter\'s keys.',
    'St Peter is one of the twelve carved apostles, on the wheel inside the painted drum up on the loft.',
    'Turn the handwheel beside the drum (loud) and look in at the little door: each turn brings the next apostle round.',
    'Keep turning until the saint holding two gilded keys stands in the door. An iron key hangs on them. Take it.' ] },
  { id: 'crank', title: 'A crank', when: s => !(s.flags.squareSeen || s.flags.clipRead || s.coverOpen) ? 'hidden' : crankIn(s) ? 'solved' : 'active', tiers: [
    'Winding the strike needs a crank.',
    'The restorers packed it in crate 3, the pine crate by the right-hand wall.',
    'The crate is nailed shut. There\'s a crowbar on the restorers\' bench.',
    'Take the crowbar, and prise the crate\'s lid off while a bell is ringing (it\'s loud). The crank is inside.' ] },
  { id: 'wind', title: 'Winding the strike', when: s => !(s.coverOpen || crankIn(s)) ? 'hidden' : s.wound >= WIND_N ? 'solved' : 'active', tiers: [
    'The strike\'s weight has run right down. It has to be wound up again before she can strike.',
    'The winding square is behind the iron cover, low on the back of the clock. St Peter\'s key unlocks it.',
    'The crank fits the square. Every turn is loud.',
    'Turn the crank only while a bell is ringing, until she\'s fully wound: six turns.' ] },
  { id: 'pin', title: 'The missing pin', when: s => !(s.flags.clutchSeen || s.flags.clipRead || s.flags.pinSeen) ? 'hidden' : s.pinTaken ? 'solved' : 'active', tiers: [
    'The apostles\' clutch, on top of the clock, is missing its pin.',
    'Something small and brass glints far down the weight shaft, in the back left corner, on top of the strike weight.',
    'It\'s much too deep to reach. But winding the strike hauls that weight up the shaft.',
    'Wind the strike all the way, then go to the rail round the shaft and reach down for the pin.' ] },
  { id: 'clutch', title: 'Up on the clock', when: s => !s.pinTaken ? 'hidden' : s.pinIn ? 'solved' : 'active', tiers: [
    'The pin goes in the apostles\' clutch, on top of the clock\'s iron frame.',
    'It\'s too high to reach from the floor. You need something to stand on, right next to the clock.',
    'The restorers\' crate can be dragged: E takes hold of it, E again lets go.',
    'Drag the crate against the back of the clock, jump onto it (Space, or the Jump button) and fit the pin into the clutch.' ] },
  { id: 'fly', title: 'Too fast', when: s => !s.flags.fastSeen ? 'hidden' : s.fly === 'wide' ? 'solved' : 'active', tiers: [
    'She struck far too fast: the windows were open for only a few seconds.',
    'What sets her speed is the fly: two brass vanes spinning on top of the clock.',
    'Edge-on, the vanes slice the air and she races. Face-on, they hold her back.',
    'Stand on the crate by the back of the clock and turn the fly\'s vanes face-on. Then turn the hands again.' ] },
  { id: 'out', title: 'Out of the window', when: s => !(s.pinIn && s.wound >= WIND_N) ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'With the strike wound and the pin in, turning the hands to the next hour makes her strike.',
    'The hands turn with the little brass crank beside the setting dial, on the back of the clock.',
    'While she strikes he stands still and counts, and the apostles\' windows are open.',
    'Turn the hands on, then go straight up the ladder to the little door in the drum and squeeze between the apostles to the open window. Don\'t stop.' ] },
  { id: 'still', title: 'Don\'t move', when: s => !s.ev.still ? 'hidden' : 'solved', tiers: ['He finds you by sound.', 'Footsteps are enough.', 'Stand still until he has gone.', 'Don\'t move, and don\'t touch anything, until he goes.'] },
];
const WIND_N = 6;

/* ---------------- painted things ---------------- */
function paintThings() {
  T.dialTex = tex(canv(1024, 1024, (g, w) => paintDialFace(g, w))); T.dialTex.wrapS = T.dialTex.wrapT = THREE.ClampToEdgeWrapping;
  T.zodTex = tex(canv(1024, 1024, (g, w) => paintZodRing(g, w))); T.zodTex.wrapS = T.zodTex.wrapT = THREE.ClampToEdgeWrapping;
  T.sunTex = tex(canv(128, 128, (g, w) => { const c = w / 2; g.clearRect(0, 0, w, w); g.fillStyle = '#f2c860'; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(c + Math.cos(a - 0.12) * 34, c + Math.sin(a - 0.12) * 34); g.lineTo(c + Math.cos(a) * 62, c + Math.sin(a) * 62); g.lineTo(c + Math.cos(a + 0.12) * 34, c + Math.sin(a + 0.12) * 34); g.fill(); } const gr = g.createRadialGradient(c - 8, c - 8, 4, c, c, 36); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(1, '#c8902a'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, 36, 0, TAU); g.fill(); g.strokeStyle = '#7a5010'; g.lineWidth = 3; g.beginPath(); g.arc(c - 11, c - 6, 4, 0, TAU); g.arc(c + 11, c - 6, 4, 0, TAU); g.stroke(); g.beginPath(); g.arc(c, c + 6, 12, 0.3, Math.PI - 0.3); g.stroke(); }));
  T.countTex = tex(canv(512, 512, (g, w) => paintCountWheel(g, w)));
  T.calTex = tex(canv(1024, 1024, (g, w) => paintCalendar(g, w)));
  T.bookTex = tex(canv(512, 360, (g, w, h) => { g.fillStyle = '#e6dcc0'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(w / 2 - 30, 0, w / 2 + 30, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(60,40,20,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(w / 2 - 30, 0, 60, h); g.strokeStyle = 'rgba(30,30,60,0.75)'; g.lineWidth = 1.6; for (const x0 of [30, w / 2 + 24]) for (let y = 40; y < h - 30; y += 22) { g.beginPath(); let x = x0; g.moveTo(x, y); while (x < x0 + 200) { x += rand(4, 9); g.lineTo(x, y + rand(-3, 3)); } g.stroke(); } speckle(g, w, h, 600, 0.12, '90,60,30', 3); }));
  T.sheetTex = tex(canv(256, 340, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = '700 13px ' + MONO; g.fillText('ORLOJ 2018 - DAY 1', 14, 26); g.fillStyle = '#444'; for (let i = 0; i < 16; i++) g.fillRect(14, 44 + i * 17, rand(80, 220), 3); g.strokeStyle = '#1a3a9a'; g.lineWidth = 2; g.beginPath(); g.ellipse(170, 250, 40, 14, 0.1, 0, TAU); g.stroke(); }));
  T.facadeTex = tex(canv(1024, 1760, (g, w, h) => paintFacade(g, w, h)));
  T.squareTex = tex(canv(2048, 820, (g, w, h) => paintSquare(g, w, h, false)));
  T.cobbleTex = tex(pix(512, 512, (x, y) => { const cx = x / 26, cy = y / 22 + (Math.floor(x / 26) % 2) * 0.5, fx = cx - Math.floor(cx), fy = cy - Math.floor(cy), e = Math.min(fx, 1 - fx, fy, 1 - fy); const sn = tfbm(x, y, 512, 512, 4, 4); let c = e < 0.12 ? [40, 38, 36] : mixc([70, 66, 62], [104, 98, 92], tnoise(Math.floor(cx) * 3, Math.floor(cy) * 3, 256, 256)); if (sn > 0.5) c = mixc(c, [214, 220, 228], clamp((sn - 0.5) * 4, 0, 0.9)); return c; }), { repeat: [24, 16] });
  T.bannerTex = tex(canv(512, 160, (g, w, h) => { g.fillStyle = '#1a3a7a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f4f4'; g.font = '600 34px ' + ROMAN; g.textAlign = 'center'; g.fillText('OBNOVA ORLOJE', w / 2, 66); g.font = '400 24px ' + MONO; g.fillText('2018 · HLAVNÍ MĚSTO PRAHA', w / 2, 112); }));
  T.hairTex = tex(canv(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const x = rand(0, w), l = rand(h * 0.4, h); g.strokeStyle = `rgba(${irand(70, 120)},${irand(68, 112)},${irand(64, 104)},${rand(0.4, 0.95)})`; g.lineWidth = rand(0.6, 1.8); g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + rand(-6, 6), l / 2, x + rand(-10, 10), l); g.stroke(); } }));
  T.faceTex = tex(canv(512, 768, (g, w, h) => paintHisFace(g, w, h)));
}
// the dial face: night and day sky, the Roman ring, and her gold outer ring (24 at sunset)
function paintDialFace(g, S0) {
  const R = S0 / 2, c = S0 / 2, P = (r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)];
  g.clearRect(0, 0, S0, S0);
  g.fillStyle = '#060504'; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
  // the inner disc: blue sky above the horizon, dark below, a band of twilight
  g.save(); g.beginPath(); g.arc(c, c, R * 0.72, 0, TAU); g.clip();
  const sky = g.createLinearGradient(0, c - R * 0.72, 0, c); sky.addColorStop(0, '#3a6ea8'); sky.addColorStop(1, '#22528a'); g.fillStyle = sky; g.fillRect(0, 0, S0, S0);
  const hy = c + R * 1.53, hr = R * 1.99;
  g.fillStyle = '#7a4418'; g.beginPath(); g.arc(c, hy, hr + R * 0.075, 0, TAU); g.fill();
  const nt = g.createRadialGradient(c, hy, hr * 0.7, c, hy, hr); nt.addColorStop(0, '#0e0a08'); nt.addColorStop(1, '#2a1a10'); g.fillStyle = nt; g.beginPath(); g.arc(c, hy, hr, 0, TAU); g.fill();
  // the unequal hours: twelve gold curves fanning across the day sky
  g.strokeStyle = 'rgba(232,196,110,0.85)'; g.lineWidth = S0 / 380;
  for (let k = 1; k < 12; k++) { const t = k / 12, a0 = -1.05 + 2.1 * t; const [x0, y0] = [c + Math.sin(a0) * hr * 0.33, hy - Math.cos(a0) * hr]; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(c + (t - 0.5) * R * 0.9, c - R * 0.4, c + (t - 0.5) * R * 1.2, c - R * 0.74); g.stroke(); }
  g.fillStyle = 'rgba(240,210,130,0.9)'; g.font = `600 ${Math.round(S0 * 0.022)}px ${ROMAN}`; g.textAlign = 'center';
  for (let k = 1; k <= 12; k++) { const t = (k - 0.5) / 12; g.fillText(String(k), c + (t - 0.5) * R * 1.08, c - R * 0.6 + Math.abs(t - 0.5) * R * 0.1); }
  g.restore();
  // horizon words
  g.save(); g.fillStyle = '#e8c878'; g.font = `600 ${Math.round(S0 * 0.026)}px ${ROMAN}`; g.textAlign = 'center';
  const word = (txt, a, r, flip) => { const [x, y] = P(r, a); g.save(); g.translate(x, y); g.rotate(a + (flip ? Math.PI : 0)); g.fillText(txt, 0, 0); g.restore(); };
  word('ORTVS', -1.32, R * 0.52, false); word('OCCASVS', 1.32, R * 0.52, false); word('AVRORA', -1.72, R * 0.55, true); word('CREPVSCVLVM', 1.72, R * 0.55, true);
  g.restore();
  // the earth in the middle
  g.fillStyle = '#1a3a3a'; g.beginPath(); g.arc(c, c, R * 0.07, 0, TAU); g.fill(); g.strokeStyle = '#d8b050'; g.lineWidth = S0 / 300; g.stroke();
  // the Roman ring
  g.fillStyle = '#0d0b09'; g.beginPath(); g.arc(c, c, R * 0.86, 0, TAU); g.arc(c, c, R * 0.72, 0, TAU, true); g.fill();
  g.strokeStyle = '#c9a050'; g.lineWidth = S0 / 260; for (const r of [0.72, 0.725, 0.855, 0.86]) { g.beginPath(); g.arc(c, c, R * r, 0, TAU); g.stroke(); }
  g.fillStyle = '#e2b860'; g.font = `600 ${Math.round(S0 * 0.033)}px ${ROMAN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let h = 0; h < 24; h++) { const a = angHour(h), [x, y] = P(R * 0.79, a); g.save(); g.translate(x, y); g.rotate(a); g.fillText(ROMAN_N[h % 12], 0, 0); g.restore(); }
  // her ring: old Schwabacher numerals 1 to 24, with 24 where the sun sets
  g.fillStyle = '#060504'; g.beginPath(); g.arc(c, c, R * 0.995, 0, TAU); g.arc(c, c, R * 0.86, 0, TAU, true); g.fill();
  g.strokeStyle = '#c9a050'; g.lineWidth = S0 / 240; for (const r of [0.865, 0.99]) { g.beginPath(); g.arc(c, c, R * r, 0, TAU); g.stroke(); }
  for (let n = 1; n <= 24; n++) { const a = angOld(n), [x, y] = P(R * 0.928, a); drawNum(g, n, x, y, R * 0.085, '#f0c868', 10, a); const [tx, ty] = P(R * 0.93, a + Math.PI / 24); g.fillStyle = '#c9a050'; g.beginPath(); g.arc(tx, ty, S0 / 400, 0, TAU); g.fill(); }
  // age: grime and craquelure
  g.save(); g.globalCompositeOperation = 'multiply'; for (let i = 0; i < 60; i++) blot(g, rand(0, S0), rand(0, S0), rand(20, 90), 0.08, '90,70,40'); g.restore();
  speckle(g, S0, S0, 2500, 0.12, '20,15,10', 2);
}
// the zodiac ring, drawn to fit a RingGeometry (inner/outer 0.46/0.65 of the dial radius)
function paintZodRing(g, S0) {
  const R = S0 / 2, c = S0 / 2, ri = R * (0.46 / 0.65), P = (r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)];
  g.clearRect(0, 0, S0, S0);
  const gr = g.createRadialGradient(c, c, ri, c, c, R); gr.addColorStop(0, '#b8862a'); gr.addColorStop(0.5, '#f0cc70'); gr.addColorStop(1, '#a87a24');
  g.fillStyle = gr; g.beginPath(); g.arc(c, c, R * 0.985, 0, TAU); g.arc(c, c, ri * 1.01, 0, TAU, true); g.fill();
  g.strokeStyle = '#3a2408'; g.lineWidth = S0 / 260; for (const r of [ri * 1.01, R * 0.985]) { g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke(); }
  for (let k = 0; k < 12; k++) {
    const a0 = signAngLocal(k) + Math.PI / 12; const [x0, y0] = P(ri, a0), [x1, y1] = P(R * 0.985, a0); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    const a = signAngLocal(k), [gx, gy] = P((ri + R) / 2 + R * 0.03, a); drawZod(g, k, gx, gy, S0 * 0.075, '#2a1806', 8, a);
    g.save(); const [tx, ty] = P((ri + R) / 2 - R * 0.085, a); g.translate(tx, ty); g.rotate(a); g.fillStyle = '#3a2408'; g.font = `600 ${Math.round(S0 * 0.02)}px ${ROMAN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ZLAT[k], 0, 0); g.restore();
  }
  speckle(g, S0, S0, 1200, 0.1, '60,40,10', 2);
}
// the count wheel: 24 old numerals round the edge, clockwise; the click at the top shows the next strike
function paintCountWheel(g, S0) {
  const R = S0 / 2, c = S0 / 2, P = (r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)];
  const gr = g.createRadialGradient(c - R * 0.3, c - R * 0.3, R * 0.1, c, c, R); gr.addColorStop(0, '#e2c27a'); gr.addColorStop(1, '#8a6a30'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
  g.fillStyle = '#1a1208'; g.beginPath(); g.arc(c, c, R * 0.55, 0, TAU); g.fill();
  g.strokeStyle = '#4a3410'; g.lineWidth = 3; for (let n = 0; n < 24; n++) { const a = n * Math.PI / 12 + Math.PI / 24, [x0, y0] = P(R * 0.6, a), [x1, y1] = P(R * 0.98, a); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  for (let n = 1; n <= 24; n++) { const a = (n - 1) * Math.PI / 12, [x, y] = P(R * 0.8, a); drawNum(g, n, x, y, R * 0.16, '#24180a', 10, a); }
  for (let n = 1; n <= 24; n++) { const a = (n - 1) * Math.PI / 12, [x, y] = P(R * 0.62, a); g.fillStyle = '#e8c070'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
  speckle(g, S0, S0, 900, 0.15, '40,30,10', 2);
}
// the calendar plate, as the restorers photographed it: Jan 1 at the top, the year going round clockwise
const NAMEDAYS = [[1, 1, 'Nový rok'], [1, 2, 'Karina'], [1, 3, 'Radmila'], [1, 4, 'Diana'], [1, 5, 'Dalimil'], [1, 6, 'Tři králové'], [1, 8, 'Čestmír'], [2, 2, 'Hromnice'], [2, 14, 'Valentýn'], [3, 1, 'Bedřich'], [3, 12, 'Řehoř'], [3, 19, 'Josef'], [3, 25, 'Marián'], [4, 24, 'Jiří'],
  [5, 1, 'Svátek práce'], [5, 12, 'Pankrác'], [5, 13, 'Servác'], [5, 14, 'Bonifác'], [5, 16, 'Přemysl'], [6, 24, 'Jan'], [6, 29, 'Petr a Pavel'], [7, 5, 'Cyril a Metoděj'], [7, 6, 'Mistr Jan Hus'], [7, 22, 'Magdaléna'], [7, 26, 'Anna'], [8, 10, 'Vavřinec'], [9, 28, 'Václav'], [9, 29, 'Michal'],
  [10, 15, 'Tereza'], [11, 2, 'Památka zesnulých'], [11, 11, 'Martin'], [11, 25, 'Kateřina'], [11, 30, 'Ondřej'], [12, 4, 'Barbora'], [12, 6, 'Mikuláš'], [12, 13, 'Lucie'], [12, 24, 'Adam a Eva'], [12, 25, 'Boží hod'], [12, 26, 'Štěpán'], [12, 31, 'Silvestr']];
const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MNAMES = ['LEDEN', 'ÚNOR', 'BŘEZEN', 'DUBEN', 'KVĚTEN', 'ČERVEN', 'ČERVENEC', 'SRPEN', 'ZÁŘÍ', 'ŘÍJEN', 'LISTOPAD', 'PROSINEC'];
const ZSTART = [79, 109, 140, 171, 203, 234, 265, 295, 325, 355, 19, 49];
const doy = (m, d) => MDAYS.slice(0, m - 1).reduce((a, b) => a + b, 0) + d - 1;
function paintCalendar(g, S0) {
  const R = S0 / 2, c = S0 / 2, P = (r, a) => [c + r * Math.sin(a), c - r * Math.cos(a)], A = d => d / 365 * TAU, k = S0 / 1024;
  g.fillStyle = '#d8d0bc'; g.fillRect(0, 0, S0, S0);
  g.fillStyle = '#1a1814'; g.beginPath(); g.arc(c, c, R * 0.99, 0, TAU); g.fill();
  // the day ring: a tick for every day, a heavier one between months, names on a few days
  g.fillStyle = '#e9e0c8'; g.beginPath(); g.arc(c, c, R * 0.975, 0, TAU); g.arc(c, c, R * 0.8, 0, TAU, true); g.fill();
  g.strokeStyle = '#6a5a3a'; for (let d = 0; d < 365; d++) { const a = A(d), [x0, y0] = P(R * 0.955, a), [x1, y1] = P(R * 0.975, a); g.lineWidth = 0.8 * k; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  let m0 = 0; for (let m = 0; m < 12; m++) { const a = A(m0), [x0, y0] = P(R * 0.8, a), [x1, y1] = P(R * 0.975, a); g.lineWidth = 2.4 * k; g.strokeStyle = '#3a2a14'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); m0 += MDAYS[m]; }
  g.fillStyle = '#2a1e10'; g.font = `italic 600 ${Math.round(15 * k)}px "Cormorant Garamond", Georgia, serif`; g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const [m, d, n] of NAMEDAYS) { const a = A(doy(m, d) + 0.5), [x, y] = P(R * 0.945, a); g.save(); g.translate(x, y); g.rotate(a - Math.PI / 2); g.fillText(n, 0, 0); g.restore(); const [dx, dy] = P(R * 0.962, a); g.fillStyle = '#8a1a14'; g.beginPath(); g.arc(dx, dy, 2.2 * k, 0, TAU); g.fill(); g.fillStyle = '#2a1e10'; }
  // the month ring
  g.fillStyle = '#c8b890'; g.beginPath(); g.arc(c, c, R * 0.8, 0, TAU); g.arc(c, c, R * 0.62, 0, TAU, true); g.fill();
  m0 = 0; for (let m = 0; m < 12; m++) { const am = A(m0 + MDAYS[m] / 2); const [mx, my] = P(R * 0.71, am); const med = g.createRadialGradient(mx, my, 2, mx, my, R * 0.075); med.addColorStop(0, ['#6a8a5a', '#8a9aa8', '#7a9a5a', '#9ab86a', '#b8a85a', '#c8a050', '#d89a40', '#c88a3a', '#9a7a4a', '#8a6a3a', '#6a5a4a', '#5a6a7a'][m]); med.addColorStop(1, '#3a2a18'); g.fillStyle = med; g.beginPath(); g.arc(mx, my, R * 0.075, 0, TAU); g.fill(); g.strokeStyle = '#d8b050'; g.lineWidth = 2 * k; g.stroke();
    g.save(); g.translate(...P(R * 0.775, am)); g.rotate(am); g.fillStyle = '#2a1a0a'; g.font = `600 ${Math.round(13 * k)}px ${ROMAN}`; g.textAlign = 'center'; g.fillText(MNAMES[m], 0, 0); g.restore(); m0 += MDAYS[m]; }
  // the zodiac ring, each sign across its own days, its borders carried out across the day ring as fine gold lines
  g.fillStyle = '#2a3a5a'; g.beginPath(); g.arc(c, c, R * 0.62, 0, TAU); g.arc(c, c, R * 0.4, 0, TAU, true); g.fill();
  for (let z = 0; z < 12; z++) {
    const a0 = A(ZSTART[z]), a1 = A(ZSTART[(z + 1) % 12] + (z === 9 ? 365 : 0)), am = (a0 + (a1 < a0 ? a1 + TAU : a1)) / 2;
    g.strokeStyle = 'rgba(220,180,90,0.9)'; g.lineWidth = 1.6 * k; g.setLineDash([]); const [x0, y0] = P(R * 0.4, a0), [x1, y1] = P(R * 0.62, a0); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.setLineDash([4 * k, 3 * k]); const [x2, y2] = P(R * 0.62, a0), [x3, y3] = P(R * 0.958, a0); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x3, y3); g.stroke(); g.setLineDash([]);
    const [gx, gy] = P(R * 0.535, am); drawZod(g, z, gx, gy, 46 * k, '#f0cc70', 7, am);
    g.save(); g.translate(...P(R * 0.445, am)); g.rotate(am); g.fillStyle = '#e8c878'; g.font = `600 ${Math.round(12 * k)}px ${ROMAN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ZLAT[z], 0, 0); g.restore();
  }
  // the Old Town arms in the middle: a red shield, a gold wall with three towers
  g.fillStyle = '#3a2a18'; g.beginPath(); g.arc(c, c, R * 0.4, 0, TAU); g.fill();
  g.save(); g.translate(c, c); const s = R * 0.24; g.fillStyle = '#a81c1a'; g.beginPath(); g.moveTo(-s * 0.8, -s * 0.8); g.lineTo(s * 0.8, -s * 0.8); g.lineTo(s * 0.8, s * 0.1); g.quadraticCurveTo(s * 0.8, s * 0.8, 0, s * 1.05); g.quadraticCurveTo(-s * 0.8, s * 0.8, -s * 0.8, s * 0.1); g.closePath(); g.fill(); g.strokeStyle = '#e0b850'; g.lineWidth = 3 * k; g.stroke();
  g.fillStyle = '#e8c060'; g.fillRect(-s * 0.6, -s * 0.05, s * 1.2, s * 0.45); for (const x of [-0.5, 0, 0.5]) { g.fillRect((x - 0.13) * s, -s * 0.5, s * 0.26, s * 0.5); g.beginPath(); g.moveTo((x - 0.16) * s, -s * 0.5); g.lineTo(x * s, -s * 0.72); g.lineTo((x + 0.16) * s, -s * 0.5); g.fill(); }
  g.fillStyle = '#1a1208'; g.fillRect(-s * 0.1, s * 0.12, s * 0.2, s * 0.28); g.restore();
  // a photograph of it: a little soft, slightly warm, with the restorers' scale bar
  g.save(); g.globalCompositeOperation = 'multiply'; for (let i = 0; i < 40; i++) blot(g, rand(0, S0), rand(0, S0), rand(30, 120) * k, 0.06, '120,90,50'); g.restore();
  g.fillStyle = '#111'; g.fillRect(24 * k, S0 - 40 * k, 200 * k, 10 * k); for (let i = 0; i < 10; i += 2) { g.fillStyle = '#eee'; g.fillRect(24 * k + i * 20 * k, S0 - 40 * k, 20 * k, 10 * k); }
  g.fillStyle = '#222'; g.font = `${Math.round(13 * k)}px ${MONO}`; g.textAlign = 'left'; g.fillText('ORLOJ 2018 / KALENDÁŘ / A-31', 24 * k, S0 - 50 * k);
}
// the tower round the clock, as the square sees it (u runs left to right from the square; the dial is at u = 0.2 m)
function paintFacade(g, W, H) {
  const ppm = W / 9.2, X = xw => (4.6 - xw) / 9.2 * W, Y = yw => (7.6 - yw) / 15.8 * H;
  // big tower ashlar
  const st = T.stone.userData.canvas;
  for (let y = 0; y < H; y += 220) for (let x = 0; x < W; x += 220) g.drawImage(st, x, y, 220, 220);
  g.fillStyle = 'rgba(40,36,32,0.25)'; g.fillRect(0, 0, W, H);
  // the clock's surround: lighter carved stone from the calendar up to the windows, a pointed arch over all
  const x0 = X(1.75), x1 = X(-2.15), yt = Y(4.6), yb = Y(-3.8);
  g.fillStyle = '#9a9080'; g.beginPath(); g.moveTo(x0, yb); g.lineTo(x0, Y(3.7)); g.quadraticCurveTo(x0, yt, (x0 + x1) / 2, Y(5.3)); g.quadraticCurveTo(x1, yt, x1, Y(3.7)); g.lineTo(x1, yb); g.closePath(); g.fill();
  g.strokeStyle = '#5a5246'; g.lineWidth = 6; g.stroke();
  for (const xx of [x0 + 18, x1 - 18]) { g.fillStyle = '#8a8072'; g.fillRect(xx - 14, Y(4.9), 28, yb - Y(4.9)); g.beginPath(); g.moveTo(xx - 18, Y(4.9)); g.lineTo(xx, Y(5.9)); g.lineTo(xx + 18, Y(4.9)); g.fill(); for (let y = Y(5.8); y < Y(4.9); y += 14) { g.fillStyle = '#6a6256'; g.fillRect(xx - 22, y, 8, 5); g.fillRect(xx + 14, y, 8, 5); } }
  // crockets and tracery bands
  g.strokeStyle = 'rgba(60,54,46,0.8)'; g.lineWidth = 3;
  for (const yy of [Y(2.58), Y(-0.15), Y(-3.55)]) { g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke(); for (let x = x0 + 10; x < x1; x += 26) { g.beginPath(); g.arc(x, yy + 9, 9, Math.PI, 0); g.stroke(); } }
  // snow along the ledges
  g.fillStyle = 'rgba(236,240,246,0.92)'; for (const yy of [Y(2.58), Y(-0.15), Y(-3.55), Y(APW.y0 - 0.02)]) { g.beginPath(); g.moveTo(x0, yy); for (let x = x0; x <= x1; x += 12) g.lineTo(x, yy - rand(3, 9)); g.lineTo(x1, yy + 3); g.lineTo(x0, yy + 3); g.fill(); }
  // a dark gap round the dial and the calendar (their own discs sit in front)
  g.fillStyle = '#1a1612'; g.beginPath(); g.arc(X(-0.2), Y(1.3), 1.55 * ppm, 0, TAU); g.fill(); g.beginPath(); g.arc(X(-0.2), Y(-2.3), 1.3 * ppm, 0, TAU); g.fill();
  // grime streaks
  g.save(); g.globalCompositeOperation = 'multiply'; for (let i = 0; i < 120; i++) { const x = rand(0, W), y = rand(0, H); const gr = g.createLinearGradient(x, y, x, y + rand(60, 300)); gr.addColorStop(0, 'rgba(60,50,40,0.25)'); gr.addColorStop(1, 'rgba(60,50,40,0)'); g.fillStyle = gr; g.fillRect(x, y, rand(6, 30), rand(60, 300)); } g.restore();
}
// the square at night (or at first light): the houses opposite, Týn church's two spires on the left, lamps, snow on the roofs
function paintSquare(g, W, H, dawn) {
  const sky = g.createLinearGradient(0, 0, 0, H); if (dawn) { sky.addColorStop(0, '#5a78a8'); sky.addColorStop(0.6, '#a8b8d0'); sky.addColorStop(1, '#e8c8a8'); } else { sky.addColorStop(0, '#080a12'); sky.addColorStop(0.55, '#1c2030'); sky.addColorStop(1, '#5a4236'); }
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const base = H * 0.86;
  // Týn church: two tall black spires with clusters of small spirelets, floodlit from below
  // (at night the towers are floodlit from below: warm stone fading up into the dark, the spires black, gilt balls catching the light)
  const flood = (x0, y0, x1, y1) => { if (dawn) return '#3a3a40'; const gr = g.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, '#7a5a3e'); gr.addColorStop(0.45, '#4a3628'); gr.addColorStop(1, '#16141a'); return gr; };
  const tyn = (cx, sh) => { const bw = 70, top = H * 0.38; g.fillStyle = flood(cx - bw / 2, top - sh, cx + bw / 2, base); g.beginPath(); g.moveTo(cx - bw / 2, base); g.lineTo(cx - bw / 2, top); g.lineTo(cx, top - sh); g.lineTo(cx + bw / 2, top); g.lineTo(cx + bw / 2, base); g.fill();
    g.fillStyle = dawn ? '#3a3a40' : '#121216'; g.beginPath(); g.moveTo(cx - bw / 2, top); g.lineTo(cx, top - sh); g.lineTo(cx + bw / 2, top); g.fill();
    for (const [dx, dy, s] of [[-38, 30, 0.55], [38, 30, 0.55], [-22, 0, 0.7], [22, 0, 0.7]]) { g.beginPath(); g.moveTo(cx + dx - 10, top + dy); g.lineTo(cx + dx, top + dy - sh * s * 0.5); g.lineTo(cx + dx + 10, top + dy); g.fill();
      g.fillStyle = dawn ? '#8a7a50' : '#e8b860'; g.beginPath(); g.arc(cx + dx, top + dy - sh * s * 0.5, 3, 0, TAU); g.fill(); g.fillStyle = dawn ? '#3a3a40' : '#121216'; }
    g.fillStyle = dawn ? '#8a7a50' : '#f0c060'; g.beginPath(); g.arc(cx, top - sh, 4, 0, TAU); g.fill();
    if (!dawn) { g.fillStyle = 'rgba(20,14,10,0.8)'; for (let r = 0; r < 5; r++) g.fillRect(cx - 7, top + 40 + r * 52, 14, 30); } };
  g.fillStyle = flood(350, H * 0.56, 650, base); g.fillRect(350, H * 0.56, 300, base - H * 0.56);
  if (!dawn) { g.fillStyle = 'rgba(20,14,10,0.75)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(372 + i * 46, base - 30); g.lineTo(372 + i * 46, H * 0.62 + 20); g.arc(384 + i * 46, H * 0.62 + 20, 12, Math.PI, 0); g.lineTo(396 + i * 46, base - 30); g.fill(); } }
  tyn(420, 230); tyn(560, 240);
  // houses round the square: gables, lit windows, snow on the roofs
  let x = 0; while (x < W) { const w = rand(90, 170), h = rand(150, 260), y = base - h; if (x > 330 && x < 670) { x += w; continue; }
    g.fillStyle = dawn ? `rgb(${irand(120, 170)},${irand(110, 150)},${irand(100, 140)})` : `rgb(${irand(24, 40)},${irand(22, 34)},${irand(22, 32)})`; g.fillRect(x, y, w, h);
    const gab = Math.random() < 0.6; g.beginPath(); if (gab) { g.moveTo(x, y); g.lineTo(x + w / 2, y - rand(40, 80)); g.lineTo(x + w, y); } else { g.moveTo(x - 4, y); g.lineTo(x + w + 4, y); g.lineTo(x + w + 4, y - 22); g.lineTo(x - 4, y - 22); } g.fill();
    g.fillStyle = dawn ? 'rgba(240,244,248,0.85)' : 'rgba(210,216,226,0.7)'; g.beginPath(); if (gab) { g.moveTo(x, y + 2); g.lineTo(x + w / 2, y - 60); g.lineTo(x + w, y + 2); g.lineTo(x + w, y - 4); g.lineTo(x + w / 2, y - 66); g.lineTo(x, y - 4); } else g.rect(x - 4, y - 26, w + 8, 6); g.fill();
    for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < Math.floor(w / 30); c2++) { if (Math.random() < 0.55) continue; g.fillStyle = dawn ? 'rgba(60,60,70,0.8)' : (Math.random() < 0.4 ? 'rgba(255,200,120,0.85)' : 'rgba(30,30,40,0.9)'); g.fillRect(x + 10 + c2 * 30, y + 20 + r * 50, 14, 24); }
    x += w; }
  // the Hus monument: a dark mass in the middle of the square
  g.fillStyle = dawn ? '#2a2a2e' : '#0c0c0e'; g.beginPath(); g.moveTo(W * 0.44, base + 10); g.quadraticCurveTo(W * 0.47, base - 70, W * 0.5, base - 90); g.quadraticCurveTo(W * 0.54, base - 60, W * 0.58, base + 10); g.fill();
  // the ground: snow
  g.fillStyle = dawn ? '#c8ccd4' : '#30343c'; g.fillRect(0, base, W, H - base);
  // lamps
  if (!dawn) for (let i = 0; i < 14; i++) { const lx = rand(0, W), ly = base - rand(10, 60); const gr = g.createRadialGradient(lx, ly, 0, lx, ly, 26); gr.addColorStop(0, 'rgba(255,190,110,0.9)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(lx - 26, ly - 26, 52, 52); }
}
// his face, the moment he finds you: grey, gaunt, two black burned holes where the eyes were
function paintHisFace(g, w, h) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const cx = w * 0.5, cy = h * 0.5;
  g.save(); g.beginPath(); g.ellipse(cx, cy + 20, w * 0.32, h * 0.4, 0, 0, TAU); g.clip();
  const sk = g.createRadialGradient(cx - 30, cy - 80, 20, cx, cy, h * 0.42); sk.addColorStop(0, '#b2aea4'); sk.addColorStop(0.5, '#86827a'); sk.addColorStop(0.85, '#4a4842'); sk.addColorStop(1, '#1e1d1a'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${irand(50, 90)},${irand(46, 80)},${irand(40, 70)},${rand(0.03, 0.08)})`; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(2, 14), 0, TAU); g.fill(); }
  // deep temples and cheeks, the skull showing through
  for (const sx of [-1, 1]) { for (const [ox, oy, r] of [[120, -170, 80], [110, 70, 95]]) { const hc = g.createRadialGradient(cx + sx * ox, cy + oy, 6, cx + sx * ox, cy + oy, r); hc.addColorStop(0, 'rgba(18,16,14,0.65)'); hc.addColorStop(1, 'rgba(18,16,14,0)'); g.fillStyle = hc; g.fillRect(0, 0, w, h); } }
  // wrinkles across the forehead
  g.strokeStyle = 'rgba(40,36,30,0.5)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - 120, cy - 250 + i * 16); g.quadraticCurveTo(cx, cy - 262 + i * 16 + rand(-6, 6), cx + 120, cy - 250 + i * 16); g.stroke(); }
  // the eyes: burned out. Black holes with charred, blistered, weeping edges
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 74, ey = cy - 100;
    const scar = g.createRadialGradient(ex, ey, 20, ex, ey, 92); scar.addColorStop(0, 'rgba(90,30,22,0.95)'); scar.addColorStop(0.45, 'rgba(120,56,40,0.75)'); scar.addColorStop(0.75, 'rgba(110,70,56,0.35)'); scar.addColorStop(1, 'rgba(110,70,56,0)'); g.fillStyle = scar; g.beginPath(); g.ellipse(ex, ey, 92, 74, 0, 0, TAU); g.fill();
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${irand(140, 200)},${irand(90, 130)},${irand(70, 100)},${rand(0.3, 0.6)})`; const a = rand(0, TAU), r = rand(40, 76); g.beginPath(); g.arc(ex + Math.cos(a) * r, ey + Math.sin(a) * r * 0.8, rand(3, 9), 0, TAU); g.fill(); }
    const hole = g.createRadialGradient(ex, ey, 4, ex, ey, 46); hole.addColorStop(0, '#000'); hole.addColorStop(0.7, '#060303'); hole.addColorStop(1, 'rgba(40,10,8,0.9)'); g.fillStyle = hole; g.beginPath(); g.ellipse(ex, ey, 44, 34, sx * 0.1, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(20,6,4,0.95)'; g.lineWidth = 5; g.beginPath(); g.ellipse(ex, ey, 46, 36, sx * 0.1, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(200,190,170,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(ex - 10, ey + 40); g.quadraticCurveTo(ex - 6 + sx * 4, ey + 110, ex - 14, ey + 170); g.stroke();
  }
  // the nose, sunken; the mouth hanging open, too long, toothless
  g.fillStyle = 'rgba(28,24,20,0.5)'; g.beginPath(); g.moveTo(cx - 6, cy - 60); g.lineTo(cx - 20, cy + 26); g.lineTo(cx + 16, cy + 30); g.fill();
  for (const sx of [-1, 1]) { g.fillStyle = 'rgba(6,4,4,0.85)'; g.beginPath(); g.ellipse(cx + sx * 10, cy + 26, 6, 4, 0, 0, TAU); g.fill(); }
  const my = cy + 160; const mo = g.createRadialGradient(cx, my, 4, cx, my, 80); mo.addColorStop(0, '#000'); mo.addColorStop(0.75, '#040202'); mo.addColorStop(1, 'rgba(50,30,26,0.95)'); g.fillStyle = mo; g.beginPath(); g.ellipse(cx, my, 40, 84, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(80,60,54,0.9)'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, my, 42, 86, 0, 0, TAU); g.stroke();
  g.restore();
  // lank grey hair from the crown, a few strands across the face
  g.strokeStyle = 'rgba(120,114,104,0.8)';
  for (let i = 0; i < 60; i++) { const side = Math.random() < 0.5 ? -1 : 1; let x = cx + side * rand(60, 170), y = rand(0, 120); g.lineWidth = rand(1, 3); g.beginPath(); g.moveTo(x, y); const n = irand(5, 10); for (let k = 0; k < n; k++) { const nx = x + rand(-8, 8) + side * rand(0, 6), ny = y + rand(50, 80); g.quadraticCurveTo(x + rand(-10, 10), (y + ny) / 2, nx, ny); x = nx; y = ny; } g.stroke(); }
  const vg = g.createRadialGradient(cx, cy, h * 0.3, cx, cy, h * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}


/* =====================================================================
   THE BLIND HOUR · part E: the bells of Týn and the bell sign, the rule (loud only while a bell rings),
   him standing and counting, the body (the ladder, the crate), St Peter's key on the wheel, the crate,
   winding (which brings the pin up the shaft), the clutch, the fly, the hands, the strike and the
   procession; the scares; the escape and the last photograph
   ===================================================================== */
const V = { bellUntil: 0, strike: null, proc: 0, still: null, watch: null, scare: false, envDue: true, dirT: 50, last: '', head: 1, headOff: false, flick: 0, dip: 0,
  black: 0, prevM: null, escaping: false, stuckT: 0, progKey: '', gearSpin: 0, wheelTurn: null, clutchScene: false, finalOut: false, hanShown: false, hanUntil: 0, hold: null, bellEl: null, bellShown: false };
const heard = id => { if (!S.heard.includes(id)) { S.heard.push(id); save(); } };
const look = (txt, ms = 5600) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5600) => subtitle('', `<i>${txt}</i>`, ms);
const took = id => S.inv.includes(id);
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }
function wrapA(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
const onLoft = () => !!S.onLoft;
const bellOn = () => G.time < V.bellUntil;
function progCount() { return [S.keyTaken, S.crateOpen, S.wound >= WIND_N, S.pinTaken, S.pinIn, S.fly === 'wide'].filter(Boolean).length; }
const NODES = { bellShaft: new THREE.Vector3(0.75, 4.5, 0.25), shaft: new THREE.Vector3(-2.45, -1.2, 1.85), dialWall: new THREE.Vector3(-0.2, 1.3, -2.45), loft: new THREE.Vector3(0.9, 2.9, -1.7), frame: new THREE.Vector3(-0.2, 1.2, 0.25), door: new THREE.Vector3(3.15, 1.2, 1.05) };
const NODE_ORDER = ['bellShaft', 'shaft', 'dialWall', 'door', 'loft', 'frame'];
function hisNode() { const k = Math.min(NODE_ORDER.length - 1, Math.floor(progCount() * 0.9)); return NODES[NODE_ORDER[irand(Math.max(0, k - 2), k)]]; }
// where you stand on the crate counts: up on it, beside the clock
const highNear = (p, maxD = 1.25) => BODY.y > 0.3 && Math.hypot(P.x - p.x, P.z - p.z) < maxD;

/* ---------------- sounds ---------------- */
function bellTone(pos, vol, base, parts, decay, wet = 0.5) { if (!A.ready) return; const t = now(); parts.forEach(([r, a, dk]) => { const o = A.ctx.createOscillator(); o.frequency.value = base * r * (1 + rand(-0.002, 0.002)); const g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + decay * dk); o.connect(g); route(g, { pos, wet }); o.start(t); o.stop(t + decay * dk + 0.05); }); }
const CHURCH = [[0.5, 0.5, 1.6], [1, 1, 1], [1.19, 0.5, 0.7], [1.5, 0.35, 0.6], [2, 0.6, 0.5], [2.52, 0.2, 0.35], [3, 0.18, 0.3], [4.08, 0.1, 0.2]];
function sTyn(kind) { if (kind === 'hour') bellTone(POS.tyn, 0.5, 147, CHURCH, 6.5, 0.7); else bellTone(POS.tyn, 0.32, kind === 'ding' ? 392 : 330, CHURCH, 3.6, 0.7); }
function sStrike() { bellTone(POS.bell, 0.6, 523, CHURCH, 4.2, 0.45); sThunk(POS.hammer, 0.25, 260); }
function sDeathBell() { if (!A.ready) return; for (let i = 0; i < 3; i++) after(i * 0.18, () => bellTone(new THREE.Vector3(-1.95, 2.0, FZ - 0.4), 0.12, 1568, [[1, 1, 1], [2.7, 0.3, 0.4], [5.4, 0.1, 0.2]], 1.4, 0.5)); }
function sRatchet(pos, vol = 0.5) { if (!A.ready) return; sClick(pos, vol, 1400 + rand(-200, 200)); after(0.06, () => sClick(pos, vol * 0.7, 900)); sThunk(pos, vol * 0.5, 170); }
function sWhirr(dur = 0.6) { if (!A.ready) return; const t = now(), n = noiseSrc(false), bp = filt('bandpass', 1200, 4), g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08, t + 0.05); g.gain.linearRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); route(g, { pos: POS.frame, wet: 0.2 }); n.start(t); n.stop(t + dur + 0.05); }
function sPop(pos) { if (!A.ready) return; sClick(pos, 0.5, 3200); sThunk(pos, 0.3, 300); }
// nails shrieking out of pine, one after another
function sNails(pos) { if (!A.ready) return; for (let i = 0; i < 4; i++) after(i * 0.32, () => { sCreak(pos, 0.35, 0.16, 900 + rand(-150, 250)); sClick(pos, 0.25, 2400); }); after(1.45, () => sThunk(pos, 0.7, 120)); }
function whisper(id, pos, vol = 1) { playClip('o_' + id, { pos, fx: 'whisper', volume: vol, wet: 0.25 }); }
function countWhisper(k, pos, vol = 0.9) { if (k >= 1 && k <= 24) whisper('n' + k, pos, vol); }

/* ---------------- the bells of Týn, every quarter of an hour ---------------- */
// game time: 23:45 when you wake (midnight comes just after the voicemail); a minute passes every three seconds, so Týn rings every 45 seconds
const GSEC = 3, START_MIN = 23 * 60 + 45;
const clockMin = () => START_MIN + S.gm;
function tynUpdate(dt) {
  if (V.finalOut || V.still) return;            // the clock in the square waits for the stand-still
  S.gm += dt / GSEC;
  const m = clockMin(); if (V.prevM === null) V.prevM = m;
  const q0 = Math.floor(V.prevM / 15), q1 = Math.floor(m / 15); V.prevM = m;
  if (q1 > q0) peal(q1 * 15);
}
function peal(minute) {
  const q = (minute / 15) % 4, hour = Math.floor(minute / 60) % 24, strokes = hour % 12 || 12;
  const n = q === 0 ? 4 : q; let t = 0;
  const midnight = q === 0 && !S.flags.counted;
  for (let i = 0; i < n; i++) { after(t, () => sTyn('ding')); after(t + 0.8, () => sTyn('dong')); t += 2.1; }
  if (q === 0) {
    t += 1.6;
    const dur = t + strokes * 2.5 + 0.4;
    // on the hour he stands where you can see him, and counts
    let pos = null;
    if (!V.hanShown && !V.strike && !V.still && !V.escaping) { pos = standSpot(midnight ? 'view' : 'any'); if (pos) after(0.3, () => { if (!V.strike && !V.still && !V.escaping) standAndCount(pos, dur - 0.3, midnight ? 1.5 : 0.9); }); }
    if (midnight) after(t + 1.3, () => { if (!V.sawHan) sayI('Someone in the room is counting with the bell. Under his breath. Close.', 4600); });
    for (let k = 1; k <= strokes; k++) { after(t, () => { sTyn('hour'); if (!V.finalOut) after(0.5, () => countWhisper(k, V.hanShown ? hanHead() : hisNode(), midnight ? 1.05 : 0.8)); }); t += 2.5; }
    if (midnight) after(t + 0.6, midnightAfter);
  } else {
    // the quarters: he counts them under his breath, somewhere in the works
    const p = hisNode(); for (let i = 1; i <= n; i++) after((i - 1) * 2.1 + 1.3, () => { if (!V.finalOut) countWhisper(i, p, 0.6); });
  }
  V.bellUntil = Math.max(V.bellUntil, G.time + t + 1.4);
}
function midnightAfter() {
  if (S.flags.counted) return;
  flag('counted'); heard('count'); heard('rule');
  G.fearT = 0.6; sHeart(6, 0.35, 0.8);
  after(0.4, () => sayI(V.sawHan ? 'He stood there the whole time, head on one side, counting with the bell. On the last stroke the light stuttered, and he was gone.' : 'Someone was counting with the bell, in the room with you. On the last stroke the light stuttered, and the whispering stopped.', 6600));
  after(7.2, () => subtitle('', '<b>He\'s blind, and he hunts by sound. While a bell rings, he stands still and counts.</b> <i>Anything loud, do it while the bell sign is showing.</i>', 9000));
}

/* ---------------- the bell sign: on screen whenever a bell is ringing ---------------- */
function bellSign() {
  if (!V.bellEl) {
    const el = document.createElement('div'); el.id = 'obell'; el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.7 0 1.2.5 1.2 1.2v.7a6.3 6.3 0 0 1 5.1 6.2v4.2l1.9 2.6c.4.5 0 1.2-.6 1.2H4.4c-.6 0-1-.7-.6-1.2l1.9-2.6v-4.2a6.3 6.3 0 0 1 5.1-6.2v-.7c0-.7.5-1.2 1.2-1.2Z" fill="currentColor"/><path d="M9.6 20h4.8a2.4 2.4 0 0 1-4.8 0Z" fill="currentColor"/></svg><span></span>';
    $('#hud').appendChild(el); V.bellEl = el;
  }
  const on = G.mode === 'play' && bellOn() && !V.finalOut && !V.escaping;
  const txt = V.strike ? 'She is striking. He is counting.' : 'A bell is ringing. He is counting.';
  const sp = V.bellEl.querySelector('span'); if (sp.textContent !== txt) sp.textContent = txt;
  if (on !== V.bellShown) {
    V.bellShown = on; V.bellEl.classList.toggle('on', on);
    if (on && S.flags.counted && !S.ev.bellTold) { S.ev.bellTold = true; save(); toast('<b>The bell sign is up.</b> While it shows, he stands and counts: loud things are safe.', 6500); }
  }
}

/* ---------------- him, standing still and counting ---------------- */
// places on the floor where he can stand clear of everything
const SPOTS = [[1.6, -1.25], [-2.5, 0.05], [-1.0, 1.85], [0.0, -1.3], [-2.4, -1.8], [2.4, -2.0], [1.05, 1.35]];
// does the line from you to (x, z) pass through the clock? (then you couldn't see him there)
function hidden(x, z) {
  const r = { x0: FR.x0 - 0.08, x1: FR.x1 + 0.08, z0: FR.z0 - 0.08, z1: FR.z1 + 0.08 };
  for (let i = 1; i < 20; i++) { const k = i / 20, px = lerp(P.x, x, k), pz = lerp(P.z, z, k); if (px > r.x0 && px < r.x1 && pz > r.z0 && pz < r.z1) return true; }
  return false;
}
function standSpot(mode) {
  const fwd = new THREE.Vector2(-Math.sin(G.yaw), -Math.cos(G.yaw)), cp = O.crate.position;
  const ok = SPOTS.filter(([x, z]) => (onLoft() || Math.hypot(x - P.x, z - P.z) > 2.0) && Math.hypot(x - cp.x, z - cp.z) > 0.75);
  if (!ok.length) return null;
  const score = ([x, z]) => { const d = new THREE.Vector2(x - P.x, z - P.z).normalize(); return d.dot(fwd) - (!onLoft() && hidden(x, z) ? 3 : 0); };
  ok.sort((a, b) => score(b) - score(a));
  const pick = mode === 'view' ? ok[0] : mode === 'strike' ? ok.find(([x]) => x > 0.5) || ok[0] : ok[Math.min(ok.length - 1, irand(0, 1))];
  return new THREE.Vector3(pick[0], 0, pick[1]);
}
const hanHead = () => O.han.userData.neck.getWorldPosition(new THREE.Vector3());
function standAndCount(p, dur, rim = 0.9) {
  const h = O.han; h.visible = true; h.scale.setScalar(1); h.position.set(p.x, 0, p.z);
  h.rotation.y = Math.atan2(P.x - p.x, P.z - p.z) + rand(-0.6, 0.6);
  h.userData.neck.rotation.set(0.25, 0, 0.14);
  V.hanShown = true; V.hanUntil = G.time + dur;
  COL.han.minX = p.x - 0.3; COL.han.maxX = p.x + 0.3; COL.han.minZ = p.z - 0.3; COL.han.maxZ = p.z + 0.3; COL.han.on = true;
  L.rim.position.set(p.x + 0.55, 2.2, p.z + 0.5); L.rim.intensity = rim;
}
function hideHim() { V.hanShown = false; V.hanUntil = 0; O.han.visible = false; COL.han.on = false; L.rim.intensity = 0; }
// did you see him? (the midnight lines depend on it)
function seeHim() {
  if (!V.hanShown || V.sawHan) return;
  const c = O.han.userData.chest.getWorldPosition(new THREE.Vector3()), d = c.clone().sub(camera.position), dist = d.length(); d.normalize();
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  if (f.dot(d) > 0.82 && dist < 7 && (onLoft() || !hidden(c.x, c.z))) V.sawHan = true;
}
// a Týn peal ends: his head comes up, the light stutters, and he's gone
function hanUpdate() {
  seeHim();
  if (!V.hanShown || V.strike || V.still || V.escaping || G.time < V.hanUntil) return;
  V.hanUntil = 1e9; const nk = O.han.userData.neck;
  tween(0.45, k => { nk.rotation.set(lerp(0.25, -0.05, k), 0, 0.14); });
  after(0.7, () => { V.flick = 0.8; after(0.35, () => { if (!V.strike) hideHim(); }); });
}

/* ---------------- the rule: noise, outside a bell, is heard ---------------- */
// run a loud action now if a bell is ringing; otherwise he hears it, and the action doesn't happen
function loud(run) {
  if (bellOn()) { if (!S.flags.loudOk) flag('loudOk'); run(); return true; }
  heardNoise(); return false;
}
const loudNote = () => bellOn() ? 'A bell is ringing: he can\'t hear you now.' : 'Loud. Wait for the next bell (every 45 seconds or so).';
function heardNoise() {
  if (!S.ev.warned) {
    S.ev.warned = true; save(); closeAll();
    const p = camera.position.clone().add(new THREE.Vector3(-Math.sin(G.yaw) * 1.6, 0.1, -Math.cos(G.yaw) * 1.6));
    V.flick = 1.4; G.fearT = 0.9; sStinger(0.6);
    after(0.4, () => sScrape(p, 0.9, 0.3)); after(1.2, () => { whisper('kdo', p, 1.2); heard('kdo'); }); after(2.0, () => sHeart(8, 0.45, 0.7));
    sayI('You freeze. Somewhere in the works, something stopped moving, and turned towards the sound.', 4600);
    after(5.0, () => subtitle('', '<b>He heard that.</b> <i>Nothing loud while it\'s quiet. Wait for a bell: the bell sign shows at the top of the screen.</i>', 6500));
    G.lockout = G.time + 3;
    return;
  }
  lungeScare('noise');
}
function closeAll() { if (UI.kind) UI.close(true); if (G.panelOpen) closePanel(true); if (DRAG.cur) dragEnd(true); }
// he finds you: his face fills your eyes, his fingers on your face, then the dark
function lungeScare(why) {
  if (V.scare) return; V.scare = true; closeAll(); releasePointer();
  G.cutscene = true; S.wrong++; save();
  O.face.visible = true; O.face.position.set(0.01, -0.01, -0.3); O.face.rotation.set(0, 0, -0.05);
  tween(0.55, k => { O.face.position.z = lerp(-0.3, -0.2, k); O.faceMat.color.setScalar(Math.random() < 0.2 ? 0.35 : lerp(0.7, 1, k)); }, () => { O.face.visible = false; O.faceMat.color.setScalar(1); }, k => k);
  G.flash = 0.35; sStinger(1.1); G.shake = 1.4; G.fearT = 1; G.red = 0.6;
  after(0.12, () => { G.flash = 0; });
  after(0.55, () => { V.black = 2.4; });
  after(1.6, () => sayI(why === 'still' ? 'Cold fingers on your face, feeling for your eyes. Then the dark. When you can see again, he has gone.' : 'Cold fingers on your face, feeling for your eyes. Then nothing. When you can see again, he has gone back into the works.', 5600));
  after(3.0, () => { V.scare = false; G.cutscene = false; G.lockout = G.time + 4; updatePrompt(true); });
}
function penalty() { G.lockout = G.time + 4; V.flick = 0.8; sCreak(hisNode(), 1.2, 0.12, 70); }

/* ---------------- the body: the room's solids, the loft, the ladder ---------------- */
const COL = {};
function buildSolids() {
  colliders.length = 0;
  COL.han = addCol('han', 0, 0, 0, 0, true); COL.han.on = false;
  BODY.solids.length = 0;
  solid('floor', RM.x0 - 1, RM.x1 + 1, -1, 0, RM.z0 - 1, RM.z1 + 1);
  // the walls (so the crate can't go through them either)
  solid('wL', RM.x0 - 1, RM.x0 + 0.03, -1, 6, RM.z0 - 1, RM.z1 + 1); solid('wR', RM.x1 - 0.03, RM.x1 + 1, -1, 6, RM.z0 - 1, RM.z1 + 1);
  solid('wF', RM.x0 - 1, RM.x1 + 1, -1, 6, RM.z0 - 1, RM.z0 + 0.05); solid('wB', RM.x0 - 1, RM.x1 + 1, -1, 6, RM.z1 - 0.02, RM.z1 + 1);
  // the clock on its plinth, the bench (you can climb on it), the lectern, the rail round the shaft, the ladder's foot, the lamp, the loft's posts
  solid('frame', FR.x0 - 0.17, FR.x1 + 0.17, 0, FR.y1 + 0.25, FR.z0 - 0.17, FR.z1 + 0.12);
  solid('bench', 0.28, 2.32, 0, 0.89, RM.z1 - 0.7, RM.z1);
  solid('lect', POS.lectern.x - 0.24, POS.lectern.x + 0.24, 0, 1.2, POS.lectern.z - 0.24, POS.lectern.z + 0.24, { noStand: true });
  solid('shaft', SH.x0 - 0.1, SH.x1 + 0.08, 0, 1.05, SH.z0 - 0.08, SH.z1 + 0.1, { noStand: true });
  solid('ladder', LADDER.x - 0.24, LADDER.x + 0.24, 0, 1.2, LADDER.z0 - 0.12, LADDER.z0 + 0.06, { noStand: true });
  solid('lamp', POS.light.x - 0.2, POS.light.x + 0.2, 0, 1.9, POS.light.z - 0.2, POS.light.z + 0.2, { noStand: true });
  solid('post1', -1.33, -1.17, 0, LOFT.y, LOFT.z1 - 0.16, LOFT.z1); solid('post2', 1.47, 1.63, 0, LOFT.y, LOFT.z1 - 0.16, LOFT.z1);
  // the loft floor (a ceiling for anyone under it), and the vault low over it
  solid('loft', LOFT.x0, LOFT.x1, LOFT.y - 0.09, LOFT.y, LOFT.z0, LOFT.z1);
  solid('loftVault', LOFT.x0, LOFT.x1, LOFT.y + 1.62, 9, LOFT.z0, LOFT.z1);
  // the crate: drag it, stand on it
  const d = draggable('crate', O.crate, { w: CRATE.w, dd: CRATE.d, h: CRATE.h, name: 'crate', heavy: 1.2 });
  d.home = new THREE.Vector3(CRATE.x, 0, CRATE.z);
}
function constrainTo(p, r) {
  const R = onLoft() ? [-2.3, 1.95, -1.3, -0.84] : [RM.x0 + r + 0.02, RM.x1 - r - 0.02, RM.z0 + r + 0.08, RM.z1 - r];
  p.x = clamp(p.x, R[0], R[1]); p.z = clamp(p.z, R[2], R[3]);
}
// on the loft you stoop under the vault
function loftBody(on) { BODY.standEye = on ? 1.42 : 1.62; BODY.standH = on ? 1.52 : 1.74; BODY.noJump = !!on; }
// cutscenes that move the camera themselves take it from the body for a while, then hand it back
function bodyHold() { V.hold = { y: BODY.y }; S.safe = { x: P.x, y: BODY.y, z: P.z }; BODY.on = false; G.eye = G.eyeT = BODY.y + BODY.eye; }
function bodyFree(x, y, z) { BODY.on = true; V.hold = null; S.safe = null; bodyPlace(x, y, z, G.yaw, false); save(); }
function climbUp() {
  if (G.cutscene || onLoft()) return;
  if (DRAG.cur) dragEnd(true);
  G.cutscene = true; bodyHold(); sCreak(new THREE.Vector3(LADDER.x, 1.2, -0.3), 1.0, 0.1, 110); const y0 = G.yaw, p0 = { x: P.x, z: P.z, e: G.eye };
  tween(0.5, k => { P.x = lerp(p0.x, LADDER.x, k); P.z = lerp(p0.z, LADDER.z0 + 0.35, k); G.eye = G.eyeT = lerp(p0.e, 1.62, k); G.yaw = y0 + wrapA(0 - y0) * k; G.pitch = lerp(G.pitch, 0.5, k); });
  after(0.55, () => { for (let i = 0; i < 5; i++) after(i * 0.3, () => sStep(0.14)); tween(1.5, k => { G.eye = G.eyeT = lerp(1.62, LOFT.y + 1.2, k); P.z = lerp(LADDER.z0 + 0.35, LADDER.z1 + 0.1, k); G.pitch = lerp(0.5, 0.15, k); }); });
  after(2.1, () => { S.onLoft = true; save(); tween(0.5, k => { P.z = lerp(LADDER.z1 + 0.1, -1.0, k); P.x = lerp(LADDER.x, LADDER.x + 0.3, k); G.eye = G.eyeT = lerp(LOFT.y + 1.2, EYE_LOFT, k); G.pitch = lerp(0.15, -0.05, k); }, () => {
    loftBody(true); bodyFree(P.x, LOFT.y, P.z); G.cutscene = false; updatePrompt(true);
    if (!S.ev.loftSeen) { S.ev.loftSeen = true; save(); sayI('A low loft under the vault. A painted wooden drum fills most of it: the apostles\' house, with a little door at its back and a handwheel beside it. Beyond it, the two windows over the square. The top of the ladder is behind you.', 8600); } }); });
}
function climbDown(fast) {
  if (G.cutscene && !fast) return; if (!onLoft()) return;
  G.cutscene = true; bodyHold(); const y0 = G.yaw, p0 = { x: P.x, z: P.z, e: G.eye };
  tween(0.45, k => { P.x = lerp(p0.x, LADDER.x, k); P.z = lerp(p0.z, LADDER.z1 + 0.1, k); G.yaw = y0 + wrapA(Math.PI - y0) * k; G.pitch = lerp(G.pitch, -0.6, k); G.eye = G.eyeT = lerp(p0.e, LOFT.y + 1.2, k); });
  after(0.5, () => { S.onLoft = false; for (let i = 0; i < 5; i++) after(i * 0.28, () => sStep(0.14)); tween(1.4, k => { G.eye = G.eyeT = lerp(LOFT.y + 1.2, 1.62, k); P.z = lerp(LADDER.z1 + 0.1, LADDER.z0 + 0.45, k); G.pitch = lerp(-0.6, 0, k); }, () => { loftBody(false); bodyFree(P.x, 0, P.z); G.cutscene = false; save(); updatePrompt(true); }); });
}

/* ---------------- the apostles' wheel and St Peter ---------------- */
// you turn it with the handwheel beside the drum and look in at the little door: no list, just look
function wheelRot(i) { return -i / AP_N * TAU; }
function apAtDoor() { return APOSTLES[S.wheel]; }
const peterHere = () => apAtDoor().tag === 'A2' && !S.keyTaken;
function apLine(ap) { return ap.tag === 'A2' ? `St Peter: ${ap.look}.${S.keyTaken ? '' : ' Hung on his gilded keys, on a twist of wire, there\'s a real iron key.'}` : `${ap.name}, with ${ap.look}.`; }
function lookDoor() { flag('doorSeen'); sayI(`In the little door, facing you: ${apLine(apAtDoor())}`, peterHere() ? 7000 : 5600); }
function turnWheel() {
  if (V.wheelTurn || G.cutscene) return;
  if (G.time < (G.lockout || 0)) { sayI('Your hands are shaking. Give it a moment.', 2600); return; }
  if (!loud(() => {})) return;
  const first = !S.ev.thirteen, from = S.wheel; V.wheelTurn = { t: 0 };
  sRatchet(POS.crank, 0.6); sCreak(POS.housDoor, 0.7, 0.12, 120);
  const dur = first ? 2.6 : 0.8;
  if (first) {
    // the first turn: your eyes go to the door, and for a moment there are thirteen
    S.ev.thirteen = true; save(); G.cutscene = true; spawn13(from);
    const hp = new THREE.Vector3(HOUS.x, LOFT.y + 0.42, HOUS.z + HOUS.r - 0.1), c = camera.position, y0 = G.yaw, p0 = G.pitch;
    const yT = Math.atan2(-(hp.x - c.x), -(hp.z - c.z)), pT = Math.atan2(hp.y - c.y, Math.hypot(hp.x - c.x, hp.z - c.z));
    tween(0.45, k => { G.yaw = y0 + wrapA(yT - y0) * k; G.pitch = lerp(p0, pT, k); });
    after(dur + 0.2, () => { G.cutscene = false; updatePrompt(true); });
  }
  tween(dur, k => {
    let kk = k; if (first) kk = k < 0.3 ? k / 0.3 * 0.5 : k < 0.75 ? 0.5 : 0.5 + (k - 0.75) / 0.25 * 0.5;
    O.wheel.rotation.y = lerp(wheelRot(from), wheelRot(from + 1), kk);
    O.crankWheel.rotation.x = -kk * TAU / 3;
  }, () => {
    S.wheel = (from + 1) % AP_N; save(); O.wheel.rotation.y = wheelRot(S.wheel); V.wheelTurn = null; sRatchet(POS.crank, 0.45);
    if (O.han13) O.han13.visible = false;
    const ap = apAtDoor();
    if (first) sayI(`For a moment, between two of them, there was a thirteenth figure. Smaller than a man. Grey. Its face turned towards you. Then ${ap.name} came round to the door, and it was gone.`, 7600);
    else sayI(ap.tag === 'A2' && !S.keyTaken ? `St Peter comes round to the little door: two gilded keys in his hand, and hung on them, on a twist of wire, a real iron key.` : `${ap.name} comes round to the door, with ${ap.look.split('. ')[0]}.`, 5400);
    updatePrompt(true);
  }, k => k);
}
// the thirteenth: a little grey figure with his face, in the gap between two apostles, turning its head to look at you
function spawn13(from) {
  if (!O.han13) { O.han13 = hanus(); O.han13.scale.setScalar(0.33); O.wheel.add(O.han13); }
  const a = (from + 0.5) / AP_N * TAU; O.han13.position.set(Math.sin(a) * AP_R, 0.02, Math.cos(a) * AP_R); O.han13.rotation.y = a; O.han13.visible = true;
  const nk = O.han13.userData.neck; nk.rotation.set(0.2, -0.6, 0.15);
  after(0.85, () => { sStinger(0.9); G.fearT = 0.9; G.shake = 0.6; tween(0.4, k => { nk.rotation.set(0.2 - k * 0.15, lerp(-0.6, 0, k), 0.15 + k * 0.1); }); whisper('zastavil', POS.housDoor, 0.9); });
}
function takeKey() {
  if (!peterHere()) return;
  S.keyTaken = true; give('key'); if (O.peterKey) O.peterKey.visible = false; save(); sClick(POS.housDoor, 0.3, 2600);
  sayI('You reach in and untwist the wire. The key comes away in your hand, cold.', 4200);
}

/* ---------------- the crowbar and crate 3 ---------------- */
function crateActions() {
  if (DRAG.cur) return [];
  const drag = { label: 'Drag it', run: () => { if (BODY.y > 0.3) { toast('Get down off it first.', 2200); return; } dragStart('crate'); } };
  if (!S.crateOpen) {
    if (took('crowbar')) return [{ label: 'Prise the lid off · loud', run: prise }, drag];
    return [look('A pine crate, nailed shut, stencilled with a big 3: KYVADLO + KLIKA. Pendulum and crank. You\'d need something to prise the lid up.', 6400), drag];
  }
  if (!S.crankTaken) return [{ label: 'Take the crank', run: takeCrank }, drag];
  return [drag, look('Empty now but for straw and the pendulum. Sturdy enough to stand on.')];
}
function prise() {
  if (S.crateOpen || G.cutscene) return;
  if (BODY.y > 0.3) { toast('Get down off it first.', 2200); return; }
  if (G.time < (G.lockout || 0)) { sayI('Your hands are shaking. Give it a moment.', 2600); return; }
  loud(() => {
    S.crateOpen = true; save(); drop('crowbar'); const cp = O.crate.position.clone().setY(0.5);
    sNails(cp);
    const lid = O.crateLid, r0 = lid.rotation.x;
    tween(1.2, k => { lid.rotation.x = r0 - Math.min(1, k * 1.3) * 0.5; lid.position.y = CRATE.h + Math.sin(k * Math.PI) * 0.02; });
    after(1.3, () => { lidOff(true); });
    after(1.6, () => sayI('The nails shriek out of the wood, one end, then the other, and the lid comes away. Inside, in straw: the pendulum, and the winding crank.', 6400));
  });
}
// the lid, off and lying on the floor beside where the crate stood
function lidOff(anim) {
  const lid = O.crateLid, cp = O.crate.position;
  if (lid.parent !== scene) scene.attach(lid);
  const to = { x: CRATE.x - 0.08, y: 0.03, z: CRATE.z - 0.72, ry: 0.35 };
  if (S.lidAt) Object.assign(to, S.lidAt); else { S.lidAt = { x: cp.x - 0.08, y: 0.03, z: clamp(cp.z - 0.72, RM.z0 + 0.4, RM.z1 - 0.4), ry: 0.35 }; Object.assign(to, S.lidAt); save(); }
  if (!anim) { lid.position.set(to.x, to.y, to.z - CRATE.d / 2); lid.rotation.set(0, to.ry, 0); return; }
  const p0 = lid.position.clone(), q0 = lid.rotation.clone();
  tween(0.35, k => { lid.position.set(lerp(p0.x, to.x, k), lerp(p0.y, to.y, k * k), lerp(p0.z, to.z - CRATE.d / 2, k)); lid.rotation.set(lerp(q0.x, 0, k), lerp(q0.y, to.ry, k), 0); }, () => { sThunk(new THREE.Vector3(to.x, 0.1, to.z), 0.5, 140); renderer.shadowMap.needsUpdate = true; }, k => k);
}
function takeCrank() { if (S.crankTaken) return; S.crankTaken = true; O.crateCrank.visible = false; give('crank'); save(); sClick(O.crate.position.clone().setY(0.5), 0.3, 1600); }

/* ---------------- winding the strike (and the weight comes up the shaft) ---------------- */
function windActions() {
  if (!S.coverOpen) {
    if (took('key')) return [{ label: 'Unlock the cover with the iron key', run: unlockCover }];
    return [{ label: 'Look', run: () => { flag('coverSeen'); sayI('A square iron cover, locked, low on the back of the clock: the strike\'s winding square is behind it. A restorer\'s tag hangs on it: "KEY? Kroupa says: on St Peter\'s keys."', 7400); } }];
  }
  if (S.wound >= WIND_N) return [look('Wound. The strike weight hangs high in the shaft now.')];
  if (!took('crank')) return [{ label: 'Look', run: () => { flag('squareSeen'); sayI('The strike train\'s winding square: a stub of square iron. It needs a crank.', 4600); } }];
  return [{ label: `Turn the crank (${S.wound} of ${WIND_N}) · loud`, run: windOnce }];
}
function unlockCover() { S.coverOpen = true; drop('key'); save(); sClick(POS.wind, 0.4, 1600); sCreak(POS.wind, 0.5, 0.08, 160); tween(0.8, k => { O.windCover.rotation.y = -k * 1.7; }); sayI('The key turns. The cover swings aside on a stiff hinge: behind it, the square iron end of the winding shaft.', 5200); }
function windOnce() {
  if (G.time < (G.lockout || 0)) { sayI('Your hands are shaking. Give it a moment.', 2600); return; }
  if (G.time < (V.windCD || 0)) return; V.windCD = G.time + 0.55;
  loud(() => {
    S.wound++; save(); O.windCrank.visible = true; sRatchet(POS.wind, 0.7); after(0.25, () => sRatchet(POS.wind, 0.55)); sCreak(new THREE.Vector3(-2.47, 2.9, 1.9), 0.6, 0.1, 200);
    tween(0.6, k => { O.windCrank.rotation.z = -k * TAU; }, () => { O.windCrank.rotation.z = 0; if (S.wound >= WIND_N) { O.windCrank.visible = false; drop('crank'); sayI('The ratchet catches and holds. Wound. Behind you, in the shaft, the weight has come right up out of the dark.', 6000); after(20, watchmanScene); } else if (S.wound === 2 && !S.ev.risingSaid) { S.ev.risingSaid = true; save(); sayI('With every turn the cable over the shaft creaks: the strike weight is coming up.', 4600); } });
    setWeights();
  });
}
function setWeights() { const w = O.weights[1]; if (!w) return; const y = lerp(WEIGHT_Y[0], WEIGHT_Y[1], clamp(S.wound / WIND_N, 0, 1)); tween(0.6, k => { w.position.y = lerp(w.position.y, y, k); placeCable(w); }); placeCable(O.weights[0]); }
function placeCable(w) { const cab = w.userData.cab, top = 2.9 - w.position.y, bot = 0.34; cab.scale.y = Math.max(0.01, top - bot); cab.position.y = (top + bot) / 2; }

/* ---------------- the weight shaft and the pin ---------------- */
function shaftActions() {
  if (S.pinTaken) return [look('The weight shaft: cables down into the dark, and a smell of cold stone.')];
  if (S.wound >= WIND_N) return [{ label: 'Reach down for the pin', run: reachPin }, { label: 'Look down', run: lookShaft }];
  return [{ label: 'Look down', run: lookShaft }];
}
function lookShaft() {
  flag('pinSeen');
  if (S.wound >= WIND_N) sayI('The strike weight hangs just below the floor now, an arm\'s length down. On top of it, the little brass pin.', 5600);
  else if (S.wound > 0) sayI('The strike weight is coming up the shaft as you wind. The brass glint on top of it is nearer, but still out of reach.', 5600);
  else sayI('A square shaft straight down through the tower, two cables into the dark. Far below, on top of the strike weight, something small and brass catches your lamp: a pin. Far too deep to reach.', 7400);
}
function reachPin() {
  if (G.cutscene || S.pinTaken) return;
  if (DRAG.cur) dragEnd(true);
  G.cutscene = true; bodyHold(); const s0 = { x: P.x, z: P.z, yaw: G.yaw, pitch: G.pitch, eye: G.eye, y: V.hold.y };
  const kx = SH.x1 + 0.38, kz = clamp(P.z, SH.z0 + 0.15, SH.z1 - 0.15), yT = Math.PI / 2;
  // kneel at the rail and reach down into the shaft
  tween(0.8, k => { P.x = lerp(s0.x, kx, k); P.z = lerp(s0.z, kz, k); G.eye = G.eyeT = lerp(s0.eye, 0.95, k); G.yaw = s0.yaw + wrapA(yT - s0.yaw) * k; G.pitch = lerp(s0.pitch, -1.15, k); });
  after(0.9, () => { O.myHand.visible = true; O.myPin.visible = false; O.myHand.rotation.set(0.9, 0, 0); O.myHand.position.set(-0.04, -0.12, -0.28); tween(0.8, k => { O.myHand.position.set(-0.04, lerp(-0.12, -0.2, k), lerp(-0.28, -0.5, k)); }); });
  after(1.8, () => { O.pinW.visible = false; O.myPin.visible = true; sClick(new THREE.Vector3(-2.47, -0.6, 2.0), 0.3, 2200); });
  // as your fingers close on it, something far below takes hold of the weight
  after(2.0, () => { const w = O.weights[1], y = w.position.y; sThunk(new THREE.Vector3(-2.47, -1.5, 2.0), 0.6, 80); G.shake = 0.8; G.fearT = 0.8; sStinger(0.6); tween(0.18, k => { w.position.y = y - k * 0.14; placeCable(w); }, () => tween(0.5, k => { w.position.y = y - 0.14 + k * 0.14; placeCable(w); })); after(0.6, () => countWhisper(1, new THREE.Vector3(-2.47, -3.5, 1.9), 0.9)); });
  after(2.6, () => { tween(0.4, k => { O.myHand.position.set(-0.04, lerp(-0.2, -0.32, k), lerp(-0.5, -0.3, k)); }, () => { O.myHand.visible = false; O.myPin.visible = true; }); });
  after(3.1, () => { S.pinTaken = true; give('pin'); save(); tween(0.7, k => { G.eye = G.eyeT = lerp(0.95, 1.62, k); G.pitch = lerp(-1.15, -0.2, k); }, () => { bodyFree(P.x, 0, P.z); G.cutscene = false; updatePrompt(true); sayI('As your fingers closed on the pin, the cable jerked, as if something far below had taken hold of the weight. Then it was still.', 6400); V.stillDue = G.time + 32; }); });
}

/* ---------------- up on the crate: the clutch and the fly ---------------- */
function clutchActions() {
  if (S.pinIn) return [look('The pin sits through the clutch. The apostles are coupled to the strike.')];
  if (!highNear(POS.clutch)) return [{ label: 'Look', run: () => { flag('clutchSeen'); sayI('The apostles\' clutch, up on top of the clock: two iron dogs on the shaft that runs up to the drum, a square hole through both. Empty: its pin is missing. Too high to reach from the floor.', 7400); } }];
  if (took('pin')) return [{ label: 'Fit the pin into the clutch', run: fitPin }];
  return [{ label: 'Look', run: () => { flag('clutchSeen'); sayI('The apostles\' clutch. A square hole through both dogs, and no pin in it.', 4200); } }];
}
function fitPin() {
  if (G.cutscene) return;
  G.cutscene = true; V.clutchScene = true; bodyHold(); const saved = { x: P.x, z: P.z, yaw: G.yaw, pitch: G.pitch, eye: G.eye, y: V.hold.y };
  tween(0.8, k => { P.x = lerp(saved.x, POS.clutch.x, k); P.z = lerp(saved.z, POS.clutch.z + 0.62, k); G.eye = G.eyeT = lerp(saved.eye, 2.4, k); G.yaw = saved.yaw + wrapA(0 - saved.yaw) * k; G.pitch = lerp(saved.pitch, -0.62, k); });
  // your hand reaches in from below, fingers forward, the pin between them
  after(0.9, () => { O.myHand.visible = true; O.myHand.rotation.set(0.3, 0, 0); O.myHand.position.set(-0.05, -0.24, -0.3); tween(1.1, k => { O.myHand.position.set(lerp(-0.05, -0.02, k), lerp(-0.24, -0.11, k), lerp(-0.3, -0.42, k)); }); });
  after(2.1, () => { sClick(POS.clutch, 0.5, 1800); sThunk(POS.clutch, 0.4, 220); O.pinIn.visible = true; O.myPin.visible = false; drop('pin'); });
  // a grey hand comes out of the gears below and closes on your fingers
  after(2.5, () => { O.hand.visible = true; O.hand.scale.setScalar(1.3); O.hand.position.set(0.0, -0.32, -0.66); O.hand.rotation.set(-1.1, Math.PI - 0.1, 0.05); tween(0.35, k => { O.hand.position.set(lerp(0.0, -0.01, k), lerp(-0.32, -0.125, k), lerp(-0.66, -0.53, k)); O.hand.rotation.x = lerp(-1.1, -0.5, k); }); });
  after(2.9, () => { sStinger(1.0); G.flash = 0.25; G.shake = 1.2; G.fearT = 1; sBreath(camera.position.clone().add(new THREE.Vector3(0, -0.3, -0.4)), 1, 0.5, true); });
  after(3.05, () => { G.flash = 0; });
  after(3.6, () => { tween(0.25, k => { O.myHand.position.y = lerp(-0.11, -0.34, k); O.hand.position.y = lerp(-0.125, -0.4, k); }, () => { O.myHand.visible = false; O.hand.visible = false; O.hand.scale.setScalar(1); O.myPin.visible = true; }); });
  after(4.0, () => { S.pinIn = true; save(); tween(0.7, k => { P.x = lerp(POS.clutch.x, saved.x, k); P.z = lerp(POS.clutch.z + 0.62, saved.z, k); G.eye = G.eyeT = lerp(2.4, saved.eye, k); G.pitch = lerp(-0.62, saved.pitch, k); }, () => { bodyFree(saved.x, saved.y, saved.z); G.cutscene = false; V.clutchScene = false; updatePrompt(true); sayI('A hand. Out of the gears, grey and cold, round your fingers. You tear yours away. The pin is in: the apostles are coupled to the strike.', 7000); }); });
}
function flyActions() {
  const wide = S.fly === 'wide';
  if (!highNear(POS.fly)) return [{ label: 'Look', run: lookFly }];
  return [{ label: wide ? 'Turn the vanes edge-on (fast)' : 'Turn the vanes face-on (slow)', run: () => setFly(wide ? 'narrow' : 'wide') }, { label: 'Look', run: lookFly }];
}
function lookFly() {
  const up = highNear(POS.fly) ? '' : ' It\'s up on top of the clock: you\'d need something to stand on.';
  if (S.fly === 'wide') sayI('The fly\'s vanes are face-on now, flat to the air. They\'ll hold her back: she\'ll strike slowly.', 5200);
  else if (S.flags.fastSeen) sayI('The fly: two brass vanes that spin while she strikes. Set edge-on, they slice the air and she races. Turned face-on, they\'d hold her back.' + up, 7200);
  else sayI('The fly, on top of the clock: two brass vanes on a spindle that spin while she strikes, to brake her. They\'re set edge-on, slicing the air.' + up, 6800);
}
function setFly(f) { if (S.fly === f) return; S.fly = f; save(); sClick(POS.fly, 0.25, 2200); setVanes(); sayI(f === 'wide' ? 'You loosen the wing nut, turn the vanes face-on, flat to the air, and tighten it again.' : 'You turn the vanes back edge-on.', 4200); }
function setVanes() { const r = S.fly === 'wide' ? 0 : 1.33; O.vanes.forEach(v => v.rotation.x = r); }

/* ---------------- the hands, and she strikes ---------------- */
function handsTo(h) { const a = angHour(h); O.sunHand.rotation.z = -a; O.moonHand.rotation.z = -(a + Math.PI / 2); O.zodRing.rotation.z = -zodRingRot(h); if (O.bigSun) { O.bigSun.rotation.z = -a; O.bigMoon.rotation.z = -(a + Math.PI / 2); O.bigZod.rotation.z = -zodRingRot(h); } }
function turnHands() {
  if (G.cutscene || V.handsT) return;
  if (V.strike) { sayI('She\'s striking. The hands won\'t turn while she strikes.', 3000); return; }
  const before = S.hands, to = (Math.floor(before / 60) + 1) * 60; V.handsT = true;
  sClick(POS.knob, 0.2, 3000); sWhirr(0.9);
  tween(1.0, k => { handsTo(lerp(before, to, k) / 60); O.knobArm.rotation.z = -k * TAU * 2; }, () => { S.hands = to % 1440; save(); V.handsT = false; release(); });
}
// the hands pass the hour: the warning drops and, if she is wound, she strikes twelve
function release() {
  sClick(POS.frame, 0.4, 900); sThunk(POS.frame, 0.25, 140);
  flag('tried');
  if (S.wound < WIND_N) { sayI('Something drops inside the frame with a click, and catches. Nothing else moves: the strike isn\'t wound.', 5600); return; }
  startStrike(12, S.fly === 'wide' ? 2.0 : 0.45, S.pinIn);
}
function startStrike(n, interval, proc) {
  const lead = proc ? 2.6 : 1.0;
  V.strike = { n, i: 0, interval, t: -lead, proc, end: G.time + lead + n * interval + 0.6 };
  V.bellUntil = Math.max(V.bellUntil, V.strike.end + 1.2);
  sWhirr(1.0);
  if (proc) {
    sDeathBell(); tween(0.6, k => { O.deathLever.rotation.z = Math.sin(k * Math.PI * 3) * 0.4; });
    after(0.6, () => { sCreak(POS.loftMid, 1.0, 0.12, 90); tween(1.2, k => O.shutters.forEach(s => s.rotation.y = s.userData.s * -k * 1.9)); });
    V.proc = 1;
  }
  // while she strikes he doesn't hide in the works: he stands in the room and counts
  showHimCounting();
}
function strikeUpdate(dt) {
  const st = V.strike; if (!st) return;
  st.t += dt;
  const spin = st.proc || st.t > 0; V.gearSpin = spin ? 1 : 0;
  if (st.proc && st.t > -1.0) { const total = st.n * st.interval + 1.0; O.wheel.rotation.y = wheelRot(S.wheel) - clamp((st.t + 1.0) / total, 0, 1) * TAU; }
  while (st.i < st.n && st.t >= st.i * st.interval) {
    st.i++; const k = st.i; sStrike(); tween(0.12, q => { O.bellHammer.rotation.z = Math.sin(q * Math.PI) * 0.5; O.hammer.rotation.z = Math.sin(q * Math.PI) * 0.3; });
    const p = V.hanShown ? hanHead() : hisNode();
    after(0.35, () => countWhisper(k, p, V.hanShown ? 1.1 : 0.7));
    if (V.hanShown) { const nk = O.han.userData.neck; tween(0.3, q => { nk.rotation.x = 0.25 + Math.sin(q * Math.PI) * 0.12; }); }
  }
  if (st.t > st.n * st.interval + 0.6) endStrike();
}
function endStrike() {
  const st = V.strike; V.strike = null; V.gearSpin = 0;
  if (V.escaping) { O.wheel.rotation.y = wheelRot(S.wheel); return; }      // the escape handles the rest
  if (st.proc) {
    V.proc = 0; tween(1.0, k => O.shutters.forEach(s => s.rotation.y = s.userData.s * -(1 - k) * 1.9), () => { sThunk(POS.loftMid, 0.3, 120); });
    O.wheel.rotation.y = wheelRot(S.wheel);
  }
  let caught = false;
  if (V.hanShown) {
    // the last stroke: his head comes up and turns towards you
    const nk = O.han.userData.neck, hp = O.han.position, dx = P.x - hp.x, dz = P.z - hp.z, d = Math.hypot(dx, dz);
    tween(0.5, k => { nk.rotation.set(lerp(0.25, -0.05, k), 0, 0.12); O.han.rotation.y = lerp(O.han.rotation.y, Math.atan2(dx, dz), k * 0.7); });
    if (d < 1.4 && !onLoft()) { caught = true; after(0.5, () => { hideHim(); lungeScare('late'); }); }
    else after(0.9, () => { V.flick = 0.8; after(0.4, hideHim); });
  }
  if (caught) return;
  if (st.proc && st.interval < 1 && !S.flags.fastSeen) { flag('fastSeen'); after(1.6, () => sayI('Twelve strokes, quick as a sewing machine, and the shutters banged shut again. Nobody could get up there in that time. Something has to slow her down.', 7600)); }
  else if (!st.proc && !S.ev.noProcSaid) { S.ev.noProcSaid = true; save(); after(1.4, () => sayI('She struck twelve, but the apostles never moved and their windows stayed shut. The procession isn\'t coupled to the strike.', 6800)); }
}
function showHimCounting() {
  if (V.hanShown) { V.hanUntil = 1e9; return; }
  const p = standSpot('strike'); if (!p) return;
  standAndCount(p, 1e9, 0.9);
  if (!S.ev.sawStanding && S.pinIn) { S.ev.sawStanding = true; save(); after(1.6, () => sayI('He is standing in the open, head on one side, counting under his breath. He won\'t move until the last stroke.', 6400)); }
}

/* ---------------- the escape ---------------- */
const ESC_NEED = 6.6;
function housDoorActions() {
  if (V.proc && V.strike && V.strike.proc && !V.escaping) return [{ label: 'Squeeze between the apostles', run: escape }];
  if (peterHere()) return [{ label: 'Take the iron key', run: takeKey }, { label: 'Look', run: lookDoor }];
  return [{ label: 'Look', run: lookDoor }];
}
function escape() {
  if (V.escaping || G.cutscene) return;
  const left = V.strike ? V.strike.end - G.time : 0;
  V.escaping = true; G.cutscene = true; closeAll(); flag('triedOut'); V.escN = V.strike ? V.strike.n : 12; bodyHold();
  const ok = left >= ESC_NEED;
  const p0 = { x: P.x, z: P.z, eye: G.eye, yaw: G.yaw, pitch: G.pitch };
  // crouch into the door, the apostles sliding past your face
  tween(0.9, k => { P.x = lerp(p0.x, HOUS.x, k); P.z = lerp(p0.z, HOUS.z + HOUS.r + 0.1, k); G.eye = G.eyeT = lerp(p0.eye, LOFT.y + 0.55, k); G.yaw = p0.yaw + wrapA(0 - p0.yaw) * k; G.pitch = lerp(p0.pitch, -0.1, k); });
  after(0.6, () => { sScrape(POS.housDoor, 0.8, 0.2); sBreath(camera.position.clone(), 1, 0.4, true); });
  if (!ok) {
    after(1.4, () => { tween(0.8, k => { P.z = lerp(HOUS.z + HOUS.r + 0.1, HOUS.z + 0.25, k); }); });
    after(2.0, () => { sayI('Too late: the last stroke. He turns. The apostles stop, and the wheel is a wall of wood.', 4000); });
    after(2.6, () => { V.escaping = false; P.x = HOUS.x; P.z = -1.05; G.eye = G.eyeT = EYE_LOFT; bodyFree(HOUS.x, LOFT.y, -1.05); G.cutscene = false; hideHim(); O.shutters.forEach(s => s.rotation.y = 0); lungeScare('late'); });
    return;
  }
  after(0.9, () => { tween(1.6, k => { P.z = lerp(HOUS.z + HOUS.r + 0.1, HOUS.z - 0.25, k); P.x = lerp(HOUS.x, APW.xs[0] + 0.05, k); G.yaw = lerp(0, -0.25, k); }); });
  after(1.2, () => { sayI('Between St Paul and St John, painted wooden shoulders sliding past your face, out through the gap...', 4200); });
  // out of the window, on to the scaffold planks, into the cold
  after(2.6, () => { tween(1.6, k => { P.z = lerp(HOUS.z - 0.25, FZ - 0.55, k); P.x = lerp(APW.xs[0] + 0.05, APW.xs[0] + 0.2, k); G.eye = G.eyeT = lerp(LOFT.y + 0.55, APW.y0 - 0.26 + 1.55, k); G.pitch = lerp(-0.1, -0.05, k); }); sCreak(new THREE.Vector3(APW.xs[0], APW.y0, FZ), 1, 0.14, 140); });
  after(4.4, () => { V.finalOut = true; S.flags.escaped = true; save(); if (A.loops.wind) setGain(A.loops.wind, 0.08, 0.5); tween(1.6, k => { G.yaw = lerp(-0.25, -0.05, k); G.pitch = lerp(-0.05, 0.02, k); }); sayI('Snow. The whole square below you, white and empty. Behind you, through the window, she strikes on, slow, and he counts.', 6000); });
  after(Math.max(7.5, left + 0.6), finale);
}
function finale() {
  // the last stroke: a grey hand out of the window, round your ankle; you kick free and it lets go
  countWhisper(V.escN || 12, new THREE.Vector3(APW.xs[0], APW.y0 + 0.3, RM.z0 + 0.1), 1.2);
  after(0.8, () => { G.pitch = -0.9; O.hand.visible = true; O.hand.scale.setScalar(1.5); O.hand.position.set(0.05, -0.62, -0.85); O.hand.rotation.set(0.9, 0.12, 0.08); camera.updateMatrixWorld(); L.rim.position.copy(camera.localToWorld(new THREE.Vector3(0.15, -0.1, -0.75))); L.rim.intensity = 0.6; tween(0.45, k => { O.hand.position.y = lerp(-0.62, -0.34, k); O.hand.position.z = lerp(-0.85, -1.05, k); }); sayI('A grey hand, out of the window behind you, along the plank. Round your ankle.', 1800); sStinger(0.9); G.shake = 1.0; G.fearT = 1; });
  after(1.6, () => { tween(0.3, k => { O.hand.position.y = lerp(-0.34, -0.7, k); O.hand.position.z = lerp(-1.05, -0.85, k); }, () => { O.hand.visible = false; O.hand.scale.setScalar(1); L.rim.intensity = 0; }); sThunk(new THREE.Vector3(APW.xs[0], APW.y0, FZ), 0.6, 90); sayI('You kick, and kick, and it lets go. The shutters bang shut behind you.', 4000); tween(0.8, k => O.shutters.forEach(s => s.rotation.y = s.userData.s * -(1 - k) * 1.9)); });
  after(3.6, () => { V.black = 3; $('#fx').className = 'lids'; });
  after(5.2, () => finishRoom(endFrame()));
}

/* ---------------- set pieces ---------------- */
// "Don't move": the lamps die, he comes down into the room and walks round you in the dark
function stillScene() {
  if (V.still || S.ev.still) return;
  if (DRAG.cur) dragEnd(true);
  V.still = { t: 0, p0: null, failed: false, path: null }; S.ev.still = true; save(); closeAll(); hideHim();
  sPop(POS.light); S.workLamp = false; save(); V.flick = 0.6; after(0.7, () => { V.headOff = true; }); after(1.0, () => { V.envDue = true; });
  sayI('The work lamp pops and dies. Your headlamp flickers, and goes out.', 4000);
}
function stillUpdate(dt) {
  const s = V.still; if (!s) return; s.t += dt;
  const t = s.t;
  if (t > 1.2 && !s.thud) { s.thud = true; sThunk(new THREE.Vector3(LADDER.x, LOFT.y, -1.2), 0.6, 80); sCreak(new THREE.Vector3(LADDER.x, 1.5, -0.4), 1.6, 0.14, 90); }
  if (t > 2.6 && !s.s1) { s.s1 = true; sayI('Something has come down the ladder. He\'s in the room.', 3600); }
  if (t > 4.2 && !s.s2) { s.s2 = true; subtitle('', '<b>He finds you by sound. Don\'t move.</b> <i>Not a step.</i>', 5000); s.p0 = { x: P.x, z: P.z, y: BODY.y }; sHeart(16, 0.4, 0.75);
    // his walk: from the ladder, close past your face, round behind you, away to the weight shaft
    const fwd = new THREE.Vector3(-Math.sin(G.yaw), 0, -Math.cos(G.yaw)), side = new THREE.Vector3(fwd.z, 0, -fwd.x), P0 = new THREE.Vector3(P.x, 0, P.z);
    const pt = (f, sd) => P0.clone().add(fwd.clone().multiplyScalar(f)).add(side.clone().multiplyScalar(sd));
    const clampPt = v => { v.x = clamp(v.x, RM.x0 + 0.3, RM.x1 - 0.3); v.z = clamp(v.z, RM.z0 + 0.3, RM.z1 - 0.3); return v; };
    s.path = [new THREE.Vector3(LADDER.x, 0, 0.1), clampPt(pt(1.6, -0.6)), clampPt(pt(0.55, -0.15)), clampPt(pt(0.1, 0.5)), clampPt(pt(-0.7, 0.3)), clampPt(pt(-1.6, -0.6)), new THREE.Vector3(-2.45, 0, 1.3)].map(clampPt);
    O.han.visible = true; O.han.scale.setScalar(1); O.han.position.copy(s.path[0]); V.hanShown = false; }
  if (s.path && !s.failed) {
    // walk the path slowly, pausing by your face
    const seg = [[4.5, 7.0], [7.0, 9.0], [9.0, 12.0], [12.0, 13.6], [13.6, 15.2], [15.2, 17.4], [17.4, 19.4]];
    for (let i = 0; i < seg.length - 1; i++) { const [a, b] = seg[i]; if (t >= a && t < b) { const k = smooth((t - a) / (b - a)); const p = s.path[i].clone().lerp(s.path[i + 1], k); const dir = s.path[i + 1].clone().sub(s.path[i]); O.han.position.copy(p); if (dir.lengthSq() > 1e-4) O.han.rotation.y = Math.atan2(dir.x, dir.z); } }
    if (t >= 9.0 && t < 12.0) { const to = new THREE.Vector3(P.x - O.han.position.x, 0, P.z - O.han.position.z); O.han.rotation.y = Math.atan2(to.x, to.z) + Math.sin(t * 1.3) * 0.3; O.han.userData.neck.rotation.set(0.1, Math.sin(t * 0.9) * 0.4, 0.3); if (!s.br) { s.br = true; sBreath(camera.position.clone().add(new THREE.Vector3(0, -0.05, 0).add(new THREE.Vector3(-Math.sin(G.yaw), 0, -Math.cos(G.yaw)).multiplyScalar(0.5))), 2, 0.6, true); after(2.4, () => { whisper('dech', hanHead(), 1.1); heard('dech'); }); } }
    if (t > 5.0 && t < 19.0) { const moved = Math.hypot(P.x - s.p0.x, P.z - s.p0.z) > 0.05 || Math.abs(BODY.y - s.p0.y) > 0.05 || !!DRAG.cur; if (moved) { s.failed = true; O.han.visible = false; lungeScare('still'); after(3.2, endStill); return; } }
    if (t >= 19.4) { O.han.visible = false; sScrape(NODES.shaft, 1.0, 0.18); endStill(); }
    if (O.han.visible) { L.rim.position.set(O.han.position.x + 0.5, 2.2, O.han.position.z + 0.4); L.rim.intensity = 0.7; }
  }
}
function endStill() { if (!V.still) return; const failed = V.still.failed; V.still = null; L.rim.intensity = 0; V.headOff = false; V.flick = 0.6; O.han.visible = false; O.han.userData.neck.rotation.set(0.25, 0, 0.12); after(0.8, () => sayI(failed ? 'Your headlamp flickers back on. The work lamp\'s battery is dead.' : 'He has gone, down into the weight shaft. Your headlamp flickers back on. The work lamp\'s battery is dead.', 5600)); V.envDue = true; }
// the watchman at the stair door, who isn't the watchman
function watchmanScene() {
  if (S.ev.watch || V.watch) return;
  if (G.cutscene || V.strike || V.still || onLoft() || G.uiOpen) { after(8, watchmanScene); return; }
  V.watch = true; S.ev.watch = true; save();
  const dp = new THREE.Vector3(RM.x1 + 0.3, 1.4, 1.05);
  sKnocks(dp, 3, 0.55, 1.0, 1);
  after(2.2, () => { playClip('o_w1', { pos: dp, fx: 'muffled', volume: 1.1 }); subtitle('At the stair door', '"Haló? Je tam nahoře někdo?" <i>(Hello? Is somebody up there?)</i>', 4600); });
  after(7.0, () => { sKnocks(dp, 2, 0.5, 1.1, 1); });
  after(8.6, () => { playClip('o_w2', { pos: dp, fx: 'muffled', volume: 1.1 }); subtitle('At the stair door', '"To jsem já, hlídač. Otevřete mi." <i>(It\'s me, the watchman. Open up for me.)</i>', 5000); });
  after(15.5, () => { whisper('slysim', new THREE.Vector3(RM.x1 - 0.1, 1.05, 0.8), 1.3); subtitle('', '<i>A whisper, right at the keyhole: "Slyším tě."</i> (I can hear you.)', 4400); heard('watch'); tween(2.2, k => { O.doorRing.rotation.x = Math.sin(k * Math.PI) * 0.8; }); sCreak(dp, 2.0, 0.08, 60); G.fearT = 0.8; });
  after(21, () => { V.watch = null; sayI('No footsteps going away down the stairs. Whoever that was, he didn\'t come up them either.', 5600); });
}
function doorActions() {
  return [{ label: 'Try the door · loud', run: () => loud(() => { sThunk(POS.door, 0.5, 120); sKnock(POS.door, 0.4, 0, 1); sayI('Locked, from the stairs side. The watchman has the key, down in his lodge, until six.', 4800); }), }, look('Heavy oak, iron straps, an iron ring for a handle. Locked from the stair side.')];
}

/* ---------------- the director: small things in the dark ---------------- */
const EVENTS = [
  { id: 'tap', ok: () => true, run: () => { const p = hisNode(); const n = irand(3, 6); for (let i = 0; i < n; i++) after(i * 0.62, () => sClick(p, 0.16, 2200 + rand(-200, 200))); } },
  { id: 'gear', ok: () => !onLoft(), run: () => { sClick(POS.frame, 0.3, 1200); sThunk(POS.frame, 0.12, 160); O.going.forEach(g => g.rotation.z += 0.04); } },
  { id: 'hum', ok: () => true, run: () => { bellTone(POS.bell, 0.05, 523, CHURCH, 3.0, 0.5); if (!S.ev.humSaid) { S.ev.humSaid = true; save(); after(1.2, () => sayI('The bell hums, very softly, as if somebody had laid a finger on it.', 4200)); } } },
  { id: 'whisper', ok: () => progCount() >= 1, run: () => { const p = hisNode(); const k = irand(1, 12); for (let i = 0; i < 3; i++) after(i * 1.4, () => countWhisper(k + i, p, 0.55)); } },
  { id: 'dust', ok: () => !onLoft(), run: () => { sCreak(new THREE.Vector3(rand(-1.5, 1.5), LOFT.y + 0.3, -1.6), 1.6, 0.1, 80); dustFall(); } },
  { id: 'death', ok: () => progCount() >= 1, run: () => { sDeathBell(); tween(1.0, k => { O.deathLever.rotation.z = Math.sin(k * Math.PI * 4) * 0.35 * (1 - k); }); if (!S.ev.deathSaid) { S.ev.deathSaid = true; save(); after(1.4, () => sayI('Outside, Death\'s little bell rings. The lever on the wall jerks with it. Nothing is driving it.', 5200)); } } },
  { id: 'stairs', ok: () => !onLoft(), run: () => { for (let i = 0; i < 6; i++) after(i * 0.85, () => sStep(0.05)); } },
  { id: 'flick', ok: () => true, run: () => { V.flick = 0.9; } },
  { id: 'drag', ok: () => !onLoft() && progCount() >= 2, run: () => { sScrape(new THREE.Vector3(rand(-1, 1), LOFT.y + 0.1, -1.4), 2.4, 0.16); } },
  { id: 'breath', ok: () => progCount() >= 3, run: () => { sBreath(camera.position.clone().add(new THREE.Vector3(Math.sin(G.yaw) * 0.6, 0, Math.cos(G.yaw) * 0.6)), 1, 0.3, true); } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || V.strike || V.still || V.watch || V.finalOut || V.escaping || V.hanShown) return;
  V.dirT -= dt; if (V.dirT > 0) return;
  const opts = EVENTS.filter(e => e.id !== V.last && e.ok());
  for (let tr = 0; tr < 4 && opts.length; tr++) { const e = opts.splice(Math.floor(Math.random() * opts.length), 1)[0]; if (e.run() !== false) { V.last = e.id; break; } }
  V.dirT = rand(38, 64) - progCount() * 3;
}
function dustFall() { if (!O.dust) return; O.dust.forEach(d => { d.position.set(rand(-1.5, 1.5), LOFT.y - 0.1, rand(-1.0, -0.6)); d.userData.v = rand(0.3, 0.6); d.userData.life = rand(2, 4); }); }

/* ---------------- lights and sound every frame ---------------- */
function lightsUpdate(dt) {
  V.black = Math.max(0, V.black - dt); V.flick = Math.max(0, V.flick - dt);
  let k = 1;
  if (V.black > 0 || V.headOff) k = 0;
  else if (V.flick > 0) k = Math.random() < 0.45 ? 0.05 : 1;
  V.head = lerp(V.head, k, Math.min(1, dt * 25));
  const out = V.finalOut;
  L.head.intensity = (IS_TOUCH ? 5 : 4.2) * V.head * (out ? 0.3 : 1) * (V.clutchScene ? 0.1 : V.escaping ? 0.12 : 1);
  const lampOn = S.workLamp && V.black <= 0 && !out;
  const lf = V.flick > 0 && S.workLamp ? (Math.random() < 0.3 ? 0.2 : 1) : 1;
  L.work.intensity = lampOn ? 20 * lf : 0; L.workFill.intensity = lampOn ? 0.5 * lf : 0; M.ledPanel.emissiveIntensity = lampOn ? 1.6 * lf : 0.02;
  L.win.intensity = 0.5; L.apw.intensity = V.escaping ? 0.3 : 0.3 + V.proc * 1.0; L.drum.intensity = V.escaping ? 0.04 : 0.12 + V.proc * 0.5 + (onLoft() ? 0.35 : 0);
  L.street.intensity = 26; L.moon.intensity = 0.25; L.hemi.intensity = out ? 0.3 : 0.04;
  if (O.lamps) O.lamps.forEach((l, i) => { l.material.opacity = 0.8 + Math.sin(G.time * 3 + i) * 0.05; });
  if (O.pinGlint) O.pinGlint.material.opacity = 0.55 + Math.sin(G.time * 2.3) * 0.3;
  G.blackT = V.black > 0 ? 1 : 0;
}
function startAmbience() {
  if (!A.ready || A.loops.wind) return;
  A.loops.wind = loopNoise({ pos: new THREE.Vector3(-0.4, 3.2, RM.z0 - 1), type: 'bandpass', f: 420, q: 0.6, vol: 0.022, wet: 0.4, ref: 1.5 });
  A.loops.room = loopNoise({ pos: new THREE.Vector3(0, 2.5, 0), type: 'lowpass', f: 120, q: 0.7, vol: 0.02, brown: true, wet: 0.1, ref: 2 });
  A.loops.city = loopNoise({ pos: new THREE.Vector3(0, -6, -20), type: 'lowpass', f: 300, q: 0.5, vol: 0.006, brown: true, wet: 0.4, ref: 4 });
  A.loops.gears = loopNoise({ pos: POS.frame, type: 'bandpass', f: 900, q: 2.5, vol: 0, wet: 0.2, ref: 1 });
  A.loops.flyw = loopNoise({ pos: POS.fly, type: 'bandpass', f: 320, q: 1.5, vol: 0, wet: 0.2, ref: 1 });
  const ctx = A.ctx, tg = ctx.createGain(); tg.gain.value = 0; [41.2, 61.7, 65.4, 82.4].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = rand(-9, 9); o.connect(tg); o.start(); }); route(tg, { wet: 0.6 }); A.loops.tension = { gain: tg };
}
function soundUpdate(dt) {
  if (!A.ready || !A.loops.wind) return;
  setGain(A.loops.gears, V.gearSpin ? 0.05 : 0, 0.1);
  setGain(A.loops.flyw, V.gearSpin ? (S.fly === 'wide' ? 0.06 : 0.035) : 0, 0.1);
  if (A.loops.flyw && A.loops.flyw.filter) A.loops.flyw.filter.frequency.value = S.fly === 'wide' ? 260 + Math.sin(G.time * 9) * 60 : 520 + Math.sin(G.time * 30) * 80;
  setGain(A.loops.tension, V.finalOut ? 0 : 0.003 + progCount() * 0.0012 + (V.still ? 0.008 : 0) + (V.hanShown ? 0.006 : 0), 2);
  setGain(A.loops.wind, V.finalOut ? 0.07 : 0.022 + V.proc * 0.03, 0.5);
}

/* ---------------- interactions ---------------- */
const floorOnly = () => !onLoft() && !V.finalOut, loftOnly = () => onLoft() && !V.finalOut;
function registerInteractions() {
  scene.updateMatrixWorld(true);
  inter('book', O.book, { name: 'The keepers\' book', enabled: floorOnly, actions: () => [{ label: 'Read it', run: () => { flag('bookRead'); openDoc('book'); } }] });
  inter('clip', O.clip, { name: 'Restorers\' notes', enabled: floorOnly, actions: () => [{ label: 'Read it', run: () => { flag('clipRead'); openDoc('sheet'); } }] });
  inter('crowbar', O.crowbar, { name: 'Crowbar', enabled: () => floorOnly() && !took('crowbar') && !S.crateOpen, actions: () => [{ label: 'Take it', run: () => { give('crowbar'); O.crowbar.visible = false; save(); sClick(POS.bench, 0.25, 1400); } }] });
  inter('crate', O.crate, { name: () => S.crateOpen ? 'Crate 3, open' : 'Crate 3', reach: 2.2, enabled: floorOnly, actions: crateActions, note: () => (!S.crateOpen && took('crowbar')) ? loudNote() : '' });
  inter('cal', O.cal, { name: 'Calendar plate photograph', enabled: floorOnly, actions: () => [look('A big photographic print of the calendar plate below the dial outside, taped up by the restorers: a name for every day of the year round its rim.')] });
  inter('dial', O.dial, { name: 'Setting dial', enabled: floorOnly, actions: () => [look('A little copy of the great dial outside, for setting the hands. They stand at eleven, where the restorers stopped her. A little brass crank beside it turns them.')] });
  inter('knob', O.knob, { name: 'Little brass crank (the hands)', enabled: floorOnly, actions: () => [{ label: 'Turn the hands on to the next hour', run: turnHands }, look('A little brass crank on a square arbor beside the setting dial. It turns the hands round. When they pass an hour, she strikes, if she can.')] });
  inter('count', O.count, { name: 'Count wheel', enabled: floorOnly, actions: () => [look('The count wheel, a brass plate of old numerals on the back of the frame: it decides how many strokes she strikes. The restorers have chalked 12 beside it.')] });
  inter('fly', O.fly, { name: 'The fly', reach: 2.6, enabled: floorOnly, actions: flyActions });
  inter('wind', O.wind, { name: () => S.coverOpen ? 'Winding square' : 'Iron cover', enabled: floorOnly, actions: windActions, note: () => S.coverOpen && took('crank') && S.wound < WIND_N ? loudNote() : '' });
  inter('clutch', O.clutch, { name: 'Apostles\' clutch', reach: 2.4, enabled: floorOnly, actions: clutchActions });
  inter('cup', O.cup, { name: 'Keepers\' cupboard', enabled: floorOnly, actions: () => [{ label: 'Open it', run: openCupboard }] });
  inter('door', O.door, { name: 'Stair door', enabled: floorOnly, actions: doorActions, note: () => loudNote() });
  inter('sidewin', O.sideWin, { name: 'Little window', enabled: floorOnly, actions: () => [look('Old diamond panes, thick and greenish. Through them, Old Town Square under snow, the lamps, the two black spires of Týn church across the roofs. Nobody about at this hour.')] });
  inter('shaft', O.shaftHit, { name: 'Weight shaft', reach: 2.4, enabled: () => floorOnly() && !DRAG.cur, actions: shaftActions });
  inter('ladder', O.ladder, { name: () => onLoft() ? 'Ladder down' : 'Ladder to the loft', reach: 2.2, enabled: () => !V.finalOut && !V.escaping, actions: () => [onLoft() ? { label: 'Climb down', run: () => climbDown() } : { label: 'Climb up', run: climbUp }] });
  inter('loftEdge', O.loftEdgeHit, { name: 'Top of the ladder', reach: 2.2, enabled: loftOnly, actions: () => [{ label: 'Climb down', run: () => climbDown() }] });
  inter('crank', O.crank, { name: 'Handwheel for the apostles', enabled: loftOnly, actions: () => [{ label: 'Turn the wheel · loud', run: turnWheel }], note: () => loudNote() });
  inter('housDoor', O.housDoorHit, { name: () => V.proc ? 'The apostles, going round' : peterHere() ? 'St Peter, in the little door' : 'Little door in the drum', reach: 2.2, enabled: loftOnly, actions: housDoorActions, note: () => V.proc ? (V.strike ? 'The windows are open.' : '') : '' });
  inter('death', O.death, { name: 'Death\'s linkage', enabled: floorOnly, actions: () => [look('A wooden box on the wall with a lever and a wire through the stone. Outside, the wire works Death: the skeleton beside the dial who rings his little bell when she strikes.')] });
  inter('dialBack', O.dialBack, { name: 'Back of the great dial', enabled: floorOnly, actions: () => [look('The back of the great dial outside: a disc of old boards bound with iron, two metres across. The arbors from the clock come through its middle.')] });
  inter('frame', O.frameHit, { name: 'The clock', enabled: floorOnly, actions: () => [look('Six hundred years of iron and brass: three great wheels for the sun, the stars and the moon on the left, the going train in the middle, the strike train on the right. All of it still. The pendulum hook hangs empty.')] });
  inter('laptop', O.laptop, { name: 'Laptop', enabled: floorOnly, actions: () => [look('A restorer\'s laptop. Flat battery.')] });
  inter('toolbox', O.toolbox, { name: 'Toolbox', enabled: floorOnly, actions: () => [look('Screwdrivers, labels, cable ties, a camera battery.')] });
  inter('lamp', O.lamp, { name: 'Work lamp', enabled: floorOnly, actions: () => [look(S.workLamp ? 'A battery work lamp on a tripod, aimed at the back of the clock. The battery shows one bar.' : 'Dead. The battery\'s flat.')] });
}
function openCupboard() {
  if (!S.cupOpen) { S.cupOpen = true; save(); sCreak(POS.cupboard, 1.0, 0.14, 70); tween(1.0, k => { O.cupDoor.rotation.y = k * 1.75; }); O.cupIn.visible = true; renderer.shadowMap.needsUpdate = true; }
  after(S.cupOpen ? 0.2 : 1.0, () => openContainer('Inside the keepers\' cupboard', 'Shelves of dark wood, a smell of oil and cold iron. The keepers\' things, left as they were.', [
    { name: 'Oil can', desc: 'Clock oil, nearly empty. Kroupa\'s initials scratched on it.' },
    { name: 'Keeper\'s lantern', desc: 'An old candle lantern, the glass smoked brown. No candle.' },
    { name: 'Rags', desc: 'Old rags, black with oil, folded with care.' }]));
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  G.flash = Math.max(0, (G.flash || 0) - dt * 2.2);
  if (!V.finalOut) tynUpdate(dt);
  strikeUpdate(dt); stillUpdate(dt); hanUpdate(); lightsUpdate(dt); soundUpdate(dt); bellSign();
  const t = G.time;
  // gears turn while she strikes; the fly spins
  if (V.gearSpin) { O.strike.forEach((g, i) => g.rotation.z += dt * (i % 2 ? -1 : 1) * (1.6 + i * 0.7) * (S.fly === 'wide' ? 0.45 : 1.6)); O.pins.rotation.z += dt * (S.fly === 'wide' ? 0.6 : 2.2); O.fly.rotation.y += dt * (S.fly === 'wide' ? 9 : 34); if (O.pulleys[1]) O.pulleys[1].rotation.x += dt; }
  // the stand-still: the lamp and everything wait on it
  if (V.stillDue && G.time > V.stillDue && !S.ev.still && !V.still && !onLoft() && !G.uiOpen && !G.cutscene && !V.strike && !V.watch && !bellOn()) { V.stillDue = 0; stillScene(); }
  // looking down the shaft for the first time: say what's down there
  if (!S.flags.pinSeen && !onLoft() && !G.cutscene && G.pitch < -0.5 && Math.hypot(P.x - (SH.x0 + SH.x1) / 2, P.z - (SH.z0 + SH.z1) / 2) < 1.35) lookShaft();
  // snow outside and dust inside
  if (O.snow) O.snow.forEach(s => { s.position.y -= s.userData.v * dt; s.position.x += Math.sin(t * 0.6 + s.userData.ph) * 0.12 * dt; if (s.position.y < -8) s.position.y += 15; });
  if (O.dust) O.dust.forEach(d => { if (d.userData.life > 0) { d.userData.life -= dt; d.position.y -= d.userData.v * dt; d.material.opacity = clamp(d.userData.life, 0, 0.6); } else d.material.opacity = 0; });
  const pk = progCount() + ':' + Object.keys(S.flags).length; if (pk !== V.progKey) { V.progKey = pk; V.stuckT = 0; } else V.stuckT += dt;
  director(dt);
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: ['phone'], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null, props: {},
    gm: 0, keyTaken: false, coverOpen: false, wound: 0, wheel: 10, crateOpen: false, crankTaken: false, lidAt: null, pinTaken: false, pinIn: false, fly: 'narrow', hands: 660, onLoft: false, workLamp: true, cupOpen: false, ev: {} };
}
function applyState() {
  V.strike = null; V.proc = 0; V.still = null; V.watch = null; V.scare = false; V.escaping = false; V.finalOut = false; V.headOff = false; V.black = 0; V.flick = 0; V.prevM = null; V.wheelTurn = null; V.hold = null; V.handsT = false;
  V.bellUntil = 0; V.stillDue = S.pinTaken && !S.ev.still ? G.time + 25 : 0;
  G.frozen = false; BODY.on = true; if (DRAG.cur) dragEnd(true);
  hideHim();
  O.cupDoor.rotation.y = S.cupOpen ? 1.75 : 0; O.cupIn.visible = !!S.cupOpen;
  O.crowbar.visible = !took('crowbar') && !S.crateOpen;
  // the crate: where it was left, its lid on or off, the crank in it or not
  const cp = (S.props && S.props.crate) || { x: CRATE.x, z: CRATE.z }; O.crate.position.set(cp.x, 0, cp.z); DRAG.defs.crate.sync();
  if (S.crateOpen) lidOff(false); else { if (O.crateLid.parent !== O.crate) O.crate.add(O.crateLid); O.crateLid.position.set(0, CRATE.h, -CRATE.d / 2); O.crateLid.rotation.set(0, 0, 0); }
  O.crateCrank.visible = !S.crankTaken;
  O.windCover.rotation.y = S.coverOpen ? -1.7 : 0; O.windCrank.visible = false;
  O.pinIn.visible = S.pinIn; O.pinW.visible = !S.pinTaken; O.wheel.rotation.y = wheelRot(S.wheel); if (O.peterKey) O.peterKey.visible = !S.keyTaken;
  setVanes(); handsTo(S.hands / 60);
  O.weights[1].position.y = lerp(WEIGHT_Y[0], WEIGHT_Y[1], clamp(S.wound / WIND_N, 0, 1)); O.weights.forEach(placeCable);
  O.shutters.forEach(s => s.rotation.y = 0);
  if (O.han13) O.han13.visible = false; O.face.visible = false; O.hand.visible = false; O.myHand.visible = false;
  loftBody(onLoft());
  if (S.onLoft) { if (P.z > -0.8) { P.x = LADDER.x + 0.3; P.z = -1.0; } bodyPlace(P.x, LOFT.y, P.z, G.yaw); } else bodyPlace(P.x, 0, P.z, G.yaw);
  // a strike that was running when you left is over; the stand-still doesn't come back
  if (S.ev.still) { S.workLamp = false; }
  if (S.wound >= WIND_N && !S.ev.watch) after(25, watchmanScene);
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDue = true;
}

/* ---------------- the last photograph ---------------- */
function endFrame(keep) {
  let url = null;
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov };
    // the next morning, from the square: the dial, the scaffold, the apostles' left window (as the square sees it) open, and a face in it
    const SK = /*DEBUG*/ window.__efs || /*END*/ {};
    /*DEBUG*/ if (SK.skip) return null; /*END*/
    if (!SK.dawn) { if (!T.squareDawn) T.squareDawn = tex(canv(2048, 820, (g, w, h) => paintSquare(g, w, h, true)));
    O.back.material.map = T.squareDawn; O.back.material.needsUpdate = true; } O.sky.material.color.set(0x6a88b8);
    O.shutters.forEach(s => s.rotation.y = s.userData.s * -1.9);
    O.wheel.rotation.y = wheelRot(7) - 0.26;
    const h = O.han; h.visible = !SK.han; h.scale.setScalar(1); h.position.set(APW.xs[1] - 0.05, APW.y0 + 0.5 - 1.66 - 0.11, RM.z0 + 0.3); h.rotation.y = Math.PI + 0.1; h.userData.neck.rotation.set(-0.12, 0.08, 0.2);
    O.face.visible = false; O.hand.visible = false; O.myHand.visible = false; V.headOff = true; L.head.intensity = 0; if (V.bellEl) V.bellEl.classList.remove('on');
    L.work.intensity = 0; L.workFill.intensity = 0; L.street.intensity = 4; L.moon.color.set(0xd8e0f0); L.moon.intensity = 2.2; L.moon.position.set(14, 18, -28); L.hemi.color.set(0xa8b8d8); L.hemi.groundColor.set(0x4a4644); L.hemi.intensity = 0.75;
    L.apw.intensity = 2.2; L.apw.position.set(-0.45, 3.1, RM.z0 + 0.18); L.drum.intensity = 2.0; L.drum.position.set(APW.xs[1] + 0.05, APW.y0 + 0.62, RM.z0 + 0.02); L.drum.distance = 1.4;
    O.lamps.forEach(l => l.visible = false); O.snow.forEach(s => s.visible = false);
    scene.fog.density = 0.004; scene.fog.color.set(0x8090a8); G.black = 0; G.blackT = 0; V.black = 0;
    const pu = post.uniforms; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0;
    cam.fov = 24; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(0.6, 1.9, -10.6); cam.lookAt(-0.5, 3.0, FZ); cam.updateMatrixWorld(); pu.exposure.value = 1.2;
    if (!SK.env) { const hide = [O.face, O.hand, O.myHand]; hide.forEach(o => o.visible = false); scene.environment = null; const rt = envFromScene(new THREE.Vector3(0, 0, -8)); scene.environment = rt.texture; if (V.envRT && !SK.dispose) V.envRT.dispose(); V.envRT = rt; }
    if (!SK.render) { renderer.shadowMap.needsUpdate = true; render(0.016); }
    
    const cw = canvas.width, ch = canvas.height, Wd = 360, Ht = 480, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; g.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // a record photograph: slightly cool, a little soft, the restorers' date stamp
    const d = g.getImageData(0, 0, Wd, Ht);
    for (let i = 0; i < d.data.length; i += 4) { const n = (Math.random() - 0.5) * 12; d.data[i] = clamp(d.data[i] * 0.98 + n + 4, 0, 255); d.data[i + 1] = clamp(d.data[i + 1] + n + 2, 0, 255); d.data[i + 2] = clamp(d.data[i + 2] * 1.04 + n, 0, 255); }
    g.putImageData(d, 0, 0);
    g.fillStyle = 'rgba(255,170,60,0.9)'; g.font = '15px "IBM Plex Mono", monospace'; g.fillText('2018/01/09  07:58', Wd - 168, Ht - 14);
    url = c.toDataURL('image/jpeg', 0.88); if (keep) return url; pu.exposure.value = 1.0;
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.updateProjectionMatrix(); updateProj();
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- title and card: the dial, turning, in the dark ---------------- */
let TFX = null;
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const Wd = 480, Ht = 270;
  if (!TFX) { TFX = { face: canv(512, 512, (gg, w) => paintDialFace(gg, w)), zod: canv(512, 512, (gg, w) => paintZodRing(gg, w)), flakes: Array.from({ length: 70 }, () => [Math.random(), Math.random(), rand(0.4, 1.4)]) }; }
  g.fillStyle = '#05070c'; g.fillRect(0, 0, Wd, Ht);
  const cx = Wd * 0.66, cy = Ht * 0.5, R = Ht * 0.62;
  g.save(); g.globalAlpha = 0.85; g.drawImage(TFX.face, cx - R, cy - R, R * 2, R * 2);
  const hrs = 11 + (t * 0.08) % 24, ro = R * 0.65; g.translate(cx, cy); g.rotate(zodRingRot(hrs)); g.drawImage(TFX.zod, -ro, -ro, ro * 2, ro * 2); g.restore();
  g.save(); g.translate(cx, cy); const as = angHour(hrs); g.rotate(as); g.fillStyle = '#e2b450'; g.fillRect(-3, -R * 0.8, 6, R * 0.8); g.restore();
  const vg = g.createLinearGradient(0, 0, Wd, 0); vg.addColorStop(0, 'rgba(5,7,12,1)'); vg.addColorStop(0.42, 'rgba(5,7,12,0.85)'); vg.addColorStop(1, 'rgba(5,7,12,0.1)'); g.fillStyle = vg; g.fillRect(0, 0, Wd, Ht);
  const rg = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.25); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = rg; g.fillRect(0, 0, Wd, Ht);
  g.fillStyle = 'rgba(230,236,245,0.7)'; for (const f of TFX.flakes) { const x = ((f[0] * Wd + Math.sin(t * 0.5 + f[1] * 9) * 12) % Wd + Wd) % Wd, y = ((f[1] * Ht + t * 14 * f[2]) % Ht); g.fillRect(x, y, f[2] * 1.4, f[2] * 1.4); }
  // every so often the dial goes dark for a beat, as if something had stood in front of it
  if (Math.sin(t * 0.43) > 0.985) { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, Wd, Ht); }
}

/* ---------------- build ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x040405, 0.035);
  camera.far = 140; camera.near = 0.02; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.1, ao: 0.85, aoRad: 0.25, bloom: 0.5, bloomThr: 1.3, vig: 0.58, grain: 0.03, sat: 0.92 });
  bodyOn({});
  makeTextures(); paintThings(); makeMaterials();
  buildShell(); buildClock(); buildOutside(); buildHim(); buildLights(); buildSolids();
  // the key on St Peter's keys
  { const peter = O.aps[1]; O.peterKey = grp(0.075, 0.24, 0.135, peter); bev(0.008, 0.05, 0.004, M.iron, 0, -0.02, 0, O.peterKey, 0.001); const r = new THREE.Mesh(new THREE.TorusGeometry(0.01, 0.0025, 6, 10), M.iron); r.position.y = 0.01; O.peterKey.add(r); noRay(O.peterKey);
    // a glint on it, so it reads in the dark doorway
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xfff0d0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 })); gl.scale.setScalar(0.05); gl.position.set(0, -0.01, 0.01); layer1(gl); O.peterKey.add(gl); }
  // dust motes that fall from the loft
  O.dust = []; for (let i = 0; i < 24; i++) { const d = new THREE.Sprite(M.dustS.clone()); d.scale.setScalar(0.02); d.userData.life = 0; layer1(d); scene.add(d); O.dust.push(d); }
  scene.traverse(o => { if (o.isMesh) { o.receiveShadow = true; if (o.material && o.material.transparent) o.castShadow = false; } });
  O.shell.traverse(o => { if (o.isMesh && o !== O.frontWall) o.castShadow = false; });
}

/* ---------------- the room module ---------------- */
return {
  id: 'orloj', title: 'The Blind Hour', saveKey: 'lethe.roomorloj.v2',
  DOCS, ITEMS, HEARD, HINTS, openDoc,
  inspectItem(id, back) {
    if (id !== 'phone') return inspectItem(id, back);
    const dead = S.flags.vmPlayed;
    UI.show('item', `<button class="x">${back ? 'Back' : 'Close'} &middot; Esc</button><h2>${esc(ITEMS.phone.name)}</h2><p style="font-size:14px;line-height:1.65;margin:0 0 16px">${dead ? 'Dead. The battery gave out after the voicemail. Tomáš\'s message is in your notebook.' : ITEMS.phone.desc}</p>${dead ? '' : '<button class="btn primary" id="vmPlay">Play the voicemail</button>'}`, { closeOnE: true, onClose: back === 'notebook' ? () => { if (G.mode === 'play') openNotebook(); } : null });
    const b = $('#vmPlay'); if (b) b.onclick = () => { UI.close(true); playVoicemail(); resumeLook(); };
  },
  titleFx,
  penalty,
  markSkip: ['start', 'rule', 'still', 'out'], markMerge: {},
  backText: 'Back in the works.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Jump', 'Space'], ['Let go of the crate', 'E or Q'], ['Notebook', 'Tab'], ['Hints', 'H']],
  constrain(p, r) { constrainTo(p, r); },
  stepDown() { if (G.cutscene || onLoft() || V.still) { if (V.still && V.still.t > 5 && !V.still.failed) { V.still.failed = true; O.han.visible = false; lungeScare('still'); after(3.2, endStill); } return; } bodyJump(); },
  dropHeld() { if (DRAG.cur) dragEnd(); },
  onDrag(d, on) { renderer.shadowMap.needsUpdate = true; if (!on) { S.props = S.props || {}; S.props.crate = { x: d.obj.position.x, z: d.obj.position.z }; save(); } },
  onDragFell(d) { S.props = S.props || {}; S.props.crate = { x: d.obj.position.x, z: d.obj.position.z }; save(); },
  onLand(v) { if (v > 1.5) sStep(0.3); },
  savePlayer(p) { if (S.onLoft) p.y = LOFT.y; },
  resumed() {
    if (S.safe) { const s = S.safe; S.safe = null; P.x = s.x; P.z = s.z; bodyPlace(s.x, s.y, s.z, G.yaw); }
    loftBody(onLoft());
    if (onLoft() && BODY.y < LOFT.y - 0.1) { if (P.z > -0.8) { P.x = LADDER.x + 0.3; P.z = -1.0; } bodyPlace(P.x, LOFT.y, P.z, G.yaw); }
    if (!onLoft() && BODY.y > 1.5) bodyPlace(P.x, 0, P.z, G.yaw);
  },
  actOverride(i) {
    if (V.still && V.still.t > 5 && !V.still.failed) { V.still.failed = true; O.han.visible = false; lungeScare('still'); after(3.2, endStill); return true; }
    if (DRAG.cur) { dragEnd(); return true; }
    return false;
  },
  promptOverride() { if (DRAG.cur) return `<span class="nm">Dragging the crate</span><span class="act"><kbd>E</kbd>Let go</span>`; return ''; },
  touchOverride() { if (DRAG.cur) return [{ label: 'Let go', run: () => dragEnd(), main: true }]; return null; },
  touchExtras() {
    const x = [];
    if (took('phone') && !S.flags.vmPlayed && !G.cutscene) x.push({ label: 'Play the voicemail', run: playVoicemail });
    if (!onLoft() && !G.cutscene && !DRAG.cur) x.push({ label: 'Jump', run: () => bodyJump() });
    if (onLoft() && !G.cutscene && !V.escaping && !V.finalOut) x.push({ label: 'Climb down', run: () => climbDown() });
    return x;
  },
  update: roomUpdate,
  preRender() {
    if (V.envDue && (!G.cutscene || V.still)) { V.envDue = false; const hide = [O.face, O.hand, O.myHand, O.han]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); scene.environment = null; const rt = envFromScene(new THREE.Vector3(0, 1.7, 1.0)); scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); }
  },
  build() {
    buildRoom(); registerInteractions();
    [O.cupDoor, O.cupIn, O.wheel, O.crank, O.fly, O.count, O.countClick, O.wind, O.clutch, O.bell, O.dial, O.knob, O.pins, O.hammer, O.deathLever, O.door, O.doorRing, ...O.great, ...O.going, ...O.strike, ...O.weights, ...O.pulleys, ...O.shutters, O.bigSun, O.bigMoon, O.bigZod, O.lampLens, O.drum].forEach(o => { if (o) o.userData.keep = true; });
    O.clock.userData.noRayMerged = true; O.loft.userData.noRayMerged = true;
    mergeGroup(O.shell); mergeGroup(O.clock); mergeGroup(O.loft); mergeGroup(O.out); mergeGroup(O.shaftG);
  },
  defaults, applyState, startAmbience,
  spawn: { x: 1.4, z: 1.5, yaw: 0 },
  wake() {
    loftBody(false); bodyPlace(1.45, 0, 1.55, 0.35); G.pitch = -0.12;
    G.cutscene = true; $('#fx').className = 'lids';
    after(0.6, () => sayI('11:45 p.m. You fell asleep on the restorers\' bench, inside Prague\'s astronomical clock. For the first time in seventy years, nothing in here is ticking.', 6200));
    after(3.0, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); toast(ctrlHint(), 7000); });
    after(6.6, () => { if (!S.flags.vmPlayed) playVoicemail(); });
  },
  debug: { O, L, V, T, M, COL, BODY, DRAG, S: () => S, peal, startStrike, release, loud, heardNoise, lungeScare, climbUp, climbDown, turnWheel, takeKey, lookDoor, prise, takeCrank, unlockCover, windOnce, reachPin, fitPin, setFly, turnHands, stillScene, watchmanScene, escape, finale, endFrame, handsTo, setVanes, progCount, bellOn, clockMin, standAndCount, hideHim, standSpot, apAtDoor, highNear, lidOff },
};
function playVoicemail() {
  if (V.vm) return; V.vm = true; const tok = V.vmTok = (V.vmTok || 0) + 1;
  say('Voicemail', VM_PARTS[0][1], { clip: 'o_vm', fx: 'phone', volume: 0.9 }).then(() => {
    V.vm = false; heard('vm'); flag('vmPlayed'); after(0.6, () => sayI('The screen goes black. Dead.', 2600));
  });
  VM_PARTS.slice(1).forEach(([t, txt]) => after(t, () => { if (V.vm && V.vmTok === tok) subtitle('Voicemail', txt, 0); }));
}
})();
