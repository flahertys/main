// play-picker-backend.ts
// Backend logic to fetch, filter, and score prediction markets for TradeHaxAI

import fetch from 'node-fetch';

export async function fetchKalshiMarkets() {
  // Example Kalshi API endpoint
  const res = await fetch('https://www.kalshi.com/api/markets');
  const data = await res.json();
  // Filter and score markets
  return data.markets.map(m => ({
    market: m.title,
    odds: m.odds,
    action: m.action,
    description: m.description,
    symbol: m.symbol,
    confidence: m.confidence,
  }));
}

export async function fetchPolymarketMarkets() {
  // Example Polymarket API endpoint
  const res = await fetch('https://www.polymarket.com/api/markets');
  const data = await res.json();
  // Filter and score markets
  return data.markets.map(m => ({
    market: m.title,
    odds: m.odds,
    action: m.action,
    description: m.description,
    symbol: m.symbol,
    confidence: m.confidence,
  }));
}

export async function getPlayPickerMarkets() {
  const kalshi = await fetchKalshiMarkets();
  const polymarket = await fetchPolymarketMarkets();
  // Combine, filter, and sort by confidence/edge
  const all = [...kalshi, ...polymarket].sort((a, b) => b.confidence - a.confidence);
  return all.slice(0, 10); // Top 10 actionable plays
}

