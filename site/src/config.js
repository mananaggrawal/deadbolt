// Everything the server reads from its environment (see deploy/.env.example).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const env = process.env;
const here = path.dirname(fileURLToPath(import.meta.url));
const list = s => (s || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);

export const cfg = {
  port: Number(env.PORT || 3000),
  production: env.NODE_ENV === 'production',
  baseURL: (env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, ''),
  databaseUrl: env.DATABASE_URL || 'postgres://localhost/mysteryrooms',
  authSecret: env.BETTER_AUTH_SECRET || (env.NODE_ENV === 'production' ? '' : 'dev-secret-change-me-dev-secret-change-me'),
  google: { clientId: env.GOOGLE_CLIENT_ID || '', clientSecret: env.GOOGLE_CLIENT_SECRET || '' },
  admins: list(env.ADMIN_EMAILS),
  requireLogin: env.REQUIRE_LOGIN === 'true',      // true: the game itself needs a Google sign-in
  staging: env.STAGING === 'true',                 // true: the whole site is only for admin emails
  version: env.APP_VERSION || 'dev',
  siteName: env.SITE_NAME || 'Mystery Rooms',
  contactEmail: env.CONTACT_EMAIL || '',
  timeZone: env.SITE_TZ || 'Asia/Kolkata',         // the day a room opens on the site
  umami: { src: env.UMAMI_SCRIPT_URL || '', websiteId: env.UMAMI_WEBSITE_ID || '' },
  gameDir: path.resolve(here, '..', env.GAME_DIR || '../game/dist/site'),
  publicDir: path.resolve(here, '..', 'public'),
  threeFile: path.resolve(here, '..', 'node_modules/three/build/three.module.js'),
};

if (cfg.production) {
  const missing = ['PUBLIC_URL', 'DATABASE_URL', 'BETTER_AUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'].filter(k => !env[k]);
  if (missing.length) { console.error(`Missing settings: ${missing.join(', ')} (see deploy/.env.example)`); process.exit(1); }
}
