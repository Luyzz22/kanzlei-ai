-- =============================================================================
-- KanzleiAI — Row-Level Security (RLS) Policies
-- =============================================================================
-- Aktiviert Mandantentrennung auf Datenbankebene.
-- Jede Tabelle mit tenantId bekommt eine Policy die sicherstellt,
-- dass nur Zeilen des eigenen Tenants gelesen/geschrieben werden können.
--
-- Voraussetzung: Die Anwendung setzt vor jeder Abfrage:
--   SET app.current_tenant_id = '<tenant-id>';
--
-- Ausführung: psql -f db/rls.sql <DATABASE_URL>
-- =============================================================================

-- Helper: Aktuelle Tenant-ID aus der Session-Variable lesen
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '');
$$ LANGUAGE sql STABLE;

-- =============================================================================
-- RLS für alle Tenant-gebundenen Tabellen
-- =============================================================================

-- 1. Document
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_document ON "Document";
CREATE POLICY tenant_isolation_document ON "Document"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 2. DocumentComment
ALTER TABLE "DocumentComment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_document_comment ON "DocumentComment";
CREATE POLICY tenant_isolation_document_comment ON "DocumentComment"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 3. DocumentReviewNote
ALTER TABLE "DocumentReviewNote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_review_note ON "DocumentReviewNote";
CREATE POLICY tenant_isolation_review_note ON "DocumentReviewNote"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 4. DocumentFinding
ALTER TABLE "DocumentFinding" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_document_finding ON "DocumentFinding";
CREATE POLICY tenant_isolation_document_finding ON "DocumentFinding"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 5. AuditEvent
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_audit_event ON "AuditEvent";
CREATE POLICY tenant_isolation_audit_event ON "AuditEvent"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 6. AnalysisLog
ALTER TABLE "AnalysisLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_analysis_log ON "AnalysisLog";
CREATE POLICY tenant_isolation_analysis_log ON "AnalysisLog"
  USING ("tenantId" = current_tenant_id() OR "tenantId" IS NULL)
  WITH CHECK ("tenantId" = current_tenant_id() OR "tenantId" IS NULL);

-- 7. AnalysisRun
ALTER TABLE "AnalysisRun" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_analysis_run ON "AnalysisRun";
CREATE POLICY tenant_isolation_analysis_run ON "AnalysisRun"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 8. AnalysisFinding
ALTER TABLE "AnalysisFinding" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_analysis_finding ON "AnalysisFinding";
CREATE POLICY tenant_isolation_analysis_finding ON "AnalysisFinding"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 9. AnalysisFindingReview
ALTER TABLE "AnalysisFindingReview" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_finding_review ON "AnalysisFindingReview";
CREATE POLICY tenant_isolation_finding_review ON "AnalysisFindingReview"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 10. DocumentExtraction
ALTER TABLE "DocumentExtraction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_extraction ON "DocumentExtraction";
CREATE POLICY tenant_isolation_extraction ON "DocumentExtraction"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 11. TenantGovernanceSettings
ALTER TABLE "TenantGovernanceSettings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_governance ON "TenantGovernanceSettings";
CREATE POLICY tenant_isolation_governance ON "TenantGovernanceSettings"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- 12. TenantMember (Nutzer sehen nur ihren eigenen Tenant)
ALTER TABLE "TenantMember" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_member ON "TenantMember";
CREATE POLICY tenant_isolation_member ON "TenantMember"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());

-- =============================================================================
-- Tabellen OHNE RLS (übergreifend)
-- =============================================================================
-- User, Account, Session, VerificationToken — kein tenantId, übergreifend
-- PromptDefinition, EvalRun, EvalResultRow — system-wide
-- PromptRelease — hat tenantId aber ist optional (system-wide prompts)

-- =============================================================================
-- Bypass für den Prisma Service-Account (optional)
-- =============================================================================
-- Falls Prisma mit einem dedizierten DB-User läuft:
-- ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
-- CREATE POLICY bypass_rls_for_service ON "Document"
--   FOR ALL TO prisma_service USING (true) WITH CHECK (true);

-- =============================================================================
-- Verifikation
-- =============================================================================
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
