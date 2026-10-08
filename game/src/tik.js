const ROOM_TIK = (() => {
/* =====================================================================
   MYSTERY #8 — "TIK-TIK"  ·  a barrio outside Infanta, Quezon, Philippines, 20 October 1979
   part A: layout, helpers, textures, materials
   A stilt house of bamboo and nipa in a fenced yard, in a typhoon, at two in the morning.
   Your sister Lorna is in labour behind the mosquito net. Nanay went for the midwife and
   hasn't come back. A manananggal is circling: the top half of a woman, flying on bat's wings,
   who leaves her legs standing somewhere on the ground. Salt, garlic and ash on the legs before
   dawn and she can never go back to them.
   This is the first room built for doing, not decoding: you drag, climb, jump, crawl, carry,
   pound and pour, and something with wings hunts you whenever you're out in the open.
   Axes: +x east, -z north. The house faces south (+z), toward the gate.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {}, V = {};
const FLOOR = 1.45, FLOOR_BOT = 1.30;                        // the house floor (top) and its underside
const HX0 = -4, HX1 = 4, HZ0 = -3, HZ1 = 3;                   // house walls
const WALL_H = 2.25, EAVE = FLOOR + WALL_H, RIDGE = 6.3;      // walls, eaves, roof ridge
const YARD = { x0: -15, x1: 15, z0: -14, z1: 13 };           // inside the bamboo fence
const GATE = { x0: -1.1, x1: 1.1, z: 13 };
const GRAN = { x0: -11, x1: -8, z0: -10.5, z1: -7.5, floor: 1.42, wall: 1.62 };   // the rice granary
const DOORX = [-0.45, 0.45];                                  // the front door, in the south wall
const KITCH = { x0: HX0, x1: -0.9, z0: HZ0, z1: 0 };
const BED = { x0: 0.6, x1: HX1, z0: HZ0, z1: 0 };
const POS = {
  lorna: new THREE.Vector3(2.4, FLOOR + 0.25, -2.25), bedWin: new THREE.Vector3(HX1, FLOOR + 1.3, -1.7),
  salaWin: new THREE.Vector3(2.4, FLOOR + 1.3, HZ1), kitWin: new THREE.Vector3(HX0, FLOOR + 1.3, -1.7),
  door: new THREE.Vector3(0, FLOOR + 1.0, HZ1), gate: new THREE.Vector3(0, 1.4, GATE.z), roof: new THREE.Vector3(0, RIDGE, 0),
  under: new THREE.Vector3(-1.5, 0.6, 0.5), legs: new THREE.Vector3(-2.55, 0, 1.75), granDoor: new THREE.Vector3(GRAN.x1, GRAN.floor + 0.6, -9.0),
  stump: new THREE.Vector3(6.4, 0, 1.6), mortar: new THREE.Vector3(-5.2, 0, -3.9), pigs: new THREE.Vector3(7, 0.4, -9.5),
  outhouse: new THREE.Vector3(10.2, 1, -2.8), panel: new THREE.Vector3(2.7, 0.6, HZ0),
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
const hash1 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function pix(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y), i = (y * w + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] ?? 255; } g.putImageData(img, 0, 0); return c; }
function tex(c, { srgb = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t; }
function canv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function live(w, h, draw, { srgb = true } = {}) { const c = canv(w, h, draw); const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.userData.canvas = c; t.userData.redraw = fn => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); fn(g, w, h); t.needsUpdate = true; }; return t; }
// height canvas + colour canvas from one per-pixel function returning [r,g,b,height]
function pbrPix(w, h, fn, nStrength = 2.4) {
  const hc = document.createElement('canvas'); hc.width = w; hc.height = h; const hg = hc.getContext('2d'), himg = hg.createImageData(w, h);
  const cc = pix(w, h, (x, y) => { const v = fn(x, y), i = (y * w + x) * 4; const hv = clamp(v[3], 0, 1) * 255; himg.data[i] = himg.data[i + 1] = himg.data[i + 2] = hv; himg.data[i + 3] = 255; return [v[0], v[1], v[2], 255]; });
  hg.putImageData(himg, 0, 0);
  return { map: tex(cc), normal: heightToNormal(hc, nStrength), height: hc };
}

/* ---------------- materials & geometry helpers ---------------- */
function std(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0, envMapIntensity: 0.3 }, o)); }
function phys(o) { return new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.8, metalness: 0, envMapIntensity: 0.3 }, o)); }
function bevGeo(w, h, d, b = 0.006, seg = 2) {
  b = Math.max(0.0005, Math.min(b, w / 2 - 0.0005, h / 2 - 0.0005, d / 2 - 0.0005));
  const s = new THREE.Shape(), x = w / 2 - b, y = h / 2 - b; s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: 1 });
  g.translate(0, 0, -Math.max(0.0005, d - 2 * b) / 2); return g;
}
function bev(w, h, d, mat, x, y, z, parent = scene, b = 0.006) { return mesh(bevGeo(w, h, d, b), mat, x, y, z, parent); }
function lathe(pts, mat, x, y, z, parent = scene, seg = 28) { return mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg), mat, x, y, z, parent); }
function tube(pts, r, mat, parent = scene, seg = 32, rs = 8, closed = false) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), closed); return mesh(new THREE.TubeGeometry(c, seg, r, rs, closed), mat, 0, 0, 0, parent); }
function uvScale(g, su, sv, ou = 0, ov = 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov); uv.needsUpdate = true; return g; }
// a box with UVs in metres on every face (divided by s)
function mbox(w, h, d, mat, x, y, z, parent = scene, s = 1) { return mesh(tiledBoxGeo(w, h, d, s), mat, x, y, z, parent); }
// a pole between two points
function pole(a, b, r, mat, parent = scene, seg = 10, r2) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2 ?? r, r, len, seg, 1); uvScale(g, 1, len / 0.5);
  const m = mesh(g, mat, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2, parent);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
}
function holedGeo(u0, u1, v0, v1, holes, d) {
  const s = new THREE.Shape(); s.moveTo(u0, v0); s.lineTo(u1, v0); s.lineTo(u1, v1); s.lineTo(u0, v1); s.closePath();
  for (const [a, b, c, e] of holes) { const hp = new THREE.Path(); hp.moveTo(a, c); hp.lineTo(a, e); hp.lineTo(b, e); hp.lineTo(b, c); hp.closePath(); s.holes.push(hp); }
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 1 }); g.translate(0, 0, -d / 2); return g;
}
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
    const m = new THREE.Mesh(out, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.userData.noRay = true; root.add(m);
  }
}
const m4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
function mergeParts(parts) {
  const pos = [], nor = [], col = [], uv = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
}

/* ---------------- textures ---------------- */
function makeTextures() {
  const S = IS_TOUCH ? 256 : 512;
  // sawali: split bamboo strips woven in a 2/2 twill, grey-gold with age and smoke
  T.sawali = pbrPix(S, S, (x, y) => {
    const cell = S / 24, i = Math.floor(x / cell), j = Math.floor(y / cell), u = (x % cell) / cell, v = (y % cell) / cell;
    const horiz = ((i + j) % 4 + 4) % 4 < 2;
    const along = horiz ? x / S : y / S, across = horiz ? v : u, strip = horiz ? j : i;
    const edge = Math.pow(Math.sin(across * Math.PI), 0.35);
    const n = tfbm(x, y, S, S, 8, 3), fib = tnoise(horiz ? x / S * 64 : across * 40 + strip * 3, horiz ? across * 40 + strip * 3 : y / S * 64, 64, 64);
    const tone = 0.78 + hash1(strip * 7.3 + (horiz ? 0 : 50)) * 0.3 + fib * 0.12 - 0.06;
    let c = mixc([118, 96, 62], [186, 160, 112], clamp(tone - 0.35, 0, 1));
    c = mixc(c, [52, 42, 30], (1 - edge) * 0.85);
    c = mixc(c, [40, 34, 26], clamp(n - 0.45, 0, 1) * 0.9);      // smoke and damp
    return [c[0], c[1], c[2], edge * (0.8 + fib * 0.2)];
  }, 3.2);
  // nipa thatch: layered rows of dry palm leaf, dark and soaked
  T.thatch = pbrPix(S, S, (x, y) => {
    const row = S / 7, r = Math.floor(y / row), v = (y % row) / row;
    const sx = x + r * 37, strand = Math.floor(sx / 3), fs = hash1(strand + r * 91);
    const len = 0.55 + fs * 0.45, on = v < len ? 1 : 0;
    const shade = (1 - v / len) * 0.5 + 0.5, n = tfbm(x, y, S, S, 6, 3);
    let c = mixc([46, 38, 28], [120, 98, 66], fs * 0.6 + 0.2);
    c = mixc(c, [24, 22, 18], (1 - shade) * 0.8 + n * 0.3);
    return [c[0], c[1], c[2], on ? (0.4 + (1 - v) * 0.6) * (0.7 + fs * 0.3) : 0.15];
  }, 2.6);
  // bamboo: a pole's skin running along v, nodes every so often
  T.bamboo = pbrPix(128, 256, (x, y) => {
    const v = y / 256, node = Math.abs(((v * 3) % 1) - 0.5) < 0.02 ? 1 : 0, fib = vnoise(x * 0.9, y * 0.05) * 0.3;
    let c = mixc([132, 112, 66], [176, 156, 98], fib + hash1(Math.floor(v * 3)) * 0.4);
    c = mixc(c, [68, 56, 34], node * 0.8 + tfbm(x, y, 128, 256, 4, 3) * 0.3);
    return [c[0], c[1], c[2], 0.7 - node * 0.5 + fib * 0.2];
  }, 2);
  // rough-sawn timber, grey with weather
  T.wood = pbrPix(S, S, (x, y) => {
    const g = tfbm(x * 4, y * 0.35, S * 4, S * 0.35, 6, 4), ring = Math.sin((x / S * 24 + g * 6) * Math.PI) * 0.5 + 0.5;
    const plank = Math.floor(x / (S / 4)), gap = (x % (S / 4)) < 2 ? 1 : 0;
    let c = mixc([70, 54, 38], [128, 102, 72], ring * 0.4 + g * 0.6 + hash1(plank) * 0.2);
    c = mixc(c, [22, 18, 14], gap * 0.9);
    return [c[0], c[1], c[2], 0.5 + ring * 0.25 - gap * 0.5];
  }, 1.8);
  // varnished narra for the wardrobe and the table
  T.narra = pbrPix(S, S, (x, y) => {
    const g = tfbm(x * 3, y * 0.4, S * 3, S * 0.4, 5, 4), ring = Math.sin((x / S * 30 + g * 8) * Math.PI) * 0.5 + 0.5;
    const c = mixc([62, 26, 14], [128, 62, 30], ring * 0.35 + g * 0.5);
    return [c[0], c[1], c[2], 0.5 + ring * 0.1];
  }, 0.8);
  // split-bamboo floor slats with dark gaps between
  T.slats = pbrPix(S, S, (x, y) => {
    const w = S / 12, i = Math.floor(x / w), u = (x % w) / w, gap = u < 0.06 ? 1 : 0;
    const fib = tnoise(i * 5 + u * 2, y / S * 50, 64, 50) * 0.3, n = tfbm(x, y, S, S, 6, 3);
    let c = mixc([92, 74, 46], [158, 128, 80], hash1(i * 3.1) * 0.6 + fib);
    c = mixc(c, [8, 6, 4], gap); c = mixc(c, [48, 38, 26], clamp(n - 0.4, 0, 1));
    return [c[0], c[1], c[2], gap ? 0 : 0.6 + Math.sin(u * Math.PI) * 0.4];
  }, 2.5);
  // mud: wet earth, puddles that shine, a few grass tufts
  { const W = IS_TOUCH ? 256 : 512;
    const rough = document.createElement('canvas'); rough.width = rough.height = W; const rg = rough.getContext('2d'), ri = rg.createImageData(W, W);
    T.mud = pbrPix(W, W, (x, y) => {
      const n = tfbm(x, y, W, W, 6, 5), p = tfbm(x + 333, y + 77, W, W, 3, 3), puddle = clamp((p - 0.56) * 9, 0, 1), grass = clamp((tfbm(x + 900, y, W, W, 10, 3) - 0.68) * 5, 0, 1) * (1 - puddle);
      let c = mixc([46, 34, 24], [86, 64, 42], n);
      c = mixc(c, [22, 20, 18], puddle * 0.85);
      c = mixc(c, [38, 52, 24], grass * (0.6 + tnoise(x * 0.8, y * 0.8, W * 0.8, W * 0.8) * 0.4));
      const i = (y * W + x) * 4, rv = (0.92 - puddle * 0.82 - n * 0.1) * 255; ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = rv; ri.data[i + 3] = 255;
      return [c[0], c[1], c[2], n * 0.7 * (1 - puddle) + grass * 0.4];
    }, 3);
    rg.putImageData(ri, 0, 0); T.mudRough = tex(rough, { srgb: false });
  }
  // terracotta, sooted
  T.clay = pbrPix(256, 256, (x, y) => { const n = tfbm(x, y, 256, 256, 6, 4), soot = clamp(1 - y / 256 * 1.6 + n * 0.4 - 0.2, 0, 1); let c = mixc([128, 62, 38], [170, 92, 58], n); c = mixc(c, [24, 18, 14], soot * 0.8); return [c[0], c[1], c[2], n]; }, 1.5);
  // Nanay's skirt: navy blue with white flowers (the same one as in the fiesta photo)
  T.skirt = tex(canv(256, 256, (g, w, h) => {
    g.fillStyle = '#1d2c5a'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 26; k++) { const x = hash1(k * 3.7) * w, y = hash1(k * 9.1) * h, r = 7 + hash1(k) * 6;
      for (const [ox, oy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) { g.fillStyle = '#e8e4d6'; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + k; g.beginPath(); g.ellipse(x + ox + Math.cos(a) * r * 0.6, y + oy + Math.sin(a) * r * 0.6, r * 0.42, r * 0.26, a, 0, TAU); g.fill(); } g.fillStyle = '#d8b030'; g.beginPath(); g.arc(x + ox, y + oy, r * 0.22, 0, TAU); g.fill(); } }
    speckle(g, w, h, 900, 0.18, '0,0,0', 2);
  }), { repeat: [3, 2] });
  // a patadyong: woven checks, red and green on cream
  T.checks = tex(canv(256, 256, (g, w, h) => {
    g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(150,30,30,0.55)' : 'rgba(30,90,50,0.5)'; g.fillRect(i * 32, 0, 14, h); g.fillRect(0, i * 32, w, 14); }
    for (let y = 0; y < h; y += 2) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, y, w, 1); }
  }), { repeat: [2, 2] });
  // banig: a woven sleeping mat with coloured bands
  T.banig = tex(pix(256, 256, (x, y) => { const cell = 8, i = Math.floor(x / cell), j = Math.floor(y / cell), horiz = (i + j) % 2 === 0, band = Math.floor((horiz ? y : x) / 40) % 5; const base = [[196, 170, 120], [150, 40, 50], [196, 170, 120], [40, 90, 120], [210, 160, 60]][band]; const sh = Math.sin(((horiz ? y : x) % cell) / cell * Math.PI) * 0.25 + 0.75; return [base[0] * sh, base[1] * sh, base[2] * sh]; }), { repeat: [2, 3] });
  // the mosquito net: white cotton mesh
  T.net = tex(canv(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(235,232,222,0.32)'; g.lineWidth = 1; for (let i = 0; i <= w; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }), { repeat: [10, 10] });
  // palm frond and banana leaf (alpha)
  T.frond = tex(canv(64, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#3a4a20'; g.fillRect(w / 2 - 2, 0, 4, h); for (let i = 8; i < h; i += 7) { const l = (1 - i / h) * 0.3 + 0.7, len = w / 2 * l; g.strokeStyle = `rgb(${50 + hash1(i) * 30},${70 + hash1(i + 1) * 30},${26})`; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, i); g.lineTo(w / 2 - len, i + 18); g.moveTo(w / 2, i); g.lineTo(w / 2 + len, i + 18); g.stroke(); } }));
  T.frond.wrapS = T.frond.wrapT = THREE.ClampToEdgeWrapping;
  T.banana = tex(canv(128, 512, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a4818'); gr.addColorStop(0.5, '#4a7028'); gr.addColorStop(1, '#2a4818'); g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, 0); g.quadraticCurveTo(w * 1.02, h * 0.3, w / 2 + 6, h); g.lineTo(w / 2 - 6, h); g.quadraticCurveTo(-w * 0.02, h * 0.3, w / 2, 0); g.fill(); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { const y = 40 + hash1(i) * (h - 80), s = hash1(i + 3) < 0.5 ? -1 : 1; g.fillRect(s < 0 ? 0 : w / 2 + 3, y, w / 2 - 3, 2 + hash1(i + 7) * 2); } g.globalCompositeOperation = 'source-over'; g.fillStyle = '#6a8a40'; g.fillRect(w / 2 - 2, 0, 4, h); g.fillStyle = 'rgba(90,70,30,0.5)'; for (let i = 0; i < 30; i++) g.fillRect(hash1(i * 2) * w, hash1(i * 5) * h, 3, 8); }));
  T.banana.wrapS = T.banana.wrapT = THREE.ClampToEdgeWrapping;
  // the storm sky: low, heavy, faintly lit from below
  T.sky = tex(pix(512, 256, (x, y) => { const v = y / 256, n = tfbm(x, y * 2, 512, 512, 4, 5), n2 = tfbm(x + 200, y * 2 + 50, 512, 512, 10, 3); const k = clamp(n * 1.2 - 0.25 + n2 * 0.3, 0, 1) * (1 - v * 0.6); const c = mixc([6, 8, 12], [40, 46, 56], k); return [c[0], c[1], c[2]]; }), { repeat: [1, 1] });
  T.sky.wrapT = THREE.ClampToEdgeWrapping;
  // the same clouds at first light: grey, the horizon going pale pink and gold
  T.skyDawn = tex(pix(512, 256, (x, y) => { const v = y / 256, n = tfbm(x, y * 2, 512, 512, 4, 5), hz = Math.pow(clamp(v * 1.25, 0, 1), 3); let c = mixc([118, 128, 146], [176, 178, 184], n); c = mixc(c, [236, 196, 168], hz * 0.85); c = mixc(c, [250, 222, 170], Math.pow(hz, 3) * 0.6 * (0.6 + n * 0.6)); return [c[0], c[1], c[2]]; }));
  T.skyDawn.wrapT = THREE.ClampToEdgeWrapping;
  // treeline: black silhouettes of palms and bamboo along the far edge of the fields
  T.trees = tex(canv(1024, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 6) g.lineTo(x, h - 30 - fbm(x * 0.02, 1) * 40 - (hash1(Math.floor(x / 6)) < 0.04 ? 30 : 0)); g.lineTo(w, h); g.fill(); for (let k = 0; k < 14; k++) { const x = hash1(k * 4.3) * w, tH = 60 + hash1(k) * 50; g.lineWidth = 3; g.strokeStyle = '#000'; g.beginPath(); g.moveTo(x, h - 40); g.quadraticCurveTo(x + 8, h - tH / 2, x + 4, h - tH); g.stroke(); for (let f = 0; f < 7; f++) { const a = f / 7 * TAU; g.beginPath(); g.moveTo(x + 4, h - tH); g.quadraticCurveTo(x + 4 + Math.cos(a) * 14, h - tH - 8, x + 4 + Math.cos(a) * 24, h - tH + 12 + Math.abs(Math.sin(a)) * 6); g.stroke(); } } }));
  T.trees.wrapT = THREE.ClampToEdgeWrapping;
  // bat-wing membrane: dark leather with veins
  T.wing = tex(canv(256, 256, (g, w, h) => { g.fillStyle = '#2a1e1c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${60 + Math.random() * 40},${30 + Math.random() * 20},${26},${Math.random() * 0.2})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.strokeStyle = 'rgba(90,30,30,0.35)'; for (let i = 0; i < 40; i++) { g.lineWidth = 0.5 + Math.random(); g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); } }));
  T.rain = tex(canv(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(200,210,220,0)'); gr.addColorStop(0.6, 'rgba(200,210,220,0.5)'); gr.addColorStop(1, 'rgba(220,230,240,0.9)'); g.fillStyle = gr; g.fillRect(3, 0, 2, h); }));
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  const n2 = (t, s) => { t.normal.repeat.copy(t.map.repeat); return t.normal; };
  M.sawali = std({ map: T.sawali.map, normalMap: T.sawali.normal, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.92 });
  M.sawaliDark = std({ map: T.sawali.map, normalMap: T.sawali.normal, color: 0x8a8070, roughness: 0.95 });
  M.thatch = std({ map: T.thatch.map, normalMap: T.thatch.normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.95, side: THREE.DoubleSide });
  M.thatchIn = std({ map: T.thatch.map, normalMap: T.thatch.normal, color: 0x6a5e50, roughness: 1, side: THREE.DoubleSide });
  M.bamboo = std({ map: T.bamboo.map, normalMap: T.bamboo.normal, roughness: 0.62, envMapIntensity: 0.4 });
  M.bambooDark = std({ map: T.bamboo.map, normalMap: T.bamboo.normal, color: 0x6a604c, roughness: 0.75 });
  M.wood = std({ map: T.wood.map, normalMap: T.wood.normal, roughness: 0.88 });
  M.woodDark = std({ map: T.wood.map, normalMap: T.wood.normal, color: 0x6a5a4a, roughness: 0.9 });
  M.narra = phys({ map: T.narra.map, normalMap: T.narra.normal, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  M.slats = std({ map: T.slats.map, normalMap: T.slats.normal, roughness: 0.75 });
  M.mud = std({ map: T.mud.map, normalMap: T.mud.normal, roughnessMap: T.mudRough, roughness: 0.85, envMapIntensity: 0.8, vertexColors: true, color: 0x8a7e72 });
  for (const t of [T.mud.map, T.mud.normal, T.mudRough]) t.repeat.set(10, 10);
  M.mudDark = std({ map: T.mud.map, normalMap: T.mud.normal, color: 0x504840, roughness: 0.95 });
  M.clay = std({ map: T.clay.map, normalMap: T.clay.normal, roughness: 0.8 });
  M.soot = std({ color: 0x0c0a09, roughness: 1 });
  M.ash = std({ color: 0x6e6a64, roughness: 1 });
  M.rope = std({ color: 0x8a7650, roughness: 1 });
  M.iron = std({ color: 0x2a2826, roughness: 0.55, metalness: 0.7 });
  M.rust = std({ color: 0x4a2e1e, roughness: 0.9, metalness: 0.3 });
  M.tin = std({ color: 0x8a8678, roughness: 0.4, metalness: 0.75 });
  M.glass = new THREE.MeshStandardMaterial({ color: 0xf0f4f0, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1 });
  M.coconut = std({ color: 0x4a3222, roughness: 0.7 });
  M.coconutIn = std({ color: 0xd8ccb0, roughness: 0.9 });
  M.skirt = std({ map: T.skirt, roughness: 0.9 });
  M.checks = std({ map: T.checks, roughness: 0.95 });
  M.banig = std({ map: T.banig, roughness: 0.9 });
  M.net = new THREE.MeshStandardMaterial({ map: T.net, transparent: true, side: THREE.DoubleSide, roughness: 1, depthWrite: false, alphaTest: 0.02, color: 0xe8e4d8 });
  M.frond = std({ map: T.frond, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7, color: 0x6a705c });
  M.banana = std({ map: T.banana, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5, color: 0x5e6a50 });
  M.trunk = std({ map: T.bamboo.map, color: 0x5a5048, roughness: 0.95 });
  M.leafDark = std({ color: 0x1a2412, roughness: 0.8 });
  M.water = phys({ color: 0x080a0c, roughness: 0.08, metalness: 0, envMapIntensity: 1, clearcoat: 1 });
  M.flame = new THREE.MeshBasicMaterial({ color: 0xffb050, fog: false });
  M.glow = new THREE.SpriteMaterial({ map: glowTex(), color: 0xffa040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  M.eye = new THREE.SpriteMaterial({ map: glowTex(), color: 0xff2010, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  M.skin = std({ color: 0x8a6a54, roughness: 0.6 });
  M.paleSkin = std({ color: 0x9a948c, roughness: 0.55 });
  M.blouse = std({ color: 0xcfc8b4, roughness: 0.85 });
  M.hair = std({ color: 0x060505, roughness: 0.42, side: THREE.DoubleSide, alphaTest: 0.3, map: hairTex() });
  M.wing = std({ map: T.wing, color: 0xb09088, roughness: 0.42, side: THREE.DoubleSide, envMapIntensity: 0.3, emissive: 0x200606, emissiveIntensity: 1 });
  M.bone = std({ color: 0x5a4a40, roughness: 0.5 });
  M.nail = std({ color: 0x1a1210, roughness: 0.3 });
  M.blouseStain = std({ map: blouseTex(), roughness: 0.75 });
  M.gut = phys({ color: 0x3a0e0c, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  M.wound = phys({ color: 0x2a0606, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
  M.salt = std({ color: 0xece8e0, roughness: 0.7 });
  M.garlicPaste = std({ color: 0xd8cfa8, roughness: 0.8 });
  M.slipper = std({ color: 0xa82418, roughness: 0.6 });
  M.rubber = std({ color: 0x2a2624, roughness: 0.8 });
  M.pig = std({ color: 0x3a3230, roughness: 0.8 });
  M.highlight = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
}
function blouseTex() { if (T.blouse) return T.blouse; T.blouse = tex(canv(256, 256, (g, w, h) => { g.fillStyle = '#c9c0aa'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.03})`; g.fillRect(0, y, w, 1); } g.strokeStyle = 'rgba(120,90,60,0.5)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = i * 28 + 10; g.beginPath(); for (let y = 0; y < 26; y += 4) g.lineTo(x + Math.sin(y) * 3, 18 + y); g.stroke(); } for (let i = 0; i < 26; i++) blot(g, Math.random() * w, h * 0.55 + Math.random() * h * 0.45, 6 + Math.random() * 26, 0.55, '70,10,8'); for (let i = 0; i < 12; i++) blot(g, Math.random() * w, Math.random() * h, 8 + Math.random() * 20, 0.25, '40,30,20'); g.fillStyle = 'rgba(60,8,6,0.8)'; for (let i = 0; i < 30; i++) { const x = Math.random() * w; g.fillRect(x, h * 0.7 + Math.random() * h * 0.2, 2, 10 + Math.random() * 30); } })); return T.blouse; }
function glowTex() { if (T.glow) return T.glow; T.glow = tex(canv(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); })); T.glow.wrapS = T.glow.wrapT = THREE.ClampToEdgeWrapping; return T.glow; }
function hairTex() { if (T.hair) return T.hair; T.hair = tex(canv(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const x = Math.random() * w; g.strokeStyle = `rgba(${10 + Math.random() * 14},${8 + Math.random() * 10},${8},${0.5 + Math.random() * 0.5})`; g.lineWidth = 0.6 + Math.random() * 1.6; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (Math.random() - 0.5) * 10, h * 0.3, x + (Math.random() - 0.5) * 14, h * 0.7, x + (Math.random() - 0.5) * 18, h * (0.75 + Math.random() * 0.25)); g.stroke(); } })); return T.hair; }

/* =====================================================================
   TIK-TIK · part B: the house. Bamboo posts, a split-bamboo floor at 1.45 m, sawali walls,
   a nipa roof, three rooms (sala, kitchen, bedroom) and an altar nook; the crawlspace underneath,
   closed in by woven screens, where something is standing in the dark.
   ===================================================================== */
// a flat wall between two points on the ground plan, from y0 to y1, with holes [u0,u1,v0,v1] measured along it
function wallPanel(x0, z0, x1, z1, y0, y1, holes, mat, parent, d = 0.04) {
  const len = Math.hypot(x1 - x0, z1 - z0), g = holedGeo(0, len, 0, y1 - y0, holes, d);
  uvScale(g, 1 / 0.75, 1 / 0.75);
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  m.position.set(x0, y0, z0); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); parent.add(m);
  return m;
}
// solids for a wall line with gaps (each gap [u0,u1] along the wall, full height)
function wallSolids(id, x0, z0, x1, z1, y0, y1, gaps = [], t = 0.08) {
  const len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
  const segs = []; let u = 0; for (const [a, b] of gaps.slice().sort((p, q) => p[0] - q[0])) { if (a > u) segs.push([u, a]); u = b; } if (u < len) segs.push([u, len]);
  return segs.map(([a, b], i) => { const ax = x0 + dx * a, az = z0 + dz * a, bx = x0 + dx * b, bz = z0 + dz * b; return solid(id + i, Math.min(ax, bx) - t / 2, Math.max(ax, bx) + t / 2, y0, y1, Math.min(az, bz) - t / 2, Math.max(az, bz) + t / 2); });
}
function frameAround(x0, z0, x1, z1, y0, y1, parent, mat = M.bamboo) {
  pole([x0, y0, z0], [x1, y0, z1], 0.035, mat, parent, 8); pole([x0, y1, z0], [x1, y1, z1], 0.035, mat, parent, 8);
}

function buildHouse() {
  const H = O.house = grp(0, 0, 0); H.userData.noRayMerged = true;
  solid('ground', -300, 300, -3, 0, -300, 300);
  // ---- posts (haligi): wood below, through the walls to the eaves
  const PX = [HX0, -1.33, 1.33, HX1], PZ = [HZ0, 0, HZ1];
  for (const x of PX) for (const z of PZ) {
    const p = mbox(0.15, EAVE + 0.1, 0.15, M.woodDark, x, (EAVE + 0.1) / 2, z, H, 0.6);
    mbox(0.34, 0.12, 0.3, M.mudDark, x + 0.02, 0.04, z - 0.01, H, 0.5).rotation.y = hash1(x * 7 + z) * 1.2;   // a flat footing stone
    solid('post' + x + ',' + z, x - 0.09, x + 0.09, 0, FLOOR_BOT, z - 0.09, z + 0.09);
  }
  // ---- the floor: joists, then the slats (with one broken gap in the sala, over what's standing underneath)
  for (let z = HZ0; z <= HZ1 + 0.01; z += 0.6) pole([HX0 - 0.1, FLOOR_BOT + 0.06, z], [HX1 + 0.1, FLOOR_BOT + 0.06, z], 0.055, M.bambooDark, H, 8);
  pole([HX0, FLOOR_BOT + 0.02, HZ0], [HX0, FLOOR_BOT + 0.02, HZ1], 0.07, M.woodDark, H, 8); pole([HX1, FLOOR_BOT + 0.02, HZ0], [HX1, FLOOR_BOT + 0.02, HZ1], 0.07, M.woodDark, H, 8);
  pole([0, FLOOR_BOT + 0.02, HZ0], [0, FLOOR_BOT + 0.02, HZ1], 0.07, M.woodDark, H, 8);
  { const gx = POS.legs.x, gz = POS.legs.z;
    const g = holedGeo(HX0, HX1, -HZ1, -HZ0, [[gx - 0.3, gx + 0.3, -gz - 0.07, -gz + 0.07]], 0.05); uvScale(g, 1 / 0.9, 1 / 0.9);
    const fl = new THREE.Mesh(g, M.slats); fl.rotation.x = -Math.PI / 2; fl.position.y = FLOOR - 0.025; fl.receiveShadow = true; fl.castShadow = true; H.add(fl);
    // broken slat ends, splintered, around the gap
    for (const s of [-1, 1]) { const sp = mbox(0.07, 0.02, 0.1, M.slats, gx + s * 0.27, FLOOR - 0.02, gz + s * 0.02, H, 0.3); sp.rotation.set(0.1 * s, 0.3, 0.12); }
    O.gapPos = new THREE.Vector3(gx, FLOOR, gz);
  }
  solid('floor', HX0 - 0.05, HX1 + 0.05, FLOOR_BOT, FLOOR, HZ0 - 0.05, HZ1 + 0.05);
  // a ceiling over the rooms, so nobody stands up inside the thatch
  solid('roofIn', HX0, HX1, EAVE + 0.75, EAVE + 0.85, HZ0, HZ1);

  // ---- outer walls (sawali in bamboo frames)
  const wy0 = FLOOR, wy1 = EAVE;
  const S1 = HZ1, N1 = HZ0;
  // south: the front door and the sala window
  wallPanel(HX0, S1, HX1, S1, wy0, wy1, [[DOORX[0] - HX0, DOORX[1] - HX0, 0, 2.0], [1.8 - HX0, 3.0 - HX0, 0.78, 1.66]], M.sawali, H);
  // north: solid, with the altar nook in the middle
  wallPanel(HX1, N1, HX0, N1, wy0, wy1, [], M.sawali, H);
  // west: the kitchen window, and the sala window that's been nailed shut
  wallPanel(HX0, N1, HX0, S1, wy0, wy1, [[-2.2 - N1, -1.2 - N1, 0.8, 1.62], [1.0 - N1, 2.2 - N1, 0.8, 1.62]], M.sawali, H);
  // east: the bedroom window, and a gap where a strip of the weave has rotted out (crouching height)
  wallPanel(HX1, S1, HX1, N1, wy0, wy1, [[S1 - (-1.1), S1 - (-2.3), 0.78, 1.66], [S1 - (-0.38), S1 - (-0.62), 0.83, 0.95]], M.sawali, H);
  for (const [a, b] of [[[HX0, S1], [HX1, S1]], [[HX1, N1], [HX0, N1]], [[HX0, N1], [HX0, S1]], [[HX1, S1], [HX1, N1]]]) frameAround(a[0], a[1], b[0], b[1], wy0 + 0.04, wy1 - 0.03, H);
  wallSolids('wS', HX0, S1, HX1, S1, wy0, wy1 + 1, [[DOORX[0] - HX0, DOORX[1] - HX0]]);
  wallSolids('wN', HX0, N1, HX1, N1, wy0, wy1 + 1); wallSolids('wW', HX0, N1, HX0, S1, wy0, wy1 + 1); wallSolids('wE', HX1, N1, HX1, S1, wy0, wy1 + 1);
  // window frames, sills and the gap's splinters
  const winFrame = (cx, cz, along, w, h) => { const g = grp(cx, FLOOR + 0.78 + h / 2, cz, H); g.rotation.y = along; for (const s of [-1, 1]) { mbox(0.06, h + 0.1, 0.09, M.woodDark, s * (w / 2 + 0.03), 0, 0, g, 0.5); mbox(w + 0.12, 0.06, 0.1, M.woodDark, 0, s * (h / 2 + 0.03), 0, g, 0.5); } return g; };
  winFrame(2.4, S1, 0, 1.2, 0.88); winFrame(HX0, -1.7, Math.PI / 2, 1.0, 0.82); winFrame(HX0, 1.6, Math.PI / 2, 1.2, 0.82); winFrame(HX1, -1.7, Math.PI / 2, 1.2, 0.88);
  // the nailed window: two planks across it, nails rusted
  for (const y of [0.25, 0.6]) { const pl = mbox(0.04, 0.12, 1.36, M.woodDark, HX0 - 0.04, FLOOR + 0.78 + y, 1.6, H, 0.6); pl.rotation.x = (y - 0.4) * 0.12; }
  // inside: sala shutters closed behind those planks
  mbox(0.03, 0.82, 1.2, M.sawaliDark, HX0 + 0.03, FLOOR + 1.2, 1.6, H, 0.7);
  // the rotten strip by the bedroom window: splinters at its ends
  for (const z of [-0.38, -0.62]) mbox(0.05, 0.05, 0.03, M.sawaliDark, HX1 + 0.01, FLOOR + 0.89, z, H, 0.2);
  O.peekPos = new THREE.Vector3(HX1 - 0.05, FLOOR + 0.89, -0.5);

  // ---- partitions (to 2.1 m; open above, under the thatch)
  const pH = FLOOR + 2.1;
  wallPanel(0.6, 0, HX1, 0, wy0, pH, [[1.6 - 0.6, 2.4 - 0.6, 0, 1.95]], M.sawali, H);             // sala | bedroom, with a doorway
  wallPanel(0.6, N1, 0.6, 0, wy0, pH, [], M.sawali, H);                                          // nook | bedroom
  wallPanel(HX0, 0, -0.9, 0, wy0, pH, [[-3.1 - HX0, -1.6 - HX0, 0, 1.95]], M.sawali, H);          // sala | kitchen, a wide opening
  wallPanel(-0.9, N1, -0.9, 0, wy0, pH, [], M.sawali, H);                                        // kitchen | nook
  frameAround(0.6, 0, HX1, 0, wy0 + 0.04, pH, H); frameAround(HX0, 0, -0.9, 0, wy0 + 0.04, pH, H);
  for (const [x, z] of [[0.6, 0], [-0.9, 0], [1.6, 0], [2.4, 0], [-3.1, 0], [-1.6, 0]]) pole([x, FLOOR, z], [x, pH, z], 0.04, M.bamboo, H, 8);
  pole([1.6, FLOOR + 1.95, 0], [2.4, FLOOR + 1.95, 0], 0.03, M.bamboo, H, 8); pole([-3.1, FLOOR + 1.95, 0], [-1.6, FLOOR + 1.95, 0], 0.03, M.bamboo, H, 8);
  wallSolids('pBed', 0.6, 0, HX1, 0, wy0, pH, [[1.0, 1.8]]); wallSolids('pNook', 0.6, N1, 0.6, 0, wy0, pH);
  wallSolids('pKit', HX0, 0, -0.9, 0, wy0, pH, [[0.9, 2.4]]); wallSolids('pKN', -0.9, N1, -0.9, 0, wy0, pH);
  // the bedroom doorway's curtain: a faded cloth on a string
  O.curtain = grp(2.0, FLOOR + 1.93, 0.04, scene); O.curtain.userData.keep = true;
  for (let i = 0; i < 2; i++) { const c = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(0.22, 1.5, 3, 8), 1, 1), std({ map: T.checks, color: 0x8a7a8a, side: THREE.DoubleSide, roughness: 1 })); c.geometry.translate(0, -0.75, 0); c.position.set(-0.32 + i * 0.07, 0, 0.01 * i); c.rotation.y = 0.5 + i * 0.4; c.castShadow = true; O.curtain.add(c); }
  O.curtain.userData.cloths = O.curtain.children;

  // ---- the front door and its bar
  O.doorPivot = grp(DOORX[0], FLOOR, S1 - 0.02, scene); O.doorPivot.userData.keep = true;
  const door = O.door = grp(0.45, 1.0, 0, O.doorPivot);
  mbox(0.88, 1.98, 0.04, M.wood, 0, 0, 0, door, 0.8);
  for (const y of [-0.7, 0, 0.7]) mbox(0.88, 0.08, 0.03, M.woodDark, 0, y, -0.03, door, 0.5);
  O.doorSolid = solid('door', DOORX[0], DOORX[1], FLOOR, FLOOR + 2.0, S1 - 0.05, S1 + 0.05);
  // brackets either side, and the bar
  for (const x of [DOORX[0] - 0.08, DOORX[1] + 0.08]) mbox(0.06, 0.12, 0.1, M.woodDark, x, FLOOR + 1.0, S1 - 0.08, H, 0.4);
  O.bar = mbox(1.3, 0.08, 0.06, M.wood, 0, FLOOR + 1.0, S1 - 0.09, scene, 0.6); O.bar.userData.keep = true;
  O.barRest = { pos: new THREE.Vector3(DOORX[1] + 0.25, FLOOR + 0.62, S1 - 0.12), rot: new THREE.Euler(0, 0, 1.25) };
  // the front steps: a bamboo ladder of six treads, rails either side
  const steps = 6, run = 1.5, rise = FLOOR / steps;
  for (let i = 0; i < steps - 1; i++) {
    const top = rise * (i + 1), z = S1 + run - (i + 0.5) * (run / steps);
    pole([-0.55, top - 0.03, z], [0.55, top - 0.03, z], 0.045, M.bamboo, H, 8);
    pole([-0.55, top - 0.03, z - 0.07], [0.55, top - 0.03, z - 0.07], 0.04, M.bamboo, H, 8);
    solid('step' + i, -0.5, 0.5, 0, top, z - 0.14, z + 0.13);
  }
  for (const x of [-0.6, 0.6]) { pole([x, 0, S1 + run + 0.05], [x, FLOOR + 0.02, S1], 0.055, M.bambooDark, H, 8); pole([x, 0.95, S1 + run + 0.05], [x, FLOOR + 0.9, S1 + 0.1], 0.03, M.bamboo, H, 8); pole([x, 0, S1 + run + 0.05], [x, 0.95, S1 + run + 0.05], 0.03, M.bamboo, H, 8); }
  solid('stepRailL', -0.66, -0.56, 0, FLOOR + 0.9, S1, S1 + run); solid('stepRailR', 0.56, 0.66, 0, FLOOR + 0.9, S1, S1 + run);

  // ---- window shutters: hinged inside, swinging in against the wall when open
  O.shutters = {};
  const shutter = (id, hx, hz, w, h, closedRy, openRy, dirX, dirZ) => {
    const pv = grp(hx, FLOOR + 0.78, hz, scene); pv.userData.keep = true;
    const leaf = grp(0, 0, 0, pv);
    const panel = mbox(w, h, 0.03, M.sawaliDark, w / 2, h / 2, 0, leaf, 0.7);
    for (const y of [0.04, h - 0.04]) mbox(w, 0.05, 0.05, M.woodDark, w / 2, y, 0, leaf, 0.4);
    for (const x of [0.03, w - 0.03]) mbox(0.05, h, 0.05, M.woodDark, x, h / 2, 0, leaf, 0.4);
    const latch = mbox(0.04, 0.1, 0.06, M.wood, w - 0.06, h / 2, -0.05, leaf, 0.2);
    pv.rotation.y = closedRy;
    const blk = solid('win_' + id, Math.min(hx, hx + dirX * w) - 0.06, Math.max(hx, hx + dirX * w) + 0.06, FLOOR + 0.5, FLOOR + 1.8, Math.min(hz, hz + dirZ * w) - 0.06, Math.max(hz, hz + dirZ * w) + 0.06);
    O.shutters[id] = { pv, leaf, panel, closedRy, openRy, k: 0, target: 0, w, h, hinge: new THREE.Vector3(hx, FLOOR + 0.78, hz), mid: new THREE.Vector3(hx + dirX * w / 2, FLOOR + 0.78 + h / 2, hz + dirZ * w / 2), blk };
  };
  // the kitchen window (west wall, z -2.2..-1.2): hinged at its north edge
  shutter('kit', HX0 + 0.05, -1.2, 1.0, 0.82, Math.PI / 2, Math.PI / 2 - 1.7, 0, -1);
  // the bedroom window (east wall, z -2.3..-1.1): hinged at its south edge
  shutter('bed', HX1 - 0.05, -1.1, 1.2, 0.88, Math.PI / 2, Math.PI / 2 + 1.7, 0, -1);
  // the sala window (south wall, x 1.8..3.0): hinged at its west edge
  shutter('sala', 1.8, HZ1 - 0.05, 1.2, 0.88, 0, 1.7, 1, 0);

  // ---- the roof: four slopes of nipa over bamboo rafters; holes torn later where she comes in
  O.roof = grp(0, 0, 0, scene); O.roof.userData.keep = true;
  const OV = 0.95, ex0 = HX0 - OV, ex1 = HX1 + OV, ez0 = HZ0 - OV, ez1 = HZ1 + OV, ey = EAVE - 0.22, rx = 1.6;
  O.roofDims = { ex0, ex1, ez0, ez1, ey, rx };
  buildRoofSlopes(null);
  // rafters and tie beams you see from inside
  for (let x = -3.2; x <= 3.21; x += 0.8) { pole([x, EAVE, HZ0], [clamp(x, -rx, rx), RIDGE - 0.1, 0], 0.035, M.bambooDark, H, 6); pole([x, EAVE, HZ1], [clamp(x, -rx, rx), RIDGE - 0.1, 0], 0.035, M.bambooDark, H, 6); }
  for (const z of [-1.5, 1.5]) pole([HX0, EAVE + 0.05, z], [HX1, EAVE + 0.05, z], 0.05, M.woodDark, H, 8);
  pole([-rx, RIDGE - 0.12, 0], [rx, RIDGE - 0.12, 0], 0.07, M.woodDark, H, 8);
  pole([-2.5, EAVE + 0.05, HZ0], [-2.5, EAVE + 0.05, HZ1], 0.045, M.bambooDark, H, 8);     // the kitchen beam the garlic hangs from

  buildRooms();
  buildUnder();
}

// the four roof slopes; `holes` is a list of {side, x0, x1, t0, t1} torn through the thatch (t from eave 0 to ridge 1)
function buildRoofSlopes(holes) {
  if (O.roofSlopes) { O.roofSlopes.forEach(m => { O.roof.remove(m); m.geometry.dispose(); }); }
  O.roofSlopes = [];
  const { ex0, ex1, ez0, ez1, ey, rx } = O.roofDims;
  const quadSlope = (side) => {
    // north/south: trapezoid from the eave (ex0..ex1 at z=ez) up to the ridge (-rx..rx at z=0)
    const ez = side === 'n' ? ez0 : ez1, sgn = side === 'n' ? -1 : 1;
    const NU = 24, NT = 8, pos = [], uv = [], idx = [];
    const hs = (holes || []).filter(h => h.side === side);
    for (let j = 0; j <= NT; j++) for (let i = 0; i <= NU; i++) {
      const t = j / NT, u = i / NU;
      const xa = lerp(ex0, -rx, t), xb = lerp(ex1, rx, t), x = lerp(xa, xb, u), z = lerp(ez, 0, t), y = lerp(ey, RIDGE, t) + Math.sin(u * 13 + t * 5) * 0.02;
      pos.push(x, y, z); uv.push(x / 1.2, Math.hypot(z - ez, y - ey) / 1.2);
    }
    for (let j = 0; j < NT; j++) for (let i = 0; i < NU; i++) {
      const t = (j + 0.5) / NT, x = lerp(lerp(ex0, -rx, t), lerp(ex1, rx, t), (i + 0.5) / NU);
      if (hs.some(h => x > h.x0 && x < h.x1 && t > h.t0 && t < h.t1)) continue;
      const q = j * (NU + 1) + i; if (sgn > 0) idx.push(q, q + 1, q + NU + 1, q + 1, q + NU + 2, q + NU + 1); else idx.push(q, q + NU + 1, q + 1, q + 1, q + NU + 1, q + NU + 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const triSlope = (side) => {
    const ex = side === 'w' ? ex0 : ex1, rxx = side === 'w' ? -rx : rx;
    const pos = [ex, ey, ez0, ex, ey, ez1, rxx, RIDGE, 0], uv = [ez0 / 1.2, 0, ez1 / 1.2, 0, 0, Math.hypot(ex - rxx, ey - RIDGE) / 1.2];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(side === 'w' ? [0, 1, 2] : [0, 2, 1]); g.computeVertexNormals(); return g;
  };
  for (const side of ['n', 's', 'w', 'e']) {
    const g = side === 'n' || side === 's' ? quadSlope(side) : triSlope(side);
    const out = new THREE.Mesh(g, M.thatch); out.castShadow = true; out.receiveShadow = true; O.roof.add(out); O.roofSlopes.push(out);
    // a thick fringe at the eave
    const inner = new THREE.Mesh(g, M.thatchIn); inner.position.y = -0.12; inner.receiveShadow = true; O.roof.add(inner); O.roofSlopes.push(inner);
  }
  // the fringe of leaf ends along the eaves
  const fr = new THREE.Mesh(new THREE.BoxGeometry(ex1 - ex0, 0.14, 0.12), M.thatch); fr.position.set(0, ey - 0.02, ez1); O.roof.add(fr); O.roofSlopes.push(fr);
  const fr2 = fr.clone(); fr2.position.z = ez0; O.roof.add(fr2); O.roofSlopes.push(fr2);
  const fr3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, ez1 - ez0), M.thatch); fr3.position.set(ex0, ey - 0.02, 0); O.roof.add(fr3); O.roofSlopes.push(fr3);
  const fr4 = fr3.clone(); fr4.position.x = ex1; O.roof.add(fr4); O.roofSlopes.push(fr4);
  O.roofSlopes.forEach(m => m.userData.noRay = true);
}

/* ---------------- the rooms ---------------- */
function buildRooms() {
  const H = O.house;
  // --- sala: table, the lamp, the bench (draggable), the bamboo bed, the photo, a calendar
  const tbl = O.table = grp(-1.4, FLOOR, 1.35, H);
  mbox(1.0, 0.04, 0.62, M.wood, 0, 0.74, 0, tbl, 0.6);
  for (const [x, z] of [[-0.44, -0.26], [0.44, -0.26], [-0.44, 0.26], [0.44, 0.26]]) mbox(0.05, 0.72, 0.05, M.woodDark, x, 0.36, z, tbl, 0.4);
  solid('table', -1.92, -0.88, FLOOR, FLOOR + 0.76, 1.02, 1.68);
  // the lamp on the table: a tin gasera, a wick in a spout, a little glass chimney
  O.lampWorld = grp(-1.25, FLOOR + 0.76, 1.3, scene); O.lampWorld.userData.keep = true;
  buildLampMesh(O.lampWorld);
  // the matchbox goes on top of the wardrobe (see the bedroom)
  // a sleeping mat where you woke
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.8), M.banig); m.rotation.x = -Math.PI / 2; m.position.set(0.95, FLOOR + 0.006, 1.95); m.rotation.z = Math.PI / 2 + 0.12; m.receiveShadow = true; H.add(m); }
  // the stool (bangkito): the one thing in the house you can stand on
  O.bench = grp(-0.55, FLOOR, 2.2, scene); O.bench.userData.keep = true;
  mbox(0.42, 0.045, 0.42, M.wood, 0, 0.43, 0, O.bench, 0.5);
  for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) { const l = mbox(0.045, 0.42, 0.045, M.woodDark, x, 0.21, z, O.bench, 0.3); l.rotation.set(z * 0.25, 0, -x * 0.25); }
  for (const s of [-1, 1]) { mbox(0.34, 0.03, 0.03, M.woodDark, 0, 0.13, s * 0.17, O.bench, 0.3); mbox(0.03, 0.03, 0.34, M.woodDark, s * 0.17, 0.13, 0, O.bench, 0.3); }
  // the papag: a low bamboo bed against the south wall (you can hide under it)
  O.papag = grp(-2.55, FLOOR, 2.55, H);
  for (let i = 0; i < 9; i++) pole([-0.9, 0.42, -0.36 + i * 0.09], [0.9, 0.42, -0.36 + i * 0.09], 0.025, M.bamboo, O.papag, 6);
  for (const [x, z] of [[-0.88, -0.38], [0.88, -0.38], [-0.88, 0.38], [0.88, 0.38]]) pole([x, 0, z], [x, 0.44, z], 0.035, M.bambooDark, O.papag, 6);
  for (const z of [-0.38, 0.38]) pole([-0.9, 0.4, z], [0.9, 0.4, z], 0.035, M.bambooDark, O.papag, 6);
  { const pil = mbox(0.4, 0.1, 0.28, M.checks, -0.6, 0.5, 0, O.papag, 0.3); pil.rotation.y = 0.1; }
  solid('papag', -3.47, -1.63, FLOOR, FLOOR + 0.46, 2.15, 2.96);
  // the family photo, framed, on the bedroom partition (sala side)
  O.photo = grp(3.25, FLOOR + 1.5, 0.035, H);
  mbox(0.34, 0.26, 0.02, M.narra, 0, 0, 0, O.photo, 0.3);
  { const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.2), new THREE.MeshStandardMaterial({ map: T.photoTex, roughness: 0.5 })); pm.position.z = 0.012; O.photo.add(pm); }
  // a calendar from the sari-sari store, October 1979
  { const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.42), new THREE.MeshStandardMaterial({ map: T.calTex, roughness: 0.9 })); cm.position.set(-0.3, FLOOR + 1.45, 0.025); H.add(cm); O.cal = cm; }
  // a transistor radio on a little shelf (dead: no batteries)
  { const sh = mbox(0.5, 0.03, 0.18, M.wood, HX0 + 0.12, FLOOR + 1.2, 0.5, H, 0.4); sh.rotation.y = Math.PI / 2; O.radio = mbox(0.24, 0.15, 0.08, std({ color: 0x5a1e14, roughness: 0.5 }), HX0 + 0.12, FLOOR + 1.3, 0.5, H, 0.2); O.radio.rotation.y = Math.PI / 2; }
  // --- the altar nook: Santo Nino in red, a guttered candle, plastic flowers
  const alt = O.altar = grp(-0.15, FLOOR, -2.7, H);
  mbox(0.9, 0.04, 0.42, M.narra, 0, 0.8, 0, alt, 0.4); for (const x of [-0.4, 0.4]) mbox(0.05, 0.8, 0.38, M.narra, x, 0.4, 0, alt, 0.3);
  { const st = grp(0, 0.82, -0.05, alt); lathe([[0.001, 0], [0.07, 0], [0.06, 0.04], [0.045, 0.2], [0.06, 0.28], [0.03, 0.34], [0.001, 0.34]], std({ color: 0x8a1a14, roughness: 0.45 }), 0, 0, 0, st, 14); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), std({ color: 0xc8a88a, roughness: 0.5 })); hd.position.y = 0.37; st.add(hd); const cr = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 8), std({ color: 0xc8a040, roughness: 0.3, metalness: 0.8 })); cr.position.y = 0.42; st.add(cr); }
  O.candle = lathe([[0.001, 0], [0.025, 0], [0.025, 0.04], [0.02, 0.05], [0.001, 0.05]], std({ color: 0xe8e0c8, roughness: 0.6 }), 0.22, 0.82, 0.05, alt, 10);
  lathe([[0.001, 0], [0.05, 0], [0.04, 0.02], [0.001, 0.02]], M.tin, 0.22, 0.82, 0.05, alt, 12);
  for (let i = 0; i < 4; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), std({ color: [0xc82040, 0xe8c030, 0xd84090, 0xe8e0d0][i], roughness: 0.6 })); fl.position.set(-0.25 + (i % 2) * 0.06, 1.05 + Math.floor(i / 2) * 0.05, 0.02); alt.add(fl); }
  lathe([[0.001, 0], [0.04, 0], [0.03, 0.18], [0.001, 0.18]], M.glass, -0.22, 0.82, 0.02, alt, 10);
  solid('altar', -0.62, 0.32, FLOOR, FLOOR + 0.84, -2.94, -2.46);

  // --- the kitchen: the stove box, the clay stove full of ash, the shelf with the bowl, the water jar, the garlic up high
  const K = O.kitchen = grp(0, 0, 0, H);
  mbox(0.95, 0.7, 0.62, M.woodDark, -3.45, FLOOR + 0.35, -2.62, K, 0.5);
  { const top = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.55), M.ash); top.rotation.x = -Math.PI / 2; top.position.set(-3.45, FLOOR + 0.705, -2.62); K.add(top); }
  O.kalan = grp(-3.45, FLOOR + 0.71, -2.65, H);
  { const kg = new THREE.LatheGeometry([[0.2, 0], [0.22, 0.04], [0.2, 0.18], [0.16, 0.22], [0.12, 0.2], [0.11, 0.06], [0.001, 0.05]].map(([r, y]) => new THREE.Vector2(r, y)), 16); const k = new THREE.Mesh(kg, M.clay); k.castShadow = true; O.kalan.add(k);
    const ashTop = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), M.ash); ashTop.rotation.x = -Math.PI / 2; ashTop.position.y = 0.09; O.kalan.add(ashTop);
    for (let i = 0; i < 5; i++) { const ch = mbox(0.06, 0.03, 0.03, M.soot, (hash1(i) - 0.5) * 0.12, 0.1, (hash1(i + 3) - 0.5) * 0.12, O.kalan, 0.1); ch.rotation.y = i; }
    const mouth = mbox(0.12, 0.08, 0.02, M.soot, 0, 0.08, 0.205, O.kalan, 0.1); }
  { const pot = lathe([[0.001, 0], [0.12, 0], [0.15, 0.06], [0.14, 0.14], [0.11, 0.17], [0.001, 0.17]], std({ color: 0x1a1816, roughness: 0.5, metalness: 0.5 }), -3.15, FLOOR + 0.71, -2.5, K, 16); }
  // soot climbing the wall above the stove
  { const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), new THREE.MeshStandardMaterial({ map: T.sootTex, transparent: true, depthWrite: false, roughness: 1 })); sm.position.set(-3.45, FLOOR + 1.4, HZ0 + 0.03); K.add(sm); }
  solid('stove', -3.93, -2.97, FLOOR, FLOOR + 0.72, -2.95, -2.3);
  // the shelf with the coconut-shell bowl, two plates and a pot
  mbox(1.2, 0.03, 0.26, M.wood, -1.75, FLOOR + 1.05, -2.84, K, 0.5); for (const x of [-2.3, -1.2]) mbox(0.03, 0.2, 0.24, M.wood, x, FLOOR + 0.95, -2.84, K, 0.2);
  for (let i = 0; i < 2; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.015, 16), std({ color: 0xe0dcd0, roughness: 0.3 })); pl.position.set(-2.1 + i * 0.05, FLOOR + 1.075 + i * 0.016, -2.82); K.add(pl); }
  lathe([[0.001, 0], [0.09, 0], [0.1, 0.1], [0.08, 0.12], [0.001, 0.12]], std({ color: 0x8a5a3a, roughness: 0.7 }), -1.35, FLOOR + 1.065, -2.84, K, 14);
  solid('shelf', -2.38, -1.12, FLOOR + 0.84, FLOOR + 1.07, -2.98, -2.7);
  // the tapayan: a big clay water jar with a wooden lid, the dipper hanging on it
  O.tapayan = grp(-1.4, FLOOR, -1.9, H);
  lathe([[0.001, 0], [0.16, 0], [0.27, 0.18], [0.29, 0.34], [0.24, 0.52], [0.17, 0.6], [0.18, 0.64], [0.15, 0.64], [0.001, 0.6]], M.clay, 0, 0, 0, O.tapayan, 22);
  { const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 18), M.wood); lid.position.y = 0.655; lid.position.x = 0.07; lid.rotation.z = 0.05; O.tapayan.add(lid); O.jarLid = lid;
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), M.water); w.rotation.x = -Math.PI / 2; w.position.y = 0.58; O.tapayan.add(w); }
  solid('tapayan', -1.72, -1.08, FLOOR, FLOOR + 0.66, -2.22, -1.58);
  // the garlic: a plaited braid of bulbs hanging from the beam, out of reach
  O.garlic = grp(-2.5, EAVE + 0.2, -1.55, scene); O.garlic.userData.keep = true;
  { const cord = pole([0, 0, 0], [0, -0.1, 0], 0.006, M.rope, O.garlic, 4);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), std({ color: 0xe0d6c0, roughness: 0.75 })); b.scale.set(1, 0.85, 1); b.position.set(Math.sin(i * 2.1) * 0.03, -0.12 - i * 0.035, Math.cos(i * 2.1) * 0.03); O.garlic.add(b); }
    pole([0, -0.1, 0], [0, -0.44, 0], 0.012, std({ color: 0xb8a878, roughness: 1 }), O.garlic, 5); }
  // kitchen clutter: a mortar of cooking oil tins, a basket of dry coconut husks for the fire, a ladle
  { const bk = lathe([[0.001, 0], [0.2, 0], [0.24, 0.24], [0.001, 0.24]], M.bambooDark, -3.6, FLOOR, -0.5, K, 14); for (let i = 0; i < 5; i++) { const hk = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), M.coconut); hk.scale.set(1, 0.6, 1.3); hk.position.set(-3.6 + (hash1(i) - 0.5) * 0.2, FLOOR + 0.24, -0.5 + (hash1(i + 2) - 0.5) * 0.2); K.add(hk); } }
  solid('husks', -3.86, -3.34, FLOOR, FLOOR + 0.3, -0.76, -0.24);

  // --- the bedroom: the wardrobe with the matches on top, Lorna under the net, a basin and cloths for the birth
  O.aparador = grp(0.92, FLOOR, -2.05, H);
  mbox(0.6, 1.9, 1.12, M.narra, 0, 0.95, 0, O.aparador, 0.8);
  for (const z of [-0.28, 0.28]) { const dr = mbox(0.02, 1.5, 0.52, M.narra, 0.31, 1.0, z, O.aparador, 0.5); for (let k = 0; k < 6; k++) mbox(0.012, 0.02, 0.42, M.soot, 0.325, 0.6 + k * 0.16, z, O.aparador, 0.2); const kn = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.tin); kn.position.set(0.335, 1.05, z + (z < 0 ? 0.2 : -0.2)); O.aparador.add(kn); }
  mbox(0.64, 0.06, 1.16, M.narra, 0, 1.93, 0, O.aparador, 0.5);
  solid('aparador', 0.62, 1.24, FLOOR, FLOOR + 1.96, -2.63, -1.47);
  // the matchbox up on top, at the back where a pregnant woman can't reach
  O.matches = grp(0.82, FLOOR + 1.965, -2.25, scene); O.matches.userData.keep = true;
  { mbox(0.055, 0.018, 0.04, std({ color: 0xc8b878, roughness: 0.8, map: T.matchTex }), 0, 0.009, 0, O.matches, 0.05); }
  // the banig and Lorna under her net: built in part C
  // a basin, a kettle, folded cloths: Nanay got everything ready before she went
  lathe([[0.001, 0], [0.16, 0], [0.22, 0.1], [0.23, 0.12], [0.001, 0.12]], M.tin, 3.5, FLOOR, -0.45, H, 18);
  { const w = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), M.water); w.rotation.x = -Math.PI / 2; w.position.set(3.5, FLOOR + 0.09, -0.45); H.add(w); }
  for (let i = 0; i < 3; i++) mbox(0.3, 0.03, 0.22, M.checks, 3.0, FLOOR + 0.015 + i * 0.03, -0.3, H, 0.3);
  solid('basin', 3.26, 3.74, FLOOR, FLOOR + 0.13, -0.69, -0.21);
}

// the lamp: a tin kerosene gasera with a glass chimney (also used for the one in your hand)
function buildLampMesh(g) {
  lathe([[0.001, 0], [0.05, 0], [0.055, 0.01], [0.055, 0.075], [0.03, 0.09], [0.012, 0.1], [0.001, 0.1]], M.tin, 0, 0, 0, g, 16);
  cyl(0.006, 0.006, 0.025, M.iron, 0, 0.11, 0, g, 6);
  lathe([[0.022, 0], [0.028, 0.02], [0.03, 0.06], [0.022, 0.1], [0.016, 0.12]], M.glass, 0, 0.1, 0, g, 14);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 6, 16, Math.PI), M.iron); h.position.set(0, 0.07, 0); h.rotation.y = Math.PI / 2; g.add(h);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), M.flame); fl.scale.set(1, 2.2, 1); fl.position.y = 0.14; fl.visible = false; g.add(fl); g.userData.flame = fl;
  const gl = new THREE.Sprite(M.glow.clone()); gl.scale.setScalar(0.09); gl.position.y = 0.14; gl.visible = false; g.add(gl); g.userData.glow = gl;
}

/* ---------------- under the house ---------------- */
function buildUnder() {
  const U = O.under = grp(0, 0, 0, scene); U.userData.noRayMerged = true;
  // the woven screens closing in the crawlspace between the posts; one at the back is only lashed shut
  const PX = [HX0, -1.33, 1.33, HX1];
  const skirt = (x0, z0, x1, z1, id) => { const m = wallPanel(x0, z0, x1, z1, 0.02, FLOOR_BOT, [], M.sawaliDark, U, 0.03); wallSolids('sk_' + id, x0, z0, x1, z1, 0, FLOOR_BOT, [], 0.06); return m; };
  for (let i = 0; i < 3; i++) { skirt(PX[i], HZ1 + 0.06, PX[i + 1], HZ1 + 0.06, 's' + i); if (i < 2) skirt(PX[i], HZ0 - 0.06, PX[i + 1], HZ0 - 0.06, 'n' + i); }
  skirt(HX0 - 0.06, HZ0, HX0 - 0.06, 0, 'w0'); skirt(HX0 - 0.06, 0, HX0 - 0.06, HZ1, 'w1'); skirt(HX1 + 0.06, HZ0, HX1 + 0.06, 0, 'e0'); skirt(HX1 + 0.06, 0, HX1 + 0.06, HZ1, 'e1');
  // the lashed panel: its own group so it can fall open
  O.panelPivot = grp(1.33, 0.02, HZ0 - 0.08, scene); O.panelPivot.userData.keep = true;
  { const len = HX1 - 1.33; const g = holedGeo(0, len, 0, FLOOR_BOT - 0.04, [], 0.03); uvScale(g, 1 / 0.75, 1 / 0.75); const pm = new THREE.Mesh(g, M.sawaliDark); pm.castShadow = true; pm.receiveShadow = true; pm.position.set(0, 0, 0); O.panelPivot.add(pm);
    for (const y of [0.05, FLOOR_BOT - 0.08]) pole([0, y, -0.02], [len, y, -0.02], 0.025, M.bambooDark, O.panelPivot, 6);
    O.lash = grp(len - 0.06, 0, -0.04, O.panelPivot);
    for (const y of [0.3, 0.75, 1.1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), M.rope); t.position.set(0.06, y, 0); t.rotation.y = Math.PI / 2; t.scale.set(1, 1.4, 1); O.lash.add(t); }
  }
  O.panelSolid = solid('panel', 1.33, HX1, 0, FLOOR_BOT, HZ0 - 0.11, HZ0 - 0.05);
  // the floor's underside: slats with light lines between (you see it from below)
  { const u = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(HX1 - HX0, HZ1 - HZ0), 8 / 0.9, 6 / 0.9), M.slats); u.rotation.x = Math.PI / 2; u.position.y = FLOOR_BOT + 0.11; U.add(u); }
  // junk down here: firewood, jars, a cart wheel, a chicken coop, an old door, coconut husks
  const wood = (x, z, w, d, h, ry = 0) => { const g = grp(x, 0, z, U); g.rotation.y = ry; for (let i = 0; i < Math.round(h / 0.09); i++) for (let k = 0; k < Math.round(w / 0.1); k++) { const p = pole([-d / 2, 0.05 + i * 0.09, -w / 2 + 0.05 + k * 0.1 + (i % 2) * 0.03], [d / 2, 0.05 + i * 0.09, -w / 2 + 0.05 + k * 0.1 + (i % 2) * 0.03], 0.045, M.woodDark, g, 6); } return g; };
  wood(-0.35, -0.95, 0.9, 1.1, 0.75, Math.PI / 2); solid('u_wood1', -0.95, 0.25, 0, 0.78, -1.45, -0.45);
  wood(1.6, 1.9, 0.6, 0.9, 0.6, 0.2); solid('u_wood2', 1.15, 2.05, 0, 0.62, 1.55, 2.25);
  const jar = (x, z, s) => { lathe([[0.001, 0], [0.13 * s, 0], [0.22 * s, 0.16 * s], [0.22 * s, 0.32 * s], [0.12 * s, 0.48 * s], [0.13 * s, 0.52 * s], [0.001, 0.52 * s]], M.clay, x, 0, z, U, 16); solid('u_jar' + x, x - 0.22 * s, x + 0.22 * s, 0, 0.52 * s, z - 0.22 * s, z + 0.22 * s); };
  jar(-1.9, -2.2, 1.0); jar(-2.35, -2.35, 0.8); jar(0.6, 0.6, 1.1); jar(-3.4, 0.4, 0.9); jar(3.3, 2.4, 0.9);
  // the chicken coop: a bamboo cage, three hens muttering in it
  O.coop = grp(2.7, 0, 0.9, U); for (let i = 0; i < 8; i++) { pole([-0.5 + i * 0.14, 0, -0.35], [-0.5 + i * 0.14, 0.55, -0.35], 0.012, M.bamboo, O.coop, 4); pole([-0.5 + i * 0.14, 0, 0.35], [-0.5 + i * 0.14, 0.55, 0.35], 0.012, M.bamboo, O.coop, 4); }
  for (const y of [0.02, 0.55]) for (const z of [-0.35, 0.35]) pole([-0.52, y, z], [0.52, y, z], 0.02, M.bambooDark, O.coop, 4);
  for (let i = 0; i < 3; i++) { const hen = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), std({ color: [0x3a2416, 0x8a5a2a, 0x1a1410][i], roughness: 0.9 })); hen.scale.set(1.3, 1, 0.9); hen.position.set(-0.3 + i * 0.3, 0.12, (hash1(i) - 0.5) * 0.3); O.coop.add(hen); }
  solid('u_coop', 2.15, 3.25, 0, 0.58, 0.52, 1.28);
  { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 18), M.woodDark); wh.position.set(-1.0, 0.45, 1.9); wh.rotation.set(0, 0.6, 0.15); U.add(wh); for (let i = 0; i < 6; i++) { const sp = pole([0, 0, 0], [Math.cos(i / 6 * TAU) * 0.43, Math.sin(i / 6 * TAU) * 0.43, 0], 0.015, M.woodDark, U, 4); sp.parent.remove(sp); wh.add(sp); } solid('u_wheel', -1.3, -0.7, 0, 0.9, 1.65, 2.15); }
  { const od = mbox(0.8, 1.15, 0.04, M.woodDark, -3.2, 0.6, -1.4, U, 0.6); od.rotation.set(0.22, 0.9, 0); solid('u_door', -3.6, -2.8, 0, 1.0, -1.75, -1.05); }
  for (let i = 0; i < 9; i++) { const hk = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 5), M.coconut); hk.scale.set(1, 0.6, 1.4); hk.position.set(-2.9 + hash1(i * 5) * 0.8, 0.05, -0.2 + hash1(i * 3) * 0.6); hk.rotation.y = i; U.add(hk); }
  solid('u_husk', -2.95, -2.05, 0, 0.14, -0.25, 0.45);
  // the floor of the crawlspace: dry dust, darker than the mud outside
  { const d = new THREE.Mesh(new THREE.PlaneGeometry(HX1 - HX0, HZ1 - HZ0), std({ map: T.mud.map, color: 0x6a5a4a, roughness: 1 })); d.rotation.x = -Math.PI / 2; d.position.y = 0.012; d.receiveShadow = true; U.add(d); }
}

/* =====================================================================
   TIK-TIK · part C: the yard (fence and gate, granary, pigpen, outhouse, stump, mortar,
   crate, trees, washing line), the fields and the storm; Lorna under her net; the thing
   with wings; what it left standing under the house; lights and rain.
   ===================================================================== */
function buildYard() {
  const Y = O.yard = grp(0, 0, 0, scene); Y.userData.noRayMerged = true;
  // the ground: wet earth out to the fields
  { const g = new THREE.PlaneGeometry(110, 110, 110, 110); uvScale(g, 28, 28);
    // big, slow variation over the tiled mud: wet dark patches, trampled paths, grass toward the fence
    const pa = g.attributes.position, col = [];
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = -pa.getY(i); const n = fbm(x * 0.07 + 10, z * 0.07 + 3, 4), w = fbm(x * 0.21, z * 0.21, 3); const path = Math.exp(-Math.pow(x * 0.9, 2)) * (z > 4 && z < 13 ? 1 : 0); const yard = x > YARD.x0 && x < YARD.x1 && z > YARD.z0 && z < YARD.z1 ? 1 : 0; let c = mixc([0.62, 0.55, 0.46], [0.42, 0.37, 0.31], clamp(n * 1.4 - 0.2, 0, 1)); c = mixc(c, [0.3, 0.27, 0.24], clamp((w - 0.55) * 4, 0, 1)); c = mixc(c, [0.5, 0.52, 0.36], (1 - yard) * 0.5 + clamp((Math.max(Math.abs(x) - 11, z < -10 ? 1 : 0)) * 0.3, 0, 0.5) * yard); c = mixc(c, [0.7, 0.62, 0.5], path * 0.4); col.push(c[0], c[1], c[2]); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, M.mud); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.userData.noRay = true; scene.add(m); O.ground = m; }
  // stepping stones from the front steps to the gate
  for (let i = 0; i < 12; i++) { const s = mbox(0.42 + hash1(i) * 0.15, 0.06, 0.34 + hash1(i + 9) * 0.12, M.mudDark, Math.sin(i * 0.7) * 0.25, 0.02, 5.0 + i * 0.68, Y, 0.4); s.rotation.y = hash1(i * 3) * 0.8; }
  // ---- the fence: close-set bamboo, with a plank gate at the south
  const POLES = []; const addRun = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(len / 0.13); for (let i = 0; i <= n; i++) POLES.push([lerp(x0, x1, i / n), lerp(z0, z1, i / n)]); };
  const F = YARD;
  addRun(F.x0, F.z0, F.x1, F.z0); addRun(F.x1, F.z0, F.x1, F.z1); addRun(F.x0, F.z0, F.x0, F.z1); addRun(F.x0, F.z1, GATE.x0 - 0.1, F.z1); addRun(GATE.x1 + 0.1, F.z1, F.x1, F.z1);
  { const g = new THREE.CylinderGeometry(0.03, 0.035, 1.8, 6); uvScale(g, 1, 3.6); const im = new THREE.InstancedMesh(g, M.bambooDark, POLES.length); const mm = new THREE.Matrix4();
    POLES.forEach(([x, z], i) => { const h = 1.55 + hash1(i * 1.7) * 0.35; mm.compose(new THREE.Vector3(x, h / 2 - 0.05, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((hash1(i) - 0.5) * 0.06, 0, (hash1(i + 4) - 0.5) * 0.06)), new THREE.Vector3(1, h / 1.8, 1)); im.setMatrixAt(i, mm); });
    im.castShadow = true; im.receiveShadow = true; im.userData.noRay = true; scene.add(im); O.fence = im; }
  for (const y of [0.45, 1.25]) { pole([F.x0, y, F.z0], [F.x1, y, F.z0], 0.035, M.bamboo, Y, 6); pole([F.x1, y, F.z0], [F.x1, y, F.z1], 0.035, M.bamboo, Y, 6); pole([F.x0, y, F.z0], [F.x0, y, F.z1], 0.035, M.bamboo, Y, 6); pole([F.x0, y, F.z1], [GATE.x0, y, F.z1], 0.035, M.bamboo, Y, 6); pole([GATE.x1, y, F.z1], [F.x1, y, F.z1], 0.035, M.bamboo, Y, 6); }
  const t = 0.12;
  solid('fS', F.x0, F.x1, 0, 2.2, F.z0 - t, F.z0 + t); solid('fE', F.x1 - t, F.x1 + t, 0, 2.2, F.z0, F.z1); solid('fW', F.x0 - t, F.x0 + t, 0, 2.2, F.z0, F.z1);
  solid('fN1', F.x0, GATE.x0, 0, 2.2, F.z1 - t, F.z1 + t); solid('fN2', GATE.x1, F.x1, 0, 2.2, F.z1 - t, F.z1 + t);
  // gate posts and the two plank leaves, barred on the inside
  for (const x of [GATE.x0 - 0.06, GATE.x1 + 0.06]) mbox(0.14, 2.0, 0.14, M.woodDark, x, 1.0, F.z1, Y, 0.5);
  O.gateL = grp(GATE.x0, 0, F.z1, scene); O.gateR = grp(GATE.x1, 0, F.z1, scene); O.gateL.userData.keep = O.gateR.userData.keep = true;
  for (const [g, s] of [[O.gateL, 1], [O.gateR, -1]]) { for (let i = 0; i < 5; i++) mbox(0.2, 1.62, 0.035, M.wood, s * (0.11 + i * 0.21), 0.86, 0, g, 0.6); for (const y of [0.35, 1.35]) mbox(1.05, 0.08, 0.04, M.woodDark, s * 0.54, y, -0.04, g, 0.5); }
  O.gateBar = mbox(2.5, 0.09, 0.06, M.wood, 0, 0.95, F.z1 - 0.1, scene, 0.6); O.gateBar.userData.keep = true;
  O.gateSolid = solid('gate', GATE.x0, GATE.x1, 0, 2.0, F.z1 - t, F.z1 + t);
  // ---- the granary (kamalig): raised on posts, its ladder broken, a padlock on the door
  const G2 = GRAN, gy = G2.floor, gw = G2.wall;
  const GR = O.gran = grp(0, 0, 0, Y);
  for (const x of [G2.x0, (G2.x0 + G2.x1) / 2, G2.x1]) for (const z of [G2.z0, G2.z1]) { mbox(0.14, gy + gw, 0.14, M.woodDark, x, (gy + gw) / 2, z, GR, 0.5); solid('gp' + x + z, x - 0.08, x + 0.08, 0, gy, z - 0.08, z + 0.08); }
  { const g = new THREE.BoxGeometry(G2.x1 - G2.x0 + 0.1, 0.1, G2.z1 - G2.z0 + 0.1); uvScale(g, 3, 3); const f = new THREE.Mesh(g, M.slats); f.position.set((G2.x0 + G2.x1) / 2, gy - 0.05, (G2.z0 + G2.z1) / 2); f.castShadow = f.receiveShadow = true; GR.add(f); }
  solid('gFloor', G2.x0 - 0.05, G2.x1 + 0.05, gy - 0.12, gy, G2.z0 - 0.05, G2.z1 + 0.05);
  wallPanel(G2.x0, G2.z0, G2.x1, G2.z0, gy, gy + gw, [], M.sawaliDark, GR); wallPanel(G2.x1, G2.z1, G2.x0, G2.z1, gy, gy + gw, [], M.sawaliDark, GR);
  wallPanel(G2.x0, G2.z1, G2.x0, G2.z0, gy, gy + gw, [], M.sawaliDark, GR);
  wallPanel(G2.x1, G2.z0, G2.x1, G2.z1, gy, gy + gw, [[-9.4 - G2.z0, -8.6 - G2.z0, 0, gw]], M.sawaliDark, GR);
  wallSolids('gwS', G2.x0, G2.z0, G2.x1, G2.z0, gy, gy + 2.2); wallSolids('gwN', G2.x0, G2.z1, G2.x1, G2.z1, gy, gy + 2.2); wallSolids('gwW', G2.x0, G2.z0, G2.x0, G2.z1, gy, gy + 2.2);
  wallSolids('gwE', G2.x1, G2.z0, G2.x1, G2.z1, gy, gy + 2.2, [[-9.4 - G2.z0, -8.6 - G2.z0]]);
  solid('gCeil', G2.x0, G2.x1, gy + 1.92, gy + 2.0, G2.z0, G2.z1);
  // door frame up into the gable, so you can stand in it
  for (const z of [-9.42, -8.58]) mbox(0.08, 1.9, 0.08, M.woodDark, G2.x1 + 0.02, gy + 0.95, z, GR, 0.5);
  mbox(0.08, 0.08, 0.92, M.woodDark, G2.x1 + 0.02, gy + 1.9, -9.0, GR, 0.5);
  wallPanel(G2.x1 + 0.01, -9.5, G2.x1 + 0.01, -8.5, gy + gw, gy + 1.9, [], M.sawaliDark, GR);
  // a steep thatched roof
  { const cx = (G2.x0 + G2.x1) / 2, cz = (G2.z0 + G2.z1) / 2, r = Math.hypot(G2.x1 - G2.x0, G2.z1 - G2.z0) / 2 + 0.7;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 2.0, 4, 3, true), M.thatch); cone.rotation.y = Math.PI / 4; cone.position.set(cx, gy + gw + 0.85, cz); cone.castShadow = true; cone.receiveShadow = true; Y.add(cone);
    uvScale(cone.geometry, 6, 3); }
  // the door leaf, padlocked shut with a hasp
  O.granDoor = grp(G2.x1 + 0.03, gy, -9.4, scene); O.granDoor.userData.keep = true;
  mbox(0.04, 1.84, 0.8, M.wood, 0, 0.92, 0.4, O.granDoor, 0.6); for (const y of [0.3, 1.5]) mbox(0.05, 0.08, 0.8, M.woodDark, 0.02, y, 0.4, O.granDoor, 0.4);
  O.padlock = grp(G2.x1 + 0.08, gy + 1.0, -8.62, scene); O.padlock.userData.keep = true;
  { const b = mbox(0.05, 0.06, 0.03, M.rust, 0, 0, 0, O.padlock, 0.05); const sh = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 10, Math.PI), M.iron); sh.position.y = 0.03; sh.rotation.y = Math.PI / 2; O.padlock.add(sh); }
  O.granDoorSolid = solid('granDoor', G2.x1 - 0.03, G2.x1 + 0.06, gy, gy + 1.9, -9.42, -8.58);
  // the broken ladder: rails, one rung left at the very top, the rest snapped off in the mud
  { pole([G2.x1 + 0.75, 0, -9.35], [G2.x1 + 0.08, gy + 0.2, -9.32], 0.03, M.bambooDark, GR, 6); pole([G2.x1 + 0.75, 0, -8.65], [G2.x1 + 0.08, gy + 0.2, -8.68], 0.03, M.bambooDark, GR, 6);
    pole([G2.x1 + 0.2, gy - 0.25, -9.33], [G2.x1 + 0.2, gy - 0.25, -8.67], 0.022, M.bambooDark, GR, 6);
    for (let i = 0; i < 3; i++) { const p = pole([0, 0, 0], [0.62, 0, 0], 0.02, M.bambooDark, GR, 6); p.position.set(G2.x1 + 0.9 + i * 0.2, 0.03, -8.4 + i * 0.25); p.rotation.y = i * 0.9; } }
  // inside: sacks of palay, baskets, the salt jar with a stone on its lid
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), std({ color: 0x8a7a5a, roughness: 1 })); s.scale.set(1, 0.7, 0.75); s.position.set(G2.x0 + 0.45 + (i % 3) * 0.65, gy + 0.22 + Math.floor(i / 3) * 0.4, G2.z0 + 0.5 + (i % 2) * 0.1); s.rotation.y = i; s.castShadow = true; GR.add(s); }
  solid('gSacks', G2.x0, G2.x0 + 2.2, gy, gy + 1.0, G2.z0, G2.z0 + 0.9);
  for (let i = 0; i < 3; i++) { const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.06, 18), M.bamboo); bs.position.set(G2.x0 + 0.4, gy + 0.03 + i * 0.065, G2.z1 - 0.45); GR.add(bs); }
  O.saltJar = grp(G2.x0 + 0.55, gy, -8.6, scene); O.saltJar.userData.keep = true;
  lathe([[0.001, 0], [0.16, 0], [0.26, 0.18], [0.26, 0.36], [0.17, 0.52], [0.18, 0.56], [0.001, 0.56]], M.clay, 0, 0, 0, O.saltJar, 18);
  { const s = new THREE.Mesh(new THREE.CircleGeometry(0.15, 14), M.salt); s.rotation.x = -Math.PI / 2; s.position.y = 0.5; O.saltJar.add(s); for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.02), M.salt); c.position.set((hash1(i) - 0.5) * 0.2, 0.51, (hash1(i + 5) - 0.5) * 0.2); c.rotation.set(i, i * 2, 0); O.saltJar.add(c); } }
  O.saltLid = grp(0, 0.565, 0, O.saltJar);
  { const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), M.wood); O.saltLid.add(lid); const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), M.mudDark); st.position.y = 0.09; st.scale.set(1.2, 0.8, 1); O.saltLid.add(st); }
  solid('saltJar', G2.x0 + 0.27, G2.x0 + 0.83, gy, gy + 0.62, -8.88, -8.32);
  // ---- the pigpen: two pigs in the mud under a lean-to
  const PP = { x0: 5, x1: 9, z0: -11.5, z1: -8.5 };
  const pen = O.pen = grp(0, 0, 0, Y);
  for (const [a, b] of [[[PP.x0, PP.z1], [PP.x1, PP.z1]], [[PP.x1, PP.z0], [PP.x1, PP.z1]], [[PP.x0, PP.z0], [PP.x0, PP.z1]]]) { for (const y of [0.3, 0.75]) pole([a[0], y, a[1]], [b[0], y, b[1]], 0.04, M.bambooDark, pen, 6); const len = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let i = 0; i <= len / 0.5; i++) { const k = i / Math.floor(len / 0.5); pole([lerp(a[0], b[0], k), 0, lerp(a[1], b[1], k)], [lerp(a[0], b[0], k), 0.9, lerp(a[1], b[1], k)], 0.035, M.bambooDark, pen, 6); } }
  solid('penN', PP.x0, PP.x1, 0, 0.9, PP.z1 - 0.06, PP.z1 + 0.06); solid('penE', PP.x1 - 0.06, PP.x1 + 0.06, 0, 0.9, PP.z0, PP.z1); solid('penW', PP.x0 - 0.06, PP.x0 + 0.06, 0, 0.9, PP.z0, PP.z1);
  { for (const x of [PP.x0, PP.x1]) { pole([x, 0, PP.z0], [x, 2.2, PP.z0], 0.05, M.woodDark, pen, 6); pole([x, 0, PP.z0 + 1.5], [x, 1.7, PP.z0 + 1.5], 0.05, M.woodDark, pen, 6); }
    const lean = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(PP.x1 - PP.x0 + 0.6, 1.9), 4, 2), M.thatch); lean.position.set((PP.x0 + PP.x1) / 2, 2.0, PP.z0 + 0.75); lean.rotation.x = -Math.PI / 2 + 0.3; lean.castShadow = true; lean.receiveShadow = true; pen.add(lean); }
  O.pigs = [];
  for (let i = 0; i < 2; i++) { const pg = grp(6.2 + i * 1.6, 0, -10.6 + i * 0.4, scene); pg.rotation.y = 0.4 + i * 2.2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), M.pig); b.scale.set(0.75, 0.62, 1.15); b.position.y = 0.42; pg.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M.pig); h.position.set(0, 0.45, 0.5); pg.add(h); const sn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.08, 10), std({ color: 0x5a4440, roughness: 0.7 })); sn.rotation.x = Math.PI / 2; sn.position.set(0, 0.42, 0.68); pg.add(sn); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), M.pig); e.position.set(s * 0.1, 0.6, 0.45); e.rotation.x = 0.6; pg.add(e); } for (const [x, z] of [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.22, 6), M.pig); l.position.set(x, 0.11, z); pg.add(l); } pg.traverse(c => c.castShadow = true); pg.userData.body = b; O.pigs.push(pg); }
  { const tr = mbox(0.8, 0.18, 0.3, M.woodDark, 7.8, 0.09, -8.9, pen, 0.4); }
  // ---- the outhouse: a little sawali booth with a door that shuts
  const OH = { x0: 9.6, x1: 10.8, z0: -3.4, z1: -2.2 };
  const oh = O.outhouse = grp(0, 0, 0, Y);
  wallPanel(OH.x0, OH.z0, OH.x1, OH.z0, 0.1, 2.0, [], M.sawaliDark, oh); wallPanel(OH.x1, OH.z0, OH.x1, OH.z1, 0.1, 2.0, [], M.sawaliDark, oh); wallPanel(OH.x1, OH.z1, OH.x0, OH.z1, 0.1, 2.0, [], M.sawaliDark, oh);
  wallPanel(OH.x0, OH.z1, OH.x0, OH.z0, 0.1, 2.0, [[0.2, 1.0, 0, 1.75]], M.sawaliDark, oh);
  { const r = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(1.7, 1.7), 2, 2), M.thatch); r.position.set((OH.x0 + OH.x1) / 2, 2.15, (OH.z0 + OH.z1) / 2); r.rotation.x = -Math.PI / 2 + 0.15; r.castShadow = true; oh.add(r); }
  mbox(1.1, 0.12, 1.1, M.woodDark, (OH.x0 + OH.x1) / 2, 0.06, (OH.z0 + OH.z1) / 2, oh, 0.5);
  wallSolids('ohS', OH.x0, OH.z0, OH.x1, OH.z0, 0, 2.2); wallSolids('ohE', OH.x1, OH.z0, OH.x1, OH.z1, 0, 2.2); wallSolids('ohN', OH.x0, OH.z1, OH.x1, OH.z1, 0, 2.2); wallSolids('ohW', OH.x0, OH.z0, OH.x0, OH.z1, 0, 2.2, [[0.2, 1.0]]);
  solid('ohCeil', OH.x0, OH.x1, 2.0, 2.1, OH.z0, OH.z1);
  O.ohDoor = grp(OH.x0 - 0.02, 0.1, OH.z0 + 0.2, scene); O.ohDoor.userData.keep = true; mbox(0.03, 1.7, 0.8, M.wood, 0, 0.85, 0.4, O.ohDoor, 0.6);
  O.ohDoorSolid = solid('ohDoor', OH.x0 - 0.05, OH.x0 + 0.02, 0, 1.9, OH.z0 + 0.2, OH.z0 + 1.0); O.ohDoorSolid.on = false;
  O.OH = OH;
  // ---- the chopping stump and woodpile, Tatay's bolo sunk in the stump
  O.stump = grp(POS.stump.x, 0, POS.stump.z, scene); O.stump.userData.keep = true;
  { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.46, 14), M.woodDark); st.position.y = 0.23; st.castShadow = st.receiveShadow = true; O.stump.add(st); const tp = new THREE.Mesh(new THREE.CircleGeometry(0.26, 14), std({ color: 0x8a6a48, roughness: 0.9 })); tp.rotation.x = -Math.PI / 2; tp.position.y = 0.461; O.stump.add(tp); }
  solid('stump', POS.stump.x - 0.26, POS.stump.x + 0.26, 0, 0.46, POS.stump.z - 0.26, POS.stump.z + 0.26);
  { const wp = grp(7.6, 0, 0.6, Y); wp.rotation.y = 0.3; for (let i = 0; i < 5; i++) for (let k = 0; k < 6; k++) pole([-0.6, 0.06 + i * 0.11, -0.4 + k * 0.14 + (i % 2) * 0.05], [0.6, 0.06 + i * 0.11, -0.4 + k * 0.14 + (i % 2) * 0.05], 0.055, M.woodDark, wp, 6); solid('woodpile', 6.9, 8.3, 0, 0.6, 0.0, 1.2); }
  // ---- the mortar (lusong) at the back of the house, the pestle leaning by it
  O.mortar = grp(POS.mortar.x, 0, POS.mortar.z, scene); O.mortar.userData.keep = true;
  { lathe([[0.001, 0], [0.24, 0], [0.22, 0.12], [0.17, 0.26], [0.19, 0.38], [0.25, 0.55], [0.18, 0.55], [0.12, 0.42], [0.001, 0.4]], M.woodDark, 0, 0, 0, O.mortar, 18); const pit = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), M.soot); pit.rotation.x = -Math.PI / 2; pit.position.y = 0.43; O.mortar.add(pit); O.mortarPaste = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), M.garlicPaste); O.mortarPaste.rotation.x = -Math.PI / 2; O.mortarPaste.position.y = 0.44; O.mortarPaste.visible = false; O.mortar.add(O.mortarPaste);
    O.mortarCloves = grp(0, 0.45, 0, O.mortar); O.mortarCloves.visible = false; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), std({ color: 0xe0d6c0, roughness: 0.75 })); c.position.set(Math.cos(i) * 0.05, 0, Math.sin(i) * 0.05); O.mortarCloves.add(c); } }
  O.pestle = grp(-4.18, 0, -3.15, scene); O.pestle.userData.keep = true;
  { const p = pole([0, 0, 0], [0, 1.45, 0], 0.035, M.wood, O.pestle, 8); O.pestle.rotation.z = -0.12; O.pestle.rotation.x = 0.05; }
  // ---- the crate by the pigpen
  O.crate = grp(4.4, 0, -7.6, scene); O.crate.userData.keep = true;
  { mbox(0.62, 0.55, 0.62, M.wood, 0, 0.275, 0, O.crate, 0.4); for (const y of [0.05, 0.5]) for (const s of [-1, 1]) { mbox(0.64, 0.06, 0.04, M.woodDark, 0, y, s * 0.31, O.crate, 0.3); mbox(0.04, 0.06, 0.64, M.woodDark, s * 0.31, y, 0, O.crate, 0.3); } }
  // ---- a washing line between the house and the mango tree, a white dress on it
  { const a = [-4.6, 2.05, 5.2], b = [-9.0, 2.15, 4.2]; pole([a[0], 0, a[2]], a, 0.04, M.bambooDark, Y, 6); pole([b[0], 0, b[2]], b, 0.04, M.bambooDark, Y, 6); pole(a, b, 0.006, M.rope, Y, 4);
    O.washing = []; [[0.2, 0x8a3a3a, 0.5], [0.45, 0xe0dcd0, 1.0], [0.7, 0x3a4a6a, 0.55]].forEach(([k, c, l], i) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, l, 3, 6), std({ color: c, roughness: 0.95, side: THREE.DoubleSide })); w.geometry.translate(0, -l / 2, 0); const p = new THREE.Vector3(...a).lerp(new THREE.Vector3(...b), k); w.position.copy(p); w.rotation.y = Math.atan2(b[2] - a[2], b[0] - a[0]) * -1; w.castShadow = true; scene.add(w); w.userData.keep = true; w.userData.noRay = true; O.washing.push(w); }); }
  // ---- trees
  O.sway = [];
  const palm = (x, z, h, lean) => {
    const pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([x + Math.sin(lean) * k * k * 1.6, k * h, z + Math.cos(lean) * k * k * 1.6]); }
    const tr = tube(pts, 0.14, M.trunk, Y, 20, 8); tr.castShadow = true;
    const top = new THREE.Vector3(...pts[6]); const crown = grp(top.x, top.y, top.z, scene); crown.userData.keep = true;
    for (let i = 0; i < 13; i++) { const a = i / 13 * TAU + hash1(x + i) * 0.3, len = 2.6 + hash1(i + z) * 0.8; const g = new THREE.PlaneGeometry(0.75, len, 1, 6); g.translate(0, len / 2, 0); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k) / len; p.setZ(k, -yy * yy * 1.2); } g.computeVertexNormals(); const f = new THREE.Mesh(g, M.frond); f.rotation.set(-1.1 + hash1(i * 3) * 0.5, a, 0, 'YXZ'); f.castShadow = true; crown.add(f); }
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M.coconut); c.position.set(Math.cos(i * 1.3) * 0.2, -0.2, Math.sin(i * 1.3) * 0.2); crown.add(c); }
    O.sway.push({ o: crown, a: 0.05, f: 0.8 + hash1(x) * 0.3, ph: x });
    solid('palm' + x, x - 0.18, x + 0.18, 0, 3, z - 0.18, z + 0.18);
    return top;
  };
  O.perches = [];
  O.perches.push(palm(-12.5, 10.5, 9.5, 0.6), palm(12.6, 9.5, 8.8, -0.4), palm(-7.0, -12.6, 9.2, 2.6), palm(13.2, -12.4, 10.0, -2.2));
  // the mango tree: a dark heavy crown over the west yard
  { const x = -9.2, z = 4.0; tube([[x, 0, z], [x + 0.2, 1.6, z], [x - 0.1, 2.8, z + 0.2]], 0.32, M.trunk, Y, 10, 10);
    for (const [bx, by, bz] of [[-0.8, 3.2, 0.6], [0.9, 3.4, -0.3], [0.1, 3.6, -1.0]]) tube([[x, 2.4, z], [x + bx * 0.6, by - 0.4, z + bz * 0.6], [x + bx, by, z + bz]], 0.12, M.trunk, Y, 8, 6);
    const cr = grp(x, 0, z, scene); cr.userData.keep = true;
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + hash1(i) * 0.6, 1), M.leafDark); b.position.set((hash1(i * 2) - 0.5) * 3.2, 3.9 + hash1(i * 5) * 1.6, (hash1(i * 7) - 0.5) * 3.2); b.scale.set(1, 0.7, 1); b.castShadow = true; cr.add(b); }
    O.sway.push({ o: cr, a: 0.015, f: 0.5, ph: 2 });
    solid('mango', x - 0.35, x + 0.35, 0, 3, z - 0.35, z + 0.35);
    O.perches.push(new THREE.Vector3(x, 5.6, z)); }
  // banana clumps: big torn leaves that thrash in the wind
  const banana = (x, z) => { const g = grp(x, 0, z, scene); g.userData.keep = true; for (let s = 0; s < 3; s++) { const ox = (hash1(x + s) - 0.5) * 0.8, oz = (hash1(z + s) - 0.5) * 0.8, h = 2.2 + hash1(s + x) * 0.8; pole([ox, 0, oz], [ox * 1.1, h, oz * 1.1], 0.09, std({ color: 0x3a4a22, roughness: 0.7 }), g, 8, 0.07); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + s, len = 1.8 + hash1(i + s * 5) * 0.6; const lg = new THREE.PlaneGeometry(0.55, len, 1, 5); lg.translate(0, len / 2, 0); const p = lg.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k) / len; p.setZ(k, -yy * yy * 0.9); } lg.computeVertexNormals(); const lf = new THREE.Mesh(lg, M.banana); lf.position.set(ox * 1.1, h - 0.1, oz * 1.1); lf.rotation.set(-0.5 - hash1(i) * 0.6, a, 0, 'YXZ'); lf.castShadow = true; g.add(lf); O.sway.push({ o: lf, a: 0.18, f: 1.6 + hash1(i + s) * 0.8, ph: i + s * 3 + x, base: lf.rotation.x }); } } solid('banana' + x, x - 0.45, x + 0.45, 0, 2, z - 0.45, z + 0.45); };
  banana(9.4, 5.6); banana(-13.2, -3.4); banana(2.8, -12.2); banana(12.4, 2.4); banana(-5.6, 9.6);
  // ---- beyond the fence: paddies of black water, dikes, the treeline, a dark hut far off
  { const pad = new THREE.Mesh(new THREE.RingGeometry(24, 60, 32, 1), M.water); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.03; pad.userData.noRay = true; scene.add(pad);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, d = mbox(0.6, 0.25, 34, M.mudDark, Math.cos(a) * 40, 0.12, Math.sin(a) * 40, scene, 1); d.rotation.y = -a; d.userData.noRay = true; }
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(62, 62, 14, 48, 1, true), new THREE.MeshBasicMaterial({ map: T.trees, transparent: true, side: THREE.BackSide, fog: false, color: 0x000000, depthWrite: false })); ring.position.y = 5.5; T.trees.repeat.set(4, 1); ring.userData.noRay = true; scene.add(ring); O.treeRing = ring;
    const hut = grp(-30, 0, 34, scene); mbox(3, 2.2, 2.6, M.sawaliDark, 0, 2.2, 0, hut, 1); const hr = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.8, 4), M.thatch); hr.rotation.y = Math.PI / 4; hr.position.y = 4.2; hut.add(hr); for (const [x, z] of [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]]) pole([x, 0, z], [x, 1.1, z], 0.06, M.woodDark, hut, 6); noRay(hut); }
  // the sky
  { const sk = new THREE.Mesh(new THREE.SphereGeometry(85, 32, 16, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: T.sky, side: THREE.BackSide, fog: false, color: 0x8090a0 })); sk.userData.noRay = true; scene.add(sk); O.sky = sk; }
}

/* ---------------- Lorna, under the mosquito net ---------------- */
function buildLorna() {
  const g = O.lorna = grp(2.45, FLOOR, -2.2, scene); g.userData.keep = true;
  // banig and pillow
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.95), M.banig); m.rotation.x = -Math.PI / 2; m.position.y = 0.008; m.receiveShadow = true; g.add(m); }
  mbox(0.32, 0.12, 0.5, M.checks, 0.78, 0.07, 0, g, 0.2);
  // under the blanket: legs drawn up, the belly high
  { const BW = 1.55, BD = 1.0, gg = new THREE.PlaneGeometry(BW, BD, 40, 24); gg.rotateX(-Math.PI / 2); const pa = gg.attributes.position;
    // the shape under it: legs drawn up at the knees, the belly high, her hips and shoulders; the edges fall to the mat
    const bump = (x, z, cx, cz, rx, rz, h) => h * Math.exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2) * 2.2);
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); let h = bump(x, z, 0.05, 0, 0.36, 0.3, 0.27) + bump(x, z, -0.5, 0.02, 0.24, 0.3, 0.3) + bump(x, z, 0.42, 0, 0.32, 0.3, 0.12) + bump(x, z, -0.2, 0, 0.95, 0.32, 0.12); h = Math.min(h, 0.4); h += Math.sin(x * 9 + z * 5) * 0.008; const edge = Math.min(1, (BD / 2 - Math.abs(z)) / 0.08, (BW / 2 - Math.abs(x)) / 0.08); pa.setY(i, Math.max(0.01, h) * Math.max(0, edge) + 0.008); }
    gg.computeVertexNormals(); const bl = new THREE.Mesh(gg, std({ map: T.checks, roughness: 0.95, side: THREE.DoubleSide })); bl.position.x = -0.1; bl.castShadow = true; bl.receiveShadow = true; g.add(bl); }
  // her shoulders and head on the pillow, turned a little toward the room
  const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.22, 6, 10), std({ color: 0xc8b8a0, roughness: 0.8 })); sh.rotation.x = Math.PI / 2; sh.position.set(0.5, 0.1, 0); g.add(sh);
  O.lornaNeck = grp(0.64, 0.14, 0, g);
  const head = grp(0.08, 0.02, 0, O.lornaNeck); O.lornaHead = head;
  { const h = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 14), std({ color: 0x9a7058, roughness: 0.55, map: T.lornaFace })); h.scale.set(0.88, 1.05, 0.92); h.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); head.add(h); h.castShadow = true;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12, 0, TAU, 0, Math.PI * 0.6), std({ color: 0x0a0806, roughness: 0.5 })); hair.rotation.z = -Math.PI / 2; hair.position.x = 0.02; hair.scale.set(1, 1.05, 1.1); head.add(hair);
    for (let i = 0; i < 5; i++) { const st = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.3), M.hair); st.rotation.set(-Math.PI / 2, 0, (i - 2) * 0.35); st.position.set(0.18, -0.08, (i - 2) * 0.05); head.add(st); } }
  // her arm on the belly; the other arm, which reaches out from under the net for the water
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.36, 4, 8), std({ color: 0x9a7058, roughness: 0.6 })); arm.rotation.set(0, 0, Math.PI / 2 + 0.3); arm.position.set(0.22, 0.38, 0.12); g.add(arm);
  O.lornaArm = grp(0.42, 0.12, 0.2, g);
  { const a2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.033, 0.42, 4, 8), std({ color: 0x9a7058, roughness: 0.6 })); a2.rotation.x = Math.PI / 2; a2.position.z = 0.23; O.lornaArm.add(a2); O.lornaArm.rotation.y = -0.4; O.lornaArm.userData.base = -0.4; }
  // the net: four sides and a sagging top, tied to the walls and the partition
  const NW = 2.15, ND = 1.3, NH = 1.25, net = O.net = grp(0, 0, 0, g);
  const side = (w, h, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 24, 6), M.net); const pa = p.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const u = pa.getX(i) / w + 0.5, v = pa.getY(i) / h + 0.5; pa.setZ(i, Math.sin(u * Math.PI) * 0.05 * (1 - v) + Math.sin(u * 23 + 1.3) * 0.025 * (0.4 + v)); } p.geometry.computeVertexNormals(); p.position.set(x, h / 2, z); p.rotation.y = ry; net.add(p); return p; };
  side(NW, NH, 0, ND / 2, 0); side(NW, NH, 0, -ND / 2, Math.PI); side(ND, NH, NW / 2, 0, Math.PI / 2); side(ND, NH, -NW / 2, 0, -Math.PI / 2);
  { const tp = new THREE.Mesh(new THREE.PlaneGeometry(NW, ND, 8, 6), M.net); const pa = tp.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, -Math.sin((pa.getX(i) / NW + 0.5) * Math.PI) * Math.sin((pa.getY(i) / ND + 0.5) * Math.PI) * 0.12); tp.rotation.x = -Math.PI / 2; tp.position.y = NH; net.add(tp); }
  for (const [x, z] of [[-NW / 2, -ND / 2], [NW / 2, -ND / 2], [-NW / 2, ND / 2], [NW / 2, ND / 2]]) pole([x, NH, z], [x * 1.05, NH + 0.5, z * 1.1], 0.003, M.rope, g, 3);
  net.traverse(c => { c.userData.noRay = true; c.castShadow = false; });
  solid('lorna', 2.45 - NW / 2 - 0.02, 2.45 + NW / 2 + 0.02, FLOOR, FLOOR + 1.3, -2.2 - ND / 2, -2.2 + ND / 2);
  // the baby, at the end: a small bundle in her arms
  O.baby = grp(0.25, 0.42, 0.05, g); O.baby.visible = false;
  { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), std({ color: 0xe8e0d0, roughness: 1 })); b.scale.set(1.5, 0.9, 1); O.baby.add(b); const bh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std({ color: 0xa87860, roughness: 0.6 })); bh.position.set(0.14, 0.03, 0); O.baby.add(bh); }
}

/* ---------------- the manananggal ---------------- */
// the top half of a woman from the waist up, starved thin, in Nanay's stained blouse, on huge bat's wings; her insides hang below her
function buildCreature() {
  const R = O.mn = grp(0, 0, 0, scene); R.visible = false; R.userData.keep = true;
  const body = grp(0, 0, 0, R); O.mnBody = body;
  // torso: narrow, ribbed, the blouse clinging wet; the waist torn off ragged
  const tg = new THREE.LatheGeometry([[0.001, -0.03], [0.1, -0.03], [0.105, 0.04], [0.095, 0.14], [0.12, 0.27], [0.14, 0.38], [0.155, 0.45], [0.13, 0.5], [0.075, 0.54], [0.045, 0.56], [0.001, 0.565]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
  const torso = new THREE.Mesh(tg, M.blouseStain); torso.scale.set(1, 1, 0.7); torso.castShadow = true; body.add(torso);
  // a jagged ring where she tore away from her legs
  { const g = new THREE.ConeGeometry(0.11, 0.09, 14, 1, true); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) { p.setY(i, p.getY(i) - Math.random() * 0.07); p.setX(i, p.getX(i) * (0.85 + Math.random() * 0.3)); p.setZ(i, p.getZ(i) * (0.85 + Math.random() * 0.3)); } g.computeVertexNormals(); const rag = new THREE.Mesh(g, M.wound); rag.rotation.x = Math.PI; rag.position.y = -0.04; rag.scale.set(1, 1, 0.72); body.add(rag);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), M.wound); cap.rotation.x = Math.PI / 2; cap.position.y = -0.05; cap.scale.set(1, 0.72, 1); body.add(cap); }
  // her insides: thick glossy ropes and thin strands, swinging
  O.guts = [];
  for (let i = 0; i < 9; i++) {
    let parent = grp(Math.sin(i * 0.9) * 0.06, -0.05, Math.cos(i * 0.9) * 0.04, body); const chain = [];
    const thin = i > 5, segs = thin ? 7 : 5 + (i % 3), r0 = thin ? 0.008 : 0.03 + hash1(i) * 0.015, L0 = thin ? 0.1 : 0.12;
    for (let k = 0; k < segs; k++) { const seg = grp(0, k ? -L0 : 0, 0, parent); const c = new THREE.Mesh(new THREE.CapsuleGeometry(r0 * (1 - k * 0.08), L0 * 0.7, 3, 8), thin ? M.wound : M.gut); c.position.y = -L0 / 2; seg.add(c); chain.push(seg); parent = seg; }
    O.guts.push({ chain, ph: i * 1.7 });
  }
  // neck, collarbones, and the head: Nanay's face gone grey, the eyes red, the hair parted and hanging either side
  const sk = M.paleSkin;
  const nk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.12, 10), sk); nk.position.set(0, 0.6, 0.01); body.add(nk);
  for (const s of [-1, 1]) { const cb = pole([0, 0.535, 0.05], [s * 0.13, 0.5, 0.035], 0.012, sk, body, 5); }
  const neck = O.mnNeck = grp(0, 0.64, 0.015, body);
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), std({ map: T.mnFace, roughness: 0.45, color: 0xd8d0c8 })); hm.scale.set(0.9, 1.18, 1.0); hm.position.set(0, 0.1, 0.012); neck.add(hm); hm.castShadow = true;
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, TAU, Math.PI * 0.5, Math.PI * 0.5), sk); jaw.position.set(0, 0.04, 0.03); jaw.scale.set(1.1, 1.3, 0.9); neck.add(jaw);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.097, 16, 10, 0, TAU, 0, Math.PI * 0.55), std({ color: 0x040303, roughness: 0.4 })); cap.position.set(0, 0.12, -0.012); cap.scale.set(1, 1.14, 1.08); cap.rotation.x = -0.2; neck.add(cap);
  const hair = O.mnHair = grp(0, 0.18, 0, neck);
  const strand = (x, z, ry, rx, w, len, bend) => { const gg = new THREE.PlaneGeometry(w, len, 1, 8); gg.translate(0, -len / 2, 0); const pa = gg.attributes.position; for (let k = 0; k < pa.count; k++) { const yy = -pa.getY(k) / len; pa.setZ(k, pa.getZ(k) + Math.sin(yy * Math.PI * 0.5) * bend); pa.setX(k, pa.getX(k) * (1 + yy * 0.6)); } gg.computeVertexNormals(); const h = new THREE.Mesh(gg, M.hair); h.position.set(x, 0, z); h.rotation.set(rx, ry, 0, 'YXZ'); h.castShadow = true; hair.add(h); return h; };
  for (let i = 0; i < 11; i++) { const a = Math.PI + (i - 5) * 0.26; strand(Math.sin(a) * 0.085, Math.cos(a) * 0.085, a, 0.18, 0.13, 0.95 + hash1(i) * 0.3, -0.08); }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) strand(s * (0.075 + k * 0.01), 0.02 - k * 0.03, s * (1.25 + k * 0.2), 0.1, 0.07, 0.38 + k * 0.12, 0.02);
  O.mnEyes = [];
  for (const s of [-1, 1]) { const e = new THREE.Sprite(M.eye); e.scale.setScalar(0.08); e.position.set(s * 0.031, 0.118, 0.088); neck.add(e); O.mnEyes.push(e); const d = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2a18, fog: false })); d.position.set(s * 0.031, 0.118, 0.085); neck.add(d); }
  // the tongue: a long dark proboscis, rolled away until it's wanted
  O.mnTongue = grp(0, 0.045, 0.08, neck); O.mnTongueSegs = [];
  { let p = O.mnTongue; for (let k = 0; k < 14; k++) { const s = grp(0, 0, k ? 0.16 : 0, p); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.009 - k * 0.0004, 0.011 - k * 0.0004, 0.165, 6), M.gut); c.rotation.x = Math.PI / 2; c.position.z = 0.08; s.add(c); O.mnTongueSegs.push(s); p = s; } O.mnTongue.visible = false; }
  // arms: sleeves to the elbow, then long grey forearms and hands with long dark nails
  O.mnArms = [];
  for (const s of [-1, 1]) {
    const sh = grp(s * 0.15, 0.47, 0, body), up = new THREE.Mesh(new THREE.CapsuleGeometry(0.033, 0.27, 4, 8), M.blouseStain); up.position.y = -0.16; sh.add(up);
    const el = grp(0, -0.33, 0, sh), fo = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.3, 4, 8), sk); fo.position.y = -0.16; el.add(fo);
    const hd = grp(0, -0.34, 0, el); const palm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.016), sk); palm.position.y = -0.035; hd.add(palm);
    for (let f = 0; f < 4; f++) { const fi = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0035, 0.16, 5), sk); fi.position.set((f - 1.5) * 0.012, -0.15, 0.01); fi.rotation.x = 0.25; hd.add(fi); const nl = new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.04, 4), M.nail); nl.position.set((f - 1.5) * 0.012, -0.245, 0.034); nl.rotation.x = Math.PI + 0.35; hd.add(nl); }
    sh.rotation.z = s * 0.15; O.mnArms.push({ sh, el, s });
  }
  // the wings: from between her shoulder blades, an arm bone, a forearm, four long fingers, leather stretched between
  O.mnWings = [];
  for (const s of [-1, 1]) {
    const root = grp(s * 0.07, 0.43, -0.08, body);
    const up = grp(0, 0, 0, root); pole([0, 0, 0], [s * 0.55, 0.16, -0.06], 0.026, M.bone, up, 7);
    const fore = grp(s * 0.55, 0.16, -0.06, up); pole([0, 0, 0], [s * 0.8, 0.28, -0.02], 0.02, M.bone, fore, 7);
    const hand = grp(s * 0.8, 0.28, -0.02, fore);
    const tips = [[s * 1.15, 0.36], [s * 1.28, -0.22], [s * 0.98, -0.82], [s * 0.45, -1.1]];
    tips.forEach(([x, y]) => pole([0, 0, 0], [x, y, 0.03], 0.012, M.bone, hand, 5));
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 5), M.nail); claw.position.set(s * 0.02, 0.06, 0); claw.rotation.z = -s * 0.4; hand.add(claw);
    const mem = new THREE.Mesh(new THREE.BufferGeometry(), M.wing); mem.castShadow = true; root.add(mem);
    O.mnWings.push({ s, root, up, fore, hand, tips, mem });
  }
  R.scale.setScalar(1.18);
  R.traverse(c => { c.userData.noRay = true; if (c.isMesh) c.frustumCulled = false; });
}
// rebuild a wing's membrane from where its bones are now (a few dozen vertices)
function wingMembrane(w) {
  const root = w.root; root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), P0 = new THREE.Vector3();
  const loc = (obj, x = 0, y = 0, z = 0) => P0.set(x, y, z).applyMatrix4(obj.matrixWorld).applyMatrix4(inv).clone();
  const shoulder = loc(root), elbow = loc(w.fore), wrist = loc(w.hand), tips = w.tips.map(([x, y]) => loc(w.hand, x, y, 0.03));
  const hip = loc(root, w.s * 0.05, -0.45, 0.02);
  const ring = [shoulder, elbow, wrist, ...tips, hip];
  const pos = [], c = wrist.clone().lerp(shoulder, 0.4).add(new THREE.Vector3(0, -0.2, 0));
  const push = (a, b) => { const mid = a.clone().lerp(b, 0.5).lerp(c, 0.18); for (const [p, q] of [[a, mid], [mid, b]]) pos.push(c.x, c.y, c.z, p.x, p.y, p.z, q.x, q.y, q.z); };
  for (let i = 2; i < ring.length - 1; i++) push(ring[i], ring[i + 1]);
  pos.push(c.x, c.y, c.z, shoulder.x, shoulder.y, shoulder.z, elbow.x, elbow.y, elbow.z, c.x, c.y, c.z, elbow.x, elbow.y, elbow.z, wrist.x, wrist.y, wrist.z, c.x, c.y, c.z, hip.x, hip.y, hip.z, shoulder.x, shoulder.y, shoulder.z);
  const g = w.mem.geometry; g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] * 0.8 + 0.5, pos[i + 1] * 0.8 + 0.5); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); g.attributes.position.needsUpdate = true;
}
// pose: flap 0..1 through the beat, spread 0 (folded) .. 1 (wide), reach 0 (arms hanging) .. 1 (grabbing at you)
function poseCreature(t, flap, spread, reach, dt = 0.016) {
  for (const w of O.mnWings) {
    const s = w.s, beat = Math.sin(t * TAU * flap), fold = 1 - spread;
    // folded: the wing shrinks down tight behind her back; spread: it beats
    w.root.scale.setScalar(lerp(0.4, 1, spread));
    w.root.rotation.set(-0.2 * spread + fold * 0.25, s * (0.25 - 0.2 * spread + fold * 0.7), s * (0.15 + beat * 0.65 * spread - fold * 1.45));
    w.up.rotation.set(0, s * -0.3 * (1 - spread), s * (beat * 0.2 * spread));
    w.fore.rotation.set(0, s * -1.6 * (1 - spread), s * (0.3 * (1 - spread) + beat * 0.25 * spread));
    w.hand.rotation.set(0, s * -0.4 * (1 - spread), s * (1 - spread) * 0.8);
    wingMembrane(w);
  }
  for (const a of O.mnArms) { a.sh.rotation.set(-reach * 1.35 + Math.sin(t * 2 + a.s) * 0.05, 0, a.s * (0.15 - reach * 0.1)); a.el.rotation.x = -reach * 0.25 - (1 - reach) * 0.1; }
  // her insides swing as she moves
  const v = V.mnVel || new THREE.Vector3();
  for (const gt of O.guts) gt.chain.forEach((sg, k) => { sg.rotation.x = clamp(v.z * 0.05, -0.5, 0.5) + Math.sin(t * 2.3 + gt.ph + k * 0.6) * 0.12; sg.rotation.z = clamp(-v.x * 0.05, -0.5, 0.5) + Math.cos(t * 1.9 + gt.ph + k * 0.5) * 0.1; });
  O.mnBody.position.y = Math.sin(t * TAU * flap) * -0.06 * spread;
}

/* ---------------- what she left under the house ---------------- */
function buildLegs() {
  const g = O.legs = grp(POS.legs.x, 0, POS.legs.z, scene); g.userData.keep = true; g.rotation.y = 0.35;
  const parts = [];
  for (const s of [-1, 1]) {
    parts.push({ geo: new THREE.CylinderGeometry(0.045, 0.036, 0.42, 10), color: 0x8a6e5c, m: m4(s * 0.075, 0.25, 0, 0, 0, s * -0.03) });
    parts.push({ geo: new THREE.SphereGeometry(0.048, 10, 8), color: 0x8a6e5c, m: m4(s * 0.076, 0.46, 0.005) });
    parts.push({ geo: new THREE.BoxGeometry(0.08, 0.035, 0.2), color: 0x8a6e5c, m: m4(s * 0.078, 0.03, 0.045, 0, s * 0.06, 0) });
  }
  const lb = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 0.6 })); lb.castShadow = true; g.add(lb);
  // red-strapped rubber slippers
  for (const s of [-1, 1]) { const sole = mbox(0.1, 0.018, 0.25, M.rubber, s * 0.078, 0.009, 0.045, g, 0.005); const strap = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 5, 10, Math.PI), M.slipper); strap.position.set(s * 0.078, 0.025, 0.06); strap.rotation.set(-Math.PI / 2, 0, 0); strap.scale.set(1, 1.3, 1); g.add(strap); }
  // Nanay's skirt: navy with white flowers, to below the knee
  const sk = new THREE.Mesh(new THREE.LatheGeometry([[0.001, 0.36], [0.2, 0.36], [0.22, 0.5], [0.21, 0.7], [0.17, 0.88], [0.15, 0.95], [0.001, 0.95]].map(([r, y]) => new THREE.Vector2(r, y)), 22), M.skirt);
  sk.scale.set(1, 1, 0.78); sk.castShadow = true; g.add(sk);
  // the waist: cut, wet, dark; it glistens in the lamp
  O.wound = new THREE.Mesh(new THREE.CircleGeometry(0.14, 18), M.wound); O.wound.rotation.x = -Math.PI / 2; O.wound.position.y = 0.952; O.wound.scale.set(1, 0.78, 1); g.add(O.wound);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), M.wound); r.position.set(Math.cos(a) * 0.13, 0.95, Math.sin(a) * 0.1); r.scale.set(1, 0.5, 1); g.add(r); }
  // what you pour on her, shown once you have
  O.saltCrust = grp(0, 0.955, 0, g); O.saltCrust.visible = false;
  for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.018), i % 3 === 0 ? M.ash : i % 5 === 0 ? M.garlicPaste : M.salt); const a = hash1(i) * TAU, r = Math.sqrt(hash1(i + 9)) * 0.13; c.position.set(Math.cos(a) * r, hash1(i * 3) * 0.02, Math.sin(a) * r * 0.78); c.rotation.set(i, i * 1.3, 0); O.saltCrust.add(c); }
  O.legSmoke = [];
  for (let i = 0; i < 10; i++) { const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x9a948a, transparent: true, opacity: 0, depthWrite: false })); p.scale.setScalar(0.2); p.position.set(0, 1.0, 0); g.add(p); O.legSmoke.push({ s: p, t: i / 10 }); }
  noRay(g);
  O.legsHit = mbox(0.5, 1.0, 0.5, HITMAT, 0, 0.5, 0, g, 1); O.legsHit.layers.set(2); O.legsHit.userData.hit = true;
  solid('legs', POS.legs.x - 0.2, POS.legs.x + 0.2, 0, 0.95, POS.legs.z - 0.2, POS.legs.z + 0.2);
}
// her lower half: in the dawn light, it folds at the knees
function legsCollapse(k) { const g = O.legs; g.rotation.x = -k * 1.2; g.position.y = -k * 0.15; }

/* ---------------- her face, right in front of yours ---------------- */
function buildFaceScare() {
  O.face = grp(0, 0, 0); O.face.visible = false; camera.add(O.face);
  const fg = new THREE.PlaneGeometry(0.47, 0.59, 18, 24); const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setZ(i, -x * x * 2.0 - y * y * 0.5); }
  fg.computeVertexNormals();
  O.faceMat = new THREE.MeshBasicMaterial({ map: T.scareTex, fog: false, transparent: true });
  O.face.add(new THREE.Mesh(fg, O.faceMat));
  for (let i = 0; i < 12; i++) { const st = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.002, 0.006), 0.6), new THREE.MeshBasicMaterial({ color: 0x030303, fog: false, transparent: true })); st.position.set(rand(-0.14, 0.14), rand(-0.05, 0.1), rand(0.01, 0.06)); st.rotation.z = rand(-0.2, 0.2); O.face.add(st); }
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, transparent: true })); bk.position.set(0, 0, -0.12); O.face.add(bk);
  O.face.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; if (c.material) { c.material.depthTest = false; c.material.depthWrite = false; c.renderOrder = c === bk ? 20 : c.geometry === fg ? 21 : 22; } });
}

/* ---------------- what's in your hands ---------------- */
function buildHands() {
  // left hand: the lamp, once it's lit
  O.handLamp = grp(-0.27, -0.33, -0.6); camera.add(O.handLamp); O.handLamp.visible = false;
  buildLampMesh(O.handLamp); O.handLamp.rotation.set(0.08, 0.3, 0.06); O.handLamp.scale.setScalar(0.85);
  { const sl = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), std({ color: 0x3a3a44, roughness: 0.9 })); sl.position.set(-0.02, 0.02, 0.17); sl.rotation.x = Math.PI / 2 - 0.3; O.handLamp.add(sl); const fist = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M.skin); fist.scale.set(1, 0.8, 1.2); fist.position.set(-0.005, 0.07, 0.02); O.handLamp.add(fist); }
  O.handLamp.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; c.castShadow = false; });
  // the coconut bowl: in the world and in your hand, with what's been put in it
  const bowlMesh = (g) => { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10, 0, TAU, Math.PI / 2, Math.PI / 2), M.coconut); sh.scale.set(1, 0.75, 1); sh.position.y = 0.056; g.add(sh); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.005, 6, 18), M.coconutIn); rim.rotation.x = Math.PI / 2; rim.position.y = 0.056; g.add(rim); const fill = { ash: null, garlic: null, salt: null }; [['ash', M.ash, 0.03], ['garlic', M.garlicPaste, 0.04], ['salt', M.salt, 0.05]].forEach(([k, m, y]) => { const d = new THREE.Mesh(new THREE.CircleGeometry(0.064 - (0.05 - y) * 0.4, 14), m); d.rotation.x = -Math.PI / 2; d.position.y = y; d.visible = false; g.add(d); fill[k] = d; }); g.userData.fill = fill; return g; };
  O.bowlWorld = bowlMesh(grp(-1.6, FLOOR + 1.065, -2.84, scene)); O.bowlWorld.userData.keep = true;
  O.bowlHand = bowlMesh(grp(0, 0, 0)); camera.add(O.bowlHand); O.bowlHand.scale.setScalar(0.62);
  // the dipper: a coconut-shell cup on a wooden handle
  const dipper = (g) => { const cup = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), M.coconut); cup.position.y = 0.05; g.add(cup); pole([0.05, 0.06, 0], [0.32, 0.12, 0], 0.012, M.wood, g, 6); const w = new THREE.Mesh(new THREE.CircleGeometry(0.052, 12), M.water); w.rotation.x = -Math.PI / 2; w.position.y = 0.045; w.visible = false; g.add(w); g.userData.water = w; return g; };
  O.tabo = dipper(grp(-1.24, FLOOR + 0.67, -1.9, scene)); O.tabo.userData.keep = true; O.tabo.rotation.y = 0.3;
  O.taboHand = dipper(grp(0, 0, 0)); camera.add(O.taboHand);
  // Tatay's bolo: a long single-edged blade in a carabao-horn handle
  const bolo = (g) => { const bl = new THREE.Shape(); bl.moveTo(0, 0); bl.lineTo(0.42, 0.012); bl.quadraticCurveTo(0.5, 0.03, 0.47, 0.06); bl.lineTo(0, 0.045); bl.closePath(); const bg = new THREE.ExtrudeGeometry(bl, { depth: 0.004, bevelEnabled: false }); const b = new THREE.Mesh(bg, std({ color: 0x6a6a68, roughness: 0.35, metalness: 0.85 })); b.position.z = -0.002; g.add(b); const h = mbox(0.13, 0.035, 0.028, std({ color: 0x1a1412, roughness: 0.5 }), -0.07, 0.022, 0, g, 0.008); return g; };
  O.boloWorld = bolo(grp(POS.stump.x + 0.05, 0.44, POS.stump.z, scene)); O.boloWorld.rotation.set(0, 0.4, -1.95); O.boloWorld.userData.keep = true;
  O.boloHand = bolo(grp(0, 0, 0)); camera.add(O.boloHand);
}

/* ---------------- lights, sky and rain ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x2a3444, 0x0a0806, 0.22); scene.add(L.hemi);
  L.moon = new THREE.DirectionalLight(0x6070a0, 0.06); L.moon.position.set(-20, 30, 10); scene.add(L.moon);
  L.flash = new THREE.DirectionalLight(0xc8d4ff, 0); L.flash.position.set(14, 30, 18); L.flash.target.position.set(0, 0, 0); scene.add(L.flash.target);
  if (!IS_TOUCH) { L.flash.castShadow = true; L.flash.shadow.mapSize.set(1024, 1024); const c = L.flash.shadow.camera; c.left = -20; c.right = 20; c.top = 20; c.bottom = -20; c.near = 5; c.far = 70; L.flash.shadow.bias = -0.0008; L.flash.shadow.normalBias = 0.03; }
  scene.add(L.flash);
  // the lamp: warm, low, alive; shadows only where the GPU can afford them
  L.lamp = new THREE.PointLight(0xff9a48, 0, 11, 2); L.lamp.position.set(0, -50, 0);
  if (!IS_TOUCH) { L.lamp.castShadow = true; L.lamp.shadow.mapSize.set(512, 512); L.lamp.shadow.bias = -0.004; L.lamp.shadow.normalBias = 0.02; L.lamp.shadow.camera.near = 0.08; L.lamp.shadow.camera.far = 11; }
  scene.add(L.lamp);
  // a dull red glow off her, so she can be seen close up in the dark
  L.her = new THREE.PointLight(0x80202a, 0, 3.2, 2); scene.add(L.her);
  // a cold glow from the storm sky, only while you look out at her through the crack
  L.peek = new THREE.PointLight(0x9aa8c8, 0, 5, 1.5); scene.add(L.peek);
  // the weave leaks light: a faint cold fill inside the house that jumps with the lightning
  L.inFill = new THREE.PointLight(0x8090b8, 0.25, 9, 1.6); L.inFill.position.set(0, FLOOR + 2.0, 0.3); scene.add(L.inFill);
  L.underFill = new THREE.PointLight(0x7080a0, 0.05, 7, 1.6); L.underFill.position.set(0, 0.7, 0); scene.add(L.underFill);
  // the morning
  L.dawn = new THREE.DirectionalLight(0xb8c4d8, 0); L.dawn.position.set(30, 12, -20); scene.add(L.dawn);
}
function buildRain() {
  const N = IS_TOUCH ? 900 : 2200, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 6 * 3), seed = new Float32Array(N * 6 * 3);
  for (let i = 0; i < N; i++) { const sx = Math.random(), sy = Math.random(), sz = Math.random(); for (let k = 0; k < 6; k++) { const corner = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]][k]; pos.set([corner[0], corner[1], 0], (i * 6 + k) * 3); seed.set([sx, sy, sz], (i * 6 + k) * 3); } }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cam: { value: new THREE.Vector3() }, map: { value: T.rain }, bright: { value: 0.35 }, wind: { value: new THREE.Vector2(1.6, 0.6) }, amt: { value: 1 },
      hb: { value: new THREE.Vector4(HX0 - 0.95, HX1 + 0.95, HZ0 - 0.95, HZ1 + 0.95) }, gb: { value: new THREE.Vector4(GRAN.x0 - 0.7, GRAN.x1 + 0.7, GRAN.z0 - 0.7, GRAN.z1 + 0.7) } },
    vertexShader: `attribute vec3 seed; uniform float time; uniform vec3 cam; uniform vec2 wind; uniform vec4 hb; uniform vec4 gb; uniform float amt; varying vec2 vUv; varying float vA;
      void main(){
        float B = 22.0, H = 14.0, sp = 9.0 + seed.y * 3.0;
        vec3 p = vec3(seed.x * B, mod(seed.y * H - time * sp, H), seed.z * B);
        p.xz += wind * (H - p.y) * 0.08;
        p.x = mod(p.x - cam.x + B * 0.5, B) + cam.x - B * 0.5; p.z = mod(p.z - cam.z + B * 0.5, B) + cam.z - B * 0.5; p.y += cam.y - 4.0;
        float hide = 0.0;
        if (p.x > hb.x && p.x < hb.y && p.z > hb.z && p.z < hb.w && p.y < 6.6) hide = 1.0;
        if (p.x > gb.x && p.x < gb.y && p.z > gb.z && p.z < gb.w && p.y < 4.8) hide = 1.0;
        if (p.y < 0.0) hide = 1.0;
        if (seed.x > amt) hide = 1.0;
        vec3 dir = normalize(vec3(wind.x * 0.08, -1.0, wind.y * 0.08));
        vec3 toCam = normalize(cameraPosition - p); vec3 side = normalize(cross(dir, toCam));
        float len = 0.55, w = 0.012;
        vec3 wp = p + side * (position.x - 0.5) * w - dir * position.y * len;
        vUv = position.xy; vA = 1.0 - hide;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        if (hide > 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: `uniform sampler2D map; uniform float bright; varying vec2 vUv; varying float vA; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(vec3(0.75, 0.8, 0.88) * bright, t.a * 0.55 * vA); }`,
    transparent: true, depthWrite: false,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.layers.set(1); m.userData.noRay = true; m.userData.noEnv = true; scene.add(m); O.rain = m;
}

/* =====================================================================
   TIK-TIK · part D: painted things (the fiesta photo, faces, the calendar, soot),
   items, the little you read, what Lorna told you, hints, voices
   ===================================================================== */
function paintThings() {
  // the fiesta photo: Nanay in her good skirt, navy with white flowers, and Lorna, under the bunting
  const photo = canv(360, 260, (g, w, h) => {
    g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
    const x0 = 14, y0 = 14, W = w - 28, H = h - 40;
    const sky = g.createLinearGradient(0, y0, 0, y0 + H); sky.addColorStop(0, '#b8c4c0'); sky.addColorStop(1, '#d8cfb0'); g.fillStyle = sky; g.fillRect(x0, y0, W, H);
    // a bamboo arch, bunting strung across
    g.fillStyle = '#8a7a50'; g.fillRect(x0 + 20, y0 + 20, 8, H - 20); g.fillRect(x0 + W - 28, y0 + 20, 8, H - 20); g.fillRect(x0 + 20, y0 + 18, W - 40, 8);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const x = x0 + 10 + i * (W - 20) / 16, y = y0 + 34 + r * 18 + Math.sin(i / 15 * Math.PI) * 10; g.fillStyle = ['#c84040', '#e8c040', '#4080c0', '#40a060', '#e8e0d0'][(i + r) % 5]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12, y); g.lineTo(x + 6, y + 12); g.fill(); }
    // the ground
    g.fillStyle = '#a89878'; g.fillRect(x0, y0 + H * 0.78, W, H * 0.22);
    // Nanay: a stout woman, hair in a bun, cream blouse, navy skirt with white flowers
    const fig = (cx, top, skirt, blouse, sc, bun) => {
      g.fillStyle = '#6a4a38'; g.beginPath(); g.ellipse(cx, top + 14 * sc, 10 * sc, 12 * sc, 0, 0, TAU); g.fill();
      g.fillStyle = '#1a1412'; g.beginPath(); g.ellipse(cx, top + 8 * sc, 11 * sc, 9 * sc, 0, Math.PI, TAU); g.fill(); if (bun) { g.beginPath(); g.arc(cx + 8 * sc, top + 4 * sc, 6 * sc, 0, TAU); g.fill(); } else { g.fillRect(cx - 11 * sc, top + 8 * sc, 4 * sc, 26 * sc); g.fillRect(cx + 7 * sc, top + 8 * sc, 4 * sc, 26 * sc); }
      g.fillStyle = '#2a1a14'; g.fillRect(cx - 4 * sc, top + 13 * sc, 2 * sc, 1.5 * sc); g.fillRect(cx + 2 * sc, top + 13 * sc, 2 * sc, 1.5 * sc); g.fillStyle = '#5a2a20'; g.fillRect(cx - 3 * sc, top + 20 * sc, 6 * sc, 1.5 * sc);
      g.fillStyle = blouse; g.beginPath(); g.moveTo(cx - 16 * sc, top + 30 * sc); g.lineTo(cx + 16 * sc, top + 30 * sc); g.lineTo(cx + 14 * sc, top + 62 * sc); g.lineTo(cx - 14 * sc, top + 62 * sc); g.fill();
      g.fillStyle = skirt; g.beginPath(); g.moveTo(cx - 14 * sc, top + 60 * sc); g.lineTo(cx + 14 * sc, top + 60 * sc); g.lineTo(cx + 20 * sc, top + 108 * sc); g.lineTo(cx - 20 * sc, top + 108 * sc); g.fill();
      if (skirt === '#1d2c5a') { g.fillStyle = '#e8e4d6'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(cx - 16 * sc + hash1(i) * 32 * sc, top + 64 * sc + hash1(i + 7) * 42 * sc, 2.2 * sc, 0, TAU); g.fill(); } }
      g.fillStyle = '#6a4a38'; g.fillRect(cx - 8 * sc, top + 108 * sc, 5 * sc, 20 * sc); g.fillRect(cx + 3 * sc, top + 108 * sc, 5 * sc, 20 * sc);
      g.fillStyle = '#a82418'; g.fillRect(cx - 9 * sc, top + 126 * sc, 7 * sc, 3 * sc); g.fillRect(cx + 2 * sc, top + 126 * sc, 7 * sc, 3 * sc);
    };
    fig(x0 + W * 0.4, y0 + 52, '#1d2c5a', '#e4dcc8', 1.05, true);
    fig(x0 + W * 0.64, y0 + 60, '#c86a7a', '#e8e0d8', 0.95, false);
    // age: fading, a warm cast, dust and a crease
    const d = g.getImageData(x0, y0, W, H); for (let i = 0; i < d.data.length; i += 4) { const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2]; d.data[i] = r * 0.82 + 40; d.data[i + 1] = gg * 0.8 + 30; d.data[i + 2] = b * 0.72 + 18; } g.putImageData(d, x0, y0);
    speckle(g, w, h, 700, 0.25, '60,40,20', 2); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0 + H * 0.35); g.lineTo(x0 + W, y0 + H * 0.42); g.stroke();
    g.fillStyle = '#5a4a3a'; g.font = '15px "Kalam", cursive'; g.fillText('Pista, Mayo 1978', x0 + 4, h - 10);
  });
  T.photoTex = new THREE.CanvasTexture(photo); T.photoTex.colorSpace = THREE.SRGBColorSpace; T.photoURL = photo.toDataURL('image/jpeg', 0.88);
  // the calendar from the sari-sari store
  T.calTex = new THREE.CanvasTexture(canv(160, 240, (g, w, h) => {
    g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#b02a20'; g.fillRect(0, 0, w, 34); g.fillStyle = '#fff'; g.font = '700 13px "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('TINDAHAN NI ALING NENA', w / 2, 15); g.font = '11px "Oswald", sans-serif'; g.fillText('Infanta, Quezon', w / 2, 29);
    g.fillStyle = '#3a6a4a'; g.fillRect(10, 42, w - 20, 70); g.fillStyle = '#e8d870'; g.beginPath(); g.arc(w / 2, 80, 22, 0, TAU); g.fill();
    g.fillStyle = '#222'; g.font = '700 16px "Oswald", sans-serif'; g.fillText('OKTUBRE 1979', w / 2, 132);
    g.font = '10px "Oswald", sans-serif'; for (let d = 1; d <= 31; d++) { const c = (d + 0) % 7, r = Math.floor((d + 0) / 7); g.fillStyle = c === 0 ? '#b02a20' : '#222'; g.fillText(String(d), 18 + c * 21, 152 + r * 17); if (d === 20) { g.strokeStyle = '#1f3a8a'; g.lineWidth = 1.5; g.beginPath(); g.arc(18 + c * 21, 148 + r * 17, 8, 0, TAU); g.stroke(); } }
  })); T.calTex.colorSpace = THREE.SRGBColorSpace;
  T.sootTex = new THREE.CanvasTexture(canv(128, 200, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 40; i++) blot(g, w / 2 + (Math.random() - 0.5) * w * 0.6, h - Math.random() * h * 0.9, 20 + Math.random() * 30, 0.12, '10,8,6'); })); T.sootTex.colorSpace = THREE.SRGBColorSpace;
  T.matchTex = new THREE.CanvasTexture(canv(64, 48, (g, w, h) => { g.fillStyle = '#d8b030'; g.fillRect(0, 0, w, h); g.fillStyle = '#a82418'; g.fillRect(4, 4, w - 8, h - 8); g.fillStyle = '#f0e0b0'; g.font = '700 12px "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('TIGRE', w / 2, 28); })); T.matchTex.colorSpace = THREE.SRGBColorSpace;
  // Lorna's face (the face is centred a quarter of the way along, where the sphere faces +z)
  T.lornaFace = new THREE.CanvasTexture(canv(256, 128, (g, w, h) => {
    g.fillStyle = '#9a7058'; g.fillRect(0, 0, w, h); const cx = w * 0.25, cy = h * 0.52;
    g.fillStyle = 'rgba(70,40,30,0.35)'; g.beginPath(); g.ellipse(cx, cy + 6, 12, 18, 0, 0, TAU); g.fill();
    g.strokeStyle = '#2a1810'; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 11, cy - 6, 6, 2.6, 0, 0, TAU); g.stroke(); g.fillStyle = '#1a0e0a'; g.beginPath(); g.arc(cx + s * 11, cy - 6, 2, 0, TAU); g.fill(); g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx + s * 5, cy - 13); g.quadraticCurveTo(cx + s * 11, cy - 16, cx + s * 17, cy - 12); g.stroke(); }
    g.strokeStyle = '#6a3a30'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx - 6, cy + 14); g.quadraticCurveTo(cx, cy + 12, cx + 6, cy + 14); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 12; i++) g.fillRect(cx - 18 + Math.random() * 36, cy - 20 + Math.random() * 10, 1.5, 1.5);
  })); T.lornaFace.colorSpace = THREE.SRGBColorSpace;
  // her face, seen in the lamp: Nanay's face, but grey, the eyes red, the lips black
  T.mnFace = new THREE.CanvasTexture(canv(256, 128, (g, w, h) => {
    g.fillStyle = '#8a8680'; g.fillRect(0, 0, w, h); const cx = w * 0.25, cy = h * 0.54;
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * 11, cy - 8, 1, cx + s * 11, cy - 8, 12); gr.addColorStop(0, '#000'); gr.addColorStop(0.5, '#1a0a0a'); gr.addColorStop(1, 'rgba(40,20,20,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx + s * 11, cy - 8, 12, 0, TAU); g.fill(); g.fillStyle = '#c8b8a0'; g.beginPath(); g.arc(cx + s * 11, cy - 8, 4, 0, TAU); g.fill(); g.fillStyle = '#c01810'; g.beginPath(); g.arc(cx + s * 11, cy - 8, 2.4, 0, TAU); g.fill(); }
    g.fillStyle = '#100808'; g.beginPath(); g.ellipse(cx, cy + 14, 9, 6, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,30,30,0.5)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(cx - 20 + Math.random() * 40, cy - 22 + Math.random() * 40); g.lineTo(cx - 20 + Math.random() * 40, cy - 22 + Math.random() * 40); g.stroke(); }
  })); T.mnFace.colorSpace = THREE.SRGBColorSpace;
  // the face that fills your eyes when she has you
  T.scareTex = new THREE.CanvasTexture(canv(512, 640, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    // wings, spread behind her head, the claws at their joints
    g.fillStyle = '#1a1210'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 60, h * 0.42); g.quadraticCurveTo(w / 2 + s * 260, h * 0.05, w / 2 + s * 300, h * 0.12); g.lineTo(w / 2 + s * 240, h * 0.4); g.lineTo(w / 2 + s * 290, h * 0.55); g.lineTo(w / 2 + s * 180, h * 0.62); g.fill(); g.strokeStyle = '#3a2a24'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2 + s * 60, h * 0.42); g.lineTo(w / 2 + s * 300, h * 0.12); g.moveTo(w / 2 + s * 230, h * 0.26); g.lineTo(w / 2 + s * 290, h * 0.55); g.stroke(); }
    // the face
    const cx = w / 2, cy = h * 0.46;
    const sk = g.createRadialGradient(cx, cy - 20, 20, cx, cy, 200); sk.addColorStop(0, '#b8b0a6'); sk.addColorStop(0.6, '#7a746c'); sk.addColorStop(1, '#2a2622'); g.fillStyle = sk; g.beginPath(); g.ellipse(cx, cy, 140, 190, 0, 0, TAU); g.fill();
    for (const s of [-1, 1]) {
      const gr = g.createRadialGradient(cx + s * 55, cy - 40, 4, cx + s * 55, cy - 40, 62); gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#200808'); gr.addColorStop(1, 'rgba(40,20,20,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx + s * 55, cy - 40, 62, 0, TAU); g.fill();
      g.fillStyle = '#e8dcc8'; g.beginPath(); g.ellipse(cx + s * 55, cy - 40, 30, 22, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(180,20,20,0.8)'; g.lineWidth = 1.4; for (let i = 0; i < 16; i++) { const a = Math.random() * TAU; g.beginPath(); g.moveTo(cx + s * 55 + Math.cos(a) * 28, cy - 40 + Math.sin(a) * 20); g.quadraticCurveTo(cx + s * 55 + Math.cos(a) * 18 + rand(-4, 4), cy - 40 + Math.sin(a) * 12, cx + s * 55 + Math.cos(a) * 11, cy - 40 + Math.sin(a) * 8); g.stroke(); }
      g.fillStyle = '#b01008'; g.beginPath(); g.arc(cx + s * 55 + s * -4, cy - 40, 14, 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(cx + s * 55 + s * -4, cy - 40, 5, 0, TAU); g.fill();
    }
    // the mouth: open far too wide, black lips, the tongue sliding out
    g.fillStyle = '#060202'; g.beginPath(); g.ellipse(cx, cy + 85, 58, 80, 0, 0, TAU); g.fill();
    g.strokeStyle = '#000'; g.lineWidth = 10; g.beginPath(); g.ellipse(cx, cy + 85, 60, 82, 0, 0, TAU); g.stroke();
    g.fillStyle = '#5a1010'; g.beginPath(); g.moveTo(cx - 16, cy + 60); g.quadraticCurveTo(cx + 30, cy + 160, cx - 10, h); g.lineTo(cx + 12, h); g.quadraticCurveTo(cx + 50, cy + 150, cx + 16, cy + 60); g.fill();
    for (let i = 0; i < 7; i++) { g.fillStyle = '#c8bca8'; g.beginPath(); g.moveTo(cx - 45 + i * 15, cy + 18 + Math.abs(i - 3) * 4); g.lineTo(cx - 39 + i * 15, cy + 40); g.lineTo(cx - 33 + i * 15, cy + 18 + Math.abs(i - 3) * 4); g.fill(); }
    // wet black hair framing it
    g.fillStyle = '#030202'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 20, cy - 200); g.quadraticCurveTo(cx + s * 170, cy - 160, cx + s * 150, h); g.lineTo(cx + s * 260, h); g.quadraticCurveTo(cx + s * 250, cy - 210, cx + s * 20, cy - 220); g.fill(); }
    g.beginPath(); g.ellipse(cx, cy - 175, 150, 50, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.85)'; for (let i = 0; i < 40; i++) { g.lineWidth = 1 + Math.random() * 3; const x = cx + (Math.random() - 0.5) * 220; g.beginPath(); g.moveTo(x, cy - 180); g.bezierCurveTo(x + rand(-30, 30), cy, x + rand(-40, 40), cy + 120, x + rand(-50, 50), h); g.stroke(); }
    // grain
    speckle(g, w, h, 3000, 0.25, '0,0,0', 3);
  })); T.scareTex.colorSpace = THREE.SRGBColorSpace;
}

/* ---------------- items ---------------- */
const ITEMS = {
  matches: { name: 'A box of matches', short: 'Matches', desc: 'Tigre matches, a red and yellow box, half full. Nanay keeps them on top of the wardrobe where Lorna can\'t reach.' },
  garlic: { name: 'A braid of garlic', short: 'Garlic', desc: 'A plait of nine bulbs on a cord, dry and papery. It has to be crushed before it\'s any use.' },
  key: { name: 'The granary key', short: 'Granary key', desc: 'A heavy iron key on a loop of string. Tatay left it with Lorna before he went to Manila for work.' },
  bowl: { name: 'Coconut-shell bowl', short: 'Bowl', desc: 'Half a coconut shell, scraped clean and smooth inside.', held: true },
  tabo: { name: 'Water dipper', short: 'Dipper', desc: 'A coconut-shell cup on a wooden handle, for taking water from the jar.', held: true },
  bolo: { name: 'Tatay\'s bolo', short: 'Bolo', desc: 'A long single-edged blade with a horn handle, nicked from years of cutting firewood and cogon grass.', held: true },
  lamp: { name: 'The lamp', short: 'Lamp', desc: 'A tin kerosene lamp, a gasera, with a little glass chimney. F turns the wick up or down: bright to see by, low to be seen less.' },
};

/* ---------------- what Lorna told you (the notebook keeps it) ---------------- */
const HEARD = {
  mana: { title: 'Lorna, about the thing at the window', text: '"Manananggal. She wants my baby. Tatay said they leave their other half standing on the ground. Put salt, garlic and ash on it before morning, and she can never go back to it."' },
  tiktik: { title: 'Lorna, about the sound', text: '"Listen for the tik-tik. When it\'s loud, she\'s far away. When it\'s faint, she\'s right there."' },
  matches: { title: 'Lorna, about the matches', text: '"The matches are on top of the wardrobe. Nanay keeps them up there."' },
  thanks: { title: 'Lorna, with the key', text: '"Here\'s the key to the granary. The salt is in there."' },
  garlic: { title: 'Lorna, about garlic', text: '"There\'s garlic hanging up in the kitchen. High up." And: "Pound the garlic in the mortar. It\'s outside, behind the house."' },
  ash: { title: 'Lorna, about ash', text: '"Ash. In the stove, in the kitchen. Use the coconut bowl."' },
  bolo: { title: 'Lorna, about the way under', text: '"Something\'s been rustling under the floor all night." And: "The screen at the back of the house is tied shut. Tatay\'s bolo is in the chopping stump."' },
};

/* ---------------- what you read (a little) ---------------- */
const DOCS = {
  photo: { title: 'The photo on the wall', style: 'photo', pages: () => [`<h3>Pista, Mayo 1978</h3><p class="sub3">The barrio fiesta, last year</p><div class="tkphoto"><img src="${T.photoURL || ''}" alt="A faded snapshot: Nanay, stout, her hair in a bun, in a cream blouse and her good skirt, navy blue with white flowers, and red-strapped slippers. Lorna stands beside her in a pink dress. Bunting overhead."></div><p>Nanay in her good skirt, the navy one with the little white flowers, and the red slippers she only wears to Mass. Lorna laughing at whoever's holding the camera.</p>`] },
  tasks: { title: 'What has to be done before morning', style: 'tktask', pages: () => [taskSheet()] },
};
function taskSheet() {
  const f = S.flags, b = S.bowl || {}, ck = on => on ? '<span class="ck on">&#10003;</span>' : '<span class="ck"></span>';
  return `<h3>Before morning</h3><p class="sub3">What Lorna said, as you remember it</p><ul class="tkl">
    <li>${ck(b.salt)} <b>Salt</b> &middot; rock salt, in the granary${f.key ? ' (you have the key)' : ''}</li>
    <li>${ck(b.garlic)} <b>Garlic</b> &middot; crushed${f.garlicIn || b.garlic ? '' : ': hanging in the kitchen, the mortar out the back'}</li>
    <li>${ck(b.ash)} <b>Ash</b> &middot; from the kitchen stove, in the coconut bowl</li>
    <li>${ck(f.salted)} <b>Her legs</b> &middot; ${f.legsSeen ? 'standing under the house' : 'somewhere on the ground'}</li></ul>
    <p class="tkn">Listen for the tik-tik. Loud: she's far away. Faint: she's right there.</p>`;
}

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'What\'s going on?', when: s => s.flags.manaKnown ? 'solved' : 'active', tiers: [
    'Your sister Lorna is in labour behind the mosquito net in the bedroom. Nanay went for the midwife and isn\'t back.',
    'Talk to Lorna (look at her and press E).',
    'It\'s pitch dark. Lorna says the matches are up on top of the wardrobe.',
    'Get the lamp lit, then listen to whoever is at the bedroom window. Don\'t open it.' ] },
  { id: 'light', title: 'Light the lamp', when: s => s.flags.lit ? 'solved' : 'active', tiers: [
    'There\'s a kerosene lamp on the table in the sala. You need something to light it with.',
    'Lorna said Nanay keeps the matches on top of the wardrobe in the bedroom. It\'s too high to see from the floor.',
    'Something to stand on: the wooden stool in the sala. Look at it and press E to drag it; E again lets go. Space jumps up onto things.',
    'Drag the stool to the wardrobe in the bedroom, jump onto it, take the matches from the top, then light the lamp on the table.' ] },
  { id: 'visitor', title: 'Someone at the window', when: s => !s.flags.visitor ? 'hidden' : s.flags.peeked ? 'solved' : 'active', tiers: [
    'Whoever is out there wants the window opened. Lorna says don\'t.',
    'Lorna wants you to look at her feet. Not through the window: through the wall.',
    'A strip of the woven wall has rotted out by the bedroom window, low down. You\'d have to crouch (C).',
    'Crouch at the gap in the bedroom\'s east wall, just south of the window, and look through it.' ] },
  { id: 'water', title: 'Lorna needs water', when: s => !s.flags.thirsty ? 'hidden' : s.flags.key ? 'solved' : 'active', tiers: [
    'Lorna is parched. She\'s asking for water.',
    'The big clay water jar stands in the kitchen.',
    'The dipper hangs on the jar. Take it, fill it at the jar, and carry it to her.',
    'Take the dipper from the water jar in the kitchen, fill it, take it to Lorna and give it to her. She gives you the granary key.' ] },
  { id: 'garlic', title: 'Garlic', when: s => !s.flags.manaKnown ? 'hidden' : (s.bowl && s.bowl.garlic) ? 'solved' : 'active', tiers: [
    'There\'s a braid of garlic hanging from the beam in the middle of the kitchen.',
    'It\'s too high to reach from the floor. Stand on something, or jump for it (Space).',
    'Whole garlic is no good. The wooden mortar stands outside behind the house; the pestle leans by it.',
    'Jump for the garlic (or stand on the stool). Take it out to the mortar behind the house, put it in, pound it, then scoop it into the coconut bowl.' ] },
  { id: 'ash', title: 'Ash', when: s => !s.flags.manaKnown ? 'hidden' : (s.bowl && s.bowl.ash) ? 'solved' : 'active', tiers: [
    'The clay stove in the kitchen is full of cold ash.',
    'You need something to carry it in.',
    'The coconut-shell bowl is on the shelf in the kitchen. Hold it and use it on the stove.',
    'Take the bowl from the kitchen shelf, then use it on the clay stove to scoop up ash.' ] },
  { id: 'salt', title: 'Rock salt', when: s => !s.flags.manaKnown ? 'hidden' : (s.bowl && s.bowl.salt) ? 'solved' : 'active', tiers: [
    'The salt is kept in the granary: the little hut on posts at the back of the yard, on the west side.',
    'It\'s padlocked, and Lorna has the key. And the ladder\'s broken: the doorway is too high to climb into from the ground.',
    'Drag something under the doorway to climb on: the wooden crate by the pigpen, or the mortar.',
    'Unlock the granary with Lorna\'s key. Drag the crate under its doorway, jump onto it, then jump up into the granary. Lift the lid off the jar and fill the bowl.' ] },
  { id: 'under', title: 'Under the house', when: s => !(s.flags.legsSeen || s.flags.rustle) ? 'hidden' : s.flags.panelCut ? 'solved' : 'active', tiers: [
    'Something is standing under the house. The crawlspace is closed in by woven screens.',
    'One screen, at the back of the house on the east side, is only tied shut with rope.',
    'Tatay\'s bolo is stuck fast in the chopping stump in the east yard. It takes a few tugs.',
    'Pull the bolo out of the stump, then cut the rope on the screen at the back right of the house. Crouch (C) to crawl in.' ] },
  { id: 'legs', title: 'Her legs', when: s => !s.flags.manaKnown ? 'hidden' : s.flags.salted ? 'solved' : 'active', tiers: [
    'Salt, garlic and ash: all three in the coconut bowl.',
    'Look down through the broken gap in the sala floor.',
    'She left them standing in the crawlspace, under the sala, by the west end.',
    'Crawl under the house to the south-west corner with the full bowl in your hands, and pour it on her.' ] },
  { id: 'hunt', title: 'Out in the open', when: s => !s.flags.hunted ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'She hunts whatever moves in the yard.',
    'Listen to the tik-tik. When it\'s loud she\'s far off; when it\'s faint she\'s right above you.',
    'F turns the lamp down, C crouches: both make you harder to spot. If she screams, get under cover: the house, under it, the granary, the outhouse.',
    'Go out while the tik-tik is loud, keep the lamp low, and run for cover the moment she screams.' ] },
  { id: 'gate', title: 'At the gate', when: s => !s.flags.gateSeen ? 'hidden' : s.flags.gateDone ? 'solved' : 'active', tiers: [
    'It sounds like Nanay.', 'Lorna is screaming at you not to.', 'Look over the gate. What\'s holding her up?', 'Don\'t lift the bar. Walk away from the gate.' ] },
  { id: 'hide', title: 'She\'s in the house', when: s => !s.flags.breakin ? 'hidden' : s.flags.breakinDone ? 'solved' : 'active', tiers: [
    'Get out of her sight, now.', 'The wardrobe in the bedroom. Or under the bamboo bed in the sala.', 'Look at either and choose Hide. Don\'t come out while she\'s still in the house.', 'Hide in the wardrobe or under the bamboo bed, and stay there until she\'s gone.' ] },
  { id: 'siege', title: 'Hold the house', when: s => !s.flags.salted ? 'hidden' : s.flags.dawn ? 'solved' : 'active', tiers: [
    'She can\'t go back to her legs now, and she knows it. Get inside.',
    'Bar the front door. When a shutter bursts open, slam it before she climbs in.',
    'When she tears through the roof over Lorna, her tongue comes down for the baby. Fire drives it back.',
    'Bar the door, slam every shutter she rips open, and burn her tongue with the lamp (turned up) until morning comes.' ] },
  { id: 'out', title: 'Morning', when: s => !s.flags.dawn ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'It\'s over.', 'Go down into the yard.', 'Walk to the gate.', 'Open the gate.' ] },
];

/* ---------------- voices ---------------- */
function line(id, who, text, opts = {}) { return say(who, text, Object.assign({ clip: 'tk_' + id }, opts)); }
const LORNA = 'Lorna';
const look = (txt, ms = 5200) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5200) => subtitle('', `<i>${txt}</i>`, ms);
const took = id => S.inv.includes(id);
function heard(id) { if (!S.heard.includes(id)) { S.heard.push(id); save(); } }
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }

/* =====================================================================
   TIK-TIK · part E: what you carry and drag, the lamp, doors and shutters, the hunt,
   the visitor, the gate, the break-in, the legs, the siege, dawn; sound, lightning, saving
   ===================================================================== */
const SALA_SPAWN = { x: 1.1, z: 1.05, yaw: 0.0 };   // where you come to after she has you

/* ---------------- sound ---------------- */
// tik-tik: the bird-call she makes. Loud when she's far; faint when she's close.
function sTik(vol, pos, wet = 0.4) {
  if (!A.ready) return; const ctx = A.ctx, t = now();
  [0, 0.17].forEach((o, k) => {
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(3100 - k * 260, t + o); osc.frequency.exponentialRampToValueAtTime(2300 - k * 200, t + o + 0.05);
    const bp = filt('bandpass', 2900, 5), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + o); g.gain.exponentialRampToValueAtTime(vol, t + o + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.06);
    osc.connect(bp); bp.connect(g); route(g, { pos, wet, ref: 4, roll: 0.01 }); osc.start(t + o); osc.stop(t + o + 0.08);
  });
}
function sWing(pos, vol = 0.4) {
  if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false, true), bp = filt('bandpass', 260 + rand(-40, 40), 0.9), g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.07); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.15, ref: 1.2 }); n.start(t, Math.random() * 2); n.stop(t + 0.35);
}
function sShriek(pos, vol = 0.45, dur = 1.3, base = 820) {
  if (!A.ready) return; const ctx = A.ctx, t = now(), out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + 0.05); out.gain.setValueAtTime(vol, t + dur * 0.5); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const ws = ctx.createWaveShaper(); ws.curve = softClip(); const f1 = filt('bandpass', 1300, 3), f2 = filt('bandpass', 2700, 4), mix = ctx.createGain(); ws.connect(f1); ws.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(out);
  [1, 1.012, 0.497].forEach((m, i) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(base * m * 1.25, t); o.frequency.exponentialRampToValueAtTime(base * m, t + 0.15); o.frequency.exponentialRampToValueAtTime(base * m * 0.62, t + dur); const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 9 + i * 3; vg.gain.value = base * 0.04; v.connect(vg); vg.connect(o.frequency); const g = ctx.createGain(); g.gain.value = i === 2 ? 0.5 : 0.35; o.connect(g); g.connect(ws); o.start(t); o.stop(t + dur + 0.05); v.start(t); v.stop(t + dur + 0.05); });
  const n = noiseSrc(false), hp = filt('highpass', 2500, 0.7), ng = ctx.createGain(); ng.gain.setValueAtTime(0.3, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t); n.stop(t + dur);
  route(out, { pos, wet: 0.45, ref: 1.5 });
}
function sThatch(pos, n = 18) { for (let i = 0; i < n; i++) after(rand(0, 1.1), () => sClick(pos.clone().add(new THREE.Vector3(rand(-0.6, 0.6), rand(-0.2, 0.2), rand(-0.6, 0.6))), rand(0.1, 0.3), rand(900, 2600))); sScrape(pos, 1.2, 0.4); }
function sRip(pos) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 600, 1.5), g = ctx.createGain(); bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.8); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.7, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.3 }); n.start(t); n.stop(t + 1.05); sThatch(pos, 26); }
function sBang(pos, vol = 1) { sKnock(pos, 1.7 * vol, 0, 0); sThunk(pos, 1.0 * vol, 85); after(0.05, () => sClick(pos, 0.5 * vol, 1200)); }
function sPound(pos) { sThunk(pos, 0.95, 64); sKnock(pos, 1.1, 0, 1); }
function sHiss(pos, dur = 3) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), hp = filt('highpass', 2600, 0.6), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(hp); hp.connect(g); route(g, { pos, wet: 0.2 }); n.start(t); n.stop(t + dur); }
function sChop(pos) { sClick(pos, 0.7, 3400); sThunk(pos, 0.5, 220); }
function sStrike() { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 1800, 1.2), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.4, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); n.connect(bp); bp.connect(g); route(g, { wet: 0.1 }); n.start(t); n.stop(t + 0.3); after(0.18, () => { const n2 = noiseSrc(false, true), lp = filt('lowpass', 900, 0.7), g2 = ctx.createGain(), t2 = now(); g2.gain.setValueAtTime(0.0001, t2); g2.gain.linearRampToValueAtTime(0.3, t2 + 0.05); g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.7); n2.connect(lp); lp.connect(g2); route(g2, { wet: 0.1 }); n2.start(t2); n2.stop(t2 + 0.75); }); }
function sCall(seq, pos, vol, form = [1500, 3000], type = 'sawtooth') {
  if (!A.ready) return; const ctx = A.ctx; let t = now();
  for (const [f0, f1, d, gap] of seq) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 7; vg.gain.value = f0 * 0.02; v.connect(vg); vg.connect(o.frequency); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d); const mix = ctx.createGain(); form.forEach(f => { const b = filt('bandpass', f, 3); o.connect(b); b.connect(mix); }); mix.connect(g); route(g, { pos, wet: 0.5, ref: 2 }); o.start(t); o.stop(t + d + 0.02); v.start(t); v.stop(t + d + 0.02); t += d + (gap || 0); }
}
const sRooster = () => sCall([[520, 760, 0.16, 0.03], [740, 680, 0.14, 0.02], [700, 980, 0.3, 0], [960, 520, 0.85, 0]], new THREE.Vector3(9, 1.2, -10), 0.5, [1400, 2800]);
const sBaby = () => { for (let i = 0; i < 4; i++) after(i * 1.15, () => sCall([[430, 540, 0.25, 0], [540, 380, 0.45, 0]], POS.lorna.clone().add(new THREE.Vector3(-0.2, 0.3, 0)), 0.32, [1100, 2900, 4200])); };
const sPig = (pos) => sCall([[900, 1500, 0.12, 0], [1500, 760, 0.4, 0]], pos, 0.22, [1200, 2400]);
const sHen = (pos) => { for (let i = 0; i < 4; i++) after(i * 0.22 + rand(0, 0.08), () => sCall([[620, 520, 0.07, 0]], pos, 0.12, [900, 2000], 'square')); };
const sDog = () => sCall([[480, 700, 0.6, 0], [700, 460, 1.6, 0]], new THREE.Vector3(rand(-40, 40), 1, rand(30, 45)), 0.06, [900, 1800], 'triangle');
function sDrip(pos) { sClick(pos, 0.08, 4200 + rand(-600, 600)); }
function sMoan() { line('pain', LORNA, 'Oh, it hurts. Oh God.', { pos: POS.lorna, volume: 0.7 }); }

/* ---------------- where you are ---------------- */
const inBox = (x0, x1, z0, z1) => P.x > x0 && P.x < x1 && P.z > z0 && P.z < z1;
const insideHouse = () => inBox(HX0, HX1, HZ0, HZ1) && BODY.y > FLOOR - 0.3;
const underHouse = () => inBox(HX0 - 0.05, HX1 + 0.05, HZ0 - 0.05, HZ1 + 0.05) && BODY.y < FLOOR_BOT - 0.2;
const inGranary = () => inBox(GRAN.x0, GRAN.x1 + 0.1, GRAN.z0, GRAN.z1) && BODY.y > GRAN.floor - 0.3;
const underGranary = () => inBox(GRAN.x0, GRAN.x1, GRAN.z0, GRAN.z1) && BODY.y < 0.6;
const inOuthouse = () => O.OH && inBox(O.OH.x0, O.OH.x1, O.OH.z0, O.OH.z1);
const inPigShelter = () => inBox(5, 9, -11.5, -10.0);
const outdoors = () => !insideHouse() && !underHouse() && !inGranary() && !inOuthouse();
function covered() {
  if (V.hide) return true;
  if (insideHouse()) return true;
  return underHouse() || inGranary() || underGranary() || (inOuthouse() && !S.ohOpen) || (inPigShelter() && BODY.crouch) || (inOuthouse() && BODY.crouch);
}
function inKitchen() { return inBox(KITCH.x0, KITCH.x1, KITCH.z0, KITCH.z1) && BODY.y > FLOOR - 0.3; }
function inBedroom() { return inBox(BED.x0, BED.x1, BED.z0, BED.z1) && BODY.y > FLOOR - 0.3; }
const camY = () => camera.position.y;
// the big shapes that block her view of you
const OCC = [[HX0 - 0.95, HX1 + 0.95, 0, RIDGE, HZ0 - 0.95, HZ1 + 0.95], [GRAN.x0 - 0.5, GRAN.x1 + 0.5, 0, 4.8, GRAN.z0 - 0.5, GRAN.z1 + 0.5], [9.6, 10.8, 0, 2.3, -3.4, -2.2], [-11.2, -7.2, 2.8, 6.0, 2.0, 6.0], [4.7, 9.3, 1.7, 2.4, -11.6, -9.9]];
function segHitsBox(a, b, bx) {
  let t0 = 0, t1 = 1; const d = [b.x - a.x, b.y - a.y, b.z - a.z], o = [a.x, a.y, a.z], mn = [bx[0], bx[2], bx[4]], mx = [bx[1], bx[3], bx[5]];
  for (let i = 0; i < 3; i++) { if (Math.abs(d[i]) < 1e-9) { if (o[i] < mn[i] || o[i] > mx[i]) return false; continue; } let ta = (mn[i] - o[i]) / d[i], tb = (mx[i] - o[i]) / d[i]; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return false; }
  return true;
}
function herLOS(from) { const head = camera.position; for (const bx of OCC) if (segHitsBox(from, head, bx)) return false; return true; }

/* ---------------- what you carry, what you drag ---------------- */
function setupCarry() {
  holdable('bowl', { name: 'Coconut-shell bowl', world: O.bowlWorld, hand: O.bowlHand, handPos: [0.21, -0.24, -0.47], handRot: [0.45, 0, 0] });
  holdable('tabo', { name: 'Water dipper', world: O.tabo, hand: O.taboHand, handPos: [0.16, -0.25, -0.38], handRot: [0.15, -1.9, 0], dropRy: 0.3 });
  holdable('bolo', { name: 'Tatay\'s bolo', world: O.boloWorld, hand: O.boloHand, handPos: [0.24, -0.25, -0.38], handRot: [0.2, -1.75, 0.5], dropRy: 1.2 });
  draggable('stool', O.bench, { w: 0.42, dd: 0.42, h: 0.47, name: 'stool', heavy: 0.6 });
  draggable('crate', O.crate, { w: 0.62, dd: 0.62, h: 0.55, name: 'crate', heavy: 0.9 });
  draggable('mortar', O.mortar, { w: 0.48, dd: 0.48, h: 0.55, name: 'mortar', heavy: 1.2 });
}
function bowlShort() { const b = S.bowl || {}, c = ['ash', 'garlic', 'salt'].filter(k => b[k]); return 'Bowl' + (c.length ? ` (${c.join(', ')})` : ''); }
Object.defineProperty(ITEMS.bowl, 'short', { get: bowlShort });
Object.defineProperty(ITEMS.tabo, 'short', { get: () => S && S.taboFull ? 'Dipper (water)' : 'Dipper' });
function showBowl() { for (const g of [O.bowlWorld, O.bowlHand]) { const f = g.userData.fill; for (const k of ['ash', 'garlic', 'salt']) f[k].visible = !!(S.bowl && S.bowl[k]); } }
function pickUp(id) {
  holdTake(id);
  if (!S.inv.includes(id)) S.inv.push(id);
  S.held = id; renderInv(id);
  if (!S.ev.toldHold) { S.ev.toldHold = true; toast(`In your hands: <b>${esc(ITEMS[id].name)}</b>. ${G.touch ? 'The Put down button' : '<kbd>Q</kbd>'} puts it down.`, 6500); }
  else toast(`In your hands: <b>${esc(ITEMS[id].name)}</b>`, 2400);
}
function onHold(id, on) { if (!on) { S.inv = S.inv.filter(i => i !== id); if (S.held === id) S.held = null; renderInv(); } }

/* ---------------- the lamp ---------------- */
function lampLevel() { return S.lamp || 0; }
function toggleLamp() {
  if (!S.lamp || G.cutscene || V.catching) return;
  S.lamp = S.lamp === 2 ? 1 : 2; sClick(null, 0.12, 2200); save();
  toast(S.lamp === 2 ? 'Wick up: you can see. So can she.' : 'Wick down: barely a glow.', 2000); updatePrompt(true);
}
function lampUpdate(dt) {
  const lit = lampLevel() > 0;
  O.handLamp.visible = lit && !V.hide && !V.peek && !V.floorPeek && !V.catching;
  for (const g of [O.handLamp]) { g.userData.flame.visible = lit; g.userData.glow.visible = lit; }
  const tgt = !lit ? 0 : S.lamp === 2 ? (IS_TOUCH ? 3.2 : 2.5) : 0.7;
  V.lampK = lerp(V.lampK || 0, tgt, Math.min(1, dt * 6));
  const fl = 0.86 + Math.sin(G.time * 13) * 0.04 + Math.sin(G.time * 31.7) * 0.03 + (Math.random() - 0.5) * 0.06 + (V.gutter > 0 ? -0.5 * Math.random() : 0);
  V.gutter = Math.max(0, (V.gutter || 0) - dt);
  L.lamp.intensity = V.lampK * fl;
  if (lit) {
    if (V.hide || V.peek) L.lamp.position.copy(camera.position).add(new THREE.Vector3(0, -0.3, 0));
    else if (V.floorPeek) L.lamp.position.set(O.gapPos.x, FLOOR - 0.15, O.gapPos.z);
    else { O.handLamp.userData.flame.getWorldPosition(L.lamp.position); const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); fw.y = 0; fw.normalize(); L.lamp.position.addScaledVector(fw, 0.22); L.lamp.position.y += 0.16; }
    const s = 0.012 * (S.lamp === 2 ? 1 : 0.55) * fl; O.handLamp.userData.flame.scale.set(s / 0.012 * 1, s / 0.012 * 2.2, 1); O.handLamp.userData.glow.material.opacity = S.lamp === 2 ? 0.8 : 0.35;
  } else L.lamp.position.set(0, -50, 0);
  if (L.lamp.castShadow) renderer.shadowMap.needsUpdate = true;
}

/* ---------------- doors and shutters ---------------- */
function setDoor(state, quiet) {
  S.door = state; save();
  const open = state === 'open';
  O.doorSolid.on = !open;
  if (!quiet) { if (open) { sThunk(POS.door, 0.4, 160); sCreak(POS.door, 0.9, 0.18, 80); } else { sThunk(POS.door, 0.7, 120); after(0.3, () => sThunk(POS.door, 0.6, 200)); } }
  V.doorT = open ? 1 : 0;
}
function doorUpdate(dt) {
  V.doorK = lerp(V.doorK || 0, V.doorT || 0, Math.min(1, dt * 5));
  O.doorPivot.rotation.y = V.doorK * 1.75;
  const barred = S.door === 'barred';
  O.bar.position.copy(barred ? new THREE.Vector3(0, FLOOR + 1.0, HZ1 - 0.09) : O.barRest.pos); O.bar.rotation.copy(barred ? new THREE.Euler(0, 0, 0) : O.barRest.rot);
}
function setShutter(id, open, how) {
  const sh = O.shutters[id]; S.shut[id] = !open; save();
  sh.target = open ? 1 : 0;
  if (how === 'burst') { sh.k = 1; sBang(sh.mid, 1.2); G.shake = Math.max(G.shake || 0, 0.6); }
  else if (how === 'slam') { sh.k = 0; sBang(sh.mid, 0.9); }
  else if (open) sCreak(sh.mid, 0.6, 0.15, 110); else sThunk(sh.mid, 0.5, 140);
}
function shuttersUpdate(dt) {
  for (const id in O.shutters) { const sh = O.shutters[id]; sh.k = lerp(sh.k, sh.target, Math.min(1, dt * 7)); sh.pv.rotation.y = lerp(sh.closedRy, sh.openRy, sh.k); if (sh.k < 0.05) sh.pv.rotation.y += Math.sin(G.time * 17 + id.length) * 0.004 * (V.windy || 0.3); }
}
const shutOpen = id => !S.shut[id];

/* ---------------- interactions ---------------- */
function registerInteractions() {
  // --- Lorna
  inter('lorna', O.lorna, { name: 'Lorna', reach: 2.4, actions: () => {
    if (V.sg && V.sg.phase !== 'dawn' && V.sg.phase !== 'after') return [look('Lorna, clutching the net. She can\'t take her eyes off the roof.')];
    const a = [];
    if (HOLD.cur === 'tabo' && S.taboFull && !S.flags.key) a.push({ label: 'Give her the water', run: giveWater });
    a.push({ label: 'Talk to her', run: talkLorna });
    return a;
  } });
  // --- the lamp, and the matches up on the wardrobe
  inter('lamp', O.lampWorld, { name: 'Kerosene lamp', enabled: () => !S.flags.lit, actions: () => [took('matches') ? { label: 'Light the lamp', run: lightLamp } : look('A little tin lamp, a gasera, full of kerosene. You need a match.')] });
  hitbox('lamp', O.lampWorld, 0.06);
  inter('matches', O.matches, { name: () => high(2.0) ? 'Box of matches' : 'Top of the wardrobe', reach: 2.2, enabled: () => !took('matches') && !S.flags.lit, actions: () => high(2.0) ? [{ label: 'Take the matches', run: () => { give('matches'); O.matches.visible = false; flag('gotMatches'); } }] : [look('Too high to see what\'s up there. You\'d need to stand on something.')] });
  hitbox('matches', O.matches, 0.09);
  inter('aparador', O.aparador, { name: 'Wardrobe', actions: () => [{ label: 'Hide in the wardrobe', run: () => hideIn('wardrobe') }, look('Nanay\'s narra wardrobe, the one good piece of furniture in the house. Up on top is where she keeps things out of Lorna\'s reach.')] });
  inter('papag', O.papag, { name: 'Bamboo bed', actions: () => [{ label: 'Hide under the bed', run: () => hideIn('papag') }, look('The papag where you slept, slats of split bamboo on four legs.')] });
  // --- things you drag
  inter('stool', O.bench, { name: 'Stool', actions: () => [{ label: 'Drag the stool', run: () => startDrag('stool') }, look('A wooden stool, a bangkito. You could stand on it.')] });
  inter('crate', O.crate, { name: 'Wooden crate', actions: () => [{ label: 'Drag the crate', run: () => startDrag('crate') }, look('An empty crate for carrying coconuts to market. Solid enough to stand on.')] });
  hitbox('stool', O.bench, 0.06); hitbox('mortar', O.mortar, 0.04);
  // --- the kitchen
  inter('garlic', O.garlic, { name: 'Garlic braid', reach: 2.2, enabled: () => !took('garlic') && !S.flags.garlicIn, actions: () => high(1.85) ? [{ label: 'Take the garlic', run: () => { give('garlic'); O.garlic.visible = false; flag('gotGarlic'); sClick(null, 0.2, 1200); } }] : [look('A braid of garlic hanging from the beam, a hand\'s width out of reach. Jump for it, or stand on something.')] });
  hitbox('garlic', O.garlic, 0.07);
  inter('kalan', O.kalan, { name: 'Clay stove', actions: () => HOLD.cur === 'bowl' && !S.bowl.ash ? [{ label: 'Scoop ash into the bowl', run: () => { S.bowl.ash = true; showBowl(); renderInv(); save(); sScrape(O.kalan.position, 0.4, 0.15); toast('Ash in the bowl.', 2000); checkBowl(); } }] : [look(S.bowl.ash ? 'Cold ash, grey and soft as flour.' : 'A clay stove on a box of sand, full of cold grey ash. You\'d need something to carry it in.')] });
  hitbox('kalan', O.kalan, 0.06);
  inter('bowl', O.bowlWorld, { name: () => bowlShort(), actions: () => [{ label: 'Pick up the bowl', run: () => pickUp('bowl') }] });
  hitbox('bowl', O.bowlWorld, 0.06);
  inter('tapayan', O.tapayan, { name: 'Water jar', actions: () => HOLD.cur === 'tabo' && !S.taboFull ? [{ label: 'Fill the dipper', run: () => { S.taboFull = true; O.taboHand.userData.water.visible = true; renderInv(); save(); sSqueak(O.tapayan.position, 0.04); sScrape(O.tapayan.position, 0.4, 0.1); } }] : [look('A big clay tapayan of rainwater, cool to the touch.' + (!S.flags.key && S.flags.thirsty ? ' The dipper hangs on its rim.' : ''))] });
  inter('tabo', O.tabo, { name: 'Water dipper', actions: () => [{ label: 'Take the dipper', run: () => pickUp('tabo') }] });
  hitbox('tabo', O.tabo, 0.06);
  // --- the front door and the shutters
  inter('door', O.door, { name: 'Front door', reach: 2.2, actions: () => {
    if (S.door === 'barred') return [{ label: S.flags.dawn ? 'Unbar the door' : 'Lift the bar and open the door', run: () => { setDoor('open'); if (V.sg && V.sg.phase === 'door') { } } }];
    return [{ label: 'Shut the door and bar it', run: () => { if (P.z > HZ1 - 0.1) { toast('Not from out here: the bar\'s on the inside.', 2400); return; } setDoor('barred'); } }];
  } });
  O.doorHit = mbox(0.86, 1.9, 0.12, HITMAT, 0, FLOOR + 0.98, HZ1 - 0.02, scene, 1); O.doorHit.layers.set(2); O.doorHit.userData.hit = true;
  inter('doorway', O.doorHit, { name: () => S.door === 'open' ? 'Doorway' : 'Front door', reach: 2.2, actions: () => INTER.get('door').actions() });
  inter('bar', O.bar, { name: 'Door bar', actions: () => S.door === 'barred' ? [{ label: 'Lift the bar and open the door', run: () => setDoor('open') }] : [{ label: 'Shut the door and bar it', run: () => { if (P.z > HZ1 - 0.1) return; setDoor('barred'); } }] });
  for (const id in O.shutters) {
    const sh = O.shutters[id];
    inter('sh_' + id, sh.leaf, { name: 'Shutter', reach: 2.3, actions: () => shutOpen(id) ? [{ label: V.burst && V.burst[id] ? 'Slam the shutter' : 'Close the shutter', run: () => closeShutter(id) }] : [{ label: 'Open the shutter', run: () => openShutter(id) }] });
  }
  // the gap where the weave has rotted, and the gap in the floor
  O.peekHit = mbox(0.3, 0.3, 0.4, HITMAT, HX1 - 0.12, FLOOR + 0.88, -0.5, scene, 1); O.peekHit.layers.set(2); O.peekHit.userData.hit = true;
  inter('peek', O.peekHit, { name: 'Gap in the wall', reach: 1.6, actions: () => [{ label: 'Look through the gap', run: tryPeek }] });
  O.gapHit = mbox(0.7, 0.12, 0.3, HITMAT, O.gapPos.x, FLOOR + 0.04, O.gapPos.z, scene, 1); O.gapHit.layers.set(2); O.gapHit.userData.hit = true;
  inter('gap', O.gapHit, { name: 'Broken slats', reach: 2.2, actions: () => [{ label: 'Look down through the gap', run: floorPeek }] });
  // the photo, the calendar, the altar, the radio
  inter('photo', O.photo, { name: 'Photo', actions: () => [{ label: 'Look at it', run: () => { flag('photoSeen'); openDoc('photo'); } }] });
  inter('cal', O.cal, { name: 'Calendar', actions: () => [look('A calendar from Aling Nena\'s shop: October 1979. Today, the twentieth, is circled in blue biro. Lorna\'s due date.')] });
  inter('altar', O.altar, { name: 'Altar', actions: () => [look('The Santo Nino in his red robe and gold crown. The candle in front of him burned down to nothing an hour ago.')] });
  inter('radio', O.radio, { name: 'Transistor radio', actions: () => [look('Tatay\'s radio. The batteries died last week, the night the typhoon warnings started.')] });
  // --- the yard
  inter('mortar', O.mortar, { name: 'Wooden mortar', actions: mortarActions });
  inter('pestle', O.pestle, { name: 'Pestle', actions: () => [look('A heavy pole of hardwood, worn smooth: the pestle for the mortar beside it.')] });
  hitbox('pestle', O.pestle, 0.05);
  inter('padlock', O.padlock, { name: 'Padlock', enabled: () => !S.flags.granOpen, actions: () => took('key') ? [{ label: 'Unlock it', run: () => { flag('granOpen'); drop('key'); sClick(O.padlock.position, 0.4, 1600); sThunk(O.padlock.position, 0.3, 300); O.padlock.visible = false; setGranDoor(true); } }] : [look('A rusty padlock on a hasp. Tatay keeps the granary locked.')] });
  hitbox('padlock', O.padlock, 0.08);
  inter('granDoor', O.granDoor, { name: 'Granary door', reach: 2.4, actions: () => S.flags.granOpen ? [{ label: S.granDoor ? 'Close the door' : 'Open the door', run: () => setGranDoor(!S.granDoor) }] : [look('Padlocked. And the doorway is chest-high: the ladder below it has been snapped to pieces.')] });
  inter('saltJar', O.saltJar, { name: 'Clay jar', actions: () => {
    if (!S.flags.lidOff) return [{ label: 'Lift the lid off', run: () => { flag('lidOff'); tween(0.6, k => { O.saltLid.position.set(lerp(0, 0.32, k), 0.565 + Math.sin(k * Math.PI) * 0.15, lerp(0, 0.08, k)); O.saltLid.rotation.z = -k * 0.4; }); sScrape(O.saltJar.position, 0.4, 0.25); } }];
    if (HOLD.cur === 'bowl' && !S.bowl.salt) return [{ label: 'Fill the bowl with salt', run: () => { S.bowl.salt = true; showBowl(); renderInv(); save(); sScrape(O.saltJar.position, 0.6, 0.2); toast('Rock salt in the bowl.', 2000); checkBowl(); } }];
    return [look('Coarse grey rock salt, nearly to the brim.' + (S.bowl.salt ? '' : ' You need something to carry it in.'))];
  } });
  inter('stump', O.stump, { name: () => S.flags.boloOut ? 'Chopping stump' : 'Bolo in the stump', actions: () => S.flags.boloOut ? [look('The stump, scarred by years of firewood.')] : [{ label: (S.tugs || 0) ? 'Pull harder' : 'Pull the bolo out', run: tugBolo }] });
  inter('boloW', O.boloWorld, { name: () => S.flags.boloOut ? 'Tatay\'s bolo' : 'Bolo in the stump', actions: () => S.flags.boloOut ? [{ label: 'Pick up the bolo', run: () => pickUp('bolo') }] : [{ label: (S.tugs || 0) ? 'Pull harder' : 'Pull the bolo out', run: tugBolo }] });
  hitbox('boloW', O.boloWorld, 0.05);
  inter('panel', O.panelPivot, { name: () => S.flags.panelCut ? 'The way under the house' : 'Woven screen, tied shut', reach: 2.2, enabled: () => !S.flags.panelCut, actions: () => HOLD.cur === 'bolo' ? [{ label: 'Cut the rope', run: hackRope }] : [look('One screen of the skirt around the crawlspace isn\'t nailed: it\'s lashed to the post with rope, swollen tight in the wet. You\'d need a blade.')] });
  inter('legs', O.legsHit, { name: 'What\'s standing here', reach: 1.9, enabled: () => !S.flags.salted, actions: legsActions });
  inter('gate', O.gateBar, { name: 'Gate', reach: 2.3, actions: () => {
    if (S.flags.dawn) return [{ label: 'Open the gate', run: openGate }];
    if (V.gate) return [{ label: 'Lift the bar', run: () => caught('gate') }];
    return [look('The gate is barred. Beyond it there\'s only the road, and the dark. Nanay went that way.')];
  } });
  for (const g of [O.gateL, O.gateR]) inter(g === O.gateL ? 'gateL' : 'gateR', g, { name: 'Gate', reach: 2.3, actions: () => INTER.get('gate').actions() });
  inter('ohDoor', O.ohDoor, { name: 'Outhouse door', actions: () => [{ label: S.ohOpen ? 'Pull it shut' : 'Open it', run: () => setOhDoor(!S.ohOpen) }] });
  O.pigs.forEach((p, i) => inter('pig' + i, p, { name: 'Pigs', reach: 3, actions: () => [look('Two pigs pressed together in the far corner of the pen, shivering. They won\'t look up at the sky.')] }));
}
function closeShutter(id) { setShutter(id, false, V.burst && V.burst[id] ? 'slam' : undefined); }
function openShutter(id) { setShutter(id, true); }
const high = (above) => camera.position.y > FLOOR + above;
function startDrag(id) {
  dragStart(id);
  if (DRAG.cur && !S.ev.toldDrag) { S.ev.toldDrag = true; toast(`Walk to drag it. ${G.touch ? 'Let go' : '<kbd>E</kbd>'} lets go. ${G.touch ? 'Jump' : '<kbd>Space</kbd>'} climbs onto it.`, 6500); }
}

/* ---------------- Lorna ---------------- */
let talkBusy = false;
async function talkLorna() {
  if (talkBusy) return; talkBusy = true; V.lornaLook = 3;
  const f = S.flags, b = S.bowl;
  try {
    if (!f.lit) { await line('matches', LORNA, 'The matches are on top of the wardrobe. Nanay keeps them up there.', { pos: POS.lorna }); heard('matches'); }
    else if (!f.manaKnown) await line(f.visitor ? 'look' : 'light', LORNA, f.visitor ? 'Look through the gap in the wall. Look at her feet.' : 'Thank you. Stay there, near the light.', { pos: POS.lorna, fx: f.visitor ? 'whisper' : undefined });
    else if (V.sg && V.sg.phase === 'after') await line('baby', LORNA, 'She\'s here. She\'s here.', { pos: POS.lorna });
    else if (!f.key) { await line('water', LORNA, 'Water. Please. I\'m so thirsty.', { pos: POS.lorna }); flag('thirsty'); }
    else if (!b.garlic) { await line(f.gotGarlic || f.garlicIn ? 'mortar' : 'garlic', LORNA, f.gotGarlic || f.garlicIn ? 'Pound the garlic in the mortar. It\'s outside, behind the house.' : 'There\'s garlic hanging up in the kitchen. High up.', { pos: POS.lorna }); heard('garlic'); }
    else if (!b.ash) { await line('ash', LORNA, 'Ash. In the stove, in the kitchen. Use the coconut bowl.', { pos: POS.lorna }); heard('ash'); }
    else if (!b.salt) await line('thanks', LORNA, 'The key to the granary... the salt is in there.', { pos: POS.lorna });
    else if (!f.panelCut) { await line('rustle', LORNA, 'Something\'s been rustling under the floor all night.', { pos: POS.lorna, fx: 'whisper' }); flag('rustle'); await line('bolo', LORNA, 'The screen at the back of the house is tied shut. Tatay\'s bolo is in the chopping stump.', { pos: POS.lorna }); heard('bolo'); }
    else await line('go', LORNA, 'Hurry. It\'s nearly morning.', { pos: POS.lorna });
  } finally { talkBusy = false; }
}
function giveWater() {
  HOLD.cur = null; O.taboHand.visible = false; onHold('tabo', false); S.taboFull = false; O.taboHand.userData.water.visible = false;
  O.tabo.visible = true; O.tabo.position.set(2.0, FLOOR + 0.02, -1.45); O.tabo.rotation.set(0, 1.2, 0); S.props.tabo = { x: 2.0, y: FLOOR + 0.02, z: -1.45, ry: 1.2 };
  tween(0.6, k => { O.lornaArm.rotation.y = lerp(-0.4, 0.5, Math.sin(k * Math.PI)); });
  sSqueak(POS.lorna, 0.03);
  after(1.2, async () => { await line('thanks', LORNA, 'Thank you. Here\'s the key to the granary. The salt is in there.', { pos: POS.lorna }); heard('thanks'); });
  after(2.2, () => { give('key'); flag('key'); });
  save();
}
function lightLamp() {
  if (S.flags.lit) return;
  sStrike(); flag('lit'); S.lamp = 2;
  O.lampWorld.visible = false;
  after(0.5, () => { line('light', LORNA, 'Thank you. Stay there, near the light.', { pos: POS.lorna }); toast(`The lamp is in your left hand. ${G.touch ? 'The Lamp button' : '<kbd>F</kbd>'} turns the wick up or down.`, 6500); });
  V.litT = 0; renderInv(); save();
}

/* ---------------- the mortar ---------------- */
function mortarActions() {
  const f = S.flags, a = [];
  if (took('garlic') && !f.garlicIn) a.push({ label: 'Put the garlic in', run: () => { drop('garlic'); flag('garlicIn'); S.pounds = 0; O.mortarCloves.visible = true; sClick(O.mortar.position, 0.2, 1400); } });
  else if (f.garlicIn && !f.garlicCrushed) a.push({ label: (S.pounds || 0) ? `Pound it (${S.pounds} of 6)` : 'Pound it with the pestle', run: pound });
  else if (f.garlicCrushed && !S.bowl.garlic) a.push(HOLD.cur === 'bowl' ? { label: 'Scoop the garlic into the bowl', run: () => { S.bowl.garlic = true; O.mortarPaste.visible = false; showBowl(); renderInv(); save(); sScrape(O.mortar.position, 0.3, 0.12); toast('Crushed garlic in the bowl.', 2000); checkBowl(); } } : look('Crushed garlic in the bottom, sharp enough to sting your eyes. You need something to carry it in.'));
  a.push({ label: 'Drag the mortar', run: () => startDrag('mortar') });
  if (!a.some(x => x.label && x.run && x.label !== 'Drag the mortar')) a.unshift(look('A heavy wooden lusong for pounding rice.' + (took('garlic') ? '' : ' The pestle leans against the house.')));
  return a.slice(0, 2);
}
function pound() {
  if (V.pounding) return; V.pounding = true;
  const m = O.mortar.position, p = O.pestle;
  if (!V.pestleHome) V.pestleHome = { pos: p.position.clone(), rot: p.rotation.clone() };
  p.position.set(m.x, m.y + 1.05, m.z); p.rotation.set(0, 0, 0);
  tween(0.32, k => { p.position.y = m.y + lerp(1.05, 0.42, k * k); }, () => {
    sPound(m.clone().setY(0.5)); noise(m, 24); G.shake = Math.max(G.shake || 0, 0.15);
    S.pounds = (S.pounds || 0) + 1; save();
    if (S.pounds >= 6) { flag('garlicCrushed'); O.mortarCloves.visible = false; O.mortarPaste.visible = true; toast('The garlic is pounded to a paste.', 2600); }
    tween(0.25, k => { p.position.y = m.y + lerp(0.42, 1.0, k); }, () => { V.pounding = false; if (S.flags.garlicCrushed) { p.position.copy(V.pestleHome.pos); p.rotation.copy(V.pestleHome.rot); } updatePrompt(true); });
  }, k => k);
}

/* ---------------- the granary, the bolo, the screen ---------------- */
function setGranDoor(open) { S.granDoor = open; save(); O.granDoorSolid.on = !open; tween(0.7, k => { O.granDoor.rotation.y = lerp(open ? 0 : -1.9, open ? -1.9 : 0, k); }); sCreak(POS.granDoor, 0.8, 0.2, 90); }
function setOhDoor(open) { S.ohOpen = open; save(); O.ohDoorSolid.on = false; tween(0.4, k => { O.ohDoor.rotation.y = lerp(open ? 0 : -1.6, open ? -1.6 : 0, k); }); sThunk(POS.outhouse, 0.4, 150); }
function tugBolo() {
  if (V.tugging) return; V.tugging = true;
  S.tugs = (S.tugs || 0) + 1; save();
  const b = O.boloWorld, r0 = b.rotation.z;
  sCreak(POS.stump.clone().setY(0.5), 0.35, 0.25, 140); G.shake = Math.max(G.shake || 0, 0.2);
  tween(0.35, k => { b.rotation.z = r0 + Math.sin(k * Math.PI * 3) * 0.08; b.position.y = 0.44 + k * 0.01 * S.tugs; }, () => {
    V.tugging = false; b.rotation.z = r0;
    if (S.tugs >= 4) { flag('boloOut'); sClick(b.position, 0.6, 2600); pickUp('bolo'); }
    else toast(['It\'s stuck fast.', 'It shifts a little.', 'Nearly...'][S.tugs - 1], 1500);
    updatePrompt(true);
  });
}
function hackRope() {
  if (V.hacking) return; V.hacking = true;
  S.hacks = (S.hacks || 0) + 1; save();
  const h = O.boloHand, r = h.rotation.clone();
  tween(0.22, k => { h.rotation.x = r.x - Math.sin(k * Math.PI) * 0.9; }, () => {
    V.hacking = false; sChop(POS.panel);
    if (S.hacks >= 2) { flag('panelCut'); O.lash.visible = false; O.panelSolid.on = false; sThunk(POS.panel, 0.7, 90); tween(0.9, k => { O.panelPivot.rotation.x = -k * k * Math.PI / 2; }, null, k => k); toast(`The screen falls open. It's low under there: ${G.touch ? 'Crouch' : '<kbd>C</kbd>'} to crawl.`, 4000); }
    updatePrompt(true);
  });
}

/* ---------------- looking: the gap in the wall, the gap in the floor ---------------- */
function tryPeek() {
  if (!BODY.crouch) { toast(`It's low down, at the height of your knees. ${G.touch ? 'Crouch' : 'Press <kbd>C</kbd>'} to look through it.`, 3000); return; }
  if (V.visitor && !S.flags.peeked) { startPeek(); return; }
  V.peek = { t: 0, plain: true }; G.frozen = true; peekMask(true);
  after(0.1, () => sayI(S.flags.dawn ? 'Grey light, the yard steaming. The rain has stopped.' : 'Rain slanting through the dark. The banana leaves thrashing. Nothing else. Nothing you can see.', 3600));
  after(3.8, endPeek);
}
function peekMask(on) { const el = $('#tkHide'); if (on) { el.className = 'tkhide peek'; el.hidden = false; } else if (!V.hide) el.hidden = true; }
function startPeek() {
  flag('peeked'); V.peek = { t: 0 }; G.frozen = true; updatePrompt(true); peekMask(true);
  after(0.5, () => flashLightning(true)); after(2.7, () => flashLightning(false)); after(4.1, () => flashLightning(true));
  after(1.6, () => sayI('Beside the window, at the height of a face, a woman hangs in the rain. There is nothing below her waist. Something dark and wet trails from it. She holds herself up on folded wings.', 7000));
  after(3.6, () => { V.peek.turn = true; });
  after(4.7, () => { showFace(0.5); sShriek(POS.bedWin.clone().add(new THREE.Vector3(0.8, 0, 0)), 0.6, 1.4); sStinger(1.2); G.flash = 0.35; G.shake = 1.4; G.fearT = 1; });
  after(5.3, () => { endPeek(); visitorLeaves(); });
}
function endPeek() { if (!V.peek) return; V.peek = null; G.frozen = false; peekMask(false); camera.fov = 70; camera.updateProjectionMatrix(); updateProj(); updatePrompt(true); }
function floorPeek() {
  if (V.floorPeek) return;
  if (!lampLevel()) { sayI('Black down there. You can\'t see a thing without a light.', 3200); return; }
  V.floorPeek = { t: 0 }; G.frozen = true; updatePrompt(true);
  after(1.4, () => {
    if (S.flags.salted) sayI(S.flags.dawn ? 'Down in the dust: the legs, folded at the knees, the navy skirt with its little white flowers.' : 'The legs below the floor, crusted white, trembling.', 5000);
    else { sayI('Under the floor, in the lamplight: a pair of legs, standing. A navy skirt. Red rubber slippers. Nothing above the waist. Something wet glistens where the rest of her should be.', 7500); flag('legsSeen'); G.fearT = Math.max(G.fearT || 0, 0.7); sHeart(4, 0.5, 0.6); after(2.0, () => sScrape(POS.legs.clone().setY(0.2), 0.4, 0.15)); }
  });
  after(4.2, () => { V.floorPeek = null; G.frozen = false; updatePrompt(true); });
}

/* ---------------- hiding ---------------- */
function hideIn(spot) {
  if (V.hide || V.catching) return;
  if (DRAG.cur) dragEnd(true);
  V.hide = { spot, t: 0, back: { x: P.x, z: P.z, y: BODY.y, yaw: G.yaw } };
  G.frozen = true; BODY.crouch = false;
  if (spot === 'wardrobe') { G.yaw = -Math.PI / 2; G.pitch = -0.05; sCreak(O.aparador.position.clone().setY(FLOOR + 1), 0.5, 0.15, 120); }
  else { G.yaw = 0; G.pitch = -0.02; sScrape(O.papag.position.clone().setY(FLOOR + 0.2), 0.5, 0.15); }
  $('#tkHide').className = 'tkhide ' + spot; $('#tkHide').hidden = false;
  updatePrompt(true);
}
function unhide(quiet) {
  if (!V.hide) return; const b = V.hide.back, spot = V.hide.spot; V.hide = null; G.frozen = false;
  const out = spot === 'wardrobe' ? { x: 1.62, z: -2.05, yaw: -Math.PI / 2 } : { x: -2.55, z: 1.75, yaw: 0 };
  bodyPlace(out.x, FLOOR, out.z, out.yaw, false);
  $('#tkHide').hidden = true;
  if (!quiet) sCreak(camera.position, 0.4, 0.12, 120);
  if (V.bi && V.bi.inside && !quiet) { const d = V.h.pos.distanceTo(camera.position); if (d < 6.5) caught('hide'); }
  updatePrompt(true);
}
function hideCam() {
  const h = V.hide; if (!h) return;
  if (h.spot === 'wardrobe') camera.position.set(0.98, FLOOR + 1.48, -2.05);
  else camera.position.set(-2.55, FLOOR + 0.2, 2.42);
  camera.updateMatrixWorld();
}

/* ---------------- the hunt ---------------- */
const Hh = () => V.h;
function hSet(state, dur = 0) { const h = V.h; h.state = state; h.t = 0; h.dur = dur; }
function steer(target, maxSp, acc, dt) {
  const h = V.h, d = target.clone().sub(h.pos), dist = d.length();
  const want = dist > 1e-4 ? d.multiplyScalar(Math.min(maxSp, dist * 1.4) / dist) : d;
  const dv = want.sub(h.vel), l = dv.length(); if (l > acc * dt) dv.multiplyScalar(acc * dt / l);
  h.vel.add(dv); h.pos.addScaledVector(h.vel, dt); return dist;
}
function noise(pos, radius) {
  const h = V.h; if (!h || !['circle', 'perch', 'away', 'roof'].includes(h.state) || V.sg || V.bi || V.gate || !S.flags.manaKnown) return;
  const d = h.pos.distanceTo(pos);
  if (d < radius + (h.state === 'away' ? -10 : 8)) { h.noisePos = pos.clone(); hSet('inspect', 6); }
}
function detectRange() {
  let R = !lampLevel() ? 6.5 : S.lamp === 2 ? 20 : 8.5;
  if (BODY.crouch) R *= 0.6;
  if (G.moving && (keys.ShiftLeft || keys.ShiftRight) && !BODY.crouch) R *= 1.3;
  if (V.flashK > 0.3) R *= 1.4;
  return R;
}
function hunterUpdate(dt) {
  const h = V.h; h.t += dt;
  const head = camera.position, toP = head.clone().sub(h.pos), dP = toP.length(); h.dist2D = Math.hypot(h.pos.x - P.x, h.pos.z - P.z);
  let flap = 1.4, spread = 1, reach = 0, face = null;
  const exposed = outdoors() && !covered() && !V.catching && G.mode === 'play';
  const watch = ['circle', 'perch', 'roof', 'inspect'].includes(h.state) || (V.sg && V.sg.phase === 'run' && h.state === 'circle');
  // seeing you
  if (watch && exposed) {
    const R = detectRange();
    if (dP < R && herLOS(h.pos)) { h.meter += dt * (0.3 + 1.45 * Math.pow(1 - dP / R, 0.7)) * (V.sg ? 1.5 : 1); h.noticed = true; }
    else h.meter = Math.max(0, h.meter - dt * 0.4);
    if (h.meter >= 1) { h.meter = 0; hSet('alert', S.ev.dived ? 1.2 : 1.8); S.ev.dived = true; sShriek(h.pos, 0.6, 1.2); sStinger(0.8); G.fearT = Math.max(G.fearT || 0, 0.9); flag('hunted'); }
  } else h.meter = Math.max(0, h.meter - dt * 0.4);
  switch (h.state) {
    case 'off': O.mn.visible = false; return;
    case 'away': { const tgt = new THREE.Vector3(Math.cos(h.ang) * 48, 15, Math.sin(h.ang) * 48); h.ang += dt * 0.05; steer(tgt, 9, 6, dt); flap = 1.2; if (h.t > h.dur) hSet('circle', rand(48, 70)); break; }
    case 'circle': {
      h.ang += dt * 0.21; const r = 11 + Math.sin(h.t * 0.13) * 2;
      steer(new THREE.Vector3(Math.cos(h.ang) * r, 8 + Math.sin(h.t * 0.4) * 1.4, Math.sin(h.ang) * r * 0.9), 6.5, 4, dt);
      h.nextPerch = (h.nextPerch ?? rand(10, 18)) - dt;
      if (h.nextPerch <= 0) { h.nextPerch = rand(14, 24); const r2 = Math.random(); if (insideHouse() && r2 < 0.45) { const open = Object.keys(O.shutters).filter(shutOpen); if (open.length && S.flags.manaKnown && (G.time - (V.lastWin || -99)) > 40) { h.win = pick(open); hSet('window', 14); V.lastWin = G.time; break; } hSet('roof', rand(5, 8)); h.roofPt = new THREE.Vector3(rand(-1.5, 1.5), RIDGE + 0.1, 0); break; } if (r2 < 0.7) { h.perch = pick(O.perches); hSet('perch', rand(6, 10)); } }
      if (h.t > h.dur && !V.sg) hSet('away', rand(24, 36));
      break;
    }
    case 'perch': { const p = h.perch.clone().add(new THREE.Vector3(0, 0.7, 0)); const d = steer(p, 5, 5, dt); if (d < 0.4) { h.vel.multiplyScalar(0.8); spread = 0.12; flap = 0.25; face = head; } if (h.t > h.dur) hSet('circle', rand(30, 50)); break; }
    case 'roof': { const d = steer(h.roofPt.clone().add(new THREE.Vector3(0, 0.55, 0)), 5, 5, dt); if (d < 0.5) { h.vel.multiplyScalar(0.8); spread = 0.15; flap = 0.3; h.scr = (h.scr || 0) - dt; if (h.scr <= 0) { h.scr = rand(0.6, 1.6); sScrape(h.pos.clone().setY(EAVE + 0.8), rand(0.3, 0.7), 0.3); if (Math.random() < 0.3) sKnock(h.pos.clone().setY(EAVE + 0.8), 0.6, 0, 1); } } if (h.t > h.dur) hSet('circle', rand(30, 50)); break; }
    case 'inspect': { const d = steer(h.noisePos.clone().setY(Math.max(3.5, h.noisePos.y + 3)), 8, 7, dt); if (d < 1) { h.vel.multiplyScalar(0.9); flap = 2; face = head; } if (h.t > h.dur) hSet('circle', rand(30, 45)); break; }
    case 'alert': { h.vel.multiplyScalar(0.85); h.pos.addScaledVector(h.vel, dt); face = head; flap = 2.2; spread = 1; reach = 0.4; if (h.t > h.dur) hSet('dive', 6); break; }
    case 'dive': {
      reach = 1; flap = 2.6; spread = 0.75;
      const lead = head.clone(); const d = steer(lead, 11, 22, dt);
      // never through the roof
      if (h.pos.x > HX0 - 0.9 && h.pos.x < HX1 + 0.9 && h.pos.z > HZ0 - 0.9 && h.pos.z < HZ1 + 0.9 && h.pos.y < RIDGE + 0.4) h.pos.y = Math.max(h.pos.y, RIDGE + 0.4);
      if (covered()) { sShriek(h.pos, 0.45, 0.9, 620); hSet('pull', 2.5); break; }
      if (d < 1.1) { caught('dive'); break; }
      if (h.t > h.dur) hSet('circle', 30);
      break;
    }
    case 'pull': { steer(h.pos.clone().add(new THREE.Vector3(0, 6, 0)).add(h.vel.clone().setY(0).normalize().multiplyScalar(4)), 8, 10, dt); flap = 2.2; if (h.t > h.dur) { if (underHouse() || insideHouse()) { hSet('roof', rand(5, 8)); h.roofPt = new THREE.Vector3(clamp(P.x, -1.5, 1.5), RIDGE + 0.1, 0); } else hSet('circle', rand(30, 50)); } break; }
    case 'window': {
      const sh = O.shutters[h.win];
      const n = h.win === 'kit' ? new THREE.Vector3(-1, 0, 0) : h.win === 'bed' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
      const spot = sh.mid.clone().addScaledVector(n, 1.05).add(new THREE.Vector3(0, -0.55, 0));
      const d = steer(spot, 6, 6, dt); face = sh.mid.clone().addScaledVector(n, -2); spread = 0.35; flap = 1.8;
      if (d < 0.6) {
        h.atWin = (h.atWin || 0) + dt;
        if (!h.knocked) { h.knocked = true; if (!shutOpen(h.win)) { sKnocks(sh.mid, 3, 0.4, 1.0); h.t = h.dur - 3; } else { G.fearT = Math.max(G.fearT || 0, 0.8); if (!S.ev.winSeen) { S.ev.winSeen = true; } } }
        if (shutOpen(h.win)) { const inside = camera.position.distanceTo(sh.mid) < 2.3 && insideHouse(); if (inside && h.atWin > 1.0) { caught('window'); break; } reach = h.atWin > 0.6 ? 0.8 : 0; h.wasOpen = true; }
        else if (h.wasOpen && !h.banged) { h.banged = true; sBang(sh.mid, 1.0); sShriek(h.pos, 0.4, 0.8, 640); h.t = Math.max(h.t, h.dur - 1.5); }
      }
      if (h.t > h.dur) { h.knocked = false; h.atWin = 0; h.wasOpen = false; h.banged = false; hSet('circle', rand(30, 50)); }
      break;
    }
    case 'scripted': break;
  }
  if (h.state !== 'scripted') {
    // face where you're going (or at what you want)
    const look = face ? face.clone().sub(h.pos) : h.vel.clone(); if (look.lengthSq() > 1e-4) { h.yaw = Math.atan2(look.x, look.z); h.pitch = clamp(-Math.atan2(look.y, Math.hypot(look.x, look.z)), -0.7, 0.9) * (face ? 0.6 : 0.4); }
    h.flap = lerp(h.flap, flap, Math.min(1, dt * 3)); h.spread = lerp(h.spread, spread, Math.min(1, dt * 3)); h.reach = lerp(h.reach, reach, Math.min(1, dt * 4));
  }
  placeCreature(dt);
  // sound: wingbeats close by; the tik-tik, inverted
  h.phase = (h.phase || 0) + dt * h.flap; if (Math.floor(h.phase) !== h.lastBeat) { h.lastBeat = Math.floor(h.phase); if (dP < 18 && h.spread > 0.4 && O.mn.visible) sWing(h.pos, clamp(0.55 - dP * 0.025, 0.05, 0.55)); }
  if (S.flags.manaKnown && !V.bi && !(V.sg && V.sg.phase !== 'run') && !S.flags.dawn && h.state !== 'off') {
    h.tikT -= dt; if (h.tikT <= 0) { h.tikT = rand(2.6, 5.2) * (h.state === 'alert' || h.state === 'dive' ? 99 : 1); const dir = h.pos.clone().sub(head).setY(0).normalize(); const vol = lerp(0.03, 0.55, clamp((h.dist2D - 6) / 30, 0, 1)); sTik(vol, head.clone().addScaledVector(dir, 4).setY(head.y + 1), lerp(0.85, 0.25, vol / 0.55)); }
  }
  // her red glow up close
  L.her.position.copy(h.pos).add(new THREE.Vector3(0, 0.6, 0)); L.her.intensity = O.mn.visible ? clamp(1 - dP / 7, 0, 1) * 0.9 : 0;
  // a heartbeat when she's close and has seen you
  if (O.mn.visible && dP < 9 && (h.state === 'alert' || h.state === 'dive' || h.meter > 0.35 || h.state === 'scripted')) { V.hbT = (V.hbT || 0) - dt; if (V.hbT <= 0) { const r = lerp(0.42, 0.9, clamp(dP / 9, 0, 1)); V.hbT = r * 2; sHeart(2, 0.5 - dP * 0.03, r); } }
}
function placeCreature(dt) {
  const h = V.h, R = O.mn;
  R.visible = h.state !== 'off';
  V.mnVel = h.vel;
  R.position.copy(h.pos); R.rotation.set(h.pitch || 0, h.yaw || 0, 0, 'YXZ');
  poseCreature(G.time, h.flap, h.spread, h.reach, dt);
  if (h.headTurn !== undefined) O.mnNeck.rotation.y = h.headTurn; else O.mnNeck.rotation.y = lerp(O.mnNeck.rotation.y, 0, Math.min(1, dt * 2));
}

/* ---------------- caught ---------------- */
function showFace(dur) {
  O.face.visible = true; O.face.position.set(0.01, -0.03, -0.34); O.face.rotation.set(0, 0, 0.06);
  tween(dur, k => { O.face.position.z = lerp(-0.34, -0.25, k); O.face.rotation.z = 0.06 + k * 0.05; O.faceMat.color.setScalar(Math.random() < 0.18 ? 0.35 : lerp(0.7, 1, k)); }, () => { O.face.visible = false; O.faceMat.color.setScalar(1); }, k => k);
}
function caught(why) {
  if (V.catching || G.mode !== 'play') return;
  V.catching = { why, t: 0 }; G.cutscene = true; releasePointer(); if (UI.kind) UI.close(true);
  
  if (V.peek) endPeek(); if (V.floorPeek) { V.floorPeek = null; G.frozen = false; }
  $('#tkHide').hidden = true;
  if (V.hide) { V.hide = null; G.frozen = false; $('#tkHide').hidden = true; }
  if (DRAG.cur) dragEnd(true);
  S.wrong++; save();
  showFace(0.6); sStinger(1.25); sShriek(camera.position.clone().add(new THREE.Vector3(0, 0, -0.3)), 0.55, 1.1, 900); G.shake = 1.8; G.fearT = 1; G.red = 0.7;
  after(0.65, () => { V.black = 2.4; sWing(camera.position, 0.7); after(0.25, () => sWing(camera.position.clone().setY(camera.position.y + 2), 0.5)); });
  after(1.6, () => sayI(why === 'gate' ? 'The bar lifts. Over the top of the gate she comes, and her arms are around you, and the ground is gone.' : 'Wings close around you. Nails in your shoulders. Your feet leave the ground.', 4000));
  after(3.0, respawn);
}
function respawn() {
  const why = V.catching ? V.catching.why : '';
  V.catching = null; O.face.visible = false;
  bodyPlace(SALA_SPAWN.x, FLOOR, SALA_SPAWN.z, SALA_SPAWN.yaw, false); G.pitch = -0.1;
  if (V.gate) gateEnd(true);
  if (V.bi) breakinEnd(true);
  if (V.visitor && !S.flags.peeked) { flag('peeked'); visitorLeaves(true); }
  if (V.sg && !S.flags.dawn) siegeRestart();
  else if (V.h.state !== 'scripted') { hSet('away', 26); V.h.pos.set(rand(-30, 30), 16, rand(-40, -30)); }
  G.cutscene = false; V.black = 0.8; G.blackT = 0;
  updatePrompt(true);
  after(0.9, () => { if (!V.sg) line('back', LORNA, 'You came back. I thought she had you.', { pos: POS.lorna }); });
}

/* ---------------- the visitor at the window ---------------- */
function startVisitor() {
  flag('visitor'); V.visitor = { t: 0 };
  const h = V.h; hSet('scripted'); h.pos.set(HX1 + 1.0, FLOOR + 0.62, -1.72); h.vel.set(0, 0, 0); h.yaw = -Math.PI / 2; h.pitch = 0; h.flap = 0.6; h.spread = 0.12; h.reach = 0; h.headTurn = 0;
  if (shutOpen('bed')) setShutter('bed', false);
  sKnocks(POS.bedWin.clone().add(new THREE.Vector3(0.1, 0, 0)), 3, 0.5, 1.0);
  after(1.8, async () => {
    await line('ising1', 'At the window', 'Lorna? It\'s Manang Ising, the midwife. Your Nanay sent me. Open the window, child.', { pos: POS.bedWin.clone().add(new THREE.Vector3(0.6, 0, 0)), fx: 'muffled', volume: 1.3 });
    if (!V.visitor) return;
    await line('shh', LORNA, 'Shh. Don\'t open it.', { pos: POS.lorna, fx: 'whisper' });
    if (!V.visitor) return;
    await line('died', LORNA, 'Manang Ising is dead. She died last year.', { pos: POS.lorna, fx: 'whisper' });
    if (!V.visitor) return;
    await line('look', LORNA, 'Look through the gap in the wall. Look at her feet.', { pos: POS.lorna, fx: 'whisper' });
  });
}
function visitorUpdate(dt) {
  const v = V.visitor; if (!v) return; v.t += dt;
  const h = V.h; h.pos.y = FLOOR + 0.62 + Math.sin(G.time * 1.1) * 0.04; h.flap = 0.5; h.spread = 0.12 + Math.max(0, Math.sin(G.time * 0.7)) * 0.08;
  if (V.peek && V.peek.turn) h.headTurn = lerp(h.headTurn || 0, 0.9, Math.min(1, dt * 2.5));
  // she tries the shutter now and then
  v.knT = (v.knT ?? 9) - dt; if (v.knT <= 0 && !V.peek) { v.knT = rand(7, 11); sKnocks(POS.bedWin.clone().add(new THREE.Vector3(0.1, 0, 0)), 2, 0.45, 0.8); O.shutters.bed.pv.rotation.y += 0.04; }
  if (!v.said2 && v.t > 32 && !V.peek) { v.said2 = true; line('ising2', 'At the window', 'Child. Why won\'t you open it?', { pos: POS.bedWin.clone().add(new THREE.Vector3(0.6, 0, 0)), fx: 'muffled', volume: 1.3 }); }
  if (shutOpen('bed') && !V.peek && v.t > 1) { caught('window'); return; }
  if (v.t > 75 && !V.peek && !S.flags.peeked) { flag('peeked'); sShriek(h.pos, 0.6, 1.3); visitorLeaves(); }
  placeCreature(dt);
}
function visitorLeaves(quiet) {
  V.visitor = null; V.h.headTurn = undefined;
  V.h.vel.set(4, 6, 0); hSet('away', 34); V.h.ang = 0.2;
  if (!quiet) for (let i = 0; i < 4; i++) after(i * 0.3, () => sWing(POS.bedWin.clone().add(new THREE.Vector3(1.5 + i, i * 0.8, 0)), 0.6 - i * 0.1));
  after(quiet ? 1.5 : 2.2, manaReveal);
}
async function manaReveal() {
  if (S.flags.manaKnown) return;
  flag('manaKnown'); heard('mana'); heard('tiktik'); if (!S.docs.includes('tasks')) S.docs.push('tasks');
  await line('mana1', LORNA, 'Manananggal. She wants my baby.', { pos: POS.lorna });
  await line('mana2', LORNA, 'Tatay said they leave their other half standing on the ground. Put salt, garlic and ash on it before morning, and she can never go back to it.', { pos: POS.lorna });
  await line('tiktik', LORNA, 'Listen for the tik-tik. When it\'s loud, she\'s far away. When it\'s faint, she\'s right there.', { pos: POS.lorna });
  toast(`What Lorna said is in your notebook (${G.touch ? 'Notebook button' : '<kbd>Tab</kbd>'}).`, 5000);
  after(4, async () => { if (!S.flags.key) { flag('thirsty'); await line('water', LORNA, 'Water. Please. I\'m so thirsty.', { pos: POS.lorna }); } });
}

/* ---------------- at the gate: Nanay ---------------- */
function startGate() {
  flag('gateSeen'); V.gate = { t: 0, phase: 'call' };
  const h = V.h; hSet('scripted'); h.pos.set(0.15, 1.38, GATE.z + 0.75); h.vel.set(0, 0, 0); h.yaw = Math.PI; h.pitch = 0.05; h.flap = 0.3; h.spread = 0.0; h.reach = 0;
  after(0.6, () => flashLightning(false));
  after(1.0, async () => {
    await line('ngate1', 'At the gate', 'Anak! It\'s Nanay! Open the gate, quick, before it sees me!', { pos: POS.gate.clone().setY(2), volume: 1.2 });
    if (!V.gate) return;
    await line('gate', LORNA, 'Don\'t open it! That isn\'t Nanay!', { pos: new THREE.Vector3(2.4, FLOOR + 1.2, HZ1 + 0.3), volume: 1.1 });
    if (!V.gate) return;
    await wait(3500); if (!V.gate) return;
    await line('ngate2', 'At the gate', 'Anak. It\'s so cold out here. Let me in.', { pos: POS.gate.clone().setY(2), volume: 1.1 });
  });
}
function gateUpdate(dt) {
  const g = V.gate; if (!g) return; g.t += dt; const h = V.h;
  if (g.phase === 'call') {
    h.pos.y = 1.38 + Math.sin(G.time * 0.9) * 0.025; h.yaw = Math.atan2(P.x - h.pos.x, P.z - h.pos.z); h.spread = 0; h.flap = 0.3;
    const d = Math.hypot(P.x - h.pos.x, P.z - h.pos.z);
    if (g.t > 22 || (g.t > 8 && d > 16) || covered()) { g.phase = 'rise'; g.t = 0; sShriek(h.pos, 0.6, 1.6, 700); flashLightning(true); }
  } else if (g.phase === 'rise') {
    h.pos.y = lerp(1.38, 4.4, smooth(Math.min(1, g.t / 1.6))); h.spread = Math.min(1, g.t / 0.8); h.flap = 1.6;
    if (g.t > 1.8) gateEnd();
  }
  placeCreature(dt);
}
function gateEnd(quiet) { V.gate = null; flag('gateDone'); V.h.vel.set(0, 5, -4); hSet('away', 30); }

/* ---------------- the break-in ---------------- */
function startBreakin() {
  flag('breakin'); V.bi = { t: 0, phase: 'roof', path: null, i: 0, inside: false };
  const h = V.h; hSet('scripted'); h.pos.set(-2.4, RIDGE + 1.2, -1.6); h.vel.set(0, 0, 0); h.flap = 1.8; h.spread = 0.6; h.reach = 0;
  sKnock(new THREE.Vector3(-2.4, EAVE + 1.4, -1.8), 1.6, 0, 1); G.shake = 0.6; sThatch(new THREE.Vector3(-2.4, EAVE + 1.4, -1.8), 20);
  after(0.4, () => line('hide', LORNA, 'She\'s on the roof. Hide!', { pos: POS.lorna, fx: 'whisper', volume: 1.2 }));
}
function biPath() {
  const spot = V.hide ? V.hide.spot : null, Y = FLOOR + 1.25, p = [];
  p.push([-2.4, Y + 0.3, -1.6, 2.5]);                // hang in the kitchen, sniffing
  p.push([-2.35, Y, 0.6, 0.2]); p.push([-1.0, Y, 1.5, 0.4]);
  if (spot === 'papag') p.push([-2.35, FLOOR + 0.85, 1.55, 3.4]);
  p.push([2.0, Y, 0.7, 0.2]); p.push([2.1, Y + 0.1, -0.9, 0.1]);
  p.push([2.3, Y + 0.15, -1.45, 3.6]);                // over Lorna: the tongue
  if (spot === 'wardrobe') p.push([1.72, FLOOR + 1.45, -2.05, 3.4]);
  p.push([2.0, Y, 0.7, 0.2]); p.push([-1.0, Y, 1.4, 0.2]); p.push([-2.4, Y + 0.4, -1.5, 0.5]); p.push([-2.4, RIDGE + 2, -1.6, 0]);
  return p;
}
function breakinUpdate(dt) {
  const b = V.bi; if (!b) return; b.t += dt; const h = V.h;
  if (b.phase === 'roof') {
    h.pos.y = RIDGE + 0.6 + Math.sin(b.t * 6) * 0.05; h.spread = 0.3;
    if (b.t > 1.3 && !b.torn) { b.torn = true; sRip(new THREE.Vector3(-2.4, EAVE + 1.0, -1.7)); buildRoofSlopes(roofHoles(true, false)); renderer.shadowMap.needsUpdate = true; G.shake = 1.0; V.windy = 1; }
    if (b.t > 1.7) { b.phase = 'drop'; b.t = 0; }
  } else if (b.phase === 'drop') {
    h.pos.y = lerp(RIDGE + 0.6, FLOOR + 1.55, smooth(Math.min(1, b.t / 0.9))); h.spread = 0.25; h.flap = 1.2;
    if (b.t > 0.9) { b.phase = 'wait'; b.t = 0; b.inside = true; sShriek(h.pos, 0.35, 0.9, 560); for (let i = 0; i < 6; i++) after(rand(0, 1.2), () => sDrip(new THREE.Vector3(rand(-3, -1.8), FLOOR + 0.1, rand(-2.2, -1)))); }
  } else if (b.phase === 'wait') {
    h.pos.y = FLOOR + 1.55 + Math.sin(G.time * 1.2) * 0.05; h.spread = 0.2; h.flap = 0.8; h.yaw += Math.sin(G.time * 0.8) * dt * 0.8;
    if (b.t > 6.0) { b.phase = 'walk'; b.t = 0; b.path = biPath(); b.i = 0; b.hold = 0; }
  } else if (b.phase === 'walk') {
    const wp = b.path[b.i]; if (!wp) { breakinEnd(); return; }
    const tgt = new THREE.Vector3(wp[0], wp[1], wp[2]); const d = tgt.distanceTo(h.pos);
    if (d > 0.08) { const step = Math.min(d, dt * 1.35); const dir = tgt.clone().sub(h.pos).normalize(); h.pos.addScaledVector(dir, step); if (Math.hypot(dir.x, dir.z) > 0.2) h.yaw = lerpAng(h.yaw, Math.atan2(dir.x, dir.z), Math.min(1, dt * 4)); }
    else { b.hold += dt; if (wp[1] > FLOOR + 1.4 && wp[2] < -1.2 && wp[0] > 2.1) { tongueOut(Math.min(1, b.hold / 2) * 0.55, POS.lorna); h.yaw = lerpAng(h.yaw, Math.atan2(POS.lorna.x - h.pos.x, POS.lorna.z - h.pos.z), dt * 3); } else if (b.hold < 0.05) tongueOut(0); if (wp[3] > 2 && Math.floor(b.hold * 1.2) !== Math.floor((b.hold - dt) * 1.2)) sBreath(h.pos, 1, 0.35, true); if (b.hold >= wp[3]) { b.i++; b.hold = 0; tongueOut(0); } }
    h.spread = 0.18; h.flap = 0.7; h.reach = 0.2;
    // not hidden, and she's near: she has you
    if (!V.hide && !V.catching) { const dd = h.pos.distanceTo(camera.position); if (dd < 4.6 || (dd < 7 && b.i > 0)) { caught('breakin'); return; } }
  }
  placeCreature(dt);
}
function breakinEnd(quiet) {
  const was = V.bi; V.bi = null; flag('breakinDone'); tongueOut(0);
  V.h.pos.set(-2.4, RIDGE + 2.2, -1.6); V.h.vel.set(0, 6, -3); hSet('away', 36);
  if (!quiet) { sWing(new THREE.Vector3(-2.4, RIDGE, -1.6), 0.6); after(2.5, () => { if (V.hide) toast('She\'s gone back out through the roof.', 3000); line('go', LORNA, 'Hurry. It\'s nearly morning.', { pos: POS.lorna }); }); }
  if (!S.flags.roofKitchen) { S.flags.roofKitchen = true; save(); }
}
const lerpAng = (a, b, t) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; };
function roofHoles(kitchen, bed) { const hs = []; if (kitchen || S.flags.roofKitchen) hs.push({ side: 'n', x0: -3.4, x1: -1.5, t0: 0.18, t1: 0.52 }); if (bed || S.flags.roofBed) hs.push({ side: 'n', x0: 1.5, x1: 3.3, t0: 0.18, t1: 0.52 }); return hs; }
// the tongue: k 0 rolled up .. 1 full length, aimed at a point
function tongueOut(k, at) {
  O.mnTongue.visible = k > 0.02; if (!O.mnTongue.visible) return;
  const segs = O.mnTongueSegs, n = segs.length, show = Math.max(1, Math.round(n * k));
  segs.forEach((s, i) => { s.visible = i < show; s.rotation.set(0.12 + Math.sin(G.time * 3 + i) * 0.05, Math.sin(G.time * 2.1 + i * 0.7) * 0.06, 0); });
  if (at) { O.mnTongue.updateMatrixWorld(true); const p = new THREE.Vector3(); O.mnTongue.getWorldPosition(p); const d = at.clone().sub(p); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()); const pq = new THREE.Quaternion(); O.mnTongue.parent.getWorldQuaternion(pq); O.mnTongue.quaternion.copy(pq.invert().multiply(q)); }
  else O.mnTongue.rotation.set(0.6, 0, 0);
}

/* ---------------- the legs ---------------- */
function legsActions() {
  const b = S.bowl, full = b.ash && b.garlic && b.salt;
  if (!S.flags.legsSeen) { flag('legsSeen'); }
  if (HOLD.cur === 'bowl' && full) return [{ label: 'Pour it on her', run: pourSalt }];
  const missing = ['salt', 'garlic', 'ash'].filter(k => !b[k]);
  return [look(HOLD.cur === 'bowl' ? `Not yet. The bowl still needs ${missing.join(' and ')}.` : 'A woman\'s legs, standing on their own in the dust. Nanay\'s navy skirt with the little white flowers. Her red slippers. At the waist, a wet dark cut where the rest of her should be. It is warm. You can feel the warmth from here.', 7000)];
}
function checkBowl() { const b = S.bowl; if (b.ash && b.garlic && b.salt && !S.ev.fullBowl) { S.ev.fullBowl = true; toast('Salt, garlic and ash: the bowl is ready.', 3500); } }
function pourSalt() {
  if (S.flags.salted || V.pouring) return; V.pouring = true; G.cutscene = true;
  const h = O.bowlHand; const r = h.rotation.clone();
  tween(0.8, k => { h.rotation.x = r.x - k * 1.4; h.rotation.z = r.z + k * 0.4; }, () => {
    O.saltCrust.visible = true; sHiss(POS.legs.clone().setY(1.0), 4); O.legSmoke.forEach(s => s.on = true);
    S.bowl = {}; showBowl(); renderInv();
    flag('salted');
    after(0.6, () => { V.legShake = 2.2; G.fearT = 1; sHeart(4, 0.5, 0.5); });
    after(2.2, () => { tween(0.18, k => { O.legs.position.x = POS.legs.x + k * 0.18; O.legs.position.z = POS.legs.z + k * 0.12; }); sThunk(POS.legs.clone().setY(0.1), 0.9, 70); sStinger(1); G.shake = 1.1; sayI('One foot lifts, and puts itself down again, closer to you.', 4000); });
    after(3.0, () => { sShriek(new THREE.Vector3(40, 18, -20), 0.7, 2.6, 640); h.rotation.copy(r); G.cutscene = false; V.pouring = false; startSiege(); });
  });
}

/* ---------------- the siege ---------------- */
function startSiege() {
  V.sg = { phase: 'run', t: 0, attacks: null, ai: 0, burns: 0, tongue: 0 };
  const h = V.h; h.pos.set(52, 18, -20); h.vel.set(-6, 0, 2); hSet('circle', 9999); h.meter = 0;
  after(1.4, () => line('comeback', LORNA, 'She\'s coming back! Get inside!', { pos: POS.lorna, volume: 1.2, fx: underHouse() ? 'muffled' : undefined }));
  save();
}
function siegeRestart() {
  const sg = V.sg; if (!sg) return;
  if (sg.phase === 'run' || sg.phase === 'door') { sg.phase = 'door'; sg.t = 0; setDoor('open', true); }
  else if (sg.phase === 'windows') { sg.t = 0; sg.attacks = null; for (const id in O.shutters) setShutter(id, false, 'quiet'); V.burst = {}; }
  else if (sg.phase === 'roof') { sg.t = 0; sg.burns = 0; sg.tongue = 0; sg.sub = 'peer'; }
  const h = V.h; hSet('scripted'); h.pos.set(0, RIDGE + 3, 6);
}
function siegeUpdate(dt) {
  const sg = V.sg; if (!sg) return; sg.t += dt; const h = V.h;
  switch (sg.phase) {
    case 'run': {
      // she hunts the yard, enraged, until you're in the house
      if (insideHouse()) { sg.phase = 'door'; sg.t = 0; hSet('scripted'); h.pos.set(0, RIDGE + 2.5, 6); after(0.4, () => line('door', LORNA, 'The door! Bar the door!', { pos: POS.lorna, volume: 1.1 })); }
      break;
    }
    case 'door': {
      // she circles the house, low, battering the walls
      h.ang = (h.ang || 0) + dt * 0.9; h.pos.set(Math.cos(h.ang) * 6.5, EAVE + 0.4 + Math.sin(sg.t * 2) * 0.4, Math.sin(h.ang) * 5.5); h.yaw = h.ang + Math.PI; h.flap = 2; h.spread = 1;
      if (Math.floor(sg.t * 0.7) !== Math.floor((sg.t - dt) * 0.7)) { const p = new THREE.Vector3(Math.cos(h.ang) * 4.1, FLOOR + 1.2, Math.sin(h.ang) * 3.1); sBang(p, 0.8); G.shake = 0.5; }
      if (S.door === 'barred') { sg.phase = 'windows'; sg.t = 0; sg.attacks = null; V.burst = {}; break; }
      if (sg.t > 13) { caught('door'); }
      break;
    }
    case 'windows': {
      if (!sg.attacks) sg.attacks = [['bed', 2.5], ['sala', 9.5], ['kit', 16], ['bed', 22], ['sala', 28], ['kit', 33]].map(([id, t]) => ({ id, t, open: false, done: false, t0: 0 }));
      const cur = sg.attacks.find(a => a.open && !a.done);
      for (const a of sg.attacks) {
        if (!a.open && !a.done && sg.t > a.t && !cur) { a.open = true; a.t0 = sg.t; V.burst[a.id] = true; setShutter(a.id, true, 'burst'); if (!S.ev.winCall) { S.ev.winCall = true; line('window', LORNA, 'The window!', { pos: POS.lorna, volume: 1.1 }); } break; }
      }
      if (cur) {
        const sh = O.shutters[cur.id], n = cur.id === 'kit' ? new THREE.Vector3(-1, 0, 0) : cur.id === 'bed' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
        const k = clamp((sg.t - cur.t0) / 6, 0, 1);
        h.pos.copy(sh.mid).addScaledVector(n, lerp(1.0, 0.25, k)).add(new THREE.Vector3(0, -0.6, 0)); h.yaw = Math.atan2(-n.x, -n.z); h.flap = 2.2; h.spread = 0.5; h.reach = 1;
        if (shutOpen(cur.id) === false) { cur.done = true; V.burst[cur.id] = false; sShriek(h.pos, 0.5, 0.9, 700); h.pos.addScaledVector(n, 1.5); }
        else if (k >= 1) { caught('window'); break; }
      } else { h.ang = (h.ang || 0) + dt * 0.7; h.pos.set(Math.cos(h.ang) * 7, EAVE + 1 + Math.sin(sg.t) * 0.5, Math.sin(h.ang) * 6); h.yaw = h.ang + Math.PI; h.flap = 1.8; h.spread = 1; h.reach = 0; }
      if (!sg.pl1 && sg.t > 12.5) { sg.pl1 = true; line('plead1', 'Outside', 'Anak. It hurts. Wipe the salt off.', { pos: h.pos.clone(), volume: 1.3 }).then(() => line('listen', LORNA, 'Don\'t listen to her!', { pos: POS.lorna })); }
      if (!sg.pl2 && sg.t > 25.5) { sg.pl2 = true; line('plead2', 'Outside', 'It\'s me. It\'s Nanay. Let me in.', { pos: h.pos.clone(), volume: 1.3 }); }
      if (sg.attacks.every(a => a.done) && sg.t > 36) { sg.phase = 'roof'; sg.t = 0; sg.sub = 'tear'; }
      break;
    }
    case 'roof': {
      const over = new THREE.Vector3(2.4, EAVE + 0.95, -1.75);
      if (sg.sub === 'tear') { h.pos.set(2.4, RIDGE, -1.8); h.spread = 0.6; if (sg.t > 0.3 && !sg.torn) { sg.torn = true; flag('roofBed'); sRip(over); buildRoofSlopes(roofHoles(false, true)); renderer.shadowMap.needsUpdate = true; G.shake = 1.2; line('roof', LORNA, 'Up there! She\'s right above me!', { pos: POS.lorna, volume: 1.2 }); } if (sg.t > 1.6) { sg.sub = 'peer'; sg.t = 0; } }
      else if (sg.sub === 'peer') { h.pos.lerp(over.clone().add(new THREE.Vector3(0, 0.2, 0)), Math.min(1, dt * 3)); h.yaw = Math.PI; h.pitch = 0.9; h.spread = 0.5; h.flap = 1.2; if (sg.t > 0.5 && !sg.saidN) { sg.saidN = true; line('nanay', LORNA, 'Nanay? Is that you?', { pos: POS.lorna }).then(() => line('plead3', 'Above', 'I only wanted to see my grandchild.', { pos: over.clone(), volume: 1.3 })); } if (sg.t > 3.5) { sg.sub = 'tongue'; sg.t = 0; sg.tongue = 0; } }
      else if (sg.sub === 'tongue') {
        h.pos.lerp(over, Math.min(1, dt * 2)); h.pitch = 1.05;
        const speed = [1 / 6, 1 / 4.8, 1 / 3.8][Math.min(2, sg.burns)];
        sg.tongue = Math.min(1, sg.tongue + dt * speed);
        tongueOut(0.2 + sg.tongue * 0.8, POS.lorna.clone().add(new THREE.Vector3(-0.15, 0.25, 0)));
        if (sg.tongue >= 1) { sMoan(); caught('tongue'); }
      } else if (sg.sub === 'recoil') { sg.tongue = Math.max(0, sg.tongue - dt * 2.5); tongueOut(0.2 + sg.tongue * 0.8, POS.lorna.clone().add(new THREE.Vector3(-0.15, 0.25, 0))); h.pos.y = over.y + 0.3; if (sg.t > 1.2) { if (sg.burns >= 3) { sg.phase = 'dawn'; sg.t = 0; startDawn(); } else { sg.sub = 'tongue'; sg.t = 0; } } }
      break;
    }
    case 'dawn': dawnUpdate(dt); break;
  }
  if (sg.phase !== 'run') placeCreature(dt);
}
function burnTongue() {
  const sg = V.sg; if (!sg || sg.sub !== 'tongue') return;
  if (S.lamp !== 2) { toast(`Turn the lamp up first (${G.touch ? 'Lamp button' : '<kbd>F</kbd>'}).`, 2200); return; }
  sg.burns++; sg.sub = 'recoil'; sg.t = 0; V.gutter = 0.4;
  sHiss(POS.lorna.clone().setY(FLOOR + 1.2), 1.2); sShriek(V.h.pos, 0.7, 1.2, 760); G.flash = 0.12; G.shake = 0.8;
  for (let i = 0; i < 6; i++) after(i * 0.05, () => { G.flash = Math.max(G.flash, 0.06); });
}

/* ---------------- dawn ---------------- */
function startDawn() {
  flag('dawn'); V.dawnT = 0; tongueOut(0);
  sRooster(); after(3.5, sRooster);
  sShriek(V.h.pos, 0.8, 2.6, 700);
  V.dawnFall = { t: 0, from: V.h.pos.clone() };
  after(4.5, () => line('dawn', LORNA, 'It\'s morning. It\'s morning, thank God.', { pos: POS.lorna }));
  after(9.0, () => { sBaby(); O.baby.visible = true; });
  after(13.5, () => { line('baby', LORNA, 'She\'s here. She\'s here.', { pos: POS.lorna }); V.sg.phase = 'after'; toast('It\'s over. Go down to the gate.', 6000); });
  save();
}
function dawnUpdate(dt) {
  const f = V.dawnFall; if (!f) return; f.t += dt; const h = V.h;
  // she tears up through the thatch into the light, burning, and comes down in the yard
  if (f.t < 2.2) { h.pos.set(f.from.x + f.t * 1.2, f.from.y + f.t * 2.5, f.from.z + f.t * 3.5); h.flap = 3; h.spread = 1; h.pitch = -0.4; }
  else if (f.t < 4.4) { const k = (f.t - 2.2) / 2.2; h.pos.set(lerp(f.from.x + 2.6, 1.7, k), lerp(f.from.y + 5.5, 0.2, k * k), lerp(f.from.z + 7.7, 9.4, k)); h.flap = 3 * (1 - k); h.spread = 1 - k * 0.3; h.pitch = 0.6 * k; }
  else if (!f.landed) { f.landed = true; sThunk(new THREE.Vector3(1.7, 0.3, 9.4), 1, 60); sHiss(new THREE.Vector3(1.7, 0.4, 9.4), 6); h.pos.set(1.7, 0.18, 9.4); h.pitch = Math.PI / 2 - 0.1; h.flap = 0; h.spread = 0.9; }
  if (f.landed) { h.flap = 0; h.spread = 0.85; h.reach = 0; }
  legsCollapse(clamp((f.t - 3) / 3, 0, 1));
}

/* ---------------- the end ---------------- */
function openGate() {
  if (S.flags.escaped) return; flag('escaped'); G.cutscene = true;
  sCreak(POS.gate, 1.2, 0.3, 70);
  tween(1.2, k => { O.gateL.rotation.y = -k * 1.5; O.gateR.rotation.y = k * 1.5; O.gateBar.position.set(GATE.x0 - 0.5, 0.3, GATE.z - 0.3); O.gateBar.rotation.set(0, 0.3, 1.2); });
  O.gateSolid.on = false;
  after(1.6, () => { V.black = 2; });
  after(2.6, () => { const frame = endFrame(); finishRoom(frame); });
}
function endFrame() {
  let url = null;
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov };
    applyDawnLook(1);
    O.handLamp.visible = false; for (const id in HOLD.defs) { const d = HOLD.defs[id]; if (d.hand) d.hand.visible = false; } O.face.visible = false;
    O.gateL.rotation.y = -1.5; O.gateR.rotation.y = 1.5;
    V.black = 0; G.black = 0; G.blackT = 0; const pu = post.uniforms; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0;
    cam.fov = 50; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(-0.25, 1.62, GATE.z + 1.7); cam.lookAt(0.1, 2.0, 0); cam.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true; render(0.016);
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const g = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; g.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // an old colour snapshot: warm, faded, a little soft
    const d = g.getImageData(0, 0, Wd, Ht);
    for (let i = 0; i < d.data.length; i += 4) { const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2]; d.data[i] = clamp(r * 0.9 + 26, 0, 255); d.data[i + 1] = clamp(gg * 0.86 + 20, 0, 255); d.data[i + 2] = clamp(b * 0.78 + 14, 0, 255); }
    g.putImageData(d, 0, 0); speckle(g, Wd, Ht, 900, 0.18, '40,30,20', 2);
    url = c.toDataURL('image/jpeg', 0.88);
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.updateProjectionMatrix(); updateProj();
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- lightning, weather, the morning ---------------- */
function flashLightning(near) {
  V.flashSeq = [[0, 1], [0.08, 0.2], [0.14, near ? 1.2 : 0.8], [0.3, 0.1], [0.42, near ? 0.6 : 0.3], [0.6, 0]].map(([t, k]) => ({ t, k })); V.flashT = 0;
  L.flash.position.set(rand(-20, 20), 30, rand(-20, 20)); if (L.flash.castShadow) renderer.shadowMap.needsUpdate = true;
  sThunder(near ? 0.15 : rand(1.2, 4), near ? 0.9 : rand(0.35, 0.6));
}
function weatherUpdate(dt) {
  // lightning: often while it's dark and you have no lamp, less often later; none at dawn
  if (!S.flags.dawn) {
    V.boltT = (V.boltT ?? 3) - dt;
    if (V.boltT <= 0) { V.boltT = !S.flags.lit ? rand(3.5, 6.5) : rand(9, 20); flashLightning(Math.random() < 0.15); }
  }
  let fk = 0;
  if (V.flashSeq) { V.flashT += dt; let k = 0; for (let i = 0; i < V.flashSeq.length - 1; i++) { const a = V.flashSeq[i], b = V.flashSeq[i + 1]; if (V.flashT >= a.t && V.flashT < b.t) k = lerp(a.k, b.k, (V.flashT - a.t) / (b.t - a.t)); } fk = k; if (V.flashT > 0.7) V.flashSeq = null; }
  V.flashK = fk;
  const dawn = V.dawnK || 0;
  L.flash.intensity = fk * (IS_TOUCH ? 5 : 6);
  L.hemi.intensity = 0.22 + fk * 0.9 + dawn * 1.4; L.hemi.color.setRGB(lerp(0.165, 0.62, dawn), lerp(0.2, 0.66, dawn), lerp(0.27, 0.74, dawn));
  const wantSky = dawn > 0.02 ? T.skyDawn : T.sky; if (O.sky.material.map !== wantSky) { O.sky.material.map = wantSky; O.sky.material.needsUpdate = true; }
  if (dawn > 0.02) O.sky.material.color.setScalar(lerp(0.25, 1.15, dawn)); else O.sky.material.color.setRGB(0.5 + fk * 2.2, 0.56 + fk * 2.3, 0.63 + fk * 2.6);
  L.dawn.intensity = dawn * 2.4;
  L.inFill.intensity = (S.flags.lit ? 0.45 : 1.0) + fk * 5 + dawn * 1.2; L.underFill.intensity = 0.04 + fk * 1.2 + dawn * 0.5;
  scene.fog.density = lerp(0.045, 0.022, dawn) * (1 - fk * 0.4);
  scene.fog.color.setRGB(lerp(0.012, 0.32, dawn), lerp(0.014, 0.33, dawn), lerp(0.02, 0.36, dawn));
  if (S.flags.dawn) V.dawnK = Math.min(1, (V.dawnK || 0) + dt / 7);
  // rain and wind
  const rainAmt = S.flags.dawn ? Math.max(0, 1 - (V.dawnK || 0) * 1.6) : 1;
  O.rain.material.uniforms.amt.value = rainAmt; O.rain.material.uniforms.time.value = G.time; O.rain.material.uniforms.cam.value.copy(camera.position); O.rain.material.uniforms.bright.value = 0.3 + fk * 1.6 + dawn * 0.4;
  V.windy = lerp(V.windy || 0.5, 0.5 + Math.max(0, Math.sin(G.time * 0.21)) * 0.6, Math.min(1, dt * 0.5)) * (S.flags.dawn ? Math.max(0.1, 1 - dawn) : 1);
  for (const s of O.sway) { const w = V.windy; if (s.base !== undefined) s.o.rotation.x = s.base + Math.sin(G.time * s.f + s.ph) * s.a * w; else { s.o.rotation.z = Math.sin(G.time * s.f + s.ph) * s.a * w; s.o.rotation.x = Math.cos(G.time * s.f * 0.8 + s.ph) * s.a * 0.6 * w; } }
  O.washing.forEach((w, i) => { w.rotation.x = Math.sin(G.time * 2.3 + i) * 0.35 * V.windy + 0.2 * V.windy; });
  O.curtain.userData.cloths.forEach((c, i) => { c.rotation.x = Math.sin(G.time * 1.1 + i) * 0.03 * V.windy; });
  O.pigs.forEach((p, i) => { p.userData.body.scale.y = 0.62 + Math.sin(G.time * (2.4 + i * 0.3)) * 0.015; });
}
function applyDawnLook(k) { V.dawnK = k; weatherUpdate(0); }

/* ---------------- the director: the night is never quiet for long ---------------- */
const EVENTS = [
  { id: 'roofland', ok: () => insideHouse() && S.flags.manaKnown && V.h.state !== 'scripted', run: () => { const p = new THREE.Vector3(rand(-2, 2), EAVE + 1.2, rand(-2, 2)); sKnock(p, 1.2, 0, 1); for (let i = 0; i < 5; i++) after(0.3 + i * 0.45, () => sScrape(p.clone().add(new THREE.Vector3(i * 0.3, 0, 0)), 0.35, 0.25)); G.shake = 0.3; } },
  { id: 'scratch', ok: () => insideHouse() && S.flags.manaKnown, run: () => { const a = rand(0, TAU), p = new THREE.Vector3(Math.cos(a) * 4.1, FLOOR + 1.0, Math.sin(a) * 3.1); for (let i = 0; i < 4; i++) after(i * 0.35, () => sScrape(p, 0.3, 0.3)); } },
  { id: 'whisper', ok: () => S.flags.manaKnown && !V.bi, run: () => playClip('tk_anak', { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(Math.sin(G.yaw) * 0.5, 0.1, Math.cos(G.yaw) * 0.5)), volume: 1.3 }) },
  { id: 'dog', ok: () => true, run: sDog },
  { id: 'pigs', ok: () => true, run: () => sPig(POS.pigs) },
  { id: 'hens', ok: () => true, run: () => sHen(new THREE.Vector3(2.7, 0.2, 0.9)) },
  { id: 'moan', ok: () => S.flags.lit && !V.bi, run: sMoan },
  { id: 'gutter', ok: () => lampLevel() > 0, run: () => { V.gutter = 1.4; sBreath(camera.position.clone().add(new THREE.Vector3(0, 0, 0.6)), 1, 0.15, true); } },
  { id: 'shutter', ok: () => insideHouse(), run: () => { const id = pick(Object.keys(O.shutters)); if (!shutOpen(id)) sKnocks(O.shutters[id].mid, 2, 0.3, 0.5); } },
  { id: 'drip', ok: () => insideHouse(), run: () => { for (let i = 0; i < 8; i++) after(i * 0.6, () => sDrip(new THREE.Vector3(rand(-3, 3), FLOOR + 0.05, rand(-2.5, 2.5)))); } },
  { id: 'underfoot', ok: () => insideHouse() && !S.flags.salted, run: () => sScrape(new THREE.Vector3(POS.legs.x, 0.4, POS.legs.z), 0.6, 0.18) },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || V.bi || V.gate || V.visitor || V.catching || (V.sg && V.sg.phase !== 'run') || S.flags.dawn) return;
  V.dirT = (V.dirT ?? 18) - dt; if (V.dirT > 0) return;
  const opts = EVENTS.filter(e => e.id !== V.last && e.ok());
  if (opts.length) { const e = pick(opts); e.run(); V.last = e.id; }
  V.dirT = rand(22, 42) - progress() * 1.5;
}
function progress() { const f = S.flags, b = S.bowl; return [f.lit, f.manaKnown, f.key, b.ash, b.garlic, b.salt, f.panelCut, f.salted].filter(Boolean).length; }

/* ---------------- sound beds ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.rainOut) return;
  A.loops.rainOut = loopNoise({ type: 'highpass', f: 1400, q: 0.4, vol: 0, wet: 0.15 });
  A.loops.rainLow = loopNoise({ type: 'lowpass', f: 500, q: 0.5, vol: 0, brown: true, wet: 0.2 });
  A.loops.roof = loopNoise({ pos: new THREE.Vector3(0, EAVE + 1.5, 0), type: 'bandpass', f: 700, q: 0.6, vol: 0, wet: 0.2, ref: 3 });
  A.loops.wind = loopNoise({ type: 'bandpass', f: 380, q: 0.7, vol: 0, wet: 0.3 });
  const ctx = A.ctx; const tg = ctx.createGain(); tg.gain.value = 0; [41.2, 55, 61.7, 82.4].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = rand(-9, 9); o.connect(tg); o.start(); }); route(tg, { wet: 0.6 }); A.loops.tension = { gain: tg };
}
function soundUpdate(dt) {
  if (!A.ready || !A.loops.rainOut) return;
  const rain = S.flags.dawn ? Math.max(0, 1 - (V.dawnK || 0) * 1.6) : 1, inside = insideHouse() || inGranary() || inOuthouse(), under = underHouse();
  setGain(A.loops.rainOut, rain * (inside ? 0.025 : under ? 0.05 : 0.11), 0.4);
  setGain(A.loops.rainLow, rain * (inside ? 0.06 : 0.09), 0.4);
  setGain(A.loops.roof, rain * (inside ? 0.12 : 0.03) * (S.flags.roofKitchen && inKitchen() ? 1.6 : 1), 0.4);
  setGain(A.loops.wind, (V.windy || 0.5) * (inside ? 0.025 : 0.06) * (S.flags.dawn ? 0.3 : 1), 0.6);
  const h = V.h, near = O.mn.visible ? clamp(1 - h.pos.distanceTo(camera.position) / 25, 0, 1) : 0;
  setGain(A.loops.tension, S.flags.manaKnown ? 0.004 + progress() * 0.001 + near * 0.012 + (V.sg && !S.flags.dawn ? 0.01 : 0) : 0, 1.5);
  // birds at dawn
  if (S.flags.dawn && (V.dawnK || 0) > 0.5) { V.birdT = (V.birdT ?? 1) - dt; if (V.birdT <= 0) { V.birdT = rand(0.6, 2.4); sCall([[rand(2600, 3400), rand(2000, 3800), rand(0.06, 0.14), 0.04], [rand(2600, 3400), rand(2200, 3600), rand(0.05, 0.1), 0]], new THREE.Vector3(rand(-15, 15), 5, rand(-15, 15)), 0.04, [3000], 'sine'); } }
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  G.flash = Math.max(0, (G.flash || 0) - dt * 2.2);
  V.black = Math.max(0, (V.black || 0) - dt); G.blackT = V.black > 0 ? 1 : 0;
  doorUpdate(dt); shuttersUpdate(dt); lampUpdate(dt); weatherUpdate(dt); soundUpdate(dt);
  // the hunt, and the scenes that take her over
  if (V.visitor) visitorUpdate(dt);
  else if (V.gate) gateUpdate(dt);
  else if (V.bi) breakinUpdate(dt);
  else if (V.sg && V.sg.phase !== 'run') siegeUpdate(dt);
  else { if (V.sg) siegeUpdate(dt); hunterUpdate(dt); }
  if (V.bi || V.visitor || V.gate || (V.sg && V.sg.phase !== 'run')) { const h = V.h; h.phase = (h.phase || 0) + dt * (h.flap || 0); if (Math.floor(h.phase) !== h.lastBeat) { h.lastBeat = Math.floor(h.phase); const d = h.pos.distanceTo(camera.position); if (d < 14 && h.spread > 0.3) sWing(h.pos, clamp(0.5 - d * 0.03, 0.05, 0.5)); } if (!V.catching && O.mn.visible) { const d = h.pos.distanceTo(camera.position); L.her.position.copy(h.pos).add(new THREE.Vector3(0, 0.6, 0)); L.her.intensity = clamp(1 - d / 6, 0, 1) * 0.9; } }
  // the scenes that start themselves
  const f = S.flags;
  if (f.lit && !f.visitor && !V.catching) { V.litT = (V.litT || 0) + dt; if (V.litT > 14 || (inBedroom() && V.litT > 4)) startVisitor(); }
  if (f.manaKnown && !f.hunted && outdoors() && !V.visitor) { flag('hunted'); if (V.h.state !== 'away') { hSet('away', 30); } toast('Listen. <b>Tik-tik... tik-tik.</b> Loud, and far off over the fields. When it goes faint, she\'s right above you.', 7500); }
  if (f.key && !f.gateSeen && outdoors() && P.z > 2.5 && !V.sg && !V.bi && !V.catching && ['away', 'circle'].includes(V.h.state) && !covered()) startGate();
  if (S.bowl.salt && f.manaKnown && !f.breakin && insideHouse() && !V.sg && !V.gate && !V.catching && BODY.y > FLOOR - 0.1 && P.z < 2.6) startBreakin();
  // the legs: seen from close by, in the light
  if (!f.legsSeen && underHouse() && lampLevel() > 0 && Math.hypot(P.x - POS.legs.x, P.z - POS.legs.z) < 3.4 && inView(O.legsHit, 0.8)) { flag('legsSeen'); sayI('In the lamplight, between the posts: a pair of legs, standing on their own. A navy skirt with little white flowers. Red slippers. Nothing above the waist.', 7500); G.fearT = Math.max(G.fearT || 0, 0.8); sHeart(5, 0.5, 0.55); }
  if (V.legShake > 0) { V.legShake -= dt; O.legs.rotation.z = (Math.random() - 0.5) * 0.06 * Math.min(1, V.legShake); }
  O.legSmoke.forEach(p => { if (!p.on) return; p.t += dt / 3; if (p.t > 1) p.t -= 1; const k = p.t; p.s.position.set(Math.sin(k * 6 + p.t) * 0.06, 0.96 + k * 0.9, Math.cos(k * 5) * 0.05); p.s.scale.setScalar(0.12 + k * 0.4); p.s.material.opacity = Math.sin(k * Math.PI) * 0.35 * (S.flags.dawn ? 0.5 : 1); });
  // Lorna turns her head to you when you're near, or to the roof when she's frightened
  { const near = camera.position.distanceTo(POS.lorna) < 3.5; const tgt = (V.sg && V.sg.phase === 'roof') ? -0.15 : near || V.lornaLook > 0 ? 0.7 : 0.3; V.lornaLook = Math.max(0, (V.lornaLook || 0) - dt); O.lornaHead.rotation.x = lerp(O.lornaHead.rotation.x, tgt, Math.min(1, dt * 2)); }
  // the view while peeking, hiding, looking down, being carried off
  L.peek.intensity = V.peek && !V.peek.plain ? 1.6 : 0; if (V.peek && !V.peek.plain) L.peek.position.copy(V.h.pos).add(new THREE.Vector3(-0.6, 0.9, 0.7));
  if (V.peek) { V.peek.t += dt; const fov = 52; if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); updateProj(); } camera.position.set(HX1 + 0.04, FLOOR + 0.89, -0.5); const tgt = V.peek.plain ? new THREE.Vector3(HX1 + 3, FLOOR + 0.9, -1.5) : V.h.pos.clone().add(new THREE.Vector3(0, 0.45, 0)); camera.lookAt(tgt); camera.updateMatrixWorld(); }
  if (V.floorPeek) { camera.position.set(O.gapPos.x, FLOOR + 0.18, O.gapPos.z + 0.05); camera.lookAt(POS.legs.x + 0.02, 0.6, POS.legs.z); camera.updateMatrixWorld(); }
  if (V.hide) { V.hide.t += dt; hideCam(); }
  if (V.catching) { V.catching.t += dt; camera.position.y += Math.min(1, V.catching.t) * 0.6; camera.rotation.x += Math.min(0.5, V.catching.t * 0.4); camera.updateMatrixWorld(); }
  // a toast the first time something is too low to walk under standing up
  if (BODY.low && G.time - BODY.low < 0.1 && !S.ev.toldCrouch) { S.ev.toldCrouch = true; toast(`Too low to walk under. ${G.touch ? 'Crouch' : '<kbd>C</kbd>'} to crawl.`, 4000); }
  // the stuck timer: Lorna offers a nudge if nothing has moved for a while
  const pk = progress() + ':' + Object.keys(f).length; if (pk !== V.progKey) { V.progKey = pk; V.stuckT = 0; } else V.stuckT = (V.stuckT || 0) + dt;
  if (V.stuckT > 150 && insideHouse() && !V.sg && !V.bi && !talkBusy && f.lit) { V.stuckT = 0; talkLorna(); }
  director(dt);
  if (V.envDue) { V.envDue = false; V.envNow = true; }
}

/* ---------------- footsteps ---------------- */
function stepSound(v) {
  if (insideHouse()) { sKnock(camera.position.clone().setY(FLOOR), v * 0.55, 0, 1); if (Math.random() < 0.12) sCreak(camera.position.clone().setY(FLOOR), 0.4, 0.05, 70); }
  else if (underHouse()) sStep(v * 0.5);
  else { sStep(v * 1.1); if (A.ready && !S.flags.dawn) { const t = now(), n = noiseSrc(false), bp = filt('bandpass', 900, 1.2), g = A.ctx.createGain(); g.gain.setValueAtTime(v * 0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); n.connect(bp); bp.connect(g); route(g, { wet: 0.05 }); n.start(t, Math.random()); n.stop(t + 0.14); } if (keys.ShiftLeft || keys.ShiftRight) noise(camera.position, 7); }
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    props: {}, held: null, bowl: {}, shut: { kit: false, bed: true, sala: true }, door: 'barred', lamp: 0, pounds: 0, tugs: 0, hacks: 0, taboFull: false, granDoor: false, ohOpen: true, ev: {} };
}
function applyState() {
  const f = S.flags;
  Object.assign(V, { visitor: null, gate: null, bi: null, sg: null, peek: null, floorPeek: null, hide: null, catching: null, pouring: false, dawnFall: null, dawnK: 0, legShake: 0, black: 0, lornaLook: 0, litT: 0 });
  if (!V.h) V.h = { state: 'off', pos: new THREE.Vector3(40, 16, -40), vel: new THREE.Vector3(), t: 0, dur: 0, meter: 0, ang: 0, tikT: 3, flap: 1.4, spread: 1, reach: 0, yaw: 0, pitch: 0, dist2D: 40 };
  hSet(f.manaKnown ? 'away' : 'off', 20); V.h.pos.set(40, 16, -40);
  // what's been taken
  O.matches.visible = !took('matches') && !f.lit;
  O.lampWorld.visible = !f.lit;
  O.garlic.visible = !took('garlic') && !f.garlicIn;
  O.mortarCloves.visible = f.garlicIn && !f.garlicCrushed; O.mortarPaste.visible = f.garlicCrushed && !S.bowl.garlic;
  O.padlock.visible = !f.granOpen; O.granDoor.rotation.y = S.granDoor ? -1.9 : 0; O.granDoorSolid.on = !S.granDoor;
  O.ohDoor.rotation.y = S.ohOpen ? -1.6 : 0;
  if (f.lidOff) { O.saltLid.position.set(0.32, 0.565, 0.08); O.saltLid.rotation.z = -0.4; } else { O.saltLid.position.set(0, 0.565, 0); O.saltLid.rotation.z = 0; }
  O.lash.visible = !f.panelCut; O.panelSolid.on = !f.panelCut; O.panelPivot.rotation.x = f.panelCut ? -Math.PI / 2 : 0;
  O.saltCrust.visible = !!f.salted; O.legSmoke.forEach(p => { p.on = !!f.salted; p.s.material.opacity = 0; });
  O.legs.position.set(POS.legs.x, 0, POS.legs.z); O.legs.rotation.set(0, 0.35, 0);
  O.baby.visible = !!f.dawn;
  // furniture you've moved, things you've put down
  for (const id in DRAG.defs) { const d = DRAG.defs[id], p = S.props[id]; if (p) { d.obj.position.set(p.x, p.y, p.z); } d.sync(); }
  const homes = { bowl: [-1.6, FLOOR + 1.065, -2.84, 0], tabo: [-1.24, FLOOR + 0.67, -1.9, 0.3], bolo: [POS.stump.x + 0.05, 0.44, POS.stump.z, 0] };
  for (const id in HOLD.defs) {
    const d = HOLD.defs[id], p = S.props[id];
    if (d.hand) d.hand.visible = false;
    if (p) { d.world.position.set(p.x, p.y, p.z); d.world.rotation.set(0, p.ry || 0, 0); }
    else { const h = homes[id]; d.world.position.set(h[0], h[1], h[2]); if (id === 'bolo') d.world.rotation.set(0, 0.4, -1.95); else d.world.rotation.set(0, h[3], 0); }
    d.world.visible = true;
  }
  if (!f.boloOut) { O.boloWorld.position.set(POS.stump.x + 0.05, 0.44, POS.stump.z); O.boloWorld.rotation.set(0, 0.4, -1.95); }
  if (f.key && !S.props.tabo) { O.tabo.position.set(2.0, FLOOR + 0.02, -1.45); O.tabo.rotation.set(0, 1.2, 0); }
  HOLD.cur = null;
  S.inv = S.inv.filter(i => !HOLD.defs[i]);
  if (S.held && HOLD.defs[S.held]) { const id = S.held; holdTake(id, true); S.inv.push(id); }
  O.taboHand.userData.water.visible = !!S.taboFull;
  showBowl();
  // doors, shutters, roof
  V.doorK = V.doorT = S.door === 'open' ? 1 : 0; O.doorSolid.on = S.door !== 'open';
  for (const id in O.shutters) { const sh = O.shutters[id]; sh.target = sh.k = S.shut[id] ? 0 : 1; }
  buildRoofSlopes(roofHoles(false, false));
  O.mnTongue.visible = false;
  // a fight in progress starts again from the inside; the morning stays morning
  if (f.visitor && !f.manaKnown) { f.peeked = true; after(1, manaReveal); }
  if (f.breakin && !f.breakinDone) f.breakinDone = true;
  if (f.gateSeen && !f.gateDone) f.gateDone = true;
  if (f.dawn) { V.dawnK = 1; V.sg = { phase: 'after', t: 0 }; hSet('scripted'); V.h.pos.set(1.7, 0.18, 9.4); V.h.pitch = Math.PI / 2 - 0.1; V.h.flap = 0; V.h.spread = 0.85; legsCollapse(1); }
  else if (f.salted) { V.sg = { phase: 'door', t: 0 }; hSet('scripted'); V.h.pos.set(0, RIDGE + 3, 6); }
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDue = true;
}
function savePlayer(p) { if (V.hide) { p.x = V.hide.back.x; p.z = V.hide.back.z; p.y = V.hide.back.y; } }
function resumed() { if (S.flags.salted && !S.flags.dawn) bodyPlace(SALA_SPAWN.x, FLOOR, SALA_SPAWN.z, SALA_SPAWN.yaw, false); }

/* ---------------- title: a stilt house in a storm, something crossing the sky ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const W = 480, H = 270;
  const bolt = (Math.sin(t * 0.83) > 0.985 || Math.sin(t * 1.37 + 2) > 0.992) ? 1 : 0;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, bolt ? '#5a6478' : '#0a0e14'); sky.addColorStop(1, bolt ? '#2a3038' : '#05070a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // the winged shape, crossing
  const k = (t * 0.07) % 1, wx = -60 + k * (W + 120), wy = 70 + Math.sin(k * 9) * 14, fl = Math.sin(t * 7) * 10;
  g.fillStyle = '#000'; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx - 22, wy - 10 - fl, wx - 40, wy - 2 - fl * 1.5); g.lineTo(wx - 26, wy + 4); g.lineTo(wx - 4, wy + 6); g.quadraticCurveTo(wx + 22, wy - 10 - fl, wx + 40, wy - 2 - fl * 1.5); g.lineTo(wx + 26, wy + 4); g.lineTo(wx + 4, wy + 6); g.fill();
  g.fillRect(wx - 3, wy, 6, 12); g.fillStyle = '#c01810'; g.fillRect(wx - 2, wy + 2, 1.5, 1.5); g.fillRect(wx + 0.5, wy + 2, 1.5, 1.5);
  // the house on its stilts, palms either side
  g.fillStyle = bolt ? '#0e0e10' : '#020203';
  g.beginPath(); g.moveTo(150, 170); g.lineTo(240, 95); g.lineTo(330, 170); g.fill(); g.fillRect(170, 168, 140, 46);
  for (let x = 172; x < 312; x += 34) g.fillRect(x, 212, 7, 40);
  g.fillRect(0, 248, W, 22);
  for (const [px, ph, lean] of [[70, 150, 0.2], [410, 170, -0.25]]) { g.lineWidth = 5; g.strokeStyle = g.fillStyle; g.beginPath(); g.moveTo(px, 250); g.quadraticCurveTo(px + lean * 60, 250 - ph / 2, px + lean * 90, 250 - ph); g.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.4; g.lineWidth = 3; g.beginPath(); g.moveTo(px + lean * 90, 250 - ph); g.quadraticCurveTo(px + lean * 90 + Math.cos(a) * 24, 250 - ph - 10, px + lean * 90 + Math.cos(a) * 40, 250 - ph + 14 + Math.abs(Math.sin(a)) * 10); g.stroke(); } }
  // one warm window, a lamp moving behind the weave
  const lx = 268 + Math.sin(t * 0.6) * 8; const gr = g.createRadialGradient(lx, 190, 1, lx, 190, 20); gr.addColorStop(0, 'rgba(255,170,80,0.85)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = gr; g.fillRect(250, 178, 40, 26);
  // rain
  g.strokeStyle = 'rgba(160,175,190,0.25)'; g.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = (i * 53.7 + t * 260) % (W + 40) - 20, y = (i * 97.3 + t * 520) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 14); g.stroke(); }
}

/* ---------------- build ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x030405, 0.045);
  camera.far = 120; camera.near = 0.02; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.25, ao: 0.7, aoRad: 0.3, bloom: 0.7, bloomThr: 1.1, vig: 0.55, grain: 0.035, sat: 0.92 });
  makeTextures(); paintThings(); makeMaterials();
  buildHouse(); buildYard(); buildLorna(); buildCreature(); buildLegs(); buildFaceScare(); buildHands(); buildLights(); buildRain();
  scene.traverse(o => { if (o.isMesh && !o.userData.noShadowFix) { o.receiveShadow = true; } });
  bodyOn({});
  setupCarry();
  // the hiding view's frame: wardrobe slats, or the underside of the bed
  if (!$('#tkHide')) { const d = document.createElement('div'); d.id = 'tkHide'; d.hidden = true; $('#hud').appendChild(d); }
}

/* ---------------- the room module ---------------- */
return {
  id: 'tik', title: 'Tik-Tik', saveKey: 'lethe.roomtik.v1',
  DOCS, ITEMS, HEARD, HINTS, openDoc, inspectItem,
  titleFx,
  penalty() { G.lockout = G.time + 3; },
  markSkip: ['start', 'visitor', 'hunt', 'gate', 'hide', 'out'], markMerge: {},
  backText: 'Back in the house.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Jump, climb up', 'Space'], ['Crouch, crawl', 'C'], ['Put down', 'Q'], ['Lamp up or down', 'F'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (V.hide || V.peek || V.floorPeek) return; bodyCrouch(); },
  stepDown() { if (V.hide || V.peek || V.floorPeek) return; bodyJump(); },
  toggleFlash: toggleLamp,
  dropHeld() { if (V.hide || V.peek || G.cutscene) return; if (DRAG.cur) { dragEnd(); return; } if (HOLD.cur) { const id = HOLD.cur; holdDrop(); if (id === 'tabo' && S.taboFull) { S.taboFull = false; O.taboHand.userData.water.visible = false; } } },
  onHold, stepSound,
  onLand(v) { if (v > 1.5) { if (insideHouse()) sKnock(camera.position.clone().setY(FLOOR), 0.6, 0, 1); else sStep(0.35); } },
  onDrag(d, on) { if (!on) { S.props[d.id] = { x: d.obj.position.x, y: d.obj.position.y, z: d.obj.position.z }; save(); } },
  onDragFell(d) { S.props[d.id] = { x: d.obj.position.x, y: d.obj.position.y, z: d.obj.position.z }; save(); },
  savePlayer, resumed,
  actOverride(i) {
    if (DRAG.cur) { dragEnd(); return true; }
    if (V.hide) { unhide(); return true; }
    if (V.peek && V.peek.plain) { endPeek(); return true; }
    if (V.sg && V.sg.phase === 'roof' && V.sg.sub === 'tongue' && i === 0 && camera.position.distanceTo(POS.lorna) < 3.4) { burnTongue(); return true; }
    return false;
  },
  promptOverride() {
    if (DRAG.cur) return `<span class="nm">Dragging the ${esc(DRAG.cur.name)}</span><span class="act"><kbd>E</kbd>Let go</span>`;
    if (V.hide) return `<span class="nm">Hiding</span><span class="act"><kbd>E</kbd>Come out</span>`;
    if (V.peek && V.peek.plain) return `<span class="act"><kbd>E</kbd>Stop looking</span>`;
    if (V.sg && V.sg.phase === 'roof' && V.sg.sub === 'tongue' && camera.position.distanceTo(POS.lorna) < 3.4) return `<span class="nm">Her tongue, coming down through the net</span><span class="act"><kbd>E</kbd>${S.lamp === 2 ? 'Thrust the lamp at it' : 'Turn the lamp up (F)'}</span>`;
    return '';
  },
  touchOverride() {
    if (DRAG.cur) return [{ label: 'Let go', run: () => dragEnd(), main: true }];
    if (V.hide) return [{ label: 'Come out', run: () => unhide(), main: true }];
    if (V.peek && V.peek.plain) return [{ label: 'Stop looking', run: endPeek, main: true }];
    if (V.sg && V.sg.phase === 'roof' && V.sg.sub === 'tongue' && camera.position.distanceTo(POS.lorna) < 3.4) return [{ label: S.lamp === 2 ? 'Burn it' : 'Lamp up', run: () => S.lamp === 2 ? burnTongue() : toggleLamp(), main: true }];
    return null;
  },
  touchExtras() {
    const x = [];
    if (!V.hide && !V.peek && !DRAG.cur) x.push({ label: 'Jump', run: () => bodyJump() });
    if (HOLD.cur && !V.hide) x.push({ label: 'Put down', run: () => holdDrop() });
    if (S.lamp) x.push({ label: S.lamp === 2 ? 'Lamp down' : 'Lamp up', run: toggleLamp });
    return x;
  },
  invNote: id => '',
  update: roomUpdate,
  preRender() {
    if (V.envNow) { V.envNow = false; const old = scene.environment; scene.environment = null; const hide = [O.handLamp, O.face, O.rain]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); const rt = envFromScene(new THREE.Vector3(0, FLOOR + 1.4, 1.0)); scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); }
  },
  build() {
    buildRoom(); registerInteractions();
    [O.doorPivot, O.bar, O.curtain, O.lampWorld, O.bench, O.garlic, O.matches, O.lorna, O.mn, O.legs, O.crate, O.mortar, O.pestle, O.stump, O.gateL, O.gateR, O.gateBar, O.granDoor, O.padlock, O.saltJar, O.ohDoor, O.panelPivot, O.bowlWorld, O.tabo, O.boloWorld, O.roof].forEach(o => { if (o) o.userData.keep = true; });
    for (const id in O.shutters) O.shutters[id].pv.userData.keep = true;
    mergeGroup(O.house); mergeGroup(O.under); mergeGroup(O.yard);
  },
  defaults, applyState, startAmbience,
  spawn: { x: -2.6, z: 2.1, yaw: 0 },
  wake() {
    bodyPlace(0.9, FLOOR, 1.55, 0.6, false); G.pitch = -0.15;
    G.cutscene = true; $('#fx').className = 'lids';
    after(0.6, () => flashLightning(true));
    after(1.0, () => sayI('Two in the morning. The typhoon is on the roof. You came home from Manila for the baby, and fell asleep on the mat.', 6500));
    after(3.4, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); toast(ctrlHint(), 7000); });
    after(4.2, async () => { await line('wake1', LORNA, 'You\'re awake. The lamp\'s gone out. I can\'t see a thing.', { pos: POS.lorna }); await line('wake2', LORNA, 'Nanay still isn\'t back. She went to fetch the midwife before the storm.', { pos: POS.lorna }); await wait(1500); await line('matches', LORNA, 'The matches are on top of the wardrobe. Nanay keeps them up there.', { pos: POS.lorna }); heard('matches'); after(2, () => { if (!S.ev.toldMove) { S.ev.toldMove = true; toast(`${G.touch ? 'Jump and Crouch are buttons on the right.' : '<kbd>Space</kbd> jumps and climbs, <kbd>C</kbd> crouches, <kbd>Q</kbd> puts down what you\'re holding.'}`, 7000); } }); });
  },
  debug: { O, L, V, T, M, BODY, DRAG, HOLD, hSet, caught, startVisitor, startPeek, manaReveal, startGate, startBreakin, startSiege, startDawn, pourSalt, burnTongue, flashLightning, hideIn, unhide, tugBolo, hackRope, pound, lightLamp, giveWater, pickUp, setShutter, setDoor, endFrame, openGate, covered, outdoors, insideHouse, underHouse },
};
})();
