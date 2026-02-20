import {
    getAcademyProgressForUser,
    upsertAcademyProgressForUser,
} from "@/lib/investor-academy/store";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "academy:progress:get",
    max: 80,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const requestedUserId = request.nextUrl.searchParams.get("userId");
  const userId = await resolveRequestUserId(request, requestedUserId);
  const snapshot = await getAcademyProgressForUser(userId);

  return NextResponse.json(
    {
      ok: true,
      snapshot,
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
    keyPrefix: "academy:progress:post",
    max: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = await request.json();
    const userId = await resolveRequestUserId(request, body?.userId);

    const snapshot = await upsertAcademyProgressForUser(userId, body?.snapshot);

    return NextResponse.json(
      {
        ok: true,
        snapshot,
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Investor academy progress update failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to update investor academy progress.",
      },
      { status: 500 },
    );
  }
}
