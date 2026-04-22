import { config } from "./src/config";
import { GeminiService } from "./src/services/gemini.service";
import { LineService } from "./src/services/line.service";
import { WebhookController } from "./src/controllers/webhook.controller";

// 1. Dependency Initialization
const geminiService = new GeminiService(config.GEMINI_API_KEY);
const lineService = new LineService(config.LINE_CHANNEL_SECRET, config.LINE_ACCESS_TOKEN);

// 2. Dependency Injection
const webhookController = new WebhookController(lineService, geminiService);

// 3. Server Setup
const server = Bun.serve({
    port: config.PORT,
    async fetch(req) {
        return webhookController.handleRequest(req);
    },
});

console.log(`[${new Date().toISOString()}] Server running on port ${server.port}`);
