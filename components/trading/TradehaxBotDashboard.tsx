"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, BadgeInfo, Bot, CircleHelp, Coins, LineChart, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type MarketCategory = "crypto" | "stocks";

interface BotInfo {
  id: string;
  name: string;
  strategy: string;
  market: MarketCategory;
  status: "active" | "paused" | "stopped";
  winRate: number;
  netProfit: number;
  activeTrades: number;
  maxDrawdown: number;
}

interface RecentTrade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  market: MarketCategory;
  createdAt: string;
}

const WALKTHROUGH_STORAGE_KEY = "tradehax-trading-walkthrough-v1";

const WALKTHROUGH_STEPS = [
  {
    id: "market",
    title: "Choose your market first",
    body: "Start by selecting Crypto or Stocks. This filters the dashboard to relevant tools only.",
  },
  {
    id: "beginner",
    title: "Use Beginner View",
    body: "Keep Beginner View ON for simplified cards and plain-language metric guidance.",
  },
  {
    id: "actions",
    title: "Create a bot or quick trade",
    body: "Use Create Bot for automation, or Create Trade for a fast manual entry.",
  },
  {
    id: "cards",
    title: "Read the bot cards",
    body: "Hover/tap info icons for metric definitions. Select a card to open detail actions.",
  },
] as const;

const GLOSSARY = {
  winRate: "Win Rate = percent of closed trades that ended profitable. Higher is generally better, but sample size matters.",
  activeTrades: "Active Trades = positions currently open and being managed by the bot in real time.",
  drawdown: "Drawdown = largest drop from a recent peak in account value. Lower drawdown usually means lower risk.",
} as const;

function MetricLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="inline-flex items-center gap-1 text-xs text-gray-400">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-cyan-300/80 hover:text-cyan-200" aria-label={`${label} info`}>
            <CircleHelp className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="max-w-xs bg-slate-900 text-slate-100 border border-cyan-500/30">
          {tip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function TradehaxBotDashboard() {
  const [bots, setBots] = useState<BotInfo[]>([
    {
      id: "bot-1",
      name: "Scalping Bot Alpha",
      strategy: "scalping",
      market: "crypto",
      status: "active",
      winRate: 83.3,
      netProfit: 2.45,
      activeTrades: 3,
      maxDrawdown: 4.8,
    },
    {
      id: "bot-2",
      name: "Swing Trader Beta",
      strategy: "swing",
      market: "crypto",
      status: "active",
      winRate: 71.2,
      netProfit: 5.82,
      activeTrades: 1,
      maxDrawdown: 7.4,
    },
    {
      id: "bot-3",
      name: "Momentum Equities Gamma",
      strategy: "momentum",
      market: "stocks",
      status: "paused",
      winRate: 64.1,
      netProfit: 1.9,
      activeTrades: 0,
      maxDrawdown: 5.2,
    },
  ]);

  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MarketCategory>("crypto");
  const [newToTradingMode, setNewToTradingMode] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [isCreateTradeOpen, setIsCreateTradeOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState(activeCategory === "crypto" ? "SOL" : "AAPL");
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [tradeSize, setTradeSize] = useState("1");

  const visibleBots = bots.filter((bot) => bot.market === activeCategory);

  const selectedBotInfo = visibleBots.find((bot) => bot.id === selectedBot) || null;

  const currentWalkthrough = WALKTHROUGH_STEPS[walkthroughStep];

  const highlightedSection = useMemo(() => {
    if (!showWalkthrough) return "";
    return currentWalkthrough?.id || "";
  }, [showWalkthrough, currentWalkthrough]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
    if (!hasSeen) {
      setShowWalkthrough(true);
      setWalkthroughStep(0);
    }
  }, []);

  useEffect(() => {
    setTradeSymbol(activeCategory === "crypto" ? "SOL" : "AAPL");
  }, [activeCategory]);

  const closeWalkthrough = useCallback((markSeen = true) => {
    setShowWalkthrough(false);
    if (markSeen && typeof window !== "undefined") {
      window.localStorage.setItem(WALKTHROUGH_STORAGE_KEY, "seen");
    }
  }, []);

  const openWalkthrough = useCallback(() => {
    setWalkthroughStep(0);
    setShowWalkthrough(true);
  }, []);

  const goToNextWalkthroughStep = useCallback(() => {
    if (walkthroughStep >= WALKTHROUGH_STEPS.length - 1) {
      closeWalkthrough(true);
      return;
    }
    setWalkthroughStep((prev) => prev + 1);
  }, [closeWalkthrough, walkthroughStep]);

  const createQuickTrade = useCallback(() => {
    setIsCreateTradeOpen(true);
  }, []);

  const submitQuickTrade = useCallback(() => {
    const symbol = tradeSymbol.trim().toUpperCase();
    if (!symbol) {
      setStatusMessage("Please enter a symbol before submitting the trade.");
      return;
    }

    const size = Number.parseFloat(tradeSize || "0");
    if (!Number.isFinite(size) || size <= 0) {
      setStatusMessage("Please enter a valid trade size greater than 0.");
      return;
    }

    const newTrade: RecentTrade = {
      id: `trade_${Date.now().toString(36)}`,
      symbol,
      side: tradeSide,
      size,
      market: activeCategory,
      createdAt: new Date().toISOString(),
    };

    setRecentTrades((prev) => [newTrade, ...prev].slice(0, 5));
    setStatusMessage(`Created ${activeCategory} ${tradeSide.toUpperCase()} trade for ${newTrade.symbol} (${size}).`);
    setIsCreateTradeOpen(false);
    setTradeSize("1");
  }, [activeCategory, tradeSide, tradeSize, tradeSymbol]);

  const createNewBot = useCallback(async () => {
    const name = prompt(`${activeCategory === "crypto" ? "Crypto" : "Stock"} bot name:`);
    if (!name) return;

    try {
      const response = await fetch("/api/trading/bot/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          strategy: "swing",
          riskLevel: "medium",
          allocatedCapital: 5,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setBots((prev) => [
          ...prev,
          {
            id: data.bot.id,
            name: data.bot.name,
            strategy: data.bot.strategy,
            market: activeCategory,
            status: "active",
            winRate: 0,
            netProfit: 0,
            activeTrades: 0,
            maxDrawdown: 0,
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to create bot:", error);
    }
  }, []);

  return (
    <div className="space-y-6">
      {showWalkthrough && currentWalkthrough && (
        <div className="theme-panel border border-fuchsia-400/30 bg-fuchsia-500/10 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-wide text-fuchsia-200/80">Explain this page · Step {walkthroughStep + 1}/{WALKTHROUGH_STEPS.length}</p>
          <h3 className="mt-1 text-lg font-semibold text-fuchsia-100">{currentWalkthrough.title}</h3>
          <p className="mt-1 text-sm text-fuchsia-100/85">{currentWalkthrough.body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWalkthroughStep((prev) => Math.max(0, prev - 1))}
              disabled={walkthroughStep === 0}
              className="rounded-md border border-fuchsia-300/40 px-3 py-1.5 text-sm text-fuchsia-100 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goToNextWalkthroughStep}
              className="rounded-md border border-fuchsia-300/40 bg-fuchsia-500/20 px-3 py-1.5 text-sm font-semibold text-fuchsia-100"
            >
              {walkthroughStep === WALKTHROUGH_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
            <button
              type="button"
              onClick={() => closeWalkthrough(true)}
              className="rounded-md border border-fuchsia-300/30 px-3 py-1.5 text-sm text-fuchsia-100/90"
            >
              Skip tour
            </button>
          </div>
        </div>
      )}

      <div className={`theme-panel p-5 sm:p-6 border ${highlightedSection === "beginner" ? "border-fuchsia-400" : "border-cyan-400/20"}`}>
        <div className="flex items-start gap-3">
          <BadgeInfo className="w-5 h-5 text-cyan-300 mt-0.5" />
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-cyan-200">Start here: choose your market first</h2>
            <p className="mt-1 text-sm text-cyan-100/80">
              To reduce confusion, all bots below are grouped by market. Pick <span className="font-semibold">Crypto</span> or <span className="font-semibold">Stocks</span> to see only tools and bots relevant to that market.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-500/20 bg-black/30 p-3">
          <div>
            <p className="text-sm font-semibold text-cyan-100">New to trading mode</p>
            <p className="text-xs text-cyan-100/70">Simplifies cards and surfaces glossary hints for key metrics.</p>
          </div>
          <button
            type="button"
            onClick={() => setNewToTradingMode((prev) => !prev)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              newToTradingMode
                ? "bg-cyan-500/25 text-cyan-100 border border-cyan-400/40"
                : "bg-slate-800/60 text-slate-200 border border-slate-600/50"
            }`}
          >
            {newToTradingMode ? "Beginner View: ON" : "Beginner View: OFF"}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${highlightedSection === "market" ? "rounded-xl ring-2 ring-fuchsia-400/60 p-1" : ""}`}>
        <button
          type="button"
          onClick={() => {
            setActiveCategory("crypto");
            setSelectedBot(null);
          }}
          className={`theme-panel p-5 text-left transition ${
            activeCategory === "crypto" ? "border-2 border-emerald-400" : "border border-emerald-500/20"
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <Coins className="w-5 h-5" /> Crypto Trading
          </div>
          <p className="mt-2 text-sm text-emerald-100/80">Pairs like SOL/USDC, BTC, ETH. PnL shown in SOL in this dashboard.</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCategory("stocks");
            setSelectedBot(null);
          }}
          className={`theme-panel p-5 text-left transition ${
            activeCategory === "stocks" ? "border-2 border-cyan-400" : "border border-cyan-500/20"
          }`}
        >
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <LineChart className="w-5 h-5" /> Stock Trading
          </div>
          <p className="mt-2 text-sm text-cyan-100/80">US equities workflows. PnL shown as percentage performance.</p>
        </button>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 ${highlightedSection === "actions" ? "rounded-xl ring-2 ring-fuchsia-400/60 p-2" : ""}`}>
        <h1 className="text-3xl font-bold text-emerald-300 flex items-center gap-2">
          <Bot className="w-8 h-8" />
          TradeHax Bots · {activeCategory === "crypto" ? "Crypto" : "Stocks"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openWalkthrough}
            className="rounded-md border border-cyan-400/40 px-3 py-2 text-sm text-cyan-100"
          >
            Explain this page
          </button>
          <button
            onClick={createQuickTrade}
            className="theme-cta theme-cta--secondary px-4 py-2"
          >
            + Create Trade
          </button>
          <button
            onClick={createNewBot}
            className="theme-cta theme-cta--loud px-4 py-2"
          >
            + Create {activeCategory === "crypto" ? "Crypto" : "Stock"} Bot
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {statusMessage}
        </div>
      )}

      {recentTrades.length > 0 && (
        <div className="theme-panel p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-cyan-100">Recent quick trades</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="rounded-md border border-cyan-500/20 bg-black/30 p-3 text-xs text-cyan-100/85">
                <div className="font-semibold text-cyan-100">{trade.symbol}</div>
                <div className="mt-1 uppercase tracking-wide text-cyan-200/70">{trade.market}</div>
                <div className="mt-1">Side: <span className="font-semibold">{trade.side.toUpperCase()}</span></div>
                <div>Size: <span className="font-semibold">{trade.size}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${newToTradingMode ? "md:grid-cols-1" : "md:grid-cols-2"} ${highlightedSection === "cards" ? "rounded-xl ring-2 ring-fuchsia-400/60 p-2" : ""}`}>
        {visibleBots.map((bot) => (
          <div
            key={bot.id}
            onClick={() => setSelectedBot(bot.id)}
            className={`theme-panel p-6 cursor-pointer transition ${
              selectedBot === bot.id
                ? "border-2 border-cyan-400"
                : "border border-emerald-500/20"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{bot.name}</h3>
                <p className="text-sm text-emerald-200/70 capitalize">
                  {bot.strategy}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-cyan-200/80">
                  {bot.market === "crypto" ? "Crypto" : "Stocks"}
                </p>
                {newToTradingMode && (
                  <p className="mt-2 text-xs text-cyan-100/70">
                    {bot.market === "crypto"
                      ? "This bot trades crypto markets. Profit uses SOL units in this dashboard."
                      : "This bot trades stock markets. Profit is shown as percentage return."}
                  </p>
                )}
              </div>
              <div
                className={`px-3 py-1 rounded text-xs font-bold ${
                  bot.status === "active"
                    ? "bg-emerald-600/40 text-emerald-300"
                    : "bg-gray-600/40 text-gray-300"
                }`}
              >
                {bot.status}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <div>
                  <MetricLabel label="Win Rate" tip={GLOSSARY.winRate} />
                  <div className="font-bold text-green-300">{bot.winRate}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="text-xs text-gray-400">Net Profit</div>
                  <div className="font-bold text-yellow-300">
                    {bot.market === "crypto" ? `${bot.netProfit} SOL` : `${bot.netProfit}%`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <div>
                  <MetricLabel label="Active Trades" tip={GLOSSARY.activeTrades} />
                  <div className="font-bold text-blue-300">{bot.activeTrades}</div>
                </div>
              </div>
              {!newToTradingMode && (
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <div>
                    <MetricLabel label="Max Drawdown" tip={GLOSSARY.drawdown} />
                    <div className="font-bold text-rose-300">{bot.maxDrawdown}%</div>
                  </div>
                </div>
              )}
            </div>

            {newToTradingMode && (
              <div className="mt-4 rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-100/80">
                <p>
                  Quick read: <span className="font-semibold">higher win rate</span> and <span className="font-semibold">lower drawdown</span> are generally safer for first-time users.
                </p>
              </div>
            )}
          </div>
        ))}

        {visibleBots.length === 0 && (
          <div className="theme-panel p-6 border border-dashed border-cyan-500/40 md:col-span-2">
            <p className="text-sm text-cyan-100/80">
              No bots in this category yet. Create your first {activeCategory === "crypto" ? "crypto" : "stock"} bot using the button above.
            </p>
          </div>
        )}
      </div>

      {selectedBot && selectedBotInfo && (
        <div className="theme-panel p-6">
          <h2 className="text-xl font-bold text-white mb-4">Bot Details</h2>
          <p className="text-sm text-cyan-100/75 mb-4">
            Viewing <span className="font-semibold text-cyan-200">{selectedBotInfo.market === "crypto" ? "Crypto" : "Stock"}</span> settings for <span className="font-semibold text-cyan-200">{selectedBotInfo.name}</span>.
          </p>
          <div className="space-y-4">
            <button className="theme-cta theme-cta--secondary w-full py-2">
              View Performance
            </button>
            <button className="theme-cta theme-cta--secondary w-full py-2">
              Configure Strategy
            </button>
            {!newToTradingMode && (
              <button className="theme-cta theme-cta--secondary w-full py-2">
                Risk & Drawdown Controls
              </button>
            )}
            <button className="theme-cta theme-cta--warning w-full py-2">
              Pause Bot
            </button>
          </div>
        </div>
      )}

      <Dialog open={isCreateTradeOpen} onOpenChange={setIsCreateTradeOpen}>
        <DialogContent className="bg-slate-950 border-cyan-500/30 text-slate-100">
          <DialogHeader>
            <DialogTitle>Create {activeCategory === "crypto" ? "Crypto" : "Stock"} Trade</DialogTitle>
            <DialogDescription className="text-slate-300/80">
              Quick entry form for first-time users. This records a local trade preview in the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-cyan-100/80">Symbol</label>
              <Input
                value={tradeSymbol}
                onChange={(event) => setTradeSymbol(event.target.value)}
                placeholder={activeCategory === "crypto" ? "SOL" : "AAPL"}
                className="bg-black/40 border-cyan-500/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="quick-trade-side" className="text-xs text-cyan-100/80">Side</label>
                <select
                  id="quick-trade-side"
                  title="Trade side"
                  value={tradeSide}
                  onChange={(event) => setTradeSide(event.target.value === "sell" ? "sell" : "buy")}
                  className="w-full rounded-md border border-cyan-500/30 bg-black/40 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-cyan-100/80">Size</label>
                <Input
                  value={tradeSize}
                  onChange={(event) => setTradeSize(event.target.value)}
                  placeholder="1"
                  inputMode="decimal"
                  className="bg-black/40 border-cyan-500/30"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsCreateTradeOpen(false)}
              className="rounded-md border border-slate-600/60 px-3 py-2 text-sm text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitQuickTrade}
              className="theme-cta theme-cta--loud px-4 py-2"
            >
              Save Trade
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
