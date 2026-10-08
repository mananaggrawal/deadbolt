/* =====================================================================
   MYSTERY #9 — "EL TÍO"  ·  Cerro Rico, Potosí, Bolivia, 31 July 1998
   ===================================================================== */
const ROOM_TIO = (() => {
/* part A: layout, helpers, textures, materials
   Level 3 of the Santa Rita mine, Cerro Rico, Potosi, 4,200 m up, on the last night of July 1998.
   On the afternoon tour you pocketed a lump of silver ore from the Tío's offerings. Then the
   mountain shook. You wake alone in the dark with the way out full of rock, and the Tío's
   chair is empty. He only moves in the dark. Your carbide lamp is running down.
   Built for doing, like Tik-Tik: strike the flint, drag and kick and climb, carry a sledge,
   put your own light out to let him come to you, drill, charge, light, run.
   Axes: +x east, -z north. Level 3 floor at y = 0; Level 4 (the old workings) at y = -5.
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {}, V = {};
const L4Y = -5;                                                            // the floor of Level 4
const GAL = { x0: -1.05, x1: 1.05, z0: -19.5, z1: 8.0, h: 2.25 };          // the main gallery, Level 3
const FACE_Z = -17.2;                                                      // the face of the rockfall
const NICHE = { x0: -2.6, x1: -1.05, z0: -6.0, z1: -4.0, h: 2.15 };        // the Tío's niche, west wall
const REF = { x0: 1.05, x1: 2.05, z0: -9.6, z1: -8.4, h: 1.95 };           // the refuge niche, east wall
const TD = { x0: 1.05, x1: 7.0, z0: 0.2, z1: 2.0, h: 2.0 };                // the drift to the tool chamber
const TC = { x0: 7.0, x1: 11.6, z0: -1.6, z1: 3.8, h: 2.5 };               // the tool chamber
const OD = { x0: -7.4, x1: -1.05, z0: 4.1, z1: 5.9, h: 2.05 };             // the old drift (boarded up)
const WZ = { x0: -6.6, x1: -5.4, z0: 4.4, z1: 5.6 };                       // the winze: a ladder shaft down to Level 4
const BOARD_X = -1.75;                                                     // the planks across the old drift
const D4 = { x0: -11.0, x1: -5.2, z0: 4.1, z1: 5.9, h: 1.9 };              // Level 4: the drift at the foot of the winze
const BAY = { x0: -14.2, x1: -11.0, z0: 3.4, z1: 6.5, h: 1.95 };           // Level 4: the old loading bay at its end
const CRAWL_H = 1.15, CRAWL_Y = L4Y + 0.15;                                // the colonial crawl: hands and knees
const CWA = { x0: -13.0, x1: -12.1, z0: 0.35, z1: 3.4, h: CRAWL_H };       // its first leg, north from the bay
const CWC = { x0: -13.9, x1: -13.0, z0: -1.6, z1: 1.25, h: CRAWL_H };      // its second leg, after a jog west
const CH = { x0: -15.0, x1: -11.8, z0: -4.4, z1: -1.6, h: 1.9 };           // the Spanish chamber at the end
const CH_Y = CRAWL_Y;
const ADIT = { x0: -1.25, x1: 1.25, z0: -46, z1: -19.5, h: 2.35 };         // the main adit, beyond the rockfall
const BREACH = { x0: -0.55, x1: 0.65, y0: 0.25, y1: 1.4 };                 // the hole the blast opens
const POS = {
  spawn: { x: 0.35, z: -8.1 }, refuge: { x: 1.6, z: -9.0 },
  seat: new THREE.Vector3(-2.0, 0, -5.0),
  face: new THREE.Vector3(0.15, 1.0, FACE_Z), bag: new THREE.Vector3(0.55, 0, -16.2), crack: new THREE.Vector3(1.05, 1.25, -12.6),
  tioStart: new THREE.Vector3(0.12, 0, 1.6),
  winzeTop: new THREE.Vector3(-6.0, 0, 5.0), winzeBot: new THREE.Vector3(-6.0, L4Y, 5.0),
  valve: new THREE.Vector3(-5.32, L4Y + 1.15, 4.75), crawlMouth: new THREE.Vector3(-12.55, L4Y, 3.55), miner: new THREE.Vector3(-13.35, CH_Y, -3.95),
  tinRef: new THREE.Vector3(1.85, 0.8, -9.3), tinTool: new THREE.Vector3(10.9, 0, 3.15), tinL4: new THREE.Vector3(-5.45, L4Y + 0.95, 4.3),
  bench: new THREE.Vector3(9.1, 0, -1.15), box: new THREE.Vector3(11.0, 0, 0.4), kit: new THREE.Vector3(7.4, 1.25, -1.5),
  points: 3.6, cartTop: -3.0, chock: -2.3, buffer: 7.25,
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
// a paper ribbon along a curve, a few centimetres wide, hanging edge-down
function ribbon(pts, w, mat, par) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : new THREE.Vector3(...p))), n = 28, pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = c.getPoint(t), tg = c.getTangent(t), side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 1, 0)); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize(); const tw = Math.sin(t * 9 + pts.length) * 0.5; const s2 = side.clone().applyAxisAngle(tg, tw).multiplyScalar(w / 2); pos.push(p.x + s2.x, p.y + s2.y, p.z + s2.z, p.x - s2.x, p.y - s2.y, p.z - s2.z); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const uv = []; for (let i = 0; i <= n; i++) uv.push(0, i / n, 1, i / n); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; par.add(m); return m;
}
function mergeParts(parts) {
  const pos = [], nor = [], col = [], uv = [];
  for (const p of parts) { const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo); g.applyMatrix4(p.m); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, c = new THREE.Color(p.color); for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
}

/* ---------------- rough rock ----------------
   A rock surface over a rectangle, pushed back into the mountain by noise so the tunnel looks hacked
   out of the hill, with UVs in metres. face is the way it faces (into the open): 'x+' a west wall,
   'x-' an east wall, 'z+' a north wall, 'z-' a south wall, 'y-' a roof, 'y+' a floor.
   holes are [u0, u1, v0, v1] in the surface's own (u, v): z/y for walls along z, x/y for walls along x,
   x/z for roofs and floors. */
const ROCKS = [];
function rockSurf(face, c, u0, u1, v0, v1, holes = [], o = {}) {
  const step = o.step || 0.16, amp = o.amp ?? (face[0] === 'y' ? (face === 'y+' ? 0.035 : 0.26) : 0.3);
  const nu = Math.max(2, Math.ceil((u1 - u0) / step)), nv = Math.max(2, Math.ceil((v1 - v0) / step));
  const pos = [], uv = [], col = [], idx = [], seed = o.seed ?? (c * 3.7 + u0 * 1.3);
  const W = (u, v) => {
    // the point on the surface, before it's pushed back
    if (face[0] === 'x') return [c, v, u]; if (face[0] === 'z') return [u, v, c]; return [u, c, v];
  };
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = u0 + (u1 - u0) * i / nu, v = v0 + (v1 - v0) * j / nv, p = W(u, v);
    // big lumps, smaller knuckles, a few sharp ledges; edges pulled flush so neighbours meet
    const big = fbm(u * 1.1 + seed, v * 1.1 - seed * 0.3, 3), mid = fbm(u * 3.4 - seed, v * 3.4 + seed, 3), sm = vnoise(u * 9 + seed, v * 9), ledge = Math.max(0, Math.sin(v * 3.6 + fbm(u * 0.8, seed) * 5) - 0.55) * 0.6;
    let d = amp * (big * 1.15 + mid * 0.6 + sm * 0.12 + ledge - 0.5);
    if (face === 'y+') d = amp * (big * 0.6 + mid * 0.5 - 0.35);
    const edge = Math.min(i, nu - i, j, nv - j); if (edge === 0 && !o.keepEdge) d *= 0.35;
    d = Math.max(d, -0.03);
    const k = face[0] === 'x' ? 0 : face[0] === 'y' ? 1 : 2; p[k] += face[1] === '+' ? -d : d;   // back into the rock
    pos.push(p[0], p[1], p[2]); uv.push(u / 1.2, v / 1.2);
    const t = o.tint ? o.tint(p[0], p[1], p[2], d) : [1, 1, 1]; const sh = 0.86 + mid * 0.28; col.push(t[0] * sh, t[1] * sh, t[2] * sh);
  }
  const inHole = (u, v) => holes.some(h => u > h[0] && u < h[1] && v > h[2] && v < h[3]);
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const uc = u0 + (u1 - u0) * (i + 0.5) / nu, vc = v0 + (v1 - v0) * (j + 0.5) / nv; if (inHole(uc, vc)) continue;
    const a = j * (nu + 1) + i, b = a + 1, cc = a + nu + 1, dd = cc + 1;
    idx.push(a, b, dd, a, dd, cc);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  // wind every face toward the open side
  const want = { 'x+': [1, 0, 0], 'x-': [-1, 0, 0], 'y+': [0, 1, 0], 'y-': [0, -1, 0], 'z+': [0, 0, 1], 'z-': [0, 0, -1] }[face];
  if (idx.length) {
    const p = g.attributes.position, A = new THREE.Vector3().fromBufferAttribute(p, idx[0]), B = new THREE.Vector3().fromBufferAttribute(p, idx[1]), C = new THREE.Vector3().fromBufferAttribute(p, idx[2]);
    const n = B.sub(A).cross(C.sub(A)); if (n.x * want[0] + n.y * want[1] + n.z * want[2] < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); }
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, o.mat || (face === 'y+' ? M.floor : M.rock)); m.castShadow = face !== 'y+'; m.receiveShadow = true;
  (o.parent || O.mine).add(m); ROCKS.push(m); return m;
}
// the colour of the rock where it is: wet and dark low down, orange where the acid water runs on Level 4
function tintL3(x, y, z) { const w = clamp(1 - y / 0.7, 0, 1) * 0.25, ox = clamp(fbm(x * 0.3 + 7, z * 0.3 + y * 0.5) - 0.55, 0, 1) * 1.6; return [1 - w + ox * 0.2, 0.97 - w - ox * 0.05, 0.94 - w - ox * 0.25]; }
function tintL4(x, y, z) { const yy = y - L4Y, w = clamp(1 - yy / 0.9, 0, 1) * 0.35, ox = clamp(fbm(x * 0.5 + 3, z * 0.4) - 0.42 + (1 - clamp(yy / 1.6, 0, 1)) * 0.25, 0, 1) * 1.8; return [0.92 - w + ox * 0.35, 0.86 - w + ox * 0.12, 0.8 - w - ox * 0.3]; }
// a tunnel: four walls, a roof and a floor, the solids that go with them, and gaps where other tunnels join.
// gaps: { w: [[z0, z1, top?]], e: [...], n: [[x0, x1, top?]], s: [...] }; open: { n, s, e, w } leaves a side off entirely
function tunnel(b, y0, o = {}) {
  const y1 = y0 + b.h, gp = o.gaps || {}, op = o.open || {}, tint = o.tint || (y0 < -2 ? tintL4 : tintL3), mat = o.mat, par = o.parent;
  const holesOf = (list) => (list || []).map(([a, c, top]) => [a, c, y0 - 1, y0 + (top ?? b.h + 1)]);
  const R = (f, cc, a, bb, v0, v1, hl, extra = {}) => rockSurf(f, cc, a, bb, v0, v1, hl, Object.assign({ tint, mat, parent: par }, extra));
  if (!op.w) R('x+', b.x0, b.z0, b.z1, y0, y1, holesOf(gp.w));
  if (!op.e) R('x-', b.x1, b.z0, b.z1, y0, y1, holesOf(gp.e));
  if (!op.n) R('z+', b.z0, b.x0, b.x1, y0, y1, holesOf(gp.n));
  if (!op.s) R('z-', b.z1, b.x0, b.x1, y0, y1, holesOf(gp.s));
  if (!o.noRoof) R('y-', y1, b.x0, b.x1, b.z0, b.z1, o.roofHoles || []);
  if (!o.noFloor) R('y+', y0, b.x0, b.x1, b.z0, b.z1, o.floorHoles || [], { mat: o.floorMat || (y0 < -2 ? M.floor4 : M.floor) });
  // solids: floor, roof, and each wall less its gaps (with a lintel over a low gap)
  const id = o.id || 'tun';
  if (!o.noFloorSolid) solid(id + '_f', b.x0 - 0.3, b.x1 + 0.3, y0 - 0.6, y0, b.z0 - 0.3, b.z1 + 0.3);
  solid(id + '_r', b.x0 - 0.3, b.x1 + 0.3, y1, y1 + 0.6, b.z0 - 0.3, b.z1 + 0.3);
  const T_ = 0.5;
  const wallSolids = (side, a0, a1, list, mk) => {
    if (op[side]) return; const gaps = (list || []).slice().sort((p, q) => p[0] - q[0]); let a = a0;
    for (const [g0, g1, top] of gaps) { if (g0 > a) mk(a, g0, y0, y1); if (top !== undefined && top < b.h) mk(g0, g1, y0 + top, y1); a = Math.max(a, g1); }
    if (a < a1) mk(a, a1, y0, y1);
  };
  wallSolids('w', b.z0, b.z1, gp.w, (a, c, ya, yb) => solid(id + '_w', b.x0 - T_, b.x0, ya, yb, a, c));
  wallSolids('e', b.z0, b.z1, gp.e, (a, c, ya, yb) => solid(id + '_e', b.x1, b.x1 + T_, ya, yb, a, c));
  wallSolids('n', b.x0, b.x1, gp.n, (a, c, ya, yb) => solid(id + '_n', a, c, ya, yb, b.z0 - T_, b.z0));
  wallSolids('s', b.x0, b.x1, gp.s, (a, c, ya, yb) => solid(id + '_s', a, c, ya, yb, b.z1, b.z1 + T_));
}

/* ---------------- textures ---------------- */
function makeTextures() {
  const S = IS_TOUCH ? 256 : 512;
  // Cerro Rico rock: red-brown, banded, cracked, rusty with iron, a few metallic flecks
  T.rock = pbrPix(S, S, (x, y) => {
    const n = tfbm(x, y, S, S, 4, 5), n2 = tfbm(x + 91, y + 37, S, S, 12, 4), n3 = tfbm(x + 17, y + 211, S, S, 32, 2);
    const band = Math.sin((y / S * 5 + n * 1.8) * Math.PI) * 0.5 + 0.5;
    const cr = Math.pow(clamp(1 - Math.abs(tnoise(x / S * 9, y / S * 9, 9, 9) - 0.5) * 2, 0, 1), 90) * clamp((n2 - 0.45) * 4, 0, 1);
    let c = mixc([70, 52, 42], [124, 96, 78], n * 0.75 + band * 0.18 + n3 * 0.15);
    c = mixc(c, [146, 128, 108], clamp(n2 - 0.58, 0, 1) * 1.8);
    c = mixc(c, [138, 74, 36], clamp(tfbm(x + 300, y, S, S, 3, 3) - 0.6, 0, 1) * 2.2);
    c = mixc(c, [52, 46, 40], clamp(0.45 - n3, 0, 1) * 0.8);
    c = mixc(c, [28, 22, 18], cr * 0.6);
    const fl = hash1(x * 7.1 + y * 131.7) > 0.9993 ? 1 : 0; if (fl) c = mixc(c, [190, 188, 180], 0.7);
    return [c[0], c[1], c[2], n * 0.45 + n2 * 0.35 + n3 * 0.2 - cr * 0.4];
  }, 6.5);
  // the floor: trodden grit and mud, puddles that shine in the lamp
  { const W = S; const rough = document.createElement('canvas'); rough.width = rough.height = W; const rg = rough.getContext('2d'), ri = rg.createImageData(W, W);
    T.floor = pbrPix(W, W, (x, y) => {
      const n = tfbm(x, y, W, W, 6, 5), p = tfbm(x + 333, y + 77, W, W, 3, 3), pud = clamp((p - 0.6) * 8, 0, 1), grit = hash1(x * 13.1 + y * 7.7) * 0.25;
      let c = mixc([46, 36, 30], [92, 74, 60], n * 0.8 + grit); c = mixc(c, [24, 20, 18], pud * 0.8);
      const i = (y * W + x) * 4, rv = (0.9 - pud * 0.78 - n * 0.08) * 255; ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = rv; ri.data[i + 3] = 255;
      return [c[0], c[1], c[2], n * 0.5 * (1 - pud) + grit];
    }, 2.6);
    rg.putImageData(ri, 0, 0); T.floorRough = tex(rough, { srgb: false });
  }
  // eucalyptus props: stripped grey-brown wood, split along the grain, black with handling at chest height
  T.timber = pbrPix(256, 512, (x, y) => {
    const fib = tnoise(x / 256 * 48, y / 512 * 3, 48, 3) * 0.55 + tnoise(x / 256 * 120, y / 512 * 6, 120, 6) * 0.45;
    const chk = Math.pow(clamp(1 - Math.abs(tnoise(x / 256 * 14, y / 512 * 1.5, 14, 2) - 0.5) * 2, 0, 1), 60) * clamp(tnoise(x / 256 * 3, y / 512 * 4, 3, 4) * 2 - 0.6, 0, 1);
    const grime = tfbm(x, y, 256, 512, 3, 3);
    let c = mixc([52, 42, 34], [104, 88, 70], fib * 0.7 + grime * 0.3); c = mixc(c, [20, 16, 13], chk * 0.85); c = mixc(c, [30, 26, 22], clamp(grime - 0.55, 0, 1) * 1.5);
    return [c[0], c[1], c[2], fib * 0.6 - chk * 0.7];
  }, 3.0);
  // sawn planks
  T.plank = pbrPix(256, 256, (x, y) => {
    const g = tfbm(x * 3, y * 0.4, 768, 102, 6, 4), ring = Math.sin((y / 256 * 20 + g * 6) * Math.PI) * 0.5 + 0.5;
    let c = mixc([82, 66, 50], [140, 118, 92], ring * 0.4 + g * 0.6); c = mixc(c, [50, 42, 34], clamp(tfbm(x, y, 256, 256, 4, 3) - 0.5, 0, 1));
    return [c[0], c[1], c[2], 0.5 + ring * 0.2];
  }, 1.6);
  // rusty steel
  T.rust = pbrPix(256, 256, (x, y) => {
    const n = tfbm(x, y, 256, 256, 6, 5), r = clamp(tfbm(x + 60, y + 20, 256, 256, 4, 4) - 0.38, 0, 1) * 1.8;
    let c = mixc([46, 44, 42], [70, 66, 62], n); c = mixc(c, [118, 58, 26], r); c = mixc(c, [72, 34, 18], clamp(r - 0.6, 0, 1));
    return [c[0], c[1], c[2], n * 0.3 + r * 0.5];
  }, 2.2);
  // the Tío's clay: red paint over grey clay, cracked and chipped, black with soot and offerings
  T.clay = pbrPix(S, S, (x, y) => {
    const n = tfbm(x, y, S, S, 6, 5), chip = clamp((tfbm(x + 50, y + 90, S, S, 9, 3) - 0.66) * 6, 0, 1);
    const cr = Math.pow(1 - Math.abs(tnoise(x / S * 9, y / S * 9, 9, 9) - 0.5) * 2, 26);
    let c = mixc([44, 12, 9], [86, 24, 15], n); c = mixc(c, [70, 62, 54], chip * 0.7); c = mixc(c, [14, 7, 6], cr * 0.9); c = mixc(c, [22, 10, 8], clamp(tfbm(x + 7, y + 3, S, S, 3, 3) - 0.45, 0, 1) * 1.6);
    return [c[0], c[1], c[2], n * 0.4 - cr * 0.7 - chip * 0.15];
  }, 2.2);
  // worn canvas cloth
  T.cloth = tex(pix(128, 128, (x, y) => { const w = ((x + y) % 4 < 2 ? 1 : 0.88) * (0.85 + tnoise(x / 128 * 8, y / 128 * 8, 8, 8) * 0.3); return [58 * w, 60 * w, 66 * w]; }), { repeat: [3, 3] });
  // dried skin, brown as an old boot
  T.leather = pbrPix(128, 128, (x, y) => { const n = tfbm(x, y, 128, 128, 6, 4), cr = Math.pow(1 - Math.abs(tnoise(x / 128 * 10, y / 128 * 10, 10, 10) - 0.5) * 2, 12); let c = mixc([52, 34, 22], [96, 66, 44], n); c = mixc(c, [22, 14, 10], cr); return [c[0], c[1], c[2], n - cr]; }, 2);
  // coloured paper streamers and confetti
  T.streamer = tex(canv(64, 256, (g, w, h) => { const cols = ['#d8342a', '#e8c43a', '#3a8ad8', '#3ab06a', '#e86ab0', '#f0f0e8']; for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(0, i * 32, w, 32); } speckle(g, w, h, 300, 0.2, '0,0,0', 2); }));
  T.coca = tex(canv(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#4a6a2a'; g.beginPath(); g.ellipse(32, 32, 13, 26, 0, 0, TAU); g.fill(); g.strokeStyle = '#6a8a40'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 8); g.lineTo(32, 56); g.stroke(); g.fillStyle = 'rgba(30,40,20,0.4)'; g.beginPath(); g.ellipse(36, 30, 8, 20, 0.2, 0, TAU); g.fill(); }));
  T.coca.wrapS = T.coca.wrapT = THREE.ClampToEdgeWrapping;
  T.glow = tex(canv(64, 64, (g, w, h) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  T.glow.wrapS = T.glow.wrapT = THREE.ClampToEdgeWrapping;
  T.dust = tex(canv(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 26; i++) blot(g, 64 + (Math.random() - 0.5) * 70, 64 + (Math.random() - 0.5) * 70, 18 + Math.random() * 30, 0.16, '200,190,175'); }));
  T.dust.wrapS = T.dust.wrapT = THREE.ClampToEdgeWrapping;
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  const nrm = (t, x, y) => { t.repeat.set(x, y); return t; };
  M.rock = std({ map: T.rock.map, normalMap: T.rock.normal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.82, vertexColors: true, envMapIntensity: 0.35 });
  M.rock4 = std({ map: T.rock.map, normalMap: T.rock.normal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.5, vertexColors: true, envMapIntensity: 0.55 });
  M.floor = std({ map: T.floor.map, normalMap: T.floor.normal, roughnessMap: T.floorRough, roughness: 0.9, vertexColors: true, envMapIntensity: 0.7 });
  M.floor4 = std({ map: T.floor.map, normalMap: T.floor.normal, roughness: 0.35, vertexColors: true, color: 0x8a7a6a, envMapIntensity: 0.8 });
  M.timber = std({ map: T.timber.map, normalMap: T.timber.normal, roughness: 0.9 });
  M.timberDark = std({ map: T.timber.map, normalMap: T.timber.normal, color: 0x6a5e52, roughness: 0.92 });
  M.plank = std({ map: T.plank.map, normalMap: T.plank.normal, roughness: 0.85 });
  M.rust = std({ map: T.rust.map, normalMap: T.rust.normal, roughness: 0.75, metalness: 0.45 });
  M.rail = std({ map: T.rust.map, color: 0x9a8a80, roughness: 0.5, metalness: 0.7 });
  M.railTop = std({ color: 0x8c8884, roughness: 0.32, metalness: 0.9, envMapIntensity: 0.8 });
  M.pipe = std({ color: 0x1e1c1a, roughness: 0.6, metalness: 0.5 });
  M.iron = std({ color: 0x2a2826, roughness: 0.5, metalness: 0.75 });
  M.brass = std({ color: 0x9a7a3a, roughness: 0.35, metalness: 0.9, envMapIntensity: 0.9 });
  M.tin = std({ map: T.rust.map, color: 0xb8b0a0, roughness: 0.55, metalness: 0.6 });
  M.clay = std({ map: T.clay.map, normalMap: T.clay.normal, normalScale: new THREE.Vector2(1.3, 1.3), roughness: 0.74, envMapIntensity: 0.45 });
  M.cape = std({ color: 0x120c0c, roughness: 0.85, side: THREE.DoubleSide });
  M.capeLining = std({ color: 0x4a0a08, roughness: 0.6, side: THREE.BackSide });
  M.clayDark = std({ map: T.clay.map, normalMap: T.clay.normal, color: 0x3a2622, roughness: 0.7 });
  M.paintBlack = std({ color: 0x0e0b0a, roughness: 0.45 });
  M.horn = std({ map: T.timber.map, normalMap: T.timber.normal, color: 0x3a2a20, roughness: 0.62 });
  M.teeth = phys({ color: 0xe8e2d0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  M.eye = phys({ color: 0x3a2610, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.0 });
  M.iris = std({ color: 0x0a0503, roughness: 0.2 });
  M.glassEye = phys({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.18, clearcoat: 1, clearcoatRoughness: 0.0, envMapIntensity: 2.5, depthWrite: false });
  M.socket = std({ color: 0x1a0606, roughness: 0.6 });
  M.mouth = std({ color: 0x050202, roughness: 0.9 });
  M.beard = std({ color: 0x0c0a09, roughness: 1 });
  M.streamer = std({ map: T.streamer, roughness: 0.85, side: THREE.DoubleSide });
  M.ribbons = ['#c8281e', '#e0b830', '#2a6ac8', '#2a9a58', '#d8509a', '#e8e4d8'].map(c => std({ color: c, roughness: 0.8, side: THREE.DoubleSide }));
  M.coca = std({ map: T.coca, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75 });
  M.cocaPile = std({ color: 0x3e5a24, roughness: 0.85 });
  M.paper = std({ color: 0xe8e2d4, roughness: 0.9 });
  M.cig = std({ color: 0xf0ece2, roughness: 0.8 });
  M.filter = std({ color: 0xc89a5a, roughness: 0.8 });
  M.glassGreen = phys({ color: 0x1e4a2a, roughness: 0.1, transparent: true, opacity: 0.75, clearcoat: 1, envMapIntensity: 1.2 });
  M.glassBrown = phys({ color: 0x3a1e0a, roughness: 0.1, transparent: true, opacity: 0.8, clearcoat: 1, envMapIntensity: 1.2 });
  M.glassClear = phys({ color: 0xd8e0e0, roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1, envMapIntensity: 1.5 });
  M.wax = std({ color: 0xd8cbb0, roughness: 0.55 });
  M.bone = std({ color: 0x9a8a72, roughness: 0.6 });
  M.leather = std({ map: T.leather.map, normalMap: T.leather.normal, roughness: 0.6 });
  M.cloth = std({ map: T.cloth, roughness: 0.95 });
  M.clothDark = std({ map: T.cloth, color: 0x3a3028, roughness: 0.98 });
  M.rubber = std({ color: 0x141312, roughness: 0.75 });
  M.helmet = std({ color: 0x3a2a1a, roughness: 0.7 });
  M.helmetNew = phys({ color: 0xd8a020, roughness: 0.35, clearcoat: 0.5 });
  M.plastic = std({ color: 0x2a6a3a, roughness: 0.55 });
  M.water = phys({ color: 0x0a0806, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4, transparent: true, opacity: 0.86 });
  M.flame = new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false });
  M.glow = new THREE.SpriteMaterial({ map: T.glow, color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  M.ember = new THREE.SpriteMaterial({ map: T.glow, color: 0xff3810, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  M.spark = new THREE.SpriteMaterial({ map: T.glow, color: 0xffd890, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  M.eyeGlint = new THREE.SpriteMaterial({ map: T.glow, color: 0xffd8a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  M.dust = new THREE.SpriteMaterial({ map: T.dust, color: 0x8a7e70, transparent: true, opacity: 0, depthWrite: false, fog: true });
  M.bulb = new THREE.MeshBasicMaterial({ color: 0xffe2b0, fog: false });
  M.cable = std({ color: 0x101010, roughness: 0.6 });
  M.duct = std({ color: 0xc8a020, roughness: 0.7, side: THREE.DoubleSide });
  // the ones that wear painted textures
  M.tioHead = std({ map: T.tioFace, normalMap: T.clay.normal, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.6, envMapIntensity: 0.5 });
  M.tioFeet = std({ map: T.clay.map, normalMap: T.clay.normal, roughness: 0.65 });
  M.tioFeetWet = phys({ map: T.clay.map, normalMap: T.clay.normal, color: 0x8a6a62, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
  M.minerFace = std({ map: T.minerFace, color: 0x8a8278, roughness: 0.92 });
}
/* =====================================================================
   EL TIO · part B: the mine. Level 3: the main gallery with its rails, the rockfall at the north end,
   the Tío's niche and the refuge niche, the drift to the tool chamber, the boarded-up old drift and
   the winze. Level 4: the flooded drift at the foot of the ladder, the old loading bay, the Spanish
   crawl and the chamber at its end. And beyond the rockfall, hidden until the blast, the main adit.
   ===================================================================== */
function tpost(x, z, y0, y1, r = 0.085, mat = M.timber, par = O.props) { if (par !== O.adit || true) solid('post', x - r, x + r, y0 - 0.1, y1, z - r, z + r); return pole([x, y0, z], [x + rand(-0.025, 0.025), y1, z + rand(-0.025, 0.025)], r, mat, par, 9, r * 0.9); }
// a set of timbers across a north-south tunnel at z (two legs and a cap)
function setNS(z, x0, x1, y0, top, par = O.props, mat = M.timber) { tpost(x0, z, y0, y0 + top, 0.085, mat, par); tpost(x1, z, y0, y0 + top, 0.085, mat, par); pole([x0 - 0.14, y0 + top + 0.07, z], [x1 + 0.14, y0 + top + 0.07, z], 0.095, mat, par, 9); }
// the same across an east-west tunnel at x
function setEW(x, z0, z1, y0, top, par = O.props, mat = M.timber) { tpost(x, z0, y0, y0 + top, 0.085, mat, par); tpost(x, z1, y0, y0 + top, 0.085, mat, par); pole([x, y0 + top + 0.07, z0 - 0.14], [x, y0 + top + 0.07, z1 + 0.14], 0.095, mat, par, 9); }
// a lump of rock: a squashed, roughened icosahedron
function boulder(r, x, y, z, par = O.props, mat = M.rock, sq = 0.7) {
  const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), k = 0.75 + vnoise(v.x * 5 + x * 3, v.y * 5 + v.z * 4 + z) * 0.5; v.multiplyScalar(k); v.y *= sq; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); const col = new Float32Array(p.count * 3).fill(0.9); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = mesh(g, mat, x, y, z, par); m.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); return m;
}
// chalk or paint on the rock: a transparent canvas decal
function decal(w, h, draw, x, y, z, ry, par = O.props, px = 256) {
  const c = canv(px, Math.round(px * h / w), (g, W, H) => { g.clearRect(0, 0, W, H); draw(g, W, H); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 2; m.userData.noRay = true; par.add(m); return m;
}
const chalk = (txt, font, rot = 0, col = 'rgba(232,226,212,0.82)') => (g, W, H) => { g.save(); g.translate(W / 2, H / 2); g.rotate(rot); g.fillStyle = col; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; const lines = txt.split('\n'); lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * parseInt(font.match(/(\d+)px/)[1]) * 1.15)); g.restore(); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.6})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); } g.globalCompositeOperation = 'source-over'; };

function buildMine() {
  O.mine = grp(); O.props = grp(); O.l4 = grp(); O.adit = grp(); O.adit.visible = false; O.adit.userData.keep = true;
  /* ---------- Level 3 ---------- */
  tunnel({ x0: GAL.x0, x1: GAL.x1, z0: FACE_Z - 0.3, z1: GAL.z1, h: GAL.h }, 0, { id: 'gal', open: { n: true },
    gaps: { w: [[NICHE.z0, NICHE.z1, NICHE.h], [OD.z0, OD.z1, OD.h]], e: [[REF.z0, REF.z1, REF.h], [TD.z0, TD.z1, TD.h]] } });
  tunnel(NICHE, 0, { id: 'niche', open: { e: true } });
  tunnel(REF, 0, { id: 'ref', open: { w: true } });
  tunnel(TD, 0, { id: 'td', open: { w: true, e: true } });
  tunnel(TC, 0, { id: 'tc', gaps: { w: [[TD.z0, TD.z1, TD.h]] } });
  tunnel(OD, 0, { id: 'od', open: { e: true }, floorHoles: [[WZ.x0, WZ.x1, WZ.z0, WZ.z1]] });
  solid('winzeHole', WZ.x0, WZ.x1, -0.2, 2.2, WZ.z0, WZ.z1);
  // the winze itself, the ladder shaft down to Level 4
  const wy0 = L4Y + D4.h, wt = (f, c, a, b) => rockSurf(f, c, a, b, wy0, 0, [], { tint: tintL4, amp: 0.12 });
  wt('x+', WZ.x0, WZ.z0, WZ.z1); wt('x-', WZ.x1, WZ.z0, WZ.z1); wt('z+', WZ.z0, WZ.x0, WZ.x1); wt('z-', WZ.z1, WZ.x0, WZ.x1);
  // the rockfall: a plug of broken rock filling the gallery, with a hole the blast will open
  const bh = [BREACH.x0, BREACH.x1, BREACH.y0, BREACH.y1];
  rockSurf('z+', FACE_Z, GAL.x0 - 0.38, GAL.x1 + 0.38, -0.05, GAL.h + 0.5, [bh], { amp: 0.38, step: 0.15, keepEdge: true, tint: (x, y) => [0.95, 0.9, 0.86] });
  rockSurf('z-', ADIT.z1, ADIT.x0 - 0.35, ADIT.x1 + 0.35, -0.05, ADIT.h + 0.45, [bh], { amp: 0.3, step: 0.16, keepEdge: true, parent: O.adit });
  O.plug = grp(); O.plug.userData.keep = true;
  rockSurf('z+', FACE_Z + 0.02, BREACH.x0 - 0.05, BREACH.x1 + 0.05, BREACH.y0 - 0.05, BREACH.y1 + 0.05, [], { amp: 0.3, step: 0.12, parent: O.plug, seed: 4.2 });
  O.breach = grp(); O.breach.visible = false; O.breach.userData.keep = true;
  const br = (f, c, a, b, v0, v1) => rockSurf(f, c, a, b, v0, v1, [], { amp: 0.12, step: 0.14, parent: O.breach, tint: () => [0.85, 0.8, 0.76] });
  br('x+', BREACH.x0, ADIT.z1, FACE_Z, BREACH.y0, BREACH.y1); br('x-', BREACH.x1, ADIT.z1, FACE_Z, BREACH.y0, BREACH.y1);
  br('y-', BREACH.y1, BREACH.x0, BREACH.x1, ADIT.z1, FACE_Z); br('y+', BREACH.y0, BREACH.x0, BREACH.x1, ADIT.z1, FACE_Z);
  O.plugSolid = solid('plug', GAL.x0 - 0.4, GAL.x1 + 0.4, -0.1, GAL.h + 0.2, ADIT.z1 - 0.1, FACE_Z);
  O.breachSolids = [solid('brL', GAL.x0 - 0.4, BREACH.x0, -0.1, GAL.h + 0.2, ADIT.z1 - 0.1, FACE_Z), solid('brR', BREACH.x1, GAL.x1 + 0.4, -0.1, GAL.h + 0.2, ADIT.z1 - 0.1, FACE_Z),
    solid('brT', BREACH.x0, BREACH.x1, BREACH.y1, GAL.h + 0.2, ADIT.z1 - 0.1, FACE_Z), solid('brB', BREACH.x0, BREACH.x1, -0.1, BREACH.y0, ADIT.z1 - 0.1, FACE_Z)];
  O.breachSolids.forEach(s => s.on = false);
  // broken rock heaped at the foot of it (low enough to step over)
  O.rubble = grp(); O.rubble.userData.keep = true;
  for (let i = 0; i < 26; i++) { const x = rand(GAL.x0 + 0.1, GAL.x1 - 0.1), z = FACE_Z + rand(0.05, 0.75 - Math.abs(x) * 0.25), r = rand(0.08, 0.26) * (1 - (z - FACE_Z) * 0.6); boulder(r, x, r * 0.35, z, O.rubble); }
  for (let i = 0; i < 9; i++) boulder(rand(0.22, 0.42), rand(GAL.x0, GAL.x1), rand(1.4, 2.0), FACE_Z + rand(-0.15, 0.05), O.rubble);
  solid('rubbleToe', GAL.x0, GAL.x1, -0.1, 0.16, FACE_Z, FACE_Z + 0.55);
  /* ---------- Level 4 ---------- */
  tunnel(D4, L4Y, { id: 'd4', open: { w: true }, roofHoles: [[WZ.x0, WZ.x1, WZ.z0, WZ.z1]], mat: M.rock4, parent: O.l4 });
  tunnel(BAY, L4Y, { id: 'bay', gaps: { e: [[D4.z0, D4.z1, D4.h]], n: [[CWA.x0, CWA.x1, CRAWL_H + 0.15]] }, mat: M.rock4, parent: O.l4 });
  tunnel(CWA, CRAWL_Y, { id: 'cwa', open: { s: true }, gaps: { w: [[CWC.z1 - 0.9, CWC.z1]] }, mat: M.rock4, parent: O.l4, tint: tintL4 });
  tunnel(CWC, CRAWL_Y, { id: 'cwc', open: { n: true }, gaps: { e: [[CWA.z0, CWC.z1]] }, mat: M.rock4, parent: O.l4, tint: tintL4 });
  tunnel(CH, CH_Y, { id: 'ch', gaps: { s: [[CWC.x0, CWC.x1, CRAWL_H]] }, mat: M.rock4, parent: O.l4, tint: tintL4 });
  // a step up from the bay into the crawl
  solid('crawlStep', CWA.x0, CWA.x1, L4Y - 0.2, CRAWL_Y, CWA.z0, BAY.z0 + 0.02);
  /* ---------- the main adit, beyond the rockfall ---------- */
  tunnel(ADIT, 0, { id: 'adit', open: { s: true }, parent: O.adit, tint: (x, y) => [0.9, 0.86, 0.82] });
}

/* ---------------- rails, timbers, pipe ---------------- */
// the line the cart runs on: the main line south from the cart's place, and a branch curving into the old drift
const ARC = { cx: -2.0, cz: POS.points, r: 2.0 };
function branchPt(t) { const a = t * Math.PI / 2; return { x: ARC.cx + Math.cos(a) * ARC.r, z: ARC.cz + Math.sin(a) * ARC.r, yaw: -a }; }
function railStrip(pts, par) {
  // two rails and their sleepers along a polyline of {x, z}
  const rails = [[], []];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    const dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    rails[0].push([p.x + nx * 0.3, p.z + nz * 0.3]); rails[1].push([p.x - nx * 0.3, p.z - nz * 0.3]);
  }
  for (const r of rails) for (let i = 0; i < r.length - 1; i++) {
    const [ax, az] = r[i], [bx, bz] = r[i + 1], l = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    const web = mesh(new THREE.BoxGeometry(0.03, 0.07, l + 0.01), M.rail, (ax + bx) / 2, 0.075, (az + bz) / 2, par); web.rotation.y = yaw;
    const top = mesh(new THREE.BoxGeometry(0.055, 0.02, l + 0.01), M.railTop, (ax + bx) / 2, 0.115, (az + bz) / 2, par); top.rotation.y = yaw;
  }
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b.x - a.x, b.z - a.z); acc += l;
    if (acc >= 0.62) { acc = 0; const sl = mbox(0.9, 0.06, 0.12, M.timberDark, b.x, 0.03, b.z, par, 0.5); sl.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); sl.rotation.z = rand(-0.03, 0.03); }
  }
}
function buildRails() {
  const main = []; for (let z = FACE_Z + 0.9; z <= POS.buffer + 0.3; z += 0.25) main.push({ x: 0, z });
  railStrip(main, O.props);
  const br = []; for (let t = 0; t <= 1.0001; t += 0.05) { const p = branchPt(t); br.push({ x: p.x, z: p.z }); }
  for (let x = ARC.cx - 0.2; x >= -3.6; x -= 0.3) br.push({ x, z: ARC.cz + ARC.r });
  railStrip(br, O.props);
  // buffer stop at the south end: two posts and a beam
  setNS(POS.buffer + 0.15, -0.35, 0.35, 0, 0.55, O.props, M.timberDark);
  // the points: a lever with a cast-iron weight, and the moving rails
  O.points = grp(0.62, 0, POS.points + 0.15); O.points.userData.keep = true;
  mbox(0.36, 0.08, 0.16, M.iron, 0, 0.04, 0, O.points, 0.3);
  O.pointsLever = grp(0, 0.08, 0, O.points);
  pole([0, 0, 0], [0, 0.62, 0], 0.016, M.iron, O.pointsLever, 6);
  const wgt = mbox(0.12, 0.12, 0.08, M.paintBlack, 0, 0.5, 0, O.pointsLever, 0.2);
  O.tongues = grp(0, 0, POS.points + 0.2); O.tongues.userData.keep = true;
  for (const s of [-1, 1]) { const tg = mbox(0.04, 0.03, 1.2, M.railTop, s * 0.27, 0.115, 0.6, O.tongues, 0.3); tg.userData.side = s; }
  // the timbers: thick near the fall, where the rock is bad, and at every opening
  for (const z of [-16.5, -15.0, -13.4, -11.8, -10.4, -4.5, 7.6]) setNS(z, GAL.x0 + 0.13, GAL.x1 - 0.13, 0, 2.02);
  for (const [z0, z1] of [[NICHE.z0, NICHE.z1], [REF.z0, REF.z1], [TD.z0, TD.z1], [OD.z0, OD.z1]]) {
    const xs = z0 === NICHE.z0 || z0 === OD.z0 ? GAL.x0 + 0.07 : GAL.x1 - 0.07, top = z0 === REF.z0 ? 1.88 : 1.98;
    tpost(xs, z0 - 0.04, 0, top); tpost(xs, z1 + 0.04, 0, top); pole([xs, top + 0.06, z0 - 0.2], [xs, top + 0.06, z1 + 0.2], 0.09, M.timber, O.props, 9);
  }
  for (const x of [-3.0, -4.7, -7.0]) setEW(x, OD.z0 + 0.12, OD.z1 - 0.12, 0, 1.9);
  for (const x of [3.0, 5.2]) setEW(x, TD.z0 + 0.12, TD.z1 - 0.12, 0, 1.86);
  tpost(9.2, 1.1, 0, 2.38, 0.11); pole([9.2, 2.42, -1.75], [9.2, 2.42, 3.95], 0.11, M.timber, O.props, 9);
  // lagging: thin poles laid over the caps near the fall
  for (let z = -16.5; z < -10.4; z += 0.16) pole([GAL.x0 + 0.05, 2.17 + rand(-0.01, 0.02), z + rand(-0.03, 0.03)], [GAL.x1 - 0.05, 2.17 + rand(-0.01, 0.02), z + rand(-0.03, 0.03)], 0.03, M.timberDark, O.props, 5);
  // the air line: black pipe along the east wall, across the roof and into the old drift, down the winze
  const P_ = (a, b, r = 0.03) => pole(a, b, r, M.pipe, O.props, 8);
  P_([0.9, 1.85, -16.4], [0.9, 1.85, 4.62]); P_([0.9, 1.85, 4.62], [0.9, 2.12, 4.62]); P_([0.9, 2.12, 4.62], [-1.2, 2.12, 4.62]);
  P_([-1.2, 2.12, 4.62], [-1.2, 1.85, 4.3]); P_([-1.2, 1.85, 4.3], [-5.5, 1.85, 4.3]); P_([-5.5, 1.85, 4.3], [-5.5, L4Y + 1.4, 4.5]);
  for (let z = -15.8; z < 4.5; z += 1.6) pole([0.9, 1.85, z], [1.02, 1.95, z], 0.008, M.iron, O.props, 4);
  // the old line on Level 4, rotten and drowned
  const l4 = []; for (let x = -6.2; x >= -13.6; x -= 0.3) l4.push({ x, z: 5.0 });
  const g4 = grp(0, L4Y - 0.04, 0, O.l4); railStrip(l4, g4); g4.children.forEach(c => { if (c.material === M.railTop) c.material = M.rust; });
  for (const x of [-7.6, -9.4]) setEW(x, D4.z0 + 0.1, D4.z1 - 0.1, L4Y, 1.78, O.l4, M.timberDark);
}

/* ---------------- props ---------------- */
function buildProps() {
  const P = O.props;
  /* --- the Tío's niche: a bench of stones, and everything the miners have given him --- */
  O.bench = grp(-2.08, 0, -5.0); O.bench.userData.keep = true;
  for (let i = 0; i < 7; i++) boulder(rand(0.16, 0.24), rand(-0.22, 0.22), 0.14 + (i > 3 ? 0.2 : 0), rand(-0.55, 0.55), O.bench, M.rock, 0.65);
  mbox(0.62, 0.1, 1.3, M.plank, 0.02, 0.43, 0, O.bench, 0.5);
  solid('tioBench', -2.42, -1.74, -0.1, 0.48, -5.68, -4.32);
  // paper streamers festooned across the niche, and hanging down its walls
  for (let i = 0; i < 16; i++) {
    const mat = M.ribbons[i % M.ribbons.length], z0 = rand(NICHE.z0 + 0.05, NICHE.z1 - 0.05);
    if (i < 8) { const za = rand(NICHE.z0, NICHE.z1), zb = rand(NICHE.z0, NICHE.z1), x = rand(NICHE.x0 + 0.2, NICHE.x1 + 0.1), sag = rand(0.2, 0.5); ribbon([[x - 0.15, 2.05, za], [x, 2.05 - sag, (za + zb) / 2], [x + 0.15, 2.05, zb]], 0.028, mat, P); }
    else { const x = i % 2 ? NICHE.x0 + 0.08 : rand(NICHE.x0 + 0.1, NICHE.x1), l = rand(0.6, 1.5); ribbon([[x, 2.08, z0], [x + rand(-0.04, 0.04), 2.08 - l * 0.5, z0 + rand(-0.06, 0.06)], [x + rand(-0.06, 0.06), 2.08 - l, z0 + rand(-0.1, 0.1)]], 0.026, mat, P); }
  }
  // bottles, cans, cigarette ends, a heap of coca, burnt-down candles
  for (let i = 0; i < 9; i++) { const x = rand(-1.7, -1.15), z = rand(-5.7, -4.3), tall = Math.random() < 0.6; const b = lathe(tall ? [[0, 0], [0.035, 0], [0.036, 0.16], [0.014, 0.21], [0.013, 0.25], [0, 0.25]] : [[0, 0], [0.03, 0], [0.031, 0.12], [0, 0.12]], tall ? (Math.random() < 0.5 ? M.glassGreen : M.glassBrown) : M.tin, x, 0.01, z, P, 12); if (Math.random() < 0.3) { b.rotation.z = Math.PI / 2; b.position.y = 0.035; b.rotation.y = rand(0, TAU); } }
  for (let i = 0; i < 26; i++) { const c = cyl(0.004, 0.004, rand(0.02, 0.035), i % 3 ? M.cig : M.filter, rand(-1.8, -1.1), 0.006, rand(-5.8, -4.2), P, 5); c.rotation.z = Math.PI / 2; c.rotation.y = rand(0, TAU); c.castShadow = false; }
  { const heap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 6, 0, TAU, 0, Math.PI / 2), M.cocaPile); heap.scale.set(1, 0.35, 1); heap.position.set(-1.6, 0, -4.55); P.add(heap); }
  for (let i = 0; i < 6; i++) { const x = rand(-2.45, -1.2), z = rand(-5.9, -4.1); cyl(0.018, 0.022, rand(0.02, 0.07), M.wax, x, 0.02, z, P, 8); }
  decal(1.1, 0.4, chalk('VIVA EL TÍO', 'bold 60px "Permanent Marker", cursive', -0.06), -2.58, 1.72, -5.0, Math.PI / 2, P, 512);
  decal(0.9, 0.3, chalk('Tío danos veta', '44px "Caveat", cursive', 0.05), -2.58, 1.35, -4.75, Math.PI / 2, P, 512);
  /* --- the refuge niche --- */
  decal(1.1, 0.34, chalk('REFUGIO', 'bold 70px "Permanent Marker", cursive', -0.03, 'rgba(240,236,226,0.9)'), 1.04, 2.05, -9.0, -Math.PI / 2, P, 512);
  mbox(0.42, 0.08, 1.0, M.plank, 1.82, 0.42, -9.0, P, 0.5); for (const z of [-9.4, -8.6]) boulder(0.17, 1.82, 0.18, z, P);
  solid('refBench', 1.6, 2.05, -0.1, 0.46, -9.5, -8.5);
  boulder(0.3, 1.86, 0.62, -9.32, P, M.rock, 0.6);
  O.tinRef = buildTin(POS.tinRef.x, POS.tinRef.y, POS.tinRef.z, 0.65, P);
  /* --- the gift bag you bought at the miners' market, burst at the foot of the rockfall --- */
  O.bag = grp(POS.bag.x, 0, POS.bag.z); O.bag.userData.keep = true;
  { const g = new THREE.SphereGeometry(0.17, 12, 8), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.y = v.y * 0.45 + 0.02; v.multiplyScalar(0.8 + Math.random() * 0.4); p.setXYZ(i, v.x, Math.max(0.004, v.y), v.z); } g.computeVertexNormals(); mesh(g, std({ color: 0x2a3a8a, roughness: 0.45, side: THREE.DoubleSide }), 0, 0.03, 0, O.bag); }
  for (let i = 0; i < 9; i++) { const sh = mesh(new THREE.TetrahedronGeometry(rand(0.01, 0.035)), M.glassClear, rand(-0.25, 0.3), 0.01, rand(-0.25, 0.25), O.bag); sh.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3)); }
  { const st = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), std({ color: 0x0a0806, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false })); st.rotation.x = -Math.PI / 2; st.position.set(0.05, 0.004, 0.08); st.scale.set(1, 0.7, 1); O.bag.add(st); }
  mbox(0.05, 0.015, 0.035, std({ color: 0xc83a28, roughness: 0.6 }), -0.2, 0.01, 0.18, O.bag, 0.1);
  // a trail of coca leaves from the empty niche south along the rails, into the dark
  O.cocaTrail = grp(); O.cocaTrail.userData.keep = true;
  { const n = 70, geo = new THREE.PlaneGeometry(0.035, 0.06), im = new THREE.InstancedMesh(geo, M.coca, n), m4_ = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) { const t = i / (n - 1), z = lerp(-4.6, POS.tioStart.z - 0.2, Math.pow(t, 0.9)) + rand(-0.3, 0.3), x = lerp(-1.1, 0.0, Math.min(1, t * 3)) + rand(-0.32, 0.32); e.set(-Math.PI / 2, 0, rand(0, TAU)); q.setFromEuler(e); m4_.compose(new THREE.Vector3(x, 0.005 + i * 0.00003, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4_); }
    im.receiveShadow = true; im.userData.noRay = true; O.cocaTrail.add(im); }
  // the bag of coca at his feet, where he dropped it
  O.cocaBag = grp(POS.tioStart.x + 0.32, 0, POS.tioStart.z + 0.35); O.cocaBag.userData.keep = true;
  { const g = new THREE.SphereGeometry(0.09, 10, 8), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); v.y = Math.max(0, v.y) * 0.9; v.x *= 1.2; p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); mesh(g, std({ color: 0x3a8a3a, roughness: 0.3, transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, 0, 0, O.cocaBag); const ins = mesh(new THREE.SphereGeometry(0.075, 8, 6), M.cocaPile, 0, 0.02, 0, O.cocaBag); ins.scale.y = 0.7; }
  /* --- the tool chamber --- */
  O.restBench = grp(POS.bench.x, 0, POS.bench.z); O.restBench.userData.keep = true;
  pole([-0.8, 0.38, 0], [0.8, 0.38, 0.02], 0.12, M.timber, O.restBench, 10);
  for (const x of [-0.6, 0.6]) boulder(0.2, x, 0.14, 0, O.restBench);
  solid('restBench', POS.bench.x - 0.85, POS.bench.x + 0.85, -0.1, 0.48, POS.bench.z - 0.2, POS.bench.z + 0.2);
  // a pack of cigarettes on it, and somebody's thing: a flat slab of black glass
  O.cigs = grp(POS.bench.x - 0.25, 0.5, POS.bench.z + 0.02); O.cigs.userData.keep = true;
  { const pk = box(0.055, 0.085, 0.022, std({ map: T.cigPack, roughness: 0.6 }), 0, 0.011, 0, O.cigs); pk.rotation.x = -Math.PI / 2; pk.rotation.z = 0.4; }
  O.phone = grp(POS.bench.x + 0.3, 0.505, POS.bench.z + 0.03); O.phone.userData.keep = true;
  { const body = mbox(0.074, 0.008, 0.155, phys({ color: 0x101114, roughness: 0.3, metalness: 0.5, clearcoat: 1 }), 0, 0, 0, O.phone, 0.05); body.rotation.y = -0.3;
    O.phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.148), new THREE.MeshBasicMaterial({ map: T.phoneTex, color: 0x000000, fog: false })); O.phoneScreen.rotation.set(-Math.PI / 2, 0, -0.3); O.phoneScreen.position.y = 0.0045; O.phone.add(O.phoneScreen); }
  // the powder box: a padlocked chest, stencilled
  O.box = grp(POS.box.x, 0, POS.box.z); O.box.userData.keep = true;
  mbox(0.55, 0.5, 0.9, M.plank, 0, 0.25, 0, O.box, 0.5);
  O.boxLid = grp(0.275, 0.5, 0, O.box); mbox(0.58, 0.06, 0.94, M.plank, -0.29, 0.03, 0, O.boxLid, 0.5);
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.32), new THREE.MeshStandardMaterial({ map: T.stencilBox, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 })); sg.position.set(-0.278, 0.26, 0); sg.rotation.y = -Math.PI / 2; O.box.add(sg); }
  O.padlock = grp(-0.285, 0.42, 0, O.box); mbox(0.02, 0.06, 0.05, M.brass, 0, 0, 0, O.padlock, 0.05); { const sh = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI), M.iron); sh.position.y = 0.03; sh.rotation.y = Math.PI / 2; O.padlock.add(sh); }
  solid('box', POS.box.x - 0.3, POS.box.x + 0.3, -0.1, 0.56, POS.box.z - 0.47, POS.box.z + 0.47);
  // the dynamite inside (shown when the lid is up)
  O.boxSticks = grp(0, 0.3, 0, O.box); for (let i = 0; i < 5; i++) { const s = cyl(0.016, 0.016, 0.2, std({ color: 0xc8b890, roughness: 0.8 }), rand(-0.1, 0.1), 0, -0.3 + i * 0.05, O.boxSticks, 8); s.rotation.z = Math.PI / 2; }
  O.boxSticks.visible = false;
  // the carbide drum and the water drum
  O.tinTool = buildTin(POS.tinTool.x, 0, POS.tinTool.z, 1.0, P);
  { const d = cyl(0.27, 0.27, 0.86, M.rust, 9.8, 0.43, 3.3, P, 18); solid('drum', 9.53, 10.07, -0.1, 0.86, 3.03, 3.57); }
  // the drill kit on its nails: the hammer and the steels
  O.kit = grp(POS.kit.x, POS.kit.y, POS.kit.z); O.kit.userData.keep = true; buildKitMesh(O.kit, true);
  for (let i = 0; i < 3; i++) { const s = pole([7.85 + i * 0.12, 0.02, -1.4], [7.95 + i * 0.12, 1.3, -1.52], 0.012, M.iron, P, 6); }
  // helmets, sacks, a wheelbarrow, a rope
  for (const [x, y] of [[8.2, 1.7], [8.55, 1.75]]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, TAU, 0, Math.PI / 2), M.helmet); h.position.set(x, y, -1.5); h.rotation.x = -1.2; h.castShadow = true; P.add(h); }
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), std({ color: 0x8a7a5a, roughness: 1 })); s.scale.set(1, 0.6, 0.8); s.position.set(7.6 + i * 0.5, 0.17, 3.35 + (i % 2) * 0.1); s.castShadow = true; P.add(s); }
  solid('sacks', 7.3, 9.5, -0.1, 0.34, 3.0, 3.8);
  { const wb = grp(8.4, 0, 1.9, P); wb.rotation.y = 0.8; const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.25, 4, 1, true), M.rust); tray.rotation.y = Math.PI / 4; tray.scale.set(1.3, 1, 0.9); tray.position.y = 0.4; wb.add(tray); cyl(0.14, 0.14, 0.05, M.rubber, 0.45, 0.14, 0, wb, 12).rotation.z = Math.PI / 2; pole([0, 0.35, 0.18], [-0.75, 0.55, 0.22], 0.016, M.timber, wb, 6); pole([0, 0.35, -0.18], [-0.75, 0.55, -0.22], 0.016, M.timber, wb, 6); }
  solid('barrow', 8.0, 8.8, -0.1, 0.6, 1.5, 2.3);
  decal(1.4, 0.5, chalk('VIERNES · CH\'ALLA AL TÍO\n|||| |||| |||| ||', '38px "Caveat", cursive', -0.03), TC.x1 - 0.02, 1.5, 1.6, -Math.PI / 2, P, 512);
  /* --- the old drift, boarded up, and the winze --- */
  O.boards = grp(BOARD_X, 0, 5.0); O.boards.userData.keep = true; O.planks = [];
  for (const z of [-0.86, 0.86]) tpost(0, z, 0, 2.0, 0.07, M.timberDark, O.boards);
  for (let i = 0; i < 6; i++) { const pl = mbox(0.04, 0.22, 1.9, M.plank, 0.05, 0.22 + i * 0.3, rand(-0.03, 0.03), O.boards, 0.6); pl.rotation.x = rand(-0.04, 0.04); pl.userData.home = pl.position.clone(); pl.userData.homeR = pl.rotation.clone(); O.planks.push(pl); }
  { const sg = box(0.02, 0.36, 0.9, std({ map: T.peligro, roughness: 0.7 }), 0.09, 1.25, 0.1, O.boards); sg.material.map.center.set(0.5, 0.5); sg.rotation.x = -0.08; O.planks.push(sg); sg.userData.home = sg.position.clone(); sg.userData.homeR = sg.rotation.clone(); }
  O.boardSolid = solid('boards', BOARD_X - 0.05, BOARD_X + 0.12, -0.1, 2.1, OD.z0, OD.z1);
  decal(1.3, 0.46, chalk('CHIMENEA VIEJA\nAIRE MALO ABAJO', '44px "Caveat", cursive', 0.04), GAL.x0 + 0.02, 1.55, 3.45, Math.PI / 2, P, 512);
  // the collar of the winze, the ladder poking up out of it
  const wc = grp(-6.0, 0, 5.0, P);
  for (const [a, b] of [[[-0.66, 0.1, -0.66], [0.66, 0.1, -0.66]], [[-0.66, 0.1, 0.66], [0.66, 0.1, 0.66]], [[-0.66, 0.1, -0.66], [-0.66, 0.1, 0.66]], [[0.66, 0.1, -0.66], [0.66, 0.1, 0.66]]]) pole(a, b, 0.1, M.timberDark, wc, 8);
  O.ladder = grp(-6.0, 0, 5.38); O.ladder.userData.keep = true;
  for (const x of [-0.22, 0.22]) pole([x, L4Y, 0], [x, 1.0, 0.04], 0.03, M.timberDark, O.ladder, 6);
  for (let y = L4Y + 0.25; y < 0.95; y += 0.3) pole([-0.22, y, 0.01], [0.22, y, 0.01], 0.018, M.timberDark, O.ladder, 5);
  { const rp = tube([[0.4, 1.9, -0.6], [0.35, 0.6, -0.55], [0.3, -1.5, -0.5], [0.33, -3.5, -0.48]], 0.012, std({ color: 0x5a4a30, roughness: 1 }), wc, 16, 4); }
  /* --- Level 4 --- */
  const P4 = O.l4;
  // drowned floor: still black water with the lamp in it
  O.water = new THREE.Mesh(new THREE.PlaneGeometry(D4.x1 - BAY.x0 + 0.6, BAY.z1 - BAY.z0 + 0.6), M.water); O.water.rotation.x = -Math.PI / 2; O.water.position.set((D4.x1 + BAY.x0) / 2, L4Y + 0.1, (BAY.z0 + BAY.z1) / 2); O.water.receiveShadow = true; O.water.userData.noRay = true; P4.add(O.water);
  // the valve on the air line at the foot of the winze, and the hose snaking off toward the crawl
  O.valve = grp(POS.valve.x, POS.valve.y, POS.valve.z); O.valve.userData.keep = true;
  cyl(0.035, 0.035, 0.12, M.brass, 0, 0, 0, O.valve, 10).rotation.z = Math.PI / 2;
  O.valveWheel = grp(-0.1, 0, 0, O.valve);
  { const w = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 6, 18), std({ color: 0x8a1a12, roughness: 0.5, metalness: 0.4 })); w.rotation.y = Math.PI / 2; O.valveWheel.add(w); for (let i = 0; i < 3; i++) { const sp = mbox(0.012, 0.15, 0.012, M.iron, 0, 0, 0, O.valveWheel, 0.1); sp.rotation.x = i * Math.PI / 3; } }
  pole([-5.5, L4Y + 1.4, 4.5], [-5.32, POS.valve.y, POS.valve.z], 0.03, M.pipe, P4, 8);
  tube([[POS.valve.x - 0.05, POS.valve.y - 0.05, POS.valve.z], [-5.6, L4Y + 0.16, 5.6], [-7.5, L4Y + 0.08, 5.75], [-10.6, L4Y + 0.08, 5.65], [-12.0, L4Y + 0.1, 4.6], [-12.6, CRAWL_Y + 0.05, 3.2], [-12.5, CRAWL_Y + 0.04, 1.6], [-12.7, CRAWL_Y + 0.04, 0.8], [-13.45, CRAWL_Y + 0.04, 0.6], [-13.4, CRAWL_Y + 0.04, -1.2], [-13.2, CH_Y + 0.05, -2.4]], 0.028, M.rubber, P4, 90, 6);
  O.tinL4 = buildTin(POS.tinL4.x, POS.tinL4.y, POS.tinL4.z, 0.6, P4);
  boulder(0.32, -5.45, L4Y + 0.78, 4.2, P4, M.rock4, 0.5);
  // a wrecked old cart in the bay, half under water
  { const wk = grp(-11.8, L4Y - 0.05, 6.0, P4); wk.rotation.set(0.1, 0.4, 0.25); buildCartMesh(wk, M.rust); }
  solid('wreck', -12.6, -11.0, L4Y - 0.2, L4Y + 0.8, 5.5, 6.5);
  // orange stalactites where the acid water drips
  M.stalOr = std({ color: 0x6a3a14, roughness: 0.35 }); M.stalWh = std({ color: 0x7a7060, roughness: 0.35 });
  for (let i = 0; i < 40; i++) { const x = rand(BAY.x0 + 0.2, D4.x1 - 0.3), z = rand(4.2, 5.8), l = rand(0.04, 0.22); const st = cyl(0.0015, 0.009, l, Math.random() < 0.5 ? M.stalOr : M.stalWh, x, L4Y + D4.h - l / 2 - 0.02, z, P4, 5); st.castShadow = false; }
  // the mouth of the crawl: old Spanish stonework, the stones worn smooth
  for (let i = 0; i < 9; i++) { const a = i / 8; const x = lerp(CWA.x0 - 0.12, CWA.x1 + 0.12, a), y = L4Y + 0.2 + Math.sin(a * Math.PI) * 1.18; boulder(0.12, x, y, BAY.z0 + 0.04, P4, M.rock4, 0.8); }
  /* --- the Spanish chamber --- */
  // candle niches cut in the rock, rivers of old wax; bones; a notched log for a ladder; a leather bag
  for (const [x, z, ry] of [[CH.x0 + 0.02, -3.0, Math.PI / 2], [CH.x1 - 0.02, -2.6, -Math.PI / 2], [-12.4, CH.z0 + 0.02, 0]]) { const n = grp(x, CH_Y + 1.1, z, P4); n.rotation.y = ry; for (let k = 0; k < 4; k++) cyl(0.012, 0.018, 0.04 + k * 0.05, M.wax, rand(-0.05, 0.05), -0.05 - k * 0.04, 0.03, n, 6); }
  { const sk = grp(-14.4, CH_Y + 0.07, -2.2, P4); const cr = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), M.bone); cr.scale.set(0.85, 0.9, 1.1); sk.add(cr); const jw = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.bone); jw.position.set(0, -0.05, 0.05); jw.scale.set(1, 0.6, 1); sk.add(jw); for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M.paintBlack); ey.position.set(s * 0.03, 0.01, 0.075); sk.add(ey); } sk.rotation.set(0.3, 0.8, 0.4); }
  for (let i = 0; i < 9; i++) { const b = cyl(0.012, 0.014, rand(0.15, 0.35), M.bone, rand(-14.8, -13.8), CH_Y + 0.02, rand(-2.6, -1.8), P4, 6); b.rotation.z = Math.PI / 2 + rand(-0.3, 0.3); b.rotation.y = rand(0, TAU); }
  { const lg = pole([-11.95, CH_Y, -3.6], [-11.9, CH_Y + 2.2, -3.9], 0.09, M.timberDark, P4, 8); for (let y = 0.3; y < 2.0; y += 0.38) { const n = mbox(0.08, 0.05, 0.16, M.paintBlack, -11.88, CH_Y + y, -3.62 - y * 0.13, P4, 0.1); } }
  { const lb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), M.leather); lb.scale.set(1, 0.6, 0.8); lb.position.set(-14.5, CH_Y + 0.1, -3.9); lb.castShadow = true; P4.add(lb); }
  solid('bones', -14.9, -13.8, CH_Y - 0.1, CH_Y + 0.12, -2.7, -1.7);
}
// a tin of carbide: a dented drum with a lid set ajar, CARBURO stencilled on it
function buildTin(x, y, z, s, par) {
  const g = grp(x, y, z, par); g.userData.keep = true;
  cyl(0.18 * s, 0.18 * s, 0.4 * s, M.tin, 0, 0.2 * s, 0, g, 16);
  const lid = cyl(0.19 * s, 0.19 * s, 0.03 * s, M.tin, 0.05 * s, 0.41 * s, 0.03 * s, g, 16); lid.rotation.z = 0.12;
  const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 * s), std({ color: 0x6a6a68, roughness: 0.9 })); lump.position.set(-0.05 * s, 0.41 * s, -0.05 * s); g.add(lump);
  const sg = new THREE.Mesh(new THREE.CylinderGeometry(0.182 * s, 0.182 * s, 0.14 * s, 16, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: T.stencilCarb, transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 })); sg.position.y = 0.22 * s; g.add(sg);
  if (s >= 1) solid('tin', x - 0.2, x + 0.2, -0.1, 0.42, z - 0.2, z + 0.2);
  return g;
}
// the sledge and three steels, tied together with wire (on the wall, or in your hands)
function buildKitMesh(g, onWall) {
  const head = mbox(0.16, 0.07, 0.07, M.iron, 0, 0.36, 0, g, 0.1); pole([0, -0.3, 0], [0, 0.33, 0], 0.016, M.timber, g, 6);
  for (let i = 0; i < 2; i++) { const s = pole([0.06 + i * 0.03, -0.32, 0.03], [0.07 + i * 0.03, 0.28, 0.04], 0.011, M.railTop, g, 6); }
  return g;
}
// a mine cart: a steel V-tub on a frame with four small wheels
function buildCartMesh(g, mat = M.rust) {
  const sh = new THREE.Shape(); sh.moveTo(-0.42, 0); sh.lineTo(0.42, 0); sh.lineTo(0.36, -0.5); sh.lineTo(-0.36, -0.5); sh.closePath();
  const tubG = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); tubG.translate(0, 0, -0.6); uvScale(tubG, 1.2, 1.2);
  const tub = mesh(tubG, mat, 0, 0.9, 0, g); tub.userData.tub = true;
  const fill = mesh(new THREE.BoxGeometry(0.78, 0.05, 1.14), std({ color: 0x3a2e26, roughness: 1 }), 0, 0.86, 0, g);
  mbox(0.6, 0.08, 1.1, M.iron, 0, 0.34, 0, g, 0.3);
  for (const zx of [-0.4, 0.4]) for (const s of [-1, 1]) { const w = cyl(0.13, 0.13, 0.05, M.iron, s * 0.3, 0.13, zx, g, 14); w.rotation.z = Math.PI / 2; }
  for (const z of [-0.66, 0.66]) mbox(0.32, 0.1, 0.1, M.timberDark, 0, 0.36, z, g, 0.2);
  return g;
}
/* =====================================================================
   EL TIO · part C: the Tío himself (a clay figure on a stone bench, horned, glass-eyed, grinning,
   who stands up and walks whenever there is no light to see him by), the dead miner in the
   Spanish chamber, the cart and its chock, his face in yours, the sledge in your hands, the lights,
   the electric adit beyond the rockfall, and the mine mouth at dawn for the last picture.
   ===================================================================== */
// a lump of clay: an ellipsoid pushed in and out by noise, the way hands would leave it
function lump(rx, ry, rz, mat, par, x = 0, y = 0, z = 0, amp = 0.12, seg = 18, seed = 0) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.75))), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i), k = 1 + (vnoise(v.x * 2.3 + seed, v.y * 2.3 + v.z * 1.7 + seed * 0.7) - 0.5) * amp * 2 + (vnoise(v.x * 6 + seed, v.z * 6 + v.y * 3) - 0.5) * amp * 0.6; p.setXYZ(i, v.x * rx * k, v.y * ry * k, v.z * rz * k); }
  g.computeVertexNormals(); const m = mesh(g, mat, x, y, z, par); return m;
}
// a limb segment: a tapered, knobbly tube from the joint downward
function limb(len, r0, r1, mat, par, seed = 0) {
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, bulge = Math.sin(t * Math.PI) * 0.18 + (t < 0.15 ? 0.25 * (1 - t / 0.15) : 0); pts.push(new THREE.Vector2(lerp(r0, r1, t) * (1 + bulge * 0.4 + (vnoise(t * 5 + seed, seed) - 0.5) * 0.25), -t * len)); }
  pts.unshift(new THREE.Vector2(0.0001, 0.02)); pts.push(new THREE.Vector2(0.0001, -len - 0.02));
  const g = new THREE.LatheGeometry(pts, 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (vnoise(x * 18 + seed, y * 9 + z * 18) - 0.5) * 0.18; p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals(); return mesh(g, mat, 0, 0, 0, par);
}
// a horn: thick at the skull, ridged, sweeping out, up and back to a point
function hornMesh(par, side) {
  const g = grp(side * 0.1, 0.12, -0.02, par);
  const c = new THREE.CatmullRomCurve3([[0, 0, 0], [side * 0.1, 0.07, -0.02], [side * 0.22, 0.17, -0.07], [side * 0.29, 0.32, -0.16], [side * 0.26, 0.47, -0.28], [side * 0.17, 0.56, -0.4], [side * 0.08, 0.58, -0.5]].map(a => new THREE.Vector3(...a)));
  const n = 14;
  for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, a = c.getPoint(t0), b = c.getPoint(t1), r0 = 0.056 * (1 - t0) + 0.004, r1 = 0.056 * (1 - t1) + 0.003; pole(a.toArray(), b.toArray(), r1, M.horn, g, 10, r0); if (i % 2 === 0 && i < n - 3) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r0 * 0.98, r0 * 0.12, 5, 14), M.horn); ring.position.copy(a); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize()); g.add(ring); } }
  return g;
}
// a hand: a heavy palm and four long jointed fingers with black nails
function handMesh(par, side, open) {
  const h = grp(0, 0, 0, par);
  lump(0.05, 0.03, 0.065, M.clay, h, 0, -0.035, 0.02, 0.15, 12, side * 3);
  for (let i = 0; i < 4; i++) {
    const fx = (i - 1.5) * 0.026, f = grp(fx, -0.045, 0.075, h); f.rotation.x = open ? 0.3 + i * 0.05 : 1.0 + i * 0.06; f.rotation.y = (i - 1.5) * 0.08;
    pole([0, 0, 0], [0, -0.012, 0.075], 0.011, M.clay, f, 6, 0.014);
    const f2 = grp(0, -0.012, 0.075, f); f2.rotation.x = open ? 0.35 : 0.8; pole([0, 0, 0], [0, -0.01, 0.065], 0.008, M.clay, f2, 6, 0.011);
    const nail = mesh(new THREE.ConeGeometry(0.008, 0.04, 5), M.paintBlack, 0, -0.012, 0.085, f2); nail.rotation.x = Math.PI / 2 + 0.5;
  }
  const th = grp(side * 0.045, -0.03, 0.03, h); th.rotation.z = side * 0.7; th.rotation.x = 0.4; pole([0, 0, 0], [side * 0.025, -0.01, 0.065], 0.012, M.clay, th, 6);
  return h;
}
function capsule(r, l, mat, x, y, z, par) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; }

function buildTio() {
  const R = O.tio = grp(); R.userData.keep = true; const J = O.tj = {};
  J.hips = grp(0, 0.98, 0, R);
  lump(0.19, 0.13, 0.15, M.clay, J.hips, 0, -0.02, 0, 0.12, 16, 1);
  J.torso = grp(0, 0.04, 0, J.hips);
  // a gaunt, hunched trunk: a big hard belly, ribs under the clay, bony shoulders
  { const pts = [[0.0001, -0.02], [0.16, 0.0], [0.19, 0.1], [0.2, 0.22], [0.2, 0.34], [0.22, 0.46], [0.2, 0.56], [0.12, 0.63], [0.0001, 0.66]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 20), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), rib = z > 0 && y > 0.3 && y < 0.55 ? Math.sin(y * 70) * 0.008 : 0, k = 1 + (vnoise(x * 9 + 2, y * 9 + z * 9) - 0.5) * 0.16; p.setXYZ(i, x * k * 1.28, y, z * k * 0.86 + rib); }
    g.computeVertexNormals(); const t = mesh(g, M.clay, 0, 0, 0, J.torso); t.rotation.x = 0.1; }
  lump(0.15, 0.12, 0.11, M.clay, J.torso, 0, 0.17, 0.06, 0.1, 16, 5);   // the belly
  for (const s of [-1, 1]) lump(0.07, 0.06, 0.07, M.clay, J.torso, s * 0.24, 0.57, 0.0, 0.2, 10, s * 7);   // shoulder knobs
  J.chest = grp(0, 0.4, 0.1, J.torso);   // what inView looks at
  J.neck = grp(0, 0.6, 0.05, J.torso); J.neck.rotation.x = 0.25;
  lump(0.07, 0.09, 0.07, M.clay, J.neck, 0, 0.04, 0, 0.15, 10, 9);
  J.head = grp(0, 0.14, 0.03, J.neck); J.head.scale.setScalar(1.08);
  { // the skull, long in the face, heavy in the jaw
    const hd = lump(0.16, 0.19, 0.155, M.tioHead, J.head, 0, 0.02, 0, 0.07, 26, 11); O.tioHead = hd;
    lump(0.13, 0.07, 0.11, M.clay, J.head, 0, -0.12, 0.05, 0.12, 14, 13);                       // jaw
    lump(0.125, 0.028, 0.05, M.clayDark, J.head, 0, 0.07, 0.112, 0.2, 14, 15).rotation.x = -0.25;     // brow ridge
    for (const s of [-1, 1]) lump(0.045, 0.035, 0.04, M.clay, J.head, s * 0.085, -0.035, 0.115, 0.2, 10, s * 17);   // cheekbones
    const nose = mesh(new THREE.ConeGeometry(0.032, 0.1, 9), M.clay, 0, 0.0, 0.17, J.head); nose.rotation.x = Math.PI / 2 + 0.55; nose.scale.set(1, 1, 0.7);
    for (const s of [-1, 1]) lump(0.016, 0.012, 0.014, M.paintBlack, J.head, s * 0.018, -0.03, 0.172, 0.1, 6, s);   // nostrils
    // glass eyes, bulging out of the sockets: pale yellow glass, a black pupil, wet
    O.tioEyes = []; O.tioGlints = [];
    for (const s of [-1, 1]) {
      lump(0.05, 0.04, 0.03, M.socket, J.head, s * 0.064, 0.028, 0.118, 0.15, 10, s * 19);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.036, 20, 16), M.eye); e.position.set(s * 0.064, 0.028, 0.13); J.head.add(e); O.tioEyes.push(e);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16), M.iris); iris.position.set(s * 0.064 - s * 0.004, 0.026, 0.1658); iris.rotation.y = -s * 0.1; J.head.add(iris);
      const pup = new THREE.Mesh(new THREE.CircleGeometry(0.008, 12), M.paintBlack); pup.position.set(s * 0.064 - s * 0.004, 0.026, 0.1665); pup.rotation.y = -s * 0.1; J.head.add(pup);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.0365, 20, 16, 0, TAU, 0, Math.PI / 2.4), M.glassEye); lens.position.copy(e.position); lens.rotation.x = Math.PI / 2; J.head.add(lens);
      const gl = new THREE.Sprite(M.eyeGlint.clone()); gl.scale.setScalar(0.05); gl.position.set(s * 0.064, 0.03, 0.19); gl.layers.set(1); gl.userData.noRay = true; J.head.add(gl); O.tioGlints.push(gl);
    }
    // the grin: a wide black cavity, a crooked double row of glass teeth like broken bottle
    lump(0.11, 0.035, 0.05, M.mouth, J.head, 0, -0.095, 0.135, 0.1, 14, 21);
    for (let i = 0; i < 11; i++) { const t = i / 10, x = (t - 0.5) * 0.19, curve = Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.02, l = rand(0.022, 0.04);
      const up = mesh(new THREE.ConeGeometry(rand(0.006, 0.009), l, 4), M.teeth, x, -0.072 + curve - l / 2 + 0.006, 0.168 - curve * 1.4, J.head); up.rotation.set(Math.PI + rand(-0.15, 0.15), rand(0, 1), rand(-0.12, 0.12));
      const l2 = rand(0.018, 0.032), dn = mesh(new THREE.ConeGeometry(rand(0.005, 0.008), l2, 4), M.teeth, x + 0.008, -0.118 + curve + l2 / 2 - 0.004, 0.163 - curve * 1.4, J.head); dn.rotation.set(rand(-0.15, 0.15), rand(0, 1), rand(-0.12, 0.12)); }
    O.tioMouth = grp(0, -0.095, 0.17, J.head);
    // old cigarette ends stuck in the corners of the mouth
    for (const s of [-1, 1]) { const b = cyl(0.0045, 0.0045, 0.022, M.filter, s * 0.085, -0.092, 0.15, J.head, 5); b.rotation.set(Math.PI / 2, 0, s * 0.4); }
    // pointed ears, long horns, a goatee of black wool
    for (const s of [-1, 1]) { const ear = mesh(new THREE.ConeGeometry(0.045, 0.16, 6), M.clay, s * 0.17, 0.05, -0.02, J.head); ear.rotation.z = -s * 1.15; ear.rotation.y = s * 0.3; ear.scale.set(1, 1, 0.35); hornMesh(J.head, s); }
    for (let i = 0; i < 7; i++) { const b = mesh(new THREE.ConeGeometry(0.012, rand(0.14, 0.22), 5), M.beard, rand(-0.03, 0.03), -0.2, 0.1 + rand(-0.01, 0.02), J.head); b.rotation.set(Math.PI - 0.35 + rand(-0.15, 0.15), 0, rand(-0.25, 0.25)); }
  }
  // a black cape over his shoulders, lined with red, hanging to his knees
  { const pts = [[0.2, 0.62], [0.32, 0.55], [0.36, 0.3], [0.4, 0.0], [0.46, -0.35], [0.5, -0.62]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 24, 1.25, TAU - 2.5), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + Math.sin(Math.atan2(x, z) * 9) * 0.04 * clamp(-y + 0.4, 0, 1); p.setX(i, x * f); p.setZ(i, z * f); }
    g.computeVertexNormals(); const cp = new THREE.Mesh(g, M.cape), cl = new THREE.Mesh(g, M.capeLining); cp.scale.set(1.1, 1, 0.85); cl.scale.copy(cp.scale).multiplyScalar(0.985); cp.castShadow = true; J.torso.add(cp); J.torso.add(cl); O.tioCape = cp; }
  // long thin arms with knobbly elbows
  for (const s of [-1, 1]) {
    const sh = J[s < 0 ? 'shL' : 'shR'] = grp(s * 0.27, 0.53, 0.0, J.torso);
    limb(0.33, 0.06, 0.045, M.clay, sh, s * 3);
    const el = J[s < 0 ? 'elL' : 'elR'] = grp(0, -0.34, 0, sh);
    lump(0.045, 0.045, 0.045, M.clay, el, 0, 0, 0, 0.2, 8, s * 5);
    limb(0.31, 0.045, 0.035, M.clay, el, s * 7);
    const wr = J[s < 0 ? 'wrL' : 'wrR'] = grp(0, -0.32, 0, el);
    handMesh(wr, s, s > 0);
  }
  // legs, knobbly knees, clawed feet
  for (const s of [-1, 1]) {
    const hp = J[s < 0 ? 'hipL' : 'hipR'] = grp(s * 0.11, -0.04, 0, J.hips);
    limb(0.46, 0.085, 0.06, M.clay, hp, s * 9);
    const kn = J[s < 0 ? 'knL' : 'knR'] = grp(0, -0.47, 0, hp);
    lump(0.06, 0.06, 0.065, M.clay, kn, 0, 0, 0.02, 0.2, 8, s * 11);
    limb(0.45, 0.06, 0.045, M.clay, kn, s * 13);
    const ft = grp(0, -0.47, 0.03, kn);
    { const f = lump(0.055, 0.035, 0.1, M.tioFeet, ft, 0, 0.0, 0.05, 0.15, 10, s * 15); O.tioFeet = O.tioFeet || []; O.tioFeet.push(f); for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(0.01, 0.055, 5), M.paintBlack, (i - 1) * 0.028, -0.01, 0.155, ft); c.rotation.x = Math.PI / 2 + 0.2; } }
  }
  // paper streamers over his shoulders
  for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(new THREE.Vector3(s * (0.14 + t * 0.2) + rand(-0.03, 0.03), 0.64 - t * 0.6, lerp(0.2, -0.14, t) * (i < 3 ? 1 : -1))); } ribbon(pts, 0.024, M.ribbons[i % M.ribbons.length], J.torso); }
  // what you give him: coca between his teeth, a cigarette, your silver in his palm
  O.tioCoca = grp(0, 0.01, 0.01, O.tioMouth); O.tioCoca.visible = false;
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.06), M.coca); l.position.set(rand(-0.07, 0.07), rand(-0.01, 0.02), rand(-0.005, 0.01)); l.rotation.set(rand(-0.6, 0.6), rand(-0.6, 0.6), rand(0, TAU)); O.tioCoca.add(l); }
  O.tioCig = grp(0.05, 0, 0.0, O.tioMouth); O.tioCig.visible = false; O.tioCig.rotation.set(0.15, 0.5, 0);
  { const c = cyl(0.005, 0.005, 0.07, M.cig, 0, 0, 0.035, O.tioCig, 6); c.rotation.x = Math.PI / 2; const f = cyl(0.0052, 0.0052, 0.018, M.filter, 0, 0, 0.004, O.tioCig, 6); f.rotation.x = Math.PI / 2; O.tioCigStick = c;
    O.tioEmber = new THREE.Sprite(M.ember.clone()); O.tioEmber.scale.setScalar(0.03); O.tioEmber.position.set(0, 0, 0.072); O.tioEmber.layers.set(1); O.tioEmber.userData.noRay = true; O.tioCig.add(O.tioEmber);
    O.tioEmberTip = mesh(new THREE.SphereGeometry(0.0056, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff4010, fog: false }), 0, 0, 0.071, O.tioCig); }
  O.tioSilver = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035), std({ color: 0x8a8a88, roughness: 0.35, metalness: 0.85, envMapIntensity: 1.2 })); O.tioSilver.position.set(0, -0.07, 0.06); O.tioSilver.visible = false; J.wrR.add(O.tioSilver);
  // an invisible box around him for aiming at, and his solid
  O.tioHit = mbox(0.7, 1.75, 0.6, HITMAT, 0, 0.88, 0, R, 1); O.tioHit.layers.set(2); O.tioHit.userData.hit = true;
  O.tioSolid = solid('tio', 0, 0, 0, 0, 0, 0);
  O.tio.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  R.scale.setScalar(1.08);
}

// poses: joint rotations (radians) and the height of his hips
const POSES = {
  seated: { hy: 0.62, lean: 0.1, neck: 0.2, headZ: 0, sh: [-0.75, -0.75], shZ: [0.15, -0.15], el: [-0.9, -1.15], hip: [-1.45, -1.45], kn: [1.4, 1.4], wr: [0.3, 0.6] },
  stand: { hy: 0.98, lean: 0.12, neck: 0.15, headZ: 0.05, sh: [-0.25, -0.15], shZ: [0.12, -0.12], el: [-0.25, -0.35], hip: [0, 0], kn: [0, 0], wr: [0, 0] },
  reach: { hy: 0.96, lean: 0.28, neck: -0.05, headZ: 0.25, sh: [-1.35, -1.2], shZ: [0.05, -0.1], el: [-0.2, -0.35], hip: [-0.15, 0.1], kn: [0.2, 0.05], wr: [0.2, 0.1] },
  lunge: { hy: 0.86, lean: 0.5, neck: -0.3, headZ: -0.35, sh: [-2.3, -1.0], shZ: [0.2, -0.3], el: [-0.15, -0.6], hip: [-0.55, 0.3], kn: [0.7, 0.15], wr: [0.3, 0.2] },
  creep: { hy: 0.74, lean: 0.75, neck: -0.55, headZ: 0.45, sh: [-1.6, -1.75], shZ: [0.3, -0.25], el: [-0.5, -0.3], hip: [-0.9, -0.6], kn: [1.0, 0.8], wr: [0.4, 0.4] },
  peer: { hy: 0.98, lean: 0.7, neck: 0.6, headZ: 0.3, sh: [-0.9, -0.5], shZ: [0.3, -0.2], el: [-0.6, -0.9], hip: [-0.5, -0.5], kn: [0.3, 0.3], wr: [0, 0] },
};
function poseTio(name) {
  const p = POSES[name] || POSES.stand, J = O.tj; V.tioPose = name;
  J.hips.position.y = p.hy; J.torso.rotation.x = p.lean; J.neck.rotation.x = 0.25 + p.neck; J.head.rotation.z = p.headZ;
  J.shL.rotation.set(p.sh[0], 0, p.shZ[0]); J.shR.rotation.set(p.sh[1], 0, p.shZ[1]);
  J.elL.rotation.x = p.el[0]; J.elR.rotation.x = p.el[1]; J.wrL.rotation.x = p.wr[0]; J.wrR.rotation.x = p.wr[1];
  J.hipL.rotation.x = p.hip[0]; J.hipR.rotation.x = p.hip[1]; J.knL.rotation.x = p.kn[0]; J.knR.rotation.x = p.kn[1];
}

/* ---------------- the dead miner in the Spanish chamber ---------------- */
function buildMiner() {
  const g = O.miner = grp(POS.miner.x, POS.miner.y, POS.miner.z); g.userData.keep = true; g.rotation.y = 0.15;
  // sitting against the rock, legs out in front, slumped
  const pel = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), M.clothDark); pel.scale.set(1.2, 0.6, 1); pel.position.set(0, 0.12, 0); g.add(pel);
  const torso = grp(0, 0.14, -0.02, g); torso.rotation.x = -0.32;
  { const t = lathe([[0, 0], [0.15, 0.02], [0.17, 0.2], [0.18, 0.38], [0.12, 0.48], [0, 0.5]], M.clothDark, 0, 0, 0, torso, 16); t.scale.set(1.2, 1, 0.75); }
  O.minerNeck = grp(0, 0.5, 0.03, torso); O.minerNeck.rotation.x = 0.85; O.minerNeck.rotation.z = 0.15;
  cyl(0.04, 0.045, 0.08, M.leather, 0, 0.03, 0, O.minerNeck, 8);
  const head = grp(0, 0.1, 0.03, O.minerNeck); O.minerHead = head;
  { const sk = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 14), M.minerFace); sk.scale.set(0.88, 1.12, 1); head.add(sk); head.scale.setScalar(1.15);
    O.minerJaw = grp(0, -0.05, 0.03, head); const jw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M.leather); jw.scale.set(1, 0.6, 1); jw.position.set(0, -0.03, 0.03); O.minerJaw.add(jw); O.minerJaw.rotation.x = 0.35;
    // the old helmet: hard leather, with the lamp bracket empty at the front
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.118, 14, 8, 0, TAU, 0, Math.PI / 2), M.helmet); hm.position.y = 0.035; hm.scale.set(1, 0.95, 1.12); head.add(hm);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.008, 12, 1, false, -0.9, 1.8), M.helmet); brim.position.set(0, 0.035, 0.1); head.add(brim);
    const brk = mbox(0.03, 0.04, 0.012, M.brass, 0, 0.07, 0.125, head, 0.05); }
  for (const s of [-1, 1]) {
    const arm = grp(s * 0.18, 0.42, 0, torso); arm.rotation.set(-0.3, 0, s * 0.15); capsule(0.045, 0.22, M.clothDark, 0, -0.15, 0, arm);
    const fa = grp(0, -0.3, 0, arm); fa.rotation.x = -1.2; capsule(0.04, 0.2, M.clothDark, 0, -0.12, 0, fa); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M.leather); hd.position.y = -0.27; hd.scale.set(1, 0.6, 1.4); fa.add(hd);
    const lg = grp(s * 0.09, 0.08, 0.05, g); lg.rotation.x = -1.5; lg.rotation.y = s * 0.12; capsule(0.06, 0.3, M.clothDark, 0, -0.21, 0, lg);
    const sh = grp(0, -0.43, 0, lg); sh.rotation.x = 0.1; capsule(0.05, 0.3, M.clothDark, 0, -0.2, 0, sh); const bt = mbox(0.09, 0.08, 0.2, M.rubber, 0, -0.42, 0.05, sh, 0.1);
  }
  // his lamp in his lap; his keys on his belt; a flat bottle by his hand
  O.minerLamp = grp(0.02, 0.22, 0.22, g); cyl(0.035, 0.035, 0.1, M.brass, 0, 0, 0, O.minerLamp, 10); cyl(0.04, 0.035, 0.07, M.brass, 0, 0.08, 0, O.minerLamp, 10); { const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.03, 12, 1, true), M.brass); rf.rotation.x = Math.PI / 2; rf.position.set(0, 0.1, 0.04); O.minerLamp.add(rf); }
  O.minerKeys = grp(0.29, 0.13, 0.1, g);
  { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.003, 5, 14), M.iron); O.minerKeys.add(ring); const k = mbox(0.008, 0.06, 0.012, M.brass, 0.01, -0.045, 0, O.minerKeys, 0.02); const tag = mbox(0.04, 0.025, 0.004, M.brass, -0.012, -0.05, 0.004, O.minerKeys, 0.02); }
  O.minerBottle = grp(-0.32, 0, 0.18, g); { const b = mbox(0.07, 0.15, 0.03, M.glassClear, 0, 0.075, 0, O.minerBottle, 0.02); const lab = mbox(0.072, 0.06, 0.031, M.paper, 0, 0.07, 0, O.minerBottle, 0.02); const cap = cyl(0.01, 0.01, 0.02, M.paintBlack, 0, 0.16, 0, O.minerBottle, 6); }
  solid('miner', POS.miner.x - 0.4, POS.miner.x + 0.4, CH_Y - 0.1, CH_Y + 0.5, POS.miner.z - 0.4, POS.miner.z + 0.85);
  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
}

/* ---------------- the cart and the chock ---------------- */
function buildCart() {
  O.cart = grp(0, 0, POS.cartTop); O.cart.userData.keep = true; buildCartMesh(O.cart, M.rust);
  O.cartSolid = solid('cart', 0, 0, 0, 0, 0, 0);
  O.chock = grp(0.3, 0.12, POS.chock); O.chock.userData.keep = true;
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.22, 0); sh.lineTo(0, 0.12); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }); g.translate(-0.11, 0, -0.05); const m = mesh(g, M.plank, 0, 0, 0, O.chock); m.rotation.y = Math.PI / 2; }
}
function placeCart() {
  const c = V.cart, p = cartPos(c.s, c.route);
  O.cart.position.set(p.x, 0, p.z); O.cart.rotation.set(0, p.yaw, 0);
  if (c.wreck) { O.cart.position.set(-2.35, 0.05, 4.55); O.cart.rotation.set(0.05, -1.25, 0.42); solidSet(O.cartSolid, -2.9, -1.85, -0.1, 0.9, 4.1, 4.95); return; }
  const hw = Math.abs(Math.sin(p.yaw)) * 0.6 + Math.abs(Math.cos(p.yaw)) * 0.38, hd = Math.abs(Math.cos(p.yaw)) * 0.66 + Math.abs(Math.sin(p.yaw)) * 0.38;
  solidSet(O.cartSolid, p.x - hw, p.x + hw, -0.1, 0.95, p.z - hd, p.z + hd);
}
// distance along the track from the cart's place: the main line south, or the branch through the points
const ARC_LEN = Math.PI / 2 * ARC.r;
function cartPos(s, route) {
  const zp = POS.points;
  const mainZ = POS.cartTop + s;
  if (route !== 'branch' || mainZ <= zp) return { x: 0, z: Math.min(mainZ, POS.buffer - 0.66), yaw: 0 };
  const a = s - (zp - POS.cartTop);
  if (a <= ARC_LEN) { const p = branchPt(a / ARC_LEN); return { x: p.x, z: p.z, yaw: -a / ARC.r }; }
  return { x: ARC.cx - (a - ARC_LEN), z: ARC.cz + ARC.r, yaw: -Math.PI / 2 };
}

/* ---------------- his face, right in front of yours ---------------- */
function buildFaceScare() {
  O.face = grp(0, 0, 0); O.face.visible = false; camera.add(O.face);
  const fg = new THREE.PlaneGeometry(0.5, 0.62, 18, 24); const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), y = fp.getY(i); fp.setZ(i, -x * x * 1.8 - y * y * 0.5); }
  fg.computeVertexNormals();
  O.faceMat = new THREE.MeshBasicMaterial({ map: T.scareTex, fog: false, transparent: true });
  O.face.add(new THREE.Mesh(fg, O.faceMat));
  const bk = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, transparent: true })); bk.position.set(0, 0, -0.12); O.face.add(bk);
  O.face.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; if (c.material) { c.material.depthTest = false; c.material.depthWrite = false; c.renderOrder = c === bk ? 20 : 21; } });
}

/* ---------------- in your hands: the sledge and steels ---------------- */
function buildHands() {
  O.kitHand = grp(0, 0, 0); camera.add(O.kitHand); buildKitMesh(O.kitHand, false);
  O.kitHand.scale.setScalar(0.8);
  // a sleeve and a fist round the handle
  { const sl = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.3, 4, 8), std({ color: 0x3a3e4a, roughness: 0.95 })); sl.position.set(0.02, -0.38, 0.1); sl.rotation.x = 0.5; O.kitHand.add(sl); const fist = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), std({ color: 0xa07a62, roughness: 0.6 })); fist.scale.set(1, 0.85, 1.2); fist.position.set(0, -0.12, 0.01); O.kitHand.add(fist); }
  // the flint spark and the carbide flame: lights that live at your helmet
}

/* ---------------- lights ---------------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x606880, 0x100c0a, 0.0); scene.add(L.hemi);
  // the carbide lamp on your helmet: a hard white-gold light thrown forward by its reflector
  L.lamp = new THREE.PointLight(0xffe2b8, 0, 14, 1.3);
  if (!IS_TOUCH) { L.lamp.castShadow = true; L.lamp.shadow.mapSize.set(512, 512); L.lamp.shadow.bias = -0.004; L.lamp.shadow.normalBias = 0.025; L.lamp.shadow.camera.near = 0.06; L.lamp.shadow.camera.far = 13; }
  scene.add(L.lamp);
  L.beam = new THREE.SpotLight(0xffe8c8, 0, 20, 0.5, 0.65, 1.15); scene.add(L.beam); scene.add(L.beam.target);
  L.spark = new THREE.PointLight(0xffd88a, 0, 7, 2); scene.add(L.spark);            // flint sparks, the drill striking, the fuse
  L.ember = new THREE.PointLight(0xff3a12, 0, 1.4, 2); scene.add(L.ember);           // the tip of his cigarette
  L.fuse = new THREE.PointLight(0xffa040, 0, 3.5, 2); scene.add(L.fuse);
  L.breach = new THREE.PointLight(0xcfd6e0, 0, 9, 1.6); L.breach.position.set(0.05, 0.8, FACE_Z - 0.4); scene.add(L.breach);
  L.bulbs = []; for (const z of [-24, -33, -42]) { const b = new THREE.PointLight(0xffd8a0, 0, 10, 1.8); b.position.set(0, 2.05, z); scene.add(b); L.bulbs.push(b); }
  L.phone = new THREE.PointLight(0xb8c8ff, 0, 1.4, 2); L.phone.position.set(POS.bench.x + 0.3, 0.62, POS.bench.z); scene.add(L.phone);
  L.white = new THREE.SpotLight(0xf0f4ff, 0, 30, 0.35, 0.5, 1.4); L.white.position.set(0, 1.7, -44); L.white.target.position.set(0, 1.0, -20); scene.add(L.white); scene.add(L.white.target);
  // sprites: the flame you can't see (it's on your own head) lights the dust; a flash for sparks
  O.sparks = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(M.spark.clone()); s.scale.setScalar(0.03); s.visible = false; s.layers.set(1); s.userData.noRay = true; scene.add(s); O.sparks.push({ s, v: new THREE.Vector3(), t: 0 }); }
  O.fuseSpark = new THREE.Sprite(M.spark.clone()); O.fuseSpark.scale.setScalar(0.12); O.fuseSpark.visible = false; O.fuseSpark.layers.set(1); scene.add(O.fuseSpark);
  // dust hanging in the air after a fall or the blast
  O.dust = []; for (let i = 0; i < (IS_TOUCH ? 14 : 28); i++) { const s = new THREE.Sprite(M.dust.clone()); s.scale.setScalar(rand(1.2, 2.4)); s.layers.set(1); s.userData.noRay = true; s.visible = false; scene.add(s); O.dust.push(s); }
}

/* ---------------- beyond the rockfall: the main adit, lit with electric bulbs ---------------- */
function buildAditProps() {
  const P = O.adit;
  for (let z = -21; z > -45; z -= 2.2) setNS(z, ADIT.x0 + 0.12, ADIT.x1 - 0.12, 0, 2.12, P, M.timber);
  const main = []; for (let z = -20; z > -46; z -= 0.25) main.push({ x: 0, z }); railStrip(main, P);
  // a cable along the roof, a bulb every few metres (the near ones lit), a yellow vent duct
  pole([-0.7, 2.18, -19.8], [-0.7, 2.18, -46], 0.008, M.cable, P, 4);
  for (let z = -21; z > -46; z -= 4.5) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.bulb); b.position.set(-0.7, 2.08, z); b.userData.noRay = true; P.add(b); cyl(0.02, 0.02, 0.06, M.cable, -0.7, 2.14, z, P, 6); }
  { const g = new THREE.CylinderGeometry(0.22, 0.22, 26, 14, 30, true), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), r = 1 + Math.sin(y * 9) * 0.04; p.setX(i, p.getX(i) * r); p.setZ(i, p.getZ(i) * r); } g.computeVertexNormals(); const d = mesh(g, M.duct, 0.75, 1.95, -33, P); d.rotation.x = Math.PI / 2; }
  // a sign, in a hand nothing like the chalk on your side: modern, printed, reflective
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: T.signNew, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 })); sg.position.set(ADIT.x1 - 0.06, 1.55, -23.5); sg.rotation.y = -Math.PI / 2; P.add(sg); }
}

/* ---------------- the mine mouth at dawn (only for the last picture) ---------------- */
function buildMouth() {
  if (O.mouth) return O.mouth;
  const X = 300, g = O.mouth = grp(X, 0, 0); g.visible = false;
  // the hillside: red scree with the dark rectangle of the adit in it, and the sky above the ridge
  const hill = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(40, 9, 120, 40), 40 / 1.3, 9 / 1.3), M.rock); hill.position.set(0, 4.5, -1.2);
  { const p = hill.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), inside = Math.abs(x) < 1.35 && y < -1.8; const ridge = 3.0 + fbm(x * 0.25, 7) * 2.2 - Math.abs(x) * 0.05; let yy = y; if (y > ridge - 4.5) yy = Math.min(y, ridge - 4.5 + (y - (ridge - 4.5)) * 0.15); p.setY(i, yy); p.setZ(i, inside ? -3 : (fbm(x * 0.5, y * 0.5) - 0.5) * 1.2 + (fbm(x * 2.2 + 5, y * 2.2) - 0.5) * 0.35 - Math.max(0, y + 2) * 0.35); } hill.geometry.computeVertexNormals(); const col = new Float32Array(p.count * 3).fill(1); hill.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  g.add(hill); hill.receiveShadow = true;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(90, 14, 60, 10), std({ color: 0x3a2a2a, roughness: 1 })); back.position.set(0, 3, -26); { const p = back.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); if (y > 0) p.setY(i, y * (0.4 + fbm(x * 0.05, 3) * 0.9)); } back.geometry.computeVertexNormals(); } g.add(back);
  const ground = new THREE.Mesh(uvScale(new THREE.PlaneGeometry(40, 30, 40, 30), 20, 15), M.floor); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 12); { const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (fbm(p.getX(i) * 0.3, p.getY(i) * 0.3) - 0.5) * 0.5); ground.geometry.computeVertexNormals(); const col = new Float32Array(p.count * 3).fill(1); ground.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); } g.add(ground); ground.receiveShadow = true;
  const dark = mesh(new THREE.BoxGeometry(2.5, 2.4, 0.2), new THREE.MeshBasicMaterial({ color: 0x000000 }), 0, 1.2, -1.6, g);
  const portal = (a, b, r) => pole(a, b, r, M.timberDark, g, 10);
  portal([-1.3, 0, -1.0], [-1.28, 2.45, -1.0], 0.13); portal([1.3, 0, -1.0], [1.3, 2.45, -1.0], 0.13); portal([-1.6, 2.55, -1.0], [1.6, 2.55, -1.0], 0.15);
  // the blood of the August llama, thrown over the timbers
  for (const [x, y, w, h, rz] of [[0, 2.55, 2.4, 0.5, 0], [-1.3, 1.9, 0.4, 1.0, 0.04], [1.3, 1.7, 0.4, 1.1, -0.03]]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: T.splat, transparent: true, roughness: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); d.position.set(x, y, -0.84); d.rotation.z = rz; g.add(d); }
  // a small wooden cross above it (outside, it's God's)
  pole([0, 2.7, -1.05], [0, 3.4, -1.05], 0.03, M.timberDark, g, 6); pole([-0.2, 3.2, -1.05], [0.2, 3.2, -1.05], 0.03, M.timberDark, g, 6);
  // rails coming out, a dump of waste rock
  const rl = []; for (let z = -1.5; z < 8; z += 0.25) rl.push({ x: 0, z }); railStrip(rl, g);
  for (let i = 0; i < 30; i++) boulder(rand(0.1, 0.4), rand(-6, -2) + (i % 2 ? 8 : 0), rand(0, 0.2), rand(0, 7), g);
  // the posters on the left post: one bleached nearly white, one new and bright
  const poster = (tx, w, h, x, y, rz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: tx, roughness: 0.8, side: THREE.DoubleSide })); m.position.set(x, y, -0.84); m.rotation.z = rz; g.add(m); return m; };
  poster(T.posterOld, 0.42, 0.58, -1.86, 1.5, 0.03); poster(T.posterNew, 0.36, 0.5, -2.32, 1.36, -0.05);
  // in the dark of the mouth: two glass glints and the tip of a cigarette
  for (const s of [-1, 1]) { const e = new THREE.Sprite(M.eyeGlint.clone()); e.material.opacity = 0.9; e.scale.setScalar(0.07); e.position.set(0.28 + s * 0.07, 1.12, -1.45); g.add(e); }
  { const em = new THREE.Sprite(M.ember.clone()); em.scale.setScalar(0.06); em.position.set(0.36, 1.0, -1.44); g.add(em); }
  // the sky, the far peaks of the cordillera, the light
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 24, 12), new THREE.MeshBasicMaterial({ map: T.skyDawn, side: THREE.BackSide, fog: false })); sky.position.set(0, 0, 10); g.add(sky);
  L.sun = new THREE.DirectionalLight(0xffc89a, 0); L.sun.position.set(X + 16, 3.5, 5); L.sun.target.position.set(X, 1, 0); scene.add(L.sun); scene.add(L.sun.target);
  L.skyFill = new THREE.HemisphereLight(0x9ab0d8, 0x5a3a2a, 0); scene.add(L.skyFill);
  return g;
}
/* =====================================================================
   EL TIO · part D: painted things (his face, the dead man's face, the face that fills your eyes,
   the cigarette pack, the slab of black glass, stencils and signs, the posters at the mine mouth,
   the dawn sky), items, what you heard, the little you read, hints, voices
   ===================================================================== */
function paintThings() {
  const T2 = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  // his face, painted on the clay (centred a quarter of the way round, where the sphere faces +z)
  T.tioFace = T2(canv(512, 256, (g, w, h) => {
    const base = g.createLinearGradient(0, 0, 0, h); base.addColorStop(0, '#2a0806'); base.addColorStop(0.5, '#5a1a10'); base.addColorStop(1, '#2a0806'); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '20,6,4' : '200,80,60'},${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const cx = w * 0.25, cy = h * 0.5;
    // black painted brows sweeping up to the horns, black around the eyes
    g.fillStyle = '#0c0606'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 8, cy - 22); g.quadraticCurveTo(cx + s * 30, cy - 40, cx + s * 58, cy - 58); g.lineTo(cx + s * 52, cy - 46); g.quadraticCurveTo(cx + s * 30, cy - 28, cx + s * 10, cy - 14); g.fill(); g.beginPath(); g.ellipse(cx + s * 22, cy - 8, 17, 12, 0, 0, TAU); g.fill(); }
    // white painted lines down the cheeks, a black mouth outline, the chin black
    g.strokeStyle = 'rgba(230,220,200,0.75)'; g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 34, cy + 2); g.quadraticCurveTo(cx + s * 40, cy + 22, cx + s * 30, cy + 40); g.stroke(); }
    g.fillStyle = '#0c0606'; g.beginPath(); g.ellipse(cx, cy + 30, 30, 12, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(10,4,4,0.6)'; g.beginPath(); g.ellipse(cx, cy + 56, 22, 16, 0, 0, TAU); g.fill();
    // cracks, soot, the shine of handling
    g.strokeStyle = 'rgba(10,4,2,0.7)'; g.lineWidth = 1; for (let i = 0; i < 30; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-12, 12); y += rand(-12, 12); g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 12; i++) blot(g, Math.random() * w, Math.random() * h * 0.4, 20 + Math.random() * 30, 0.3, '10,4,2');
  }));
  // the dead miner: skin dried to leather over the bones, the eyes long gone, the lips drawn back
  T.minerFace = T2(canv(256, 128, (g, w, h) => {
    g.fillStyle = '#3c3228'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '14,10,8' : '120,110,96'},${Math.random() * 0.28})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const cx = w * 0.25, cy = h * 0.52;
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * 11, cy - 6, 1, cx + s * 11, cy - 6, 11); gr.addColorStop(0, '#000'); gr.addColorStop(0.7, '#120a06'); gr.addColorStop(1, 'rgba(30,20,12,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx + s * 11, cy - 6, 11, 0, TAU); g.fill(); }
    g.fillStyle = '#0a0604'; g.beginPath(); g.moveTo(cx - 3, cy + 2); g.lineTo(cx + 3, cy + 2); g.lineTo(cx, cy + 9); g.fill();
    g.fillStyle = '#0a0604'; g.fillRect(cx - 11, cy + 14, 22, 8); g.fillStyle = '#b8a888'; for (let i = 0; i < 7; i++) { g.fillRect(cx - 10 + i * 3, cy + 14, 2, 3); g.fillRect(cx - 10 + i * 3, cy + 19, 2, 3); }
    g.strokeStyle = 'rgba(15,8,4,0.6)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.moveTo(cx - 22 + Math.random() * 44, cy - 20 + Math.random() * 44); g.lineTo(cx - 22 + Math.random() * 44, cy - 20 + Math.random() * 44); g.stroke(); }
  }));
  // the face that fills your eyes when he has you: the clay a hand's breadth away, glass eyes with your own flame in them
  T.scareTex = T2(canv(512, 640, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.47;
    // horns, rising off the top of the frame
    for (const s of [-1, 1]) { const hg = g.createLinearGradient(cx + s * 60, cy - 170, cx + s * 230, cy - 330); hg.addColorStop(0, '#1a1210'); hg.addColorStop(1, '#050303'); g.fillStyle = hg; g.beginPath(); g.moveTo(cx + s * 50, cy - 175); g.bezierCurveTo(cx + s * 170, cy - 220, cx + s * 250, cy - 280, cx + s * 220, cy - 340); g.lineTo(cx + s * 180, cy - 340); g.bezierCurveTo(cx + s * 200, cy - 280, cx + s * 140, cy - 220, cx + s * 20, cy - 195); g.fill(); }
    // the clay of the face, lit from just above your eyes
    const sk = g.createRadialGradient(cx, cy - 60, 20, cx, cy + 20, 300); sk.addColorStop(0, '#6a2016'); sk.addColorStop(0.3, '#43120a'); sk.addColorStop(0.65, '#1c0604'); sk.addColorStop(1, '#000');
    g.fillStyle = sk; g.beginPath(); g.moveTo(cx - 190, cy - 160); g.bezierCurveTo(cx - 240, cy, cx - 200, cy + 200, cx - 90, cy + 290); g.lineTo(cx + 90, cy + 290); g.bezierCurveTo(cx + 200, cy + 200, cx + 240, cy, cx + 190, cy - 160); g.bezierCurveTo(cx + 120, cy - 230, cx - 120, cy - 230, cx - 190, cy - 160); g.fill();
    // lumps and thumb-marks in the clay, soot in the cracks
    for (let i = 0; i < 70; i++) { const x = cx + rand(-170, 170), y = cy + rand(-180, 240); blot(g, x, y, rand(6, 26), rand(0.08, 0.22), Math.random() < 0.5 ? '10,2,0' : '150,60,40'); }
    g.strokeStyle = 'rgba(8,2,0,0.75)'; for (let i = 0; i < 46; i++) { g.lineWidth = rand(0.6, 2.2); let x = cx + rand(-170, 170), y = cy + rand(-190, 240); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += rand(-16, 16); y += rand(-14, 14); g.lineTo(x, y); } g.stroke(); }
    // the brow: a heavy ridge throwing the sockets into shadow; painted black brows sweeping up to the horns
    const br = g.createLinearGradient(0, cy - 140, 0, cy - 40); br.addColorStop(0, 'rgba(0,0,0,0)'); br.addColorStop(0.55, 'rgba(0,0,0,0.0)'); br.addColorStop(1, 'rgba(0,0,0,0.75)'); g.fillStyle = br; g.fillRect(cx - 200, cy - 140, 400, 100);
    g.fillStyle = 'rgba(4,1,1,0.85)'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 14, cy - 92); g.bezierCurveTo(cx + s * 70, cy - 120, cx + s * 130, cy - 150, cx + s * 185, cy - 190); g.lineTo(cx + s * 175, cy - 160); g.bezierCurveTo(cx + s * 120, cy - 120, cx + s * 70, cy - 98, cx + s * 22, cy - 76); g.fill(); }
    // glass eyes, bulging and wet; your flame burning in each one
    for (const s of [-1, 1]) {
      const ex = cx + s * 76, ey = cy - 30;
      const so = g.createRadialGradient(ex, ey, 30, ex, ey, 92); so.addColorStop(0, 'rgba(0,0,0,0.95)'); so.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = so; g.beginPath(); g.arc(ex, ey, 92, 0, TAU); g.fill();
      const eg = g.createRadialGradient(ex - s * 12, ey - 14, 6, ex, ey, 46); eg.addColorStop(0, '#6a4a20'); eg.addColorStop(0.5, '#2a1806'); eg.addColorStop(1, '#080402'); g.fillStyle = eg; g.beginPath(); g.ellipse(ex, ey, 44, 41, 0, 0, TAU); g.fill();
      const ir = g.createRadialGradient(ex + s * 4, ey + 2, 2, ex + s * 4, ey + 2, 22); ir.addColorStop(0, '#000'); ir.addColorStop(0.6, '#050200'); ir.addColorStop(1, 'rgba(20,10,4,0)'); g.fillStyle = ir; g.beginPath(); g.arc(ex + s * 4, ey + 2, 25, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,248,220,0.97)'; g.beginPath(); g.moveTo(ex - s * 18, ey - 36); g.quadraticCurveTo(ex - s * 9, ey - 22, ex - s * 15, ey - 14); g.quadraticCurveTo(ex - s * 23, ey - 22, ex - s * 18, ey - 36); g.fill();
      const fl = g.createRadialGradient(ex - s * 16, ey - 22, 2, ex - s * 16, ey - 22, 22); fl.addColorStop(0, 'rgba(255,210,120,0.6)'); fl.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = fl; g.beginPath(); g.arc(ex - s * 16, ey - 22, 22, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,240,210,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(ex, ey, 40, Math.PI * 0.15, Math.PI * 0.55); g.stroke();
      g.strokeStyle = 'rgba(120,10,6,0.5)'; g.lineWidth = 1; for (let k = 0; k < 9; k++) { const a = rand(0, TAU); g.beginPath(); g.moveTo(ex + Math.cos(a) * 52, ey + Math.sin(a) * 48); g.lineTo(ex + Math.cos(a) * rand(34, 44), ey + Math.sin(a) * rand(30, 40)); g.stroke(); }
    }
    // the nose: a hooked beak, the nostrils black
    const ng = g.createLinearGradient(cx - 30, cy, cx + 30, cy + 60); ng.addColorStop(0, '#7a2416'); ng.addColorStop(1, '#2a0806'); g.fillStyle = ng; g.beginPath(); g.moveTo(cx - 6, cy - 50); g.bezierCurveTo(cx + 34, cy - 10, cx + 40, cy + 40, cx + 6, cy + 62); g.bezierCurveTo(cx - 34, cy + 52, cx - 26, cy - 10, cx - 6, cy - 50); g.fill();
    g.fillStyle = '#000'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 16, cy + 58, 11, 6, s * 0.3, 0, TAU); g.fill(); }
    // the grin, far too wide: black inside, crooked teeth of broken glass, cigarette ends in the corners
    g.fillStyle = '#020000'; g.beginPath(); g.moveTo(cx - 165, cy + 92); g.bezierCurveTo(cx - 80, cy + 120, cx + 80, cy + 120, cx + 165, cy + 92); g.bezierCurveTo(cx + 100, cy + 205, cx - 100, cy + 205, cx - 165, cy + 92); g.fill();
    for (let i = 0; i < 15; i++) { const t = i / 14, x = cx - 150 + t * 300, top = cy + 96 + Math.sin(t * Math.PI) * 22, bot = cy + 150 + Math.sin(t * Math.PI) * 40, wd = rand(9, 15), l1 = rand(18, 40), l2 = rand(14, 32);
      for (const [y0, l, dir] of [[top, l1, 1], [bot, l2, -1]]) { const tg = g.createLinearGradient(x, y0, x, y0 + dir * l); tg.addColorStop(0, 'rgba(200,200,190,0.95)'); tg.addColorStop(0.6, 'rgba(240,238,228,0.9)'); tg.addColorStop(1, 'rgba(160,170,170,0.7)'); g.fillStyle = tg; g.beginPath(); g.moveTo(x - wd / 2, y0); g.lineTo(x + wd / 2, y0 + rand(-3, 3)); g.lineTo(x + rand(-4, 4), y0 + dir * l); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - wd / 4, y0 + dir * 2); g.lineTo(x, y0 + dir * l * 0.8); g.stroke(); } }
    for (const s of [-1, 1]) { g.save(); g.translate(cx + s * 150, cy + 104); g.rotate(s * 0.5); g.fillStyle = '#c8945a'; g.fillRect(-16, -6, 32, 12); g.fillStyle = '#222'; g.fillRect(s > 0 ? 12 : -16, -6, 4, 12); g.restore(); }
    // a goatee of black wool off the bottom
    g.strokeStyle = 'rgba(4,3,3,0.9)'; for (let i = 0; i < 70; i++) { g.lineWidth = rand(1, 3); const x = cx + rand(-50, 50); g.beginPath(); g.moveTo(x, cy + 210); g.quadraticCurveTo(x + rand(-20, 20), cy + 280, cx + rand(-26, 26), h + 10); g.stroke(); }
    // the lamp's light falling off, grain, a vignette
    const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i += 4) { const px = (i / 4) % w, py = Math.floor(i / 4 / w), r = Math.hypot((px - cx) / w, (py - cy) / h), v = clamp(1.25 - r * 1.6, 0, 1), n = (Math.random() - 0.5) * 26; d.data[i] = clamp(d.data[i] * v + n, 0, 255); d.data[i + 1] = clamp(d.data[i + 1] * v + n, 0, 255); d.data[i + 2] = clamp(d.data[i + 2] * v + n, 0, 255); } g.putImageData(d, 0, 0);
  }));
  // a pack of Cóndor cigarettes
  T.cigPack = T2(canv(64, 96, (g, w, h) => { g.fillStyle = '#f0ece0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8261c'; g.fillRect(0, 0, w, 34); g.fillStyle = '#f0ece0'; g.font = '700 13px "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('CÓNDOR', w / 2, 22); g.fillStyle = '#222'; g.beginPath(); g.moveTo(14, 60); g.quadraticCurveTo(32, 46, 50, 60); g.quadraticCurveTo(32, 54, 14, 60); g.fill(); g.font = '8px "Oswald", sans-serif'; g.fillText('20 CIGARRILLOS', w / 2, 86); }));
  // somebody's thing: a slab of black glass that lights up when you touch it
  T.phoneTex = T2(canv(144, 312, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a4a7a'); bg.addColorStop(0.55, '#c88a5a'); bg.addColorStop(1, '#3a2a22'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // a llama in a paper party hat, the photo they keep on it
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(72, 236, 34, 22, 0, 0, TAU); g.fill(); g.fillRect(84, 170, 16, 60); g.beginPath(); g.ellipse(94, 166, 14, 11, 0.2, 0, TAU); g.fill(); g.fillRect(48, 250, 7, 40); g.fillRect(90, 250, 7, 40);
    g.fillStyle = '#e83a6a'; g.beginPath(); g.moveTo(86, 158); g.lineTo(102, 158); g.lineTo(96, 130); g.fill(); g.fillStyle = '#ffe040'; g.beginPath(); g.arc(96, 129, 3, 0, TAU); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(98, 163, 2, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '300 50px "Oswald", sans-serif'; g.fillText('03:12', w / 2, 74); g.font = '13px "Oswald", sans-serif'; g.fillText('sábado, 1 de agosto', w / 2, 96);
    g.font = '9px "Oswald", sans-serif'; g.textAlign = 'left'; g.fillText('Sin servicio', 8, 14); g.textAlign = 'right'; g.fillText('6%', w - 8, 14);
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(w / 2 - 22, h - 10, 44, 3);
  }));
  // stencils and signs
  const stencil = (txt, color, w, h, size, sub) => canv(w, h, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = color; g.font = `400 ${size}px "Saira Stencil One", "Oswald", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, sub ? H * 0.4 : H / 2); if (sub) { g.font = `400 ${size * 0.45}px "Saira Stencil One", "Oswald", sans-serif`; g.fillText(sub, W / 2, H * 0.8); } g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.7})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1 + Math.random() * 2); } g.globalCompositeOperation = 'source-over'; });
  T.stencilBox = T2(stencil('EXPLOSIVOS', 'rgba(170,30,20,0.9)', 320, 128, 54, 'PELIGRO'));
  T.stencilCarb = T2(stencil('CARBURO', 'rgba(20,18,16,0.85)', 320, 64, 40));
  T.peligro = T2(canv(256, 104, (g, w, h) => { g.fillStyle = '#d8c070'; g.fillRect(0, 0, w, h); for (let i = -2; i < 14; i++) { g.fillStyle = i % 2 ? '#1a1a1a' : '#d8c070'; g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20 + 10, 0); g.lineTo(i * 20 - 10, 14); g.lineTo(i * 20 - 20, 14); g.fill(); } g.fillStyle = '#a81e14'; g.font = '400 40px "Saira Stencil One", "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('PELIGRO', w / 2, 56); g.fillStyle = '#1a1a1a'; g.font = '400 22px "Saira Stencil One", "Oswald", sans-serif'; g.fillText('NO ENTRAR', w / 2, 86); speckle(g, w, h, 1400, 0.35, '40,30,20', 2); }));
  T.signNew = T2(canv(256, 128, (g, w, h) => { g.fillStyle = '#1e7a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0f0f0'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#f4f4f4'; g.font = '700 40px "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('SALIDA', w / 2 - 24, 60); g.beginPath(); g.moveTo(w - 56, 62); g.lineTo(w - 36, 30); g.lineTo(w - 16, 62); g.fill(); g.fillRect(w - 42, 60, 12, 26); g.font = '500 15px "Oswald", sans-serif'; g.fillText('USE CASCO Y LÁMPARA', w / 2, 104); }));
  // the posters at the mine mouth: one bleached by the sun nearly white, one new and loud
  T.posterOld = T2(canv(256, 352, (g, w, h) => {
    g.fillStyle = '#ece6da'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(200,120,110,0.55)'; g.font = '700 34px "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('DESAPARECIDO', w / 2, 44);
    g.fillStyle = 'rgba(120,110,100,0.18)'; g.fillRect(48, 60, 160, 150);
    // the passport photo: a young face, smiling, almost gone
    g.fillStyle = 'rgba(110,90,76,0.28)'; g.beginPath(); g.ellipse(128, 120, 30, 38, 0, 0, TAU); g.fill(); g.fillRect(84, 160, 88, 50); g.fillStyle = 'rgba(60,46,36,0.28)'; g.beginPath(); g.ellipse(128, 92, 32, 16, 0, Math.PI, TAU); g.fill();
    g.fillStyle = 'rgba(40,32,28,0.25)'; g.fillRect(114, 116, 6, 3); g.fillRect(136, 116, 6, 3); g.fillRect(118, 136, 20, 2);
    g.fillStyle = 'rgba(80,70,64,0.42)'; g.font = '15px "Oswald", sans-serif'; ['Turista extranjero, 24 años', 'Visto por última vez en la mina', 'Santa Rita, Cerro Rico', 'viernes 31 de julio de 1998', '', 'Cualquier información:', 'Tours Mina Viva · Calle Bustillos'].forEach((t, i) => g.fillText(t, w / 2, 238 + i * 16));
    // sun, damp, a torn corner, staples
    for (let i = 0; i < 18; i++) blot(g, Math.random() * w, Math.random() * h, 20 + Math.random() * 50, 0.12, '180,160,120');
    g.fillStyle = '#5a4a3a'; g.beginPath(); g.moveTo(w, h); g.lineTo(w - 46, h); g.lineTo(w, h - 30); g.fill();
    g.fillStyle = '#888'; for (const [x, y] of [[10, 8], [w - 14, 8], [10, h - 12]]) g.fillRect(x, y, 6, 2);
  }));
  T.posterNew = T2(canv(240, 336, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#ff2a8a'); bg.addColorStop(1, '#ffb020'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a0a3a'; g.font = '700 30px "Oswald", sans-serif'; g.textAlign = 'center'; g.fillText('GRAN CH\'ALLA', w / 2, 46); g.fillText('AL TÍO', w / 2, 80);
    g.fillStyle = '#fff'; g.font = '700 54px "Oswald", sans-serif'; g.fillText('AGOSTO', w / 2, 150); g.fillStyle = '#1a0a3a'; g.font = '700 64px "Oswald", sans-serif'; g.fillText('2026', w / 2, 214);
    g.fillStyle = '#fff'; g.font = '16px "Oswald", sans-serif'; g.fillText('ORQUESTA · CHICHA · K\'ARAKU', w / 2, 252); g.fillText('Coop. Minera Santa Rita', w / 2, 276);
    g.fillStyle = '#1a0a3a'; g.fillRect(70, 292, 100, 22); g.fillStyle = '#ffe040'; g.font = '700 14px "Oswald", sans-serif'; g.fillText('¡NO FALTES!', w / 2, 308);
  }));
  // dark blood flung over timber, dried
  T.splat = T2(canv(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const x = rand(10, w - 10), y = rand(10, h * 0.7), r = rand(2, 11); g.fillStyle = `rgba(${26 + rand(0, 16)},4,2,${rand(0.55, 0.9)})`; g.beginPath(); g.ellipse(x, y, r * 0.7, r * rand(0.5, 1.0), rand(0, 3), 0, TAU); g.fill(); if (Math.random() < 0.6) { g.fillRect(x - r * 0.2, y, r * 0.4, rand(10, 60)); } } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(30,4,2,${rand(0.3, 0.8)})`; g.fillRect(rand(0, w), rand(0, h * 0.8), 1.5, 1.5); } }));
  // the sky at dawn over the cordillera, four thousand metres up
  T.skyDawn = T2(canv(1024, 512, (g, w, h) => {
    const sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#0e1a3a'); sk.addColorStop(0.42, '#3a5a8a'); sk.addColorStop(0.56, '#e8a070'); sk.addColorStop(0.62, '#ffd8a0'); sk.addColorStop(1, '#5a3a2a'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2230'; g.beginPath(); g.moveTo(0, h * 0.64); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * 0.6 - fbm(x * 0.006, 2) * 70 - (Math.abs(((x / w) * 3) % 1 - 0.5) < 0.06 ? 30 : 0)); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = 'rgba(240,240,250,0.5)'; for (let x = 0; x < w; x += 8) { const y = h * 0.6 - fbm(x * 0.006, 2) * 70; if (y < h * 0.52) g.fillRect(x, y, 8, 3); }
  }));
}

/* ---------------- items ---------------- */
const ITEMS = {
  silver: { name: 'A lump of silver ore', short: 'Silver', desc: 'Heavy for its size, grey, glittering where it broke. You took it from the offerings at the Tío\'s feet while Don Teo had his back turned. A souvenir. Everyone was laughing; nobody saw.' },
  card: { name: 'Don Teo\'s card', short: 'Card', doc: 'card' },
  coca: { name: 'A bag of coca leaves', short: 'Coca', desc: 'Dry green leaves in a plastic bag. You bought them at the market for the altitude; Don Teo said the Tío likes them too.' },
  cigs: { name: 'Cigarettes', short: 'Cigarettes', desc: 'A pack of Cóndor, three left. The miners light them for the Tío and put them between his teeth. They say that while he smokes, he\'s content.' },
  alcohol: { name: 'A bottle of alcohol', short: 'Alcohol', desc: 'Alcohol potable, 96 per cent, still sealed. The miners pour a little on the ground for the Pachamama and the rest over the Tío\'s feet.' },
  key: { name: 'The powder-box key', short: 'Key', desc: 'A brass key on an iron ring. A brass tag on it, stamped POLVORÍN.' },
  dynamite: { name: 'A stick of dynamite', short: 'Dynamite', desc: 'One stick with its fuse already in it, the way the miners make them up. It needs a hole in the rock.' },
  kit: { name: 'Sledge and drill steel', short: 'Sledge', desc: 'A short four-pound hammer and a steel drill rod. Strike the steel, turn it a little, strike again.', held: true },
};
/* ---------------- what you heard (the notebook keeps it) ---------------- */
const HEARD = {
  rules: { title: 'Don Teo, this afternoon', text: '"Inside the mountain, everything belongs to the Tío. Don\'t take anything. And if you take something, you have to pay. And never let your lamp go out. In the dark, the Tío walks."' },
  teo: { title: 'Don Teo, through the rockfall', text: '"Gringo! Gringo! Can you hear me? Hold on! We\'ll get you out!" Then the mountain moved again, and nothing.' },
  miners: { title: 'Two men, through a crack in the rock', text: '"This is the place. This is where the gringo disappeared." "The one in the story? When was that?" "Ninety-eight. My dad was on that shift. They dug for a week. Never found a thing." "They say the Tío kept him."' },
  tio: { title: 'Close to your ear, in the dark', text: '"That\'s mine."' },
};
/* ---------------- what you read (a little) ---------------- */
const DOCS = {
  card: { title: 'Don Teo\'s card', style: 'tiocard', pages: () => [cardPage()] },
  tasks: { title: 'What it will take', style: 'tiotask', pages: () => [taskSheet()] },
};
function cardPage() {
  return `<div class="tc-head"><b>TOURS MINA VIVA</b><span>Potosí &middot; Cerro Rico &middot; 4,200 m</span></div>
    <p class="tc-guide">Your guide: <b>Don Teo</b>, ex-miner, 22 years in the mountain</p>
    <h4>Rules of the mine</h4><ol class="tc-rules">
    <li>Stay with your guide.</li>
    <li>Keep your lamp lit at all times. <span class="tc-pen">en lo oscuro camina el Tío</span></li>
    <li>Take nothing from the mountain. Everything inside it belongs to the Tío.</li>
    <li>Greet the Tío: coca for his mouth, a cigarette for his lips, alcohol for his feet.</li>
    <li>If the miners shout <b>¡FUEGO!</b>, get into a refuge niche (REFUGIO) until the blast.</li></ol>
    <p class="tc-fine">Helmet, lamp and boots included. Buy gifts for the miners at the market: coca, cigarettes, alcohol, dynamite.</p>`;
}
function taskSheet() {
  const p = S.paid || {}, f = S.flags, ck = on => on ? '<span class="ck on">&#10003;</span>' : '<span class="ck"></span>';
  return `<h3>To get out</h3><p class="sub3">On the back of Don Teo's card, in your own biro</p>
    <p class="tt-h">Pay the Tío</p><ul class="tkl">
    <li>${ck(p.coca)} coca for his mouth</li><li>${ck(p.cig)} a lit cigarette</li><li>${ck(p.alc)} alcohol for his feet</li><li>${ck(p.silver)} his silver back</li></ul>
    <p class="tt-h">Open the rockfall</p><ul class="tkl">
    <li>${ck((S.drill || 0) >= 8)} drill a hole in the rock</li><li>${ck(f.charged)} a stick of dynamite in it</li><li>${ck(f.blasted)} light it, get into the REFUGIO</li></ul>
    <p class="tkn">Keep the lamp lit. In the dark, he walks.</p>`;
}

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'Light your lamp', when: s => s.flags.lit ? 'solved' : 'active', tiers: [
    'It\'s pitch dark. Your carbide lamp is on the front of your helmet.', 'There\'s a flint wheel on the lamp. Strike it.', 'It can take two or three strikes before the gas catches.', 'Press E (or tap Strike) until the flame catches.'] },
  { id: 'tio', title: 'The empty chair', when: s => !s.flags.lit ? 'hidden' : s.flags.tioKnown ? 'solved' : 'active', tiers: [
    'The Tío\'s chair in the niche across from you is empty. Coca leaves are scattered from it along the rails.', 'Follow the coca leaves south along the rails, keeping your lamp lit.', 'Don Teo\'s card (Tab): in the dark, the Tío walks.', 'Follow the trail of coca leaves south along the rails until you find him.'] },
  { id: 'lamp', title: 'Your lamp is dying', when: s => !s.flags.lowSeen ? 'hidden' : (s.fuel > 0.5 ? 'solved' : 'active'), tiers: [
    'The flame shrinks as the carbide in your lamp is used up. When it\'s gone, the light goes.', 'There\'s a tin of carbide in the refuge niche, one in the tool chamber, and one at the foot of the ladder on Level 4.', 'Refilling means opening the lamp: it goes dark for a moment. Do it while he\'s far away.', 'Stand at a carbide tin and press E to refill the lamp, then strike the flint to relight it.'] },
  { id: 'pay', title: 'Pay the Tío', when: s => !s.flags.tioKnown ? 'hidden' : s.flags.paid ? 'solved' : 'active', tiers: [
    'Don Teo\'s card: coca for his mouth, a cigarette for his lips, alcohol for his feet. And what you took from him.', 'The coca is the bag he dropped. Cigarettes: on the miners\' bench in the tool chamber. The silver is in your pocket.', 'The bottle in your gift bag smashed in the fall. Miners carry their own: somebody down on Level 4 still has his.', 'Stand close to him with your lamp lit and give him the coca, a lit cigarette, the alcohol and your silver. The alcohol is on the dead miner at the end of the crawl on Level 4.'] },
  { id: 'boards', title: 'The boarded-up drift', when: s => !s.flags.boardsSeen ? 'hidden' : s.flags.boardsBroken ? 'solved' : 'active', tiers: [
    'Thick planks are spiked across the old drift. Something heavy has to hit them hard.', 'There\'s an ore cart on the main line. A wooden chock holds it, and the line runs downhill to the south.', 'The points lever on the line, near the old drift, decides which way the cart goes.', 'Throw the points lever toward the old drift, then kick the chock out from under the cart.'] },
  { id: 'crawl', title: 'He\'s in the way', when: s => !s.flags.blocked ? 'hidden' : s.flags.pastHim ? 'solved' : 'active', tiers: [
    'He\'s standing in the mouth of the crawl, and there\'s no way past him.', 'He won\'t move while your lamp is lit.', 'In the dark he walks, toward you. Let him come out of the passage to you.', `Put your lamp out (${'F'}), count two, then strike it back on (E). He'll have stepped out of the crawl. Go round him.`] },
  { id: 'air', title: 'Bad air', when: s => !s.flags.badAir ? 'hidden' : s.flags.valve ? 'solved' : 'active', tiers: [
    'In the crawl your flame shrinks and you can\'t get your breath. There\'s no air back there.', 'The chalk by the old drift said so: AIRE MALO ABAJO, bad air below.', 'A black hose runs from the foot of the ladder along the floor and into the crawl.', 'Open the red valve on the air line at the foot of the ladder, then go back in.'] },
  { id: 'key', title: 'The powder box', when: s => !s.flags.boxSeen ? 'hidden' : s.flags.boxOpen ? 'solved' : 'active', tiers: [
    'The powder box in the tool chamber is padlocked.', 'Whoever had the key is still in the mine.', 'Someone sits at the end of the Spanish crawl on Level 4. He\'s been there a long time.', 'Take the key from the belt of the dead miner in the chamber at the end of the crawl, and unlock the box.'] },
  { id: 'drill', title: 'Drilling the rockfall', when: s => !(s.flags.boxOpen || s.flags.kitSeen) ? 'hidden' : (s.drill || 0) >= 8 ? 'solved' : 'active', tiers: [
    'Dynamite needs a hole to sit in, and the rockfall is solid.', 'The sledgehammer and the drill steels hang on the wall in the tool chamber.', 'Carry them to the big boulder in the middle of the rockfall.', 'Strike the steel (E), turn it (R), strike, turn, until the hole is deep enough.'] },
  { id: 'blast', title: 'Fire in the hole', when: s => (s.drill || 0) < 8 ? 'hidden' : s.flags.blasted ? 'solved' : 'active', tiers: [
    'Push the stick of dynamite into the hole.', 'The blast will put your light out. If the Tío is still walking then, he\'ll be on you. Pay him first.', 'Light the fuse from your lamp, then get into the refuge niche before it goes.', 'Charge the hole, pay the Tío, light the fuse, and get into the REFUGIO niche on the east wall.'] },
  { id: 'out', title: 'The way out', when: s => !s.flags.blasted ? 'hidden' : s.flags.escaped ? 'solved' : 'active', tiers: [
    'The blast has opened a hole through the rockfall.', 'Strike your lamp back on.', 'Crouch to get through the hole.', 'Crawl through the hole and walk up the tunnel beyond.'] },
];

/* ---------------- voices ---------------- */
function line(id, who, text, opts = {}) { return say(who, text, Object.assign({ clip: 'ti_' + id }, opts)); }
const TEO = 'Don Teo', TIO = 'The Tío';
const look = (txt, ms = 5600) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5600) => subtitle('', `<i>${txt}</i>`, ms);
const took = id => S.inv.includes(id);
function heard(id) { if (!S.heard.includes(id)) { S.heard.push(id); save(); } }
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }
/* =====================================================================
   EL TIO · part E: the lamp (fuel, the flint, the dark), the Tío (frozen in any light, walking in
   none), offerings, the cart and the points, the ladder, Level 4 (the crawl he stands in, the bad
   air, the valve, the dead man), the voices in the rock, the powder box, drilling, the fuse, the
   blast, the way out; sound, the director, saving
   ===================================================================== */
const FUEL_SECS = 330;
const NEAR = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const onL4 = () => BODY.y < -2;
const inBox = (b, pad = 0) => P.x > b.x0 - pad && P.x < b.x1 + pad && P.z > b.z0 - pad && P.z < b.z1 + pad;
const inRefuge = () => !onL4() && P.x > REF.x0 + 0.08 && inBox(REF);
const inCrawlOrChamber = () => onL4() && (inBox(CWA) || inBox(CWC) || inBox(CH));
const inWater = () => onL4() && BODY.y < L4Y + 0.06 && (inBox(D4) || inBox(BAY));
const camF = () => new THREE.Vector3(-Math.sin(G.yaw), 0, -Math.cos(G.yaw));

/* ---------------- sound ---------------- */
function sFlint() {
  if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 3200, 0.9), g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  n.connect(bp); bp.connect(g); route(g, { wet: 0.25 }); n.start(t, Math.random()); n.stop(t + 0.1); sClick(null, 0.35, 5200);
  for (let i = 0; i < 4; i++) after(0.01 + Math.random() * 0.08, () => sClick(null, 0.12, 6000 + Math.random() * 3000));
}
function sPop() { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false, true), lp = filt('lowpass', 500, 0.8), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); n.connect(lp); lp.connect(g); route(g, { wet: 0.3 }); n.start(t, Math.random()); n.stop(t + 0.4); }
function sPuff() { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 900, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); n.connect(bp); bp.connect(g); route(g, { wet: 0.2 }); n.start(t, Math.random()); n.stop(t + 0.3); }
// his feet: dead weight of clay on rock, and the bottles and charms on him knocking together
function sClay(pos, vol = 0.5) {
  if (!A.ready) return; sThunk(pos, vol * 0.9, 70 + Math.random() * 20); sScrape(pos, 0.35, vol * 0.28);
  if (Math.random() < 0.6) after(0.05 + Math.random() * 0.1, () => sClink(pos, vol * 0.5));
}
function sClink(pos, vol = 0.2) { if (!A.ready) return; const ctx = A.ctx, t = now(); [1, 2].forEach(k => { const o = ctx.createOscillator(); o.frequency.value = 2600 + Math.random() * 1800; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + k * 0.03); g.gain.exponentialRampToValueAtTime(vol, t + k * 0.03 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.03 + 0.25); o.connect(g); route(g, { pos, wet: 0.45 }); o.start(t + k * 0.03); o.stop(t + k * 0.03 + 0.3); }); }
function sDrip(pos, vol = 0.08) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(1500 + Math.random() * 900, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.06); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); route(g, { pos, wet: 0.7 }); o.start(t); o.stop(t + 0.1); }
function sBoom(vol = 0.5, far = true) {
  if (!A.ready) return; const ctx = A.ctx, t = now(), dur = far ? 3.5 : 5, n = noiseSrc(false, true), lp = filt('lowpass', far ? 160 : 600, 0.7), g = ctx.createGain();
  lp.frequency.setValueAtTime(far ? 220 : 1800, t); lp.frequency.exponentialRampToValueAtTime(70, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(lp); lp.connect(g); route(g, { wet: 0.6 }); n.start(t, Math.random()); n.stop(t + dur + 0.1);
  if (!far) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(24, t + 1.5); const og = ctx.createGain(); og.gain.setValueAtTime(vol * 1.2, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 2); o.connect(og); route(og, { wet: 0.3 }); o.start(t); o.stop(t + 2.1); }
}
function sPebbles(pos, n = 10) { for (let i = 0; i < n; i++) after(Math.random() * 1.4 + i * 0.03, () => { sClick(pos.clone().add(new THREE.Vector3(rand(-0.5, 0.5), rand(-0.3, 0.3), rand(-0.5, 0.5))), rand(0.08, 0.2), rand(1800, 4200)); }); }
function sClang(pos) { if (!A.ready) return; const ctx = A.ctx, t = now(); [1, 2.76, 5.4, 8.9].forEach((m, i) => { const o = ctx.createOscillator(); o.frequency.value = 620 * m * (1 + Math.random() * 0.01); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime([0.5, 0.25, 0.12, 0.06][i], t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + [0.7, 0.4, 0.25, 0.15][i]); o.connect(g); route(g, { pos, wet: 0.55 }); o.start(t); o.stop(t + 0.8); }); sKnock(pos, 0.8, 0, 0); }
function sRing(dur = 7) { if (!A.ready) return; const ctx = A.ctx, t = now(), o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 6100; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); route(g, { wet: 0 }); o.start(t); o.stop(t + dur + 0.1); }
function sSplash(vol = 0.18) { if (!A.ready) return; const ctx = A.ctx, t = now(), n = noiseSrc(false), bp = filt('bandpass', 1400, 0.8), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); n.connect(bp); bp.connect(g); route(g, { wet: 0.4 }); n.start(t, Math.random()); n.stop(t + 0.25); }
// a laugh with no voice in it: breath pushed out in four low huffs, close to your ear
function sChuckle(pos, vol = 0.5) { if (!A.ready) return; const ctx = A.ctx; let t = now(); for (let i = 0; i < 4; i++) { const n = noiseSrc(false), bp = filt('bandpass', 520 - i * 40, 3), bp2 = filt('bandpass', 1150 - i * 60, 4), g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * (1 - i * 0.15), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); n.connect(bp); n.connect(bp2); bp.connect(g); bp2.connect(g); route(g, { pos, wet: 0.35, ref: 0.4 }); n.start(t, Math.random()); n.stop(t + 0.2); t += 0.21 + Math.random() * 0.04; } }
function sCrash(pos) { sBoom(0.6, false); for (let i = 0; i < 10; i++) after(i * 0.05 + Math.random() * 0.1, () => sKnock(pos, rand(0.5, 1.2), 0, 0)); for (let i = 0; i < 6; i++) after(Math.random() * 0.5, () => sClick(pos, 0.4, rand(800, 2400))); sClang(pos); }
function sLadder(vol = 0.25) { sCreak(camera.position, 0.35, vol * 0.4, 110); sKnock(camera.position, vol * 0.5, 0, 1); }

/* ---------------- the lamp ---------------- */
function lampLit() { return S.lamp === 1; }
function lampOut(why, quiet) {
  if (S.lamp !== 1) return;
  S.lamp = 0; V.darkT = 0; V.strikeN = 0; V.lampK = 0; V.quick = why === 'valve'; V.forceStrikes = why === 'first' ? 3 : why === 'l4' ? 2 : 0;
  sPuff(); updatePrompt(true); save();
  if (!quiet && why === 'drip') sayI('A drop of water from the roof lands on your flame. Hsss. Dark.', 3800);
  if (!quiet && why === 'empty') { sayI('The flame shrinks to a blue bead, and goes out. No carbide left in the lamp.', 5000); }
  if (!quiet && why === 'gust') sayI('A gust of cold air from the old drift, and your flame is gone.', 3800);
}
function strike() {
  if (S.lamp === 1 || V.refill > 0 || G.time < (V.strikeCD || 0) || V.catching) return;
  if (V.noStrike) { if (G.time - (V.toldShake || 0) > 2) { V.toldShake = G.time; sayI('Your hands are shaking too hard to work the wheel. Listen.', 2400); } return; }
  if (S.fuel <= 0.002) { toast('The lamp is out of carbide. You need a tin of it.', 3000); return; }
  V.strikeCD = G.time + 0.36; V.strikeN = (V.strikeN || 0) + 1;
  sFlint(); V.sparkT = 0.09; sparkBurst(helmetPos(), 6);
  if (V.airT > 1.2 && !S.flags.valve) { if (V.strikeN === 1 || V.strikeN % 4 === 0) sayI('The spark won\'t take. There\'s no air.', 2500); return; }
  const need = V.forceStrikes || 0;
  const p = V.quick ? 1 : [0.34, 0.62, 1][Math.min(2, V.strikeN - 1)];
  if (V.strikeN >= need && (Math.random() < p || V.strikeN >= 3)) relight();
}
function relight() {
  S.lamp = 1; V.lampK = 0.15; V.relitT = 0; V.forceStrikes = 0; V.quick = false; sPop(); save();
  if (!S.flags.lit) { flag('lit'); onFirstLight(); }
  afterRelight();
}
function onFirstLight() {
  after(1.0, async () => {
    for (let i = 0; i < 40 && !V.memDone; i++) await wait(400);
    sKnocks(POS.face.clone().add(new THREE.Vector3(0, 0, -1.6)), 4, 0.42, 0.9, 1); await wait(1600);
    const o = { fx: 'muffled', pos: POS.face.clone().add(new THREE.Vector3(0, 0.4, -1.8)), volume: 1.7 };
    await line('teo1', TEO + ', through the rock', 'Gringo! Gringo! Can you hear me?', o);
    await line('teo2', TEO + ', through the rock', 'Hold on! We\'ll get you out!', o);
    await wait(1400);
    sBoom(0.55, false); G.shake = 0.9; sPebbles(POS.face.clone().add(new THREE.Vector3(0, 1, 0.5)), 26); dustBurst(POS.face.clone().add(new THREE.Vector3(0, 1, 1)), 6); if (lampLit()) V.flicker = 0.2;
    after(1.8, () => line('teo3', TEO + ', further off', 'Gringo!', { fx: 'muffled', pos: POS.face.clone().add(new THREE.Vector3(0, 0.4, -8)), volume: 0.7 }));
    after(4.2, () => { sayI('Then the rock settles, and his voice is gone. No digging. Nothing.', 5000); heard('teo'); });
  });
}
function helmetPos() { const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); return camera.position.clone().addScaledVector(f, 0.22).add(new THREE.Vector3(0, 0.1, 0)); }
function sparkBurst(at, n) { let k = 0; for (const s of O.sparks) { if (k >= n) break; if (s.t > 0) continue; s.t = rand(0.15, 0.35); s.s.visible = true; s.s.position.copy(at); s.v.set(rand(-1, 1), rand(0, 1.4), rand(-1, 1)); k++; } }
function lampUpdate(dt) {
  const lit = lampLit();
  if (lit) {
    S.fuel = Math.max(0, S.fuel - dt / FUEL_SECS * (V.airT > 0 ? 2 : 1));
    if (S.fuel < 0.25 && !S.flags.lowSeen) { flag('lowSeen'); toast('Your flame is shrinking: the carbide in the lamp is running out. There\'s a tin of it in the refuge niche, and one in the tool chamber.', 8000); }
    if (S.fuel <= 0) lampOut('empty');
  }
  V.sparkT = Math.max(0, (V.sparkT || 0) - dt);
  V.flicker = Math.max(0, (V.flicker || 0) - dt);
  V.relitT = (V.relitT || 0) + dt; if (!lit) V.darkT = (V.darkT || 0) + dt;
  const fuelK = clamp(S.fuel / 0.22, 0, 1), sput = S.fuel < 0.1 ? (Math.random() < 0.08 ? 0.3 : 1) : 1, air = V.airT > 0 && !S.flags.valve ? clamp(1 - V.airT / 4.5, 0.05, 1) : 1;
  const fl = 0.93 + Math.sin(G.time * 17) * 0.025 + Math.sin(G.time * 41.3) * 0.02 + (Math.random() - 0.5) * 0.03;
  const tgt = lit ? (IS_TOUCH ? 4.6 : 4.0) * (0.32 + 0.68 * fuelK) * sput * air * fl * (V.flicker > 0 ? 0.04 : 1) : 0;
  V.lampK = lit ? lerp(V.lampK || 0, tgt, Math.min(1, dt * 12)) : 0;
  L.lamp.intensity = V.lampK; L.lamp.distance = 6 + 8 * fuelK * air;
  L.lamp.position.copy(helmetPos());
  { const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); L.beam.position.copy(L.lamp.position); L.beam.target.position.copy(L.lamp.position).addScaledVector(f, 5); L.beam.target.updateMatrixWorld(); L.beam.intensity = V.lampK * 1.5; L.beam.distance = 8 + 12 * fuelK * air; }
  if (L.lamp.castShadow && lit) renderer.shadowMap.needsUpdate = true;
  L.spark.intensity = V.sparkT > 0 ? 2.2 * (V.sparkT / 0.09) : 0; if (V.sparkT > 0) L.spark.position.copy(helmetPos());
  for (const s of O.sparks) { if (s.t <= 0) continue; s.t -= dt; s.v.y -= 6 * dt; s.s.position.addScaledVector(s.v, dt); s.s.material.opacity = clamp(s.t * 4, 0, 1); if (s.t <= 0) s.s.visible = false; }
  if (A.loops.hiss) setGain(A.loops.hiss, lit ? 0.012 * (0.5 + fuelK * 0.5) : 0, 0.05);
  // a refill: the lamp open, in the dark
  if (V.refill > 0) { V.refill -= dt; if (V.refill <= 0) { S.fuel = 1; save(); sClick(null, 0.3, 1400); toast(`Full. ${G.touch ? 'Tap Strike' : 'Strike the flint (<kbd>E</kbd>)'}.`, 2600); updatePrompt(true); } }
}
const isDark = () => !lampLit() && !(V.sparkT > 0) || V.flicker > 0;
function refillAt(id) {
  if (V.refill > 0) return;
  if (id === 'minerLamp') flag('minerCarb');
  if (lampLit()) lampOut('refill', true);
  V.refill = 1.5; sScrape(camera.position, 0.6, 0.15);
  sayI('You unscrew the bottom of the lamp in the dark, knock out the spent grey paste, and pack in fresh carbide by feel.', 3600);
}

/* ---------------- the Tío: still in the light, walking in the dark ---------------- */
// the tunnels he walks, as a graph of points
const NODES = {
  g0: [0, 0, -16.2], g1: [0, 0, -12.6], g2: [0, 0, -9.0], r0: [1.55, 0, -9.0], g3: [0, 0, -5.0], n0: [-1.55, 0, -5.0], g4: [0, 0, -1.6], g5: [0, 0, 1.1],
  t0: [3.0, 0, 1.1], t1: [6.2, 0, 1.1], k0: [8.4, 0, 1.1], k1: [10.2, 0, 1.8], k2: [8.4, 0, -0.6], g6: [0, 0, 5.0], g7: [0, 0, 6.9],
  o0: [-2.6, 0, 5.4], o1: [-4.6, 0, 5.3], w3: [-6.0, 0, 4.6], w4: [-6.0, L4Y, 4.7], d1: [-8.5, L4Y, 5.0], d2: [-11.0, L4Y, 5.0], b0: [-12.55, L4Y, 4.4],
  c0: [-12.55, CRAWL_Y, 2.6], c1: [-12.55, CRAWL_Y, 0.8], c2: [-13.45, CRAWL_Y, 0.8], c3: [-13.45, CRAWL_Y, -1.2], h0: [-13.3, CH_Y, -2.7],
};
const EDGES = [['g0', 'g1'], ['g1', 'g2'], ['g2', 'r0'], ['g2', 'g3'], ['g3', 'n0'], ['g3', 'g4'], ['g4', 'g5'], ['g5', 't0'], ['t0', 't1'], ['t1', 'k0'], ['k0', 'k1'], ['k0', 'k2'], ['g5', 'g6'], ['g6', 'g7'],
  ['g6', 'o0', 'boards'], ['o0', 'o1'], ['o1', 'w3'], ['w3', 'w4'], ['w4', 'd1'], ['d1', 'd2'], ['d2', 'b0'], ['b0', 'c0'], ['c0', 'c1'], ['c1', 'c2'], ['c2', 'c3'], ['c3', 'h0']];
const NV = {}; for (const k in NODES) NV[k] = new THREE.Vector3(...NODES[k]);
function nodeNear(p) { let best = null, bd = 1e9; for (const k in NV) { const v = NV[k]; if (Math.abs(v.y - p.y) > 1.5) continue; const d = Math.hypot(v.x - p.x, v.z - p.z); if (d < bd) { bd = d; best = k; } } return best; }
function pathTo(from, to) {
  const ok = e => !e[2] || (e[2] === 'boards' && S.flags.boardsBroken);
  const dist = { [from]: 0 }, prev = {}, Q = new Set(Object.keys(NV));
  while (Q.size) { let u = null; for (const q of Q) if (dist[q] !== undefined && (u === null || dist[q] < dist[u])) u = q; if (u === null || u === to) break; Q.delete(u);
    for (const e of EDGES) { if (!ok(e)) continue; const v = e[0] === u ? e[1] : e[1] === u ? e[0] : null; if (!v || !Q.has(v)) continue; const d = dist[u] + NV[u].distanceTo(NV[v]); if (dist[v] === undefined || d < dist[v]) { dist[v] = d; prev[v] = u; } } }
  if (dist[to] === undefined) return null;
  const p = [to]; while (p[0] !== from) p.unshift(prev[p[0]]); return p;
}
function tioSpeed() { const paidN = Object.keys(S.paid || {}).filter(k => S.paid[k]).length; return clamp(1.3 + progress() * 0.05 - paidN * 0.08, 1.0, 1.75); }
function tioActive() { return S.flags.tioKnown && !S.flags.paid && !V.tioHold && !V.catching && !(S.smokeT > 0) && V.tioState !== 'scripted'; }
function tioFace(target) { const t = V.tio; t.yaw = Math.atan2(target.x - t.pos.x, target.z - t.pos.z); }
function placeTio() {
  const t = V.tio; O.tio.position.copy(t.pos); O.tio.rotation.set(0, t.yaw, 0);
  if (lampLit() || V.sparkT > 0 || S.flags.paid) { const r = 0.3; solidSet(O.tioSolid, t.pos.x - r, t.pos.x + r, t.pos.y, t.pos.y + 1.6, t.pos.z - r, t.pos.z + r); O.tioSolid.on = !S.flags.paid; }
  else O.tioSolid.on = false;
}
function setTio(x, y, z, yaw, pose, node) { const t = V.tio; t.pos.set(x, y, z); if (yaw !== undefined) t.yaw = yaw; if (pose) poseTio(pose); t.node = node || nodeNear(t.pos); saveTio(); placeTio(); }
function saveTio() { const t = V.tio; S.tio = { x: t.pos.x, y: t.pos.y, z: t.pos.z, yaw: t.yaw, pose: V.tioPose, node: t.node }; }
function tioUpdate(dt) {
  const t = V.tio; if (!t) return;
  const dark = isDark();
  // the cigarette: while it burns, he smokes, and doesn't move
  if (S.smokeT > 0) { S.smokeT = Math.max(0, S.smokeT - dt); const draw = (Math.sin(G.time * 1.3) + 1) * 0.5, k = Math.pow(draw, 6);
    O.tioEmber.material.opacity = 0.55 + k * 0.45; O.tioEmber.scale.setScalar(0.03 + k * 0.03); L.ember.intensity = 0.25 + k * 0.9; O.tioMouth.getWorldPosition(L.ember.position); L.ember.position.y += 0.02;
    O.tioCigStick.scale.y = 0.35 + 0.65 * (S.smokeT / 60); if (k > 0.95 && !V.drawn) { V.drawn = true; sClick(L.ember.position, 0.05, 2600); } if (k < 0.5) V.drawn = false;
    if (S.smokeT <= 0 && !S.flags.paid) { O.tioCig.visible = false; L.ember.intensity = 0; } }
  else if (!S.flags.paid) L.ember.intensity = 0;
  if (S.flags.paid) { const k = Math.pow((Math.sin(G.time * 0.9) + 1) * 0.5, 8); O.tioEmber.material.opacity = 0.6 + k * 0.4; L.ember.intensity = 0.3 + k * 1.0; O.tioMouth.getWorldPosition(L.ember.position); }
  // glass eyes: a faint glint of nothing in the dark
  const gl = dark && !S.flags.paid && S.flags.tioKnown ? 0.22 + Math.random() * 0.08 : (S.flags.paid && !lampLit() ? 0.12 : 0);
  O.tioGlints.forEach(g => g.material.opacity = gl);
  // waiting where he was put, until you've seen him there
  if (V.tioHold && lampLit()) { O.tio.updateMatrixWorld(true); if (inView(O.tj.chest, 0.9)) V.tioHold = false; }
  // walking: only in the dark, only toward you
  if (dark && tioActive()) {
    const me = new THREE.Vector3(P.x, BODY.y, P.z);
    if (!V.tioMoving) { V.tioMoving = true; const d = NEAR(t.pos, me); poseTio(d < 3 ? pick(['lunge', 'reach', 'creep']) : pick(['stand', 'reach', 'creep'])); }
    const myNode = nodeNear(me); let target = me;
    const sameLevel = Math.abs(t.pos.y - me.y) < 1.2, close = sameLevel && NEAR(t.pos, me) < 2.6;
    if (!close) { const path = pathTo(t.node, myNode); if (path && path.length > 1) target = NV[path[1]]; else if (path) target = me; }
    const dx = target.x - t.pos.x, dy = target.y - t.pos.y, dz = target.z - t.pos.z, dl = Math.hypot(dx, dz, dy * 0.6);
    const sp = tioSpeed() * dt;
    if (dl > 0.001) { const k = Math.min(1, sp / dl); t.pos.x += dx * k; t.pos.z += dz * k; t.pos.y += dy * k; }
    if (target !== me && Math.hypot(target.x - t.pos.x, target.z - t.pos.z) < 0.12 && Math.abs(target.y - t.pos.y) < 0.12) { t.node = Object.keys(NV).find(k => NV[k] === target) || t.node; }
    if (close) t.node = myNode;
    tioFace(me);
    V.tioStep = (V.tioStep || 0) + sp; if (V.tioStep > 0.6) { V.tioStep = 0; sClay(t.pos.clone().setY(t.pos.y + 0.2), clamp(0.7 - NEAR(t.pos, me) * 0.04, 0.12, 0.7)); }
    // he has you
    if (sameLevel && NEAR(t.pos, me) < 0.78 && !lampLit()) caught('tio');
    saveTio(); placeTio();
  } else if (V.tioMoving) { V.tioMoving = false; saveTio(); placeTio(); }
}
// the moment the light comes back: where is he now?
function afterRelight() {
  const t = V.tio; if (!t || !S.flags.tioKnown || S.flags.paid) return;
  placeTio();
  const me = new THREE.Vector3(P.x, BODY.y, P.z), d = NEAR(t.pos, me), same = Math.abs(t.pos.y - me.y) < 1.2;
  O.tio.updateMatrixWorld(true);
  if (same && d < 2.2) {
    if (inView(O.tj.chest, 0.9)) { sStinger(d < 1.3 ? 1.1 : 0.7); G.fearT = Math.max(G.fearT || 0, 0.9); G.shake = 0.5; sHeart(4, 0.5, 0.5); }
    else { sBreath(camera.position.clone().sub(camF().multiplyScalar(0.4)), 1, 0.35, true); after(0.4, () => sayI('Something breathes against the back of your neck.', 3200)); G.fearT = Math.max(G.fearT || 0, 0.7); }
  } else if (same && d < 5 && inView(O.tj.chest, 0.9)) { G.fearT = Math.max(G.fearT || 0, 0.5); sHeart(3, 0.35, 0.6); }
}

/* ---------------- caught ---------------- */
function showFace(dur) {
  O.face.visible = true; O.face.position.set(0.0, -0.02, -0.34); O.face.rotation.set(0, 0, -0.05);
  tween(dur, k => { O.face.position.z = lerp(-0.34, -0.24, k); O.face.rotation.z = -0.05 + k * 0.06; O.faceMat.color.setScalar(Math.random() < 0.2 ? 0.3 : lerp(0.65, 1, k)); }, () => { O.face.visible = false; O.faceMat.color.setScalar(1); }, k => k);
}
function caught(why) {
  if (V.catching || G.mode !== 'play') return;
  V.catching = { why, t: 0 }; G.cutscene = true; releasePointer(); if (UI.kind) UI.close(true); if (DRAG.cur) dragEnd(true);
  if (V.ladder) { V.ladder = null; O.ladderSolid.on = false; }
  S.wrong++; save();
  const wasL4 = onL4();
  if (why === 'tio') { showFace(0.6); sStinger(1.25); sChuckle(camera.position.clone().add(camF().multiplyScalar(0.25)), 0.7); G.shake = 1.8; G.fearT = 1; G.red = 0.6; after(0.6, () => { V.black = 2.6; }); after(1.4, () => sayI('Clay hands close over your face. They\'re warm.', 3600)); }
  else if (why === 'air') { V.black = 3; sHeart(6, 0.6, 0.45); sayI('There\'s no air. Your knees go. The dark folds over you.', 4200); }
  else if (why === 'cart') { G.shake = 2; G.flash = 0.5; sKnock(camera.position, 1.6, 0, 0); V.black = 2.6; sayI('The cart comes out of the dark and hits you like a wall.', 4000); }
  else if (why === 'blast') { V.black = 3; sayI('The blast picks you up and throws you down the tunnel.', 4000); }
  after(3.0, () => respawn(wasL4));
}
function respawn(wasL4) {
  const why = V.catching ? V.catching.why : '';
  V.catching = null; O.face.visible = false; V.airT = 0;
  if (wasL4 && why !== 'blast') { bodyPlace(-6.45, L4Y, 5.05, Math.PI / 2, false); }
  else bodyPlace(POS.refuge.x, 0, POS.refuge.z, Math.PI / 2, false);
  G.pitch = -0.05;
  S.lamp = 1; S.fuel = Math.max(S.fuel, 0.6); V.lampK = 0.3; V.refill = 0;
  // he goes back where he can't reach you straight away
  if (!S.flags.paid && S.flags.tioKnown) {
    if (S.flags.blocked && !S.flags.pastHim) stageCrawlMouth();
    else if (wasL4) setTio(NV.g7.x, 0, NV.g7.z, Math.PI, 'stand', 'g7');
    else { const far = ['k1', 'g7', 'g0'].sort((a, b) => NV[b].distanceTo(new THREE.Vector3(P.x, 0, P.z)) - NV[a].distanceTo(new THREE.Vector3(P.x, 0, P.z)))[0]; setTio(NV[far].x, NV[far].y, NV[far].z, 0, 'stand', far); }
  }
  G.cutscene = false; V.black = 0.8; G.blackT = 0; save(); updatePrompt(true);
  after(0.8, () => sayI(why === 'tio' ? 'You come to with your lamp burning beside you, as if someone lit it and left.' : 'You come to. Somebody has lit your lamp.', 4500));
}

/* ---------------- offerings ---------------- */
function offerActions() {
  const p = S.paid, a = [];
  if (took('coca') && !p.coca) a.push({ label: 'Put coca in his mouth', run: () => offer('coca') });
  if (took('cigs') && S.cigsLeft > 0 && !(S.smokeT > 0)) a.push({ label: 'Light a cigarette for him', run: () => offer('cig') });
  if (took('alcohol') && !p.alc) a.push({ label: 'Pour the alcohol on his feet', run: () => offer('alc') });
  if (took('silver') && !p.silver) a.push({ label: 'Give him back the silver', run: () => offer('silver') });
  return a;
}
function offer(k) {
  const p = S.paid;
  if (k === 'coca') { p.coca = true; drop('coca'); O.tioCoca.visible = true; sScrape(O.tio.position.clone().setY(1.6), 0.5, 0.12); sayI('You push a fistful of leaves between the glass teeth. They stay there.', 4000); }
  if (k === 'cig') { p.cig = true; S.cigsLeft--; if (S.cigsLeft <= 0) drop('cigs'); S.smokeT = 60; O.tioCig.visible = true; O.tioCigStick.scale.y = 1; sClick(null, 0.2, 1800); sayI('You light it at your lamp, draw on it once, and set it in the grinning mouth. The tip glows brighter, all by itself.', 5200); renderInv(); if (!S.ev.toldSmoke) { S.ev.toldSmoke = true; after(5.5, () => toast('While he smokes, he doesn\'t move, even in the dark.', 5500)); } }
  if (k === 'alc') { p.alc = true; drop('alcohol'); O.tioFeet.forEach(f => f.material = M.tioFeetWet); sSplash(0.2); sayI('A few drops on the rock for the Pachamama, the way Don Teo did it. The rest over his clay feet.', 5000); }
  if (k === 'silver') { p.silver = true; drop('silver'); O.tioSilver.visible = true; poseTio(V.tioPose); sThunk(O.tio.position.clone().setY(0.9), 0.3, 260); sayI('You put the lump of silver in his open palm.', 3500); }
  save(); renderInv(); updatePrompt(true);
  if (p.coca && p.cig && p.alc && p.silver) after(2.5, paidSequence);
}
function paidSequence() {
  if (S.flags.paid) return;
  V.tioState = 'scripted'; lampOut('paid', true); V.noStrike = true;
  sayI('Your flame shrinks to a blue bead, and goes out on its own.', 3600);
  const from = V.tio.pos.clone();
  for (let i = 0; i < 7; i++) after(0.6 + i * 0.55, () => sClay(from.clone().lerp(POS.seat, i / 6).setY(0.2), 0.4));
  after(4.6, () => { sChuckle(POS.seat.clone().setY(1.3), 0.45); });
  after(5.4, () => { line('gracias', TIO, 'Thank you, gringo.', { fx: 'whisper', pos: POS.seat.clone().setY(1.4), volume: 1.2 }); });
  after(6.0, () => {
    flag('paid'); V.tioState = null; V.noStrike = false; setTio(POS.seat.x, 0, POS.seat.z, Math.PI / 2, 'seated', 'n0');
    O.tioCig.visible = true; O.tioCigStick.scale.y = 1; O.tioSilver.visible = true; O.tioCoca.visible = true;
    toast(`Strike your lamp back on${G.touch ? '' : ' (<kbd>E</kbd>)'}.`, 4000);
    V.paidLook = true;
  });
}

/* ---------------- the cart, the points, the boards ---------------- */
function kickChock() {
  if (V.cartRun || S.cart !== 'top') return;
  V.cartRun = { s: 0, v: 0.2, route: S.points }; S.cart = 'rolling';
  tween(0.5, k => { O.chock.position.set(0.3 + k * 0.9, 0.12 + Math.sin(k * Math.PI) * 0.3, POS.chock + k * 0.4); O.chock.rotation.z = k * 3; });
  sKnock(O.chock.position, 0.6, 0, 0); sCreak(O.cart.position, 0.8, 0.25, 70);
  sayI('You kick the chock out. The cart creaks, and starts to roll.', 3000);
}
function cartUpdate(dt) {
  const c = V.cartRun; if (!c) return;
  c.v = Math.min(4.2, c.v + 1.05 * dt); c.s += c.v * dt;
  V.cart.s = c.s; V.cart.route = c.route; placeCart();
  if (A.loops.cart) { setGain(A.loops.cart, clamp(c.v / 4, 0, 1) * 0.35, 0.05); setPannerPos(A.loops.cart.panner, O.cart.position.clone().setY(0.4)); }
  V.clack = (V.clack || 0) + c.v * dt; if (V.clack > 1.2) { V.clack = 0; sKnock(O.cart.position.clone().setY(0.2), 0.25 + c.v * 0.06, 0, 1); }
  // the cart hits anyone in its way
  if (!onL4() && circleHits(O.cartSolid, P.x, P.z, BODY.r * 0.8) && !V.catching) { stopCart(); caught('cart'); S.cart = 'bottom'; V.cart.s = POS.buffer - 0.66 - POS.cartTop; V.cart.route = 'main'; placeCart(); return; }
  const p = cartPos(c.s, c.route);
  if (c.route === 'main' && p.z >= POS.buffer - 0.67) { stopCart(); S.cart = 'bottom'; sCrash(O.cart.position.clone().setY(0.6)); G.shake = Math.max(G.shake || 0, NEAR(O.cart.position, P) < 10 ? 0.5 : 0.15); after(1.2, () => sayI('The cart slams into the buffer at the end of the line.', 3200)); save(); }
  if (c.route === 'branch' && p.x <= BOARD_X + 0.62) smashBoards();
}
function stopCart() { V.cartRun = null; if (A.loops.cart) setGain(A.loops.cart, 0, 0.1); }
function smashBoards() {
  stopCart(); flag('boardsBroken'); S.cart = 'wreck'; V.cart.wreck = true; placeCart();
  O.boardSolid.on = false; sCrash(new THREE.Vector3(BOARD_X, 1, 5)); G.shake = Math.max(G.shake || 0, 0.7);
  O.planks.forEach((pl, i) => { const to = new THREE.Vector3(rand(-1.6, -0.4), 0.03 + i * 0.03, rand(-0.7, 0.7)), r0 = pl.rotation.clone(), p0 = pl.position.clone(), rz = rand(-1.6, 1.6); tween(rand(0.5, 0.9), k => { pl.position.lerpVectors(p0, to, k); pl.position.y = lerp(p0.y, to.y, k) + Math.sin(k * Math.PI) * 0.5; pl.rotation.set(r0.x + k * rand(-0.2, 0.2), r0.y + k * 0.3, r0.z + k * rz); }, null, k => k); });
  dustBurst(new THREE.Vector3(-2.6, 1.0, 5.0), 10);
  // the old workings breathe out: your flame goes, and he can walk
  if (NEAR(P, { x: -1.5, z: 5 }) < 13 && lampLit()) after(0.5, () => lampOut('gust'));
  save();
}
function pushCartBack() {
  if (S.cart !== 'bottom' || V.cartRun) return;
  G.cutscene = true; const s0 = V.cart.s; sScrape(O.cart.position, 2.5, 0.3);
  tween(4.5, k => { V.cart.s = lerp(s0, 0, k); V.cart.route = 'main'; placeCart(); if (Math.random() < 0.05) sCreak(O.cart.position, 0.4, 0.12, 80); }, () => { S.cart = 'top'; V.cart.s = 0; placeCart(); O.chock.position.set(0.3, 0.12, POS.chock); O.chock.rotation.set(0, 0, 0); G.cutscene = false; sKnock(O.chock.position, 0.4, 0, 0); sayI('You shove it back up the line, a sleeper at a time, and wedge the chock back under the wheel.', 4000); save(); updatePrompt(true); });
}
function setPoints(v, quiet) {
  S.points = v; save();
  const k = v === 'branch' ? 1 : 0;
  if (quiet) { O.pointsLever.rotation.z = k ? 0.7 : -0.7; O.tongues.children.forEach(t => t.rotation.y = k ? -0.06 : 0); return; }
  tween(0.35, x => { O.pointsLever.rotation.z = lerp(k ? -0.7 : 0.7, k ? 0.7 : -0.7, x); O.tongues.children.forEach(t => t.rotation.y = lerp(k ? 0 : -0.06, k ? -0.06 : 0, x)); });
  sThunk(O.points.position.clone().setY(0.2), 0.6, 140); sClick(O.points.position, 0.3, 1200);
  sayI(k ? 'The points clank over: the line now curves away west, into the old drift.' : 'The points clank back: the line runs straight on, south to the buffer.', 3500);
}

/* ---------------- the ladder ---------------- */
function climb(dir) {
  if (V.ladder || G.cutscene) return;
  if (HOLD.cur === 'kit') { toast('Not with the sledge in your hands. Put it down first (Q).', 3000); return; }
  if (!lampLit()) { toast('Not in the dark.', 2000); return; }
  const down = dir === 'down', first = down && !S.flags.winzeDown;
  G.cutscene = true; V.ladder = { t: 0, down, first }; BODY.crouch = false; G.crouch = false;
  const top = new THREE.Vector3(-6.0, 0.05, 4.95), bot = new THREE.Vector3(-6.0, L4Y, 4.95), dur = first ? 5.2 : 3.4;
  const y0 = down ? 0.1 : L4Y, y1 = down ? L4Y : 0;
  G.yaw = Math.PI; G.pitch = down ? -0.35 : 0.3;
  tween(dur, k => {
    if (!V.ladder) return; V.ladder.t = k;
    const ey = lerp(y0, y1, k); P.x = -6.0; P.z = 4.92; BODY.y = BODY.ys = ey; BODY.vy = 0; BODY.ground = true; solidSet(O.ladderSolid, -6.2, -5.8, ey - 0.2, ey, 4.75, 5.1); O.ladderSolid.on = true; G.eye = G.eyeT = ey + BODY.standEye;
    const rung = Math.floor(k * 16); if (rung !== V.ladder.rung) { V.ladder.rung = rung; sLadder(0.22); if (Math.random() < 0.25) sPebbles(camera.position.clone().setY(ey + 1.6), 2); }
    if (first && k > 0.42 && !V.ladder.flick) { V.ladder.flick = true; V.flicker = 0.5; sayI('The flame gutters. Pebbles patter down on your helmet from above.', 3500); sPebbles(new THREE.Vector3(-6, 0.3, 5), 12);
      // in that half-second of dark he came to the top of the shaft, and he's looking down at you
      if (S.flags.tioKnown && !S.flags.paid) { V.tioState = 'scripted'; setTio(-6.0, 0, 4.05, 0, 'peer', 'w3'); }
    }
    if (first && V.ladder.flick && k > 0.48 && k < 0.7) { G.pitch = lerp(G.pitch, 1.4, 0.08); if (!V.ladder.saw && k > 0.55) { V.ladder.saw = true; sStinger(0.9); G.fearT = 1; sHeart(5, 0.5, 0.5); } }
    else if (first && k >= 0.7) G.pitch = lerp(G.pitch, -0.3, 0.06);
  }, () => {
    if (!V.ladder) return; V.ladder = null; G.cutscene = false; O.ladderSolid.on = false;
    if (down) { bodyPlace(-6.45, L4Y, 5.05, Math.PI / 2, false); if (first) { flag('winzeDown'); arriveL4(); } }
    else { bodyPlace(-5.0, 0, 5.05, -Math.PI / 2, false); if (V.tioState === 'scripted') V.tioState = null; }
    updatePrompt(true);
  }, k => k);
}
function arriveL4() {
  // water off the ladder drowns the flame; in the dark he goes ahead of you, and waits in the crawl
  after(0.4, () => {
    sDrip(helmetPos(), 0.2); lampOut('l4', true); sayI('Water running off the ladder drips onto your lamp, and the flame drowns.', 4200);
    if (S.flags.tioKnown && !S.flags.paid) { stageCrawlMouth(); V.tioState = null; V.watchMouth = true; V.noStrike = true; for (let i = 0; i < 6; i++) after(0.3 + i * 0.4, () => sClay(new THREE.Vector3(lerp(-6.4, -12.3, i / 5), L4Y + 0.2, 4.7), 0.3)); after(2.6, () => { V.noStrike = false; }); }
  });
}
function stageCrawlMouth() { V.tioHold = true; setTio(-12.55, L4Y, 3.72, 0, 'creep', 'b0'); V.tio.yaw = 0; placeTio(); }

/* ---------------- the voices in the rock ---------------- */
async function minersTalk() {
  flag('minersHeard'); const at = POS.crack.clone().add(new THREE.Vector3(0.6, 0, 0)), o = { fx: 'muffled', pos: at, volume: 1.5 }, A_ = 'A man, through the rock', B_ = 'Another man';
  sayI('Voices, through the crack in the rock. Men talking, close, as if just the other side of it.', 4000); await wait(2600);
  await line('m1', A_, 'This is the place. This is where the gringo disappeared.', o);
  await line('m2', B_, 'The one in the story? When was that?', o);
  await line('m3', A_, 'Ninety-eight. My dad was on that shift.', o);
  await line('m4', A_, 'They dug for a week. They never found anything.', o);
  await line('m5', B_, 'They say the Tío kept him.', o);
  await line('m6', A_, 'Come on, let\'s go. I don\'t like this place.', o);
  heard('miners'); for (let i = 0; i < 5; i++) after(i * 0.6, () => sStep(0.06));
}

/* ---------------- drilling, the charge, the fuse, the blast ---------------- */
function drillActions() {
  const d = S.drill || 0, f = S.flags;
  if (f.blasted) return [look('The hole the blast tore through the rockfall. Cold air and a grey light come through it.')];
  if (d < 8) {
    if (HOLD.cur !== 'kit') return [look(d ? `A hole started in the boulder, ${d === 1 ? 'a finger' : d < 5 ? 'a hand' : 'a forearm'} deep. You need the sledge and steel to go on.` : 'The biggest boulder in the fall, wedged tight from floor to roof. To blast it you\'d have to drill a hole in it first.')];
    return [{ label: d ? 'Strike the steel' : 'Set the steel and strike', run: strikeSteel }, { label: 'Turn the steel', run: turnSteel }];
  }
  if (!f.charged) return took('dynamite') ? [{ label: 'Push the stick into the hole', run: charge }] : [look('The hole is deep enough for a stick of dynamite.')];
  if (!f.fuseLit) return [{ label: 'Light the fuse', run: lightFuse }, look('The stick is in the hole, its fuse hanging out of the rock.')];
  return [look('The fuse is burning. Get into the refuge!')];
}
function strikeSteel() {
  if (G.time < (V.drillCD || 0)) return; V.drillCD = G.time + 0.45;
  const d = S.drill || 0;
  if (d > 0 && !S.drillTurned) { sThunk(POS.face, 0.6, 90); sayI('The steel binds in the hole. Turn it before you hit it again.', 2800); return; }
  S.drill = d + 1; S.drillTurned = false; save();
  sClang(POS.face); V.sparkT = 0.07; L.spark.position.copy(POS.face).add(new THREE.Vector3(0, 0, 0.3)); sparkBurst(POS.face.clone().add(new THREE.Vector3(0, 0, 0.25)), 5);
  dustBurst(POS.face.clone().add(new THREE.Vector3(0, 0, 0.3)), 2); showSteel();
  if (S.drill === 4) after(1.2, () => { sKnocks(POS.face.clone().add(new THREE.Vector3(0, 0, -1.4)), 3, 0.55, 0.9, 1); after(2.2, () => sayI('Three knocks come back, from inside the rock.', 3500)); });
  if (S.drill === 8) after(0.6, () => { sayI('The hole\'s deep enough for a stick.', 3000); updatePrompt(true); });
  if (!S.ev.toldDrill) { S.ev.toldDrill = true; toast(`Strike (${G.touch ? 'first button' : '<kbd>E</kbd>'}), turn the steel (${G.touch ? 'second button' : '<kbd>R</kbd>'}), strike again.`, 6000); }
}
function turnSteel() { if ((S.drill || 0) >= 8) return; S.drillTurned = true; sScrape(POS.face, 0.3, 0.2); O.steel.rotation.z += Math.PI / 2; save(); }
function showSteel() { const d = S.drill || 0; O.steel.visible = d > 0 && d < 8 && !S.flags.charged; O.steel.position.z = FACE_Z + 0.32 - d * 0.03; O.stick.visible = !!S.flags.charged && !S.flags.blasted; }
function charge() { flag('charged'); drop('dynamite'); showSteel(); sScrape(POS.face, 0.5, 0.15); sayI('You push the stick deep into the hole with the steel. The fuse hangs out of the rock like a tail.', 4200); }
function lightFuse() {
  if (!lampLit()) { toast('You need your flame to light it.', 2500); return; }
  if (!S.flags.paid) { sayI('Not while he\'s walking. When the blast puts your light out, he\'ll be on you in the dark. Pay the Tío first.', 6000); flag('needPay'); return; }
  flag('fuseLit'); V.fuse = 9.5; sClick(POS.face, 0.4, 2400);
  sayI('The fuse catches with a spit and a hiss. ¡Fuego! Get into the refuge!', 4000); toast('<b>¡FUEGO!</b> Get into the REFUGIO niche.', 5000);
}
function fuseUpdate(dt) {
  if (!(V.fuse > 0)) { O.fuseSpark.visible = false; L.fuse.intensity = 0; return; }
  V.fuse -= dt; O.fuseSpark.visible = true; O.fuseSpark.position.set(POS.face.x + 0.05, POS.face.y - 0.18 + Math.max(0, V.fuse / 9.5) * -0.3, FACE_Z + 0.35); O.fuseSpark.material.opacity = 0.6 + Math.random() * 0.4;
  L.fuse.position.copy(O.fuseSpark.position); L.fuse.intensity = 0.8 + Math.random() * 0.8;
  V.fuseTick = (V.fuseTick || 0) - dt; if (V.fuseTick <= 0) { V.fuseTick = 0.07; sClick(O.fuseSpark.position, 0.12, rand(2500, 5000)); }
  if (V.fuse <= 0) blast();
}
function blast() {
  V.fuse = 0; O.fuseSpark.visible = false; L.fuse.intensity = 0;
  const safe = inRefuge() || NEAR(P, { x: 0, z: FACE_Z }) > 13.5;
  flag('blasted'); G.flash = 1.3; G.shake = 2.4; sBoom(1.0, false); sPebbles(new THREE.Vector3(P.x, 2, P.z), 30); sRing(8);
  if (A.ready) for (const k of ['drone', 'mountain']) if (A.loops[k]) { const g = A.loops[k].gain.gain; g.cancelScheduledValues(now()); g.setValueAtTime(0, now()); }
  lampOut('blast', true);
  openBreach(); dustBurst(new THREE.Vector3(0, 1.2, FACE_Z + 3), 26, true);
  if (!safe) { caught('blast'); return; }
  sayI('The mountain jumps. Your ears are full of a high, thin singing, and the dark is full of dust.', 5500);
  after(3.5, () => { sChuckle(POS.seat.clone().setY(1.3), 0.35); });
  after(5.5, () => { V.breachK = 0.001; toast(`Strike your lamp back on${G.touch ? '' : ' (<kbd>E</kbd>)'}.`, 4000); });
}
function openBreach() {
  O.plug.visible = false; O.breach.visible = true; O.adit.visible = true; O.plugSolid.on = false; O.breachSolids.forEach(s => s.on = true);
  O.steel.visible = false; O.stick.visible = false;
  O.rubble.children.forEach(r => { if (Math.abs(r.position.x) < 0.7 && r.position.y > 0.2) { r.position.set(rand(-0.9, 0.9), rand(0.05, 0.15), FACE_Z + rand(0.5, 2.6)); } });
  L.bulbs.forEach(b => b.intensity = 1.3); RAYLIST = null; renderer.shadowMap.needsUpdate = true; V.envDue = true;
}
function dustBurst(at, n, big) { let k = 0; for (const s of O.dust) { if (k >= n) break; if (s.userData.t > 0) continue; s.userData.t = big ? rand(7, 12) : rand(2.5, 5); s.userData.T = s.userData.t; s.visible = true; s.position.copy(at).add(new THREE.Vector3(rand(-0.8, 0.8) * (big ? 2 : 1), rand(-0.4, 0.6), rand(-1, 1) * (big ? 5 : 1))); s.userData.v = new THREE.Vector3(rand(-0.15, 0.15), rand(-0.02, 0.06), rand(0.05, 0.4) * (big ? 1 : 0.3)); k++; } }
function dustUpdate(dt) { for (const s of O.dust) { const u = s.userData; if (!(u.t > 0)) continue; u.t -= dt; s.position.addScaledVector(u.v, dt); s.material.opacity = Math.sin(clamp(u.t / u.T, 0, 1) * Math.PI) * 0.4; s.material.rotation += dt * 0.05; if (u.t <= 0) s.visible = false; } }

/* ---------------- the way out ---------------- */
function endUpdate(dt) {
  if (!S.flags.blasted || S.flags.escaped) return;
  if (V.breachK > 0) { V.breachK = Math.min(1, V.breachK + dt / 5); L.breach.intensity = V.breachK * 0.9; }
  if (!V.ending && P.z < -23.5 && BODY.y > -1) {
    V.ending = { t: 0 }; G.frozen = true;
    sayI('Far up the tunnel a light swings toward you: a white light, brighter than any lamp you\'ve ever seen. Boots on the rails.', 6000);
    for (let i = 0; i < 9; i++) after(0.6 + i * 0.5, () => sStep(0.1 + i * 0.015));
    after(3.2, () => line('quien', 'A voice', 'Who\'s there?', { pos: new THREE.Vector3(0, 1.6, -38), volume: 1.2 }));
  }
  if (V.ending) {
    V.ending.t += dt; L.white.intensity = Math.min(1, V.ending.t / 4) * 18; L.white.position.z = lerp(-44, -33, Math.min(1, V.ending.t / 6));
    if (V.ending.t > 5.2 && !V.ending.fade) { V.ending.fade = true; V.black = 3; G.blackT = 1; }
    if (V.ending.t > 6.6 && !V.ending.done) { V.ending.done = true; flag('escaped'); const frame = endFrame(); finishRoom(frame); }
  }
}
function endFrame(skipEnv) {
  let url = null;
  let noEnv = false; 
  try {
    const cam = camera, saved = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, far: cam.far }, fog = scene.fog.density, fogC = scene.fog.color.clone();
    const g = buildMouth(); g.visible = true; O.face.visible = false; O.kitHand.visible = false; for (const id in HOLD.defs) { const d = HOLD.defs[id]; if (d.hand) d.hand.visible = false; }
    const lightsWas = [L.lamp, L.beam, L.spark, L.ember, L.fuse, L.breach, L.phone, L.white, ...L.bulbs].map(l => [l, l.intensity]); lightsWas.forEach(([l]) => l.intensity = 0);
    L.sun.intensity = 4.2; L.skyFill.intensity = 0.8; L.hemi.intensity = 0;
    scene.fog.density = 0.004; scene.fog.color.setRGB(0.5, 0.45, 0.42);
    V.black = 0; G.black = 0; G.blackT = 0; const pu = post.uniforms; pu.black.value = 0; pu.flash.value = 0; pu.fear.value = 0; pu.red.value = 0; const ex = pu.exposure.value; pu.exposure.value = 1.05;
    cam.fov = 46; cam.far = 200; cam.updateProjectionMatrix(); updateProj();
    cam.position.set(299.75, 1.55, 2.55); cam.lookAt(299.15, 1.5, -1.0); cam.updateMatrixWorld();
    const envWas = scene.environment; if (!skipEnv && !noEnv) { scene.environment = null; const rt = envFromScene(new THREE.Vector3(300.5, 1.4, 3)); scene.environment = rt.texture; }
    renderer.shadowMap.needsUpdate = true; render(0.016);
    const cw = canvas.width, ch = canvas.height, Wd = 480, Ht = 360, c = document.createElement('canvas'); c.width = Wd; c.height = Ht; const gg = c.getContext('2d');
    const sa = Math.min(cw / Wd, ch / Ht), sw = Wd * sa, sh = Ht * sa; gg.drawImage(canvas, (cw - sw) / 2, (ch - sh) / 2, sw, sh, 0, 0, Wd, Ht);
    // a colour snapshot, a little warm, a little soft
    const d = gg.getImageData(0, 0, Wd, Ht); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = clamp(d.data[i] * 0.95 + 12, 0, 255); d.data[i + 1] = clamp(d.data[i + 1] * 0.92 + 8, 0, 255); d.data[i + 2] = clamp(d.data[i + 2] * 0.88 + 6, 0, 255); } gg.putImageData(d, 0, 0); speckle(gg, Wd, Ht, 700, 0.12, '30,20,10', 2);
    url = c.toDataURL('image/jpeg', 0.88);
    g.visible = false; L.sun.intensity = 0; L.skyFill.intensity = 0; lightsWas.forEach(([l, v]) => l.intensity = v); scene.environment = envWas; pu.exposure.value = ex;
    scene.fog.density = fog; scene.fog.color.copy(fogC);
    cam.position.copy(saved.p); cam.quaternion.copy(saved.q); cam.fov = saved.fov; cam.far = saved.far; cam.updateProjectionMatrix(); updateProj();
  } catch (e) { console.warn(e); }
  return url;
}

/* ---------------- interactions ---------------- */
function registerInteractions() {
  scene.updateMatrixWorld(true);   // hit boxes are measured in world space: every parent must be in place first
  // --- the Tío
  inter('tio', O.tio, { name: () => S.flags.paid ? 'The Tío, smoking' : 'The Tío', reach: 2.0, enabled: () => lampLit() || S.flags.paid, actions: () => {
    if (S.flags.paid) return [look('Back on his bench, smoking, your silver on his knee. His glass eyes follow you. You don\'t look at them for long.')];
    const a = offerActions(); if (a.length > 2) a.length = 2;
    if (a.length < 2) a.push(look(S.flags.tioKnown ? 'Clay, painted red, horned, grinning with glass teeth. Paper streamers on his shoulders. He was sitting down this afternoon. He isn\'t now.' : 'The Tío. Standing in the middle of the tunnel with his back to you, where his chair should be. Someone must have carried him. Nobody could have carried him.'));
    return a;
  } });
  O.tioHit.userData.iid = 'tio';
  inter('chair', O.bench, { name: 'The Tío\'s bench', reach: 2.4, actions: () => [look(S.flags.paid ? 'He sits there smoking, as if he never got up.' : 'His bench of stones and a plank, in the niche heaped with offerings. Empty. On the plank, the dust is pressed flat in the shape of where he sat.')] });
  inter('bag', O.bag, { name: 'Your gift bag', actions: () => [look('The bag of presents you bought for the miners at the market this morning, burst open. The bottle of alcohol smashed when you fell: the rock reeks of it. The coca has gone, scattered in a trail along the rails. The matches are soaked.')] });
  hitbox('bag', O.bag, 0.08);
  inter('cocaBag', O.cocaBag, { name: 'A bag of coca leaves', enabled: () => !took('coca') && !S.paid.coca, actions: () => [{ label: 'Pick up the coca', run: () => { give('coca'); O.cocaBag.visible = false; if (!S.flags.paid && NEAR(V.tio.pos, P) < 3.5) after(0.5, () => { line('mio', TIO, 'That\'s mine.', { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(0.3, 0.05, 0.3)), volume: 1.3 }); heard('tio'); G.fearT = 0.8; }); } }] });
  hitbox('cocaBag', O.cocaBag, 0.08);
  for (const [id, o] of [['tinRef', O.tinRef], ['tinTool', O.tinTool], ['tinL4', O.tinL4]]) {
    inter(id, o, { name: 'Tin of carbide', reach: 2.2, actions: () => V.refill > 0 ? [] : S.fuel < 0.93 ? [{ label: 'Refill your lamp', run: () => refillAt(id) }] : [look('Grey lumps of calcium carbide in a dented tin. Your lamp is full.')] }); hitbox(id, o, 0.08);
  }
  // --- the tool chamber
  inter('cigs', O.cigs, { name: 'Cigarettes', enabled: () => !took('cigs') && S.cigsLeft > 0 && !S.ev.cigsTaken, actions: () => [{ label: 'Take the cigarettes', run: () => { give('cigs'); S.ev.cigsTaken = true; O.cigs.visible = false; save(); } }] });
  hitbox('cigs', O.cigs, 0.07);
  inter('phone', O.phone, { name: 'A slab of black glass', actions: () => [{ label: 'Touch it', run: lookPhone }] });
  hitbox('phone', O.phone, 0.06);
  inter('restBench', O.restBench, { name: 'The miners\' bench', actions: () => [look('A log on two stones where the miners sit to chew coca and smoke at the change of shift.')] });
  inter('box', O.box, { name: 'Powder box', reach: 2.2, actions: boxActions });
  inter('padlock', O.padlock, { name: 'Padlock', enabled: () => !S.flags.boxOpen, actions: boxActions }); hitbox('padlock', O.padlock, 0.06);
  inter('kit', O.kit, { name: 'Sledge and drill steel', enabled: () => HOLD.cur !== 'kit', actions: () => [{ label: 'Take the sledge and steel', run: () => { flag('kitSeen'); pickUp('kit'); } }] });
  hitbox('kit', O.kit, 0.08);
  // --- the cart, the points, the boards
  inter('chock', O.chock, { name: 'Chock under the wheel', enabled: () => S.cart === 'top' && !V.cartRun, actions: () => [{ label: 'Kick the chock out', run: kickChock }] });
  hitbox('chock', O.chock, 0.08);
  inter('cart', O.cart, { name: 'Ore cart', reach: 2.2, actions: () => {
    if (S.cart === 'bottom') return [{ label: 'Push it back up the line', run: pushCartBack }];
    if (S.cart === 'wreck') return [look('The cart lies on its side in the mouth of the old drift, its wheels in the air, in a litter of broken planks.')];
    return [look('An empty ore cart on the main line. The line runs downhill to the south; a wooden chock under the front wheel stops it rolling. It must weigh half a tonne.')];
  } });
  inter('points', O.points, { name: () => S.points === 'branch' ? 'Points lever: set for the old drift' : 'Points lever: set for the main line', reach: 2.0, actions: () => [{ label: 'Throw the points', run: () => setPoints(S.points === 'branch' ? 'main' : 'branch') }] });
  hitbox('points', O.points, 0.1);
  inter('boards', O.boards, { name: () => S.flags.boardsBroken ? 'Broken planks' : 'Planks across the old drift', reach: 2.3, actions: () => { if (!S.flags.boardsSeen) flag('boardsSeen'); return [look(S.flags.boardsBroken ? 'Smashed to splinters.' : 'Planks as thick as your wrist, spiked to posts across the old drift. PELIGRO, NO ENTRAR. You couldn\'t shift them with your hands, or with a hammer. Something heavy would have to hit them hard.')]; } });
  // --- the ladder
  O.ladTopHit = mbox(0.8, 0.9, 0.5, HITMAT, -6.0, 0.6, 5.2, scene, 1); O.ladTopHit.layers.set(2); O.ladTopHit.userData.hit = true;
  inter('ladTop', O.ladTopHit, { name: 'The winze: a ladder going down', reach: 2.2, enabled: () => S.flags.boardsBroken && !onL4(), actions: () => [{ label: 'Climb down the ladder', run: () => climb('down') }] });
  O.ladBotHit = mbox(0.9, 1.6, 0.5, HITMAT, -6.0, L4Y + 1.0, 5.25, scene, 1); O.ladBotHit.layers.set(2); O.ladBotHit.userData.hit = true;
  inter('ladBot', O.ladBotHit, { name: 'The ladder up', reach: 2.2, enabled: () => onL4(), actions: () => [{ label: 'Climb up the ladder', run: () => climb('up') }] });
  // --- Level 4
  inter('valve', O.valve, { name: 'Valve on the air line', reach: 2.0, actions: () => S.flags.valve ? [look('Open. Air roars along the hose.')] : [{ label: 'Open the valve', run: openValve }] });
  hitbox('valve', O.valve, 0.07);
  inter('miner', O.miner, { name: 'A miner', reach: 2.2, actions: () => [look('A miner, dried brown as an old boot, sitting against the rock with his lamp in his lap as if he sat down to wait for the bad air to clear. His helmet is the old leather kind. Nobody has worn one like it for forty years.')] });
  inter('minerKeys', O.minerKeys, { name: 'Keys on his belt', enabled: () => !S.flags.key, actions: () => [{ label: 'Take his keys', run: takeKeys }] }); hitbox('minerKeys', O.minerKeys, 0.08);
  inter('minerBottle', O.minerBottle, { name: 'A flat bottle', enabled: () => !S.flags.alcohol, actions: () => [{ label: 'Take the bottle', run: () => { flag('alcohol'); give('alcohol'); O.minerBottle.visible = false; } }] }); hitbox('minerBottle', O.minerBottle, 0.06);
  inter('minerLamp', O.minerLamp, { name: 'His lamp', actions: () => !S.flags.minerCarb && S.fuel < 0.93 ? [{ label: 'Take the carbide from his lamp', run: () => refillAt('minerLamp') }] : [look(S.flags.minerCarb ? 'His lamp, empty now.' : 'A brass carbide lamp like yours, older. There\'s still carbide in it.')] }); hitbox('minerLamp', O.minerLamp, 0.025);
  // --- the rockfall
  O.faceHit = mbox(1.3, 1.1, 0.5, HITMAT, POS.face.x, POS.face.y, FACE_Z + 0.2, scene, 1); O.faceHit.layers.set(2); O.faceHit.userData.hit = true;
  inter('face', O.faceHit, { name: () => S.flags.blasted ? 'The breach' : 'The rockfall', reach: 2.0, actions: drillActions });
  O.steel = grp(POS.face.x, POS.face.y, FACE_Z + 0.3); pole([0, 0, 0], [0, 0, 0.42], 0.012, M.railTop, O.steel, 6); O.steel.visible = false; O.steel.userData.keep = true;
  O.stick = grp(POS.face.x, POS.face.y, FACE_Z + 0.06); { const s = cyl(0.017, 0.017, 0.06, std({ color: 0xc8b890, roughness: 0.8 }), 0, 0, 0, O.stick, 8); s.rotation.x = Math.PI / 2; tube([[0, 0, 0.02], [0.02, -0.08, 0.12], [0.04, -0.22, 0.18], [0.05, -0.34, 0.24]], 0.004, M.paintBlack, O.stick, 10, 4); } O.stick.visible = false; O.stick.userData.keep = true;
  O.crackHit = mbox(0.2, 0.9, 0.8, HITMAT, POS.crack.x - 0.05, POS.crack.y, POS.crack.z, scene, 1); O.crackHit.layers.set(2); O.crackHit.userData.hit = true;
  inter('crack', O.crackHit, { name: 'A crack in the rock', actions: () => [look('A crack in the wall as wide as two fingers. Cold air breathes out of it, and the smell of a different mine.')] });
  O.refHit = mbox(0.2, 1.4, 1.1, HITMAT, REF.x1 - 0.05, 0.9, -9.0, scene, 1); O.refHit.layers.set(2); O.refHit.userData.hit = true;
  inter('refuge', O.refHit, { name: 'Refuge niche', actions: () => [look('A niche hacked out of the wall, big enough for two men to stand in while the shots go off. REFUGIO, chalked over it.')] });
  O.chalkHit = mbox(0.12, 0.6, 1.4, HITMAT, GAL.x0 + 0.05, 1.55, 3.45, scene, 1); O.chalkHit.layers.set(2); O.chalkHit.userData.hit = true;
  inter('chalk', O.chalkHit, { name: 'Chalk on the rock', actions: () => [look('Chalked on the rock by the old drift: CHIMENEA VIEJA, AIRE MALO ABAJO. Old shaft. Bad air below.')] });
  O.vivaHit = mbox(0.12, 0.8, 1.2, HITMAT, NICHE.x0 + 0.06, 1.55, -4.9, scene, 1); O.vivaHit.layers.set(2); O.vivaHit.userData.hit = true;
  inter('viva', O.vivaHit, { name: 'Chalk in the niche', actions: () => [look('VIVA EL TÍO, in big letters. Under it, smaller: Tío, danos veta. Uncle, give us a vein of ore.')] });
}
function boxActions() {
  if (!S.flags.boxSeen) flag('boxSeen');
  if (!S.flags.boxOpen) return took('key') ? [{ label: 'Unlock the padlock', run: openBox }] : [look('A heavy wooden chest stencilled EXPLOSIVOS, PELIGRO. Padlocked.')];
  if (!S.flags.dynamite) return [{ label: 'Take a stick of dynamite', run: () => { flag('dynamite'); give('dynamite'); O.boxSticks.children[4].visible = false; } }];
  return [look('Sticks of dynamite in sawdust. One is all you need.')];
}
function openBox() { flag('boxOpen'); drop('key'); O.padlock.visible = false; sClick(O.padlock.position, 0.4, 1600); tween(0.8, k => { O.boxLid.rotation.z = -k * 1.9; }); O.boxSticks.visible = true; sCreak(O.box.position, 0.6, 0.15, 120); }
function lookPhone() {
  flag('phoneSeen'); V.phoneT = 6; O.phoneScreen.material.color.setScalar(1); sClick(O.phone.position, 0.08, 4400);
  sayI('Somebody has left a thing on the bench: a flat slab of black glass, thin as a biscuit, cold. When you touch it the glass lights up, all by itself: a photo of a llama in a paper party hat, big white numbers, 03:12, and the words sábado, 1 de agosto. Then it goes dark again.', 9000);
}
function openValve() {
  flag('valve'); tween(1.2, k => { O.valveWheel.rotation.x = k * 6; });
  sCreak(O.valve.position.clone(), 1.0, 0.25, 140);
  after(0.6, () => { if (A.loops.air) { setGain(A.loops.air, 0.12, 0.5); setGain(A.loops.airValve, 0.05, 0.3); } sayI('Air roars down the hose and away along the floor toward the crawl. You feel it go past your boots, cold.', 5000); });
}
function takeKeys() {
  flag('key'); give('key'); O.minerKeys.visible = false;
  // his head comes round to you, and his jaw drops
  tween(0.9, k => { O.minerNeck.rotation.x = lerp(0.85, 0.2, k); O.minerNeck.rotation.y = lerp(0, -0.55, k); O.minerJaw.rotation.x = lerp(0.35, 0.85, k); }, null, k => k * k);
  sCreak(O.miner.position.clone().setY(CH_Y + 0.7), 0.6, 0.2, 60); after(0.7, () => { sStinger(0.8); G.fearT = Math.max(G.fearT || 0, 0.9); V.flicker = 0.25; });
  after(1.2, () => sayI('As the ring comes off his belt, his head rolls round to face you and his jaw falls open.', 4500));
}
function pickUp(id) {
  holdTake(id); if (!S.inv.includes(id)) S.inv.push(id); S.held = id; renderInv(id);
  if (!S.ev.toldHold) { S.ev.toldHold = true; toast(`In your hands: <b>${esc(ITEMS[id].name)}</b>. ${G.touch ? 'The Put down button' : '<kbd>Q</kbd>'} puts it down. It's too heavy to run with.`, 6500); }
}
function onHold(id, on) { if (!on) { S.inv = S.inv.filter(i => i !== id); if (S.held === id) S.held = null; renderInv(); } }
function setupCarry() { holdable('kit', { name: 'Sledge and drill steel', world: O.kit, hand: O.kitHand, handPos: [0.22, -0.24, -0.46], handRot: [0.25, 0.1, -0.35], onDrop: () => { O.kit.rotation.x = Math.PI / 2; O.kit.position.y += 0.08; S.props.kit.y = O.kit.position.y; } }); O.ladderSolid = solid('ladder', 0, 0, -50, -50, 0, 0); O.ladderSolid.on = false; }

/* ---------------- the director: the mountain is never quiet for long ---------------- */
const EVENTS = [
  { id: 'drip', ok: () => lampLit() && !S.flags.paid && S.flags.tioKnown && G.time - (V.lastSnuff || -999) > 80 && NEAR(V.tio.pos, P) > 6 && !onL4() || false, run: () => { V.lastSnuff = G.time; sDrip(helmetPos(), 0.2); lampOut('drip'); } },
  { id: 'gutter', ok: () => lampLit(), run: () => { V.flicker = 0.22; sBreath(camera.position.clone().add(new THREE.Vector3(0, 0, 0.5)), 1, 0.12, true); } },
  { id: 'boom', ok: () => true, run: () => { sBoom(rand(0.25, 0.45)); after(0.4, () => { G.shake = Math.max(G.shake || 0, 0.25); sPebbles(new THREE.Vector3(P.x + rand(-2, 2), BODY.y + 2, P.z + rand(-2, 2)), 8); if (lampLit()) V.flicker = 0.15; }); } },
  { id: 'creak', ok: () => true, run: () => sCreak(new THREE.Vector3(P.x + rand(-4, 4), BODY.y + 2, P.z + rand(-4, 4)), rand(0.8, 1.6), 0.18, rand(50, 90)) },
  { id: 'pebbles', ok: () => true, run: () => sPebbles(new THREE.Vector3(P.x + rand(-3, 3), BODY.y + 2, P.z + rand(-3, 3)), 12) },
  { id: 'knock', ok: () => !onL4(), run: () => sKnocks(new THREE.Vector3(P.x + rand(-6, 6), BODY.y + 1, P.z + rand(-6, 6)), 3, 0.5, 0.5, 1) },
  { id: 'whisper', ok: () => !S.flags.paid && took('silver') && S.flags.tioKnown, run: () => { playClip(pick(['ti_mio', 'ti_debes', 'ti_ven']), { fx: 'whisper', pos: camera.position.clone().add(new THREE.Vector3(Math.sin(G.yaw) * 0.5, 0.1, Math.cos(G.yaw) * 0.5)), volume: 1.25 }); heard('tio'); } },
  { id: 'clink', ok: () => !S.flags.paid && S.flags.tioKnown, run: () => sClink(V.tio.pos.clone().setY(0.6), 0.25) },
  { id: 'drips', ok: () => true, run: () => { for (let i = 0; i < 6; i++) after(i * 0.7, () => sDrip(new THREE.Vector3(P.x + rand(-3, 3), BODY.y, P.z + rand(-3, 3)), 0.1)); } },
  { id: 'rails', ok: () => !onL4() && S.cart !== 'rolling', run: () => { if (!A.ready) return; const t = now(), o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.frequency.setValueAtTime(1800, t); o.frequency.linearRampToValueAtTime(2300, t + 2); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.015, t + 1); g.gain.linearRampToValueAtTime(0.0001, t + 2.4); o.connect(g); route(g, { pos: new THREE.Vector3(0, 0.1, P.z + 8), wet: 0.6 }); o.start(t); o.stop(t + 2.5); } },
  { id: 'breathe', ok: () => !S.flags.paid && S.flags.tioKnown && !lampLit(), run: () => sBreath(V.tio.pos.clone().setY(1.5), 1, 0.3) },
];
function director(dt) {
  if (G.cutscene || G.uiOpen || V.catching || V.ladder || V.cartRun || V.fuse > 0 || S.flags.blasted || !S.flags.lit) return;
  V.dirT = (V.dirT ?? 30) - dt; if (V.dirT > 0) return;
  const opts = EVENTS.filter(e => e.id !== V.last && e.ok());
  if (opts.length) { const e = pick(opts); e.run(); V.last = e.id; }
  V.dirT = rand(36, 62) - progress() * 2.2;
}
function progress() { const f = S.flags; return [f.lit, f.tioKnown, f.boardsBroken, f.winzeDown, f.pastHim, f.valve, f.key, f.boxOpen, f.paid, f.charged].filter(Boolean).length; }

/* ---------------- sound beds ---------------- */
function startAmbience() {
  if (!A.ready || A.loops.mountain) return;
  // a long, dark echo for a mountain full of holes
  const ctx = A.ctx, ir = ctx.createBuffer(2, ctx.sampleRate * 3.2, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); let lp = 0; for (let i = 0; i < ch.length; i++) { lp = lp * 0.82 + (Math.random() * 2 - 1) * 0.18; ch[i] = lp * Math.pow(1 - i / ch.length, 2.2) * (i < 900 ? i / 900 : 1); } }
  A.rev.buffer = ir;
  A.loops.mountain = loopNoise({ type: 'lowpass', f: 90, q: 0.5, vol: 0, brown: true, wet: 0.4 });
  A.loops.hiss = loopNoise({ type: 'bandpass', f: 5200, q: 0.6, vol: 0, wet: 0.02 });
  A.loops.cart = loopNoise({ pos: new THREE.Vector3(0, 0.4, POS.cartTop), type: 'lowpass', f: 260, q: 0.7, vol: 0, brown: true, wet: 0.4, ref: 2 });
  A.loops.air = loopNoise({ pos: new THREE.Vector3(-13.2, CH_Y + 0.2, -2.4), type: 'highpass', f: 1800, q: 0.5, vol: 0, wet: 0.3, ref: 1.5 });
  A.loops.airValve = loopNoise({ pos: POS.valve.clone(), type: 'highpass', f: 2600, q: 0.5, vol: 0, wet: 0.2, ref: 0.8 });
  A.loops.hum = loopNoise({ pos: new THREE.Vector3(0, 2, -30), type: 'bandpass', f: 100, q: 4, vol: 0, wet: 0.3, ref: 3 });
  const tg = ctx.createGain(); tg.gain.value = 0; [36.7, 49, 55, 73.4].forEach(f => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = rand(-12, 12); o.connect(tg); o.start(); }); route(tg, { wet: 0.6 }); A.loops.drone = { gain: tg };
  if (S.flags.valve) { setGain(A.loops.air, 0.12, 0.5); setGain(A.loops.airValve, 0.05, 0.3); }
}
function soundUpdate(dt) {
  if (!A.ready || !A.loops.mountain) return;
  const blasted = S.flags.blasted;
  setGain(A.loops.mountain, blasted ? 0.02 : 0.08, 1.2);
  const t = V.tio, near = t && !S.flags.paid && S.flags.tioKnown ? clamp(1 - NEAR(t.pos, P) / 14, 0, 1) : 0;
  setGain(A.loops.drone, blasted ? 0 : S.flags.lit ? 0.004 + progress() * 0.0007 + near * 0.012 + (!lampLit() && S.flags.tioKnown && !S.flags.paid ? 0.01 : 0) : 0.002, 1.2);
  setGain(A.loops.hum, blasted && P.z < FACE_Z ? 0.04 : blasted ? 0.012 : 0, 1);
  // water dripping all round you; louder on Level 4
  V.dripT = (V.dripT ?? 1) - dt; if (V.dripT <= 0) { V.dripT = onL4() ? rand(0.25, 0.9) : rand(0.8, 2.6); sDrip(new THREE.Vector3(P.x + rand(-5, 5), BODY.y + rand(0, 2), P.z + rand(-5, 5)), onL4() ? 0.09 : 0.06); }
  // altitude: running leaves you gasping
  if (V.gasp > 0) { V.gaspT = (V.gaspT || 0) - dt; if (V.gaspT <= 0) { V.gaspT = 0.75; sBreath(camera.position.clone().add(new THREE.Vector3(0, -0.1, 0)), 1, 0.16, true); } }
}

/* ---------------- per frame ---------------- */
function roomUpdate(dt) {
  G.flash = Math.max(0, (G.flash || 0) - dt * 1.6);
  V.black = Math.max(0, (V.black || 0) - dt); G.blackT = V.black > 0 ? 1 : (V.airT > 2 && !S.flags.valve ? clamp((V.airT - 2) / 4, 0, 0.75) : 0);
  lampUpdate(dt); tioUpdate(dt); cartUpdate(dt); fuseUpdate(dt); dustUpdate(dt); soundUpdate(dt); endUpdate(dt);
  const f = S.flags;
  // the empty chair, the first time you see it
  if (f.lit && !f.chairSeen && lampLit() && camera.position.distanceTo(POS.seat) < 7) { O.bench.updateMatrixWorld(); if (inView(O.bench, 0.75)) { flag('chairSeen'); sStinger(0.45); sayI('Across the tunnel, in the niche heaped with offerings: the Tío\'s bench. Empty. Coca leaves are strewn from it along the rails, into the dark.', 7500); G.fearT = Math.max(G.fearT || 0, 0.5); } }
  // the first time you come up behind him
  if (f.lit && !f.tioKnown && !V.enc && lampLit() && !onL4() && NEAR(V.tio.pos, P) < 5.2) firstEncounter();
  if (V.enc) encounterUpdate(dt);
  // Level 4: he waits in the mouth of the crawl
  if (V.watchMouth && lampLit() && onL4() && !f.blocked && !f.paid) { O.tio.updateMatrixWorld(true); if (inView(O.tj.chest, 0.9)) { flag('blocked'); V.watchMouth = false; sStinger(0.85); G.fearT = 1; sHeart(5, 0.5, 0.5); sayI('Down at the end of the drift, in the mouth of the crawl, hunched and filling it: the Tío. Waiting for you.', 6500); } }
  if (f.blocked && !f.pastHim && onL4() && inBox(CWA) && P.z < BAY.z0 - 0.3) { flag('pastHim'); }
  if (f.blocked && !f.pastHim && onL4() && NEAR(V.tio.pos, P) < 1.3 && lampLit() && !S.ev.toldBlock && NEAR(V.tio.pos, POS.crawlMouth) < 0.6) { S.ev.toldBlock = true; sayI('He fills the passage. To get by you\'d have to touch him, and you can\'t make your hand do it.', 5000); }
  // bad air in the crawl and the chamber, until the hose is blowing
  if (inCrawlOrChamber() && P.z < 1.9 && !f.valve) { V.airT = (V.airT || 0) + dt; if (!f.badAir) { flag('badAir'); sayI('Your flame shrinks to a blue bead, and you can\'t get your breath. There\'s no air back here.', 6000); } if (V.airT > 4.5 && lampLit()) lampOut('air', true); if (V.airT > 7.5) caught('air'); V.gasp = 1; }
  else { V.airT = Math.max(0, (V.airT || 0) - dt * 2.5); }
  // the voices, once you have the dead man's key
  if (f.key && !f.minersHeard && !onL4() && NEAR(P, POS.crack) < 2.6 && !V.catching) minersTalk();
  // the phone's screen
  if (V.phoneT > 0) { V.phoneT -= dt; L.phone.intensity = V.phoneT > 0.3 ? 0.6 : 0; if (V.phoneT <= 0) O.phoneScreen.material.color.setScalar(0); }
  // when he's been paid and your light comes back
  if (V.paidLook && lampLit()) { V.paidLook = false; after(0.6, () => sayI('When the flame catches, he\'s back on his bench in the niche, the cigarette glowing between his teeth. Your silver sits in his palm.', 6500)); }
  // altitude: you can run a few seconds, then your lungs give out
  const running = (keys.ShiftLeft || keys.ShiftRight || (TOUCH.stick && Math.hypot(TOUCH.mx, TOUCH.my) > 0.92)) && G.moving && !BODY.crouch;
  if (running && V.winded <= 0) { V.stam = Math.max(0, (V.stam ?? 1) - dt / 3.2); if (V.stam <= 0) { V.winded = 3; if (!S.ev.toldAlt) { S.ev.toldAlt = true; toast('Four thousand metres up, you can only run a few steps before your lungs give out.', 5500); } } }
  else V.stam = Math.min(1, (V.stam ?? 1) + dt / 5);
  V.winded = Math.max(0, (V.winded || 0) - dt); V.gasp = Math.max(0, (V.gasp || 0) - dt) + (V.winded > 0 ? 1 : 0);
  BODY.speedK = (V.winded > 0 || HOLD.cur === 'kit') && running ? 1.55 / 2.9 : inWater() ? 0.82 : 1;
  // a toast the first time something is too low to walk under standing up
  if (BODY.low && G.time - BODY.low < 0.1 && !S.ev.toldCrouch) { S.ev.toldCrouch = true; toast(`Too low to walk under. ${G.touch ? 'Crouch' : '<kbd>C</kbd>'} to crawl.`, 4000); }
  if (V.catching) { V.catching.t += dt; }
  director(dt);
  if (V.envDue) { V.envDue = false; V.envNow = true; }
}
function firstEncounter() {
  V.enc = { t: 0, phase: 'drip' }; V.tioState = 'scripted';
  sDrip(helmetPos(), 0.22); lampOut('first', true);
  sayI('A drop of water from the roof lands right on your flame. Hsss. Dark.', 3600);
}
function encounterUpdate(dt) {
  const e = V.enc; e.t += dt;
  if (e.phase === 'drip') {
    // in the dark he turns, and comes two steps toward you
    if (!lampLit()) { const me = new THREE.Vector3(P.x, 0, P.z), t = V.tio, d = NEAR(t.pos, me); if (e.t > 0.5 && d > 2.3) { const dir = me.clone().sub(t.pos).setY(0).normalize(); t.pos.addScaledVector(dir, Math.min(d - 2.3, 1.3 * dt)); tioFace(me); V.tioStep = (V.tioStep || 0) + 1.3 * dt; if (V.tioStep > 0.6) { V.tioStep = 0; sClay(t.pos.clone().setY(0.2), 0.5); } } if (e.t > 0.5 && V.tioPose !== 'reach') poseTio('reach'); placeTio(); }
    else { e.phase = 'seen'; e.t = 0; V.tioState = null; flag('tioKnown'); saveTio();
      O.tio.updateMatrixWorld(true); sStinger(1.0); G.fearT = 1; G.shake = 0.6; sHeart(6, 0.55, 0.5);
      after(0.4, () => sayI('He has turned round. He is closer. His arms are up.', 4000));
      after(4.6, () => toast('<b>He only moves in the dark.</b> Keep your lamp lit.', 7000));
      V.enc = null; }
  }
}

/* ---------------- footsteps ---------------- */
function stepSound(v) {
  if (inWater()) { sSplash(0.08 + v * 0.5); return; }
  sStep(v * (onL4() ? 0.8 : 1)); if (Math.random() < 0.3) sClick(camera.position.clone().setY(BODY.y), v * 0.4, rand(2400, 4200));
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, elapsed: 0, player: null,
    props: {}, held: null, ev: {}, fuel: 0.8, lamp: 0, paid: {}, cigsLeft: 3, smokeT: 0, tio: null, cart: 'top', points: 'main', drill: 0, drillTurned: true };
}
function applyState() {
  const f = S.flags;
  Object.assign(V, { noStrike: false, catching: null, ladder: null, cartRun: null, enc: null, fuse: 0, ending: null, refill: 0, airT: 0, flicker: 0, sparkT: 0, black: 0, tioState: null, tioMoving: false, watchMouth: false, breachK: 0, phoneT: 0, paidLook: false, lampK: 0, stam: 1, winded: 0, gasp: 0, dirT: 30 });
  if (!V.tio) V.tio = { pos: new THREE.Vector3(), yaw: 0, node: 'g5' };
  if (!V.cart) V.cart = { s: 0, route: 'main', wreck: false };
  if (S.cart === 'rolling') S.cart = 'top';
  // the lamp is always lit again when you come back, unless you never lit it
  S.lamp = f.lit ? 1 : 0; if (f.lit) S.fuel = Math.max(S.fuel, 0.35); V.lampK = f.lit ? 1 : 0;
  // the Tío
  if (f.paid) { setTio(POS.seat.x, 0, POS.seat.z, Math.PI / 2, 'seated', 'n0'); }
  else if (S.tio && f.tioKnown) { setTio(S.tio.x, S.tio.y, S.tio.z, S.tio.yaw, S.tio.pose || 'stand', S.tio.node); if (f.blocked && !f.pastHim) stageCrawlMouth(); }
  else setTio(POS.tioStart.x, 0, POS.tioStart.z, 0, 'stand', 'g5');
  O.tioCoca.visible = !!S.paid.coca; O.tioSilver.visible = !!S.paid.silver; O.tioCig.visible = !!(S.smokeT > 0 || f.paid); O.tioCigStick.scale.y = 1;
  O.tioFeet.forEach(m => m.material = S.paid.alc ? M.tioFeetWet : M.tioFeet);
  L.ember.intensity = 0;
  // things taken
  O.cocaBag.visible = !took('coca') && !S.paid.coca;
  O.cigs.visible = !S.ev.cigsTaken;
  O.minerKeys.visible = !f.key; O.minerBottle.visible = !f.alcohol;
  if (f.key) { O.minerNeck.rotation.set(0.2, -0.55, 0.15); O.minerJaw.rotation.x = 0.85; } else { O.minerNeck.rotation.set(0.85, 0, 0.15); O.minerJaw.rotation.x = 0.35; }
  O.padlock.visible = !f.boxOpen; O.boxLid.rotation.z = f.boxOpen ? -1.9 : 0; O.boxSticks.visible = !!f.boxOpen; O.boxSticks.children[4].visible = !f.dynamite;
  O.valveWheel.rotation.x = f.valve ? 6 : 0;
  // the cart and the points
  setPoints(S.points || 'main', true);
  V.cart.wreck = S.cart === 'wreck'; V.cart.route = 'main'; V.cart.s = S.cart === 'bottom' ? POS.buffer - 0.66 - POS.cartTop : 0; placeCart();
  if (S.cart === 'top') { O.chock.position.set(0.3, 0.12, POS.chock); O.chock.rotation.set(0, 0, 0); O.chock.visible = true; } else { O.chock.position.set(1.0, 0.05, POS.chock + 0.5); O.chock.rotation.set(0, 0.4, Math.PI / 2); }
  O.boardSolid.on = !f.boardsBroken;
  O.planks.forEach((pl, i) => { if (f.boardsBroken) { pl.position.set(-0.6 - (i % 3) * 0.35, 0.03 + i * 0.02, -0.5 + (i % 4) * 0.33); pl.rotation.set(0, 0.3 * i, Math.PI / 2 * (i % 2) + 0.2); } else { pl.position.copy(pl.userData.home); pl.rotation.copy(pl.userData.homeR); } });
  // the rockfall
  if (f.blasted) openBreach(); else { O.plug.visible = true; O.breach.visible = false; O.adit.visible = false; O.plugSolid.on = true; O.breachSolids.forEach(s => s.on = false); L.bulbs.forEach(b => b.intensity = 0); }
  L.breach.intensity = f.blasted ? 0.9 : 0; V.breachK = f.blasted ? 1 : 0;
  showSteel();
  // what you carry in your hands
  for (const id in HOLD.defs) { const d = HOLD.defs[id], p = S.props[id]; if (d.hand) d.hand.visible = false; if (p) { d.world.position.set(p.x, p.y, p.z); d.world.rotation.set(Math.PI / 2, p.ry || 0, 0); } else { d.world.position.copy(POS.kit); d.world.rotation.set(0, 0, 0); } d.world.visible = true; }
  HOLD.cur = null; S.inv = S.inv.filter(i => !HOLD.defs[i]);
  if (S.held && HOLD.defs[S.held]) { const id = S.held; holdTake(id, true); S.inv.push(id); }
  renderInv(); renderer.shadowMap.needsUpdate = true; V.envDue = true; RAYLIST = null;
}
function savePlayer(p) { if (V.ladder) { const d = V.ladder.down; p.x = d ? -5.0 : -6.45; p.z = 5.05; p.y = d ? 0 : L4Y; } }
function resumed() { if (S.flags.blasted && !S.flags.escaped) { /* stay where you were */ } }

/* ---------------- title: a tunnel, a flame, and eyes that come closer when it gutters ---------------- */
function titleFx(cv, g, t) {
  if (cv.width !== 480) { cv.width = 480; cv.height = 270; }
  const W = 480, H = 270, cx = W / 2, cy = H * 0.52;
  const gut = (Math.sin(t * 1.7) * Math.sin(t * 0.73 + 1) > 0.82) ? 1 : 0;
  if (gut && !V.tfGut) V.tfStep = Math.min(6, (V.tfStep || 0) + 1); V.tfGut = gut; if ((V.tfStep || 0) >= 6 && !gut) V.tfStep = 0;
  const lit = gut ? 0.08 : 0.85 + Math.sin(t * 13) * 0.05 + Math.sin(t * 29) * 0.04;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  // the tunnel: rings of rough rock receding, lit warm from the camera
  for (let i = 9; i >= 0; i--) { const s = Math.pow(0.72, i), w = 420 * s, h = 230 * s, b = Math.round(lit * 90 * Math.pow(0.7, i)); g.fillStyle = `rgb(${b + 10},${Math.round(b * 0.72) + 6},${Math.round(b * 0.5) + 4})`; g.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, r = 1 + (vnoise(k * 1.7, i * 3.1) - 0.5) * 0.18; const x = cx + Math.cos(a) * w * 0.5 * r, y = cy + Math.sin(a) * h * 0.5 * r * (Math.sin(a) > 0 ? 0.75 : 1); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.fill(); g.fillStyle = '#000'; g.beginPath(); const s2 = s * 0.72; for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, r = 1 + (vnoise(k * 1.7, i * 3.1 + 1) - 0.5) * 0.18; const x = cx + Math.cos(a) * 420 * s2 * 0.5 * r, y = cy + Math.sin(a) * 230 * s2 * 0.5 * r * (Math.sin(a) > 0 ? 0.75 : 1); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.fill(); }
  // rails
  g.strokeStyle = `rgba(160,150,140,${0.5 * lit})`; g.lineWidth = 1.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 70, H); g.lineTo(cx + s * 4, cy + 6); g.stroke(); }
  // the eyes, closer each time the flame dips
  const st = V.tfStep || 0, es = 0.18 + st * 0.2, ey = cy - 4 + st * 3;
  for (const s of [-1, 1]) { const ex = cx + s * 9 * es * 2; const gr = g.createRadialGradient(ex, ey, 0, ex, ey, 6 * es + 2); gr.addColorStop(0, `rgba(255,220,170,${gut ? 0.9 : 0.35 + 0.1 * st})`); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(ex - 12 * es - 4, ey - 12 * es - 4, 24 * es + 8, 24 * es + 8); }
  if (!gut && st > 0) { g.fillStyle = `rgba(120,20,14,${0.22 * lit})`; g.beginPath(); g.ellipse(cx, ey + 26 * es, 30 * es, 42 * es, 0, 0, TAU); g.fill(); }
  // the flame glow at the bottom of the frame
  const fg = g.createRadialGradient(cx, H + 30, 10, cx, H + 30, 160); fg.addColorStop(0, `rgba(255,220,160,${0.35 * lit})`); fg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = fg; g.fillRect(0, 0, W, H);
}

/* ---------------- build ---------------- */
function buildRoom() {
  scene.fog = new THREE.FogExp2(0x020101, 0.06);
  camera.far = 80; camera.near = 0.02; camera.updateProjectionMatrix(); post.uniforms.far.value = camera.far; post.uniforms.near.value = camera.near;
  enableRealistic({ exposure: 1.35, ao: 0.75, aoRad: 0.3, bloom: 0.75, bloomThr: 1.1, vig: 0.5, grain: 0.04, sat: 0.9 });
  bodyOn({});
  makeTextures(); paintThings(); makeMaterials();
  buildMine(); buildRails(); buildProps(); buildAditProps(); buildTio(); buildMiner(); buildCart(); buildFaceScare(); buildHands(); buildLights();
  setupCarry();
}

/* ---------------- the room module ---------------- */
return {
  id: 'tio', title: 'El Tío', saveKey: 'lethe.roomtio.v1',
  DOCS, ITEMS, HEARD, HINTS, openDoc, inspectItem,
  titleFx,
  penalty() { G.lockout = G.time + 3; },
  markSkip: ['start', 'tio', 'lamp', 'out'], markMerge: {},
  backText: 'Back in the mine. Your lamp is burning.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact, strike the flint', 'E or click'], ['Other action', 'R or right-click'], ['Run (briefly)', 'Shift'], ['Jump', 'Space'], ['Crouch, crawl', 'C'], ['Put down', 'Q'], ['Put your lamp out', 'F'], ['Notebook', 'Tab'], ['Hints', 'H']],
  toggleCrouch() { if (V.ladder) return; bodyCrouch(); },
  stepDown() { if (V.ladder) return; bodyJump(); },
  toggleFlash() { if (G.cutscene || V.catching) return; if (lampLit()) { if (!S.flags.tioKnown) { toast('You\'re not putting it out. Not down here.', 2500); return; } lampOut('valve', true); sayI('You close the water valve and the flame dies. Dark.', 2500); } else strike(); },
  dropHeld() { if (G.cutscene) return; if (DRAG.cur) { dragEnd(); return; } if (HOLD.cur) holdDrop(); },
  onHold, stepSound,
  onLand(v) { if (v > 1.5) { if (inWater()) sSplash(0.3); else sStep(0.35); } },
  savePlayer, resumed,
  actOverride(i) {
    if (!lampLit() && !V.catching && !G.cutscene) {
      const h = G.hover; if (h && /^tin|minerLamp/.test(h.id) && S.fuel < 0.93) return false;
      strike(); return true;
    }
    return false;
  },
  promptOverride() {
    if (!lampLit() && !G.cutscene && !V.catching) {
      const h = G.hover;
      if (V.refill > 0) return `<span class="nm">Refilling the lamp</span>`;
      if (h && /^tin|minerLamp/.test(h.id) && S.fuel < 0.93) return '';
      return S.fuel > 0 ? `<span class="act"><kbd>E</kbd>Strike the flint</span>` : `<span class="nm">No carbide left</span><span class="note">Feel your way to a tin of carbide.</span>`;
    }
    return '';
  },
  touchOverride() {
    if (!lampLit() && !G.cutscene && !V.catching) {
      const h = G.hover;
      if (h && /^tin|minerLamp/.test(h.id) && S.fuel < 0.93 && !(V.refill > 0)) return [{ label: 'Refill your lamp', run: () => refillAt(h.id), main: true }];
      if (V.refill > 0 || S.fuel <= 0) return [];
      return [{ label: 'Strike the flint', run: strike, main: true }];
    }
    return null;
  },
  touchExtras() {
    const x = [];
    if (!V.ladder) x.push({ label: 'Jump', run: () => bodyJump() });
    if (HOLD.cur) x.push({ label: 'Put down', run: () => holdDrop() });
    if (lampLit() && S.flags.tioKnown && !S.flags.blasted) x.push({ label: 'Lamp out', run: () => ROOM.toggleFlash() });
    return x;
  },
  invNote: id => id === 'cigs' ? ` <span class="muted">(${S.cigsLeft} left)</span>` : '',
  update: roomUpdate,
  preRender() {
    if (V.envNow) { V.envNow = false; const old = scene.environment; scene.environment = null; const hide = [O.face, O.kitHand]; const was = hide.map(o => o.visible); hide.forEach(o => o.visible = false); const li = L.lamp.intensity; L.lamp.intensity = 1.6; L.lamp.position.set(0, 1.5, -6); const rt = envFromScene(new THREE.Vector3(0, 1.4, -6)); L.lamp.intensity = li; scene.environment = rt.texture; if (V.envRT) V.envRT.dispose(); V.envRT = rt; hide.forEach((o, i) => o.visible = was[i]); }
  },
  build() {
    buildRoom(); registerInteractions();
    mergeGroup(O.mine); mergeGroup(O.l4); mergeGroup(O.props);
  },
  defaults, applyState, startAmbience,
  spawn: { x: POS.spawn.x, z: POS.spawn.z, yaw: 0 },
  wake() {
    const yaw = Math.atan2(-(POS.seat.x - POS.spawn.x), -(POS.seat.z - POS.spawn.z));
    bodyPlace(POS.spawn.x, 0, POS.spawn.z, yaw, false); G.pitch = -0.12;
    S.lamp = 0; V.lampK = 0; V.forceStrikes = 2;
    G.cutscene = true; $('#fx').className = 'lids';
    after(0.6, () => sayI('You come round on your back in the dark, with grit in your mouth and your ears ringing. Somewhere, rock is still settling.', 6500));
    after(3.0, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); give('silver', true); give('card', true); renderInv(); updatePrompt(true); toast(`Your lamp is out. ${G.touch ? 'Tap <b>Strike the flint</b>' : 'Press <kbd>E</kbd> to strike the flint'}.`, 8000); });
    V.memDone = false; S.docs.push('card', 'tasks');
    after(4.2, async () => { const o = { fx: 'tape', volume: 0.9 }; sayI('You remember the guide this afternoon, in the lamplight, laughing at nobody.', 3500); await wait(2400); await line('rule1', TEO + ', this afternoon', 'Inside the mountain, everything belongs to the Tío.', o); await line('rule2', TEO + ', this afternoon', 'Don\'t take anything. And if you take something, you have to pay.', o); await line('rule3', TEO + ', this afternoon', 'And never let your lamp go out. In the dark, the Tío walks.', o); heard('rules'); V.memDone = true; after(1.5, () => { if (!S.ev.toldMove) { S.ev.toldMove = true; toast(G.touch ? 'Crouch and Jump are buttons on the right. The notebook has Don Teo\'s card.' : '<kbd>Tab</kbd> notebook (Don Teo\'s card is in it) &middot; <kbd>C</kbd> crouch &middot; <kbd>H</kbd> hints', 7000); } }); });
  },
  debug: { faceInfo: () => { O.faceHit.updateMatrixWorld(true); ray.setFromCamera(new THREE.Vector2(0, 0), camera); const hs = ray.intersectObject(O.faceHit, false); const p = new THREE.Vector3(); O.faceHit.getWorldPosition(p); return { hits: hs.length, d: hs[0] && hs[0].distance, wp: p.toArray(), vis: O.faceHit.visible, shown: isShown(O.faceHit), layers: O.faceHit.layers.mask, rl: ray.layers.mask, parent: O.faceHit.parent && O.faceHit.parent.type, near: ray.near, far: ray.far, origin: ray.ray.origin.toArray(), dir: ray.ray.direction.toArray() }; }, camInfo: () => { camera.updateMatrixWorld(); const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); return { pos: camera.position.toArray().map(v => +v.toFixed(2)), f: f.toArray().map(v => +v.toFixed(2)), n: RAYLIST ? RAYLIST.length : -1, face: RAYLIST ? RAYLIST.includes(O.faceHit) : null, keysHit: RAYLIST ? RAYLIST.filter(o => o.userData.iid === 'minerKeys').length : null, far: ray.far, mode: G.mode, ui: UI.kind, cut: G.cutscene, eye: G.eye }; }, rayHits: () => { ray.setFromCamera(new THREE.Vector2(0, 0), camera); if (!RAYLIST) buildRayList(); return ray.intersectObjects(RAYLIST, false).slice(0, 6).map(h => ({ d: +h.distance.toFixed(2), iid: h.object.userData.iid || null, geo: h.object.geometry && h.object.geometry.type, noRay: !!h.object.userData.noRay, vis: isShown(h.object), layer: h.object.layers.mask, p: [h.object.getWorldPosition(new THREE.Vector3()).x.toFixed(2), h.object.getWorldPosition(new THREE.Vector3()).y.toFixed(2), h.object.getWorldPosition(new THREE.Vector3()).z.toFixed(2)] })); }, O, L, V, T, M, BODY, DRAG, HOLD, NV, pathTo, setTio, poseTio, strike, relight, lampOut, refillAt, offer, paidSequence, kickChock, setPoints, smashBoards, pushCartBack, climb, stageCrawlMouth, openValve, takeKeys, openBox, strikeSteel, turnSteel, charge, lightFuse, blast, openBreach, caught, endFrame, firstEncounter, minersTalk, lookPhone, pickUp, isDark },
};
})();
