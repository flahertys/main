import { requireAdminAccess } from "@/lib/admin-access";
import { listCreditLedgerEntries } from "@/lib/ai/credit-system";
import { enforceRateLimit, enforceTrustedOrigin, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function parseLimit(value: string | null) {
  if (!value || value.trim().length === 0) {
    return 100;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.max(1, Math.min(500, parsed));
}

function parseUserId(value: string | null) {
  if (!value || value.trim().length === 0) {
    return "";
  }

  return sanitizePlainText(value, 80).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "monetization:admin:ai-credits-ledger",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  const search = request.nextUrl.searchParams;
  const limit = parseLimit(search.get("limit"));
  const userId = parseUserId(search.get("userId"));

  const entries = await listCreditLedgerEntries({
    userId: userId || undefined,
    limit,
  });

  const summary = entries.reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.eventType === "purchase") {
        acc.purchases += 1;
        acc.creditsPurchased += entry.credits ?? 0;
      } else {
        acc.spends += 1;
        acc.creditsSpent += entry.credits ?? 0;
      }
      return acc;
    },
    {
      total: 0,
      purchases: 0,
      spends: 0,
      creditsPurchased: 0,
      creditsSpent: 0,
    },
  );

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      generatedAt: new Date().toISOString(),
      filters: {
        userId: userId || null,
        limit,
      },
      summary,
      entries,
    },
    {
      headers: {
        ...rateLimit.headers,
        "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
      },
    },
  );
}
