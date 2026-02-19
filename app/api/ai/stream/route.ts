/**
 * POST /api/ai/stream
 * Streaming text generation (Server-Sent Events)
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import {
  enforceRateLimit,
  enforceTrustedOrigin,
  isJsonContentType,
  sanitizePlainText,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

interface StreamRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  if (!isJsonContentType(request)) {
    return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:stream",
    max: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    const body: StreamRequest = await request.json();
    const prompt = sanitizePlainText(String(body.prompt ?? ""), 4_000);

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required" },
        { status: 400, headers: rateLimit.headers },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const client = getLLMClient();

          // Send start marker
          controller.enqueue(
            encoder.encode('data: {"type":"start"}\n\n'),
          );

          // Stream text chunks
          for await (const chunk of client.generateStream(prompt)) {
            const data = JSON.stringify({
              type: "token",
              text: chunk,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send complete marker
          controller.enqueue(
            encoder.encode('data: {"type":"end"}\n\n'),
          );

          controller.close();
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: errorMsg })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...rateLimit.headers,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Stream failed",
      },
      { status: 500 },
    );
  }
}
