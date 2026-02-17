"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function SimpleGameTest() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [webglInfo, setWebglInfo] = useState("");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    
    try {
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        setWebglInfo("❌ WebGL not available");
        setStatus("WebGL unavailable - check Chrome settings");
        return;
      }
      setWebglInfo("✅ WebGL available");
    } catch (e) {
      setWebglInfo(`❌ ${String(e)}`);
      return;
    }

    const currentMount = mountRef.current;
    if (!currentMount) return;

    setStatus("Creating Three.js scene...");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    setStatus("Creating cube...");

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    setStatus("Rendering...");

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      currentMount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className="w-full h-screen bg-black">
      <div className="fixed top-4 left-4 text-white text-sm font-mono space-y-2 bg-black/80 p-4 rounded border border-green-500">
        <div>WebGL Diagnostics:</div>
        <div>{webglInfo}</div>
        <div>Status: {status}</div>
        <div className="text-green-400 mt-2">If you see a rotating green cube, Three.js works on your desktop.</div>
      </div>
    </div>
  );
}
