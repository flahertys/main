# 🔄 Deployment & Sync Flow - How Your Code Gets to Production

## 📋 The Complete Flow

When you push code to GitHub, here's what happens:

---

## Fast Option: One-command deploy helper

Use `scripts/deploy-tradehax.ps1` when you want one command to:
- inspect today's branch activity,
- merge into `main` only if needed,
- push `main`,
- optionally run VPS deployment over SSH.

```powershell
# Safe preview (default dry-run)
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1

# Execute git updates and optional remote deploy
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1 -DryRun:$false -DeployRemote
```

Detailed usage: `Documentation/DEPLOY_ONE_COMMAND.md`

---

## 🎯 Current Setup: MANUAL DEPLOYMENT

### ❌ What is **NOT** Currently Automatic

**GitHub Actions CI/CD is NOT configured to auto-deploy.**

This means:
- ❌ Push to GitHub ≠ Automatic deploy to tradehax.net
- ❌ No automatic webhook to Namecheap VPS
- ❌ No automatic Docker rebuilds
- ❌ No automatic MCP cluster sync

**Why?** Manual deployment provides more control and prevents accidental production deployments.

---

## ✅ Current Workflow: Manual Push Required

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR LOCAL MACHINE                        │
│  C:\tradez\main                                             │
│  IntelliJ IDEA or Terminal                                  │
└────────────────────────┬────────────────────────────────────┘
                         │ Edit code
                         │ npm run dev (test locally)
                         │ Commit changes
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              GITHUB REPOSITORY (main)                        │
│  https://github.com/DarkModder33/main                       │
│                                                              │
│  git push origin main                                       │
│  ↓                                                           │
│  Code is now on GitHub                                      │
│  BUT NOT automatically deployed                             │
└────────────────────────┬────────────────────────────────────┘
                         │ YOU manually run:
                         │ node ./scripts/deploy-namecheap.js
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│         NAMECHEAP VPS (199.188.201.164)                      │
│                                                              │
│  /home/tradehax/public_html                                 │
│  Deployment script:                                         │
│  1. git pull origin main                                    │
│  2. npm install                                             │
│  3. npm run build                                           │
│  4. pm2 restart tradehax                                    │
│                                                              │
│  Result: tradehax.net live with latest code                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Step-by-Step: How to Deploy Your Code

### Step 1: Code Locally
```bash
cd C:\tradez\main

# Edit files in IntelliJ IDEA or your editor
# Make your changes
```

### Step 2: Test Locally
```bash
# Start development server
npm run dev

# Visit http://localhost:3000
# Test your changes
```

### Step 3: Quality Check
```bash
# Check code quality
npm run lint
npm run type-check

# Build production version
npm run build
```

### Step 4: Commit to Git
```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: description of changes"

# Or use IntelliJ: Ctrl+K → Enter message → Commit
```

### Step 5: Push to GitHub
```bash
# Push to main branch
git push origin main

# Or use IntelliJ: Ctrl+Shift+K
```

### Step 6: Deploy to Namecheap (Manual)
```bash
# Run deployment script
node ./scripts/deploy-namecheap.js

# This script will:
# 1. Connect to VPS via SSH
# 2. Pull latest code from GitHub
# 3. Install dependencies
# 4. Build the application
# 5. Restart the service with PM2
```

### Step 7: Verify Live
```bash
# Check the live site
https://tradehax.net

# Or check VPS status
ssh tradehax@199.188.201.164
pm2 status
pm2 logs tradehax
```

---

## 🏗️ Full Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         YOUR LOCAL DEV                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IntelliJ IDEA          Terminal              Browser           │
│  ├─ Edit code           ├─ npm run dev        → localhost:3000  │
│  ├─ Format              ├─ npm run lint       → Test features  │
│  ├─ Debug               ├─ npm run build      → Verify build   │
│  ├─ Commit (Ctrl+K)     ├─ git commit         → Check errors   │
│  └─ Push (Ctrl+Shift+K) └─ git push origin    → Push to GitHub │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓ git push
┌──────────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  https://github.com/DarkModder33/main                           │
│  ├─ main branch (your code)                                     │
│  ├─ 45+ feature branches                                        │
│  ├─ Git history & commits                                       │
│  ├─ Issues & PRs                                                │
│  └─ GitHub Actions (currently manual trigger)                   │
│                                                                  │
│  Webhooks available to integrate with:                          │
│  ├─ CI/CD platforms                                             │
│  ├─ Deployment services                                         │
│  ├─ Docker registries                                           │
│  └─ MCP clusters                                                │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓ Manual: node ./scripts/deploy-namecheap.js
┌──────────────────────────────────────────────────────────────────┐
│              NAMECHEAP VPS (199.188.201.164)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Deployment Script Flow:                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. SSH Connection                                          │ │
│  │    └─ Connect to tradehax@199.188.201.164                 │ │
│  │                                                            │ │
│  │ 2. Repository Sync                                        │ │
│  │    └─ cd /home/tradehax/public_html                       │ │
│  │    └─ git pull origin main (fetch latest)                │ │
│  │                                                            │ │
│  │ 3. Build                                                  │ │
│  │    └─ npm install (update packages)                       │ │
│  │    └─ npm run build (compile Next.js)                     │ │
│  │                                                            │ │
│  │ 4. Deploy                                                 │ │
│  │    └─ pm2 restart tradehax (restart service)              │ │
│  │                                                            │ │
│  │ 5. Verify                                                 │ │
│  │    └─ Check PM2 status                                    │ │
│  │    └─ Test health endpoint                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Result: /home/tradehax/public_html/.next/                      │
│          (Production build ready to serve)                      │
│                                                                  │
│  PM2 Process:                                                   │
│  ├─ Service: tradehax                                           │
│  ├─ Port: 3000                                                  │
│  ├─ Status: online (if successful)                             │
│  └─ Logs: /home/tradehax/logs/tradehax*.log                    │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓ nginx proxy (cPanel)
┌──────────────────────────────────────────────────────────────────┐
│                      LIVE WEBSITE                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  https://tradehax.net (or your domain)                          │
│  ├─ Port 443 (HTTPS)                                            │
│  ├─ Routes: 132 compiled                                        │
│  ├─ APIs: 60+ endpoints                                         │
│  ├─ Features: Games, Music, AI, Web3, Trading                   │
│  └─ Status: Live & serving users                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## ❓ About MCP Clusters

### What is an MCP Cluster?

**MCP** = Model Context Protocol (Docker's tool for building and sharing AI agents/services)

Your question: *"Does it push to every MCP cluster I have?"*

**Answer:**
- ❌ **No automatic push to MCP clusters** currently
- ❌ **No MCP clusters detected** in your current setup
- ✅ **Can be integrated** if you have MCP services

### How to Enable MCP Cluster Sync

If you want to deploy to MCP clusters automatically:

**Step 1: Identify your MCP clusters**
```bash
# Check if you have MCP installed
mcp --version

# List MCP services/clusters
mcp list
```

**Step 2: Configure GitHub Actions**
Create `.github/workflows/mcp-deploy.yml`:
```yaml
name: Deploy to MCP Clusters

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to MCP
        run: |
          mcp deploy --cluster=<your-cluster>
```

**Step 3: Set up GitHub Secrets**
```
MCP_API_KEY = your_mcp_api_key
MCP_CLUSTER = your_cluster_name
```

---

## 🎛️ Sync Options: Manual vs Automatic

### Current: Manual Deployment
```
Code Push → GitHub → YOU manually run → script → VPS → Live
```

**Pros:**
- ✅ Full control
- ✅ Test before deployment
- ✅ Prevents accidental deploys
- ✅ Can roll back easily

**Cons:**
- ❌ Extra step required
- ❌ No automatic CI/CD
- ❌ Requires manual trigger

### Optional: Automatic Deployment (GitHub Actions)
```
Code Push → GitHub → Auto CI/CD → VPS → Live
```

**Pros:**
- ✅ Fully automated
- ✅ Deploy on every push
- ✅ Integrated tests
- ✅ No manual steps

**Cons:**
- ❌ Need to configure
- ❌ Need to test thoroughly
- ❌ Risk of deploying broken code

---

## 🔄 What Syncs to Your IDE?

### Your IDE (IntelliJ IDEA) & Local Dev:

**Does NOT auto-sync from GitHub:**
- ❌ Changes on GitHub don't auto-pull to your IDE
- ❌ No live collaboration syncing
- ❌ You must manually `git pull` to get updates

**You must do:**
```bash
# Get latest from GitHub
git pull origin main

# OR in IntelliJ: Ctrl+T (pull)
```

**What DOES stay in sync:**
- ✅ Package.json changes (new packages)
- ✅ Code changes (once you pull)
- ✅ Configuration changes
- ✅ TypeScript types

---

## 🎯 Recommended Workflow

### For Daily Development:

```bash
# Morning: Get latest
git pull origin main
npm install  # Update packages
npm run dev  # Start dev server

# During day: Edit & test
# (IntelliJ IDEA handles real-time updates locally)

# Evening: Ready to deploy?
npm run lint
npm run type-check
npm run build  # Verify production build

# Commit & push
git add .
git commit -m "feat: your changes"
git push origin main

# Ready for live? Deploy manually
node ./scripts/deploy-namecheap.js

# Verify live
https://tradehax.net
```

---

## ⚙️ To Enable Automatic Deployment (Optional)

If you want to skip the manual `node ./scripts/deploy-namecheap.js` step:

### Option 1: GitHub Actions Webhook
Create automatic deploy on every push to main:
```yaml
# .github/workflows/deploy.yml
name: Auto Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - run: node ./scripts/deploy-namecheap.js
        env:
          NAMECHEAP_VPS_HOST: ${{ secrets.NAMECHEAP_VPS_HOST }}
          NAMECHEAP_VPS_USER: ${{ secrets.NAMECHEAP_VPS_USER }}
          NAMECHEAP_VPS_SSH_KEY: ${{ secrets.NAMECHEAP_VPS_SSH_KEY }}
```

### Option 2: Webhook from Namecheap
Configure Namecheap to auto-pull on GitHub webhook (requires cPanel setup)

### Option 3: GitOps with FluxCD
Use GitOps for declarative infrastructure (advanced)

---

## 📊 Current Sync Status

### IDE ↔ GitHub
```
IDE (C:\tradez\main)
     ↕ (manual: git push/pull)
GitHub (https://github.com/DarkModder33/main)
```

### GitHub ↔ Namecheap VPS
```
GitHub (main branch)
     ↕ (manual: node ./scripts/deploy-namecheap.js)
Namecheap VPS (199.188.201.164)
     ↕ (PM2 manages)
Live Site (https://tradehax.net)
```

### IDE ↔ Live Site
```
IDE (C:\tradez\main)
     → Manual push → GitHub
     → Manual deploy → Namecheap VPS
     → Shows at tradehax.net
```

---

## ✅ Quick Answer to Your Question

**Q: If I make code here and push it will it sync to tradehax.net and my IDE concurrently?**

**A:**
- ❌ **NOT automatically** to tradehax.net
- ❌ **NOT automatically** to your IDE from GitHub
- ✅ **Manual steps required:**
  1. Make code locally
  2. Test with `npm run dev`
  3. `git push origin main` (GitHub)
  4. `node ./scripts/deploy-namecheap.js` (manual deploy)
  5. `git pull origin main` (if collaborating)

**Q: Does it push to every MCP cluster I have?**

**A:**
- ❌ **No MCP clusters detected** in current setup
- ❌ **No automatic MCP sync** configured
- ✅ **Can be configured** if you have MCP services

---

## 🚀 Ready to Deploy?

### Manual Deployment (Current)
```bash
# When you're ready to go live:
node ./scripts/deploy-namecheap.js

# Script handles:
# ✅ SSH connection
# ✅ Git pull from GitHub
# ✅ npm install
# ✅ npm run build
# ✅ PM2 restart
# ✅ Verification
```

### Check Deployment Status
```bash
# SSH to VPS
ssh tradehax@199.188.201.164

# Check PM2
pm2 status
pm2 logs tradehax

# Visit live site
https://tradehax.net
```

---

## 📋 Summary Table

| Action | Manual? | Auto? | Who Does It |
|--------|---------|-------|------------|
| Code edit locally | ✅ | ❌ | You (IDE) |
| Push to GitHub | ✅ | ❌ | You (git push) |
| Deploy to Namecheap | ✅ | ❌ | You (deploy script) |
| Sync to IDE from GitHub | ✅ | ❌ | You (git pull) |
| Sync to MCP clusters | - | - | Not configured |
| Update tradehax.net | ✅ | ❌ | Via deploy script |

---

**Current Status:** 🎛️ **MANUAL CONTROL** (Recommended for safety)

Want to automate? See "To Enable Automatic Deployment" section above.

Let me know if you'd like to set up automatic deployment! 🚀
