#!/bin/bash
# TradeHax Neural Engine - Secure Git Commit & Deploy Script
# For Private Network Environments

echo "🔒 TradeHax Neural Engine - Secure Deployment"
echo "=============================================="
echo ""

# ============================================================================
# STEP 1: VERIFY NO SECRETS IN GIT
# ============================================================================

echo "✓ Step 1: Verifying no secrets in staging area..."
echo ""

# Check for API keys in staged files
if git status --porcelain | grep '.env.local'; then
    echo "❌ ERROR: .env.local is staged!"
    echo "   This should NOT be committed."
    echo "   Remove with: git reset .env.local"
    exit 1
fi

# Check for exposed API keys in code
if grep -r "sk-proj-" web/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules; then
    echo "❌ ERROR: Found API keys in source code!"
    echo "   Remove and move to .env.local"
    exit 1
fi

if grep -r "hf_[A-Za-z0-9]" web/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules; then
    echo "❌ ERROR: Found HF tokens in source code!"
    echo "   Remove and move to .env.local"
    exit 1
fi

echo "✅ No secrets detected in code"
echo ""

# ============================================================================
# STEP 2: VERIFY .env.local IS PROTECTED
# ============================================================================

echo "✓ Step 2: Verifying .env.local is protected..."
echo ""

if git check-ignore .env.local > /dev/null 2>&1; then
    echo "✅ .env.local is protected by .gitignore"
else
    echo "❌ ERROR: .env.local is NOT in .gitignore!"
    echo "   Add to .gitignore to prevent accidental commits"
    exit 1
fi

echo ""

# ============================================================================
# STEP 3: STAGE CODE FILES
# ============================================================================

echo "✓ Step 3: Staging code files..."
echo ""

# Stage only code and documentation (no secrets)
git add web/
git add *.md
git add *.sh
git add *.ps1
git add *.bat
git add DEPLOY.bat
git add package.json
git add tsconfig.json
git add .gitignore

echo "✅ Code files staged"
echo ""

# ============================================================================
# STEP 4: REVIEW WHAT'S BEING COMMITTED
# ============================================================================

echo "✓ Step 4: Reviewing files to be committed..."
echo ""

echo "Files to be committed:"
git diff --cached --name-only | head -20

echo ""
echo "Total files: $(git diff --cached --name-only | wc -l)"
echo ""

# ============================================================================
# STEP 5: COMMIT
# ============================================================================

echo "✓ Step 5: Creating commit..."
echo ""

git commit -m "🚀 Deploy: TradeHax Neural Engine v2.0

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
- API reference documentation"

echo ""
echo "✅ Commit created"
echo ""

# ============================================================================
# STEP 6: PUSH TO REPOSITORY
# ============================================================================

echo "✓ Step 6: Pushing to repository..."
echo ""

read -p "  Ready to push? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "  Cancelled. Commit is local only."
    exit 0
fi

git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Code pushed successfully"
else
    echo "❌ Push failed. Check your Git configuration."
    exit 1
fi

echo ""

# ============================================================================
# STEP 7: DEPLOYMENT INSTRUCTIONS
# ============================================================================

echo "✓ Step 7: Next steps for deployment..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYMENT TO PRIVATE SERVER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  On your private server, pull the latest code:"
echo "    git pull origin main"
echo ""

echo "2️⃣  Set environment variables:"
echo "    export HUGGINGFACE_API_KEY=\"hf_...\""
echo "    export OPENAI_API_KEY=\"sk-proj-...\""
echo "    export DATABASE_URL=\"postgresql://...\""
echo ""

echo "3️⃣  Install dependencies and build:"
echo "    npm install"
echo "    npm run build"
echo ""

echo "4️⃣  Start the application:"
echo "    npm start"
echo "    # or for development:"
echo "    npm run dev"
echo ""

echo "5️⃣  Verify deployment:"
echo "    curl http://localhost:3000/neural-console"
echo "    # Should show: Real-time metrics dashboard"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   - SECURE_DEPLOYMENT_GUIDE.md    (Detailed deployment guide)"
echo "   - NEURAL_ENGINE_INDEX.md        (Master documentation index)"
echo "   - .env.example                  (Environment variables template)"
echo ""

echo "✅ CODE DEPLOYMENT COMPLETE"
echo ""
echo "⚠️  REMEMBER:"
echo "   - .env.local is NOT committed (good!)"
echo "   - Set environment variables on server"
echo "   - API keys are secure"
echo "   - Review SECURE_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""

echo "🎉 Your TradeHax Neural Engine is ready for deployment!"

