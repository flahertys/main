/**
 * SignalExplainabilityEngine
 * Decompose trading signals into auditable factor weights + backtested confidence
 * Output: Natural language reasoning + machine-readable factor attribution
 */

import { SIGNAL_THRESHOLDS, FACTOR_WEIGHTS, RISK_CONTROLS, SIGNAL_ACTIONS } from './signal-parameters';

export interface SignalFactors {
  momentum: {
    value: number; // e.g., RSI=32
    zone: string; // e.g., "oversold"
    weight: number; // 0-1, impact on confidence
    direction: "bullish" | "bearish" | "neutral";
  };
  sentiment: {
    value: number; // e.g., +62 (bullish tail event)
    source: string; // "social", "news", "onchain"
    weight: number;
    direction: "bullish" | "bearish" | "neutral";
  };
  volatility: {
    value: number; // e.g., IV percentile 65
    band: string; // "low" | "moderate" | "elevated"
    weight: number;
    penalty: number; // penalty applied if volatility too high
    direction: "bullish" | "bearish" | "neutral";
  };
  technicalConfluence: {
    confirmedSources: string[]; // ["RSI", "MACD", "Bollinger"]
    sourceCount: number;
    weight: number;
  };
}

export interface SignalExplanation {
  symbol: string;
  action: "BUY" | "SELL";
  confidence: number; // 0-100
  factors: SignalFactors;
  reasoning: string; // Natural language
  factorBreakdown: string; // "45% momentum, 40% sentiment, -15% volatility penalty"
  backtestValidation: {
    historicalWinRate: number;
    avgProfitOnSimilar: number;
    maxDrawdownOnSimilar: number;
  };
  dataQuality: {
    sources: string[];
    freshness: string;
    confidence: number; // How fresh/reliable the data is
  };
  positionSizing: {
    recommendedRiskPercent: number;
    kellyFraction: number;
    suggestedStopLoss: string;
  };
}

export class SignalExplainabilityEngine {
  /**
   * Generate explainable signal with auditable factor weights
   */
  generateSignalExplanation(
    symbol: string,
    factors: SignalFactors,
    backtestStats: { winRate: number; avgProfit: number; maxDrawdown: number },
    dataQuality: { sources: string[]; freshness: string; confidence: number }
  ): SignalExplanation {
    // Compute base confidence from factors using centralized weights
    const momentumScore = FACTOR_WEIGHTS.momentum * (factors.momentum.direction === "bullish" ? 1 : -1);
    const sentimentScore = FACTOR_WEIGHTS.sentiment * (factors.sentiment.direction === "bullish" ? 1 : -1);
    const volatilityPenalty = FACTOR_WEIGHTS.volatilityPenalty * factors.volatility.penalty;
    const confluenceBoost = FACTOR_WEIGHTS.confluenceBoost * (factors.technicalConfluence.sourceCount / 5);

    const baseConfidence = Math.max(0, Math.min(100, (momentumScore + sentimentScore + confluenceBoost - volatilityPenalty) * 100));

    // Apply data quality discount
    const dataQualityDiscount = (1 - dataQuality.confidence) * 10;
    const finalConfidence = baseConfidence - dataQualityDiscount;

    // Determine action based on factor direction consensus
    const bullishScore = [factors.momentum, factors.sentiment, factors.volatility].filter(
      (f) => f.direction === "bullish"
    ).length;
    const action = bullishScore >= 2 ? SIGNAL_ACTIONS.buy : SIGNAL_ACTIONS.sell;

    // Natural language reasoning
    const reasoning = this.buildNaturalLanguageReasoning(factors, action, finalConfidence);

    // Factor breakdown string
    const momentumPct = (FACTOR_WEIGHTS.momentum * 100).toFixed(0);
    const sentimentPct = (FACTOR_WEIGHTS.sentiment * 100).toFixed(0);
    const volatilityPct = (FACTOR_WEIGHTS.volatilityPenalty * 100).toFixed(0);
    const factorBreakdown = `${momentumPct}% momentum, ${sentimentPct}% sentiment, -${volatilityPct}% volatility penalty`;

    // Position sizing based on Kelly Criterion and centralized risk controls
    const winRate = backtestStats.winRate;
    const avgProfit = backtestStats.avgProfit;
    const assumedAvgLoss = Math.abs(avgProfit) * 0.5; // Conservative loss estimate
    const kellyFraction = (winRate * avgProfit - (1 - winRate) * assumedAvgLoss) / avgProfit;
    const recommendedRiskPercent = Math.max(1, Math.min(5, kellyFraction * 100 * RISK_CONTROLS.kellyFraction));

    return {
      symbol,
      action,
      confidence: Math.round(finalConfidence),
      factors,
      reasoning,
      factorBreakdown,
      backtestValidation: {
        historicalWinRate: Math.round(backtestStats.winRate * 100),
        avgProfitOnSimilar: Math.round(backtestStats.avgProfit),
        maxDrawdownOnSimilar: Math.round(backtestStats.maxDrawdown * 100),
      },
      dataQuality,
      positionSizing: {
        recommendedRiskPercent,
        kellyFraction: kellyFraction * RISK_CONTROLS.kellyFraction,
        suggestedStopLoss: RISK_CONTROLS.stopLossDefault,
      },
    };
  }

  /**
   * Build natural language reasoning from factors
   */
  private buildNaturalLanguageReasoning(factors: SignalFactors, action: string, confidence: number): string {
    const lines: string[] = [];

    // Momentum line
    const momentumDesc =
      factors.momentum.direction === "bullish"
        ? `${factors.momentum.value} is in the ${factors.momentum.zone} zone, signaling potential reversal strength`
        : `${factors.momentum.value} indicates ${factors.momentum.zone} conditions, favoring downside`;
    lines.push(`**Momentum**: ${momentumDesc} (45% weight).`);

    // Sentiment line
    const sentimentDesc =
      factors.sentiment.direction === "bullish"
        ? `Sentiment is ${factors.sentiment.value > 0 ? "+" : ""}${factors.sentiment.value} (${factors.sentiment.source}), showing bullish tail events`
        : `Sentiment is negative (${factors.sentiment.source}), reflecting caution`;
    lines.push(`**Sentiment**: ${sentimentDesc} (40% weight).`);

    // Volatility line
    const volatilityDesc =
      factors.volatility.band === "elevated"
        ? `Volatility is elevated (IV ${factors.volatility.value}%), reducing confidence by ${(factors.volatility.penalty * 100).toFixed(0)}%`
        : `Volatility is ${factors.volatility.band} (IV ${factors.volatility.value}%), providing stable conditions`;
    lines.push(`**Volatility**: ${volatilityDesc}.`);

    // Technical confluence
    lines.push(`**Technical Confluence**: ${factors.technicalConfluence.confirmedSources.join(", ")} all align, boosting confidence.`);

    // Confidence summary
    lines.push(
      `\n**Overall**: ${confidence}% confidence ${action}. On similar historical signals at this confidence level, win rate is high; recommend strict stop-loss.`
    );

    return lines.join("\n");
  }

  /**
   * Format explanation for UI display (machine-readable + human-readable)
   */
  formatForDisplay(explanation: SignalExplanation): { summary: string; details: object } {
    return {
      summary: `${explanation.action} ${explanation.symbol} @ ${explanation.confidence}% confidence\n${explanation.factorBreakdown}\nRisk: ${explanation.positionSizing.recommendedRiskPercent.toFixed(1)}% | Historical Win Rate: ${explanation.backtestValidation.historicalWinRate}%`,
      details: {
        action: explanation.action,
        confidence: explanation.confidence,
        reasoning: explanation.reasoning,
        factorBreakdown: explanation.factorBreakdown,
        backtestValidation: explanation.backtestValidation,
        dataQuality: explanation.dataQuality,
        positionSizing: explanation.positionSizing,
      },
    };
  }
}

