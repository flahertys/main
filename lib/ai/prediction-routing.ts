type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";

type DomainSignal = {
  domain: PredictionDomain;
  confidence: number;
  reasons: string[];
};

type PredictionTelemetryRecord = {
  domain: PredictionDomain;
  model: string;
  confidence: number;
  provider: "huggingface" | "kernel";
  fallback: boolean;
  timestamp: string;
};

type PredictionTelemetrySummary = {
  generatedAt: string;
  totalRequests: number;
  domains: Array<{
    domain: PredictionDomain;
    requests: number;
    avgConfidence: number;
    fallbackRate: number;
    providers: {
      huggingface: number;
      kernel: number;
    };
    models: Array<{
      model: string;
      requests: number;
    }>;
  }>;
};

const KALSHI_TERMS = [
  "kalshi",
  "event contract",
  "binary contract",
  "yes/no market",
  "yes no market",
  "election market",
  "cpi market",
  "fed cut probability",
  "prediction market",
];

const CRYPTO_TERMS = [
  "crypto",
  "bitcoin",
  "btc",
  "ethereum",
  "eth",
  "solana",
  "sol",
  "defi",
  "onchain",
  "dex",
  "cex",
  "altcoin",
  "memecoin",
];

const STOCK_TERMS = [
  "stock",
  "equity",
  "ticker",
  "earnings",
  "nasdaq",
  "nyse",
  "spx",
  "spy",
  "option chain",
  "iv",
  "implied volatility",
  "fomc",
  "10y yield",
];

function keywordScore(text: string, terms: string[]) {
  let score = 0;
  const reasons: string[] = [];

  for (const term of terms) {
    if (text.includes(term)) {
      score += term.includes(" ") ? 2 : 1;
      reasons.push(term);
    }
  }

  return { score, reasons };
}

function normalizeContext(context: unknown): string {
  if (!context) return "";
  if (typeof context === "string") return context.toLowerCase();

  try {
    return JSON.stringify(context).toLowerCase();
  } catch {
    return "";
  }
}

function getTelemetryStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_PREDICTION_TELEMETRY__?: PredictionTelemetryRecord[];
  };

  if (!globalRef.__TRADEHAX_PREDICTION_TELEMETRY__) {
    globalRef.__TRADEHAX_PREDICTION_TELEMETRY__ = [];
  }

  return globalRef.__TRADEHAX_PREDICTION_TELEMETRY__;
}

export function inferPredictionDomain(inputMessage: string, context?: unknown): DomainSignal {
  const text = `${inputMessage} ${normalizeContext(context)}`.toLowerCase();

  const kalshi = keywordScore(text, KALSHI_TERMS);
  const crypto = keywordScore(text, CRYPTO_TERMS);
  const stock = keywordScore(text, STOCK_TERMS);

  const candidates: Array<{ domain: PredictionDomain; score: number; reasons: string[] }> = [
    { domain: "kalshi", score: kalshi.score, reasons: kalshi.reasons },
    { domain: "crypto", score: crypto.score, reasons: crypto.reasons },
    { domain: "stock", score: stock.score, reasons: stock.reasons },
  ];

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  if (!best || best.score <= 0) {
    return {
      domain: "general",
      confidence: 38,
      reasons: ["no_domain_keywords"],
    };
  }

  const confidence = Math.max(42, Math.min(95, 45 + best.score * 10));
  return {
    domain: best.domain,
    confidence,
    reasons: best.reasons.slice(0, 5),
  };
}

export function resolvePredictionModel(domain: PredictionDomain): string {
  const fallback = process.env.HF_MODEL_ID || "mistralai/Mistral-7B-Instruct-v0.1";

  if (domain === "stock") {
    return process.env.TRADEHAX_MODEL_STOCK || fallback;
  }
  if (domain === "crypto") {
    return process.env.TRADEHAX_MODEL_CRYPTO || fallback;
  }
  if (domain === "kalshi") {
    return process.env.TRADEHAX_MODEL_KALSHI || fallback;
  }

  return process.env.TRADEHAX_MODEL_GENERAL || fallback;
}

export function recordPredictionTelemetry(input: {
  domain: PredictionDomain;
  model: string;
  confidence: number;
  provider: "huggingface" | "kernel";
  fallback: boolean;
}) {
  const store = getTelemetryStore();
  store.push({
    domain: input.domain,
    model: input.model,
    confidence: Math.max(0, Math.min(100, Math.round(input.confidence))),
    provider: input.provider,
    fallback: Boolean(input.fallback),
    timestamp: new Date().toISOString(),
  });

  if (store.length > 2000) {
    store.splice(0, store.length - 2000);
  }
}

export function getPredictionTelemetrySummary(): PredictionTelemetrySummary {
  const store = getTelemetryStore();
  const domains: PredictionDomain[] = ["stock", "crypto", "kalshi", "general"];

  const summaryDomains = domains.map((domain) => {
    const rows = store.filter((row) => row.domain === domain);
    const requests = rows.length;
    const avgConfidence =
      requests > 0
        ? Number.parseFloat((rows.reduce((sum, row) => sum + row.confidence, 0) / requests).toFixed(1))
        : 0;
    const fallbackRate =
      requests > 0
        ? Number.parseFloat(((rows.filter((row) => row.fallback).length / requests) * 100).toFixed(1))
        : 0;

    const providers = {
      huggingface: rows.filter((row) => row.provider === "huggingface").length,
      kernel: rows.filter((row) => row.provider === "kernel").length,
    };

    const modelCounts = new Map<string, number>();
    for (const row of rows) {
      modelCounts.set(row.model, (modelCounts.get(row.model) || 0) + 1);
    }

    const models = Array.from(modelCounts.entries())
      .map(([model, count]) => ({ model, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 6);

    return {
      domain,
      requests,
      avgConfidence,
      fallbackRate,
      providers,
      models,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalRequests: store.length,
    domains: summaryDomains,
  };
}

export type { DomainSignal, PredictionDomain, PredictionTelemetrySummary };

