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
import { headTags, resultPage, privacyPage, termsPage, gatePage, notFoundPage } from './pages.js';
import { adminPage, exportCsv } from './admin.js';

export const app = new Hono();

/* ---------- small helpers ---------- */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/;
const uuidOr = v => (typeof v === 'string' && UUID.test(v) ? v.toLowerCase() : null);
const int = (v, lo, hi) => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? null : Math.min(hi, Math.max(lo, Math.round(+v))));
const ipOf = c => c.req.header('cf-connecting-ip') || (c.req.header('x-forwarded-for') || '').split(',')[0].trim() || 'local';
const countryOf = c => { const v = (c.req.header('cf-ipcountry') || '').toUpperCase(); return /^[A-Z]{2}$/.test(v) && v !== 'XX' && v !== 'T1' ? v : null; };
const isBot = ua => /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin|embedly|preview|headless|curl|wget|python/i.test(ua || '');
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
const OPEN_PATHS = /^\/(api\/auth\/|api\/me$|api\/cron\/|healthz$|mr\.js$|favicon\.svg$|icon-\d+\.png$|art\/|privacy$|terms$)/;
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
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8', '.webmanifest': 'application/manifest+json' };
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
app.get('/icon-192.png', c => sendFile(c, pub('icon-192.png'), 'public, max-age=86400'));
app.get('/icon-512.png', c => sendFile(c, pub('icon-512.png'), 'public, max-age=86400'));
app.get('/art/:file{[a-z0-9_-]+\\.jpg}', c => sendFile(c, pub('art', c.req.param('file')), 'public, max-age=2592000'));
app.get('/vendor/three-0.160.0.module.js', c => sendFile(c, pub('vendor', 'three-0.160.0.module.js'), YEAR));
app.get('/game/:file{(vo\\.[0-9a-f]{12}\\.json|app\\.[0-9a-f]{12}\\.js)}', c => sendFile(c, pub('game', c.req.param('file')), YEAR));

app.get('/manifest.webmanifest', c => {
  c.header('Content-Type', 'application/manifest+json'); c.header('Cache-Control', 'public, max-age=86400');
  return c.body(JSON.stringify({ name: cfg.siteName, short_name: cfg.siteName, start_url: '/', display: 'fullscreen', orientation: 'landscape',
    background_color: '#0b0a09', theme_color: '#0b0a09', icons: [192, 512].map(s => ({ src: `/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })) }));
});
app.get('/robots.txt', c => c.text(cfg.staging ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /r/\nSitemap: ${cfg.baseURL}/sitemap.xml\n`));
app.get('/sitemap.xml', c => {
  const urls = ['/', ...R.released().map(m => `/m/${m.id}`), '/privacy', '/terms'];
  c.header('Content-Type', 'application/xml');
  return c.body(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${cfg.baseURL}${u}</loc></url>`).join('')}</urlset>\n`);
});
app.get('/healthz', async c => {
  try { await q('select 1'); return c.json({ ok: true, version: cfg.version }); } catch (e) { return c.json({ ok: false }, 503); }
});

/* ---------- the landing page (/, and /m/<id> opening one room's door) ---------- */
function landingHtml(room) {
  const rel = R.released().map(m => m.id);
  const head = room
    ? headTags({ title: `${room.title} · ${cfg.siteName}`, description: room.tagline || room.hook, path: `/m/${room.id}`, image: `/og/m/${room.id}.png`, page: 'site', room: room.id })
    : headTags({ title: `${cfg.siteName} · Horror escape rooms in your browser`, description: 'First-person horror escape rooms you play alone in your browser. A real place on one night, something in it that follows a rule, and one way out. Free, no download.', path: '/' });
  return LANDING.replace('<!--MR_HEAD-->', `${head}\n<script>window.MR_RELEASED=${JSON.stringify(rel)};${room ? `window.MR_OPEN=${JSON.stringify(room.id)};` : ''}</script>`);
}
app.get('/', c => { c.header('Cache-Control', 'no-cache'); return c.html(landingHtml(null)); });
app.get('/m/:id', c => {
  const m = R.roomById(c.req.param('id'));
  if (!m || !R.isReleased(m.id)) return c.html(notFoundPage(), 404);
  c.header('Cache-Control', 'no-cache');
  return c.html(landingHtml(m));
});

/* ---------- the game (/play/<id>) ---------- */
app.get('/play', c => c.redirect('/#rooms'));
app.get('/play/:id', async c => {
  const m = R.roomById(c.req.param('id'));
  if (!m) return c.html(notFoundPage(), 404);
  if (!R.isReleased(m.id)) return c.redirect('/#rooms');
  if (cfg.requireLogin && !(await session(c))) return c.redirect(`/?signin=required&next=${encodeURIComponent(`/play/${m.id}`)}`);
  const etag = `"p-${m.id}-${cfg.version}"`;
  c.header('ETag', etag); c.header('Cache-Control', 'no-cache');
  if (c.req.header('if-none-match') === etag) return c.body(null, 304);
  const head = headTags({ title: `${m.title} · ${cfg.siteName}`, description: m.tagline || m.hook, path: `/m/${m.id}`, image: `/og/m/${m.id}.png`, page: 'game', room: m.id });
  return c.html(PLAY.replace('<!--MR_HEAD-->', head));
});

/* ---------- share pages and preview cards ---------- */
app.get('/r/:code', async c => {
  const code = c.req.param('code').toLowerCase();
  const s = CODE.test(code) ? await one('select * from shares where code = $1', [code]) : null;
  if (!s || !R.roomById(s.room)) return c.html(notFoundPage(), 404);
  if (!isBot(c.req.header('user-agent'))) q('update shares set landings = landings + 1 where code = $1', [code]).catch(() => {});
  c.header('Cache-Control', 'no-cache');
  return c.html(resultPage(s));
});
async function sendPng(c, key, build, cache) {
  const buf = await og.png(key, build);
  if (!buf) return c.text('not found', 404);
  c.header('Content-Type', 'image/png'); c.header('Cache-Control', cache);
  return c.body(buf);
}
app.get('/og/site.png', c => sendPng(c, `site:${R.released().length}`, () => og.siteCard(), 'public, max-age=3600'));
app.get('/og/m/:file{[a-z0-9_-]+\\.png}', c => {
  const id = c.req.param('file').replace(/\.png$/, '');
  return sendPng(c, `m:${id}`, () => (R.isReleased(id) ? og.roomCard(id) : null), 'public, max-age=86400');
});
app.get('/og/r/:file{[a-z0-9]{6}\\.png}', async c => {
  const code = c.req.param('file').slice(0, 6);
  const s = CODE.test(code) ? await one('select * from shares where code = $1', [code]) : null;
  return sendPng(c, `r:${code}`, () => (s ? og.resultCard(s) : null), YEAR);
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
  const sh = await rows('select distinct on (room) room, code from shares where user_id = $1 order by room, created_at', [uid]);
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
app.get('/me/export', async c => {
  const s = await session(c); if (!s) return c.redirect('/?signin=1');
  const uid = s.user.id;
  const data = {
    exported_at: new Date().toISOString(),
    account: { name: s.user.name, email: s.user.email, image: s.user.image, created_at: s.user.createdAt },
    profile: await one('select age_confirmed_at, consented_at, handle, show_handle from profiles where user_id = $1', [uid]),
    results: await rows('select room, day, seconds, hints, wrong, marks, created_at from results where user_id = $1 order by room', [uid]),
    shares: await rows('select code, room, seconds, hints, wrong, marks, created_at, landings from shares where user_id = $1 order by created_at', [uid]),
    plays: await rows('select room, started_at, ended_at, outcome, steps_done, hints, wrong, seconds, device, country from plays where user_id = $1 order by started_at', [uid]),
    feedback: await rows('select created_at, room, kind, rating, difficulty, text from feedback where user_id = $1 order by created_at', [uid]),
  };
  c.header('Content-Disposition', 'attachment; filename="deadbolt-my-data.json"');
  return c.json(data);
});

/* ---------- plays ---------- */
app.post('/api/plays/start', async c => {
  if (limited(c, 'plays', 60)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const play = uuidOr(b.play), anon = uuidOr(b.anon), room = R.roomById(b.room) ? b.room : null;
  if (!play || !room) return c.json({ error: 'bad request' }, 400);
  const s = await session(c), uid = s ? s.user.id : null, from = typeof b.from === 'string' && CODE.test(b.from.toLowerCase()) ? b.from.toLowerCase() : null;
  await touchPlayer(anon, uid, c);
  const r = await one(`insert into plays (id, room, anon_id, user_id, steps_total, from_share, device, country, app_version) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           on conflict (id) do update set resumed = true, last_seen = now(), user_id = coalesce(plays.user_id, excluded.user_id)
           returning (xmax = 0) as inserted`,
    [play, room, anon, uid, int(b.steps, 1, 40), from, deviceOf(c.req.header('user-agent')), countryOf(c), cfg.version]);
  if (r && r.inserted && from) await q('update shares set plays_started = plays_started + 1 where code = $1 and room = $2', [from, room]);
  return c.json({ ok: true });
});
async function makeShare({ play, uid, anon, room, secs, hints, wrong, marks }) {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const r = await one(`insert into shares (code, play_id, user_id, anon_id, room, seconds, hints, wrong, marks) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                         on conflict (code) do nothing returning code`, [code, play, uid, anon, room, secs, hints, wrong, marks]);
    if (r) return r.code;
  }
  throw new Error('could not make a share code');
}
async function existingShare(uid, anon, room) {
  if (uid) { const r = await one('select code from shares where user_id = $1 and room = $2 order by created_at limit 1', [uid, room]); if (r) return r.code; }
  if (anon) { const r = await one('select code from shares where anon_id = $1 and room = $2 order by created_at limit 1', [anon, room]); if (r) return r.code; }
  return null;
}
app.post('/api/plays/finish', async c => {
  if (limited(c, 'plays', 60)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const play = uuidOr(b.play), anon = uuidOr(b.anon), room = R.roomById(b.room) ? b.room : null, secs = int(b.time, 0, 86400 * 7);
  if (!play || !room || secs === null) return c.json({ error: 'bad request' }, 400);
  const s = await session(c), uid = s ? s.user.id : null;
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
// a share link for a result made before the site existed (or on a browser that lost its code)
app.post('/api/share', async c => {
  if (limited(c, 'share', 20)) return c.json({ error: 'slow down' }, 429);
  const b = await c.req.json().catch(() => ({}));
  const anon = uuidOr(b.anon), room = R.roomById(b.room) ? b.room : null, secs = int(b.time, 0, 86400 * 7);
  if (!room || secs === null) return c.json({ error: 'bad request' }, 400);
  const s = await session(c), uid = s ? s.user.id : null;
  const code = (await existingShare(uid, anon, room)) || await makeShare({ play: null, uid, anon, room, secs, hints: int(b.hints, 0, 999) || 0, wrong: int(b.wrong, 0, 999) || 0, marks: marksStr(b.marks) });
  return c.json({ code });
});

/* ---------- events ---------- */
const EVENT = /^[a-z][a-z_]{1,31}$/;
app.post('/api/events', async c => {
  if (limited(c, 'events', 240)) return c.json({ error: 'slow down' }, 429);
  let b; try { b = JSON.parse(await c.req.text()); } catch (e) { return c.json({ error: 'bad json' }, 400); }
  const anon = uuidOr(b.anon), list = Array.isArray(b.events) ? b.events.slice(0, 50) : [];
  if (!anon || !list.length) return c.json({ ok: true });
  const s = await session(c), uid = s ? s.user.id : null, device = deviceOf(c.req.header('user-agent')), country = countryOf(c);
  const ver = typeof b.v === 'string' ? b.v.slice(0, 40) : null;
  const vals = [], params = [];
  const stepPlays = [], hintPlays = [], wrongPlays = [], seen = new Set(), clicks = [];
  for (const e of list) {
    if (!e || !EVENT.test(e.name || '')) continue;
    const room = typeof e.room === 'string' && R.roomById(e.room) ? e.room : null, play = uuidOr(e.play), step = int(e.step, -1, 99);
    let data = e.data && typeof e.data === 'object' ? e.data : {};
    let json = JSON.stringify(data); if (json.length > 2000) json = JSON.stringify({ truncated: true });
    const ts = Number.isFinite(e.t) && Math.abs(Date.now() - e.t) < 7 * 864e5 ? new Date(e.t).toISOString() : new Date().toISOString();
    params.push(ts, play, anon, uid, room, e.name, step, json, device, country, ver);
    const k = params.length;
    vals.push(`($${k - 10}, $${k - 9}, $${k - 8}, $${k - 7}, $${k - 6}, $${k - 5}, $${k - 4}, $${k - 3}::jsonb, $${k - 2}, $${k - 1}, $${k})`);
    if (play) { seen.add(play); if (e.name === 'step_done') stepPlays.push(play); if (e.name === 'hint_used') hintPlays.push(play); if (e.name === 'wrong') wrongPlays.push(play); }
    if (e.name === 'share_click' && typeof data.code === 'string' && CODE.test(data.code)) clicks.push(data.code);
  }
  if (!vals.length) return c.json({ ok: true });
  await q(`insert into events (ts, play_id, anon_id, user_id, room, name, step, data, device, country, app_version) values ${vals.join(', ')}`, params);
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
  const kind = ['rating', 'bug', 'stuck', 'idea'].includes(b.kind) ? b.kind : null;
  if (!kind) return c.json({ error: 'bad request' }, 400);
  const text = typeof b.text === 'string' ? b.text.trim().slice(0, 2000) : '';
  const rating = int(b.rating, 1, 5), difficulty = ['Too easy', 'Just right', 'Too hard'].includes(b.difficulty) ? b.difficulty : null;
  if (!text && !rating && !difficulty) return c.json({ error: 'empty' }, 400);
  const s = await session(c);
  const ctx = b.context && typeof b.context === 'object' ? JSON.stringify(b.context).slice(0, 2000) : null;
  await q(`insert into feedback (play_id, anon_id, user_id, room, kind, rating, difficulty, text, context, device) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [uuidOr(b.play), uuidOr(b.anon), s ? s.user.id : null, R.roomById(b.room) ? b.room : null, kind, rating, difficulty, text || null, ctx, deviceOf(c.req.header('user-agent'))]);
  return c.json({ ok: true });
});

/* ---------- the dashboard ---------- */
app.get('/admin', async c => {
  const s = await session(c);
  if (!s) return c.redirect('/?signin=1&next=/admin');
  if (!isAdmin(s)) return c.html(notFoundPage(), 404);
  const days = [7, 30, 90, 365].includes(+c.req.query('days')) ? +c.req.query('days') : 30;
  c.header('Cache-Control', 'no-store');
  return c.html(await adminPage(days));
});
app.get('/admin/export/:file{[a-z]+\\.csv}', async c => {
  const s = await session(c); if (!isAdmin(s)) return c.html(notFoundPage(), 404);
  const days = int(c.req.query('days'), 1, 3650) || 30, table = c.req.param('file').replace(/\.csv$/, '');
  const csv = await exportCsv(table, days); if (csv === null) return c.html(notFoundPage(), 404);
  c.header('Content-Type', 'text/csv; charset=utf-8'); c.header('Content-Disposition', `attachment; filename="${table}-${days}d.csv"`);
  return c.body(csv);
});

/* ---------- nightly upkeep (Vercel Cron calls this; see vercel.json) ---------- */
app.get('/api/cron/maintenance', async c => {
  if (!cfg.cronSecret || c.req.header('authorization') !== `Bearer ${cfg.cronSecret}`) return c.json({ error: 'forbidden' }, 403);
  return c.json(await runMaintenance());
});

app.notFound(c => c.html(notFoundPage(), 404));
app.onError((e, c) => { console.error(c.req.method, c.req.path, e); return c.req.path.startsWith('/api/') ? c.json({ error: 'server error' }, 500) : c.html(notFoundPage(), 500); });

export default app;
