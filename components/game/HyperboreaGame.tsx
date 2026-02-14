"use client";

import { generateDefaultLevel001 } from "@/lib/game/level-generator";
import type {
  ArtifactCollectionEvent,
  HyperboreaLevelDefinition,
  LevelArtifact,
  LevelPuzzleNode,
} from "@/lib/game/level-types";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HyperboreaGameProps {
  onEnergyChange?: (energy: number) => void;
  onCloverCollect?: (count: number) => void;
  onScoreChange?: (score: number, combo: number) => void;
  onPowerUpChange?: (powerUps: Array<{ type: string; timeLeft: number }>) => void;
  onArtifactCollected?: (event: ArtifactCollectionEvent) => void;
  onStatusChange?: (message: string) => void;
  onInteractionHintChange?: (hint: string | null, actionable: boolean) => void;
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
const INTERACT_DISTANCE = 2.7;
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
  "f",
  "enter",
  " ",
  "space",
  "spacebar",
]);
const INTERACT_KEYS = new Set(["e", "f", "enter", " ", "space", "spacebar"]);

export function HyperboreaGame({
  onEnergyChange,
  onCloverCollect,
  onScoreChange,
  onPowerUpChange,
  onArtifactCollected,
  onStatusChange,
  onInteractionHintChange,
  levelDefinition,
  sessionId = "session-local",
  isPaused = false,
}: HyperboreaGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
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

    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallViewport = window.matchMedia("(max-width: 900px)").matches;
    const isMobile = isTouchDevice || isSmallViewport;
    const maxDpr = isMobile ? 1.5 : 2;
    let currentDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    let viewportWidth = Math.max(currentMount.clientWidth || window.innerWidth, 1);
    let viewportHeight = Math.max(currentMount.clientHeight || window.innerHeight, 1);

    currentMount.style.touchAction = "none";
    currentMount.style.overscrollBehavior = "none";
    currentMount.style.backgroundColor = "#0a1020";

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
    for (const artifact of activeLevel.artifacts) {
      const geometry = new THREE.DodecahedronGeometry(0.46);
      const color = rarityColorMap[artifact.rarity] ?? 0xffffff;
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.95,
        roughness: 0.22,
        metalness: 0.84,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const world = gridToWorld(artifact.position.x, artifact.position.y);
      mesh.position.set(world.x, 1.1, world.z);
      mesh.castShadow = true;
      scene.add(mesh);
      artifactInstances.push({ data: artifact, mesh, collected: false });
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

    let energy = 25;
    let score = 0;
    let relicsCollected = 0;
    let combo = 0;
    let comboTimer = 0;
    let energyDecayClock = 0;
    let exitUnlocked = false;
    let missionComplete = false;
    let lastInteractionHint = "";
    let lastHintActionable = false;

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

    let touchRotating = false;
    let touchLastX = 0;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let touchGestureForward = false;
    let touchGestureBackward = false;

    const simulationClock = new THREE.Clock();
    let simulationAccumulator = 0;
    const fixedStepSeconds = 1 / 60;
    const maxSubSteps = 4;
    let simulationFrame = 0;
    let lastScoreSent = Number.NaN;
    let lastComboSent = Number.NaN;

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

    const requirementsMet = (requirements?: string[]) =>
      !requirements || requirements.every(requirementSatisfied);

    const canOccupy = (worldX: number, worldZ: number) => {
      const offsets: Array<[number, number]> = [
        [0, 0],
        [PLAYER_RADIUS, 0],
        [-PLAYER_RADIUS, 0],
        [0, PLAYER_RADIUS],
        [0, -PLAYER_RADIUS],
        [PLAYER_RADIUS * 0.7, PLAYER_RADIUS * 0.7],
        [PLAYER_RADIUS * 0.7, -PLAYER_RADIUS * 0.7],
        [-PLAYER_RADIUS * 0.7, PLAYER_RADIUS * 0.7],
        [-PLAYER_RADIUS * 0.7, -PLAYER_RADIUS * 0.7],
      ];

      for (const [dx, dz] of offsets) {
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
      let moved = false;

      if (canOccupy(playerX + stepDx, playerZ + stepDz)) {
        playerX += stepDx;
        playerZ += stepDz;
        moved = true;
      } else {
        if (canOccupy(playerX + stepDx, playerZ)) {
          playerX += stepDx;
          moved = true;
        }
        if (canOccupy(playerX, playerZ + stepDz)) {
          playerZ += stepDz;
          moved = true;
        }
      }

      if (moved) {
        bobTimer += 0.65;
        score += distance * 2.6;
        emitScore();
      }

      return moved;
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
          emitStatus(`Locked: ${instance.data.label}. Solve prerequisites first.`);
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

      score += 45;
      combo += 1;
      comboTimer = 240;
      updateEnergy(energy + 8);
      emitScore(true);
      emitStatus(`${instance.data.label} activated.`);
      maybeUnlockExit();
    };

    const emitArtifactEvent = (artifact: LevelArtifact) => {
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
        tokenRewardUnits: artifact.tokenRewardUnits,
        claimEndpoint: activeLevel.tokenConfig.claimEndpoint,
        web5Collection: activeLevel.tokenConfig.web5Collection,
        collectedAt: new Date().toISOString(),
      };
      onArtifactCollected(event);
    };

    const collectArtifact = (instance: ArtifactInstance) => {
      if (instance.collected) return;
      if (!requirementsMet(instance.data.puzzleRequirementIds)) {
        emitStatus(`Cannot claim ${instance.data.name} yet. Complete required puzzle nodes.`);
        return;
      }

      instance.collected = true;
      collectedArtifactIds.add(instance.data.id);
      instance.mesh.visible = false;

      relicsCollected = collectedArtifactIds.size;
      emitRelics();

      score += 120 + instance.data.tokenRewardUnits * 2;
      combo += 1;
      comboTimer = 240;
      const rarityEnergyBonus =
        instance.data.rarity === "mythic"
          ? 24
          : instance.data.rarity === "epic"
            ? 18
            : instance.data.rarity === "rare"
              ? 13
              : 9;
      updateEnergy(energy + rarityEnergyBonus);
      emitScore(true);

      emitArtifactEvent(instance.data);
      emitStatus(
        `Relic recovered: ${instance.data.name} (+${instance.data.tokenRewardUnits} ${activeLevel.tokenConfig.l2TokenSymbol})`,
      );
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
        if (distance > INTERACT_DISTANCE) continue;
        if (getForwardAlignment(artifact.mesh.position.x, artifact.mesh.position.z) < 0.2) continue;
        candidates.push({ type: "artifact", distance, instance: artifact });
      }

      for (const puzzle of puzzleInstances) {
        if (puzzle.activated) continue;
        const dx = puzzle.mesh.position.x - playerX;
        const dz = puzzle.mesh.position.z - playerZ;
        const distance = Math.hypot(dx, dz);
        if (distance > INTERACT_DISTANCE) continue;
        if (getForwardAlignment(puzzle.mesh.position.x, puzzle.mesh.position.z) < 0.15) continue;
        candidates.push({ type: "puzzle", distance, instance: puzzle });
      }

      const exitDistance = Math.hypot(exitWorld.x - playerX, exitWorld.z - playerZ);
      if (exitDistance <= INTERACT_DISTANCE && getForwardAlignment(exitWorld.x, exitWorld.z) >= 0.1) {
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
        return `${actionVerb}: collect ${candidate.instance.data.name}`;
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
        emitStatus("No interactable object in range. Move closer and press Use.");
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
      emitScore(true);
      updateEnergy(100);
      onPowerUpChange?.([]);
      emitStatus("Level complete. Portal traversal confirmed.");
      emitInteractionHint("Portal traversal complete.", false);
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

    const handleExternalControl = (event: Event) => {
      const detail = (event as CustomEvent<ExternalControlDetail>).detail;
      const action = detail?.action;
      if (!action) return;

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
      viewportWidth = Math.max(currentMount.clientWidth || window.innerWidth, 1);
      viewportHeight = Math.max(currentMount.clientHeight || window.innerHeight, 1);
      currentDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(currentDpr);
      renderer.setSize(viewportWidth, viewportHeight);
    };

    const handleWindowBlur = () => {
      clearControlState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearControlState();
      }
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
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("hyperborea-control", handleExternalControl as EventListener);
    currentMount.addEventListener("touchstart", handleTouchStart, { passive: false });
    currentMount.addEventListener("touchmove", handleTouchMove, { passive: false });
    currentMount.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.requestAnimationFrame(handleResize);

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
      }

      const moveSpeed = missionComplete ? 0 : isMobile ? 6.8 : 4.2;
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
        score += movedDistance * 2.4;
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

      comboTimer -= 1;
      if (comboTimer <= 0 && combo > 0) {
        combo = Math.max(0, combo - 1);
        emitScore(true);
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
      camera.position.set(playerX, EYE_HEIGHT + bobOffset, playerZ);
      const lookX = playerX + Math.sin(playerYaw);
      const lookZ = playerZ + Math.cos(playerYaw);
      camera.lookAt(lookX, EYE_HEIGHT + bobOffset * 0.45, lookZ);

      for (const artifact of artifactInstances) {
        if (artifact.collected) continue;
        artifact.mesh.rotation.y += 0.035;
        artifact.mesh.position.y = 1.1 + Math.sin(nowMs * 0.004 + artifact.mesh.position.x) * 0.08;
      }

      for (const puzzle of puzzleInstances) {
        puzzle.mesh.rotation.y += puzzle.data.kind === "pressure_plate" ? 0 : 0.009;
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
      }
    };

    const animate = () => {
      if (!isMounted) return;
      animationFrameId = window.requestAnimationFrame(animate);

      const deltaSeconds = Math.min(simulationClock.getDelta(), 0.05);
      simulationAccumulator += deltaSeconds;
      performanceCheckTimer += deltaSeconds;
      performanceFrameCounter += 1;
      performanceTimeAccumulator += deltaSeconds;

      if (performanceCheckTimer >= 2 && performanceFrameCounter > 0 && performanceTimeAccumulator > 0) {
        const fps = performanceFrameCounter / performanceTimeAccumulator;
        if (fps < 45 && currentDpr > 1) {
          currentDpr = Math.max(1, currentDpr - 0.25);
          renderer.setPixelRatio(currentDpr);
          renderer.setSize(viewportWidth, viewportHeight);
        } else if (fps > 58 && currentDpr < maxDpr) {
          currentDpr = Math.min(maxDpr, currentDpr + 0.25);
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

      renderer.render(scene, camera);
    };

    updateEnergy(energy);
    emitRelics();
    emitScore(true);
    onPowerUpChange?.([]);
    setPortalState(false);
    emitInteractionHint("Use crosshair + E (or Use button) near relics and runes.", false);
    emitStatus(
      isMobile
        ? "Use on-screen controls. Fallback: swipe up/down to step move, swipe left/right to turn, tap Use near runes."
        : "W/S move, A/D turn, E use. Solve gates and recover relics.",
    );
    animate();

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("hyperborea-control", handleExternalControl as EventListener);
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
    onStatusChange,
    onInteractionHintChange,
    sessionId,
  ]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      aria-label="Hyperborea first-person dungeon canvas"
    />
  );
}
