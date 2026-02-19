import { ensureLiveIngestion, getLiveIngestionStatus } from "@/lib/intelligence/live-ingestion";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:live:status",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  ensureLiveIngestion();

  return NextResponse.json(
    {
      ok: true,
      live: getLiveIngestionStatus(),
    },
    { headers: rateLimit.headers },
  );
}
