// Google sign-in, handled inside this server by Better Auth. Sessions live in our Postgres.
import { betterAuth } from 'better-auth';
import { cfg } from './config.js';
import { pool } from './db.js';

export const auth = betterAuth({
  appName: cfg.siteName,
  baseURL: cfg.baseURL,
  basePath: '/api/auth',
  secret: cfg.authSecret,
  database: pool,
  trustedOrigins: [cfg.baseURL],
  socialProviders: {
    google: {
      clientId: cfg.google.clientId,
      clientSecret: cfg.google.clientSecret,
      prompt: 'select_account',          // scopes stay the defaults: openid, email, profile
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,        // 30 days, renewed once a day while in use
    updateAge: 60 * 60 * 24,
  },
  account: { accountLinking: { enabled: true, trustedProviders: ['google'] } },
  // local testing only: email + password sign-in, never on in production
  emailAndPassword: { enabled: !cfg.production && process.env.MR_DEV_PASSWORD_LOGIN === 'true' },
  advanced: {
    useSecureCookies: cfg.baseURL.startsWith('https://'),
    // sessions keep no IP address (the privacy page promises that); our own per-IP limits in server.js stay
    ipAddress: { disableIpTracking: true },
  },
  // we only need Google to say who someone is: drop the access tokens it hands back
  databaseHooks: {
    account: {
      create: { before: async account => ({ data: { ...account, accessToken: null, refreshToken: null, idToken: null } }) },
      update: { before: async account => ({ data: { ...account, accessToken: null, refreshToken: null, idToken: null } }) },
    },
  },
});

export async function sessionOf(c) {
  try {
    const s = await auth.api.getSession({ headers: c.req.raw.headers });
    return s && s.user ? s : null;
  } catch (e) { return null; }
}
export const isAdmin = s => !!(s && s.user && s.user.email && s.user.emailVerified !== false && cfg.admins.includes(s.user.email.toLowerCase()));
