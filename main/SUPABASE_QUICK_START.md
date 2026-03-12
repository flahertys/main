# 🔗 Supabase Integration Quick Start

**Time:** 30 minutes to integrate  
**Difficulty:** Beginner-friendly  
**Status:** Ready to implement

---

## Step 1: Verify Connection (5 min)

```powershell
cd C:\tradez\main\web
node test-supabase.js
```

**Expected output:**
```
✓ Testing connection...
  ✅ Connection successful!

✓ Checking database info...
  ✅ Database: postgres
  ✅ User: postgres
  ✅ Version: PostgreSQL 15.x

✓ Checking tables...
  ⚠️  No tables found. Schema needs initialization.
```

If you get a timeout error:
1. Check Supabase project is active (not paused)
2. See `SUPABASE_TROUBLESHOOTING.md`

---

## Step 2: Initialize Database Schema (10 min)

### Option A: Web UI (Recommended)

```
1. Go to https://supabase.com/dashboard
2. Click "tradehax" project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Open file: C:\tradez\main\web\api\db\metrics_schema.sql
6. Copy entire content
7. Paste into SQL Editor
8. Click "Run" button (top right)
9. Wait for: "Success" message
10. Close the editor
```

### Option B: psql Command

```powershell
cd C:\tradez\main\web
psql postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres < api/db/metrics_schema.sql
```

### Option C: Step by Step in SQL Editor

```sql
-- Run each section separately in Supabase SQL Editor

-- Copy content from metrics_schema.sql
-- Paste into SQL Editor
-- Click Run

-- You should see:
-- CREATE TABLE
-- CREATE TABLE
-- CREATE TABLE
-- CREATE FUNCTION
-- (No errors)
```

---

## Step 3: Verify Schema Initialization (5 min)

```powershell
cd C:\tradez\main\web
node test-supabase.js
```

**Expected output:**
```
✓ Checking TradeHax metrics tables...
  ✅ Found 3 TradeHax metrics tables:
     - ai_metrics_snapshots
     - ai_response_logs
     - ai_sessions
```

---

## Step 4: Integrate into Your API (10 min)

Find your main AI response handler. It's likely in:
- `web/api/ai/chat.ts` or
- `web/api/endpoints/signal.ts` or
- Your main chat/signal endpoint

**Add these imports at the top:**
```typescript
import { logResponse, recordMetricsSnapshot } from '@/api/db/metrics-repository.js';
import { extractTradingParameters } from '@/api/ai/validators.js';
```

**After generating AI response, add logging:**
```typescript
// Your existing code that generates the signal
const aiResponse = await generateSignal(userMessage);
const validation = validateResponse(aiResponse);
const parameters = extractTradingParameters(aiResponse);

// NEW: Log to database
const startTime = Date.now();
const responseTime = Date.now() - startTime;

await logResponse({
  sessionId: sessionId,
  messageId: messageId,
  userMessage: userMessage,
  aiResponse: aiResponse,
  provider: 'huggingface', // or 'openai', 'demo'
  model: 'meta-llama/Llama-3.3-70B-Instruct',
  responseTimeMs: responseTime,
  validationScore: validation.score,
  isValid: validation.isValid,
  validationErrors: validation.errors,
  validationWarnings: validation.warnings,
  signalType: parameters.signal?.toUpperCase() as 'BUY' | 'SELL' | 'HOLD' | undefined,
  signalConfidence: extractConfidence(aiResponse),
  priceTarget: parameters.priceTarget,
  stopLoss: parameters.stopLoss,
  positionSize: parameters.positionSize
});

return {
  response: aiResponse,
  validation: validation,
  parameters: parameters
};
```

**Helper function to extract confidence:**
```typescript
function extractConfidence(response: string): number {
  const match = response.match(/Confidence[:\s]+(\d+)%?/i);
  if (match && match[1]) {
    const value = parseInt(match[1]);
    return Math.min(value, 100);
  }
  return 50; // Default
}
```

---

## Step 5: Record Metrics Periodically (Optional but Recommended)

Create a metrics collection service:

**File: `web/api/services/metrics-collector.ts`**

```typescript
import { recordMetricsSnapshot } from '@/api/db/metrics-repository.js';

export class MetricsCollector {
  private totalRequests = 0;
  private validResponses = 0;
  private invalidResponses = 0;
  private hallucinationDetections = 0;
  private qualityScores: number[] = [];
  private providerCounts = { huggingface: 0, openai: 0, demo: 0 };

  recordResponse(isValid: boolean, quality: number, provider: string, hasHallucinations: boolean) {
    this.totalRequests++;
    if (isValid) this.validResponses++;
    else this.invalidResponses++;
    if (hasHallucinations) this.hallucinationDetections++;
    this.qualityScores.push(quality);
    this.providerCounts[provider as keyof typeof this.providerCounts]++;
  }

  getMetrics() {
    const avgQuality = this.qualityScores.length 
      ? this.qualityScores.reduce((a, b) => a + b) / this.qualityScores.length
      : 0;

    return {
      totalRequests: this.totalRequests,
      validResponses: this.validResponses,
      invalidResponses: this.invalidResponses,
      hallucinationDetections: this.hallucinationDetections,
      averageQualityScore: avgQuality,
      providerStats: {
        huggingface: { 
          count: this.providerCounts.huggingface,
          avgScore: 85 // Placeholder
        },
        openai: { 
          count: this.providerCounts.openai,
          avgScore: 84 // Placeholder
        },
        demo: { 
          count: this.providerCounts.demo,
          avgScore: 70 // Placeholder
        }
      },
      temperature: 0.7,
      strictMode: true,
      demoMode: false
    };
  }

  async recordSnapshot() {
    const metrics = this.getMetrics();
    await recordMetricsSnapshot(metrics);
    
    // Reset for next period
    this.totalRequests = 0;
    this.validResponses = 0;
    this.invalidResponses = 0;
    this.hallucinationDetections = 0;
    this.qualityScores = [];
    this.providerCounts = { huggingface: 0, openai: 0, demo: 0 };
  }
}

// Create global instance
export const metricsCollector = new MetricsCollector();

// Record snapshot every 60 seconds
setInterval(() => {
  metricsCollector.recordSnapshot().catch(console.error);
}, 60000);
```

---

## Step 6: Add Analytics Endpoint (Optional)

Create an API endpoint to retrieve metrics:

**File: `web/api/endpoints/analytics.ts`**

```typescript
import { 
  getSystemHealth,
  getProviderComparison,
  getQualityTrend,
  getSignalAccuracy
} from '@/api/db/metrics-repository.js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const metric = url.searchParams.get('metric');

  try {
    let data;

    switch (metric) {
      case 'health':
        data = await getSystemHealth();
        break;
      case 'providers':
        data = await getProviderComparison(24);
        break;
      case 'trend':
        data = await getQualityTrend(7);
        break;
      case 'signals':
        data = await getSignalAccuracy(30);
        break;
      default:
        return new Response('Unknown metric', { status: 400 });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

**Usage:**
```
GET /api/analytics?metric=health
GET /api/analytics?metric=providers
GET /api/analytics?metric=trend
GET /api/analytics?metric=signals
```

---

## Step 7: Start Development

```powershell
cd C:\tradez\main\web
npm run dev
```

Visit: http://localhost:3000

Your API endpoints will now automatically log all AI responses to the database!

---

## Verification Checklist

- [ ] Database connection verified with `test-supabase.js`
- [ ] Schema initialized (3 tables created)
- [ ] Imports added to your API handler
- [ ] Logging code integrated
- [ ] Development server running
- [ ] Made a test API call to your signal endpoint
- [ ] Checked database for new records (in Supabase dashboard)

---

## Next Steps

### Phase 1: Basic Logging (This Week)
- ✅ Integrate response logging
- ✅ Record metrics snapshots
- ✅ Verify data is flowing

### Phase 2: Analytics (Next Week)
- Create dashboard components
- Add quality trending charts
- Build provider comparison views

### Phase 3: Intelligence (Following Week)
- Implement confidence scoring
- Create signal accuracy tracking
- Build user preference learning

See `GROWTH_CAPABILITIES_ROADMAP.md` for full details.

---

## Troubleshooting Integration

### "Cannot find module '@/api/db/metrics-repository'"

**Solution:** Check file paths are correct
```
web/api/db/metrics-repository.ts (should exist)
web/api/db/database-client.ts (should exist)
```

### "logResponse is not a function"

**Solution:** Verify import statement
```typescript
// Correct:
import { logResponse } from '@/api/db/metrics-repository.js';

// Make sure you have .js extension in import
```

### "Database error: relation 'ai_response_logs' does not exist"

**Solution:** Schema wasn't initialized
```powershell
# Run initialization again
node test-supabase.js
# Should show 3 tables found
```

### No data appearing in database

**Solution:** Check if logging code is running
```typescript
// Add console.log before database call
console.log('Logging response...', {
  userMessage,
  validationScore: validation.score
});

await logResponse({...});

console.log('Logged successfully');
```

---

## Production Checklist

Before going live:

- [ ] Database connection uses environment variables (not hardcoded)
- [ ] Error handling for failed database writes (don't break API if DB is down)
- [ ] Connection pooling configured (max 20 connections)
- [ ] Metrics collection interval set (every 60 seconds)
- [ ] Database backups enabled (in Supabase dashboard)
- [ ] IP whitelist configured (if needed)
- [ ] Monitor database size (Supabase has usage limits)

---

## 🎉 Success!

Once integrated and working:
- Every AI response is logged
- Quality metrics are recorded
- You have complete audit trail
- Ready to build analytics

**Time to implement:** 30 minutes  
**ROI:** Immediate visibility into AI quality  
**Next:** Start Phase 2 - Analytics Dashboard

---

**Ready?** Let's grow! 🚀

