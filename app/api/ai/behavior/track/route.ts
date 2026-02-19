import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type BehaviorTrackBody = {
  event?: string;
  userId?: string;
  prompt?: string;
  response?: string;
  source?: "ai_chat" | "ai_custom" | "ai_image" | "intelligence" | "discord" | "system" | "ai_navigator";
  metadata?: Record<string, unknown>;
  consent?: {
    analytics?: boolean;
    training?: boolean;
  };
};

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:behavior:track",
    max: 240,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as BehaviorTrackBody;
    const eventName = sanitizePlainText(String(body.event || ""), 120);
    const prompt = sanitizePlainText(String(body.prompt || eventName || "event"), 1000);
    const response = sanitizePlainText(String(body.response || "tracked"), 1000);

    if (!eventName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Event name is required.",
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    const result = await ingestBehavior({
      timestamp: new Date().toISOString(),
      category: "BEHAVIOR",
      source: body.source || "system",
      userId: body.userId || "anonymous",
      prompt,
      response,
      metadata: {
        event: eventName,
        ...body.metadata,
      },
      consent: {
        analytics: body.consent?.analytics !== false,
        training: body.consent?.training === true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        accepted: result.accepted,
      },
      {
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    console.error("behavior track error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to track behavior event.",
      },
      {
        status: 500,
      },
    );
  }
}
