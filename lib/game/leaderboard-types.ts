import type { GameRunSummary } from "@/lib/game/level-types";

export type OAuthProvider = "google" | "facebook" | "guest";

export interface LeaderboardSubmission {
  run: GameRunSummary;
  displayName: string;
  oauthProvider: OAuthProvider;
  oauthUserId?: string;
  walletAddress?: string;
  web5Enabled?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  oauthProvider: OAuthProvider;
  oauthUserId?: string;
  walletAddress?: string;
  web5Enabled: boolean;
  levelId: string;
  score: number;
  combo: number;
  coinsCollected: number;
  runesActivated: number;
  relicsCollected: number;
  coinPoints: number;
  runePoints: number;
  relicPoints: number;
  explorationPoints: number;
  utilityPoints: number;
  projectedTokenUnits: number;
  completedAt: string;
}

export interface LeaderboardResponse {
  ok: boolean;
  entries: LeaderboardEntry[];
  persistence: "memory";
}

export function isLeaderboardSubmission(value: unknown): value is LeaderboardSubmission {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LeaderboardSubmission>;
  const run = candidate.run as Partial<GameRunSummary> | undefined;
  return (
    !!run &&
    typeof run.sessionId === "string" &&
    typeof run.levelId === "string" &&
    typeof run.completedAt === "string" &&
    typeof run.score === "number" &&
    typeof run.combo === "number" &&
    typeof run.coinsCollected === "number" &&
    typeof run.runesActivated === "number" &&
    typeof run.relicsCollected === "number" &&
    typeof run.coinPoints === "number" &&
    typeof run.runePoints === "number" &&
    typeof run.relicPoints === "number" &&
    typeof run.explorationPoints === "number" &&
    typeof run.utilityPoints === "number" &&
    typeof run.projectedTokenUnits === "number" &&
    typeof candidate.displayName === "string" &&
    (candidate.oauthProvider === "google" ||
      candidate.oauthProvider === "facebook" ||
      candidate.oauthProvider === "guest")
  );
}
