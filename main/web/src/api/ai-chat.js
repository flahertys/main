// AI Chat API: Multi-turn, streaming, and structured output
import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req) {
  const { conversationId, message, model, history, format, stream } = await req.json();
  const prompt = (history || []).map(m => `${m.role}: ${m.content}`).join('\n') + `\nuser: ${message}`;

  if (OPENAI_API_KEY) {
    // Call OpenAI API (streaming if requested)
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: model || 'gpt-4',
      messages: [
        ...(history || []).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ],
      stream: !!stream
    };
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (stream) {
      // SSE streaming response
      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } else {
      const data = await res.json();
      return NextResponse.json({ role: 'ai', content: data.choices?.[0]?.message?.content || '' });
    }
  }
  // Fallback: static demo response
  return NextResponse.json({ role: 'ai', content: { summary: 'Demo: No OpenAI API key set.', table: [], chart: null, explanation: 'Set OPENAI_API_KEY for real LLM output.' } });
}
