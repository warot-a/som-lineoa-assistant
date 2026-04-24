import { GoogleGenAI } from "@google/genai";
import { config } from "../config";
import type { ChatMessage } from "../types";

const SYSTEM_INSTRUCTION =
    "คุณเป็นผู้ช่วยผู้หญิงที่สุภาพและเป็นกันเอง ให้ลงท้ายประโยคด้วย 'ค่ะ' หรือ 'คะ' และแทนตัวเองว่า 'ส้ม' หรือ 'หนู' ตามความเหมาะสม";


/**
 * Convert our internal ChatMessage format to the Gemini API `contents` format.
 * The SDK expects an array of { role: "user"|"model", parts: [{ text: string }] }
 */
function toGeminiContents(
    history: ChatMessage[],
    newUserMessage: string
): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    contents.push({ role: "user", parts: [{ text: newUserMessage }] });

    return contents;
}

export class GeminiService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * Generate a reply given the full conversation history and a new user message.
     * History is passed so Gemini maintains context across turns.
     */
    async getGeminiResponse(
        history: ChatMessage[],
        newMessage: string
    ): Promise<string> {
        const contents = toGeminiContents(history, newMessage);

        const response = await this.ai.models.generateContent({
            model: config.GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
            },
        });

        const aiResponse = response.text;
        if (!aiResponse) {
            throw new Error("Gemini returned an empty response");
        }

        return aiResponse;
    }

    /**
     * Summarise a session's chat history in Thai, formatted for a Line Flex Message.
     * Returns a concise bullet-point summary string.
     */
    async summariseSession(history: ChatMessage[]): Promise<string> {
        if (history.length === 0) {
            return "ไม่มีบทสนทนาที่ต้องสรุปค่ะ";
        }

        const transcript = history
            .map(
                (m) =>
                    `${m.role === "user" ? "ผู้ใช้" : "ส้ม"}: ${m.content}`
            )
            .join("\n");

        const prompt =
            `สรุปบทสนทนาต่อไปนี้เป็นภาษาไทย โดยใช้หัวข้อย่อยสั้น ๆ ไม่เกิน 5 ข้อ ` +
            `แต่ละข้อขึ้นต้นด้วย "• " และอยู่ในบรรทัดใหม่ ห้ามใส่ markdown อื่น:\n\n${transcript}`;

        const response = await this.ai.models.generateContent({
            model: config.GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { temperature: 0.3 },
        });

        const summary = response.text;
        if (!summary) {
            throw new Error("Gemini returned an empty summary");
        }

        return summary.trim();
    }

    // ─── Legacy single-turn method (kept for /version command etc.) ────────────
    async generateReply(userText: string): Promise<string> {
        return this.getGeminiResponse([], userText);
    }
}
