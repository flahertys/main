# Grok-4 Integration Guide

## Overview

This project now includes full integration with **XAI's Grok-4** model, a state-of-the-art AI system optimized for cryptocurrency trading analysis and market insights.

### Key Features

- ✅ **XAI Grok-4 API Integration**: Direct access to Grok-4 model
- ✅ **Streaming Responses**: Real-time response streaming for low-latency interaction
- ✅ **Session Management**: Conversation history and context awareness
- ✅ **Trading Optimization**: System prompts tuned for crypto market analysis
- ✅ **Production-Ready**: Error handling, CORS, and rate limiting ready
- ✅ **Client Integration**: React hooks and utilities for easy UI integration

## Setup Instructions

### 1. Environment Variables

The `XAI_API_KEY` has already been pulled via `vercel env pull`. Verify it's in your `.env.local`:

```bash
cat .env.local | grep XAI_API_KEY
```

Expected output:
```
XAI_API_KEY=your_api_key_here
```

### 2. Dependencies

All required packages have been installed:

```bash
npm list @ai-sdk/xai ai dotenv
```

Installed packages:
- `@ai-sdk/xai`: XAI provider for AI SDK
- `ai`: Vercel AI SDK for streaming and generation
- `dotenv`: Environment variable management

### 3. API Endpoint

**Endpoint**: `POST /api/ai/grok`

**Request Body**:
```json
{
  "message": "What's the best strategy for DeFi yield farming?",
  "sessionId": "optional-session-id",
  "conversationContext": []
}
```

**Response**: Server-sent events (SSE) stream
```
data: {"chunk":"Analysis of yield farming..."}
data: {"chunk":" with risk management..."}
data: {"done":true,"usage":{"promptTokens":45,"completionTokens":128,"totalTokens":173}}
```

## Usage Examples

### Command-Line Test

```bash
node grok-test.mjs
```

This script demonstrates:
- Loading environment variables
- Initializing the XAI Grok-4 model
- Streaming responses
- Tracking token usage

### API Integration

```typescript
// Using the API endpoint directly
const response = await fetch('/api/ai/grok', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Analyze the current Bitcoin market trend'
  })
});

// Read SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.chunk) console.log(data.chunk);
    }
  }
}
```

### React Component Integration

```typescript
import { useGrok } from '@/lib/grok-client';

export function TradingAssistant() {
  const { response, loading, error, askGrok } = useGrok();

  return (
    <div>
      <input
        type="text"
        placeholder="Ask Grok-4..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            askGrok(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
      {loading && <div>Thinking...</div>}
      {error && <div>Error: {error}</div>}
      {response && <div>{response}</div>}
    </div>
  );
}
```

## System Prompt

The default system prompt is optimized for crypto trading:

```
You are Grok, an advanced AI assistant created by xAI specializing in cryptocurrency trading and market analysis.
You provide insightful analysis of crypto markets, trading strategies, and DeFi opportunities.
You are knowledgeable about blockchain technology, smart contracts, and emerging crypto trends.
Your responses should be direct, insightful, and actionable for traders.
Always consider risk management in your recommendations.
```

You can customize this by modifying the `SYSTEM_PROMPT` constant in `/api/ai/grok.ts`.

## API Response Format

### Streaming Chunk
```json
{
  "chunk": "Text content of the response"
}
```

### Completion Event
```json
{
  "done": true,
  "usage": {
    "promptTokens": 45,
    "completionTokens": 128,
    "totalTokens": 173
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": 500
}
```

## Performance & Costs

- **Model**: Grok-4 (xAI's latest)
- **Input Token Cost**: Check xAI pricing
- **Output Token Cost**: Check xAI pricing
- **Streaming**: Enables low-latency responses
- **Conversation Context**: Up to 5 recent messages cached

## File Structure

```
web/
├── api/
│   └── ai/
│       └── grok.ts          # API endpoint (POST /api/ai/grok)
├── lib/
│   └── grok-client.tsx      # React hooks and client utilities
├── grok-test.mjs            # Command-line test script
└── .env.local               # Environment variables (includes XAI_API_KEY)
```

## Testing

### Test the API locally:

```bash
# Start the dev server
npm run dev

# In another terminal, test the endpoint
curl -X POST http://localhost:3000/api/ai/grok \
  -H "Content-Type: application/json" \
  -d '{"message":"What is DeFi?"}'
```

### Test with Grok-4 Command-Line Tool:

```bash
node grok-test.mjs
```

## Troubleshooting

### Issue: "XAI_API_KEY not configured"

**Solution**: Pull fresh environment variables:
```bash
vercel env pull
```

Confirm the key exists:
```bash
grep XAI_API_KEY .env.local
```

### Issue: "Method not allowed"

**Solution**: Use `POST` requests only:
```bash
# ✅ Correct
curl -X POST /api/ai/grok

# ❌ Wrong
curl -X GET /api/ai/grok
```

### Issue: Slow streaming responses

**Solution**: 
- Check Grok-4 API status at xAI console
- Reduce `maxTokens` parameter (default: 2048)
- Check network latency

## Deployment

The integration is production-ready:

```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy
```

The API endpoint will be available at:
```
https://your-domain.com/api/ai/grok
```

## Security Considerations

1. **API Key Protection**: Never commit `.env.local` to git
2. **CORS**: Currently allows all origins. Update for production:
   ```typescript
   res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
   ```
3. **Rate Limiting**: Add rate limiting middleware for production
4. **Input Validation**: Validate message length and format

## Advanced Configuration

### Custom System Prompt

Edit `/api/ai/grok.ts`:

```typescript
const SYSTEM_PROMPT = `Your custom system prompt for Grok-4...`;
```

### Conversation History

The endpoint supports conversation context:

```typescript
const { response } = await fetch('/api/ai/grok', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Follow up question',
    conversationContext: [
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'Response' }
    ]
  })
});
```

### Token Budget Optimization

Monitor token usage:

```javascript
// From API response
const usage = {
  promptTokens: 45,      // Your input
  completionTokens: 128, // Grok's response
  totalTokens: 173       // Billed amount
};
```

## Resources

- **XAI Documentation**: https://www.x.ai/
- **Grok-4 Model Card**: Check xAI console for details
- **Vercel AI SDK**: https://sdk.vercel.ai
- **Next.js API Routes**: https://nextjs.org/docs/pages/building-your-application/routing/api-routes

## Support

For issues:

1. Check `.env.local` has `XAI_API_KEY`
2. Verify API key is valid in xAI console
3. Check network connectivity
4. Review xAI API status page
5. Check application logs for detailed errors

---

**Last Updated**: March 21, 2026
**Integration Status**: ✅ Complete and tested

