/**
 * GET /api/environment/context
 * Get current environment context (market data, AI system prompt, etc.)
 */

import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "environment:context:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const sessionId = sanitizePlainText(request.nextUrl.searchParams.get("sessionId") || "", 80);

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "sessionId query parameter is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    // TODO: Fetch actual environment context
    const context = {
      sessionId,
      user: {
        experience: "intermediate",
        riskTolerance: "moderate",
        portfolio: {
          totalAssets: 50.5,
          allocation: {
            SOL: 40,
            USDC: 35,
            RAY: 20,
            OTHER: 5,
          },
        },
      },
      marketData: {
        SOL: { price: 145.23, change24h: 5.2 },
        USDC: { price: 1.0, change24h: 0.01 },
        RAY: { price: 8.45, change24h: 3.1 },
        BTC: { price: 42150.0, change24h: 2.8 },
        ETH: { price: 2250.75, change24h: 1.5 },
      },
      activeBots: ["bot-scalping-01", "bot-swing-02"],
      recentSignals: [
        { symbol: "SOL/USDC", action: "buy", confidence: 0.85 },
        { symbol: "RAY/USDC", action: "hold", confidence: 0.72 },
      ],
      systemPrompt: `You are TradeHax AI Assistant specialized in Solana trading. User is intermediate trader with moderate risk tolerance. Help with trading decisions, bot management, and market analysis. Reference recent market data and signals in responses.`,
    };

    return NextResponse.json({
      ok: true,
      context,
      timestamp: new Date().toISOString(),
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Context fetch error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Fetch failed",
      },
      { status: 500 },
    );
  }
}
