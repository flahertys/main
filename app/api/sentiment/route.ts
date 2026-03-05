/**
 * GET /api/sentiment
 *
 * Returns the current sentiment snapshot (market + per-asset scores,
 * rolling history, and recent events).
 *
 * Query params:
 *  - symbols  comma-separated list of asset symbols (default: BTC,ETH,SOL)
 */

import { buildSentimentSnapshot } from "@/lib/trading/sentiment-engine";
import { enforceRateLimit } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "api:sentiment:get",
    max: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const { searchParams } = new URL(request.url);
  const rawSymbols = searchParams.get("symbols") ?? "BTC,ETH,SOL";
  const symbols = rawSymbols
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9]{1,12}$/.test(s))
    .slice(0, 10); // cap at 10 assets

  if (symbols.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid symbols provided." },
      { status: 400, headers: rateLimit.headers },
    );
  }

  // Use a 1-minute seed window for lightweight cache coherence.
  const seed = Math.floor(Date.now() / 60_000);
  const snapshot = buildSentimentSnapshot(seed, symbols);

  return NextResponse.json(
    { ok: true, data: snapshot },
    {
      headers: {
        ...rateLimit.headers,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
      },
    },
  );
}
