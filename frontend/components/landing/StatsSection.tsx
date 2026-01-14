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
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative group"
              >
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                
                <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                  <Icon className="w-8 h-8 text-purple-400 mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
