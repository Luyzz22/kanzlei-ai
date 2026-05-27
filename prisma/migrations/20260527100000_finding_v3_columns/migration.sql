-- Migration: AnalysisFinding v3 Columns
-- Adds dedicated columns for riskNature, findingType, primaryLegalBasis, referenceLegalBasis
-- Previously stored in evidenceGraph JSON blob → now queryable/indexable dedicated columns
-- Ref: DSGVO Art. 5 (Datenminimierung), EU AI Act Art. 12 (Logging), ISO 27001 A.12

ALTER TABLE "AnalysisFinding"
  ADD COLUMN IF NOT EXISTS "riskNature"          VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "findingType"          VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "primaryLegalBasis"   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "referenceLegalBasis" TEXT[] NOT NULL DEFAULT '{}';

-- Index for analytics: filter findings by riskNature per tenant
CREATE INDEX IF NOT EXISTS "AnalysisFinding_tenantId_riskNature_idx"
  ON "AnalysisFinding" ("tenantId", "riskNature");

-- Index for analytics: filter findings by findingType
CREATE INDEX IF NOT EXISTS "AnalysisFinding_analysisRunId_findingType_idx"
  ON "AnalysisFinding" ("analysisRunId", "findingType");
