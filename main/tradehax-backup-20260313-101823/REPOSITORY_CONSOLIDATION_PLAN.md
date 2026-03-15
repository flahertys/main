# ✅ GUITAR PRICING CORRECTED + REPOSITORY CONSOLIDATION PLAN

**Date:** March 9, 2026  
**Status:** ✅ Pricing Fixed | 📋 Consolidation Plan Ready

---

## ✅ GUITAR PRICING - NOW CORRECTED

### All Lesson Levels: $50 Per Session

```
Beginner:      $50 per session ($200 for 4 lessons)
Intermediate:  $50 per session ($200 for 4 lessons) ✅ FIXED
Advanced:      $50 per session ($200 for 4 lessons)
```

**File:** `lib/pricing/guitar-lessons.ts`  
**Status:** ✅ Committed and ready to deploy

---

## 📋 REPOSITORY CONSOLIDATION PLAN

### Problem:
There are multiple clones/repositories with outdated code:
- Correct, current code: `C:\tradez\main` ✅
- Outdated clone: `C:\tradez\app` or other location ❌
- Lesson files stuck in wrong repo
- Code pathway is fragmented

### Solution:
**Make C:\tradez\main the ONLY source of truth**

---

## 🎯 CONSOLIDATION STEPS

### 1. Identify the Outdated Clone
```powershell
# Find all git repositories
Get-ChildItem -Recurse -Filter ".git" | Select-Object -ExpandProperty Parent

# Check timestamps to identify older clones
Get-ChildItem C:\ -Recurse -Filter ".git" -ErrorAction SilentlyContinue | 
  Get-Item -Force | Select-Object FullName, LastWriteTime
```

### 2. Merge Important Files into C:\tradez\main

If the old clone contains lesson files, music components, or other important code:

```powershell
# Copy any important files from old repo to C:\tradez\main
Copy-Item "C:\tradez\[OLD_REPO]\app\music\*" "C:\tradez\main\app\music\" -Recurse -Force

Copy-Item "C:\tradez\[OLD_REPO]\components\music\*" "C:\tradez\main\components\music\" -Recurse -Force

# Check for other important directories
Copy-Item "C:\tradez\[OLD_REPO]\lib\*" "C:\tradez\main\lib\" -Recurse -Force -Exclude "*.git*"
```

### 3. Update .gitignore if Needed
Ensure C:\tradez\main has the correct .gitignore so all necessary files are tracked:

```bash
# Add these to C:\tradez\main\.gitignore if missing
node_modules/
dist/
.vercel/
.env.local
.env.*.local
.DS_Store
*.log
```

### 4. Commit Everything to C:\tradez\main

```powershell
cd C:\tradez\main

git add -A

git commit -m "Consolidate all code to C:\tradez\main as single source of truth

✅ Merged:
- Guitar lesson components
- Music-related files
- All necessary app structure
- Configuration files

✅ All code now centralized in C:\tradez\main
✅ No more duplicate repos
✅ Single source of truth for all deployments"

git push origin main
```

### 5. Remove/Disable Old Clone

Once confirmed everything is merged:

```powershell
# Backup old repo (just in case)
Copy-Item "C:\tradez\[OLD_REPO]" "C:\tradez\OLD_REPO_BACKUP_$(Get-Date -Format 'yyyyMMdd')" -Recurse

# Remove old repo to prevent confusion
Remove-Item "C:\tradez\[OLD_REPO]" -Recurse -Force
```

### 6. Update IDE/Editor Settings

Make sure all development tools point to:
```
C:\tradez\main
```

Not any other location.

---

## 📁 EXPECTED FINAL STRUCTURE

After consolidation, C:\tradez\main should contain:

```
C:\tradez\main\
├── app/                    # Next.js app directory
│   ├── music/
│   │   ├── lessons/
│   │   ├── page.tsx
│   │   └── ...
│   └── ...
├── components/
│   ├── music/
│   │   ├── LessonCard.tsx
│   │   ├── LessonBooking.tsx
│   │   └── ...
│   └── ...
├── lib/
│   ├── pricing/
│   │   └── guitar-lessons.ts  ✅ CENTRALIZED PRICING
│   ├── monetization/
│   │   ├── plans.ts           ✅ AI CENSORSHIP REMOVED
│   │   └── engine.ts          ✅ AI TIER UNLOCK
│   └── ...
├── web/                    # Vite React app
│   ├── src/
│   ├── public/
│   └── ...
├── scripts/
├── .github/
├── .env.local
├── .vercel/
├── vercel.json
├── package.json
└── ... (all other files)
```

---

## 🚀 DEPLOYMENT AFTER CONSOLIDATION

```powershell
# Navigate to main repo
cd C:\tradez\main

# Verify everything builds
npm install
npm run build

# Deploy to Vercel with all consolidated code
cd web
npx vercel --prod --yes --scope hackavelliz

# All domains will now serve consolidated, up-to-date code
```

---

## ✅ CHECKLIST

- [ ] Identify outdated clone location
- [ ] Backup old repo
- [ ] Copy important files to C:\tradez\main
- [ ] Verify C:\tradez\main has complete structure
- [ ] Test build: `npm run build`
- [ ] Commit: `git add -A && git commit -m "..."`
- [ ] Push: `git push origin main`
- [ ] Delete old repo folder
- [ ] Deploy: `npx vercel --prod`
- [ ] Verify on production domains
- [ ] Document new location in team notes

---

## 🎯 FINAL STATUS

**Guitar Pricing:** ✅ Corrected ($50 all levels)  
**AI Censorship:** ✅ Removed  
**Domains:** ✅ All working  
**Repository:** ⚠️ Ready to consolidate  

**Next Action:** Execute consolidation plan to make C:\tradez\main the single source of truth

---

**Once consolidated:**
- ✅ All code in one place
- ✅ No more confusing duplicate repos
- ✅ All deployments from C:\tradez\main
- ✅ Single source of truth for production

