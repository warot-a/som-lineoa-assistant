/**
 * Build a Line Flex Message (Bubble) that presents a session summary.
 * Accepts the plain-text summary (bullet lines starting with "• ").
 */
export function buildSummaryFlexMessage(summaryText: string): object {
    // Split bullet lines; fall back to the raw text as a single body block
    const lines = summaryText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const bodyContents: object[] = lines.map((line) => ({
        type: "text",
        text: line,
        wrap: true,
        size: "sm",
        color: "#555555",
        margin: "sm",
    }));

    return {
        type: "flex",
        altText: "📋 สรุปบทสนทนา",
        contents: {
            type: "bubble",
            size: "mega",
            header: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "📋 สรุปบทสนทนา",
                        weight: "bold",
                        size: "lg",
                        color: "#FFFFFF",
                    },
                    {
                        type: "text",
                        text: "บทสนทนาของคุณในช่วงที่ผ่านมา",
                        size: "xs",
                        color: "#FFFFFFAA",
                        margin: "xs",
                    },
                ],
                backgroundColor: "#FF6B35",
                paddingAll: "16px",
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: bodyContents.length
                    ? bodyContents
                    : [
                          {
                              type: "text",
                              text: summaryText,
                              wrap: true,
                              size: "sm",
                              color: "#555555",
                          },
                      ],
                paddingAll: "16px",
                spacing: "xs",
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "เริ่มบทสนทนาใหม่ได้เลยนะคะ 😊",
                        size: "xs",
                        color: "#AAAAAA",
                        align: "center",
                    },
                ],
                paddingAll: "12px",
            },
            styles: {
                header: { separator: false },
                footer: { separator: true },
            },
        },
    };
}
