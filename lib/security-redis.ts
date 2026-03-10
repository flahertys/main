import { NextResponse } from "next/server";

type RedisRateLimitOptions = {
    keyPrefix: string;
    max: number;
    windowMs: number;
};

type RedisCounterResponse = {
    result?: number;
};

function getRequestIp(request: Request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const first = forwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }
    return request.headers.get("x-real-ip") ?? "unknown";
}

async function upstashIncr(key: string, ttlSeconds: number) {
    const redisUrl = process.env.REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        return null;
    }

    const [incrRes, expireRes] = await Promise.all([
        fetch(`${redisUrl}/incr/${encodeURIComponent(key)}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${redisToken}`,
            },
            cache: "no-store",
        }),
        fetch(`${redisUrl}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${redisToken}`,
            },
            cache: "no-store",
        }),
    ]);

    if (!incrRes.ok || !expireRes.ok) {
        return null;
    }

    const payload = (await incrRes.json()) as RedisCounterResponse;
    if (typeof payload.result !== "number") {
        return null;
    }

    return payload.result;
}

export async function enforceRedisRateLimit(
    request: Request,
    options: RedisRateLimitOptions,
) {
    // Hard switch requested by ops: allows emergency disable without deploy.
    if (process.env.ENABLE_RATE_LIMITING === "false") {
        return {
            allowed: true,
            headers: {
                "X-RateLimit-Limit": String(options.max),
                "X-RateLimit-Remaining": String(options.max),
            },
        };
    }

    const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
    const key = `${options.keyPrefix}:${getRequestIp(request)}`;

    try {
        const count = await upstashIncr(key, ttlSeconds);
        if (count == null) {
            return null;
        }

        if (count > options.max) {
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
                            "Retry-After": String(ttlSeconds),
                            "X-RateLimit-Limit": String(options.max),
                            "X-RateLimit-Remaining": "0",
                        },
                    },
                ),
            };
        }

        return {
            allowed: true,
            headers: {
                "X-RateLimit-Limit": String(options.max),
                "X-RateLimit-Remaining": String(Math.max(0, options.max - count)),
            },
        };
    } catch {
        return null;
    }
}
