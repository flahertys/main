import type { ArtifactCollectionEvent } from "@/lib/game/level-types";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isFiniteNumberInRange,
  isIsoDateString,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextResponse } from "next/server";

const SAFE_ID_REGEX = /^[a-zA-Z0-9._:-]{1,128}$/;
const SAFE_COLLECTION_REGEX = /^[a-zA-Z0-9._:/-]{1,160}$/;

function isSafeId(value: string) {
  return SAFE_ID_REGEX.test(value);
}

function endpointMatchesRequest(claimEndpoint: string, request: Request) {
  const requestUrl = new URL(request.url);
  if (claimEndpoint.startsWith("/")) {
    return claimEndpoint === requestUrl.pathname;
  }

  try {
    const parsed = new URL(claimEndpoint);
    return parsed.origin === requestUrl.origin && parsed.pathname === requestUrl.pathname;
  } catch {
    return false;
  }
}

function isArtifactCollectionEvent(value: unknown, request: Request): value is ArtifactCollectionEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ArtifactCollectionEvent>;

  const utilityFieldsValid =
    (event.utilityPointsDelta === undefined ||
      isFiniteNumberInRange(event.utilityPointsDelta, -50_000, 50_000)) &&
    (event.utilityPointsAfterEvent === undefined ||
      isFiniteNumberInRange(event.utilityPointsAfterEvent, 0, 5_000_000)) &&
    (event.utilityTokenBonusUnits === undefined ||
      isFiniteNumberInRange(event.utilityTokenBonusUnits, 0, 5_000_000)) &&
    (typeof event.lockedAtPickup === "boolean" || event.lockedAtPickup === undefined);

  return (
    typeof event.eventId === "string" &&
    isSafeId(event.eventId) &&
    typeof event.sessionId === "string" &&
    isSafeId(event.sessionId) &&
    typeof event.levelId === "string" &&
    isSafeId(event.levelId) &&
    typeof event.artifactId === "string" &&
    isSafeId(event.artifactId) &&
    typeof event.artifactName === "string" &&
    sanitizePlainText(event.artifactName, 96).length > 0 &&
    (event.pantheon === "norse" || event.pantheon === "celtic") &&
    (event.rarity === "common" ||
      event.rarity === "rare" ||
      event.rarity === "epic" ||
      event.rarity === "mythic") &&
    isFiniteNumberInRange(event.playerScore, 0, 5_000_000) &&
    isFiniteNumberInRange(event.combo, 0, 2_000) &&
    isFiniteNumberInRange(event.tokenRewardUnits, 0, 250_000) &&
    typeof event.claimEndpoint === "string" &&
    endpointMatchesRequest(event.claimEndpoint, request) &&
    typeof event.web5Collection === "string" &&
    SAFE_COLLECTION_REGEX.test(event.web5Collection) &&
    isIsoDateString(event.collectedAt) &&
    utilityFieldsValid
  );
}

function withBaseHeaders(extraHeaders?: HeadersInit) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(extraHeaders ?? {}),
  };
}

function errorResponse(status: number, error: string, extraHeaders?: HeadersInit) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    {
      status,
      headers: withBaseHeaders(extraHeaders),
    },
  );
}

export async function POST(request: Request) {
  const rate = enforceRateLimit(request, {
    keyPrefix: "api:game:claim:post",
    max: 35,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rate.response;

  const blockedOriginResponse = enforceTrustedOrigin(request);
  if (blockedOriginResponse) return blockedOriginResponse;

  if (!isJsonContentType(request)) {
    return errorResponse(415, "Expected application/json payload.", rate.headers);
  }

  try {
    const payload = await request.json();
    if (!isArtifactCollectionEvent(payload, request)) {
      return errorResponse(400, "Invalid artifact claim payload.", rate.headers);
    }

    const claimId = `claim-${crypto.randomUUID()}`;
    return NextResponse.json(
      {
        ok: true,
        claimId,
        queuedAt: new Date().toISOString(),
        settlement: {
          status: "queued",
          mode: "web5-preclaim",
          networkHint: "l2-staging",
        },
        claimRecord: {
          levelId: payload.levelId,
          artifactId: payload.artifactId,
          tokenUnits: payload.tokenRewardUnits,
          utilityPointsDelta: payload.utilityPointsDelta ?? 0,
          utilityPointsAfterEvent: payload.utilityPointsAfterEvent ?? null,
          utilityTokenBonusUnits: payload.utilityTokenBonusUnits ?? 0,
          lockedAtPickup: payload.lockedAtPickup ?? false,
          collection: payload.web5Collection,
        },
      },
      { headers: withBaseHeaders(rate.headers) },
    );
  } catch {
    return errorResponse(500, "Unable to process artifact claim payload.", rate.headers);
  }
}
