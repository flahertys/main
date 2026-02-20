"use client";

import {
  ELDER_FUTHARK_RUNES,
  calculateRuneScore,
  getRuneForArtifact,
  getRuneParticleConfig,
  type ElderFutharkRune,
  type RuneProperties,
} from "@/lib/game/elder-futhark";
import { generateDefaultLevel001 } from "@/lib/game/level-generator";
import type {
    ArtifactCollectionEvent,
    GameRunSummary,
    GameScoreSnapshot,
    HyperboreaLevelDefinition,
    LevelArtifact,
    LevelPuzzleNode,
} from "@/lib/game/level-types";
import { calculateUtilityYield } from "@/lib/game/scoring-engine";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HyperboreaGameProps {
  onEnergyChange?: (energy: number) => void;
  onCloverCollect?: (count: number) => void;
  onScoreChange?: (score: number, combo: number) => void;
  onUtilityPointsChange?: (utilityPoints: number, projectedTokenUnits: number) => void;
  onStructuredScoreChange?: (snapshot: GameScoreSnapshot) => void;
  onRunComplete?: (summary: GameRunSummary) => void;
  onPowerUpChange?: (powerUps: Array<{ type: string; timeLeft: number }>) => void;
  onArtifactCollected?: (event: ArtifactCollectionEvent) => void;
  onStatusChange?: (message: string) => void;
  onInteractionHintChange?: (hint: string | null, actionable: boolean) => void;
  onRuntimeError?: (message: string) => void;
  levelDefinition?: HyperboreaLevelDefinition | null;
  sessionId?: string;
  isPaused?: boolean;
}

type ControlAction = "forward" | "backward" | "turn_left" | "turn_right" | "use";

interface ExternalControlDetail {
  action?: ControlAction;
  pressed?: boolean;
}

interface ArtifactInstance {
  data: LevelArtifact;
  mesh: THREE.Mesh;
  light?: THREE.PointLight;
  sprite?: THREE.Sprite;
  rune: ElderFutharkRune;
  runeSymbol: string;
  runeProps: RuneProperties;
  collected: boolean;
}

interface PuzzleInstance {
  data: LevelPuzzleNode;
  mesh: THREE.Mesh;
  activated: boolean;
  blockedCellKey?: string;
}

type InteractionCandidate =
  | { type: "artifact"; distance: number; instance: ArtifactInstance }
  | { type: "puzzle"; distance: number; instance: PuzzleInstance }
  | { type: "exit"; distance: number };

function isTexture(value: unknown): value is THREE.Texture {
  return (
    typeof value === "object" &&
    value !== null &&
    "isTexture" in value &&
    (value as { isTexture?: boolean }).isTexture === true
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

function yawFromGridDirection(dx: number, dy: number) {
  if (dx > 0) return Math.PI / 2;
  if (dx < 0) return -Math.PI / 2;
  if (dy < 0) return Math.PI;
  return 0;
}

const FALLBACK_LEVEL = generateDefaultLevel001();
const CELL_SIZE = 4;
const WALL_HEIGHT = 3.5;
const PLAYER_RADIUS = 0.38;
const EYE_HEIGHT = 1.5;
const INTERACT_DISTANCE = 3.9;
const AUTO_PICKUP_DISTANCE = 2.2;
const AUTO_RUNE_DISTANCE = 1.25;
const UTILITY_POINTS_PER_TOKEN_UNIT = 25;
const FALLBACK_RUNE: ElderFutharkRune = "fehu";
const NAVIGATION_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "e",
  "shift",
  "f",
  "enter",
  " ",
  "space",
  "spacebar",
]);
const INTERACT_KEYS = new Set(["e", "f", "enter", " ", "space", "spacebar"]);

function resolveArtifactRune(artifact: Partial<LevelArtifact>, index = 0) {
  const runeCandidate =
    typeof artifact.rune === "string" && artifact.rune in ELDER_FUTHARK_RUNES
      ? (artifact.rune as ElderFutharkRune)
      : getRuneForArtifact(
          artifact.pantheon === "celtic" ? "celtic" : "norse",
          artifact.rarity ?? "common",
          index,
        );

  const rune = runeCandidate in ELDER_FUTHARK_RUNES ? runeCandidate : FALLBACK_RUNE;
  const runeProps = ELDER_FUTHARK_RUNES[rune] ?? ELDER_FUTHARK_RUNES[FALLBACK_RUNE];
  const runeSymbol =
    typeof artifact.runeSymbol === "string" && artifact.runeSymbol.length > 0
      ? artifact.runeSymbol
      : runeProps.symbol;

  return { rune, runeProps, runeSymbol };
}

export function HyperboreaGame({
  onEnergyChange,
  onCloverCollect,
  onScoreChange,
  onUtilityPointsChange,
  onStructuredScoreChange,
  onRunComplete,
  onPowerUpChange,
  onArtifactCollected,
  onStatusChange,
  onInteractionHintChange,
  onRuntimeError,
  levelDefinition,
  sessionId = "session-local",
  isPaused = false,
}: HyperboreaGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(isPaused);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const activeLevel = levelDefinition ?? FALLBACK_LEVEL;
    const layout = activeLevel.layout;
    const gridHeight = layout.length;
    const gridWidth = layout[0]?.length ?? 0;
    if (gridWidth === 0 || gridHeight === 0) return;

    let isMounted = true;
    let animationFrameId = 0;
    let runtimeCrashed = false;

    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallViewport = window.matchMedia("(max-width: 900px)").matches;
    const isMobile = isTouchDevice || isSmallViewport;
    const minDpr = isMobile ? 0.75 : 1;
    const maxDpr = isMobile ? 1.35 : 2;
    const interactionDistance = isMobile ? 5.2 : 4.4;
    const autoPickupDistance = isMobile ? 3.4 : 2.8;
    const autoRuneDistance = isMobile ? 2.2 : 1.8;
    let currentDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    let viewportWidth = Math.max(currentMount.clientWidth || window.innerWidth, 1);
    let viewportHeight = Math.max(currentMount.clientHeight || window.innerHeight, 1);

    currentMount.style.touchAction = "none";
    currentMount.style.overscrollBehavior = "none";
    currentMount.style.backgroundColor = "#0a1020";
    currentMount.style.outline = "none";
    currentMount.tabIndex = 0;
    currentMount.setAttribute("role", "application");
    currentMount.setAttribute("aria-label", "Hyperborea interactive game viewport");

    const focusViewport = () => {
      if (document.activeElement === currentMount) {
        return;
      }
      try {
        currentMount.focus({ preventScroll: true });
      } catch {
        currentMount.focus();
      }
    };

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(activeLevel.theme.fogColor || 0x0a0520);
    const fogDensity = isMobile ? 0.018 : 0.03;
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    const camera = new THREE.PerspectiveCamera(78, viewportWidth / viewportHeight, 0.08, 400);

    const createRenderer = (antialias: boolean, powerPreference: WebGLPowerPreference) => {
      try {
        return new THREE.WebGLRenderer({
          antialias,
          alpha: false,
          powerPreference,
        });
      } catch {
        return null;
      }
    };

    let renderer =
      createRenderer(!isMobile, "high-performance") ??
      createRenderer(false, "default") ??
      createRenderer(false, "low-power");

    if (!renderer) {
      onStatusChange?.(
        "3D renderer unavailable on this device/browser. Try Chrome and disable battery saver.",
      );
      onInteractionHintChange?.("3D initialization failed on this device.", false);
      return;
    }

    renderer.setPixelRatio(currentDpr);
    renderer.setSize(viewportWidth, viewportHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isMobile ? 1.25 : 1.1;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    currentMount.appendChild(renderer.domElement);
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onStatusChange?.("Graphics context lost. Try reloading if the scene stays black.");
    };
    const handleContextRestored = () => {
      onStatusChange?.("Graphics context restored.");
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost as EventListener);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored as EventListener);

    const ambientLight = new THREE.AmbientLight(0x9bbdff, isMobile ? 0.95 : 0.62);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x99bbff, 0.75);
    moonLight.position.set(10, 22, 10);
    moonLight.castShadow = !isMobile;
    moonLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
    moonLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
    scene.add(moonLight);

    const mysticLight = new THREE.PointLight(0x00ffaa, 0.7, 55);
    mysticLight.position.set(-8, 3.2, -6);
    scene.add(mysticLight);

    const portalLight = new THREE.PointLight(0x77ccff, 0.4, 45);
    portalLight.position.set(8, 2.6, 7);
    scene.add(portalLight);

    const fillLight = new THREE.HemisphereLight(0x9fd8ff, 0x1a2740, isMobile ? 0.72 : 0.38);
    scene.add(fillLight);

    const gridToWorld = (x: number, y: number) => ({
      x: (x - gridWidth / 2 + 0.5) * CELL_SIZE,
      z: (y - gridHeight / 2 + 0.5) * CELL_SIZE,
    });

    const worldToGrid = (x: number, z: number) => ({
      x: Math.floor(x / CELL_SIZE + gridWidth / 2),
      y: Math.floor(z / CELL_SIZE + gridHeight / 2),
    });

    const isInsideGrid = (x: number, y: number) => x >= 0 && y >= 0 && x < gridWidth && y < gridHeight;
    const isWallCell = (x: number, y: number) => !isInsideGrid(x, y) || layout[y][x] === "#";

    const blockedCells = new Set<string>();
    const collectedArtifactIds = new Set<string>();
    const activatedPuzzleIds = new Set<string>();

    const floorGeometry = new THREE.PlaneGeometry(gridWidth * CELL_SIZE, gridHeight * CELL_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: isMobile ? 0x1a3550 : 0x10233a,
      roughness: 0.82,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceilingGeometry = new THREE.PlaneGeometry(gridWidth * CELL_SIZE, gridHeight * CELL_SIZE);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: isMobile ? 0x101a2b : 0x0d1321,
      roughness: 0.62,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_HEIGHT;
    ceiling.receiveShadow = false;
    scene.add(ceiling);

    const wallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: isMobile ? 0x2b3f61 : 0x1f2e4a,
      roughness: 0.58,
      metalness: 0.25,
      emissive: isMobile ? 0x0d1628 : 0x060b16,
      emissiveIntensity: isMobile ? 0.34 : 0.25,
    });

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (layout[y][x] !== "#") continue;
        const position = gridToWorld(x, y);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(position.x, WALL_HEIGHT / 2, position.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
      }
    }

    const puzzleColorMap: Record<string, number> = {
      key: 0xffd166,
      lock: 0xff6677,
      switch: 0xff9f1c,
      pressure_plate: 0x76c893,
      rune_gate: 0x8a5cf6,
      artifact_pedestal: 0x00d4ff,
      secret_wall: 0x8f6d54,
    };

    const puzzleInstances: PuzzleInstance[] = [];
    for (const node of activeLevel.puzzleNodes) {
      let geometry: THREE.BufferGeometry;
      let y = 1.0;

      if (node.kind === "pressure_plate") {
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 24);
        y = 0.11;
      } else if (node.kind === "key") {
        geometry = new THREE.TetrahedronGeometry(0.5);
        y = 1.1;
      } else if (node.kind === "lock") {
        geometry = new THREE.BoxGeometry(1.6, 2.4, 0.5);
        y = 1.2;
      } else if (node.kind === "rune_gate") {
        geometry = new THREE.OctahedronGeometry(0.9);
        y = 1.45;
      } else if (node.kind === "artifact_pedestal") {
        geometry = new THREE.CylinderGeometry(0.65, 0.85, 1.2, 20);
        y = 0.6;
      } else if (node.kind === "secret_wall") {
        geometry = new THREE.BoxGeometry(1.7, 2.2, 0.45);
        y = 1.1;
      } else {
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        y = 0.9;
      }

      const material = new THREE.MeshStandardMaterial({
        color: puzzleColorMap[node.kind] ?? 0xffffff,
        emissive: puzzleColorMap[node.kind] ?? 0xffffff,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.65,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const world = gridToWorld(node.position.x, node.position.y);
      mesh.position.set(world.x, y, world.z);
      mesh.castShadow = true;
      scene.add(mesh);

      let blockedCellKey: string | undefined;
      if (node.kind === "lock" || node.kind === "rune_gate") {
        blockedCellKey = cellKey(node.position.x, node.position.y);
        blockedCells.add(blockedCellKey);
      }

      puzzleInstances.push({
        data: node,
        mesh,
        activated: false,
        blockedCellKey,
      });
    }

    const rarityColorMap: Record<string, number> = {
      common: 0x7bffb2,
      rare: 0x5bc0ff,
      epic: 0xd77bff,
      mythic: 0xffb86b,
    };
    const artifactInstances: ArtifactInstance[] = [];
    for (const [artifactIndex, artifact] of activeLevel.artifacts.entries()) {
      // Get rune properties for enhanced visuals
      const { rune, runeProps, runeSymbol } = resolveArtifactRune(artifact, artifactIndex);
      const particleConfig = getRuneParticleConfig(rune);

      // Create main artifact mesh with enhanced geometry
      const geometry = new THREE.DodecahedronGeometry(0.52);
      const color = parseInt(runeProps.color.slice(1), 16);
      const glowColor = parseInt(runeProps.glowColor.slice(1), 16);

      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: glowColor,
        emissiveIntensity: particleConfig.intensity * 0.8,
        roughness: 0.08,
        metalness: 0.95,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const world = gridToWorld(artifact.position.x, artifact.position.y);
      mesh.position.set(world.x, 1.1, world.z);
      mesh.castShadow = true;
      scene.add(mesh);

      // Add rune symbol text sprite above artifact
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = runeProps.glowColor;
        ctx.font = 'bold 180px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add glow effect
        ctx.shadowColor = runeProps.glowColor;
        ctx.shadowBlur = 40;
        ctx.fillText(runeSymbol, 128, 128);
        ctx.shadowBlur = 60;
        ctx.fillText(runeSymbol, 128, 128);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(world.x, 1.8, world.z);
      sprite.scale.set(0.9, 0.9, 1);
      scene.add(sprite);

      // Enhanced point light with rune color
      const light = new THREE.PointLight(glowColor, particleConfig.intensity * 1.2, 5.5);
      light.position.set(world.x, 1.1, world.z);
      scene.add(light);

      artifactInstances.push({
        data: artifact,
        mesh,
        collected: false,
        light,
        sprite,
        rune,
        runeSymbol,
        runeProps,
      });
    }

    const exitWorld = gridToWorld(activeLevel.exit.x, activeLevel.exit.y);
    const portalGeometry = new THREE.TorusGeometry(1.08, 0.16, 18, 48);
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6688,
      emissive: 0xff6688,
      emissiveIntensity: 0.42,
      roughness: 0.1,
      metalness: 0.9,
    });
    const portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
    portalMesh.position.set(exitWorld.x, 1.4, exitWorld.z);
    portalMesh.rotation.x = Math.PI / 2;
    scene.add(portalMesh);

    const startWorld = gridToWorld(activeLevel.start.x, activeLevel.start.y);
    let playerX = startWorld.x;
    let playerZ = startWorld.z;
    let playerYaw = Math.atan2(exitWorld.x - startWorld.x, exitWorld.z - startWorld.z);
    const startGrid = activeLevel.start;
    const exitGrid = activeLevel.exit;
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    let bestDirection: { dx: number; dy: number } | null = null;
    let bestDirectionScore = Number.NEGATIVE_INFINITY;
    for (const direction of directions) {
      const nextX = startGrid.x + direction.dx;
      const nextY = startGrid.y + direction.dy;
      if (isWallCell(nextX, nextY)) continue;
      const towardExitX = exitGrid.x - startGrid.x;
      const towardExitY = exitGrid.y - startGrid.y;
      const score = direction.dx * towardExitX + direction.dy * towardExitY;
      if (score > bestDirectionScore) {
        bestDirectionScore = score;
        bestDirection = direction;
      }
    }
    if (bestDirection) {
      playerYaw = yawFromGridDirection(bestDirection.dx, bestDirection.dy);
    }
    let bobTimer = 0;
    let targetCameraTilt = 0;
    let currentCameraTilt = 0;
    let cameraShake = 0;
    let screenFlash = 0;
    let cameraShakeDir = new THREE.Vector3();

    let energy = 25;
    let score = 0;
    let utilityPoints = 0;
    let coinsCollected = 0;
    let runesActivated = 0;
    let coinPoints = 0;
    let runePoints = 0;
    let relicPoints = 0;
    let explorationPoints = 0;
    let relicsCollected = 0;
    let combo = 0;
    let comboTimer = 0;
    let energyDecayClock = 0;
    let exitUnlocked = false;
    let missionComplete = false;
    let lastInteractionHint = "";
    let lastHintActionable = false;
    let blockedMoveHintCooldownSeconds = 0;
    let lastProgressTimestampMs = performance.now();

    let performanceCheckTimer = 0;
    let performanceFrameCounter = 0;
    let performanceTimeAccumulator = 0;

    const keyState: Record<string, boolean> = {};
    const virtualControlState: Record<ControlAction, boolean> = {
      forward: false,
      backward: false,
      turn_left: false,
      turn_right: false,
      use: false,
    };

    let sprintActive = false;
    let comboWarningShown = false;

    let touchRotating = false;
    let touchLastX = 0;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let touchGestureForward = false;
    let touchGestureBackward = false;

    const simulationClock = new THREE.Clock();
    let simulationAccumulator = 0;
    const fixedStepSeconds = isMobile ? 1 / 55 : 1 / 60;
    const maxSubSteps = isMobile ? 3 : 4;
    let simulationFrame = 0;
    let lastScoreSent = Number.NaN;
    let lastComboSent = Number.NaN;
    let lastUtilityPointsSent = Number.NaN;
    let lastProjectedTokenUnitsSent = Number.NaN;
    let lastStructuredSnapshot = "";

    const emitStatus = (message: string) => {
      onStatusChange?.(message);
    };

    const emitScore = (force = false) => {
      const roundedScore = Math.round(score);
      if (!force && roundedScore === lastScoreSent && combo === lastComboSent) {
        return;
      }
      lastScoreSent = roundedScore;
      lastComboSent = combo;
      onScoreChange?.(roundedScore, combo);
    };

    const toProjectedUtilityTokenUnits = (points: number) =>
      Math.floor(Math.max(points, 0) / UTILITY_POINTS_PER_TOKEN_UNIT);

    const emitUtilityPoints = (force = false) => {
      if (!onUtilityPointsChange) return;
      const roundedUtilityPoints = Math.round(Math.max(0, utilityPoints));
      const projectedTokenUnits = toProjectedUtilityTokenUnits(roundedUtilityPoints);
      if (
        !force &&
        roundedUtilityPoints === lastUtilityPointsSent &&
        projectedTokenUnits === lastProjectedTokenUnitsSent
      ) {
        return;
      }
      lastUtilityPointsSent = roundedUtilityPoints;
      lastProjectedTokenUnitsSent = projectedTokenUnits;
      onUtilityPointsChange(roundedUtilityPoints, projectedTokenUnits);
    };

    const emitStructuredScore = (force = false) => {
      if (!onStructuredScoreChange) return;
      const snapshot: GameScoreSnapshot = {
        score: Math.round(score),
        combo,
        coinsCollected,
        runesActivated,
        relicsCollected,
        coinPoints: Math.round(coinPoints),
        runePoints: Math.round(runePoints),
        relicPoints: Math.round(relicPoints),
        explorationPoints: Math.round(explorationPoints),
        utilityPoints: Math.round(utilityPoints),
        projectedTokenUnits: toProjectedUtilityTokenUnits(utilityPoints),
      };
      const serialized = JSON.stringify(snapshot);
      if (!force && serialized === lastStructuredSnapshot) {
        return;
      }
      lastStructuredSnapshot = serialized;
      onStructuredScoreChange(snapshot);
    };

    const emitRelics = () => {
      onCloverCollect?.(relicsCollected);
    };

    const clearControlState = () => {
      for (const key of Object.keys(keyState)) {
        keyState[key] = false;
      }
      virtualControlState.forward = false;
      virtualControlState.backward = false;
      virtualControlState.turn_left = false;
      virtualControlState.turn_right = false;
      virtualControlState.use = false;
      touchGestureForward = false;
      touchGestureBackward = false;
      sprintActive = false;
    };

    const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (!('vibrate' in navigator)) return;
      const patterns = {
        light: [10],
        medium: [30],
        heavy: [50, 30, 50]
      };
      try {
        navigator.vibrate(patterns[intensity]);
      } catch (e) {
        // Silently fail if vibration not supported
      }
    };

    const emitInteractionHint = (hint: string | null, actionable: boolean) => {
      const normalizedHint = hint ?? "";
      if (normalizedHint === lastInteractionHint && actionable === lastHintActionable) {
        return;
      }
      lastInteractionHint = normalizedHint;
      lastHintActionable = actionable;
      onInteractionHintChange?.(hint, actionable);
    };

    const updateEnergy = (nextValue: number) => {
      const normalized = clamp(Math.round(nextValue), 0, 100);
      if (normalized !== energy) {
        energy = normalized;
        onEnergyChange?.(energy);
      }
    };

    const requirementSatisfied = (id: string) =>
      activatedPuzzleIds.has(id) || collectedArtifactIds.has(id);

    const requirementLabelMap = new Map<string, string>();
    for (const puzzle of activeLevel.puzzleNodes) {
      requirementLabelMap.set(puzzle.id, puzzle.label);
    }
    for (const artifact of activeLevel.artifacts) {
      requirementLabelMap.set(artifact.id, artifact.name);
    }

    const requirementsMet = (requirements?: string[]) =>
      !requirements || requirements.every(requirementSatisfied);

    const getMissingRequirements = (requirements?: string[]) => {
      if (!requirements || requirements.length === 0) return [];
      return requirements
        .filter((id) => !requirementSatisfied(id))
        .map((id) => requirementLabelMap.get(id) ?? id);
    };

    const canOccupy = (worldX: number, worldZ: number) => {
      // Use a more robust check by sampling more points around the player
      const collisionRadius = PLAYER_RADIUS * 1.1; // Slight buffer
      const samples = 8;

      // Center check
      const centerGrid = worldToGrid(worldX, worldZ);
      if (isWallCell(centerGrid.x, centerGrid.y) || blockedCells.has(cellKey(centerGrid.x, centerGrid.y))) return false;

      // Radial samples
      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;
        const dx = Math.cos(angle) * collisionRadius;
        const dz = Math.sin(angle) * collisionRadius;
        const grid = worldToGrid(worldX + dx, worldZ + dz);
        if (isWallCell(grid.x, grid.y)) return false;
        if (blockedCells.has(cellKey(grid.x, grid.y))) return false;
      }

      return true;
    };

    const attemptStepMove = (direction: 1 | -1, distance = isMobile ? 1.9 : 1.4) => {
      if (missionComplete) return false;

      const stepDx = Math.sin(playerYaw) * direction * distance;
      const stepDz = Math.cos(playerYaw) * direction * distance;

      // Try full move first
      if (canOccupy(playerX + stepDx, playerZ + stepDz)) {
        playerX += stepDx;
        playerZ += stepDz;
        bobTimer += 0.65;
        score += distance * 2.6;
        utilityPoints += distance * 4.2;
        explorationPoints += distance * 2.6;
        lastProgressTimestampMs = performance.now();
        emitScore();
        emitUtilityPoints();
        emitStructuredScore();
        return true;
      }

      // Try sliding along X
      if (canOccupy(playerX + stepDx, playerZ)) {
        playerX += stepDx;
        bobTimer += 0.45;
        return true;
      }

      // Try sliding along Z
      if (canOccupy(playerX, playerZ + stepDz)) {
        playerZ += stepDz;
        bobTimer += 0.45;
        return true;
      }

      if (direction > 0 && blockedMoveHintCooldownSeconds <= 0) {
        blockedMoveHintCooldownSeconds = 2.4;
        emitStatus("Path blocked. Turn left/right or find a way to unlock.");
        cameraShake = 0.15;
        cameraShakeDir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      }

      return false;
    };

    const setPortalState = (unlocked: boolean) => {
      if (unlocked) {
        portalMaterial.color.set(0x66e0ff);
        portalMaterial.emissive.set(0x66e0ff);
        portalMaterial.emissiveIntensity = 0.95;
        portalLight.intensity = 1.1;
      } else {
        portalMaterial.color.set(0xff6688);
        portalMaterial.emissive.set(0xff6688);
        portalMaterial.emissiveIntensity = 0.42;
        portalLight.intensity = 0.4;
      }
    };

    const maybeUnlockExit = () => {
      if (exitUnlocked) return;
      const pedestalNodes = puzzleInstances.filter(
        (instance) => instance.data.kind === "artifact_pedestal",
      );
      const pedestalReady =
        pedestalNodes.length === 0 || pedestalNodes.every((instance) => instance.activated);
      const requiredRelics = Math.min(3, artifactInstances.length);

      if (pedestalReady && collectedArtifactIds.size >= requiredRelics) {
        exitUnlocked = true;
        setPortalState(true);
        emitStatus("Astral portal unlocked. Reach the exit ring and press Use.");
      }
    };

    const activatePuzzle = (instance: PuzzleInstance, fromAuto = false) => {
      if (instance.activated) return;

      if (!requirementsMet(instance.data.requires)) {
        if (!fromAuto) {
          const missing = getMissingRequirements(instance.data.requires);
          emitStatus(
            missing.length > 0
              ? `Locked: ${instance.data.label}. Missing: ${missing.join(", ")}.`
              : `Locked: ${instance.data.label}. Solve prerequisites first.`,
          );
        }
        return;
      }

      instance.activated = true;
      activatedPuzzleIds.add(instance.data.id);

      const material = instance.mesh.material as THREE.MeshStandardMaterial;
      material.color.set(0x32ffb4);
      material.emissive.set(0x32ffb4);
      material.emissiveIntensity = 0.7;
      instance.mesh.scale.set(1.08, 1.08, 1.08);

      if (instance.blockedCellKey) {
        blockedCells.delete(instance.blockedCellKey);
      }

      runesActivated += 1;
      runePoints += 45;
      score += 45;
      utilityPoints += 32;
      lastProgressTimestampMs = performance.now();
      combo += 1;
      comboTimer = 240;
      comboWarningShown = false;
      updateEnergy(energy + 8);
      emitScore(true);
      emitUtilityPoints(true);
      emitStructuredScore(true);
      emitStatus(`${instance.data.label} activated.`);
      triggerHapticFeedback('medium');
      maybeUnlockExit();
    };

    const emitArtifactEvent = (
      artifact: LevelArtifact,
      awardedTokenUnits: number,
      lockedAtPickup: boolean,
      runeBonus: number,
      runeTier: string,
    ) => {
      if (!onArtifactCollected) return;
      const event: ArtifactCollectionEvent = {
        eventId: `${sessionId}-${artifact.id}-${Date.now()}`,
        sessionId,
        levelId: activeLevel.id,
        artifactId: artifact.id,
        artifactName: artifact.name,
        pantheon: artifact.pantheon,
        rarity: artifact.rarity,
        playerScore: Math.round(score),
        combo,
        tokenRewardUnits: awardedTokenUnits,
        utilityPointsDelta: 85 + awardedTokenUnits * 3,
        utilityPointsAfterEvent: Math.round(utilityPoints),
        utilityTokenBonusUnits: toProjectedUtilityTokenUnits(utilityPoints),
        lockedAtPickup,
        claimEndpoint: activeLevel.tokenConfig.claimEndpoint,
        web5Collection: activeLevel.tokenConfig.web5Collection,
        collectedAt: new Date().toISOString(),
        rune: artifact.rune,
        runeSymbol: artifact.runeSymbol,
        runeBonus,
        runeTier,
      };
      onArtifactCollected(event);
    };

    const collectArtifact = (instance: ArtifactInstance) => {
      if (instance.collected) return;
      const missingRequirements = getMissingRequirements(instance.data.puzzleRequirementIds);
      const lockedAtPickup = missingRequirements.length > 0;

      // Get rune properties and calculate rune-based scoring
      const runeProps = instance.runeProps;
      const baseRelicScore =
        (lockedAtPickup ? 70 : 120) +
        Math.round(instance.data.tokenRewardUnits * (lockedAtPickup ? 0.8 : 2));
      const runeScoring = calculateRuneScore(instance.rune, baseRelicScore, combo);

      instance.collected = true;
      collectedArtifactIds.add(instance.data.id);
      instance.mesh.visible = false;
      if (instance.light) {
        scene.remove(instance.light);
      }
      if (instance.sprite) {
        scene.remove(instance.sprite);
      }

      coinsCollected += 1;
      relicsCollected = collectedArtifactIds.size;
      emitRelics();

      // Enhanced screen flash based on rune tier
      const tierFlashMap = {
        divine: 1.0,
        supreme: 0.85,
        greater: 0.65,
        lesser: 0.4,
      } as const;
      screenFlash = tierFlashMap[runeProps.tier] ?? 0.3;
      triggerHapticFeedback(
        runeProps.tier === "divine" || runeProps.tier === "supreme" ? "heavy" : "medium",
      );

      // Use the scoring engine for accumulation logic
      const yieldData = calculateUtilityYield({
        basePoints: instance.data.tokenRewardUnits,
        rarity: instance.data.rarity,
        combo,
        timeElapsedSeconds: Math.floor((performance.now() - lastProgressTimestampMs) / 1000),
        isLockedAtPickup: lockedAtPickup,
      });

      const utilityDelta = yieldData.utilityPoints + runeProps.utilityBonus;
      coinPoints += Math.max(8, Math.round(instance.data.tokenRewardUnits * (lockedAtPickup ? 0.35 : 1)));

      // Apply rune scoring
      relicPoints += runeScoring.totalScore;
      utilityPoints += utilityDelta;
      score += runeScoring.totalScore;
      lastProgressTimestampMs = performance.now();
      combo += 1;
      comboTimer = 240;
      comboWarningShown = false;

      // Enhanced energy bonus from rune
      const rarityEnergyBonus =
        instance.data.rarity === "mythic"
          ? 24
          : instance.data.rarity === "epic"
            ? 18
            : instance.data.rarity === "rare"
              ? 13
              : 9;
      updateEnergy(energy + rarityEnergyBonus + runeProps.energyBonus);

      emitScore(true);
      emitUtilityPoints(true);
      emitStructuredScore(true);

      // Enhanced status message with rune info
      const statusMsg = `⚜ ${runeProps.name} Rune (${runeProps.symbol}) - ${runeProps.tier.toUpperCase()} tier! +${runeScoring.runeBonus} bonus`;
      emitStatus(statusMsg);

      emitArtifactEvent(
        {
          ...instance.data,
          rune: instance.rune,
          runeSymbol: instance.runeSymbol,
          tokenRewardUnits: yieldData.projectedTokens,
        },
        yieldData.projectedTokens,
        lockedAtPickup,
        runeScoring.runeBonus,
        runeProps.tier,
      );

      if (instance.data.rarity === "mythic") {
        emitStatus(`MYTHIC ${runeProps.name.toUpperCase()}: ${runeProps.power}`);
        utilityPoints += 500;
        updateEnergy(100);
      }

      maybeUnlockExit();
    };

    const getForwardAlignment = (targetX: number, targetZ: number) => {
      const dx = targetX - playerX;
      const dz = targetZ - playerZ;
      const magnitude = Math.hypot(dx, dz);
      if (magnitude < 0.0001) return 1;
      const fx = Math.sin(playerYaw);
      const fz = Math.cos(playerYaw);
      return (fx * dx + fz * dz) / magnitude;
    };

    const getNearestInteractionCandidate = (): InteractionCandidate | null => {
      const candidates: InteractionCandidate[] = [];

      for (const artifact of artifactInstances) {
        if (artifact.collected) continue;
        const dx = artifact.mesh.position.x - playerX;
        const dz = artifact.mesh.position.z - playerZ;
        const distance = Math.hypot(dx, dz);
        if (distance > interactionDistance) continue;
        candidates.push({ type: "artifact", distance, instance: artifact });
      }

      for (const puzzle of puzzleInstances) {
        if (puzzle.activated) continue;
        const dx = puzzle.mesh.position.x - playerX;
        const dz = puzzle.mesh.position.z - playerZ;
        const distance = Math.hypot(dx, dz);
        if (distance > interactionDistance) continue;
        candidates.push({ type: "puzzle", distance, instance: puzzle });
      }

      const exitDistance = Math.hypot(exitWorld.x - playerX, exitWorld.z - playerZ);
      if (exitDistance <= interactionDistance && getForwardAlignment(exitWorld.x, exitWorld.z) >= -0.35) {
        candidates.push({ type: "exit", distance: exitDistance });
      }

      if (candidates.length === 0) {
        return null;
      }

      candidates.sort((a, b) => a.distance - b.distance);
      return candidates[0];
    };

    const formatInteractionHint = (candidate: InteractionCandidate | null) => {
      if (!candidate) return "";
      const actionVerb = isMobile ? "Tap Use" : "Press E";
      if (candidate.type === "artifact") {
        return `${actionVerb}: collect ${candidate.instance.data.name} (or move closer to auto-collect)`;
      }
      if (candidate.type === "puzzle") {
        return `${actionVerb}: activate ${candidate.instance.data.label}`;
      }
      if (!exitUnlocked) {
        return "Portal ahead: complete relic and puzzle requirements first.";
      }
      return `${actionVerb}: enter unlocked portal`;
    };

    const tryInteract = () => {
      if (missionComplete) return;

      const nearest = getNearestInteractionCandidate();
      if (!nearest) {
        emitStatus("No interactable object in range. Move closer to a relic or rune, then press Use.");
        emitInteractionHint("", false);
        return;
      }

      if (nearest.type === "artifact") {
        collectArtifact(nearest.instance);
        emitInteractionHint("", false);
        return;
      }

      if (nearest.type === "puzzle") {
        activatePuzzle(nearest.instance);
        emitInteractionHint("", false);
        return;
      }

      if (!exitUnlocked) {
        emitStatus("Portal is sealed. Recover relics and complete pedestal/gate puzzles first.");
        return;
      }

      missionComplete = true;
      score += 650;
      relicPoints += 650;
      emitScore(true);
      updateEnergy(100);
      onPowerUpChange?.([]);
      emitStatus("Level complete. Portal traversal confirmed.");
      emitInteractionHint("Portal traversal complete.", false);
      utilityPoints += 220;
      emitUtilityPoints(true);
      emitStructuredScore(true);
      onRunComplete?.({
        sessionId,
        levelId: activeLevel.id,
        completedAt: new Date().toISOString(),
        score: Math.round(score),
        combo,
        coinsCollected,
        runesActivated,
        relicsCollected,
        coinPoints: Math.round(coinPoints),
        runePoints: Math.round(runePoints),
        relicPoints: Math.round(relicPoints),
        explorationPoints: Math.round(explorationPoints),
        utilityPoints: Math.round(utilityPoints),
        projectedTokenUnits: toProjectedUtilityTokenUnits(utilityPoints),
      });
    };

    const autoCollectNearbyArtifacts = () => {
      if (missionComplete) return;
      const magnetRange = autoPickupDistance * (combo >= 10 ? 2.5 : 1.0);

      for (const artifact of artifactInstances) {
        if (artifact.collected) continue;
        const dx = artifact.mesh.position.x - playerX;
        const dz = artifact.mesh.position.z - playerZ;
        const distance = Math.hypot(dx, dz);

        if (distance <= magnetRange) {
          // Visual magnet effect: move mesh toward player
          if (distance > 0.5) {
            const lerpFactor = 0.12;
            artifact.mesh.position.x -= dx * lerpFactor;
            artifact.mesh.position.z -= dz * lerpFactor;
          }

          if (distance <= 0.8 || (distance <= autoPickupDistance)) {
            collectArtifact(artifact);
          }
        }
      }
    };

    const autoActivateNearbyRunes = () => {
      if (missionComplete) return;
      for (const puzzle of puzzleInstances) {
        if (puzzle.activated) continue;
        if (puzzle.data.kind === "pressure_plate") continue;
        const distance = Math.hypot(puzzle.mesh.position.x - playerX, puzzle.mesh.position.z - playerZ);
        if (distance <= autoRuneDistance) {
          activatePuzzle(puzzle, true);
        }
      }
    };

    const applyControlHold = (action: ControlAction, pressed: boolean) => {
      if (action === "use") {
        if (pressed) {
          tryInteract();
        }
        return;
      }
      if ((action === "forward" || action === "backward") && pressed) {
        attemptStepMove(action === "forward" ? 1 : -1);
      }
      virtualControlState[action] = pressed;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyIsSpace = key === " " || key === "spacebar" || key === "space" || event.code === "Space";
      const normalizedKey = keyIsSpace ? "space" : key;

      if (NAVIGATION_KEYS.has(key) || keyIsSpace) {
        event.preventDefault();
      }

      keyState[normalizedKey] = true;
      if (!event.repeat) {
        if (key === "w" || key === "arrowup") {
          attemptStepMove(1);
        } else if (key === "s" || key === "arrowdown") {
          attemptStepMove(-1);
        } else if (key === "a" || key === "arrowleft") {
          playerYaw += 0.2;
        } else if (key === "d" || key === "arrowright") {
          playerYaw -= 0.2;
        }
      }
      if ((INTERACT_KEYS.has(key) || keyIsSpace) && !event.repeat) {
        tryInteract();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyIsSpace = key === " " || key === "spacebar" || key === "space" || event.code === "Space";
      const normalizedKey = keyIsSpace ? "space" : key;
      keyState[normalizedKey] = false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      event.preventDefault();
      touchRotating = true;
      touchLastX = event.touches[0].clientX;
      swipeStartX = event.touches[0].clientX;
      swipeStartY = event.touches[0].clientY;
      touchGestureForward = false;
      touchGestureBackward = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchRotating || event.touches.length === 0) return;
      event.preventDefault();
      const nextTouch = event.touches[0];
      const nextX = nextTouch.clientX;
      const deltaX = nextX - touchLastX;
      touchLastX = nextX;
      playerYaw -= deltaX * 0.0045;

      const deltaYFromStart = swipeStartY - nextTouch.clientY;
      if (deltaYFromStart > 24) {
        touchGestureForward = true;
        touchGestureBackward = false;
      } else if (deltaYFromStart < -24) {
        touchGestureForward = false;
        touchGestureBackward = true;
      } else {
        touchGestureForward = false;
        touchGestureBackward = false;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.changedTouches.length === 0) {
        touchRotating = false;
        touchGestureForward = false;
        touchGestureBackward = false;
        return;
      }
      const deltaX = event.changedTouches[0].clientX - swipeStartX;
      const deltaY = event.changedTouches[0].clientY - swipeStartY;

      // Fallback gestures for browsers where continuous touch controls are unreliable.
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) >= 36) {
        attemptStepMove(deltaY < 0 ? 1 : -1);
      }

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= 36) {
        const turnDirection = deltaX > 0 ? -1 : 1;
        playerYaw += turnDirection * 0.28;
      }

      if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
        tryInteract();
      }
      touchRotating = false;
      touchGestureForward = false;
      touchGestureBackward = false;
    };

    const allowedActions: ControlAction[] = [
      "forward",
      "backward",
      "turn_left",
      "turn_right",
      "use",
    ];

    const handleExternalControl = (event: Event) => {
      const detail = (event as CustomEvent<ExternalControlDetail>).detail;
      const action = detail?.action;
      if (!action || !allowedActions.includes(action)) return;

      if (typeof detail.pressed === "boolean") {
        applyControlHold(action, detail.pressed);
        return;
      }

      const pulseDurationMs = isMobile ? 520 : 120;
      applyControlHold(action, true);
      window.setTimeout(() => applyControlHold(action, false), pulseDurationMs);
    };

    const handleResize = () => {
      if (!isMounted) return;
      const vvWidth = window.visualViewport?.width;
      const vvHeight = window.visualViewport?.height;
      viewportWidth = Math.max(currentMount.clientWidth || vvWidth || window.innerWidth, 1);
      viewportHeight = Math.max(currentMount.clientHeight || vvHeight || window.innerHeight, 1);
      currentDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(currentDpr);
      renderer.setSize(viewportWidth, viewportHeight);
    };

    const handleOrientationChange = () => {
      window.setTimeout(() => {
        handleResize();
      }, 120);
    };

    const handleWindowBlur = () => {
      clearControlState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearControlState();
      }
    };

    const handleViewportPointerDown = () => {
      focusViewport();
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            handleResize();
          })
        : null;
    resizeObserver?.observe(currentMount);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("hyperborea-control", handleExternalControl as EventListener);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    currentMount.addEventListener("pointerdown", handleViewportPointerDown);
    currentMount.addEventListener("touchstart", handleTouchStart, { passive: false });
    currentMount.addEventListener("touchmove", handleTouchMove, { passive: false });
    currentMount.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.requestAnimationFrame(() => {
      handleResize();
      focusViewport();
    });

    const drawMinimap = () => {
      const canvas = minimapRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Map scale based on grid size
      const scale = Math.min(w / gridWidth, h / gridHeight) * 0.85;
      const offsetX = (w - gridWidth * scale) / 2;
      const offsetY = (h - gridHeight * scale) / 2;

      // Draw Grid/Walls
      ctx.fillStyle = "rgba(6, 182, 212, 0.05)";
      for (let gy = 0; gy < gridHeight; gy++) {
        for (let gx = 0; gx < gridWidth; gx++) {
          const isWall = layout[gy][gx] === "#";
          if (isWall) {
            ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
            ctx.fillRect(offsetX + gx * scale, offsetY + gy * scale, scale - 1, scale - 1);
          } else {
            ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
            ctx.strokeRect(offsetX + gx * scale, offsetY + gy * scale, scale, scale);
          }
        }
      }

      // Draw Puzzles/Gates
      for (const puzzle of puzzleInstances) {
        if (puzzle.activated && puzzle.data.kind !== "lock" && puzzle.data.kind !== "rune_gate") continue;
        const gx = puzzle.data.position.x;
        const gy = puzzle.data.position.y;
        ctx.fillStyle = puzzle.activated ? "rgba(50, 255, 180, 0.2)" : "rgba(255, 159, 28, 0.6)";
        if (puzzle.data.kind === "lock" || puzzle.data.kind === "rune_gate") {
          ctx.fillStyle = puzzle.activated ? "rgba(50, 255, 180, 0.1)" : "rgba(138, 92, 246, 0.7)";
        }
        ctx.fillRect(offsetX + gx * scale + scale * 0.2, offsetY + gy * scale + scale * 0.2, scale * 0.6, scale * 0.6);
      }

      // Draw Artifacts
      for (const artifact of artifactInstances) {
        if (artifact.collected) continue;
        const gx = artifact.data.position.x;
        const gy = artifact.data.position.y;
        const color = rarityColorMap[artifact.data.rarity] || 0xffffff;
        const hex = `#${color.toString(16).padStart(6, "0")}`;
        ctx.fillStyle = hex;
        ctx.beginPath();
        ctx.arc(offsetX + gx * scale + scale / 2, offsetY + gy * scale + scale / 2, scale * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = hex;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Exit
      if (!missionComplete) {
        const ex = activeLevel.exit.x;
        const ey = activeLevel.exit.y;
        ctx.strokeStyle = exitUnlocked ? "#66e0ff" : "#ff6688";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(offsetX + ex * scale + scale / 2, offsetY + ey * scale + scale / 2, scale * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Player
      const playerGridX = (playerX / CELL_SIZE) + gridWidth / 2 - 0.5;
      const playerGridY = (playerZ / CELL_SIZE) + gridHeight / 2 - 0.5;

      const px = offsetX + playerGridX * scale + scale / 2;
      const py = offsetY + playerGridY * scale + scale / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-playerYaw); // Canvas rotates opposite to THREE.js yaw for top-down

      // Player Arrow
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -scale * 0.5);
      ctx.lineTo(scale * 0.35, scale * 0.4);
      ctx.lineTo(0, scale * 0.2);
      ctx.lineTo(-scale * 0.35, scale * 0.4);
      ctx.closePath();
      ctx.fill();

      // Player Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ffff";
      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.stroke();

      ctx.restore();
    };

    const stepSimulation = (dt: number) => {
      const nowMs = performance.now();
      portalMesh.rotation.z += 0.01;
      portalMesh.scale.setScalar(1 + Math.sin(nowMs * 0.003) * 0.04);

      if (pausedRef.current) {
        return;
      }

      const turnLeft =
        keyState["a"] ||
        keyState["arrowleft"] ||
        virtualControlState.turn_left;
      const turnRight =
        keyState["d"] ||
        keyState["arrowright"] ||
        virtualControlState.turn_right;
      const forward =
        keyState["w"] ||
        keyState["arrowup"] ||
        virtualControlState.forward ||
        touchGestureForward;
      const backward =
        keyState["s"] ||
        keyState["arrowdown"] ||
        virtualControlState.backward ||
        touchGestureBackward;

      const turnInput = (turnLeft ? 1 : 0) - (turnRight ? 1 : 0);
      const moveInput = (forward ? 1 : 0) - (backward ? 1 : 0);

      if (!missionComplete) {
        playerYaw += turnInput * 2.25 * dt;
        targetCameraTilt = turnInput * 0.05;
      }

      currentCameraTilt += (targetCameraTilt - currentCameraTilt) * 0.1;
      cameraShake = Math.max(0, cameraShake - dt * 0.5);
      screenFlash = Math.max(0, screenFlash - dt * 2.0);

      // Sprint detection
      sprintActive = !missionComplete && (keyState["shift"] || keyState["shiftleft"] || keyState["shiftright"]);

      // Dynamic FOV based on speed and sprint
      const speedBoost = sprintActive ? 12 : (forward ? 8 : 0);
      const targetFov = 78 + speedBoost + (combo >= 5 ? 5 : 0);
      camera.fov += (targetFov - camera.fov) * 0.12;
      camera.updateProjectionMatrix();

      const baseSpeed = isMobile ? 6.8 : 4.2;
      const comboMultiplier = combo >= 5 ? 1.5 : 1.0;
      const sprintMultiplier = sprintActive && forward ? 1.8 : 1.0;
      const moveSpeed = missionComplete ? 0 : baseSpeed * comboMultiplier * sprintMultiplier;

      if (combo >= 5 && simulationFrame % 30 === 0) {
        emitStatus("OVERCLOCK_ACTIVE: Movement speed x1.5");
      }
      if (sprintActive && forward && simulationFrame % 45 === 0) {
        emitStatus("SPRINT: Hold Shift to run faster");
      }
      const desiredDx = Math.sin(playerYaw) * moveInput * moveSpeed * dt;
      const desiredDz = Math.cos(playerYaw) * moveInput * moveSpeed * dt;

      let appliedDx = 0;
      let appliedDz = 0;
      if (canOccupy(playerX + desiredDx, playerZ)) {
        playerX += desiredDx;
        appliedDx = desiredDx;
      }
      if (canOccupy(playerX, playerZ + desiredDz)) {
        playerZ += desiredDz;
        appliedDz = desiredDz;
      }

      const movedDistance = Math.hypot(appliedDx, appliedDz);
      if (movedDistance > 0.0002) {
        bobTimer += dt * 7.5;
        const movementScore = movedDistance * 2.4;
        score += movementScore;
        utilityPoints += movedDistance * 3.4;
        explorationPoints += movementScore;
        lastProgressTimestampMs = performance.now();
      } else {
        bobTimer += dt * 1.8;
      }

      for (const puzzle of puzzleInstances) {
        if (puzzle.activated || puzzle.data.kind !== "pressure_plate") continue;
        const distance = Math.hypot(puzzle.mesh.position.x - playerX, puzzle.mesh.position.z - playerZ);
        if (distance < 0.8) {
          activatePuzzle(puzzle, true);
        }
      }
      autoActivateNearbyRunes();
      autoCollectNearbyArtifacts();

      comboTimer -= 1;

      // Combo warning system
      if (comboTimer <= 60 && comboTimer > 0 && combo >= 3 && !comboWarningShown) {
        emitStatus(`⚡ Combo fading! Collect items to maintain ${combo}x multiplier`);
        comboWarningShown = true;
      }

      if (comboTimer <= 0 && combo > 0) {
        const oldCombo = combo;
        combo = Math.max(0, combo - 1);
        if (oldCombo >= 5) {
          emitStatus(`Combo dropped from ${oldCombo}x to ${combo}x`);
        }
        comboWarningShown = false;
        emitScore(true);
      }

      if (blockedMoveHintCooldownSeconds > 0) {
        blockedMoveHintCooldownSeconds = Math.max(0, blockedMoveHintCooldownSeconds - dt);
      }

      if (!missionComplete && simulationFrame % 120 === 0) {
        const stalledMs = performance.now() - lastProgressTimestampMs;
        if (stalledMs > 9000) {
          emitStatus(
            isMobile
              ? "Tip: hold Forward, turn with Turn L/R, and tap Use near glowing rune nodes."
              : "Tip: move with W/S, turn with A/D, and press E near glowing runes and portal.",
          );
          lastProgressTimestampMs = performance.now();
        }
      }

      if (!missionComplete) {
        energyDecayClock += dt;
        if (energyDecayClock >= 1.2) {
          energyDecayClock = 0;
          updateEnergy(energy - 1);
        }
      }

      maybeUnlockExit();

      const bobAmplitude = movedDistance > 0.0002 ? 0.04 : 0.015;
      const bobOffset = Math.sin(bobTimer) * bobAmplitude;

      const shakeOffset = cameraShakeDir.clone().multiplyScalar(cameraShake);
      camera.position.set(
        playerX + shakeOffset.x,
        EYE_HEIGHT + bobOffset + shakeOffset.y,
        playerZ + shakeOffset.z
      );

      const lookX = playerX + Math.sin(playerYaw);
      const lookZ = playerZ + Math.cos(playerYaw);
      camera.lookAt(lookX, EYE_HEIGHT + bobOffset * 0.45, lookZ);
      camera.rotation.z = currentCameraTilt;

      playerLight.position.set(playerX, EYE_HEIGHT, playerZ);
      const nearest = missionComplete ? null : getNearestInteractionCandidate();
      const hasInteraction = Boolean(nearest);

      if (hasInteraction) {
        playerLight.color.set(0x00ffaa);
        const pulseSpeed = nearest?.type === 'exit' ? 0.015 : 0.01;
        const pulseIntensity = nearest?.type === 'artifact' ? 0.25 : 0.15;
        playerLight.intensity = (isMobile ? 1.2 : 0.95) + Math.sin(nowMs * pulseSpeed) * pulseIntensity;
      } else {
        playerLight.color.set(0xffffff);
        playerLight.intensity = (isMobile ? 0.8 : 0.6) + Math.sin(nowMs * 0.005) * 0.05;
      }

      for (const artifact of artifactInstances) {
        if (artifact.collected) continue;

        // Enhanced rune-based animations
        const runeProps = artifact.runeProps;
        const baseRotation = 0.035;
        const baseBobSpeed = 0.004;
        const baseBobAmplitude = 0.08;

        // Higher multiplier runes spin faster and pulse more dramatically
        const multiplier = runeProps.scoreMultiplier;
        const intensityFactor = (multiplier - 1.0) / 1.5; // Normalize based on multiplier range

        artifact.mesh.rotation.y += baseRotation * (1 + intensityFactor * 0.8);
        const bobSpeed = baseBobSpeed * (1 + intensityFactor * 0.5);
        const bobAmplitude = baseBobAmplitude * (1 + intensityFactor * 0.6);
      }

      simulationFrame += 1;
      if (simulationFrame % 6 === 0) {
        const nearestCandidate = missionComplete ? null : getNearestInteractionCandidate();
        const hint = missionComplete
          ? "Portal traversal complete."
          : formatInteractionHint(nearestCandidate) || null;
        emitInteractionHint(hint, Boolean(nearestCandidate));
      }
      if (simulationFrame % 6 === 0) {
        emitScore();
        emitUtilityPoints();
        emitStructuredScore();
      }
    };

    const animate = () => {
      if (!isMounted || runtimeCrashed) return;
      animationFrameId = window.requestAnimationFrame(animate);

      try {

        const deltaSeconds = Math.min(simulationClock.getDelta(), 0.05);
        simulationAccumulator += deltaSeconds;
        performanceCheckTimer += deltaSeconds;
        performanceFrameCounter += 1;
        performanceTimeAccumulator += deltaSeconds;

        if (performanceCheckTimer >= 2 && performanceFrameCounter > 0 && performanceTimeAccumulator > 0) {
          const fps = performanceFrameCounter / performanceTimeAccumulator;
          const downscaleThreshold = isMobile ? 48 : 45;
          const upscaleThreshold = isMobile ? 58 : 58;
          if (fps < downscaleThreshold && currentDpr > minDpr) {
            currentDpr = Math.max(minDpr, currentDpr - (isMobile ? 0.2 : 0.25));
            renderer.setPixelRatio(currentDpr);
            renderer.setSize(viewportWidth, viewportHeight);
          } else if (fps > upscaleThreshold && currentDpr < maxDpr) {
            currentDpr = Math.min(maxDpr, currentDpr + (isMobile ? 0.15 : 0.25));
            renderer.setPixelRatio(currentDpr);
            renderer.setSize(viewportWidth, viewportHeight);
          }
          performanceCheckTimer = 0;
          performanceFrameCounter = 0;
          performanceTimeAccumulator = 0;
        }

        let subSteps = 0;
        while (simulationAccumulator >= fixedStepSeconds && subSteps < maxSubSteps) {
          stepSimulation(fixedStepSeconds);
          simulationAccumulator -= fixedStepSeconds;
          subSteps++;
        }

        drawMinimap();
        if (flashRef.current) {
          flashRef.current.style.opacity = screenFlash.toString();
        }
        renderer.render(scene, camera);
      } catch (error) {
        runtimeCrashed = true;
        window.cancelAnimationFrame(animationFrameId);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unexpected rendering error";
        onStatusChange?.(`Game paused due to runtime error: ${errorMessage}`);
        onRuntimeError?.(
          `The renderer encountered an error (${errorMessage}). This can happen on some mobile browsers after orientation or memory pressure.`,
        );
      }
    };

    updateEnergy(energy);
    emitRelics();
    emitScore(true);
    emitUtilityPoints(true);
    emitStructuredScore(true);
    onPowerUpChange?.([]);
    setPortalState(false);
    emitInteractionHint("Move close to relics to auto-collect, or press Use near runes and portals.", false);
    emitStatus(
      isMobile
        ? "Use on-screen controls. Move close to relics for auto-pickup. Tap Use near rune nodes."
        : "W/S move, A/D turn, E use. Move close to relics for auto-pickup and use runes to unlock paths.",
    );
    const playerLight = new THREE.PointLight(0xffffff, isMobile ? 0.8 : 0.6, 8);
    playerLight.castShadow = !isMobile;
    scene.add(playerLight);

    animate();

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("hyperborea-control", handleExternalControl as EventListener);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      currentMount.removeEventListener("pointerdown", handleViewportPointerDown);
      currentMount.removeEventListener("touchstart", handleTouchStart);
      currentMount.removeEventListener("touchmove", handleTouchMove);
      currentMount.removeEventListener("touchend", handleTouchEnd);
      resizeObserver?.disconnect();
      onInteractionHintChange?.(null, false);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost as EventListener);
      renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored as EventListener);

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        const materialOrMaterials = mesh.material;
        if (!materialOrMaterials) return;
        const materials = Array.isArray(materialOrMaterials)
          ? materialOrMaterials
          : [materialOrMaterials];
        for (const material of materials) {
          for (const value of Object.values(material as unknown as Record<string, unknown>)) {
            if (isTexture(value)) {
              value.dispose();
            }
          }
          material.dispose();
        }
      });

      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [
    levelDefinition,
    onArtifactCollected,
    onCloverCollect,
    onEnergyChange,
    onPowerUpChange,
    onScoreChange,
    onUtilityPointsChange,
    onStructuredScoreChange,
    onRunComplete,
    onStatusChange,
    onInteractionHintChange,
    sessionId,
  ]);

  return (
    <div className="relative w-full h-full group">
      <div
        ref={mountRef}
        className="w-full h-full"
        aria-label="Hyperborea first-person dungeon canvas"
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] z-[1]" />

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_3px,3px_100%] z-[1] opacity-40" />

      {/* Item Collection Flash */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none bg-white z-[10] opacity-0"
      />

      {/* Neural Minimap Overlay */}
      <div className="absolute bottom-6 right-6 w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.2)] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-80 max-[680px]:hidden">
        <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Neural_Map</span>
        </div>
        <canvas
          ref={minimapRef}
          width={256}
          height={256}
          className="w-full h-full opacity-90"
        />
        <div className="absolute inset-0 scanline opacity-10" />
      </div>
    </div>
  );
}
