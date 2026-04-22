import { Elysia } from "elysia";
import { config } from "./src/config";
import { GeminiService } from "./src/services/gemini.service";
import { LineService } from "./src/services/line.service";
import { webhookController } from "./src/controllers/webhook.controller";

const geminiService = new GeminiService(config.GEMINI_API_KEY);
const lineService = new LineService(config.LINE_CHANNEL_SECRET, config.LINE_ACCESS_TOKEN);

const app = new Elysia()
    .use(webhookController(lineService, geminiService))
    .listen(config.PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
