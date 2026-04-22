import { GoogleGenAI } from "@google/genai";
import { createHmac } from "node:crypto";

const LINE_ACCESS_TOKEN = Bun.env.LINE_ACCESS_TOKEN;
const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY;
const LINE_CHANNEL_SECRET = Bun.env.LINE_CHANNEL_SECRET;

// Validate Environment Variables
if (!LINE_ACCESS_TOKEN || !GEMINI_API_KEY || !LINE_CHANNEL_SECRET) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] CRITICAL: Missing required environment variables:`);

    if (!LINE_ACCESS_TOKEN) {
        console.error("- LINE_ACCESS_TOKEN");
    }
    if (!GEMINI_API_KEY) {
        console.error("- GEMINI_API_KEY");
    }
    if (!LINE_CHANNEL_SECRET) {
        console.error("- LINE_CHANNEL_SECRET");
    }

    process.exit(1);
}

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

function verifySignature(signature: string, body: string): boolean {
    const hmac = createHmac("sha256", LINE_CHANNEL_SECRET!);
    const calculatedSignature = hmac.update(body).digest("base64");
    return calculatedSignature === signature;
}

const server = Bun.serve({
    port: Bun.env.PORT || 3000,
    async fetch(req) {
        if (req.method === "POST") {
            const signature = req.headers.get("x-line-signature");
            if (!signature) {
                return new Response("Unauthorized", { status: 401 });
            }

            try {
                const rawBody = await req.text();

                if (!verifySignature(signature, rawBody)) {
                    console.warn(`[${new Date().toISOString()}] Warning: Invalid signature from ${req.headers.get("x-forwarded-for") || "unknown"}`);
                    return new Response("Unauthorized", { status: 401 });
                }

                const body = JSON.parse(rawBody) as LineWebhookRequest;
                const events = body.events || [];

                for (const event of events) {
                    if (event.type === "message" && event.message.type === "text") {
                        const userText = event.message.text;
                        const replyToken = event.replyToken;

                        try {
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

                            if (!aiResponse) {
                                throw new Error("Gemini returned an empty response");
                            }

                            const lineResponse = await fetch("https://api.line.me/v2/bot/message/reply", {
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

                            if (!lineResponse.ok) {
                                const errorData = await lineResponse.text();
                                throw new Error(`LINE API responded with ${lineResponse.status}: ${errorData}`);
                            }
                        } catch (error) {
                            const timestamp = new Date().toISOString();
                            console.error(`[${timestamp}] Error processing event:`, error instanceof Error ? error.message : error);

                            // Send error message back to user
                            try {
                                await fetch("https://api.line.me/v2/bot/message/reply", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`,
                                    },
                                    body: JSON.stringify({
                                        replyToken: replyToken,
                                        messages: [{
                                            type: "text",
                                            text: "ขออภัยนะคะ พอดีส้มขัดข้องนิดหน่อย รบกวนคุณลองพิมพ์ใหม่อีกครั้งได้ไหมคะ? 🙏"
                                        }],
                                    }),
                                });
                            } catch (replyError) {
                                console.error(`[${timestamp}] Failed to send error fallback to LINE:`, replyError);
                            }
                        }
                    }
                }
                return new Response("OK", { status: 200 });
            } catch (err) {
                console.error(`[${new Date().toISOString()}] Webhook Processing Error:`, err);
                return new Response("Internal Server Error", { status: 500 });
            }
        }
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`[${new Date().toISOString()}] Server running on port ${server.port}`);
