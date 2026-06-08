import "server-only"

import { Prisma, type NormPilotEvidenceStatus } from "@prisma/client"
import { z } from "zod"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"
import { resolveNormPilotActor } from "@/lib/normpilot/access"
import { buildNormPilotAuditMetadata } from "@/lib/normpilot/audit-metadata"
import { NORMPILOT_AUDIT_ACTIONS } from "@/lib/normpilot/constants"
import { normPilotEvidenceMappingSchema } from "@/lib/normpilot/schemas"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"

const mappingUpsertSchema = normPilotEvidenceMappingSchema.omit({ reviewState: true }).extend({
  id: z.string().min(1).optional(),
  reviewState: normPilotEvidenceMappingSchema.shape.reviewState.optional()
})

export async function listNormPilotEvidenceMatrix(tenantId: string, requirementSetId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.normPilotEvidenceMapping.findMany({
      where: {
        tenantId,
        deletedAt: null,
        requirementItem: {
          tenantId,
          requirementSetId,
          deletedAt: null
        }
      },
      orderBy: { createdAt: "asc" },
      include: {
        requirementItem: {
          select: { id: true, code: true, title: true, sortOrder: true }
        },
        evidenceSource: {
          select: { id: true, title: true, sourceType: true, documentId: true }
        }
      }
    })
  })
}

export async function upsertNormPilotEvidenceMapping(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof mappingUpsertSchema>
}): Promise<NormPilotCoreResult<{ id: string; requirementSetId: string }>> {
  const parsed = mappingUpsertSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "draft"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const requirement = await tx.normPilotRequirementItem.findFirst({
      where: { id: parsed.data.requirementItemId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true, requirementSetId: true }
    })
    if (!requirement) return { ok: false, code: "NOT_FOUND" }

    if (parsed.data.evidenceSourceId) {
      const source = await tx.normPilotEvidenceSource.findFirst({
        where: { id: parsed.data.evidenceSourceId, tenantId: input.tenantId, deletedAt: null },
        select: { id: true }
      })
      if (!source) return { ok: false, code: "NOT_FOUND" }
    }

    const data = {
      tenantId: input.tenantId,
      requirementItemId: requirement.id,
      evidenceSourceId: parsed.data.evidenceSourceId,
      status: (parsed.data.status ?? "NEEDS_REVIEW") as NormPilotEvidenceStatus,
      confidence: parsed.data.confidence,
      rationale: parsed.data.rationale,
      anchorText: parsed.data.anchorText,
      locator: parsed.data.locator as Prisma.InputJsonValue | undefined,
      evidenceHash: parsed.data.evidenceHash,
      promptKey: parsed.data.promptKey,
      promptVersion: parsed.data.promptVersion,
      provider: parsed.data.provider,
      model: parsed.data.model,
      reviewState: parsed.data.reviewState ?? "UNGEPRUEFT",
      retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
    }

    const row = parsed.data.id
      ? await tx.normPilotEvidenceMapping.update({
          where: { id: parsed.data.id },
          data,
          select: { id: true }
        })
      : await tx.normPilotEvidenceMapping.create({
          data,
          select: { id: true }
        })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: NORMPILOT_AUDIT_ACTIONS.evidenceMapped,
      resourceType: "normpilot_evidence_mapping",
      resourceId: row.id,
      metadata: buildNormPilotAuditMetadata({
        requirementItemId: requirement.id,
        evidenceSourceId: parsed.data.evidenceSourceId ?? null,
        status: data.status,
        reviewState: data.reviewState,
        promptVersion: parsed.data.promptVersion ?? null
      })
    })

    return { ok: true, data: { id: row.id, requirementSetId: requirement.requirementSetId } }
  })
}
