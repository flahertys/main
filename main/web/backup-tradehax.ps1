# Backup Script for TradeHax
# Archives source code, environment variables, handshake scripts, endpoint docs, and deployment configs

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "../tradehax-backup-$timestamp"

Write-Host "Creating backup directory: $backupDir"
New-Item -ItemType Directory -Path $backupDir | Out-Null

# 1. Archive source code (excluding node_modules, dist, secrets)
Write-Host "Archiving source code..."
Copy-Item ../* $backupDir -Recurse -Exclude node_modules,dist,secrets,.env.production,.env.local,.env.*.local,.git,.vercel,.DS_Store,Thumbs.db

# 2. Export environment variables
Write-Host "Copying environment files..."
$envFiles = @("../.env.production", "../.env.local", "../.env.example")
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir/env/" -Force
    }
}

# 3. Copy handshake scripts
Write-Host "Copying handshake scripts..."
$scriptFiles = @("../scripts/handshake-check.js", "../scripts/supabase-health.mjs", "../scripts/api-smoke.js")
foreach ($file in $scriptFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir/scripts/" -Force
    }
}

# 4. Archive deployment configs
Write-Host "Copying deployment configs..."
$configFiles = @("../vercel.json", "../package.json")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir/config/" -Force
    }
}

# 5. Export endpoint documentation
Write-Host "Generating endpoint documentation..."
$docPath = "$backupDir/BACKUP_README.md"
$docContent = @"
# TradeHax Backup

## Endpoints
- /api/hf-server: Hugging Face inference
- /api/supabase-health: Supabase health check
- /api/openai: OpenAI integration
- /api/groq: Groq integration
- /api/finnhub: Finnhub integration

## Handshake Scripts
- handshake-check.js: Verifies API connectivity
- supabase-health.mjs: Checks Supabase health
- api-smoke.js: API smoke tests

## Restore Instructions
1. Copy source code to new project directory
2. Restore environment variables from env/
3. Re-add configs from config/
4. Run handshake scripts to verify endpoints
5. Re-deploy to Vercel or new platform

"@
Set-Content -Path $docPath -Value $docContent

Write-Host "Backup complete! Archive located at: $backupDir"
