type AiMicroPredictResponse = {
    ok?: boolean;
    model?: string;
    data?: unknown;
    error?: string;
};

export function extractGeneratedText(payload: unknown): string {
    if (typeof payload === "string") {
        return payload.trim();
    }

    if (Array.isArray(payload) && payload.length > 0) {
        const first = payload[0] as Record<string, unknown>;
        if (first && typeof first.generated_text === "string") {
            return first.generated_text.trim();
        }
        if (first && typeof first.summary_text === "string") {
            return first.summary_text.trim();
        }
    }

    if (payload && typeof payload === "object") {
        const record = payload as Record<string, unknown>;
        if (typeof record.generated_text === "string") {
            return record.generated_text.trim();
        }
        if (typeof record.summary_text === "string") {
            return record.summary_text.trim();
        }
        if (typeof record.text === "string") {
            return record.text.trim();
        }
    }

    return "";
}

export async function callAiMicroPredict(args: {
    prompt: string;
    modelId?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}) {
    const baseUrl = process.env.AI_MICRO_BASE_URL?.trim();
    if (!baseUrl) {
        return null;
    }

    const timeoutMs = Number(process.env.AI_MICRO_TIMEOUT_MS || 8000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 8000);

    try {
        const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
        const response = await fetch(`${normalizedBaseUrl}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: args.prompt,
                model: args.modelId,
                temperature: args.temperature,
                maxTokens: args.maxTokens,
                topP: args.topP,
            }),
            cache: "no-store",
            signal: controller.signal,
        });

        const body = (await response.json().catch(() => ({}))) as AiMicroPredictResponse;
        if (!response.ok || !body.ok) {
            return null;
        }

        return {
            model: body.model,
            text: extractGeneratedText(body.data),
        };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
