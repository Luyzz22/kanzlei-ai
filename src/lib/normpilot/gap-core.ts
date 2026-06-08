import "server-only"

import { Prisma, type NormPilotGapSeverity } from "@prisma/client"
import { z } from "zod"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"
import { resolveNormPilotActor } from "@/lib/normpilot/access"
import { buildNormPilotAuditMetadata } from "@/lib/normpilot/audit-metadata"
import { NORMPILOT_AUDIT_ACTIONS } from "@/lib/normpilot/constants"
import { normPilotGapFindingSchema } from "@/lib/normpilot/schemas"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"

const gapUpsertSchema = normPilotGapFindingSchema.omit({ reviewState: true }).extend({
  id: z.string().min(1).optional(),
  reviewState: normPilotGapFindingSchema.shape.reviewState.optional()
})

export async function listNormPilotGaps(tenantId: string, requirementSetId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.normPilotGapFinding.findMany({
      where: { tenantId, requirementSetId, deletedAt: null },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      include: {
        requirementItem: {
          select: { id: true, code: true, title: true }
        },
        evidenceMapping: {
          select: { id: true, status: true }
        }
      }
    })
  })
}

export async function upsertNormPilotGap(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof gapUpsertSchema>
}): Promise<NormPilotCoreResult<{ id: string; requirementSetId: string }>> {
  const parsed = gapUpsertSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "draft"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const set = await tx.normPilotRequirementSet.findFirst({
      where: { id: parsed.data.requirementSetId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true }
    })
    if (!set) return { ok: false, code: "NOT_FOUND" }

    const rowData = {
      tenantId: input.tenantId,
      requirementSetId: set.id,
      requirementItemId: parsed.data.requirementItemId,
      evidenceMappingId: parsed.data.evidenceMappingId,
      severity: (parsed.data.severity ?? "MEDIUM") as NormPilotGapSeverity,
      title: parsed.data.title,
      description: parsed.data.description,
      recommendation: parsed.data.recommendation,
      sourceSummary: parsed.data.sourceSummary as Prisma.InputJsonValue | undefined,
      confidence: parsed.data.confidence,
      promptKey: parsed.data.promptKey,
      promptVersion: parsed.data.promptVersion,
      provider: parsed.data.provider,
      model: parsed.data.model,
      reviewState: parsed.data.reviewState ?? "UNGEPRUEFT",
      retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
    }

    const row = parsed.data.id
      ? await tx.normPilotGapFinding.update({
          where: { id: parsed.data.id },
          data: rowData,
          select: { id: true, requirementSetId: true }
        })
      : await tx.normPilotGapFinding.create({
          data: rowData,
          select: { id: true, requirementSetId: true }
        })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: NORMPILOT_AUDIT_ACTIONS.gapGenerated,
      resourceType: "normpilot_gap_finding",
      resourceId: row.id,
      metadata: buildNormPilotAuditMetadata({
        requirementSetId: row.requirementSetId,
        requirementItemId: parsed.data.requirementItemId ?? null,
        evidenceMappingId: parsed.data.evidenceMappingId ?? null,
        severity: rowData.severity,
        reviewState: rowData.reviewState,
        promptVersion: parsed.data.promptVersion ?? null
      })
    })

    return { ok: true, data: row }
  })
}
