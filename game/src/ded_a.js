/* =====================================================================
   MYSTERY #10 — "DEDUSHKA"  ·  Kamenka, an island village on the Angara, Siberia, 30 September 1974
   part A: layout, helpers, textures, materials
   The island is going under the new reservoir, and tonight the clearing brigade is burning the
   village house by house before the water comes. Babushka lies in hospital in Ust-Ilimsk and won't
   rest until you carry Dedushka, the spirit of her house, across the river in her old bast shoe,
   the old way. You fell asleep on her bed. It is twenty to three, and the far end of the village
   is on fire.
   Built for doing: a stove to fire, a boat to caulk, tar, turn and launch, a ladder to carry, a
   chest to drag, a cellar and an attic to search, and a basket to pack. A slow burn: nothing jumps
   at you. Things are moved while you aren't looking, and somebody small is wearing your jacket.
   Axes: +x east, -z north (the lane), +z south (the river). The yard is at y = 0.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {}, V = {};
const FY = 0.7;                                              // the floor of the izba and the seni
const CEIL = 3.3;                                            // their ceiling
const AF = 3.42;                                             // the attic floor
const CY = -0.95;                                            // the cellar floor
const IZ = { x0: 0, x1: 6, z0: -6, z1: 0 };                  // the izba, the one warm room
const SN = { x0: 0, x1: 6, z0: 0.25, z1: 2.8 };              // the seni, the cold entry behind it
const OUT = { x0: -0.25, x1: 6.25, z0: -6.25, z1: 3.05 };    // the log walls, outside faces
const EAVE = 3.6, RIDGE = 6.1, OVER = 0.55;                  // the roof: the ridge runs north-south over x = 3
const roofY = x => RIDGE - (RIDGE - EAVE) * Math.abs(x - 3) / 3.25;
const STOVE = { x0: 0.05, x1: 1.95, z0: -2.3, z1: -0.05, top: FY + 1.55 };
const CHIM = { x0: 0.55, x1: 1.25, z0: -1.25, z1: -0.55 };
const STEPB = { x0: 1.95, x1: 2.45, z0: -2.05, z1: -0.7, top: FY + 0.5 };   // the step-bench up the side of the stove
const MOUTH = { x: 0.95, w: 0.62, y0: FY + 0.82, y1: FY + 1.3, z: -2.3 };   // the oven mouth, on the stove's north face
const DAMPER = new THREE.Vector3(1.25, FY + 2.28, -0.9);                   // the iron damper door, high on the chimney
const KUT_X = 2.1;                                                           // the kitchen corner's curtain
const TRAP = { x0: 2.6, x1: 3.4, z0: -2.55, z1: -1.75 };                   // the cellar hatch in the floor
const CELL = { x0: 0.3, x1: 5.7, z0: -5.7, z1: -0.3 };
const HATCH = { x0: 2.5, x1: 3.2, z0: 1.35, z1: 2.05 };                    // the attic hatch in the seni ceiling
const DOOR_I = { x0: 4.6, x1: 5.5 };                                        // izba to seni, in the wall at z = 0
const DOOR_P = { z0: 1.0, z1: 1.9 };                                        // seni to the porch, in the east wall
const PORCH = { x0: 6.25, x1: 7.7, z0: 0.55, z1: 2.35 };
const BARN = { x0: 15, x1: 20, z0: -4, z1: 3 };
const BARN_DOOR = { z0: -1.35, z1: 0.55 };
const WOOD = { x0: 15.1, x1: 19.9, z0: 3.15, z1: 3.95 };                   // the woodpile under the barn's eaves
const WELL = new THREE.Vector3(11.4, 0, 6.6);
const FENCE = { n: -7.5, e: 21, w: -2.5 };
const GARDEN_Z = 12;                                                         // the wattle between the yard and the garden
const BANK_Z = 21, BEACH_Z = 26, WATER_Z = 27.1, WATER_Y = -1.38;
const LANDING = { x0: 8.6, x1: 9.6, z0: 25.4, z1: 30.5, y: -0.86 };
const BOAT0 = { x: 7.2, z: 20.1, ry: 0 };                                    // where she lies, bottom up; her bow points at the river
const BOATW = { x: 7.25, z: 28.9 };                                          // where she floats, tied to the landing
const ROLL_SPOTS = [new THREE.Vector3(7.2, 0, 23.0), new THREE.Vector3(7.2, 0, 24.6)];
const POS = {
  bed: new THREE.Vector3(5.35, FY + 0.55, -2.4), table: new THREE.Vector3(4.9, FY + 0.76, -5.0),
  pegs: new THREE.Vector3(4.15, FY + 1.75, -0.05), chest0: new THREE.Vector3(3.05, FY, -0.36), chestTrap: new THREE.Vector3(3.0, FY, -2.15),
  basket0: new THREE.Vector3(3.75, FY + 0.45, -5.78), sewing: new THREE.Vector3(3.0, FY + 0.86, -6.08),
  toolbox: new THREE.Vector3(0.38, FY + 0.48, 1.45), ladder0: new THREE.Vector3(18.0, 0, 6.2), gable: new THREE.Vector3(3.0, 0, 3.05),
  crate0: new THREE.Vector3(16.1, 0, -2.9), oar1: new THREE.Vector3(17.6, 2.38, -0.5), oakum: new THREE.Vector3(19.3, 1.55, -3.9), tar0: new THREE.Vector3(17.85, 0.89, -3.62),
  block: new THREE.Vector3(13.8, 0, 5.0), hook: new THREE.Vector3(-2.25, 0, 18.6),
  roller0: [new THREE.Vector3(4.9, 0, 21.9), new THREE.Vector3(4.4, 0, 20.4)],
  oar2: new THREE.Vector3(4.2, CY + 0.05, -4.3), nest: new THREE.Vector3(2.35, CY, -1.2),
  shoes: new THREE.Vector3(3.0, AF + 1.15, -1.6),
};
// the village, burned from the far end toward Babushka's house; it is No. 14
const HOUSES = [
  { id: 'h6', n: 6, x: -58, z: -21, ry: Math.PI, w: 6.5, d: 8.5 },
  { id: 'h8', n: 8, x: -44, z: -3, ry: 0, w: 6, d: 8.5 },
  { id: 'h9', n: 9, x: -30, z: -21, ry: Math.PI, w: 7, d: 9 },
  { id: 'h12', n: 12, x: -16, z: -3, ry: 0, w: 6.2, d: 9 },
  { id: 'h13', n: 13, x: 3, z: -21.5, ry: Math.PI, w: 6.5, d: 9 },
  { id: 'h15', n: 15, x: 27.5, z: -3, ry: 0, w: 6, d: 8.5, dark: true },
  { id: 'h16', n: 16, x: 25, z: -21, ry: Math.PI, w: 6, d: 8, dark: true },
];

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
// tileable fbm over a w x h canvas with cx x cy base cells
function tfb(x, y, w, h, cx, cy, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += tnoise(x / w * cx * f, y / h * cy * f, cx * f, cy * f) * a; f *= 2; a *= 0.5; } return s; }
const hash1 = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function pix(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y), i = (y * w + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] ?? 255; } g.putImageData(img, 0, 0); return c; }
function tex(c, { srgb = true, repeat = null } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; t.userData.canvas = c; return t; }
function canv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cl255 = v => clamp(Math.round(v), 0, 255);
// a colour canvas and a height canvas from one per-pixel function returning [r, g, b, height]
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
  // UVs in metres on every face
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ay > 0.5) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i)); }
  uv.needsUpdate = true; return g;
}
function bev(w, h, d, mat, x, y, z, parent = scene, b = 0.006) { return mesh(bevGeo(w, h, d, b), mat, x, y, z, parent); }
function lathe(pts, mat, x, y, z, parent = scene, seg = 28) { return mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h)), seg), mat, x, y, z, parent); }
function tube(pts, r, mat, parent = scene, seg = 32, rs = 8, closed = false) { const c = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p)), closed); return mesh(new THREE.TubeGeometry(c, seg, r, rs, closed), mat, 0, 0, 0, parent); }
function uvScale(g, su, sv, ou = 0, ov = 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov); uv.needsUpdate = true; return g; }
function mbox(w, h, d, mat, x, y, z, parent = scene, s = 1) { return mesh(tiledBoxGeo(w, h, d, s), mat, x, y, z, parent); }
// a pole between two points
function pole(a, b, r, mat, parent = scene, seg = 10, r2) {
  const A = a.isVector3 ? a : new THREE.Vector3(...a), B = b.isVector3 ? b : new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r2 ?? r, r, len, seg, 1); uvScale(g, 1, len / 0.5);
  const m = mesh(g, mat, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2, parent);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return m;
}
// a horizontal log along x or z, with its UVs in metres (around x along)
function logGeo(len, r, seg = 12) { const g = new THREE.CylinderGeometry(r, r, len, seg, 1, true); uvScale(g, TAU * r / 0.8, len / 1.0, hash1(len * 31 + r * 7), hash1(len * 13)); return g; }
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
// several coloured parts merged into one vertex-coloured geometry
function mergeParts(parts) {
  const pos = [], nor = [], col = [], uv = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
}
// a flat decal a few millimetres off a surface, drawn on a canvas
function decal(w, h, draw, x, y, z, ry, par = scene, px = 256, rx = 0) {
  const t = tex(canv(px, Math.round(px * h / w), draw)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: t, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; m.userData.noRay = true; par.add(m); return m;
}
// the ground: flat in the yard and garden, then the bank down to the shingle and under the river
function groundY(x, z) {
  let y = 0;
  if (z > BANK_Z) { const k = clamp((z - BANK_Z) / (BEACH_Z - BANK_Z), 0, 1); y = -1.12 * smooth(k); }
  if (z > BEACH_Z) y = -1.12 - (z - BEACH_Z) * 0.32;
  if (z > WATER_Z + 1) y = Math.max(-3.2, y);
  return y + (vnoise(x * 0.6 + 11, z * 0.6) - 0.5) * 0.06 * (z < BANK_Z ? 1 : 0.4);
}

/* ---------------- textures ---------------- */
function makeTextures() {
  // logs: grain along the log, long dark checks, grey where the weather has had them
  {
    const W2 = 512, H2 = 256, cracks = [];
    for (let i = 0; i < 9; i++) cracks.push({ x: hash1(i * 3.1) * W2, ph: hash1(i * 7.7) * 10, a: 2 + hash1(i) * 5, w: 0.8 + hash1(i * 2) * 1.8, y0: hash1(i * 5) * H2, len: 60 + hash1(i * 9) * 200 });
    const knots = []; for (let i = 0; i < 6; i++) knots.push({ x: hash1(i * 11.3) * W2, y: hash1(i * 4.1) * H2, r: 5 + hash1(i * 6) * 9 });
    const r = pbrPix(W2, H2, (x, y) => {
      const g1 = tnoise(x / W2 * 64, y / H2 * 2, 64, 2), g2 = tfb(x, y, W2, H2, 16, 3, 3), g3 = tfb(x, y, W2, H2, 6, 6, 4);
      let h = 0.55 + (g1 - 0.5) * 0.18 + (g2 - 0.5) * 0.25;
      let c = mixc([118, 96, 72], [168, 142, 108], g2 * 0.8 + g1 * 0.25);
      c = mixc(c, [92, 88, 82], clamp((g3 - 0.4) * 1.6, 0, 0.6));
      for (const k of cracks) { const dy = ((y - k.y0) % H2 + H2) % H2; if (dy > k.len) continue; const cx = k.x + Math.sin(y * 0.05 + k.ph) * k.a; const dx = Math.abs(((x - cx) % W2 + W2 + W2 / 2) % W2 - W2 / 2); const e = Math.min(1, dy / 20, (k.len - dy) / 20); if (dx < k.w * e) { h -= 0.4; c = mixc(c, [30, 22, 16], 0.85); } else if (dx < k.w * e + 2) { c = mixc(c, [70, 55, 40], 0.3); } }
      for (const k of knots) { const dx = x - k.x, dy = (y - k.y) * 1.8, d = Math.hypot(dx, dy); if (d < k.r) { const ring = Math.sin(d * 1.3) * 0.5 + 0.5; c = mixc(c, [80, 52, 30], 0.6 - d / k.r * 0.4 + ring * 0.15); h += 0.15 * (1 - d / k.r); } }
      return [c[0], c[1], c[2], h];
    }, 3.2);
    T.log = r.map; T.logN = r.normal;
  }
  // log ends at the corners: rings and radial checks
  { const r = pbrPix(256, 256, (x, y) => { const dx = x - 128, dy = y - 128, d = Math.hypot(dx, dy) / 128, a = Math.atan2(dy, dx); const ring = Math.sin(d * 60 + fbm(x * 0.05, y * 0.05) * 6) * 0.5 + 0.5; let c = mixc([150, 120, 86], [118, 90, 62], ring * 0.6); c = mixc(c, [70, 64, 58], clamp(d * 1.2 - 0.6, 0, 0.7)); let h = 0.5 + ring * 0.08; const ck = Math.abs(Math.sin(a * 3 + 0.7)); if (ck < 0.03 + d * 0.02 && d > 0.25) { h -= 0.4; c = mixc(c, [30, 20, 14], 0.8); } return [c[0], c[1], c[2], h]; }, 2); T.logEnd = r.map; T.logEndN = r.normal; }
  // floor boards: wide planks with dark seams, worn pale down the middle where people walked
  { const W2 = 512, H2 = 512, ends = [0.3, 0.75, 0.1, 0.55]; const r = pbrPix(W2, H2, (x, y) => { const pw = W2 / 4, i = Math.floor(x / pw), u = (x % pw) / pw; const g = tnoise(x / W2 * 48, y / H2 * 3 + i * 7, 48, 3), g2 = tfb(x, y, W2, H2, 8, 8, 4); let c = mixc([112, 86, 60], [150, 120, 86], g * 0.6 + g2 * 0.4); c = mixc(c, [90 + i * 8, 70 + i * 4, 52], 0.25); let h = 0.6 + (g - 0.5) * 0.15; if (u < 0.018 || u > 0.982) { h = 0.05; c = [24, 18, 12]; } const ey = ends[i] * H2; if (Math.abs(y - ey) < 2) { h = 0.1; c = mixc(c, [30, 22, 16], 0.8); } if (Math.abs(y - ey) < 4 && (Math.abs(u - 0.15) < 0.02 || Math.abs(u - 0.85) < 0.02)) { c = [40, 36, 34]; h = 0.4; } return [c[0], c[1], c[2], h]; }, 2.6); T.plank = r.map; T.plankN = r.normal; }
  // weathered grey boards (fences, barn, gables): vertical grain, silver, dark streaks
  { const W2 = 256, H2 = 512; const r = pbrPix(W2, H2, (x, y) => { const pw = W2 / 2, u = (x % pw) / pw, i = Math.floor(x / pw); const g = tnoise(x / W2 * 30, y / H2 * 2 + i * 5, 30, 2), g2 = tfb(x, y, W2, H2, 6, 10, 4); let c = mixc([88, 84, 78], [140, 134, 124], g * 0.5 + g2 * 0.5); c = mixc(c, [60, 54, 46], clamp((tfb(x, y, W2, H2, 3, 4, 3) - 0.5) * 2, 0, 0.6)); let h = 0.55 + (g - 0.5) * 0.3; if (u < 0.03 || u > 0.97) { h = 0.05; c = [20, 18, 16]; } return [c[0], c[1], c[2], h]; }, 3.4); T.board = r.map; T.boardN = r.normal; }
  // roofing boards, mossy in places
  { const W2 = 256, H2 = 512; const r = pbrPix(W2, H2, (x, y) => { const pw = W2 / 3, u = (x % pw) / pw, i = Math.floor(x / pw); const g = tnoise(x / W2 * 24, y / H2 * 2 + i * 3, 24, 2), g2 = tfb(x, y, W2, H2, 5, 8, 4), moss = clamp((tfb(x, y, W2, H2, 4, 6, 4) - 0.55) * 4, 0, 1); let c = mixc([70, 66, 62], [112, 106, 98], g * 0.5 + g2 * 0.5); c = mixc(c, [52, 62, 34], moss * 0.7); let h = 0.55 + (g - 0.5) * 0.3 + moss * 0.15; if (u < 0.04) { h = 0.02; c = [14, 12, 10]; } return [c[0], c[1], c[2], h]; }, 3); T.roof = r.map; T.roofN = r.normal; }
  // whitewash over clay on the stove: chalky, a little uneven, brush marks, a few fine cracks
  { const W2 = 512, H2 = 512; const r = pbrPix(W2, H2, (x, y) => { const g = tfb(x, y, W2, H2, 5, 5, 5), g2 = tfb(x, y, W2, H2, 40, 6, 2); const cr = Math.abs(tfb(x, y, W2, H2, 7, 7, 3) - 0.5); let c = mixc([206, 202, 190], [232, 228, 216], g * 0.7 + g2 * 0.3); let h = 0.5 + (g - 0.5) * 0.25 + (g2 - 0.5) * 0.08; if (cr < 0.006) { h -= 0.12; c = mixc(c, [150, 140, 126], 0.35); } return [c[0], c[1], c[2], h]; }, 1.6); T.white = r.map; T.whiteN = r.normal; }
  // soot, for round the oven mouth and up the wall above it
  T.soot = tex(canv(256, 256, (g, W2, H2) => { const gr = g.createRadialGradient(W2 / 2, H2 * 0.75, 4, W2 / 2, H2 * 0.6, W2 * 0.55); gr.addColorStop(0, 'rgba(10,8,6,0.95)'); gr.addColorStop(0.45, 'rgba(18,14,10,0.6)'); gr.addColorStop(1, 'rgba(20,16,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2); speckle(g, W2, H2, 1400, 0.25, '0,0,0', 3); }));
  // iron: dark, pitted, a little rust
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 8, 8, 5), rust = clamp((tfb(x, y, 256, 256, 4, 4, 4) - 0.55) * 3, 0, 1); let c = mixc([34, 32, 30], [58, 54, 50], g); c = mixc(c, [92, 52, 28], rust * 0.6); return [c[0], c[1], c[2], 0.5 + (g - 0.5) * 0.4 - rust * 0.1]; }, 2.5); T.iron = r.map; T.ironN = r.normal; }
  // clay pots: terracotta, soot-blackened at the bottom
  T.clay = tex(pix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 8, 8, 4); let c = mixc([150, 88, 54], [182, 112, 70], g); c = mixc(c, [30, 22, 18], clamp((y / 256 - 0.55) * 2.2, 0, 0.9)); return [cl255(c[0]), cl255(c[1]), cl255(c[2])]; }));
  // birch bark: chalk white with black lenticels and peeling
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 6, 6, 4); let c = mixc([196, 192, 182], [236, 232, 222], g); let h = 0.6; const lx = tnoise(x / 256 * 8, y / 256 * 40, 8, 40); if (lx > 0.78) { c = mixc(c, [24, 22, 20], clamp((lx - 0.78) * 9, 0, 1)); h = 0.35; } if (tfb(x, y, 256, 256, 3, 12, 3) > 0.66) { c = mixc(c, [196, 150, 110], 0.5); h = 0.45; } return [c[0], c[1], c[2], h]; }, 2); T.birch = r.map; T.birchN = r.normal; }
  T.woodEnd = tex(pix(128, 128, (x, y) => { const d = Math.hypot(x - 64, y - 64) / 64, ring = Math.sin(d * 38 + vnoise(x * 0.1, y * 0.1) * 4) * 0.5 + 0.5; let c = mixc([200, 170, 128], [176, 140, 98], ring * 0.5); if (d > 0.9) c = [60, 56, 50]; else if (d > 0.84) c = [220, 214, 200]; return [cl255(c[0]), cl255(c[1]), cl255(c[2])]; }));
  // rag rugs: braided stripes of old clothes
  T.rug = tex(canv(256, 512, (g, W2, H2) => { const cols = ['#7a2a24', '#3a4a6a', '#8a7a52', '#4a5a3a', '#6a3a52', '#9a8a70', '#2a2a30', '#a05030']; let y = 0; while (y < H2) { const h = 8 + Math.floor(Math.random() * 18); g.fillStyle = pick(cols); g.fillRect(0, y, W2, h); for (let x = 0; x < W2; x += 6) { g.fillStyle = `rgba(0,0,0,${0.12 + Math.random() * 0.15})`; g.fillRect(x, y, 2, h); } y += h; } speckle(g, W2, H2, 5000, 0.25, '0,0,0', 2); speckle(g, W2, H2, 2000, 0.2, '255,240,220', 2); g.fillStyle = 'rgba(30,24,18,.5)'; g.fillRect(0, 0, 8, H2); g.fillRect(W2 - 8, 0, 8, H2); }), { repeat: [1, 1] });
  // oilcloth on the table: checks and roses, faded where plates went
  T.oil = tex(canv(512, 512, (g, W2, H2) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, W2, H2); for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(60,110,90,.35)'; g.fillRect(i * 32, 0, 12, H2); g.fillRect(0, i * 32, W2, 12); } for (let i = 0; i < 18; i++) { const x = (i % 4) * 128 + 64 + (Math.floor(i / 4) % 2) * 64, y = Math.floor(i / 4) * 110 + 50; g.fillStyle = '#b8343a'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + Math.cos(k) * 9, y + Math.sin(k) * 9, 9, 0, TAU); g.fill(); } g.fillStyle = '#e06068'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.fillStyle = '#3a6a3a'; g.beginPath(); g.ellipse(x + 18, y + 10, 10, 4, 0.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x - 16, y + 12, 10, 4, -0.6, 0, TAU); g.fill(); } const gr = g.createRadialGradient(W2 / 2, H2 / 2, 40, W2 / 2, H2 / 2, W2 * 0.7); gr.addColorStop(0, 'rgba(255,250,240,.18)'); gr.addColorStop(1, 'rgba(60,40,20,.25)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2); speckle(g, W2, H2, 3000, 0.15, '60,40,20', 2); }));
  // chintz for the curtain: small flowers on faded red
  T.chintz = tex(canv(256, 256, (g, W2, H2) => { g.fillStyle = '#5e2a26'; g.fillRect(0, 0, W2, H2); for (let i = 0; i < 70; i++) { const x = Math.random() * W2, y = Math.random() * H2; g.fillStyle = pick(['#b8a88a', '#b89a50', '#9aa0a8']); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.26) * 3, y + Math.sin(k * 1.26) * 3, 2.2, 0, TAU); g.fill(); } g.fillStyle = '#3a5a2a'; g.fillRect(x + 4, y + 2, 5, 2); } speckle(g, W2, H2, 2000, 0.2, '0,0,0', 2); }), { repeat: [3, 3] });
  // an embroidered towel, white linen with red cross-stitch and a lace edge
  T.towel = tex(canv(256, 512, (g, W2, H2) => { g.fillStyle = '#e6e0d2'; g.fillRect(0, 0, W2, H2); speckle(g, W2, H2, 4000, 0.06, '80,60,40', 1); const band = (y0) => { for (let x = 8; x < W2 - 8; x += 8) for (let y = 0; y < 40; y += 8) { const on = (Math.abs(((x / 8) % 10) - 5) + Math.abs(y / 8 - 2)) % 4 < 1.5; if (on) { g.fillStyle = '#a8201c'; g.fillRect(x, y0 + y, 6, 6); } } }; band(H2 - 150); band(H2 - 95); g.fillStyle = '#a8201c'; g.fillRect(0, H2 - 44, W2, 3); for (let x = 0; x < W2; x += 12) { g.fillStyle = 'rgba(230,224,210,1)'; g.beginPath(); g.arc(x + 6, H2 - 20, 6, 0, TAU); g.fill(); g.clearRect(x + 4, H2 - 22, 4, 4); } }));
  // quilted cotton (a telogreika): dark, stitched in channels
  { const r = pbrPix(256, 256, (x, y) => { const ch = (y % 32) / 32, g = tfb(x, y, 256, 256, 16, 16, 3); let h = 0.4 + Math.sin(ch * Math.PI) * 0.5 + (g - 0.5) * 0.08; let c = mixc([34, 38, 46], [52, 56, 64], g * 0.5 + Math.sin(ch * Math.PI) * 0.4); if (ch < 0.05 || ch > 0.95) { c = [18, 20, 24]; h = 0.05; if (x % 6 < 3) c = [70, 74, 80]; } return [c[0], c[1], c[2], h]; }, 3); T.quilt = r.map; T.quiltN = r.normal; }
  // cellar earth and the riverbank's mud
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 6, 6, 5), p = tnoise(x / 256 * 40, y / 256 * 40, 40, 40); let c = mixc([46, 36, 28], [76, 62, 48], g); let h = 0.4 + (g - 0.5) * 0.4; if (p > 0.82) { c = mixc(c, [110, 104, 96], 0.7); h += 0.25; } return [c[0], c[1], c[2], h]; }, 2.6); T.earth = r.map; T.earthN = r.normal; }
  // autumn grass over mud, tileable every 3 m
  { const r = pbrPix(512, 512, (x, y) => { const g = tfb(x, y, 512, 512, 6, 6, 5), bl = tnoise(x / 512 * 160, y / 512 * 40, 160, 40), mud = clamp((tfb(x, y, 512, 512, 3, 3, 4) - 0.56) * 4, 0, 1); let c = mixc([92, 78, 46], [138, 118, 66], g * 0.5 + bl * 0.5); c = mixc(c, [62, 64, 36], clamp((tfb(x, y, 512, 512, 5, 5, 3) - 0.5) * 2, 0, 0.6)); c = mixc(c, [44, 34, 24], mud * 0.85); return [c[0], c[1], c[2], 0.4 + bl * 0.3 * (1 - mud) + (g - 0.5) * 0.2]; }, 3); T.grass = r.map; T.grassN = r.normal; }
  // shingle on the beach
  { const r = pbrPix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 8, 8, 4); const cells = 12; const cx = x / 256 * cells, cy = y / 256 * cells; let best = 9, bi = 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const ix = Math.floor(cx) + i, iy = Math.floor(cy) + j, px = ix + hash1(((ix % cells) + cells) % cells * 17 + ((iy % cells) + cells) % cells * 131), py = iy + hash1(((ix % cells) + cells) % cells * 71 + ((iy % cells) + cells) % cells * 13 + 5); const d = Math.hypot(cx - px, cy - py); if (d < best) { best = d; bi = ix * 7 + iy; } } const h = clamp(1 - best * 1.6, 0, 1); let c = mixc([70, 66, 60], [140, 132, 120], hash1(bi) * 0.7 + g * 0.3); c = mixc([30, 26, 22], c, clamp(h * 2.5, 0, 1)); return [c[0], c[1], c[2], h * 0.8]; }, 3); T.shingle = r.map; T.shingleN = r.normal; }
  // woven bast (a lapot): strips of lime bark plaited on the bias
  { const r = pbrPix(256, 256, (x, y) => { const u = (x + y) / 256 * 10, v = (x - y + 256) / 256 * 10, a = u % 1, b = v % 1, over = (Math.floor(u) + Math.floor(v)) % 2 === 0; const k = over ? Math.sin(a * Math.PI) : Math.sin(b * Math.PI); const g = tfb(x, y, 256, 256, 16, 16, 3); let c = mixc([120, 92, 56], [192, 160, 112], k * 0.6 + g * 0.4); const edge = Math.min(a, 1 - a, b, 1 - b); if (edge < 0.06) c = mixc(c, [60, 44, 28], 0.6); return [c[0], c[1], c[2], 0.2 + k * 0.6]; }, 3); T.bast = r.map; T.bastN = r.normal; }
  // hay
  T.hay = tex(canv(256, 256, (g, W2, H2) => { g.fillStyle = '#7a6a3a'; g.fillRect(0, 0, W2, H2); for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(${170 + Math.random() * 60},${140 + Math.random() * 50},${70 + Math.random() * 30},${0.4 + Math.random() * 0.5})`; g.lineWidth = 1; const x = Math.random() * W2, y = Math.random() * H2, a = Math.random() * TAU, l = 10 + Math.random() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }), { repeat: [2, 2] });
  // fur: grey, for his hands and the cat
  T.fur = tex(canv(256, 256, (g, W2, H2) => { g.fillStyle = '#5a5650'; g.fillRect(0, 0, W2, H2); for (let i = 0; i < 2600; i++) { const v = 60 + Math.random() * 90; g.strokeStyle = `rgba(${v},${v - 4},${v - 10},0.5)`; const x = Math.random() * W2, y = Math.random() * H2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + 6 + Math.random() * 8); g.stroke(); } }));
  T.tabby = tex(canv(256, 256, (g, W2, H2) => { g.fillStyle = '#6a645a'; g.fillRect(0, 0, W2, H2); for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(30,28,26,.55)'; const y = i * 30 + Math.random() * 8; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W2; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 6 + 6); g.lineTo(W2, y + 12); for (let x = W2; x >= 0; x -= 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 6); g.fill(); } for (let i = 0; i < 2600; i++) { const v = 70 + Math.random() * 110; g.strokeStyle = `rgba(${v},${v - 6},${v - 14},0.35)`; const x = Math.random() * W2, y = Math.random() * H2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + 5 + Math.random() * 6); g.stroke(); } }));
  // strands of grey hair on a transparent card
  T.hair = tex(canv(128, 256, (g, W2, H2) => { g.clearRect(0, 0, W2, H2); const base = g.createLinearGradient(0, 0, 0, H2); base.addColorStop(0, 'rgba(150,144,134,.95)'); base.addColorStop(0.75, 'rgba(140,134,124,.75)'); base.addColorStop(1, 'rgba(140,134,124,0)'); g.fillStyle = base; g.beginPath(); g.moveTo(W2 * 0.12, 0); g.lineTo(W2 * 0.88, 0); g.lineTo(W2, H2 * 0.85); g.quadraticCurveTo(W2 * 0.5, H2 * 1.05, 0, H2 * 0.85); g.fill();
    for (let i = 0; i < 700; i++) { const v = 100 + Math.random() * 120; g.strokeStyle = `rgba(${v},${v - 6},${v - 16},${0.6 + Math.random() * 0.4})`; g.lineWidth = 1 + Math.random() * 2; const x = W2 * 0.1 + Math.random() * W2 * 0.8; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (Math.random() - 0.5) * 20, H2 * 0.4, x + (Math.random() - 0.5) * 30, H2 * 0.7, x + (Math.random() - 0.5) * 34, H2 * (0.7 + Math.random() * 0.3)); g.stroke(); } }));
  T.hair.wrapS = T.hair.wrapT = THREE.ClampToEdgeWrapping;
  // worn blue paint, for the carved window frames
  T.blue = tex(pix(256, 256, (x, y) => { const g = tfb(x, y, 256, 256, 8, 8, 4), wear = clamp((tfb(x, y, 256, 256, 6, 6, 4) - 0.6) * 4, 0, 1); let c = mixc([52, 96, 142], [80, 126, 170], g); c = mixc(c, [120, 112, 100], wear); return [cl255(c[0]), cl255(c[1]), cl255(c[2])]; }));
  // a water normal map: wind ripples
  T.waterN = heightToNormal(pix(256, 256, (x, y) => { const v = tfb(x, y, 256, 256, 8, 4, 4) * 0.7 + tfb(x, y, 256, 256, 24, 8, 2) * 0.3; return [v * 255, v * 255, v * 255]; }), 3);
  T.waterN.repeat.set(160, 80);
  // the night sky: low cloud lit from below by the fires in the west, a smudge of moon
  T.sky = tex(canv(1024, 512, (g, W2, H2) => {
    const gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#05070b'); gr.addColorStop(0.45, '#0b0f16'); gr.addColorStop(0.5, '#141820'); gr.addColorStop(1, '#0a0c10'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
    const img = g.getImageData(0, 0, W2, H2), d = img.data;
    for (let y = 0; y < H2 / 2; y++) for (let x = 0; x < W2; x++) { const c = tfb(x, y * 2, W2, H2, 8, 3, 5), k = clamp((c - 0.42) * 2.2, 0, 1), i = (y * W2 + x) * 4; const lit = 0.6 + 0.4 * Math.max(0, Math.cos((x / W2) * TAU - Math.PI * 1.5)); d[i] = d[i] * (1 - k) + (30 * lit + 8) * k; d[i + 1] = d[i + 1] * (1 - k) + (26 * lit + 9) * k; d[i + 2] = d[i + 2] * (1 - k) + (26 * lit + 12) * k; }
    g.putImageData(img, 0, 0);
    const mx = W2 * 0.62, my = H2 * 0.22; const mg = g.createRadialGradient(mx, my, 2, mx, my, 60); mg.addColorStop(0, 'rgba(200,210,230,.55)'); mg.addColorStop(0.15, 'rgba(150,160,190,.2)'); mg.addColorStop(1, 'rgba(100,110,140,0)'); g.fillStyle = mg; g.fillRect(mx - 70, my - 70, 140, 140);
  }));
  T.sky.wrapT = THREE.ClampToEdgeWrapping;
  // flames: eight frames of a licking tongue, for billboards
  T.flames = [];
  for (let f = 0; f < 8; f++) T.flames.push(tex(pix(64, 128, (x, y) => {
    const u = (x - 32) / 32, v = 1 - y / 128, n = fbm(x * 0.09, y * 0.07 + f * 1.7, 3), n2 = fbm(x * 0.2 + f, y * 0.15 - f * 2.3, 2);
    const wd = (1 - v) * 0.85 + 0.12, sh = 1 - Math.abs(u + (n - 0.5) * 0.7 * v) / wd; const k = clamp(sh * 1.5 - v * 0.9 + (n2 - 0.5) * 0.9, 0, 1) * clamp(v * 6, 0, 1);
    const hot = clamp(k * 1.4 - v * 0.4, 0, 1); return [255, cl255(80 + hot * 175), cl255(20 + hot * hot * 160), cl255(k * 255)];
  }), { srgb: true }));
  T.flames.forEach(t => { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });
  T.smoke = tex(pix(128, 128, (x, y) => { const d = Math.hypot(x - 64, y - 64) / 64, n = fbm(x * 0.06, y * 0.06, 4); const a = clamp((1 - d) * 1.4 * (0.6 + n * 0.8) - 0.15, 0, 1); return [120, 116, 112, cl255(a * 200)]; }));
  T.smoke.wrapS = T.smoke.wrapT = THREE.ClampToEdgeWrapping;
  T.glow = tex(pix(64, 64, (x, y) => { const d = Math.hypot(x - 32, y - 32) / 32, a = clamp(1 - d, 0, 1); return [255, 255, 255, cl255(a * a * 255)]; }));
  T.glow.wrapS = T.glow.wrapT = THREE.ClampToEdgeWrapping;
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  const nrm = (n, s) => new THREE.Vector2(s, s);
  M.logOut = std({ map: T.log, normalMap: T.logN, normalScale: nrm(0, 1.1), color: 0xa8a49c, roughness: 0.92 });
  M.logIn = std({ map: T.log, normalMap: T.logN, normalScale: nrm(0, 0.9), color: 0xc49c74, roughness: 0.82 });
  M.logEnd = std({ map: T.logEnd, normalMap: T.logEndN, color: 0xb8aa98, roughness: 0.95 });
  M.chink = std({ color: 0x2a221a, roughness: 1 });
  M.floor = std({ map: T.plank, normalMap: T.plankN, color: 0xc8a882, roughness: 0.78 });
  M.ceil = std({ map: T.plank, normalMap: T.plankN, color: 0x7a6450, roughness: 0.9 });
  M.board = std({ map: T.board, normalMap: T.boardN, roughness: 0.95 });
  M.boardDark = std({ map: T.board, normalMap: T.boardN, color: 0x8a847a, roughness: 0.95 });
  M.roof = std({ map: T.roof, normalMap: T.roofN, roughness: 0.95, side: THREE.DoubleSide });
  M.white = std({ map: T.white, normalMap: T.whiteN, roughness: 0.96 });
  M.whiteDirty = std({ map: T.white, normalMap: T.whiteN, color: 0xb8b0a0, roughness: 0.97 });
  M.ovenIn = std({ color: 0x1a1410, roughness: 1, map: T.white });
  M.iron = std({ map: T.iron, normalMap: T.ironN, roughness: 0.62, metalness: 0.75, envMapIntensity: 0.5 });
  M.clay = std({ map: T.clay, roughness: 0.82 });
  M.birch = std({ map: T.birch, normalMap: T.birchN, roughness: 0.9 });
  M.woodEnd = std({ map: T.woodEnd, roughness: 0.95 });
  M.wood = std({ map: T.plank, normalMap: T.plankN, color: 0xb08a62, roughness: 0.8 });
  M.woodDark = std({ map: T.plank, normalMap: T.plankN, color: 0x6a4a32, roughness: 0.72 });
  M.varnish = phys({ map: T.plank, color: 0x8a5a36, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.4 });
  M.rug = std({ map: T.rug, roughness: 1 });
  M.oil = phys({ map: T.oil, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  M.chintz = std({ map: T.chintz, roughness: 0.95, side: THREE.DoubleSide });
  M.towel = std({ map: T.towel, roughness: 0.95, side: THREE.DoubleSide });
  M.linen = std({ color: 0xe8e2d4, roughness: 0.95, side: THREE.DoubleSide });
  M.quilt = std({ map: T.quilt, normalMap: T.quiltN, roughness: 0.95 });
  M.earth = std({ map: T.earth, normalMap: T.earthN, roughness: 1 });
  M.grass = std({ map: T.grass, normalMap: T.grassN, roughness: 1 });
  M.shingle = std({ map: T.shingle, normalMap: T.shingleN, roughness: 0.95 });
  M.bast = std({ map: T.bast, normalMap: T.bastN, roughness: 0.95 });
  M.hay = std({ map: T.hay, roughness: 1 });
  M.blue = std({ map: T.blue, roughness: 0.85 });
  M.glass = phys({ color: 0x9aa4a0, roughness: 0.08, transmission: 0, transparent: true, opacity: 0.22, envMapIntensity: 1.2, depthWrite: false });
  M.tar = phys({ color: 0x0a0806, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  M.rope = std({ color: 0x8a7652, roughness: 1 });
  M.oakum = std({ color: 0x5a4a32, roughness: 1, map: T.hay });
  M.brass = std({ color: 0xb8903a, roughness: 0.38, metalness: 1, envMapIntensity: 0.8 });
  M.tin = std({ color: 0x9a9890, roughness: 0.4, metalness: 0.9, envMapIntensity: 0.7 });
  M.paper = std({ color: 0xe0d6bc, roughness: 0.95 });
  M.cloth = std({ color: 0x5a4a3a, roughness: 1, side: THREE.DoubleSide });
  M.fur = std({ map: T.fur, roughness: 1 });
  M.tabby = std({ map: T.tabby, roughness: 1 });
  M.hair = std({ map: T.hair, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.75, color: 0xd8d2c4 });
  M.skin = std({ color: 0xc8a088, roughness: 0.6 });
  M.water = phys({ color: 0x050708, roughness: 0.22, metalness: 0, normalMap: T.waterN, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.1, clearcoat: 0.25, clearcoatRoughness: 0.25 });
  M.charred = std({ color: 0x141110, roughness: 1, map: T.log });
  M.vcol = std({ vertexColors: true, roughness: 0.9 });
  M.ember = std({ color: 0x1a0a04, emissive: 0xff4a10, emissiveIntensity: 0, roughness: 1 });
  M.flames = T.flames.map(t => new THREE.SpriteMaterial({ map: t, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  M.flamesDim = T.flames.map(t => new THREE.SpriteMaterial({ map: t, color: 0x6a5a4a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: true }));
  M.smoke = new THREE.SpriteMaterial({ map: T.smoke, color: 0x2a2624, depthWrite: false, transparent: true, opacity: 0.55 });
  M.smokeLit = new THREE.SpriteMaterial({ map: T.smoke, color: 0x6a3a22, depthWrite: false, transparent: true, opacity: 0.5 });
  M.glowO = new THREE.SpriteMaterial({ map: T.glow, color: 0xff7a30, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.5 });
  M.eye = new THREE.SpriteMaterial({ map: T.glow, color: 0xffe0a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0 });
  M.spark = new THREE.SpriteMaterial({ map: T.glow, color: 0xffa040, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
}
