import { requireAdminAccess } from "@/lib/admin-access";
import {
    getAcademyReplayEnablementGuide,
    getAcademyReplayHealthStats,
    getAcademyReplayReadinessChecklist,
    getAcademyReplaySloStatus,
    getAcademySeasonPayoutOutcomeSummary,
    getAcademyStorageStatus,
    listAcademyAdminAuditLogs,
    listAcademyProgressSamples,
    listAcademyReplayPurgeEvents,
    listAcademySeasonPayoutHistory,
    maybeAutoPurgeAcademyReplayOnCritical,
} from "@/lib/investor-academy/store";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "academy:admin:overview",
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

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number.isFinite(Number(limitParam)) ? Number(limitParam) : 12;

  let [status, samples, auditLogs, replayStats, replayPurges, payoutHistory, payoutSummary] = await Promise.all([
    getAcademyStorageStatus(),
    listAcademyProgressSamples(limit),
    listAcademyAdminAuditLogs(Math.max(10, Math.min(50, limit))),
    getAcademyReplayHealthStats(),
    listAcademyReplayPurgeEvents(Math.max(8, Math.min(30, limit))),
    listAcademySeasonPayoutHistory(Math.max(6, Math.min(30, limit))),
    getAcademySeasonPayoutOutcomeSummary(),
  ]);

  let replaySlo = getAcademyReplaySloStatus(replayStats, replayPurges);
  const replayAutoRemediation = await maybeAutoPurgeAcademyReplayOnCritical({
    slo: replaySlo,
  });

  if (replayAutoRemediation.triggered) {
    [replayStats, replayPurges] = await Promise.all([
      getAcademyReplayHealthStats(),
      listAcademyReplayPurgeEvents(Math.max(8, Math.min(30, limit))),
    ]);
    replaySlo = getAcademyReplaySloStatus(replayStats, replayPurges);
  }

  const replayReadiness = await getAcademyReplayReadinessChecklist({
    slo: replaySlo,
    autoRemediation: replayAutoRemediation,
    replayPurges,
  });

  const replayEnablement = getAcademyReplayEnablementGuide({
    readiness: replayReadiness,
    slo: replaySlo,
    stats: replayStats,
    replayPurges,
    autoRemediation: replayAutoRemediation,
    drill: null,
  });

  return NextResponse.json(
    {
      ok: true,
      status,
      samples,
      auditLogs,
      replayStats,
      replayPurges,
      payoutHistory,
      payoutSummary,
      replaySlo,
      replayAutoRemediation,
      replayReadiness,
      replayEnablement,
      adminMode: adminGate.access.mode,
    },
    { headers: rateLimit.headers },
  );
}
