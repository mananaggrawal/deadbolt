/* =====================================================================
   SATURATION · part C: outside. The sand and the reef, fish and drifting snow, the gas banks' light,
   the diving bell (outside and in), your body on the line, the four of them at the bunk-room window,
   the lights, what you hold, and the ship's deck at dawn for the last photograph.
   ===================================================================== */
function rockGeo(r, detail = 2, seed = 1, squash = 0.7) {
  const g = new THREE.IcosahedronGeometry(r, detail); const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = fbm(v.x * 1.7 + seed * 3.1, v.z * 1.7 + v.y * 1.3 + seed, 4); v.multiplyScalar(0.72 + n * 0.6); v.y *= squash; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); const uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) * 0.8 + p.getY(i) * 0.3, p.getZ(i) * 0.8 + p.getY(i) * 0.3); uv.needsUpdate = true; return g;
}

// a rock's height field, for swimming over and round it: the top of its own triangles on a grid, widened by the
// swimmer's size so that the test is one look-up
function rockField(m, cell) {
  m.updateMatrixWorld(true);
  const g = m.geometry, pa = g.attributes.position, idx = g.index, n = idx ? idx.count : pa.count, W = [];
  const v = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, top = -1e9;
  for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); W.push(v.x, v.y, v.z); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); top = Math.max(top, v.y); }
  const pad = 0.4; x0 -= pad; z0 -= pad; x1 += pad; z1 += pad;
  const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell), h = new Float32Array(nx * nz).fill(-Infinity);
  for (let t = 0; t < n; t += 3) {
    const a = (idx ? idx.getX(t) : t) * 3, b = (idx ? idx.getX(t + 1) : t + 1) * 3, c = (idx ? idx.getX(t + 2) : t + 2) * 3;
    const ax = W[a], ay = W[a + 1], az = W[a + 2], bx = W[b], by = W[b + 1], bz = W[b + 2], cx = W[c], cy = W[c + 1], cz = W[c + 2];
    const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(den) < 1e-9) continue;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / cell)), i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - x0) / cell));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - z0) / cell)), j1 = Math.min(nz - 1, Math.floor((Math.max(az, bz, cz) - z0) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = x0 + (i + 0.5) * cell, pz = z0 + (j + 0.5) * cell;
      const l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / den, l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / den, l3 = 1 - l1 - l2;
      if (l1 < -0.02 || l2 < -0.02 || l3 < -0.02) continue;
      const y = l1 * ay + l2 * by + l3 * cy; if (y > h[j * nx + i]) h[j * nx + i] = y;
    }
  }
  // the vertices too, so that thin slivers are never missed
  for (let i = 0; i < W.length; i += 3) { const ci = Math.floor((W[i] - x0) / cell), cj = Math.floor((W[i + 2] - z0) / cell); if (ci >= 0 && cj >= 0 && ci < nx && cj < nz) h[cj * nx + ci] = Math.max(h[cj * nx + ci], W[i + 1]); }
  // widen by the swimmer: the highest point within reach of each cell
  const R = 0.3, k = Math.ceil(R / cell), d = new Float32Array(nx * nz).fill(-Infinity);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let best = -Infinity; for (let b = -k; b <= k; b++) for (let a = -k; a <= k; a++) { if ((a * a + b * b) * cell * cell > (R + cell * 0.7) ** 2) continue; const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; best = Math.max(best, h[jj * nx + ii]); } d[j * nx + i] = best; }
  return { x0, z0, nx, nz, cell, h: d, top, cx: m.position.x, cz: m.position.z };
}

function buildSea() {
  O.sea = grp(); O.rockCols = []; O.fanCols = [];
  // the sand, out to where the dark swallows it
  { const g = new THREE.CircleGeometry(70, 64); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, (fbm(x * 0.15, y * 0.15, 3) - 0.5) * 0.35 * clamp((Math.hypot(x, y) - 6) / 10, 0, 1)); } g.computeVertexNormals(); uvScale(g, 1 / 3, 1 / 3);
    const s = new THREE.Mesh(g, M.sand); s.rotation.x = -Math.PI / 2; s.receiveShadow = true; O.sea.add(s); }
  // the reef: a wall of coral rock to the east and south-east, rising out of the dark
  for (let i = 0; i < 26; i++) { const a = -0.7 + i / 25 * 2.2, R = 17 + hash1(i * 3.3) * 5; const x = Math.cos(a) * R + 4, z = Math.sin(a) * R; const s = 2.2 + hash1(i * 7.1) * 3.2; const m = mesh(rockGeo(s, 2, i, 1.1 + hash1(i) * 0.6), M.rock, x, s * 0.5 - 0.6, z, O.sea); m.rotation.y = hash1(i * 5) * 6; if (Math.hypot(x - 4.5, z + 2.5) - s * 1.4 < SWIM_R + 0.5) O.rockCols.push(rockField(m, 0.25)); }
  // coral heads and boulders on the sand round the station
  const spots = [[-6, -5, 0.9], [-8, 3, 1.3], [4, 7, 0.8], [12, 6, 1.1], [15, -5, 1.4], [-4, 9, 0.7], [10, -11, 1.2], [-10, -9, 1.0], [2, -12, 0.9], [17, 2, 1.0]];
  spots.forEach(([x, z, s], i) => { const m = mesh(rockGeo(s, 2, 30 + i, 0.6), M.rock, x, s * 0.25, z, O.sea); m.rotation.y = i; O.rockCols.push(rockField(m, 0.1));
    // a sea fan on some of them
    if (i % 3 === 0) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0 * s, 0.9 * s), std({ map: T.fan, alphaTest: 0.4, side: THREE.DoubleSide, color: 0xb05a3a, roughness: 0.9 })); f.position.set(x + 0.2, s * 0.55 + 0.35 * s, z); f.rotation.y = i * 0.7; O.sea.add(f); O.fanCols.push({ x: x + 0.2, z, rot: i * 0.7, hx: 0.5 * s, y0: f.position.y - 0.45 * s, y1: f.position.y + 0.45 * s }); }
    // urchins at the foot
    for (let k = 0; k < 2; k++) { const u = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), M.black); u.position.set(x + s * 0.7 * Math.cos(k * 2 + i), 0.06, z + s * 0.7 * Math.sin(k * 2 + i)); O.sea.add(u); for (let j = 0; j < 10; j++) { const sp = pole([0, 0, 0], [0, 0.18, 0], 0.004, M.black, u, 3, 0.001); sp.rotation.set(hash1(j + k) * 6, hash1(j * 3) * 6, 0); } }
  });
  // the guideline: yellow line from the wet room's north-west leg out to the wreck, into the dark
  O.guide = tube([[-1.75, 0.4, -1.75], [-3.0, 0.25, -4.0], [-6.0, 0.2, -9.0], [-10.0, 0.15, -16.0], [-14.0, 0.1, -24.0]], 0.012, M.rope, O.sea, 60, 5);
  // fish: little silver shoals that circle in the floodlight
  { const fg = new THREE.BufferGeometry(); const pos = [0, 0, 0.09, 0.025, 0.012, 0, -0.025, 0.012, 0, 0, 0.025, -0.02, 0, -0.012, -0.03, 0, 0, -0.06, 0.02, 0.018, -0.1, -0.02, 0.018, -0.1, 0, 0, -0.06];
    fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setIndex([0, 1, 3, 0, 3, 2, 0, 4, 1, 0, 2, 4, 1, 3, 5, 3, 2, 5, 1, 5, 4, 4, 5, 2, 5, 6, 7]); fg.computeVertexNormals();
    O.fish = new THREE.InstancedMesh(fg, std({ color: 0xc8d0d8, roughness: 0.3, metalness: 0.7, envMapIntensity: 0.8, side: THREE.DoubleSide }), 70); O.fish.userData.noRay = true; O.fish.frustumCulled = false; O.fish.layers.set(1); O.sea.add(O.fish);
    O.fishP = []; for (let i = 0; i < 70; i++) { const sch = i % 3; const c = [[7.6, 3.0, -6.6], [1.0, 2.6, 5.0], [-3.0, 1.5, -2.0]][sch]; O.fishP.push({ c: new THREE.Vector3(c[0], c[1], c[2]), r: 1.2 + hash1(i * 3) * 1.6, sp: (0.25 + hash1(i * 7) * 0.2) * (sch === 1 ? -1 : 1), ph: hash1(i * 11) * TAU, y: (hash1(i * 13) - 0.5) * 0.9, s: 0.8 + hash1(i * 17) * 0.6 }); } }
  // marine snow drifting everywhere
  { const n = IS_TOUCH ? 700 : 1600, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = rand(-12, 22); p[i * 3 + 1] = rand(0, 9); p[i * 3 + 2] = rand(-16, 12); } g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    O.snow = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9ab0aa, size: 0.018, sizeAttenuation: true, transparent: true, opacity: 0.22, depthWrite: false, fog: true })); O.snow.userData.noRay = true; O.snow.layers.set(1); O.snow.frustumCulled = false; O.sea.add(O.snow); }
  // a shark, now and then, at the edge of the light
  { const parts = [{ geo: new THREE.SphereGeometry(0.28, 12, 8), m: m4(0, 0, 0, 0, 0, 0, 1, 0.9, 4.2), color: 0x5a6068 }, { geo: new THREE.ConeGeometry(0.28, 0.6, 4), m: m4(0, 0.32, -0.1, -0.3, 0, 0, 0.12, 1, 1), color: 0x4a5058 }, { geo: new THREE.ConeGeometry(0.3, 0.7, 4), m: m4(0, 0.15, -1.45, -1.1, 0, 0, 0.1, 1, 1), color: 0x4a5058 }, { geo: new THREE.ConeGeometry(0.22, 0.6, 4), m: m4(0, -0.18, -1.38, -2.2, 0, 0, 0.1, 1, 1), color: 0x4a5058 }, { geo: new THREE.ConeGeometry(0.2, 0.55, 4), m: m4(0.35, -0.12, 0.25, 0, 0, -1.9, 0.1, 1, 1), color: 0x4a5058 }, { geo: new THREE.ConeGeometry(0.2, 0.55, 4), m: m4(-0.35, -0.12, 0.25, 0, 0, 1.9, 0.1, 1, 1), color: 0x4a5058 }];
    O.shark = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 0.6 })); O.shark.visible = false; O.shark.userData.noRay = true; O.sea.add(O.shark); }
  // bubbles: a pool of sprites, for the bell filling and the station burping
  O.bubbles = []; for (let i = 0; i < 48; i++) { const s = new THREE.Sprite(M.bubble); s.visible = false; s.userData.noRay = true; s.layers.set(1); O.sea.add(s); O.bubbles.push({ s, life: 0 }); }
}
function bubble(pos, size = 0.06, up = 1.0) { const b = O.bubbles.find(x => x.life <= 0); if (!b) return; b.life = 3 + Math.random() * 2; b.vy = up * rand(0.8, 1.4); b.s.position.copy(pos); b.s.scale.set(size, size, size); b.s.visible = true; b.wob = rand(0, TAU); }
function bubblesUpdate(dt) { for (const b of O.bubbles) { if (b.life <= 0) continue; b.life -= dt; b.s.position.y += b.vy * dt; b.s.position.x += Math.sin(G.time * 5 + b.wob) * dt * 0.08; if (b.life <= 0 || b.s.position.y > 9) { b.life = 0; b.s.visible = false; } } }

/* ---------- the diving bell ---------- */
function buildBell() {
  const g = grp(BELL.x, 0, BELL.z, scene); O.bellG = g; g.userData.keep = true;
  const B = grp(0, BELL.cy, 0, g); O.bellBody = B;          // the sphere and everything that rises with it
  const hole = 0.33;
  // the hull: orange outside; inside, cream paint; a round door hole at the bottom
  const out = new THREE.Mesh(new THREE.SphereGeometry(BELL.r, 48, 28, 0, TAU, 0, Math.PI - hole), M.bell); out.castShadow = true; out.receiveShadow = true; B.add(out); O.bellOut = out;
  const inn = new THREE.Mesh(new THREE.SphereGeometry(BELL.r - 0.05, 40, 24, 0, TAU, 0, Math.PI - hole), M.bellIn); inn.receiveShadow = true; B.add(inn);
  const rimY = -Math.cos(hole) * BELL.r; torus(Math.sin(hole) * BELL.r - 0.01, 0.035, M.steel, 0, rimY + 0.01, 0, B, 28, 6).rotation.x = Math.PI / 2;
  // the viewport: a thick round window looking out at the station (toward the bunk room)
  const dir = new THREE.Vector3(BUNK_WIN_X - BELL.x, 0, -1.7 - BELL.z).normalize(); O.bellViewDir = dir; const vpA = Math.atan2(dir.z, dir.x);
  { const p = dir.clone().multiplyScalar(BELL.r - 0.03); const vg = grp(p.x, p.y, p.z, B); vg.lookAt(new THREE.Vector3(BELL.x, BELL.cy, BELL.z).add(p).add(dir)); torus(0.19, 0.03, M.steel, 0, 0, 0.0, vg, 24, 6); torus(0.19, 0.025, M.steel, 0, 0, -0.05, vg, 24, 6);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), M.glassThin); gl.userData.noRay = true; gl.layers.set(1); vg.add(gl); O.bellVP = vg;
    // the viewport is a real hole: cut it out of both skins with a disc of "nothing" (the skins are drawn after this)
    for (const sk of [out, inn]) { sk.material = sk.material.clone(); sk.material.onBeforeCompile = sh => { sh.uniforms.vpDir = { value: dir }; sh.vertexShader = 'varying vec3 vLP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position;'); sh.fragmentShader = 'uniform vec3 vpDir; varying vec3 vLP;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (dot(normalize(vLP), vpDir) > 0.983) discard;'); }; } }
  // a ring round its middle, the lifting eye and cable on top, the frame it sits in
  torus(Math.sqrt(1 - 0.3 * 0.3) * BELL.r + 0.03, 0.04, M.steel, 0, -0.3, 0, B, 48, 6).rotation.x = Math.PI / 2;
  const eye = torus(0.08, 0.025, M.steel, 0, BELL.r + 0.12, 0, B, 16, 6); cyl(0.06, 0.08, 0.12, M.steel, 0, BELL.r + 0.02, 0, B, 12);
  O.bellCable = pole([0, BELL.r + 0.2, 0], [0, 45, 0], 0.012, M.steelDark, B, 6);
  // its gas bottles strapped on the side, and two lead ballast weights hung from the ring that drop when released
  { const bm = std({ map: T.tank, normalMap: T.tankN, color: 0x55625a, roughness: 0.5, metalness: 0.2 });
    for (const s of [-1, 0, 1]) { const a = vpA + Math.PI + s * 0.32; const b = grp(Math.cos(a) * 1.14, -0.32, Math.sin(a) * 1.14, B);
      lathe([[0, 0], [0.085, 0], [0.09, 0.03], [0.09, 0.68], [0.07, 0.76], [0.03, 0.8], [0.025, 0.86], [0, 0.86]], bm, 0, 0, 0, b, 16);
      lathe([[0.091, 0.6], [0.091, 0.68], [0.071, 0.76], [0.031, 0.8], [0, 0.805]], M.band.white, 0, 0, 0, b, 16);
      cyl(0.018, 0.018, 0.06, M.brass, 0, 0.88, 0, b, 8); torus(0.03, 0.007, M.black, 0, 0.92, 0, b, 10, 4).rotation.x = Math.PI / 2;
      for (const y of [0.18, 0.52]) torus(0.093, 0.008, M.black, 0, y, 0, b, 18, 4).rotation.x = Math.PI / 2;
      tube([[0, 0.9, 0], [0, 1.0, 0], [-Math.cos(a) * 0.12, 1.08, -Math.sin(a) * 0.12]], 0.008, M.black, b, 6, 4); } }
  // a yoke over the top: four struts up to the lifting eye
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + vpA + Math.PI / 4; pole([Math.cos(a) * 0.5, 0.866, Math.sin(a) * 0.5], [0, 1.06, 0], 0.022, M.steel, B, 6); cyl(0.04, 0.04, 0.03, M.steel, Math.cos(a) * 0.5, 0.87, Math.sin(a) * 0.5, B, 8); }
  O.ballast = []; for (const s of [-1, 1]) { const w = grp(s * (BELL.r + 0.15), -0.55, -0.2, B); bev(0.24, 0.42, 0.34, M.lead, 0, 0, 0, w, 0.02); pole([0, 0.21, 0], [0, 0.55, 0], 0.012, M.steel, w, 6); O.ballast.push(w); w.userData.home = w.position.clone(); }
  O.bellFrame = grp(0, 0, 0, g);
  { const pm = std({ color: 0x6e6c64, roughness: 1, map: T.rock }); const pl = mbox(PLINTH.w, PLINTH.h, PLINTH.w, pm, 0, PLINTH.h / 2, 0, O.bellFrame, 1); pl.rotation.y = -vpA; pl.receiveShadow = pl.castShadow = true;
    for (const [x, z] of [[-0.8, -0.8], [0.8, 0.8], [0.8, -0.8], [-0.8, 0.8]]) torus(0.06, 0.016, M.steelDark, x * Math.cos(vpA) + z * Math.sin(vpA), PLINTH.h + 0.05, -x * Math.sin(vpA) + z * Math.cos(vpA), O.bellFrame, 10, 4); }
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + vpA + Math.PI / 4; pole([Math.cos(a) * 1.0, PLINTH.h, Math.sin(a) * 1.0], [Math.cos(a) * 0.95, BELL.cy - 0.45, Math.sin(a) * 0.95], 0.05, M.hullOut, O.bellFrame, 8); cyl(0.14, 0.16, 0.05, M.hullOut, Math.cos(a) * 1.0, PLINTH.h + 0.025, Math.sin(a) * 1.0, O.bellFrame, 12); }
  torus(0.94, 0.045, M.hullOut, 0, BELL.cy - 0.45, 0, O.bellFrame, 40, 6).rotation.x = Math.PI / 2;
  // the clip point for him: a big shackle on the frame ring, on the side facing the station
  O.bellClip = grp(-0.45, -0.72, 0.9, B); torus(0.05, 0.012, M.steel, 0, 0, 0, O.bellClip, 12, 5);
  /* inside: the grating, the bench, a lamp, the door and its wheel, the release */
  const yF = BELL_FLOOR - BELL.cy;
  { const rr = Math.sqrt((BELL.r - 0.05) ** 2 - yF * yF); const gr = new THREE.Mesh(ringGeo(hole + 0.04, rr, 32), std({ map: T.deck, normalMap: T.deckN, color: 0x8a8a88, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide })); gr.rotation.x = -Math.PI / 2; gr.position.y = yF; B.add(gr); }
  { const bench = bev(0.7, 0.04, 0.26, M.wood, 0, yF + 0.42, -0.55, B, 0.01); pole([-0.3, yF, -0.55], [-0.3, yF + 0.4, -0.55], 0.015, M.steel, B, 6); pole([0.3, yF, -0.55], [0.3, yF + 0.4, -0.55], 0.015, M.steel, B, 6); }
  { const lg = grp(0.3, 0.55, -0.62, B); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M.bulbWarm); lg.add(bulb); O.bellBulb = bulb; torus(0.05, 0.004, M.steel, 0, 0, 0, lg, 12, 4); }
  // a gauge on the wall
  { const gg = grp(-0.55, 0.3, -0.62, B); gg.lookAt(new THREE.Vector3(BELL.x, BELL.cy, BELL.z)); cyl(0.07, 0.07, 0.03, M.steel, 0, 0, 0, gg, 20).rotation.x = Math.PI / 2; O.bellGauge = gg; }
  // the door: a steel disc hinged at the edge of the hole, swung up open inside; a wheel to dog it
  { const hg = grp(-hole - 0.02, rimY + 0.03, 0, B); O.bellDoorHinge = hg; const d = grp(hole + 0.02, 0, 0, hg); O.bellDoor = d;
    cyl(hole + 0.03, hole + 0.03, 0.04, M.steel, 0, 0, 0, d, 28); const wg = grp(0, 0.04, 0, d); O.bellDoorWheel = wg; torus(0.1, 0.012, M.steel, 0, 0, 0, wg, 16, 5).rotation.x = Math.PI / 2; for (let k = 0; k < 3; k++) { const sp = mbox(0.2, 0.01, 0.01, M.steel, 0, 0, 0, wg, 1); sp.rotation.y = k * Math.PI / 3; }
    hg.rotation.z = 1.75; }
  // the release: a brass socket for the chief's key, and a red-painted plate under it
  { const rg = grp(0.62, 0.05, -0.3, B); rg.lookAt(new THREE.Vector3(BELL.x, BELL.cy + 0.05, BELL.z - 0.0)); O.bellRelease = rg; bev(0.16, 0.2, 0.02, std({ color: 0x8a1a10, roughness: 0.6 }), 0, 0, 0, rg, 0.006); cyl(0.03, 0.03, 0.04, M.brass, 0, 0.02, 0.02, rg, 12).rotation.x = Math.PI / 2;
    O.bellKey = grp(0, 0.02, 0.06, rg); pole([0, 0, 0], [0, 0, 0.1], 0.008, M.brass, O.bellKey, 6); mbox(0.08, 0.014, 0.014, M.brass, 0, 0, 0.1, O.bellKey, 1); O.bellKey.visible = false; }
}

/* ---------- you: on the line under the station ---------- */
// a head with a face in it: a sphere pushed in and out to the features painted on T.face (front at u = 0.25)
function headGeo(R) {
  const g = new THREE.SphereGeometry(R, 112, 84), p = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
  const bump = (x, y, cx, cy, rx, ry) => Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone().normalize();
    let px = uv.getX(i) * 512; const py = (1 - uv.getY(i)) * 256; px = ((px - 128 + 256) % 512 + 512) % 512 - 256;   // pixels from the middle of the face
    const front = clamp(n.z * 1.6, 0, 1);
    let d = 0;
    d += 0.15 * bump(px, py, 0, 150, 8, 7) + 0.09 * bump(px, py, 0, 136, 5.5, 14);                   // the nose, its ridge
    for (const s of [-1, 1]) { d += 0.035 * bump(px, py, s * 6, 154, 5, 4);                          // nostrils' wings
      d -= 0.075 * bump(px, py, s * 22, 126, 13, 9);                                                 // eye sockets
      d += 0.045 * bump(px, py, s * 22, 126, 7, 4.5);                                               // the eyeballs in them
      d += 0.05 * bump(px, py, s * 36, 146, 14, 12);                                                 // cheekbones
      d -= 0.04 * bump(px, py, s * 44, 168, 14, 22); }                                               // hollow cheeks
    d += 0.05 * bump(px, py, 0, 110, 40, 6);                                                         // brow
    d += 0.04 * bump(px, py, 0, 168, 16, 5) + 0.035 * bump(px, py, 0, 177, 13, 4) - 0.05 * bump(px, py, 0, 172, 9, 3);   // lips, a little apart
    d += 0.07 * bump(px, py, 0, 196, 15, 10);                                                        // chin
    const jaw = py > 150 ? 1 - 0.12 * clamp((py - 150) / 60, 0, 1) * front : 1;                       // the jaw narrows
    v.multiplyScalar(1 + d * front); v.x *= jaw; p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
function buildBody() {
  const g = grp(-1.45, 1.75, -2.0, scene); O.body = g; g.userData.keep = true;
  const pivot = grp(0, 0, 0, g); O.bodyPivot = pivot;     // the whole of him turns and sways about his chest
  const suit = M.suit, skin = M.dead, strap = M.black;
  const cap = (r, len, mat, par, x, y, z) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat); m.position.set(x, y, z); par.add(m); return m; };
  // torso, chest to hips, in black neoprene
  { const t = lathe([[0, -0.4], [0.1, -0.395], [0.135, -0.35], [0.14, -0.25], [0.13, -0.12], [0.145, 0.0], [0.165, 0.12], [0.17, 0.2], [0.15, 0.27], [0.09, 0.32], [0.055, 0.34], [0, 0.345]], suit, 0, 0, 0, pivot, 24); t.scale.set(1.16, 1, 0.7);
    for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), suit); sh.position.set(s * 0.165, 0.24, 0); sh.scale.set(1, 0.85, 0.9); pivot.add(sh); }
    // the harness and the weight belt
    for (const s of [-1, 1]) { const st = tube([[s * 0.1, 0.3, 0.06], [s * 0.11, 0.12, 0.125], [s * 0.1, -0.1, 0.11], [s * 0.09, -0.26, 0.1]], 0.012, strap, pivot, 10, 4); }
    torus(0.15, 0.016, strap, 0, -0.27, 0, pivot, 24, 5).rotation.x = Math.PI / 2;
    const belt = torus(0.148, 0.022, strap, 0, -0.33, 0, pivot, 24, 5); belt.rotation.x = Math.PI / 2; belt.scale.set(1.12, 0.72, 1);
    for (const a of [-0.9, -0.3, 0.3, 0.9]) bev(0.07, 0.05, 0.03, M.lead, Math.sin(a) * 0.165, -0.33, Math.cos(a) * 0.105, pivot, 0.006).rotation.y = a;
    bev(0.07, 0.05, 0.018, M.steel, 0, -0.33, 0.115, pivot, 0.004);   // the buckle
  }
  // the neck, and the head lolling back a little: no mask, the eyes open
  cap(0.056, 0.07, skin, pivot, 0, 0.37, 0.0).rotation.x = -0.25;
  const head = grp(0, 0.47, 0.02, pivot); O.bodyHead = head; head.rotation.set(-0.3, 0.12, 0.14);
  { const f = new THREE.Mesh(headGeo(0.105), std({ map: T.face, color: 0xa8b0b4, roughness: 0.5, envMapIntensity: 0.4 })); f.scale.set(0.85, 1.1, 1.0); f.castShadow = true; head.add(f); O.bodyFace = f;
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skin); e.scale.set(0.45, 1, 0.8); e.position.set(s * 0.096, -0.005, -0.008); head.add(e); }
    // his hair, cropped, and lifting in the water
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.111, 28, 16, 0, TAU, 0, 1.55), M.hair); hr.scale.set(0.93, 1.12, 1.04); hr.position.set(0, 0.008, -0.016); hr.rotation.x = -0.62; head.add(hr);
    const hm = M.hair.clone(); hm.side = THREE.DoubleSide;
    for (let k = 0; k < 22; k++) { const a = hash1(k * 5.3) * TAU, b = 0.15 + hash1(k * 2.1) * 0.6; const s = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.05 + hash1(k) * 0.03), hm); const dx = Math.sin(b) * Math.cos(a), dy = Math.cos(b), dz = Math.sin(b) * Math.sin(a) - 0.25; s.position.set(dx * 0.1, dy * 0.11 + 0.025, dz * 0.1); s.rotation.set(rand(-0.5, 0.5), a, rand(-0.4, 0.4)); head.add(s); O.bodyHair = O.bodyHair || []; O.bodyHair.push(s); } }
  // arms floating up in front of him, the elbows a little bent, the hands hanging open
  O.bodyArms = []; O.bodyLimbs = [];   // each limb's joints, root to tip, so that a swimmer bumps into him and not through him
  for (const s of [-1, 1]) {
    const sh = grp(s * 0.175, 0.24, 0, pivot); cap(0.05, 0.2, suit, sh, 0, -0.15, 0);
    const el = grp(0, -0.3, 0, sh); cap(0.043, 0.19, suit, el, 0, -0.13, 0);
    const wr = grp(0, -0.265, 0, el); const hand = grp(0, 0, 0, wr); O.bodyLimbs.push([sh, el, wr, grp(0, -0.1, 0, hand)]);
    const palm = bev(0.075, 0.085, 0.026, skin, 0, -0.045, 0, hand, 0.01); palm.scale.x = 0.95;
    for (let f = 0; f < 4; f++) { const fg = grp(-0.027 + f * 0.018, -0.088, 0, hand); fg.rotation.x = -0.35 - f * 0.08; cap(0.0085, 0.038 - Math.abs(f - 1.5) * 0.004, skin, fg, 0, -0.026, 0); }
    const th = grp(s * -0.035, -0.035, 0.012, hand); th.rotation.set(-0.3, 0, s * 0.7); cap(0.01, 0.03, skin, th, 0, -0.022, 0);
    sh.rotation.set(-1.45 + s * 0.08, 0, s * 0.38); el.rotation.set(-0.45, 0, 0); wr.rotation.set(0.55, 0, s * 0.15);
    O.bodyArms.push(sh);
  }
  // the line round his right arm
  torus(0.056, 0.006, M.rope, 0, -0.1, 0, O.bodyArms[1], 14, 4).rotation.x = Math.PI / 2 + 0.3;
  // legs trailing, the knees bent; one fin still on, one bare grey foot
  for (const s of [-1, 1]) {
    const hp = grp(s * 0.085, -0.38, 0, pivot); cap(0.072, 0.28, suit, hp, 0, -0.2, 0);
    const kn = grp(0, -0.42, 0, hp); cap(0.058, 0.28, suit, kn, 0, -0.19, 0); O.bodyLimbs.push([hp, kn, grp(0, -0.42, 0.04, kn)]);
    hp.rotation.set(-0.55 + s * 0.15, 0, s * 0.08); kn.rotation.set(0.95 - s * 0.2, 0, 0);
    if (s < 0) { const f = buildFin(); f.position.set(0, -0.4, 0.04); f.rotation.x = -Math.PI / 2 + 0.5; kn.add(f); }
    else { const ft = grp(0, -0.39, 0.02, kn); ft.rotation.x = 0.35; bev(0.08, 0.05, 0.2, skin, 0, 0, 0.06, ft, 0.02); }
  }
  // his tank on his back, with his name on it, and the line wound round it
  const tk = buildTank('yellow', 'FERRAND'); tk.position.set(0, -0.33, -0.19); tk.rotation.set(0.05, Math.PI, 0); pivot.add(tk);
  for (let k = 0; k < 2; k++) { const w = torus(0.2, 0.006, M.rope, 0, -0.1 - k * 0.17, -0.08, pivot, 20, 4); w.rotation.set(Math.PI / 2 + (k - 0.5) * 0.3, 0, k * 0.4); w.scale.set(1.05, 1, 1); }
  // the line from him to the leg of the station: tight when he's tangled, loose when you cut it
  O.bodyLine = tube([[-1.45, 1.8, -2.0], [-1.6, 1.3, -1.9], [-1.75, 0.9, -1.75]], 0.011, M.rope, scene, 12, 4); O.bodyLine.userData.keep = true;
  O.bodyLook = grp(0, 0.47, 0.08, pivot);   // a point at his face, for "is he in view"
  g.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
}

/* ---------- the four of them at the bunk-room window ---------- */
function buildCrew() {
  const g = grp(O.bunkWinPos.x, O.bunkWinPos.y, O.bunkWinPos.z, scene); g.lookAt(new THREE.Vector3(BELL.x, BELL.cy + 2.0, BELL.z)); O.crewG = g;   /* they look out toward the bell as it comes up past the glass */ g.visible = false; g.userData.keep = true;
  // a warm room behind them: a dim back wall
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), new THREE.MeshBasicMaterial({ color: 0x2a1608 })); back.position.z = -0.9; g.add(back);
  O.crewHeads = [];
  const spots = [[-0.08, 0.03, -0.32, 0], [0.09, 0.06, -0.38, 1], [0.0, -0.1, -0.4, 2], [-0.16, -0.08, -0.48, 3]];
  for (const [x, y, z, k] of spots) { const h = grp(x, y, z, g); const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 14), new THREE.MeshBasicMaterial({ map: T.crewFace[k] })); f.scale.set(0.9, 1.15, 1); h.add(f); const hr = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 10, 0, TAU, 0, 1.2), new THREE.MeshBasicMaterial({ color: [0x1a1410, 0x3a2a1a, 0x0a0806, 0x2a2420][k] })); hr.position.set(0, 0.025, -0.01); h.add(hr); O.crewHeads.push(h); }
  // Morel's hand, raised to the glass at the very end
  O.crewHand = grp(-0.02, -0.02, -0.16, g); const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0xc8906a })); O.crewHand.add(hand); for (let f = 0; f < 4; f++) { const fg = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.06, 0.014), new THREE.MeshBasicMaterial({ color: 0xc8906a })); fg.position.set(-0.03 + f * 0.02, 0.075, 0); O.crewHand.add(fg); } O.crewHand.visible = false;
  g.traverse(c => { c.userData.noRay = true; });
}

/* ---------- lights ---------- */
function buildLights() {
  L.hemi = new THREE.HemisphereLight(0x1a0402, 0x080202, 0.18); scene.add(L.hemi);
  // the red night lamps: one in the wet room (with shadows), two along the main module
  L.wet = new THREE.PointLight(0xff2008, 2.2, 7.5, 1.8); L.wet.position.set(0.95, WR.top - 0.32, 0.62);
  if (!IS_TOUCH) { L.wet.castShadow = true; L.wet.shadow.mapSize.set(512, 512); L.wet.shadow.bias = -0.004; L.wet.shadow.normalBias = 0.02; L.wet.shadow.camera.near = 0.05; L.wet.shadow.camera.far = 8; }
  scene.add(L.wet);
  L.mm1 = new THREE.PointLight(0xff2008, 1.8, 6.5, 1.8); L.mm1.position.set(5.0, MM.ay + 1.25, 0); scene.add(L.mm1);
  L.mm2 = new THREE.PointLight(0xff2008, 1.8, 6.5, 1.8); L.mm2.position.set(9.0, MM.ay + 1.25, 0); scene.add(L.mm2);
  // the hand lamp: a spot from the camera, red through its cap, white without it
  L.lamp = new THREE.SpotLight(0xff2010, 0, 14, 0.42, 0.55, 1.5); L.lamp.position.set(0.14, -0.14, 0); camera.add(L.lamp); L.lamp.target.position.set(0.04, -0.06, -2); camera.add(L.lamp.target);
  if (!IS_TOUCH) { L.lamp.castShadow = true; L.lamp.shadow.mapSize.set(512, 512); L.lamp.shadow.bias = -0.002; L.lamp.shadow.camera.near = 0.05; L.lamp.shadow.camera.far = 14; }
  // the floods: north (from the main module's roof, over the bell) and south (from the wet room's roof, over the banks)
  L.floodN = new THREE.SpotLight(0xcfe6ff, 0, 26, 0.72, 0.6, 1.3); L.floodN.position.set(8.6, MM.ay + MM.r + 0.4, -0.95); L.floodN.target.position.set(BELL.x - 0.2, BELL.cy - 1.2, BELL.z - 0.6); scene.add(L.floodN); scene.add(L.floodN.target);
  if (!IS_TOUCH) { L.floodN.castShadow = true; L.floodN.shadow.mapSize.set(1024, 1024); L.floodN.shadow.bias = -0.0015; L.floodN.shadow.camera.near = 0.5; L.floodN.shadow.camera.far = 26; }
  L.floodS = new THREE.SpotLight(0xcfe6ff, 0, 18, 0.8, 0.6, 1.3); L.floodS.position.set(-0.4, WR.top + 0.4, 2.25); L.floodS.target.position.set(0, 0, 5.5); scene.add(L.floodS); scene.add(L.floodS.target);
  // a cool fill on your face for the moment you see his (it stays dark otherwise)
  L.face = new THREE.PointLight(0xa8bcc4, 0, 3.0, 2); L.face.position.set(0.45, 0.35, 0.05); camera.add(L.face);
  // the bell's own little lamp
  L.bell = new THREE.PointLight(0xffc888, 0, 2.6, 1.6); L.bell.position.set(BELL.x + 0.3, BELL.cy + 0.45, BELL.z - 0.5); scene.add(L.bell);
  // the sun, for the photograph on the ship's deck at dawn only
  L.sun = new THREE.DirectionalLight(0xffe0b8, 0); L.sun.position.set(40, 212, -60); L.sun.target.position.set(0, 200, 0); scene.add(L.sun); scene.add(L.sun.target);
}

/* ---------- what you hold, the gauge on your strap, the mask ---------- */
function buildHands() {
  const mk = build => { const h = grp(0, 0, 0, camera); build(h); h.visible = false; h.traverse(c => { c.userData.noRay = true; c.frustumCulled = false; c.castShadow = false; }); return h; };
  // the hand lamp: a black rubber torch; its lens red through the cap
  O.lampHand = mk(h => { const b = cyl(0.04, 0.048, 0.2, M.rubber, 0, 0, 0, h, 14); b.rotation.x = Math.PI / 2; const head = cyl(0.058, 0.048, 0.06, M.rubber, 0, 0, -0.12, h, 14); head.rotation.x = Math.PI / 2; O.lampLensM = new THREE.Mesh(new THREE.CircleGeometry(0.052, 16), M.lampLens); O.lampLensM.position.z = -0.151; O.lampLensM.rotation.y = Math.PI; h.add(O.lampLensM); O.lampCap = cyl(0.06, 0.06, 0.03, std({ color: 0x8a1408, roughness: 0.25, transparent: true, opacity: 0.85 }), 0, 0, -0.16, h, 14); O.lampCap.rotation.x = Math.PI / 2; const sw = mbox(0.02, 0.012, 0.04, M.steel, 0, 0.045, 0.02, h, 1); });
  O.lampHand.position.set(0.22, -0.2, -0.42); O.lampHand.rotation.set(0.05, 0.08, 0);
  // the things you carry one at a time
  O.leadHand = mk(h => { bev(0.3, 0.12, 0.16, M.lead, 0, 0, 0, h, 0.012); });
  O.tankHand = mk(h => { const t = buildTank('yellow', ''); t.rotation.z = Math.PI / 2 - 0.2; t.position.set(0.35, 0, 0); h.add(t); });
  O.canHand = mk(h => { const c = cyl(0.17, 0.17, 0.62, std({ color: 0x8a8a84, roughness: 0.5, metalness: 0.6 }), 0, 0, 0, h, 18); c.rotation.z = Math.PI / 2 - 0.15; });
  // the pressure gauge on your tank strap, in the corner of your eye underwater: 190 bar, and it never moves
  O.gaugeHand = mk(h => { cyl(0.05, 0.05, 0.03, M.brass, 0, 0, 0, h, 20).rotation.x = Math.PI / 2; const f = new THREE.Mesh(new THREE.CircleGeometry(0.044, 24), std({ map: T.tankGauge, roughness: 0.3, emissive: 0x5a7a7a, emissiveIntensity: 0.6, emissiveMap: T.tankGauge })); f.position.z = 0.016; h.add(f); const hose = tube([[0, -0.05, 0], [0.02, -0.15, 0.02], [0.05, -0.3, 0.05]], 0.012, M.black, h, 10, 5); });
  O.gaugeHand.position.set(-0.2, -0.17, -0.36); O.gaugeHand.rotation.set(0.45, 0.35, 0.1);
}

/* ---------- the ship's deck at dawn, for the last photograph only ---------- */
function buildDeck() {
  const g = grp(0, 200, 0, scene); O.deckScene = g; g.visible = false;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900, 1, 1), phys({ color: 0x1a2a34, roughness: 0.15, normalMap: T.waterN, normalScale: new THREE.Vector2(0.6, 0.6), envMapIntensity: 1.2 })); sea.material.normalMap = T.waterN.clone(); sea.material.normalMap.repeat.set(220, 220); sea.material.normalMap.needsUpdate = true; sea.rotation.x = -Math.PI / 2; sea.position.y = -3.4; g.add(sea);
  O.dawnSky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: T.dawn, side: THREE.BackSide, fog: false })); O.dawnSky.position.y = -3; g.add(O.dawnSky);
  // the deck: grey steel plates, wet, a bulwark round it
  mbox(16, 0.2, 9, std({ map: T.deck, normalMap: T.deckN, color: 0x9a9a96, roughness: 0.35, metalness: 0.4 }), 0, -0.1, 0, g, 1.5);
  for (const z of [-4.4, 4.4]) mbox(16, 1.0, 0.12, M.paintDark, 0, 0.5, z, g, 1);
  mbox(0.12, 1.0, 9, M.paintDark, -8, 0.5, 0, g, 1);
  for (let x = -7; x <= 7; x += 1.4) { pole([x, 1.0, -4.4], [x, 1.3, -4.4], 0.02, M.steel, g, 5); }
  pole([-7.5, 1.3, -4.4], [7.5, 1.3, -4.4], 0.025, M.steel, g, 6);
  // the A-frame over the stern, its wire hanging
  pole([4.5, 0, -3.2], [6.2, 6.5, 0], 0.14, M.hullOut, g, 10); pole([4.5, 0, 3.2], [6.2, 6.5, 0], 0.14, M.hullOut, g, 10); cyl(0.2, 0.2, 1.0, M.steelDark, 6.2, 6.5, 0, g, 10).rotation.x = Math.PI / 2; pole([6.2, 6.4, 0], [5.0, 3.1, 0.3], 0.012, M.steelDark, g, 4);
  // a winch drum, coils of rope
  { const w = grp(-4.5, 0, 2.6, g); cyl(0.5, 0.5, 1.4, M.steelDark, 0, 0.6, 0, w, 20).rotation.x = Math.PI / 2; torus(0.4, 0.06, M.rope, -2.0, 0.08, 0, w, 20, 6).rotation.x = Math.PI / 2; torus(0.32, 0.06, M.rope, -2.0, 0.18, 0.05, w, 20, 6).rotation.x = Math.PI / 2; }
  // the shape under the tarpaulin, beside where the bell will stand: bare feet out of the end of it
  { const t = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 0.7, 16, 4, 8), std({ color: 0x6a6a5e, roughness: 0.95, map: T.canvas })); const p = t.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 - Math.pow(Math.abs(z) / 0.35, 2); const hump = Math.exp(-((x + 0.65) ** 2) * 6) * 0.12 + Math.exp(-((x - 0.1) ** 2) * 2) * 0.06; p.setY(i, y > 0 ? (y * clamp(k, 0, 1) + hump * clamp(k, 0, 1)) : -0.16); p.setZ(i, z * (1 + 0.15 * Math.sin(x * 3))); } t.geometry.computeVertexNormals(); t.position.set(1.2, 0.16, 1.6); t.rotation.y = 0.15; g.add(t);
    for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.09), M.dead); f.position.set(2.2 + Math.cos(0.15) * 0.02, 0.06, 1.75 + s * 0.08 - 0.15); f.rotation.set(0, 0.15, 0.6); g.add(f); } }
  // a puddle spreading from the bell's spot
  { const pd = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), phys({ color: 0x0a0a0a, roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false })); pd.rotation.x = -Math.PI / 2; pd.position.set(0, 0.006, 0); pd.scale.set(1.3, 1, 0.9); g.add(pd); }
  // bare wet footprints, going from the bell to the rail, and stopping
  for (let k = 0; k < 7; k++) { const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.26), std({ map: T.foot, transparent: true, depthWrite: false, roughness: 0.1, color: 0x101010 })); fp.rotation.set(-Math.PI / 2, 0, -0.5); fp.position.set(0.9 + k * 0.42, 0.008, -0.9 - k * 0.34 + (k % 2) * 0.12); g.add(fp); }
}
