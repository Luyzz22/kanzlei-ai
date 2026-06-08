import "server-only"

import { Prisma } from "@prisma/client"
import { z } from "zod"

import { withTenant } from "@/lib/tenant-context.server"
import { resolveNormPilotActor } from "@/lib/normpilot/access"
import { normPilotEvidenceSourceSchema } from "@/lib/normpilot/schemas"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"

const evidenceSourceCreateSchema = normPilotEvidenceSourceSchema.omit({ reviewState: true }).extend({
  reviewState: normPilotEvidenceSourceSchema.shape.reviewState.optional()
})

const evidenceSourceUpdateSchema = evidenceSourceCreateSchema.partial().extend({
  id: z.string().min(1)
})

export async function listNormPilotEvidenceSources(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.normPilotEvidenceSource.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            documentType: true,
            processingStatus: true
          }
        }
      }
    })
  })
}

export async function createNormPilotEvidenceSource(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof evidenceSourceCreateSchema>
}): Promise<NormPilotCoreResult<{ id: string }>> {
  const parsed = evidenceSourceCreateSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "draft"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const document = parsed.data.documentId
      ? await tx.document.findFirst({
          where: { id: parsed.data.documentId, tenantId: input.tenantId, deletedAt: null },
          select: { id: true, sha256: true }
        })
      : null
    if (parsed.data.documentId && !document) return { ok: false, code: "NOT_FOUND" }

    const row = await tx.normPilotEvidenceSource.create({
      data: {
        tenantId: input.tenantId,
        documentId: parsed.data.documentId,
        sourceType: parsed.data.sourceType,
        title: parsed.data.title,
        sourceHash: parsed.data.sourceHash ?? document?.sha256 ?? undefined,
        locator: parsed.data.locator as Prisma.InputJsonValue | undefined,
        reviewState: parsed.data.reviewState ?? "UNGEPRUEFT",
        retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
      },
      select: { id: true }
    })

    return { ok: true, data: row }
  })
}

export async function updateNormPilotEvidenceSource(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof evidenceSourceUpdateSchema>
}): Promise<NormPilotCoreResult<{ id: string }>> {
  const parsed = evidenceSourceUpdateSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "draft"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const existing = await tx.normPilotEvidenceSource.findFirst({
      where: { id: parsed.data.id, tenantId: input.tenantId, deletedAt: null },
      select: { id: true }
    })
    if (!existing) return { ok: false, code: "NOT_FOUND" }

    const row = await tx.normPilotEvidenceSource.update({
      where: { id: existing.id },
      data: {
        documentId: parsed.data.documentId,
        sourceType: parsed.data.sourceType,
        title: parsed.data.title,
        sourceHash: parsed.data.sourceHash,
        locator: parsed.data.locator as Prisma.InputJsonValue | undefined,
        reviewState: parsed.data.reviewState,
        retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
      },
      select: { id: true }
    })

    return { ok: true, data: row }
  })
}
