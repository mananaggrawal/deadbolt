/* =====================================================================
   ROOM 406 — "DEAD AIR"  ·  part A: textures, materials, geometry
   ===================================================================== */
const T = {}, M = {}, O = {}, L = {};
const FONT_HAND = '"Reenie Beanie", "Bradley Hand", cursive';
const FONT_OSD = '"VT323", monospace';
const FONT_TYPE = '"Special Elite", "Courier New", monospace';

const VENT_CAM = new THREE.Vector3(2.08, 2.44, -2.86);
const FEED_LOOK = new THREE.Vector3(-0.9, 0.7, 1.4);
const POS = {
  vent: new THREE.Vector3(2.1, 2.45, -3.05), bath: new THREE.Vector3(-0.9, 1.25, 2.95), tv: new THREE.Vector3(1.98, 1.04, -0.5),
  phone: new THREE.Vector3(0.12, 0.66, -2.8), window: new THREE.Vector3(-2.6, 1.45, -1.0), above: new THREE.Vector3(0.4, 3.3, 0.5),
  wardrobe: new THREE.Vector3(-2.2, 1.3, 2.33), bed: new THREE.Vector3(-1.0, 0.6, -1.9),
};
const CHAIR_DESK = { x: -1.6, z: 0.8, r: 0 };
const CHAIR_VENT = { x: 2.0, z: -2.56, r: 0.35 };
const CHAIR_WARD = { x: -1.42, z: 2.02, r: 0.6 };

function diamond(g, x, y, w, h) { g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y); g.lineTo(x, y + h); g.lineTo(x - w, y); g.closePath(); g.fill(); }
function handText(g, text, x, y, size, color = '#1d2640', rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.font = `${size}px ${FONT_HAND}`; g.fillStyle = color; g.fillText(text, 0, 0); g.restore(); }

function makeTextures() {
  T.wall = ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#6b6541'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(255,240,190,0.07)'; g.fillRect(x + 6, 0, 22, h); g.fillStyle = 'rgba(40,35,15,0.14)'; g.fillRect(x + 31, 0, 2, h); }
    g.fillStyle = 'rgba(48,42,20,0.4)';
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const ox = (y / 64) % 2 ? 32 : 0; diamond(g, x + ox + 16, y + 32, 8, 13); }
    speckle(g, w, h, 6000, 0.09);
    for (let i = 0; i < 8; i++) blot(g, rand(0, w), rand(0, h), rand(30, 120), rand(0.05, 0.15), '70,55,25');
  });
  T.carpet = ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#3e1c20'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = ((x + y) / 32) % 2 ? 'rgba(92,40,40,0.4)' : 'rgba(18,7,9,0.4)'; g.fillRect(x + 4, y + 4, 24, 24); g.fillStyle = 'rgba(160,120,60,0.2)'; g.fillRect(x + 14, y + 14, 4, 4); }
    speckle(g, w, h, 16000, 0.25, '0,0,0', 2); speckle(g, w, h, 3000, 0.12, '200,160,120', 1);
    for (let i = 0; i < 6; i++) blot(g, rand(0, w), rand(0, h), rand(20, 70), 0.28, '15,5,5');
  }, { repeat: [5, 6] });
  T.ceil = ctex(256, 256, (g, w, h) => { g.fillStyle = '#8a8476'; g.fillRect(0, 0, w, h); speckle(g, w, h, 9000, 0.2, '0,0,0', 2); speckle(g, w, h, 4000, 0.16, '255,255,240', 1); }, { repeat: [4, 5] });
  T.wood = ctex(256, 256, (g, w, h) => {
    g.fillStyle = '#4b2f1c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(20,10,4,${Math.random() * 0.35})`; g.fillRect(0, y, w, 1 + Math.random()); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(15,8,3,0.35)'; g.beginPath(); const y = rand(0, h); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 30 + i) * 4); g.stroke(); }
  });
  T.spread = ctex(512, 512, (g, w, h) => {
    g.fillStyle = '#6c3117'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) {
      g.fillStyle = '#a35a27'; g.beginPath(); g.arc(x + 64, y + 64, 46, 0, TAU); g.fill();
      g.fillStyle = '#6c3117'; g.beginPath(); g.arc(x + 64, y + 64, 30, 0, TAU); g.fill();
      g.fillStyle = '#c98a3e'; g.beginPath(); g.arc(x + 64, y + 64, 13, 0, TAU); g.fill();
      g.fillStyle = '#4c210e'; g.fillRect(x, y + 124, 128, 4);
    }
    speckle(g, w, h, 7000, 0.22);
  }, { repeat: [2, 2] });
  T.door = ctex(256, 512, (g, w, h) => {
    g.fillStyle = '#56412f'; g.fillRect(0, 0, w, h);
    [[28, 30, 200, 190], [28, 270, 200, 210]].forEach(([x, y, pw, ph]) => { g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 5; g.strokeRect(x, y, pw, ph); g.strokeStyle = 'rgba(255,230,190,0.12)'; g.lineWidth = 2; g.strokeRect(x + 5, y + 5, pw - 10, ph - 10); });
    speckle(g, w, h, 3000, 0.15); blot(g, 200, 250, 60, 0.2, '20,10,5');
  });
  T.painting = ctex(512, 340, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, '#2a2240'); sky.addColorStop(0.6, '#8a4a3a'); sky.addColorStop(1, '#d08a4a');
    g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.55);
    const lake = g.createLinearGradient(0, h * 0.55, 0, h); lake.addColorStop(0, '#b0703e'); lake.addColorStop(1, '#1a1826');
    g.fillStyle = lake; g.fillRect(0, h * 0.55, w, h * 0.45);
    g.fillStyle = '#12100f';
    for (let x = -10; x < w + 20; x += 18) { const th = rand(40, 110); g.beginPath(); g.moveTo(x, h * 0.56); g.lineTo(x + 9, h * 0.56 - th); g.lineTo(x + 18, h * 0.56); g.fill(); }
    g.globalAlpha = 0.35; for (let x = -10; x < w + 20; x += 18) { const th = rand(30, 80); g.beginPath(); g.moveTo(x, h * 0.56); g.lineTo(x + 9, h * 0.56 + th); g.lineTo(x + 18, h * 0.56); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = '#0d0c0c'; g.fillRect(300, 250, 60, 7); g.fillRect(328, 236, 3, 16);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,220,170,${rand(0.05, 0.2)})`; g.fillRect(rand(0, w), rand(h * 0.58, h), rand(20, 70), 1); }
    speckle(g, w, h, 5000, 0.18);
  });
  T.insc = ctex(512, 340, (g, w, h) => {
    g.fillStyle = '#b3ac9c'; g.fillRect(0, 0, w, h); speckle(g, w, h, 8000, 0.14);
    g.strokeStyle = 'rgba(40,34,28,0.85)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(90, 80); g.lineTo(300, 60); g.lineTo(300, 250); g.lineTo(90, 290); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(300, 60); g.lineTo(380, 110); g.moveTo(300, 250); g.lineTo(380, 230); g.stroke();
    g.strokeRect(110, 170, 40, 100); g.beginPath(); g.moveTo(112, 172); g.lineTo(148, 200); g.moveTo(148, 172); g.lineTo(112, 200); g.stroke();
    g.beginPath(); g.ellipse(292, 72, 14, 7, 0, 0, TAU); g.stroke(); g.beginPath(); g.arc(292, 72, 3, 0, TAU); g.fill();
    g.font = `34px ${FONT_HAND}`; g.fillStyle = 'rgba(40,34,28,0.9)';
    g.fillText('IT SEES FROM THE CORNER', 60, 40); g.fillText("DON'T SLEEP", 330, 290); g.fillText('3:17 3:17 3:17', 300, 180);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillText('IT SEES FROM THE CORNER', 61, 41); g.globalCompositeOperation = 'source-over';
  });
  T.grille = ctex(128, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#d9d4c4'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
    for (let y = 12; y < h - 8; y += 9) { g.fillStyle = '#c8c2b0'; g.fillRect(8, y, w - 16, 4); g.fillStyle = '#8a8474'; g.fillRect(8, y + 4, w - 16, 1); }
    speckle(g, w, h, 500, 0.2);
  });
  T.streak = ctex(128, 384, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { const x = rand(20, 108), len = rand(80, 360), a = rand(0.08, 0.3); const gr = g.createLinearGradient(0, 0, 0, len); gr.addColorStop(0, `rgba(30,18,10,${a})`); gr.addColorStop(1, 'rgba(30,18,10,0)'); g.fillStyle = gr; g.fillRect(x, 0, rand(2, 7), len); }
    g.strokeStyle = 'rgba(25,18,12,0.5)'; g.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) { const ox = 30 + k * 18; g.beginPath(); g.moveTo(ox, 250); g.lineTo(ox + 4, 330); g.moveTo(ox + 5, 252); g.lineTo(ox + 9, 326); g.moveTo(ox + 10, 255); g.lineTo(ox + 13, 322); g.stroke(); }
  });
  T.floorStain = ctex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); blot(g, 128, 128, 110, 0.55, '12,4,4'); blot(g, 100, 150, 60, 0.4, '12,4,4'); blot(g, 160, 100, 40, 0.4, '12,4,4'); });
  T.shadow = ctex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  T.logCover = ctex(160, 200, (g, w, h) => { g.fillStyle = '#23402f'; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, 0.25); g.fillStyle = '#e4dccb'; g.fillRect(30, 40, 100, 50); g.fillStyle = '#222'; g.font = `bold 13px ${FONT_TYPE}`; g.fillText('WKVR-TV', 48, 60); g.font = `10px ${FONT_TYPE}`; g.fillText('TRANSMITTER LOG', 36, 78); });
  T.pad = ctex(128, 180, (g, w, h) => { g.fillStyle = '#efe8d6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2d5a3d'; g.font = `italic 13px Georgia, serif`; g.fillText('Pinecrest', 10, 20); g.font = `9px Georgia, serif`; g.fillText('MOTOR LODGE', 72, 20); g.fillStyle = 'rgba(40,90,60,0.25)'; for (let y = 36; y < h; y += 14) g.fillRect(8, y, w - 16, 1); });
  T.guide = ctex(256, 330, (g, w, h) => { g.fillStyle = '#d8d2c2'; g.fillRect(0, 0, w, h); g.fillStyle = '#b22'; g.font = `bold 30px Georgia, serif`; g.fillText('TV WEEK', 14, 36); g.fillStyle = '#333'; for (let y = 56; y < h - 8; y += 9) { g.fillRect(12, y, rand(60, 110), 3); g.fillRect(134, y, rand(60, 110), 3); } speckle(g, w, h, 2000, 0.15); });
  T.calendar = ctex(256, 360, (g, w, h) => {
    g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#20402c'; g.fillRect(0, 0, w, 150); g.fillStyle = '#0e1d14'; for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 150); g.lineTo(x + 11, 150 - rand(50, 110)); g.lineTo(x + 22, 150); g.fill(); }
    g.fillStyle = '#e8e0c8'; g.font = `italic 18px Georgia, serif`; g.fillText('Pinecrest Motor Lodge', 30, 26);
    g.fillStyle = '#222'; g.font = `bold 20px Georgia, serif`; g.fillText('OCTOBER 1983', 50, 180);
    const cw = 32, ch = 26, x0 = 16, y0 = 200;
    let day = 1; for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) { const idx = r * 7 + c; if (idx < 6 || day > 31) continue; g.fillStyle = '#333'; g.font = '12px Georgia, serif'; g.fillText(String(day), x0 + c * cw + 4, y0 + r * ch + 14);
      if (day >= 26 && day <= 29) { g.strokeStyle = '#1a2a6a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + c * cw, y0 + r * ch); g.lineTo(x0 + c * cw + cw - 4, y0 + r * ch + ch - 4); g.moveTo(x0 + c * cw + cw - 4, y0 + r * ch); g.lineTo(x0 + c * cw, y0 + r * ch + ch - 4); g.stroke(); }
      if (day === 30) { g.strokeStyle = '#1a2a6a'; g.lineWidth = 2; g.beginPath(); g.ellipse(x0 + c * cw + 12, y0 + r * ch + 9, 14, 11, 0, 0, TAU); g.stroke(); }
      day++; }
  });
  T.firemap = ctex(256, 190, (g, w, h) => { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h); g.fillStyle = '#b3261e'; g.fillRect(0, 0, w, 30); g.fillStyle = '#fff'; g.font = `bold 15px Arial, sans-serif`; g.fillText('IN CASE OF FIRE', 64, 21); g.strokeStyle = '#333'; g.lineWidth = 2; g.strokeRect(14, 60, 228, 80); g.beginPath(); g.moveTo(14, 100); g.lineTo(242, 100); g.stroke(); for (let x = 14; x < 242; x += 38) { g.strokeRect(x, 60, 38, 40); g.strokeRect(x, 100, 38, 40); } });
  T.towel = ctex(256, 256, (g, w, h) => { g.fillStyle = '#cfc8b4'; g.fillRect(0, 0, w, h); speckle(g, w, h, 12000, 0.2); g.fillStyle = 'rgba(120,40,40,0.5)'; g.fillRect(0, 200, w, 14); blot(g, 140, 90, 50, 0.18, '90,70,40'); });
  T.outside = ctex(1024, 640, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, 340); sky.addColorStop(0, '#04060a'); sky.addColorStop(1, '#161a22'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#07080a'; for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 340); g.lineTo(x + 12, 340 - rand(25, 90)); g.lineTo(x + 24, 340); g.fill(); }
    g.strokeStyle = '#0a0b0d'; g.lineWidth = 3; g.beginPath(); g.moveTo(590, 340); g.lineTo(620, 170); g.lineTo(650, 340); g.moveTo(600, 290); g.lineTo(640, 290); g.moveTo(607, 250); g.lineTo(633, 250); g.moveTo(613, 210); g.lineTo(627, 210); g.moveTo(600, 290); g.lineTo(633, 250); g.moveTo(640, 290); g.lineTo(607, 250); g.stroke();
    g.fillStyle = '#0c0d10'; g.fillRect(0, 340, w, h - 340);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,160,180,${rand(0.02, 0.07)})`; g.fillRect(rand(0, w), rand(360, h), rand(40, 160), 2); }
    const lamp = g.createRadialGradient(410, 400, 5, 410, 460, 220); lamp.addColorStop(0, 'rgba(255,190,110,0.45)'); lamp.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = lamp; g.fillRect(150, 250, 540, 390);
    g.fillStyle = '#111'; g.fillRect(406, 300, 5, 340); g.fillRect(396, 296, 26, 6);
    g.font = 'bold 44px Arial, sans-serif'; g.fillStyle = 'rgba(40,5,5,0.9)'; g.fillText('V', 330, 400); g.fillStyle = '#ff3a2e'; g.shadowColor = '#ff2a1a'; g.shadowBlur = 24; g.fillText('ACANCY', 360, 400); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,60,40,0.1)'; g.fillRect(330, 470, 300, 30);
  });
  T.moth = ctex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#6b6258'; g.beginPath(); g.ellipse(20, 28, 16, 11, -0.5, 0, TAU); g.ellipse(44, 28, 16, 11, 0.5, 0, TAU); g.fill(); g.fillStyle = '#4e463e'; g.beginPath(); g.ellipse(22, 42, 10, 7, -0.3, 0, TAU); g.ellipse(42, 42, 10, 7, 0.3, 0, TAU); g.fill(); g.fillStyle = '#2d2824'; g.fillRect(30, 18, 4, 30); });
  T.hand = ctex(128, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(220,225,230,0.55)';
    g.beginPath(); g.ellipse(64, 108, 30, 36, 0, 0, TAU); g.fill();
    [[30, 60, -0.35, 26], [48, 42, -0.12, 34], [66, 38, 0, 36], [84, 44, 0.12, 32], [104, 80, 0.7, 22]].forEach(([x, y, r, l]) => { g.save(); g.translate(x, y); g.rotate(r); g.beginPath(); g.ellipse(0, 0, 7, l / 1.3, 0, 0, TAU); g.fill(); g.restore(); });
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 16; i++) { g.fillRect(rand(20, 110), rand(60, 150), 2, rand(10, 40)); } g.globalCompositeOperation = 'source-over';
  });
  T.imprint = ctex(256, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.42)'; g.beginPath(); g.ellipse(128, 70, 36, 44, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(128, 210, 70, 110, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(100, 400, 30, 100, 0.05, 0, TAU); g.ellipse(156, 400, 30, 100, -0.05, 0, TAU); g.fill(); });
  T.scratches = ctex(128, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(230,215,190,0.55)'; g.lineWidth = 1.2; for (let i = 0; i < 40; i++) { const x = rand(10, 118), y = rand(250, 500); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-4, 4), y - rand(30, 140)); g.stroke(); } });
  T.exit = ctex(128, 48, (g, w, h) => { g.fillStyle = '#200'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff3b30'; g.font = `bold 34px Arial, sans-serif`; g.fillText('EXIT', 22, 37); });
  T.plaque = ctex(64, 32, (g, w, h) => { g.fillStyle = '#9a7a36'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a1e08'; g.font = `bold 22px Georgia, serif`; g.fillText('406', 12, 24); });
  T.dnd = ctex(64, 160, (g, w, h) => { g.fillStyle = '#e8d24a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e2d2'; g.beginPath(); g.arc(32, 22, 12, 0, TAU); g.fill(); g.fillStyle = '#222'; g.font = `bold 12px Arial`; g.fillText('PLEASE', 8, 70); g.fillText('DO NOT', 8, 88); g.fillText('DISTURB', 5, 106); });
  T.dial = ctex(128, 128, (g, w, h) => { g.fillStyle = '#e9e2cf'; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill(); g.fillStyle = '#2a2622'; for (let k = 0; k < 10; k++) { const a = (25 - k * 30) * Math.PI / 180; g.beginPath(); g.arc(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42, 9, 0, TAU); g.fill(); } g.fillStyle = '#f7f2e4'; g.beginPath(); g.arc(64, 64, 22, 0, TAU); g.fill(); });
  T.tapes = {};
  const tapeLabel = (txt, extra) => ctex(128, 64, (g, w, h) => { g.fillStyle = '#131313'; g.fillRect(0, 0, w, h); g.fillStyle = '#efe9dc'; g.fillRect(10, 10, 108, 34); g.save(); g.translate(16, 36); g.rotate(-0.03); g.font = `24px ${FONT_HAND}`; g.fillStyle = '#1a1a1a'; g.fillText(txt, 0, 0); g.restore(); if (extra) { g.font = `15px ${FONT_HAND}`; g.fillStyle = '#8a1010'; g.fillText(extra, 60, 22); } });
  T.tapes.tapeW = tapeLabel('WED 10/26'); T.tapes.tapeT = tapeLabel('THU 10/27'); T.tapes.tapeF = tapeLabel('FRI 10/28'); T.tapes.tapeS = tapeLabel('SAT 10/29', "DON'T");
  // dynamic
  T.clock = ctex(256, 128, () => {}); T.vcr = ctex(128, 32, () => {}); T.osd = ctex(256, 192, () => {});
}

function makeMaterials() {
  M.wall = toon(0xffffff, T.wall); M.carpet = toon(0xffffff, T.carpet); M.ceil = toon(0xffffff, T.ceil);
  M.wood = toon(0xffffff, T.wood); M.woodDark = toon(0x8a7f78, T.wood); M.woodLight = toon(0xc0a080, T.wood);
  M.base = toon(0x2a1c14); M.spread = toon(0xffffff, T.spread); M.sheet = toon(0xd2c9b2); M.pillow = toon(0xddd4bf); M.skirt = toon(0x5c3b22);
  M.metal = toon(0xa9adb0); M.brass = toon(0xb58d3f); M.black = toon(0x181616); M.plastic = toon(0xd8ceb6); M.leather = toon(0x5a3822); M.leatherDark = toon(0x3b2416);
  M.paper = toon(0xe8e0cc); M.chair = toon(0x6a4a2f); M.vinyl = toon(0x38483a); M.door = toon(0xffffff, T.door); M.board = toon(0x8a7050, T.wood);
  M.alu = toon(0xb9bec1); M.coat = toon(0x3c3a36); M.suit = toon(0x6a4326); M.tvwood = toon(0xa08060, T.wood); M.beige = toon(0xbdb49c); M.red = toon(0x7a1c18);
  M.mug = toon(0xcfc6a8); M.yellow = toon(0xd9b43a); M.grey = toon(0x6a6a66); M.cream = toon(0xe0d7bf); M.frame = toon(0x9b7b40);
  M.paint = toon(0xffffff, T.painting); M.insc = toon(0xffffff, T.insc);
  M.grille = toon(0xffffff, T.grille, { transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
  M.duct = basic(0x040404, { side: THREE.BackSide });
  M.decal = (tex, op = 1) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: op, polygonOffset: true, polygonOffsetFactor: -2 });
  M.decalToon = tex => toon(0xffffff, tex, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  M.shade = toon(0xe8d2a0, null, { side: THREE.DoubleSide });
  M.lampOn = basic(0xffd89a); M.lampOff = toon(0xcdbf98);
  M.dome = basic(0xfff3dc); M.domeOff = toon(0xd5cfc2);
}

function tapeMesh(id, parent, x, y, z, ry = 0) {
  const g = grp(x, y, z, parent); g.rotation.y = ry;
  box(0.1, 0.025, 0.188, M.black, 0, 0, 0, g);
  const lab = plane(0.085, 0.045, toon(0xffffff, T.tapes[id]), 0, 0.0128, 0.0, 0, g); lab.rotation.x = -Math.PI / 2; lab.rotation.z = Math.PI / 2;
  return g;
}

function buildRoom() {
  /* ---- shell ---- */
  const floor = mesh(new THREE.PlaneGeometry(5, 6), M.carpet, 0, 0, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  const ceil = mesh(new THREE.PlaneGeometry(5, 6), M.ceil, 0, 2.7, 0); ceil.rotation.x = Math.PI / 2; ceil.castShadow = false;
  // north (vent hole x 1.875..2.325, y 2.3..2.6)
  slab(-2.62, 1.875, 0, 2.7, -3.12, -3.0, M.wall); slab(2.325, 2.62, 0, 2.7, -3.12, -3.0, M.wall);
  slab(1.875, 2.325, 0, 2.3, -3.12, -3.0, M.wall); slab(1.875, 2.325, 2.6, 2.7, -3.12, -3.0, M.wall);
  // south (door hole x 1.0..1.9, y 0..2.05)
  slab(-2.62, 1.0, 0, 2.7, 3.0, 3.12, M.wall); slab(1.9, 2.62, 0, 2.7, 3.0, 3.12, M.wall); slab(1.0, 1.9, 2.05, 2.7, 3.0, 3.12, M.wall);
  // west (window hole z -1.6..-0.4, y 0.9..2.0)
  slab(-2.62, -2.5, 0, 2.7, -3.12, -1.6, M.wall); slab(-2.62, -2.5, 0, 2.7, -0.4, 3.12, M.wall);
  slab(-2.62, -2.5, 0, 0.9, -1.6, -0.4, M.wall); slab(-2.62, -2.5, 2.0, 2.7, -1.6, -0.4, M.wall);
  // east
  slab(2.5, 2.62, 0, 2.7, -3.12, 3.12, M.wall);
  // baseboards + crown
  box(5, 0.09, 0.02, M.base, 0, 0.045, -2.99); box(3.5, 0.09, 0.02, M.base, -0.75, 0.045, 2.99); box(0.6, 0.09, 0.02, M.base, 2.2, 0.045, 2.99);
  box(0.02, 0.09, 6, M.base, -2.49, 0.045, 0); box(0.02, 0.09, 6, M.base, 2.49, 0.045, 0);
  box(5, 0.05, 0.03, M.cream, 0, 2.675, -2.985); box(5, 0.05, 0.03, M.cream, 0, 2.675, 2.985); box(0.03, 0.05, 6, M.cream, -2.485, 2.675, 0); box(0.03, 0.05, 6, M.cream, 2.485, 2.675, 0);

  // contact shadows (fake)
  const cs = (w, d, x, z, op = 0.8) => { const p = plane(w, d, M.decal(T.shadow, op), x, 0.004, z); p.rotation.x = -Math.PI / 2; noRay(p); p.receiveShadow = false; return p; };
  cs(2.1, 2.5, -1.0, -1.95); cs(0.8, 0.7, 0.25, -2.75); cs(0.9, 1.6, -2.2, 0.8, 0.6); cs(0.9, 1.6, -2.2, 2.33); cs(0.8, 2.0, 2.24, -0.2); cs(0.6, 0.7, 2.12, 1.05, 0.6);

  /* ---- ceiling light ---- */
  O.dome = mesh(new THREE.SphereGeometry(0.2, 20, 8, 0, TAU, 0, Math.PI / 2), M.domeOff, 0, 2.7, 0.3); O.dome.rotation.x = Math.PI; O.dome.scale.y = 0.45;

  /* ---- vent ---- */
  const duct = mesh(new THREE.BoxGeometry(0.45, 0.3, 0.9), M.duct, 2.1, 2.45, -3.45); duct.castShadow = false;
  O.ventZone = grp(0, 0, 0); O.ventZone.add(duct); duct.position.set(2.1, 2.45, -3.45);
  O.vent = grp(2.1, 2.45, -2.99);
  const gp = plane(0.46, 0.31, M.grille, 0, 0, 0.004, 0, O.vent); gp.castShadow = true;
  box(0.5, 0.025, 0.012, M.cream, 0, 0.165, 0, O.vent); box(0.5, 0.025, 0.012, M.cream, 0, -0.165, 0, O.vent);
  box(0.025, 0.33, 0.012, M.cream, -0.24, 0, 0, O.vent); box(0.025, 0.33, 0.012, M.cream, 0.24, 0, 0, O.vent);
  O.screws = [[-0.22, 0.145], [0.22, 0.145], [-0.22, -0.145], [0.22, -0.145]].map(([x, y]) => { const s = cyl(0.008, 0.008, 0.008, M.grey, x, y, 0.008, O.vent, 8); s.rotation.x = Math.PI / 2; return s; });
  O.ventZone.add(O.vent); O.vent.position.set(2.1, 2.45, -2.99);
  // things inside the vent
  O.ventItems = grp(2.1, 2.33, -3.2);
  box(0.1, 0.004, 0.13, M.paper, -0.08, 0, 0, O.ventItems); box(0.09, 0.004, 0.11, M.cream, 0.08, 0, -0.03, O.ventItems); box(0.06, 0.01, 0.06, M.leatherDark, 0.02, 0.005, 0.07, O.ventItems);
  O.ventZone.add(O.ventItems); O.ventItems.position.set(2.1, 2.31, -3.2);
  O.eyes = layer1(grp(2.1, 2.47, -3.62)); [-0.045, 0.045].forEach(x => { const e = mesh(new THREE.SphereGeometry(0.011, 8, 6), basic(0xe4dcb0, { fog: false }), x, 0, 0, O.eyes); e.layers.set(1); }); O.eyes.visible = false;
  const streak = plane(0.42, 1.5, M.decal(T.streak, 0.9), 2.1, 1.52, -2.996); noRay(streak);
  O.stainFloor = plane(0.9, 0.7, M.decal(T.floorStain, 0.9), 2.1, 0.005, -2.6); O.stainFloor.rotation.x = -Math.PI / 2;
  O.streak = streak;

  /* ---- window (west) ---- */
  const outside = plane(3.4, 2.2, basic(0xffffff, { map: T.outside, fog: false }), -3.7, 1.4, -1.0, Math.PI / 2); noRay(outside); O.outside = outside;
  O.towerLight = plane(0.035, 0.035, basic(0xff2a1a, { fog: false, transparent: true }), -3.68, 1.915, -1.357, Math.PI / 2); noRay(O.towerLight);
  M.glass = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, flash: { value: 0 } }, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float time, flash; float h(float x){ return fract(sin(x*91.3)*47453.1); }
      void main(){ vec2 g = vUv*vec2(46.0,1.0); float id = floor(g.x); float r = h(id); float y = fract(vUv.y*2.0 + time*(0.25+0.5*r) + r*7.0);
        float streak = smoothstep(0.45,0.5,abs(fract(g.x)-0.5)*-1.0+0.5) * smoothstep(0.0,0.3,y) * step(0.55, r) * (1.0-y);
        float drops = step(0.985, h(floor(vUv.x*60.0)+floor(vUv.y*40.0)*13.0+floor(time*0.3)));
        float a = 0.06 + streak*0.35 + drops*0.25 + flash*0.3;
        gl_FragColor = vec4(vec3(0.6,0.66,0.75)+flash, a); }`,
  });
  const glass = plane(1.2, 1.1, M.glass, -2.575, 1.45, -1.0, Math.PI / 2); layer1(glass);
  O.hand = plane(0.16, 0.2, M.decal(T.hand, 0.8), -2.59, 1.52, -1.2, Math.PI / 2); layer1(O.hand); O.hand.visible = false;
  box(0.06, 0.05, 1.3, M.cream, -2.47, 0.9, -1.0); box(0.06, 0.05, 1.3, M.cream, -2.47, 2.02, -1.0); box(0.06, 1.16, 0.05, M.cream, -2.47, 1.45, -1.62); box(0.06, 1.16, 0.05, M.cream, -2.47, 1.45, -0.38);
  box(0.12, 0.03, 1.36, M.cream, -2.44, 0.875, -1.0);
  O.blinds = grp(-2.45, 0, -1.0); O.slats = [];
  box(0.05, 0.05, 1.22, M.cream, 0, 2.0, 0, O.blinds);
  for (let i = 0; i < 16; i++) { const s = box(0.045, 0.003, 1.17, M.cream, 0, 1.95 - i * 0.064, 0, O.blinds); O.slats.push(s); }
  cyl(0.002, 0.002, 1.0, M.cream, 0, 1.45, 0.55, O.blinds, 4);
  // wall heater under window
  O.heater = grp(-2.37, 0, -1.0); box(0.25, 0.5, 0.9, M.beige, 0, 0.25, 0, O.heater); for (let i = 0; i < 8; i++) box(0.01, 0.012, 0.8, M.grey, 0.126, 0.33 + i * 0.018, 0, O.heater);

  /* ---- bed (headboard on north wall) ---- */
  const bed = grp(-1.0, 0, -1.95); O.bed = bed;
  box(1.56, 0.1, 2.02, M.wood, 0, 0.29, 0, bed);
  [[-0.72, -0.95], [0.72, -0.95], [-0.72, 0.95], [0.72, 0.95]].forEach(([x, z]) => box(0.06, 0.24, 0.06, M.wood, x, 0.12, z, bed));
  box(1.5, 0.2, 1.98, M.sheet, 0, 0.44, 0, bed);
  O.spread = box(1.6, 0.07, 1.66, M.spread, 0, 0.575, 0.17, bed);
  box(0.02, 0.24, 1.66, M.spread, 0.8, 0.46, 0.17, bed); box(0.02, 0.24, 1.66, M.spread, -0.8, 0.46, 0.17, bed); box(1.6, 0.24, 0.02, M.spread, 0, 0.46, 1.0, bed);
  box(0.62, 0.13, 0.34, M.pillow, -0.36, 0.63, -0.78, bed); box(0.62, 0.13, 0.34, M.pillow, 0.36, 0.63, -0.78, bed);
  box(1.72, 1.05, 0.06, M.wood, 0, 0.62, -0.99, bed); box(1.76, 0.06, 0.08, M.woodDark, 0, 1.16, -0.99, bed);
  O.skirtE = grp(0.815, 0.34, 0.0, bed); box(0.012, 0.32, 2.0, M.skirt, 0, -0.16, 0, O.skirtE);
  O.skirtF = grp(0, 0.34, 1.025, bed); box(1.62, 0.32, 0.012, M.skirt, 0, -0.16, 0, O.skirtF);
  O.shoes = grp(-0.55, 0, -1.6);
  [[0, 0, 0.05], [-0.13, 0.03, -0.08]].forEach(([x, z, r]) => { const s = grp(x, 0, z, O.shoes); s.rotation.y = r; box(0.1, 0.025, 0.28, M.black, 0, 0.0125, 0, s); box(0.09, 0.07, 0.2, M.leather, 0, 0.06, -0.03, s); box(0.085, 0.045, 0.08, M.leather, 0, 0.045, 0.1, s); box(0.05, 0.004, 0.08, M.leatherDark, 0, 0.096, -0.07, s); });
  O.imprint = plane(0.62, 1.4, M.decal(T.imprint, 0.9), 0, 0.613, 0.05, 0, bed); O.imprint.rotation.x = -Math.PI / 2; noRay(O.imprint); O.imprint.visible = false;
  // the lump (only ever seen on the television)
  O.lump = grp(0, 0.6, 0.1, bed); O.lump.visible = false;
  const lumpMat = toon(0xcfc6b0);
  O.lumpUpper = grp(0, 0, -0.1, O.lump);
  const torso = mesh(new THREE.SphereGeometry(1, 16, 12), lumpMat, 0, 0.06, -0.3, O.lumpUpper); torso.scale.set(0.26, 0.14, 0.42);
  const head = mesh(new THREE.SphereGeometry(1, 14, 10), lumpMat, 0, 0.1, -0.78, O.lumpUpper); head.scale.set(0.12, 0.12, 0.14);
  const legs = mesh(new THREE.SphereGeometry(1, 14, 10), lumpMat, 0, 0.05, 0.45, O.lump); legs.scale.set(0.24, 0.1, 0.5);
  noRay(O.lump);

  /* ---- nightstand ---- */
  const ns = grp(0.25, 0, -2.75); O.ns = ns;
  box(0.55, 0.58, 0.45, M.wood, 0, 0.29, 0, ns);
  O.nsDrawer = box(0.5, 0.15, 0.02, M.woodDark, 0, 0.45, 0.232, ns); box(0.06, 0.02, 0.02, M.brass, 0, 0.45, 0.25, ns);
  O.lamp = grp(0.15, 0.58, -0.1, ns);
  cyl(0.07, 0.085, 0.04, M.brass, 0, 0.02, 0, O.lamp); cyl(0.012, 0.012, 0.28, M.brass, 0, 0.18, 0, O.lamp);
  O.shade = mesh(new THREE.CylinderGeometry(0.095, 0.155, 0.2, 20, 1, true), M.shade, 0, 0.38, 0, O.lamp);
  O.bulb = mesh(new THREE.SphereGeometry(0.03, 10, 8), M.lampOn, 0, 0.33, 0, O.lamp);
  O.phone = grp(-0.13, 0.58, -0.06, ns);
  box(0.22, 0.07, 0.19, M.plastic, 0, 0.035, 0, O.phone); box(0.2, 0.03, 0.12, M.plastic, 0, 0.08, -0.025, O.phone);
  const rcv = grp(0, 0.115, -0.025, O.phone); box(0.2, 0.035, 0.045, M.plastic, 0, 0, 0, rcv); box(0.06, 0.05, 0.065, M.plastic, -0.085, -0.012, 0, rcv); box(0.06, 0.05, 0.065, M.plastic, 0.085, -0.012, 0, rcv);
  const dial = cyl(0.058, 0.058, 0.008, toon(0xffffff, T.dial), 0, 0.074, 0.06, O.phone, 24); dial.rotation.x = 0.45;
  O.msgLamp = mesh(new THREE.SphereGeometry(0.009, 8, 6), basic(0xff2a1f), 0.085, 0.072, 0.085, O.phone);
  const cord = mesh(new THREE.TorusGeometry(0.05, 0.004, 5, 20, Math.PI * 1.3), M.plastic, -0.12, 0.03, 0.02, O.phone); cord.rotation.y = 1.2; noRay(cord);
  O.pad = box(0.12, 0.012, 0.16, toon(0xffffff, T.pad), -0.12, 0.586, 0.14, ns); O.pad.rotation.y = 0.12;
  O.clock = grp(0.15, 0.58, 0.12, ns); O.clock.rotation.y = -0.4;
  box(0.17, 0.095, 0.08, M.black, 0, 0.048, 0, O.clock);
  plane(0.15, 0.07, basic(0xffffff, { map: T.clock }), 0, 0.05, 0.0405, 0, O.clock);

  /* ---- painting over bed + inscription behind it ---- */
  O.insc = plane(0.9, 0.6, M.insc, -1.0, 1.62, -2.996);
  O.painting = grp(-1.0, 1.62, -2.975);
  plane(0.9, 0.58, M.paint, 0, 0, 0.013, 0, O.painting);
  box(0.96, 0.04, 0.03, M.frame, 0, 0.31, 0, O.painting); box(0.96, 0.04, 0.03, M.frame, 0, -0.31, 0, O.painting);
  box(0.04, 0.66, 0.03, M.frame, -0.46, 0, 0, O.painting); box(0.04, 0.66, 0.03, M.frame, 0.46, 0, 0, O.painting);
  box(0.9, 0.58, 0.01, M.woodDark, 0, 0, -0.008, O.painting);

  /* ---- desk (west wall) ---- */
  const desk = grp(-2.21, 0, 0.8); O.desk = desk;
  box(0.58, 0.04, 1.2, M.wood, 0, 0.74, 0, desk);
  [[-0.25, -0.56], [0.25, -0.56], [-0.25, 0.56], [0.25, 0.56]].forEach(([x, z]) => box(0.04, 0.72, 0.04, M.wood, x, 0.36, z, desk));
  box(0.5, 0.1, 0.02, M.wood, 0.02, 0.66, -0.47, desk); box(0.5, 0.1, 0.02, M.wood, 0.02, 0.66, 0.47, desk);
  O.drawer = grp(0, 0.66, 0.2, desk);
  box(0.02, 0.1, 0.44, M.woodDark, 0.285, 0, 0, O.drawer); box(0.05, 0.015, 0.1, M.brass, 0.3, 0, 0, O.drawer);
  box(0.5, 0.01, 0.42, M.wood, 0.03, -0.045, 0, O.drawer); box(0.5, 0.08, 0.01, M.wood, 0.03, -0.01, -0.205, O.drawer); box(0.5, 0.08, 0.01, M.wood, 0.03, -0.01, 0.205, O.drawer);
  O.pencil = cyl(0.0045, 0.0045, 0.17, M.yellow, 0.1, -0.034, 0.04, O.drawer, 6); O.pencil.rotation.x = Math.PI / 2; O.pencil.rotation.z = 0.3;
  box(0.08, 0.02, 0.12, M.cream, -0.08, -0.03, -0.1, O.drawer);
  O.log = box(0.2, 0.025, 0.27, toon(0xffffff, T.logCover), 0.03, 0.772, -0.24, desk); O.log.rotation.y = 0.12;
  O.recorder = grp(0.05, 0.76, 0.28, desk); box(0.09, 0.03, 0.15, M.black, 0, 0.015, 0, O.recorder); box(0.07, 0.004, 0.06, M.metal, 0, 0.032, -0.03, O.recorder); box(0.05, 0.006, 0.03, M.grey, 0, 0.032, 0.04, O.recorder);
  O.ashtray = cyl(0.06, 0.05, 0.025, toon(0x7a8a86), -0.12, 0.772, 0.47, desk);
  for (let i = 0; i < 7; i++) { const b = cyl(0.004, 0.004, 0.03, M.cream, -0.12 + rand(-0.03, 0.03), 0.79, 0.47 + rand(-0.03, 0.03), desk, 5); b.rotation.z = Math.PI / 2; b.rotation.y = rand(0, 3); noRay(b); }
  O.mug = cyl(0.04, 0.036, 0.09, M.mug, 0.16, 0.805, -0.47, desk);
  O.coil = mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 22), M.black, -0.12, 0.772, 0.0, desk); O.coil.rotation.x = Math.PI / 2;
  O.meter = grp(-0.1, 0.76, 0.18, desk); box(0.16, 0.09, 0.12, M.grey, 0, 0.045, 0, O.meter); box(0.005, 0.05, 0.08, M.cream, 0.082, 0.05, 0, O.meter);

  /* ---- chair ---- */
  O.chair = grp(CHAIR_DESK.x, 0, CHAIR_DESK.z);
  box(0.44, 0.05, 0.44, M.vinyl, 0, 0.475, 0, O.chair);
  [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([x, z]) => box(0.035, 0.46, 0.035, M.chair, x, 0.23, z, O.chair));
  box(0.035, 0.5, 0.035, M.chair, 0.2, 0.75, -0.19, O.chair); box(0.035, 0.5, 0.035, M.chair, 0.2, 0.75, 0.19, O.chair);
  box(0.03, 0.14, 0.42, M.chair, 0.2, 0.92, 0, O.chair); box(0.03, 0.05, 0.42, M.chair, 0.2, 0.7, 0, O.chair);

  /* ---- wardrobe (south-west corner) ---- */
  const wd = grp(-2.2, 0, 2.33); O.wd = wd;
  box(0.02, 2.05, 1.22, M.wood, -0.29, 1.025, 0, wd);
  box(0.6, 2.05, 0.02, M.wood, 0, 1.025, -0.6, wd); box(0.6, 2.05, 0.02, M.wood, 0, 1.025, 0.6, wd);
  box(0.62, 0.03, 1.24, M.wood, 0, 2.035, 0, wd); box(0.6, 0.08, 1.22, M.wood, 0, 0.04, 0, wd);
  box(0.012, 0.03, 1.24, M.wood, 0.305, 2.065, 0, wd); box(0.012, 0.03, 1.24, M.wood, -0.305, 2.065, 0, wd);
  box(0.62, 0.03, 0.012, M.wood, 0, 2.065, -0.615, wd); box(0.62, 0.03, 0.012, M.wood, 0, 2.065, 0.615, wd);
  cyl(0.012, 0.012, 1.18, M.metal, -0.05, 1.78, 0, wd, 8).rotation.x = Math.PI / 2;
  O.wdL = grp(0.3, 0, -0.61, wd); O.wdR = grp(0.3, 0, 0.61, wd);
  box(0.02, 1.95, 0.6, M.wood, 0.01, 1.03, 0.3, O.wdL); box(0.02, 1.95, 0.6, M.wood, 0.01, 1.03, -0.3, O.wdR);
  box(0.02, 0.1, 0.02, M.brass, 0.03, 1.05, 0.56, O.wdL); box(0.02, 0.1, 0.02, M.brass, 0.03, 1.05, -0.56, O.wdR);
  box(0.004, 0.018, 0.008, M.black, 0.022, 0.97, -0.56, O.wdR);
  const scrL = plane(0.56, 1.8, M.decal(T.scratches, 1), -0.002, 1.0, 0.3, -Math.PI / 2, O.wdL); const scrR = plane(0.56, 1.8, M.decal(T.scratches, 1), -0.002, 1.0, -0.3, -Math.PI / 2, O.wdR);
  O.scratches = [scrL, scrR];
  O.coat = grp(-0.06, 1.2, -0.28, wd);
  box(0.12, 0.95, 0.5, M.coat, 0, 0, 0, O.coat); box(0.14, 0.08, 0.52, M.coat, 0, 0.46, 0, O.coat); cyl(0.005, 0.005, 0.44, M.metal, 0, 0.52, 0, O.coat, 5).rotation.x = Math.PI / 2;
  O.suit = grp(0.0, 0.08, 0.22, wd);
  box(0.42, 0.1, 0.56, M.suit, 0, 0.05, 0, O.suit);
  O.suitLid = grp(-0.21, 0.1, 0, O.suit); box(0.42, 0.06, 0.56, M.suit, 0.21, 0.03, 0, O.suitLid);
  box(0.012, 0.03, 0.05, M.brass, 0.215, 0.1, -0.18, O.suit); box(0.012, 0.03, 0.05, M.brass, 0.215, 0.1, 0.18, O.suit); box(0.012, 0.025, 0.08, M.black, 0.215, 0.1, 0, O.suit);
  box(0.03, 0.02, 0.14, M.leatherDark, 0, 0.165, 0, O.suit);
  O.suitIn = grp(0, 0.1, 0, O.suit); box(0.08, 0.02, 0.15, M.black, 0.05, 0.01, -0.12, O.suitIn); box(0.1, 0.004, 0.14, M.cream, -0.08, 0.004, 0.1, O.suitIn); box(0.06, 0.004, 0.09, M.paper, 0.08, 0.004, 0.14, O.suitIn);
  O.tapeS = tapeMesh('tapeS', wd, -0.12, 2.0625, 0.28, 0.2);
  O.tapeS.children[1].material = basic(0xffffff, { map: T.tapes.tapeS });

  /* ---- dresser, TV, VCR, mirror ---- */
  const dr = grp(2.24, 0, -0.2); O.dresser = dr;
  box(0.52, 0.8, 1.6, M.wood, 0, 0.4, 0, dr);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { box(0.02, 0.2, 0.74, M.woodDark, -0.265, 0.16 + r * 0.24, -0.39 + c * 0.78, dr); box(0.02, 0.02, 0.1, M.brass, -0.28, 0.16 + r * 0.24, -0.39 + c * 0.78, dr); }
  O.tv = grp(2.22, 0.8, -0.5);
  box(0.46, 0.46, 0.6, M.tvwood, 0, 0.23, 0, O.tv);
  box(0.02, 0.36, 0.44, M.black, -0.23, 0.245, -0.06, O.tv);
  box(0.01, 0.44, 0.12, M.grey, -0.232, 0.23, 0.22, O.tv);
  O.kPower = cyl(0.015, 0.015, 0.02, M.cream, -0.245, 0.38, 0.22, O.tv, 12); O.kPower.rotation.z = Math.PI / 2;
  O.kChan = cyl(0.03, 0.03, 0.025, M.black, -0.245, 0.27, 0.22, O.tv, 12); O.kChan.rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) box(0.004, 0.006, 0.09, M.black, -0.238, 0.1 + i * 0.018, 0.22, O.tv);
  const ant1 = cyl(0.004, 0.004, 0.55, M.metal, 0, 0.7, -0.08, O.tv, 5); ant1.rotation.x = 0.5; const ant2 = cyl(0.004, 0.004, 0.55, M.metal, 0, 0.7, 0.08, O.tv, 5); ant2.rotation.x = -0.5; cyl(0.04, 0.05, 0.03, M.black, 0, 0.475, 0, O.tv);
  O.screen = plane(0.4, 0.3, basic(0), -0.2415, 0.245, -0.06, -Math.PI / 2, O.tv); O.screen.castShadow = false;
  O.glassTV = cyl(0.025, 0.022, 0.09, toon(0x9fb3b8, null, { transparent: true, opacity: 0.6 }), 0.05, 0.505, -0.15, O.tv, 10); O.glassTV.visible = false; noRay(O.glassTV);
  O.vcr = grp(2.26, 0.8, 0.06);
  box(0.3, 0.09, 0.36, M.black, 0, 0.045, 0, O.vcr); box(0.005, 0.012, 0.2, M.grey, -0.151, 0.06, -0.04, O.vcr);
  plane(0.1, 0.025, basic(0xffffff, { map: T.vcr }), -0.153, 0.03, 0.1, -Math.PI / 2, O.vcr);
  O.vcrTape = grp(2.12, 0.86, 0.02); box(0.1, 0.025, 0.188, M.black, 0, 0, 0, O.vcrTape);
  O.vcrLabel = plane(0.17, 0.018, toon(0xffffff, T.tapes.tapeW), -0.0505, 0, 0, -Math.PI / 2, O.vcrTape); O.vcrTape.visible = false;
  O.guide = plane(0.2, 0.26, toon(0xffffff, T.guide), 2.29, 0.892, 0.05); O.guide.rotation.x = -Math.PI / 2; O.guide.rotation.z = 0.15;
  O.tapeW = tapeMesh('tapeW', scene, 2.3, 0.8125, 0.44, 0.1);
  O.tapeF = tapeMesh('tapeF', scene, 2.28, 0.8375, 0.45, -0.15);
  O.mirror = grp(2.485, 1.78, -0.2);
  box(0.02, 0.9, 0.76, M.frame, 0, 0, 0, O.mirror);
  plane(0.7, 0.86, toon(0xffffff, T.towel), -0.014, -0.02, 0, -Math.PI / 2, O.mirror);
  [[0.4, 0.35], [0.4, -0.35], [-0.4, 0.35], [-0.4, -0.35]].forEach(([y, z]) => box(0.004, 0.03, 0.08, M.cream, -0.016, y, z, O.mirror));
  O.case = grp(2.12, 0, 1.05);
  box(0.36, 0.14, 0.5, M.alu, 0, 0.07, 0, O.case);
  O.caseLid = grp(0.18, 0.14, 0, O.case); box(0.36, 0.035, 0.5, M.alu, -0.18, 0.0175, 0, O.caseLid);
  box(0.01, 0.04, 0.12, M.black, -0.183, 0.12, 0, O.case); box(0.012, 0.03, 0.04, M.metal, -0.184, 0.13, -0.17, O.case); box(0.012, 0.03, 0.04, M.metal, -0.184, 0.13, 0.17, O.case);
  box(0.04, 0.02, 0.18, M.black, 0, 0.18, 0, O.caseLid);
  O.caseIn = grp(0, 0.14, 0, O.case); cyl(0.006, 0.01, 0.22, M.red, -0.05, 0.005, 0.05, O.caseIn, 6).rotation.x = Math.PI / 2; cyl(0.025, 0.025, 0.2, M.black, 0.06, 0.02, -0.08, O.caseIn, 10).rotation.x = Math.PI / 2;

  /* ---- exit door (south) ---- */
  O.door = grp(1.0, 0, 2.975);
  box(0.9, 2.04, 0.05, M.door, 0.45, 1.02, 0, O.door);
  mesh(new THREE.SphereGeometry(0.03, 12, 10), M.brass, 0.8, 1.0, -0.045, O.door);
  box(0.12, 0.035, 0.008, M.metal, 0.83, 1.3, -0.03, O.door);
  cyl(0.012, 0.012, 0.02, M.black, 0.45, 1.56, -0.03, O.door, 10).rotation.x = Math.PI / 2;
  O.firemap = plane(0.22, 0.165, toon(0xffffff, T.firemap), 0.45, 1.32, -0.027, Math.PI, O.door);
  plane(0.08, 0.04, toon(0xffffff, T.plaque), 0.45, 1.72, -0.027, Math.PI, O.door);
  const dnd = plane(0.07, 0.17, toon(0xffffff, T.dnd), 0.8, 0.86, -0.075, Math.PI, O.door); noRay(dnd);
  for (let i = 0; i < 6; i++) { const l = mesh(new THREE.TorusGeometry(0.008, 0.002, 4, 8), M.metal, 0.9 + i * 0.016, 1.46 - Math.sin(i / 5 * Math.PI) * 0.03, -0.04, O.door); noRay(l); }
  box(0.06, 2.1, 0.04, M.cream, 0.97, 1.05, 2.975); box(0.06, 2.1, 0.04, M.cream, 1.93, 1.05, 2.975); box(1.02, 0.06, 0.04, M.cream, 1.45, 2.08, 2.975);
  box(0.03, 0.05, 0.03, M.metal, 1.93, 1.3, 2.945);
  O.lock = grp(1.93, 1.215, 2.94);
  box(0.052, 0.062, 0.024, M.brass, 0, 0, 0, O.lock);
  for (let i = 0; i < 5; i++) cyl(0.006, 0.006, 0.008, M.black, -0.02 + i * 0.01, -0.02, -0.014, O.lock, 8).rotation.x = Math.PI / 2;
  O.shackle = mesh(new THREE.TorusGeometry(0.018, 0.0045, 6, 14, Math.PI), M.metal, 0, 0.03, 0, O.lock);
  // corridor beyond the door
  const cc = toon(0xffffff, T.carpet); const cw = toon(0x6f6a58, T.wall);
  const cf = mesh(new THREE.PlaneGeometry(1.9, 13), cc, 1.45, 0, 9.6); cf.rotation.x = -Math.PI / 2;
  const cce = mesh(new THREE.PlaneGeometry(1.9, 13), M.ceil, 1.45, 2.5, 9.6); cce.rotation.x = Math.PI / 2;
  tbox(0.1, 2.5, 13, cw, 0.45, 1.25, 9.6, scene, 1.2); tbox(0.1, 2.5, 13, cw, 2.45, 1.25, 9.6, scene, 1.2); tbox(2.1, 2.5, 0.1, cw, 1.45, 1.25, 16.15, scene, 1.2);
  plane(0.85, 2.0, M.door, 0.51, 1.0, 6.2, Math.PI / 2); plane(0.85, 2.0, M.door, 2.39, 1.0, 9.4, -Math.PI / 2); plane(0.85, 2.0, M.door, 0.51, 1.0, 12.6, Math.PI / 2);
  plane(0.9, 2.0, M.door, 1.45, 1.0, 16.09, Math.PI);
  plane(0.3, 0.11, basic(0xffffff, { map: T.exit, fog: false }), 1.45, 2.25, 16.08, Math.PI);
  box(0.3, 0.03, 0.3, M.cream, 1.45, 2.49, 8.0);

  /* ---- bathroom door (nailed shut) ---- */
  O.bath = grp(-0.9, 0, 2.975);
  O.bathPanel = box(0.8, 2.04, 0.04, M.door, 0, 1.02, 0, O.bath);
  mesh(new THREE.SphereGeometry(0.028, 12, 10), M.brass, -0.3, 1.0, -0.04, O.bath);
  box(0.06, 2.1, 0.04, M.cream, -0.43, 1.05, -0.005, O.bath); box(0.06, 2.1, 0.04, M.cream, 0.43, 1.05, -0.005, O.bath); box(0.92, 0.06, 0.04, M.cream, 0, 2.08, -0.005, O.bath);
  O.boards = [[0.55, 0.16], [1.12, -0.12], [1.68, 0.09]].map(([y, r]) => { const b = grp(-0.48, y, -0.04, O.bath); b.rotation.z = r; box(1.0, 0.11, 0.025, M.board, 0.48, 0, 0, b); cyl(0.006, 0.006, 0.01, M.black, 0.05, 0, -0.014, b, 6).rotation.x = Math.PI / 2; cyl(0.006, 0.006, 0.01, M.black, 0.91, 0, -0.014, b, 6).rotation.x = Math.PI / 2; b.userData.r0 = r; return b; });
  const gap = plane(0.76, 0.012, basic(0x000000), 0, 0.006, -0.021, Math.PI, O.bath); noRay(gap);

  /* ---- calendar, switch ---- */
  O.calendar = plane(0.3, 0.42, toon(0xffffff, T.calendar), 0.35, 1.5, 2.994, Math.PI);
  O.switch = grp(2.2, 1.25, 2.993); box(0.07, 0.11, 0.01, M.cream, 0, 0, 0, O.switch); O.switchLever = box(0.015, 0.03, 0.015, M.cream, 0, 0.01, -0.01, O.switch);

  /* ---- moths ---- */
  O.moths = [];
  const mm = new THREE.SpriteMaterial({ map: T.moth, transparent: true, depthWrite: false });
  for (let i = 0; i < 36; i++) { const s = new THREE.Sprite(mm); s.scale.set(0.06, 0.06, 1); s.visible = false; layer1(s); scene.add(s); O.moths.push({ s, v: new THREE.Vector3(), life: 0 }); }

  /* ---- lights ---- */
  L.hemi = new THREE.HemisphereLight(0x8a96aa, 0x2a1a14, 1.15); scene.add(L.hemi);
  L.lamp = new THREE.PointLight(0xffb060, 5, 0, 2); L.lamp.position.set(0.4, 0.95, -2.85); scene.add(L.lamp);
  L.ceil = new THREE.PointLight(0xfff0d0, 7, 0, 2); L.ceil.position.set(0, 2.45, 0.3); scene.add(L.ceil);
  L.tv = new THREE.PointLight(0x9fd8ff, 0, 0, 2); L.tv.position.set(1.72, 1.05, -0.5); scene.add(L.tv);
  L.neon = new THREE.PointLight(0xff3228, 0.7, 0, 2); L.neon.position.set(-2.95, 1.7, -1.0); scene.add(L.neon);
  L.feed = new THREE.PointLight(0xc8dcff, 0, 0, 1.4); L.feed.position.set(1.8, 2.3, -2.5); scene.add(L.feed);
  L.hall = new THREE.PointLight(0xffd8a0, 0, 0, 2); L.hall.position.set(1.45, 2.3, 8.0); scene.add(L.hall);
  L.flash = new THREE.SpotLight(0xfff0d8, 0, 14, 0.42, 0.55, 2);
  L.flash.position.set(0.12, -0.12, 0.05); L.flash.target.position.set(0.04, -0.06, -2); camera.add(L.flash); camera.add(L.flash.target);
  L.flash.castShadow = true; L.flash.shadow.mapSize.set(512, 512); L.flash.shadow.bias = -0.0015; L.flash.shadow.camera.near = 0.1; L.flash.shadow.camera.far = 10;
  L.bolt = new THREE.DirectionalLight(0xbcd0ff, 0); L.bolt.position.set(-6, 3, -1.2); L.bolt.target.position.set(0, 1, -1); scene.add(L.bolt, L.bolt.target);

  /* ---- colliders ---- */
  addCol('wN', -3, 3, -3.6, -3.0); addCol('wSL', -3, 1.0, 3.0, 3.6); addCol('wSR', 1.9, 3, 3.0, 3.6); O.colDoor = addCol('door', 1.0, 1.9, 3.0, 3.6);
  addCol('wW', -3.6, -2.5, -3.2, 3.2); addCol('wE', 2.5, 3.6, -3.2, 3.2);
  addCol('bed', -1.8, -0.19, -3.0, -0.92); addCol('ns', -0.03, 0.53, -3.0, -2.52); addCol('desk', -2.5, -1.9, 0.2, 1.4);
  addCol('ward', -2.5, -1.88, 1.72, 2.95); addCol('dresser', 1.97, 2.5, -1.0, 0.6); addCol('case', 1.93, 2.31, 0.8, 1.3); addCol('heater', -2.5, -2.23, -1.45, -0.55);
  O.colChair = addCol('chair', 0, 0, 0, 0);
  O.colHall = [addCol('hL', 0.3, 0.5, 3.0, 16.6, false), addCol('hR', 2.4, 2.6, 3.0, 16.6, false), addCol('hE', 0.3, 2.6, 16.1, 16.7, false), addCol('leaf', 0.96, 1.07, 2.06, 3.0, false)];
}


/* =====================================================================
   ROOM 406 · part B: the set (TV/VCR/feed), overrides, tapes, phone, locks, documents
   ===================================================================== */
const feedRT = new THREE.WebGLRenderTarget(320, 240);
const feedCam = new THREE.PerspectiveCamera(80, 4 / 3, 0.05, 30); feedCam.layers.enable(1);
const feedLookCur = FEED_LOOK.clone();
const tvDummy = basic(0x1a2226);
let tvMat;
const SET = { mode: 0, chShown: -10, osdT: 0, flip: 0, ghost: 0, override: null, overrideT: 0 };
const VCR = { playing: false, t: 0, prevT: 0 };

function makeTV() {
  tvMat = new THREE.ShaderMaterial({
    uniforms: { tFeed: { value: feedRT.texture }, tOSD: { value: T.osd }, mode: { value: 0 }, time: { value: 0 }, ghost: { value: 0 }, bright: { value: 1.6 }, roll: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D tFeed; uniform sampler2D tOSD; uniform float mode, time, ghost, bright, roll; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec2 c = vUv-0.5; vec2 uv = 0.5 + c*(1.0+0.12*dot(c,c));
        if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0){ gl_FragColor=vec4(0.0,0.0,0.0,1.0); return; }
        float line = floor(uv.y*190.0);
        float sn = h(vec2(floor(uv.x*210.0), line) + fract(time*61.7)*vec2(17.0,31.0));
        vec3 stat = vec3(sn)*0.8 + 0.07*sin(uv.y*7.0 + time*3.0);
        vec3 col = vec3(0.012,0.015,0.018);
        if(mode>0.5 && mode<1.5){
          col = stat;
          vec3 gh = texture2D(tFeed, uv).rgb*2.0;
          col = mix(col, gh, ghost*(0.55+0.45*sin(time*1.7)));
        } else if(mode>1.5 && mode<3.5){
          vec2 fu = uv; float jit = h(vec2(line, floor(time*24.0)))-0.5;
          fu.x += jit*0.003;
          if(mode>2.5){ fu.x += 0.012*sin(uv.y*50.0+time*3.0)*smoothstep(0.1,0.0,uv.y); }
          fu.y = fract(fu.y + roll);
          vec3 f;
          if(mode>2.5){ f.r = texture2D(tFeed, fu+vec2(0.005,0.0)).r; f.g = texture2D(tFeed, fu).g; f.b = texture2D(tFeed, fu-vec2(0.005,0.0)).b; }
          else f = texture2D(tFeed, fu).rgb;
          f = pow(max(f,0.0), vec3(0.8))*bright;
          float l = dot(f, vec3(0.3,0.59,0.11));
          f = mix(vec3(l), f, 0.3)*vec3(0.86,1.0,1.03);
          col = mix(f, stat, 0.13 + (mode>2.5 ? 0.05 + 0.6*smoothstep(0.06,0.0,uv.y) : 0.0));
          col *= 0.86 + 0.14*sin(uv.y*420.0);
        } else if(mode>3.5){ col = vec3(0.04,0.1,0.5) + sn*0.03; }
        vec4 o = texture2D(tOSD, uv); col = mix(col, o.rgb*1.2, o.a);
        col *= smoothstep(0.78, 0.22, length(c));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  O.screen.material = tvMat;
}

function roomDark() { return !S.lamp && !S.ceil; }
function tapePlaying() { return VCR.playing && S.vcr && TAPES[S.vcr]; }
// 0 off · 1 static · 2 live feed · 3 tape · 4 VCR blue
function screenMode() {
  if (SET.override) return SET.override;
  if (!S.tv.on || G.power < 0.5) return 0;
  if (S.tv.ch === 3) return tapePlaying() ? 3 : 4;
  if (S.tv.ch === 13 && roomDark()) return 2;
  return 1;
}

/* ---------- overrides: pose the room for recordings / the feed ---------- */
function applyOv(o) {
  const undo = []; const set = (obj, k, v) => { undo.push([obj, k, obj[k]]); obj[k] = v; };
  if (o.chair) { set(O.chair.position, 'x', o.chair.x); set(O.chair.position, 'z', o.chair.z); set(O.chair.rotation, 'y', o.chair.r); }
  if (o.paint !== undefined) { const up = !o.paint; set(O.painting.position, 'y', up ? 1.62 : 0.98); set(O.painting.position, 'z', up ? -2.975 : -2.62); set(O.painting.rotation, 'x', up ? 0 : -0.28); }
  if (o.ward !== undefined) { set(O.wdL.rotation, 'y', o.ward ? 1.9 : 0); set(O.wdR.rotation, 'y', o.ward ? -1.9 : 0); }
  if (o.suitLid !== undefined) set(O.suitLid.rotation, 'z', o.suitLid ? 1.2 : 0);
  if (o.caseLid !== undefined) set(O.caseLid.rotation, 'z', o.caseLid ? -1.2 : 0);
  if (o.drawer !== undefined) set(O.drawer.position, 'x', o.drawer ? 0.3 : 0);
  if (o.skirt !== undefined) { set(O.skirtE.rotation, 'z', o.skirt ? 1.35 : 0); set(O.skirtF.rotation, 'x', o.skirt ? -1.35 : 0); }
  if (o.tape4 !== undefined) set(O.tapeS, 'visible', o.tape4);
  if (o.tape4lift) { set(O.tapeS.position, 'y', 2.115); set(O.tapeS.rotation, 'z', -0.75); }
  if (o.imprint !== undefined) set(O.imprint, 'visible', o.imprint);
  if (o.lump !== undefined) set(O.lump, 'visible', o.lump);
  if (o.sit !== undefined) set(O.lumpUpper.rotation, 'x', -o.sit * 1.35);
  if (o.glass !== undefined) set(O.glassTV, 'visible', o.glass);
  if (o.vent) {
    if (o.vent === 'on') { set(O.vent, 'visible', true); set(O.vent.position, 'x', 2.1); set(O.vent.position, 'y', 2.45); set(O.vent.position, 'z', -2.99); set(O.vent.rotation, 'x', 0); }
    else { set(O.vent, 'visible', true); set(O.vent.position, 'x', 1.95); set(O.vent.position, 'y', 0.012); set(O.vent.position, 'z', -2.45); set(O.vent.rotation, 'x', -Math.PI / 2); }
  }
  if (o.door !== undefined) set(O.door.rotation, 'y', o.door);
  if (o.padOpen !== undefined) set(O.shackle.position, 'y', o.padOpen ? 0.05 : 0.03);
  if (o.bath !== undefined) set(O.bathPanel.position, 'z', o.bath);
  if (o.tapes !== undefined) { set(O.tapeW, 'visible', o.tapes); set(O.tapeF, 'visible', o.tapes); }
  if (o.dark) { set(L.lamp, 'intensity', 0); set(L.ceil, 'intensity', 0); set(L.flash, 'intensity', 0); }
  return () => { for (let i = undo.length - 1; i >= 0; i--) { const [obj, k, v] = undo[i]; obj[k] = v; } };
}
const REC_BASE = { paint: false, ward: 0, suitLid: 0, caseLid: 0, drawer: 0, skirt: 0, tape4: false, imprint: false, lump: false, sit: 0, glass: false, vent: 'on', door: 0, padOpen: false, tapes: false, dark: true };

function futureOv() {
  const o = { dark: true };
  if (G.ending) { o.lump = true; o.door = 1.25; o.padOpen = true; return o; }
  if (!has('tapeS')) { o.chair = CHAIR_WARD; o.tape4lift = true; }
  else if (!S.flags.ventOpen) { o.chair = CHAIR_VENT; o.vent = 'floor'; }
  else if (!S.flags.doorOpen) { o.chair = CHAIR_VENT; o.door = 0.55; o.padOpen = true; }
  if (G.subliminal > 0) o.lump = true;
  return o;
}

/* ---------- tapes ---------- */
function knockTimes(k) { const a = []; for (let i = 0; i < k.n; i++) a.push(k.t + i * k.gap); return a; }
const TAPES = {
  tapeW: { label: 'WED 10/26', date: 'OCT.26 1983', clock: [2, 56, 4], dur: 23, k: { t: 8.2, n: 2, gap: 0.7, loud: 0.9 }, at: t => ({ chair: CHAIR_DESK }) },
  tapeT: { label: 'THU 10/27', date: 'OCT.27 1983', clock: [2, 39, 49], dur: 23, k: { t: 14.5, n: 5, gap: 0.55, loud: 0.85 }, at: t => ({ chair: CHAIR_DESK, glass: t > 11 }) },
  tapeF: { label: 'FRI 10/28', date: 'OCT.28 1983', clock: [3, 13, 47], dur: 23, k: { t: 17.0, n: 1, gap: 0, loud: 1.5 }, at: t => { const k = t < 4 ? 0 : t < 8.5 ? 0.35 : t < 12.5 ? 0.7 : 1; return { chair: { x: lerp(CHAIR_DESK.x, CHAIR_VENT.x, k), z: lerp(CHAIR_DESK.z, CHAIR_VENT.z, k), r: lerp(0, 0.35, k) } }; } },
  tapeS: { label: 'SAT 10/29', date: 'OCT.29 1983', clock: [3, 4, 50], dur: 21, k: { t: 3.0, n: 8, gap: 0.34, loud: 1.0 }, at: t => ({ chair: CHAIR_VENT, vent: 'floor', lump: true, glass: true, sit: t > 19.4 ? clamp((t - 19.4) / 0.45, 0, 1) : 0 }), look: t => { const k = smooth(clamp((t - 11) / 7, 0, 1)); return new THREE.Vector3(lerp(FEED_LOOK.x, -1.0, k), lerp(FEED_LOOK.y, 0.55, k), lerp(FEED_LOOK.z, -1.7, k)); } },
};
for (const id in TAPES) TAPES[id].knocks = knockTimes(TAPES[id].k);
function knockEnv(tp, t) { let v = 0; for (const kt of tp.knocks) { const d = t - kt; if (d >= 0 && d < 0.16) v = Math.max(v, 1 - d / 0.16); } return v; }

function tapeOv(id, t) { const tp = TAPES[id]; const o = Object.assign({}, REC_BASE, tp.at(t)); o.bath = 2.975 - knockEnv(tp, t) * 0.02 * tp.k.loud; return o; }

function vcrUpdate(dt) {
  if (!VCR.playing || !S.vcr) return;
  const tp = TAPES[S.vcr]; VCR.prevT = VCR.t; VCR.t += dt;
  const audible = S.tv.on && S.tv.ch === 3 && G.power > 0.5;
  for (const kt of tp.knocks) if (VCR.prevT < kt && VCR.t >= kt && audible) sKnock(POS.tv, tp.k.loud * 0.95, 0, 1);
  if (S.vcr === 'tapeS' && audible) {
    if (VCR.prevT < 9 && VCR.t >= 9) sBreath(POS.tv, 3, 0.55, true);
    if (VCR.prevT < 19.4 && VCR.t >= 19.4) { G.fearT = 1; }
    if (VCR.prevT < 19.9 && VCR.t >= 19.9) { sStinger(1.1); G.fear = 1; SET.override = 1; SET.overrideT = 1.4; }
  }
  const last = tp.knocks[tp.knocks.length - 1] + 1.2;
  if (audible && VCR.prevT < last && VCR.t >= last && !S.tapesSeen[S.vcr]) { S.tapesSeen[S.vcr] = true; save(); }
  if (VCR.t >= tp.dur) { VCR.playing = false; VCR.t = 0; sClick(POS.tv, 0.4, 1200); drawVCR(); refreshSet(); }
}

/* ---------- OSD / VCR display / clock ---------- */
function fmtClock(m) { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60) % 12 || 12; return `${h}:${String(m % 60).padStart(2, '0')}`; }
function drawOSD() {
  const g = T.osd.userData.g; g.clearRect(0, 0, 256, 192); g.textBaseline = 'top';
  const mode = screenMode();
  const showCh = G.time - SET.chShown < 2.5;
  if ((mode === 1 || mode === 2) && showCh) { g.font = `44px ${FONT_OSD}`; g.fillStyle = '#7dff8a'; g.fillText(String(S.tv.ch), 16, 10); }
  if (mode === 2) { g.font = `20px ${FONT_OSD}`; g.fillStyle = 'rgba(240,240,240,0.9)'; g.textAlign = 'right'; g.fillText(`${fmtClock(S.clock + 3)} AM`, 244, 164); g.textAlign = 'left'; }
  if (mode === 3) {
    const tp = TAPES[S.vcr]; g.font = `22px ${FONT_OSD}`; g.fillStyle = '#fff';
    if (VCR.t < 3.5) g.fillText('PLAY ▶', 16, 12);
    const sec = tp.clock[0] * 3600 + tp.clock[1] * 60 + (tp.clock[2] || 0) + Math.floor(VCR.t);
    g.font = `19px ${FONT_OSD}`; g.fillText(tp.date, 12, 164); g.textAlign = 'right'; g.fillText(`AM ${Math.floor(sec / 3600)}:${String(Math.floor(sec / 60) % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, 246, 164); g.textAlign = 'left';
  }
  if (mode === 4) { g.font = `24px ${FONT_OSD}`; g.fillStyle = '#e8ecff'; g.fillText(S.vcr ? 'VIDEO   ■ STOP' : 'VIDEO   NO TAPE', 16, 14); if (showCh) g.fillText('3', 220, 14); }
  T.osd.needsUpdate = true;
}
function drawVCR() {
  const g = T.vcr.userData.g; g.fillStyle = '#050805'; g.fillRect(0, 0, 128, 32); g.font = `26px ${FONT_OSD}`; g.textBaseline = 'middle';
  g.fillStyle = '#5cff7a';
  if (VCR.playing) g.fillText('▶ PLAY', 14, 17); else if (S.vcr) g.fillText('■ STOP', 14, 17); else if (Math.floor(G.time * 1.2) % 2) g.fillText('12:00', 30, 17);
  T.vcr.needsUpdate = true;
}
function drawClock() {
  const g = T.clock.userData.g; g.fillStyle = '#0b0b0b'; g.fillRect(0, 0, 256, 128);
  const txt = fmtClock(S.clock).padStart(5, ' ');
  const cards = [txt.slice(0, 2).trim() || ' ', txt.slice(3, 5)];
  cards.forEach((c, i) => { const x = 14 + i * 124; g.fillStyle = '#1d1d1d'; g.fillRect(x, 12, 104, 104); g.fillStyle = '#000'; g.fillRect(x, 62, 104, 3); g.fillStyle = '#ece7da'; g.font = 'bold 86px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c, x + 52, 66); });
  g.textAlign = 'left'; T.clock.needsUpdate = true;
}

/* ---------- feed rendering ---------- */
function renderFeed(dt) {
  const mode = screenMode();
  const wantGhost = mode === 1 && S.tv.ch === 13;
  if (!(mode === 2 || mode === 3 || wantGhost || (SET.override === 2))) return;
  SET.flip ^= 1; if (SET.flip) return;
  let o, look;
  let fov = 80;
  if (mode === 3) { o = tapeOv(S.vcr, VCR.t); look = TAPES[S.vcr].look ? TAPES[S.vcr].look(VCR.t) : FEED_LOOK; tvMat.uniforms.bright.value = 1.5; }
  else {
    o = futureOv();
    const tgt = new THREE.Vector3(lerp(FEED_LOOK.x, P.x, 0.12) + Math.sin(G.time * 0.13) * 0.25, FEED_LOOK.y, lerp(FEED_LOOK.z, P.z, 0.12));
    feedLookCur.lerp(tgt, Math.min(1, dt * 1.6)); look = feedLookCur; tvMat.uniforms.bright.value = 1.7;
    // every so often the thing in the vent stares at something: first the top of the wardrobe, later the bed
    const cyc = G.time % 24, fk = smooth(clamp((cyc - 13) / 2.5, 0, 1)) * (1 - smooth(clamp((cyc - 20) / 2.5, 0, 1)));
    if (fk > 0) { const ft = has('tapeS') ? new THREE.Vector3(-1.0, 0.65, -1.9) : new THREE.Vector3(-2.25, 2.08, 2.5); look = feedLookCur.clone().lerp(ft, fk); fov = lerp(80, has('tapeS') ? 45 : 16, fk); }
  }
  if (feedCam.fov !== fov) { feedCam.fov = fov; feedCam.updateProjectionMatrix(); }
  const restore = applyOv(o);
  feedCam.position.copy(VENT_CAM); feedCam.lookAt(look);
  const hi = L.hemi.intensity; L.hemi.intensity = 2.1; L.feed.intensity = 3.2; L.tv.intensity = 0;
  O.screen.material = tvDummy; const eyes = O.eyes.visible; O.eyes.visible = false;
  renderer.setRenderTarget(feedRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, feedCam);
  O.screen.material = tvMat; O.eyes.visible = eyes; L.hemi.intensity = hi; L.feed.intensity = 0;
  restore();
}

function makePolaroid() {
  const rt = new THREE.WebGLRenderTarget(256, 256);
  const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 20); cam.layers.enable(1);
  cam.position.copy(VENT_CAM); cam.lookAt(-1.0, 0.55, -1.95);
  const restore = applyOv(Object.assign({}, REC_BASE, { lump: true, chair: CHAIR_DESK, paint: false, tapes: true }));
  const hi = L.hemi.intensity; L.hemi.intensity = 2.0; L.feed.intensity = 3.0; O.screen.material = tvDummy;
  renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, cam);
  const buf = new Uint8Array(256 * 256 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 256, 256, buf);
  O.screen.material = tvMat; L.hemi.intensity = hi; L.feed.intensity = 0; restore(); renderer.setRenderTarget(null); rt.dispose();
  const c = document.createElement('canvas'); c.width = 300; c.height = 360; const g = c.getContext('2d');
  g.fillStyle = '#efeadf'; g.fillRect(0, 0, 300, 360);
  const img = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const si = ((255 - y) * 256 + x) * 4, di = (y * 256 + x) * 4;
    const r = Math.pow(buf[si] / 255, 1 / 2.2) * 255, gg = Math.pow(buf[si + 1] / 255, 1 / 2.2) * 255, b = Math.pow(buf[si + 2] / 255, 1 / 2.2) * 255;
    const l = r * 0.3 + gg * 0.59 + b * 0.11;
    img.data[di] = clamp(l * 1.15 + 18, 0, 255); img.data[di + 1] = clamp(l * 1.05 + 10, 0, 255); img.data[di + 2] = clamp(l * 0.85, 0, 255); img.data[di + 3] = 255;
  }
  g.putImageData(img, 22, 22);
  g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 900; i++) g.fillRect(22 + Math.random() * 256, 22 + Math.random() * 256, 1, 1);
  const vg = g.createRadialGradient(150, 150, 60, 150, 150, 190); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(22, 22, 256, 256);
  g.font = `34px ${FONT_HAND}`; g.fillStyle = '#28324f'; g.save(); g.translate(40, 324); g.rotate(-0.03); g.fillText('10/30    3:14', 0, 0); g.restore();
  return c.toDataURL('image/png');
}

/* ---------- the set panel ---------- */
function setTV(on) {
  S.tv.on = on; sClick(POS.tv, 0.6, 900); if (on) { SET.chShown = G.time; sThunk(POS.tv, 0.25, 90); }
  save(); refreshSet(); onTVChange();
}
function setChannel(d) {
  let ch = S.tv.ch + d; if (ch > 13) ch = 2; if (ch < 2) ch = 13; S.tv.ch = ch; SET.chShown = G.time;
  sClick(POS.tv, 0.5, 1500); save(); refreshSet(); onTVChange();
}
function openSet() {
  openPanel('<div id="setp"></div>', () => refreshSet());
}
function refreshSet() {
  const p = $('#setp'); if (!p) return;
  const pocket = ['tapeW', 'tapeT', 'tapeF', 'tapeS'].filter(id => has(id) && id !== S.vcr);
  const st = VCR.playing ? 'Playing' : S.vcr ? 'Stopped' : 'Empty';
  p.innerHTML = `<h3>The set</h3>
    <div class="grp"><span class="lbl">Television</span><button class="btn ${S.tv.on ? 'sel' : ''}" id="tvPow">${S.tv.on ? 'On' : 'Off'}</button></div>
    <div class="grp"><span class="lbl">Channel</span><div class="row"><button class="btn" id="chDn" aria-label="Channel down">&#9664;</button><span class="ch">${S.tv.ch}</span><button class="btn" id="chUp" aria-label="Channel up">&#9654;</button></div></div>
    <div class="grp" style="display:block"><div style="display:flex;justify-content:space-between;align-items:center"><span class="lbl">VCR</span><span class="muted" style="font-size:12px">${st}</span></div>
      ${S.vcr ? `<p style="font-size:12.5px;margin:8px 0 0">In the VCR: <b style="font-weight:500">${TAPES[S.vcr].label}</b></p>` : ''}
      ${pocket.length ? `<p class="muted" style="font-size:11.5px;margin:8px 0 0">${S.vcr ? 'Swap for a tape from your pockets:' : 'Tapes in your pockets. Click one to put it in:'}</p><div class="tapes">${pocket.map(id => `<button class="btn" data-t="${id}">${TAPES[id].label}</button>`).join('')}</div>` : (S.vcr ? '' : '<p class="muted" style="font-size:12px;margin:8px 0 0">You have no tapes.</p>')}
      <div class="row" style="margin-top:10px"><button class="btn" id="vPlay" ${S.vcr ? '' : 'disabled'}>&#9654; Play</button><button class="btn" id="vStop" ${VCR.playing ? '' : 'disabled'}>&#9632; Stop</button><button class="btn" id="vEj" ${S.vcr && !VCR.playing ? '' : 'disabled'}>Eject</button></div></div>
    ${G.touch ? '<button class="btn" id="setBack" style="margin-top:12px;width:100%">Step back</button>' : '<p class="muted" style="font-size:11px;margin:10px 0 0"><kbd>Esc</kbd> or <kbd>E</kbd> to step back</p>'}`;
  if ($('#setBack')) $('#setBack').onclick = () => closePanel();
  $('#tvPow').onclick = () => setTV(!S.tv.on);
  $('#chDn').onclick = () => setChannel(-1); $('#chUp').onclick = () => setChannel(1);
  p.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { if (VCR.playing) return; insertTape(b.dataset.t); });
  $('#vPlay').onclick = () => { if (!S.vcr) return; VCR.playing = true; VCR.t = 0; VCR.prevT = 0; sClick(POS.tv, 0.5, 1100); drawVCR(); refreshSet(); if (S.vcr === 'tapeS') G.fearT = 0.4; };
  $('#vStop').onclick = () => { VCR.playing = false; VCR.t = 0; sClick(POS.tv, 0.5, 1100); drawVCR(); refreshSet(); };
  $('#vEj').onclick = () => ejectTape();
}
function showVcrTape(id, animate) {
  if (!id) { O.vcrTape.visible = false; return; }
  O.vcrLabel.material.map = T.tapes[id]; O.vcrLabel.material.needsUpdate = true; O.vcrTape.visible = true;
  if (animate) tween(0.4, k => O.vcrTape.position.x = lerp(1.98, 2.12, k)); else O.vcrTape.position.x = 2.12;
}
function insertTape(id) {
  if (S.vcr === id) return;
  S.vcr = id; VCR.t = 0; VCR.playing = false; showVcrTape(id, true); sScrape(POS.tv, 0.35, 0.18); after(0.4, () => sThunk(POS.tv, 0.45, 140));
  save(); renderInv(); drawVCR(); refreshSet();
}
function ejectTape() {
  if (!S.vcr) return; VCR.playing = false; S.vcr = null; sThunk(POS.tv, 0.35, 160);
  tween(0.3, k => O.vcrTape.position.x = lerp(2.12, 2.0, k), () => { O.vcrTape.visible = false; });
  save(); renderInv(); drawVCR(); refreshSet();
}
function onTVChange() {
  const m = screenMode();
  if (m === 1 && S.tv.ch === 13 && !S.flags.ghostSeen) { flag('ghostSeen'); after(1.6, () => { if (screenMode() === 1 && S.tv.ch === 13) subtitle('', '<i>Under the static on 13 there\'s something. A room, maybe. Too washed out by the light in here to make out.</i>', 6000); }); }
  if (m === 2 && !S.flags.sawFeed) {
    flag('sawFeed'); G.fear = 1; G.fearT = 0.5; sStinger(0.9);
    after(1.2, () => subtitle('', '<i>The room. This room, from high in the corner by the ceiling. The clock in the picture is three minutes ahead of the one by the bed. You aren\'t in it.</i>', 7000));
  }
}

/* ---------- telephone ---------- */
const PH = { digits: '', idle: null, tok: 0, busy: false, ringing: false, ringTimer: null, ringLeft: 0, onAnswer: null, dialing: false, tone: null, afterHang: null };
const DIAL_LET = { 1: '', 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PRS', 8: 'TUV', 9: 'WXY', 0: 'OPER' };
function holeAngle(k) { return 25 - (k - 1) * 30; } // k: 1..10 (10 = '0'), degrees clockwise from +x
function toneStart(kind) {
  toneStop(); if (!A.ready) return;
  const ctx = A.ctx, g = ctx.createGain(); g.gain.value = 0; const lp = filt('lowpass', 3400, 0.7); g.connect(lp); route(lp, { wet: 0, vol: 1 });
  const fr = kind === 'dial' ? [350, 440] : kind === 'busy' ? [480, 620] : [440, 480];
  const os = fr.map(f => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(g); o.start(); return o; });
  let iv = null;
  if (kind === 'dial') g.gain.value = 0.07;
  else { const on = kind === 'busy' ? 0.5 : 2, off = kind === 'busy' ? 0.5 : 4; let s = true; const tick = () => { g.gain.setTargetAtTime(s ? 0.07 : 0, now(), 0.01); iv = setTimeout(tick, (s ? on : off) * 1000); s = !s; }; tick(); }
  PH.tone = { stop: () => { clearTimeout(iv); os.forEach(o => { try { o.stop(); } catch (e) {} }); g.disconnect(); } };
}
function toneStop() { if (PH.tone) { PH.tone.stop(); PH.tone = null; } }
let lineHiss = null;
function hiss(on) { if (!A.ready) return; if (!lineHiss) lineHiss = loopNoise({ type: 'bandpass', f: 2200, q: 0.6, vol: 0, wet: 0 }); setGain(lineHiss, on ? 0.018 : 0, 0.05); }

function dialSVG() {
  const holes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => {
    const a = holeAngle(k) * Math.PI / 180, x = 150 + Math.cos(a) * 100, y = 150 + Math.sin(a) * 100, d = k === 10 ? '0' : String(k);
    return `<g class="hole" data-d="${d}" role="button" aria-label="Dial ${d}" tabindex="0"><circle class="h" cx="${x}" cy="${y}" r="19" fill="#1d1a17"/><text x="${x}" y="${y - 1}" text-anchor="middle" fill="#f1ead8" font-family="IBM Plex Mono, monospace" font-size="17" font-weight="500">${d}</text><text x="${x}" y="${y + 12}" text-anchor="middle" fill="#c9bfa7" font-family="IBM Plex Mono, monospace" font-size="8" letter-spacing="1">${DIAL_LET[d]}</text></g>`;
  }).join('');
  const plateHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => { const a = holeAngle(k) * Math.PI / 180; return `<circle cx="${150 + Math.cos(a) * 100}" cy="${150 + Math.sin(a) * 100}" r="21" fill="none" stroke="#6f6656" stroke-width="3"/>`; }).join('');
  const sa = 60 * Math.PI / 180;
  return `<svg viewBox="0 0 300 300" aria-label="Rotary dial"><circle cx="150" cy="150" r="146" fill="#cfc4a8"/><circle cx="150" cy="150" r="138" fill="#e9e1cc"/>${holes}
    <g id="plate" style="pointer-events:none">${plateHoles}<circle cx="150" cy="150" r="126" fill="none" stroke="rgba(60,50,40,.25)" stroke-width="2"/></g>
    <circle cx="150" cy="150" r="48" fill="#f6f0e0" stroke="#bfb393"/><text x="150" y="140" text-anchor="middle" font-family="Special Elite, monospace" font-size="11" fill="#2a4a36">PINECREST</text><text x="150" y="156" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="#2a251e">ROOM 406</text><text x="150" y="171" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="8" fill="#6b604c">DIAL 0 FOR DESK</text>
    <path d="M ${150 + Math.cos(sa) * 128} ${150 + Math.sin(sa) * 128} L ${150 + Math.cos(sa) * 146} ${150 + Math.sin(sa) * 146}" stroke="#8a8a86" stroke-width="7" stroke-linecap="round"/></svg>`;
}

function openPhone() {
  initAudio();
  const answering = PH.ringing;
  UI.show('phone', `<button class="x">Hang up &middot; Esc</button><h2>Telephone</h2><p class="sub">The receiver is cold against your ear.</p>
    <div class="phone"><div>${dialSVG()}</div><div>
      <div class="dialed" id="dialed" aria-live="polite">&nbsp;</div>
      <div class="pstate" id="pstate"></div>
      <div class="pcard"><h4>Pinecrest Motor Lodge</h4>
        <div class="ln"><span>Front desk</span><span>0</span></div>
        <div class="ln"><span>Room to room</span><span>4 + room no.</span></div>
        <div class="ln"><span>Wake-up call</span><span>7 + time (7-0630)</span></div>
        <div class="ln"><span>Messages, when lamp lit</span><span>8</span></div>
        <div class="ln"><span>Outside line</span><span>9 (ask desk)</span></div>
        <p style="margin:8px 0 0;font-size:11px;color:#6b604c"><span class="lamp-dot ${S.flags.heardMsgs ? '' : 'on'}"></span>Message lamp</p></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="hang">Hang up</button></div>
    </div></div>`, { onClose: hangUp, onKey: e => { if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) dial(e.code.slice(-1)); } });
  $('#hang').onclick = () => UI.close();
  $('#card').querySelectorAll('.hole').forEach(h => { h.onclick = () => dial(h.dataset.d); h.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dial(h.dataset.d); } }; });
  PH.digits = ''; PH.busy = false; PH.tok++;
  sThunk(POS.phone, 0.35, 260);
  if (answering) { stopRing(); const fn = PH.onAnswer; PH.onAnswer = null; pstate('Connected.'); hiss(true); PH.busy = true; runScript(fn); }
  else { toneStart('dial'); pstate('Dial tone.'); }
}
function pstate(t) { const e = $('#pstate'); if (e) e.textContent = t; }
function hangUp() {
  PH.tok++; toneStop(); hiss(false); stopSpeech(); clearTimeout(PH.idle); PH.busy = false; PH.digits = ''; PH.dialing = false;
  sThunk(POS.phone, 0.4, 200); clearSubs();
  if (PH.afterHang) { const f = PH.afterHang; PH.afterHang = null; setTimeout(f, 50); }
}
function dial(d) {
  if (PH.busy || PH.dialing || UI.kind !== 'phone') return;
  const k = d === '0' ? 10 : +d; PH.dialing = true; toneStop(); clearTimeout(PH.idle);
  const rot = 60 - holeAngle(k), plate = $('#plate'); const tok = PH.tok;
  const t0 = performance.now(), fwd = rot / 360 * 700, back = k * 95 + 120;
  let pulses = 0;
  const step = ts => {
    if (tok !== PH.tok || !plate.isConnected) { PH.dialing = false; return; }
    const e = ts - t0; let a;
    if (e < fwd) a = rot * smooth(e / fwd);
    else { const b = (e - fwd) / back; a = rot * (1 - Math.min(1, b)); const p = Math.floor(Math.min(1, b) * k); while (pulses < p) { pulses++; sClick(null, 0.35, 1800); } }
    plate.setAttribute('transform', `rotate(${a.toFixed(1)} 150 150)`);
    if (e < fwd + back) requestAnimationFrame(step);
    else { PH.dialing = false; PH.digits += d; const el = $('#dialed'); if (el) el.textContent = PH.digits.replace(/(\d)(?=\d)/g, '$1 '); PH.idle = setTimeout(() => evalNumber(), 2600); }
  };
  requestAnimationFrame(step);
}
async function runScript(fn) {
  const tok = PH.tok; const alive = () => tok === PH.tok && UI.kind === 'phone';
  PH.busy = true;
  try { await fn(alive); } catch (e) { console.warn(e); }
  if (alive()) { PH.busy = false; hiss(false); if (PH.tone) return; const e = $('#pstate'); if (e && !/No answer|Busy|set|End|hung|dead|clicks|again/i.test(e.textContent)) pstate('The line goes quiet.'); }
}
async function ringOut(alive, n) { toneStart('ring'); for (let i = 0; i < n; i++) { await wait(2000 + (i ? 4000 : 0)); if (!alive()) return false; } toneStop(); return true; }
function evalNumber() {
  const n = PH.digits; if (!n || UI.kind !== 'phone') return;
  PH.busy = true;
  const script = CALLS(n);
  runScript(script);
}

function ringPhone(times, onAnswer) {
  if (PH.ringing || UI.kind === 'phone') return;
  PH.ringing = true; PH.onAnswer = onAnswer; PH.ringLeft = times;
  const ring = () => { if (!PH.ringing) return; if (PH.ringLeft-- <= 0) { stopRing(); return; } sBell(POS.phone, 1.8); PH.ringTimer = setTimeout(ring, 4200); };
  ring();
}
function stopRing() { PH.ringing = false; clearTimeout(PH.ringTimer); }


/* =====================================================================
   ROOM 406 · part C: content, puzzles, scares, room hooks
   ===================================================================== */
const tallyDots = (n, d) => `<span class="tnum"><span class="dots">${'&bull;'.repeat(d)}</span>${tallyNum(n)}</span>`;
const tallyNum = n => { let out = '<span style="display:inline-block;margin-right:26px">'; let left = n; while (left > 0) { const k = Math.min(5, left); out += `<span class="tally ${k === 5 ? 'five' : ''}">${'<i></i>'.repeat(k === 5 ? 4 : k)}</span>`; left -= k; } return out + '</span>'; };

const ITEMS = {
  pencil: { name: 'Motel pencil', short: 'Pencil', desc: 'Yellow, chewed at the end. PINECREST MOTOR LODGE in flaking gold letters.' },
  key: { name: 'Small brass key', short: 'Brass key', desc: 'Still warm from the shoe. Too small for a door. There\'s a tiny crown stamped on the bow, the kind furniture makers used.' },
  tapeW: { name: 'VHS tape: WED 10/26', short: 'Tape Wed', desc: 'A black T-120 cassette. The label is handwritten in marker: WED 10/26.' },
  tapeT: { name: 'VHS tape: THU 10/27', short: 'Tape Thu', desc: 'Handwritten label: THU 10/27.' },
  tapeF: { name: 'VHS tape: FRI 10/28', short: 'Tape Fri', desc: 'Handwritten label: FRI 10/28. The shell is cracked at one corner.' },
  tapeS: { name: 'VHS tape: SAT 10/29', short: 'Tape Sat', desc: 'Handwritten label: SAT 10/29. Underneath, pressed so hard the pen tore the paper: DON\'T.' },
  screwdriver: { name: 'Flat screwdriver', short: 'Screwdriver', desc: 'A heavy engineer\'s screwdriver. There are flecks of cream paint caught in the notch of the blade.' },
  flashlight: { name: 'Flashlight', short: 'Flashlight', get desc() { return `Rubber-cased, heavy, fresh batteries. ${G.touch ? 'The Flashlight button switches' : 'Press F to switch'} it on or off.`; } },
  page: { name: 'Torn logbook page', short: 'Torn page', doc: 'page' },
  watch: { name: 'Wristwatch', short: 'Watch', desc: 'A man\'s watch on a cracked leather strap. The crystal is broken and the hands have stopped at 3:17. Engraved on the back: <i>E.V. &mdash; so you\'re never late home. I.</i>' },
  polaroid: { name: 'Polaroid', short: 'Polaroid', doc: 'polaroid' },
  moth: { name: 'Brass moth', short: 'Brass moth', desc: 'A tiny brass moth, wings spread, that was pinned inside the coat over the heart. It\'s warmer than it should be, as if someone was holding it a moment ago.' },
};

const HEARD = {
  msg1: { title: 'Message 1: Irene, Thursday 11:52 p.m.', text: '&ldquo;Eli, it\'s me. It\'s Thursday night. The desk says you\'ve taken the room through Sunday. Whatever you think is on that television, it isn\'t Bill, and it was never your fault. Please come home. And if you\'ve hidden your keys in your shoes again, like you did in Dayton, I swear to God, Eli.&rdquo;' },
  msg2: { title: 'Message 2: front desk, Saturday 4:10 a.m.', text: '&ldquo;Mr. Varga, front desk. The guests in 405 and 407 are complaining about the knocking again. Sir, we\'ve asked you twice&hellip; hold on. I\'m looking at the key board. There\'s no hook for a four-oh-six. We don\'t have a four-oh-six. Who is this? Who am I talking to?&rdquo;' },
  memo: { title: 'Cassette memo, Friday', text: '&ldquo;Memo. Friday. Fourteen past three&hellip; The chair is in the picture again. Under the vent&hellip; I\'m sitting on the bed. I am not going to touch the chair&hellip; I\'m not going to touch the chair.&rdquo; <i>A slow scrape of wood across carpet. The tape runs out.</i>' },
  call0: { title: 'Front desk (0)', text: 'Someone picks up. Nobody speaks. Rain, and very faintly the flip of a clock card, the same as the clock beside you.' },
  call407: { title: 'Room 407', text: 'Someone picks up. Three knocks come down the line, and at the same moment from behind the bathroom door.' },
  callOwn: { title: 'Incoming call', text: 'Your own voice: &ldquo;Don\'t fall asleep again.&rdquo;' },
  wake: { title: 'Wake-up call (7)', text: '&ldquo;Your wake-up call is set for three seventeen a.m. Sleep well.&rdquo;' },
  outside: { title: 'Outside line (9)', text: '&ldquo;Outside lines are not available from this room.&rdquo;' },
  outside2: { title: 'Outside line: 9 2 8 2 4', text: '&ldquo;Outside lines are not available from this room.&rdquo; Then, closer, almost a whisper: &ldquo;Keep your eyes on it.&rdquo;' },
  breath: { title: 'Incoming call', text: 'Breathing, slow and close to the mouthpiece. When you hold your breath, it holds its breath too.' },
};

const CAL_HTML = (() => {
  let cells = '<tr>' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<th style="font-weight:400;font-size:12px;padding:4px">${d}</th>`).join('') + '</tr><tr>';
  const lead = 6; for (let i = 0; i < lead; i++) cells += '<td></td>';
  for (let d = 1; d <= 31; d++) {
    const idx = lead + d - 1; if (idx % 7 === 0) cells += '</tr><tr>';
    let st = 'padding:6px 8px;text-align:center;position:relative;';
    let inner = d;
    if (d >= 26 && d <= 29) inner = `<span style="position:relative">${d}<span style="position:absolute;left:-6px;right:-6px;top:50%;height:2px;background:#1a2a6a;transform:rotate(35deg)"></span><span style="position:absolute;left:-6px;right:-6px;top:50%;height:2px;background:#1a2a6a;transform:rotate(-35deg)"></span></span>`;
    if (d === 30) inner = `<span style="border:2px solid #1a2a6a;border-radius:50%;padding:2px 6px">30</span>`;
    cells += `<td style="${st}">${inner}</td>`;
  }
  return `<h3 style="margin-bottom:2px">October 1983</h3><p style="font-size:12px;margin:0 0 12px">Pinecrest Motor Lodge &middot; &ldquo;Your home on the ridge&rdquo;</p><table style="border-collapse:collapse;font-family:var(--type);font-size:15px">${cells}</tr></table><p style="font-size:13px;margin-top:14px">Someone has crossed off the 26th through the 29th in blue pen. The 30th is circled. Today is the 30th.</p>`;
})();

const FIREMAP_HTML = (() => {
  const top = ['401', '402', '403', '404', '405', '', '407', '408'], bot = ['416', '415', '414', '413', '412', '411', '410', '409'];
  let r = '';
  top.forEach((n, i) => { const x = 20 + i * 60; r += n ? `<rect x="${x}" y="50" width="60" height="58" fill="#fff" stroke="#333"/><text x="${x + 30}" y="84" text-anchor="middle" font-family="Arial" font-size="14">${n}</text>` : `<rect x="${x}" y="50" width="60" height="58" fill="url(#hatch)" stroke="#333"/>`; });
  bot.forEach((n, i) => { const x = 20 + i * 60; r += `<rect x="${x}" y="150" width="60" height="58" fill="#fff" stroke="#333"/><text x="${x + 30}" y="184" text-anchor="middle" font-family="Arial" font-size="14">${n}</text>`; });
  return `<svg viewBox="0 0 520 250" style="width:100%;height:auto;display:block" role="img" aria-label="Fourth floor plan. Rooms 401 to 405, then a blank wall where 406 should be, then 407 and 408. The YOU ARE HERE dot is on the blank wall.">
    <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#999" stroke-width="2"/></pattern></defs>
    <rect x="0" y="0" width="520" height="34" fill="#b3261e"/><text x="260" y="23" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="bold" font-size="16">IN CASE OF FIRE &middot; FOURTH FLOOR</text>
    ${r}<rect x="20" y="108" width="480" height="42" fill="#f4f1e8" stroke="#333"/><text x="260" y="134" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">CORRIDOR</text>
    <text x="14" y="240" font-family="Arial" font-size="11" fill="#b3261e">&#8592; STAIRS</text><text x="506" y="240" text-anchor="end" font-family="Arial" font-size="11" fill="#b3261e">STAIRS &#8594;</text>
    <circle cx="350" cy="112" r="7" fill="#b3261e"/><text x="350" y="146" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11" fill="#b3261e">YOU ARE HERE</text></svg>
    <p style="font-size:13px;margin-top:12px">Every room on the floor is on the plan except yours. The red dot is on a stretch of solid wall between 405 and 407.</p>`;
})();

const INSC_HTML = `<svg viewBox="0 0 520 300" style="width:100%;height:auto;display:block;margin-bottom:10px" role="img" aria-label="A scratched sketch of the room seen from the top corner. An eye is drawn in the corner. An X is scratched on top of the tall wardrobe in the far corner.">
  <g fill="none" stroke="#2f2a24" stroke-width="2.2" stroke-linecap="round">
  <path d="M90 70 L330 52 L330 250 L90 282 Z"/><path d="M330 52 L420 100 M330 250 L420 228 M90 70 L40 110 M90 282 L40 262"/>
  <path d="M112 170 h44 v104 h-44 z"/><path d="M114 172 l40 28 M154 172 l-40 28" stroke-width="3"/>
  <path d="M190 210 h110 v40 h-110 z"/>
  <ellipse cx="318" cy="66" rx="16" ry="8"/><circle cx="318" cy="66" r="3.5" fill="#2f2a24"/>
  <path d="M318 74 L150 180 M318 74 L150 268 M318 74 L260 250" stroke-dasharray="4 6" stroke-width="1.2"/></g></svg>
  <p style="margin:0">IT SEES FROM THE CORNER</p><p style="margin:.2em 0">IT SEES WHAT I CAN'T</p><p style="margin:.2em 0">3:17 &nbsp;3:17 &nbsp;3:17 &nbsp;3:17</p><p style="margin:.2em 0">DON'T SLEEP</p>
  <p style="font:13px var(--ui);color:#3f3a33;text-shadow:none;margin-top:14px">Scratched into the plaster with something like a key. The corner with the eye is the same corner as the vent.</p>`;

const DOCS = {
  log: {
    title: 'Green logbook: WKVR-TV transmitter log', style: 'log', onRead: () => flag('readLog'), pages: [
      `<p><span class="d">PROPERTY OF WKVR-TV</span>Transmitter log, Pinecrest Ridge<br>Night engineer: E. Varga<br>If found, return to the station.</p><p style="color:#5a2020">Most of the old pages have been cut out with a razor. The new entries start near the back.</p>`,
      `<p><span class="d">Wed 26 Oct '83 &mdash; night one</span>Checked into the Pinecrest and asked for 406 by number. The clerk looked at me a long time before he handed over the key.</p><p>Guests say the set in this room picks up a station after midnight. Nobody else on the lodge aerial gets it. Only 406. I know which station.</p><p>It comes in on our old number, and only in the dark &mdash; every light in the room off, like it doesn't want to be seen doing it.</p><p>The picture on the set is this room, from high up in the corner. Empty. The clock in the picture runs three minutes ahead of mine. I sat on the bed for an hour and watched myself not be in it.</p>`,
      `<p><span class="d">Thu 27 Oct &mdash; night two</span>Tested the three minutes. Stood a water glass on top of the set at 2:40 by my watch. The picture on the set had the glass there at 2:37.</p><p>It isn't fast. It's early.</p><p>Knocking from the bathroom again, a different count from last night. I'm taping all of it. Every cassette gets its date, same as the log. Bill always said a log is only as good as its order.</p>`,
      `<p><span class="d">Fri 28 Oct &mdash; night three</span>I lost time tonight.</p><p>At 14 past 3 the picture on the set showed the desk chair standing under the vent. I laughed at it. At 17 past I was standing on that chair with the screwdriver in my hand and the first screw half out. I don't remember crossing the room.</p><p>Locked the screwdriver in the tool case.</p><p>Nailed the bathroom shut. Put a hasp on the door.</p>`,
      `<p><span class="d">Sat 29 Oct &mdash; night four</span>I understand it now.</p><p>It isn't showing me the future. It's showing the room after &mdash; after whoever is in it has gone. Every guest in 406 left at 17 past 3, and the picture simply got there first. That's why I'm never in it.</p><p>But it can't take you while your eyes are on it. It has waited three nights for me to look away.</p><p>I'm not going to look away.</p><p>Tonight's tape is up where only it can see. If it wants something to look at, it can look at that.</p><p>Reset the tool case dials to the knocking &mdash; one night to a dial, first night to last. I'd have to sit through every tape to open it again. Good.</p>`,
      `<p style="color:#5a2020">The last page has been torn out. A ragged strip is left along the binding.</p>`,
    ],
  },
  guide: {
    title: 'TV WEEK, late-night listings', style: 'print', pages: [
      `<h3>TV WEEK &middot; Late night</h3><p style="font-size:12px;margin:-4px 0 14px">Pinecrest area &middot; Saturday, October 29, 1983</p>
      <div class="col"><p><b>2 WDBQ</b> 12:30 Night Owl News &middot; 1:05 Sign-off</p><p><b>4 KSTR</b> 12:00 Creature Feature: <i>The Pale House</i> (1961) &middot; 1:45 Sign-off</p><p><b>5 WCTN</b> 12:40 Sign-off</p><p><b>7 WLVM</b> 1:00 Late News &middot; 1:30 Sign-off</p><p><b>9 KHNT</b> 12:15 Movie: <i>Harbor Lights</i> (1948) &middot; 2:10 Sign-off</p><p><b>11 WPTE</b> 2:00 Sign-off</p><p><b>13 WKVR</b> Off the air. Channel 13 has carried no signal since the transmitter fire on Pinecrest Ridge in March 1979.</p></div>
      <p style="font-size:12px;border-top:1px solid rgba(0,0,0,.25);padding-top:8px;margin-top:14px">VCR owners: tune your set to channel 3 to play tapes.</p>`],
  },
  pad: {
    title: 'Motel notepad', style: 'pad', onRead: () => flag('sawPad'),
    pages: () => [S.flags.rubbed
      ? `<div class="graphite">suitcase &mdash; 3 wheels<br><br>use the minute the SET shows it<br>not the minute it happens<br><br><span class="faint">don't sleep don't sleep don't sleep</span></div><p style="font:13px var(--ui);margin-top:12px">Under the graphite, the pressed-in lines come up pale.</p>`
      : `<p style="font-family:var(--type);font-size:15px;line-height:1.6">Pinecrest Motor Lodge. The top sheet is blank, but when you tilt it toward the light you can see ridges where someone wrote hard on the sheet above it.</p>${has('pencil') ? '<button class="btn" id="rub" style="color:#2a241d;border-color:rgba(40,34,28,.5)">Shade over it with the pencil</button>' : '<p style="font:13px var(--ui);color:#6c6250">You\'d need something to bring the lines out.</p>'}`],
    bind: card => { const b = card.querySelector('#rub'); if (b) b.onclick = () => { flag('rubbed'); sScrape(null, 1.1, 0.14); openDoc('pad'); }; },
  },
  calendar: { title: 'Wall calendar', style: 'print', pages: [CAL_HTML] },
  firemap: { title: 'Fire evacuation plan', style: 'print', pages: [FIREMAP_HTML] },
  insc: { title: 'Behind the painting', style: 'wall', onRead: () => flag('sawInsc'), pages: [INSC_HTML] },
  badge: { title: 'WKVR staff badge', style: 'print', pages: [`<div style="border:1px solid #333;padding:16px 18px;max-width:340px;background:#f6f1e4"><p style="margin:0;font:bold 22px Georgia,serif">WKVR-TV <span style="color:#b3261e">13</span></p><p style="margin:2px 0 14px;font-size:11px;letter-spacing:.16em">STAFF IDENTIFICATION</p><div style="display:flex;gap:14px;align-items:center"><div style="width:70px;height:84px;background:repeating-linear-gradient(35deg,#eee 0 2px,#bbb 2px 4px);border:1px solid #777"></div><div><p style="margin:0;font-size:18px">ELIAS VARGA</p><p style="margin:3px 0 0;font-size:13px">Night engineer &middot; No. 0413</p></div></div></div><p style="margin-top:14px;font-size:14px">The photo on the badge has been scratched away with something sharp, carefully, right down to the white.</p>`] },
  clip: { title: 'Newspaper clipping', style: 'print', pages: [`<h3>Fire silences Channel 13</h3><p style="font-size:12px;margin:-6px 0 12px">Pinecrest Courier &middot; Monday, March 12, 1979</p><p>A fire early Sunday destroyed the WKVR-TV transmitter building on Pinecrest Ridge, taking Channel 13 off the air.</p><p>William &ldquo;Bill&rdquo; Hesse, 52, an engineer with the station for twenty years, died at the scene. A second engineer on duty, Elias Varga, 38, was treated for smoke inhalation.</p><p>Varga told investigators the fire started &ldquo;in the minute I looked away.&rdquo;</p><p>The station's owners say they have no plans to rebuild. The Pinecrest Motor Lodge, at the foot of the ridge, lost power for several hours.</p>`] },
  irene: { title: 'Photograph', style: 'print', pages: [`<div style="height:180px;background:linear-gradient(#c9b48a,#8a7a5a 60%,#6a5a42);position:relative;border:10px solid #f4efe2;box-shadow:0 2px 8px rgba(0,0,0,.3)"><div style="position:absolute;left:38%;bottom:18px;width:34px;height:90px;background:#3a2a22;border-radius:16px 16px 4px 4px"></div><div style="position:absolute;right:10%;bottom:14px;width:150px;height:46px;background:#6b2a1e;border-radius:6px"></div></div><p style="margin-top:14px">A snapshot of a woman squinting into the sun beside a station wagon, one hand up against the glare.</p><p>On the back, in blue ink: <span style="font-family:var(--hand);font-size:24px;color:#1f2a44">Dayton, summer '71. Keep your eyes on the road. &mdash; I.</span></p>`] },
  page: {
    title: 'Torn logbook page', style: 'log', onRead: () => flag('readPage'),
    pages: () => [`<p><span class="d">Sat 29 Oct &mdash; 3:09</span>Awake since Thursday. I keep losing the word.</p><p>The padlock on the door is set to the one thing that makes it wait. I can't hold letters in my head any more, so I've written it down the way the telephone would dial it. The dots over each number say which of its letters I mean:</p><p style="padding:4px 0 10px">${tallyDots(9, 1)}${tallyDots(2, 1)}${tallyDots(8, 1)}${tallyDots(2, 3)}${tallyDots(4, 2)}</p><p>If you are reading this, you are in the room now. Look at the set. If you are not in the picture, you do not have three minutes.</p><p>Irene, I'm s</p>`],
  },
  polaroid: {
    title: 'Polaroid', style: 'photo',
    pages: () => { if (!G.polaroid) G.polaroid = makePolaroid(); return [`<img src="${G.polaroid}" alt="A Polaroid taken from high in the corner of Room 406, looking down at the bed. Someone is asleep on top of the covers." width="300" height="360"><p class="cap">Taken from inside the vent, looking down at the bed. Someone is asleep on top of the covers. Written on the white strip: 10/30, 3:14. That's tonight.</p>`]; },
  },
};

/* ---------------- hints ---------------- */
const anyTape = s => ['tapeW', 'tapeT', 'tapeF', 'tapeS'].some(t => s.inv.includes(t));
const HINTS = [
  { id: 'start', title: 'Where do I start?', when: s => s.flags.readLog ? 'solved' : 'active', tiers: [
    'Everything you need is in this room. Walk the walls and look at anything that highlights under the dot.',
    'Someone was living in here before you woke up. Their notes are on the desk by the window.',
    'Read the green logbook on the desk. It explains the television and the locks.',
    'Go to the desk on the window wall and press E on the green logbook. Read every page.'] },
  { id: 'phone', title: 'The blinking red light on the phone', when: s => s.flags.heardMsgs ? 'solved' : 'active', tiers: [
    'A blinking lamp on a motel phone means the front desk is holding something for the room.',
    'The card beside the dial lists what each number does.',
    'Messages are on 8.',
    'Pick up the phone on the nightstand and dial 8. Listen to both messages.'] },
  { id: 'wardrobe', title: 'The locked wardrobe', when: s => (s.inv.includes('key') || s.flags.wardUnlocked) ? 'solved' : (s.flags.wardTried || s.flags.heardMsgs) ? 'active' : 'hidden', tiers: [
    'The key isn\'t anywhere near the wardrobe. Someone knows exactly where he always hides his keys.',
    'Listen to the phone messages again. What does Irene tell him not to do?',
    'His shoes are under the bed, hidden behind the bed skirt. You\'ll have to get down low.',
    'Crouch (C), face the side of the bed that looks into the room, and use the bed skirt. The key is in the left shoe.'] },
  { id: 'pad', title: 'The blank notepad', when: s => s.flags.rubbed ? 'solved' : s.flags.sawPad ? 'active' : 'hidden', tiers: [
    'A blank page isn\'t always blank. Something was written on the sheet above it.',
    'You need something to bring the indentations out.',
    'There\'s a pencil in the desk drawer.',
    'Open the desk drawer, take the pencil, then look at the notepad again and shade over it.'] },
  { id: 'suit', title: 'The suitcase lock', when: s => s.flags.suitOpen ? 'solved' : s.flags.sawSuit ? 'active' : 'hidden', tiers: [
    'Three wheels. Eli left himself a reminder about this lock by the bed.',
    'The notepad says: use the minute the set shows it, not the minute it happens. What happens, and when does the TV show it?',
    'The logbook says guests are gone at 17 past 3, and the picture on the TV always gets there three minutes early.',
    'The TV shows it at 3:14. Set the suitcase to 3-1-4.'] },
  { id: 'tv', title: 'The television', when: s => s.flags.sawFeed ? 'solved' : s.flags.readLog ? 'active' : 'hidden', tiers: [
    'Eli\'s logbook says exactly when the station comes in. Read the first night again.',
    '"Our old number," and only in the dark. Whose number? Who is "our"?',
    'The logbook belonged to WKVR. The TV listings on top of the VCR give WKVR\'s channel. Every light in the room has to be off.',
    'Switch off the bedside lamp, make sure the ceiling light is off too (its switch is by the door), then turn the TV to channel 13.'] },
  { id: 'top', title: 'What the TV shows', when: s => s.inv.includes('tapeS') ? 'solved' : (s.flags.sawFeed || s.flags.sawInsc) ? 'active' : 'hidden', tiers: [
    'What\'s on the TV is the room seen from the vent in the corner. What can it see that you can\'t?',
    'Eli put his last tape "where only it can see." Look at the high surfaces in the picture on the TV.',
    'There\'s something on top of the wardrobe. You\'ll need to be taller.',
    'Drag the desk chair (R) over to the wardrobe, climb onto it (E), and take the tape from the top.'] },
  { id: 'tapes', title: 'Watching the tapes', when: s => Object.keys(s.tapesSeen).length ? 'solved' : anyTape(s) ? 'active' : 'hidden', tiers: [
    'The VCR plays through the television, but not on just any channel.',
    'Look at the bottom of the TV listings page.',
    'Put a tape in the VCR, press Play, and set the TV to channel 3.',
    'Use the set, pick a tape, press Play, and turn the channel to 3. The lights can stay on.'] },
  { id: 'case', title: 'The aluminium tool case', when: s => s.flags.caseOpen ? 'solved' : s.flags.sawCase ? 'active' : 'hidden', tiers: [
    'Eli describes setting this lock in the logbook, in his entry for the fourth night.',
    '"One night to a dial, first night to last." Each tape has something you can count, and you need all four tapes.',
    'Count the knocks from the bathroom on each tape. Put the tapes in date order, Wednesday the 26th first.',
    'Wednesday 2 knocks, Thursday 5, Friday 1, Saturday 8. The code is 2-5-1-8.'] },
  { id: 'vent', title: 'The vent', when: s => s.flags.reached ? 'solved' : s.flags.caseOpen ? 'active' : 'hidden', tiers: [
    'The screwdriver has cream paint in its notch. What in this room is painted cream and held on with screws?',
    'The vent high in the corner, above the dark stain on the carpet. You\'ll need something to stand on.',
    'Drag the chair right under the vent, climb onto it, and unscrew the grille.',
    'Put the chair under the vent (the corner by the TV end of the bed wall), climb on, use the vent to unscrew the grille, then reach inside.'] },
  { id: 'early', title: 'The padlock on the door', when: s => (s.flags.sawPadlock && !s.flags.readPage) ? 'active' : 'hidden', tiers: [
    'You don\'t have what you need for this lock yet. Leave it for last.',
    'Eli wrote the word on the last page of his logbook, and that page is missing.',
    'The missing page is somewhere only the thing in the corner could reach. Follow everything that points at the vent.',
    'The page is inside the vent. You need the screwdriver from the tool case first.'] },
  { id: 'padlock', title: 'The padlock word', when: s => s.flags.doorOpen ? 'solved' : s.flags.readPage ? 'active' : 'hidden', tiers: [
    'Eli wrote the word the way a telephone dials it. Each group of marks is a number, and the dots above it pick one of that number\'s letters.',
    'Look closely at the phone\'s dial: each number has letters printed with it.',
    '9 is WXY, 2 is ABC, 8 is TUV, 4 is GHI. One dot means the first letter, two dots the second, three dots the third.',
    '9-2-8-2-4 with those dots spells WATCH. Set the padlock to W-A-T-C-H.'] },
];

/* ---------------- phone scripts ---------------- */
function heard(id) { if (!S.heard.includes(id)) { S.heard.push(id); save(); } }
const V_IRENE = { voice: 'f', rate: 0.95, pitch: 1.05, fx: 'phone' }, V_DESK = { voice: 'm', rate: 0.98, pitch: 0.9, fx: 'phone' }, V_OP = { voice: 'f', rate: 0.9, pitch: 1.15, fx: 'phone' };
const clip = (base, id, extra) => Object.assign({}, base, { clip: id }, extra || {});
function CALLS(n) {
  if (n === '8') return async alive => {
    hiss(true); pstate('Message service.');
    await say('Recording', S.flags.heardMsgs ? 'You have two saved messages.' : 'You have two new messages.', clip(V_OP, S.flags.heardMsgs ? 'recSaved' : 'recNew')); if (!alive()) return;
    sTone([1000], 0.35, 0.07); await wait(800); if (!alive()) return;
    pstate('Message one. Thursday, 11:52 p.m.');
    await say('Irene', 'Eli, it\'s me. It\'s Thursday night. The desk says you\'ve taken the room through Sunday. Whatever you think is on that television, it isn\'t Bill, and it was never your fault. Please come home. And if you\'ve hidden your keys in your shoes again, like you did in Dayton, I swear to God, Eli.', clip(V_IRENE, 'irene'));
    if (!alive()) return; heard('msg1'); sTone([1000], 0.35, 0.07); await wait(800); if (!alive()) return;
    pstate('Message two. Saturday, 4:10 a.m.');
    await say('Front desk', 'Mr. Varga, front desk. The guests in 405 and 407 are complaining about the knocking again. Sir, we\'ve asked you twice.', clip(V_DESK, 'desk1')); if (!alive()) return;
    setGain(lineHiss, 0.12, 0.02); await wait(900); setGain(lineHiss, 0.018, 0.1); if (!alive()) return;
    await say('Front desk', 'Hold on. I\'m looking at the key board. There\'s no hook for a four-oh-six. We don\'t have a four-oh-six. Who is this? Who am I talking to?', clip(V_DESK, 'desk2', { rate: 1.05 }));
    if (!alive()) return; heard('msg2');
    if (!S.flags.heardMsgs) { flag('heardMsgs'); const d = $('.lamp-dot'); if (d) d.classList.remove('on'); }
    await say('Recording', 'End of messages.', clip(V_OP, 'recEnd')); if (alive()) pstate('End of messages.');
  };
  if (n === '0') return async alive => {
    pstate('Ringing the front desk…'); if (!await ringOut(alive, 2)) return; hiss(true); pstate('Someone picked up.');
    subtitle('', '<i>Someone picks up. Nobody speaks. Rain. And very faintly, the flip of a clock card.</i>', 0);
    await wait(2200); if (!alive()) return; sClick(POS.phone, 0.25, 700); sClick(null, 0.12, 700); await wait(3000); if (!alive()) return;
    heard('call0'); clearSubs(); hiss(false); sThunk(null, 0.25, 300); pstate('They hung up.');
  };
  if (n === '4406') return async alive => {
    toneStart('busy'); pstate('Busy. Your own room is busy.');
    PH.afterHang = () => after(4, () => ringPhone(6, ownVoiceCall));
  };
  if (n === '4407') return async alive => {
    pstate('Ringing room 407…'); if (!await ringOut(alive, 2)) return; hiss(true); pstate('Someone picked up.');
    await wait(1400); if (!alive()) return;
    sKnocks(null, 3, 0.6, 0.35, 1); sKnocks(POS.bath, 3, 0.6, 1.0);
    subtitle('', '<i>Three knocks come down the line, and at the same moment, from behind the bathroom door.</i>', 5000);
    G.fear = Math.max(G.fear, 0.7); await wait(3200); if (!alive()) return; heard('call407'); hiss(false); sThunk(null, 0.25, 300); pstate('They hung up.');
  };
  if (/^4\d{3}$/.test(n)) return async alive => { pstate(`Ringing room ${n.slice(1)}…`); if (await ringOut(alive, 6)) pstate('No answer.'); };
  if (/^7\d{4}$/.test(n)) return async alive => { hiss(true); await say('Operator', 'Your wake-up call is set for three seventeen a.m. Sleep well.', clip(V_OP, 'wake')); if (alive()) { heard('wake'); pstate('Wake-up call set.'); } };
  if (n[0] === '9') return async alive => {
    hiss(true); await say('Operator', 'Outside lines are not available from this room.', clip(V_OP, 'outside')); if (!alive()) return;
    if (n === '92824') { await wait(1500); if (!alive()) return; await say('', '<i>Closer, almost a whisper:</i> Keep your eyes on it.', { voice: 'm', rate: 0.78, pitch: 0.55, volume: 0.8, clip: 'whisper', fx: 'phone', speed: 0.8 }); if (alive()) heard('outside2'); }
    else heard('outside');
    if (alive()) pstate('The line clicks.');
  };
  return async alive => {
    sTone([913.8], 0.33, 0.08, 0); sTone([1370.6], 0.33, 0.08, 0.34); sTone([1776.7], 0.33, 0.08, 0.68); await wait(1150); if (!alive()) return;
    hiss(true); await say('Operator', 'We\'re sorry. Your call cannot be completed as dialed.', clip(V_OP, 'sorry')); if (alive()) pstate('Hang up and try again.');
  };
}
async function ownVoiceCall(alive) {
  pstate('Incoming call.'); await wait(1500); if (!alive()) return;
  await say('Your voice', 'Don\'t fall asleep again.', { voice: 'm', rate: 0.82, pitch: 0.85, clip: 'own', fx: 'phone', speed: 0.9 }); if (!alive()) return;
  heard('callOwn'); G.fear = Math.max(G.fear, 0.8); await wait(700); hiss(false); sThunk(null, 0.25, 300); pstate('The line went dead.');
}
async function breathCall(alive) {
  pstate('Someone is on the line.'); sBreath(null, 3, 0.3, true);
  subtitle('', '<i>Breathing. Slow, close to the mouthpiece. When you hold your breath, it holds its breath too.</i>', 0);
  await wait(8200); if (!alive()) return; heard('breath'); clearSubs(); hiss(false); sThunk(null, 0.25, 300); pstate('The line went dead.');
}

/* ---------------- helpers ---------------- */
function behindPos(d = 0.6) { return new THREE.Vector3(P.x + Math.sin(G.yaw) * d, G.eye - 0.1, P.z + Math.cos(G.yaw) * d); }
function placeChairMesh() {
  O.chair.position.set(S.chair.x, 0, S.chair.z); O.chair.rotation.y = S.chair.r;
  Object.assign(O.colChair, { minX: S.chair.x - 0.24, maxX: S.chair.x + 0.24, minZ: S.chair.z - 0.24, maxZ: S.chair.z + 0.24 });
}
const chairNearDesk = () => Math.hypot(S.chair.x - CHAIR_DESK.x, S.chair.z - CHAIR_DESK.z) < 0.7;
const nearVent = () => G.onChair && Math.hypot(S.chair.x - 2.1, S.chair.z + 2.8) < 0.95;
function nearWardTop() {
  if (!G.onChair) return false;
  const dx = Math.max(-2.5 - S.chair.x, 0, S.chair.x - (-1.88)), dz = Math.max(1.72 - S.chair.z, 0, S.chair.z - 2.95);
  return Math.hypot(dx, dz) < 0.75;
}
function progress() { const k = ['readLog', 'heardMsgs', 'keyTaken', 'rubbed', 'suitOpen', 'sawFeed', 'caseOpen', 'ventOpen', 'reached', 'doorOpen']; return (k.filter(f => S.flags[f]).length + (has('tapeS') ? 1 : 0)) / (k.length + 1); }
function pose(obj, from, to, dur = 0.6, done) { const f = Object.assign({}, from); tween(dur, k => { for (const key in to) { const [o, p] = key.split('.'); obj[o][p] = lerp(f[key], to[key], k); } }, done); }

/* ---------------- actions ---------------- */
function toggleLamp() { S.lamp = !S.lamp; sClick(O.lamp.getWorldPosition(new THREE.Vector3()), 0.5, 1800); save(); onTVChange(); }
function toggleCeil() { S.ceil = !S.ceil; sClick(O.switch.position, 0.6, 1500); O.switchLever.position.y = S.ceil ? 0.02 : -0.005; save(); onTVChange(); }
function toggleBlinds() { S.blinds = !S.blinds; sScrape(POS.window, 0.5, 0.15); const a0 = O.slats[0].rotation.z, a1 = S.blinds ? 0.2 : 1.1; tween(0.5, k => O.slats.forEach(s => s.rotation.z = lerp(a0, a1, k))); save(); }
function takePainting() {
  S.painting = true; save(); sScrape(O.painting.position, 0.4, 0.2);
  const r0 = O.painting.rotation.z;
  tween(0.8, k => { O.painting.position.y = lerp(1.62, 0.98, k); O.painting.position.z = lerp(-2.975, -2.62, k); O.painting.rotation.x = lerp(0, -0.28, k); O.painting.rotation.z = lerp(r0, 0, k); },
    () => subtitle('', '<i>It was hanging on a single nail. Behind it, someone has scratched into the plaster.</i>', 5000));
}
function hangPainting() { S.painting = false; save(); sScrape(O.painting.position, 0.4, 0.2); tween(0.8, k => { O.painting.position.y = lerp(0.98, 1.62, k); O.painting.position.z = lerp(-2.62, -2.975, k); O.painting.rotation.x = lerp(-0.28, 0, k); }); }
function toggleDrawer() { S.drawer = !S.drawer; save(); sScrape(O.desk.position, 0.35, 0.22); const x0 = O.drawer.position.x, x1 = S.drawer ? 0.3 : 0; tween(0.4, k => O.drawer.position.x = lerp(x0, x1, k)); }
function lookUnderBed() {
  if (!G.crouch) { subtitle('', `<i>You'd have to get down on the floor for that.</i> &nbsp;${G.touch ? 'The Crouch button' : '<kbd>C</kbd>'} crouches.`, 4000); return; }
  S.skirt = true; save(); sScrape(new THREE.Vector3(-0.3, 0.2, -1.6), 0.3, 0.14);
  tween(0.5, k => { O.skirtE.rotation.z = 1.35 * k; O.skirtF.rotation.x = -1.35 * k; });
  noRay(O.skirtE); noRay(O.skirtF);
  subtitle('', '<i>Dust. Cigarette ash. A pair of man\'s brown shoes, set side by side with the toes pointing out, as if someone meant to step straight into them.</i>', 6500);
}
function openWard() {
  if (!S.flags.wardUnlocked) {
    if (has('key')) { flag('wardUnlocked'); sClick(POS.wardrobe, 0.6, 2600); toast('The little brass key turns.'); }
    else { flag('wardTried'); sThunk(POS.wardrobe, 0.5, 150); subtitle('', '<i>Locked. There\'s a small brass keyhole under the handle.</i>', 3500); return; }
  }
  S.ward = true; save(); sCreak(POS.wardrobe, 1.0, 0.4, 70);
  const a = O.wdL.rotation.y; tween(0.9, k => { O.wdL.rotation.y = lerp(a, 1.9, k); O.wdR.rotation.y = -lerp(a, 1.9, k); });
  if (!S.flags.wardOpened) { flag('wardOpened'); after(0.7, () => { for (let i = 0; i < 5; i++) sClick(POS.wardrobe, 0.25, 2800 + i * 200); sFlutter(POS.wardrobe, 1.2, 0.3); const c0 = O.coat.rotation.x; tween(1.6, k => O.coat.rotation.x = Math.sin(k * 12) * 0.08 * (1 - k)); }); }
}
function closeWard() { S.ward = false; save(); sCreak(POS.wardrobe, 0.8, 0.3, 80); const a = O.wdL.rotation.y; tween(0.8, k => { O.wdL.rotation.y = lerp(a, 0, k); O.wdR.rotation.y = -lerp(a, 0, k); }, () => sThunk(POS.wardrobe, 0.3, 140)); }
function suitLock() {
  flag('sawSuit');
  openLock({ id: 'suit', title: 'Suitcase lock', sub: 'Three brass wheels set into the latch of a leather suitcase.', n: 3, brass: true, answer: '314', btn: 'Press the latches', pos: POS.wardrobe,
    onOpen: () => { flag('suitOpen'); tween(0.6, k => O.suitLid.rotation.z = 1.2 * k); after(0.8, suitContents); } });
}
function suitContents() {
  openContainer('Suitcase', 'Shirts folded with care, and under them:', [
    { name: 'VHS tape: THU 10/27', desc: 'Handwritten label.', take: 'tapeT', onTake: () => { O.suitIn.children[0].visible = false; } },
    { name: 'WKVR staff badge', desc: 'Laminated, with a photo.', read: 'badge', verb: 'Look' },
    { name: 'Newspaper clipping', desc: 'Folded small and soft from handling.', read: 'clip' },
    { name: 'Photograph', desc: 'A snapshot, creased down the middle.', read: 'irene', verb: 'Look' }]);
}
function caseLock() {
  flag('sawCase');
  openLock({ id: 'case', title: 'Tool case', sub: 'Four steel number wheels between the latches. Stencilled on the lid: <i>WKVR-TV &middot; PROPERTY OF ENGINEERING</i>.', n: 4, answer: '2518', btn: 'Snap the latches', pos: new THREE.Vector3(2.12, 0.2, 1.05),
    onOpen: () => { flag('caseOpen'); tween(0.6, k => O.caseLid.rotation.z = -1.2 * k); after(0.8, caseContents); } });
}
function caseContents() {
  openContainer('Tool case', 'Foam cut-outs shaped for tools. Most of them are empty.', [
    { name: 'Flat screwdriver', desc: 'Heavy, with flecks of cream paint in the notch of the blade.', take: 'screwdriver', onTake: () => { O.caseIn.children[0].visible = false; } },
    { name: 'Flashlight', desc: 'Rubber-cased. It works.', take: 'flashlight', onTake: () => { O.caseIn.children[1].visible = false; toast(G.touch ? 'The Flashlight button switches it on or off.' : 'Press <kbd>F</kbd> to switch the flashlight on or off.'); } }]);
}
function padlock() {
  flag('sawPadlock');
  openLock({ id: 'door', title: 'Padlock', sub: 'A brass word lock through a hasp that someone screwed onto the door from the inside. Five lettered wheels.', n: 5, letters: true, brass: true, answer: 'WATCH', btn: 'Pull the shackle', pos: new THREE.Vector3(1.93, 1.2, 2.94), onOpen: openDoor });
}
function peephole() {
  const t = S.flags.reached ? 'The corridor is empty, and much longer than the building could possibly be. Every light in it is off except the one just outside your door.' : 'A long dark corridor, bent by the lens. Far away at the end, a red EXIT sign.';
  subtitle('', `<i>${t}</i>`, 6000);
}
function knockBack() {
  if (G.time < (G.knockCool || 0)) return; G.knockCool = G.time + 9;
  sKnocks(new THREE.Vector3(-0.9, 1.3, 2.85), 3, 0.4, 0.6); subtitle('', '<i>You knock three times.</i>', 2400);
  after(2.4, () => { sKnocks(POS.bath, 3, 0.45, 1.0); subtitle('', '<i>Three knocks answer from the other side.</i>', 3000); });
  after(5.4, () => { sKnock(POS.bath, 1.4); G.fear = Math.max(G.fear, 0.7); subtitle('', '<i>Then a fourth. Much closer to the wood.</i>', 3200); });
}
function loosenBoard() {
  if (S.boards >= 3) return; const b = O.boards[S.boards]; S.boards++; save();
  sCreak(POS.bath, 0.7, 0.5, 120); sThunk(POS.bath, 0.8, 90); const r0 = b.rotation.z; tween(0.4, k => b.rotation.z = r0 - 1.05 * k, null, t => t * t);
}
function penalty() {
  G.lockout = G.time + 7; G.powerCut = 6; G.fear = 1; G.red = 0.55; sStinger(0.8);
  subtitle('', '<i>The lights die.</i>', 2500);
  const b = behindPos(0.55);
  after(0.9, () => sBreath(b, 2, 0.95, true));
  after(2.5, () => loosenBoard());
  after(4.2, () => sKnock(behindPos(0.5), 1.5));
  after(6.6, () => { if (S.boards > 0) subtitle('', `<i>When the lights come back, ${S.boards === 3 ? 'all three boards' : S.boards === 2 ? 'two of the boards' : 'one of the boards'} across the bathroom door ${S.boards === 1 ? 'is' : 'are'} hanging loose.</i>`, 5000); });
  resumeLook();
}
function playMemo() {
  if (G.memo) { subtitle('', '<i>The tape is still playing.</i>', 2000); return; }
  G.memo = true; toast('You press play.');
  const pos = O.recorder.getWorldPosition(new THREE.Vector3()); sClick(pos, 0.5, 1300);
  const tape = A.ready ? loopNoise({ pos, type: 'bandpass', f: 3000, q: 0.5, vol: 0.05, wet: 0.1 }) : null;
  (async () => {
    await wait(700);
    await say('Elias, on tape', 'Memo. Friday. Fourteen past three.', { voice: 'm', rate: 0.85, pitch: 0.85, clip: 'memo1', fx: 'tape', pos }); await wait(900);
    await say('Elias, on tape', 'The chair is in the picture again. Under the vent.', { voice: 'm', rate: 0.85, pitch: 0.85, clip: 'memo2', fx: 'tape', pos }); await wait(700);
    await say('Elias, on tape', 'I\'m sitting on the bed. I am not going to touch the chair.', { voice: 'm', rate: 0.82, pitch: 0.85, clip: 'memo3', fx: 'tape', pos }); await wait(1800);
    await say('Elias, on tape', 'I\'m not going to touch the chair.', { voice: 'm', rate: 0.75, pitch: 0.8, volume: 0.75, clip: 'memo4', fx: 'tape', pos, speed: 0.97 }); await wait(600);
    sScrape(pos, 2.4, 0.35); subtitle('', '<i>A slow scrape of wood across carpet. The tape runs out.</i>', 4000); await wait(2600);
    if (tape) { setGain(tape, 0, 0.1); setTimeout(() => { try { tape.src.stop(); } catch (e) {} }, 600); }
    sClick(pos, 0.5, 1300); heard('memo'); G.memo = false;
  })();
}
function unscrewVent() {
  G.cutscene = true; updatePrompt(true);
  const pos = POS.vent; let i = 0;
  const next = () => {
    if (i < 4) { sSqueak(pos, 0.14); after(0.25, () => sSqueak(pos, 0.12)); O.screws[i].visible = false; i++; after(0.7, next); return; }
    S.flags.ventOpen = true; S.screws = 0; save(); O.vent.traverse(o => o.userData.iid = 'grilleFloor');
    sScrape(pos, 0.3, 0.3);
    const from = { y: 2.45, z: -2.99, x: 2.1 };
    tween(0.55, k => { O.vent.position.y = lerp(from.y, 0.012, k); O.vent.position.z = lerp(from.z, -2.45, k); O.vent.position.x = lerp(from.x, 1.95, k); O.vent.rotation.x = -Math.PI / 2 * k; }, () => { sThunk(new THREE.Vector3(1.95, 0.05, -2.45), 1.0, 110); }, t => t * t);
    burstMoths(); sFlutter(pos, 2.4, 0.6); G.fear = 1; O.eyes.visible = false; G.eyesOn = false;
    subtitle('', '<i>The grille drops. Moths pour out of the dark, dozens of them, soft against your face, and then they\'re gone. Warm air breathes out of the duct.</i>', 6000);
    after(1.2, () => { G.cutscene = false; updatePrompt(true); });
  };
  subtitle('', '<i>The screws are painted over. They give, one by one.</i>', 3000);
  after(0.4, next);
}
function burstMoths() {
  O.moths.forEach((m, i) => { m.s.visible = true; m.s.position.set(2.1 + rand(-0.15, 0.15), 2.45 + rand(-0.08, 0.08), -3.0 + rand(0, 0.1)); m.v.set(rand(-1.4, 0.4), rand(-0.6, 0.6), rand(0.8, 2.4)); m.life = rand(2.2, 4.2); m.ph = rand(0, 6); });
}
function reachVent() {
  G.cutscene = true; G.fearT = 1; G.blackT = 0.6; updatePrompt(true); sHeart(9, 0.7, 0.72);
  subtitle('', '<i>You reach into the duct up to the elbow. It\'s warm in there. Warmer than it should be.</i>', 0);
  after(3.0, () => subtitle('', '<i>Paper. A watch strap. Something smooth and square.</i>', 0));
  after(5.4, () => { subtitle('', '<i>Something brushes the back of your hand.</i>', 3000); sStinger(1.2); sKnock(POS.vent, 1.7); G.fear = 1; G.shake = 0.6; });
  after(6.1, () => {
    G.blackT = 0; G.fearT = 0.2; flag('reached'); give('page', true); give('watch', true); give('polaroid', true); O.ventItems.visible = false;
    S.tv.on = true; S.tv.ch = 13; SET.chShown = G.time; sThunk(POS.tv, 0.6, 80); save(); onTVChange();
    G.cutscene = false; G.polaroid = makePolaroid();
    openContainer('From inside the vent', 'You pull your arm back fast. Behind you, the television has switched itself on.', [
      { name: 'Torn logbook page', desc: 'The missing last page of the logbook.', read: 'page' },
      { name: 'Wristwatch', desc: 'Stopped at 3:17.', item: 'watch' },
      { name: 'Polaroid', desc: 'Taken from inside the vent.', read: 'polaroid', verb: 'Look' }]);
  });
}
function openDoor() {
  flag('doorOpen'); G.cutscene = true; updatePrompt(true);
  tween(0.35, k => O.shackle.position.y = 0.03 + 0.025 * k);
  after(0.7, () => {
    sThunk(O.lock.position, 0.7, 160); O.lock.visible = false;
    subtitle('', '<i>The padlock drops open. Before you can touch the handle, the door swings inward on its own, slowly, all the way.</i>', 6000);
    sCreak(new THREE.Vector3(1.45, 1.2, 2.9), 3.2, 0.5, 58);
    tween(3.2, k => O.door.rotation.y = 1.45 * k, null, t => t);
    O.colDoor.on = false; O.colHall.forEach(c => c.on = true);
    after(1.2, () => { G.cutscene = false; updatePrompt(true); });
  });
}

/* ---------------- chair ---------------- */
function climbChair() {
  if (Math.hypot(P.x - S.chair.x, P.z - S.chair.z) > 1.3) { subtitle('', '<i>Get closer to it first.</i>', 2000); return; }
  G.onChair = true; G.crouch = false; G.eyeT = 2.12; sScrape(O.chair.position, 0.2, 0.2);
  const x0 = P.x, z0 = P.z; tween(0.35, k => { P.x = lerp(x0, S.chair.x, k); P.z = lerp(z0, S.chair.z, k); });
  toast(G.touch ? 'The Step down button gets you off it.' : '<kbd>Space</kbd> steps back down.');
}
function stepDown() {
  if (!G.onChair) return;
  for (let i = 0; i < 12; i++) {
    const a = G.yaw + Math.PI + i * (TAU / 12), x = S.chair.x + Math.sin(a) * 0.62, z = S.chair.z + Math.cos(a) * 0.62;
    if (boxFree(x - 0.22, x + 0.22, z - 0.22, z + 0.22, O.colChair)) { G.onChair = false; G.eyeT = 1.62; const x0 = P.x, z0 = P.z; tween(0.3, k => { P.x = lerp(x0, x, k); P.z = lerp(z0, z, k); }); sStep(0.3); return; }
  }
}
function pickChair() { G.carrying = { name: 'Desk chair' }; O.colChair.on = false; sScrape(O.chair.position, 0.3, 0.3); }
function dropCarried() {
  const x = O.chair.position.x, z = O.chair.position.z;
  if (!boxFree(x - 0.24, x + 0.24, z - 0.24, z + 0.24, O.colChair)) { toast('There isn\'t room to set it down there.'); return; }
  S.chair = { x, z, r: O.chair.rotation.y }; placeChairMesh(); O.colChair.on = true; G.carrying = false; sThunk(O.chair.position, 0.35, 160); save();
}

/* ---------------- interactions ---------------- */
function look(txt, ms = 4500) { return { label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) }; }
function registerInteractions() {
  inter('bed', O.bed, { name: 'Bed', actions: () => [look(S.flags.imprint ? 'There\'s a shape pressed into the covers. A person\'s shape. It\'s still warm, and you\'ve been over here the whole time.' : 'The covers are still warm where you were lying. You don\'t want to lie down again.')] });
  const skirt = { name: 'Bed skirt', enabled: () => !S.skirt, actions: () => [{ label: G.crouch ? 'Lift it and look under the bed' : 'Look under the bed', run: lookUnderBed }] };
  inter('skirt', O.skirtE, skirt); O.skirtF.traverse(o => o.userData.iid = 'skirt');
  inter('shoes', O.shoes, { name: 'Brown oxfords', reach: 1.8, enabled: () => S.skirt, actions: () => [{ label: S.flags.keyTaken ? 'Look' : 'Look inside', run: () => {
    if (!S.flags.keyTaken) { flag('keyTaken'); give('key'); subtitle('', '<i>Tucked into the toe of the left shoe: a small brass key.</i>', 4500); }
    else subtitle('', '<i>Size ten. The laces are still tied.</i>', 3000); } }] });
  inter('nsdrawer', O.nsDrawer, { name: 'Nightstand drawer', actions: () => [{ label: 'Open', run: () => { sScrape(O.ns.position, 0.25, 0.15); subtitle('', '<i>A Gideon Bible. Someone has torn out the whole Gospel of Mark.</i>', 4500); } }] });
  inter('lamp', O.lamp, { name: 'Bedside lamp', actions: () => [{ label: S.lamp ? 'Switch off' : 'Switch on', run: toggleLamp }] });
  inter('phone', O.phone, { name: 'Telephone', note: () => PH.ringing ? 'It\'s ringing.' : (!S.flags.heardMsgs ? 'A red lamp on the base is blinking.' : ''), actions: () => [{ label: PH.ringing ? 'Answer it' : 'Pick up the receiver', run: openPhone }] });
  inter('pad', O.pad, { name: 'Motel notepad', actions: () => [{ label: 'Look', run: () => openDoc('pad') }] });
  inter('clock', O.clock, { name: () => `Flip clock: ${fmtClock(S.clock)} a.m.`, actions: () => [] });
  inter('painting', O.painting, { name: 'Painting of a lake at dusk', actions: () => [S.painting ? { label: 'Hang it back up', run: hangPainting } : { label: 'Lift it off the wall', run: takePainting }] });
  inter('insc', O.insc, { name: 'Scratches in the plaster', enabled: () => S.painting, actions: () => [{ label: 'Read', run: () => openDoc('insc') }] });
  inter('blinds', O.blinds, { name: 'Venetian blinds', actions: () => [{ label: 'Look outside', run: () => subtitle('', `<i>Rain on the glass. The parking lot is empty. Up on the ridge the old transmitter tower blinks red, and the motel sign has lost its V.${S.flags.hand ? ' There\'s a handprint on the glass. On the outside. This is the fourth floor.' : ''}</i>`, 6500) }, { label: S.blinds ? 'Close the blinds' : 'Open the blinds', run: toggleBlinds }] });
  inter('heater', O.heater, { name: 'Wall heater', actions: () => [look('Switched off. It ticks now and then as it cools, like something tapping from inside.')] });
  inter('desk', O.desk, { name: 'Desk', actions: () => [look('Cigarette burns along the edge. Someone worked here for nights on end.')] });
  inter('drawer', O.drawer, { name: 'Desk drawer', actions: () => [{ label: S.drawer ? 'Close it' : 'Open it', run: toggleDrawer }] });
  inter('pencil', O.pencil, { name: 'Pencil', enabled: () => S.drawer && !has('pencil'), actions: () => [{ label: 'Take', run: () => { give('pencil'); O.pencil.visible = false; } }] });
  inter('log', O.log, { name: 'Green logbook', actions: () => [{ label: 'Read', run: () => openDoc('log') }] });
  inter('recorder', O.recorder, { name: 'Pocket cassette recorder', actions: () => [{ label: 'Play the tape', run: playMemo }] });
  inter('ashtray', O.ashtray, { name: 'Ashtray', actions: () => [look('Seven cigarettes, each one smoked right down to the filter.')] });
  inter('mug', O.mug, { name: 'Coffee mug', actions: () => [look('Cold coffee with a skin on it.')] });
  inter('meter', O.meter, { name: 'Signal meter', actions: () => [look('A field-strength meter wired to a coil of coax. The needle rests on zero. Now and then it twitches.')] });
  inter('coil', O.coil, { name: 'Coil of coaxial cable', actions: () => [look('Enough cable to run from the set to the vent and back, twice.')] });
  inter('chair', O.chair, { name: 'Desk chair', reach: 1.8, enabled: () => !G.carrying, actions: () => G.onChair ? [] : [{ label: 'Climb onto it', run: climbChair }, { label: 'Drag it', run: pickChair }] });
  inter('ward', O.wd, { name: 'Wardrobe', actions: () => S.ward ? [{ label: 'Close it', run: closeWard }] : [{ label: S.flags.wardUnlocked ? 'Open it' : has('key') ? 'Unlock it with the brass key' : 'Open it', run: openWard }] });
  inter('coat', O.coat, { name: 'Man\'s overcoat', enabled: () => S.ward, actions: () => [{ label: 'Search the pockets', run: () => {
    if (!has('moth')) { give('moth'); subtitle('', '<i>Lint. A bus transfer from Dayton. And pinned inside the lapel, over the heart, a tiny brass moth.</i>', 5500); }
    else subtitle('', '<i>Nothing else in the pockets.</i>', 2500); } }] });
  inter('suit', O.suit, { name: 'Leather suitcase', enabled: () => S.ward, actions: () => [S.flags.suitOpen ? { label: 'Look inside', run: suitContents } : { label: 'Try the lock', run: suitLock }] });
  O.scratches.forEach(s => s.userData.noRay = false);
  inter('scr', O.scratches[0], { name: 'Inside of the wardrobe door', enabled: () => S.ward, actions: () => [look('Fingernail marks, dozens of them, scored into the wood. They start near the bottom and stop at about the height of a man\'s chest.', 6000)] }); O.scratches[1].userData.iid = 'scr';
  inter('tapeS', O.tapeS, { name: 'Something on top of the wardrobe', reach: 1.8, enabled: () => !has('tapeS'), note: () => nearWardTop() ? '' : 'Out of reach.', actions: () => nearWardTop() ? [{ label: 'Take it', run: () => {
    give('tapeS'); O.tapeS.visible = false; G.fear = Math.max(G.fear, 0.5);
    subtitle('', '<i>A videotape, left where no one standing on the floor would ever see it. Under the date, pressed so hard the pen tore the label: DON\'T.</i>', 6500); } }] : [] });
  inter('dresser', O.dresser, { name: 'Dresser', actions: () => [look('The drawers are empty apart from a paper laundry bag with PINECREST printed on it.')] });
  inter('tv', O.tv, { name: 'Television', reach: 2.6, actions: () => [{ label: 'Use the set', run: openSet }, { label: S.tv.on ? 'Switch it off' : 'Switch it on', run: () => setTV(!S.tv.on) }] });
  inter('vcr', O.vcr, { name: 'VCR', note: () => ['tapeW', 'tapeT', 'tapeF', 'tapeS'].some(has) && !S.vcr ? 'You have a tape in your pocket.' : '', actions: () => [{ label: ['tapeW', 'tapeT', 'tapeF', 'tapeS'].some(has) && !S.vcr ? 'Put a tape in' : 'Use the set', run: openSet }] });
  O.vcrTape.traverse(o => o.userData.iid = 'vcr');
  inter('guide', O.guide, { name: 'TV WEEK listings page', actions: () => [{ label: 'Read', run: () => openDoc('guide') }] });
  ['tapeW', 'tapeF'].forEach(id => inter(id, O[id], { name: `VHS tape: "${TAPES[id].label}"`, enabled: () => !has(id), actions: () => [{ label: 'Take', run: () => { give(id); O[id].visible = false; } }] }));
  inter('mirror', O.mirror, { name: 'Mirror', actions: () => [look('Someone has draped a towel over the mirror and taped it down at the corners. You leave it where it is.')] });
  inter('case', O.case, { name: 'Aluminium tool case', actions: () => [S.flags.caseOpen ? { label: 'Look inside', run: caseContents } : { label: 'Try the lock', run: caseLock }] });
  inter('door', O.door, { name: 'Door to the hall', enabled: () => !S.flags.doorOpen, actions: () => [{ label: 'Try the padlock', run: padlock }, { label: 'Look through the peephole', run: peephole }] });
  O.lock.traverse(o => o.userData.iid = 'door');
  inter('firemap', O.firemap, { name: 'Fire evacuation plan', enabled: () => !S.flags.doorOpen, actions: () => [{ label: 'Read', run: () => openDoc('firemap') }] });
  inter('bath', O.bath, { name: 'Bathroom door', note: () => S.boards ? 'Nailed shut. Some of the boards are hanging loose.' : 'Nailed shut with three boards.', actions: () => [{ label: 'Knock', run: knockBack }, { label: 'Pull at the boards', run: () => { sCreak(POS.bath, 0.6, 0.3, 130); subtitle('', '<i>The nails don\'t give. You get the feeling someone on the other side is leaning against the door, very gently.</i>', 5000); } }] });
  inter('calendar', O.calendar, { name: 'Wall calendar', actions: () => [{ label: 'Read', run: () => openDoc('calendar') }] });
  inter('switch', O.switch, { name: 'Light switch', actions: () => [{ label: S.ceil ? 'Ceiling light off' : 'Ceiling light on', run: toggleCeil }] });
  inter('vent', O.ventZone, { name: 'Air vent', reach: 2.8, note: () => nearVent() ? (!S.flags.ventOpen && !has('screwdriver') ? 'Four screws, painted over.' : '') : 'High in the corner. Out of reach.',
    actions: () => {
      if (!nearVent()) return [look(S.flags.ventOpen ? 'An open black square high in the corner. Warm air comes out of it in slow breaths.' : 'A grille high in the corner, just under the ceiling. Dark streaks run down the wallpaper beneath it. You can feel air moving. Warm air.', 5500)];
      if (!S.flags.ventOpen) return has('screwdriver') ? [{ label: 'Unscrew the grille', run: unscrewVent }] : [look('Four screws, painted over in cream. You\'d need a screwdriver.')];
      if (!S.flags.reached) return [{ label: 'Reach inside', run: reachVent }];
      return [look('Empty now. The duct runs back into the wall much further than the wall is thick.')];
    } });
  INTER.set('grilleFloor', { id: 'grilleFloor', obj: O.vent, name: 'Vent grille', actions: () => [look('The grille, face down on the carpet where it fell. The back of it is furred with dust and moth wings.')] });
  inter('streak', O.streak, { name: 'Streaks on the wallpaper', actions: () => [look('Dark streaks run down from the vent. Below them the paint is scored with short parallel scratches, in fours.')] });
  inter('stain', O.stainFloor, { name: 'Stain on the carpet', actions: () => [look('The carpet under the vent is stiff and dark, as if something dripped here for a long time.')] });
  // bigger targets for small things
  [['recorder', O.recorder, 0.04], ['tapeW', O.tapeW], ['tapeF', O.tapeF], ['pencil', O.pencil], ['pad', O.pad, 0.02], ['phone', O.phone, 0.02], ['clock', O.clock], ['lamp', O.lamp],
   ['log', O.log], ['shoes', O.shoes], ['switch', O.switch], ['door', O.lock], ['guide', O.guide, 0.02], ['mug', O.mug, 0.02], ['ashtray', O.ashtray, 0.02], ['meter', O.meter, 0.012], ['coil', O.coil, 0.012]].forEach(([id, o, pad]) => hitbox(id, o, pad));
}

/* ---------------- state ---------------- */
function defaults() {
  return { flags: {}, inv: [], docs: [], heard: [], hints: 0, hintTiers: {}, wrong: 0, locks: {}, tapesSeen: {},
    lamp: true, ceil: false, blinds: false, painting: false, drawer: false, skirt: false, ward: false, screws: 4, boards: 0,
    tv: { on: false, ch: 4 }, vcr: null, chair: Object.assign({}, CHAIR_DESK), clock: 171, clockAcc: 0, elapsed: 0, player: null };
}
function applyState() {
  placeChairMesh();
  if (S.painting) { O.painting.position.set(-1.0, 0.98, -2.62); O.painting.rotation.set(-0.28, 0, 0); } else { O.painting.position.set(-1.0, 1.62, -2.975); O.painting.rotation.set(0, 0, S.flags.crooked ? 0.12 : 0); }
  O.drawer.position.x = S.drawer ? 0.3 : 0;
  O.skirtE.rotation.z = S.skirt ? 1.35 : 0; O.skirtF.rotation.x = S.skirt ? -1.35 : 0; if (S.skirt) { noRay(O.skirtE); noRay(O.skirtF); }
  O.wdL.rotation.y = S.ward ? 1.9 : 0; O.wdR.rotation.y = S.ward ? -1.9 : 0;
  O.suitLid.rotation.z = S.flags.suitOpen ? 1.2 : 0; O.caseLid.rotation.z = S.flags.caseOpen ? -1.2 : 0;
  O.pencil.visible = !has('pencil'); O.tapeW.visible = !has('tapeW'); O.tapeF.visible = !has('tapeF'); O.tapeS.visible = !has('tapeS');
  O.suitIn.children[0].visible = !has('tapeT'); O.caseIn.children[0].visible = !has('screwdriver'); O.caseIn.children[1].visible = !has('flashlight');
  if (S.flags.ventOpen) { O.vent.position.set(1.95, 0.012, -2.45); O.vent.rotation.x = -Math.PI / 2; O.screws.forEach(s => s.visible = false); O.vent.traverse(o => o.userData.iid = 'grilleFloor'); }
  O.ventItems.visible = !S.flags.reached;
  for (let i = 0; i < S.boards; i++) O.boards[i].rotation.z = O.boards[i].userData.r0 - 1.05;
  O.hand.visible = !!S.flags.hand; O.imprint.visible = !!S.flags.imprint;
  O.slats.forEach(s => s.rotation.z = S.blinds ? 0.2 : 1.1);
  O.switchLever.position.y = S.ceil ? 0.02 : -0.005;
  if (S.flags.doorOpen) { O.door.rotation.y = 1.45; O.lock.visible = false; O.colDoor.on = false; O.colHall.forEach(c => c.on = true); }
  if (S.flags.heardMsgs) O.msgLamp.visible = false;
  showVcrTape(S.vcr, false);
  drawClock(); drawVCR(); renderInv();
}

/* ---------------- scares ---------------- */
const DIR = { t: 50, last: '', pending: null, wait: 0 };
const EVENTS = [
  { id: 'knock', w: 3, ok: () => true, run: () => sKnocks(POS.bath, irand(1, 3), 0.8, 0.85) },
  { id: 'above', w: 1.4, ok: () => true, run: () => { const x0 = rand(-2, 0), z0 = rand(-2, 2); for (let i = 0; i < 6; i++) after(i * 0.62, () => sKnock(new THREE.Vector3(x0 + i * 0.5, 3.3, z0), 0.4, 0, 1)); } },
  { id: 'flicker', w: 2, ok: () => S.lamp || S.ceil, run: () => { G.flickerT = 1.6; } },
  { id: 'chair', w: 1.4, ok: () => !G.carrying && !G.onChair && chairNearDesk(), unseen: () => O.chair, run: () => { const c = S.chair; c.x += (CHAIR_VENT.x - c.x) * 0.07; c.z += (CHAIR_VENT.z - c.z) * 0.07; c.r += 0.3; placeChairMesh(); save(); } },
  { id: 'tv', w: 1.6, ok: () => !S.tv.on && S.flags.readLog && !S.flags.sawFeed && G.play > 300, unseen: () => O.tv, run: () => { S.tv.on = true; S.tv.ch = 13; SET.chShown = G.time; sThunk(POS.tv, 0.5, 90); save(); onTVChange(); } },
  { id: 'ring', w: 1.1, ok: () => !PH.ringing && UI.kind !== 'phone' && G.play > 150, run: () => ringPhone(5, breathCall) },
  { id: 'breath', w: 1.3, ok: () => S.flags.sawFeed, run: () => { sBreath(behindPos(0.7), 2, 0.75, true); G.fear = Math.max(G.fear, 0.4); } },
  { id: 'painting', w: 1, ok: () => !S.painting && !S.flags.crooked, unseen: () => O.painting, run: () => { S.flags.crooked = true; O.painting.rotation.z = 0.12; save(); } },
  { id: 'ward', w: 1.2, ok: () => S.flags.wardUnlocked && !S.ward, unseen: () => O.wd, run: () => { S.ward = true; save(); sCreak(POS.wardrobe, 1.4, 0.35, 60); tween(1.4, k => { O.wdL.rotation.y = 1.9 * k; O.wdR.rotation.y = -1.9 * k; }); } },
  { id: 'hand', w: 2.5, ok: () => S.flags.sawFeed && !S.flags.hand, unseen: () => O.hand, run: () => { S.flags.hand = true; O.hand.visible = true; save(); } },
  { id: 'imprint', w: 3, ok: () => S.flags.reached && !S.flags.imprint, unseen: () => O.bed, run: () => { S.flags.imprint = true; O.imprint.visible = true; save(); } },
  { id: 'drip', w: 1, ok: () => true, run: () => { let t = 0; for (let i = 0; i < 5; i++) { t += rand(0.8, 1.5); after(t, () => sClick(new THREE.Vector3(2.1, 0.1, -2.6), 0.3, 3600)); } } },
];
function director(dt) {
  if (G.cutscene || G.ending || UI.kind === 'phone' || VCR.playing || G.memo) return;
  DIR.t -= dt; if (DIR.t > 0) return;
  if (DIR.pending) {
    const e = DIR.pending;
    if (!e.ok()) { DIR.pending = null; DIR.t = 8; return; }
    if (!inView(e.unseen(), 1.3)) { e.run(); DIR.pending = null; DIR.t = rand(38, 75) * (1 - 0.35 * progress()); }
    else if ((DIR.wait += dt) > 30) { DIR.pending = null; DIR.t = 10; }
    return;
  }
  const pool = EVENTS.filter(e => e.ok() && e.id !== DIR.last); if (!pool.length) { DIR.t = 20; return; }
  let tot = pool.reduce((a, e) => a + e.w, 0), r = Math.random() * tot, ev = pool[0];
  for (const e of pool) { r -= e.w; if (r <= 0) { ev = e; break; } }
  DIR.last = ev.id;
  if (ev.unseen) { DIR.pending = ev; DIR.wait = 0; }
  else { ev.run(); DIR.t = rand(38, 75) * (1 - 0.35 * progress()); }
}
function on317() {
  if (G.cutscene || G.ending || VCR.playing) return;   // never knock over a tape: its knocks are the case code
  if (!S.flags.first317) {
    flag('first317'); G.powerCut = 7; sStinger(0.7); G.fear = 1;
    after(1.4, () => sBell(POS.phone, 1.2));
    after(3.0, () => { SET.override = 2; SET.overrideT = 0.4; G.subliminal = 0.45; sThunk(POS.tv, 0.9, 80); });
    after(4.2, () => sKnocks(S.ward ? POS.bath : POS.wardrobe, 3, 1.0, 1.3));
  } else {
    const r = Math.random();
    if (r < 0.3) sKnocks(POS.bath, 3, 1.0, 1.2);
    else if (r < 0.55) { G.flickerT = 2.2; }
    else if (r < 0.8) { SET.override = 1; SET.overrideT = 0.5; sThunk(POS.tv, 0.6, 80); }
    else sBreath(behindPos(0.6), 1, 0.8, true);
  }
}
function tickClock(dt) {
  S.clockAcc += dt; if (S.clockAcc < 45) return; S.clockAcc -= 45;
  S.clock++;
  if (S.clock >= 198) { S.clock = 194; if (!S.flags.loopSeen) { flag('loopSeen'); after(0.4, () => { if (!UI.kind) subtitle('', '<i>Somewhere behind you, the flip clock turns over. 3:17 becomes 3:14.</i>', 5000); }); } }
  drawClock(); sClick(O.clock.getWorldPosition(new THREE.Vector3()), 0.14, 1100);
  if (S.clock === 197) on317();
}

/* ---------------- per-frame room update ---------------- */
let lightningT = rand(20, 40), boltK = 0, blinkT = 0, eyeT = rand(8, 18), eyeLook = 0, neonT = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function roomUpdate(dt) {
  tickClock(dt);
  vcrUpdate(dt);
  director(dt);
  if (G.powerCut > 0) { G.powerCut -= dt; G.power = 0; if (G.powerCut <= 0) G.flickerT = 1.2; } else G.power = 1;
  let flick = 1; if (G.flickerT > 0) { G.flickerT -= dt; flick = Math.random() < 0.45 ? 0.05 : 1; }
  const pw = G.power * flick;
  L.lamp.intensity = S.lamp ? 5 * pw : 0; L.ceil.intensity = S.ceil ? 9 * pw : 0;
  L.hemi.intensity = lerp(L.hemi.intensity, 0.42 + (S.lamp ? 0.7 : 0) * pw + (S.ceil ? 0.5 : 0) * pw + (G.ending ? 0 : 0), Math.min(1, dt * 8));
  const lampOn = S.lamp && pw > 0.5; O.bulb.material = lampOn ? M.lampOn : M.lampOff; M.shade.emissive.setHex(lampOn ? 0x6a4a20 : 0x000000);
  O.dome.material = S.ceil && pw > 0.5 ? M.dome : M.domeOff;
  if (G.flashOn) { const f = G.power < 0.5 ? (Math.random() < 0.12 ? 1 : 0.12) : 1; L.flash.intensity = 16 * f; renderer.shadowMap.needsUpdate = true; } else L.flash.intensity = 0;
  if (SET.override) { SET.overrideT -= dt; if (SET.overrideT <= 0) SET.override = null; }
  if (G.subliminal > 0) G.subliminal -= dt;
  const mode = screenMode(); tvMat.uniforms.mode.value = mode; tvMat.uniforms.time.value = G.time;
  tvMat.uniforms.ghost.value = (mode === 1 && S.tv.ch === 13) ? 0.2 : 0;
  tvMat.uniforms.roll.value = mode === 3 && VCR.t < 1.2 ? (1.2 - VCR.t) * 0.6 : 0;
  L.tv.intensity = mode ? (mode === 1 ? 0.9 : mode === 4 ? 0.8 : 0.6) * (0.75 + 0.25 * Math.random()) : 0;
  L.tv.color.setHex(mode === 4 ? 0x3050ff : 0xa8d8ff);
  SET.osdT -= dt; if (SET.osdT <= 0) { SET.osdT = 0.2; drawOSD(); if (!VCR.playing && !S.vcr) drawVCR(); }
  setGain(A.loops.tv, mode === 1 ? 0.12 : mode === 2 ? 0.04 : mode === 3 ? 0.035 : 0, 0.05);
  // message lamp
  if (!S.flags.heardMsgs) { blinkT += dt; O.msgLamp.visible = Math.floor(blinkT * 1.6) % 2 === 0; } else O.msgLamp.visible = false;
  // neon + tower
  neonT += dt; const nf = Math.random() < 0.03 ? 0.2 : 1; L.neon.intensity = 0.7 * nf; O.towerLight.visible = Math.floor(neonT * 0.8) % 2 === 0;
  // lightning
  lightningT -= dt;
  if (lightningT <= 0) { lightningT = rand(25, 70); boltK = 1; sThunder(rand(1.0, 3.2), rand(0.35, 0.7)); }
  if (boltK > 0) { boltK = Math.max(0, boltK - dt * 2.6); const b = (boltK > 0.75 || (boltK > 0.35 && boltK < 0.5)) ? boltK : boltK * 0.2; const m = reduceMotion ? 0.35 : 1; L.bolt.intensity = b * 2.4 * m; M.glass.uniforms.flash.value = b * 0.5 * m; G.flash = b * 0.12 * m; } else { L.bolt.intensity = 0; G.flash = 0; M.glass.uniforms.flash.value = 0; }
  M.glass.uniforms.time.value = G.time;
  // eyes in the vent
  const farFromVent = Math.hypot(P.x - 2.1, P.z + 2.9) > 2.3;
  if (!S.flags.ventOpen && roomDark() && !G.flashOn && !G.onChair && G.power > 0.5) {
    eyeT -= dt; if (eyeT <= 0) { G.eyesOn = !G.eyesOn; eyeT = G.eyesOn ? rand(3, 7) : rand(16, 34); }
  } else G.eyesOn = false;
  O.eyes.visible = !!G.eyesOn && farFromVent;
  if (O.eyes.visible && inView(O.eyes, 0.14)) { eyeLook += dt; if (eyeLook > 1.0) { G.eyesOn = false; eyeT = rand(20, 40); eyeLook = 0; } } else eyeLook = 0;
  // moths
  O.moths.forEach(m => { if (!m.s.visible) return; m.life -= dt; m.ph += dt * 30; m.v.y += Math.sin(m.ph * 0.3) * dt * 2; m.s.position.addScaledVector(m.v, dt); m.s.scale.set(0.06 * (0.6 + 0.4 * Math.abs(Math.sin(m.ph))), 0.06, 1); if (m.life <= 0 || m.s.position.z > 3) m.s.visible = false; });
  // carrying the chair
  if (G.carrying) {
    const tx = P.x - Math.sin(G.yaw) * 0.78, tz = P.z - Math.cos(G.yaw) * 0.78;
    const moved = Math.hypot(tx - O.chair.position.x, tz - O.chair.position.z);
    O.chair.position.set(tx, 0, tz); O.chair.rotation.y = G.yaw;
    G.scrapeAcc = (G.scrapeAcc || 0) + moved; if (G.scrapeAcc > 0.35) { G.scrapeAcc = 0; sScrape(O.chair.position, 0.3, 0.22); }
  }
  // audio beds
  setGain(A.loops.tension, 0.004 + G.fear * 0.045, 0.3);
  if (A.loops.vent) setGain(A.loops.vent, S.flags.ventOpen ? 0.05 : 0.02, 0.5);
  if (A.loops.hall) setGain(A.loops.hall, S.flags.doorOpen ? 0.05 : 0, 0.5);
  L.hall.intensity = S.flags.doorOpen ? 1.1 * (Math.random() < 0.04 ? 0.2 : 1) : 0;
  // escape
  if (S.flags.doorOpen && !G.ending && P.z > 3.6) endSequence();
}
function startAmbience() {
  if (!A.ready || A.loops.rain) return;
  A.loops.rain = loopNoise({ type: 'bandpass', f: 1800, q: 0.4, vol: 0.035, wet: 0.1 });
  A.loops.rainWin = loopNoise({ pos: POS.window, type: 'highpass', f: 900, q: 0.5, vol: 0.09, wet: 0.2, ref: 0.8 });
  A.loops.drone = loopNoise({ type: 'lowpass', f: 110, q: 0.8, vol: 0.11, brown: true, wet: 0.1 });
  A.loops.tv = loopNoise({ pos: POS.tv, type: 'bandpass', f: 3200, q: 0.35, vol: 0, wet: 0.2, ref: 0.6 });
  A.loops.vent = loopNoise({ pos: POS.vent, type: 'bandpass', f: 500, q: 0.6, vol: 0.02, wet: 0.2, ref: 0.5 });
  A.loops.hall = loopNoise({ pos: new THREE.Vector3(1.45, 2.2, 8), type: 'lowpass', f: 160, q: 0.8, vol: 0, brown: true, wet: 0.3 });
  const ctx = A.ctx, tg = ctx.createGain(); tg.gain.value = 0.004; [1860, 1873, 2791].forEach(f => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(tg); o.start(); });
  const hum = ctx.createOscillator(); hum.frequency.value = 58; const hg = ctx.createGain(); hg.gain.value = 0.02; hum.connect(hg); hum.start(); route(hg, { wet: 0 });
  const r = route(tg, { wet: 0.3 }); A.loops.tension = { gain: tg };
}

/* ---------------- ending ---------------- */
function endSequence() {
  G.ending = true; flag('escaped');
  S.lamp = false; S.ceil = false; S.tv.on = true; S.tv.ch = 13; SET.chShown = G.time; sThunk(POS.tv, 0.7, 80);
  sTone([55, 58], 3.5, 0.05);
  subtitle('', '<i>Behind you, in the dark room, the television switches itself on.</i>', 0);
  after(4.2, () => { G.cutscene = true; G.blackT = 1; });
  after(5.6, showEnd);
}
function showEnd() {
  let frame = null;
  try {
    const rt = new THREE.WebGLRenderTarget(320, 240), cam = new THREE.PerspectiveCamera(80, 4 / 3, 0.05, 30); cam.layers.enable(1);
    cam.position.copy(VENT_CAM); cam.lookAt(-0.6, 0.6, -0.8);
    const restore = applyOv({ lump: true, chair: CHAIR_VENT, vent: 'floor', door: 1.25, dark: true, imprint: false });
    const hi = L.hemi.intensity; L.hemi.intensity = 2.1; L.feed.intensity = 3.0; O.screen.material = tvDummy;
    renderer.setRenderTarget(rt); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, cam);
    const buf = new Uint8Array(320 * 240 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 320, 240, buf);
    O.screen.material = tvMat; L.hemi.intensity = hi; L.feed.intensity = 0; restore(); renderer.setRenderTarget(null); rt.dispose();
    const c = document.createElement('canvas'); c.width = 320; c.height = 240; const g = c.getContext('2d'); const img = g.createImageData(320, 240);
    for (let y = 0; y < 240; y++) for (let x = 0; x < 320; x++) { const si = ((239 - y) * 320 + x) * 4, di = (y * 320 + x) * 4; const l = (Math.pow(buf[si] / 255, 0.45) * 0.3 + Math.pow(buf[si + 1] / 255, 0.45) * 0.59 + Math.pow(buf[si + 2] / 255, 0.45) * 0.11) * 255 * 1.2; const n = (Math.random() - 0.5) * 40; img.data[di] = clamp(l * 0.86 + n, 0, 255); img.data[di + 1] = clamp(l + n, 0, 255); img.data[di + 2] = clamp(l * 1.03 + n, 0, 255); img.data[di + 3] = 255; }
    g.putImageData(img, 0, 0); for (let y = 0; y < 240; y += 3) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, 320, 1); }
    g.font = `20px ${FONT_OSD}`; g.fillStyle = '#eee'; g.fillText(`${fmtClock(S.clock + 3)} AM`, 236, 228); g.fillStyle = '#7dff8a'; g.font = `30px ${FONT_OSD}`; g.fillText('13', 12, 30);
    frame = c.toDataURL('image/jpeg', 0.82);
  } catch (e) { console.warn(e); }
  finishRoom(frame);
}

/* ---------------- room module ---------------- */
const ROOM406 = {
  id: '406', title: 'Dead Air', saveKey: 'lethe.room406.v1',
  DOCS, ITEMS, HEARD, HINTS, openDoc, inspectItem, dropCarried, stepDown,
  toggleCrouch() { if (G.onChair || G.carrying || G.cutscene) return; G.crouch = !G.crouch; G.eyeT = G.crouch ? 0.55 : 1.62; },
  toggleFlash() { if (!has('flashlight')) return; G.flashOn = !G.flashOn; sClick(null, 0.35, 2200); },
  onPanelClose() {},
  update: roomUpdate,
  preRender: renderFeed,
  build() { makeTextures(); makeMaterials(); buildRoom(); makeTV(); registerInteractions(); },
  defaults, applyState, startAmbience, penalty,
  spawn: { x: 0.15, z: -1.55, yaw: Math.atan2(-0.55, -0.83) },
  markSkip: ['start', 'early'], markMerge: { early: 'padlock' },
  invHidden: id => id === S.vcr,
  invNote: id => S.vcr === id ? ' <span class="muted">(in the VCR)</span>' : '',
  backText: 'Back in Room 406.',
  keys: [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Other action', 'R or right-click'], ['Run', 'Shift'], ['Crouch', 'C'], ['Flashlight', 'F'], ['Step down', 'Space'], ['Notebook', 'Tab'], ['Hints', 'H']],
  wake() {
    P.x = ROOM.spawn.x; P.z = ROOM.spawn.z; G.yaw = ROOM.spawn.yaw; G.pitch = 0.6; G.eye = 0.9; G.eyeT = 0.9;
    G.cutscene = true; $('#fx').className = 'lids';
    tween(3.4, k => { G.pitch = lerp(0.6, -0.06, k); });
    after(1.3, () => subtitle('', '<i>You wake on top of the covers in a motel room. You don\'t remember lying down.</i>', 5200));
    after(2.1, () => { G.eyeT = 1.62; sStep(0.2); });
    after(3.7, () => { G.cutscene = false; $('#fx').className = ''; flag('woke'); updatePrompt(true); toast(ctrlHint(), 7000); });
  },
  titleFx: null,
  touchExtras: () => has('flashlight') ? [{ label: G.flashOn ? 'Flashlight off' : 'Flashlight', run: () => ROOM406.toggleFlash() }] : [],
};

