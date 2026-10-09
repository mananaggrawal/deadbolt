/* =====================================================================
   SERIES — one new mystery a day, the same for everyone. A home page lists
   them all; each has its own title screen, game and end page. Replays are
   allowed, and your first escape is the result that counts.
   ===================================================================== */
const SERIES = { name: 'Deadbolt', tagline: 'A new horror escape room every day. The same room for everybody.' };
// Add each new mystery here with the local date it opens. Dates are compared in the player's own time zone.
const MYSTERIES = [
  { n: 1, id: '406', title: 'Dead Air', date: '2026-09-26', place: 'Pinecrest Motor Lodge', era: '30 October 1983', mins: '20–30 min', theme: 'tv',
    osd: 'CH 13 <span class="rec">&#9679; REC</span>',
    hook: 'You wake on top of the covers in Room 406 with no memory of checking in. The door is padlocked from the inside. The television is off. For now.',
    tagline: 'A motel room in 1983. The television shows the room three minutes from now, and you are never in the picture.',
    start: 'Check in', loading: 'Tuning in…', endTitle: 'Checked out', endCaption: 'Channel 13, three minutes from now', frame: 'tv',
    endAlt: 'The last picture on channel 13: Room 406 seen from the vent, the door open and someone asleep on the bed.',
    epilogue: 'You step into a corridor longer than the building. Behind you, the television switches itself on. On channel 13 the room is already the way it will be in three minutes: the door open, the chair under the vent, and someone asleep on top of the covers.' },
  { n: 2, id: 'lamp', title: 'The Lamp Room', date: '2026-09-27', place: 'Skerrow Rock Light', era: '21 December 1911', mins: '20–30 min', theme: 'lamp',
    osd: 'Skerrow Rock <span class="flash" aria-hidden="true">&#10022;</span> Gp Fl (3) 20s',
    hook: 'You wake on the iron floor of a lighthouse lamp room, twenty miles out to sea, on the longest night of the year. The lamp is out. The hatch to the stairs is padlocked from your side, and something is climbing the tower.',
    tagline: 'A lighthouse in 1911, on the longest night. Keep the light turning, or they come up out of the sea.',
    start: 'Take the watch', loading: 'Trimming the wick…', endTitle: 'Relieved', endCaption: 'Skerrow Rock, from the relief boat', frame: 'photo',
    endAlt: 'Skerrow Rock lighthouse at first light, seen from the sea. The lamp is lit, and three figures in oilskins stand in the lamp room.',
    epilogue: 'You go down a hundred and forty steps in the dark with the key still in your fist, and nothing touches you. The relief boat takes you off the landing at first light. As it pulls away you look back. The light is still turning, and up in the lamp room three men in oilskins are standing at the glass, watching you go. Nobody on the boat will say who is keeping it now.' },
  { n: 3, id: 'sitting', title: 'The Last Sitting', date: '2026-09-28', place: '9 Pellam Street, Bloomsbury', era: '3 March 1893', mins: '25–40 min', theme: 'sitting',
    osd: '<span class="cc">Madame Ada Kell</span><span class="cc2">Clairvoyante &middot; sittings Fridays at nine</span>',
    tagline: 'A medium\'s parlour in 1893. Every ghost in it is a trick, and you have to work out how each one is done. All but one.',
    hook: 'London, 1893. You investigate fake mediums for the Society for Psychical Research. After tonight\'s sitting you hid in Madame Kell\'s parlour to catch her out. She has locked you in, turned down the gas, and left you a note.',
    start: 'Take your seat', loading: 'Dimming the gas…', endTitle: 'Exposed', endCaption: 'The last plate in the camera, 3 March 1893', frame: 'cabinet',
    endAlt: 'A sepia photograph of the parlour taken from the camera: the empty table, the door open, and a pale little girl in a white dress standing beside Madame\'s chair with her hands folded.',
    epilogue: 'Your report runs to eleven pages: the pedal, the flap, the paint, the phonograph, the plates and the rod. Madame Kell never gives another sitting. The report leaves out one thing. The camera took a picture as you opened the door, and you developed it yourself. There you are, a dark blur in the doorway. The table is empty. And beside Madame\'s chair, with her hands folded, stands a little girl in a white dress. She is looking straight at the camera, as if she had been waiting a long time for somebody to take her picture.' },
  { n: 4, id: 'night', title: 'Night Mail', date: '2026-09-29', place: 'Kasheli Ghat, Western Ghats', era: '29 September 2026', mins: '25–35 min', theme: 'night',
    osd: '<span class="dv">काशेली घाट</span><span class="en">KASHELI GHAT</span><span class="ht">HT. ABOVE M.S.L. 562.45 M</span>',
    tagline: 'The last carriage of a night train, tonight. It keeps going through the same tunnel, and the man on the track behind you is closer every time.',
    hook: 'You rented an old railway saloon for a night ride over the ghats, and fell asleep at Karjat. You wake at twenty to three. The door to the rest of the train is locked. The train goes into a tunnel, and comes out at the same tunnel again. And every time it comes out, the man standing on the track behind you is closer.',
    start: 'Wake up', loading: 'Coupling up…', endTitle: 'Uncoupled', endCaption: 'Saloon No. 9, as the survey party found it', frame: 'photo',
    endAlt: 'A faded expedition photograph of the saloon lying in the ravine: teak walls furred with moss, ferns growing up through the floor, the desk by the back windows, and grey daylight in the glass.',
    epilogue: 'The Night Mail runs into Lonavala at ten past four, one carriage short, and nobody can say which one. The attendant swears there was never a saloon. The guard\'s journal lists none. Three weeks later a survey party climbs down into the ravine below the Horseshoe Curve and finds Inspection Saloon No. 9 where it fell in 1926: full of ferns, its handbrake screwed hard on. In the desk is a register that should have rotted to nothing. The last line is dated tonight, and it is in your handwriting. It says: Got out.' },
  { n: 5, id: 'lift', title: 'Doors Closing', date: '2026-09-29', place: 'Cheongun Building, Euljiro, Seoul', era: '17 December 2004', mins: '25–35 min', theme: 'lift',
    osd: '<span class="ar">&#9650;</span><span class="fl">10</span><span class="kr">문이 닫힙니다</span>',
    tagline: 'A Seoul office lift, 2004, and the Elevator Game. Press the buttons in the right order, alone. When a woman gets on at the fifth floor, don\'t look at her.',
    hook: 'A week ago your sister Ji-yeon played the Elevator Game in the lift of her office building: four, two, six, two, ten, five, then one. The camera in the car shows it going up. It never brought her back down. Tonight you press the same buttons. When a woman gets on at the fifth floor, don\'t look at her.',
    start: 'Step in', loading: 'Calling the lift…', endTitle: 'Walked out', endCaption: 'CAM 03 · 1F lobby · 02:31', frame: 'cctv',
    endAlt: 'A grainy black-and-white security camera frame of the building lobby at night: the lift standing open and lit, and in its mirror a young woman in a grey suit standing in the corner, facing the wall.',
    epilogue: 'You walk until you reach the police box on Euljiro, and you never go back into the Cheongun Building. Nobody believes you, and after a while you stop telling it. The building comes down in 2011. On its last night the guard writes in his log that the lift went up to the tenth floor at 2:13 a.m. with nobody in it, and came back down with its doors open. The camera in the car shows a young woman in a grey suit standing in the corner, facing the wall. She is still waiting for somebody to look at her.' },
  { n: 6, id: 'tik', title: 'Tik-Tik', date: '2026-10-07', place: 'Barrio San Isidro, Infanta, Quezon', era: '20 October 1979', mins: '20–30 min', theme: 'tik',
    osd: '<span class="br">Brgy. San Isidro</span><span class="pr">Infanta &middot; Quezon</span>',
    hook: 'Typhoon night, two in the morning, in a house on stilts. Your sister Lorna is in labour behind the mosquito net, and Nanay went for the midwife hours ago. Something with wings is circling the house. Its legs are standing somewhere on your land. Salt them before dawn.',
    tagline: 'A stilt house in a typhoon, 1979. Something with wings hunts you across the yard. Find where she left her legs, and salt them before dawn.',
    start: 'Wake up', loading: 'Barring the door…', endTitle: 'First light', endCaption: 'The yard from the gate, 6:04 a.m.', frame: 'photo',
    endAlt: 'A faded colour snapshot at dawn: the stilt house seen through the open gate in grey morning light, and in the mud of the yard a dark shape with broken wings, still smoking.',
    wrongLabel: 'Times caught', wrongWords: ['time caught', 'times caught'],
    epilogue: 'The neighbours come when the rain stops. They find you at the gate with Tatay\'s bolo across your knees, and a thing in the mud that they cover with banana leaves before anyone can see its face. Under the house there is a pair of legs in Nanay\'s good skirt, the navy one with the little white flowers, folded at the knees as if she had knelt to pray. Lorna\'s daughter was born as the sun came up. She is forty-six now. Everyone says she has her grandmother\'s eyes. She has never once eaten garlic.' },
  { n: 7, id: 'tio', title: 'El Tío', date: '2026-10-07', place: 'Cerro Rico, Potosí', era: '31 July 1998', mins: '25–35 min', theme: 'tio',
    osd: '<span class="bm">BOCAMINA SANTA RITA</span><span class="nv">NIVEL 3 &middot; 4.200 m.s.n.m.</span>',
    hook: 'Potosí, 1998. On the afternoon mine tour you slipped a lump of silver from the Tío\'s offerings into your pocket while the guide\'s back was turned. The miners say everything inside the mountain belongs to him, and nothing leaves it unpaid. Then the mountain shook. You wake alone in the dark, deep inside the mine, with your lamp out and the way back full of rock. And the Tío\'s chair is empty.',
    tagline: 'A silver mine in the Bolivian Andes, 1998. You stole from the devil who owns the inside of the mountain. He only moves in the dark, and your lamp is running out.',
    start: 'Go down', loading: 'Charging the lamp…', endTitle: 'Paid in full', endCaption: 'The mine mouth, Santa Rita, 1 August 2026, 6:40 a.m.', frame: 'photo',
    endAlt: 'A colour photograph at dawn of a timber mine entrance in red rock, stained dark with old blood, a small wooden cross above it. On the left post, a sun-bleached poster reading DESAPARECIDO beside a bright new party flyer for August 2026. In the black of the tunnel, two glass eyes catch the light, and the tip of a cigarette glows.',
    wrongLabel: 'Times caught', wrongWords: ['time caught', 'times caught'],
    epilogue: 'The miner who finds you in the main tunnel stares at your carbide lamp as if it came out of a museum. Outside it is dawn, four thousand metres up and bitterly cold. On the timbers of the mine mouth there\'s a poster so bleached by the sun that you can hardly read it: DESAPARECIDO, the photograph from your passport, and a date, 31 July 1998. It is the first of August, 2026. You were in the mountain for one night. Don Teo is eighty-one now. When they bring him up the hill to see you, he looks at you for a long time without a word. Then he goes down into the mine on his own with a pack of cigarettes, to say thank you.' },
  { n: 8, id: 'ded', title: 'Dedushka', date: '2026-10-08', place: 'Kamenka, on the Angara, Siberia', era: '30 September 1974', mins: '30–40 min', theme: 'ded',
    osd: '<span class="kd">д. Каменка · дом № 14</span><span class="kx">СЖЕЧЬ · 1.X.74</span>',
    hook: 'Siberia, 1974. Your grandmother\'s island village is going under a new reservoir, and tonight the clearing brigade is burning it, house by house. From her hospital bed she made you promise to carry Dedushka, the spirit of her house, out of the old house in her bast shoe, the old way. You only meant to lie down for five minutes. It\'s twenty to three, the far end of the village is on fire, and something small in the house keeps hiding things.',
    tagline: 'A log house in a Siberian village on the night it burns, 1974. Carry the house spirit out the old way before the fire gets there. Something small keeps moving your things.',
    start: 'Wake up', loading: 'Lighting the stove…', endTitle: 'Across the water', endCaption: 'Clearance brigade photograph, Kamenka, 1 October 1974, 6:05 a.m.', frame: 'photo',
    endAlt: 'A grey official photograph from the riverbank at dawn: a log house burning, its roof alight, and out on the river a rowing boat with two figures in it, one rowing and a small one in the stern.',
    wrongLabel: 'Mistakes', wrongWords: ['mistake', 'mistakes'],
    epilogue: 'The brigade foreman\'s report says that house No. 14 caught by itself at a quarter to six, and that one boat was seen leaving the island with one person rowing. His photograph shows two. Babushka died that afternoon in her sleep in the hospital in Ust-Ilimsk, with her bast shoe on the blanket beside her. You took it home to the new flat on the ninth floor. The water covered Kamenka the next spring. You are seventy-seven now. Your grandchildren say a little old man lives behind the kitchen radiator, and that he looks just like you.' },
  { n: 9, id: 'sat', title: 'Saturation', date: '2026-10-09', place: 'Station Méduse, off Port Sudan', era: '3 March 1965', mins: '45–60 min', theme: 'sat',
    osd: '<span class="sm">STATION MÉDUSE · −30 M</span><span class="sd">MER ROUGE · 3.III.65</span>',
    hook: 'The Red Sea, 1965. Five French divers live in a steel station on the sea floor, thirty metres down; going up without days of decompression would kill them. Tonight four of you swam out to the wreck on the reef. You wake on the wet-room floor, soaked, with no mask and no tank. The others\' suits are back on the rack, dripping, but nobody is here. The bunk-room hatch is locked from the inside. And under the floor, something is knocking, in fours.',
    tagline: 'A station on the floor of the Red Sea, 1965. You wake alone after a night dive, and the crew have locked themselves in. Under the floor, something is knocking, in fours.',
    start: 'Come round', loading: 'Equalising…', endTitle: 'Hauled up', endCaption: 'The Aldébaran\'s deck, off Sha\'ab Suadi, 4 March 1965, 6:20 a.m.', frame: 'photo',
    endAlt: 'A black-and-white photograph on a ship\'s deck at dawn: an orange diving bell in its cradle, its round door hanging open, the inside empty and wet. Beside it, a shape under a tarpaulin with two bare feet showing. Wet bare footprints lead away from the bell toward the rail.',
    wrongLabel: 'Mistakes', wrongWords: ['mistake', 'mistakes'],
    epilogue: 'At twelve minutes past six on 4 March 1965 the crew of the Aldébaran saw the diving bell come up on its own, still sealed at thirty metres\' pressure, with a body clipped to its frame: Lucien Ferrand, twenty-four, lost on the wreck at sixty-one metres the evening before. The bell itself was empty. Its bench was wet, and there were wet footprints on its floor: bare feet, a man\'s. The four divers of Station Méduse came up that afternoon and spent three days in the deck chamber. None of them would talk about the night, except Jean Morel, who said only that Lucien had asked to be brought up, and that they had given him the key. Lucien was buried in Saint-Malo on 21 March. His mother kept his letters, and a page torn from a logbook with two words on the back.' },
];
const RES_KEY = 'lethe.results.v1', SEL_KEY = 'lethe.sel';
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function results() { const r = store.get(RES_KEY); return r && r.rooms ? r : { rooms: {}, lastEscapeDay: null }; }
function saveResult(id, r) { const all = results(); all.rooms[id] = r; all.lastEscapeDay = r.day; store.set(RES_KEY, all); }
const releasedMysteries = () => { const t = dayKey(); return MYSTERIES.filter(m => m.date <= t); };
const currentMystery = () => { const r = releasedMysteries(); return r[r.length - 1] || MYSTERIES[0]; };
const nextMystery = () => { const t = dayKey(); return MYSTERIES.find(m => m.date > t) || null; };
// a card click that needed a fresh page: which mystery to open once it has loaded
function takeSelection() {
  const s = store.get(SEL_KEY); store.del(SEL_KEY);
  if (!s || !s.id || !s.t || Date.now() - s.t > 10 * 60 * 1000) return null;
  return releasedMysteries().find(x => x.id === s.id) || null;
}
function reloadInto(id) { if (HOST.go(id)) return; if (id) store.set(SEL_KEY, { id, t: Date.now() }); else store.del(SEL_KEY); location.reload(); }

/* ---------- host bridge ----------
   On the self-hosted website, site/public/mr.js defines window.MR before this page boots: it
   tracks plays, syncs results to the player's account, makes share links and owns navigation
   (each room has its own URL; "home" is the landing page). Without window.MR (a single-file
   build opened anywhere else) every call below is a no-op and the game behaves as before. */
const HOST = {
  mr: () => (typeof window !== 'undefined' && window.MR && window.MR.v) ? window.MR : null,
  emit(name, data) { const mr = HOST.mr(); if (mr && mr.emit) try { mr.emit(name, data); } catch (e) {} },
  go(id) { const mr = HOST.mr(); if (!mr || !mr.go) return false; try { mr.go(id); return true; } catch (e) { return false; } },
};
// the ids of a room's puzzles, in order (the same filtering as puzzleMarks)
function markIds(room) {
  const skip = new Set(room.markSkip || []), merge = room.markMerge || {};
  return (room.HINTS || []).filter(h => !skip.has(h.id) && !(h.id in merge)).map(h => h.id);
}
// what the host polls to report progress: which puzzles are done, hints and wrong guesses so far
function hostState() {
  if (typeof ROOM === 'undefined' || !ROOM || typeof S === 'undefined' || !S) return null;
  const merge = ROOM.markMerge || {}, ids = markIds(ROOM), solved = [];
  for (const h of ROOM.HINTS || []) {
    let st = 'hidden'; try { st = h.when(S); } catch (e) {}
    if (st === 'solved') { const id = h.id in merge ? merge[h.id] : h.id; if (ids.includes(id) && !solved.includes(id)) solved.push(id); }
  }
  return { mode: G.mode, room: ROOM.id, built: !!(BUILT && BUILT.id === ROOM.id), elapsed: Math.round(S.elapsed || 0),
    hints: S.hints || 0, wrong: S.wrong || 0, tiers: Object.assign({}, S.hintTiers || {}), steps: ids, solved };
}
const statusOf = m => {
  const r = results().rooms[m.id], sv = store.get(`lethe.room${m.id}.v1`), prog = sv && sv.flags && sv.flags.woke && !sv.flags.escaped;
  return { r, prog };
};
function msUntilDay(dateStr) { const [y, mo, d] = dateStr.split('-').map(Number); return new Date(y, mo - 1, d) - new Date(); }
function fmtHMS(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

// one mark per puzzle for the play log (never shown to players): 0 solved alone, 1 took hints, 2 took the answer
function puzzleMarks(room, tiers) {
  const skip = new Set(room.markSkip || []), merge = room.markMerge || {};
  return room.HINTS.filter(h => !skip.has(h.id) && !(h.id in merge)).map(h => {
    let t = tiers[h.id] || 0;
    for (const from in merge) if (merge[from] === h.id) t = Math.max(t, tiers[from] || 0);
    return { title: h.title, lvl: t === 0 ? 0 : t >= h.tiers.length ? 2 : 1 };
  });
}
// what you send a friend: just that you got out (no time or hints)
function shareText(m) {
  return `I got out of ${m.title} on ${SERIES.name}. Can you?`;
}
let cdTimer = null;
function nextLine() {
  const nx = nextMystery();
  if (nx) return `<b>Mystery #${nx.n} opens in <span class="cd" data-to="${nx.date}">${fmtHMS(msUntilDay(nx.date))}</span></b>One new mystery a day, the same one for everybody.`;
  const n = MYSTERIES[MYSTERIES.length - 1].n + 1;
  return `<b>Mystery #${n} is on its way</b>When it's ready it opens at midnight, the same room for everybody. There's only ever one new one a day.`;
}
function tickCountdowns() {
  clearInterval(cdTimer);
  const upd = () => document.querySelectorAll('.cd').forEach(el => { el.textContent = fmtHMS(msUntilDay(el.dataset.to)); });
  upd(); cdTimer = setInterval(upd, 1000);
}

/* ---------- finishing a room (called by the room with its final picture) ---------- */
function finishRoom(frame) {
  G.mode = 'end'; releasePointer(); store.del(ROOM.saveKey);
  document.body.classList.remove('playing'); wakeLock(false);
  $('#hud').classList.add('hide');
  if (A.ready) { Object.values(A.loops).forEach(l => l && l.gain && l.gain.gain && l.gain.gain.setTargetAtTime(0, now(), 0.8)); }
  const m = MYSTERIES.find(x => x.id === ROOM.id);
  const tiers = Object.assign({}, S.hintTiers);
  const run = { day: dayKey(), time: S.elapsed, hints: S.hints, wrong: S.wrong, tiers, marks: puzzleMarks(ROOM, tiers), frame };
  const first = !results().rooms[ROOM.id];
  HOST.emit('room_escape', { room: ROOM.id, n: m.n, title: m.title, first, day: run.day, time: Math.round(run.time), hints: run.hints, wrong: run.wrong, tiers, marks: run.marks.map(x => x.lvl) });
  if (!first) showResult(m, run); else { saveResult(ROOM.id, run); showResult(m); }
}

/* ---------- the end page ---------- */
// replay: a later run, shown but not saved over the first escape
function showResult(m, replay) {
  const first = results().rooms[m.id], r = replay || first; if (!r) return;
  const marks = r.marks || puzzleMarks(ROOM, r.tiers || {});
  $('#home').hidden = true; $('#title').hidden = true; $('#end').hidden = false; G.mode = 'end'; document.title = HOST.mr() ? `${m.title} · ${SERIES.name}` : m.title;
  $('#endEyebrow').innerHTML = `Mystery #${m.n} &middot; ${esc(m.title)}${replay ? ' &middot; replay' : ''}`;
  $('#endTitle').textContent = m.endTitle;
  $('#endFrame').src = r.frame || first?.frame || ''; $('#endFrame').alt = m.endAlt || ''; $('#endTv').hidden = !(r.frame || first?.frame);
  $('#endTv').className = 'end-tv ' + (m.frame || 'tv'); $('#endCap').textContent = m.endCaption || '';
  $('#epi').textContent = m.epilogue;
  $('#stTime').textContent = fmtTime(r.time); $('#stHints').textContent = r.hints; $('#stWrong').textContent = r.wrong; $('#stWrong').nextElementSibling.textContent = m.wrongLabel || 'Wrong guesses';
  $('#endReplay').hidden = !replay;
  if (replay) $('#endReplay').innerHTML = `A replay. Your first escape, in <b>${fmtTime(first.time)}</b>, is the result that counts and the one you share.`;
  $('#endNext').innerHTML = nextLine() + archiveLine(m);
  $('#endNext').querySelectorAll('[data-open]').forEach(b => b.onclick = () => reloadInto(b.dataset.open));
  const text = shareText(m);
  $('#shareMsg').textContent = ''; $('#shareText').hidden = true;
  $('#bShare').textContent = replay ? 'Copy first result' : 'Copy result';
  $('#bShare').onclick = () => {
    const done = ok => { $('#shareMsg').textContent = ok ? 'Copied. Paste it anywhere.' : 'Select the text below and copy it.'; if (!ok) { const t = $('#shareText'); t.hidden = false; t.value = text; t.select(); } };
    try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch (e) { done(false); }
  };
  // on the website, sharing adds a link to a result page and uses the phone's share sheet
  const mr = HOST.mr();
  if (mr && mr.share) {
    $('#bShare').textContent = replay ? 'Share your first result' : 'Share your result';
    $('#bShare').onclick = () => {
      $('#shareMsg').textContent = '';
      Promise.resolve(mr.share({ room: m.id, n: m.n, title: m.title, text, marks: (first.marks || marks).map(x => x.lvl), time: Math.round(first.time), hints: first.hints, wrong: first.wrong }))
        .then(res => {
          if (!res) return;
          $('#shareMsg').textContent = res.msg || '';
          if (res.fallback) { const t = $('#shareText'); t.hidden = false; t.value = res.fallback; t.select(); }
        }, () => { $('#shareMsg').textContent = 'Select the text below and copy it.'; const t = $('#shareText'); t.hidden = false; t.value = text; t.select(); });
    };
  }
  $('#bLobby').textContent = mr ? 'Back to the corridor' : 'All mysteries';
  $('#bLobby').onclick = () => reloadInto(null);
  $('#bAgain').onclick = () => reloadInto(m.id);
  tickCountdowns();
}
// a nudge toward an earlier mystery you haven't played
function archiveLine(cur) {
  const R = results().rooms, left = releasedMysteries().filter(x => x.id !== cur.id && !R[x.id]);
  if (!left.length) return '';
  const x = left[left.length - 1];
  return `<p class="also">Missed one? <button class="alink" data-open="${x.id}">Play Mystery #${x.n}, ${esc(x.title)}</button></p>`;
}

/* ---------- home: every mystery ---------- */
const CARD_FX = [];
function renderHome() {
  if (HOST.go(null)) return;   // on the website, home is the landing page
  G.mode = 'home'; document.title = SERIES.name; $('#app').dataset.theme = 'home';
  $('#title').hidden = true; $('#end').hidden = true; $('#home').hidden = false;
  const R = results().rooms, rel = releasedMysteries().slice().reverse(), today = dayKey(), nx = nextMystery();
  const done = rel.filter(m => R[m.id]).length;
  const card = m => {
    const { r, prog } = statusOf(m), latest = m === rel[0], isNew = m.date === today && latest;
    const badge = isNew ? '<span class="badge new">New today</span>' : latest ? '<span class="badge">Latest</span>' : '';
    const st = r ? `<span class="st ok">Escaped in ${fmtTime(r.time)}</span>`
      : prog ? '<span class="st">In progress</span>' : '<span class="st">Not played</span>';
    const act = r ? 'Play again' : prog ? 'Continue' : 'Play';
    return `<button class="mcard" data-id="${m.id}" data-theme="${m.theme}"><span class="art"><canvas data-fx="${m.id}" width="480" height="270"></canvas>${badge}</span>
      <span class="body"><span class="num">Mystery #${m.n}</span><span class="t">${esc(m.title)}</span><span class="pl">${esc(m.place)} &middot; ${esc(m.era)}</span><span class="tg">${esc(m.tagline || '')}</span>
      <span class="foot"><span class="stw">${st}</span><span class="go">${act} &rarr;</span></span></span></button>`;
  };
  const next = nx ? { n: nx.n, line: `Opens in <span class="cd" data-to="${nx.date}">${fmtHMS(msUntilDay(nx.date))}</span>` } : { n: MYSTERIES[MYSTERIES.length - 1].n + 1, line: 'On its way. New mysteries open at midnight.' };
  $('#homeIn').innerHTML = `<header class="h-head"><p class="h-kick">${esc(SERIES.tagline)}</p><h1 class="h-title">${esc(SERIES.name)}</h1>
      ${rel.length ? `<p class="h-count">You've escaped ${done} of ${rel.length}.</p>` : ''}</header>
    <div class="mgrid">${rel.map(card).join('')}<div class="mcard soon"><span class="art"><span class="q">?</span></span><span class="body"><span class="num">Mystery #${next.n}</span><span class="t">Coming soon</span><span class="tg">${next.line}</span></span></div></div>
    <p class="fine h-fine">${G.touch ? 'Plays on phones held sideways, and on computers with a keyboard and mouse.' : 'Plays best with a keyboard and mouse.'} Headphones recommended.</p>`;
  $('#homeIn').querySelectorAll('.mcard[data-id]').forEach(b => b.onclick = () => enterMystery(b.dataset.id));
  CARD_FX.length = 0;
  $('#homeIn').querySelectorAll('canvas[data-fx]').forEach(cv => CARD_FX.push({ cv, g: cv.getContext('2d'), fx: cardFx(cv.dataset.fx) }));
  tickCountdowns();
}
function cardFx(id) { const r = ROOMS[id]; return r && r.titleFx ? r.titleFx : tvStatic; }
function tvStatic(cv, g, t) {
  if (cv.width !== 160) { cv.width = 160; cv.height = 90; cv.style.imageRendering = 'pixelated'; }
  const img = g.createImageData(160, 90), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 90; d[i] = v; d[i + 1] = v * 1.02; d[i + 2] = v * 1.04; d[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(148,214,210,0.9)'; g.font = '16px VT323, monospace'; g.fillText('CH 13', 8, 18);
  if (Math.floor(t * 1.4) % 2) { g.fillStyle = '#e0433a'; g.fillText('\u25CF REC', 108, 18); }
}
function drawHome(t) { for (const c of CARD_FX) { try { c.fx(c.cv, c.g, t); } catch (e) {} } }

/* ---------- a mystery's title screen ---------- */
function renderLobby(m, startGame) {
  const R = results(), r = R.rooms[m.id], mr = HOST.mr();
  // on the website the server has already filled in this room's screen (words, picture, controls): only what
  // depends on this browser changes here (where you are in the room, your result, the buttons)
  const site = !!(mr && $('#title').dataset.filled);
  ROOM.n = m.n; document.title = mr ? `${m.title} · ${SERIES.name}` : m.title; $('#app').dataset.theme = m.theme || '';
  const saved = store.get(ROOM.saveKey);
  const inProg = saved && saved.flags && saved.flags.woke && !saved.flags.escaped;
  const bNew = $('#bNew'), bCont = $('#bCont'), box = $('#tDone');
  bNew.textContent = m.loading || 'Loading…'; bNew.disabled = true; bCont.disabled = true; bCont.hidden = true; delete bNew.dataset.sure;
  bNew.classList.add('primary'); bCont.classList.remove('primary');
  if (site) { lobbySite(m, r, inProg, startGame); return; }
  $('#tOsd').innerHTML = mr ? '' : m.osd; $('#tNum').textContent = `Mystery #${m.n}`; $('#tTitle').textContent = m.title;
  $('#tEyebrow').innerHTML = `${esc(m.place)} &middot; ${esc(m.era)}`; $('#tHook').textContent = m.hook;
  box.hidden = !r;
  if (r) box.innerHTML = `<p class="done-line">You escaped this one in <b>${fmtTime(r.time)}</b>. <button class="alink" id="bSeeRes">See your result</button></p>`;
  if (r) $('#bSeeRes').onclick = () => showResult(m);
  if (inProg) {
    bCont.hidden = false; bCont.classList.add('primary'); bNew.classList.remove('primary');
    bNew.parentNode.insertBefore(bCont, bNew); bNew.dataset.label = 'Start over';
    bNew.onclick = () => { if (bNew.dataset.sure) startGame(false); else { bNew.dataset.sure = '1'; bNew.textContent = G.touch ? 'Tap again to start over' : 'Click again to start over'; } };
    bCont.onclick = () => startGame(true);
  } else {
    bNew.dataset.label = r ? 'Play again' : (m.start || 'Begin'); bNew.onclick = () => startGame(false);
  }
  // on the website this is the only screen before the room: the same words as the corridor's door
  $('#tHome').innerHTML = mr ? '&larr; Back to the corridor' : '&larr; All mysteries';
  const note = $('#tNote');
  if (note) {
    const signed = !!(mr && mr.me);
    note.textContent = !mr ? '' : inProg ? 'You left this room halfway. Continue picks up where you stopped.'
      : r ? '' : signed ? 'Signed in: your result will be kept on every device.' : 'Playing as a guest. Sign in on the corridor page to keep your results on every device.';
    note.hidden = !note.textContent;
  }
  if (mr) {
    $('#tKeys').textContent = G.touch ? 'Hold your phone sideways · Thumbstick to walk · Drag to look · Headphones recommended'
      : 'WASD to move · Mouse to look · E to use · H for hints · Headphones recommended';
    const ph = $('#tPhones'); if (ph) ph.hidden = true;
  }
  $('#tHome').onclick = () => renderHome();
  // on the website: send this room to someone (their link opens its door, nothing given away)
  const row = $('#tShareRow');
  if (row) { row.hidden = !(mr && mr.openShare); $('#tShare').onclick = () => shareRoom(m.id, 'title'); }
}
// the website's room screen: your status beside the room's number, and one row of buttons
// (Begin, or Continue and Start over, or Play again and See your result; then Dare a friend, which mr.js opens)
function lobbySite(m, r, inProg, startGame) {
  const bNew = $('#bNew'), bCont = $('#bCont'), bRes = $('#bRes'), st = $('#tStatus');
  const pills = [];
  if (inProg) pills.push('<span class="prog">In progress</span>');
  if (r) pills.push(`<span class="ok">Escaped in ${fmtTime(r.time)}</span>`);
  st.innerHTML = pills.join(''); st.hidden = !pills.length;
  $('#tDone').hidden = true; $('#tNote').hidden = true;
  bRes.hidden = !(r && !inProg); bRes.onclick = () => showResult(m);
  if (inProg) {
    bCont.hidden = false; bCont.classList.add('primary'); bNew.classList.remove('primary');
    bNew.parentNode.insertBefore(bCont, bNew); bNew.dataset.label = 'Start over';
    bNew.onclick = () => { if (bNew.dataset.sure) startGame(false); else { bNew.dataset.sure = '1'; bNew.textContent = G.touch ? 'Tap again to start over' : 'Click again to start over'; } };
    bCont.onclick = () => startGame(true);
  } else {
    bNew.dataset.label = r ? 'Play again' : (m.start || 'Begin'); bNew.onclick = () => startGame(false);
  }
  $('#tHome').onclick = e => { e.preventDefault(); renderHome(); };
}
// send a room to someone, through the website's share panel
function shareRoom(id, surface) {
  const mr = HOST.mr(), m = MYSTERIES.find(x => x.id === id);
  if (mr && mr.openShare && m) mr.openShare({ kind: 'room', room: m.id, n: m.n, title: m.title, tagline: m.tagline, surface });
}
// called once the room is built and ready to play
function lobbyReady() { const b = $('#bNew'); b.disabled = false; $('#bCont').disabled = false; if (b.dataset.label) b.textContent = b.dataset.label; }


