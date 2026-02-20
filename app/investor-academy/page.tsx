import { InvestorAcademyExperience } from "@/components/education/InvestorAcademyExperience";
import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { investorAcademyModules } from "@/lib/investor-academy/modules";
import { createPageMetadata } from "@/lib/seo";
import { ActivitySquare, BarChart3, Radar } from "lucide-react";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: "Investor Academy | TradeHax AI",
  description:
    "Gamified stock and crypto investing education with simulation-based modules, quizzes, and utility token rewards. No brokerage execution.",
  path: "/investor-academy",
  keywords: [
    "investing education",
    "paper trading",
    "gamified learning",
    "stock market simulator",
    "crypto education",
    "tradehax academy",
  ],
});

export default function InvestorAcademyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <section className="rounded-2xl border border-[#355070] bg-[#07111f] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Web5 Learning Layer</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-black text-white tracking-tight">Investor Academy</h1>
          <p className="mt-4 max-w-3xl text-[#b7cbe3] leading-relaxed">
            Build practical market literacy through gamified modules, simulation challenges, and progress rewards.
            This experience is educational and non-custodial: no trade execution, no brokerage functions, and no
            personalized investment advice.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em]">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-cyan-200">Simulation only</span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">$HAX utility rewards</span>
            <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200">Quest-ready progression</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/intelligence"
            className="rounded-xl border border-[#355070] bg-[#07111f] p-4 hover:border-cyan-400/50 transition-colors"
          >
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-cyan-300/80">
              <Radar className="h-3.5 w-3.5" /> Insight Route
            </p>
            <h2 className="mt-2 text-lg font-bold text-white">Open Intelligence Hub</h2>
            <p className="mt-1 text-sm text-[#b7cbe3]">Review flow, dark pool, and news catalysts for learning scenarios.</p>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-[#355070] bg-[#07111f] p-4 hover:border-emerald-400/50 transition-colors"
          >
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-emerald-300/80">
              <BarChart3 className="h-3.5 w-3.5" /> Practice Route
            </p>
            <h2 className="mt-2 text-lg font-bold text-white">Open Trading Dashboard</h2>
            <p className="mt-1 text-sm text-[#b7cbe3]">Apply academy concepts in your simulation workflow and track outcomes.</p>
          </Link>

          <Link
            href="/intelligence/watchlist"
            className="rounded-xl border border-[#355070] bg-[#07111f] p-4 hover:border-fuchsia-400/50 transition-colors"
          >
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-fuchsia-300/80">
              <ActivitySquare className="h-3.5 w-3.5" /> Alert Route
            </p>
            <h2 className="mt-2 text-lg font-bold text-white">Open Alert Watchlists</h2>
            <p className="mt-1 text-sm text-[#b7cbe3]">Set triggers to feed daily academy quests with high-context market events.</p>
          </Link>
        </section>

        <InvestorAcademyExperience modules={investorAcademyModules} />
      </main>
      <ShamrockFooter />
    </div>
  );
}
