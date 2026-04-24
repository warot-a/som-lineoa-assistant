import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(uri: string): Promise<void> {
    if (isConnected) {
        return;
    }

    await mongoose.connect(uri);
    isConnected = true;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ MongoDB connected`);
}
