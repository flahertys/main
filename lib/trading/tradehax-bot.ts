/**
 * TradeHax Trading Bot Core
 * Chain-agnostic automated trading with AI signals
 */

import {
  ChainTradingAdapter,
  ensureDefaultChainAdapter,
  getChainAdapter,
  resolveDefaultAdapterId,
} from "@/lib/trading/chain-adapter";

import { SIGNAL_THRESHOLDS } from "../../main/web/src/lib/signal-parameters";

export interface TradeSignal {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number; // 0-1
  price: number;
  targetPrice: number;
  stopLoss: number;
  timestamp: number;
}

export interface TradeBot {
  id: string;
  name: string;
  enabled: boolean;
  strategy: "scalping" | "swing" | "long-term" | "arbitrage";
  riskLevel: "low" | "medium" | "high";
  allocatedCapital: number; // base capital units
  executedTrades: number;
  profitLoss: number;
  winRate: number;
  createdAt: number;
  updatedAt: number;
}

export interface BotConfig {
  adapter?: ChainTradingAdapter;
  adapterId?: string;
  slippageTolerance: number; // 0.5-5%
  gasLimit?: number; // provider-specific execution budget
  maxTradeSize: number; // capital units
  cooldownPeriod: number; // ms between trades
}

class TradehaxBot {
  private config: BotConfig;
  private adapter: ChainTradingAdapter;
  private signals: Map<string, TradeSignal> = new Map();
  private activeTrades: Map<string, TradeSignal> = new Map();
  private lastExecutionAtBySymbol: Map<string, number> = new Map();
  private stats: {
    totalTrades: number;
    successfulTrades: number;
    totalProfit: number;
    totalLoss: number;
  } = {
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
  };

  constructor(config: BotConfig) {
    this.config = config;
    ensureDefaultChainAdapter();

    if (config.adapter) {
      this.adapter = config.adapter;
      return;
    }

    const resolvedAdapterId = config.adapterId || resolveDefaultAdapterId();
    const resolvedAdapter = getChainAdapter(resolvedAdapterId) || getChainAdapter("paper-default");
    if (!resolvedAdapter) {
      throw new Error("No trading adapter available. Register a chain adapter first.");
    }
    this.adapter = resolvedAdapter;
  }

  /**
   * Process AI trading signal
   */
  async processSignal(signal: TradeSignal): Promise<void> {
    console.log(`[TradeHax] Processing signal:`, signal);

    this.signals.set(signal.symbol, signal);

    // Check if already have active trade for this pair
    if (this.activeTrades.has(signal.symbol)) {
      console.log(`[TradeHax] Already trading ${signal.symbol}`);
      return;
    }

    const lastExecAt = this.lastExecutionAtBySymbol.get(signal.symbol) || 0;
    if (Date.now() - lastExecAt < SIGNAL_THRESHOLDS.cooldownPeriodMs) {
      console.log(`[TradeHax] Cooldown active for ${signal.symbol}`);
      return;
    }

    // Validate signal confidence
    if (signal.confidence < SIGNAL_THRESHOLDS.minSignalConfidence) {
      console.log(`[TradeHax] Signal confidence too low (${signal.confidence})`);
      return;
    }

    // Execute trade based on signal
    if (signal.action === "buy") {
      await this.executeBuy(signal);
    } else if (signal.action === "sell") {
      await this.executeSell(signal);
    }
  }

  /**
   * Execute buy trade
   */
  private async executeBuy(signal: TradeSignal): Promise<void> {
    try {
      console.log(`[TradeHax] Executing BUY for ${signal.symbol}`);

      const tradeAmount = Math.max(
        0,
        Math.min(this.config.maxTradeSize, this.config.maxTradeSize * signal.confidence),
      );
      if (!Number.isFinite(tradeAmount) || tradeAmount <= 0) {
        console.log(`[TradeHax] Invalid trade amount for ${signal.symbol}`);
        return;
      }

      await this.adapter.executeOrder({
        symbol: signal.symbol,
        side: "buy",
        amount: tradeAmount,
        limitPrice: signal.price,
        stopLoss: signal.stopLoss,
        takeProfit: signal.targetPrice,
        meta: {
          confidence: signal.confidence,
          strategy: "signal_buy",
        },
      });

      this.activeTrades.set(signal.symbol, signal);
      this.lastExecutionAtBySymbol.set(signal.symbol, Date.now());
      this.stats.totalTrades++;

      // Set stop loss alert
      this.setStopLossAlert(signal);

      console.log(`[TradeHax] BUY executed: ${signal.symbol} @ ${signal.price}`);
    } catch (error) {
      console.error(`[TradeHax] Buy execution failed:`, error);
    }
  }

  /**
   * Execute sell trade
   */
  private async executeSell(signal: TradeSignal): Promise<void> {
    try {
      console.log(`[TradeHax] Executing SELL for ${signal.symbol}`);

      const activeTrade = this.activeTrades.get(signal.symbol);
      const tradeAmount = Math.max(
        0,
        Math.min(this.config.maxTradeSize, this.config.maxTradeSize * signal.confidence),
      );

      await this.adapter.executeOrder({
        symbol: signal.symbol,
        side: "sell",
        amount: tradeAmount,
        limitPrice: signal.price,
        stopLoss: signal.stopLoss,
        takeProfit: signal.targetPrice,
        meta: {
          strategy: "signal_sell",
          hadActiveTrade: Boolean(activeTrade),
        },
      });

      this.activeTrades.delete(signal.symbol);
      this.lastExecutionAtBySymbol.set(signal.symbol, Date.now());

      // Calculate P&L
      const previousSignal = this.signals.get(signal.symbol);
      if (previousSignal) {
        const pnl = (signal.price - previousSignal.price) * 100; // simplified
        if (pnl > 0) {
          this.stats.successfulTrades++;
          this.stats.totalProfit += pnl;
        } else {
          this.stats.totalLoss += Math.abs(pnl);
        }
      }

      console.log(`[TradeHax] SELL executed: ${signal.symbol} @ ${signal.price}`);
    } catch (error) {
      console.error(`[TradeHax] Sell execution failed:`, error);
    }
  }

  /**
   * Set stop loss alert
   */
  private setStopLossAlert(signal: TradeSignal): void {
    // Monitor price and execute stop loss if price drops below threshold
    const checkInterval = setInterval(() => {
      void this.adapter
        .getSpotPrice(signal.symbol)
        .then((price) => {
          if (!this.activeTrades.has(signal.symbol)) {
            clearInterval(checkInterval);
            return;
          }

          if (Number.isFinite(price) && price <= signal.stopLoss) {
            void this.processSignal({
              ...signal,
              action: "sell",
              price,
              timestamp: Date.now(),
            });
            clearInterval(checkInterval);
          }
        })
        .catch(() => {
          if (!this.activeTrades.has(signal.symbol)) {
            clearInterval(checkInterval);
          }
        });
    }, 5000); // Check every 5 seconds
  }

  /**
   * Get bot statistics
   */
  getStats() {
    const winRate =
      this.stats.totalTrades > 0
        ? (this.stats.successfulTrades / this.stats.totalTrades) * 100
        : 0;

    return {
      totalTrades: this.stats.totalTrades,
      successfulTrades: this.stats.successfulTrades,
      winRate: winRate.toFixed(2),
      totalProfit: this.stats.totalProfit.toFixed(2),
      totalLoss: this.stats.totalLoss.toFixed(2),
      netProfit: (this.stats.totalProfit - this.stats.totalLoss).toFixed(2),
    };
  }

  /**
   * Get active trades
   */
  getActiveTrades(): TradeSignal[] {
    return Array.from(this.activeTrades.values());
  }

  /**
   * Stop bot
   */
  stop(): void {
    console.log("[TradeHax] Stopping bot");
    this.activeTrades.clear();
  }
}

export { TradehaxBot };
