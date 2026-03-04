import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import Script from "next/script";

export const metadata = createPageMetadata({
  title: "Web3 Token Roadmap Consulting | TradeHax AI",
  description:
    "Plan token utility phases, governance milestones, and measurable rollout KPIs with a practical consulting roadmap.",
  path: "/web3-token-roadmap-consulting",
  keywords: [
    "web3 token roadmap consulting",
    "token utility roadmap",
    "token governance planning",
    "web3 product strategy consulting",
  ],
});

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Web3 Token Roadmap Consulting",
  provider: {
    "@type": "Organization",
    name: "TradeHax AI",
  },
  serviceType: "Web3 Strategy Consulting",
  areaServed: "United States",
  description:
    "Token utility planning, phased rollout strategy, governance readiness, and KPI mapping for sustainable Web3 growth.",
};

export default function Web3TokenRoadmapConsultingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <Script id="service-web3-roadmap" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(serviceJsonLd)}
      </Script>

      <ShamrockHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-200">Web3 Advisory</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Web3 Token Roadmap Consulting</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Build a forward-leaning roadmap with practical phases: onboarding, utility, retention loops, and governance.
            We focus on measurable outcomes over hype.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              "Phase 1: onboarding + wallet UX",
              "Phase 2: utility loops + incentives",
              "Phase 3: governance + accountability",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <TrackedCtaLink
              href="/schedule"
              conversionId="book_web3_consult"
              surface="seo:web3_roadmap"
              conversionContext={{ placement: "hero", variant: "book_consult", audience: "all" }}
              className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-4 py-2 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-500/30"
            >
              Book Web3 Consultation
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/blog/small-business-web3-implementation-roadmap"
              conversionId="open_crypto_project"
              surface="seo:web3_roadmap"
              conversionContext={{ placement: "hero", variant: "learn_roadmap", audience: "all" }}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/15"
            >
              Read Roadmap Article
            </TrackedCtaLink>
          </div>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
