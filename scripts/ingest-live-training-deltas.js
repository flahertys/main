#!/usr/bin/env node
/* eslint-disable no-console */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const ROOT = process.cwd();
const EXTERNAL_DATASET_DIR = path.join(ROOT, "data", "external-datasets");
const ARTIFACTS_DIR = path.join(ROOT, ".artifacts");
const STATE_FILE = path.join(ARTIFACTS_DIR, "live-delta-ingest-state.json");

const DEFAULT_SYSTEM_PROMPT =
  "You are TradeHax AI. Use the provided live normalized market snapshot to produce risk-aware trading guidance with explicit uncertainty and invalidation levels.";

function hasArg(flag) {
  return process.argv.includes(flag);
}

function argValue(name, fallback) {
  const index = process.argv.findIndex((arg) => arg === name || arg.startsWith(`${name}=`));
  if (index === -1) return fallback;
  const token = process.argv[index];
  if (token.includes("=")) {
    return token.split("=").slice(1).join("=");
  }
  if (index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function toInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

function toIso(value) {
  const parsed = Date.parse(String(value || ""));
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  return new Date().toISOString();
}

function stableHash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function dateKey(isoTs) {
  return String(isoTs || nowIso()).slice(0, 10);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, input = {}) {
  const timeoutMs = toInt(process.env.TRADEHAX_LIVE_INGEST_TIMEOUT_MS || "8000", 8000, 1500, 20000);
  const retries = toInt(process.env.TRADEHAX_LIVE_INGEST_RETRIES || "2", 2, 0, 4);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: input.method || "GET",
        headers: {
          Accept: "application/json",
          ...(input.headers || {}),
        },
        body: input.body,
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${errorText.slice(0, 180)}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      await sleep(250 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("request_exhausted");
}

function parseSymbolList() {
  const fromArgs = String(argValue("--symbols", "") || "");
  const fromEnv = String(process.env.TRADEHAX_LIVE_SYMBOLS || "BTC,ETH,SOL,SPY,QQQ");
  const raw = fromArgs || fromEnv;
  const normalized = raw
    .split(",")
    .map((value) => normalizeSymbol(value))
    .filter(Boolean);

  const unique = [...new Set(normalized)];
  const maxSymbols = toInt(process.env.TRADEHAX_LIVE_MAX_SYMBOLS || "12", 12, 1, 30);
  return unique.slice(0, maxSymbols);
}

function classifyImpact(text) {
  const content = String(text || "").toLowerCase();
  if (/(cpi|fomc|fed|guidance|earnings|lawsuit|bankruptcy|hack|sec)/.test(content)) return "high";
  if (/(upgrade|downgrade|partnership|launch|outflow|inflow|etf)/.test(content)) return "medium";
  return "low";
}

function classifyCategory(text) {
  const content = String(text || "").toLowerCase();
  if (/(earnings|guidance|eps|revenue)/.test(content)) return "earnings";
  if (/(macro|fed|inflation|rates|cpi|pmi|nfp)/.test(content)) return "macro";
  if (/(crypto|bitcoin|ethereum|solana|on-chain|etf)/.test(content)) return "crypto";
  if (/(sec|regulat|policy|senate|house|bill)/.test(content)) return "policy";
  return "technical";
}

function sideFromChangePct(changePct) {
  if (changePct >= 0) {
    return "long";
  }
  return "short";
}

function confidenceFromChangePct(changePct) {
  const magnitude = Math.abs(changePct);
  return Math.max(0.45, Math.min(0.92, 0.52 + magnitude / 18));
}

async function fetchBinanceCrypto(symbols) {
  const cryptoSymbols = symbols.filter((symbol) => ["BTC", "ETH", "SOL", "AVAX", "XRP", "DOGE"].includes(symbol));
  if (cryptoSymbols.length === 0) return [];

  const pairs = cryptoSymbols.map((symbol) => `${symbol}USDT`);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
  const payload = await requestJson(url);
  if (!Array.isArray(payload)) return [];

  const ts = nowIso();
  return payload
    .map((row, index) => {
      const pair = String(row?.symbol || "").toUpperCase();
      const base = pair.endsWith("USDT") ? pair.slice(0, -4) : pair;
      const lastPrice = Number.parseFloat(String(row?.lastPrice || "0"));
      const changePct = Number.parseFloat(String(row?.priceChangePercent || "0"));
      const quoteVolume = Number.parseFloat(String(row?.quoteVolume || "0"));
      if (!base || !Number.isFinite(lastPrice) || lastPrice <= 0) return null;
      const side = sideFromChangePct(changePct);
      return {
        id: `live_binance_${base}_${dateKey(ts)}_${index}`,
        pair: `${base}/USDT`,
        chain: "ethereum",
        side,
        notionalUsd: Math.max(10000, Math.round(Math.abs(quoteVolume) * 0.002)),
        confidence: Number.parseFloat(confidenceFromChangePct(changePct).toFixed(4)),
        exchange: "binance",
        triggeredAt: ts,
      };
    })
    .filter(Boolean);
}

async function fetchCoinGeckoCrypto(symbols) {
  const mapBySymbol = {
    BTC: "bitcoin",
    ETH: "ethereum",
    SOL: "solana",
    AVAX: "avalanche-2",
    XRP: "ripple",
    DOGE: "dogecoin",
  };

  const selected = symbols.filter((symbol) => mapBySymbol[symbol]);
  if (selected.length === 0) return [];

  const ids = selected.map((symbol) => mapBySymbol[symbol]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    ids,
  )}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
  const payload = await requestJson(url);

  const ts = nowIso();
  return selected
    .map((symbol, index) => {
      const id = mapBySymbol[symbol];
      const row = payload?.[id] || null;
      if (!row) return null;
      const price = Number.parseFloat(String(row.usd || "0"));
      const changePct = Number.parseFloat(String(row.usd_24h_change || "0"));
      const vol = Number.parseFloat(String(row.usd_24h_vol || "0"));
      if (!Number.isFinite(price) || price <= 0) return null;
      return {
        id: `live_coingecko_${symbol}_${dateKey(ts)}_${index}`,
        pair: `${symbol}/USD`,
        chain: "ethereum",
        side: sideFromChangePct(changePct),
        notionalUsd: Math.max(7500, Math.round(Math.abs(vol) * 0.0015)),
        confidence: Number.parseFloat(confidenceFromChangePct(changePct).toFixed(4)),
        exchange: "coingecko",
        triggeredAt: ts,
      };
    })
    .filter(Boolean);
}

async function fetchCoinbaseCrypto(symbols) {
  const cryptoSymbols = symbols.filter((symbol) => ["BTC", "ETH", "SOL", "AVAX", "XRP", "DOGE"].includes(symbol));
  if (cryptoSymbols.length === 0) return [];

  const ts = nowIso();
  const rows = [];

  for (const symbol of cryptoSymbols) {
    const product = `${symbol}-USD`;
    const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(product)}/ticker`;
    try {
      const payload = await requestJson(url);
      const price = Number.parseFloat(String(payload?.price || "0"));
      const volume = Number.parseFloat(String(payload?.volume || "0"));
      if (!Number.isFinite(price) || price <= 0) continue;

      rows.push({
        id: `live_coinbase_${symbol}_${dateKey(ts)}`,
        pair: `${symbol}/USD`,
        chain: "ethereum",
        side: "long",
        notionalUsd: Math.max(6000, Math.round(Math.abs(volume * price) * 0.0008)),
        confidence: 0.56,
        exchange: "coinbase",
        triggeredAt: ts,
      });
    } catch (error) {
      console.warn(`[live-delta] Coinbase fetch failed for ${product}: ${String(error?.message || error)}`);
    }
  }

  return rows;
}

async function fetchFinnhubNews(symbols) {
  const apiKey = String(process.env.FINNHUB_API_KEY || "").trim();
  if (!apiKey) return [];

  const unique = symbols.slice(0, 8);
  const allRows = [];

  for (const symbol of unique) {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
      symbol,
    )}&from=${dateKey(nowIso())}&to=${dateKey(nowIso())}&token=${encodeURIComponent(apiKey)}`;

    try {
      const payload = await requestJson(url);
      if (!Array.isArray(payload)) continue;

      for (const row of payload.slice(0, 6)) {
        const headline = String(row?.headline || "").trim();
        const summary = String(row?.summary || headline).trim();
        if (!headline) continue;
        const publishedAt = Number.isFinite(Number(row?.datetime))
          ? new Date(Number(row.datetime) * 1000).toISOString()
          : nowIso();
        allRows.push({
          id: `live_finnhub_${symbol}_${stableHash(`${headline}||${publishedAt}`).slice(0, 18)}`,
          title: headline,
          symbol,
          impact: classifyImpact(`${headline} ${summary}`),
          category: classifyCategory(`${headline} ${summary}`),
          summary: summary.slice(0, 360),
          publishedAt,
          source: "finnhub",
        });
      }
    } catch (error) {
      console.warn(`[live-delta] Finnhub news fetch failed for ${symbol}: ${String(error?.message || error)}`);
    }
  }

  return allRows;
}

function mergeAndDedupeCrypto(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.pair}|${row.exchange}|${dateKey(row.triggeredAt)}`;
    const previous = map.get(key);
    if (!previous || row.confidence > previous.confidence) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

function mergeAndDedupeNews(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.symbol}|${stableHash(`${row.title}|${row.publishedAt}`)}`;
    if (!map.has(key)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).slice(0, 70);
}

function buildNormalizedSnapshot(input) {
  const generatedAt = nowIso();
  const flowTape = [];
  const darkPoolTape = [];
  const cryptoTape = mergeAndDedupeCrypto(input.cryptoTape);
  const news = mergeAndDedupeNews(input.news);

  const symbols = [
    ...new Set([
      ...cryptoTape.map((row) => normalizeSymbol(String(row.pair).split("/")[0] || "")),
      ...news.map((row) => normalizeSymbol(row.symbol)),
    ]),
  ].filter(Boolean);

  return {
    generatedAt,
    source: "live-api-delta",
    symbols,
    providerStatus: {
      finnhubEnabled: Boolean(String(process.env.FINNHUB_API_KEY || "").trim()),
      generatedAt,
    },
    flowTape,
    darkPoolTape,
    cryptoTape,
    news,
  };
}

function generateAssistantOutput(input) {
  const { symbol, snapshot, generatedAt } = input;
  const cryptoRows = snapshot.cryptoTape.filter((row) => String(row.pair).startsWith(`${symbol}/`));
  const newsRows = snapshot.news.filter((row) => row.symbol === symbol).slice(0, 3);

  const directionalBias =
    cryptoRows.length === 0
      ? "neutral"
      : cryptoRows.reduce((sum, row) => sum + (row.side === "long" || row.side === "spot_buy" ? 1 : -1), 0) >= 0
        ? "long"
        : "short";

  const confidence =
    cryptoRows.length === 0
      ? 0.52
      : cryptoRows.reduce((sum, row) => sum + Number(row.confidence || 0.5), 0) / cryptoRows.length;

  const topCatalyst = newsRows[0]?.title || "No major same-day catalyst in feed.";

  return [
    `Timestamp: ${generatedAt}`,
    `Primary bias: ${directionalBias.toUpperCase()} with confidence ${(confidence * 100).toFixed(1)}%.`,
    `Catalyst check: ${topCatalyst}`,
    "Risk controls: reduce size under mixed signals, require invalidation level, and avoid overconfidence during low-liquidity windows.",
  ].join(" ");
}

function buildTrainingRows(snapshot) {
  const rows = [];

  for (const symbol of snapshot.symbols) {
    const symbolSnapshot = {
      generatedAt: snapshot.generatedAt,
      symbol,
      flowTape: snapshot.flowTape.filter((row) => row.symbol === symbol),
      darkPoolTape: snapshot.darkPoolTape.filter((row) => row.symbol === symbol),
      cryptoTape: snapshot.cryptoTape.filter((row) => String(row.pair).startsWith(`${symbol}/`)),
      news: snapshot.news.filter((row) => row.symbol === symbol),
    };

    const instruction =
      "Use this normalized live market snapshot to produce a concise directional thesis, confidence range, invalidation trigger, and position-risk guidance.";

    const row = {
      instruction,
      input: JSON.stringify(symbolSnapshot),
      output: generateAssistantOutput({ symbol, snapshot, generatedAt: snapshot.generatedAt }),
      category: "STOCK_CRYPTO_LIVE_DELTA",
      metadata: {
        source: "live-ingestion-delta",
        symbol,
        generatedAt: snapshot.generatedAt,
        dailyDeltaKey: `live-delta|${symbol}|${dateKey(snapshot.generatedAt)}`,
        providers: ["binance", "coinbase", "coingecko", ...(snapshot.providerStatus.finnhubEnabled ? ["finnhub"] : [])],
      },
    };

    rows.push(row);
  }

  const summaryInstruction =
    "Summarize the cross-asset live snapshot and produce portfolio-level risk posture guidance with uncertainty-aware language.";

  rows.push({
    instruction: summaryInstruction,
    input: JSON.stringify({
      generatedAt: snapshot.generatedAt,
      symbols: snapshot.symbols,
      counts: {
        flowTape: snapshot.flowTape.length,
        darkPoolTape: snapshot.darkPoolTape.length,
        cryptoTape: snapshot.cryptoTape.length,
        news: snapshot.news.length,
      },
      snapshot,
    }),
    output: `Cross-asset summary at ${snapshot.generatedAt}: ${snapshot.symbols.length} symbols monitored, ${snapshot.cryptoTape.length} crypto flow rows, ${snapshot.news.length} catalyst rows. Maintain risk-on only where directional and catalyst alignment agree; otherwise use reduced size and shorter holding windows.`,
    category: "MARKET_LIVE_SUMMARY",
    metadata: {
      source: "live-ingestion-delta",
      generatedAt: snapshot.generatedAt,
      dailyDeltaKey: `live-summary|${dateKey(snapshot.generatedAt)}`,
      providers: ["binance", "coinbase", "coingecko", ...(snapshot.providerStatus.finnhubEnabled ? ["finnhub"] : [])],
    },
  });

  return rows.map((row) => {
    const integrityBaseHash = stableHash(`${row.instruction}||${row.input}||${row.output}||${row.category}`);
    const dayBucket = dateKey(String(row.metadata.generatedAt || nowIso()));
    return {
      ...row,
      metadata: {
        ...row.metadata,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        integrityBaseHash,
        integrityHash: stableHash(`${integrityBaseHash}||${dayBucket}`),
      },
    };
  });
}

function readExistingKeys(filePath) {
  const hashes = new Set();
  const dailyKeys = new Set();
  if (!fs.existsSync(filePath)) {
    return { hashes, dailyKeys };
  }

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      const integrityHash = String(parsed?.metadata?.integrityHash || "");
      if (integrityHash) hashes.add(integrityHash);
      const dailyDeltaKey = String(parsed?.metadata?.dailyDeltaKey || "");
      if (dailyDeltaKey) dailyKeys.add(dailyDeltaKey);
    } catch {
      // Ignore malformed historical lines; do not fail ingestion.
    }
  }

  return { hashes, dailyKeys };
}

function writeState(payload) {
  ensureDir(ARTIFACTS_DIR);
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const runStartedAt = nowIso();
  const dryRun = hasArg("--dry-run");
  const symbols = parseSymbolList();

  ensureDir(EXTERNAL_DATASET_DIR);
  ensureDir(ARTIFACTS_DIR);

  console.log(`[live-delta] starting ingestion (${dryRun ? "dry-run" : "write"}) for symbols: ${symbols.join(", ")}`);

  const [binanceRows, coinbaseRows, coingeckoRows, finnhubRows] = await Promise.all([
    fetchBinanceCrypto(symbols).catch((error) => {
      console.warn(`[live-delta] Binance fetch failed: ${String(error?.message || error)}`);
      return [];
    }),
    fetchCoinbaseCrypto(symbols).catch((error) => {
      console.warn(`[live-delta] Coinbase fetch failed: ${String(error?.message || error)}`);
      return [];
    }),
    fetchCoinGeckoCrypto(symbols).catch((error) => {
      console.warn(`[live-delta] CoinGecko fetch failed: ${String(error?.message || error)}`);
      return [];
    }),
    fetchFinnhubNews(symbols).catch((error) => {
      console.warn(`[live-delta] Finnhub fetch failed: ${String(error?.message || error)}`);
      return [];
    }),
  ]);

  const snapshot = buildNormalizedSnapshot({
    cryptoTape: [...binanceRows, ...coinbaseRows, ...coingeckoRows],
    news: finnhubRows,
  });

  if (snapshot.symbols.length === 0) {
    throw new Error("No normalized live symbols produced. Check network/API availability.");
  }

  const rows = buildTrainingRows(snapshot);
  const outputFile = path.join(EXTERNAL_DATASET_DIR, `live-market-delta-${dateKey(snapshot.generatedAt)}.jsonl`);
  const existingKeys = readExistingKeys(outputFile);
  const freshRows = rows.filter(
    (row) =>
      !existingKeys.hashes.has(row.metadata.integrityHash) &&
      !existingKeys.dailyKeys.has(String(row.metadata.dailyDeltaKey || "")),
  );

  if (!dryRun && freshRows.length > 0) {
    const payload = freshRows.map((row) => JSON.stringify(row)).join("\n") + "\n";
    fs.appendFileSync(outputFile, payload, "utf8");
  }

  const summary = {
    ok: true,
    startedAt: runStartedAt,
    finishedAt: nowIso(),
    dryRun,
    symbols,
    outputFile,
    totals: {
      generatedRows: rows.length,
      newRowsWritten: freshRows.length,
      existingRowsSkipped: rows.length - freshRows.length,
      cryptoRows: snapshot.cryptoTape.length,
      newsRows: snapshot.news.length,
      flowRows: snapshot.flowTape.length,
      darkPoolRows: snapshot.darkPoolTape.length,
    },
    providers: {
      binance: binanceRows.length > 0,
      coinbase: coinbaseRows.length > 0,
      coingecko: coingeckoRows.length > 0,
      finnhub: finnhubRows.length > 0,
    },
  };

  writeState(summary);
  console.log(`[live-delta] complete. generated=${rows.length} new=${freshRows.length} file=${outputFile}`);
}

main().catch((error) => {
  const summary = {
    ok: false,
    finishedAt: nowIso(),
    error: error instanceof Error ? error.message : String(error),
  };
  try {
    writeState(summary);
  } catch {
    // ignore state write failure on hard crash path
  }
  console.error(`[live-delta] failed: ${summary.error}`);
  process.exit(1);
});
