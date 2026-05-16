-- Evidence Graph MVP: Add evidenceGraph JSON column to AnalysisFinding
-- Stores structured reasoning chain per finding: normBasis, reasoningSteps, counterArguments, limitations, confidenceFactors
-- Backward-compatible: nullable JSON, existing findings remain unaffected.

ALTER TABLE "AnalysisFinding" ADD COLUMN "evidenceGraph" JSONB;
