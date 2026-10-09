/* =====================================================================
   SATURATION · part D: painted things (faces, gauges, plates, cards, the log, the photograph),
   items, documents, what you heard, hints, voices
   ===================================================================== */
function dialFace(min, max, unit, step, opt = {}) {
  return tex(canv(256, 256, (c, W2, H2) => {
    const cx = W2 / 2, cy = H2 / 2; c.fillStyle = opt.bg || '#e8e2cc'; c.beginPath(); c.arc(cx, cy, 124, 0, TAU); c.fill();
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 118, 0, TAU); c.stroke();
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    if (opt.red) { c.strokeStyle = '#b01a10'; c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, 98, a0 + (a1 - a0) * (opt.red - min) / (max - min), a1); c.stroke(); }
    if (opt.green) { c.strokeStyle = '#2a7a3a'; c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, 98, a0 + (a1 - a0) * (opt.green[0] - min) / (max - min), a0 + (a1 - a0) * (opt.green[1] - min) / (max - min)); c.stroke(); }
    c.fillStyle = '#1a1a1a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let v = min; v <= max + 1e-6; v += step / 5) { const a = a0 + (a1 - a0) * (v - min) / (max - min), big = Math.abs((v - min) / step - Math.round((v - min) / step)) < 1e-6; c.lineWidth = big ? 3 : 1.5; c.beginPath(); c.moveTo(cx + Math.cos(a) * (big ? 88 : 96), cy + Math.sin(a) * (big ? 88 : 96)); c.lineTo(cx + Math.cos(a) * 106, cy + Math.sin(a) * 106); c.stroke(); if (big) { c.font = 'bold 22px "IBM Plex Mono", monospace'; c.fillText(String(Math.round(v * 10) / 10), cx + Math.cos(a) * 70, cy + Math.sin(a) * 70); } }
    c.font = 'bold 20px "Oswald", sans-serif'; c.fillText(unit, cx, cy + 42); if (opt.title) { c.font = '16px "Oswald", sans-serif'; c.fillText(opt.title, cx, cy - 40); }
    speckle(c, W2, H2, 500, 0.12, '60,40,20', 2);
  }));
}
// a needle on a dial: returns a pivot to turn; value -> angle with dialAngle()
function needle(par, r, z = 0.03, col = 0x101010) { const p = grp(0, 0, z, par); const n = mbox(0.008 * r * 8, r * 0.82, 0.004, std({ color: col, roughness: 0.4 }), 0, r * 0.32, 0, p, 1); cyl(r * 0.07, r * 0.07, 0.01, M.black, 0, 0, 0, p, 10).rotation.x = Math.PI / 2; p.userData.noRay = true; return p; }
const dialAngle = (v, min, max) => -(Math.PI * 0.75 + Math.PI * 1.5 * clamp((v - min) / (max - min), 0, 1)) + Math.PI / 2;
function dialOn(par, r, face, z = 0.026) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), std({ map: face, roughness: 0.35 })); m.position.z = z; par.add(m); const gl = new THREE.Mesh(new THREE.CircleGeometry(r, 28), M.glassThin); gl.position.z = z + 0.012; gl.userData.noRay = true; gl.layers.set(1); par.add(gl); return m; }

function paintThings() {
  // a sea fan: a net of branches on clear
  T.fan = tex(canv(256, 256, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.strokeStyle = '#fff'; const br = (x, y, a, l, w, d) => { if (d > 7 || l < 4) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); br(x2, y2, a - 0.35 - Math.random() * 0.3, l * 0.78, w * 0.75, d + 1); br(x2, y2, a + 0.35 + Math.random() * 0.3, l * 0.78, w * 0.75, d + 1); }; br(W2 / 2, H2, -Math.PI / 2, 60, 7, 0); for (let i = 0; i < 300; i++) { c.lineWidth = 1; c.beginPath(); const x = Math.random() * W2, y = Math.random() * H2 * 0.9; c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 14); c.stroke(); } }));
  T.fan.wrapS = T.fan.wrapT = THREE.ClampToEdgeWrapping;
  // your face, drowned: grey-blue, mottled, the eyes open and clouded, the lips blue. Painted for a sphere, front at u = 0.25
  T.face = tex(canv(512, 256, (c, W2, H2) => {
    c.fillStyle = '#4e585c'; c.fillRect(0, 0, W2, H2);
    const fx = W2 * 0.25, fy = H2 * 0.53;
    const sk = c.createRadialGradient(fx, fy + 6, 8, fx, fy, 112); sk.addColorStop(0, '#8c989a'); sk.addColorStop(0.55, '#7a8689'); sk.addColorStop(1, '#5a6569'); c.fillStyle = sk; c.fillRect(fx - 120, 0, 240, H2);
    // mottling: blotches of blue and violet under the skin
    for (let i = 0; i < 70; i++) { const x = fx + (hash1(i * 3.1) - 0.5) * 200, y = fy + (hash1(i * 5.7) - 0.5) * 150, r = 6 + hash1(i * 1.3) * 18; const g = c.createRadialGradient(x, y, 0, x, y, r); const col = i % 3 ? '70,80,110' : '90,70,100'; g.addColorStop(0, `rgba(${col},.16)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    // the hairline, cropped dark hair above it
    c.fillStyle = '#16120e'; c.beginPath(); c.moveTo(fx - 130, 0); c.lineTo(fx + 130, 0); c.lineTo(fx + 130, fy - 30); for (let k = 0; k <= 26; k++) { const x = fx + 130 - k * 10, y = fy - 52 - Math.cos((x - fx) / 70) * 6 + Math.sin(k * 2.3) * 2.5 + (Math.abs(x - fx) > 80 ? 22 : 0); c.lineTo(x, y); } c.closePath(); c.fill();
    // brows, low over the eyes
    for (const s of [-1, 1]) { c.strokeStyle = 'rgba(30,26,22,.85)'; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(fx + s * 9, fy - 22); c.quadraticCurveTo(fx + s * 22, fy - 27, fx + s * 35, fy - 21); c.stroke(); }
    // the sockets, dark and violet; the eyes in them open, the corneas gone milky
    for (const s of [-1, 1]) { const ex = fx + s * 22, ey = fy - 10;
      const so = c.createRadialGradient(ex, ey + 2, 3, ex, ey + 2, 22); so.addColorStop(0, 'rgba(40,36,60,.75)'); so.addColorStop(0.6, 'rgba(50,46,70,.4)'); so.addColorStop(1, 'rgba(60,60,80,0)'); c.fillStyle = so; c.beginPath(); c.arc(ex, ey + 2, 22, 0, TAU); c.fill();
      c.fillStyle = '#a2a298'; c.beginPath(); c.ellipse(ex, ey, 11, 6.2, 0, 0, TAU); c.fill();
      const ir = c.createRadialGradient(ex - s * 1, ey, 0.5, ex - s * 1, ey, 5.6); ir.addColorStop(0, '#3a4044'); ir.addColorStop(0.35, '#6a7478'); ir.addColorStop(0.85, '#8a9496'); ir.addColorStop(1, '#4a5256'); c.fillStyle = ir; c.beginPath(); c.arc(ex - s * 1, ey, 5.6, 0, TAU); c.fill();
      c.fillStyle = 'rgba(210,216,216,.18)'; c.beginPath(); c.ellipse(ex, ey, 10, 5.6, 0, 0, TAU); c.fill();     // the milky film
      c.strokeStyle = 'rgba(20,18,26,.9)'; c.lineWidth = 2; c.beginPath(); c.ellipse(ex, ey, 11.2, 6.4, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();   // upper lid
      c.strokeStyle = 'rgba(60,40,60,.6)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(ex, ey, 11, 6.4, 0, 0.1, Math.PI - 0.1); c.stroke(); }  // lower lid, reddened
    // the nose: shade down its sides, dark nostrils
    for (const s of [-1, 1]) { const g = c.createLinearGradient(fx + s * 3, 0, fx + s * 12, 0); g.addColorStop(0, 'rgba(40,46,56,0)'); g.addColorStop(1, 'rgba(40,46,56,.35)'); c.fillStyle = g; c.fillRect(Math.min(fx + s * 3, fx + s * 12), fy - 6, 9, 24); c.fillStyle = 'rgba(20,20,26,.85)'; c.beginPath(); c.ellipse(fx + s * 5, fy + 19, 2.8, 1.8, s * 0.3, 0, TAU); c.fill(); }
    // the lips, blue-violet, a little apart
    c.fillStyle = '#5a5a74'; c.beginPath(); c.ellipse(fx, fy + 33, 13, 4, 0, Math.PI, TAU); c.fill(); c.beginPath(); c.ellipse(fx, fy + 40, 12, 4.8, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#121218'; c.beginPath(); c.ellipse(fx, fy + 36.5, 9.5, 2.6, 0, 0, TAU); c.fill();
    // stubble on the jaw and lip
    for (let i = 0; i < 1600; i++) { const a = hash1(i * 1.7) * TAU, rr = 40 + hash1(i * 2.9) * 60; const x = fx + Math.cos(a) * rr * 0.85, y = fy + 22 + Math.abs(Math.sin(a)) * rr * 0.6; if (y < fy + 24 && Math.abs(x - fx) < 16) continue; c.fillStyle = 'rgba(30,32,36,.35)'; c.fillRect(x, y, 1, 1); }
    speckle(c, W2, H2, 1200, 0.1, '30,36,46', 2);
  }));
  T.face.wrapS = THREE.RepeatWrapping;
  // the four of them at the window, lit warm from inside (a lamp on the bunks)
  T.crewFace = [0, 1, 2, 3].map(k => tex(canv(512, 256, (c, W2, H2) => {
    const skin = [['#c8906a', '#8a5a3a'], ['#d0a080', '#8a6044'], ['#c89878', '#7a5038'], ['#8a5a3a', '#4a2a18']][k];
    c.fillStyle = skin[1]; c.fillRect(0, 0, W2, H2);
    const fx = W2 * 0.25, fy = H2 * 0.55; const g = c.createRadialGradient(fx - 10, fy - 20, 6, fx, fy, 100); g.addColorStop(0, skin[0]); g.addColorStop(1, skin[1]); c.fillStyle = g; c.fillRect(fx - 110, 0, 220, H2);
    for (const s of [-1, 1]) { const ex = fx + s * 20, ey = fy - 8; c.fillStyle = '#e8dcc8'; c.beginPath(); c.ellipse(ex, ey, 8, 4.5, 0, 0, TAU); c.fill(); c.fillStyle = '#1a120c'; c.beginPath(); c.arc(ex - s * 1, ey, 3.4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,20,10,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 11, ey - 11 + s * 2); c.lineTo(ex + 11, ey - 13 - s * 2); c.stroke(); }
    c.fillStyle = 'rgba(80,40,20,.5)'; c.beginPath(); c.moveTo(fx - 4, fy - 4); c.lineTo(fx - 8, fy + 18); c.lineTo(fx + 8, fy + 18); c.lineTo(fx + 4, fy - 4); c.fill();
    c.fillStyle = '#3a1a10'; c.beginPath(); c.ellipse(fx, fy + 33, 9, 3, 0, 0, TAU); c.fill();
    if (k === 0) { c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(fx, fy + 27, 18, 5, 0, 0, TAU); c.fill(); }                  // Morel: a moustache
    if (k === 1) { c.strokeStyle = '#1a1a1a'; c.lineWidth = 2.5; for (const s of [-1, 1]) { c.beginPath(); c.arc(fx + s * 20, fy - 8, 12, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(fx - 8, fy - 8); c.lineTo(fx + 8, fy - 8); c.stroke(); }   // Vasseur: glasses
    if (k === 2) { c.fillStyle = 'rgba(40,28,20,.85)'; c.beginPath(); c.moveTo(fx - 36, fy + 10); c.quadraticCurveTo(fx, fy + 80, fx + 36, fy + 10); c.lineTo(fx + 24, fy + 30); c.quadraticCurveTo(fx, fy + 45, fx - 24, fy + 30); c.fill(); }   // Ribes: a beard
    // the warm light from below and to one side, the dark to the other
    const sh = c.createLinearGradient(fx - 100, 0, fx + 100, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = sh; c.fillRect(fx - 110, 0, 220, H2);
  })));
  T.crewFace.forEach(t => { t.wrapS = THREE.RepeatWrapping; });
  // the gauge on your strap: 0 to 250 bar, the needle at 190, painted on (it never moves)
  T.tankGauge = tex(canv(128, 128, (c, W2, H2) => { const cx = 64, cy = 64; c.fillStyle = '#e8e4d0'; c.beginPath(); c.arc(cx, cy, 62, 0, TAU); c.fill(); c.strokeStyle = '#b01a10'; c.lineWidth = 7; c.beginPath(); c.arc(cx, cy, 48, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * 0.2); c.stroke(); c.fillStyle = '#111'; c.font = 'bold 13px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let v = 0; v <= 250; v += 50) { const a = Math.PI * 0.75 + Math.PI * 1.5 * v / 250; c.fillText(String(v), cx + Math.cos(a) * 36, cy + Math.sin(a) * 36); c.fillRect(cx + Math.cos(a) * 50 - 1, cy + Math.sin(a) * 50 - 1, 3, 3); } c.font = 'bold 11px sans-serif'; c.fillText('BAR', cx, cy + 22); const a = Math.PI * 0.75 + Math.PI * 1.5 * 190 / 250; c.strokeStyle = '#000'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46); c.stroke(); c.beginPath(); c.arc(cx, cy, 5, 0, TAU); c.fill(); }));
  // the dawn sky over the Red Sea, for the photograph
  T.dawn = tex(canv(1024, 512, (c, W2, H2) => { const g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, '#1a2a4a'); g.addColorStop(0.38, '#5a6a8a'); g.addColorStop(0.47, '#d8a070'); g.addColorStop(0.5, '#f0c890'); g.addColorStop(0.52, '#3a4a5a'); g.addColorStop(1, '#1a2430'); c.fillStyle = g; c.fillRect(0, 0, W2, H2); const s = c.createRadialGradient(W2 * 0.82, H2 * 0.49, 2, W2 * 0.82, H2 * 0.49, 140); s.addColorStop(0, 'rgba(255,240,200,.95)'); s.addColorStop(0.1, 'rgba(255,200,140,.6)'); s.addColorStop(1, 'rgba(255,160,100,0)'); c.fillStyle = s; c.fillRect(0, 0, W2, H2); for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(80,70,90,.35)'; c.beginPath(); c.ellipse(Math.random() * W2, H2 * (0.25 + Math.random() * 0.15), 80 + Math.random() * 120, 6 + Math.random() * 8, 0, 0, TAU); c.fill(); } }));
  T.dawn.wrapS = THREE.RepeatWrapping;
  // a wet bare footprint
  T.foot = tex(canv(64, 128, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(32, 80, 16, 34, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(30, 30, 13, 16, 0, 0, TAU); c.fill(); for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(16 + k * 8, 10 - Math.abs(k - 1) * 2, 4.5 - k * 0.5, 0, TAU); c.fill(); } }));
  T.foot.wrapS = T.foot.wrapT = THREE.ClampToEdgeWrapping;
  // dial faces
  T.barDial = dialFace(0, 250, 'BAR', 50, { red: 210 });
  T.presDial = dialFace(0, 6, 'BAR ABS', 1, { title: 'STATION' });
  T.depthDial = dialFace(0, 50, 'MÈTRES', 10, { title: 'PROFONDEUR' });
  T.o2Dial = dialFace(0, 40, '% O₂', 10, { green: [17, 23] });
  T.co2Dial = dialFace(0, 4, '% CO₂', 1, { green: [0, 1], red: 2 });
  T.bellDial = dialFace(0, 6, 'BAR ABS', 1, { title: 'CLOCHE' });
  // the clock face: 23:52 is set by its hands
  T.clock = tex(canv(256, 256, (c, W2, H2) => { c.fillStyle = '#f0ece0'; c.beginPath(); c.arc(128, 128, 126, 0, TAU); c.fill(); c.fillStyle = '#111'; c.font = 'bold 30px "Oswald", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; c.fillText(String(i), 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); } for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; c.fillRect(128 + Math.cos(a) * 116 - 1, 128 + Math.sin(a) * 116 - 1, i % 5 ? 2 : 4, i % 5 ? 2 : 4); } c.font = '13px "Oswald", sans-serif'; c.fillText('JAZ', 128, 80); }));
}

/* ---------- the painted things in the station ---------- */
const stencil = (txt, col = 'rgba(240,236,220,.92)', font = '"Allerta Stencil", "Oswald", sans-serif') => (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = col; c.font = `${Math.round(H2 * 0.72)}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W2 / 2, H2 / 2 + 1); };
function paintStation() {
  const mg = O.manifoldG;
  // bank numbers and outlet names on the gas wall
  BANKS.forEach((b, k) => decal(0.07, 0.07, stencil(String(b.n)), -0.52 + k * 0.2, 0.38, 0.005, 0, mg, 64));
  OUTLETS.forEach((o, k) => decal(0.18, 0.05, stencil(['CLOCHE', 'STATION', 'REMPL.'][k]), 0.22, 0.18 - k * 0.22, 0.005, 0, mg, 192));
  decal(0.6, 0.05, stencil('BLOCS · 1  2  3  4  5'), -0.12, 0.43, 0.005, 0, mg, 512);
  // gauges on the gas wall, with needles
  O.bankNeedles = O.bankGauges.map(gg => { dialOn(gg, 0.06, T.barDial, 0.021); return needle(gg, 0.06, 0.034); });
  dialOn(O.stationGauge, 0.08, T.presDial, 0.021); O.stationNeedle = needle(O.stationGauge, 0.08, 0.034);
  // the colour plate beside it: enamel, four swatches with names (their real colours show only in real light)
  { const g = grp(POS.chart.x, POS.chart.y, POS.chart.z, scene); g.lookAt(0, POS.chart.y, 0); O.chartG = g; g.userData.keep = true;
    bev(0.3, 0.34, 0.01, std({ color: 0xe8e4d8, roughness: 0.3 }), 0, 0, 0, g, 0.004);
    decal(0.28, 0.06, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#1a1a1a'; c.font = `bold ${H2 * 0.42}px "Oswald", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CODE DES COULEURS', W2 / 2, H2 / 2); }, 0, 0.13, 0.007, 0, g, 256);
    ['white', 'yellow', 'brown', 'black'].forEach((col, k) => { const y = 0.065 - k * 0.065; mbox(0.06, 0.045, 0.004, std({ color: BAND[col], roughness: 0.4 }), -0.09, y, 0.007, g, 1); decal(0.17, 0.04, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#1a1a1a'; c.font = `${H2 * 0.55}px "Oswald", sans-serif`; c.textBaseline = 'middle'; c.fillText(['OXYGÈNE', 'AIR', 'HÉLIUM', 'AZOTE'][k], 4, H2 / 2); }, 0.045, y, 0.008, 0, g, 128); }); }
  // the transfer card for the bell, a laminated card on a clip
  { const g = grp(POS.card.x, POS.card.y, POS.card.z, scene); g.lookAt(0, POS.card.y, 0); O.cardG = g; g.userData.keep = true;
    decal(0.21, 0.28, (c, W2, H2) => { c.fillStyle = '#e8e2c8'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#b01a10'; c.fillRect(0, 0, W2, 22); c.fillStyle = '#fff'; c.font = 'bold 14px "Oswald", sans-serif'; c.textAlign = 'center'; c.fillText('FICHE DE TRANSFERT · CLOCHE', W2 / 2, 16); c.fillStyle = '#222'; c.font = '10px "Special Elite", monospace'; c.textAlign = 'left'; for (let i = 0; i < 4; i++) { c.fillText((i + 1) + '.', 10, 50 + i * 60); for (let l = 0; l < 3; l++) c.fillRect(26, 44 + i * 60 + l * 13, 120 + Math.random() * 40, 2); } }, 0, 0, 0.004, 0, g, 192);
    mbox(0.06, 0.02, 0.012, M.steel, 0, 0.14, 0.006, g, 1); }
  // the line signals card on the moon pool's rail
  { const g = grp(POS.signals.x, POS.signals.y, POS.signals.z, scene); g.lookAt(0, POS.signals.y, 0.3); O.signalsG = g; g.userData.keep = true;
    decal(0.2, 0.14, (c, W2, H2) => { c.fillStyle = '#e8e4d4'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#1a3a6a'; c.font = 'bold 13px "Oswald", sans-serif'; c.textAlign = 'center'; c.fillText('SIGNAUX À LA LIGNE', W2 / 2, 16); c.fillStyle = '#222'; c.textAlign = 'left'; c.font = '11px "Oswald", sans-serif'; ['1  ·  ça va ?  /  ça va', '2  ·  donne du mou', '3  ·  reprends le mou', '4  ·  remonte-moi'].forEach((t, i) => { c.fillText(t, 12, 38 + i * 18); for (let j = 0; j <= i; j++) c.fillRect(W2 - 18 - j * 7, 31 + i * 18, 4, 9); }); }, 0, 0, 0.003, 0, g, 192);
    mbox(0.21, 0.15, 0.004, M.steel, 0, 0, -0.002, g, 1); }
  // the tag on the pot
  decal(0.09, 0.06, (c, W2, H2) => { c.fillStyle = '#d8c89a'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#2a2a6a'; c.font = 'italic 12px "Caveat", cursive'; c.fillText('Aldébaran → Méduse', 6, 16); c.fillText('3.III · 23h · 1 bar', 6, 32); c.fillText('cartouches, courrier', 6, 48); }, 0.0, 0.42, 0.212, 0, O.potG, 128);
  // the skirt's scale, painted down the inside of the moon pool, facing the hatch side
  { const sc = decal(0.16, SKIRT, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); const ppm = H2 / SKIRT; c.fillStyle = 'rgba(240,236,220,.92)'; for (let d = 0; d <= SKIRT + 1e-6; d += 0.2) { const y = d * ppm; c.fillRect(0, y - 2, d % 0.4 < 0.01 ? 34 : 18, 4); }
      c.font = `bold ${Math.round(ppm * 0.075)}px "Allerta Stencil", "Oswald", sans-serif`; c.textBaseline = 'middle'; for (const [d, t, col] of [[LVL.normal, 'NIVEAU', '#f0ece0'], [LEDGE_D, 'REBORD', '#f0d040'], [SKIRT - 0.02, 'JUPE', '#e04030']]) { c.fillStyle = col; c.fillRect(0, d * ppm - 3, W2, 6); c.fillText(t, 40, d * ppm - ppm * 0.05); } }, MP.r - 0.012, FY - SKIRT / 2, 0, -Math.PI / 2, scene, 128);
    sc.material.depthWrite = false; O.scale = sc; }
  // the scrubber's plate
  decal(0.16, 0.09, (c, W2, H2) => { c.fillStyle = '#c8c2a8'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#1a1a1a'; c.font = 'bold 12px "Oswald", sans-serif'; c.fillText('ÉPURATEUR', 8, 16); c.font = '9px "Oswald", sans-serif'; for (let l = 0; l < 4; l++) c.fillRect(8, 26 + l * 12, 110 + (l % 2) * 20, 2); }, 0, 0.45, -0.205, Math.PI, O.scrubG, 160);
  // the gauges on the control panel, with needles
  O.panelNeedles = {};
  for (const [id, face, min, max] of [['depth', T.depthDial, 0, 50], ['pres', T.presDial, 0, 6], ['o2', T.o2Dial, 0, 40], ['co2', T.co2Dial, 0, 4]]) { dialOn(O.gauges[id], 0.11, face, 0.026); O.panelNeedles[id] = needle(O.gauges[id], 0.11, 0.04); O.panelNeedles[id].userData.range = [min, max]; }
  decal(0.32, 0.05, stencil('ÉCLAIRAGE · NUIT / JOUR', '#e8e4d0', '"Oswald", sans-serif'), 0.32, 1.0, 0.18, 0, O.panelG, 256);
  // the intercom's labels
  decal(0.16, 0.06, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#e8e4d0'; c.font = 'bold 11px "Oswald", sans-serif'; c.textAlign = 'center'; c.fillText('CHAMBRE', W2 / 2, 12); c.fillText('SAS', W2 * 0.12, 34); c.fillText('CLOCHE', W2 * 0.86, 34); c.fillText('NAVIRE', W2 / 2, 56); }, 0.1, 0.05, 0.073, 0, O.icG, 160);
  decal(0.12, 0.03, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#e8e4d0'; c.font = 'bold 13px "Oswald", sans-serif'; c.textAlign = 'center'; c.fillText('SORTIE · ICI / SAS', W2 / 2, H2 * 0.7); }, 0.1, -0.12, 0.073, 0, O.icG, 160);
  decal(0.13, 0.03, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#e8e4d0'; c.font = 'bold 13px "Oswald", sans-serif'; c.textAlign = 'center'; c.fillText('PARLER · ÉCOUTE', W2 / 2, H2 * 0.7); }, -0.08, -0.13, 0.073, 0, O.icG, 160);
  decal(0.12, 0.03, stencil('NAVIRE', '#e8e4d0', '"Oswald", sans-serif'), 0, 0.17, 0.042, 0, O.phoneG, 128);
  // the clock face, stopped
  O.clockFace.material.map = T.clock; O.clockFace.material.needsUpdate = true;
  // the logbook open on the table: two pages of Morel's hand, a page torn out
  { const lb = O.logbook; mbox(0.42, 0.025, 0.3, std({ color: 0x2a3a2a, roughness: 0.7 }), 0, 0.012, 0, lb, 1);
    decal(0.4, 0.28, (c, W2, H2) => { c.fillStyle = '#e8e0c8'; c.fillRect(0, 0, W2, H2); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(W2 / 2 - 1, 0, 2, H2); c.strokeStyle = 'rgba(70,90,140,.25)'; for (let y = 20; y < H2; y += 12) { c.beginPath(); c.moveTo(6, y); c.lineTo(W2 - 6, y); c.stroke(); } c.fillStyle = '#2a2a5a'; for (let l = 0; l < 14; l++) { c.fillRect(10, 17 + l * 12, 60 + Math.random() * 80, 2); } for (let l = 0; l < 3; l++) c.fillRect(W2 / 2 + 10, 17 + l * 12, 60 + Math.random() * 60, 2); c.fillStyle = '#d8d0b8'; c.beginPath(); c.moveTo(W2 / 2 + 6, 60); for (let y = 60; y < H2; y += 6) c.lineTo(W2 / 2 + 6 + Math.random() * 8, y); c.lineTo(W2 / 2 + 2, H2); c.lineTo(W2 / 2 + 2, 60); c.fill(); }, 0, 0.0255, 0, 0, lb, 256, -Math.PI / 2); }
  // the slate on the table: blank, until somebody writes on it
  { O.slateBoard = mbox(0.24, 0.012, 0.17, std({ color: 0xd8d4c4, roughness: 0.5 }), 0, 0.006, 0, O.slate, 1);
    O.slateText = decal(0.22, 0.15, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#1a1a2a'; c.font = `${H2 * 0.38}px "La Belle Aurore", "Caveat", cursive`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.save(); c.translate(W2 / 2, H2 / 2); c.rotate(-0.08); c.fillText('merci', 0, 0); c.restore(); }, 0, 0.0125, 0, 0, O.slate, 256, -Math.PI / 2); O.slateText.visible = false; }
  // the tag board: À BORD and DEHORS, four tags on one side and yours on the other
  { const g = O.boardG; bev(0.62, 0.42, 0.02, M.cork, 0, 0, 0, g, 0.006);
    decal(0.6, 0.4, (c, W2, H2) => { c.clearRect(0, 0, W2, H2); c.fillStyle = '#f0e8d0'; c.font = `bold 20px "Oswald", sans-serif`; c.textAlign = 'center'; c.fillText('À BORD', W2 * 0.3, 26); c.fillText('DEHORS', W2 * 0.78, 26); c.fillRect(W2 * 0.56, 8, 2, H2 - 16);
      const tag = (x, y, t) => { c.fillStyle = '#b8a070'; c.fillRect(x - 46, y - 11, 92, 22); c.fillStyle = '#1a1a1a'; c.font = 'bold 14px "Oswald", sans-serif'; c.fillText(t, x, y + 5); c.fillStyle = '#888'; c.beginPath(); c.arc(x, y - 16, 3, 0, TAU); c.fill(); };
      ['MOREL', 'VASSEUR', 'HAMID', 'RIBES'].forEach((t, i) => tag(W2 * 0.3, 62 + i * 36, t)); tag(W2 * 0.78, 62, 'FERRAND'); }, 0, 0, 0.012, 0, g, 256); }
  // the label on your kitbag
  decal(0.1, 0.06, (c, W2, H2) => { c.fillStyle = '#e0d4b0'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#1a1a3a'; c.font = 'italic 13px "La Belle Aurore", "Caveat", cursive'; c.fillText('L. Ferrand', 6, 18); c.font = 'italic 11px "La Belle Aurore", "Caveat", cursive'; c.fillText('à remettre à Mme Ferrand', 6, 36); c.fillText('Saint-Malo', 6, 52); }, 0, 0, 0.002, 0, O.label, 128);
  // the photograph over your berth: a young man and his mother on the sea wall at Saint-Malo
  decal(0.11, 0.08, (c, W2, H2) => { c.fillStyle = '#f0ece0'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#7a7470'; c.fillRect(6, 6, W2 - 12, H2 - 12); c.fillStyle = '#a8a29a'; c.fillRect(6, 6, W2 - 12, (H2 - 12) * 0.45); c.fillStyle = '#4a4440'; c.fillRect(6, 6 + (H2 - 12) * 0.62, W2 - 12, 4); for (const [x, h, d] of [[0.4, 0.52, '#2a2420'], [0.6, 0.44, '#3a3430']]) { c.fillStyle = d; c.fillRect(W2 * x - 8, H2 * (0.9 - h), 16, H2 * h * 0.9); c.fillStyle = '#b8b0a6'; c.beginPath(); c.arc(W2 * x, H2 * (0.9 - h) - 4, 6, 0, TAU); c.fill(); } }, 0, 0, 0.002, 0, O.photo, 128);
  // the bell: its name
  decal(0.6, 0.12, stencil('MÉDUSE · 2', 'rgba(250,246,236,.9)'), 0, 0.42, Math.sqrt(BELL.r * BELL.r - 0.42 * 0.42) + 0.012, 0, O.bellBody, 256);
  // the gauge in the bell
  dialOn(O.bellGauge, 0.065, T.bellDial, 0.016); O.bellNeedle = needle(O.bellGauge, 0.065, 0.026);
}

/* ---------------- items ---------------- */
const ITEMS = {
  lamp: { name: 'The hand lamp', short: 'Hand lamp', desc: '' },
  cans: { name: 'Two scrubber canisters', short: 'Canisters', desc: 'Two fresh canisters of soda lime from the ship, the crystals inside white and dry. One goes in the scrubber.' },
  letter: { name: 'A letter for you', short: 'Letter', doc: 'letter' },
  mask: { name: 'A diving mask', short: 'Mask', desc: 'Idris\'s mask, from the rack. The glass is still beaded with water from tonight\'s dive. It fits.' },
  knife: { name: 'Jean Morel\'s knife', short: 'Knife', desc: 'A heavy diving knife with a cork handle, J. M. scratched into the pommel. There\'s a frayed end of yellow line still caught in its serrations.' },
  tank: { name: 'A full air tank', short: 'Air tank', desc: 'One of the crew\'s tanks, filled from bank 4, the air bank. Enough for thirty metres.' },
  key: { name: 'The release key', short: 'Release key', desc: 'A brass T-key on a lanyard, for the bell\'s ballast release. It came through the pass-through box wrapped in a page torn from the logbook.' },
  page: { name: 'A torn page', short: 'Torn page', doc: 'torn' },
};
const HOLD_SHORT = { lead0: 'Lead (in hand)', lead1: 'Lead (in hand)', lead2: 'Lead (in hand)', lead3: 'Lead (in hand)', tankE: 'Tank (in hand)', canOld: 'Old canister (in hand)' };
const HOLD_NAMES = { lead0: 'A block of lead', lead1: 'A block of lead', lead2: 'A block of lead', lead3: 'A block of lead', tankE: 'Vasseur\'s tank', canOld: 'The spent canister' };

/* ---------------- what you heard ---------------- */
const HEARD = {
  mu: { title: 'Through the bunk-room hatch, muffled', text: '"Nobody goes out before dawn." &middot; "It\'s gone cold all of a sudden." &middot; "He\'s behind the door."' },
  c1: { title: 'The bunk room, on the intercom', text: 'Ribes: "My head\'s pounding. The air\'s getting heavy." Vasseur: "It\'s the CO2. The canister\'s spent." Morel: "The new ones are in the pot. Out by the moon pool." Vasseur: "I\'m not going out there. Not with him out there." Idris: "Shh. He\'s knocking again."' },
  c2: { title: 'The bunk room, on the intercom', text: 'Ribes: "The air\'s better. Someone\'s changed the canister." Vasseur: "Nobody\'s left this room." Idris: "It\'s him all right. He\'s helping us." Ribes: "Jean. What happened down there?" Morel: "His line caught in the hold. I was out of air. He was pulling me down with him. So I cut it. I threw the knife down the well. I never want to see it again."' },
  c3: { title: 'The bunk room, on the intercom', text: 'Idris: "He knocks four times. Always four." Vasseur: "So?" Idris: "Four pulls on a line means: haul me up." Morel: "If he wants to go up, I\'ll give him the key myself." Vasseur: "And how are you going to ask him?"' },
  k4: { title: 'Through the bunk-room hatch', text: 'Idris: "He knocked four times." Morel: "Give him the key."' },
  kx: { title: 'Through the bunk-room hatch', text: '"Go away!"' },
  so: { title: 'In the main module, whispering', text: 'Ribes: "Jean, look. Footprints." Morel: "Don\'t look. Come back."' },
  ph: { title: 'The telephone to the ship', text: '"Méduse, Méduse, this is Aldébaran. Come in." &middot; "Jean, can you hear me? All I can hear is water."' },
  ph3: { title: 'The telephone to the ship', text: '"Méduse, the surface is calm. We\'ll be waiting for you at dawn."' },
};

/* ---------------- documents ---------------- */
const tick = on => `<span class="sat-ck">${on ? '✓' : ''}</span>`;
function cardPage() {
  const f = S.flags;
  return `<div class="sat-cardhead">FICHE DE TRANSFERT · CLOCHE</div>
    <ol class="sat-steps">
      <li>${tick(f.bellBlown)}<div><b>Souffler la cloche à l'AIR</b> (jamais d'oxygène pur sous 6 m) jusqu'à ce que le gaz déborde sous la jupe.<i>Blow the bell down with AIR (never pure oxygen below 6 m) until gas spills out under its skirt.</i></div></li>
      <li>${tick(f.kitReady)}<div><b>Plongeur équipé :</b> masque, couteau, bouteille d'air à 150 bar ou plus.<i>Diver fully kitted: mask, knife, an air tank at 150 bar or more.</i></div></li>
      <li>${tick(f.doorShut)}<div><b>Entrer par le bas.</b> Fermer la porte et la verrouiller.<i>Go in from underneath. Close the door and dog it shut.</i></div></li>
      <li>${tick(f.released)}<div><b>Clé de largage</b> (gardée par le chef de station) dans la serrure. Larguer le lest.<i>The release key (kept by the station chief) in the lock. Drop the ballast.</i></div></li>
    </ol>
    <p class="sat-small">La cloche remonte seule, scellée à la pression du fond. — <i>The bell rises by itself, sealed at the pressure of the bottom.</i></p>`;
}
function logPages() {
  return [`<div class="sat-loghead">Station Méduse · Journal<span>3 mars 1965 · 19ᵉ jour à 30 m</span></div>
    <p><b>18 h 40</b> Moon pool level up again, nearly to the deck. Gave her a little air on STATION and the water went back down to the mark. Shut it well before the skirt: the last time it got that far, the whole station jumped.</p>
    <p><b>21 h 30</b> Scrubber crystals going violet. Last spare canister used yesterday. New ones coming in tonight's pot.</p>
    <p><b>23 h 05</b> Pot down from Aldébaran. Sealed at the surface. Open it after the dive.</p>
    <p><b>23 h 20</b> Survey dive to the wreck, 61 m: Morel, Vasseur, Hamid, Ferrand. Ribes on watch.</p>`,
    `<p class="sat-torn">The next page has been torn out, close to the binding.</p>
    <p><b>3 h 20</b> Telephone dead both ways. Aldébaran can't hear us. At first light we take the bell up. The release key stays with me. <span class="sat-sig">J. M.</span></p>`];
}
function chartPage() {
  const tl = S.ev.chartTrue || trueLightAt(POS.chart);
  if (tl && !S.ev.chartTrue) { S.ev.chartTrue = true; save(); }
  const sw = (col, name) => `<div class="sat-sw"><span style="background:${tl ? '#' + BAND[col].toString(16).padStart(6, '0') : col === 'brown' || col === 'black' ? '#3a0a06' : '#c8584a'}"></span>${name}</div>`;
  return `<div class="sat-chart"><div class="sat-charthead">CODE DES COULEURS</div>${sw('white', 'OXYGÈNE')}${sw('yellow', 'AIR')}${sw('brown', 'HÉLIUM')}${sw('black', 'AZOTE')}</div>
    <p class="sat-note">${tl ? 'In real light: oxygen is white, air is yellow, helium brown, nitrogen black.' : 'In the red night light the top two swatches look exactly alike, and so do the bottom two. You can read the words, but not the colours.'}</p>`;
}
function signalsPage() {
  return `<div class="sat-charthead">SIGNAUX À LA LIGNE</div>
    <table class="sat-sig-t"><tr><td>1</td><td>Ça va ? / Ça va.</td><td><i>Are you OK? / I'm OK.</i></td></tr><tr><td>2</td><td>Donne du mou.</td><td><i>Give me slack.</i></td></tr><tr><td>3</td><td>Reprends le mou.</td><td><i>Take up the slack.</i></td></tr><tr><td>4</td><td>Remonte-moi.</td><td><i>Haul me up.</i></td></tr></table>
    <p class="sat-small">On répond toujours en répétant le signal. — <i>Always answer by repeating the signal.</i></p>`;
}
const DOCS = {
  log: { title: 'The station\'s logbook', style: 'satlog', pages: logPages, onRead: () => { if (!S.flags.logRead) { flag('logRead'); after(0.5, () => { if (!S.ev.saidGoal) { S.ev.saidGoal = true; after(1.5, () => sayI('At first light they meant to take the bell up. You could get up to the ship in it, and send help down for them. The bell\'s transfer card is in the wet room, by the gas wall.', 9000)); } }); } } },
  card: { title: 'The transfer card', style: 'satcard', pages: () => [cardPage()], onRead: () => { if (!S.flags.cardRead) flag('cardRead'); } },
  chart: { title: 'The colour plate', style: 'satplate', pages: () => [chartPage()], onRead: () => { if (!S.flags.chartRead) flag('chartRead'); if (!(S.ev.chartTrue || trueLightAt(POS.chart))) flag('redSeen'); } },
  signals: { title: 'Line signals', style: 'satplate', pages: () => [signalsPage()], onRead: () => { if (!S.flags.signalsRead) flag('signalsRead'); } },
  tag: { title: 'The tag on the pot', style: 'satlabel', pages: () => [`<p class="sat-hand">Aldébaran → Méduse · 3.III.65 · 23 h<br>Scellé en surface (1 bar).<br>2 cartouches d'épurateur · 3 ampoules · courrier</p><p class="sat-tr"><i>Sealed at the surface (1 bar). 2 scrubber canisters, 3 bulbs, post.</i></p>`], onRead: () => flag('tagRead') },
  plate: { title: 'The scrubber\'s plate', style: 'satplate', pages: () => [`<div class="sat-charthead">ÉPURATEUR À CHAUX SODÉE</div><p>Changer la cartouche quand les cristaux virent au violet.<br>Sans épurateur, le CO₂ monte d'environ 0,1 % par heure et par plongeur.</p><p class="sat-tr"><i>Soda-lime scrubber. Change the canister when the crystals turn violet. Without the scrubber, CO₂ rises by about 0.1% an hour for each diver breathing.</i></p>`] },
  letter: { title: 'A letter from Saint-Malo', style: 'satletter', pages: () => [`<p class="sat-l-date">Saint-Malo, le 22 février 1965</p>
    <p>My dear Lucien,</p><p>Your postcard from Port Sudan came on Tuesday. I have put it on the dresser beside your father's photograph. He would have been so proud of you, a diver, living at the bottom of the sea like a fish. I am not proud. I am frightened, but I say so to nobody.</p>
    <p>The house is very quiet. Madame Lebrun asks after you every Sunday after Mass, and I tell her you are well and eating properly, so please do.</p>
    <p>Come home safe, my darling. Come home safe, and I will never ask you for anything else.</p>
    <p class="sat-l-sig">Ta maman qui t'embrasse</p>`] },
  torn: { title: 'The torn page', style: 'satlog', pages: () => [`<p><b>0 h 30</b> Back. Without Lucien. His line fouled in the forward hold at 61 m and he was pulling Jean down with him. Jean cut it to come up. Ribes says he cannot have lasted ten minutes.</p>
    <p><b>1 h 10</b> Knocking under the deck. Four, then four, then four.</p>
    <p><b>1 h 40</b> Wet footprints on the deck from the moon pool to his berth. Bare feet. He lost his fins at 61 m.</p>
    <p><b>1 h 55</b> Covered the moon pool. Put the lead on it. We are staying in the bunk room until it is light.</p>`,
    `<p class="sat-big">Pardon, Lucien.</p><p class="sat-tr"><i>Forgive me, Lucien.</i> On the back of the page, in big shaking letters, in Jean Morel's hand.</p>`], onRead: () => flag('pageRead') },
};

/* ---------------- hints ---------------- */
const K = k => G.touch ? ({ F: 'the Lamp button', Tab: 'the notebook (top right)', C: 'the Down button', Space: 'the Up button' }[k] || k) : `<kbd>${k}</kbd>`;
const HINTS = [
  { id: 'goal', title: 'What now', when: s => !s.flags.woke ? 'hidden' : (s.flags.logRead && s.flags.cardRead) ? 'solved' : 'open', tiers: [
    'Nobody\'s here. The station\'s logbook would say what they were planning.',
    'The logbook is open on the table in the main module, through the hatch in the wet room\'s east wall.',
    'Its last entry: at first light they meant to take the bell up. The bell\'s transfer card is pinned beside the gas wall in the wet room.',
    'Read the logbook on the table in the main module, then the transfer card beside the gas wall. Taking the bell up to the ship is the way out.'] },
  { id: 'light', title: 'Red light', when: s => !(s.flags.redSeen || s.flags.lampTaken) ? 'hidden' : s.flags.capOff ? 'solved' : 'open', tiers: [
    'Under the red night lights, colours lie: white and yellow look exactly alike.',
    'You need real light. The station\'s lights are on the night setting, and their switch needs a key you don\'t have.',
    'The hand lamp in the dive locker shines red because of the red glass cap screwed over its lens.',
    `Take the hand lamp from the locker beside the tank rack. Open ${K('Tab')}, choose the lamp and unscrew the red cap. ${K('F')} turns it on: now its beam is white.`] },
  { id: 'gas', title: 'The gas wall', when: s => !s.flags.manifoldSeen ? 'hidden' : s.flags.airFound ? 'solved' : 'open', tiers: [
    'The transfer card says AIR, never pure oxygen. The colour plate beside the gas wall says which colour is which.',
    'Each bank\'s pipe has a coloured collar under its wheel, and each bank has a gauge. In red light several collars look alike, and one of those banks is empty.',
    'In white light, banks 1 and 5 are white (oxygen), 3 is brown (helium), and 2 and 4 are yellow (air). Bank 2 reads zero. With the floods on you can also see the banks themselves through the wet room\'s south porthole.',
    'Bank 4 is the air. Open bank 4\'s wheel, then the outlet you need: CLOCHE for the bell, STATION for the station, REMPL. to fill a tank. Shut both again when you\'re done.'] },
  { id: 'pot', title: 'The supply pot', when: s => !s.flags.potSeen ? 'hidden' : s.flags.potOpen ? 'solved' : 'open', tiers: [
    'The pot came down from the ship tonight. Its tag says how it was sealed.',
    'It was sealed at the surface, at 1 bar. Down here everything is at 4 bar, and the difference is pressing the lid shut.',
    'Let the station\'s air into the pot first, so the pressure inside it matches the pressure outside. There\'s a small screw on the lid for that.',
    'Turn the little brass screw on the lid (PURGE) and wait for the hiss to stop. Then lift the lid.'] },
  { id: 'scrub', title: 'The air', when: s => !(s.flags.co2Seen || s.heard.includes('c1')) ? 'hidden' : s.flags.scrubbed ? 'solved' : 'open', tiers: [
    'The CO₂ meter on the control panel keeps climbing. The scrubber\'s canister is spent.',
    'Fresh canisters came down in tonight\'s supply pot, in the wet room.',
    'Open the scrubber, lift out the old canister, fit a new one, close it.',
    'Get the canisters out of the supply pot in the wet room. At the scrubber in the main module, undo the wing nuts and lift the lid, lift out the spent canister and put it down, fit a fresh one and close the lid.'] },
  { id: 'listen', title: 'The voices', when: s => !(s.flags.voicesStopped || s.flags.icSeen) ? 'hidden' : s.heard.includes('c2') ? 'solved' : 'open', tiers: [
    'Someone is in the bunk room. Whenever you come near, they stop talking.',
    'The intercom on the north wall can listen to the bunk room, but its speaker is right there in the main module, and they hear you coming.',
    'The intercom can send what it hears to the speaker in the wet room instead. Listen from there, far from the hatch.',
    'At the intercom, turn the selector to CHAMBRE, set the output to SAS and push the lever to ÉCOUTE. Then go into the wet room and wait under the speaker. What they talk about changes after the air is fixed.'] },
  { id: 'signal', title: 'Knocking', when: s => !(s.heard.includes('c3') || s.flags.knocked) ? 'hidden' : s.flags.keyGot ? 'solved' : 'open', tiers: [
    'The knocking under the floor always comes in fours. Divers talk along a line with pulls.',
    'The line signals card on the moon pool\'s rail: four pulls means "haul me up".',
    'The crew answer knocks on the bunk-room hatch. Morel said he\'d give the key to anyone who wanted to go up. Make sure the air is fixed first: they\'re too far gone to answer before.',
    'Knock on the bunk-room hatch four times in a row (Knock, four times), then wait. Then open the little pass-through box to the left of the hatch.'] },
  { id: 'pool', title: 'The moon pool', when: s => !(s.flags.cardRead || s.heard.includes('c2')) ? 'hidden' : s.flags.poolOpen ? 'solved' : 'open', tiers: [
    'The bell is entered from underneath, and the way down into the sea is the moon pool.',
    'Somebody has weighted its cover down with lead, and hung a crucifix on it.',
    'The lead blocks come off one at a time. Then the clamps round the rim, then the cover.',
    'Carry the four lead blocks off the cover one by one and put them down, lift off the crucifix, knock off the four clamps, and lift the cover.'] },
  { id: 'knife', title: 'A knife', when: s => !(s.flags.cardRead || s.heard.includes('c2')) ? 'hidden' : s.flags.knifeGot ? 'solved' : 'open', tiers: [
    'The card says never dive without a knife. Yours is gone, and so are the galley knives.',
    'Morel threw his knife down the well, he said: the moon pool. It\'s lying on the ledge inside the skirt, under the water.',
    'The water in the moon pool sits where the station\'s pressure pushes it. More air into the station pushes it further down. The logbook says so, and says what happens if you overdo it.',
    'Open the moon pool. At the gas wall open bank 4 and STATION, and watch the water sink down the scale painted inside the skirt. Shut both wheels when it\'s below REBORD and before it reaches JUPE. Then climb down the ladder onto the ledge and take the knife.'] },
  { id: 'bell', title: 'Blowing the bell', when: s => !s.flags.cardRead ? 'hidden' : s.flags.bellBlown ? 'solved' : 'open', tiers: [
    'The card: blow the bell with air until gas spills out under its skirt.',
    'The bell\'s hose comes off the CLOCHE outlet. You can see the bell from the main module\'s north portholes, if the floods are on.',
    'Switch on the floods with the lever box by the wet room\'s north porthole. Open the air bank and CLOCHE, then watch the bell from a north porthole in the main module.',
    'Floods on. At the gas wall open bank 4 and CLOCHE. When bubbles pour out round the bottom of the bell, shut both.'] },
  { id: 'kit', title: 'Kitting up', when: s => !s.flags.cardRead ? 'hidden' : s.flags.kitReady ? 'solved' : 'open', tiers: [
    'Mask, knife, and an air tank at 150 bar or more.',
    'Masks hang on the dive rack. The crew\'s tanks are almost empty, and the white one is oxygen.',
    'Fill a yellow tank at the gas wall: stand it in the fill stand under the board, then let air from bank 4 into it through REMPL.',
    'Carry a yellow tank from the rack to the fill stand under the gas wall. Open bank 4 and REMPL. until its gauge stops climbing, shut them, and take the tank. Take a mask from the rack.'] },
  { id: 'out', title: 'The last dive', when: s => !(s.flags.kitReady && s.flags.bellBlown && s.flags.keyGot && s.flags.poolOpen) ? 'hidden' : s.flags.escaped ? 'solved' : 'open', tiers: [
    'Down through the moon pool, and over to the bell.',
    `Something is under the station, on the guideline. ${K('Space')} and ${K('C')} swim up and down; you swim the way you look.`,
    'Cut him free with Morel\'s knife and take him with you. The bell has a shackle on its side.',
    'Climb down into the moon pool. Under the station, cut the line with the knife and take hold of him. Swim to the bell, clip him to its shackle, and swim up inside it from underneath. Close and dog the door, put the key in the release and turn it.'] },
];

/* ---------------- voices ---------------- */
function line(id, who, text, opts = {}) { return say(who, text, Object.assign({ clip: 'st_' + id }, opts)); }
const NAMES = { m: 'Morel', v: 'Vasseur', r: 'Ribes', i: 'Idris', s: 'The ship' };
const look = (txt, ms = 5600) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5600) => subtitle('', `<i>${txt}</i>`, ms);
function heard(id) { if (!S.heard.includes(id)) { S.heard.push(id); save(); } }
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }
