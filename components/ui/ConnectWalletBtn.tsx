"use client";
import React from 'react';
import { useWallet } from '@/lib/wallet-provider';

export const ConnectWalletBtn = () => {
  const { address, status, connect, disconnect, balance } = useWallet();

  if (status === 'CONNECTING') {
    return (
      <button className="px-6 py-2 bg-zinc-900 border border-white/10 text-cyan-500 text-xs font-mono rounded-full animate-pulse">
        AUTHORIZING...
      </button>
    );
  }

  if (status === 'CONNECTED') {
    return (
      <div className="flex items-center gap-4 bg-zinc-950 border border-white/5 p-1 rounded-full pr-4">
        <div 
          onClick={disconnect}
          className="px-4 py-2 bg-zinc-900 text-zinc-400 text-xs font-mono rounded-full hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-all"
        >
          {address}
        </div>
        <div className="text-[10px] font-mono text-cyan-500">
          {balance} <span className="text-zinc-600">$HAX</span>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={connect}
      className="px-6 py-2 bg-white text-black text-xs font-black rounded-full hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
    >
      CONNECT_SYSTEM
    </button>
  );
};
