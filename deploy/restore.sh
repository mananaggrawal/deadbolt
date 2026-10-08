#!/usr/bin/env bash
# Restore the live database from a backup in R2. Run on the server:
#     cd /opt/mystery-rooms && ./restore.sh                       # lists the backups
#     cd /opt/mystery-rooms && ./restore.sh daily/mysteryrooms-2026-10-08T2100.dump.enc
# It asks for the backup passphrase, stops the app, replaces the database and starts the app again.
set -euo pipefail
cd /opt/mystery-rooms
get() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- | sed 's/\$\$/$/g'; }
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID=$(get R2_ACCESS_KEY_ID) RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=$(get R2_SECRET_ACCESS_KEY)
export RCLONE_CONFIG_R2_ENDPOINT="https://$(get R2_ACCOUNT_ID).r2.cloudflarestorage.com"
BUCKET=$(get R2_BUCKET)
if [ $# -eq 0 ]; then rclone ls "r2:$BUCKET" | sort -k2; exit 0; fi

file=$1; name=$(basename "$file"); db=${name%%-*}
case "$db" in mysteryrooms|umami) ;; *) echo "can't tell which database $name is"; exit 1;; esac
read -r -s -p "Backup passphrase: " BACKUP_PASSPHRASE; echo; export BACKUP_PASSPHRASE
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
rclone copyto "r2:$BUCKET/$file" "$work/$name"
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "$work/$name" -out "$work/db.dump"
read -r -p "Replace the '$db' database with $name? Type yes: " ok; [ "$ok" = "yes" ] || exit 1
svc=app; [ "$db" = umami ] && svc=umami
docker compose stop "$svc"
docker compose exec -T db pg_restore -U mr -d "$db" --clean --if-exists --no-owner < "$work/db.dump"
docker compose start "$svc"
echo "Restored $db from $name"
