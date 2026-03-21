#!/usr/bin/env node

import dotenv from "dotenv";
import { xai } from "@ai-sdk/xai";
import { streamText } from "ai";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("🚀 Testing XAI Grok-4 Integration");
  console.log("=" * 50);

  // Check if API key is available
  if (!process.env.XAI_API_KEY) {
    console.error("❌ XAI_API_KEY not found in environment variables");
    console.error("Please ensure your .env.local file contains XAI_API_KEY");
    process.exit(1);
  }

  console.log("✅ XAI_API_KEY found");
  console.log("");

  try {
    console.log("📝 Streaming response from Grok-4...\n");

    const result = streamText({
      model: xai("grok-4"),
      system:
        "You are a helpful assistant that specializes in crypto trading insights. Keep responses concise and actionable.",
      prompt:
        "Invent a new crypto trading holiday that celebrates DeFi breakthroughs and describe its traditions in 2-3 sentences.",
    });

    let totalTokens = 0;

    // Stream the response
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }

    console.log("\n");

    // Get usage information
    const usage = await result.usage;
    console.log("─" * 50);
    console.log("📊 Token Usage:");
    console.log(`   Input tokens: ${usage.promptTokens}`);
    console.log(`   Output tokens: ${usage.completionTokens}`);
    console.log(`   Total tokens: ${usage.totalTokens}`);
    console.log("─" * 50);

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    process.exit(1);
  }
}

main();

