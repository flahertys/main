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
    title: "Configure Strategy",
    description:
      "Set your trading parameters, risk tolerance, and preferred tokens. Customize to match your goals.",
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
    <div className="relative group">
      <div className="text-center">
        {/* Step number + icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Outer ring */}
          <div className="absolute w-28 h-28 rounded-full border border-white/[0.06] group-hover:border-[#00F0FF]/20 transition-all duration-500" />
          {/* Inner circle */}
          <div className="relative w-20 h-20 rounded-full bg-[#111111] border border-white/[0.08] group-hover:border-[#00F0FF]/30 flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <Icon className="w-8 h-8 text-[#00F0FF]" />
          </div>
          {/* Step number badge */}
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#00F0FF] text-black text-xs font-bold flex items-center justify-center">
            {step.number}
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-[#050505] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#00F0FF] text-sm font-medium uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Three simple{" "}
            <span className="bg-gradient-to-r from-[#00F0FF] to-[#3B82F6] text-transparent bg-clip-text">
              steps
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Get started in minutes and let AI do the heavy lifting
          </p>
        </div>

        {/* Connector line (desktop) */}
        <div className="hidden lg:block absolute top-[calc(50%+20px)] left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#00F0FF]/15 to-transparent" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} Icon={icons[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
