import type { NextConfig } from "next";

const useStaticExport = process.env.NEXT_FORCE_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Enable static export only when explicitly requested.
  // Dynamic routes (OAuth, leaderboard APIs, claim queue) require server output.
  ...(useStaticExport && { output: "export" }),

  // Development optimizations - More permissive
  reactStrictMode: false,

  // Image optimization configuration
  images: {
    // Disable optimization only when forcing static export.
    unoptimized: useStaticExport,
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
  turbopack: {
    root: process.cwd(),
  },

  // Output configuration
  poweredByHeader: false,

  // Compression
  compress: true,

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
