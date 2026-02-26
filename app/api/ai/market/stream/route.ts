import {
    BINANCE_MARKET_SOURCE,
    getLiveMarketItems,
    parseMarketSymbols,
} from "@/lib/ai/market-feed";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function toSseMessage(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "ai:market:stream",
    max: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const symbols = parseMarketSymbols(request.nextUrl.searchParams.get("symbols"));
  const pollMsRaw = Number.parseInt(request.nextUrl.searchParams.get("intervalMs") || "6000", 10);
  const pollMs = Number.isFinite(pollMsRaw) ? Math.max(2000, Math.min(15000, pollMsRaw)) : 6000;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(toSseMessage(event, payload)));
      };

      let closed = false;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
      let marketTimer: ReturnType<typeof setInterval> | null = null;

      const closeStream = () => {
        if (closed) return;
        closed = true;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (marketTimer) clearInterval(marketTimer);
        controller.close();
      };

      const emitMarket = async () => {
        try {
          const items = await getLiveMarketItems(symbols);
          send("market", {
            ok: true,
            source: BINANCE_MARKET_SOURCE,
            transport: "sse",
            symbols,
            items,
            generatedAt: new Date().toISOString(),
          });
        } catch (error) {
          send("error", {
            ok: false,
            error: error instanceof Error ? error.message : "live_market_feed_unavailable",
            symbols,
            generatedAt: new Date().toISOString(),
          });
        }
      };

      send("ready", {
        ok: true,
        source: BINANCE_MARKET_SOURCE,
        transport: "sse",
        symbols,
        intervalMs: pollMs,
        generatedAt: new Date().toISOString(),
      });

      void emitMarket();
      marketTimer = setInterval(() => {
        void emitMarket();
      }, pollMs);

      heartbeatTimer = setInterval(() => {
        send("heartbeat", { ts: Date.now() });
      }, 20000);

      request.signal.addEventListener("abort", closeStream);
    },
    cancel() {
      // client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...rateLimit.headers,
    },
  });
}
