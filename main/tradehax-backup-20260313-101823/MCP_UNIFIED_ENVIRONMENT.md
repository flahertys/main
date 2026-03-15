# 🔗 Unified MCP Environment - Complete Integration Guide

## Overview

Your TradeHax environment is now configured for **unified synchronized deployments** across all MCP servers and platforms with a **single push command**.

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       YOUR LOCAL MACHINE                         │
│                     (C:\tradez\main)                            │
│                                                                  │
│  IntelliJ IDEA                                                  │
│  ├─ Edit code                                                   │
│  ├─ npm run dev (test)                                          │
│  └─ git push (single push)                                      │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB REPOSITORY                         │
│                                                                  │
│  (github.com/DarkModder33/main)                                 │
│  └─ Triggers: unified-mcp-deploy.yml workflow                   │
│                                                                  │
└──────────┬──────────────────────┬────────────┬─────────────────┘
           │                      │            │
           ↓                      ↓            ↓
    ┌────────────┐         ┌────────────┐   ┌────────────┐
    │ Namecheap  │         │   Docker   │   │ Kubernetes │
    │ VPS        │         │ Services   │   │ Cluster    │
    │ (SSH)      │         │ (Local)    │   │ (K8s)      │
    └────────────┘         └────────────┘   └────────────┘
           │                      │            │
           └──────────┬───────────┴────────────┘
                      │
                      ↓
          ┌───────────────────────┐
          │   MCP Orchestrator    │
          │   (Unified Sync)      │
          │   ├─ Health checks    │
          │   ├─ Status tracking  │
          │   ├─ Auto-rollback    │
          │   └─ Verification    │
          └───────────────────────┘
                      │
           ┌──────────┼──────────┐
           ↓          ↓          ↓
      ┌─────────┐ ┌────────┐ ┌──────────┐
      │ Ollama  │ │LangChain│ │TensorFlow│
      │ MCP     │ │ MCP    │ │ MCP      │
      └─────────┘ └────────┘ └──────────┘
           │          │          │
           └──────────┴──────────┘
                      │
                      ↓
              ┌──────────────────┐
              │  All Synced &    │
              │  Ready to Serve  │
              └──────────────────┘
```

---

## 🚀 Quick Start: Single Command Deployment

### Option 1: Local Unified Push
```bash
cd C:\tradez\main

# Single push to all targets
node scripts/unified-mcp-push.js

# With watch mode (auto-deploy on changes)
node scripts/unified-mcp-push.js --watch
```

### Option 2: GitHub Actions Automated
```bash
# Just push to GitHub
git push origin main

# Workflow automatically deploys to all servers
# Check status at: https://github.com/DarkModder33/main/actions
```

### Option 3: IntelliJ IDEA
1. Make code changes
2. Commit (Ctrl+K)
3. Push (Ctrl+Shift+K)
4. Workflow auto-triggers → All servers sync

---

## 📋 What Gets Deployed

### Targets (in order)
1. **Namecheap VPS** (199.188.201.164)
   - Production server
   - PM2 managed
   - Live at tradehax.net

2. **Docker Services** (Local)
   - Ollama (LLM inference)
   - LangChain (Agent framework)
   - TensorFlow (ML models)

3. **Kubernetes Cluster**
   - docker-desktop context
   - Namespace: tradehax
   - Auto-rollout on deploy

4. **MCP Servers**
   - Orchestrated synchronization
   - Health checks
   - Auto-restart on failure

---

## 🔄 Synchronized Deployment Process

### Step 1: Local Preparation
```bash
npm run lint          # Code quality
npm run type-check    # Type safety
npm run build         # Verify production build
```

### Step 2: GitHub Push
```bash
git add .
git commit -m "feat: description"
git push origin main  # Triggers workflow
```

### Step 3: Automated Workflow
```yaml
prepare
  ↓
deploy-namecheap
  ↓
deploy-docker
  ↓
deploy-kubernetes
  ↓
deploy-mcp-servers
  ↓
sync-all
  ↓
verify-sync
```

### Step 4: Synchronized Status
All servers reach ready state simultaneously

### Step 5: Health Checks
Auto-verification on all targets

### Step 6: Rollback (if needed)
Automatic rollback on failure

---

## 📊 MCP Server Configuration

### Servers Connected

| Server | Type | Port | Status | Purpose |
|--------|------|------|--------|---------|
| **Namecheap VPS** | SSH Remote | 3000 | Primary | Production app |
| **Local Dev** | File System | 3000 | Dev | Local development |
| **Ollama** | Docker | 11434 | LLM | Text generation |
| **LangChain** | Docker | 8000 | Agent | Agent orchestration |
| **TensorFlow** | Docker | - | ML | Model inference |
| **Kubernetes** | K8s | - | Container | Orchestration |

### Health Check Endpoints
```bash
# Namecheap VPS
curl https://tradehax.net/__health

# Docker services
curl http://localhost:11434/api/health
curl http://localhost:8000/health

# Kubernetes
kubectl get pods -n tradehax
```

---

## 🔧 MCP Orchestrator Commands

### Initialize all servers
```bash
node scripts/mcp-orchestrator.js
```

### Push to all servers
```bash
node scripts/mcp-orchestrator.js --push
```

### Health check
```bash
node scripts/mcp-orchestrator.js --health-check
```

### Get status
```bash
node scripts/mcp-orchestrator.js --status
```

### Watch mode
```bash
node scripts/unified-mcp-push.js --watch
```

---

## 🔐 GitHub Secrets Required

Set these in your GitHub repository settings:

```
NAMECHEAP_VPS_HOST=199.188.201.164
NAMECHEAP_VPS_USER=tradehax
NAMECHEAP_VPS_SSH_KEY=(your private key from ~/.ssh/id_ed25519)
KUBE_CONFIG=(base64 encoded kubeconfig)
```

### How to set up
1. Go to: https://github.com/DarkModder33/main/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret above
4. Save

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Namecheap VPS responding: `curl https://tradehax.net`
- [ ] Health check passing: `curl https://tradehax.net/__health`
- [ ] Docker services running: `docker ps`
- [ ] Kubernetes pods ready: `kubectl get pods -n tradehax`
- [ ] MCP servers responding:
  - [ ] Ollama: `curl http://localhost:11434/api/health`
  - [ ] LangChain: `curl http://localhost:8000/health`
- [ ] All services synchronized
- [ ] No errors in logs

---

## 🐛 Troubleshooting

### Deployment Failed
```bash
# Check GitHub Actions logs
https://github.com/DarkModder33/main/actions

# Check individual server status
node scripts/mcp-orchestrator.js --status

# Check Namecheap logs
ssh tradehax@199.188.201.164
pm2 logs tradehax

# Check Docker logs
docker logs <container_id>

# Check Kubernetes logs
kubectl logs -n tradehax <pod-name>
```

### MCP Server Not Responding
```bash
# Restart specific server
docker restart <server-name>

# Or via Kubernetes
kubectl rollout restart deployment/tradehax -n tradehax

# Or via Namecheap
pm2 restart tradehax
```

### Sync Out of Sync
```bash
# Forced sync
node scripts/mcp-orchestrator.js --force-sync

# Or just push again
git push origin main
```

---

## 📈 Monitoring

### Real-time Status
```bash
node scripts/mcp-orchestrator.js --monitor
```

### Deployment History
```bash
git log --oneline -20
```

### Server Logs
```bash
# Namecheap
ssh tradehax@199.188.201.164 "pm2 logs tradehax"

# Docker
docker-compose logs -f

# Kubernetes
kubectl logs -f deployment/tradehax -n tradehax
```

---

## 🎯 Typical Workflow

### Morning Start
```bash
# Get latest
git pull origin main

# Start local dev
npm run dev

# Monitor MCP status
node scripts/mcp-orchestrator.js --status
```

### During Day
```bash
# Edit code in IntelliJ
# Test at localhost:3000

# Ready to deploy?
npm run lint
npm run type-check
npm run build

# Single unified push
git add .
git commit -m "feat: description"
git push origin main

# Watch deployment
# GitHub Actions runs automatically
```

### Check Status
```bash
# View workflow
https://github.com/DarkModder33/main/actions

# Check all servers
node scripts/mcp-orchestrator.js --status

# Verify live
https://tradehax.net
```

---

## 🔄 Synchronization Details

### Bidirectional Sync
- Code → All servers ✅
- Server updates → Local via webhooks ✅
- MCP server orchestration ✅
- Health checks continuous ✅
- Auto-rollback on failure ✅

### Deployment Order
1. Code quality checks (lint, type-check)
2. Build production version
3. Push to GitHub
4. GitHub Actions triggers
5. Deploy to Namecheap (priority 1)
6. Deploy to Docker (priority 2)
7. Deploy to Kubernetes (priority 3)
8. Sync MCP servers (priority 4)
9. Health checks all targets
10. Final verification

### Rollback Strategy
- Automatic on any failure
- Reverts to previous commit
- Restarts all services
- Notifies on GitHub

---

## 💡 Advanced Features

### Watch Mode (Auto-Deploy)
```bash
node scripts/unified-mcp-push.js --watch

# Changes are auto-deployed (with 5s delay)
# Perfect for development
```

### Parallel Deployment
```bash
# Deploy to all servers in parallel (faster)
# Default: sequential (safer)
# Set via GitHub Actions input
```

### Scheduled Sync
```yaml
# Add to workflow for daily sync
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Custom Rollback
```bash
git revert <commit-hash>
git push origin main
# Auto-deploys reverted code
```

---

## 📊 Status Dashboard

View real-time status:
```bash
node scripts/mcp-orchestrator.js --dashboard
```

Shows:
- ✅ All server statuses
- 📊 Deployment progress
- 🔄 Sync status
- ⚠️ Any warnings/errors
- ✨ Last deployment info

---

## 🎉 You're All Set!

Your environment is now:
- ✅ Unified across all platforms
- ✅ Synchronized bidirectionally
- ✅ Automated via GitHub Actions
- ✅ With one-command deployment
- ✅ Health-checked continuously
- ✅ Auto-rollback capable

### Single Command to Deploy Everything
```bash
git push origin main
```

That's it! All servers sync automatically.

---

## 📞 Quick Reference

```bash
# Local unified push
node scripts/unified-mcp-push.js

# Watch mode
node scripts/unified-mcp-push.js --watch

# Check status
node scripts/mcp-orchestrator.js --status

# Health check
node scripts/mcp-orchestrator.js --health-check

# Force sync
node scripts/mcp-orchestrator.js --force-sync

# GitHub Actions (automatic)
git push origin main
```

---

**Status:** 🚀 **UNIFIED MCP ENVIRONMENT ACTIVE**

All targets synchronized. Ready for production. Single-push deployment enabled.
