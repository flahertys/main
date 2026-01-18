# shamrockstocks.github.io

TradeHax - Professional device repair, guitar lessons, and web development services.

## 🚀 Quick Start

### Vercel Deployment & API Keys

Need to set up your Vercel app with API keys? See:

- **[VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md)** - Complete guide with step-by-step instructions for all API keys
- **[QUICK_API_REFERENCE.md](./QUICK_API_REFERENCE.md)** - Quick reference card for essential API keys
- **[.env.vercel.template](./.env.vercel.template)** - Template file with all environment variables

#### Automated Setup (Recommended)

Use our setup scripts to configure Vercel environment variables interactively:

```bash
# For macOS/Linux/WSL
bash setup-vercel-env.sh

# For Windows PowerShell
pwsh setup-vercel-env.ps1
```

#### Manual Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod

# Add environment variables
vercel env add SHAMROCK_MINT
vercel env add AUTHORITY_SECRET
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

See [VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md) for detailed instructions on obtaining each API key.

## 📚 Documentation

### Deployment & DevOps
- **[DEPLOYMENT_SYNC_GUIDE.md](./DEPLOYMENT_SYNC_GUIDE.md)** - 🆕 GitHub-first deployment strategy (frontend + backend)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete Solana and token setup
- [VERCEL_API_SETUP.md](./VERCEL_API_SETUP.md) - Vercel environment variables setup

### Backend & APIs
- [backend/README.md](./backend/README.md) - Backend API documentation
- [tradehax-backend/README.md](./tradehax-backend/README.md) - TradeHax game backend
- [SHAMROCK_SETUP.md](./SHAMROCK_SETUP.md) - SHAMROCK token configuration

### Quick References
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [QUICK_API_REFERENCE.md](./QUICK_API_REFERENCE.md) - API keys cheat sheet

## Developer setup: Git hooks

This repository includes a `.githooks` directory with a sample `pre-commit` hook used to regenerate image assets before committing.

To enable hooks for your local clone, run the appropriate installer below from the repository root:

- Windows / PowerShell:

```powershell
pwsh .\scripts\install-hooks.ps1
```

- POSIX (macOS / Linux / WSL):

```bash
sh ./scripts/install-hooks.sh
```

Or set the config manually:

```bash
git config core.hooksPath .githooks
git add .githooks/pre-commit
git update-index --chmod=+x .githooks/pre-commit
```

The installer scripts are idempotent and safe to re-run.

## 🚀 Deployment Workflow

This repository uses a **GitHub-first deployment strategy** that ensures all code is committed to GitHub before deploying to production:

```
Push to main → GitHub Actions → Frontend (GitHub Pages) + Backend (Vercel)
                                           ↓
                                    tradehax.net
```

### Automatic Deployments

When you push to the `main` branch:
- ✅ Frontend changes deploy to **GitHub Pages** → `tradehax.net`
- ✅ Backend changes deploy to **Vercel** → API endpoints
- ✅ All changes are version controlled in GitHub
- ✅ No manual Vercel deployments needed

### Required GitHub Secrets

For automated Vercel deployment, add these secrets in **Settings → Secrets → Actions**:
- `VERCEL_TOKEN` - Generate from https://vercel.com/account/tokens

See **[DEPLOYMENT_SYNC_GUIDE.md](./DEPLOYMENT_SYNC_GUIDE.md)** for complete setup instructions.

### Development Workflow

```bash
# Make changes
git add .
git commit -m "Add feature"

# Push to main (triggers automatic deployment)
git push origin main

# Or use feature branches + PR for review
git checkout -b feature/my-feature
git push origin feature/my-feature
# Create PR → Merge to main → Auto-deploy
```
