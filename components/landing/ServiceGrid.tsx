import React from 'react';

export const ServiceGrid = () => {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xs font-mono text-cyan-500 mb-4 tracking-[0.3em] uppercase">System_Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">INTEGRATED_SERVICES</h3>
          </div>
          <p className="text-zinc-500 text-sm max-w-xs font-mono">V_4.0 // CROSS_CHAIN_COMPATIBLE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[200px]">
          {/* Main AI Card - Large */}
          <div className="md:col-span-6 lg:col-span-8 row-span-2 group relative overflow-hidden rounded-3xl glass-panel p-10 neon-border-hover transition-all cursor-pointer">
            <div className="scanline" />
            <div className="absolute top-0 right-0 p-8 text-6xl opacity-20 group-hover:opacity-40 transition-opacity">🤖</div>
            <div className="relative z-10 h-full flex flex-col justify-end">
              <h4 className="text-3xl font-bold text-white mb-4">Predictive_AI</h4>
              <p className="text-zinc-400 max-w-md leading-relaxed">
                Utilizing xAI-inspired large language models to analyze cross-chain liquidity and sentiment in real-time. Gain the institutional edge.
              </p>
              <div className="mt-8 flex gap-2">
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 text-[10px] font-mono rounded-full border border-cyan-500/20">LIVE_DATA</span>
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-mono rounded-full">MULTI_CHAIN</span>
              </div>
            </div>
          </div>

          {/* Gaming Card - Tall */}
          <div className="md:col-span-6 lg:col-span-4 row-span-3 group relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-500/10 to-black border border-white/5 p-10 hover:border-purple-500/50 transition-all cursor-pointer">
            <div className="h-full flex flex-col">
              <div className="text-5xl mb-6">🎮</div>
              <h4 className="text-2xl font-bold text-white mb-4">Hax_Runner</h4>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                Compete in high-stakes arcade challenges to earn $HAX and exclusive NFT fragments.
              </p>
              <div className="mt-auto pt-8 border-t border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Current_Pool</span>
                  <span className="text-purple-500 font-mono">50,000 $HAX</span>
                </div>
                <button className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors">PLAY_NOW</button>
              </div>
            </div>
          </div>

          {/* Portfolio - Wide */}
          <div className="md:col-span-6 lg:col-span-8 row-span-1 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 px-10 py-8 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-white mb-1">Universal_Portfolio</h4>
              <p className="text-zinc-500 text-sm">Track assets across 15+ chains in one view.</p>
            </div>
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs">₿</div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs">Ξ</div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-xs">◎</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
