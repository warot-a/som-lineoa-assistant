import type { LineEvent, LineWebhookRequest } from "../types";
import { GeminiService } from "../services/gemini.service";
import { LineService } from "../services/line.service";

export class WebhookController {
    constructor(
        private readonly lineService: LineService,
        private readonly geminiService: GeminiService
    ) { }

    async handleRequest(req: Request): Promise<Response> {
        if (req.method !== "POST") {
            return new Response("Not Found", { status: 404 });
        }

        const signature = req.headers.get("x-line-signature");
        if (!signature) {
            return new Response("Unauthorized", { status: 401 });
        }

        try {
            const rawBody = await req.text();

            if (!this.lineService.verifySignature(signature, rawBody)) {
                console.warn(`[${new Date().toISOString()}] Warning: Invalid signature from ${req.headers.get("x-forwarded-for") || "unknown"}`);
                return new Response("Unauthorized", { status: 401 });
            }

            const body = JSON.parse(rawBody) as LineWebhookRequest;
            const events = body.events || [];

            // Process events concurrently for better performance and to avoid nested try-catch.
            await Promise.all(events.map(event => this.processEvent(event)));

            return new Response("OK", { status: 200 });
        } catch (err) {
            console.error(`[${new Date().toISOString()}] Webhook Processing Error:`, err);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    private async processEvent(event: LineEvent): Promise<void> {
        if (event.type !== "message" || event.message.type !== "text") {
            return;
        }

        const userText = event.message.text;
        const replyToken = event.replyToken;

        try {
            const aiResponse = await this.geminiService.generateReply(userText);
            await this.lineService.replyMessage(replyToken, aiResponse);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error processing event:`, error instanceof Error ? error.message : error);
            await this.lineService.sendErrorFallback(replyToken);
        }
    }
}
