#!/usr/bin/env node
/**
 * TradeHax Webhook Handler (Basic)
 * Receives and logs webhook events for extensible integrations.
 * Extend with event-specific logic as needed.
 */

const http = require('http');
const PORT = process.env.WEBHOOK_PORT || 4000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        console.log('Received webhook event:', event);
        // TODO: Add event-specific processing here
        res.writeHead(200);
        res.end('Webhook received');
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.log(`Webhook handler listening on port ${PORT}`);
});

