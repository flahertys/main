// Simple WebSocket server for real-time streaming (Node.js, demo)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', function connection(ws) {
  ws.send(JSON.stringify({ type: 'info', message: 'Connected to TradeHax real-time stream.' }));
  // Example: send random market data every second
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'market',
      symbol: 'AAPL',
      price: 180 + Math.random() * 5,
      timestamp: Date.now()
    }));
    ws.send(JSON.stringify({
      type: 'signal',
      symbol: 'TSLA',
      score: Math.random(),
      alert: Math.random() > 0.95,
      timestamp: Date.now()
    }));
  }, 1000);
  ws.on('close', () => clearInterval(interval));
});

console.log('WebSocket server running on ws://localhost:8081');

