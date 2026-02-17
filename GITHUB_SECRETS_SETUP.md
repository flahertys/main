# GitHub Actions Setup for Vercel Deployment

## Overview
This guide explains how to set up the required GitHub Secrets for automated Vercel deployments via GitHub Actions.

## Required GitHub Secrets

The following secrets must be configured in your GitHub repository for the automated deployment workflow to function:

### 1. VERCEL_TOKEN

**What it is**: Authentication token for Vercel CLI to deploy on your behalf.

**How to get it**:
1. Log into [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your profile icon (top right) → **Settings**
3. Click **Tokens** in the left sidebar
4. Click **Create Token**
5. Give it a name: `GitHub Actions Deploy`
6. Select scope: `Full Account`
7. Click **Create Token**
8. **Copy the token immediately** (you won't see it again)

**How to add it**:
1. Go to your GitHub repository: https://github.com/DarkModder33/main
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Name: `VERCEL_TOKEN`
6. Value: [paste the token from Vercel]
7. Click **Add secret**

---

### 2. VERCEL_ORG_ID

**What it is**: Your Vercel organization/team ID.

**How to get it**:

**Method 1: From Vercel Dashboard**
1. Log into [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → General
3. Look for "Team ID" or "Organization ID"
4. Copy the value (format: `team_xxxxx` or similar)

**Method 2: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (run from your local repository directory)
cd /path/to/your/project
vercel link

# The command will create .vercel/project.json
# Open it and copy the "orgId" value
cat .vercel/project.json
```

**How to add it**:
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Name: `VERCEL_ORG_ID`
4. Value: [paste your org ID, e.g., `team_abc123xyz`]
5. Click **Add secret**

---

### 3. VERCEL_PROJECT_ID

**What it is**: Your specific Vercel project ID.

**How to get it**:

**Method 1: From Vercel Dashboard**
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project name
3. Go to Settings → General
4. Look for "Project ID"
5. Copy the value (format: `prj_xxxxx`)

**Method 2: Using Vercel CLI (Recommended)**
```bash
# Link your project (run from your local repository directory)
cd /path/to/your/project
vercel link

# Open the generated file
cat .vercel/project.json

# Copy the "projectId" value
```

The `.vercel/project.json` file will look like:
```json
{
  "orgId": "team_abc123xyz",
  "projectId": "prj_xyz789abc"
}
```

**How to add it**:
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Name: `VERCEL_PROJECT_ID`
4. Value: [paste your project ID, e.g., `prj_xyz789abc`]
5. Click **Add secret**

---

## Verification

After adding all three secrets, verify they are configured correctly:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. You should see three secrets listed:
   - ✅ `VERCEL_TOKEN`
   - ✅ `VERCEL_ORG_ID`
   - ✅ `VERCEL_PROJECT_ID`
3. Note: You cannot view the secret values after creation (security feature)

---

## Testing the Workflow

Once all secrets are configured, test the automated deployment:

1. Make a small change to any file (e.g., update README.md)
2. Commit and push to the main branch:
   ```bash
   git add .
   git commit -m "test: trigger deployment workflow"
   git push origin main
   ```
3. Go to GitHub repository → **Actions** tab
4. You should see the "Deploy to Vercel" workflow running
5. Click on it to view real-time logs
6. Wait for it to complete (usually 2-5 minutes)
7. If successful, your site should be updated at https://tradehaxai.tech

---

## Troubleshooting

### "VERCEL_TOKEN is not set" Error

**Symptom**: Workflow fails with error about missing VERCEL_TOKEN

**Solution**:
1. Verify the secret is named exactly `VERCEL_TOKEN` (case-sensitive)
2. Recreate the token in Vercel if needed
3. Ensure you copied the entire token value (no extra spaces)
4. Check token hasn't expired

### "Error: Invalid token" or "Unauthorized"

**Symptom**: Workflow fails with authentication error

**Solution**:
1. Token may have expired - create a new one
2. Ensure token scope is "Full Account" not "Limited"
3. Verify you're logged into correct Vercel account
4. Try logging out and back in to Vercel CLI: `vercel logout && vercel login`

### "Project not found" Error

**Symptom**: Workflow fails with error about project not existing

**Solution**:
1. Verify `VERCEL_PROJECT_ID` matches your actual project
2. Ensure project exists in Vercel dashboard
3. Re-run `vercel link` to get correct project ID
4. Verify you're using the organization ID where the project exists

### "Invalid org" or "Organization not found"

**Symptom**: Workflow fails with error about organization

**Solution**:
1. Verify `VERCEL_ORG_ID` is correct
2. Ensure you have access to the organization/team
3. If using personal account (not team), use your user ID instead
4. Check Vercel dashboard to confirm org structure

---

## Security Best Practices

### Protecting Your Secrets

1. **Never commit secrets to Git**
   - Keep `.env` files out of version control
   - Add `.env*` to `.gitignore`
   - Use GitHub Secrets for CI/CD

2. **Rotate tokens regularly**
   - Create new Vercel token every 3-6 months
   - Update GitHub Secret when rotating
   - Delete old tokens in Vercel dashboard

3. **Use minimal scope**
   - Only grant necessary permissions
   - Use project-specific tokens if available
   - Avoid using personal access tokens for team projects

4. **Monitor usage**
   - Check Vercel audit logs for unexpected deployments
   - Review GitHub Actions logs regularly
   - Set up alerts for failed deployments

### Managing Token Access

**Who has access to secrets?**
- Repository administrators
- Users with write access cannot view secrets
- Secrets are automatically masked in workflow logs

**Revoking access:**
1. Delete secret from GitHub: Settings → Secrets and variables → Actions
2. Delete token from Vercel: Dashboard → Settings → Tokens
3. Workflows will fail until new secrets are configured

---

## Alternative: Using Vercel GitHub Integration

Instead of managing tokens manually, you can use Vercel's official GitHub integration:

### Pros
- Automatic setup, no manual token management
- Preview deployments for pull requests
- Deployment comments on PRs
- Easier to set up for beginners

### Cons
- Less control over deployment process
- May have different deployment behavior
- Harder to customize deployment steps

### Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `DarkModder33/main`
4. Connect GitHub account if not already connected
5. Vercel will automatically deploy on push to main

**Note**: If using Vercel's GitHub integration, you may not need the GitHub Actions workflow, as Vercel will handle deployments automatically. However, the workflow provides more control and visibility.

---

## Maintenance

### Regular Checks
- [ ] Verify workflow runs successfully on each push
- [ ] Check Vercel dashboard shows automatic deployments
- [ ] Monitor deployment times (should be consistent)
- [ ] Review workflow logs for warnings

### When to Update Secrets
- Token expires (Vercel tokens can be set to expire)
- Project or organization changes
- Security incident or token compromise
- Migrating to different Vercel account

### Documentation Updates
When you make changes to the deployment process:
1. Update this file with any new secrets or steps
2. Document any workflow changes
3. Update troubleshooting section with new issues
4. Keep examples current with actual values (redacted)

---

## Additional Resources

- **Vercel CLI Documentation**: https://vercel.com/docs/cli
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Vercel API Tokens**: https://vercel.com/docs/rest-api/authentication
- **GitHub Encrypted Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## Quick Reference

### Commands for Getting IDs

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (creates .vercel/project.json)
vercel link

# View project info
cat .vercel/project.json

# List all projects
vercel projects ls

# Get org info
vercel teams ls
```

### File Locations

- **GitHub Secrets**: Repository Settings → Secrets and variables → Actions
- **Vercel Tokens**: Vercel Dashboard → Settings → Tokens  
- **Workflow File**: `.github/workflows/vercel-deploy.yml`
- **Vercel Config**: `vercel.json`
- **Local Vercel Data**: `.vercel/project.json` (not committed to git)

---

**Last Updated**: 2026-01-28  
**Status**: Production Ready  
**Required For**: Automated Vercel deployments via GitHub Actions
