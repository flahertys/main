"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Check if video should be shown (not on slow connections)
    const nav = navigator as unknown as {
      connection?: { effectiveType?: string };
      mozConnection?: { effectiveType?: string };
      webkitConnection?: { effectiveType?: string };
    };
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;
    const shouldShowVideo =
      !connection || connection.effectiveType !== "slow-2g";
    setShowVideo(shouldShowVideo);

    // Parallax effect
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-12 md:py-20">
      {/* Video Background (optional - loads only if video file exists) */}
      {showVideo && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              videoLoaded ? "opacity-30" : "opacity-0"
            }`}
            poster="/images/hero-fallback.jpg"
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
            <source src="/videos/hero-background.webm" type="video/webm" />
          </video>
          {/* Video overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950"></div>
        </>
      )}

      {/* Fallback gradient background */}
      {(!showVideo || !videoLoaded) && (
        <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/20 to-black"></div>
      )}

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-500/30 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        ></div>
        {/* Additional accent orbs for depth */}
        <div
          className="absolute top-1/3 right-1/3 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </div>

      {/* Content with staggered animation */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 text-center space-y-6 md:space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 text-sm backdrop-blur-sm hover:bg-green-500/30 transition-all duration-300 animate-fade-in">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>Powered by Solana Blockchain</span>
        </div>

        <div className="space-y-2 md:space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 text-transparent bg-clip-text animate-gradient leading-tight">
            TradeHax AI
          </h1>
          <h2 className="text-xl sm:text-3xl md:text-5xl font-bold text-green-100 drop-shadow-lg">
            Trade Smarter with AI + Web3
          </h2>
        </div>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-green-200/80 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
          Join 10,000+ traders earning passive income with advanced automated
          trading strategies powered by Solana blockchain and AI-driven
          insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 md:pt-4">
          <Link href="/dashboard" className="group w-full sm:w-auto px-2">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-6 text-lg shadow-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-105"
            >
              Start Trading (Free)
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/game" className="group w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-green-700 text-green-300 hover:bg-green-900/50 hover:border-green-500 backdrop-blur-sm px-8 py-6 text-lg group transition-all duration-300 group-hover:scale-105"
            >
              <Play className="mr-2 w-5 h-5" />
              Play Hyperborea
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="flex items-center gap-3 text-yellow-400 hover:scale-110 transition-transform duration-300">
            <span className="text-2xl">★★★★★</span>
            <span className="text-green-100 font-semibold text-lg">4.9/5</span>
          </div>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span>from 1,247 verified reviews</span>
            <span className="text-green-400">•</span>
            <span>🔒 Secured by Solana</span>
          </p>
        </div>

        {/* Trust indicators with glass morphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-4">
          {[
            { value: "10,000+", label: "Active Traders" },
            { value: "$1M+", label: "Trading Volume" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="group text-center backdrop-blur-xl bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-700/30 hover:border-green-500/50 hover:from-green-900/40 hover:to-emerald-900/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
            >
              <div className="text-3xl font-bold text-green-100 mb-2 group-hover:text-green-300 transition-colors">
                {stat.value}
              </div>
              <div className="text-gray-400 group-hover:text-gray-300 transition-colors">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
