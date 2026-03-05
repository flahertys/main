/**
 * POST /api/backtest/run
 *
 * Accepts a BacktestConfig and returns a full BacktestResult.
 */

import { runBacktest } from "@/lib/trading/backtest-engine";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import type { BacktestConfig } from "@/types/trading";
import { nanoid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "api:backtest:run:post",
    max: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400, headers: rateLimit.headers });
    }

    const b = body as Record<string, unknown>;

    const validTimeRanges = ["1M", "3M", "6M", "1Y", "custom"];
    const timeRange = validTimeRanges.includes(String(b.timeRange)) ? String(b.timeRange) : "3M";

    const config: BacktestConfig = {
      id: sanitizePlainText(String(b.id ?? ""), 64) || nanoid(),
      symbol: sanitizePlainText(String(b.symbol ?? ""), 12).toUpperCase() || "BTC",
      timeRange: timeRange as BacktestConfig["timeRange"],
      customStartDate: typeof b.customStartDate === "string" ? b.customStartDate : undefined,
      customEndDate: typeof b.customEndDate === "string" ? b.customEndDate : undefined,
      initialCapital: typeof b.initialCapital === "number" && b.initialCapital > 0 ? Math.min(b.initialCapital, 10_000_000) : 10_000,
      feePct: typeof b.feePct === "number" ? Math.max(0, Math.min(b.feePct, 5)) : 0.1,
      slippagePct: typeof b.slippagePct === "number" ? Math.max(0, Math.min(b.slippagePct, 2)) : 0.05,
    };

    const result = runBacktest(config);

    return NextResponse.json(
      { ok: true, data: result },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Backtest run error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Backtest failed." },
      { status: 500 },
    );
  }
}
