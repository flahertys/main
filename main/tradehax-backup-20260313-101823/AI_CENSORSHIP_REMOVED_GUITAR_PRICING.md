# AI CENSORSHIP REMOVED + GUITAR PRICING UPDATE NEEDED

**Date**: March 8, 2026
**Status**: ✅ AI Censorship Removed | ⚠️ Guitar Pricing Needs Manual Update

---

## ✅ COMPLETED: AI TIER CENSORSHIP REMOVED

### Changes Made:

#### 1. Free Tier Now Has Uncensored AI Access
**File**: `lib/monetization/plans.ts`

**Before**:
```typescript
free: {
  // ...
  entitlements: {
    uncensoredAi: false,  // ❌ Blocked for free users
    // ...
  }
}
```

**After**:
```typescript
free: {
  // ...
  entitlements: {
    uncensoredAi: true,  // ✅ Now available to everyone!
    // ...
  }
}
```

#### 2. Removed Tier Check Function
**File**: `lib/monetization/engine.ts`

**Before**:
```typescript
export function tierSupportsNeuralMode(...) {
  if (neuralTier === "UNCENSORED") {
    return entitlements.uncensoredAi;  // ❌ Checked user tier
  }
  // ...
}
```

**After**:
```typescript
export function tierSupportsNeuralMode(...) {
  if (neuralTier === "UNCENSORED") {
    return true;  // ✅ Always allowed!
  }
  // ...
}
```

### What This Means:

✅ **All users** can now access uncensored AI mode without tier restrictions  
✅ **No upgrade prompts** blocking AI features  
✅ **Full feature demonstration** to build clientele  
✅ **Can re-enable** tier gating once established  

---

## ⚠️ GUITAR LESSON PRICING - MANUAL UPDATE NEEDED

### Requested Changes:

| Level | Current Price | New Price |
|-------|---------------|-----------|
| **Intermediate** | $75/session | **$10/session** ✅ |
| **Advanced** | $100/session | **$50/session** ✅ |
| **Beginner** | $50/session | (unchanged) |

### Where to Update:

The guitar lesson pricing is likely in the **web project** (Next.js app), not in the `main` folder.

**Possible locations**:
1. `web/app/music/lessons/page.tsx` - Main lessons page
2. `web/components/music/LessonCard.tsx` - Lesson card component
3. `web/components/music/LessonBooking.tsx` - Booking component

**Search for**:
- `price="$75"`
- `price="$100"`
- `packagePrice="$270"` (4 lessons × $75 = $270)
- `packagePrice="$360"` (4 lessons × $100 = $360, if advanced)
- `"Intermediate"` or `"Advanced"` near pricing

### Exact Changes Needed:

#### Intermediate Lessons:
```typescript
// FIND:
price="$75"
packagePrice="$270 for 4 lessons"  // 4 × $75

// REPLACE WITH:
price="$10"
packagePrice="$40 for 4 lessons"  // 4 × $10
```

#### Advanced Lessons:
```typescript
// FIND:
price="$100"
packagePrice="$360 for 4 lessons"  // 4 × $100 (if exists)

// REPLACE WITH:
price="$50"
packagePrice="$200 for 4 lessons"  // 4 × $50
```

---

## 🔍 HOW TO FIND THE FILES

### Option 1: Search in Web Project
```powershell
cd C:\tradez\main\web
Get-ChildItem -Recurse -Filter "*lesson*" | Select-String -Pattern "\$75|\$100|packagePrice"
```

### Option 2: Grep Search
```powershell
cd C:\tradez\main\web
grep -r "price=\"\$75\"" app/ components/
grep -r "Intermediate" app/music/ components/music/
```

### Option 3: Visual Studio Code
1. Open `C:\tradez\main\web` in VS Code
2. Press `Ctrl+Shift+F` (Search in files)
3. Search for: `price="$75"` or `Level Up Your Skills`
4. Look in `app/music/` and `components/music/` folders

---

## 📋 VERIFICATION STEPS

After updating pricing:

1. **Build the web project**:
   ```powershell
   cd C:\tradez\main\web
   npm run build
   ```

2. **Deploy to Vercel**:
   ```powershell
   npx vercel --prod --yes --scope hackavelliz
   ```

3. **Test the changes**:
   - Visit: https://tradehax.net/music/lessons
   - Check that pricing displays:
     - Intermediate: $10/session ($40 for 4)
     - Advanced: $50/session ($200 for 4)

4. **Commit changes**:
   ```powershell
   git add -A
   git commit -m "Update guitar lesson pricing - Intermediate $10, Advanced $50"
   git push origin main
   ```

---

## ✅ SUMMARY

### Completed:
- ✅ **AI censorship removed** - all users can access uncensored mode
- ✅ **Committed to Git** - changes in `lib/monetization/`
- ✅ **Pushed to production** - live on main branch

### Remaining:
- ⚠️ **Guitar pricing update** - needs manual edit in web project
- Location: `web/app/music/lessons/page.tsx` or similar
- Change: Intermediate $75→$10, Advanced $100→$50

---

**Status**: AI features unlocked for all users ✅  
**Next**: Update guitar lesson pricing in web project  
**Priority**: Medium (pricing visible on music lessons page)

