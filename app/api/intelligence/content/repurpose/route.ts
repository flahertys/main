import { getLLMClient } from "@/lib/ai/hf-server";
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { promises as dns } from "dns";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
const OUTBOUND_FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2_000_000;
const DNS_CACHE_TTL_MS = 5 * 60_000;
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

const dnsResolutionCache = new Map<string, { expiresAt: number; addresses: string[] }>();

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

// Additional SSRF-safe URL validation for use with outbound fetch
async function parseAndValidateUrlAsync(urlRaw: unknown): Promise<string | null> {
  const basic = parseAndValidateUrl(urlRaw);
  if (!basic) return null;

  let parsed: URL;
  try {
    parsed = new URL(basic);
  } catch {
    return null;
  }

  // Enforce standard HTTP(S) ports only (no arbitrary high or sensitive ports)
  const port = parsed.port ? Number(parsed.port) : (parsed.protocol === "https:" ? 443 : 80);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return null;
  }
  if (port !== 80 && port !== 443) {
    return null;
  }

  const hostname = parsed.hostname;
  if (!hostname) return null;

  try {
    const now = Date.now();
    const cached = dnsResolutionCache.get(hostname);
    const addresses =
      cached && cached.expiresAt > now
        ? cached.addresses
        : (await dns.lookup(hostname, { all: true })).map((record) => record.address);

    if (!cached || cached.expiresAt <= now) {
      dnsResolutionCache.set(hostname, {
        expiresAt: now + DNS_CACHE_TTL_MS,
        addresses,
      });
    }

    const records = addresses;
    if (!records || records.length === 0) {
      return null;
    }

    for (const record of records) {
      if (isPrivateOrLoopbackAddress(record)) {
        return null;
      }
    }
  } catch {
    // If DNS resolution fails, treat as invalid to avoid SSRF
    return null;
  }

  return parsed.toString();
}

function isPrivateOrLoopbackAddress(address: string): boolean {
  // IPv6 loopback/unspecified/link-local/private
  if (address.includes(":")) {
    const lower = address.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (private)
    return false;
  }

  // IPv4 checks
  const octets = address.split(".").map((part) => Number(part));
  if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return true;
  }

  const [o1, o2] = octets;

  // 127.0.0.0/8 loopback
  if (o1 === 127) return true;
  // 10.0.0.0/8 private
  if (o1 === 10) return true;
  // 172.16.0.0/12 private
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
  // 192.168.0.0/16 private
  if (o1 === 192 && o2 === 168) return true;
  // 169.254.0.0/16 link-local
  if (o1 === 169 && o2 === 254) return true;
  // 0.0.0.0 unspecified
  if (octets.every((o) => o === 0)) return true;

  return false;
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

  const sourceUrl = await parseAndValidateUrlAsync(body.websiteUrl);
  if (!sourceUrl) {
    return NextResponse.json(
      { ok: false, error: "A valid website URL is required." },
      { status: 400, headers: rateLimit.headers },
    );
  }

  const focus = String(body.focus || "cross-platform brand growth").slice(0, 80).trim() || "cross-platform brand growth";
  const channels = normalizeChannels(body.channels);

  let html = "";
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), OUTBOUND_FETCH_TIMEOUT_MS);

    const response = await fetch(sourceUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "TradeHax-SocialAutopilot/1.0",
      },
    });
    if (!response.ok) {
      throw new Error(`Website fetch failed (${response.status})`);
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
      throw new Error("Website content is too large to process safely.");
    }

    html = await response.text();
    if (html.length > MAX_HTML_BYTES) {
      html = html.slice(0, MAX_HTML_BYTES);
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch website content.",
      },
      { status: 502, headers: rateLimit.headers },
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
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
