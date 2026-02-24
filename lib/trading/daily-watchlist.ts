import { getIntelligenceSnapshot } from "@/lib/intelligence/provider";
import { upsertWatchlistItem } from "@/lib/intelligence/watchlist-store";

type DailyWatchlistBuildResult = {
  userId: string;
  generatedAt: string;
  equitySymbols: string[];
  cryptoPairs: string[];
  inserted: number;
  failed: number;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9/_.-]/g, "").slice(0, 24);
}

export async function buildDailyWatchlist(input?: {
  userId?: string;
  maxEquities?: number;
  maxCrypto?: number;
}) {
  const userId = (input?.userId || process.env.TRADEHAX_SIGNAL_DAILY_WATCHLIST_USER || "market_daily_watchlist").trim();
  const maxEquities = Math.max(3, Math.min(16, input?.maxEquities || 8));
  const maxCrypto = Math.max(2, Math.min(12, input?.maxCrypto || 6));

  const snapshot = await getIntelligenceSnapshot();

  const topFlow = [...snapshot.flowTape]
    .sort((a, b) => b.unusualScore - a.unusualScore || b.premiumUsd - a.premiumUsd)
    .map((trade) => normalizeSymbol(trade.symbol));

  const topDarkPool = [...snapshot.darkPoolTape]
    .sort((a, b) => b.unusualScore - a.unusualScore || b.notionalUsd - a.notionalUsd)
    .map((trade) => normalizeSymbol(trade.symbol));

  const highImpactNews = snapshot.news
    .filter((item) => item.impact === "high" || item.impact === "medium")
    .map((item) => normalizeSymbol(item.symbol));

  const equitySymbols = unique(topFlow.concat(topDarkPool, highImpactNews)).slice(0, maxEquities);

  const cryptoPairs = unique(
    [...snapshot.cryptoTape]
      .sort((a, b) => b.confidence - a.confidence || b.notionalUsd - a.notionalUsd)
      .map((trade) => normalizeSymbol(trade.pair)),
  ).slice(0, maxCrypto);

  let inserted = 0;
  let failed = 0;

  for (const symbol of equitySymbols) {
    const result = await upsertWatchlistItem(userId, {
      symbol,
      assetType: "equity",
      minFlowPremiumUsd: 700_000,
      minDarkPoolNotionalUsd: 14_000_000,
      minUnusualScore: 75,
      notes: "Auto-generated daily equity watchlist",
      active: true,
    });

    if (result.ok) inserted += 1;
    else failed += 1;
  }

  for (const pair of cryptoPairs) {
    const result = await upsertWatchlistItem(userId, {
      symbol: pair,
      assetType: "crypto",
      minCryptoNotionalUsd: 500_000,
      minConfidence: 0.65,
      minUnusualScore: 65,
      notes: "Auto-generated daily crypto watchlist",
      active: true,
    });

    if (result.ok) inserted += 1;
    else failed += 1;
  }

  return {
    userId,
    generatedAt: new Date().toISOString(),
    equitySymbols,
    cryptoPairs,
    inserted,
    failed,
  } satisfies DailyWatchlistBuildResult;
}
