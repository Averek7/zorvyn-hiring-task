import type { FinancialRecord, FinancialRecordType } from "../domain/types";
import { FinancialRecordModel } from "../models/FinancialRecordModel";

function mapRecord(doc: {
  _id: { toString(): string };
  amount: number;
  type: FinancialRecordType;
  category: string;
  recordDate: Date;
  notes?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): FinancialRecord {
  return {
    id: doc._id.toString(),
    amount: doc.amount,
    type: doc.type,
    category: doc.category,
    recordDate: doc.recordDate.toISOString(),
    notes: doc.notes ?? null,
    createdById: doc.createdById,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function buildFilter(filter: {
  type?: FinancialRecordType;
  category?: string;
  from?: Date;
  to?: Date;
}) {
  return {
    ...(filter.type ? { type: filter.type } : {}),
    ...(filter.category ? { category: filter.category } : {}),
    ...((filter.from || filter.to)
      ? {
          recordDate: {
            ...(filter.from ? { $gte: filter.from } : {}),
            ...(filter.to ? { $lte: filter.to } : {}),
          },
        }
      : {}),
  };
}

export async function createRecord(input: {
  amount: number;
  type: FinancialRecordType;
  category: string;
  recordDate: Date;
  notes?: string;
  createdById: string;
}): Promise<FinancialRecord> {
  const created = await FinancialRecordModel.create({
    amount: input.amount,
    type: input.type,
    category: input.category,
    recordDate: input.recordDate,
    notes: input.notes,
    createdById: input.createdById,
  });
  return mapRecord(created);
}

export async function listRecords(filters: {
  type?: FinancialRecordType;
  category?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}): Promise<{ items: FinancialRecord[]; total: number }> {
  const where = buildFilter(filters);
  const [items, total] = await Promise.all([
    FinancialRecordModel.find(where)
      .sort({ recordDate: -1, createdAt: -1 })
      .skip((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize),
    FinancialRecordModel.countDocuments(where),
  ]);
  return { items: items.map(mapRecord), total };
}

export async function listAllRecordsForSummary(filters: {
  from?: Date;
  to?: Date;
  type?: FinancialRecordType;
  category?: string;
}): Promise<FinancialRecord[]> {
  const found = await FinancialRecordModel.find(buildFilter(filters)).sort({ recordDate: -1, createdAt: -1 });
  return found.map(mapRecord);
}

export async function findRecordById(id: string): Promise<FinancialRecord | null> {
  const found = await FinancialRecordModel.findById(id);
  return found ? mapRecord(found) : null;
}

export async function updateRecord(
  id: string,
  input: {
    amount?: number;
    type?: FinancialRecordType;
    category?: string;
    recordDate?: Date;
    notes?: string | null;
  },
): Promise<FinancialRecord> {
  const updated = await FinancialRecordModel.findByIdAndUpdate(
    id,
    {
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.recordDate !== undefined ? { recordDate: input.recordDate } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    { new: true },
  );
  if (!updated) {
    throw new Error("Record not found");
  }
  return mapRecord(updated);
}

export async function deleteRecord(id: string): Promise<void> {
  await FinancialRecordModel.findByIdAndDelete(id);
}
