/**
 * POST /api/signals/explain
 *
 * Accepts a TradingSignal and returns a full XAI explanation.
 */

import { explainSignal } from "@/lib/trading/explainability-engine";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import type { TradingSignal } from "@/types/trading";

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "api:signals:explain:post",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400, headers: rateLimit.headers });
    }

    const b = body as Record<string, unknown>;

    const signal: TradingSignal = {
      id: sanitizePlainText(String(b.id ?? ""), 64) || `sig-${Date.now()}`,
      symbol: sanitizePlainText(String(b.symbol ?? ""), 12).toUpperCase() || "BTC",
      action: (["buy", "sell", "hold"].includes(String(b.action)) ? b.action : "hold") as TradingSignal["action"],
      confidence: typeof b.confidence === "number" ? Math.max(0, Math.min(1, b.confidence)) : 0.5,
      price: typeof b.price === "number" ? b.price : 0,
      targetPrice: typeof b.targetPrice === "number" ? b.targetPrice : 0,
      stopLoss: typeof b.stopLoss === "number" ? b.stopLoss : 0,
      timeframe: sanitizePlainText(String(b.timeframe ?? ""), 8) || "1h",
      generatedAt: typeof b.generatedAt === "string" ? b.generatedAt : new Date().toISOString(),
      source: sanitizePlainText(String(b.source ?? ""), 64) || "ai-engine",
    };

    const explanation = explainSignal(signal);

    return NextResponse.json(
      { ok: true, data: explanation },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Signal explain error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Explanation failed." },
      { status: 500 },
    );
  }
}
