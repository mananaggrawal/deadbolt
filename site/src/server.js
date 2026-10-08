// Deadbolt web server: landing page, the game, Google sign-in, tracking, share pages, dashboard.
// On Vercel this file's default export is the function; locally `node src/local.js` serves it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cfg } from './config.js';
import { pool, q, one, rows } from './db.js';
import { auth, sessionOf, isAdmin } from './auth.js';
import { runMaintenance } from './maintenance.js';
import { landingHtml as LANDING, playHtml as PLAY } from './generated/assets.js';
import * as R from './rooms.js';
import * as og from './og.js';
import { headTags, resultPage, privacyPage, termsPage, gatePage, notFoundPage, esc } from './pages.js';
import { adminOptions, adminPage, adminLoginPage, exportCsv } from './admin.js';

export const app = new Hono();

/* ---------- small helpers ---------- */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/;
const uuidOr = v => (typeof v === 'string' && UUID.test(v) ? v.toLowerCase() : null);
const int = (v, lo, hi) => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? null : Math.min(hi, Math.max(lo, Math.round(+v))));
const ipOf = c => c.req.header('x-real-ip') || (c.req.header('x-forwarded-for') || '').split(',')[0].trim() || c.req.header('cf-connecting-ip') || 'local';
// Vercel names the visitor's country in x-vercel-ip-country (Cloudflare's header kept as a fallback)
const countryOf = c => { const v = (c.req.header('x-vercel-ip-country') || c.req.header('cf-ipcountry') || '').toUpperCase(); return /^[A-Z]{2}$/.test(v) && v !== 'XX' && v !== 'T1' ? v : null; };
// crawlers, link-preview fetchers and headless browsers; in-app browsers (LinkedIn, Instagram, X) are real people and pass
const isBot = ua => !ua || /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp\/|embedly|preview|headless|lighthouse|pagespeed|curl|wget|python|go-http|axios|node-fetch|phantom|selenium|puppeteer|playwright/i.test(ua);
function deviceOf(ua = '') {
  const kind = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'tablet' : /Mobi|iPhone|iPod|Android/i.test(ua) ? 'phone' : 'desktop';
  const os = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X|Macintosh/i.test(ua) ? 'macOS' : /CrOS/i.test(ua) ? 'ChromeOS' : /Linux/i.test(ua) ? 'Linux' : 'other';
  const br = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /OPR\//.test(ua) ? 'Opera' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'other';
  return `${kind} ${os} ${br}`;
}
const marksStr = m => (Array.isArray(m) ? m.map(x => (typeof x === 'object' && x ? x.lvl : x)).map(l => int(l, 0, 2) ?? 0).join('').slice(0, 30) : '');
const marksJson = m => (Array.isArray(m) ? m.slice(0, 30).map(x => ({ title: String((x && x.title) || '').slice(0, 80), lvl: int(x && typeof x === 'object' ? x.lvl : x, 0, 2) ?? 0 })) : []);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ALPHA = '23456789abcdefghjkmnpqrstuvwxyz';
const newCode = () => Array.from(crypto.randomBytes(6), b => ALPHA[b % ALPHA.length]).join('');
const VIA = /^(wa|tg|x|fb|em|cp|sh|li)$/;                 // the app a share link was sent through (?via=)
const viaOr = v => (typeof v === 'string' && VIA.test(v) ? v : null);
const codeOr = v => (typeof v === 'string' && CODE.test(v.toLowerCase()) ? v.toLowerCase() : null);
const KINDS = ['result', 'room', 'site'];
const htmlEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// simple per-IP limits (one server, so memory is enough)
const buckets = new Map();
function limited(c, key, max, windowMs = 60_000) {
  const k = `${key}:${ipOf(c)}`, now = Date.now();
  let b = buckets.get(k);
  if (!b || now > b.reset) { b = { n: 0, reset: now + windowMs }; buckets.set(k, b); }
  return ++b.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k); }, 60_000).unref();

async function session(c) {
  if (c.get('sess') === undefined) c.set('sess', await sessionOf(c));
  return c.get('sess');
}
async function touchPlayer(anon, userId, c) {
  if (!anon) return;
  await q(`insert into players (anon_id, user_id, device, country) values ($1, $2, $3, $4)
           on conflict (anon_id) do update set last_seen = now(), user_id = coalesce(excluded.user_id, players.user_id),
           device = excluded.device, country = coalesce(excluded.country, players.country)`,
    [anon, userId, deviceOf(c.req.header('user-agent')), countryOf(c)]);
}

/* ---------- headers on every response ---------- */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "connect-src 'self'",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join('; ');
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  if ((c.res.headers.get('content-type') || '').startsWith('text/html')) c.header('Content-Security-Policy', CSP);
});
app.use('/api/*', bodyLimit({ maxSize: 64 * 1024, onError: c => c.json({ error: 'too large' }, 413) }));

/* ---------- staging: only admin emails get in ---------- */
const OPEN_PATHS = /^\/(api\/auth\/|api\/me$|api\/cron\/|healthz$|mr\.js$|favicon\.(svg|ico)$|icon-\d+\.png$|apple-touch-icon\.png$|art\/|privacy$|terms$)/;
app.use('*', async (c, next) => {
  if (!cfg.staging || OPEN_PATHS.test(c.req.path)) return next();
  const s = await session(c);
  if (isAdmin(s)) return next();
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'staging' }, 403);
  c.header('X-Robots-Tag', 'noindex');
  return c.html(gatePage(s && s.user.email), 403);
});

/* ---------- Google sign-in (Better Auth) ---------- */
app.on(['GET', 'POST'], '/api/auth/*', c => {
  if (c.req.method === 'POST' && limited(c, 'auth', 30)) return c.json({ error: 'slow down' }, 429);
  return auth.handler(c.req.raw);
});

/* ---------- static files ----------
   On Vercel, everything in public/ is served by the CDN before a request reaches this function
   (cache headers in vercel.json). These routes only answer when running locally. */
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
function sendFile(c, file, cache) {
  if (!fs.existsSync(file)) return c.html(notFoundPage(), 404);
  const st = fs.statSync(file), etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  c.header('ETag', etag); c.header('Cache-Control', cache);
  c.header('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  if (c.req.header('if-none-match') === etag) return c.body(null, 304);
  return c.body(fs.readFileSync(file));
}
const YEAR = 'public, max-age=31536000, immutable';
const pub = (...p) => path.join(cfg.publicDir, ...p);
app.get('/mr.js', c => sendFile(c, pub('mr.js'), 'public, max-age=300'));
app.get('/favicon.svg', c => sendFile(c, pub('favicon.svg'), 'public, max-age=86400'));
app.get('/favicon.ico', c => sendFile(c, pub('favicon.ico'), 'public, max-age=86400'));
app.get('/apple-touch-icon.png', c => sendFile(c, pub('apple-touch-icon.png'), 'public, max-age=86400'));
app.get('/icon-192.png', c => sendFile(c, pub('icon-192.png'), 'public, max-age=86400'));
app.get('/icon-512.png', c => sendFile(c, pub('icon-512.png'), 'public, max-age=86400'));
app.get('/art/:file{[a-z0-9_-]+\\.jpg}', c => sendFile(c, pub('art', c.req.param('file')), 'public, max-age=2592000'));
app.get('/vendor/three-0.160.0.module.js', c => sendFile(c, pub('vendor', 'three-0.160.0.module.js'), YEAR));
app.get('/game/:file{(vo\\.[0-9a-f]{12}\\.json|app\\.[0-9a-f]{12}\\.js)}', c => sendFile(c, pub('game', c.req.param('file')), YEAR));

app.get('/manifest.webmanifest', c => {
  c.header('Content-Type', 'application/manifest+json'); c.header('Cache-Control', 'public, max-age=86400');
  // the landing page reads best upright and the rooms sideways, so the installed app doesn't fix an orientation
  return c.body(JSON.stringify({ name: cfg.siteName, short_name: cfg.siteName, start_url: '/', display: 'fullscreen', orientation: 'any',
    background_color: '#0b0a09', theme_color: '#0b0a09', icons: [192, 512].map(s => ({ src: `/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })) }));
});
app.get('/robots.txt', c => c.text(cfg.staging ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /r/\nDisallow: /i/\nSitemap: ${cfg.baseURL}/sitemap.xml\n`));
app.get('/sitemap.xml', c => {
  const urls = ['/', ...R.released().map(m => `/m/${m.id}`), '/privacy', '/terms'];
  c.header('Content-Type', 'application/xml');
  return c.body(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${cfg.baseURL}${u}</loc></url>`).join('')}</urlset>\n`);
});
app.get('/healthz', async c => {
  try { await q('select 1'); return c.json({ ok: true, version: cfg.version }); } catch (e) { return c.json({ ok: false }, 503); }
});

/* ---------- the landing page (/, /m/<id> opening one room's door, /i/<code> a shared invite) ---------- */
// the game's code, fetched in the background once someone opens a door (so Begin starts quickly on phones)
const PREFETCH = () => [`/game/${R.appFile()}`, '/vendor/three-0.160.0.module.js'];
function landingHtml(room, { canon = null } = {}) {
  const rel = R.released().map(m => m.id);
  const head = room
    ? headTags({ title: `${room.title} · ${cfg.siteName}`, description: room.tagline || room.hook, path: `/m/${room.id}`, image: `/og/m/${room.id}.jpg`, imageAlt: `${room.title}, a horror mystery room on ${cfg.siteName}`, page: 'site', room: room.id })
    : headTags({ title: `${cfg.siteName} · Horror mystery rooms`, description: 'Horror mystery rooms. Every room has a way out. Not everything in it wants you to find it.', path: '/' });
  // the doors' words come from the game's own room list, so the corridor and the room never disagree
  const words = Object.fromEntries(R.allRooms().map(m => [m.id, { title: m.title, place: m.place, era: m.era, mins: m.mins, hook: m.hook, tagline: m.tagline, start: m.start }]));
  const vars = { MR_RELEASED: rel, MR_ROOMS: words, MR_PREFETCH: PREFETCH() };
  if (room) vars.MR_OPEN = room.id;
  if (canon) vars.MR_CANON = canon;
  const js = Object.entries(vars).map(([k, v]) => `window.${k}=${JSON.stringify(v).replace(/</g, '\\u003c')};`).join('');
  return LANDING.replace('<!--MR_HEAD-->', `<script>${js}</script>\n${head}`);   // before mr.js, which reads MR_CANON
}
app.get('/', c => { c.header('Cache-Control', 'no-cache'); return c.html(landingHtml(null)); });
app.get('/m/:id', c => {
  const m = R.roomById(c.req.param('id'));
  if (!m || !R.isReleased(m.id)) return c.html(notFoundPage(), 404);
  c.header('Cache-Control', 'no-cache');
  return c.html(landingHtml(m));
});
// someone's invite: a room's door, or the front page. A link that no longer exists still opens the site.
app.get('/i/:code', async c => {
  const code = codeOr(c.req.param('code'));
  const s = code ? await one('select kind, room from shares where code = $1', [code]).catch(() => null) : null;
  c.header('Cache-Control', 'no-cache'); c.header('X-Robots-Tag', 'noindex');
  const m = s && s.room && R.isReleased(s.room) ? R.roomById(s.room) : null;
  return c.html(m ? landingHtml(m, { canon: `/m/${m.id}` }) : landingHtml(null, { canon: '/' }));
});

/* ---------- the game (/play/<id>) ---------- */
app.get('/play', c => c.redirect('/#rooms'));
app.get('/play/:id', async c => {
  const m = R.roomById(c.req.param('id'));
  if (!m) return c.html(notFoundPage(), 404);
  if (!R.isReleased(m.id)) return c.redirect('/#rooms');
  // sign in on this room's door, then Google brings the player straight back here
  if (cfg.requireLogin && !(await session(c))) { const u = new URL(c.req.url); return c.redirect(`/m/${m.id}?signin=required&next=${encodeURIComponent(`/play/${m.id}${u.search}`)}`); }
  const etag = `"p-${m.id}-${cfg.version}"`;
  c.header('ETag', etag); c.header('Cache-Control', 'no-cache');
  if (c.req.header('if-none-match') === etag) return c.body(null, 304);
  const head = headTags({ title: `${m.title} · ${cfg.siteName}`, description: m.tagline || m.hook, path: `/m/${m.id}`, image: `/og/m/${m.id}.jpg`, imageAlt: `${m.title}, a horror mystery room on ${cfg.siteName}`, page: 'game', room: m.id });
  return c.html(playPage(m, head).replace('<!--MR_BOOT-->', htmlEsc(m.title)));
});
// the room's screen is filled in on the server, so it shows the moment the page arrives (the game takes over once loaded)
function playPage(m, head) {
  const words = {
    id: esc(m.id), n: String(m.n), num: `Mystery #${m.n}`, title: esc(m.title), tagline: esc(m.tagline || ''),
    meta: metaHtml(m), hook: esc(m.hook), loading: esc(m.loading || 'Loading…'), keys: keysHtml(m.keys),
  };
  return PLAY.replace('<!--MR_HEAD-->', head)
    .replace('<div id="app">', `<div id="app" data-theme="${esc(m.theme || '')}">`)
    .replace(/\{\{(\w+)\}\}/g, (all, k) => (k in words ? words[k] : all));
}
// place, night and how long it takes, under the room's title
const ICONS = {
  place: '<path d="M8 14.5s4.5-4.1 4.5-7.9A4.5 4.5 0 0 0 3.5 6.6c0 3.8 4.5 7.9 4.5 7.9Z"/><circle cx="8" cy="6.6" r="1.6"/>',
  night: '<path d="M13 9.6A5.5 5.5 0 1 1 6.4 3a4.3 4.3 0 0 0 6.6 6.6Z"/>',
  time: '<circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/>',
};
const icon = k => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
function metaHtml(m) {
  return [['place', m.place], ['night', m.era], ['time', m.mins]].filter(([, v]) => v)
    .map(([k, v]) => `<span>${icon(k)}${esc(v)}</span>`).join('');
}
// a room's controls as keycaps: the basics first (move, look, use, hints), then what this room adds, then pause
const BASIC = ['Move', 'Look', 'Use', 'Hints'];
function keysHtml(keys) {
  const list = (Array.isArray(keys) && keys.length ? keys : [['Move', 'W A S D'], ['Look', 'Mouse'], ['Interact', 'E or click'], ['Hints', 'H']])
    .map(([label, k]) => ({ label: String(label).replace(/^Interact\b/, 'Use'), k: String(k) }));
  const isBasic = (x, b) => x.label === b || x.label.startsWith(b + ',');
  const ordered = [...BASIC.map(b => list.find(x => isBasic(x, b))).filter(Boolean), ...list.filter(x => !BASIC.some(b => isBasic(x, b))), { label: 'Pause', k: 'Esc' }];
  return ordered.map(({ label, k }) => {
    const [main, alt] = k.split(' or ');
    const caps = main.split(' ').filter(Boolean).map(c => `<kbd>${esc(c)}</kbd>`).join('');
    return `<li><span class="rm-caps">${caps}${alt ? `<span class="rm-alt">or ${esc(alt)}</span>` : ''}</span><span class="rm-kl">${esc(label)}</span></li>`;
  }).join('');
}

/* ---------- share pages and preview cards ---------- */
app.get('/r/:code', async c => {
  const code = c.req.param('code').toLowerCase();
  const s = CODE.test(code) ? await one('select * from shares where code = $1', [code]) : null;
  if (!s || s.kind !== 'result' || !R.roomById(s.room)) return s ? c.redirect(`/i/${code}`) : c.html(notFoundPage(), 404);
  c.header('Cache-Control', 'no-cache');   // visits are counted by the page itself (share_visit), so link previews don't count
  return c.html(resultPage(s));
});
// preview cards: .jpg is what pages point at; .png answers links already shared in apps before the switch
async function sendCard(c, key, build, cache, fmt) {
  const buf = await og.image(key, build, fmt);
  if (!buf) return c.text('not found', 404);
  c.header('Content-Type', fmt === 'png' ? 'image/png' : 'image/jpeg'); c.header('Cache-Control', cache);
  return c.body(buf);
}
const fmtOf = file => (file.endsWith('.png') ? 'png' : 'jpg');
app.get('/og/:file{site\\.(jpg|png)}', c => sendCard(c, `site:${R.released().length}`, () => og.siteCard(), 'public, max-age=3600, s-maxage=3600', fmtOf(c.req.param('file'))));
app.get('/og/m/:file{[a-z0-9_-]+\\.(jpg|png)}', c => {
  const file = c.req.param('file'), id = file.replace(/\.(jpg|png)$/, '');
  return sendCard(c, `m:${id}`, () => (R.isReleased(id) ? og.roomCard(id) : null), 'public, max-age=86400, s-maxage=86400', fmtOf(file));
});
// the same picture a shared result shows, for any open room: the landing page's "Share your result" example
app.get('/og/got/:file{[a-z0-9_-]+\\.(jpg|png)}', c => {
  const file = c.req.param('file'), id = file.replace(/\.(jpg|png)$/, '');
  return sendCard(c, `got:${id}`, () => (R.isReleased(id) ? og.resultCard({ room: id }) : null), 'public, max-age=86400, s-maxage=86400', fmtOf(file));
});
app.get('/og/r/:file{[a-z0-9]{6}\\.(jpg|png)}', async c => {
  const file = c.req.param('file'), code = file.slice(0, 6);
  const s = CODE.test(code) ? await one('select * from shares where code = $1', [code]) : null;
  return sendCard(c, `r:${code}`, () => (s ? og.resultCard(s) : null), `${YEAR}, s-maxage=31536000`, fmtOf(file));
});

/* ---------- legal ---------- */
app.get('/privacy', c => c.html(privacyPage()));
app.get('/terms', c => c.html(termsPage()));

/* ---------- the player's account ---------- */
app.get('/api/me', async c => {
  c.header('Cache-Control', 'no-store');
  const s = await session(c);
  if (!s) return c.json({ user: null });
  const p = await one('select age_confirmed_at from profiles where user_id = $1', [s.user.id]);
  return c.json({ user: { name: s.user.name, email: s.user.email, image: s.user.image }, consented: !!(p && p.age_confirmed_at), admin: isAdmin(s) });
});
app.post('/api/me/consent', async c => {
  const s = await session(c); if (!s) return c.json({ error: 'sign in' }, 401);
  const b = await c.req.json().catch(() => ({}));
  if (b.age !== true) return c.json({ error: 'age' }, 400);
  await q(`insert into profiles (user_id, age_confirmed_at, consented_at) values ($1, now(), now())
           on conflict (user_id) do update set age_confirmed_at = coalesce(profiles.age_confirmed_at, now()), consented_at = now()`, [s.user.id]);
  return c.json({ ok: true });
});
// merge this browser's results into the account (the earliest escape from each room wins) and return the account's
app.post('/api/me/results', async c => {
  const s = await session(c); if (!s) return c.json({ error: 'sign in' }, 401);
  if (limited(c, 'sync', 30)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({})), uid = s.user.id, anon = uuidOr(b.anon);
  for (const [id, r] of Object.entries((b && b.rooms) || {}).slice(0, 100)) {
    if (!R.roomById(id) || !r || !DAY.test(r.day || '')) continue;
    const secs = int(r.time, 0, 86400 * 7); if (secs === null) continue;
    await q(`insert into results (user_id, room, day, seconds, hints, wrong, tiers, marks) values ($1, $2, $3, $4, $5, $6, $7, $8)
             on conflict (user_id, room) do update set day = excluded.day, seconds = excluded.seconds, hints = excluded.hints, wrong = excluded.wrong,
             tiers = excluded.tiers, marks = excluded.marks where results.day > excluded.day`,
      [uid, id, r.day, secs, int(r.hints, 0, 999) || 0, int(r.wrong, 0, 999) || 0, JSON.stringify(r.tiers && typeof r.tiers === 'object' ? r.tiers : {}).slice(0, 4000), JSON.stringify(marksJson(r.marks))]);
  }
  if (anon) {   // this browser's guest plays and share links now belong to the account
    await touchPlayer(anon, uid, c);
    await q('update plays set user_id = $1 where anon_id = $2 and user_id is null', [uid, anon]);
    await q('update shares set user_id = $1 where anon_id = $2 and user_id is null', [uid, anon]);
    await q('update events set user_id = $1 where anon_id = $2 and user_id is null and ts > now() - interval \'90 days\'', [uid, anon]);
    await q('update feedback set user_id = $1 where anon_id = $2 and user_id is null', [uid, anon]);
  }
  const res = await rows('select room, to_char(day, \'YYYY-MM-DD\') as day, seconds, hints, wrong, tiers, marks from results where user_id = $1', [uid]);
  const sh = await rows("select distinct on (room) room, code from shares where user_id = $1 and kind = 'result' order by room, created_at", [uid]);
  return c.json({
    rooms: Object.fromEntries(res.map(r => [r.room, { day: r.day, time: r.seconds, hints: r.hints, wrong: r.wrong, tiers: r.tiers, marks: r.marks }])),
    shares: Object.fromEntries(sh.map(r => [r.room, r.code])),
  });
});
app.post('/api/me/delete', async c => {
  const s = await session(c); if (!s) return c.json({ error: 'sign in' }, 401);
  const uid = s.user.id, client = await pool.connect();
  try {
    await client.query('begin');
    for (const t of ['results', 'shares', 'feedback', 'profiles']) await client.query(`delete from ${t} where user_id = $1`, [uid]);
    await client.query('update plays set user_id = null, anon_id = null where user_id = $1', [uid]);
    await client.query('update events set user_id = null, anon_id = null where user_id = $1', [uid]);
    await client.query('update players set user_id = null where user_id = $1', [uid]);
    await client.query('delete from "user" where id = $1', [uid]);   // sessions and accounts go with it
    await client.query('commit');
  } catch (e) { await client.query('rollback'); throw e; } finally { client.release(); }
  return c.json({ ok: true });
});

/* ---------- plays ---------- */
app.post('/api/plays/start', async c => {
  if (limited(c, 'plays', 60)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const play = uuidOr(b.play), anon = uuidOr(b.anon), room = R.roomById(b.room) ? b.room : null;
  if (!play || !room) return c.json({ error: 'bad request' }, 400);
  // from: the share link this browser first arrived through (kept 30 days), credited with the plays it leads to
  const s = await session(c); if (cfg.requireLogin && !s) return c.json({ error: 'sign in' }, 401);
  const uid = s ? s.user.id : null, from = codeOr(b.from), via = viaOr(b.via);
  await touchPlayer(anon, uid, c);
  const r = await one(`insert into plays (id, room, anon_id, user_id, steps_total, from_share, from_via, device, country, app_version) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           on conflict (id) do update set resumed = true, last_seen = now(), user_id = coalesce(plays.user_id, excluded.user_id)
           returning (xmax = 0) as inserted`,
    [play, room, anon, uid, int(b.steps, 1, 40), from, via, deviceOf(c.req.header('user-agent')), countryOf(c), cfg.version]);
  if (r && r.inserted && from) await q('update shares set plays_started = plays_started + 1 where code = $1', [from]);
  return c.json({ ok: true });
});
async function makeShare({ play = null, uid, anon, room, secs = null, hints = 0, wrong = 0, marks = '', kind = 'result', surface = null }) {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const r = await one(`insert into shares (code, play_id, user_id, anon_id, room, seconds, hints, wrong, marks, kind, surface) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                         on conflict (code) do nothing returning code`, [code, play, uid, anon, room, secs, hints, wrong, marks, kind, surface]);
    if (r) return r.code;
  }
  throw new Error('could not make a share code');
}
// one link per person per room (or for the site, room = null) and kind, reused every time they share it
async function existingShare(uid, anon, room, kind = 'result') {
  if (uid) { const r = await one('select code from shares where user_id = $1 and kind = $2 and room is not distinct from $3 order by created_at limit 1', [uid, kind, room]); if (r) return r.code; }
  if (anon) { const r = await one('select code from shares where anon_id = $1 and kind = $2 and room is not distinct from $3 order by created_at limit 1', [anon, kind, room]); if (r) return r.code; }
  return null;
}
app.post('/api/plays/finish', async c => {
  if (limited(c, 'plays', 60)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const play = uuidOr(b.play), anon = uuidOr(b.anon), room = R.roomById(b.room) ? b.room : null, secs = int(b.time, 0, 86400 * 7);
  if (!play || !room || secs === null) return c.json({ error: 'bad request' }, 400);
  const s = await session(c); if (cfg.requireLogin && !s) return c.json({ error: 'sign in' }, 401);
  const uid = s ? s.user.id : null;
  const hints = int(b.hints, 0, 999) || 0, wrong = int(b.wrong, 0, 999) || 0, marks = marksStr(b.marks), first = b.first === true;
  await q(`insert into plays (id, room, anon_id, user_id, outcome, ended_at, seconds, hints, wrong, marks, steps_done, first_escape, device, country, app_version)
           values ($1, $2, $3, $4, 'escaped', now(), $5, $6, $7, $8, $9, $10, $11, $12, $13)
           on conflict (id) do update set outcome = 'escaped', ended_at = now(), last_seen = now(), seconds = excluded.seconds, hints = excluded.hints,
           wrong = excluded.wrong, marks = excluded.marks, steps_done = greatest(plays.steps_done, excluded.steps_done), first_escape = excluded.first_escape,
           user_id = coalesce(plays.user_id, excluded.user_id)`,
    [play, room, anon, uid, secs, hints, wrong, marks, marks.length, first, deviceOf(c.req.header('user-agent')), countryOf(c), cfg.version]);
  if (uid && first && DAY.test(b.day || '')) {
    await q(`insert into results (user_id, room, day, seconds, hints, wrong, tiers, marks) values ($1, $2, $3, $4, $5, $6, $7, $8) on conflict (user_id, room) do nothing`,
      [uid, room, b.day, secs, hints, wrong, JSON.stringify(b.tiers && typeof b.tiers === 'object' ? b.tiers : {}).slice(0, 4000), JSON.stringify(marksJson(b.marks))]);
  }
  let code = await existingShare(uid, anon, room);
  if (!code && first) code = await makeShare({ play, uid, anon, room, secs, hints, wrong, marks });
  return c.json({ ok: true, code });
});
// a share link: for a room or the whole site (an invite, /i/<code>), or for a result (/r/<code>), including
// results made before the site existed or on a browser that lost its code
app.post('/api/share', async c => {
  if (limited(c, 'share', 30)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const kind = KINDS.includes(b.kind) ? b.kind : 'result';
  const anon = uuidOr(b.anon), room = R.roomById(b.room) ? b.room : null, secs = int(b.time, 0, 86400 * 7);
  const surface = typeof b.surface === 'string' && /^[a-z]{2,16}$/.test(b.surface) ? b.surface : null;
  if (kind === 'result' && (!room || secs === null)) return c.json({ error: 'bad request' }, 400);
  if (kind === 'room' && !room) return c.json({ error: 'bad request' }, 400);
  if (!anon) return c.json({ error: 'bad request' }, 400);
  // results need an account when the site does; inviting someone to a room or the site never does
  const s = await session(c); if (kind === 'result' && cfg.requireLogin && !s) return c.json({ error: 'sign in' }, 401);
  const uid = s ? s.user.id : null, forRoom = kind === 'site' ? null : room;
  let code = await existingShare(uid, anon, forRoom, kind);
  if (!code) code = kind === 'result'
    ? await makeShare({ uid, anon, room, secs, hints: int(b.hints, 0, 999) || 0, wrong: int(b.wrong, 0, 999) || 0, marks: marksStr(b.marks), surface })
    : await makeShare({ uid, anon, room: forRoom, kind, surface });
  await touchPlayer(anon, uid, c);
  return c.json({ code, url: `${cfg.baseURL}/${kind === 'result' ? 'r' : 'i'}/${code}` });
});

/* ---------- events ---------- */
const EVENT = /^[a-z][a-z_]{1,31}$/;
app.post('/api/events', async c => {
  if (limited(c, 'events', 240)) return c.json({ error: 'slow down' }, 429);
  let b; try { b = JSON.parse(await c.req.text()); } catch (e) { return c.json({ error: 'bad json' }, 400); }
  const anon = uuidOr(b.anon), list = Array.isArray(b.events) ? b.events.slice(0, 50) : [];
  if (!anon || !list.length || isBot(c.req.header('user-agent'))) return c.json({ ok: true });
  const s = await session(c), uid = s ? s.user.id : null, device = deviceOf(c.req.header('user-agent')), country = countryOf(c);
  // presence pings: who is online, and how long a play has run. They update rows; they aren't stored as events.
  const pings = list.filter(e => e && e.name === 'ping');
  for (const e of pings.slice(-1)) {
    const play = uuidOr(e.play), secs = int(e.data && e.data.seconds, 0, 86400 * 7);
    if (play) await q(`update plays set last_seen = now(), seconds = greatest(coalesce(seconds, 0), coalesce($2, 0)) where id = $1 and outcome = 'in_progress'`, [play, secs]);
  }
  if (pings.length === list.length) { await touchPlayer(anon, uid, c); return c.json({ ok: true }); }
  const ver = typeof b.v === 'string' ? b.v.slice(0, 40) : null;
  const vals = [], params = [];
  const stepPlays = [], hintPlays = [], wrongPlays = [], seen = new Set(), clicks = [], visits = [];
  // share events carry a link code: file them under that link's room and kind, so the dashboard can group them
  const codes = [...new Set(list.filter(e => e && (e.name === 'share_visit' || e.name === 'share_click') && e.data && codeOr(e.data.code)).map(e => codeOr(e.data.code)))].slice(0, 10);
  const links = codes.length ? Object.fromEntries((await rows('select code, kind, room from shares where code = any($1)', [codes])).map(r => [r.code, r])) : {};
  for (const e of list) {
    if (!e || !EVENT.test(e.name || '') || e.name === 'ping' || e.name === 'server_error') continue;
    let room = typeof e.room === 'string' && R.roomById(e.room) ? e.room : null;
    const play = uuidOr(e.play), step = int(e.step, -1, 99);
    let data = e.data && typeof e.data === 'object' ? e.data : {};
    const link = (e.name === 'share_visit' || e.name === 'share_click') ? links[codeOr(data.code)] : null;
    if (link) { room = room || link.room || null; data = Object.assign({}, data, { kind: link.kind }); }
    let json = JSON.stringify(data); if (json.length > 2000) json = JSON.stringify({ truncated: true });
    const ts = Number.isFinite(e.t) && Math.abs(Date.now() - e.t) < 7 * 864e5 ? new Date(e.t).toISOString() : new Date().toISOString();
    params.push(ts, play, anon, uid, room, e.name, step, json, device, country, ver);
    const k = params.length;
    vals.push(`($${k - 10}, $${k - 9}, $${k - 8}, $${k - 7}, $${k - 6}, $${k - 5}, $${k - 4}, $${k - 3}::jsonb, $${k - 2}, $${k - 1}, $${k})`);
    if (play) { seen.add(play); if (e.name === 'step_done') stepPlays.push(play); if (e.name === 'hint_used') hintPlays.push(play); if (e.name === 'wrong') wrongPlays.push(play); }
    if (e.name === 'share_click' && link) clicks.push(codeOr(data.code));
    if (e.name === 'share_visit') visits.push({ code: link ? codeOr(data.code) : null, via: viaOr(data.via) });
  }
  if (!vals.length) return c.json({ ok: true });
  await q(`insert into events (ts, play_id, anon_id, user_id, room, name, step, data, device, country, app_version) values ${vals.join(', ')}`, params);
  // a browser arriving through a share link: credit the link, and remember it as where this browser came from
  // (only for a browser we hadn't seen before, or only just: first touch)
  for (const v of visits.slice(0, 3)) {
    if (v.code) await q('update shares set landings = landings + 1 where code = $1', [v.code]);
    if (!v.code && !v.via) continue;
    await q(`insert into players (anon_id, user_id, device, country, from_share, from_via, from_at) values ($1, $2, $3, $4, $5, $6, now())
             on conflict (anon_id) do update set from_share = excluded.from_share, from_via = excluded.from_via, from_at = excluded.from_at
             where players.from_at is null and players.first_seen > now() - interval '30 minutes'`,
      [anon, uid, device, country, v.code, v.via]);
  }
  await touchPlayer(anon, uid, c);
  const bump = async (col, ids) => { for (const id of ids) await q(`update plays set ${col} = ${col} + 1, last_seen = now() where id = $1 and outcome = 'in_progress'`, [id]); };
  await bump('steps_done', stepPlays); await bump('hints', hintPlays); await bump('wrong', wrongPlays);
  if (seen.size) await q('update plays set last_seen = now() where id = any($1::uuid[])', [[...seen]]);
  for (const code of clicks) await q('update shares set clicks = clicks + 1 where code = $1', [code]);
  return c.json({ ok: true });
});

/* ---------- feedback ---------- */
app.post('/api/feedback', async c => {
  if (limited(c, 'feedback', 10)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const kind = ['rating', 'note', 'bug', 'stuck', 'idea'].includes(b.kind) ? b.kind : null;
  if (!kind) return c.json({ error: 'bad request' }, 400);
  const text = typeof b.text === 'string' ? b.text.trim().slice(0, 2000) : '';
  const face = ['bad', 'okay', 'good'].includes(b.face) ? b.face : null;
  const rating = int(b.rating, 1, 5), difficulty = ['Too easy', 'Just right', 'Too hard'].includes(b.difficulty) ? b.difficulty : null;
  if (!text && !face && !rating && !difficulty) return c.json({ error: 'empty' }, 400);
  const s = await session(c);
  const ctx = b.context && typeof b.context === 'object' ? JSON.stringify(b.context).slice(0, 2000) : null;
  await q(`insert into feedback (play_id, anon_id, user_id, room, kind, face, rating, difficulty, text, context, device) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [uuidOr(b.play), uuidOr(b.anon), s ? s.user.id : null, R.roomById(b.room) ? b.room : null, kind, face, rating, difficulty, text || null, ctx, deviceOf(c.req.header('user-agent'))]);
  return c.json({ ok: true });
});

/* ---------- the dashboard (cfg.admins only; anyone else gets a 404) ---------- */
async function admin(c) {
  const s = await session(c);
  c.header('Cache-Control', 'no-store'); c.header('X-Robots-Tag', 'noindex');
  return isAdmin(s) ? s : null;
}
// the dashboard's "show my own activity" choice, remembered for a year
function dashOptions(c) {
  const saved = (/(?:^|;\s*)db_me=([01])/.exec(c.req.header('cookie') || '') || [])[1];
  const opts = adminOptions(c.req.query(), saved), want = opts.me ? '1' : '0';
  if (want !== (saved || '1')) c.header('Set-Cookie', `db_me=${want}; Path=/admin; Max-Age=31536000; SameSite=Lax; HttpOnly${cfg.baseURL.startsWith('https://') ? '; Secure' : ''}`);
  return opts;
}
app.get('/admin', async c => {
  const s = await admin(c);
  if (!s) { const who = await session(c); return c.html(adminLoginPage(who && who.user.email), who ? 403 : 200); }
  return c.html(await adminPage(dashOptions(c)));
});
app.get('/admin/export/:file{[a-z]+\\.csv}', async c => {
  if (!(await admin(c))) return c.html(notFoundPage(), 404);
  const opts = adminOptions(c.req.query()), table = c.req.param('file').replace(/\.csv$/, '');
  const csv = await exportCsv(table, opts); if (csv === null) return c.html(notFoundPage(), 404);
  c.header('Content-Type', 'text/csv; charset=utf-8'); c.header('Content-Disposition', `attachment; filename="deadbolt-${table}-${opts.range}.csv"`);
  return c.body(csv);
});

/* ---------- nightly upkeep (Vercel Cron calls this; see vercel.json) ---------- */
app.get('/api/cron/maintenance', async c => {
  if (!cfg.cronSecret || c.req.header('authorization') !== `Bearer ${cfg.cronSecret}`) return c.json({ error: 'forbidden' }, 403);
  return c.json(await runMaintenance());
});

app.notFound(c => c.html(notFoundPage(), 404));
app.onError((e, c) => {
  console.error(c.req.method, c.req.path, e);
  const frames = String((e && e.stack) || '').split('\n').slice(1).map(l => l.trim().replace(/^at /, ''));
  const ours = frames.filter(l => /\/src\/[\w.-]+\.m?js/.test(l) && !/node_modules/.test(l));
  const where = (ours.length ? ours : frames).slice(0, 2).map(l => l.replace(/^(async )?/, '').replace(/\(?(file:\/\/)?[^()\s]*\/(src\/[^)\s]*)\)?/, '$2')).join(' < ').slice(0, 300);
  q(`insert into events (name, data, device, country, app_version) values ('server_error', $1, $2, $3, $4)`,
    [JSON.stringify({ method: c.req.method, path: c.req.path.slice(0, 200), message: String((e && e.message) || e).slice(0, 300), where }), deviceOf(c.req.header('user-agent')), countryOf(c), cfg.version]).catch(() => {});
  return c.req.path.startsWith('/api/') ? c.json({ error: 'server error' }, 500) : c.html(notFoundPage(), 500); });

export default app;
