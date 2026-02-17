import React from 'react';
import Link from 'next/link';
import { NeuralDataVis } from '@/components/ui/NeuralDataVis';
import { GlitchText } from '@/components/ui/GlitchText';

const stats = [
  { label: "Total Supply", value: "1,000,000,000 $HAX" },
  { label: "Initial Circulating", value: "150,000,000 $HAX" },
  { label: "Target Market Cap", value: "$50,000,000" },
  { label: "Emission Type", value: "Deflationary" },
];

const allocation = [
  { group: "Ecosystem & Gaming Rewards", percentage: 40, color: "bg-cyan-500" },
  { group: "Public Sale / IDO", percentage: 15, color: "bg-purple-500" },
  { group: "Treasury & Liquidity", percentage: 20, color: "bg-blue-500" },
  { group: "Core Team (Locked)", percentage: 15, color: "bg-zinc-700" },
  { group: "Advisors & Partners", percentage: 10, color: "bg-zinc-500" },
];

export default function TokenomicsPage() {
  return (
    <main className="min-h-screen bg-black py-20 px-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <Link href="/" className="text-zinc-500 hover:text-white font-mono mb-12 inline-block transition-colors">
          &lt; RETURN_TO_SYSTEM
        </Link>

        {/* Header Section */}
        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase italic">
            <GlitchText text="$HAX_TOKENOMICS" />
          </h1>
          <p className="text-zinc-400 text-xl max-w-3xl leading-relaxed">
            The $HAX token is the multi-chain backbone of the TradeHax ecosystem, facilitating AI-driven insights, gaming rewards, and governance across all integrated networks.
          </p>
        </header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl neon-border-hover transition-all group">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2 group-hover:text-cyan-500 transition-colors">{stat.label}</p>
              <p className="text-xl font-mono text-white italic">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Allocation Visualizer */}
        <div className="space-y-12 mb-32">
          <div className="flex justify-between items-end">
             <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Neural_Allocation_Map</h2>
             <span className="text-xs font-mono text-zinc-600 tracking-widest uppercase italic">SYSCAP_V_01</span>
          </div>
          <NeuralDataVis />
        </div>

        {/* Breakdown & Utility */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32 items-start">
          <div>
            <h2 className="text-3xl font-black text-white mb-8 tracking-tight italic uppercase">Supply_Distribution</h2>
            <div className="space-y-6">
              {allocation.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-300 font-medium italic">{item.group}</span>
                    <span className="text-white font-bold">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`} 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-10 glass-panel rounded-[2.5rem] border border-cyan-500/10">
            <h2 className="text-2xl font-black text-white mb-6 italic uppercase tracking-tighter text-cyan-500">Emission_Logic</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 italic">
              TradeHax employs a deflationary emission schedule. Staked liquidity is locked for 90-day intervals, providing consistent pressure against market volatility. 40% of all platform fees are automatically burned.
            </p>
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex justify-between items-center">
               <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Burn_Rate_Multiplier</span>
               <span className="text-xl font-black text-white italic">1.4x</span>
            </div>
          </div>
        </div>

        {/* Utility Section */}
        <div className="mb-32">
          <h2 className="text-3xl font-black mb-12 tracking-tight text-center italic uppercase">CORE_UTILITY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-cyan-500/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-white uppercase italic">AI Access</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Stake $HAX to unlock high-frequency AI trading signals and advanced market sentiment analysis tools.</p>
            </div>
            <div className="p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-purple-500/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-white uppercase italic">Game Incentives</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Earn $HAX through high scores in HAX_RUNNER. Use tokens to purchase exclusive in-game power-ups and NFTs.</p>
            </div>
            <div className="p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-blue-500/50 transition-colors">
              <h3 className="text-xl font-bold mb-4 text-white uppercase italic">DAO Governance</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Holders vote on project trajectory, new feature prioritization, and multi-chain treasury allocations.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
