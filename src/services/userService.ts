import type { UserRole, UserStatus } from "../domain/types";
import { assertOrThrow } from "../lib/httpError";
import { hashPassword } from "./authService";
import {
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser,
} from "../repositories/userRepository";

function stripPasswordHash<T extends { passwordHash?: string }>(user: T): Omit<T, "passwordHash"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ");
}

export async function bootstrapAdmin(input: {
  email: string;
  fullName: string;
  password: string;
}) {
  const existingCount = await countUsers();
  assertOrThrow(existingCount === 0, 409, "Bootstrap is allowed only when no users exist");

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedName = normalizeName(input.fullName);
  const passwordHash = await hashPassword(input.password);

  const created = await createUser({
    email: normalizedEmail,
    fullName: normalizedName,
    role: "ADMIN",
    status: "ACTIVE",
    passwordHash,
  });
  return stripPasswordHash(created);
}

export async function createManagedUser(input: {
  email: string;
  fullName: string;
  role: UserRole;
  status?: UserStatus;
  password: string;
  actorId: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedName = normalizeName(input.fullName);
  const passwordHash = await hashPassword(input.password);

  const existing = await findUserByEmail(normalizedEmail);
  assertOrThrow(!existing, 409, "A user with this email already exists");

  const created = await createUser({
    email: normalizedEmail,
    fullName: normalizedName,
    role: input.role,
    status: input.status,
    passwordHash,
    createdById: input.actorId,
  });
  return stripPasswordHash(created);
}

export async function listManagedUsers(filters: { role?: UserRole; status?: UserStatus }) {
  const users = await listUsers(filters);
  return users.map(stripPasswordHash);
}

export async function updateManagedUser(
  userId: string,
  input: {
    fullName?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
  },
) {
  const existing = await findUserById(userId);
  assertOrThrow(existing, 404, "User not found");

  const nextPasswordHash = input.password ? await hashPassword(input.password) : undefined;
  const updated = await updateUser(userId, {
    fullName: input.fullName ? normalizeName(input.fullName) : input.fullName,
    role: input.role,
    status: input.status,
    passwordHash: nextPasswordHash,
  });
  return stripPasswordHash(updated);
}
