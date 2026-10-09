/* =====================================================================
   SATURATION · part B: the station. The wet room round the moon pool, the tunnel, the main module
   (controls, galley, your berth), the bunk-room bulkhead, and the hull as seen from outside.
   ===================================================================== */
// a hull wall with real holes in it (portholes, hatches) cut by an alpha map; holes are given in world space
function hullWithHoles(geo, holes, uvOf, mat, wPx = 2048, hPx = 512) {
  const c = canv(wPx, hPx, (g, W2, H2) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#000';
    for (const h of holes) {
      const [u, v] = uvOf(h.p);
      const ru = h.ru, rv = h.rv;
      g.beginPath(); g.ellipse(u * W2, (1 - v) * H2, ru * W2, rv * H2, 0, 0, TAU); g.fill();
      if (h.wrap) { g.beginPath(); g.ellipse(u * W2 + W2, (1 - v) * H2, ru * W2, rv * H2, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(u * W2 - W2, (1 - v) * H2, ru * W2, rv * H2, 0, 0, TAU); g.fill(); }
    }
  });
  const a = tex(c, { srgb: false }); a.wrapS = a.wrapT = THREE.ClampToEdgeWrapping; a.anisotropy = 4;
  const m = mat.clone(); m.alphaMap = a; m.alphaTest = 0.5; m.transparent = false;
  return new THREE.Mesh(geo, m);
}
// the paint repeated in metres on a geometry whose UVs run 0..1
function paintFor(base, su, sv) { const m = base.clone(); for (const k of ['map', 'normalMap']) if (m[k]) { m[k] = m[k].clone(); m[k].needsUpdate = true; m[k].repeat.set(su, sv); } return m; }

// a porthole: a heavy steel ring each side of the wall, a short tube through it, thick glass
function porthole(par, pos, normal, r = 0.2, thick = 0.14) {
  const g = grp(pos.x, pos.y, pos.z, par); g.lookAt(pos.clone().add(normal));
  const ringIn = torus(r + 0.035, 0.035, M.steel, 0, 0, 0.0, g, 28, 8); ringIn.position.z = 0.02;
  const ringOut = torus(r + 0.03, 0.03, M.hullOut, 0, 0, 0, g, 24, 6); ringOut.position.z = -thick;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, thick, 24, 1, true), M.steelDark); t.rotation.x = Math.PI / 2; t.position.z = -thick / 2; g.add(t);
  // bolts round the inside ring
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; const b = cyl(0.011, 0.011, 0.02, M.steel, Math.cos(a) * (r + 0.07), Math.sin(a) * (r + 0.07), 0.025, g, 6); b.rotation.x = Math.PI / 2; }
  const glass = new THREE.Mesh(new THREE.CircleGeometry(r + 0.004, 28), M.glassThin); glass.position.z = -0.02; glass.userData.noRay = true; glass.layers.set(1); g.add(glass);
  return g;
}

function buildStation() {
  O.wet = grp(); O.mmG = grp(); O.ext = grp(); O.bunkG = grp();

  /* ---------- the wet room ---------- */
  const H = WR.top - FY;
  // holes in the wet room's wall: three portholes, and the hatch to the tunnel on the east
  const wHoles = [
    { p: POS.portN, ru: 0, rv: 0, r: 0.2 }, { p: POS.portS, ru: 0, rv: 0, r: 0.2 }, { p: POS.portW, ru: 0, rv: 0, r: 0.2 },
    { p: new THREE.Vector3(WR.r, FY + 0.08 + TUN.h / 2, 0), r: 0, w: TUN.w, h: TUN.h, oval: true },
  ];
  const wallUV = R => p => { const th = Math.atan2(p.x, p.z); return [((th % TAU) + TAU) % TAU / TAU, (p.y - FY) / H]; };
  for (const h of wHoles) { if (h.oval) { h.ru = (h.w / 2) / (TAU * WR.r); h.rv = (h.h / 2) / H; } else { h.ru = h.r / (TAU * WR.r); h.rv = h.r / H; } h.wrap = true; }
  {
    const geo = new THREE.CylinderGeometry(WR.r, WR.r, H, 96, 6, true);
    const m = hullWithHoles(geo, wHoles, wallUV(WR.r), paintFor(M.paintIn, TAU * WR.r / 1.4, H / 1.4), 3072, 512);
    m.position.set(0, FY + H / 2, 0); m.receiveShadow = true; O.wet.add(m); O.wetWall = m;
    // the outside skin (yellow), with the same holes, 10 cm further out
    const geo2 = new THREE.CylinderGeometry(WR.r + 0.1, WR.r + 0.1, H + 0.2, 96, 6, true);
    const holes2 = wHoles.map(h => Object.assign({}, h, { ru: h.ru * WR.r / (WR.r + 0.1), rv: h.rv * H / (H + 0.2) }));
    const m2 = hullWithHoles(geo2, holes2, p => { const th = Math.atan2(p.x, p.z); return [((th % TAU) + TAU) % TAU / TAU, (p.y - FY + 0.1) / (H + 0.2)]; }, paintFor(M.hullOut, TAU * WR.r / 2.5, H / 2.5), 3072, 512);
    m2.position.set(0, FY + H / 2, 0); O.ext.add(m2);
  }
  // the deck: tread plate round the pool, and its underside outside
  { const d = mesh(ringGeo(MP.r, WR.r, 64), M.deck, 0, FY, 0, O.wet); d.rotation.x = -Math.PI / 2; d.castShadow = false;
    const u = mesh(ringGeo(MP.r + 0.04, WR.r + 0.1, 48), M.hullOut, 0, FY - 0.16, 0, O.ext); u.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(WR.r + 0.1, WR.r + 0.1, 0.16, 48, 1, true), M.hullOut); rim.position.set(0, FY - 0.08, 0); O.ext.add(rim); }
  // the ceiling: a shallow steel dome, and outside the cap of the wet room
  { const c = new THREE.Mesh(new THREE.SphereGeometry(WR.r / Math.sin(0.62), 48, 8, 0, TAU, 0, 0.62), paintFor(M.paintIn, 6, 2)); const R = WR.r / Math.sin(0.62); c.position.set(0, WR.top - R * Math.cos(0.62), 0); O.wet.add(c);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry((WR.r + 0.1) / Math.sin(0.62), 48, 8, 0, TAU, 0, 0.62), paintFor(M.hullOut, 4, 2)); const R2 = (WR.r + 0.1) / Math.sin(0.62); c2.position.set(0, WR.top + 0.1 - R2 * Math.cos(0.62), 0); O.ext.add(c2); }
  // frames: vertical ribs round the wall (not across the portholes or the hatch), a stringer, a coaming at the foot
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU + 0.12, x = Math.sin(a) * (WR.r - 0.045), z = Math.cos(a) * (WR.r - 0.045);
    if (Math.abs(x) > 1.9 && Math.abs(z) < 0.85 && x > 0) continue;   // the hatch
    const rib = mbox(0.07, H - 0.1, 0.07, M.paintDark, x, FY + H / 2, z, O.wet, 0.5); rib.rotation.y = a;
  }
  torus(WR.r - 0.04, 0.035, M.paintDark, 0, FY + 2.05, 0, O.wet, 72, 6).rotation.x = Math.PI / 2;
  torus(WR.r - 0.03, 0.05, M.paintDark, 0, FY + 0.05, 0, O.wet, 72, 6).rotation.x = Math.PI / 2;
  // portholes
  porthole(O.wet, POS.portN.clone().setZ(-WR.r + 0.02), new THREE.Vector3(0, 0, 1));
  porthole(O.wet, POS.portS.clone().setZ(WR.r - 0.02), new THREE.Vector3(0, 0, -1));
  porthole(O.wet, POS.portW.clone().setX(-WR.r + 0.02), new THREE.Vector3(1, 0, 0));
  // the hatch frame on the east wall, its door swung back against the wall
  { const g = grp(WR.r - 0.02, FY + 0.08 + TUN.h / 2, 0, O.wet); g.rotation.y = -Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 40), M.steel); ring.scale.set(TUN.w / 2 + 0.04, TUN.h / 2 + 0.04, 1); g.add(ring);
    const door = grp(-(TUN.w / 2 + 0.06), 0, 0.04, g); door.rotation.y = -1.9;
    const leaf = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 32), M.paint); leaf.scale.set(TUN.w / 2 + 0.04, 1, TUN.h / 2 + 0.04); leaf.rotation.x = Math.PI / 2; leaf.position.x = TUN.w / 2 + 0.04; door.add(leaf);
    const wheel = torus(0.13, 0.014, M.steel, TUN.w / 2 + 0.04, 0, 0.06, door, 20, 6); for (let k = 0; k < 4; k++) { const sp = mbox(0.26, 0.012, 0.012, M.steel, TUN.w / 2 + 0.04, 0, 0.06, door, 1); sp.rotation.z = k * Math.PI / 4; }
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; mbox(0.05, 0.08, 0.04, M.steel, TUN.w / 2 + 0.04 + Math.cos(a) * (TUN.w / 2 + 0.02), Math.sin(a) * (TUN.h / 2 + 0.02), -0.02, door, 1); }
  }
  // pipes and cables round the top of the wall; the umbilical comes in through the dome
  for (const [r, y, rad] of [[WR.r - 0.12, FY + 2.32, 0.03], [WR.r - 0.18, FY + 2.42, 0.02], [WR.r - 0.1, FY + 2.48, 0.045]]) torus(r, rad, rad > 0.04 ? M.black : M.steel, 0, y, 0, O.wet, 72, 6, TAU * 0.86).rotation.x = Math.PI / 2;
  { const gl = cyl(0.13, 0.16, 0.18, M.steel, -0.9, WR.top - 0.25, -0.4, O.wet, 16); cyl(0.07, 0.07, 0.5, M.black, -0.9, WR.top - 0.5, -0.4, O.wet, 12);
    tube([[-0.9, WR.top - 0.7, -0.4], [-1.0, FY + 2.2, -0.9], [-1.5, FY + 2.36, -1.6], [-1.75, FY + 2.36, -1.62]], 0.045, M.black, O.wet, 24, 8); }
  // the red night lamp: a caged bulb under the dome
  { const g = grp(0.95, WR.top - 0.24, 0.62, O.wet); g.userData.keep = true; O.wetLampG = g;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), M.bulbRed); g.add(bulb); bulb.userData.noRay = true;
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; pole([Math.cos(a) * 0.075, 0.05, Math.sin(a) * 0.075], [Math.cos(a) * 0.075, -0.07, Math.sin(a) * 0.075], 0.004, M.steel, g, 4); }
    torus(0.075, 0.005, M.steel, 0, -0.07, 0, g, 16, 4).rotation.x = Math.PI / 2; cyl(0.06, 0.08, 0.06, M.steel, 0, 0.08, 0, g, 12);
    O.wetBulb = bulb; }

  /* ---------- the moon pool ---------- */
  O.poolG = grp(0, 0, 0, scene);
  // the coaming: a steel curb round the hole
  { const cm = lathe([[MP.r, FY - 0.02], [MP.r, FY + 0.12], [MP.r + 0.06, FY + 0.12], [MP.r + 0.07, FY + 0.0]], M.steel, 0, 0, 0, O.wet, 48); cm.receiveShadow = true; }
  // the skirt: a steel tube down to the sea, rusted inside; the ledge ring 1.62 m down; the outside of it
  { const sk = new THREE.Mesh(new THREE.CylinderGeometry(MP.r, MP.r, SKIRT, 40, 4, true), paintFor(M.paintIn, TAU * MP.r / 1.2, SKIRT / 1.2)); sk.material.color.setHex(0x6a5a4a); sk.position.set(0, FY - SKIRT / 2, 0); O.wet.add(sk);
    const so = new THREE.Mesh(new THREE.CylinderGeometry(MP.r + 0.04, MP.r + 0.04, SKIRT, 32, 1, true), M.hullOut); so.position.set(0, FY - SKIRT / 2 - 0.08, 0); O.ext.add(so);
    const ld = lathe([[0.56, FY - LEDGE_D - 0.08], [0.56, FY - LEDGE_D], [MP.r, FY - LEDGE_D], [MP.r, FY - LEDGE_D - 0.12]], M.steelDark, 0, 0, 0, O.wet, 40); ld.receiveShadow = true;
    const lo = lathe([[0.56, FY - SKIRT], [MP.r + 0.05, FY - SKIRT], [MP.r + 0.05, FY - SKIRT + 0.05], [0.56, FY - SKIRT + 0.05]], M.steelDark, 0, 0, 0, O.wet, 40);
    // the lower skirt below the ledge is narrower
    const sk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, SKIRT - LEDGE_D, 40, 1, true), M.steelDark); sk2.material = sk2.material.clone(); sk2.material.side = THREE.DoubleSide; sk2.position.set(0, FY - (LEDGE_D + SKIRT) / 2, 0); O.wet.add(sk2); }
  // the ladder down inside the skirt, on the west side
  { for (let k = 0; k < 7; k++) { const y = FY - 0.22 - k * 0.26; if (y < FY - LEDGE_D + 0.05) break; const r = pole([-MP.r + 0.08, y, -0.17], [-MP.r + 0.08, y, 0.17], 0.012, M.steel, O.wet, 6); }
    pole([-MP.r + 0.03, FY + 0.1, -0.17], [-MP.r + 0.03, FY - LEDGE_D + 0.05, -0.17], 0.015, M.steel, O.wet, 6); pole([-MP.r + 0.03, FY + 0.1, 0.17], [-MP.r + 0.03, FY - LEDGE_D + 0.05, 0.17], 0.015, M.steel, O.wet, 6); }
  // the handrail: posts and a rail round three quarters of the pool, open on the west where the ladder is
  { const rr = MP.r + 0.12; const arc0 = 0.45, arc1 = TAU - 0.45;
    for (let k = 0; k <= 5; k++) { const a = arc0 + (arc1 - arc0) * k / 5; pole([Math.cos(a + Math.PI) * rr, FY + 0.1, Math.sin(a + Math.PI) * rr], [Math.cos(a + Math.PI) * rr, FY + 0.98, Math.sin(a + Math.PI) * rr], 0.018, M.steel, O.wet, 8); }
    const rail = torus(rr, 0.02, M.steel, 0, FY + 0.98, 0, O.wet, 48, 8, arc1 - arc0); rail.rotation.set(Math.PI / 2, 0, Math.PI + arc0);
    const mid = torus(rr, 0.014, M.steel, 0, FY + 0.55, 0, O.wet, 48, 6, arc1 - arc0); mid.rotation.set(Math.PI / 2, 0, Math.PI + arc0); }
  // the water in the pool (its level moves)
  { O.water = new THREE.Mesh(new THREE.CircleGeometry(MP.r - 0.005, 40), M.water); O.water.rotation.x = -Math.PI / 2; O.water.userData.keep = true; O.water.receiveShadow = true; O.poolG.add(O.water);
    // below the surface it's black: a dark disc a little under the water stops you seeing the sand far below from above
    O.waterDark = new THREE.Mesh(new THREE.CircleGeometry(MP.r - 0.01, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.86, depthWrite: false })); O.waterDark.rotation.x = -Math.PI / 2; O.waterDark.userData.noRay = true; O.waterDark.layers.set(1); O.poolG.add(O.waterDark); }
  // the cover: a steel lid hinged on the east side, dogged shut, with lead on it and a crucifix on a chain
  { const hinge = grp(MP.r + 0.1, FY + 0.13, 0, scene); hinge.userData.keep = true; O.coverHinge = hinge;
    const lid = grp(-(MP.r + 0.1), 0, 0, hinge); O.cover = lid;
    const disc = mesh(new THREE.CylinderGeometry(MP.r + 0.1, MP.r + 0.1, 0.045, 40), M.steel, 0, 0.022, 0, lid); disc.material = M.steel.clone(); disc.material.color.setHex(0x6a6c6a);
    torus(MP.r + 0.08, 0.012, M.steelDark, 0, 0.047, 0, lid, 40, 4).rotation.x = Math.PI / 2;
    const ring = torus(0.06, 0.012, M.steel, -0.35, 0.06, 0, lid, 14, 5); ring.rotation.x = Math.PI / 2;
    // the dogs: four clamps on the rim that swing over the lid's edge
    O.dogs = []; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + Math.PI / 4; const d = grp(Math.cos(a) * (MP.r + 0.14), FY + 0.12, Math.sin(a) * (MP.r + 0.14), scene); d.userData.keep = true; d.userData.a = a; const arm = grp(0, 0, 0, d); mbox(0.12, 0.04, 0.05, M.steel, -0.04, 0.07, 0, arm, 1); pole([0.02, 0.05, 0], [0.02, 0.2, 0], 0.012, M.steel, arm, 6); cyl(0.022, 0.022, 0.1, M.steelDark, 0, 0.03, 0, d, 8); d.rotation.y = -a; O.dogs.push(d); d.userData.arm = arm; }
    for (let k = 0; k < 3; k++) mbox(0.06, 0.03, 0.08, M.steel, MP.r + 0.04, -0.02, -0.4 + k * 0.4, hinge, 1);
    // the lead: four blocks of it, stacked
    O.leads = []; const lp = [[-0.2, 0.05, -0.14], [0.08, 0.05, -0.2], [-0.12, 0.05, 0.16], [-0.08, 0.17, -0.02]];
    lp.forEach(([x, y, z], k) => { const b = grp(x, FY + 0.17 + (y - 0.05), z, scene); b.userData.keep = true; bev(0.3, 0.12, 0.16, M.lead, 0, 0.06, 0, b, 0.012); b.rotation.y = hash1(k * 9) * 0.8 - 0.4; O.leads.push(b); b.userData.home = b.position.clone(); b.userData.homeR = b.rotation.y; });
    // the crucifix on its chain, looped over a dog handle
    { const c = grp(0.52, FY + 0.32, 0.52, scene); c.userData.keep = true; O.crucifix = c;
      mbox(0.016, 0.11, 0.008, M.brass, 0, -0.1, 0, c, 1); mbox(0.07, 0.016, 0.008, M.brass, 0, -0.07, 0, c, 1);
      for (let k = 0; k < 8; k++) { const l = torus(0.007, 0.0018, M.brass, Math.sin(k * 0.4) * 0.02, -0.03 + k * 0.006, 0, c, 8, 4); l.rotation.y = k * 1.3; }
      c.rotation.y = 0.8; }
  }

  /* ---------- the wet room's things ---------- */
  // the gas wall: a steel board, five bank wheels with coloured collars and their gauges, three outlet wheels
  { const g = grp(POS.manifold.x, POS.manifold.y, POS.manifold.z, scene); g.lookAt(0, POS.manifold.y, 0); O.manifoldG = g; g.userData.keep = true;
    bev(1.32, 0.92, 0.03, M.paintGreen, 0, 0, -0.02, g, 0.01);
    pole([-0.6, -0.22, 0.04], [0.6, -0.22, 0.04], 0.02, M.steel, g, 10);          // the header
    pole([0.6, -0.22, 0.04], [0.6, -0.5, 0.04], 0.018, M.steel, g, 8);
    O.bankWheels = []; O.bankGauges = []; O.bankCollars = [];
    BANKS.forEach((b, k) => {
      const x = -0.52 + k * 0.2;
      pole([x, 0.46, 0.04], [x, -0.22, 0.04], 0.014, M.steel, g, 8);                 // the pipe in from the bank outside
      const col = cyl(0.026, 0.026, 0.07, M.band[b.col], x, 0.06, 0.04, g, 14); O.bankCollars.push(col);
      const wg = grp(x, -0.06, 0.08, g); const w = torus(0.05, 0.009, M.steel, 0, 0, 0, wg, 18, 6); for (let s = 0; s < 3; s++) { const sp = mbox(0.1, 0.008, 0.008, M.steel, 0, 0, 0, wg, 1); sp.rotation.z = s * Math.PI / 3; } cyl(0.012, 0.012, 0.04, M.steel, 0, 0, -0.02, wg, 8).rotation.x = Math.PI / 2;
      O.bankWheels.push(wg);
      const gg = grp(x, 0.27, 0.05, g); cyl(0.065, 0.065, 0.04, M.steel, 0, 0, 0, gg, 20).rotation.x = Math.PI / 2; O.bankGauges.push(gg);
    });
    O.outWheels = [];
    OUTLETS.forEach((o, k) => {
      const y = 0.18 - k * 0.22, x = 0.42;
      const wg = grp(x, y, 0.08, g); torus(0.055, 0.01, M.steel, 0, 0, 0, wg, 18, 6); for (let s = 0; s < 3; s++) { const sp = mbox(0.11, 0.009, 0.009, M.steel, 0, 0, 0, wg, 1); sp.rotation.z = s * Math.PI / 3; } O.outWheels.push(wg);
      pole([x, y, 0.04], [0.6, y, 0.04], 0.012, M.steel, g, 8);
    });
    pole([0.6, 0.18, 0.04], [0.6, -0.22, 0.04], 0.016, M.steel, g, 8);
    // the station pressure gauge, big, at the top right
    const sg = grp(0.42, 0.36, 0.05, g); cyl(0.085, 0.085, 0.04, M.steel, 0, 0, 0, sg, 24).rotation.x = Math.PI / 2; O.stationGauge = sg;
    // the bell hose goes out through the wall; the fill whip hangs down to the stand on the floor
    tube([[0.6, -0.5, 0.04], [0.62, -0.75, 0.12], [0.5, -1.0, 0.25], [0.38, -1.28, 0.3]], 0.012, M.black, g, 20, 6);
  }
  // the fill stand on the floor below it
  { const g = grp(POS.fill.x, FY, POS.fill.z, scene); g.lookAt(0, FY, 0); O.fillG = g; g.userData.keep = true;
    mbox(0.3, 0.05, 0.3, M.steelDark, 0, 0.025, 0.1, g, 1); torus(0.1, 0.012, M.steel, 0, 0.5, 0.1, g, 16, 4).rotation.x = Math.PI / 2; pole([0, 0.05, 0.22], [0, 0.55, 0.22], 0.012, M.steel, g, 6); }
  // the floods switch: a box with a big lever
  { const g = grp(POS.floods.x, POS.floods.y, POS.floods.z, scene); g.lookAt(0, POS.floods.y, 0); O.floodBox = g; g.userData.keep = true;
    bev(0.18, 0.24, 0.1, M.paintDark, 0, 0, 0.0, g, 0.01); O.floodLever = grp(0, 0, 0.06, g); mbox(0.025, 0.12, 0.025, M.black, 0, 0.05, 0.02, O.floodLever, 1); O.floodLever.rotation.x = 0.6; }
  // the dive rack: a rail with four suits hanging, masks on hooks, fins and weight belts
  O.suits = [];
  { const g = grp(-1.6, 0, -1.55, scene); g.lookAt(0, 0, 0); O.rackG = g;
    pole([-0.75, FY + 2.0, 0.12], [0.75, FY + 2.0, 0.12], 0.016, M.steel, g, 8);
    for (let k = 0; k < 4; k++) { const s = buildSuit(k); s.position.set(-0.56 + k * 0.37, FY + 1.98, 0.14); s.rotation.y = (hash1(k) - 0.5) * 0.3; g.add(s); O.suits.push(s); }
    O.masks = []; for (let k = 0; k < 4; k++) { const m = buildMask(); m.position.set(-0.56 + k * 0.37, FY + 2.12, 0.05); m.rotation.set(0.15, 0, 0); g.add(m); O.masks.push(m); }
    // a shelf below with fins
    mbox(1.5, 0.03, 0.3, M.paintDark, 0, FY + 0.42, 0.2, g, 1); for (let k = 0; k < 6; k++) { const f = buildFin(); f.position.set(-0.6 + k * 0.24, FY + 0.45, 0.2); f.rotation.y = 0.1; g.add(f); }
    for (let k = 0; k < 4; k++) { const b = mbox(0.06, 0.02, 0.5, M.black, -0.6 + k * 0.4, FY + 0.18, 0.22, g, 1); }
  }
  // the tank rack on the west wall: four crew tanks and a white one, and the empty slot that was yours
  O.tanks = [];
  { const g = grp(-2.02, FY, -0.32, scene); g.rotation.y = Math.PI / 2; O.tankRack = g;
    mbox(1.5, 0.05, 0.28, M.steelDark, 0, 0.9, -0.08, g, 1); mbox(1.5, 0.05, 0.28, M.steelDark, 0, 0.35, -0.08, g, 1);
    const names = ['MOREL', 'VASSEUR', 'HAMID', 'RIBES', '', 'O₂'];
    for (let k = 0; k < 6; k++) {
      if (k === 4) continue;   // your slot, empty
      const t = buildTank(k === 5 ? 'white' : 'yellow', names[k]); t.position.set(-0.62 + k * 0.25, 0.02, 0); g.add(t); t.userData.slot = k; O.tanks.push(t);
    }
  }
  // the dive locker: a tall steel locker with a door, the hand lamp on its shelf
  { const g = grp(POS.locker.x, FY, POS.locker.z, scene); g.lookAt(0, FY, 0); O.lockerG = g; g.userData.keep = true;
    bev(0.5, 1.9, 0.42, M.paintGreen, 0, 0.95, 0, g, 0.01);
    mbox(0.44, 0.02, 0.36, M.paintDark, 0, 1.25, 0.03, g, 1); mbox(0.44, 0.02, 0.36, M.paintDark, 0, 0.7, 0.03, g, 1);
    const door = grp(-0.24, 0.95, 0.215, g); O.lockerDoor = door; const leaf = bev(0.48, 1.86, 0.02, M.paintGreen, 0.24, 0, 0, door, 0.006); for (let k = 0; k < 4; k++) mbox(0.24, 0.012, 0.006, M.black, 0.24, 0.6 + k * 0.03, 0.012, door, 1); mbox(0.03, 0.12, 0.03, M.steel, 0.44, 0.0, 0.02, door, 1);
    // a coil of line and a lift bag inside
    torus(0.1, 0.022, M.rope, -0.08, 0.76, 0.06, g, 18, 6).rotation.x = Math.PI / 2; const bag = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), std({ color: 0xc83a1a, roughness: 0.8 })); bag.scale.set(1, 0.5, 0.8); bag.position.set(0.1, 0.77, 0.04); g.add(bag);
  }
  // the supply pot from the ship: a steel pressure pot with a clamped lid, a bleed screw and a tag
  { const g = grp(POS.pot.x, FY, POS.pot.z, scene); g.userData.keep = true; O.potG = g; g.lookAt(0, FY, 0);
    lathe([[0, 0], [0.2, 0], [0.21, 0.02], [0.21, 0.5], [0.23, 0.52], [0.23, 0.56], [0, 0.56]], M.steel, 0, 0, 0, g, 28).material = std({ color: 0x5a6a6a, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.6 });
    const lid = grp(0, 0.56, 0, g); O.potLid = lid; lathe([[0, 0], [0.235, 0], [0.235, 0.04], [0.12, 0.07], [0.04, 0.08], [0, 0.08]], M.steel, 0, 0, 0, lid, 28);
    torus(0.05, 0.01, M.steel, 0, 0.1, 0, lid, 12, 4);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; const c = grp(Math.cos(a) * 0.23, 0.0, Math.sin(a) * 0.23, g); mbox(0.03, 0.12, 0.04, M.steel, 0, 0.54, 0, c, 1); mbox(0.06, 0.02, 0.03, M.steel, 0, 0.62, 0, c, 1); c.rotation.y = -a; }
    O.purge = grp(0.12, 0.08, 0.05, lid); cyl(0.016, 0.016, 0.03, M.brass, 0, 0.0, 0, O.purge, 10); cyl(0.024, 0.024, 0.012, M.brass, 0, 0.02, 0, O.purge, 12);
    // the haul line, coiled beside it
    torus(0.16, 0.014, M.rope, 0.35, 0.02, 0.1, g, 20, 5).rotation.x = Math.PI / 2; torus(0.13, 0.014, M.rope, 0.35, 0.045, 0.1, g, 20, 5).rotation.x = Math.PI / 2;
    // inside: two canisters and a packet of post, shown when the lid comes off
    O.potCans = grp(0, 0.1, 0, g); O.potCans.visible = false; cyl(0.07, 0.07, 0.36, M.steel, -0.08, 0.2, 0, O.potCans, 14); cyl(0.07, 0.07, 0.36, M.steel, 0.08, 0.2, 0.02, O.potCans, 14); mbox(0.16, 0.03, 0.1, M.paper, 0, 0.42, -0.1, O.potCans, 1);
  }
  // the speaker box high on the wall, and the shower in its corner, and a bench
  { const g = grp(POS.speaker.x, POS.speaker.y, POS.speaker.z, scene); g.lookAt(0, POS.speaker.y - 0.4, 0); O.speakerG = g; g.userData.keep = true;
    bev(0.28, 0.2, 0.12, M.paintDark, 0, 0, 0, g, 0.01); const grill = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), M.black); grill.position.z = 0.062; g.add(grill); for (let k = 0; k < 5; k++) mbox(0.12, 0.006, 0.004, M.steel, 0, -0.04 + k * 0.02, 0.065, g, 1);
    O.speakerLamp = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), std({ color: 0x200400, emissive: 0xff4010, emissiveIntensity: 0, roughness: 0.4 })); O.speakerLamp.position.set(0.1, 0.07, 0.065); g.add(O.speakerLamp); }
  { const a = 2.45, x = Math.sin(a) * (WR.r - 0.1), z = Math.cos(a) * (WR.r - 0.1); const g = grp(x, FY, z, O.wet); g.lookAt(0, FY, 0);
    pole([0, FY + 2.0 - FY, 0], [0, FY + 2.2 - FY, 0], 0.012, M.chrome, g, 6); const rose = cyl(0.06, 0.03, 0.04, M.chrome, 0, 2.0, 0.12, g, 14); pole([0, 2.02, 0], [0, 2.02, 0.12], 0.01, M.chrome, g, 6); cyl(0.03, 0.03, 0.03, M.chrome, 0, 1.2, 0.02, g, 10).rotation.x = Math.PI / 2;
    const drain = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), M.steelDark); drain.rotation.x = -Math.PI / 2; drain.position.set(0, 0.005, 0.4); g.add(drain); }
  { const a = Math.PI + 0.3; const g = grp(Math.sin(a) * (WR.r - 0.25), FY, Math.cos(a) * (WR.r - 0.25), O.wet); g.lookAt(0, FY, 0); bev(0.9, 0.05, 0.32, M.wood, 0, 0.46, 0, g, 0.01); pole([-0.38, 0, -0.08], [-0.38, 0.44, -0.08], 0.015, M.steel, g, 6); pole([0.38, 0, -0.08], [0.38, 0.44, -0.08], 0.015, M.steel, g, 6); }

  /* ---------- the tunnel ---------- */
  { const len = TUN.x1 - TUN.x0 + 0.3, cx = (TUN.x0 + TUN.x1) / 2 + 0.05;
    const sh = new THREE.Shape(); const w = TUN.w / 2, hh = TUN.h;
    sh.moveTo(-w, 0); sh.lineTo(w, 0); sh.lineTo(w, hh - w); sh.absarc(0, hh - w, w, 0, Math.PI, false); sh.lineTo(-w, 0);
    const pts = sh.getPoints(24); const g = new THREE.BufferGeometry(); const pos = [], uv = []; let acc = 0; const L2 = pts.length;
    for (let i = 0; i < L2 - 1; i++) { const a = pts[i], b = pts[i + 1], s = a.distanceTo(b); for (const [p, u] of [[a, acc], [b, acc + s]]) { pos.push(-len / 2, p.y, p.x, len / 2, p.y, p.x); uv.push(u, 0, u, len); } acc += s; }
    const idx = []; for (let i = 0; i < L2 - 1; i++) { const o = i * 4; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const tm = new THREE.Mesh(g, M.paintIn); tm.material = M.paint.clone(); tm.material.side = THREE.DoubleSide; tm.position.set(cx, FY + 0.08, 0); tm.receiveShadow = true; O.wet.add(tm);
    mbox(len, 0.08, TUN.w, M.deck, cx, FY + 0.04, 0, O.wet, 1);
    // its outside
    const to = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, len, 20, 1, true), M.hullOut); to.rotation.z = Math.PI / 2; to.position.set(cx, FY + 1.0, 0); O.ext.add(to); }

  /* ---------- the main module ---------- */
  {
    const len = MM.x1 - MM.x0, cx = (MM.x0 + MM.x1) / 2;
    // the hull: a lying cylinder, seen from inside, with four portholes cut in it
    const ports = [[7.0, -1], [9.2, -1], [5.1, 1], [9.9, 1]].map(([x, s]) => { const yy = FY + 1.45, dz = Math.sqrt(MM.r * MM.r - (yy - MM.ay) * (yy - MM.ay)); return { x, s, p: new THREE.Vector3(x, yy, s * dz) }; });
    O.mmPorts = ports;
    const geo = new THREE.CylinderGeometry(MM.r, MM.r, len, 72, 8, true); geo.rotateZ(-Math.PI / 2);
    const uvOf = p => { const ly = p.x - cx, lx = -(p.y - MM.ay), lz = p.z; const th = Math.atan2(lx, lz); return [((th % TAU) + TAU) % TAU / TAU, ly / len + 0.5]; };
    const holes = ports.map(o => ({ p: o.p, ru: 0.2 / (TAU * MM.r), rv: 0.2 / len, wrap: true }));
    const hm = hullWithHoles(geo, holes, uvOf, paintFor(M.paintIn, TAU * MM.r / 1.4, len / 1.4), 2048, 1024); hm.position.set(cx, MM.ay, 0); hm.receiveShadow = true; O.mmG.add(hm);
    // outside skin
    const geo2 = new THREE.CylinderGeometry(MM.r + 0.1, MM.r + 0.1, len, 64, 4, true); geo2.rotateZ(-Math.PI / 2);
    const uvOf2 = p => { const ly = p.x - cx, lx = -(p.y - MM.ay), lz = p.z; const th = Math.atan2(lx, lz); return [((th % TAU) + TAU) % TAU / TAU, ly / len + 0.5]; };
    const hm2 = hullWithHoles(geo2, holes.map(h => Object.assign({}, h, { ru: 0.2 / (TAU * (MM.r + 0.1)) })), uvOf2, paintFor(M.hullOut, TAU * MM.r / 2.5, len / 2.5), 2048, 1024); hm2.position.set(cx, MM.ay, 0); O.ext.add(hm2);
    // the deck: lino, with a steel strip at its edges
    mbox(len, 0.04, 2 * MMW, M.lino, cx, FY - 0.02, 0, O.mmG, 1);
    for (const s of [-1, 1]) mbox(len, 0.06, 0.05, M.steel, cx, FY + 0.01, s * (MMW - 0.02), O.mmG, 1);
    // the space under the deck, closed off
    // frames: steel rings every 0.8 m above the deck
    for (let x = MM.x0 + 0.5; x < MM.x1 - 0.2; x += 0.8) { const a0 = Math.asin((FY - MM.ay) / MM.r); const t = torus(MM.r - 0.04, 0.035, M.paintDark, x, MM.ay, 0, O.mmG, 48, 6, Math.PI - 2 * a0); t.rotation.set(0, Math.PI / 2, 0); t.rotation.z = a0; t.rotation.order = 'YZX'; }
    // portholes
    for (const o of ports) { const n = new THREE.Vector3(0, -(o.p.y - MM.ay), -o.p.z).normalize(); porthole(O.mmG, o.p.clone().add(n.clone().multiplyScalar(-0.02)), n); }
    // the bulkhead at the west end, round the tunnel, and at the east end the bunk-room bulkhead
    for (const [x, ry] of [[MM.x0, Math.PI / 2], [MM.x1, -Math.PI / 2]]) {
      const sh = new THREE.Shape(); sh.absarc(0, 0, MM.r + 0.02, 0, TAU, false);
      if (x === MM.x0) { const hp = new THREE.Path(); const w = TUN.w / 2, h0 = FY + 0.08 - MM.ay, hh = TUN.h; hp.moveTo(-w, h0); hp.lineTo(-w, h0 + hh - w); hp.absarc(0, h0 + hh - w, w, Math.PI, 0, true); hp.lineTo(w, h0); hp.lineTo(-w, h0); sh.holes.push(hp); }
      else { const hp = new THREE.Path(); hp.absarc(POS.hatch.z, POS.hatch.y - MM.ay, 0.47, 0, TAU, true); sh.holes.push(hp); const pp = new THREE.Path(); const px = POS.pass.z, py = POS.pass.y - MM.ay; pp.moveTo(px - 0.17, py - 0.17); pp.lineTo(px + 0.17, py - 0.17); pp.lineTo(px + 0.17, py + 0.17); pp.lineTo(px - 0.17, py + 0.17); pp.lineTo(px - 0.17, py - 0.17); sh.holes.push(pp); }
      const bg = new THREE.ShapeGeometry(sh, 24); uvScale(bg, 0.8, 0.8);
      const bm = new THREE.Mesh(bg, paintFor(M.paint, 1, 1)); bm.material.side = THREE.DoubleSide; bm.position.set(x, MM.ay, 0); bm.rotation.y = ry; bm.receiveShadow = true; O.mmG.add(bm);
    }
    // pipes and cable runs along the top
    for (const [z, y, r, m] of [[-0.55, MM.ay + 1.45, 0.035, M.steel], [-0.45, MM.ay + 1.5, 0.025, M.steel], [0.5, MM.ay + 1.47, 0.045, M.black], [0.62, MM.ay + 1.4, 0.02, M.brass]]) pole([MM.x0 + 0.05, y, z], [MM.x1 - 0.05, y, z], r, m, O.mmG, 8);
    for (let x = MM.x0 + 0.9; x < MM.x1; x += 1.6) mbox(0.04, 0.12, 1.4, M.steelDark, x, MM.ay + 1.42, 0, O.mmG, 1);
    // two red night lamps under the crown
    O.mmBulbs = [];
    for (const x of [5.0, 9.0]) { const g = grp(x, MM.ay + 1.36, 0, scene); g.userData.keep = true; const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M.bulbRed); bulb.userData.noRay = true; g.add(bulb); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; pole([Math.cos(a) * 0.07, 0.04, Math.sin(a) * 0.07], [Math.cos(a) * 0.07, -0.07, Math.sin(a) * 0.07], 0.004, M.steel, g, 4); } torus(0.07, 0.005, M.steel, 0, -0.07, 0, g, 16, 4).rotation.x = Math.PI / 2; cyl(0.05, 0.07, 0.05, M.steel, 0, 0.07, 0, g, 12); O.mmBulbs.push(bulb); }
  }
  buildControls(); buildGalley(); buildBerth(); buildBulkhead(); buildExterior();
}

/* ---------- the control corner: gauges, the light switch, the intercom, the telephone, the scrubber ---------- */
function buildControls() {
  const z0 = -MMW;
  // a console against the north wall: sloped desk, gauge board above
  { const g = grp(POS.panel.x, FY, z0, scene); O.panelG = g;
    bev(1.5, 0.78, 0.5, M.paintGreen, 0, 0.39, 0.3, g, 0.01);
    const desk = bev(1.5, 0.04, 0.42, M.paintDark, 0, 0.82, 0.32, g, 0.008); desk.rotation.x = -0.25;
    bev(1.5, 0.72, 0.06, M.paintGreen, 0, 1.3, 0.12, g, 0.01);
    O.gauges = {};
    const gs = [['depth', -0.5, 1.42], ['pres', -0.17, 1.42], ['o2', 0.17, 1.42], ['co2', 0.5, 1.42]];
    for (const [id, x, y] of gs) { const gg = grp(x, y, 0.16, g); cyl(0.12, 0.12, 0.05, M.steel, 0, 0, 0, gg, 28).rotation.x = Math.PI / 2; O.gauges[id] = gg; }
    // the electrical board below: switches, and the light switch with a keyhole
    for (let k = 0; k < 6; k++) { const s = mbox(0.03, 0.06, 0.03, M.black, -0.6 + k * 0.12, 1.08, 0.17, g, 1); s.rotation.x = 0.3; }
    O.keySwitch = grp(0.42, 1.08, 0.16, g); cyl(0.05, 0.05, 0.03, M.chrome, 0, 0, 0, O.keySwitch, 20).rotation.x = Math.PI / 2; mbox(0.008, 0.03, 0.01, M.black, 0, 0, 0.02, O.keySwitch, 1);
  }
  // the intercom box: a rotary selector, an output switch, a listen/talk lever, a lamp
  { const g = grp(POS.intercom.x, POS.intercom.y, POS.intercom.z + 0.08, scene); O.icG = g; g.userData.keep = true;
    bev(0.36, 0.3, 0.14, std({ color: 0x3a3a34, roughness: 0.5 }), 0, 0, 0, g, 0.012);
    const grill = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), M.black); grill.position.set(-0.08, 0.04, 0.072); g.add(grill);
    O.icKnob = grp(0.1, 0.05, 0.075, g); cyl(0.035, 0.035, 0.03, M.black, 0, 0, 0, O.icKnob, 16).rotation.x = Math.PI / 2; mbox(0.008, 0.035, 0.01, M.chrome, 0, 0.015, 0.018, O.icKnob, 1);
    O.icOut = grp(0.1, -0.08, 0.075, g); mbox(0.018, 0.05, 0.02, M.chrome, 0, 0.0, 0.01, O.icOut, 1);
    O.icLever = grp(-0.08, -0.09, 0.075, g); mbox(0.05, 0.016, 0.03, M.black, 0, 0, 0.012, O.icLever, 1);
    O.icLamp = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), std({ color: 0x200400, emissive: 0xff4010, emissiveIntensity: 0, roughness: 0.4 })); O.icLamp.position.set(-0.14, 0.12, 0.072); g.add(O.icLamp);
  }
  // the telephone to the ship: a bakelite handset on a hook box
  { const g = grp(POS.phone.x, POS.phone.y, POS.phone.z + 0.06, scene); O.phoneG = g; g.userData.keep = true;
    bev(0.2, 0.28, 0.08, M.black, 0, 0, 0, g, 0.012);
    O.handset = grp(0, 0.02, 0.07, g); const hs = O.handset; mbox(0.04, 0.2, 0.04, M.black, 0, 0, 0, hs, 1); cyl(0.035, 0.03, 0.05, M.black, 0, 0.11, 0.02, hs, 12).rotation.x = Math.PI / 2; cyl(0.035, 0.03, 0.05, M.black, 0, -0.11, 0.02, hs, 12).rotation.x = Math.PI / 2;
    tube([[0, -0.1, 0.03], [0.05, -0.2, 0.05], [0.0, -0.3, 0.04], [-0.04, -0.15, 0.0]], 0.006, M.black, g, 20, 5);
  }
  // the scrubber: a canister housing with a fan on top, a lid on four wing nuts
  { const g = grp(POS.scrubber.x, FY, POS.scrubber.z, scene); O.scrubG = g; g.userData.keep = true;
    lathe([[0, 0], [0.22, 0], [0.22, 0.04], [0.2, 0.06], [0.2, 0.7], [0.22, 0.72], [0.22, 0.76], [0, 0.76]], std({ color: 0x5a6a5a, roughness: 0.5, metalness: 0.5, map: T.paint }), 0, 0, 0, g, 28);
    const lid = grp(0, 0.76, 0, g); O.scrubLid = lid; lathe([[0, 0], [0.225, 0], [0.225, 0.03], [0.14, 0.06], [0.14, 0.14], [0, 0.14]], M.steel, 0, 0, 0, lid, 28);
    O.fan = grp(0, 0.15, 0, lid); for (let k = 0; k < 4; k++) { const b = mbox(0.11, 0.004, 0.035, M.steelDark, 0.06, 0, 0, O.fan, 1); b.rotation.set(0.4, k * Math.PI / 2, 0); b.position.set(Math.cos(k * Math.PI / 2) * 0.06, 0, -Math.sin(k * Math.PI / 2) * 0.06); }
    const guard = torus(0.13, 0.006, M.steel, 0, 0.16, 0, lid, 20, 4); guard.rotation.x = Math.PI / 2;
    O.wingnuts = []; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + Math.PI / 4; const w = grp(Math.cos(a) * 0.205, 0.035, Math.sin(a) * 0.205, lid); cyl(0.012, 0.012, 0.03, M.steel, 0, 0, 0, w, 8); mbox(0.06, 0.02, 0.006, M.steel, 0, 0.02, 0, w, 1); O.wingnuts.push(w); }
    // the canister inside (old: violet crystals at the top; new: white)
    O.canOld = grp(0, 0.06, 0, g); cyl(0.17, 0.17, 0.62, std({ color: 0x8a8a84, roughness: 0.5, metalness: 0.6 }), 0, 0.31, 0, O.canOld, 20); O.canOldTop = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), std({ color: 0x5a2a7a, roughness: 0.9 })); O.canOldTop.rotation.x = -Math.PI / 2; O.canOldTop.position.y = 0.625; O.canOld.add(O.canOldTop);
    O.canNew = grp(0, 0.06, 0, g); cyl(0.17, 0.17, 0.62, M.steel, 0, 0.31, 0, O.canNew, 20); const nt = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), std({ color: 0xe8e4dc, roughness: 0.9 })); nt.rotation.x = -Math.PI / 2; nt.position.y = 0.625; O.canNew.add(nt); O.canNew.visible = false;
    // a pipe from it up to the overhead duct
    pole([0, 0.92, 0], [0, MM.ay + 1.3 - FY, 0], 0.05, M.steelDark, g, 12);
  }
}

/* ---------- the galley: counter, hot plate, coffee, the empty knife rack, the stopped clock, the covered mirror; the table ---------- */
function buildGalley() {
  const zc = MMW - 0.3;
  { const g = grp(0, FY, zc, scene); O.galley = g;
    bev(3.1, 0.88, 0.58, M.paintGreen, 6.85, 0.44, 0, g, 0.01);
    bev(3.14, 0.04, 0.62, M.steel, 6.85, 0.9, 0, g, 0.006);
    // the hot plate, a coffee pot on it
    bev(0.4, 0.06, 0.32, M.black, 6.0, 0.95, 0.02, g, 0.008); torus(0.08, 0.008, M.steelDark, 6.0, 0.985, 0.02, g, 16, 4).rotation.x = Math.PI / 2;
    O.coffee = grp(6.0, 0.98, 0.02, g); lathe([[0, 0], [0.07, 0], [0.075, 0.03], [0.06, 0.18], [0.05, 0.2], [0.055, 0.22], [0, 0.22]], M.chrome, 0, 0, 0, O.coffee, 18); pole([0.06, 0.06, 0], [0.1, 0.16, 0], 0.008, M.black, O.coffee, 5); cyl(0.012, 0.004, 0.06, M.chrome, -0.075, 0.15, 0, O.coffee, 6).rotation.z = 0.8;
    // the knife rack, empty
    O.knifeRack = grp(6.85, 1.3, 0.28, g); bev(0.4, 0.06, 0.03, M.wood, 0, 0, 0, O.knifeRack, 0.008); for (let k = 0; k < 4; k++) mbox(0.012, 0.03, 0.035, M.black, -0.15 + k * 0.1, 0.0, -0.005, O.knifeRack, 1);
    // a shelf with tins and cups
    bev(1.2, 0.03, 0.22, M.wood, 5.6, 1.6, 0.18, g, 0.006); for (let k = 0; k < 4; k++) cyl(0.04, 0.04, 0.12, std({ color: [0x8a3a2a, 0x2a4a6a, 0xc8a040, 0x5a7a3a][k], roughness: 0.4, metalness: 0.5 }), 5.15 + k * 0.14, 1.675, 0.2, g, 12);
    // the washbasin, the towel over the mirror above it
    lathe([[0, 0], [0.16, 0], [0.18, 0.1], [0.19, 0.12], [0, 0.12]], M.chrome, 8.15, 0.82, 0.02, g, 20); pole([8.15, 0.94, 0.2], [8.15, 1.04, 0.1], 0.01, M.chrome, g, 6);
    O.mirror = grp(8.15, 1.42, 0.28, g); bev(0.34, 0.44, 0.02, M.chrome, 0, 0, 0, O.mirror, 0.006);
    const towel = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55, 6, 8), M.towel); const tp = towel.geometry.attributes.position; for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i); tp.setZ(i, -0.02 + Math.sin(x * 9) * 0.008 - (y < -0.15 ? (y + 0.15) * 0.05 : 0)); } towel.geometry.computeVertexNormals(); towel.position.set(0, -0.04, -0.03); towel.rotation.y = Math.PI; O.mirror.add(towel); O.towel = towel;
  }
  // the clock on the wall above the counter: stopped at 23:52, its battery stood beside it
  { const g = grp(POS.clock.x, POS.clock.y, MMW - 0.02, scene); g.rotation.y = Math.PI; O.clockG = g; g.userData.keep = true;
    cyl(0.14, 0.14, 0.04, M.black, 0, 0, 0, g, 28).rotation.x = Math.PI / 2; O.clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.125, 28), std({ color: 0xffffff, roughness: 0.5 })); O.clockFace.position.z = 0.021; g.add(O.clockFace);
    const hm = mbox(0.008, 0.07, 0.003, M.black, 0, 0.03, 0.024, g, 1); hm.geometry.translate(0, 0.0, 0); const mm = mbox(0.005, 0.1, 0.003, M.black, 0, 0.045, 0.026, g, 1);
    // 23:52: the hour hand a little before twelve, the minute hand at 52 minutes
    const hg = grp(0, 0, 0.024, g); hm.position.set(0, 0.03, 0); hg.add(hm); hg.rotation.z = (11 + 52 / 60) / 12 * -TAU; const mg = grp(0, 0, 0.026, g); mm.position.set(0, 0.045, 0); mg.add(mm); mg.rotation.z = 52 / 60 * -TAU;
    const bat = cyl(0.016, 0.016, 0.06, std({ color: 0x2a5a8a, roughness: 0.4, metalness: 0.3 }), -0.25, -0.12, 0.05, g, 10); }
  // the table against the north wall, two stools, and what's on it
  { const g = grp(POS.table.x, FY, -MMW + 0.32, scene); O.tableG = g;
    bev(1.5, 0.04, 0.62, M.wood, 0, 0.74, 0, g, 0.01); pole([-0.65, 0, 0.22], [-0.65, 0.72, 0.22], 0.02, M.steel, g, 8); pole([0.65, 0, 0.22], [0.65, 0.72, 0.22], 0.02, M.steel, g, 8);
    for (const x of [-0.4, 0.4]) { const s = grp(x, 0, 0.62, g); cyl(0.17, 0.17, 0.04, M.rubber, 0, 0.48, 0, s, 16); pole([0, 0, 0], [0, 0.46, 0], 0.025, M.steel, s, 8); cyl(0.17, 0.2, 0.01, M.steel, 0, 0.005, 0, s, 16); }
    // four cups, an ashtray with a pipe in it, a chess board mid-game, the logbook open
    for (let k = 0; k < 4; k++) { const c = lathe([[0, 0], [0.035, 0], [0.04, 0.08], [0, 0.08]], std({ color: 0xe8e4dc, roughness: 0.3 }), -0.55 + k * 0.12 + (k > 1 ? 0.8 : 0), 0.76, 0.12 + (k % 2) * 0.08, g, 14); }
    O.ashtray = grp(-0.2, 0.76, 0.18, g); lathe([[0, 0], [0.07, 0], [0.075, 0.02], [0.06, 0.025], [0, 0.015]], M.glassThin, 0, 0, 0, O.ashtray, 16); const pipe = grp(0.02, 0.03, 0, O.ashtray); cyl(0.016, 0.014, 0.04, M.wood, 0, 0.02, 0, pipe, 10); pole([0, 0.01, 0], [0.12, 0.0, 0.02], 0.006, M.black, pipe, 6);
    O.chess = grp(0.35, 0.76, -0.1, g); { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.3), std({ map: tex(canv(64, 64, (c2, W2, H2) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c2.fillStyle = (i + j) % 2 ? '#3a2a1a' : '#d8c8a8'; c2.fillRect(i * 8, j * 8, 8, 8); } })), roughness: 0.5 })); b.position.y = 0.008; O.chess.add(b); for (let k = 0; k < 11; k++) { const p = cyl(0.009, 0.012, 0.03, std({ color: k % 2 ? 0x1a1410 : 0xe8e0cc, roughness: 0.4 }), (hash1(k * 3) - 0.5) * 0.26, 0.03, (hash1(k * 7) - 0.5) * 0.26, O.chess, 8); } }
    O.logbook = grp(-0.4, 0.76, -0.12, g); O.logbook.rotation.y = 0.1;
    O.slate = grp(0.0, 0.76, -0.05, g); O.slate.rotation.y = -0.2;
  }
}

/* ---------- your berth: stripped, and your kitbag packed on it ---------- */
function buildBerth() {
  const g = grp(POS.berth.x, POS.berth.y, POS.berth.z, scene); O.berthG = g;
  bev(1.9, 0.06, 0.72, M.steelDark, 0, 0, 0, g, 0.008);
  const mat = bev(1.84, 0.1, 0.66, std({ color: 0x5a6a5a, roughness: 0.95, map: T.canvas }), 0, 0.08, 0, g, 0.03);
  pole([-0.95, -0.5, -0.34], [-0.95, 0, -0.34], 0.018, M.steel, g, 6); pole([0.95, -0.5, -0.34], [0.95, 0, -0.34], 0.018, M.steel, g, 6);
  // the blanket, folded square at the foot
  bev(0.42, 0.1, 0.5, M.wool, 0.6, 0.18, 0.02, g, 0.03);
  // the kitbag, packed and tied, with a luggage label
  O.kitbag = grp(-0.25, 0.14, 0.0, g); const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.7, 16, 3), M.canvas); kb.rotation.z = Math.PI / 2; kb.position.y = 0.2; O.kitbag.add(kb);
  { const p = kb.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 + Math.sin(y * 8) * 0.03)); p.setZ(i, p.getZ(i) * (0.8 + 0.2 * Math.abs(Math.sin(y * 4)))); } kb.geometry.computeVertexNormals(); }
  torus(0.2, 0.012, M.rope, 0.3, 0.2, 0, O.kitbag, 16, 4).rotation.y = Math.PI / 2;
  O.label = grp(0.38, 0.12, -0.24, O.kitbag); O.label.rotation.y = Math.PI;
  // a photograph pinned on the wall over the berth (yours: you and your mother at Saint-Malo)
  O.photo = grp(0.2, 0.62, 0.36, g); O.photo.rotation.y = Math.PI;
}

/* ---------- the bunk-room bulkhead: the round hatch, dogged from inside, its little window curtained; the pass-through box; the tag board ---------- */
function buildBulkhead() {
  const x = MM.x1 - 0.02;
  { const g = grp(x, POS.hatch.y, POS.hatch.z, scene); g.rotation.y = -Math.PI / 2; O.hatchG = g; g.userData.keep = true;
    torus(0.5, 0.045, M.steel, 0, 0, 0, g, 40, 8);
    const leaf = cyl(0.48, 0.48, 0.06, M.paint, 0, 0, 0.02, g, 40); leaf.rotation.x = Math.PI / 2;
    O.hatchWheel = grp(0, 0, 0.08, g); torus(0.16, 0.016, M.steel, 0, 0, 0, O.hatchWheel, 24, 6); for (let k = 0; k < 4; k++) { const sp = mbox(0.32, 0.014, 0.014, M.steel, 0, 0, 0, O.hatchWheel, 1); sp.rotation.z = k * Math.PI / 4; } cyl(0.03, 0.03, 0.06, M.steel, 0, 0, -0.02, O.hatchWheel, 10).rotation.x = Math.PI / 2;
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; mbox(0.06, 0.1, 0.05, M.steel, Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.03, g, 1).rotation.z = a; }
    // its window, with a curtain drawn on the other side
    const wp = grp(0, 0.24, 0.06, g); torus(0.075, 0.015, M.brass, 0, 0, 0, wp, 20, 6); const wg = new THREE.Mesh(new THREE.CircleGeometry(0.072, 20), std({ color: 0x2a1a10, emissive: 0x3a1a08, emissiveIntensity: 0.15, roughness: 0.2 })); wg.position.z = -0.005; wp.add(wg); O.hatchWin = wg;
  }
  { const g = grp(x, POS.pass.y, POS.pass.z, scene); g.rotation.y = -Math.PI / 2; O.passG = g; g.userData.keep = true;
    bev(0.42, 0.42, 0.06, M.steel, 0, 0, 0.0, g, 0.01);
    O.passDoor = grp(-0.16, 0, 0.04, g); bev(0.32, 0.32, 0.025, M.paint, 0.16, 0, 0, O.passDoor, 0.008); mbox(0.02, 0.1, 0.03, M.steel, 0.28, 0, 0.02, O.passDoor, 1);
    O.passInside = grp(0, 0, -0.1, g); bev(0.3, 0.3, 0.02, M.steelDark, 0, 0, -0.1, O.passInside, 0.006);
    // what comes through: the release key, wrapped in a torn page
    O.passKey = grp(0, -0.1, -0.05, g); { const k = O.passKey; pole([0, 0, 0], [0, 0, 0.14], 0.008, M.brass, k, 6); mbox(0.07, 0.012, 0.012, M.brass, 0, 0, 0.0, k, 1); const pg = mbox(0.12, 0.004, 0.16, M.paper, 0.0, -0.01, 0.06, k, 1); pg.rotation.y = 0.3; } O.passKey.visible = false;
  }
  // the tag board: five hooks, five name tags, IN on the left and OUT on the right
  { const g = grp(POS.board.x, POS.board.y, -MMW + 0.06, scene); O.boardG = g; g.userData.keep = true; }
}

/* ---------- outside: legs, frames, the bunk room, the gas banks, the umbilical, the floods, the name ---------- */
function buildExterior() {
  const e = O.ext;
  // the main module's end dome, and the bunk room beyond it
  { const len = BUNK.x1 - BUNK.x0, cx = (BUNK.x0 + BUNK.x1) / 2;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(MM.r + 0.1, MM.r + 0.1, len, 48, 1, true), paintFor(M.hullOut, 4, 2)); c.rotation.z = Math.PI / 2; c.position.set(cx, MM.ay, 0); e.add(c); O.bunkHull = c;
    const d = new THREE.Mesh(new THREE.SphereGeometry(MM.r + 0.1, 32, 12, 0, TAU, 0, Math.PI / 2), paintFor(M.hullOut, 3, 2)); d.rotation.z = -Math.PI / 2; d.scale.set(0.5, 1, 1); d.position.set(BUNK.x1, MM.ay, 0); e.add(d);
    const d2 = new THREE.Mesh(new THREE.SphereGeometry(MM.r + 0.1, 32, 12, 0, TAU, 0, Math.PI / 2), paintFor(M.hullOut, 3, 2)); d2.rotation.z = Math.PI / 2; d2.scale.set(0.35, 1, 1); d2.position.set(MM.x0, MM.ay, 0); e.add(d2);
    for (const x of [MM.x0 + 0.1, 7.0, MM.x1, BUNK.x1 - 0.2]) torus(MM.r + 0.12, 0.05, M.hullOut, x, MM.ay, 0, e, 40, 6).rotation.y = Math.PI / 2;
  }
  // the bunk room's window on the north side, lit from inside (the faces are in part C)
  { const yy = FY + 1.2, dz = Math.sqrt((MM.r + 0.1) ** 2 - (yy - MM.ay) ** 2); const p = new THREE.Vector3(BUNK_WIN_X, yy, -dz - 0.01); const n = new THREE.Vector3(0, -(yy - MM.ay), -dz).normalize();
    const g = grp(p.x, p.y, p.z, e); g.lookAt(p.clone().add(n)); torus(0.23, 0.035, M.hullOut, 0, 0, 0, g, 24, 6); O.bunkWinPos = p.clone(); O.bunkWinN = n.clone();
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: 0x3a2410, transparent: true, opacity: 0.85 })); glow.position.z = -0.03; glow.userData.keep = true; g.add(glow); O.bunkWinGlass = glow;
    // the window is a real hole in the hull, so you can see in
    const hm = O.bunkHull.material = O.bunkHull.material.clone(); hm.onBeforeCompile = sh => { sh.uniforms.winP = { value: p.clone() }; sh.vertexShader = 'varying vec3 vWPh;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPh = (modelMatrix * vec4(position, 1.0)).xyz;'); sh.fragmentShader = 'uniform vec3 winP; varying vec3 vWPh;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if (distance(vWPh, winP) < 0.215) discard;'); }; hm.customProgramCacheKey = () => 'bunkhole'; }
  // legs: tubular, braced, on round feet in the sand
  const leg = (x, z, top) => { pole([x, 0, z], [x, top, z], 0.09, M.hullOut, e, 12); cyl(0.32, 0.36, 0.08, M.hullOut, x, 0.04, z, e, 16); };
  for (const [x, z] of [[1.75, 1.75], [-1.75, 1.75], [1.75, -1.75], [-1.75, -1.75]]) leg(x, z, FY - 0.16);
  for (const x of [4.6, 8.0, 11.4, 13.6]) for (const s of [-1, 1]) { const top = MM.ay - Math.sqrt(MM.r ** 2 - 1.05 ** 2); leg(x, s * 1.05, top); }
  pole([1.75, 1.0, 1.75], [-1.75, 1.0, 1.75], 0.05, M.hullOut, e, 8); pole([1.75, 1.0, -1.75], [-1.75, 1.0, -1.75], 0.05, M.hullOut, e, 8);
  pole([4.6, 0.9, -1.05], [13.6, 0.9, -1.05], 0.05, M.hullOut, e, 8); pole([4.6, 0.9, 1.05], [13.6, 0.9, 1.05], 0.05, M.hullOut, e, 8);
  // ballast: big concrete blocks chained to the frame
  for (const [x, z] of [[2.6, 2.4], [-2.6, -2.2], [7.0, 2.1], [12.0, -2.1]]) { const b = mbox(0.9, 0.5, 0.9, std({ color: 0x6a6a62, roughness: 1, map: T.rock }), x, 0.25, z, e, 1); b.rotation.y = hash1(x) * 1; }
  // the gas banks: five tall cylinders on a bracket outside the south porthole, numbered, with coloured shoulders
  O.bankCyl = [];
  { const g = grp(0, FY - 0.95, WR.r + 0.95, e);
    mbox(2.6, 0.08, 0.5, M.hullOut, 0, 0, 0, g, 1); mbox(2.6, 0.08, 0.06, M.hullOut, 0, 1.25, -0.22, g, 1);
    pole([-1.3, 0, -0.2], [-1.3, 0.95 + 0.04, -0.85], 0.04, M.hullOut, g, 8); pole([1.3, 0, -0.2], [1.3, 0.95 + 0.04, -0.85], 0.04, M.hullOut, g, 8);
    BANKS.forEach((b, k) => {
      const x = -1.0 + k * 0.5, c = grp(x, 0.04, 0, g);
      lathe([[0, 0], [0.17, 0], [0.18, 0.04], [0.18, 1.3], [0.15, 1.42], [0.06, 1.48], [0.05, 1.56], [0, 1.56]], std({ map: T.tank, normalMap: T.tankN, color: 0x7a7a72, roughness: 0.6 }), 0, 0, 0, c, 20);
      const sh = lathe([[0.181, 1.12], [0.181, 1.3], [0.152, 1.42], [0.062, 1.485], [0.0, 1.49]], M.band[b.col], 0, 0, 0, c, 20);
      torus(0.18, 0.012, M.steel, 0, 0.5, 0, c, 20, 4).rotation.x = Math.PI / 2; torus(0.18, 0.012, M.steel, 0, 1.0, 0, c, 20, 4).rotation.x = Math.PI / 2;
      tube([[0, 1.56, 0], [0, 1.75, 0], [0, 2.0, -0.5], [x * 0.2, 2.5 - 0.04, -0.9]], 0.014, M.steel, c, 16, 5);
      O.bankCyl.push(c);
    });
  }
  // the umbilical: a fat black hose from the top of the main module up into the dark
  { const p0 = new THREE.Vector3(6.0, MM.ay + MM.r + 0.1, 0.3); O.umbilical = tube([p0, [6.1, MM.ay + 2.6, 0.6], [5.6, 9, 2.4], [4.4, 18, 4.0], [3.0, 32, 5.0], [2.0, 48, 5.5]], 0.07, M.black, e, 60, 8); cyl(0.14, 0.14, 0.25, M.steel, p0.x, p0.y, p0.z, e, 12); }
  // the floods: two lamp housings on the wet room's roof, one looking north at the bell, one south at the banks
  O.floodHouses = [];
  for (const [x, y, z, ry] of [[8.6, MM.ay + MM.r + 0.08, -0.7, Math.PI + 0.25], [-0.4, WR.top + 0.12, 2.0, 0]]) { const g = grp(x, y, z, e); g.rotation.y = ry; cyl(0.04, 0.05, 0.25, M.steel, 0, 0.12, 0, g, 8); const h = grp(0, 0.28, 0, g); h.rotation.x = -0.75; cyl(0.12, 0.09, 0.22, M.steelDark, 0, 0, 0, h, 16).rotation.x = Math.PI / 2; const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), std({ color: 0x202020, emissive: 0xe8f0ff, emissiveIntensity: 0, roughness: 0.2 })); lens.position.z = 0.111; h.add(lens); O.floodHouses.push(lens); }
  // the station's name, stencilled on the main module
  decal(2.4, 0.42, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = 'rgba(30,26,20,.85)'; c.font = `${H2 * 0.8}px "Allerta Stencil", "Oswald", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('MÉDUSE', W2 / 2, H2 / 2 + 2); }, 7.6, MM.ay + 0.5, -(Math.sqrt((MM.r + 0.1) ** 2 - 0.25) + 0.012), Math.PI, e, 512, 0.1);
}

/* ---------- suits, masks, fins and tanks (the rack, and your own gear later) ---------- */
function buildSuit(k) {
  // a wetsuit hung up by its shoulders: torso, sagging arms and legs, dripping
  const parts = [], dark = 0x121214, seam = 0x3a3a3c;
  const tor = new THREE.CylinderGeometry(0.16, 0.13, 0.62, 12, 3); parts.push({ geo: tor, m: m4(0, -0.36, 0, 0, 0, 0, 1, 1, 0.55), color: dark });
  parts.push({ geo: new THREE.CylinderGeometry(0.11, 0.06, 0.1, 10), m: m4(0, -0.03, 0, 0, 0, 0, 1, 1, 0.6), color: dark });
  for (const s of [-1, 1]) { parts.push({ geo: new THREE.CylinderGeometry(0.05, 0.04, 0.6, 8), m: m4(s * 0.19, -0.36, 0.0, 0, 0, s * 0.08, 1, 1, 0.7), color: dark }); parts.push({ geo: new THREE.CylinderGeometry(0.07, 0.05, 0.82, 8), m: m4(s * 0.07, -1.08, 0.0, 0, 0, s * 0.02, 1, 1, 0.65), color: dark }); parts.push({ geo: new THREE.BoxGeometry(0.012, 0.6, 0.012), m: m4(s * 0.155, -0.36, 0.07, 0, 0, 0), color: seam }); }
  parts.push({ geo: new THREE.BoxGeometry(0.3, 0.02, 0.05), m: m4(0, -0.62, 0.075, 0, 0, 0), color: seam });
  const g = new THREE.Group(); const m = new THREE.Mesh(mergeParts(parts), std({ vertexColors: true, roughness: 0.35, map: T.rubber, normalMap: T.rubberN }));
  m.castShadow = true; g.add(m); const hk = pole([0, 0.0, 0], [0, 0.06, -0.02], 0.006, M.steel, g, 4);
  return g;
}
function buildMask() { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20), M.rubber); f.rotation.x = Math.PI / 2; f.scale.set(1.3, 1, 1); g.add(f); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.068, 20), M.glass); gl.scale.set(1.3, 1, 1); gl.position.z = 0.026; g.add(gl); torus(0.072, 0.007, M.chrome, 0, 0, 0.026, g, 20, 4).scale.set(1.3, 1, 1); const st = torus(0.1, 0.008, M.rubber, 0, 0, -0.06, g, 16, 4, Math.PI); st.rotation.set(0, Math.PI / 2, Math.PI / 2); g.traverse(c => { c.castShadow = true; }); return g; }
function buildFin() { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.55), std({ color: 0x1a1a1c, roughness: 0.6 })); f.position.z = 0.1; g.add(f); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.15, 10, 1, true), M.rubber); p.rotation.x = Math.PI / 2; p.position.set(0, 0.03, -0.12); g.add(p); return g; }
function buildTank(col, name) {
  const g = new THREE.Group();
  lathe([[0, 0], [0.085, 0], [0.09, 0.03], [0.09, 0.56], [0.075, 0.62], [0.03, 0.655], [0.025, 0.68], [0, 0.68]], col === 'white' ? M.band.white : M.tankY, 0, 0, 0, g, 18);
  cyl(0.03, 0.03, 0.05, M.chrome, 0, 0.7, 0, g, 10); const knob = cyl(0.025, 0.025, 0.02, M.black, 0.04, 0.71, 0, g, 10); knob.rotation.z = Math.PI / 2;
  torus(0.091, 0.008, M.black, 0, 0.3, 0, g, 18, 4).rotation.x = Math.PI / 2;
  if (name) decal(0.12, 0.05, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = col === 'white' ? 'rgba(20,20,20,.9)' : 'rgba(20,16,8,.9)'; c.font = `bold ${H2 * 0.7}px "Allerta Stencil", "Oswald", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, W2 / 2, H2 / 2 + 1); }, 0, 0.42, 0.092, 0, g, 128);
  g.traverse(c => { c.castShadow = true; c.receiveShadow = true; });
  return g;
}
