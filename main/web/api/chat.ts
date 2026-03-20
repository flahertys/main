import type { VercelRequest, VercelResponse } from '@vercel/node';
import aiChatHandler from './ai/chat.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support both legacy interface and new mode-based routing
  const { mode, messages, system, context } = req.body || {};

  // If mode specified, pass it through in request for ODIN/Advanced/Base routing
  if (mode) {
    req.body.mode = mode;
    req.body.system = system;
    req.body.context = context;
  }

  return aiChatHandler(req, res);
}

