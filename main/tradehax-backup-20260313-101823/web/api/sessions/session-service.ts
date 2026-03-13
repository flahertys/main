import {
  addMessage,
  createSession,
  getRecentMessages,
  getSession,
  recordSignalOutcome,
  updateSession,
} from "./store.js";

export function createUserSession(userId?: string) {
  return createSession(userId);
}

export function fetchSession(sessionId: string) {
  return getSession(sessionId);
}

export function appendSessionMessage(
  sessionId: string,
  payload: { role: "user" | "assistant"; content: string; metadata?: Record<string, any> }
) {
  return addMessage(sessionId, {
    role: payload.role,
    content: payload.content,
    timestamp: Date.now(),
    metadata: payload.metadata,
  });
}

export function fetchRecentSessionMessages(sessionId: string, count = 8) {
  return getRecentMessages(sessionId, count);
}

export function updateSessionProfile(sessionId: string, updates: Record<string, any>) {
  const session = getSession(sessionId);
  if (!session) return null;

  return updateSession(sessionId, {
    userProfile: {
      ...session.userProfile,
      ...updates,
    },
  });
}

export function saveSignalOutcome(
  sessionId: string,
  messageId: string,
  outcome: "win" | "loss",
  profitLoss: number,
  assetSymbol: string
) {
  return recordSignalOutcome(sessionId, messageId, outcome, profitLoss, assetSymbol);
}

