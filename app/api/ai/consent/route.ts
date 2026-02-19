import { getPersistedUserConsent, persistUserConsent } from "@/lib/ai/behavior-persistence";
import { getInMemoryConsent, setInMemoryConsent } from "@/lib/ai/consent";
import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function resolveUserIdFromRequest(request: NextRequest) {
  const queryValue = request.nextUrl.searchParams.get("userId");
  const headerValue = request.headers.get("x-tradehax-user-id");
  return sanitizePlainText(String(queryValue || headerValue || "anonymous"), 128).toLowerCase() || "anonymous";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:consent:get",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const userId = resolveUserIdFromRequest(request);
  const inMemory = getInMemoryConsent(userId);
  let persisted = null;
  try {
    persisted = await getPersistedUserConsent(inMemory.userId);
  } catch {
    persisted = null;
  }

  const consent = persisted
    ? {
        userId: persisted.user_key,
        analytics: persisted.analytics_consent,
        training: persisted.training_consent,
        updatedAt: persisted.updated_at,
      }
    : inMemory;

  return NextResponse.json(
    {
      ok: true,
      consent,
    },
    {
      headers: rateLimit.headers,
    },
  );
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:consent:post",
    max: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
      analytics?: boolean;
      training?: boolean;
    };

    const normalized = setInMemoryConsent({
      userId: body.userId,
      analytics: body.analytics,
      training: body.training,
    });

    try {
      await persistUserConsent({
        userKey: normalized.userId,
        analyticsConsent: normalized.analytics,
        trainingConsent: normalized.training,
        metadata: {
          route: "/api/ai/consent",
          source: "consent_center",
        },
      });
    } catch (error) {
      console.warn("consent persistence fallback", error);
    }

    return NextResponse.json(
      {
        ok: true,
        consent: normalized,
      },
      {
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    console.error("consent update error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to update consent.",
      },
      {
        status: 500,
      },
    );
  }
}
