import type { FinancialRecordType } from "../domain/types";
import { assertOrThrow } from "../lib/httpError";
import {
  createRecord,
  deleteRecord,
  findRecordById,
  listRecords,
  updateRecord,
} from "../repositories/recordRepository";

export async function createFinancialRecord(input: {
  amount: number;
  type: FinancialRecordType;
  category: string;
  recordDate: Date;
  notes?: string;
  createdById: string;
}) {
  return createRecord(input);
}

export async function listFinancialRecords(filters: {
  type?: FinancialRecordType;
  category?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}) {
  return listRecords(filters);
}

export async function getFinancialRecord(recordId: string) {
  return findRecordById(recordId);
}

export async function updateFinancialRecord(
  recordId: string,
  input: {
    amount?: number;
    type?: FinancialRecordType;
    category?: string;
    recordDate?: Date;
    notes?: string | null;
  },
) {
  const existing = await findRecordById(recordId);
  assertOrThrow(existing, 404, "Record not found");
  return updateRecord(recordId, input);
}

export async function removeFinancialRecord(recordId: string): Promise<void> {
  const existing = await findRecordById(recordId);
  assertOrThrow(existing, 404, "Record not found");
  await deleteRecord(recordId);
}
