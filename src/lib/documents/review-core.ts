import "server-only"

import { DocumentIntakeStatus, Role, TenantRole } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { deriveReviewReadinessState, getReviewReadinessLabel, type ReviewReadinessState } from "@/lib/documents/review-workbench-core"
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

const transitionPolicy: Record<
  DocumentIntakeStatus,
  Partial<Record<DocumentIntakeStatus, { action: string; requiresReason: boolean; privileged: boolean }>>
> = {
  [DocumentIntakeStatus.EINGEGANGEN]: {
    [DocumentIntakeStatus.IN_PRUEFUNG]: {
      action: "document.review.started",
      requiresReason: false,
      privileged: false
    }
  },
  [DocumentIntakeStatus.IN_PRUEFUNG]: {
    [DocumentIntakeStatus.FREIGEGEBEN]: {
      action: "document.review.approved",
      requiresReason: true,
      privileged: true
    },
    [DocumentIntakeStatus.ARCHIVIERT]: {
      action: "document.review.archived",
      requiresReason: true,
      privileged: true
    }
  },
  [DocumentIntakeStatus.FREIGEGEBEN]: {
    [DocumentIntakeStatus.ARCHIVIERT]: {
      action: "document.review.archived",
      requiresReason: true,
      privileged: true
    }
  },
  [DocumentIntakeStatus.ARCHIVIERT]: {}
}

function canStartReview(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN || platformRole === Role.ANWALT || tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN
}

function canPerformPrivilegedReviewStep(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN && (tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN)
}

export async function transitionDocumentReviewStatus(input: TransitionDocumentReviewInput) {
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
      return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }
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
      return { ok: false as const, code: "NOT_FOUND" }
    }

    if (document.tenantId !== input.tenantId) {
      return { ok: false as const, code: "TENANT_MISMATCH" }
    }

    const transition = transitionPolicy[document.status]?.[input.nextStatus]

    if (!transition) {
      return { ok: false as const, code: "INVALID_TRANSITION", currentStatus: document.status }
    }

    if (transition.requiresReason && !input.reason?.trim()) {
      return { ok: false as const, code: "MISSING_REASON" }
    }

    if (transition.privileged && !canPerformPrivilegedReviewStep(membership.user.role, membership.role)) {
      return { ok: false as const, code: "FORBIDDEN_PRIVILEGED" }
    }

    if (!transition.privileged && !canStartReview(membership.user.role, membership.role)) {
      return { ok: false as const, code: "FORBIDDEN_START_REVIEW" }
    }

    if (input.nextStatus === DocumentIntakeStatus.FREIGEGEBEN && document.uploadedById && document.uploadedById === input.actorId) {
      return { ok: false as const, code: "FOUR_EYES_REQUIRED" }
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
        privilegedStep: transition.privileged,
        actorPlatformRole: membership.user.role,
        actorTenantRole: membership.role,
        title: document.title,
        documentType: document.documentType,
        organizationName: document.organizationName
      }
    })

    return {
      ok: true as const,
      documentId: updated.id,
      status: updated.status
    }
  })
}
