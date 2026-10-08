// /admin: a simple view of what is happening on the live site. Opens for cfg.admins only (see config.js).
//   /admin                  the dashboard (?range=today|7d|30d|all; ?me=0 hides the owner's own activity, remembered in a cookie)
//   /admin/live             the "Right now" block on its own; the dashboard refreshes it every 15 seconds
//   /admin/players/<id>     one player: their plays and everything they did, newest first
//   /admin/export/<t>.csv   raw rows
import { cfg } from './config.js';
import { rows, one } from './db.js';
import { allRooms, fmtTime } from './rooms.js';
import { esc, headTags, layout } from './pages.js';

/* ---------- options from the query string ---------- */
const RANGES = {
  today: { label: 'Today', unit: 'hour' },
  '7d': { label: '7 days', days: 7, unit: 'day' },
  '30d': { label: '30 days', days: 30, unit: 'day' },
  all: { label: 'All time', unit: 'day' },
};
// me: include the owner's own activity. On by default; ?me=0 hides it, and the server remembers the choice in a cookie.
export function adminOptions(query, saved) {
  const range = RANGES[query.range] ? query.range : '7d';
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
  const r = RANGES[opts.range] || RANGES['7d'];
  const own = await O(`select coalesce(array_agg(distinct u.id), '{}') ids, coalesce(array_agg(distinct p.anon_id) filter (where p.anon_id is not null), '{}') anons
                       from "user" u left join players p on p.user_id = u.id where lower(u.email) = any(@admins::text[])`, { admins: cfg.admins });
  let since, unit = r.unit;
  if (opts.range === 'today') since = (await O(`select date_trunc('day', now() at time zone @tz) at time zone @tz t`, { tz: cfg.timeZone })).t;
  else if (r.days) since = new Date(Date.now() - r.days * 864e5);
  else {
    const f = await O('select least((select min(first_seen) from players), (select min("createdAt") from "user"), now()) t', {});
    since = new Date(new Date(f.t).getTime() - 3600e3);
    if (Date.now() - since > 120 * 864e5) unit = 'week';
  }
  return {
    ...opts, ...r, unit, since,
    p: { since, unit, tz: cfg.timeZone, xu: opts.me ? [] : own.ids, xa: opts.me ? [] : own.anons },
    ownIds: own.ids,
  };
}

/* ---------- formatting ---------- */
const nf = new Intl.NumberFormat('en-IN');
const num = v => nf.format(v || 0);
const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
const pl = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
const dtf = new Intl.DateTimeFormat('en-GB', { timeZone: cfg.timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const tf = new Intl.DateTimeFormat('en-GB', { timeZone: cfg.timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
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
const mins = sec => { sec = Math.max(0, Math.round(sec || 0)); return sec < 60 ? 'under a minute' : sec < 3600 ? `${Math.round(sec / 60)} min` : `${Math.floor(sec / 3600)} h ${Math.round(sec % 3600 / 60)} min`; };
const roomTitle = id => (allRooms().find(m => m.id === id) || {}).title || id || '';
const COUNTRY = new Intl.DisplayNames(['en'], { type: 'region' });
const country = c => { try { return c ? COUNTRY.of(c) : '–'; } catch (e) { return c; } };
const deviceShort = d => (d ? d.split(' ').filter(x => x !== 'other').join(' · ') : '–');
function who(r, own = []) {
  if (r.name === 'server_error') return '<span class="muted">Server</span>';
  if (r.uid) return `<a class="who" href="/admin/players/${encodeURIComponent(r.uid)}">${own.includes(r.uid) ? 'You' : esc(r.uname || r.email || 'Player')}</a>`;
  return '<span class="muted">A visitor</span>';
}

// feedback is three faces (bad, okay, good: feedback.face, migration 004)
const FACE_PATH = { bad: 'M8.5 16.4c.9-1.15 2.1-1.75 3.5-1.75s2.6.6 3.5 1.75', okay: 'M8.75 15.25h6.5', good: 'M8.5 14.1c.9 1.35 2.1 2.05 3.5 2.05s2.6-.7 3.5-2.05' };
const FACE_WORD = { bad: 'Bad', okay: 'Okay', good: 'Good' };
const faceIcon = f => FACE_PATH[f] ? `<svg class="fi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.25"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/><path d="${FACE_PATH[f]}"/></svg>` : '';
const faceTag = f => FACE_PATH[f] ? `<span class="face face-${f}">${faceIcon(f)}${FACE_WORD[f]}</span>` : '';

/* ---------- what an event means, in words ---------- */
function describe(e) {
  const d = e.data || {}, room = e.room ? `<b>${esc(roomTitle(e.room))}</b>` : '', step = Number.isInteger(e.step) && e.step >= 0 ? e.step + 1 : null;
  switch (e.name) {
    case 'account': return 'signed up';
    case 'page_view': return `viewed ${d.path === '/' ? 'the home page' : `<code>${esc(d.path || '?')}</code>`}${d.ref ? ` <span class="muted">from ${esc(d.ref)}</span>` : ''}`;
    case 'room_open': return `opened ${room}`;
    case 'room_start': return `${d.cont ? 'continued' : 'started'} ${room}`;
    case 'step_done': return `solved puzzle ${step ?? '?'} in ${room}`;
    case 'hint_used': return `took a hint on puzzle ${step ?? '?'} in ${room}`;
    case 'wrong': return `made a wrong guess on puzzle ${step ?? '?'} in ${room}`;
    case 'room_escape': return `<span class="good">escaped</span> ${room}${d.seconds ? ` in ${fmtTime(d.seconds)}` : ''}`;
    case 'room_quit': return `left ${room} on puzzle ${step ?? '?'}`;
    case 'page_hide': return `switched away from ${room || 'the site'}`;
    case 'share_click': return `shared ${d.kind === 'site' || !room ? 'Deadbolt' : room}${d.kind === 'result' ? ' (their result)' : ''}${CHANNEL[d.channel] ? ` <span class="muted">on ${esc(CHANNEL[d.channel])}</span>` : ''}`;
    case 'share_visit': return `arrived through a shared link${room ? ` to ${room}` : ''}${CHANNEL[d.via] ? ` <span class="muted">from ${esc(CHANNEL[d.via])}</span>` : ''}`;
    case 'feedback_sent': return `sent feedback${d.face ? ` ${faceTag(d.face)}` : ''}${room ? ` on ${room}` : ''}`;
    case 'signin_prompt': return 'saw the sign-in dialog';
    case 'signin_start': return 'went to Google to sign in';
    case 'client_error': return `hit an error: <code>${esc(d.message || '')}</code>`;
    case 'server_error': return `error on <code>${esc(d.path || '')}</code>: ${esc(d.message || '')}`;
    default: return `${esc(e.name.replace(/_/g, ' '))} ${room}`;
  }
}
// the moments worth reading in "Latest"; page views and per-puzzle steps stay on the player pages
// the app a link was shared through (?via=); older names from before the share panel
const CHANNEL = { wa: 'WhatsApp', tg: 'Telegram', x: 'X', fb: 'Facebook', em: 'email', cp: 'a copied link', sh: 'the phone share sheet', li: 'LinkedIn', copy: 'a copied link', manual: 'a copied link', sheet: 'the phone share sheet' };
const HEADLINE = ['room_start', 'room_escape', 'room_quit', 'share_click', 'feedback_sent'];   // errors have their own section

/* ---------- one chart: server-drawn SVG bars, a hover title on every bucket ---------- */
function bucketLabel(k, unit, long) {
  // k is 'YYYY-MM-DD HH24'
  const [date, hour] = k.split(' '), d = new Date(`${date}T00:00:00Z`);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  if (unit === 'hour') return long ? `${hour}:00` : `${hour}:00`;
  if (unit === 'week') return long ? `Week of ${day}` : day;
  return long ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : day;
}
function barChart(points, unit, noun) {
  const W = 560, H = 96, n = Math.max(1, points.length);
  const max = Math.max(1, ...points.map(p => p.v)), bw = W / n, gap = bw > 6 ? 2 : bw > 3 ? 1 : 0, yb = H - 1;
  const bars = points.map((p, i) => {
    const h = p.v ? Math.max(2, (H - 6) * p.v / max) : 0, x = i * bw + gap / 2, w = Math.max(1, bw - gap), y = yb - h, r = Math.min(4, w / 2, h);
    const bar = h ? `<path d="M${x.toFixed(1)},${yb} V${(y + r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x + r).toFixed(1)},${y.toFixed(1)} H${(x + w - r).toFixed(1)} Q${(x + w).toFixed(1)},${y.toFixed(1)} ${(x + w).toFixed(1)},${(y + r).toFixed(1)} V${yb} Z"/>` : '';
    return `<g class="col">${bar}<rect class="hit" x="${(i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}"><title>${esc(bucketLabel(p.k, unit, true))}: ${pl(p.v, noun)}</title></rect></g>`;
  }).join('');
  const first = points[0], last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(noun)}s by ${unit}">${bars}<line x1="0" x2="${W}" y1="${yb}" y2="${yb}" class="base" vector-effect="non-scaling-stroke"/></svg>
    <div class="xl"><span>${first ? esc(bucketLabel(first.k, unit)) : ''}</span><span>most in one ${unit}: ${num(max)}</span><span>${last && points.length > 1 ? esc(bucketLabel(last.k, unit)) : ''}</span></div>`;
}

/* ---------- Right now ---------- */
export async function livePanel(opts) {
  const ctx = await context({ ...opts, range: '7d' });
  const P = ctx.p;
  const [online, inRoom, latest] = await Promise.all([
    O(`select count(*)::int n from players where last_seen > now() - interval '2 minutes' and ${notMe()}`, P),
    R(`select p.*, u.id uid, u.name uname, u.email from plays p left join "user" u on u.id = p.user_id
       where p.outcome = 'in_progress' and p.last_seen > now() - interval '3 minutes' and ${notMe('p.')} order by p.started_at`, P),
    R(`(select e.ts, e.name, e.room, e.step, e.data, e.anon_id, u.id uid, u.name uname, u.email
        from events e left join players pl on pl.anon_id = e.anon_id left join "user" u on u.id = coalesce(e.user_id, pl.user_id)
        where e.ts > now() - interval '7 days' and e.name = any(@names::text[]) and ${notMe('e.')} and not coalesce(pl.user_id = any(@xu::text[]), false)
        order by e.ts desc limit 6)
       union all
       (select u."createdAt" ts, 'account' name, null room, null step, null data, null anon_id, u.id uid, u.name uname, u.email
        from "user" u where u."createdAt" > now() - interval '7 days' and not (u.id = any(@xu::text[])) order by u."createdAt" desc limit 6)
       order by ts desc limit 6`, { ...P, names: HEADLINE }),
  ]);
  const playing = inRoom.length
    ? `<ul class="now">${inRoom.map(p => `<li>${who(p, ctx.ownIds)} <span class="muted">is in</span> <b>${esc(roomTitle(p.room))}</b>
        <span class="muted">· puzzle ${Math.min(p.steps_done + 1, p.steps_total || 99)}${p.steps_total ? ` of ${p.steps_total}` : ''} · ${mins(p.resumed ? p.seconds : Math.max(p.seconds || 0, (Date.now() - new Date(p.started_at)) / 1000))}</span></li>`).join('')}</ul>`
    : '';
  const items = latest.map(e => `<li><time title="${esc(fmtDT(e.ts))}">${esc(ago(e.ts))}</time><span>${who(e, ctx.ownIds)} ${describe(e)}</span></li>`).join('')
    || '<li class="muted">Nothing yet this week.</li>';
  return `<h2><span class="dot" aria-hidden="true"></span>Right now</h2>
  <p class="big">${pl(online.n, 'person', 'people')} on the site, ${num(inRoom.length)} in a room.</p>${playing}
  <h3>Latest</h3><ol class="feed">${items}</ol><p class="muted small">Updated ${tf.format(new Date())}, refreshes by itself.</p>`;
}

/* ---------- the dashboard: one question per section ---------- */
export async function adminPage(opts) {
  const ctx = await context(opts);
  const P = ctx.p;
  // "came back" looks at people who signed up in this period before today (today's sign-ups can't have come back yet);
  // for Today, at everyone who signed up in the last 30 days
  const cs = ctx.range === 'today' ? new Date(Date.now() - 30 * 864e5) : ctx.since;
  const host = (() => { try { return new URL(cfg.baseURL).host; } catch (e) { return ''; } })();
  const [k, sources, back, chart, roomStats, ratings, stops, players, playerCount, feedback, errors, live, apps] = await Promise.all([
    O(`select
        (select count(distinct anon_id) from events where name = 'page_view' and ts > @since and ${notMe()})::int visitors,
        (select count(*) from "user" where "createdAt" > @since and not (id = any(@xu::text[])))::int signups,
        (select count(*) from plays where started_at > @since and ${notMe()})::int plays,
        (select count(distinct coalesce(user_id, anon_id::text)) from plays where started_at > @since and ${notMe()})::int players,
        (select count(*) from plays where outcome = 'escaped' and ended_at > @since and ${notMe()})::int escapes,
        (select round(percentile_cont(0.5) within group (order by seconds)) from plays where outcome = 'escaped' and ended_at > @since and ${notMe()})::int med,
        (select count(*) from events where name = 'share_click' and ts > @since and ${notMe()})::int shares,
        (select count(distinct coalesce(user_id, anon_id::text)) from events where name = 'share_click' and ts > @since and ${notMe()})::int sharers,
        (select count(distinct anon_id) from events where name = 'share_visit' and ts > @since and ${notMe()})::int share_visitors,
        (select count(distinct coalesce(user_id, anon_id::text)) from plays where (from_share is not null or from_via is not null) and started_at > @since and ${notMe()})::int share_players`, P),
    R(`select data->>'ref' ref, count(distinct anon_id)::int n from events where name = 'page_view' and data->>'ref' is not null and data->>'ref' <> @host
       and ts > @since and ${notMe()} group by 1 order by 2 desc limit 3`, { ...P, host }),
    O(`with act as (select coalesce(e.user_id, pl.user_id) uid, (e.ts at time zone @tz)::date d from events e left join players pl on pl.anon_id = e.anon_id
                    where e.ts > least(@cs::timestamptz, @since::timestamptz) and coalesce(e.user_id, pl.user_id) is not null group by 1, 2),
            c as (select id, ("createdAt" at time zone @tz)::date d0 from "user"
                  where "createdAt" > @cs and ("createdAt" at time zone @tz)::date < (now() at time zone @tz)::date and not (id = any(@xu::text[]))),
            a as (select distinct uid from act where d >= (@since::timestamptz at time zone @tz)::date and not (uid = any(@xu::text[])))
       select (select count(*) from a)::int active,
         (select count(*) from a join "user" u on u.id = a.uid where u."createdAt" < @since)::int ret,
         (select count(*) from c)::int n,
         (select count(*) from c where exists (select 1 from act where act.uid = c.id and act.d > c.d0))::int back,
         (select count(*) from c where (select count(distinct room) from plays where user_id = c.id) >= 2)::int rooms2`, { ...P, cs }),
    R(`with b as (select generate_series(date_trunc(@unit, @since::timestamptz at time zone @tz), date_trunc(@unit, now() at time zone @tz), ('1 ' || @unit)::interval) k)
       select to_char(b.k, 'YYYY-MM-DD HH24') k, coalesce(x.v, 0)::int v from b left join (
         select date_trunc(@unit, started_at at time zone @tz) k, count(*) v from plays where started_at > @since and ${notMe()} group by 1) x on x.k = b.k order by b.k`, P),
    R(`select room, count(*)::int plays, count(*) filter (where outcome = 'escaped')::int escapes,
         round(percentile_cont(0.5) within group (order by seconds) filter (where outcome = 'escaped'))::int med
       from plays where started_at > @since and ${notMe()} group by room`, P),
    R(`select room, count(*)::int n, count(*) filter (where face = 'good')::int good from feedback
       where kind = 'rating' and face is not null and created_at > @since and ${notMe()} group by room`, P),
    R(`select room, steps_done, count(*)::int n from plays
       where started_at > @since and outcome <> 'escaped' and last_seen < now() - interval '2 hours' and ${notMe()} group by room, steps_done`, P),
    R(`select u.id uid, u.name uname, u.email, s.plays, s.rooms_escaped, greatest(pl.last_seen, s.last_play, u."createdAt") last_active
       from "user" u
       left join lateral (select count(*)::int plays, count(distinct room) filter (where outcome = 'escaped')::int rooms_escaped, max(last_seen) last_play from plays where user_id = u.id) s on true
       left join lateral (select max(last_seen) last_seen from players where user_id = u.id) pl on true
       where not (u.id = any(@xu::text[])) order by last_active desc nulls last limit 100`, P),
    O(`select count(*)::int n from "user" where not (id = any(@xu::text[]))`, P),
    R(`select f.created_at, f.room, f.face, f.difficulty, f.text, u.id uid, u.name uname, u.email
       from feedback f left join "user" u on u.id = f.user_id where f.created_at > @since and ${notMe('f.')} order by f.created_at desc limit 10`, P),
    R(`select case when name = 'server_error' then 'Server · ' || coalesce(data->>'path', '') || ' · ' else '' end || coalesce(data->>'message', '?') msg,
         count(*)::int n, max(ts) last from events where name in ('client_error', 'server_error') and ts > @since and (name = 'server_error' or ${notMe()})
       group by 1 order by 3 desc limit 10`, P),
    livePanel(opts),
    R(`select data->>'channel' ch, count(*)::int n from events where name = 'share_click' and ts > @since and ${notMe()} group by 1 order by 2 desc limit 3`, P),
  ]);

  const tile = (label, v, note, word) => `<div class="tile"><span>${label}</span><b${word ? ' class="word"' : ''}>${v}</b>${note ? `<small>${note}</small>` : ''}</div>`;
  const section = (title, tiles, extra = '') => `<section><h2>${title}</h2><div class="tiles">${tiles}</div>${extra}</section>`;
  const cohort = ctx.range === 'today' ? 'signed up in the last 30 days' : ctx.range === 'all' ? 'signed up before today' : `signed up in the last ${ctx.label}`;
  const top = sources[0];

  const newPeople = section('New people',
    tile('Visitors', num(k.visitors), 'opened the site')
    + tile('Signed up', num(k.signups), k.visitors ? `${pct(k.signups, k.visitors)}% of visitors` : '')
    + tile('Most came from', top ? esc(top.ref.replace(/^www\./, '')) : '–', top ? `${pl(top.n, 'visitor')}${sources[1] ? ` · then ${esc(sources[1].ref.replace(/^www\./, ''))}` : ''}` : 'direct visits only', true));

  const playing = section('Playing',
    tile('Plays', num(k.plays), k.players ? `by ${pl(k.players, 'person', 'people')}` : 'rooms started')
    + tile('Escaped', k.plays ? `${pct(k.escapes, k.plays)}%` : '–', `${pl(k.escapes, 'escape')}`)
    + tile('Typical escape time', k.med ? fmtTime(k.med) : '–', 'half escape faster'),
    `<div class="card chartcard"><span class="cap">Plays ${ctx.unit === 'hour' ? 'by hour' : ctx.unit === 'week' ? 'by week' : 'by day'}</span>${barChart(chart, ctx.unit, 'play')}</div>`);

  const comingBack = section('Coming back',
    (ctx.range === 'all' ? '' : tile('Returning players', num(back.ret), back.active ? `of ${pl(back.active, 'person', 'people')} active, joined before ${ctx.range === 'today' ? 'today' : 'this period'}` : 'nobody active yet'))
    + tile('Came back another day', back.n ? `${pct(back.back, back.n)}%` : '–', back.n ? `${num(back.back)} of ${pl(back.n, 'person', 'people')} who ${cohort}` : `nobody ${cohort}`)
    + tile('Played 2+ rooms', back.n ? `${pct(back.rooms2, back.n)}%` : '–', back.n ? `same ${pl(back.n, 'person', 'people')}` : ''));

  const sharing = section('Sharing',
    tile('Times shared', num(k.shares), k.sharers ? `by ${pl(k.sharers, 'person', 'people')}` : 'nobody shared yet')
    + tile('Visitors from shared links', num(k.share_visitors), 'opened a shared link')
    + tile('Players from shared links', num(k.share_players), 'started a room from a link')
    + tile('Shared most on', apps[0] ? esc(CHANNEL[apps[0].ch] || apps[0].ch || '–').replace(/^a |^the /, '').replace(/^./, c => c.toUpperCase()) : '–',
      apps[0] ? `${pl(apps[0].n, 'time')}${apps[1] ? ` · then ${esc((CHANNEL[apps[1].ch] || apps[1].ch || '').replace(/^a |^the /, ''))}` : ''}` : 'nothing shared yet', true));

  // rooms: plays, escapes, typical time, the puzzle where most unfinished plays stopped, rating
  const roomRows = allRooms().slice().reverse().map(m => {
    const r = roomStats.find(x => x.room === m.id); if (!r) return null;
    const st = stops.filter(x => x.room === m.id).sort((a, b) => b.n - a.n)[0], rt = ratings.find(x => x.room === m.id);
    return `<tr><td><b>${esc(m.title)}</b></td><td class="n">${num(r.plays)}</td><td class="n">${pct(r.escapes, r.plays)}%</td>
      <td class="n">${r.med ? fmtTime(r.med) : '–'}</td><td>${st ? `Puzzle ${st.steps_done + 1} <span class="muted">(${pl(st.n, 'player')})</span>` : '<span class="muted">–</span>'}</td>
      <td class="n">${rt ? `${pct(rt.good, rt.n)}% <span class="muted">of ${num(rt.n)}</span>` : '<span class="muted">–</span>'}</td></tr>`;
  }).filter(Boolean);
  const idle = allRooms().length - roomRows.length;
  const rooms = `<section><h2>Rooms</h2>${roomRows.length ? `<div class="scroll"><table class="t"><thead><tr><th>Room</th><th class="n">Plays</th><th class="n">Escaped</th><th class="n">Typical time</th><th>Most people stop at</th><th class="n">Rated good</th></tr></thead><tbody>${roomRows.join('')}</tbody></table></div>
    ${idle ? `<p class="muted small">${pl(idle, 'room')} had no plays.</p>` : ''}` : '<p class="muted">No plays in this period.</p>'}</section>`;

  const prow = u => `<tr><td>${who(u, ctx.ownIds)}</td><td>${esc(ago(u.last_active))}</td><td class="n">${num(u.plays)}</td><td class="n">${num(u.rooms_escaped)}</td></tr>`;
  const playersHtml = `<section><h2>Players <small class="muted">${pl(playerCount.n, 'sign-up')} in all</small></h2>
    <div class="scroll"><table class="t"><thead><tr><th>Player</th><th>Last seen</th><th class="n">Plays</th><th class="n">Rooms escaped</th></tr></thead><tbody>${players.slice(0, 15).map(prow).join('') || '<tr><td colspan="4" class="muted">No sign-ups yet.</td></tr>'}</tbody></table></div>
    ${players.length > 15 ? `<details><summary>${pl(players.length - 15, 'more player')}</summary><table class="t"><tbody>${players.slice(15).map(prow).join('')}</tbody></table></details>` : ''}</section>`;

  const feedbackHtml = `<section><h2>Feedback</h2>${feedback.length ? `<ol class="feed">${feedback.map(f => `<li><time>${esc(ago(f.created_at))}</time><span>${who(f, ctx.ownIds)}${f.room ? ` <span class="muted">on</span> ${esc(roomTitle(f.room))}` : ''}${f.face ? ` ${faceTag(f.face)}` : ''}${f.difficulty ? ` <span class="muted">· ${esc(f.difficulty.toLowerCase())}</span>` : ''}${f.text ? `<br>“${esc(f.text)}”` : ''}</span></li>`).join('')}</ol>` : '<p class="muted">No feedback in this period.</p>'}</section>`;

  const problems = errors.length ? `<section id="problems"><h2>Problems</h2><ol class="feed">${errors.map(e => `<li><time>${esc(ago(e.last))}</time><span><code>${esc(e.msg)}</code>${e.n > 1 ? ` <span class="muted">× ${num(e.n)}</span>` : ''}</span></li>`).join('')}</ol></section>` : '';

  const q = (o = {}) => `?${new URLSearchParams({ range: ctx.range, ...o })}`;
  const head = headTags({ title: `Dashboard · ${cfg.siteName}`, description: 'What is happening on the site', path: '/admin', page: 'admin', noindex: true });
  return layout(head, `<style>${ADMIN_CSS}</style><div class="wrap dash">
<div class="dhead"><h1>Dashboard</h1><nav class="seg" aria-label="Period">${Object.entries(RANGES).map(([key, r]) => `<a href="${q({ range: key })}" class="${key === ctx.range ? 'on' : ''}">${r.label}</a>`).join('')}</nav></div>
<section id="live" class="card" data-src="/admin/live?me=${ctx.me ? 1 : 0}">${live}</section>
${newPeople}${playing}${comingBack}${sharing}${rooms}${playersHtml}${feedbackHtml}${problems}
<footer class="dfoot"><a href="${q({ me: ctx.me ? '0' : '1' })}">${ctx.me ? 'Hide my own activity' : 'Show my own activity'}</a>
<span>Download: ${['plays', 'events', 'users', 'feedback', 'shares', 'sharing'].map(t => `<a href="/admin/export/${t}.csv${q({ me: ctx.me ? 1 : 0 })}">${t}</a>`).join(' · ')}</span>
<span>Times are India time. Bots aren't counted.${ctx.me ? '' : ' Your own activity is hidden.'}</span></footer>
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
</script>`);
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
export async function playerPage(uid) {
  const u = await O(`select u.id uid, u.name uname, u.email, u.image, u."createdAt" created from "user" u where u.id = @uid`, { uid });
  if (!u) return null;
  const P = { uid };
  const [seen, plays, events, fbs] = await Promise.all([
    O(`select max(last_seen) last_seen, (array_agg(device order by last_seen desc))[1] device, (array_agg(country order by last_seen desc))[1] country from players where user_id = @uid`, P),
    R(`select * from plays where user_id = @uid order by started_at desc limit 100`, P),
    R(`select e.ts, e.name, e.room, e.step, e.data from events e
       where (e.user_id = @uid or e.anon_id in (select anon_id from players where user_id = @uid)) and e.name <> 'page_hide' order by e.ts desc limit 300`, P),
    R(`select created_at, room, face, difficulty, text from feedback where user_id = @uid order by created_at desc`, P),
  ]);
  const playRows = plays.map(p => `<tr><td>${esc(fmtDT(p.started_at))}</td><td>${esc(roomTitle(p.room))}</td>
    <td>${p.outcome === 'escaped' ? `<span class="good">Escaped</span> in ${fmtTime(p.seconds)}` : new Date(p.last_seen) > Date.now() - 180e3 ? 'Playing now' : `Stopped on puzzle ${p.steps_done + 1}`}</td>
    <td class="n">${p.hints}</td><td class="n">${p.wrong}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No plays yet.</td></tr>';
  const timeline = events.map(e => `<li><time>${esc(fmtDT(e.ts))}</time><span>${describe(e)}</span></li>`).join('') || '<li class="muted">Nothing recorded yet.</li>';
  const head = headTags({ title: `${u.uname || u.email} · Dashboard`, description: 'Player', path: '/admin', page: 'admin', noindex: true });
  return layout(head, `<style>${ADMIN_CSS}</style><div class="wrap dash">
<p class="back"><a href="/admin">&larr; Dashboard</a></p>
<div class="phead">${u.image ? `<img src="${esc(u.image)}" alt="" referrerpolicy="no-referrer">` : ''}<div><h1>${esc(u.uname || 'Player')}</h1>
<p class="muted">${esc(u.email || '')} · joined ${esc(fmtDT(u.created))} · last seen ${esc(ago(seen && seen.last_seen))}${seen && seen.device ? ` on ${esc(deviceShort(seen.device))}` : ''}${seen && seen.country ? `, ${esc(country(seen.country))}` : ''}</p></div></div>
<section><h2>Plays</h2><div class="scroll"><table class="t"><thead><tr><th>Started</th><th>Room</th><th>How it went</th><th class="n">Hints</th><th class="n">Wrong</th></tr></thead><tbody>${playRows}</tbody></table></div></section>
${fbs.length ? `<section><h2>Feedback</h2><ol class="feed">${fbs.map(f => `<li><time>${esc(fmtDT(f.created_at))}</time><span>${esc(roomTitle(f.room) || 'The site')}${f.face ? ` ${faceTag(f.face)}` : ''}${f.difficulty ? ` <span class="muted">· ${esc(f.difficulty.toLowerCase())}</span>` : ''}${f.text ? `<br>“${esc(f.text)}”` : ''}</span></li>`).join('')}</ol></section>` : ''}
<section><h2>Everything they did</h2><ol class="feed">${timeline}</ol></section>
</div>`);
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
.dash{max-width:880px;padding-top:4px;padding-bottom:80px}
.dash a{text-decoration:none}
.dash h1{font-size:32px;line-height:40px;margin:4px 0 0;letter-spacing:-.4px}
.dash h2{font-size:20px;line-height:28px;margin:0 0 14px;display:flex;align-items:center;gap:10px}.dash h2 small{font-size:14px;font-weight:400}
.dash h3{font:500 11px/16px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:22px 0 8px}
.dash section{margin-top:44px}.dash section.card{margin-top:24px}
.dhead{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.seg{display:inline-flex;border:1px solid var(--line2);border-radius:999px;padding:3px;gap:2px;max-width:100%;overflow-x:auto;scrollbar-width:none}
.seg a{padding:5px 13px;border-radius:999px;color:var(--muted);font-size:14px;line-height:20px;white-space:nowrap}.seg a:hover{color:var(--ink)}.seg a.on{background:var(--ink);color:var(--bg)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px 22px}
.big{font-size:22px;line-height:30px;margin:0 0 6px}
.dot{width:9px;height:9px;border-radius:50%;background:var(--good);box-shadow:0 0 0 0 rgba(127,199,154,.6);animation:pulse 2s infinite}
@keyframes pulse{70%{box-shadow:0 0 0 8px rgba(127,199,154,0)}100%{box-shadow:0 0 0 0 rgba(127,199,154,0)}}@media(prefers-reduced-motion:reduce){.dot{animation:none}}
.now{list-style:none;margin:10px 0 0;padding:0}.now li{padding:6px 0;font-size:15px}
.feed{list-style:none;margin:0;padding:0}
.feed li{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;padding:8px 0;border-top:1px solid var(--line);font-size:14.5px;line-height:21px}
.feed time{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.feed code,.t code{font:12.5px var(--mono);color:var(--ink2);word-break:break-word}
.small{font-size:12.5px;margin:12px 0 0}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media(max-width:560px){.tiles{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tile{padding:14px}.tile b{font-size:28px;line-height:36px}.tile b.word{font-size:18px;line-height:36px}}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;display:flex;flex-direction:column;gap:2px;min-width:0}
.tile span{color:var(--muted);font-size:13.5px}.tile b.word{font-size:22px;line-height:42px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tile b{font-size:34px;line-height:42px;font-weight:400;font-variant-numeric:tabular-nums}.tile small{color:var(--muted);font-size:12.5px;line-height:18px}
.notes{margin:12px 0 0;color:var(--ink2);font-size:14px}.notes a{border-bottom:1px solid currentColor}
.chartcard{margin-top:12px;padding:16px 18px 12px}.cap{display:block;color:var(--muted);font-size:13.5px;margin-bottom:10px}
.chart{width:100%;height:96px;display:block}.chart path{fill:var(--bar)}.chart .base{stroke:var(--line2)}.chart .hit{fill:transparent}.chart .col:hover .hit{fill:rgba(237,232,222,.06)}
.xl{display:flex;justify-content:space-between;gap:8px;font:11px/16px var(--mono);color:var(--muted);margin-top:6px}
.t{width:100%;border-collapse:collapse;font-size:14.5px}.t th,.t td{text-align:left;padding:10px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.t th{font:500 11px/16px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);white-space:nowrap}.t th:first-child,.t td:first-child{padding-left:0}
.n{text-align:right!important;font-variant-numeric:tabular-nums;white-space:nowrap}.scroll{overflow-x:auto}
details summary{cursor:pointer;color:var(--muted);font-size:14px;padding:10px 0}
.who{color:var(--ink);border-bottom:1px solid var(--faint)}.who:hover{border-color:var(--ink)}
.good{color:var(--good)}.bad{color:var(--bad)}
.face{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;vertical-align:-3px}.face .fi{width:16px;height:16px;flex:none;color:var(--muted)}
.face-good .fi{color:#199e70}.face-okay .fi{color:#c98500}.face-bad .fi{color:#3987e5}
.dfoot{margin-top:56px;padding-top:20px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px;color:var(--muted);font-size:13px}
.dfoot a{color:var(--ink2);border-bottom:1px solid var(--faint)}
.back{margin:8px 0 12px}.back a{color:var(--muted)}
.phead{display:flex;gap:16px;align-items:center;margin:4px 0 8px}.phead img{width:56px;height:56px;border-radius:50%;border:1px solid var(--line2)}.phead p{margin:4px 0 0;font-size:14px}
@media(max-width:640px){.dash h1{font-size:28px;line-height:36px}.feed li{grid-template-columns:minmax(0,1fr);gap:0}.card{padding:16px}}`;
