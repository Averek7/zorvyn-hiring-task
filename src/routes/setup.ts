import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { HttpError } from "../lib/httpError";
import { asyncHandler } from "../middleware/asyncHandler";
import { createRateLimit } from "../middleware/rateLimit";
import { bootstrapAdmin } from "../services/userService";

const router = Router();

const bootstrapSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(128),
});

router.post(
  "/bootstrap-admin",
  createRateLimit({
    routeGroup: "setup-bootstrap",
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: Math.max(3, Math.floor(env.RATE_LIMIT_MAX_REQUESTS / 20)),
  }),
  asyncHandler(async (req, res) => {
    if (env.BOOTSTRAP_TOKEN) {
      const headerToken = req.headers["x-bootstrap-token"];
      const token = typeof headerToken === "string" ? headerToken : Array.isArray(headerToken) ? headerToken[0] : undefined;
      if (token !== env.BOOTSTRAP_TOKEN) {
        throw new HttpError(401, "Invalid bootstrap token");
      }
    }

    const parsed = bootstrapSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const user = await bootstrapAdmin(parsed.data);
    return res.status(201).json({ success: true, data: user });
  }),
);

export default router;
