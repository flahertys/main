"use client";
import React, { useState } from 'react';
import { CommunityLeaderboard } from './CommunityLeaderboard';
import { NeuralVault } from '../dashboard/NeuralVault';

export const HaxHub = () => {
  const [activeTab, setActiveTab] = useState<'UPGRADES' | 'LEADERBOARD' | 'VAULT'>('UPGRADES');

  const upgrades = [
    { id: 'shield_v2', name: 'Shield_v2.0', cost: 2500, desc: '+2s Duration', icon: '🛡️' },
    { id: 'magnet_v1', name: 'Magnet_Mod', cost: 5000, desc: 'Auto-collects Packets', icon: '🧲' },
    { id: 'multiplier_x2', name: 'Link_Boost', cost: 10000, desc: 'Permanent 1.2x Multiplier', icon: '🚀' },
  ];

  const leaders = [
    { rank: 1, user: "0xCyber_Ghost", score: 1420500, rewards: "5000 $HAX" },
    { rank: 2, user: "Mainframe_Hacker", score: 980200, rewards: "2500 $HAX" },
    { rank: 3, user: "Sol_Whale_01", score: 850000, rewards: "1200 $HAX" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-20 bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 bg-zinc-900/50">
        {(['UPGRADES', 'LEADERBOARD', 'VAULT'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-mono tracking-[0.3em] transition-all
              ${activeTab === tab ? 'bg-cyan-500 text-black font-black' : 'text-zinc-500 hover:text-white'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-10 min-h-[400px]">
        {/* UPGRADES TAB */}
        {activeTab === 'UPGRADES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {upgrades.map((item) => (
              <div key={item.id} className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl hover:border-cyan-500/50 transition-all group">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h4 className="text-white font-bold mb-1 uppercase tracking-tighter">{item.name}</h4>
                <p className="text-zinc-500 text-xs mb-6 leading-relaxed">{item.desc}</p>
                <button className="w-full py-3 bg-white/5 border border-white/10 text-white text-xs font-mono rounded-lg hover:bg-white hover:text-black transition-all">
                  BUY_FOR_{item.cost}_$HAX
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'LEADERBOARD' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CommunityLeaderboard />
          </div>
        )}

        {/* VAULT (LIQUIDITY) TAB */}
        {activeTab === 'VAULT' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <NeuralVault />
          </div>
        )}
      </div>
    </div>
  );
};
