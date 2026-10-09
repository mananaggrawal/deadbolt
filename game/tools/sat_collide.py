#!/usr/bin/env python3
"""Saturation: can you walk or swim through anything? A collision audit against the real geometry.

  station  every spot on the decks you can walk to from where you wake (after the room's own collision has pushed
           the body out of everything it knows about) is checked against every visible triangle in the scene:
           anything inside the body's cylinder (radius 0.26, from 10 cm up to just over the eyes) is something
           you'd pass through. Parts of walls cut away by an alpha map (portholes, the hatch) or by a shader (the
           tunnel's outline in the west dome) don't count.
  swim     every spot in the water the swimmer can be in is checked the same way against a sphere round the eye.
  walk     walks, then swims, into each thing for four seconds with the real controls (W held, the engine's own
           update), turning a little either way to slide along it; reports the deepest overlap and the biggest
           single-frame jump.

The room is started without ever being drawn: the audit needs the scene, not pictures, and SwiftShader's first
full frame can run the sandbox out of memory.

    python3 game/build.py dev
    cd site && npm ci
    python3 game/tools/sat_collide.py [station] [swim] [walk]   (no argument runs all three)

Prints clusters of overlaps: where you stand, what's in the way and how deep. Exit status 1 if anything is deeper
than 10 cm, or a step jumps more than 12 cm. (Known and fine: the shackle on the bell you clip him to, 8 cm; the
guideline lying on the sand; the haul line coiled on the deck by the pot.)
"""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.async_api import async_playwright
from sat_play import serve, launch, boot, ev, step

# triangles of everything visible, clipped to a band of heights and binned on a grid in plan
SETUP = r"""
() => {
  const L = window.__lethe, R = L.ROOM.debug, THREE = L.THREE, O = R.O;
  L.scene.updateMatrixWorld(true);
  const shown = o => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === L.camera) return false; } return true; };
  const skipMat = new Set([R.M.sand]);
  const skipRoots = [O.snow, O.fish, O.guide, O.bodyLine, O.bodyLineCut, O.nearSnow, O.crewG, O.deckScene].filter(Boolean);
  const under = (o, roots) => { for (let p = o; p; p = p.parent) if (roots.includes(p)) return true; return false; };
  const meshes = [];
  L.scene.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.isSprite || o.isPoints || !o.geometry || !shown(o)) return;
    if (Array.isArray(o.material) || skipMat.has(o.material) || under(o, skipRoots)) return;
    if (o.material.transparent && o.material.opacity < 0.05) return;
    if (o.material.visible === false || o.userData.hit || !(o.layers.mask & 3)) return;
    meshes.push(o);
  });
  // name a mesh by its nearest named ancestor in O, if any
  const names = new Map(); for (const k in O) { const v = O[k]; if (v && v.isObject3D) names.set(v, k); else if (Array.isArray(v)) v.forEach((x, i) => { if (x && x.isObject3D) names.set(x, k + '[' + i + ']'); }); }
  const nameOf = o => { for (let p = o; p; p = p.parent) if (names.has(p)) return names.get(p) + (p === o ? '' : '>' + (o.name || o.geometry.type)); return o.geometry.type; };
  const tris = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const m of meshes) {
    const g = m.geometry, p = g.attributes.position, idx = g.index, n = idx ? idx.count : p.count, nm = nameOf(m), col = m.material.color ? m.material.color.getHexString() : '';
    const cut = m.material.customProgramCacheKey && m.material.customProgramCacheKey() === 'tunhole';   // the west dome, with the tunnel's outline cut out of it in its shader
    // walls with holes cut by an alpha map (portholes, the hatch): drop the triangles whose middle is in a hole
    const am = m.material.alphaMap && m.material.alphaTest > 0 && m.material.alphaMap.userData.canvas, uva = g.attributes.uv;
    let alpha = null; if (am && uva) { const cv = am, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; alpha = (u, v) => { const x = Math.min(cv.width - 1, Math.max(0, Math.floor(u * cv.width))), y = Math.min(cv.height - 1, Math.max(0, Math.floor((1 - v) * cv.height))); return d[(y * cv.width + x) * 4 + 1]; }; }
    for (let i = 0; i < n; i += 3) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(p, i0).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(p, i1).applyMatrix4(m.matrixWorld); c.fromBufferAttribute(p, i2).applyMatrix4(m.matrixWorld);
      let hole = null;
      if (alpha) { const u = (uva.getX(i0) + uva.getX(i1) + uva.getX(i2)) / 3, v = (uva.getY(i0) + uva.getY(i1) + uva.getY(i2)) / 3; if (alpha(u, v) < 128) continue; hole = [alpha, uva.getX(i0), uva.getY(i0), uva.getX(i1), uva.getY(i1), uva.getX(i2), uva.getY(i2)]; }
      if (cut) { const cy = (a.y + b.y + c.y) / 3, cz = Math.abs((a.z + b.z + c.z) / 3), ty = 3.0 + 0.08 + 1.92 - 0.43, tw = 0.43 + 0.09; if (cz < tw && cy > 2.99 && (cy < ty || Math.hypot(cz, cy - ty) < tw)) continue; }
      tris.push([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, nm, col, hole]);
    }
  }
  window.__aud = { tris };
  return { meshes: meshes.length, tris: tris.length };
}
"""

# shared helpers in the page
HELPERS = r"""
() => {
  const A = window.__aud;
  // clip a triangle to ylo <= y <= yhi, return the polygon in plan [[x,z],...]
  A.clipBand = (t, ylo, yhi) => {
    let poly = [[t[0], t[1], t[2]], [t[3], t[4], t[5]], [t[6], t[7], t[8]]];
    const clip = (pl, keep, ycut) => { const out = []; for (let i = 0; i < pl.length; i++) { const P = pl[i], Q = pl[(i + 1) % pl.length], kp = keep(P[1]), kq = keep(Q[1]); if (kp) out.push(P); if (kp !== kq) { const k = (ycut - P[1]) / (Q[1] - P[1]); out.push([P[0] + (Q[0] - P[0]) * k, ycut, P[2] + (Q[2] - P[2]) * k]); } } return out; };
    poly = clip(poly, y => y >= ylo, ylo); if (poly.length < 2) return null;
    poly = clip(poly, y => y <= yhi, yhi); if (poly.length < 2) return null;
    return poly.map(q => [q[0], q[2]]);
  };
  // distance in plan from a point to a polygon (0 inside)
  A.dist2D = (x, z, pl) => {
    let inside = false, best = 1e9;
    for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) {
      const [xi, zi] = pl[i], [xj, zj] = pl[j];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / ((zj - zi) || 1e-12) + xi)) inside = !inside;
      const dx = xj - xi, dz = zj - zi, l2 = dx * dx + dz * dz; let k = l2 ? ((x - xi) * dx + (z - zi) * dz) / l2 : 0; k = Math.max(0, Math.min(1, k));
      const ex = xi + dx * k - x, ez = zi + dz * k - z; best = Math.min(best, Math.hypot(ex, ez));
    }
    return (inside && pl.length > 2) ? 0 : best;
  };
  // 3D distance from a point to a triangle
  A.closest = (px, py, pz, t) => {   // the closest point on the triangle, as weights on its three corners
    const ax = t[0], ay = t[1], az = t[2], bx = t[3], by = t[4], bz = t[5], cx = t[6], cy = t[7], cz = t[8];
    const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
    const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz; if (d1 <= 0 && d2 <= 0) return [1, 0, 0];
    const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz; if (d3 >= 0 && d4 <= d3) return [0, 1, 0];
    const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [1 - v, v, 0]; }
    const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz; if (d6 >= 0 && d5 <= d6) return [0, 0, 1];
    const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [1 - w, 0, w]; }
    const va = d3 * d6 - d5 * d4; if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return [0, 1 - w, w]; }
    const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return [1 - v - w, v, w];
  };
  A.inHole = (px, py, pz, t) => { const h = t[11]; if (!h) return false; const [a, b, c] = A.closest(px, py, pz, t); return h[0](a * h[1] + b * h[3] + c * h[5], a * h[2] + b * h[4] + c * h[6]) < 128; };
  A.dist3D = (px, py, pz, t) => {
    const ax = t[0], ay = t[1], az = t[2], bx = t[3], by = t[4], bz = t[5], cx = t[6], cy = t[7], cz = t[8];
    const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
    const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
    const D = (x, y, z) => Math.hypot(px - x, py - y, pz - z);
    if (d1 <= 0 && d2 <= 0) return D(ax, ay, az);
    const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) return D(bx, by, bz);
    const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return D(ax + abx * v, ay + aby * v, az + abz * v); }
    const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
    if (d6 >= 0 && d5 <= d6) return D(cx, cy, cz);
    const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return D(ax + acx * w, ay + acy * w, az + acz * w); }
    const va = d3 * d6 - d5 * d4; if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return D(bx + (cx - bx) * w, by + (cy - by) * w, bz + (cz - bz) * w); }
    const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return D(ax + abx * v + acx * w, ay + aby * v + acy * w, az + abz * v + acz * w);
  };
  A.cluster = (hits, cell) => {
    const m = new Map();
    for (const h of hits) { const k = h.what + '|' + Math.round(h.tx / cell) + ',' + Math.round(h.tz / cell) + (h.ty !== undefined ? ',' + Math.round(h.ty / cell) : ''); let c = m.get(k); if (!c) m.set(k, c = { what: h.what, col: h.col, n: 0, depth: 0, at: [1e9, -1e9, 1e9, -1e9, 1e9, -1e9], thing: [1e9, -1e9, 1e9, -1e9, 1e9, -1e9] }); c.n++; c.depth = Math.max(c.depth, h.depth);
      c.at = [Math.min(c.at[0], h.x), Math.max(c.at[1], h.x), Math.min(c.at[2], h.y), Math.max(c.at[3], h.y), Math.min(c.at[4], h.z), Math.max(c.at[5], h.z)];
      c.thing = [Math.min(c.thing[0], h.tx), Math.max(c.thing[1], h.tx), Math.min(c.thing[2], h.ty), Math.max(c.thing[3], h.ty), Math.min(c.thing[4], h.tz), Math.max(c.thing[5], h.tz)]; }
    return [...m.values()].sort((p, q) => q.n - p.n);
  };
  return true;
}
"""

STATION = r"""
(opt) => {
  const L = window.__lethe, R = L.ROOM.debug, A = window.__aud, B = L.BODY, FY = 3.0;
  const r = B.r, tol = opt.tol, H = B.standH, EYE = B.standEye + 0.06;   // up to just over your eyes: what's above them you never see go through your head
  // the deck band: from just above the floor to the top of the head
  const CELL = 0.1, grid = new Map(), key = (i, j) => i * 100003 + j;
  let n = 0;
  for (const t of A.tris) {
    const pl = A.clipBand(t, FY + 0.1, FY + 0.08 + EYE); if (!pl) continue;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pl) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    if (x1 < -3 || x0 > 11.2 || z1 < -2.6 || z0 > 2.6) continue;
    const rec = { pl, t, cy: (t[1] + t[4] + t[7]) / 3 }; n++;
    for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) { const k = key(i, j); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(rec); }
  }
  const hits = []; let stand = 0;
  const st = 0.04, NX = Math.round(13.5 / st) + 1, NZ = Math.round(5.0 / st) + 1, ok = new Uint8Array(NX * NZ), sup = new Float32Array(NX * NZ);
  const R0 = L.ROOM.debug.V; R0.mode = 'station';
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const x = -2.5 + i * st, z = -2.5 + j * st, p = { x, z };
    for (let it = 0; it < 4; it++) { L.bodyResolve(p, FY, B.STEP, null); L.ROOM.constrain(p, r); }
    if (Math.hypot(p.x - x, p.z - z) > 0.003) continue;
    const s0 = L.bodySupport(x, z, r * 0.55, FY + B.STEP); if (s0 < FY - 0.05) continue;
    ok[i * NZ + j] = 1; sup[i * NZ + j] = s0;
  }
  // walkable from where you wake: a flood fill over the grid
  const seen0 = new Uint8Array(NX * NZ), q = []; { let bk = -1, bd = 1e9; for (let k = 0; k < NX * NZ; k++) { if (!ok[k]) continue; const d = Math.hypot(-2.5 + Math.floor(k / NZ) * st + 1.2, -2.5 + (k % NZ) * st - 0.6); if (d < bd) { bd = d; bk = k; } } if (bk >= 0) { q.push(bk); seen0[bk] = 1; } }   /* from the nearest spot to where you wake */
  while (q.length) { const k = q.pop(), i = Math.floor(k / NZ), j = k % NZ; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= NX || jj >= NZ) continue; const kk = ii * NZ + jj; if (!ok[kk] || seen0[kk]) continue; seen0[kk] = 1; q.push(kk); } }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    if (!seen0[i * NZ + j]) continue;
    const x = -2.5 + i * st, z = -2.5 + j * st;
    stand++;
    const y0 = Math.max(FY, sup[i * NZ + j]), seen = new Set();
    for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) {
      const a = grid.get(key(i, j)); if (!a) continue;
      for (const rec of a) { if (seen.has(rec)) continue; seen.add(rec);
        const tmax = Math.max(rec.t[1], rec.t[4], rec.t[7]), tmin = Math.min(rec.t[1], rec.t[4], rec.t[7]);
        if (tmax < y0 + 0.1 || tmin > y0 + EYE) continue;
        const d = A.dist2D(x, z, rec.pl);
        if (d < r - tol && rec.t[11]) { let real = false; for (let h = 0.1; h <= EYE + 1e-6 && !real; h += 0.1) if (A.dist3D(x, y0 + h, z, rec.t) < r - tol && !A.inHole(x, y0 + h, z, rec.t)) real = true; if (!real) continue; }
        if (d < r - tol) hits.push({ x, y: y0, z, depth: r - d, what: rec.t[9], col: rec.t[10], tx: (rec.t[0] + rec.t[3] + rec.t[6]) / 3, ty: rec.cy, tz: (rec.t[2] + rec.t[5] + rec.t[8]) / 3 });
      }
    }
  }
  return { tris: n, stand, hits: hits.length, deep: hits.filter(h => h.depth > 0.1).length, clusters: A.cluster(hits, 0.7).slice(0, 250) };
}
"""

SWIM = r"""
(opt) => {
  const L = window.__lethe, R = L.ROOM.debug, A = window.__aud, V = R.V;
  const rad = opt.rad, CELL = 0.5, grid = new Map(), key = (i, j, k) => (i * 1009 + j) * 1009 + k;
  let n = 0;
  for (const t of A.tris) {
    const x0 = Math.min(t[0], t[3], t[6]), x1 = Math.max(t[0], t[3], t[6]), y0 = Math.min(t[1], t[4], t[7]), y1 = Math.max(t[1], t[4], t[7]), z0 = Math.min(t[2], t[5], t[8]), z1 = Math.max(t[2], t[5], t[8]);
    if (y0 > 8 || y1 < 0.1 || x1 < -11 || x0 > 20 || z1 < -17 || z0 > 12) continue; n++;
    for (let i = Math.floor((x0 - rad) / CELL); i <= Math.floor((x1 + rad) / CELL); i++) for (let j = Math.floor((y0 - rad) / CELL); j <= Math.floor((y1 + rad) / CELL); j++) for (let k = Math.floor((z0 - rad) / CELL); k <= Math.floor((z1 + rad) / CELL); k++) { const kk = key(i + 50, j + 50, k + 50); let a = grid.get(kk); if (!a) grid.set(kk, a = []); a.push(t); }
  }
  const was = V.mode; V.mode = 'swim';
  const hits = []; let free = 0;
  for (let x = opt.x0; x <= opt.x1; x += opt.st) for (let z = opt.z0; z <= opt.z1; z += opt.st) for (let y = 0.45; y <= 7.4; y += opt.st) {
    // where the swim code would let you be: its ceiling, then its walls
    const ceil = opt.ceil(x, z); if (y > ceil + 1e-6) continue;
    const p = { x, z }; const ny = opt.collide(p, y);
    if (Math.hypot(p.x - x, p.z - z) > 0.003 || Math.abs((ny ?? y) - y) > 0.003) continue;
    free++;
    const a = grid.get(key(Math.floor(x / CELL) + 50, Math.floor(y / CELL) + 50, Math.floor(z / CELL) + 50)); if (!a) continue;
    for (const t of a) { const d = A.dist3D(x, y, z, t); if (d < rad) hits.push({ x, y, z, depth: rad - d, what: t[9], col: t[10], tx: (t[0] + t[3] + t[6]) / 3, ty: (t[1] + t[4] + t[7]) / 3, tz: (t[2] + t[5] + t[8]) / 3 }); }
  }
  V.mode = was;
  return { tris: n, free, hits: hits.length, deep: hits.filter(h => h.depth > 0.1).length, clusters: A.cluster(hits, 1.0).slice(0, 80) };
}
"""

WALK = r"""
(opt) => {
  // hold W toward each thing for a few seconds (turning a little either way, to slide along it) through the engine's
  // own update; after every frame, how far into anything the body is, and whether it jumped
  const L = window.__lethe, R = L.ROOM.debug, A = window.__aud, B = L.BODY, V = R.V, FY = 3.0;
  const swim = opt.swim, rad = swim ? 0.2 : B.r - 0.05, CELL = 0.25, grid = new Map(), key = (i, j, k) => (i * 1009 + j) * 1009 + k;
  for (const t of A.tris) { const x0 = Math.min(t[0], t[3], t[6]), x1 = Math.max(t[0], t[3], t[6]), y0 = Math.min(t[1], t[4], t[7]), y1 = Math.max(t[1], t[4], t[7]), z0 = Math.min(t[2], t[5], t[8]), z1 = Math.max(t[2], t[5], t[8]);
    if (y0 > 8 || x1 < -11 || x0 > 20 || z1 < -17 || z0 > 12) continue;
    for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(y0 / CELL); j <= Math.floor(y1 / CELL); j++) for (let k = Math.floor(z0 / CELL); k <= Math.floor(z1 / CELL); k++) { const kk = key(i + 80, j + 80, k + 80); let a = grid.get(kk); if (!a) grid.set(kk, a = []); a.push(t); } }
  const near = (x, y, z) => { let best = 9, what = ''; const n = Math.ceil(rad / CELL) + 1, seen = new Set();
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) { const a = grid.get(key(Math.floor(x / CELL) + i + 80, Math.floor(y / CELL) + j + 80, Math.floor(z / CELL) + k + 80)); if (!a) continue; for (const t of a) { if (seen.has(t)) continue; seen.add(t); const d = A.dist3D(x, y, z, t); if (d < best && !(d < rad && A.inHole(x, y, z, t))) { best = d; what = t[9]; } } }
    return [best, what]; };
  // the body: points up its middle from the shins to the eyes; swimming: the eye
  const probe = () => { if (swim) { const [d, w] = near(L.P.x, L.G.eye, L.P.z); return [rad - d, w]; } let worst = -9, what = ''; for (const h of [0.15, 0.5, 0.9, 1.3, B.standEye]) { const [d, w] = near(L.P.x, B.y + h, L.P.z); if (rad - d > worst) { worst = rad - d; what = w; } } return [worst, what]; };
  const out = [];
  for (const T of opt.targets) {
    const [name, sx, sy, sz, tx, ty, tz] = T;
    if (swim) { V.mode = 'swim'; B.on = false; V.reveal = null; L.S.flags.bodyRevealed = true; L.P.x = sx; L.P.z = sz; L.G.eye = L.G.eyeT = sy; V.sp = { x: sx, z: sz }; }
    else { L.bodyPlace(sx, sy, sz, 0); }
    let worst = -9, what = '', jump = 0, px = L.P.x, pz = L.P.z, py = swim ? L.G.eye : B.y, wAt = null, jAt = null;
    for (let i = 0; i < opt.frames; i++) {
      const w = Math.sin(i / 9) * 0.5, dx = tx - L.P.x, dz = tz - L.P.z, h = Math.hypot(dx, dz);
      L.G.yaw = Math.atan2(-dx, -dz) + w; L.G.pitch = swim ? Math.atan2(ty - L.G.eye, h || 1) : 0;
      L.G.cutscene = false; L.G.uiOpen = false; L.G.frozen = false; L.G.mode = 'play';
      L.update(1 / 30);
      const [d, wh] = probe(); if (d > worst) { worst = d; what = wh; wAt = [+L.P.x.toFixed(2), +(swim ? L.G.eye : B.y).toFixed(2), +L.P.z.toFixed(2)]; }
      const y = swim ? L.G.eye : B.y, j = Math.hypot(L.P.x - px, L.P.z - pz, y - py); if (j > jump) { jump = j; jAt = [+px.toFixed(2), +pz.toFixed(2), +L.P.x.toFixed(2), +L.P.z.toFixed(2)]; } px = L.P.x; pz = L.P.z; py = y;
    }
    out.push([name, +worst.toFixed(3), what + (worst > 0.06 ? ' at ' + JSON.stringify(wAt) : ''), +jump.toFixed(3), [+L.P.x.toFixed(2), +(swim ? L.G.eye : B.y).toFixed(2), +L.P.z.toFixed(2)], jAt]);
  }
  L.G.mode = 'manual';
  if (swim) { V.mode = 'station'; B.on = true; }
  return out;
}
"""
FY = 3.0
STATION_TARGETS = [
    # name, start x y z, toward x y z
    ('dive rack', -0.9, FY, -0.9, -1.6, FY, -1.6), ('rack end west', -1.3, FY, -0.3, -2.2, FY, -1.0), ('rack end north', -0.4, FY, -1.3, -1.0, FY, -2.2),
    ('bench', -0.2, FY, -1.2, -0.65, FY, -2.1), ('tank rack', -1.2, FY, -0.4, -2.1, FY, -0.4), ('locker', -1.0, FY, 0.6, -1.9, FY, 1.0),
    ('fill stand', 1.2, FY, -0.5, 2.0, FY, -1.0), ('gas wall', 0.9, FY, -1.0, 1.7, FY, -1.8), ('hatch door', 1.3, FY, 0.4, 2.1, FY, 1.0),
    ('pot', 0.2, FY, 1.3, 1.0, FY, 1.4), ('pool rail', -1.4, FY, 0.4, 0.0, FY, 0.0), ('wet wall south', 0.0, FY, 1.2, 0.0, FY, 2.6),
    ('hatch north jamb', 1.4, FY, -0.6, 2.6, FY, -0.6), ('into tunnel', 1.2, FY, 0.0, 3.6, FY, 0.0), ('tunnel to mm', 2.6, FY, 0.0, 4.0, FY, 0.3),
    ('mm west bulkhead N', 3.7, FY, -0.45, 2.6, FY, -0.9), ('mm west bulkhead S', 3.8, FY, 0.8, 2.6, FY, 0.8),
    ('console', 4.2, FY, 0.0, 4.2, FY, -1.4), ('intercom', 5.3, FY, 0.0, 5.3, FY, -1.5), ('phone', 5.9, FY, 0.0, 5.9, FY, -1.5),
    ('scrubber', 4.1, FY, 0.0, 4.15, FY, 1.0), ('stools', 7.0, FY, 0.35, 7.0, FY, -0.4), ('table', 7.0, FY, 0.2, 7.0, FY, -1.2),
    ('galley', 6.8, FY, 0.0, 6.8, FY, 1.3), ('galley end gap', 8.5, FY, 0.2, 8.53, FY, 1.3), ('berth', 9.6, FY, 0.0, 9.6, FY, 1.3),
    ('tag board', 10.0, FY, 0.0, 10.0, FY, -1.5), ('bunk hatch', 9.8, FY, 0.0, 11.5, FY, 0.0),
]
SWIM_TARGETS = [
    ('wet room side', -4.0, 4.0, 0.0, 0.0, 4.0, 0.0), ('wet room roof', -0.5, 7.2, 0.5, 0.0, 5.0, 0.0), ('under wet room', -4.0, 2.4, 0.5, 0.0, 3.5, 0.0),
    ('main module side', 7.0, 3.6, -4.0, 7.0, 3.9, 0.0), ('main module roof', 7.0, 7.0, -3.0, 7.0, 4.0, 0.0), ('under main module', 7.0, 1.5, -3.5, 7.0, 3.0, 0.0),
    ('bunk dome', 16.6, 3.9, -0.5, 14.0, 3.9, 0.0), ('tunnel underside', 2.7, 1.2, 0.0, 2.7, 4.0, 0.0), ('gas banks', 0.0, 3.2, 6.0, 0.0, 3.2, 2.0),
    ('gas banks low', 2.5, 2.4, 4.5, -1.0, 2.6, 3.0), ('legs and braces', 0.0, 1.0, 4.0, 0.0, 1.0, -4.0), ('brace along mm', 9.0, 0.9, 3.0, 9.0, 0.9, -1.05),
    ('ballast', 7.0, 0.6, 4.5, 7.0, 0.4, 2.1), ('bell', 9.7, 3.3, -2.3, 9.7, 3.3, -4.6), ('bell bottles', 12.0, 3.4, -7.5, 9.7, 3.4, -4.6),
    ('bell frame', 12.0, 1.9, -4.6, 9.7, 1.9, -4.6), ('plinth', 9.7, 1.0, -8.0, 9.7, 0.8, -4.6), ('under the bell', 9.7, 2.1, -7.0, 9.7, 2.2, -4.6),
    ('coral head', -3.0, 0.7, -3.0, -6.0, 0.6, -5.0), ('big coral', 9.0, 0.8, -8.0, 10.0, 0.8, -11.0), ('reef', 12.0, 1.5, 3.0, 17.0, 1.5, 3.0),
    ('the diver', 0.0, 2.0, -4.5, -1.45, 2.0, -2.0), ('umbilical', 6.0, 7.0, 4.0, 6.0, 6.8, 0.6),
]

async def walk(pg, swim=False):
    out = await ev(pg, WALK, {'swim': swim, 'frames': 120, 'targets': [list(t) for t in (SWIM_TARGETS if swim else STATION_TARGETS)]})
    bad = 0
    print(('swim' if swim else 'walk') + ': into each thing for 4 s', flush=True)
    for name, worst, what, jump, at, jat in out:
        flag = ''
        if worst > 0.06: flag += '  INTO ' + what
        if worst > 0.1 and 'potG>Torus' not in what: bad += 1   # the haul line coiled on the deck is fine to step over
        if jump > 0.12: flag += '  JUMPED %.2f %s' % (jump, jat); bad += 1
        print(f"  {name:22s} deepest {max(worst, 0):.3f}  biggest step {jump:.3f}  ended at {at}{flag}", flush=True)
    return bad

def fmt(c):
    a, t = c['at'], c['thing']
    return (f"  {c['what'][:34]:34s} #{c['col']:6s} n={c['n']:5d} depth={c['depth']:.2f}  "
            f"you x {a[0]:.2f}..{a[1]:.2f} z {a[4]:.2f}..{a[5]:.2f} y {a[2]:.2f}  |  it x {t[0]:.2f}..{t[1]:.2f} y {t[2]:.2f}..{t[3]:.2f} z {t[4]:.2f}..{t[5]:.2f}")

async def station(pg, tol=0.05):
    out = await ev(pg, STATION, {'tol': tol})
    print(f"station: {out['tris']} triangles in the band, {out['stand']} standing spots, {out['hits']} overlaps ({out['deep']} deeper than 10 cm)", flush=True)
    for c in out['clusters']: print(fmt(c), flush=True)
    return out['deep']

async def swim(pg, rad=0.22, st=0.2):
    # the swim code's own ceiling and walls, called the way swimUpdate calls them
    await ev(pg, """() => { const R = window.__lethe.ROOM.debug; window.__aud.swimCeil = R.swimCeil; window.__aud.swimCollide = R.swimCollide; return !!(R.swimCeil && R.swimCollide); }""")
    js = SWIM.replace('opt.ceil(x, z)', 'window.__aud.swimCeil(x, z)').replace('opt.collide(p, y)', 'window.__aud.swimCollide(p, y, { x, z })')
    out = await ev(pg, js, {'rad': rad, 'st': st, 'x0': -10.5, 'x1': 19.0, 'z0': -16.5, 'z1': 11.5})
    print(f"swim: {out['tris']} triangles, {out['free']} free spots, {out['hits']} overlaps ({out['deep']} deeper than 10 cm)", flush=True)
    for c in out['clusters']: print(fmt(c), flush=True)
    return out['deep']

async def main():
    want = set(sys.argv[1:]) or {'station', 'swim', 'walk'}
    bad = 0
    async with async_playwright() as p:
        b, pg = await launch(p)
        await boot(pg)
        # start the room without ever drawing it: the audit needs the scene, not pictures, and SwiftShader's first full
        # frame (every shader at once) can run the sandbox out of memory
        await ev(pg, "() => { document.querySelector('#bNew').click(); window.__lethe.G.mode = 'manual'; }")
        await step(pg, 5)
        info = await ev(pg, SETUP); print('scene:', info, flush=True)
        await ev(pg, HELPERS)
        if 'station' in want: bad += await station(pg)
        if 'swim' in want: bad += await swim(pg)
        if 'walk' in want:
            await ev(pg, "() => { window.__lethe.G.mode = 'play'; }")   # keys only register in play
            await pg.keyboard.down('KeyW')   # held through both: the engine reads it as the forward key
            bad += await walk(pg, False)
            bad += await walk(pg, True)
            await pg.keyboard.up('KeyW')
        await b.close()
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    srv = serve()
    try: asyncio.run(main())
    finally: srv.shutdown()
