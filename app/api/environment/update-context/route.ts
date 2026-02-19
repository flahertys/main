/**
 * POST /api/environment/update-context
 * Update market data and context for smart environment
 */

import { ingestBehavior } from "@/lib/ai/data-ingestion";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isFiniteNumberInRange,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

interface ContextUpdateRequest {
  sessionId: string;
  marketData?: {
    symbol: string;
    price: number;
    change24h: number;
  }[];
  interaction?: {
    prompt: string;
    response: string;
  };
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
    keyPrefix: "environment:update-context:post",
    max: 50,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: ContextUpdateRequest = await request.json();
    const sessionId = sanitizePlainText(String(body.sessionId || ""), 96);

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "sessionId is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const marketData = Array.isArray(body.marketData)
      ? body.marketData
          .map((item) => {
            const symbol = sanitizePlainText(String(item?.symbol || ""), 24).toUpperCase();
            if (
              !symbol ||
              !isFiniteNumberInRange(item?.price, 0, 10_000_000) ||
              !isFiniteNumberInRange(item?.change24h, -1_000, 1_000)
            ) {
              return null;
            }
            return {
              symbol,
              price: Number(item.price),
              change24h: Number(item.change24h),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .slice(0, 40)
      : [];

    const interaction =
      body.interaction &&
      typeof body.interaction === "object" &&
      typeof body.interaction.prompt === "string" &&
      typeof body.interaction.response === "string"
        ? {
            prompt: sanitizePlainText(body.interaction.prompt, 1_500),
            response: sanitizePlainText(body.interaction.response, 1_500),
          }
        : null;

    if (interaction && interaction.prompt && interaction.response) {
      try {
        await ingestBehavior({
          timestamp: new Date().toISOString(),
          category: "BEHAVIOR",
          source: "system",
          prompt: interaction.prompt,
          response: interaction.response,
          metadata: {
            route: "/api/environment/update-context",
            session_id: sessionId,
          },
          consent: {
            analytics: true,
            training: false,
          },
        });
      } catch (ingestionError) {
        console.warn("Environment interaction ingestion skipped:", ingestionError);
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      updated: {
        marketData: marketData.length,
        interactions: interaction ? 1 : 0,
      },
      timestamp: new Date().toISOString(),
    }, { headers: rateLimit.headers });
  } catch (error) {
    console.error("Context update error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 },
    );
  }
}
