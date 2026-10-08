// Postgres: one small pool for the app and Better Auth, sized for serverless functions.
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { cfg } from './config.js';

export const pool = new pg.Pool({
  connectionString: cfg.databaseUrl,
  max: cfg.onVercel ? 3 : 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});
pool.on('error', e => console.error('postgres pool error', e.message));
// on Vercel, close idle connections before the function instance is suspended
if (cfg.onVercel) attachDatabasePool(pool);

export const q = (text, params) => pool.query(text, params);
export const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
export const rows = async (text, params) => (await pool.query(text, params)).rows;
