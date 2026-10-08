// Creates or updates every table: Better Auth's, then ours (src/migrations/*.sql, in order).
// Runs during the build on Vercel (`npm run vercel-build`) and on start when running locally.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMigrations } from 'better-auth/db/migration';
import { auth } from './auth.js';
import { pool, q, rows } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function migrate() {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  if (toBeCreated.length || toBeAdded.length) {
    await runMigrations();
    console.log('auth tables ready', toBeCreated.map(t => t.table).join(', '));
  }
  await q('create table if not exists mr_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await rows('select name from mr_migrations')).map(r => r.name));
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (done.has(f)) continue;
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await client.query('insert into mr_migrations (name) values ($1)', [f]);
      await client.query('commit');
      console.log('applied', f);
    } catch (e) {
      await client.query('rollback'); throw e;
    } finally { client.release(); }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => pool.end()).catch(e => { console.error(e); process.exit(1); });
}
