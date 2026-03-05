# 🔄 TradeHax IDE Pipeline & Multi-Location Sync Workflow

## Overview

The IDE Pipeline ensures **consistent development experience** across any machine/location with:
- ✅ Same quality gates everywhere (lint + type-check)
- ✅ Quick awareness of sync state vs origin/main
- ✅ Optional build and deploy-readiness checks
- ✅ One command in terminal OR one task in VS Code

---

## Commands

### Quick Sync (Default)

```bash
npm run ide:sync
```

**Runs:**
- `git fetch origin main` — Get latest from remote
- Git ahead/behind report — How many commits ahead/behind
- `npm run hooks:install` — Install git hooks (best effort)
- `npm run lint` — ESLint check
- `npm run type-check` — TypeScript check

**Time:** ~30 seconds  
**Use:** When opening the project or starting a work session

---

### Full Sync (Recommended Before Pushing)

```bash
npm run ide:sync:full
```

**Runs:**
- Quick Sync (all of above)
- `npm ci --legacy-peer-deps` — Clean install dependencies
- `npm run build` — Production build
- Namecheap deploy config check (warning mode)

**Time:** ~2 minutes  
**Use:** Before pushing code to GitHub

---

### Deploy-Ready Strict Sync

```bash
npm run ide:sync:deploy-ready
```

**Runs:**
- Full Sync (all of above)
- **Strict** Namecheap deploy config check (FAILS if secrets missing)
- Final git status check

**Time:** ~2 minutes  
**Use:** Before Namecheap deployment (confirms all secrets configured)

---

## VS Code Tasks

Use **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):

### Run Task
Search for and select:
- **TradeHax: IDE Sync (Quick)** — Quick sync
- **TradeHax: IDE Sync (Full)** — Full sync with build
- **TradeHax: IDE Sync (Deploy Ready)** — Strict pre-deployment check
- **TradeHax: Lint** — Run ESLint only
- **TradeHax: Type Check** — Run TypeScript only
- **TradeHax: Build** — Production build only
- **TradeHax: Dev Server** — Start dev server
- **TradeHax: Deploy to Namecheap** — Deploy script

### Keyboard Shortcuts
- Quick sync: `Ctrl+Shift+B` (default build task)
- View all tasks: `Ctrl+Shift+P` → "Run Task"

---

## Multi-Location Best Practices

### 1. **When Opening Workspace**
```bash
npm run ide:sync
```
Brings you in sync with remote and validates local setup.

### 2. **If Behind origin/main**
```bash
git pull origin main
```
Always pull before making changes.

### 3. **Before Pushing Code**
```bash
npm run ide:sync:full
```
Ensures:
- No lint errors
- No type errors
- Build succeeds
- Dependencies up to date

### 4. **Before Namecheap Deployment**
```bash
npm run ide:sync:deploy-ready
```
Ensures:
- All of above +
- Namecheap secrets configured
- Deploy-ready status verified

### 5. **Secret Management**
- ✅ Keep secrets **ONLY** in:
  - GitHub Actions secrets (for CI/CD)
  - Server env files (on Namecheap)
  - Local `.env` file (never committed)
- ❌ **NEVER** commit secrets to Git
- ❌ **NEVER** hardcode credentials

---

## Environment Variables & Secrets

### Required Namecheap Secrets (GitHub Actions)

Set in **GitHub Repository Settings → Secrets and variables → Actions**:

```
NAMECHEAP_VPS_HOST=199.188.201.164
NAMECHEAP_VPS_USER=traddhou
NAMECHEAP_VPS_SSH_KEY=(your private SSH key)
```

### Optional Namecheap Secrets

```
NAMECHEAP_VPS_PORT=22               (default)
NAMECHEAP_APP_ROOT=/home/traddhou/public_html
NAMECHEAP_APP_PORT=3000
```

### Local Development (.env)

```bash
# Copy template
cp .env.example .env

# Add secrets
HF_API_TOKEN=hf_your_token
NEXTAUTH_SECRET=your_secret_key
DATABASE_URL=your_database_url

# Add Namecheap config (optional for local testing)
NAMECHEAP_VPS_HOST=199.188.201.164
NAMECHEAP_VPS_USER=traddhou
```

---

## Workflow Examples

### Example 1: Morning Startup (Any Location)

```bash
# Open VS Code and command palette
Ctrl+Shift+P

# Select: Run Task → TradeHax: IDE Sync (Quick)
# Wait ~30 seconds

# Now safe to start editing
npm run dev
```

### Example 2: Prepare Code for Push

```bash
# After making changes
npm run ide:sync:full

# If all checks pass:
git add .
git commit -m "feat: add new feature"
git push origin main

# If checks fail:
# Fix errors and run again
npm run ide:sync:full
```

### Example 3: Deploy to Namecheap

```bash
# Ensure all code is pushed
git push origin main

# Run strict deployment check
npm run ide:sync:deploy-ready

# If passed:
bash scripts/deploy-to-namecheap.sh

# Monitor deployment
pm2 logs tradehax
```

---

## Output Examples

### Quick Sync Success

```
╔══════════════════════════════════════════════════════════════════╗
║  TradeHax IDE Sync (Quick)                                       ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1: Git Fetch & Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   → Fetching latest from origin/main...
✅ Fetching latest from origin/main

ℹ️  Git Status: 0 commits ahead, 0 commits behind

✅ Installing git hooks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3: Linting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Running ESLint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 4: Type Checking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Running TypeScript check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quick Sync Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Passed: 5/5
Warnings: 0/5
Failed: 0/5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next Steps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Quick sync complete! Ready to edit.

Before pushing:
  npm run ide:sync:full
```

### Full Sync with Build

```
Passed: 10/10
Warnings: 1/10 (non-blocking)
Failed: 0/10

✅ Full sync complete! Ready to push.

Before Namecheap deployment:
  npm run ide:sync:deploy-ready
```

### Deploy-Ready Strict Check

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 8: Strict Namecheap Deploy Config Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strict Namecheap Deploy Config Check:

Required Variables:
✅ VPS Host (NAMECHEAP_VPS_HOST): Configured
✅ VPS Username (NAMECHEAP_VPS_USER): Configured
✅ SSH Private Key (NAMECHEAP_VPS_SSH_KEY): Configured

Optional Variables:
✅ SSH Port (NAMECHEAP_VPS_PORT): Using default (22)
ℹ️  App Root (NAMECHEAP_APP_ROOT): Using default (/home/traddhou/public_html)
ℹ️  App Port (NAMECHEAP_APP_PORT): Using default (3000)

✅ Deploy-ready sync complete! Ready to deploy.

Deploy to Namecheap:
  bash scripts/deploy-to-namecheap.sh
```

---

## Troubleshooting

### Lint Errors

```bash
# See all lint errors
npm run lint

# Auto-fix fixable errors
npm run lint:fix

# Then run sync again
npm run ide:sync:full
```

### Type Errors

```bash
# See all type errors
npm run type-check

# Fix errors in your IDE
# Then run sync again
npm run ide:sync:full
```

### Build Fails

```bash
# Check build log
npm run build

# Common fixes:
npm run clean          # Clear cache
npm ci                 # Reinstall deps
npm run build          # Rebuild

# Then run full sync
npm run ide:sync:full
```

### Missing Namecheap Secrets

For **local development**:
```bash
# Add to .env (never commit)
NAMECHEAP_VPS_HOST=199.188.201.164
NAMECHEAP_VPS_USER=traddhou
```

For **CI/CD (GitHub Actions)**:
1. Go to **Settings → Secrets and variables → Actions**
2. Add: `NAMECHEAP_VPS_HOST`, `NAMECHEAP_VPS_USER`, `NAMECHEAP_VPS_SSH_KEY`
3. Run sync again

---

## GitHub Actions CI/CD Integration

The IDE sync workflow integrates with GitHub Actions for automated deployment:

**Workflow file:** `.github/workflows/namecheap-vps-deploy.yml`

**Automatically:**
- Runs lint + type-check on every push
- Runs full build on PRs
- Can deploy to Namecheap on tag or manual trigger

---

## Quick Reference

| Command | Time | Use Case |
|---------|------|----------|
| `npm run ide:sync` | 30s | Opening project, daily sync |
| `npm run ide:sync:full` | 2m | Before pushing code |
| `npm run ide:sync:deploy-ready` | 2m | Before Namecheap deploy |
| `npm run lint` | 10s | Check linting only |
| `npm run type-check` | 15s | Check types only |
| `npm run build` | 90s | Build only |
| `npm run dev` | - | Start dev server |

---

## File Locations

**Configuration:**
- `.vscode/tasks.json` — VS Code task definitions
- `scripts/ide-sync-workflow.js` — Main sync script
- `.github/workflows/` — CI/CD automation

**Documentation:**
- This file — IDE Pipeline guide
- `NAMECHEAP_MIGRATION_CHECKLIST.md` — Deployment checklist
- `HF_INTEGRATION_GUIDE.md` — HF setup guide

---

## Support

**Questions?** 

Email: darkmodder33@proton.me
GitHub: https://github.com/DarkModder33/main

**Check Also:**
- `NAMECHEAP_MIGRATION_CHECKLIST.md` — Deployment setup
- `.github/workflows/namecheap-vps-deploy.yml` — CI/CD config
- `scripts/ide-sync-workflow.js` — Implementation details

---

**Status:** ✅ Production Ready

One command to keep your development environment in sync across any machine/location!
