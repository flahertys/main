import { getLLMClient } from "@/lib/ai/hf-server";
import { buildTradeHaxPrompt } from "@/lib/ai/custom-llm/system-prompt";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { canConsumeFeature, consumeFeatureUsage } from "@/lib/monetization/engine";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type CustomAiRequest = {
  message?: string;
  context?: string;
  lane?: string;
  userId?: string;
};

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:custom",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as CustomAiRequest;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json(
        { ok: false, error: "message is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const userId = await resolveRequestUserId(request, body.userId);
    const allowance = canConsumeFeature(userId, "ai_chat", 1);
    if (!allowance.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: allowance.reason ?? "Usage limit reached.",
          allowance,
        },
        { status: 429, headers: rateLimit.headers },
      );
    }

    const prompt = buildTradeHaxPrompt({
      message,
      context: body.context,
      lane: body.lane,
    });

    const client = getLLMClient();
    const generated = await client.generate(prompt);

    try {
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: "BEHAVIOR",
        source: "ai_custom",
        userId,
        prompt: message,
        response: generated.text,
        metadata: {
          route: "/api/ai/custom",
          lane: body.lane ?? "general",
        },
        consent: {
          analytics: true,
          training: false,
        },
      });
    } catch (ingestionError) {
      console.warn("Custom AI ingestion skipped:", ingestionError);
    }

    consumeFeatureUsage(userId, "ai_chat", 1, "api:ai:custom", {
      lane: body.lane ?? "general",
    });

    return NextResponse.json(
      {
        ok: true,
        userId,
        response: generated.text,
        usage: {
          feature: "ai_chat",
          remainingToday: allowance.remainingToday,
        },
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Custom AI route error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown custom AI failure",
      },
      { status: 500 },
    );
  }
}
