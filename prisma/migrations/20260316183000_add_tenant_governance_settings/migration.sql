-- Add minimally editable governance settings for tenant-bound security and retention controls
CREATE TABLE "TenantGovernanceSettings" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
  "requireMfaForPrivilegedRoles" BOOLEAN NOT NULL DEFAULT true,
  "documentRetentionDays" INTEGER NOT NULL DEFAULT 365,
  "autoArchiveApprovedDocuments" BOOLEAN NOT NULL DEFAULT false,
  "updatedByUserId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantGovernanceSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantGovernanceSettings_tenantId_key" ON "TenantGovernanceSettings"("tenantId");
CREATE INDEX "TenantGovernanceSettings_updatedByUserId_idx" ON "TenantGovernanceSettings"("updatedByUserId");

ALTER TABLE "TenantGovernanceSettings"
  ADD CONSTRAINT "TenantGovernanceSettings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantGovernanceSettings"
  ADD CONSTRAINT "TenantGovernanceSettings_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
