"use client";
import React, { useState, useEffect } from 'react';

const activities = [
  "SYSTEM_ALERT: $HAX Staking Pool V2 live.",
  "USER_ACTION: 0x...4f2 connected to Ethereum Mainnet.",
  "HAX_RUNNER: New High Score (12,400) by Player_99.",
  "AI_SIGNAL: Bearish sentiment detected in SOL/USD.",
  "SYSTEM_LOG: Cross-chain bridge heartbeat nominal.",
  "REWARD_DIST: 500 $HAX distributed to Daily Top 10.",
];

export const LiveActivity = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-zinc-950 border-t border-white/5 py-4 px-6 overflow-hidden">
      <div className="container mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-max">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live_Activity</span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <p className="text-[10px] font-mono text-cyan-500/80 truncate italic">
          {activities[index]}
        </p>
      </div>
    </div>
  );
};
