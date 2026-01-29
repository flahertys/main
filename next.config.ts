import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  reactStrictMode: true,
  
  // Disable image optimization for static export
  images: {
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
  
  // Production headers (additional to vercel.json)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
