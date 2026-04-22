import { GoogleGenAI } from "@google/genai";

export class GeminiService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    async generateReply(userText: string): Promise<string> {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userText,
            config: {
                systemInstruction: "คุณเป็นผู้ช่วยผู้หญิงที่สุภาพและเป็นกันเอง ให้ลงท้ายประโยคด้วย 'ค่ะ' หรือ 'คะ' และแทนตัวเองว่า 'ส้ม' หรือ 'หนู' ตามความเหมาะสม",
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        const aiResponse = response.text;
        if (!aiResponse) {
            throw new Error("Gemini returned an empty response");
        }

        return aiResponse;
    }
}
