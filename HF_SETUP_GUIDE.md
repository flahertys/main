# Hugging Face LLM Integration Guide

## Quick Setup

### 1. Get Your API Token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Set name: `tradehax-ai`
4. Set role: `read` (read-only access)
5. Copy the token

### 2. Configure Environment

Create or edit `.env.local`:

```bash
# Hugging Face Configuration
HF_API_TOKEN=hf_your_token_here

# Choose a model
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1
HF_USE_LOCAL_MODEL=false

# Optional settings
LLM_TEMPERATURE=0.7
LLM_MAX_LENGTH=512
LLM_TOP_P=0.95
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test the API

Go to: **http://localhost:3000/ai**

Or test via curl:

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}'
```

---

## Available Models

### Free/Fast (No Inference Fee)

- **distilgpt2** - Fastest, ~82M parameters
- **gpt2** - Fast, ~124M parameters
- **distilbert-base-uncased** - BERT variant

### Recommended (Low Cost)

- **mistralai/Mistral-7B-Instruct-v0.1** - Excellent balance, ~7B params (default)
- **microsoft/phi-2** - Fast and capable, ~2.7B params

### Best Quality (Higher Cost/Latency)

- **meta-llama/Llama-2-7b** - Powerful open-source, ~7B params
- **tiiuae/falcon-7b** - Fast, high-quality, ~7B params
- **meta-llama/Llama-2-13b** - Even more capable, ~13B params

### Specialized Models

- **Salesforce/codet5-large** - Code generation and understanding
- **facebook/bart-large-cnn** - Text summarization
- **Helsinki-NLP/opus-mt-en-es** - English to Spanish translation

---

## API Endpoints

### POST /api/ai/generate

Generate text from a prompt.

**Request:**
```json
{
  "prompt": "Write a poem about AI",
  "maxTokens": 256,
  "temperature": 0.8
}
```

**Response:**
```json
{
  "ok": true,
  "text": "...",
  "model": "mistralai/Mistral-7B-Instruct-v0.1",
  "tokensUsed": 42
}
```

### POST /api/ai/chat

Chat with conversation history.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "What is AI?" },
    { "role": "assistant", "content": "AI is..." },
    { "role": "user", "content": "Tell me more." }
  ],
  "systemPrompt": "You are a helpful AI assistant"
}
```

**Response:**
```json
{
  "ok": true,
  "message": {
    "role": "assistant",
    "content": "..."
  },
  "model": "mistralai/Mistral-7B-Instruct-v0.1"
}
```

### POST /api/ai/summarize

Summarize long text.

**Request:**
```json
{
  "text": "Lorem ipsum dolor sit amet...",
  "maxLength": 150
}
```

**Response:**
```json
{
  "ok": true,
  "summary": "...",
  "model": "mistralai/Mistral-7B-Instruct-v0.1"
}
```

### POST /api/ai/stream

Stream text generation using Server-Sent Events (SSE).

**Request:**
```bash
curl -N http://localhost:3000/api/ai/stream \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

**Response (streaming):**
```
data: {"type":"start"}
data: {"type":"token","text":" world"}
data: {"type":"token","text":"!"}
data: {"type":"end"}
```

---

## Using in React Components

### Chat Component

```tsx
import { HFChatComponent } from "@/components/ai/HFChatComponent";

export default function MyPage() {
  return <HFChatComponent />;
}
```

### Generator Component

```tsx
import { HFGeneratorComponent } from "@/components/ai/HFGeneratorComponent";

export default function MyPage() {
  return <HFGeneratorComponent />;
}
```

### Custom Hook

```tsx
import { useHFChat } from "@/hooks/useHFChat";

export function MyComponent() {
  const { messages, sendMessage, loading } = useHFChat();

  return (
    <>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <button onClick={() => sendMessage("Hello")}>Send</button>
    </>
  );
}
```

---

## Advanced: Custom Prompts

### Prompt Structuring

Use system prompts to guide behavior:

```typescript
const messages = [
  {
    role: "system",
    content: "You are a helpful Python programming assistant."
  },
  {
    role: "user",
    content: "How do I read a JSON file?"
  }
];

await fetch("/api/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages })
});
```

### Few-Shot Examples

```typescript
const messages = [
  { role: "user", content: "Translate to Spanish: Hello" },
  { role: "assistant", content: "Hola" },
  { role: "user", content: "Translate to Spanish: Good morning" },
  { role: "assistant", content: "Buenos días" },
  { role: "user", content: "Translate to Spanish: How are you?" }
];
```

### Chain-of-Thought

```typescript
const prompt = `
Question: If there are 5 apples and you eat 2, how many are left?

Let's think step by step:
1. Start with 5 apples
2. You eat 2 apples
3. 5 - 2 = ?

Answer:
`;
```

---

## Troubleshooting

### "HF_API_TOKEN not set"

- Add `HF_API_TOKEN=hf_your_token` to `.env.local`
- Restart dev server (`npm run dev`)
- Check that your token is valid at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### "Model not available"

- Model might be loading (first request is slow)
- Check model exists: https://huggingface.co/models
- Try a smaller model like `distilgpt2`
- Verify internet connection

### Slow Responses

- First request loads model (30-60 seconds)
- Subsequent requests are faster
- Try smaller model: `distilgpt2` or `gpt2`
- Increase timeout if needed

### Memory Issues

- Run on machine with at least 4GB RAM
- Use smaller models: `distilgpt2` (~300MB), `gpt2` (~500MB)
- Avoid running other large applications

---

## Local Model Setup (Optional)

To run models locally without API calls:

```bash
# Install transformers for CPU/GPU
npm install transformers onnxruntime-web

# Update .env.local
HF_USE_LOCAL_MODEL=true
HF_LOCAL_MODEL_NAME=gpt2
```

---

## Resources

- [Hugging Face Hub](https://huggingface.co)
- [Inference API Docs](https://huggingface.co/docs/api-inference)
- [@huggingface/inference Docs](https://www.npmjs.com/package/@huggingface/inference)
- [Transformers.js](https://github.com/xenova/transformers.js)

---

## Next Steps

1. ✅ Set up API token
2. ✅ Configure .env.local
3. ✅ Test /api/ai endpoints
4. ✅ Use HFChatComponent or HFGeneratorComponent
5. Build custom AI features for your app

---

## Security Notes

- **Never commit** `HF_API_TOKEN` to git
- **Use `.env.local`** for local development (gitignored)
- **Use GitHub Secrets** for production (Vercel)
- API calls are sent to Hugging Face servers
- Consider rate limits for production use

---

## Billing

- **Free tier**: Limited requests (enough for testing)
- **Pro tier** ($9/month): Higher rate limits
- **Enterprise**: Custom solutions

Check your usage: https://huggingface.co/billing/overview
