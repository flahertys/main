// Data fetchers for stock, crypto, and prediction markets
import { STOCK_PROVIDERS, PREDICTION_MARKET_PROVIDERS, CRYPTO_PROVIDERS } from '../lib/trading/neural-hub-pipeline';

export async function fetchStockData(symbol: string, provider: 'polygon-io' | 'finnhub' | 'alpha_vantage' = 'polygon-io'): Promise<any> {
  const config = STOCK_PROVIDERS[provider];
  if (!config.apiKey) {
    console.warn(`⚠️ No API key configured for ${provider}`);
    return null;
  }
  try {
    const response = await fetch(`${config.endpoint}/quote/${symbol}?apiKey=${config.apiKey}`, { headers: config.headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Failed to fetch stock data for ${symbol}:`, error);
    return null;
  }
}

export async function fetchPolymarketData(marketId?: string): Promise<any> {
  try {
    const endpoint = marketId
      ? `${PREDICTION_MARKET_PROVIDERS.polymarket.endpoint}/markets/${marketId}`
      : `${PREDICTION_MARKET_PROVIDERS.polymarket.endpoint}/markets`;
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to fetch Polymarket data:', error);
    return null;
  }
}

export async function fetchCryptoData(ids: string[] = ['solana', 'ethereum', 'bitcoin']): Promise<any> {
  try {
    const idStr = ids.join(',');
    const response = await fetch(
      `${CRYPTO_PROVIDERS.coingecko.endpoint}/simple/price?ids=${idStr}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to fetch crypto data:', error);
    return null;
  }
}

