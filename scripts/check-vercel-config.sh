#!/bin/bash

# Vercel Deployment Configuration Checker
# This script verifies that the repository is correctly configured for Vercel deployment

# Note: Not using 'set -e' to allow script to complete all checks

echo "=================================================="
echo "🔍 Vercel Deployment Configuration Checker"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
PASS=0
FAIL=0
WARN=0

# Function to print status
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

info() {
    echo -e "ℹ $1"
}

echo "Checking repository structure..."
echo ""

# Check 1: package.json exists
if [ -f "package.json" ]; then
    pass "package.json exists in repository root"
else
    fail "package.json NOT found in repository root"
fi

# Check 2: vercel.json exists
if [ -f "vercel.json" ]; then
    pass "vercel.json exists"
    
    # Check vercel.json configuration
    if grep -q '"framework": "nextjs"' vercel.json; then
        pass "Framework is set to nextjs in vercel.json"
    else
        fail "Framework is NOT set to nextjs in vercel.json"
    fi
    
    if grep -q '"outputDirectory"' vercel.json; then
        OUTPUT_DIR=$(grep '"outputDirectory"' vercel.json | sed 's/.*: "\([^"]*\)".*/\1/')
        pass "Output directory is set to: $OUTPUT_DIR"
    else
        warn "Output directory not explicitly set in vercel.json"
    fi
else
    warn "vercel.json not found (optional but recommended)"
fi

# Check 3: next.config.ts exists
if [ -f "next.config.ts" ]; then
    pass "next.config.ts exists"
    
    # Check if static export is configured
    if grep -q "output: 'export'" next.config.ts; then
        warn "Static export (output: 'export') is configured"
        info "  This works but doesn't use full Next.js features on Vercel"
        info "  Consider removing 'output: export' for Vercel deployments"
    else
        pass "Next.js config is set for dynamic builds (recommended for Vercel)"
    fi
else
    fail "next.config.ts NOT found"
fi

# Check 4: Current git branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" == "main" ]; then
    pass "Currently on 'main' branch (correct for Vercel deployment)"
elif [ "$CURRENT_BRANCH" == "gh-pages" ]; then
    fail "Currently on 'gh-pages' branch (this branch should NOT be used for Vercel)"
    info "  Switch to 'main' branch: git checkout main"
else
    info "Currently on '$CURRENT_BRANCH' branch"
fi

# Check 5: gh-pages branch exists (it should, for GitHub Pages)
if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
    pass "gh-pages branch exists (for GitHub Pages deployment)"
    
    # Check if gh-pages has package.json (it shouldn't)
    if git ls-tree -r origin/gh-pages --name-only | grep -q "^package.json$"; then
        warn "gh-pages branch contains package.json (unusual)"
    else
        pass "gh-pages branch does NOT contain package.json (correct for static hosting)"
    fi
else
    info "gh-pages branch not found (will be created by GitHub Actions)"
fi

# Check 6: GitHub Actions workflows
echo ""
echo "Checking GitHub Actions workflows..."
echo ""

if [ -f ".github/workflows/vercel-deploy.yml" ]; then
    pass "Vercel deployment workflow exists"
else
    warn "Vercel deployment workflow not found"
fi

if [ -f ".github/workflows/github-pages.yml" ]; then
    pass "GitHub Pages deployment workflow exists"
    
    # Check if it deploys to gh-pages
    if grep -q "publish_branch: gh-pages" .github/workflows/github-pages.yml; then
        pass "GitHub Pages workflow deploys to gh-pages branch (correct)"
    fi
else
    info "GitHub Pages workflow not found (optional)"
fi

# Check 7: Required files for build
echo ""
echo "Checking build dependencies..."
echo ""

if [ -d "app" ] || [ -d "pages" ]; then
    pass "Next.js app structure found (app/ or pages/)"
else
    fail "No app/ or pages/ directory found"
fi

if [ -d "components" ]; then
    pass "components/ directory exists"
fi

if [ -d "public" ]; then
    pass "public/ directory exists"
fi

# Check 8: .gitignore configuration
if [ -f ".gitignore" ]; then
    if grep -q "out" .gitignore && grep -q ".next" .gitignore; then
        pass ".gitignore correctly ignores build directories (out/, .next/)"
    else
        warn ".gitignore may not be ignoring build directories"
    fi
fi

# Summary
echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo -e "${GREEN}✓ Passed:${NC} $PASS"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARN"
echo -e "${RED}✗ Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Repository appears correctly configured for Vercel deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure Vercel project is set to deploy from 'main' branch"
    echo "2. Verify GitHub secrets are configured (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)"
    echo "3. Push to main branch to trigger deployment"
    echo ""
    echo "See VERCEL_BRANCH_FIX.md for detailed instructions."
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "See VERCEL_BRANCH_FIX.md and VERCEL_DEPLOYMENT_TROUBLESHOOTING.md for help."
    exit 1
fi
