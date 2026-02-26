"use client";

import { motion } from "framer-motion";
import { Plus, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";

type MarketAsset = {
  symbol: string;
  pair: string;
  price: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  source: string;
  updatedAt: string;
};

type HubMarketWorkspaceProps = {
  watchlist: MarketAsset[];
  marketTransport: "sse" | "polling" | "offline";
  marketStatus: string;
  marketFeedUpdatedAt: string;
};

function formatMarketPrice(value: number) {
  if (!Number.isFinite(value)) return "--";

  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (Math.abs(value) >= 1) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  }).format(value);
}

function formatMarketChangePercent(value: number) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function HubMarketWorkspace({
  watchlist,
  marketTransport,
  marketStatus,
  marketFeedUpdatedAt,
}: HubMarketWorkspaceProps) {
  const [tickerQuery, setTickerQuery] = useState("");

  const filteredWatchlist = useMemo(() => {
    const query = tickerQuery.trim().toLowerCase();
    if (!query) return watchlist;

    return watchlist.filter((asset) =>
      asset.symbol.toLowerCase().includes(query) || asset.pair.toLowerCase().includes(query),
    );
  }, [tickerQuery, watchlist]);

  return (
    <motion.div
      key="market"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-white italic uppercase">Market Picker</h3>
          <p className="text-[10px] font-mono text-zinc-500">
            REAL-TIME_ASSET_DISCOVERY • MODE_{marketTransport.toUpperCase()}
          </p>
          <p className="mt-1 text-[10px] font-mono text-cyan-300/80">{marketStatus}</p>
          {marketFeedUpdatedAt ? (
            <p className="mt-1 text-[10px] font-mono text-zinc-500">
              Updated: {new Date(marketFeedUpdatedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search_Ticker..."
              value={tickerQuery}
              onChange={(event) => setTickerQuery(event.target.value.slice(0, 24))}
              className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-1.5 text-[10px] text-white focus:border-cyan-500 outline-none w-40"
            />
          </div>
          <button className="flex min-h-[44px] items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500 text-black text-[10px] font-black uppercase italic hover:scale-105 transition-transform">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredWatchlist.map((asset) => (
          <div key={asset.symbol} className="flex items-center justify-between p-5 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-cyan-500/30 hover:bg-zinc-900/60 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-black text-sm text-white border border-white/5 shadow-xl group-hover:scale-110 transition-transform">
                {asset.symbol[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-white uppercase italic">{asset.symbol}</p>
                  {asset.symbol === "HAX" && <Sparkles className="w-3 h-3 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-zinc-600 font-mono">SECURE_SETTLEMENT</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-white mb-1">${formatMarketPrice(asset.price)}</p>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${asset.trend === "up" ? "bg-emerald-500/10 text-emerald-400" : asset.trend === "down" ? "bg-red-500/10 text-red-400" : "bg-zinc-500/10 text-zinc-300"}`}>
                {asset.trend === "down" ? <TrendingUp className="w-3 h-3 rotate-180" /> : <TrendingUp className="w-3 h-3" />}
                {formatMarketChangePercent(asset.changePercent)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2">
          <Zap className="w-4 h-4 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-emerald-500 uppercase font-black italic mb-1 tracking-widest">Neural Alpha Picker</p>
              <p className="text-xs text-zinc-400 max-w-[280px]">New institutional signal for <span className="text-white font-bold italic">$HAX/SOL</span> detected with 94% confidence.</p>
            </div>
          </div>
          <button className="px-8 py-3 bg-emerald-500 text-black text-[10px] font-black rounded-xl uppercase italic hover:bg-white transition-all shadow-lg">
            Fetch_Alpha
          </button>
        </div>
      </div>
    </motion.div>
  );
}
