# TradeHax Paper Trading - Quick Start Guide

## 🎯 What You Need to Know

TradeHax now has **TWO MODES**:

1. **📊 VIEW-ONLY MODE** (Default) - Analyze & simulate trades safely
2. **🔴 LIVE MODE** - Execute real trades on-chain

---

## Visual Guide

### Header - Mode Toggle Button

```
┌─────────────────────────────────────────────────────────────────┐
│ TRADEHAX     LIVE ●    28 MARKETS                              │
│                                                                 │
│  P&L    TRADES   WIN RATE   GRADE A   ARB OPS                 │
│  +$0      0        —         0          0                      │
│                                                                 │
│  [📊 VIEW-ONLY]  ┃  ✓ NO WALLET  ◁ HIDE GPT                  │
│      👆 CLICK TO SWITCH                                        │
└─────────────────────────────────────────────────────────────────┘
```

**VIEW-ONLY MODE** (Blue button with 📊)
- All trades are simulated
- No wallet needed
- Safe to experiment
- P&L shows "PAPER P&L"

**LIVE MODE** (Red button with 🔴)
- Real trades executed
- Wallet required
- Funds at risk
- P&L shows actual results

---

## Step-by-Step Usage

### 📊 Using Paper Trading (Default)

```
Step 1: Open TradeHax
  └─→ Already in VIEW-ONLY mode

Step 2: Click SCAN
  └─→ Loads live market data

Step 3: Review predictions
  └─→ Kelly sizing, EV, Fibonacci levels shown

Step 4: Click order button (e.g., "BUY YES $50")
  └─→ Order logged as SIMULATED
  └─→ Chat says: "📊 PAPER TRADE LOGGED (View-Only Mode)"

Step 5: Check Orders tab
  └─→ Status shows: "PAPER" or "PAPER-FILLED"
  └─→ P&L updated with simulated result
```

### 🔴 Switching to Live Trading

```
Step 1: Click [📊 VIEW-ONLY] button
  └─→ Changes to [🔴 LIVE]
  └─→ Chat notifies: "LIVE TRADING ACTIVATED"

Step 2: Connect wallet (Wallet tab)
  └─→ Verify on Polygon network
  └─→ Ensure you have USDC

Step 3: Place real trades
  └─→ Orders go to Polymarket CLOB
  └─→ Real funds at risk
```

---

## Order Status Indicators

### Paper Mode Orders
```
┌────────────────────────────────────────────────────────┐
│ TIME     MARKET            SIDE       SIZE   STATUS    │
├────────────────────────────────────────────────────────┤
│ 2:34 PM  Trump wins...     BUY_YES   $50    [PAPER]   │ ← Blue tag
│ 2:35 PM  ETH > $3000...    BUY_NO    $30    [PAPER]   │ ← Blue tag
└────────────────────────────────────────────────────────┘
```

### Live Mode Orders
```
┌────────────────────────────────────────────────────────┐
│ TIME     MARKET            SIDE       SIZE   STATUS    │
├────────────────────────────────────────────────────────┤
│ 2:36 PM  Trump wins...     BUY_YES   $50    [PENDING] │ ← Orange
│ 2:37 PM  ETH > $3000...    BUY_NO    $30    [FILLED]  │ ← Green
└────────────────────────────────────────────────────────┘
```

---

## P&L Display

### Paper Mode
```
┌─────────────────┐
│   PAPER P&L     │  ← Label changes
│     +$45        │
└─────────────────┘
```

### Live Mode
```
┌─────────────────┐
│      P&L        │
│     +$125       │
└─────────────────┘
```

---

## Chat Assistant Behavior

### In Paper Mode
```
User: "What's the best trade?"

TradeHax GPT:
"Top trade: BUY_YES on 'Trump wins...' at 55.0%. 
TrueP 62.3%, EV +0.087, Kelly $52, Fib 61.8%.

📊 Note: You're in VIEW-ONLY mode. Click the order 
button to simulate this trade, or switch to LIVE mode 
to execute for real."
```

### In Live Mode
```
User: "Place the trade"

TradeHax GPT:
"🔴 LIVE ORDER PLACED
BUY_YES $52 on 'Trump wins...'
@ 55.0% | EV: +0.087 | Grade: A

⚠️ Real funds committed. Order pending on Polymarket CLOB."
```

---

## When to Use Each Mode

### 📊 Use Paper Mode When:
- ✅ Learning the platform
- ✅ Testing new strategies
- ✅ Evaluating signal quality
- ✅ Practicing position sizing
- ✅ Researching markets
- ✅ You don't have funds ready

### 🔴 Use Live Mode When:
- ✅ Confident in strategy
- ✅ Wallet connected & funded
- ✅ Understand Kelly sizing
- ✅ Ready to commit capital
- ✅ Accept execution risk

---

## Safety Checklist

Before switching to LIVE mode:

```
□ Tested strategy in paper mode
□ Understand Kelly Criterion
□ Reviewed multiple scan results
□ Wallet connected & verified
□ Sufficient USDC balance
□ Comfortable with position sizes
□ Understand UMA risk scores
□ Aware of market liquidity
```

---

## Common Scenarios

### Scenario 1: Pure Analysis
```
Goal: Research markets without trading
Mode: 📊 VIEW-ONLY
Actions:
  1. Run scans regularly
  2. Track signal quality
  3. Study Fibonacci patterns
  4. Note arbitrage opportunities
  5. Never switch to LIVE
```

### Scenario 2: Strategy Testing
```
Goal: Test a new Kelly fraction
Mode: 📊 VIEW-ONLY
Actions:
  1. Set Kelly fraction (e.g., 0.15)
  2. Simulate 20-30 trades
  3. Track paper P&L
  4. Calculate Sharpe ratio
  5. Compare vs 0.25 fraction
```

### Scenario 3: Live Trading
```
Goal: Execute real trades
Mode: 🔴 LIVE
Actions:
  1. Start with small positions
  2. Monitor fills carefully
  3. Track slippage
  4. Compare vs paper performance
  5. Adjust strategy as needed
```

---

## Troubleshooting

**Q: Button is blue but I want to trade for real**
→ Click the [📊 VIEW-ONLY] button to switch to [🔴 LIVE]

**Q: Orders show "PAPER" but I'm in LIVE mode**
→ Those were placed in paper mode earlier. New orders will be real.

**Q: Can't find the mode toggle**
→ Look in the header, between stats and the wallet indicator

**Q: Paper P&L seems unrealistic**
→ Paper fills are instant at displayed price. Real fills may vary.

**Q: How do I clear paper trades?**
→ Refresh the page (paper trades are not saved)

---

## Keyboard Reference (Future)

```
Ctrl + P          Toggle paper/live mode
Ctrl + Shift + P  Reset paper P&L
Ctrl + O          Open Orders view
Ctrl + W          Open Wallet view
```

---

## Pro Tips

1. **Always Start in Paper** - Even experienced traders should test in paper mode first

2. **Track Win Rate** - Aim for 55%+ win rate in paper before going live

3. **Gradual Transition** - Start live trading with ½ your paper position size

4. **Compare Performance** - Note differences between paper and live fills

5. **Use for Research** - Paper mode is perfect for market research without capital

6. **Reset Often** - Clear paper trades (refresh page) to start fresh tests

7. **Trust the Process** - If paper P&L is negative, don't risk real funds

---

## Summary

| Feature | Paper Mode 📊 | Live Mode 🔴 |
|---------|---------------|--------------|
| **Market Data** | ✅ Real-time | ✅ Real-time |
| **Predictions** | ✅ Full stack | ✅ Full stack |
| **Orders** | Simulated | Real blockchain |
| **Wallet** | Not required | Required |
| **Risk** | Zero | Real funds |
| **Speed** | Instant fills | Market dependent |
| **P&L** | Estimated | Actual |
| **Default** | ✅ Yes | No |

---

**Remember:** Paper trading is for learning and testing. Real trading involves real risk. Always understand a strategy in paper mode before committing actual funds.

🎯 **Start in VIEW-ONLY. Graduate to LIVE when ready.**

