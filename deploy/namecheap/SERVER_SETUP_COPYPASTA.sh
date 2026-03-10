#!/usr/bin/env bash
# =============================================================================
# TradeHax — Namecheap VPS One-Shot Server Bootstrap
# Run this AS ROOT (or sudo) once to wire up all deploy directories + endpoints
# Copy-paste the whole block into your server shell.
# =============================================================================

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
APP_USER="traddhou"
APP_ROOT="/var/www/tradehax"
APP_PORT="3000"
APP_NAME="tradehax"

# ─── 1. Directory structure ──────────────────────────────────────────────────
mkdir -p "$APP_ROOT"/{releases,shared}
chown -R "$APP_USER":"$APP_USER" "$APP_ROOT"
chmod 755 "$APP_ROOT"
chmod 775 "$APP_ROOT/releases"
chmod 775 "$APP_ROOT/shared"
echo "✅ Directory structure created under $APP_ROOT"

# ─── 2. Shared .env.production ───────────────────────────────────────────────
# Fill in every value you need before running.
# This file is symlinked into each release by deploy-remote.sh.
ENV_FILE="$APP_ROOT/shared/.env.production"

if [[ ! -f "$ENV_FILE" ]]; then
cat > "$ENV_FILE" << 'ENV'
# =========================================================
# TradeHax shared .env.production  — edit values then save
# =========================================================

NODE_ENV=production
PORT=3000

# ── Core Site ────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://tradehax.net

# ── Auth / Security ──────────────────────────────────────
NEXTAUTH_SECRET=REPLACE_ME
NEXTAUTH_URL=https://tradehax.net
JWT_SECRET=REPLACE_ME
TRADEHAX_ADMIN_KEY=REPLACE_ME
AI_SERVER_API_KEY=REPLACE_ME
TRADEHAX_SUPERUSER_CODE=REPLACE_ME
TRADEHAX_CRON_SECRET=REPLACE_ME

# Admin portal login
TRADEHAX_LOGIN_USERNAME=admin
TRADEHAX_LOGIN_PASSWORD_HASH=REPLACE_ME   # npm run auth:hash-password

# ── Supabase ─────────────────────────────────────────────
SUPABASE_URL=REPLACE_ME
SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME

# ── HuggingFace AI ───────────────────────────────────────
HF_API_TOKEN=REPLACE_ME
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct
LLM_TEMPERATURE=0.85
LLM_MAX_LENGTH=768
LLM_TOP_P=0.95
HF_FALLBACK_MODELS=Qwen/Qwen2.5-7B-Instruct,meta-llama/Meta-Llama-3-8B-Instruct,HuggingFaceH4/zephyr-7b-beta

# ── Intelligence / Market Data ───────────────────────────
INTELLIGENCE_DATA_PROVIDER=vendor
INTELLIGENCE_VENDOR_NAME=unusualwhales
UNUSUALWHALES_API_KEY=REPLACE_ME
UNUSUALWHALES_BASE_URL=https://api.unusualwhales.com
POLYGON_API_KEY=REPLACE_ME
POLYGON_BASE_URL=https://api.polygon.io
FINNHUB_API_KEY=REPLACE_ME
TRADEHAX_INTELLIGENCE_CACHE_MS=15000

# ── Live WebSocket overlay ───────────────────────────────
TRADEHAX_INTELLIGENCE_WS_ENABLED=true
TRADEHAX_INTELLIGENCE_WS_URL=REPLACE_ME
TRADEHAX_INTELLIGENCE_WS_RECONNECT_MS=4000

# ── Vector / Embeddings ──────────────────────────────────
TRADEHAX_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
UPSTASH_VECTOR_REST_URL=REPLACE_ME
UPSTASH_VECTOR_REST_TOKEN=REPLACE_ME

# ── Discord / Telegram notifications ─────────────────────
TRADEHAX_DISCORD_WEBHOOK=REPLACE_ME
TRADEHAX_DISCORD_SIGNAL_WEBHOOK=REPLACE_ME
DISCORD_PUBLIC_KEY=REPLACE_ME
DISCORD_APPLICATION_ID=REPLACE_ME
TELEGRAM_BOT_TOKEN=REPLACE_ME
TELEGRAM_CHAT_ID=REPLACE_ME

# ── Canary governance ────────────────────────────────────
TRADEHAX_CANARY_ROLLOUT_PERCENT=15
TRADEHAX_CANARY_MIN_REQUESTS=40
TRADEHAX_CANARY_COOLDOWN_MINUTES=30

# ── AI governors ─────────────────────────────────────────
TRADEHAX_INDIVIDUALIZED_AI_ENABLED=true
TRADEHAX_PERSONALIZED_TRAJECTORY_ENABLED=true
TRADEHAX_COMPLEX_PROBLEM_ENGINE_ENABLED=true
TRADEHAX_ACCURACY_GOVERNOR_ENABLED=true
TRADEHAX_RESPONSE_VERIFIER_ENABLED=true
ENV

  chown "$APP_USER":"$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "✅ Created $ENV_FILE — remember to fill in REPLACE_ME values"
else
  echo "⚠️  $ENV_FILE already exists — skipping (edit manually if needed)"
fi

# ─── 3. PM2 global install (if missing) ──────────────────────────────────────
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
  pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -1 | bash
  echo "✅ PM2 installed and startup registered"
else
  echo "✅ PM2 already present: $(pm2 --version)"
fi

# ─── 4. nginx reverse-proxy snippet (optional but recommended) ───────────────
NGINX_CONF="/etc/nginx/conf.d/tradehax.conf"
if command -v nginx >/dev/null 2>&1 && [[ ! -f "$NGINX_CONF" ]]; then
cat > "$NGINX_CONF" << NGINX
server {
    listen 80;
    server_name tradehax.net www.tradehax.net;

    # Redirect all HTTP → HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tradehax.net www.tradehax.net;

    # Point these at your existing cert paths (Let's Encrypt, cPanel SSL, etc.)
    ssl_certificate     /etc/letsencrypt/live/tradehax.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tradehax.net/privkey.pem;

    # Proxy to Next.js
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket pass-through (live intelligence overlay)
    location /ws {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
    }

    # Health endpoint — no cache
    location /api/health {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        add_header         Cache-Control "no-store";
    }
}
NGINX
  nginx -t && nginx -s reload
  echo "✅ nginx config written to $NGINX_CONF and reloaded"
else
  echo "⚠️  nginx not found or $NGINX_CONF already exists — skipping"
fi

# ─── 5. Final permission check ───────────────────────────────────────────────
echo ""
echo "── Resulting structure ────────────────────────────────"
ls -la "$APP_ROOT"
echo "── Permissions on shared env ──────────────────────────"
ls -la "$ENV_FILE"
echo ""
echo "============================================================"
echo "  Server bootstrap complete."
echo "  Next: fill REPLACE_ME values in $ENV_FILE"
echo "  Then re-trigger GitHub Actions:"
echo "    gh workflow run namecheap-vps-deploy.yml --ref main"
echo "============================================================"
