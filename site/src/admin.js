// /admin: product analytics for the live site, the way consumer apps report it. Opens for cfg.admins only (see config.js).
//   /admin                  the dashboard (?range=7d|30d|90d|all, ?by=day|week; ?me=0 leaves out the owner's own activity, remembered in a cookie)
//   /admin/export/<t>.csv   raw rows
// Definitions (India time):
//   active user  a signed-in person with any activity that day (a visit or a play); browsers link to their account once signed in
//   new user     a Google sign-up
//   D1, D7, D30  % of sign-ups active again exactly 1, 7 or 30 days after the day they signed up (among those old enough)
//   M1           % of sign-ups active at any point in days 30–59 after signing up
import { cfg } from './config.js';
import { rows, one } from './db.js';
import { allRooms, fmtTime, retiredTitle } from './rooms.js';
import { esc, headTags, layout } from './pages.js';

/* ---------- options from the query string ---------- */
const RANGES = {
  '7d': { label: 'Last 7 days', short: '7 days', days: 7 },
  '30d': { label: 'Last 30 days', short: '30 days', days: 30 },
  '90d': { label: 'Last 90 days', short: '90 days', days: 90 },
  all: { label: 'All time', short: 'All time', days: null },
};
// me: include the owner's own activity. On by default; ?me=0 leaves it out, and the server remembers the choice in a cookie.
export function adminOptions(query, saved) {
  const range = RANGES[query.range] ? query.range : '30d';
  const by = query.by === 'day' || query.by === 'week' ? query.by : (range === '7d' || range === '30d' ? 'day' : 'week');
  const me = query.me === '0' ? false : query.me === '1' ? true : saved !== '0';
  const upage = Math.min(10000, Math.max(1, parseInt(query.upage, 10) || 1));   // page of the Users list
  return { range, by, me, upage };
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
// one row per signed-in person per day they did anything (India time)
const ACT = `act as (select coalesce(e.user_id, pl.user_id) uid, (e.ts at time zone @tz)::date d
  from events e left join players pl on pl.anon_id = e.anon_id
  where e.ts > @asince and coalesce(e.user_id, pl.user_id) is not null and not (coalesce(e.user_id, pl.user_id) = any(@xu::text[]))
  group by 1, 2)`;

async function context(opts) {
  const r = RANGES[opts.range] || RANGES['30d'];
  const own = await O(`select coalesce(array_agg(distinct u.id), '{}') ids, coalesce(array_agg(distinct p.anon_id) filter (where p.anon_id is not null), '{}') anons
                       from "user" u left join players p on p.user_id = u.id where lower(u.email) = any(@admins::text[])`, { admins: cfg.admins });
  // periods start at midnight India time, so days line up: "Last 7 days" is today and the six days before it
  let since, prev = null;
  if (r.days) {
    const t = await O(`select (date_trunc('day', now() at time zone @tz) - make_interval(days => @n - 1)) at time zone @tz s,
                              (date_trunc('day', now() at time zone @tz) - make_interval(days => 2 * @n - 1)) at time zone @tz p`, { tz: cfg.timeZone, n: r.days });
    since = t.s; prev = t.p;
  } else {
    const f = await O(`select date_trunc('day', least((select min(first_seen) from players), (select min("createdAt") from "user"), now()) at time zone @tz) at time zone @tz t`, { tz: cfg.timeZone });
    since = f.t;
  }
  return {
    ...opts, ...r, since, prev,
    p: { since, prev: prev || since, tz: cfg.timeZone, unit: opts.by, xu: opts.me ? [] : own.ids, xa: opts.me ? [] : own.anons },
    ownIds: own.ids,
  };
}

/* ---------- formatting ---------- */
const nf = new Intl.NumberFormat('en-IN');
const num = v => nf.format(v || 0);
const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
const pctOr = (a, b) => (b ? `${pct(a, b)}%` : '–');
const pl = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
const mins = sec => { sec = Math.max(0, Math.round(sec || 0)); return !sec ? '–' : sec < 60 ? `${sec}s` : sec < 3600 ? `${Math.round(sec / 60)} min` : `${Math.floor(sec / 3600)} h ${Math.round(sec % 3600 / 60)} min`; };
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: cfg.timeZone });
const yearFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: cfg.timeZone });
const dateShort = d => (new Date(d).getFullYear() === new Date().getFullYear() ? shortFmt : yearFmt).format(new Date(d));
function ago(d) {
  if (!d) return '–';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 300) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 30 * 86400) return `${Math.round(s / 86400)} d ago`;
  return dateShort(d);
}
const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dowFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const dateLabel = (d, by, long) => { const x = new Date(`${d}T00:00:00Z`); return by === 'week' ? `${long ? 'Week of ' : ''}${dayFmt.format(x)}` : (long ? dowFmt : dayFmt).format(x); };
const host = () => { try { return new URL(cfg.baseURL).host; } catch (e) { return ''; } };
// change against the previous period of the same length
function delta(cur, prev, ctx) {
  if (!ctx.prev || prev === null || prev === undefined) return '';
  if (!prev) return cur ? '<em class="up">new</em>' : '<em>no change</em>';
  const d = Math.round(100 * (cur - prev) / prev);
  return d === 0 ? '<em>no change</em>' : `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}%</em>`;
}
// feedback is three faces (bad, okay, good: feedback.face, migration 004)
const FACE_PATH = { bad: 'M8.5 16.4c.9-1.15 2.1-1.75 3.5-1.75s2.6.6 3.5 1.75', okay: 'M8.75 15.25h6.5', good: 'M8.5 14.1c.9 1.35 2.1 2.05 3.5 2.05s2.6-.7 3.5-2.05' };
const FACE_WORD = { bad: 'Bad', okay: 'Okay', good: 'Good' };
const faceIcon = f => FACE_PATH[f] ? `<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.25"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="${FACE_PATH[f]}"/></svg>` : '';
const faceTag = f => FACE_PATH[f] ? `<span class="face face-${f}">${faceIcon(f)}${FACE_WORD[f]}</span>` : '';
const roomTitle = id => (allRooms().find(m => m.id === id) || {}).title || (retiredTitle(id) ? `${retiredTitle(id)} (removed)` : id) || '';

/* ---------- a bar chart: server-drawn SVG, one series, a hover title on every bar ---------- */
function barChart(points, by, noun) {
  const W = 560, H = 110, n = Math.max(1, points.length);
  const max = Math.max(1, ...points.map(p => p.v)), bw = W / n, gap = bw > 6 ? 2 : bw > 3 ? 1 : 0, yb = H - 1;
  const bars = points.map((p, i) => {
    const h = p.v ? Math.max(2, (H - 6) * p.v / max) : 0, x = i * bw + gap / 2, w = Math.max(1, bw - gap), y = yb - h, r = Math.min(4, w / 2, h);
    const bar = h ? `<path d="M${x.toFixed(1)},${yb} V${(y + r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x + r).toFixed(1)},${y.toFixed(1)} H${(x + w - r).toFixed(1)} Q${(x + w).toFixed(1)},${y.toFixed(1)} ${(x + w).toFixed(1)},${(y + r).toFixed(1)} V${yb} Z"/>` : '';
    return `<g class="col">${bar}<rect class="hit" x="${(i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}"><title>${esc(dateLabel(p.k, by, true))}: ${pl(p.v, noun)}</title></rect></g>`;
  }).join('');
  const first = points[0], last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(noun)}s by ${by}">${bars}<line x1="0" x2="${W}" y1="${yb}" y2="${yb}" class="base" vector-effect="non-scaling-stroke"/></svg>
    <div class="xl"><span>${first ? esc(dateLabel(first.k, by)) : ''}</span><span>peak ${num(max)}</span><span>${last && points.length > 1 ? esc(dateLabel(last.k, by)) : ''}</span></div>`;
}

/* ---------- Users: every sign-up by email, most recently active first, 20 a page ---------- */
const USERS_PER_PAGE = 20;
async function usersSection(ctx, q, activeWeek) {
  const P = { xu: ctx.p.xu };
  const total = (await O(`select count(*)::int n from "user" where not (id = any(@xu::text[]))`, P)).n;
  const pages = Math.max(1, Math.ceil(total / USERS_PER_PAGE)), page = Math.min(ctx.upage, pages);
  const list = await R(`select u.id, u.email, u."createdAt" created,
       greatest(u."createdAt", (select max(last_seen) from players where user_id = u.id), (select max(last_seen) from plays where user_id = u.id)) last_active,
       (select count(*) from plays where user_id = u.id)::int plays,
       (select count(distinct room) from plays where user_id = u.id and outcome = 'escaped')::int escaped
     from "user" u where not (u.id = any(@xu::text[]))
     order by last_active desc, u."createdAt" desc limit @lim offset @off`, { ...P, lim: USERS_PER_PAGE, off: (page - 1) * USERS_PER_PAGE });
  const rowsHtml = list.map(u => `<tr><td>${esc(u.email || '–')}${ctx.ownIds.includes(u.id) ? ' <span class="muted">(you)</span>' : ''}</td>
    <td class="nw">${esc(dateShort(u.created))}</td><td class="nw">${esc(ago(u.last_active))}</td><td class="n">${num(u.plays)}</td><td class="n">${num(u.escaped)}</td></tr>`).join('');
  const link = (n, label) => `<a href="${q({ upage: n })}#users">${label}</a>`;
  const pager = pages > 1 ? `<nav class="pager" aria-label="Users pages">${page > 1 ? link(page - 1, '&larr; Previous') : '<span></span>'}
    <span class="muted">Page ${num(page)} of ${num(pages)}</span>${page < pages ? link(page + 1, 'Next &rarr;') : '<span></span>'}</nav>` : '';
  return `<section id="users"><h2>Users <small class="muted">${pl(total, 'sign-up')} · ${num(activeWeek)} active in the last 7 days</small></h2>
${total ? `<div class="scroll"><table class="t"><thead><tr><th>Email</th><th>Signed up</th><th>Last active</th><th class="n">Plays</th><th class="n">Rooms escaped</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>${pager}`
    : '<p class="muted">Nobody has signed up yet.</p>'}
<p class="muted small">Everyone who has signed up, most recently active first. Not limited to the period above.</p></section>`;
}

/* ---------- the dashboard ---------- */
export async function adminPage(opts) {
  const ctx = await context(opts);
  const P = ctx.p, EPOCH = new Date(0);
  const SINCE_D = `(@since::timestamptz at time zone @tz)::date`, PREV_D = `(@prev::timestamptz at time zone @tz)::date`;
  const [ov, act, series, ret, cohorts, eng, rooms, stops, faces, acq, shares, fb, fbText, errs] = await Promise.all([
    // overview: this period and the one before it
    O(`select
        (select count(distinct anon_id) from events where name = 'page_view' and ts > @since and ${notMe()})::int visitors,
        (select count(distinct anon_id) from events where name = 'page_view' and ts > @prev and ts <= @since and ${notMe()})::int visitors_prev,
        (select count(*) from "user" where "createdAt" > @since and not (id = any(@xu::text[])))::int new_users,
        (select count(*) from "user" where "createdAt" > @prev and "createdAt" <= @since and not (id = any(@xu::text[])))::int new_users_prev,
        (select count(*) from plays where started_at > @since and ${notMe()})::int plays,
        (select count(*) from plays where started_at > @prev and started_at <= @since and ${notMe()})::int plays_prev`, P),
    // active users in the period, and the standard daily / weekly / monthly actives as of today
    O(`with ${ACT}, today as (select (now() at time zone @tz)::date t0)
       select count(distinct uid) filter (where d >= ${SINCE_D})::int active,
         count(distinct uid) filter (where d >= ${PREV_D} and d < ${SINCE_D})::int active_prev,
         count(distinct uid) filter (where d = t0)::int dau,
         count(distinct uid) filter (where d > t0 - 7)::int wau,
         count(distinct uid) filter (where d > t0 - 30)::int mau,
         (count(*) filter (where d > t0 - 30))::float / 30 avg_dau
       from act, today`, { ...P, asince: new Date(Math.min(new Date(P.prev).getTime(), Date.now() - 31 * 864e5)) }),
    // day by day, or week by week
    R(`with ${ACT},
         b as (select generate_series(date_trunc(@unit, @since::timestamptz at time zone @tz), date_trunc(@unit, now() at time zone @tz), ('1 ' || @unit)::interval)::date k),
         v as (select date_trunc(@unit, ts at time zone @tz)::date k, count(distinct anon_id)::int n from events where name = 'page_view' and ts > @since and ${notMe()} group by 1),
         nu as (select date_trunc(@unit, "createdAt" at time zone @tz)::date k, count(*)::int n from "user" where "createdAt" > @since and not (id = any(@xu::text[])) group by 1),
         au as (select date_trunc(@unit, d)::date k, count(distinct uid)::int n from act group by 1),
         pp as (select date_trunc(@unit, started_at at time zone @tz)::date k, count(*)::int n, count(*) filter (where outcome = 'escaped')::int e from plays where started_at > @since and ${notMe()} group by 1)
       select to_char(b.k, 'YYYY-MM-DD') k, coalesce(v.n, 0) visitors, coalesce(nu.n, 0) new_users, coalesce(au.n, 0) active, coalesce(pp.n, 0) plays, coalesce(pp.e, 0) escapes
       from b left join v using (k) left join nu using (k) left join au using (k) left join pp using (k) order by b.k`, { ...P, asince: P.since }),
    // retention across everyone who has signed up, counting only people old enough for each measure
    O(`with ${ACT}, today as (select (now() at time zone @tz)::date t0),
         c as (select id, ("createdAt" at time zone @tz)::date d0 from "user" where not (id = any(@xu::text[])))
       select count(*) filter (where d0 <= t0 - 1)::int d1n,
         count(*) filter (where d0 <= t0 - 1 and exists (select 1 from act where uid = c.id and d = d0 + 1))::int d1,
         count(*) filter (where d0 <= t0 - 7)::int d7n,
         count(*) filter (where d0 <= t0 - 7 and exists (select 1 from act where uid = c.id and d = d0 + 7))::int d7,
         count(*) filter (where d0 <= t0 - 30)::int d30n,
         count(*) filter (where d0 <= t0 - 30 and exists (select 1 from act where uid = c.id and d = d0 + 30))::int d30,
         count(*) filter (where d0 <= t0 - 60)::int m1n,
         count(*) filter (where d0 <= t0 - 60 and exists (select 1 from act where uid = c.id and d between d0 + 30 and d0 + 59))::int m1
       from c, today`, { ...P, asince: EPOCH }),
    // weekly cohorts: people who signed up in a week, and the % active in each of the weeks after (week n = days 7n to 7n+6)
    R(`with ${ACT}, today as (select (now() at time zone @tz)::date t0),
         c as (select id, ("createdAt" at time zone @tz)::date d0, date_trunc('week', "createdAt" at time zone @tz)::date wk from "user"
               where not (id = any(@xu::text[])) and "createdAt" at time zone @tz >= date_trunc('week', now() at time zone @tz) - interval '7 weeks')
       select to_char(c.wk, 'YYYY-MM-DD') wk, g.n, count(*)::int size,
         count(*) filter (where c.d0 + 7 * g.n + 6 <= t0)::int elig,
         count(*) filter (where c.d0 + 7 * g.n + 6 <= t0 and exists (select 1 from act a where a.uid = c.id and a.d between c.d0 + 7 * g.n and c.d0 + 7 * g.n + 6))::int ret
       from c cross join generate_series(1, 6) g(n) cross join today group by 1, 2 order by 1 desc, 2`, { ...P, asince: EPOCH }),
    // engagement in the period
    O(`select count(*)::int plays, count(distinct coalesce(user_id, anon_id::text))::int players, count(*) filter (where outcome = 'escaped')::int escapes,
         round(percentile_cont(0.5) within group (order by seconds) filter (where seconds > 0))::int len,
         round(avg(hints) filter (where outcome = 'escaped'), 1)::float hints
       from plays where started_at > @since and ${notMe()}`, P),
    // rooms
    R(`select room, count(*)::int plays, count(distinct coalesce(user_id, anon_id::text))::int players, count(*) filter (where outcome = 'escaped')::int escapes,
         round(percentile_cont(0.5) within group (order by seconds) filter (where outcome = 'escaped'))::int med
       from plays where started_at > @since and ${notMe()} group by room`, P),
    R(`select room, steps_done, count(*)::int n from plays
       where started_at > @since and outcome <> 'escaped' and last_seen < now() - interval '2 hours' and ${notMe()} group by room, steps_done`, P),
    R(`select room, count(*)::int n, count(*) filter (where face = 'good')::int good from feedback
       where kind = 'rating' and face is not null and created_at > @since and ${notMe()} group by room`, P),
    // acquisition: where new visitors (browsers seen for the first time) came from, and how many of them signed up
    R(`with nb as (select anon_id, user_id, first_seen, from_at from players where first_seen > @since and ${notMe()}),
         f as (select distinct on (e.anon_id) e.anon_id, e.data->>'ref' ref from events e join nb using (anon_id) where e.name = 'page_view' order by e.anon_id, e.ts)
       select case when nb.from_at is not null then 'Shared links' when coalesce(f.ref, '') in ('', @host) then 'Direct' else regexp_replace(f.ref, '^www[.]', '') end src,
         count(*)::int visitors, count(u.id)::int signed
       from nb left join f using (anon_id) left join "user" u on u.id = nb.user_id and u."createdAt" >= nb.first_seen - interval '5 minutes'
       group by 1 order by 2 desc, 3 desc`, { ...P, host: host() }),
    O(`select count(*)::int shares, count(distinct coalesce(user_id, anon_id::text))::int sharers from events where name = 'share_click' and ts > @since and ${notMe()}`, P),
    // feedback
    O(`select count(face)::int n, count(*) filter (where face = 'good')::int good, count(*) filter (where face = 'okay')::int okay, count(*) filter (where face = 'bad')::int bad
       from feedback where created_at > @since and ${notMe()}`, P),
    R(`select created_at, room, face, text from feedback where coalesce(text, '') <> '' and created_at > @since and ${notMe()} order by created_at desc limit 8`, P),
    // errors
    O(`select count(*) filter (where name = 'client_error' and ${notMe()})::int client, count(*) filter (where name = 'server_error')::int server,
         (select coalesce(data->>'message', '?') from events where name in ('client_error', 'server_error') and ts > @since group by 1 order by count(*) desc limit 1) top
       from events where name in ('client_error', 'server_error') and ts > @since`, P),
  ]);

  const tile = (label, v, note, cls = '') => `<div class="tile ${cls}"><span>${label}</span><b>${v}</b>${note ? `<small>${note}</small>` : ''}</div>`;
  const vsPrev = ctx.prev ? `vs previous ${ctx.short}` : '';
  const kpi = (label, v, prev) => tile(label, num(v), ctx.prev ? `${delta(v, prev, ctx)} <span class="muted">${vsPrev}</span>` : '');

  /* overview */
  const overview = kpi('Visitors', ov.visitors, ov.visitors_prev) + kpi('New users', ov.new_users, ov.new_users_prev)
    + kpi('Active users', act.active, act.active_prev) + kpi('Plays', ov.plays, ov.plays_prev);

  /* usage */
  const usageTiles = tile('Daily active', num(act.dau), 'today') + tile('Weekly active', num(act.wau), 'last 7 days')
    + tile('Monthly active', num(act.mau), 'last 30 days')
    + tile('Stickiness', act.mau ? `${Math.round(100 * act.avg_dau / act.mau)}%` : '–', 'average daily ÷ monthly active');
  const by = ctx.by, unitWord = by === 'week' ? 'week' : 'day';
  const charts = `<div class="figs"><figure class="card fig"><figcaption>Active users per ${unitWord}</figcaption>${barChart(series.map(s => ({ k: s.k, v: s.active })), by, 'active user')}</figure>
    <figure class="card fig"><figcaption>New users per ${unitWord}</figcaption>${barChart(series.map(s => ({ k: s.k, v: s.new_users })), by, 'new user')}</figure></div>`;
  const usageRow = s => `<tr><td>${esc(dateLabel(s.k, by, true))}</td><td class="n">${num(s.visitors)}</td><td class="n">${num(s.new_users)}</td><td class="n">${num(s.active)}</td><td class="n">${num(s.plays)}</td><td class="n">${num(s.escapes)}</td></tr>`;
  const latestFirst = series.slice().reverse();
  const usageHead = '<thead><tr><th></th><th class="n">Visitors</th><th class="n">New users</th><th class="n">Active users</th><th class="n">Plays</th><th class="n">Escapes</th></tr></thead>';
  const q = (o = {}) => `?${new URLSearchParams({ range: ctx.range, by: ctx.by, ...o })}`;
  const byToggle = `<span class="seg sm">${['day', 'week'].map(b => `<a href="${q({ by: b })}" class="${b === by ? 'on' : ''}">${b === 'day' ? 'Daily' : 'Weekly'}</a>`).join('')}</span>`;
  const usageTable = `<div class="scroll"><table class="t">${usageHead}<tbody>${latestFirst.slice(0, 14).map(usageRow).join('')}</tbody></table></div>
    ${latestFirst.length > 14 ? `<details><summary>${pl(latestFirst.length - 14, `earlier ${unitWord}`)}</summary><div class="scroll"><table class="t"><tbody>${latestFirst.slice(14).map(usageRow).join('')}</tbody></table></div></details>` : ''}`;

  /* retention */
  const rtile = (label, a, n, need, def) => tile(label, n ? `${pct(a, n)}%` : '–', n ? `${num(a)} of ${pl(n, 'sign-up')} · ${def}` : `${def} · needs sign-ups ${need} old`);
  const retTiles = rtile('D1', ret.d1, ret.d1n, 'a day', 'back the next day') + rtile('D7', ret.d7, ret.d7n, 'a week', 'back on day 7')
    + rtile('D30', ret.d30, ret.d30n, '30 days', 'back on day 30') + rtile('M1', ret.m1, ret.m1n, '60 days', 'back in days 30–59');
  const weeks = [...new Set(cohorts.map(c => c.wk))];
  const cell = r => { if (!r || !r.elig) return '<td class="n c-na"></td>'; const v = pct(r.ret, r.elig); return `<td class="n c" style="--a:${(0.08 + 0.8 * v / 100).toFixed(2)}" title="${num(r.ret)} of ${num(r.elig)}">${v}%</td>`; };
  const cohortTable = weeks.length ? `<div class="scroll"><table class="t cohort"><thead><tr><th>Signed up, week of</th><th class="n">Users</th>${[1, 2, 3, 4, 5, 6].map(n => `<th class="n">Week ${n}</th>`).join('')}</tr></thead><tbody>
    ${weeks.map(w => { const rs = cohorts.filter(c => c.wk === w); return `<tr><td>${esc(dateLabel(w, 'day'))}</td><td class="n">${num(rs[0].size)}</td>${[1, 2, 3, 4, 5, 6].map(n => cell(rs.find(r => r.n === n))).join('')}</tr>`; }).join('')}</tbody></table></div>
    <p class="muted small">Each cell: the share of that week's sign-ups who were active in that week after joining. Blank until the week has passed for everyone.</p>`
    : '<p class="muted">No sign-ups in the last 8 weeks.</p>';

  /* engagement */
  const engTiles = tile('Completion rate', pctOr(eng.escapes, eng.plays), `${pl(eng.escapes, 'escape')} from ${pl(eng.plays, 'play')}`)
    + tile('Plays per player', eng.players ? (eng.plays / eng.players).toFixed(1) : '–', eng.players ? `${pl(eng.players, 'player')}` : '')
    + tile('Typical play length', mins(eng.len), 'median, finished or not')
    + tile('Hints per escape', eng.hints ?? '–', 'average');

  /* rooms: most played first */
  const roomRows = rooms.slice().sort((a, b) => b.plays - a.plays).map(r => {
    const st = stops.filter(x => x.room === r.room).sort((a, b) => b.n - a.n)[0], fc = faces.find(x => x.room === r.room);
    return `<tr><td><b>${esc(roomTitle(r.room))}</b></td><td class="n">${num(r.players)}</td><td class="n">${num(r.plays)}</td><td class="n">${pctOr(r.escapes, r.plays)}</td>
      <td class="n">${r.med ? fmtTime(r.med) : '–'}</td><td>${st ? `Puzzle ${st.steps_done + 1} <span class="muted">(${num(st.n)})</span>` : '<span class="muted">–</span>'}</td>
      <td class="n">${fc ? `${pct(fc.good, fc.n)}% <span class="muted">of ${num(fc.n)}</span>` : '<span class="muted">–</span>'}</td></tr>`;
  }).join('');
  const idle = allRooms().filter(m => !rooms.find(r => r.room === m.id)).map(m => m.title);

  /* acquisition */
  const nv = acq.reduce((a, r) => a + r.visitors, 0), ns = acq.reduce((a, r) => a + r.signed, 0), sl = acq.find(r => r.src === 'Shared links') || { visitors: 0, signed: 0 };
  const acqTiles = tile('New visitors', num(nv), 'first visit in this period') + tile('Sign-up rate', pctOr(ns, nv), `${pl(ns, 'new visitor')} signed up`)
    + tile('Times shared', num(shares.shares), shares.sharers ? `by ${pl(shares.sharers, 'person', 'people')}` : 'nobody shared yet')
    + tile('From shared links', num(sl.visitors), `new visitors · ${num(sl.signed)} signed up`);
  const srcRows = acq.slice(0, 8).map(r => `<tr><td>${esc(r.src)}</td><td class="n">${num(r.visitors)}</td><td class="n">${num(r.signed)}</td><td class="n">${pctOr(r.signed, r.visitors)}</td></tr>`).join('');

  /* feedback */
  const fbTiles = ['good', 'okay', 'bad'].map(f => tile(faceTag(f), pctOr(fb[f], fb.n), fb.n ? `${num(fb[f])} of ${pl(fb.n, 'response')}` : 'no feedback yet')).join('');
  const fbList = fbText.map(f => `<li><time>${esc(dateLabel(new Date(f.created_at).toLocaleDateString('en-CA', { timeZone: cfg.timeZone }), 'day'))}</time><span>${f.face ? faceTag(f.face) + ' ' : ''}${f.room ? `<span class="muted">${esc(roomTitle(f.room))} ·</span> ` : ''}“${esc(f.text)}”</span></li>`).join('');

  /* errors */
  const errLine = errs.client + errs.server ? `<p class="errline"><b>${pl(errs.client, 'browser error')}</b> and <b>${pl(errs.server, 'server error')}</b> in this period.${errs.top ? ` Most common: <code>${esc(errs.top)}</code>.` : ''} <span class="muted">Details are in the events download.</span></p>` : '<p class="muted">No errors in this period.</p>';

  const head = headTags({ title: `Dashboard · ${cfg.siteName}`, description: 'Product analytics', path: '/admin', page: 'admin', noindex: true });
  const fromLabel = new Date(ctx.since).toLocaleDateString('en-CA', { timeZone: cfg.timeZone });
  return layout(head, `<style>${ADMIN_CSS}</style><div class="wrap dash">
<div class="dhead"><div><h1>Dashboard</h1><p class="muted sub">${esc(ctx.label)} · since ${esc(dateLabel(fromLabel, 'day'))} · India time</p></div>
<nav class="seg" aria-label="Period">${Object.entries(RANGES).map(([key, r]) => `<a href="${q({ range: key, by: key === '7d' || key === '30d' ? 'day' : 'week' })}" class="${key === ctx.range ? 'on' : ''}">${r.short}</a>`).join('')}</nav></div>

<section><h2>Overview</h2><div class="tiles">${overview}</div></section>

<section><div class="h2row"><h2>Usage</h2>${byToggle}</div><div class="tiles">${usageTiles}</div>${charts}${usageTable}</section>

<section><h2>Retention</h2><div class="tiles">${retTiles}</div><h3>Weekly cohorts</h3>${cohortTable}</section>

<section><h2>Engagement</h2><div class="tiles">${engTiles}</div></section>

<section><h2>Rooms</h2>${roomRows ? `<div class="scroll"><table class="t"><thead><tr><th>Room</th><th class="n">Players</th><th class="n">Plays</th><th class="n">Completion</th><th class="n">Typical time</th><th>Most drop off at</th><th class="n">Rated good</th></tr></thead><tbody>${roomRows}</tbody></table></div>` : '<p class="muted">No plays in this period.</p>'}
${idle.length && roomRows ? `<p class="muted small">No plays: ${esc(idle.join(', '))}.</p>` : ''}</section>

<section><h2>Acquisition</h2><div class="tiles">${acqTiles}</div>
${srcRows ? `<h3>Where new visitors came from</h3><div class="scroll"><table class="t"><thead><tr><th>Source</th><th class="n">New visitors</th><th class="n">Signed up</th><th class="n">Sign-up rate</th></tr></thead><tbody>${srcRows}</tbody></table></div>` : ''}</section>

<section><h2>Feedback</h2><div class="tiles three">${fbTiles}</div>${fbList ? `<h3>Latest comments</h3><ol class="feed">${fbList}</ol>` : ''}</section>

${await usersSection(ctx, q, act.wau)}

<section><h2>Errors</h2>${errLine}</section>

<footer class="dfoot"><a href="${q({ me: ctx.me ? '0' : '1' })}">${ctx.me ? 'Leave out my own activity' : 'Include my own activity'}</a>
<span>Download: ${['plays', 'events', 'users', 'feedback', 'shares', 'sharing'].map(t => `<a href="/admin/export/${t}.csv${q({ me: ctx.me ? 1 : 0 })}">${t}</a>`).join(' · ')}</span>
<span>Active user: a signed-in person who visited or played that day. Bots aren't counted.${ctx.me ? '' : ' Your own activity is left out.'}</span></footer>
</div>`);
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
  feedback: `select f.id, f.created_at, f.room, f.kind, f.face, f.rating, f.difficulty, f.text, f.context, f.device, f.user_id, u.email
             from feedback f left join "user" u on u.id = f.user_id where f.created_at > @since and ${notMe('f.')} order by f.id`,
  shares: `select code, kind, room, surface, user_id, seconds, hints, wrong, marks, created_at, clicks, landings, plays_started from shares
           where created_at > @since and ${notMe()} order by created_at`,
  sharing: `select ts, name, room, data->>'kind' kind, data->>'surface' surface, coalesce(data->>'channel', data->>'via') channel, data->>'code' code, anon_id, user_id, device, country
            from events where name in ('share_open', 'share_click', 'share_visit') and ts > @since and ${notMe()} order by ts`,
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
:root{--bar:#c98500;--bad:#e66767;--good:#7fc79a}
.dash{max-width:960px;padding-top:4px;padding-bottom:80px}
.dash a{text-decoration:none}
.dash h1{font-size:32px;line-height:40px;margin:4px 0 0;letter-spacing:-.4px}.sub{margin:4px 0 0;font-size:13.5px}
.dash h2{font-size:20px;line-height:28px;margin:0 0 14px}
.dash h3{font:500 11px/16px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:24px 0 8px}
.dash section{margin-top:48px}
.dhead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.h2row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.h2row h2{margin:0}
.seg{display:inline-flex;border:1px solid var(--line2);border-radius:999px;padding:3px;gap:2px;max-width:100%;overflow-x:auto;scrollbar-width:none}
.seg a{padding:5px 13px;border-radius:999px;color:var(--muted);font-size:14px;line-height:20px;white-space:nowrap}.seg a:hover{color:var(--ink)}.seg a.on{background:var(--ink);color:var(--bg)}
.seg.sm a{padding:3px 11px;font-size:13px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.tiles.three{grid-template-columns:repeat(3,minmax(0,1fr))}
@media(max-width:720px){.tiles,.tiles.three{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;display:flex;flex-direction:column;gap:2px;min-width:0}
.tile>span{color:var(--muted);font-size:13.5px}.tile b{font-size:32px;line-height:40px;font-weight:400;font-variant-numeric:tabular-nums}
.tile small{color:var(--muted);font-size:12.5px;line-height:18px}.tile em{font-style:normal;color:var(--muted)}.tile em.up{color:var(--good)}.tile em.down{color:var(--bad)}
@media(max-width:560px){.tile{padding:14px}.tile b{font-size:26px;line-height:34px}}
.figs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 4px}@media(max-width:720px){.figs{grid-template-columns:minmax(0,1fr)}}
.fig{margin:0;padding:16px 18px 12px}.fig figcaption{color:var(--muted);font-size:13.5px;margin-bottom:10px}
.chart{width:100%;height:110px;display:block}.chart path{fill:var(--bar)}.chart .base{stroke:var(--line2)}.chart .hit{fill:transparent}.chart .col:hover .hit{fill:rgba(237,232,222,.06)}
.xl{display:flex;justify-content:space-between;gap:8px;font:11px/16px var(--mono);color:var(--muted);margin-top:6px}
.t{width:100%;border-collapse:collapse;font-size:14.5px;margin-top:8px}.t th,.t td{text-align:left;padding:10px;border-bottom:1px solid var(--line);vertical-align:top}
.t th{font:500 11px/16px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap}.t th:first-child,.t td:first-child{padding-left:0;white-space:nowrap}
.n{text-align:right!important;font-variant-numeric:tabular-nums;white-space:nowrap}.scroll{overflow-x:auto}
.cohort td.c{background:rgba(201,133,0,var(--a));color:var(--ink);border-left:2px solid var(--bg)}.cohort td.c-na{border-left:2px solid var(--bg)}
details summary{cursor:pointer;color:var(--muted);font-size:14px;padding:10px 0}
.feed{list-style:none;margin:0;padding:0}
.feed li{display:grid;grid-template-columns:80px minmax(0,1fr);gap:12px;padding:9px 0;border-top:1px solid var(--line);font-size:14.5px;line-height:21px}
.feed time{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.small{font-size:12.5px;margin:10px 0 0}
.errline{font-size:14.5px;margin:0}.errline code{font:12.5px var(--mono);color:var(--ink2)}
.face{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;vertical-align:-3px}.face .fi{width:16px;height:16px;flex:none;color:var(--muted)}
.face-good .fi{color:#199e70}.face-okay .fi{color:#c98500}.face-bad .fi{color:#3987e5}
.dash h2 small{font-size:14px;font-weight:400;margin-left:8px}.t td.nw{white-space:nowrap}
.pager{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;font-size:14px}.pager a{color:var(--ink2);border-bottom:1px solid var(--faint)}.pager a:hover{color:var(--ink)}
.dfoot{margin-top:56px;padding-top:20px;border-top:1px solid var(--line);display:flex;flex-direction:column;align-items:flex-start;gap:6px;color:var(--muted);font-size:13px}
.dfoot a{color:var(--ink2);border-bottom:1px solid var(--faint)}
@media(max-width:640px){.dash h1{font-size:28px;line-height:36px}.feed li{grid-template-columns:minmax(0,1fr);gap:0}}`;
