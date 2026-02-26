"use client";

import { useEffect, useState } from "react";

export interface MarketAsset {
  symbol: string;
  pair: string;
  price: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  source: string;
  updatedAt: string;
}

export function useMarketFeed() {
  const [watchlist, setWatchlist] = useState<MarketAsset[]>([]);
  const [marketStatus, setMarketStatus] = useState<string>("Connecting to live market feed...");
  const [marketFeedUpdatedAt, setMarketFeedUpdatedAt] = useState<string>("");
  const [marketTransport, setMarketTransport] = useState<"sse" | "polling" | "offline">("offline");

  useEffect(() => {
    let disposed = false;
    let eventSource: EventSource | null = null;
    let fallbackIntervalId: number | null = null;
    let fallbackStarted = false;

    const hydrateItems = (payload: { items?: unknown; generatedAt?: unknown; source?: unknown }) => {
      if (!Array.isArray(payload.items)) return;

      const items = payload.items
        .map((item: Partial<MarketAsset>) => {
          const trend: MarketAsset["trend"] = item.trend === "down" || item.trend === "flat" ? item.trend : "up";
          return {
            symbol: String(item.symbol || ""),
            pair: String(item.pair || ""),
            price: Number(item.price),
            changePercent: Number(item.changePercent),
            trend,
            source: String(item.source || "Binance 24h ticker"),
            updatedAt: String(item.updatedAt || new Date().toISOString()),
          };
        })
        .filter(
          (item: MarketAsset) =>
            item.symbol.length > 0
            && Number.isFinite(item.price)
            && Number.isFinite(item.changePercent),
        );

      if (items.length > 0 && !disposed) {
        setWatchlist(items);
        setMarketFeedUpdatedAt(String(payload.generatedAt || new Date().toISOString()));
        return items.length;
      }

      return 0;
    };

    const loadLiveMarketHttp = async () => {
      try {
        const response = await fetch("/api/ai/market?symbols=SOLUSDT,BTCUSDT,ETHUSDT", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.items)) {
          throw new Error(typeof payload?.error === "string" ? payload.error : "live_market_feed_unavailable");
        }

        const count = hydrateItems(payload);
        if (count > 0 && !disposed) {
          setMarketTransport("polling");
          setMarketStatus(`Live feed (HTTP): ${String(payload.source || "market provider")} • ${count} assets`);
        }
      } catch (error) {
        if (disposed) return;
        setMarketTransport("offline");
        setMarketStatus(
          error instanceof Error
            ? `Live feed unavailable (${error.message}). Retrying...`
            : "Live feed unavailable. Retrying...",
        );
      }
    };

    const startHttpFallback = () => {
      if (fallbackStarted || disposed) return;
      fallbackStarted = true;
      setMarketStatus("Stream interrupted. Switching to HTTP fallback...");
      void loadLiveMarketHttp();
      fallbackIntervalId = window.setInterval(loadLiveMarketHttp, 10000);
    };

    if (typeof window !== "undefined" && "EventSource" in window) {
      eventSource = new EventSource("/api/ai/market/stream?symbols=SOLUSDT,BTCUSDT,ETHUSDT&intervalMs=5000");

      eventSource.addEventListener("ready", (event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as { source?: unknown };
          setMarketTransport("sse");
          setMarketStatus(`Live feed (stream): ${String(payload.source || "market provider")}`);
        } catch {
          setMarketTransport("sse");
          setMarketStatus("Live feed (stream): connected");
        }
      });

      eventSource.addEventListener("market", (event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as {
            items?: unknown;
            generatedAt?: unknown;
            source?: unknown;
          };
          const count = hydrateItems(payload);
          if (count > 0) {
            setMarketTransport("sse");
            setMarketStatus(`Live feed (stream): ${String(payload.source || "market provider")} • ${count} assets`);
          }
        } catch {
          // ignore malformed stream packet
        }
      });

      eventSource.addEventListener("error", () => {
        if (disposed) return;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startHttpFallback();
      });
    } else {
      startHttpFallback();
    }

    return () => {
      disposed = true;
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackIntervalId !== null) {
        window.clearInterval(fallbackIntervalId);
      }
    };
  }, []);

  return {
    watchlist,
    marketStatus,
    marketFeedUpdatedAt,
    marketTransport,
  };
}
