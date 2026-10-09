# Putting a new room on the site

A room is built in `game/src/` exactly as before (the `horror-mystery-room-builder` skill). On the website it also needs a door.

1. **The game.** Add the room to `ROOMS` in `game/build.py`, `ROOMS` in `game/src/main.js` and `MYSTERIES` in `game/src/series.js`. Its `date` in `MYSTERIES` is the day it opens: the site shows it from that date in India time (`SITE_TZ`), and players' own clocks decide in the game.
2. **Its door.** Add an entry to `ROOMS_ALL` near the bottom of `site/templates/landing.html`. The words (`title`, `place`, `era`, `hook`, `tagline`, `start`) come from `MYSTERIES` when the page is served, so write them once, in `series.js`; the hook is the story only, with no game terms like level numbers. The door itself needs `n`, `id`, `short` (place · year), `mins` (e.g. `25–35 min`), `glow` (the light colour behind the door), `pos` (which part of the art shows, e.g. `50%`), `leaf`, `fx` (`buzz`, `rain`, `flicker` or `none`), `events` (two lines for the "Right now, behind the doors" feed), and `arch: true` for an arched door. `leaf` picks the door's look: reuse one (`406`, `lamp`, `sitting`, `night`, `lift`, `tik`, `tio`, `ded`) or add a `.l-<leaf> .leaf { ... }` style next to the others.
3. **Its art.** Save a still of the room's title art as `site/public/art/<id>.jpg`, about 1000 px wide. It's used behind the door, on the room's screen while it loads, and on its preview card.
4. **Publish.** Push to the `staging` branch. Vercel deploys it to `staging.<domain>` (only `ADMIN_EMAILS` can open it). Play it there, then merge `staging` into `main` to put it live:
   ```
   git checkout main && git merge staging && git push
   ```

Nothing else changes: the room's page (`/m/<id>`), game page (`/play/<id>`), preview card, sitemap entry, tracking and dashboard rows all come from `MYSTERIES`.
