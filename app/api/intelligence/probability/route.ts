import {
  buildProbabilityScenario,
  buildTopProbabilitySetups,
  type ProbabilityPolicyProfile,
} from "@/lib/intelligence/probability-engine";
import {
  normalizePolicyProfileKey,
  recordPolicyDecision,
  resolvePolicyPreference,
  setStoredPolicyPreference,
} from "@/lib/intelligence/probability-policy-store";
import { getProbabilityCalibrationSummary } from "@/lib/intelligence/probability-calibration";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

function normalizeSymbol(value: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

function parseHorizon(value: string | null): "scalp" | "intraday" | "swing" {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "scalp" || normalized === "swing") {
    return normalized;
  }
  return "intraday";
}

function parseAssetType(value: string | null): "equity" | "crypto" | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "equity" || normalized === "crypto") {
    return normalized;
  }
  return undefined;
}

function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parsePolicy(value: string | null): ProbabilityPolicyProfile | undefined {
  if (value == null) return undefined;
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "conservative" || normalized === "balanced" || normalized === "aggressive") {
    return normalized;
  }
  return "auto";
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:probability",
    max: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const search = request.nextUrl.searchParams;
    const symbol = normalizeSymbol(search.get("symbol"));
    const horizon = parseHorizon(search.get("horizon"));
    const assetType = parseAssetType(search.get("assetType"));
    const top = search.get("top") === "1" || search.get("top") === "true";
    const limit = parseInteger(search.get("limit"), 6, 1, 12);
    const diagnostics = search.get("diagnostics") === "1" || search.get("diagnostics") === "true";
    const explicitPolicy = parsePolicy(search.get("policy"));
    const policyProfileKey = normalizePolicyProfileKey(search.get("policyProfile") || "default");
    const persistPolicy = search.get("persistPolicy") === "1" || search.get("persistPolicy") === "true";
    const resolution = resolvePolicyPreference({
      profileKey: policyProfileKey,
      explicitPolicy,
    });
    const policy = resolution.policy;

    if (persistPolicy && explicitPolicy && explicitPolicy !== "auto") {
      setStoredPolicyPreference({
        profileKey: policyProfileKey,
        policy: explicitPolicy,
      });
    }

    if (top || !symbol) {
      const setups = await buildTopProbabilitySetups({
        horizon,
        limit,
        policy,
        profileKey: policyProfileKey,
      });

      for (const setup of setups) {
        recordPolicyDecision({
          profileKey: policyProfileKey,
          requested: setup.policy.requested,
          applied: setup.policy.applied,
          symbol: setup.symbol,
          horizon: setup.horizon,
          confidence: setup.confidence,
          bias: setup.bias,
          impactDelta: setup.policy.impactDelta,
          forecastId: setup.forecastId,
          generatedAt: setup.generatedAt,
        });
      }

      return NextResponse.json(
        {
          ok: true,
          mode: "top_setups",
          horizon,
          policy,
          policySource: resolution.source,
          policyProfile: policyProfileKey,
          count: setups.length,
          items: setups,
          diagnostics: diagnostics ? getProbabilityCalibrationSummary() : undefined,
          generatedAt: new Date().toISOString(),
        },
        { headers: rateLimit.headers },
      );
    }

    const scenario = await buildProbabilityScenario({
      symbol,
      horizon,
      assetType,
      policy,
      profileKey: policyProfileKey,
    });

    recordPolicyDecision({
      profileKey: policyProfileKey,
      requested: scenario.policy.requested,
      applied: scenario.policy.applied,
      symbol: scenario.symbol,
      horizon: scenario.horizon,
      confidence: scenario.confidence,
      bias: scenario.bias,
      impactDelta: scenario.policy.impactDelta,
      forecastId: scenario.forecastId,
      generatedAt: scenario.generatedAt,
    });

    return NextResponse.json(
      {
        ok: true,
        mode: "single_symbol",
        policy,
        policySource: resolution.source,
        policyProfile: policyProfileKey,
        scenario,
        diagnostics: diagnostics ? getProbabilityCalibrationSummary() : undefined,
        generatedAt: new Date().toISOString(),
      },
      { headers: rateLimit.headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to compute probability scenario.",
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
