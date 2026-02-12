"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Zap, Bot, Lock, BarChart3 } from "lucide-react";
import type { FeatureCardProps } from "@/types";

const features: FeatureCardProps[] = [
  {
    icon: <Zap className="w-10 h-10 text-[#00FF41]" />,
    title: "Lightning-Fast Transactions",
    description:
      "Execute trades in milliseconds on Solana's high-performance blockchain with ultra-low fees.",
  },
  {
    icon: <Bot className="w-10 h-10 text-emerald-400" />,
    title: "AI-Powered Trading Signals",
    description:
      "Advanced algorithms analyze market trends and provide intelligent trading recommendations.",
  },
  {
    icon: <Lock className="w-10 h-10 text-[#00FF41]" />,
    title: "Secure Wallet Integration",
    description:
      "Connect your wallet securely with support for Phantom, Solflare, and other popular wallets.",
  },
  {
    icon: <BarChart3 className="w-10 h-10 text-emerald-400" />,
    title: "Real-Time Analytics",
    description:
      "Track your portfolio performance with comprehensive analytics and detailed insights.",
  },
];

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative h-full">
      {/* Glowing border effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>

      <Card className="relative h-full border-green-700/50 bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-green-900/40 hover:to-emerald-900/40 hover:border-green-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-green-500/20">
        <CardContent className="pt-4 md:pt-6 px-4 md:px-6 flex flex-col h-full">
          <div className="mb-3 md:mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            {icon}
          </div>
          <CardTitle className="mb-2 md:mb-3 text-lg md:text-xl text-green-100 group-hover:text-green-300 transition-colors duration-300">
            {title}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 flex-grow leading-relaxed">
            {description}
          </CardDescription>
          {/* Hidden accent on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl">
            <div className="absolute bottom-4 left-4 text-green-500/40 text-xs font-semibold">
              → Learn more
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 relative">
      {/* Section background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#00FF41] via-[#39FF14] to-[#00FF41] text-transparent bg-clip-text leading-tight">
            Powerful Features
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Everything you need to trade smarter on the Solana blockchain with
            cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
