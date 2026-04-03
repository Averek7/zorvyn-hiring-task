import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requirePermission } from "../middleware/auth";
import { createManagedUser, listManagedUsers, updateManagedUser } from "../services/userService";
import type { SessionUser } from "../domain/rbac";

const router = Router();

const roleSchema = z.enum(["VIEWER", "ANALYST", "ADMIN"]);
const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  role: roleSchema,
  status: statusSchema.optional(),
  password: z.string().min(8).max(128),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  role: roleSchema.optional(),
  status: statusSchema.optional(),
  password: z.string().min(8).max(128).optional(),
});

const listUsersSchema = z.object({
  role: roleSchema.optional(),
  status: statusSchema.optional(),
});

router.get(
  "/me",
  asyncHandler(async (_req, res) => {
    return res.json({ success: true, data: res.locals.user as SessionUser });
  }),
);

router.get(
  "/",
  requirePermission("users:manage"),
  asyncHandler(async (req, res) => {
    const parsed = listUsersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const users = await listManagedUsers(parsed.data);
    return res.json({ success: true, count: users.length, data: users });
  }),
);

router.post(
  "/",
  requirePermission("users:manage"),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const actor = res.locals.user as SessionUser;
    const user = await createManagedUser({
      ...parsed.data,
      actorId: actor.id,
    });

    return res.status(201).json({ success: true, data: user });
  }),
);

router.patch(
  "/:id",
  requirePermission("users:manage"),
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const user = await updateManagedUser(req.params.id, parsed.data);
    return res.json({ success: true, data: user });
  }),
);

export default router;
