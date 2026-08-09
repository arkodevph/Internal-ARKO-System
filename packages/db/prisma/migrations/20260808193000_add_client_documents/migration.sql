CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'AGREEMENT', 'PROPOSAL', 'TIMELINE');
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "title" TEXT NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "invoiceNumber" TEXT,
  "projectId" TEXT,
  "clientId" TEXT,
  "content" JSONB NOT NULL DEFAULT '{}',
  "issueDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "shareToken" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentLineItem" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DocumentLineItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Document_invoiceNumber_key" ON "Document"("invoiceNumber");
CREATE UNIQUE INDEX "Document_shareToken_key" ON "Document"("shareToken");
CREATE INDEX "Document_createdById_status_idx" ON "Document"("createdById", "status");
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");
CREATE INDEX "DocumentLineItem_documentId_idx" ON "DocumentLineItem"("documentId");

ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ClientProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentLineItem" ADD CONSTRAINT "DocumentLineItem_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
