"use client";

/**
 * PortfolioOverview — main portfolio dashboard component.
 * Shows total value, asset table, allocation chart, and rebalance suggestions.
 */

import { useState, useCallback } from "react";
import { RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react";
import { ExchangeConnector } from "./ExchangeConnector";
import { AssetAllocationChart } from "./AssetAllocationChart";
import { RebalanceSuggestions } from "./RebalanceSuggestions";
import { usePortfolio } from "@/hooks/use-portfolio";
import type { ExchangeConnection, PortfolioAsset } from "@/types/trading";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

/** Escape a value for RFC 4180 CSV (wrap in quotes, escape embedded quotes). */
function csvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportCSV(assets: PortfolioAsset[]) {
  const headers = ["Symbol", "Exchange", "Quantity", "Price (USD)", "Value (USD)", "24h Change (%)", "Allocation (%)"];
  const rows = assets.map((a) => [
    a.symbol,
    a.exchange,
    a.quantity,
    a.currentPrice.toFixed(2),
    a.valueUsd.toFixed(2),
    a.change24hPct.toFixed(2),
    a.allocationPct.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEMO_CONNECTIONS: ExchangeConnection[] = [
  {
    id: "demo-1",
    exchange: "binance",
    label: "Binance",
    apiKey: "demo-key",
    status: "connected",
    lastSynced: new Date().toISOString(),
  },
  {
    id: "demo-2",
    exchange: "coinbase",
    label: "Coinbase",
    apiKey: "demo-key",
    status: "connected",
    lastSynced: new Date().toISOString(),
  },
];

/**
 * Full-featured portfolio dashboard with exchange connectivity and AI rebalancing.
 */
export function PortfolioOverview() {
  const [connections, setConnections] = useState<ExchangeConnection[]>(DEMO_CONNECTIONS);
  const [sortKey, setSortKey] = useState<keyof PortfolioAsset>("valueUsd");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"holdings" | "rebalance" | "connect">("holdings");

  const { snapshot, loading, error, refresh, lastUpdated } = usePortfolio({
    connections,
    pollIntervalMs: 120_000,
  });

  const handleSort = useCallback((key: keyof PortfolioAsset) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return key;
    });
  }, []);

  const sortedAssets = snapshot
    ? [...snapshot.assets].sort((a, b) => {
        const va = a[sortKey] as number | string;
        const vb = b[sortKey] as number | string;
        if (typeof va === "number" && typeof vb === "number") {
          return sortDir === "asc" ? va - vb : vb - va;
        }
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display">Portfolio Dashboard</h2>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors disabled:opacity-50"
            aria-label="Refresh portfolio"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </button>
          {snapshot && (
            <button
              onClick={() => exportCSV(snapshot.assets)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted/60 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Stats */}
      {snapshot && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Value"
            value={`$${snapshot.totalValueUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
          />
          <StatCard
            label="24h Change"
            value={`${snapshot.change24hPct >= 0 ? "+" : ""}${snapshot.change24hPct.toFixed(2)}%`}
            sub={`$${Math.abs(snapshot.change24hUsd).toFixed(2)}`}
          />
          <StatCard label="Assets" value={String(snapshot.assets.length)} />
          <StatCard label="Exchanges" value={String(connections.filter((c) => c.status === "connected").length)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/40">
        {(["holdings", "rebalance", "connect"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "holdings" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Holdings table */}
          <div className="flex-1 overflow-x-auto">
            {loading && !snapshot ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40">
                    {(["symbol", "exchange", "quantity", "currentPrice", "valueUsd", "change24hPct", "allocationPct"] as const).map((col) => (
                      <th
                        key={col}
                        className="text-left px-2 py-2 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                        onClick={() => handleSort(col)}
                      >
                        {col === "currentPrice" ? "Price" : col === "valueUsd" ? "Value" : col === "change24hPct" ? "24h %" : col === "allocationPct" ? "Alloc %" : col.charAt(0).toUpperCase() + col.slice(1)}
                        {sortKey === col && (sortDir === "asc" ? " ↑" : " ↓")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.map((asset, i) => (
                    <tr key={`${asset.symbol}-${asset.exchange}-${i}`} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="px-2 py-2 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: asset.color }} />
                        {asset.symbol}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground capitalize">{asset.exchange}</td>
                      <td className="px-2 py-2 font-mono">{asset.quantity.toFixed(6)}</td>
                      <td className="px-2 py-2 font-mono">${asset.currentPrice.toLocaleString()}</td>
                      <td className="px-2 py-2 font-mono font-medium">${asset.valueUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className={`px-2 py-2 font-mono ${asset.change24hPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {asset.change24hPct >= 0 ? (
                          <TrendingUp className="w-3 h-3 inline mr-0.5" aria-hidden />
                        ) : (
                          <TrendingDown className="w-3 h-3 inline mr-0.5" aria-hidden />
                        )}
                        {asset.change24hPct >= 0 ? "+" : ""}{asset.change24hPct.toFixed(2)}%
                      </td>
                      <td className="px-2 py-2 font-mono">{asset.allocationPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {sortedAssets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">
                        No holdings found. Add exchange connections to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Allocation chart */}
          {snapshot && snapshot.assets.length > 0 && (
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Allocation</h4>
              <AssetAllocationChart assets={snapshot.assets} size={180} />
            </div>
          )}
        </div>
      )}

      {activeTab === "rebalance" && (
        <div>
          {snapshot ? (
            <RebalanceSuggestions suggestions={snapshot.rebalanceSuggestions} />
          ) : (
            <p className="text-sm text-muted-foreground">Load portfolio to see rebalance suggestions.</p>
          )}
        </div>
      )}

      {activeTab === "connect" && (
        <ExchangeConnector connections={connections} onChange={setConnections} />
      )}
    </div>
  );
}
