// RESTful API endpoint for account profile
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserEncryptedVault, updateUserEncryptedVault } from '../lib/intelligence/user-encrypted-vault';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Authentication and rate limiting would be handled by middleware
      const { userId } = req.query;
      const vault = await getUserEncryptedVault(userId as string);
      res.status(200).json({ ok: true, userId: vault.userId, profile: vault });
    } else if (req.method === 'PUT') {
      const { userId, ...body } = req.body;
      const profile = await updateUserEncryptedVault(userId as string, body);
      res.status(200).json({ ok: true, userId: profile.userId, profile });
    } else {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
}

