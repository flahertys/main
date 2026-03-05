import express from 'express';
import { runTradeModel } from './model';
import { apiKeyAuth, limiter, logAccess } from './security-middleware';

const app = express();
app.use(express.json());
app.use(logAccess);
app.use(apiKeyAuth);
app.use(limiter);

app.post('/api/ai/signal', async (req, res) => {
  try {
    const signal = await runTradeModel(req.body);
    res.json(signal);
  } catch (e) {
    const details = e instanceof Error ? e.message : 'Unknown model error';
    res.status(500).json({ error: 'AI Model error', details });
  }
});
app.listen(8081, () => console.log('[AI] Trade Signal API running on 8081'));