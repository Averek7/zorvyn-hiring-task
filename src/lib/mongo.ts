import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let connected = false;

export async function connectMongo(): Promise<void> {
  if (connected) {
    return;
  }

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  connected = true;
  logger.info("MongoDB connected");
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) {
    return;
  }
  await mongoose.disconnect();
  connected = false;
}
