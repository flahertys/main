import { ShamrockFooter } from "@/components/shamrock/ShamrockFooter";
import { ShamrockHeader } from "@/components/shamrock/ShamrockHeader";
import { TradehaxBotDashboard } from "@/components/trading/TradehaxBotDashboard";
import { createPageMetadata } from "@/lib/seo";
import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  FlaskConical,
  LayoutDashboard,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

export const metadata = createPageMetadata({
  title: "TradeHax AI Trading - Automated Strategies, Sentiment & Portfolio",
  description:
    "Full-stack AI trading platform: manage bots, build strategies, analyze sentiment, track your portfolio, run backtests, and get full XAI signal explanations.",
  path: "/trading",
  keywords: [
    "automated trading",
    "crypto bots",
    "stock bots",
    "trading dashboard",
    "portfolio tracker",
    "sentiment engine",
    "backtesting",
    "AI explainability",
  ],
});

// ─── Feature cards ────────────────────────────────────────────────────────────

interface FeatureCard {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

const FEATURES: FeatureCard[] = [
  {
    href: "/polymarket",
    icon: TrendingUp,
    title: "Polymarket Terminal",
    description: "Live prediction market trading with Fibonacci, Full Kelly, Bayesian, Monte Carlo, and multi-timeframe analysis. Polygon wallet support.",
    badge: "Live",
  },
  {
    href: "/trading/portfolio",
    icon: LayoutDashboard,
    title: "Portfolio Dashboard",
    description: "Connect exchanges and monitor your full multi-asset portfolio with real-time value, allocation charts, and AI rebalance suggestions.",
    badge: "Live",
  },
  {
    href: "/trading/sentiment",
    icon: Activity,
    title: "Sentiment Engine",
    description: "Fear & Greed analysis aggregated from social media, news, and on-chain signals. Watch the market mood shift in real time.",
    badge: "Live",
  },
  {
    href: "/trading/strategy-builder",
    icon: BrainCircuit,
    title: "Strategy Builder",
    description: "Drag-and-drop no-code strategy canvas. Combine indicators, filters, and actions, then export or push directly to a bot.",
  },
  {
    href: "/trading/backtest",
    icon: FlaskConical,
    title: "Backtesting Sandbox",
    description: "Run your strategies against historical data. Analyze the equity curve, win rate, max drawdown, and monthly returns.",
  },
  {
    href: "/trading/xai",
    icon: BarChart3,
    title: "AI Explainability",
    description: "See exactly why the AI generated each signal. Factor weights, confidence breakdown, risk assessment, and similar past signals.",
  },
];

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <ShamrockHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hub header */}
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#00FF41] to-[#39FF14] text-transparent bg-clip-text mb-3">
            TradeHax AI Trading Platform
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
            Five production-grade AI tools working together — from sentiment analysis to live portfolio tracking, strategy building, backtesting, and full signal explainability.
          </p>
        </div>

        {/* Feature navigation grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {FEATURES.map(({ href, icon: Icon, title, description, badge }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-2xl border border-slate-700/30 bg-slate-800/20 p-6 transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-800/40 hover:shadow-[0_0_20px_rgba(0,255,65,0.07)]"
            >
              {badge && (
                <span className="absolute top-4 right-4 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-green-400">
                  {badge}
                </span>
              )}
              <div className="mb-3 inline-flex rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-400 transition group-hover:border-cyan-500/40 group-hover:bg-cyan-500/20">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-100 mb-1.5 group-hover:text-white transition">
                {title}
              </h2>
              <p className="text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition">
                {description}
              </p>
            </Link>
          ))}
        </div>

        {/* Bot dashboard */}
        <div className="mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-100">Bot Dashboard</h2>
        </div>
        <TradehaxBotDashboard />
      </main>

      <ShamrockFooter />
    </div>
  );
}
