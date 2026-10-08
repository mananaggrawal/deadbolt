// Creates or updates every table: Better Auth's, then ours. Safe to run on every start.
import { getMigrations } from 'better-auth/db/migration';
import { auth } from './auth.js';
import { migrateApp, pool } from './db.js';

export async function migrate() {
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
  if (toBeCreated.length || toBeAdded.length) {
    await runMigrations();
    console.log('auth tables ready', toBeCreated.map(t => t.table).join(', '));
  }
  await migrateApp();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => pool.end()).catch(e => { console.error(e); process.exit(1); });
}
