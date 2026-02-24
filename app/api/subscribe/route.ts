import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type SubscribeBody = {
  email?: string;
  source?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  const normalized = value.toLowerCase();
  return normalized.length <= 254 && EMAIL_REGEX.test(normalized);
}

function normalizeSource(value: unknown) {
  if (typeof value !== "string") {
    return "unknown";
  }
  const cleaned = sanitizePlainText(value, 64).toLowerCase();
  return cleaned || "unknown";
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ success: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "newsletter:subscribe",
    max: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as SubscribeBody;
    const email = sanitizePlainText(String(body.email ?? ""), 254).toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
          code: "INVALID_EMAIL",
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const source = normalizeSource(body.source);

    console.info("[NEWSLETTER_SUBSCRIBE]", {
      email,
      source,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json(
      {
        success: true,
        ok: true,
        message: "Subscribed successfully",
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to subscribe",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
