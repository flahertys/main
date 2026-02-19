import { getIntelligenceSlaMetrics } from "@/lib/intelligence/metrics";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function parseWindowMinutes(value: string | null) {
  if (!value) return 60;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 60;
  return Math.min(24 * 60, Math.max(5, parsed));
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:metrics",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const windowMinutes = parseWindowMinutes(request.nextUrl.searchParams.get("windowMinutes"));

  return NextResponse.json(
    {
      ok: true,
      metrics: getIntelligenceSlaMetrics(windowMinutes),
    },
    { headers: rateLimit.headers },
  );
}
