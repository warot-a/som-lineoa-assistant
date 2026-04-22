import { Elysia } from "elysia";
import type { LineWebhookRequest, LineEvent } from "../types";
import { GeminiService } from "../services/gemini.service";
import { LineService } from "../services/line.service";

export const webhookController = (lineService: LineService, geminiService: GeminiService) => {
    return new Elysia({ name: "webhook-controller" })
        .post("/", async ({ request, headers, set }) => {
            const signature = headers["x-line-signature"];

            if (!signature) {
                set.status = 401;
                return "Unauthorized";
            }

            try {
                // ต้องอ่าน raw text ก่อนเพื่อให้สามารถตรวจสอบ Signature ได้ถูกต้อง
                const rawBody = await request.text();

                if (!lineService.verifySignature(signature, rawBody)) {
                    console.warn(`[${new Date().toISOString()}] Warning: Invalid signature`);
                    set.status = 401;
                    return "Unauthorized";
                }

                const body = JSON.parse(rawBody) as LineWebhookRequest;
                const events = body.events || [];

                // Process events concurrently
                await Promise.all(events.map(async (event: LineEvent) => {
                    if (event.type !== "message" || event.message.type !== "text") {
                        return;
                    }

                    const userText = event.message.text.trim().toLowerCase();
                    const replyToken = event.replyToken;

                    // เพิ่มเงื่อนไขเช็คเวอร์ชัน (ใช้ Commit SHA 7 หลักแรก)
                    if (userText === "version" || userText === "/version") {
                        const sha = process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) || "development";
                        await lineService.replyMessage(replyToken, `Som Assistant Version: ${sha}`);
                        return;
                    }

                    try {
                        const aiResponse = await geminiService.generateReply(userText);
                        await lineService.replyMessage(replyToken, aiResponse);
                    } catch (error) {
                        console.error(`[${new Date().toISOString()}] Error processing event:`, error instanceof Error ? error.message : error);
                        await lineService.sendErrorFallback(replyToken);
                    }
                }));

                set.status = 200;
                return "OK";
            } catch (err) {
                console.error(`[${new Date().toISOString()}] Webhook Processing Error:`, err);
                set.status = 500;
                return "Internal Server Error";
            }
        });
};
