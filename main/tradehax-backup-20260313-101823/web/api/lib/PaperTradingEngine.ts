/**
 * Paper Trading Engine
 * Simulated trading environment for backtesting and paper trading
 * Fully instrumented for Phase 2 transition to live trading
 */

import { EventEmitter } from 'events';

export interface PaperPortfolio {
  id: string;
  initialCapital: number;
  currentBalance: number;
  cash: number;
  positions: Map<string, PaperPosition>;
  trades: PaperTrade[];
  metrics: PortfolioMetrics;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
}

export interface PaperPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  percentageGain: number;
  openedAt: Date;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  commission: number;
  realizedPnL?: number;
  holdingPeriodDays?: number;
  enteredAt: Date;
  exitedAt?: Date;
  signalId?: string;
  reason?: string;
}

export interface PortfolioMetrics {
  totalReturn: number;
  annualizedReturn: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  var95: number;
  var99: number;
  var95Percent: number;
  var99Percent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingPeriod: number;
  commission: number;
  lastUpdated: Date;
}

/**
 * Paper Trading Engine
 */
export class PaperTradingEngine extends EventEmitter {
  private portfolios: Map<string, PaperPortfolio> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private dailyEquityCurve: Map<string, number[]> = new Map();

  constructor() {
    super();
  }

  /**
   * Create a new paper trading portfolio
   */
  createPortfolio(id: string, initialCapital: number, startDate: Date): PaperPortfolio {
    const portfolio: PaperPortfolio = {
      id,
      initialCapital,
      currentBalance: initialCapital,
      cash: initialCapital,
      positions: new Map(),
      trades: [],
      metrics: this.getDefaultMetrics(),
      createdAt: new Date(),
      startDate,
    };

    this.portfolios.set(id, portfolio);
    this.dailyEquityCurve.set(id, [initialCapital]);

    this.emit('portfolio-created', { portfolioId: id, initialCapital });
    return portfolio;
  }

  /**
   * Get portfolio
   */
  getPortfolio(portfolioId: string): PaperPortfolio | undefined {
    return this.portfolios.get(portfolioId);
  }

  /**
   * Execute a simulated trade
   */
  async executeTrade(
    portfolioId: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    signalId?: string,
    reason?: string
  ): Promise<PaperTrade | null> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    const commission = this.calculateCommission(quantity * price);
    const totalCost = quantity * price + commission;

    // Validate sufficient cash for buys
    if (side === 'BUY' && portfolio.cash < totalCost) {
      this.emit('trade-rejected', {
        portfolioId,
        symbol,
        reason: 'Insufficient cash',
        required: totalCost,
        available: portfolio.cash,
      });
      return null;
    }

    const tradeId = `PT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trade: PaperTrade = {
      id: tradeId,
      symbol,
      side,
      quantity,
      entryPrice: price,
      commission,
      enteredAt: new Date(),
      signalId,
      reason,
    };

    if (side === 'BUY') {
      // Open or increase position
      const existingPosition = portfolio.positions.get(symbol);
      if (existingPosition) {
        const totalQuantity = existingPosition.quantity + quantity;
        const totalCost = existingPosition.quantity * existingPosition.avgPrice + quantity * price;
        existingPosition.avgPrice = totalCost / totalQuantity;
        existingPosition.quantity = totalQuantity;
      } else {
        portfolio.positions.set(symbol, {
          symbol,
          quantity,
          avgPrice: price,
          currentPrice: price,
          unrealizedPnL: 0,
          percentageGain: 0,
          openedAt: new Date(),
        });
      }
      portfolio.cash -= totalCost;
    } else {
      // Sell (reduce or close position)
      const position = portfolio.positions.get(symbol);
      if (!position || position.quantity < quantity) {
        this.emit('trade-rejected', {
          portfolioId,
          symbol,
          reason: 'Insufficient position',
          required: quantity,
          available: position?.quantity || 0,
        });
        return null;
      }

      const realizedPnL = quantity * (price - position.avgPrice) - commission;
      trade.realizedPnL = realizedPnL;
      trade.exitPrice = price;
      trade.exitedAt = new Date();
      trade.holdingPeriodDays = Math.floor(
        (trade.exitedAt.getTime() - position.openedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      position.quantity -= quantity;
      if (position.quantity === 0) {
        portfolio.positions.delete(symbol);
      }

      portfolio.cash += quantity * price - commission;
    }

    portfolio.trades.push(trade);
    this.updatePortfolioMetrics(portfolio);

    this.emit('trade-executed', {
      portfolioId,
      trade,
      balance: portfolio.currentBalance,
    });

    return trade;
  }

  /**
   * Update market price (simulates price movement)
   */
  updatePrice(symbol: string, price: number): void {
    // Record price history
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    this.priceHistory.get(symbol)!.push(price);

    // Update unrealized PnL in all portfolios
    for (const portfolio of this.portfolios.values()) {
      const position = portfolio.positions.get(symbol);
      if (position) {
        position.currentPrice = price;
        position.unrealizedPnL = position.quantity * (price - position.avgPrice);
        position.percentageGain = ((price - position.avgPrice) / position.avgPrice) * 100;
      }
    }

    this.emit('price-updated', { symbol, price });
  }

  /**
   * Close position at current price
   */
  async closePosition(
    portfolioId: string,
    symbol: string,
    currentPrice: number
  ): Promise<PaperTrade | null> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return null;

    const position = portfolio.positions.get(symbol);
    if (!position || position.quantity === 0) return null;

    return this.executeTrade(portfolioId, symbol, 'SELL', position.quantity, currentPrice);
  }

  /**
   * Get portfolio performance report
   */
  getPerformanceReport(
    portfolioId: string
  ): {
    portfolio: PaperPortfolio;
    report: string;
  } {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }

    const report = `
=== Paper Trading Performance Report ===
Portfolio ID: ${portfolio.id}
Period: ${portfolio.startDate.toISOString()} to ${new Date().toISOString()}

Capital:
  Initial Capital: $${portfolio.initialCapital.toFixed(2)}
  Current Balance: $${portfolio.currentBalance.toFixed(2)}
  Cash Available: $${portfolio.cash.toFixed(2)}

Returns:
  Total Return: ${portfolio.metrics.totalReturn.toFixed(2)}%
  Annualized Return: ${portfolio.metrics.annualizedReturn.toFixed(2)}%

Risk Metrics:
  Max Drawdown: ${portfolio.metrics.maxDrawdown.toFixed(2)}%
  VAR 95%: $${portfolio.metrics.var95.toFixed(2)}
  VAR 99%: $${portfolio.metrics.var99.toFixed(2)}
  Sharpe Ratio: ${portfolio.metrics.sharpeRatio.toFixed(2)}

Trade Statistics:
  Total Trades: ${portfolio.metrics.totalTrades}
  Winning Trades: ${portfolio.metrics.winningTrades} (${portfolio.metrics.winRate.toFixed(2)}%)
  Losing Trades: ${portfolio.metrics.losingTrades}
  Profit Factor: ${portfolio.metrics.profitFactor.toFixed(2)}

  Best Trade: $${portfolio.metrics.bestTrade.toFixed(2)}
  Worst Trade: $${portfolio.metrics.worstTrade.toFixed(2)}
  Average Win: $${portfolio.metrics.averageWin.toFixed(2)}
  Average Loss: $${portfolio.metrics.averageLoss.toFixed(2)}
  Average Holding Period: ${portfolio.metrics.avgHoldingPeriod.toFixed(1)} days

Costs:
  Total Commission: $${portfolio.metrics.commission.toFixed(2)}
    `;

    return { portfolio, report };
  }

  /**
   * Update portfolio metrics
   */
  private updatePortfolioMetrics(portfolio: PaperPortfolio): void {
    const trades = portfolio.trades.filter((t) => t.exitedAt);
    const winningTrades = trades.filter((t) => (t.realizedPnL || 0) > 0);
    const losingTrades = trades.filter((t) => (t.realizedPnL || 0) < 0);

    // Calculate balance
    let totalRealizedPnL = 0;
    let totalCommission = 0;

    trades.forEach((trade) => {
      totalRealizedPnL += trade.realizedPnL || 0;
      totalCommission += trade.commission;
    });

    // Calculate unrealized PnL
    let totalUnrealizedPnL = 0;
    portfolio.positions.forEach((position) => {
      totalUnrealizedPnL += position.unrealizedPnL;
    });

    portfolio.currentBalance = portfolio.initialCapital + totalRealizedPnL + totalUnrealizedPnL;
    portfolio.metrics.commission = totalCommission;

    // Return metrics
    const totalReturn = (portfolio.currentBalance - portfolio.initialCapital) / portfolio.initialCapital * 100;
    const dayCount = (new Date().getTime() - portfolio.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const yearCount = dayCount / 365;

    portfolio.metrics.totalReturn = totalReturn;
    portfolio.metrics.annualizedReturn = totalReturn / yearCount;
    portfolio.metrics.totalTrades = trades.length;
    portfolio.metrics.winningTrades = winningTrades.length;
    portfolio.metrics.losingTrades = losingTrades.length;
    portfolio.metrics.winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    // Profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0));
    portfolio.metrics.profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Average win/loss
    portfolio.metrics.averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    portfolio.metrics.averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    // Best/worst trade
    portfolio.metrics.bestTrade =
      trades.length > 0 ? Math.max(...trades.map((t) => t.realizedPnL || 0)) : 0;
    portfolio.metrics.worstTrade =
      trades.length > 0 ? Math.min(...trades.map((t) => t.realizedPnL || 0)) : 0;

    // Average holding period
    const completedTrades = trades.filter((t) => t.holdingPeriodDays);
    portfolio.metrics.avgHoldingPeriod =
      completedTrades.length > 0
        ? completedTrades.reduce((sum, t) => sum + (t.holdingPeriodDays || 0), 0) / completedTrades.length
        : 0;

    // Sharpe ratio (simplified - use daily returns)
    portfolio.metrics.sharpeRatio = this.calculateSharpeRatio(portfolio);

    // VAR (Value at Risk)
    const { var95, var99, var95Percent, var99Percent } = this.calculateVAR(portfolio);
    portfolio.metrics.var95 = var95;
    portfolio.metrics.var99 = var99;
    portfolio.metrics.var95Percent = var95Percent;
    portfolio.metrics.var99Percent = var99Percent;

    // Max drawdown
    const { maxDrawdown, maxDrawdownPercent } = this.calculateMaxDrawdown(portfolio);
    portfolio.metrics.maxDrawdown = maxDrawdown;
    portfolio.metrics.maxDrawdownPercent = maxDrawdownPercent;

    portfolio.metrics.lastUpdated = new Date();
  }

  /**
   * Calculate Sharpe Ratio
   */
  private calculateSharpeRatio(portfolio: PaperPortfolio): number {
    // Simplified: annualized return / volatility
    const returns = portfolio.metrics.annualizedReturn / 100;
    const volatility = 0.15; // Assumed 15% volatility (can be calculated from historical returns)
    const riskFreeRate = 0.02; // Assumed 2% risk-free rate

    return volatility > 0 ? (returns - riskFreeRate) / volatility : 0;
  }

  /**
   * Calculate Value at Risk (95% and 99% confidence levels)
   */
  private calculateVAR(
    portfolio: PaperPortfolio
  ): { var95: number; var99: number; var95Percent: number; var99Percent: number } {
    let totalValue = portfolio.cash;
    portfolio.positions.forEach((pos) => {
      totalValue += pos.quantity * pos.currentPrice;
    });

    // Simplified VAR calculation (needs more sophisticated approach in production)
    const volatility = 0.15;
    const var95 = totalValue * (1.645 * volatility);
    const var99 = totalValue * (2.326 * volatility);

    return {
      var95,
      var99,
      var95Percent: (var95 / totalValue) * 100,
      var99Percent: (var99 / totalValue) * 100,
    };
  }

  /**
   * Calculate max drawdown
   */
  private calculateMaxDrawdown(
    portfolio: PaperPortfolio
  ): { maxDrawdown: number; maxDrawdownPercent: number } {
    const equityCurve = this.dailyEquityCurve.get(portfolio.id) || [portfolio.initialCapital];
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = portfolio.initialCapital;

    for (const value of equityCurve) {
      if (value > peak) peak = value;
      const drawdown = peak - value;
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    return { maxDrawdown, maxDrawdownPercent };
  }

  /**
   * Calculate commission
   */
  private calculateCommission(notional: number): number {
    return notional * 0.0001; // 0.01% commission
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): PortfolioMetrics {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      var95: 0,
      var99: 0,
      var95Percent: 0,
      var99Percent: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      averageWin: 0,
      averageLoss: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgHoldingPeriod: 0,
      commission: 0,
      lastUpdated: new Date(),
    };
  }
}

export default PaperTradingEngine;

