-- Backfill: tasks created before mandatory deadlines inherit their creation date
UPDATE "Task" SET "dueDate" = "createdAt" WHERE "dueDate" IS NULL;

-- PRD: every task carries a deadline from day one
ALTER TABLE "Task" ALTER COLUMN "dueDate" SET NOT NULL;

-- CreateTable
CREATE TABLE "ReviewRecord" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "prLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewRecord_taskId_idx" ON "ReviewRecord"("taskId");

-- CreateIndex
CREATE INDEX "ReviewRecord_reviewerId_idx" ON "ReviewRecord"("reviewerId");

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
