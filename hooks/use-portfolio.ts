/**
 * usePortfolio — React hook for the multi-exchange portfolio dashboard.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExchangeConnection, PortfolioSnapshot } from "@/types/trading";

export interface UsePortfolioOptions {
  connections: ExchangeConnection[];
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UsePortfolioResult {
  snapshot: PortfolioSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

/**
 * Fetches and periodically refreshes the aggregated portfolio snapshot.
 */
export function usePortfolio({
  connections,
  pollIntervalMs = 120_000,
  enabled = true,
}: UsePortfolioOptions): UsePortfolioResult {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  const fetchSnapshot = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portfolio/aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connections: connectionsRef.current }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const json = await res.json() as { ok: boolean; data: PortfolioSnapshot };
      setSnapshot(json.data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

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
