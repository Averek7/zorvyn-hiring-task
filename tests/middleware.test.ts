import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requestContext } from "../src/middleware/requestContext";
import { errorHandler } from "../src/middleware/errorHandler";
import { requireAuth } from "../src/middleware/auth";

function createRes() {
  const headers = new Map<string, string>();
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return {
    locals: {},
    setHeader: vi.fn((key: string, value: string) => {
      headers.set(key.toLowerCase(), value);
    }),
    status,
    json,
    headers,
  } as {
    locals: Record<string, unknown>;
    setHeader: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    headers: Map<string, string>;
  };
}

describe("requestContext", () => {
  it("assigns requestId and returns it as response header", () => {
    const res = createRes();
    const next = vi.fn();
    requestContext({} as Request, res as unknown as Response, next);

    expect(typeof res.locals.requestId).toBe("string");
    expect(res.headers.get("x-request-id")).toBe(res.locals.requestId);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("errorHandler", () => {
  it("returns sanitized server error response with requestId", () => {
    const req = { method: "GET", originalUrl: "/api/test" } as Request;
    const res = createRes();
    res.locals.requestId = "req-123";

    errorHandler(new Error("boom"), req, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.status.mock.results[0]?.value.json.mock.calls[0]?.[0];
    expect(body.requestId).toBe("req-123");
    expect(body.error).toBe("Internal server error");
  });
});

describe("requireAuth", () => {
  it("rejects missing bearer token", async () => {
    const req = {
      headers: {},
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await requireAuth(req, res as unknown as Response, next);
    const err = next.mock.calls[0]?.[0] as Error & { status?: number };
    expect(err.message).toContain("Bearer");
    expect(err.status).toBe(401);
  });
});
