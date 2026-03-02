"use client";

import Link from "next/link";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import dynamic from "next/dynamic";

const HeroBackground = dynamic(
  () => import("./HeroBackground").then((mod) => ({ default: mod.HeroBackground })),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-black px-4 sm:px-0" aria-label="TradeHax hero">
      {/* WebGL Three.js Background */}
      <HeroBackground />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />

      {/* Radial glow behind content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] sm:w-[620px] sm:h-[620px] lg:w-[800px] lg:h-[800px] bg-[radial-gradient(circle,rgba(0,240,255,0.06)_0%,transparent_70%)] z-[1] pointer-events-none" />
      <div className="mythic-circuit-overlay z-[1]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center pt-10 sm:pt-0">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 mb-8 sm:mb-10 rounded-full border border-[#00F0FF]/20 bg-[#00F0FF]/5 backdrop-blur-md text-[#00F0FF] text-xs sm:text-sm font-medium tracking-wide opacity-0 animate-slide-up-fade [animation-delay:0.1s]"
        >
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
          AI-Powered Multi-Chain Trading · ODIN Lattice
        </div>

        {/* Main headline */}
        <h1
          className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-5 sm:mb-6 opacity-0 animate-slide-up-fade [animation-delay:0.2s]"
        >
          <span className="block sm:inline bg-gradient-to-r from-white via-gray-100 to-gray-300 text-transparent bg-clip-text">
            Trade
          </span>
          <span className="block sm:inline bg-gradient-to-r from-[#00F0FF] via-[#3B82F6] to-[#8B5CF6] text-transparent bg-clip-text">
            Hax
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-base sm:text-xl md:text-2xl lg:text-3xl text-gray-400 font-light mb-4 max-w-3xl mx-auto opacity-0 animate-slide-up-fade [animation-delay:0.35s]"
        >
          Smarter trading through{" "}
          <span className="text-white font-medium">artificial intelligence</span>{" "}
          for{" "}
          <span className="text-[#00F0FF] font-medium">macro + micro pattern probabilities</span>
        </p>

        <p
          className="text-sm sm:text-base md:text-lg text-gray-500 mb-10 sm:mb-12 max-w-2xl mx-auto opacity-0 animate-slide-up-fade [animation-delay:0.45s]"
        >
          Join 10,000+ traders leveraging real-time flow intelligence, catalyst-aware scenario engines,
          and decentralized execution across modern chains.
        </p>

        <p className="mb-8 sm:mb-10 text-[10px] sm:text-xs opacity-0 animate-slide-up-fade [animation-delay:0.5s]">
          <span className="mythic-rune-strip">ᚨ ᛚ ᚷ · Triskelion Flow · Valknut Guard</span>
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-12 sm:mb-16 opacity-0 animate-slide-up-fade [animation-delay:0.55s]"
        >
          <TrackedCtaLink
            href="/dashboard"
            conversionId="open_dashboard"
            surface="landing_hero:primary_cta"
            conversionContext={{ placement: "hero_primary", variant: "dashboard", audience: "all" }}
            ariaLabel="Start trading dashboard"
            className="w-full sm:w-auto rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
          >
            <Button
              size="lg"
              className="relative w-full sm:w-auto bg-[#00F0FF] hover:bg-[#00d4e0] text-black font-semibold px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] group"
            >
              Start Trading
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </TrackedCtaLink>

          <TrackedCtaLink
            href="/game"
            conversionId="open_game"
            surface="landing_hero:secondary_cta"
            conversionContext={{ placement: "hero_secondary", variant: "hyperborea", audience: "all" }}
            ariaLabel="Open Hyperborea experience"
            className="w-full sm:w-auto rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-white/5 backdrop-blur-sm px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg rounded-xl transition-all duration-300 group"
            >
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Play Hyperborea
            </Button>
          </TrackedCtaLink>
        </div>

        {/* Trust metrics — minimal Tesla-style */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto opacity-0 animate-slide-up-fade [animation-delay:0.7s]"
        >
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">10K+</div>
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Traders</div>
            <div className="mt-1 text-[10px] text-cyan-200/70 uppercase tracking-[0.22em]">North Star Cohort</div>
          </div>
          <div className="text-center sm:border-x border-gray-800 py-3 sm:py-0">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">$1M+</div>
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Volume</div>
            <div className="mt-1 text-[10px] text-cyan-200/70 uppercase tracking-[0.22em]">Forgeflow Liquidity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">99.9%</div>
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Uptime</div>
            <div className="mt-1 text-[10px] text-cyan-200/70 uppercase tracking-[0.22em]">Aegis Runtime</div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 opacity-0 animate-slide-up-fade [animation-delay:0.8s]">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] text-cyan-200/75 mb-3">Choose your route</p>
          <div className="grid gap-3 sm:grid-cols-3 text-left">
            <TrackedCtaLink
              href="/ai-hub?route=scout&experience=beginner&skill=beginner#ai-chat-stream"
              conversionId="open_ai_chat"
              surface="landing_hero:route_matrix"
              conversionContext={{ placement: "route_matrix", variant: "scout", audience: "new" }}
              ariaLabel="Open Scout Mode in AI Hub"
              className="interactive-surface rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 sm:p-4 transition-colors hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">Beginner · Scout Mode</p>
              <p className="mt-1 text-sm font-semibold text-emerald-50">Start in 60 seconds</p>
              <p className="mt-1 text-xs text-emerald-100/75">Guided prompts, plain-English recommendations, and one clear next action.</p>
            </TrackedCtaLink>

            <TrackedCtaLink
              href="/ai-hub?route=forge&experience=beginner&skill=intermediate#ai-chat-stream"
              conversionId="open_ai_chat"
              surface="landing_hero:route_matrix"
              conversionContext={{ placement: "route_matrix", variant: "forge", audience: "returning" }}
              ariaLabel="Open Forge Mode in AI Hub"
              className="interactive-surface rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 sm:p-4 transition-colors hover:bg-cyan-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/80">Intermediate · Forge Mode</p>
              <p className="mt-1 text-sm font-semibold text-cyan-50">Run your daily edge loop</p>
              <p className="mt-1 text-xs text-cyan-100/75">Scenario checks, risk boundaries, and faster execution decisions.</p>
            </TrackedCtaLink>

            <TrackedCtaLink
              href="/ai-hub?route=odin&experience=odin&skill=advanced#ai-chat-stream"
              conversionId="open_ai_advanced"
              surface="landing_hero:route_matrix"
              conversionContext={{ placement: "route_matrix", variant: "odin", audience: "returning" }}
              ariaLabel="Open ODIN advanced mode in AI Hub"
              className="interactive-surface rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 p-3 sm:p-4 transition-colors hover:bg-fuchsia-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200/80">Advanced · ODIN Mode</p>
              <p className="mt-1 text-sm font-semibold text-fuchsia-50">Operator-grade control</p>
              <p className="mt-1 text-xs text-fuchsia-100/75">Command workflows, deeper context orchestration, and execution discipline.</p>
            </TrackedCtaLink>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            No steep learning curve: each route adapts language depth, pacing, and decision support to your skill level.
          </p>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-[2] pointer-events-none" />

      {/* Scroll indicator */}
      <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-slide-up-fade [animation-delay:1s]">
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-gray-500 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
