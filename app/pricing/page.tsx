import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { Check, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing and Plans | TradeHax AI Services",
  description:
    "Transparent pricing for tech repair, guitar lessons, and digital/Web3 development support for local and remote clients.",
  keywords: [
    "service pricing tradehax ai",
    "web development pricing",
    "guitar lesson pricing",
    "tech repair pricing philadelphia",
    "web3 consulting rates",
  ],
};

type Plan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter Repair",
    price: "$50",
    cadence: "per session",
    description: "Diagnostics and quick turnaround remote-first repair support.",
    features: [
      "Device triage and rapid issue mapping",
      "Remote fix attempts before hardware escalation",
      "Priority schedule follow-up",
    ],
    cta: "/schedule",
  },
  {
    name: "Guitar Pro Track",
    price: "$100",
    cadence: "per month",
    description: "Weekly lesson rhythm for steady skill growth and accountability.",
    features: [
      "4 live remote lessons monthly",
      "Practice plans and progress checkpoints",
      "Optional music portfolio guidance",
    ],
    cta: "/schedule",
    featured: true,
  },
  {
    name: "Web3 Builder",
    price: "0.25 SOL",
    cadence: "monthly equivalent",
    description: "For teams building NFT utilities, token features, and automation workflows.",
    features: [
      "Architecture advisory and sprint planning",
      "Technical workflow and roadmap guidance",
      "Crypto project support channel",
    ],
    cta: "/crypto-project",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Transparent Pricing</span>
          <h1 className="theme-title text-3xl sm:text-4xl font-bold mb-4">
            Clear Plans for Services and Ongoing Support
          </h1>
          <p className="theme-subtitle">
            Choose the option that matches your goals. We can scope custom
            packages for larger projects.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3 mb-8">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`theme-grid-card ${
                plan.featured ? "border-[#00ff41]/70 shadow-[0_0_28px_rgba(0,255,65,0.2)]" : ""
              }`}
            >
              {plan.featured && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9effbe]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Most Popular
                </span>
              )}
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-3xl font-bold text-white">
                {plan.price}
                <span className="text-sm text-[#9fb0cf] font-medium"> {plan.cadence}</span>
              </p>
              <p>{plan.description}</p>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[#c7d3ea]">
                    <Check className="w-4 h-4 mt-0.5 text-[#70f6a4]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta}
                className={`theme-cta mt-2 px-4 py-2.5 ${
                  plan.featured ? "theme-cta--loud" : "theme-cta--secondary"
                }`}
              >
                Choose Plan
              </Link>
            </article>
          ))}
        </section>

        <section className="theme-panel p-6 sm:p-8">
          <h2 className="theme-title text-2xl font-bold mb-4">Payment Options</h2>
          <p className="theme-subtitle">
            Card and crypto checkout options can be enabled per plan while
            keeping this pricing structure and booking flow consistent.
          </p>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
