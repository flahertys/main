/**
 * POST /api/trading/bot/create
 * Create a new TradeHax bot
 */

import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

interface CreateBotRequest {
  name: string;
  strategy: "scalping" | "swing" | "long-term" | "arbitrage";
  riskLevel: "low" | "medium" | "high";
  allocatedCapital: number;
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
    keyPrefix: "trading:bot:create:post",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: CreateBotRequest = await request.json();
    const name = sanitizePlainText(String(body.name ?? ""), 64);
    const strategy = String(body.strategy ?? "");
    const riskLevel = String(body.riskLevel ?? "");
    const allocatedCapital =
      typeof body.allocatedCapital === "number"
        ? body.allocatedCapital
        : Number.parseFloat(String(body.allocatedCapital ?? "NaN"));

    // Validate input
    if (!name || !strategy || !riskLevel || !Number.isFinite(allocatedCapital)) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (
      strategy !== "scalping" &&
      strategy !== "swing" &&
      strategy !== "long-term" &&
      strategy !== "arbitrage"
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid strategy." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (riskLevel !== "low" && riskLevel !== "medium" && riskLevel !== "high") {
      return NextResponse.json(
        { ok: false, error: "Invalid riskLevel." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (allocatedCapital < 0.1 || allocatedCapital > 1000) {
      return NextResponse.json(
        { ok: false, error: "Allocated capital must be between 0.1 and 1000 SOL" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // Create bot (would save to database)
    const botId = `bot-${Date.now()}`;
    const bot = {
      id: botId,
      name,
      strategy,
      riskLevel,
      allocatedCapital,
      enabled: true,
      executedTrades: 0,
      profitLoss: 0,
      winRate: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // TODO: Save to database (Firebase, PostgreSQL, etc.)

    return NextResponse.json({
      ok: true,
      bot,
      message: `Bot "${name}" created successfully`,
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Bot creation error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Bot creation failed",
      },
      { status: 500 },
    );
  }
}
