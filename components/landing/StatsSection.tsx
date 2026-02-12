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
    <section className="py-12 md:py-20 px-4 md:px-6 relative">
      {/* Section background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Enhanced glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-green-600 via-emerald-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300"></div>

                <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-green-700/40 rounded-xl p-4 md:p-6 hover:border-green-500/60 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-green-500/20">
                  <Icon className="w-8 md:w-10 h-8 md:h-10 text-[#00FF41] mb-3 md:mb-4 group-hover:text-[#39FF14] group-hover:scale-125 transition-all duration-300" />
                  <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-transparent bg-clip-text mb-2 group-hover:from-green-300 group-hover:to-emerald-300 transition-all duration-300">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
