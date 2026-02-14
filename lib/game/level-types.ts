export type Pantheon = "norse" | "celtic";

export type ArtifactRarity = "common" | "rare" | "epic" | "mythic";

export type PuzzleNodeKind =
  | "key"
  | "lock"
  | "switch"
  | "pressure_plate"
  | "rune_gate"
  | "artifact_pedestal"
  | "secret_wall";

export interface GridPoint {
  x: number;
  y: number;
}

export interface LevelPuzzleNode {
  id: string;
  kind: PuzzleNodeKind;
  position: GridPoint;
  label: string;
  controls?: string[];
  requires?: string[];
  hint?: string;
  optional?: boolean;
}

export interface LevelArtifact {
  id: string;
  name: string;
  pantheon: Pantheon;
  rarity: ArtifactRarity;
  position: GridPoint;
  puzzleRequirementIds?: string[];
  tokenRewardUnits: number;
  lore: string;
}

export interface RunnerSpawnProfile {
  baseSpeed: number;
  spawnInterval: number;
  obstacleBias: {
    icespike: number;
    frostwall: number;
    lowbarrier: number;
  };
  artifactMilestones: number[];
}

export interface LevelTokenConfig {
  enabled: boolean;
  claimEndpoint: string;
  web5Collection: string;
  l2TokenSymbol: string;
  l2Network: string;
}

export interface HyperboreaLevelTheme {
  style: string;
  ambiance: string;
  accentColor: string;
  fogColor: string;
}

export interface HyperboreaLevelDefinition {
  id: string;
  name: string;
  seed: number;
  difficulty: "initiate" | "raider" | "mythic";
  size: {
    width: number;
    height: number;
  };
  start: GridPoint;
  exit: GridPoint;
  layout: string[];
  objective: string;
  puzzleNodes: LevelPuzzleNode[];
  artifacts: LevelArtifact[];
  spawnProfile: RunnerSpawnProfile;
  tokenConfig: LevelTokenConfig;
  theme: HyperboreaLevelTheme;
}

export interface ArtifactCollectionEvent {
  eventId: string;
  sessionId: string;
  levelId: string;
  artifactId: string;
  artifactName: string;
  pantheon: Pantheon;
  rarity: ArtifactRarity;
  playerScore: number;
  combo: number;
  tokenRewardUnits: number;
  utilityPointsDelta?: number;
  utilityPointsAfterEvent?: number;
  utilityTokenBonusUnits?: number;
  lockedAtPickup?: boolean;
  claimEndpoint: string;
  web5Collection: string;
  collectedAt: string;
}

export interface GameScoreSnapshot {
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
}

export interface GameRunSummary extends GameScoreSnapshot {
  sessionId: string;
  levelId: string;
  completedAt: string;
}

function isGridPoint(value: unknown): value is GridPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<GridPoint>;
  return typeof point.x === "number" && typeof point.y === "number";
}

function isArtifact(value: unknown): value is LevelArtifact {
  if (!value || typeof value !== "object") return false;
  const artifact = value as Partial<LevelArtifact>;
  return (
    typeof artifact.id === "string" &&
    typeof artifact.name === "string" &&
    (artifact.pantheon === "norse" || artifact.pantheon === "celtic") &&
    typeof artifact.rarity === "string" &&
    isGridPoint(artifact.position) &&
    typeof artifact.tokenRewardUnits === "number"
  );
}

export function isHyperboreaLevelDefinition(
  value: unknown,
): value is HyperboreaLevelDefinition {
  if (!value || typeof value !== "object") return false;
  const level = value as Partial<HyperboreaLevelDefinition>;
  return (
    typeof level.id === "string" &&
    typeof level.name === "string" &&
    typeof level.seed === "number" &&
    !!level.size &&
    typeof level.size.width === "number" &&
    typeof level.size.height === "number" &&
    isGridPoint(level.start) &&
    isGridPoint(level.exit) &&
    Array.isArray(level.layout) &&
    level.layout.every((row) => typeof row === "string") &&
    Array.isArray(level.artifacts) &&
    level.artifacts.every(isArtifact) &&
    !!level.tokenConfig &&
    typeof level.tokenConfig.claimEndpoint === "string" &&
    typeof level.tokenConfig.web5Collection === "string"
  );
}
