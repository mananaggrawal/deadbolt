# Putting Deadbolt online (Vercel + Neon)

The site runs on Vercel, and its data lives in a Neon Postgres database. Both have free plans. Every push to `main` on GitHub updates the live site. Every push to `staging` updates `staging.<your-domain>`, which only your Google account can open. Setup takes about an hour of clicks, once.

**What runs where**
- **Vercel** serves the static files from its CDN: the game code, voices, three.js and art.
- One **Vercel Function** (`site/src/server.js`) handles everything else: pages, sign-in, `/api/*`, preview cards and `/admin`.
- **Neon** holds players, plays, events, results, shares and feedback.
- **Google** only handles the sign-in step.
- **GitHub Actions** makes an encrypted backup of the database every night (`.github/workflows/backup.yml`).

## Where things are now

| | |
|---|---|
| Live site | https://deadbolt-pi.vercel.app (Vercel project `deadbolt`, team "mananaggrawal's projects") |
| Staging | https://deadbolt-staging.vercel.app (branch `staging`) |
| Database | Neon `neon-red-garden`, connected through Vercel > Storage, with a branch per preview deployment |
| Google sign-in | Google Cloud project `deadbolt-511009`, client "Web client 1", published |
| Code | github.com/mananaggrawal/deadbolt |

## What you need

- A domain, about ₹800 to ₹1,500 a year for a `.com` or `.in`. You can start on the free `*.vercel.app` address and add the domain later.
- Accounts on:
  - GitHub (the `deadbolt` repo);
  - Vercel (sign up with GitHub; the Hobby plan is free);
  - Google Cloud (free).
- `openssl` on your Mac, which is already there, to make random secrets.

## 1. The code on GitHub

The repo needs this code on `main`, plus a `staging` branch:

```
git push origin main
git push origin main:staging
```

## 2. The Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and **import** the `deadbolt` repo.
2. **Root Directory:** click **Edit** and choose `site`. Vercel should detect the framework as **Hono**. Leave the build and output settings as they are; `site/vercel.json` sets them.
3. Click **Deploy**. This first build fails at the `migrate` step, because there is no database yet. That's expected.
4. Open **Settings > Build and Deployment** and check that **Include files outside the root directory in the Build Step** is on. It is on by default, and the build needs it to reach `game/`.

## 3. The database

1. In the project, open **Storage > Create Database > Neon**.
2. Choose the region **Singapore** (`aws-ap-southeast-1`). It's the closest to India, and the function runs in Singapore too (`regions` in `vercel.json`).
3. Choose the free plan and name the database `deadbolt`.
4. Connect it to the project for **Production** and **Preview**. Under **Create database branch for deployment**, tick **Preview**. Each preview deployment, staging included, then gets its own copy of the database, so tests never touch live data.

Vercel then adds `DATABASE_URL` (pooled, which the app uses) and `DATABASE_URL_UNPOOLED` (direct, which the migrations use) to the project by itself.

## 4. Google sign-in

At [console.cloud.google.com](https://console.cloud.google.com), signed in as you:

1. Create a project called **Deadbolt**.
2. Open **Google Auth Platform > Get started** and fill in:
   - app name "Deadbolt";
   - your support email;
   - audience **External**;
   - your contact email.
3. **Branding:** fill in:
   - home page `https://yourdomain`;
   - privacy policy `https://yourdomain/privacy`;
   - terms `https://yourdomain/terms`;
   - authorized domain `yourdomain`.
4. Verify the domain in [Google Search Console](https://search.google.com/search-console) with the same Google account: choose **Domain**, then add the TXT record it gives you at your domain's DNS.
5. **Clients > Create client**, with type **Web application**:
   - Authorized JavaScript origins: `https://yourdomain` and `https://staging.yourdomain`.
   - Authorized redirect URIs: `https://yourdomain/api/auth/callback/google` and `https://staging.yourdomain/api/auth/callback/google`.
   - Copy the client ID and the secret.
6. **Data access:** leave it as it is. The site asks only for name, email and profile picture, which need no review.
7. **Audience > Publish app**, so anyone can sign in. While the app is in "Testing", only listed test users can.
8. **Branding > Verify branding**, then **Publish branding**. The automatic check usually takes minutes, and a manual review 2 to 3 business days. Sign-in works in the meantime.

If you start on the free addresses, use `https://<project>.vercel.app` for the live site and a second `vercel.app` name for staging (Settings > Domains > Add, connected to Preview, branch `staging`). Skip steps 3 and 4 until you have the domain.

## 5. Settings (environment variables)

Open **Vercel > project > Settings > Environment Variables**. Add each of these for **Production** and mark it **Sensitive**:

| Name | Value |
|---|---|
| `BETTER_AUTH_SECRET` | the output of `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | from step 4.5 |
| `GOOGLE_CLIENT_SECRET` | from step 4.5 |
| `ADMIN_EMAILS` | your Gmail address. To add more, separate them with commas. These addresses can open `/admin` and staging. |
| `CONTACT_EMAIL` | the address shown on the privacy page |
| `PUBLIC_URL` | `https://yourdomain` |
| `CRON_SECRET` | the output of `openssl rand -hex 24`. Vercel's nightly tidy-up job sends it, and nobody else can trigger the job without it. |
| `REQUIRE_LOGIN` | optional. `true` makes a Google sign-in necessary to play, not just to save results. Leave it unset to let guests play. |

Then add these for **Preview** only, with **Git branch** set to `staging`:

| Name | Value |
|---|---|
| `BETTER_AUTH_SECRET` | a second `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | the same as production |
| `GOOGLE_CLIENT_SECRET` | the same as production |
| `ADMIN_EMAILS` | the same as production |
| `PUBLIC_URL` | `https://staging.yourdomain` |

Every preview deployment, staging included, lets in only `ADMIN_EMAILS`. The code does this by itself, so there is no switch to forget.

## 6. The domain

1. Go to **Settings > Domains > Add** and add `yourdomain`. Accept the suggestion to redirect `www.yourdomain` to it.
2. At your registrar, add the DNS records Vercel shows: usually an **A** record for `@` and a **CNAME** for `www`. HTTPS turns on by itself within minutes.
3. **Add** `staging.yourdomain` as well. Open it, choose **Connect to an environment > Preview**, and set the Git branch to `staging`. Add the **CNAME** Vercel shows.

## 7. The staging database

Nothing to do: the Neon connection from step 3 gives every preview deployment its own database branch. To start staging over from a fresh copy of live data, delete its branch in Neon (**Vercel > Storage > Open in Neon > Branches**) and redeploy `staging`.

## 8. Deploy

1. **Production:** open **Deployments**, then on the failed first deployment choose **⋯ > Redeploy**. It takes about two minutes. The build log shows "Database schema mismatch" followed by "auth tables ready". That's the sign-in tables being created, and it happens only once.
2. **Staging:** push anything to `staging`, or redeploy its latest deployment.

Then check that:
- `https://yourdomain` shows the corridor of doors, and **Sign in** at the top right works;
- `https://yourdomain/admin` shows the dashboard, for `ADMIN_EMAILS` only;
- `https://yourdomain/healthz` says `{"ok":true,...}`;
- `https://staging.yourdomain` asks you to sign in, and lets only you in. Vercel may ask you to log in to Vercel first; that's its own protection for preview deployments.
- Pasting `https://yourdomain/m/tio` into WhatsApp shows the room's preview card.

## 9. Backups

Neon keeps its own short history: on the free plan you can restore to any moment in the last 6 hours. For anything older, the nightly GitHub backup keeps 30 days.

1. Make a passphrase with `openssl rand -base64 24` and **save it in your password manager**. A backup can't be opened without it.
2. Go to **GitHub > repo > Settings > Secrets and variables > Actions > New repository secret** and add two secrets:
   - `BACKUP_DATABASE_URL`: the **direct** (unpooled) connection string of Neon's `main` branch. Neon > Connect, with **Connection pooling** off.
   - `BACKUP_PASSPHRASE`: the passphrase from step 1.
3. Go to **Actions > backup > Run workflow** to test it. The run ends with an artifact called `deadbolt-db-<date>`.

It then runs every night at 2:30 a.m. India time. The files are encrypted, so they're safe even if the repo is public.

## Day to day

- **A new room:** Claude builds it, adds its door (`site/ROOMS.md`), and pushes to `staging`. Play it on `staging.yourdomain`, then put it live:
  ```
  git checkout main && git merge staging && git push
  ```
- **Logs:** Vercel > project > **Logs**. Filter by `/api/` or by errors.
- **Roll back:** Vercel > **Deployments**, pick an earlier production deployment, then **⋯ > Instant Rollback**. It takes seconds. Database changes are not rolled back; they only ever add tables and columns.
- **Make sign-in necessary to play:** set `REQUIRE_LOGIN` to `true` for Production, then redeploy.
- **Restore from the last 6 hours:** Neon > **Restore**, then pick the branch and the time.
- **Restore an older backup:**
  1. Download the artifact from the backup run on GitHub and unzip it.
  2. Decrypt it and restore it into a new Neon branch first, to check it:
     ```
     openssl enc -d -aes-256-cbc -pbkdf2 -in deadbolt-<date>.dump.enc -out deadbolt.dump   # asks for the passphrase
     pg_restore --clean --if-exists --no-owner -d "<direct connection string>" deadbolt.dump
     ```
     `pg_restore` comes with `brew install libpq` and needs version 18 or later.
  3. Once the data looks right, restore it into `main` the same way.

## Limits and cost

- **Vercel Hobby:** free, for non-commercial use.
  - Each month it includes 100 GB of transfer, 1 million function calls and 4 hours of function CPU.
  - A play loads about 6 MB from the CDN the first time, mostly voices. After that, browsers keep it cached for a year.
  - If Deadbolt starts making money (ads, paid rooms, sponsors), Vercel's terms need the **Pro** plan, at $20 a month.
- **Neon free:** one project with a small database and limited compute hours. It sleeps when nobody plays, and wakes in about half a second. The tables are small, and a year of plays fits easily. Vercel > Storage shows usage; Neon's paid plan starts at about $5 a month if you outgrow it.
- **Total:** about ₹100 a month, which is the domain.

## Good to know

- The nightly tidy-up runs once a day, some time between 2:45 and 3:45 a.m. India time. On Hobby, Vercel picks the minute. It rolls events older than 13 months into daily totals and deletes expired sign-ins.
- If Google says `redirect_uri_mismatch`, the redirect URI from step 4.5 doesn't exactly match the address you're on, or `PUBLIC_URL` is wrong.
- If the build says it can't find `../game/build.py`, the setting from step 2.4 is off.
- Progress players made on the old claude.ai link doesn't carry over, because browsers keep it per site address.
- Earlier VPS deploy files (Docker, Caddy, DigitalOcean) are in git history (commit `5acbaac`), in case you ever want to move off Vercel.
