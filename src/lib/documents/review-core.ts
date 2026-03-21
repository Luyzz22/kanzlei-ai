import "server-only"

import { DocumentIntakeStatus, Role, TenantRole } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { deriveReviewReadinessState, getReviewReadinessLabel, type ReviewReadinessState } from "@/lib/documents/review-workbench-core"
import {
  TENANT_APPROVAL_POLICY_DEFAULTS,
  type TenantApprovalPolicyValues
} from "@/lib/tenant-settings/approval-policy-core"
import { withTenant } from "@/lib/tenant-context.server"

export type ReviewQueueDocument = {
  id: string
  title: string
  documentType: string
  organizationName: string
  status: DocumentIntakeStatus
  createdAt: Date
  reviewOwnerLabel: string | null
  reviewDueAt: Date | null
  openFindingsCount: number
  hasDecisionMemo: boolean
  readiness: ReviewReadinessState
  readinessLabel: string
}

export async function listReviewQueueDocuments(tenantId: string): Promise<ReviewQueueDocument[]> {
  return withTenant(tenantId, async (tx) => {
    const documents = await tx.document.findMany({
      where: {
        status: {
          in: [DocumentIntakeStatus.EINGEGANGEN, DocumentIntakeStatus.IN_PRUEFUNG]
        }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        documentType: true,
        organizationName: true,
        status: true,
        createdAt: true,
        reviewDueAt: true,
        reviewOwner: {
          select: {
            name: true,
            email: true
          }
        },
        reviewNotes: {
          where: {
            type: "DECISION_MEMO"
          },
          take: 1,
          select: {
            id: true
          }
        },
        findings: {
          select: {
            status: true
          }
        }
      }
    })

    const mapped = documents.map((document) => {
      const openFindingsCount = document.findings.filter((item) => item.status === "OFFEN").length
      const readiness = deriveReviewReadinessState({
        status: document.status,
        openFindingsCount,
        hasReviewOwner: Boolean(document.reviewOwner),
        hasDecisionMemo: document.reviewNotes.length > 0
      })

      return {
        id: document.id,
        title: document.title,
        documentType: document.documentType,
        organizationName: document.organizationName,
        status: document.status,
        createdAt: document.createdAt,
        reviewOwnerLabel: document.reviewOwner ? document.reviewOwner.name ?? document.reviewOwner.email ?? "Unbekannt" : null,
        reviewDueAt: document.reviewDueAt,
        openFindingsCount,
        hasDecisionMemo: document.reviewNotes.length > 0,
        readiness,
        readinessLabel: getReviewReadinessLabel(readiness)
      }
    })

    return mapped.sort((a, b) => {
      const aDue = a.reviewDueAt ? new Date(a.reviewDueAt).getTime() : Number.MAX_SAFE_INTEGER
      const bDue = b.reviewDueAt ? new Date(b.reviewDueAt).getTime() : Number.MAX_SAFE_INTEGER

      if (a.openFindingsCount !== b.openFindingsCount) return b.openFindingsCount - a.openFindingsCount
      if (aDue !== bDue) return aDue - bDue
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  })
}

export type TransitionDocumentReviewInput = {
  tenantId: string
  actorId: string
  documentId: string
  nextStatus: DocumentIntakeStatus
  reason?: string
}

type TransitionRule = {
  action: string
  mode: "start_review" | "approval" | "archive"
}

const transitionPolicy: Record<DocumentIntakeStatus, Partial<Record<DocumentIntakeStatus, TransitionRule>>> = {
  [DocumentIntakeStatus.EINGEGANGEN]: {
    [DocumentIntakeStatus.IN_PRUEFUNG]: {
      action: "document.review.started",
      mode: "start_review"
    }
  },
  [DocumentIntakeStatus.IN_PRUEFUNG]: {
    [DocumentIntakeStatus.FREIGEGEBEN]: {
      action: "document.review.approved",
      mode: "approval"
    },
    [DocumentIntakeStatus.ARCHIVIERT]: {
      action: "document.review.archived",
      mode: "archive"
    }
  },
  [DocumentIntakeStatus.FREIGEGEBEN]: {
    [DocumentIntakeStatus.ARCHIVIERT]: {
      action: "document.review.archived",
      mode: "archive"
    }
  },
  [DocumentIntakeStatus.ARCHIVIERT]: {}
}

type ReviewTransitionErrorCode =
  | "FORBIDDEN_START_REVIEW_BY_POLICY"
  | "FORBIDDEN_APPROVAL_BY_POLICY"
  | "FORBIDDEN_ARCHIVE_BY_POLICY"
  | "MISSING_APPROVAL_REASON"
  | "MISSING_ARCHIVE_REASON"
  | "FOUR_EYES_REQUIRED_BY_POLICY"
  | "INVALID_TRANSITION"
  | "NOT_FOUND"
  | "FORBIDDEN_MEMBERSHIP"
  | "TENANT_MISMATCH"

type ReviewTransitionError = {
  ok: false
  code: ReviewTransitionErrorCode
  currentStatus?: DocumentIntakeStatus
}

type ReviewTransitionSuccess = {
  ok: true
  documentId: string
  status: DocumentIntakeStatus
}

function canStartReviewByBaseline(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN || platformRole === Role.ANWALT || tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN
}

function canPerformPrivilegedReviewStep(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN && (tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN)
}

function evaluateReviewTransitionPolicy(input: {
  transition: TransitionRule
  policy: TenantApprovalPolicyValues
  reason?: string
  actorPlatformRole: Role
  actorTenantRole: TenantRole
  uploadedById: string | null
  actorId: string
}): ReviewTransitionError | { ok: true } {
  const canPrivileged = canPerformPrivilegedReviewStep(input.actorPlatformRole, input.actorTenantRole)
  const canBaselineStart = canStartReviewByBaseline(input.actorPlatformRole, input.actorTenantRole)

  if (input.transition.mode === "start_review") {
    if (input.policy.reviewStartRestrictedToPrivilegedRoles && !canPrivileged) {
      return { ok: false, code: "FORBIDDEN_START_REVIEW_BY_POLICY" }
    }

    if (!input.policy.reviewStartRestrictedToPrivilegedRoles && !canBaselineStart) {
      return { ok: false, code: "FORBIDDEN_START_REVIEW_BY_POLICY" }
    }

    return { ok: true }
  }

  if (input.transition.mode === "approval") {
    if (input.policy.approvalRestrictedToPrivilegedRoles && !canPrivileged) {
      return { ok: false, code: "FORBIDDEN_APPROVAL_BY_POLICY" }
    }

    if (!input.policy.approvalRestrictedToPrivilegedRoles && !canBaselineStart) {
      return { ok: false, code: "FORBIDDEN_APPROVAL_BY_POLICY" }
    }

    if (input.policy.requireReasonForApproval && !input.reason?.trim()) {
      return { ok: false, code: "MISSING_APPROVAL_REASON" }
    }

    if (input.policy.requireFourEyesForApproval && input.uploadedById && input.uploadedById === input.actorId) {
      return { ok: false, code: "FOUR_EYES_REQUIRED_BY_POLICY" }
    }

    return { ok: true }
  }

  if (input.policy.archivingRestrictedToPrivilegedRoles && !canPrivileged) {
    return { ok: false, code: "FORBIDDEN_ARCHIVE_BY_POLICY" }
  }

  if (!input.policy.archivingRestrictedToPrivilegedRoles && !canBaselineStart) {
    return { ok: false, code: "FORBIDDEN_ARCHIVE_BY_POLICY" }
  }

  if (input.policy.requireReasonForArchiving && !input.reason?.trim()) {
    return { ok: false, code: "MISSING_ARCHIVE_REASON" }
  }

  return { ok: true }
}

export async function transitionDocumentReviewStatus(
  input: TransitionDocumentReviewInput
): Promise<ReviewTransitionError | ReviewTransitionSuccess> {
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
      return { ok: false, code: "FORBIDDEN_MEMBERSHIP" }
    }

    const document = await tx.document.findUnique({
      where: { id: input.documentId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        uploadedById: true,
        title: true,
        documentType: true,
        organizationName: true
      }
    })

    if (!document) {
      return { ok: false, code: "NOT_FOUND" }
    }

    if (document.tenantId !== input.tenantId) {
      return { ok: false, code: "TENANT_MISMATCH" }
    }

    const transition = transitionPolicy[document.status]?.[input.nextStatus]

    if (!transition) {
      return { ok: false, code: "INVALID_TRANSITION", currentStatus: document.status }
    }

    const persistedPolicy = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: {
        requireFourEyesForApproval: true,
        requireReasonForApproval: true,
        requireReasonForArchiving: true,
        approvalRestrictedToPrivilegedRoles: true,
        archivingRestrictedToPrivilegedRoles: true,
        reviewStartRestrictedToPrivilegedRoles: true
      }
    })

    const policy: TenantApprovalPolicyValues = persistedPolicy ?? TENANT_APPROVAL_POLICY_DEFAULTS

    const evaluation = evaluateReviewTransitionPolicy({
      transition,
      policy,
      reason: input.reason,
      actorPlatformRole: membership.user.role,
      actorTenantRole: membership.role,
      uploadedById: document.uploadedById,
      actorId: input.actorId
    })

    if (!evaluation.ok) {
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: "document.review.transition.denied",
        resourceType: "document",
        resourceId: document.id,
        documentId: document.id,
        metadata: {
          attemptedStatus: input.nextStatus,
          previousStatus: document.status,
          deniedByCode: evaluation.code,
          policySnapshot: policy,
          actorPlatformRole: membership.user.role,
          actorTenantRole: membership.role
        }
      })

      return evaluation
    }

    const updated = await tx.document.update({
      where: { id: input.documentId },
      data: { status: input.nextStatus },
      select: {
        id: true,
        status: true
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: transition.action,
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        previousStatus: document.status,
        nextStatus: input.nextStatus,
        reason: input.reason ?? null,
        policySnapshot: policy,
        fourEyesRequired: policy.requireFourEyesForApproval,
        reasonRequired: transition.mode === "approval" ? policy.requireReasonForApproval : policy.requireReasonForArchiving,
        approvalRestricted: policy.approvalRestrictedToPrivilegedRoles,
        archiveRestricted: policy.archivingRestrictedToPrivilegedRoles,
        actorPlatformRole: membership.user.role,
        actorTenantRole: membership.role,
        title: document.title,
        documentType: document.documentType,
        organizationName: document.organizationName
      }
    })

    return {
      ok: true,
      documentId: updated.id,
      status: updated.status
    }
  })
}

export function getApprovalPolicyUiSummary(policy: TenantApprovalPolicyValues): string[] {
  const hints: string[] = []

  if (policy.requireFourEyesForApproval) hints.push("Vier-Augen-Prinzip aktiv")
  if (policy.approvalRestrictedToPrivilegedRoles) hints.push("Freigabe nur für privilegierte Rollen")
  if (policy.archivingRestrictedToPrivilegedRoles) hints.push("Archivierung nur für privilegierte Rollen")
  if (policy.requireReasonForApproval || policy.requireReasonForArchiving) hints.push("Begründungspflichten aktiv")
  if (policy.reviewStartRestrictedToPrivilegedRoles) hints.push("Start der Prüfung privilegiert")

  return hints.length ? hints : ["Baseline-Regeln aktiv"]
}

export function getDefaultApprovalPolicyForUi(): TenantApprovalPolicyValues {
  return TENANT_APPROVAL_POLICY_DEFAULTS
}
