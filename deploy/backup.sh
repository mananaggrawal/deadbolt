#!/usr/bin/env bash
# Nightly: dump both databases, encrypt them, and copy them to Cloudflare R2.
# Keeps 30 days of daily copies and 12 months of monthly ones. Skips if R2 isn't set up.
# Restore: see DEPLOY.md ("Restoring a backup").
set -euo pipefail
cd /opt/mystery-rooms
get() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed 's/\$\$/$/g'; }   # .env escapes $ as $$

BUCKET=$(get R2_BUCKET)
if [ -z "$BUCKET" ]; then echo "$(date -u +%FT%TZ) R2 not configured, no backup made"; exit 0; fi
export BACKUP_PASSPHRASE=$(get BACKUP_PASSPHRASE)
[ -n "$BACKUP_PASSPHRASE" ] || { echo "BACKUP_PASSPHRASE is empty"; exit 1; }
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_ACL=private
export RCLONE_CONFIG_R2_ACCESS_KEY_ID=$(get R2_ACCESS_KEY_ID) RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=$(get R2_SECRET_ACCESS_KEY)
export RCLONE_CONFIG_R2_ENDPOINT="https://$(get R2_ACCOUNT_ID).r2.cloudflarestorage.com"

stamp=$(date -u +%Y-%m-%dT%H%M)
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
for db in mysteryrooms umami; do
  docker compose exec -T db pg_dump -U mr -d "$db" --format=custom \
    | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE > "$work/$db-$stamp.dump.enc"
done
rclone copy "$work" "r2:$BUCKET/daily/"
[ "$(date -u +%d)" = "01" ] && rclone copy "$work" "r2:$BUCKET/monthly/"
rclone delete "r2:$BUCKET/daily/" --min-age 31d
rclone delete "r2:$BUCKET/monthly/" --min-age 370d
echo "$(date -u +%FT%TZ) backed up: $(ls "$work" | tr '\n' ' ')"
