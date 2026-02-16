import React from 'react';
import Link from 'next/link';

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
    <main className="min-h-screen bg-black py-20 px-6 font-sans">
      <div className="container mx-auto max-w-6xl">
        <Link href="/" className="text-zinc-500 hover:text-white font-mono mb-12 inline-block transition-colors">
          &lt; RETURN_TO_SYSTEM
        </Link>

        {/* Header Section */}
        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 uppercase italic">
            $HAX_TOKENOMICS
          </h1>
          <p className="text-zinc-400 text-xl max-w-3xl leading-relaxed">
            The $HAX token is the multi-chain backbone of the TradeHax ecosystem, facilitating AI-driven insights, gaming rewards, and governance across all integrated networks.
          </p>
        </header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-20">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 bg-zinc-900/50 border border-white/5 rounded-xl">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-xl font-mono text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Allocation & Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-8 tracking-tight">TOKEN_ALLOCATION</h2>
            <div className="space-y-6">
              {allocation.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-300 font-medium">{item.group}</span>
                    <span className="text-white font-bold">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`} 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative aspect-square flex items-center justify-center bg-zinc-900/20 rounded-full border border-white/5 p-12 shadow-[0_0_100px_rgba(6,182,212,0.05)]">
             {/* Simple CSS-based visual representation of a chart */}
             <div className="absolute inset-0 border-[20px] border-cyan-500/10 rounded-full animate-pulse" />
             <div className="text-center">
               <span className="text-6xl font-black italic text-cyan-500">1B</span>
               <p className="text-zinc-500 font-mono text-xs mt-2 uppercase">Total_Supply</p>
             </div>
          </div>
        </div>

        {/* Utility Section */}
        <div className="mb-32">
          <h2 className="text-3xl font-bold mb-12 tracking-tight text-center">CORE_UTILITY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-cyan-500/50 transition-colors">
              <h3 className="text-xl font-bold mb-4">AI Access</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Stake $HAX to unlock high-frequency AI trading signals and advanced market sentiment analysis tools.</p>
            </div>
            <div className="p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-purple-500/50 transition-colors">
              <h3 className="text-xl font-bold mb-4">Game Incentives</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Earn $HAX through high scores in HAX_RUNNER. Use tokens to purchase exclusive in-game power-ups and NFTs.</p>
            </div>
            <div className="p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-blue-500/50 transition-colors">
              <h3 className="text-xl font-bold mb-4">DAO Governance</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Holders vote on project trajectory, new feature prioritization, and multi-chain treasury allocations.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
