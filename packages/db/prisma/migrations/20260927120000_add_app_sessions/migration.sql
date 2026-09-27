CREATE TABLE "AppSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "authVersion" INTEGER NOT NULL,
    "accessExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppSession_accessTokenHash_key" ON "AppSession"("accessTokenHash");
CREATE UNIQUE INDEX "AppSession_refreshTokenHash_key" ON "AppSession"("refreshTokenHash");
CREATE INDEX "AppSession_userId_application_idx" ON "AppSession"("userId", "application");
CREATE INDEX "AppSession_refreshExpiresAt_idx" ON "AppSession"("refreshExpiresAt");

ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
