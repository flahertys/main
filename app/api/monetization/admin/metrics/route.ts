import { requireAdminAccess } from "@/lib/admin-access";
import { getMonetizationMetrics } from "@/lib/monetization/store";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "monetization:admin:metrics",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  return NextResponse.json(
    {
      ok: true,
      metrics: getMonetizationMetrics(),
    },
    { headers: rateLimit.headers },
  );
}
