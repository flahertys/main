"use client";

import { Wallet, Settings, TrendingUp, LucideIcon } from "lucide-react";
import type { HowItWorksStep } from "@/types";

const steps: HowItWorksStep[] = [
  {
    number: 1,
    title: "Connect Your Wallet",
    description:
      "Securely link your Solana wallet using Phantom, Solflare, or any compatible wallet adapter.",
  },
  {
    number: 2,
    title: "Configure Trading Strategy",
    description:
      "Set your trading parameters, risk tolerance, and preferred tokens. Customize your strategy to match your goals.",
  },
  {
    number: 3,
    title: "Let AI Handle The Rest",
    description:
      "Our AI-powered system monitors markets 24/7 and executes trades automatically based on your strategy.",
  },
];

const icons: LucideIcon[] = [Wallet, Settings, TrendingUp];

function StepCard({ step, Icon }: { step: HowItWorksStep; Icon: LucideIcon }) {
  return (
    <div className="relative group h-full">
      {/* Connector line (hidden on last item) */}
      {step.number < 3 && (
        <div className="hidden lg:block absolute top-12 left-full w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 opacity-20 group-hover:opacity-50 transition-opacity duration-300"></div>
      )}

      <div className="text-center h-full flex flex-col items-center justify-start">
        {/* Enhanced number badge with animation */}
        <div className="relative inline-flex items-center justify-center w-20 md:w-28 h-20 md:h-28 mb-4 md:mb-6">
          {/* Rotating border */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow"></div>

          {/* Circle background */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-600/50"></div>

          {/* Icon container */}
          <div className="relative flex items-center justify-center w-16 md:w-20 h-16 md:h-20 rounded-full bg-gray-950 group-hover:bg-green-950/60 transition-colors duration-300">
            <Icon className="w-8 md:w-10 h-8 md:h-10 text-[#00FF41] group-hover:text-[#39FF14] transition-colors duration-300" />
          </div>

          {/* Step number */}
          <div className="absolute -top-1 -right-1 w-6 md:w-8 h-6 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-xs md:text-sm font-bold text-white group-hover:scale-110 transition-transform duration-300">
            {step.number}
          </div>
        </div>

        <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 text-white group-hover:text-green-300 transition-colors duration-300">
          {step.title}
        </h3>
        <p className="text-sm md:text-base text-gray-400 group-hover:text-gray-300 max-w-sm mx-auto leading-relaxed transition-colors duration-300 px-2">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 relative">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#00FF41] via-[#39FF14] to-[#00FF41] text-transparent bg-clip-text leading-tight">
            How It Works
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-2">
            Get started in three simple steps and join thousands of successful
            traders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-8 items-stretch">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} Icon={icons[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
