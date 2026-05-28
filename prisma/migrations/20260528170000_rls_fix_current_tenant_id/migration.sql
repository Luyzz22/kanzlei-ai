-- =====================================================================
-- RLS Policy Fix: app.tenant_id → app.current_tenant_id
-- =====================================================================
--
-- Security Audit 27.05.2026, Befund SOFORT-2 (Follow-up):
--
-- PROBLEM: withTenant (tenant-context-core.ts) setzt app.current_tenant_id,
--          aber alle RLS-Policies aus Migration 20260424180000 lesen
--          app.tenant_id → Mismatch → RLS-Schutz greift nicht wenn
--          DATABASE_URL auf kanzlei_app (BYPASSRLS=false) wechselt.
--
-- FIX: Alle 13 Policies atomar auf app.current_tenant_id umstellen.
--
-- Backward-kompatibel: neondb_owner (BYPASSRLS=true) sieht keinen Bruch.
-- Idempotent: DROP IF EXISTS + CREATE.
--
-- Ref: withTenant → set_config('app.current_tenant_id', tenantId, true)
--      db/rls.sql (approved canonical definition)
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. AnalysisFinding
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisFinding";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisFinding";
CREATE POLICY tenant_isolation_select ON "AnalysisFinding"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisFinding"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 2. AnalysisFindingReview
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisFindingReview";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisFindingReview";
CREATE POLICY tenant_isolation_select ON "AnalysisFindingReview"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisFindingReview"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 3. AnalysisLog (tenantId nullable — System-Logs ohne Tenant)
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisLog";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisLog";
CREATE POLICY tenant_isolation_select ON "AnalysisLog"
  FOR SELECT
  USING ("tenantId" IS NULL OR "tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisLog"
  FOR ALL
  USING ("tenantId" IS NULL OR "tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 4. AnalysisRun
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisRun";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisRun";
CREATE POLICY tenant_isolation_select ON "AnalysisRun"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisRun"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 5. AuditEvent
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "AuditEvent";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AuditEvent";
CREATE POLICY tenant_isolation_select ON "AuditEvent"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AuditEvent"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 6. Document
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "Document";
DROP POLICY IF EXISTS tenant_isolation_modify ON "Document";
CREATE POLICY tenant_isolation_select ON "Document"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "Document"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 7. DocumentComment
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentComment";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentComment";
CREATE POLICY tenant_isolation_select ON "DocumentComment"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentComment"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 8. DocumentExtraction
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentExtraction";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentExtraction";
CREATE POLICY tenant_isolation_select ON "DocumentExtraction"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentExtraction"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 9. DocumentFinding
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentFinding";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentFinding";
CREATE POLICY tenant_isolation_select ON "DocumentFinding"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentFinding"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 10. DocumentReviewNote
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentReviewNote";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentReviewNote";
CREATE POLICY tenant_isolation_select ON "DocumentReviewNote"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentReviewNote"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 11. PromptRelease
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "PromptRelease";
DROP POLICY IF EXISTS tenant_isolation_modify ON "PromptRelease";
CREATE POLICY tenant_isolation_select ON "PromptRelease"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "PromptRelease"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 12. TenantGovernanceSettings
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "TenantGovernanceSettings";
DROP POLICY IF EXISTS tenant_isolation_modify ON "TenantGovernanceSettings";
CREATE POLICY tenant_isolation_select ON "TenantGovernanceSettings"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "TenantGovernanceSettings"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 13. TenantMember
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS tenant_isolation_select ON "TenantMember";
DROP POLICY IF EXISTS tenant_isolation_modify ON "TenantMember";
CREATE POLICY tenant_isolation_select ON "TenantMember"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "TenantMember"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 14. DynamicsIntegration (Migration 20260425000000 nutzte app.tenant_id)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "DynamicsIntegration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsIntegration" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "DynamicsIntegration";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DynamicsIntegration";
CREATE POLICY tenant_isolation_select ON "DynamicsIntegration"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DynamicsIntegration"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 15. DynamicsVendor (fehlende RLS — tenantId-Spalte vorhanden)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "DynamicsVendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsVendor" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "DynamicsVendor";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DynamicsVendor";
CREATE POLICY tenant_isolation_select ON "DynamicsVendor"
  FOR SELECT
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DynamicsVendor"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
