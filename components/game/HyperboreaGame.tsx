'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface HyperboreaGameProps {
  onEnergyChange?: (energy: number) => void;
  onCloverCollect?: (count: number) => void;
}

export function HyperboreaGame({ onEnergyChange, onCloverCollect }: HyperboreaGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

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

    // Create player (wireframe sphere)
    const playerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const playerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1, 5);
    scene.add(player);

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

    // Game state
    let energy = 0;
    let cloversCollected = 0;
    const velocity = new THREE.Vector3();
    const moveSpeed = 0.1;
    const keys: Record<string, boolean> = {};

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

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

      // Player movement (WASD)
      velocity.set(0, 0, 0);
      if (keys['w']) velocity.z -= moveSpeed;
      if (keys['s']) velocity.z += moveSpeed;
      if (keys['a']) velocity.x -= moveSpeed;
      if (keys['d']) velocity.x += moveSpeed;

      player.position.add(velocity);

      // Camera follows player with mouse offset
      camera.position.x = player.position.x + mouseX * 5;
      camera.position.z = player.position.z + 10 + mouseY * 3;
      camera.lookAt(player.position);

      // Rotate clovers
      clovers.forEach((clover, index) => {
        if (clover.visible) {
          clover.rotation.z += 0.02;

          // Collision detection
          const distance = player.position.distanceTo(clover.position);
          if (distance < 1) {
            clover.visible = false;
            cloversCollected++;
            energy += 20;
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
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
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
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onEnergyChange, onCloverCollect]);

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
    </div>
  );
}
