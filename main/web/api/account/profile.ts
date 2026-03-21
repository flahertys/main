import type { VercelRequest, VercelResponse } from '@vercel/node';

interface UserProfile {
  userId: string;
  firstName: string;
  experienceLevel: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingStyle: 'scalp' | 'swing' | 'position';
  portfolioValue: number;
  preferredAssets: string[];
  goal: string;
  persona: string;
  onboardingCompletedAt: number;
  avatarUrl?: string;
  signalAccuracy?: {
    overall: number;
    byAsset: Record<string, number>;
  };
  tradeHistory?: Array<{ asset: string; signal: string; result: string; confidence: number }>;
  winRate?: number;
  averageConfidence?: number;
  consent?: { allowLlmTraining: boolean; allowPersonalization: boolean };
}

// In-memory profile store (replace with Supabase/database in production)
const profileStore = new Map<string, UserProfile>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract user ID from auth header or session
    const authHeader = req.headers.authorization || '';
    const userId = authHeader.replace('Bearer ', '') || 'anonymous';

    if (req.method === 'GET') {
      // GET /api/account/profile - retrieve user profile
      const profile = profileStore.get(userId);

      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found',
          userId,
        });
      }

      return res.status(200).json(profile);
    }

    if (req.method === 'PUT') {
      // PUT /api/account/profile - save/update user profile
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!body || typeof body !== 'object') {
        return res.status(400).json({
          error: 'Invalid request body',
          expected: 'UserProfile object',
        });
      }

      // Validate required fields
      if (!body.userId || !body.firstName || !body.riskTolerance) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['userId', 'firstName', 'riskTolerance'],
        });
      }

      // Normalize risk tolerance
      if (!['conservative', 'moderate', 'aggressive'].includes(body.riskTolerance)) {
        return res.status(400).json({
          error: 'Invalid riskTolerance',
          valid: ['conservative', 'moderate', 'aggressive'],
        });
      }

      // Normalize trading style
      if (body.tradingStyle && !['scalp', 'swing', 'position'].includes(body.tradingStyle)) {
        return res.status(400).json({
          error: 'Invalid tradingStyle',
          valid: ['scalp', 'swing', 'position'],
        });
      }

      const profile: UserProfile = {
        userId: body.userId || userId,
        firstName: body.firstName || 'Trader',
        experienceLevel: body.experienceLevel || 'intermediate',
        riskTolerance: body.riskTolerance,
        tradingStyle: body.tradingStyle || 'swing',
        portfolioValue: typeof body.portfolioValue === 'number' ? body.portfolioValue : 25000,
        preferredAssets: Array.isArray(body.preferredAssets) ? body.preferredAssets : ['BTC', 'ETH', 'SOL'],
        goal: body.goal || 'Generate structured trading plans with disciplined risk',
        persona: body.persona || 'Execution Coach',
        onboardingCompletedAt: body.onboardingCompletedAt || Date.now(),
        avatarUrl: body.avatarUrl,
        signalAccuracy: body.signalAccuracy,
        tradeHistory: body.tradeHistory,
        winRate: body.winRate,
        averageConfidence: body.averageConfidence,
        consent: body.consent,
      };

      profileStore.set(profile.userId, profile);

      return res.status(200).json({
        ok: true,
        profile,
        message: 'Profile saved successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[PROFILE API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
}
