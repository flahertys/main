import {
    type DiscordInteraction,
    handleDiscordInteraction,
    verifyDiscordSignature,
} from "@/lib/discord/interactions";
import { enforceRateLimit } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "discord:interactions",
    max: 180,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const signature = request.headers.get("x-signature-ed25519") || "";
  const timestamp = request.headers.get("x-signature-timestamp") || "";
  const publicKeyHex = String(process.env.DISCORD_PUBLIC_KEY || "").trim();

  const bodyText = await request.text();

  const valid = verifyDiscordSignature({
    signature,
    timestamp,
    body: bodyText,
    publicKeyHex,
  });

  if (!valid) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request signature.",
      },
      {
        status: 401,
        headers: rateLimit.headers,
      },
    );
  }

  let interaction: unknown;
  try {
    interaction = JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON payload.",
      },
      {
        status: 400,
        headers: rateLimit.headers,
      },
    );
  }

  const response = await handleDiscordInteraction(interaction as DiscordInteraction);
  return NextResponse.json(response, {
    headers: rateLimit.headers,
  });
}
