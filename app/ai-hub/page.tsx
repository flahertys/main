import { HFChatComponent } from "@/components/ai/HFChatComponent";
import { HFGeneratorComponent } from "@/components/ai/HFGeneratorComponent";
import { HubSectionProgressRail } from "@/components/ai/HubSectionProgressRail";
import { ImageGeneratorComponent } from "@/components/ai/ImageGeneratorComponent";
import { ModelScoreboardPanel } from "@/components/ai/ModelScoreboardPanel";
import { SmartEnvironmentMonitor } from "@/components/ai/SmartEnvironmentMonitor";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import {
    BarChart3,
    Brain,
    Crown,
    Layers,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Target,
    Wand2,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = createPageMetadata({
  title: "TradeHax AI Hub - Beginner Friendly AI Assistant",
  description:
    "A clear, beginner-friendly AI hub for chat, text creation, image generation, and guided trading workflows.",
  path: "/ai-hub",
  keywords: ["ai trading", "smart environment", "image generation", "ai assistants"],
});

export default function AIHubPage() {
  const progressSteps = [
    {
      id: "ai-chat",
      label: "AI Chat",
      nextAction: "Ask for a one-goal, one-week action plan with clear daily tasks.",
    },
    {
      id: "text-generator",
      label: "Text",
      nextAction: "Turn your plan into a publish-ready post or SOP in one draft.",
    },
    {
      id: "image-generator",
      label: "Image",
      nextAction: "Generate one visual asset that supports your post or landing message.",
    },
    {
      id: "ai-autopilot",
      label: "Autopilot",
      nextAction: "Run one-click setup and keep beginner-safe defaults active.",
    },
    {
      id: "getting-started",
      label: "5-Min Path",
      nextAction: "Complete the checklist and lock your next action before leaving.",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="theme-badge inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold mb-6">
            <Brain className="w-4 h-4" />
            BEGINNER-FIRST AI PLATFORM
          </div>

          <h1 className="theme-title text-4xl sm:text-5xl md:text-6xl font-bold mb-6">TradeHax AI Hub</h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Get clear help in plain language: ask questions, generate content, create images,
            and follow guided next steps even if you&apos;re brand new.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#ai-chat"
              className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80"
            >
              Start in AI Chat
            </Link>
            <Link
              href="/ai-hub?starter=new-user-setup#ai-chat"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2 text-sm font-semibold text-zinc-100 transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/70"
            >
              Launch New User Setup
            </Link>
          </div>

          <div className="mx-auto max-w-3xl rounded-xl border border-emerald-500/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-100/90">
            <p className="font-semibold">How to use this page</p>
            <p className="mt-1 text-emerald-100/75">1) Start with AI Chat, 2) ask for a step-by-step plan, 3) use Text/Image tools only when needed.</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <QuickStartCard
            title="I&apos;m new"
            description="Start with a guided onboarding flow and get your first objective set in seconds."
            cta="Start New User Setup"
            href="/ai-hub?starter=new-user-setup#ai-chat"
            tone="emerald"
          />
          <QuickStartCard
            title="I need a plan"
            description="Generate a risk-aware execution plan with clear steps and milestones."
            cta="Launch First Trade Plan"
            href="/ai-hub?starter=first-trade-plan#ai-chat"
            tone="yellow"
          />
          <QuickStartCard
            title="I need growth assets"
            description="Generate text + visuals for posts, pages, and campaigns from one objective."
            cta="Launch Content Engine"
            href="/ai-hub?starter=content-engine#ai-chat"
            tone="cyan"
          />
        </div>

        <div className="sticky top-2 sm:top-3 z-20 mb-10 rounded-xl border border-white/10 bg-black/50 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Fast Navigation</p>
            <div className="flex flex-wrap gap-2">
              <Link href="#ai-chat" className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 transition motion-safe:hover:-translate-y-0.5 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70">AI Chat</Link>
              <Link href="#text-generator" className="rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1 text-[11px] font-semibold text-yellow-100 transition motion-safe:hover:-translate-y-0.5 hover:bg-yellow-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70">Text</Link>
              <Link href="#image-generator" className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-100 transition motion-safe:hover:-translate-y-0.5 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">Image</Link>
              <Link href="#ai-autopilot" className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-100 transition motion-safe:hover:-translate-y-0.5 hover:bg-fuchsia-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70">Autopilot</Link>
              <Link href="#getting-started" className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold text-zinc-100 transition motion-safe:hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/70">5-Min Path</Link>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-600/10 px-5 py-4">
            <p className="text-sm font-semibold text-cyan-100">What you can finish in 2 minutes</p>
            <ul className="mt-2 space-y-1 text-xs text-cyan-100/80">
              <li>• Get a clear step-by-step action plan from AI Chat</li>
              <li>• Draft a publish-ready post with Text Generator</li>
              <li>• Produce a visual concept for social/landing with Image Generator</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-600/10 px-5 py-4 text-sm text-emerald-100/90">
            <p className="font-semibold">Sustainable usage model</p>
            <p className="mt-1 text-emerald-100/75">
              Pricing is designed to remain beginner-friendly while covering model/API costs.
              Visit <Link href="/pricing" className="underline underline-offset-2"> pricing </Link>
              for limits and included usage.
            </p>
          </div>
        </div>

        <div className="mb-10 rounded-xl border border-emerald-500/20 bg-emerald-600/10 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-100">Starter prompts (copy/paste into AI Chat)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Build me a safe 7-day beginner workflow with daily time blocks.",
              "Turn my idea into a one-page content plan with 3 posts.",
              "Give me one clear next action for today and why it matters.",
            ].map((prompt) => (
              <Link
                key={prompt}
                href="#ai-chat"
                className="rounded-lg border border-emerald-400/25 bg-black/25 px-3 py-2 text-[11px] text-emerald-100/90 hover:bg-black/35 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
                title={prompt}
              >
                {prompt}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-emerald-300/35">
            <p className="text-[11px] uppercase tracking-wider text-emerald-200/80">Primary Interface</p>
            <p className="mt-1 text-sm font-semibold text-emerald-100">Conversation-first workspace</p>
          </div>
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-cyan-300/35">
            <p className="text-[11px] uppercase tracking-wider text-cyan-200/80">Session Memory</p>
            <p className="mt-1 text-sm font-semibold text-cyan-100">Resume and continue where you left off</p>
          </div>
          <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-fuchsia-300/35">
            <p className="text-[11px] uppercase tracking-wider text-fuchsia-200/80">Preset Intelligence</p>
            <p className="mt-1 text-sm font-semibold text-fuchsia-100">Role-based AI profiles for each objective</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-amber-300/35">
            <p className="text-[11px] uppercase tracking-wider text-amber-200/80">Operator Visibility</p>
            <p className="mt-1 text-sm font-semibold text-amber-100">Decision signals + next action every turn</p>
          </div>
        </div>

        <HubSectionProgressRail steps={[...progressSteps]} />

        {/* Smart Environment Monitor */}
        <div className="mb-12">
          <Suspense
            fallback={
              <LoadingPanel label="Loading smart environment monitor" tone="cyan" />
            }
          >
            <SmartEnvironmentMonitor />
          </Suspense>
        </div>

        <div id="ai-autopilot" className="mb-3 scroll-mt-28 rounded-xl border border-fuchsia-500/20 bg-fuchsia-600/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-fuchsia-100">New here? One-click setup</p>
              <p className="text-xs text-fuchsia-100/75 mt-1">
                Launch a guided 30-second setup wizard for autopilot and beginner-safe defaults.
              </p>
            </div>
            <Link
              href="/ai-hub?setupWizard=1#ai-autopilot"
              className="rounded border border-fuchsia-300/40 bg-black/25 px-3 py-1.5 text-xs font-semibold text-fuchsia-100 hover:bg-black/35 transition"
            >
              I&apos;m new — set this up for me
            </Link>
          </div>
        </div>

        <Suspense
          fallback={
            <LoadingPanel label="Loading AI autopilot controls" tone="fuchsia" className="mb-8" />
          }
        >
          <ModelScoreboardPanel />
        </Suspense>

        <div className="theme-panel p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-2 mb-4 text-amber-200">
            <Target className="w-5 h-5" />
            <h2 className="text-xl sm:text-2xl font-bold">Why this stands out vs generic AI tools</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <EdgeCard
              icon={<Layers className="w-4 h-4" />}
              title="Flow-aware UX"
              description="Most tools stop at chat. TradeHax pushes users through clear objective → route → execution → next action."
            />
            <EdgeCard
              icon={<ShieldCheck className="w-4 h-4" />}
              title="Safer onboarding"
              description="Beginner prompts, low-friction controls, and predictable next steps reduce overwhelm and churn."
            />
            <EdgeCard
              icon={<Crown className="w-4 h-4" />}
              title="Operator-grade depth"
              description="Advanced controls remain available for power users without cluttering the first-time experience."
            />
          </div>
        </div>

        <div id="ai-chat" className="mb-12 scroll-mt-28">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-emerald-300">AI Command Center</h2>
            </div>
            <p className="text-xs text-emerald-100/75">Built for fast intent-to-execution flow, inspired by best-in-class AI chat UX.</p>
          </div>
          <Suspense
            fallback={
              <LoadingPanel label="Loading AI chat" tone="emerald" />
            }
          >
            <HFChatComponent />
          </Suspense>
        </div>

        {/* Additional Tools */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Text Generator */}
          <div id="text-generator" className="scroll-mt-28">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-300">Text Studio</h2>
            </div>
            <Suspense
              fallback={
                <LoadingPanel label="Loading text generator" tone="yellow" />
              }
            >
              <HFGeneratorComponent />
            </Suspense>
          </div>

          {/* Image Generator */}
          <div id="image-generator" className="scroll-mt-28">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-300">Image Studio</h2>
            </div>
            <Suspense
              fallback={
                <LoadingPanel label="Loading image generator" tone="cyan" />
              }
            >
              <ImageGeneratorComponent />
            </Suspense>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">

          {/* Capabilities */}
          <div className="theme-panel p-6">
            <h2 className="text-xl font-bold text-white mb-6">Capabilities</h2>
            <div className="space-y-4">
              <CapabilityItem
                icon={<Brain className="w-5 h-5" />}
                title="Smart Environment"
                description="Context-aware support with clear next actions for trading workflows"
              />
              <CapabilityItem
                icon={<Wand2 className="w-5 h-5" />}
                title="Image Generation"
                description="Create trading charts, NFT artwork, and hero images with AI"
              />
              <CapabilityItem
                icon={<MessageSquare className="w-5 h-5" />}
                title="Intelligent Chat"
                description="Beginner-friendly guidance with step-by-step explanations"
              />
              <CapabilityItem
                icon={<BarChart3 className="w-5 h-5" />}
                title="Portfolio Analytics"
                description="Real-time portfolio monitoring with allocation insights"
              />
              <CapabilityItem
                icon={<Zap className="w-5 h-5" />}
                title="Bot Management"
                description="Create and manage automated trading bots with multiple strategies"
              />
              <CapabilityItem
                icon={<Sparkles className="w-5 h-5" />}
                title="Model Fine-tuning"
                description="Train models on TradeHax datasets for custom predictions"
              />
            </div>
          </div>

          <div className="theme-panel p-6">
            <h2 className="text-xl font-bold text-white mb-6">Workspace Principles</h2>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="font-semibold text-white">1. Conversation-first</p>
                <p className="mt-1 text-zinc-400">Chat is the control tower, with tools as specialized accelerators.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="font-semibold text-white">2. Explainable outputs</p>
                <p className="mt-1 text-zinc-400">Decision signals and explicit next actions keep users confident and oriented.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="font-semibold text-white">3. Speed without clutter</p>
                <p className="mt-1 text-zinc-400">Quick actions and presets reduce friction for beginners while preserving depth for operators.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <p className="font-semibold text-white">4. Brand legacy quality</p>
                <p className="mt-1 text-zinc-400">Every interaction is designed to reflect precision, craft, and trust.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Datasets & Models */}
        <div className="theme-panel p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-8">Datasets & Models</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <DatasetCard
              title="TradeHax Behavioral"
              description="26 Q&A pairs on trading strategies, risk management, and platform features"
              type="Training Dataset"
              entries="26 pairs"
              format="JSONL"
            />
            <DatasetCard
              title="Crypto Education"
              description="10 comprehensive lessons on blockchain, DeFi, trading concepts"
              type="Training Dataset"
              entries="10 pairs"
              format="JSONL"
            />
            <DatasetCard
              title="Trading Strategy"
              description="Expanded with UI generation, NLP, and trading strategy optimization"
              type="Training Dataset"
              entries="20+ pairs"
              format="JSONL"
            />
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Available Models</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ModelCard
                name="Mistral-7B-Instruct"
                type="Text Generation"
                size="7B parameters"
                use="Chat, code, trading analysis"
              />
              <ModelCard
                name="Stable Diffusion 2.1"
                type="Image Generation"
                size="1B+ parameters"
                use="Trading charts, NFT art, UI"
              />
              <ModelCard
                name="Meta-Llama-3-8B-Instruct"
                type="Text Generation"
                size="8B parameters"
                use="Long-form strategy and agent workflows"
              />
              <ModelCard
                name="FLUX.1 Schnell"
                type="Image Generation"
                size="Large diffusion"
                use="High-contrast concept renders"
              />
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div id="getting-started" className="theme-panel theme-panel--success scroll-mt-28 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-emerald-300 mb-6">Getting Started (5-minute path)</h2>

          <div className="space-y-4">
            <StepCard
              step="1"
              title="Open AI Chat"
              description="Use the guided assistant and describe your goal in simple words"
            />
            <StepCard
              step="2"
              title="Set your objective"
              description="Example: 'I want a safe beginner trading routine this week'"
            />
            <StepCard
              step="3"
              title="Follow the step-by-step plan"
              description="Use the suggested route pages and execute one task at a time"
            />
            <StepCard
              step="4"
              title="Use generators as needed"
              description="Text for posts/docs, Image for visuals and chart storytelling"
            />
            <StepCard
              step="5"
              title="Review costs + limits"
              description="Stay in the low-cost tier until your API usage grows"
            />
            <StepCard
              step="6"
              title="Scale when ready"
              description="Upgrade only when your usage exceeds included monthly requests"
            />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-3 z-20 mx-auto w-[min(620px,calc(100%-1rem))] rounded-xl border border-white/15 bg-black/70 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <Link
              href="#ai-chat"
              className="flex-1 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-3 py-2 text-center text-xs font-semibold text-emerald-50"
            >
              Open AI Chat
            </Link>
            <Link
              href="/ai-hub?starter=new-user-setup#ai-chat"
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-semibold text-zinc-100"
            >
              New User Setup
            </Link>
          </div>
        </div>
      </main>

      <ShamrockFooter />
    </div>
  );
}

function EdgeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-white/20">
      <div className="inline-flex items-center gap-2 text-amber-200 text-sm font-semibold mb-2">
        {icon}
        {title}
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed">{description}</p>
    </div>
  );
}

function QuickStartCard({
  title,
  description,
  cta,
  href,
  tone,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
  tone: "emerald" | "yellow" | "cyan";
}) {
  const toneStyles = {
    emerald: "border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-emerald-300",
    yellow: "border-yellow-500/25 hover:border-yellow-400/50 hover:bg-yellow-500/10 text-yellow-300",
    cyan: "border-cyan-500/25 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-cyan-300",
  };

  return (
    <Link href={href} className={`block rounded-xl border bg-black/30 p-4 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${toneStyles[tone]}`}>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-gray-300">{description}</p>
      <p className="mt-3 text-[11px] font-semibold">{cta}</p>
    </Link>
  );
}

function CapabilityItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-cyan-400 flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-bold text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function DatasetCard({
  title,
  description,
  type,
  entries,
  format,
}: {
  title: string;
  description: string;
  type: string;
  entries: string;
  format: string;
}) {
  return (
    <div className="border border-emerald-500/30 rounded p-5 sm:p-6 bg-emerald-600/5 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-emerald-300/40">
      <div className="text-xs font-bold text-emerald-400 mb-2">{type}</div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{entries}</span>
        <span>{format}</span>
      </div>
    </div>
  );
}

function ModelCard({
  name,
  type,
  size,
  use,
}: {
  name: string;
  type: string;
  size: string;
  use: string;
}) {
  return (
    <div className="border border-blue-500/30 rounded p-4 bg-blue-600/5 transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-blue-300/40">
      <div className="font-bold text-blue-300 mb-1">{name}</div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>
          <strong>Type:</strong> {type}
        </div>
        <div>
          <strong>Size:</strong> {size}
        </div>
        <div>
          <strong>Use:</strong> {use}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 pb-4 border-b border-emerald-500/20 last:border-0 transition motion-safe:hover:translate-x-0.5">
      <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white">
        {step}
      </div>
      <div>
        <h4 className="font-bold text-white mb-1">{title}</h4>
        <p className="text-sm text-emerald-200/80">{description}</p>
      </div>
    </div>
  );
}

function LoadingPanel({
  label,
  tone,
  className,
}: {
  label: string;
  tone: "emerald" | "cyan" | "fuchsia" | "yellow";
  className?: string;
}) {
  const toneClass = {
    emerald: "border-emerald-500/20 bg-emerald-600/10 text-emerald-100/80",
    cyan: "border-cyan-500/20 bg-cyan-600/10 text-cyan-100/80",
    fuchsia: "border-fuchsia-500/20 bg-fuchsia-600/10 text-fuchsia-100/80",
    yellow: "border-yellow-500/20 bg-yellow-600/10 text-yellow-100/80",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs ${toneClass} ${className || ""}`}>
      <div className="mb-2">{label}...</div>
      <div className="space-y-1.5">
        <div className="h-2 w-3/4 animate-pulse rounded bg-white/20" />
        <div className="h-2 w-1/2 animate-pulse rounded bg-white/20" />
      </div>
    </div>
  );
}
