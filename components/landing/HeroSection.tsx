"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import dynamic from "next/dynamic";

const HeroBackground = dynamic(
  () => import("./HeroBackground").then((mod) => ({ default: mod.HeroBackground })),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* WebGL Three.js Background */}
      <HeroBackground />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />

      {/* Radial glow behind content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,240,255,0.06)_0%,transparent_70%)] z-[1] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2.5 mb-10 rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/5 backdrop-blur-md text-[#00F0FF] text-sm font-medium tracking-wide opacity-0 animate-slide-up-fade"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          AI-Powered Trading on Solana
        </div>

        {/* Main headline */}
        <h1
          className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6 opacity-0 animate-slide-up-fade"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 text-transparent bg-clip-text">
            Trade
          </span>
          <span className="bg-gradient-to-r from-[#00F0FF] via-[#3B82F6] to-[#8B5CF6] text-transparent bg-clip-text">
            Hax
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-xl md:text-2xl lg:text-3xl text-gray-400 font-light mb-4 max-w-3xl mx-auto opacity-0 animate-slide-up-fade"
          style={{ animationDelay: "0.35s" }}
        >
          Smarter trading through{" "}
          <span className="text-white font-medium">artificial intelligence</span>{" "}
          and{" "}
          <span className="text-[#00F0FF] font-medium">Web3</span>
        </p>

        <p
          className="text-base md:text-lg text-gray-500 mb-12 max-w-2xl mx-auto opacity-0 animate-slide-up-fade"
          style={{ animationDelay: "0.45s" }}
        >
          Join 10,000+ traders leveraging automated strategies, real-time AI signals,
          and decentralized execution on Solana.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 opacity-0 animate-slide-up-fade"
          style={{ animationDelay: "0.55s" }}
        >
          <Link href="/dashboard">
            <Button
              size="lg"
              className="relative bg-[#00F0FF] hover:bg-[#00d4e0] text-black font-semibold px-10 py-7 text-lg rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] group"
            >
              Start Trading
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/game">
            <Button
              size="lg"
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-white/5 backdrop-blur-sm px-10 py-7 text-lg rounded-xl transition-all duration-300 group"
            >
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Play Hyperborea
            </Button>
          </Link>
        </div>

        {/* Trust metrics — minimal Tesla-style */}
        <div
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto opacity-0 animate-slide-up-fade"
          style={{ animationDelay: "0.7s" }}
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">10K+</div>
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Traders</div>
          </div>
          <div className="text-center border-x border-gray-800">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">$1M+</div>
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">99.9%</div>
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Uptime</div>
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-[2] pointer-events-none" />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-slide-up-fade" style={{ animationDelay: "1s" }}>
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-gray-500 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
