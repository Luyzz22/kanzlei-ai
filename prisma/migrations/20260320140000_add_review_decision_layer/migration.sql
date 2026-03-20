-- CreateEnum
CREATE TYPE "DocumentReviewNoteType" AS ENUM ('NOTE', 'DECISION_MEMO');

-- CreateEnum
CREATE TYPE "DocumentFindingSeverity" AS ENUM ('NIEDRIG', 'MITTEL', 'HOCH');

-- CreateEnum
CREATE TYPE "DocumentFindingStatus" AS ENUM ('OFFEN', 'GEKLAERT', 'AKZEPTIERT');

-- AlterTable
ALTER TABLE "Document"
ADD COLUMN "reviewDueAt" TIMESTAMP(3),
ADD COLUMN "reviewOwnerId" TEXT;

-- CreateTable
CREATE TABLE "DocumentReviewNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "DocumentReviewNoteType" NOT NULL DEFAULT 'NOTE',
    "title" VARCHAR(160),
    "body" TEXT NOT NULL,
    "sectionKey" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentReviewNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DocumentFindingSeverity" NOT NULL DEFAULT 'MITTEL',
    "status" "DocumentFindingStatus" NOT NULL DEFAULT 'OFFEN',
    "sectionKey" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "DocumentFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_tenantId_reviewDueAt_idx" ON "Document"("tenantId", "reviewDueAt");

-- CreateIndex
CREATE INDEX "Document_reviewOwnerId_idx" ON "Document"("reviewOwnerId");

-- CreateIndex
CREATE INDEX "DocumentReviewNote_tenantId_documentId_type_createdAt_idx" ON "DocumentReviewNote"("tenantId", "documentId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentReviewNote_documentId_createdAt_idx" ON "DocumentReviewNote"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentReviewNote_authorId_createdAt_idx" ON "DocumentReviewNote"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_tenantId_documentId_status_createdAt_idx" ON "DocumentFinding"("tenantId", "documentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_documentId_createdAt_idx" ON "DocumentFinding"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_createdById_createdAt_idx" ON "DocumentFinding"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentFinding_resolvedById_resolvedAt_idx" ON "DocumentFinding"("resolvedById", "resolvedAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewOwnerId_fkey" FOREIGN KEY ("reviewOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentReviewNote" ADD CONSTRAINT "DocumentReviewNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentReviewNote" ADD CONSTRAINT "DocumentReviewNote_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentReviewNote" ADD CONSTRAINT "DocumentReviewNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentFinding" ADD CONSTRAINT "DocumentFinding_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
