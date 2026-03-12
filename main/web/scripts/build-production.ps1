# TradeHax - Production Deployment to tradehax.net (Windows)
# Builds optimized production bundle and deploys

Write-Host "🚀 TradeHax Neural Engine - Production Deployment" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 1: Verify environment
# ============================================================================

Write-Host "✓ Step 1: Verifying environment..." -ForegroundColor Cyan
Write-Host ""

$nodeVersion = node -v
$npmVersion = npm -v
$gitVersion = git --version

if ($?) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Required tools not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 2: Install dependencies
# ============================================================================

Write-Host "✓ Step 2: Installing dependencies..." -ForegroundColor Cyan
Write-Host ""

cd web

# Clean if requested
if ($args[0] -eq "clean") {
    Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
}

npm install --omit=dev --legacy-peer-deps

if ($?) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 3: Build for production
# ============================================================================

Write-Host "✓ Step 3: Building for production..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Build configuration:"
Write-Host "  - Target: ES2020"
Write-Host "  - Minify: Terser (aggressive)"
Write-Host "  - Code splitting: Enabled"
Write-Host "  - Source maps: Disabled"
Write-Host "  - CSS optimization: Enabled"
Write-Host ""

npm run build

if (!(Test-Path dist)) {
    Write-Host "❌ Build failed - dist directory not created" -ForegroundColor Red
    exit 1
}

$buildSize = (Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "✅ Build successful - Size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 4: Verify build assets
# ============================================================================

Write-Host "✓ Step 4: Verifying build assets..." -ForegroundColor Cyan
Write-Host ""

# Check for critical files
$criticalFiles = @("dist/index.html", "dist/assets")

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - MISSING" -ForegroundColor Red
        exit 1
    }
}

# Count JS chunks
$jsChunks = (Get-ChildItem -Path "dist/assets" -Filter "*.js" -Recurse -ErrorAction SilentlyContinue).Count
Write-Host "✅ JavaScript chunks: $jsChunks" -ForegroundColor Green

# Check for React vendor bundle
$reactBundle = Get-ChildItem -Path "dist/assets" -Filter "*react-vendor*" -ErrorAction SilentlyContinue
if ($reactBundle) {
    Write-Host "✅ React vendor bundle split" -ForegroundColor Green
} else {
    Write-Host "⚠️  React vendor bundle not split (check build)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# Step 5: Security check
# ============================================================================

Write-Host "✓ Step 5: Security check..." -ForegroundColor Cyan
Write-Host ""

# Check for console logs
$consoleLogs = Get-ChildItem -Path "dist/assets" -Filter "*.js" -Recurse | Select-String "console.log" -ErrorAction SilentlyContinue

if ($consoleLogs) {
    Write-Host "⚠️  Warning: console.log found in production build" -ForegroundColor Yellow
} else {
    Write-Host "✅ No console.log in production" -ForegroundColor Green
}

# Check for eval
$evalCheck = Get-ChildItem -Path "dist" -Filter "*.js" -Recurse | Select-String "eval\(" -ErrorAction SilentlyContinue

if ($evalCheck) {
    Write-Host "❌ eval() found in production build" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No eval() in production" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# Step 6: Prepare for deployment
# ============================================================================

Write-Host "✓ Step 6: Preparing for deployment..." -ForegroundColor Cyan
Write-Host ""

# Create deployment manifest
$manifest = @{
    timestamp = (Get-Date -AsUTC).ToString("o")
    version = "1.0.0"
    environment = "production"
    domain = "tradehax.net"
    build = @{
        command = "vite build"
        target = "es2020"
        minified = $true
        optimized = $true
    }
    features = @{
        responsive = $true
        mobile_optimized = $true
        pwa = $true
        security = $true
    }
    browsers = @{
        chrome = "latest"
        firefox = "latest"
        safari = "latest"
        edge = "latest"
    }
}

$manifest | ConvertTo-Json | Out-File "dist/.deployment-manifest.json" -Encoding UTF8

Write-Host "✅ Deployment manifest created" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Final summary
# ============================================================================

Write-Host "=================================================" -ForegroundColor Yellow
Write-Host "🚀 BUILD READY FOR DEPLOYMENT" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy to tradehax.net:" -ForegroundColor White
Write-Host "     vercel deploy --prod" -ForegroundColor Magenta
Write-Host "     OR" -ForegroundColor White
Write-Host "     npm run deploy" -ForegroundColor Magenta
Write-Host ""

Write-Host "  2. Verify deployment:" -ForegroundColor White
Write-Host "     curl https://tradehax.net" -ForegroundColor Magenta
Write-Host "     curl https://tradehax.net/neural-console" -ForegroundColor Magenta
Write-Host "     curl https://tradehax.net/admin/neural-hub" -ForegroundColor Magenta
Write-Host ""

Write-Host "  3. Test mobile responsiveness:" -ForegroundColor White
Write-Host "     Visit on mobile device or use DevTools" -ForegroundColor Magenta
Write-Host ""

Write-Host "Build details:" -ForegroundColor Cyan
Write-Host "  Size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor White
Write-Host "  JS Chunks: $jsChunks" -ForegroundColor White
Write-Host "  Date: $(Get-Date)" -ForegroundColor White
Write-Host ""

Write-Host "✅ Ready to deploy!" -ForegroundColor Green

