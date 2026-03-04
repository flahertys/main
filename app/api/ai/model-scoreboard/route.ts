import { getAccuracyGovernorSummary } from "@/lib/ai/accuracy-governor";
import { getAdaptiveRoutingMemorySummary } from "@/lib/ai/adaptive-routing-memory";
import { getComplexProblemPlannerSummary } from "@/lib/ai/complex-problem-planner";
import { resolvePersonalizedIntelligenceContext } from "@/lib/ai/individualized-intelligence";
import {
    getPersonalizedTrajectorySnapshot,
    getPersonalizedTrajectorySystemSummary,
} from "@/lib/ai/personalized-trajectory-memory";
import {
    getPredictionRoutingGovernanceSummary,
    getPredictionTelemetrySummary,
    resolvePredictionModel,
} from "@/lib/ai/prediction-routing";
import { getAdversarialVerifierSummary } from "@/lib/ai/response-verifier";
import { getRetrainExportQueueSummary } from "@/lib/ai/retrain-export-queue";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type DatasetSummary = {
  categoryDistribution?: Record<string, number>;
  integrity?: {
    trainFileSha256?: string;
    algorithm?: string;
    externalDatasetDirUsed?: boolean;
  };
};

function readDatasetSummary(): DatasetSummary | null {
  const summaryPath = path.join(process.cwd(), "data", "custom-llm", "summary.json");
  if (!fs.existsSync(summaryPath)) return null;

  try {
    const raw = fs.readFileSync(summaryPath, "utf8");
    return JSON.parse(raw) as DatasetSummary;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:model-scoreboard:get",
    max: 90,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const telemetry = getPredictionTelemetrySummary();
  const governance = getPredictionRoutingGovernanceSummary();
  const adaptiveMemory = await getAdaptiveRoutingMemorySummary();
  const trajectory = await getPersonalizedTrajectorySystemSummary();
  const complexityPlanner = getComplexProblemPlannerSummary();
  const accuracyGovernor = getAccuracyGovernorSummary();
  const adversarialVerifier = getAdversarialVerifierSummary();
  const retrainExportQueue = await getRetrainExportQueueSummary();
  const dataset = readDatasetSummary();
  const includePersonalization =
    String(request.nextUrl.searchParams.get("includePersonalization") || "").toLowerCase() === "true";

  let individualized = null;
  let userTrajectory = null;
  if (includePersonalization) {
    const userId = await resolveRequestUserId(request, request.nextUrl.searchParams.get("userId") || undefined);
    individualized = await resolvePersonalizedIntelligenceContext({
      userId,
      domain: "general",
      requestedSlo: "balanced",
    });
    userTrajectory = await getPersonalizedTrajectorySnapshot({
      userId,
      horizonHours: 72,
    });
  }

  const recommendations = {
    stock: resolvePredictionModel("stock"),
    crypto: resolvePredictionModel("crypto"),
    kalshi: resolvePredictionModel("kalshi"),
    general: resolvePredictionModel("general"),
  };

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      telemetry,
      governance,
      adaptiveMemory,
      trajectory,
      complexityPlanner,
      accuracyGovernor,
      adversarialVerifier,
      retrainExportQueue,
      individualized,
      userTrajectory,
      recommendations,
      dataIntegrity: {
        algorithm: dataset?.integrity?.algorithm || "unknown",
        trainFileSha256: dataset?.integrity?.trainFileSha256 || null,
        externalDatasets: Boolean(dataset?.integrity?.externalDatasetDirUsed),
      },
    },
    { headers: rateLimit.headers },
  );
}
