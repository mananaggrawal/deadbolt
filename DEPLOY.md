# Putting Mystery Rooms on your own server

The site runs on one DigitalOcean server in Bangalore, with Cloudflare in front. Every push to `main` on GitHub deploys the live site; every push to `staging` deploys `staging.<your-domain>`, which only your Google account can open. Setting it up takes about two hours of clicks, once.

**What runs where:** the server runs Caddy (HTTPS), the app (`site/`), Postgres and Umami (visitor stats) under Docker Compose (`deploy/`). GitHub builds the app image and deploys it (`.github/workflows/deploy.yml`). Google only handles the sign-in step. Cloudflare R2 holds encrypted nightly database backups.

## What you need

- A domain (about ₹800 to ₹1,500 a year for a `.com` or `.in`).
- Accounts: GitHub, Cloudflare (free plan), DigitalOcean (needs a card), Google Cloud (free).
- On your Mac: the GitHub CLI (`brew install gh`, then `gh auth login`).

## 1. Put the code on GitHub

Unzip this over your `mystery-rooms` repo folder (it adds `site/`, `deploy/`, `.github/` and this file, and updates `game/`), then:

```
cd mystery-rooms
git add -A && git commit -m "Self-hosted site"
git push origin main
git push origin main:staging
```

The first deploy run will fail with "secret DOMAIN is not set". That's expected until step 5.

If the repo isn't on GitHub yet, follow `PORTING.md` step 1 first.

## 2. Domain and Cloudflare

1. Buy the domain anywhere (Cloudflare's own registrar sells many endings at cost).
2. In Cloudflare: **Add a domain**, pick the **Free** plan, and change the nameservers at your registrar to the two Cloudflare gives you.
3. **SSL/TLS > Overview:** set the mode to **Full (strict)**.
4. **SSL/TLS > Origin Server > Create Certificate:** keep "RSA" and the hostnames `yourdomain` and `*.yourdomain`, 15 years. Save the certificate as `origin.pem` and the private key as `origin.key` on your Mac. The key is shown only once.
5. **Caching > Cache Rules > Create rule** named "Game files": when *URI Path* starts with `/game/`, or starts with `/vendor/`, or starts with `/art/`, or starts with `/og/`, then **Eligible for cache**, Edge TTL "Use cache-control header if present". This keeps the 4.5 MB of voices and three.js on Cloudflare's edge instead of your server.

## 3. The server

1. Make a key for GitHub to log in with:
   ```
   ssh-keygen -t ed25519 -f ~/.ssh/mystery-rooms-deploy -N "" -C github-deploy
   ```
   If you don't have a key of your own yet, run `ssh-keygen -t ed25519` too.
2. DigitalOcean > **Create > Droplets**:
   - Region **Bangalore (BLR1)**, image **Ubuntu 24.04 LTS**.
   - **Basic > Regular**, **$24/mo (2 vCPU, 4 GB)**. ($12/mo, 2 GB, is enough to start; you can resize later.)
   - **Authentication > SSH keys:** add both public keys (`cat ~/.ssh/mystery-rooms-deploy.pub` and `cat ~/.ssh/id_ed25519.pub`).
   - **Backups:** weekly, if you want whole-server snapshots too (adds 20%).
   - **Advanced options > Add initialization scripts:** paste all of `deploy/cloud-init.yaml`.
   - Hostname `mystery-rooms`, then **Create Droplet**. Note its IP address.
3. Wait about five minutes for the setup script, then check: `ssh deploy@<ip> docker ps` should print an empty table.
4. **Networking > Firewalls > Create Firewall** (recommended): inbound SSH (22) from all addresses (GitHub's deploy machines change IPs; logins are key-only), HTTP (80) and HTTPS (443) only from Cloudflare's addresses at [cloudflare.com/ips](https://www.cloudflare.com/ips/). Apply it to the Droplet.
5. Back in Cloudflare **DNS > Records**, add four **A** records pointing at the Droplet's IP, all **Proxied** (orange cloud): `@`, `www`, `staging`, `stats`.

## 4. Google sign-in

In [console.cloud.google.com](https://console.cloud.google.com), signed in as you:

1. Create a project called **Mystery Rooms**.
2. Open **Google Auth Platform** and click **Get started**: app name "Mystery Rooms", your support email, audience **External**, your contact email.
3. **Branding:** home page `https://yourdomain`, privacy policy `https://yourdomain/privacy`, terms `https://yourdomain/terms`, authorized domain `yourdomain`. A logo is optional (`site/public/favicon.svg`, exported as a 120×120 PNG, works).
4. Verify the domain in [Google Search Console](https://search.google.com/search-console) with the same Google account: choose **Domain**, and add the TXT record it gives you in Cloudflare DNS.
5. **Clients > Create client**, type **Web application**:
   - Authorized JavaScript origins: `https://yourdomain` and `https://staging.yourdomain`
   - Authorized redirect URIs: `https://yourdomain/api/auth/callback/google` and `https://staging.yourdomain/api/auth/callback/google`
   - Copy the client ID and secret.
6. **Data access:** leave it as it is. The site only asks for name, email and profile picture, which need no review.
7. **Audience > Publish app**, so anyone can sign in (in "Testing", only listed test users can).
8. **Branding > Verify branding**, then **Publish branding**. The automatic check usually takes minutes; a manual review takes 2 to 3 business days. Sign-in works meanwhile.

## 5. Secrets

From the repo folder on your Mac:

```
bash deploy/setup-secrets.sh
```

It asks for the domain, the Droplet's IP, the deploy key (`~/.ssh/mystery-rooms-deploy`), the Google client ID and secret, your admin email, a contact email and the two Cloudflare certificate files, and generates the rest. **It prints a backup passphrase once: save it in your password manager.** You need it to restore a backup.

## 6. Deploy

GitHub > **Actions > deploy > Run workflow** on `main` (about five minutes), then again on `staging`. Then:

- `https://yourdomain` shows the corridor of doors. Sign in from the top right.
- `https://yourdomain/admin` is the dashboard (only `ADMIN_EMAILS`).
- `https://staging.yourdomain` asks you to sign in, and lets only you in.

## 7. Visitor stats (Umami)

1. Open `https://stats.yourdomain` and log in as `admin` / `umami`. **Change the password at once** (Settings > Profile).
2. **Settings > Websites > Add website** (your domain), and copy its **Website ID**.
3. `gh secret set UMAMI_WEBSITE_ID`, paste it, then re-run the deploy.

## 8. Backups (recommended)

1. Cloudflare > **R2 > Create bucket** `mystery-rooms-backups`.
2. **R2 > Manage API tokens > Create API token:** "Object Read & Write", limited to that bucket. Copy the access key ID, the secret access key and your account ID.
3. Run `bash deploy/setup-secrets.sh` again, fill in the four R2 questions (Enter skips the rest), and re-run the deploy.

Backups run at 2:30 a.m. India time. The next day, `ssh deploy@<ip> tail /opt/mystery-rooms/backup.log` should show two files.

## Day to day

- **A new room:** Claude builds it, adds its door (`site/ROOMS.md`), and pushes to `staging`. Play it on `staging.yourdomain`, then put it live: `git checkout main && git merge staging && git push`.
- **Logs:** `ssh deploy@<ip> 'cd /opt/mystery-rooms && docker compose logs --tail 100 app'`
- **Roll back:** Actions > deploy > open an earlier successful run on `main` > **Re-run all jobs**. A deploy whose new version fails its health check rolls itself back.
- **Make sign-in required to play:** `gh secret set REQUIRE_LOGIN` with `true`, then re-run the deploy.
- **Restore a backup:** `ssh deploy@<ip>`, `cd /opt/mystery-rooms`, `./restore.sh` lists the backups, and `./restore.sh daily/<file>` restores one (it asks for the passphrase).

## Good to know

- `POSTGRES_PASSWORD` can't be changed after the first deploy: the database keeps the one it was created with.
- On the very first start the app logs "Database schema mismatch", followed by "auth tables ready". That's the sign-in tables being created.
- Progress players had on the old claude.ai link doesn't carry over: browsers keep it per site address.
- If Google says `redirect_uri_mismatch`, the redirect URI in step 4.5 doesn't exactly match the address you're on.
- Cost: about $29 a month ($24 server, $4.80 weekly server backups, ~$1 domain). Cloudflare, R2 under 10 GB, Google sign-in and Umami cost nothing.
