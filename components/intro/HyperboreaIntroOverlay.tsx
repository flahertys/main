"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const INTRO_MS = 8000;
const STORAGE_KEY = "tradehaxHyperboreaIntroSeen";

const OFFER_PILLARS = [
  "AI Neural Copilot + Trading Intelligence",
  "Website & App Building for Businesses",
  "Tech Repair + Emergency Service Intake",
  "Guitar Lessons + Artist Growth Systems",
  "Crypto Product Roadmaps + Utility Strategy",
];

export function HyperboreaIntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const hasSeen = window.sessionStorage.getItem(STORAGE_KEY) === "true";

    if (prefersReducedMotion || hasSeen) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const startedAt = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const next = Math.min(1, elapsed / INTRO_MS);
      setProgress(next);
      if (next < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        handleFinish();
      }
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const activePillarIndex = useMemo(() => {
    if (!visible) return 0;
    const segment = 1 / OFFER_PILLARS.length;
    return Math.min(OFFER_PILLARS.length - 1, Math.floor(progress / segment));
  }, [progress, visible]);

  const progressStepClass = useMemo(() => {
    const step = Math.min(10, Math.max(0, Math.round(progress * 10)));
    return `hyperborea-intro-progress-fill--${step}`;
  }, [progress]);

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, "true");
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden bg-black/95 backdrop-blur-sm">
      <div className="hyperborea-intro-grid absolute inset-0" />
      <div className="hyperborea-intro-vignette absolute inset-0" />
      <div className="hyperborea-intro-particles absolute inset-0" />

      <div className="absolute left-1/2 top-1/2 h-[68vmin] w-[68vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" />
      <div className="hyperborea-portal-ring hyperborea-portal-ring--outer" />
      <div className="hyperborea-portal-ring hyperborea-portal-ring--inner" />

      <button
        onClick={handleFinish}
        className="absolute right-5 top-5 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/85 hover:border-cyan-300 hover:text-cyan-200"
      >
        Skip Intro
      </button>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-200">
          <Sparkles className="h-3.5 w-3.5" /> Hyperborea Neural Gate
        </div>

        <h1 className="hyperborea-intro-title mb-3 text-4xl font-black uppercase italic tracking-tight text-white sm:text-6xl">
          TRADEHAX
        </h1>
        <p className="max-w-3xl text-sm text-cyan-100/80 sm:text-base">
          Hyperborea-grade launch system for customers who need AI power, build execution, and elite real-world services in one platform.
        </p>

        <div className="mt-8 w-full max-w-xl rounded-2xl border border-cyan-500/20 bg-black/45 p-4">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Primary Offer Stack</p>
          <ul className="grid gap-2 text-sm sm:text-base">
            {OFFER_PILLARS.map((pillar, index) => {
              const active = index === activePillarIndex;
              return (
                <li
                  key={pillar}
                  className={`rounded-lg px-3 py-2 transition-all ${
                    active
                      ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_24px_rgba(6,182,212,0.3)]"
                      : "bg-white/[0.03] text-zinc-300"
                  }`}
                >
                  {pillar}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8 w-full max-w-xl">
          <div className="h-2 overflow-hidden rounded-full border border-cyan-500/25 bg-black/50">
            <div className={`hyperborea-intro-progress-fill ${progressStepClass}`} />
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-200/70">Booting experience… {Math.min(8, Math.max(0, Math.ceil(progress * 8)))}/8s</p>
        </div>
      </div>
    </div>
  );
}
