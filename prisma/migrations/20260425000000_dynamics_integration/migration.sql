-- =====================================================================
-- Dynamics 365 Business Central Integration
-- =====================================================================
-- Pro Tenant EINE Integration (1:1 TenantMember), damit verschiedene
-- Tenants (DERMALOG, SBS, ...) separate Dynamics-Instanzen anbinden
-- koennen.
--
-- Secret-Speicherung: clientSecret wird via AES-256-GCM verschluesselt.
-- Klartext verlaesst die DB nie. Entschluesselung nur im Server-Prozess
-- via DYNAMICS_ENCRYPTION_KEY (ENV).
-- =====================================================================

CREATE TABLE IF NOT EXISTS "DynamicsIntegration" (
  "id"                  TEXT PRIMARY KEY,
  "tenantId"            TEXT NOT NULL UNIQUE,

  -- Azure / Entra ID Context
  "azureTenantId"       VARCHAR(64)  NOT NULL,
  "clientId"            VARCHAR(64)  NOT NULL,

  -- Encrypted Client Secret: format "v1:<iv_base64>:<authTag_base64>:<ciphertext_base64>"
  -- Schema-Version-Prefix erlaubt spaetere Rotation ohne Breaking Change
  "clientSecretEncrypted" TEXT NOT NULL,

  -- Business Central Context
  "environment"         VARCHAR(64)  NOT NULL DEFAULT 'Production',
  "companyId"           VARCHAR(64),
  "companyName"         VARCHAR(200),
  "baseUrl"             VARCHAR(300) NOT NULL DEFAULT 'https://api.businesscentral.dynamics.com/v2.0',

  -- Sync state
  "syncEnabled"         BOOLEAN      NOT NULL DEFAULT false,
  "webhookEnabled"      BOOLEAN      NOT NULL DEFAULT false,
  "lastSyncAt"          TIMESTAMP(3),
  "lastSyncStatus"      VARCHAR(32),
  "lastSyncError"       TEXT,

  -- Audit
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key zum Tenant, Cascade-Delete bei Tenant-Loeschung
  CONSTRAINT "DynamicsIntegration_tenant_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Fast lookup per Tenant
CREATE UNIQUE INDEX IF NOT EXISTS "DynamicsIntegration_tenantId_idx"
  ON "DynamicsIntegration"("tenantId");

-- Enable RLS (konsistent mit uebrigen tenant-Tabellen aus Phase B)
ALTER TABLE "DynamicsIntegration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsIntegration" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_select ON "DynamicsIntegration";
DROP POLICY IF EXISTS tenant_isolation_modify ON "DynamicsIntegration";

CREATE POLICY tenant_isolation_select ON "DynamicsIntegration"
  FOR SELECT
  USING ("tenantId" = current_setting('app.tenant_id', true));

CREATE POLICY tenant_isolation_modify ON "DynamicsIntegration"
  FOR ALL
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
