"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INTRO_MS = 13000;
const REDUCED_MOTION_MS = 4000;
const IMPACT_WINDOW_MS = 2000;
const FINAL_CTA_WINDOW_MS = 2000;
const STORAGE_KEY = "tradehaxHyperboreaIntroSeen";
const AUDIO_PREF_KEY = "tradehaxHyperboreaIntroSound";
const INTRO_COMPLETE_EVENT = "tradehax:intro-complete";

const OFFER_PILLARS = [
  "AI Neural Copilot + Trading Intelligence",
  "Website & App Building for Businesses",
  "Tech Repair + Emergency Service Intake",
  "Guitar Lessons + Artist Growth Systems",
  "Crypto Product Roadmaps + Utility Strategy",
];

const INTRO_SCENES = [
  {
    mode: "Impact",
    headline: "Neural Launch: The Hyperborea Grid Is Live",
    description: "A high-intensity opening engineered for speed, trust, and customer conversion.",
    endAt: 0.18,
  },
  {
    mode: "AI Mode",
    headline: "AI Copilot + Live Market Intelligence",
    description: "Signal analysis, strategy support, and smart guidance for builders, traders, and operators.",
    endAt: 0.38,
  },
  {
    mode: "Build Mode",
    headline: "Websites & Apps Built For Revenue",
    description: "Launch-ready sites, custom app flows, and conversion-focused digital systems for real businesses.",
    endAt: 0.56,
  },
  {
    mode: "Service Mode",
    headline: "Music Academy + Tech Repair",
    description: "Guitar lessons, artist growth tools, and emergency device repair from one trusted brand.",
    endAt: 0.74,
  },
  {
    mode: "Growth Mode",
    headline: "Crypto Roadmaps + Product Strategy",
    description: "Position products, design utility, and scale with practical web3 execution.",
    endAt: 0.9,
  },
  {
    mode: "Universe Mode",
    headline: "One Platform. Multi-Mode. Built To Win.",
    description: "AI hub, intelligence feeds, Hyperborea game experiences, and premium services in one destination.",
    endAt: 1,
  },
];

export function HyperboreaIntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const finishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, "true");

      window.dispatchEvent(
        new CustomEvent(INTRO_COMPLETE_EVENT, {
          detail: {
            source: "hyperborea_intro",
            autoOpenNavigator: true,
            prompt:
              "I just completed the intro. Give me the best route for my goals and include AI Hub, build services, and booking options.",
            preferredMode: "navigator",
          },
        }),
      );
    }
    setVisible(false);
  }, []);

  const playBootChime = useCallback(async () => {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const existingContext = audioContextRef.current;
      const ctx = existingContext ?? new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      gainNode.connect(ctx.destination);

      const oscA = ctx.createOscillator();
      oscA.type = "sine";
      oscA.frequency.setValueAtTime(220, now);
      oscA.frequency.exponentialRampToValueAtTime(330, now + 0.2);
      oscA.connect(gainNode);
      oscA.start(now);
      oscA.stop(now + 0.45);

      const oscB = ctx.createOscillator();
      oscB.type = "triangle";
      oscB.frequency.setValueAtTime(440, now + 0.05);
      oscB.frequency.exponentialRampToValueAtTime(660, now + 0.35);
      oscB.connect(gainNode);
      oscB.start(now + 0.05);
      oscB.stop(now + 0.45);
    } catch {
      // Ignore autoplay/audio context failures silently.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const hasSeen = window.sessionStorage.getItem(STORAGE_KEY) === "true";
    const savedAudioPref = window.localStorage.getItem(AUDIO_PREF_KEY) === "true";

    setReducedMotion(Boolean(prefersReducedMotion));
    setSoundEnabled(savedAudioPref);

    if (hasSeen) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const startedAt = performance.now();
    const duration = prefersReducedMotion ? REDUCED_MOTION_MS : INTRO_MS;
    let raf = 0;

    if (savedAudioPref && !prefersReducedMotion) {
      void playBootChime();
    }

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const next = Math.min(1, elapsed / duration);
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
      if (audioContextRef.current?.state !== "closed") {
        void audioContextRef.current?.close();
      }
      audioContextRef.current = null;
    };
  }, [handleFinish, playBootChime]);

  const activePillarIndex = useMemo(() => {
    if (!visible) return 0;
    const curveProgress = reducedMotion
      ? progress
      : (() => {
          const impactCutoff = IMPACT_WINDOW_MS / INTRO_MS;
          if (progress <= impactCutoff) {
            const normalizedImpact = progress / impactCutoff;
            return 0.38 * Math.pow(normalizedImpact, 0.38);
          }
          const normalizedCruise = (progress - impactCutoff) / (1 - impactCutoff);
          return 0.38 + 0.62 * Math.pow(normalizedCruise, 1.25);
        })();

    const segment = 1 / OFFER_PILLARS.length;
    return Math.min(OFFER_PILLARS.length - 1, Math.floor(curveProgress / segment));
  }, [progress, reducedMotion, visible]);

  const displayProgress = useMemo(() => {
    if (reducedMotion) {
      return progress;
    }

    const impactCutoff = IMPACT_WINDOW_MS / INTRO_MS;
    if (progress <= impactCutoff) {
      const normalizedImpact = progress / impactCutoff;
      return 0.4 * Math.pow(normalizedImpact, 0.34);
    }

    const normalizedCruise = (progress - impactCutoff) / (1 - impactCutoff);
    return 0.4 + 0.6 * Math.pow(normalizedCruise, 1.35);
  }, [progress, reducedMotion]);

  const activeScene = useMemo(() => {
    const scene = INTRO_SCENES.find((item) => displayProgress <= item.endAt);
    return scene ?? INTRO_SCENES[INTRO_SCENES.length - 1];
  }, [displayProgress]);

  const progressStepClass = useMemo(() => {
    const step = Math.min(10, Math.max(0, Math.round(displayProgress * 10)));
    return `hyperborea-intro-progress-fill--${step}`;
  }, [displayProgress]);

  const inImpactWindow = !reducedMotion && progress <= IMPACT_WINDOW_MS / INTRO_MS;
  const showFinalCtaFrame = reducedMotion
    ? progress >= 0.65
    : progress >= (INTRO_MS - FINAL_CTA_WINDOW_MS) / INTRO_MS;

  const handleToggleSound = () => {
    if (typeof window === "undefined") return;

    const next = !soundEnabled;
    setSoundEnabled(next);
    window.localStorage.setItem(AUDIO_PREF_KEY, String(next));

    if (next && visible && !reducedMotion) {
      void playBootChime();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[10000] overflow-hidden bg-black/95 backdrop-blur-sm ${reducedMotion ? "hyperborea-intro--reduced" : ""} ${inImpactWindow ? "hyperborea-intro--impact" : ""}`}>
      <div className="hyperborea-intro-grid absolute inset-0" />
      <div className="hyperborea-intro-vignette absolute inset-0" />
      <div className="hyperborea-intro-particles absolute inset-0" />
      <div className="hyperborea-intro-noise absolute inset-0" />
      <div className="hyperborea-intro-streaks absolute inset-0" />
      <div className="hyperborea-impact-overlay absolute inset-0" />

      <div className="hyperborea-intro-core absolute left-1/2 top-1/2 h-[68vmin] w-[68vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" />
      <div className="hyperborea-portal-ring hyperborea-portal-ring--outer" />
      <div className="hyperborea-portal-ring hyperborea-portal-ring--inner" />
      <div className="hyperborea-portal-ring hyperborea-portal-ring--shock" />

      <button
        onClick={handleToggleSound}
        className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/85 hover:border-cyan-300 hover:text-cyan-200"
      >
        Sound: {soundEnabled ? "On" : "Off"}
      </button>

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

        <div className="mt-5 w-full max-w-3xl rounded-2xl border border-fuchsia-400/20 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-emerald-500/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">{activeScene.mode}</p>
          <h2 className="mt-2 text-lg font-black uppercase tracking-wide text-white sm:text-2xl">{activeScene.headline}</h2>
          <p className="mt-2 text-sm text-cyan-100/80">{activeScene.description}</p>
        </div>

        <p className="mt-4 max-w-3xl text-[11px] uppercase tracking-[0.25em] text-emerald-200/80">
          Multi-Mode Live: AI Hub · Intelligence Streams · Build Studio · Music Lessons · Repair Desk · Hyperborea Game
        </p>

        {showFinalCtaFrame && (
          <div className="hyperborea-final-cta mt-5 w-full max-w-4xl rounded-2xl border border-cyan-300/35 bg-black/75 p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/75">Final Action Frame · Choose Your Path</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Link
                href="/schedule?source=intro&cta=book-lessons"
                onClick={handleFinish}
                className="rounded-lg border border-emerald-400/45 bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
              >
                Book Lessons
              </Link>
              <Link
                href="/services?source=intro&cta=start-build"
                onClick={handleFinish}
                className="rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-fuchsia-100 transition hover:bg-fuchsia-500/30"
              >
                Start Build
              </Link>
              <Link
                href="/ai-hub?source=intro&cta=open-ai-hub"
                onClick={handleFinish}
                className="rounded-lg border border-cyan-400/45 bg-cyan-500/20 px-3 py-2 text-xs font-bold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/30"
              >
                Open AI Hub
              </Link>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80 hover:text-cyan-100"
            >
              Open AI Concierge ↗
            </button>
          </div>
        )}

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
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-200/70">
            Booting experience… {reducedMotion ? Math.min(4, Math.max(0, Math.ceil(progress * 4))) : Math.min(13, Math.max(0, Math.ceil(progress * 13)))}/{reducedMotion ? 4 : 13}s
          </p>
        </div>
      </div>
    </div>
  );
}
