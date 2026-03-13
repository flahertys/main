# ⚠️ GUITAR LESSON PRICING - UPDATE REQUIRED

**Date:** March 8, 2026  
**Status:** ⚠️ NOT YET UPDATED - FILES NOT IN CURRENT REPOSITORY  
**Action Required:** Manual update in Next.js application

---

## 🔍 SITUATION

The guitar lesson pricing files are in a **separate Next.js application** repository, not in the current `C:\tradez\main` folder.

The semantic search found these files:
- `c:\tradez\app\music\lessons\page.tsx`
- `c:\tradez\components\music\LessonCard.tsx`

But they are not accessible in `C:\tradez\main\` - they're likely in:
- `C:\tradez\` (parent directory, different repo)
- OR a separate Next.js project
- OR the files need to be created/deployed separately

---

## 📝 REQUIRED PRICE CHANGES

### Current Prices → New Prices:

| Level | Current | New | Package (4 lessons) |
|-------|---------|-----|---------------------|
| **Beginner** | $50 | $50 (unchanged) | $180 (unchanged) |
| **Intermediate** | **$75** | **$10** ✅ | $270 → **$40** |
| **Advanced** | **$100** | **$50** ✅ | $360 → **$200** |

---

## 🔧 HOW TO UPDATE (When Files Are Located)

### Option 1: If Files Are in `C:\tradez\app\music\lessons\`

```powershell
# Navigate to the Next.js app root
cd C:\tradez

# Search for the lesson pricing files
Get-ChildItem -Recurse -Filter "*lesson*.tsx" | Select-String "\$75|\$100"
```

Then edit the found files:

**File**: `app/music/lessons/page.tsx` (or similar)

```typescript
// FIND:
<LessonCard
  title="Level Up Your Skills"
  level="Intermediate"
  price="$75"                          // ← CHANGE TO "$10"
  packagePrice="$270 for 4 lessons"    // ← CHANGE TO "$40 for 4 lessons"
  features={[...]}
/>

<LessonCard
  title="Master the Craft"
  level="Advanced"
  price="$100"                         // ← CHANGE TO "$50"
  packagePrice="$360 for 4 lessons"    // ← CHANGE TO "$200 for 4 lessons"  
  features={[...]}
/>
```

### Option 2: If Files Are in a Different Repository

1. **Locate the repository**:
   ```powershell
   # Check if there's a separate Next.js app
   Get-ChildItem C:\tradez -Directory
   ```

2. **Find the lesson files**:
   ```powershell
   cd C:\tradez\[nextjs-app-folder]
   Get-ChildItem -Recurse -Filter "*LessonCard*" 
   ```

3. **Make the changes** as shown in Option 1

4. **Deploy**:
   ```powershell
   npm run build
   npx vercel --prod --yes
   ```

---

## 🎯 EXACT CODE CHANGES

### In `LessonCard.tsx` or `page.tsx`:

**Intermediate Lesson**:
```diff
- price="$75"
+ price="$10"

- packagePrice="$270 for 4 lessons"
+ packagePrice="$40 for 4 lessons"
```

**Advanced Lesson**:
```diff
- price="$100"
+ price="$50"

- packagePrice="$360 for 4 lessons"  
+ packagePrice="$200 for 4 lessons"
```

---

## ✅ AI CENSORSHIP STATUS

**Status:** ✅ **COMPLETED & DEPLOYED**

The AI tier censorship has been successfully removed:
- Free tier users can use uncensored AI mode
- No upgrade prompts blocking features
- Changes pushed, committed, and deployed to production

**Files Updated:**
- `lib/monetization/plans.ts` ✅
- `lib/monetization/engine.ts` ✅

---

## 🚀 DEPLOYMENT CHECKLIST

### For AI Censorship (✅ DONE):
- [x] Remove tier restriction in `plans.ts`
- [x] Update `tierSupportsNeuralMode()` function  
- [x] Commit changes
- [x] Push to GitHub
- [x] Deploy to Vercel
- [x] Verify in production

### For Guitar Pricing (⚠️ TODO):
- [ ] Locate the Next.js app with lesson files
- [ ] Find `app/music/lessons/page.tsx` or similar
- [ ] Update Intermediate: $75 → $10
- [ ] Update Advanced: $100 → $50
- [ ] Update package prices accordingly
- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Deploy to production
- [ ] Verify on live site

---

## 📍 LIKELY FILE LOCATIONS

Based on the semantic search results, check these paths:

1. **`C:\tradez\app\music\lessons\page.tsx`**
   - Main lessons page with pricing cards

2. **`C:\tradez\components\music\LessonCard.tsx`**
   - Reusable lesson card component

3. **`C:\tradez\app\music\page.tsx`**
   - Music hub page with lesson previews

4. **`C:\tradez\components\music\LessonBooking.tsx`**
   - Booking component (may reference pricing)

---

## 🔍 SEARCH COMMANDS

```powershell
# From C:\tradez\ (parent directory)
Get-ChildItem -Recurse -Include "*.tsx","*.jsx" | Select-String -Pattern "\`$75|\`$270|\`$100|\`$360" | Select-Object Path, LineNumber, Line

# Or use grep
cd C:\tradez
grep -r "price.*75\|price.*100" app/ components/ --include="*.tsx"

# Find lesson-related files
Get-ChildItem -Recurse -Filter "*lesson*" -Include "*.tsx","*.jsx"
```

---

## ⚠️ IMPORTANT NOTE

The guitar lesson pricing is in a **separate application** from the current `C:\tradez\main` codebase where we deployed the AI censorship removal.

**Two options:**
1. **Update the files manually** when you locate the Next.js app
2. **Provide access** to the correct repository and I can update them

---

## 📊 SUMMARY

| Task | Status | Location |
|------|--------|----------|
| **AI Censorship Removal** | ✅ DONE | `C:\tradez\main\lib\monetization\` |
| **Guitar Pricing Update** | ⚠️ PENDING | Separate Next.js app (not in `main/`) |
| **Documentation** | ✅ DONE | This file + AI_CENSORSHIP_REMOVED_GUITAR_PRICING.md |

---

**Next Steps:**
1. Locate the Next.js application with lesson files
2. Update pricing as documented above
3. Commit, push, and deploy that application

**Current Status:** AI features unlocked ✅ | Guitar pricing awaiting manual update ⚠️

