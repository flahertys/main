import {
    AcademyLeaderboardSeason,
    getAcademyEconomySnapshotForUser,
    listAcademyLeaderboard,
} from "@/lib/investor-academy/store";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "academy:leaderboard:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number.isFinite(Number(limitParam)) ? Number(limitParam) : 12;
  const seasonParam = String(request.nextUrl.searchParams.get("season") || "all_time").toLowerCase();
  const season: AcademyLeaderboardSeason =
    seasonParam === "daily" || seasonParam === "weekly" ? seasonParam : "all_time";
  const requestedUserId = request.nextUrl.searchParams.get("userId") || undefined;
  const userId = await resolveRequestUserId(request, requestedUserId);

  const [leaderboard, economy] = await Promise.all([
    listAcademyLeaderboard(limit, season),
    getAcademyEconomySnapshotForUser(userId),
  ]);

  return NextResponse.json(
    {
      ok: true,
      season,
      leaderboard,
      economy,
      generatedAt: new Date().toISOString(),
    },
    { headers: rateLimit.headers },
  );
}
