import type { Role } from "@arko/db";

export const PERMISSION_GROUPS = [
  {
    label: "Users",
    permissions: [
      ["users:read", "View users"],
      ["users:create", "Create users"],
      ["users:update", "Edit users and access"],
      ["users:delete", "Delete users"],
    ],
  },
  {
    label: "Finance",
    permissions: [
      ["transactions:create", "Create transactions"],
      ["transactions:read", "View transactions"],
      ["transactions:update", "Edit transactions"],
      ["transactions:delete", "Delete transactions"],
      ["transactions:manage-company", "Manage company finances"],
    ],
  },
  {
    label: "Tasks & planning",
    permissions: [
      ["tasks:create", "Create tasks"],
      ["tasks:read", "View tasks"],
      ["tasks:update", "Edit tasks"],
      ["tasks:delete", "Delete tasks"],
      ["events:create", "Create events"],
      ["events:read", "View events"],
      ["events:update", "Edit events"],
      ["events:delete", "Delete events"],
      ["notes:create", "Create notes"],
      ["notes:read", "View notes"],
      ["notes:update", "Edit notes"],
      ["notes:delete", "Delete notes"],
    ],
  },
  {
    label: "Workflows & content",
    permissions: [
      ["workflows:create", "Create workflows"],
      ["workflows:read", "View workflows"],
      ["workflows:update", "Edit workflows"],
      ["workflows:execute", "Run workflows"],
      ["resources:create", "Create resources"],
      ["resources:read", "View resources"],
      ["resources:update", "Edit resources"],
      ["resources:delete", "Delete resources"],
      ["documents:create", "Create documents"],
      ["documents:read", "View documents"],
      ["documents:update", "Edit documents"],
      ["documents:delete", "Delete documents"],
    ],
  },
  {
    label: "Marketing & administration",
    permissions: [
      ["email-marketing:read", "View email marketing"],
      ["email-marketing:create", "Create email marketing"],
      ["email-marketing:update", "Edit email marketing"],
      ["email-marketing:manage", "Manage email marketing settings"],
      ["client-portal:manage", "Manage the client portal"],
      ["landing:manage", "Manage landing content"],
      ["assistant:manage", "Manage NEX settings"],
      ["assistant-activity:read", "View NEX activity"],
      ["messages:delete", "Delete conversations"],
    ],
  },
] as const;

export const PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map(([permission]) => permission),
);

export type Permission = (typeof PERMISSIONS)[number];

const MEMBER_PERMISSIONS: Permission[] = [
  "transactions:create",
  "transactions:read",
  "transactions:update",
  "transactions:delete",
  "tasks:create",
  "tasks:read",
  "tasks:update",
  "tasks:delete",
  "events:create",
  "events:read",
  "events:update",
  "events:delete",
  "notes:create",
  "notes:read",
  "notes:update",
  "notes:delete",
  "workflows:create",
  "workflows:read",
  "workflows:update",
  "workflows:execute",
  "resources:create",
  "resources:read",
  "resources:update",
  "resources:delete",
  "documents:create",
  "documents:read",
  "documents:update",
  "documents:delete",
  "email-marketing:read",
  "email-marketing:create",
  "email-marketing:update",
  "users:read",
];

export const ROLE_PERMISSION_PRESETS: Record<Role, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  ACCOUNTANT: [
    "transactions:create",
    "transactions:read",
    "transactions:update",
    "transactions:delete",
    "transactions:manage-company",
    "users:read",
  ],
  MEMBER: MEMBER_PERMISSIONS,
  USER: MEMBER_PERMISSIONS.filter(
    (permission) => !permission.startsWith("email-marketing:"),
  ),
  CLIENT: ["users:read"],
  DEMO: [],
};

const PERMISSION_SET = new Set<string>(PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

export function defaultPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSION_PRESETS[role]];
}

export function resolvePermissions(
  role: Role,
  storedPermissions: unknown,
): Permission[] {
  if (storedPermissions === null || storedPermissions === undefined) {
    return defaultPermissionsForRole(role);
  }
  if (!Array.isArray(storedPermissions)) return [];
  return [
    ...new Set(
      storedPermissions.filter(
        (item): item is Permission =>
          typeof item === "string" && isPermission(item),
      ),
    ),
  ];
}

export function hasPermission(
  role: Role | undefined,
  permission: Permission,
  storedPermissions?: unknown,
): boolean {
  if (!role) return false;
  return resolvePermissions(role, storedPermissions).includes(permission);
}

export function hasRole(role: Role | undefined, allowed: Role[]): boolean {
  return !!role && allowed.includes(role);
}

export function effectiveRole(role: Role): Role {
  return role;
}
