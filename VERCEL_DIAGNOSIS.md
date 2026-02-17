# Vercel + Namecheap Deployment Diagnostics

## Your Current Setup
- **Repository:** GitHub (DarkModder33/main)
- **Host:** Vercel
- **Domains:** tradehaxai.tech, tradehax.net (via Namecheap DNS)

---

## 🔍 Diagnostic Checklist

### 1. Is Vercel Connected to GitHub?
**Check in Vercel Dashboard:**
1. Login to [vercel.com](https://vercel.com)
2. Go to your project
3. Settings → Git Integration
4. Should show: "Connected to GitHub repository: DarkModder33/main"

If NOT connected:
- Go to Project Settings → Git
- Click "Connect Git Repository"
- Select your repo: `DarkModder33/main`

### 2. Are DNS Records Pointing to Vercel?
**Check in Namecheap DNS:**
1. Login to [namecheap.com](https://namecheap.com)
2. Go to Domain → DNS Records
3. Look for CNAME or A records pointing to Vercel

**Should look like:**
- `tradehaxai.tech` → CNAME → `cname.vercel-dns.com` (or Vercel's nameservers)
- `tradehax.net` → CNAME → `cname.vercel-dns.com` (or Vercel's nameservers)

If NOT configured:
- In Vercel dashboard, go to Domains
- Add your domain and follow Vercel's DNS setup wizard
- Update Namecheap DNS records with Vercel's nameservers

### 3. Check Recent Deployments in Vercel
1. Go to [vercel.com](https://vercel.com) → Your Project
2. Click "Deployments" tab
3. Should show recent deployments with timestamps
4. Click each one to see build logs

**If build is failing:**
- Click the failed deployment
- Look at "Build Logs" section
- Common issues:
  - Missing environment variables
  - Build errors in code
  - Dependency conflicts

### 4. Check Build Settings in Vercel
**Settings → Build & Development Settings:**
- Build Command: Should be `npm run build` (or let Vercel detect)
- Output Directory: Should be `.next` or auto-detected
- Install Command: Should be `npm install` (or auto-detected)

### 5. Environment Variables in Vercel
**Settings → Environment Variables:**
Should include (if needed for your app):
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SOLANA_NETWORK`
- Any other `NEXT_PUBLIC_*` variables from `.env.example`

---

## 🚀 How It Should Work

When you push to `main`:
1. ✅ GitHub notifies Vercel of new commit
2. ✅ Vercel clones your repo
3. ✅ Vercel runs `npm run build`
4. ✅ Build output deployed to Vercel CDN
5. ✅ DNS points domains to Vercel
6. ✅ Changes live in 1-2 minutes

---

## 🐛 Troubleshooting: Changes Not Appearing

### Step 1: Verify Git Push Succeeded
```bash
git status
# Should show: "Your branch is up to date with 'origin/main'"

git log --oneline -3
# Should show your recent commits
```

### Step 2: Check Vercel Saw the Push
1. Go to Vercel Dashboard → Your Project
2. Go to "Deployments" tab
3. Should see a new deployment triggered 1-2 minutes after your push
4. If NO new deployment:
   - Git integration not connected
   - Wrong branch (check you pushed to `main`)
   - Webhook issue

### Step 3: Check if Build Succeeded
1. Click the deployment in Vercel
2. Look for "✅ Deployment Complete" or "❌ Build Failed"
3. If failed, click "Build Logs" and look for errors

### Step 4: Clear Cache
```bash
# Hard refresh browser (depends on OS)
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R

# Or use DevTools
F12 → Application tab → Clear Site Data
```

### Step 5: Check DNS Resolution
```bash
# Verify domains point to Vercel
nslookup tradehaxai.tech
nslookup tradehax.net

# Should resolve to Vercel IP (usually 76.76.19.* or similar)
```

### Step 6: Check Vercel Domain Status
In Vercel Dashboard:
1. Go to Settings → Domains
2. Each domain should show: "✅ Valid Configuration"
3. If "❌ Invalid Configuration":
   - Follow Vercel's DNS setup instructions
   - Update Namecheap DNS records
   - Wait 24-48 hours for propagation

---

## 📋 Step-by-Step: Enable Auto-Deploy

If Vercel isn't auto-deploying:

### In Vercel Dashboard:
1. Go to your project
2. Settings → Git Integration
3. Change "Deploy on Push" from off to ON
4. Select branch: `main`
5. Save

### In Namecheap:
1. Login and go to Domain
2. Click "Advanced DNS"
3. Add/update Vercel nameservers (Vercel will provide them)
4. Remove old nameservers
5. Save

### Verify It Works:
```bash
# Make a test change
echo "<!-- test -->" >> app/page.tsx

# Commit and push
git add .
git commit -m "test: verify auto-deploy"
git push origin main

# Watch Vercel Dashboard for deployment (1-2 min)
# Check your domain in browser (5-10 min after deployment)
```

---

## 🔗 Important Links

- **Vercel Dashboard:** https://vercel.com
- **Namecheap Account:** https://namecheap.com
- **Vercel DNS Setup:** https://vercel.com/docs/projects/domains/configure-a-custom-domain
- **GitHub Integration:** https://vercel.com/docs/git/github

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| New deployments not triggering | Check Git Integration connected in Vercel |
| Build fails silently | Check Vercel Deployments tab for errors |
| Domain shows old content | Hard refresh browser + check DNS |
| DNS not resolving | Check Namecheap records point to Vercel |
| 404 after deploy | Check build output directory in Vercel settings |

---

## Next Steps

1. **Verify Vercel Git Integration** is connected (most likely issue)
2. **Check recent deployments** in Vercel Dashboard
3. **Compare timestamps**: Does new deployment show after your push?
4. **If no new deployment**: Re-connect GitHub integration
5. **If build fails**: Check build logs for errors
6. **If DNS issue**: Follow Vercel's domain setup wizard
