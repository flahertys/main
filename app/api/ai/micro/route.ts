import { callAiMicroPredict } from "@/lib/ai/micro-client";
import { enforceRateLimit, enforceTrustedOrigin, isJsonContentType, sanitizePlainText } from "@/lib/security";
import { enforceRedisRateLimit } from "@/lib/security-redis";
import { NextRequest, NextResponse } from "next/server";

type MicroRequest = {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
};

export async function POST(request: NextRequest) {
    const internalToken = process.env.AI_MICRO_INTERNAL_TOKEN;
    if (internalToken) {
        const provided = request.headers.get("x-internal-service-token") ?? "";
        if (provided !== internalToken) {
            return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
        }
    }

    const originBlock = enforceTrustedOrigin(request);
    if (originBlock) return originBlock;

    if (!isJsonContentType(request)) {
        return NextResponse.json({ ok: false, error: "Expected JSON body." }, { status: 415 });
    }

    const redisRateLimit = await enforceRedisRateLimit(request, {
        keyPrefix: "ai:micro",
        max: 60,
        windowMs: 60_000,
    });
    const rateLimit =
        redisRateLimit ??
        enforceRateLimit(request, {
            keyPrefix: "ai:micro",
            max: 60,
            windowMs: 60_000,
        });

    if (!rateLimit.allowed) {
        return rateLimit.response;
    }

    const body = (await request.json()) as MicroRequest;
    const prompt = sanitizePlainText(String(body.prompt ?? ""), 4000);
    if (!prompt) {
        return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400, headers: rateLimit.headers });
    }

    const result = await callAiMicroPredict({
        prompt,
        modelId: body.model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        topP: body.topP,
    });

    if (!result || !result.text) {
        return NextResponse.json(
            {
                ok: false,
                error: "AI microservice unavailable",
            },
            { status: 503, headers: rateLimit.headers },
        );
    }

    return NextResponse.json(
        {
            ok: true,
            text: result.text,
            model: result.model,
        },
        { headers: rateLimit.headers },
    );
}
