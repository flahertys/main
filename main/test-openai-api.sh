#!/bin/bash
# TradeHax - Test OpenAI API Key Validity
# This script tests your OpenAI API key without exposing it

set -e

API_KEY="$OPENAI_API_KEY"

if [ -z "$API_KEY" ]; then
    echo "❌ ERROR: OPENAI_API_KEY environment variable not set"
    echo ""
    echo "Set it with:"
    echo "  export OPENAI_API_KEY='sk-proj-YOUR_KEY_HERE'"
    exit 1
fi

echo "🧪 Testing OpenAI API Key..."
echo ""
echo "Making request to: https://api.openai.com/v1/chat/completions"
echo ""

response=$(curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [
      {
        "role": "user",
        "content": "Write a short haiku about artificial intelligence. Keep it to exactly 3 lines."
      }
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }')

# Check for errors
if echo "$response" | grep -q "error"; then
    echo "❌ API Error:"
    echo "$response" | grep -o '"error":[^}]*}' | head -1
    exit 1
fi

# Extract and display the response
if echo "$response" | grep -q "content"; then
    echo "✅ API Key is VALID and working!"
    echo ""
    echo "Response from GPT-4:"
    echo "─────────────────────────────"
    echo "$response" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//' | sed 's/"$//' | sed 's/\\n/\n/g'
    echo "─────────────────────────────"
    echo ""
    echo "✅ Your OpenAI API integration is working correctly!"
else
    echo "❌ Unexpected response:"
    echo "$response"
    exit 1
fi

