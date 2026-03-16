// Alert & Timeline Engine
// Real-time alerting, user-customizable triggers, and signal history

const advancedSignalEngine = require('./advanced-signal-engine');
const { logSiteEvent, logAIInteraction, getAIInteractions } = require('./supabaseClient');

module.exports = {
  async sendAlert({ userId, signal, modelOrSignal }) {
    // 1. Generate signal with backtest/explainability if not provided
    let fullSignal = signal;
    if (!signal || !signal.explanation) {
      fullSignal = await advancedSignalEngine.generateSignal({ symbol: signal?.symbol || 'UNKNOWN', userId, modelOrSignal });
    }
    // 2. Push alert to user (web, Discord, Telegram, etc.) (stub)
    // 3. Log to Supabase (site_events and ai_interactions)
    await logSiteEvent({
      user_id: userId,
      event_type: 'alert_sent',
      event_data: { signal: fullSignal, modelOrSignal },
      timestamp: new Date().toISOString()
    });
    await logAIInteraction({
      user_id: userId,
      session_id: modelOrSignal || null,
      input: '',
      output: JSON.stringify(fullSignal),
      model: modelOrSignal || '',
      confidence: fullSignal?.confidence || null,
      timestamp: new Date().toISOString(),
      context: { type: 'alert' }
    });
    // 4. Trigger feedback/acknowledgement (stub)
    return {
      status: 'sent',
      userId,
      signal: fullSignal,
      timestamp: Date.now()
    };
  },

  async getTimeline({ userId }) {
    // 1. Fetch user signal/alert history from Supabase
    const { data, error } = await getAIInteractions(userId);
    if (error) return [];
    return (data || []).map(entry => {
      try {
        return JSON.parse(entry.output);
      } catch {
        return entry.output;
      }
    });
  }
};
