# TradeHax Polymarket Trading Assistant - Implementation Guide

## Overview

The polymarket trading assistant is a comprehensive AI-powered prediction market intelligence engine built into TradeHax with:

- **Live market scanning** with Fibonacci confluence analysis
- **Full Kelly Criterion** position sizing with Golden Ratio adjustments
- **Bayesian probability** updating with real-time signals
- **Monte Carlo simulation** for ruin probability calculation
- **Multi-timeframe analysis** (SCALP/SWING/POSITION/MACRO)
- **Advanced technical indicators** (RSI-14, MACD, Bollinger Bands, Smart Ape momentum)
- **GPT-powered trading recommendations** with fallback to local quant engine
- **Paper trading mode** for risk-free strategy testing
- **Live callouts and watchlists** with market grading (A-F scale)

## Architecture

### Frontend Component: `web/src/components/trading/PolymarketTerminal.jsx`

**Location**: `/polymarket` route

**Key Features**:
1. **Scanner View**: Real-time market scan with top markets ranked by EV score
2. **Fibonacci View**: Price history with Fib retracements and extensions
3. **Multi-TF View**: Multi-timeframe signals across 4 trading horizons
4. **Signals View**: AI-generated trading recommendations with confidence scores
5. **Risk Desk**: Monte Carlo simulation and portfolio risk metrics
6. **Orders View**: Paper trading order history and P&L tracking
7. **Wallet View**: On-chain wallet verification (Polygon mainnet)
8. **Chat Interface**: Real-time conversation with TradeHax GPT

### Backend Endpoints

#### 1. Signal Generation: `/api/signals/ai-signals`

**POST request body**:
```javascript
{
  mode: "signals" | "chat",
  context: {
    // Array of markets to analyze
    markets: [
      {
        q: "Will Bitcoin reach $100k by year-end?",
        yes: 0.65,
        tp: 0.72,
        ev: 0.085,
        kelly: 125,
        grade: "A",
        arb: "0.5%",
        whale: 0.82,
        action: "BUY_YES",
        fib: "61.8%",
        rsi: "58"
      }
    ]
  },
  messages: [ // For chat mode
    { role: "user", content: "What's the best trade right now?" }
  ],
  system: "Optional system prompt" // For chat mode
}
```

**Response**:
```javascript
{
  signals: [
    {
      question: "Market question",
      action: "BUY_YES|BUY_NO|ARB|SKIP",
      edge: 0.085,
      confidence: 0.82,
      kelly: 125,
      tf: "SWING",
      fibLevel: "61.8%",
      thesis: "A grade market with strong EV",
      risk: "LOW|MED|HIGH"
    }
  ],
  provider: "huggingface|openai|local|demo"
}
```

### Data Flow

```
Frontend (PolymarketTerminal.jsx)
  ↓
  1. User clicks SCAN button
  2. Fetches 28 markets from GAMMA_API
  3. Analyzes each with quant engine (parallel batches)
  4. Generates signals via requestAdapter
  ↓
Backend (/api/signals/ai-signals)
  ↓
  1. Receives context with 20 analyzed markets
  2. Tries HuggingFace Llama-3.3-70B (if HF_API_KEY set)
  3. Falls back to OpenAI GPT-4 (if OPENAI_API_KEY set)
  4. Falls back to local quant-only signals
  ↓
Frontend
  ↓
  1. Displays top 6 signals in UI
  2. User can click any market for detailed analysis
  3. Chat with AI about specific strategies
  4. Paper trade or execute real orders
```

## Configuration

### Environment Variables

**Required for AI Features**:
- `HUGGINGFACE_API_KEY`: Free API key from https://huggingface.co/settings/tokens
  - Get a "Read" token (no credit card needed)
  - Uses Llama-3.3-70B-Instruct (free tier)
- `OPENAI_API_KEY` (optional): Fallback to GPT-4
  - Get from https://platform.openai.com/api-keys

**Optional but Recommended**:
- `VITE_POLYGON_RPC_URL`: RPC endpoint for wallet verification
  - Default: `https://polygon-rpc.com`
  - Public and free

### Setup Steps

1. **Get HuggingFace Token** (FREE, ~2 min):
   ```bash
   # Visit https://huggingface.co/settings/tokens
   # Click "New token"
   # Name: "TradeHax"
   # Type: "Read"
   # Copy token
   ```

2. **Set Environment Variable**:
   ```bash
   # In web/.env.local
   HUGGINGFACE_API_KEY=hf_your_token_here
   ```

3. **Restart Dev Server**:
   ```bash
   cd web
   npm run dev
   ```

4. **Access at**:
   ```
   http://localhost:5173/polymarket
   ```

## Key Quant Algorithms

### 1. Full Kelly Criterion
- Formula: `f* = (p·b - q) / b`
  - `p` = true win probability
  - `b` = market odds = `(1-p_mkt)/p_mkt`
  - `q` = 1 - p
- Applied with 25% fractional Kelly (0.25 multiplier)
- Hard 5% bankroll cap per trade

### 2. Golden Ratio Kelly Boost
- Multiplies position by φ (1.618) when price near 61.8% Fibonacci zone
- Reduces position by φ inverse (0.618) at other Fib walls
- Uses FIB_R = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0]

### 3. Bayesian Probability Update
- Updates market prior with signal strength
- `P(true|signal) = (prior × likelihood_ratio) / (1 + prior × likelihood_ratio)`
- Incorporates Smart Ape momentum + order book imbalance

### 4. Monte Carlo Simulation
- 500 parallel Kelly growth paths over 30 periods
- Calculates P10/P50/P90 bankroll outcomes
- Ruin probability = % of paths reaching 0 balance

### 5. Multi-Timeframe Analysis

| Frame | Duration | RSI | Momentum | Bollinger | Verdict |
|-------|----------|-----|----------|-----------|---------|
| SCALP | 5-15m | Dynamic | Smart Ape | ±2σ squeeze | Quick entry/exit |
| SWING | 1-4h | (9-period) | Composite | Vol contraction | 3-12h holds |
| POSITION | 4h-1d | (14-period) | Trend | Mean reversion | Days-weeks |
| MACRO | 1d+ | (full data) | Long-term | Major support | Weeks+ |

### 6. Market Grading (A-F)
- **A** (85+): High EV + low UMA risk + strong volume/liquidity
- **B** (70-84): Good opportunity with manageable risk
- **C** (54-69): Neutral setup, requires confirmation
- **D** (38-53): Weak edge, skip unless special circumstance
- **F** (<38): Avoid - poor risk/reward

## Usage Flows

### Flow 1: New User - Quick Start

1. Open https://tradehax.net/polymarket
2. See initial message: "VIEW-ONLY MODE ACTIVE"
3. Click the **⟳ SCAN** button (bottom-left nav)
4. Wait for "LIVE ●" phase (20-30 seconds)
5. See top 6 markets in Scanner view
6. Click any market for detailed Fibonacci analysis
7. Ask GPT questions in chat: "What's the best trade?" "Size my bet"

### Flow 2: Paper Trading

1. Set bankroll in Risk Desk (default: $1,000)
2. Adjust Kelly fraction (default: 0.25 = 25% fractional)
3. Click **BUY_YES** or **BUY_NO** on any market
4. Simulated order appears in Orders view
5. Auto-fills after 800ms with random outcome
6. P&L updates in status bar

### Flow 3: Live Trading (Future)

1. Switch from "📊 VIEW-ONLY" to "🎯 LIVE MODE" (will require toggle)
2. Connect wallet in Wallet tab
3. Verify on-chain: ~3 second verification
4. Place orders - executes via smart contract
5. Monitor in Orders tab with real P&L

### Flow 4: Chat Interactions

**Questions the AI can answer**:
- "What's the best trade right now?"
- "Size my bet on this market"
- "Explain the Fibonacci levels"
- "Is there an arb opportunity?"
- "What's the Monte Carlo ruin rate?"
- "Should I hedge my position?"

**Behind the scenes**:
1. Chat context includes top 8 markets from last scan
2. AI gets system prompt with your bankroll + Kelly fraction
3. Responses include specific Kelly sizing and Fib targets
4. All math is verified against local quant engine

## Troubleshooting

### Issue: "SIGNAL ENGINE" phase hangs

**Cause**: AI adapter not responding (no API keys or network issue)

**Fix**:
1. Check browser console (F12 → Console tab)
2. Should see "AI adapter failed" warning, then falls back to local signals
3. Signals will still generate - just from quant engine, not AI
4. Works fine without API keys configured

### Issue: Scan takes >60 seconds

**Cause**: Waiting on Gamma/CLOB API responses

**Fix**:
1. Normal for first scan (API cache warming)
2. Subsequent scans are faster
3. Check network tab in DevTools (F12 → Network)
4. Look for GAMMA_API and CLOB_API calls

### Issue: Wallet verification fails

**Cause**: RPC endpoint timeout or invalid address

**Fix**:
1. Check address format: `0x` + 40 hex characters
2. Try alternate RPC: https://rpc.ankr.com/polygon
3. Verify address on PolygonScan first

### Issue: "No live market scan is loaded"

**Cause**: Haven't clicked SCAN yet

**Fix**:
1. Click **⟳ SCAN** button (bottom-left nav)
2. Wait for "LIVE ●" phase indicator
3. Markets will populate

## Performance & Optimization

### Frontend Optimization
- Markets analyzed in parallel batches (8 + 12 markets)
- Memoized stats calculation with `useMemo`
- Debounced resize listener (viewport detection)
- Chat auto-scroll only on new messages

### Backend Optimization
- API calls use `Promise.all()` for concurrency
- HuggingFace timeout: 30 seconds (then falls back)
- Response caching via response headers
- JSON parsing with safe fallbacks

### Network Optimization
- Gamma API: ~28 markets per request
- CLOB API: Batch book fetches in parallel
- Price history: Fidelity=10 (10 candles per request)
- Total scan: ~20-30 API calls, ~15-25 seconds

## Deployment

### Development
```bash
cd web
npm install
npm run dev
# Opens http://localhost:5173/polymarket
```

### Production (Vercel)
```bash
# Set environment variables in Vercel dashboard
# - HUGGINGFACE_API_KEY
# - OPENAI_API_KEY (optional)

# Deploy
npm run deploy
```

### Docker (Local Stack)
```bash
docker-compose up
# App on http://localhost:3000/polymarket
# Postgres for telemetry/auth
# Redis for caching
```

## API Integration Examples

### Example 1: Generate Signals Only
```javascript
const response = await fetch('/api/signals/ai-signals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'signals',
    context: markets // 20 analyzed markets
  })
});
const { signals } = await response.json();
console.log(signals); // Top 6 trading recommendations
```

### Example 2: Chat with AI
```javascript
const response = await fetch('/api/signals/ai-signals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'chat',
    messages: [
      { role: 'user', content: 'What should I do with my $1000?' }
    ],
    system: 'You are a professional trading advisor...'
  })
});
const { reply } = await response.json();
console.log(reply); // AI trading advice
```

## Future Enhancements

1. **Real Order Execution**: Wire up to Polymarket CLOB API
2. **Strategy Backtesting**: Historical Fibonacci + Kelly signals
3. **Portfolio Hedging**: Auto-hedge exposure across correlated markets
4. **On-Chain Analytics**: UMA dispute history + resolver reputation
5. **Alert System**: SMS/Discord notifications on Grade-A opportunities
6. **Leaderboard**: Track AI predictions vs. actual outcomes
7. **Custom Watchlists**: Save favorite markets and tracking rules
8. **Options Analytics**: Add option pricing for YES/NO outcomes

## Support & Debugging

**Check Live Status**:
- Visit https://tradehax.net → Health check in top-right
- Verifies: Supabase, RPC, API routes

**View Logs**:
- Browser: `F12 → Console tab` for frontend errors
- Server: Check Vercel dashboard for serverless function logs

**Enable Debug Mode**:
```javascript
// In browser console:
localStorage.setItem('debug_tradehax', 'true');
location.reload();
```

---

**Build Date**: March 2026  
**Status**: Production Ready  
**Last Updated**: March 20, 2026

