// Unified trading signal generation and neural bot interface

// Delegate to improved neural hub pipeline
import { generateTradingSignal as pipelineGenerateTradingSignal } from '../lib/trading/neural-hub-pipeline';

export async function generateTradingSignal(symbol: string, marketType: 'stock' | 'crypto' | 'prediction' = 'stock', settings?: any): Promise<any> {
  // Directly delegate to the robust pipeline implementation
  return pipelineGenerateTradingSignal(symbol, marketType, settings);
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

