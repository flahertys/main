export type MarketItem = {
  symbol: string;
  pair: string;
  price: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  source: string;
  updatedAt: string;
};

export const DEFAULT_MARKET_SYMBOLS = ["SOLUSDT", "BTCUSDT", "ETHUSDT"];
export const BINANCE_MARKET_SOURCE = "Binance 24h ticker";

export function parseMarketSymbols(input: string | null) {
  if (!input || !input.trim()) {
    return DEFAULT_MARKET_SYMBOLS;
  }

  const parsed = input
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^[A-Z0-9]{3,16}$/.test(item))
    .slice(0, 8);

  return parsed.length > 0 ? parsed : DEFAULT_MARKET_SYMBOLS;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 3200): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function fetchBinanceQuotes(symbols: string[]) {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(
    JSON.stringify(symbols),
  )}`;
  const response = await withTimeout(fetch(url, { cache: "no-store" }));
  if (!response.ok) {
    throw new Error(`binance_http_${response.status}`);
  }
  return response.json() as Promise<Array<Record<string, unknown>>>;
}

function toMarketItem(row: Record<string, unknown>): MarketItem | null {
  const pair = String(row.symbol || "").toUpperCase();
  if (!pair) return null;

  const price = Number.parseFloat(String(row.lastPrice ?? "NaN"));
  const changePercent = Number.parseFloat(String(row.priceChangePercent ?? "NaN"));
  if (!Number.isFinite(price) || !Number.isFinite(changePercent)) {
    return null;
  }

  const symbol = pair.endsWith("USDT") ? pair.slice(0, -4) : pair;
  const trend: "up" | "down" | "flat" =
    changePercent > 0.0001 ? "up" : changePercent < -0.0001 ? "down" : "flat";

  return {
    symbol,
    pair,
    price,
    changePercent,
    trend,
    source: BINANCE_MARKET_SOURCE,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLiveMarketItems(symbols: string[]) {
  const payload = await fetchBinanceQuotes(symbols);
  return payload.map(toMarketItem).filter((item): item is MarketItem => Boolean(item));
}
