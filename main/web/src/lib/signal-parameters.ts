// Signal thresholds for trading bot cooldowns and risk management
export const SIGNAL_THRESHOLDS = {
  cooldownPeriodMs: 60000, // 1 minute cooldown between signals per symbol
  minConfidence: 0.6,      // Minimum confidence required to trigger a trade
  minSignalConfidence: 0.6, // Alias for compatibility
  maxDrawdown: 0.15,       // Maximum drawdown allowed before pausing signals
  volatilityLimit: 0.08,   // Max volatility allowed for signal activation
};
