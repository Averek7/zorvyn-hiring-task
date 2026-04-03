import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { logoutSession, loginWithPassword, refreshAuthSession } from "../services/authService";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const refreshSchema = z.object({
  sessionId: z.string().min(1),
  refreshToken: z.string().min(32),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const auth = await loginWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    return res.json({ success: true, data: auth });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const nextSession = await refreshAuthSession(parsed.data);
    return res.json({ success: true, data: nextSession });
  }),
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const sessionId = res.locals.sessionId as string;
    await logoutSession(sessionId);
    return res.status(204).send();
  }),
);

export default router;
