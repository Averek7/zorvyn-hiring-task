import { describe, expect, it } from "vitest";
import { hasPermission } from "../src/domain/rbac";

describe("RBAC matrix", () => {
  it("enforces viewer rules", () => {
    expect(hasPermission("VIEWER", "dashboard:read")).toBe(true);
    expect(hasPermission("VIEWER", "records:read")).toBe(false);
    expect(hasPermission("VIEWER", "records:create")).toBe(false);
  });

  it("enforces analyst rules", () => {
    expect(hasPermission("ANALYST", "dashboard:read")).toBe(true);
    expect(hasPermission("ANALYST", "records:read")).toBe(true);
    expect(hasPermission("ANALYST", "records:update")).toBe(false);
  });

  it("enforces admin rules", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("ADMIN", "records:create")).toBe(true);
    expect(hasPermission("ADMIN", "records:delete")).toBe(true);
  });
});
