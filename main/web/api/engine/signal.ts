import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TradeHaxEngine } from '../../src/engine/index.js';
import fs from 'node:fs/promises';
import path from 'node:path';

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const SYMBOL_TO_COINGECKO: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  XRP: 'ripple',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
};

const ENGINE_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

async function fetchBinanceCandles(symbol: string, interval = '1h', limit = 220): Promise<Candle[]> {
  const pair = `${symbol.toUpperCase()}USDT`;
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,
    { headers: { Accept: 'application/json', 'User-Agent': 'TradeHax/1.0' } }
  );

  if (!response.ok) {
    throw new Error(`Binance candles failed: HTTP ${response.status}`);
  }

  const rows = await response.json();
  return rows.map((r: any[]) => ({
    timestamp: Number(r[0]),
    open: Number(r[1]),
    high: Number(r[2]),
    low: Number(r[3]),
    close: Number(r[4]),
    volume: Number(r[5]),
  }));
}

async function fetchCoinGeckoCandles(symbol: string, days = 7): Promise<Candle[]> {
  const id = SYMBOL_TO_COINGECKO[symbol.toUpperCase()];
  if (!id) throw new Error(`No CoinGecko mapping for ${symbol}`);

  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=hourly`,
    { headers: { Accept: 'application/json', 'User-Agent': 'TradeHax/1.0' } }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko candles failed: HTTP ${response.status}`);
  }

  const json = await response.json();
  const prices: [number, number][] = json?.prices || [];
  const volumes: [number, number][] = json?.total_volumes || [];

  if (prices.length < 40) {
    throw new Error('CoinGecko returned insufficient points');
  }

  const candles: Candle[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1];
    const cur = prices[i];
    const ts = Number(cur[0]);
    const open = Number(prev[1]);
    const close = Number(cur[1]);
    const high = Math.max(open, close) * 1.0015;
    const low = Math.min(open, close) * 0.9985;
    const volume = Number(volumes[i]?.[1] ?? volumes[i - 1]?.[1] ?? 0);
    candles.push({ timestamp: ts, open, high, low, close, volume });
  }

  return candles;
}

async function loadSampleCandles(): Promise<Candle[]> {
  const p = path.join(process.cwd(), 'scripts', 'sample-ohlc.json');
  const raw = await fs.readFile(p, 'utf8');
  const rows = JSON.parse(raw);
  return rows.map((r: any) => ({
    timestamp: Number(r.timestamp),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }));
}

function detectMacroRegime(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  const n = closes.length;
  const short = closes.slice(Math.max(0, n - 24));
  const long = closes.slice(Math.max(0, n - 120));

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / Math.max(1, arr.length);
  const shortAvg = avg(short);
  const longAvg = avg(long);

  const biasRaw = longAvg > 0 ? (shortAvg - longAvg) / longAvg : 0;
  const bias = Math.max(-0.5, Math.min(0.5, biasRaw * 5));

  const returns = [] as number[];
  for (let i = 1; i < short.length; i += 1) {
    returns.push((short[i] - short[i - 1]) / short[i - 1]);
  }
  const vol = Math.sqrt(returns.reduce((s, v) => s + v * v, 0) / Math.max(1, returns.length));

  const liquidityRegime = vol > 0.02 ? 'tight' : vol < 0.008 ? 'loose' : 'neutral';
  return { bias, liquidityRegime, realizedVolatility: vol };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const symbol = String(req.query.symbol || 'BTC').toUpperCase();
    const interval = String(req.query.interval || '1h');
    const riskTolerance = String(req.query.riskTolerance || 'moderate') as 'conservative' | 'moderate' | 'aggressive';
    const equity = Number(req.query.equity || 25000);

    const cacheKey = `${symbol}:${interval}:${riskTolerance}:${equity}`;
    const cached = ENGINE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json({ ...cached.data, cached: true });
    }

    let candles: Candle[] = [];
    let source = 'binance';

    try {
      candles = await fetchBinanceCandles(symbol, interval, 220);
    } catch {
      try {
        source = 'coingecko';
        candles = await fetchCoinGeckoCandles(symbol, 10);
      } catch {
        source = 'sample-fallback';
        candles = await loadSampleCandles();
      }
    }

    if (candles.length < 40) {
      return res.status(422).json({ error: 'Not enough candle data for engine evaluation' });
    }

    const macro = detectMacroRegime(candles);
    const engine = new TradeHaxEngine({ riskTolerance, equity, macro });

    const snapshot = engine.evaluate(candles);
    const backtest = engine.backtest(candles, { warmup: 40 });

    const payload = {
      symbol,
      interval,
      source,
      liveData: source !== 'sample-fallback',
      macro,
      snapshot,
      backtest: {
        startEquity: backtest.startEquity,
        endEquity: Number(backtest.endEquity.toFixed(2)),
        totalReturnPct: Number((backtest.totalReturn * 100).toFixed(2)),
        winRatePct: Number((backtest.winRate * 100).toFixed(2)),
        trades: backtest.trades,
        wins: backtest.wins,
        losses: backtest.losses,
        maxDrawdownPct: Number((backtest.maxDrawdown * 100).toFixed(2)),
      },
      dataWindow: {
        candles: candles.length,
        fromTs: candles[0].timestamp,
        toTs: candles[candles.length - 1].timestamp,
      },
      timestamp: Date.now(),
    };

    ENGINE_CACHE.set(cacheKey, { data: payload, timestamp: Date.now() });
    if (ENGINE_CACHE.size > 200) {
      const keys = Array.from(ENGINE_CACHE.keys()).slice(0, 100);
      keys.forEach((k) => ENGINE_CACHE.delete(k));
    }

    return res.status(200).json(payload);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Engine signal failed',
      message: error?.message || 'unknown',
      timestamp: Date.now(),
    });
  }
}
