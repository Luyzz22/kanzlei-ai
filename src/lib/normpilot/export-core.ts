import "server-only"

import { createHash } from "node:crypto"

import { Prisma, type NormPilotEvidencePackExportFormat } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"
import { resolveNormPilotActor } from "@/lib/normpilot/access"
import { NORMPILOT_AUDIT_ACTIONS } from "@/lib/normpilot/constants"
import {
  buildNormPilotEvidencePackExport,
  type NormPilotEvidencePackExport
} from "@/lib/normpilot/export-structure"
import type { NormPilotCoreResult } from "@/lib/normpilot/requirement-core"

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

export function buildNormPilotEvidencePackMarkdown(manifest: NormPilotEvidencePackExport): string {
  const lines: string[] = [
    `# ${manifest.requirementSet.title}`,
    "",
    manifest.aiNotice,
    "",
    `Normlizenz: ${manifest.compliance.normLicenseNotice}`,
    `EU AI Act: ${manifest.compliance.euAiActRiskClass}`,
    `Generiert: ${manifest.generatedAt}`,
    "",
    "## Requirement Set",
    "",
    `- Review-State: ${manifest.requirementSet.reviewState}`,
    `- Framework: ${manifest.requirementSet.frameworkLabel ?? "Nicht gesetzt"}`,
    `- Scope: ${manifest.requirementSet.scopeLabel ?? "Nicht gesetzt"}`,
    `- Version: ${manifest.requirementSet.versionLabel ?? "Nicht gesetzt"}`,
    "",
    "## Requirements",
    "",
    "| Code | Titel | Review-State |",
    "|---|---|---|",
    ...manifest.requirements.map((item) => `| ${item.code} | ${item.title} | ${item.reviewState} |`),
    "",
    "## Evidence Matrix",
    "",
    "| Requirement | Evidence Source | Status | Confidence | Locator | Review-State |",
    "|---|---|---:|---:|---|---|",
    ...manifest.evidenceMatrix.map((row) => {
      const locator = row.locator ? JSON.stringify(row.locator) : ""
      return `| ${row.requirementCode} | ${row.evidenceSourceTitle ?? ""} | ${row.status} | ${row.confidence ?? ""} | ${locator} | ${row.reviewState} |`
    }),
    "",
    "## Gaps",
    "",
    "| Requirement | Severity | Titel | Review-State |",
    "|---|---:|---|---|",
    ...manifest.gaps.map((gap) => `| ${gap.requirementCode ?? ""} | ${gap.severity} | ${gap.title} | ${gap.reviewState} |`),
    "",
    "## Corrective Actions",
    "",
    "| Titel | Owner-Rolle | Status | Review-State |",
    "|---|---|---:|---|",
    ...manifest.correctiveActions.map(
      (action) => `| ${action.title} | ${action.ownerRole ?? ""} | ${action.status} | ${action.reviewState} |`
    ),
    "",
    "## Prompt-Metadaten",
    "",
    `- Prompt-Keys: ${(manifest.promptMetadata?.promptKeys ?? []).join(", ") || "Nicht gesetzt"}`,
    `- Prompt-Versionen: ${(manifest.promptMetadata?.promptVersions ?? []).join(", ") || "Nicht gesetzt"}`,
    `- Provider: ${(manifest.promptMetadata?.providerLabels ?? []).join(", ") || "Nicht gesetzt"}`,
    `- Modelle: ${(manifest.promptMetadata?.modelLabels ?? []).join(", ") || "Nicht gesetzt"}`
  ]

  return `${lines.join("\n")}\n`
}

export function buildNormPilotEvidenceMatrixCsv(manifest: NormPilotEvidencePackExport): string {
  const rows = [
    ["Requirement", "Evidence Source", "Status", "Confidence", "Review-State", "Locator"],
    ...manifest.evidenceMatrix.map((row) => [
      row.requirementCode,
      row.evidenceSourceTitle ?? "",
      row.status,
      row.confidence ?? "",
      row.reviewState,
      row.locator ? JSON.stringify(row.locator) : ""
    ])
  ]
  return `${rows.map((row) => row.map(csvCell).join(";")).join("\n")}\n`
}

export function buildNormPilotGapCsv(manifest: NormPilotEvidencePackExport): string {
  const rows = [
    ["Requirement", "Severity", "Title", "Review-State"],
    ...manifest.gaps.map((gap) => [gap.requirementCode ?? "", gap.severity, gap.title, gap.reviewState])
  ]
  return `${rows.map((row) => row.map(csvCell).join(";")).join("\n")}\n`
}

export async function buildNormPilotEvidencePackManifest(
  tenantId: string,
  requirementSetId: string
): Promise<NormPilotEvidencePackExport | null> {
  return withTenant(tenantId, async (tx) => {
    const set = await tx.normPilotRequirementSet.findFirst({
      where: { id: requirementSetId, tenantId, deletedAt: null },
      include: {
        items: {
          where: { tenantId, deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            mappings: {
              where: { tenantId, deletedAt: null },
              include: {
                evidenceSource: {
                  select: { title: true }
                }
              }
            },
            gapFindings: {
              where: { tenantId, deletedAt: null }
            },
            correctiveActions: {
              where: { tenantId, deletedAt: null }
            }
          }
        },
        gapFindings: {
          where: { tenantId, deletedAt: null }
        }
      }
    })

    if (!set) return null

    const gapOnlyActions = await tx.normPilotCorrectiveAction.findMany({
      where: {
        tenantId,
        deletedAt: null,
        requirementItemId: null,
        gapFindingId: {
          in: set.gapFindings.map((gap) => gap.id)
        }
      }
    })

    const mappings = set.items.flatMap((item) =>
      item.mappings.map((mapping) => ({
        requirementCode: item.code,
        evidenceSourceTitle: mapping.evidenceSource?.title,
        status: mapping.status,
        confidence: mapping.confidence ?? undefined,
        locator: (mapping.locator as Record<string, unknown> | null) ?? undefined,
        anchorText: mapping.anchorText ?? undefined,
        evidenceHash: mapping.evidenceHash ?? undefined,
        reviewState: mapping.reviewState
      }))
    )

    const gaps = set.gapFindings.map((gap) => {
      const requirementCode = set.items.find((item) => item.id === gap.requirementItemId)?.code
      return {
        requirementCode,
        severity: gap.severity,
        title: gap.title,
        description: gap.description,
        recommendation: gap.recommendation ?? undefined,
        reviewState: gap.reviewState
      }
    })

    const actions = [
      ...set.items.flatMap((item) => item.correctiveActions),
      ...gapOnlyActions
    ].map((action) => ({
        title: action.title,
        ownerRole: action.ownerRole ?? undefined,
        ownerLabel: action.ownerLabel ?? undefined,
        status: action.status,
        acceptanceCriteria: action.acceptanceCriteria ?? undefined,
        reviewState: action.reviewState
      }))

    const promptKeys = uniqueStrings([
      ...set.items.flatMap((item) => item.mappings.map((mapping) => mapping.promptKey)),
      ...set.gapFindings.map((gap) => gap.promptKey)
    ])
    const promptVersions = uniqueStrings([
      ...set.items.flatMap((item) => item.mappings.map((mapping) => mapping.promptVersion)),
      ...set.gapFindings.map((gap) => gap.promptVersion)
    ])
    const providerLabels = uniqueStrings([
      ...set.items.flatMap((item) => item.mappings.map((mapping) => mapping.provider)),
      ...set.gapFindings.map((gap) => gap.provider)
    ])
    const modelLabels = uniqueStrings([
      ...set.items.flatMap((item) => item.mappings.map((mapping) => mapping.model)),
      ...set.gapFindings.map((gap) => gap.model)
    ])

    return buildNormPilotEvidencePackExport({
      requirementSet: {
        id: set.id,
        title: set.title,
        frameworkLabel: set.frameworkLabel ?? undefined,
        scopeLabel: set.scopeLabel ?? undefined,
        versionLabel: set.versionLabel ?? undefined,
        reviewState: set.reviewState
      },
      requirements: set.items.map((item) => ({
        id: item.id,
        code: item.code,
        title: item.title,
        normReferenceCode: item.normReferenceCode ?? undefined,
        reviewState: item.reviewState
      })),
      evidenceMatrix: mappings,
      gaps,
      correctiveActions: actions,
      promptMetadata: {
        promptKeys,
        promptVersions,
        providerLabels,
        modelLabels
      }
    })
  })
}

export async function generateNormPilotEvidencePackExport(input: {
  tenantId: string
  actorId: string
  requirementSetId: string
  format?: NormPilotEvidencePackExportFormat
}): Promise<NormPilotCoreResult<{ id: string; markdown: string; csv?: string; manifest: NormPilotEvidencePackExport }>> {
  return withTenant(input.tenantId, async (tx) => {
    const actor = await resolveNormPilotActor(tx as Prisma.TransactionClient, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      permission: "export"
    })
    if (!actor.ok) return { ok: false, code: actor.code }

    const settings = await tx.tenantGovernanceSettings.findUnique({
      where: { tenantId: input.tenantId },
      select: { auditEvidenceRetentionDays: true }
    })
    const retentionDays = settings?.auditEvidenceRetentionDays ?? 1825
    const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)

    const requested = await tx.normPilotEvidencePackExport.create({
      data: {
        tenantId: input.tenantId,
        requirementSetId: input.requirementSetId,
        title: `NormPilot Evidence Pack ${new Date().toISOString().slice(0, 10)}`,
        format: input.format ?? "MARKDOWN",
        status: "REQUESTED",
        exportManifest: {},
        retentionUntil
      },
      select: { id: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: NORMPILOT_AUDIT_ACTIONS.evidencePackRequested,
      resourceType: "normpilot_evidence_pack_export",
      resourceId: requested.id,
      metadata: {
        requirementSetId: input.requirementSetId,
        format: input.format ?? "MARKDOWN"
      }
    })

    const manifest = await buildNormPilotEvidencePackManifest(input.tenantId, input.requirementSetId)
    if (!manifest) {
      await tx.normPilotEvidencePackExport.update({
        where: { id: requested.id },
        data: { status: "FAILED" }
      })
      await writeAuditEventTx(tx, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: NORMPILOT_AUDIT_ACTIONS.evidencePackFailed,
        resourceType: "normpilot_evidence_pack_export",
        resourceId: requested.id,
        metadata: {
          requirementSetId: input.requirementSetId,
          errorCode: "REQUIREMENT_SET_NOT_FOUND"
        }
      })
      return { ok: false, code: "NOT_FOUND" }
    }

    const markdown = buildNormPilotEvidencePackMarkdown(manifest)
    const csv =
      input.format === "CSV"
        ? `${buildNormPilotEvidenceMatrixCsv(manifest)}\n${buildNormPilotGapCsv(manifest)}`
        : undefined
    const contentHash = sha256(input.format === "CSV" && csv ? csv : markdown)

    const updated = await tx.normPilotEvidencePackExport.update({
      where: { id: requested.id },
      data: {
        status: "GENERATED",
        contentHash,
        exportManifest: manifest as unknown as Prisma.InputJsonValue,
        promptMetadata: (manifest.promptMetadata ?? {}) as Prisma.InputJsonValue,
        reviewSnapshot: {
          requirementCount: manifest.requirements.length,
          mappingCount: manifest.evidenceMatrix.length,
          gapCount: manifest.gaps.length,
          correctiveActionCount: manifest.correctiveActions.length,
          requirementSetReviewState: manifest.requirementSet.reviewState
        },
        generatedAt: new Date(),
        retentionUntil
      },
      select: { id: true }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: NORMPILOT_AUDIT_ACTIONS.evidencePackGenerated,
      resourceType: "normpilot_evidence_pack_export",
      resourceId: updated.id,
      metadata: {
        requirementSetId: input.requirementSetId,
        format: input.format ?? "MARKDOWN",
        contentHash,
        requirementCount: manifest.requirements.length,
        mappingCount: manifest.evidenceMatrix.length,
        gapCount: manifest.gaps.length,
        correctiveActionCount: manifest.correctiveActions.length,
        promptVersions: manifest.promptMetadata?.promptVersions ?? []
      }
    })

    return { ok: true, data: { id: updated.id, markdown, csv, manifest } }
  })
}
