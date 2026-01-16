"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Zap, Bot, Lock, BarChart3 } from "lucide-react";
import type { FeatureCardProps } from "@/types";

const features: FeatureCardProps[] = [
  {
    icon: <Zap className="w-10 h-10 text-purple-400" />,
    title: "Lightning-Fast Transactions",
    description: "Execute trades in milliseconds on Solana's high-performance blockchain with ultra-low fees.",
  },
  {
    icon: <Bot className="w-10 h-10 text-blue-400" />,
    title: "AI-Powered Trading Signals",
    description: "Advanced algorithms analyze market trends and provide intelligent trading recommendations.",
  },
  {
    icon: <Lock className="w-10 h-10 text-purple-400" />,
    title: "Secure Wallet Integration",
    description: "Connect your wallet securely with support for Phantom, Solflare, and other popular wallets.",
  },
  {
    icon: <BarChart3 className="w-10 h-10 text-blue-400" />,
    title: "Real-Time Analytics",
    description: "Track your portfolio performance with comprehensive analytics and detailed insights.",
  },
];

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 hover:scale-105 hover:border-purple-500/30">
      <CardContent className="pt-6">
        <div className="mb-4">{icon}</div>
        <CardTitle className="mb-2 text-white">{title}</CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to trade smarter on the Solana blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
