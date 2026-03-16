import "server-only"

import { DocumentIntakeStatus, Role } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type ReviewQueueDocument = {
  id: string
  title: string
  documentType: string
  organizationName: string
  status: DocumentIntakeStatus
  createdAt: Date
}

export async function listReviewQueueDocuments(tenantId: string): Promise<ReviewQueueDocument[]> {
  return withTenant(tenantId, async (tx) => {
    return tx.document.findMany({
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
        createdAt: true
      }
    })
  })
}

export type TransitionDocumentReviewInput = {
  tenantId: string
  actorId: string
  actorRole: Role
  documentId: string
  nextStatus: DocumentIntakeStatus
  reason?: string
}

function isTransitionAllowed(current: DocumentIntakeStatus, next: DocumentIntakeStatus): boolean {
  if (current === DocumentIntakeStatus.EINGEGANGEN && next === DocumentIntakeStatus.IN_PRUEFUNG) return true
  if (current === DocumentIntakeStatus.IN_PRUEFUNG && next === DocumentIntakeStatus.FREIGEGEBEN) return true
  if (current === DocumentIntakeStatus.IN_PRUEFUNG && next === DocumentIntakeStatus.ARCHIVIERT) return true
  return false
}

function getAuditAction(nextStatus: DocumentIntakeStatus): string {
  if (nextStatus === DocumentIntakeStatus.IN_PRUEFUNG) return "document.review.started"
  if (nextStatus === DocumentIntakeStatus.FREIGEGEBEN) return "document.review.approved"
  if (nextStatus === DocumentIntakeStatus.ARCHIVIERT) return "document.review.archived"
  return "document.review.updated"
}

export async function transitionDocumentReviewStatus(input: TransitionDocumentReviewInput) {
  return withTenant(input.tenantId, async (tx) => {
    const document = await tx.document.findUnique({
      where: { id: input.documentId },
      select: {
        id: true,
        tenantId: true,
        status: true,
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

    if (!isTransitionAllowed(document.status, input.nextStatus)) {
      return { ok: false as const, code: "INVALID_TRANSITION", currentStatus: document.status }
    }

    if (input.nextStatus === DocumentIntakeStatus.FREIGEGEBEN && input.actorRole !== Role.ADMIN) {
      return { ok: false as const, code: "FORBIDDEN_APPROVAL" }
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
      action: getAuditAction(input.nextStatus),
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        previousStatus: document.status,
        nextStatus: input.nextStatus,
        reason: input.reason ?? null,
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
