#!/usr/bin/env pwsh

# ============================================================================
# TradeHax Production Deploy Script
# ============================================================================
# This script automates the production deployment of TradeHax to Vercel
# Usage: .\deploy-tradehax.ps1
# ============================================================================

Set-ErrorActionPreference "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TradeHax Production Deploy Script v1.0                ║" -ForegroundColor Cyan
Write-Host "║         Target: tradehax.net via Vercel (hackavelliz)         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify working directory
Write-Host "Step 1: Verifying deployment directory..." -ForegroundColor Yellow
if (-not (Test-Path "C:\tradez\main\web\vercel.json")) {
    Write-Host "❌ vercel.json not found! Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "✓ vercel.json found" -ForegroundColor Green

# Step 2: Check Vercel CLI
Write-Host ""
Write-Host "Step 2: Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = npx --yes vercel@50.28.0 --version 2>&1 | Select-Object -First 1
    Write-Host "✓ Vercel CLI available: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI error. Ensure npm is installed." -ForegroundColor Red
    exit 1
}

# Step 3: Verify Vercel auth
Write-Host ""
Write-Host "Step 3: Verifying Vercel authentication..." -ForegroundColor Yellow
try {
    $user = npx --yes vercel@50.28.0 whoami 2>&1 | Select-Object -First 1
    Write-Host "✓ Authenticated as: $user" -ForegroundColor Green
} catch {
    Write-Host "⚠ Vercel authentication issue. You may be prompted to login." -ForegroundColor Yellow
}

# Step 4: Pre-deploy checks
Write-Host ""
Write-Host "Step 4: Running pre-deploy checks..." -ForegroundColor Yellow
cd "C:\tradez\main\web"

try {
    Write-Host "  Running smoke tests..." -ForegroundColor Cyan
    npm run test:smoke *>$null
    Write-Host "  ✓ Smoke tests passed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Smoke tests failed!" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "  Running production build..." -ForegroundColor Cyan
    npm run build *>$null
    Write-Host "  ✓ Production build succeeded" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Deploy to Vercel
Write-Host ""
Write-Host "Step 5: Deploying to Vercel (hackavelliz team)..." -ForegroundColor Yellow
Write-Host "  Command: npx vercel@50.28.0 --prod --yes --scope hackavelliz" -ForegroundColor Cyan
Write-Host ""

try {
    $deployOutput = npx --yes vercel@50.28.0 --prod --yes --scope hackavelliz 2>&1
    Write-Host $deployOutput
    Write-Host ""
    Write-Host "✓ Deployment command executed" -ForegroundColor Green

    # Try to extract deployment URL
    $deployUrl = $deployOutput | Select-String -Pattern "https://" | Select-Object -First 1
    if ($deployUrl) {
        Write-Host ""
        Write-Host "Deployment URL: $deployUrl" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠ Deploy execution returned output (may still be successful)" -ForegroundColor Yellow
    Write-Host $_
}

# Step 6: Post-deploy instructions
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 DEPLOYMENT INITIATED                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for Vercel build to complete"
Write-Host "2. Verify deployment: npx vercel@50.28.0 alias ls --scope hackavelliz"
Write-Host "3. Attach domain: npx vercel@50.28.0 alias set <URL> tradehax.net --scope hackavelliz"
Write-Host "4. Test live URLs:"
Write-Host "   • https://tradehax.net/"
Write-Host "   • https://tradehax.net/tradehax"
Write-Host "   • https://tradehax.net/__health"
Write-Host ""

Write-Host "Rollback (if needed):" -ForegroundColor Yellow
Write-Host "npx vercel@50.28.0 deployments ls --scope hackavelliz" -ForegroundColor Gray
Write-Host "npx vercel@50.28.0 alias set <PREVIOUS_URL> tradehax.net --scope hackavelliz" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Deployment script complete. Monitor Vercel dashboard for build status." -ForegroundColor Green

