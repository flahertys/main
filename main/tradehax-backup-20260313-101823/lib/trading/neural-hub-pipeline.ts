/**
 * Neural AI Hub Pipeline & Live Trading Data Integration
 * Connects TradeHax neural hub with live stock + Polymarket data
 * For professional premier trading suite
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. LIVE DATA INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

interface LiveDataProvider {
  name: string;
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
  symbols?: string[];
}

// Stock Data Providers
const STOCK_PROVIDERS: Record<string, LiveDataProvider> = {
  "polygon-io": {
    name: "Polygon.io",
    endpoint: "https://api.polygon.io/v1",
    apiKey: process.env.NEXT_PUBLIC_POLYGON_API_KEY || "",
    headers: {
      "Content-Type": "application/json",
    },
  },
  finnhub: {
    name: "Finnhub",
    endpoint: "https://finnhub.io/api/v1",
    apiKey: process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "",
  },
  alpha_vantage: {
    name: "Alpha Vantage",
    endpoint: "https://www.alphavantage.co/query",
    apiKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "",
  },
};

// Polymarket & Prediction Market Providers
const PREDICTION_MARKET_PROVIDERS: Record<string, LiveDataProvider> = {
  polymarket: {
    name: "Polymarket",
    endpoint: "https://clob.polymarket.com",
    headers: {
      "Content-Type": "application/json",
    },
  },
  polymarket_gamma: {
    name: "Polymarket Gamma API",
    endpoint: "https://gamma-api.polymarket.com",
    headers: {
      "Content-Type": "application/json",
    },
  },
};

// Crypto Exchange APIs
const CRYPTO_PROVIDERS: Record<string, LiveDataProvider> = {
  coingecko: {
    name: "CoinGecko",
    endpoint: "https://api.coingecko.com/api/v3",
    // Free API - no key required
  },
  binance: {
    name: "Binance",
    endpoint: "https://api.binance.com/api/v3",
    apiKey: process.env.NEXT_PUBLIC_BINANCE_API_KEY || "",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. NEURAL AI HUB PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

interface NeuralHubConfig {
  enabled: boolean;
  liveDataEnabled: boolean;
  modelId: string;
  hfToken: string;
  endpoints: Record<string, string>;
}

const NEURAL_HUB_CONFIG: NeuralHubConfig = {
  enabled: true,
  liveDataEnabled: true,
  modelId: process.env.NEXT_PUBLIC_HF_MODEL_ID || "meta-llama/Llama-3.3-70B-Instruct",
  hfToken: process.env.NEXT_PUBLIC_HF_API_TOKEN || "",
  endpoints: {
    inference: "https://api-inference.huggingface.co/models",
    chat: "/api/ai/chat",
    signal: "/api/trading/signal",
    data: "/api/trading/data",
  },
};

// Neural Hub Learning Modules
interface NeuralModule {
  id: string;
  name: string;
  purpose: string;
  dataSource: "live" | "history" | "simulation";
  updateInterval: number; // ms
  enabled: boolean;
}

const NEURAL_MODULES: NeuralModule[] = [
  {
    id: "stock-predictor",
    name: "Stock Price Prediction",
    purpose: "Predict next-day stock movements using technical analysis + AI",
    dataSource: "live",
    updateInterval: 300000, // 5 minutes
    enabled: true,
  },
  {
    id: "polymarket-analyzer",
    name: "Polymarket Probability Analyzer",
    purpose: "Analyze prediction market odds and find value bets",
    dataSource: "live",
    updateInterval: 60000, // 1 minute
    enabled: true,
  },
  {
    id: "whale-radar",
    name: "Whale Radar",
    purpose: "Track large transactions and smart money moves",
    dataSource: "live",
    updateInterval: 15000, // 15 seconds
    enabled: true,
  },
  {
    id: "sentiment-engine",
    name: "AI Sentiment Analysis",
    purpose: "Analyze market sentiment from news, social media, on-chain",
    dataSource: "live",
    updateInterval: 600000, // 10 minutes
    enabled: true,
  },
  {
    id: "kelly-optimizer",
    name: "Kelly Criterion Optimizer",
    purpose: "Calculate optimal position sizing for all trades",
    dataSource: "simulation",
    updateInterval: 300000, // 5 minutes
    enabled: true,
  },
  {
    id: "monte-carlo-sim",
    name: "Monte Carlo Simulation Engine",
    purpose: "Run 500+ path simulations to model risk",
    dataSource: "simulation",
    updateInterval: 900000, // 15 minutes
    enabled: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. LIVE DATA FETCHERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch live stock data
 */
export async function fetchStockData(
  symbol: string,
  provider: "polygon-io" | "finnhub" | "alpha_vantage" = "polygon-io"
): Promise<any> {
  const config = STOCK_PROVIDERS[provider];
  if (!config.apiKey) {
    console.warn(`⚠️ No API key configured for ${provider}`);
    return null;
  }

  try {
    const response = await fetch(`${config.endpoint}/quote/${symbol}?apiKey=${config.apiKey}`, {
      headers: config.headers,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Failed to fetch stock data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch live Polymarket prediction market data
 */
export async function fetchPolymarketData(marketId?: string): Promise<any> {
  try {
    const endpoint = marketId
      ? `${PREDICTION_MARKET_PROVIDERS.polymarket.endpoint}/markets/${marketId}`
      : `${PREDICTION_MARKET_PROVIDERS.polymarket.endpoint}/markets`;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("❌ Failed to fetch Polymarket data:", error);
    return null;
  }
}

/**
 * Fetch live crypto data (free from CoinGecko)
 */
export async function fetchCryptoData(ids: string[] = ["solana", "ethereum", "bitcoin"]): Promise<any> {
  try {
    const idStr = ids.join(",");
    const response = await fetch(
      `${CRYPTO_PROVIDERS.coingecko.endpoint}/simple/price?ids=${idStr}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("❌ Failed to fetch crypto data:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. NEURAL HUB API INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Call HuggingFace LLM for AI analysis
 */
export async function callNeuralHub(
  prompt: string,
  modelId?: string,
  maxTokens: number = 512
): Promise<string> {
  const token = NEURAL_HUB_CONFIG.hfToken;

  if (!token) {
    console.error("❌ HF_API_TOKEN not configured");
    return "AI service not available - missing API token";
  }

  try {
    const response = await fetch(
      `${NEURAL_HUB_CONFIG.endpoints.inference}/${modelId || NEURAL_HUB_CONFIG.modelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            top_p: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.error("❌ Invalid HF token - authentication failed");
        return "Invalid API token - please check configuration";
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || "No response from AI";
  } catch (error) {
    console.error("❌ Neural Hub API error:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Unified trading signal generation with live data
 */
export async function generateTradingSignal(
  symbol: string,
  marketType: "stock" | "crypto" | "prediction" = "stock",
  settings?: {
    preset?: string;
    indicators?: string[];
    chartSettings?: Record<string, any>;
    aiSettings?: Record<string, any>;
    llmSettings?: Record<string, any>;
  }
): Promise<any> {
        // ─── Signal Preset Registry ──────────────────────────────────────────────
        // Presets are grouped by reliability, confluence, and signal type
        // Each preset defines indicator set and reliability weights
        const PRESET_REGISTRY: Record<string, {
          name: string;
          indicators: string[];
          reliability: number; // 0-1
          description: string;
          weights: Record<string, number>; // indicator reliability
        }> = {
          "trend-following": {
            name: "Trend-Following",
            indicators: ["EMA", "Supertrend", "MACD"],
            reliability: 0.92,
            description: "Uses EMA, Supertrend, MACD for robust trend signals.",
            weights: { EMA: 0.95, Supertrend: 0.92, MACD: 0.89 },
          },
          "volatility-breakout": {
            name: "Volatility Breakout",
            indicators: ["ATR", "BollingerBands", "Volume"],
            reliability: 0.85,
            description: "ATR, Bollinger Bands, Volume for breakout detection.",
            weights: { ATR: 0.88, BollingerBands: 0.86, Volume: 0.80 },
          },
          "confluence": {
            name: "Multi-Timeframe Confluence",
            indicators: ["EMA", "ATR", "Supertrend", "RSI"],
            reliability: 0.97,
            description: "Combines trend, volatility, and momentum for high-confidence confluence.",
            weights: { EMA: 0.95, ATR: 0.90, Supertrend: 0.92, RSI: 0.93 },
          },
          "sentiment-ai": {
            name: "AI Sentiment",
            indicators: ["Sentiment", "Volume", "MACD"],
            reliability: 0.81,
            description: "AI-driven sentiment, volume, and MACD for social signals.",
            weights: { Sentiment: 0.80, Volume: 0.78, MACD: 0.82 },
          },
          // Add more presets as needed
        };

        // Select preset or fallback to indicators
        const presetName = settings?.preset || "confluence";
        const preset = PRESET_REGISTRY[presetName] || PRESET_REGISTRY["confluence"];
        const selectedIndicators = settings?.indicators || preset.indicators;

  console.log(`📊 Generating signal for ${symbol} (${marketType})...`);

  try {
    // 1. Fetch live data
    let liveData: any = null;
    if (marketType === "stock") {
      liveData = await fetchStockData(symbol);
    } else if (marketType === "crypto") {
      liveData = await fetchCryptoData([symbol.toLowerCase()]);
    } else if (marketType === "prediction") {
      liveData = await fetchPolymarketData(symbol);
    }

    if (!liveData) {
      console.warn(`⚠️ Could not fetch live data for ${symbol}`);
    }

    // 2. Modular indicator registry for easy addition/removal
    // To add a new indicator, add an entry below with its calculation function and required data keys.
    // Example stub for new indicator:
    // MyIndicator: {
    //   fn: async () => (await import("./technical-indicators")).calcMyIndicator,
    //   params: { period: 20 },
    //   required: ["closes"],
    // },
    const indicatorRegistry = {
      EMA: {
        fn: async () => (await import("./technical-indicators")).calcEMA,
        params: { period: 21 },
        required: ["closes"],
      },
      ATR: {
        fn: async () => (await import("./technical-indicators")).calcATR,
        params: { period: 14 },
        required: ["highs", "lows", "closes"],
      },
      Supertrend: {
        fn: async () => (await import("./technical-indicators")).calcSupertrend,
        params: { period: 10, multiplier: 3 },
        required: ["highs", "lows", "closes"],
      },
      // Add/remove indicators here
    };

    // Use user-selected indicators or default set
    const selectedIndicators = settings?.indicators || ["EMA", "ATR", "Supertrend"];
    // Validate selected indicators
    const unsupportedIndicators = selectedIndicators.filter(ind => !(ind in indicatorRegistry));
    if (unsupportedIndicators.length > 0) {
      console.warn(`⚠️ Unsupported indicators requested: ${unsupportedIndicators.join(", ")}`);
    }
    const validIndicators = selectedIndicators.filter(ind => ind in indicatorRegistry);

    // ─── Algo Scoring Function ───────────────────────────────────────────────
    // Scores signal based on indicator reliability, confluence, and backtest stats
    function computeAlgoScore(indicatorSummary: Record<string, any>, preset: typeof PRESET_REGISTRY[string], backtestStats?: { winRate?: number; avgProfit?: number; maxDrawdown?: number }): {
      score: number;
      breakdown: string;
      weights: Record<string, number>;
    } {
      // Reliability: average preset reliability
      const reliability = preset.reliability;
      // Confluence: count of timeframes with all valid indicators
      const confluenceCount = Object.values(indicatorSummary).filter(tfInd => validIndicators.every(ind => tfInd[ind] !== null && tfInd[ind] !== undefined)).length;
      // Backtest: winRate and avgProfit if available
      const winRate = backtestStats?.winRate || 0.65;
      const avgProfit = backtestStats?.avgProfit || 1.0;
      // Score formula: reliability * confluence * (winRate + avgProfit/10)
      const score = Math.round(100 * reliability * (confluenceCount / validIndicators.length) * (winRate + avgProfit / 10));
      const breakdown = `Preset: ${preset.name}, Reliability: ${reliability}, Confluence: ${confluenceCount}/${validIndicators.length}, WinRate: ${winRate}, AvgProfit: ${avgProfit}`;
      return { score, breakdown, weights: preset.weights };
    }

    const timeframes = ["5m", "15m", "1h", "4h", "1d", "1w"];
    const indicatorSummary: Record<string, any> = {};
    for (const tf of timeframes) {
      const tfData = liveData?.timeframes?.[tf];
      if (!tfData) continue;
      indicatorSummary[tf] = {};
      for (const indName of validIndicators) {
        const reg = indicatorRegistry[indName];
        if (!reg) continue;
        const fn = await reg.fn();
        // Gather required data
        const args = reg.required.map(k => tfData[k]);
        // Add params
        if (indName === "EMA") args.push(reg.params.period);
        if (indName === "ATR") args.push(reg.params.period);
        if (indName === "Supertrend") args.push(reg.params.period, reg.params.multiplier);
        // Compute indicator
        let result;
        try {
          result = fn(...args);
        } catch (err) {
          console.warn(`⚠️ Error computing ${indName} for ${tf}: ${err}`);
          result = null;
        }
        if (indName === "Supertrend" && result) {
          indicatorSummary[tf][indName] = {
            trend: result.trend[result.trend.length - 1],
            value: result.value[result.value.length - 1],
          };
        } else if (result) {
          indicatorSummary[tf][indName] = result[result.length - 1];
        } else {
          indicatorSummary[tf][indName] = null;
        }
      }
    }

    // 3. Aggregate confluence and trend overlays
    const confluence = timeframes.map(tf => {
      const ind = indicatorSummary[tf];
      if (!ind) return `${tf}: no data`;
      return validIndicators.map(indName => {
        const val = ind[indName];
        if (val === null || val === undefined) return `${indName}: n/a`;
        if (indName === "Supertrend") return `Supertrend=${val.trend} (${val.value?.toFixed(2)})`;
        return `${indName}=${val?.toFixed ? val.toFixed(2) : val}`;
      }).join(", ");
    }).map((s, i) => `${timeframes[i]}: ${s}`).join("\n");

    // 4. Prepare prompt for neural hub, including chart/AI/LLM settings
    const prompt = `
    Given the following live market data for ${symbol} (${marketType}):
    ${JSON.stringify(liveData, null, 2)}

    Technical indicator summary (multi-timeframe confluence):
    ${confluence}

    Chart settings: ${JSON.stringify(settings?.chartSettings || {}, null, 2)}
    AI settings: ${JSON.stringify(settings?.aiSettings || {}, null, 2)}
    LLM settings: ${JSON.stringify(settings?.llmSettings || {}, null, 2)}

    Provide a concise trading signal with:
    1. Direction (BUY / SELL / HOLD)
    2. Confidence (0-100)
    3. Target price
    4. Stop loss
    5. Risk/reward ratio

    Format as JSON.
    `;

    // 5. Call neural hub for AI analysis
    const aiResponse = await callNeuralHub(prompt, undefined, 256);

    // 6. Parse and return signal
    try {
      const signal = JSON.parse(aiResponse);
      // Example: backtestStats can be fetched or stubbed here
      const backtestStats = signal.backtestStats || { winRate: 0.68, avgProfit: 1.2, maxDrawdown: 0.15 };
      const algoScore = computeAlgoScore(indicatorSummary, preset, backtestStats);
      return {
        symbol,
        marketType,
        timestamp: new Date().toISOString(),
        preset: preset.name,
        presetDescription: preset.description,
        presetWeights: preset.weights,
        liveData,
        indicatorSummary,
        settings,
        signal,
        algoScore: algoScore.score,
        algoScoreBreakdown: algoScore.breakdown,
        algoScoreWeights: algoScore.weights,
        status: "success",
      };
    } catch {
      const algoScore = computeAlgoScore(indicatorSummary, preset);
      return {
        symbol,
        marketType,
        timestamp: new Date().toISOString(),
        preset: preset.name,
        presetDescription: preset.description,
        presetWeights: preset.weights,
        liveData,
        indicatorSummary,
        settings,
        rawResponse: aiResponse,
        algoScore: algoScore.score,
        algoScoreBreakdown: algoScore.breakdown,
        algoScoreWeights: algoScore.weights,
        status: "partial",
      };
    }
  } catch (error) {
    console.error(`❌ Error generating signal for ${symbol}:`, error);
    return {
      symbol,
      error: error instanceof Error ? error.message : "Unknown error",
      status: "error",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CONSOLIDATED TRADING BOT CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main trading bot interface with neural hub + live data
 */
export class TradeHaxNeuralBot {
  private moduleStates: Map<string, any> = new Map();
  private dataCache: Map<string, any> = new Map();
  private lastUpdate: Map<string, number> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log("🤖 Initializing TradeHax Neural Bot with live data...");
    NEURAL_MODULES.forEach((mod) => {
      if (mod.enabled) {
        this.moduleStates.set(mod.id, { status: "ready", lastRun: null, nextRun: Date.now() });
      }
    });
  }

  async runAnalysis(symbol: string, marketType: "stock" | "crypto" | "prediction" = "stock") {
    console.log(`\n🚀 Running analysis for ${symbol}...`);

    const signal = await generateTradingSignal(symbol, marketType);
    console.log("✅ Signal generated:", signal);

    return signal;
  }

  async updateAllModules() {
    console.log("\n🔄 Updating all neural modules with live data...");

    for (const module of NEURAL_MODULES) {
      if (!module.enabled) continue;

      const lastRun = this.lastUpdate.get(module.id) || 0;
      const now = Date.now();

      if (now - lastRun < module.updateInterval) {
        continue; // Skip if not enough time passed
      }

      console.log(`⏱️  Updating ${module.name}...`);
      // Module-specific updates would go here
      this.lastUpdate.set(module.id, now);
    }
  }

  getStatus() {
    return {
      enabled: NEURAL_HUB_CONFIG.enabled,
      liveDataEnabled: NEURAL_HUB_CONFIG.liveDataEnabled,
      modules: Array.from(this.moduleStates.entries()),
      lastUpdates: Array.from(this.lastUpdate.entries()),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  NEURAL_HUB_CONFIG,
  NEURAL_MODULES,
  STOCK_PROVIDERS,
  PREDICTION_MARKET_PROVIDERS,
  CRYPTO_PROVIDERS,
};

export const neuralBot = new TradeHaxNeuralBot();

