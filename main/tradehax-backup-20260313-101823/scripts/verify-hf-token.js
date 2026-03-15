#!/usr/bin/env node

/**
 * Hugging Face API Token Verification Script
 * Tests the HF token and LLM inference connectivity
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const HF_TOKEN = process.env.NEXT_PUBLIC_HF_API_TOKEN;
const HF_ENDPOINT = process.env.HF_INFERENCE_API_ENDPOINT;
const HF_MODEL = process.env.HF_DEFAULT_MODEL;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║      Hugging Face Token & LLM Verification Script          ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Check if token exists
if (!HF_TOKEN) {
  console.error('[ERROR] NEXT_PUBLIC_HF_API_TOKEN not found in environment');
  process.exit(1);
}

console.log('[OK] HF Token found');
console.log(`Token: ${HF_TOKEN.substring(0, 20)}...${HF_TOKEN.substring(-10)}`);
console.log(`Endpoint: ${HF_ENDPOINT}`);
console.log(`Default Model: ${HF_MODEL}`);
console.log('');

// Test the token
console.log('Testing HF API token...');
console.log('');

const testPrompt = 'What is the meaning of life?';
const model = HF_MODEL || 'meta-llama/Llama-2-7b-chat-hf';
const url = `${HF_ENDPOINT}/${model}`;

const options = {
  hostname: 'api-inference.huggingface.co',
  path: `/models/${model}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HF_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

const testData = JSON.stringify({
  inputs: testPrompt,
  parameters: {
    max_length: 100,
  },
});

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`[Response Status] ${res.statusCode}`);
    console.log('');

    if (res.statusCode === 200) {
      console.log('[SUCCESS] HF Token is valid!');
      console.log('[SUCCESS] LLM inference endpoint is accessible!');
      console.log('');
      console.log('Response:');
      try {
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(data);
      }
      console.log('');
      console.log('✅ Ready to use Hugging Face API!');
      process.exit(0);
    } else if (res.statusCode === 401) {
      console.error('[ERROR] Invalid HF Token (401 Unauthorized)');
      console.error('Please check your token in .env.local');
      process.exit(1);
    } else if (res.statusCode === 503) {
      console.warn('[WARN] Model loading or temporarily unavailable (503)');
      console.log('Response:', data);
      console.log('The model may be loading. Try again in a moment.');
      process.exit(0);
    } else {
      console.error(`[ERROR] Request failed with status ${res.statusCode}`);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('[ERROR] Request failed:', error.message);
  process.exit(1);
});

req.write(testData);
req.end();

