import { expect, test, describe, mock, beforeEach } from "bun:test";
import { GeminiService } from "@/services/gemini.service";

const mockGenerateContent = mock();

mock.module("@google/genai", () => {
    return {
        GoogleGenAI: class MockGoogleGenAI {
            models = {
                generateContent: mockGenerateContent
            };
            constructor() { }
        }
    };
});

describe("GeminiService", () => {
    let service: GeminiService;

    beforeEach(() => {
        service = new GeminiService("fake-api-key");

        mockGenerateContent.mockClear();
    });

    test("should successfully return AI response text", async () => {
        mockGenerateContent.mockResolvedValue({ text: "สวัสดีค่ะ มีอะไรให้ส้มช่วยไหมคะ" });

        const result = await service.generateReply("สวัสดี");

        expect(result).toBe("สวัสดีค่ะ มีอะไรให้ส้มช่วยไหมคะ");
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);

        expect(mockGenerateContent).toHaveBeenCalledWith({
            model: 'gemini-2.5-flash',
            contents: "สวัสดี",
            config: expect.any(Object),
        });
    });

    test("should throw an error if AI returns empty response", async () => {
        mockGenerateContent.mockResolvedValue({ text: "" });

        expect(service.generateReply("สวัสดี")).rejects.toThrow("Gemini returned an empty response");
    });

    test("should throw an error if API request fails", async () => {
        mockGenerateContent.mockRejectedValue(new Error("API Network Error"));

        expect(service.generateReply("สวัสดี")).rejects.toThrow("API Network Error");
    });
});
