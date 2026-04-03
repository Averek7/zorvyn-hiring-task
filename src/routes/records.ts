import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermission } from "../middleware/auth";
import { HttpError } from "../lib/httpError";
import {
  createFinancialRecord,
  getFinancialRecord,
  listFinancialRecords,
  removeFinancialRecord,
  updateFinancialRecord,
} from "../services/recordService";
import type { SessionUser } from "../domain/rbac";

const router = Router();

const typeSchema = z.enum(["INCOME", "EXPENSE"]);

const createSchema = z.object({
  amount: z.coerce.number().positive().max(9_999_999_999),
  type: typeSchema,
  category: z.string().min(2).max(80),
  recordDate: z.coerce.date(),
  notes: z.string().max(400).optional(),
});

const updateSchema = z
  .object({
    amount: z.coerce.number().positive().max(9_999_999_999).optional(),
    type: typeSchema.optional(),
    category: z.string().min(2).max(80).optional(),
    recordDate: z.coerce.date().optional(),
    notes: z.string().max(400).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

const listSchema = z.object({
  type: typeSchema.optional(),
  category: z.string().min(2).max(80).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, `Invalid datetime for ${field}`);
  }
  return parsed;
}

router.post(
  "/",
  requirePermission("records:create"),
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const actor = res.locals.user as SessionUser;
    const record = await createFinancialRecord({ ...parsed.data, createdById: actor.id });
    return res.status(201).json({ success: true, data: record });
  }),
);

router.get(
  "/",
  requirePermission("records:read"),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const result = await listFinancialRecords({
      type: parsed.data.type,
      category: parsed.data.category,
      from: parseDate(parsed.data.from, "from"),
      to: parseDate(parsed.data.to, "to"),
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    return res.json({
      success: true,
      data: result.items,
      pagination: {
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / parsed.data.pageSize),
      },
    });
  }),
);

router.get(
  "/:id",
  requirePermission("records:read"),
  asyncHandler(async (req, res) => {
    const record = await getFinancialRecord(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }
    return res.json({ success: true, data: record });
  }),
);

router.patch(
  "/:id",
  requirePermission("records:update"),
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const updated = await updateFinancialRecord(req.params.id, parsed.data);
    return res.json({ success: true, data: updated });
  }),
);

router.delete(
  "/:id",
  requirePermission("records:delete"),
  asyncHandler(async (req, res) => {
    await removeFinancialRecord(req.params.id);
    return res.status(204).send();
  }),
);

export default router;
