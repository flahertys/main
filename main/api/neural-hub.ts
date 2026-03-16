// RESTful API endpoint for neural hub
import { generateTradingSignal } from '../services/neuralBotService';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { symbol, marketType } = req.body;
    try {
      const signal = await generateTradingSignal(symbol, marketType);
      res.status(200).json({ ok: true, signal });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal error' });
    }
  } else {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
}

