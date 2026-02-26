"use client";

import { Copy, ExternalLink, LayoutDashboard, Link as LinkIcon } from "lucide-react";
import { useMemo, useState } from "react";

type ChartInterval = "1" | "5" | "15" | "60" | "240" | "1D";

type HubBloombergTerminalDeskProps = {
  defaultSymbol?: string;
};

const INTERVAL_OPTIONS: Array<{ value: ChartInterval; label: string }> = [
  { value: "1", label: "1m" },
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1h" },
  { value: "240", label: "4h" },
  { value: "1D", label: "1D" },
];

function normalizeSymbol(value: string) {
  return value.replace(/[^A-Z0-9:_/-]/gi, "").toUpperCase().slice(0, 24);
}

export function HubBloombergTerminalDesk({ defaultSymbol = "BINANCE:BTCUSDT" }: HubBloombergTerminalDeskProps) {
  const [symbol, setSymbol] = useState(normalizeSymbol(defaultSymbol) || "BINANCE:BTCUSDT");
  const [interval, setInterval] = useState<ChartInterval>("60");
  const [status, setStatus] = useState("");

  const tradingViewEmbedUrl = useMemo(() => {
    const params = new URLSearchParams({
      symbol: symbol || "BINANCE:BTCUSDT",
      interval,
      theme: "dark",
      style: "1",
      locale: "en",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hide_top_toolbar: "0",
      hide_legend: "0",
      saveimage: "1",
      hideideas: "1",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, interval]);

  const tradingViewShareUrl = useMemo(() => {
    const normalized = symbol || "BINANCE:BTCUSDT";
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(normalized)}`;
  }, [symbol]);

  const yahooShareUrl = useMemo(() => {
    const raw = (symbol || "BTCUSDT").split(":").pop() || "BTCUSDT";
    return `https://finance.yahoo.com/quote/${encodeURIComponent(raw)}`;
  }, [symbol]);

  async function copyShareLink(link: string) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setStatus("Share link copied.");
      } else {
        setStatus("Clipboard unavailable in this browser.");
      }
    } catch {
      setStatus("Could not copy link.");
    }
  }

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-[rgba(8,12,18,0.88)] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-cyan-200">Bloomberg-Style Chart Desk</p>
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] uppercase text-zinc-300">
          Embeddable + Shareable
        </span>
      </div>

      <p className="mb-2 text-[10px] text-zinc-400">
        Terminal-inspired layout with commonly used embedded charts and one-click share links for collaboration.
      </p>

      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <input
          value={symbol}
          onChange={(event) => setSymbol(normalizeSymbol(event.target.value))}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          placeholder="e.g. BINANCE:BTCUSDT"
        />
        <select
          value={interval}
          onChange={(event) => setInterval(event.target.value as ChartInterval)}
          className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300/60"
          title="Chart interval"
        >
          {INTERVAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <a
          href={tradingViewShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-md border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-cyan-100"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Full Chart
        </a>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <button
          type="button"
          onClick={() => copyShareLink(tradingViewShareUrl)}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase text-zinc-200"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy TradingView Link
        </button>
        <button
          type="button"
          onClick={() => copyShareLink(yahooShareUrl)}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase text-zinc-200"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Copy Yahoo Link
        </button>
      </div>

      <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-black/35">
        <iframe
          key={`${symbol}-${interval}`}
          title={`TradingView ${symbol}`}
          src={tradingViewEmbedUrl}
          className="h-[420px] w-full"
          loading="lazy"
          allowTransparency={true}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/35 px-2 py-1.5 text-[10px] text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <LayoutDashboard className="h-3.5 w-3.5 text-cyan-300" />
          Chart source: TradingView widget embed
        </span>
        <span>{status || "Ready"}</span>
      </div>
    </div>
  );
}
