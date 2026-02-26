/* -----------------------------------------------------------------------
 * <copyright company="Microsoft Corporation">
 *   Copyright (c) Microsoft Corporation.  All rights reserved.
 * </copyright>
 * ----------------------------------------------------------------------- */

import {
    BINANCE_MARKET_SOURCE,
    getLiveMarketItems,
    parseMarketSymbols,
} from "@/lib/ai/market-feed";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:market",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const symbols = parseMarketSymbols(request.nextUrl.searchParams.get("symbols"));

  try {
    const items = await getLiveMarketItems(symbols);

    return NextResponse.json(
      {
        ok: true,
        source: BINANCE_MARKET_SOURCE,
        transport: "http",
        items,
        symbols,
        generatedAt: new Date().toISOString(),
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "live_market_feed_unavailable",
        symbols,
      },
      { status: 502, headers: rateLimit.headers },
    );
  }
}
