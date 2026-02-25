import { getPredictionTelemetrySummary, resolvePredictionModel } from "@/lib/ai/prediction-routing";
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
  const dataset = readDatasetSummary();

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
