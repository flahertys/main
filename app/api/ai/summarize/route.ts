/**
 * POST /api/ai/summarize
 * Summarize long text using Hugging Face
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import { NextRequest, NextResponse } from "next/server";

interface SummarizeRequest {
  text: string;
  maxLength?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();

    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 },
      );
    }

    // Truncate text if too long
    const maxChars = 1024;
    const truncatedText =
      body.text.length > maxChars
        ? body.text.slice(0, maxChars) + "..."
        : body.text;

    const client = getLLMClient();
    const response = await client.summarize(truncatedText);

    return NextResponse.json({
      ok: true,
      summary: response.text,
      model: response.model,
    });
  } catch (error) {
    console.error("Summarize API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Summarization failed",
      },
      { status: 500 },
    );
  }
}
