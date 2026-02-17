"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Zap, Bot, Lock, BarChart3 } from "lucide-react";
import type { FeatureCardProps } from "@/types";

const features: FeatureCardProps[] = [
  {
    icon: <Zap className="w-8 h-8 text-[#00F0FF]" />,
    title: "Lightning-Fast Transactions",
    description:
      "Execute trades in milliseconds on Solana's high-performance blockchain with ultra-low fees.",
  },
  {
    icon: <Bot className="w-8 h-8 text-[#3B82F6]" />,
    title: "AI-Powered Trading Signals",
    description:
      "Advanced algorithms analyze market trends and provide intelligent trading recommendations.",
  },
  {
    icon: <Lock className="w-8 h-8 text-[#00F0FF]" />,
    title: "Secure Wallet Integration",
    description:
      "Connect your wallet securely with support for Phantom, Solflare, and other popular wallets.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-[#3B82F6]" />,
    title: "Real-Time Analytics",
    description:
      "Track your portfolio performance with comprehensive analytics and detailed insights.",
  },
];

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group relative border-white/[0.06] bg-[#111111]/80 backdrop-blur-sm hover:border-[#00F0FF]/20 transition-all duration-500 overflow-hidden rounded-2xl">
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="relative pt-8 pb-8 px-6">
        <div className="mb-5 p-3 w-fit rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:border-[#00F0FF]/20 group-hover:bg-[#00F0FF]/[0.06] transition-all duration-500">
          {icon}
        </div>
        <CardTitle className="mb-3 text-white text-lg font-semibold">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-500 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0A0A0A] to-[#050505] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00F0FF] text-sm font-medium uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Built for{" "}
            <span className="bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] text-transparent bg-clip-text">
              performance
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Everything you need to trade smarter on the Solana blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
