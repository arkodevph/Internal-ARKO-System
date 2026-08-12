-- CreateTable
CREATE TABLE "AssistantRateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AssistantRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistantRateLimit_windowStart_idx" ON "AssistantRateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantRateLimit_userId_windowStart_key" ON "AssistantRateLimit"("userId", "windowStart");

-- AddForeignKey
ALTER TABLE "AssistantRateLimit" ADD CONSTRAINT "AssistantRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
