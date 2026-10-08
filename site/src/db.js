// Postgres: one pool for the app and Better Auth, and a tiny migration runner for our own tables.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { cfg } from './config.js';

export const pool = new pg.Pool({ connectionString: cfg.databaseUrl, max: 10 });
pool.on('error', e => console.error('postgres pool error', e.message));

export const q = (text, params) => pool.query(text, params);
export const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
export const rows = async (text, params) => (await pool.query(text, params)).rows;

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function migrateApp() {
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
