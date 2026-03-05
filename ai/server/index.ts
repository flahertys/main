import express from 'express';
import { runTradeModel } from './model';
const app = express();
app.use(express.json());

import { apiKeyAuth, limiter, logAccess } from "../../common/middleware/security";
app.use(logAccess);
app.use(apiKeyAuth);
app.use(limiter);

app.post('/api/ai/signal', async (req, res) => {
  try {
    const signal = await runTradeModel(req.body);
    res.json(signal);
  } catch (e) {
    res.status(500).json({ error: 'AI Model error', details: e.message });
  }
});
app.listen(8081, () => console.log('[AI] Trade Signal API running on 8081'));