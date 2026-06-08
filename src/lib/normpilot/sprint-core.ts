import "server-only"

import { createHash } from "node:crypto"

import { Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { resolveNormPilotActor } from "@/lib/normpilot/access"
import { NORMPILOT_AUDIT_ACTIONS } from "@/lib/normpilot/constants"
import { runNormPilotPipeline } from "@/lib/normpilot/pipeline"
import type {
  NormPilotPipelineEvidenceSource,
  NormPilotPipelineRequirementItem
} from "@/lib/normpilot/pipeline-types"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"
import { withTenant } from "@/lib/tenant-context.server"

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

const syntheticRequirements = [
  {
    code: "QMS-001",
    title: "Pruefbericht auffindbar",
    customerText: "Kundeneigene Kurzanforderung: Pruefberichte sollen pro Los auffindbar sein.",
    criticality: "MEDIUM" as const,
    sortOrder: 10
  },
  {
    code: "QMS-002",
    title: "Schulungsnachweis fuer Prueftaetigkeiten",
    customerText: "Kundeneigene Kurzanforderung: pruefende Rollen sollen aktuelle Schulungsnachweise besitzen.",
    criticality: "HIGH" as const,
    sortOrder: 20
  }
]

const syntheticSources = [
  {
    sourceType: "pdf",
    title: "Synthetischer Pruefbericht PB-2026-001",
    locator: { page: 2, sectionKey: "inspection-summary" }
  },
  {
    sourceType: "xlsx",
    title: "Synthetische Schulungsmatrix",
    locator: { sheet: "Training", row: 12, column: "D" }
  }
]

export async function runAndPersistNormPilotMockSprint(input: {
  tenantId: string
  actorId: string
  requirementSetId: string
}): Promise<NormPilotCoreResult<{ requirementSetId: string; mappingCount: number; gapCount: number; correctiveActionCount: number }>> {
  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "manage"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const requirementSet = await tx.normPilotRequirementSet.findFirst({
      where: { id: input.requirementSetId, tenantId: input.tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        frameworkLabel: true,
        scopeLabel: true,
        versionLabel: true,
        reviewState: true
      }
    })
    if (!requirementSet) return { ok: false, code: "NOT_FOUND" }

    let items = await tx.normPilotRequirementItem.findMany({
      where: { tenantId: input.tenantId, requirementSetId: requirementSet.id, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })

    if (items.length === 0) {
      await tx.normPilotRequirementItem.createMany({
        data: syntheticRequirements.map((item) => ({
          tenantId: input.tenantId,
          requirementSetId: requirementSet.id,
          code: item.code,
          title: item.title,
          customerText: item.customerText,
          criticality: item.criticality,
          sortOrder: item.sortOrder,
          reviewState: "UNGEPRUEFT"
        })),
        skipDuplicates: true
      })
      items = await tx.normPilotRequirementItem.findMany({
        where: { tenantId: input.tenantId, requirementSetId: requirementSet.id, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      })
    }

    let sources = await tx.normPilotEvidenceSource.findMany({
      where: { tenantId: input.tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: 10
    })

    if (sources.length === 0) {
      await tx.normPilotEvidenceSource.createMany({
        data: syntheticSources.map((source) => ({
          tenantId: input.tenantId,
          sourceType: source.sourceType,
          title: source.title,
          sourceHash: sha256(`${input.tenantId}:${requirementSet.id}:${source.title}`),
          locator: source.locator,
          reviewState: "UNGEPRUEFT"
        }))
      })
      sources = await tx.normPilotEvidenceSource.findMany({
        where: { tenantId: input.tenantId, deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 10
      })
    }

    const pipeline = await runNormPilotPipeline(
      {
        caseId: `persisted-mock-${requirementSet.id}`,
        tenantId: input.tenantId,
        syntheticOrAnonymized: true,
        requirementSet: {
          id: requirementSet.id,
          title: requirementSet.title,
          frameworkLabel: requirementSet.frameworkLabel ?? undefined,
          scopeLabel: requirementSet.scopeLabel ?? undefined,
          versionLabel: requirementSet.versionLabel ?? undefined,
          sourceKind: "customer_checklist",
          reviewState: requirementSet.reviewState
        },
        requirements: items.map(
          (item): NormPilotPipelineRequirementItem => ({
            id: item.id,
            requirementSetId: item.requirementSetId,
            code: item.code,
            title: item.title,
            customerText: item.customerText ?? undefined,
            normReferenceCode: item.normReferenceCode ?? undefined,
            sectionLabel: item.sectionLabel ?? undefined,
            criticality: item.criticality ?? undefined,
            sortOrder: item.sortOrder,
            reviewState: item.reviewState
          })
        ),
        evidenceSources: sources.map(
          (source): NormPilotPipelineEvidenceSource => ({
            id: source.id,
            documentId: source.documentId ?? undefined,
            sourceType: source.sourceType,
            title: source.title,
            sourceHash: source.sourceHash ?? undefined,
            locator: (source.locator as Record<string, unknown> | null) ?? undefined,
            reviewState: source.reviewState
          })
        ),
        governance: {
          tenantId: input.tenantId,
          provider: "local",
          allowedProviders: ["local"],
          syntheticOrAnonymized: true,
          containsPersonalData: false,
          requirePseudonymization: false,
          allowThirdCountryLlmTransfer: false
        }
      },
      { mock: true }
    )

    await tx.normPilotEvidenceMapping.deleteMany({
      where: {
        tenantId: input.tenantId,
        requirementItem: { tenantId: input.tenantId, requirementSetId: requirementSet.id },
        provider: "mock",
        model: "synthetic"
      }
    })

    const mappingByRequirement = new Map<string, string>()
    for (const mapping of pipeline.mapping.mappings) {
      const row = await tx.normPilotEvidenceMapping.create({
        data: {
          tenantId: input.tenantId,
          requirementItemId: mapping.requirementItemId,
          evidenceSourceId: mapping.evidenceSourceId,
          status: mapping.status,
          confidence: mapping.confidence,
          rationale: mapping.rationale,
          anchorText: mapping.anchorText,
          locator: mapping.locator as Prisma.InputJsonValue | undefined,
          evidenceHash: mapping.evidenceHash,
          promptKey: mapping.promptKey,
          promptVersion: mapping.promptVersion,
          provider: mapping.provider,
          model: mapping.model,
          reviewState: "UNGEPRUEFT"
        },
        select: { id: true, requirementItemId: true }
      })
      mappingByRequirement.set(row.requirementItemId, row.id)
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: NORMPILOT_AUDIT_ACTIONS.evidenceMapped,
        resourceType: "normpilot_evidence_mapping",
        resourceId: row.id,
        metadata: {
          requirementItemId: row.requirementItemId,
          evidenceSourceId: mapping.evidenceSourceId ?? null,
          status: mapping.status,
          reviewState: "UNGEPRUEFT",
          promptVersion: mapping.promptVersion ?? null
        }
      })
    }

    const gapByRequirement = new Map<string, string>()
    for (const gap of pipeline.gapAnalysis.gaps) {
      const row = await tx.normPilotGapFinding.create({
        data: {
          tenantId: input.tenantId,
          requirementSetId: requirementSet.id,
          requirementItemId: gap.requirementItemId,
          evidenceMappingId: gap.requirementItemId ? mappingByRequirement.get(gap.requirementItemId) : undefined,
          severity: gap.severity,
          title: gap.title,
          description: gap.description,
          recommendation: gap.recommendation,
          sourceSummary: gap.sourceSummary as Prisma.InputJsonValue | undefined,
          confidence: gap.confidence,
          promptKey: gap.promptKey,
          promptVersion: gap.promptVersion,
          provider: gap.provider,
          model: gap.model,
          reviewState: "UNGEPRUEFT"
        },
        select: { id: true, requirementItemId: true, severity: true }
      })
      if (row.requirementItemId) gapByRequirement.set(row.requirementItemId, row.id)
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: NORMPILOT_AUDIT_ACTIONS.gapGenerated,
        resourceType: "normpilot_gap_finding",
        resourceId: row.id,
        metadata: {
          requirementSetId: requirementSet.id,
          requirementItemId: row.requirementItemId,
          severity: row.severity,
          reviewState: "UNGEPRUEFT",
          promptVersion: gap.promptVersion ?? null
        }
      })
    }

    for (const action of pipeline.correctiveActionDraft.correctiveActions) {
      const row = await tx.normPilotCorrectiveAction.create({
        data: {
          tenantId: input.tenantId,
          gapFindingId: action.requirementItemId ? gapByRequirement.get(action.requirementItemId) : undefined,
          requirementItemId: action.requirementItemId,
          title: action.title,
          description: action.description,
          ownerRole: action.ownerRole,
          ownerLabel: action.ownerLabel,
          dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
          status: "DRAFT",
          acceptanceCriteria: action.acceptanceCriteria,
          reviewState: "UNGEPRUEFT"
        },
        select: { id: true, requirementItemId: true, gapFindingId: true }
      })
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: NORMPILOT_AUDIT_ACTIONS.correctiveActionDrafted,
        resourceType: "normpilot_corrective_action",
        resourceId: row.id,
        metadata: {
          requirementSetId: requirementSet.id,
          requirementItemId: row.requirementItemId,
          gapFindingId: row.gapFindingId,
          status: "DRAFT",
          reviewState: "UNGEPRUEFT"
        }
      })
    }

    return {
      ok: true,
      data: {
        requirementSetId: requirementSet.id,
        mappingCount: pipeline.mapping.mappings.length,
        gapCount: pipeline.gapAnalysis.gaps.length,
        correctiveActionCount: pipeline.correctiveActionDraft.correctiveActions.length
      }
    }
  })
}
