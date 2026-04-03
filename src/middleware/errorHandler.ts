import type { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const notFoundHandler: RequestHandler = (req, res) => {
  const requestId = res.locals.requestId as string | undefined;
  res.status(404).json({
    success: false,
    error: "Not found",
    path: req.originalUrl,
    requestId,
  });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = typeof (err as { status?: unknown }).status === "number" ? (err as { status: number }).status : 500;
  const message = statusCode >= 500 ? "Internal server error" : (err as Error).message;
  const requestId = res.locals.requestId as string | undefined;

  logger.error("Unhandled route error", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: (err as Error).name,
    errorMessage: (err as Error).message,
    stack: env.NODE_ENV === "production" ? undefined : (err as Error).stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    requestId,
    ...(env.NODE_ENV !== "production" ? { details: (err as Error).message } : {}),
  });
};
