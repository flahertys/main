"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const LAST_SECTION_KEY = "tradehax:aihub:last-section";

type RailStep = {
  id: string;
  label: string;
  nextAction: string;
};

interface HubSectionProgressRailProps {
  steps: RailStep[];
}

export function HubSectionProgressRail({ steps }: HubSectionProgressRailProps) {
  const [activeId, setActiveId] = useState<string>(steps[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined" || steps.length === 0) {
      return;
    }

    const hashTarget = window.location.hash.replace("#", "").trim();
    if (hashTarget) {
      return;
    }

    const stored = window.localStorage.getItem(LAST_SECTION_KEY);
    if (!stored) {
      return;
    }

    const hasStep = steps.some((step) => step.id === stored);
    if (!hasStep) {
      return;
    }

    const target = document.getElementById(stored);
    if (!target) {
      return;
    }

    setActiveId(stored);

    if (window.scrollY < 120) {
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [steps]);

  useEffect(() => {
    if (steps.length === 0 || typeof window === "undefined") {
      return;
    }

    const observers: IntersectionObserver[] = [];

    for (const step of steps) {
      const el = document.getElementById(step.id);
      if (!el) {
        continue;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(step.id);
              break;
            }
          }
        },
        {
          rootMargin: "-35% 0px -55% 0px",
          threshold: [0.1, 0.35],
        },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [steps]);

  useEffect(() => {
    if (typeof window === "undefined" || !activeId) {
      return;
    }

    window.localStorage.setItem(LAST_SECTION_KEY, activeId);
  }, [activeId]);

  const activeIndex = useMemo(() => {
    const idx = steps.findIndex((step) => step.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [activeId, steps]);

  const nextStep = steps[activeIndex + 1] ?? null;
  const currentStep = steps[activeIndex] ?? null;

  if (!currentStep) {
    return null;
  }

  return (
    <aside className="sticky top-24 z-10 mb-8 rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">You are here</p>
        <p className="text-[11px] text-zinc-400">Step {activeIndex + 1} / {steps.length}</p>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <Link
              key={step.id}
              href={`#${step.id}`}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                isActive
                  ? "border-cyan-300/50 bg-cyan-500/20 text-cyan-100"
                  : "border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {step.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wider text-emerald-200/80">Next best action</p>
        <p className="mt-1 text-xs text-emerald-100">{nextStep?.nextAction ?? currentStep.nextAction}</p>
      </div>
    </aside>
  );
}
