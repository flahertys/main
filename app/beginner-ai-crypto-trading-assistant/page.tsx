import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import Script from "next/script";

export const metadata = createPageMetadata({
  title: "Beginner AI Crypto Trading Assistant | TradeHax AI",
  description:
    "Learn beginner AI crypto trading workflows with clear risk controls, scenario planning, and practical next actions.",
  path: "/beginner-ai-crypto-trading-assistant",
  keywords: [
    "beginner ai crypto trading assistant",
    "ai trading strategies for beginners",
    "crypto risk management beginner",
    "how to start ai trading",
  ],
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How can beginners use AI for crypto trading safely?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Start with small position sizing, explicit invalidation levels, and scenario-based plans. AI should assist decision quality, not replace risk discipline.",
      },
    },
    {
      "@type": "Question",
      name: "What should an AI trading plan include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Include market thesis, entry trigger, stop/invalidation, target zones, and one concrete next action for execution or stand-down.",
      },
    },
  ],
};

export default function BeginnerAiCryptoTradingAssistantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <Script id="faq-beginner-ai-crypto" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqJsonLd)}
      </Script>

      <ShamrockHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Beginner Track</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Beginner AI Crypto Trading Assistant</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Get operator-grade guidance without overwhelm. Build confidence with risk-aware playbooks, structured prompts,
            and clear execution checkpoints.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "Define thesis + invalidation before entry",
              "Use bounded scenarios and confidence ranges",
              "Execute only when trigger and risk profile align",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <TrackedCtaLink
              href="/ai-hub"
              conversionId="open_ai_chat"
              surface="seo:beginner_ai_crypto"
              conversionContext={{ placement: "hero", variant: "start_ai_hub", audience: "all" }}
              className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
            >
              Start in AI Hub
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/blog/automated-trading-strategies-2026"
              conversionId="open_service_catalog"
              surface="seo:beginner_ai_crypto"
              conversionContext={{ placement: "hero", variant: "learn_strategy", audience: "all" }}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/15"
            >
              Read Strategy Guide
            </TrackedCtaLink>
          </div>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
