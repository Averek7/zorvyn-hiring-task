import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z
  .object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(120),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/finance_dashboard"),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(32).default("dev-access-secret-please-change-in-production-12345"),
  JWT_REFRESH_SECRET: z.string().min(32).default("dev-refresh-secret-please-change-in-production-12345"),
  ACCESS_TOKEN_TTL: z.string().min(2).default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(60).default(7),
  BOOTSTRAP_TOKEN: z.string().min(12).optional(),
  })
  .transform((raw) => ({
    ...raw,
    MONGODB_URI: raw.DATABASE_URL ?? raw.MONGODB_URI,
  }));

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${formatted}`);
}

export const env = parsed.data;
