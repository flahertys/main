import { isIsoDateString, sanitizePlainText } from "@/lib/security";

describe("security utils", () => {
    test("sanitizePlainText removes control chars and angle brackets", () => {
        const value = "Hello\u0000 <b>world</b>\n";
        expect(sanitizePlainText(value, 100)).toBe("Hello bworld/b");
    });

    test("isIsoDateString accepts valid recent ISO timestamp", () => {
        const now = new Date().toISOString();
        expect(isIsoDateString(now)).toBe(true);
    });

    test("isIsoDateString rejects far-future date", () => {
        expect(isIsoDateString("2099-01-01T00:00:00.000Z")).toBe(false);
    });
});
