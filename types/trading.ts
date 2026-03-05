/**
 * Shared trading type definitions used across all 5 feature modules:
 * Sentiment Engine, Strategy Builder, XAI Panel, Portfolio Dashboard, Backtesting Sandbox.
 */

// ─── Signal Types ─────────────────────────────────────────────────────────────

/** A trading signal produced by the AI engine. */
export interface TradingSignal {
  id: string;
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number; // 0-1
  price: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  generatedAt: string; // ISO 8601
  source: string;
  tags?: string[];
}

// ─── Sentiment Types ──────────────────────────────────────────────────────────

export type SentimentCategory =
  | "extreme_fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme_greed";

/** Composite sentiment score for a single asset or the overall market. */
export interface SentimentScore {
  symbol: string; // "BTC" | "ETH" | "SOL" | "MARKET"
  score: number; // -100 to +100
  category: SentimentCategory;
  socialScore: number;
  newsScore: number;
  onChainScore: number;
  timestamp: string; // ISO 8601
}

/** An individual event that contributed to the sentiment score. */
export interface SentimentEvent {
  id: string;
  symbol: string;
  source: "twitter" | "reddit" | "news" | "on-chain" | "derivatives";
  text: string;
  score: number; // -100 to +100
  weight: number; // 0-1 relative contribution weight
  timestamp: string;
  url?: string;
}

/** Rolling time-series entry for sentiment history. */
export interface SentimentHistoryPoint {
  timestamp: string;
  score: number;
  category: SentimentCategory;
}

/** Full sentiment snapshot for all tracked assets. */
export interface SentimentSnapshot {
  generatedAt: string;
  market: SentimentScore;
  assets: SentimentScore[];
  recentEvents: SentimentEvent[];
  history24h: SentimentHistoryPoint[];
  history7d: SentimentHistoryPoint[];
  history30d: SentimentHistoryPoint[];
}

// ─── Strategy Builder Types ───────────────────────────────────────────────────

export type BlockCategory = "entry" | "exit" | "filter" | "action";

export type BlockType =
  | "price_cross"
  | "rsi_threshold"
  | "macd_signal"
  | "sentiment_threshold"
  | "volume_spike"
  | "take_profit"
  | "stop_loss"
  | "trailing_stop"
  | "time_based_exit"
  | "market_hours"
  | "volatility_filter"
  | "trend_filter"
  | "buy"
  | "sell"
  | "limit_order"
  | "dca_increment";

export type BlockParamType = "number" | "select" | "toggle" | "percent";

export interface BlockParam {
  key: string;
  label: string;
  type: BlockParamType;
  value: string | number | boolean;
  options?: string[]; // for "select" type
  min?: number;
  max?: number;
  step?: number;
  isPremium?: boolean;
}

/** A single configurable block in the strategy builder canvas. */
export interface StrategyBlock {
  id: string;
  type: BlockType;
  category: BlockCategory;
  label: string;
  description: string;
  params: BlockParam[];
  position: number; // order in the canvas (0-based)
  enabled: boolean;
  isPremium: boolean;
}

/** A complete serialized strategy. */
export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  blocks: StrategyBlock[];
  tags: string[];
  templateId?: string;
}

/** Result of strategy validation. */
export interface StrategyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── XAI / Signal Explainability Types ───────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

/** A single contributing factor to a signal's confidence. */
export interface SignalFactor {
  name: string;
  weight: number; // 0-1
  value: string; // human-readable description of the factor value
  direction: "bullish" | "bearish" | "neutral";
}

/** Historical performance data for a signal type. */
export interface SignalHistoricalPerformance {
  signalType: string;
  winRate: number; // 0-1
  avgReturnPct: number;
  sampleSize: number;
  timeRange: string;
}

/** A past signal that is similar to the current one. */
export interface SimilarSignal {
  id: string;
  symbol: string;
  action: "buy" | "sell" | "hold";
  generatedAt: string;
  outcome: "win" | "loss" | "pending";
  returnPct: number;
  similarity: number; // 0-1
}

/** Full explanation for a single trading signal. */
export interface SignalExplanation {
  signalId: string;
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number; // 0-1
  factors: SignalFactor[];
  dataPointsAnalyzed: number;
  timeRangeAnalyzed: string;
  dataSources: string[];
  historicalPerformance: SignalHistoricalPerformance;
  riskLevel: RiskLevel;
  riskReason: string;
  naturalLanguageSummary: string;
  similarSignals: SimilarSignal[];
  generatedAt: string;
}

// ─── Portfolio Types ──────────────────────────────────────────────────────────

export type SupportedExchange = "binance" | "coinbase" | "kraken" | "manual";

/** API credentials for a connected exchange. */
export interface ExchangeConnection {
  id: string;
  exchange: SupportedExchange;
  label: string;
  apiKey: string; // masked after saving
  status: "connected" | "disconnected" | "error" | "testing";
  lastSynced?: string;
  errorMessage?: string;
}

/** A single asset holding in the portfolio. */
export interface PortfolioAsset {
  symbol: string;
  name: string;
  exchange: SupportedExchange;
  quantity: number;
  avgCostBasis: number;
  currentPrice: number;
  valueUsd: number;
  change24hPct: number;
  allocationPct: number; // 0-100
  color?: string; // for chart rendering
}

/** A portfolio-level rebalance suggestion. */
export interface RebalanceSuggestion {
  id: string;
  action: "buy" | "sell";
  symbol: string;
  exchange: SupportedExchange;
  quantity: number;
  estimatedValueUsd: number;
  reasoning: string;
  priority: "high" | "medium" | "low";
}

/** Full portfolio snapshot. */
export interface PortfolioSnapshot {
  generatedAt: string;
  totalValueUsd: number;
  change24hUsd: number;
  change24hPct: number;
  assets: PortfolioAsset[];
  connections: ExchangeConnection[];
  rebalanceSuggestions: RebalanceSuggestion[];
  performanceHistory: { timestamp: string; valueUsd: number }[];
}

// ─── Backtesting Types ────────────────────────────────────────────────────────

export type BacktestTimeRange = "1M" | "3M" | "6M" | "1Y" | "custom";

/** Configuration input for a backtest run. */
export interface BacktestConfig {
  id: string;
  symbol: string;
  timeRange: BacktestTimeRange;
  customStartDate?: string;
  customEndDate?: string;
  initialCapital: number;
  feePct: number; // e.g. 0.1 for 0.1%
  slippagePct: number;
  strategyId?: string;
  strategyJson?: StrategyDefinition;
}

/** A single simulated trade in the backtest. */
export interface BacktestTrade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: string;
  exitTime: string;
  durationMs: number;
  pnlUsd: number;
  pnlPct: number;
  fees: number;
  signalReason: string;
}

/** Time-series equity point for charting. */
export interface EquityPoint {
  timestamp: string;
  equity: number;
  benchmark: number; // buy-and-hold value
}

/** Monthly return for heatmap display. */
export interface MonthlyReturn {
  year: number;
  month: number; // 1-12
  returnPct: number;
}

/** Key performance statistics for a backtest run. */
export interface BacktestStats {
  totalReturnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRatePct: number;
  avgTradeDurationMs: number;
  totalTrades: number;
  profitFactor: number;
  benchmarkReturnPct: number;
}

/** Complete result of a backtest run. */
export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  stats: BacktestStats;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  completedAt: string;
}
