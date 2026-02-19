import { requireAdminAccess } from "@/lib/admin-access";
import {
  exportFineTuningJsonl,
  getBehaviorIngestionSummary,
  getBehaviorProfiles,
} from "@/lib/ai/data-ingestion";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function parseBoolean(value: string | null, fallback = false) {
  if (value === null) return fallback;
  return value === "1" || value === "true" || value === "yes";
}

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

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:admin:dataset",
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

  const search = request.nextUrl.searchParams;
  const outputFormat = search.get("format") === "jsonl" ? "jsonl" : "json";
  const windowMinutes = parseInteger(search.get("windowMinutes"), 1_440, 5, 10_080);
  const profileLimit = parseInteger(search.get("profileLimit"), 50, 1, 500);
  const maxRows = parseInteger(search.get("maxRows"), 5_000, 10, 25_000);
  const includeProfiles = parseBoolean(search.get("includeProfiles"), true);
  const includeBootstrap = parseBoolean(search.get("includeBootstrap"), true);
  const includeDataset = parseBoolean(search.get("includeDataset"), outputFormat === "jsonl");

  const summary = getBehaviorIngestionSummary(windowMinutes);
  const profiles = includeProfiles ? getBehaviorProfiles(profileLimit) : [];
  const dataset = includeDataset
    ? exportFineTuningJsonl({
        includeBootstrap,
        maxRows,
      })
    : "";
  const datasetRows = dataset
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;

  const sharedHeaders = {
    ...rateLimit.headers,
    "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
  };

  if (outputFormat === "jsonl") {
    return new NextResponse(dataset, {
      status: 200,
      headers: {
        ...sharedHeaders,
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": "attachment; filename=tradehax-training.jsonl",
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      adminMode: adminGate.access.mode,
      summary,
      profiles,
      datasetRows,
      datasetPreview: includeDataset ? dataset.split(/\r?\n/).slice(0, 5) : [],
    },
    {
      headers: sharedHeaders,
    },
  );
}
