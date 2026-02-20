import { requireAdminAccess } from "@/lib/admin-access";
import {
    composeTrainingBenchmarkSnapshot,
    getTrainingBenchmarkSnapshot,
    hydrateTrainingBenchmarkStages,
    upsertTrainingBenchmarkStage,
} from "@/lib/ai/training-benchmarks";
import {
    getTrainingPersistenceStatus,
    listPersistedTrainingBenchmarkStages,
    persistTrainingBenchmarkStages,
} from "@/lib/ai/training-persistence";
import {
    enforceRateLimit,
    enforceTrustedOrigin,
    isJsonContentType,
    sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type BenchmarkMutationRequest = {
  stageId?:
    | "dataset_quality"
    | "regime_coverage"
    | "response_quality"
    | "execution_safety"
    | "personalization_lift"
    | "web5_game_integration"
    | "live_chart_readiness";
  score?: number;
  notes?: string;
  metrics?: {
    name?: string;
    value?: number;
    target?: number;
  }[];
};

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:benchmarks:get",
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

  const persistedStages = await listPersistedTrainingBenchmarkStages();
  const snapshot = persistedStages.length > 0
    ? composeTrainingBenchmarkSnapshot(persistedStages)
    : getTrainingBenchmarkSnapshot();

  if (persistedStages.length > 0) {
    hydrateTrainingBenchmarkStages(persistedStages);
  }

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      snapshot,
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

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }
  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:benchmarks:post",
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

  try {
    const body = (await request.json()) as BenchmarkMutationRequest;
    if (!body.stageId) {
      return NextResponse.json(
        {
          ok: false,
          error: "stageId is required.",
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const persistedStages = await listPersistedTrainingBenchmarkStages();
    if (persistedStages.length > 0) {
      hydrateTrainingBenchmarkStages(persistedStages);
    }

    const updated = upsertTrainingBenchmarkStage({
      stageId: body.stageId,
      score: typeof body.score === "number" ? body.score : undefined,
      notes: typeof body.notes === "string" ? sanitizePlainText(body.notes, 320) : undefined,
      metrics: Array.isArray(body.metrics)
        ? body.metrics.map((metric) => ({
            name: sanitizePlainText(String(metric.name || ""), 80),
            value: typeof metric.value === "number" ? metric.value : 0,
            target: typeof metric.target === "number" ? metric.target : undefined,
          }))
        : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unknown benchmark stage.",
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    let persisted: {
      persisted: boolean;
      mode: "memory" | "supabase";
      reason?: string;
      rows?: number;
    } = { persisted: false, mode: "memory" };
    try {
      persisted = await persistTrainingBenchmarkStages([updated]);
    } catch (error) {
      console.warn("benchmark persistence fallback", error);
    }

    const snapshot = getTrainingBenchmarkSnapshot();

    return NextResponse.json(
      {
        ok: true,
        adminMode: adminGate.access.mode,
        updated,
        snapshot,
        persisted,
        persistence: await getTrainingPersistenceStatus(),
      },
      {
        headers: {
          ...rateLimit.headers,
          "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
        },
      },
    );
  } catch (error) {
    console.error("benchmark update error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to update benchmark stage.",
      },
      {
        status: 500,
      },
    );
  }
}
