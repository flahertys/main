import { dispatchTradebotSignalsToDiscord } from "@/lib/intelligence/discord-signals";
import { resolveRequestUserId } from "@/lib/monetization/identity";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType } from "@/lib/security";
import { generateTradebotSignalOutlooks } from "@/lib/trading/signal-outlook";
import { NextRequest, NextResponse } from "next/server";

type DiscordSignalRequest = {
  symbols?: string[];
  seed?: number;
  dispatch?: boolean;
};

function parseSymbols(value: unknown) {
  if (!Array.isArray(value)) return ["SOL/USDC", "BTC/USDC", "ETH/USDC"];

  const symbols = value
    .map((s) => String(s || "").trim().toUpperCase())
    .filter((s) => s.length > 0 && s.length <= 16)
    .slice(0, 8);

  return symbols.length > 0 ? symbols : ["SOL/USDC", "BTC/USDC", "ETH/USDC"];
}

function parseSeed(value: unknown) {
  const num = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(num) ? num : 101;
}

function parseDispatch(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "trading:signal:discord:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const search = request.nextUrl.searchParams;
  const symbols = parseSymbols(search.getAll("symbol").length > 0 ? search.getAll("symbol") : undefined);
  const seed = parseSeed(search.get("seed"));
  const shouldDispatch = parseDispatch(search.get("dispatch"));
  const userId = await resolveRequestUserId(request, search.get("userId"));

  const signals = generateTradebotSignalOutlooks({ symbols, seed });
  const dispatch = shouldDispatch
    ? await dispatchTradebotSignalsToDiscord({
        userId,
        signals,
      })
    : null;

  return NextResponse.json(
    {
      ok: true,
      userId,
      generatedAt: new Date().toISOString(),
      signals,
      dispatch,
    },
    { headers: rateLimit.headers },
  );
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "trading:signal:discord:post",
    max: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const body = (await request.json()) as DiscordSignalRequest;
  const symbols = parseSymbols(body.symbols);
  const seed = parseSeed(body.seed);
  const userId = await resolveRequestUserId(request, undefined);
  const dispatchRequested = body.dispatch !== false;

  const signals = generateTradebotSignalOutlooks({ symbols, seed });
  const dispatch = dispatchRequested
    ? await dispatchTradebotSignalsToDiscord({
        userId,
        signals,
      })
    : null;

  return NextResponse.json(
    {
      ok: true,
      userId,
      generatedAt: new Date().toISOString(),
      dispatchRequested,
      signals,
      dispatch,
    },
    { headers: rateLimit.headers },
  );
}
