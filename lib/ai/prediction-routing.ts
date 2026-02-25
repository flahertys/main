type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";

type DomainSignal = {
  domain: PredictionDomain;
  confidence: number;
  reasons: string[];
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

export type { DomainSignal, PredictionDomain };

