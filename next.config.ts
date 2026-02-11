import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages only (not for Vercel)
  // Vercel automatically sets VERCEL=1 environment variable
  ...(process.env.VERCEL !== "1" && { output: "export" }),

  // Development optimizations - More permissive
  reactStrictMode: false,

  // Image optimization configuration
  images: {
    // Use Next.js image optimization on Vercel; only disable when doing static export
    unoptimized: process.env.VERCEL !== "1",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tradehaxai.tech",
      },
      {
        protocol: "https",
        hostname: "tradehaxai.me",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },

  // Experimental features - Enable ALL
  experimental: {
    optimizePackageImports: ["lucide-react", "@solana/wallet-adapter-react"],
    optimisticClientCache: true,
    // Enable all experimental features for maximum functionality
  },

  // Turbopack configuration
  turbopack: {},

  // Output configuration
  poweredByHeader: false,

  // Compression
  compress: true,

  // Development - More permissive
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration - Maximum permissiveness
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Note: Custom headers are not supported with static export.
  // Configure headers at the hosting level (GitHub Pages, Vercel, etc.)
};

export default nextConfig;
