"use client";

import { ServiceGrid } from '@/components/landing/ServiceGrid';
import { Roadmap } from '@/components/landing/Roadmap';
import { AINeuralHub } from '@/components/landing/AINeuralHub';
import { LiveActivity } from '@/components/ui/LiveActivity';
import { GlitchText } from '@/components/ui/GlitchText';
import { WalletButton } from "@/components/counter/WalletButton";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { businessProfile } from "@/lib/business-profile";
import { bookingLinks } from "@/lib/booking";
import {
  ArrowRight,
  CircuitBoard,
  Guitar,
  HandCoins,
  MessageSquare,
  MonitorSmartphone,
  Wrench,
} from "lucide-react";
import Link from 'next/link';

const intentLanes = [
  {
    title: "Need Service Now",
    detail: "Phone/computer repair, optimization, and urgent troubleshooting with rapid intake.",
    href: bookingLinks.techSupport,
    external: true,
    conversionId: "book_repair_quote",
    surface: "home:intent_lane",
    cta: "Start Tech Support Intake",
    icon: Wrench,
  },
  {
    title: "Need a Build Partner",
    detail: "Website creation, app development, blockchain/crypto systems, and AI automation delivery.",
    href: bookingLinks.webDevConsult,
    external: true,
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
  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="h-[80vh] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-6 italic uppercase">
          <GlitchText text="TRADEHAX" />
        </h1>
        <p className="text-zinc-500 max-w-xl text-lg mb-10 font-medium leading-relaxed">
          The cross-chain intersection of institutional-grade AI, decentralized gaming, and elite skill acquisition.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 items-center">
          <TrackedCtaLink
            href="/schedule"
            conversionId="open_schedule"
            surface="home:hero"
            className="px-10 py-5 bg-white text-black font-black rounded-full hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-105"
          >
            BOOK_SERVICE
          </TrackedCtaLink>
          <Link href="/game">
            <button className="px-10 py-5 border border-zinc-700 text-white font-black rounded-full hover:bg-zinc-800 transition-all">
              PLAY_RUNNER
            </button>
          </Link>
          <Link href="/billing">
            <button className="px-10 py-5 border border-cyan-500/50 text-cyan-300 font-black rounded-full hover:bg-cyan-500 hover:text-black transition-all">
              UPGRADE_AI
            </button>
          </Link>
          <div className="min-h-10">
            <WalletButton />
          </div>
        </div>
      </section>

      <LiveActivity />

      {/* Intent Lanes Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="theme-panel p-8 md:p-12">
          <span className="theme-kicker mb-4">Start Here</span>
          <h2 className="theme-title text-4xl md:text-5xl mb-6">What Are You Here For Today?</h2>
          <p className="text-zinc-500 max-w-2xl mb-12 text-lg">
            Pick the path that matches your intent. Each route is optimized for clear next steps and fast booking.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {intentLanes.map((lane) => (
              <article key={lane.title} className="theme-grid-card">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 mb-4">
                  <lane.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase italic">{lane.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{lane.detail}</p>
                <TrackedCtaLink
                  href={lane.href}
                  external={lane.external}
                  conversionId={lane.conversionId}
                  surface={lane.surface}
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
      <ServiceGrid />

      <AINeuralHub />

      <Roadmap />

      {/* Quick Contact Rail */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-center gap-6 p-8 glass-panel rounded-3xl border border-white/5">
          <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Direct_Access:</p>
          <TrackedCtaLink
            href={businessProfile.contactLinks.text}
            conversionId="contact_text"
            surface="home:footer_rail"
            external
            className="flex items-center gap-2 text-white hover:text-cyan-500 transition-colors font-bold"
          >
            <MessageSquare className="w-4 h-4" />
            TEXT {businessProfile.contactPhoneDisplay}
          </TrackedCtaLink>
          <div className="h-4 w-px bg-zinc-800 hidden md:block" />
          <Link href="/about" className="text-zinc-400 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
            About + Trust
          </Link>
          <Link href="/portfolio" className="text-zinc-400 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
            Portfolio
          </Link>
        </div>
      </section>
    </main>
  );
}
