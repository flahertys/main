import { ProbabilityPanel } from "@/components/intelligence/ProbabilityPanel";
import { IntelligencePageShell } from "@/components/intelligence/IntelligencePageShell";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "Probability Engine | TradeHax Intelligence",
  description:
    "Macro + micro + pattern-based probability scenarios with calibrated confidence and explainable drivers.",
  path: "/intelligence/probability",
});

export default function IntelligenceProbabilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <IntelligencePageShell
          kicker="Fusion Layer"
          title="Probability Engine"
          description="Calibrated direction probabilities combining options flow, dark-pool pressure, crypto tape, and macro catalyst context."
          quickLinks={[
            { label: "Overview", href: "/intelligence" },
            { label: "Flow Tape", href: "/intelligence/flow" },
            { label: "Dark Pool", href: "/intelligence/dark-pool" },
            { label: "Crypto Flow", href: "/intelligence/crypto-flow" },
          ]}
        >
          <ProbabilityPanel />
        </IntelligencePageShell>
      </main>
      <ShamrockFooter />
    </div>
  );
}
