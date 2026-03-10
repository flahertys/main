import { generateCacheKey, resolveCacheTtl } from "@/lib/ai/response-cache";

describe("response cache", () => {
    test("generateCacheKey is deterministic", () => {
        const a = generateCacheKey({
            userId: "u1",
            userPrompt: "hello",
            sloProfile: "latency",
            preset: "default",
            freedomMode: "standard",
            objective: "qa",
        });

        const b = generateCacheKey({
            userId: "u1",
            userPrompt: "hello",
            sloProfile: "latency",
            preset: "default",
            freedomMode: "standard",
            objective: "qa",
        });

        expect(a).toBe(b);
    });

    test("resolveCacheTtl returns longer TTL for premium", () => {
        expect(resolveCacheTtl("premium")).toBeGreaterThan(resolveCacheTtl("free"));
    });
});
