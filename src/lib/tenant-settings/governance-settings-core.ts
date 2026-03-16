import "server-only"

import { Role, TenantRole } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type TenantGovernanceSettingsValues = {
  sessionTimeoutMinutes: number
  requireMfaForPrivilegedRoles: boolean
  documentRetentionDays: number
  autoArchiveApprovedDocuments: boolean
}

export type TenantGovernanceSettingsView = TenantGovernanceSettingsValues & {
  hasPersistedSettings: boolean
  updatedAt: Date | null
}

export const TENANT_GOVERNANCE_DEFAULTS: TenantGovernanceSettingsValues = {
  sessionTimeoutMinutes: 30,
  requireMfaForPrivilegedRoles: true,
  documentRetentionDays: 365,
  autoArchiveApprovedDocuments: false
}

export type SaveTenantGovernanceSettingsResult =
  | { ok: true }
  | { ok: false; code: "FORBIDDEN" | "MISSING_MEMBERSHIP" }

function canUpdateTenantGovernanceSettings(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN && (tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN)
}

export async function getTenantGovernanceSettings(tenantId: string): Promise<TenantGovernanceSettingsView> {
  return withTenant(tenantId, async (tx) => {
    const settings = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId },
      select: {
        sessionTimeoutMinutes: true,
        requireMfaForPrivilegedRoles: true,
        documentRetentionDays: true,
        autoArchiveApprovedDocuments: true,
        updatedAt: true
      }
    })

    if (!settings) {
      return {
        ...TENANT_GOVERNANCE_DEFAULTS,
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

export async function saveTenantGovernanceSettings(input: {
  tenantId: string
  actorId: string
  values: TenantGovernanceSettingsValues
}): Promise<SaveTenantGovernanceSettingsResult> {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: input.tenantId,
          userId: input.actorId
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

    if (!membership) {
      return { ok: false, code: "MISSING_MEMBERSHIP" }
    }

    if (!canUpdateTenantGovernanceSettings(membership.user.role, membership.role)) {
      return { ok: false, code: "FORBIDDEN" }
    }

    const previous = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: {
        id: true,
        sessionTimeoutMinutes: true,
        requireMfaForPrivilegedRoles: true,
        documentRetentionDays: true,
        autoArchiveApprovedDocuments: true
      }
    })

    const updated = await tx.tenantGovernanceSettings.upsert({
      where: { tenantId: input.tenantId },
      update: {
        sessionTimeoutMinutes: input.values.sessionTimeoutMinutes,
        requireMfaForPrivilegedRoles: input.values.requireMfaForPrivilegedRoles,
        documentRetentionDays: input.values.documentRetentionDays,
        autoArchiveApprovedDocuments: input.values.autoArchiveApprovedDocuments,
        updatedByUserId: input.actorId
      },
      create: {
        tenantId: input.tenantId,
        sessionTimeoutMinutes: input.values.sessionTimeoutMinutes,
        requireMfaForPrivilegedRoles: input.values.requireMfaForPrivilegedRoles,
        documentRetentionDays: input.values.documentRetentionDays,
        autoArchiveApprovedDocuments: input.values.autoArchiveApprovedDocuments,
        updatedByUserId: input.actorId
      },
      select: {
        id: true,
        sessionTimeoutMinutes: true,
        requireMfaForPrivilegedRoles: true,
        documentRetentionDays: true,
        autoArchiveApprovedDocuments: true
      }
    })

    const changedFields = [
      {
        field: "sessionTimeoutMinutes",
        previousValue: previous?.sessionTimeoutMinutes ?? TENANT_GOVERNANCE_DEFAULTS.sessionTimeoutMinutes,
        nextValue: updated.sessionTimeoutMinutes
      },
      {
        field: "requireMfaForPrivilegedRoles",
        previousValue: previous?.requireMfaForPrivilegedRoles ?? TENANT_GOVERNANCE_DEFAULTS.requireMfaForPrivilegedRoles,
        nextValue: updated.requireMfaForPrivilegedRoles
      },
      {
        field: "documentRetentionDays",
        previousValue: previous?.documentRetentionDays ?? TENANT_GOVERNANCE_DEFAULTS.documentRetentionDays,
        nextValue: updated.documentRetentionDays
      },
      {
        field: "autoArchiveApprovedDocuments",
        previousValue: previous?.autoArchiveApprovedDocuments ?? TENANT_GOVERNANCE_DEFAULTS.autoArchiveApprovedDocuments,
        nextValue: updated.autoArchiveApprovedDocuments
      }
    ].filter((entry) => entry.previousValue !== entry.nextValue)

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "tenant.settings.updated",
      resourceType: "tenant_settings",
      resourceId: updated.id,
      metadata: {
        section: "security_retention",
        changedFields,
        actorPlatformRole: membership.user.role,
        actorTenantRole: membership.role,
        settingsExistsBeforeUpdate: Boolean(previous)
      }
    })

    return { ok: true }
  })
}
