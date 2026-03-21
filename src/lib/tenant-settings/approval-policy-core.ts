import "server-only"

import { Role, TenantRole, type Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type TenantApprovalPolicyValues = {
  requireFourEyesForApproval: boolean
  requireReasonForApproval: boolean
  requireReasonForArchiving: boolean
  approvalRestrictedToPrivilegedRoles: boolean
  archivingRestrictedToPrivilegedRoles: boolean
  reviewStartRestrictedToPrivilegedRoles: boolean
}

export type TenantApprovalPolicyView = TenantApprovalPolicyValues & {
  hasPersistedSettings: boolean
  updatedAt: Date | null
}

export const TENANT_APPROVAL_POLICY_DEFAULTS: TenantApprovalPolicyValues = {
  requireFourEyesForApproval: true,
  requireReasonForApproval: true,
  requireReasonForArchiving: true,
  approvalRestrictedToPrivilegedRoles: true,
  archivingRestrictedToPrivilegedRoles: true,
  reviewStartRestrictedToPrivilegedRoles: false
}

export type SaveTenantApprovalPolicyResult =
  | { ok: true }
  | { ok: false; code: "FORBIDDEN" | "MISSING_MEMBERSHIP" }

function canUpdateTenantApprovalPolicy(platformRole: Role, tenantRole: TenantRole): boolean {
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

export async function getTenantApprovalPolicy(tenantId: string): Promise<TenantApprovalPolicyView> {
  return withTenant(tenantId, async (tx) => {
    const settings = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId },
      select: {
        requireFourEyesForApproval: true,
        requireReasonForApproval: true,
        requireReasonForArchiving: true,
        approvalRestrictedToPrivilegedRoles: true,
        archivingRestrictedToPrivilegedRoles: true,
        reviewStartRestrictedToPrivilegedRoles: true,
        updatedAt: true
      }
    })

    if (!settings) {
      return {
        ...TENANT_APPROVAL_POLICY_DEFAULTS,
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

export async function updateTenantApprovalPolicy(input: {
  tenantId: string
  actorId: string
  values: TenantApprovalPolicyValues
}): Promise<SaveTenantApprovalPolicyResult> {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await getMembershipForWrite(tx as Prisma.TransactionClient, input.tenantId, input.actorId)

    if (!membership) {
      return { ok: false, code: "MISSING_MEMBERSHIP" }
    }

    if (!canUpdateTenantApprovalPolicy(membership.user.role, membership.role)) {
      return { ok: false, code: "FORBIDDEN" }
    }

    const previous = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: {
        id: true,
        requireFourEyesForApproval: true,
        requireReasonForApproval: true,
        requireReasonForArchiving: true,
        approvalRestrictedToPrivilegedRoles: true,
        archivingRestrictedToPrivilegedRoles: true,
        reviewStartRestrictedToPrivilegedRoles: true
      }
    })

    const updated = await tx.tenantGovernanceSettings.upsert({
      where: { tenantId: input.tenantId },
      update: {
        requireFourEyesForApproval: input.values.requireFourEyesForApproval,
        requireReasonForApproval: input.values.requireReasonForApproval,
        requireReasonForArchiving: input.values.requireReasonForArchiving,
        approvalRestrictedToPrivilegedRoles: input.values.approvalRestrictedToPrivilegedRoles,
        archivingRestrictedToPrivilegedRoles: input.values.archivingRestrictedToPrivilegedRoles,
        reviewStartRestrictedToPrivilegedRoles: input.values.reviewStartRestrictedToPrivilegedRoles,
        updatedByUserId: input.actorId
      },
      create: {
        tenantId: input.tenantId,
        requireFourEyesForApproval: input.values.requireFourEyesForApproval,
        requireReasonForApproval: input.values.requireReasonForApproval,
        requireReasonForArchiving: input.values.requireReasonForArchiving,
        approvalRestrictedToPrivilegedRoles: input.values.approvalRestrictedToPrivilegedRoles,
        archivingRestrictedToPrivilegedRoles: input.values.archivingRestrictedToPrivilegedRoles,
        reviewStartRestrictedToPrivilegedRoles: input.values.reviewStartRestrictedToPrivilegedRoles,
        updatedByUserId: input.actorId
      },
      select: {
        id: true,
        requireFourEyesForApproval: true,
        requireReasonForApproval: true,
        requireReasonForArchiving: true,
        approvalRestrictedToPrivilegedRoles: true,
        archivingRestrictedToPrivilegedRoles: true,
        reviewStartRestrictedToPrivilegedRoles: true
      }
    })

    const changedFields = [
      {
        field: "requireFourEyesForApproval",
        previousValue:
          previous?.requireFourEyesForApproval ?? TENANT_APPROVAL_POLICY_DEFAULTS.requireFourEyesForApproval,
        nextValue: updated.requireFourEyesForApproval
      },
      {
        field: "requireReasonForApproval",
        previousValue: previous?.requireReasonForApproval ?? TENANT_APPROVAL_POLICY_DEFAULTS.requireReasonForApproval,
        nextValue: updated.requireReasonForApproval
      },
      {
        field: "requireReasonForArchiving",
        previousValue:
          previous?.requireReasonForArchiving ?? TENANT_APPROVAL_POLICY_DEFAULTS.requireReasonForArchiving,
        nextValue: updated.requireReasonForArchiving
      },
      {
        field: "approvalRestrictedToPrivilegedRoles",
        previousValue:
          previous?.approvalRestrictedToPrivilegedRoles ??
          TENANT_APPROVAL_POLICY_DEFAULTS.approvalRestrictedToPrivilegedRoles,
        nextValue: updated.approvalRestrictedToPrivilegedRoles
      },
      {
        field: "archivingRestrictedToPrivilegedRoles",
        previousValue:
          previous?.archivingRestrictedToPrivilegedRoles ??
          TENANT_APPROVAL_POLICY_DEFAULTS.archivingRestrictedToPrivilegedRoles,
        nextValue: updated.archivingRestrictedToPrivilegedRoles
      },
      {
        field: "reviewStartRestrictedToPrivilegedRoles",
        previousValue:
          previous?.reviewStartRestrictedToPrivilegedRoles ??
          TENANT_APPROVAL_POLICY_DEFAULTS.reviewStartRestrictedToPrivilegedRoles,
        nextValue: updated.reviewStartRestrictedToPrivilegedRoles
      }
    ].filter((entry) => entry.previousValue !== entry.nextValue)

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "tenant.approval-policies.updated",
      resourceType: "tenant_approval_policies",
      resourceId: updated.id,
      metadata: {
        section: "approval_policies",
        changedFields,
        actorPlatformRole: membership.user.role,
        actorTenantRole: membership.role,
        settingsExistsBeforeUpdate: Boolean(previous)
      }
    })

    return { ok: true }
  })
}
