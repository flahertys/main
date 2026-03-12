import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, ensureMethod, handleOptions } from "../_shared/http.js";
import { detectUnusualOpportunities } from "./scan-core.js";

const cache = new Map<string, { timestamp: number; payload: any }>();
const CACHE_TTL_MS = 20_000;

const SYMBOL_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ADA: "cardano",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  XRP: "ripple",
  MATIC: "matic-network",
};

function getSymbols(req: VercelRequest): string[] {
  const raw = typeof req.query.symbols === "string" ? req.query.symbols : "BTC,ETH,SOL,DOGE,ADA,LINK";
  const symbols = raw
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => SYMBOL_MAP[symbol]);

  return Array.from(new Set(symbols)).slice(0, 12);
}

function parseNumberParam(value: unknown, fallback: number) {
  if (typeof value !== "string") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function fetchMarketData(symbols: string[]) {
  const ids = symbols.map((symbol) => SYMBOL_MAP[symbol]).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TradeHax-Unusual-Scanner/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko markets error: ${response.status}`);
  }

  const data = await response.json();
  const byId = new Map(data.map((item: any) => [item.id, item]));

  return symbols
    .map((symbol) => {
      const id = SYMBOL_MAP[symbol];
      const item = byId.get(id);
      if (!item) return null;

      return {
        symbol,
        price: item.current_price || 0,
        high24h: item.high_24h || 0,
        low24h: item.low_24h || 0,
        volume24h: item.total_volume || 0,
        marketCap: item.market_cap || 0,
        priceChangePercent24h: item.price_change_percentage_24h || 0,
      };
    })
    .filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, { methods: "GET,OPTIONS" });

  if (handleOptions(req, res)) return;
  if (!ensureMethod(req, res, "GET")) return;

  try {
    const symbols = getSymbols(req);
    const minScore = parseNumberParam(req.query.minScore, 45);
    const limit = parseNumberParam(req.query.limit, 20);
    const cacheKey = `${symbols.join(",")}|${minScore}|${limit}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json({ ...cached.payload, cached: true });
    }

    const marketData = await fetchMarketData(symbols);
    const result = detectUnusualOpportunities(marketData, {
      thresholds: { minScore },
      limit,
    });

    const payload = {
      ok: true,
      scanner: "unusual-crypto-v2",
      symbols,
      ...result,
      cached: false,
    };

    cache.set(cacheKey, { timestamp: Date.now(), payload });

    return res.status(200).json(payload);
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "scanner_failed",
      message: error?.message || "Unknown scanner error",
      timestamp: Date.now(),
    });
  }
}

