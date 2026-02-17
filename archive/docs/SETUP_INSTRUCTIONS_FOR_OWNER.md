# Setup Instructions for Repository Owner

## ✅ What's Been Completed

All code, workflows, documentation, and tools have been implemented and committed to the `copilot/ensure-push-to-shamrockstocks` branch.

## 🎯 What You Need to Do

### Step 1: Merge This PR

Once you review and approve this PR, merge it to the `main` branch.

### Step 2: Add GitHub Secret for Vercel

1. **Generate Vercel Token**:
   - Go to: https://vercel.com/account/tokens
   - Click "Create Token"
   - Name it: `GitHub Actions Deployment Token`
   - Scope: Select appropriate scope (Full Account or specific project)
   - Copy the token (you'll only see it once!)

2. **Add to GitHub Repository**:
   - Go to: https://github.com/ShamrocksStocks/shamrockstocks.github.io/settings/secrets/actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Paste the token from step 1
   - Click "Add secret"

### Step 3: Link Vercel Project (If Not Already Done)

```bash
# Navigate to backend directory
cd tradehax-backend

# Link to Vercel project
vercel link

# Follow the prompts:
# - Set up and deploy? N (we'll use GitHub Actions)
# - Link to existing project? Y (if exists) or N (to create new)
# - Project name: tradehax-backend (or your preferred name)
```

This creates a `.vercel` directory locally (which is gitignored).

### Step 4: Configure Vercel Environment Variables

If you haven't already set up environment variables in Vercel:

**Option A: Automated Setup (Recommended)**
```bash
bash setup-vercel-env.sh
```

**Option B: Manual Setup**
```bash
vercel env add SHAMROCK_MINT production
vercel env add AUTHORITY_SECRET production
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
# Add other optional variables as needed
```

### Step 5: Test the Deployment

Make a small test change and push to main:

```bash
# Create a safe test file
echo "<!-- Deployment test $(date) -->" > .deploy-test

# Commit and push
git add .deploy-test
git commit -m "Test automated deployment"
git push origin main

# After successful deployment, remove the test file
git rm .deploy-test
git commit -m "Remove deployment test file"
git push origin main
```

### Step 6: Monitor the Deployment

1. **Watch GitHub Actions**:
   - Go to: https://github.com/ShamrocksStocks/shamrockstocks.github.io/actions
   - You should see workflows running
   - Check for green checkmarks ✅

2. **Verify Frontend**:
   - Visit: https://tradehax.net
   - Should show your latest changes
   - Check browser console for errors

3. **Verify Backend** (if backend files changed):
   - Get your Vercel URL from Vercel dashboard
   - Test health endpoint: `curl https://your-project.vercel.app/api/health`
   - Should return: `{"status": "ok", ...}`

### Step 7: Run Verification Script

```bash
# Run the verification script
npm run verify:deployment

# Should show:
# ✅ Working tree is clean
# ✅ On main branch
# ✅ Frontend is accessible
# ✅ Backend is healthy (if VERCEL_URL set)
```

## 🎉 You're Done!

Once all steps are complete, your deployment system will:
- ✅ Automatically deploy frontend to GitHub Pages → tradehax.net
- ✅ Automatically deploy backend to Vercel
- ✅ Keep everything synchronized
- ✅ Maintain complete version control audit trail

## 📚 Documentation References

- **Comprehensive Guide**: [DEPLOYMENT_SYNC_GUIDE.md](./DEPLOYMENT_SYNC_GUIDE.md)
- **Quick Reference**: [DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md)
- **Architecture Diagrams**: [DEPLOYMENT_FLOW_DIAGRAM.md](./DEPLOYMENT_FLOW_DIAGRAM.md)
- **Implementation Details**: [DEPLOYMENT_SYNC_IMPLEMENTATION.md](./DEPLOYMENT_SYNC_IMPLEMENTATION.md)

## 🔧 Troubleshooting

### "Workflow failed" in GitHub Actions
- Check if `VERCEL_TOKEN` secret is set correctly
- Verify token has appropriate permissions
- Check workflow logs for specific errors

### Frontend not updating
- Verify GitHub Pages is enabled in repository settings
- Check that `CNAME` file points to `tradehax.net`
- Clear browser cache and hard refresh

### Backend not deploying
- Ensure `tradehax-backend/vercel.json` exists
- Verify Vercel project is linked
- Check that Vercel environment variables are set

### "Not authorized" errors
- Regenerate Vercel token with correct permissions
- Update `VERCEL_TOKEN` secret in GitHub

## 💡 Pro Tips

1. **Feature Branches**: Use feature branches for development, PR to main for review
2. **Monitor First Deployment**: Watch the first deployment closely to catch any issues
3. **Commit Messages**: Use clear messages - they appear in deployment logs
4. **Regular Updates**: Keep dependencies updated for security

## 📞 Need Help?

- Check the troubleshooting section in [DEPLOYMENT_SYNC_GUIDE.md](./DEPLOYMENT_SYNC_GUIDE.md)
- Review GitHub Actions logs for detailed error messages
- Verify all environment variables are set correctly

## ⏱️ Time Estimates

- Merging PR: 1 minute
- Adding GitHub secret: 2 minutes
- Linking Vercel project: 3 minutes
- Setting environment variables: 5-15 minutes (depending on method)
- First deployment test: 5 minutes
- **Total**: 15-30 minutes

After this one-time setup, all future deployments are automatic! 🚀
