/**
 * POST /api/trading/signal/process
 * Process trading signal and execute bot action
 */

import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isFiniteNumberInRange,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

interface TradeSignalRequest {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  price: number;
  targetPrice: number;
  stopLoss: number;
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "trading:signal:process:post",
    max: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: TradeSignalRequest = await request.json();
    const symbol = sanitizePlainText(String(body.symbol ?? ""), 24).toUpperCase();
    const action = String(body.action ?? "");
    const confidence =
      typeof body.confidence === "number"
        ? body.confidence
        : Number.parseFloat(String(body.confidence ?? "NaN"));
    const price =
      typeof body.price === "number" ? body.price : Number.parseFloat(String(body.price ?? "NaN"));
    const targetPrice =
      typeof body.targetPrice === "number"
        ? body.targetPrice
        : Number.parseFloat(String(body.targetPrice ?? "NaN"));
    const stopLoss =
      typeof body.stopLoss === "number"
        ? body.stopLoss
        : Number.parseFloat(String(body.stopLoss ?? "NaN"));

    // Validate signal
    if (!symbol || !action || !Number.isFinite(confidence)) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (action !== "buy" && action !== "sell" && action !== "hold") {
      return NextResponse.json(
        { ok: false, error: "Invalid action." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (!isFiniteNumberInRange(confidence, 0, 1)) {
      return NextResponse.json(
        { ok: false, error: "Confidence must be between 0 and 1" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (
      !isFiniteNumberInRange(price, 0, 100_000_000) ||
      !isFiniteNumberInRange(targetPrice, 0, 100_000_000) ||
      !isFiniteNumberInRange(stopLoss, 0, 100_000_000)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid price fields." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const signal = {
      symbol,
      action: action as "buy" | "sell" | "hold",
      confidence,
      price,
      targetPrice,
      stopLoss,
    };

    // TODO: Send to bot for execution
    // bot.processSignal(signal)

    return NextResponse.json({
      ok: true,
      signal,
      status: "processing",
      message: `Signal for ${symbol} is being processed`,
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Signal processing error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Signal processing failed",
      },
      { status: 500 },
    );
  }
}
