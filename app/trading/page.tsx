import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { TradehaxBotDashboard } from "@/components/trading/TradehaxBotDashboard";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "TradeHax Bots - Automated Trading Dashboard",
  description: "Manage automated trading bots with clearly separated Crypto and Stock categories, plus beginner-friendly guidance and strategy controls.",
  path: "/trading",
  keywords: ["automated trading", "crypto bots", "stock bots", "trading dashboard", "bot strategies"],
});

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TradehaxBotDashboard />
      </main>

      <ShamrockFooter />
    </div>
  );
}
