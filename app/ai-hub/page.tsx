import { ChatStreamPanel } from "@/components/ai/ChatStreamPanel";
import { HFGeneratorComponent } from "@/components/ai/HFGeneratorComponent";
import { ImageGeneratorComponent } from "@/components/ai/ImageGeneratorComponent";
import { ModelScoreboardPanel } from "@/components/ai/ModelScoreboardPanel";
import { SmartEnvironmentMonitor } from "@/components/ai/SmartEnvironmentMonitor";
import { VoiceSearchControlPanel } from "@/components/ai/VoiceSearchControlPanel";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import { Brain, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = createPageMetadata({
  title: "TradeHax AI Hub - Beginner Friendly Crypto + Stocks Assistant",
  description:
    "A clear, beginner-friendly AI hub for crypto and stock workflows: chat, content creation, image generation, and guided next steps.",
  path: "/ai-hub",
  keywords: ["ai trading", "crypto ai", "stock ai", "smart environment", "image generation", "ai assistants"],
});

export default function AIHubPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const viewParam = searchParams?.view;
  const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  const isAdvancedView = view === "advanced";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
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
              <Link
                href="/ai-hub#ai-chat-stream"
                className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1.5 font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
              >
                Switch to Simple Mode
              </Link>
            ) : (
              <Link
                href="/ai-hub?view=advanced#ai-chat-stream"
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-zinc-100 transition hover:bg-white/15"
              >
                Open Advanced Mode
              </Link>
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

          <aside className="space-y-3">
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
              <VoiceSearchControlPanel />
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
              <SmartEnvironmentMonitor />
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
              <HFGeneratorComponent />
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
              <ImageGeneratorComponent />
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
              <ModelScoreboardPanel />
            </Suspense>
          </ToolAccordion>
        </section>
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
    <details id={id} open={defaultOpen} className={`overflow-hidden rounded-xl border ${toneClass}`}>
      <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-black/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs opacity-80">{subtitle}</p>
          </div>
          <span className="rounded-full border border-white/20 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">toggle</span>
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
