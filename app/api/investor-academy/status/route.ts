import { getAcademyStorageStatus } from "@/lib/investor-academy/store";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "academy:status:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const status = await getAcademyStorageStatus();

  return NextResponse.json(
    {
      ok: true,
      status,
    },
    { headers: rateLimit.headers },
  );
}
