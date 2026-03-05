/**
 * React hook that fetches and periodically refreshes the sentiment snapshot.
 * Supports optional WebSocket upgrades when socket.io is available.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SentimentSnapshot } from "@/types/trading";

export interface UseSentimentStreamOptions {
  /** Comma-separated asset symbols to fetch (default: "BTC,ETH,SOL"). */
  symbols?: string;
  /** Polling interval in ms when WebSocket is unavailable (default: 60_000). */
  pollIntervalMs?: number;
  /** Whether to start polling immediately (default: true). */
  enabled?: boolean;
}

export interface UseSentimentStreamResult {
  snapshot: SentimentSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

/**
 * Provides real-time sentiment data via polling (upgradeable to WebSocket).
 *
 * @example
 * const { snapshot, loading } = useSentimentStream({ symbols: "BTC,ETH,SOL" });
 */
export function useSentimentStream({
  symbols = "BTC,ETH,SOL",
  pollIntervalMs = 60_000,
  enabled = true,
}: UseSentimentStreamOptions = {}): UseSentimentStreamResult {
  const [snapshot, setSnapshot] = useState<SentimentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/sentiment?symbols=${encodeURIComponent(symbols)}`,
        { signal: abortRef.current.signal },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const json = await res.json() as { ok: boolean; data: SentimentSnapshot };
      setSnapshot(json.data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch sentiment data.");
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    if (!enabled) return;

    fetchSnapshot();

    timerRef.current = setInterval(fetchSnapshot, pollIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [enabled, fetchSnapshot, pollIntervalMs]);

  return { snapshot, loading, error, refresh: fetchSnapshot, lastUpdated };
}
