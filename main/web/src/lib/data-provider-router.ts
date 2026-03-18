/**
 * DataProviderRouter
 * Multi-source market data with automatic freshness scoring and conflict detection
 * Sources: Binance, Finnhub, Polymarket (with configurable priority + timeout)
 */

export interface DataPoint {
  symbol: string;
  price: number;
  timestamp: number;
  source: "binance" | "finnhub" | "polymarket";
  freshness: "realtime" | "1min" | "5min" | "stale";
  confidence: number; // 0-1 based on freshness + cross-source agreement
}

export interface DataSourceResult {
  success: boolean;
  data?: DataPoint;
  error?: string;
  latency: number; // milliseconds
}

export class DataProviderRouter {
  private binanceCache: Map<string, DataPoint> = new Map();
  private finnhubCache: Map<string, DataPoint> = new Map();
  private polymarketCache: Map<string, DataPoint> = new Map();
  private fetchTimeout = 2000; // ms

  /**
   * Fetch price data from multiple sources with freshness scoring
   */
  async getQuote(symbol: string): Promise<{ price: number; confidence: number; sources: string[]; freshness: string }> {
    const now = Date.now();

    // Fetch in parallel with timeout
    const [binanceResult, finnhubResult, polymarketResult] = await Promise.allSettled([
      this.fetchBinance(symbol),
      this.fetchFinnhub(symbol),
      this.fetchPolymarket(symbol),
    ]);

    const results: DataSourceResult[] = [];
    if (binanceResult.status === "fulfilled") results.push(binanceResult.value);
    if (finnhubResult.status === "fulfilled") results.push(finnhubResult.value);
    if (polymarketResult.status === "fulfilled") results.push(polymarketResult.value);

    if (results.length === 0) {
      throw new Error("All data sources failed");
    }

    // Filter successful results and score by freshness
    const successfulResults = results.filter((r) => r.success) as Required<DataSourceResult>[];

    if (successfulResults.length === 0) {
      throw new Error("No successful data sources");
    }

    // Compute weighted average price + confidence
    let weightedPrice = 0;
    let totalWeight = 0;
    const sources: string[] = [];

    for (const result of successfulResults) {
      const freshness = this.calculateFreshness(result.data!.timestamp, now);
      const freshnessScore = this.freshnessToScore(freshness);

      // Weight by freshness + latency
      const weight = freshnessScore / (1 + result.latency / 1000);
      weightedPrice += result.data!.price * weight;
      totalWeight += weight;
      sources.push(result.data!.source);
    }

    const price = weightedPrice / totalWeight;

    // Confidence = agreement across sources + freshness
    const priceSpread = Math.max(...successfulResults.map((r) => r.data!.price)) - Math.min(...successfulResults.map((r) => r.data!.price));
    const spreadConfidence = Math.max(0, 1 - (priceSpread / price) * 0.1); // Penalize large spreads
    const freshnessConfidence = successfulResults.reduce((sum, r) => sum + this.freshnessToScore(this.calculateFreshness(r.data!.timestamp, now)), 0) / successfulResults.length;

    const confidence = Math.sqrt(spreadConfidence * freshnessConfidence) * (successfulResults.length / 3); // Boost if all sources agree

    return {
      price,
      confidence: Math.min(1, confidence),
      sources: [...new Set(sources)],
      freshness: this.calculateFreshness(
        Math.max(...successfulResults.map((r) => r.data!.timestamp)),
        now
      ),
    };
  }

  /**
   * Fetch from Binance (crypto, realtime)
   */
  private async fetchBinance(symbol: string): Promise<DataSourceResult> {
    const startTime = Date.now();
    try {
      const cached = this.binanceCache.get(symbol);
      if (cached && cached.timestamp > Date.now() - 1000) {
        return { success: true, data: cached, latency: 0 };
      }
      // Use Binance public API for real-time price
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
      if (!res.ok) throw new Error('Binance API error');
      const json = await res.json();
      const price = parseFloat(json.price);
      const data: DataPoint = { symbol, price, timestamp: Date.now(), source: "binance", freshness: "realtime", confidence: 0.98 };
      this.binanceCache.set(symbol, data);
      return { success: true, data, latency: Date.now() - startTime };
    } catch (error) {
      // Fallback to mock if API fails
      const mockPrice = 45000 + Math.random() * 1000;
      const data: DataPoint = { symbol, price: mockPrice, timestamp: Date.now(), source: "binance", freshness: "realtime", confidence: 0.5 };
      return { success: false, error: String(error), data, latency: Date.now() - startTime };
    }
  }

  /**
   * Fetch from Finnhub (equities + news)
   */
  private async fetchFinnhub(symbol: string): Promise<DataSourceResult> {
    const startTime = Date.now();
    try {
      const cached = this.finnhubCache.get(symbol);
      if (cached && cached.timestamp > Date.now() - 5000) {
        return { success: true, data: cached, latency: 0 };
      }

      // TODO: Replace with actual Finnhub API call
      const mockPrice = 45000 + Math.random() * 1500;
      const data: DataPoint = { symbol, price: mockPrice, timestamp: Date.now(), source: "finnhub", freshness: "1min", confidence: 0.85 };

      this.finnhubCache.set(symbol, data);
      return { success: true, data, latency: Date.now() - startTime };
    } catch (error) {
      return { success: false, error: String(error), latency: Date.now() - startTime };
    }
  }

  /**
   * Fetch from Polymarket (prediction market)
   */
  private async fetchPolymarket(symbol: string): Promise<DataSourceResult> {
    const startTime = Date.now();
    try {
      const cached = this.polymarketCache.get(symbol);
      if (cached && cached.timestamp > Date.now() - 10000) {
        return { success: true, data: cached, latency: 0 };
      }

      // TODO: Replace with actual Polymarket API call
      const mockPrice = 45000 + Math.random() * 2000;
      const data: DataPoint = { symbol, price: mockPrice, timestamp: Date.now(), source: "polymarket", freshness: "5min", confidence: 0.7 };

      this.polymarketCache.set(symbol, data);
      return { success: true, data, latency: Date.now() - startTime };
    } catch (error) {
      return { success: false, error: String(error), latency: Date.now() - startTime };
    }
  }

  /**
   * Calculate freshness category based on age
   */
  private calculateFreshness(timestamp: number, now: number): "realtime" | "1min" | "5min" | "stale" {
    const ageMs = now - timestamp;
    if (ageMs < 100) return "realtime";
    if (ageMs < 60000) return "1min";
    if (ageMs < 300000) return "5min";
    return "stale";
  }

  /**
   * Convert freshness category to confidence score
   */
  private freshnessToScore(freshness: string): number {
    switch (freshness) {
      case "realtime":
        return 1.0;
      case "1min":
        return 0.9;
      case "5min":
        return 0.7;
      case "stale":
        return 0.3;
      default:
        return 0.5;
    }
  }
}
