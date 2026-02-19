import {
  ensureLiveIngestion,
  getLiveEventsSince,
  getLiveIngestionStatus,
} from "@/lib/intelligence/live-ingestion";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest } from "next/server";

function parseCursor(value: string | null) {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:live:stream",
    max: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  ensureLiveIngestion();
  const initialCursor = parseCursor(request.nextUrl.searchParams.get("cursor"));
  const encoder = new TextEncoder();
  let cursor = initialCursor;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sendPayload = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      sendPayload("status", getLiveIngestionStatus());
      const initial = getLiveEventsSince(cursor, 80);
      cursor = initial.nextCursor;
      for (const item of initial.events) {
        sendPayload("event", item);
      }

      const pollInterval = setInterval(() => {
        const next = getLiveEventsSince(cursor, 120);
        cursor = next.nextCursor;
        if (next.events.length === 0) {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${Date.now()}\n\n`));
          return;
        }
        for (const item of next.events) {
          sendPayload("event", item);
        }
      }, 1500);

      const statusInterval = setInterval(() => {
        sendPayload("status", getLiveIngestionStatus());
      }, 10_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        clearInterval(statusInterval);
        controller.close();
      });
    },
    cancel() {
      // No-op.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...rateLimit.headers,
    },
  });
}
