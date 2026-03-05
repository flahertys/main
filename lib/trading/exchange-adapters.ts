/**
 * Exchange Adapters
 *
 * Adapter pattern for connecting to multiple exchanges.
 * Each adapter implements a common interface so the portfolio aggregator
 * can treat all exchanges uniformly.
 *
 * NOTE: Actual API calls are pluggable — replace the simulated data
 * with real exchange SDK calls in production.
 */

import type { PortfolioAsset, SupportedExchange } from "@/types/trading";

export interface ExchangeAdapter {
  exchange: SupportedExchange;
  fetchHoldings(apiKey: string, apiSecret?: string): Promise<PortfolioAsset[]>;
  testConnection(apiKey: string, apiSecret?: string): Promise<boolean>;
}

// ─── Simulated price feed ─────────────────────────────────────────────────────

const SIMULATED_PRICES: Record<string, number> = {
  BTC: 65_000,
  ETH: 3_200,
  SOL: 145,
  BNB: 580,
  USDC: 1.0,
  USDT: 1.0,
  ADA: 0.45,
  DOT: 7.2,
};

function simulatedPrice(symbol: string): number {
  return SIMULATED_PRICES[symbol] ?? 1;
}

// ─── Binance adapter ──────────────────────────────────────────────────────────

export const binanceAdapter: ExchangeAdapter = {
  exchange: "binance",

  async fetchHoldings(_apiKey: string, _apiSecret?: string): Promise<PortfolioAsset[]> {
    // Production: call Binance REST API GET /api/v3/account
    const holdings = [
      { symbol: "BTC", quantity: 0.15 },
      { symbol: "ETH", quantity: 2.5 },
      { symbol: "BNB", quantity: 10 },
    ];
    return holdings.map((h) => ({
      symbol: h.symbol,
      name: h.symbol,
      exchange: "binance" as SupportedExchange,
      quantity: h.quantity,
      avgCostBasis: simulatedPrice(h.symbol) * 0.9,
      currentPrice: simulatedPrice(h.symbol),
      valueUsd: h.quantity * simulatedPrice(h.symbol),
      change24hPct: (Math.random() - 0.5) * 10,
      allocationPct: 0, // calculated by aggregator
    }));
  },

  async testConnection(_apiKey: string, _apiSecret?: string): Promise<boolean> {
    return true;
  },
};

// ─── Coinbase adapter ─────────────────────────────────────────────────────────

export const coinbaseAdapter: ExchangeAdapter = {
  exchange: "coinbase",

  async fetchHoldings(_apiKey: string, _apiSecret?: string): Promise<PortfolioAsset[]> {
    // Production: call Coinbase Advanced Trade API GET /api/v3/brokerage/accounts
    const holdings = [
      { symbol: "BTC", quantity: 0.05 },
      { symbol: "SOL", quantity: 50 },
      { symbol: "USDC", quantity: 1000 },
    ];
    return holdings.map((h) => ({
      symbol: h.symbol,
      name: h.symbol,
      exchange: "coinbase" as SupportedExchange,
      quantity: h.quantity,
      avgCostBasis: simulatedPrice(h.symbol) * 0.95,
      currentPrice: simulatedPrice(h.symbol),
      valueUsd: h.quantity * simulatedPrice(h.symbol),
      change24hPct: (Math.random() - 0.5) * 8,
      allocationPct: 0,
    }));
  },

  async testConnection(_apiKey: string, _apiSecret?: string): Promise<boolean> {
    return true;
  },
};

// ─── Kraken adapter ───────────────────────────────────────────────────────────

export const krakenAdapter: ExchangeAdapter = {
  exchange: "kraken",

  async fetchHoldings(_apiKey: string, _apiSecret?: string): Promise<PortfolioAsset[]> {
    // Production: call Kraken REST API POST /0/private/Balance
    const holdings = [
      { symbol: "ETH", quantity: 1.2 },
      { symbol: "DOT", quantity: 200 },
    ];
    return holdings.map((h) => ({
      symbol: h.symbol,
      name: h.symbol,
      exchange: "kraken" as SupportedExchange,
      quantity: h.quantity,
      avgCostBasis: simulatedPrice(h.symbol) * 0.92,
      currentPrice: simulatedPrice(h.symbol),
      valueUsd: h.quantity * simulatedPrice(h.symbol),
      change24hPct: (Math.random() - 0.5) * 12,
      allocationPct: 0,
    }));
  },

  async testConnection(_apiKey: string, _apiSecret?: string): Promise<boolean> {
    return true;
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const EXCHANGE_ADAPTERS: Record<SupportedExchange, ExchangeAdapter | null> = {
  binance: binanceAdapter,
  coinbase: coinbaseAdapter,
  kraken: krakenAdapter,
  manual: null,
};

export function getAdapter(exchange: SupportedExchange): ExchangeAdapter | null {
  return EXCHANGE_ADAPTERS[exchange] ?? null;
}
