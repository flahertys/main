#!/bin/bash
# TradeHax - Post-Deployment Verification Script
# Verifies that tradehax.net is live and working correctly

set -e

echo "🔍 TradeHax Neural Engine - Post-Deployment Verification"
echo "=========================================================="
echo ""

DOMAIN="https://tradehax.net"
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Test 1: Main domain accessibility
# ============================================================================

echo -e "${BLUE}Test 1: Checking main domain...${NC}"

if curl -s -o /dev/null -w "%{http_code}" "$DOMAIN" | grep -q "^200"; then
    echo -e "${GREEN}✅ Main domain is accessible (HTTP 200)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Main domain returned error${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# Test 2: Neural Console route
# ============================================================================

echo -e "${BLUE}Test 2: Checking /neural-console route...${NC}"

if curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/neural-console" | grep -q "^200"; then
    echo -e "${GREEN}✅ Neural Console is accessible${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Neural Console route failed${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# Test 3: Admin Dashboard route
# ============================================================================

echo -e "${BLUE}Test 3: Checking /admin/neural-hub route...${NC}"

if curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/admin/neural-hub" | grep -q "^200"; then
    echo -e "${GREEN}✅ Admin Dashboard is accessible${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Admin Dashboard route failed${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# Test 4: Security headers
# ============================================================================

echo -e "${BLUE}Test 4: Verifying security headers...${NC}"

HEADERS=$(curl -s -I "$DOMAIN")

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✅ HSTS header present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ HSTS header missing${NC}"
    ((TESTS_FAILED++))
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options header present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ X-Content-Type-Options header missing${NC}"
    ((TESTS_FAILED++))
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✅ X-Frame-Options header present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ X-Frame-Options header missing${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# ============================================================================
# Test 5: Response size and performance
# ============================================================================

echo -e "${BLUE}Test 5: Checking response size...${NC}"

SIZE=$(curl -s "$DOMAIN" | wc -c)
SIZE_KB=$((SIZE / 1024))

echo -e "${GREEN}✅ Response size: $SIZE_KB KB${NC}"

if [ "$SIZE_KB" -lt 1000 ]; then
    echo -e "${GREEN}✅ Size is optimized (< 1 MB)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Size is larger than expected (> 1 MB)${NC}"
fi

echo ""

# ============================================================================
# Test 6: Asset loading
# ============================================================================

echo -e "${BLUE}Test 6: Checking asset loading...${NC}"

ASSETS=$(curl -s "$DOMAIN" | grep -o 'assets/[^"]*' | wc -l)

if [ "$ASSETS" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $ASSETS optimized assets${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  No assets found (check HTML)${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo "=========================================================="
echo "📊 Verification Results"
echo "=========================================================="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"

if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
else
    echo -e "${GREEN}❌ Failed: 0${NC}"
fi

echo "📈 Total: $TOTAL tests"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}=========================================================="
    echo "🎉 ALL TESTS PASSED - TRADEHAX.NET IS LIVE AND WORKING!"
    echo "=========================================================${NC}"
    echo ""
    echo "Your deployment is complete and ready for production use."
    echo ""
    echo "Key endpoints:"
    echo "  • Main: $DOMAIN"
    echo "  • Console: $DOMAIN/neural-console"
    echo "  • Admin: $DOMAIN/admin/neural-hub"
    echo ""
    exit 0
else
    echo -e "${RED}=========================================================="
    echo "⚠️  SOME TESTS FAILED - REVIEW ABOVE"
    echo "=========================================================${NC}"
    exit 1
fi

