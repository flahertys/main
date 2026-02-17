"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HyperboreaGameProps {
  onEnergyChange?: (energy: number) => void;
  onCloverCollect?: (count: number) => void;
  onScoreChange?: (score: number, combo: number) => void;
  onPowerUpChange?: (powerUps: Array<{ type: string; timeLeft: number }>) => void;
  isPaused?: boolean;
}

// NORDIC/CELTIC HYPERBOREA ENDLESS RUNNER
// Temple Run meets Norse Mythology with Cyberpunk aesthetics
export function HyperboreaGame({
  onEnergyChange,
  onCloverCollect,
  onScoreChange,
  onPowerUpChange,
  isPaused = false,
}: HyperboreaGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    if (!currentMount.clientWidth || !currentMount.clientHeight) return;

    const scene = new THREE.Scene();
    
    // AURORA BOREALIS SKY - Nordic theme
    scene.background = new THREE.Color(0x0a0520); // Deep purple-blue night sky
    scene.fog = new THREE.FogExp2(0x0a0520, 0.015);

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // LIGHTING - Aurora-inspired
    const ambientLight = new THREE.AmbientLight(0x4060ff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x80c0ff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Atmospheric rim light (aurora glow)
    const rimLight1 = new THREE.PointLight(0x00ffaa, 0.6, 50);
    rimLight1.position.set(-15, 8, -20);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(0xff00aa, 0.6, 50);
    rimLight2.position.set(15, 8, -20);
    scene.add(rimLight2);

    // YGGDRASIL BRANCHES - Running path (3 lanes on mystical tree)
    const LANE_WIDTH = 3.5;
    const lanes = [-LANE_WIDTH, 0, LANE_WIDTH];
    let currentLane = 1;

    // PLAYER - Nordic Warrior with Digital Aura
    const playerGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e0ff, // Cyan warrior
      emissive: 0x00e0ff,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(lanes[currentLane], 1.2, 0);
    player.castShadow = true;
    scene.add(player);

    // Player aura (digital glow)
    const auraGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    player.add(aura);

    // Rune trail particles
    const trailParticles: Array<{
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
    }> = [];

    const createRuneParticle = (pos: THREE.Vector3) => {
      const particleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(pos);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.2
      );

      scene.add(particle);
      trailParticles.push({ mesh: particle, velocity, life: 1.0 });
    };

    // PROCEDURAL YGGDRASIL TRACK (mystical ice bridge)
    interface TrackSegment {
      mesh: THREE.Mesh;
      zPosition: number;
      decorations: THREE.Mesh[];
    }
    const trackSegments: TrackSegment[] = [];

    const createTrackSegment = (zPos: number) => {
      // Main ice bridge with Nordic patterns
      const trackGeometry = new THREE.BoxGeometry(12, 0.3, 12);
      const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2550, // Deep blue ice
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

      // Add glowing rune decorations
      const decorations: THREE.Mesh[] = [];
      
      // Side pillars with runes
      for (let side of [-5.5, 5.5]) {
        const pillarGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0x3060a0,
          emissive: 0x2050ff,
          emissiveIntensity: 0.4,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(side, 1, zPos);
        scene.add(pillar);
        decorations.push(pillar);
      }

      // Floating rune crystals
      if (Math.random() < 0.3) {
        const crystalGeo = new THREE.OctahedronGeometry(0.3);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0x00ffaa,
          emissive: 0x00ffaa,
          emissiveIntensity: 1.0,
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set((Math.random() - 0.5) * 8, 2 + Math.random(), zPos - 5);
        scene.add(crystal);
        decorations.push(crystal);
      }

      return { mesh: track, zPosition: zPos, decorations };
    };

    // Initialize track
    for (let i = 0; i < 25; i++) {
      trackSegments.push(createTrackSegment(-i * 12));
    }

    // OBSTACLES - Norse themed (ice spikes, frost barriers)
    interface Obstacle {
      mesh: THREE.Mesh;
      lane: number;
      zPosition: number;
      type: "icespike" | "frostwall" | "lowbarrier";
    }
    const obstacles: Obstacle[] = [];

    const createObstacle = (zPos: number, lane: number, type: "icespike" | "frostwall" | "lowbarrier") => {
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
        color: 0xff3060, // Red-purple danger
        emissive: 0xff0040,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.6,
      });
      const obstacle = new THREE.Mesh(geometry, material);
      obstacle.position.set(lanes[lane], yPos, zPos);
      obstacle.castShadow = true;
      scene.add(obstacle);

      return { mesh: obstacle, lane, zPosition: zPos, type };
    };

    // COLLECTIBLES - Celtic Knots (glowing runes)
    interface Collectible {
      mesh: THREE.Mesh;
      lane: number;
      zPosition: number;
      collected: boolean;
    }
    const collectibles: Collectible[] = [];

    const createCollectible = (zPos: number, lane: number) => {
      const geometry = new THREE.TorusKnotGeometry(0.25, 0.08, 32, 8);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffdd00, // Golden rune
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

    // POWER-UPS - Norse Gods' Blessings
    interface PowerUp {
      mesh: THREE.Mesh;
      lane: number;
      zPosition: number;
      type: "odins_shield" | "thors_magnet" | "freyas_double";
      collected: boolean;
    }
    const powerUps: PowerUp[] = [];

    const createPowerUp = (zPos: number, lane: number, type: "odins_shield" | "thors_magnet" | "freyas_double") => {
      const geometry = new THREE.IcosahedronGeometry(0.5, 0);
      const colors = {
        odins_shield: 0x00ddff,    // Blue - Odin's protection
        thors_magnet: 0xff00ff,    // Purple - Thor's lightning attraction
        freyas_double: 0xff8800,   // Orange - Freyja's abundance
      };
      const material = new THREE.MeshStandardMaterial({
        color: colors[type],
        emissive: colors[type],
        emissiveIntensity: 1.5,
        roughness: 0,
        metalness: 1,
      });
      const powerUp = new THREE.Mesh(geometry, material);
      powerUp.position.set(lanes[lane], 2, zPos);
      scene.add(powerUp);

      return { mesh: powerUp, lane, zPosition: zPos, type, collected: false };
    };

    // GAME STATE
    let gameSpeed = 0.18;
    let distance = 0;
    let score = 0;
    let runesCollected = 0;
    let combo = 0;
    let comboTimer = 0;
    let isJumping = false;
    let jumpVelocity = 0;
    let isSliding = false;
    let slideTimer = 0;
    let isDead = false;

    const activePowerUps: Array<{ type: string; timeLeft: number }> = [];
    let hasShield = false;
    let hasMagnet = false;
    let hasDouble = false;

    // Spawning logic
    let lastSpawnZ = -60;
    const spawnInterval = 18;

    const spawnObjects = () => {
      const nearestTrack = trackSegments[trackSegments.length - 1].zPosition;
      if (Math.abs(lastSpawnZ) - Math.abs(nearestTrack) < spawnInterval) {
        lastSpawnZ -= spawnInterval;

        const pattern = Math.random();
        
        // Spawn obstacles (60% chance)
        if (pattern < 0.6) {
          const lane = Math.floor(Math.random() * 3);
          const obstacleTypes: ("icespike" | "frostwall" | "lowbarrier")[] = ["icespike", "frostwall", "lowbarrier"];
          const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
          obstacles.push(createObstacle(lastSpawnZ, lane, type));
        }

        // Spawn runes in patterns (70% chance)
        if (Math.random() < 0.7) {
          const runeZ = lastSpawnZ - 6;
          const patternType = Math.floor(Math.random() * 3);
          
          if (patternType === 0) {
            // Single lane
            const lane = Math.floor(Math.random() * 3);
            for (let i = 0; i < 5; i++) {
              collectibles.push(createCollectible(runeZ - i * 2, lane));
            }
          } else if (patternType === 1) {
            // All lanes
            for (let lane = 0; lane < 3; lane++) {
              collectibles.push(createCollectible(runeZ, lane));
            }
          } else {
            // Zigzag
            for (let i = 0; i < 5; i++) {
              const lane = i % 3;
              collectibles.push(createCollectible(runeZ - i * 2, lane));
            }
          }
        }

        // Spawn power-ups (15% chance)
        if (Math.random() < 0.15) {
          const lane = Math.floor(Math.random() * 3);
          const types: ("odins_shield" | "thors_magnet" | "freyas_double")[] = 
            ["odins_shield", "thors_magnet", "freyas_double"];
          const type = types[Math.floor(Math.random() * types.length)];
          powerUps.push(createPowerUp(lastSpawnZ - 10, lane, type));
        }
      }
    };

    // CONTROLS

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDead) return;

      // Lane switching
      if ((e.key === "ArrowLeft" || e.key === "a") && currentLane > 0) {
        currentLane--;
      }
      if ((e.key === "ArrowRight" || e.key === "d") && currentLane < 2) {
        currentLane++;
      }

      // Jump
      if (
        (e.key === "ArrowUp" || e.key === "w" || e.key === " ") &&
        !isJumping &&
        !isSliding
      ) {
        isJumping = true;
        jumpVelocity = 0.3;
      }

      // Slide
      if ((e.key === "ArrowDown" || e.key === "s") && !isJumping && !isSliding) {
        isSliding = true;
        slideTimer = 25;
      }
    };

    const handleKeyUp = (_e: KeyboardEvent) => {
      // No-op for now; kept for potential future use and to match event listener wiring
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isDead) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50 && currentLane < 2) currentLane++;
        if (deltaX < -50 && currentLane > 0) currentLane--;
      } else {
        if (deltaY < -50 && !isJumping && !isSliding) {
          isJumping = true;
          jumpVelocity = 0.3;
        }
        if (deltaY > 50 && !isJumping && !isSliding) {
          isSliding = true;
          slideTimer = 25;
        }
      }
    };

    currentMount.addEventListener("touchstart", handleTouchStart, { passive: true });
    currentMount.addEventListener("touchend", handleTouchEnd, { passive: true });

    // ANIMATION LOOP
    let frameCount = 0;
    const animate = () => {
      requestAnimationFrame(animate);

      if (isPaused || isDead) return;

      frameCount++;

      // Progressive speed increase
      gameSpeed = 0.18 + Math.min(distance * 0.000008, 0.15);
      distance += gameSpeed;

      // Smooth lane switching
      const targetX = lanes[currentLane];
      player.position.x += (targetX - player.position.x) * 0.2;

      // Jump physics
      if (isJumping) {
        player.position.y += jumpVelocity;
        jumpVelocity -= 0.018;

        if (player.position.y <= 1.2) {
          player.position.y = 1.2;
          isJumping = false;
          jumpVelocity = 0;
        }
      }

      // Slide mechanic
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

      // Animate aura
      aura.rotation.y += 0.05;
      aura.scale.set(
        1 + Math.sin(frameCount * 0.05) * 0.1,
        1 + Math.sin(frameCount * 0.05) * 0.1,
        1 + Math.sin(frameCount * 0.05) * 0.1
      );

      // Create rune trail
      if (frameCount % 3 === 0) {
        createRuneParticle(player.position.clone());
      }

      // Update trail particles
      trailParticles.forEach((particle, index) => {
        particle.mesh.position.add(particle.velocity);
        particle.life -= 0.02;
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = particle.life;
        
        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          trailParticles.splice(index, 1);
        }
      });

      // Move track
      trackSegments.forEach((segment) => {
        segment.zPosition += gameSpeed;
        segment.mesh.position.z = segment.zPosition;
        
        segment.decorations.forEach((deco) => {
          deco.position.z += gameSpeed;
          deco.rotation.y += 0.02;
        });

        if (segment.zPosition > 25) {
          const lastZ = trackSegments[trackSegments.length - 1].zPosition;
          segment.zPosition = lastZ - 12;
          segment.mesh.position.z = segment.zPosition;
          
          segment.decorations.forEach((deco) => {
            deco.position.z = segment.zPosition;
          });
        }
      });

      // Move and check obstacles
      obstacles.forEach((obstacle, index) => {
        obstacle.zPosition += gameSpeed;
        obstacle.mesh.position.z = obstacle.zPosition;
        obstacle.mesh.rotation.y += 0.03;

        // Collision detection
        const playerLane = Math.round((player.position.x - lanes[0]) / LANE_WIDTH);
        if (Math.abs(obstacle.zPosition - player.position.z) < 1.2 && obstacle.lane === playerLane) {
          let hit = false;

          if (obstacle.type === "frostwall" && !isJumping) hit = true;
          if (obstacle.type === "lowbarrier" && !isSliding && player.position.y < 2) hit = true;
          if (obstacle.type === "icespike" && !isJumping && !isSliding) hit = true;

          if (hit && !hasShield) {
            console.log("Game Over!");
            isDead = true;
          } else if (hit && hasShield) {
            scene.remove(obstacle.mesh);
            obstacles.splice(index, 1);
            hasShield = false;
          }
        }

        if (obstacle.zPosition > 15) {
          scene.remove(obstacle.mesh);
          obstacles.splice(index, 1);
        }
      });

      // Move and collect runes
      collectibles.forEach((rune, index) => {
        if (!rune.collected) {
          rune.zPosition += gameSpeed;
          rune.mesh.position.z = rune.zPosition;
          rune.mesh.rotation.x += 0.05;
          rune.mesh.rotation.y += 0.08;

          const magnetRange = hasMagnet ? 4 : 1;
          const playerLane = Math.round((player.position.x - lanes[0]) / LANE_WIDTH);
          
          if (Math.abs(rune.zPosition - player.position.z) < magnetRange) {
            if (Math.abs(rune.lane - playerLane) <= (hasMagnet ? 1 : 0)) {
              rune.collected = true;
              scene.remove(rune.mesh);
              runesCollected++;
              score += hasDouble ? 20 : 10;
              combo++;
              comboTimer = 120;
              
              if (onCloverCollect) onCloverCollect(runesCollected);
              if (onScoreChange) onScoreChange(score, combo);
            }
          }
        }

        if (rune.zPosition > 15 || rune.collected) {
          if (!rune.collected) scene.remove(rune.mesh);
          collectibles.splice(index, 1);
        }
      });

      // Combo decay
      if (comboTimer > 0) {
        comboTimer--;
      } else if (combo > 0) {
        combo = Math.max(0, combo - 1);
        if (onScoreChange) onScoreChange(score, combo);
      }

      // Move and collect power-ups
      powerUps.forEach((powerUp, index) => {
        if (!powerUp.collected) {
          powerUp.zPosition += gameSpeed;
          powerUp.mesh.position.z = powerUp.zPosition;
          powerUp.mesh.rotation.y += 0.1;
          powerUp.mesh.position.y = 2 + Math.sin(frameCount * 0.05 + index) * 0.3;

          const playerLane = Math.round((player.position.x - lanes[0]) / LANE_WIDTH);
          if (Math.abs(powerUp.zPosition - player.position.z) < 1.2 && powerUp.lane === playerLane) {
            powerUp.collected = true;
            scene.remove(powerUp.mesh);
            
            activePowerUps.push({ type: powerUp.type, timeLeft: 360 });
            
            if (powerUp.type === "odins_shield") hasShield = true;
            if (powerUp.type === "thors_magnet") hasMagnet = true;
            if (powerUp.type === "freyas_double") hasDouble = true;

            if (onPowerUpChange) onPowerUpChange(activePowerUps);
          }
        }

        if (powerUp.zPosition > 15 || powerUp.collected) {
          if (!powerUp.collected) scene.remove(powerUp.mesh);
          powerUps.splice(index, 1);
        }
      });

      // Update power-ups
      activePowerUps.forEach((powerUp, index) => {
        powerUp.timeLeft--;
        if (powerUp.timeLeft <= 0) {
          if (powerUp.type === "odins_shield") hasShield = false;
          if (powerUp.type === "thors_magnet") hasMagnet = false;
          if (powerUp.type === "freyas_double") hasDouble = false;
          activePowerUps.splice(index, 1);
          if (onPowerUpChange) onPowerUpChange(activePowerUps);
        }
      });

      // Spawn new objects
      spawnObjects();

      // Update score
      score += Math.floor(gameSpeed * 5);
      if (frameCount % 15 === 0 && onScoreChange) {
        onScoreChange(score, combo);
      }

      // Camera follow
      camera.position.x += (player.position.x - camera.position.x) * 0.1;
      camera.position.z += (player.position.z + 10 - camera.position.z) * 0.05;

      // Atmospheric lights pulsing
      rimLight1.intensity = 0.6 + Math.sin(frameCount * 0.02) * 0.2;
      rimLight2.intensity = 0.6 + Math.cos(frameCount * 0.02) * 0.2;

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      currentMount.removeEventListener("touchstart", handleTouchStart);
      currentMount.removeEventListener("touchend", handleTouchEnd);
      
      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [isPaused, onCloverCollect, onScoreChange, onPowerUpChange, onEnergyChange]);

  return (
    <div ref={mountRef} className="w-full h-full" aria-label="Hyperborea Game Canvas" />
  );
}
