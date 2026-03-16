// Unified trading signal generation and neural bot interface
import { fetchStockData, fetchPolymarketData, fetchCryptoData } from './dataService';
import { callNeuralHub } from './llmService';

export async function generateTradingSignal(symbol: string, marketType: 'stock' | 'crypto' | 'prediction' = 'stock'): Promise<any> {
  console.log(`📊 Generating signal for ${symbol} (${marketType})...`);
  try {
    let liveData: any = null;
    if (marketType === 'stock') {
      liveData = await fetchStockData(symbol);
    } else if (marketType === 'crypto') {
      liveData = await fetchCryptoData([symbol.toLowerCase()]);
    } else if (marketType === 'prediction') {
      liveData = await fetchPolymarketData(symbol);
    }
    if (!liveData) {
      console.warn(`⚠️ Could not fetch live data for ${symbol}`);
    }
    const prompt = `Given the following live market data for ${symbol} (${marketType}):\n${JSON.stringify(liveData, null, 2)}\n\nProvide a concise trading signal with:\n1. Direction (BUY / SELL / HOLD)\n2. Confidence (0-100)\n3. Target price\n4. Stop loss\n5. Risk/reward ratio\n\nFormat as JSON.`;
    const aiResponse = await callNeuralHub(prompt, undefined, 256);
    try {
      const signal = JSON.parse(aiResponse);
      return { symbol, marketType, timestamp: new Date().toISOString(), liveData, signal, status: 'success' };
    } catch {
      return { symbol, marketType, timestamp: new Date().toISOString(), liveData, rawResponse: aiResponse, status: 'partial' };
    }
  } catch (error) {
    console.error(`❌ Error generating signal for ${symbol}:`, error);
    return { symbol, error: error instanceof Error ? error.message : 'Unknown error', status: 'error' };
  }
}

export class TradeHaxNeuralBot {
  private moduleStates: Map<string, any> = new Map();
  private dataCache: Map<string, any> = new Map();
  private lastUpdate: Map<string, number> = new Map();

  constructor(modules: any[]) {
    this.initialize(modules);
  }

  private initialize(modules: any[]) {
    console.log('🤖 Initializing TradeHax Neural Bot with live data...');
    modules.forEach((mod) => {
      if (mod.enabled) {
        this.moduleStates.set(mod.id, { status: 'ready', lastRun: null, nextRun: Date.now() });
      }
    });
  }

  async runAnalysis(symbol: string, marketType: 'stock' | 'crypto' | 'prediction' = 'stock') {
    console.log(`\n🚀 Running analysis for ${symbol}...`);
    const signal = await generateTradingSignal(symbol, marketType);
    console.log('✅ Signal generated:', signal);
    return signal;
  }

  async updateAllModules(modules: any[]) {
    console.log('\n🔄 Updating all neural modules with live data...');
    for (const module of modules) {
      if (!module.enabled) continue;
      const lastRun = this.lastUpdate.get(module.id) || 0;
      const now = Date.now();
      if (now - lastRun < module.updateInterval) {
        continue;
      }
      console.log(`⏱️  Updating ${module.name}...`);
      this.lastUpdate.set(module.id, now);
    }
  }

  getStatus() {
    return {
      modules: Array.from(this.moduleStates.entries()),
      lastUpdates: Array.from(this.lastUpdate.entries()),
    };
  }
}

