import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (_req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.locals.requestStartMs = Date.now();
  res.setHeader("x-request-id", requestId);
  next();
};
