import { IntelligenceOpsPanel } from "@/components/intelligence/IntelligenceOpsPanel";
import { IntelligencePageShell } from "@/components/intelligence/IntelligencePageShell";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops Metrics | TradeHax Intelligence",
  description:
    "Operational dashboard for live ingestion health and alert SLA metrics across provider and Discord routing layers.",
};

export default function IntelligenceOpsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <IntelligencePageShell
          kicker="Operations Layer"
          title="Live Ingestion + SLA Metrics"
          description="Monitor provider quality, live stream state, and alert delivery reliability in one control surface."
          quickLinks={[
            { label: "Overview", href: "/intelligence" },
            { label: "Watchlists", href: "/intelligence/watchlist" },
            { label: "Content Studio", href: "/intelligence/content" },
          ]}
        >
          <IntelligenceOpsPanel />
        </IntelligencePageShell>
      </main>
      <ShamrockFooter />
    </div>
  );
}
