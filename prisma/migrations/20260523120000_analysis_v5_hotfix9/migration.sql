-- v5.0 Hotfix 9: Stage-Chunked Pipeline Felder + CLASSIFICATION Stage

ALTER TYPE "AnalysisPipelineStageName" ADD VALUE IF NOT EXISTS 'CLASSIFICATION';

ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "currentStage" VARCHAR(32);
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "stageStateJson" JSONB;
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "classificationJson" JSONB;
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "classificationPromptKey" VARCHAR(120);
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "classificationPromptVersion" VARCHAR(32);
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "contractClassification" VARCHAR(120);
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "partyConstellation" VARCHAR(200);
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "agbKontrolleAnwendbar" BOOLEAN;
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "error" TEXT;
