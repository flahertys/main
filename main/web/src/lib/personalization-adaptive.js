// Personalization & Adaptive Learning Engine
// User-specific model fine-tuning and adaptive recommendations

const fs = require('fs');
const advancedSignalEngine = require('./advanced-signal-engine');
const { logAIFeedback, logAIInteraction, logSiteEvent } = require('./supabaseClient');

module.exports = {
  async personalizeSignal({ userId, signal, modelOrSignal }) {
    // 1. Generate signal if not provided, ensure backtested
    let fullSignal = signal;
    if (!signal || !signal.explanation) {
      fullSignal = await advancedSignalEngine.generateSignal({ symbol: signal?.symbol || 'UNKNOWN', userId, modelOrSignal });
    }
    // 2. Adjust signal based on user profile/feedback (stub)
    // 3. Log adaptation to Supabase
    await logAIInteraction({
      user_id: userId,
      session_id: modelOrSignal || null,
      input: '',
      output: JSON.stringify(fullSignal),
      model: modelOrSignal || '',
      confidence: fullSignal?.confidence || null,
      timestamp: new Date().toISOString(),
      context: { type: 'personalization' }
    });
    await logSiteEvent({
      user_id: userId,
      event_type: 'personalization',
      event_data: { signal: fullSignal, modelOrSignal },
      timestamp: new Date().toISOString()
    });
    return {
      ...fullSignal,
      personalized: true,
      userId
    };
  },

  async updateUserProfile({ userId, feedback }) {
    // 1. Update user profile with feedback (stub)
    await logAIFeedback({
      user_id: userId,
      session_id: null,
      feedback_text: feedback,
      rating: null,
      created_at: new Date().toISOString()
    });
    await logSiteEvent({
      user_id: userId,
      event_type: 'profile_feedback',
      event_data: { feedback },
      timestamp: new Date().toISOString()
    });
    return {
      userId,
      feedback,
      updated: true
    };
  }
};
