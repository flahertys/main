# Deployment Flow Visualization

## GitHub-First Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer                                │
│                                                                   │
│  1. Makes changes to code (frontend or backend)                 │
│  2. Commits: git add . && git commit -m "..."                   │
│  3. Pushes: git push origin main                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Push Event
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Repository                            │
│                  shamrockstocks.github.io                        │
│                                                                   │
│  • Main branch receives commit                                  │
│  • Version control audit trail created                          │
│  • All code is in single source of truth                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Triggers
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions                                │
│                  (Automatic Workflows)                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Coordinated Deployment Workflow                       │    │
│  │                                                         │    │
│  │  1. Detect Changes (paths-filter)                     │    │
│  │     • Frontend: HTML, JS, CSS, assets                 │    │
│  │     • Backend: API code, configs                      │    │
│  │                                                         │    │
│  │  2. Run Parallel Deployments (if needed)              │    │
│  │                                                         │    │
│  │     ┌──────────────┐        ┌──────────────┐         │    │
│  │     │   Frontend   │        │   Backend    │         │    │
│  │     │   Deploy     │        │   Deploy     │         │    │
│  │     └──────┬───────┘        └──────┬───────┘         │    │
│  │            │                        │                  │    │
│  │            ▼                        ▼                  │    │
│  │     ┌──────────────┐        ┌──────────────┐         │    │
│  │     │ Build with   │        │ Install      │         │    │
│  │     │ htflow       │        │ Vercel CLI   │         │    │
│  │     └──────┬───────┘        └──────┬───────┘         │    │
│  │            │                        │                  │    │
│  │            ▼                        ▼                  │    │
│  │     ┌──────────────┐        ┌──────────────┐         │    │
│  │     │ Upload to    │        │ Build & Push │         │    │
│  │     │ GitHub Pages │        │ to Vercel    │         │    │
│  │     └──────┬───────┘        └──────┬───────┘         │    │
│  │            │                        │                  │    │
│  │            └────────┬───────────────┘                  │    │
│  │                     │                                   │    │
│  │                     ▼                                   │    │
│  │              Verify Sync                               │    │
│  │              ✅ Deployment Complete                    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Deployment Results
                      │
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│  GitHub Pages    │    │     Vercel       │
│                  │    │                  │
│  tradehax.net    │    │  API Endpoints   │
│  (Frontend)      │    │  (Backend)       │
│                  │    │                  │
│  • HTML/CSS/JS   │    │  • Node.js API   │
│  • Static assets │    │  • Serverless    │
│  • Public site   │    │  • Database      │
└──────────────────┘    └──────────────────┘
          │                        │
          └───────────┬────────────┘
                      │
                      ▼
          ┌──────────────────────┐
          │    End Users         │
          │                      │
          │  Visit tradehax.net  │
          │  Use full-stack app  │
          └──────────────────────┘
```

## Workflow Sequence Diagram

```
Developer         GitHub          GitHub Actions      GitHub Pages    Vercel
    │                │                   │                  │            │
    │ 1. Push        │                   │                  │            │
    │ ──────────────>│                   │                  │            │
    │                │                   │                  │            │
    │                │ 2. Trigger        │                  │            │
    │                │ ─────────────────>│                  │            │
    │                │                   │                  │            │
    │                │                   │ 3. Detect Changes│            │
    │                │                   │ (Frontend/Backend)            │
    │                │                   │                  │            │
    │                │                   │ 4. Build Frontend│            │
    │                │                   │ ─────────────────>            │
    │                │                   │                  │            │
    │                │                   │ 5. Deploy        │            │
    │                │                   │ ─────────────────────────────>│
    │                │                   │                  │            │
    │                │                   │ 6. Verify Sync   │            │
    │                │                   │ <────────────────┼───────────>│
    │                │                   │                  │            │
    │                │ 7. Complete       │                  │            │
    │                │ <─────────────────│                  │            │
    │                │                   │                  │            │
    │ 8. Notification│                   │                  │            │
    │ <──────────────│                   │                  │            │
    │                │                   │                  │            │
```

## Key Principles

### ✅ Single Source of Truth
```
GitHub Repository (main branch)
          ↓
    All deployments originate here
          ↓
    No manual deployments bypass this
```

### ✅ Automated Deployment
```
Commit → Push → Automatic Detection → Deploy → Live
```

### ✅ Change Detection
```
Path Filters:
  Frontend paths → GitHub Pages deployment
  Backend paths  → Vercel deployment
  Both changed   → Deploy both in parallel
  Nothing changed → Skip deployment
```

### ✅ Verification
```
After deployment:
  ✓ Check working tree clean
  ✓ Verify frontend accessible
  ✓ Verify backend healthy
  ✓ Confirm sync complete
```

## Deployment Paths

### Frontend Deployment Path
```
index.html, script.js, assets/
              ↓
      htflow:build (static site generator)
              ↓
      Upload to GitHub Pages
              ↓
      DNS: tradehax.net
              ↓
      Live to users
```

### Backend Deployment Path
```
tradehax-backend/api/
              ↓
      Vercel CLI build
              ↓
      Deploy to Vercel serverless
              ↓
      Your-project.vercel.app
              ↓
      API endpoints live
```

## Developer Experience

### Before (Manual, Risky)
```
1. Push to GitHub
2. Remember to deploy to Vercel separately
3. Risk: Deployments out of sync
4. No audit trail for Vercel deploys
```

### After (Automated, Safe)
```
1. Push to GitHub
2. ✅ That's it! Everything else is automatic
3. Both deployments happen together
4. Complete audit trail in GitHub Actions
```

## Monitoring Points

### 1. GitHub Actions Dashboard
```
URL: github.com/ShamrocksStocks/shamrockstocks.github.io/actions
View: 
  • Workflow runs
  • Success/failure status
  • Deployment logs
  • Timing information
```

### 2. Site Verification
```
Frontend: curl https://tradehax.net
Backend:  curl https://your-app.vercel.app/api/health
Script:   npm run verify:deployment
```

### 3. Git History
```
git log --oneline --graph
Shows: All deployments with commit messages
```

## Failure Handling

```
If frontend deploy fails:
  ↓
Backend deploy still continues
  ↓
Both logged independently
  ↓
Fix and push again (automatic retry)
```

## Summary

This architecture ensures:
- ✅ All code flows through GitHub
- ✅ No deployment drift
- ✅ Automated and reliable
- ✅ Easy to monitor and debug
- ✅ Complete audit trail
- ✅ Frontend and backend stay in sync
