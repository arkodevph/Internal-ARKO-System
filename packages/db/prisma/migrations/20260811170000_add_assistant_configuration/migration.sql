-- CreateTable
CREATE TABLE "AssistantConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "assistantName" TEXT NOT NULL DEFAULT 'Arko Assistant',
    "personality" TEXT NOT NULL DEFAULT 'Calm, concise, practical, and direct.',
    "projectId" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'global',
    "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "gcpProjectNumber" TEXT NOT NULL DEFAULT '',
    "serviceAccountEmail" TEXT NOT NULL DEFAULT '',
    "workloadIdentityPoolId" TEXT NOT NULL DEFAULT 'vercel',
    "workloadIdentityProviderId" TEXT NOT NULL DEFAULT 'vercel',
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantConfiguration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssistantConfiguration" ADD CONSTRAINT "AssistantConfiguration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
