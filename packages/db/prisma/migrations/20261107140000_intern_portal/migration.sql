-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'INTERN';

-- CreateTable
CREATE TABLE "InternProfile" (
    "userId" TEXT NOT NULL,
    "school" TEXT NOT NULL DEFAULT '',
    "course" TEXT NOT NULL DEFAULT '',
    "track" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "startDate" DATE,
    "requiredHours" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "InternLearningLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "learned" TEXT NOT NULL,
    "workedOn" TEXT NOT NULL DEFAULT '',
    "blockers" TEXT NOT NULL DEFAULT '',
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedback" TEXT NOT NULL DEFAULT '',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternLearningLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternActivity" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resourceUrl" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "response" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "feedback" TEXT NOT NULL DEFAULT '',
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternActivityAssignment" (
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternActivityAssignment_pkey" PRIMARY KEY ("userId","activityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternLearningLog_userId_date_key" ON "InternLearningLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InternSubmission_userId_activityId_key" ON "InternSubmission"("userId", "activityId");

-- AddForeignKey
ALTER TABLE "InternProfile" ADD CONSTRAINT "InternProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternLearningLog" ADD CONSTRAINT "InternLearningLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternActivity" ADD CONSTRAINT "InternActivity_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternSubmission" ADD CONSTRAINT "InternSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternSubmission" ADD CONSTRAINT "InternSubmission_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "InternActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternActivityAssignment" ADD CONSTRAINT "InternActivityAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternActivityAssignment" ADD CONSTRAINT "InternActivityAssignment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "InternActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
