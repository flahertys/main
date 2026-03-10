#!/usr/bin/env bash
set -euo pipefail

# This script runs ON THE SERVER after GitHub Actions uploads a release folder.
# It expects release source at $RELEASE_SOURCE and switches current symlink atomically.

APP_ROOT="${APP_ROOT:-${HOME}/tradehax}"
APP_NAME="${APP_NAME:-tradehax}"
APP_PORT="${APP_PORT:-3000}"
HEALTHCHECK_PATH="${HEALTHCHECK_PATH:-/api/health}"
RELEASE_ID="${RELEASE_ID:-manual-$(date +%Y%m%d%H%M%S)}"
RELEASE_SOURCE="${RELEASE_SOURCE:-$APP_ROOT/releases/$RELEASE_ID}"
SHARED_ENV_FILE="${SHARED_ENV_FILE:-$APP_ROOT/shared/.env.production}"
CURRENT_LINK="$APP_ROOT/current"
PREVIOUS_RELEASE=""

ensure_node_toolchain() {
  if command -v npm >/dev/null 2>&1; then
    return 0
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    source "$NVM_DIR/nvm.sh"
  fi

  if ! command -v npm >/dev/null 2>&1; then
    if ! command -v curl >/dev/null 2>&1; then
      echo "ERROR: npm is missing and curl is unavailable to bootstrap Node." >&2
      exit 1
    fi

    echo "==> Bootstrapping Node.js via nvm (npm missing)"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    # shellcheck disable=SC1090
    source "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm is still unavailable after Node bootstrap." >&2
    exit 1
  fi
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi

  echo "==> Installing PM2 (missing on server)"
  npm install -g pm2

  if ! command -v pm2 >/dev/null 2>&1; then
    echo "ERROR: PM2 installation failed." >&2
    exit 1
  fi
}

if [[ ! -d "$RELEASE_SOURCE" ]]; then
  echo "ERROR: Release source does not exist: $RELEASE_SOURCE" >&2
  exit 1
fi

if [[ ! -f "$SHARED_ENV_FILE" ]]; then
  echo "WARN: Missing shared env file: $SHARED_ENV_FILE"
  echo "==> Bootstrapping shared env file"
  mkdir -p "$(dirname "$SHARED_ENV_FILE")"

  if [[ -f "$RELEASE_SOURCE/.env.production" ]]; then
    cp "$RELEASE_SOURCE/.env.production" "$SHARED_ENV_FILE"
  elif [[ -f "$RELEASE_SOURCE/.env" ]]; then
    cp "$RELEASE_SOURCE/.env" "$SHARED_ENV_FILE"
  else
    cat > "$SHARED_ENV_FILE" <<EOF
NODE_ENV=production
PORT=$APP_PORT
NEXT_PUBLIC_SITE_URL=https://tradehax.net
EOF
  fi

  chmod 600 "$SHARED_ENV_FILE" || true
fi

cd "$RELEASE_SOURCE"
ln -sfn "$SHARED_ENV_FILE" .env.production

ensure_node_toolchain
ensure_pm2

if [[ -L "$CURRENT_LINK" ]] || [[ -d "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK" || true)"
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building Next.js app"
npm run build

echo "==> Switching current symlink"
ln -sfn "$RELEASE_SOURCE" "$CURRENT_LINK"

echo "==> Starting or reloading PM2 app"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" --cwd "$CURRENT_LINK" -- start -- -p "$APP_PORT"
fi

pm2 save

echo "==> Health check"
for i in {1..20}; do
  if curl -fsS "http://127.0.0.1:${APP_PORT}${HEALTHCHECK_PATH}" | grep -q '"status":"ok"'; then
    echo "Health check passed."
    exit 0
  fi
  sleep 2
done

echo "ERROR: Health check failed after restart." >&2

if [[ -n "$PREVIOUS_RELEASE" && -d "$PREVIOUS_RELEASE" ]]; then
  echo "==> Rolling back to previous release: $PREVIOUS_RELEASE"
  ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
    pm2 save
  fi
fi

exit 1
