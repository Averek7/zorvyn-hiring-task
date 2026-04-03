import { describe, expect, it } from "vitest";
import { buildSummary } from "../src/services/dashboardService";

describe("dashboard summary", () => {
  it("calculates totals, category totals, trends, and recent activity", () => {
    const summary = buildSummary(
      [
        {
          id: "1",
          amount: 5000,
          type: "INCOME",
          category: "Salary",
          recordDate: new Date("2026-01-15T00:00:00.000Z"),
          notes: "jan",
          createdAt: new Date("2026-01-15T00:00:00.000Z"),
        },
        {
          id: "2",
          amount: 1200,
          type: "EXPENSE",
          category: "Rent",
          recordDate: new Date("2026-01-20T00:00:00.000Z"),
          notes: null,
          createdAt: new Date("2026-01-20T00:00:00.000Z"),
        },
        {
          id: "3",
          amount: 300,
          type: "EXPENSE",
          category: "Food",
          recordDate: new Date("2026-02-02T00:00:00.000Z"),
          notes: null,
          createdAt: new Date("2026-02-02T00:00:00.000Z"),
        },
      ],
      { trend: "monthly", recentLimit: 2 },
    );

    expect(summary.totals).toEqual({ income: 5000, expenses: 1500, netBalance: 3500 });
    expect(summary.categoryTotals).toEqual([
      { category: "Salary", total: 5000 },
      { category: "Rent", total: -1200 },
      { category: "Food", total: -300 },
    ]);
    expect(summary.trends).toEqual([
      { period: "2026-01", income: 5000, expense: 1200, net: 3800 },
      { period: "2026-02", income: 0, expense: 300, net: -300 },
    ]);
    expect(summary.recentActivity).toHaveLength(2);
    expect(summary.recentActivity[0]?.id).toBe("3");
  });
});
