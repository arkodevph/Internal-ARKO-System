ALTER TABLE "AssistantConfiguration"
ALTER COLUMN "assistantName" SET DEFAULT 'NEX';

UPDATE "AssistantConfiguration"
SET "assistantName" = 'NEX'
WHERE "id" = 'system' AND "assistantName" = 'Arko Assistant';
