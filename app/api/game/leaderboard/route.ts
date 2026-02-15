import type {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardSubmission,
} from "@/lib/game/leaderboard-types";
import { isLeaderboardSubmission } from "@/lib/game/leaderboard-types";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isFiniteNumberInRange,
  isIsoDateString,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextResponse } from "next/server";

const MAX_ENTRIES = 100;
const MAX_SEEN_SESSION_KEYS = 2_000;
const SAFE_ID_REGEX = /^[a-zA-Z0-9._:-]{1,128}$/;
const SAFE_WALLET_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;

const SCORE_BOUNDS = {
  score: { min: 0, max: 5_000_000 },
  combo: { min: 0, max: 2_000 },
  coinsCollected: { min: 0, max: 100_000 },
  runesActivated: { min: 0, max: 50_000 },
  relicsCollected: { min: 0, max: 25_000 },
  coinPoints: { min: 0, max: 5_000_000 },
  runePoints: { min: 0, max: 5_000_000 },
  relicPoints: { min: 0, max: 5_000_000 },
  explorationPoints: { min: 0, max: 5_000_000 },
  utilityPoints: { min: 0, max: 5_000_000 },
  projectedTokenUnits: { min: 0, max: 5_000_000 },
} as const;

type LeaderboardStore = {
  entries: LeaderboardEntry[];
  seenSessionKeys: Set<string>;
};

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_LEADERBOARD_STORE__?: LeaderboardStore;
  };
  if (!globalRef.__TRADEHAX_LEADERBOARD_STORE__) {
    globalRef.__TRADEHAX_LEADERBOARD_STORE__ = {
      entries: [],
      seenSessionKeys: new Set<string>(),
    };
  }
  return globalRef.__TRADEHAX_LEADERBOARD_STORE__;
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

function sanitizeDisplayName(value: string) {
  const sanitized = sanitizePlainText(value, 32);
  return sanitized.length > 0 ? sanitized : "Guest";
}

function isSafeId(value: string) {
  return value.length <= 128 && SAFE_ID_REGEX.test(value);
}

function sanitizeOptionalId(value: string | undefined, maxLength = 128) {
  if (!value) return undefined;
  const sanitized = sanitizePlainText(value, maxLength);
  return sanitized.length > 0 ? sanitized : undefined;
}

function isScorePayloadInBounds(payload: LeaderboardSubmission) {
  const { run } = payload;
  return (
    isFiniteNumberInRange(run.score, SCORE_BOUNDS.score.min, SCORE_BOUNDS.score.max) &&
    isFiniteNumberInRange(run.combo, SCORE_BOUNDS.combo.min, SCORE_BOUNDS.combo.max) &&
    isFiniteNumberInRange(
      run.coinsCollected,
      SCORE_BOUNDS.coinsCollected.min,
      SCORE_BOUNDS.coinsCollected.max,
    ) &&
    isFiniteNumberInRange(
      run.runesActivated,
      SCORE_BOUNDS.runesActivated.min,
      SCORE_BOUNDS.runesActivated.max,
    ) &&
    isFiniteNumberInRange(
      run.relicsCollected,
      SCORE_BOUNDS.relicsCollected.min,
      SCORE_BOUNDS.relicsCollected.max,
    ) &&
    isFiniteNumberInRange(run.coinPoints, SCORE_BOUNDS.coinPoints.min, SCORE_BOUNDS.coinPoints.max) &&
    isFiniteNumberInRange(run.runePoints, SCORE_BOUNDS.runePoints.min, SCORE_BOUNDS.runePoints.max) &&
    isFiniteNumberInRange(
      run.relicPoints,
      SCORE_BOUNDS.relicPoints.min,
      SCORE_BOUNDS.relicPoints.max,
    ) &&
    isFiniteNumberInRange(
      run.explorationPoints,
      SCORE_BOUNDS.explorationPoints.min,
      SCORE_BOUNDS.explorationPoints.max,
    ) &&
    isFiniteNumberInRange(
      run.utilityPoints,
      SCORE_BOUNDS.utilityPoints.min,
      SCORE_BOUNDS.utilityPoints.max,
    ) &&
    isFiniteNumberInRange(
      run.projectedTokenUnits,
      SCORE_BOUNDS.projectedTokenUnits.min,
      SCORE_BOUNDS.projectedTokenUnits.max,
    )
  );
}

function isValidSubmission(payload: LeaderboardSubmission) {
  const { run } = payload;
  if (!isSafeId(run.sessionId) || !isSafeId(run.levelId) || !isIsoDateString(run.completedAt)) {
    return false;
  }
  if (!isScorePayloadInBounds(payload)) {
    return false;
  }

  const displayName = sanitizeDisplayName(payload.displayName);
  if (displayName.length < 1 || displayName.length > 32) {
    return false;
  }

  if (payload.oauthUserId) {
    const oauthUserId = sanitizePlainText(payload.oauthUserId, 256);
    if (oauthUserId.length < 1) return false;
  }

  if (payload.walletAddress && !SAFE_WALLET_REGEX.test(payload.walletAddress)) {
    return false;
  }

  return true;
}

function toEntry(payload: LeaderboardSubmission): LeaderboardEntry {
  const { run } = payload;
  return {
    id: `lb-${run.sessionId}-${Date.now().toString(36)}`,
    displayName: sanitizeDisplayName(payload.displayName),
    oauthProvider: payload.oauthProvider,
    oauthUserId: sanitizeOptionalId(payload.oauthUserId, 256),
    walletAddress: sanitizeOptionalId(payload.walletAddress, 128),
    web5Enabled: Boolean(payload.web5Enabled && payload.walletAddress),
    levelId: sanitizePlainText(run.levelId, 128) || "level",
    score: Math.round(run.score),
    combo: Math.round(run.combo),
    coinsCollected: Math.round(run.coinsCollected),
    runesActivated: Math.round(run.runesActivated),
    relicsCollected: Math.round(run.relicsCollected),
    coinPoints: Math.round(run.coinPoints),
    runePoints: Math.round(run.runePoints),
    relicPoints: Math.round(run.relicPoints),
    explorationPoints: Math.round(run.explorationPoints),
    utilityPoints: Math.round(run.utilityPoints),
    projectedTokenUnits: Math.round(run.projectedTokenUnits),
    completedAt: run.completedAt,
  };
}

function getSessionKey(payload: LeaderboardSubmission) {
  const identity =
    sanitizeOptionalId(payload.oauthUserId, 256) ??
    sanitizeOptionalId(payload.walletAddress, 128) ??
    sanitizeDisplayName(payload.displayName).toLowerCase();
  return `${payload.run.sessionId}:${payload.oauthProvider}:${identity}`;
}

function rememberSession(key: string) {
  const store = getStore();
  store.seenSessionKeys.add(key);
  while (store.seenSessionKeys.size > MAX_SEEN_SESSION_KEYS) {
    const firstKey = store.seenSessionKeys.values().next().value as string | undefined;
    if (!firstKey) break;
    store.seenSessionKeys.delete(firstKey);
  }
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

function okResponse(entries: LeaderboardEntry[], extraHeaders?: HeadersInit) {
  const payload: LeaderboardResponse = {
    ok: true,
    entries,
    persistence: "memory",
  };
  return NextResponse.json(payload, { headers: withBaseHeaders(extraHeaders) });
}

export async function GET(request: Request) {
  const rate = enforceRateLimit(request, {
    keyPrefix: "api:game:leaderboard:get",
    max: 90,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rate.response;

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), MAX_ENTRIES)
    : 10;

  const entries = [...getStore().entries];
  sortLeaderboard(entries);
  return okResponse(entries.slice(0, limit), rate.headers);
}

export async function POST(request: Request) {
  const rate = enforceRateLimit(request, {
    keyPrefix: "api:game:leaderboard:post",
    max: 20,
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
    if (!isLeaderboardSubmission(payload) || !isValidSubmission(payload)) {
      return errorResponse(400, "Invalid leaderboard payload.", rate.headers);
    }

    const sessionKey = getSessionKey(payload);
    const store = getStore();
    if (store.seenSessionKeys.has(sessionKey)) {
      const entries = [...store.entries];
      sortLeaderboard(entries);
      return okResponse(entries.slice(0, 10), rate.headers);
    }

    rememberSession(sessionKey);

    const entry = toEntry(payload);
    store.entries.push(entry);
    sortLeaderboard(store.entries);
    if (store.entries.length > MAX_ENTRIES) {
      store.entries.length = MAX_ENTRIES;
    }

    return okResponse(store.entries.slice(0, 10), rate.headers);
  } catch {
    return errorResponse(500, "Unable to process leaderboard payload.", rate.headers);
  }
}
