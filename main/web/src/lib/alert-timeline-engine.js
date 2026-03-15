// Alert & Timeline Engine
// Real-time alerting, user-customizable triggers, and signal history

const fs = require('fs');
const advancedSignalEngine = require('./advanced-signal-engine');

module.exports = {
  async sendAlert({ userId, signal, modelOrSignal }) {
    // 1. Generate signal with backtest/explainability if not provided
    let fullSignal = signal;
    if (!signal || !signal.explanation) {
      fullSignal = await advancedSignalEngine.generateSignal({ symbol: signal?.symbol || 'UNKNOWN', userId, modelOrSignal });
    }
    // 2. Push alert to user (web, Discord, Telegram, etc.) (stub)
    // 3. Log to timeline/history (file-based for audit)
    const logEntry = {
      userId,
      signal: fullSignal,
      timestamp: Date.now()
    };
    fs.appendFileSync('alert-timeline.log', JSON.stringify(logEntry) + '\n');
    // 4. Trigger feedback/acknowledgement (stub)
    return {
      status: 'sent',
      userId,
      signal: fullSignal,
      timestamp: Date.now()
    };
  },

  async getTimeline({ userId }) {
    // 1. Fetch user signal/alert history (file-based for audit)
    try {
      const lines = fs.readFileSync('alert-timeline.log', 'utf-8').split('\n').filter(Boolean);
      return lines
        .map(line => JSON.parse(line))
        .filter(entry => entry.userId === userId)
        .map(entry => entry.signal);
    } catch (e) {
      return [];
    }
  }
};
