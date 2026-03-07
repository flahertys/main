import { createPageMetadata } from "@/lib/seo";
import PolymarketClientPage from "./PolymarketClientPage";

export const metadata = createPageMetadata({
  title: "TradeHax Polymarket Terminal - Prediction Market Trading",
  description:
    "Live Polymarket trading terminal with Fibonacci, Full Kelly, Bayesian, Monte Carlo, and multi-timeframe analysis. Predict market outcomes with AI-powered signals.",
  path: "/polymarket",
  keywords: [
    "polymarket",
    "prediction markets",
    "trading bot",
    "kelly criterion",
    "fibonacci trading",
    "bayesian analysis",
    "monte carlo",
    "defi trading",
    "polygon wallet",
  ],
});

export default function PolymarketPage() {
  return <PolymarketClientPage />;
}
