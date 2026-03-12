import { extractFeatures } from "./features.js";
import { generateSignal } from "./strategy.js";
import { computeRiskPlan } from "./risk.js";
import { runBacktest } from "./backtest.js";

export class TradeHaxEngine {
  constructor(config = {}) {
    this.config = {
      riskTolerance: config.riskTolerance || "moderate",
      equity: config.equity || 25000,
      macro: config.macro || { bias: 0, liquidityRegime: "neutral" },
    };
  }

  evaluate(candles) {
    const features = extractFeatures(candles);
    const signal = generateSignal(features, this.config.macro);
    const risk = computeRiskPlan(signal, {
      riskTolerance: this.config.riskTolerance,
      equity: this.config.equity,
    });

    return {
      signal,
      risk,
      features,
      generatedAt: Date.now(),
    };
  }

  backtest(candles, options = {}) {
    return runBacktest(candles, {
      profile: {
        riskTolerance: this.config.riskTolerance,
        equity: this.config.equity,
      },
      macro: this.config.macro,
      ...options,
    });
  }
}

