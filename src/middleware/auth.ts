import type { RequestHandler } from "express";
import { hasPermission, type Permission, type SessionUser } from "../domain/rbac";
import { HttpError } from "../lib/httpError";
import { findUserById } from "../repositories/userRepository";
import { findActiveSessionById } from "../repositories/sessionRepository";
import { verifyAccessToken } from "../services/authService";

function readBearerToken(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const [scheme, token] = value.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const accessToken = readBearerToken(req.headers.authorization);
    if (!accessToken) {
      throw new HttpError(401, "Missing Bearer access token");
    }

    const payload = verifyAccessToken(accessToken);
    const session = await findActiveSessionById(payload.sid);
    if (!session || session.userId !== payload.sub) {
      throw new HttpError(401, "Session is invalid or expired");
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      throw new HttpError(401, "Invalid token user");
    }
    if (user.status !== "ACTIVE") {
      throw new HttpError(403, "User is inactive");
    }

    res.locals.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    } satisfies SessionUser;
    res.locals.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
};

export function requirePermission(permission: Permission): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.user as SessionUser | undefined;
    if (!user) {
      return next(new HttpError(401, "Authentication required"));
    }

    if (!hasPermission(user.role, permission)) {
      return next(new HttpError(403, `Insufficient permission: ${permission}`));
    }

    return next();
  };
}
