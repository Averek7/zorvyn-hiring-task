import type { User, UserRole, UserStatus } from "../domain/types";
import { UserModel } from "../models/UserModel";

function mapUser(doc: {
  _id: { toString(): string };
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: doc._id.toString(),
    email: doc.email,
    fullName: doc.fullName,
    role: doc.role,
    status: doc.status,
    passwordHash: doc.passwordHash,
    createdById: doc.createdById ?? undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function countUsers(): Promise<number> {
  return UserModel.countDocuments();
}

export async function createUser(input: {
  email: string;
  fullName: string;
  role: UserRole;
  status?: UserStatus;
  passwordHash: string;
  createdById?: string;
}): Promise<User> {
  const created = await UserModel.create({
    email: input.email,
    fullName: input.fullName,
    role: input.role,
    status: input.status ?? "ACTIVE",
    passwordHash: input.passwordHash,
    createdById: input.createdById,
  });
  return mapUser(created);
}

export async function findUserById(id: string): Promise<User | null> {
  const found = await UserModel.findById(id);
  return found ? mapUser(found) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const found = await UserModel.findOne({ email });
  return found ? mapUser(found) : null;
}

export async function listUsers(filters: { role?: UserRole; status?: UserStatus }): Promise<User[]> {
  const found = await UserModel.find({
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }).sort({ createdAt: -1 });

  return found.map(mapUser);
}

export async function updateUser(
  id: string,
  input: {
    fullName?: string;
    role?: UserRole;
    status?: UserStatus;
    passwordHash?: string;
  },
): Promise<User> {
  const updated = await UserModel.findByIdAndUpdate(
    id,
    {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
    },
    { new: true },
  );
  if (!updated) {
    throw new Error("User not found");
  }
  return mapUser(updated);
}
