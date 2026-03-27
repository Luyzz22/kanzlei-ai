-- Postgres: neue Enum-Werte dürfen erst nach Commit genutzt werden (55P04).
-- Daher nur ALTER TYPE in dieser Migration; Nutzung in 20260328103000_analysis_governance_eval.
ALTER TYPE "AnalysisReviewState" ADD VALUE IF NOT EXISTS 'ENTWURF';
ALTER TYPE "AnalysisReviewState" ADD VALUE IF NOT EXISTS 'ANALYSIERT';
ALTER TYPE "AnalysisReviewState" ADD VALUE IF NOT EXISTS 'ZURUECKGEWIESEN';
ALTER TYPE "AnalysisReviewState" ADD VALUE IF NOT EXISTS 'WIEDERHOLUNG_ANGEFORDERT';
