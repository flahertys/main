import { ExperimentReadoutPanel } from "@/components/analytics/ExperimentReadoutPanel";
import { HomeEngagementTracker } from "@/components/analytics/HomeEngagementTracker";
import { HomeHeroActions } from "@/components/landing/HomeHeroActions";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { DeferredRender } from '@/components/ui/DeferredRender';
import { GlitchText } from '@/components/ui/GlitchText';
import { scheduleLinks } from "@/lib/booking";
import { businessProfile } from "@/lib/business-profile";
import {
  ArrowRight,
  CheckCircle2,
  CircuitBoard,
  Guitar,
  MessageSquare,
  MonitorSmartphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const LiveActivity = dynamic(
  () => import("@/components/ui/LiveActivity").then((mod) => mod.LiveActivity),
  {},
);

const ServiceGrid = dynamic(
  () => import("@/components/landing/ServiceGrid").then((mod) => mod.ServiceGrid),
  {
    loading: () => <div className="mx-auto max-w-7xl px-6 py-20 text-zinc-500 text-sm">Loading service capabilities…</div>,
  },
);

const AINeuralHub = dynamic(
  () => import("@/components/landing/AINeuralHub").then((mod) => mod.AINeuralHub),
  {
    loading: () => <div className="mx-auto max-w-7xl px-6 py-20 text-zinc-500 text-sm">Loading AI workspace…</div>,
  },
);

const Roadmap = dynamic(
  () => import("@/components/landing/Roadmap").then((mod) => mod.Roadmap),
  {
    loading: () => <div className="mx-auto max-w-7xl px-6 py-20 text-zinc-500 text-sm">Loading roadmap…</div>,
  },
);

export default function Home() {
  // Server-side domain check for tradehax.net
  const host = headers().get('host');
  if (host && host.includes('tradehax.net')) {
    redirect('/music');
  }

  return (
    <main className="min-h-screen bg-black">
      <HomeEngagementTracker />
      <ExperimentReadoutPanel />

      {/* Hero: "Digital Dynasty" Portal */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-20">
        <div className="absolute top-[-8rem] right-[-6rem] w-[280px] h-[280px] sm:w-[460px] sm:h-[460px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-9rem] left-[-4rem] w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="theme-panel p-8 sm:p-12 md:p-16">
            <span className="theme-kicker mb-5">AI Agent Platform</span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl leading-tight font-black text-white tracking-tighter italic uppercase mb-6 break-words">
              <GlitchText text="Multiply Your Edge" />
            </h1>
            <p className="text-zinc-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-2">
              Deploy AI agents across trading, music, and services.
            </p>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              No coding. No setup. Get your first signal in 60 seconds.
            </p>

            <HomeHeroActions scheduleHref={scheduleLinks.root} />

            {/* Three entry lane cards - NOW WITH CLEAR VALUE PROPS */}
            <div className="grid sm:grid-cols-3 gap-4 mt-12 text-left">
              <TrackedCtaLink
                href="/intelligence"
                conversionId="open_intelligence"
                surface="home:entry_lanes"
                conversionContext={{ placement: "entry_lane", variant: "intelligence", audience: "all" }}
                className="interactive-surface p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all group"
              >
                <CircuitBoard className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-white uppercase mb-2">AI Trading Signals</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">For traders: Real-time signals, backtesting, automated execution on Polygon</p>
                <span className="text-xs text-cyan-400 font-semibold">→ Paper trade risk-free</span>
              </TrackedCtaLink>

              <TrackedCtaLink
                href="/music"
                conversionId="open_music"
                surface="home:entry_lanes"
                conversionContext={{ placement: "entry_lane", variant: "music", audience: "all" }}
                className="interactive-surface p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-purple-500/30 transition-all group"
              >
                <Guitar className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-white uppercase mb-2">AI Music Creation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">For creators: Guitar coach, track generation, distribution automation</p>
                <span className="text-xs text-purple-400 font-semibold">→ Generate 1 track free</span>
              </TrackedCtaLink>

              <TrackedCtaLink
                href="/services"
                conversionId="open_services"
                surface="home:entry_lanes"
                conversionContext={{ placement: "entry_lane", variant: "services", audience: "all" }}
                className="interactive-surface p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 transition-all group"
              >
                <MonitorSmartphone className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-white uppercase mb-2">AI Service Delivery</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">For builders: Custom agents, service templates, white-label platform</p>
                <span className="text-xs text-emerald-400 font-semibold">→ Import template</span>
              </TrackedCtaLink>
            </div>
          </div>
        </div>
      </section>

      <LiveActivity />

      {/* Three Flagship Portals */}
      <section id="home-flagship-portals" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="theme-panel p-6 sm:p-8 md:p-12">
          <span className="theme-kicker mb-4">Choose Your Environment</span>
          <h2 className="theme-title text-3xl sm:text-4xl md:text-5xl mb-12">Three Flagship Portals</h2>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Portal A — Trade Intelligence */}
            <article className="theme-grid-card border-l-4 border-l-cyan-500">
              <div className="mb-6">
                <CircuitBoard className="w-10 h-10 text-cyan-400 mb-4" />
                <h3 className="text-2xl font-black text-white uppercase italic mb-3">Trade Intelligence</h3>
                <p className="text-zinc-200 text-base leading-relaxed mb-4">
                  AI quant copilot for real-time signals, backtesting, and explainable trade workflows.
                </p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span>Options flow tape with unusual activity scoring</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span>Dark pool scanner for institutional block trades</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span>Cross-chain crypto flow with confidence bands</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span>AI-powered probability engine and risk modeling</span>
                </li>
              </ul>
              <TrackedCtaLink
                href="/intelligence"
                conversionId="open_intelligence"
                surface="home:flagship_portals"
                conversionContext={{ placement: "flagship_portal", variant: "intelligence", audience: "all" }}
                className="theme-cta theme-cta--loud w-full justify-center"
              >
                Launch Intelligence Hub
                <ArrowRight className="w-4 h-4" />
              </TrackedCtaLink>
            </article>

            {/* Portal B — Music Intelligence */}
            <article className="theme-grid-card border-l-4 border-l-purple-500">
              <div className="mb-6">
                <Guitar className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-2xl font-black text-white uppercase italic mb-3">Music Intelligence</h3>
                <p className="text-zinc-200 text-base leading-relaxed mb-4">
                  AI-assisted guitar/music environment for learning, creative growth, and premium instruction.
                </p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <span>Private guitar lessons with 15+ years teaching experience</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <span>AI-powered practice tools and technique analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <span>Artist growth programs and scholarship opportunities</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <span>Performance showcases and creative collaboration</span>
                </li>
              </ul>
              <TrackedCtaLink
                href="/music"
                conversionId="open_music"
                surface="home:flagship_portals"
                conversionContext={{ placement: "flagship_portal", variant: "music", audience: "all" }}
                className="theme-cta theme-cta--loud w-full justify-center"
              >
                Explore Music Portal
                <ArrowRight className="w-4 h-4" />
              </TrackedCtaLink>
            </article>

            {/* Portal C — Digital Services */}
            <article className="theme-grid-card border-l-4 border-l-emerald-500">
              <div className="mb-6">
                <MonitorSmartphone className="w-10 h-10 text-emerald-400 mb-4" />
                <h3 className="text-2xl font-black text-white uppercase italic mb-3">Digital Services</h3>
                <p className="text-zinc-200 text-base leading-relaxed mb-4">
                  Execution studio for AI systems, websites, automations, and technical delivery.
                </p>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Custom AI agents and automation workflows</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Full-stack web and mobile app development</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Blockchain/Web3 smart contract deployment</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Technical support and system optimization</span>
                </li>
              </ul>
              <TrackedCtaLink
                href="/services"
                conversionId="open_services"
                surface="home:flagship_portals"
                conversionContext={{ placement: "flagship_portal", variant: "services", audience: "all" }}
                className="theme-cta theme-cta--loud w-full justify-center"
              >
                View Service Catalog
                <ArrowRight className="w-4 h-4" />
              </TrackedCtaLink>
            </article>
          </div>
        </div>
      </section>

      {/* Credibility Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="theme-panel p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-cyan-500/10">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">AI-Native Workflows</h3>
              <p className="text-xs text-zinc-400">Built with Claude, GPT-4, and custom models</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">Real Shipping Capability</h3>
              <p className="text-xs text-zinc-400">Production systems and live deployments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-purple-500/10">
                <CircuitBoard className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">Cross-Domain Execution</h3>
              <p className="text-xs text-zinc-400">Finance, music, tech services unified</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-xl bg-amber-500/10">
                <Wrench className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase mb-1">Compliance-First Trading</h3>
              <p className="text-xs text-zinc-400">Educational signals, no financial advice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Platform Exists */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="theme-panel p-8 sm:p-12 text-center">
          <span className="theme-kicker mb-4">Platform Rationale</span>
          <h2 className="theme-title text-2xl sm:text-3xl md:text-4xl mb-6">Why This Platform Exists</h2>
          <div className="text-zinc-200 text-base sm:text-lg leading-relaxed space-y-4 max-w-2xl mx-auto">
            <p>
              One system. Multiple specialized environments. One uncompromising quality standard.
            </p>
            <p>
              TradeHax was built to solve a simple problem: <strong className="text-white">execution without fragmentation</strong>.
              Whether you need market intelligence, creative instruction, or technical delivery—everything runs on the same
              infrastructure, same AI backbone, same commitment to real results.
            </p>
            <p className="text-sm text-zinc-400 border-t border-white/10 pt-4 mt-6">
              No hype. No shortcuts. Just professional-grade tools and clear paths to action.
            </p>
          </div>
        </div>
      </section>

      {/* Action Footer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="theme-panel p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="theme-title text-2xl sm:text-3xl mb-3">Ready to Execute?</h2>
            <p className="text-zinc-300 text-base">Choose your entry point and start immediately.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <TrackedCtaLink
              href="/ai-hub"
              conversionId="open_ai_chat"
              surface="home:action_footer"
              conversionContext={{ placement: "action_footer", variant: "ai_assistant", audience: "all" }}
              className="theme-cta theme-cta--loud justify-center px-6 py-4"
            >
              Launch AI Assistant
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/intelligence"
              conversionId="open_intelligence"
              surface="home:action_footer"
              conversionContext={{ placement: "action_footer", variant: "intelligence", audience: "all" }}
              className="theme-cta theme-cta--loud justify-center px-6 py-4"
            >
              View Intelligence
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/music"
              conversionId="open_music"
              surface="home:action_footer"
              conversionContext={{ placement: "action_footer", variant: "music", audience: "all" }}
              className="theme-cta theme-cta--loud justify-center px-6 py-4"
            >
              Explore Music
            </TrackedCtaLink>
            <TrackedCtaLink
              href={scheduleLinks.root}
              conversionId="open_schedule"
              surface="home:action_footer"
              conversionContext={{ placement: "action_footer", variant: "build", audience: "all" }}
              className="theme-cta theme-cta--loud justify-center px-6 py-4"
            >
              Request Build
            </TrackedCtaLink>
          </div>
        </div>
      </section>

      {/* Service Grid Section */}
      <DeferredRender
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20" aria-busy="true">
            <div className="theme-panel p-6 sm:p-8">
              <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 h-3 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        }
      >
        <section id="home-service-grid">
          <ServiceGrid />
        </section>
      </DeferredRender>

      <DeferredRender
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20" aria-busy="true">
            <div className="theme-panel p-6 sm:p-8">
              <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 h-3 w-2/3 rounded bg-white/10 animate-pulse" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        }
      >
        <section id="home-ai-neural">
          <AINeuralHub />
        </section>
      </DeferredRender>

      <DeferredRender
        fallback={
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20" aria-busy="true">
            <div className="theme-panel p-6 sm:p-8">
              <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 h-3 w-3/5 rounded bg-white/10 animate-pulse" />
              <div className="mt-2 h-3 w-2/5 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        }
      >
        <section id="home-roadmap">
          <Roadmap />
        </section>
      </DeferredRender>

      {/* Quick Contact Rail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 p-6 sm:p-8 glass-panel rounded-3xl border border-white/5">
          <p className="text-zinc-300 font-mono text-xs uppercase tracking-widest">Direct Access</p>
          <TrackedCtaLink
            href={businessProfile.contactLinks.text}
            conversionId="contact_text"
            surface="home:footer_rail"
            external
            className="flex items-center gap-2 text-white hover:text-cyan-500 transition-colors font-bold"
          >
            <MessageSquare className="w-4 h-4" />
            Text {businessProfile.contactPhoneDisplay}
          </TrackedCtaLink>
          <div className="h-4 w-px bg-zinc-800 hidden md:block" />
          <Link href="/about" className="text-zinc-400 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
            About
          </Link>
          <Link href="/portfolio" className="text-zinc-400 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
            Portfolio
          </Link>
        </div>
      </section>

      <div className="mobile-action-shell md:hidden">
        <div className="mobile-action-grid">
          <TrackedCtaLink
            href={scheduleLinks.root}
            conversionId="open_schedule"
            surface="home:mobile_sticky"
            conversionContext={{ placement: "sticky", variant: "book_now", audience: "all" }}
            className="mobile-action-btn mobile-action-btn--primary"
          >
            Book Now
          </TrackedCtaLink>
          <TrackedCtaLink
            href="/ai-hub"
            conversionId="open_ai_chat"
            surface="home:mobile_sticky"
            conversionContext={{ placement: "sticky", variant: "ai_assistant", audience: "all" }}
            className="mobile-action-btn"
          >
            Start AI
          </TrackedCtaLink>
        </div>
      </div>
    </main>
  );
}
