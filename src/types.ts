// ─── LINE Webhook Types ────────────────────────────────────────────────────────

export interface LineMessageEvent {
    type: "message";
    replyToken: string;
    source: {
        userId: string;
        type: string;
    };
    message: {
        type: string;
        text: string;
    };
}

export interface LinePostbackEvent {
    type: "postback";
    replyToken: string;
    source: {
        userId: string;
        type: string;
    };
    postback: {
        data: string;
    };
}

export type LineEvent = LineMessageEvent | LinePostbackEvent;

export interface LineWebhookRequest {
    events: LineEvent[];
}

// ─── Session / Chat Types ──────────────────────────────────────────────────────

export interface ChatMessage {
    role: "user" | "model";
    content: string;
    timestamp: Date;
}

export type SessionStatus = "active" | "archived";
