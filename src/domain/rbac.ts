import type { UserRole, UserStatus } from "./types";

export type Permission =
  | "users:manage"
  | "records:create"
  | "records:read"
  | "records:update"
  | "records:delete"
  | "dashboard:read";

const permissionsByRole: Record<UserRole, Permission[]> = {
  VIEWER: ["dashboard:read"],
  ANALYST: ["dashboard:read", "records:read"],
  ADMIN: [
    "users:manage",
    "records:create",
    "records:read",
    "records:update",
    "records:delete",
    "dashboard:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsByRole[role].includes(permission);
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
}
