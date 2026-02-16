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
      <div className={`fixed top-0 right-0 w-[80%] h-full bg-zinc-950 border-l border-white/5 z-[70] transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-16">
            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">System_Access</span>
            <button onClick={toggleMenu} className="text-zinc-500 hover:text-white transition-colors">
              [ CLOSE ]
            </button>
          </div>

          <nav className="flex flex-col gap-8">
            {navLinks.map((link, i) => (
              <Link 
                key={i} 
                href={link.href} 
                onClick={toggleMenu}
                className="text-4xl font-black text-white tracking-tighter hover:text-cyan-500 transition-colors uppercase italic"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto">
            <button className="w-full py-5 bg-white text-black font-black rounded-full mb-8">
              CONNECT_WALLET
            </button>
            <div className="flex justify-between text-[10px] font-mono text-zinc-600">
              <span>V_4.0.2</span>
              <span>SECURED_SSL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
