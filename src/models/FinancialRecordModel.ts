import { Schema, model, type InferSchemaType } from "mongoose";

const financialRecordSchema = new Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true, index: true },
    category: { type: String, required: true, index: true },
    recordDate: { type: Date, required: true, index: true },
    notes: { type: String, required: false },
    createdById: { type: String, required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

financialRecordSchema.index({ type: 1, recordDate: -1 });
financialRecordSchema.index({ category: 1, recordDate: -1 });

export type FinancialRecordDocument = InferSchemaType<typeof financialRecordSchema> & { _id: { toString(): string } };
export const FinancialRecordModel = model("FinancialRecord", financialRecordSchema);
