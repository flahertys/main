import {
    getCreditSnapshot,
    listCreditPacks,
    purchaseCredits,
} from "@/lib/ai/credit-system";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function parsePackId(value: unknown) {
  if (value === "starter" || value === "pro" || value === "elite") {
    return value;
  }
  return null;
}

function parseProvider(value: unknown) {
  if (typeof value !== "string") {
    return "stripe";
  }
  const normalized = sanitizePlainText(value, 24).toLowerCase();
  return normalized || "stripe";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "monetization:ai-credits:get",
    max: 80,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const requestedUserId = request.nextUrl.searchParams.get("userId");
  const userId = await resolveRequestUserId(request, requestedUserId);

  return NextResponse.json(
    {
      ok: true,
      snapshot: await getCreditSnapshot(userId),
      packs: listCreditPacks(),
    },
    { headers: rateLimit.headers },
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
    keyPrefix: "monetization:ai-credits:post",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = await request.json();
    const userId = await resolveRequestUserId(request, body?.userId);
    const packId = parsePackId(body?.packId);
    const provider = parseProvider(body?.provider);

    if (!packId) {
      return NextResponse.json(
        { ok: false, error: "Invalid packId. Use starter, pro, or elite." },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const purchase = await purchaseCredits(userId, packId, provider);
    if (!purchase.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: purchase.error ?? "Unable to purchase credits.",
          snapshot: purchase.snapshot,
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        purchased: purchase.pack,
        balance: purchase.balance,
        snapshot: purchase.snapshot,
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("AI credit purchase failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to process credit purchase.",
      },
      { status: 500 },
    );
  }
}
