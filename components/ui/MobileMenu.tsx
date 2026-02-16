"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Analytics", href: "#" },
    { name: "Tokenomics", href: "/tokenomics" },
    { name: "Games", href: "/game" },
    { name: "Staking", href: "#" },
  ];

  return (
    <div className="md:hidden">
      {/* Trigger Button */}
      <button 
        onClick={toggleMenu}
        className="p-2 text-white"
        aria-label="Toggle Menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between items-end">
          <span className={`h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-6 translate-y-2 -rotate-45' : 'w-6'}`} />
          <span className={`h-0.5 bg-cyan-500 transition-all duration-300 ${isOpen ? 'opacity-0' : 'w-4'}`} />
          <span className={`h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-6 -translate-y-2 rotate-45' : 'w-5'}`} />
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          onClick={toggleMenu}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 w-[85%] h-full glass-panel z-[70] transform transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'translate-x-0 shadow-[-20px_0_50px_rgba(6,182,212,0.1)]' : 'translate-x-full'}`}>
        <div className="absolute inset-0 scanline opacity-20" />
        <div className="p-8 h-full flex flex-col relative z-10">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.4em]">Neural_Link_Active</span>
            </div>
            <button onClick={toggleMenu} className="text-zinc-500 hover:text-white transition-colors font-mono text-[10px] tracking-widest border border-white/10 px-3 py-1 rounded-full bg-white/5">
              [ CLOSE ]
            </button>
          </div>

          <nav className="flex flex-col gap-6">
            {navLinks.map((link, i) => (
              <Link 
                key={i} 
                href={link.href} 
                onClick={toggleMenu}
                className="group relative"
              >
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-0 h-px bg-cyan-500 group-hover:w-8 transition-all duration-500" />
                <span className="text-5xl font-black text-white tracking-tighter hover:text-cyan-500 transition-all uppercase italic pl-4 block transform hover:translate-x-4">
                  {link.name}
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-8">
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <button className="w-full py-5 bg-white text-black font-black rounded-xl uppercase italic tracking-tighter hover:bg-cyan-500 hover:text-white transition-all shadow-xl">
                CONNECT_WALLET
              </button>
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600 px-2 tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-800" /> V_4.0.2_STABLE
              </span>
              <span className="opacity-50 italic">ENCRYPTED_SESSION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
