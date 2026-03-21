-- Add tenant-specific approval policy fields to governance settings.
ALTER TABLE "TenantGovernanceSettings"
  ADD COLUMN "requireFourEyesForApproval" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requireReasonForApproval" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requireReasonForArchiving" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "approvalRestrictedToPrivilegedRoles" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "archivingRestrictedToPrivilegedRoles" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "reviewStartRestrictedToPrivilegedRoles" BOOLEAN NOT NULL DEFAULT false;
