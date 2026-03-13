#!/usr/bin/env bash
set -euo pipefail

# Namecheap DNS helper for tradehax.net -> Vercel
# - Default mode prints copy/paste records for Namecheap Advanced DNS UI
# - Optional API mode sets the same records via Namecheap XML API
# - Verify mode checks current DNS resolution

DOMAIN="${DOMAIN:-tradehax.net}"
TARGET="${TARGET:-cname.vercel-dns.com}"
TTL="${TTL:-Automatic}"

usage() {
  cat <<'EOF'
Usage:
  ./namecheap-dns-copypasta.sh print
  ./namecheap-dns-copypasta.sh verify
  ./namecheap-dns-copypasta.sh api

Commands:
  print   Print exact DNS records to paste in Namecheap Advanced DNS
  verify  Check whether DNS currently points to Vercel target
  api     Update DNS through Namecheap API (requires env vars)

Environment variables:
  DOMAIN                 Default: tradehax.net
  TARGET                 Default: cname.vercel-dns.com
  TTL                    Default: Automatic

  # Required only for API mode:
  NAMECHEAP_API_USER
  NAMECHEAP_API_KEY
  NAMECHEAP_USERNAME
  NAMECHEAP_CLIENT_IP

Notes:
- For root/apex (@) CNAME support, use Namecheap ALIAS/ANAME flattening behavior in UI.
- If API mode fails with "IP not whitelisted", add NAMECHEAP_CLIENT_IP in Namecheap API access.
EOF
}

print_records() {
  cat <<EOF
Namecheap Advanced DNS - copy/paste these values

Delete existing records for host '@' and 'www' first.

Record 1
  Type : CNAME
  Host : @
  Value: ${TARGET}
  TTL  : ${TTL}

Record 2
  Type : CNAME
  Host : www
  Value: ${TARGET}
  TTL  : ${TTL}

After saving, run:
  $(basename "$0") verify
EOF
}

verify_dns() {
  local out=""
  if command -v dig >/dev/null 2>&1; then
    out="$(dig +short "${DOMAIN}" CNAME || true)"
    if [[ -z "$out" ]]; then
      out="$(dig +short "${DOMAIN}" A || true)"
    fi
  elif command -v nslookup >/dev/null 2>&1; then
    out="$(nslookup "${DOMAIN}" 2>/dev/null || true)"
  else
    echo "No DNS tool found (dig/nslookup)."
    exit 1
  fi

  echo "DNS lookup for ${DOMAIN}:"
  echo "$out"
  echo
  if echo "$out" | grep -qi "${TARGET}"; then
    echo "OK: ${DOMAIN} appears to point to ${TARGET}."
  else
    echo "WARN: ${DOMAIN} does not appear to point to ${TARGET} yet."
    echo "Propagation may take a few minutes."
  fi
}

require_api_env() {
  local missing=0
  for v in NAMECHEAP_API_USER NAMECHEAP_API_KEY NAMECHEAP_USERNAME NAMECHEAP_CLIENT_IP; do
    if [[ -z "${!v:-}" ]]; then
      echo "Missing required env var: $v"
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

api_set_hosts() {
  require_api_env

  local sld tld
  sld="${DOMAIN%.*}"
  tld="${DOMAIN##*.}"

  local endpoint="https://api.namecheap.com/xml.response"
  local url
  url="${endpoint}?ApiUser=${NAMECHEAP_API_USER}&ApiKey=${NAMECHEAP_API_KEY}&UserName=${NAMECHEAP_USERNAME}&ClientIp=${NAMECHEAP_CLIENT_IP}&Command=namecheap.domains.dns.setHosts&SLD=${sld}&TLD=${tld}&HostName1=@&RecordType1=CNAME&Address1=${TARGET}&TTL1=60&HostName2=www&RecordType2=CNAME&Address2=${TARGET}&TTL2=60"

  echo "Calling Namecheap API to set hosts for ${DOMAIN}..."
  local resp
  resp="$(curl -fsSL "$url")"

  if echo "$resp" | grep -q 'Status="OK"'; then
    echo "OK: DNS records submitted via Namecheap API."
    echo "Run verify in 1-5 minutes:"
    echo "  $(basename "$0") verify"
  else
    echo "ERROR: API call did not return OK."
    echo "$resp"
    exit 1
  fi
}

main() {
  local cmd="${1:-print}"
  case "$cmd" in
    print) print_records ;;
    verify) verify_dns ;;
    api) api_set_hosts ;;
    -h|--help|help) usage ;;
    *)
      echo "Unknown command: $cmd"
      usage
      exit 1
      ;;
  esac
}

main "$@"

