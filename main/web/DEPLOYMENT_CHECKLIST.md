# ODIN Neural Hub - Production Deployment Checklist

**Status**: ✅ READY FOR DEPLOYMENT  
**Date**: March 20, 2026  
**Deployed Components**: Hard Fail-Open Boot Guard, Telemetry System, ODIN Live Status

---

## Pre-Deployment Verification

### ✅ Code Quality
```bash
# TypeScript compilation check (telemetry components only)
cd C:\tradez\main\web
npx tsc --noEmit api/ai/telemetry-repository.ts api/ai/health.ts api/ai/telemetry.ts api/ai/chat.ts
# Result: No errors ✅
```

### ✅ Files Created/Modified
- **Created**: 
  - `web/api/ai/telemetry-repository.ts` (177 lines) ✅
  - `web/api/ai/telemetry.ts` (62 lines) ✅
  - `web/IMPLEMENTATION_SUMMARY.md` (complete docs) ✅
- **Updated**:
  - `web/api/ai/health.ts` (275 lines) ✅
  - `web/api/ai/chat.ts` (1014 lines) ✅
  - `web/src/NeuralHub.jsx` (308 lines) ✅
  - `web/.env.example` (125 lines) ✅

---

## Deployment Command

```powershell
cd C:\tradez\main\web

# Step 1: Install dependencies (if needed)
npm install

# Step 2: Run smoke test (optional but recommended)
npm run release:check

# Step 3: Deploy to production
npm run deploy
```

---

## Post-Deployment Verification

### Immediate (within 1 minute)
```bash
# Check health endpoint is live and returns valid JSON
curl https://tradehax.net/api/ai/health

# Expected response includes:
# - status: "healthy", "degraded", or "unavailable"
# - providers: [huggingface, openai, demo status]
# - modes: [base, advanced, odin availability]
# - slos: {base, advanced, odin latency metrics}
```

### Within 5 minutes
```bash
# Test chat endpoint with telemetry recording
curl -X POST https://tradehax.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Test message"}],
    "mode": "base"
  }'

# Should return 200 with meta.providerPath and latencyMs
```

### Within 30 minutes
1. Monitor CloudWatch logs for `[TELEMETRY]` entries
2. Check Sentry dashboard for no new error patterns
3. Verify frontend mode selection emits telemetry events
4. Test ODIN gating: mode=odin without wallet should downgrade to advanced

---

## Environment Setup

### Required Variables (add to production .env)
```bash
# AI Chat Provider Keys (existing)
HUGGINGFACE_API_KEY=<token>
OPENAI_API_KEY=<token>

# ODIN Gating (new)
TRADEHAX_ODIN_OPEN_MODE=false
TRADEHAX_ODIN_KEY=<shared-secret>

# Telemetry Database (new - optional)
TELEMETRY_DATABASE_URL=           # Leave blank for in-memory

# Health Check Timeouts (new)
AI_HEALTH_CHECK_HF_TIMEOUT_MS=5000
AI_HEALTH_CHECK_OA_TIMEOUT_MS=5000

# Neural Console (new)
NEURAL_CONSOLE_KEY=<shared-secret>
```

---

## Rollback Plan

If deployment issues occur:

```powershell
# Rollback to previous stable version
npm run deploy:fallback

# Or manually revert
git revert <commit-hash>
npm run deploy
```

**Common Issues & Fixes**:
- **Telemetry not recording**: Check `TELEMETRY_DATABASE_URL` is set correctly (or leave blank for in-memory)
- **Health endpoint 500**: Verify all HuggingFace token env vars are set
- **Chat endpoint slow**: Check provider health endpoint directly
- **CORS errors**: Verify `Access-Control-Allow-Origin` headers in vercel.json

---

## Monitoring Setup

### CloudWatch Logs to Monitor
```
[TELEMETRY] recordAIChatEvent success/failure
[AI_CHAT] Chat request/response
[HEALTH] Health check completion
[HALLUCINATION REJECT] Guardrail triggers
[ANALYTICS] Response logging
```

### Sentry Alerts
- Error rate > 1% 
- Response latency p95 > 5000ms
- Health check failures

### Key Metrics Dashboard
Create dashboard tracking:
1. Chat requests per mode (BASE/ADVANCED/ODIN split)
2. ODIN gating rate (% downgraded to ADVANCED)
3. Provider latency (p50, p95)
4. Hallucination detection rate
5. API fallback frequency

---

## Testing Matrix

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Health endpoint availability | 200 JSON response | ✅ |
| Chat with BASE mode | Provider response + telemetry | ✅ |
| Chat with ADVANCED mode | Enhanced system prompt | ✅ |
| Chat with ODIN (ungated) | Downgrade to ADVANCED | ✅ |
| Chat with ODIN + wallet | ODIN response unlocked | ✅ |
| API failure fallback | Demo response returned | ✅ |
| Telemetry recording | Events in memory/DB | ✅ |
| Frontend mode change | Telemetry event emitted | ✅ |
| Frontend wallet connect | Telemetry event emitted | ✅ |

---

## Performance Targets

After deployment, validate these SLOs:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Health endpoint latency | < 500ms | TBD | Monitor |
| Chat latency (BASE, p50) | < 2000ms | TBD | Monitor |
| Chat latency (ADVANCED, p50) | < 3000ms | TBD | Monitor |
| Chat latency (ODIN, p50) | < 5000ms | TBD | Monitor |
| Chat success rate | > 98% | TBD | Monitor |
| Telemetry recording success | > 99% | TBD | Monitor |
| ODIN gating accuracy | 100% | TBD | Monitor |

---

## Support & Debugging

### If health endpoint returns degraded/unavailable
1. Check HuggingFace API status: https://huggingface.co/
2. Check OpenAI API status: https://status.openai.com/
3. Verify API keys in environment variables
4. Check CloudWatch logs for timeout errors

### If telemetry not recording
1. Verify `TELEMETRY_DATABASE_URL` format (Postgres connection string)
2. Test in-memory fallback by leaving `TELEMETRY_DATABASE_URL` blank
3. Check database connectivity from Vercel
4. Review CloudWatch logs for `[TELEMETRY]` errors

### If ODIN gating not working
1. Verify `TRADEHAX_ODIN_OPEN_MODE` is set to 'false' for gating
2. Check `TRADEHAX_ODIN_KEY` matches client header value
3. Verify frontend passes `context.odinUnlocked = true` when wallet connected
4. Test with `x-odin-key` header in cURL

### If chat latency is high
1. Check provider health: `GET /api/ai/health`
2. Monitor CloudWatch for API timeouts
3. Verify `AI_HEALTH_CHECK_*_TIMEOUT_MS` values are reasonable
4. Check HuggingFace/OpenAI API rate limits

---

## Success Criteria Checklist

Before declaring deployment successful, verify:

- [ ] Health endpoint returns 200 JSON with valid structure
- [ ] Chat endpoint continues working without telemetry blocking
- [ ] ODIN gating works (mode=odin downgrades to advanced when not unlocked)
- [ ] Demo mode fallback triggers when APIs fail
- [ ] Telemetry events are being recorded (check CloudWatch logs)
- [ ] Frontend mode selection telemetry is being emitted
- [ ] Frontend wallet connect telemetry is being emitted
- [ ] No 5xx errors on health or chat endpoints
- [ ] All environment variables are configured correctly
- [ ] Latency meets SLO targets (p50 < target for each mode)

---

## Post-Deployment Tasks (24 hours)

1. **Monitor Logs**: Check for any `[ERROR]` patterns in CloudWatch
2. **Verify Telemetry**: Query database to confirm events are recording
3. **Test All Flows**: BASE → ADVANCED → ODIN with wallet
4. **Check SLOs**: Confirm latency metrics match expectations
5. **User Feedback**: Monitor for reported issues in Discord/support

---

## Conclusion

ODIN Neural Hub deployment includes:
- ✅ Hard fail-open boot guard (demo mode fallback always available)
- ✅ Comprehensive telemetry (all chat events, mode decisions, latency)
- ✅ ODIN Live Status endpoint (provider health + mode availability)
- ✅ No breaking changes (backward compatible)
- ✅ Zero blocking calls (telemetry is fire-and-forget)
- ✅ Graceful degradation (works with or without database)

**Status**: READY FOR PRODUCTION DEPLOYMENT ✅

---

*For issues or questions, refer to IMPLEMENTATION_SUMMARY.md for detailed architecture*

