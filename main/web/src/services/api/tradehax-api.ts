/**
 * TradeHax API Client
 * Type-safe frontend wrapper for backend APIs
 *
 * Features:
 * - Automatic retry logic
 * - Error handling with fallbacks
 * - Type-safe responses
 * - Health check utilities
 */

import { API_ENDPOINTS } from '../../lib/endpoints';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  provider: 'huggingface' | 'openai' | 'demo';
  model: string;
  timestamp: number;
  cached?: boolean;
}

export interface MarketSnapshot {
  symbol: string;
  price?: number;
  change24h?: number;
  source?: string;
}

export interface CryptoData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  circulatingSupply?: number;
  totalSupply?: number;
  rank?: number;
  timestamp: number;
  source: string;
  cached?: boolean;
}

export interface UserProfile {
  userId?: string;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  portfolioValue?: number;
  preferredAssets?: string[];
  tradingStyle?: 'scalp' | 'swing' | 'position';
  signalAccuracy?: {
    overall: number;
    byAsset: Record<string, number>;
  };
}

export interface ChatContext {
  sessionId?: string;
  userProfile?: UserProfile;
  recentMessages?: ChatMessage[];
  marketSnapshot?: MarketSnapshot[];
}

export interface UnusualOpportunity {
  symbol: string;
  score: number;
  signalLabel: 'WATCH' | 'ELEVATED' | 'HIGH';
  direction: 'BULLISH_PRESSURE' | 'BEARISH_PRESSURE';
  reliability: number;
  strategyTag: string;
  horizon: string;
  factorsTriggered: number;
  metrics: {
    priceChangePct: number;
    volumeToCapPct: number;
    intradayRangePct: number;
    volume24h: number;
    marketCap: number;
  };
  reasons: string[];
  plan: {
    trigger: string;
    invalidation: string;
    risk: string;
  };
}

export interface UnusualScannerResponse {
  ok: boolean;
  scanner: string;
  symbols: string[];
  timestamp: number;
  regime: {
    label: string;
    medianRangePct: number;
    medianTurnoverPct: number;
  };
  weights: {
    directional: number;
    participation: number;
    volatility: number;
  };
  thresholds: {
    priceMovePct: number;
    volumeToCapPct: number;
    intradayRangePct: number;
    minScore: number;
    minMarketCap: number;
    minVolume24h: number;
  };
  totalScanned: number;
  totalFlagged: number;
  opportunities: UnusualOpportunity[];
  cached?: boolean;
}

export class TradeHaxAPI {
  private baseUrl: string;
  private retryCount: number;
  private retryDelay: number;

  constructor(baseUrl = '', retryCount = 2, retryDelay = 1000) {
    this.baseUrl = baseUrl;
    this.retryCount = retryCount;
    this.retryDelay = retryDelay;
  }

  /**
   * Send chat message to AI with retry logic
   */
  async chat(messages: ChatMessage[], context?: ChatContext): Promise<ChatResponse> {
    return this.fetchWithRetry<ChatResponse>(
      `${this.baseUrl}${API_ENDPOINTS.AI_CHAT}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context }),
      }
    );
  }

  /**
   * Fetch live crypto data
   */
  async getCryptoData(symbol: string, source?: 'coingecko' | 'binance'): Promise<CryptoData> {
    const url = new URL(`${this.baseUrl}/api/data/crypto`);
    url.searchParams.set('symbol', symbol);
    if (source) url.searchParams.set('source', source);

    return this.fetchWithRetry<CryptoData>(url.toString());
  }

  /**
   * Fetch multiple crypto symbols at once
   */
  async getMultipleCrypto(symbols: string[]): Promise<Record<string, CryptoData | null>> {
    const results = await Promise.allSettled(
      symbols.map(symbol => this.getCryptoData(symbol))
    );

    const data: Record<string, CryptoData | null> = {};
    symbols.forEach((symbol, index) => {
      const result = results[index];
      data[symbol] = result.status === 'fulfilled' ? result.value : null;
    });

    return data;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ ok: boolean; timestamp: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AI_HEALTH}`);
      return {
        ok: response.ok,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        ok: false,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Generic fetch with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options?: RequestInit,
    attempt = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}`
        }));
        throw new Error(error.message || error.error || 'Request failed');
      }

      return response.json();
    } catch (error) {
      // Retry logic
      if (attempt < this.retryCount) {
        console.warn(`Retry attempt ${attempt + 1}/${this.retryCount}...`);
        await this.sleep(this.retryDelay * (attempt + 1));
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseAIResponse(response: string): {
    signal?: string;
    priceTarget?: string;
    marketContext?: string;
    executionPlaybook?: string[];
    reasoning?: string[];
    riskManagement?: string[];
    confidence?: string;
  } {
    const lines = response.split('\n').filter(l => l.trim());
    const result: any = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('**Signal**:')) {
        result.signal = line.replace('**Signal**:', '').trim();
      } else if (line.startsWith('**Price Target**:')) {
        result.priceTarget = line.replace('**Price Target**:', '').trim();
      } else if (line.startsWith('**Market Context**:')) {
        result.marketContext = line.replace('**Market Context**:', '').trim();
      } else if (line.startsWith('**Confidence**:')) {
        result.confidence = line.replace('**Confidence**:', '').trim();
      }
    }

    result.reasoning = lines
      .filter(l => l.trim().startsWith('•') && !l.includes('Stop-loss') && !l.includes('Position'))
      .map(l => l.replace(/^[•-]\s*/, '').trim());

    result.riskManagement = lines
      .filter(l => l.includes('Stop-loss') || l.includes('Position') || l.includes('Max drawdown'))
      .map(l => l.replace(/^[•-]\s*/, '').trim());

    result.executionPlaybook = lines
      .filter(l => l.includes('Entry') || l.includes('Trigger') || l.includes('Take-profit') || l.includes('Scale') || l.includes('Invalidation'))
      .map(l => l.replace(/^[•-]\s*/, '').trim());

    return result;
  }

  formatPrice(price: number): string {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    }

    return `$${price.toFixed(8)}`;
  }

  formatPercentChange(percent: number): { text: string; color: string } {
    const sign = percent >= 0 ? '+' : '';
    const color = percent >= 0 ? '#00E5A0' : '#FF4757';
    return {
      text: `${sign}${percent.toFixed(2)}%`,
      color,
    };
  }

  async getUnusualSignals(
    symbols: string[] = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'LINK'],
    options?: { minScore?: number; limit?: number }
  ): Promise<UnusualScannerResponse> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(`${this.baseUrl}/api/signals/unusual`, origin);
    url.searchParams.set('symbols', symbols.join(','));
    if (typeof options?.minScore === 'number') {
      url.searchParams.set('minScore', String(options.minScore));
    }
    if (typeof options?.limit === 'number') {
      url.searchParams.set('limit', String(options.limit));
    }
    return this.fetchWithRetry<UnusualScannerResponse>(url.toString());
  }
}

export const apiClient = new TradeHaxAPI();

export const userProfileStorage = {
  save(profile: UserProfile): void {
    try {
      localStorage.setItem('tradehax_user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  },

  load(): UserProfile | null {
    try {
      const stored = localStorage.getItem('tradehax_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem('tradehax_user_profile');
    } catch (error) {
      console.error('Failed to clear user profile:', error);
    }
  },
};

