import { requireAdminAccessWithSession } from "@/lib/admin-access";
import { getOwnerUserId } from "@/lib/admin-config";
import {
    getBehaviorIngestionSummary,
    ingestBehavior,
} from "@/lib/ai/data-ingestion";
import {
    getTradingBehaviorProfile,
    recordTradingOutcome,
    upsertTradingBehaviorProfile,
} from "@/lib/ai/trading-personalization";
import {
    getPersonalAssistantVault,
    updatePersonalAssistantVault,
} from "@/lib/intelligence/personal-assistant-vault";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function buildInsights(input: {
  winRate: number;
  avgPnlPercent: number;
  confidenceAvg: number;
  acceptedEvents: number;
  trainingEligibleEvents: number;
  droppedNoConsent: number;
}) {
  const notes: string[] = [];

  if (input.acceptedEvents < 50) {
    notes.push("Increase event capture cadence. Aim for 50+ labeled events/week for better personalization signal.");
  }

  if (input.trainingEligibleEvents < Math.max(10, Math.floor(input.acceptedEvents * 0.35))) {
    notes.push("Training consent coverage is low. Route more high-quality events with training consent enabled.");
  }

  if (input.winRate < 0.45) {
    notes.push("Win-rate is under 45%. Reduce position size and tighten invalidation conditions until stability returns.");
  } else if (input.winRate > 0.6 && input.avgPnlPercent > 0.8) {
    notes.push("Edge is positive. Consider scaling only A+ setups while preserving fixed max daily drawdown.");
  }

  if (input.confidenceAvg < 0.5) {
    notes.push("Decision confidence is low. Add pre-trade checklist gating to filter marginal entries.");
  }

  if (input.droppedNoConsent > 0) {
    notes.push("Some events were dropped for consent. Ensure upstream webhooks include analytics consent flags.");
  }

  if (notes.length === 0) {
    notes.push("System healthy. Keep collecting macro + micro context and run weekly review snapshots.");
  }

  return notes;
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "admin:personal-assistant:get",
    max: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const adminGate = await requireAdminAccessWithSession(request, rateLimit.headers);
  if (adminGate.response) return adminGate.response;

  const userId = await resolveRequestUserId(request, getOwnerUserId());
  const profile = getTradingBehaviorProfile(userId);
  const vault = await getPersonalAssistantVault(userId);
  const ingestion = getBehaviorIngestionSummary(7 * 24 * 60);

  const winRate = profile.tradesTracked > 0 ? profile.wins / profile.tradesTracked : 0;
  const insights = buildInsights({
    winRate,
    avgPnlPercent: profile.avgPnlPercent,
    confidenceAvg: profile.confidenceAvg,
    acceptedEvents: ingestion.acceptedEvents,
    trainingEligibleEvents: ingestion.trainingEligibleEvents,
    droppedNoConsent: ingestion.droppedNoConsent,
  });

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      userId,
      vault,
      profile,
      ingestion,
      insights,
    },
    { headers: rateLimit.headers },
  );
}

export async function PUT(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "admin:personal-assistant:put",
    max: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const adminGate = await requireAdminAccessWithSession(request, rateLimit.headers);
  if (adminGate.response) return adminGate.response;

  const body = (await request.json()) as {
    displayName?: string;
    strategyNotes?: string;
    preferredSymbols?: string[];
    preferredTimeframes?: string[];
    macroWatchlist?: string[];
    dataSources?: string[];
    riskProfile?: "conservative" | "balanced" | "aggressive";
    manualOutcome?: {
      symbol?: string;
      regime?: "bull" | "bear" | "sideways" | "volatile" | "macro_shock";
      side?: "long" | "short";
      pnlPercent?: number;
      confidence?: number;
      indicatorsUsed?: Array<"rsi" | "volume" | "bollinger_bands" | "macd" | "vwap" | "moon_cycles">;
      notes?: string;
    };
  };

  const userId = await resolveRequestUserId(request, getOwnerUserId());

  const vault = await updatePersonalAssistantVault(
    userId,
    {
      displayName: body.displayName,
      strategyNotes: body.strategyNotes,
      preferredSymbols: body.preferredSymbols,
      preferredTimeframes: body.preferredTimeframes,
      macroWatchlist: body.macroWatchlist,
      dataSources: body.dataSources,
    },
    "manual",
  );

  if (body.riskProfile) {
    upsertTradingBehaviorProfile({
      userId,
      riskProfile: body.riskProfile,
      preferredTimeframes: body.preferredTimeframes,
      favoriteSymbols: body.preferredSymbols,
      notes: body.strategyNotes,
    });
  }

  if (body.manualOutcome && body.manualOutcome.symbol) {
    const pnl = Number(body.manualOutcome.pnlPercent ?? 0);
    const confidence = Number(body.manualOutcome.confidence ?? 0.5);

    recordTradingOutcome({
      userId,
      symbol: sanitizePlainText(String(body.manualOutcome.symbol || ""), 16).toUpperCase() || "UNKNOWN",
      regime: body.manualOutcome.regime || "sideways",
      side: body.manualOutcome.side === "short" ? "short" : "long",
      pnlPercent: Number.isFinite(pnl) ? pnl : 0,
      confidence: Number.isFinite(confidence) ? confidence : 0.5,
      indicatorsUsed: Array.isArray(body.manualOutcome.indicatorsUsed)
        ? body.manualOutcome.indicatorsUsed
        : [],
      notes: body.manualOutcome.notes,
    });

    await ingestBehavior({
      timestamp: new Date().toISOString(),
      category: "MARKET",
      source: "system",
      userId,
      prompt: `MANUAL_OUTCOME ${String(body.manualOutcome.symbol || "")}`,
      response: `side=${body.manualOutcome.side || "long"}; pnl=${Number.isFinite(pnl) ? pnl.toFixed(2) : "0.00"}`,
      metadata: {
        route: "/api/admin/personal-assistant",
        regime: String(body.manualOutcome.regime || "sideways"),
      },
      consent: {
        analytics: true,
        training: true,
      },
    });
  }

  const profile = getTradingBehaviorProfile(userId);

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      userId,
      vault,
      profile,
    },
    { headers: rateLimit.headers },
  );
}
