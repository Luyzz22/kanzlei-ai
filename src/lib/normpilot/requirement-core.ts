import "server-only"

import { createHash } from "node:crypto"

import { Prisma, type NormPilotGapSeverity } from "@prisma/client"
import { z } from "zod"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"
import { resolveNormPilotActor, type NormPilotAccessDecision } from "@/lib/normpilot/access"
import { buildNormPilotAuditMetadata } from "@/lib/normpilot/audit-metadata"
import { NORMPILOT_DEFAULT_REQUIREMENT_SOURCE_KIND } from "@/lib/normpilot/constants"
import {
  normPilotGapSeveritySchema,
  normPilotRequirementItemSchema,
  normPilotRequirementSetSchema
} from "@/lib/normpilot/schemas"

const requirementSetCreateSchema = normPilotRequirementSetSchema.omit({ reviewState: true }).extend({
  reviewState: normPilotRequirementSetSchema.shape.reviewState.optional()
})

const requirementSetUpdateSchema = requirementSetCreateSchema.partial().extend({
  id: z.string().min(1)
})

const requirementItemCreateSchema = normPilotRequirementItemSchema.omit({ reviewState: true }).extend({
  reviewState: normPilotRequirementItemSchema.shape.reviewState.optional()
})

const requirementItemUpdateSchema = requirementItemCreateSchema.partial().extend({
  id: z.string().min(1)
})

export const normPilotRequirementImportSchema = z.object({
  requirementSet: requirementSetCreateSchema,
  items: z
    .array(
      z.object({
        code: z.string().min(1).max(80),
        title: z.string().min(1).max(240),
        customerText: z.string().max(4000).optional(),
        normReferenceCode: z.string().max(120).optional(),
        sectionLabel: z.string().max(160).optional(),
        sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
        criticality: normPilotGapSeveritySchema.optional()
      })
    )
    .min(1)
    .max(200)
})

export type NormPilotRequirementImportInput = z.input<typeof normPilotRequirementImportSchema>

export type NormPilotCoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "MISSING_MEMBERSHIP" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR"; message?: string }

function hashContent(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex")
}

function accessError(result: Extract<NormPilotAccessDecision, { ok: false }>): NormPilotCoreResult<never> {
  return { ok: false, code: result.code }
}

export async function listNormPilotRequirementSets(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.normPilotRequirementSet.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        frameworkLabel: true,
        scopeLabel: true,
        versionLabel: true,
        reviewState: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: true,
            gapFindings: true,
            exports: true
          }
        }
      }
    })
  })
}

export async function getNormPilotRequirementSetDetail(tenantId: string, requirementSetId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.normPilotRequirementSet.findFirst({
      where: { id: requirementSetId, tenantId, deletedAt: null },
      include: {
        items: {
          where: { tenantId, deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        },
        gapFindings: {
          where: { tenantId, deletedAt: null },
          orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
          include: {
            requirementItem: {
              select: { id: true, code: true, title: true }
            }
          }
        },
        exports: {
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    })
  })
}

export async function createNormPilotRequirementSet(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof requirementSetCreateSchema>
}): Promise<NormPilotCoreResult<{ id: string }>> {
  const parsed = requirementSetCreateSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return accessError(actor)

    const sourceDocument = parsed.data.sourceDocumentId
      ? await tx.document.findFirst({
          where: { id: parsed.data.sourceDocumentId, tenantId: input.tenantId },
          select: { id: true }
        })
      : null
    if (parsed.data.sourceDocumentId && !sourceDocument) return { ok: false, code: "NOT_FOUND" }

    const row = await tx.normPilotRequirementSet.create({
      data: {
        tenantId: input.tenantId,
        title: parsed.data.title,
        description: parsed.data.description,
        frameworkLabel: parsed.data.frameworkLabel,
        scopeLabel: parsed.data.scopeLabel,
        versionLabel: parsed.data.versionLabel,
        sourceKind: parsed.data.sourceKind ?? NORMPILOT_DEFAULT_REQUIREMENT_SOURCE_KIND,
        sourceDocumentId: parsed.data.sourceDocumentId,
        contentHash: parsed.data.contentHash ?? hashContent(parsed.data),
        reviewState: parsed.data.reviewState ?? "UNGEPRUEFT",
        retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
      },
      select: { id: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "normpilot.requirement_set.created",
      resourceType: "normpilot_requirement_set",
      resourceId: row.id,
      metadata: buildNormPilotAuditMetadata({
        reviewState: parsed.data.reviewState ?? "UNGEPRUEFT"
      })
    })

    return { ok: true, data: row }
  })
}

export async function updateNormPilotRequirementSet(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof requirementSetUpdateSchema>
}): Promise<NormPilotCoreResult<{ id: string }>> {
  const parsed = requirementSetUpdateSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return accessError(actor)

    const existing = await tx.normPilotRequirementSet.findFirst({
      where: { id: parsed.data.id, tenantId: input.tenantId, deletedAt: null },
      select: { id: true, reviewState: true }
    })
    if (!existing) return { ok: false, code: "NOT_FOUND" }

    const updated = await tx.normPilotRequirementSet.update({
      where: { id: existing.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        frameworkLabel: parsed.data.frameworkLabel,
        scopeLabel: parsed.data.scopeLabel,
        versionLabel: parsed.data.versionLabel,
        sourceKind: parsed.data.sourceKind,
        sourceDocumentId: parsed.data.sourceDocumentId,
        contentHash: parsed.data.contentHash,
        reviewState: parsed.data.reviewState,
        retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
      },
      select: { id: true, reviewState: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "normpilot.requirement_set.updated",
      resourceType: "normpilot_requirement_set",
      resourceId: updated.id,
      metadata: buildNormPilotAuditMetadata({
        previousReviewState: existing.reviewState,
        nextReviewState: updated.reviewState
      })
    })

    return { ok: true, data: { id: updated.id } }
  })
}

export async function importNormPilotRequirementSetJson(input: {
  tenantId: string
  actorId: string
  payload: NormPilotRequirementImportInput
}): Promise<NormPilotCoreResult<{ requirementSetId: string; itemCount: number }>> {
  const parsed = normPilotRequirementImportSchema.safeParse(input.payload)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return accessError(actor)

    const requirementSet = await tx.normPilotRequirementSet.create({
      data: {
        tenantId: input.tenantId,
        title: parsed.data.requirementSet.title,
        description: parsed.data.requirementSet.description,
        frameworkLabel: parsed.data.requirementSet.frameworkLabel,
        scopeLabel: parsed.data.requirementSet.scopeLabel,
        versionLabel: parsed.data.requirementSet.versionLabel,
        sourceKind: parsed.data.requirementSet.sourceKind ?? NORMPILOT_DEFAULT_REQUIREMENT_SOURCE_KIND,
        sourceDocumentId: parsed.data.requirementSet.sourceDocumentId,
        contentHash: parsed.data.requirementSet.contentHash ?? hashContent(parsed.data),
        reviewState: parsed.data.requirementSet.reviewState ?? "UNGEPRUEFT",
        retentionUntil: parsed.data.requirementSet.retentionUntil
          ? new Date(parsed.data.requirementSet.retentionUntil)
          : undefined,
        items: {
          create: parsed.data.items.map((item, index) => ({
            tenantId: input.tenantId,
            code: item.code,
            title: item.title,
            customerText: item.customerText,
            normReferenceCode: item.normReferenceCode,
            sectionLabel: item.sectionLabel,
            sortOrder: item.sortOrder ?? index,
            criticality: item.criticality as NormPilotGapSeverity | undefined,
            reviewState: "UNGEPRUEFT"
          }))
        }
      },
      select: { id: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "normpilot.requirement_set.imported",
      resourceType: "normpilot_requirement_set",
      resourceId: requirementSet.id,
      metadata: buildNormPilotAuditMetadata({
        itemCount: parsed.data.items.length,
        reviewState: parsed.data.requirementSet.reviewState ?? "UNGEPRUEFT"
      })
    })

    return { ok: true, data: { requirementSetId: requirementSet.id, itemCount: parsed.data.items.length } }
  })
}

export async function createNormPilotRequirementItem(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof requirementItemCreateSchema>
}): Promise<NormPilotCoreResult<{ id: string; requirementSetId: string }>> {
  const parsed = requirementItemCreateSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return accessError(actor)

    const set = await tx.normPilotRequirementSet.findFirst({
      where: { id: parsed.data.requirementSetId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true }
    })
    if (!set) return { ok: false, code: "NOT_FOUND" }

    const row = await tx.normPilotRequirementItem.create({
      data: {
        tenantId: input.tenantId,
        requirementSetId: parsed.data.requirementSetId,
        code: parsed.data.code,
        title: parsed.data.title,
        customerText: parsed.data.customerText,
        normReferenceCode: parsed.data.normReferenceCode,
        sectionLabel: parsed.data.sectionLabel,
        sortOrder: parsed.data.sortOrder ?? 0,
        criticality: parsed.data.criticality as NormPilotGapSeverity | undefined,
        reviewState: parsed.data.reviewState ?? "UNGEPRUEFT",
        retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
      },
      select: { id: true, requirementSetId: true }
    })

    return { ok: true, data: row }
  })
}

export async function updateNormPilotRequirementItem(input: {
  tenantId: string
  actorId: string
  values: z.input<typeof requirementItemUpdateSchema>
}): Promise<NormPilotCoreResult<{ id: string; requirementSetId: string }>> {
  const parsed = requirementItemUpdateSchema.safeParse(input.values)
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.message }

  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return accessError(actor)

    const existing = await tx.normPilotRequirementItem.findFirst({
      where: { id: parsed.data.id, tenantId: input.tenantId, deletedAt: null },
      select: { id: true, requirementSetId: true }
    })
    if (!existing) return { ok: false, code: "NOT_FOUND" }

    const row = await tx.normPilotRequirementItem.update({
      where: { id: existing.id },
      data: {
        code: parsed.data.code,
        title: parsed.data.title,
        customerText: parsed.data.customerText,
        normReferenceCode: parsed.data.normReferenceCode,
        sectionLabel: parsed.data.sectionLabel,
        sortOrder: parsed.data.sortOrder,
        criticality: parsed.data.criticality as NormPilotGapSeverity | undefined,
        reviewState: parsed.data.reviewState,
        retentionUntil: parsed.data.retentionUntil ? new Date(parsed.data.retentionUntil) : undefined
      },
      select: { id: true, requirementSetId: true }
    })

    return { ok: true, data: row }
  })
}

export async function softDeleteNormPilotRequirementSet(input: {
  tenantId: string
  actorId: string
  requirementSetId: string
}): Promise<NormPilotCoreResult<{ id: string }>> {
  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return accessError(actor)

    const existing = await tx.normPilotRequirementSet.findFirst({
      where: { id: input.requirementSetId, tenantId: input.tenantId, deletedAt: null },
      select: { id: true }
    })
    if (!existing) return { ok: false, code: "NOT_FOUND" }

    const row = await tx.normPilotRequirementSet.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
      select: { id: true }
    })

    return { ok: true, data: row }
  })
}
