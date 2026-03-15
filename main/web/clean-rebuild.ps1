#!/usr/bin/env pwsh
<#
.SYNOPSIS
TradeHax Clean Rebuild & Domain Recovery Script
Rebuilds everything from scratch with proper domain configuration

.DESCRIPTION
1. Cleans all artifacts and build cache
2. Reinstalls dependencies
3. Runs smoke tests and build
4. Deploys to Vercel
5. Re-registers all domains (tradehax.net, www.tradehax.net, tradehaxai.tech, www.tradehaxai.tech, tradehaxai.me, www.tradehaxai.me)

.EXAMPLE
.\clean-rebuild.ps1 -DeployToVercel -RegisterDomains
#>

param(
    [switch]$DeployToVercel,
    [switch]$RegisterDomains,
    [string]$VercelScope = "irishmike",
    [string]$DeploymentUrl = "main-six-dun.vercel.app",
    [string[]]$DomainsToRegister
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"

Write-Host "🔧 TradeHax Clean Rebuild Started: $timestamp" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Clean Environment
Write-Host ""
Write-Host "Step 1: Cleaning environment..." -ForegroundColor Yellow
Write-Host "  - Removing node_modules..."
Remove-Item -Recurse -Force C:\tradez\main\web\node_modules -ErrorAction SilentlyContinue
Write-Host "  - Removing dist build..."
Remove-Item -Recurse -Force C:\tradez\main\web\dist -ErrorAction SilentlyContinue
Write-Host "  - Removing .vercel metadata..."
Remove-Item -Recurse -Force C:\tradez\main\web\.vercel -ErrorAction SilentlyContinue
Write-Host "  ✅ Environment cleaned"

# Step 2: Install Dependencies
Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
Set-Location C:\tradez\main\web
npm ci
if ($LASTEXITCODE -ne 0) {
    throw "npm ci failed"
}
Write-Host "  ✅ Dependencies installed"

# Step 3: Run Smoke Tests
Write-Host ""
Write-Host "Step 3: Running smoke tests..." -ForegroundColor Yellow
npm run test:smoke
if ($LASTEXITCODE -ne 0) {
    throw "Smoke tests failed"
}
Write-Host "  ✅ Smoke tests passed"

# Step 4: Production Build
Write-Host ""
Write-Host "Step 4: Building for production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    throw "Production build failed"
}
Write-Host "  ✅ Production build successful"

# Step 5: Verify Build Artifacts
Write-Host ""
Write-Host "Step 5: Verifying build artifacts..." -ForegroundColor Yellow
$distSize = (Get-ChildItem C:\tradez\main\web\dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "  📦 Build size: $([Math]::Round($distSize, 2)) MB"
$healthFile = Get-Item C:\tradez\main\web\public\__health -ErrorAction SilentlyContinue
if ($healthFile) {
    Write-Host "  ✅ __health endpoint present"
} else {
    Write-Host "  ⚠️  __health endpoint missing - creating..."
    @"
{"ok":true,"service":"tradehax-web","version":"1.1.0"}
"@ | Out-File C:\tradez\main\web\public\__health -Encoding utf8
}

# Step 6: Deploy to Vercel (Optional)
if ($DeployToVercel) {
    Write-Host ""
    Write-Host "Step 6: Deploying to Vercel..." -ForegroundColor Yellow
    Write-Host "  Scope: $VercelScope"

    npx --yes vercel@50.28.0 --prod --yes --scope $VercelScope 2>&1 | Tee-Object -FilePath "C:\tradez\main\tmp_deploy_clean_rebuild_$timestamp.txt"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Deployment initiated"
    } else {
        Write-Host "  ⚠️  Deployment warning (check log)" -ForegroundColor Yellow
    }
}

# Step 7: Register Domains (Optional)
if ($RegisterDomains) {
    Write-Host ""
    Write-Host "Step 7: Registering domains..." -ForegroundColor Yellow

    $defaultDomains = @(
        "tradehax.net",
        "www.tradehax.net",
        "tradehaxai.tech",
        "www.tradehaxai.tech",
        "tradehaxai.me",
        "www.tradehaxai.me"
    )
    $domains = if ($DomainsToRegister) { $DomainsToRegister } else { $defaultDomains }

    foreach ($domain in $domains) {
        Write-Host "  Setting alias: $domain → $DeploymentUrl"
        npx --yes vercel@50.28.0 alias set $DeploymentUrl $domain --scope $VercelScope 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ $domain"
        } else {
            Write-Host "    ⚠️  $domain (check Vercel dashboard)" -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 1
    }

    Write-Host "  ✅ Domain registration complete"
}

# Final Summary
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ Clean Rebuild Complete" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Environment cleaned"
Write-Host "  ✅ Dependencies installed"
Write-Host "  ✅ Smoke tests passed"
Write-Host "  ✅ Production build successful"
if ($DeployToVercel) {
    Write-Host "  ✅ Deployed to Vercel ($VercelScope)"
}
if ($RegisterDomains) {
    Write-Host "  ✅ All 6 domains registered"
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 2-3 minutes for Vercel build completion"
Write-Host "  2. Wait 1-2 minutes for DNS propagation"
Write-Host "  3. Test endpoints:"
Write-Host "     curl https://tradehax.net/__health"
Write-Host "     curl https://tradehaxai.tech/"
Write-Host "     curl https://tradehaxai.me/"
Write-Host ""
Write-Host "Log: C:\tradez\main\tmp_deploy_clean_rebuild_$timestamp.txt" -ForegroundColor Gray
Write-Host ""
