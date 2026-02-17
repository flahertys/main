import type {
  ArtifactRarity,
  GridPoint,
  HyperboreaLevelDefinition,
  LevelArtifact,
  LevelPuzzleNode,
} from "@/lib/game/level-types";

interface LevelGenerationOptions {
  seed?: number;
  width?: number;
  height?: number;
  id?: string;
  name?: string;
}

interface SeededRng {
  next: () => number;
  nextInt: (maxExclusive: number) => number;
}

function createSeededRng(initialSeed: number): SeededRng {
  let state = initialSeed >>> 0;
  if (state === 0) {
    state = 0x9e3779b9;
  }

  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };

  return {
    next,
    nextInt: (maxExclusive: number) => {
      if (maxExclusive <= 1) return 0;
      return Math.floor(next() * maxExclusive);
    },
  };
}

function shuffleInPlace<T>(items: T[], rng: SeededRng) {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = rng.nextInt(index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function ensureOdd(value: number) {
  return value % 2 === 0 ? value + 1 : value;
}

function createWallGrid(width: number, height: number) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => "#"));
}

function toKey(point: GridPoint) {
  return `${point.x},${point.y}`;
}

function parseKey(key: string): GridPoint {
  const [x, y] = key.split(",").map((value) => Number(value));
  return { x, y };
}

function carveMaze(grid: string[][], rng: SeededRng, start: GridPoint) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const stack: GridPoint[] = [start];
  grid[start.y][start.x] = ".";

  const directions = [
    { x: 2, y: 0 },
    { x: -2, y: 0 },
    { x: 0, y: 2 },
    { x: 0, y: -2 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates: GridPoint[] = [];

    for (const direction of directions) {
      const nx = current.x + direction.x;
      const ny = current.y + direction.y;
      if (nx <= 0 || ny <= 0 || nx >= width - 1 || ny >= height - 1) continue;
      if (grid[ny][nx] === "#") {
        candidates.push({ x: nx, y: ny });
      }
    }

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const nextCell = candidates[rng.nextInt(candidates.length)];
    const carveX = current.x + Math.sign(nextCell.x - current.x);
    const carveY = current.y + Math.sign(nextCell.y - current.y);
    grid[carveY][carveX] = ".";
    grid[nextCell.y][nextCell.x] = ".";
    stack.push(nextCell);
  }
}

function findPath(layout: string[][], start: GridPoint, exit: GridPoint): GridPoint[] {
  const queue: GridPoint[] = [start];
  const seen = new Set<string>([toKey(start)]);
  const prev = new Map<string, string>();
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === exit.x && current.y === exit.y) {
      break;
    }

    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      if (
        next.y < 0 ||
        next.y >= layout.length ||
        next.x < 0 ||
        next.x >= layout[0].length
      ) {
        continue;
      }
      if (layout[next.y][next.x] === "#") continue;
      const key = toKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      prev.set(key, toKey(current));
      queue.push(next);
    }
  }

  const exitKey = toKey(exit);
  if (!seen.has(exitKey)) {
    return [start, exit];
  }

  const path: GridPoint[] = [];
  let cursor = exitKey;
  while (cursor) {
    path.push(parseKey(cursor));
    const parent = prev.get(cursor);
    if (!parent) break;
    cursor = parent;
  }

  return path.reverse();
}

function getDeadEnds(layout: string[][]): GridPoint[] {
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const deadEnds: GridPoint[] = [];

  for (let y = 1; y < layout.length - 1; y++) {
    for (let x = 1; x < layout[0].length - 1; x++) {
      if (layout[y][x] === "#") continue;
      let exits = 0;
      for (const direction of directions) {
        if (layout[y + direction.y][x + direction.x] !== "#") {
          exits++;
        }
      }
      if (exits <= 1) {
        deadEnds.push({ x, y });
      }
    }
  }

  return deadEnds;
}

function pickPointAt(path: GridPoint[], ratio: number, fallback: GridPoint): GridPoint {
  if (path.length === 0) return fallback;
  const index = Math.max(0, Math.min(path.length - 1, Math.floor(path.length * ratio)));
  return path[index];
}

function uniquePoints(points: GridPoint[]): GridPoint[] {
  const seen = new Set<string>();
  const result: GridPoint[] = [];
  for (const point of points) {
    const key = toKey(point);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(point);
  }
  return result;
}

function rarityToTokenUnits(rarity: ArtifactRarity) {
  switch (rarity) {
    case "mythic":
      return 120;
    case "epic":
      return 75;
    case "rare":
      return 45;
    case "common":
    default:
      return 25;
  }
}

function buildArtifacts(path: GridPoint[], deadEnds: GridPoint[]): LevelArtifact[] {
  const candidates = uniquePoints([
    ...deadEnds,
    pickPointAt(path, 0.2, { x: 1, y: 1 }),
    pickPointAt(path, 0.42, { x: 3, y: 3 }),
    pickPointAt(path, 0.66, { x: 5, y: 5 }),
    pickPointAt(path, 0.88, { x: 7, y: 7 }),
  ]);

  const selected = candidates.slice(0, 6);
  const templates: Array<
    Omit<LevelArtifact, "position" | "tokenRewardUnits"> & { rarity: ArtifactRarity }
  > = [
    {
      id: "artifact-gungnir-shard",
      name: "Gungnir Shard",
      pantheon: "norse",
      rarity: "rare",
      lore: "A fractured spear-tip humming with Odin's tactical foresight.",
      puzzleRequirementIds: [],
    },
    {
      id: "artifact-dagda-torc",
      name: "Torc of Dagda",
      pantheon: "celtic",
      rarity: "epic",
      lore: "A gold neck-ring that reacts to hidden pressure-plate harmonics.",
      puzzleRequirementIds: ["lock-wolf-gate"],
    },
    {
      id: "artifact-mjolnir-core",
      name: "Mjolnir Spark Core",
      pantheon: "norse",
      rarity: "mythic",
      lore: "Contains compressed thunder runes that power astral gate mechanisms.",
      puzzleRequirementIds: ["rune-gate-astral"],
    },
    {
      id: "artifact-brigid-glyph",
      name: "Brigid Ember Glyph",
      pantheon: "celtic",
      rarity: "rare",
      lore: "An ember-etched glyph that reveals false walls and secret corridors.",
      puzzleRequirementIds: ["switch-sunstone"],
    },
    {
      id: "artifact-freyja-tear",
      name: "Freyja Amber Tear",
      pantheon: "norse",
      rarity: "epic",
      lore: "An amber relic tied to shield blessings and doubled score multipliers.",
      puzzleRequirementIds: ["plate-echo"],
    },
    {
      id: "artifact-cernunnos-rune",
      name: "Cernunnos Antler Rune",
      pantheon: "celtic",
      rarity: "mythic",
      lore: "A forest sigil needed to unlock the final pedestal and route to the exit.",
      puzzleRequirementIds: ["pedestal-twin-pantheon"],
    },
  ];

  return templates.map((template, index) => {
    const position = selected[index] ?? selected[selected.length - 1] ?? { x: 1, y: 1 };
    return {
      ...template,
      position,
      tokenRewardUnits: rarityToTokenUnits(template.rarity),
    };
  });
}

function buildPuzzleNodes(path: GridPoint[]): LevelPuzzleNode[] {
  const keyNode = pickPointAt(path, 0.2, { x: 1, y: 1 });
  const lockNode = pickPointAt(path, 0.38, { x: 3, y: 3 });
  const switchNode = pickPointAt(path, 0.56, { x: 5, y: 5 });
  const plateNode = pickPointAt(path, 0.7, { x: 7, y: 7 });
  const gateNode = pickPointAt(path, 0.82, { x: 9, y: 9 });
  const pedestalNode = pickPointAt(path, 0.9, { x: 11, y: 11 });

  return [
    {
      id: "key-bronze-rune",
      kind: "key",
      position: keyNode,
      label: "Bronze Rune Key",
      controls: ["lock-wolf-gate"],
      hint: "The wolf glyph opens only for keepers of the bronze rune.",
    },
    {
      id: "lock-wolf-gate",
      kind: "lock",
      position: lockNode,
      label: "Wolf Gate",
      requires: ["key-bronze-rune"],
      hint: "A heavy gate patterned after old runic fortress designs.",
    },
    {
      id: "switch-sunstone",
      kind: "switch",
      position: switchNode,
      label: "Sunstone Switch",
      controls: ["rune-gate-astral"],
      hint: "Rotating this switch realigns nearby star runes.",
    },
    {
      id: "plate-echo",
      kind: "pressure_plate",
      position: plateNode,
      label: "Echo Plate",
      controls: ["rune-gate-astral"],
      hint: "Stand still to charge the plate and keep the gate active.",
    },
    {
      id: "rune-gate-astral",
      kind: "rune_gate",
      position: gateNode,
      label: "Astral Rune Gate",
      requires: ["switch-sunstone", "plate-echo"],
      hint: "Switch and plate must be activated in sequence.",
    },
    {
      id: "pedestal-twin-pantheon",
      kind: "artifact_pedestal",
      position: pedestalNode,
      label: "Twin Pantheon Pedestal",
      requires: ["artifact-gungnir-shard", "artifact-dagda-torc"],
      hint: "Offer one Norse and one Celtic relic to reveal the final route.",
    },
  ];
}

export function generateZeldaLikeLevel(
  options: LevelGenerationOptions = {},
): HyperboreaLevelDefinition {
  const seed = options.seed ?? 1337;
  const width = ensureOdd(Math.max(11, options.width ?? 17));
  const height = ensureOdd(Math.max(11, options.height ?? 17));
  const rng = createSeededRng(seed);

  const layout = createWallGrid(width, height);
  const start = { x: 1, y: 1 };
  const exit = { x: width - 2, y: height - 2 };

  carveMaze(layout, rng, start);
  layout[start.y][start.x] = ".";
  layout[exit.y][exit.x] = ".";

  const path = findPath(layout, start, exit);
  const deadEnds = getDeadEnds(layout);
  const puzzleNodes = buildPuzzleNodes(path);
  const artifacts = buildArtifacts(path, deadEnds);

  return {
    id: options.id ?? "level-generated",
    name: options.name ?? "Procedural Relic Bastion",
    seed,
    difficulty: "raider",
    size: { width, height },
    start,
    exit,
    layout: layout.map((row) => row.join("")),
    objective:
      "Unlock rune gates, solve shrine puzzles, and recover Norse/Celtic relics for Web5 claim settlement.",
    puzzleNodes,
    artifacts,
    spawnProfile: {
      baseSpeed: 0.18,
      spawnInterval: 18,
      obstacleBias: {
        icespike: 0.42,
        frostwall: 0.33,
        lowbarrier: 0.25,
      },
      artifactMilestones: artifacts.map((_, index) => 120 + index * 180),
    },
    tokenConfig: {
      enabled: true,
      claimEndpoint: "/api/game/claim-artifact",
      web5Collection: "hyperborea/relic-claims",
      l2TokenSymbol: "THX",
      l2Network: "staging",
    },
    theme: {
      style: "wolfenstein-mystic",
      ambiance: "nordic-celtic-dungeon",
      accentColor: "#00ffaa",
      fogColor: "#0a0520",
    },
  };
}

export function generateDefaultLevel001() {
  return generateZeldaLikeLevel({
    seed: 1337,
    width: 17,
    height: 17,
    id: "level-001",
    name: "Temple of the Twin Pantheons",
  });
}
