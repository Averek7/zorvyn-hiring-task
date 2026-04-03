export type UserRole = "VIEWER" | "ANALYST" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type FinancialRecordType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

export interface FinancialRecord {
  id: string;
  amount: number;
  type: FinancialRecordType;
  category: string;
  recordDate: string;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: string;
  revokedAt?: string | null;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  updatedAt: string;
}
