#!/usr/bin/env bash
# Sets every GitHub Actions secret the deploy workflow needs, and generates the random ones.
# Run it on your computer from the repo folder, after `gh auth login`:
#     bash deploy/setup-secrets.sh
# Press Enter to skip an optional question. Re-run it any time to change a value.
set -euo pipefail
command -v gh >/dev/null || { echo "Install the GitHub CLI first: https://cli.github.com, then run: gh auth login"; exit 1; }
command -v openssl >/dev/null || { echo "openssl is needed to generate secrets"; exit 1; }
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
existing=$(gh secret list -R "$repo" | cut -f1)
has() { grep -qx "$1" <<<"$existing"; }

ask() {   # ask NAME "question" [optional]
  local v; read -r -p "$2${3:+ (Enter to skip)}: " v
  if [ -n "$v" ]; then printf '%s' "$v" | gh secret set "$1" -R "$repo"; echo "  set $1";
  elif [ -z "${3:-}" ] && ! has "$1"; then echo "  $1 is required; run this again when you have it"; fi
}
askfile() {   # askfile NAME "question"
  local f; read -r -p "$2 (path to the file): " f; f=${f/#\~/$HOME}
  if [ -n "$f" ] && [ -f "$f" ]; then gh secret set "$1" -R "$repo" < "$f"; echo "  set $1";
  elif ! has "$1"; then echo "  $1 is required; run this again when you have the file"; fi
}

echo "Deploy secrets for github.com/$repo"
echo
ask DOMAIN "Your domain, without https:// (e.g. mysteryrooms.in)"
ask DEPLOY_HOST "The Droplet's IP address"
askfile DEPLOY_SSH_KEY "The deploy SSH private key (e.g. ~/.ssh/mystery-rooms-deploy)"
ask GOOGLE_CLIENT_ID "Google OAuth client ID (ends in .apps.googleusercontent.com)"
ask GOOGLE_CLIENT_SECRET "Google OAuth client secret"
ask ADMIN_EMAILS "Google email(s) that can open /admin and staging, comma-separated"
ask CONTACT_EMAIL "Contact email for the privacy page"
askfile CF_ORIGIN_CERT "Cloudflare origin certificate (.pem)"
askfile CF_ORIGIN_KEY "Cloudflare origin private key (.key)"
echo
echo "Optional:"
ask SITE_NAME "Site name if not 'Mystery Rooms'" optional
ask REQUIRE_LOGIN "Type true to make players sign in before playing" optional
ask UMAMI_WEBSITE_ID "Umami website ID (after the first deploy)" optional
ask R2_ACCOUNT_ID "Cloudflare account ID, for backups to R2" optional
ask R2_ACCESS_KEY_ID "R2 access key ID" optional
ask R2_SECRET_ACCESS_KEY "R2 secret access key" optional
ask R2_BUCKET "R2 bucket name" optional
echo
for k in BETTER_AUTH_SECRET POSTGRES_PASSWORD UMAMI_APP_SECRET; do
  if has "$k"; then echo "  $k already set, kept"; else openssl rand -hex 32 | tr -d '\n' | gh secret set "$k" -R "$repo"; echo "  generated $k"; fi
done
if has BACKUP_PASSPHRASE; then echo "  BACKUP_PASSPHRASE already set, kept"; else
  pass=$(openssl rand -base64 30 | tr -d '\n/+=' | cut -c1-32)
  printf '%s' "$pass" | gh secret set BACKUP_PASSPHRASE -R "$repo"
  echo
  echo "  Backup passphrase (save it in your password manager now; GitHub can't show it again,"
  echo "  and you need it to restore a backup):"
  echo
  echo "      $pass"
fi
echo
echo "Done. Push to main (or re-run the deploy workflow) to deploy."
