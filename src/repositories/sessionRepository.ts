import type { Session } from "../domain/types";
import { SessionModel } from "../models/SessionModel";

function mapSession(doc: {
  _id: { toString(): string };
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Session {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    refreshTokenHash: doc.refreshTokenHash,
    expiresAt: doc.expiresAt.toISOString(),
    revokedAt: doc.revokedAt ? doc.revokedAt.toISOString() : null,
    userAgent: doc.userAgent ?? undefined,
    ip: doc.ip ?? undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function createSession(input: {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}): Promise<Session> {
  const created = await SessionModel.create({
    userId: input.userId,
    refreshTokenHash: input.refreshTokenHash,
    expiresAt: input.expiresAt,
    userAgent: input.userAgent,
    ip: input.ip,
  });
  return mapSession(created);
}

export async function findSessionById(id: string): Promise<Session | null> {
  const found = await SessionModel.findById(id);
  return found ? mapSession(found) : null;
}

export async function findActiveSessionById(id: string): Promise<Session | null> {
  const found = await SessionModel.findOne({
    _id: id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  return found ? mapSession(found) : null;
}

export async function rotateSessionRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
  await SessionModel.updateOne(
    { _id: sessionId, revokedAt: null },
    { $set: { refreshTokenHash, expiresAt, updatedAt: new Date() } },
  );
}

export async function revokeSession(sessionId: string): Promise<void> {
  await SessionModel.updateOne({ _id: sessionId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await SessionModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
