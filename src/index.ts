import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { connectMongo } from "./lib/mongo";
import { requireAuth } from "./middleware/auth";
import { createRateLimit } from "./middleware/rateLimit";
import { requestContext } from "./middleware/requestContext";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import setupRouter from "./routes/setup";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import recordsRouter from "./routes/records";
import dashboardRouter from "./routes/dashboard";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(requestContext);
app.use(requestLogger);
app.use(
  createRateLimit({
    routeGroup: "global",
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  }),
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "finance-dashboard-backend",
    status: "ok",
    health: "/api/health",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/setup", setupRouter);
app.use("/api/auth", authRouter);

app.use("/api", requireAuth);
app.use("/api/users", usersRouter);
app.use("/api/records", recordsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await connectMongo();
  app.listen(env.PORT, () => {
    console.log(`Finance dashboard backend running on port ${env.PORT}`);
  });
}

if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
  void startServer();
}

export { app };
