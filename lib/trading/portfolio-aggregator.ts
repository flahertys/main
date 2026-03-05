/**
 * Portfolio Aggregator
 *
 * Aggregates holdings from multiple exchanges into a unified PortfolioSnapshot.
 * Generates AI-driven rebalance suggestions based on current vs. target allocations.
 */

import type {
  ExchangeConnection,
  PortfolioAsset,
  PortfolioSnapshot,
  RebalanceSuggestion,
} from "@/types/trading";
import { getAdapter } from "./exchange-adapters";
import { nanoid } from "@/lib/utils";

// ─── Chart colors ─────────────────────────────────────────────────────────────

const ASSET_COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#a855f7", // purple
  "#22c55e", // green
  "#eab308", // yellow
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f43f5e", // rose
];

// ─── Aggregator ───────────────────────────────────────────────────────────────

/**
 * Fetch and aggregate holdings from all connected exchanges.
 * Connections with status !== "connected" are skipped.
 *
 * @param connections  List of exchange connections with API keys.
 * @returns            A complete PortfolioSnapshot.
 */
export async function aggregatePortfolio(
  connections: ExchangeConnection[],
): Promise<PortfolioSnapshot> {
  const activeConnections = connections.filter((c) => c.status === "connected");
  const allAssets: PortfolioAsset[] = [];

  for (const conn of activeConnections) {
    const adapter = getAdapter(conn.exchange);
    if (!adapter) continue;

    try {
      const assets = await adapter.fetchHoldings(conn.apiKey, "");
      allAssets.push(...assets);
    } catch (err) {
      console.warn(`Failed to fetch holdings from ${conn.exchange}:`, err);
    }
  }

  // Calculate totals
  const totalValueUsd = allAssets.reduce((sum, a) => sum + a.valueUsd, 0);

  // Set allocation percentages and colors
  const enriched: PortfolioAsset[] = allAssets.map((asset, i) => ({
    ...asset,
    allocationPct: totalValueUsd > 0 ? Number(((asset.valueUsd / totalValueUsd) * 100).toFixed(2)) : 0,
    color: ASSET_COLORS[i % ASSET_COLORS.length],
  }));

  // Sort by value descending
  enriched.sort((a, b) => b.valueUsd - a.valueUsd);

  // 24h change estimate (weighted average)
  const change24hUsd = enriched.reduce(
    (sum, a) => sum + a.valueUsd * (a.change24hPct / 100),
    0,
  );
  const change24hPct =
    totalValueUsd > 0 ? Number(((change24hUsd / (totalValueUsd - change24hUsd)) * 100).toFixed(2)) : 0;

  // Simulated performance history (replace with real DB lookups in production)
  const performanceHistory = generatePerformanceHistory(totalValueUsd);

  // Generate rebalance suggestions
  const rebalanceSuggestions = generateRebalanceSuggestions(enriched, totalValueUsd);

  return {
    generatedAt: new Date().toISOString(),
    totalValueUsd,
    change24hUsd,
    change24hPct,
    assets: enriched,
    connections,
    rebalanceSuggestions,
    performanceHistory,
  };
}

// ─── Performance history ──────────────────────────────────────────────────────

function generatePerformanceHistory(
  currentValue: number,
): PortfolioSnapshot["performanceHistory"] {
  const days = 30;
  const history: PortfolioSnapshot["performanceHistory"] = [];
  let v = currentValue * 0.75;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    v = v * (1 + (Math.random() - 0.45) * 0.04);
    history.push({
      timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      valueUsd: Math.round(v),
    });
  }
  history[history.length - 1].valueUsd = Math.round(currentValue);
  return history;
}

// ─── Rebalance suggestions ────────────────────────────────────────────────────

/**
 * Simple rule-based rebalance suggestions:
 * - Flag any single asset > 50% of portfolio
 * - Suggest diversification into BTC/ETH if not present
 */
function generateRebalanceSuggestions(
  assets: PortfolioAsset[],
  totalValue: number,
): RebalanceSuggestion[] {
  const suggestions: RebalanceSuggestion[] = [];

  // Over-concentration check
  for (const asset of assets) {
    if (asset.allocationPct > 50) {
      const targetPct = 35;
      const targetValueUsd = totalValue * (targetPct / 100);
      const excessValueUsd = asset.valueUsd - targetValueUsd;
      const qty = Number((excessValueUsd / asset.currentPrice).toFixed(6));

      suggestions.push({
        id: nanoid(),
        action: "sell",
        symbol: asset.symbol,
        exchange: asset.exchange,
        quantity: qty,
        estimatedValueUsd: excessValueUsd,
        reasoning: `${asset.symbol} represents ${asset.allocationPct.toFixed(1)}% of portfolio (target: ~35%). Reducing concentration lowers single-asset risk.`,
        priority: "high",
      });
    }
  }

  // Diversification check
  const symbols = new Set(assets.map((a) => a.symbol));
  const diversifyTargets = ["BTC", "ETH", "SOL"].filter((s) => !symbols.has(s));

  for (const sym of diversifyTargets.slice(0, 2)) {
    const allocate = Math.min(totalValue * 0.1, 1000);
    suggestions.push({
      id: nanoid(),
      action: "buy",
      symbol: sym,
      exchange: "coinbase",
      quantity: Number((allocate / 1000).toFixed(6)),
      estimatedValueUsd: allocate,
      reasoning: `Adding ${sym} exposure improves diversification and reduces correlation risk.`,
      priority: "medium",
    });
  }

  return suggestions.slice(0, 5);
}
