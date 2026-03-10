"use client";

import { motion } from "framer-motion";
import { BadgeCheck, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

type HubMetricsRailProps = {
  isCharging: boolean;
  relationshipTier: string;
};

export function HubMetricsRail({ isCharging: _isCharging, relationshipTier }: HubMetricsRailProps) {
  return (
    <>
      <div className="theme-panel p-6 border-cyan-500/20">
        <h3 className="text-xs font-mono text-cyan-500 uppercase tracking-[0.2em] mb-6">Neural_Environment</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2 uppercase">
              <span>Compute Load</span>
              <span className="text-cyan-400">42.8%</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "42.8%" }}
                className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2 uppercase">
              <span>Context Memory</span>
              <span className="text-purple-400">98.2%</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "98.2%" }}
                className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <ShieldAlert className="w-4 h-4 text-zinc-600" />
            <span className="text-[10px] font-mono text-zinc-300 uppercase">Open Responses: On</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-zinc-300 uppercase">Trust Profile: {relationshipTier}</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <Sparkles className="w-4 h-4 text-zinc-600" />
            <span className="text-[10px] font-mono text-zinc-300 uppercase">Creative Tools: On</span>
          </div>
        </div>
      </div>

      <div className="theme-panel p-6 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-lg font-black text-white uppercase italic mb-2">Power User Access</h3>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Unlock unlimited neural generations, HFT signals, and custom fine-tuned models by staking $HAX tokens.
        </p>
        <button className="w-full py-3 bg-cyan-500 text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-colors">
          Review_Staking_Options
        </button>
      </div>
    </>
  );
}
