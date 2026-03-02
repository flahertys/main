import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { HomeEngagementTracker } from "@/components/analytics/HomeEngagementTracker";
import { ExperimentReadoutPanel } from "@/components/analytics/ExperimentReadoutPanel";
import { HomeHeroActions } from "@/components/landing/HomeHeroActions";
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

const WalletButton = dynamic(
  () => import("@/components/counter/WalletButton").then((mod) => mod.WalletButton),
  {
    loading: () => (
      <div className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.02]" aria-hidden="true" />
    ),
  },
);

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

const intentLanes = [
  {
    title: "Need Service Now",
    detail: "Phone/computer repair, optimization, and urgent troubleshooting with rapid intake.",
    href: scheduleLinks.techSupport,
    external: false,
    conversionId: "book_repair_quote",
    surface: "home:intent_lane",
    cta: "Start Tech Support Intake",
    icon: Wrench,
  },
  {
    title: "Need a Build Partner",
    detail: "Website creation, app development, blockchain/crypto systems, and AI automation delivery.",
    href: scheduleLinks.webDevConsult,
    external: false,
    conversionId: "book_web3_consult",
    surface: "home:intent_lane",
    cta: "Book Build Consultation",
    icon: MonitorSmartphone,
  },
  {
    title: "Music Lessons and Artist Growth",
    detail: "Private guitar lessons, platform growth, and scholarship/reward infrastructure.",
    href: "/music",
    external: false,
    conversionId: "open_music",
    surface: "home:intent_lane",
    cta: "Explore Music Services",
    icon: Guitar,
  },
  {
    title: "Trading Research and Token Roadmap",
    detail: "Follow market discussions, project updates, and utility-token roadmap progress.",
    href: "/crypto-project",
    external: false,
    conversionId: "open_crypto_project",
    surface: "home:intent_lane",
    cta: "Review Crypto Project",
    icon: CircuitBoard,
  },
] as const;

export default function Home() {
  const quickPathLinks = [
    { label: "Book Service", href: scheduleLinks.root, conversionId: "open_schedule", variant: "book_service" },
    { label: "Open AI Hub", href: "/ai-hub", conversionId: "open_ai_chat", variant: "ai_hub" },
    { label: "View Pricing", href: "/pricing", conversionId: "open_pricing", variant: "pricing" },
  ] as const;

  return (
    <main className="min-h-screen bg-black">
      <HomeEngagementTracker />
      <ExperimentReadoutPanel />

      {/* Hero + Guided Experience */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-14">
        <div className="absolute top-[-8rem] right-[-6rem] w-[460px] h-[460px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-9rem] left-[-4rem] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-6 sm:gap-8 items-start">
          <div className="theme-panel p-6 sm:p-8 md:p-12">
            <span className="theme-kicker mb-4">Operational Entry</span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase mb-5">
              <GlitchText text="TradeHax" />
            </h1>
            <p className="text-zinc-300 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
              Professional digital execution for service, growth, and AI workflows.
              Start with a clear intent and move through a predictable path.
            </p>

            <HomeHeroActions scheduleHref={scheduleLinks.root} />
          </div>

          <div className="theme-panel p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-300">Guided Experience</h2>
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="space-y-3">
              {[
                {
                  title: "1) Define Intent",
                  detail: "Choose service, AI workflow, or market research path.",
                },
                {
                  title: "2) Follow Route",
                  detail: "Use guided page flow with minimal decision overhead.",
                },
                {
                  title: "3) Execute Next Action",
                  detail: "Book, deploy, or run the recommended operation.",
                },
              ].map((step) => (
                <article key={step.title} className="interactive-surface rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-400">{step.detail}</p>
                </article>
              ))}
            </div>
            <details className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-300">
                Advanced Wallet Tools
              </summary>
              <div className="mt-3 min-h-10">
                <WalletButton />
              </div>
            </details>
          </div>
        </div>
      </section>

      <LiveActivity />

      <section id="home-quick-paths" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
        <div className="theme-panel p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-300">Quick Paths</h2>
            <p className="text-xs text-zinc-400">Choose one route and execute the next action in under 60 seconds.</p>
          </div>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
            {quickPathLinks.map((route) => (
              <TrackedCtaLink
                key={route.label}
                href={route.href}
                conversionId={route.conversionId}
                surface="home:quick_paths"
                conversionContext={{ placement: "quick_paths", variant: route.variant, audience: "all" }}
                className="theme-cta theme-cta--secondary shrink-0 px-4 py-2 text-xs uppercase tracking-wider"
              >
                {route.label}
              </TrackedCtaLink>
            ))}
          </div>
        </div>
      </section>

      {/* Intent Lanes Section */}
      <section id="home-intent-lanes" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="theme-panel p-6 sm:p-8 md:p-12">
          <span className="theme-kicker mb-4">Start Here</span>
          <h2 className="theme-title text-3xl sm:text-4xl md:text-5xl mb-6">Choose Your Primary Path</h2>
          <p className="text-zinc-300 max-w-2xl mb-10 sm:mb-12 text-base sm:text-lg">
            This matrix removes guesswork: select one lane, complete the route, then return for the next objective.
          </p>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {intentLanes.map((lane) => (
              <article key={lane.title} className="theme-grid-card">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 mb-4">
                  <lane.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase italic">{lane.title}</h3>
                <p className="text-zinc-300 text-sm leading-relaxed">{lane.detail}</p>
                <TrackedCtaLink
                  href={lane.href}
                  external={lane.external}
                  conversionId={lane.conversionId}
                  surface={lane.surface}
                  conversionContext={{ placement: "intent_lane", variant: lane.title.toLowerCase().replace(/\s+/g, "_"), audience: "all" }}
                  className="theme-cta theme-cta--secondary mt-4 self-start"
                >
                  {lane.cta}
                  <ArrowRight className="w-4 h-4" />
                </TrackedCtaLink>
              </article>
            ))}
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
