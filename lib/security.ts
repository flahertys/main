import { NextResponse } from "next/server";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  max: number;
  windowMs: number;
  keyPrefix: string;
};

const DEFAULT_API_RATE_LIMIT: RateLimitOptions = {
  max: 60,
  windowMs: 60_000,
  keyPrefix: "api",
};

const rateLimitStore = (() => {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_RATE_LIMIT__?: Map<string, RateLimitRecord>;
  };
  if (!globalRef.__TRADEHAX_RATE_LIMIT__) {
    globalRef.__TRADEHAX_RATE_LIMIT__ = new Map<string, RateLimitRecord>();
  }
  return globalRef.__TRADEHAX_RATE_LIMIT__;
})();

function cleanupRateLimitStore(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function enforceRateLimit(
  request: Request,
  options: Partial<RateLimitOptions> = {},
) {
  const config: RateLimitOptions = {
    ...DEFAULT_API_RATE_LIMIT,
    ...options,
  };

  const now = Date.now();
  cleanupRateLimitStore(now);

  const key = `${config.keyPrefix}:${getRequestIp(request)}`;
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      headers: {
        "X-RateLimit-Limit": String(config.max),
        "X-RateLimit-Remaining": String(Math.max(0, config.max - 1)),
      },
    };
  }

  if (record.count >= config.max) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "Too many requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.resetAt - now) / 1_000)),
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    };
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    headers: {
      "X-RateLimit-Limit": String(config.max),
      "X-RateLimit-Remaining": String(Math.max(0, config.max - record.count)),
    },
  };
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function getTrustedOrigins(request: Request) {
  const requestOrigin = normalizeOrigin(request.url);
  const configured = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL_ALT,
    process.env.NEXTAUTH_URL,
  ]
    .filter(Boolean)
    .map((value) => normalizeOrigin(value as string))
    .filter(Boolean);

  return new Set([requestOrigin, ...configured]);
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin ?? referer;

  if (!candidate) {
    return true;
  }

  const normalized = normalizeOrigin(candidate);
  if (!normalized) {
    return false;
  }

  return getTrustedOrigins(request).has(normalized);
}

export function enforceTrustedOrigin(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Untrusted request origin.",
      },
      { status: 403 },
    );
  }
  return null;
}

export function isJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().includes("application/json");
}

export function sanitizePlainText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function isFiniteNumberInRange(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function isIsoDateString(value: unknown) {
  if (typeof value !== "string" || value.length > 64) {
    return false;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;

  const now = Date.now();
  const maxFutureSkewMs = 5 * 60_000;
  const maxPastWindowMs = 45 * 24 * 60 * 60_000;
  return parsed <= now + maxFutureSkewMs && parsed >= now - maxPastWindowMs;
}
