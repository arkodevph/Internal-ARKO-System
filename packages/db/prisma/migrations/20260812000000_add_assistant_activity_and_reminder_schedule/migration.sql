ALTER TABLE "Reminder"
ADD COLUMN "recurrence" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN "notifyMinutesBefore" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "lastNotifiedAt" TIMESTAMP(3);

CREATE TABLE "AssistantActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssistantActivity_createdAt_idx" ON "AssistantActivity"("createdAt");
CREATE INDEX "AssistantActivity_userId_createdAt_idx" ON "AssistantActivity"("userId", "createdAt");

ALTER TABLE "AssistantActivity"
ADD CONSTRAINT "AssistantActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
