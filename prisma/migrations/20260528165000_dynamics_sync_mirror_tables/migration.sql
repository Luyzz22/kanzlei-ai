-- History repair: create Dynamics 365 Business Central mirror tables before
-- 20260528170000_rls_fix_current_tenant_id applies RLS policies to them.
-- Additive only: no DROP, TRUNCATE, DELETE, or data rewrite.

CREATE TABLE IF NOT EXISTS "DynamicsVendor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bcId" VARCHAR(64) NOT NULL,
    "number" VARCHAR(32) NOT NULL,
    "displayName" VARCHAR(300) NOT NULL,
    "addressLine1" VARCHAR(300),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "phoneNumber" VARCHAR(64),
    "email" VARCHAR(200),
    "balance" DECIMAL(18,2),
    "currencyCode" VARCHAR(10),
    "lastModifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedOrgName" VARCHAR(300),
    "matchConfidence" DOUBLE PRECISION,

    CONSTRAINT "DynamicsVendor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DynamicsPurchaseOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bcId" VARCHAR(64) NOT NULL,
    "number" VARCHAR(32) NOT NULL,
    "orderDate" TIMESTAMP(3),
    "vendorId" VARCHAR(64),
    "vendorNumber" VARCHAR(32),
    "vendorName" VARCHAR(300),
    "status" VARCHAR(32),
    "totalAmount" DECIMAL(18,2),
    "currencyCode" VARCHAR(10),
    "lastModifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicsPurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DynamicsPurchaseInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bcId" VARCHAR(64) NOT NULL,
    "number" VARCHAR(32) NOT NULL,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "vendorId" VARCHAR(64),
    "vendorNumber" VARCHAR(32),
    "vendorName" VARCHAR(300),
    "status" VARCHAR(32),
    "totalAmount" DECIMAL(18,2),
    "remainingAmount" DECIMAL(18,2),
    "currencyCode" VARCHAR(10),
    "lastModifiedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicsPurchaseInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DynamicsVendor_tenantId_bcId_key"
  ON "DynamicsVendor"("tenantId", "bcId");
CREATE INDEX IF NOT EXISTS "DynamicsVendor_tenantId_displayName_idx"
  ON "DynamicsVendor"("tenantId", "displayName");
CREATE INDEX IF NOT EXISTS "DynamicsVendor_tenantId_number_idx"
  ON "DynamicsVendor"("tenantId", "number");

CREATE UNIQUE INDEX IF NOT EXISTS "DynamicsPurchaseOrder_tenantId_bcId_key"
  ON "DynamicsPurchaseOrder"("tenantId", "bcId");
CREATE INDEX IF NOT EXISTS "DynamicsPurchaseOrder_tenantId_vendorId_idx"
  ON "DynamicsPurchaseOrder"("tenantId", "vendorId");
CREATE INDEX IF NOT EXISTS "DynamicsPurchaseOrder_tenantId_orderDate_idx"
  ON "DynamicsPurchaseOrder"("tenantId", "orderDate");

CREATE UNIQUE INDEX IF NOT EXISTS "DynamicsPurchaseInvoice_tenantId_bcId_key"
  ON "DynamicsPurchaseInvoice"("tenantId", "bcId");
CREATE INDEX IF NOT EXISTS "DynamicsPurchaseInvoice_tenantId_vendorId_idx"
  ON "DynamicsPurchaseInvoice"("tenantId", "vendorId");
CREATE INDEX IF NOT EXISTS "DynamicsPurchaseInvoice_tenantId_invoiceDate_idx"
  ON "DynamicsPurchaseInvoice"("tenantId", "invoiceDate");

DO $$
BEGIN
  ALTER TABLE "DynamicsVendor"
    ADD CONSTRAINT "DynamicsVendor_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "DynamicsIntegration"("tenantId")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "DynamicsPurchaseOrder"
    ADD CONSTRAINT "DynamicsPurchaseOrder_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "DynamicsIntegration"("tenantId")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "DynamicsPurchaseInvoice"
    ADD CONSTRAINT "DynamicsPurchaseInvoice_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "DynamicsIntegration"("tenantId")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "DynamicsVendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsVendor" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsPurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsPurchaseOrder" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsPurchaseInvoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DynamicsPurchaseInvoice" FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'DynamicsPurchaseOrder'
      AND policyname = 'tenant_isolation_select'
  ) THEN
    CREATE POLICY tenant_isolation_select ON "DynamicsPurchaseOrder"
      FOR SELECT
      USING ("tenantId" = current_setting('app.current_tenant_id', true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'DynamicsPurchaseOrder'
      AND policyname = 'tenant_isolation_modify'
  ) THEN
    CREATE POLICY tenant_isolation_modify ON "DynamicsPurchaseOrder"
      FOR ALL
      USING ("tenantId" = current_setting('app.current_tenant_id', true))
      WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'DynamicsPurchaseInvoice'
      AND policyname = 'tenant_isolation_select'
  ) THEN
    CREATE POLICY tenant_isolation_select ON "DynamicsPurchaseInvoice"
      FOR SELECT
      USING ("tenantId" = current_setting('app.current_tenant_id', true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'DynamicsPurchaseInvoice'
      AND policyname = 'tenant_isolation_modify'
  ) THEN
    CREATE POLICY tenant_isolation_modify ON "DynamicsPurchaseInvoice"
      FOR ALL
      USING ("tenantId" = current_setting('app.current_tenant_id', true))
      WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));
  END IF;
END $$;
