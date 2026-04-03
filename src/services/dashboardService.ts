import type { FinancialRecordType } from "../domain/types";
import { listAllRecordsForSummary } from "../repositories/recordRepository";

interface NumericRecord {
  id: string;
  amount: number;
  type: FinancialRecordType;
  category: string;
  recordDate: Date;
  notes?: string | null;
  createdAt: Date;
  createdById: string;
  updatedAt: Date;
}

interface SummaryRecord {
  id: string;
  amount: number;
  type: FinancialRecordType;
  category: string;
  recordDate: Date;
  notes?: string | null;
  createdAt: Date;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

function trendKey(date: Date, mode: "weekly" | "monthly"): string {
  if (mode === "monthly") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function totalsByType(records: SummaryRecord[], type: FinancialRecordType): number {
  return records.filter((record) => record.type === type).reduce((acc, record) => acc + record.amount, 0);
}

export function buildSummary(
  records: SummaryRecord[],
  options: { trend: "weekly" | "monthly"; recentLimit: number },
) {
  const income = totalsByType(records, "INCOME");
  const expenses = totalsByType(records, "EXPENSE");

  const categoryMap = new Map<string, number>();
  for (const record of records) {
    const signedValue = record.type === "EXPENSE" ? -record.amount : record.amount;
    categoryMap.set(record.category, (categoryMap.get(record.category) ?? 0) + signedValue);
  }

  const trendMap = new Map<string, { income: number; expense: number }>();
  for (const record of records) {
    const bucket = trendKey(record.recordDate, options.trend);
    const current = trendMap.get(bucket) ?? { income: 0, expense: 0 };
    if (record.type === "INCOME") {
      current.income += record.amount;
    } else {
      current.expense += record.amount;
    }
    trendMap.set(bucket, current);
  }

  return {
    totals: {
      income,
      expenses,
      netBalance: income - expenses,
    },
    categoryTotals: [...categoryMap.entries()]
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .map(([category, total]) => ({ category, total })),
    trends: [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, value]) => ({
        period,
        income: value.income,
        expense: value.expense,
        net: value.income - value.expense,
      })),
    recentActivity: [...records]
      .sort((a, b) => b.recordDate.getTime() - a.recordDate.getTime())
      .slice(0, options.recentLimit)
      .map((record) => ({
        id: record.id,
        type: record.type,
        amount: record.amount,
        category: record.category,
        recordDate: record.recordDate.toISOString(),
        notes: record.notes,
        createdAt: record.createdAt.toISOString(),
      })),
  };
}

export async function getDashboardSummary(filters: {
  type?: FinancialRecordType;
  category?: string;
  from?: Date;
  to?: Date;
  trend: "weekly" | "monthly";
  recentLimit: number;
}) {
  const records = await listAllRecordsForSummary(filters);
  const normalized: NumericRecord[] = records.map((record) => ({
    ...record,
    amount: toNumber(record.amount),
    recordDate: new Date(record.recordDate),
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }));

  return buildSummary(normalized, {
    trend: filters.trend,
    recentLimit: filters.recentLimit,
  });
}
