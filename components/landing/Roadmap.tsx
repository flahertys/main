import React from 'react';

const milestones = [
  {
    phase: "PHASE_01: INFRASTRUCTURE",
    status: "COMPLETE",
    title: "Core System Deployment",
    items: ["Bento UI v4.0", "Next.js 14 Framework", "Multi-Chain Ticker Engine", "Rate Limiting & Security Modules"],
    accent: "border-cyan-500",
    glow: "bg-cyan-500/20"
  },
  {
    phase: "PHASE_02: LIQUIDITY & UTILITY",
    status: "ACTIVE",
    title: "LGE & Game Integration",
    items: ["HAX_RUNNER Beta Launch", "Liquidity Pool (LQ) Initialization", "$HAX Tokenomics Audit", "Cross-Chain Bridge testing"],
    accent: "border-purple-500",
    glow: "bg-purple-500/20"
  },
  {
    phase: "PHASE_03: AI SCALING",
    status: "PENDING",
    title: "LLM Market Insights",
    items: ["Live Bloomberg API Integration", "Predictive Trading Signals", "Staking Pool V2", "DAO Governance Beta"],
    accent: "border-zinc-800",
    glow: "bg-zinc-800/20"
  }
];

export const Roadmap = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-xs font-mono text-cyan-500 mb-4 tracking-[0.3em] uppercase italic">System_Timeline</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Strategic_Roadmap</h3>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Central Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500 via-purple-500 to-zinc-900 md:-translate-x-1/2 opacity-30" />

          <div className="space-y-12">
            {milestones.map((m, i) => (
              <div key={i} className={`relative flex flex-col md:flex-row gap-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                {/* Connector Point */}
                <div className="absolute left-0 md:left-1/2 w-3 h-3 rounded-full bg-black border-2 border-current top-0 md:-translate-x-1/2 z-10 hidden md:block" style={{ color: m.accent.split('-')[1] }} />
                
                <div className="flex-1">
                  <div className={`p-8 bg-zinc-950 border-l-4 ${m.accent} rounded-r-2xl md:rounded-2xl md:border-2 transition-all hover:scale-[1.02] cursor-default group overflow-hidden relative`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 ${m.glow} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono text-zinc-500 tracking-widest">{m.phase}</span>
                      <span className={`text-[10px] font-mono px-2 py-1 rounded border ${m.status === 'ACTIVE' ? 'border-cyan-500/50 text-cyan-500 animate-pulse' : 'border-zinc-800 text-zinc-500'}`}>
                        {m.status}
                      </span>
                    </div>

                    <h4 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter italic">{m.title}</h4>
                    
                    <ul className="space-y-2">
                      {m.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-zinc-500 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
