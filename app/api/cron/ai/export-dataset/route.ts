import { persistTrainingExport } from "@/lib/ai/behavior-persistence";
import { exportFineTuningJsonl } from "@/lib/ai/data-ingestion";
import { exportSiteNavigationDatasetJsonl } from "@/lib/ai/site-dataset";
import { NextRequest, NextResponse } from "next/server";

function isAuthorizedCronRequest(request: NextRequest) {
  const expected = String(process.env.TRADEHAX_CRON_SECRET || "").trim();
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const vercelCron = request.headers.get("x-vercel-cron");

  if (expected && bearer === expected) {
    return true;
  }
  if (vercelCron === "1") {
    return true;
  }
  return false;
}

function countRows(jsonl: string) {
  if (!jsonl.trim()) return 0;
  return jsonl
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized cron request.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const behaviorJsonl = exportFineTuningJsonl({
      includeBootstrap: true,
      maxRows: 15_000,
    });
    const siteJsonl = exportSiteNavigationDatasetJsonl();
    const combinedJsonl = [behaviorJsonl, siteJsonl].filter(Boolean).join("\n");

    const behaviorRows = countRows(behaviorJsonl);
    const siteRows = countRows(siteJsonl);
    const totalRows = countRows(combinedJsonl);

    const persisted = await persistTrainingExport({
      source: "daily_cron",
      rows: totalRows,
      payloadJsonl: combinedJsonl,
      metadata: {
        route: "/api/cron/ai/export-dataset",
        trigger: "vercel_cron",
        behavior_rows: behaviorRows,
        site_rows: siteRows,
      },
    });

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      rows: {
        total: totalRows,
        behavior: behaviorRows,
        site: siteRows,
      },
      persisted,
    });
  } catch (error) {
    console.error("cron dataset export error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to run dataset export.",
      },
      {
        status: 500,
      },
    );
  }
}
