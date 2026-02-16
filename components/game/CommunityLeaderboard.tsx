"use client";
import React from 'react';

const rewardTiers = [
  { tier: "DIAMOND", range: "Rank 1-3", reward: "5,000 $HAX", color: "text-cyan-400" },
  { tier: "PLATINUM", range: "Rank 4-10", reward: "2,500 $HAX", color: "text-purple-400" },
  { tier: "GOLD", range: "Rank 11-50", reward: "1,000 $HAX", color: "text-yellow-400" },
];

const mockLeaders = [
  { rank: 1, wallet: "0x74...f2e", score: 2450800, badge: "MASTER_BREACHER" },
  { rank: 2, wallet: "0x12...9bc", score: 1890200, badge: "NODE_RUNNER" },
  { rank: 3, wallet: "0x88...a12", score: 1420500, badge: "CORE_HACKER" },
  { rank: 4, wallet: "0x45...d44", score: 980100, badge: "SCRIPTER" },
  { rank: 5, wallet: "0x22...e90", score: 750300, badge: "SCRIPTER" },
];

export const CommunityLeaderboard = () => {
  return (
    <div className="w-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h2 className="text-xs font-mono text-cyan-500 mb-2 tracking-[0.5em] uppercase">Global_Standings</h2>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Community_Leaderboard</h3>
        </div>
        <div className="flex gap-4">
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <p className="text-[10px] text-zinc-500 uppercase mb-1">Total_Prize_Pool</p>
            <p className="text-xl font-black text-white italic">250,000 $HAX</p>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
            <p className="text-[10px] text-zinc-500 uppercase mb-1">Time_Remaining</p>
            <p className="text-xl font-black text-cyan-500 italic">14:22:05</p>
          </div>
        </div>
      </div>

      {/* Reward Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {rewardTiers.map((t, i) => (
          <div key={i} className="p-4 border border-white/5 bg-zinc-900/20 rounded-2xl flex justify-between items-center">
            <div>
              <p className={`text-[10px] font-bold ${t.color}`}>{t.tier}</p>
              <p className="text-xs text-zinc-500">{t.range}</p>
            </div>
            <p className="text-sm font-mono text-white">{t.reward}</p>
          </div>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-5 px-6 py-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          <span className="col-span-1">Rank</span>
          <span className="col-span-2">Operator_Wallet</span>
          <span className="col-span-1 text-right">High_Score</span>
          <span className="col-span-1 text-right">Status</span>
        </div>
        
        {mockLeaders.map((l) => (
          <div key={l.rank} className="grid grid-cols-5 px-6 py-5 bg-zinc-900/30 border border-white/5 rounded-2xl items-center hover:bg-zinc-800/40 transition-all group">
            <div className="col-span-1 flex items-center gap-4">
              <span className={`text-xl font-black italic ${l.rank <= 3 ? 'text-cyan-500' : 'text-zinc-600'}`}>
                {l.rank.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="col-span-2">
              <p className="text-white font-mono text-sm group-hover:text-cyan-400 transition-colors cursor-pointer">{l.wallet}</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-tighter">{l.badge}</p>
            </div>
            <div className="col-span-1 text-right">
              <p className="text-white font-mono font-bold">{l.score.toLocaleString()}</p>
            </div>
            <div className="col-span-1 text-right">
              <span className="text-[9px] font-mono px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 uppercase tracking-tighter">
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button className="px-8 py-4 bg-transparent border border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all text-xs font-mono uppercase tracking-[0.2em]">
          Load_Full_Standings_Archive
        </button>
      </div>
    </div>
  );
};
