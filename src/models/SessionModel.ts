import { Schema, model, type InferSchemaType } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, required: false, default: null, index: true },
    userAgent: { type: String, required: false },
    ip: { type: String, required: false },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ userId: 1, revokedAt: 1 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & { _id: { toString(): string } };
export const SessionModel = model("Session", sessionSchema);
