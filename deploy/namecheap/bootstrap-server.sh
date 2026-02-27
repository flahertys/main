#!/usr/bin/env bash
set -euo pipefail

# Run as root on a fresh Ubuntu VPS.
# This script installs Node.js, PM2, Nginx, and prepares the app directories.

APP_USER="${APP_USER:-tradehax}"
APP_GROUP="${APP_GROUP:-$APP_USER}"
APP_ROOT="${APP_ROOT:-/var/www/tradehax}"
NODE_MAJOR="${NODE_MAJOR:-20}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: bootstrap-server.sh must be run as root." >&2
  exit 1
fi

echo "==> Installing base packages"
apt-get update -y
apt-get install -y curl ca-certificates gnupg lsb-release nginx git rsync ufw

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "^v${NODE_MAJOR}"; then
  echo "==> Installing Node.js ${NODE_MAJOR}.x"
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

echo "==> Installing PM2"
npm install -g pm2

if ! id -u "$APP_USER" >/dev/null 2>&1; then
  echo "==> Creating app user: $APP_USER"
  useradd --system --create-home --shell /bin/bash "$APP_USER"
fi

mkdir -p "$APP_ROOT"/releases "$APP_ROOT"/shared "$APP_ROOT"/logs
chown -R "$APP_USER":"$APP_GROUP" "$APP_ROOT"
chmod -R 775 "$APP_ROOT"

if [[ ! -f "$APP_ROOT/shared/.env.production" ]]; then
  cat > "$APP_ROOT/shared/.env.production" <<'ENVFILE'
# Copy values from deploy/namecheap/env.production.example
NEXT_PUBLIC_SITE_URL=https://tradehax.net
NODE_ENV=production
PORT=3000
TRADEHAX_CRON_SECRET=replace_me_with_a_long_random_secret
ENVFILE
  chown "$APP_USER":"$APP_GROUP" "$APP_ROOT/shared/.env.production"
  chmod 640 "$APP_ROOT/shared/.env.production"
fi

echo "==> Enabling Nginx"
systemctl enable nginx
systemctl restart nginx

echo "==> Firewall defaults (optional but recommended)"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true

echo "\nBootstrap complete."
echo "Next:"
echo "1) Configure Nginx using deploy/namecheap/nginx.tradehax.conf"
echo "2) Add SSL with certbot"
echo "3) Configure GitHub Actions secrets and run deployment"
