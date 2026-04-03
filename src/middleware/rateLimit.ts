import type { RequestHandler } from "express";
import { HttpError } from "../lib/httpError";

interface Bucket {
  startedAtMs: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

function keyFor(ip: string, routeGroup: string): string {
  return `${routeGroup}::${ip}`;
}

export function createRateLimit(options: {
  routeGroup: string;
  windowMs: number;
  maxRequests: number;
}): RequestHandler {
  return (req, _res, next) => {
    const now = Date.now();
    const ip = req.ip || "unknown";
    const key = keyFor(ip, options.routeGroup);
    const current = buckets.get(key);

    if (!current || now - current.startedAtMs >= options.windowMs) {
      buckets.set(key, { startedAtMs: now, count: 1 });
      return next();
    }

    if (current.count >= options.maxRequests) {
      return next(new HttpError(429, "Rate limit exceeded, please retry later"));
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
}
