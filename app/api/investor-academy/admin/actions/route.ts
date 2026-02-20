import { requireAdminAccess } from "@/lib/admin-access";
import {
    clearAcademyMemoryCache,
    getAcademyAdminActionReplay,
    getAcademyReplayEnablementGuide,
    getAcademyReplayHealthStats,
    getAcademyReplayReadinessChecklist,
    getAcademyReplaySloStatus,
    listAcademyReplayPurgeEvents,
    purgeExpiredAcademyAdminReplay,
    recomputeAcademyStreakForUser,
    recordAcademyAdminAudit,
    rememberAcademyAdminActionReplay,
    resetAcademyDailyQuestForUser,
    runAcademyReplayCriticalDrill,
    runAcademySeasonPayout,
} from "@/lib/investor-academy/store";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type AdminAction =
  | "reset-quest"
  | "recompute-streak"
  | "clear-memory"
  | "purge-replay-expired"
  | "simulate-critical-drill"
  | "prepare-enablement"
  | "run-season-payout";

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "academy:admin:actions",
    max: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const adminGate = requireAdminAccess(request, rateLimit.headers);
  if (adminGate.response) {
    return adminGate.response;
  }

  try {
    const body = await request.json();
    const action = String(body?.action || "") as AdminAction;
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const season = String(body?.season || "weekly").toLowerCase();
    const dryRun = body?.dryRun !== false;
    const idempotencyKey = String(request.headers.get("x-idempotency-key") || "").trim();
    const requestIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const adminMode = adminGate.access.mode || "none";

    if (idempotencyKey.length > 220) {
      return NextResponse.json(
        {
          ok: false,
          error: "x-idempotency-key is too long.",
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    if (idempotencyKey) {
      const replay = await getAcademyAdminActionReplay(idempotencyKey);
      if (replay) {
        const replayHeaders = {
          ...rateLimit.headers,
          "x-tradehax-idempotency-replayed": "1",
        };
        return NextResponse.json(
          {
            ...replay.responseBody,
            replayed: true,
            replayedAt: new Date().toISOString(),
          },
          { status: replay.status, headers: replayHeaders },
        );
      }
    }

    if (action === "reset-quest") {
      if (!userId.trim()) {
        return NextResponse.json({ ok: false, error: "userId is required for reset-quest." }, { status: 400 });
      }

      const snapshot = await resetAcademyDailyQuestForUser(userId);
      const payload = { ok: true, action, snapshot };
      await recordAcademyAdminAudit({
        action,
        targetUserId: userId,
        adminMode,
        requestIp,
        note: idempotencyKey ? `Daily quest reset [idem:${idempotencyKey.slice(0, 24)}]` : "Daily quest reset",
      });
      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: userId,
          status: 200,
          responseBody: payload,
        });
      }
      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    if (action === "recompute-streak") {
      if (!userId.trim()) {
        return NextResponse.json({ ok: false, error: "userId is required for recompute-streak." }, { status: 400 });
      }

      const snapshot = await recomputeAcademyStreakForUser(userId);
      const payload = { ok: true, action, snapshot };
      await recordAcademyAdminAudit({
        action,
        targetUserId: userId,
        adminMode,
        requestIp,
        note: idempotencyKey ? `Streak recompute [idem:${idempotencyKey.slice(0, 24)}]` : "Streak recompute",
      });
      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: userId,
          status: 200,
          responseBody: payload,
        });
      }
      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    if (action === "clear-memory") {
      const result = clearAcademyMemoryCache(userId.trim() ? userId : undefined);
      const payload = { ok: true, action, result };
      await recordAcademyAdminAudit({
        action,
        targetUserId: userId.trim() ? userId : null,
        adminMode,
        requestIp,
        note: idempotencyKey
          ? `Cleared ${result.scope} cache (${result.clearedCount}) [idem:${idempotencyKey.slice(0, 24)}]`
          : `Cleared ${result.scope} cache (${result.clearedCount})`,
      });
      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: userId.trim() ? userId : null,
          status: 200,
          responseBody: payload,
        });
      }
      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    if (action === "purge-replay-expired") {
      const result = await purgeExpiredAcademyAdminReplay();
      const payload = { ok: true, action, result };
      await recordAcademyAdminAudit({
        action,
        targetUserId: null,
        adminMode,
        requestIp,
        note: `Replay purge deleted=${result.deletedCount} mode=${result.mode}`,
      });
      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: null,
          status: 200,
          responseBody: payload,
        });
      }
      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    if (action === "simulate-critical-drill") {
      const result = await runAcademyReplayCriticalDrill();
      const payload = {
        ok: true,
        action,
        result,
        message: result.reason,
      };
      await recordAcademyAdminAudit({
        action,
        targetUserId: null,
        adminMode,
        requestIp,
        note: `Drill simulated critical SLO; wouldTrigger=${result.wouldTrigger} estimatedDeleted=${result.estimatedDeletedCount}`,
      });
      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: null,
          status: 200,
          responseBody: payload,
        });
      }
      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    if (action === "prepare-enablement") {
      const [replayStats, replayPurges, drill] = await Promise.all([
        getAcademyReplayHealthStats(),
        listAcademyReplayPurgeEvents(12),
        runAcademyReplayCriticalDrill(),
      ]);
      const replaySlo = getAcademyReplaySloStatus(replayStats, replayPurges);
      const replayReadiness = await getAcademyReplayReadinessChecklist({
        slo: replaySlo,
        autoRemediation: {
          enabled: drill.enabled,
          triggered: false,
          cooldownMinutes: drill.cooldownMinutes,
          reason: drill.reason,
          lastTriggeredAt: drill.lastTriggeredAt,
        },
        replayPurges,
      });
      const replayEnablement = getAcademyReplayEnablementGuide({
        readiness: replayReadiness,
        slo: replaySlo,
        stats: replayStats,
        replayPurges,
        autoRemediation: {
          enabled: drill.enabled,
          triggered: false,
          cooldownMinutes: drill.cooldownMinutes,
          reason: drill.reason,
          lastTriggeredAt: drill.lastTriggeredAt,
        },
        drill,
      });

      const payload = {
        ok: true,
        action,
        replayStats,
        replaySlo,
        replayReadiness,
        replayEnablement,
        drill,
        message: replayEnablement.summary,
      };
      await recordAcademyAdminAudit({
        action,
        targetUserId: null,
        adminMode,
        requestIp,
        note: `Enablement assistant blockers=${replayEnablement.blockers} warnings=${replayEnablement.warnings}`,
      });
      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: null,
          status: 200,
          responseBody: payload,
        });
      }
      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    if (action === "run-season-payout") {
      if (season !== "daily" && season !== "weekly") {
        return NextResponse.json(
          { ok: false, error: "season must be either 'daily' or 'weekly' for payout runs." },
          { status: 400, headers: rateLimit.headers },
        );
      }

      const result = await runAcademySeasonPayout({
        season,
        dryRun,
      });

      const payload = {
        ok: true,
        action,
        season,
        dryRun,
        result,
        message: dryRun
          ? `Dry run complete for ${season} payout. Candidates=${result.dryRunCount}, already paid=${result.alreadyCreditedCount}.`
          : `Season payout complete for ${season}. Credited ${result.creditedCount} users for ${result.totalCreditedHax} HAX.`,
      };

      await recordAcademyAdminAudit({
        action,
        targetUserId: null,
        adminMode,
        requestIp,
        note: `${season} payout dryRun=${dryRun} credited=${result.creditedCount} already=${result.alreadyCreditedCount} totalHax=${result.totalCreditedHax}`,
      });

      if (idempotencyKey) {
        await rememberAcademyAdminActionReplay({
          key: idempotencyKey,
          action,
          targetUserId: null,
          status: 200,
          responseBody: payload,
        });
      }

      return NextResponse.json(payload, { headers: rateLimit.headers });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Invalid action. Use reset-quest, recompute-streak, clear-memory, purge-replay-expired, simulate-critical-drill, prepare-enablement, or run-season-payout.",
      },
      { status: 400, headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("Investor academy admin action failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to complete academy admin action.",
      },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
