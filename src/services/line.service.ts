import { createHmac } from "node:crypto";

export class LineService {
    constructor(
        private readonly channelSecret: string,
        private readonly accessToken: string
    ) {}

    verifySignature(signature: string, body: string): boolean {
        const hmac = createHmac("sha256", this.channelSecret);
        const calculatedSignature = hmac.update(body).digest("base64");
        return calculatedSignature === signature;
    }

    async replyMessage(replyToken: string, text: string): Promise<void> {
        const response = await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.accessToken}`,
            },
            body: JSON.stringify({
                replyToken: replyToken,
                messages: [{ type: "text", text: text }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`LINE API responded with ${response.status}: ${errorData}`);
        }
    }

    async sendErrorFallback(replyToken: string): Promise<void> {
        try {
            await this.replyMessage(replyToken, "ขออภัยนะคะ พอดีส้มขัดข้องนิดหน่อย รบกวนคุณลองพิมพ์ใหม่อีกครั้งได้ไหมคะ? 🙏");
        } catch (error) {
            const timestamp = new Date().toISOString();
            console.error(`[${timestamp}] Failed to send error fallback to LINE:`, error);
        }
    }
}
