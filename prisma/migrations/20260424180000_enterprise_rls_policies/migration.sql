-- =====================================================================
-- Enterprise Row-Level Security (RLS) Migration
-- =====================================================================
--
-- Aktiviert RLS auf allen tenant-partitionierten Tabellen.
-- Idempotent (DROP POLICY IF EXISTS + CREATE POLICY).
-- Backward-kompatibel: solange DATABASE_URL als Owner connected,
-- werden Policies durch BYPASSRLS umgangen — kein Bruch.
--
-- Sobald DATABASE_URL auf den separaten kanzlei_app-User zeigt
-- (siehe scripts/enterprise-rls-setup.sql), greift RLS scharf.
--
-- Sicherheits-Modell:
--   - Jede Tabelle hat ENABLE ROW LEVEL SECURITY + FORCE
--   - FORCE = greift auch für Table-Owner (Defense-in-Depth)
--   - Policy USING-Clause: tenant_id = current_setting('app.tenant_id')
--   - current_setting(..., true) → returns NULL wenn nicht gesetzt
--     (verhindert Crash bei Migration ohne tenantId-Context)
--   - NULL = Policy verweigert Zeile → safe by default
--
-- Tabellen-Liste (13 tenant-partitionierte Tabellen):
--   - AnalysisFinding, AnalysisFindingReview, AnalysisLog,
--     AnalysisRun, AuditEvent, Document, DocumentComment,
--     DocumentExtraction, DocumentFinding, DocumentReviewNote,
--     PromptRelease, TenantGovernanceSettings, TenantMember
-- =====================================================================

-- Helper: Policy-Definition kapseln (DRY)
-- Hinweis: Postgres erlaubt keine generischen Policy-Functions, daher
-- expliziter Block pro Tabelle. Macht aber den Audit einfacher.

-- ─────────────────────────────────────────────────────────────────────
-- 1. AnalysisFinding
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "AnalysisFinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisFinding" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisFinding";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisFinding";
CREATE POLICY tenant_isolation_select ON "AnalysisFinding"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisFinding"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 2. AnalysisFindingReview
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "AnalysisFindingReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisFindingReview" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisFindingReview";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisFindingReview";
CREATE POLICY tenant_isolation_select ON "AnalysisFindingReview"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisFindingReview"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 3. AnalysisLog (tenantId ist nullable!)
--    Spezial-Policy: NULL ist erlaubt (System-Logs ohne Tenant-Bezug)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "AnalysisLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisLog";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisLog";
CREATE POLICY tenant_isolation_select ON "AnalysisLog"
  FOR SELECT
  USING ("tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisLog"
  FOR ALL
  USING ("tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 4. AnalysisRun
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "AnalysisRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisRun" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "AnalysisRun";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AnalysisRun";
CREATE POLICY tenant_isolation_select ON "AnalysisRun"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AnalysisRun"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 5. AuditEvent
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "AuditEvent";
DROP POLICY IF EXISTS tenant_isolation_modify ON "AuditEvent";
CREATE POLICY tenant_isolation_select ON "AuditEvent"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "AuditEvent"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 6. Document
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "Document";
DROP POLICY IF EXISTS tenant_isolation_modify ON "Document";
CREATE POLICY tenant_isolation_select ON "Document"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "Document"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 7. DocumentComment
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "DocumentComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentComment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentComment";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentComment";
CREATE POLICY tenant_isolation_select ON "DocumentComment"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentComment"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 8. DocumentExtraction
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "DocumentExtraction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentExtraction" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentExtraction";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentExtraction";
CREATE POLICY tenant_isolation_select ON "DocumentExtraction"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentExtraction"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 9. DocumentFinding
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "DocumentFinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentFinding" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentFinding";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentFinding";
CREATE POLICY tenant_isolation_select ON "DocumentFinding"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentFinding"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 10. DocumentReviewNote
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "DocumentReviewNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentReviewNote" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "DocumentReviewNote";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DocumentReviewNote";
CREATE POLICY tenant_isolation_select ON "DocumentReviewNote"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "DocumentReviewNote"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 11. PromptRelease
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "PromptRelease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromptRelease" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "PromptRelease";
DROP POLICY IF EXISTS tenant_isolation_modify ON "PromptRelease";
CREATE POLICY tenant_isolation_select ON "PromptRelease"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "PromptRelease"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 12. TenantGovernanceSettings
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "TenantGovernanceSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantGovernanceSettings" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "TenantGovernanceSettings";
DROP POLICY IF EXISTS tenant_isolation_modify ON "TenantGovernanceSettings";
CREATE POLICY tenant_isolation_select ON "TenantGovernanceSettings"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_modify ON "TenantGovernanceSettings"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────
-- 13. TenantMember
--    Spezialfall: TenantMember-Lookup darf NICHT durch RLS blockiert
--    werden, weil der Tenant-Context-Resolver (resolveTenantContextForUser)
--    diese Tabelle BEVOR die Tenant-Variable gesetzt wird abfragt.
--    Lösung: Policy erlaubt SELECT auch ohne app.tenant_id, aber der
--    User-Owner-Match wird auf User-Ebene geprueft (User-ID kommt aus Session,
--    nicht aus Tenant-Context). Modifikationen brauchen weiterhin Tenant-Scope.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE "TenantMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantMember" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON "TenantMember";
DROP POLICY IF EXISTS tenant_isolation_modify ON "TenantMember";
-- Lesezugriff: erlaubt wenn Tenant-Context passt ODER (kritisch!) wenn
-- noch kein Tenant-Context gesetzt ist (für Initial-Resolve nach Login).
CREATE POLICY tenant_isolation_select ON "TenantMember"
  FOR SELECT
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
    OR "tenantId" = current_setting('app.tenant_id', true)
  );
-- Modifikation: nur im aktiven Tenant-Context.
CREATE POLICY tenant_isolation_modify ON "TenantMember"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

-- =====================================================================
-- Verifikation: Policies pro Tabelle anzeigen
-- =====================================================================
-- (Auskommentiert — kann manuell bei Bedarf ausgeführt werden:)
--
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
