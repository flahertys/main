import { chargeAcademyFeatureUsage } from "@/lib/investor-academy/store";
import { canConsumeFeature, consumeFeatureUsage, getUserSnapshot } from "@/lib/monetization/engine";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { UsageFeature } from "@/lib/monetization/types";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

const usageFeatures: UsageFeature[] = ["ai_chat", "hax_runner", "signal_alert", "bot_create"];

function isUsageFeature(value: unknown): value is UsageFeature {
  return typeof value === "string" && usageFeatures.includes(value as UsageFeature);
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
    keyPrefix: "monetization:usage:track",
    max: 100,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = await request.json();
    if (!isUsageFeature(body?.feature)) {
      return NextResponse.json(
        { ok: false, error: "Invalid usage feature." },
        { status: 400 },
      );
    }

    const units =
      typeof body?.units === "number" && Number.isFinite(body.units)
        ? Math.max(1, Math.floor(body.units))
        : 1;
    const source = typeof body?.source === "string" ? body.source.slice(0, 64) : "manual_track";
    const userId = await resolveRequestUserId(request, body?.userId);
    const idempotencyKey = String(request.headers.get("x-idempotency-key") || "").trim();

    const allowance = canConsumeFeature(userId, body.feature, units);
    if (!allowance.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: allowance.reason ?? "Usage limit exceeded.",
          allowance,
          snapshot: getUserSnapshot(userId),
        },
        { status: 429, headers: rateLimit.headers },
      );
    }

    const charge = await chargeAcademyFeatureUsage({
      userId,
      feature: body.feature,
      units,
      source,
      transactionRef: idempotencyKey || undefined,
    });
    if (!charge.charged) {
      return NextResponse.json(
        {
          ok: false,
          error: charge.reason ?? "Unable to debit HAX wallet for feature usage.",
          allowance,
          economy: charge.balance,
          snapshot: getUserSnapshot(userId),
        },
        { status: 402, headers: rateLimit.headers },
      );
    }

    consumeFeatureUsage(userId, body.feature, units, source, {
      academyLedgerId: charge.entry?.id || "",
      academyTransactionRef: charge.entry?.transactionRef || "",
    });

    return NextResponse.json(
      {
        ok: true,
        allowance,
        economy: charge.balance,
        charge,
        snapshot: getUserSnapshot(userId),
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Usage tracking failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to track usage." },
      { status: 500 },
    );
  }
}
