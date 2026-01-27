"use client";

import { Wallet, Settings, TrendingUp, LucideIcon } from "lucide-react";
import type { HowItWorksStep } from "@/types";

const steps: HowItWorksStep[] = [
  {
    number: 1,
    title: "Connect Your Wallet",
    description: "Securely link your Solana wallet using Phantom, Solflare, or any compatible wallet adapter.",
  },
  {
    number: 2,
    title: "Configure Trading Strategy",
    description: "Set your trading parameters, risk tolerance, and preferred tokens. Customize your strategy to match your goals.",
  },
  {
    number: 3,
    title: "Let AI Handle The Rest",
    description: "Our AI-powered system monitors markets 24/7 and executes trades automatically based on your strategy.",
  },
];

const icons: LucideIcon[] = [Wallet, Settings, TrendingUp];

function StepCard({ step, Icon }: { step: HowItWorksStep; Icon: LucideIcon }) {
  return (
    <div className="relative">
      {/* Connector line (hidden on last item) */}
      {step.number < 3 && (
        <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 opacity-30"></div>
      )}

      <div className="text-center">
        {/* Number badge */}
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-900">
            <Icon className="w-8 h-8 text-[#00FF41]" />
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
        <p className="text-gray-400 max-w-sm mx-auto">{step.description}</p>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} Icon={icons[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
