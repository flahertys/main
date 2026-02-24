import { getLLMClient } from "@/lib/ai/hf-server";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

type SocialChannel =
  | "youtube"
  | "discord"
  | "x"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "telegram"
  | "tiktok";

const DEFAULT_CHANNELS: SocialChannel[] = ["youtube", "discord", "x", "linkedin"];
const ALLOWED_CHANNELS = new Set<SocialChannel>([
  "youtube",
  "discord",
  "x",
  "linkedin",
  "instagram",
  "facebook",
  "telegram",
  "tiktok",
]);

function normalizeChannels(input: unknown): SocialChannel[] {
  if (!Array.isArray(input)) return DEFAULT_CHANNELS;

  const valid = input
    .map((item) => String(item).toLowerCase().trim())
    .filter((item): item is SocialChannel => ALLOWED_CHANNELS.has(item as SocialChannel));

  return valid.length > 0 ? Array.from(new Set(valid)).slice(0, 8) : DEFAULT_CHANNELS;
}

function cleanTextFromHtml(html: string) {
  const noScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ");

  const titleMatch = noScripts.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescriptionMatch = noScripts.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i,
  );

  const stripped = noScripts
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: (titleMatch?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 180),
    description: (metaDescriptionMatch?.[1] || "").replace(/\s+/g, " ").trim().slice(0, 240),
    excerpt: stripped.slice(0, 6000),
  };
}

function parseAndValidateUrl(urlRaw: unknown) {
  const value = String(urlRaw ?? "").trim();
  if (!value) return null;

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildPrompt(input: {
  sourceUrl: string;
  focus: string;
  channels: SocialChannel[];
  siteTitle: string;
  siteDescription: string;
  siteExcerpt: string;
}) {
  return [
    "You are TradeHax Social Autopilot.",
    "Create high-quality social drafts from website content.",
    "Output strict JSON object with shape:",
    '{"channels": {"youtube": {"title":"","hook":"","script":[""],"cta":""}, "discord": {"headline":"","summary":"","blocks":[""],"action":""}, "x": {"post":""}, "linkedin": {"post":""}, "instagram": {"caption":"","hashtags":[""]}, "facebook": {"post":""}, "telegram": {"message":""}, "tiktok": {"hook":"","caption":"","shotList":[""]}}}',
    "Only include channels requested. Keep language confident, non-hype, and never guarantee returns.",
    `Requested channels: ${input.channels.join(", ")}`,
    `Focus: ${input.focus}`,
    `Source URL: ${input.sourceUrl}`,
    `Site title: ${input.siteTitle || "N/A"}`,
    `Site description: ${input.siteDescription || "N/A"}`,
    `Site excerpt: ${input.siteExcerpt}`,
  ].join("\n\n");
}

function buildFallback(input: {
  sourceUrl: string;
  focus: string;
  channels: SocialChannel[];
  siteTitle: string;
  siteDescription: string;
  siteExcerpt: string;
}) {
  const base = `${input.siteTitle || "TradeHax"} — ${input.siteDescription || input.focus}`.trim();
  const snippet = input.siteExcerpt.slice(0, 280);

  const channels: Record<string, unknown> = {};
  for (const channel of input.channels) {
    if (channel === "youtube") {
      channels.youtube = {
        title: `${input.siteTitle || "TradeHax"}: ${input.focus}`,
        hook: base,
        script: [
          "Opening: Quick context from our latest website update.",
          snippet,
          "Execution: convert this into one clear action your audience can take today.",
        ],
        cta: "Join our Discord and subscribe for daily execution-ready updates.",
      };
    }

    if (channel === "discord") {
      channels.discord = {
        headline: `${input.siteTitle || "TradeHax"} update`,
        summary: base,
        blocks: [snippet, `Focus: ${input.focus}`],
        action: "Reply with your current setup and risk constraints.",
      };
    }

    if (channel === "x") {
      channels.x = {
        post: `${base}. New update: ${input.sourceUrl} #TradeHax #Trading`,
      };
    }

    if (channel === "linkedin") {
      channels.linkedin = {
        post: `${base}\n\nWe just published a new update with practical takeaways: ${input.sourceUrl}`,
      };
    }

    if (channel === "instagram") {
      channels.instagram = {
        caption: `${base}\n\nRead more at ${input.sourceUrl}`,
        hashtags: ["#tradehax", "#trading", "#markets"],
      };
    }

    if (channel === "facebook") {
      channels.facebook = {
        post: `${base}\n\nFull update: ${input.sourceUrl}`,
      };
    }

    if (channel === "telegram") {
      channels.telegram = {
        message: `${base}\n\nSource: ${input.sourceUrl}`,
      };
    }

    if (channel === "tiktok") {
      channels.tiktok = {
        hook: base,
        caption: `${input.focus} breakdown from our latest update. Link in bio.`,
        shotList: [
          "Scene 1: strongest claim from the article",
          "Scene 2: practical checklist",
          "Scene 3: call to action",
        ],
      };
    }
  }

  return {
    sourceUrl: input.sourceUrl,
    focus: input.focus,
    generatedAt: new Date().toISOString(),
    model: "fallback",
    channels,
  };
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:content:repurpose",
    max: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const body = (await request.json()) as {
    websiteUrl?: string;
    focus?: string;
    channels?: unknown;
  };

  const sourceUrl = parseAndValidateUrl(body.websiteUrl);
  if (!sourceUrl) {
    return NextResponse.json(
      { ok: false, error: "A valid website URL is required." },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const focus = String(body.focus || "cross-platform brand growth").slice(0, 80).trim() || "cross-platform brand growth";
  const channels = normalizeChannels(body.channels);

  let html = "";
  try {
    const response = await fetch(sourceUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "TradeHax-SocialAutopilot/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Website fetch failed (${response.status})`);
    }

    html = await response.text();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch website content.",
      },
      { status: 502, headers: rateLimit.headers },
    );
  }

  const content = cleanTextFromHtml(html);
  const fallback = buildFallback({
    sourceUrl,
    focus,
    channels,
    siteTitle: content.title,
    siteDescription: content.description,
    siteExcerpt: content.excerpt,
  });

  try {
    const client = getLLMClient();
    const prompt = buildPrompt({
      sourceUrl,
      focus,
      channels,
      siteTitle: content.title,
      siteDescription: content.description,
      siteExcerpt: content.excerpt,
    });
    const generated = await client.generate(prompt);
    const output = generated.text.trim();
    if (!output) {
      return NextResponse.json({ ok: true, draft: fallback }, { headers: rateLimit.headers });
    }

    try {
      const parsed = JSON.parse(output) as Record<string, unknown>;
      return NextResponse.json(
        {
          ok: true,
          draft: {
            sourceUrl,
            focus,
            generatedAt: new Date().toISOString(),
            model: generated.model,
            channels: parsed.channels ?? fallback.channels,
          },
        },
        { headers: rateLimit.headers },
      );
    } catch {
      return NextResponse.json({ ok: true, draft: fallback }, { headers: rateLimit.headers });
    }
  } catch (error) {
    console.warn("Social repurpose generation failed, returning fallback.", error);
    return NextResponse.json({ ok: true, draft: fallback }, { headers: rateLimit.headers });
  }
}
