import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ChatMessage, SessionStatus } from "../types";

// ─── Document Interface ────────────────────────────────────────────────────────

export interface ISession extends Document {
    sessionId: string;
    userId: string;
    status: SessionStatus;
    messages: ChatMessage[];
    summary: string | null;
    lastActivity: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────────

const chatMessageSchema = new Schema<ChatMessage>(
    {
        role: { type: String, enum: ["user", "model"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: () => new Date() },
    },
    { _id: false }
);

const sessionSchema = new Schema<ISession>(
    {
        sessionId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        status: { type: String, enum: ["active", "archived"], default: "active" },
        messages: { type: [chatMessageSchema], default: [] },
        summary: { type: String, default: null },
        lastActivity: { type: Date, default: () => new Date() },
    },
    { timestamps: true }
);

// ─── Model ─────────────────────────────────────────────────────────────────────

export const SessionModel: Model<ISession> =
    mongoose.models.Session ?? mongoose.model<ISession>("Session", sessionSchema);
