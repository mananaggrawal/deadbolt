// /admin: how each room is doing. Only the emails in ADMIN_EMAILS can open it.
import { cfg } from './config.js';
import { rows, one } from './db.js';
import { allRooms, fmtTime } from './rooms.js';
import { esc, headTags, layout } from './pages.js';

const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const bar = (v, max, color = 'var(--lamp)') => `<span class="bar"><i style="width:${max ? Math.max(2, Math.round(100 * v / max)) : 0}%;background:${color}"></i></span>`;

export async function adminPage(days) {
  const iv = [days];
  const rooms = allRooms().slice().reverse();
  const [plays, opens, steps, trouble, shares, clicks, fb, fbList, daily, acct, visits, pages, refs, places] = await Promise.all([
    rows(`select room, count(*)::int starts, count(distinct coalesce(user_id, anon_id::text))::int players,
            count(*) filter (where outcome = 'escaped')::int escapes,
            round(percentile_cont(0.5) within group (order by seconds) filter (where outcome = 'escaped'))::int med,
            round(percentile_cont(0.9) within group (order by seconds) filter (where outcome = 'escaped'))::int p90,
            round(avg(hints) filter (where outcome = 'escaped'), 1)::float avg_hints,
            count(*) filter (where device like 'phone%')::int phone, count(*) filter (where device like 'phone%' and outcome = 'escaped')::int phone_esc
          from plays where started_at > now() - make_interval(days => $1) group by room`, iv),
    rows(`select room, count(*)::int n from events where name = 'room_open' and ts > now() - make_interval(days => $1) group by room`, iv),
    rows(`select room, steps_done, outcome, count(*)::int n, max(steps_total)::int st from plays
          where started_at > now() - make_interval(days => $1) and (outcome = 'escaped' or last_seen < now() - interval '2 hours')
          group by room, steps_done, outcome`, iv),
    rows(`select room, step, name, count(*)::int n from events where name in ('hint_used', 'wrong') and step is not null
          and ts > now() - make_interval(days => $1) group by room, step, name`, iv),
    rows(`select room, count(*)::int shares, coalesce(sum(landings), 0)::int landings, coalesce(sum(plays_started), 0)::int plays
          from shares where created_at > now() - make_interval(days => $1) group by room`, iv),
    rows(`select room, count(*)::int n from events where name = 'share_click' and ts > now() - make_interval(days => $1) group by room`, iv),
    rows(`select room, count(rating)::int n, round(avg(rating), 1)::float avg,
            count(*) filter (where difficulty = 'Too easy')::int easy, count(*) filter (where difficulty = 'Just right')::int right,
            count(*) filter (where difficulty = 'Too hard')::int hard
          from feedback where created_at > now() - make_interval(days => $1) group by room`, iv),
    rows(`select created_at, room, kind, rating, difficulty, text, context from feedback order by created_at desc limit 40`),
    rows(`select to_char(date_trunc('day', started_at at time zone $2), 'YYYY-MM-DD') d, count(*)::int starts,
            count(*) filter (where outcome = 'escaped')::int escapes
          from plays where started_at > now() - make_interval(days => $1) group by 1 order by 1`, [days, cfg.timeZone]),
    one(`select (select count(*) from "user")::int users,
            (select count(*) from "user" where "createdAt" > now() - make_interval(days => $1))::int new_users,
            (select count(*) from players)::int browsers,
            (select count(*) from players where last_seen > now() - interval '7 days')::int active7`, iv),
    rows(`select to_char(date_trunc('day', ts at time zone $2), 'YYYY-MM-DD') d, count(*)::int views, count(distinct anon_id)::int visitors
          from events where name = 'page_view' and ts > now() - make_interval(days => $1) group by 1 order by 1`, [days, cfg.timeZone]),
    rows(`select regexp_replace(coalesce(data->>'path', '?'), '^/r/.*$', '/r/…') p, count(*)::int n, count(distinct anon_id)::int u
          from events where name = 'page_view' and ts > now() - make_interval(days => $1) group by 1 order by 2 desc limit 12`, iv),
    rows(`select data->>'ref' ref, count(distinct anon_id)::int u from events where name = 'page_view' and data->>'ref' is not null
          and data->>'ref' <> $2 and ts > now() - make_interval(days => $1) group by 1 order by 2 desc limit 12`, [days, (() => { try { return new URL(cfg.baseURL).host; } catch (e) { return ''; } })()]),
    rows(`select coalesce(country, '?') country, split_part(coalesce(device, '?'), ' ', 1) kind, count(distinct anon_id)::int u
          from events where name = 'page_view' and ts > now() - make_interval(days => $1) group by 1, 2 order by 3 desc limit 20`, iv),
  ]);
  const by = (list, id) => list.find(r => r.room === id) || {};
  const title = id => (allRooms().find(m => m.id === id) || {}).title || id;

  // overview
  const maxStarts = Math.max(1, ...plays.map(p => p.starts));
  const overview = rooms.map(m => {
    const p = by(plays, m.id), o = by(opens, m.id), s = by(shares, m.id), c = by(clicks, m.id), f = by(fb, m.id);
    return `<tr><td><b>${esc(m.title)}</b><small>#${m.n}</small></td>
      <td class="n">${o.n || 0}</td><td class="n">${p.starts || 0} ${bar(p.starts || 0, maxStarts)}</td><td class="n">${p.players || 0}</td>
      <td class="n">${p.escapes || 0}<small>${pct(p.escapes, p.starts)}%</small></td>
      <td class="n">${p.med ? fmtTime(p.med) : '–'}<small>${p.p90 ? 'slowest 10%: ' + fmtTime(p.p90) : ''}</small></td>
      <td class="n">${p.avg_hints ?? '–'}</td>
      <td class="n">${pct(p.phone, p.starts)}%<small>${p.phone ? pct(p.phone_esc, p.phone) + '% escape' : ''}</small></td>
      <td class="n">${c.n || 0}<small>${s.landings || 0} visits &middot; ${s.plays || 0} plays</small></td>
      <td class="n">${f.n ? f.avg + ' / 5' : '–'}<small>${f.n ? `${f.n} ratings` : ''}</small></td></tr>`;
  }).join('');

  // where players stop, room by room
  const funnels = rooms.map(m => {
    const list = steps.filter(r => r.room === m.id); if (!list.length) return '';
    const total = list.reduce((a, r) => a + r.n, 0), st = Math.max(...list.map(r => r.st || 0), ...list.map(r => r.steps_done));
    const tr = trouble.filter(r => r.room === m.id), maxT = Math.max(1, ...tr.map(r => r.n));
    const cells = [];
    for (let k = 0; k <= st; k++) {
      const reached = list.filter(r => r.outcome === 'escaped' || r.steps_done >= k).reduce((a, r) => a + r.n, 0);
      const hints = (tr.find(r => r.step === k && r.name === 'hint_used') || {}).n || 0;
      const wrong = (tr.find(r => r.step === k && r.name === 'wrong') || {}).n || 0;
      cells.push(`<tr><td>${k === 0 ? 'Started' : `Square ${k} done`}</td><td class="n">${reached}<small>${pct(reached, total)}%</small></td><td>${bar(reached, total)}</td>
        <td class="n">${k < st ? hints : ''}</td><td>${k < st ? bar(hints, maxT, 'var(--sq1)') : ''}</td><td class="n">${k < st ? wrong : ''}</td><td>${k < st ? bar(wrong, maxT, 'var(--sq2)') : ''}</td></tr>`);
    }
    const esc_ = list.filter(r => r.outcome === 'escaped').reduce((a, r) => a + r.n, 0);
    cells.push(`<tr><td><b>Escaped</b></td><td class="n">${esc_}<small>${pct(esc_, total)}%</small></td><td>${bar(esc_, total, 'var(--sq0)')}</td><td colspan="4"></td></tr>`);
    return `<details class="room"><summary>${esc(m.title)} <small>${total} finished or stopped plays</small></summary>
      <table><thead><tr><th></th><th class="n">Plays</th><th></th><th class="n" colspan="2">Hints taken on the next square</th><th class="n" colspan="2">Wrong guesses</th></tr></thead><tbody>${cells.join('')}</tbody></table></details>`;
  }).join('') || '<p class="muted">No finished or stopped plays yet. Plays count here once they escape or go quiet for two hours.</p>';

  const dayKeys = [...new Set([...daily.map(d => d.d), ...visits.map(v => v.d)])].sort();
  const maxV = Math.max(1, ...visits.map(v => v.visitors));
  const days_ = dayKeys.map(k => { const d = daily.find(x => x.d === k) || {}, v = visits.find(x => x.d === k) || {};
    return `<tr><td>${k}</td><td class="n">${v.visitors || 0}</td><td>${bar(v.visitors || 0, maxV)}</td><td class="n">${v.views || 0}</td><td class="n">${d.starts || 0}</td><td class="n">${d.escapes || 0}</td></tr>`; }).join('')
    || '<tr><td colspan="6" class="muted">No visits yet.</td></tr>';
  const small = (list, cols, empty) => list.length ? list.map(r => `<tr>${cols.map(([k, n]) => `<td class="${n ? 'n' : ''}">${esc(r[k] ?? '')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="muted">${empty}</td></tr>`;
  const visitors = visits.reduce((a, v) => a + v.visitors, 0);
  const fbRows = fbList.map(f => `<tr><td>${esc(new Date(f.created_at).toISOString().slice(0, 16).replace('T', ' '))}</td><td>${esc(title(f.room) || '–')}</td><td>${esc(f.kind)}${f.rating ? ` &middot; ${f.rating}/5` : ''}${f.difficulty ? ` &middot; ${esc(f.difficulty)}` : ''}</td>
    <td>${esc(f.text || '')}<small>${f.context && f.context.step != null ? `square ${f.context.step + 1}, ${fmtTime(f.context.seconds)} in` : ''}</small></td></tr>`).join('') || '<tr><td colspan="4" class="muted">No feedback yet.</td></tr>';

  const head = headTags({ title: `Dashboard · ${cfg.siteName}`, description: 'Room usage', path: '/admin', page: 'admin', noindex: true });
  return layout(head, `<style>
.dash{padding:8px 0 80px}.dash h1{font-size:34px;line-height:42px;margin:8px 0 6px}.dash h2{font-size:20px;margin:44px 0 12px}
.kpis{display:flex;gap:40px;flex-wrap:wrap;margin:22px 0 8px}.kpis div{display:flex;flex-direction:column}.kpis b{font-size:28px;font-weight:400}.kpis span{color:var(--muted);font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font:500 11px/16px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}td small{display:block;color:var(--muted);font-size:12px}
.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.scroll{overflow-x:auto}
.bar{display:inline-block;width:120px;height:6px;background:#221f1c;border-radius:3px;vertical-align:middle;margin-left:8px}.bar i{display:block;height:100%;border-radius:3px}
details.room{border-top:1px solid var(--line);padding:6px 0}details.room summary{cursor:pointer;padding:10px 0;font-size:16px}details.room summary small{color:var(--muted);margin-left:8px}
.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px}@media(max-width:900px){.grid3{grid-template-columns:1fr}}
.range a{margin-right:12px;color:var(--muted)}.range a.on{color:var(--ink)}.exp a{margin-right:14px;color:var(--ink2)}
</style><div class="wrap dash">
<p class="eyebrow">Dashboard</p><h1>How the rooms are doing</h1>
<p class="range">Last ${days} days: ${[7, 30, 90, 365].map(d => `<a href="?days=${d}" class="${d === days ? 'on' : ''}">${d} days</a>`).join('')}</p>
<div class="kpis"><div><b>${visitors}</b><span>visitors (summed by day)</span></div><div><b>${plays.reduce((a, p) => a + p.starts, 0)}</b><span>plays started</span></div><div><b>${plays.reduce((a, p) => a + p.escapes, 0)}</b><span>escapes</span></div>
<div><b>${acct.browsers}</b><span>browsers ever (${acct.active7} this week)</span></div><div><b>${acct.users}</b><span>accounts (${acct.new_users} new)</span></div></div>
<h2>Rooms</h2><div class="scroll"><table><thead><tr><th>Room</th><th class="n">Title screen</th><th class="n">Started</th><th class="n">Players</th><th class="n">Escaped</th><th class="n">Median time</th><th class="n">Hints per escape</th><th class="n">On phones</th><th class="n">Shares</th><th class="n">Rating</th></tr></thead><tbody>${overview}</tbody></table></div>
<h2>Where players stop</h2>${funnels}
<h2>Day by day</h2><div class="scroll"><table><thead><tr><th>Day</th><th class="n">Visitors</th><th></th><th class="n">Page views</th><th class="n">Plays started</th><th class="n">Escaped</th></tr></thead><tbody>${days_}</tbody></table></div>
<div class="grid3"><div><h2>Pages</h2><table><thead><tr><th>Page</th><th class="n">Views</th><th class="n">Visitors</th></tr></thead><tbody>${small(pages, [['p'], ['n', 1], ['u', 1]], 'None yet.')}</tbody></table></div>
<div><h2>Came from</h2><table><thead><tr><th>Site</th><th class="n">Visitors</th></tr></thead><tbody>${small(refs, [['ref'], ['u', 1]], 'No referrers yet.')}</tbody></table></div>
<div><h2>Where and on what</h2><table><thead><tr><th>Country</th><th>Device</th><th class="n">Visitors</th></tr></thead><tbody>${small(places, [['country'], ['kind'], ['u', 1]], 'None yet.')}</tbody></table></div></div>
<h2>Latest feedback</h2><div class="scroll"><table><thead><tr><th>When (UTC)</th><th>Room</th><th>Kind</th><th>What they said</th></tr></thead><tbody>${fbRows}</tbody></table></div>
<h2>Export</h2><p class="exp">${['plays', 'events', 'feedback', 'shares'].map(t => `<a href="/admin/export/${t}.csv?days=${days}">${t}.csv</a>`).join('')}</p>
</div>`);
}

const EXPORTS = {
  plays: `select id, room, anon_id, (user_id is not null) as signed_in, started_at, ended_at, outcome, resumed, steps_total, steps_done, hints, wrong, seconds, marks, first_escape, from_share, device, country, app_version
          from plays where started_at > now() - make_interval(days => $1) order by started_at`,
  events: `select id, ts, play_id, anon_id, (user_id is not null) as signed_in, room, name, step, data, device, country, app_version
           from events where ts > now() - make_interval(days => $1) order by id`,
  feedback: `select id, created_at, room, kind, rating, difficulty, text, context, device from feedback where created_at > now() - make_interval(days => $1) order by id`,
  shares: `select code, room, seconds, hints, wrong, marks, created_at, clicks, landings, plays_started from shares where created_at > now() - make_interval(days => $1) order by created_at`,
};
export async function exportCsv(table, days) {
  if (!EXPORTS[table]) return null;
  const list = await rows(EXPORTS[table], [days]);
  const cols = list.length ? Object.keys(list[0]) : [];
  const cell = v => { if (v === null || v === undefined) return ''; if (v instanceof Date) v = v.toISOString(); else if (typeof v === 'object') v = JSON.stringify(v); v = String(v); return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return [cols.join(','), ...list.map(r => cols.map(c => cell(r[c])).join(','))].join('\n') + '\n';
}
