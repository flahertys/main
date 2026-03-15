#!/usr/bin/env pwsh
# ============================================================================
# Disable Vercel Deployment Protection
# ============================================================================
# This script opens the Vercel dashboard to disable password protection
# so customers can access the site freely without any authentication barriers
# ============================================================================

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔓 REMOVE VERCEL DEPLOYMENT PROTECTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📋 OBJECTIVE:" -ForegroundColor Yellow
Write-Host "   Remove the SSL/login barrier so customers can access" -ForegroundColor White
Write-Host "   tradehax.net freely without any authentication`n" -ForegroundColor White

Write-Host "⚠️  CURRENT ISSUE:" -ForegroundColor Red
Write-Host "   Vercel Deployment Protection is enabled" -ForegroundColor White
Write-Host "   Customers see a login prompt (401 Unauthorized)" -ForegroundColor White
Write-Host "   This must be disabled for free customer access`n" -ForegroundColor White

Write-Host "🔧 SOLUTION:" -ForegroundColor Green
Write-Host "   Opening Vercel Dashboard settings page..." -ForegroundColor White
Write-Host "   You need to manually set protection to 'Public'`n" -ForegroundColor White

# Open Vercel dashboard
$dashboardUrl = "https://vercel.com/hackavelliz/main/settings/deployment-protection"
Start-Process $dashboardUrl

Write-Host "✅ Vercel Dashboard opened in your browser!`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  📝 INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "1. In the browser window that just opened:" -ForegroundColor White
Write-Host "   → Find 'Deployment Protection' section" -ForegroundColor Cyan
Write-Host "   → Change setting to: PUBLIC or DISABLED" -ForegroundColor Green
Write-Host "   → Click SAVE button`n" -ForegroundColor Green

Write-Host "2. Wait 30 seconds for changes to propagate`n" -ForegroundColor White

Write-Host "3. Test customer access:" -ForegroundColor White
Write-Host "   curl.exe -I https://tradehax.net/" -ForegroundColor Cyan
Write-Host "   Should return: HTTP/1.1 200 OK ✅`n" -ForegroundColor Green

Write-Host "4. Open in browser:" -ForegroundColor White
Write-Host "   https://tradehax.net/" -ForegroundColor Cyan
Write-Host "   Should load trading bot immediately (no login prompt)`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  🔐 ADMIN ACCESS (FOR YOU ONLY)" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

Write-Host "Admin portal (operator controls):" -ForegroundColor White
Write-Host "   URL: https://tradehax.net/portal" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor Green
Write-Host "   Password: root`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📄 See REMOVE_AUTHENTICATION_BARRIERS.md for full details" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

