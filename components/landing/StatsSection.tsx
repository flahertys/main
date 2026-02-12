"use client";

import { TrendingUp, Users, Shield, Zap, LucideIcon } from "lucide-react";
import type { StatItem } from "@/types";

const stats: (StatItem & { icon: LucideIcon })[] = [
  {
    label: "Total Trades",
    value: "1,000+",
    icon: TrendingUp,
  },
  {
    label: "Active Users",
    value: "500+",
    icon: Users,
  },
  {
    label: "Trading Volume",
    value: "$50K+",
    icon: Zap,
  },
  {
    label: "Success Rate",
    value: "99.9%",
    icon: Shield,
  },
];

export function StatsSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#0A0A0A] to-[#050505] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl overflow-hidden"
              >
                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#3B82F6]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                <div className="relative bg-[#111111] border border-white/[0.06] rounded-2xl p-8 group-hover:border-[#00F0FF]/20 transition-all duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:border-[#00F0FF]/20 group-hover:bg-[#00F0FF]/[0.06] transition-all duration-500">
                      <Icon className="w-5 h-5 text-[#00F0FF]" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
