// Nightly upkeep (run by the server's cron, see deploy/cloud-init.yaml):
// raw events older than 13 months become daily totals, and expired sign-in rows are cleared.
import { pool, q } from './db.js';

async function main() {
  const cutoff = "now() - interval '13 months'";
  await q(`insert into event_daily (day, room, name, step, n)
           select ts::date, coalesce(room, ''), name, coalesce(step, -1), count(*)::int from events where ts < ${cutoff}
           group by 1, 2, 3, 4
           on conflict (day, room, name, step) do update set n = event_daily.n + excluded.n`);
  const ev = await q(`delete from events where ts < ${cutoff}`);
  const se = await q('delete from "session" where "expiresAt" < now()');
  const ve = await q('delete from "verification" where "expiresAt" < now()');
  console.log(new Date().toISOString(), `rolled up and removed ${ev.rowCount} old events, ${se.rowCount} expired sessions, ${ve.rowCount} expired verifications`);
}
main().then(() => pool.end()).catch(e => { console.error(e); process.exit(1); });
