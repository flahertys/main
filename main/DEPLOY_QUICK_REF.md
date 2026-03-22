# 🚀 Quick Deployment Reference - Runtime Validation Patch

## TL;DR

**What:** Fixed provider failover so base/advanced modes use OpenAI when HuggingFace is down (instead of immediately falling to demo)  
**Files Changed:** 3 files (provider-runtime.ts, chat.ts, health.ts)  
**Breaking Changes:** None  
**Rollback:** Possible (revert git commit)

---

## One-Line Summary

✅ **"Strict key validation + robust provider failover = smarter AI provider selection"**

---

## Deploy Now (Prerequisites Met)

```powershell
cd C:\tradez\main\web
npm run deploy:net
```

**Time:** ~2-3 minutes  
**Rollback:** `git revert HEAD && npm run deploy:net`

---

## Verify After Deploy

```bash
# Health check
curl https://tradehax.net/api/ai/health | jq '.providers[] | {name, validated, reason}'

# Chat test
curl -X POST https://tradehax.net/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
# Should show provider: "huggingface" or "openai" (NOT "demo")
```

---

## What Changed (For Code Review)

| File | Change | Why |
|------|--------|-----|
| `provider-runtime.ts` | Added `isInvalidKeyFormat()` | Detect placeholder keys before API calls |
| `provider-runtime.ts` | Added `invalid_key_format` reason | Report invalid key format in health |
| `chat.ts` | Refactored provider selection | Try all providers before demo fallback |
| `chat.ts` | Added `[PROVIDER_FALLBACK]` logging | Diagnose provider issues in logs |
| `health.ts` | Added `invalid_key_format` type | Support new health report granularity |

---

## Key Behaviors After Deploy

| Scenario | Before | After |
|----------|--------|-------|
| HF down, OpenAI up, base mode | Falls to demo | Uses OpenAI ✅ |
| Both down, base mode | Falls to demo | Falls to demo (correct) |
| HF returns 401, HF key is placeholder | Returns invalid | Returns `invalid_key_format` ✅ |
| HF times out (network), OpenAI up | Falls to demo | Tries OpenAI ✅ |

---

## Monitoring Checklist

After deployment, verify:

```bash
# 1. Health endpoint works
curl -s https://tradehax.net/api/ai/health | jq '.status'
# Expected: "healthy" or "degraded" (not error)

# 2. Both providers show in health
curl -s https://tradehax.net/api/ai/health | jq '.providers | length'
# Expected: 3 (huggingface, openai, demo)

# 3. No invalid_key_format unless keys weren't rotated
curl -s https://tradehax.net/api/ai/health | jq '.providers[] | select(.reason == "invalid_key_format")'
# Expected: (empty - no results)

# 4. Chat endpoint returns non-demo provider
curl -s -X POST https://tradehax.net/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}' | jq '.provider'
# Expected: "huggingface" or "openai"

# 5. Logs show provider activity (not errors)
vercel logs --prod | grep -E 'HEALTH|AI_CHAT|provider' | head -10
# Expected: Normal health checks, NOT frequent errors
```

---

## Red Flags (Watch For These)

```
❌ [ERROR] No AI providers available
❌ reason: "invalid_key_format" (repeated)
❌ provider: "demo" (frequent, not just errors)
❌ All [PROVIDER_FALLBACK] failures
```

---

## Green Signals (All Good)

```
✅ reason: "ok" (for HF and OpenAI)
✅ validated: true (both providers)
✅ provider: "huggingface" or "openai" (chat responses)
✅ Sparse [PROVIDER_FALLBACK] logs (only errors)
```

---

## Immediate Actions If Problem

**Health endpoint down or errors:**
```bash
# Check Vercel deployment status
vercel status
vercel logs --prod | tail -50
```

**Chat always returns demo:**
```bash
# 1. Verify keys in Vercel
npx vercel env ls | grep -E 'HUGGINGFACE|OPENAI'

# 2. Check health endpoint
curl https://tradehax.net/api/ai/health

# 3. If not rotated, keys might be invalid
# Solution: Rotate keys, update Vercel env, redeploy
```

**Frequent [PROVIDER_FALLBACK] errors:**
```bash
# 1. Check provider status pages
# - https://status.huggingface.co/
# - https://status.openai.com/

# 2. Increase health check timeout if provider just slow:
# Add to vercel.json or env: AI_HEALTH_CHECK_HF_TIMEOUT_MS=6000

# 3. If persistent, investigate provider credentials/rate limits
```

---

## Rollback (If Needed)

```powershell
cd C:\tradez\main
# Revert to previous working commit
git log --oneline | head -5
git revert <COMMIT_HASH>  # hash of runtime validation patch commit
cd web
npm run deploy:net
```

---

## Questions?

**Q: Will this break existing integrations?**  
A: No. API responses are unchanged, just provider selection logic improved.

**Q: Why fallback to OpenAI instead of demo?**  
A: OpenAI is a real provider with real responses. Demo is generic fallback. Better to use real provider if available.

**Q: What if both providers are down?**  
A: Falls to demo (same as before). Demo mode is the safe last resort.

**Q: How long does this take to deploy?**  
A: ~2 minutes for deploy + ~5 minutes for Vercel to propagate. Test within 10 minutes.

---

## Success = 

✅ Deploy succeeds  
✅ Health endpoint shows both providers validated  
✅ Chat uses non-demo provider  
✅ Logs are clean (no errors)  
✅ Users get real AI responses (not demo)

**Timeline: Deploy now, verify in 10 minutes, done!**

---

Generated: March 21, 2026  
Ready: ✅ YES

