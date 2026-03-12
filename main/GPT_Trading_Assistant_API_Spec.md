# GPT Trading Assistant API Specification

## Endpoints

### 1. /api/signals/generate
- POST
- Input: asset class, instrument, user preferences, risk profile
- Output: signal details (momentum, sentiment, volatility, macro/micro factors), confidence score, reasoning, audit event

### 2. /api/signals/alerts
- POST
- Input: signalId, alertType, threshold, userId
- Output: alert status, audit event

### 3. /api/trades/execute
- POST
- Input: portfolioId, trade details (symbol, side, quantity, price, signalId)
- Output: trade execution status, audit event

### 4. /api/compliance/log
- POST
- Input: eventType, resourceType, resourceId, action, description, details
- Output: log status, proof chain hash

### 5. /api/portfolio/report
- GET
- Input: portfolioId
- Output: performance metrics, position details, trade history

---
Status: Deployment-ready, production
Date: March 12, 2026

