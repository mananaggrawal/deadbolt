/* Deadbolt: the website's browser client, loaded on every page.
   - an anonymous id per browser, and Google sign-in through the site's own server
   - results synced to the player's account (localStorage stays the game's source)
   - play tracking: starts, squares done, hints, wrong guesses, escapes, shares
   - share links with a result page, and a small feedback form
   The game talks to it through window.MR (see "host bridge" in game/src/series.js). */
(() => {
  'use strict';
  const CFG = Object.assign({ version: 'dev', requireLogin: false, page: 'site', room: null }, window.MR_CFG || {});
  const LS = {
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const SS = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RES_KEY = 'lethe.results.v1', SEL_KEY = 'lethe.sel';

  let anon = LS.get('mr.anon');
  if (!anon || !/^[0-9a-f-]{36}$/.test(anon)) { anon = uuid(); LS.set('mr.anon', anon); }

  function api(path, body, method) {
    return fetch(path, {
      method: method || (body ? 'POST' : 'GET'), credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined,
    }).then(r => r.ok ? r.json() : r.json().catch(() => ({})).then(j => Promise.reject(Object.assign(new Error(j.error || r.status), { status: r.status }))));
  }

  /* ---------- which room this page is (game page: /play/<id>) ---------- */
  const path = location.pathname.match(/^\/play\/([\w-]+)\/?$/);
  const pageRoom = path ? path[1] : null;
  if (pageRoom) LS.set(SEL_KEY, { id: pageRoom, t: Date.now() });   // the game opens this room's title screen
  const fromShare = new URLSearchParams(location.search).get('s');
  if (fromShare && /^[A-Za-z0-9]{4,12}$/.test(fromShare)) SS.set('mr.from', fromShare);

  /* ---------- events ---------- */
  const Q = [];
  const plays = LS.get('mr.plays') || {};          // room -> id of the current attempt
  function track(name, data, room) {
    data = data || {};
    room = room || data.room || pageRoom || null;
    const { step, ...rest } = data; delete rest.room;
    Q.push({ name, room, play: room ? plays[room] || null : null, step: Number.isInteger(step) ? step : null, data: rest, t: Date.now() });
    if (Q.length >= 25 || URGENT.has(name)) flush();
  }
  const URGENT = new Set(['room_start', 'room_escape', 'room_quit', 'share_click', 'feedback_sent', 'signin_start', 'client_error']);
  function flush(beacon) {
    if (!Q.length) return;
    const body = JSON.stringify({ anon, v: CFG.version, page: CFG.page, events: Q.splice(0, 50) });
    if (beacon && navigator.sendBeacon) { try { if (navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }))) return; } catch (e) {} }
    fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'same-origin' }).catch(() => {});
    if (Q.length) flush(beacon);
  }
  setInterval(() => flush(), 10000);
  addEventListener('pagehide', () => flush(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    if (last && last.mode === 'play') track('page_hide', { step: last.solved.length, seconds: last.elapsed }, last.room);
    flush(true);
  });
  addEventListener('error', e => {
    if (!e || !e.message || (track.errs = (track.errs || 0) + 1) > 5) return;
    track('client_error', { message: String(e.message).slice(0, 300), where: `${(e.filename || '').split('/').pop()}:${e.lineno || 0}` });
  });
  addEventListener('unhandledrejection', e => {
    if ((track.errs = (track.errs || 0) + 1) > 5) return;
    const r = e && e.reason;
    track('client_error', { message: String((r && r.message) || r || 'unhandled rejection').slice(0, 300), where: 'promise' });
  });
  const tracked = CFG.page !== 'admin';   // the dashboard itself isn't counted

  /* presence: one ping a minute while the page is in front, so the dashboard knows who is here and how long a play has run */
  function ping() {
    if (!tracked || document.visibilityState !== 'visible') return;
    const inPlay = last && last.mode === 'play';
    track('ping', inPlay ? { step: last.solved.length, seconds: last.elapsed } : {}, inPlay ? last.room : null);
    flush();
  }
  setInterval(ping, 60000);

  /* ---------- plays ---------- */
  function startPlay(room, cont) {
    if (!cont || !plays[room]) plays[room] = uuid();
    LS.set('mr.plays', plays);
    let st = null; try { st = getState && getState(); } catch (e) {}
    api('/api/plays/start', { play: plays[room], room, anon, cont: !!cont, from: SS.get('mr.from'), steps: st && st.steps ? st.steps.length : null }).catch(() => {});
  }
  let finishing = null;
  function finishPlay(d) {
    const play = plays[d.room] || uuid();
    finishing = api('/api/plays/finish', { play, anon, room: d.room, first: d.first, day: d.day, time: d.time, hints: d.hints, wrong: d.wrong, tiers: d.tiers, marks: d.marks })
      .then(r => { if (r && r.code && d.first) LS.set('mr.share.' + d.room, r.code); return r; })
      .catch(() => null)
      .finally(() => { delete plays[d.room]; LS.set('mr.plays', plays); });
    return finishing;
  }

  /* ---------- the game's state, polled ---------- */
  let getState = null, last = null;
  const opened = new Set();
  function poll() {
    let s = null; try { s = getState && getState(); } catch (e) {}
    if (!s) return;
    if (s.mode === 'title' && !opened.has(s.room)) { opened.add(s.room); track('room_open', {}, s.room); }
    if (s.mode === 'play' && last && last.mode === 'play' && last.room === s.room) {
      const step = s.solved.length;                      // the square being worked on
      for (const id of s.solved) if (!last.solved.includes(id)) track('step_done', { step: s.steps.indexOf(id), id, seconds: s.elapsed }, s.room);
      for (const id in s.tiers) {
        const was = (last.tiers && last.tiers[id]) || 0;
        for (let k = was; k < s.tiers[id]; k++) track('hint_used', { step: s.steps.indexOf(id), id, tier: k + 1, seconds: s.elapsed }, s.room);
      }
      for (let k = last.wrong; k < s.wrong; k++) track('wrong', { step, seconds: s.elapsed }, s.room);
    }
    last = s;
  }
  setInterval(poll, 1500);

  /* ---------- results sync (signed in only) ---------- */
  async function syncResults() {
    const local = LS.get(RES_KEY) || { rooms: {}, lastEscapeDay: null }, send = {};
    for (const [id, r] of Object.entries(local.rooms || {})) {
      if (!r || !r.day) continue;
      send[id] = { day: r.day, time: Math.round(r.time || 0), hints: r.hints || 0, wrong: r.wrong || 0, tiers: r.tiers || {},
        marks: (r.marks || []).map(m => ({ title: m.title || '', lvl: m.lvl })) };
    }
    const res = await api('/api/me/results', { anon, rooms: send });
    const out = { rooms: {}, lastEscapeDay: local.lastEscapeDay || null };
    for (const [id, r] of Object.entries(res.rooms || {})) {
      const l = local.rooms && local.rooms[id];
      out.rooms[id] = (l && l.day === r.day && Math.round(l.time || 0) === r.time) ? l   // same run: keep the local end picture
        : { day: r.day, time: r.time, hints: r.hints, wrong: r.wrong, tiers: r.tiers || {}, marks: r.marks || [] };
    }
    const days = Object.values(out.rooms).map(r => r.day).sort();
    if (days.length) out.lastEscapeDay = days[days.length - 1];
    LS.set(RES_KEY, out);
    for (const [id, code] of Object.entries(res.shares || {})) LS.set('mr.share.' + id, code);
  }

  /* ---------- sign-in ---------- */
  let me = null;
  const ready = (async () => {
    try {
      const r = await api('/api/me');
      me = r.user ? r : null;
      if (me) {
        const pending = SS.get('mr.consent');
        if (!me.consented && pending) { await api('/api/me/consent', { age: true, at: Number(pending) }).then(() => { me.consented = true; }).catch(() => {}); }
        SS.del('mr.consent');
        if (!me.consented && CFG.page !== 'admin') setTimeout(() => consentDialog(), 300);
        await syncResults().catch(() => {});
      }
    } catch (e) {}
    if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    renderAccount();
    dispatchEvent(new CustomEvent('mr:ready', { detail: { me } }));
  })();

  async function signIn(next) {
    SS.set('mr.consent', String(Date.now()));
    track('signin_start', {});
    flush(true);
    const r = await api('/api/auth/sign-in/social', { provider: 'google', callbackURL: next || (location.pathname + location.search + location.hash) });
    if (r && r.url) location.href = r.url;
  }
  async function signOut() {
    await api('/api/auth/sign-out', {}).catch(() => {});
    LS.del(RES_KEY);                                     // the next person on this browser starts clean
    for (const k of Object.keys(localStorage)) if (k.startsWith('mr.share.')) LS.del(k);
    location.reload();
  }

  /* ---------- modal (sign-in, consent, feedback) ---------- */
  const CSS = `
  .mrm{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(5,4,4,.78);font:400 15px/22px "Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#ede8de;-webkit-font-smoothing:antialiased}
  .mrm *{box-sizing:border-box}
  .mrm .box{position:relative;width:min(420px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#161412;border:1px solid #312d29;border-radius:8px;box-shadow:0 30px 90px rgba(0,0,0,.7);padding:24px 24px 20px}
  .mrm h2{margin:0 0 6px;font-size:22px;line-height:28px;font-weight:400;letter-spacing:-.2px}
  .mrm p{margin:0 0 14px;color:#c8c1b4;font-size:14px;line-height:21px}
  .mrm .x{position:absolute;right:10px;top:8px;background:none;border:0;color:#8d867b;font-size:22px;line-height:1;cursor:pointer;padding:6px}
  .mrm .x:hover{color:#ede8de}
  .mrm .b{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:42px;padding:8px 18px;border-radius:999px;border:0;cursor:pointer;font:500 15px/24px inherit;font-family:inherit;background:#ede8de;color:#0b0a09;width:100%}
  .mrm .b:hover{background:#fff5e2}.mrm .b:disabled{opacity:.4;cursor:default}
  .mrm .b.ghost{background:transparent;color:#ede8de;border:1px solid #312d29}.mrm .b.ghost:hover{background:#1a1816}
  .mrm .chk{display:flex;gap:10px;align-items:flex-start;margin:4px 0 16px;font-size:14px;line-height:20px;color:#ede8de;cursor:pointer}
  .mrm .chk input{margin:3px 0 0;width:16px;height:16px;accent-color:#f0c27a;flex:none}
  .mrm .fine{font-size:12.5px;line-height:18px;color:#8d867b;margin:12px 0 0}
  .mrm a{color:#ede8de;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#534e47}
  .mrm .seg{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}
  .mrm .seg button{flex:1;min-width:0;min-height:38px;border-radius:999px;border:1px solid #312d29;background:transparent;color:#c8c1b4;cursor:pointer;font:inherit;font-size:14px;padding:4px 10px}
  .mrm .seg button[aria-pressed=true]{background:#ede8de;color:#0b0a09;border-color:#ede8de}
  .mrm .lab{font:500 11px/16px "Geist Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8d867b;margin:0 0 8px;display:block}
  .mrm textarea{width:100%;min-height:84px;resize:vertical;background:#0b0a09;color:#ede8de;border:1px solid #312d29;border-radius:6px;padding:10px 12px;font:inherit;font-size:14px;margin:0 0 14px}
  .mrm textarea:focus,.mrm .seg button:focus-visible,.mrm .b:focus-visible{outline:2px solid #f0c27a;outline-offset:2px}
  .mrm .g{width:18px;height:18px;flex:none}
  .mra{display:inline-flex;align-items:center;gap:8px;position:relative}
  .mra .av{width:30px;height:30px;border-radius:50%;background:#221f1c center/cover;border:1px solid #312d29;display:grid;place-items:center;font-size:13px;color:#ede8de;cursor:pointer;padding:0}
  .mra .menu{position:absolute;right:0;top:40px;min-width:220px;background:#161412;border:1px solid #312d29;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.55);padding:8px;display:flex;flex-direction:column;z-index:60}
  .mra .menu[hidden]{display:none}
  .mra .menu .who{padding:6px 10px 10px;border-bottom:1px solid #24211e;margin-bottom:6px;font-size:14px;line-height:20px}
  .mra .menu .who small{display:block;color:#8d867b;font-size:12.5px}
  .mra .menu button,.mra .menu a{background:none;border:0;text-align:left;color:#c8c1b4;padding:7px 10px;border-radius:4px;cursor:pointer;font:inherit;font-size:14px}
  .mra .menu button:hover,.mra .menu a:hover{background:#1a1816;color:#ede8de}`;
  function ensureCss() { if (document.getElementById('mrcss')) return; const s = document.createElement('style'); s.id = 'mrcss'; s.textContent = CSS; document.head.appendChild(s); }
  const GOOGLE = '<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  let openModal = null;
  function modal(html, onMount, opts) {
    ensureCss(); closeModal();
    const el = document.createElement('div'); el.className = 'mrm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="box">${opts && opts.noClose ? '' : '<button class="x" type="button" aria-label="Close">&times;</button>'}${html}</div>`;
    document.body.appendChild(el); openModal = el;
    const x = el.querySelector('.x'); if (x) x.onclick = closeModal;
    el.addEventListener('click', e => { if (e.target === el && !(opts && opts.noClose)) closeModal(); });
    el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' && !(opts && opts.noClose)) closeModal(); });
    el.addEventListener('keyup', e => e.stopPropagation());
    onMount && onMount(el);
    setTimeout(() => { const f = el.querySelector('[autofocus]') || el.querySelector('button,input,textarea'); f && f.focus(); }, 30);
    return el;
  }
  function closeModal() { if (openModal) { openModal.remove(); openModal = null; } }

  // next: where Google brings you back to (a room's page when a door asked for sign-in)
  function signInDialog(reason, next) {
    track('signin_prompt', { where: reason || CFG.page });
    const required = reason === 'required' || CFG.requireLogin;
    modal(`<h2>${required ? 'Sign in to play' : 'Sign in'}</h2>
      <p>${esc(required ? 'One step with Google and you’re in. Your escapes and squares are kept on every device you use.' : 'Keep your escapes and squares on every device. You can still play without an account.')}</p>
      <label class="chk"><input type="checkbox" id="mrAge"> <span>I'm 18 or older. These rooms have frightening scenes.</span></label>
      <button class="b" type="button" id="mrGo" disabled>${GOOGLE}<span>Continue with Google</span></button>
      <p class="fine">Google shares your name, email address and profile picture with us, nothing else. <a href="/privacy" target="_blank" rel="noopener">Privacy</a> &middot; <a href="/terms" target="_blank" rel="noopener">Terms</a></p>`, el => {
      const age = el.querySelector('#mrAge'), go = el.querySelector('#mrGo');
      age.onchange = () => { go.disabled = !age.checked; };
      go.onclick = () => { go.disabled = true; const nx = next || new URLSearchParams(location.search).get('next'); signIn(nx && /^\/(?!\/)/.test(nx) ? nx : undefined).catch(() => { go.disabled = false; go.lastElementChild.textContent = 'Couldn’t reach Google. Try again'; }); };
    });
  }
  function consentDialog() {
    modal(`<h2>One more thing</h2><p>These rooms have frightening scenes and are for adults. Confirm you're 18 or older to keep your account.</p>
      <label class="chk"><input type="checkbox" id="mrAge"> <span>I'm 18 or older.</span></label>
      <button class="b" type="button" id="mrOk" disabled>Confirm</button>
      <p class="fine"><button class="b ghost" type="button" id="mrOut" style="margin-top:4px">Sign out instead</button></p>`, el => {
      const age = el.querySelector('#mrAge'), ok = el.querySelector('#mrOk');
      age.onchange = () => { ok.disabled = !age.checked; };
      ok.onclick = () => api('/api/me/consent', { age: true, at: Date.now() }).then(() => { me.consented = true; closeModal(); renderAccount(); }).catch(() => {});
      el.querySelector('#mrOut').onclick = signOut;
    }, { noClose: true });
  }

  /* the account chip in the landing page's nav (#mrAccount) */
  function renderAccount() {
    const host = document.getElementById('mrAccount'); if (!host) return;
    ensureCss();
    if (!me) {
      host.innerHTML = '<button class="btn btn-ghost btn-sm" type="button" id="mrSignIn">Sign in</button>';
      host.querySelector('#mrSignIn').onclick = () => signInDialog('nav');
      return;
    }
    const u = me.user, initial = esc((u.name || u.email || '?').trim().charAt(0).toUpperCase());
    host.innerHTML = `<span class="mra"><button class="av" type="button" aria-label="Account" aria-expanded="false" ${u.image ? `style="background-image:url('${esc(u.image)}')"` : ''}>${u.image ? '' : initial}</button>
      <span class="menu" hidden><span class="who">${esc(u.name || '')}<small>${esc(u.email || '')}</small></span>
      <a href="/me/export" download>Download my data</a><button type="button" data-a="fb">Send feedback</button>
      <button type="button" data-a="out">Sign out</button><button type="button" data-a="del">Delete my account</button></span></span>`;
    const av = host.querySelector('.av'), menu = host.querySelector('.menu');
    av.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; av.setAttribute('aria-expanded', String(!menu.hidden)); };
    document.addEventListener('click', e => { if (!host.contains(e.target)) { menu.hidden = true; av.setAttribute('aria-expanded', 'false'); } });
    host.querySelector('[data-a=out]').onclick = signOut;
    host.querySelector('[data-a=fb]').onclick = () => { menu.hidden = true; feedback({ from: 'site' }); };
    host.querySelector('[data-a=del]').onclick = () => {
      menu.hidden = true;
      modal(`<h2>Delete your account?</h2><p>This removes your account, your saved results, share links and feedback from our server. It can't be undone. Results kept in this browser stay here.</p>
        <button class="b" type="button" id="mrDel">Delete my account</button>`, el => {
        el.querySelector('#mrDel').onclick = () => api('/api/me/delete', {}).then(() => { LS.del(RES_KEY); location.href = '/'; }).catch(() => { el.querySelector('#mrDel').textContent = 'Something went wrong. Try again'; });
      });
    };
  }

  /* ---------- feedback ---------- */
  function feedback(ctx) {
    ctx = ctx || {};
    const end = ctx.from === 'end', room = ctx.room || pageRoom;
    const kinds = end ? null : [['bug', 'Something’s broken'], ['stuck', 'I’m stuck'], ['idea', 'An idea']];
    let rating = 0, diff = '', kind = end ? 'rating' : (ctx.from === 'pause' ? 'stuck' : 'idea');
    modal(`<h2>${end ? 'How was this room?' : 'Send feedback'}</h2>
      ${end ? `<span class="lab">Your rating</span><div class="seg" id="mrRate">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-v="${n}" aria-pressed="false">${n}</button>`).join('')}</div>
        <span class="lab">Difficulty</span><div class="seg" id="mrDiff">${['Too easy', 'Just right', 'Too hard'].map(d => `<button type="button" data-v="${d}" aria-pressed="false">${d}</button>`).join('')}</div>`
        : `<div class="seg" id="mrKind">${kinds.map(([k, l]) => `<button type="button" data-v="${k}" aria-pressed="${k === kind}">${l}</button>`).join('')}</div>`}
      <span class="lab">${end ? 'Anything else? (optional)' : 'What happened?'}</span>
      <textarea id="mrTxt" maxlength="2000" placeholder="${end ? 'What did you like, what put you off' : 'A line or two is plenty'}"></textarea>
      <button class="b" type="button" id="mrSend">Send</button>
      <p class="fine">${room ? 'We attach which room and step you were on, so you don’t have to explain.' : 'Thanks for helping make the rooms better.'}</p>`, el => {
      const seg = (id, set) => { const g = el.querySelector(id); if (!g) return; g.onclick = e => { const b = e.target.closest('button'); if (!b) return; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); set(b.dataset.v); }; };
      seg('#mrRate', v => { rating = +v; }); seg('#mrDiff', v => { diff = v; }); seg('#mrKind', v => { kind = v; });
      const send = el.querySelector('#mrSend');
      send.onclick = () => {
        const text = el.querySelector('#mrTxt').value.trim();
        if (end && !rating && !diff && !text) { send.textContent = 'Pick a rating, or write something'; return; }
        if (!end && !text) { send.textContent = 'Write a line first'; return; }
        send.disabled = true;
        const st = ctx.state || (getState && (() => { try { return getState(); } catch (e) { return null; } })());
        api('/api/feedback', { anon, room, play: room ? plays[room] || null : null, kind, rating: rating || null, difficulty: diff || null, text,
          context: { from: ctx.from || CFG.page, step: st ? st.solved.length : null, seconds: st ? st.elapsed : null, hints: st ? st.hints : null, w: innerWidth, h: innerHeight } })
          .then(() => { el.querySelector('.box').innerHTML = '<h2>Thank you</h2><p>Got it. Every message is read.</p><button class="b" type="button" id="mrDone" autofocus>Close</button>'; el.querySelector('#mrDone').onclick = closeModal; track('feedback_sent', { kind }, room); })
          .catch(() => { send.disabled = false; send.textContent = 'Couldn’t send. Try again'; });
      };
    });
  }

  /* ---------- sharing ---------- */
  async function share(d) {
    if (finishing) await finishing;
    let code = LS.get('mr.share.' + d.room);
    if (!code) {
      try { const r = await api('/api/share', { anon, room: d.room, time: d.time, hints: d.hints, wrong: d.wrong, marks: d.marks }); code = r.code; LS.set('mr.share.' + d.room, code); } catch (e) {}
    }
    const url = `${location.origin}/${code ? 'r/' + code : 'm/' + d.room}`;
    const text = `${String(d.text).replace(/^Mystery #/, `${CFG.siteName || 'Deadbolt'} #`)}\n${url}`;
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (coarse && navigator.share) {
      try { await navigator.share({ text }); track('share_click', { channel: 'sheet', code }, d.room); return { msg: '' }; }
      catch (e) { if (e && e.name === 'AbortError') return { msg: '' }; }
    }
    try { await navigator.clipboard.writeText(text); track('share_click', { channel: 'copy', code }, d.room); return { msg: 'Copied, with a link to your result. Paste it anywhere.' }; }
    catch (e) { track('share_click', { channel: 'manual', code }, d.room); return { msg: 'Select the text below and copy it.', fallback: text }; }
  }

  /* on the game's end screen: a "Rate this room" button beside Share */
  function watchEnd() {
    const end = document.getElementById('end'), btn = document.getElementById('bShare');
    if (!end || !btn) return;
    const add = () => {
      if (end.hidden || document.getElementById('mrRateBtn')) return;
      const b = document.createElement('button'); b.type = 'button'; b.id = 'mrRateBtn'; b.className = 'linkbtn'; b.textContent = 'Rate this room';
      b.onclick = () => feedback({ from: 'end', room: (last && last.room) || pageRoom });
      // beside "Play again" under the main buttons (older game pages: next to Share)
      const links = document.getElementById('endLinks');
      if (links) links.prepend(b); else { b.className = btn.className.replace('primary', '').trim() || 'btn'; btn.insertAdjacentElement('afterend', b); }
    };
    new MutationObserver(add).observe(end, { attributes: true, attributeFilter: ['hidden'] });
    add();
  }

  /* ---------- the bridge the game calls ---------- */
  window.MR = {
    v: 1, anon, ready, track, flush, feedback, signInDialog,
    get me() { return me; },
    attach(fn) { getState = fn; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEnd); else watchEnd(); },
    emit(name, d) {
      d = d || {};
      if (name === 'room_start') { startPlay(d.room, d.cont); track('room_start', { cont: !!d.cont }, d.room); flush(); }
      else if (name === 'room_escape') { track('room_escape', { first: d.first, seconds: d.time, hints: d.hints, wrong: d.wrong }, d.room); flush(); finishPlay(d); }
      else track(name, d, d.room);
    },
    go(id) {
      if (last && last.mode === 'play') track('room_quit', { step: last.solved.length, seconds: last.elapsed }, last.room);
      flush(true);
      location.href = id ? '/play/' + encodeURIComponent(id) : '/#rooms';
    },
    share,
  };
  if (CFG.page === 'game' && CFG.requireLogin) ready.then(() => { if (!me) location.href = '/?signin=required&next=' + encodeURIComponent(location.pathname); });
  if (CFG.page === 'site') {
    const q = new URLSearchParams(location.search);
    if (q.get('signin')) ready.then(() => { if (!me) signInDialog(q.get('signin') === 'required' ? 'required' : 'nav'); });
  }
  if (tracked) track('page_view', { path: location.pathname, ref: document.referrer ? (() => { try { return new URL(document.referrer).host; } catch (e) { return null; } })() : null });
})();
