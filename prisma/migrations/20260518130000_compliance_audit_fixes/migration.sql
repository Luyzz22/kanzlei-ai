-- Compliance Audit Fixes (R-02, R-06)
-- R-02: Provider-Allowlist und EU-Only-Modus pro Tenant
-- R-06: Retention-Felder für DSGVO Art. 5, 17, 25

-- Provider-Governance pro Tenant
ALTER TABLE "TenantGovernanceSettings" ADD COLUMN "allowedProviders" TEXT[];
ALTER TABLE "TenantGovernanceSettings" ADD COLUMN "preferEuModels" BOOLEAN NOT NULL DEFAULT false;

-- Retention-Felder auf Document
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "retentionUntil" TIMESTAMP(3);

-- Retention-Felder auf AnalysisRun
ALTER TABLE "AnalysisRun" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Index für Retention-Purge-Job
CREATE INDEX IF NOT EXISTS "Document_retentionUntil_idx" ON "Document"("retentionUntil") WHERE "retentionUntil" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Document_deletedAt_idx" ON "Document"("deletedAt") WHERE "deletedAt" IS NOT NULL;
