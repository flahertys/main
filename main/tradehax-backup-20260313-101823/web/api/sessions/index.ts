import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, ensureAllowedMethods, handleOptions } from '../_shared/http.js';
import {
  appendSessionMessage,
  createUserSession,
  fetchRecentSessionMessages,
  fetchSession,
  saveSignalOutcome,
  updateSessionProfile,
} from './session-service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res, { methods: 'GET,POST,PUT,OPTIONS' });

  if (handleOptions(req, res)) {
    return;
  }

  if (!ensureAllowedMethods(req, res, ['GET', 'POST', 'PUT'])) {
    return;
  }

  try {
    const { action, sessionId } = req.query;

    if (req.method === 'POST' && action === 'create') {
      const { userId } = req.body || {};
      const session = createUserSession(userId);
      return res.status(201).json(session);
    }

    if (req.method === 'GET' && sessionId && typeof sessionId === 'string') {
      const session = fetchSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.status(200).json(session);
    }

    if (req.method === 'POST' && sessionId && typeof sessionId === 'string' && action === 'message') {
      const session = fetchSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const { role, content, metadata } = req.body || {};
      if (!role || !content) {
        return res.status(400).json({ error: 'role and content required' });
      }

      const message = appendSessionMessage(sessionId, { role, content, metadata });
      return res.status(201).json(message);
    }

    if (req.method === 'GET' && sessionId && typeof sessionId === 'string' && action === 'messages') {
      const { count } = req.query;
      const messages = fetchRecentSessionMessages(sessionId, parseInt(String(count || '8'), 10));
      return res.status(200).json({ messages });
    }

    if (req.method === 'PUT' && sessionId && typeof sessionId === 'string' && action === 'outcome') {
      const { messageId, outcome, profitLoss, assetSymbol } = req.body || {};

      if (!messageId || !outcome || !assetSymbol) {
        return res.status(400).json({ error: 'messageId, outcome, assetSymbol required' });
      }

      const success = saveSignalOutcome(sessionId, messageId, outcome, profitLoss || 0, assetSymbol);
      if (!success) {
        return res.status(404).json({ error: 'Session or message not found' });
      }

      const session = fetchSession(sessionId);
      return res.status(200).json(session);
    }

    if (req.method === 'PUT' && sessionId && typeof sessionId === 'string' && action === 'profile') {
      const session = fetchSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const updates = req.body || {};
      const updated = updateSessionProfile(sessionId, updates);
      return res.status(200).json(updated);
    }

    return res.status(400).json({ error: 'Invalid action or missing parameters' });
  } catch (error: any) {
    console.error('Session API error:', error);
    return res.status(500).json({
      error: 'Session API error',
      message: error.message,
    });
  }
}
