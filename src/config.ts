const LINE_ACCESS_TOKEN = Bun.env.LINE_ACCESS_TOKEN;
const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY;
const LINE_CHANNEL_SECRET = Bun.env.LINE_CHANNEL_SECRET;

// Validate Environment Variables
if (!LINE_ACCESS_TOKEN || !GEMINI_API_KEY || !LINE_CHANNEL_SECRET) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] CRITICAL: Missing required environment variables:`);

    if (!LINE_ACCESS_TOKEN) {console.error("- LINE_ACCESS_TOKEN");}
    if (!GEMINI_API_KEY) {console.error("- GEMINI_API_KEY");}
    if (!LINE_CHANNEL_SECRET) {console.error("- LINE_CHANNEL_SECRET");}

    process.exit(1);
}

export const config = {
    LINE_ACCESS_TOKEN,
    GEMINI_API_KEY,
    LINE_CHANNEL_SECRET,
    PORT: Bun.env.PORT || 3000,
};
