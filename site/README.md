# The website

The self-hosted Mystery Rooms site: the door landing page, every room at its own URL, Google sign-in, results that follow you across devices, play tracking, share links with preview cards, feedback, and a dashboard. One Node process; Postgres for data. Deploying it is in [../DEPLOY.md](../DEPLOY.md).

| Path | What it is |
|---|---|
| `src/server.js` | Every route: pages, the game, `/api/*`, preview images, `/admin` |
| `src/auth.js` | Google sign-in (Better Auth, sessions in Postgres) |
| `src/db.js`, `src/migrations/` | Postgres pool and our tables (`plays`, `events`, `results`, `shares`, `feedback`, `players`, `profiles`) |
| `src/rooms.js` | Room list, read from `game/dist/site/rooms.json` (made from `series.js`) |
| `src/og.js` | 1200×630 link-preview cards for the site, each room and each result |
| `src/pages.js`, `src/admin.js` | Result pages, privacy, terms, staging gate, the dashboard |
| `src/maintenance.js` | Nightly: old events into daily totals, expired sessions out |
| `public/landing.html` | The door landing page (the server fills in `<!--MR_HEAD-->`) |
| `public/mr.js` | Browser client on every page: sign-in, results sync, tracking, sharing, feedback; the game calls it as `window.MR` |
| `public/art/` | Each room's art for its door, title screen and preview card |
| `tools/e2e.py` | Headless check of a running site |

## How the game and the site talk

The game stays a single page built from `game/src/` (`python3 game/build.py site` writes `game/dist/site/`). It calls `window.MR` through the small "host bridge" in `game/src/series.js`: room starts and escapes, sharing, the pause-menu feedback link, and going back to the corridor. Without `window.MR` (a `build.py prod` single file), the game behaves exactly as before. While a room is open, `mr.js` polls the game's state every 1.5 s and reports squares done, hints and wrong guesses.

Results stay in the browser's localStorage, where the game reads them. Signed in, `mr.js` merges them with the account on every page load (the earliest escape from each room wins), so a second device shows the same escapes and squares.

## Running it on your computer

Needs Node 22, Python 3 and a Postgres you can reach.

```
python3 game/build.py site
cd site && npm install
createdb mysteryrooms
DATABASE_URL=postgres://localhost/mysteryrooms ADMIN_EMAILS=you@gmail.com MR_DEV_PASSWORD_LOGIN=true npm start
# http://localhost:3000
```

Google sign-in works locally once your OAuth client lists `http://localhost:3000/api/auth/callback/google` as a redirect URI and you set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Without it, `MR_DEV_PASSWORD_LOGIN=true` turns on email-and-password sign-in for testing (never in production): `POST /api/auth/sign-up/email` with `{"email","password","name"}`.

Check a running copy: `python3 tools/e2e.py http://localhost:3000 [session-cookie]`.

## Adding a room to the site

See [ROOMS.md](ROOMS.md).
