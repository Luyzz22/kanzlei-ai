-- Add tenant-bound settings fields for security/access and privacy/retention foundation.
ALTER TABLE "TenantGovernanceSettings"
ADD COLUMN     "adminSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "standardSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 480,
ADD COLUMN     "requireApprovalForPrivilegedRoleChanges" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requireReasonForPrivilegedReviewActions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultDocumentRetentionDays" INTEGER NOT NULL DEFAULT 365,
ADD COLUMN     "auditEvidenceRetentionDays" INTEGER NOT NULL DEFAULT 1825,
ADD COLUMN     "reviewDueDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "archiveAfterApprovalDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "softDeletePolicyEnabled" BOOLEAN NOT NULL DEFAULT false;
