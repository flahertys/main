// signal-parameters.ts
// Centralized configuration for signal generation and trading logic

export const SIGNAL_THRESHOLDS = {
  minEliteConfidence: 0.85,
  minEdge: 0.12,
  minLiveQuality: 0.75,
  maxDisagreement: 0.18,
  minSignalConfidence: 0.65, // Used in tradehax-bot
  cooldownPeriodMs: 60000,   // Used in tradehax-bot
};

export const FACTOR_WEIGHTS = {
  momentum: 0.45,
  sentiment: 0.40,
  volatilityPenalty: 0.15,
  confluenceBoost: 0.20,
};

export const RISK_CONTROLS = {
  recommendedRiskPercent: 1.0,
  kellyFraction: 0.25,
  stopLossDefault: 'ATR(2)',
};

export const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d", "1w"];

export const SIGNAL_ACTIONS = {
  buy: 'BUY',
  sell: 'SELL',
};

// Document each parameter for clarity
// - minEliteConfidence: Minimum confidence for elite signals
// - minEdge: Minimum edge required for signal
// - minLiveQuality: Minimum live quality for signal
// - maxDisagreement: Maximum allowed disagreement ratio
// - minSignalConfidence: Minimum confidence to trigger trade
// - cooldownPeriodMs: Minimum time between trades for same symbol
// - momentum/sentiment/volatilityPenalty/confluenceBoost: Factor weights for confidence calculation
// - recommendedRiskPercent/kellyFraction/stopLossDefault: Risk controls
// - TIMEFRAMES: Supported trading timeframes
// - SIGNAL_ACTIONS: Signal action mapping

