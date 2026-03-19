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
  providerStatus?: {
    huggingface: boolean;
    openai: boolean;
    lastChecked?: number | null;
    error?: string;
  };
  fallbackMode?: boolean;
  errorDetail?: string;
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
  userId: string;
  firstName: string;
  experienceLevel: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingStyle: 'scalp' | 'swing' | 'position';
  portfolioValue: number;
  preferredAssets: string[];
  goal: string;
  persona: string;
  onboardingCompletedAt: number;
  avatarUrl?: string;
  signalAccuracy?: {
    overall: number;
    byAsset: Record<string, number>;
  };
  tradeHistory?: Array<{ asset: string; signal: string; result: string; confidence: number }>;
  winRate?: number;
  averageConfidence?: number;
  consent?: { allowLlmTraining: boolean; allowPersonalization: boolean };
  // ...future fields
}

export interface ChatContext {
  sessionId?: string;
  userProfile?: UserProfile;
  recentMessages?: ChatMessage[];
  marketSnapshot?: MarketSnapshot[];
}

interface SessionRecord {
  sessionId: string;
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

  private resolveUrl(path: string): string {
    if (this.baseUrl) {
      return new URL(path, this.baseUrl).toString();
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return new URL(path, origin).toString();
  }
  /**
   * Send chat message to AI with retry logic
   */
  async chat(messages: ChatMessage[], context?: ChatContext & { mode?: string }): Promise<ChatResponse> {
    const mergedContext: ChatContext = { ...(context || {}) };
    const storedProfile = userProfileStorage.load();
    if (!mergedContext.userProfile && storedProfile) {
      mergedContext.userProfile = storedProfile;
    }

    const sessionId = await this.ensureSession(mergedContext.userProfile?.userId);
    if (sessionId) {
      mergedContext.sessionId = sessionId;
      if (mergedContext.userProfile) {
        await this.syncProfile(sessionId, mergedContext.userProfile);
      }
    }

    // Forward mode if present
    const mode = (context && 'mode' in context) ? (context as any).mode : undefined;

    return this.fetchWithRetry<ChatResponse>(
      this.resolveUrl('/api/ai/chat'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context: mergedContext, ...(mode ? { mode } : {}) }),
      }
    );
  }
  /**
   * Fetch live crypto data
   */
  async getCryptoData(symbol: string, source?: 'coingecko' | 'binance'): Promise<CryptoData> {
    const url = new URL(this.resolveUrl('/api/data/crypto'));
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
      const response = await fetch(this.resolveUrl('/api/ai/health'));
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

  private async ensureSession(userId?: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const existing = window.localStorage.getItem('tradehax_session_id');
    if (existing) return existing;

    try {
      const session = await this.fetchWithRetry<SessionRecord>(
        this.resolveUrl('/api/sessions?action=create'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );

      if (session?.sessionId) {
        window.localStorage.setItem('tradehax_session_id', session.sessionId);
        return session.sessionId;
      }
    } catch (error) {
      console.warn('Session bootstrap failed:', error);
    }

    return null;
  }

  private async syncProfile(sessionId: string, profile: UserProfile): Promise<void> {
    try {
      await this.fetchWithRetry(
        this.resolveUrl(`/api/sessions?action=profile&sessionId=${encodeURIComponent(sessionId)}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        }
      );
    } catch (error) {
      console.warn('Profile sync failed:', error);
    }
  }
  /**
   * Parse AI response into structured format
   */
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

    // Extract sections
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

    // Extract bullets
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
  /**
   * Save profile to both localStorage and backend (PUT). Always await remote, fallback to local.
   */
  async save(profile: UserProfile): Promise<void> {
    try {
      localStorage.setItem('tradehax_user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save user profile locally:', error);
    }
    try {
      await userProfileStorage.saveRemote(profile);
    } catch (error) {
      // Network errors are non-fatal for local persistence
      console.warn('Remote profile save failed:', error);
    }
  },

  /**
   * Load profile from backend if possible, fallback to localStorage.
   */
   async load(): Promise<UserProfile | null> {
     let profile = null;
     try {
       profile = await userProfileStorage.loadRemote();
       if (profile) {
         profile = userProfileStorage.migrateProfile(profile);
         return profile;
       }
     } catch (error) {
       // Ignore, fallback to local
     }
     try {
       const stored = localStorage.getItem('tradehax_user_profile');
       profile = stored ? JSON.parse(stored) : null;
       if (profile) {
         profile = userProfileStorage.migrateProfile(profile);
         return profile;
       }
       return null;
     } catch (error) {
       console.error('Failed to load user profile locally:', error);
       return null;
     }
   },
  /**
   * Migrate legacy/incomplete profiles to the unified schema.
   */
  migrateProfile(profile: any): UserProfile {
    if (!profile) return null;
    // Fill missing fields with defaults
    return {
      userId: profile.userId || `guest-${(profile.firstName || 'trader').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      firstName: profile.firstName || 'Trader',
      experienceLevel: profile.experienceLevel || 'intermediate',
      riskTolerance: profile.riskTolerance || 'moderate',
      tradingStyle: profile.tradingStyle || 'swing',
      portfolioValue: typeof profile.portfolioValue === 'number' ? profile.portfolioValue : 25000,
      preferredAssets: Array.isArray(profile.preferredAssets) ? profile.preferredAssets : ['BTC', 'ETH', 'SOL'],
      goal: profile.goal || 'Generate structured trading plans with disciplined risk',
      persona: profile.persona || 'Execution Coach',
      onboardingCompletedAt: profile.onboardingCompletedAt || Date.now(),
      avatarUrl: profile.avatarUrl,
      signalAccuracy: profile.signalAccuracy,
      tradeHistory: profile.tradeHistory,
      winRate: profile.winRate,
      averageConfidence: profile.averageConfidence,
      consent: profile.consent,
    };
  },

  /**
   * Legacy sync save (local only, not recommended)
   */
  saveSync(profile: UserProfile): void {
    try {
      localStorage.setItem('tradehax_user_profile', JSON.stringify(profile));
      // Async sync to backend (fire and forget)
      userProfileStorage.saveRemote(profile).catch(() => {});
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  },

  /**
   * Legacy sync load (local only, not recommended)
   */
  loadSync(): UserProfile | null {
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

  async saveRemote(profile: UserProfile): Promise<void> {
    try {
      await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (error) {
      // Network errors are non-fatal for local persistence
      console.warn('Remote profile save failed:', error);
    }
  },

  async loadRemote(): Promise<UserProfile | null> {
    try {
      const res = await fetch('/api/account/profile');
      if (!res.ok) return null;
      const profile = await res.json();
      if (profile) {
        localStorage.setItem('tradehax_user_profile', JSON.stringify(profile));
      }
      return profile;
    } catch (error) {
      return null;
    }
  },
};
