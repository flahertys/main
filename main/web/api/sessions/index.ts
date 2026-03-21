import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface Session {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  userProfile?: Record<string, any>;
  metadata?: Record<string, any>;
}

// In-memory session store (replace with Redis/Supabase in production)
const sessionStore = new Map<string, Session>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create new session
 */
function createSession(userId?: string): Session {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: Session = {
    sessionId,
    userId,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: now + SESSION_TTL,
  };

  sessionStore.set(sessionId, session);
  return session;
}

/**
 * Get session
 */
function getSession(sessionId: string): Session | null {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt < Date.now()) {
    sessionStore.delete(sessionId);
    return null;
  }

  // Update last activity
  session.lastActivityAt = Date.now();
  return session;
}

/**
 * Update session profile
 */
function updateSessionProfile(sessionId: string, profile: Record<string, any>): boolean {
  const session = getSession(sessionId);

  if (!session) {
    return false;
  }

  session.userProfile = profile;
  session.lastActivityAt = Date.now();
  return true;
}

/**
 * Delete session
 */
function deleteSession(sessionId: string): boolean {
  return sessionStore.delete(sessionId);
}

/**
 * Cleanup expired sessions (run periodically)
 */
function cleanupExpiredSessions(): number {
  let cleaned = 0;
  const now = Date.now();

  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.expiresAt < now) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[SESSIONS] Cleaned up ${cleaned} expired sessions`);
  }

  return cleaned;
}

// Run cleanup every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const action = String(req.query.action || 'read').toLowerCase();
    const sessionId = String(req.query.sessionId || '');

    // GET /api/sessions?action=read&sessionId=... - get session data
    if (req.method === 'GET' && action === 'read') {
      if (!sessionId) {
        return res.status(400).json({
          error: 'Missing sessionId',
        });
      }

      const session = getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found or expired',
          sessionId,
        });
      }

      return res.status(200).json({
        ok: true,
        sessionId: session.sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        userProfile: session.userProfile,
        metadata: session.metadata,
      });
    }

    // POST /api/sessions?action=create - create new session
    if (req.method === 'POST' && action === 'create') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const userId = body.userId;

      const session = createSession(userId);

      return res.status(200).json({
        ok: true,
        sessionId: session.sessionId,
        userId: session.userId,
        expiresAt: session.expiresAt,
      });
    }

    // PUT /api/sessions?action=profile&sessionId=... - update session profile
    if (req.method === 'PUT' && action === 'profile') {
      if (!sessionId) {
        return res.status(400).json({
          error: 'Missing sessionId',
        });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

      if (!body || typeof body !== 'object') {
        return res.status(400).json({
          error: 'Invalid request body',
        });
      }

      const updated = updateSessionProfile(sessionId, body);

      if (!updated) {
        return res.status(404).json({
          error: 'Session not found or expired',
          sessionId,
        });
      }

      return res.status(200).json({
        ok: true,
        sessionId,
        message: 'Profile updated',
      });
    }

    // DELETE /api/sessions?action=delete&sessionId=... - destroy session
    if (req.method === 'DELETE' && action === 'delete') {
      if (!sessionId) {
        return res.status(400).json({
          error: 'Missing sessionId',
        });
      }

      const deleted = deleteSession(sessionId);

      return res.status(deleted ? 200 : 404).json({
        ok: deleted,
        sessionId,
        message: deleted ? 'Session deleted' : 'Session not found',
      });
    }

    // GET /api/sessions?action=list - debug: list all sessions (remove in production)
    if (req.method === 'GET' && action === 'list') {
      const sessions = Array.from(sessionStore.values()).map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        hasProfile: !!s.userProfile,
      }));

      return res.status(200).json({
        ok: true,
        totalSessions: sessions.length,
        sessions,
      });
    }

    return res.status(400).json({
      error: 'Invalid action',
      validActions: ['create', 'read', 'profile', 'delete', 'list'],
    });
  } catch (error: any) {
    console.error('[SESSIONS API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
}
