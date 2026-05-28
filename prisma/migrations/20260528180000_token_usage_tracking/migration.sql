-- CreateTable
CREATE TABLE "TenantTokenUsage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costCentsUsd" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantTokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantTokenUsage_tenantId_createdAt_idx" ON "TenantTokenUsage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantTokenUsage_tenantId_source_idx" ON "TenantTokenUsage"("tenantId", "source");

-- CreateIndex
CREATE INDEX "TenantTokenUsage_tenantId_userId_createdAt_idx" ON "TenantTokenUsage"("tenantId", "userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TenantTokenUsage" ADD CONSTRAINT "TenantTokenUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantTokenUsage" ADD CONSTRAINT "TenantTokenUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
