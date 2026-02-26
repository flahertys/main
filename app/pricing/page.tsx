import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { getAllPlans } from "@/lib/monetization/plans";
import { createPageMetadata } from "@/lib/seo";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: "Pricing and Plans | TradeHax AI Services",
  description:
    "Transparent AI pricing tiers with 30 minutes of free AI use every week for all users.",
  path: "/pricing",
  keywords: [
    "service pricing tradehax ai",
    "free ai minutes weekly",
    "web development pricing",
    "guitar lesson pricing",
    "tech repair pricing philadelphia",
    "web3 consulting rates",
  ],
});

type Plan = {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = getAllPlans().map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: plan.monthlyPriceUsd,
  yearlyPrice: plan.yearlyPriceUsd,
  cadence: "per month",
  description: plan.description,
  features: plan.features,
  cta: `/billing?tier=${plan.id}`,
  featured: plan.id === "pro",
}));

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <span className="theme-kicker mb-3">Transparent Pricing</span>
          <h1 className="theme-title text-3xl sm:text-4xl font-bold mb-4">
            Subscription Plans for AI + Trading + Game Access
          </h1>
          <p className="theme-subtitle">
            Everyone gets 30 minutes of free AI use each week. Choose a paid tier anytime for higher limits and premium lanes.
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
                ${plan.price.toFixed(2)}
                <span className="text-sm text-[#9fb0cf] font-medium"> {plan.cadence}</span>
              </p>
              <p className="text-xs text-[#8eaac0]">or ${plan.yearlyPrice.toFixed(2)} yearly</p>
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
                Manage Tier
              </Link>
            </article>
          ))}
        </section>

        <section className="theme-panel p-6 sm:p-8">
          <h2 className="theme-title text-2xl font-bold mb-4">Payment Options</h2>
          <p className="theme-subtitle">
            Multi-rail checkout routes are available through the billing
            console (Stripe, Coinbase, PayPal, Square, Venmo, Cash App, eBay, and crypto links),
            depending on your configured provider accounts.
          </p>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
