import {
    getPredictionRoutingGovernanceSummary,
    getPredictionRoutingOverrides,
    setPredictionRoutingOverride,
    type DomainRoutingOverrideMode,
    type PredictionDomain,
} from "@/lib/ai/prediction-routing";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type OverrideBody = {
  domain?: PredictionDomain | "all";
  mode?: DomainRoutingOverrideMode;
};

function isAuthorized(request: NextRequest) {
  const expected = String(process.env.TRADEHAX_ADMIN_KEY || "").trim();
  if (!expected) {
    return false;
  }

  const auth = request.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return bearer === expected;
}

function isDomain(value: unknown): value is PredictionDomain {
  return value === "stock" || value === "crypto" || value === "kalshi" || value === "general";
}

function isDomainOrAll(value: unknown): value is PredictionDomain | "all" {
  return value === "all" || isDomain(value);
}

function isMode(value: unknown): value is DomainRoutingOverrideMode {
  return value === "auto" || value === "stable" || value === "canary";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:model-scoreboard:override:get",
    max: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Admin authorization required.",
      },
      { status: 401, headers: rateLimit.headers },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      overrides: getPredictionRoutingOverrides(),
      governance: getPredictionRoutingGovernanceSummary(),
    },
    { headers: rateLimit.headers },
  );
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:model-scoreboard:override:post",
    max: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Admin authorization required.",
      },
      { status: 401, headers: rateLimit.headers },
    );
  }

  let body: OverrideBody;
  try {
    body = (await request.json()) as OverrideBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      { status: 400, headers: rateLimit.headers },
    );
  }

  if (!isDomainOrAll(body.domain) || !isMode(body.mode)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_INPUT",
        message: "Expected domain in [all, stock, crypto, kalshi, general] and mode in [auto, stable, canary].",
      },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const domains: PredictionDomain[] = ["stock", "crypto", "kalshi", "general"];
  const appliedDomains = body.domain === "all" ? domains : [body.domain];

  for (const domain of appliedDomains) {
    setPredictionRoutingOverride({ domain, mode: body.mode });
  }

  return NextResponse.json(
    {
      ok: true,
      domain: body.domain,
      appliedDomains,
      mode: body.mode,
      overrides: getPredictionRoutingOverrides(),
      governance: getPredictionRoutingGovernanceSummary(),
    },
    { headers: rateLimit.headers },
  );
}
