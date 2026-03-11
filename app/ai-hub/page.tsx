import { ChatStreamPanel } from "@/components/ai/ChatStreamPanel";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { DeferredRender } from "@/components/ui/DeferredRender";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import { Brain, ChevronDown, MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";

const VoiceSearchControlPanel = dynamic(
  () => import("@/components/ai/VoiceSearchControlPanel").then((mod) => mod.VoiceSearchControlPanel),
);
const SmartEnvironmentMonitor = dynamic(
  () => import("@/components/ai/SmartEnvironmentMonitor").then((mod) => mod.SmartEnvironmentMonitor),
);
const HFGeneratorComponent = dynamic(
  () => import("@/components/ai/HFGeneratorComponent").then((mod) => mod.HFGeneratorComponent),
);
const ImageGeneratorComponent = dynamic(
  () => import("@/components/ai/ImageGeneratorComponent").then((mod) => mod.ImageGeneratorComponent),
);
const ModelScoreboardPanel = dynamic(
  () => import("@/components/ai/ModelScoreboardPanel").then((mod) => mod.ModelScoreboardPanel),
);

export const metadata = createPageMetadata({
  title: "TradeHax AI Hub - Beginner Friendly Crypto + Stocks Assistant",
  description:
    "A clear, beginner-friendly AI hub for crypto and stock workflows: chat, content creation, image generation, and guided next steps.",
  path: "/ai-hub",
  keywords: [
    "beginner ai crypto trading assistant",
    "ai trading strategies for beginners",
    "web3 token roadmap consulting",
    "ai-powered guitar lessons",
    "ai trading",
    "crypto ai",
    "stock ai",
    "smart environment",
    "image generation",
    "ai assistants",
  ],
});

const aiHubFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a beginner AI crypto trading assistant?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A beginner AI crypto trading assistant helps new traders understand market context, risk controls, and step-by-step execution plans before placing trades.",
      },
    },
    {
      "@type": "Question",
      name: "How does TradeHax support Web3 token roadmap consulting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TradeHax provides structured guidance for token utility phases, rollout milestones, and governance readiness so teams can launch responsibly.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use AI-powered guitar lessons on TradeHax?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. TradeHax combines lesson progression and personalized guidance to help users build technique and consistency with practical routines.",
      },
    },
  ],
};

export default async function AIHubPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewParam = resolvedSearchParams?.view;
  const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  const isAdvancedView = view === "advanced";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <Script id="ai-hub-faq-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(aiHubFaqJsonLd)}
      </Script>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_60%)]" />
      <ShamrockHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pt-14 md:pb-14 lg:px-8">
        <section className="mb-8 text-center sm:mb-10">
          <div className="theme-badge inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4" />
            AI COMMAND CENTER
          </div>

          <h1 className="theme-title mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">TradeHax AI Hub</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Clean chat-first interface for crypto, stocks, and prediction markets. Backend intelligence stays fully intact;
            the GUI is now focused, simpler, and easier for every experience level.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            {isAdvancedView ? (
              <TrackedCtaLink
                href="/ai-hub#ai-chat-stream"
                conversionId="open_ai_simple"
                surface="ai_hub:mode_switch"
                conversionContext={{ placement: "hero_toggle", variant: "simple", audience: "all" }}
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
              >
                Switch to Simple Mode
              </TrackedCtaLink>
            ) : (
              <TrackedCtaLink
                href="/ai-hub?view=advanced#ai-chat-stream"
                conversionId="open_ai_advanced"
                surface="ai_hub:mode_switch"
                conversionContext={{ placement: "hero_toggle", variant: "advanced", audience: "all" }}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-zinc-100 transition hover:bg-white/15"
              >
                Open Advanced Mode
              </TrackedCtaLink>
            )}
            <Link
              href="/ai-hub?starter=new-user-setup#ai-chat-stream"
              className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              New User Setup
            </Link>
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div id="ai-chat-stream" className="scroll-mt-24">
            <Suspense fallback={<LoadingPanel label="Loading AI command window" tone="emerald" />}>
              <ChatStreamPanel minimal={!isAdvancedView} />
            </Suspense>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <StatusCard
              icon={<Brain className="h-4 w-4" />}
              title="AI Status"
              body="Core engine is live: routing, orchestration, memory, and safety remain fully active. Chat-first mode keeps the interface simple, with advanced tools available on demand."
              tone="emerald"
            />
          </aside>
        </section>

        <section className="space-y-3">
          <ToolAccordion
            id="voice-and-context"
            title="Voice + Context Tools"
            subtitle="Speech controls and context expansion"
            tone="cyan"
            defaultOpen={isAdvancedView}
          >
            <Suspense fallback={<LoadingPanel label="Loading voice/search control panel" tone="cyan" />}>
              <DeferredRender fallback={<LoadingPanel label="Loading voice/search control panel" tone="cyan" />} rootMargin="160px">
                <VoiceSearchControlPanel />
              </DeferredRender>
            </Suspense>
          </ToolAccordion>

          <ToolAccordion
            id="environment-monitor"
            title="Smart Environment Monitor"
            subtitle="Portfolio, market snapshots, and active signals"
            tone="cyan"
            defaultOpen={isAdvancedView}
          >
            <Suspense fallback={<LoadingPanel label="Loading smart environment monitor" tone="cyan" />}>
              <DeferredRender fallback={<LoadingPanel label="Loading smart environment monitor" tone="cyan" />} rootMargin="160px">
                <SmartEnvironmentMonitor />
              </DeferredRender>
            </Suspense>
          </ToolAccordion>

          <ToolAccordion
            id="text-studio"
            title="Text Studio"
            subtitle="Generate SOPs, plans, and publish-ready drafts"
            tone="yellow"
            defaultOpen={isAdvancedView}
          >
            <Suspense fallback={<LoadingPanel label="Loading text generator" tone="yellow" />}>
              <DeferredRender fallback={<LoadingPanel label="Loading text generator" tone="yellow" />} rootMargin="160px">
                <HFGeneratorComponent />
              </DeferredRender>
            </Suspense>
          </ToolAccordion>

          <ToolAccordion
            id="image-studio"
            title="Image Studio"
            subtitle="Create visuals from prompts and strategy context"
            tone="cyan"
            defaultOpen={isAdvancedView}
          >
            <Suspense fallback={<LoadingPanel label="Loading image generator" tone="cyan" />}>
              <DeferredRender fallback={<LoadingPanel label="Loading image generator" tone="cyan" />} rootMargin="160px">
                <ImageGeneratorComponent />
              </DeferredRender>
            </Suspense>
          </ToolAccordion>

          <ToolAccordion
            id="autopilot"
            title="Autopilot + Model Scoreboard"
            subtitle="Cross-domain model health and stable-mode controls"
            tone="fuchsia"
            defaultOpen={isAdvancedView}
          >
            <Suspense fallback={<LoadingPanel label="Loading AI autopilot controls" tone="fuchsia" />}>
              <DeferredRender fallback={<LoadingPanel label="Loading AI autopilot controls" tone="fuchsia" />} rootMargin="220px">
                <ModelScoreboardPanel />
              </DeferredRender>
            </Suspense>
          </ToolAccordion>
        </section>

        <section className="mt-10 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-cyan-100">Beginner AI Trading + Web3 FAQ</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Structured answers for AI search engines and first-time users looking for practical next steps.
          </p>

          <div className="mt-4 space-y-4 text-sm text-zinc-200">
            <div>
              <h3 className="font-semibold text-white">What is a beginner AI crypto trading assistant?</h3>
              <p className="mt-1 text-zinc-300">
                It helps new users plan entries, risk limits, and invalidation levels with plain-language guidance before execution.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Do you support Web3 token roadmap consulting?</h3>
              <p className="mt-1 text-zinc-300">
                Yes — from utility design and phased rollout strategy to governance readiness and KPI mapping.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Is there an AI-powered guitar lesson path too?</h3>
              <p className="mt-1 text-zinc-300">
                Yes — we support consistent lesson progression with personalized routines and accountable milestones.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <TrackedCtaLink
              href="/blog/automated-trading-strategies-2026"
              conversionId="open_ai_chat"
              surface="ai_hub:faq_cta"
              conversionContext={{ placement: "faq", variant: "ai_trading_guide", audience: "all" }}
              className="rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              Read AI Trading Guide
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/blog/small-business-web3-implementation-roadmap"
              conversionId="open_service_catalog"
              surface="ai_hub:faq_cta"
              conversionContext={{ placement: "faq", variant: "web3_roadmap_guide", audience: "all" }}
              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/15 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25"
            >
              Web3 Roadmap Guide
            </TrackedCtaLink>
          </div>
        </section>

        <div className="mobile-action-shell md:hidden">
          <div className="mobile-action-grid">
            <TrackedCtaLink
              href="#ai-chat-stream"
              conversionId="open_ai_chat"
              surface="ai_hub:mobile_sticky"
              conversionContext={{ placement: "sticky", variant: "chat_anchor", audience: "all" }}
              className="mobile-action-btn mobile-action-btn--primary"
            >
              Open Chat
            </TrackedCtaLink>
            <TrackedCtaLink
              href={isAdvancedView ? "/ai-hub#ai-chat-stream" : "/ai-hub?view=advanced#ai-chat-stream"}
              conversionId={isAdvancedView ? "open_ai_simple" : "open_ai_advanced"}
              surface="ai_hub:mobile_sticky"
              conversionContext={{ placement: "sticky", variant: isAdvancedView ? "simple" : "advanced", audience: "all" }}
              className="mobile-action-btn"
            >
              {isAdvancedView ? "Simple Mode" : "Advanced"}
            </TrackedCtaLink>
          </div>
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function ToolAccordion({
  id,
  title,
  subtitle,
  tone,
  defaultOpen,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  tone: "emerald" | "cyan" | "fuchsia" | "yellow";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const toneClass = {
    emerald: "border-emerald-500/20 bg-emerald-600/10 text-emerald-100",
    cyan: "border-cyan-500/20 bg-cyan-600/10 text-cyan-100",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-600/10 text-fuchsia-100",
    yellow: "border-yellow-500/20 bg-yellow-600/10 text-yellow-100",
  }[tone];

  return (
    <details id={id} open={defaultOpen} className={`group disclosure-shell ${toneClass}`}>
      <summary className="disclosure-summary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs opacity-80">{subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
            <span>toggle</span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
          </span>
        </div>
      </summary>
      <div className="border-t border-white/10 p-3 sm:p-4">{children}</div>
    </details>
  );
}

function StatusCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "emerald" | "cyan" | "fuchsia";
}) {
  const toneClass = {
    emerald: "border-emerald-500/20 bg-emerald-600/10 text-emerald-100",
    cyan: "border-cyan-500/20 bg-cyan-600/10 text-cyan-100",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-600/10 text-fuchsia-100",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold">
        {icon}
        {title}
      </div>
      <p className="text-xs opacity-85">{body}</p>
    </div>
  );
}

function LoadingPanel({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "cyan" | "fuchsia" | "yellow";
}) {
  const toneClass = {
    emerald: "border-emerald-500/20 bg-emerald-600/10 text-emerald-100/80",
    cyan: "border-cyan-500/20 bg-cyan-600/10 text-cyan-100/80",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-600/10 text-fuchsia-100/80",
    yellow: "border-yellow-500/20 bg-yellow-600/10 text-yellow-100/80",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs ${toneClass}`}>
      <div className="mb-2">{label}...</div>
      <div className="space-y-1.5">
        <div className="h-2 w-3/4 animate-pulse rounded bg-white/20" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-white/20" />
      </div>
    </div>
  );
}
