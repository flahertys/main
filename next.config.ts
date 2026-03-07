import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { siteConfig } from "./lib/site-config";

const useStaticExport = process.env.NEXT_FORCE_STATIC_EXPORT === "1";

// Bundle analyzer is an optional dev tool; load it only when ANALYZE=true to
// avoid a hard dependency on the package in production builds.
type BundleAnalyzerWrapper = (config: NextConfig) => NextConfig;
const withBundleAnalyzer: BundleAnalyzerWrapper =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("@next/bundle-analyzer") as (opts: { enabled: boolean }) => BundleAnalyzerWrapper)({ enabled: true })
    : (c) => c;

const nextConfig: NextConfig = {
  // Enable static export only when explicitly requested.
  // Dynamic routes (OAuth, leaderboard APIs, claim queue) require server output.
  ...(useStaticExport && { output: "export" }),

  // Keep runtime checks active in development and production.
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    // Disable optimization only when forcing static export.
    unoptimized: useStaticExport,
    remotePatterns: [
      {
        protocol: "https",
        hostname: siteConfig.primarySiteDomain,
      },
      {
        protocol: "https",
        hostname: siteConfig.legacyDomains[1],
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },

  // Experimental features - Enable ALL
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    optimisticClientCache: true,
    // Enable all experimental features for maximum functionality
  },

  // Output configuration
  poweredByHeader: false,

  // Compression
  compress: true,

  // Improve upstream connection reuse under moderate traffic.
  httpAgentOptions: {
    keepAlive: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    if (useStaticExport) {
      return [];
    }
    return [
      // ── Security headers for all routes ──────────────────────────────────
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), usb=()",
          },
        ],
      },
      // ── Immutable cache for fingerprinted static assets ───────────────────
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ── Long cache for public media assets ────────────────────────────────
      {
        source: "/:path*.(woff|woff2|ttf|otf|eot|ico|svg|png|jpg|jpeg|webp|avif|mp3|mp4|webm)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
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

const analyzedConfig = withBundleAnalyzer(nextConfig);

export default withSentryConfig(analyzedConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
