# 🚀 Supabase Database Initialization Guide

**Last Updated:** March 11, 2026  
**Target:** Initialize TradeHax metrics database schema

---

## Quick Start (3 steps)

### Step 1: Verify Connection
```powershell
cd C:\tradez\main\web
node test-supabase.js
```
Expected: ✅ Connection successful

### Step 2: Initialize Schema
Choose ONE of these methods:

**Method A: Supabase Web UI (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select tradehax project
3. Click "SQL Editor"
4. Click "New Query"
5. Copy content from: `C:\tradez\main\web\api\db\metrics_schema.sql`
6. Paste into editor
7. Click "Run"
8. Wait for "Success" message

**Method B: psql Command Line**
```powershell
psql postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres < C:\tradez\main\web\api\db\metrics_schema.sql
```

### Step 3: Verify Schema
```powershell
# Run again to verify tables exist
cd C:\tradez\main\web
node test-supabase.js
```
Expected: ✅ Found 3 TradeHax metrics tables

---

## What Gets Created

### Table 1: ai_metrics_snapshots
Stores point-in-time quality metrics every N seconds

**Fields:**
- `id` - Primary key
- `timestamp` - When snapshot was taken
- `total_requests` - Total AI requests since last reset
- `valid_responses` - Responses that passed validation
- `invalid_responses` - Responses with errors
- `hallucination_detections` - Responses with hallucinations
- `average_quality_score` - 0-100 quality rating
- `validation_rate_percent` - % of responses that passed validation
- `hallucination_rate_percent` - % of responses with hallucinations
- `provider_stats` - JSON with HuggingFace/OpenAI stats
- `temperature` - LLM temperature setting
- `strict_mode` - Whether strict validation enabled
- `demo_mode` - Whether running in demo mode

**Usage:**
```typescript
// Record snapshot every 60 seconds
recordMetricsSnapshot({
  timestamp: new Date(),
  totalRequests: 1250,
  validResponses: 1187,
  invalidResponses: 63,
  hallucinationDetections: 12,
  averageQualityScore: 84.5,
  providerStats: {
    huggingface: { count: 800, avgScore: 86 },
    openai: { count: 450, avgScore: 81 }
  },
  temperature: 0.7,
  strictMode: true,
  demoMode: false
});
```

### Table 2: ai_response_logs
Detailed log of every single AI interaction

**Fields:**
- `id` - Log entry ID
- `session_id` - User session
- `message_id` - Message ID
- `user_message` - What user asked
- `ai_response` - What AI answered
- `provider` - 'huggingface' | 'openai' | 'demo'
- `model` - Specific model name
- `response_time_ms` - Latency in milliseconds
- `validation_score` - 0-100 quality score
- `is_valid` - Boolean validation pass/fail
- `validation_errors` - JSON array of errors
- `validation_warnings` - JSON array of warnings
- `hallucinations_detected` - JSON array
- `signal_type` - 'BUY' | 'SELL' | 'HOLD'
- `signal_confidence` - 0-100
- `price_target` - e.g., "$150-$175"
- `stop_loss` - e.g., "$140"
- `position_size` - e.g., "2.5 BTC"
- `timestamp` - When response was logged

**Usage:**
```typescript
// Log after every AI response
logResponseToDatabase({
  sessionId: 'sess_abc123',
  messageId: 'msg_xyz789',
  userMessage: 'What should I do with DOGE?',
  aiResponse: '**Signal**: BUY 50%\n**Price Target**: $0.45-$0.65\n...',
  provider: 'huggingface',
  model: 'meta-llama/Llama-3.3-70B-Instruct',
  responseTimeMs: 1850,
  validationScore: 92,
  isValid: true,
  validationErrors: [],
  validationWarnings: [],
  hallucinations: [],
  signalType: 'BUY',
  signalConfidence: 85,
  priceTarget: '$0.45-$0.65',
  stopLoss: '$0.30',
  positionSize: '2.5 BTC'
});
```

### Table 3: ai_sessions
Tracks user sessions and context

**Fields:**
- `id` - Session ID (primary key)
- `user_id` - Optional user identifier
- `model_preference` - Which LLM to use
- `temperature` - User's preferred temp
- `max_response_tokens` - Max length
- `system_prompt_override` - Custom system prompt
- `context_data` - JSON with user preferences
- `created_at` - Session start
- `last_activity` - Last request time
- `metadata` - JSON metadata

**Usage:**
```typescript
// Create session for new user
insertSession({
  id: 'sess_abc123',
  userId: 'user_xyz789',
  modelPreference: 'huggingface',
  temperature: 0.7,
  maxResponseTokens: 1024,
  contextData: {
    tradingStyle: 'aggressive',
    riskTolerance: 'high',
    favoriteAssets: ['BTC', 'ETH', 'SOL']
  },
  metadata: { clientVersion: '1.0.0' }
});
```

---

## Schema Diagram

```
ai_metrics_snapshots
├── id (PK)
├── timestamp
├── total_requests
├── valid_responses
├── invalid_responses
├── hallucination_detections
├── average_quality_score
├── provider_stats (JSON)
├── temperature
├── strict_mode
├── demo_mode
└── created_at
    INDEX: timestamp
    INDEX: validation_rate
    INDEX: hallucination_rate

ai_response_logs
├── id (PK)
├── session_id (FK → ai_sessions)
├── message_id
├── user_message
├── ai_response
├── provider
├── model
├── response_time_ms
├── validation_score
├── is_valid
├── validation_errors (JSON)
├── validation_warnings (JSON)
├── hallucinations_detected (JSON)
├── signal_type
├── signal_confidence
├── price_target
├── stop_loss
├── position_size
└── timestamp
    INDEX: session_id
    INDEX: timestamp
    INDEX: provider
    INDEX: validation_score
    INDEX: signal_type

ai_sessions
├── id (PK)
├── user_id
├── model_preference
├── temperature
├── max_response_tokens
├── system_prompt_override
├── context_data (JSON)
├── created_at
├── last_activity
└── metadata (JSON)
    INDEX: user_id
    INDEX: created_at
```

---

## Stored Functions

### `record_metrics_snapshot(...)`
Insert a metrics snapshot and return the ID

**Parameters:**
```sql
total_requests INT,
valid_responses INT,
invalid_responses INT,
hallucination_detections INT,
average_quality_score DECIMAL,
provider_stats JSONB,
temperature DECIMAL,
strict_mode BOOLEAN,
demo_mode BOOLEAN
```

**Returns:** ID of inserted row

---

## Common Queries

### Get Last 24 Hours of Metrics
```sql
SELECT * FROM ai_metrics_snapshots
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

### Get Quality Trend (Last 7 Days)
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_requests,
  ROUND(AVG(average_quality_score), 2) as avg_quality
FROM ai_metrics_snapshots
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### Get Provider Comparison (Last 24h)
```sql
SELECT 
  provider,
  COUNT(*) as total,
  ROUND(AVG(validation_score), 2) as avg_score,
  ROUND(AVG(response_time_ms), 0) as avg_latency_ms
FROM ai_response_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider
ORDER BY avg_score DESC;
```

### Get High-Quality Signals (Score > 90)
```sql
SELECT 
  message_id,
  signal_type,
  signal_confidence,
  price_target,
  validation_score,
  response_time_ms
FROM ai_response_logs
WHERE validation_score > 90
  AND signal_type IS NOT NULL
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY validation_score DESC
LIMIT 50;
```

### Signal Accuracy Analysis
```sql
SELECT 
  signal_type,
  COUNT(*) as total_signals,
  ROUND(AVG(signal_confidence), 1) as avg_confidence,
  ROUND(AVG(validation_score), 1) as avg_quality,
  COUNT(CASE WHEN is_valid THEN 1 END)::float / COUNT(*) * 100 as validation_pass_rate
FROM ai_response_logs
WHERE signal_type IS NOT NULL
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY signal_type
ORDER BY total_signals DESC;
```

---

## Troubleshooting

### "relation 'ai_metrics_snapshots' does not exist"
**Problem:** Schema wasn't initialized  
**Solution:** Run the metrics_schema.sql initialization

### "permission denied for schema public"
**Problem:** Database user doesn't have proper permissions  
**Solution:** 
1. Go to Supabase dashboard
2. Reset database password
3. Update DATABASE_URL in .env.local

### "too many connections"
**Problem:** Connection pool exhausted  
**Solution:** Reduce connection pool size in metrics-service.ts
```typescript
max: 10,  // Changed from 20
```

### "connection timeout"
**Problem:** Network can't reach Supabase  
**Solution:** Check network/firewall, verify Supabase project is active

---

## Next Steps

1. ✅ Verify connectivity: `node test-supabase.js`
2. ✅ Initialize schema: Run metrics_schema.sql
3. ✅ Start development: `npm run dev`
4. ✅ Visit dashboard: http://localhost:3000/neural-console
5. ✅ Begin growth:
   - Implement signal tracking
   - Build accuracy analytics
   - Compare provider performance
   - Train on historical data

**You're all set! Begin enhancing your platform.** 🚀

