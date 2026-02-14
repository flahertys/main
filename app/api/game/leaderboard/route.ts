import type {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardSubmission,
} from "@/lib/game/leaderboard-types";
import { isLeaderboardSubmission } from "@/lib/game/leaderboard-types";
import { NextResponse } from "next/server";

const MAX_ENTRIES = 100;

function getStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_LEADERBOARD__?: LeaderboardEntry[];
  };
  if (!globalRef.__TRADEHAX_LEADERBOARD__) {
    globalRef.__TRADEHAX_LEADERBOARD__ = [];
  }
  return globalRef.__TRADEHAX_LEADERBOARD__;
}

function sortLeaderboard(entries: LeaderboardEntry[]) {
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
}

function toEntry(payload: LeaderboardSubmission): LeaderboardEntry {
  const { run } = payload;
  return {
    id: `lb-${run.sessionId}-${Date.now().toString(36)}`,
    displayName: payload.displayName.trim().slice(0, 32) || "Guest",
    oauthProvider: payload.oauthProvider,
    oauthUserId: payload.oauthUserId?.slice(0, 128),
    walletAddress: payload.walletAddress?.slice(0, 128),
    web5Enabled: Boolean(payload.web5Enabled && payload.walletAddress),
    levelId: run.levelId,
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

function response(entries: LeaderboardEntry[]) {
  const payload: LeaderboardResponse = {
    ok: true,
    entries,
    persistence: "memory",
  };
  return NextResponse.json(payload);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), MAX_ENTRIES)
    : 10;
  const entries = [...getStore()];
  sortLeaderboard(entries);
  return response(entries.slice(0, limit));
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!isLeaderboardSubmission(payload)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid leaderboard payload.",
        },
        { status: 400 },
      );
    }

    const entry = toEntry(payload);
    const store = getStore();
    store.push(entry);
    sortLeaderboard(store);
    if (store.length > MAX_ENTRIES) {
      store.length = MAX_ENTRIES;
    }

    return response(store.slice(0, 10));
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to process leaderboard payload.",
      },
      { status: 500 },
    );
  }
}
