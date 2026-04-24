const LINE_ACCESS_TOKEN = Bun.env.LINE_ACCESS_TOKEN;
const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY;
const LINE_CHANNEL_SECRET = Bun.env.LINE_CHANNEL_SECRET;
const MONGODB_URI = Bun.env.MONGODB_URI;

// Validate Environment Variables
const requiredEnvVars = {
    LINE_ACCESS_TOKEN,
    GEMINI_API_KEY,
    LINE_CHANNEL_SECRET,
    MONGODB_URI,
};

const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] CRITICAL: Missing required environment variables:`);
    missingVars.forEach((v) => console.error(`- ${v}`));
    process.exit(1);
}

export const config = {
    LINE_ACCESS_TOKEN: LINE_ACCESS_TOKEN!,
    GEMINI_API_KEY: GEMINI_API_KEY!,
    LINE_CHANNEL_SECRET: LINE_CHANNEL_SECRET!,
    MONGODB_URI: MONGODB_URI!,
    PORT: Bun.env.PORT || 3000,
    LINE_REPLY_URL: "https://api.line.me/v2/bot/message/reply",
    GEMINI_MODEL: "gemini-2.5-flash",
};
