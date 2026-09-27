-- Grant the two new NEX action permissions to existing rows so stored
-- permission arrays stay in sync with the role presets in apps/web/src/lib/rbac.ts.
-- ADOPTED users are re-stamped to the current preset below; custom stored
-- permissions not in this list are preserved on both branches.

-- ADOPTED — full preset updates.
UPDATE "User"
SET "permissions" = CASE "role"
  WHEN 'ADMIN' THEN '["users:read","users:create","users:update","users:delete","transactions:create","transactions:read","transactions:update","transactions:delete","transactions:manage-company","tasks:create","tasks:read","tasks:update","tasks:delete","tasks:send-message","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","tasks:create-reminder","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","email-marketing:read","email-marketing:create","email-marketing:update","email-marketing:manage","client-portal:manage","landing:manage","assistant:manage","assistant-activity:read","messages:delete"]'::jsonb
  WHEN 'USER' THEN '["transactions:create","transactions:read","transactions:update","transactions:delete","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","users:read"]'::jsonb
  WHEN 'ACCOUNTANT' THEN '["transactions:create","transactions:read","transactions:update","transactions:delete","transactions:manage-company","users:read"]'::jsonb
  WHEN 'MEMBER' THEN '["transactions:create","transactions:read","transactions:update","transactions:delete","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","email-marketing:read","email-marketing:create","email-marketing:update","users:read","tasks:send-message","tasks:create-reminder"]'::jsonb
  WHEN 'CLIENT' THEN '["users:read"]'::jsonb
  WHEN 'DEMO' THEN '[]'::jsonb
  ELSE '[]'::jsonb
END
WHERE "permissions" IS NOT NULL
  -- Only COMMITTED rows that still match the preset shape are re-stamped.
  AND (
    ("role" = 'ADMIN' AND "permissions"::text = '["users:read","users:create","users:update","users:delete","transactions:create","transactions:read","transactions:update","transactions:delete","transactions:manage-company","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","email-marketing:read","email-marketing:create","email-marketing:update","email-marketing:manage","client-portal:manage","landing:manage","assistant:manage","assistant-activity:read","messages:delete"]') OR
    ("role" = 'MEMBER' AND "permissions"::text = '["transactions:create","transactions:read","transactions:update","transactions:delete","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","email-marketing:read","email-marketing:create","email-marketing:update","users:read"]')
  );

-- TRANSACTIONAL (in place) — surgically add missing keys on rows that diverge,
-- preserving any custom stored permissions.
UPDATE "User"
SET "permissions" = "permissions" || '["tasks:send-message","tasks:create-reminder"]'::jsonb
WHERE "permissions" IS NOT NULL
  AND ("role" = 'MEMBER' OR "role" = 'ADMIN')
  AND NOT ("permissions" ? 'tasks:send-message' OR "permissions" ? 'tasks:create-reminder')
  AND "permissions" <> '["users:read"]'::jsonb
  AND "permissions" <> '[]'::jsonb; -- don't grant to explicitly-empty or CLIENT-style single-permission rows
