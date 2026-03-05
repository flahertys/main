import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { PortfolioOverview } from "@/components/trading/PortfolioOverview";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Portfolio Dashboard - TradeHax AI",
  description:
    "Track your multi-exchange portfolio in real time. Monitor asset allocation, 24h performance, and receive AI-powered rebalance suggestions.",
  path: "/trading/portfolio",
  keywords: [
    "portfolio dashboard",
    "crypto portfolio",
    "asset allocation",
    "rebalance suggestions",
    "exchange tracker",
  ],
});

export default function TradingPortfolioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-2">
            Portfolio Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Connect your exchanges and track your full portfolio in one place with AI-powered rebalance suggestions.
          </p>
        </div>

        <PortfolioOverview />
      </main>

      <ShamrockFooter />
    </div>
  );
}
