import {
  clearAutoSelectorPreset,
  listAutoPolicySwitchEvents,
  normalizePolicyProfileKey,
  resolveAutoSelectorConfig,
  resetAutoPolicySelector,
  setAutoSelectorPreset,
  type AutoSelectorPreset,
} from "@/lib/intelligence/probability-policy-store";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type SwitchesMutationRequest = {
  action?: "reset" | "preset";
  profileKey?: string;
  horizon?: "scalp" | "intraday" | "swing" | "global";
  clearEvents?: boolean;
  preset?: AutoSelectorPreset;
  clearPreset?: boolean;
};

function parseProfileKey(value: unknown) {
  return normalizePolicyProfileKey(sanitizePlainText(String(value || "default"), 64));
}

function parseHorizon(value: unknown): "scalp" | "intraday" | "swing" | undefined {
  const normalized = sanitizePlainText(String(value || ""), 24).toLowerCase();
  if (normalized === "scalp" || normalized === "intraday" || normalized === "swing") {
    return normalized;
  }
  return undefined;
}

function parseConfigHorizon(value: unknown): "scalp" | "intraday" | "swing" | "global" | undefined {
  const normalized = sanitizePlainText(String(value || ""), 24).toLowerCase();
  if (normalized === "scalp" || normalized === "intraday" || normalized === "swing" || normalized === "global") {
    return normalized;
  }
  return undefined;
}

function parsePreset(value: unknown): AutoSelectorPreset {
  const normalized = sanitizePlainText(String(value || ""), 24).toLowerCase();
  if (normalized === "stabilize" || normalized === "discovery" || normalized === "scalp_tight" || normalized === "swing_stable") {
    return normalized;
  }
  return "balanced";
}

function parseLimit(value: unknown) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return 40;
  return Math.min(200, Math.max(1, parsed));
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:probability:policy:switches:get",
    max: 90,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const search = request.nextUrl.searchParams;
  const profileKey = parseProfileKey(search.get("profileKey") || "default");
  const horizon = parseHorizon(search.get("horizon"));
  const limit = parseLimit(search.get("limit"));

  return NextResponse.json(
    {
      ok: true,
      profileKey,
      horizon: horizon || "all",
      events: listAutoPolicySwitchEvents({
        profileKey,
        horizon,
        limit,
      }),
      config: resolveAutoSelectorConfig({
        profileKey,
        horizon: horizon || "intraday",
      }),
      generatedAt: new Date().toISOString(),
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
    keyPrefix: "intelligence:probability:policy:switches:post",
    max: 45,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body = (await request.json()) as SwitchesMutationRequest;
    const action = body.action || "reset";

    const profileKey = parseProfileKey(body.profileKey || "default");
    const horizon = parseHorizon(body.horizon);

    if (action === "preset") {
      const configHorizon = parseConfigHorizon(body.horizon) || "global";
      if (body.clearPreset) {
        clearAutoSelectorPreset({ profileKey, horizon: configHorizon });
      } else {
        setAutoSelectorPreset({
          profileKey,
          horizon: configHorizon,
          preset: parsePreset(body.preset),
        });
      }

      return NextResponse.json(
        {
          ok: true,
          action,
          config: resolveAutoSelectorConfig({
            profileKey,
            horizon: configHorizon === "global" ? "intraday" : configHorizon,
          }),
          events: listAutoPolicySwitchEvents({
            profileKey,
            horizon,
            limit: 18,
          }),
        },
        {
          headers: rateLimit.headers,
        },
      );
    }

    if (action !== "reset") {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported action. Expected 'reset' or 'preset'.",
        },
        {
          status: 400,
          headers: rateLimit.headers,
        },
      );
    }

    const result = resetAutoPolicySelector({
      profileKey,
      horizon,
      clearEvents: Boolean(body.clearEvents),
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        reset: result,
        events: listAutoPolicySwitchEvents({
          profileKey,
          horizon,
          limit: 18,
        }),
        config: resolveAutoSelectorConfig({
          profileKey,
          horizon: horizon || "intraday",
        }),
      },
      {
        headers: rateLimit.headers,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to reset selector state.",
      },
      {
        status: 500,
        headers: rateLimit.headers,
      },
    );
  }
}
