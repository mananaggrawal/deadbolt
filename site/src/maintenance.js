// Nightly upkeep, called by Vercel Cron (GET /api/cron/maintenance, see vercel.json):
// raw events older than 13 months become daily totals, and expired sign-in rows are cleared.
import { q } from './db.js';

export async function runMaintenance() {
  const cutoff = "now() - interval '13 months'";
  await q(`insert into event_daily (day, room, name, step, n)
           select ts::date, coalesce(room, ''), name, coalesce(step, -1), count(*)::int from events where ts < ${cutoff}
           group by 1, 2, 3, 4
           on conflict (day, room, name, step) do update set n = event_daily.n + excluded.n`);
  const ev = await q(`delete from events where ts < ${cutoff}`);
  const se = await q('delete from "session" where "expiresAt" < now()');
  const ve = await q('delete from "verification" where "expiresAt" < now()');
  const out = { at: new Date().toISOString(), events_rolled_up: ev.rowCount, sessions_removed: se.rowCount, verifications_removed: ve.rowCount };
  console.log('maintenance', out);
  return out;
}
