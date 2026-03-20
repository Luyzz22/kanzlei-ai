import "server-only"

import { DocumentIntakeStatus, Role, TenantRole } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type ReviewReadinessState = "OFFEN" | "IN_PRUEFUNG" | "ENTSCHEIDUNGSVORBEREITUNG" | "FREIGABEREIF" | "ABGESCHLOSSEN"
export type DocumentReviewNoteTypeValue = "NOTE" | "DECISION_MEMO"
export type DocumentFindingSeverityValue = "NIEDRIG" | "MITTEL" | "HOCH"
export type DocumentFindingStatusValue = "OFFEN" | "GEKLAERT" | "AKZEPTIERT"

export type DocumentReviewNoteListItem = {
  id: string
  type: DocumentReviewNoteTypeValue
  title: string | null
  body: string
  sectionKey: string | null
  createdAt: Date
  updatedAt: Date
  authorLabel: string
}

export type DocumentFindingListItem = {
  id: string
  title: string
  description: string
  severity: DocumentFindingSeverityValue
  status: DocumentFindingStatusValue
  sectionKey: string | null
  createdAt: Date
  updatedAt: Date
  createdByLabel: string
  resolvedAt: Date | null
  resolvedByLabel: string | null
}

export type ReviewAssignableMember = {
  userId: string
  label: string
}

export type DocumentReviewSummary = {
  reviewOwnerId: string | null
  reviewOwnerLabel: string | null
  reviewDueAt: Date | null
  openFindingsCount: number
  closedFindingsCount: number
  readiness: ReviewReadinessState
  readinessLabel: string
  canManageReviewMeta: boolean
  canCreateDecisionMemo: boolean
  canResolveFindings: boolean
  decisionMemo: {
    id: string
    title: string | null
    body: string
    createdAt: Date
    authorLabel: string
  } | null
}

export const reviewInputConstraints = {
  noteBodyMinLength: 5,
  noteBodyMaxLength: 4000,
  noteTitleMaxLength: 160,
  findingTitleMinLength: 3,
  findingTitleMaxLength: 180,
  findingDescriptionMinLength: 5,
  findingDescriptionMaxLength: 4000
}

function canCreateDecisionMemo(platformRole: Role, tenantRole: TenantRole): boolean {
  return platformRole === Role.ADMIN && (tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN)
}

function canManageFinding(platformRole: Role, tenantRole: TenantRole, isReviewOwner: boolean): boolean {
  if (platformRole === Role.ADMIN && (tenantRole === TenantRole.OWNER || tenantRole === TenantRole.ADMIN)) {
    return true
  }

  return isReviewOwner
}

export function deriveReviewReadinessState(input: {
  status: DocumentIntakeStatus
  openFindingsCount: number
  hasReviewOwner: boolean
  hasDecisionMemo: boolean
}): ReviewReadinessState {
  if (input.status === DocumentIntakeStatus.ARCHIVIERT) return "ABGESCHLOSSEN"
  if (input.status === DocumentIntakeStatus.FREIGEGEBEN) return "FREIGABEREIF"
  if (input.openFindingsCount > 0) return "IN_PRUEFUNG"
  if (!input.hasReviewOwner) return "OFFEN"
  if (!input.hasDecisionMemo) return "ENTSCHEIDUNGSVORBEREITUNG"
  return "FREIGABEREIF"
}

export function getReviewReadinessLabel(state: ReviewReadinessState): string {
  if (state === "OFFEN") return "Offen"
  if (state === "IN_PRUEFUNG") return "In Prüfung"
  if (state === "ENTSCHEIDUNGSVORBEREITUNG") return "Entscheidungsvorbereitung"
  if (state === "FREIGABEREIF") return "Freigabereif"
  return "Abgeschlossen"
}

export function getReviewReadinessTone(state: ReviewReadinessState): "warning" | "info" | "success" | "neutral" {
  if (state === "OFFEN") return "warning"
  if (state === "IN_PRUEFUNG") return "info"
  if (state === "ENTSCHEIDUNGSVORBEREITUNG") return "info"
  if (state === "FREIGABEREIF") return "success"
  return "neutral"
}

export async function listReviewAssignableMembers(tenantId: string, actorId: string) {
  return withTenant(tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: actorId
        }
      },
      select: { id: true }
    })

    if (!membership) {
      return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }
    }

    const members = await tx.tenantMember.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const options: ReviewAssignableMember[] = members.map((member) => ({
      userId: member.userId,
      label: member.user.name ?? member.user.email ?? "Unbekannter Nutzer"
    }))

    return { ok: true as const, members: options }
  })
}

export async function listDocumentReviewNotes(tenantId: string, actorId: string, documentId: string) {
  return withTenant(tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: actorId } },
      select: { id: true }
    })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    const document = await tx.document.findUnique({ where: { id: documentId }, select: { id: true, tenantId: true } })
    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    const notes = await tx.documentReviewNote.findMany({
      where: { tenantId, documentId, type: "NOTE" },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        sectionKey: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return {
      ok: true as const,
      notes: notes.map((note) => ({
        ...note,
        authorLabel: note.author.name ?? note.author.email ?? "Unbekannter Nutzer"
      }))
    }
  })
}

export async function listDocumentFindings(tenantId: string, actorId: string, documentId: string) {
  return withTenant(tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: actorId } },
      select: { id: true }
    })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    const document = await tx.document.findUnique({ where: { id: documentId }, select: { id: true, tenantId: true } })
    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    const findings = await tx.documentFinding.findMany({
      where: { tenantId, documentId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        sectionKey: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        resolvedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return {
      ok: true as const,
      findings: findings.map((finding) => ({
        ...finding,
        createdByLabel: finding.createdBy.name ?? finding.createdBy.email ?? "Unbekannter Nutzer",
        resolvedByLabel: finding.resolvedBy?.name ?? finding.resolvedBy?.email ?? null
      }))
    }
  })
}

export async function createDocumentReviewNote(input: {
  tenantId: string
  actorId: string
  documentId: string
  body: string
  title?: string | null
  sectionKey?: string | null
  type?: DocumentReviewNoteTypeValue
}) {
  const body = input.body.trim()
  const title = input.title?.trim() || null
  const sectionKey = input.sectionKey?.trim() || null
  const type = input.type ?? "NOTE"

  if (body.length < reviewInputConstraints.noteBodyMinLength || body.length > reviewInputConstraints.noteBodyMaxLength) {
    return { ok: false as const, code: "INVALID_BODY_LENGTH" }
  }

  if (title && title.length > reviewInputConstraints.noteTitleMaxLength) {
    return { ok: false as const, code: "INVALID_TITLE_LENGTH" }
  }

  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: input.tenantId, userId: input.actorId } },
      select: {
        role: true,
        user: {
          select: {
            role: true
          }
        }
      }
    })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    const document = await tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, tenantId: true } })
    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== input.tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    if (type === "DECISION_MEMO" && !canCreateDecisionMemo(membership.user.role, membership.role)) {
      return { ok: false as const, code: "FORBIDDEN_MEMO" }
    }

    const created = await tx.documentReviewNote.create({
      data: {
        tenantId: input.tenantId,
        documentId: input.documentId,
        authorId: input.actorId,
        body,
        title,
        sectionKey,
        type
      },
      select: { id: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: type === "DECISION_MEMO" ? "document.review.memo.created" : "document.review.note.created",
      resourceType: type === "DECISION_MEMO" ? "document_review_memo" : "document_review_note",
      resourceId: created.id,
      documentId: input.documentId,
      metadata: {
        sectionKey,
        hasTitle: Boolean(title),
        hasBody: body.length > 0,
        bodyLength: body.length
      }
    })

    return { ok: true as const, id: created.id }
  })
}

export async function createDocumentFinding(input: {
  tenantId: string
  actorId: string
  documentId: string
  title: string
  description: string
  severity: DocumentFindingSeverityValue
  sectionKey?: string | null
}) {
  const title = input.title.trim()
  const description = input.description.trim()
  const sectionKey = input.sectionKey?.trim() || null

  if (title.length < reviewInputConstraints.findingTitleMinLength || title.length > reviewInputConstraints.findingTitleMaxLength) {
    return { ok: false as const, code: "INVALID_TITLE_LENGTH" }
  }

  if (
    description.length < reviewInputConstraints.findingDescriptionMinLength ||
    description.length > reviewInputConstraints.findingDescriptionMaxLength
  ) {
    return { ok: false as const, code: "INVALID_DESCRIPTION_LENGTH" }
  }

  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({ where: { tenantId_userId: { tenantId: input.tenantId, userId: input.actorId } }, select: { id: true } })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    const document = await tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, tenantId: true } })
    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== input.tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    const created = await tx.documentFinding.create({
      data: {
        tenantId: input.tenantId,
        documentId: input.documentId,
        createdById: input.actorId,
        title,
        description,
        severity: input.severity,
        sectionKey
      },
      select: { id: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.finding.created",
      resourceType: "document_finding",
      resourceId: created.id,
      documentId: input.documentId,
      metadata: {
        sectionKey,
        severity: input.severity,
        status: "OFFEN"
      }
    })

    return { ok: true as const, id: created.id }
  })
}

export async function resolveDocumentFinding(input: {
  tenantId: string
  actorId: string
  documentId: string
  findingId: string
  nextStatus: "GEKLAERT" | "AKZEPTIERT"
}) {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: input.tenantId, userId: input.actorId } },
      select: {
        role: true,
        user: {
          select: {
            role: true
          }
        }
      }
    })
    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    const document = await tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, tenantId: true, reviewOwnerId: true } })
    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== input.tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    if (!canManageFinding(membership.user.role, membership.role, document.reviewOwnerId === input.actorId)) {
      return { ok: false as const, code: "FORBIDDEN_FINDING_MANAGE" }
    }

    const finding = await tx.documentFinding.findUnique({ where: { id: input.findingId }, select: { id: true, tenantId: true, documentId: true, status: true } })

    if (!finding || finding.documentId !== input.documentId || finding.tenantId !== input.tenantId) {
      return { ok: false as const, code: "NOT_FOUND" }
    }

    const updated = await tx.documentFinding.update({
      where: { id: finding.id },
      data: {
        status: input.nextStatus,
        resolvedAt: new Date(),
        resolvedById: input.actorId
      },
      select: { id: true, status: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.finding.resolved",
      resourceType: "document_finding",
      resourceId: updated.id,
      documentId: input.documentId,
      metadata: {
        previousStatus: finding.status,
        nextStatus: updated.status
      }
    })

    return { ok: true as const }
  })
}

export async function assignDocumentReviewOwner(input: { tenantId: string; actorId: string; documentId: string; reviewOwnerId: string | null }) {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: input.tenantId, userId: input.actorId } },
      select: {
        role: true,
        user: {
          select: {
            role: true
          }
        }
      }
    })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    if (!canCreateDecisionMemo(membership.user.role, membership.role)) {
      return { ok: false as const, code: "FORBIDDEN_OWNER_ASSIGNMENT" }
    }

    const document = await tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, tenantId: true, reviewOwnerId: true } })

    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== input.tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    if (input.reviewOwnerId) {
      const ownerMembership = await tx.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId: input.tenantId,
            userId: input.reviewOwnerId
          }
        },
        select: { id: true }
      })

      if (!ownerMembership) return { ok: false as const, code: "INVALID_OWNER" }
    }

    await tx.document.update({
      where: { id: input.documentId },
      data: { reviewOwnerId: input.reviewOwnerId }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.review.owner.assigned",
      resourceType: "document",
      resourceId: input.documentId,
      documentId: input.documentId,
      metadata: {
        previousOwnerId: document.reviewOwnerId,
        nextOwnerId: input.reviewOwnerId
      }
    })

    return { ok: true as const }
  })
}

export async function setDocumentReviewDueDate(input: { tenantId: string; actorId: string; documentId: string; reviewDueAt: Date | null }) {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: input.tenantId, userId: input.actorId } },
      select: {
        role: true,
        user: {
          select: {
            role: true
          }
        }
      }
    })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    if (!canCreateDecisionMemo(membership.user.role, membership.role)) {
      return { ok: false as const, code: "FORBIDDEN_DUE_DATE_UPDATE" }
    }

    const document = await tx.document.findUnique({ where: { id: input.documentId }, select: { id: true, tenantId: true, reviewDueAt: true } })
    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== input.tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    await tx.document.update({
      where: { id: input.documentId },
      data: { reviewDueAt: input.reviewDueAt }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.review.due_date.updated",
      resourceType: "document",
      resourceId: input.documentId,
      documentId: input.documentId,
      metadata: {
        previousDueAt: document.reviewDueAt?.toISOString() ?? null,
        nextDueAt: input.reviewDueAt?.toISOString() ?? null
      }
    })

    return { ok: true as const }
  })
}

export async function getDocumentReviewSummary(tenantId: string, actorId: string, documentId: string) {
  return withTenant(tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: actorId } },
      select: {
        role: true,
        user: {
          select: {
            role: true
          }
        }
      }
    })

    if (!membership) return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }

    const document = await tx.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        reviewOwnerId: true,
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
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          select: {
            id: true,
            title: true,
            body: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        findings: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    if (!document) return { ok: false as const, code: "NOT_FOUND" }
    if (document.tenantId !== tenantId) return { ok: false as const, code: "TENANT_MISMATCH" }

    const openFindingsCount = document.findings.filter((item) => item.status === "OFFEN").length
    const closedFindingsCount = document.findings.length - openFindingsCount
    const decisionMemo = document.reviewNotes[0] ?? null

    const readiness = deriveReviewReadinessState({
      status: document.status,
      openFindingsCount,
      hasReviewOwner: Boolean(document.reviewOwnerId),
      hasDecisionMemo: Boolean(decisionMemo)
    })

    return {
      ok: true as const,
      summary: {
        reviewOwnerId: document.reviewOwnerId,
        reviewOwnerLabel: document.reviewOwner ? document.reviewOwner.name ?? document.reviewOwner.email ?? "Unbekannter Nutzer" : null,
        reviewDueAt: document.reviewDueAt,
        openFindingsCount,
        closedFindingsCount,
        readiness,
        readinessLabel: getReviewReadinessLabel(readiness),
        canManageReviewMeta: canCreateDecisionMemo(membership.user.role, membership.role),
        canCreateDecisionMemo: canCreateDecisionMemo(membership.user.role, membership.role),
        canResolveFindings: canManageFinding(membership.user.role, membership.role, document.reviewOwnerId === actorId),
        decisionMemo: decisionMemo
          ? {
              id: decisionMemo.id,
              title: decisionMemo.title,
              body: decisionMemo.body,
              createdAt: decisionMemo.createdAt,
              authorLabel: decisionMemo.author.name ?? decisionMemo.author.email ?? "Unbekannter Nutzer"
            }
          : null
      } satisfies DocumentReviewSummary
    }
  })
}
