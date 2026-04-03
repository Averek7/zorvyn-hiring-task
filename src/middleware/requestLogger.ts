import type { RequestHandler } from "express";
import { logger } from "../utils/logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  res.on("finish", () => {
    const start = (res.locals.requestStartMs as number | undefined) ?? Date.now();
    const durationMs = Date.now() - start;
    const requestId = res.locals.requestId as string | undefined;
    logger.info("HTTP request completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });
  next();
};
