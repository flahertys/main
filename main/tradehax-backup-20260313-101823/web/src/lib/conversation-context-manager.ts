/**
 * ConversationContextManager
 * Persistent multi-turn trading conversation with confidence-weighted memory
 * Learns from signal outcomes, decays low-confidence memories, prioritizes validated insights
 */

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: {
    signalId?: string;
    outcome?: "win" | "loss" | "pending";
    confidence?: number;
    factorWeights?: Record<string, number>;
  };
}

export interface SessionContext {
  userId: string;
  sessionId: string;
  createdAt: number;
  lastUpdated: number;
  conversationHistory: ConversationMessage[];
  userProfile: {
    riskTolerance: "conservative" | "moderate" | "aggressive";
    portfolioSize: number;
    preferredAssets: string[];
    signalPreferences: {
      minConfidence: number;
      maxVolatility: number;
      dataFreshnessTolerance: "realtime" | "1min" | "5min";
    };
  };
  performanceMetrics: {
    signalAccuracy: number; // 0-1
    avgProfit: number;
    winRate: number;
  };
}

export class ConversationContextManager {
  private sessionStore: Map<string, SessionContext> = new Map();

  /**
   * Retrieve session context with confidence-weighted memory recall
   */
  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    let context = this.sessionStore.get(sessionId);
    if (!context) {
      // Load from persistent store (DB, localStorage, etc.)
      context = await this.loadFromPersistentStore(sessionId);
    }

    if (!context) return null;

    // Apply confidence decay: older messages with low accuracy decay faster
    context.conversationHistory = this.applyConfidenceDecay(context.conversationHistory, context.performanceMetrics);

    return context;
  }

  /**
   * Save session context after each turn
   */
  async saveSessionContext(context: SessionContext): Promise<void> {
    context.lastUpdated = Date.now();
    this.sessionStore.set(context.sessionId, context);
    // Persist to DB
    await this.persistToStore(context);
  }

  /**
   * Add message to conversation and update confidence based on signal outcome
   */
  async addMessage(
    sessionId: string,
    message: ConversationMessage,
    signalOutcome?: { outcome: "win" | "loss"; profitLoss: number }
  ): Promise<void> {
    const context = await this.getSessionContext(sessionId);
    if (!context) return;

    // If this is a signal response, update performance metrics
    if (signalOutcome && message.metadata?.signalId) {
      const isWin = signalOutcome.outcome === "win";
      context.performanceMetrics.winRate = (context.performanceMetrics.winRate * 0.8 + (isWin ? 1 : 0) * 0.2);
      context.performanceMetrics.avgProfit = (context.performanceMetrics.avgProfit * 0.8 + signalOutcome.profitLoss * 0.2);
      context.performanceMetrics.signalAccuracy = Math.max(0, Math.min(1, context.performanceMetrics.signalAccuracy + (isWin ? 0.05 : -0.03)));
    }

    context.conversationHistory.push(message);
    await this.saveSessionContext(context);
  }

  /**
   * Build AI context window: most relevant messages + strongest signals
   * Prioritize recent, high-confidence, and validated recommendations
   */
  buildAIContextWindow(context: SessionContext, maxTokens: number = 2000): string {
    const scored = context.conversationHistory.map((msg) => {
      let score = 0;

      // Recency: messages from last 30 min score high
      const ageMin = (Date.now() - msg.timestamp) / (1000 * 60);
      score += Math.max(0, 1 - ageMin / 30);

      // Confidence: high-confidence signals + validated outcomes score higher
      if (msg.metadata?.confidence) score += msg.metadata.confidence * 0.5;
      if (msg.metadata?.outcome === "win") score += 0.3;
      if (msg.metadata?.outcome === "loss") score -= 0.2;

      // Trading-specific: signals and explanations score higher
      if (msg.content.toLowerCase().includes("signal") || msg.content.toLowerCase().includes("recommend"))
        score += 0.2;

      return { msg, score };
    });

    // Sort by score (highest first) and pack into context window
    let tokens = 0;
    let contextStr = `USER PROFILE:\nRisk: ${context.userProfile.riskTolerance}\nPortfolio: $${context.userProfile.portfolioSize}\nAccuracy: ${(context.performanceMetrics.signalAccuracy * 100).toFixed(1)}%\n\n`;
    tokens += 150;

    for (const { msg } of scored.sort((a, b) => b.score - a.score)) {
      const msgLen = msg.content.length / 4; // Rough token estimate
      if (tokens + msgLen > maxTokens) break;

      const prefix = msg.role === "assistant" ? "AI: " : "YOU: ";
      contextStr += `${prefix}${msg.content}\n`;
      tokens += msgLen;
    }

    return contextStr;
  }

  /**
   * Apply confidence decay: recent high-accuracy messages persist; old uncertain messages fade
   */
  private applyConfidenceDecay(
    messages: ConversationMessage[],
    metrics: { signalAccuracy: number; winRate: number }
  ): ConversationMessage[] {
    const now = Date.now();
    const accuracyBoost = Math.max(0.5, metrics.signalAccuracy); // Min 50% boost for good traders

    return messages.map((msg) => {
      const ageHours = (now - msg.timestamp) / (1000 * 60 * 60);

      // Decay factor: messages older than 24h fade; high-accuracy traders' messages decay slower
      let decayFactor = Math.exp(-ageHours / (24 * accuracyBoost));

      // Boost validated signals
      if (msg.metadata?.outcome === "win") decayFactor = Math.min(1, decayFactor + 0.2);
      if (msg.metadata?.outcome === "loss") decayFactor = Math.max(0.3, decayFactor - 0.1);

      return {
        ...msg,
        metadata: {
          ...msg.metadata,
          confidence: (msg.metadata?.confidence || 0.5) * decayFactor,
        },
      };
    });
  }

  private async loadFromPersistentStore(sessionId: string): Promise<SessionContext | null> {
    // TODO: Implement DB load (Supabase, Firebase, etc.)
    return null;
  }

  private async persistToStore(context: SessionContext): Promise<void> {
    // TODO: Implement DB save
  }
}

