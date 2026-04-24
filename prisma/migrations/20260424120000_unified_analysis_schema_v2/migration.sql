-- Unified Analysis Schema v2 — minimale, additive Erweiterungen.
-- Keine Breaking Changes: alle neuen Felder sind nullable / optional.

-- 1) AnalysisFinding: Formulierungsvorschlag
ALTER TABLE "AnalysisFinding"
  ADD COLUMN IF NOT EXISTS "suggestedRevision" TEXT;

-- 2) DocumentExtraction: strukturierte Daten + Deadlines (Json-Blobs)
ALTER TABLE "DocumentExtraction"
  ADD COLUMN IF NOT EXISTS "structuredData" JSONB;

ALTER TABLE "DocumentExtraction"
  ADD COLUMN IF NOT EXISTS "deadlines" JSONB;

-- Kein Index nötig — diese Felder werden nur read-by-id zusammen mit
-- dem AnalysisRun gelesen, nicht gesucht oder gefiltert.
