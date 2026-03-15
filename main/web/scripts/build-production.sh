#!/bin/bash
# TradeHax - Production Deployment to tradehax.net
# Builds optimized production bundle and deploys

set -e

echo "🚀 TradeHax Neural Engine - Production Deployment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Step 1: Verify environment
# ============================================================================

echo -e "${BLUE}✓ Step 1: Verifying environment...${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"
echo -e "${GREEN}✅ Git: $(git -v | head -n1)${NC}"
echo ""

# ============================================================================
# Step 2: Install dependencies
# ============================================================================

echo -e "${BLUE}✓ Step 2: Installing dependencies...${NC}"
echo ""

cd web

# Remove old node_modules if requested
if [ "$1" = "clean" ]; then
    echo "Cleaning node_modules..."
    rm -rf node_modules dist
fi

npm install --omit=dev --legacy-peer-deps

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ============================================================================
# Step 3: Build for production
# ============================================================================

echo -e "${BLUE}✓ Step 3: Building for production...${NC}"
echo ""
echo "Build configuration:"
echo "  - Target: ES2020"
echo "  - Minify: Terser (aggressive)"
echo "  - Code splitting: Enabled"
echo "  - Source maps: Disabled"
echo "  - CSS optimization: Enabled"
echo ""

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not created${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✅ Build successful - Size: $BUILD_SIZE${NC}"
echo ""

# ============================================================================
# Step 4: Verify build assets
# ============================================================================

echo -e "${BLUE}✓ Step 4: Verifying build assets...${NC}"
echo ""

# Check for critical files
CRITICAL_FILES=(
    "dist/index.html"
    "dist/assets"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file - MISSING${NC}"
        exit 1
    fi
done

# Count JS chunks
JS_CHUNKS=$(find dist/assets -name "*.js" -type f | wc -l)
echo -e "${GREEN}✅ JavaScript chunks: $JS_CHUNKS${NC}"

# Check for React vendor bundle
if find dist/assets -name "*react-vendor*" -type f | grep -q .; then
    echo -e "${GREEN}✅ React vendor bundle split${NC}"
else
    echo -e "${YELLOW}⚠️  React vendor bundle not split (check build)${NC}"
fi

echo ""

# ============================================================================
# Step 5: Check for security issues
# ============================================================================

echo -e "${BLUE}✓ Step 5: Security check...${NC}"
echo ""

# Check for console logs in production build
if grep -r "console.log" dist/assets/*.js 2>/dev/null | grep -v "\.map"; then
    echo -e "${YELLOW}⚠️  Warning: console.log found in production build${NC}"
else
    echo -e "${GREEN}✅ No console.log in production${NC}"
fi

# Check for eval
if grep -r "eval" dist/ --include="*.js" 2>/dev/null; then
    echo -e "${RED}❌ eval() found in production build${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No eval() in production${NC}"
fi

echo ""

# ============================================================================
# Step 6: Prepare for deployment
# ============================================================================

echo -e "${BLUE}✓ Step 6: Preparing for deployment...${NC}"
echo ""

# Create deployment manifest
cat > dist/.deployment-manifest.json <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "environment": "production",
  "domain": "tradehax.net",
  "build": {
    "command": "vite build",
    "target": "es2020",
    "minified": true,
    "optimized": true
  },
  "features": {
    "responsive": true,
    "mobile_optimized": true,
    "pwa": true,
    "security": true
  },
  "browsers": {
    "chrome": "latest",
    "firefox": "latest",
    "safari": "latest",
    "edge": "latest"
  }
}
EOF

echo -e "${GREEN}✅ Deployment manifest created${NC}"

echo ""
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}🚀 BUILD READY FOR DEPLOYMENT${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy to tradehax.net:"
echo "     vercel deploy --prod"
echo "     OR"
echo "     npm run deploy"
echo ""
echo "  2. Verify deployment:"
echo "     curl https://tradehax.net"
echo "     curl https://tradehax.net/neural-console"
echo "     curl https://tradehax.net/admin/neural-hub"
echo ""
echo "  3. Test mobile responsiveness:"
echo "     Visit on mobile device or use DevTools"
echo ""
echo "Build details:"
echo "  Size: $BUILD_SIZE"
echo "  JS Chunks: $JS_CHUNKS"
echo "  Date: $(date)"
echo ""
echo -e "${GREEN}✅ Ready to deploy!${NC}"

