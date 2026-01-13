# Deployment Guide

This repository contains two separate deployments:

## 🌐 Solana dApp Frontend (Vercel)

The Next.js Solana Counter dApp is deployed to Vercel.

### Current Deployment
- **URL**: https://anchor-web3js-nextjs-a9sl.vercel.app/

### Deployment Settings

When deploying to Vercel:

1. **Root Directory**: Set to `frontend`
2. **Framework Preset**: Next.js
3. **Build Command**: `pnpm build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `pnpm install` (default)

### Environment Variables

No environment variables are required for the basic deployment. The app is configured for Solana devnet by default.

### Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDarkModder33%2Fmain&root-directory=frontend&project-name=solana-counter-dapp&repository-name=solana-counter-dapp)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel
```

### Custom Program Deployment

If you deploy your own program to Solana:

1. Build and deploy the program:
   ```bash
   cd program
   anchor build
   anchor keys sync
   anchor build
   anchor deploy
   ```

2. Update the IDL files in the frontend:
   ```bash
   cp ../program/target/idl/counter.json frontend/anchor-idl/idl.json
   cp ../program/target/types/counter.ts frontend/anchor-idl/idl.ts
   ```

3. Commit and push the changes to trigger a new Vercel deployment.

## 📄 Portfolio Website (GitHub Pages)

The portfolio website (resume viewer) is deployed to GitHub Pages.

### Current Deployment
- **URL**: https://tradehax.net

### Automatic Deployment

The site deploys automatically when changes are pushed to the `main` branch via GitHub Actions.

**Workflow**: `.github/workflows/static.yml`

### Manual Deployment Steps

1. **Ensure your changes are on the `main` branch**

   ```bash
   git checkout main
   git merge your-feature-branch
   ```

2. **Push to GitHub**

   ```bash
   git push origin main
   ```

3. **Wait for GitHub Actions to complete**
   - Visit your repository on GitHub
   - Click the "Actions" tab
   - Monitor the "Deploy static content to Pages" workflow

4. **Verify deployment**
   - Visit https://tradehax.net
   - Changes should appear within 1-2 minutes

### Custom Domain Configuration

The custom domain `tradehax.net` is configured via the `CNAME` file in the repository root.

**DNS Configuration (Squarespace):**

Add these DNS records in your Squarespace domain settings:

1. **A Records** (for apex domain):
   ```
   Type: A
   Host: @
   Points to: 185.199.108.153
   
   Type: A
   Host: @
   Points to: 185.199.109.153
   
   Type: A
   Host: @
   Points to: 185.199.110.153
   
   Type: A
   Host: @
   Points to: 185.199.111.153
   ```

2. **CNAME Record** (for www subdomain):
   ```
   Type: CNAME
   Host: www
   Points to: darkmodder33.github.io
   ```

DNS propagation can take 24-48 hours but usually completes within a few hours.

## 🔧 Development Workflow

### Working on Solana dApp

```bash
# Start local Solana validator (optional)
solana-test-validator

# Build and test program
cd program
anchor build
anchor test

# Run frontend locally
cd frontend
pnpm install
pnpm dev
# Visit http://localhost:3000
```

### Working on Portfolio

```bash
# Start local server
python3 -m http.server 8080
# Visit http://localhost:8080
```

## 🚨 Troubleshooting

### Vercel Deployment Issues

**Build fails**: Check that pnpm lockfile is up to date
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Runtime errors**: Check browser console for Solana connection issues. Ensure wallet is connected to devnet.

### GitHub Pages Issues

**404 errors**: Ensure `.nojekyll` file exists in root to bypass Jekyll processing

**Custom domain not working**: 
- Verify DNS propagation: `dig tradehax.net` or use https://dnschecker.org
- Check CNAME file contents
- Wait 24-48 hours for DNS propagation

**Workflow fails**: Check GitHub Actions logs for specific errors

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
