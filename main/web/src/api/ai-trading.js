// AI Trading API: Strategy management, backtesting, and paper trading
import { NextResponse } from 'next/server';

// In-memory store for strategies and paper trades (replace with DB in production)
const strategies = {};
const paperTrades = {};
const API_KEY = process.env.API_KEY || 'dev-key';

function logAction(action, data, req) {
  const user = req.headers.get('x-api-key') || 'unknown';
  console.log(`[${new Date().toISOString()}] [${user}] [${action}]`, data);
}

export async function POST(req) {
  // --- AUTH ---
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { action, strategyId, strategy, params, historicalData, order, marketData } = await req.json();
  // --- PRODUCTION LLM UNUSUAL PLAY SCANNER ---
  async function prodLLMUnusualPlayScanner(marketData) {
    // Use OpenAI API (or similar) for production unusual play scanning
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key');
    // Prepare prompt for LLM
    const prompt = `Analyze the following market data and identify any symbols with unusual price or volume activity. For each, return symbol, signal (buy/sell), confidence (0-1), reason, price, and prevClose.\n\nMarket Data:\n${JSON.stringify(marketData).slice(0, 4000)}`;
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional trading assistant. Only return JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 512,
          temperature: 0.2
        })
      });
      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }
      const data = await response.json();
      // Parse LLM output (expecting JSON array in the response)
      const content = data.choices?.[0]?.message?.content;
      let signals = [];
      try {
        signals = JSON.parse(content);
      } catch (e) {
        // fallback: try to extract JSON from text
        const match = content && content.match(/\[.*\]/s);
        if (match) signals = JSON.parse(match[0]);
      }
      if (!Array.isArray(signals)) signals = [];
      return signals;
    } catch (err) {
      console.error('LLM unusual play scanner error:', err);
      return [];
    }
  }

  if (action === 'scanUnusualPlays') {
    // LLM-driven unusual play scanner (production)
    if (!marketData || !Array.isArray(marketData)) {
      return NextResponse.json({ error: 'Missing or invalid marketData' }, { status: 400 });
    }
    const signals = await prodLLMUnusualPlayScanner(marketData);
    logAction('scanUnusualPlays', { signalsCount: signals.length }, req);
    return NextResponse.json({ signals });
  }
  // --- LOG ---
  logAction(action, { strategyId, strategy, params, order }, req);

  if (action === 'create') {
    const id = Math.random().toString(36).slice(2);
    strategies[id] = { ...strategy, id, createdAt: Date.now() };
    return NextResponse.json({ id, strategy: strategies[id] });
  }

  if (action === 'get') {
    if (!strategyId || !strategies[strategyId]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ strategy: strategies[strategyId] });
  }

  if (action === 'list') {
    return NextResponse.json({ strategies: Object.values(strategies) });
  }

  if (action === 'backtest') {
    // Simple moving average crossover backtest (demo)
    const { fast = 3, slow = 7 } = params || {};
    const prices = historicalData || Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 5 + Math.random());
    const fastMA = prices.map((_, i, arr) => i < fast ? null : arr.slice(i - fast, i).reduce((a, b) => a + b, 0) / fast);
    const slowMA = prices.map((_, i, arr) => i < slow ? null : arr.slice(i - slow, i).reduce((a, b) => a + b, 0) / slow);
    let position = 0, pnl = 0, trades = [];
    for (let i = slow; i < prices.length; i++) {
      if (fastMA[i] > slowMA[i] && position <= 0) {
        position = 1;
        trades.push({ type: 'buy', price: prices[i], index: i });
      } else if (fastMA[i] < slowMA[i] && position >= 0) {
        position = -1;
        trades.push({ type: 'sell', price: prices[i], index: i });
      }
    }
    // Calculate P&L (demo)
    for (let i = 1; i < trades.length; i++) {
      if (trades[i - 1].type === 'buy' && trades[i].type === 'sell') {
        pnl += trades[i].price - trades[i - 1].price;
      } else if (trades[i - 1].type === 'sell' && trades[i].type === 'buy') {
        pnl += trades[i - 1].price - trades[i].price;
      }
    }
    return NextResponse.json({ trades, pnl, fastMA, slowMA, prices });
  }

  if (action === 'paperTrade') {
    // Paper trading logic
    // order: { symbol, side ('buy'|'sell'), qty, price }
    if (!order || !order.symbol || !order.side || !order.qty || !order.price) {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
    }
    const symbol = order.symbol.toUpperCase();
    if (!paperTrades[symbol]) {
      paperTrades[symbol] = { position: 0, avgPrice: 0, trades: [], realizedPnl: 0 };
    }
    const pt = paperTrades[symbol];
    // Update position and P&L
    if (order.side === 'buy') {
      const newPos = pt.position + order.qty;
      pt.avgPrice = (pt.avgPrice * pt.position + order.price * order.qty) / newPos;
      pt.position = newPos;
      pt.trades.push({ ...order, timestamp: Date.now() });
    } else if (order.side === 'sell') {
      const sellQty = Math.min(order.qty, pt.position);
      pt.realizedPnl += sellQty * (order.price - pt.avgPrice);
      pt.position -= sellQty;
      pt.trades.push({ ...order, timestamp: Date.now() });
    }
    return NextResponse.json({ status: 'ok', position: pt.position, avgPrice: pt.avgPrice, realizedPnl: pt.realizedPnl });
  }

  if (action === 'getPaperPosition') {
    const { symbol } = params || {};
    if (!symbol || !paperTrades[symbol.toUpperCase()]) return NextResponse.json({ error: 'No position' }, { status: 404 });
    const pt = paperTrades[symbol.toUpperCase()];
    return NextResponse.json({ position: pt.position, avgPrice: pt.avgPrice, realizedPnl: pt.realizedPnl });
  }

  if (action === 'getPaperTrades') {
    const { symbol } = params || {};
    if (!symbol || !paperTrades[symbol.toUpperCase()]) return NextResponse.json({ trades: [] });
    return NextResponse.json({ trades: paperTrades[symbol.toUpperCase()].trades });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
