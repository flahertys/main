import { IntelligenceMetricCard } from "@/components/intelligence/IntelligenceMetricCard";
import { IntelligencePageShell } from "@/components/intelligence/IntelligencePageShell";
import { IntelligenceRouteCard } from "@/components/intelligence/IntelligenceRouteCard";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { formatCompactUsd } from "@/lib/intelligence/format";
import { getIntelligenceSnapshot } from "@/lib/intelligence/provider";
import {
  ActivitySquare,
  BarChart3,
  BellRing,
  Bot,
  BookOpen,
  CandlestickChart,
  Newspaper,
  Radar,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence Hub | TradeHax AI",
  description:
    "Cross-asset intelligence stack for options flow, dark pool activity, political disclosures, crypto flow, and AI-assisted media workflows.",
};

export default async function IntelligenceHubPage() {
  const snapshot = await getIntelligenceSnapshot();
  const overview = snapshot.overview;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <IntelligencePageShell
          kicker="Institutional Terminal"
          title="TradeHax Intelligence Hub"
          description="A modular decision layer inspired by institutional flow platforms, merged with crypto analytics and AI copilots for fast, explainable execution."
          quickLinks={[
            { label: "Flow Tape", href: "/intelligence/flow" },
            { label: "Dark Pool", href: "/intelligence/dark-pool" },
            { label: "Crypto Flow", href: "/intelligence/crypto-flow" },
            { label: "Watchlists", href: "/intelligence/watchlist" },
            { label: "Ops Metrics", href: "/intelligence/ops" },
            { label: "Content Studio", href: "/intelligence/content" },
          ]}
        >
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <IntelligenceMetricCard
              label="Options Premium"
              value={formatCompactUsd(overview.optionsPremium24hUsd)}
              hint="24h tracked notional"
            />
            <IntelligenceMetricCard
              label="Dark Pool"
              value={formatCompactUsd(overview.darkPoolNotional24hUsd)}
              hint="24h off-exchange notional"
            />
            <IntelligenceMetricCard
              label="Crypto Flow"
              value={formatCompactUsd(overview.cryptoNotional24hUsd)}
              hint="24h crypto notional"
            />
            <IntelligenceMetricCard
              label="High Impact News"
              value={String(overview.highImpactNewsCount)}
              hint="Catalysts requiring attention"
            />
            <IntelligenceMetricCard
              label="Unusual Contracts"
              value={String(overview.unusualContractsCount)}
              hint="Score >= 80"
            />
          </section>

          <div className="text-xs uppercase tracking-[0.2em] text-[#8ea8be]">
            Data Provider: {snapshot.status.vendor} ({snapshot.status.source}
            {snapshot.status.simulated ? " simulated" : " live"})
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <IntelligenceRouteCard
              title="Options Flow Tape"
              description="Track high-premium call/put activity with unusual-score filters and AI interpretation."
              href="/intelligence/flow"
              icon={<CandlestickChart className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="Dark Pool Scanner"
              description="Monitor large off-exchange blocks, side estimates, and execution venues."
              href="/intelligence/dark-pool"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="Political Trades"
              description="Review congressional/senate disclosures and map themes to trade regimes."
              href="/intelligence/politics"
              icon={<BookOpen className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="Crypto Flow"
              description="Cross-chain signal stream for pair-level notional, confidence, and directional context."
              href="/intelligence/crypto-flow"
              icon={<Radar className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="News Catalyst Feed"
              description="Action-focused market/news intelligence with impact and category filters."
              href="/intelligence/news"
              icon={<Newspaper className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="AI Media Studio"
              description="Generate YouTube + Discord daily briefs directly from intelligence feeds."
              href="/intelligence/content"
              icon={<Bot className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="Watchlist Alerts"
              description="Create symbol watchlists, detect triggers, and route alerts to tier-based Discord channels."
              href="/intelligence/watchlist"
              icon={<BellRing className="w-5 h-5" />}
            />
            <IntelligenceRouteCard
              title="Ops Metrics"
              description="Track live ingestion health, provider latency, and alert delivery SLA performance."
              href="/intelligence/ops"
              icon={<ActivitySquare className="w-5 h-5" />}
            />
          </section>
        </IntelligencePageShell>
      </main>
      <ShamrockFooter />
    </div>
  );
}
