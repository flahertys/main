/**
 * POST /api/portfolio/aggregate
 *
 * Accepts a list of exchange connections and returns the aggregated portfolio snapshot.
 */

import { aggregatePortfolio } from "@/lib/trading/portfolio-aggregator";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import type { ExchangeConnection } from "@/types/trading";

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "api:portfolio:aggregate:post",
    max: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !Array.isArray((body as Record<string, unknown>).connections)) {
      return NextResponse.json(
        { ok: false, error: "Request body must include a `connections` array." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const connections = (body as { connections: ExchangeConnection[] }).connections;

    // Sanitize connections — never log API keys
    const sanitized: ExchangeConnection[] = connections.map((c) => ({
      id: String(c.id ?? "").slice(0, 64),
      exchange: (["binance", "coinbase", "kraken", "manual"].includes(c.exchange) ? c.exchange : "manual"),
      label: String(c.label ?? "").slice(0, 64),
      apiKey: String(c.apiKey ?? "").slice(0, 256),
      status: (["connected", "disconnected", "error", "testing"].includes(c.status) ? c.status : "disconnected"),
      lastSynced: typeof c.lastSynced === "string" ? c.lastSynced : undefined,
    }));

    const snapshot = await aggregatePortfolio(sanitized);

    // Mask API keys in response
    const safeConnections = sanitized.map((c) => ({
      ...c,
      apiKey: c.apiKey.length > 4 ? `${c.apiKey.slice(0, 4)}${"*".repeat(Math.min(c.apiKey.length - 4, 20))}` : "****",
    }));

    return NextResponse.json(
      { ok: true, data: { ...snapshot, connections: safeConnections } },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Portfolio aggregation error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Aggregation failed." },
      { status: 500 },
    );
  }
}
