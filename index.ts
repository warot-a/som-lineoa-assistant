import { GoogleGenAI } from "@google/genai";

const LINE_ACCESS_TOKEN = Bun.env.LINE_ACCESS_TOKEN || "";
const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY || "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface LineEvent {
    type: string;
    replyToken: string;
    message: {
        type: string;
        text: string;
    };
}

interface LineWebhookRequest {
    events: LineEvent[];
}

const server = Bun.serve({
    port: process.env.PORT || 3000,
    async fetch(req) {
        if (req.method === "POST") {
            try {
                const body = (await req.json()) as LineWebhookRequest;
                const events = body.events || [];

                for (const event of events) {
                    if (event.type === "message" && event.message.type === "text") {
                        const userText = event.message.text;
                        const replyToken = event.replyToken;

                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: userText,
                            config: {
                                systemInstruction: "คุณเป็นผู้ช่วยผู้หญิงที่สุภาพและเป็นกันเอง ให้ลงท้ายประโยคด้วย 'ค่ะ' หรือ 'คะ' และแทนตัวเองว่า 'ส้ม' หรือ 'หนู' ตามความเหมาะสม",
                                maxOutputTokens: 1000,
                                temperature: 0.7,
                            },
                        });
                        const aiResponse = response.text;

                        await fetch("https://api.line.me/v2/bot/message/reply", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
                            },
                            body: JSON.stringify({
                                replyToken: replyToken,
                                messages: [{ type: "text", text: aiResponse }],
                            }),
                        });
                    }
                }
                return new Response("OK", { status: 200 });
            } catch (err) {
                console.error("Error processing webhook:", err);
                return new Response("Internal Server Error", { status: 500 });
            }
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Server running on port ${server.port}`);
