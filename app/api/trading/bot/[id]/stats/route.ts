/**
 * GET /api/trading/bot/[id]/stats
 * Get bot statistics and performance
 */

import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

interface BotStats {
  totalTrades: number;
  successfulTrades: number;
  winRate: string;
  totalProfit: string;
  totalLoss: string;
  netProfit: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "trading:bot:stats:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const { id: botId } = await params;
    const sanitizedBotId = sanitizePlainText(botId || "", 64).replace(/[^a-zA-Z0-9_-]/g, "");

    if (!sanitizedBotId) {
      return NextResponse.json(
        { ok: false, error: "Bot ID is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // TODO: Fetch bot stats from database
    const stats: BotStats = {
      totalTrades: 42,
      successfulTrades: 35,
      winRate: "83.33",
      totalProfit: "2.45",
      totalLoss: "0.48",
      netProfit: "1.97",
    };

    return NextResponse.json({
      ok: true,
      botId: sanitizedBotId,
      stats,
      lastUpdated: new Date().toISOString(),
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Stats fetch failed",
      },
      { status: 500 },
    );
  }
}
