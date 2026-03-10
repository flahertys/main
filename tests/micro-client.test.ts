import { extractGeneratedText } from "@/lib/ai/micro-client";

describe("ai micro client", () => {
    test("extractGeneratedText supports HF array payload", () => {
        const text = extractGeneratedText([{ generated_text: "hello world" }]);
        expect(text).toBe("hello world");
    });

    test("extractGeneratedText supports summary_text object", () => {
        const text = extractGeneratedText({ summary_text: "brief summary" });
        expect(text).toBe("brief summary");
    });

    test("extractGeneratedText supports text object", () => {
        const text = extractGeneratedText({ text: "plain output" });
        expect(text).toBe("plain output");
    });
});
