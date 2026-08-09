ALTER TABLE "Workflow" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Task" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Reminder" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Note" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Event" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Sprint" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "Idea" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "JournalEntry" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "FileAttachment" ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL';

CREATE INDEX "Workflow_userId_scope_idx" ON "Workflow"("userId", "scope");
CREATE INDEX "Task_assigneeId_scope_idx" ON "Task"("assigneeId", "scope");
CREATE INDEX "Reminder_userId_scope_idx" ON "Reminder"("userId", "scope");
CREATE INDEX "Note_userId_scope_idx" ON "Note"("userId", "scope");
CREATE INDEX "Event_userId_scope_date_idx" ON "Event"("userId", "scope", "date");
CREATE INDEX "Sprint_userId_scope_startDate_idx" ON "Sprint"("userId", "scope", "startDate");
CREATE INDEX "Idea_userId_scope_createdAt_idx" ON "Idea"("userId", "scope", "createdAt");
CREATE INDEX "JournalEntry_userId_scope_date_idx" ON "JournalEntry"("userId", "scope", "date");
CREATE INDEX "FileAttachment_userId_scope_idx" ON "FileAttachment"("userId", "scope");
