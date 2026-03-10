import { IntelligenceMetricCard } from "@/components/intelligence/IntelligenceMetricCard";
import { IntelligencePageShell } from "@/components/intelligence/IntelligencePageShell";
import { IntelligenceRouteCard } from "@/components/intelligence/IntelligenceRouteCard";
import { TrackedCtaLink } from "@/components/monetization/TrackedCtaLink";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { formatCompactUsd } from "@/lib/intelligence/format";
import { getIntelligenceSnapshot } from "@/lib/intelligence/provider";
import { createPageMetadata } from "@/lib/seo";
import {
  ActivitySquare,
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Bot,
  CandlestickChart,
  Crosshair,
  Newspaper,
  Radar,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const metadata = createPageMetadata({
  title: "Trade Intelligence | AI Quant Copilot for Real-Time Signals",
  description:
    "AI quant copilot for real-time signals, backtesting, and explainable trade workflows. Options flow, dark pool activity, crypto signals, and institutional-grade analytics.",
  path: "/intelligence",
  keywords: ["market intelligence", "options flow", "dark pool", "crypto flow", "trading analytics", "AI copilot", "trade signals"],
});

export default async function IntelligenceHubPage() {
  const snapshot = await getIntelligenceSnapshot();
  const overview = snapshot.overview;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 md:pb-14">
        {/* Hero Section */}
        <section className="theme-panel p-8 sm:p-12 md:p-16 mb-8 text-center">
          <span className="theme-kicker mb-5">Trade Intelligence</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl leading-tight font-black text-white tracking-tighter italic uppercase mb-6">
            AI Quant Copilot
          </h1>
          <p className="text-zinc-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
            Real-time signals, backtesting, and explainable trade workflows powered by institutional-grade data and AI analysis.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <TrackedCtaLink
              href="/intelligence/flow"
              conversionId="open_flow_tape"
              surface="intelligence:hero"
              conversionContext={{ placement: "hero_primary", variant: "flow_tape", audience: "all" }}
              className="theme-cta theme-cta--loud px-6 py-3"
            >
              View Options Flow
              <ArrowRight className="w-4 h-4" />
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/ai-hub"
              conversionId="open_ai_chat"
              surface="intelligence:hero"
              conversionContext={{ placement: "hero_secondary", variant: "ai_copilot", audience: "all" }}
              className="theme-cta theme-cta--secondary px-6 py-3"
            >
              Launch AI Copilot
            </TrackedCtaLink>
          </div>
        </section>

        {/* Value Proposition - What You Get */}
        <section className="theme-panel p-6 sm:p-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase italic mb-6">What You Get</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-cyan-500/10">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Real-Time Market Signals</h3>
                <p className="text-sm text-zinc-400">
                  Live options flow, dark pool blocks, and crypto movements with unusual activity detection
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-purple-500/10">
                <Bot className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">AI-Powered Analysis</h3>
                <p className="text-sm text-zinc-400">
                  Explainable AI copilot interprets signals, identifies patterns, and suggests next actions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/10">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Institutional-Grade Data</h3>
                <p className="text-sm text-zinc-400">
                  Access the same flow data and analytics used by professional trading desks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-amber-500/10">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Multi-Asset Coverage</h3>
                <p className="text-sm text-zinc-400">
                  Equities, options, crypto, political trades—all in one unified intelligence layer
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-rose-500/10">
                <BellRing className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Custom Alerts & Watchlists</h3>
                <p className="text-sm text-zinc-400">
                  Set trigger conditions and get Discord notifications when your watchlist moves
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-indigo-500/10">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Risk-First Framework</h3>
                <p className="text-sm text-zinc-400">
                  Educational signals with compliance language—never financial advice
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Metrics Dashboard */}
        <IntelligencePageShell
          kicker="Live Market Snapshot"
          title="Current Intelligence Overview"
          description="Real-time metrics across options, dark pool, crypto, and news catalysts. Data refreshes every 60 seconds."
          quickLinks={[
            { label: "Flow Tape", href: "/intelligence/flow" },
            { label: "Dark Pool", href: "/intelligence/dark-pool" },
            { label: "Crypto Flow", href: "/intelligence/crypto-flow" },
            { label: "Probability", href: "/intelligence/probability" },
            { label: "Watchlists", href: "/intelligence/watchlist" },
            { label: "Ops Metrics", href: "/intelligence/ops" },
            { label: "Content Studio", href: "/intelligence/content" },
          ]}
        >
          <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
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

          {/* Intelligence Module Grid */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white uppercase italic">Intelligence Modules</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                title="Probability Engine"
                description="Calibrated long/short probabilities blending macro catalysts, microstructure flow, and pattern drivers."
                href="/intelligence/probability"
                icon={<Crosshair className="w-5 h-5" />}
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
            </div>
          </section>
        </IntelligencePageShell>

        {/* Compliance & Risk Disclosure */}
        <section className="theme-panel p-6 sm:p-8 mt-8 border-l-4 border-l-amber-500">
          <div className="flex items-start gap-4 mb-4">
            <Shield className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-white uppercase mb-2">Compliance & Risk Disclosure</h2>
              <div className="text-sm text-zinc-300 space-y-2">
                <p>
                  <strong className="text-white">Educational Signals Only:</strong> All intelligence, signals, and analysis provided are for educational and informational purposes only. This is not financial advice.
                </p>
                <p>
                  <strong className="text-white">Risk Warning:</strong> Trading involves substantial risk of loss. Past performance does not guarantee future results. You are solely responsible for your trading decisions.
                </p>
                <p>
                  <strong className="text-white">Data Accuracy:</strong> While we use institutional-grade data providers, market data may have delays, errors, or omissions. Always verify signals independently.
                </p>
                <p className="text-xs text-zinc-400 pt-2 border-t border-white/10">
                  By using this platform, you acknowledge that you understand and accept these risks. Consult a licensed financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="theme-panel p-8 sm:p-12 mt-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase italic mb-4">Ready to Level Up Your Analysis?</h2>
          <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
            Start with real-time options flow or launch the AI copilot to get actionable insights in seconds.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <TrackedCtaLink
              href="/intelligence/flow"
              conversionId="open_flow_tape"
              surface="intelligence:footer_cta"
              conversionContext={{ placement: "footer_cta", variant: "flow_tape", audience: "all" }}
              className="theme-cta theme-cta--loud px-6 py-3"
            >
              Launch Flow Tape
              <ArrowRight className="w-4 h-4" />
            </TrackedCtaLink>
            <TrackedCtaLink
              href="/ai-hub"
              conversionId="open_ai_chat"
              surface="intelligence:footer_cta"
              conversionContext={{ placement: "footer_cta", variant: "ai_copilot", audience: "all" }}
              className="theme-cta theme-cta--secondary px-6 py-3"
            >
              Open AI Copilot
            </TrackedCtaLink>
          </div>
        </section>
      </main>
      <ShamrockFooter />
    </div>
  );
}
