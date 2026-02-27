#!/usr/bin/env bash
set -euo pipefail

# Installs cron entries to replace Vercel cron schedules.
# Usage:
#   BASE_URL=https://tradehax.net TRADEHAX_CRON_SECRET=... ./deploy/namecheap/setup-cron.sh

BASE_URL="${BASE_URL:-https://tradehax.net}"
TRADEHAX_CRON_SECRET="${TRADEHAX_CRON_SECRET:-}"
LOG_FILE="${LOG_FILE:-/var/log/tradehax-cron.log}"

if [[ -z "$TRADEHAX_CRON_SECRET" ]]; then
  echo "ERROR: TRADEHAX_CRON_SECRET is required." >&2
  exit 1
fi

TMP_CRON=$(mktemp)
crontab -l 2>/dev/null | sed '/# TRADEHAX_CRON_BEGIN/,/# TRADEHAX_CRON_END/d' > "$TMP_CRON" || true

cat >> "$TMP_CRON" <<EOF
# TRADEHAX_CRON_BEGIN
0 6 * * * curl -fsS -H "Authorization: Bearer $TRADEHAX_CRON_SECRET" "$BASE_URL/api/cron/ai/export-dataset" >> "$LOG_FILE" 2>&1
0 */6 * * * curl -fsS -H "Authorization: Bearer $TRADEHAX_CRON_SECRET" "$BASE_URL/api/cron/ai/retrieval-snapshot" >> "$LOG_FILE" 2>&1
*/30 * * * * curl -fsS -H "Authorization: Bearer $TRADEHAX_CRON_SECRET" "$BASE_URL/api/cron/investor-academy/replay-cleanup" >> "$LOG_FILE" 2>&1
*/15 12-21 * * 1-5 curl -fsS -H "Authorization: Bearer $TRADEHAX_CRON_SECRET" "$BASE_URL/api/cron/trading/signal-cadence" >> "$LOG_FILE" 2>&1
# TRADEHAX_CRON_END
EOF

crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "Cron entries installed for $BASE_URL"
