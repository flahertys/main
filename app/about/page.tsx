import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { BadgeCheck, Shield, Users, Workflow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About TradeHax AI | Greater Philadelphia Digital Services",
  description:
    "Learn about TradeHax AI, serving Greater Philadelphia and remote clients with web development, tech support, music lessons, and practical Web3 solutions.",
  keywords: [
    "about tradehax ai",
    "web development philadelphia",
    "tech support south jersey",
    "online guitar lessons",
    "web3 consulting",
  ],
};

const pillars = [
  {
    title: "Operational Discipline",
    detail:
      "Every workflow is structured from intake to delivery to keep quality and speed consistent.",
    icon: Workflow,
  },
  {
    title: "Security and Reliability",
    detail:
      "Web3 and service actions prioritize strong controls, clear validation, and safe defaults.",
    icon: Shield,
  },
  {
    title: "Client Transparency",
    detail:
      "Pricing, scope, and timelines are communicated clearly with no hidden process steps.",
    icon: BadgeCheck,
  },
  {
    title: "Community-Centered Growth",
    detail:
      "We support local clients in Greater Philadelphia while serving remote clients nationwide.",
    icon: Users,
  },
] as const;

const testimonials = [
  {
    quote:
      "Fast communication and structured delivery. The process felt professional from day one.",
    author: "Repair Client",
  },
  {
    quote:
      "Lessons are organized and easy to follow. Progress tracking made a big difference.",
    author: "Guitar Student",
  },
  {
    quote:
      "Our Web3 roadmap went from unclear to actionable with clear milestones and accountability.",
    author: "Digital Services Client",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">About TradeHax AI</span>
          <h1 className="theme-title text-3xl sm:text-4xl font-bold mb-4">
            Trusted Service Delivery Across Digital, Technical, and Web3 Work
          </h1>
          <p className="theme-subtitle mb-6">
            TradeHax AI is built around clear communication, quality execution,
            and measurable outcomes for every client engagement.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/services"
              className="theme-cta theme-cta--loud px-5 py-3"
            >
              View Services
            </Link>
            <Link
              href="/schedule"
              className="theme-cta theme-cta--secondary px-5 py-3"
            >
              Book a Session
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {pillars.map(({ title, detail, icon: Icon }) => (
            <article key={title} className="theme-grid-card">
              <Icon className="w-5 h-5 text-[#77f9a8]" />
              <h2 className="text-lg font-semibold">{title}</h2>
              <p>{detail}</p>
            </article>
          ))}
        </section>

        <section className="theme-panel p-6 sm:p-8">
          <h2 className="theme-title text-2xl font-bold mb-6">
            Client Feedback Highlights
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={item.author} className="theme-grid-card">
                <p className="text-sm sm:text-base text-[#d1dcf1]">&quot;{item.quote}&quot;</p>
                <footer className="text-[#9bffc0] text-sm font-semibold mt-2">
                  {item.author}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
