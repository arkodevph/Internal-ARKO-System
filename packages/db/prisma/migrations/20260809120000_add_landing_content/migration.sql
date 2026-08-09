-- CreateTable
CREATE TABLE "LandingContent" (
  "id" TEXT NOT NULL,
  "singleton" BOOLEAN NOT NULL DEFAULT true,
  "content" JSONB NOT NULL DEFAULT '{}',
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LandingContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingContent_singleton_key" ON "LandingContent"("singleton");

-- AddForeignKey
ALTER TABLE "LandingContent" ADD CONSTRAINT "LandingContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
