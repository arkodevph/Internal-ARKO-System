ALTER TABLE "ClientRequest"
  ADD COLUMN "githubOwner" TEXT,
  ADD COLUMN "githubRepo" TEXT,
  ADD COLUMN "githubBranch" TEXT,
  ADD COLUMN "githubLastSha" TEXT,
  ADD COLUMN "githubSyncedAt" TIMESTAMP(3),
  ADD COLUMN "progressCompleted" INTEGER,
  ADD COLUMN "progressTotal" INTEGER,
  ADD COLUMN "progressItems" JSONB;

CREATE TABLE "ClientRequestCommitUpdate" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "sha" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "committedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientRequestCommitUpdate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientRequestCommitUpdate_requestId_sha_key" ON "ClientRequestCommitUpdate"("requestId", "sha");
CREATE INDEX "ClientRequestCommitUpdate_requestId_committedAt_idx" ON "ClientRequestCommitUpdate"("requestId", "committedAt");
ALTER TABLE "ClientRequestCommitUpdate" ADD CONSTRAINT "ClientRequestCommitUpdate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ClientRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
