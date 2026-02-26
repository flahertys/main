type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";

type FreshnessContext = {
  enabled: boolean;
  generatedAt: string;
  summary: string;
  sources: string[];
};

type CacheRecord = {
  expiresAt: number;
  value: FreshnessContext;
};

const CACHE_TTL_MS = 45_000;

const STOCK_KEYWORDS = [
  "stock",
  "stocks",
  "equity",
  "ticker",
  "spy",
  "qqq",
  "nasdaq",
  "nyse",
  "earnings",
  "investing",
  "portfolio",
  "advisor",
  "trade",
  "trading",
];

const CRYPTO_KEYWORDS = [
  "crypto",
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "altcoin",
  "defi",
  "onchain",
  "token",
  "trading",
];

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_MARKET_CONTEXT_CACHE__?: Map<string, CacheRecord>;
  };

  if (!globalRef.__TRADEHAX_MARKET_CONTEXT_CACHE__) {
    globalRef.__TRADEHAX_MARKET_CONTEXT_CACHE__ = new Map();
  }

  return globalRef.__TRADEHAX_MARKET_CONTEXT_CACHE__;
}

function isMarketIntent(inputMessage: string, context?: unknown, domain?: PredictionDomain) {
  if (domain === "stock" || domain === "crypto" || domain === "kalshi") return true;

  const text = `${inputMessage} ${typeof context === "string" ? context : JSON.stringify(context ?? {})}`.toLowerCase();
  const keywordHits = [...STOCK_KEYWORDS, ...CRYPTO_KEYWORDS].filter((term) => text.includes(term));
  return keywordHits.length > 0;
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

async function fetchJson(url: string) {
  const response = await withTimeout(fetch(url, { cache: "no-store" }));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<any>;
}

function n2(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "n/a";
}

function pct(value: number) {
  if (!Number.isFinite(value)) return "n/a";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

async function buildCryptoSnapshot() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
  const data = await fetchJson(url);

  if (!Array.isArray(data)) {
    throw new Error("Unexpected crypto payload");
  }

  const normalized = data
    .filter((row) => row && typeof row.symbol === "string")
    .map((row) => {
      const symbol = String(row.symbol || "").replace("USDT", "");
      const lastPrice = Number.parseFloat(String(row.lastPrice ?? "NaN"));
      const changePct = Number.parseFloat(String(row.priceChangePercent ?? "NaN"));
      return `${symbol} ${n2(lastPrice)} (${pct(changePct)})`;
    })
    .slice(0, 3);

  return {
    summary: normalized.length > 0 ? normalized.join(" | ") : "Crypto snapshot unavailable",
    source: "Binance 24h ticker",
  };
}

async function buildStockSnapshot() {
  const symbols = "SPY,QQQ,DIA,NVDA,MSFT";
  const data = await fetchJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`);
  const rows = Array.isArray(data?.quoteResponse?.result) ? data.quoteResponse.result : [];

  const normalized = rows
    .filter((row: any) => row && typeof row.symbol === "string")
    .map((row: any) => {
      const symbol = String(row.symbol);
      const price = Number.parseFloat(String(row.regularMarketPrice ?? "NaN"));
      const changePct = Number.parseFloat(String(row.regularMarketChangePercent ?? "NaN"));
      return `${symbol} ${n2(price)} (${pct(changePct)})`;
    })
    .slice(0, 5);

  return {
    summary: normalized.length > 0 ? normalized.join(" | ") : "Stock snapshot unavailable",
    source: "Yahoo Finance quote endpoint",
  };
}

export async function buildLiveMarketContext(input: {
  inputMessage: string;
  context?: unknown;
  domain?: PredictionDomain;
}): Promise<FreshnessContext> {
  if (!isMarketIntent(input.inputMessage, input.context, input.domain)) {
    return {
      enabled: false,
      generatedAt: new Date().toISOString(),
      summary: "",
      sources: [],
    };
  }

  const cacheKey = input.domain || "auto";
  const store = getStore();
  const cached = store.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const generatedAt = new Date().toISOString();
  const snapshots: string[] = [];
  const sources: string[] = [];

  try {
    if (input.domain === "crypto") {
      const crypto = await buildCryptoSnapshot();
      snapshots.push(`Crypto: ${crypto.summary}`);
      sources.push(crypto.source);
    } else if (input.domain === "stock") {
      const stocks = await buildStockSnapshot();
      snapshots.push(`Stocks: ${stocks.summary}`);
      sources.push(stocks.source);
    } else {
      const [cryptoResult, stockResult] = await Promise.allSettled([
        buildCryptoSnapshot(),
        buildStockSnapshot(),
      ]);

      if (cryptoResult.status === "fulfilled") {
        snapshots.push(`Crypto: ${cryptoResult.value.summary}`);
        sources.push(cryptoResult.value.source);
      }
      if (stockResult.status === "fulfilled") {
        snapshots.push(`Stocks: ${stockResult.value.summary}`);
        sources.push(stockResult.value.source);
      }
    }
  } catch {
    // Fall through to degraded context below.
  }

  const summary =
    snapshots.length > 0
      ? [`Market freshness snapshot @ ${generatedAt} UTC`, ...snapshots].join("\n")
      : `Market freshness snapshot unavailable @ ${generatedAt} UTC. Tell user live quotes are temporarily unavailable and avoid claiming exact current prices.`;

  const value: FreshnessContext = {
    enabled: true,
    generatedAt,
    summary,
    sources,
  };

  store.set(cacheKey, {
    expiresAt: now + CACHE_TTL_MS,
    value,
  });

  return value;
}
