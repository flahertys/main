/**
 * Core Sentiment Analysis Engine.
 *
 * Aggregates social, news, and on-chain signals into a composite
 * -100 to +100 score with categorical labels (Extreme Fear → Extreme Greed).
 * Maintains rolling 24h / 7d / 30d history and per-asset breakdowns.
 */

import type {
  SentimentCategory,
  SentimentEvent,
  SentimentHistoryPoint,
  SentimentScore,
  SentimentSnapshot,
} from "@/types/trading";

// ─── Category Thresholds ──────────────────────────────────────────────────────

/**
 * Map a numeric score to a sentiment category.
 * Mirrors the Fear & Greed Index convention.
 */
export function scoreToCategory(score: number): SentimentCategory {
  if (score <= -60) return "extreme_fear";
  if (score <= -20) return "fear";
  if (score < 20) return "neutral";
  if (score < 60) return "greed";
  return "extreme_greed";
}

/** Human-readable label for a category. */
export function categoryLabel(category: SentimentCategory): string {
  const labels: Record<SentimentCategory, string> = {
    extreme_fear: "Extreme Fear",
    fear: "Fear",
    neutral: "Neutral",
    greed: "Greed",
    extreme_greed: "Extreme Greed",
  };
  return labels[category];
}

/** Tailwind CSS color class for a category (dark-mode first). */
export function categoryColor(category: SentimentCategory): string {
  const colors: Record<SentimentCategory, string> = {
    extreme_fear: "text-red-500",
    fear: "text-orange-400",
    neutral: "text-yellow-400",
    greed: "text-lime-400",
    extreme_greed: "text-green-400",
  };
  return colors[category];
}

// ─── Seeded RNG (deterministic for SSR consistency) ──────────────────────────

function seededRng(seed: number) {
  let s = (seed % 2_147_483_647 + 2_147_483_647) % 2_147_483_647;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Aggregate three sub-scores into a composite score using fixed weights:
 * - social  40 %
 * - news    35 %
 * - onChain 25 %
 */
export function aggregateScore(social: number, news: number, onChain: number): number {
  const raw = social * 0.4 + news * 0.35 + onChain * 0.25;
  return Math.round(Math.max(-100, Math.min(100, raw)));
}

// ─── Simulated Sentiment Events ───────────────────────────────────────────────

const TWEET_TEMPLATES = [
  "#{sym} breaking out, 100x incoming 🚀",
  "Whales accumulating #{sym} heavily",
  "#{sym} RSI oversold, good entry?",
  "#{sym} looking bearish, careful",
  "Institutional buying detected on #{sym}",
  "#{sym} forming a classic head-and-shoulders",
  "#{sym} on-chain metrics extremely bullish",
  "Sell the news on #{sym}? Dumping hard.",
];

const NEWS_TEMPLATES = [
  "#{sym} ETF approval rumored, sources say",
  "Hack reported on major #{sym} bridge",
  "#{sym} adoption by Fortune 500 company",
  "Regulatory crackdown may affect #{sym}",
  "#{sym} upgrade goes live, network stable",
  "Analysts raise #{sym} price target significantly",
];

const SOURCES: SentimentEvent["source"][] = [
  "twitter",
  "reddit",
  "news",
  "on-chain",
  "derivatives",
];

/**
 * Generate a batch of simulated sentiment events for the given symbols and seed.
 * In production replace with real API integrations (Twitter/X, CryptoCompare, Glassnode).
 */
export function generateSentimentEvents(
  symbols: string[],
  count: number,
  seed: number,
): SentimentEvent[] {
  const rng = seededRng(seed);
  const events: SentimentEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const sym = pick(symbols, rng);
    const source = pick(SOURCES, rng);
    const templates = source === "news" ? NEWS_TEMPLATES : TWEET_TEMPLATES;
    const template = pick(templates, rng);
    const text = template.replace("#{sym}", sym);
    const score = Math.round((rng() * 200 - 100) * 0.85); // -85 to +85
    const weight = Number((0.1 + rng() * 0.4).toFixed(2));
    const ageMs = Math.floor(rng() * 6 * 60 * 60 * 1000); // up to 6h ago

    events.push({
      id: `evt-${seed}-${i}`,
      symbol: sym,
      source,
      text,
      score,
      weight,
      timestamp: new Date(now - ageMs).toISOString(),
    });
  }

  return events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

// ─── Asset Score Calculation ──────────────────────────────────────────────────

/**
 * Derive a per-asset SentimentScore from a list of events using the given seed
 * for deterministic sub-score generation.
 */
export function computeAssetScore(
  symbol: string,
  events: SentimentEvent[],
  seed: number,
): SentimentScore {
  const rng = seededRng(seed);
  const assetEvents = events.filter((e) => e.symbol === symbol);

  let weightedSum = 0;
  let totalWeight = 0;
  for (const ev of assetEvents) {
    weightedSum += ev.score * ev.weight;
    totalWeight += ev.weight;
  }

  const eventScore = totalWeight > 0 ? weightedSum / totalWeight : rng() * 40 - 20;

  // Add independent sub-scores with slight random variance
  const socialScore = Math.round(eventScore + (rng() * 20 - 10));
  const newsScore = Math.round(eventScore * 0.9 + (rng() * 30 - 15));
  const onChainScore = Math.round(eventScore * 0.7 + (rng() * 40 - 20));

  const score = aggregateScore(socialScore, newsScore, onChainScore);

  return {
    symbol,
    score,
    category: scoreToCategory(score),
    socialScore: Math.max(-100, Math.min(100, socialScore)),
    newsScore: Math.max(-100, Math.min(100, newsScore)),
    onChainScore: Math.max(-100, Math.min(100, onChainScore)),
    timestamp: new Date().toISOString(),
  };
}

// ─── History Generation ───────────────────────────────────────────────────────

/**
 * Generate a rolling time-series history by back-filling scores at regular intervals.
 * @param baseSeed  deterministic seed so SSR and CSR render identically
 * @param points    number of data points to generate
 * @param intervalMs time between points in milliseconds
 */
export function generateSentimentHistory(
  baseSeed: number,
  points: number,
  intervalMs: number,
): SentimentHistoryPoint[] {
  const rng = seededRng(baseSeed);
  const now = Date.now();
  const history: SentimentHistoryPoint[] = [];
  let score = Math.round(rng() * 60 - 30); // start somewhere in the middle

  for (let i = points - 1; i >= 0; i--) {
    score = Math.max(-100, Math.min(100, score + Math.round(rng() * 14 - 7)));
    history.push({
      timestamp: new Date(now - i * intervalMs).toISOString(),
      score,
      category: scoreToCategory(score),
    });
  }

  return history;
}

// ─── Main Snapshot Factory ────────────────────────────────────────────────────

const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL"];

/**
 * Build a complete SentimentSnapshot.
 *
 * @param seed  deterministic seed (use e.g. `Math.floor(Date.now() / 60_000)` for
 *              1-minute cache windows in production)
 * @param symbols  assets to score (defaults to BTC / ETH / SOL)
 */
export function buildSentimentSnapshot(seed: number, symbols = DEFAULT_SYMBOLS): SentimentSnapshot {
  const events = generateSentimentEvents(symbols, 40, seed);

  const assetScores = symbols.map((sym, i) => computeAssetScore(sym, events, seed + i * 17));

  const avgScore = Math.round(assetScores.reduce((acc, a) => acc + a.score, 0) / assetScores.length);
  const rng = seededRng(seed);
  const marketScore: SentimentScore = {
    symbol: "MARKET",
    score: avgScore,
    category: scoreToCategory(avgScore),
    socialScore: Math.round(avgScore + (rng() * 10 - 5)),
    newsScore: Math.round(avgScore + (rng() * 10 - 5)),
    onChainScore: Math.round(avgScore + (rng() * 10 - 5)),
    timestamp: new Date().toISOString(),
  };

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  return {
    generatedAt: new Date().toISOString(),
    market: marketScore,
    assets: assetScores,
    recentEvents: events.slice(0, 20),
    history24h: generateSentimentHistory(seed + 1, 24, HOUR),
    history7d: generateSentimentHistory(seed + 2, 7, DAY),
    history30d: generateSentimentHistory(seed + 3, 30, DAY),
  };
}
