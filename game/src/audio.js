/* =====================================================================
   AUDIO — everything synthesized with WebAudio; voices via speechSynthesis
   ===================================================================== */
const A = { ctx: null, master: null, rev: null, noise: null, vol: 0.85, voices: true, loops: {}, ready: false };
{ const v = store.get('lethe.vol'); if (typeof v === 'number') A.vol = v; const vv = store.get('lethe.voices'); if (typeof vv === 'boolean') A.voices = vv; }

function setVolume(v) { A.vol = v; store.set('lethe.vol', v); if (A.master) A.master.gain.value = v; }

function initAudio() {
  if (A.ctx) { A.ctx.resume && A.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const ctx = new C(); A.ctx = ctx;
  A.master = ctx.createGain(); A.master.gain.value = A.vol;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4;
  A.master.connect(comp); comp.connect(ctx.destination);
  // noise buffer
  const len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  A.noise = b;
  // brown noise
  const bb = ctx.createBuffer(1, len, ctx.sampleRate), bd = bb.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
  A.brown = bb;
  // reverb impulse (small tired room)
  const ir = ctx.createBuffer(2, ctx.sampleRate * 1.7, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3.2); }
  A.rev = ctx.createConvolver(); A.rev.buffer = ir;
  const rg = ctx.createGain(); rg.gain.value = 0.32; A.rev.connect(rg); rg.connect(A.master);
  A.ready = true;
  loadVO();
}
const VOB = {};
async function loadVO() {
  if (A.voLoading || typeof VO === 'undefined') return; A.voLoading = true;
  for (const id in VO) {
    try { const bin = Uint8Array.from(atob(VO[id]), c => c.charCodeAt(0)); VOB[id] = await A.ctx.decodeAudioData(bin.buffer); } catch (e) { }
  }
}
let voSrc = null;
function softClip() { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(x * 2.4) / Math.tanh(2.4); } return c; }
// play a recorded line: fx 'phone' (thin, clipped), 'tape' (dull, wobbling), 'whisper'
// the filter chain for a recorded line: fx 'phone' (thin, clipped), 'tape' (dull, wobbling), 'tube' (brass pipe), 'whisper'
function voChain(src, buf, opts) {
  const ctx = A.ctx, speed = opts.speed || 1; let node = src;
  if (opts.fx === 'phone') { const hp = filt('highpass', 330, 0.7), lp = filt('lowpass', 3100, 0.7), ws = ctx.createWaveShaper(); ws.curve = softClip(); node.connect(hp); hp.connect(lp); lp.connect(ws); node = ws; }
  else if (opts.fx === 'tape') {
    const hp = filt('highpass', 150, 0.7), lp = filt('lowpass', 3400, 0.6); node.connect(hp); hp.connect(lp); node = lp;
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.8; lg.gain.value = 0.006 * speed; l.connect(lg); lg.connect(src.playbackRate); l.start(); l.stop(ctx.currentTime + buf.duration / speed + 1);
  } else if (opts.fx === 'tube') {
    const hp = filt('highpass', 280, 0.7), p1 = filt('peaking', 700, 4), p2 = filt('peaking', 1500, 5), lp = filt('lowpass', 2300, 0.8);
    p1.gain.value = 10; p2.gain.value = 8;
    const dl = ctx.createDelay(0.1); dl.delayTime.value = 0.0072; const fb = ctx.createGain(); fb.gain.value = 0.5; const mix = ctx.createGain();
    node.connect(hp); hp.connect(p1); p1.connect(p2); p2.connect(lp); lp.connect(mix); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(mix);
    node = mix;
  } else if (opts.fx === 'whisper') { const lp = filt('lowpass', 2600, 0.5), hp = filt('highpass', 200, 0.7); node.connect(hp); hp.connect(lp); node = lp; }
  else if (opts.fx === 'phono') {
    // an Edison horn: thin, nasal, a little distorted, with the horn's own ring
    const hp = filt('highpass', 380, 0.8), lp = filt('lowpass', 3000, 0.9), pk = filt('peaking', 1450, 2.2), pk2 = filt('peaking', 800, 3), ws = ctx.createWaveShaper(); ws.curve = softClip();
    pk.gain.value = 9; pk2.gain.value = 5; const dl = ctx.createDelay(0.05), fb = ctx.createGain(), mix = ctx.createGain(); dl.delayTime.value = 0.0031; fb.gain.value = 0.35;
    node.connect(hp); hp.connect(pk); pk.connect(pk2); pk2.connect(ws); ws.connect(lp); lp.connect(mix); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(mix); node = mix;
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 0.55; lg.gain.value = 0.004 * speed; l.connect(lg); lg.connect(src.playbackRate); l.start(); l.stop(ctx.currentTime + buf.duration / speed + 1);
  }
  else if (opts.fx === 'muffled') {
    // through a steel drawer: dull, boxy, a tight metal ring
    const lp = filt('lowpass', 720, 0.9), pk = filt('peaking', 260, 3), dl = ctx.createDelay(0.05), fb = ctx.createGain(), mix = ctx.createGain();
    pk.gain.value = 8; dl.delayTime.value = 0.0045; fb.gain.value = 0.42;
    node.connect(lp); lp.connect(pk); pk.connect(mix); pk.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(mix); node = mix;
  }
  const g = ctx.createGain(); g.gain.value = (opts.volume ?? 1) * 1.1; node.connect(g);
  route(g, { pos: opts.pos || null, wet: opts.wet ?? (opts.fx === 'phone' ? 0.03 : opts.fx === 'tube' ? 0.12 : 0.25), ref: opts.ref || 0.7 });
}
// a line with subtitles that other lines interrupt
function playVO(who, text, buf, opts) {
  subtitle(who, text, 0);
  const tok = ++sayToken, speed = opts.speed || 1;
  return new Promise(res => {
    const src = A.ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = speed;
    voChain(src, buf, opts);
    voSrc = src;
    let done = false;
    const fin = () => { if (done) return; done = true; clearTimeout(to); if (voSrc === src) voSrc = null; if (tok === sayToken) setTimeout(() => { if (tok === sayToken) clearSubs(); }, 500); res(tok === sayToken); };
    src.onended = fin; const to = setTimeout(fin, buf.duration / speed * 1000 + 1500);
    src.start();
  });
}
// a one-off clip in the world (no subtitles, doesn't interrupt anything)
function playClip(id, opts = {}) {
  const buf = VOB[id]; if (!buf || !A.ready) return;
  const src = A.ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = opts.speed || 1;
  voChain(src, buf, opts); src.start();
}
const now = () => A.ctx ? A.ctx.currentTime : 0;

function panner(pos, ref = 0.7, roll = 1.2) {
  const p = A.ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = roll; p.maxDistance = 30;
  if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z);
  return p;
}
function setPannerPos(p, pos) { if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z); }
// route: node -> [panner] -> gain -> master (+ reverb send)
function route(node, { pos = null, vol = 1, wet = 0.3, ref, roll } = {}) {
  let n = node; let p = null;
  if (pos) { p = panner(pos, ref, roll); n.connect(p); n = p; }
  const g = A.ctx.createGain(); g.gain.value = vol; n.connect(g); g.connect(A.master);
  if (wet > 0) { const s = A.ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(A.rev); }
  return { gain: g, panner: p };
}
function noiseSrc(loop = true, brown = false) { const s = A.ctx.createBufferSource(); s.buffer = brown ? A.brown : A.noise; s.loop = loop; return s; }
function filt(type, f, q = 1) { const b = A.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }

function updateListener() {
  if (!A.ready) return;
  const L = A.ctx.listener, p = camera.position;
  if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z)) return;
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), u = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  if (L.positionX) {
    L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z;
    L.forwardX.value = f.x; L.forwardY.value = f.y; L.forwardZ.value = f.z; L.upX.value = u.x; L.upY.value = u.y; L.upZ.value = u.z;
  } else { L.setPosition(p.x, p.y, p.z); L.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z); }
}

/* ---------- one-shots ---------- */
function sKnock(pos, loud = 1, when = 0, muffle = 0) {
  if (!A.ready) return; const t = now() + when, ctx = A.ctx;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
  const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(1.1 * loud, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  const n = noiseSrc(false), bp = filt('bandpass', 620 + Math.random() * 160, 1.3), ng = ctx.createGain();
  ng.gain.setValueAtTime(0.9 * loud, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  const mix = ctx.createGain(); o.connect(og); og.connect(mix); n.connect(bp); bp.connect(ng); ng.connect(mix);
  let outN = mix; if (muffle) { const lp = filt('lowpass', 900, 0.7); mix.connect(lp); outN = lp; }
  route(outN, { pos, wet: 0.45, vol: 1 });
  o.start(t); o.stop(t + 0.4); n.start(t, Math.random() * 2); n.stop(t + 0.12);
}
function sKnocks(pos, n, gap = 0.55, loud = 1, muffle = 0) { for (let i = 0; i < n; i++) sKnock(pos, loud * (0.9 + Math.random() * 0.2), i * gap * (0.93 + Math.random() * 0.14), muffle); }
function sClick(pos = null, vol = 0.5, f = 2400) {
  if (!A.ready) return; const t = now(), n = noiseSrc(false), bp = filt('bandpass', f, 3), g = A.ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.15 }); n.start(t, Math.random()); n.stop(t + 0.05);
}
function sThunk(pos = null, vol = 0.8, f = 180) {
  if (!A.ready) return; const t = now(), ctx = A.ctx;
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.15);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g); route(g, { pos, wet: 0.25 }); o.start(t); o.stop(t + 0.3); sClick(pos, vol * 0.6, 1600);
}
function sCreak(pos, dur = 1.2, vol = 0.35, base = 90) {
  if (!A.ready) return; const t = now(), ctx = A.ctx;
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(base, t);
  for (let i = 1; i <= 8; i++) o.frequency.linearRampToValueAtTime(base * (0.8 + Math.random() * 0.7), t + dur * i / 8);
  const bp = filt('bandpass', 750, 4), g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.setValueAtTime(vol, t + dur - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(bp); bp.connect(g); route(g, { pos, wet: 0.4 }); o.start(t); o.stop(t + dur + 0.05);
}
function sStinger(vol = 1) {
  if (!A.ready) return; const t = now(), ctx = A.ctx;
  const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.55 * vol, t + 0.03); out.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  [55, 58.3, 116.5, 233.1, 311, 466.2, 622].forEach((f, i) => { const o = ctx.createOscillator(); o.type = i < 3 ? 'sawtooth' : 'square'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (i % 2 ? 0.97 : 1.03), t + 3); const g = ctx.createGain(); g.gain.value = i < 3 ? 0.3 : 0.08; o.connect(g); g.connect(out); o.start(t); o.stop(t + 3.3); });
  const n = noiseSrc(false), hp = filt('highpass', 1800, 0.7), ng = ctx.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 1.5);
  const s = ctx.createOscillator(); s.type = 'sine'; s.frequency.setValueAtTime(2600, t); s.frequency.exponentialRampToValueAtTime(900, t + 2.2); const sg = ctx.createGain(); sg.gain.setValueAtTime(0.12, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); s.connect(sg); sg.connect(out); s.start(t); s.stop(t + 2.5);
  const lp = filt('lowpass', 5000, 0.5); out.connect(lp); route(lp, { wet: 0.5 });
}
function sBreath(pos, cycles = 2, vol = 0.5, close = false) {
  if (!A.ready) return; const ctx = A.ctx; let t = now();
  for (let i = 0; i < cycles; i++) {
    const inD = 1.1 + Math.random() * 0.4, outD = 1.5 + Math.random() * 0.5;
    [[inD, 900, 1500], [outD, 1300, 600]].forEach(([d, f0, f1], k) => {
      const n = noiseSrc(false), bp = filt('bandpass', f0, close ? 1.2 : 2.2), g = ctx.createGain();
      bp.frequency.setValueAtTime(f0, t); bp.frequency.linearRampToValueAtTime(f1, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * (k ? 0.9 : 0.6), t + d * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + d);
      n.connect(bp); bp.connect(g); route(g, { pos, wet: close ? 0.08 : 0.35, ref: 0.4 }); n.start(t, Math.random() * 2); n.stop(t + d + 0.05);
      t += d + 0.15;
    });
    t += 0.3 + Math.random() * 0.4;
  }
}
function sHeart(beats = 6, vol = 0.6, rate = 0.85) {
  if (!A.ready) return; const ctx = A.ctx; let t = now();
  for (let i = 0; i < beats; i++) {
    [0, 0.22].forEach((o, k) => { const os = ctx.createOscillator(); os.frequency.setValueAtTime(62, t + o); os.frequency.exponentialRampToValueAtTime(38, t + o + 0.12); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + o); g.gain.exponentialRampToValueAtTime(vol * (k ? 0.6 : 1), t + o + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.2); os.connect(g); route(g, { wet: 0 }); os.start(t + o); os.stop(t + o + 0.25); });
    t += rate * (1 - i * 0.02);
  }
}
function sThunder(delay = 1.5, vol = 0.6) {
  if (!A.ready) return; const t = now() + delay, ctx = A.ctx, dur = 3 + Math.random() * 2.5;
  const n = noiseSrc(false, true), lp = filt('lowpass', 260, 0.8), g = ctx.createGain();
  lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(120, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.15); g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(lp); lp.connect(g); route(g, { wet: 0.5 }); n.start(t, Math.random()); n.stop(t + dur + 0.1);
}
function sScrape(pos, dur = 0.5, vol = 0.35) {
  if (!A.ready) return; const t = now(), n = noiseSrc(false), bp = filt('bandpass', 260 + Math.random() * 120, 2.5), g = A.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05);
  for (let i = 1; i < 6; i++) g.gain.linearRampToValueAtTime(vol * (0.4 + Math.random() * 0.6), t + dur * i / 6);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.2 }); n.start(t, Math.random()); n.stop(t + dur + 0.05);
}
function sStep(vol = 0.18) {
  if (!A.ready) return; const t = now(), ctx = A.ctx, n = noiseSrc(false, true), lp = filt('lowpass', 380, 0.6), g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  n.connect(lp); lp.connect(g); route(g, { wet: 0.05 }); n.start(t, Math.random() * 2); n.stop(t + 0.16);
}
function sFlutter(pos, dur = 2, vol = 0.4) {
  if (!A.ready) return; const t = now(), ctx = A.ctx, n = noiseSrc(false), bp = filt('bandpass', 2400, 1.5), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 26; lg.gain.value = vol * 0.5; lfo.connect(lg); lg.connect(g.gain);
  g.gain.setValueAtTime(vol * 0.5, t); g.gain.linearRampToValueAtTime(0, t + dur);
  n.connect(bp); bp.connect(g); route(g, { pos, wet: 0.3 }); n.start(t); n.stop(t + dur); lfo.start(t); lfo.stop(t + dur);
}
function sSqueak(pos, vol = 0.12) {
  if (!A.ready) return; const t = now(), o = A.ctx.createOscillator(), g = A.ctx.createGain();
  o.frequency.setValueAtTime(1900 + Math.random() * 400, t); o.frequency.linearRampToValueAtTime(2500 + Math.random() * 500, t + 0.25);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.linearRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g); route(g, { pos, wet: 0.2 }); o.start(t); o.stop(t + 0.3);
}
function sTone(freqs, dur, vol = 0.12, when = 0) {
  if (!A.ready) return; const t = now() + when, g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + dur - 0.02); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  freqs.forEach(f => { const o = A.ctx.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + dur + 0.02); });
  const lp = filt('lowpass', 3400, 0.7); g.connect(lp); route(lp, { wet: 0 });
}
function sBell(pos, dur = 2) {
  if (!A.ready) return; const t = now(), ctx = A.ctx, out = ctx.createGain(); out.gain.value = 0.22;
  const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 18; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg);
  const env = ctx.createGain(); env.gain.setValueAtTime(0.5, t); env.gain.setValueAtTime(0.5, t + dur - 0.05); env.gain.linearRampToValueAtTime(0, t + dur); lg.connect(env.gain);
  [1150, 1560, 2330, 3120].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f * (1 + Math.random() * 0.004); const g = ctx.createGain(); g.gain.value = [0.5, 0.35, 0.2, 0.1][i]; o.connect(g); g.connect(env); o.start(t); o.stop(t + dur + 0.05); });
  env.connect(out); route(out, { pos, wet: 0.35 }); lfo.start(t); lfo.stop(t + dur + 0.05);
}

/* ---------- loops ---------- */
function loopNoise({ pos = null, type = 'bandpass', f = 1000, q = 1, vol = 0, brown = false, wet = 0.2, ref, roll } = {}) {
  const n = noiseSrc(true, brown), fl = filt(type, f, q); n.connect(fl);
  const r = route(fl, { pos, vol, wet, ref, roll }); n.start(0, Math.random() * 2);
  return { src: n, filter: fl, gain: r.gain, panner: r.panner };
}
function setGain(loop, v, tc = 0.08) { if (loop && A.ready) loop.gain.gain.setTargetAtTime(v, now(), tc); }

/* ---------- speech ---------- */
let VOICES = [];
function loadVoices() { try { VOICES = speechSynthesis.getVoices() || []; } catch (e) { VOICES = []; } }
if ('speechSynthesis' in window) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
function voiceFor(kind) {
  const en = VOICES.filter(v => /^en/i.test(v.lang)); if (!en.length) return null;
  const fem = /female|samantha|victoria|zira|karen|moira|tessa|fiona|susan|serena|allison|ava|kate|libby|sonia|jenny|aria/i;
  const mal = /male|daniel|alex|fred|david|mark|george|ryan|guy|tom|arthur|oliver|lee|rishi/i;
  if (kind === 'f') return en.find(v => fem.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/i, ''))) || en[0];
  if (kind === 'm') return en.find(v => mal.test(v.name) && !fem.test(v.name)) || en[en.length > 1 ? 1 : 0];
  return en[0];
}
let sayToken = 0;
function stopSpeech() { sayToken++; try { speechSynthesis.cancel(); } catch (e) {} if (voSrc) { try { voSrc.stop(); } catch (e) {} voSrc = null; } }
// speak a line with subtitles. opts: voice 'f'|'m', rate, pitch, volume, who
function say(who, text, opts = {}) {
  const buf = opts.clip && VOB[opts.clip];
  if (buf && A.ready) return playVO(who, text, buf, opts);
  const plain = text.replace(/<[^>]+>/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const est = 900 + plain.length * 66 / (opts.rate || 0.92);
  subtitle(who, text, 0);
  const tok = ++sayToken;
  return new Promise(res => {
    let done = false; const fin = () => { if (done) return; done = true; clearTimeout(to); if (tok === sayToken) setTimeout(() => { if (tok === sayToken) clearSubs(); }, 600); res(tok === sayToken); };
    const speak = A.voices && 'speechSynthesis' in window && VOICES.length > 0 && plain;
    const to = setTimeout(fin, speak ? est + 5000 : est);
    if (!speak) return;
    try {
      const u = new SpeechSynthesisUtterance(plain);
      u.rate = opts.rate || 0.92; u.pitch = opts.pitch ?? 1; u.volume = (opts.volume ?? 0.95) * A.vol;
      const v = voiceFor(opts.voice); if (v) u.voice = v;
      u.onend = fin; u.onerror = fin; speechSynthesis.speak(u);
    } catch (e) { }
  });
}


