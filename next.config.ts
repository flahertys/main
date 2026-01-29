import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  
  // Production optimizations
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tradehaxai.tech',
      },
      {
        protocol: 'https',
        hostname: 'tradehaxai.me',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@solana/wallet-adapter-react'],
  },
  
  // Output configuration
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Note: Custom headers are not supported with static export.
  // Configure headers at the hosting level (GitHub Pages, Vercel, etc.)
};

export default nextConfig;
