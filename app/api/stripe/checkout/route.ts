import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "stripe:checkout",
    max: 80,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const base = request.nextUrl.clone();
  base.pathname = "/billing";
  base.searchParams.set("provider", "stripe");
  base.searchParams.set("tier", "pro");
  return NextResponse.redirect(base, {
    status: 307,
    headers: rateLimit.headers,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
