import { randomUUID } from "node:crypto";
import { SessionModel, type ISession } from "../models/session.model";
import type { ChatMessage } from "../types";

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export class SessionService {
    /**
     * Get or create an active session for a given userId.
     * - If no active session exists → create a new one.
     * - If an active session exists but lastActivity > 1 hr → archive it and create a new one.
     * - If an active session exists and within TTL → return it as-is.
     */
    async getOrCreateSession(userId: string): Promise<ISession> {
        const now = new Date();

        const existingSession = await SessionModel.findOne({
            userId,
            status: "active",
        }).sort({ lastActivity: -1 });

        if (!existingSession) {
            return this.createNewSession(userId);
        }

        const elapsed = now.getTime() - existingSession.lastActivity.getTime();
        if (elapsed > SESSION_TTL_MS) {
            // Expire the old session and start fresh
            await this.archiveSession(existingSession.sessionId);
            return this.createNewSession(userId);
        }

        return existingSession;
    }

    /** Create a brand-new session */
    async createNewSession(userId: string): Promise<ISession> {
        const session = new SessionModel({
            sessionId: randomUUID(),
            userId,
            status: "active",
            messages: [],
            summary: null,
            lastActivity: new Date(),
        });
        await session.save();
        return session;
    }

    /**
     * Append a user message and the model response to the session,
     * and update lastActivity timestamp.
     */
    async appendMessages(
        sessionId: string,
        userMessage: string,
        modelReply: string
    ): Promise<void> {
        const now = new Date();
        const newMessages: ChatMessage[] = [
            { role: "user", content: userMessage, timestamp: now },
            { role: "model", content: modelReply, timestamp: now },
        ];

        await SessionModel.updateOne(
            { sessionId },
            {
                $push: { messages: { $each: newMessages } },
                $set: { lastActivity: now },
            }
        );
    }

    /** Archive a session (mark as archived) without clearing messages */
    async archiveSession(sessionId: string): Promise<void> {
        await SessionModel.updateOne(
            { sessionId },
            { $set: { status: "archived" } }
        );
    }

    /**
     * Archive a session and store the generated summary text.
     */
    async archiveWithSummary(sessionId: string, summary: string): Promise<void> {
        await SessionModel.updateOne(
            { sessionId },
            { $set: { status: "archived", summary } }
        );
    }

    /** Fetch the current active session for a user (for summary use) */
    async getActiveSession(userId: string): Promise<ISession | null> {
        return SessionModel.findOne({ userId, status: "active" }).sort({
            lastActivity: -1,
        });
    }
}
