"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Solana Blockchain</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 text-transparent bg-clip-text animate-gradient">
          TradeHax AI
        </h1>
        
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
          Automate Your Web3 Trading
        </h2>

        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Advanced trading strategies powered by Solana blockchain and AI. 
          Execute trades at lightning speed with enterprise-grade security.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg group"
            >
              Launch App
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <Button
            size="lg"
            variant="outline"
            className="border-gray-700 hover:bg-gray-800 px-8 py-6 text-lg"
          >
            Learn More
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">1000+</div>
            <div className="text-gray-400">Trades Executed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">$50K+</div>
            <div className="text-gray-400">Trading Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">99.9%</div>
            <div className="text-gray-400">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}
