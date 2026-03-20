#!/usr/bin/env pwsh
# Opens the Vercel deployment-protection settings page so protection can be set to Public.

param(
  [string]$DashboardUrl = "https://vercel.com/digitaldynasty/main/settings/deployment-protection"
)

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  REMOVE VERCEL DEPLOYMENT PROTECTION" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Objective:" -ForegroundColor Yellow
Write-Host "  Make the production site publicly accessible (no login wall)." -ForegroundColor White
Write-Host ""

Write-Host "Opening:" -ForegroundColor Green
Write-Host "  $DashboardUrl" -ForegroundColor White
Start-Process $DashboardUrl
Write-Host ""

Write-Host "Next steps in Vercel:" -ForegroundColor Yellow
Write-Host "  1) Set Deployment Protection to Public/Disabled" -ForegroundColor White
Write-Host "  2) Save changes" -ForegroundColor White
Write-Host "  3) Wait ~30 seconds" -ForegroundColor White
Write-Host ""

Write-Host "Verify from terminal:" -ForegroundColor Yellow
Write-Host "  curl.exe -I https://tradehax.net/" -ForegroundColor Cyan
Write-Host "  Expected: HTTP/1.1 200 OK" -ForegroundColor White
Write-Host ""

