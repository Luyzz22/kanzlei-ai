import "server-only"

import { Role, TenantRole, type Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type TenantSecuritySettingsValues = {
  adminSessionTimeoutMinutes: number
  standardSessionTimeoutMinutes: number
  requireMfaForPrivilegedRoles: boolean
  requireApprovalForPrivilegedRoleChanges: boolean
  requireReasonForPrivilegedReviewActions: boolean
}

export type TenantRetentionSettingsValues = {
  defaultDocumentRetentionDays: number
  auditEvidenceRetentionDays: number
  reviewDueDays: number
  archiveAfterApprovalDays: number
  softDeletePolicyEnabled: boolean
}

export type TenantSecuritySettingsView = TenantSecuritySettingsValues & {
  hasPersistedSettings: boolean
  updatedAt: Date | null
}

export type TenantRetentionSettingsView = TenantRetentionSettingsValues & {
  hasPersistedSettings: boolean
  updatedAt: Date | null
}

export const TENANT_SECURITY_DEFAULTS: TenantSecuritySettingsValues = {
  adminSessionTimeoutMinutes: 30,
  standardSessionTimeoutMinutes: 480,
  requireMfaForPrivilegedRoles: true,
  requireApprovalForPrivilegedRoleChanges: true,
  requireReasonForPrivilegedReviewActions: true
}

export const TENANT_RETENTION_DEFAULTS: TenantRetentionSettingsValues = {
  defaultDocumentRetentionDays: 365,
  auditEvidenceRetentionDays: 1825,
  reviewDueDays: 14,
  archiveAfterApprovalDays: 30,
  softDeletePolicyEnabled: false
}

export type SaveTenantSettingsResult =
  | { ok: true }
  | { ok: false; code: "FORBIDDEN" | "MISSING_MEMBERSHIP" }

function canUpdateTenantSettings(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN && (tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN)
}

async function getMembershipForWrite(tx: Prisma.TransactionClient, tenantId: string, actorId: string) {
  return tx.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: actorId
      }
    },
    select: {
      role: true,
      user: {
        select: {
          role: true
        }
      }
    }
  })
}

export async function getTenantSecuritySettings(tenantId: string): Promise<TenantSecuritySettingsView> {
  return withTenant(tenantId, async (tx) => {
    const settings = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId },
      select: {
        adminSessionTimeoutMinutes: true,
        standardSessionTimeoutMinutes: true,
        requireMfaForPrivilegedRoles: true,
        requireApprovalForPrivilegedRoleChanges: true,
        requireReasonForPrivilegedReviewActions: true,
        updatedAt: true
      }
    })

    if (!settings) {
      return {
        ...TENANT_SECURITY_DEFAULTS,
        hasPersistedSettings: false,
        updatedAt: null
      }
    }

    return {
      ...settings,
      hasPersistedSettings: true,
      updatedAt: settings.updatedAt
    }
  })
}

export async function updateTenantSecuritySettings(input: {
  tenantId: string
  actorId: string
  values: TenantSecuritySettingsValues
}): Promise<SaveTenantSettingsResult> {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await getMembershipForWrite(tx as Prisma.TransactionClient, input.tenantId, input.actorId)

    if (!membership) {
      return { ok: false, code: "MISSING_MEMBERSHIP" }
    }

    if (!canUpdateTenantSettings(membership.user.role, membership.role)) {
      return { ok: false, code: "FORBIDDEN" }
    }

    const previous = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: {
        id: true,
        adminSessionTimeoutMinutes: true,
        standardSessionTimeoutMinutes: true,
        requireMfaForPrivilegedRoles: true,
        requireApprovalForPrivilegedRoleChanges: true,
        requireReasonForPrivilegedReviewActions: true
      }
    })

    const updated = await tx.tenantGovernanceSettings.upsert({
      where: { tenantId: input.tenantId },
      update: {
        adminSessionTimeoutMinutes: input.values.adminSessionTimeoutMinutes,
        standardSessionTimeoutMinutes: input.values.standardSessionTimeoutMinutes,
        requireMfaForPrivilegedRoles: input.values.requireMfaForPrivilegedRoles,
        requireApprovalForPrivilegedRoleChanges: input.values.requireApprovalForPrivilegedRoleChanges,
        requireReasonForPrivilegedReviewActions: input.values.requireReasonForPrivilegedReviewActions,
        updatedByUserId: input.actorId
      },
      create: {
        tenantId: input.tenantId,
        adminSessionTimeoutMinutes: input.values.adminSessionTimeoutMinutes,
        standardSessionTimeoutMinutes: input.values.standardSessionTimeoutMinutes,
        requireMfaForPrivilegedRoles: input.values.requireMfaForPrivilegedRoles,
        requireApprovalForPrivilegedRoleChanges: input.values.requireApprovalForPrivilegedRoleChanges,
        requireReasonForPrivilegedReviewActions: input.values.requireReasonForPrivilegedReviewActions,
        updatedByUserId: input.actorId
      },
      select: {
        id: true,
        adminSessionTimeoutMinutes: true,
        standardSessionTimeoutMinutes: true,
        requireMfaForPrivilegedRoles: true,
        requireApprovalForPrivilegedRoleChanges: true,
        requireReasonForPrivilegedReviewActions: true
      }
    })

    const changedFields = [
      {
        field: "adminSessionTimeoutMinutes",
        previousValue: previous?.adminSessionTimeoutMinutes ?? TENANT_SECURITY_DEFAULTS.adminSessionTimeoutMinutes,
        nextValue: updated.adminSessionTimeoutMinutes
      },
      {
        field: "standardSessionTimeoutMinutes",
        previousValue:
          previous?.standardSessionTimeoutMinutes ?? TENANT_SECURITY_DEFAULTS.standardSessionTimeoutMinutes,
        nextValue: updated.standardSessionTimeoutMinutes
      },
      {
        field: "requireMfaForPrivilegedRoles",
        previousValue: previous?.requireMfaForPrivilegedRoles ?? TENANT_SECURITY_DEFAULTS.requireMfaForPrivilegedRoles,
        nextValue: updated.requireMfaForPrivilegedRoles
      },
      {
        field: "requireApprovalForPrivilegedRoleChanges",
        previousValue:
          previous?.requireApprovalForPrivilegedRoleChanges ??
          TENANT_SECURITY_DEFAULTS.requireApprovalForPrivilegedRoleChanges,
        nextValue: updated.requireApprovalForPrivilegedRoleChanges
      },
      {
        field: "requireReasonForPrivilegedReviewActions",
        previousValue:
          previous?.requireReasonForPrivilegedReviewActions ??
          TENANT_SECURITY_DEFAULTS.requireReasonForPrivilegedReviewActions,
        nextValue: updated.requireReasonForPrivilegedReviewActions
      }
    ].filter((entry) => entry.previousValue !== entry.nextValue)

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "tenant.security-settings.updated",
      resourceType: "tenant_security_settings",
      resourceId: updated.id,
      metadata: {
        section: "security_access",
        changedFields,
        actorPlatformRole: membership.user.role,
        actorTenantRole: membership.role,
        settingsExistsBeforeUpdate: Boolean(previous)
      }
    })

    return { ok: true }
  })
}

export async function getTenantRetentionSettings(tenantId: string): Promise<TenantRetentionSettingsView> {
  return withTenant(tenantId, async (tx) => {
    const settings = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId },
      select: {
        defaultDocumentRetentionDays: true,
        auditEvidenceRetentionDays: true,
        reviewDueDays: true,
        archiveAfterApprovalDays: true,
        softDeletePolicyEnabled: true,
        updatedAt: true
      }
    })

    if (!settings) {
      return {
        ...TENANT_RETENTION_DEFAULTS,
        hasPersistedSettings: false,
        updatedAt: null
      }
    }

    return {
      ...settings,
      hasPersistedSettings: true,
      updatedAt: settings.updatedAt
    }
  })
}

export async function updateTenantRetentionSettings(input: {
  tenantId: string
  actorId: string
  values: TenantRetentionSettingsValues
}): Promise<SaveTenantSettingsResult> {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await getMembershipForWrite(tx as Prisma.TransactionClient, input.tenantId, input.actorId)

    if (!membership) {
      return { ok: false, code: "MISSING_MEMBERSHIP" }
    }

    if (!canUpdateTenantSettings(membership.user.role, membership.role)) {
      return { ok: false, code: "FORBIDDEN" }
    }

    const previous = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: {
        id: true,
        defaultDocumentRetentionDays: true,
        auditEvidenceRetentionDays: true,
        reviewDueDays: true,
        archiveAfterApprovalDays: true,
        softDeletePolicyEnabled: true
      }
    })

    const updated = await tx.tenantGovernanceSettings.upsert({
      where: { tenantId: input.tenantId },
      update: {
        defaultDocumentRetentionDays: input.values.defaultDocumentRetentionDays,
        auditEvidenceRetentionDays: input.values.auditEvidenceRetentionDays,
        reviewDueDays: input.values.reviewDueDays,
        archiveAfterApprovalDays: input.values.archiveAfterApprovalDays,
        softDeletePolicyEnabled: input.values.softDeletePolicyEnabled,
        updatedByUserId: input.actorId
      },
      create: {
        tenantId: input.tenantId,
        defaultDocumentRetentionDays: input.values.defaultDocumentRetentionDays,
        auditEvidenceRetentionDays: input.values.auditEvidenceRetentionDays,
        reviewDueDays: input.values.reviewDueDays,
        archiveAfterApprovalDays: input.values.archiveAfterApprovalDays,
        softDeletePolicyEnabled: input.values.softDeletePolicyEnabled,
        updatedByUserId: input.actorId
      },
      select: {
        id: true,
        defaultDocumentRetentionDays: true,
        auditEvidenceRetentionDays: true,
        reviewDueDays: true,
        archiveAfterApprovalDays: true,
        softDeletePolicyEnabled: true
      }
    })

    const changedFields = [
      {
        field: "defaultDocumentRetentionDays",
        previousValue: previous?.defaultDocumentRetentionDays ?? TENANT_RETENTION_DEFAULTS.defaultDocumentRetentionDays,
        nextValue: updated.defaultDocumentRetentionDays
      },
      {
        field: "auditEvidenceRetentionDays",
        previousValue: previous?.auditEvidenceRetentionDays ?? TENANT_RETENTION_DEFAULTS.auditEvidenceRetentionDays,
        nextValue: updated.auditEvidenceRetentionDays
      },
      {
        field: "reviewDueDays",
        previousValue: previous?.reviewDueDays ?? TENANT_RETENTION_DEFAULTS.reviewDueDays,
        nextValue: updated.reviewDueDays
      },
      {
        field: "archiveAfterApprovalDays",
        previousValue: previous?.archiveAfterApprovalDays ?? TENANT_RETENTION_DEFAULTS.archiveAfterApprovalDays,
        nextValue: updated.archiveAfterApprovalDays
      },
      {
        field: "softDeletePolicyEnabled",
        previousValue: previous?.softDeletePolicyEnabled ?? TENANT_RETENTION_DEFAULTS.softDeletePolicyEnabled,
        nextValue: updated.softDeletePolicyEnabled
      }
    ].filter((entry) => entry.previousValue !== entry.nextValue)

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "tenant.retention-settings.updated",
      resourceType: "tenant_retention_settings",
      resourceId: updated.id,
      metadata: {
        section: "privacy_retention",
        changedFields,
        actorPlatformRole: membership.user.role,
        actorTenantRole: membership.role,
        settingsExistsBeforeUpdate: Boolean(previous)
      }
    })

    return { ok: true }
  })
}
