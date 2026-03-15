/**
 * TradeHax - Live Cryptocurrency Data Endpoint
 * CoinGecko (Free, No Key) + Optional Binance Integration
 *
 * Features:
 * - Free CoinGecko API (10-50 calls/min, no key required)
 * - 5-minute caching to respect rate limits
 * - Supports major cryptocurrencies
 * - Returns comprehensive market data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, ensureMethod, handleOptions } from '../_shared/http.js';

// In-memory cache
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

interface CryptoDataResponse {
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
  source: 'coingecko' | 'binance' | 'cached';
}

/**
 * Symbol to CoinGecko ID mapping
 */
const SYMBOL_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'AAVE': 'aave',
};

/**
 * Fetch data from CoinGecko (Free API)
 */
async function fetchCoinGeckoData(symbol: string): Promise<CryptoDataResponse | null> {
  try {
    const coinId = SYMBOL_MAP[symbol.toUpperCase()] || symbol.toLowerCase();

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TradeHax/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const marketData = data.market_data;

    if (!marketData) {
      throw new Error('No market data available');
    }

    return {
      symbol: symbol.toUpperCase(),
      price: marketData.current_price?.usd || 0,
      priceChange24h: marketData.price_change_24h || 0,
      priceChangePercent24h: marketData.price_change_percentage_24h || 0,
      volume24h: marketData.total_volume?.usd || 0,
      marketCap: marketData.market_cap?.usd || 0,
      high24h: marketData.high_24h?.usd || 0,
      low24h: marketData.low_24h?.usd || 0,
      circulatingSupply: marketData.circulating_supply || undefined,
      totalSupply: marketData.total_supply || undefined,
      rank: data.market_cap_rank || undefined,
      timestamp: Date.now(),
      source: 'coingecko',
    };
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return null;
  }
}

/**
 * Fetch data from Binance (Fallback - requires key for higher limits)
 */
async function fetchBinanceData(symbol: string): Promise<CryptoDataResponse | null> {
  try {
    const tradingPair = `${symbol.toUpperCase()}USDT`;

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${tradingPair}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TradeHax/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(data.lastPrice),
      priceChange24h: parseFloat(data.priceChange),
      priceChangePercent24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.quoteVolume),
      marketCap: 0, // Binance doesn't provide market cap
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      timestamp: Date.now(),
      source: 'binance',
    };
  } catch (error) {
    console.error('Binance fetch error:', error);
    return null;
  }
}

/**
 * Main serverless function handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, { methods: 'GET,OPTIONS' });
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (handleOptions(req, res)) {
    return;
  }

  if (!ensureMethod(req, res, 'GET')) {
    return;
  }

  try {
    const { symbol, source } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Symbol parameter is required (e.g., ?symbol=BTC)'
      });
    }

    const symbolUpper = symbol.toUpperCase();

    // Check cache
    const cacheKey = symbolUpper;
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ Cache hit for ${symbolUpper}`);
      return res.status(200).json({ ...cached.data, cached: true });
    }

    // Fetch fresh data
    let data: CryptoDataResponse | null = null;

    // Try CoinGecko first (free, comprehensive data)
    if (!source || source === 'coingecko') {
      console.log(`🔍 Fetching ${symbolUpper} from CoinGecko...`);
      data = await fetchCoinGeckoData(symbol);
    }

    // Fallback to Binance if CoinGecko fails
    if (!data && source !== 'coingecko') {
      console.log(`🔄 Falling back to Binance for ${symbolUpper}...`);
      data = await fetchBinanceData(symbol);
    }

    if (!data) {
      return res.status(404).json({
        error: 'Symbol not found',
        message: `Could not fetch data for ${symbolUpper}. Supported symbols: ${Object.keys(SYMBOL_MAP).join(', ')}`
      });
    }

    // Cache the response
    dataCache.set(cacheKey, { data, timestamp: Date.now() });
    console.log(`✅ Cached ${symbolUpper} data`);

    // Cleanup old cache entries (keep last 50 symbols)
    if (dataCache.size > 50) {
      const oldKeys = Array.from(dataCache.keys()).slice(0, 25);
      oldKeys.forEach(k => dataCache.delete(k));
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('❌ Crypto data error:', error);
    return res.status(500).json({
      error: 'Failed to fetch cryptocurrency data',
      message: error.message,
      timestamp: Date.now(),
    });
  }
}
