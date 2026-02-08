#!/bin/bash

# DNS Configuration Checker for tradehaxai.tech
# This script checks DNS records and provides actionable feedback

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="tradehaxai.tech"

echo "=================================================="
echo "🌐 DNS Configuration Checker for $DOMAIN"
echo "=================================================="
echo ""
echo "This script checks your DNS configuration for Vercel deployment."
echo ""

# Check if dig is available
if ! command -v dig &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: 'dig' command not found.${NC}"
    echo "  Install with: sudo apt-get install dnsutils (Ubuntu/Debian)"
    echo "  or: brew install bind (macOS)"
    echo ""
    echo "Continuing with limited checks..."
    echo ""
    HAS_DIG=false
else
    HAS_DIG=true
fi

# Function to print status
pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "Checking DNS records..."
echo ""

# Check A record
echo "1. Checking A Record (Apex Domain)..."
if [ "$HAS_DIG" = true ]; then
    A_RECORD=$(dig +short $DOMAIN A | head -1)
    if [ -z "$A_RECORD" ]; then
        fail "No A record found for $DOMAIN"
        echo "   Expected: 76.76.21.21"
    elif [ "$A_RECORD" = "76.76.21.21" ]; then
        pass "A record correct: $DOMAIN → $A_RECORD (Vercel IP)"
    else
        warn "A record found but incorrect: $DOMAIN → $A_RECORD"
        echo "   Expected: 76.76.21.21"
        echo "   Found: $A_RECORD"
    fi
else
    info "Unable to check A record (dig not installed)"
    echo "   Manually verify: $DOMAIN → 76.76.21.21"
fi
echo ""

# Check _vercel TXT record
echo "2. Checking _vercel TXT Record (Domain Verification)..."
if [ "$HAS_DIG" = true ]; then
    TXT_RECORD=$(dig +short _vercel.$DOMAIN TXT | tr -d '"')
    if [ -z "$TXT_RECORD" ]; then
        fail "No TXT record found for _vercel.$DOMAIN"
        echo "   This is REQUIRED for Vercel domain verification!"
        echo "   Expected format: vc-domain-verify=tradehaxai.tech,XXXXXXXXXXXXX"
    elif [[ "$TXT_RECORD" == vc-domain-verify=* ]]; then
        pass "TXT record found with correct format: _vercel.$DOMAIN"
        echo "   Value: $TXT_RECORD"
    elif [ "$TXT_RECORD" = "cname.vercel-dns.com." ]; then
        fail "TXT record has INCORRECT value: $TXT_RECORD"
        echo "   This is a CNAME value, not a verification string!"
        echo "   Expected format: vc-domain-verify=tradehaxai.tech,XXXXXXXXXXXXX"
        echo ""
        echo "   HOW TO FIX:"
        echo "   1. Go to Namecheap → Advanced DNS"
        echo "   2. Delete the _vercel TXT record with value 'cname.vercel-dns.com.'"
        echo "   3. Get verification string from Vercel Dashboard"
        echo "   4. Add new _vercel TXT record with verification string"
    else
        warn "TXT record found but format unclear: $TXT_RECORD"
        echo "   Expected format: vc-domain-verify=tradehaxai.tech,XXXXXXXXXXXXX"
    fi
else
    info "Unable to check TXT record (dig not installed)"
    echo "   Manually verify: _vercel.$DOMAIN → vc-domain-verify=..."
fi
echo ""

# Check WWW CNAME record
echo "3. Checking www CNAME Record (WWW Subdomain)..."
if [ "$HAS_DIG" = true ]; then
    WWW_RECORD=$(dig +short www.$DOMAIN CNAME | head -1)
    if [ -z "$WWW_RECORD" ]; then
        warn "No CNAME record found for www.$DOMAIN"
        echo "   Recommended: www.$DOMAIN → cname.vercel-dns.com."
        echo "   This is optional but recommended for www support"
    elif [[ "$WWW_RECORD" == *"cname.vercel-dns.com"* ]]; then
        pass "CNAME record correct: www.$DOMAIN → $WWW_RECORD"
    else
        warn "CNAME record found but unexpected: www.$DOMAIN → $WWW_RECORD"
        echo "   Expected: cname.vercel-dns.com."
    fi
else
    info "Unable to check CNAME record (dig not installed)"
    echo "   Manually verify: www.$DOMAIN → cname.vercel-dns.com."
fi
echo ""

# DNS Propagation Status
echo "4. DNS Propagation Status..."
if [ "$HAS_DIG" = true ]; then
    info "DNS queries successful - records are propagated to your DNS server"
    echo "   Note: Global propagation can take 24-48 hours"
    echo "   Check global propagation: https://dnschecker.org/?domain=$DOMAIN"
else
    info "Install 'dig' to check propagation status"
fi
echo ""

# Summary
echo "=================================================="
echo "Summary & Next Steps"
echo "=================================================="
echo ""

if [ "$HAS_DIG" = false ]; then
    echo "⚠️  Install 'dig' for full DNS checking capability"
    echo ""
fi

echo "📚 Documentation:"
echo "   • Quick Fix: DNS_QUICK_FIX.md"
echo "   • Detailed Report: DNS_INSPECTION_REPORT.md"
echo "   • Setup Guide: VERCEL_DOMAIN_SETUP.md"
echo ""

echo "🔧 Tools:"
echo "   • DNS Checker: https://dnschecker.org/?domain=$DOMAIN"
echo "   • DNS Checker (TXT): https://dnschecker.org/?domain=_vercel.$DOMAIN&type=TXT"
echo "   • Vercel Dashboard: https://vercel.com/dashboard"
echo ""

echo "⏱️  Expected Timeline:"
echo "   • DNS Changes: 5 minutes (make changes)"
echo "   • DNS Propagation: 15-30 minutes (wait)"
echo "   • Domain Verification: 1-5 minutes (Vercel)"
echo "   • SSL Certificate: 5-15 minutes (automatic)"
echo "   • Total: ~30-60 minutes"
echo ""

echo "✅ Verification Checklist:"
echo "   1. Fix _vercel TXT record (if incorrect)"
echo "   2. Add www CNAME record (if missing)"
echo "   3. Wait for DNS propagation"
echo "   4. Add domain in Vercel Dashboard"
echo "   5. Verify SSL certificate issued"
echo "   6. Test site: https://$DOMAIN"
echo ""

echo "=================================================="
