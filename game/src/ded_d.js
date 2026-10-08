/* =====================================================================
   DEDUSHKA · part D: painted things (the icon, the photographs, the clock's face, his face),
   items, the one letter you read, what you heard, hints, voices
   ===================================================================== */
function paintThings() {
  // the icon in the corner: gold gone brown, a figure in a red cloak, the varnish crazed
  T.icon = tex(canv(220, 280, (c, W2, H2) => {
    const gr = c.createLinearGradient(0, 0, W2, H2); gr.addColorStop(0, '#9a7a3a'); gr.addColorStop(0.5, '#c8a050'); gr.addColorStop(1, '#7a5a28'); c.fillStyle = gr; c.fillRect(0, 0, W2, H2);
    c.strokeStyle = '#3a2410'; c.lineWidth = 8; c.strokeRect(6, 6, W2 - 12, H2 - 12);
    c.fillStyle = 'rgba(230,200,110,.9)'; c.beginPath(); c.arc(W2 / 2, 92, 46, 0, TAU); c.fill(); c.strokeStyle = '#7a4a18'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#7a1c18'; c.beginPath(); c.moveTo(W2 / 2 - 70, H2 - 20); c.quadraticCurveTo(W2 / 2 - 60, 120, W2 / 2, 112); c.quadraticCurveTo(W2 / 2 + 60, 120, W2 / 2 + 70, H2 - 20); c.fill();
    c.fillStyle = '#1c2a4a'; c.beginPath(); c.moveTo(W2 / 2 - 30, H2 - 20); c.lineTo(W2 / 2 - 18, 150); c.lineTo(W2 / 2 + 18, 150); c.lineTo(W2 / 2 + 30, H2 - 20); c.fill();
    c.fillStyle = '#b88a5a'; c.beginPath(); c.ellipse(W2 / 2, 92, 22, 28, 0, 0, TAU); c.fill();
    c.fillStyle = '#3a2214'; c.fillRect(W2 / 2 - 12, 86, 8, 3); c.fillRect(W2 / 2 + 4, 86, 8, 3); c.fillRect(W2 / 2 - 1.5, 90, 3, 12); c.fillRect(W2 / 2 - 7, 108, 14, 2);
    c.fillStyle = '#e8d8b0'; c.font = 'bold 13px serif'; c.fillText('IC', 30, 60); c.fillText('XC', W2 - 54, 60);
    for (let i = 0; i < 160; i++) { c.strokeStyle = 'rgba(30,20,10,.35)'; c.lineWidth = 0.6; const x = Math.random() * W2, y = Math.random() * H2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30); c.stroke(); }
    const vg = c.createRadialGradient(W2 / 2, H2 / 2, 40, W2 / 2, H2 / 2, W2); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,4,.6)'); c.fillStyle = vg; c.fillRect(0, 0, W2, H2);
  }));
  // the family in one frame: a wedding, a soldier, a group by a haystack, a boy and his grandmother
  const sepia = (c, x, y, w, h, draw) => { c.save(); c.translate(x, y); c.fillStyle = '#e8dcc0'; c.fillRect(-4, -4, w + 8, h + 8); const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#b8a078'); gr.addColorStop(1, '#8a7050'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.beginPath(); c.rect(0, 0, w, h); c.clip(); draw(c, w, h); speckle(c, w, h, 300, 0.25, '60,40,20', 2); const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,24,10,.55)'); c.fillStyle = vg; c.fillRect(0, 0, w, h); c.restore(); };
  const person = (c, x, y, s, dark = '#3a2a1a', head = '#c8a880') => { c.fillStyle = dark; c.beginPath(); c.moveTo(x - 14 * s, y + 60 * s); c.lineTo(x - 11 * s, y + 14 * s); c.quadraticCurveTo(x, y + 6 * s, x + 11 * s, y + 14 * s); c.lineTo(x + 14 * s, y + 60 * s); c.fill(); c.fillStyle = head; c.beginPath(); c.arc(x, y, 8 * s, 0, TAU); c.fill(); };
  T.photos = tex(canv(500, 380, (c, W2, H2) => {
    c.fillStyle = '#2a1e14'; c.fillRect(0, 0, W2, H2);
    sepia(c, 20, 20, 140, 180, (g, w, h) => { person(g, w * 0.36, h * 0.3, 1.6, '#2a1c10'); person(g, w * 0.64, h * 0.32, 1.5, '#e8e0d0', '#c8a888'); g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(w * 0.64, h * 0.2, 16, 10, 0, 0, TAU); g.fill(); });
    sepia(c, 180, 20, 120, 160, (g, w, h) => { person(g, w / 2, h * 0.3, 1.7, '#4a4a32'); g.fillStyle = '#4a4a32'; g.fillRect(w / 2 - 14, h * 0.3 - 18, 28, 7); g.fillStyle = '#c03a2a'; g.beginPath(); g.arc(w / 2, h * 0.3 - 15, 2.5, 0, TAU); g.fill(); g.fillStyle = '#2a1c10'; g.font = '11px serif'; g.fillText('1941', 8, h - 8); });
    sepia(c, 320, 20, 160, 110, (g, w, h) => { g.fillStyle = '#9a8a60'; g.beginPath(); g.moveTo(10, h); g.quadraticCurveTo(50, 10, 90, h); g.fill(); for (let i = 0; i < 6; i++) person(g, 70 + i * 15, h * 0.42, 0.75, i % 2 ? '#3a2a1a' : '#e0d4b8'); });
    // the one of you: eight years old, at the porch of this house, holding her hand
    sepia(c, 330, 150, 150, 210, (g, w, h) => { g.fillStyle = '#6a5a40'; g.fillRect(0, h * 0.15, w, h * 0.5); for (let y = h * 0.15; y < h * 0.65; y += 10) { g.fillStyle = 'rgba(40,28,16,.4)'; g.fillRect(0, y, w, 2); } g.fillStyle = '#8a7a5a'; g.fillRect(w * 0.6, h * 0.25, 30, 34); person(g, w * 0.35, h * 0.42, 1.25, '#2a2018', '#c8a880'); g.fillStyle = '#4a4040'; g.beginPath(); g.ellipse(w * 0.35, h * 0.42 - 3, 11, 9, 0, Math.PI, 0); g.fill(); person(g, w * 0.62, h * 0.6, 0.75, '#e0d8c8', '#d8b890'); g.fillStyle = '#2a1c10'; g.font = 'italic 12px serif'; g.fillText('Митя, 1957', 8, h - 10); });
    sepia(c, 20, 220, 290, 140, (g, w, h) => { g.fillStyle = '#7a6a48'; g.fillRect(0, h * 0.55, w, h); g.fillStyle = '#5a4a32'; for (let i = 0; i < 4; i++) { const x = 30 + i * 70; g.fillRect(x, h * 0.25, 46, 40); g.beginPath(); g.moveTo(x - 6, h * 0.25); g.lineTo(x + 23, h * 0.05); g.lineTo(x + 52, h * 0.25); g.fill(); } g.fillStyle = '#c8b890'; g.fillRect(0, h * 0.85, w, 3); g.fillStyle = '#2a1c10'; g.font = '11px serif'; g.fillText('Каменка', 8, h - 8); });
  }));
  // the clock face: painted tin, roses at the top
  T.clockFace = tex(canv(220, 220, (c, W2, H2) => {
    c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#c8b890'; c.beginPath(); c.arc(W2 / 2, H2 / 2, 96, 0, TAU); c.fill(); c.fillStyle = '#f0e8d4'; c.beginPath(); c.arc(W2 / 2, H2 / 2, 90, 0, TAU); c.fill();
    c.fillStyle = '#1a1a1a'; c.font = 'bold 16px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; R.forEach((r, i) => { const a = i / 12 * TAU - Math.PI / 2; c.fillText(r, W2 / 2 + Math.cos(a) * 74, H2 / 2 + Math.sin(a) * 74); });
    for (const [x, y] of [[W2 / 2 - 22, 66], [W2 / 2 + 22, 66], [W2 / 2, 58]]) { c.fillStyle = '#b02a2a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + Math.cos(k * 1.26) * 6, y + Math.sin(k * 1.26) * 6, 6, 0, TAU); c.fill(); } c.fillStyle = '#3a6a3a'; c.beginPath(); c.ellipse(x + 10, y + 8, 7, 3, 0.5, 0, TAU); c.fill(); }
    speckle(c, W2, H2, 900, 0.18, '60,40,20', 2);
  }));
  // his face: grey, old beyond old, with deep-set eyes; painted for a sphere, front at u = 0.25
  T.dedFace = tex(canv(512, 256, (c, W2, H2) => {
    c.fillStyle = '#4a4038'; c.fillRect(0, 0, W2, H2);
    const fx = W2 * 0.25, fy = H2 * 0.52;
    const sk = c.createRadialGradient(fx, fy, 6, fx, fy, 90); sk.addColorStop(0, '#8a7262'); sk.addColorStop(0.7, '#6a564a'); sk.addColorStop(1, '#4a3e36'); c.fillStyle = sk; c.fillRect(fx - 100, 0, 200, H2);
    // wrinkles
    c.strokeStyle = 'rgba(50,34,26,.55)'; c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(fx - 40, fy - 52 + i * 5); c.quadraticCurveTo(fx, fy - 58 + i * 5, fx + 40, fy - 52 + i * 5); c.stroke(); }
    for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(fx + s * 30, fy - 10 + i * 3); c.lineTo(fx + s * (44 + i * 2), fy - 16 + i * 6); c.stroke(); } c.beginPath(); c.moveTo(fx + s * 12, fy + 6); c.quadraticCurveTo(fx + s * 26, fy + 24, fx + s * 20, fy + 40); c.stroke(); }
    // sockets, eyes
    for (const s of [-1, 1]) { const ex = fx + s * 20, ey = fy - 12; const so = c.createRadialGradient(ex, ey, 2, ex, ey, 16); so.addColorStop(0, 'rgba(20,12,8,.95)'); so.addColorStop(1, 'rgba(40,28,20,0)'); c.fillStyle = so; c.beginPath(); c.arc(ex, ey, 16, 0, TAU); c.fill(); c.fillStyle = '#c8b8a0'; c.beginPath(); c.ellipse(ex, ey, 5, 3, 0, 0, TAU); c.fill(); c.fillStyle = '#1a1410'; c.beginPath(); c.arc(ex, ey, 2.4, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(210,200,186,.9)'; c.lineWidth = 2.2; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(ex - s * 10 + i * s * 2.5, ey - 9); c.lineTo(ex - s * 14 + i * s * 3, ey - 15 - Math.random() * 5); c.stroke(); } }
    // the nose
    c.fillStyle = '#9a7a68'; c.beginPath(); c.moveTo(fx - 4, fy - 6); c.quadraticCurveTo(fx - 13, fy + 18, fx - 9, fy + 22); c.quadraticCurveTo(fx, fy + 27, fx + 9, fy + 22); c.quadraticCurveTo(fx + 13, fy + 18, fx + 4, fy - 6); c.fill(); c.fillStyle = 'rgba(30,20,14,.7)'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(fx + s * 5, fy + 21, 3, 2, 0, 0, TAU); c.fill(); }
    // moustache and beard, grey
    for (let i = 0; i < 260; i++) { const a = Math.random(); const x0 = fx + (Math.random() - 0.5) * 70, y0 = fy + 26 + Math.random() * 6; c.strokeStyle = `rgba(${170 + Math.random() * 50},${164 + Math.random() * 50},${150 + Math.random() * 40},.75)`; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (Math.random() - 0.5) * 20, y0 + 30 + Math.random() * 60); c.stroke(); }
    for (let i = 0; i < 120; i++) { const x0 = fx + (Math.random() - 0.5) * 140, y0 = Math.random() * fy * 0.55; c.strokeStyle = 'rgba(190,182,170,.55)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (Math.random() - 0.5) * 16, y0 + 20 + Math.random() * 20); c.stroke(); }
  }));
  T.dedFace.wrapS = THREE.RepeatWrapping;
}

/* ---------------- items ---------------- */
const ITEMS = {
  torch: { name: 'Your torch', short: 'Torch', desc: 'A flat battery torch from the hardware shop in Ust-Ilimsk. The battery is going: the light is yellow and weak. F turns it on and off.' },
  bread: { name: 'A loaf of black bread', short: 'Bread', desc: 'Rye bread from the bakery by the hospital, wrapped in newspaper. You brought it because Babushka said to.' },
  letter: { name: 'Babushka\'s letter', short: 'Letter', doc: 'letter' },
  thread: { name: 'A reel of red thread', short: 'Red thread', desc: 'Red cotton thread on a wooden reel, from her sewing tin.' },
  matches: { name: 'Matches', short: 'Matches', desc: 'A box of matches with a picture of a rocket on it. Your box: there\'s the corner you tore.' },
  bark: { name: 'A curl of birch bark', short: 'Birch bark', desc: 'Papery, oily, white outside and pink inside. It catches from a single match, and burns hot enough to start a stove.' },
  tools: { name: 'Caulking iron and mallet', short: 'Caulking tools', desc: 'Grandfather\'s: a flat iron blade for driving oakum into a seam, and a round wooden mallet worn pale where he held it.' },
  oakum: { name: 'A hank of oakum', short: 'Oakum', desc: 'Loose tarred hemp fibre that smells of pine resin. Driven into a seam and tarred over, it keeps the river out.' },
  shoe: { name: 'Babushka\'s bast shoe', short: 'Bast shoe', desc: 'An old woven lapot, plaited from lime bark, with a red woollen tie wound round it. It\'s light, and dry, and very old.' },
};
const HOLD_SHORT = { wood: 'Logs (in hand)', tar: 'Tar pot (in hand)', oar1: 'Oar (in hand)', oar2: 'Oar (in hand)', pot: 'Clay pot (in hand)', basket: 'Basket (in hand)', ladder: 'Ladder (in hand)', roller0: 'Log (in hand)', roller1: 'Log (in hand)', hook: 'Boat hook (in hand)' };
const HOLD_NAMES = { wood: 'An armful of birch logs', tar: 'The tar pot', oar1: 'An oar', oar2: 'The other oar', pot: 'The clay pot', basket: 'Babushka\'s basket', ladder: 'The ladder', roller0: 'A round log', roller1: 'A round log', hook: 'The boat hook' };

/* ---------------- what you heard ---------------- */
const HEARD = {
  b1: { title: 'Babushka, in the hospital, yesterday', text: '"Mitenka, bring Dedushka. Don\'t leave him to burn."' },
  b2: { title: 'Babushka, yesterday', text: '"If he hides something, don\'t swear at him. Tie a red thread to the table leg and say: domovoi, domovoi, play with it and give it back."' },
  b3: { title: 'Babushka, yesterday', text: '"And go out of the room. He doesn\'t like being watched."' },
  b4: { title: 'Babushka, yesterday', text: '"He always looks like the master of the house, you know."' },
  men: { title: 'Men in the lane', text: '"Number twelve, light it!" "Come on, lads, the water won\'t wait!" "Fourteen\'s next!"' },
  ded: { title: 'Close by, in the dark', text: '"Master."' },
};

/* ---------------- the letter ---------------- */
function letterPage() {
  const f = S.flags, ck = on => `<span class="dl-ck">${on ? '✓' : ''}</span>`;
  return `<div class="dl-head">Митенька!</div>
    <p class="dl-p">Mitenka, my dear. Do it the old way, the way my mother did when we came to Kamenka.</p>
    <ul class="dl-l">
      <li>${ck(f.stoveLit)}Light the stove. He won't leave a cold house.</li>
      <li>${ck(f.basketPot)}Put embers from it in the clay pot, and the pot in my basket.</li>
      <li>${ck(f.basketShoe && f.basketBread)}Put bread in my old bast shoe, the one with the red tie. It hangs in the attic with the others. Put the shoe in the basket too.</li>
      <li>${ck(f.ritual)}Set the basket on the stove and ask him nicely: <i>«Dedushka, come with us to the new house.»</i></li>
      <li>${ck(f.escaped)}Carry him over the water. Don't put him down till you're across.</li>
    </ul>
    <p class="dl-p">If he hides something from you, don't swear at him. Tie a red thread round the table leg, ask him to give it back, and go out.</p>
    <p class="dl-p">Grandfather's boat is on the bank, and the oars are in the barn. Mind the seam: he caulked her every spring with oakum and hot tar.</p>
    <p class="dl-sig">Твоя баба Дуня<span>Your Baba Dunya</span></p>`;
}
const DOCS = {
  letter: { title: 'Babushka\'s letter', style: 'dedletter', pages: () => [letterPage()], onRead: () => { if (!S.flags.letterRead) flag('letterRead'); } },
};

/* ---------------- hints ---------------- */
const HINTS = [
  { id: 'start', title: 'What Babushka asked', when: s => !s.flags.woke ? 'hidden' : s.flags.letterRead ? 'solved' : 'open', tiers: [
    'Her letter is in your pocket.',
    `Open the notebook (${'Tab'}) and read Babushka\'s letter.`] },
  { id: 'matches', title: 'Your matches', when: s => !s.flags.matchesMissing ? 'hidden' : s.flags.matchesBack ? 'solved' : 'open', tiers: [
    'Babushka told you what to do when he hides something. It\'s in her letter too.',
    'You need something red to tie, and the table in the icon corner. Her sewing tin is on the middle windowsill.',
    'Tie the red thread round a leg of the table and ask him to give them back. Then go out into the seni for a moment.',
    'Take the red thread from the sewing tin on the middle windowsill. At the table, tie it round the leg nearest the room and choose Ask him to give it back. Go out through the door into the seni, then come back in: your matches are on the table.'] },
  { id: 'stove', title: 'Lighting the stove', when: s => !(s.flags.letterRead || s.flags.matchesBack) ? 'hidden' : s.flags.stoveLit ? 'solved' : 'open', tiers: [
    'A Russian stove needs wood, something that catches from a match, and a clear chimney.',
    'The firewood is stacked under the barn\'s eaves. Birch bark catches from a match: there\'s a birch log by the chopping block.',
    'Take the iron door off the oven mouth and put the wood and the bark in. Before you light it, open the damper high on the chimney: you\'ll need to stand on the step beside the stove to reach it.',
    'Take an armful from the woodpile, and a curl of bark from the birch log by the chopping block. At the stove, lift the iron door off the mouth, put the wood in, then the bark. Climb onto the step at the side of the stove and open the little iron damper door on the chimney. Then light it with the matches.'] },
  { id: 'oar1', title: 'An oar in the barn', when: s => !s.flags.barnSeen ? 'hidden' : s.flags.oar1Taken ? 'solved' : 'open', tiers: [
    'One oar is lying across the crossbeams overhead, a few steps inside the barn door.',
    'It\'s too high to reach from the floor. You need something to stand on.',
    'There\'s a crate in the barn you can drag.',
    `Grab the crate (E) and walk it under the oar on the beams, let go, jump onto it (${'Space'}) and take the oar.`] },
  { id: 'patch', title: 'The split seam', when: s => !s.flags.boatSeen ? 'hidden' : s.flags.tarred ? 'solved' : 'open', tiers: [
    'Her letter says to mind the seam: Grandfather caulked her every spring with oakum and hot tar.',
    'Caulking is hammering oakum into the split, then sealing it with hot tar. The oakum and the tar are in the barn; the caulking tools are in the seni.',
    'Hammer the oakum in with the caulking iron and mallet. The tar has set hard in its pot: warm it in the lit stove before you brush it on.',
    'Take the hank of oakum from the nail by the barn\'s workbench, and the caulking iron and mallet from the tool tray on the bench in the seni. Hammer the oakum into the seam on her upturned bottom (four blows). Put the tar pot into the lit stove, wait until it\'s runny, carry it out and brush it over the seam.'] },
  { id: 'shoe', title: 'Her bast shoe', when: s => !s.flags.letterRead ? 'hidden' : s.flags.shoeFound ? 'solved' : 'open', tiers: [
    'Her letter says the shoe hangs in the attic with the others.',
    'The hatch at the top of the ladder in the seni is bolted from above. There\'s another way into the attic.',
    'The little window in the gable at the back of the house. There\'s a ladder lying by the barn.',
    'Pick up the ladder lying by the barn and carry it round to the back of the house. Set it against the gable under the little window and climb up into the attic. Her shoe is the one with the red woollen tie, hanging from the pole under the ridge.'] },
  { id: 'oar2', title: 'The other oar', when: s => !(s.flags.pegsSeen || s.flags.oar1Taken) ? 'hidden' : s.flags.oar2Taken ? 'solved' : 'open', tiers: [
    'There were two oars. Somebody has taken the other one.',
    'Babushka told you what to do when he hides something.',
    'Ask him again at the table leg with the red thread, and go out. When you come back in, listen, and look at the floor.',
    'At the table leg, choose Ask him to give it back, and go out. When you come back the chest has been dragged over the cellar hatch: drag it off, open the hatch and climb down. The oar is in the cellar, beside his nest.'] },
  { id: 'launch', title: 'Into the water', when: s => !s.flags.tarred ? 'hidden' : (s.flags.launched && (s.oarsIn || 0) >= 2) ? 'solved' : 'open', tiers: [
    'She has to be the right way up, down at the water, with both oars in her.',
    'She\'s too heavy to lift. The boat hook leaning on the fence will lever her over.',
    'Roll her down on logs: there are two round ones in the grass near her. Lay them in front of her bow and push.',
    'Take the boat hook from the west fence and lever her over. Carry the two round logs from the grass and lay them in front of her bow, one at a time. Push her down to the water. Then put both oars in her.'] },
  { id: 'basket', title: 'Dedushka\'s basket', when: s => !s.flags.stoveLit ? 'hidden' : s.flags.ritual ? 'solved' : 'open', tiers: [
    'Follow her letter: embers in the pot, bread in the shoe, both in her basket, then ask him at the stove.',
    'The clay pot is on the bottom shelf behind the curtain in the kitchen corner. Wait for the stove to burn down to embers.',
    'Rake embers into the clay pot. Put the pot, and the shoe with bread in it, into her basket. Set the basket on the stove and ask him.',
    'Take the clay pot from the bottom shelf behind the curtain and rake embers into it at the oven mouth. At the basket on the bench by the table, put in the shoe, then the bread, then the pot. Carry the basket to the stove and choose Ask him.'] },
  { id: 'out', title: 'Getting out', when: s => !s.flags.ritual ? 'hidden' : s.flags.escaped ? 'solved' : 'open', tiers: [
    'The house is on fire. Get to the boat.',
    'The smoke is thickest up high. Keep low.',
    'Don\'t put the basket down. Out through the seni and the porch, down through the garden to the landing.',
    'Crouch to stay under the smoke and go out through the seni and the porch. Walk down to the landing, step into the boat and push off.'] },
];

/* ---------------- voices ---------------- */
function line(id, who, text, opts = {}) { return say(who, text, Object.assign({ clip: 'dd_' + id }, opts)); }
const BABA = 'Babushka', MITYA = 'You', MEN = 'A man in the lane';
const look = (txt, ms = 5600) => ({ label: 'Look', run: () => subtitle('', `<i>${txt}</i>`, ms) });
const sayI = (txt, ms = 5600) => subtitle('', `<i>${txt}</i>`, ms);
function heard(id) { if (!S.heard.includes(id)) { S.heard.push(id); save(); } }
function drop(id) { S.inv = S.inv.filter(i => i !== id); renderInv(); save(); }
