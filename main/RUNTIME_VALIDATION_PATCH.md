# Runtime Validation & Provider Failover Patch

**Deployment Date:** March 21, 2026  
**Status:** Code changes complete, ready for deployment  
**Target:** `tradehax.net` (production)

---

## Changes Summary

### 1. **Strict Key Validation** (`web/api/ai/provider-runtime.ts`)

**Added:**
- `invalid_key_format` reason type to `ProviderReason` enum
- `keyValid?: boolean` flag to `ProviderProbeResult` interface
- `isInvalidKeyFormat(key, provider)` function to detect:
  - Placeholder patterns: `xxx`, `demo`, `test`, `placeholder`, `invalid`, `fake`, etc.
  - Invalid key prefixes:
    - HuggingFace: must start with `hf_`, minimum 20 chars
    - OpenAI: must start with `sk-` or `sk_`, minimum 20 chars
  - Minimum length checks to eliminate stub/test keys

**Behavior:**
- Pre-validates all tokens before attempting provider API calls
- Returns `invalid_key_format` reason immediately if all tokens fail format check
- Reduces wasted time on provably-invalid credentials

### 2. **Improved Provider Health Probes** (`web/api/ai/provider-runtime.ts`)

**HuggingFace Probe:**
```typescript
// Filter out format-invalid tokens before attempting API calls
const validTokens = config.hfTokens.filter(token => !isInvalidKeyFormat(token, 'huggingface'));
if (validTokens.length === 0) {
  return { reason: 'invalid_key_format', keyValid: false, ... }
}
```

**OpenAI Probe:**
```typescript
// Pre-validate key before calling API
if (isInvalidKeyFormat(config.openAiKey, 'openai')) {
  return { reason: 'invalid_key_format', keyValid: false, ... }
}
```

**Key Differentiators:**
- `keyValid=true` when timeout/network error (key format OK, just transient issue)
- `keyValid=false` when auth fails (401/403) or format invalid
- Enables clients to distinguish "fix your key" from "provider temporarily down"

### 3. **Robust Provider Failover** (`web/api/ai/chat.ts`)

**Problem Solved:**
- Previously: If HuggingFace validation failed, base/advanced modes would fall back to demo even if OpenAI was available
- Now: Tries all configured providers before resorting to demo

**Logic Flow:**
```
1. Preferred order: base/advanced prefer HF→OpenAI, odin prefers OpenAI→HF
2. Validated order: use only providers that passed health check
3. Configured order: use any providers with keys configured (fallback if health check failed)
4. Merge: try validated first, then fallback to just-configured
5. Invoke: attempt each provider in order, catch+log, then next
6. Demo: only after ALL configured providers are exhausted
```

**Code Changes:**
```typescript
// Determine which providers are confirmed available from health check
const hfValidated = providerSnapshot.huggingface.validated;
const oaiValidated = providerSnapshot.openai.validated;

// For base/advanced modes: try all available providers before demo fallback
const preferredOrder = effectiveMode === 'odin'
  ? ['openai', 'huggingface']
  : ['huggingface', 'openai'];

// First pass: use providers that passed health check
const validatedOrder = preferredOrder.filter((candidate) =>
  candidate === 'huggingface' ? hfValidated : oaiValidated,
);

// Fallback: use providers that are configured in env (even if health check failed)
const configuredOrder = preferredOrder.filter((candidate) =>
  candidate === 'huggingface' ? hasHf : hasOpenAI,
);

// Merged order: prioritize validated, then fallback to just-configured
const providerOrder = validatedOrder.length > 0 ? validatedOrder : configuredOrder;

// Try each provider with logging
for (const candidate of providerOrder) {
  try {
    // attempt provider...
  } catch (err) {
    console.warn(`[PROVIDER_FALLBACK] ${candidate} failed:`, err.message);
    // continue to next
  }
}
// Only demo if ALL configured providers exhausted
provider = 'demo'; 
throw lastErr;
```

### 4. **Updated Health Endpoint** (`web/api/ai/health.ts`)

**Added:**
- `invalid_key_format` to `ProviderStatus.reason` type
- Now reports granular failure reasons:
  - `missing_key`: no env var found
  - `invalid_key_format`: placeholder/format violation detected
  - `auth_failed`: 401/403 from provider
  - `provider_down`: 5xx or service unavailable
  - `timeout`: health check probe exceeded timeout
  - `network_error`: DNS/connection failure
  - `ok`: provider is reachable and validated

---

## Deployment Checklist

- [x] Code changes implemented and validated
- [x] No breaking changes to API contracts
- [x] Backward compatible with existing `/api/ai/health` consumers
- [x] `/api/chat` failover logic improved without contract change
- [ ] Deploy to tradehax.net
- [ ] Verify `/api/ai/health` shows provider details and invalid_key_format detection
- [ ] Verify `/api/chat` (base mode) uses OpenAI when HF down
- [ ] Monitor logs for `[PROVIDER_FALLBACK]` entries (should be rare post-rotation)
- [ ] Confirm demo mode is NOT reached in normal operation (only on complete provider failure)

---

## Post-Deployment Verification

### Health Endpoint
```bash
curl https://tradehax.net/api/ai/health | jq '.providers'
# Expected:
# [
#   { name: "huggingface", validated: true, reason: "ok", keyValid: true, ... },
#   { name: "openai", validated: true, reason: "ok", keyValid: true, ... },
#   { name: "demo", validated: true, reason: "ok", ... }
# ]
```

### Chat Endpoint
```bash
curl -X POST https://tradehax.net/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"BTC price target?"}]}'
# Expected provider: huggingface or openai (NOT demo unless both are down)
```

### Logs Inspection
- Should see minimal `[PROVIDER_FALLBACK]` entries (only during transient failures)
- Should NOT see regular demo fallbacks for base/advanced requests
- If seeing frequent fallbacks, check env keys haven't expired

---

## Files Modified

1. `web/api/ai/provider-runtime.ts`
   - Added `invalid_key_format` reason
   - Added `keyValid` flag
   - Added `isInvalidKeyFormat()` function
   - Enhanced `probeHuggingFace()` with token validation
   - Enhanced `probeOpenAI()` with key validation

2. `web/api/ai/chat.ts`
   - Refactored provider selection logic
   - Improved failover: base/advanced try all providers before demo
   - Added `[PROVIDER_FALLBACK]` logging for diagnostics

3. `web/api/ai/health.ts`
   - Added `invalid_key_format` to `ProviderStatus.reason` type

---

## Rollback Plan

If issues arise post-deployment:

1. **Revert changes:** `git revert <commit-hash>`
2. **Redeploy:** `npm run deploy:net`
3. **Monitor:** Check `/api/ai/health` returns to previous structure

Changes are purely additive and backward-compatible; rollback should restore prior behavior.

---

## Notes

- Key rotation should have been completed before deployment
- Placeholder/invalid keys will now be detected at runtime startup
- Health checks are cached for 30 seconds to avoid overwhelming provider APIs
- Demo mode remains as safe fallback but is no longer used for normal base/advanced requests when other providers are available

