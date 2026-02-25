import { HFChatComponent } from "@/components/ai/HFChatComponent";
import { HFGeneratorComponent } from "@/components/ai/HFGeneratorComponent";
import { ImageGeneratorComponent } from "@/components/ai/ImageGeneratorComponent";
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

export const metadata = createPageMetadata({
  title: "TradeHax AI Hub - Beginner Friendly AI Assistant",
  description:
    "A clear, beginner-friendly AI hub for chat, text creation, image generation, and guided trading workflows.",
  path: "/ai-hub",
  keywords: ["ai trading", "smart environment", "image generation", "ai assistants"],
});

export default function AIHubPage() {
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

          <div className="mx-auto max-w-3xl rounded-xl border border-emerald-500/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-100/90">
            <p className="font-semibold">How to use this page</p>
            <p className="mt-1 text-emerald-100/75">1) Start with AI Chat, 2) ask for a step-by-step plan, 3) use Text/Image tools only when needed.</p>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-600/15 via-indigo-600/10 to-cyan-600/10 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-fuchsia-100 mb-3">
            <Crown className="w-5 h-5" />
            <h2 className="text-lg sm:text-xl font-bold">TradeHax Launchpad (1-click starts)</h2>
          </div>
          <p className="text-sm text-fuchsia-100/80 mb-4">
            Designed for new users: pick your goal and we pre-configure the assistant flow so you start with momentum, not confusion.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/ai-hub?starter=new-user-setup"
              className="rounded-xl border border-fuchsia-400/20 bg-black/30 p-4 hover:border-fuchsia-300/40 transition"
            >
              <div className="text-sm font-semibold text-fuchsia-100">New User Setup</div>
              <p className="mt-1 text-xs text-fuchsia-100/70">Auto-loads onboarding objective + guided first question.</p>
            </Link>
            <Link
              href="/ai-hub?starter=first-trade-plan"
              className="rounded-xl border border-cyan-400/20 bg-black/30 p-4 hover:border-cyan-300/40 transition"
            >
              <div className="text-sm font-semibold text-cyan-100">First Trade Plan</div>
              <p className="mt-1 text-xs text-cyan-100/70">Sets up a risk-aware beginner plan workflow.</p>
            </Link>
            <Link
              href="/ai-hub?starter=content-engine"
              className="rounded-xl border border-emerald-400/20 bg-black/30 p-4 hover:border-emerald-300/40 transition"
            >
              <div className="text-sm font-semibold text-emerald-100">Content Engine</div>
              <p className="mt-1 text-xs text-emerald-100/70">Pre-fills text + image generation for social growth.</p>
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <QuickStartCard
            title="I&apos;m new"
            description="Open AI Chat and ask: 'What should I do first?'"
            cta="Go to AI Chat"
          />
          <QuickStartCard
            title="I need content"
            description="Use Text Generator for posts, docs, and strategy notes."
            cta="Open Text Generator"
          />
          <QuickStartCard
            title="I need visuals"
            description="Use Image Generator for charts, social art, and hero images."
            cta="Open Image Generator"
          />
        </div>

        <div className="mb-12 rounded-xl border border-cyan-500/20 bg-cyan-600/10 px-5 py-4 text-sm text-cyan-100/90">
          <p className="font-semibold">Low-cost usage model (for API sustainability)</p>
          <p className="mt-1 text-cyan-100/75">
            We keep pricing lightweight: enough to cover model/API costs while staying affordable for regular users.
            Visit <Link href="/pricing" className="underline underline-offset-2"> pricing </Link>
            for current limits and included usage.
          </p>
        </div>

        {/* Smart Environment Monitor */}
        <div className="mb-12">
          <SmartEnvironmentMonitor />
        </div>

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

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Generator */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-300">Image Generator (Simple)</h2>
            </div>
            <ImageGeneratorComponent />
          </div>

          {/* AI Chat */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-emerald-300">AI Chat (Recommended First)</h2>
            </div>
            <HFChatComponent />
          </div>
        </div>

        {/* Additional Tools */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Text Generator */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-300">Text Generator (Templates)</h2>
            </div>
            <HFGeneratorComponent />
          </div>

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
        <div className="theme-panel theme-panel--success p-8">
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
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
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
}: {
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-gray-300">{description}</p>
      <p className="mt-3 text-[11px] font-semibold text-cyan-300">{cta}</p>
    </div>
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
    <div className="border border-emerald-500/30 rounded p-6 bg-emerald-600/5">
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
    <div className="border border-blue-500/30 rounded p-4 bg-blue-600/5">
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
    <div className="flex gap-4 pb-4 border-b border-emerald-500/20 last:border-0">
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
