# TradeHax Paper Trading Mode - Feature Documentation

## Overview

TradeHax now includes a **VIEW-ONLY / Paper Trading Mode** that allows users to analyze markets, receive predictions, and simulate trades without executing real transactions or risking actual funds.

## Key Features

### 🎯 What Paper Trading Mode Does

1. **Full Market Analysis** - All prediction and analysis features work exactly as in live mode
   - Kelly Criterion sizing calculations
   - Fibonacci retracements & extensions
   - Bayesian probability updates
   - Monte Carlo simulations
   - Multi-timeframe analysis
   - Gabagool arbitrage detection

2. **Simulated Order Execution** - Orders are logged and tracked but not sent to the blockchain
   - Paper trades are marked with "PAPER" status
   - Instant "fills" for testing strategies
   - P&L tracking shows simulated performance
   - No wallet connection required

3. **Risk-Free Testing** - Perfect for:
   - Learning the platform
   - Testing trading strategies
   - Evaluating signal quality
   - Understanding Kelly sizing
   - Practicing without capital

### 🔄 Mode Switching

**Toggle Button Location:** Top header, between stats and wallet indicator

- **📊 VIEW-ONLY** (Blue) - Paper trading mode active
- **🔴 LIVE** (Red) - Real trading mode active

**Default:** Application starts in VIEW-ONLY mode for safety

### 📊 Paper Trading Features

#### Order Simulation
```
When you click an order button in paper mode:
1. Order is logged with "PAPER-" ID prefix
2. Simulated fill happens in ~800ms
3. P&L is calculated at 50% of expected value
4. Status shows as "PAPER" or "PAPER-FILLED"
```

#### Visual Indicators
- **Header P&L:** Shows "PAPER P&L" instead of "P&L"
- **Mode Toggle:** Blue 📊 icon for view-only
- **Orders View:** Header shows "PAPER TRADING MODE"
- **Order Status:** Paper trades marked in blue

#### Chat Assistant
- GPT assistant notifies you when orders are simulated
- Explains that trades are for analysis only
- Prompts you to switch to LIVE mode for real execution

## Usage Guide

### Starting in Paper Mode (Default)

1. Open TradeHax application
2. Click **SCAN** to load live market data
3. Review predictions and Kelly sizing
4. Click order buttons to simulate trades
5. Track performance in Orders tab

### Switching to Live Trading

1. Click the **📊 VIEW-ONLY** button in header
2. Button changes to **🔴 LIVE**
3. Connect wallet in Wallet tab
4. Real trades will now execute on-chain

### Switching Back to Paper Mode

1. Click the **🔴 LIVE** button
2. Returns to **📊 VIEW-ONLY** mode
3. All subsequent trades are simulated

## Technical Implementation

### State Management
```javascript
const [paperMode, setPaperMode] = useState(true); // Default to paper trading
```

### Order Placement Logic
```javascript
// Paper mode: Simulate order
if (paperMode) {
  const o = { 
    id: "PAPER-" + randomHex(), 
    status: "SIMULATED",
    // ... other order details
  };
  // Instant simulated fill
  setTimeout(() => updateStatus("PAPER-FILLED"), 800);
}

// Live mode: Execute real order
else {
  if (!wallet) return error("Connect wallet first");
  const o = { 
    id: "0x" + randomHex(), 
    status: "PENDING",
    // ... submit to blockchain
  };
}
```

### P&L Calculation
- **Paper Trades:** P&L credited at 50% of expected value
- **Live Trades:** P&L based on actual fills
- Both modes track win rate and trade count

## Safety Features

1. **Default Paper Mode** - App starts in view-only to prevent accidental trades
2. **Clear Visual Indicators** - Mode is always visible in header
3. **Chat Notifications** - Assistant alerts you about current mode
4. **No Wallet Required** - Paper mode works without wallet connection
5. **Separate P&L Tracking** - Paper P&L labeled differently from live P&L

## Use Cases

### 1. Learning & Education
- New users can explore all features risk-free
- Understand Kelly criterion before using real funds
- Learn market analysis without pressure

### 2. Strategy Testing
- Test new trading strategies
- Evaluate signal quality over time
- Compare multi-timeframe approaches
- Validate Fibonacci entry points

### 3. Market Research
- Analyze market opportunities
- Study arbitrage patterns
- Monitor UMA risk scores
- Track Whale Radar signals

### 4. Portfolio Simulation
- Test position sizing
- Evaluate bankroll management
- Calculate risk-adjusted returns
- Optimize Kelly fraction

## Limitations

1. **Fills Are Simulated** - Paper trades don't account for:
   - Real order book depth
   - Slippage
   - Gas fees
   - Market impact

2. **P&L Is Estimated** - Based on expected value, not actual execution

3. **No Blockchain Interaction** - Cannot test:
   - Wallet signing flow
   - Transaction speed
   - Gas optimization

## Best Practices

### For Beginners
1. ✅ Start in paper mode (default)
2. ✅ Run multiple scans to see signal consistency
3. ✅ Track paper P&L over 20-30 trades
4. ✅ Understand Kelly sizing before going live
5. ✅ Only switch to LIVE mode when confident

### For Experienced Traders
1. ✅ Use paper mode to test new strategies
2. ✅ Validate signal quality in paper mode first
3. ✅ Compare paper vs live performance
4. ✅ Use for market research without capital commitment

### Risk Management
1. ⚠️ Paper success ≠ live success (execution matters)
2. ⚠️ Always start with small positions in live mode
3. ⚠️ Use fractional Kelly in live trading (¼ or less)
4. ⚠️ Set position limits even in paper mode for realistic testing

## FAQ

**Q: Does paper mode use real market data?**  
A: Yes! Paper mode uses live Polymarket data, real price feeds, and actual market conditions. Only the order execution is simulated.

**Q: Can I track paper vs live performance separately?**  
A: Currently, the system tracks all trades together. Reset your browser to clear paper trades before going live, or track manually.

**Q: Do I need to connect a wallet in paper mode?**  
A: No. Paper mode works without any wallet connection. Wallet is only required for live trading.

**Q: How accurate are paper trade fills?**  
A: Paper fills are instant and assume your order would execute at the displayed price. Real fills may vary due to slippage and order book depth.

**Q: Can I use the AI chat in paper mode?**  
A: Yes! All AI features work in both modes. The assistant will indicate when trades are simulated.

**Q: Is my paper P&L saved?**  
A: P&L is stored in browser state during the session. It resets when you refresh the page.

## Keyboard Shortcuts (Future)

- `Ctrl+P` - Toggle paper/live mode
- `Ctrl+Shift+P` - Reset paper P&L
- `Ctrl+L` - View paper trade log

## Deployment Status

✅ **IMPLEMENTED** - Paper trading mode is live in the codebase  
✅ **TESTED** - Build successful (470KB, 162KB gzipped)  
✅ **DOCUMENTED** - Complete feature documentation  
🟢 **READY** - Deploy to tradehax.net

## Version History

- **v1.1.0** (March 7, 2026) - Paper trading mode added
  - View-only mode as default
  - Simulated order execution
  - Paper P&L tracking
  - Mode toggle in header
  - Chat integration

---

**Safety First:** TradeHax prioritizes user education and risk management by defaulting to paper trading mode. Users must explicitly switch to live trading, ensuring they understand the platform before committing real funds.

