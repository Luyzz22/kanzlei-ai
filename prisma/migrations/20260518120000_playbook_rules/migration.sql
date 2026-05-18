-- Playbook Miner: Persistierung von Klausel-Regeln
-- Speichert geminte Patterns als aktivierbare Regeln pro Tenant.

CREATE TABLE "PlaybookRule" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "preferredRevision" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "samplesCount" INTEGER NOT NULL DEFAULT 0,
    "acceptanceRate" DOUBLE PRECISION,
    "overrideRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "PlaybookRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlaybookRule_tenantId_category_idx" ON "PlaybookRule"("tenantId", "category");
CREATE INDEX "PlaybookRule_tenantId_isActive_idx" ON "PlaybookRule"("tenantId", "isActive");

ALTER TABLE "PlaybookRule" ADD CONSTRAINT "PlaybookRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
