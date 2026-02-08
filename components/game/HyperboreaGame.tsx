'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface HyperboreaGameProps {
  onEnergyChange?: (energy: number) => void;
  onCloverCollect?: (count: number) => void;
  onGameStateChange?: (state: 'tutorial' | 'playing' | 'paused') => void;
  onShowTutorial?: () => void;
}

export function HyperboreaGame({ 
  onEnergyChange, 
  onCloverCollect,
  onGameStateChange,
  onShowTutorial
}: HyperboreaGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  
  // Detect if device supports touch
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouchControls(isTouchDevice);
  }, []);

  const playCollectSound = useCallback(() => {
    // Play a simple beep sound using Web Audio API
    if (typeof window === 'undefined') return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Capture the current ref value at the start of the effect
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Create Escher-inspired maze structure
    const createEscherMaze = () => {
      const mazeGroup = new THREE.Group();
      const stairMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.7,
        metalness: 0.3,
        wireframe: false,
      });

      // Create impossible stairs illusion
      const stairGeometry = new THREE.BoxGeometry(2, 0.3, 4);
      const positions = [
        { x: 0, y: 0, z: 0, rotation: 0 },
        { x: 4, y: 1, z: 0, rotation: Math.PI / 2 },
        { x: 4, y: 2, z: 4, rotation: Math.PI },
        { x: 0, y: 3, z: 4, rotation: -Math.PI / 2 },
      ];

      positions.forEach((pos) => {
        const stair = new THREE.Mesh(stairGeometry, stairMaterial);
        stair.position.set(pos.x, pos.y, pos.z);
        stair.rotation.y = pos.rotation;
        stair.castShadow = true;
        stair.receiveShadow = true;
        mazeGroup.add(stair);
      });

      // Add platforms
      const platformGeometry = new THREE.BoxGeometry(8, 0.2, 8);
      const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        roughness: 0.8,
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.y = -0.5;
      platform.receiveShadow = true;
      mazeGroup.add(platform);

      return mazeGroup;
    };

    const maze = createEscherMaze();
    scene.add(maze);

    // Create player (wireframe sphere with glow effect)
    const playerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const playerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1, 5);
    scene.add(player);

    // Add player glow effect
    const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
    });
    const playerGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    player.add(playerGlow);

    // Create clovers (magenta tori)
    const clovers: THREE.Mesh[] = [];
    const cloverGeometry = new THREE.TorusGeometry(0.4, 0.15, 16, 32);
    const cloverMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i < 5; i++) {
      const clover = new THREE.Mesh(cloverGeometry, cloverMaterial);
      const angle = (i / 5) * Math.PI * 2;
      const radius = 6;
      clover.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 2,
        Math.sin(angle) * radius
      );
      clover.rotation.x = Math.PI / 2;
      clovers.push(clover);
      scene.add(clover);
    }

    // Create wormhole portal (initially hidden)
    const portalGeometry = new THREE.TorusGeometry(2, 0.3, 16, 100);
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0,
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(0, 4, 0);
    scene.add(portal);

    // Particle system for collection effects
    const particles: Array<{
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
    }> = [];

    const createParticles = (position: THREE.Vector3, color: number) => {
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });

      for (let i = 0; i < 10; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.3 + 0.1,
          (Math.random() - 0.5) * 0.2
        );

        particles.push({
          mesh: particle,
          velocity,
          life: 1.0,
        });

        scene.add(particle);
      }
    };

    // Game state
    let energy = 0;
    let cloversCollected = 0;
    const velocity = new THREE.Vector3();
    const acceleration = new THREE.Vector3();
    const moveSpeed = 0.15;
    const accelerationRate = 0.008;
    const friction = 0.85;
    const keys: Record<string, boolean> = {};

    // Touch controls state
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let touchDeltaY = 0;

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    // Touch controls
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        touchDeltaX = (currentX - touchStartX) / 100;
        touchDeltaY = (currentY - touchStartY) / 100;
      }
    };

    const handleTouchEnd = () => {
      touchDeltaX = 0;
      touchDeltaY = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Mouse control for camera
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Player movement with acceleration (WASD + Touch)
      acceleration.set(0, 0, 0);
      
      // Keyboard controls
      if (keys['w'] || keys['arrowup']) acceleration.z -= accelerationRate;
      if (keys['s'] || keys['arrowdown']) acceleration.z += accelerationRate;
      if (keys['a'] || keys['arrowleft']) acceleration.x -= accelerationRate;
      if (keys['d'] || keys['arrowright']) acceleration.x += accelerationRate;

      // Touch controls
      if (touchDeltaX !== 0 || touchDeltaY !== 0) {
        acceleration.x += touchDeltaX * accelerationRate * 2;
        acceleration.z += touchDeltaY * accelerationRate * 2;
      }

      // Apply acceleration and friction
      velocity.add(acceleration);
      velocity.multiplyScalar(friction);

      // Limit max speed
      if (velocity.length() > moveSpeed) {
        velocity.normalize().multiplyScalar(moveSpeed);
      }

      player.position.add(velocity);

      // Update player glow based on movement
      if (playerGlow) {
        const speed = velocity.length();
        playerGlow.material.opacity = 0.3 + speed * 2;
        playerGlow.scale.set(1 + speed * 2, 1 + speed * 2, 1 + speed * 2);
      }

      // Camera follows player with mouse offset
      camera.position.x = player.position.x + mouseX * 5;
      camera.position.z = player.position.z + 10 + mouseY * 3;
      camera.lookAt(player.position);

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.mesh.position.add(particle.velocity);
        particle.velocity.y -= 0.01; // gravity
        particle.life -= 0.02;

        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = particle.life;

        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          particles.splice(i, 1);
        }
      }

      // Rotate clovers
      clovers.forEach((clover) => {
        if (clover.visible) {
          clover.rotation.z += 0.02;
          
          // Floating animation
          clover.position.y += Math.sin(Date.now() * 0.003 + clover.position.x) * 0.005;

          // Collision detection
          const distance = player.position.distanceTo(clover.position);
          if (distance < 1) {
            clover.visible = false;
            cloversCollected++;
            energy += 20;
            
            // Create particle effect
            createParticles(clover.position, 0xff00ff);
            
            // Play sound
            playCollectSound();
            
            onEnergyChange?.(energy);
            onCloverCollect?.(cloversCollected);

            // Teleport clover to new random position
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 5;
            clover.position.set(
              Math.cos(angle) * radius,
              2 + Math.random() * 2,
              Math.sin(angle) * radius
            );
            setTimeout(() => {
              clover.visible = true;
            }, 1000);
          }
        }
      });

      // Unlock portal at 100 energy
      if (energy >= 100) {
        portalMaterial.opacity = Math.min(portalMaterial.opacity + 0.01, 0.8);
        portal.rotation.z += 0.05;
        portal.scale.set(
          1 + Math.sin(Date.now() * 0.001) * 0.1,
          1 + Math.sin(Date.now() * 0.001) * 0.1,
          1
        );
      }

      renderer.render(scene, camera);
    };

    // Handle resize
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    setIsLoaded(true);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onEnergyChange, onCloverCollect, playCollectSound]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading Hyperborea...</p>
          </div>
        </div>
      )}
      
      {/* Touch Controls Overlay for Mobile */}
      {showTouchControls && isLoaded && (
        <div className="absolute bottom-20 left-0 right-0 pointer-events-none">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 text-center">
              <p className="text-white text-sm">
                👆 <span className="font-bold">Tap and drag</span> anywhere to move
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
