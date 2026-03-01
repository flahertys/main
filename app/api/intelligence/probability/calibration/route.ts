import { requireAdminAccess } from "@/lib/admin-access";
import {
  getProbabilityCalibrationSummary,
  recordProbabilityOutcome,
} from "@/lib/intelligence/probability-calibration";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type OutcomeMutationRequest = {
  action?: "record_outcome";
  forecastId?: string;
  symbol?: string;
  horizon?: "scalp" | "intraday" | "swing";
  realizedDirection?: "long" | "short";
  realizedReturnPct?: number;
  realizedAt?: string;
};

function parseHorizon(value: unknown): "scalp" | "intraday" | "swing" {
  const normalized = sanitizePlainText(String(value || ""), 20).toLowerCase();
  if (normalized === "scalp" || normalized === "swing") {
    return normalized;
  }
  return "intraday";
}

function parseDirection(value: unknown): "long" | "short" {
  const normalized = sanitizePlainText(String(value || ""), 10).toLowerCase();
  return normalized === "short" ? "short" : "long";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:probability:calibration:get",
    max: 80,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  return NextResponse.json(
    {
      ok: true,
      calibration: getProbabilityCalibrationSummary(),
    },
    {
      headers: rateLimit.headers,
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
    keyPrefix: "intelligence:probability:calibration:post",
    max: 40,
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
    const body = (await request.json()) as OutcomeMutationRequest;
    const action = body.action || "record_outcome";

    if (action !== "record_outcome") {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported action.",
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const forecastId = sanitizePlainText(String(body.forecastId || ""), 120) || undefined;
    const symbol = sanitizePlainText(String(body.symbol || ""), 20).toUpperCase().replace(/[^A-Z0-9]/g, "") || undefined;
    if (!forecastId && !symbol) {
      return NextResponse.json(
        {
          ok: false,
          error: "forecastId or symbol is required.",
        },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const realized = recordProbabilityOutcome({
      forecastId,
      symbol,
      horizon: body.horizon ? parseHorizon(body.horizon) : undefined,
      realizedDirection: parseDirection(body.realizedDirection),
      realizedReturnPct:
        typeof body.realizedReturnPct === "number" && Number.isFinite(body.realizedReturnPct)
          ? body.realizedReturnPct
          : undefined,
      realizedAt: body.realizedAt,
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        resolved: {
          forecastId: realized.forecast.id,
          outcomeId: realized.outcome.id,
          symbol: realized.outcome.symbol,
          horizon: realized.outcome.horizon,
        },
        calibration: getProbabilityCalibrationSummary(),
      },
      {
        headers: {
          ...rateLimit.headers,
          "X-TradeHax-Admin-Mode": adminGate.access.mode || "unknown",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to record probability outcome.",
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
