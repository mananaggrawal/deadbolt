const ROOM_LIFT = (() => {
/* =====================================================================
   MYSTERY #6 — "DOORS CLOSING"  ·  Cheongun Building, Euljiro, Seoul, 17 December 2004
   part A: layout, noise, textures, materials (realistic: brushed steel, fluorescent light)
   The lift car stands still at the origin. Whatever is outside its doors (a landing, the lobby,
   the shaft) is swapped in while the doors are shut. The doors face -z; the car's back wall is +z.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {}, D = {};
const KR = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', PEN = '"Nanum Pen Script", "Noto Sans KR", cursive', MYEONG = '"Nanum Myeongjo", "Noto Serif KR", serif';
const CAR = { x0: -0.8, x1: 0.8, z0: -0.7, z1: 0.7, h: 2.3 };      // inside faces of the car
const DOOR = { x0: -0.45, x1: 0.45, h: 2.1 };                      // the door opening
const LW = -0.88;                                                  // landing-side face of the lift wall (its shaft side is at -0.80)
const LAND = { x0: -2.4, x1: 2.4, z0: -3.9, z1: LW, h: 2.7 };        // a landing lobby, floors 2 to 10
const LOB = { x0: -3.4, x1: 3.4, z0: -8.2, z1: LW, h: 3.2 };         // the ground-floor lobby
const SHAFT = { x0: -1.08, x1: 1.08, z0: -0.80, z1: 1.02 };         // the hoistway, seen from the car roof
const TOP = 2.36;                                                  // the car roof, where you stand in the shaft
const FH = 3.3;                                                    // storey height
const POS = {
  panel: new THREE.Vector3(0.62, 1.2, CAR.z0 + 0.02), doors: new THREE.Vector3(0, 1.2, CAR.z0 - 0.05), hatch: new THREE.Vector3(0.18, CAR.h, 0.18),
  ceil: new THREE.Vector3(0, CAR.h - 0.05, 0), under: new THREE.Vector3(0, -0.4, 0), roof: new THREE.Vector3(0, TOP + 0.3, 0), back: new THREE.Vector3(0, 1.5, CAR.z1),
  corner: new THREE.Vector3(-0.56, 1.45, 0.48), mirror: new THREE.Vector3(0, 1.45, CAR.z1 - 0.01), speaker: new THREE.Vector3(0.3, CAR.h - 0.02, -0.3),
  landing: new THREE.Vector3(0, 1.5, -2.4), corridor: new THREE.Vector3(-3.4, 1.4, -1.7), office: new THREE.Vector3(3.5, 1.3, -2.1),
  shaftUp: new THREE.Vector3(0, TOP + 14, 0.1), shaftDown: new THREE.Vector3(0, -14, 0.1), box: new THREE.Vector3(0.62, TOP + 0.95, -0.55),
  glassDoors: new THREE.Vector3(0, 1.3, LOB.z0), guard: new THREE.Vector3(-2.4, 1.0, -4.2),
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
// a canvas texture we redraw later (signs, the display, the panel)
function live(w, h, draw, { srgb = true } = {}) { const c = canv(w, h, draw); const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.userData.canvas = c; t.userData.redraw = fn => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); fn(g, w, h); t.needsUpdate = true; }; return t; }

/* ---------------- textures ---------------- */
function makeTextures() {
  // brushed stainless: long vertical grain in the roughness, a few smudges and fingerprints in the colour
  T.brushR = tex(pix(256, 256, (x, y) => { const s = tnoise(x / 0.7, y / 40, 366, 6) * 0.6 + tnoise(x / 2.1, y / 90, 122, 3) * 0.4; const sm = Math.max(0, tfbm(x, y, 256, 256, 4, 3) - 0.55) * 1.6; const v = 70 + s * 70 + sm * 60; return [v, v, v]; }), { srgb: false });
  T.brushN = heightToNormal(pix(256, 256, (x, y) => { const v = 128 + (tnoise(x / 0.8, y / 50, 320, 5) - 0.5) * 60; return [v, v, v]; }), 0.6);
  T.steelC = tex(pix(256, 256, (x, y) => { const sm = Math.max(0, tfbm(x + 40, y, 256, 256, 3, 4) - 0.5) * 0.5, fp = tnoise(x / 3, y / 3, 85, 85) > 0.8 ? 0.06 : 0; const v = 232 - sm * 70 - fp * 120; return [v, v, v * 1.01]; }));
  // the car floor: dark speckled granite tiles, polished
  T.carFloor = tex(pix(256, 256, (x, y) => { const g = (x % 128 < 1.5 || y % 128 < 1.5) ? 0.5 : 1; const sp = tnoise(x / 1.3, y / 1.3, 197, 197), sp2 = tnoise(x / 3, y / 3, 85, 85); let v = 30 + sp * 28 + (sp2 > 0.75 ? 50 : 0) + (sp > 0.86 ? 70 : 0); return [v * g, v * g * 0.98, v * g * 0.95]; }));
  T.carFloorR = tex(pix(128, 128, (x, y) => { const v = 60 + tfbm(x, y, 128, 128, 4, 3) * 90; return [v, v, v]; }), { srgb: false });
  // terrazzo for the landings: cream matrix with grey and black chips, a darker border by the lift
  T.terrazzo = tex(pix(512, 512, (x, y) => {
    const b = tfbm(x, y, 512, 512, 6, 3), ch = tnoise(x / 2.4, y / 2.4, 213, 213), ch2 = tnoise(x / 5, y / 5, 102, 102);
    let c = mixc([168, 160, 142], [192, 184, 164], b);
    if (ch > 0.78) c = mixc(c, [70, 68, 64], 0.8); else if (ch2 > 0.8) c = mixc(c, [120, 112, 100], 0.7); else if (ch < 0.12) c = mixc(c, [214, 210, 198], 0.7);
    const wear = Math.max(0, tfbm(x + 99, y, 512, 512, 3, 3) - 0.5) * 0.4; return c.map(q => q * (1 - wear * 0.5));
  }));
  T.terrazzoR = tex(pix(128, 128, (x, y) => { const v = 90 + tfbm(x, y, 128, 128, 5, 3) * 100; return [v, v, v]; }), { srgb: false });
  // polished granite in the lobby, big tiles (1 tile of texture = 2 m)
  T.granite = tex(pix(512, 512, (x, y) => { const j = (x % 256 < 1.5 || y % 256 < 1.5); const sp = tnoise(x / 1.6, y / 1.6, 320, 320), b = tfbm(x, y, 512, 512, 5, 3); let c = mixc([54, 50, 48], [96, 88, 82], b * 0.6 + sp * 0.4); if (sp > 0.85) c = mixc(c, [170, 150, 140], 0.6); if (j) c = c.map(q => q * 0.55); return c; }));
  // painted plaster walls: off-white, scuffed along the bottom, handprints near the lift
  T.paint = tex(pix(512, 512, (x, y) => { const n = tfbm(x, y, 512, 512, 5, 4), st = Math.max(0, tfbm(x * 0.3, y * 2, 512, 512, 4, 3) - 0.5) * (y / 512) * 1.2; const c = mixc([214, 208, 192], [196, 190, 172], n); return mixc(c, [120, 112, 96], clamp(st, 0, 0.5)); }));
  T.paintN = heightToNormal(pix(256, 256, (x, y) => { const v = 128 + (tfbm(x, y, 256, 256, 16, 3) - 0.5) * 60; return [v, v, v]; }), 1.0);
  // acoustic ceiling tiles on a 60 cm grid (texture = 1.2 m)
  T.ceilTile = tex(pix(256, 256, (x, y) => { const j = x % 128 < 2 || y % 128 < 2; if (j) return [150, 150, 146]; const p = tnoise(x / 1.1, y / 1.1, 232, 232) > 0.8 ? 0.8 : 1, st = Math.max(0, tfbm(x, y, 256, 256, 3, 3) - 0.62) * 1.5; const v = (206 - st * 60) * p; return [v, v * 0.99, v * 0.95]; }));
  // concrete in the shaft: board-marked, damp streaks, the floor numbers painted by the fitters
  T.concrete = tex(pix(512, 512, (x, y) => { const n = tfbm(x, y, 512, 512, 6, 5), bd = (y % 64) < 2 ? 0.7 : 1, st = Math.max(0, tfbm(x * 3, y * 0.2, 512, 512, 6, 3) - 0.5) * 1.4; let c = mixc([70, 68, 64], [118, 114, 106], n); c = c.map(q => q * bd); return mixc(c, [40, 38, 34], clamp(st, 0, 0.6)); }));
  T.concreteN = heightToNormal(pix(256, 256, (x, y) => { const v = 60 + tfbm(x, y, 256, 256, 8, 5) * 170 - ((y % 32) < 1 ? 60 : 0); return [v, v, v]; }), 3);
  // office carpet tiles (blue-grey, 50 cm)
  T.carpet = tex(pix(256, 256, (x, y) => { const j = x % 128 < 1 || y % 128 < 1, n = tnoise(x / 1.2, y / 1.2, 213, 213) * 0.5 + tfbm(x, y, 256, 256, 4, 2) * 0.5; const c = mixc([58, 64, 76], [86, 92, 104], n); return j ? c.map(q => q * 0.8) : c; }));
  // desk laminate
  T.lam = tex(pix(256, 256, (x, y) => { const g = Math.pow(Math.sin((y / 256 * 30 + tfbm(x, y, 256, 256, 3, 3) * 3) * Math.PI) * 0.5 + 0.5, 3); return mixc([178, 150, 116], [150, 120, 88], g * 0.6 + tfbm(x * 4, y, 256, 256, 6, 2) * 0.4); }));
  T.glow = tex(canv(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  // hair: long dark strands with a little sheen, as an alpha card
  T.hair = tex(canv(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const x = rand(0, w), l = rand(h * 0.55, h), wv = rand(2, 10), ph = rand(0, TAU); g.strokeStyle = `rgba(${irand(4, 22)},${irand(4, 18)},${irand(4, 16)},${rand(0.35, 0.95)})`; g.lineWidth = rand(0.6, 2.2); g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= l; y += 16) g.lineTo(x + Math.sin(y / 80 + ph) * wv * (y / h), y); g.stroke(); }
    for (let i = 0; i < 120; i++) { const x = rand(0, w); g.strokeStyle = `rgba(120,110,100,${rand(0.05, 0.18)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, rand(0, 60)); g.lineTo(x + rand(-4, 4), rand(120, 320)); g.stroke(); }
  }));
  // a heavy curtain of hair: solid near the top, breaking into strands at the ends
  T.hairMass = tex(canv(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(8,7,7,1)'); gr.addColorStop(0.72, 'rgba(8,7,7,1)'); gr.addColorStop(0.8, 'rgba(8,7,7,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const x = rand(0, w), l = rand(h * 0.7, h * 0.99); g.strokeStyle = `rgba(${irand(6, 20)},${irand(5, 16)},${irand(5, 14)},1)`; g.lineWidth = rand(1, 3.4); g.beginPath(); g.moveTo(x, h * 0.3); g.lineTo(x + rand(-6, 6), l); g.stroke(); }
    for (let i = 0; i < 160; i++) { const x = rand(0, w); g.strokeStyle = `rgba(70,64,60,${rand(0.2, 0.5)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, rand(0, 80)); g.lineTo(x + rand(-3, 3), rand(160, 380)); g.stroke(); }
  }));
  // strands for the hair to catch the light along
  T.hairBump = tex(canv(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { const x = rand(0, w), c = irand(40, 220); g.strokeStyle = `rgb(${c},${c},${c})`; g.lineWidth = rand(0.6, 2.2); g.beginPath(); g.moveTo(x, -4); g.bezierCurveTo(x + rand(-5, 5), h * 0.3, x + rand(-5, 5), h * 0.7, x + rand(-3, 3), h + 4); g.stroke(); } }), { srgb: false });
  T.snow = tex(canv(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 60; i++) { const x = rand(0, w), y = rand(0, h), r = rand(0.6, 2.2); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }));
  T.snow.wrapS = T.snow.wrapT = THREE.RepeatWrapping;
  // white funeral cloth and the paper of the screens
  T.cloth = tex(pix(256, 256, (x, y) => { const n = tnoise(x / 1.2, y / 1.2, 213, 213) * 0.3 + tfbm(x, y, 256, 256, 6, 3) * 0.7; const v = 214 + n * 30; return [v, v, v * 0.98]; }));
  T.hanji = tex(pix(256, 256, (x, y) => { const f = tnoise(x / 0.9, y / 6, 284, 42) * 0.5 + tfbm(x, y, 256, 256, 8, 3) * 0.5; const v = 210 + f * 36; return [v, v * 0.97, v * 0.9]; }));
}

/* ---------------- materials ---------------- */
function std(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.5 }, o)); }
function phys(o) { return new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.5 }, o)); }
function makeMaterials() {
  M.steel = phys({ color: 0xb4b8bc, map: T.steelC, metalness: 0.8, roughness: 0.5, roughnessMap: T.brushR, normalMap: T.brushN, normalScale: new THREE.Vector2(0.2, 0.2), anisotropy: 0.35, anisotropyRotation: Math.PI / 2, envMapIntensity: 1.0 });
  M.steelDark = std({ color: 0x5a5c5e, metalness: 1, roughness: 0.42, roughnessMap: T.brushR, envMapIntensity: 0.9 });
  M.steelLand = phys({ color: 0x9a9c9e, map: T.steelC, metalness: 0.9, roughness: 0.38, roughnessMap: T.brushR, anisotropy: 0.6, anisotropyRotation: Math.PI / 2, envMapIntensity: 0.8 });
  M.chrome = std({ color: 0xe8e8e8, metalness: 1, roughness: 0.14, envMapIntensity: 1.2 });
  M.carFloor = phys({ map: T.carFloor, roughnessMap: T.carFloorR, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  M.diffuser = std({ color: 0xf4f6f8, roughness: 0.5, emissive: new THREE.Color(0xeaf2ff), emissiveIntensity: 0.9 });
  M.black = std({ color: 0x0b0b0c, roughness: 0.6 });
  M.rubber = std({ color: 0x151515, roughness: 0.92 });
  M.plasticW = std({ color: 0xe4e0d6, roughness: 0.45 });
  M.plasticG = std({ color: 0x9a9890, roughness: 0.55 });
  M.amber = std({ color: 0x3a2a10, roughness: 0.3, emissive: new THREE.Color(0xffa030), emissiveIntensity: 0 });
  M.terrazzo = phys({ map: T.terrazzo, roughnessMap: T.terrazzoR, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  M.granite = phys({ map: T.granite, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.08 });
  M.paint = std({ map: T.paint, normalMap: T.paintN, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.9 });
  M.paintDark = std({ map: T.paint, color: 0x6a6a64, roughness: 0.9 });
  M.ceilTile = std({ map: T.ceilTile, roughness: 0.95 });
  M.concrete = std({ map: T.concrete, normalMap: T.concreteN, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.92, side: THREE.DoubleSide });
  M.carpet = std({ map: T.carpet, roughness: 1 });
  M.lam = std({ map: T.lam, roughness: 0.5 });
  M.fabric = std({ color: 0x2a2e36, roughness: 0.95 });
  M.glass = std({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.1, envMapIntensity: 0.6, depthWrite: false });
  M.glassDark = std({ color: 0x1a2024, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55, envMapIntensity: 0.8, depthWrite: false });
  M.tube = std({ color: 0xffffff, roughness: 0.3, emissive: new THREE.Color(0xe8f0ff), emissiveIntensity: 2.4 });
  M.redLed = std({ color: 0x200000, roughness: 0.3, emissive: new THREE.Color(0xff2010), emissiveIntensity: 3 });
  M.greenSign = std({ color: 0x0a2a14, roughness: 0.4, emissive: new THREE.Color(0x20ff70), emissiveIntensity: 1.6 });
  M.redSign = std({ color: 0x2a0a0a, roughness: 0.4, emissive: new THREE.Color(0xff2a20), emissiveIntensity: 1.6 });
  M.cloth = std({ map: T.cloth, roughness: 0.95, side: THREE.DoubleSide });
  M.hanji = std({ map: T.hanji, roughness: 0.95, side: THREE.DoubleSide, emissive: new THREE.Color(0xffc890), emissiveMap: T.hanji, emissiveIntensity: 0 });
  M.hair = std({ color: 0x0c0a09, map: T.hair, alphaMap: T.hair, alphaTest: 0.3, roughness: 0.42, side: THREE.DoubleSide, envMapIntensity: 0.6 });
  M.hairMass = phys({ map: T.hairMass, alphaTest: 0.45, roughness: 0.42, bumpMap: T.hairBump, bumpScale: 3, side: THREE.DoubleSide, envMapIntensity: 0.3, color: 0xd0d0d0, sheen: 0.5, sheenColor: new THREE.Color(0x30363c), sheenRoughness: 0.45 });
  M.skin = std({ color: 0xd8d0c8, roughness: 0.62 });
  M.skinDead = std({ color: 0xc4c6c8, roughness: 0.55 });
  M.brass = std({ color: 0xc9a060, metalness: 1, roughness: 0.3, envMapIntensity: 0.9 });
  M.wood = std({ color: 0x3a2416, roughness: 0.6 });
  M.snowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0.8 });
  M.glowS = new THREE.SpriteMaterial({ map: T.glow, color: 0xffc27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 });
  M.redS = new THREE.SpriteMaterial({ map: T.glow, color: 0xff2a14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
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
// a flat wall with rectangular holes, UVs in metres; shape in (u, v), extruded d
function holedGeo(u0, u1, v0, v1, holes, d) {
  const s = new THREE.Shape(); s.moveTo(u0, v0); s.lineTo(u1, v0); s.lineTo(u1, v1); s.lineTo(u0, v1); s.closePath();
  for (const [a, b, c, e] of holes) { const hp = new THREE.Path(); hp.moveTo(a, c); hp.lineTo(a, e); hp.lineTo(b, e); hp.lineTo(b, c); hp.closePath(); s.holes.push(hp); }
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 });
}
// a plane of wall, facing +z by default, UVs in metres (divided by s)
function wallPlane(w, h, mat, s = 1, parent = scene) { const g = new THREE.PlaneGeometry(w, h); uvScale(g, w / s, h / s); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; parent.add(m); return m; }
// merge the static meshes inside a group into one mesh per material, kept inside that group (so the group can still be shown and hidden)
function mergeGroup(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), kill = [];
  const kept = o => { for (let p = o; p && p !== root; p = p.parent) if (p.userData.keep) return true; return false; };
  root.traverse(o => {
    if (!o.isMesh || o.userData.iid || o.layers.mask !== 1 || !o.visible || kept(o) || o.material.isShaderMaterial || Array.isArray(o.material) || o.userData.hit) return;
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

/* =====================================================================
   DOORS CLOSING · part B: the car (walls, doors, panel, display, ceiling, hatch, mirror),
   the shaft and the car roof
   ===================================================================== */
// the ten floor buttons: [row, col] from the top, and the floor the printed label says
const PANEL_ROWS = [[9, 10], [7, 8], [5, 6], [3, 4], [1, 2]];     // 4 is printed F
const LABEL = n => n === 4 ? 'F' : String(n);
// the other side: the same printed labels, but the Braille beside each button says where it really goes.
// The button printed 3 is missing: that is the real 5, prised out.
const OW_TRUE = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10 };   // (the buttons used to lie over there; now they don't)
const GONE = 5;                                                     // the button Ji-yeon took out, on the other side
const OW_BY_TRUE = Object.fromEntries(Object.entries(OW_TRUE).map(([p, t]) => [t, +p]));
const BTN = {};    // printed label -> { cap, ring, x, y }

function buildCar() {
  O.car = grp(0, 0, 0);
  const { x0, x1, z0, z1, h } = CAR;
  // floor and sills
  const fl = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 2, (z1 - z0) / 2), M.carFloor); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; O.car.add(fl);
  bev(DOOR.x1 - DOOR.x0 + 0.06, 0.012, 0.09, M.chrome, 0, 0.004, z0 - 0.045, O.car, 0.002);
  for (let i = 0; i < 6; i++) bev(DOOR.x1 - DOOR.x0 + 0.04, 0.003, 0.003, M.black, 0, 0.011, z0 - 0.012 - i * 0.009, O.car, 0.001);
  // side walls: three brushed panels a side, with dark joints and a darker kick plate
  for (const sx of [-1, 1]) {
    const x = sx * (x1 + 0.012);
    box(0.012, h, z1 - z0, M.black, sx * (x1 + 0.02), h / 2, 0, O.car).castShadow = false;
    [[z0, -0.235], [-0.225, 0.225], [0.235, z1]].forEach(([a, b]) => { bev(0.02, h - 0.14, b - a - 0.006, M.steel, x - sx * 0.002, (h + 0.14) / 2, (a + b) / 2, O.car, 0.003); bev(0.022, 0.13, b - a - 0.006, M.steelDark, x - sx * 0.003, 0.068, (a + b) / 2, O.car, 0.003); });
  }
  // back wall: three panels
  box(x1 - x0, h, 0.012, M.black, 0, h / 2, z1 + 0.02, O.car).castShadow = false;
  [[x0, -0.275], [-0.265, 0.265], [0.275, x1]].forEach(([a, b]) => { bev(b - a - 0.006, h - 0.14, 0.02, M.steel, (a + b) / 2, (h + 0.14) / 2, z1 + 0.002, O.car, 0.003); bev(b - a - 0.006, 0.13, 0.022, M.steelDark, (a + b) / 2, 0.068, z1 + 0.003, O.car, 0.003); });
  // front wall: the returns either side of the door and the transom over it
  bev(DOOR.x0 - x0 + 0.02, h, 0.03, M.steel, (x0 + DOOR.x0) / 2 - 0.01, h / 2, z0 - 0.014, O.car, 0.003);
  bev(x1 - DOOR.x1 + 0.02, h, 0.03, M.steel, (x1 + DOOR.x1) / 2 + 0.01, h / 2, z0 - 0.014, O.car, 0.003);
  bev(DOOR.x1 - DOOR.x0 + 0.04, h - DOOR.h, 0.03, M.steel, 0, (h + DOOR.h) / 2, z0 - 0.014, O.car, 0.003);
  // chrome jambs
  for (const sx of [-1, 1]) bev(0.02, DOOR.h, 0.05, M.chrome, sx * (DOOR.x1 + 0.01), DOOR.h / 2, z0 - 0.02, O.car, 0.004);
  bev(DOOR.x1 - DOOR.x0 + 0.06, 0.02, 0.05, M.chrome, 0, DOOR.h + 0.01, z0 - 0.02, O.car, 0.004);
  // handrails: sides and back
  const rail = M.chrome;
  for (const sx of [-1, 1]) { tube([[sx * (x1 - 0.045), 0.92, -0.5], [sx * (x1 - 0.045), 0.92, 0.5]], 0.016, rail, O.car, 6, 12); for (const z of [-0.45, 0.45]) tube([[sx * (x1 - 0.045), 0.92, z], [sx * (x1 - 0.002), 0.92, z]], 0.01, rail, O.car, 2, 8); }
  tube([[-0.6, 0.92, z1 - 0.045], [0.6, 0.92, z1 - 0.045]], 0.016, rail, O.car, 6, 12); for (const x of [-0.55, 0.55]) tube([[x, 0.92, z1 - 0.045], [x, 0.92, z1 - 0.002]], 0.01, rail, O.car, 2, 8);
  // ceiling: a steel tray, two light boxes, the hatch between them, a speaker, a fan, the emergency lamp, the camera
  const cy = h;
  const cw = x1 - x0, cd = z1 - z0;
  const ceilG = holedGeo(x0, x1, z0, z1, [[-0.68, -0.3, -0.58, 0.58], [0.3, 0.68, -0.58, 0.58], [-0.25, 0.25, -0.2, 0.35]], 0.02);
  O.ceil = new THREE.Mesh(ceilG, M.steelDark); O.ceil.rotation.x = Math.PI / 2; O.ceil.position.y = cy + 0.02; O.car.add(O.ceil);
  O.diff = [];
  for (const sx of [-1, 1]) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 1.16), M.diffuser); d.rotation.x = Math.PI / 2; d.position.set(sx * 0.49, cy + 0.005, 0); O.car.add(d); O.diff.push(d);
    box(0.4, 0.06, 1.18, M.black, sx * 0.49, cy + 0.05, 0, O.car).castShadow = false;
    // the tubes behind the acrylic, seen as bright bars
    for (const dx of [-0.08, 0.08]) { const t = cyl(0.013, 0.013, 1.08, M.tube, sx * 0.49 + dx, cy + 0.03, 0, O.car, 10); t.rotation.x = Math.PI / 2; t.castShadow = false; O.diff.push(t); }
  }
  // speaker and fan grilles at the front
  const grille = std({ color: 0x1a1a1a, roughness: 0.6, map: canvTexGrille() });
  const sp = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), grille); sp.rotation.x = Math.PI / 2; sp.position.set(0.12, cy - 0.001, -0.42); O.car.add(sp);
  const fn = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), grille); fn.rotation.x = Math.PI / 2; fn.position.set(-0.12, cy - 0.001, -0.42); O.car.add(fn);
  // emergency lamp, front left corner
  O.emerg = grp(-0.64, cy - 0.03, -0.62, O.car); bev(0.16, 0.05, 0.08, M.plasticW, 0, 0, 0, O.emerg, 0.008); O.emergLens = bev(0.13, 0.012, 0.06, M.amber, 0, -0.026, 0, O.emerg, 0.003);
  // the camera dome, back right
  O.cam = grp(0.66, cy, 0.56, O.car); lathe([[0.001, 0], [0.06, 0], [0.058, -0.01], [0.001, -0.012]], M.plasticW, 0, 0, 0, O.cam, 20);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 12, 0, TAU, Math.PI / 2, Math.PI / 2), std({ color: 0x0a0a0c, roughness: 0.08, metalness: 0.3, envMapIntensity: 1.2 })); dome.position.y = -0.01; O.cam.add(dome);
  O.camLed = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), M.redLed); O.camLed.position.set(0.03, -0.012, -0.03); O.cam.add(O.camLed);
  // the hatch cover (hinged along its front edge, opens upward into the shaft)
  O.hatchPivot = grp(0, cy + 0.02, -0.2, O.car);
  O.hatch = grp(0, 0, 0, O.hatchPivot);
  bev(0.5, 0.016, 0.55, M.steelDark, 0, 0.008, 0.275, O.hatch, 0.003);
  for (const x of [-0.18, 0.18]) cyl(0.008, 0.008, 0.05, M.chrome, x, 0.004, 0.0, O.hatch, 8).rotation.z = Math.PI / 2;
  // the latch on top, seen through the gap at the back edge of the hatch
  O.latch = bev(0.12, 0.02, 0.03, M.steelDark, 0.1, 0.03, 0.56, O.hatch, 0.004);
  O.hatchGap = box(0.5, 0.004, 0.02, M.black, 0, cy + 0.018, 0.36, O.car); O.hatchGap.castShadow = false;
  // mirror on the back wall
  O.mirror = makeMirror(1.0, 1.02, { res: 640, tint: 0xd2d6da }); O.mirror.position.set(0, 1.5, z1 - 0.01); O.mirror.rotation.y = Math.PI; O.car.add(O.mirror);
  O.mirrorFrame = mesh(frameGeo(1.03, 1.05, 1.0, 1.02, 0.012, 0.004), M.chrome, 0, 1.5, z1 - 0.004, O.car); O.mirrorFrame.rotation.y = Math.PI;
  // inspection certificate, left wall; capacity plate and notice, on the panel; a camera sticker, back wall
  O.cert = grp(x0 + 0.004, 1.52, 0.1, O.car); O.cert.rotation.y = Math.PI / 2;
  mesh(frameGeo(0.25, 0.34, 0.22, 0.31, 0.012, 0.004), M.chrome, 0, 0, 0, O.cert); O.certPaper = plane(0.22, 0.31, std({ map: T.certTex, roughness: 0.6 }), 0, 0, 0.004, 0, O.cert); plane(0.22, 0.31, M.glass, 0, 0, 0.012, 0, O.cert).userData.noRay = true;
  O.sticker = plane(0.14, 0.06, std({ map: T.cctvTex, roughness: 0.4 }), 0.3, 2.05, z1 - 0.012, Math.PI, O.car);
  buildPanel3D(); buildDisplay(); buildCarDoors();
}
function canvTexGrille() { return ctex(128, 128, (g, w, h) => { g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#050505'; for (let y = 6; y < h; y += 10) for (let x = 6 + (y / 10 % 2) * 5; x < w; x += 10) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); } }); }

/* ---------------- the car operating panel ---------------- */
const PNL = { cx: 0.6255, cy: 1.18, w: 0.24, h: 0.86 };
function btnPos(r, c) { return { x: PNL.cx - 0.045 + c * 0.09 - 0.01, y: PNL.cy + 0.29 - r * 0.1 }; }
function buildPanel3D() {
  const z = CAR.z0 + 0.003;
  O.panel = grp(PNL.cx, PNL.cy, z, O.car);
  bev(PNL.w, PNL.h, 0.008, M.steel, 0, 0, 0.004, O.panel, 0.002);
  O.panelFace = plane(PNL.w - 0.012, PNL.h - 0.012, std({ map: T.panelTex, roughness: 0.4, metalness: 0.6, envMapIntensity: 0.8, transparent: true }), 0, 0, 0.0085, 0, O.panel);
  O.panelFace.userData.noRay = true;
  // buttons: steel caps with a lit ring and an engraved label
  const capG = new THREE.CylinderGeometry(0.019, 0.02, 0.012, 28); capG.rotateX(Math.PI / 2);
  const ringG = new THREE.TorusGeometry(0.0215, 0.0035, 8, 32);
  PANEL_ROWS.forEach((row, r) => row.forEach((n, c) => {
    const p = btnPos(r, c), x = p.x - PNL.cx, y = p.y - PNL.cy;
    const b = grp(x, y, 0.012, O.panel);
    const ringM = std({ color: 0x302018, roughness: 0.4, emissive: new THREE.Color(0xffa640), emissiveIntensity: 0 });
    const ring = new THREE.Mesh(ringG, ringM); b.add(ring);
    const cap = new THREE.Mesh(capG, M.steel); cap.position.z = 0.004; b.add(cap);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.017, 24), std({ map: T.btnLabels[n], transparent: true, roughness: 0.4, metalness: 0.5 })); face.position.z = 0.0105; b.add(face);
    BTN[n] = { g: b, cap, ring, ringM, face, x: p.x, y: p.y };
  }));
  // the hole where the 5 button was (on the other side): dark, two bare contacts
  O.hole = grp(BTN[GONE].g.position.x, BTN[GONE].g.position.y, 0.009, O.panel);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24), M.black); hole.position.z = 0.0005; O.hole.add(hole);
  for (const dx of [-0.006, 0.006]) { const c = cyl(0.0022, 0.0022, 0.008, M.brass, dx, 0, 0.002, O.hole, 8); c.rotation.x = Math.PI / 2; }
  O.hole.visible = false;
  // door open, door close, alarm bell, intercom
  const small = (x, y, label, col) => { const b = grp(x, y, 0.012, O.panel); const ringM = std({ color: 0x302018, roughness: 0.4, emissive: new THREE.Color(col || 0xffa640), emissiveIntensity: 0 }); b.add(new THREE.Mesh(ringG, ringM)); const cap = new THREE.Mesh(capG, label === 'bell' ? std({ color: 0xd8b020, roughness: 0.35 }) : M.steel); cap.position.z = 0.004; b.add(cap); const f = new THREE.Mesh(new THREE.CircleGeometry(0.017, 24), std({ map: T.btnLabels[label], transparent: true, roughness: 0.4, metalness: 0.5 })); f.position.z = 0.0105; b.add(f); return { g: b, ringM }; };
  BTN.open = small(-0.045 - 0.01, -0.24, 'open'); BTN.close = small(0.045 - 0.01, -0.24, 'close');
  BTN.bell = small(-0.045 - 0.01, -0.34, 'bell', 0xffe040); BTN.phone = small(0.045 - 0.01, -0.34, 'phone', 0x40ff80);
  // a keyhole for the service cabinet, below the panel
  O.cab = grp(PNL.cx, 0.55, z, O.car); bev(0.22, 0.26, 0.006, M.steel, 0, 0, 0.003, O.cab, 0.002); cyl(0.008, 0.008, 0.006, M.brass, 0.07, 0.08, 0.008, O.cab, 12).rotation.x = Math.PI / 2;
  // Braille: raised dots beside each button, one set for each side of the doors
  O.brReal = grp(0, 0, 0, O.panel); O.brOther = grp(0, 0, 0, O.panel);
  const dotG = new THREE.SphereGeometry(0.0016, 6, 4);
  const dotM = std({ color: 0x9a9c9e, metalness: 1, roughness: 0.3, envMapIntensity: 1 });
  const addBraille = (root, label, trueFloor) => {
    const b = BTN[label], cells = brailleCells(trueFloor), bx = b.g.position.x - 0.036 - (cells.length - 2) * 0.006, by = b.g.position.y;
    cells.forEach((cell, ci) => cell.forEach(d => { const dc = d <= 3 ? 0 : 1, dr = (d - 1) % 3; const m = new THREE.Mesh(dotG, dotM); m.position.set(bx + ci * 0.0085 + dc * 0.0034, by + 0.005 - dr * 0.0045, 0.0105); root.add(m); }));
  };
  for (let n = 1; n <= 10; n++) { addBraille(O.brReal, n, n); addBraille(O.brOther, n, OW_TRUE[n]); }
  O.brOther.visible = false;
  hitbox('panel', O.panel, 0.02);
}
// Braille digits: the number sign, then a to j for 1 to 0
const BR_DIG = { 1: [1], 2: [1, 2], 3: [1, 4], 4: [1, 4, 5], 5: [1, 5], 6: [1, 2, 4], 7: [1, 2, 4, 5], 8: [1, 2, 5], 9: [2, 4], 0: [2, 4, 5] };
function brailleCells(n) { const s = String(n); return [[3, 4, 5, 6], ...s.split('').map(ch => BR_DIG[+ch])]; }

/* ---------------- the floor display over the doors ---------------- */
function buildDisplay() {
  O.disp = grp(0, DOOR.h + 0.1, CAR.z0 + 0.004, O.car);
  bev(0.3, 0.12, 0.01, M.black, 0, 0, 0.004, O.disp, 0.003);
  O.dispFace = plane(0.26, 0.085, new THREE.MeshBasicMaterial({ map: T.dispTex, toneMapped: false, color: 0xffffff }), 0, 0, 0.0095, 0, O.disp);
  O.dispFace.userData.noRay = true; layer1(O.dispFace); O.dispFace.userData.noEnv = true;
  hitbox('disp', O.disp, 0.02);
}

/* ---------------- the car doors ---------------- */
function buildCarDoors() {
  O.cdoor = [];
  for (const sx of [-1, 1]) {
    const d = grp(sx * 0.2275, DOOR.h / 2, CAR.z0 - 0.05, O.car);
    bev(0.455, DOOR.h - 0.005, 0.03, M.steel, 0, 0, 0, d, 0.004);
    bev(0.455, 0.1, 0.032, M.steelDark, 0, -DOOR.h / 2 + 0.05, 0, d, 0.003);
    // the rubber safety edge
    box(0.012, DOOR.h - 0.02, 0.028, M.rubber, -sx * 0.222, 0, 0, d);
    d.userData.base = sx * 0.2275; d.userData.sx = sx; O.cdoor.push(d);
  }
}

/* ---------------- the shaft (seen from the car roof, and up through the open hatch) ---------------- */
function buildShaft() {
  O.shaft = grp(0, 0, 0); O.shaft.visible = false;
  O.shaftMove = grp(0, 0, 0, O.shaft);       // everything fixed to the building: moves when the car does
  const S0 = SHAFT, Y0 = -40, Y1 = 60, H = Y1 - Y0;
  const wall = (w, mat, x, z, ry) => { const g = new THREE.PlaneGeometry(w, H, 1, 60); uvScale(g, w / 4, H / 4); const m = new THREE.Mesh(g, mat); m.position.set(x, (Y0 + Y1) / 2, z); m.rotation.y = ry; O.shaftMove.add(m); return m; };
  wall(S0.z1 - S0.z0, M.concrete, S0.x0, (S0.z0 + S0.z1) / 2, Math.PI / 2);
  wall(S0.z1 - S0.z0, M.concrete, S0.x1, (S0.z0 + S0.z1) / 2, -Math.PI / 2);
  wall(S0.x1 - S0.x0, M.concrete, 0, S0.z1, Math.PI);
  // the front: the lift wall between floors, with the backs of the landing doors, sills and floor numbers
  O.shaftFloors = [];
  for (let f = -8; f <= 16; f++) {
    const y = f * FH, g = grp(0, y, 0, O.shaftMove); O.shaftFloors.push(g);
    const wg = holedGeo(S0.x0, S0.x1, 0, FH, [[DOOR.x0 - 0.02, DOOR.x1 + 0.02, 0, DOOR.h + 0.02]], 0.08); uvScale(wg, 1 / 4, 1 / 4);
    const w = new THREE.Mesh(wg, M.concrete); w.position.set(0, 0, S0.z0 - 0.08); g.add(w);
    for (const sx of [-1, 1]) { bev(0.46, DOOR.h, 0.02, M.steelDark, sx * 0.2275, DOOR.h / 2, S0.z0 + 0.012, g, 0.004); }
    bev(DOOR.x1 - DOOR.x0 + 0.1, 0.03, 0.08, M.chrome, 0, -0.015, S0.z0 + 0.03, g, 0.004);
    // the interlock box and the door hanger over each landing door
    bev(1.3, 0.12, 0.1, M.steelDark, 0, DOOR.h + 0.12, S0.z0 + 0.06, g, 0.006);
    // the fitters' painted floor mark, big, on the left of the landing door where you can see it from the roof
    { const mt = T.fitterMarks[((f % 10) + 10) % 10]; plane(0.46, 0.34, std({ map: mt, emissiveMap: mt, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.35, transparent: true, roughness: 0.9 }), -0.66, DOOR.h + 0.62, S0.z0 + 0.003, 0, g); }
  }
  // guide rails on the sides, and the counterweight on the back
  for (const sx of [-1, 1]) { box(0.06, H, 0.12, M.steelDark, sx * (S0.x1 - 0.05), (Y0 + Y1) / 2, 0.1, O.shaftMove).castShadow = false; }
  O.cwt = grp(0.55, 6, S0.z1 - 0.16, O.shaft); bev(0.7, 2.4, 0.14, std({ color: 0x3a3a3a, metalness: 0.4, roughness: 0.7 }), 0, 0, 0, O.cwt, 0.01);
  for (let i = -2; i <= 2; i++) box(0.72, 0.02, 0.15, M.black, 0, i * 0.45, 0, O.cwt);
  // the hoist ropes from the car's crosshead up into the dark, and down from the counterweight
  O.ropes = grp(0, 0, 0, O.shaft);
  const rope = std({ color: 0x2a2826, metalness: 0.6, roughness: 0.5 });
  for (let i = 0; i < 4; i++) { const r = cyl(0.006, 0.006, 60, rope, -0.06 + i * 0.04, TOP + 0.5 + 30, 0.1, O.ropes, 6); r.castShadow = false; }
  for (let i = 0; i < 4; i++) { const r = cyl(0.006, 0.006, 60, rope, 0.49 + i * 0.03, 7.2 + 30, S0.z1 - 0.16, O.cwt.parent, 6); r.castShadow = false; O.cwt.userData.ropes = (O.cwt.userData.ropes || []).concat(r); }
  // the travelling cable, hanging in a loop from the car's side
  tube([[-0.78, 0.4, 0.3], [-0.9, -3, 0.3], [-0.95, -8, 0.35], [-0.98, -14, 0.4]], 0.02, M.black, O.shaft, 20, 6);
  // something small in the gap between two landing doors, three floors below: fingers
  O.fingers = grp(-0.02, 0, S0.z0 + 0.02, O.shaftMove); O.fingers.visible = false;
  for (let i = 0; i < 4; i++) { const f = cyl(0.007, 0.0075, 0.07 - Math.abs(i - 1.5) * 0.01, M.skinDead, 0, 0, 0, O.fingers, 8); f.position.set(0.012 + (i % 2) * 0.004, DOOR.h * 0.55 + i * 0.022, 0.02); f.rotation.z = Math.PI / 2 - 0.2; }
  // the thing that falls past
  O.faller = grp(0.9, 30, 0.25, O.shaft); O.faller.visible = false;
}

/* ---------------- the car roof ---------------- */
function buildCarTop() {
  O.top = grp(0, 0, 0, O.shaft);
  const plate = std({ color: 0x6a6a68, metalness: 0.8, roughness: 0.5, map: T.checker });
  const rg = holedGeo(CAR.x0 - 0.04, CAR.x1 + 0.04, CAR.z0 - 0.06, CAR.z1 + 0.04, [[-0.25, 0.25, -0.2, 0.35]], 0.03); uvScale(rg, 2, 2);
  const roof = new THREE.Mesh(rg, plate); roof.rotation.x = Math.PI / 2; roof.position.y = TOP; roof.receiveShadow = true; O.top.add(roof);
  // the crosshead: a steel channel over the car, the rope hitches on it
  bev(1.9, 0.18, 0.12, std({ color: 0x2a3a4a, metalness: 0.5, roughness: 0.6 }), 0, TOP + 0.62, 0.1, O.top, 0.01);
  for (const sx of [-1, 1]) bev(0.1, 0.62, 0.1, std({ color: 0x2a3a4a, metalness: 0.5, roughness: 0.6 }), sx * 0.95, TOP + 0.31, 0.1, O.top, 0.01);
  for (let i = 0; i < 4; i++) cyl(0.012, 0.012, 0.3, M.chrome, -0.06 + i * 0.04, TOP + 0.85, 0.1, O.top, 8);
  // the door operator: motor and belt over the doors
  bev(0.9, 0.2, 0.22, std({ color: 0x3a4a3a, metalness: 0.4, roughness: 0.6 }), 0, TOP + 0.1, -0.56, O.top, 0.01);
  cyl(0.07, 0.07, 0.16, M.steelDark, -0.3, TOP + 0.22, -0.56, O.top, 16).rotation.z = Math.PI / 2;
  // a caged work lamp on the crosshead
  O.workLamp = grp(-0.55, TOP + 0.5, 0.2, O.top); lathe([[0.001, 0], [0.04, 0], [0.05, 0.08], [0.001, 0.09]], std({ color: 0xfff4d8, emissive: new THREE.Color(0xffd890), emissiveIntensity: 0 }), 0, 0, 0, O.workLamp, 12);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cyl(0.003, 0.003, 0.11, M.steelDark, Math.cos(a) * 0.055, 0.04, Math.sin(a) * 0.055, O.workLamp, 4); }
  // the inspection box, on a stalk by the front right corner
  O.box = grp(POS.box.x, POS.box.y, POS.box.z, O.top); O.box.rotation.y = 2.38;
  bev(0.24, 0.3, 0.12, std({ color: 0xc8a020, roughness: 0.5 }), 0, 0, 0, O.box, 0.01);
  cyl(0.02, 0.02, POS.box.y - TOP - 0.15, M.steelDark, 0, -(POS.box.y - TOP) / 2 - 0.08, 0, O.box, 8);
  plane(0.2, 0.26, std({ map: T.boxTex, roughness: 0.5 }), 0, 0, -0.061, Math.PI, O.box);
  O.boxToggle = grp(0.0, 0.06, -0.07, O.box); bev(0.018, 0.05, 0.018, M.chrome, 0, 0.02, 0, O.boxToggle, 0.004); O.boxToggle.rotation.x = 0.5;
  O.boxStop = cyl(0.022, 0.022, 0.03, std({ color: 0xc01810, roughness: 0.4 }), 0.0, -0.08, -0.07, O.box, 16); O.boxStop.rotation.x = Math.PI / 2;
  hitbox('box', O.box, 0.04);
}

/* =====================================================================
   DOORS CLOSING · part C: outside the doors. One landing shell reused for floors 2 to 10
   (dressed and lit per floor, on either side), the ground-floor lobby and the street,
   the office behind the glass, the funeral on the floor that isn't there, the people, the lights
   ===================================================================== */
const TENANTS = {
  2: ['청운빌딩 관리사무소', 'Cheongun Bldg Management'], 3: ['성진무역', 'Seongjin Trading Co.'], 4: null, 5: null,
  6: ['서울치과기공소', 'Seoul Dental Lab'], 7: ['동아화재', 'Dong-a Fire Insurance'], 8: ['한빛여행사', 'Hanbit Travel'],
  9: ['미래디자인', 'Mirae Design'], 10: ['대양회계법인', 'Daeyang Accounting'],
};
const CORR = { z0: -2.75, z1: -1.65, x: -6.6 };             // the corridor to the stairs, off the left of the landing
const OFFD = { z0: -3.1, z1: -1.5, h: 2.3 };                // the office's glass doors, in the right wall
const OFF = { x0: LAND.x1, x1: 8.0, z0: -5.8, z1: 0.4, h: 2.7 };

/* ---------------- a landing ---------------- */
function buildLanding() {
  O.land = grp(0, 0, 0); O.land.visible = false;
  const g = O.land, { x0, x1, z0, h } = LAND, z1 = LW;
  const floor = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 2, (z1 - z0) / 2), M.terrazzo); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (z0 + z1) / 2); floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 1.2, (z1 - z0) / 1.2), M.ceilTile); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, h, (z0 + z1) / 2); g.add(ceil);
  // the lift wall with its doorway, architrave, landing doors, call button and hall lantern
  const lw = new THREE.Mesh(uvScale(holedGeo(x0, x1, 0, h, [[DOOR.x0 - 0.02, DOOR.x1 + 0.02, 0, DOOR.h + 0.02]], 0.08), 0.5, 0.5), M.paint); lw.position.z = z1; lw.receiveShadow = true; g.add(lw);
  O.landArch = grp(0, 0, z1 - 0.012, g);
  for (const sx of [-1, 1]) bev(0.09, DOOR.h + 0.1, 0.03, M.steelLand, sx * (DOOR.x1 + 0.065), (DOOR.h + 0.1) / 2, 0, O.landArch, 0.004);
  bev(DOOR.x1 - DOOR.x0 + 0.22, 0.1, 0.03, M.steelLand, 0, DOOR.h + 0.07, 0, O.landArch, 0.004);
  O.ldoor = [];
  for (const sx of [-1, 1]) { const d = grp(sx * 0.2275, DOOR.h / 2, z1 + 0.035, g); bev(0.455, DOOR.h, 0.025, M.steelLand, 0, 0, 0, d, 0.004); d.userData.base = sx * 0.2275; d.userData.sx = sx; O.ldoor.push(d); }
  const sill = bev(DOOR.x1 - DOOR.x0 + 0.1, 0.012, 0.09, M.chrome, 0, 0.004, z1 + 0.04, g, 0.002);
  O.callBtn = grp(DOOR.x1 + 0.34, 1.1, z1 - 0.01, g); bev(0.08, 0.16, 0.012, M.steelLand, 0, 0, 0, O.callBtn, 0.003);
  O.callRing = [0.035, -0.035].map(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 24), std({ color: 0x302018, emissive: new THREE.Color(0xffa640), emissiveIntensity: 0 })); r.position.set(0, y, -0.008); O.callBtn.add(r); const c = cyl(0.015, 0.015, 0.008, M.steelLand, 0, y, -0.01, O.callBtn, 20); c.rotation.x = Math.PI / 2; return r; });
  O.lantern = grp(0, DOOR.h + 0.32, z1 - 0.01, g); bev(0.24, 0.08, 0.02, M.black, 0, 0, 0, O.lantern, 0.004);
  O.lantLed = plane(0.2, 0.06, new THREE.MeshBasicMaterial({ map: T.lantTex, toneMapped: false }), 0, 0, -0.011, Math.PI, O.lantern); O.lantLed.userData.noRay = true;
  // the opposite wall: the painted floor number, a fire hose cabinet, an extinguisher
  const ow = wallPlane(x1 - x0, h, M.paint, 2, g); ow.position.set(0, h / 2, z0);
  O.sign = plane(1.3, 0.95, std({ map: T.signTex, transparent: true, roughness: 0.85 }), -0.2, 1.5, z0 + 0.004, 0, g);
  O.hose = grp(1.55, 1.05, z0 + 0.1, g); bev(0.7, 1.0, 0.2, std({ color: 0xa81814, roughness: 0.45, metalness: 0.2 }), 0, 0, 0, O.hose, 0.01);
  plane(0.6, 0.3, std({ map: T.hoseTex, roughness: 0.5 }), 0, 0.28, 0.102, 0, O.hose); plane(0.6, 0.55, M.glass, 0, -0.14, 0.104, 0, O.hose).userData.noRay = true;
  const ext = grp(2.05, 0, z0 + 0.14, g); cyl(0.07, 0.07, 0.48, std({ color: 0xc01810, roughness: 0.35 }), 0, 0.24, 0, ext, 16); cyl(0.02, 0.03, 0.08, M.black, 0, 0.52, 0, ext, 10);
  // left wall with the corridor opening, and the corridor to the stairs
  const lz = (a, b) => { const w = wallPlane(b - a, h, M.paint, 2, g); w.position.set(x0, h / 2, (a + b) / 2); w.rotation.y = Math.PI / 2; return w; };
  lz(z0, CORR.z0); lz(CORR.z1, z1);
  const lt = wallPlane(CORR.z1 - CORR.z0, h - 2.25, M.paint, 2, g); lt.position.set(x0, 2.25 + (h - 2.25) / 2, (CORR.z0 + CORR.z1) / 2); lt.rotation.y = Math.PI / 2;
  O.corr = grp(0, 0, 0, g);
  const cl = x0 - CORR.x, cz = (CORR.z0 + CORR.z1) / 2, cw = CORR.z1 - CORR.z0;
  const cf = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(cl, cw), cl / 2, cw / 2), M.terrazzo); cf.rotation.x = -Math.PI / 2; cf.position.set((x0 + CORR.x) / 2, 0, cz); O.corr.add(cf);
  const cc = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(cl, cw), cl / 1.2, cw / 1.2), M.ceilTile); cc.rotation.x = Math.PI / 2; cc.position.set((x0 + CORR.x) / 2, 2.25, cz); O.corr.add(cc);
  for (const [z, ry] of [[CORR.z0, 0], [CORR.z1, Math.PI]]) { const w = wallPlane(cl, 2.25, M.paint, 2, O.corr); w.position.set((x0 + CORR.x) / 2, 1.125, z); w.rotation.y = ry; }
  const ce = wallPlane(cw, 2.25, M.paint, 2, O.corr); ce.position.set(CORR.x, 1.125, cz); ce.rotation.y = Math.PI / 2;
  O.stairDoor = bev(0.04, 2.0, 0.9, std({ color: 0x5a5e62, metalness: 0.5, roughness: 0.5 }), CORR.x + 0.03, 1.0, cz, O.corr, 0.01);
  O.exitSign = grp(CORR.x + 0.06, 2.12, cz, O.corr); bev(0.03, 0.14, 0.34, M.black, 0, 0, 0, O.exitSign, 0.004);
  O.exitFace = plane(0.32, 0.12, std({ map: T.exitTex, emissiveMap: T.exitTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 1.4, roughness: 0.4 }), 0.017, 0, 0, Math.PI / 2, O.exitSign);
  O.corrTube = bev(0.12, 0.05, 1.2, M.tube, (x0 + CORR.x) / 2, 2.22, cz, O.corr, 0.01); O.corrTube.rotation.y = Math.PI / 2;
  // right wall with the office's glass doors, and the office behind them
  const rz = (a, b) => { const w = wallPlane(b - a, h, M.paint, 2, g); w.position.set(x1, h / 2, (a + b) / 2); w.rotation.y = -Math.PI / 2; return w; };
  rz(z0, OFFD.z0); rz(OFFD.z1, z1);
  const rt = wallPlane(OFFD.z1 - OFFD.z0, h - OFFD.h, M.paint, 2, g); rt.position.set(x1, OFFD.h + (h - OFFD.h) / 2, (OFFD.z0 + OFFD.z1) / 2); rt.rotation.y = -Math.PI / 2;
  O.gdoor = grp(x1, 0, (OFFD.z0 + OFFD.z1) / 2, g);
  const alu = std({ color: 0x3a3228, metalness: 0.8, roughness: 0.35 });
  const dw = OFFD.z1 - OFFD.z0;
  bev(0.06, OFFD.h, 0.05, alu, 0, OFFD.h / 2, -dw / 2 + 0.025, O.gdoor, 0.004); bev(0.06, OFFD.h, 0.05, alu, 0, OFFD.h / 2, dw / 2 - 0.025, O.gdoor, 0.004); bev(0.06, 0.05, dw, alu, 0, OFFD.h - 0.025, 0, O.gdoor, 0.004); bev(0.06, 0.05, 0.05, alu, 0, OFFD.h / 2, 0, O.gdoor, 0.004).scale.y = OFFD.h / 0.05;
  for (const s of [-1, 1]) { const gl = plane(dw / 2 - 0.06, OFFD.h - 0.08, M.glassDark, 0, (OFFD.h - 0.08) / 2, s * dw / 4, Math.PI / 2, O.gdoor); gl.userData.noRay = true; gl.renderOrder = 2; cyl(0.012, 0.012, 0.9, M.chrome, -0.05, 1.05, s * 0.08, O.gdoor, 8); }
  O.decal = plane(dw - 0.2, 0.34, std({ map: T.decalTex, transparent: true, roughness: 0.4, depthWrite: false }), -0.012, 1.55, 0, -Math.PI / 2, O.gdoor); O.decal.renderOrder = 3;
  hitbox('gdoor', O.gdoor, 0.02);
  buildOffice();
  // the fitting overhead
  O.landTube = grp(0, h - 0.01, -2.2, g); bev(0.34, 0.03, 1.24, M.black, 0, 0, 0, O.landTube, 0.004); O.landDiff = bev(0.3, 0.012, 1.2, M.diffuser.clone(), 0, -0.016, 0, O.landTube, 0.003);
  // dressings are added by buildDressings()
  O.landDress = grp(0, 0, 0, g);
}
function buildOffice() {
  O.office = grp(0, 0, 0, O.land);
  const g = O.office, { x0, x1, z0, z1, h } = OFF;
  const f = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 1, (z1 - z0) / 1), M.carpet); f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); g.add(f);
  const c = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 1.2, (z1 - z0) / 1.2), M.ceilTile); c.rotation.x = Math.PI / 2; c.position.set((x0 + x1) / 2, h, (z0 + z1) / 2); g.add(c);
  const w1 = wallPlane(x1 - x0, h, M.paint, 2, g); w1.position.set((x0 + x1) / 2, h / 2, z0);
  const w2 = wallPlane(x1 - x0, h, M.paint, 2, g); w2.position.set((x0 + x1) / 2, h / 2, z1); w2.rotation.y = Math.PI;
  for (const [a, b] of [[z0, OFFD.z0], [OFFD.z1, z1]]) { const w3 = wallPlane(b - a, h, M.paint, 2, g); w3.position.set(x0 + 0.01, h / 2, (a + b) / 2); w3.rotation.y = Math.PI / 2; }
  const w3t = wallPlane(OFFD.z1 - OFFD.z0, h - OFFD.h, M.paint, 2, g); w3t.position.set(x0 + 0.01, OFFD.h + (h - OFFD.h) / 2, (OFFD.z0 + OFFD.z1) / 2); w3t.rotation.y = Math.PI / 2;
  // far wall: a band of windows onto the city at night
  const wb = wallPlane(z1 - z0, 0.9, M.paint, 2, g); wb.position.set(x1, 0.45, (z0 + z1) / 2); wb.rotation.y = -Math.PI / 2;
  const wt = wallPlane(z1 - z0, 0.5, M.paint, 2, g); wt.position.set(x1, h - 0.25, (z0 + z1) / 2); wt.rotation.y = -Math.PI / 2;
  O.city = plane(z1 - z0 + 4, 3.2, new THREE.MeshBasicMaterial({ map: T.cityTex, toneMapped: true, color: 0x9098a8 }), x1 + 2.5, 1.6, (z0 + z1) / 2, -Math.PI / 2, g); O.city.userData.noRay = true;
  for (let z = z0 + 0.8; z < z1; z += 1.2) bev(0.08, 1.3, 0.06, std({ color: 0x3a3228, metalness: 0.7, roughness: 0.4 }), x1 - 0.02, 1.55, z, g, 0.004);
  // desks in two rows, chairs, monitors, partitions, cabinets, a water cooler
  O.offChairs = []; O.desks = grp(0, 0, 0, g);
  const deskAt = (x, z, ry) => {
    const d = grp(x, 0, z, O.desks); d.rotation.y = ry;
    bev(1.2, 0.03, 0.7, M.lam, 0, 0.72, 0, d, 0.006); for (const sx of [-1, 1]) bev(0.03, 0.72, 0.62, M.plasticG, sx * 0.57, 0.36, 0, d, 0.004);
    bev(0.4, 0.34, 0.38, std({ color: 0xd8d2c0, roughness: 0.6 }), 0.1, 0.92, -0.1, d, 0.02);   // CRT monitor
    plane(0.3, 0.23, std({ color: 0x080a0c, roughness: 0.15, metalness: 0.2 }), 0.1, 0.93, 0.091, 0, d);
    bev(0.46, 0.03, 0.16, std({ color: 0xd8d2c0, roughness: 0.6 }), 0.1, 0.75, 0.2, d, 0.004);
    bev(1.24, 0.45, 0.04, std({ color: 0x5a6068, roughness: 0.9 }), 0, 0.96, -0.37, d, 0.01);   // low partition
    const ch = grp(0, 0, 0.62, d); chair(ch); O.offChairs.push({ g: ch, base: ch.rotation.y });
    return d;
  };
  for (let i = 0; i < 4; i++) { deskAt(3.6 + i * 1.3, -4.4, Math.PI); deskAt(3.6 + i * 1.3, -3.0, 0); deskAt(3.6 + i * 1.3, -1.2, Math.PI); }
  for (let i = 0; i < 3; i++) bev(0.45, 1.3, 0.6, std({ color: 0x8a8c88, metalness: 0.5, roughness: 0.5 }), x1 - 0.5, 0.65, z0 + 0.4 + i * 0.5, g, 0.01);
  const wc = grp(x0 + 0.5, 0, z1 - 0.4, g); bev(0.32, 0.9, 0.32, M.plasticW, 0, 0.45, 0, wc, 0.02); cyl(0.14, 0.14, 0.4, std({ color: 0x9ac0e0, roughness: 0.1, transparent: true, opacity: 0.6 }), 0, 1.1, 0, wc, 16);
}
function chair(g) {
  const fab = M.fabric;
  bev(0.46, 0.08, 0.44, fab, 0, 0.47, 0, g, 0.03); bev(0.44, 0.5, 0.06, fab, 0, 0.8, 0.2, g, 0.03);
  cyl(0.025, 0.025, 0.36, M.steelDark, 0, 0.25, 0, g, 8);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const l = bev(0.3, 0.025, 0.04, M.black, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, g, 0.008); l.rotation.y = -a; }
}

/* ---------------- the ground-floor lobby and the street ---------------- */
function buildLobby() {
  O.lobby = grp(0, 0, 0); O.lobby.visible = false;
  const g = O.lobby, { x0, x1, z0, h } = LOB, z1 = LW;
  const floor = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x1 - x0) / 2, (z1 - z0) / 2), M.granite); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (z0 + z1) / 2); floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), std({ map: T.paint, roughness: 0.95, color: 0xd8d4c8 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, h, (z0 + z1) / 2); g.add(ceil);
  O.downs = [];
  for (const [x, z] of [[-1.6, -2.4], [1.6, -2.4], [-1.6, -5.2], [1.6, -5.2], [0, -7.0]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), M.diffuser.clone()); d.rotation.x = Math.PI / 2; d.position.set(x, h - 0.005, z); g.add(d); O.downs.push(d); }
  // the lift wall: stone cladding, the doorway, the directory, a poster
  const lw = new THREE.Mesh(uvScale(holedGeo(x0, x1, 0, h, [[DOOR.x0 - 0.02, DOOR.x1 + 0.02, 0, DOOR.h + 0.02]], 0.08), 0.5, 0.5), M.granite); lw.position.z = z1; lw.receiveShadow = true; g.add(lw);
  O.lobArch = grp(0, 0, z1 - 0.012, g);
  for (const sx of [-1, 1]) bev(0.09, DOOR.h + 0.1, 0.03, M.steelLand, sx * (DOOR.x1 + 0.065), (DOOR.h + 0.1) / 2, 0, O.lobArch, 0.004);
  bev(DOOR.x1 - DOOR.x0 + 0.22, 0.1, 0.03, M.steelLand, 0, DOOR.h + 0.07, 0, O.lobArch, 0.004);
  O.lobDoor = [];
  for (const sx of [-1, 1]) { const d = grp(sx * 0.2275, DOOR.h / 2, z1 + 0.035, g); bev(0.455, DOOR.h, 0.025, M.steelLand, 0, 0, 0, d, 0.004); d.userData.base = sx * 0.2275; d.userData.sx = sx; O.lobDoor.push(d); }
  bev(DOOR.x1 - DOOR.x0 + 0.1, 0.012, 0.09, M.chrome, 0, 0.004, z1 + 0.04, g, 0.002);
  O.lobCall = grp(DOOR.x1 + 0.34, 1.1, z1 - 0.01, g); bev(0.08, 0.16, 0.012, M.steelLand, 0, 0, 0, O.lobCall, 0.003); cyl(0.015, 0.015, 0.008, M.steelLand, 0, 0.035, -0.01, O.lobCall, 20).rotation.x = Math.PI / 2;
  O.lobLantern = grp(0, DOOR.h + 0.32, z1 - 0.01, g); bev(0.24, 0.08, 0.02, M.black, 0, 0, 0, O.lobLantern, 0.004); plane(0.2, 0.06, new THREE.MeshBasicMaterial({ map: T.lantTex, toneMapped: false }), 0, 0, -0.011, Math.PI, O.lobLantern).userData.noRay = true;
  O.dir = grp(-1.45, 1.45, z1 - 0.02, g); bev(0.9, 1.2, 0.03, std({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.4 }), 0, 0, 0, O.dir, 0.006); plane(0.84, 1.14, std({ map: T.dirTex, roughness: 0.3 }), 0, 0, -0.016, Math.PI, O.dir); hitbox('dir', O.dir, 0.02);
  O.poster = plane(0.42, 0.6, std({ map: T.posterTex, roughness: 0.85 }), 1.35, 1.45, z1 - 0.012, Math.PI, g); hitbox('poster', O.poster, 0.02);
  // side walls: the guard's desk on the left, mailboxes and the stairs on the right
  const lwall = wallPlane(z1 - z0, h, M.paint, 2, g); lwall.position.set(x0, h / 2, (z0 + z1) / 2); lwall.rotation.y = Math.PI / 2;
  const rwall = wallPlane(z1 - z0, h, M.paint, 2, g); rwall.position.set(x1, h / 2, (z0 + z1) / 2); rwall.rotation.y = -Math.PI / 2;
  O.guardDesk = grp(-2.55, 0, -4.4, g);
  bev(0.7, 1.05, 2.2, std({ color: 0x3a2a1e, roughness: 0.55 }), 0.35, 0.525, 0, O.guardDesk, 0.01); bev(0.8, 0.04, 2.3, M.granite, 0.35, 1.07, 0, O.guardDesk, 0.006);
  bev(0.5, 0.03, 1.8, M.lam, -0.25, 0.74, 0, O.guardDesk, 0.006);
  const tvc = grp(-0.3, 0.76, -0.5, O.guardDesk); bev(0.38, 0.32, 0.36, std({ color: 0x2a2a28, roughness: 0.5 }), 0, 0.16, 0, tvc, 0.02); O.monitor = plane(0.3, 0.23, new THREE.MeshBasicMaterial({ map: T.monTex, toneMapped: false, color: 0x8a9aa0 }), 0.19, 0.17, 0, Math.PI / 2, tvc); O.monitor.userData.noRay = true;
  O.radio = grp(-0.3, 0.76, 0.35, O.guardDesk); bev(0.28, 0.14, 0.1, std({ color: 0x5a4030, roughness: 0.5 }), 0, 0.07, 0, O.radio, 0.01); plane(0.1, 0.08, std({ color: 0x1a1a1a, roughness: 0.8 }), 0.15, 0.07, -0.05, Math.PI / 2, O.radio); hitbox('radio', O.radio, 0.03);
  O.logbook = grp(0.35, 1.09, 0.3, O.guardDesk); bev(0.24, 0.02, 0.32, std({ color: 0x2a3a5a, roughness: 0.7 }), 0, 0.01, 0, O.logbook, 0.003); plane(0.22, 0.3, std({ map: T.logTex, roughness: 0.9 }), 0, 0.022, 0, 0, O.logbook).rotation.x = -Math.PI / 2; hitbox('logbook', O.logbook, 0.03);
  const cap = grp(0.3, 1.09, -0.5, O.guardDesk); lathe([[0.001, 0.06], [0.1, 0.05], [0.1, 0.0], [0.001, 0.0]], std({ color: 0x1a2030, roughness: 0.6 }), 0, 0, 0, cap, 16); bev(0.14, 0.01, 0.08, M.black, 0.09, 0.005, 0, cap, 0.003);
  O.gchair = grp(-0.6, 0, 0.2, O.guardDesk); chair(O.gchair); O.gchair.rotation.y = -Math.PI / 2 + 0.4;
  O.clock = grp(x0 + 0.02, 2.45, -4.4, g); O.clock.rotation.y = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 36), M.plasticW, 0, 0, 0.02, O.clock).rotation.x = Math.PI / 2; mesh(new THREE.CircleGeometry(0.155, 36), std({ map: T.clockTex, roughness: 0.4 }), 0, 0, 0.041, O.clock);
  O.cH = bev(0.012, 0.09, 0.004, M.black, 0, 0, 0.046, O.clock, 0.002); O.cH.geometry.translate(0, 0.04, 0); O.cM = bev(0.008, 0.13, 0.004, M.black, 0, 0, 0.049, O.clock, 0.002); O.cM.geometry.translate(0, 0.06, 0);
  O.mail = grp(x1 - 0.12, 1.1, -3.6, g); bev(0.2, 1.1, 1.6, std({ color: 0x8a8a84, metalness: 0.7, roughness: 0.4 }), 0, 0, 0, O.mail, 0.006);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) bev(0.01, 0.18, 0.24, std({ color: 0xa0a09a, metalness: 0.8, roughness: 0.35 }), -0.105, 0.42 - r * 0.21, -0.65 + c * 0.26, O.mail, 0.003);
  O.lobStair = bev(0.05, 2.1, 0.95, std({ color: 0x5a5e62, metalness: 0.5, roughness: 0.5 }), x1 - 0.03, 1.05, -1.9, g, 0.01);
  const ex = grp(x1 - 0.05, 2.32, -1.9, g); bev(0.03, 0.14, 0.34, M.black, 0, 0, 0, ex, 0.004); O.lobExit = plane(0.32, 0.12, std({ map: T.exitTex, emissiveMap: T.exitTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 1.4, roughness: 0.4 }), -0.017, 0, 0, -Math.PI / 2, ex);
  // a rubber plant in a pot, and the mat
  const pot = grp(2.6, 0, -7.4, g); lathe([[0.001, 0], [0.2, 0], [0.24, 0.45], [0.001, 0.45]], std({ color: 0xa89878, roughness: 0.6 }), 0, 0, 0, pot, 20);
  const leaf = phys({ color: 0x1a3a1c, roughness: 0.35, clearcoat: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < 16; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 4), leaf); l.scale.set(1, 0.18, 0.55); l.position.set(rand(-0.3, 0.3), 0.7 + i * 0.07, rand(-0.3, 0.3)); l.rotation.set(rand(-0.6, 0.6), rand(0, TAU), rand(-0.5, 0.5)); pot.add(l); }
  cyl(0.015, 0.02, 1.4, M.wood, 0, 1.1, 0, pot, 6);
  bev(1.6, 0.012, 0.9, std({ color: 0x3a2a24, roughness: 1 }), 0, 0.006, z0 + 0.8, g, 0.003);
  // the glass front: two doors between fixed panes, a steel frame
  O.front = grp(0, 0, z0, g);
  const alu = std({ color: 0x2a2a2c, metalness: 0.8, roughness: 0.35 });
  for (const x of [-3.4, -2.2, -1.0, 1.0, 2.2, 3.4]) bev(0.08, h, 0.1, alu, x, h / 2, 0, O.front, 0.006);
  bev(6.9, 0.1, 0.1, alu, 0, 2.4, 0, O.front, 0.006); bev(6.9, 0.1, 0.1, alu, 0, 0.05, 0, O.front, 0.006);
  for (const [a, b] of [[-3.4, -2.2], [-2.2, -1.0], [1.0, 2.2], [2.2, 3.4]]) { const gl = plane(b - a - 0.08, 2.3, M.glass, (a + b) / 2, 1.22, 0, 0, O.front); gl.userData.noRay = true; gl.renderOrder = 2; }
  const up = plane(6.8, h - 2.45, M.glass, 0, (h + 2.45) / 2, 0, 0, O.front); up.userData.noRay = true; up.renderOrder = 2;
  O.gdoors = [];
  for (const sx of [-1, 1]) { const d = grp(sx * 1.0, 0, 0, O.front); const gl = plane(0.92, 2.3, M.glass, -sx * 0.5, 1.2, 0, 0, d); gl.userData.noRay = true; gl.renderOrder = 2; bev(0.96, 0.08, 0.06, alu, -sx * 0.5, 0.04, 0, d, 0.004); bev(0.96, 0.08, 0.06, alu, -sx * 0.5, 2.36, 0, d, 0.004); bev(0.06, 2.4, 0.06, alu, -sx * 0.96, 1.2, 0, d, 0.004); cyl(0.015, 0.015, 1.0, M.chrome, -sx * 0.86, 1.05, -0.06, d, 8); O.gdoors.push(d); }
  O.frontHit = box(2.0, 2.4, 0.1, HITMAT, 0, 1.2, 0, O.front); O.frontHit.layers.set(2);
  O.outside = grp(0, 0, 0, g);
  buildStreet();
}
function buildStreet() {
  const g = O.outside, z0 = LOB.z0;
  // pavement, the kerb, the road with its snow, the buildings across the street, a lamp, a scooter under snow
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), std({ color: 0x8a8a86, roughness: 0.9 })); pav.rotation.x = -Math.PI / 2; pav.position.set(0, 0.0, z0 - 2); g.add(pav);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), std({ color: 0x2a2a2c, roughness: 0.7 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -0.12, z0 - 9); g.add(road);
  const snowCover = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), std({ color: 0xe8ecf0, roughness: 0.95, transparent: true, opacity: 0.55, depthWrite: false })); snowCover.rotation.x = -Math.PI / 2; snowCover.position.set(0, -0.1, z0 - 7); g.add(snowCover);
  O.across = plane(44, 16, new THREE.MeshBasicMaterial({ map: T.streetTex, toneMapped: true, color: 0xb0b0b8 }), 0, 7.5, z0 - 15, 0, g); O.across.userData.noRay = true;
  O.sky = plane(80, 30, new THREE.MeshBasicMaterial({ color: 0x0a0c12, fog: false }), 0, 20, z0 - 40, 0, g); O.sky.userData.noRay = true;
  O.cross = grp(7, 14, z0 - 30, g); for (const [w, hh, y] of [[0.3, 2.6, 0], [1.6, 0.3, 0.55]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, 0.1), new THREE.MeshBasicMaterial({ color: 0xff2020, fog: false })); b.position.y = y; O.cross.add(b); }
  const cg = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xff2010, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8, fog: false })); cg.scale.set(6, 6, 1); O.cross.add(cg);
  const lamp = grp(-2.2, 0, z0 - 3.4, g); cyl(0.06, 0.08, 5, std({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.6 }), 0, 2.5, 0, lamp, 10); bev(0.2, 0.1, 0.9, std({ color: 0x3a3a3a, metalness: 0.5 }), 0, 5.0, 0.4, lamp, 0.01);
  O.lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffa040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); O.lampGlow.scale.set(1.6, 1.6, 1); O.lampGlow.position.set(0, 4.92, 0.7); lamp.add(O.lampGlow);
  const sc = grp(1.8, 0, z0 - 2.6, g); bev(0.35, 0.4, 1.3, std({ color: 0x8a1a14, roughness: 0.4 }), 0, 0.5, 0, sc, 0.05); cyl(0.2, 0.2, 0.08, M.black, 0, 0.2, 0.5, sc, 16).rotation.z = Math.PI / 2; cyl(0.2, 0.2, 0.08, M.black, 0, 0.2, -0.5, sc, 16).rotation.z = Math.PI / 2; bev(0.4, 0.06, 1.1, std({ color: 0xf0f4f8, roughness: 0.95 }), 0, 0.74, 0, sc, 0.03);
  // falling snow: a cloud of sprites that drift down past the glass
  O.snow = [];
  for (let i = 0; i < 260; i++) { const s = new THREE.Sprite(M.snowS); const k = rand(0.03, 0.07); s.scale.set(k, k, 1); s.position.set(rand(-8, 8), rand(0, 7), z0 - rand(0.4, 10)); s.userData.v = rand(0.35, 0.8); s.userData.ph = rand(0, TAU); layer1(s); g.add(s); O.snow.push(s); }
  // the one who walks away (seen only in the last picture)
  O.walker = person({ top: 0x1a1c20, legs: 0x1a1c20, hair: 'short', h: 1.02 }); O.walker.position.set(0.6, 0, z0 - 3.2); O.walker.rotation.y = Math.PI + 0.15; O.walker.visible = false; g.add(O.walker);
}

/* ---------------- people ---------------- */
// a standing person facing +z, feet at y = 0; the head is its own mesh on a neck pivot so it can bow, turn and look up
function person(o = {}) {
  const root = new THREE.Group(), body = [], head = [], add = (arr, geo, color, m) => arr.push({ geo, color, m });
  const sk = o.skin ?? 0xc8b8a8, top = o.top ?? 0x2a2c30, lg = o.legs ?? 0x2a2c30, H = o.h || 1.0;
  if (o.skirt) {
    for (const sx of [-1, 1]) { add(body, new THREE.CylinderGeometry(0.052, 0.042, 0.52, 10), o.legSkin ?? sk, m4(sx * 0.075, 0.26, 0)); if (o.bare) add(body, new THREE.BoxGeometry(0.08, 0.035, 0.2), o.legSkin ?? sk, m4(sx * 0.075, 0.018, 0.05)); else add(body, new THREE.BoxGeometry(0.08, 0.05, 0.22), 0x0a0a0a, m4(sx * 0.075, 0.025, 0.05)); }
    add(body, new THREE.CylinderGeometry(0.15, 0.17, 0.46, 16), o.skirt, m4(0, 0.72, 0, 0, 0, 0, 1, 1, 0.72));
  } else {
    for (const sx of [-1, 1]) { add(body, new THREE.CylinderGeometry(0.065, 0.058, 0.84, 10), lg, m4(sx * 0.085, 0.43, 0)); add(body, new THREE.BoxGeometry(0.1, 0.06, 0.25), o.shoes ?? 0x141414, m4(sx * 0.085, 0.03, 0.04)); }
  }
  add(body, new THREE.CylinderGeometry(o.skirt ? 0.155 : 0.17, 0.15, 0.56, 16), top, m4(0, 1.16, 0, 0, 0, 0, 1, 1, 0.72));
  add(body, new THREE.CylinderGeometry(0.15, 0.16, 0.12, 16), top, m4(0, 0.87, 0, 0, 0, 0, 1, 1, 0.72));
  if (o.collar) add(body, new THREE.CylinderGeometry(0.06, 0.1, 0.08, 12), o.collar, m4(0, 1.43, 0.01, 0, 0, 0, 1, 1, 0.8));
  const armDown = o.arms !== 'reach';
  for (const sx of [-1, 1]) {
    if (armDown) { add(body, new THREE.CylinderGeometry(0.048, 0.042, 0.62, 10), top, m4(sx * 0.2, 1.13, 0, 0, 0, sx * 0.06)); add(body, new THREE.BoxGeometry(0.05, 0.13, 0.03), sk, m4(sx * 0.225, 0.76, 0.01, 0, 0, sx * 0.05)); for (let f = 0; f < 3; f++) add(body, new THREE.CylinderGeometry(0.007, 0.006, o.long ? 0.11 : 0.07, 5), sk, m4(sx * 0.225 + (f - 1) * 0.013, o.long ? 0.64 : 0.66, 0.012)); }
    else { add(body, new THREE.CylinderGeometry(0.048, 0.042, 0.62, 10), top, m4(sx * 0.18, 1.3, 0.28, Math.PI / 2 - 0.15, 0, 0)); add(body, new THREE.BoxGeometry(0.05, 0.03, 0.13), sk, m4(sx * 0.18, 1.26, 0.62)); }
  }
  add(body, new THREE.CylinderGeometry(0.048, 0.055, 0.12, 10), sk, m4(0, 1.47, 0));
  // head (around the neck pivot at y 1.5)
  const faceCol = o.voidFace ? 0x080606 : sk;
  add(head, new THREE.SphereGeometry(0.102, 18, 14), faceCol, m4(0, 0.11, 0.01, 0, 0, 0, 0.9, 1.12, 1));
  if (o.hair === 'short') add(head, new THREE.SphereGeometry(0.11, 14, 10, 0, TAU, 0, Math.PI * 0.62), o.hairCol ?? 0x0c0a08, m4(0, 0.13, -0.005, -0.2, 0, 0, 1.0, 1.08, 1.05));
  else if (o.hair === 'perm') { for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, b = rand(0.2, 1.2); add(head, new THREE.SphereGeometry(0.035, 6, 5), o.hairCol ?? 0x1a1410, m4(Math.cos(a) * Math.sin(b) * 0.1, 0.13 + Math.cos(b) * 0.1, Math.sin(a) * Math.sin(b) * 0.1 - 0.01)); } }
  else if (o.hair === 'bob' || o.hair === 'long') add(head, new THREE.SphereGeometry(0.114, 14, 10, 0, TAU, 0, Math.PI * 0.6), o.hairCol ?? 0x0a0808, m4(0, 0.125, -0.01, -0.15, 0, 0, 1.02, 1.1, 1.08));
  if (o.visor) add(head, new THREE.BoxGeometry(0.2, 0.012, 0.1), o.visor, m4(0, 0.2, 0.09, 0.2, 0, 0));
  const vc = mat => std(Object.assign({ vertexColors: true, roughness: 0.8, envMapIntensity: 0.3 }, mat || {}));
  const bm = new THREE.Mesh(mergeParts(body), vc(o.mat)); bm.castShadow = true; root.add(bm);
  const neck = new THREE.Group(); neck.position.set(0, 1.5, 0); root.add(neck);
  const hm = new THREE.Mesh(mergeParts(head), vc(o.mat)); hm.castShadow = true; neck.add(hm);
  // long hair: cards hanging from the crown, over the face and down the back
  if (o.hair === 'long') {
    const card = (w, l, x, z, ry, rx, bend) => { const gg = new THREE.PlaneGeometry(w, l, 1, 10); gg.translate(0, -l / 2, 0); const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const y = -p.getY(i) / l; p.setZ(i, p.getZ(i) + Math.sin(y * Math.PI * 0.5) * bend); } gg.computeVertexNormals(); const m = new THREE.Mesh(gg, M.hair); m.position.set(x, 0.2, z); m.rotation.set(rx, ry, 0); m.castShadow = true; neck.add(m); return m; };
    const L = o.hairLen || 0.72;
    card(0.2, L, 0, 0.1, 0, 0.12, 0.05); card(0.16, L * 0.95, -0.07, 0.08, 0.5, 0.1, 0.04); card(0.16, L * 0.95, 0.07, 0.08, -0.5, 0.1, 0.04);
    card(0.24, L * 1.05, 0, -0.08, Math.PI, 0.05, 0.05); card(0.16, L, -0.1, -0.02, Math.PI / 2 + 0.3, 0.05, 0.03); card(0.16, L, 0.1, -0.02, -Math.PI / 2 - 0.3, 0.05, 0.03);
    neck.userData.front = neck.children.slice(-6, -3);
  }
  if (o.bow) neck.rotation.x = o.bow;
  if (o.tilt) neck.rotation.z = o.tilt;
  root.scale.setScalar(H);
  noRay(root);
  root.userData.neck = neck; root.userData.body = bm; root.userData.head = hm;
  root.userData.eye = new THREE.Object3D(); root.userData.eye.position.set(0, 1.35, 0); root.add(root.userData.eye);
  return root;
}
// her: a young woman in a charcoal office suit, barefoot, soaked, her hair hanging over her face to her waist
function woman(o = {}) {
  const root = new THREE.Group(), body = [], head = [], add = (arr, geo, color, m) => arr.push({ geo, color, m });
  const skin = o.skin ?? 0xaeb0ae, suit = o.suit ?? 0x34363a, blouse = 0xcac6be;
  const lathe2 = (pts, seg = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  // bare feet and thin legs below the skirt, a little knock-kneed
  for (const sx of [-1, 1]) {
    add(body, new THREE.BoxGeometry(0.075, 0.035, 0.21), 0x8a8884, m4(sx * 0.07, 0.018, 0.045, 0, sx * 0.08, 0));
    add(body, new THREE.CylinderGeometry(0.036, 0.03, 0.42, 10), skin, m4(sx * 0.068, 0.25, 0, 0, 0, sx * -0.03));
    add(body, new THREE.SphereGeometry(0.04, 10, 8), skin, m4(sx * 0.07, 0.46, 0.005));
  }
  // the pencil skirt, the jacket, the blouse at the collar
  add(body, lathe2([[0.001, 0.44], [0.135, 0.44], [0.15, 0.62], [0.165, 0.8], [0.14, 0.93], [0.001, 0.93]]), suit, m4(0, 0, 0, 0, 0, 0, 1, 1, 0.74));
  add(body, lathe2([[0.001, 0.9], [0.15, 0.9], [0.125, 1.02], [0.15, 1.16], [0.168, 1.28], [0.172, 1.33], [0.148, 1.38], [0.09, 1.425], [0.05, 1.445], [0.001, 1.445]], 22), suit, m4(0, 0, 0, 0, 0, 0, 1, 1, 0.66));
  add(body, new THREE.CylinderGeometry(0.045, 0.075, 0.12, 12), blouse, m4(0, 1.39, 0.02, -0.1, 0, 0, 1, 1, 0.8));
  add(body, new THREE.BoxGeometry(0.06, 0.2, 0.01), blouse, m4(0, 1.28, 0.105));
  // slumped shoulders, arms hanging dead straight, long pale hands
  for (const sx of [-1, 1]) {
    // one sleeve from the wrist to a sloping shoulder, no joints showing
    add(body, lathe2([[0.001, 0], [0.031, 0], [0.034, 0.05], [0.036, 0.28], [0.042, 0.42], [0.047, 0.54], [0.046, 0.59], [0.034, 0.618], [0.001, 0.628]], 14), suit, m4(sx * 0.192, 0.752, 0.03, -0.05, 0, sx * 0.05, 1, 1, 0.9));
    add(body, new THREE.CylinderGeometry(0.022, 0.02, 0.06, 8), skin, m4(sx * 0.2, 0.76, 0.03));
    add(body, new THREE.BoxGeometry(0.04, 0.085, 0.018), skin, m4(sx * 0.2, 0.69, 0.035, 0.05, 0, 0));
    for (let f = 0; f < 4; f++) add(body, new THREE.CylinderGeometry(0.0062, 0.005, 0.1 - Math.abs(f - 1.5) * 0.012, 5), skin, m4(sx * 0.2 + (f - 1.5) * 0.0095, 0.6 - Math.abs(f - 1.5) * 0.005, 0.04, 0.08, 0, 0));
  }
  add(body, new THREE.CylinderGeometry(0.03, 0.036, 0.1, 10), skin, m4(0, 1.47, 0.005));
  // the head, small, around a neck pivot at 1.5
  add(head, new THREE.SphereGeometry(0.08, 16, 12), skin, m4(0, 0.09, 0.012, 0, 0, 0, 0.9, 1.18, 1.02));
  add(head, new THREE.SphereGeometry(0.086, 16, 10, 0, TAU, 0, Math.PI * 0.62), 0x060505, m4(0, 0.1, 0.0, -0.1, 0, 0, 1.0, 1.14, 1.06));
  const vc = () => std({ vertexColors: true, roughness: 0.72, envMapIntensity: 0.25 });
  const bm = new THREE.Mesh(mergeParts(body), vc()); bm.castShadow = true; root.add(bm);
  const neck = new THREE.Group(); neck.position.set(0, 1.5, 0); root.add(neck);
  const hm = new THREE.Mesh(mergeParts(head), vc()); hm.castShadow = true; neck.add(hm);
  // the hair: a heavy curtain from the crown over the face to the waist, and down the back
  const sheet = (r, a0, a1, top, len, z0, mat) => {
    const segA = 14, segY = 14, g = new THREE.BufferGeometry(), pos = [], uv = [], idx = [];
    for (let j = 0; j <= segY; j++) for (let i = 0; i <= segA; i++) {
      const a = lerp(a0, a1, i / segA), v = j / segY, d = 0.13;
      const rr = v < d ? r * Math.sin((0.02 + 0.98 * v / d) * Math.PI / 2) : r + (v - d) * 0.05 + (Math.sin(i * 1.7 + j * 0.9) * 0.005 + Math.sin(i * 3.1 + 1.3) * 0.006) * Math.min(1, (v - d) * 4);
      const yy = v < d ? top + 0.02 - (1 - Math.cos(v / d * Math.PI / 2)) * 0.1 : top - 0.08 - (v - d) / (1 - d) * (len - 0.08) * (1 + 0.09 * Math.sin(i * 2.9 + a0 * 3) * (v - d));
      pos.push(Math.sin(a) * rr, yy - Math.sin(i * 2.3) * 0.02 * Math.max(0, v - d), Math.cos(a) * rr + z0); uv.push(i / segA, 1 - v);
    }
    for (let j = 0; j < segY; j++) for (let i = 0; i < segA; i++) { const q = j * (segA + 1) + i; idx.push(q, q + segA + 1, q + 1, q + 1, q + segA + 1, q + segA + 2); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; hair.add(m); return m;
  };
  const hair = new THREE.Group(); hair.position.set(0, 0.17, 0.01); neck.add(hair); neck.userData.hair = hair;
  const L = o.hairLen ?? 0.8;
  neck.userData.front = sheet(0.108, -1.35, 1.35, 0.02, L, 0.016, M.hairMass);
  sheet(0.104, Math.PI - 1.86, Math.PI + 1.86, 0.02, L * 1.05, -0.004, M.hairMass);
  setNeck(root, o.bow || 0, o.tilt || 0, neck);
  root.scale.setScalar(o.h || 1.0);
  noRay(root);
  root.userData.neck = neck; root.userData.body = bm; root.userData.head = hm;
  root.userData.eye = new THREE.Object3D(); root.userData.eye.position.set(0, 1.35, 0); root.add(root.userData.eye);
  return root;
}
// bow and tilt the head; long hair still hangs straight down from the crown
function setNeck(fig, bow, tilt, nk) { const neck = nk || fig.userData.neck; neck.rotation.set(bow, 0, tilt); const h = neck.userData.hair; if (h) { h.rotation.set(0, 0, 0); h.updateMatrixWorld(); neck.updateMatrixWorld(); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(bow * 0.6, 0, tilt * 0.6)).invert(); h.quaternion.copy(q); } }
function buildHer() {
  const spec = { h: 1.0, tilt: 0.16, bow: 0.3 };
  O.she = woman(spec); O.she.visible = false; O.she.userData.keep = true; scene.add(O.she);                 // in the car
  O.sheDoor = woman(spec); O.sheDoor.visible = false; O.sheDoor.userData.keep = true; scene.add(O.sheDoor); // in a doorway, close
  // the face, for the moment you look: filling your eyes, parted hair, one eye wide open and staring
  O.face = grp(0, 0, 0); O.face.visible = false; camera.add(O.face);
  const fg = new THREE.PlaneGeometry(0.27, 0.405, 18, 24); const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setZ(i, -x * x * 2.2 - y * y * 0.5); }
  fg.computeVertexNormals();
  O.faceMat = new THREE.MeshBasicMaterial({ map: T.faceTex, fog: false, transparent: true });
  O.face.add(new THREE.Mesh(fg, O.faceMat));
  // a few loose strands hanging in front of it, so it has depth when it moves
  for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.002, 0.005), 0.5), new THREE.MeshBasicMaterial({ color: 0x030303, fog: false, transparent: true })); st.position.set(rand(-0.09, 0.09), rand(-0.05, 0.08), rand(0.01, 0.05)); st.rotation.z = rand(-0.1, 0.1); O.face.add(st); }
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, transparent: true })); bk.position.set(0, 0, -0.12); O.face.add(bk);
  O.face.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; if (c.material) { c.material.depthTest = false; c.material.depthWrite = false; c.renderOrder = c === bk ? 20 : c.geometry === fg ? 21 : 22; } });
  // her hand, on your shoulder: long grey fingers curling over it from behind
  O.hand = grp(0.16, -0.06, -0.12); O.hand.visible = false; camera.add(O.hand);
  const hs = std({ color: 0x6c7270, roughness: 0.5, envMapIntensity: 0.18 }), nail = std({ color: 0x3a3032, roughness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const f = grp(-0.03 + i * 0.019, 0.02, 0.05, O.hand); f.rotation.set(0.25, 0, (i - 1.5) * 0.06);
    const l1 = 0.055 - Math.abs(i - 1.5) * 0.006, l2 = 0.045 - Math.abs(i - 1.5) * 0.005;
    const s1 = cyl(0.0085, 0.0078, l1, hs, 0, 0, -l1 / 2, f, 8); s1.rotation.x = Math.PI / 2;
    const k = grp(0, 0, -l1, f); k.rotation.x = -0.9; const s2 = cyl(0.0077, 0.0062, l2, hs, 0, 0, -l2 / 2, k, 8); s2.rotation.x = Math.PI / 2;
    const tip = grp(0, 0, -l2, k); tip.rotation.x = -0.6; const s3 = cyl(0.006, 0.0045, 0.026, hs, 0, 0, -0.013, tip, 8); s3.rotation.x = Math.PI / 2; const n = bev(0.009, 0.003, 0.014, nail, 0, 0.004, -0.02, tip, 0.001);
  }
  O.hand.rotation.set(-0.15, -0.25, 0.3); O.hand.scale.setScalar(0.85);
  O.hand.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; });
}
function buildCleaner() {
  O.cleaner = person({ top: 0x2a3a5a, legs: 0x2a3440, hair: 'perm', hairCol: 0x2a2018, skin: 0xb89880, visor: 0xd8d0c0, h: 0.93, shoes: 0x3a3a3a });
  O.cleaner.visible = false; O.cleaner.userData.keep = true; scene.add(O.cleaner);
  O.cart = grp(0, 0, 0); O.cart.visible = false; O.cart.userData.keep = true; scene.add(O.cart);
  bev(0.5, 0.06, 0.8, std({ color: 0x2a4a8a, roughness: 0.5 }), 0, 0.22, 0, O.cart, 0.01); bev(0.5, 0.06, 0.8, std({ color: 0x2a4a8a, roughness: 0.5 }), 0, 0.72, 0, O.cart, 0.01);
  for (const [x, z] of [[-0.22, -0.36], [0.22, -0.36], [-0.22, 0.36], [0.22, 0.36]]) { cyl(0.012, 0.012, 0.7, M.chrome, x, 0.5, z, O.cart, 6); cyl(0.04, 0.04, 0.03, M.black, x, 0.04, z, O.cart, 10).rotation.z = Math.PI / 2; }
  lathe([[0.001, 0], [0.16, 0], [0.18, 0.28], [0.001, 0.28]], std({ color: 0xd8c020, roughness: 0.4 }), 0, 0.25, 0.15, O.cart, 16);
  cyl(0.012, 0.012, 1.3, std({ color: 0x8a6a40, roughness: 0.6 }), 0.1, 0.9, 0.15, O.cart, 6).rotation.z = 0.15;
  noRay(O.cart); noRay(O.cleaner);
}

/* ---------------- dressings: what each floor holds, on each side ---------------- */
function buildDressings() {
  const G0 = O.landDress;
  const dg = (name) => { const g = grp(0, 0, 0, G0); g.visible = false; D[name] = g; return g; };
  // vacant floors: a FOR LEASE sheet on the glass, plastic hanging in the dark office, paint tins, a stepladder
  const vac = dg('vacant');
  plane(0.5, 0.36, std({ map: T.leaseTex, roughness: 0.8 }), LAND.x1 - 0.02, 1.35, (OFFD.z0 + OFFD.z1) / 2 + 0.35, -Math.PI / 2, vac);
  const plast = std({ color: 0xdfe4e6, roughness: 0.3, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.5, 6, 6), plast); const pp = p.geometry.attributes.position; for (let k = 0; k < pp.count; k++) pp.setZ(k, Math.sin(pp.getX(k) * 3 + i) * 0.08); p.geometry.computeVertexNormals(); p.position.set(3.4 + i * 1.2, 1.3, -2.2 + (i % 2) * 1.4); p.rotation.y = Math.PI / 2 + rand(-0.3, 0.3); p.userData.noRay = true; vac.add(p); }
  for (let i = 0; i < 3; i++) cyl(0.12, 0.12, 0.2, std({ color: 0xd8d4c8, roughness: 0.5, metalness: 0.4 }), 3.1 + i * 0.3, 0.1, -4.8, vac, 14);
  // the missing-person poster by the lift, and on 9 it has her face scratched out on the other side
  O.lposter = plane(0.42, 0.6, std({ map: T.posterTex, roughness: 0.85 }), -1.1, 1.45, LW - 0.012, Math.PI, dg('poster'));
  O.lposterX = plane(0.42, 0.6, std({ map: T.posterXTex, roughness: 0.85 }), -1.1, 1.45, LW - 0.012, Math.PI, dg('posterX'));
  // her handbag, spilled, and the window pole leaning by the hose cabinet (the other 10)
  const bag = dg('bag');
  O.bag = grp(-1.2, 0, -2.6, bag); bev(0.34, 0.24, 0.12, std({ color: 0x3a1e18, roughness: 0.5 }), 0, 0.06, 0, O.bag, 0.03).rotation.x = -Math.PI / 2 + 0.2;
  tube([[-0.12, 0.1, 0], [-0.08, 0.2, 0.05], [0.08, 0.2, 0.05], [0.12, 0.1, 0]], 0.008, std({ color: 0x2a1410, roughness: 0.6 }), O.bag, 12, 6).rotation.x = -1.2;
  O.lip = cyl(0.009, 0.009, 0.07, std({ color: 0x8a1a24, metalness: 0.6, roughness: 0.3 }), 0.25, 0.01, 0.2, O.bag, 10); O.lip.rotation.z = Math.PI / 2;
  O.badgeObj = grp(0.1, 0.005, 0.3, O.bag); bev(0.085, 0.004, 0.055, std({ map: T.badgeTex, roughness: 0.4 }), 0, 0, 0, O.badgeObj, 0.001); tube([[0, 0, -0.03], [0.1, 0, -0.2], [0.25, 0, -0.1], [0.2, 0, 0.05]], 0.004, std({ color: 0x2a4a9a, roughness: 0.7 }), O.badgeObj, 16, 4);
  O.shoe = grp(-0.7, 0, -1.7, bag); shoeMesh(O.shoe, 0x1a1414); O.shoe.rotation.set(0, 1.2, Math.PI / 2 - 0.2); O.shoe.position.y = 0.04;
  O.pole = grp(1.12, 0, LAND.z0 + 0.08, bag); cyl(0.012, 0.012, 2.2, std({ color: 0xa8aaa8, metalness: 0.8, roughness: 0.35 }), 0, 1.1, 0, O.pole, 8); tube([[0, 2.2, 0], [0, 2.28, 0], [0.03, 2.3, 0], [0.05, 2.27, 0]], 0.006, M.brass, O.pole, 10, 5); O.pole.rotation.z = 0.08;
  hitbox('bag', O.bag, 0.05); hitbox('pole', O.pole, 0.06);
  // chairs turned to face the lift, on the other 10 (done by turning the office chairs)
  // the other 7: the office full of people standing at the glass, facing it
  const st = dg('standing'); O.standers = [];
  for (let i = 0; i < 9; i++) { const p = person({ top: pick([0x1a1c20, 0x2a2a2e, 0x3a3a40, 0x202630]), legs: 0x14161a, hair: pick(['short', 'bob', 'short']), voidFace: true, h: rand(0.94, 1.04), bow: rand(0, 0.1) }); p.position.set(2.75 + (i % 3) * 0.55 + rand(-0.1, 0.1), 0, -3.0 + Math.floor(i / 3) * 0.55 + rand(-0.08, 0.08)); p.rotation.y = -Math.PI / 2; st.add(p); O.standers.push(p); }
  // the other 8: dust sheets over everything, and a sheet over someone standing at the glass
  const sh = dg('sheets');
  for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, TAU, 0, Math.PI / 2), M.cloth); s.scale.set(1.1, 1.1, 0.7); s.position.set(3.6 + (i % 4) * 1.3, 0.1, -4.2 + Math.floor(i / 4) * 1.6); sh.add(s); }
  const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.34, 1.7, 16, 6, true), M.cloth); ghost.position.set(2.75, 0.85, -2.3); sh.add(ghost); const gh2 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), M.cloth); gh2.position.set(2.75, 1.72, -2.3); sh.add(gh2);
  // the other 2: shoes, neatly paired, lined up facing the lift
  const shoes = dg('shoes');
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const s = grp(-1.9 + c * 0.62 + rand(-0.04, 0.04), 0, -1.35 - r * 0.5, shoes); const col = pick([0x141414, 0x2a1a10, 0x3a2a20, 0x6a6a6a, 0x8a1a1a, 0xe0e0e0]); for (const sx of [-1, 1]) { const one = grp(sx * 0.07, 0, 0, s); shoeMesh(one, col); } s.rotation.y = Math.PI; }
  // the other 2, the second time: a crowd packed up to the doors, heads bowed
  const crowd = dg('crowd'); O.crowd = [];
  for (let i = 0; i < 17; i++) { const r = Math.floor(i / 5), c = i % 5; const p = person({ top: pick([0x14161a, 0x1c1c20, 0x242830, 0x302a28]), legs: 0x101214, hair: pick(['short', 'bob', 'long', 'short']), voidFace: true, h: rand(0.93, 1.05), bow: 0.55 }); p.position.set(-1.2 + c * 0.6 + rand(-0.08, 0.08), 0, -1.35 - r * 0.55 + rand(-0.05, 0.05)); p.rotation.y = Math.PI + rand(-0.15, 0.15); crowd.add(p); O.crowd.push(p); }
  // the other 5: her floor. Water on the floor, hair, her other shoe, and lipstick on the wall
  const her = dg('her');
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.0), std({ color: 0x050607, roughness: 0.03, metalness: 0.4, transparent: true, opacity: 0.85, envMapIntensity: 1.2 })); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.006, -2.4); water.userData.noRay = true; her.add(water);
  for (let i = 0; i < 40; i++) { const x = rand(-1.8, 1.8), z = rand(-3.4, -1.1), l = rand(0.2, 0.7), a = rand(0, TAU); const pts = []; for (let k = 0; k <= 5; k++) pts.push([x + Math.cos(a) * l * k / 5 + Math.sin(k + i) * 0.02, 0.008, z + Math.sin(a) * l * k / 5 + Math.cos(k * 1.3 + i) * 0.02]); tube(pts, 0.0015, M.black, her, 10, 3); }
  const s2 = grp(0.5, 0.04, -1.3, her); shoeMesh(s2, 0x1a1414); s2.rotation.set(0.3, -0.6, Math.PI / 2);
  O.lipWall = plane(1.8, 1.0, std({ map: T.lipWallTex, transparent: true, roughness: 0.4, depthWrite: false }), 0.1, 1.55, LAND.z0 + 0.006, 0, her);
  // the other 6: the cleaner's cart, knocked over
  const cartX = dg('cartOver'); O.cartOver = grp(-3.2, 0.25, -2.2, cartX); bev(0.5, 0.06, 0.8, std({ color: 0x2a4a8a, roughness: 0.5 }), 0, 0, 0, O.cartOver, 0.01); O.cartOver.rotation.set(0, 0.4, Math.PI / 2);
  lathe([[0.001, 0], [0.16, 0], [0.18, 0.28], [0.001, 0.28]], std({ color: 0xd8c020, roughness: 0.4 }), -0.6, 0.0, 0.6, cartX, 16).rotation.z = 1.4;
  // the other 3: a handprint smeared down the glass door
  O.smear = plane(0.5, 1.2, std({ map: T.smearTex, transparent: true, roughness: 0.3, depthWrite: false }), LAND.x1 - 0.016, 1.2, (OFFD.z0 + OFFD.z1) / 2 - 0.3, -Math.PI / 2, dg('smear')); O.smear.renderOrder = 4;
  buildFuneral(dg('funeral'));
}
function shoeMesh(g, col) {
  const m = phys({ color: col, roughness: 0.45, clearcoat: 0.4 });
  bev(0.075, 0.05, 0.22, m, 0, 0.03, 0.02, g, 0.02); bev(0.065, 0.1, 0.07, m, 0, 0.07, -0.07, g, 0.02);
}

/* ---------------- the floor that isn't there: a funeral ---------------- */
function buildFuneral(g) {
  const z0 = LAND.z0;
  // white curtains over the corridor and the office doors
  const curt = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(1.4, 2.6, 16, 2), 2, 2), M.cloth); const cp = curt.geometry.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 14) * 0.04); curt.geometry.computeVertexNormals();
  const c1 = curt.clone(); c1.position.set(LAND.x0 + 0.05, 1.3, (CORR.z0 + CORR.z1) / 2); c1.rotation.y = Math.PI / 2; g.add(c1);
  const c2 = curt.clone(); c2.scale.x = 1.3; c2.position.set(LAND.x1 - 0.05, 1.3, (OFFD.z0 + OFFD.z1) / 2); c2.rotation.y = -Math.PI / 2; g.add(c2);
  // the altar: three white-draped steps across the far wall
  O.altar = grp(0, 0, z0, g);
  [[2.8, 0.55, 1.1], [2.5, 0.85, 0.8], [2.2, 1.15, 0.5]].forEach(([w, hh, d]) => bev(w, hh, d, M.cloth, 0, hh / 2, d / 2 + 0.02, O.altar, 0.02));
  // chrysanthemums massed along the steps
  const petal = tex(canv(128, 64, (g, w, h) => { g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, h); for (let r = 0; r < 6; r++) for (let i = 0; i < 22; i++) { const x = (i + (r % 2) * 0.5) / 22 * w + rand(-1, 1), y = r / 6 * h; g.strokeStyle = `rgba(90,90,80,${rand(0.35, 0.6)})`; g.lineWidth = rand(0.8, 1.6); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rand(-2, 2), y + h / 12, x + rand(-1, 1), y + h / 6 + 2); g.stroke(); } const c = g.createLinearGradient(0, 0, 0, h); c.addColorStop(0, 'rgba(200,190,120,0.35)'); c.addColorStop(0.12, 'rgba(0,0,0,0)'); c.addColorStop(0.9, 'rgba(0,0,0,0)'); c.addColorStop(1, 'rgba(40,40,30,0.4)'); g.fillStyle = c; g.fillRect(0, 0, w, h); }));
  const chry = std({ color: 0xffffff, map: petal, flatShading: true, roughness: 0.85, emissive: new THREE.Color(0x8a8a86), emissiveIntensity: 0.18 }), chryG = new THREE.IcosahedronGeometry(0.032, 1);
  { const p = chryG.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + Math.abs(Math.sin(v.x * 311 + v.y * 173 + v.z * 257)) * 0.3); p.setXYZ(i, v.x, v.y * 0.66, v.z); } chryG.computeVertexNormals(); }
  const flowers = new THREE.InstancedMesh(chryG, chry, 900); let fi = 0; const mm = new THREE.Matrix4(), cc = new THREE.Color();
  for (const [w, hh, d] of [[2.8, 0.55, 1.1], [2.5, 0.85, 0.8], [2.2, 1.15, 0.5]]) for (let i = 0; i < 300 && fi < 900; i++) { mm.compose(new THREE.Vector3(rand(-w / 2 + 0.05, w / 2 - 0.05), hh + rand(0, 0.06), rand(d - 0.25, d)), new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(-0.3, 0.3), rand(0, TAU), rand(-0.3, 0.3))), new THREE.Vector3(1, 1, 1).multiplyScalar(rand(0.8, 1.4))); flowers.setMatrixAt(fi, mm); flowers.setColorAt(fi, cc.set(Math.random() < 0.1 ? 0xe8e2b0 : Math.random() < 0.5 ? 0xffffff : 0xf0eee4)); fi++; }
  flowers.count = fi; O.altar.add(flowers);
  // dark leaves tucked along the front edge of each step
  const leafG = new THREE.PlaneGeometry(0.05, 0.11); leafG.translate(0, 0.05, 0);
  const leaves = new THREE.InstancedMesh(leafG, std({ color: 0x4a6a38, roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: 0.4 }), 240); let li = 0;
  for (const [w, hh, d] of [[2.8, 0.55, 1.1], [2.5, 0.85, 0.8], [2.2, 1.15, 0.5]]) for (let i = 0; i < 80; i++) { mm.compose(new THREE.Vector3(-w / 2 + 0.06 + i / 79 * (w - 0.12) + rand(-0.01, 0.01), hh - 0.02, d + 0.005), new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0.6, 1.2), rand(-0.4, 0.4), rand(-0.6, 0.6))), new THREE.Vector3(1, 1, 1).multiplyScalar(rand(0.7, 1.1))); leaves.setMatrixAt(li++, mm); }
  leaves.count = li; O.altar.add(leaves);
  // the portraits: black frames, black ribbons across the corners
  O.portraits = [];
  const frames = [[-0.9, 1.5, 'p0'], [-0.45, 1.55, 'p1'], [0.0, 1.62, 'jy'], [0.45, 1.55, 'you'], [0.9, 1.5, 'p2']];
  frames.forEach(([x, y, k]) => { const f = grp(x, y, 0.3, O.altar); f.rotation.x = -0.08; mesh(frameGeo(0.34, 0.44, 0.28, 0.38, 0.03, 0.006), M.black, 0, 0, 0, f); plane(0.28, 0.38, std({ map: T.portraits[k], roughness: 0.4 }), 0, 0, 0.012, 0, f); const rb = std({ color: 0x050505, roughness: 0.9, side: THREE.DoubleSide }); for (const sx of [-1, 1]) { const r = plane(0.035, 0.16, rb, sx * 0.13, 0.17, 0.034, 0, f); r.rotation.z = sx * 0.78; } O.portraits.push(f); if (k === 'jy') O.jyPortrait = f; if (k === 'you') O.yourPortrait = f; });
  hitbox('portraits', O.portraits[2], 0.05);
  // candles and incense on the top step
  O.candles = [];
  for (const x of [-0.7, 0.7]) { const c = grp(x, 1.15, 0.3, O.altar); cyl(0.03, 0.03, 0.34, std({ color: 0xf2eee4, roughness: 0.5 }), 0, 0.17, 0, c, 12); const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffb050, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); fl.scale.set(0.09, 0.14, 1); fl.position.y = 0.39; c.add(fl); layer1(fl); O.candles.push(fl); }
  const burner = grp(0, 1.15, 0.33, O.altar); lathe([[0.001, 0], [0.08, 0.0], [0.09, 0.05], [0.07, 0.09], [0.001, 0.09]], M.brass, 0, 0, 0, burner, 18);
  for (let i = -1; i <= 1; i++) { cyl(0.002, 0.002, 0.26, std({ color: 0x5a2a1a, roughness: 0.8 }), i * 0.02, 0.2, 0, burner, 4); const e = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xff5010, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 })); e.scale.set(0.02, 0.02, 1); e.position.set(i * 0.02, 0.33, 0); burner.add(e); layer1(e); }
  O.smoke = []; for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xb8b8c0, transparent: true, depthWrite: false, opacity: 0 })); layer1(s); burner.add(s); O.smoke.push({ s, t: i / 8 }); }
  // the offering table in front: fruit, a bowl of rice with the spoon standing in it, and a white dish
  O.offer = grp(0, 0, z0 + 1.5, g);
  bev(1.4, 0.05, 0.55, phys({ color: 0x3a1c10, roughness: 0.45, clearcoat: 0.6 }), 0, 0.42, 0, O.offer, 0.01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bev(0.05, 0.4, 0.05, std({ color: 0x3a1c10, roughness: 0.5 }), sx * 0.64, 0.2, sz * 0.22, O.offer, 0.006);
  for (let i = 0; i < 5; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), std({ color: i % 2 ? 0xa8201a : 0xd8c070, roughness: 0.45 })); a.position.set(-0.55 + (i % 3) * 0.09, 0.49 + Math.floor(i / 3) * 0.07, -0.1 + (i % 2) * 0.05); O.offer.add(a); }
  lathe([[0.001, 0], [0.05, 0], [0.07, 0.06], [0.001, 0.05]], std({ color: 0xe8e4dc, roughness: 0.3 }), 0.35, 0.445, 0, O.offer, 18);
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 8, 0, TAU, 0, Math.PI / 2), std({ color: 0xf4f2ec, roughness: 0.9 })); rice.position.set(0.35, 0.49, 0); rice.scale.y = 0.6; O.offer.add(rice);
  const spoon = bev(0.012, 0.18, 0.004, M.chrome, 0.35, 0.58, 0, O.offer, 0.002);
  O.dish = grp(0, 0.445, 0.05, O.offer); lathe([[0.001, 0], [0.08, 0.0], [0.1, 0.02], [0.001, 0.012]], phys({ color: 0xf4f2ec, roughness: 0.2, clearcoat: 1 }), 0, 0, 0, O.dish, 24);
  O.capOnDish = grp(0, 0.02, 0, O.dish); const capM = cyl(0.02, 0.021, 0.012, M.steel, 0, 0.006, 0, O.capOnDish, 24);
  hitbox('dish', O.dish, 0.05);
  // the folding screen of hanji paper along the left, lit from behind: the mourners' shadows
  O.screen = grp(LAND.x0 + 0.5, 0, -2.2, g); O.screen.rotation.y = Math.PI / 2;
  for (let i = 0; i < 3; i++) { const p = plane(0.62, 1.7, M.hanji, -0.63 + i * 0.63, 0.95, 0, 0, O.screen); p.userData.noRay = true; bev(0.03, 1.8, 0.03, M.wood, -0.945 + i * 0.63, 0.9, 0, O.screen, 0.004); }
  bev(0.03, 1.8, 0.03, M.wood, 0.945, 0.9, 0, O.screen, 0.004); bev(1.92, 0.03, 0.03, M.wood, 0, 1.8, 0, O.screen, 0.004);
  O.shadows = plane(1.86, 1.66, new THREE.MeshBasicMaterial({ map: T.shadowTex, transparent: true, depthWrite: false, color: 0x000000 }), 0, 0.95, 0.01, 0, O.screen); O.shadows.userData.noRay = true; O.shadows.renderOrder = 3;
  // the condolence table on the right: a book and the white box
  const ct = grp(1.7, 0, -1.8, g); bev(0.9, 0.04, 0.5, M.cloth, 0, 0.72, 0, ct, 0.01); for (const sx of [-1, 1]) bev(0.04, 0.7, 0.44, M.cloth, sx * 0.42, 0.35, 0, ct, 0.004);
  bev(0.3, 0.3, 0.3, std({ color: 0xf2f0ea, roughness: 0.6 }), 0.2, 0.89, 0, ct, 0.01); plane(0.2, 0.14, std({ map: T.bueuiTex, roughness: 0.7 }), 0.2, 0.92, 0.152, 0, ct);
  bev(0.3, 0.03, 0.22, std({ color: 0xe8e2d4, roughness: 0.8 }), -0.22, 0.755, 0, ct, 0.005); O.guestBook = ct; hitbox('guestbook', ct, 0.03);
}

/* ---------------- lights ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x8a94a0, 0x201c18, 0.06); scene.add(L.hemi);
  const pl = (c, i, d, x, y, z, shadow, far = 10) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); if (shadow) { l.castShadow = true; l.shadow.mapSize.set(IS_TOUCH ? 512 : 1024, IS_TOUCH ? 512 : 1024); l.shadow.bias = -0.002; l.shadow.normalBias = 0.02; l.shadow.camera.near = 0.05; l.shadow.camera.far = far; } scene.add(l); return l; };
  L.carA = pl(0xf2f6ff, 0, 5, -0.49, 2.18, 0.05, true, 8);
  L.carB = pl(0xf2f6ff, 0, 5, 0.49, 2.18, -0.05, false);
  L.emerg = pl(0xffa040, 0, 2.3, -0.62, 2.1, -0.55, false);
  L.land = pl(0xeef2ff, 0, 9, 0, 2.55, -2.3, !IS_TOUCH, 12);
  L.aux = pl(0xeef2ff, 0, 8, -4.3, 2.1, -2.2, false);
  L.aux2 = pl(0xffe0b0, 0, 9, 5.0, 2.3, -2.4, false);
  L.top = pl(0xffd8a0, 0, 6, -0.55, TOP + 0.45, 0.2, false);
  L.street = pl(0xffa050, 0, 18, -2.2, 4.6, LOB.z0 - 2.8, false);
}

/* =====================================================================
   DOORS CLOSING · part D: items, documents, voices heard, Ji-yeon's scratches, hints,
   and the painted things (panel, display, signs, posters, portraits, her face)
   ===================================================================== */
const TONIGHT = '2004. 12. 17.';

const ITEMS = {
  phone: { name: 'Ji-yeon\'s phone', short: 'Her phone', desc: 'Your sister\'s silver flip phone. It was lying on the floor of this lift when they found the car standing open at the tenth floor, a week ago. The police gave it back to your mother. There is one voice memo on it, from 2:13 a.m. that night.' },
  printout: { name: 'The printout', short: 'Printout', doc: 'rules' },
  pole: { name: 'Window pole', short: 'Pole', desc: 'An aluminium pole about two metres long, with a little brass hook on the end, for opening high windows. It was leaning by the fire hose cabinet.' },
  badge: { name: 'Ji-yeon\'s ID card', short: 'ID card', doc: 'badge' },
  cap: { name: 'A lift button', short: 'Button', desc: 'A round steel button cap from a lift panel, with its little contact springs still on the back. Someone has scratched the number off its face with something sharp.' },
};
const HEARD = {
  memo: { title: 'Ji-yeon\'s voice memo, 10 December, 2:13 a.m.', text: '"It\'s two thirteen. I\'m in the lift at work. On my own. The Elevator Game. Four, two, six, two, ten. Then five. Then one." ... "Four... there\'s no four. Well, of course there isn\'t." ... "Oh. Found it." ... "Ten. Now five." ... (whispering) "Someone\'s getting on. Don\'t look. Don\'t look." ... "I pressed one. So why is it going up? Why is it going up?"' },
  op1: { title: 'The intercom, the first time', text: 'A woman at the lift company\'s night desk: "Sinil Elevator emergency centre. Are you trapped? ... If you\'re not, please don\'t press this button."' },
  op2: { title: 'The intercom, on the other side', text: '"The Cheongun Building? That\'s strange. On my screen that lift is standing at the first floor with its doors open. There\'s nobody in it."' },
  op3: { title: 'The intercom, again', text: '"What floor are you on? My screen says forty-four. That building only has ten floors."' },
  op4: { title: 'The intercom, a third time', text: '"Hello? Can you hear me? Who\'s in there with you? I can hear two people breathing."' },
  op5: { title: 'The intercom, going down', text: '"It\'s coming down now. The camera\'s back on. But... are there two of you? There\'s someone else standing there. Who is it?"' },
  cleaner: { title: 'At the sixth floor', text: 'A cleaner, running for the lift with her cart: "Hold it! Wait for me!"' },
  more: { title: 'The lift\'s own voice', text: '"One more passenger has boarded."' },
  whisper: { title: 'Behind you', text: 'A woman\'s whisper, very close: "Where are you going?" ... "Look at me."' },
  plea: { title: 'Behind you, in the lobby', text: '"It\'s me. It\'s Ji-yeon." ... "Please. Just look at me once." ... "I looked at her too. And then I was her." ... "Look at me. Then I get to go home."' },
};

/* ---------------- Ji-yeon's scratches, on the other side ---------------- */
// where: [x, y, z, rotY, w, h]
const SCR = [
  { id: 'five', ko: '5는 내가 빼서 없는 층에 숨겼어. 그 여자가 못 타게.', en: 'I TOOK THE 5 OUT AND HID IT ON THE FLOOR THAT ISN\'T THERE. SO SHE CAN\'T GET ON.', where: [PNL.cx, 0.35, CAR.z0 + 0.004, 0, 0.26, 0.2] },
  { id: 'up', ko: '1 누르면 올라가. 여기선 다 반대야.', en: 'PRESS 1 AND IT GOES UP. HERE EVERYTHING GOES THE OTHER WAY.', where: [CAR.x0 + 0.003, 1.28, 0.3, Math.PI / 2, 0.46, 0.34] },
  { id: 'roof', ko: '지붕 위에서 움직일 수 있어 ↑', en: 'YOU CAN DRIVE IT FROM THE ROOF ↑', where: [(CAR.x0 + DOOR.x0) / 2 - 0.01, 1.86, CAR.z0 + 0.004, 0, 0.32, 0.26] },
  { id: 'days', ko: '', en: 'Tally marks, dozens of them, in groups of five. More than a week\'s worth. Far more.', where: [CAR.x0 + 0.003, 1.75, -0.35, Math.PI / 2, 0.5, 0.3], tally: true },
  { id: 'mirror', ko: '보지 마', en: 'DON\'T LOOK', where: [0, 1.62, CAR.z1 - 0.013, Math.PI, 0.6, 0.34], lipstick: true },
];

/* ---------------- documents ---------------- */
const DOCS = {
  rules: { title: 'Printed from a forum, folded in your pocket', style: 'lxprint', pages: [
    `<div class="lxp-bar">나이트워치 게시판 · NIGHTWATCH BOARD · 괴담 (strange tales)</div>
     <h3>[괴담] 엘리베이터 게임 — 해 본 사람?</h3><p class="lxp-sub">The Elevator Game. Anyone tried it? &middot; posted 2004.11.28 03:02 &middot; views 18,402</p>
     <p>You need a building with at least ten floors and a lift, late at night, and you must be <b>alone</b> in the lift.</p>
     <ol><li>Get in on the first floor.</li><li>Press <b>4, 2, 6, 2, 10</b>, in that order. Ride to each floor. Don't get out. If anyone gets on, it doesn't work: go back to the start.</li>
     <li>At 10, press <b>5</b>. At the fifth floor a young woman may get on. <b>Do not look at her. Do not speak to her.</b></li>
     <li>Press <b>1</b>. If the lift goes <b>up</b> to 10 instead of down, you have made it to the other place.</li>
     <li>To come back, she has to ride with you again.</li></ol>
     <p class="lxp-warn">People who looked at her have not come back.</p>
     <p class="lxp-cmt">↳ <b>건물주</b>: lol my building doesn't even have a 4</p><p class="lxp-cmt">↳ <b>jy_0412</b>: which buildings have you tried it in?</p>`] },
  log: { title: 'Security log (on the guard\'s desk)', style: 'lxlog', pages: [
    `<p class="lxl-h">경비일지 · Security log · 청운빌딩</p>
     <p><span class="d">12.10 (금) 02:13</span> Lift went up to 10 on its own. Checked the camera: nobody in it. Went up by the stairs. 10th floor dark, lift standing open, empty. Mirae Design (9F) lights still on. Nobody there.</p>
     <p><span class="d">12.10 03:40</span> Han Ji-yeon, 9F Mirae Design, didn't sign out. Her bag is not in the office.</p>
     <p><span class="d">12.11 09:20</span> Police. Family. They took the tape from the lift camera: she presses the buttons, the car goes up, the picture goes to snow at 02:14. When it comes back, the lift is empty.</p>
     <p><span class="d">12.13 14:00</span> Sinil Elevator engineer checked the car. No fault found. He wouldn't go on the roof.</p>
     <p><span class="d">12.16 02:13</span> Lift went up to 10 again. Nobody in it. I didn't go up.</p>
     <p><span class="d">12.17 01:50</span> Patrol, top floor down. Front doors locked. — Oh</p>`] },
  dir: { title: 'Building directory (by the lift)', style: 'lxdir', pages: [
    `<h3>청운빌딩 · CHEONGUN BUILDING</h3><div class="lxd">${[[10, '대양회계법인', 'Daeyang Accounting'], [9, '미래디자인', 'Mirae Design'], [8, '한빛여행사', 'Hanbit Travel'], [7, '동아화재', 'Dong-a Fire Insurance'], [6, '서울치과기공소', 'Seoul Dental Lab'], [5, '공실', '(vacant)'], ['F', '공실', '(vacant)'], [3, '성진무역', 'Seongjin Trading'], [2, '관리사무소', 'Building management'], [1, '경비실', 'Security']].map(([n, k, e]) => `<div class="lxd-r"><b>${n}${n === 'F' ? '' : 'F'}</b><span>${k}</span><i>${e}</i></div>`).join('')}</div>`] },
  poster: { title: 'Poster taped by the lift', style: 'lxposter', pages: () => [
    `<p class="lxpo-h">사람을 찾습니다</p><p class="lxpo-e">MISSING</p><div class="lxpo-row"><img src="${T.jyURL || ''}" alt="A photo of a young woman with long black hair, smiling a little."><div><p><b>한지연 Han Ji-yeon</b> (24)</p><p>Last seen 10 December 2004, about 2 a.m., in the Cheongun Building, Euljiro 3-ga. Grey suit, long black hair.</p><p>Designer, Mirae Design (9F).</p><p class="lxpo-c">If you have seen her, call 112 or her family.</p></div></div>`] },
  cert: { title: 'Framed certificate (on the lift wall)', style: 'lxcert', pages: [
    `<h3>승강기 검사합격증명서</h3><p class="lxc-e">Lift inspection certificate</p>
     <div class="lxc-t"><div><span>Building</span><b>청운빌딩 Cheongun Bldg.</b></div><div><span>Car</span><b>No. 1 · passenger · 6 persons / 450 kg</b></div><div><span>Maker</span><b>Sinil Elevator Co., 1981 (modernised 1998)</b></div><div><span>Floors served</span><b>1, 2, 3, F, 5, 6, 7, 8, 9, 10</b></div><div><span>Inspected</span><b>2004. 06. 14. · PASSED</b></div></div>
     <p class="lxc-f">In an emergency press the ☎ button on the panel to speak to the Sinil 24-hour centre. Do not force the doors. Do not climb out.</p>`] },
  badge: { title: 'Ji-yeon\'s ID card (from her bag)', style: 'lxbadge', pages: () => [
    `<div class="lxb"><div class="lxb-top">MIRAE DESIGN · 미래디자인</div><div class="lxb-row"><img src="${T.jyURL || ''}" alt="Ji-yeon\'s photo"><div><p class="lxb-n">한지연</p><p class="lxb-e">Han Ji-yeon</p><p>Designer · 9F</p><p class="lxb-k">No. 0412</p></div></div></div><p class="lxb-back">On the back, in her handwriting: <i>"모두에게 미안해" — "Sorry to everyone."</i> The ink has run, as if it got wet.</p>`] },
  scratches: { title: 'Scratched into the steel, in Ji-yeon\'s handwriting', style: 'lxscr', pages: () => [
    SCR.filter(s => S.flags['scr_' + s.id]).map(s => `<div class="lxs"><p class="ko">${s.ko || '<span class="tally">┃┃┃┃╱ ┃┃┃┃╱ ┃┃┃┃╱ ┃┃┃┃╱ ┃┃┃┃╱ ┃┃┃┃╱ ┃┃┃┃╱ …</span>'}</p><p class="en">${s.en}</p></div>`).join('') || '<p>Nothing yet.</p>'] },
  guestbook: { title: 'The condolence book', style: 'lxbook', pages: [
    `<p class="lxbk-h">방명록 · Guests</p><div class="lxbk">${['김영수', '박미경', '이정훈', '최은지', '정태우', '한지연'].map((n, i) => `<p${i === 5 ? ' class="last"' : ''}>${n}</p>`).join('')}</div><p class="lxbk-n">Six names, all in the same handwriting. The last one is Ji-yeon's.</p>`] },
};

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'What am I doing here?', when: s => s.rit > 0 || s.world === 'other' ? 'solved' : 'active', tiers: [
    'You came to do what your sister did. The printout in your pocket has the rules, and her phone has a recording of her doing it.',
    'Read the printout (Tab opens your notebook). Play the voice memo on her phone.',
    'Step into the lift. Look at the buttons.',
    'Follow the printout: ride to 4, 2, 6, 2 and 10, in that order, alone. Then 5. Then 1.' ] },
  { id: 'four', title: 'There\'s no 4', when: s => !s.flags.panelSeen ? 'hidden' : (s.rit >= 1 || s.world === 'other') ? 'solved' : 'active', tiers: [
    'The printout says to press 4 first. The panel goes 1, 2, 3, then F, then 5.',
    'Check the building directory in the lobby, or the certificate in the lift: which floors does the lift serve?',
    'In Korean, 4 sounds like the word for death, so buildings often leave it out and call the fourth floor F.',
    'Press F.' ] },
  { id: 'order', title: 'The order', when: s => !s.flags.panelSeen ? 'hidden' : (s.rit >= 5 || s.world === 'other') ? 'solved' : 'active', tiers: [
    'Ride to each floor on the printout in turn, and let the doors open and close before you press the next.',
    'F, then 2, then 6, then 2, then 10. If you go to a floor out of turn, it starts again from F.',
    'If anyone gets in with you, it doesn\'t count: it starts again from F.',
    'F → 2 → 6 → 2 → 10, alone. Then press 5.' ] },
  { id: 'cleaner', title: 'Someone at the sixth floor', when: s => !s.flags.cleanerMet ? 'hidden' : (s.rit >= 3 || s.world === 'other') ? 'solved' : 'active', tiers: [
    'The ritual only works if you\'re alone in the lift.',
    'When the doors open at 6, somebody comes running for the lift.',
    'There\'s a button on the panel that closes the doors without waiting.',
    'As soon as the doors open at 6, press the close-doors button (▶|◀) on the panel.' ] },
  { id: 'she', title: 'The woman from the fifth floor', when: s => !s.flags.sheBoarded ? 'hidden' : (s.world === 'other' || s.flags.transit) ? 'solved' : 'active', tiers: [
    'The printout says: don\'t look at her, don\'t speak to her.',
    'She stands behind you. Keep your eyes on the doors and the panel.',
    'Press 1, as the printout says.',
    'Don\'t turn round. Press 1.' ] },
  { id: 'dead', title: 'The lift won\'t move', when: s => s.world !== 'other' ? 'hidden' : s.flags.drove ? 'solved' : 'active', tiers: [
    'The display over the doors says 점검 중: under inspection. Ji-yeon has scratched something by the doors.',
    'Under inspection, a lift is driven from its roof. The hatch in the ceiling goes up there, but it\'s latched on the top side. You need something long to push the latch with.',
    'There\'s a window pole leaning by the fire hose cabinet on the landing outside. Push the hatch latch with it and climb up.',
    'Take the window pole from beside the fire hose cabinet, push the hatch latch with it, climb onto the roof, and press DOWN on the yellow inspection box.' ] },
  { id: 'cap', title: 'The missing button', when: s => !(s.flags.holeSeen || s.flags.scr_five || s.flags.drove) ? 'hidden' : s.capIn ? 'solved' : 'active', tiers: [
    'The 5 button is gone. Ji-yeon scratched a note by the panel: she hid it on the floor that isn\'t there.',
    'Which floor isn\'t there, in this building? The one with no number on the buttons.',
    'The fourth floor. Drive the car down from the roof until the floor painted in front of you is a red 4, then climb back down into the car.',
    'From the roof, press DOWN until the painted 4. Climb down, take the button off the dish at the funeral, and press it into the hole on the panel.' ] },
  { id: 'back', title: 'Getting back', when: s => !(s.capIn || s.flags.scr_up) ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'The printout: to come back, she has to ride with you again. She gets on at the fifth floor.',
    'Press 5 and let her on. Don\'t look at her.',
    'On the first side, pressing 1 took you up. Ji-yeon found out why: over here everything goes the other way.',
    'Press 5. When she\'s on, don\'t press 1: press 10, and the lift goes down.' ] },
  { id: 'walk', title: 'Don\'t look back', when: s => !s.flags.final ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'She is behind you.',
    'Walk to the glass doors at the front of the lobby.',
    'Whatever she says, don\'t turn round.',
    'Walk straight out through the glass doors without looking back.' ] },
];

/* ---------------- painted things ---------------- */
function kFont(px, w = 700) { return `${w} ${px}px ${KR}`; }
function paintThings() {
  // button labels, engraved
  T.btnLabels = {};
  const lab = (key, draw) => { T.btnLabels[key] = ctex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(20,20,22,0.92)'; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; draw(g, w, h); }); };
  for (let n = 1; n <= 10; n++) lab(n, (g, w, h) => { g.font = kFont(n === 10 ? 58 : 70, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText(LABEL(n), w / 2 + 1, h / 2 + 5); g.fillText(LABEL(n), w / 2, h / 2 + 4); });
  lab('open', (g, w, h) => { g.beginPath(); g.moveTo(58, 44); g.lineTo(30, 64); g.lineTo(58, 84); g.fill(); g.beginPath(); g.moveTo(70, 44); g.lineTo(98, 64); g.lineTo(70, 84); g.fill(); g.fillRect(62, 40, 4, 48); });
  lab('close', (g, w, h) => { g.beginPath(); g.moveTo(30, 44); g.lineTo(58, 64); g.lineTo(30, 84); g.fill(); g.beginPath(); g.moveTo(98, 44); g.lineTo(70, 64); g.lineTo(98, 84); g.fill(); g.fillRect(62, 40, 4, 48); });
  lab('bell', (g, w, h) => { g.beginPath(); g.moveTo(64, 32); g.bezierCurveTo(40, 36, 44, 70, 34, 84); g.lineTo(94, 84); g.bezierCurveTo(84, 70, 88, 36, 64, 32); g.fill(); g.beginPath(); g.arc(64, 92, 7, 0, TAU); g.fill(); });
  lab('phone', (g, w, h) => { g.lineWidth = 12; g.strokeStyle = 'rgba(20,20,22,0.92)'; g.beginPath(); g.arc(64, 70, 30, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.fillRect(28, 62, 18, 14); g.fillRect(82, 62, 18, 14); });
  lab('capX', (g, w, h) => { g.strokeStyle = 'rgba(220,220,220,0.8)'; g.lineWidth = 2; for (let i = 0; i < 26; i++) { g.beginPath(); const y = rand(34, 94); g.moveTo(rand(26, 50), y); g.lineTo(rand(78, 104), y + rand(-12, 12)); g.stroke(); } });
  // the panel's printed plate
  T.panelTex = ctex(256, 920, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(20,20,22,0.85)'; g.textAlign = 'center';
    g.font = kFont(22, 700); g.fillText('신일엘리베이터', w / 2, 44); g.font = kFont(15, 400); g.fillText('SINIL ELEVATOR', w / 2, 66);
    g.font = kFont(17, 400); g.fillText('정원 6인 · 450kg', w / 2, 96);
    g.font = kFont(14, 400); g.fillText('열림  OPEN      닫힘  CLOSE', w / 2 - 6, 800); g.fillText('비상벨  ALARM      인터폰  CALL', w / 2 - 6, 906);
    g.strokeStyle = 'rgba(20,20,22,0.5)'; g.lineWidth = 2; g.strokeRect(10, 10, w - 20, h - 20);
  }); T.panelTex.wrapS = T.panelTex.wrapT = THREE.ClampToEdgeWrapping;
  // the floor display (dot matrix), redrawn as it changes
  T.dispTex = live(256, 84, (g, w, h) => dotMatrix(g, w, h, '1', 'up', 1));
  T.lantTex = live(128, 40, (g, w, h) => { g.fillStyle = '#050505'; g.fillRect(0, 0, w, h); });
  // the landing wall's painted number
  T.signTex = live(512, 384, (g, w, h) => paintSign(g, w, h, 2, 'real'));
  T.decalTex = live(512, 128, (g, w, h) => paintDecal(g, w, h, 2));
  T.hoseTex = ctex(256, 128, (g, w, h) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#a81814'; g.font = kFont(48, 900); g.textAlign = 'center'; g.fillText('소화전', w / 2, 62); g.font = kFont(22, 700); g.fillText('FIRE HOSE', w / 2, 100); });
  T.exitTex = ctex(256, 96, (g, w, h) => { g.fillStyle = '#0c8a3c'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4fff4'; g.font = kFont(38, 900); g.textAlign = 'left'; g.fillText('비상구', 104, 52); g.font = kFont(20, 700); g.fillText('EXIT', 112, 80); g.beginPath(); g.arc(52, 22, 9, 0, TAU); g.fill(); g.lineWidth = 9; g.strokeStyle = '#f4fff4'; g.lineCap = 'round'; g.beginPath(); g.moveTo(52, 34); g.lineTo(46, 58); g.lineTo(62, 76); g.moveTo(46, 58); g.lineTo(30, 80); g.moveTo(50, 42); g.lineTo(68, 50); g.moveTo(50, 42); g.lineTo(34, 48); g.stroke(); });
  T.leaseTex = ctex(256, 180, (g, w, h) => { g.fillStyle = '#f4f0e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c01810'; g.font = kFont(52, 900); g.textAlign = 'center'; g.fillText('임대문의', w / 2, 70); g.fillStyle = '#1a1a1a'; g.font = kFont(22, 700); g.fillText('FOR LEASE', w / 2, 108); g.font = kFont(20, 400); g.fillText('관리사무소 2F', w / 2, 144); });
  T.cityTex = ctex(1024, 400, (g, w, h) => paintCity(g, w, h, false));
  T.streetTex = ctex(1024, 380, (g, w, h) => paintStreet(g, w, h));
  T.dirTex = ctex(256, 340, (g, w, h) => { g.fillStyle = '#0e0e0e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e4d8'; g.font = kFont(18, 700); g.textAlign = 'center'; g.fillText('청운빌딩 안내', w / 2, 30); g.textAlign = 'left'; const rows = [['10F', '대양회계법인'], ['9F', '미래디자인'], ['8F', '한빛여행사'], ['7F', '동아화재'], ['6F', '서울치과기공소'], ['5F', '공실'], ['F', '공실'], ['3F', '성진무역'], ['2F', '관리사무소'], ['1F', '경비실']]; rows.forEach(([a, b], i) => { g.font = kFont(17, 700); g.fillText(a, 22, 62 + i * 28); g.font = kFont(17, 400); g.fillText(b, 76, 62 + i * 28); }); });
  T.jyURL = paintPortrait('jy', 240, 300, true);
  T.posterTex = ctex(256, 366, (g, w, h) => paintPoster(g, w, h, false));
  T.posterXTex = ctex(256, 366, (g, w, h) => paintPoster(g, w, h, true));
  T.logTex = ctex(220, 300, (g, w, h) => { g.fillStyle = '#ece6d4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,100,150,0.4)'; for (let y = 30; y < h; y += 18) { g.beginPath(); g.moveTo(8, y); g.lineTo(w - 8, y); g.stroke(); } g.fillStyle = '#1a2a5a'; g.font = `24px ${PEN}`; for (let y = 28; y < h - 10; y += 18) g.fillText('·'.repeat(0) + ['12.10 02:13 승강기', '12.10 03:40 한지연', '12.11 09:20 경찰', '12.13 14:00 신일', '12.16 02:13 또', '12.17 01:50 순찰'][Math.floor((y - 28) / 18) % 6], 12, y); });
  T.monTex = live(160, 120, (g, w, h) => paintMonitor(g, w, h, 0));
  T.clockTex = ctex(256, 256, (g, w, h) => { g.fillStyle = '#f2f0ea'; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill(); g.fillStyle = '#1a1a1a'; g.font = kFont(26, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); } });
  T.badgeTex = ctex(256, 168, (g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a4a9a'; g.fillRect(0, 0, w, 30); g.fillStyle = '#fff'; g.font = kFont(16, 700); g.fillText('MIRAE DESIGN', 10, 21); g.drawImage(portraitCanvas('jy'), 12, 42, 80, 104); g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(12, 42, 80, 104); g.fillStyle = '#1a1a1a'; g.font = kFont(24, 700); g.fillText('한지연', 104, 80); g.font = kFont(14, 400); g.fillText('Han Ji-yeon', 104, 102); g.fillText('Designer · 9F', 104, 124); });
  T.lipWallTex = ctex(720, 400, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(150,18,34,0.9)'; g.font = `260px ${PEN}`; g.textAlign = 'center'; g.fillText('미안해', w / 2, 250); g.font = `90px ${PEN}`; g.fillText('나를 보지 마', w / 2 + 40, 360); smudge(g, w, h); });
  T.smearTex = ctex(200, 480, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(40,30,28,0.55)'; g.beginPath(); g.ellipse(100, 70, 34, 40, 0, 0, TAU); g.fill(); for (let i = 0; i < 4; i++) { g.fillRect(70 + i * 17, 10, 11, 60); g.fillRect(72 + i * 16, 60, 9, 380 - i * 30); } });
  T.portraits = { p0: ctex(256, 340, g => g.drawImage(portraitCanvas('man'), 0, 0, 256, 340)), p1: ctex(256, 340, g => g.drawImage(portraitCanvas('girl'), 0, 0, 256, 340)), jy: ctex(256, 340, g => g.drawImage(portraitCanvas('jy'), 0, 0, 256, 340)), p2: ctex(256, 340, g => g.drawImage(portraitCanvas('woman'), 0, 0, 256, 340)),
    you: ctex(256, 340, (g, w, h) => { g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f2ec'; g.fillRect(58, 150, 140, 48); g.fillStyle = '#1a1a1a'; g.font = kFont(20, 700); g.textAlign = 'center'; g.fillText(TONIGHT, w / 2, 182); }) };
  T.shadowTex = live(512, 460, (g, w, h) => paintShadows(g, w, h, 0, 0));
  T.bueuiTex = ctex(128, 96, (g, w, h) => { g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = `700 50px ${MYEONG}`; g.textAlign = 'center'; g.fillText('賦儀', w / 2, 66); });
  T.faceTex = ctex(512, 768, (g, w, h) => paintFace(g, w, h));
  T.eyeTex = ctex(128, 280, (g, w, h) => paintEye(g, w, h));
  T.fitterMarks = []; for (let i = 0; i < 10; i++) T.fitterMarks.push(ctex(128, 96, (g, w, h) => { g.clearRect(0, 0, w, h); const four = i === 3; g.fillStyle = four ? 'rgba(200,16,10,0.95)' : 'rgba(235,225,200,0.85)'; g.font = `${four ? 84 : 64}px ${PEN}`; g.textAlign = 'center'; g.fillText(four ? '4' : (i + 1) + 'F', w / 2, four ? 76 : 66); if (four) { g.fillStyle = 'rgba(200,16,10,0.7)'; for (let k = 0; k < 4; k++) g.fillRect(48 + k * 11, 74, 2, 8 + Math.random() * 18); } }));
  T.checker = tex(pix(128, 128, (x, y) => { const u = (x % 32), v = (y % 32); const d1 = Math.abs((u - 8) + (v - 8) * 0.5) < 3 && Math.abs(u - 8) < 6, d2 = Math.abs((u - 24) - (v - 24) * 0.5) < 3 && Math.abs(u - 24) < 6; const b = (d1 || d2) ? 150 : 100; const n = tfbm(x, y, 128, 128, 4, 2) * 30; return [b + n, b + n, b + n]; }), { repeat: [1, 1] });
  T.boxTex = ctex(200, 260, (g, w, h) => { g.fillStyle = '#c8a020'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = kFont(18, 900); g.textAlign = 'center'; g.fillText('점검 운전반', w / 2, 30); g.font = kFont(16, 700); g.fillText('NORMAL', 54, 70); g.fillText('INSP', 150, 70); g.fillText('정상', 54, 90); g.fillText('점검', 150, 90); g.font = kFont(20, 900); g.fillText('STOP · 정지', w / 2, 230); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(100, 100); g.lineTo(100, 150); g.stroke(); });
  T.certTex = ctex(220, 310, (g, w, h) => { g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a4a8a'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#1a1a1a'; g.font = kFont(17, 900); g.textAlign = 'center'; g.fillText('승강기 검사합격증명서', w / 2, 44); g.font = kFont(12, 400); ['청운빌딩 1호기', '정원 6인 450kg', '신일엘리베이터 1981', '2004. 06. 14. 합격'].forEach((t, i) => g.fillText(t, w / 2, 90 + i * 26)); g.strokeStyle = '#b01810'; g.lineWidth = 3; g.beginPath(); g.arc(160, 250, 26, 0, TAU); g.stroke(); g.fillStyle = '#b01810'; g.font = kFont(14, 900); g.fillText('합격', 160, 255); });
  T.cctvTex = ctex(256, 110, (g, w, h) => { g.fillStyle = '#f2d020'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = kFont(26, 900); g.textAlign = 'center'; g.fillText('CCTV 녹화중', w / 2, 46); g.font = kFont(16, 700); g.fillText('CCTV IN OPERATION', w / 2, 80); });
  T.scratch = {};
  for (const s of SCR) T.scratch[s.id] = ctex(512, Math.round(512 * s.where[5] / s.where[4]), (g, w, h) => paintScratch(g, w, h, s));
}
function smudge(g, w, h) { const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) if (d.data[i] > 0) d.data[i] *= 0.55 + Math.random() * 0.45; g.putImageData(d, 0, 0); }
// the dot-matrix: render the text small, then light a dot for every covered pixel
function dotMatrix(g, w, h, text, arrow, k = 1, red = '255,40,20') {
  g.fillStyle = '#060202'; g.fillRect(0, 0, w, h);
  const cols = 40, rows = 13, px = w / cols, py = h / rows;
  const sm = dotMatrix.c || (dotMatrix.c = document.createElement('canvas')); sm.width = cols; sm.height = rows; const sg = sm.getContext('2d');
  sg.clearRect(0, 0, cols, rows); sg.fillStyle = '#fff'; sg.textBaseline = 'middle';
  const hangul = /[가-힣]/.test(text);
  sg.font = hangul ? `700 11px ${KR}` : `700 13px "VT323", monospace`; sg.textAlign = 'center';
  if (arrow === 'up' || arrow === 'down') { sg.beginPath(); if (arrow === 'up') { sg.moveTo(6, 1); sg.lineTo(11, 7); sg.lineTo(1, 7); } else { sg.moveTo(6, 11); sg.lineTo(11, 5); sg.lineTo(1, 5); } sg.fill(); sg.fillText(text, 26, 7); }
  else sg.fillText(text, cols / 2, 7);
  const d = sg.getImageData(0, 0, cols, rows).data;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const on = d[(y * cols + x) * 4 + 3] > 110;
    g.fillStyle = on ? `rgba(${red},${k})` : 'rgba(70,8,4,0.55)';
    g.beginPath(); g.arc((x + 0.5) * px, (y + 0.5) * py, Math.min(px, py) * (on ? 0.42 : 0.3), 0, TAU); g.fill();
  }
}
function paintSign(g, w, h, floor, world) {
  g.clearRect(0, 0, w, h);
  const other = world === 'other', label = other && floor === 4 ? '4' : LABEL(floor);
  g.fillStyle = other ? (floor === 4 ? 'rgba(140,10,10,0.92)' : 'rgba(30,26,24,0.9)') : 'rgba(40,40,44,0.88)';
  g.font = `900 ${label.length > 1 ? 210 : 250}px ${KR}`; g.textAlign = 'center'; g.fillText(label + (label === 'F' ? '' : 'F'), w / 2, 250);
  g.font = kFont(64, 700); g.fillText(label === 'F' ? 'F층' : `${floor}층`, w / 2, 350);
  if (other) smudge(g, w, h);
}
function paintDecal(g, w, h, floor) {
  g.clearRect(0, 0, w, h);
  const t = TENANTS[floor]; if (!t) return;
  g.fillStyle = 'rgba(240,240,236,0.92)'; g.textAlign = 'center'; g.font = kFont(64, 900); g.fillText(t[0], w / 2, 70); g.font = kFont(28, 400); g.fillText(t[1].toUpperCase(), w / 2, 112);
}
function paintCity(g, w, h, dead) {
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, dead ? '#000' : '#0a0c14'); sky.addColorStop(1, dead ? '#050202' : '#26222a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const bw = rand(30, 90), bh = rand(90, 320), x = rand(-20, w), y = h - bh; g.fillStyle = `rgb(${irand(10, 20)},${irand(10, 20)},${irand(14, 24)})`; g.fillRect(x, y, bw, bh); if (!dead) for (let yy = y + 8; yy < h - 6; yy += 12) for (let xx = x + 5; xx < x + bw - 6; xx += 10) if (Math.random() < 0.28) { g.fillStyle = pick(['rgba(255,220,150,0.8)', 'rgba(200,220,255,0.7)', 'rgba(255,240,200,0.6)']); g.fillRect(xx, yy, 5, 6); } }
  for (let i = 0; i < (dead ? 1 : 6); i++) { const x = dead ? w * 0.7 : rand(40, w - 40), y = rand(40, 170); g.fillStyle = '#ff2a1a'; g.shadowColor = '#ff2a1a'; g.shadowBlur = 14; g.fillRect(x - 2, y - 12, 4, 26); g.fillRect(x - 9, y - 5, 18, 4); g.shadowBlur = 0; }
}
function paintStreet(g, w, h) {
  g.fillStyle = '#07080c'; g.fillRect(0, 0, w, h);
  const signs = [['24시 해장국', '#e8c020'], ['노래방', '#e040c0'], ['PC방', '#20c0e8'], ['약국', '#20c040'], ['인쇄', '#e8e8e8'], ['세탁', '#40a0ff']];
  for (let i = 0; i < 7; i++) {
    const x = i * 150 - 20, bw = rand(120, 150), top = rand(20, 90);
    g.fillStyle = `rgb(${irand(18, 30)},${irand(16, 26)},${irand(16, 24)})`; g.fillRect(x, top, bw, h - top);
    for (let yy = top + 16; yy < h - 120; yy += 34) for (let xx = x + 10; xx < x + bw - 20; xx += 28) if (Math.random() < 0.3) { g.fillStyle = pick(['rgba(255,220,150,0.75)', 'rgba(200,220,255,0.6)']); g.fillRect(xx, yy, 16, 20); }
    const [t, c] = signs[i % signs.length]; g.fillStyle = c; g.shadowColor = c; g.shadowBlur = 18; g.font = kFont(30, 900); g.textAlign = 'center'; g.fillText(t, x + bw / 2, h - 150 + (i % 2) * 40); g.shadowBlur = 0;
    g.fillStyle = 'rgba(120,120,130,0.8)'; for (let k = 0; k < 8; k++) g.fillRect(x + 4, h - 70 + k * 7, bw - 8, 3);   // a rolled-down shutter
    g.fillStyle = 'rgba(235,240,245,0.85)'; g.fillRect(x, h - 76, bw, 4);   // snow on the ledge
  }
}
function paintPortraitTo(g, w, h, kind) {
  g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, w, h);
  const bg = g.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.4, h * 0.7); bg.addColorStop(0, '#b8b4ac'); bg.addColorStop(1, '#6a6660'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.42, s = w / 256;
  const hairC = '#1a1816', skinC = kind === 'man' ? '#a8a098' : '#c8c2ba';
  g.fillStyle = kind === 'girl' ? '#2a3a5a' : kind === 'man' ? '#2a2a2c' : '#4a4a50'; g.beginPath(); g.ellipse(cx, h * 0.98, 118 * s, 96 * s, 0, Math.PI, 0); g.fill();
  if (kind !== 'man') { g.fillStyle = hairC; g.beginPath(); g.ellipse(cx, cy + (kind === 'jy' ? 40 : 0) * s, 70 * s, (kind === 'jy' ? 120 : 80) * s, 0, 0, TAU); g.fill(); }
  g.fillStyle = skinC; g.beginPath(); g.ellipse(cx, cy, 50 * s, 64 * s, 0, 0, TAU); g.fill();
  g.fillStyle = hairC; g.beginPath(); if (kind === 'man') { g.ellipse(cx, cy - 46 * s, 54 * s, 28 * s, 0, Math.PI, 0); } else { g.ellipse(cx, cy - 40 * s, 56 * s, 34 * s, 0, Math.PI * 0.95, Math.PI * 2.05); } g.fill();
  g.fillStyle = 'rgba(30,26,24,0.8)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 19 * s, cy - 2 * s, 7 * s, 4 * s, 0, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(60,40,36,0.7)'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(cx - 14 * s, cy + 32 * s); g.quadraticCurveTo(cx, cy + (kind === 'jy' ? 38 : 34) * s, cx + 14 * s, cy + 32 * s); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 5 * s, cy + 18 * s); g.lineTo(cx + 5 * s, cy + 18 * s); g.fill();
  if (kind === 'girl') { g.fillStyle = '#e8e8ec'; g.beginPath(); g.moveTo(cx - 40 * s, h * 0.8); g.lineTo(cx, h * 0.9); g.lineTo(cx + 40 * s, h * 0.8); g.lineTo(cx, h * 0.84); g.fill(); }
  const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const l = d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11 + (Math.random() - 0.5) * 16; d.data[i] = d.data[i + 1] = d.data[i + 2] = l; } g.putImageData(d, 0, 0);
}
function portraitCanvas(kind) { return canv(256, 340, (g, w, h) => paintPortraitTo(g, w, h, kind)); }
function paintPortrait(kind, w, h, color) { const c = canv(w, h, (g) => { paintPortraitTo(g, w, h, kind); if (color) { const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = Math.min(255, d.data[i] * 1.06 + 6); d.data[i + 2] = d.data[i + 2] * 0.92; } g.putImageData(d, 0, 0); } }); return c.toDataURL('image/jpeg', 0.85); }
function paintPoster(g, w, h, scratched) {
  g.fillStyle = '#f4f2e8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c01810'; g.font = kFont(30, 900); g.textAlign = 'center'; g.fillText('사람을 찾습니다', w / 2, 40);
  const pc = portraitCanvas('jy'); g.drawImage(pc, 58, 56, 140, 186);
  if (scratched) { g.strokeStyle = 'rgba(20,16,14,0.95)'; g.lineWidth = 3; for (let i = 0; i < 90; i++) { g.beginPath(); g.moveTo(rand(70, 186), rand(80, 170)); g.lineTo(rand(70, 186), rand(80, 170)); g.stroke(); } }
  g.fillStyle = '#1a1a1a'; g.font = kFont(22, 900); g.fillText('한지연 (24세)', w / 2, 272); g.font = kFont(13, 400);
  ['2004년 12월 10일 새벽', '청운빌딩에서 실종', '제보: 112'].forEach((t, i) => g.fillText(t, w / 2, 298 + i * 20));
}
function paintMonitor(g, w, h, t) {
  const d = g.createImageData(w, h); for (let i = 0; i < d.data.length; i += 4) { const v = 30 + Math.random() * 70; d.data[i] = v * 0.9; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0);
  g.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  g.fillStyle = '#e8e8e8'; g.font = '14px "VT323", monospace'; g.fillText('CAM 03  LIFT', 6, 14);
}
function paintShadows(g, w, h, rise, bow) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.85)';
  for (let i = 0; i < 7; i++) {
    const x = 40 + i * 72 + (i % 2) * 10, base = h - 10, up = (i % 3 === 1 ? 1.1 : 1) * rise;
    const sit = base - 150 - up * 190, b = Math.sin(bow + i * 0.9) * 10 * (1 - rise);
    g.beginPath(); g.ellipse(x, base - 40 - up * 190, 40, 70 + up * 120, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 4, sit + b, 20, 25, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - 36, sit + 30 + b * 0.3); g.quadraticCurveTo(x, sit + 10, x + 36, sit + 30 + b * 0.3); g.lineTo(x + 40, base - 60 - up * 190); g.lineTo(x - 40, base - 60 - up * 190); g.fill();
  }
}
function paintFace(g, w, h) {
  // her face, the moment you look: grey, wet, one eye wide open between the hair, the jaw hanging too far down
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const cx = w * 0.5, cy = h * 0.5;
  g.save(); g.beginPath(); g.ellipse(cx, cy + 10, w * 0.3, h * 0.36, 0, 0, TAU); g.clip();
  const sk = g.createRadialGradient(cx - 20, cy - 40, 20, cx, cy, h * 0.4); sk.addColorStop(0, '#c4c8c2'); sk.addColorStop(0.45, '#9a9f9a'); sk.addColorStop(0.8, '#5c615e'); sk.addColorStop(1, '#262827'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${irand(40, 90)},${irand(50, 90)},${irand(60, 100)},${rand(0.02, 0.07)})`; g.beginPath(); g.arc(rand(0, w), rand(0, h), rand(2, 14), 0, TAU); g.fill(); }
  // hollow cheeks and temples
  for (const sx of [-1, 1]) { const hc = g.createRadialGradient(cx + sx * 110, cy + 90, 6, cx + sx * 110, cy + 90, 90); hc.addColorStop(0, 'rgba(20,22,24,0.55)'); hc.addColorStop(1, 'rgba(20,22,24,0)'); g.fillStyle = hc; g.fillRect(0, 0, w, h); }
  // veins under the skin
  g.strokeStyle = 'rgba(50,60,100,0.3)'; g.lineWidth = 1.3; for (let i = 0; i < 46; i++) { g.beginPath(); let x = cx + rand(-130, 130), y = rand(160, 620); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rand(-9, 9); y += rand(-12, 12); g.lineTo(x, y); } g.stroke(); }
  // the eyes: deep sockets; the left one wide and bloodshot, a pinprick pupil staring straight out of the picture
  const eyes = [[-62, 1], [64, 0.6]];
  for (const [ox, open] of eyes) {
    const ex = cx + ox, ey = cy - 70;
    const so = g.createRadialGradient(ex, ey, 6, ex, ey, 62); so.addColorStop(0, 'rgba(10,8,10,0.95)'); so.addColorStop(0.5, 'rgba(26,22,26,0.75)'); so.addColorStop(1, 'rgba(40,40,44,0)'); g.fillStyle = so; g.beginPath(); g.ellipse(ex, ey, 64, 46, 0, 0, TAU); g.fill();
    g.fillStyle = '#e4ded2'; g.beginPath(); g.ellipse(ex, ey, 30, 19 * open, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(170,24,24,0.75)'; g.lineWidth = 1.1; for (let k = 0; k < 16; k++) { g.beginPath(); const a = rand(0, TAU); g.moveTo(ex + Math.cos(a) * 29, ey + Math.sin(a) * 18 * open); g.quadraticCurveTo(ex + Math.cos(a) * 20 + rand(-4, 4), ey + Math.sin(a) * 12 * open, ex + Math.cos(a) * rand(9, 14), ey + Math.sin(a) * rand(5, 9) * open); g.stroke(); }
    g.fillStyle = '#3a3634'; g.beginPath(); g.arc(ex + 1, ey + 1, 10 * Math.min(1, open + 0.2), 0, TAU); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(ex + 1, ey + 1, 3.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(ex + 5, ey - 3, 2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(14,10,12,0.95)'; g.lineWidth = 4; g.beginPath(); g.ellipse(ex, ey, 31, 20 * open, 0, Math.PI + 0.1, -0.1); g.stroke();
    g.strokeStyle = 'rgba(140,40,44,0.8)'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(ex, ey + 1, 30, 19 * open, 0, 0.15, Math.PI - 0.15); g.stroke();
  }
  // the nose, barely there; the mouth open and stretched, much too long
  g.fillStyle = 'rgba(30,28,30,0.4)'; g.beginPath(); g.moveTo(cx - 4, cy - 40); g.lineTo(cx - 16, cy + 30); g.lineTo(cx + 12, cy + 34); g.fill();
  for (const sx of [-1, 1]) { g.fillStyle = 'rgba(8,6,8,0.8)'; g.beginPath(); g.ellipse(cx + sx * 9, cy + 30, 5, 3, 0, 0, TAU); g.fill(); }
  const my = cy + 150; const mo = g.createRadialGradient(cx, my, 4, cx, my, 70); mo.addColorStop(0, '#000'); mo.addColorStop(0.75, '#050304'); mo.addColorStop(1, 'rgba(40,20,26,0.95)'); g.fillStyle = mo; g.beginPath(); g.ellipse(cx, my, 30, 74, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(90,70,80,0.9)'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, my, 32, 76, 0, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(40,30,34,0.6)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(cx - 34, my - 50 + k * 18); g.lineTo(cx - 44, my - 46 + k * 18); g.stroke(); g.beginPath(); g.moveTo(cx + 34, my - 50 + k * 18); g.lineTo(cx + 44, my - 46 + k * 18); g.stroke(); }
  // wet highlights on the skin
  g.fillStyle = 'rgba(230,240,245,0.12)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(cx + rand(-120, 120), cy + rand(-200, 200), rand(2, 8), rand(1, 4), rand(0, 3), 0, TAU); g.fill(); }
  g.restore();
  // the hair: two black curtains from the crown, the right one swallowing most of that side; strands stuck across the skin
  const curtain = (pts) => { g.fillStyle = '#050404'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i += 3) g.bezierCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i + 2][0], pts[i + 2][1]); g.closePath(); g.fill(); };
  curtain([[cx - 10, 0], [cx - 40, 120], [cx - 120, 180], [cx - 118, 330], [cx - 116, 480], [cx - 150, 600], [cx - 140, h], [0, h], [0, h], [0, 0]]);
  curtain([[cx + 6, 0], [cx + 20, 140], [cx + 70, 200], [cx + 88, 330], [cx + 100, 460], [cx + 140, 560], [cx + 150, h], [w, h], [w, h], [w, 0]]);
  g.strokeStyle = 'rgba(5,4,4,0.95)';
  for (let i = 0; i < 70; i++) {
    const side = Math.random() < 0.5 ? -1 : 1; let x = cx + side * rand(0, 120), y = rand(0, 60);
    g.lineWidth = rand(1, 4.5); g.beginPath(); g.moveTo(x, y);
    const n = irand(6, 12); for (let k = 0; k < n; k++) { const nx = x + rand(-10, 10) + side * rand(0, 6), ny = y + rand(50, 80); g.quadraticCurveTo(x + rand(-12, 12), (y + ny) / 2, nx, ny); x = nx; y = ny; }
    g.stroke();
  }
  // wet sheen along the hair
  for (let i = 0; i < 120; i++) { const x = rand(0, w), y = rand(0, h); if (Math.abs(x - cx) < 90 && y > 150 && y < 640) continue; g.strokeStyle = `rgba(140,150,160,${rand(0.05, 0.16)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-4, 4), y + rand(40, 120)); g.stroke(); }
  // edges fall off to black
  const vg = g.createRadialGradient(cx, cy, h * 0.3, cx, cy, h * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
// what shows through the parting in her hair: one eye, the edge of a mouth
function paintEye(g, w, h) {
  const sk = g.createLinearGradient(0, 0, w, 0); sk.addColorStop(0, '#6e7272'); sk.addColorStop(0.5, '#b4b8b6'); sk.addColorStop(1, '#6a6e6e'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  const vg = g.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, 'rgba(0,0,0,0.8)'); vg.addColorStop(0.25, 'rgba(0,0,0,0)'); vg.addColorStop(0.85, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(60,70,110,0.3)'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { g.beginPath(); let x = rand(10, w - 10), y = rand(20, h - 20); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rand(-6, 6); y += rand(-8, 8); g.lineTo(x, y); } g.stroke(); }
  const ex = w * 0.52, ey = h * 0.33;
  const so = g.createRadialGradient(ex, ey, 4, ex, ey, 40); so.addColorStop(0, 'rgba(18,14,16,0.95)'); so.addColorStop(0.5, 'rgba(36,30,34,0.75)'); so.addColorStop(1, 'rgba(60,60,64,0)'); g.fillStyle = so; g.beginPath(); g.ellipse(ex, ey, 44, 30, 0, 0, TAU); g.fill();
  g.fillStyle = '#e2ddd4'; g.beginPath(); g.ellipse(ex, ey, 26, 15, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(170,30,30,0.7)'; g.lineWidth = 1; for (let k = 0; k < 12; k++) { g.beginPath(); const a = rand(0, TAU); g.moveTo(ex + Math.cos(a) * 25, ey + Math.sin(a) * 14); g.lineTo(ex + Math.cos(a) * rand(6, 14), ey + Math.sin(a) * rand(3, 8)); g.stroke(); }
  g.fillStyle = '#1a1414'; g.beginPath(); g.arc(ex - 2, ey + 1, 7, 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(ex - 2, ey + 1, 3.2, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(ex + 1, ey - 2, 1.5, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(40,30,32,0.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(ex, ey, 27, 16, 0, Math.PI + 0.2, -0.2); g.stroke();
  const mx = w * 0.42, my = h * 0.86; const mo = g.createRadialGradient(mx, my, 2, mx, my, 30); mo.addColorStop(0, '#000'); mo.addColorStop(0.8, '#080404'); mo.addColorStop(1, 'rgba(50,30,34,0)'); g.fillStyle = mo; g.beginPath(); g.ellipse(mx, my, 22, 34, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(8,7,7,0.95)'; for (let i = 0; i < 16; i++) { g.lineWidth = rand(1, 3); g.beginPath(); let x = rand(0, w), y = 0; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rand(-4, 4); y += h / 8; g.lineTo(x, y); } g.stroke(); }
}
function paintScratch(g, w, h, s) {
  g.clearRect(0, 0, w, h);
  if (s.tally) { g.strokeStyle = 'rgba(235,235,238,0.75)'; g.lineWidth = 2.2; let x = 14, y = 26; for (let n = 0; n < 60; n++) { for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 9 + rand(-1, 1), y); g.lineTo(x + k * 9 + rand(-2, 2), y + 40); g.stroke(); } g.beginPath(); g.moveTo(x - 4, y + 34); g.lineTo(x + 34, y + 6); g.stroke(); x += 50; if (x > w - 50) { x = 14; y += 58; if (y > h - 44) break; } } return; }
  if (s.lipstick) { g.fillStyle = 'rgba(160,20,36,0.85)'; g.font = `${Math.round(h * 0.8)}px ${PEN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s.ko, w / 2, h / 2 + 6); smudge(g, w, h); return; }
  const lines = s.ko.length > 16 ? [s.ko.slice(0, Math.ceil(s.ko.length / 2)), s.ko.slice(Math.ceil(s.ko.length / 2))] : [s.ko];
  const fs = Math.min(h / (lines.length + 0.4), w / Math.max(...lines.map(l => l.length)) * 1.55);
  g.font = `${fs}px ${PEN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => { const y = h / 2 + (i - (lines.length - 1) / 2) * fs * 0.95; g.fillStyle = 'rgba(20,20,22,0.55)'; g.fillText(l, w / 2 + 1.5, y + 1.5); g.fillStyle = 'rgba(240,240,242,0.9)'; g.fillText(l, w / 2, y); });
}

/* ---------------- the panel as a picture (the panel view and the notebook) ---------------- */
// lit: { [printed]: true } lights those rings; hole: whether the gap is showing
function panelSVG(world, capIn, lit, opts = {}) {
  const W = 300, H = 556, other = world === 'other';
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="pnl-svg" role="img" aria-label="The lift's button panel">`;
  s += `<defs><linearGradient id="brsh" x1="0" x2="1"><stop offset="0" stop-color="#9ea2a6"/><stop offset=".5" stop-color="#c8ccd0"/><stop offset="1" stop-color="#8a8e92"/></linearGradient></defs>`;
  s += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="6" fill="url(#brsh)" stroke="#6a6e72"/>`;
  s += `<text x="${W / 2}" y="30" text-anchor="middle" class="pt1">신일엘리베이터</text><text x="${W / 2}" y="46" text-anchor="middle" class="pt2">정원 6인 · 450kg</text>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="2.3" fill="#3a3c3e"/>`;
  PANEL_ROWS.forEach((row, r) => row.forEach((n, c) => {
    const x = 112 + c * 112, y = 86 + r * 64, tf = other ? OW_TRUE[n] : n;
    const gone = other && n === GONE && !capIn;
    // Braille: number sign, then the digits
    const cells = brailleCells(tf), bx = x - 64 - (cells.length - 2) * 11;
    cells.forEach((cell, ci) => cell.forEach(d => { const dc = d <= 3 ? 0 : 1, dr = (d - 1) % 3; s += dot(bx + ci * 13 + dc * 5.5, y - 7 + dr * 7); }));
    if (gone) { s += `<g data-b="hole"><circle cx="${x}" cy="${y}" r="21" fill="#0a0a0a" stroke="#555"/><circle cx="${x - 6}" cy="${y}" r="2.6" fill="#b8903a"/><circle cx="${x + 6}" cy="${y}" r="2.6" fill="#b8903a"/></g>`; return; }
    const on = lit[n];
    const lab = other && n === GONE ? '' : LABEL(n);
    s += `<g data-b="${n}" class="pb"><circle cx="${x}" cy="${y}" r="24" fill="${on ? '#ffb040' : '#5a4a30'}" opacity="${on ? 1 : 0.35}"/><circle cx="${x}" cy="${y}" r="20" fill="#d0d4d8" stroke="#7a7e82" stroke-width="2"/>${other && n === GONE ? `<g stroke="#8a8e92" stroke-width="1.2">${[...Array(9)].map((_, i) => `<line x1="${x - 11}" y1="${y - 10 + i * 2.5}" x2="${x + 11}" y2="${y - 8 + i * 2.2}"/>`).join('')}</g>` : `<text x="${x}" y="${y + 8}" text-anchor="middle" class="pbl">${lab}</text>`}</g>`;
  }));
  const sb = (key, x, y, sym, col) => `<g data-b="${key}" class="pb"><circle cx="${x}" cy="${y}" r="24" fill="${lit[key] ? col : '#5a4a30'}" opacity="${lit[key] ? 1 : 0.35}"/><circle cx="${x}" cy="${y}" r="20" fill="${key === 'bell' ? '#d8b020' : '#d0d4d8'}" stroke="#7a7e82" stroke-width="2"/>${sym}</g>`;
  const y1 = 86 + 5 * 64 + 22, y2 = y1 + 70, xl = 112, xr = 224;
  s += sb('open', xl, y1, `<path d="M${xl - 3} ${y1 - 8} l-9 8 l9 8 z M${xl + 3} ${y1 - 8} l9 8 l-9 8 z" fill="#222"/><rect x="${xl - 1}" y="${y1 - 9}" width="2" height="18" fill="#222"/>`, '#ffb040');
  s += sb('close', xr, y1, `<path d="M${xr - 12} ${y1 - 8} l9 8 l-9 8 z M${xr + 12} ${y1 - 8} l-9 8 l9 8 z" fill="#222"/><rect x="${xr - 1}" y="${y1 - 9}" width="2" height="18" fill="#222"/>`, '#ffb040');
  s += sb('bell', xl, y2, `<path d="M${xl} ${y2 - 11} c-8 1 -7 12 -11 16 h22 c-4 -4 -3 -15 -11 -16z" fill="#222"/><circle cx="${xl}" cy="${y2 + 8}" r="2.5" fill="#222"/>`, '#ffe040');
  s += sb('phone', xr, y2, `<path d="M${xr - 11} ${y2 + 3} q11 -16 22 0" stroke="#222" stroke-width="5" fill="none"/>`, '#40ff80');
  s += `<text x="${xl}" y="${y1 + 36}" text-anchor="middle" class="pt3">열림</text><text x="${xr}" y="${y1 + 36}" text-anchor="middle" class="pt3">닫힘</text><text x="${xl}" y="${y2 + 36}" text-anchor="middle" class="pt3">비상벨</text><text x="${xr}" y="${y2 + 36}" text-anchor="middle" class="pt3">인터폰</text>`;
  return s + '</svg>';
}

/* =====================================================================
   DOORS CLOSING · part E: the doors, the rides, the ritual both ways, the woman you mustn't
   look at, the roof, the scares, sound, the walk out, the ending
   ===================================================================== */
const V = { doorK: 1, doorT: 1, ride: null, disp: '', dispArrow: '', dispK: 1, lightK: 1, dipT: 0, black: 0, power: 1, sheIn: false, lookT: 0, onTop: false, finale: 0,
  envDue: true, moveK: 0, dirT: 45, last: '', stuckT: 0, progKey: '', flick: 0, busy: false, walkLines: 0, idle: 0, strobe: 0, shaftY: 0, topRide: null, tremor: 0, doorHold: false, crowdUp: 0, lunge: null, carLight: 1, land: {} };
const heard = id => { if (!S.heard.includes(id)) { S.heard.push(id); save(); } };
const look = (txt, ms = 5200) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5200) => subtitle('', `<i>${txt}</i>`, ms);
const took = id => S.inv.includes(id);
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }
function wrapA(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
const other = () => S.world === 'other';
const inCar = () => P.z > CAR.z0 - 0.02 && !V.onTop;
const RIT = [4, 2, 6, 2, 10];
function progCount() { const f = S.flags; return [f.pole, f.roofVisited, f.drove, took('cap') || S.capIn, S.capIn, !S.insp && other(), f.final].filter(Boolean).length; }

/* ---------------- voices ---------------- */
function line(id, who, text, opts = {}) { return say(who, text, Object.assign({ clip: 'l_' + id }, opts)); }
function ann(id) { const L = { a_up: 'Going up.', a_down: 'Going down.', a_close: 'Doors closing.', a_open: 'Doors opening.', a_44: 'Forty-fourth floor.', a_more: 'One more passenger has boarded.', a_insp: 'Under inspection.' }; const n = id.slice(2); const text = L[id] || `${['', 'First', 'Second', 'Third', 'F', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'][+n]} floor.`; playClip('l_' + id, { pos: POS.speaker, fx: other() ? 'tube' : null, volume: 0.75, wet: 0.15 }); subtitle('Lift', text, 1800); }

/* ---------------- sound ---------------- */
function sDing(pos = POS.speaker, vol = 0.12, slow = 1) { if (!A.ready) return; const t = now(); [[1318, 0], [1046, 0.42 * slow]].forEach(([f, d]) => [1, 2.76, 5.4].forEach((r, i) => { const o = A.ctx.createOscillator(); o.frequency.value = f * r / (slow > 1 ? 1.06 : 1); const g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(vol * [1, 0.3, 0.1][i], t + d + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.6 * slow * [1, 0.5, 0.25][i]); o.connect(g); route(g, { pos, wet: 0.2 }); o.start(t + d); o.stop(t + d + 2 * slow); })); }
function sBeep(vol = 0.08) { if (!A.ready) return; sTone([1180], 0.07, vol); }
function sDoor(opening, vol = 0.22) {
  if (!A.ready) return; const t = now(), ctx = A.ctx, dur = 1.5;
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(opening ? 70 : 90, t); o.frequency.linearRampToValueAtTime(opening ? 110 : 60, t + dur);
  const lp = filt('lowpass', 420, 1), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.35, t + 0.15); g.gain.linearRampToValueAtTime(vol * 0.3, t + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(g); route(g, { pos: POS.doors, wet: 0.2 }); o.start(t); o.stop(t + dur + 0.05);
  sScrape(POS.doors, dur, vol * 0.25);
  after(dur, () => sThunk(POS.doors, opening ? 0.15 : 0.3, opening ? 260 : 140));
}
function sClack(vol = 0.18) { if (!A.ready) return; sClick(new THREE.Vector3(0, 1.2, CAR.z0 - 0.1), vol, 900 + rand(-100, 100)); sThunk(new THREE.Vector3(0, 1.0, CAR.z0 - 0.1), vol * 0.4, 200); }
function sAlarm(dur = 2.2) { if (!A.ready) return; const t = now(), ctx = A.ctx, out = ctx.createGain(); out.gain.value = 0.16; const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 22; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); const env = ctx.createGain(); env.gain.setValueAtTime(0.5, t); env.gain.setValueAtTime(0.5, t + dur - 0.05); env.gain.linearRampToValueAtTime(0, t + dur); lg.connect(env.gain); [980, 1420, 2100].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = [0.5, 0.3, 0.15][i]; o.connect(g); g.connect(env); o.start(t); o.stop(t + dur + 0.05); }); env.connect(out); route(out, { pos: new THREE.Vector3(0, CAR.h + 0.3, 0), wet: 0.3 }); lfo.start(t); lfo.stop(t + dur + 0.05); }
function sRingback(n = 2) { if (!A.ready) return; for (let i = 0; i < n; i++) sTone([440, 480], 1.0, 0.035, i * 3); }
function sPhoneRing(pos, n = 4) { if (!A.ready) return; for (let i = 0; i < n; i++) for (let k = 0; k < 10; k++) after(i * 2.6 + k * 0.1, () => { const o = A.ctx.createOscillator(); o.type = 'square'; o.frequency.value = k % 2 ? 620 : 780; const g = A.ctx.createGain(); g.gain.setValueAtTime(0.03, now()); g.gain.linearRampToValueAtTime(0.0001, now() + 0.09); const lp = filt('lowpass', 2400, 0.7); o.connect(lp); lp.connect(g); route(g, { pos, wet: 0.5 }); o.start(); o.stop(now() + 0.1); }); }
function sBare(pos, vol = 0.12) { if (!A.ready) return; const t = now(), n = noiseSrc(false), bp = filt('bandpass', 700 + rand(-150, 150), 1.4), g = A.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.35, ref: 0.6 }); n.start(t, Math.random()); n.stop(t + 0.1); after(0.03, () => { if (!A.ready) return; const t2 = now(), n2 = noiseSrc(false), hp = filt('highpass', 2500, 0.7), g2 = A.ctx.createGain(); g2.gain.setValueAtTime(vol * 0.3, t2); g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.06); n2.connect(hp); hp.connect(g2); route(g2, { pos, wet: 0.3 }); n2.start(t2, Math.random()); n2.stop(t2 + 0.07); }); }
function sSlam(pos, vol = 1) { if (!A.ready) return; sKnock(pos, 1.6 * vol, 0, 0); sThunk(pos, 0.9 * vol, 90); const t = now(), n = noiseSrc(false), bp = filt('bandpass', 1900, 3), g = A.ctx.createGain(); g.gain.setValueAtTime(0.4 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.5 }); n.start(t); n.stop(t + 0.85); }
function sWhoosh(dur = 0.9, vol = 0.5) { if (!A.ready) return; const t = now(), n = noiseSrc(false), bp = filt('bandpass', 400, 1.2), g = A.ctx.createGain(); bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(200, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); route(g, { pos: new THREE.Vector3(0.9, TOP + 1.5, 0.25), wet: 0.4 }); n.start(t); n.stop(t + dur + 0.05); }
function sCrash(delay = 1.2, vol = 0.5) { after(delay, () => { sWhump(vol); sThunk(POS.shaftDown, vol, 60); for (let i = 0; i < 6; i++) after(i * 0.08, () => sClick(POS.shaftDown, 0.3, 700 + rand(-300, 300))); }); }
function sWhump(vol = 0.6) { if (!A.ready) return; const t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 180, 0.8), g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); n.connect(lp); lp.connect(g); route(g, { wet: 0.4 }); n.start(t, Math.random()); n.stop(t + 1.3); }
function sCrack(pos, n = 5) { for (let i = 0; i < n; i++) after(i * 0.05 + rand(0, 0.03), () => sClick(pos, 0.25, 1800 + rand(-400, 400))); }
function sScream(pos, vol = 0.35) {
  if (!A.ready) return; const t = now(), ctx = A.ctx, dur = 1.8, out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + 0.08); out.gain.setValueAtTime(vol, t + dur - 0.5); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const src = ctx.createOscillator(); src.type = 'sawtooth'; src.frequency.setValueAtTime(420, t); src.frequency.linearRampToValueAtTime(560, t + 0.4); src.frequency.linearRampToValueAtTime(380, t + dur);
  const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 7; vg.gain.value = 18; vib.connect(vg); vg.connect(src.frequency);
  [[850, 8], [1250, 9], [2800, 10]].forEach(([f, q]) => { const b = filt('bandpass', f, q); src.connect(b); b.connect(out); });
  const n = noiseSrc(false), bp = filt('bandpass', 2500, 1), ng = ctx.createGain(); ng.gain.value = 0.25; n.connect(bp); bp.connect(ng); ng.connect(out);
  route(out, { pos, wet: 0.5 }); src.start(t); src.stop(t + dur + 0.05); vib.start(t); vib.stop(t + dur + 0.05); n.start(t); n.stop(t + dur + 0.05);
}
function playWail() { if (!A.ready || !VOB.l_wail) return; const src = A.ctx.createBufferSource(); src.buffer = VOB.l_wail; const g = A.ctx.createGain(); g.gain.value = 0.85; src.connect(g); route(g, { pos: new THREE.Vector3(-1.8, 1.0, -2.2), wet: 0.5 }); src.start(); V.wailSrc = src; }

/* ---------------- the display ---------------- */
function dispSet(text, arrow = '', k = 1) {
  if (V.disp === text && V.dispArrow === arrow && V.dispK === k) return;
  V.disp = text; V.dispArrow = arrow; V.dispK = k;
  T.dispTex.userData.redraw((g, w, h) => dotMatrix(g, w, h, text, arrow, k));
  T.lantTex.userData.redraw((g, w, h) => { g.fillStyle = '#050505'; g.fillRect(0, 0, w, h); if (arrow) { g.fillStyle = '#ff3a20'; g.beginPath(); if (arrow === 'up') { g.moveTo(64, 6); g.lineTo(84, 32); g.lineTo(44, 32); } else { g.moveTo(64, 34); g.lineTo(84, 8); g.lineTo(44, 8); } g.fill(); } });
}
const floorText = f => LABEL(f);

/* ---------------- dressing a floor (while the doors are shut) ---------------- */
function setFloor(world, floor) {
  S.floor = floor; S.world = world;
  const lobby = floor === 1, ow = world === 'other';
  O.lobby.visible = lobby; O.land.visible = !lobby;
  for (const k in D) D[k].visible = false;
  O.cleaner.visible = O.cart.visible = O.cleanerX.visible = false; O.sheDoor.visible = false;
  O.desks.visible = true; O.office.visible = true; O.hose.visible = true;
  O.offChairs.forEach(c => c.g.rotation.y = c.base);
  O.standers.forEach((p, i) => p.position.x = 2.75 + (i % 3) * 0.55 + (S.ev.stand7 || 0) * -0.08);
  O.crowd.forEach(p => p.userData.neck.rotation.x = 0.55);
  Object.values(COL).forEach(c => c.on = false);
  const LS = V.land = { main: 0, mainC: 0xeef2ff, aux: 0, auxC: 0xeef2ff, auxPos: [-4.3, 2.1, -2.2], aux2: 0, aux2C: 0xffe0b0, aux2Pos: [5.0, 2.3, -2.4], street: 0, exitRed: ow, fog: ow ? 0.09 : 0.02, fogC: ow ? 0x0a0202 : 0x020203, tube: 1 };
  if (lobby) {
    COL.guard.on = COL.plant.on = true;
    O.outside.visible = true; O.cross.visible = true;
    if (!ow) { LS.main = 8; LS.mainC = 0xfff2e0; LS.aux = 5.5; LS.auxC = 0xfff0dc; LS.auxPos = [-1.6, 2.9, -5.4]; LS.aux2 = 3.5; LS.aux2C = 0xfff0dc; LS.aux2Pos = [1.8, 2.9, -6.8]; LS.street = 4; LS.fog = 0.012; }
    else { LS.main = 0.25; LS.mainC = 0xff2a18; LS.aux = 0; LS.aux2 = 0.3; LS.aux2C = 0xff2010; LS.aux2Pos = [0, 2.6, -7.6]; LS.street = 0; }
    O.across.visible = !ow; O.lampGlow.visible = !ow; O.monitor.visible = !ow; O.radio.visible = true;
    O.downs.forEach(d => d.material.emissiveIntensity = ow ? 0 : 1.2);
    T.monTex.userData.redraw((g, w, h) => paintMonitor(g, w, h, 0));
  } else {
    const ten = TENANTS[floor];
    T.signTex.userData.redraw((g, w, h) => paintSign(g, w, h, floor, world));
    T.decalTex.userData.redraw((g, w, h) => paintDecal(g, w, h, floor));
    const vacant = !ten;
    D.vacant.visible = vacant && !(ow && floor === 4); O.desks.visible = !vacant;
    LS.main = vacant ? 1.2 : 3.6; LS.aux = 0.9; LS.auxPos = [-4.3, 2.1, -2.2]; LS.aux2 = vacant ? 0 : 0.25; LS.aux2C = 0xc8d0e0; LS.aux2Pos = [5.0, 2.3, -2.6];
    if (!ow) {
      if (floor === 9) D.poster.visible = true;
      if (floor === 2 && S.rit === 1 && !S.ev.sensors) { LS.main = 0; LS.aux = 0; LS.tube = 0; }
      if (floor === 5) { LS.main = 0; LS.aux = 0; LS.tube = 0; }
      if (floor === 4) { LS.main = 0.35; }
    } else {
      LS.main = 1.6; LS.mainC = 0xff2a1a; LS.aux = 0.7; LS.auxC = 0xff1a10; LS.aux2 = 0.4; LS.aux2C = 0x8a1010; LS.tube = 0;
      if (floor === 2) { if (!S.ev.crowdDone) { D.crowd.visible = true; COL.crowd.on = true; } else D.shoes.visible = true; }
      if (floor === 3) D.smear.visible = true;
      if (floor === 4) { D.funeral.visible = true; O.desks.visible = false; D.vacant.visible = false; O.hose.visible = false; COL.altar.on = COL.offer.on = COL.screen.on = COL.ctable.on = true; LS.main = S.ev.funeralDark ? 0.04 : 0.14; LS.mainC = 0xc8d4ff; LS.tube = S.ev.funeralDark ? 0 : 1; LS.aux = S.ev.funeralDark ? 0 : 0.75; LS.auxC = 0xffa850; LS.auxPos = [0, 1.3, -2.85]; LS.aux2 = S.ev.funeralDark ? 0 : 0.9; LS.aux2C = 0xffb070; LS.aux2Pos = [-2.6, 1.0, -2.2]; LS.fog = 0.14; LS.fogC = 0x030202; O.capOnDish.visible = !took('cap') && !S.capIn; O.candles.forEach(c => c.visible = !S.ev.funeralDark); }
      if (floor === 5) { D.her.visible = true; LS.main = 0.35; LS.mainC = 0xc8d8ff; LS.tube = 1; }
      if (floor === 6) { if (!S.ev.lunge) { O.cleanerX.visible = O.cart.visible = true; O.cleanerX.position.set(-5.9, 0, -2.2); O.cleanerX.rotation.y = -Math.PI / 2; O.cart.position.set(-5.3, 0, -1.9); O.cart.rotation.y = 0.3; } else D.cartOver.visible = true; }
      if (floor === 7) D.standing.visible = true;
      if (floor === 8) { D.sheets.visible = true; O.desks.visible = false; }
      if (floor === 9) { D.posterX.visible = true; LS.aux2 = 0.9; LS.aux2C = 0xffc880; LS.aux2Pos = [4.9, 1.1, -1.5]; }
      if (floor === 10) { D.bag.visible = true; O.pole.visible = !S.flags.pole; O.bag.visible = true; O.offChairs.forEach(c => { c.g.rotation.y = Math.PI / 2 - c.g.parent.rotation.y; }); }
    }
  }
  O.exitFace.material.emissive.set(ow ? 0xff2010 : 0xffffff); O.lobExit.material.emissive.set(ow ? 0xff2010 : 0xffffff);
  O.exitFace.material.color.set(ow ? 0x401010 : 0xffffff); O.lobExit.material.color.set(ow ? 0x401010 : 0xffffff);
  O.city.material.color.set(ow ? 0x200808 : 0x9098a8);
  V.envDue = true; renderer.shadowMap.needsUpdate = true;
}
const COL = {};
function buildColliders() {
  colliders.length = 0;
  const c = (id, x0, x1, z0, z1) => (COL[id] = addCol(id, x0, x1, z0, z1, false));
  c('guard', -3.4, -2.15, -5.55, -3.25); c('plant', 2.3, 2.9, -7.7, -7.1); c('mail', 3.18, 3.4, -4.4, -2.8);
  c('altar', -1.45, 1.45, LAND.z0, LAND.z0 + 1.14); c('offer', -0.72, 0.72, LAND.z0 + 1.2, LAND.z0 + 1.8); c('screen', LAND.x0 + 0.3, LAND.x0 + 0.7, -3.2, -1.2); c('ctable', 1.2, 2.2, -2.08, -1.52);
  c('crowd', -2.4, 2.4, LAND.z0, -1.15);
  c('hatchTop', -0.26, 0.26, -0.21, 0.36);
}
// where the player may stand: a union of rectangles, depending on where they are
function allowedRects(r) {
  const R = [];
  if (V.onTop) { R.push([CAR.x0 + 0.06, CAR.x1 - 0.06, CAR.z0 + 0.02, CAR.z1 - 0.04]); return R; }
  R.push([CAR.x0 + r, CAR.x1 - r, CAR.z0 + r, CAR.z1 - r]);
  if (V.doorK > 0.8 && !V.ride) {
    R.push([DOOR.x0 + 0.06, DOOR.x1 - 0.06, LW - 0.2, CAR.z0 + r + 0.01]);
    if (S.floor === 1) R.push([LOB.x0 + r, LOB.x1 - r, LOB.z0 + 0.22, LW - r]);
    else { R.push([LAND.x0 + r, LAND.x1 - r, LAND.z0 + r, LW - r]); R.push([LAND.x0 - 1.5, LAND.x0 + r + 0.1, CORR.z0 + r, CORR.z1 - r]); }
  }
  return R;
}
function constrainTo(p, r) {
  const R = allowedRects(r); let best = null, bd = 1e9;
  for (const [x0, x1, z0, z1] of R) { if (p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1) return; const cx = clamp(p.x, x0, x1), cz = clamp(p.z, z0, z1), d = (cx - p.x) ** 2 + (cz - p.z) ** 2; if (d < bd) { bd = d; best = [cx, cz]; } }
  if (best) { p.x = best[0]; p.z = best[1]; }
}

/* ---------------- the doors ---------------- */
function doorsTo(open, quiet) {
  const t = open ? 1 : 0; if (V.doorT === t) return;
  V.doorT = t; if (!quiet) sDoor(open);
  if (!open && !quiet && !V.silentClose) ann('a_close');
}
function playerInDoorway() { return P.z < CAR.z0 + 0.22 && Math.abs(P.x) < 0.55; }
function playerOutside() { return P.z < CAR.z0 - 0.05 && !V.onTop; }
function doorsUpdate(dt) {
  // the safety edge: the doors won't shut on you
  if (V.doorT === 0 && V.doorK > 0.05 && (playerInDoorway() || playerOutside()) && !V.forceShut) {
    V.doorHoldT = (V.doorHoldT || 0) + dt;
    if (V.doorK < 0.95 && V.doorHoldT > 0.1) { V.doorT = 1; sDing(POS.doors, 0.05); V.reopened = true; }
  } else V.doorHoldT = 0;
  const sp = V.doorSpeed || 0.75;
  const prev = V.doorK;
  V.doorK = V.doorK < V.doorT ? Math.min(V.doorT, V.doorK + dt * sp) : Math.max(V.doorT, V.doorK - dt * sp);
  if (prev !== V.doorK) {
    const k = smooth(V.doorK);
    O.cdoor.forEach(d => d.position.x = d.userData.base + d.userData.sx * 0.455 * k);
    const ld = S.floor === 1 ? O.lobDoor : O.ldoor; ld.forEach(d => d.position.x = d.userData.base + d.userData.sx * 0.455 * k);
    renderer.shadowMap.needsUpdate = true;
  }
}
const doorsShut = () => V.doorK <= 0.001 && V.doorT === 0;
const doorsOpen = () => V.doorK >= 0.999 && V.doorT === 1;

/* ---------------- the panel ---------------- */
function openPanelUI() {
  if (V.onTop) return;
  if (!S.flags.panelSeen && !other()) { S.flags.panelSeen = true; save(); }
  if (other() && !S.flags.owPanel) { S.flags.owPanel = true; save(); after(0.3, () => sayI('The same panel, the same numbers. Except the 5 is gone. There\'s just a hole where it was.', 5200)); }
  const draw = () => {
    const lit = Object.assign({}, V.lit || {});
    UI.show('box', `<button class="x">Close &middot; Esc</button><h2>Lift buttons</h2><p class="sub">${esc(panelStatus())}</p><div class="lxui">${panelSVG(S.world, S.capIn, lit)}</div><p class="muted" style="font-size:11px;margin:10px 0 0">${G.touch ? 'Tap a button' : 'Click a button · number keys work too (0 is 10, F is F)'}</p>`, { cls: 'ui-card lxpanel-ui',
      onKey: e => { const k = e.key && e.key.toUpperCase(); if (k === 'F') press(4); else if (/^[0-9]$/.test(k)) press(k === '0' ? 10 : +k); } });
    $('#card').querySelectorAll('[data-b]').forEach(b => b.onclick = () => press(b.dataset.b === 'hole' ? 'hole' : isNaN(+b.dataset.b) ? b.dataset.b : +b.dataset.b));
  };
  V.panelDraw = draw; draw();
}
function panelStatus() {
  if (V.ride) return 'The lift is moving.';
  const ds = V.doorT === 1 ? 'Doors open.' : 'Doors shut.';
  return ds + (other() && S.insp ? ' Over the doors: 점검 중.' : '');
}
function refreshPanelUI() { if (UI.kind === 'box' && V.panelDraw && $('#card .lxui')) V.panelDraw(); }
function lightBtn(key, on) {
  V.lit = V.lit || {}; if (on) V.lit[key] = true; else delete V.lit[key];
  const b = typeof key === 'number' ? BTN[key] : BTN[key]; if (b) b.ringM.emissiveIntensity = on ? 2.4 : 0;
  refreshPanelUI();
}
function press(key) {
  if (G.cutscene) return;
  sBeep();
  if (key === 'open') { lightBtn('open', true); after(0.4, () => lightBtn('open', false)); if (V.ride || V.noOpen) { sayI(V.noOpen || 'Not while it\'s moving.', 2600); return; } doorsTo(true); refreshPanelUI(); return; }
  if (key === 'close') { lightBtn('close', true); after(0.4, () => lightBtn('close', false)); if (V.ride && V.ride.phase !== 'wait') return; if (V.ride && V.ride.phase === 'wait') { V.ride.t = 99; return; } if (!playerOutside()) doorsTo(false); if (V.cleanerGo && !V.cleanerIn) S.ev.closedOnCleaner = true; refreshPanelUI(); return; }
  if (key === 'bell') { lightBtn('bell', true); after(2.3, () => lightBtn('bell', false)); sAlarm(); if (other() && !S.ev.bellAnswer) { S.ev.bellAnswer = true; save(); after(4.5, () => { sKnocks(POS.roof, 3, 0.7, 0.9); after(2.6, () => sayI('Three knocks answer the bell. From the roof of the car.', 4200)); G.fearT = 0.5; }); } return; }
  if (key === 'phone') { lightBtn('phone', true); intercom(); return; }
  if (key === 'hole') { if (took('cap')) { fitCap(); } else { flag('holeSeen'); sayI('No button there, just a round hole with two bare brass contacts in it. Beside it, the Braille plate is still there.', 5200); } return; }
  pressFloor(+key);
}
function pressFloor(n) {
  if (V.ride) { sayI('It\'s already moving.', 2000); return; }
  if (V.cleanerIn) { sayI('Not with her standing there. She\'s already pressed 1.', 3000); return; }
  if (V.onTop) return;
  if (other() && n === GONE && !S.capIn) { press('hole'); return; }
  if (other() && S.insp) { lightBtn(n, true); after(0.5, () => lightBtn(n, false)); flag('deadTried'); ann('a_insp'); after(1.4, () => sayI('The button lights, and goes out again. The lift doesn\'t move. Over the doors, the display just says 점검 중: under inspection.', 6000)); return; }
  // the button's back: press 5 and she comes for it
  if (other() && n === GONE && S.capIn && !S.flags.final && S.floor === GONE) { lightBtn(n, true); after(0.6, () => { UI.kind === 'box' && UI.close(); lightBtn(n, false); }); if (V.doorT === 0) doorsTo(true); after(1.6, herFinalBoarding); return; }
  // she is in the car on the first side: only 1 will light
  if (!other() && V.sheIn) { if (n !== 1) { sayI('The button won\'t light. Only one of them will now.', 3200); return; } lightBtn(1, true); flag('pressed1'); after(0.6, () => UI.kind === 'box' && UI.close()); startTransition(); return; }
  const target = other() ? OW_TRUE[n] : n;
  lightBtn(n, true);
  if (other() && V.sheIn && S.flags.final) { if (target === S.floor) { after(0.4, () => lightBtn(n, false)); sayI('This is the floor she got on at. The lift doesn\'t move.', 3000); return; } after(0.6, () => UI.kind === 'box' && UI.close()); if (target === 10) startFinalDown(n); else startLoopUp(n); return; }
  if (target === S.floor) { after(0.4, () => lightBtn(n, false)); if (V.doorT === 0) doorsTo(true); else { sDing(POS.speaker, 0.06); } return; }
  after(0.6, () => UI.kind === 'box' && UI.close());
  startRide(target, n);
}

/* ---------------- a ride ---------------- */
function startRide(to, label, opts = {}) {
  const from = S.floor, dir = Math.sign(to - from) || 1;
  V.ride = Object.assign({ from, to, dir, label, phase: 'wait', t: 0, pos: from, dur: 1.2 + Math.abs(to - from) * 1.05 + 1.1, lastF: from, ghost: other() && !V.sheIn && !S.flags.final && progCount() >= 3 && Math.abs(to - from) >= 2 && Math.random() < 0.5 }, opts);
  V.idle = 0; save();
}
function rideUpdate(dt) {
  const r = V.ride; if (!r) return;
  r.t += dt;
  if (r.phase === 'wait') { if (r.t > (r.waitT ?? 0.9) || !doorsOpen()) { r.phase = 'closing'; r.t = 0; if (playerOutside()) { V.ride = null; lightBtn(r.label, false); return; } doorsTo(false); } return; }
  if (r.phase === 'closing') { if (V.doorT === 1) { r.phase = 'wait'; r.t = 0; r.waitT = 1.2; return; } if (doorsShut() && r.t > 0.2) { r.phase = 'move'; r.t = 0; if (r.onDepart) r.onDepart(); else ann(r.dir > 0 ? 'a_up' : 'a_down'); V.moveK = 0; } return; }
  if (r.phase === 'move') {
    const T0 = r.dur, k = clamp(r.t / T0, 0, 1);
    const e = k < 0.15 ? (k / 0.15) * (k / 0.15) * 0.075 : k > 0.85 ? 1 - ((1 - k) / 0.15) * ((1 - k) / 0.15) * 0.075 : 0.075 + (k - 0.15) / 0.7 * 0.85;
    const pos = lerp(r.from, r.to, e);
    V.moveK = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
    const f = Math.round(pos);
    if (f !== r.lastF) { r.lastF = f; sClack(0.12); if (r.onPass) r.onPass(f); else if (!other()) dispSet(floorText(f), r.dir > 0 ? 'up' : 'down'); }
    if (r.ghost && !r.gIn && k > 0.3) { r.gIn = true; V.black = 0.5; sThunk(POS.under, 0.4, 70); after(0.45, () => { sheIn(true, irand(0, 1)); V.ghostRide = true; }); after(1.6, () => { if (V.ghostRide) { sBreath(new THREE.Vector3(0, 1.55, 0.35), 1, 0.35, true); if (!S.ev.ghostSaid) { S.ev.ghostSaid = true; sayI('The lights blink. When they come back, the car is fuller. Someone is standing behind you.', 4600); } } }); }
    if (!r.custom && k >= 1) { r.phase = 'arrive'; r.t = 0; V.moveK = 0; setFloor(S.world, r.to); arriveFx(r); if (V.ghostRide) { V.ghostRide = false; V.dipT = 0.6; after(0.3, () => sheIn(false)); } }
    if (r.custom) r.custom(dt, k);
    return;
  }
  if (r.phase === 'arrive') { if (r.t > (r.arriveT ?? 1.1)) { r.phase = 'opening'; r.t = 0; if (!r.stayShut) doorsTo(true); } return; }
  if (r.phase === 'opening') { if (r.stayShut || doorsOpen() || r.t > 2.5) { const done = r; V.ride = null; lightBtn(done.label, false); onArrive(done); save(); } }
}
function arriveFx(r) {
  sDing(); G.shake = 0.12;
  if (!other()) { dispSet(floorText(r.to), ''); ann('a_' + r.to); }
  else { dispSet(r.label ? LABEL(r.label) : '--', '', 0.8); ann('a_' + (r.label || r.to)); }
}

/* ---------------- the ritual, and what waits at each floor ---------------- */
function onArrive(r) {
  const f = S.floor;
  if (r.after) { r.after(); return; }
  if (!other()) {
    // the ritual on the first side
    if (S.rit < 5) {
      if (f === RIT[S.rit]) { S.rit++; ritualStep(S.rit); }
      else { if (S.rit > 0) ritualBroken(); S.rit = f === RIT[0] ? 1 : 0; if (S.rit === 1) ritualStep(1); }
    } else if (S.rit === 5) {
      if (f === 5) { herFirstBoarding(); return; }
      ritualBroken(); S.rit = f === RIT[0] ? 1 : 0;
    }
    save(); return;
  }
  // the way back, on the other side: the 5 is back, so she can get on
  if (f === GONE && S.capIn && !S.flags.final) { herFinalBoarding(); return; }
  owTableau(f);
  save();
}
function ritualStep(n) {
  const f = S.floor;
  if (n === 1) { if (!S.ev.f4ring) { S.ev.f4ring = true; after(2.2, () => { sPhoneRing(POS.office, 4); after(3, () => sayI('Somewhere in the dark office behind the FOR LEASE sign, a telephone is ringing.', 5000)); }); } }
  if (n === 2) { if (!S.ev.sensors) { S.ev.sensors = true; V.sensorSeq = 0.01; } }
  if (n === 3) cleanerScene();
  if (n === 4) { V.land.main = 1.5; if (!S.ev.prints) { S.ev.prints = true; D.prints && (D.prints.visible = true); after(1.6, () => sayI('Wet footprints on the terrazzo. Bare feet, small, coming from the corridor. They stop at the edge of the lift.', 5600)); } else if (D.prints) D.prints.visible = true; }
  if (n === 5) { after(2.0, () => { lightBtn(5, true); sBeep(0.05); sayI('The 5 button lights up. You haven\'t touched it.', 4200); G.fearT = 0.25; after(4, () => lightBtn(5, false)); }); }
  V.tension = n;
}
function ritualBroken() { after(1.0, () => { sWhump(0.15); if (!S.ev.brokeSaid) { S.ev.brokeSaid = true; sayI('Something in the air lets go, like a held breath. That wasn\'t the next floor. You\'ll have to start again from F.', 5600); } }); }

/* ---------------- the cleaner at 6 ---------------- */
function cleanerScene() {
  flag('cleanerMet'); V.cleanerGo = true; S.ev.closedOnCleaner = false;
  O.cleaner.visible = O.cart.visible = true; O.cleaner.position.set(-6.0, 0, -2.2); O.cleaner.rotation.y = Math.PI / 2; O.cart.position.set(-5.4, 0, -2.2); O.cart.rotation.y = Math.PI / 2;
  V.land.aux = 1.2; V.land.auxPos = [-5.2, 2.1, -2.2];
  after(0.9, () => { line('c1', 'Cleaner', 'Hold it! Wait for me!', { pos: new THREE.Vector3(-5.6, 1.5, -2.2), volume: 1.1 }); heard('cleaner'); });
  const path = [[-6.0, -2.2], [-3.0, -2.2], [-1.2, -1.6], [0, -1.12]];
  V.cleanerT = 0; V.cleanerPath = path;
}
function cleanerUpdate(dt) {
  if (!V.cleanerGo) return;
  V.cleanerT += dt;
  const sp = 1.15, t = Math.max(0, V.cleanerT - 1.2);
  const segs = V.cleanerPath; let d = t * sp, i = 0;
  for (; i < segs.length - 1; i++) { const l = Math.hypot(segs[i + 1][0] - segs[i][0], segs[i + 1][1] - segs[i][1]); if (d < l) break; d -= l; }
  if (i < segs.length - 1) {
    const a = segs[i], b = segs[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), k = d / l;
    O.cleaner.position.set(lerp(a[0], b[0], k), Math.abs(Math.sin(V.cleanerT * 9)) * 0.02, lerp(a[1], b[1], k)); O.cleaner.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    O.cart.position.set(O.cleaner.position.x + Math.sin(O.cleaner.rotation.y) * 0.6, 0, O.cleaner.position.z + Math.cos(O.cleaner.rotation.y) * 0.6); O.cart.rotation.y = O.cleaner.rotation.y;
    V.cstep = (V.cstep || 0) + dt; if (V.cstep > 0.34) { V.cstep = 0; sStep(0.1); sClick(O.cart.position, 0.08, 600); }
    renderer.shadowMap.needsUpdate = true;
    return;
  }
  // she has reached the doors
  V.cleanerGo = false;
  if (V.doorK < 0.35) { O.cleaner.visible = O.cart.visible = false; flag('cleanerDodged'); after(0.3, () => sKnocks(POS.doors, 2, 0.3, 0.5, 1)); after(1.0, () => sayI('The doors shut in her face. Through the steel, faintly: "Aigo..." Then her cart, squeaking away.', 5000)); return; }
  // she gets in
  V.cleanerIn = true; V.doorT = 1; S.wrong++; save();
  O.cart.visible = false; tween(1.0, k => { O.cleaner.position.set(lerp(0, 0.42, k), 0, lerp(-1.12, -0.38, k)); O.cleaner.rotation.y = lerp(0, Math.PI, k); renderer.shadowMap.needsUpdate = true; }, () => {
    line('c2', 'Cleaner', 'Oh, going up? I\'m going down. Oh well, I\'ll ride along.', { pos: new THREE.Vector3(0.42, 1.5, -0.38) });
    after(3.2, () => { sBeep(); lightBtn(1, true); S.rit = 0; startRide(1, 1, { after: () => {
      line('c3', 'Cleaner', 'Night, then.', { pos: new THREE.Vector3(0.42, 1.5, -0.38) });
      tween(2.0, k => { O.cleaner.position.set(lerp(0.42, -1.4, k), 0, lerp(-0.38, -3.8, k)); O.cleaner.rotation.y = Math.PI - 0.5; renderer.shadowMap.needsUpdate = true; }, () => { O.cleaner.visible = false; V.cleanerIn = false; });
      after(1.6, () => sayI('Someone rode with you. It won\'t work now. You\'ll have to start again from F, alone.', 5600));
    } }); });
  });
}

/* ---------------- her, the first time ---------------- */
function herFirstBoarding() {
  flag('sheBoarded'); V.busy = true; G.cutscene = true; releasePointer();
  V.land.main = 0; V.land.aux = 0;
  const x0 = P.x, z0 = P.z, y0 = G.yaw, p0 = G.pitch;
  tween(1.0, k => { P.x = lerp(x0, 0.4, k); P.z = lerp(z0, -0.3, k); G.yaw = y0 + wrapA(0 - y0) * k; G.pitch = lerp(p0, -0.05, k); });
  after(2.2, () => { V.dipT = 1.2; for (let i = 0; i < 6; i++) after(i * 0.55, () => sBare(new THREE.Vector3(-0.2, 0.05, -3.2 + i * 0.4), 0.08 + i * 0.02)); });
  after(4.0, () => {
    O.sheDoor.visible = true; O.sheDoor.position.set(-0.1, 0, -2.4); O.sheDoor.rotation.y = 0; setNeck(O.sheDoor, 0.28, 0.14); V.power = 0.22; V.flick = 0.6;
    tween(2.2, k => { O.sheDoor.position.set(lerp(-0.1, -0.05, k), 0, lerp(-2.4, -1.0, k)); renderer.shadowMap.needsUpdate = true; if (Math.random() < 0.1) sBare(O.sheDoor.position, 0.1); });
    G.fearT = 0.5; sHeart(8, 0.4, 0.8);
  });
  after(6.4, () => {
    const pts = [[-0.05, -1.0], [-0.3, -0.5], [-0.5, 0.2], [-0.55, 0.45]];
    let t0 = 0; tween(2.4, k => { const i = Math.min(2, Math.floor(k * 3)), kk = k * 3 - i; O.sheDoor.position.set(lerp(pts[i][0], pts[i + 1][0], kk), 0, lerp(pts[i][1], pts[i + 1][1], kk)); O.sheDoor.rotation.y = lerp(0, -Math.PI / 4, k); if (k - t0 > 0.18) { t0 = k; sBare(O.sheDoor.position, 0.1); } renderer.shadowMap.needsUpdate = true; }, () => { O.sheDoor.visible = false; sheIn(true); });
  });
  after(8.4, () => { playClip('l_a_more', { pos: POS.speaker, volume: 0.75 }); subtitle('Lift', 'One more passenger has boarded.', 2600); heard('more'); });
  after(9.6, () => { V.silentClose = true; doorsTo(false); V.silentClose = false; });
  after(10.2, () => { V.power = 1; V.flick = 0.4; });
  after(10.6, () => { G.cutscene = false; V.busy = false; updatePrompt(true); sayI('Someone is standing behind you. Don\'t look at her.', 5200); });
  after(16, () => { if (V.sheIn && !other()) line('w_where', '', '<i>Behind you, a whisper: "Where are you going?"</i>', { fx: 'whisper', pos: new THREE.Vector3(-0.3, 1.55, 0.3), volume: 1.2 }); heard('whisper'); });
}
function sheIn(on, corner = 0) {
  V.sheIn = on; O.she.visible = on; V.lookT = 0; V.noOpen = on && V.finale !== 'walk' ? 'You press it. Nothing happens. The doors stay shut.' : null;
  if (on) { const c = [[-0.55, 0.47, -Math.PI / 4], [0.5, 0.47, Math.PI / 4]][corner]; O.she.position.set(c[0], 0, c[1]); O.she.rotation.y = c[2]; setNeck(O.she, 0.25, 0.18); }
  renderer.shadowMap.needsUpdate = true;
}
// looking at her
function lookUpdate(dt) {
  if (!V.sheIn || G.cutscene || V.scare) { V.lookT = Math.max(0, V.lookT - dt); return; }
  const head = new THREE.Vector3(); O.she.userData.neck.getWorldPosition(head); head.y += 0.1;
  const cp = camera.position, dir = head.clone().sub(cp), dist = dir.length(); dir.normalize();
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const d = fwd.dot(dir);
  const looking = !G.uiOpen && dist < 2.6 && d > (V.finale === 'walk' ? 0.6 : 0.93);
  V.near = clamp((d - 0.3) / 0.6, 0, 1);
  if (looking) V.lookT += dt; else V.lookT = Math.max(0, V.lookT - dt * 0.5);
  if (V.lookT > (V.finale === 'walk' ? 0.25 : 0.45)) lookScare();
}
// her face, right in front of you: it comes a few centimetres closer while you watch, under a failing light
function showFace(dur) {
  O.face.visible = true; O.face.position.set(0.01, -0.015, -0.3); O.face.rotation.set(0, 0, 0.07);
  tween(dur, k => { O.face.position.z = lerp(-0.3, -0.21, k); O.face.rotation.z = 0.07 + k * 0.05; O.faceMat.color.setScalar(Math.random() < 0.18 ? 0.35 : lerp(0.7, 1, k)); }, () => { O.face.visible = false; O.faceMat.color.setScalar(1); }, k => k);
}
function lookScare() {
  V.scare = true; G.cutscene = true; releasePointer(); if (UI.kind) UI.close(true);
  S.wrong++; save();
  O.she.visible = false;
  showFace(0.55);
  G.flash = 0.35; sStinger(1.1); sScream(camera.position.clone().add(new THREE.Vector3(0, 0, -0.3)), 0.28); G.shake = 1.4; G.fearT = 1; G.red = 0.6;
  after(0.12, () => { G.flash = 0; });
  after(0.55, () => { V.black = 2.2; });
  after(1.8, () => sayI('For a moment, in the dark, your hands feel wrong. Too thin. Cold. Not yours.', 5200));
  after(2.8, () => {
    V.scare = false;
    if (V.finale === 'walk') { restartWalk(); return; }
    sheIn(true, V.sheCorner = 1 - (V.sheCorner || 0)); G.cutscene = false; updatePrompt(true); G.lockout = G.time + 4;
  });
}

/* ---------------- over to the other side ---------------- */
function startTransition() {
  flag('transit'); save();
  const rise = { t: 0, f: 5 };
  startRide(10, 1, { dur: 13, onPass: () => {}, custom: (dt, k) => {
    // it goes up. Past 10.
    const f = Math.floor(5 + k * 11);
    if (f !== rise.f) { rise.f = f; sClack(0.14); dispSet(String(f), 'up'); }
    V.dipT = k > 0.45 ? 0.6 : V.dipT; G.fearT = Math.max(G.fearT, k * 0.6);
    if (k > 0.55 && !rise.w) { rise.w = true; line('w_look', '', '<i>Right behind you: "Look at me."</i>', { fx: 'whisper', pos: new THREE.Vector3(-0.1, 1.6, 0.25), volume: 1.3 }); }
    if (k > 0.8 && !rise.drop) { rise.drop = true; drop1(); }
    if (k >= 1 && !rise.done) { rise.done = true; V.ride.phase = 'arrive'; V.ride.t = 0; V.ride.arriveT = 3.5; arriveOther(); }
  }, onDepart: () => ann('a_up'), after: () => { sayI('The doors open by themselves. Out there, the landing is lit red. She isn\'t behind you any more.', 6000); flag('arrived'); after(6, () => { if (!S.flags.deadTried) sayI('It\'s quiet. The lift\'s light is out; only the little emergency lamp is on.', 4500); }); } });
}
function drop1() {
  sWhump(0.9); sCrack(new THREE.Vector3(0, CAR.h + 0.5, 0), 8); G.shake = 2.2; V.black = 1.6; sheIn(false);
  if (A.ready) { setGain(A.loops.move, 0, 0.05); }
  dispSet('--', '', 0.6);
}
function arriveOther() {
  S.world = 'other'; S.insp = true; V.power = 0; setFloor('other', 10);
  after(1.8, () => { sDing(POS.speaker, 0.08, 2.2); dispSet('점검', '', 0.9); });
  save();
}

/* ---------------- the intercom ---------------- */
function intercom() {
  if (V.talking) return; V.talking = true; sRingback(2);
  const n = S.ev.calls = (S.ev.calls || 0) + 1; save();
  const done = () => { V.talking = false; lightBtn('phone', false); };
  after(5.2, () => {
    const pos = POS.speaker;
    if (!other()) {
      if (!S.ev.op1) { S.ev.op1 = true; heard('op1'); line('o_a1', 'Intercom', 'Sinil Elevator emergency centre. Are you trapped?', { fx: 'phone', pos }).then(() => { after(1.4, () => line('o_a2', 'Intercom', 'If you\'re not, please don\'t press this button. Good night.', { fx: 'phone', pos }).then(done)); }); }
      else { sayI('It rings and rings. Nobody picks up this time.', 3600); done(); }
      return;
    }
    const k = (S.ev.owCalls = (S.ev.owCalls || 0) + 1);
    if (k === 1) { heard('op2'); line('o_b1', 'Intercom', 'Sinil Elevator. The Cheongun Building? That\'s strange. On my screen that lift is standing at the first floor with its doors open. There\'s nobody in it.', { fx: 'phone', pos }).then(done); }
    else if (k === 2) { heard('op3'); line('o_b2', 'Intercom', 'What floor are you on? My screen says forty-four. That building only has ten floors.', { fx: 'phone', pos }).then(done); }
    else if (k === 3) { heard('op4'); line('o_b3', 'Intercom', 'Hello? Can you hear me? Who\'s in there with you? I can hear two people breathing.', { fx: 'phone', pos }).then(() => { sBreath(new THREE.Vector3(0.2, 1.6, 0.4), 2, 0.3, true); done(); }); G.fearT = 0.4; }
    else { sayI('The line opens. No voice. Just breathing, very close to the microphone, at the other end.', 4600); sBreath(POS.speaker, 2, 0.3, true); done(); }
  });
}

/* ---------------- the voice memo ---------------- */
function playMemo() {
  if (V.memo) return; V.memo = true; heard('memo');
  const P2 = new THREE.Vector3(0, 1.3, 0), who = 'Ji-yeon (voice memo)';
  const seq = [
    () => line('m1', who, 'It\'s two thirteen. I\'m in the lift at work. On my own.', { fx: 'tape' }),
    () => line('m2', who, 'The Elevator Game. Four, two, six, two, ten. Then five. Then one.', { fx: 'tape' }),
    () => { sBeep(0.03); return wait(1200).then(() => line('m3', who, 'Four... there\'s no four. Well, of course there isn\'t.', { fx: 'tape' })); },
    () => wait(1600).then(() => { sBeep(0.03); return line('m4', who, 'Oh. Found it.', { fx: 'tape' }); }),
    () => wait(1400).then(() => { sDing(P2, 0.03); return wait(900); }).then(() => line('m5', who, 'Ten. Now five.', { fx: 'tape' })),
    () => wait(1800).then(() => line('m6', who, '(whispering) Someone\'s getting on. Don\'t look. Don\'t look.', { fx: 'tape', volume: 1.3 })),
    () => wait(1500).then(() => line('m7', who, 'I pressed one. So why is it going up? Why is it going up?', { fx: 'tape' })),
  ];
  let p = Promise.resolve(); seq.forEach(f => { p = p.then(ok => f()); });
  p.then(() => { sClick(null, 0.2, 1400); V.memo = false; if (!S.flags.memoDone) { flag('memoDone'); after(1.2, () => sayI('The recording ends there. The police say the car was found standing open at the tenth floor. Empty.', 5600)); } });
}

/* ---------------- the roof ---------------- */
function hatchActions() {
  const a = [];
  if (S.hatch === 'latched') {
    if (took('pole')) a.push({ label: 'Push the latch with the pole', run: pushLatch });
    a.push({ label: 'Push the hatch', run: () => { flag('latchSeen'); sThunk(POS.hatch, 0.3, 150); sayI('It lifts a finger\'s width and stops dead. Through the gap at the back edge you can see a steel latch bar, on the top side. It\'s latched from the roof.', 6000); } });
    return a;
  }
  a.push({ label: 'Climb up onto the roof', run: climbUp });
  a.push(look('The hatch stands open. Above it, the dark of the shaft and the hoist ropes going up and up.'));
  return a;
}
function pushLatch() {
  G.cutscene = true; S.hatch = 'open'; drop('pole'); flag('hatchOpen'); save();
  sScrape(POS.hatch, 0.6, 0.18);
  after(0.9, () => { sThunk(POS.hatch, 0.6, 180); sClick(POS.hatch, 0.5, 900); tween(0.8, k => O.hatchPivot.rotation.x = -2.85 * k, () => renderer.shadowMap.needsUpdate = true); O.shaft.visible = true; });
  after(1.0, () => { for (let i = 0; i < 20; i++) after(i * 0.03, () => {}); sayI('You feed the pole up through the gap and shove the latch across. It gives with a clank, and the hatch swings up into the dark. You lean the pole in the corner. Look up: you could pull yourself through.', 6400); });
  after(1.6, () => { O.poleCar.visible = true; G.cutscene = false; updatePrompt(true); });
}
function climbUp() {
  if (V.sheIn) { sayI('Not with her behind you.', 2400); return; }
  G.cutscene = true; releasePointer(); flag('roofVisited');
  if (V.doorT !== 0) { V.silentClose = true; doorsTo(false); V.silentClose = false; }
  shaftAt(S.floor);
  const x0 = P.x, z0 = P.z, p0 = G.pitch;
  tween(0.7, k => { P.x = lerp(x0, 0, k); P.z = lerp(z0, 0.08, k); G.pitch = lerp(p0, 1.0, k); });
  after(0.8, () => { sScrape(POS.hatch, 0.8, 0.12); sStep(0.2); V.onTop = true; O.shaft.visible = true; tween(1.3, k => { G.eyeT = G.eye = lerp(1.62, TOP + 1.1, k); G.pitch = lerp(1.0, 0.1, k); }); });
  after(2.2, () => { const y1 = G.yaw; tween(0.8, k => { P.x = lerp(0, -0.35, k); P.z = lerp(0.08, 0.46, k); G.eyeT = G.eye = lerp(TOP + 1.1, TOP + 1.58, k); G.yaw = y1 + wrapA(-0.76 - y1) * k; G.pitch = lerp(G.pitch, -0.2, k); }); COL.hatchTop.on = true; });
  after(3.1, () => {
    G.cutscene = false; updatePrompt(true); V.envDue = true;
    if (!S.ev.roof1) { S.ev.roof1 = true; save(); sayI('The roof of the car. Greasy steel, the ropes running up into the dark, and a yellow box with UP and DOWN buttons by the corner.', 5600); after(6, () => { if (V.onTop && !S.ev.faller) faller(); }); }
  });
}
function faller() {
  S.ev.faller = true; save();
  sWhoosh(0.9, 0.6); O.faller.visible = true;
  if (!O.faller.children.length) { const p = woman({ h: 0.98 }); p.rotation.set(Math.PI, 0, 0.4); O.faller.add(p); }
  tween(0.75, k => { O.faller.position.y = lerp(TOP + 16, TOP - 16, k); }, () => { O.faller.visible = false; });
  after(0.15, () => { G.fearT = 0.8; G.shake = 0.4; });
  sCrash(1.6, 0.7);
  after(2.6, () => sayI('Something fell past. Right past you, down the gap between the car and the wall. It was the size of a person.', 5600));
}
// under inspection the car is driven from its roof: UP and DOWN on the yellow box, one floor a press
function boxActions() {
  if (!S.insp) return [look('The switch on the box has gone over to NORMAL. You didn\'t touch it.')];
  return [{ label: 'Press DOWN', run: () => drive(-1) }, { label: 'Press UP', run: () => drive(1) }];
}
const markAt = f => f === 4 ? 'a red 4' : `${f}F`;
function shaftAt(fl) {
  V.shaftY = -(fl - 1) * FH; O.shaftMove.position.y = V.shaftY;
  O.cwt.position.y = clamp(-20 + 2 * (10 - fl) * FH, -30, 40);     // the counterweight goes the other way, and passes you on the way
}
function drive(dir) {
  if (V.drive) return;
  const to = S.floor + dir;
  if (to < 1 || to > 10) { sClick(POS.box, 0.4, 900); sayI(dir < 0 ? 'Nothing happens. This is the bottom.' : 'Nothing happens. This is as high as it goes.', 3000); return; }
  sClick(POS.box, 0.5, 1300); sThunk(POS.under, 0.7, 70); G.shake = 0.5;
  V.drive = { t: 0, from: S.floor, to, dur: 3.2 };
  if (A.ready) setGain(A.loops.wind, 0.12, 0.4);
  if (!S.flags.drove && dir < 0) after(0.4, () => sayI('The car jerks under your feet, and creeps down. The shaft wall slides up past you.', 4200));
}
function driveUpdate(dt) {
  const r = V.drive; if (!r) return;
  r.t += dt; const k = clamp(r.t / r.dur, 0, 1), e = smooth(k), fl = lerp(r.from, r.to, e);
  shaftAt(fl);
  V.moveK = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
  // fingers in the gap of the ninth floor's landing doors, the first time you go past
  if (!S.ev.fingers && r.from === 10 && r.to === 9 && k > 0.35) { S.ev.fingers = true; O.fingers.visible = true; O.fingers.position.y = (9 - 1) * FH; sayI('The ninth floor\'s landing doors slide up past you. In the gap between the two halves, fingers. Holding on.', 5200); G.fearT = 0.6; sCrack(new THREE.Vector3(0, TOP + 1.2, -0.8), 4); after(6, () => { O.fingers.visible = false; }); }
  if (!S.ev.cwt && Math.abs(fl - 6.6) < 0.25) { S.ev.cwt = true; sWhoosh(1.2, 0.35); after(0.6, () => sayI('The counterweight slides past behind you, a hand\'s width from the car, going up.', 4200)); }
  if (k >= 1) {
    V.drive = null; V.moveK = 0; sThunk(POS.under, 0.8, 80); G.shake = 0.4; sClack(0.12);
    setFloor('other', r.to); flag('drove'); save();
    if (A.ready) setGain(A.loops.wind, 0.03, 0.4);
    const f = r.to;
    if (f === 4 && !S.ev.at4) { S.ev.at4 = true; V.wail = true; V.wailT = 0.4; after(1.0, () => sayI('Painted on the wall in front of you, in red: 4. Through the landing doors, wailing. Incense. The floor that isn\'t there.', 6400)); G.fearT = 0.7; }
    else after(0.4, () => sayI(`It stops, level with a landing. Painted on the wall in front of you: ${markAt(f)}.`, 3600));
  }
}
function hatchTopActions() { return [{ label: 'Climb back down', run: climbDown }]; }
function climbDown() {
  G.cutscene = true; releasePointer();
  const x0 = P.x, z0 = P.z;
  tween(0.7, k => { P.x = lerp(x0, 0, k); P.z = lerp(z0, 0.08, k); G.pitch = lerp(G.pitch, -1.2, k * 0.5); });
  const grab = !S.ev.grab;
  after(0.8, () => { COL.hatchTop.on = false; sScrape(POS.hatch, 0.6, 0.12); tween(grab ? 0.7 : 1.2, k => { G.eyeT = G.eye = lerp(TOP + 1.58, grab ? TOP + 0.1 : 1.62, k); }); });
  if (grab) {
    S.ev.grab = true; save();
    after(1.3, () => {
      G.flash = 0.2; sStinger(1.0); sScream(new THREE.Vector3(0, 1.0, 0.1), 0.25); G.shake = 2.0; G.red = 0.7; G.fearT = 1;
      tween(0.35, k => { G.eyeT = G.eye = lerp(TOP + 0.1, 0.55, k); G.pitch = lerp(-1.2, 0.3, k); });
      after(0.2, () => { V.black = 2.4; sayI('A cold hand closes round your ankle, and pulls.', 4000); });
    });
    after(1.9, () => { V.onTop = false; O.shaft.visible = S.hatch === 'open'; });
    after(4.6, () => {
      V.power = 0.8; V.flick = 1.5; sClick(POS.ceil, 0.5, 1200);
      tween(1.6, k => { G.eyeT = G.eye = lerp(0.55, 1.62, k); G.pitch = lerp(0.3, 0, k); });
      after(1.0, () => sayI('You\'re on the floor of the car. The lights stutter on. There\'s nobody in here but you.', 5200));
      // the doors open by themselves, on whatever floor the car is standing at
      after(3.2, () => { sDing(); dispSet(S.insp ? '점검' : '--', '', 0.7); after(1.0, () => { doorsTo(true); G.cutscene = false; updatePrompt(true); V.envDue = true; owTableau(S.floor); }); });
    });
  } else {
    after(2.1, () => { V.onTop = false; O.shaft.visible = S.hatch === 'open'; G.cutscene = false; updatePrompt(true); });
    after(2.6, () => { if (!V.onTop && V.doorT === 0 && !V.ride) { sDing(POS.speaker, 0.06); doorsTo(true); owTableau(S.floor); } });
  }
}

/* ---------------- the other side: what the doors open on ---------------- */
function owTableau(f) {
  if (f === 2 && D.crowd.visible) {
    // packed to the doors; then every head comes up at once
    S.ev.crowdDone = true; save();
    after(1.3, () => { sCrack(new THREE.Vector3(0, 1.6, -1.6), 12); sStinger(0.9); G.fearT = 0.9; G.shake = 0.6; tween(0.25, k => O.crowd.forEach(p => p.userData.neck.rotation.x = lerp(0.55, -0.12, k))); });
    after(2.1, () => { V.forceShut = true; V.doorSpeed = 2.2; V.silentClose = true; doorsTo(false); V.silentClose = false; after(0.7, () => { V.forceShut = false; V.doorSpeed = 0.75; if (P.z < CAR.z0) { P.z = CAR.z0 + 0.2; } }); });
    after(3.6, () => { sayI('A crowd, packed right up to the doors, heads bowed. Then every head came up at once.', 5000); D.crowd.visible = false; COL.crowd.on = false; });
    return;
  }
  if (f === 2 && D.shoes.visible && !S.ev.shoes) { S.ev.shoes = true; after(1.2, () => sayI('Shoes. Dozens of pairs, set out in neat rows across the landing, all pointing at the lift. As if their owners had stepped out of them to get in.', 6400)); }
  if (f === 6 && !S.ev.lunge) { lungeScene(); return; }
  if (f === 6 && S.ev.lunge && !S.ev.cartSaid) { S.ev.cartSaid = true; after(1.2, () => sayI('The cleaner\'s cart lies on its side. One wheel is still turning, squeaking.', 4200)); }
  if (f === 4) funeralArrive();
  if (f === 5 && !S.flags.final) { after(1.4, () => sayI('Her floor. Water on the terrazzo, and long black hairs drifting in it. Lipstick on the wall. Nobody here. Not yet.', 5800)); }
  if (f === 7) { S.ev.stand7 = (S.ev.stand7 || 0) + 1; if (S.ev.stand7 === 1) after(1.2, () => sayI('Behind the glass doors, the office is full of people. Standing. Facing the glass. Not moving.', 5000)); }
  if (f === 8 && !S.ev.s8) { S.ev.s8 = true; after(1.2, () => sayI('Dust sheets over everything in the office. And one tall sheet standing by the glass, with a head under it.', 5000)); }
  if (f === 9 && !S.ev.s9) { S.ev.s9 = true; after(1.2, () => sayI('Mirae Design. Her office. One desk lamp is on in there. On the wall by the lift, the poster about her, with her face scratched out.', 6000)); }
  if (f === 1 && !S.ev.s1) { S.ev.s1 = true; after(1.4, () => sayI('The lobby. But dark, and dead. Outside the glass the snow isn\'t falling: it hangs in the air, not moving. There\'s no street. Far off, one red cross.', 7000)); }
  if (f === 3 && !S.ev.s3) { S.ev.s3 = true; after(1.2, () => sayI('A handprint on the office\'s glass door, dragged all the way down to the floor.', 4200)); }
  if (f === 10 && !S.ev.s10b && S.flags.arrived) { S.ev.s10b = true; }
}
function lungeScene() {
  S.ev.lunge = true; save();
  V.lunge = { t: 0 };
  after(0.8, () => sayI('At the far end of the corridor, the cleaner. Standing with her face to the wall.', 4000));
}
function lungeUpdate(dt) {
  const L2 = V.lunge; if (!L2) return; L2.t += dt;
  const c = O.cleanerX;
  if (L2.t > 2.6 && !L2.turn) { L2.turn = true; sCrack(c.position.clone().setY(1.5), 6); tween(0.18, k => c.rotation.y = lerp(-Math.PI / 2, Math.PI / 2, k)); }
  if (L2.t > 3.0) {
    if (!L2.run) { L2.run = true; sStinger(0.8); G.fearT = 1; sScream(c.position.clone().setY(1.5), 0.3); }
    const sp = 4.6, p = c.position, tx = 0, tz = -1.1, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 0.1) { p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; c.rotation.y = Math.atan2(dx, dz); L2.st = (L2.st || 0) + dt; if (L2.st > 0.14) { L2.st = 0; sStep(0.3); } }
    renderer.shadowMap.needsUpdate = true;
    if (!L2.shut && d < 3.2) { L2.shut = true; if (!playerOutside()) { V.forceShut = true; V.doorSpeed = 2.6; V.silentClose = true; doorsTo(false); V.silentClose = false; } }
    if (d < 0.35 || (L2.t > 6)) {
      V.lunge = null; V.forceShut = false; V.doorSpeed = 0.75;
      if (playerOutside()) { jumpAt(); return; }
      c.visible = false; O.cart.visible = false;
      sSlam(POS.doors, 1.2); after(0.25, () => sSlam(POS.doors, 1.0)); after(0.5, () => sSlam(POS.doors, 0.8)); G.shake = 1.2;
      after(1.4, () => sayI('Something hits the doors from outside, hard, three times. Then nothing.', 4600));
    }
  }
}
function jumpAt() {
  G.cutscene = true; O.cleanerX.visible = false; O.cart.visible = false;
  showFace(0.4); G.flash = 0.3; sStinger(1.1); G.shake = 1.5; S.wrong++; save();
  after(0.4, () => { V.black = 2.0; });
  after(1.6, () => { P.x = 0.2; P.z = 0.1; G.yaw = 0; G.pitch = 0; V.forceShut = true; V.doorK = 0; V.doorT = 0; doorsUpdate(0); V.forceShut = false; });
  after(2.4, () => { G.cutscene = false; sayI('You\'re back in the car. You don\'t remember getting there. The doors are shut.', 4600); });
}

/* ---------------- the funeral ---------------- */
function funeralArrive() {
  if (S.ev.funeralDark) { after(1.2, () => { if (!S.ev.fd2) { S.ev.fd2 = true; sayI('The funeral, dark now. The candles out. Behind the paper screen the shadows are still standing.', 5000); } }); return; }
  V.wail = true; V.wailT = 0.5; V.shadowRise = 0;
  if (!S.ev.funeral1) { S.ev.funeral1 = true; save(); after(1.6, () => sayI('The floor that isn\'t there. A funeral: white chrysanthemums banked on an altar, candles, portraits with black ribbons. Behind a paper screen, mourners are wailing.', 7200)); }
}
function takeCap() {
  give('cap'); O.capOnDish.visible = false; flag('capTaken'); save();
  after(0.6, () => { V.wail = false; if (V.wailSrc) { try { V.wailSrc.stop(); } catch (e) {} V.wailSrc = null; } sayI('The button. You take it off the dish, and the wailing stops. All at once.', 4800); });
  after(3.0, () => { V.shadowRise = 0.001; sCreak(new THREE.Vector3(-2, 0.5, -2.2), 1.6, 0.18, 70); });
  after(6.0, () => { O.candles.forEach((c, i) => after(i * 0.7, () => { c.visible = false; sClick(c.getWorldPosition(new THREE.Vector3()), 0.1, 600); })); });
  after(7.6, () => { S.ev.funeralDark = true; save(); V.land.aux = 0; V.land.aux2 = 0; V.land.main = 0.06; V.land.tube = 0; sThunk(new THREE.Vector3(0, 2.6, -2.2), 0.5, 120); G.fearT = 0.8; sHeart(10, 0.5, 0.7); });
  after(9.0, () => { sayI('The shadows behind the screen are all standing now. The lift doors are closing.', 4600); V.doorT = 0; ann('a_close'); sDoor(false); });
  after(11, () => { line('w_here', '', '<i>Very close, in the dark: "I\'m right here."</i>', { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(0.3, 0, 0.3)), volume: 1.2 }); });
}
function fitCap() {
  drop('cap'); S.capIn = true; save();
  sClick(POS.panel, 0.6, 1600); sThunk(POS.panel, 0.3, 300);
  O.hole.visible = false; BTN[GONE].g.visible = true; BTN[GONE].face.material.map = T.btnLabels.capX; BTN[GONE].face.material.needsUpdate = true;
  refreshPanelUI(); sayI('You press the button back into the hole. It clicks home. Its ring flickers, once.', 4600);
  lightBtn(GONE, true); after(0.4, () => lightBtn(GONE, false));
  if (S.insp) {
    // footsteps cross the roof, and the inspection switch goes over
    after(2.4, () => { for (let i = 0; i < 4; i++) after(i * 0.6, () => sKnock(new THREE.Vector3(lerp(-0.4, 0.5, i / 3), CAR.h + 0.4, lerp(0.3, -0.5, i / 3)), 0.5, 0, 1)); G.fearT = Math.max(G.fearT, 0.6); });
    after(5.0, () => { sThunk(POS.roof, 0.7, 260); sClick(POS.roof, 0.5, 1300); O.boxToggle.rotation.x = -0.5; S.insp = false; flag('normal'); save(); V.power = 0.8; V.flick = 0.6; dispSet('--', '', 0.85); refreshPanelUI(); });
    after(6.2, () => sayI('Footsteps crossed the roof over your head. Then a clunk: the inspection switch. The lights come up, and the panel\'s rings glow.', 6400));
  }
}

/* ---------------- her, the second time; the way back ---------------- */
function herFinalBoarding() {
  flag('final'); save(); G.cutscene = true; releasePointer();
  O.sheDoor.visible = true; O.sheDoor.position.set(0, 0, -1.02); O.sheDoor.rotation.y = 0; setNeck(O.sheDoor, 0.3, 0.1);
  G.fearT = 1; sStinger(0.7); G.shake = 0.5; V.dipT = 0.8; V.power = 0.25;
  const x0 = P.x, z0 = P.z, y0 = G.yaw;
  after(0.2, () => sayI('She is standing in the doorway. Right there. Close enough to touch.', 3400));
  after(1.8, () => tween(0.8, k => { P.x = lerp(x0, 0.42, k); P.z = lerp(z0, -0.3, k); G.yaw = y0 + wrapA(0 - y0) * k; G.pitch = lerp(G.pitch, -0.05, k); }));
  after(2.8, () => { const pts = [[0, -1.02], [-0.3, -0.5], [-0.5, 0.2], [-0.55, 0.45]]; tween(2.2, k => { const i = Math.min(2, Math.floor(k * 3)), kk = k * 3 - i; O.sheDoor.position.set(lerp(pts[i][0], pts[i + 1][0], kk), 0, lerp(pts[i][1], pts[i + 1][1], kk)); O.sheDoor.rotation.y = lerp(0, -Math.PI / 4, k); renderer.shadowMap.needsUpdate = true; }, () => { O.sheDoor.visible = false; sheIn(true); }); });
  after(5.2, () => { playClip('l_a_more', { pos: POS.speaker, volume: 0.75, fx: 'tube' }); subtitle('Lift', 'One more passenger has boarded.', 2600); });
  after(6.2, () => { V.silentClose = true; doorsTo(false); V.silentClose = false; V.power = 0.8; V.flick = 0.5; });
  after(7.4, () => { G.cutscene = false; updatePrompt(true); sayI('She\'s behind you again. Don\'t look. Now: the way back.', 4600); });
}
function startLoopUp(n) {
  flag('looped');
  const rise = { f: 5 };
  startRide(5, n, { dur: 11, onPass: () => {}, custom: (dt, k) => {
    const f = Math.floor(5 + Math.pow(k, 1.6) * 39);
    if (f !== rise.f) { rise.f = f; sClack(0.1); dispSet(String(f), 'up'); }
    V.strobe = k > 0.35 ? 1 : 0; G.fearT = Math.max(G.fearT, k * 0.7);
    if (k > 0.5 && !rise.w) { rise.w = true; line('w_look', '', '<i>"Look at me."</i>', { fx: 'whisper', pos: new THREE.Vector3(-0.1, 1.6, 0.25), volume: 1.3 }); }
    if (k > 0.85 && !rise.a) { rise.a = true; ann('a_44'); }
    if (k >= 1 && !rise.done) { rise.done = true; V.strobe = 0; drop1(); sheIn(true); S.wrong++; V.ride.phase = 'arrive'; V.ride.t = 0; V.ride.arriveT = 3.2; after(1.8, () => { setFloor('other', 5); dispSet('--', '', 0.7); }); }
  }, onDepart: () => ann('a_up'), after: () => { sayI('Up, like the first time. Up past 10, up to 44. Then the drop, and the dark. You\'re back at the fifth floor, and she\'s still behind you.', 6400); S.rit2 = 5; save(); } });
}
function startFinalDown(n) {
  flag('downward'); save();
  let lastF = 5;
  startRide(1, n, { dur: 12, onPass: () => {}, custom: (dt, k) => {
    const f = Math.max(1, 5 - Math.floor(k * 4.99));
    if (f !== lastF) { lastF = f; sClack(0.12); dispSet(floorText(f), 'down'); }
    V.power = lerp(0.8, 1, k); V.warmth = k;
    if (k > 0.12 && !V.fc1) { V.fc1 = true; heard('op5'); line('o_c1', 'Intercom', 'It\'s coming down now. The camera\'s back on. But... are there two of you? There\'s someone else standing there. Who is it?', { fx: 'phone', pos: POS.speaker }); }
    if (k > 0.62 && !V.fc2) { V.fc2 = true; O.hand.visible = true; O.hand.position.set(0.24, -0.2, -0.1); tween(1.6, kk => O.hand.position.set(lerp(0.24, 0.16, kk), lerp(-0.2, -0.06, kk), lerp(-0.1, -0.12, kk))); G.fearT = 0.8; sBreath(camera.position.clone().add(new THREE.Vector3(0.1, 0.05, 0.3)), 2, 0.4, true); after(0.6, () => sayI('A hand settles on your shoulder. Cold through your coat. Light, as if it were asking.', 5200)); }
    if (k >= 1 && !V.fc3) { V.fc3 = true; V.ride.phase = 'arrive'; V.ride.t = 0; V.ride.arriveT = 1.6; S.world = 'real'; setFloor('real', 1); sDing(); dispSet('1', ''); playClip('l_a_1', { pos: POS.speaker, volume: 0.8 }); subtitle('Lift', 'First floor.', 1800); }
  }, onDepart: () => { ann('a_down'); sayI('Down. It\'s going down.', 2600); }, after: () => startWalk() });
}

/* ---------------- the walk out ---------------- */
function startWalk() {
  V.finale = 'walk'; V.walkLines = 0; O.hand.visible = false; V.power = 1; V.envDue = true;
  sheIn(true); O.she.visible = true; V.sheFollow = true;
  after(1.0, () => { heard('plea'); line('j_f1', 'Behind you', 'It\'s me. It\'s Ji-yeon.', { pos: behind(0.5), volume: 1.2 }); });
  after(4.5, () => { if (V.finale === 'walk' && V.walkLines < 1) sayI('The lobby. Warm light, snow falling past the glass doors. She\'s right behind you. Walk.', 5200); });
}
function behind(d = 0.5) { const fwd = new THREE.Vector3(-Math.sin(G.yaw), 0, -Math.cos(G.yaw)); return new THREE.Vector3(P.x - fwd.x * d, 1.55, P.z - fwd.z * d); }
function walkUpdate(dt) {
  if (V.finale !== 'walk') return;
  // she keeps close behind you, whichever way you face
  if (V.sheFollow && !V.scare) {
    V.backYaw = V.backYaw ?? G.yaw; V.backYaw += wrapA(G.yaw - V.backYaw) * Math.min(1, dt * 1.2);
    const bx = P.x + Math.sin(V.backYaw) * 0.55, bz = P.z + Math.cos(V.backYaw) * 0.55;
    O.she.position.x = lerp(O.she.position.x, bx, Math.min(1, dt * 3)); O.she.position.z = lerp(O.she.position.z, bz, Math.min(1, dt * 3));
    O.she.rotation.y = Math.atan2(P.x - O.she.position.x, P.z - O.she.position.z); O.she.visible = true;
    renderer.shadowMap.needsUpdate = true;
    if (G.moving) { V.fs = (V.fs || 0) + dt; if (V.fs > 0.5) { V.fs = 0; sBare(O.she.position.clone().setY(0.1), 0.07); } }
  }
  // the lights behind you go out as you go
  const zz = P.z;
  O.downs.forEach(d => { if (d.position.z > zz + 1.2 && d.material.emissiveIntensity > 0) { d.material.emissiveIntensity = 0; sThunk(d.position.clone().setY(3), 0.25, 90); } });
  const lines = [[-2.3, 'j_f2', 'Please. Just look at me once. Just once.'], [-4.0, 'j_f3', 'I looked at her too. And then I was her.'], [-5.6, 'j_f4', 'Look at me. Then I get to go home.'], [-7.2, 'j_f5', 'Please.']];
  for (let i = V.walkLines; i < lines.length; i++) { if (zz < lines[i][0]) { V.walkLines = i + 1; line(lines[i][1], i === 3 ? '' : 'Behind you', i === 3 ? '<i>At your ear, a whisper: "Please."</i>' : lines[i][2], { pos: behind(0.4), volume: 1.25, fx: i === 3 ? 'whisper' : null }); if (i === 2) { after(3.8, () => { if (V.finale === 'walk') sScream(behind(0.6), 0.2); }); } break; } }
  V.land.main = Math.max(0.3, 2.4 * clamp((zz + 7.5) / 6, 0, 1)); V.land.aux = V.land.main * 0.6;
}
function restartWalk() {
  G.cutscene = true; V.black = 1.5;
  P.x = 0.3; P.z = -0.25; G.yaw = 0; G.pitch = 0; V.backYaw = 0; V.walkLines = 1;
  O.downs.forEach(d => d.material.emissiveIntensity = 1.2); V.land.main = 2.4;
  O.she.position.set(0.3, 0, 0.3); O.she.visible = true;
  after(1.4, () => { G.cutscene = false; updatePrompt(true); sayI('You\'re standing in the lift again, the doors open on the lobby. She is right behind you. Don\'t look.', 5400); });
}
function nearFront() { return V.finale === 'walk' && P.z < LOB.z0 + 0.8 && Math.abs(P.x) < 1.1; }
function pushOut() {
  V.finale = 'out'; G.cutscene = true; releasePointer(); flag('escaped'); save();
  V.sheFollow = false; stopSpeech();
  sCreak(POS.glassDoors, 0.8, 0.2, 120); tween(1.2, k => { O.gdoors[0].rotation.y = -1.2 * k; O.gdoors[1].rotation.y = 1.2 * k; });
  const z0 = P.z;
  after(0.4, () => { if (A.ready) { const t = now(), n = noiseSrc(false), bp = filt('bandpass', 700, 0.4), g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.8); g.gain.linearRampToValueAtTime(0.0001, t + 5); n.connect(bp); bp.connect(g); route(g, { wet: 0.3 }); n.start(t); n.stop(t + 5.1); } });
  after(0.6, () => tween(3.2, k => { P.z = lerp(z0, LOB.z0 - 2.2, k); G.pitch = lerp(G.pitch, 0.15, k); }));
  after(2.2, () => sayI('Cold air, and snow in your face. Behind you, very quietly, the lift doors close.', 5200));
  after(2.6, () => { sDoor(false, 0.1); O.she.visible = false; });
  after(5.0, () => { G.blackT = 1; });
  after(7.0, showEnd);
}

/* ---------------- the director: the other side is never quiet for long ---------------- */
const EVENTS = [
  { id: 'roofsteps', ok: () => other() && !V.onTop, run: () => { for (let i = 0; i < 5; i++) after(i * 0.7, () => sKnock(new THREE.Vector3(rand(-0.5, 0.5), CAR.h + 0.4, lerp(0.5, -0.5, i / 4)), 0.4, 0, 1)); if (!S.ev.rs) { S.ev.rs = true; after(3.8, () => sayI('Footsteps. On the roof of the car.', 3000)); } } },
  { id: 'bell', ok: () => other() && progCount() >= 2, run: () => { sAlarm(1.4); lightBtn('bell', true); after(1.5, () => lightBtn('bell', false)); if (!S.ev.bellSelf) { S.ev.bellSelf = true; after(1.8, () => sayI('The alarm bell rings. Nobody touched it.', 3000)); } } },
  { id: 'flick', ok: () => true, run: () => { V.dipT = 1.4; sClick(POS.ceil, 0.3, 900); } },
  { id: 'drop', ok: () => other() && !V.ride, run: () => { sThunk(POS.under, 0.9, 60); G.shake = 1.0; V.tremor = 0.6; sCrack(new THREE.Vector3(0, CAR.h + 0.5, 0), 4); } },
  { id: 'ann44', ok: () => other() && progCount() >= 1, run: () => { ann('a_44'); } },
  { id: 'annMore', ok: () => other() && progCount() >= 3 && !V.sheIn, run: () => { playClip('l_a_more', { pos: POS.speaker, volume: 0.7, fx: 'tube' }); subtitle('Lift', 'One more passenger has boarded.', 2600); heard('more'); after(1.2, () => sBreath(new THREE.Vector3(-0.4, 1.5, 0.45), 2, 0.25, true)); } },
  { id: 'tap', ok: () => other() && !V.sheIn, run: () => { for (let i = 0; i < 4; i++) after(i * 0.28, () => sClick(POS.mirror, 0.25, 2400)); } },
  { id: 'doors', ok: () => other() && doorsShut() && !V.ride, run: () => { sKnocks(POS.doors, 3, 0.5, 0.9); } },
  { id: 'whisp', ok: () => other() && progCount() >= 2 && !V.sheIn, run: () => { line('w_here', '', '<i>Behind you, a whisper: "I\'m right here."</i>', { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(Math.sin(G.yaw) * 0.5, 0, Math.cos(G.yaw) * 0.5)), volume: 1.1 }); } },
  { id: 'cross', ok: () => other() && doorsOpen() && S.floor !== 1 && S.floor !== 4, run: () => { const p = O.crosser; if (!p) return false; p.visible = true; p.position.set(-4.4, 0, -2.2); tween(0.9, k => { p.position.z = lerp(-2.6, -1.8, k); }, () => p.visible = false); } },
  { id: 'hum', ok: () => other(), run: () => { sBreath(new THREE.Vector3(0, CAR.h + 1.4, 0.3), 1, 0.2); } },
  { id: 'settle', ok: () => !other(), run: () => { sCreak(new THREE.Vector3(rand(-1, 1), CAR.h + 1, 0), 1.4, 0.08, 80); } },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || V.finale || V.ride || V.drive || V.busy) return;
  V.dirT -= dt; if (V.dirT > 0) return;
  const opts = EVENTS.filter(e => e.id !== V.last && e.ok());
  for (let tr = 0; tr < 4 && opts.length; tr++) { const e = opts.splice(Math.floor(Math.random() * opts.length), 1)[0]; if (e.run() !== false) { V.last = e.id; break; } }
  V.dirT = (other() ? rand(34, 58) : rand(55, 90)) - progCount() * 3;
}

/* ---------------- lights, every frame ---------------- */
function lightsUpdate(dt) {
  V.black = Math.max(0, V.black - dt); V.dipT = Math.max(0, V.dipT - dt); V.flick = Math.max(0, V.flick - dt);
  let k = 1;
  if (V.black > 0) k = 0;
  else {
    if (V.dipT > 0) k *= 0.3 + Math.abs(Math.sin(V.dipT * 23)) * 0.5;
    if (V.flick > 0) k *= Math.random() < 0.4 ? 0.1 : 1;
    if (V.strobe) k *= (Math.sin(G.time * 30) > 0.2 ? 1 : 0.05);
    if (other() && V.power > 0 && Math.random() < 0.004) V.dipT = 0.25;
  }
  V.lightK = lerp(V.lightK, k, Math.min(1, dt * 22));
  const kk = V.lightK, pw = V.onTop ? 0.4 * V.power : V.power;
  const ow = other(), cold = ow ? new THREE.Color(0xe2f0ec) : new THREE.Color(0xf2f6ff);
  L.carA.intensity = (IS_TOUCH ? 4.4 : 2.8) * pw * kk; L.carB.intensity = (IS_TOUCH ? 0 : 2.6) * pw * kk; L.carA.color.copy(cold); L.carB.color.copy(cold);
  M.diffuser.emissiveIntensity = 0.9 * pw * kk; M.tube.emissiveIntensity = 2.4 * pw * kk;
  const em = ow && V.power < 0.5 ? 1 : 0;
  L.emerg.intensity = em * (0.9 + Math.sin(G.time * 3) * 0.05) * (V.black > 0 ? 0.3 : 1); M.amber.emissiveIntensity = em * 2.2;
  O.camLed.material.emissiveIntensity = (Math.sin(G.time * 4) > 0 ? 3 : 0.3);
  // the landing/lobby
  const LS = V.land, lk = S.floor === 1 || !(LS.tube === 0 && LS.main === 0) ? 1 : 1;
  const tf = ow ? (0.85 + Math.sin(G.time * 13) * 0.08 + (Math.random() < 0.02 ? -0.5 : 0)) : 1;
  L.land.intensity = LS.main * tf * (V.black > 0 ? 0 : 1); L.land.color.set(LS.mainC);
  if (S.floor === 1) L.land.position.set(0, 2.9, -2.6); else L.land.position.set(0, 2.55, -2.3);
  L.aux.intensity = LS.aux * (V.black > 0 ? 0 : 1); L.aux.color.set(LS.auxC); L.aux.position.set(...LS.auxPos);
  L.aux2.intensity = LS.aux2 * (V.black > 0 ? 0 : 1); L.aux2.color.set(LS.aux2C); L.aux2.position.set(...LS.aux2Pos);
  L.street.intensity = LS.street;
  O.landDiff.material.emissiveIntensity = (LS.tube ? 1.4 : 0) * (LS.main > 0.2 ? 1 : 0.1) * tf;
  O.corrTube.material = LS.aux > 0.5 && !ow ? M.tube : M.plasticW;
  L.top.intensity = V.onTop || (O.shaft.visible && S.hatch === 'open') ? 1.3 * (0.9 + Math.random() * 0.1) : 0;
  O.workLamp.children[0].material.emissiveIntensity = L.top.intensity * 2;
  // candles
  if (O.candles) O.candles.forEach((c, i) => { c.material.opacity = 0.75 + Math.sin(G.time * 17 + i) * 0.1 + Math.random() * 0.1; });
  if (S.floor === 4 && ow && LS.aux > 0) L.aux.intensity = LS.aux * (0.85 + Math.sin(G.time * 11) * 0.08 + Math.random() * 0.07);
  scene.fog.color.set(LS.fogC); scene.fog.density = lerp(scene.fog.density, V.onTop ? 0.12 : LS.fog, Math.min(1, dt * 2));
  L.hemi.intensity = ow ? 0.03 : 0.06;
}

/* ---------------- sound beds ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.hum) return;
  A.loops.hum = loopNoise({ pos: new THREE.Vector3(0, CAR.h + 0.5, 0), type: 'lowpass', f: 140, q: 0.7, vol: 0.05, brown: true, wet: 0.05, ref: 1 });
  A.loops.move = loopNoise({ pos: POS.under, type: 'lowpass', f: 260, q: 0.8, vol: 0, brown: true, wet: 0.1, ref: 1.5 });
  A.loops.wind = loopNoise({ pos: new THREE.Vector3(0, CAR.h + 2, 0), type: 'bandpass', f: 520, q: 0.5, vol: 0, wet: 0.3, ref: 1.5 });
  A.loops.city = loopNoise({ pos: new THREE.Vector3(0, 1.5, LOB.z0 - 3), type: 'lowpass', f: 380, q: 0.5, vol: 0, brown: true, wet: 0.3, ref: 3 });
  const ctx = A.ctx;
  // the fluorescent tubes' buzz
  const bz = ctx.createGain(); bz.gain.value = 0; [120, 240, 360].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = [0.5, 0.25, 0.1][i]; const bp = filt('bandpass', f * 2, 3); o.connect(bp); bp.connect(g); g.connect(bz); o.start(); }); route(bz, { pos: POS.ceil, wet: 0.05, ref: 0.6 }); A.loops.buzz = { gain: bz };
  // a low drone that thickens on the other side
  const tg = ctx.createGain(); tg.gain.value = 0; [36.7, 55, 58.3, 73.4].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = rand(-8, 8); o.connect(tg); o.start(); }); route(tg, { wet: 0.6 }); A.loops.tension = { gain: tg };
  // the guard's radio, faint, a slow old song through a small speaker
  const rg = ctx.createGain(); rg.gain.value = 0; const rbp = filt('bandpass', 1100, 1.2); rbp.connect(rg); route(rg, { pos: new THREE.Vector3(-2.85, 1.0, -4.05), wet: 0.3, ref: 0.6 }); A.loops.radio = { gain: rg, bp: rbp };
  const notes = [392, 440, 523, 587, 523, 440, 392, 349, 392, 440, 392, 330];
  let ni = 0; const tick = () => { if (!A.ready) return; const t = now(); const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = notes[ni++ % notes.length]; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.4, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g); g.connect(rbp); o.start(t); o.stop(t + 1); pTimeout(tick, 620); }; tick();
  const rn = noiseSrc(true); const rng = ctx.createGain(); rng.gain.value = 0.08; rn.connect(rng); rng.connect(rbp); rn.start();
}
function soundUpdate(dt) {
  if (!A.ready || !A.loops.hum) return;
  const ow = other(), lobby = S.floor === 1;
  setGain(A.loops.move, V.moveK * 0.14 + (V.drive ? 0.08 : 0), 0.2);
  setGain(A.loops.wind, (V.onTop ? 0.05 : 0) + V.moveK * 0.03 + (V.drive ? 0.12 : 0), 0.4);
  setGain(A.loops.buzz, (V.power * V.lightK > 0.3 ? 0.012 : 0) * (V.onTop ? 0.3 : 1), 0.05);
  setGain(A.loops.city, lobby && !ow && doorsOpen() ? 0.05 : 0, 0.5);
  setGain(A.loops.radio, lobby && !ow ? 0.05 : 0, 0.5);
  setGain(A.loops.tension, (ow ? 0.004 + progCount() * 0.0014 : (S.rit || 0) * 0.0009) + (V.sheIn ? 0.006 : 0) + (V.finale === 'walk' ? 0.004 : 0), 2);
  setGain(A.loops.hum, ow && V.power < 0.5 ? 0.015 : 0.05, 0.5);
  // the wailing: a chorus, over and over
  if (V.wail && S.floor === 4 && ow) { V.wailT -= dt; if (V.wailT <= 0) { V.wailT = 7.5 + rand(0, 1.5); playWail(); } }
  // her, close behind: a heartbeat that quickens as you turn toward her
  if (V.sheIn && !G.cutscene) { V.hbT = (V.hbT || 0) - dt; if (V.hbT <= 0) { const r = lerp(1.0, 0.45, V.near || 0); V.hbT = r * 2; sHeart(2, 0.25 + (V.near || 0) * 0.4, r); } }
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  inter('panel', O.panel, { name: 'Lift buttons', reach: 1.8, enabled: () => !V.onTop, actions: () => [{ label: 'Use the buttons', run: openPanelUI }] });
  inter('disp', O.disp, { name: 'Floor display', enabled: () => !V.onTop, actions: () => [look(other() ? (S.insp ? 'Red dots: 점검 중. Under inspection.' : 'Red dots. It says whatever it likes over here.') : `Red dots: ${V.disp || '1'}.`)] });
  O.cdoor.forEach((d, i) => inter('cdoor' + i, d, { name: 'Lift doors', enabled: () => !V.onTop, actions: () => [V.doorT === 0 && !V.ride ? { label: 'Press the open button', run: () => press('open') } : null, look(V.ride ? 'Shut. The car is moving.' : V.doorT === 0 ? 'Brushed steel doors, shut.' : 'Open.')] }));
  inter('hatch', O.hatch, { name: () => S.hatch === 'open' ? 'The open hatch' : 'Hatch in the ceiling', reach: 2.4, enabled: () => !V.onTop, actions: hatchActions }); hitbox('hatch', O.hatch, 0.05);
  // the opening itself, fixed in the ceiling: once the lid swings up onto the roof it is out of reach, but the hole is still there to climb through
  { const hp = O.hatchPivot.position; const hh = box(0.54, 0.08, 0.6, HITMAT, 0, hp.y - 0.06, hp.z + 0.275, O.car); hh.layers.set(2); hh.userData.iid = 'hatch'; hh.userData.hit = true; O.hatchHole = hh; }
  inter('mirror', O.mirror, { name: 'Mirror', enabled: () => !V.onTop, actions: () => [look(other() ? 'Your own face, grey in this light. Written across the glass in lipstick: 보지 마. Don\'t look.' : 'Your own face, tired, in the tube light. Behind you, the doors.')] }); hitbox('mirror', O.mirror, 0.01);
  inter('cert', O.cert, { name: 'Framed certificate', actions: () => [{ label: 'Read it', run: () => openDoc('cert') }] });
  inter('cam', O.cam, { name: 'Camera', reach: 2.6, actions: () => [look(other() ? 'The camera dome. Its little red light blinks. Somebody, somewhere, is watching the car.' : 'The lift\'s camera: the one that filmed her pressing the buttons.')] }); hitbox('cam', O.cam, 0.04);
  inter('emerg', O.emerg, { name: 'Emergency lamp', reach: 2.6, actions: () => [look('A little battery lamp for when the power fails.')] }); hitbox('emerg', O.emerg, 0.03);
  inter('cab', O.cab, { name: 'Service cabinet', actions: () => [look('A small locked cabinet under the buttons. For the engineers. You haven\'t got a key.')] });
  inter('poleCar', O.poleCar, { name: 'Window pole', actions: () => [look('The pole, leaning in the corner where you left it.')] });
  // Ji-yeon's scratches
  O.scr.forEach(({ s, m }) => inter('scr_' + s.id, m, { name: s.lipstick ? 'Lipstick on the mirror' : s.tally ? 'Scratches in the steel' : 'Scratched into the steel', enabled: () => other() && !V.onTop, actions: () => [{ label: 'Read it', run: () => readScratch(s) }] }));
  // the roof
  inter('box', O.box, { name: () => S.insp ? 'Inspection box' : 'Inspection box (NORMAL)', note: () => S.insp ? `In front of you: ${markAt(S.floor)}` : '', enabled: () => V.onTop && !V.drive, actions: boxActions });
  inter('hatchTop', O.hatchTopHit, { name: 'The open hatch', reach: 2.4, enabled: () => V.onTop && !V.drive, actions: hatchTopActions });
  // landings
  inter('callBtn', O.callBtn, { name: 'Call button', actions: () => [{ label: 'Press it', run: () => { sBeep(); O.callRing[0].material.emissiveIntensity = 2; after(0.6, () => O.callRing[0].material.emissiveIntensity = 0); if (V.doorT === 0 && !V.ride && !V.lunge) doorsTo(true); } }] }); hitbox('callBtn', O.callBtn, 0.03);
  inter('gdoor', O.gdoor, { name: () => TENANTS[S.floor] ? `Glass doors: ${TENANTS[S.floor][1]}` : 'Glass doors', actions: () => [{ label: 'Try the doors', run: () => { sThunk(POS.office, 0.3, 140); sayI(other() ? officeLook() : 'Locked. Everybody went home hours ago.', 5200); } }, look(officeLook())] });
  inter('sign', O.sign, { name: 'Painted floor number', actions: () => [look(`Painted big on the wall, facing the lift: ${other() && S.floor === 4 ? '4, in red' : LABEL(S.floor) + (S.floor === 4 ? '' : 'F')}.`)] }); hitbox('sign', O.sign, 0.02);
  inter('hose', O.hose, { name: 'Fire hose cabinet', actions: () => [look('A red steel cabinet: a folded canvas hose and a brass nozzle behind the glass.')] });
  inter('stairs', O.stairDoor, { name: 'Stair door', actions: () => [{ label: 'Try it', run: () => { sThunk(POS.corridor, 0.4, 120); if (other()) { sayI('It won\'t open. Behind it, far below, somebody is coming up the stairs. Slowly. One step at a time.', 5600); for (let i = 0; i < 6; i++) after(1 + i * 0.9, () => sStep(0.06)); } else sayI('Locked from the stairwell side. The guard locks the stairs at night.', 4200); } }] });
  inter('lposter', O.lposter, { name: 'Poster', actions: () => [{ label: 'Read it', run: () => openDoc('poster') }] }); hitbox('lposter', O.lposter, 0.02);
  inter('lposterX', O.lposterX, { name: 'Poster', actions: () => [look('The poster about Ji-yeon. Her face has been scratched out of it, over and over, down to the wall.')] }); hitbox('lposterX', O.lposterX, 0.02);
  inter('pole', O.pole, { name: 'Window pole', enabled: () => !S.flags.pole, actions: () => [{ label: 'Take it', run: () => { give('pole'); flag('pole'); O.pole.visible = false; } }] });
  inter('bag', O.bag, { name: 'Handbag', actions: () => [!took('badge') ? { label: 'Look through it', run: () => { give('badge'); flag('bagSeen'); openDoc('badge'); } } : null, look('Ji-yeon\'s handbag, spilled on the landing: a lipstick with its cap off, her lanyard, a pack of tissues, bus card.')] });
  // the lobby
  inter('dir', O.dir, { name: 'Building directory', actions: () => [{ label: 'Read it', run: () => openDoc('dir') }] });
  inter('poster', O.poster, { name: 'Poster', actions: () => [{ label: 'Read it', run: () => openDoc('poster') }] });
  inter('gdesk', O.guardDesk, { name: 'Guard\'s desk', actions: () => [look(other() ? 'The guard\'s cap is on the desk. The chair is turned to face the lift.' : 'Nobody here: the guard is doing his rounds. A monitor shows the lift camera, grey and grainy. His cap. A flask of barley tea, still warm.')] });
  inter('logbook', O.logbook, { name: 'Security log', actions: () => [{ label: 'Read it', run: () => openDoc('log') }] });
  inter('radio', O.radio, { name: 'Radio', actions: () => [look(other() ? 'The radio\'s dial glows. No sound comes out of it.' : 'The guard\'s radio, playing an old trot song very quietly to nobody.')] });
  inter('front', O.front, { name: 'Glass doors', actions: () => nearFront() ? [{ label: 'Push the door', run: pushOut }] : [{ label: 'Try the doors', run: () => { sThunk(POS.glassDoors, 0.4, 140); sayI(other() ? 'They won\'t move. Outside there is no street, no snow falling. Only the dark, and far away, one red cross.' : 'Locked. The guard locks up at midnight. Anyway, you didn\'t come here to go home.', 6000); } }] });
  inter('clock', O.clock, { name: 'Clock', reach: 3, actions: () => [look(other() ? 'Thirteen minutes past two. The second hand is going backwards.' : 'Twelve minutes past two.')] });
  inter('lobStairs', O.lobStair, { name: 'Stair door', actions: () => [look('Locked for the night.')] });
  // the funeral
  inter('dish', O.dish, { name: 'Offering table', enabled: () => other() && S.floor === 4, actions: () => [O.capOnDish.visible ? { label: 'Take the button from the dish', run: takeCap } : null, look('Fruit, a bowl of rice with a spoon stood upright in it, and a small white dish' + (O.capOnDish.visible ? ' with a lift button lying on it.' : ', empty now.'))] });
  inter('portraits', O.portraits[2], { name: 'Portraits', enabled: () => other() && S.floor === 4, actions: () => [look('Five portraits, black ribbons across their corners. An old man. A schoolgirl. A woman in her forties. Ji-yeon, smiling a little. And an empty frame, with a white card in it: tonight\'s date.', 8000)] });
  inter('guestbook', O.guestBook, { name: 'Condolence table', enabled: () => other() && S.floor === 4, actions: () => [{ label: 'Read the book', run: () => openDoc('guestbook') }, look('A white box for condolence money, and a guest book.')] });
  inter('screen', O.screen, { name: 'Paper screen', enabled: () => other() && S.floor === 4, actions: () => [look(S.ev.funeralDark ? 'The shadows behind the paper are standing now, all of them. Quite still. Facing you.' : 'Paper screens, lit from behind. On them, the shadows of mourners sitting in rows, bowing and bowing, wailing.')] });
}
function officeLook() {
  const f = S.floor, ow = other();
  if (!ow) return TENANTS[f] ? `${TENANTS[f][1]}. Dark desks, chairs pushed in, a green exit light at the back.` : 'An empty office floor. Plastic sheeting, paint tins.';
  return { 2: 'Dark desks.', 3: 'The office is dark. The handprint on the glass is on the inside.', 5: 'Water, dripping somewhere inside.', 6: 'Dark.', 7: 'They stand shoulder to shoulder behind the glass, faces to it, but with no faces. None of them moves.', 8: 'Dust sheets. The tall one by the glass is closer than it was.', 9: 'Her desk, with its lamp on. Her cardigan on the chair.', 10: 'Every chair in the office has been turned to face the lift.' }[f] || 'Dark.';
}
function readScratch(s) {
  if (!S.flags['scr_' + s.id]) { S.flags['scr_' + s.id] = true; if (!S.docs.includes('scratches')) S.docs.push('scratches'); save(); }
  sayI(s.lipstick ? `In lipstick across the mirror: ${s.ko}. "${s.en}"` : s.tally ? s.en : `Scratched into the steel in Korean, in Ji-yeon's handwriting: ${s.ko} "${s.en}"`, 7000);
}
function buildScratches() {
  O.scr = [];
  for (const s of SCR) {
    const [x, y, z, ry, w, h] = s.where;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: T.scratch[s.id], transparent: true, roughness: s.lipstick ? 0.5 : 0.3, metalness: s.lipstick ? 0 : 0.6, depthWrite: false, envMapIntensity: 0.8 }));
    m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 3; m.visible = false; O.car.add(m); O.scr.push({ s, m });
    hitbox('scr_' + s.id, m, 0.01);
  }
  O.hatchTopHit = box(0.5, 0.05, 0.55, HITMAT, 0, TOP + 0.03, 0.075, O.top); O.hatchTopHit.layers.set(2);
  O.poleCar = grp(CAR.x1 - 0.1, 0, CAR.z1 - 0.12, O.car); cyl(0.012, 0.012, 2.2, std({ color: 0xa8aaa8, metalness: 0.8, roughness: 0.35 }), 0, 1.1, 0, O.poleCar, 8); O.poleCar.rotation.z = 0.03; O.poleCar.visible = false; hitbox('poleCar', O.poleCar, 0.05);
  O.crosser = person({ top: 0x101010, legs: 0x101010, hair: 'long', voidFace: true, h: 1.0 }); O.crosser.visible = false; O.crosser.rotation.y = 0; O.land.add(O.crosser);
  O.cleanerX = person({ top: 0x1a2a4a, legs: 0x1a2430, hair: 'perm', hairCol: 0x1a1410, skin: 0x8a8a88, visor: 0xb8b0a0, h: 0.93, voidFace: true, tilt: 0.3 }); O.cleanerX.visible = false; O.cleanerX.userData.keep = true; O.land.add(O.cleanerX);
  // footprints, wet, on the terrazzo at 2
  D.prints = grp(0, 0, 0, O.landDress); D.prints.visible = false;
  const fpM = std({ color: 0x4a4a46, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 14; i++) { const t = i / 13, x = lerp(-2.6, -0.08, t) + (i % 2 ? 0.1 : -0.1), z = lerp(-2.2, -1.0, t * t); const f = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), fpM); f.scale.set(0.8, 2.1, 1); f.rotation.x = -Math.PI / 2; f.rotation.z = -Math.atan2(-0.08 + 2.6, -1.0 + 2.2) + Math.PI / 2; f.position.set(x, 0.004, z); f.userData.noRay = true; D.prints.add(f); }
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  G.flash = Math.max(0, (G.flash || 0) - dt * 2.2);   // a flash is a flash: it never lingers
  doorsUpdate(dt); rideUpdate(dt); driveUpdate(dt); cleanerUpdate(dt); lungeUpdate(dt);
  lightsUpdate(dt); soundUpdate(dt); lookUpdate(dt); walkUpdate(dt);
  // the scratches only exist on the other side
  const ow = other(); O.scr.forEach(({ m }) => m.visible = ow);
  O.brOther.visible = false; O.brReal.visible = true;
  O.hole.visible = ow && !S.capIn; BTN[GONE].g.visible = !ow || S.capIn;
  // the shaft shows through the open hatch, and around you on the roof
  O.shaft.visible = V.onTop || S.hatch === 'open';
  // but never the back of a landing door right in front of the car's own doors: that landing is the real one
  if (O.shaft.visible) { const sy = O.shaftMove.position.y; O.shaftFloors.forEach(g => { g.visible = V.onTop || Math.abs(g.position.y + sy) > 1.2; }); }
  // the car moving: a little sway and hum
  const t = G.time;
  if (V.moveK > 0 || V.tremor > 0) { camera.position.y += (Math.random() - 0.5) * 0.004 * (V.moveK + V.tremor) + Math.sin(t * 13) * 0.002 * V.moveK; camera.rotation.z = Math.sin(t * 7) * 0.002 * V.moveK; camera.updateMatrixWorld(); }
  V.tremor = Math.max(0, V.tremor - dt);
  // the sensors at 2, first time: lights come on one by one toward the lift
  if (V.sensorSeq) { V.sensorSeq += dt; const s = V.sensorSeq; if (s > 1.2 && V.land.aux === 0) { V.land.aux = 0.8; V.land.auxPos = [-6.0, 2.1, -2.2]; sThunk(new THREE.Vector3(-6, 2.2, -2.2), 0.2, 150); } if (s > 2.1 && V.land.auxPos[0] < -5) { V.land.auxPos = [-3.6, 2.1, -2.2]; sThunk(new THREE.Vector3(-3.6, 2.2, -2.2), 0.25, 150); } if (s > 3.0 && V.land.main === 0) { V.land.main = 1.5; V.land.tube = 1; sThunk(new THREE.Vector3(0, 2.6, -2.2), 0.3, 150); V.sensorSeq = 0; after(0.8, () => sayI('The corridor lights come on one after another, as if somebody were walking toward the lift. There\'s nobody there.', 5600)); } }
  // her shadow behind the screen: bowing, then rising
  if (S.floor === 4 && other()) { if (V.shadowRise > 0 && V.shadowRise < 1) V.shadowRise = Math.min(1, V.shadowRise + dt / 3.5); const rise = S.ev.funeralDark ? 1 : (V.shadowRise || 0); T.shadowTex.userData.redraw((g, w, h) => paintShadows(g, w, h, rise, G.time * 2.2)); M.hanji.emissiveIntensity = (S.ev.funeralDark ? 0.05 : 0.55) * (0.9 + Math.random() * 0.1); smokeUpdate(dt); }
  // the dead lobby: snow hangs; the real lobby: it falls
  if (S.floor === 1) { const fall = !other(); O.snow.forEach(s => { if (fall) { s.position.y -= s.userData.v * dt; s.position.x += Math.sin(t * 0.7 + s.userData.ph) * 0.1 * dt; if (s.position.y < 0) s.position.y += 7; } }); if (!other() && Math.random() < 0.2) T.monTex.userData.redraw((g, w, h) => paintMonitor(g, w, h, t)); const m = (2 + 12 / 60) / 12 * TAU, mm = (12 + t / 60) / 60 * TAU; O.cH.rotation.z = -(other() ? (2 + 13 / 60) / 12 * TAU : m); O.cM.rotation.z = -(other() ? (13 - t / 60) / 60 * TAU : mm); }
  // the standing sheet on 8 creeps
  // prompt/look helpers
  const pk = progCount() + ':' + Object.keys(S.flags).length; if (pk !== V.progKey) { V.progKey = pk; V.stuckT = 0; } else V.stuckT += dt;
  director(dt);
  if (V.envDue && !V.ride && V.doorK > 0.95 || (V.envDue && V.onTop)) { V.envNow = true; V.envDue = false; }
}
function smokeUpdate(dt) { if (!O.smoke) return; O.smoke.forEach(p => { p.t += dt / 4; if (p.t > 1) p.t -= 1; const k = p.t; p.s.position.set(Math.sin(k * 5 + p.s.id) * 0.03, 0.34 + k * 0.9, Math.cos(k * 4 + p.s.id) * 0.02); p.s.scale.setScalar(0.04 + k * 0.25); p.s.material.opacity = S.ev.funeralDark ? 0 : Math.sin(k * Math.PI) * 0.14; }); }

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: ['phone', 'printout'], docs: ['rules'], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    world: 'real', floor: 1, rit: 0, rit2: 0, insp: false, hatch: 'latched', capIn: false, ev: {} };
}
function applyState() {
  const f = S.flags;
  V.ride = null; V.drive = null; V.onTop = false; V.finale = 0; V.lunge = null; V.cleanerGo = false; V.cleanerIn = false; V.busy = false; V.scare = false; V.strobe = 0; V.lit = {}; V.memo = false; V.talking = false;
  V.fc1 = V.fc2 = V.fc3 = false; V.sheFollow = false; V.shaftY = 0; O.shaftMove.position.y = 0; O.fingers.visible = false; O.hand.visible = false; O.face.visible = false;
  // a mid-ride save lands you where you were going, doors open
  setFloor(S.world || 'real', S.floor || 1);
  if (S.capIn && S.insp) S.insp = false;
  V.power = other() ? (S.insp ? 0 : 0.8) : 1;
  V.doorK = 1; V.doorT = 1; V.forceShut = false;
  sheIn(false);
  // she is aboard: on the first side (waiting for 1), or on the way back (waiting for the right button)
  if (f.sheBoarded && !other() && !f.transit) { sheIn(true); V.doorK = 0; V.doorT = 0; }
  if (f.transit && !other()) { S.world = 'other'; S.floor = 10; S.insp = true; setFloor('other', 10); V.power = 0; }
  if (f.final && !f.downward && other()) { sheIn(true); V.doorK = 0; V.doorT = 0; S.floor = 5; }
  if (f.downward && !f.escaped) { S.world = 'real'; S.floor = 1; setFloor('real', 1); after(0.5, startWalk); }
  const k = smooth(V.doorK); O.cdoor.forEach(d => d.position.x = d.userData.base + d.userData.sx * 0.455 * k); (S.floor === 1 ? O.lobDoor : O.ldoor).forEach(d => d.position.x = d.userData.base + d.userData.sx * 0.455 * k);
  O.hatchPivot.rotation.x = S.hatch === 'open' ? -2.85 : 0; O.poleCar.visible = S.hatch === 'open';
  O.boxToggle.rotation.x = S.insp ? 0.5 : -0.5;
  if (S.capIn) { BTN[GONE].face.material.map = T.btnLabels.capX; BTN[GONE].face.material.needsUpdate = true; }
  if (S.capIn && S.insp) { S.insp = false; V.power = 0.8; }       // saved in the seconds before the switch went over
  shaftAt(S.floor || 1); O.fingers.visible = false;
  O.gdoors.forEach(d => d.rotation.y = 0);
  dispSet(other() ? (S.insp ? '점검' : '--') : floorText(S.floor), '', other() ? 0.85 : 1);
  if (P.z < CAR.z0 - 0.05 && V.doorK < 0.5) { P.z = 0; P.x = 0; }
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDue = true;
}

/* ---------------- the ending ---------------- */
function showEnd() { finishRoom(endFrame()); }
// the lobby camera, a few seconds later: the lift standing open with her in the corner, the glass doors open on the snow, and you, going
function endFrame(keep) {
  let url = null;
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov };
    setFloor('real', 1); V.doorK = 1; O.cdoor.forEach(d => d.position.x = d.userData.base + d.userData.sx * 0.455); O.lobDoor.forEach(d => d.position.x = d.userData.base + d.userData.sx * 0.455);
    O.she.visible = true; O.she.position.set(-0.6, 0, 0.5); O.she.rotation.y = -Math.PI / 4; setNeck(O.she, 0.28, 0.2);
    O.walker.visible = true; O.face.visible = false; O.hand.visible = false;
    O.gdoors[0].rotation.y = -1.0; O.gdoors[1].rotation.y = 1.0;
    O.downs.forEach(d => d.material.emissiveIntensity = 1.2);
    L.land.intensity = 9; L.land.color.set(0xfff2e0); L.land.position.set(0, 2.9, -2.6); L.aux.intensity = 6; L.aux.position.set(-1.6, 2.9, -5.4); L.aux2.intensity = 5; L.aux2.position.set(1.8, 2.9, -6.8); L.street.intensity = 4;
    L.carA.intensity = 4.5; L.carB.intensity = 4; M.diffuser.emissiveIntensity = 1.2; M.tube.emissiveIntensity = 2.4; L.emerg.intensity = 0;
    scene.fog.density = 0.012; V.black = 0; G.blackT = 0; G.black = 0;
    const pu = post.uniforms; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0;
    cam.fov = 52; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(1.35, 2.75, -4.6); cam.lookAt(-0.25, 1.05, 0.25); cam.updateMatrixWorld(); pu.exposure.value = 1.5;
    // the car's steel needs to see the lit car to look like steel, not a black hole
    { const hide = [O.mirror, O.she, O.walker]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); scene.environment = null; const rt = envFromScene(new THREE.Vector3(0, 1.4, 0)); scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); }
    renderer.shadowMap.needsUpdate = true; render(0.016);
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; g.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // a security camera's frame: grey, soft, noisy, scan lines, a timestamp
    const d = g.getImageData(0, 0, Wd, Ht);
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) {
      const i = (y * Wd + x) * 4; let l = d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11;
      l = Math.pow(l / 255, 0.8) * 255 * 1.05 + 10 + (Math.random() - 0.5) * 26; if (y % 3 === 0) l *= 0.84;
      const dx = x / Wd - 0.5, dy = y / Ht - 0.5, v = 1 - clamp((dx * dx + dy * dy) * 1.6, 0, 1) * 0.45;
      d.data[i] = clamp(l * v * 0.96, 0, 255); d.data[i + 1] = clamp(l * v, 0, 255); d.data[i + 2] = clamp(l * v * 0.98, 0, 255);
    }
    g.putImageData(d, 0, 0);
    g.fillStyle = 'rgba(240,240,240,0.9)'; g.font = '20px "VT323", monospace'; g.fillText('CAM 03  1F LOBBY', 14, 26); g.fillText('2004/12/17  02:31:48', Wd - 200, Ht - 14); g.fillStyle = '#e0433a'; g.fillText('● REC', Wd - 72, 26);
    url = c.toDataURL('image/jpeg', 0.86); if (keep) return url; pu.exposure.value = 1.05;
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.updateProjectionMatrix(); updateProj(); O.walker.visible = false;
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- title: a lift display climbing past the top floor ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const Wd = 480, Ht = 270;
  g.fillStyle = '#050506'; g.fillRect(0, 0, Wd, Ht);
  // brushed steel doors, a crack of red light between them
  const gap = 3 + Math.max(0, Math.sin(t * 0.37)) * 10;
  for (const s of [-1, 1]) { const x0 = s < 0 ? 110 : Wd / 2 + gap / 2, w = Wd / 2 - 110 - gap / 2; const gr = g.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, '#1a1c1e'); gr.addColorStop(0.5, '#2c2f32'); gr.addColorStop(1, '#16181a'); g.fillStyle = gr; g.fillRect(x0, 60, w, Ht - 60); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(x0 + Math.random() * w, 60, 1, Ht - 60); } }
  const lg = g.createLinearGradient(Wd / 2 - 30, 0, Wd / 2 + 30, 0); lg.addColorStop(0, 'rgba(255,30,20,0)'); lg.addColorStop(0.5, 'rgba(255,40,24,0.55)'); lg.addColorStop(1, 'rgba(255,30,20,0)'); g.fillStyle = lg; g.fillRect(Wd / 2 - 30, 60, 60, Ht - 60);
  g.fillStyle = 'rgba(255,60,40,0.9)'; g.fillRect(Wd / 2 - gap / 2, 60, gap, Ht - 60);
  // something pale in the gap, now and then
  if (Math.sin(t * 0.37) > 0.8) { g.fillStyle = 'rgba(210,205,200,0.45)'; g.fillRect(Wd / 2 - 1.5, 140, 3, 26); }
  g.fillStyle = '#0a0a0b'; g.fillRect(96, 40, Wd - 192, 22);
  // the display over the doors
  const n = Math.floor(t * 1.4) % 60, f = n < 45 ? Math.min(44, 1 + Math.floor(n * 1.0)) : 44;
  const dm = dotMatrix.title || (dotMatrix.title = document.createElement('canvas')); dm.width = 160; dm.height = 52; const dg = dm.getContext('2d');
  dotMatrix(dg, 160, 52, String(f), 'up', 1);
  g.drawImage(dm, Wd / 2 - 80, 4, 160, 52);
}

/* ---------------- build ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x020203, 0.02);
  camera.far = 90; camera.near = 0.02; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.05, ao: 0.8, aoRad: 0.22, bloom: 0.55, bloomThr: 1.3, vig: 0.62, grain: 0.03, sat: 0.9 });
  makeTextures(); paintThings(); makeMaterials();
  buildCar(); buildShaft(); buildCarTop(); buildLanding(); buildLobby(); buildHer(); buildCleaner(); buildDressings(); buildScratches(); buildLights(); buildColliders();
  scene.traverse(o => { if (o.isMesh) { o.receiveShadow = true; if (o.material && (o.material.transparent || o.material === M.diffuser || o.material === M.ceilTile || o.material === M.terrazzo || o.material === M.granite || o.material === M.carpet)) o.castShadow = false; } });
  O.outside.traverse(o => { if (o.isMesh) o.castShadow = false; }); O.shaft.traverse(o => { if (o.isMesh) o.castShadow = false; });
}

/* ---------------- the room module ---------------- */
return {
  id: 'lift', title: 'Doors Closing', saveKey: 'lethe.roomlift.v2',
  DOCS, ITEMS, HEARD, HINTS, openDoc,
  inspectItem(id, back) {
    if (id !== 'phone') return inspectItem(id, back);
    UI.show('item', `<button class="x">${back ? 'Back' : 'Close'} &middot; Esc</button><h2>${esc(ITEMS.phone.name)}</h2><p style="font-size:14px;line-height:1.65;margin:0 0 16px">${ITEMS.phone.desc}</p><button class="btn primary" id="memoPlay">Play the voice memo</button>`, { closeOnE: true, onClose: back === 'notebook' ? () => { if (G.mode === 'play') openNotebook(); } : null });
    $('#memoPlay').onclick = () => { UI.close(true); playMemo(); resumeLook(); };
  },
  titleFx,
  penalty() { G.lockout = G.time + 4; V.dipT = 1.2; },
  markSkip: ['start', 'she'], markMerge: {},
  backText: 'Back in the lift.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other actions', 'R T or right-click'], ['Run', 'Shift'], ['Notebook', 'Tab'], ['Hints', 'H']],
  constrain(p, r) { constrainTo(p, r); },
  actOverride(i) { if (nearFront() && i === 0 && G.hover && G.hover.id === 'front') return false; return false; },
  promptOverride() { return ''; },
  touchExtras() { return took('phone') && !V.memo && !V.finale ? [{ label: 'Play her voice memo', run: playMemo }] : []; },
  invHidden: id => id === 'printout',
  update: roomUpdate,
  preRender() {
    if (V.envNow) { V.envNow = false; const hide = [O.mirror, O.face, O.hand]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); const old = scene.environment; scene.environment = null; const rt = envFromScene(new THREE.Vector3(0, V.onTop ? TOP + 1.2 : 1.4, 0.0)); scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); }
    if (!V.onTop) O.mirror.userData.update();
  },
  build() {
    buildRoom(); registerInteractions();
    [O.car, O.landDress, O.desks, ...O.ldoor, O.crosser, O.cleanerX, ...O.gdoors, O.walker, O.cross, O.across, O.monitor, ...O.downs, O.cH, O.cM, ...O.lobDoor, O.corrTube, O.landDiff, O.lampGlow, O.sky].forEach(o => { if (o) o.userData.keep = true; });
    mergeGroup(O.land); mergeGroup(O.lobby);
  },
  defaults, applyState, startAmbience,
  spawn: { x: 0, z: -2.6, yaw: 0 },
  wake() {
    P.x = 0.15; P.z = -3.0; G.yaw = Math.PI + 0.05; G.pitch = -0.05; G.eye = G.eyeT = 1.62;
    G.cutscene = true; $('#fx').className = 'lids';
    after(0.8, () => sayI('The lobby of the Cheongun Building, 2:12 a.m. Snow outside. The guard is off on his rounds. The lift stands open, waiting.', 6000));
    after(3.2, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); toast(ctrlHint(), 7000); });
    after(4.0, () => { sayI('Her phone is in your hand. You play the memo one more time.', 3600); after(3.8, playMemo); });
  },
  debug: { O, L, V, T, M, D, BTN, COL, setFloor, startRide, press, pressFloor, openPanelUI, herFirstBoarding, startTransition, pushLatch, climbUp, drive, climbDown, takeCap, fitCap, herFinalBoarding, startFinalDown, startLoopUp, startWalk, pushOut, endFrame, lookScare, showFace, cleanerScene, faller, dispSet, doorsTo, playMemo, other, progCount },
};

})();
