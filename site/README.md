# The website

The Deadbolt site includes:
- the door landing page;
- every room at its own URL;
- Google sign-in;
- results that follow you across devices;
- play tracking;
- share links with preview cards;
- feedback;
- a dashboard.

It runs on Vercel as one Hono function plus static files, with Postgres (Neon) for data. Deploying it is covered in [../DEPLOY.md](../DEPLOY.md).

| Path | What it is |
|---|---|
| `src/server.js` | Every route: pages, the game page, `/api/*`, preview images, `/admin`, the nightly cron. Exports the Hono app; Vercel runs it as a function. |
| `src/local.js` | Runs the same app as a plain Node server, for your computer. It runs migrations first. |
| `src/auth.js` | Google sign-in (Better Auth, sessions in Postgres) |
| `src/db.js`, `src/migrate.js`, `src/migrations/` | The Postgres pool, and our tables: `plays`, `events`, `results`, `shares`, `feedback`, `players`, `profiles`. On Vercel, migrations run at build time. |
| `src/rooms.js` | The room list, generated from `MYSTERIES` in `game/src/series.js` |
| `src/og.js` | 1200×630 link-preview cards for the site, each room and each result |
| `src/pages.js`, `src/admin.js` | Result pages, privacy, terms, the staging gate, and the dashboard |
| `src/maintenance.js` | Nightly cleanup: old events go into daily totals, expired sessions are removed |
| `templates/landing.html` | The door landing page. The server fills in `<!--MR_HEAD-->`. |
| `public/` | Served as-is by Vercel's CDN. `mr.js` is the browser client: sign-in, results sync, tracking, sharing and feedback; the game calls it as `window.MR`. `art/` holds each room's art. `game/`, `vendor/` and the icons are generated at build time. |
| `tools/prepare.mjs` | The build step after the game build. It copies the game code, voices and three.js into `public/`, and bundles the templates, the room list, art and fonts into `src/generated/assets.js`. |
| `tools/e2e.py` | Headless check of a running site |
| `vercel.json` | The build command, region, nightly cron and cache headers |

## How the game and the site talk

The game is built from `game/src/`; `python3 game/build.py site` writes `game/dist/site/`:
- a small `play.html` shell;
- `app.<hash>.js`, the whole game;
- `vo.<hash>.json`, the voices.

Because the file names change whenever the content does, the CDN caches them for a year.

The game calls `window.MR` through the small "host bridge" in `game/src/series.js` for:
- room starts and escapes;
- sharing;
- the pause-menu feedback link;
- going back to the corridor.

Without `window.MR` (a `build.py prod` single file), the game behaves exactly as before. While a room is open, `mr.js` polls the game's state every 1.5 s. It reports squares done, hints and wrong guesses.

Results stay in the browser's localStorage, where the game reads them. When a player is signed in, `mr.js` merges them with the account on every page load, and the earliest escape from each room wins. So a second device shows the same escapes and squares.

## Running it on your computer

You need Node 22, Python 3 and a Postgres you can reach.

```
cd site && npm install
createdb deadbolt
DATABASE_URL=postgres://localhost/deadbolt ADMIN_EMAILS=you@gmail.com MR_DEV_PASSWORD_LOGIN=true npm run dev
# http://localhost:3000
```

`npm run dev` builds the game and the site, then starts the server; `npm start` only starts it.

Google sign-in works locally once your OAuth client lists `http://localhost:3000/api/auth/callback/google` as a redirect URI and you set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Without it, `MR_DEV_PASSWORD_LOGIN=true` turns on email-and-password sign-in for testing. It is never on in production. To sign up, `POST /api/auth/sign-up/email` with `{"email","password","name"}`.

To check a running copy, run `python3 tools/e2e.py http://localhost:3000 [session-cookie]`.

`npx vercel build` builds exactly what Vercel will deploy, into `.vercel/output/`.

## Adding a room to the site

See [ROOMS.md](ROOMS.md).
