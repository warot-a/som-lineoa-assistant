import { Elysia } from "elysia";
import type { LineWebhookRequest, LineEvent } from "../types";
import { GeminiService } from "../services/gemini.service";
import { LineService } from "../services/line.service";
import { SessionService } from "../services/session.service";
import { buildSummaryFlexMessage } from "../utils/flexMessage";

// ─── Postback Action Constants ─────────────────────────────────────────────────
const POSTBACK_RESET = "action=reset";

export const webhookController = (
    lineService: LineService,
    geminiService: GeminiService,
    sessionService: SessionService
) => {
    return new Elysia({ name: "webhook-controller" }).post(
        "/",
        async ({ request, headers, set }) => {
            const signature = headers["x-line-signature"];

            if (!signature) {
                set.status = 401;
                return "Unauthorized";
            }

            try {
                // Read raw text first so we can verify the HMAC signature
                const rawBody = await request.text();

                if (!lineService.verifySignature(signature, rawBody)) {
                    console.warn(
                        `[${new Date().toISOString()}] Warning: Invalid signature`
                    );
                    set.status = 401;
                    return "Unauthorized";
                }

                const body = JSON.parse(rawBody) as LineWebhookRequest;
                const events = body.events || [];

                // Process all events concurrently
                await Promise.all(
                    events.map(async (event: LineEvent) => {
                        // ── Postback Event (e.g. Rich Menu button "เริ่มเรื่องใหม่") ──
                        if (event.type === "postback") {
                            if (event.postback.data === POSTBACK_RESET) {
                                await handleReset(
                                    event.source.userId,
                                    event.replyToken,
                                    lineService,
                                    geminiService,
                                    sessionService
                                );
                            }
                            return;
                        }

                        // ── Text Message Event ────────────────────────────────────
                        if (event.type !== "message" || event.message.type !== "text") {
                            return;
                        }

                        const userId = event.source.userId;
                        const userText = event.message.text.trim();
                        const replyToken = event.replyToken;

                        // Special: version command
                        if (
                            userText.toLowerCase() === "version" ||
                            userText.toLowerCase() === "/version"
                        ) {
                            const sha =
                                process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) ||
                                "development";
                            await lineService.replyMessage(
                                replyToken,
                                `Som Assistant Version: ${sha}`
                            );
                            return;
                        }

                        try {
                            await handleTextMessage(
                                userId,
                                userText,
                                replyToken,
                                lineService,
                                geminiService,
                                sessionService
                            );
                        } catch (error) {
                            console.error(
                                `[${new Date().toISOString()}] Error processing event:`,
                                error instanceof Error ? error.message : error
                            );
                            await lineService.sendErrorFallback(replyToken);
                        }
                    })
                );

                set.status = 200;
                return "OK";
            } catch (err) {
                console.error(
                    `[${new Date().toISOString()}] Webhook Processing Error:`,
                    err
                );
                set.status = 500;
                return "Internal Server Error";
            }
        }
    );
};

// ─── Handler: Text Message ─────────────────────────────────────────────────────

async function handleTextMessage(
    userId: string,
    userText: string,
    replyToken: string,
    lineService: LineService,
    geminiService: GeminiService,
    sessionService: SessionService
): Promise<void> {
    // 1. Get or create session (handles time-based expiry internally)
    const session = await sessionService.getOrCreateSession(userId);

    // 2. Ask Gemini with the full history for context
    const aiResponse = await geminiService.getGeminiResponse(
        session.messages,
        userText
    );

    // 3. Persist both turns to DB
    await sessionService.appendMessages(session.sessionId, userText, aiResponse);

    // 4. Reply to user
    await lineService.replyMessage(replyToken, aiResponse);
}

// ─── Handler: Manual Reset ("เริ่มเรื่องใหม่") ────────────────────────────────

async function handleReset(
    userId: string,
    replyToken: string,
    lineService: LineService,
    geminiService: GeminiService,
    sessionService: SessionService
): Promise<void> {
    // 1. Fetch the current active session
    const session = await sessionService.getActiveSession(userId);

    if (!session || session.messages.length === 0) {
        // No conversation to summarise
        await lineService.replyMessage(
            replyToken,
            "ยังไม่มีบทสนทนาที่ต้องสรุปนะคะ พิมพ์ข้อความได้เลยค่ะ 😊"
        );
        return;
    }

    // 2. Ask Gemini to summarise the session
    const summaryText = await geminiService.summariseSession(session.messages);

    // 3. Archive session + store summary
    await sessionService.archiveWithSummary(session.sessionId, summaryText);

    // 4. Build and send a Flex Message with the summary
    const flexMessage = buildSummaryFlexMessage(summaryText);
    await lineService.replyFlexMessage(replyToken, flexMessage);
}
