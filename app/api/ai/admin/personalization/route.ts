import { requireAdminAccess } from "@/lib/admin-access";
import { listTradingBehaviorProfiles } from "@/lib/ai/trading-personalization";
import {
    getTrainingPersistenceStatus,
    listPersistedTradingBehaviorProfiles,
} from "@/lib/ai/training-persistence";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function computeSummary(
  profiles: {
    userId: string;
    tradesTracked: number;
    wins: number;
    avgPnlPercent: number;
    confidenceAvg: number;
    favoriteIndicators: Record<string, number>;
  }[],
) {
  const profileCount = profiles.length;
  const totalTrades = profiles.reduce((acc, profile) => acc + profile.tradesTracked, 0);
  const totalWins = profiles.reduce((acc, profile) => acc + profile.wins, 0);
  const avgPnlPercent =
    profileCount > 0
      ? Number.parseFloat((profiles.reduce((acc, profile) => acc + profile.avgPnlPercent, 0) / profileCount).toFixed(4))
      : 0;
  const avgConfidence =
    profileCount > 0
      ? Number.parseFloat((profiles.reduce((acc, profile) => acc + profile.confidenceAvg, 0) / profileCount).toFixed(4))
      : 0;
  const winRate = totalTrades > 0 ? Number.parseFloat((totalWins / totalTrades).toFixed(4)) : 0;

  const indicatorTotals: Record<string, number> = {};
  for (const profile of profiles) {
    for (const [indicator, weight] of Object.entries(profile.favoriteIndicators || {})) {
      indicatorTotals[indicator] = (indicatorTotals[indicator] || 0) + weight;
    }
  }

  const topIndicators = Object.entries(indicatorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({
      label,
      value: Number.parseFloat(value.toFixed(4)),
    }));

  const userLiftEstimate = Number.parseFloat((winRate - 0.5 + avgPnlPercent / 100).toFixed(4));

  return {
    profileCount,
    totalTrades,
    winRate,
    avgPnlPercent,
    avgConfidence,
    userLiftEstimate,
    topIndicators,
  };
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:personalization:get",
    max: 45,
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
  const limit = parseInteger(search.get("limit"), 120, 1, 1000);
  const persisted = await listPersistedTradingBehaviorProfiles(limit);
  const profiles = persisted.length > 0 ? persisted : listTradingBehaviorProfiles(limit);

  const compactProfiles = profiles.map((profile) => ({
    userId: profile.userId,
    tradesTracked: profile.tradesTracked,
    wins: profile.wins,
    losses: profile.losses,
    avgPnlPercent: profile.avgPnlPercent,
    confidenceAvg: profile.confidenceAvg,
    riskProfile: profile.riskProfile,
    favoriteIndicators: profile.favoriteIndicators,
    favoriteSymbols: profile.favoriteSymbols,
    updatedAt: profile.updatedAt,
  }));

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      summary: computeSummary(compactProfiles),
      profiles: compactProfiles,
      persistence: await getTrainingPersistenceStatus(),
    },
    {
      headers: {
        ...rateLimit.headers,
        "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
      },
    },
  );
}
