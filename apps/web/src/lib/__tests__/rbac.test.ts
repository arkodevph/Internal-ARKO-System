import { describe, expect, it } from "@jest/globals";
import type { Role } from "@arko/db";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PERMISSIONS,
  ROLE_PERMISSION_PRESETS,
  defaultPermissionsForRole,
  hasPermission,
  resolvePermissions,
} from "../rbac";

const ROLES: Role[] = [
  "ADMIN",
  "ACCOUNTANT",
  "MEMBER",
  "USER",
  "CLIENT",
  "DEMO",
];

describe("permission presets", () => {
  it("defines known, duplicate-free permissions for every role", () => {
    for (const role of ROLES) {
      const preset = ROLE_PERMISSION_PRESETS[role];
      expect(new Set(preset).size).toBe(preset.length);
      expect(
        preset.every((permission) => PERMISSIONS.includes(permission)),
      ).toBe(true);
    }
  });

  it("selects the entire canonical catalog for ADMIN", () => {
    expect(defaultPermissionsForRole("ADMIN")).toEqual(PERMISSIONS);
  });

  it("uses the role preset only for an uninitialized persisted value", () => {
    expect(resolvePermissions("MEMBER", null)).toEqual(
      defaultPermissionsForRole("MEMBER"),
    );
    expect(resolvePermissions("ADMIN", [])).toEqual([]);
    expect(hasPermission("ADMIN", "users:update", [])).toBe(false);
  });

  it("filters unknown persisted values and honors custom permissions", () => {
    expect(
      resolvePermissions("USER", ["tasks:read", "unknown", "tasks:read"]),
    ).toEqual(["tasks:read"]);
    expect(hasPermission("USER", "tasks:read", ["tasks:read"])).toBe(true);
    expect(hasPermission("USER", "tasks:create", ["tasks:read"])).toBe(false);
  });

  it("backfills existing users with the same persisted preset matrix", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "../../packages/db/prisma/migrations/20260817090000_add_user_permissions/migration.sql",
      ),
      "utf8",
    );

    for (const role of ROLES.filter((item) => item !== "DEMO")) {
      const match = migration.match(
        new RegExp(`WHEN '${role}' THEN '(\\[[^']*\\])'::jsonb`),
      );
      expect(match).not.toBeNull();
      expect(JSON.parse(match![1])).toEqual(defaultPermissionsForRole(role));
    }
    expect(migration).toContain("ELSE '[]'::jsonb");
    expect(migration).toContain('WHERE "permissions" IS NULL');
  });
});
