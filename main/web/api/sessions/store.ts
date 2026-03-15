/**
 * TradeHax Session Store
 * In-memory session storage with optional persistence hooks
 * Tracks conversation history, user profile, and signal outcomes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    signalId?: string;
    confidence?: number;
    assetSymbol?: string;
    outcome?: 'pending' | 'win' | 'loss';
  };
}

export interface UserProfile {
  userId?: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingStyle: 'scalp' | 'swing' | 'position';
  portfolioValue: number;
  preferredAssets: string[];
  signalAccuracy?: {
    overall: number;
    byAsset: Record<string, number>;
    winRate?: number;
    avgProfit?: number;
  };
}

export interface Session {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastUpdated: number;
  messages: SessionMessage[];
  userProfile: UserProfile;
  metadata?: {
    device?: string;
    source?: string;
    tags?: string[];
  };
}

/**
 * In-memory session store (30-day TTL)
 */
const sessions = new Map<string, Session>();
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId?: string): Session {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const session: Session = {
    sessionId,
    userId,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    messages: [],
    userProfile: {
      riskTolerance: 'moderate',
      tradingStyle: 'swing',
      portfolioValue: 25000,
      preferredAssets: ['BTC', 'ETH'],
      signalAccuracy: {
        overall: 0.5,
        byAsset: {},
        winRate: 0,
        avgProfit: 0,
      },
    },
  };

  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);

  if (!session) return null;

  // Check TTL
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function updateSession(sessionId: string, updates: Partial<Session>): Session | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const updated: Session = {
    ...session,
    ...updates,
    lastUpdated: Date.now(),
  };

  sessions.set(sessionId, updated);
  return updated;
}

export function addMessage(sessionId: string, message: Omit<SessionMessage, 'id'>): SessionMessage | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const newMessage: SessionMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };

  session.messages.push(newMessage);
  session.lastUpdated = Date.now();

  return newMessage;
}

export function getRecentMessages(sessionId: string, count = 8): SessionMessage[] {
  const session = getSession(sessionId);
  if (!session) return [];

  return session.messages.slice(-count);
}

export function updateProfile(sessionId: string, profile: Partial<UserProfile>): UserProfile | null {
  const session = getSession(sessionId);
  if (!session) return null;

  session.userProfile = {
    ...session.userProfile,
    ...profile,
  };

  session.lastUpdated = Date.now();
  return session.userProfile;
}

export function recordSignalOutcome(
  sessionId: string,
  messageId: string,
  outcome: 'win' | 'loss',
  profitLoss: number,
  assetSymbol: string
): boolean {
  const session = getSession(sessionId);
  if (!session) return false;

  const message = session.messages.find((m) => m.id === messageId);
  if (!message) return false;

  // Update message metadata
  message.metadata = {
    ...message.metadata,
    outcome,
  };

  // Update profile accuracy metrics
  const profile = session.userProfile;
  const isWin = outcome === 'win';
  const old = profile.signalAccuracy || { overall: 0.5, byAsset: {}, winRate: 0, avgProfit: 0 };

  profile.signalAccuracy = {
    overall: Math.min(1, Math.max(0, old.overall + (isWin ? 0.02 : -0.01))),
    byAsset: {
      ...old.byAsset,
      [assetSymbol]: Math.min(1, Math.max(0, (old.byAsset[assetSymbol] || 0.5) + (isWin ? 0.03 : -0.02))),
    },
    winRate: Math.min(1, Math.max(0, old.winRate || 0 + (isWin ? 0.1 : -0.05))),
    avgProfit: (old.avgProfit || 0) * 0.9 + profitLoss * 0.1,
  };

  session.lastUpdated = Date.now();
  return true;
}

export function getSessions(): Session[] {
  const now = Date.now();
  const validSessions: Session[] = [];

  sessions.forEach((session, sessionId) => {
    if (now - session.createdAt <= SESSION_TTL) {
      validSessions.push(session);
    } else {
      sessions.delete(sessionId);
    }
  });

  return validSessions;
}

export function clearExpiredSessions(): number {
  const now = Date.now();
  let cleared = 0;

  sessions.forEach((session, sessionId) => {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(sessionId);
      cleared++;
    }
  });

  return cleared;
}

/**
 * Session management handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Create new session
      const { userId } = req.body;
      const session = createSession(userId);
      return res.status(201).json(session);
    }

    if (req.method === 'GET') {
      const { sessionId } = req.query;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId required' });
      }

      const session = getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      return res.status(200).json(session);
    }

    if (req.method === 'PUT') {
      const { sessionId } = req.query;
      const updates = req.body;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId required' });
      }

      const updated = updateSession(sessionId, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Session not found' });
      }

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Session handler error:', error);
    return res.status(500).json({
      error: 'Session management error',
      message: error.message,
    });
  }
}

