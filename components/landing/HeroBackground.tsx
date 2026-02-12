"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * WebGL animated background for the hero section.
 * Renders a particle field with flowing trading-chart-like lines
 * and floating blockchain node connections on a deep black canvas.
 */
export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    camera.position.set(0, 0, 500);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particle system — floating dots
    const particleCount = 600;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const cyanColor = new THREE.Color(0x00f0ff);
    const blueColor = new THREE.Color(0x3b82f6);
    const dimWhite = new THREE.Color(0x333333);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      const colorChoice = Math.random();
      let color: THREE.Color;
      if (colorChoice < 0.15) {
        color = cyanColor;
      } else if (colorChoice < 0.3) {
        color = blueColor;
      } else {
        color = dimWhite;
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Trading chart lines — flowing wave lines
    const lineCount = 5;
    const lineGroups: THREE.Line[] = [];
    const lineColors = [0x00f0ff, 0x3b82f6, 0x8b5cf6, 0x00f0ff, 0x3b82f6];
    const lineOpacities = [0.4, 0.3, 0.2, 0.25, 0.15];

    for (let l = 0; l < lineCount; l++) {
      const points: THREE.Vector3[] = [];
      const segmentCount = 120;
      const yOffset = (l - lineCount / 2) * 60;

      for (let i = 0; i <= segmentCount; i++) {
        const x = (i / segmentCount - 0.5) * 1400;
        const y = yOffset + Math.sin(i * 0.08 + l * 1.5) * 40 + Math.sin(i * 0.03 + l) * 20;
        const z = -100 - l * 30;
        points.push(new THREE.Vector3(x, y, z));
      }

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: lineColors[l],
        transparent: true,
        opacity: lineOpacities[l],
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lineGroups.push(line);
    }

    // Blockchain node connections — floating connected spheres
    const nodeCount = 12;
    const nodePositions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 300 - 100
      );
      nodePositions.push(pos);

      const nodeGeometry = new THREE.SphereGeometry(3, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0x00f0ff : 0x3b82f6,
        transparent: true,
        opacity: 0.6,
      });
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.copy(pos);
      scene.add(nodeMesh);
      nodeMeshes.push(nodeMesh);
    }

    // Connection lines between nearby nodes
    const connectionThreshold = 300;
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < connectionThreshold) {
          const connGeometry = new THREE.BufferGeometry().setFromPoints([
            nodePositions[i],
            nodePositions[j],
          ]);
          const connMaterial = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
          });
          const connLine = new THREE.Line(connGeometry, connMaterial);
          scene.add(connLine);
        }
      }
    }

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.003;

      // Rotate particles slowly
      particles.rotation.y = time * 0.1;
      particles.rotation.x = Math.sin(time * 0.5) * 0.02;

      // Animate trading lines — shift wave phase
      lineGroups.forEach((line, l) => {
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        const segmentCount = array.length / 3 - 1;
        const yOffset = (l - lineCount / 2) * 60;

        for (let i = 0; i <= segmentCount; i++) {
          array[i * 3 + 1] =
            yOffset +
            Math.sin(i * 0.08 + l * 1.5 + time * 2) * 40 +
            Math.sin(i * 0.03 + l + time * 1.5) * 20;
        }
        posAttr.needsUpdate = true;
      });

      // Float blockchain nodes
      nodeMeshes.forEach((mesh, i) => {
        mesh.position.y = nodePositions[i].y + Math.sin(time * 2 + i) * 8;
        mesh.position.x = nodePositions[i].x + Math.cos(time * 1.5 + i * 0.7) * 5;
      });

      // Subtle camera drift
      camera.position.x = Math.sin(time * 0.3) * 30;
      camera.position.y = Math.cos(time * 0.2) * 15;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
