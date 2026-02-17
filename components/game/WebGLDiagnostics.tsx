"use client";

import { useEffect, useState } from "react";

interface WebGLInfo {
  supported: boolean;
  vendor?: string;
  renderer?: string;
  version?: string;
  maxTextureSize?: number;
  maxViewportSize?: string;
  extensions?: string[];
  error?: string;
}

export function WebGLDiagnostics() {
  const [info, setInfo] = useState<WebGLInfo>({ supported: false });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    let isWebGL2 = false;

    try {
      // Try WebGL 2.0 first (Three.js prefers this)
      gl = canvas.getContext("webgl2", { 
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
      }) as WebGL2RenderingContext | null;
      isWebGL2 = true;

      if (!gl) {
        // Fallback to WebGL 1.0
        gl = canvas.getContext("webgl", {
          antialias: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false
        }) as WebGLRenderingContext | null;
        isWebGL2 = false;
      }
    } catch (error) {
      setInfo({
        supported: false,
        error: `WebGL initialization error: ${error instanceof Error ? error.message : String(error)}`
      });
      return;
    }

    if (!gl) {
      setInfo({
        supported: false,
        error: "WebGL context unavailable. Check: 1) Hardware acceleration enabled in Chrome settings. 2) GPU drivers updated. 3) No browser extensions blocking WebGL."
      });
      return;
    }

    try {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const vendor = debugInfo 
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) 
        : gl.getParameter(gl.VENDOR);
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
      const version = gl.getParameter(gl.VERSION);
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxViewportWidth = gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.[0] || 0;
      const maxViewportHeight = gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.[1] || 0;

      // Get supported extensions
      const allExtensions = gl.getSupportedExtensions() || [];
      const keyExtensions = allExtensions.filter(ext => 
        ext.includes("texture") || 
        ext.includes("shader") || 
        ext.includes("shadow") ||
        ext.includes("anisotropic")
      );

      setInfo({
        supported: true,
        vendor: String(vendor),
        renderer: String(renderer),
        version: String(version),
        maxTextureSize,
        maxViewportSize: `${maxViewportWidth}x${maxViewportHeight}`,
        extensions: keyExtensions.slice(0, 10)
      });
    } catch (error) {
      setInfo({
        supported: false,
        error: `Error reading WebGL info: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, []);

  if (!info.supported) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <div className="theme-panel theme-panel--loud p-4 border-2 border-red-500">
          <div className="text-red-300 font-bold mb-2">⚠️ WebGL Not Available</div>
          <p className="text-sm text-red-200 mb-3">{info.error}</p>
          <div className="space-y-2 text-xs text-red-100">
            <div><strong>Fix 1:</strong> Enable Hardware Acceleration</div>
            <div className="ml-2">Settings → Advanced → System → Hardware acceleration: ON</div>
            <div className="mt-2"><strong>Fix 2:</strong> Update GPU Drivers</div>
            <div className="ml-2">NVIDIA/AMD/Intel drivers may need updating</div>
            <div className="mt-2"><strong>Fix 3:</strong> Disable Browser Extensions</div>
            <div className="ml-2">Some extensions block WebGL (try incognito mode)</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="theme-cta theme-cta--secondary theme-cta--compact px-3 py-2 text-xs"
      >
        {showDetails ? "Hide" : "Show"} WebGL Info
      </button>
      {showDetails && (
        <div className="theme-panel theme-panel--success mt-2 p-3 text-xs space-y-1">
          <div><strong>✅ WebGL Available</strong></div>
          <div>Vendor: {info.vendor}</div>
          <div>Renderer: {info.renderer}</div>
          <div>Version: {info.version}</div>
          <div>Max Texture: {info.maxTextureSize}px</div>
          <div>Max Viewport: {info.maxViewportSize}</div>
          {info.extensions && info.extensions.length > 0 && (
            <div className="mt-2">
              <div className="font-bold">Key Extensions:</div>
              <div className="ml-2 text-[10px]">{info.extensions.join(", ")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
