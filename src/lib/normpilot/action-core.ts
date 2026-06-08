import "server-only"

import { Prisma, type NormPilotActionStatus } from "@prisma/client"
import { z } from "zod"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"
import { resolveNormPilotActor } from "@/lib/normpilot/access"
import { buildNormPilotAuditMetadata } from "@/lib/normpilot/audit-metadata"
import { NORMPILOT_AUDIT_ACTIONS } from "@/lib/normpilot/constants"
import { normPilotCorrectiveActionSchema } from "@/lib/normpilot/schemas"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"

const actionUpsertSchema = normPilotCorrectiveActionSchema.omit({ reviewState: true }).extend({
  id: z.string().min(1).optional(),
  reviewState: normPilotCorrectiveActionSchema.shape.reviewState.optional()
})

export async function listNormPilotCorrectiveActions(tenantId: string, requirementSetId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.normPilotCorrectiveAction.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          {
            requirementItem: {
              tenantId,
              requirementSetId
            }
          },
          {
            gapFinding: {
              tenantId,
              requirementSetId
            }
          }
        ]
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        requirementItem: {
          select: { id: true, code: true, title: true }
        },
        gapFinding: {
          select: { id: true, severity: true, title: true }
        }
      }
    })
  })
}

export async function upsertNormPilotCorrectiveAction(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof actionUpsertSchema>
}): Promise<NormPilotCoreResult<{ id: string; requirementSetId: string | null }>> {
  const parsed = actionUpsertSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "draft"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const requirement = parsed.data.requirementItemId
      ? await tx.normPilotRequirementItem.findFirst({
          where: { id: parsed.data.requirementItemId, tenantId: input.tenantId, deletedAt: null },
          select: { id: true, requirementSetId: true }
        })
      : null
    if (parsed.data.requirementItemId && !requirement) return { ok: false, code: "NOT_FOUND" }

    const gap = parsed.data.gapFindingId
      ? await tx.normPilotGapFinding.findFirst({
          where: { id: parsed.data.gapFindingId, tenantId: input.tenantId, deletedAt: null },
          select: { id: true, requirementSetId: true }
        })
      : null
    if (parsed.data.gapFindingId && !gap) return { ok: false, code: "NOT_FOUND" }

    const rowData = {
      tenantId: input.tenantId,
      gapFindingId: parsed.data.gapFindingId,
      requirementItemId: parsed.data.requirementItemId,
      title: parsed.data.title,
      description: parsed.data.description,
      ownerRole: parsed.data.ownerRole,
      ownerLabel: parsed.data.ownerLabel,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      status: (parsed.data.status ?? "DRAFT") as NormPilotActionStatus,
      acceptanceCriteria: parsed.data.acceptanceCriteria,
      reviewState: parsed.data.reviewState ?? "UNGEPRUEFT",
      retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
    }

    const row = parsed.data.id
      ? await tx.normPilotCorrectiveAction.update({
          where: { id: parsed.data.id },
          data: rowData,
          select: { id: true }
        })
      : await tx.normPilotCorrectiveAction.create({
          data: rowData,
          select: { id: true }
        })

    const requirementSetId = gap?.requirementSetId ?? requirement?.requirementSetId ?? null

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: NORMPILOT_AUDIT_ACTIONS.correctiveActionDrafted,
      resourceType: "normpilot_corrective_action",
      resourceId: row.id,
      metadata: buildNormPilotAuditMetadata({
        gapFindingId: parsed.data.gapFindingId ?? null,
        requirementItemId: parsed.data.requirementItemId ?? null,
        requirementSetId,
        status: rowData.status,
        reviewState: rowData.reviewState
      })
    })

    return { ok: true, data: { id: row.id, requirementSetId } }
  })
}
