import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermission } from "../middleware/auth";
import { HttpError } from "../lib/httpError";
import { getDashboardSummary } from "../services/dashboardService";

const router = Router();

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().min(2).max(80).optional(),
  trend: z.enum(["weekly", "monthly"]).default("monthly"),
  recentLimit: z.coerce.number().int().min(1).max(50).default(8),
});

function parseDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "Invalid date filter");
  }
  return parsed;
}

router.get(
  "/summary",
  requirePermission("dashboard:read"),
  asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const summary = await getDashboardSummary({
      from: parseDate(parsed.data.from),
      to: parseDate(parsed.data.to),
      type: parsed.data.type,
      category: parsed.data.category,
      trend: parsed.data.trend,
      recentLimit: parsed.data.recentLimit,
    });

    return res.json({ success: true, data: summary });
  }),
);

export default router;
