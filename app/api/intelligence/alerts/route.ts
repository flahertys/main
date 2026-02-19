import {
  dispatchAlertsToDiscord,
  resolveDiscordRouteForTier,
} from "@/lib/intelligence/discord";
import { ingestBehavior } from "@/lib/ai/data-ingestion";
import {
  evaluateWatchlistAlerts,
  getWatchlistStorageStatus,
  listAlerts,
  markAlertsDeliveredToDiscord,
} from "@/lib/intelligence/watchlist-store";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { getSubscription } from "@/lib/monetization/store";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type AlertsMutationRequest = {
  userId?: string;
  evaluate?: boolean;
  dispatchToDiscord?: boolean;
  limit?: number;
};

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function parseLimit(value: unknown, fallback = 60) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(200, Math.max(1, Math.floor(value)));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.min(200, Math.max(1, parsed));
    }
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:alerts:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const search = request.nextUrl.searchParams;
  const userId = await resolveRequestUserId(request, search.get("userId"));
  const evaluate = parseBoolean(search.get("evaluate"));
  const limit = parseLimit(search.get("limit"), 60);
  const subscription = getSubscription(userId);
  const route = resolveDiscordRouteForTier(subscription.tier);

  const evaluation = evaluate ? await evaluateWatchlistAlerts(userId) : null;
  const alerts = evaluation ? evaluation.alerts.slice(0, limit) : await listAlerts(userId, limit);
  const storage = evaluation?.storage || (await getWatchlistStorageStatus());

  if (evaluation) {
    try {
      await ingestBehavior({
        timestamp: new Date().toISOString(),
        category: "INTELLIGENCE",
        source: "intelligence",
        userId,
        prompt: `ALERT_EVAL_GET user=${userId}`,
        response: `ALERT_EVAL_GET_OK newAlerts=${evaluation.newAlerts.length} total=${evaluation.alerts.length}`,
        metadata: {
          route: "/api/intelligence/alerts",
          method: "GET",
          evaluate: true,
          tier: subscription.tier,
          new_alerts: evaluation.newAlerts.length,
          returned_alerts: alerts.length,
        },
        consent: {
          analytics: true,
          training: false,
        },
      });
    } catch (ingestionError) {
      console.warn("Alerts GET ingestion skipped:", ingestionError);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      userId,
      tier: subscription.tier,
      generatedAt: new Date().toISOString(),
      newAlertsCount: evaluation ? evaluation.newAlerts.length : 0,
      alerts,
      discordRoute: {
        tier: subscription.tier,
        channelLabel: route?.channelLabel ?? "not-configured",
        viaFallback: route?.viaFallback ?? false,
        webhookConfigured: Boolean(route),
        defaultThreadId: process.env.TRADEHAX_DISCORD_DEFAULT_THREAD_ID || undefined,
      },
      storage,
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
    keyPrefix: "intelligence:alerts:post",
    max: 50,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const body = (await request.json()) as AlertsMutationRequest;
  const userId = await resolveRequestUserId(request, body.userId);
  const shouldEvaluate = body.evaluate !== false;
  const dispatchToDiscord = parseBoolean(body.dispatchToDiscord);
  const limit = parseLimit(body.limit, 60);
  const subscription = getSubscription(userId);

  const evaluation = shouldEvaluate ? await evaluateWatchlistAlerts(userId) : null;
  const alerts = evaluation ? evaluation.alerts : await listAlerts(userId, limit);
  const newAlerts = evaluation?.newAlerts ?? [];
  const alertsForDispatch = newAlerts.length > 0 ? newAlerts : alerts.slice(0, 12);

  let dispatchResult: Awaited<ReturnType<typeof dispatchAlertsToDiscord>> | null = null;

  if (dispatchToDiscord) {
    dispatchResult = await dispatchAlertsToDiscord({
      userId,
      tier: subscription.tier,
      alerts: alertsForDispatch,
    });

    if (dispatchResult.ok && alertsForDispatch.length > 0) {
      await markAlertsDeliveredToDiscord(
        userId,
        alertsForDispatch.map((alert) => alert.id),
        dispatchResult.deliveredAt,
      );
    }
  }

  try {
    await ingestBehavior({
      timestamp: new Date().toISOString(),
      category: "INTELLIGENCE",
      source: "intelligence",
      userId,
      prompt: `ALERT_EVAL_POST user=${userId}`,
      response: dispatchToDiscord
        ? `ALERT_EVAL_POST_OK newAlerts=${newAlerts.length} dispatchOk=${Boolean(dispatchResult?.ok)} delivered=${dispatchResult?.deliveredCount || 0}`
        : `ALERT_EVAL_POST_OK newAlerts=${newAlerts.length} dispatchSkipped=true`,
      metadata: {
        route: "/api/intelligence/alerts",
        method: "POST",
        evaluate: shouldEvaluate,
        tier: subscription.tier,
        new_alerts: newAlerts.length,
        returned_alerts: alerts.length,
        dispatch_to_discord: dispatchToDiscord,
        dispatch_ok: dispatchResult?.ok ?? false,
        dispatch_delivered: dispatchResult?.deliveredCount ?? 0,
      },
      consent: {
        analytics: true,
        training: false,
      },
    });
  } catch (ingestionError) {
    console.warn("Alerts POST ingestion skipped:", ingestionError);
  }

  return NextResponse.json(
    {
      ok: true,
      userId,
      tier: subscription.tier,
      generatedAt: new Date().toISOString(),
      newAlertsCount: newAlerts.length,
      alerts: await listAlerts(userId, limit),
      dispatch: dispatchResult,
      storage: evaluation?.storage || (await getWatchlistStorageStatus()),
    },
    { headers: rateLimit.headers },
  );
}
