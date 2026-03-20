#!/usr/bin/env bash
# ODIN Neural Hub - Quick Start Guide

## Files Overview

### Core Implementation Files

#### 1. Telemetry Repository (NEW)
File: web/api/ai/telemetry-repository.ts
Purpose: Record and aggregate AI chat events
Key Functions:
  - recordAIChatEvent() - Main recording function
  - calculateLatencyPercentiles() - P50, P95, P99 metrics
  - calculateSuccessRate() - Per-mode success tracking

#### 2. Health Endpoint (UPDATED)
File: web/api/ai/health.ts
Purpose: Real-time provider health + mode availability
Endpoint: GET /api/ai/health
Response: Provider status, mode availability, SLO metrics

#### 3. Telemetry API (NEW)
File: web/api/ai/telemetry.ts
Purpose: Frontend telemetry emission endpoint
Endpoint: POST /api/ai/telemetry
Usage: Allow frontend to send custom telemetry events

#### 4. Chat Handler (UPDATED)
File: web/api/ai/chat.ts
Purpose: Mode-aware chat with integrated telemetry
Changes: Added 4 telemetry recording points
  - Hallucination detection
  - ODIN gating
  - API fallback
  - Chat completion

#### 5. NeuralHub Component (UPDATED)
File: web/src/NeuralHub.jsx
Purpose: Grok-style chat UI with mode selection
Changes: Added 2 telemetry hooks
  - Mode change tracking
  - Wallet connect tracking

#### 6. Environment Configuration (UPDATED)
File: web/.env.example
Purpose: Document all configuration variables
New Variables:
  - TRADEHAX_ODIN_OPEN_MODE
  - TRADEHAX_ODIN_KEY
  - TELEMETRY_DATABASE_URL
  - AI_HEALTH_CHECK_HF_TIMEOUT_MS
  - AI_HEALTH_CHECK_OA_TIMEOUT_MS
  - NEURAL_CONSOLE_KEY

---

## Quick Commands

### Verify Code Quality
```bash
cd C:\tradez\main\web
npx tsc --noEmit api/ai/telemetry-repository.ts api/ai/health.ts api/ai/telemetry.ts api/ai/chat.ts
```

### Deploy to Production
```bash
npm run release:check  # Pre-deployment smoke test
npm run deploy         # Deploy to Vercel
```

### Test Health Endpoint
```bash
curl https://tradehax.net/api/ai/health
```

### Test Chat with Telemetry
```bash
curl -X POST https://tradehax.net/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"mode":"base"}'
```

---

## Key Telemetry Events

### Event Types
1. **hallucination_detected**
   - Triggered: When guardrail filters response
   - Data: User message length, hallucinated: true
   - Action: Return rejection response to user

2. **gating_applied**
   - Triggered: ODIN requested but not unlocked
   - Data: requestedMode=odin, effectiveMode=advanced
   - Action: Downgrade to advanced system prompt

3. **api_fallback**
   - Triggered: Provider API fails
   - Data: errorMessage, providerPath=demo
   - Action: Return demo response

4. **chat_completed**
   - Triggered: Successful chat response
   - Data: latencyMs, model, provider, hallucinated
   - Action: Record for SLO metrics

5. **ui_mode_changed** (frontend)
   - Triggered: User selects different mode
   - Data: mode (base/advanced/odin), walletConnected

6. **wallet_connected** / **wallet_disconnected** (frontend)
   - Triggered: Wallet state changes
   - Data: mode, timestamp

---

## Telemetry Data Structure

### Recorded Fields
```typescript
{
  eventType: 'chat_completed' | 'gating_applied' | 'api_fallback' | 'hallucination_detected',
  timestamp: number,                    // Unix milliseconds
  sessionId?: string,                   // User session
  userId?: string,                      // User ID
  mode?: 'base' | 'advanced' | 'odin',  // Requested mode
  effectiveMode?: 'base' | 'advanced' | 'odin',  // Actual mode used
  providerPath?: 'huggingface' | 'openai' | 'demo',  // Provider
  latencyMs?: number,                   // Response time
  model?: string,                       // Model name
  cached?: boolean,                     // Response cached
  gated?: boolean,                      // Mode gated
  guardedRetryCount?: number,           // Guardrail retries
  userMessageLength?: number,           // Input length
  responseLength?: number,              // Output length
  hallucinated?: boolean,               // Hallucination detected
  errorMessage?: string,                // Error detail
  metadata?: Record<string, any>        // Custom data
}
```

---

## SLO Metrics Calculation

### Available Metrics
```json
{
  "slos": {
    "base": {
      "latencyP50Ms": 1234,       // 50th percentile latency
      "latencyP95Ms": 2456,       // 95th percentile latency
      "successRate": 98.5         // % successful completions
    },
    "advanced": {
      "latencyP50Ms": 1890,
      "latencyP95Ms": 3200,
      "successRate": 97.2
    },
    "odin": {
      "latencyP50Ms": 2340,
      "latencyP95Ms": 4500,
      "successRate": 96.1
    }
  }
}
```

### Target SLOs
- BASE: p50 < 2s, p95 < 3s, success > 98%
- ADVANCED: p50 < 3s, p95 < 4s, success > 97%
- ODIN: p50 < 5s, p95 < 8s, success > 96%

---

## Environment Variables Checklist

### Required (existing)
- [ ] HUGGINGFACE_API_KEY
- [ ] OPENAI_API_KEY
- [ ] SUPABASE_URL
- [ ] SUPABASE_SECRET_KEY

### New (required for production)
- [ ] TRADEHAX_ODIN_OPEN_MODE (set to false)
- [ ] TRADEHAX_ODIN_KEY (generate random string)

### New (optional)
- [ ] TELEMETRY_DATABASE_URL (leave blank for in-memory)
- [ ] AI_HEALTH_CHECK_HF_TIMEOUT_MS (default 5000)
- [ ] AI_HEALTH_CHECK_OA_TIMEOUT_MS (default 5000)
- [ ] NEURAL_CONSOLE_KEY (generate random string)

---

## Monitoring Checklist

### Immediate Post-Deploy
- [ ] Health endpoint returns valid JSON
- [ ] Chat endpoint works without errors
- [ ] Telemetry events appear in logs
- [ ] No 5xx errors in CloudWatch

### First 24 Hours
- [ ] Monitor latency metrics (p50, p95)
- [ ] Check success rate (target > 98%)
- [ ] Verify ODIN gating works correctly
- [ ] Watch for any error spikes in Sentry

### Ongoing
- [ ] Track SLO compliance per mode
- [ ] Monitor provider reachability
- [ ] Review hallucination detection rate
- [ ] Check telemetry storage usage

---

## Rollback Procedure

If issues occur:

```bash
# Option 1: Rollback via git
git revert <commit-hash>
npm run deploy

# Option 2: Manual revert
# Restore original files from previous commit
git checkout <previous-commit> -- api/ai/health.ts api/ai/chat.ts src/NeuralHub.jsx
npm run deploy
```

---

## Support Resources

### Documentation
- DELIVERY_SUMMARY.md - Overview of what was delivered
- IMPLEMENTATION_SUMMARY.md - Complete architecture + monitoring
- DEPLOYMENT_CHECKLIST.md - Step-by-step deployment guide
- ODIN_DEPLOYMENT_GUIDE.md - Original feature guide

### Monitoring
- CloudWatch Logs: Filter for `[TELEMETRY]`, `[AI_CHAT]`, `[HEALTH]`
- Sentry Dashboard: Monitor error rates and latency
- Health Endpoint: `GET /api/ai/health` for real-time status

### Common Issues
- Health endpoint degraded: Check HuggingFace/OpenAI API status
- Telemetry not recording: Verify TELEMETRY_DATABASE_URL or use in-memory
- ODIN gating not working: Check TRADEHAX_ODIN_KEY env variable
- High latency: Monitor provider health endpoint

---

## Key Guarantees

✅ **Hard Fail-Open**: Chat always works (demo mode fallback)
✅ **No Breaking Changes**: All existing functionality preserved
✅ **No 5xx Errors**: Health endpoint always returns 200
✅ **Non-Blocking Telemetry**: Fire-and-forget (no impact on latency)
✅ **Graceful Degradation**: Works with or without database
✅ **Type-Safe**: Full TypeScript validation
✅ **Production-Ready**: Error handling, timeouts, CORS configured

---

**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT

*For detailed information, see DELIVERY_SUMMARY.md*

