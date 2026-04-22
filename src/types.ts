export interface LineEvent {
    type: string;
    replyToken: string;
    message: {
        type: string;
        text: string;
    };
}

export interface LineWebhookRequest {
    events: LineEvent[];
}
