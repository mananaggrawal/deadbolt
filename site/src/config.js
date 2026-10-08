// Everything the server reads from its environment (Vercel > Settings > Environment Variables).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const env = process.env;
const here = path.dirname(fileURLToPath(import.meta.url));
const list = s => (s || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const onVercel = !!env.VERCEL;
const production = env.NODE_ENV === 'production' || onVercel;

// the site's own address: PUBLIC_URL, else Vercel's address for this deployment
const vercelUrl = env.VERCEL_ENV === 'production' && env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  : env.VERCEL_BRANCH_URL ? `https://${env.VERCEL_BRANCH_URL}` : env.VERCEL_URL ? `https://${env.VERCEL_URL}` : '';

export const cfg = {
  port: Number(env.PORT || 3000),
  production,
  onVercel,
  baseURL: (env.PUBLIC_URL || vercelUrl || 'http://localhost:3000').replace(/\/$/, ''),
  // migrations use the direct connection when Neon provides one; the app uses the pooled one
  databaseUrl: (env.MIGRATE && env.DATABASE_URL_UNPOOLED) || env.DATABASE_URL || env.POSTGRES_URL || 'postgres://localhost/deadbolt',
  authSecret: env.BETTER_AUTH_SECRET || (production ? '' : 'dev-secret-change-me-dev-secret-change-me'),
  google: { clientId: env.GOOGLE_CLIENT_ID || '', clientSecret: env.GOOGLE_CLIENT_SECRET || '' },
  // the dashboard (/admin) and staging open for this account only. Fixed in code on purpose, not read from a setting.
  admins: ['manan190303@gmail.com'],
  requireLogin: env.REQUIRE_LOGIN !== 'false',     // a Google sign-in is needed to play; REQUIRE_LOGIN=false lets guests in
  // true: the whole site is only for admin emails (always on for Vercel preview deployments, e.g. staging)
  staging: env.STAGING === 'true' || env.VERCEL_ENV === 'preview',
  version: env.APP_VERSION || (env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7),
  siteName: env.SITE_NAME || 'Deadbolt',
  contactEmail: env.CONTACT_EMAIL || '',
  timeZone: env.SITE_TZ || 'Asia/Kolkata',         // the day a room opens on the site
  cronSecret: env.CRON_SECRET || '',
  publicDir: path.resolve(here, '..', 'public'),   // only read when running locally; Vercel serves public/ itself
};

if (production && !env.MIGRATE) {
  const missing = ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'].filter(k => !env[k] && !(k === 'DATABASE_URL' && env.POSTGRES_URL));
  if (missing.length) console.error(`Missing settings: ${missing.join(', ')} (see DEPLOY.md)`);
}
