import {
    getTradingBehaviorProfile,
    hydrateTradingBehaviorProfile,
    recordTradingOutcome,
    upsertTradingBehaviorProfile,
} from "@/lib/ai/trading-personalization";
import {
    getPersistedTradingBehaviorProfile,
    getTrainingPersistenceStatus,
    persistTradeOutcome,
    persistTradingBehaviorProfile,
} from "@/lib/ai/training-persistence";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type PersonalizationMutationRequest = {
  action?: "profile" | "trade_outcome";
  userId?: string;
  riskProfile?: "conservative" | "balanced" | "aggressive";
  preferredTimeframes?: string[];
  favoriteSymbols?: string[];
  favoriteIndicators?: Partial<
    Record<"rsi" | "volume" | "bollinger_bands" | "macd" | "vwap" | "moon_cycles", number>
  >;
  notes?: string;
  trade?: {
    symbol?: string;
    regime?: "bull" | "bear" | "sideways" | "volatile" | "macro_shock";
    side?: "long" | "short";
    pnlPercent?: number;
    confidence?: number;
    indicatorsUsed?: ("rsi" | "volume" | "bollinger_bands" | "macd" | "vwap" | "moon_cycles")[];
    notes?: string;
  };
};

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:personalization:get",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const userId = await resolveRequestUserId(
    request,
    request.nextUrl.searchParams.get("userId") || undefined,
  );
  const profile = getTradingBehaviorProfile(userId);
  let persistedProfile = null;
  try {
    persistedProfile = await getPersistedTradingBehaviorProfile(userId);
  } catch {
    persistedProfile = null;
  }

  const resolvedProfile = persistedProfile ? hydrateTradingBehaviorProfile(persistedProfile) : profile;

  return NextResponse.json(
    {
      ok: true,
      userId,
      profile: resolvedProfile,
      persistence: await getTrainingPersistenceStatus(),
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
    keyPrefix: "ai:personalization:post",
    max: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as PersonalizationMutationRequest;
    const userId = await resolveRequestUserId(request, body.userId);
    const action = body.action || "profile";

    if (action === "trade_outcome") {
      if (!body.trade || typeof body.trade !== "object") {
        return NextResponse.json(
          {
            ok: false,
            error: "Trade payload is required for trade_outcome action.",
          },
          { status: 400, headers: rateLimit.headers },
        );
      }

      const result = recordTradingOutcome({
        userId,
        symbol: sanitizePlainText(String(body.trade.symbol || ""), 16),
        regime: body.trade.regime || "sideways",
        side: body.trade.side === "short" ? "short" : "long",
        pnlPercent: typeof body.trade.pnlPercent === "number" ? body.trade.pnlPercent : 0,
        confidence: typeof body.trade.confidence === "number" ? body.trade.confidence : 0.5,
        indicatorsUsed: Array.isArray(body.trade.indicatorsUsed) ? body.trade.indicatorsUsed : [],
        notes: body.trade.notes,
      });

      let persistedOutcome: {
        persisted: boolean;
        mode: "memory" | "supabase";
        reason?: string;
        id?: string;
      } = { persisted: false, mode: "memory" };
      let persistedProfile: {
        persisted: boolean;
        mode: "memory" | "supabase";
        reason?: string;
        id?: string;
      } = { persisted: false, mode: "memory" };
      try {
        persistedOutcome = await persistTradeOutcome(userId, result.outcome);
        persistedProfile = await persistTradingBehaviorProfile(result.profile);
      } catch (error) {
        console.warn("trade outcome persistence fallback", error);
      }

      return NextResponse.json(
        {
          ok: true,
          userId,
          action,
          outcome: result.outcome,
          profile: result.profile,
          persistedOutcome,
          persistedProfile,
          persistence: await getTrainingPersistenceStatus(),
        },
        { headers: rateLimit.headers },
      );
    }

    const updated = upsertTradingBehaviorProfile({
      userId,
      riskProfile: body.riskProfile,
      preferredTimeframes: Array.isArray(body.preferredTimeframes) ? body.preferredTimeframes : undefined,
      favoriteSymbols: Array.isArray(body.favoriteSymbols) ? body.favoriteSymbols : undefined,
      favoriteIndicators: body.favoriteIndicators,
      notes: body.notes,
    });

    let persistedProfile: {
      persisted: boolean;
      mode: "memory" | "supabase";
      reason?: string;
      id?: string;
    } = { persisted: false, mode: "memory" };
    try {
      persistedProfile = await persistTradingBehaviorProfile(updated);
    } catch (error) {
      console.warn("profile persistence fallback", error);
    }

    return NextResponse.json(
      {
        ok: true,
        userId,
        action,
        profile: updated,
        persistedProfile,
        persistence: await getTrainingPersistenceStatus(),
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    console.error("personalization post error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to update personalization profile.",
      },
      {
        status: 500,
      },
    );
  }
}
