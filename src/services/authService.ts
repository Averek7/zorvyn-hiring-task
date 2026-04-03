import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../lib/httpError";
import type { Session, User } from "../domain/types";
import { createSession, findActiveSessionById, revokeSession, rotateSessionRefreshToken } from "../repositories/sessionRepository";
import { findUserByEmail, findUserById } from "../repositories/userRepository";

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: string;
  status: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function issueRefreshTokenRaw(): string {
  return randomBytes(48).toString("hex");
}

function issueAccessToken(user: User, session: Session): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    sid: session.id,
    role: user.role,
    status: user.status,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
}

function refreshExpiresAt(): Date {
  const now = Date.now();
  return new Date(now + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 12);
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}): Promise<{ user: Omit<User, "passwordHash">; accessToken: string; refreshToken: string; sessionId: string }> {
  const user = await findUserByEmail(input.email.trim().toLowerCase());
  if (!user || !user.passwordHash) {
    throw new HttpError(401, "Invalid credentials");
  }
  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "User is inactive");
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid credentials");
  }

  const refreshToken = issueRefreshTokenRaw();
  const session = await createSession({
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt(),
    userAgent: input.userAgent,
    ip: input.ip,
  });

  const accessToken = issueAccessToken(user, session);
  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken, sessionId: session.id };
}

export async function refreshAuthSession(input: {
  sessionId: string;
  refreshToken: string;
}): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  const session = await findActiveSessionById(input.sessionId);
  if (!session) {
    throw new HttpError(401, "Session not found or expired");
  }

  const incomingHash = hashToken(input.refreshToken);
  if (incomingHash !== session.refreshTokenHash) {
    await revokeSession(session.id);
    throw new HttpError(401, "Refresh token mismatch");
  }

  const user = await findUserById(session.userId);
  if (!user || user.status !== "ACTIVE") {
    await revokeSession(session.id);
    throw new HttpError(401, "Session user invalid");
  }

  const rotatedRefreshToken = issueRefreshTokenRaw();
  await rotateSessionRefreshToken(session.id, hashToken(rotatedRefreshToken), refreshExpiresAt());

  const accessToken = issueAccessToken(user, session);
  return { accessToken, refreshToken: rotatedRefreshToken, sessionId: session.id };
}

export async function logoutSession(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
}

export function verifyAccessToken(accessToken: string): AccessTokenPayload {
  try {
    return jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
}
