# TradeHax Polymarket Trading Assistant - Quick Reference Card

## 🚀 Quick Start (5 minutes)

### Access
- **URL**: https://tradehax.net/polymarket (after deployment)
- **Local**: http://localhost:5173/polymarket

### First Steps
1. **Click ⟳ SCAN** → Wait 20-30s for live market data
2. **See "LIVE ●"** → Scan complete, signals ready
3. **Click any market** → View detailed Fibonacci analysis
4. **Ask GPT** → Type questions in chat panel

---

## 📊 Views & Features

| View | Icon | Purpose | Quick Tips |
|------|------|---------|-----------|
| **Scanner** | ◈ | All markets ranked by EV | Filter by grade (A-F), sort by kelly |
| **Fibonacci** | ⌬ | Price analysis with fib levels | Green = bullish, Red = bearish |
| **Multi-TF** | ◫ | Signals across timeframes | SCALP/SWING/POSITION/MACRO |
| **Signals** | ▲ | AI recommendations | Confidence score 0-1, Risk LOW/MED/HIGH |
| **Risk Desk** | ◆ | Portfolio simulation | Monte Carlo P10/P50/P90 outcomes |
| **Orders** | ⊕ | Trading history (paper mode) | Status: SIMULATED→PAPER-FILLED |
| **Wallet** | ◉ | On-chain verification | Enter address, verify on Polygon |

---

## 🎯 What Each Metric Means

### Market Columns
| Column | Meaning | Good Range | Your Action |
|--------|---------|-----------|------------|
| YES↑ | Current market price | 0.30-0.70 | Mid-range = more info needed |
| TRUE P | AI estimated real probability | > YES price | Buy if TRUE P > YES price |
| EV | Expected Value per $1 | +3% to +15% | Higher = better opportunity |
| KELLY $ | Position size (fractional) | 10-200 | Bet this much on trade |
| GR | Market Grade | A > B > C > D > F | Focus on A and B grades |
| ARB | Arbitrage edge | >1.5% | Risk-free profit (YES + NO ≠ $1) |
| WHALE | Whale concentration | <0.7 | High = possible manipulation |
| RSI | Momentum indicator | <30 = oversold, >70 = overbought | Extreme = reversal signal |
| SIGNAL | Trading recommendation | BUY_YES/BUY_NO/ARB | What to do |

---

## 💰 Position Sizing (Kelly Criterion)

### How It Works
```
Kelly $ = (True Prob × Market Odds - 1 - True Prob) × 0.25 × Bankroll
```

### Example
- Market: Bitcoin to $100k
- Current Price: 72% (implied market thinks 72% chance)
- Your Estimate: 78% (you think higher)
- Kelly Size: $50 (for $1,000 bankroll)
- Maximum Bet: $50 (never bet more)

### Risk Levels
- **Conservative**: Kelly fraction 0.1 (10% of Kelly)
- **Balanced**: Kelly fraction 0.25 (25% of Kelly) ← Recommended
- **Aggressive**: Kelly fraction 0.5 (50% of Kelly)

---

## 📈 Fibonacci Levels & Targets

### Retracement Levels (Support)
| Level | Typical Use | Your Action |
|-------|------------|------------|
| 23.6% | Shallow pullback | Buy dips here |
| 38.2% | Normal pullback | Key support zone |
| 50.0% | Midpoint | Important pivot |
| 61.8% | Deep pullback | Major support (Golden Ratio) |
| 78.6% | Extreme pullback | Last support before reversal |

### Extension Levels (Targets)
| Level | Typical Use | Your Action |
|-------|------------|------------|
| 127.2% | First target | Take partial profit |
| 161.8% | Second target | Golden Ratio target |
| 200% | Strong trend | Rare, very bullish |
| 261.8% | Extreme move | Extreme scenario |

---

## 🤖 AI Features

### Chat Quick Commands
```
"What's the best trade?"          → Top ranked market
"Size my bet on [market]"         → Kelly sizing recommendation
"Fibonacci read"                  → Current levels analysis
"Is there an arb?"                → Arbitrage opportunities
"Multi-TF signal"                 → All timeframe analysis
"Monte Carlo risk"                → Ruin probability
"How much can I lose?"            → Max drawdown calculation
```

### Behind the Scenes
- ✅ Uses market data from last scan
- ✅ Considers your bankroll & risk preference
- ✅ Generates Kelly-sized recommendations
- ✅ Works WITHOUT AI key (local fallback)
- ✅ Responses under 5 seconds

---

## 🎲 Trading Actions Explained

| Action | Meaning | When to Do | Risk Level |
|--------|---------|-----------|-----------|
| **BUY_YES** | Buy YES shares | True prob > market price | Medium |
| **BUY_NO** | Buy NO shares | True prob < market price | Medium |
| **ARB** | Arbitrage both | YES + NO ≠ 100% | Low (risk-free) |
| **MKT_MAKE** | Liquidity provide | Balanced book | Low-Medium |
| **HOLD/SKIP** | Do nothing | Unclear edge | N/A |

---

## 📱 Market Grades A-F

### Grade Breakdown
```
A (85+)  ████████ Excellent  → Attack aggressively
B (70-84) ███████  Good      → Good opportunity  
C (54-69) █████    OK        → Needs confirmation
D (38-53) ███      Weak      → Skip unless special
F (<38)   ██       Bad       → Avoid completely
```

### What Affects Grade
- EV Score (expected value)
- UMA Risk (dispute probability)
- Volume (liquidity)
- Sharpe Ratio (risk-adjusted returns)

---

## ⚠️ Risk Metrics

### Know Your Numbers
- **Bankroll**: Total trading capital (default: $1,000)
- **Kelly Fraction**: Risk preference (default: 0.25 = 25%)
- **Max Drawdown**: Worst case from peak (Monte Carlo)
- **Ruin Probability**: Chance of losing it all (should be <1%)
- **Sharpe Ratio**: Risk-adjusted quality (>1.0 is good)

### Monte Carlo Simulation
- **P10**: Worst 10% of outcomes
- **P50**: Median (50%) outcome
- **P90**: Best 10% of outcomes
- **Ruin %**: Probability of going to zero

### Example Results
```
Bankroll: $1,000 | Kelly Fraction: 25%
P10: $850    (10% chance of only gaining $850)
P50: $1,200  (50% chance of gaining $1,200)
P90: $1,600  (10% chance of gaining $1,600)
Ruin: 0.2%   (0.2% chance of losing everything)
```

---

## 🔧 Settings & Configuration

### Adjust in Risk Desk View
- **Bankroll**: Your total capital available (affects Kelly sizing)
- **Kelly Fraction**: 0.1-1.0 (lower = more conservative)
- **Minimum Grade**: A/B/C/D (filters out low-quality markets)
- **Paper Mode**: Toggle between VIEW-ONLY and LIVE MODE

### Wallet Connection
1. Click Wallet tab (◉)
2. Enter Ethereum address (0x...)
3. Click "VERIFY ON-CHAIN"
4. ~3 second verification
5. Should show your balance in POL (Polygon)

---

## 🐛 Troubleshooting

### "SCAN still running?" (>60 seconds)
- **Cause**: Waiting on API responses
- **Fix**: Check network tab in DevTools (F12 → Network)
- **Normal**: First scan slower, subsequent faster

### "No signals showing?"
- **Cause**: Scan finished but AI didn't respond
- **Fix**: Still OK! Local quant signals should show
- **Check**: Browser console for "AI adapter failed" (normal message)

### "Signals look wrong?"
- **Cause**: Old market data (>15 min old)
- **Fix**: Click SCAN again to refresh
- **Note**: Markets update continuously, rescan if doubting

### "Chat response slow?"
- **Cause**: AI thinking (3-5 sec for HuggingFace)
- **Fix**: Wait, it's computing
- **Faster**: With OpenAI key (<1 sec)

### "Mobile view broken?"
- **Cause**: Screen too small
- **Fix**: Rotate to landscape OR use desktop
- **Note**: Fully responsive, all features work on mobile

---

## 🚨 Important Safety Notes

### ✅ Paper Mode (Default - Safe)
- **Status**: "📊 VIEW-ONLY MODE ACTIVE"
- **What happens**: Orders simulated, no real money moves
- **Perfect for**: Testing, learning, strategy validation
- **Risk**: Zero (it's practice)

### ⚠️ Live Mode (Future Feature)
- **How to enable**: Requires real wallet connection + settings toggle
- **What happens**: Orders execute on Polymarket CLOB
- **Risk**: Real money at stake
- **Protection**: Must verify wallet on-chain first

### 🔒 Wallet Security
- **Private keys**: Never stored or transmitted
- **Only verification**: Read-only balance check via RPC
- **Safe**: Uses Polygon public node only
- **Recommended**: Use Polygon mainnet (0x89) only

---

## 📞 Getting Help

### Debug Info to Share
1. **Browser console** (F12 → Console tab)
   - Copy any red error messages
2. **Network tab** (F12 → Network)
   - Check API calls to Gamma/CLOB/Polygon
3. **Dev version in URL**
   - Add `?debug=true` to URL
   - Check localStorage for debug logs
4. **Screenshot**
   - What view you're in
   - What errors showing

### Common Fixes
```bash
# Hard refresh (clear cache)
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

# Check network
Open DevTools (F12)
Click Network tab
Reload page
Look for red X or timeouts

# Clear browser cache
F12 → Application → Storage → Clear All
Then reload
```

---

## 🎓 Learning Resources

### Trading Concepts
- **Kelly Criterion**: Optimal bet sizing formula
- **Fibonacci**: Historical price support/resistance
- **Bayesian**: Probability updating from new info
- **Monte Carlo**: Risk simulation with randomness
- **Multi-Timeframe**: Confirming signals across periods

### Polymarket Info
- **Official Docs**: https://docs.polymarket.com
- **Discord**: https://discord.gg/polymarket
- **FAQ**: https://polymarket.com/faq

### TradeHax Docs
- **Full Guide**: POLYMARKET_TRADING_ASSISTANT_GUIDE.md
- **Setup**: POLYMARKET_AI_SETUP.md
- **Implementation**: POLYMARKET_TRADING_ASSISTANT_IMPLEMENTATION.md

---

## 💡 Pro Tips

### Optimize Your Scanning
1. **Scan when markets active** (high volume, better prices)
2. **Focus on Grade A** (filter in settings)
3. **Check multiple timeframes** (SCALP/SWING/POSITION)
4. **Notice when RSI extreme** (<30 or >70 = reversal)

### Improve Win Rate
1. **Wait for Fibonacci confluence** (price near 3+ levels = strong)
2. **Trade with trend** (Smart Ape momentum positive)
3. **Size according to confidence** (Higher confidence = bigger position)
4. **Respect your Kelly sizing** (Never exceed it)

### Risk Management
1. **Set stop loss** (Below nearest Fib level)
2. **Take profit scaling** (1/3 at first target, etc.)
3. **Monitor Monte Carlo** (If ruin % >2%, reduce size)
4. **Rebalance monthly** (Reset bankroll tracking)

### Use the Chat
1. **Before every trade**: "Should I take this?"
2. **For position sizing**: "What's my Kelly?"
3. **For confirmation**: "Fibonacci read on this market"
4. **For ideas**: "Any arb opportunities right now?"

---

## 🎯 Success Checklist

Before placing real trades:
- [ ] Understand Kelly Criterion
- [ ] Know Fibonacci levels
- [ ] Paper trade successfully (10+ trades)
- [ ] Understand your risk tolerance
- [ ] Set maximum drawdown limit
- [ ] Verify wallet on-chain
- [ ] Read all safety warnings
- [ ] Start with small position

---

**Last Updated**: March 20, 2026  
**Version**: 1.0.0  
**Status**: Production Ready

