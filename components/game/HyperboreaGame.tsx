"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HyperboreaGameProps {
  onEnergyChange?: (energy: number) => void;
  onCloverCollect?: (count: number) => void;
  onScoreChange?: (score: number, combo: number) => void;
  onPowerUpChange?: (powerUps: Array<{ type: string; timeLeft: number }>) => void;
  isPaused?: boolean;
}

type PowerUpType = "odins_shield" | "thors_magnet" | "freyas_double";
type ObstacleType = "icespike" | "frostwall" | "lowbarrier";

interface TrackSegment {
  mesh: THREE.Mesh;
  zPosition: number;
  decorations: THREE.Mesh[];
}

interface Obstacle {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
  type: ObstacleType;
}

interface Collectible {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
  collected: boolean;
}

interface PowerUp {
  mesh: THREE.Mesh;
  lane: number;
  zPosition: number;
  type: PowerUpType;
  collected: boolean;
}

interface TrailParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

function isTexture(value: unknown): value is THREE.Texture {
  return (
    typeof value === "object" &&
    value !== null &&
    "isTexture" in value &&
    (value as { isTexture?: boolean }).isTexture === true
  );
}

// NORDIC/CELTIC HYPERBOREA ENDLESS RUNNER
// Temple Run inspired runner with Norse + cyberpunk art direction
export function HyperboreaGame({
  onEnergyChange,
  onCloverCollect,
  onScoreChange,
  onPowerUpChange,
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
    if (!currentMount.clientWidth || !currentMount.clientHeight) return;

    let isMounted = true;
    let animationFrameId = 0;

    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallViewport = window.matchMedia("(max-width: 900px)").matches;
    const isMobile = isTouchDevice || isSmallViewport;

    // Improve mobile controls and prevent browser gesture conflict while playing.
    currentMount.style.touchAction = "none";
    currentMount.style.overscrollBehavior = "none";

    const maxDpr = isMobile ? 1.5 : 2;
    const initialWidth = Math.max(currentMount.clientWidth, 1);
    const initialHeight = Math.max(currentMount.clientHeight, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0520);
    scene.fog = new THREE.FogExp2(0x0a0520, 0.015);

    const camera = new THREE.PerspectiveCamera(
      75,
      initialWidth / initialHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x4060ff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x80c0ff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
    directionalLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
    scene.add(directionalLight);

    const rimLight1 = new THREE.PointLight(0x00ffaa, 0.6, 50);
    rimLight1.position.set(-15, 8, -20);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(0xff00aa, 0.6, 50);
    rimLight2.position.set(15, 8, -20);
    scene.add(rimLight2);

    const LANE_WIDTH = 3.5;
    const lanes = [-LANE_WIDTH, 0, LANE_WIDTH];
    let currentLane = 1;

    const playerGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e0ff,
      emissive: 0x00e0ff,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(lanes[currentLane], 1.2, 0);
    player.castShadow = true;
    scene.add(player);

    const auraGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    player.add(aura);

    const trackSegments: TrackSegment[] = [];
    const obstacles: Obstacle[] = [];
    const collectibles: Collectible[] = [];
    const powerUps: PowerUp[] = [];
    const trailParticles: TrailParticle[] = [];
    const maxTrailParticles = isMobile ? 40 : 80;

    const createRuneParticle = (position: THREE.Vector3) => {
      if (trailParticles.length >= maxTrailParticles) {
        const oldest = trailParticles.shift();
        if (oldest) {
          scene.remove(oldest.mesh);
          oldest.mesh.geometry.dispose();
          (oldest.mesh.material as THREE.Material).dispose();
        }
      }

      const particleGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.2,
      );

      scene.add(particle);
      trailParticles.push({ mesh: particle, velocity, life: 1.0 });
    };

    const createTrackSegment = (zPos: number): TrackSegment => {
      const trackGeometry = new THREE.BoxGeometry(12, 0.3, 12);
      const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2550,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x0a1530,
        emissiveIntensity: 0.3,
      });
      const track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.position.set(0, 0, zPos);
      track.receiveShadow = true;
      track.castShadow = true;
      scene.add(track);

      const decorations: THREE.Mesh[] = [];

      for (const side of [-5.5, 5.5]) {
        const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
          color: 0x3060a0,
          emissive: 0x2050ff,
          emissiveIntensity: 0.4,
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(side, 1, zPos);
        scene.add(pillar);
        decorations.push(pillar);
      }

      if (Math.random() < 0.3) {
        const crystalGeometry = new THREE.OctahedronGeometry(0.3);
        const crystalMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ffaa,
          emissive: 0x00ffaa,
          emissiveIntensity: 1.0,
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set((Math.random() - 0.5) * 8, 2 + Math.random(), zPos - 5);
        scene.add(crystal);
        decorations.push(crystal);
      }

      return { mesh: track, zPosition: zPos, decorations };
    };

    const createObstacle = (
      zPos: number,
      lane: number,
      type: ObstacleType,
    ): Obstacle => {
      let geometry: THREE.BufferGeometry;
      let yPos = 0;

      if (type === "icespike") {
        geometry = new THREE.ConeGeometry(0.6, 2, 8);
        yPos = 1;
      } else if (type === "frostwall") {
        geometry = new THREE.BoxGeometry(2, 2, 0.6);
        yPos = 1;
      } else {
        geometry = new THREE.BoxGeometry(2, 0.5, 0.8);
        yPos = 0.25;
      }

      const material = new THREE.MeshStandardMaterial({
        color: 0xff3060,
        emissive: 0xff0040,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.6,
      });

      const obstacleMesh = new THREE.Mesh(geometry, material);
      obstacleMesh.position.set(lanes[lane], yPos, zPos);
      obstacleMesh.castShadow = true;
      scene.add(obstacleMesh);

      return { mesh: obstacleMesh, lane, zPosition: zPos, type };
    };

    const createCollectible = (zPos: number, lane: number): Collectible => {
      const geometry = new THREE.TorusKnotGeometry(0.25, 0.08, 32, 8);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffdd00,
        emissive: 0xffdd00,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.9,
      });
      const rune = new THREE.Mesh(geometry, material);
      rune.position.set(lanes[lane], 1.5, zPos);
      scene.add(rune);
      return { mesh: rune, lane, zPosition: zPos, collected: false };
    };

    const createPowerUp = (
      zPos: number,
      lane: number,
      type: PowerUpType,
    ): PowerUp => {
      const geometry = new THREE.IcosahedronGeometry(0.5, 0);
      const colors: Record<PowerUpType, number> = {
        odins_shield: 0x00ddff,
        thors_magnet: 0xff00ff,
        freyas_double: 0xff8800,
      };
      const material = new THREE.MeshStandardMaterial({
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 1.5,
        roughness: 0,
        metalness: 1,
      });
      const powerUpMesh = new THREE.Mesh(geometry, material);
      powerUpMesh.position.set(lanes[lane], 2, zPos);
      scene.add(powerUpMesh);
      return { mesh: powerUpMesh, lane, zPosition: zPos, type, collected: false };
    };

    const emitPowerUps = (active: Array<{ type: PowerUpType; timeLeft: number }>) => {
      onPowerUpChange?.(
        active.map((value) => ({
          type: value.type,
          timeLeft: value.timeLeft,
        })),
      );
    };

    const getClosestLane = () => {
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < lanes.length; i++) {
        const distance = Math.abs(player.position.x - lanes[i]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }
      return bestIndex;
    };

    const initialTrackSegments = isMobile ? 18 : 25;
    for (let i = 0; i < initialTrackSegments; i++) {
      trackSegments.push(createTrackSegment(-i * 12));
    }

    let gameSpeed = 0.18;
    let distance = 0;
    let score = 0;
    let runesCollected = 0;
    let combo = 0;
    let comboTimer = 0;
    let energy = 0;
    let isJumping = false;
    let jumpVelocity = 0;
    let isSliding = false;
    let slideTimer = 0;
    let isDead = false;
    let hasEmittedGameOver = false;
    let frameCount = 0;

    const activePowerUps: Array<{ type: PowerUpType; timeLeft: number }> = [];
    let hasShield = false;
    let hasMagnet = false;
    let hasDouble = false;

    let lastSpawnZ = -60;
    const spawnInterval = isMobile ? 20 : 18;
    const obstacleTypes: ObstacleType[] = ["icespike", "frostwall", "lowbarrier"];
    const powerUpTypes: PowerUpType[] = ["odins_shield", "thors_magnet", "freyas_double"];

    let touchStartX = 0;
    let touchStartY = 0;
    let simulationAccumulator = 0;
    const fixedStepSeconds = 1 / 60;
    const maxSubSteps = 3;
    const simulationClock = new THREE.Clock();

    const updateEnergy = (nextValue: number) => {
      const normalized = Math.max(0, Math.min(100, Math.round(nextValue)));
      if (normalized !== energy) {
        energy = normalized;
        onEnergyChange?.(energy);
      }
    };

    const spawnObjects = () => {
      if (trackSegments.length === 0) return;
      const nearestTrack = trackSegments[trackSegments.length - 1].zPosition;
      if (Math.abs(lastSpawnZ) - Math.abs(nearestTrack) >= spawnInterval) return;

      lastSpawnZ -= spawnInterval;
      const pattern = Math.random();

      if (pattern < 0.6) {
        const lane = Math.floor(Math.random() * 3);
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacles.push(createObstacle(lastSpawnZ, lane, type));
      }

      if (Math.random() < 0.7) {
        const runeZ = lastSpawnZ - 6;
        const patternType = Math.floor(Math.random() * 3);

        if (patternType === 0) {
          const lane = Math.floor(Math.random() * 3);
          for (let i = 0; i < 5; i++) {
            collectibles.push(createCollectible(runeZ - i * 2, lane));
          }
        } else if (patternType === 1) {
          for (let lane = 0; lane < 3; lane++) {
            collectibles.push(createCollectible(runeZ, lane));
          }
        } else {
          for (let i = 0; i < 5; i++) {
            collectibles.push(createCollectible(runeZ - i * 2, i % 3));
          }
        }
      }

      if (Math.random() < 0.15) {
        const lane = Math.floor(Math.random() * 3);
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        powerUps.push(createPowerUp(lastSpawnZ - 10, lane, type));
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDead) return;
      const shouldPreventDefault =
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === " " ||
        event.code === "Space";
      if (shouldPreventDefault) {
        event.preventDefault();
      }

      if ((event.key === "ArrowLeft" || event.key === "a") && currentLane > 0) {
        currentLane--;
      }
      if ((event.key === "ArrowRight" || event.key === "d") && currentLane < 2) {
        currentLane++;
      }
      if (
        (event.key === "ArrowUp" || event.key === "w" || event.key === " " || event.code === "Space") &&
        !isJumping &&
        !isSliding
      ) {
        isJumping = true;
        jumpVelocity = 0.3;
      }
      if ((event.key === "ArrowDown" || event.key === "s") && !isJumping && !isSliding) {
        isSliding = true;
        slideTimer = 25;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const shouldPreventDefault =
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === " " ||
        event.code === "Space";
      if (shouldPreventDefault) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isDead || event.changedTouches.length === 0) return;
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 40 && currentLane < 2) currentLane++;
        if (deltaX < -40 && currentLane > 0) currentLane--;
        return;
      }

      if (deltaY < -40 && !isJumping && !isSliding) {
        isJumping = true;
        jumpVelocity = 0.3;
      }
      if (deltaY > 40 && !isJumping && !isSliding) {
        isSliding = true;
        slideTimer = 25;
      }
    };

    const handleResize = () => {
      if (!isMounted) return;
      const nextWidth = Math.max(currentMount.clientWidth, 1);
      const nextHeight = Math.max(currentMount.clientHeight, 1);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(nextWidth, nextHeight, false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);
    currentMount.addEventListener("touchstart", handleTouchStart, { passive: true });
    currentMount.addEventListener("touchend", handleTouchEnd, { passive: true });

    const stepSimulation = () => {
      frameCount++;
      gameSpeed = 0.18 + Math.min(distance * 0.000008, 0.15);
      distance += gameSpeed;

      const targetX = lanes[currentLane];
      player.position.x += (targetX - player.position.x) * 0.2;

      if (isJumping) {
        player.position.y += jumpVelocity;
        jumpVelocity -= 0.018;
        if (player.position.y <= 1.2) {
          player.position.y = 1.2;
          isJumping = false;
          jumpVelocity = 0;
        }
      }

      if (isSliding) {
        player.scale.y = 0.5;
        player.position.y = 0.7;
        slideTimer--;
        if (slideTimer <= 0) {
          isSliding = false;
          player.scale.y = 1;
          player.position.y = 1.2;
        }
      }

      aura.rotation.y += 0.05;
      const pulse = 1 + Math.sin(frameCount * 0.05) * 0.1;
      aura.scale.set(pulse, pulse, pulse);

      if (frameCount % (isMobile ? 4 : 3) === 0) {
        createRuneParticle(player.position.clone());
      }

      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        particle.mesh.position.add(particle.velocity);
        particle.life -= 0.02;
        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = particle.life;
        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          particle.mesh.geometry.dispose();
          material.dispose();
          trailParticles.splice(i, 1);
        }
      }

      for (const segment of trackSegments) {
        segment.zPosition += gameSpeed;
        segment.mesh.position.z = segment.zPosition;
        for (const decoration of segment.decorations) {
          decoration.position.z += gameSpeed;
          decoration.rotation.y += 0.02;
        }
      }

      for (const segment of trackSegments) {
        if (segment.zPosition <= 25) continue;
        const farthestZ = trackSegments.reduce(
          (lowestZ, current) => Math.min(lowestZ, current.zPosition),
          Number.POSITIVE_INFINITY,
        );
        segment.zPosition = farthestZ - 12;
        segment.mesh.position.z = segment.zPosition;
        for (const decoration of segment.decorations) {
          decoration.position.z = segment.zPosition;
        }
      }

      const playerLane = getClosestLane();

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.zPosition += gameSpeed;
        obstacle.mesh.position.z = obstacle.zPosition;
        obstacle.mesh.rotation.y += 0.03;

        if (
          Math.abs(obstacle.zPosition - player.position.z) < 1.2 &&
          obstacle.lane === playerLane
        ) {
          let hit = false;
          if (obstacle.type === "frostwall" && !isJumping) hit = true;
          if (obstacle.type === "lowbarrier" && !isSliding && player.position.y < 2) hit = true;
          if (obstacle.type === "icespike" && !isJumping && !isSliding) hit = true;

          if (hit) {
            if (!hasShield) {
              isDead = true;
            } else {
              hasShield = false;
              scene.remove(obstacle.mesh);
              obstacle.mesh.geometry.dispose();
              (obstacle.mesh.material as THREE.Material).dispose();
              obstacles.splice(i, 1);
            }
          }
        }

        if (obstacle.zPosition > 15) {
          scene.remove(obstacle.mesh);
          obstacle.mesh.geometry.dispose();
          (obstacle.mesh.material as THREE.Material).dispose();
          obstacles.splice(i, 1);
        }
      }

      for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        if (!collectible.collected) {
          collectible.zPosition += gameSpeed;
          collectible.mesh.position.z = collectible.zPosition;
          collectible.mesh.rotation.x += 0.05;
          collectible.mesh.rotation.y += 0.08;

          const magnetRange = hasMagnet ? 4 : 1;
          if (Math.abs(collectible.zPosition - player.position.z) < magnetRange) {
            const laneDistance = Math.abs(collectible.lane - playerLane);
            if (laneDistance <= (hasMagnet ? 1 : 0)) {
              collectible.collected = true;
              scene.remove(collectible.mesh);
              collectible.mesh.geometry.dispose();
              (collectible.mesh.material as THREE.Material).dispose();
              runesCollected++;
              score += hasDouble ? 20 : 10;
              combo++;
              comboTimer = 120;
              updateEnergy(energy + 5);
              onCloverCollect?.(runesCollected);
              onScoreChange?.(score, combo);
            }
          }
        }

        if (collectible.zPosition > 15 || collectible.collected) {
          if (!collectible.collected) {
            scene.remove(collectible.mesh);
            collectible.mesh.geometry.dispose();
            (collectible.mesh.material as THREE.Material).dispose();
          }
          collectibles.splice(i, 1);
        }
      }

      if (comboTimer > 0) {
        comboTimer--;
      } else if (combo > 0) {
        combo = Math.max(0, combo - 1);
        onScoreChange?.(score, combo);
      }

      for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (!powerUp.collected) {
          powerUp.zPosition += gameSpeed;
          powerUp.mesh.position.z = powerUp.zPosition;
          powerUp.mesh.rotation.y += 0.1;
          powerUp.mesh.position.y = 2 + Math.sin(frameCount * 0.05 + i) * 0.3;

          if (
            Math.abs(powerUp.zPosition - player.position.z) < 1.2 &&
            powerUp.lane === playerLane
          ) {
            powerUp.collected = true;
            scene.remove(powerUp.mesh);
            powerUp.mesh.geometry.dispose();
            (powerUp.mesh.material as THREE.Material).dispose();
            activePowerUps.push({ type: powerUp.type, timeLeft: 360 });

            if (powerUp.type === "odins_shield") hasShield = true;
            if (powerUp.type === "thors_magnet") hasMagnet = true;
            if (powerUp.type === "freyas_double") hasDouble = true;
            emitPowerUps(activePowerUps);
          }
        }

        if (powerUp.zPosition > 15 || powerUp.collected) {
          if (!powerUp.collected) {
            scene.remove(powerUp.mesh);
            powerUp.mesh.geometry.dispose();
            (powerUp.mesh.material as THREE.Material).dispose();
          }
          powerUps.splice(i, 1);
        }
      }

      for (let i = activePowerUps.length - 1; i >= 0; i--) {
        const powerUp = activePowerUps[i];
        powerUp.timeLeft -= 1;
        if (powerUp.timeLeft > 0) continue;

        if (powerUp.type === "odins_shield") hasShield = false;
        if (powerUp.type === "thors_magnet") hasMagnet = false;
        if (powerUp.type === "freyas_double") hasDouble = false;
        activePowerUps.splice(i, 1);
        emitPowerUps(activePowerUps);
      }

      spawnObjects();

      score += Math.floor(gameSpeed * 5);
      if (frameCount % 15 === 0) {
        onScoreChange?.(score, combo);
      }

      // Passive energy decay keeps the meter active and visible in long runs.
      if (frameCount % 60 === 0) {
        updateEnergy(energy - 1);
      }

      camera.position.x += (player.position.x - camera.position.x) * 0.1;
      camera.position.z += (player.position.z + 10 - camera.position.z) * 0.05;
      rimLight1.intensity = 0.6 + Math.sin(frameCount * 0.02) * 0.2;
      rimLight2.intensity = 0.6 + Math.cos(frameCount * 0.02) * 0.2;
    };

    const animate = () => {
      if (!isMounted) return;
      animationFrameId = window.requestAnimationFrame(animate);

      const deltaSeconds = Math.min(simulationClock.getDelta(), 0.05);

      if (pausedRef.current) {
        renderer.render(scene, camera);
        return;
      }

      if (isDead) {
        if (!hasEmittedGameOver) {
          hasEmittedGameOver = true;
          emitPowerUps([]);
        }
        renderer.render(scene, camera);
        return;
      }

      simulationAccumulator += deltaSeconds;
      let subSteps = 0;
      while (simulationAccumulator >= fixedStepSeconds && subSteps < maxSubSteps) {
        stepSimulation();
        simulationAccumulator -= fixedStepSeconds;
        subSteps++;
      }

      renderer.render(scene, camera);
    };

    updateEnergy(0);
    onCloverCollect?.(0);
    onScoreChange?.(0, 0);
    emitPowerUps([]);
    animate();

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      currentMount.removeEventListener("touchstart", handleTouchStart);
      currentMount.removeEventListener("touchend", handleTouchEnd);

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
  }, [onCloverCollect, onEnergyChange, onPowerUpChange, onScoreChange]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      aria-label="Hyperborea Game Canvas"
    />
  );
}
