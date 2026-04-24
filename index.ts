import { Elysia } from "elysia";
import { config } from "./src/config";
import { connectDB } from "./src/db/mongodb";
import { GeminiService } from "./src/services/gemini.service";
import { LineService } from "./src/services/line.service";
import { SessionService } from "./src/services/session.service";
import { webhookController } from "./src/controllers/webhook.controller";

// ─── Connect to MongoDB before accepting traffic ───────────────────────────────
await connectDB(config.MONGODB_URI);

// ─── Services ──────────────────────────────────────────────────────────────────
const geminiService = new GeminiService(config.GEMINI_API_KEY);
const lineService = new LineService(config.LINE_CHANNEL_SECRET, config.LINE_ACCESS_TOKEN);
const sessionService = new SessionService();

// ─── App ───────────────────────────────────────────────────────────────────────
const app = new Elysia()
    .use(webhookController(lineService, geminiService, sessionService))
    .listen(config.PORT);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
