-- CreateEnum
CREATE TYPE "NormPilotReviewState" AS ENUM ('UNGEPRUEFT', 'IN_PRUEFUNG', 'FREIGEGEBEN', 'ZURUECKGEWIESEN');

-- CreateEnum
CREATE TYPE "NormPilotEvidenceStatus" AS ENUM ('COVERED', 'PARTIAL', 'MISSING', 'CONFLICTING', 'NOT_APPLICABLE', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "NormPilotGapSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "NormPilotActionStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NormPilotEvidencePackExportFormat" AS ENUM ('MARKDOWN', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "NormPilotEvidencePackExportStatus" AS ENUM ('REQUESTED', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "NormPilotRequirementSet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "frameworkLabel" VARCHAR(120),
    "scopeLabel" VARCHAR(200),
    "versionLabel" VARCHAR(80),
    "sourceKind" VARCHAR(80) NOT NULL DEFAULT 'customer_checklist',
    "sourceDocumentId" TEXT,
    "contentHash" VARCHAR(64),
    "reviewState" "NormPilotReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotRequirementSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormPilotRequirementItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementSetId" TEXT NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "customerText" TEXT,
    "normReferenceCode" VARCHAR(120),
    "sectionLabel" VARCHAR(160),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "criticality" "NormPilotGapSeverity",
    "reviewState" "NormPilotReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotRequirementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormPilotEvidenceSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT,
    "sourceType" VARCHAR(80) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "sourceHash" VARCHAR(64),
    "locator" JSONB,
    "metadata" JSONB,
    "reviewState" "NormPilotReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotEvidenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormPilotEvidenceMapping" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementItemId" TEXT NOT NULL,
    "evidenceSourceId" TEXT,
    "status" "NormPilotEvidenceStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "confidence" DOUBLE PRECISION,
    "rationale" TEXT,
    "anchorText" VARCHAR(280),
    "locator" JSONB,
    "evidenceHash" VARCHAR(64),
    "promptKey" VARCHAR(120),
    "promptVersion" VARCHAR(32),
    "provider" VARCHAR(40),
    "model" VARCHAR(120),
    "reviewState" "NormPilotReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "reviewedAt" TIMESTAMP(3),
    "reviewerLabel" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotEvidenceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormPilotGapFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementSetId" TEXT NOT NULL,
    "requirementItemId" TEXT,
    "evidenceMappingId" TEXT,
    "severity" "NormPilotGapSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "sourceSummary" JSONB,
    "confidence" DOUBLE PRECISION,
    "promptKey" VARCHAR(120),
    "promptVersion" VARCHAR(32),
    "provider" VARCHAR(40),
    "model" VARCHAR(120),
    "reviewState" "NormPilotReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotGapFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormPilotCorrectiveAction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gapFindingId" TEXT,
    "requirementItemId" TEXT,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT,
    "ownerRole" VARCHAR(120),
    "ownerLabel" VARCHAR(160),
    "dueDate" TIMESTAMP(3),
    "status" "NormPilotActionStatus" NOT NULL DEFAULT 'DRAFT',
    "acceptanceCriteria" TEXT,
    "reviewState" "NormPilotReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotCorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormPilotEvidencePackExport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementSetId" TEXT NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "format" "NormPilotEvidencePackExportFormat" NOT NULL DEFAULT 'MARKDOWN',
    "status" "NormPilotEvidencePackExportStatus" NOT NULL DEFAULT 'REQUESTED',
    "storageKey" TEXT,
    "contentHash" VARCHAR(64),
    "exportManifest" JSONB NOT NULL,
    "promptMetadata" JSONB,
    "reviewSnapshot" JSONB,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),

    CONSTRAINT "NormPilotEvidencePackExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NormPilotRequirementSet_tenantId_createdAt_idx" ON "NormPilotRequirementSet"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotRequirementSet_tenantId_reviewState_createdAt_idx" ON "NormPilotRequirementSet"("tenantId", "reviewState", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotRequirementSet_tenantId_sourceDocumentId_idx" ON "NormPilotRequirementSet"("tenantId", "sourceDocumentId");

-- CreateIndex
CREATE INDEX "NormPilotRequirementItem_tenantId_requirementSetId_sortOrde_idx" ON "NormPilotRequirementItem"("tenantId", "requirementSetId", "sortOrder");

-- CreateIndex
CREATE INDEX "NormPilotRequirementItem_tenantId_reviewState_createdAt_idx" ON "NormPilotRequirementItem"("tenantId", "reviewState", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NormPilotRequirementItem_tenantId_requirementSetId_code_key" ON "NormPilotRequirementItem"("tenantId", "requirementSetId", "code");

-- CreateIndex
CREATE INDEX "NormPilotEvidenceSource_tenantId_documentId_idx" ON "NormPilotEvidenceSource"("tenantId", "documentId");

-- CreateIndex
CREATE INDEX "NormPilotEvidenceSource_tenantId_sourceType_createdAt_idx" ON "NormPilotEvidenceSource"("tenantId", "sourceType", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotEvidenceSource_tenantId_reviewState_createdAt_idx" ON "NormPilotEvidenceSource"("tenantId", "reviewState", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotEvidenceMapping_tenantId_requirementItemId_status_idx" ON "NormPilotEvidenceMapping"("tenantId", "requirementItemId", "status");

-- CreateIndex
CREATE INDEX "NormPilotEvidenceMapping_tenantId_evidenceSourceId_idx" ON "NormPilotEvidenceMapping"("tenantId", "evidenceSourceId");

-- CreateIndex
CREATE INDEX "NormPilotEvidenceMapping_tenantId_reviewState_createdAt_idx" ON "NormPilotEvidenceMapping"("tenantId", "reviewState", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotGapFinding_tenantId_requirementSetId_severity_idx" ON "NormPilotGapFinding"("tenantId", "requirementSetId", "severity");

-- CreateIndex
CREATE INDEX "NormPilotGapFinding_tenantId_requirementItemId_idx" ON "NormPilotGapFinding"("tenantId", "requirementItemId");

-- CreateIndex
CREATE INDEX "NormPilotGapFinding_tenantId_reviewState_createdAt_idx" ON "NormPilotGapFinding"("tenantId", "reviewState", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotCorrectiveAction_tenantId_gapFindingId_idx" ON "NormPilotCorrectiveAction"("tenantId", "gapFindingId");

-- CreateIndex
CREATE INDEX "NormPilotCorrectiveAction_tenantId_status_dueDate_idx" ON "NormPilotCorrectiveAction"("tenantId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "NormPilotCorrectiveAction_tenantId_reviewState_createdAt_idx" ON "NormPilotCorrectiveAction"("tenantId", "reviewState", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotEvidencePackExport_tenantId_requirementSetId_creat_idx" ON "NormPilotEvidencePackExport"("tenantId", "requirementSetId", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotEvidencePackExport_tenantId_status_createdAt_idx" ON "NormPilotEvidencePackExport"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NormPilotEvidencePackExport_tenantId_retentionUntil_idx" ON "NormPilotEvidencePackExport"("tenantId", "retentionUntil");

-- AddForeignKey
ALTER TABLE "NormPilotRequirementSet" ADD CONSTRAINT "NormPilotRequirementSet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotRequirementSet" ADD CONSTRAINT "NormPilotRequirementSet_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotRequirementItem" ADD CONSTRAINT "NormPilotRequirementItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotRequirementItem" ADD CONSTRAINT "NormPilotRequirementItem_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "NormPilotRequirementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidenceSource" ADD CONSTRAINT "NormPilotEvidenceSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidenceSource" ADD CONSTRAINT "NormPilotEvidenceSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidenceMapping" ADD CONSTRAINT "NormPilotEvidenceMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidenceMapping" ADD CONSTRAINT "NormPilotEvidenceMapping_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "NormPilotRequirementItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidenceMapping" ADD CONSTRAINT "NormPilotEvidenceMapping_evidenceSourceId_fkey" FOREIGN KEY ("evidenceSourceId") REFERENCES "NormPilotEvidenceSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotGapFinding" ADD CONSTRAINT "NormPilotGapFinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotGapFinding" ADD CONSTRAINT "NormPilotGapFinding_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "NormPilotRequirementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotGapFinding" ADD CONSTRAINT "NormPilotGapFinding_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "NormPilotRequirementItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotGapFinding" ADD CONSTRAINT "NormPilotGapFinding_evidenceMappingId_fkey" FOREIGN KEY ("evidenceMappingId") REFERENCES "NormPilotEvidenceMapping"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotCorrectiveAction" ADD CONSTRAINT "NormPilotCorrectiveAction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotCorrectiveAction" ADD CONSTRAINT "NormPilotCorrectiveAction_gapFindingId_fkey" FOREIGN KEY ("gapFindingId") REFERENCES "NormPilotGapFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotCorrectiveAction" ADD CONSTRAINT "NormPilotCorrectiveAction_requirementItemId_fkey" FOREIGN KEY ("requirementItemId") REFERENCES "NormPilotRequirementItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidencePackExport" ADD CONSTRAINT "NormPilotEvidencePackExport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormPilotEvidencePackExport" ADD CONSTRAINT "NormPilotEvidencePackExport_requirementSetId_fkey" FOREIGN KEY ("requirementSetId") REFERENCES "NormPilotRequirementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
