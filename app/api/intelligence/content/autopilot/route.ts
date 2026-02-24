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

type DraftStatus = "draft" | "pending_approval" | "approved" | "published";
type QueueStatus = "queued" | "running" | "done" | "failed";

type AutopilotDraft = {
  id: string;
  sourceUrl: string;
  focus: string;
  channels: SocialChannel[];
  content: Record<string, unknown>;
  status: DraftStatus;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  performance: {
    impressions: number;
    engagements: number;
    clicks: number;
    lastUpdatedAt?: string;
  };
};

type QueueJob = {
  id: string;
  draftId: string;
  channel: SocialChannel;
  runAt: string;
  status: QueueStatus;
  attempts: number;
  lastError?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
};

type AutopilotStore = {
  drafts: Map<string, AutopilotDraft>;
  queue: Map<string, QueueJob>;
};

declare global {
   
  var __TRADEHAX_SOCIAL_AUTOPILOT_STORE__: AutopilotStore | undefined;
}

function getStore(): AutopilotStore {
  if (!globalThis.__TRADEHAX_SOCIAL_AUTOPILOT_STORE__) {
    globalThis.__TRADEHAX_SOCIAL_AUTOPILOT_STORE__ = {
      drafts: new Map(),
      queue: new Map(),
    };
  }
  return globalThis.__TRADEHAX_SOCIAL_AUTOPILOT_STORE__;
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

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
  if (!Array.isArray(input)) return ["youtube", "discord", "x", "linkedin"];
  const valid = input
    .map((item) => String(item).toLowerCase())
    .filter((item): item is SocialChannel => ALLOWED_CHANNELS.has(item as SocialChannel));
  return valid.length ? Array.from(new Set(valid)).slice(0, 8) : ["youtube", "discord", "x", "linkedin"];
}

function parseRunAt(input?: string) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function publishDiscord(payload: string) {
  const webhook =
    String(process.env.TRADEHAX_DISCORD_WEBHOOK || "").trim() ||
    String(process.env.TRADEHAX_DISCORD_SIGNAL_WEBHOOK || "").trim();
  if (!webhook) {
    return { ok: false, reason: "Discord webhook not configured" };
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: payload.slice(0, 1900) }),
  });

  return response.ok
    ? { ok: true, reason: "discord_webhook_ok" }
    : { ok: false, reason: `discord_webhook_failed_${response.status}` };
}

async function publishTelegram(payload: string) {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID || "").trim();
  if (!token || !chatId) {
    return { ok: false, reason: "Telegram bot token/chat id not configured" };
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: payload.slice(0, 3900),
      disable_web_page_preview: false,
    }),
  });

  return response.ok
    ? { ok: true, reason: "telegram_send_ok" }
    : { ok: false, reason: `telegram_send_failed_${response.status}` };
}

async function publishChannel(channel: SocialChannel, payload: string) {
  if (channel === "discord") return publishDiscord(payload);
  if (channel === "telegram") return publishTelegram(payload);

  const envMap: Record<SocialChannel, string> = {
    youtube: "YOUTUBE_API_KEY",
    discord: "TRADEHAX_DISCORD_WEBHOOK",
    x: "X_API_KEY",
    linkedin: "LINKEDIN_CLIENT_ID",
    instagram: "INSTAGRAM_ACCESS_TOKEN",
    facebook: "FACEBOOK_PAGE_ACCESS_TOKEN",
    telegram: "TELEGRAM_BOT_TOKEN",
    tiktok: "TIKTOK_ACCESS_TOKEN",
  };

  const configured = Boolean(String(process.env[envMap[channel]] || "").trim());
  return configured
    ? { ok: true, reason: `connector_placeholder_${channel}_configured` }
    : { ok: false, reason: `connector_placeholder_${channel}_missing_credentials` };
}

function channelPayloadFromDraft(draft: AutopilotDraft, channel: SocialChannel) {
  const raw = draft.content?.[channel];
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" | ") : String(v)}`)
      .join("\n");
  }
  return `${draft.focus} update from ${draft.sourceUrl}`;
}

async function runDueQueueJobs(store: AutopilotStore) {
  const now = Date.now();
  const jobs = Array.from(store.queue.values()).filter(
    (job) => job.status === "queued" && new Date(job.runAt).getTime() <= now,
  );

  const results: Array<{ jobId: string; ok: boolean; reason: string }> = [];

  for (const job of jobs) {
    const draft = store.drafts.get(job.draftId);
    if (!draft) {
      job.status = "failed";
      job.lastError = "Draft not found";
      job.updatedAt = nowIso();
      store.queue.set(job.id, job);
      results.push({ jobId: job.id, ok: false, reason: "draft_not_found" });
      continue;
    }

    job.status = "running";
    job.attempts += 1;
    job.updatedAt = nowIso();
    store.queue.set(job.id, job);

    const payload = channelPayloadFromDraft(draft, job.channel);
    try {
      const publishResult = await publishChannel(job.channel, payload);
      if (publishResult.ok) {
        job.status = "done";
        job.result = publishResult.reason;
        job.lastError = undefined;
      } else {
        job.status = "failed";
        job.lastError = publishResult.reason;
      }
      job.updatedAt = nowIso();
      store.queue.set(job.id, job);

      if (publishResult.ok) {
        draft.status = "published";
        draft.updatedAt = nowIso();
        store.drafts.set(draft.id, draft);
      }

      results.push({ jobId: job.id, ok: publishResult.ok, reason: publishResult.reason });
    } catch (error) {
      job.status = "failed";
      job.lastError = error instanceof Error ? error.message : "publish_failed";
      job.updatedAt = nowIso();
      store.queue.set(job.id, job);
      results.push({ jobId: job.id, ok: false, reason: job.lastError });
    }
  }

  return results;
}

function connectorStatus() {
  const get = (key: string) => Boolean(String(process.env[key] || "").trim());
  return {
    youtube: get("YOUTUBE_API_KEY"),
    discord: get("TRADEHAX_DISCORD_WEBHOOK") || get("TRADEHAX_DISCORD_SIGNAL_WEBHOOK"),
    x: get("X_API_KEY"),
    linkedin: get("LINKEDIN_CLIENT_ID"),
    instagram: get("INSTAGRAM_ACCESS_TOKEN"),
    facebook: get("FACEBOOK_PAGE_ACCESS_TOKEN"),
    telegram: get("TELEGRAM_BOT_TOKEN") && get("TELEGRAM_CHAT_ID"),
    tiktok: get("TIKTOK_ACCESS_TOKEN"),
  };
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:content:autopilot:get",
    max: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const store = getStore();
  await runDueQueueJobs(store);

  const drafts = Array.from(store.drafts.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const queue = Array.from(store.queue.values()).sort(
    (a, b) => new Date(a.runAt).getTime() - new Date(b.runAt).getTime(),
  );

  const calendar = drafts
    .filter((d) => Boolean(d.scheduledAt))
    .map((d) => ({
      draftId: d.id,
      runAt: d.scheduledAt,
      status: d.status,
      focus: d.focus,
      channels: d.channels,
      performance: d.performance,
    }));

  return NextResponse.json(
    {
      ok: true,
      connectors: connectorStatus(),
      drafts,
      queue,
      calendar,
    },
    { headers: rateLimit.headers },
  );
}

export async function POST(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) return originBlock;

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "intelligence:content:autopilot:post",
    max: 45,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimit.response;

  const store = getStore();
  const body = (await request.json()) as {
    action?: string;
    draftId?: string;
    sourceUrl?: string;
    focus?: string;
    channels?: unknown;
    content?: Record<string, unknown>;
    runAt?: string;
    metrics?: { impressions?: number; engagements?: number; clicks?: number };
  };

  const action = String(body.action || "").trim();

  if (action === "create_draft") {
    const sourceUrl = String(body.sourceUrl || "").trim();
    const focus = String(body.focus || "cross-platform growth").slice(0, 120).trim();
    const content = body.content && typeof body.content === "object" ? body.content : {};
    const channels = normalizeChannels(body.channels);

    if (!sourceUrl) {
      return NextResponse.json({ ok: false, error: "sourceUrl is required" }, { status: 400, headers: rateLimit.headers });
    }

    const id = newId("draft");
    const draft: AutopilotDraft = {
      id,
      sourceUrl,
      focus,
      channels,
      content,
      status: "draft",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      performance: { impressions: 0, engagements: 0, clicks: 0 },
    };
    store.drafts.set(id, draft);
    return NextResponse.json({ ok: true, draft }, { headers: rateLimit.headers });
  }

  if (action === "submit_for_approval" || action === "approve_draft" || action === "publish_now" || action === "schedule_draft" || action === "update_performance") {
    const draftId = String(body.draftId || "").trim();
    const draft = store.drafts.get(draftId);
    if (!draft) {
      return NextResponse.json({ ok: false, error: "Draft not found" }, { status: 404, headers: rateLimit.headers });
    }

    if (action === "submit_for_approval") {
      draft.status = "pending_approval";
      draft.updatedAt = nowIso();
      store.drafts.set(draft.id, draft);
      return NextResponse.json({ ok: true, draft }, { headers: rateLimit.headers });
    }

    if (action === "approve_draft") {
      draft.status = "approved";
      draft.updatedAt = nowIso();
      store.drafts.set(draft.id, draft);
      return NextResponse.json({ ok: true, draft }, { headers: rateLimit.headers });
    }

    if (action === "schedule_draft") {
      const runAt = parseRunAt(body.runAt);
      if (!runAt) {
        return NextResponse.json({ ok: false, error: "runAt must be a valid datetime" }, { status: 400, headers: rateLimit.headers });
      }

      const channels = normalizeChannels(body.channels ?? draft.channels);
      draft.scheduledAt = runAt;
      draft.updatedAt = nowIso();
      store.drafts.set(draft.id, draft);

      const createdJobs: QueueJob[] = [];
      for (const channel of channels) {
        const job: QueueJob = {
          id: newId("job"),
          draftId: draft.id,
          channel,
          runAt,
          status: "queued",
          attempts: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        store.queue.set(job.id, job);
        createdJobs.push(job);
      }

      return NextResponse.json({ ok: true, draft, jobs: createdJobs }, { headers: rateLimit.headers });
    }

    if (action === "publish_now") {
      const channels = normalizeChannels(body.channels ?? draft.channels);
      const jobRunAt = nowIso();
      for (const channel of channels) {
        const job: QueueJob = {
          id: newId("job"),
          draftId: draft.id,
          channel,
          runAt: jobRunAt,
          status: "queued",
          attempts: 0,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        store.queue.set(job.id, job);
      }

      const results = await runDueQueueJobs(store);
      const updatedDraft = store.drafts.get(draft.id);
      return NextResponse.json({ ok: true, draft: updatedDraft, results }, { headers: rateLimit.headers });
    }

    if (action === "update_performance") {
      const impressions = Math.max(0, Number(body.metrics?.impressions || draft.performance.impressions || 0));
      const engagements = Math.max(0, Number(body.metrics?.engagements || draft.performance.engagements || 0));
      const clicks = Math.max(0, Number(body.metrics?.clicks || draft.performance.clicks || 0));
      draft.performance = {
        impressions,
        engagements,
        clicks,
        lastUpdatedAt: nowIso(),
      };
      draft.updatedAt = nowIso();
      store.drafts.set(draft.id, draft);
      return NextResponse.json({ ok: true, draft }, { headers: rateLimit.headers });
    }
  }

  if (action === "run_due_jobs") {
    const results = await runDueQueueJobs(store);
    return NextResponse.json({ ok: true, results }, { headers: rateLimit.headers });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400, headers: rateLimit.headers });
}
