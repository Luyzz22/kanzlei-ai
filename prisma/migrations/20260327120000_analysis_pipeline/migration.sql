-- CreateEnum
CREATE TYPE "AiProviderKind" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE_GEMINI', 'LLAMA_COMPAT');

-- CreateEnum
CREATE TYPE "AnalysisRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisReviewState" AS ENUM ('UNGEPRUEFT', 'IN_PRUEFUNG', 'FREIGEGEBEN');

-- CreateEnum
CREATE TYPE "AnalysisPipelineStageName" AS ENUM ('EXTRACTION', 'RISK_AND_GUIDANCE');

-- AlterTable
ALTER TABLE "AnalysisLog" ADD COLUMN "analysisRunId" TEXT;

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AnalysisRunStatus" NOT NULL DEFAULT 'QUEUED',
    "promptVersion" VARCHAR(32) NOT NULL DEFAULT '1',
    "inputTextHash" VARCHAR(64),
    "documentContentHash" VARCHAR(64),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "primaryProvider" "AiProviderKind",
    "primaryModel" VARCHAR(120),
    "routerSummary" TEXT,
    "fallbackModelKeys" JSONB,
    "structuredOutputValid" BOOLEAN NOT NULL DEFAULT false,
    "validationErrorSummary" TEXT,
    "aggregateConfidence" DOUBLE PRECISION,
    "riskScore01" DOUBLE PRECISION,
    "errorCode" VARCHAR(64),
    "fallbackReason" TEXT,
    "reviewState" "AnalysisReviewState" NOT NULL DEFAULT 'UNGEPRUEFT',
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalCostEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "recommendedMeasures" JSONB,
    "negotiationHints" JSONB,
    "explanationSummary" TEXT,

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisProviderDecision" (
    "id" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "stage" "AnalysisPipelineStageName" NOT NULL,
    "attemptOrder" INTEGER NOT NULL,
    "provider" "AiProviderKind" NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "selectionReason" TEXT NOT NULL,
    "wasPrimaryChoice" BOOLEAN NOT NULL DEFAULT false,
    "wasSuccessful" BOOLEAN NOT NULL DEFAULT false,
    "fallbackFromProvider" "AiProviderKind",
    "latencyMs" INTEGER,
    "tokensUsed" INTEGER,
    "errorCode" VARCHAR(64),
    "structuredValid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AnalysisProviderDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "DocumentFindingSeverity" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "sourceStage" "AnalysisPipelineStageName",
    "clauseRef" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentExtraction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "analysisRunId" TEXT NOT NULL,
    "contractType" VARCHAR(120) NOT NULL,
    "parties" JSONB NOT NULL,
    "term" JSONB NOT NULL,
    "legalTopics" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "promptVersion" VARCHAR(32) NOT NULL,
    "contentHash" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisRun_tenantId_documentId_startedAt_idx" ON "AnalysisRun"("tenantId", "documentId", "startedAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_tenantId_status_startedAt_idx" ON "AnalysisRun"("tenantId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_documentId_startedAt_idx" ON "AnalysisRun"("documentId", "startedAt");

-- CreateIndex
CREATE INDEX "AnalysisProviderDecision_analysisRunId_stage_attemptOrder_idx" ON "AnalysisProviderDecision"("analysisRunId", "stage", "attemptOrder");

-- CreateIndex
CREATE INDEX "AnalysisFinding_tenantId_documentId_createdAt_idx" ON "AnalysisFinding"("tenantId", "documentId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisFinding_analysisRunId_idx" ON "AnalysisFinding"("analysisRunId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentExtraction_analysisRunId_key" ON "DocumentExtraction"("analysisRunId");

-- CreateIndex
CREATE INDEX "DocumentExtraction_tenantId_documentId_idx" ON "DocumentExtraction"("tenantId", "documentId");

-- CreateIndex
CREATE INDEX "AnalysisLog_analysisRunId_idx" ON "AnalysisLog"("analysisRunId");

-- AddForeignKey
ALTER TABLE "AnalysisLog" ADD CONSTRAINT "AnalysisLog_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisProviderDecision" ADD CONSTRAINT "AnalysisProviderDecision_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFinding" ADD CONSTRAINT "AnalysisFinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFinding" ADD CONSTRAINT "AnalysisFinding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFinding" ADD CONSTRAINT "AnalysisFinding_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExtraction" ADD CONSTRAINT "DocumentExtraction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExtraction" ADD CONSTRAINT "DocumentExtraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentExtraction" ADD CONSTRAINT "DocumentExtraction_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
