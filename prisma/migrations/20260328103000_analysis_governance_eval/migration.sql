-- CreateEnum
CREATE TYPE "PromptDefinitionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED');
CREATE TYPE "PromptTaskStage" AS ENUM ('EXTRACTION', 'RISK_AND_GUIDANCE');
CREATE TYPE "FindingReviewDecision" AS ENUM ('AKZEPTIERT', 'ABGELEHNT', 'ANGEPASST');

-- AlterTable AnalysisRun
ALTER TABLE "AnalysisRun" ADD COLUMN "promptBundleKey" VARCHAR(120) NOT NULL DEFAULT 'contract_analysis.default';
ALTER TABLE "AnalysisRun" ADD COLUMN "extractionPromptKey" VARCHAR(120) NOT NULL DEFAULT 'contract.extraction.default';
ALTER TABLE "AnalysisRun" ADD COLUMN "extractionPromptVersion" VARCHAR(32) NOT NULL DEFAULT '2025-03-27';
ALTER TABLE "AnalysisRun" ADD COLUMN "riskPromptKey" VARCHAR(120) NOT NULL DEFAULT 'contract.risk_guidance.default';
ALTER TABLE "AnalysisRun" ADD COLUMN "riskPromptVersion" VARCHAR(32) NOT NULL DEFAULT '2025-03-27';
ALTER TABLE "AnalysisRun" ADD COLUMN "runSequence" INTEGER NOT NULL DEFAULT 1;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "tenantId", "documentId" ORDER BY "startedAt") AS rn
  FROM "AnalysisRun"
)
UPDATE "AnalysisRun" AS r
SET "runSequence" = ranked.rn
FROM ranked
WHERE r.id = ranked.id;

UPDATE "AnalysisRun"
SET "reviewState" = 'ANALYSIERT'
WHERE "status" = 'COMPLETED' AND "reviewState" = 'UNGEPRUEFT';

-- AlterTable AnalysisFinding
ALTER TABLE "AnalysisFinding" ADD COLUMN "sourceSpan" TEXT;

-- CreateTable PromptDefinition
CREATE TABLE "PromptDefinition" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "version" VARCHAR(32) NOT NULL,
    "purpose" TEXT NOT NULL,
    "contractTypeScope" JSONB,
    "compatibleProviders" JSONB,
    "status" "PromptDefinitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromptDefinition_key_version_key" ON "PromptDefinition"("key", "version");
CREATE INDEX "PromptDefinition_key_status_idx" ON "PromptDefinition"("key", "status");

-- CreateTable PromptRelease
CREATE TABLE "PromptRelease" (
    "id" TEXT NOT NULL,
    "taskStage" "PromptTaskStage" NOT NULL,
    "contractTypePattern" VARCHAR(120) NOT NULL DEFAULT '*',
    "promptDefinitionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptRelease_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PromptRelease_taskStage_active_contractTypePattern_idx" ON "PromptRelease"("taskStage", "active", "contractTypePattern");
CREATE INDEX "PromptRelease_tenantId_taskStage_active_idx" ON "PromptRelease"("tenantId", "taskStage", "active");

-- CreateTable AnalysisFindingReview
CREATE TABLE "AnalysisFindingReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "analysisFindingId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "FindingReviewDecision" NOT NULL,
    "comment" TEXT,
    "modifiedTitle" VARCHAR(240),
    "modifiedDescription" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisFindingReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalysisFindingReview_tenantId_analysisFindingId_reviewedAt_idx" ON "AnalysisFindingReview"("tenantId", "analysisFindingId", "reviewedAt");
CREATE INDEX "AnalysisFindingReview_analysisRunId_idx" ON "AnalysisFindingReview"("analysisRunId");
CREATE INDEX "AnalysisFindingReview_reviewerId_reviewedAt_idx" ON "AnalysisFindingReview"("reviewerId", "reviewedAt");

-- CreateTable EvalRun
CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "evaluatorName" VARCHAR(64) NOT NULL DEFAULT 'local',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "configSnapshot" JSONB,
    "reportJson" JSONB,
    "summaryMarkdown" TEXT,

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvalRun_createdAt_idx" ON "EvalRun"("createdAt");

-- CreateTable EvalResultRow
CREATE TABLE "EvalResultRow" (
    "id" TEXT NOT NULL,
    "evalRunId" TEXT NOT NULL,
    "caseId" VARCHAR(120) NOT NULL,
    "providerLabel" VARCHAR(64),
    "modelLabel" VARCHAR(120),
    "promptVersion" VARCHAR(32),
    "metricsJson" JSONB NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "costEstimate" DOUBLE PRECISION,

    CONSTRAINT "EvalResultRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EvalResultRow_evalRunId_caseId_idx" ON "EvalResultRow"("evalRunId", "caseId");

-- AddForeignKey
ALTER TABLE "PromptRelease" ADD CONSTRAINT "PromptRelease_promptDefinitionId_fkey" FOREIGN KEY ("promptDefinitionId") REFERENCES "PromptDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptRelease" ADD CONSTRAINT "PromptRelease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalysisFindingReview" ADD CONSTRAINT "AnalysisFindingReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisFindingReview" ADD CONSTRAINT "AnalysisFindingReview_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisFindingReview" ADD CONSTRAINT "AnalysisFindingReview_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisFindingReview" ADD CONSTRAINT "AnalysisFindingReview_analysisFindingId_fkey" FOREIGN KEY ("analysisFindingId") REFERENCES "AnalysisFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisFindingReview" ADD CONSTRAINT "AnalysisFindingReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvalResultRow" ADD CONSTRAINT "EvalResultRow_evalRunId_fkey" FOREIGN KEY ("evalRunId") REFERENCES "EvalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
