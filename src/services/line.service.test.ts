import { expect, test, describe, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { LineService } from "./line.service";
import { createHmac } from "node:crypto";

describe("LineService", () => {
    let service: LineService;
    const mockChannelSecret = "test-secret";
    const mockAccessToken = "test-token";

    beforeEach(() => {
        service = new LineService(mockChannelSecret, mockAccessToken);
    });

    describe("verifySignature", () => {
        test("should return true for valid signature", () => {
            const body = JSON.stringify({ events: [] });
            
            // Create a valid mock signature
            const expectedSignature = createHmac("sha256", mockChannelSecret)
                .update(body)
                .digest("base64");

            expect(service.verifySignature(expectedSignature, body)).toBe(true);
        });

        test("should return false for invalid signature", () => {
            const body = JSON.stringify({ events: [] });
            expect(service.verifySignature("invalid-signature-1234", body)).toBe(false);
        });
    });

    describe("replyMessage", () => {
        let globalFetchBackup: typeof globalThis.fetch;

        beforeEach(() => {
            // Backup the original fetch function
            globalFetchBackup = globalThis.fetch;
        });

        afterEach(() => {
            // Restore fetch function after each test
            globalThis.fetch = globalFetchBackup;
        });

        test("should successfully send reply message", async () => {
            // Mock fetch success (200 OK)
            const mockFetch = mock().mockResolvedValue(new Response("{}", { status: 200 }));
            globalThis.fetch = mockFetch as unknown as typeof fetch;

            await service.replyMessage("token-123", "Hello World");

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith("https://api.line.me/v2/bot/message/reply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mockAccessToken}`,
                },
                body: JSON.stringify({
                    replyToken: "token-123",
                    messages: [{ type: "text", text: "Hello World" }],
                }),
            });
        });

        test("should throw an error when API responds with non-ok status", async () => {
            // Mock fetch failure (400 Bad Request)
            const mockFetch = mock().mockResolvedValue(new Response("Bad Request Payload", { status: 400 }));
            globalThis.fetch = mockFetch as unknown as typeof fetch;

            expect(service.replyMessage("token-123", "Hello World")).rejects.toThrow("LINE API responded with 400: Bad Request Payload");
        });
    });

    describe("sendErrorFallback", () => {
        test("should send error fallback message without throwing", async () => {
            // Spy on replyMessage method instead of mocking fetch
            const replySpy = spyOn(service, "replyMessage").mockResolvedValue();

            await service.sendErrorFallback("token-456");

            expect(replySpy).toHaveBeenCalledTimes(1);
            expect(replySpy).toHaveBeenCalledWith("token-456", "ขออภัยนะคะ พอดีส้มขัดข้องนิดหน่อย รบกวนคุณลองพิมพ์ใหม่อีกครั้งได้ไหมคะ? 🙏");
        });

        test("should catch error and log to console if replyMessage fails", async () => {
            // Mock replyMessage failure
            const replySpy = spyOn(service, "replyMessage").mockRejectedValue(new Error("Network Timeout"));
            
            // Catch console.error to prevent it from logging to the terminal during tests
            const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

            // This function should not throw (it has an internal try-catch)
            await service.sendErrorFallback("token-456");

            expect(replySpy).toHaveBeenCalledTimes(1);
            expect(consoleSpy).toHaveBeenCalledTimes(1);
            expect(consoleSpy.mock.calls[0]![1]).toBeInstanceOf(Error);
            expect((consoleSpy.mock.calls[0]![1] as Error).message).toBe("Network Timeout");

            // Restore console.error
            consoleSpy.mockRestore();
        });
    });
});
