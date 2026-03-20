# Quick Setup: AI Signal Generation for Polymarket Trading Assistant

## TL;DR Setup (2 minutes)

### Step 1: Get Free HuggingFace API Token
1. Visit: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name: `TradeHax`
4. Permission: `Read` (NOT write)
5. Click **"Generate token"**
6. Copy the token (looks like `hf_abc123xyz...`)

### Step 2: Add to Environment
**Option A - Development (.env.local)**:
```bash
# File: web/.env.local
HUGGINGFACE_API_KEY=hf_your_token_here
```

**Option B - Vercel Dashboard**:
1. Go to https://vercel.com/digitaldynasty/main/settings/environment-variables
2. Click **"Add"**
3. Name: `HUGGINGFACE_API_KEY`
4. Value: `hf_your_token_here`
5. Environments: Select `Production` and `Preview`
6. Click **"Save"**

### Step 3: Restart Dev Server
```bash
cd c:\tradez\main\web
npm run dev
```

### Step 4: Test It
1. Open http://localhost:5173/polymarket
2. Click **⟳ SCAN** button
3. Watch for "SIGNAL ENGINE" phase
4. Should complete in ~25 seconds
5. See AI-powered signals in UI

## What You Get

✅ **Free Llama-3.3-70B** - State-of-the-art open model (no credit card)
✅ **500K token/month** - Plenty for personal use
✅ **Instant Signals** - AI-powered market recommendations (3-5 second response)
✅ **Graceful Fallback** - Works fine without key (uses local quant engine)
✅ **Production Ready** - Used by thousands of projects

## Technical Details

### AI Models Used (in order of preference)

1. **HuggingFace - Llama-3.3-70B-Instruct**
   - Free tier: 500K tokens/month
   - No credit card required
   - Speed: ~3-5 seconds per request
   - Quality: Excellent for trading analysis

2. **OpenAI - GPT-4-Turbo** (optional fallback)
   - Paid: ~$0.03 per request
   - Much faster: <1 second
   - Better at math/reasoning
   - Set `OPENAI_API_KEY` in env to enable

3. **Local Quant Engine** (always available)
   - No API calls needed
   - Instant response
   - Uses Fibonacci + Kelly + RSI analysis
   - No internet required

### API Endpoint

**Endpoint**: `/api/signals/ai-signals` (POST)

**Modes**:
- `mode: "signals"` - Generate trading recommendations
- `mode: "chat"` - Conversational trading advice

**Response Time**:
- HuggingFace: 3-5 seconds
- OpenAI: <1 second  
- Local fallback: <100ms

## Troubleshooting

### "Generate token" button not appearing?
- Make sure you're logged into HuggingFace
- If not logged in, create account first: https://huggingface.co/join
- Then go back to tokens page

### Token keeps getting rejected?
- Double-check you copied it completely (no extra spaces)
- Don't share the token with anyone
- You can regenerate a new one anytime
- Old tokens automatically revoke after generation

### Still no AI signals?
- Check browser console (F12 → Console)
- Should see warning like `"AI adapter failed: ..."`
- This is normal - means it falls back to local quant engine
- Local signals are still very good (Fibonacci+Kelly+RSI)
- Try refreshing the page and scanning again

### Rate limit hit?
- HuggingFace free tier: 500K tokens/month (~15K requests)
- One scan uses ~500 tokens
- That's ~1000 scans/month (33/day)
- More than enough for personal use
- If needed, upgrade to paid HF tier

## Advanced: Custom System Prompt

The AI uses a sophisticated system prompt that includes:
- Your bankroll size
- Kelly fraction (risk preference)
- Connected wallet address
- Top 6 markets from scan
- Your recent chat history

This allows the AI to give personalized advice tailored to YOUR risk profile.

## Advanced: OpenAI Fallback

For faster responses, add OpenAI:

1. Get API key: https://platform.openai.com/api-keys
2. Add to env:
   ```
   OPENAI_API_KEY=sk_your_key_here
   ```
3. Costs: ~$0.03 per request (~$0.003 per scan at typical rates)
4. Much faster: <1 second response
5. Better at complex math

## Advanced: Deploy to Vercel

```bash
# Set env var in Vercel
HUGGINGFACE_API_KEY=hf_your_token_here

# Deploy
npm run deploy
```

Then visit: https://tradehax.net/polymarket (or your domain)

---

**Need Help?**
- Check browser console: F12 → Console
- Check network requests: F12 → Network
- Check backend logs: Vercel Dashboard → Logs
- Common issues are just network timeouts - try again

**Questions?**
- HuggingFace Docs: https://huggingface.co/docs/inference-api
- Polymarket Docs: https://docs.polymarket.com
- TradeHax Docs: See POLYMARKET_TRADING_ASSISTANT_GUIDE.md

