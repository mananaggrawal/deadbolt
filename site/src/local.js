// Run the site on your own computer (or any Node host): migrate, then serve.
//   npm run dev     (builds the game and assets first)
//   npm start       (after a build)
import { serve } from '@hono/node-server';
import { cfg } from './config.js';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import app from './server.js';

await migrate();
serve({ fetch: app.fetch, port: cfg.port, hostname: '0.0.0.0' }, i =>
  console.log(`${cfg.siteName} on :${i.port} (${cfg.baseURL}, version ${cfg.version}${cfg.staging ? ', staging' : ''})`));
const stop = () => pool.end().finally(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
