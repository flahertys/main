#!/usr/bin/env pwsh
# ============================================================================
# TradeHax Quick Launcher
# ============================================================================
# This script sets the Vercel protection bypass cookie and opens TradeHax
# Usage: .\open-tradehax.ps1
# ============================================================================

param(
    [switch]$NoBrowser,
    [switch]$AllDomains
)

$ErrorActionPreference = "Continue"

# Configuration
$bypass = "otWDNt0dMxhdDDdkNEPwodop676ofPP1"
$primaryDomain = "tradehax.net"
$allDomains = @(
    'tradehax.net',
    'www.tradehax.net',
    'tradehaxai.tech',
    'www.tradehaxai.tech',
    'tradehaxai.me',
    'www.tradehaxai.me'
)

# Banner
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 TRADEHAX LAUNCHER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Determine which domains to set cookies for
$domainsToSet = if ($AllDomains) {
    Write-Host "Setting bypass cookies for ALL domains..." -ForegroundColor Yellow
    $allDomains
} else {
    Write-Host "Setting bypass cookie for primary domain..." -ForegroundColor Yellow
    @($primaryDomain)
}

Write-Host ""

# Set cookies
foreach ($domain in $domainsToSet) {
    $url = "https://$domain/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$bypass"
    Write-Host "  ✓ $domain" -ForegroundColor Green

    try {
        # Open in hidden window to set cookie
        Start-Process $url -WindowStyle Hidden -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 300
    } catch {
        Write-Host "    (Will open in browser instead)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Bypass cookie(s) set!" -ForegroundColor Green
Write-Host "   Cookie duration: 7 days" -ForegroundColor Gray
Write-Host ""

# Open browser
if (-not $NoBrowser) {
    Write-Host "🌐 Opening TradeHax in your browser..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1

    $mainUrl = "https://$primaryDomain"
    Start-Process $mainUrl

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  🎉 TRADEHAX IS READY!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "  URL: $mainUrl" -ForegroundColor White
    Write-Host "  The bypass cookie will last for 7 days." -ForegroundColor Gray
    Write-Host "  After that, run this script again." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ Cookies set. Use -NoBrowser to skip opening the browser." -ForegroundColor Green
    Write-Host ""
}

# Show quick reference
if ($AllDomains) {
    Write-Host "📋 All domains are now accessible:" -ForegroundColor Cyan
    foreach ($domain in $allDomains) {
        Write-Host "   • https://$domain" -ForegroundColor White
    }
    Write-Host ""
}

# Show test command
Write-Host "💡 To test programmatically:" -ForegroundColor Cyan
Write-Host "   curl.exe -H ""x-vercel-protection-bypass: $bypass"" https://$primaryDomain/" -ForegroundColor Gray
Write-Host ""

# Show help
Write-Host "📚 Options:" -ForegroundColor Cyan
Write-Host "   -AllDomains    Set cookies for all 6 domains" -ForegroundColor White
Write-Host "   -NoBrowser     Don't open browser automatically" -ForegroundColor White
Write-Host ""
Write-Host "   Examples:" -ForegroundColor Gray
Write-Host "   .\open-tradehax.ps1                    # Open primary domain" -ForegroundColor Gray
Write-Host "   .\open-tradehax.ps1 -AllDomains        # Set cookies for all domains" -ForegroundColor Gray
Write-Host "   .\open-tradehax.ps1 -NoBrowser         # Just set cookies" -ForegroundColor Gray
Write-Host ""

