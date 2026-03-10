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
  signalAccuracy?: {
    overall: number;
    byAsset: Record<string, number>;
  };
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
  async chat(messages: ChatMessage[], context?: any): Promise<ChatResponse> {
    return this.fetchWithRetry<ChatResponse>(
      `${this.baseUrl}/api/ai/chat`,
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
      const response = await fetch(`${this.baseUrl}/__health`);
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
        await this.sleep(this.retryDelay * (attempt + 1)); // Exponential backoff
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }

      // All retries failed
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(response: string): {
    signal?: string;
    priceTarget?: string;
    reasoning?: string[];
    riskManagement?: string[];
    confidence?: string;
  } {
    const lines = response.split('\n').filter(l => l.trim());
    const result: any = {};

    // Extract sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('**Signal**:')) {
        result.signal = line.replace('**Signal**:', '').trim();
      } else if (line.startsWith('**Price Target**:')) {
        result.priceTarget = line.replace('**Price Target**:', '').trim();
      } else if (line.startsWith('**Confidence**:')) {
        result.confidence = line.replace('**Confidence**:', '').trim();
      }
    }

    // Extract bullets
    result.reasoning = lines
      .filter(l => l.trim().startsWith('•') && !l.includes('Stop-loss') && !l.includes('Position'))
      .map(l => l.replace(/^[•-]\s*/, '').trim());

    result.riskManagement = lines
      .filter(l => l.includes('Stop-loss') || l.includes('Position') || l.includes('Max drawdown'))
      .map(l => l.replace(/^[•-]\s*/, '').trim());

    return result;
  }

  /**
   * Format crypto price for display
   */
  formatPrice(price: number): string {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(8)}`;
    }
  }

  /**
   * Format percentage change with color indicator
   */
  formatPercentChange(percent: number): { text: string; color: string } {
    const sign = percent >= 0 ? '+' : '';
    const color = percent >= 0 ? '#00E5A0' : '#FF4757';
    return {
      text: `${sign}${percent.toFixed(2)}%`,
      color,
    };
  }
}

// Export singleton instance
export const apiClient = new TradeHaxAPI();

// Export helper for localStorage-based user profiles
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

