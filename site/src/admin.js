// /admin: everything happening on the live site. Opens for cfg.admins only (see config.js).
//   /admin                  the dashboard (?range=24h|7d|30d|90d|all; ?me=0 hides the owner's own activity, remembered in a cookie)
//   /admin/live             the "Live now" panel on its own; the dashboard refreshes it every 15 seconds
//   /admin/players/<id>     one player: their plays and everything they did, newest first
//   /admin/export/<t>.csv   raw rows
import { cfg } from './config.js';
import { rows, one } from './db.js';
import { allRooms, fmtTime } from './rooms.js';
import { esc, headTags, layout } from './pages.js';

/* ---------- options from the query string ---------- */
const RANGES = {
  '24h': { label: '24 hours', hours: 24, unit: 'hour' },
  '7d': { label: '7 days', hours: 24 * 7, unit: 'day' },
  '30d': { label: '30 days', hours: 24 * 30, unit: 'day' },
  '90d': { label: '90 days', hours: 24 * 90, unit: 'day' },
  all: { label: 'All time', hours: null, unit: 'day' },
};
// me: include the owner's own activity. On by default; ?me=0 hides it, and the server remembers the choice in a cookie.
export function adminOptions(query, saved) {
  const range = RANGES[query.range] ? query.range : (query.days && RANGES[`${query.days}d`] ? `${query.days}d` : '7d');
  const me = query.me === '0' ? false : query.me === '1' ? true : saved !== '0';
  return { range, me };
}

/* ---------- queries with named parameters: @name becomes $n ---------- */
function bind(text, p) {
  const vals = [], at = {};
  const out = text.replace(/@([a-z_][a-z0-9_]*)/g, (_, k) => {
    if (!(k in p)) throw new Error(`missing query parameter @${k}`);
    if (!at[k]) { vals.push(p[k]); at[k] = vals.length; }
    return `$${at[k]}`;
  });
  return [out, vals];
}
const R = (text, p) => rows(...bind(text, p));
const O = (text, p) => one(...bind(text, p));

// rows made by the owner (signed in as an admin, or on a browser that has signed in as one) are left out when ?me=0
const notMe = (a = '') => `not coalesce(${a}user_id = any(@xu::text[]), false) and not coalesce(${a}anon_id = any(@xa::uuid[]), false)`;

async function context(opts) {
  const r = RANGES[opts.range];
  const own = await O(`select coalesce(array_agg(distinct u.id), '{}') ids, coalesce(array_agg(distinct p.anon_id) filter (where p.anon_id is not null), '{}') anons
                       from "user" u left join players p on p.user_id = u.id where lower(u.email) = any(@admins::text[])`, { admins: cfg.admins });
  let since, prev = null, unit = r.unit;
  if (r.hours) { since = new Date(Date.now() - r.hours * 3600e3); prev = new Date(Date.now() - 2 * r.hours * 3600e3); }
  else {
    const f = await O('select least((select min(first_seen) from players), (select min("createdAt") from "user"), now()) t', {});
    since = new Date(new Date(f.t).getTime() - 3600e3);
    if (Date.now() - since > 120 * 864e5) unit = 'week';
  }
  return {
    ...opts, ...r, unit, since, prev,
    p: { since, prev: prev || since, unit, tz: cfg.timeZone, xu: opts.me ? [] : own.ids, xa: opts.me ? [] : own.anons },
    ownIds: own.ids,
  };
}

/* ---------- formatting ---------- */
const nf = new Intl.NumberFormat('en-IN');
const num = v => nf.format(v || 0);
const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
const pl = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
const dtf = new Intl.DateTimeFormat('en-GB', { timeZone: cfg.timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const tf = new Intl.DateTimeFormat('en-GB', { timeZone: cfg.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const fmtDT = d => (d ? dtf.format(new Date(d)) : '–');
function ago(d) {
  if (!d) return '–';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)} d ago`;
  return fmtDT(d);
}
function dur(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`;
  return `${Math.floor(sec / 3600)}h ${String(Math.floor(sec % 3600 / 60)).padStart(2, '0')}m`;
}
const roomTitle = id => (allRooms().find(m => m.id === id) || {}).title || id || '';
const COUNTRY = new Intl.DisplayNames(['en'], { type: 'region' });
const country = c => { try { return c ? COUNTRY.of(c) : '–'; } catch (e) { return c; } };
const deviceShort = d => (d ? d.split(' ').filter(x => x !== 'other').join(' · ') : '–');
function who(r, link = true, own = []) {
  if (r.name === 'server_error') return '<span class="muted">Server</span>';
  if (r.uid) {
    const name = own.includes(r.uid) ? 'You' : esc(r.uname || r.email || 'Player');
    return link ? `<a class="who" href="/admin/players/${encodeURIComponent(r.uid)}">${name}</a>` : `<span class="who">${name}</span>`;
  }
  return `<span class="muted">Visitor ${esc(String(r.anon_id || '').slice(0, 6) || '?')}</span>`;
}
function delta(cur, prev, ctx) {
  if (!ctx.prev || prev === null || prev === undefined) return '';
  if (!prev) return cur ? '<em class="up">new</em>' : '';
  const d = Math.round(100 * (cur - prev) / prev);
  return d === 0 ? '<em>same as before</em>' : `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}% vs previous ${ctx.label}</em>`;
}
const meter = (v, max, cls = '') => `<span class="meter ${cls}"><i style="width:${max ? Math.max(v ? 2 : 0, Math.round(100 * v / max)) : 0}%"></i></span>`;

const fbWhere = f => { const c = f.context || {}; if (c.step == null) return ''; return c.from === 'end' || f.kind === 'rating' ? `after escaping in ${fmtTime(c.seconds)}` : `on puzzle ${c.step + 1}, ${fmtTime(c.seconds)} in`; };

/* ---------- sharing labels ---------- */
// the app a link was shared through (?via=), and older names from before the share panel
const CHANNEL = { wa: 'WhatsApp', tg: 'Telegram', x: 'X', fb: 'Facebook', em: 'Email', cp: 'Copied link', sh: 'Phone share sheet', li: 'LinkedIn' };
const chKey = c => ({ copy: 'cp', manual: 'cp', sheet: 'sh' }[c] || c || '?');
const chName = c => CHANNEL[c] || (c === '?' ? 'No app tag' : c);
// where the Share button was tapped
const SURFACE = { end: 'Game: end screen', title: 'Game: room title screen', pause: 'Game: pause menu', door: 'Site: a room\'s door', nav: 'Site: top bar',
  cta: 'Site: bottom of the page', footer: 'Site: footer', account: 'Site: account menu', game: 'Game', site: 'Site', result: 'Result page' };
const KIND = { result: 'Result', room: 'Room invite', site: 'Site invite' };

/* ---------- what an event means, in words ---------- */
function describe(e) {
  const d = e.data || {}, room = e.room ? `<b>${esc(roomTitle(e.room))}</b>` : '', step = Number.isInteger(e.step) && e.step >= 0 ? e.step + 1 : null;
  switch (e.name) {
    case 'account': return 'Created an account';
    case 'page_view': return `Viewed ${d.path === '/' ? 'the home page' : `<code>${esc(d.path || '?')}</code>`}${d.ref ? ` <span class="muted">from ${esc(d.ref)}</span>` : ''}`;
    case 'room_open': return `Opened ${room}`;
    case 'room_start': return `${d.cont ? 'Continued' : 'Started'} ${room}`;
    case 'step_done': return `Solved puzzle ${step ?? '?'} in ${room}${d.seconds ? ` <span class="muted">at ${fmtTime(d.seconds)}</span>` : ''}`;
    case 'hint_used': return `Took hint ${d.tier || ''} on puzzle ${step ?? '?'} in ${room}`;
    case 'wrong': return `Wrong guess on puzzle ${step ?? '?'} in ${room}`;
    case 'room_escape': return `<span class="good">Escaped</span> ${room}${d.seconds ? ` in ${fmtTime(d.seconds)}` : ''}${d.hints ? `, ${d.hints} hint${d.hints === 1 ? '' : 's'}` : ''}`;
    case 'room_quit': return `Left ${room} on puzzle ${step ?? '?'}${d.seconds ? ` after ${fmtTime(d.seconds)}` : ''}`;
    case 'page_hide': return `Switched away from ${room || 'the site'}${step ? ` on puzzle ${step}` : ''}`;
    case 'share_open': return `Opened the share panel <span class="muted">(${esc(SURFACE[d.surface] || d.surface || '?')})</span>`;
    case 'share_click': return `Shared ${d.kind === 'site' ? 'the site' : room || 'a room'}${d.kind === 'result' ? ' result' : ''} <span class="muted">via ${esc(chName(chKey(d.channel)))}</span>`;
    case 'share_visit': return `Arrived through a shared link${room ? ` to ${room}` : ''} <span class="muted">via ${esc(chName(d.via || '?'))}${d.code ? ` · ${esc(d.code)}` : ''}</span>`;
    case 'share_fail': return 'Share sheet failed';
    case 'inapp_seen': return `Opened inside ${esc(d.app || 'an app')}'s browser`;
    case 'inapp_out': return `Moved from ${esc(d.app || 'an app')}'s browser to a real one`;
    case 'feedback_sent': return `Sent feedback <span class="muted">(${esc(d.kind || '?')})</span>${room ? ` on ${room}` : ''}`;
    case 'signin_prompt': return 'Saw the sign-in dialog';
    case 'signin_start': return 'Went to Google to sign in';
    case 'client_error': return `<span class="bad">Browser error</span> <code>${esc(d.message || '')}</code> <span class="muted">${esc(d.where || '')}</span>`;
    case 'server_error': return `<span class="bad">Server error</span> on <code>${esc(d.method || '')} ${esc(d.path || '')}</code>: ${esc(d.message || '')}`;
    default: return `${esc(e.name)} ${room}`;
  }
}

/* ---------- charts: server-drawn SVG, one series each, a hover title on every bucket ---------- */
function bucketLabel(k, unit, long) {
  // k is 'YYYY-MM-DD HH24'
  const [date, hour] = k.split(' '), d = new Date(`${date}T00:00:00Z`);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  if (unit === 'hour') return long ? `${day}, ${hour}:00` : `${hour}:00`;
  if (unit === 'week') return long ? `Week of ${day}` : day;
  return long ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : day;
}
function barChart({ points, unit, color = 'var(--s1)', noun }) {
  const W = 560, H = 112, top = 14, bottom = 1, n = Math.max(1, points.length);
  const max = Math.max(1, ...points.map(p => p.v)), bw = W / n, gap = bw > 6 ? 2 : bw > 3 ? 1 : 0, ph = H - top - bottom, yb = H - bottom;
  const bars = points.map((p, i) => {
    const h = p.v ? Math.max(2, ph * p.v / max) : 0, x = i * bw + gap / 2, w = Math.max(1, bw - gap), y = yb - h, r = Math.min(4, w / 2, h);
    const bar = h ? `<path d="M${x.toFixed(1)},${yb} V${(y + r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x + r).toFixed(1)},${y.toFixed(1)} H${(x + w - r).toFixed(1)} Q${(x + w).toFixed(1)},${y.toFixed(1)} ${(x + w).toFixed(1)},${(y + r).toFixed(1)} V${yb} Z" fill="${color}"/>` : '';
    return `<g class="col">${bar}<rect class="hit" x="${(i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}"><title>${esc(bucketLabel(p.k, unit, true))}: ${num(p.v)} ${esc(noun)}</title></rect></g>`;
  }).join('');
  const first = points[0], last = points[points.length - 1];
  return `<div class="cw"><span class="ymax">${num(max)}</span><svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(noun)} by ${unit}">
    <line x1="0" x2="${W}" y1="${top}" y2="${top}" class="grid" vector-effect="non-scaling-stroke"/>
    ${bars}<line x1="0" x2="${W}" y1="${yb}" y2="${yb}" class="base" vector-effect="non-scaling-stroke"/></svg>
    <div class="xl"><span>${first ? esc(bucketLabel(first.k, unit)) : ''}</span><span>${last && points.length > 1 ? esc(bucketLabel(last.k, unit)) : ''}</span></div></div>`;
}

/* ---------- Live now ---------- */
export async function livePanel(opts) {
  const ctx = await context({ range: '24h', ...opts });
  const P = ctx.p;
  const [counts, inRoom, feed] = await Promise.all([
    O(`select count(*) filter (where last_seen > now() - interval '2 minutes')::int online,
              count(*) filter (where last_seen > now() - interval '1 hour')::int last_hour,
              count(distinct user_id) filter (where last_seen > now() - interval '24 hours' and user_id is not null)::int day_users
       from players where ${notMe()}`, P),
    R(`select p.*, u.id uid, u.name uname, u.email from plays p left join "user" u on u.id = p.user_id
       where p.outcome = 'in_progress' and p.last_seen > now() - interval '3 minutes' and ${notMe('p.')} order by p.started_at`, P),
    R(`(select e.ts, e.name, e.room, e.step, e.data, e.anon_id, u.id uid, u.name uname, u.email
        from events e left join players pl on pl.anon_id = e.anon_id left join "user" u on u.id = coalesce(e.user_id, pl.user_id)
        where e.ts > now() - interval '24 hours' and e.name not in ('page_hide') and ${notMe('e.')}
          and not coalesce(pl.user_id = any(@xu::text[]), false)
        order by e.ts desc limit 60)
       union all
       (select u."createdAt" ts, 'account' name, null room, null step, null data, null anon_id, u.id uid, u.name uname, u.email
        from "user" u where u."createdAt" > now() - interval '24 hours' and not (u.id = any(@xu::text[])))
       order by ts desc limit 60`, P),
  ]);
  const roomsNow = inRoom.length ? `<div class="scroll"><table class="t"><thead><tr><th>Player</th><th>Room</th><th class="n">Puzzles</th><th class="n">Playing for</th><th class="n">Hints</th><th class="n">Wrong</th><th>Device</th><th>Country</th></tr></thead><tbody>
    ${inRoom.map(p => `<tr><td>${who(p, true, ctx.ownIds)}</td><td>${esc(roomTitle(p.room))}</td><td class="n">${p.steps_done}${p.steps_total ? ` / ${p.steps_total}` : ''}</td>
      <td class="n">${dur(p.resumed ? p.seconds || 0 : Math.max(p.seconds || 0, (Date.now() - new Date(p.started_at)) / 1000))}</td><td class="n">${p.hints}</td><td class="n">${p.wrong}</td>
      <td>${esc(deviceShort(p.device))}</td><td>${esc(country(p.country))}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="muted">Nobody is in a room right now.</p>';
  const items = feed.map(e => `<li><time title="${esc(fmtDT(e.ts))}">${esc(ago(e.ts))}</time><span>${who(e, true, ctx.ownIds)}</span><span>${describe(e)}</span></li>`).join('')
    || '<li class="muted">Nothing in the last 24 hours.</li>';
  return `<div class="livehead"><h2><span class="dot" aria-hidden="true"></span>Live now</h2><small class="muted">Updated ${tf.format(new Date())} IST · refreshes every 15 seconds</small></div>
  <div class="tiles tiles-sm"><div class="tile"><span>On the site now</span><b>${num(counts.online)}</b></div><div class="tile"><span>In a room now</span><b>${num(inRoom.length)}</b></div>
  <div class="tile"><span>Active in the last hour</span><b>${num(counts.last_hour)}</b></div><div class="tile"><span>Players in the last 24 hours</span><b>${num(counts.day_users)}</b></div></div>
  <div class="split"><div><h3>In a room</h3>${roomsNow}</div><div><h3>What just happened</h3><ol class="feed">${items}</ol></div></div>`;
}

/* ---------- Sharing: what was shared, where, through which app, and what it led to ---------- */
async function sharingSection(ctx) {
  const P = ctx.p;
  const [k, sent, visits, newp, plays, signups, surf, byRoom, sharers, links, mix] = await Promise.all([
    O(`select
        (select count(*) from events where name = 'share_click' and ts > @since and ${notMe()})::int sent,
        (select count(distinct anon_id) from events where name = 'share_click' and ts > @since and ${notMe()})::int sharers,
        (select count(*) from events where name = 'share_open' and ts > @since and ${notMe()})::int opened,
        (select count(distinct anon_id) from events where name = 'share_visit' and ts > @since and ${notMe()})::int visitors,
        (select count(*) from players where from_at > @since and ${notMe()})::int new_players,
        (select count(*) from plays where (from_share is not null or from_via is not null) and started_at > @since and ${notMe()})::int plays,
        (select count(*) from plays where (from_share is not null or from_via is not null) and outcome = 'escaped' and started_at > @since and ${notMe()})::int escapes,
        (select count(distinct u.id) from players p join "user" u on u.id = p.user_id where p.from_at is not null and u."createdAt" >= p.from_at - interval '5 minutes'
           and u."createdAt" > @since and not (u.id = any(@xu::text[])))::int signups`, P),
    R(`select coalesce(data->>'channel', '?') ch, count(*)::int n, count(distinct anon_id)::int people from events
       where name = 'share_click' and ts > @since and ${notMe()} group by 1`, P),
    R(`select coalesce(data->>'via', '?') ch, count(distinct anon_id)::int n from events where name = 'share_visit' and ts > @since and ${notMe()} group by 1`, P),
    R(`select coalesce(from_via, '?') ch, count(*)::int n from players where from_at > @since and ${notMe()} group by 1`, P),
    R(`select coalesce(from_via, '?') ch, count(*)::int n, count(*) filter (where outcome = 'escaped')::int esc from plays
       where (from_share is not null or from_via is not null) and started_at > @since and ${notMe()} group by 1`, P),
    R(`select coalesce(p.from_via, '?') ch, count(distinct u.id)::int n from players p join "user" u on u.id = p.user_id
       where p.from_at is not null and u."createdAt" >= p.from_at - interval '5 minutes' and u."createdAt" > @since and not (u.id = any(@xu::text[])) group by 1`, P),
    R(`select coalesce(data->>'surface', '?') surface, coalesce(data->>'kind', '?') kind, count(*) filter (where name = 'share_open')::int opens,
         count(*) filter (where name = 'share_click')::int sent
       from events where name in ('share_open', 'share_click') and ts > @since and ${notMe()} group by 1, 2 order by 4 desc, 3 desc`, P),
    R(`select e.room, count(*) filter (where e.name = 'share_click' and e.data->>'kind' = 'room')::int invites,
         count(*) filter (where e.name = 'share_click' and e.data->>'kind' = 'result')::int results,
         count(distinct e.anon_id) filter (where e.name = 'share_visit')::int visitors,
         (select count(*) from plays p where p.room = e.room and p.from_share is not null and p.started_at > @since and ${notMe('p.')})::int plays
       from events e where e.name in ('share_click', 'share_visit') and e.room is not null and e.ts > @since and ${notMe('e.')} group by e.room`, P),
    R(`select coalesce(s.user_id, s.anon_id::text) k, max(u.id) uid, max(u.name) uname, max(u.email) email, max(s.anon_id::text) anon_id, count(*)::int links,
         sum(s.clicks)::int sent, sum(s.landings)::int visits, sum(s.plays_started)::int plays,
         (select count(*) from plays p where p.from_share = any(array_agg(s.code)) and p.outcome = 'escaped')::int escapes
       from shares s left join "user" u on u.id = s.user_id where ${notMe('s.')}
       group by 1 having sum(s.clicks) > 0 or sum(s.landings) > 0 order by 8 desc, 9 desc, 7 desc limit 15`, P),
    R(`select s.code, s.kind, s.room, s.surface, s.created_at, s.clicks, s.landings, s.plays_started, s.anon_id, u.id uid, u.name uname, u.email,
         (select count(*) from players p where p.from_share = s.code)::int new_players,
         (select count(*) from plays p where p.from_share = s.code and p.outcome = 'escaped')::int escapes,
         (select count(distinct pl.user_id) from players pl join "user" u2 on u2.id = pl.user_id where pl.from_share = s.code and u2."createdAt" >= pl.from_at - interval '5 minutes')::int signups
       from shares s left join "user" u on u.id = s.user_id where (s.clicks > 0 or s.landings > 0) and ${notMe('s.')}
       order by s.landings desc, s.plays_started desc, s.clicks desc limit 25`, P),
    R(`select data->>'code' code, coalesce(data->>'channel', '?') ch, count(*)::int n from events
       where name = 'share_click' and data->>'code' is not null and ${notMe()} group by 1, 2`, P),
  ]);
  const agg = {};
  const add = (list, f) => list.forEach(r => { const c = chKey(r.ch); agg[c] = agg[c] || { sent: 0, people: 0, visitors: 0, newp: 0, plays: 0, esc: 0, signups: 0 }; f(agg[c], r); });
  add(sent, (a, r) => { a.sent += r.n; a.people += r.people; }); add(visits, (a, r) => { a.visitors += r.n; }); add(newp, (a, r) => { a.newp += r.n; });
  add(plays, (a, r) => { a.plays += r.n; a.esc += r.esc; }); add(signups, (a, r) => { a.signups += r.n; });
  const chRows = Object.entries(agg).sort((a, b) => (b[1].visitors - a[1].visitors) || (b[1].sent - a[1].sent));
  const maxSent = Math.max(1, ...chRows.map(([, a]) => a.sent));
  const chHtml = chRows.map(([c, a]) => `<tr><td>${esc(chName(c))}</td><td class="n">${num(a.sent)}</td><td class="wide">${meter(a.sent, maxSent)}</td><td class="n">${num(a.visitors)}</td>
      <td class="n">${num(a.newp)}</td><td class="n">${num(a.plays)}${a.plays ? `<small>${num(a.esc)} escaped</small>` : ''}</td><td class="n">${num(a.signups)}</td></tr>`).join('')
    || '<tr><td colspan="7" class="muted">Nothing shared in this period.</td></tr>';
  const surfHtml = surf.map(r => `<tr><td>${esc(SURFACE[r.surface] || r.surface)}<small>${esc(KIND[r.kind] || '')}</small></td><td class="n">${num(r.opens)}</td><td class="n">${num(r.sent)}</td>
      <td class="n">${r.opens ? `${pct(r.sent, r.opens)}%` : '–'}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nobody opened the share panel in this period.</td></tr>';
  const roomHtml = allRooms().slice().reverse().map(m => { const r = byRoom.find(x => x.room === m.id); if (!r) return '';
    return `<tr><td>${esc(m.title)}<small>#${m.n}</small></td><td class="n">${num(r.invites)}</td><td class="n">${num(r.results)}</td><td class="n">${num(r.visitors)}</td><td class="n">${num(r.plays)}</td></tr>`; }).join('')
    || '<tr><td colspan="5" class="muted">No room shared in this period.</td></tr>';
  const sharerHtml = sharers.map(r => `<tr><td>${who(r, true, ctx.ownIds)}${r.email ? `<small>${esc(r.email)}</small>` : ''}</td><td class="n">${num(r.links)}</td><td class="n">${num(r.sent)}</td>
      <td class="n">${num(r.visits)}</td><td class="n">${num(r.plays)}</td><td class="n">${num(r.escapes)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No sharers yet.</td></tr>';
  const mixOf = code => mix.filter(r => r.code === code).sort((a, b) => b.n - a.n).map(r => `${chName(chKey(r.ch))} ${r.n}`).join(' · ');
  const linkHtml = links.map(r => `<tr><td><a class="who" href="/${r.kind === 'result' ? 'r' : 'i'}/${esc(r.code)}" target="_blank" rel="noopener"><code>${esc(r.code)}</code></a><small>${esc(KIND[r.kind] || r.kind)}${r.room ? ` · ${esc(roomTitle(r.room))}` : ''}</small></td>
      <td>${who(r, true, ctx.ownIds)}</td><td class="n">${num(r.clicks)}<small>${esc(mixOf(r.code))}</small></td><td class="n">${num(r.landings)}</td><td class="n">${num(r.new_players)}</td><td class="n">${num(r.plays_started)}</td>
      <td class="n">${num(r.signups)}</td><td class="n">${num(r.escapes)}</td><td>${esc(fmtDT(r.created_at))}<small>${esc(SURFACE[r.surface] || r.surface || '')}</small></td></tr>`).join('')
    || '<tr><td colspan="9" class="muted">No shared link has been opened yet.</td></tr>';
  const tile = (label, v, note) => `<div class="tile"><span>${label}</span><b>${v}</b>${note ? `<small>${note}</small>` : ''}</div>`;
  return `<section id="sharing"><h2>Sharing</h2>
<p class="muted lead">Every Share button opens one panel. Each person gets one link per room, one for the site and one per result, and each app adds its own tag, so a visit is credited to the person and the app. A browser is credited to the first link it arrived through, for 30 days.</p>
<div class="tiles">${tile('Shares sent', num(k.sent), `${num(k.opened)} share panels opened`)}${tile('People sharing', num(k.sharers))}${tile('Visitors from links', num(k.visitors), k.sent ? `${(k.visitors / k.sent).toFixed(1)} per share` : '')}
${tile('New players from links', num(k.new_players), 'first visit through a link')}${tile('Plays from links', num(k.plays), `${num(k.escapes)} escaped`)}${tile('Sign-ups from links', num(k.signups))}</div>
<h3>By app</h3><div class="scroll"><table class="t"><thead><tr><th>Shared through</th><th class="n">Sent</th><th></th><th class="n">Visitors</th><th class="n">New players</th><th class="n">Plays</th><th class="n">Sign-ups</th></tr></thead><tbody>${chHtml}</tbody></table></div>
<div class="split"><div><h3>Where people tap Share</h3><div class="scroll"><table class="t"><thead><tr><th>Place</th><th class="n">Opened</th><th class="n">Sent</th><th class="n">Sent / opened</th></tr></thead><tbody>${surfHtml}</tbody></table></div></div>
<div><h3>By room</h3><div class="scroll"><table class="t"><thead><tr><th>Room</th><th class="n">Invites sent</th><th class="n">Results sent</th><th class="n">Visitors</th><th class="n">Plays from links</th></tr></thead><tbody>${roomHtml}</tbody></table></div></div></div>
<h3>Top sharers <small class="muted">all time</small></h3><div class="scroll"><table class="t"><thead><tr><th>Who</th><th class="n">Links</th><th class="n">Sent</th><th class="n">Visitors</th><th class="n">Plays</th><th class="n">Escapes</th></tr></thead><tbody>${sharerHtml}</tbody></table></div>
<h3>Top links <small class="muted">all time</small></h3><div class="scroll"><table class="t"><thead><tr><th>Link</th><th>Shared by</th><th class="n">Sent</th><th class="n">Visits</th><th class="n">New players</th><th class="n">Plays</th><th class="n">Sign-ups</th><th class="n">Escapes</th><th>Made</th></tr></thead><tbody>${linkHtml}</tbody></table></div></section>`;
}

/* ---------- the dashboard ---------- */
export async function adminPage(opts) {
  const ctx = await context(opts);
  const P = ctx.p, rooms = allRooms().slice().reverse();
  const series = (from, where, value = 'count(*)', col = 'ts') => R(`
    with b as (select generate_series(date_trunc(@unit, @since::timestamptz at time zone @tz), date_trunc(@unit, now() at time zone @tz), ('1 ' || @unit)::interval) k)
    select to_char(b.k, 'YYYY-MM-DD HH24') k, coalesce(x.v, 0)::int v from b left join (
      select date_trunc(@unit, ${col} at time zone @tz) k, ${value} v from ${from} where ${col} > @since and ${where} group by 1) x on x.k = b.k order by b.k`, P);

  const [kpi, live, chVisitors, chAccounts, chPlays, chEscapes, funnel, retention, roomStats, opens, gameViews, steps, trouble, shares, fb,
    players, playerCount, clientErr, serverErr, fbList, pages, refs, places, devices, daily, sharing] = await Promise.all([
    O(`select
        (select count(distinct anon_id) from events where name = 'page_view' and ts > @since and ${notMe()})::int visitors,
        (select count(distinct anon_id) from events where name = 'page_view' and ts > @prev and ts <= @since and ${notMe()})::int visitors_prev,
        (select count(*) from "user" where "createdAt" > @since and not (id = any(@xu::text[])))::int accounts,
        (select count(*) from "user" where "createdAt" > @prev and "createdAt" <= @since and not (id = any(@xu::text[])))::int accounts_prev,
        (select count(distinct coalesce(user_id, anon_id::text)) from plays where started_at > @since and ${notMe()})::int players,
        (select count(distinct coalesce(user_id, anon_id::text)) from plays where started_at > @prev and started_at <= @since and ${notMe()})::int players_prev,
        (select count(*) from plays where started_at > @since and ${notMe()})::int plays,
        (select count(*) from plays where started_at > @prev and started_at <= @since and ${notMe()})::int plays_prev,
        (select count(*) from plays where outcome = 'escaped' and ended_at > @since and ${notMe()})::int escapes,
        (select count(*) from plays where outcome = 'escaped' and ended_at > @prev and ended_at <= @since and ${notMe()})::int escapes_prev,
        (select round(percentile_cont(0.5) within group (order by seconds)) from plays where outcome = 'escaped' and ended_at > @since and ${notMe()})::int med,
        (select coalesce(sum(seconds), 0) from plays where started_at > @since and ${notMe()})::bigint secs,
        (select count(*) from events where name in ('client_error', 'server_error') and ts > @since and ${notMe()})::int errors,
        (select count(*) from feedback where created_at > @since and ${notMe()})::int feedback,
        (select count(*) from "user" where not (id = any(@xu::text[])))::int accounts_all`, P),
    livePanel(opts),
    series('events', `name = 'page_view' and ${notMe()}`, 'count(distinct anon_id)'),
    series('"user"', 'not (id = any(@xu::text[]))', 'count(*)', '"createdAt"'),
    series('plays', notMe(), 'count(*)', 'started_at'),
    series('plays', `outcome = 'escaped' and ${notMe()}`, 'count(*)', 'ended_at'),
    O(`with nb as (select anon_id from players where first_seen > @since and ${notMe()}),
            nu as (select id from "user" where "createdAt" > @since and not (id = any(@xu::text[])))
       select (select count(*) from nb)::int browsers,
         (select count(distinct e.anon_id) from events e join nb using (anon_id) where e.name = 'signin_prompt')::int prompted,
         (select count(distinct e.anon_id) from events e join nb using (anon_id) where e.name = 'signin_start')::int google,
         (select count(*) from nu)::int accounts,
         (select count(*) from nu join profiles pr on pr.user_id = nu.id where pr.age_confirmed_at is not null)::int consented,
         (select count(distinct p.user_id) from plays p join nu on nu.id = p.user_id)::int started,
         (select count(distinct p.user_id) from plays p join nu on nu.id = p.user_id where p.steps_done > 0 or p.outcome = 'escaped')::int solved1,
         (select count(distinct p.user_id) from plays p join nu on nu.id = p.user_id where p.outcome = 'escaped')::int escaped`, P),
    O(`with nu as (select id, ("createdAt" at time zone @tz)::date d0 from "user" where "createdAt" > @since and not (id = any(@xu::text[]))),
            act as (select coalesce(e.user_id, pl.user_id) uid, (e.ts at time zone @tz)::date d from events e left join players pl on pl.anon_id = e.anon_id
                    where e.ts > @since and coalesce(e.user_id, pl.user_id) in (select id from nu) group by 1, 2)
       select (select count(*) from nu)::int n,
         (select count(*) from nu where (select count(*) from act where act.uid = nu.id and act.d > nu.d0) > 0)::int back,
         (select count(*) from nu where exists (select 1 from act where act.uid = nu.id and act.d between nu.d0 + 1 and nu.d0 + 7))::int back7,
         (select count(*) from nu where (select count(distinct room) from plays where user_id = nu.id) >= 2)::int rooms2,
         (select count(*) from nu where exists (select 1 from plays where user_id = nu.id and outcome = 'escaped'))::int escaped`, P),
    R(`select room, count(*)::int starts, count(distinct coalesce(user_id, anon_id::text))::int players,
         count(*) filter (where outcome = 'escaped')::int escapes,
         round(percentile_cont(0.5) within group (order by seconds) filter (where outcome = 'escaped'))::int med,
         round(percentile_cont(0.9) within group (order by seconds) filter (where outcome = 'escaped'))::int p90,
         round(avg(hints) filter (where outcome = 'escaped'), 1)::float avg_hints,
         round(avg(seconds) filter (where outcome <> 'escaped' and last_seen < now() - interval '2 hours'))::int quit_secs,
         count(*) filter (where device like 'phone%')::int phone, count(*) filter (where device like 'phone%' and outcome = 'escaped')::int phone_esc
       from plays where started_at > @since and ${notMe()} group by room`, P),
    R(`select room, count(*)::int n from events where name = 'room_open' and ts > @since and ${notMe()} group by room`, P),
    R(`select substring(data->>'path' from '^/play/([a-z0-9_-]+)') room, count(*)::int n from events
       where name = 'page_view' and data->>'path' like '/play/%' and ts > @since and ${notMe()} group by 1`, P),
    R(`select room, steps_done, outcome, count(*)::int n, max(steps_total)::int st from plays
       where started_at > @since and ${notMe()} and (outcome = 'escaped' or last_seen < now() - interval '2 hours') group by room, steps_done, outcome`, P),
    R(`select room, step, name, count(*)::int n from events where name in ('hint_used', 'wrong') and step is not null and ts > @since and ${notMe()} group by room, step, name`, P),
    R(`select room, count(*)::int shares, coalesce(sum(landings), 0)::int landings, coalesce(sum(plays_started), 0)::int plays
       from shares where created_at > @since and ${notMe()} group by room`, P),
    R(`select room, count(rating)::int n, round(avg(rating), 1)::float avg, count(*) filter (where difficulty = 'Too easy')::int easy,
         count(*) filter (where difficulty = 'Just right')::int ok, count(*) filter (where difficulty = 'Too hard')::int hard
       from feedback where created_at > @since and ${notMe()} group by room`, P),
    R(`select u.id uid, u.name uname, u.email, u."createdAt" created, pr.age_confirmed_at, s.plays, s.escapes, s.rooms, s.rooms_escaped, s.secs, s.last_play,
         pl.device, pl.country, greatest(pl.last_seen, s.last_play, u."createdAt") last_active
       from "user" u left join profiles pr on pr.user_id = u.id
       left join lateral (select count(*)::int plays, count(*) filter (where outcome = 'escaped')::int escapes, count(distinct room)::int rooms,
           count(distinct room) filter (where outcome = 'escaped')::int rooms_escaped, coalesce(sum(seconds), 0)::int secs, max(last_seen) last_play
           from plays where user_id = u.id) s on true
       left join lateral (select device, country, last_seen from players where user_id = u.id order by last_seen desc limit 1) pl on true
       where not (u.id = any(@xu::text[])) order by last_active desc nulls last limit 200`, P),
    O(`select count(*)::int n from "user" where not (id = any(@xu::text[]))`, P),
    R(`select data->>'message' msg, mode() within group (order by data->>'where') loc, count(*)::int n, count(distinct anon_id)::int people, max(ts) last,
         string_agg(distinct room, ', ') rooms, string_agg(distinct split_part(device, ' ', 3), ', ') browsers
       from events where name = 'client_error' and ts > @since and ${notMe()} group by 1 order by n desc, last desc limit 20`, P),
    R(`select data->>'method' || ' ' || coalesce(data->>'path', '') path, data->>'message' msg, max(data->>'where') loc, count(*)::int n, max(ts) last
       from events where name = 'server_error' and ts > @since group by 1, 2 order by last desc limit 20`, P),
    R(`select f.created_at, f.room, f.kind, f.rating, f.difficulty, f.text, f.context, u.id uid, u.name uname, u.email, f.anon_id
       from feedback f left join "user" u on u.id = f.user_id where f.created_at > @since and ${notMe('f.')} order by f.created_at desc limit 50`, P),
    R(`select regexp_replace(coalesce(data->>'path', '?'), '^/r/.*$', '/r/…') p, count(*)::int n, count(distinct anon_id)::int u
       from events where name = 'page_view' and ts > @since and ${notMe()} group by 1 order by 3 desc, 2 desc limit 15`, P),
    R(`select data->>'ref' ref, count(distinct anon_id)::int u from events where name = 'page_view' and data->>'ref' is not null
       and data->>'ref' <> @host and ts > @since and ${notMe()} group by 1 order by 2 desc limit 15`,
      { ...P, host: (() => { try { return new URL(cfg.baseURL).host; } catch (e) { return ''; } })() }),
    R(`select country, count(distinct anon_id)::int u from events where name = 'page_view' and ts > @since and ${notMe()} group by 1 order by 2 desc limit 15`, P),
    R(`select split_part(device, ' ', 1) kind, split_part(device, ' ', 2) os, split_part(device, ' ', 3) browser, count(distinct anon_id)::int u
       from events where name = 'page_view' and ts > @since and ${notMe()} group by 1, 2, 3 order by 4 desc limit 15`, P),
    R(`with b as (select generate_series(date_trunc('day', @since::timestamptz at time zone @tz), date_trunc('day', now() at time zone @tz), interval '1 day')::date d),
         v as (select (ts at time zone @tz)::date d, count(distinct anon_id) visitors, count(*) views from events where name = 'page_view' and ts > @since and ${notMe()} group by 1),
         a as (select ("createdAt" at time zone @tz)::date d, count(*) n from "user" where "createdAt" > @since and not (id = any(@xu::text[])) group by 1),
         s as (select (started_at at time zone @tz)::date d, count(*) n from plays where started_at > @since and ${notMe()} group by 1),
         x as (select (ended_at at time zone @tz)::date d, count(*) n from plays where outcome = 'escaped' and ended_at > @since and ${notMe()} group by 1)
       select to_char(b.d, 'YYYY-MM-DD') d, coalesce(v.visitors, 0)::int visitors, coalesce(v.views, 0)::int views, coalesce(a.n, 0)::int accounts,
         coalesce(s.n, 0)::int starts, coalesce(x.n, 0)::int escapes
       from b left join v using (d) left join a using (d) left join s using (d) left join x using (d) order by b.d desc limit 400`, P),
    sharingSection(ctx),
  ]);
  const by = (list, id) => list.find(r => r.room === id) || {};

  /* headline numbers */
  const tiles = [
    ['Visitors', kpi.visitors, kpi.visitors_prev, 'different browsers that opened a page'],
    ['New accounts', kpi.accounts, kpi.accounts_prev, `${num(kpi.accounts_all)} accounts in all`],
    ['Players', kpi.players, kpi.players_prev, 'signed-in people who started a room'],
    ['Plays started', kpi.plays, kpi.plays_prev, `${dur(kpi.secs)} played in total`],
    ['Escapes', kpi.escapes, kpi.escapes_prev, kpi.med ? `median time ${fmtTime(kpi.med)}` : 'no escapes yet'],
    ['Problems', kpi.errors, null, `errors · ${num(kpi.feedback)} feedback messages`],
  ].map(([label, v, prev, note]) => `<div class="tile${label === 'Problems' && v ? ' warn' : ''}"><span>${label}</span><b>${num(v)}</b>${delta(v, prev, ctx)}<small>${esc(note)}</small></div>`).join('');

  const chart = (label, list, color, noun, total) => `<figure class="fig"><figcaption><span>${label}</span><b>${total ?? num(list.reduce((a, p) => a + p.v, 0))}</b></figcaption>${barChart({ points: list, unit: ctx.unit, color, noun })}</figure>`;
  const per = { hour: 'an hour', day: 'a day', week: 'a week' }[ctx.unit];
  const charts = chart(`Visitors ${per}`, chVisitors, 'var(--s1)', 'visitors', `${num(kpi.visitors)} <small>different in all</small>`) + chart('New accounts', chAccounts, 'var(--s2)', 'new accounts')
    + chart('Plays started', chPlays, 'var(--s1)', 'plays started') + chart('Escapes', chEscapes, 'var(--s3)', 'escapes');

  /* sign-up funnel */
  const fsteps = [
    ['New browsers', funnel.browsers, 'first visit in this period'],
    ['Saw the sign-in dialog', funnel.prompted, ''],
    ['Went to Google', funnel.google, ''],
    ['Created an account', funnel.accounts, 'all new accounts this period'],
    ['Confirmed 18 or older', funnel.consented, ''],
    ['Started a room', funnel.started, ''],
    ['Solved a puzzle', funnel.solved1, ''],
    ['Escaped a room', funnel.escaped, ''],
  ];
  const fmax = Math.max(1, ...fsteps.map(s => s[1]));
  const funnelRows = fsteps.map(([label, v, note], i) => `<tr><td>${label}${note ? `<small>${note}</small>` : ''}</td><td class="n">${num(v)}</td>
    <td class="wide">${meter(v, fmax)}</td><td class="n muted">${i ? `${pct(v, fsteps[i - 1][1])}% of the step above` : ''}</td></tr>`).join('');

  const ret = [
    ['Came back another day', retention.back], ['Came back within a week', retention.back7],
    ['Played two or more rooms', retention.rooms2], ['Escaped at least one room', retention.escaped],
  ].map(([l, v]) => `<div class="tile"><span>${l}</span><b>${pct(v, retention.n)}%</b><small>${num(v)} of ${num(retention.n)} new accounts</small></div>`).join('');

  /* rooms */
  const maxStarts = Math.max(1, ...roomStats.map(p => p.starts));
  const roomRows = rooms.map(m => {
    const p = by(roomStats, m.id), o = by(opens, m.id), g = by(gameViews, m.id), s = by(shares, m.id), f = by(fb, m.id);
    if (!p.starts && !o.n && !g.n) return `<tr class="dim"><td><b>${esc(m.title)}</b><small>#${m.n}</small></td><td colspan="9" class="muted">No activity in this period</td></tr>`;
    return `<tr><td><b>${esc(m.title)}</b><small>#${m.n}</small></td>
      <td class="n">${num(g.n)}<small>${g.n ? `${pct(o.n, g.n)}% loaded` : ''}</small></td>
      <td class="n">${num(p.starts)} ${meter(p.starts || 0, maxStarts)}<small>${pl(p.players, 'player')}</small></td>
      <td class="n">${num(p.escapes)}<small>${pct(p.escapes, p.starts)}%</small></td>
      <td class="n">${p.med ? fmtTime(p.med) : '–'}<small>${p.p90 ? `slowest 10%: ${fmtTime(p.p90)}` : ''}</small></td>
      <td class="n">${p.avg_hints ?? '–'}</td>
      <td class="n">${p.quit_secs ? dur(p.quit_secs) : '–'}</td>
      <td class="n">${pct(p.phone, p.starts)}%<small>${p.phone ? `${pct(p.phone_esc, p.phone)}% escape` : ''}</small></td>
      <td class="n">${num(s.shares)}<small>${pl(s.landings, 'visit')} · ${pl(s.plays, 'play')}</small></td>
      <td class="n">${f.n ? `${f.avg} / 5` : '–'}<small>${f.n ? `${pl(f.n, 'rating')}${f.hard ? ` · ${f.hard} too hard` : ''}${f.easy ? ` · ${f.easy} too easy` : ''}` : ''}</small></td></tr>`;
  }).join('');

  const funnels = rooms.map(m => {
    const list = steps.filter(r => r.room === m.id); if (!list.length) return '';
    const total = list.reduce((a, r) => a + r.n, 0), st = Math.max(...list.map(r => r.st || 0), ...list.map(r => r.steps_done));
    const tr = trouble.filter(r => r.room === m.id), maxT = Math.max(1, ...tr.map(r => r.n));
    const cells = [];
    for (let k = 0; k <= st; k++) {
      const reached = list.filter(r => r.outcome === 'escaped' || r.steps_done >= k).reduce((a, r) => a + r.n, 0);
      const stopped = list.filter(r => r.outcome !== 'escaped' && r.steps_done === k).reduce((a, r) => a + r.n, 0);
      const hints = (tr.find(r => r.step === k && r.name === 'hint_used') || {}).n || 0;
      const wrong = (tr.find(r => r.step === k && r.name === 'wrong') || {}).n || 0;
      cells.push(`<tr><td>${k === 0 ? 'Started' : `Puzzle ${k} solved`}</td><td class="n">${reached}<small>${pct(reached, total)}%</small></td><td class="wide">${meter(reached, total)}</td>
        <td class="n">${k < st ? (stopped || '') : ''}</td><td class="n">${k < st ? hints || '' : ''}</td><td>${k < st && hints ? meter(hints, maxT, 's2') : ''}</td><td class="n">${k < st ? wrong || '' : ''}</td><td>${k < st && wrong ? meter(wrong, maxT, 'bad') : ''}</td></tr>`);
    }
    const escd = list.filter(r => r.outcome === 'escaped').reduce((a, r) => a + r.n, 0);
    cells.push(`<tr><td><b>Escaped</b></td><td class="n">${escd}<small>${pct(escd, total)}%</small></td><td class="wide">${meter(escd, total, 's3')}</td><td colspan="5"></td></tr>`);
    return `<details class="fold"><summary>${esc(m.title)} <small>${pl(total, 'finished or stopped play')}</small></summary><div class="scroll">
      <table class="t"><thead><tr><th></th><th class="n">Plays</th><th></th><th class="n">Stopped here</th><th class="n" colspan="2">Hints on the next puzzle</th><th class="n" colspan="2">Wrong guesses</th></tr></thead><tbody>${cells.join('')}</tbody></table></div></details>`;
  }).join('') || '<p class="muted">No finished or stopped plays yet. A play counts here once it escapes or goes quiet for two hours.</p>';

  /* players */
  const playerRow = u => `<tr><td>${who(u, true, ctx.ownIds)}<small>${esc(u.email || '')}</small></td><td>${esc(ago(u.last_active))}</td><td>${esc(fmtDT(u.created))}${u.age_confirmed_at ? '' : '<small class="bad">18+ not confirmed</small>'}</td>
    <td class="n">${num(u.plays)}</td><td class="n">${num(u.rooms_escaped)}<small>of ${pl(u.rooms, 'room')} tried</small></td><td class="n">${u.secs ? dur(u.secs) : '–'}</td>
    <td>${esc(deviceShort(u.device))}</td><td>${esc(country(u.country))}</td></tr>`;
  const playerHead = '<thead><tr><th>Player</th><th>Last active</th><th>Joined</th><th class="n">Plays</th><th class="n">Rooms escaped</th><th class="n">Time played</th><th>Device</th><th>Country</th></tr></thead>';
  const playerRows = players.slice(0, 25).map(playerRow).join('') || '<tr><td colspan="8" class="muted">No accounts yet.</td></tr>';
  const playerMore = players.length > 25 ? `<details class="fold"><summary>${pl(players.length - 25, 'more player')}</summary><div class="scroll"><table class="t">${playerHead}<tbody>${players.slice(25).map(playerRow).join('')}</tbody></table></div></details>` : '';

  /* problems */
  const errRows = clientErr.map(e => `<tr><td><code>${esc(e.msg || '')}</code><small>${esc(e.loc || '')}</small></td><td class="n">${num(e.n)}</td><td class="n">${num(e.people)}</td>
    <td>${esc(e.rooms ? e.rooms.split(', ').map(roomTitle).join(', ') : '–')}</td><td>${esc(e.browsers || '')}</td><td>${esc(ago(e.last))}</td></tr>`).join('')
    || '<tr><td colspan="6" class="muted">No browser errors in this period.</td></tr>';
  const srvRows = serverErr.map(e => `<tr><td><code>${esc(e.path || '')}</code></td><td>${esc(e.msg || '')}<small>${esc(e.loc || '')}</small></td><td class="n">${num(e.n)}</td><td>${esc(ago(e.last))}</td></tr>`).join('')
    || '<tr><td colspan="4" class="muted">No server errors in this period.</td></tr>';

  const fbRows = fbList.map(f => `<tr><td>${esc(fmtDT(f.created_at))}</td><td>${who(f, true, ctx.ownIds)}</td><td>${esc(roomTitle(f.room) || '–')}</td>
    <td>${esc(f.kind)}${f.rating ? ` · ${f.rating}/5` : ''}${f.difficulty ? ` · ${esc(f.difficulty)}` : ''}</td>
    <td>${esc(f.text || '')}<small>${fbWhere(f)}</small></td></tr>`).join('')
    || '<tr><td colspan="5" class="muted">No feedback in this period.</td></tr>';

  const small = (list, cols, empty) => list.length ? list.map(r => `<tr>${cols.map(([k, n, f]) => `<td class="${n ? 'n' : ''}">${esc(f ? f(r[k], r) : r[k] ?? '')}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" class="muted">${empty}</td></tr>`;
  const dailyRows = daily.map(d => `<tr><td>${esc(d.d)}</td><td class="n">${num(d.visitors)}</td><td class="n">${num(d.views)}</td><td class="n">${num(d.accounts)}</td><td class="n">${num(d.starts)}</td><td class="n">${num(d.escapes)}</td></tr>`).join('');

  const q = (o = {}) => `?${new URLSearchParams({ range: ctx.range, ...o })}`;
  const head = headTags({ title: `Dashboard · ${cfg.siteName}`, description: 'What is happening on the site', path: '/admin', page: 'admin', noindex: true });
  return layout(head, `<style>${ADMIN_CSS}</style><div class="wrap dash">
<div class="dhead"><div><p class="eyebrow">Production · build ${esc(cfg.version)}</p><h1>Dashboard</h1></div>
<nav class="ctl" aria-label="Period"><a class="toggle" href="#sharing">Sharing</a><span class="seg">${Object.entries(RANGES).map(([k, r]) => `<a href="${q({ range: k })}" class="${k === ctx.range ? 'on' : ''}">${r.label}</a>`).join('')}</span>
<a class="toggle${ctx.me ? '' : ' on'}" href="${q({ me: ctx.me ? '0' : '1' })}">${ctx.me ? 'Hide my own activity' : 'Your own activity is hidden · show it'}</a></nav></div>

<section id="live" class="live" data-src="/admin/live?me=${ctx.me ? 1 : 0}">${live}</section>

<section><h2>${esc(ctx.label === 'All time' ? 'All time' : `Last ${ctx.label}`)}</h2><div class="tiles">${tiles}</div>
<div class="figs">${charts}</div>
<details class="fold"><summary>Day by day, as a table</summary><div class="scroll"><table class="t"><thead><tr><th>Day (IST)</th><th class="n">Visitors</th><th class="n">Page views</th><th class="n">New accounts</th><th class="n">Plays started</th><th class="n">Escapes</th></tr></thead><tbody>${dailyRows}</tbody></table></div></details></section>

<section><h2>From first visit to first escape</h2><p class="muted lead">New browsers and new accounts in this period, step by step.</p>
<div class="scroll"><table class="t funnel"><tbody>${funnelRows}</tbody></table></div>
<h3>Do new players stick?</h3><div class="tiles tiles-sm">${ret}</div></section>

<section><h2>Rooms</h2><div class="scroll"><table class="t"><thead><tr><th>Room</th><th class="n">Game page opened</th><th class="n">Plays started</th><th class="n">Escaped</th><th class="n">Median time</th><th class="n">Hints per escape</th><th class="n">Time before giving up</th><th class="n">On phones</th><th class="n">Share links made</th><th class="n">Rating</th></tr></thead><tbody>${roomRows}</tbody></table></div>
<h3>Where players stop</h3>${funnels}</section>

${sharing}

<section><h2>Players <small class="muted">${num(playerCount.n)} accounts${playerCount.n > players.length ? `, the ${players.length} most recently active shown` : ''}</small></h2>
<div class="scroll"><table class="t">${playerHead}<tbody>${playerRows}</tbody></table></div>${playerMore}</section>

<section><h2>Problems</h2><h3>Browser errors</h3><div class="scroll"><table class="t"><thead><tr><th>Error</th><th class="n">Times</th><th class="n">Visitors hit</th><th>Rooms</th><th>Browsers</th><th>Last</th></tr></thead><tbody>${errRows}</tbody></table></div>
<h3>Server errors</h3><div class="scroll"><table class="t"><thead><tr><th>Request</th><th>Error</th><th class="n">Times</th><th>Last</th></tr></thead><tbody>${srvRows}</tbody></table></div></section>

<section><h2>Feedback</h2><div class="scroll"><table class="t"><thead><tr><th>When (IST)</th><th>Who</th><th>Room</th><th>Kind</th><th>What they said</th></tr></thead><tbody>${fbRows}</tbody></table></div></section>

<section><h2>Traffic</h2><div class="grid4">
<div><h3>Pages</h3><table class="t"><thead><tr><th>Page</th><th class="n">Visitors</th><th class="n">Views</th></tr></thead><tbody>${small(pages, [['p'], ['u', 1, num], ['n', 1, num]], 'None yet.')}</tbody></table></div>
<div><h3>Came from</h3><table class="t"><thead><tr><th>Site</th><th class="n">Visitors</th></tr></thead><tbody>${small(refs, [['ref'], ['u', 1, num]], 'No other sites yet.')}</tbody></table></div>
<div><h3>Countries</h3><table class="t"><thead><tr><th>Country</th><th class="n">Visitors</th></tr></thead><tbody>${small(places, [['country', 0, country], ['u', 1, num]], 'None yet.')}</tbody></table></div>
<div><h3>Devices</h3><table class="t"><thead><tr><th>Device</th><th class="n">Visitors</th></tr></thead><tbody>${small(devices, [['kind', 0, (k, r) => deviceShort(`${k} ${r.os} ${r.browser}`)], ['u', 1, num]], 'None yet.')}</tbody></table></div>
</div></section>

<section><h2>Export</h2><p class="exp">${['plays', 'events', 'users', 'feedback', 'shares', 'sharing'].map(t => `<a href="/admin/export/${t}.csv${q({ me: ctx.me ? 1 : 0 })}">${t}.csv</a>`).join('')}</p>
<p class="muted">Times are India time. Bots, link previews and headless browsers aren't counted.</p></section>
</div>
<script>
(() => {
  const box = document.getElementById('live'); if (!box) return;
  let busy = false;
  async function refresh() {
    if (busy || document.visibilityState !== 'visible') return;
    busy = true;
    try { const r = await fetch(box.dataset.src, { credentials: 'same-origin', cache: 'no-store' }); if (r.ok) box.innerHTML = await r.text(); } catch (e) {}
    busy = false;
  }
  setInterval(refresh, 15000);
  document.addEventListener('visibilitychange', refresh);
})();
</script>`, { wide: true });
}

/* ---------- /admin when not signed in as the owner: one Google button ---------- */
const GOOGLE_ICON = '<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
export function adminLoginPage(signedInAs) {
  const head = headTags({ title: `Dashboard · ${cfg.siteName}`, description: 'Sign in', path: '/admin', page: 'admin', noindex: true });
  return layout(head, `<style>
.alog{min-height:calc(100dvh - 76px);display:grid;place-items:center;padding:24px 0 96px}
.alog .card{width:min(380px,100%);text-align:center}
.alog h1{font-size:30px;line-height:38px;margin:12px 0 22px;letter-spacing:-.3px}
.alog .btn{width:100%;justify-content:center;min-height:46px;gap:10px}
.alog .btn[disabled]{opacity:.5;cursor:default}
.alog p{color:var(--muted);font-size:14px;line-height:21px;margin:16px 0 0}
</style><div class="wrap alog"><div class="card">
<p class="eyebrow" style="margin:0">${esc(cfg.siteName)}</p><h1>Dashboard</h1>
<button class="btn" type="button" id="go" data-switch="${signedInAs ? '1' : ''}">${GOOGLE_ICON}<span>${signedInAs ? 'Sign in with another Google account' : 'Sign in with Google'}</span></button>
${signedInAs ? `<p>You're signed in as ${esc(signedInAs)}, which can't open the dashboard.</p>` : ''}
<p id="err" hidden>Couldn't reach Google. Try again.</p>
</div></div>
<script>
(() => {
  const go = document.getElementById('go'), err = document.getElementById('err');
  const post = (path, body) => fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  go.onclick = async () => {
    go.disabled = true; err.hidden = true;
    try {
      if (go.dataset.switch) await post('/api/auth/sign-out');
      const r = await post('/api/auth/sign-in/social', { provider: 'google', callbackURL: '/admin' });
      const j = await r.json();
      if (j && j.url) { location.href = j.url; return; }
      throw new Error('no url');
    } catch (e) { go.disabled = false; err.hidden = false; }
  };
})();
</script>`, { nav: false, footer: false });
}

/* ---------- one player ---------- */
export async function playerPage(uid, opts) {
  const u = await O(`select u.id uid, u.name uname, u.email, u.image, u."createdAt" created, pr.age_confirmed_at from "user" u
                     left join profiles pr on pr.user_id = u.id where u.id = @uid`, { uid });
  if (!u) return null;
  const P = { uid };
  const [browsers, plays, results, events, fbs] = await Promise.all([
    R(`select anon_id, first_seen, last_seen, device, country from players where user_id = @uid order by last_seen desc`, P),
    R(`select * from plays where user_id = @uid order by started_at desc limit 200`, P),
    R(`select room, day, seconds, hints, wrong from results where user_id = @uid order by day`, P),
    R(`select e.ts, e.name, e.room, e.step, e.data, e.device, e.country from events e
       where (e.user_id = @uid or e.anon_id in (select anon_id from players where user_id = @uid)) order by e.ts desc limit 500`, P),
    R(`select created_at, room, kind, rating, difficulty, text from feedback where user_id = @uid order by created_at desc`, P),
  ]);
  const last = browsers[0] || {};
  const playRows = plays.map(p => `<tr><td>${esc(fmtDT(p.started_at))}</td><td>${esc(roomTitle(p.room))}</td>
    <td>${p.outcome === 'escaped' ? '<span class="good">Escaped</span>' : new Date(p.last_seen) > Date.now() - 180e3 ? 'Playing now' : 'Stopped'}${p.resumed ? ' <small>resumed</small>' : ''}</td>
    <td class="n">${p.steps_done}${p.steps_total ? ` / ${p.steps_total}` : ''}</td><td class="n">${p.seconds ? fmtTime(p.seconds) : '–'}</td><td class="n">${p.hints}</td><td class="n">${p.wrong}</td><td>${esc(deviceShort(p.device))}</td></tr>`).join('')
    || '<tr><td colspan="8" class="muted">No plays yet.</td></tr>';
  const timeline = events.map(e => `<li><time>${esc(fmtDT(e.ts))}</time><span>${describe(e)}</span><span class="muted">${esc(deviceShort(e.device))}</span></li>`).join('')
    || '<li class="muted">Nothing recorded yet.</li>';
  const head = headTags({ title: `${u.uname || u.email} · Dashboard`, description: 'Player', path: '/admin', page: 'admin', noindex: true });
  const back = '/admin';
  return layout(head, `<style>${ADMIN_CSS}</style><div class="wrap dash">
<p class="eyebrow"><a href="${back}">Dashboard</a> · Player</p>
<div class="phead">${u.image ? `<img src="${esc(u.image)}" alt="" referrerpolicy="no-referrer">` : ''}<div><h1>${esc(u.uname || 'Player')}</h1><p class="muted">${esc(u.email || '')}</p></div></div>
<div class="tiles tiles-sm"><div class="tile"><span>Joined</span><b class="sm">${esc(fmtDT(u.created))}</b><small>${u.age_confirmed_at ? 'confirmed 18 or older' : '18+ not confirmed yet'}</small></div>
<div class="tile"><span>Last seen</span><b class="sm">${esc(ago(last.last_seen))}</b><small>${esc(deviceShort(last.device))} · ${esc(country(last.country))}</small></div>
<div class="tile"><span>Plays</span><b>${num(plays.length)}</b><small>${num(plays.filter(p => p.outcome === 'escaped').length)} escapes</small></div>
<div class="tile"><span>Rooms escaped</span><b>${num(results.length)}</b><small>${esc(results.map(r => `${roomTitle(r.room)} ${fmtTime(r.seconds)}`).join(' · ') || '–')}</small></div></div>
<section><h2>Plays</h2><div class="scroll"><table class="t"><thead><tr><th>Started (IST)</th><th>Room</th><th>Outcome</th><th class="n">Puzzles</th><th class="n">Time</th><th class="n">Hints</th><th class="n">Wrong</th><th>Device</th></tr></thead><tbody>${playRows}</tbody></table></div></section>
${fbs.length ? `<section><h2>Feedback</h2><ul class="plain">${fbs.map(f => `<li><time>${esc(fmtDT(f.created_at))}</time> ${esc(roomTitle(f.room) || '')} · ${esc(f.kind)}${f.rating ? ` · ${f.rating}/5` : ''}${f.difficulty ? ` · ${esc(f.difficulty)}` : ''}<br>${esc(f.text || '')}</li>`).join('')}</ul></section>` : ''}
<section><h2>Everything they did <small class="muted">newest first${events.length >= 500 ? ', last 500' : ''}</small></h2><ol class="feed tl">${timeline}</ol></section>
<section><h2>Browsers</h2><table class="t"><thead><tr><th>Device</th><th>Country</th><th>First seen</th><th>Last seen</th></tr></thead><tbody>
${browsers.map(b => `<tr><td>${esc(deviceShort(b.device))}</td><td>${esc(country(b.country))}</td><td>${esc(fmtDT(b.first_seen))}</td><td>${esc(ago(b.last_seen))}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">None.</td></tr>'}</tbody></table></section>
</div>`, { wide: true });
}

/* ---------- CSV exports ---------- */
const EXPORTS = {
  plays: `select p.id, p.room, p.user_id, u.email, p.anon_id, p.started_at, p.last_seen, p.ended_at, p.outcome, p.resumed, p.steps_total, p.steps_done, p.hints, p.wrong,
            p.seconds, p.marks, p.first_escape, p.from_share, p.from_via, p.device, p.country, p.app_version
          from plays p left join "user" u on u.id = p.user_id where p.started_at > @since and ${notMe('p.')} order by p.started_at`,
  events: `select e.id, e.ts, e.play_id, e.anon_id, e.user_id, e.room, e.name, e.step, e.data, e.device, e.country, e.app_version
           from events e where e.ts > @since and ${notMe('e.')} order by e.id`,
  users: `select u.id, u.name, u.email, u."createdAt" created_at, pr.age_confirmed_at,
            (select max(last_seen) from players where user_id = u.id) last_seen,
            (select count(*) from plays where user_id = u.id) plays,
            (select count(*) from plays where user_id = u.id and outcome = 'escaped') escapes
          from "user" u left join profiles pr on pr.user_id = u.id where not (u.id = any(@xu::text[])) order by u."createdAt"`,
  feedback: `select f.id, f.created_at, f.room, f.kind, f.rating, f.difficulty, f.text, f.context, f.device, f.user_id, u.email
             from feedback f left join "user" u on u.id = f.user_id where f.created_at > @since and ${notMe('f.')} order by f.id`,
  shares: `select code, kind, room, surface, user_id, seconds, hints, wrong, marks, created_at, clicks, landings, plays_started from shares
           where created_at > @since and ${notMe()} order by created_at`,
  sharing: `select ts, name, room, data->>'kind' kind, data->>'surface' surface, coalesce(data->>'channel', data->>'via') channel, data->>'code' code, anon_id, user_id, device, country
            from events where name in ('share_open', 'share_click', 'share_visit') and ts > @since and ${notMe()} order by id`,
};
export async function exportCsv(table, opts) {
  if (!EXPORTS[table]) return null;
  const ctx = await context(opts);
  const list = await R(EXPORTS[table], ctx.p);
  const cols = list.length ? Object.keys(list[0]) : [];
  const cell = v => { if (v === null || v === undefined) return ''; if (v instanceof Date) v = v.toISOString(); else if (typeof v === 'object') v = JSON.stringify(v); v = String(v); return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return [cols.join(','), ...list.map(r => cols.map(c => cell(r[c])).join(','))].join('\n') + '\n';
}

/* ---------- styles ---------- */
const ADMIN_CSS = `
:root{--s1:#c98500;--s2:#3987e5;--s3:#199e70;--bad:#e66767;--track:#221f1c}
.dash{padding-top:4px;padding-bottom:96px}.dash h1{font-size:34px;line-height:42px;margin:6px 0 0;letter-spacing:-.4px}
.dash h2{font-size:22px;line-height:30px;margin:0 0 14px}.dash h2 small{font-size:14px;margin-left:8px}.dash h3{font-size:15px;line-height:22px;margin:26px 0 10px;color:var(--ink2)}
.dash section{padding:36px 0 8px;border-top:1px solid var(--line);margin-top:32px}.dash section.live{margin-top:24px}
.dash a{text-decoration:none}.dash .eyebrow a{color:var(--lamp)}.lead{margin:-6px 0 14px}
@media(max-width:640px){.dash h1{font-size:28px;line-height:36px}.t th,.t td{padding:8px 6px}}
.dhead{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}
.ctl{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.seg{display:inline-flex;border:1px solid var(--line2);border-radius:999px;padding:3px;gap:2px;max-width:100%;overflow-x:auto;scrollbar-width:none}.seg a{padding:5px 12px;border-radius:999px;color:var(--muted);font-size:13.5px;line-height:20px;white-space:nowrap}
@media(max-width:640px){.ctl{width:100%}.seg a{padding:5px 9px}}
.seg a:hover{color:var(--ink)}.seg a.on{background:var(--ink);color:var(--bg)}
.toggle{font-size:13.5px;color:var(--muted);border:1px solid var(--line2);border-radius:999px;padding:6px 14px}.toggle:hover,.toggle.on{color:var(--ink)}.toggle.on{border-color:var(--lamp)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;gap:2px;min-width:0}
.tile span{color:var(--muted);font-size:13px}.tile b{font-size:30px;line-height:38px;font-weight:400;font-variant-numeric:tabular-nums}.tile b.sm{font-size:19px;line-height:30px}
.tile small{color:var(--muted);font-size:12.5px;line-height:18px}.tile em{font-style:normal;font-size:12.5px;color:var(--muted)}.tile em.up{color:#7fc79a}.tile em.down{color:var(--bad)}
.tile.warn{border-color:#5a2a26}.tile.warn b{color:var(--bad)}
.tiles-sm .tile b{font-size:24px;line-height:32px}
.figs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}@media(max-width:820px){.figs{grid-template-columns:minmax(0,1fr)}}
.fig{margin:0;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px 16px 10px}
.fig figcaption{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}.fig figcaption span{color:var(--muted);font-size:13px}.fig figcaption b{font-weight:400;font-size:18px;font-variant-numeric:tabular-nums}
.cw{position:relative}.ymax{position:absolute;left:0;top:-2px;font:11px/14px var(--mono);color:var(--muted)}
.xl{display:flex;justify-content:space-between;font:11px/16px var(--mono);color:var(--muted);margin-top:4px}
.chart{width:100%;height:112px;display:block}.fig figcaption b small{font-size:12.5px;color:var(--muted)}.chart .grid{stroke:var(--line);stroke-dasharray:2 4}.chart .base{stroke:var(--line2)}
.chart .hit{fill:transparent}.chart .col:hover .hit{fill:rgba(237,232,222,.06)}
.t{width:100%;border-collapse:collapse;font-size:14px}.t th,.t td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.t th{font:500 11px/16px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap}.t td small{display:block;color:var(--muted);font-size:12px;line-height:17px}
.t tr.dim td{color:var(--faint)}.t td.wide{width:30%}@media(max-width:640px){.t td:first-child{min-width:130px}}
.n{text-align:right!important;font-variant-numeric:tabular-nums;white-space:nowrap}.scroll{overflow-x:auto}
.meter{display:inline-block;width:110px;height:6px;background:var(--track);border-radius:3px;vertical-align:middle;margin-left:8px}.t td.wide .meter{width:100%;margin:0}
.meter i{display:block;height:100%;border-radius:3px;background:var(--s1)}.meter.s2 i{background:var(--s2)}.meter.s3 i{background:var(--s3)}.meter.bad i{background:var(--bad)}
.funnel td:first-child{width:28%}
details.fold{border-top:1px solid var(--line);padding:4px 0}details.fold summary{cursor:pointer;padding:10px 0;font-size:15px}details.fold summary small{color:var(--muted);margin-left:8px}
.livehead{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:12px}.livehead h2{margin:0;display:flex;align-items:center;gap:10px}
.dot{width:9px;height:9px;border-radius:50%;background:#7fc79a;box-shadow:0 0 0 0 rgba(127,199,154,.6);animation:pulse 2s infinite}
@keyframes pulse{70%{box-shadow:0 0 0 8px rgba(127,199,154,0)}100%{box-shadow:0 0 0 0 rgba(127,199,154,0)}}@media(prefers-reduced-motion:reduce){.dot{animation:none}}
.split{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:28px}@media(max-width:980px){.split{grid-template-columns:minmax(0,1fr)}}
.feed{list-style:none;margin:0;padding:0;max-height:440px;overflow:auto;border-top:1px solid var(--line)}.feed.tl{max-height:none}
.feed li{display:grid;grid-template-columns:86px minmax(90px,170px) minmax(0,1fr);gap:12px;padding:8px 4px;border-bottom:1px solid var(--line);font-size:13.5px;line-height:20px}
.feed.tl li{grid-template-columns:120px minmax(0,1fr) 170px}.feed time{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.feed code,.t code{font:12.5px var(--mono);color:var(--ink2);word-break:break-word}
@media(max-width:640px){.feed li,.feed.tl li{grid-template-columns:minmax(0,1fr);gap:2px}}
.who{color:var(--ink);border-bottom:1px solid var(--faint)}.who:hover{border-color:var(--ink)}
.good{color:#7fc79a}.bad{color:var(--bad)}
.grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}.grid4 h3{margin-top:0}@media(max-width:1000px){.grid4{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.grid4{grid-template-columns:minmax(0,1fr)}}
.exp{display:flex;flex-wrap:wrap;gap:8px 16px}.exp a{color:var(--ink2);border-bottom:1px solid var(--faint)}
.phead{display:flex;gap:16px;align-items:center;margin:4px 0 20px}.phead img{width:56px;height:56px;border-radius:50%;border:1px solid var(--line2)}.phead p{margin:2px 0 0}
.plain{list-style:none;padding:0;margin:0}.plain li{padding:10px 0;border-bottom:1px solid var(--line);color:var(--ink2)}.plain time{color:var(--muted)}`;
