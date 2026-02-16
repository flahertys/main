"use client";
import React, { useState, useEffect } from 'react';
import { useWallet } from '@/lib/wallet-provider';

export const NeuralVault = () => {
  const { status, balance } = useWallet();
  const [stakeAmount, setStakeAmount] = useState("");
  const [projectedApy, setProjectedApy] = useState(12.5);
  const [isStaking, setIsStaking] = useState(false);

  // Simulation of dynamic APY based on "Neural" activity
  useEffect(() => {
    const interval = setInterval(() => {
      setProjectedApy(prev => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStake = () => {
    if (!stakeAmount) return;
    setIsStaking(true);
    setTimeout(() => {
      setIsStaking(false);
      setStakeAmount("");
      alert("LIQUIDITY_PROVISION_SUCCESSFUL: NEURAL_BRIDGE_ACTIVE");
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Left: Staking Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2rem] backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] group-hover:bg-cyan-500/10 transition-colors" />
          
          <div className="relative z-10">
            <h3 className="text-xs font-mono text-cyan-500 mb-6 tracking-[0.4em] uppercase">Liquidity_Portal</h3>
            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="flex-1 w-full">
                <p className="text-[10px] text-zinc-500 uppercase mb-2 font-mono">Provision_Amount ($HAX)</p>
                <input 
                  type="number" 
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-3xl font-black italic focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-800"
                />
              </div>
              <button 
                onClick={handleStake}
                disabled={status !== 'CONNECTED' || isStaking}
                className={`px-12 py-7 rounded-2xl font-black italic uppercase tracking-tighter transition-all transform hover:scale-105 active:scale-95
                  ${status === 'CONNECTED' 
                    ? 'bg-white text-black hover:bg-cyan-500 hover:text-white shadow-[0_20px_40px_rgba(255,255,255,0.1)]' 
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}
                `}
              >
                {isStaking ? 'PROCESSING...' : 'INIT_STAKE'}
              </button>
            </div>
            
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[25, 50, 75, 100].map(p => (
                <button 
                  key={p}
                  className="py-2 bg-white/5 border border-white/5 rounded-lg text-[10px] font-mono text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  {p}%_MAX
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Neural Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-4 italic">Neural_Yield_Index</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white italic">{projectedApy}%</span>
              <span className="text-xs text-green-500 font-mono">APY</span>
            </div>
            <div className="mt-4 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-500 animate-pulse" style={{ width: `${projectedApy * 2}%` }} />
            </div>
          </div>
          <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase font-mono mb-4 italic">Estimated_Rewards</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white italic">{(+stakeAmount * (projectedApy/100)).toFixed(2)}</span>
              <span className="text-xs text-zinc-500 font-mono">$HAX/YR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: The Core Visualizer */}
      <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="relative z-10">
          <div className="w-48 h-48 rounded-full border border-cyan-500/20 flex items-center justify-center relative mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10 animate-ping" />
            <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="text-5xl">💎</div>
          </div>
          <h4 className="text-xl font-black text-white italic uppercase mb-2">Mainframe_Vault</h4>
          <p className="text-xs text-zinc-500 font-mono mb-8 tracking-widest leading-relaxed">
            TOTAL_VALUE_LOCKED:<br/>
            <span className="text-cyan-500 font-bold">$12,405,200.44</span>
          </p>
          <div className="p-4 bg-black/50 rounded-2xl border border-white/5 text-left space-y-3">
             <div className="flex justify-between text-[9px] font-mono">
                <span className="text-zinc-600">STAKED_HAX</span>
                <span className="text-white">450,000</span>
             </div>
             <div className="flex justify-between text-[9px] font-mono">
                <span className="text-zinc-600">POOL_SHARE</span>
                <span className="text-white">0.045%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
