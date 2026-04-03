import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ["VIEWER", "ANALYST", "ADMIN"], required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], required: true, default: "ACTIVE", index: true },
    passwordHash: { type: String, required: true },
    createdById: { type: String, required: false },
  },
  { timestamps: true, versionKey: false },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: { toString(): string } };
export const UserModel = model("User", userSchema);
