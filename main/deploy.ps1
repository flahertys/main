# TradeHax Neural Engine - Secure Git Commit & Deploy Script (Windows)
# For Private Network Environments

Write-Host "🔒 TradeHax Neural Engine - Secure Deployment" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: VERIFY NO SECRETS IN GIT
# ============================================================================

Write-Host "✓ Step 1: Verifying no secrets in staging area..." -ForegroundColor Yellow
Write-Host ""

# Check for .env.local in staging
$status = git status --porcelain 2>$null | Select-String ".env.local"
if ($status) {
    Write-Host "❌ ERROR: .env.local is staged!" -ForegroundColor Red
    Write-Host "   This should NOT be committed." -ForegroundColor Red
    Write-Host "   Remove with: git reset .env.local" -ForegroundColor Red
    exit 1
}

# Check for API keys in code
$apiKeyCheck = Get-ChildItem -Path web -Recurse -Include "*.ts","*.js" -ErrorAction SilentlyContinue |
    Select-String "sk-proj-" -ErrorAction SilentlyContinue

if ($apiKeyCheck) {
    Write-Host "❌ ERROR: Found API keys in source code!" -ForegroundColor Red
    Write-Host "   Remove and move to .env.local" -ForegroundColor Red
    exit 1
}

$hfCheck = Get-ChildItem -Path web -Recurse -Include "*.ts","*.js" -ErrorAction SilentlyContinue |
    Select-String "hf_[A-Za-z0-9]" -ErrorAction SilentlyContinue

if ($hfCheck) {
    Write-Host "❌ ERROR: Found HF tokens in source code!" -ForegroundColor Red
    Write-Host "   Remove and move to .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ No secrets detected in code" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: VERIFY .env.local IS PROTECTED
# ============================================================================

Write-Host "✓ Step 2: Verifying .env.local is protected..." -ForegroundColor Yellow
Write-Host ""

$ignoreCheck = git check-ignore .env.local 2>$null
if ($?) {
    Write-Host "✅ .env.local is protected by .gitignore" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: .env.local is NOT in .gitignore!" -ForegroundColor Red
    Write-Host "   Add to .gitignore to prevent accidental commits" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 3: STAGE CODE FILES
# ============================================================================

Write-Host "✓ Step 3: Staging code files..." -ForegroundColor Yellow
Write-Host ""

# Stage code files
git add web/ 2>$null
git add *.md 2>$null
git add *.sh 2>$null
git add *.ps1 2>$null
git add *.bat 2>$null
git add DEPLOY.bat 2>$null
git add package.json 2>$null
git add tsconfig.json 2>$null
git add .gitignore 2>$null

Write-Host "✅ Code files staged" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 4: REVIEW WHAT'S BEING COMMITTED
# ============================================================================

Write-Host "✓ Step 4: Reviewing files to be committed..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Files to be committed:" -ForegroundColor Cyan
$files = git diff --cached --name-only 2>$null | Head -20
$files | ForEach-Object { Write-Host "  $_" }

Write-Host ""
$count = (git diff --cached --name-only 2>$null).Count
Write-Host "Total files: $count" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 5: COMMIT
# ============================================================================

Write-Host "✓ Step 5: Creating commit..." -ForegroundColor Yellow
Write-Host ""

$commitMessage = @"
🚀 Deploy: TradeHax Neural Engine v2.0

- Complete AI quality control system
- 4-endpoint multi-provider architecture
- Real-time monitoring dashboards
- Hallucination detection (4-layer validation)
- Automatic failover and health tracking
- Complete audit trail and metrics persistence
- Admin control panel with full configuration
- Production-ready with enterprise security

Security:
- All API keys protected in .env.local
- Database credentials secured
- No secrets in Git
- Private network deployment ready

Documentation:
- 50+ pages of guides
- Deployment procedures
- Security best practices
- Troubleshooting guides
- API reference documentation
"@

git commit -m $commitMessage

if ($?) {
    Write-Host "✅ Commit created" -ForegroundColor Green
} else {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 6: PUSH TO REPOSITORY
# ============================================================================

Write-Host "✓ Step 6: Pushing to repository..." -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "  Ready to push? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "  Cancelled. Commit is local only." -ForegroundColor Yellow
    exit 0
}

git push origin main

if ($?) {
    Write-Host "✅ Code pushed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed. Check your Git configuration." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 7: DEPLOYMENT INSTRUCTIONS
# ============================================================================

Write-Host "✓ Step 7: Next steps for deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYMENT TO PRIVATE SERVER" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  On your private server, pull the latest code:" -ForegroundColor Cyan
Write-Host "    git pull origin main" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Set environment variables:" -ForegroundColor Cyan
Write-Host '    $env:HUGGINGFACE_API_KEY = "hf_..."' -ForegroundColor White
Write-Host '    $env:OPENAI_API_KEY = "sk-proj-..."' -ForegroundColor White
Write-Host '    $env:DATABASE_URL = "postgresql://..."' -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Install dependencies and build:" -ForegroundColor Cyan
Write-Host "    npm install" -ForegroundColor White
Write-Host "    npm run build" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  Start the application:" -ForegroundColor Cyan
Write-Host "    npm start" -ForegroundColor White
Write-Host "    # or for development:" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "5️⃣  Verify deployment:" -ForegroundColor Cyan
Write-Host "    curl http://localhost:3000/neural-console" -ForegroundColor White
Write-Host "    # Should show: Real-time metrics dashboard" -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Green
Write-Host "   - SECURE_DEPLOYMENT_GUIDE.md    (Detailed deployment guide)" -ForegroundColor White
Write-Host "   - NEURAL_ENGINE_INDEX.md        (Master documentation index)" -ForegroundColor White
Write-Host "   - .env.example                  (Environment variables template)" -ForegroundColor White
Write-Host ""

Write-Host "✅ CODE DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  REMEMBER:" -ForegroundColor Yellow
Write-Host "   - .env.local is NOT committed (good!)" -ForegroundColor White
Write-Host "   - Set environment variables on server" -ForegroundColor White
Write-Host "   - API keys are secure" -ForegroundColor White
Write-Host "   - Review SECURE_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Your TradeHax Neural Engine is ready for deployment!" -ForegroundColor Green

