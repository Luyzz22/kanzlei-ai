import "server-only"

import {
  type DocumentCommentSectionKey,
  documentCommentInputConstraints,
  documentCommentSectionOptions
} from "@/config/document-comments"
import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type DocumentCommentListItem = {
  id: string
  body: string
  sectionKey: DocumentCommentSectionKey | null
  anchorText: string | null
  createdAt: Date
  updatedAt: Date
  authorLabel: string
}

type ListDocumentCommentsInput = {
  tenantId: string
  actorId: string
  documentId: string
}

type CreateDocumentCommentInput = {
  tenantId: string
  actorId: string
  documentId: string
  body: string
  sectionKey?: string | null
  anchorText?: string | null
}

const sectionKeySet = new Set<string>(documentCommentSectionOptions.map((option) => option.value))

function normalizeSectionKey(value: string | null | undefined): DocumentCommentSectionKey | null {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized) return null
  return sectionKeySet.has(normalized) ? (normalized as DocumentCommentSectionKey) : null
}

function normalizeAnchorText(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export async function listDocumentComments(input: ListDocumentCommentsInput) {
  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: input.tenantId,
          userId: input.actorId
        }
      },
      select: { id: true }
    })

    if (!membership) {
      return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }
    }

    const document = await tx.document.findUnique({
      where: { id: input.documentId },
      select: { id: true, tenantId: true }
    })

    if (!document) {
      return { ok: false as const, code: "NOT_FOUND" }
    }

    if (document.tenantId !== input.tenantId) {
      return { ok: false as const, code: "TENANT_MISMATCH" }
    }

    const comments = await tx.documentComment.findMany({
      where: {
        tenantId: input.tenantId,
        documentId: input.documentId
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        body: true,
        sectionKey: true,
        anchorText: true,
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
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        sectionKey: normalizeSectionKey(comment.sectionKey),
        anchorText: comment.anchorText,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorLabel: comment.author.name ?? comment.author.email ?? "Unbekannter Nutzer"
      }))
    }
  })
}

export async function createDocumentComment(input: CreateDocumentCommentInput) {
  const body = input.body.trim()
  const sectionKey = normalizeSectionKey(input.sectionKey)
  const anchorText = normalizeAnchorText(input.anchorText)

  if (body.length < documentCommentInputConstraints.minBodyLength || body.length > documentCommentInputConstraints.maxBodyLength) {
    return { ok: false as const, code: "INVALID_BODY_LENGTH" }
  }

  if (input.sectionKey && !sectionKey) {
    return { ok: false as const, code: "INVALID_SECTION_KEY" }
  }

  if (anchorText && anchorText.length > documentCommentInputConstraints.maxAnchorLength) {
    return { ok: false as const, code: "INVALID_ANCHOR_LENGTH" }
  }

  return withTenant(input.tenantId, async (tx) => {
    const membership = await tx.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: input.tenantId,
          userId: input.actorId
        }
      },
      select: { id: true }
    })

    if (!membership) {
      return { ok: false as const, code: "FORBIDDEN_MEMBERSHIP" }
    }

    const document = await tx.document.findUnique({
      where: { id: input.documentId },
      select: { id: true, tenantId: true }
    })

    if (!document) {
      return { ok: false as const, code: "NOT_FOUND" }
    }

    if (document.tenantId !== input.tenantId) {
      return { ok: false as const, code: "TENANT_MISMATCH" }
    }

    const created = await tx.documentComment.create({
      data: {
        tenantId: input.tenantId,
        documentId: input.documentId,
        authorId: input.actorId,
        body,
        sectionKey,
        anchorText
      },
      select: {
        id: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.comment.created",
      resourceType: "document_comment",
      resourceId: created.id,
      documentId: input.documentId,
      metadata: {
        sectionKey,
        hasAnchorText: Boolean(anchorText),
        commentLength: body.length
      }
    })

    return {
      ok: true as const,
      commentId: created.id,
      createdAt: created.createdAt,
      authorLabel: created.author.name ?? created.author.email ?? "Unbekannter Nutzer"
    }
  })
}

export function getDocumentCommentInputConstraints() {
  return documentCommentInputConstraints
}
