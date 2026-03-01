import { summarizeTelemetry } from "@/lib/ai/telemetry-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const windowMinutes = Number.parseInt(searchParams.get("windowMinutes") || "60", 10);
  const tier = searchParams.get("tier") || undefined;
  const sloProfile = (searchParams.get("sloProfile") as "latency" | "balanced" | "quality" | null) || undefined;
  const predictionDomain = searchParams.get("domain") || undefined;

  const summary = summarizeTelemetry({
    windowMinutes: Number.isFinite(windowMinutes) ? windowMinutes : 60,
    tier,
    sloProfile,
    predictionDomain,
  });

  return NextResponse.json({
    ok: true,
    summary,
  });
}
