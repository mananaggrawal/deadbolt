# The website

The Deadbolt site includes:
- the door landing page;
- every room at its own URL;
- Google sign-in;
- results that follow you across devices;
- play tracking;
- sharing: one panel for the site, a room or a result, with a tracked link per person and app;
- feedback;
- a dashboard, including where shares come from and what they lead to.

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
| `tools/e2e_mobile.py` | Headless check of the phone journey, sharing, sign-in on the door (`--require-login`) and Esc to pause / Esc to carry on |
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

## Sharing

Every Share button (top bar, the bottom of the page, the footer, the account menu, and in the game the room's screen, the pause menu and the end screen) calls `MR.openShare({ kind, room, surface })`. It opens one panel: WhatsApp first on phones, then the phone's own share sheet, Telegram, X, Facebook, email and copy.

- Each person (signed in, or a guest's browser) gets one link per room, one for the site, and one per result, kept in `shares` with its `kind` (`room`, `site`, `result`) and the place it was first shared from (`surface`). Results use `/r/<code>`; rooms and the site use `/i/<code>`, which goes on to that room (or the front page).
- Each app adds `?via=` (`wa`, `tg`, `x`, `fb`, `em`, `cp` copied, `sh` share sheet).
- Events: `share_open` (panel opened), `share_click` (an app chosen), `share_visit` (someone arrived through a link). A browser keeps the first link it arrived through for 30 days (`players.from_share`, `from_via`), and its plays carry it (`plays.from_share`, `from_via`), so the dashboard can show visitors, new players, plays, sign-ups and escapes per app, per room, per place and per person.

## Phones

- The landing page fetches the game's code in the background once the corridor is in view (or a door is touched). Without a server-filled room screen, the game page shows a loading screen until its code arrives.
- Upright phones can read a room's title and end screens. Begin keeps the tap (sound, full screen, keeping the screen awake) and the room starts once the phone is turned sideways.
- Leaving the app (or the tab) pauses the room, saves straight away and silences it. The screen stays awake while a room is played. Phones that can't keep up step down to a lower resolution.
- In Instagram, Facebook, LinkedIn and other in-app browsers, Google refuses to sign anyone in: a bar offers to open the page in Chrome (Android) or explains how to open it in Safari (iPhone), keeping the share code.
- When sign-in is required (the default), a signed-out `/play/<id>` goes to that room's page to sign in, and Google brings the player straight back into the room.

## Running it on your computer

You need Node 22, Python 3 and a Postgres you can reach.

```
cd site && npm install
createdb deadbolt
DATABASE_URL=postgres://localhost/deadbolt MR_DEV_PASSWORD_LOGIN=true npm run dev
# http://localhost:3000
```

`npm run dev` builds the game and the site, then starts the server; `npm start` only starts it.

Google sign-in works locally once your OAuth client lists `http://localhost:3000/api/auth/callback/google` as a redirect URI and you set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Without it, `MR_DEV_PASSWORD_LOGIN=true` turns on email-and-password sign-in for testing. It is never on in production. To sign up, `POST /api/auth/sign-up/email` with `{"email","password","name"}`.

The dashboard (`/admin`) opens only for the address in `admins` in `src/config.js` (manan190303@gmail.com), and only once that account's email is verified. To see it locally, sign up with that address, then `update "user" set "emailVerified" = true where email = 'manan190303@gmail.com'` and sign in.

To check a running copy, run `python3 tools/e2e.py http://localhost:3000 [session-cookie]` and `python3 tools/e2e_mobile.py http://localhost:3000 [session-cookie]`.

`npx vercel build` builds exactly what Vercel will deploy, into `.vercel/output/`.

## Adding a room to the site

See [ROOMS.md](ROOMS.md).
