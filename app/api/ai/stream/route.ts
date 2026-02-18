/**
 * POST /api/ai/stream
 * Streaming text generation (Server-Sent Events)
 */

import { getLLMClient } from "@/lib/ai/hf-server";
import { NextRequest, NextResponse } from "next/server";

interface StreamRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamRequest = await request.json();

    if (!body.prompt) {
      return new Response("Prompt is required", { status: 400 });
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
          for await (const chunk of client.generateStream(body.prompt)) {
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
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Stream failed",
      },
      { status: 500 },
    );
  }
}
