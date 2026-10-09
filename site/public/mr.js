/* Deadbolt: the website's browser client, loaded on every page.
   - an anonymous id per browser, and Google sign-in through the site's own server
   - results synced to the player's account (localStorage stays the game's source)
   - play tracking: starts, puzzles done, hints, wrong guesses, escapes, shares
   - sharing: one panel for the site, a room or a result, with a tracked link per person and app
   - where a visitor came from: the share link (and app) a browser first arrived through
   - a way out of in-app browsers (Instagram, Facebook...), where Google sign-in is blocked
   - feedback: three faces, then a line if they want
   The game talks to it through window.MR (see "host bridge" in game/src/series.js). */
(() => {
  'use strict';
  const CFG = Object.assign({ version: 'dev', requireLogin: false, page: 'site', room: null, siteName: 'Deadbolt' }, window.MR_CFG || {});
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
  const enc = encodeURIComponent;
  const RES_KEY = 'lethe.results.v1', SEL_KEY = 'lethe.sel';
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();

  let anon = LS.get('mr.anon');
  if (!anon || !/^[0-9a-f-]{36}$/.test(anon)) { anon = uuid(); LS.set('mr.anon', anon); }

  function api(path, body, method) {
    return fetch(path, {
      method: method || (body ? 'POST' : 'GET'), credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined,
    }).then(r => r.ok ? r.json() : r.json().catch(() => ({})).then(j => Promise.reject(Object.assign(new Error(j.error || r.status), { status: r.status }))));
  }

  /* ---------- the browser we're in ---------- */
  const UA = navigator.userAgent || '';
  const IS_IOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const IS_ANDROID = /Android/.test(UA);
  // apps that open links in their own web view, where Google refuses to sign anyone in
  const IN_APP = (() => {
    const named = [[/FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS/, 'Facebook'], [/Instagram/, 'Instagram'], [/LinkedInApp/, 'LinkedIn'], [/Snapchat/, 'Snapchat'],
      [/musical_ly|BytedanceWebview|TikTok/, 'TikTok'], [/\bLine\//, 'LINE'], [/Pinterest/, 'Pinterest'], [/KAKAOTALK/i, 'KakaoTalk']];
    for (const [re, n] of named) if (re.test(UA)) return n;
    if (IS_ANDROID && /; wv\)/.test(UA)) return 'this app';
    if (IS_IOS && /AppleWebKit/.test(UA) && !/Safari\//.test(UA) && !navigator.standalone) return 'this app';
    return null;
  })();
  const BROWSER = IS_IOS ? 'Safari' : 'Chrome';
  // the address as it arrived (with any share code), so moving to a real browser keeps who sent it
  const ENTRY = new URL(location.href);
  const openInBrowserUrl = () => `intent://${ENTRY.host}${ENTRY.pathname}${ENTRY.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${enc(ENTRY.href)};end`;

  /* ---------- which room this page is (game page: /play/<id>) ---------- */
  const path = location.pathname.match(/^\/play\/([\w-]+)\/?$/);
  const pageRoom = path ? path[1] : null;
  if (pageRoom) LS.set(SEL_KEY, { id: pageRoom, t: Date.now() });   // the game opens this room's title screen

  /* ---------- events ---------- */
  const Q = [];
  const plays = LS.get('mr.plays') || {};          // room -> id of the current attempt
  const URGENT = new Set(['room_start', 'room_escape', 'room_quit', 'share_click', 'share_visit', 'feedback_sent', 'signin_start', 'client_error']);
  function track(name, data, room) {
    data = data || {};
    room = room || data.room || pageRoom || null;
    const { step, ...rest } = data; delete rest.room;
    Q.push({ name, room, play: room ? plays[room] || null : null, step: Number.isInteger(step) ? step : null, data: rest, t: Date.now() });
    if (Q.length >= 25 || URGENT.has(name)) flush();
  }
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

  /* ---------- arriving through a share link ----------
     /r/<code> (a result), /i/<code> (a room or the site), or ?s=<code>; ?via=<app> says which app it was sent
     through. The first link a browser arrives by is kept for 30 days, and its plays are credited to it. */
  const VIA = /^(wa|tg|x|fb|em|cp|sh|li)$/;
  const qs = new URLSearchParams(location.search);
  const pathCode = location.pathname.match(/^\/(?:r|i)\/([a-z0-9]{6})\/?$/i);
  const arrivedCode = pathCode ? pathCode[1].toLowerCase() : (/^[a-z0-9]{6}$/i.test(qs.get('s') || '') ? qs.get('s').toLowerCase() : null);
  const arrivedVia = VIA.test(qs.get('via') || '') ? qs.get('via') : null;
  let from = LS.get('mr.from');
  if (from && !(Date.now() - from.t < 30 * 864e5)) { from = null; LS.del('mr.from'); }
  if (arrivedCode || arrivedVia) {
    if (!from) { from = { code: arrivedCode, via: arrivedVia, t: Date.now() }; LS.set('mr.from', from); }
    const k = `mr.visit.${arrivedCode || ''}.${arrivedVia || ''}`;
    if (!SS.get(k)) { SS.set(k, '1'); track('share_visit', { code: arrivedCode, via: arrivedVia, page: CFG.page }); }
    // tidy the address bar: the room's own page, without the tracking bits
    try {
      const u = new URL(location.href); u.searchParams.delete('via'); u.searchParams.delete('s');
      if (window.MR_CANON) u.pathname = window.MR_CANON;
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }

  /* ---------- plays ---------- */
  function startPlay(room, cont) {
    if (!cont || !plays[room]) plays[room] = uuid();
    LS.set('mr.plays', plays);
    let st = null; try { st = getState && getState(); } catch (e) {}
    api('/api/plays/start', { play: plays[room], room, anon, cont: !!cont, from: from && from.code, via: from && from.via, steps: st && st.steps ? st.steps.length : null }).catch(() => {});
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
  let me = null, known = false;
  const ready = (async () => {
    try {
      const r = await api('/api/me');
      me = r.user ? r : null; known = true;
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
    if (IN_APP) inAppBar();
    dispatchEvent(new CustomEvent('mr:ready', { detail: { me } }));
  })();

  const safeNext = nx => (nx && /^\/(?!\/)/.test(nx) ? nx : undefined);
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
    for (const k of Object.keys(localStorage)) if (k.startsWith('mr.share.') || k.startsWith('mr.inv.')) LS.del(k);
    location.reload();
  }

  /* ---------- modal (sign-in, consent, sharing, feedback) ---------- */
  const CSS = `
  .mrm{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(5,4,4,.78);font:400 15px/22px "Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#ede8de;-webkit-font-smoothing:antialiased;letter-spacing:0;text-transform:none}
  .mrm *{box-sizing:border-box}
  .mrm .box{position:relative;width:min(420px,100%);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:#161412;border:1px solid #312d29;border-radius:8px;box-shadow:0 30px 90px rgba(0,0,0,.7);padding:24px 24px 20px;text-align:left}
  .mrm h2{margin:0 0 6px;font-size:22px;line-height:28px;font-weight:400;letter-spacing:-.2px;padding-right:28px}
  .mrm p{margin:0 0 14px;color:#c8c1b4;font-size:14px;line-height:21px}
  .mrm .box:focus{outline:none}
  .mrm .x{position:absolute;right:12px;top:12px;width:36px;height:36px;display:grid;place-items:center;background:transparent;border:0;border-radius:999px;color:#8d867b;font-size:22px;line-height:1;cursor:pointer;padding:0}
  .mrm .x:hover{color:#ede8de;background:#221f1c}
  .mrm .x:focus-visible{outline:2px solid #f0c27a;outline-offset:1px}
  .mrm .x::after{content:"";position:absolute;inset:-4px}
  .mrm .b{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:44px;padding:8px 18px;border-radius:999px;border:0;cursor:pointer;font:500 15px/24px inherit;font-family:inherit;background:#ede8de;color:#0b0a09;width:100%;text-decoration:none;text-transform:none;letter-spacing:0}
  .mrm .b:hover{background:#fff5e2}.mrm .b:disabled{opacity:.4;cursor:default}
  .mrm .b.ghost{background:transparent;color:#ede8de;border:1px solid #312d29}.mrm .b.ghost:hover{background:#1a1816}
  .mrm .chk{display:flex;gap:12px;align-items:flex-start;margin:4px 0 16px;padding:4px 0;font-size:14px;line-height:21px;color:#ede8de;cursor:pointer}
  .mrm .chk input{margin:1px 0 0;width:20px;height:20px;accent-color:#f0c27a;flex:none}
  .mrm .fine{font-size:12.5px;line-height:18px;color:#8d867b;margin:12px 0 0}
  .mrm a{color:#ede8de;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#534e47}
  .mrm .seg{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}
  .mrm .seg button{flex:1;min-width:0;min-height:42px;border-radius:999px;border:1px solid #312d29;background:transparent;color:#c8c1b4;cursor:pointer;font:inherit;font-size:14px;padding:4px 10px}
  .mrm .seg button[aria-pressed=true]{background:#ede8de;color:#0b0a09;border-color:#ede8de}
  .mrm .lab{font:500 11px/16px "Geist Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8d867b;margin:0 0 8px;display:block}
  .mrm textarea{width:100%;min-height:84px;resize:vertical;background:#0b0a09;color:#ede8de;border:1px solid #312d29;border-radius:6px;padding:10px 12px;font:inherit;font-size:16px;margin:0 0 14px}
  .mrm textarea:focus,.mrm .seg button:focus-visible,.mrm .b:focus-visible{outline:2px solid #f0c27a;outline-offset:2px}
  .mrm .g{width:18px;height:18px;flex:none}
  .mrm .mrs-head{display:flex;align-items:center;gap:12px;margin:0 0 4px;padding-right:36px}
  .mrm .mrs-head h2{margin:0;padding:0}
  .mrm .mrs-head .mrs-logo{width:20px;height:26px;flex:none}
  .mrm .mrs-head + .lead{margin:8px 0 0}
  .mrm .mrs-card{margin:18px 0 18px;border:1px solid #2a2622;border-radius:12px;overflow:hidden;background:#0b0a09}
  .mrm .mrs-card .mrs-img{display:block;width:100%;height:auto;max-width:none;aspect-ratio:1200/630;object-fit:cover;background:#15130f}
  .mrm .mrs-card .mrs-text{padding:11px 14px 12px;font-size:14px;line-height:20px;color:#c8c1b4;white-space:pre-line;word-break:break-word}
  .mrm .mrs-apps{display:grid;grid-template-columns:repeat(var(--n,6),minmax(0,1fr));gap:2px;margin:0 -6px}
  .mrm .mrs-apps a,.mrm .mrs-apps button{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 2px 6px;border:0;border-radius:10px;background:none;color:#c8c1b4;font:inherit;font-size:12.5px;line-height:16px;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent;min-width:0}
  .mrm .mrs-apps a:hover,.mrm .mrs-apps button:hover{background:#1c1a17;color:#ede8de}
  .mrm .mrs-apps a > span:last-child,.mrm .mrs-apps button > span:last-child{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .mrm .mrs-apps a:focus-visible,.mrm .mrs-apps button:focus-visible,.mrm .mrs-link button:focus-visible{outline:2px solid #f0c27a;outline-offset:2px}
  .mrm .mrs-ic{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;flex:none;transition:transform .15s}
  .mrm .mrs-apps a:hover .mrs-ic,.mrm .mrs-apps button:hover .mrs-ic{transform:scale(1.06)}
  .mrm .mrs-ic svg{display:block}
  .mrm .mrs-ic.mrs-wa{background:#25d366}.mrm .mrs-ic.mrs-wa svg{width:26px;height:26px}
  .mrm .mrs-ic.mrs-tg svg,.mrm .mrs-ic.mrs-fb svg{width:48px;height:48px}
  .mrm .mrs-ic.mrs-x{background:#000;box-shadow:inset 0 0 0 1px #3a3530}.mrm .mrs-ic.mrs-x svg{width:19px;height:19px}
  .mrm .mrs-ic.mrs-em,.mrm .mrs-ic.mrs-sh{background:#26231f;box-shadow:inset 0 0 0 1px #3a3530;color:#ede8de}.mrm .mrs-ic.mrs-em svg,.mrm .mrs-ic.mrs-sh svg{width:21px;height:21px}
  .mrm .mrs-link{display:flex;align-items:center;gap:8px;margin:16px 0 0;padding:5px 5px 5px 16px;border:1px solid #312d29;border-radius:999px;background:#0b0a09}
  .mrm .mrs-link .mrs-url{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:13px/20px "Geist Mono",ui-monospace,monospace;color:#f0c27a}
  .mrm .mrs-link button{display:inline-flex;align-items:center;gap:8px;flex:none;min-height:38px;padding:6px 16px;border:0;border-radius:999px;background:#ede8de;color:#0b0a09;font:500 14px/20px inherit;font-family:inherit;cursor:pointer;white-space:nowrap}
  .mrm .mrs-link button:hover{background:#fff5e2}
  .mrm .mrs-link button svg{width:15px;height:15px}
  .mrm .mrs-link button.done{background:#4d8a4a;color:#f3f7f1}
  .mrm .cpbox{width:100%;margin:10px 0 0;font:12.5px "Geist Mono",ui-monospace,monospace;background:#0b0a09;color:#ede8de;border:1px solid #312d29;border-radius:6px;padding:8px 10px}
  @media (max-height:520px){.mrm{padding:8px}.mrm .box{width:min(560px,100%);padding:14px 18px 14px;max-height:calc(100dvh - 16px)}.mrm h2{font-size:19px;line-height:24px}.mrm .lead{display:none}
    .mrm .x{top:6px;right:6px}.mrm .mrs-card{display:flex;align-items:center;margin:10px 0}.mrm .mrs-card .mrs-img{width:132px;height:auto;flex:none}.mrm .mrs-card .mrs-text{padding:0 12px;margin:6px 0;font-size:13px;line-height:18px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .mrm .mrs-apps a,.mrm .mrs-apps button{gap:4px;padding:4px 2px}.mrm .mrs-ic{width:40px;height:40px}.mrm .mrs-ic.mrs-tg svg,.mrm .mrs-ic.mrs-fb svg{width:40px;height:40px}.mrm .mrs-link{margin-top:10px}}
  @media (max-width:430px){.mrm .box{padding:20px 16px 16px}.mrm .mrs-apps{margin:0 -8px;gap:0}.mrm .mrs-apps a,.mrm .mrs-apps button{font-size:11px;letter-spacing:-.1px;gap:7px;padding:8px 0 6px}.mrm .mrs-ic{width:44px;height:44px}.mrm .mrs-ic.mrs-tg svg,.mrm .mrs-ic.mrs-fb svg{width:44px;height:44px}.mrm .mrs-ic.mrs-wa svg{width:24px;height:24px}}
  @media (max-width:340px){.mrm .mrs-apps{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:6px}}
  .mrm .faces{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0 4px}
  .mrm .face{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 6px 12px;border-radius:10px;border:1px solid #312d29;background:transparent;color:#8d867b;cursor:pointer;font:inherit;font-size:13px;line-height:18px;transition:background .15s,border-color .15s,color .15s}
  .mrm .face svg{width:36px;height:36px;transition:transform .15s}
  .mrm .face span{color:#c8c1b4}
  .mrm .face:hover{background:#1a1816;color:#ede8de}
  .mrm .face:hover svg{transform:scale(1.06)}
  .mrm .face[aria-pressed=true]{border-color:#f0c27a;background:rgba(240,194,122,.08);color:#f0c27a}
  .mrm .face[aria-pressed=true] span{color:#ede8de}
  .mrm .face:focus-visible{outline:2px solid #f0c27a;outline-offset:2px}
  .mrm .more{margin-top:16px}
  .mrm .more[hidden]{display:none}
  @media (max-height:520px){.mrm .faces{margin-top:10px}.mrm .face{padding:10px 6px 8px;gap:4px}.mrm .face svg{width:28px;height:28px}.mrm .more{margin-top:10px}.mrm textarea{min-height:56px}.mrm .seg button{min-height:32px}.mrm .more ~ .fine{display:none}}
  .mrq{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font:inherit;color:inherit}
  .mrq .q{font-size:14px;color:#8d867b}
  .mrq .fs{display:inline-flex;gap:4px}
  .mrq button{width:40px;height:40px;display:grid;place-items:center;border-radius:999px;border:1px solid transparent;background:transparent;color:#8d867b;cursor:pointer;padding:0;transition:background .15s,color .15s,border-color .15s}
  .mrq button svg{width:26px;height:26px}
  .mrq button:hover{background:rgba(237,232,222,.08);color:#ede8de}
  .mrq button:focus-visible{outline:2px solid #f0c27a;outline-offset:2px}
  .mrq .thanks{font-size:14px;color:#8d867b}
  .mr-end-faces{margin:20px 0 0}.mr-end-faces .mrq{justify-content:flex-start;gap:10px}.mr-end-faces .mrq button{margin-left:-2px}
  .mr-pause-faces{margin:18px 0 0;padding-top:14px;border-top:1px solid rgba(237,232,222,.1)}.mr-pause-faces .mrq{justify-content:flex-start;gap:10px}
  .mra{display:inline-flex;align-items:center;gap:8px;position:relative}
  .mra .av{width:34px;height:34px;border-radius:50%;background:#221f1c center/cover;border:1px solid #312d29;display:grid;place-items:center;font-size:13px;color:#ede8de;cursor:pointer;padding:0}
  .mra .menu{position:absolute;right:0;top:44px;min-width:220px;background:#161412;border:1px solid #312d29;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.55);padding:8px;display:flex;flex-direction:column;z-index:60}
  .mra .menu[hidden]{display:none}
  .mra .menu .who{padding:6px 10px 10px;border-bottom:1px solid #24211e;margin-bottom:6px;font-size:14px;line-height:20px}
  .mra .menu .who small{display:block;color:#8d867b;font-size:12.5px}
  .mra .menu button,.mra .menu a{background:none;border:0;text-align:left;color:#c8c1b4;padding:10px 10px;border-radius:4px;cursor:pointer;font:inherit;font-size:14px;text-decoration:none}
  .mra .menu button:hover,.mra .menu a:hover{background:#1a1816;color:#ede8de}
  .mrbar{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147482000;display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;padding:12px 44px 12px 14px;background:#161412;border:1px solid #534e47;border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.6);font:400 13.5px/19px "Geist",ui-sans-serif,system-ui,-apple-system,sans-serif;color:#ede8de}
  .mrbar span{flex:1 1 220px}
  .mrbar .b{display:inline-flex;align-items:center;min-height:40px;padding:6px 14px;border-radius:999px;border:0;background:#ede8de;color:#0b0a09;font:500 14px inherit;font-family:inherit;text-decoration:none;cursor:pointer;white-space:nowrap}
  .mrbar .x{position:absolute;right:2px;top:2px;background:none;border:0;color:#8d867b;font-size:22px;padding:10px;cursor:pointer;line-height:1}`;
  function ensureCss() { if (document.getElementById('mrcss')) return; const s = document.createElement('style'); s.id = 'mrcss'; s.textContent = CSS; document.head.appendChild(s); }
  const GOOGLE = '<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  let openModal = null;
  function modal(html, onMount, opts) {
    ensureCss(); closeModal();
    const el = document.createElement('div'); el.className = 'mrm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="box" tabindex="-1"${opts && opts.focusBox ? ' autofocus' : ''}>${opts && opts.noClose ? '' : '<button class="x" type="button" aria-label="Close">&times;</button>'}${html}</div>`;
    document.body.appendChild(el); openModal = el;
    const x = el.querySelector('.x'); if (x) x.onclick = closeModal;
    el.addEventListener('click', e => { if (e.target === el && !(opts && opts.noClose)) closeModal(); });
    el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape' && !(opts && opts.noClose)) closeModal(); });
    el.addEventListener('keyup', e => e.stopPropagation());
    // the game listens for pointer and mouse presses on the page: keep presses inside the dialog
    ['pointerdown', 'mousedown'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
    el._onClose = opts && opts.onClose;
    onMount && onMount(el);
    if (!coarse) setTimeout(() => { const f = el.querySelector('[autofocus]') || el.querySelector('.box'); f && f.focus({ preventScroll: true }); }, 30);
    return el;
  }
  function closeModal() {
    if (!openModal) return;
    const el = openModal; openModal = null; el.remove();
    if (el._onClose) try { el._onClose(); } catch (e) {}
  }

  // in an in-app browser: how to get this page into a real browser
  function outHtml(cls) {
    return IS_ANDROID ? `<a class="${cls}" href="${esc(openInBrowserUrl())}" data-out="android">Open in Chrome</a>`
      : `<button class="${cls}" type="button" data-out="copy">Copy link for ${BROWSER}</button>`;
  }
  function bindOut(root) {
    const c = root.querySelector('[data-out=copy]');
    if (c) c.onclick = () => copyText(ENTRY.href).then(ok => { track('inapp_out', { app: IN_APP, how: 'copy' }); c.textContent = ok ? `Copied. Paste it into ${BROWSER}` : ENTRY.href; });
    const a = root.querySelector('[data-out=android]');
    if (a) a.addEventListener('click', () => { track('inapp_out', { app: IN_APP, how: 'chrome' }); flush(true); });
  }

  // next: where Google brings you back to (a room's page when a door asked for sign-in)
  function signInDialog(reason, next) {
    track('signin_prompt', { where: reason || CFG.page, inapp: IN_APP || undefined });
    const nx = safeNext(next) || safeNext(new URLSearchParams(location.search).get('next'));
    const required = reason === 'required' || CFG.requireLogin, title = required ? 'Sign in to play' : 'Sign in';
    const lead = required ? 'One step with Google and you’re in. Your escapes are kept on every device you use.' : 'Keep your escapes on every device. You can still play without an account.';
    if (IN_APP) {
      modal(`<h2>${title}</h2><p>${esc(lead)}</p>
        <p>Google doesn't allow signing in inside ${esc(IN_APP)}'s browser. Open this page in ${BROWSER} and sign in there.</p>
        ${outHtml('b')}
        ${IS_IOS ? `<p class="fine">Or tap <b>&middot;&middot;&middot;</b> or the compass at the edge of the screen, then <b>Open in Safari</b> (or <b>Open in browser</b>).</p>` : ''}
        ${CFG.requireLogin ? '' : '<p class="fine"><button class="b ghost" type="button" id="mrGuest">Play as a guest here</button></p>'}`, el => {
        bindOut(el); const g = el.querySelector('#mrGuest'); if (g) g.onclick = closeModal;
      });
      return;
    }
    modal(`<h2>${title}</h2>
      <p>${esc(lead)}</p>
      <label class="chk"><input type="checkbox" id="mrAge"> <span>I'm 18 or older. These rooms have frightening scenes.</span></label>
      <button class="b" type="button" id="mrGo" disabled>${GOOGLE}<span>Continue with Google</span></button>
      <p class="fine">Google shares your name, email address and profile picture with us, nothing else. <a href="/privacy" target="_blank" rel="noopener">Privacy</a> &middot; <a href="/terms" target="_blank" rel="noopener">Terms</a></p>`, el => {
      const age = el.querySelector('#mrAge'), go = el.querySelector('#mrGo');
      age.onchange = () => { go.disabled = !age.checked; };
      go.onclick = () => { go.disabled = true; go.lastElementChild.textContent = 'Opening Google…'; signIn(nx).catch(() => { go.disabled = false; go.lastElementChild.textContent = 'Couldn’t reach Google. Try again'; }); };
    });
  }
  // before going into a room: if the site needs a sign-in and this visitor hasn't one, ask right here
  function gate(href) {
    if (!CFG.requireLogin || !known || me) return false;
    signInDialog('required', href);
    return true;
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

  // a slim bar at the bottom when the page was opened inside another app's browser
  function inAppBar() {
    if (SS.get('mr.inapp.off') || document.getElementById('mrbar')) return;
    ensureCss();
    const bar = document.createElement('div'); bar.className = 'mrbar'; bar.id = 'mrbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Open in your browser');
    bar.innerHTML = `<span>You're in ${esc(IN_APP)}'s built-in browser. Sign-in and full screen work in ${BROWSER}.</span>${outHtml('b')}<button class="x" type="button" aria-label="Dismiss">&times;</button>`;
    document.body.appendChild(bar); bindOut(bar);
    bar.querySelector('.x').onclick = () => { SS.set('mr.inapp.off', '1'); bar.remove(); };
    track('inapp_seen', { app: IN_APP });
  }

  /* the account chip in the nav (#mrAccount) */
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
      <button type="button" data-a="share">Share ${esc(CFG.siteName)}</button><button type="button" data-a="fb">Send feedback</button>
      <button type="button" data-a="out">Sign out</button><button type="button" data-a="del">Delete my account</button></span></span>`;
    const av = host.querySelector('.av'), menu = host.querySelector('.menu');
    av.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; av.setAttribute('aria-expanded', String(!menu.hidden)); };
    document.addEventListener('click', e => { if (!host.contains(e.target)) { menu.hidden = true; av.setAttribute('aria-expanded', 'false'); } });
    host.querySelector('[data-a=out]').onclick = signOut;
    host.querySelector('[data-a=share]').onclick = () => { menu.hidden = true; openShare({ kind: 'site', surface: 'account' }); };
    host.querySelector('[data-a=fb]').onclick = () => { menu.hidden = true; feedback({ from: 'site' }); };
    host.querySelector('[data-a=del]').onclick = () => {
      menu.hidden = true;
      modal(`<h2>Delete your account?</h2><p>This removes your account, your saved results, share links and feedback from our server. It can't be undone. Results kept in this browser stay here.</p>
        <button class="b" type="button" id="mrDel">Delete my account</button>`, el => {
        el.querySelector('#mrDel').onclick = () => api('/api/me/delete', {}).then(() => { LS.del(RES_KEY); location.href = '/'; }).catch(() => { el.querySelector('#mrDel').textContent = 'Something went wrong. Try again'; });
      });
    };
  }

  /* ---------- feedback: three faces, then a line if they want ----------
     Picking a face is the feedback; the words are optional. A face picked and then closed is still sent. */
  const FACE_SVG = {
    bad: '<path d="M8.5 16.4c.9-1.15 2.1-1.75 3.5-1.75s2.6.6 3.5 1.75"/>',
    okay: '<path d="M8.75 15.25h6.5"/>',
    good: '<path d="M8.5 14.1c.9 1.35 2.1 2.05 3.5 2.05s2.6-.7 3.5-2.05"/>',
  };
  const faceSvg = f => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.25"/><circle cx="9" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none"/>${FACE_SVG[f]}</svg>`;
  const FACES = ['bad', 'okay', 'good'];
  const faceWords = end => end
    ? { bad: 'Didn’t like it', okay: 'It was okay', good: 'Loved it' }
    : { bad: 'Not great', okay: 'Okay', good: 'Good' };
  const faceAsk = end => end
    ? { bad: 'What put you off?', okay: 'What would have made it better?', good: 'What did you like most?' }
    : { bad: 'What went wrong?', okay: 'What would make it better?', good: 'What’s working for you?' };
  const sentFrom = {};   // "room|from" -> true once a face row has been answered on this page

  function feedback(ctx) {
    ctx = ctx || {};
    const end = ctx.from === 'end', room = ctx.room || pageRoom;
    const words = faceWords(end), ask = faceAsk(end);
    let face = FACES.includes(ctx.face) ? ctx.face : '', diff = '', sent = false;
    const st = ctx.state || (getState && (() => { try { return getState(); } catch (e) { return null; } })());
    const post = text => api('/api/feedback', { anon, room, play: room ? plays[room] || null : null, kind: end ? 'rating' : 'note', face: face || null, difficulty: diff || null, text,
      context: { from: ctx.from || CFG.page, step: st ? st.solved.length : null, seconds: st ? st.elapsed : null, hints: st ? st.hints : null, w: innerWidth, h: innerHeight } })
      .then(r => { track('feedback_sent', { kind: end ? 'rating' : 'note', face: face || null, words: !!text }, room); ctx.onSent && ctx.onSent(face); return r; });
    const title = end ? 'How was this room?' : ctx.from === 'pause' ? 'How’s this room going?' : room ? 'What do you think of this room?' : 'How are we doing?';
    modal(`<h2>${title}</h2>
      <div class="faces" role="group" aria-label="${esc(title)}">${FACES.map(f => `<button type="button" class="face" data-v="${f}" aria-pressed="${f === face}">${faceSvg(f)}<span>${esc(words[f])}</span></button>`).join('')}</div>
      <div class="more" id="mrMore"${face ? '' : ' hidden'}>
        ${end ? `<span class="lab">Difficulty</span><div class="seg" id="mrDiff">${['Too easy', 'Just right', 'Too hard'].map(d => `<button type="button" data-v="${d}" aria-pressed="false">${d}</button>`).join('')}</div>` : ''}
        <span class="lab" id="mrAsk">${esc(face ? ask[face] : '')}</span>
        <textarea id="mrTxt" maxlength="2000" placeholder="Optional. A line or two is plenty"${face ? ' autofocus' : ''}></textarea>
        <button class="b" type="button" id="mrSend">Send</button>
      </div>
      ${room ? '<p class="fine">We attach the room and the step you were on.</p>' : ''}`, el => {
      const more = el.querySelector('#mrMore'), txt = el.querySelector('#mrTxt'), send = el.querySelector('#mrSend');
      el.querySelector('.faces').onclick = e => {
        const b = e.target.closest('.face'); if (!b) return;
        face = b.dataset.v;
        el.querySelectorAll('.face').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        el.querySelector('#mrAsk').textContent = ask[face];
        const first = more.hidden; more.hidden = false;
        if (first) setTimeout(() => txt.focus(), 0);
      };
      const g = el.querySelector('#mrDiff');
      if (g) g.onclick = e => { const b = e.target.closest('button'); if (!b) return; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); diff = b.dataset.v; };
      txt.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send.click(); });
      send.onclick = () => {
        if (!face) return;
        send.disabled = true; sent = true;
        post(txt.value.trim())
          .then(() => {
            el.querySelector('.box').innerHTML = `<h2>Thank you</h2><p>${txt.value.trim() ? 'Got it, thanks.' : 'Noted. That helps more than you’d think.'}</p><button class="b" type="button" id="mrDone" autofocus>Close</button>`;
            el.querySelector('#mrDone').onclick = closeModal; el.querySelector('#mrDone').focus();
          })
          .catch(() => { sent = false; send.disabled = false; send.textContent = 'Couldn’t send. Try again'; });
      };
    }, { focusBox: !face, onClose: () => { if (face && !sent) { sent = true; post('').catch(() => {}); } } });
  }

  /* a row of three faces under a question, for the pause card and the end screen; a face opens the form with it picked */
  function faceRow(host, ctx) {
    if (!host) return null;
    ensureCss();
    ctx = ctx || {};
    const end = ctx.from === 'end', key = `${ctx.room || pageRoom}|${ctx.from}`, words = faceWords(end);
    const thanks = () => { host.innerHTML = '<div class="mrq"><span class="thanks">Thanks for telling us.</span></div>'; };
    if (sentFrom[key]) { thanks(); return host; }
    host.innerHTML = `<div class="mrq"><span class="q">${esc(ctx.question || (end ? 'How was this room?' : 'How’s it going?'))}</span><span class="fs">${FACES.map(f => `<button type="button" data-v="${f}" aria-label="${esc(words[f])}" title="${esc(words[f])}">${faceSvg(f)}</button>`).join('')}</span></div>`;
    host.querySelector('.fs').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      feedback(Object.assign({}, ctx, { face: b.dataset.v, state: typeof ctx.state === 'function' ? ctx.state() : ctx.state, onSent: () => { sentFrom[key] = true; thanks(); } }));
    };
    return host;
  }

  /* any element with data-mr-fb opens the form (the corridor's footer, a room's screen) */
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-mr-fb]');
    if (!t) return;
    e.preventDefault();
    feedback({ from: t.dataset.mrFb || CFG.page, room: pageRoom || null });
  });
  /* any element with data-mr-share opens the share panel (a room's screen: "Dare a friend"), before the game has loaded too */
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-mr-share]');
    if (!t) return;
    e.preventDefault();
    const d = t.dataset;
    openShare({ kind: d.mrShare || 'site', room: d.room || pageRoom || null, n: d.n ? Number(d.n) : undefined, title: d.title, tagline: d.tagline, surface: d.surface || CFG.page });
  });

  /* ---------- sharing ----------
     openShare({ kind: 'site' | 'room' | 'result', room, n, title, tagline, text, surface, result })
     Each person gets one link per room (or for the site), so the dashboard can follow what a share led to;
     every button adds ?via=<app> to it. Results use /r/<code>; rooms and the site use /i/<code>. */
  const CHANNELS = [
    { id: 'wa', label: 'WhatsApp', href: m => `https://wa.me/?text=${enc(m.text + '\n' + m.url('wa'))}` },
    { id: 'tg', label: 'Telegram', href: m => `https://t.me/share/url?url=${enc(m.url('tg'))}&text=${enc(m.text)}` },
    { id: 'x', label: 'X', href: m => `https://twitter.com/intent/tweet?text=${enc(m.short)}&url=${enc(m.url('x'))}` },
    { id: 'fb', label: 'Facebook', href: m => `https://www.facebook.com/sharer/sharer.php?u=${enc(m.url('fb'))}` },
    { id: 'em', label: 'Email', href: m => `mailto:?subject=${enc(m.subject)}&body=${enc(m.text + '\n\n' + m.url('em'))}`, self: true },
  ];
  // each app's own mark (shapes from Simple Icons, CC0); email and the phone's share sheet get plain glyphs
  const ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
    tg: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.4" fill="#fff"/><path fill="#26a5e4" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.4" fill="#fff"/><path fill="#0866ff" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>',
    em: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.8 6.6 8.2 6.4 8.2-6.4"/></svg>',
    sh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3.5M8 7.2l4-4 4 4M5.5 11v9.5h13V11"/></svg>',
    link: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6.6 9.4l2.8-2.8M7.3 4.3l1.3-1.3a2.8 2.8 0 0 1 4 4l-1.3 1.3M8.7 11.7 7.4 13a2.8 2.8 0 0 1-4-4l1.3-1.3"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8.4 3.2 3.1L13 4.6"/></svg>',
  };
  // the site's logo, the white door
  const DOOR = '<svg class="mrs-logo" viewBox="3.2 1.2 15.6 20.6" aria-hidden="true"><rect x="4" y="2" width="14" height="19" rx="1" fill="none" stroke="#ede8de" stroke-width="1.6"/><rect x="5.6" y="3.6" width="10.8" height="17.4" fill="#ede8de"/><circle cx="14.2" cy="12.4" r=".95" fill="#161412"/></svg>';
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
    try { const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok; } catch (e) { return false; }
  }
  function linkKey(kind, room) { return kind === 'result' ? 'mr.share.' + room : `mr.inv.${kind}.${room || ''}`; }
  async function getCode(o) {
    const key = linkKey(o.kind, o.room);
    let code = LS.get(key); if (code) return code;
    if (o.kind === 'result' && finishing) { await finishing; code = LS.get(key); if (code) return code; }
    const r = o.result || {};
    const res = await api('/api/share', { anon, kind: o.kind, room: o.room || null, surface: o.surface || null, time: r.time, hints: r.hints, wrong: r.wrong, marks: r.marks });
    if (res && res.code) { LS.set(key, res.code); return res.code; }
    return null;
  }
  function message(o) {
    const site = CFG.siteName || 'Deadbolt', origin = location.origin;
    let text, short, subject, heading, lead = '';
    if (o.kind === 'result') {
      // just that you got out, and a link to the same room: no time or hints
      text = `I got out of ${o.title || 'a room'} on ${site}. Can you?`;
      short = text; subject = text;
      heading = 'Share your result'; lead = 'Tell your friends you got out, with a link to try the same room. Nothing that gives the puzzles away.';
    } else if (o.kind === 'room') {
      text = `${o.title}${o.n ? ` · ${site} #${o.n}` : ''}\n${o.tagline || ''}\nThink you can get out?`.replace(/\n\n/g, '\n');
      short = `${o.title} (${site}). ${o.tagline || ''} Think you can get out?`.slice(0, 230);
      subject = `Try this: ${o.title} on ${site}`;
      heading = 'Send this room to a friend'; lead = 'They get the door and the story, nothing that gives the puzzles away.';
    } else {
      text = `${site}: horror mystery rooms.`;
      short = text; subject = `${site}: horror mystery rooms`;
      heading = `Share ${site}`;
    }
    const fallback = o.kind === 'site' ? origin + '/' : `${origin}/m/${o.room}`;
    const m = { text, short, subject, heading, lead, code: null };
    m.base = () => (m.code ? `${origin}/${o.kind === 'result' ? 'r' : 'i'}/${m.code}` : fallback);
    m.url = via => m.base() + (via ? `${m.base().includes('?') ? '&' : '?'}via=${via}` : '');
    // the same picture the apps will show under the link
    const v = 'v=' + encodeURIComponent(CFG.version || '');
    m.image = () => (o.kind === 'result' && m.code ? `/og/r/${m.code}.jpg?${v}` : o.kind === 'site' ? `/og/site.jpg?${v}` : `/og/m/${o.room}.jpg?${v}`);
    return m;
  }
  function openShare(o) {
    o = Object.assign({ kind: 'site' }, o || {});
    if (o.kind !== 'site' && !o.room) o.kind = 'site';
    const m = message(o), room = o.room || null, canSheet = !!navigator.share;
    track('share_open', { kind: o.kind, surface: o.surface || CFG.page }, room);
    const sent = channel => { track('share_click', { channel, code: m.code, kind: o.kind, surface: o.surface || CFG.page }, room); flush(true); };
    const app = (id, label, tag = 'a') => `<${tag} ${tag === 'a' ? 'href="#"' : 'type="button"'} data-ch="${id}"><span class="mrs-ic mrs-${id}">${ICON[id]}</span><span>${esc(label)}</span></${tag}>`;
    const apps = CHANNELS.map(c => app(c.id, c.label).replace('<a ', `<a ${c.self ? '' : 'target="_blank" rel="noopener" '}`));
    // On phones that can share files, every app sends the picture with the text and link as its caption, through
    // the phone's share sheet (a web page can't attach a picture to a WhatsApp or X link). Elsewhere the apps get
    // the link, and the picture arrives as its preview.
    const canPic = coarse && canSheet && !!navigator.canShare && (() => { try { return navigator.canShare({ files: [new File([new Uint8Array(8)], 'x.jpg', { type: 'image/jpeg' })] }); } catch (e) { return false; } })();
    if (canSheet && !canPic) apps.push(app('sh', 'More', 'button'));
    const copyLabel = o.kind === 'result' ? 'Copy result' : 'Copy link';
    modal(`<div class="mrs-head">${DOOR}<h2>${esc(m.heading)}</h2></div>${m.lead ? `<p class="lead">${esc(m.lead)}</p>` : ''}
      <div class="mrs-card"><img class="mrs-img" id="mrCi" src="${esc(m.image())}" alt="" width="1200" height="630" decoding="async"><div class="mrs-text">${esc(m.text)}</div></div>
      <div class="mrs-apps" style="--n:${apps.length}">${apps.join('')}</div>
      <div class="mrs-link"><span class="mrs-url" id="mrLu"></span><button type="button" data-ch="cp">${ICON.link}<span>${copyLabel}</span></button></div>
      <input class="cpbox" id="mrCp" readonly hidden aria-label="Link to copy">`, el => {
      const paint = () => {
        el.querySelector('#mrLu').textContent = m.base().replace(/^https?:\/\//, '');
        CHANNELS.forEach(c => { const a = el.querySelector(`[data-ch="${c.id}"]`); if (a) a.href = c.href(m); });
        // a result's own card (the room, and that you got out) once its link exists; swap only when it has loaded
        const ci = el.querySelector('#mrCi'), want = m.image();
        if (ci && !ci.src.endsWith(want)) { const pre = new Image(); pre.onload = () => { if (openModal === el) ci.src = want; }; pre.src = want; }
        if (canPic && want !== picUrl && (o.kind !== 'result' || m.code)) {
          picUrl = want;
          fetch(want).then(r => (r.ok ? r.blob() : null)).then(b => {
            if (!b || openModal !== el || picUrl !== want) return;
            pic = new File([b], `${(CFG.siteName || 'deadbolt').toLowerCase()}-${o.room || 'rooms'}.jpg`, { type: 'image/jpeg' });
          }).catch(() => {});
        }
      };
      let pic = null, picUrl = null;
      paint();
      getCode(o).then(code => { if (code) { m.code = code; if (openModal === el) paint(); } }).catch(() => {});
      el.querySelector('.box').addEventListener('click', e => {
        const t = e.target.closest('[data-ch]'); if (!t) return;
        const ch = t.dataset.ch;
        if (ch === 'cp') {
          e.preventDefault();
          const what = o.kind === 'result' ? `${m.text}\n${m.url('cp')}` : m.url('cp');
          copyText(what).then(ok => {
            sent('cp');
            if (ok) { t.classList.add('done'); t.innerHTML = `${ICON.check}<span>Copied</span>`; setTimeout(() => { if (openModal === el) { t.classList.remove('done'); t.innerHTML = `${ICON.link}<span>${copyLabel}</span>`; } }, 2400); }
            else { const box = el.querySelector('#mrCp'); box.hidden = false; box.value = what; box.focus(); box.select(); t.lastElementChild.textContent = 'Copy below'; }
          });
          return;
        }
        // the picture and the link together (until the picture has loaded, the app's own link is used)
        const withPic = canPic && pic && CHANNELS.some(c => c.id === ch) && { files: [pic], text: `${m.text}\n${m.url(ch)}` };
        if (withPic && navigator.canShare(withPic)) {
          e.preventDefault();
          navigator.share(withPic).then(() => sent(ch), err => { if (!err || err.name !== 'AbortError') track('share_fail', { channel: ch, kind: o.kind, pic: 1 }, room); });
          return;
        }
        if (ch === 'sh') {
          e.preventDefault();
          const data = { title: m.subject, text: m.text, url: m.url('sh') };
          navigator.share(data).then(() => sent('sh'), err => { if (!err || err.name !== 'AbortError') track('share_fail', { channel: 'sh', kind: o.kind }, room); });
          return;
        }
        sent(ch);   // the link itself opens WhatsApp, X... (a real link, so phones hand it to the app)
      });
    }, { focusBox: true });
  }
  // the game's end screen ("Share your result")
  async function share(d) {
    openShare({ kind: 'result', room: d.room, n: d.n, title: d.title, text: d.text, surface: 'end', result: { time: d.time, hints: d.hints, wrong: d.wrong, marks: d.marks } });
    return { msg: '' };
  }

  /* on the game's end screen: "How was this room?" with three faces, under the main buttons */
  function watchEnd() {
    const end = document.getElementById('end'), btn = document.getElementById('bShare');
    if (!end || !btn) return;
    const add = () => {
      if (end.hidden || document.getElementById('mrEndFaces')) return;
      const row = document.createElement('div'); row.id = 'mrEndFaces'; row.className = 'mr-end-faces';
      const room = (last && last.room) || pageRoom;
      const links = document.getElementById('endLinks');
      (links || btn.parentElement).insertAdjacentElement(links ? 'beforebegin' : 'afterend', row);
      faceRow(row, { from: 'end', room });
    };
    new MutationObserver(add).observe(end, { attributes: true, attributeFilter: ['hidden'] });
    add();
  }

  /* ---------- the bridge the game calls ---------- */
  window.MR = {
    v: 1, anon, ready, track, flush, feedback, faceRow, signInDialog, openShare, gate, inApp: IN_APP,
    get me() { return me; },
    attach(fn) { getState = fn; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEnd); else watchEnd(); },
    emit(name, d) {
      d = d || {};
      if (name === 'room_start') { startPlay(d.room, d.cont); track('room_start', { cont: !!d.cont }, d.room); flush(); const bar = document.getElementById('mrbar'); if (bar) bar.remove(); closeModal(); }
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
  // the game page needs an account when the site says so: sign in on that room's door, then come straight back
  if (CFG.page === 'game' && CFG.requireLogin) ready.then(() => {
    if (!me) location.href = `/m/${encodeURIComponent(pageRoom || CFG.room || '')}?signin=required&next=${enc(location.pathname + location.search)}`;
  });
  if (CFG.page === 'site' || CFG.page === 'result') {
    const q = new URLSearchParams(location.search);
    if (q.get('signin')) ready.then(() => { if (!me) signInDialog(q.get('signin') === 'required' ? 'required' : 'nav'); });
  }
  if (tracked) track('page_view', { path: location.pathname, ref: document.referrer ? (() => { try { return new URL(document.referrer).host; } catch (e) { return null; } })() : null, inapp: IN_APP || undefined });
})();
