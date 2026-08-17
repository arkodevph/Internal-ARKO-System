ALTER TABLE "User" ADD COLUMN "permissions" JSONB;

UPDATE "User"
SET "permissions" = CASE "role"
  WHEN 'ADMIN' THEN '["users:read","users:create","users:update","users:delete","transactions:create","transactions:read","transactions:update","transactions:delete","transactions:manage-company","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","email-marketing:read","email-marketing:create","email-marketing:update","email-marketing:manage","client-portal:manage","landing:manage","assistant:manage","assistant-activity:read","messages:delete"]'::jsonb
  WHEN 'ACCOUNTANT' THEN '["transactions:create","transactions:read","transactions:update","transactions:delete","transactions:manage-company","users:read"]'::jsonb
  WHEN 'MEMBER' THEN '["transactions:create","transactions:read","transactions:update","transactions:delete","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","email-marketing:read","email-marketing:create","email-marketing:update","users:read"]'::jsonb
  WHEN 'USER' THEN '["transactions:create","transactions:read","transactions:update","transactions:delete","tasks:create","tasks:read","tasks:update","tasks:delete","events:create","events:read","events:update","events:delete","notes:create","notes:read","notes:update","notes:delete","workflows:create","workflows:read","workflows:update","workflows:execute","resources:create","resources:read","resources:update","resources:delete","documents:create","documents:read","documents:update","documents:delete","users:read"]'::jsonb
  WHEN 'CLIENT' THEN '["users:read"]'::jsonb
  ELSE '[]'::jsonb
END
WHERE "permissions" IS NULL;
