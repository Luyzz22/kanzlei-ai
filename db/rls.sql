-- Enterprise RLS baseline for tenant isolation
-- Pattern: application sets tenant context per request:
--   SELECT set_config('app.tenant_id', '<tenantId>', true);
-- Use SET LOCAL inside a transaction (see withTenant helper).

-- NOTE: Superusers bypass RLS. Production roles should avoid SUPERUSER/BYPASSRLS.
-- Service/migration role should be explicit and controlled (separate connection string).

-- Enable RLS
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisProviderDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisFinding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentExtraction" ENABLE ROW LEVEL SECURITY;

-- Optional hardening: force RLS even for table owner (still bypassed by SUPERUSER)
-- ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "TenantMember" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "AnalysisLog" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "AuditEvent" FORCE ROW LEVEL SECURITY;

-- Policies (USING + WITH CHECK) so SELECT/UPDATE/DELETE/INSERT are isolated
DROP POLICY IF EXISTS document_tenant_isolation ON "Document";
CREATE POLICY document_tenant_isolation ON "Document"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS tenantmember_tenant_isolation ON "TenantMember";
CREATE POLICY tenantmember_tenant_isolation ON "TenantMember"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS analysislog_tenant_isolation ON "AnalysisLog";
CREATE POLICY analysislog_tenant_isolation ON "AnalysisLog"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS auditevent_tenant_isolation ON "AuditEvent";
CREATE POLICY auditevent_tenant_isolation ON "AuditEvent"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS analysisrun_tenant_isolation ON "AnalysisRun";
CREATE POLICY analysisrun_tenant_isolation ON "AnalysisRun"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS analysisproviderdecision_tenant_isolation ON "AnalysisProviderDecision";
CREATE POLICY analysisproviderdecision_tenant_isolation ON "AnalysisProviderDecision"
  USING (
    EXISTS (
      SELECT 1 FROM "AnalysisRun" r
      WHERE r.id = "AnalysisProviderDecision"."analysisRunId"
        AND r."tenantId" = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "AnalysisRun" r
      WHERE r.id = "AnalysisProviderDecision"."analysisRunId"
        AND r."tenantId" = current_setting('app.tenant_id', true)
    )
  );

DROP POLICY IF EXISTS analysisfinding_tenant_isolation ON "AnalysisFinding";
CREATE POLICY analysisfinding_tenant_isolation ON "AnalysisFinding"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS documentextraction_tenant_isolation ON "DocumentExtraction";
CREATE POLICY documentextraction_tenant_isolation ON "DocumentExtraction"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
