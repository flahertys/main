import {
  clearStoredPolicyPreference,
  getPolicyAnalytics,
  normalizePolicyProfileKey,
  setStoredPolicyPreference,
} from "@/lib/intelligence/probability-policy-store";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type PolicyMutationRequest = {
  action?: "set" | "clear";
  profileKey?: string;
  policy?: "conservative" | "balanced" | "aggressive";
};

function parseProfileKey(value: unknown) {
  return normalizePolicyProfileKey(sanitizePlainText(String(value || "default"), 64));
}

function parseStoredPolicy(value: unknown): "conservative" | "balanced" | "aggressive" {
  const normalized = sanitizePlainText(String(value || ""), 20).toLowerCase();
  if (normalized === "conservative" || normalized === "aggressive") {
    return normalized;
  }
  return "balanced";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:probability:policy:get",
    max: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const profileKey = parseProfileKey(request.nextUrl.searchParams.get("profileKey") || "default");
  return NextResponse.json(
    {
      ok: true,
      analytics: getPolicyAnalytics({ profileKey }),
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

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:probability:policy:post",
    max: 45,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as PolicyMutationRequest;
    const action = body.action || "set";
    const profileKey = parseProfileKey(body.profileKey || "default");

    if (action === "clear") {
      clearStoredPolicyPreference(profileKey);
      return NextResponse.json(
        {
          ok: true,
          action,
          analytics: getPolicyAnalytics({ profileKey }),
        },
        {
          headers: rateLimit.headers,
        },
      );
    }

    const policy = parseStoredPolicy(body.policy || "balanced");
    const preference = setStoredPolicyPreference({
      profileKey,
      policy,
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        preference,
        analytics: getPolicyAnalytics({ profileKey }),
      },
      {
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to update policy preference.",
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
