/* =====================================================================
   MYSTERY #9 — "SATURATION"  ·  Station Méduse, 30 m down off Port Sudan, Red Sea, night of 3–4 March 1965
   part A: layout, helpers, textures, materials
   Five French divers live on the sea floor for a month; going up without days of decompression would
   kill them. Tonight four of them swam out to the wreck on the reef. You wake on the wet-room floor at
   4 a.m., soaked, with no tank and no mask. The others' suits are back on the rack, dripping, but nobody
   is here. The bunk-room hatch is locked from the inside. Something is knocking under the floor, in fours.
   They came back. You didn't. A slow burn: the crew are hiding from you, and the knocking is your own
   body on the end of a line, asking to be hauled up.
   Axes: +x east (the main module runs east from the wet room), -z north (the bell), y up; the sand is y = 0.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {}, V = {};
const FY = 3.0;                                              // the station's deck, three metres above the sand
const WR = { r: 2.4, top: FY + 2.6 };                        // the wet room: a standing cylinder round the moon pool, centred on the origin
const MP = { r: 0.72 };                                      // the moon pool: a hole in the deck, open to the sea through a steel skirt
const SKIRT = 2.0;                                           // the skirt goes 2 m down below the deck
const LEDGE_D = 1.42;                                        // the ledge inside the skirt, 1.42 m down (its top)
const LVL = { start: 0.07, normal: 0.42, ledge: 1.46, burp: 1.98 };   // water level, measured as depth below the deck
const TUN = { x0: 2.25, x1: 3.05, w: 0.86, h: 1.92, in0: 2.34, in1: 3.07, out0: 2.42 };   // the short tunnel and hatch from the wet room to the main module (in0..in1 its inside, out0.. its outer skin)
const MM = { x0: 3.05, x1: 11.0, r: 1.62, ay: FY + 0.92, dome: 0.6 };   // the main module: a lying cylinder, flat deck at FY (dome: how far its west end cap bulges)
const MMW = Math.sqrt(MM.r * MM.r - (MM.ay - FY) * (MM.ay - FY)); // half its width at the deck
const BUNK = { x0: 11.0, x1: 14.4, dome: 0.86 };              // the bunk room beyond the end bulkhead (you never get in)
const BELL = { x: 9.7, z: -4.6, cy: 3.3, r: 1.0 };
const PLINTH = { h: 1.4, w: 2.2 };                             // the concrete clump the bell's frame stands on, so she sits level with the module's windows           // the diving bell, parked in its frame on the sand north of the main module
const BUNK_WIN_X = 11.35;                                      // the bunk room's one porthole, on the north side, looking at the bell
const BELL_FLOOR = BELL.cy - 0.72;                           // the grating inside it
const POS = {
  manifold: new THREE.Vector3(1.62, FY + 1.42, -1.72),        // the gas wall, on the wet room's north-east wall
  portN: new THREE.Vector3(0, FY + 1.42, -WR.r),              // the porthole that looks at the bell
  portS: new THREE.Vector3(0, FY + 1.42, WR.r),               // the porthole that looks at the gas banks
  portW: new THREE.Vector3(-WR.r, FY + 1.42, 0),
  floods: new THREE.Vector3(-0.92, FY + 1.4, -2.2),
  card: new THREE.Vector3(0.9, FY + 1.48, -2.2),
  chart: new THREE.Vector3(2.12, FY + 1.42, -1.08),
  locker: new THREE.Vector3(-1.8, FY, 0.95),
  pot: new THREE.Vector3(1.02, FY, 1.38),
  speaker: new THREE.Vector3(1.52, FY + 2.05, 1.78),
  fill: new THREE.Vector3(2.0, FY, -0.98),
  signals: new THREE.Vector3(-0.62, FY + 1.02, -0.52),
  // main module
  panel: new THREE.Vector3(4.2, FY + 1.35, -MMW + 0.1),
  intercom: new THREE.Vector3(5.32, FY + 1.36, -MMW + 0.05),
  phone: new THREE.Vector3(5.85, FY + 1.3, -MMW + 0.05),
  scrubber: new THREE.Vector3(4.15, FY, MMW - 0.38),
  table: new THREE.Vector3(7.0, FY, -0.72),
  galley: new THREE.Vector3(6.6, FY, MMW - 0.3),
  mirror: new THREE.Vector3(8.15, FY + 1.42, MMW - 0.04),
  clock: new THREE.Vector3(5.6, FY + 1.75, MMW - 0.02),
  berth: new THREE.Vector3(9.6, FY + 0.52, MMW - 0.42),
  board: new THREE.Vector3(10.0, FY + 1.38, -MMW + 0.05),
  hatch: new THREE.Vector3(MM.x1, FY + 0.95, 0.12),
  pass: new THREE.Vector3(MM.x1, FY + 1.05, -0.92),
};
// the gas banks outside, numbered 1 to 5 on their caps; under red light 1, 2, 4 and 5 all look pale
const BANKS = [
  { n: 1, gas: 'o2', col: 'white', bar: 165 },
  { n: 2, gas: 'air', col: 'yellow', bar: 0 },
  { n: 3, gas: 'he', col: 'brown', bar: 140 },
  { n: 4, gas: 'air', col: 'yellow', bar: 190 },
  { n: 5, gas: 'o2', col: 'white', bar: 120 },
];
const OUTLETS = ['bell', 'station', 'fill'];
const BAND = { white: 0xe8e6de, yellow: 0xe8c818, brown: 0x6a4020, black: 0x141414 };
const SWIM_R = 14;                                           // how far from the station you can swim before the dark turns you round

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
function tfb(x, y, w, h, cx, cy, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += tnoise(x / w * cx * f, y / h * cy * f, cx * f, cy * f) * a; f *= 2; a *= 0.5; } return s; }
const hash1 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function pix(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y), i = (y * w + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] ?? 255; } g.putImageData(img, 0, 0); return c; }
function tex(c, { srgb = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t; }
function canv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cl255 = v => clamp(Math.round(v), 0, 255);
function pbrPix(w, h, fn, nStrength = 2.4) {
  const hc = document.createElement('canvas'); hc.width = w; hc.height = h; const hg = hc.getContext('2d'), himg = hg.createImageData(w, h);
  const cc = pix(w, h, (x, y) => { const v = fn(x, y), i = (y * w + x) * 4; const hv = clamp(v[3], 0, 1) * 255; himg.data[i] = himg.data[i + 1] = himg.data[i + 2] = hv; himg.data[i + 3] = 255; return [cl255(v[0]), cl255(v[1]), cl255(v[2]), 255]; });
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
  g.translate(0, 0, -Math.max(0.0005, d - 2 * b) / 2);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ay > 0.5) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i)); }
  uv.needsUpdate = true; return g;
}
function bev(w, h, d, mat, x, y, z, parent = scene, b = 0.006) { return mesh(bevGeo(w, h, d, b), mat, x, y, z, parent); }
function lathe(pts, mat, x, y, z, parent = scene, seg = 28) { return mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg), mat, x, y, z, parent); }
function tube(pts, r, mat, parent = scene, seg = 32, rs = 8, closed = false) { const c = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p)), closed); return mesh(new THREE.TubeGeometry(c, seg, r, rs, closed), mat, 0, 0, 0, parent); }
function uvScale(g, su, sv, ou = 0, ov = 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov); uv.needsUpdate = true; return g; }
function mbox(w, h, d, mat, x, y, z, parent = scene, s = 1) { return mesh(tiledBoxGeo(w, h, d, s), mat, x, y, z, parent); }
function pole(a, b, r, mat, parent = scene, seg = 10, r2) {
  const A2 = a.isVector3 ? a : new THREE.Vector3(...a), B = b.isVector3 ? b : new THREE.Vector3(...b), len = A2.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2 ?? r, r, len, seg, 1); uvScale(g, 1, len / 0.5);
  const m = mesh(g, mat, (A2.x + B.x) / 2, (A2.y + B.y) / 2, (A2.z + B.z) / 2, parent);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A2).normalize()); return m;
}
function torus(R, r, mat, x, y, z, parent = scene, rad = 40, tub = 8, arc = TAU) { return mesh(new THREE.TorusGeometry(R, r, tub, rad, arc), mat, x, y, z, parent); }
function mergeGroup(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), kill = [];
  const kept = o => { for (let p = o; p && p !== root; p = p.parent) if (p.userData.keep) return true; return false; };
  root.traverse(o => {
    if (!o.isMesh || o.userData.iid || o.layers.mask !== 1 || !o.visible || kept(o) || o.material.isShaderMaterial || Array.isArray(o.material) || o.userData.hit || o.isSprite) return;
    const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    buckets.get(key).geos.push(g); kill.push(o);
  });
  kill.forEach(o => o.parent && o.parent.remove(o));
  for (const b of buckets.values()) {
    const out = new THREE.BufferGeometry();
    for (const a of ['position', 'normal', 'uv', 'color']) {
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
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
}
// a flat card a few millimetres off a surface, drawn on a canvas
function decal(w, h, draw, x, y, z, ry, par = scene, px = 256, rx = 0, opt = {}) {
  const t = tex(canv(px, Math.round(px * h / w), draw)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std(Object.assign({ map: t, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }, opt)));
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; m.userData.noRay = true; par.add(m); return m;
}
// an open cylinder seen from inside (a hull), with UVs in metres: u round the wall, v up it
function hullGeo(r, h, seg = 64, arc0 = 0, arc = TAU, open = true) {
  const g = new THREE.CylinderGeometry(r, r, h, seg, Math.max(1, Math.round(h / 0.6)), open, arc0, arc);
  uvScale(g, arc * r, h); return g;
}
// a circle in the deck with a round hole (a ring), UVs in metres
function ringGeo(r0, r1, seg = 48) { const g = new THREE.RingGeometry(r0, r1, seg, 1); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i)); uv.needsUpdate = true; return g; }

/* ---------------- textures ---------------- */
function makeTextures() {
  // cream enamel over steel: chipped to grey primer and rust, rust running down from the welds, sweat drips
  {
    const W2 = 512, H2 = 512;
    const r = pbrPix(W2, H2, (x, y) => {
      const g = tfb(x, y, W2, H2, 6, 6, 5), g2 = tfb(x, y, W2, H2, 24, 24, 2), chip = tfb(x + 91, y, W2, H2, 10, 10, 4);
      let c = mixc([186, 182, 162], [214, 208, 188], g * 0.7 + g2 * 0.3), h = 0.6 + (g2 - 0.5) * 0.06;
      // rust runs: vertical streaks, darker toward their tops
      const run = tnoise(x / W2 * 40, y / H2 * 1.5, 40, 2); if (run > 0.72) { const k = clamp((run - 0.72) * 4, 0, 1) * (0.4 + 0.6 * tfb(x, y, W2, H2, 3, 8, 3)); c = mixc(c, [120, 72, 40], k * 0.6); }
      // sweat: thin clear drips
      const drip = tnoise(x / W2 * 90, y / H2 * 0.6, 90, 1); if (drip > 0.86) { c = mixc(c, [150, 146, 130], 0.25); h += 0.03; }
      if (chip > 0.7) { const k = clamp((chip - 0.7) * 6, 0, 1); c = mixc(c, chip > 0.78 ? [96, 60, 38] : [92, 94, 92], k); h -= 0.18 * k; }
      return [c[0], c[1], c[2], h];
    }, 2.2);
    T.paint = r.map; T.paintN = r.normal;
  }
  // diamond tread plate, wet, worn bright where people walk
  {
    const W2 = 256, H2 = 256;
    const r = pbrPix(W2, H2, (x, y) => {
      const u = (x / W2) * 8, v = (y / H2) * 8, fu = u - Math.floor(u), fv = v - Math.floor(v), odd = Math.floor(v) % 2 === 1;
      const cu = odd ? (fu + 0.5) % 1 : fu;
      const a = Math.abs(cu - 0.5) * 2, b = Math.abs(fv - 0.5) * 2, k = Math.floor(u + v) % 2 ? 1 : -1;
      const d = Math.abs((cu - 0.5) * 0.6 + k * (fv - 0.5) * 0.25) < 0.06 && a < 0.7 && b < 0.95 ? 1 : 0;
      const g = tfb(x, y, W2, H2, 6, 6, 4), rust = clamp((tfb(x + 40, y, W2, H2, 4, 4, 4) - 0.58) * 3, 0, 1);
      let c = mixc([70, 72, 74], [104, 106, 108], g); c = mixc(c, [92, 58, 36], rust * 0.6); if (d) c = mixc(c, [150, 152, 154], 0.5);
      return [c[0], c[1], c[2], 0.4 + d * 0.4 + (g - 0.5) * 0.08];
    }, 3);
    T.deck = r.map; T.deckN = r.normal;
  }
  // brown linoleum on the main module's deck, cracked, with a steel strip at the seams
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 8, 8, 5), m = tfb(x, y, 256, 256, 30, 30, 2); let c = mixc([70, 46, 30], [104, 72, 46], g * 0.7 + m * 0.3); let h = 0.5; const cr = Math.abs(tfb(x, y, 256, 256, 5, 5, 3) - 0.5); if (cr < 0.008) { c = mixc(c, [30, 20, 14], 0.7); h = 0.3; } if (x % 128 < 3) { c = [120, 120, 118]; h = 0.65; } return [c[0], c[1], c[2], h]; }, 2); T.lino = r.map; T.linoN = r.normal; }
  // the station outside: yellow paint, scoured, furred with weed and growth, rust bleeding from every seam
  {
    const W2 = 512, H2 = 512;
    const r = pbrPix(W2, H2, (x, y) => {
      const g = tfb(x, y, W2, H2, 6, 6, 5), weed = clamp((tfb(x + 17, y, W2, H2, 5, 5, 5) - 0.48) * 3, 0, 1), fine = tfb(x, y, W2, H2, 40, 40, 2);
      let c = mixc([170, 140, 40], [206, 172, 60], g); c = mixc(c, [62, 70, 40], weed * 0.75); c = mixc(c, [40, 46, 30], clamp((fine - 0.6) * 3, 0, 1) * weed);
      const run = tnoise(x / W2 * 30, y / H2 * 1.2, 30, 1); if (run > 0.74) c = mixc(c, [110, 60, 30], clamp((run - 0.74) * 5, 0, 1) * 0.7);
      return [c[0], c[1], c[2], 0.5 + weed * 0.3 + (fine - 0.5) * 0.15 * weed];
    }, 3);
    T.hullOut = r.map; T.hullOutN = r.normal;
  }
  // neoprene: black, fine-grained, scuffed grey at the knees and seams
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 64, 64, 2), s = tfb(x, y, 256, 256, 4, 4, 4); let c = mixc([14, 14, 16], [30, 30, 32], g); c = mixc(c, [60, 60, 60], clamp((s - 0.62) * 3, 0, 0.5)); return [c[0], c[1], c[2], 0.5 + (g - 0.5) * 0.3]; }, 2); T.rubber = r.map; T.rubberN = r.normal; }
  // sand: pale, rippled by the current, littered with bits of shell and coral
  {
    const W2 = 512, H2 = 512;
    const r = pbrPix(W2, H2, (x, y) => {
      const rip = Math.sin((x / W2) * TAU * 14 + tfb(x, y, W2, H2, 4, 4, 3) * 9) * 0.5 + 0.5, g = tfb(x, y, W2, H2, 8, 8, 5), grain = tnoise(x / W2 * 200, y / H2 * 200, 200, 200);
      let c = mixc([168, 156, 130], [212, 202, 176], g * 0.6 + rip * 0.25 + grain * 0.15);
      if (grain > 0.9) c = mixc(c, [240, 236, 226], 0.6); if (grain < 0.06) c = mixc(c, [90, 80, 66], 0.5);
      return [c[0], c[1], c[2], 0.35 + rip * 0.35 + grain * 0.1];
    }, 2.4);
    T.sand = r.map; T.sandN = r.normal;
  }
  // coral rock: knobbly, pocked, pink-grey and ochre with dark holes
  {
    const W2 = 512, H2 = 512;
    const r = pbrPix(W2, H2, (x, y) => {
      const g = tfb(x, y, W2, H2, 6, 6, 5), k = tfb(x + 50, y, W2, H2, 18, 18, 3), hole = tnoise(x / W2 * 30, y / H2 * 30, 30, 30);
      let c = mixc([110, 96, 90], [170, 150, 132], g); c = mixc(c, [150, 110, 80], clamp((k - 0.5) * 2, 0, 0.6)); c = mixc(c, [90, 110, 90], clamp((tfb(x, y, W2, H2, 3, 3, 3) - 0.6) * 3, 0, 0.5));
      let h = 0.4 + g * 0.4 + (k - 0.5) * 0.3; if (hole > 0.82) { c = mixc(c, [20, 16, 14], 0.8); h -= 0.35; }
      return [c[0], c[1], c[2], h];
    }, 3.4);
    T.rock = r.map; T.rockN = r.normal;
  }
  // gas cylinders and tanks: painted steel, chipped and scuffed (the colour comes from the material)
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 8, 8, 4), ch = tfb(x + 7, y, 256, 256, 12, 12, 3); let c = mixc([200, 200, 196], [236, 236, 232], g); let h = 0.6; if (ch > 0.74) { c = mixc(c, [70, 66, 62], clamp((ch - 0.74) * 6, 0, 1)); h = 0.4; } return [c[0], c[1], c[2], h]; }, 2); T.tank = r.map; T.tankN = r.normal; }
  // the bell's paint: orange, salt-scoured, rust at the welds
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 6, 6, 4), ch = tfb(x + 3, y, 256, 256, 10, 10, 3), weed = clamp((tfb(x, y + 9, 256, 256, 4, 4, 4) - 0.6) * 3, 0, 1); let c = mixc([196, 82, 30], [226, 108, 44], g); c = mixc(c, [110, 52, 26], clamp((ch - 0.7) * 4, 0, 1)); c = mixc(c, [70, 74, 44], weed * 0.6); return [c[0], c[1], c[2], 0.55 + (ch - 0.5) * 0.2]; }, 2); T.bell = r.map; T.bellN = r.normal; }
  // grey wool for blankets
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 64, 64, 2), w = Math.sin(x * 0.8) * Math.sin(y * 0.8); let c = mixc([70, 70, 72], [100, 98, 96], g * 0.7 + w * 0.15 + 0.15); if (y % 80 < 6) c = mixc(c, [140, 40, 34], 0.6); return [c[0], c[1], c[2], 0.5 + w * 0.2]; }, 1.5); T.wool = r.map; T.woolN = r.normal; }
  // varnished wood (the table top, the bench), dark and ringed with cup marks
  { const r = pbrPix(256, 256, (x, y) => { const g = tnoise(x / 256 * 40, y / 256 * 3, 40, 3), g2 = tfb(x, y, 256, 256, 6, 6, 4); let c = mixc([96, 60, 34], [140, 92, 54], g * 0.6 + g2 * 0.4); const ring = Math.abs(Math.hypot(x - 90, y - 140) - 22); if (ring < 1.6) c = mixc(c, [60, 36, 20], 0.6); return [c[0], c[1], c[2], 0.5 + (g - 0.5) * 0.1]; }, 1.6); T.wood = r.map; T.woodN = r.normal; }
  // a canvas kitbag
  { const r = pbrPix(128, 128, (x, y) => { const w = (Math.sin(x * 1.6) + Math.sin(y * 1.6)) * 0.25 + 0.5, g = tfb(x, y, 128, 128, 6, 6, 3); const c = mixc([96, 92, 64], [130, 124, 90], g * 0.6 + w * 0.4); return [c[0], c[1], c[2], w]; }, 1.4); T.canvas = r.map; T.canvasN = r.normal; }
  // rope: yellow polypropylene line, twisted
  T.rope = tex(pix(64, 64, (x, y) => { const s = Math.sin((x + y * 1.4) * 0.5) * 0.5 + 0.5; const c = mixc([170, 140, 20], [236, 204, 40], s); return [cl255(c[0]), cl255(c[1]), cl255(c[2])]; }), { repeat: [1, 1] });
  // skin of the drowned: grey-blue, mottled
  T.dead = tex(pix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 6, 6, 4), m = tfb(x + 30, y, 256, 256, 14, 14, 3); let c = mixc([150, 158, 162], [182, 186, 184], g); c = mixc(c, [110, 120, 140], clamp((m - 0.55) * 2, 0, 0.5)); return [cl255(c[0]), cl255(c[1]), cl255(c[2])]; }));
  // a soft round glow, for lamp bulbs, the porthole sprites and the particles
  T.glow = tex(pix(64, 64, (x, y) => { const d = Math.hypot(x - 32, y - 32) / 32, a = clamp(1 - d, 0, 1); return [255, 255, 255, cl255(a * a * 255)]; }));
  T.glow.wrapS = T.glow.wrapT = THREE.ClampToEdgeWrapping;
  // a bubble: a bright rim and a highlight
  T.bubble = tex(pix(64, 64, (x, y) => { const d = Math.hypot(x - 32, y - 32) / 30; let a = d > 1 ? 0 : Math.pow(d, 6) * 0.9 + 0.08; if (Math.hypot(x - 24, y - 22) < 5) a = 0.95; return [230, 245, 255, cl255(a * 255)]; }));
  T.bubble.wrapS = T.bubble.wrapT = THREE.ClampToEdgeWrapping;
  // light caustics for the sand under the floodlights
  T.caustic = tex(pix(256, 256, (x, y) => { const a = tnoise(x / 256 * 6, y / 256 * 6, 6, 6), b = tnoise(x / 256 * 6 + 3.1, y / 256 * 6 + 1.7, 6, 6); const v = Math.pow(1 - Math.abs(a - b) * 2.2, 6); return [cl255(v * 255), cl255(v * 255), cl255(v * 255)]; }), { srgb: false, repeat: [3, 3] });
  // the moon pool's water: a slow swell
  T.waterN = heightToNormal(pix(256, 256, (x, y) => { const v = tfb(x, y, 256, 256, 4, 4, 4) * 0.7 + tfb(x, y, 256, 256, 12, 12, 2) * 0.3; return [v * 255, v * 255, v * 255]; }), 2.5);
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  const n2 = s => new THREE.Vector2(s, s);
  M.paint = std({ map: T.paint, normalMap: T.paintN, normalScale: n2(0.8), roughness: 0.55, envMapIntensity: 0.5 });
  M.paintIn = std({ map: T.paint, normalMap: T.paintN, normalScale: n2(0.8), roughness: 0.55, envMapIntensity: 0.5, side: THREE.BackSide });
  M.paintDark = std({ map: T.paint, normalMap: T.paintN, color: 0x8a8678, roughness: 0.6, envMapIntensity: 0.4 });
  M.paintGreen = std({ map: T.paint, normalMap: T.paintN, color: 0x7aa08a, roughness: 0.55, envMapIntensity: 0.4 });
  M.deck = std({ map: T.deck, normalMap: T.deckN, roughness: 0.32, metalness: 0.6, envMapIntensity: 0.9 });
  M.lino = std({ map: T.lino, normalMap: T.linoN, roughness: 0.6, envMapIntensity: 0.4 });
  M.steel = std({ color: 0x8a8c8e, roughness: 0.42, metalness: 0.85, envMapIntensity: 0.8, map: T.paint });
  M.steelDark = std({ color: 0x4a4c4e, roughness: 0.5, metalness: 0.8, envMapIntensity: 0.6 });
  M.chrome = std({ color: 0xd8dadc, roughness: 0.16, metalness: 1, envMapIntensity: 1.2 });
  M.brass = std({ color: 0xb8903a, roughness: 0.34, metalness: 1, envMapIntensity: 0.9 });
  M.black = std({ color: 0x0c0c0e, roughness: 0.5 });
  M.rubber = std({ map: T.rubber, normalMap: T.rubberN, roughness: 0.75 });
  M.rubberWet = phys({ map: T.rubber, normalMap: T.rubberN, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.25 });
  M.suit = phys({ map: T.rubber, normalMap: T.rubberN, color: 0x8a8a8a, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.55 });
  M.glass = phys({ color: 0x0a1416, roughness: 0.04, metalness: 0, envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.05 });
  M.glassThin = phys({ color: 0x9aa8a8, roughness: 0.06, transparent: true, opacity: 0.18, envMapIntensity: 1.2, depthWrite: false });
  M.hullOut = std({ map: T.hullOut, normalMap: T.hullOutN, roughness: 0.8 });
  M.sand = std({ map: T.sand, normalMap: T.sandN, color: 0x9a968a, roughness: 1 });
  M.rock = std({ map: T.rock, normalMap: T.rockN, roughness: 0.95 });
  M.bell = std({ map: T.bell, normalMap: T.bellN, roughness: 0.6 });
  M.bellIn = std({ map: T.paint, normalMap: T.paintN, color: 0x6a6656, roughness: 0.7, envMapIntensity: 0.3, side: THREE.BackSide });
  M.lead = std({ color: 0x5a5c5e, roughness: 0.7, metalness: 0.5 });
  M.rope = std({ map: T.rope, color: 0xffffff, roughness: 0.9 });
  M.wood = phys({ map: T.wood, normalMap: T.woodN, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  M.wool = std({ map: T.wool, normalMap: T.woolN, roughness: 1 });
  M.towel = std({ color: 0xd8d4c8, roughness: 1, side: THREE.DoubleSide });
  M.canvas = std({ map: T.canvas, normalMap: T.canvasN, roughness: 0.95 });
  M.paper = std({ color: 0xe2dac4, roughness: 0.95 });
  M.dead = std({ map: T.dead, color: 0x9aa2a6, roughness: 0.55 });
  M.hair = std({ color: 0x1a1612, roughness: 0.7 });
  M.cork = std({ color: 0x8a6a44, roughness: 1 });
  M.bulbRed = std({ color: 0x200404, emissive: 0xff2a10, emissiveIntensity: 2.2, roughness: 0.4 });
  M.bulbWarm = std({ color: 0x302010, emissive: 0xffd8a0, emissiveIntensity: 0, roughness: 0.4 });
  M.lampLens = std({ color: 0x300808, emissive: 0xff2a10, emissiveIntensity: 0, roughness: 0.2 });
  M.vcol = std({ vertexColors: true, roughness: 0.85 });
  M.band = {}; for (const k in BAND) M.band[k] = std({ map: T.tank, normalMap: T.tankN, color: BAND[k], roughness: 0.5 });
  M.tankY = std({ map: T.tank, normalMap: T.tankN, color: 0xe0c020, roughness: 0.45, metalness: 0.1 });
  M.water = phys({ color: 0x020506, roughness: 0.12, metalness: 0, normalMap: T.waterN, normalScale: n2(0.25), envMapIntensity: 1.4, clearcoat: 0.6, clearcoatRoughness: 0.12 });
  M.glowW = new THREE.SpriteMaterial({ map: T.glow, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  M.glowR = new THREE.SpriteMaterial({ map: T.glow, color: 0xff3018, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.6 });
  M.glowSea = new THREE.SpriteMaterial({ map: T.glow, color: 0x6ad8d0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0 });
  M.bubble = new THREE.SpriteMaterial({ map: T.bubble, color: 0xffffff, depthWrite: false, transparent: true, fog: true });
}
