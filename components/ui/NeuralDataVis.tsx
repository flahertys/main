"use client";
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const nodes = [
  { id: 1, x: "20%", y: "30%", size: 120, label: "ECOSYSTEM", val: "40%", color: "bg-cyan-500" },
  { id: 2, x: "70%", y: "20%", size: 100, label: "LIQUIDITY", val: "20%", color: "bg-purple-500" },
  { id: 3, x: "50%", y: "60%", size: 90, label: "PUBLIC_SALE", val: "15%", color: "bg-blue-500" },
  { id: 4, x: "25%", y: "75%", size: 85, label: "TEAM", val: "15%", color: "bg-zinc-700" },
  { id: 5, x: "80%", y: "70%", size: 70, label: "ADVISORS", val: "10%", color: "bg-zinc-500" },
];

export const NeuralDataVis = () => {
  return (
    <div className="w-full h-[600px] relative bg-zinc-950/20 rounded-[3rem] border border-white/5 overflow-hidden backdrop-blur-3xl group">
      <div className="absolute inset-0 bg-cyber-grid opacity-10" />
      <div className="scanline opacity-10" />
      
      {/* SVG Connections Line Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <line x1="20%" y1="30%" x2="70%" y2="20%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="20%" y1="30%" x2="50%" y2="60%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="70%" y1="20%" x2="50%" y2="60%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="50%" y1="60%" x2="25%" y2="75%" stroke="url(#lineGrad)" strokeWidth="1" />
        <line x1="50%" y1="60%" x2="80%" y2="70%" stroke="url(#lineGrad)" strokeWidth="1" />
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: node.id * 0.2
          }}
          className="absolute group/node cursor-none"
          style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
        >
          <div 
            className={`relative flex items-center justify-center rounded-full transition-all duration-500 border border-white/10 group-hover/node:border-white/40
              ${node.color} bg-opacity-10 backdrop-blur-md`}
            style={{ width: node.size, height: node.size }}
          >
            {/* Glowing Pulse */}
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${node.color}`} />
            
            <div className="text-center">
              <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter mb-1">{node.label}</p>
              <p className="text-xl font-black text-white italic">{node.val}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Center Intelligence Branding */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <div className="text-[10px] font-mono text-cyan-500 mb-2 tracking-[0.5em] animate-pulse">NEURAL_NETWORK_MAP</div>
        <div className="text-4xl font-black text-white italic uppercase tracking-tighter opacity-10">TradeHax_Cognition</div>
      </div>
    </div>
  );
};
