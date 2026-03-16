// Trading models and DTOs
export interface LiveDataProvider {
  name: string;
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
  symbols?: string[];
}

export interface TradingSignal {
  symbol: string;
  marketType: 'stock' | 'crypto' | 'prediction';
  timestamp: string;
  liveData: any;
  signal?: any;
  rawResponse?: string;
  status: 'success' | 'partial' | 'error';
  error?: string;
}

