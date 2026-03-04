"use client";
import { scheduleLinks } from '@/lib/booking';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuPanelId = useId();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "AI Hub", href: "/ai-hub", icon: "🤖" },
    { name: "About", href: "/about", icon: "🛰️" },
    { name: "Music", href: "/music", icon: "🎸" },
    { name: "Tokenomics", href: "/tokenomics", icon: "🪙" },
    { name: "Games", href: "/game", icon: "🎮" },
    { name: "Spades", href: "/spades", icon: "♠️" },
    { name: "Lessons", href: scheduleLinks.guitarLessons, icon: "📚" },
  ];

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Trigger Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/5 transition-colors motion-reduce:transition-none"
        aria-label="Toggle Menu"
        aria-controls={menuPanelId}
      >
        <div className="w-6 h-5 flex flex-col justify-between items-end">
          <span className={`h-0.5 bg-white transition-all duration-300 motion-reduce:transition-none motion-reduce:duration-0 ${isOpen ? 'w-6 translate-y-2 -rotate-45' : 'w-6'}`} />
          <span className={`h-0.5 bg-cyan-500 transition-all duration-300 motion-reduce:transition-none motion-reduce:duration-0 ${isOpen ? 'opacity-0' : 'w-4'}`} />
          <span className={`h-0.5 bg-white transition-all duration-300 motion-reduce:transition-none motion-reduce:duration-0 ${isOpen ? 'w-6 -translate-y-2 rotate-45' : 'w-5'}`} />
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-[5px] z-[60]"
          onClick={toggleMenu}
        />
      )}

      {/* Drawer */}
      <div id={menuPanelId} className={`fixed top-0 right-0 h-full w-[min(90vw,420px)] z-[70] transform transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:duration-0 bg-[rgba(10,12,16,0.9)] supports-[backdrop-filter]:bg-[rgba(10,12,16,0.86)] backdrop-blur-md border-l border-cyan-400/20 ${isOpen ? 'translate-x-0 shadow-[-20px_0_50px_rgba(6,182,212,0.16)]' : 'translate-x-full'}`}>
        <div className="absolute inset-0 scanline opacity-20" />
        <div className="p-5 sm:p-8 h-full flex flex-col relative z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.22em] sm:tracking-[0.4em]">Neural_Link_Active</span>
            </div>
            <button onClick={toggleMenu} className="text-zinc-200 hover:text-white transition-colors motion-reduce:transition-none font-mono text-[11px] tracking-widest border border-white/20 px-3 py-1.5 rounded-full bg-white/10" aria-label="Close mobile menu">
              [ CLOSE ]
            </button>
          </div>

          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={toggleMenu}
                className="group relative rounded-xl border border-white/10 bg-white/[0.03] hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all motion-reduce:transition-none"
              >
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-0 h-px bg-cyan-500 group-hover:w-8 transition-all duration-500 motion-reduce:transition-none" />
                <span className="text-[16px] sm:text-[18px] font-black text-zinc-100 tracking-wide group-hover:text-cyan-300 transition-all motion-reduce:transition-none uppercase italic px-4 py-3.5 flex items-center gap-3 transform group-hover:translate-x-1 motion-reduce:transform-none">
                  <span className="text-base" aria-hidden>{link.icon}</span>
                  <span>{link.name}</span>
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-8">
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 motion-reduce:transition-none" />
              <button className="w-full py-5 bg-white text-black font-black rounded-xl uppercase italic tracking-tighter hover:bg-cyan-500 hover:text-white transition-all motion-reduce:transition-none shadow-xl">
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
