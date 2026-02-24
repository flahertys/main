import { dispatchTradebotSignalsToDiscord, resolveCadenceTiers } from "@/lib/intelligence/discord-signals";
import { buildDailyWatchlist } from "@/lib/trading/daily-watchlist";
import { resolveSignalCadenceWindow } from "@/lib/trading/signal-cadence";
import { generateTradebotSignalOutlooks } from "@/lib/trading/signal-outlook";
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

function parseSymbols(search: URLSearchParams) {
  const values = search.getAll("symbol").map((value) => value.trim().toUpperCase()).filter(Boolean);
  return values.length > 0 ? values.slice(0, 8) : ["SOL/USDC", "BTC/USDC", "ETH/USDC", "NVDA", "SPY"];
}

function parseSeed(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : 201;
}

function parseDryRun(value: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams;
  const dryRun = parseDryRun(search.get("dryRun"));
  const cadenceWindow = resolveSignalCadenceWindow({
    forcedWindow: search.get("window") || undefined,
  });

  if (cadenceWindow.window === "offhours") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Off-hours or no cadence window matched.",
      cadenceWindow,
      generatedAt: new Date().toISOString(),
    });
  }

  const symbols = parseSymbols(search);
  const seed = parseSeed(search.get("seed"));
  const signals = generateTradebotSignalOutlooks({ symbols, seed: seed + cadenceWindow.window.length });

  let dailyWatchlist = null;
  if (cadenceWindow.window === "premarket" || search.get("buildWatchlist") === "1") {
    dailyWatchlist = await buildDailyWatchlist({
      userId: process.env.TRADEHAX_SIGNAL_DAILY_WATCHLIST_USER || "market_daily_watchlist",
      maxEquities: 10,
      maxCrypto: 6,
    });
  }

  const tiers = resolveCadenceTiers();

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      generatedAt: new Date().toISOString(),
      cadenceWindow,
      tiers,
      signalsCount: signals.length,
      dispatchSummary: {
        okCount: 0,
        failCount: 0,
        skipped: true,
        reason: "Dry run mode enabled. No Discord webhooks were called.",
        results: [],
      },
      dailyWatchlist,
    });
  }

  const dispatchResults: Array<{
    ok: boolean;
    deliveredAt: string;
    deliveredCount: number;
    webhookConfigured: boolean;
    channelLabel: string;
    error?: string;
    tier?: "free" | "basic" | "pro" | "elite";
    cadenceWindow?: string;
  }> = [];

  for (const tier of tiers) {
    const result = await dispatchTradebotSignalsToDiscord({
      userId: `cadence_${tier}`,
      tier,
      cadenceWindow: cadenceWindow.window,
      signals,
    });
    dispatchResults.push(result);
  }

  const okCount = dispatchResults.filter((item) => item.ok).length;

  return NextResponse.json({
    ok: okCount > 0,
    generatedAt: new Date().toISOString(),
    cadenceWindow,
    tiers,
    signalsCount: signals.length,
    dispatchSummary: {
      okCount,
      failCount: dispatchResults.length - okCount,
      results: dispatchResults,
    },
    dailyWatchlist,
  });
}
