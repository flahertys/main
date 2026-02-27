#!/usr/bin/env bash
set -euo pipefail

# This script runs ON THE SERVER after GitHub Actions uploads a release folder.
# It expects release source at $RELEASE_SOURCE and switches current symlink atomically.

APP_ROOT="${APP_ROOT:-/var/www/tradehax}"
APP_NAME="${APP_NAME:-tradehax}"
APP_PORT="${APP_PORT:-3000}"
RELEASE_ID="${RELEASE_ID:-manual-$(date +%Y%m%d%H%M%S)}"
RELEASE_SOURCE="${RELEASE_SOURCE:-$APP_ROOT/releases/$RELEASE_ID}"
SHARED_ENV_FILE="${SHARED_ENV_FILE:-$APP_ROOT/shared/.env.production}"
CURRENT_LINK="$APP_ROOT/current"

if [[ ! -d "$RELEASE_SOURCE" ]]; then
  echo "ERROR: Release source does not exist: $RELEASE_SOURCE" >&2
  exit 1
fi

if [[ ! -f "$SHARED_ENV_FILE" ]]; then
  echo "ERROR: Missing shared env file: $SHARED_ENV_FILE" >&2
  exit 1
fi

cd "$RELEASE_SOURCE"
ln -sfn "$SHARED_ENV_FILE" .env.production

echo "==> Installing dependencies"
npm ci

echo "==> Building Next.js app"
npm run build

echo "==> Switching current symlink"
ln -sfn "$RELEASE_SOURCE" "$CURRENT_LINK"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: PM2 is not installed." >&2
  exit 1
fi

echo "==> Starting or reloading PM2 app"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" --cwd "$CURRENT_LINK" -- start -- -p "$APP_PORT"
fi

pm2 save

echo "==> Health check"
for i in {1..20}; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null 2>&1; then
    echo "Health check passed."
    exit 0
  fi
  sleep 2
done

echo "ERROR: Health check failed after restart." >&2
exit 1
