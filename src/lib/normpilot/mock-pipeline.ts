import { createHash } from "node:crypto"

import {
  buildNormPilotCorrectiveActionPrompt,
  buildNormPilotEvidenceExtractionPrompt,
  buildNormPilotEvidenceMappingPrompt,
  buildNormPilotEvidencePackSummaryPrompt,
  buildNormPilotGapAnalysisPrompt
} from "@/lib/ai/prompt-registry/normpilot-defaults"
import {
  normPilotCorrectiveActionDraftOutputSchema,
  normPilotEvidenceExtractionOutputSchema,
  normPilotEvidenceMappingOutputSchema,
  normPilotEvidencePackSummaryOutputSchema,
  normPilotGapAnalysisOutputSchema,
  normPilotPipelineOutputSchema,
  type NormPilotEvidenceCandidate,
  type NormPilotPromptMetadata
} from "@/lib/ai/schemas/normpilot"
import {
  NORMPILOT_AI_NOTICE,
  NORMPILOT_NORM_LICENSE_NOTICE,
  NORMPILOT_PROMPT_BUNDLE_KEY,
  NORMPILOT_PROMPT_VERSION
} from "@/lib/normpilot/constants"
import { buildNormPilotEvidencePackExport } from "@/lib/normpilot/export-structure"
import {
  clampNormPilotConfidence,
  coerceNormPilotEvidenceStatus,
  coerceNormPilotSeverity,
  type NormPilotEvidenceStatus,
  type NormPilotGapSeverity
} from "@/lib/normpilot/mappings"
import { evaluateNormPilotPolicy } from "@/lib/normpilot/policy"
import type {
  NormPilotPipelineEvidenceSource,
  NormPilotPipelineInput,
  NormPilotPipelineRequirementItem,
  NormPilotPipelineResult
} from "@/lib/normpilot/pipeline-types"

const DIRECT_NORM_FALLBACK_NOTICE = "Diesen Abschnitt bitte direkt in der Norm pruefen."

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function shortId(prefix: string, seed: string): string {
  return `${prefix}-${hashText(seed).slice(0, 12)}`
}

function stageCompliance() {
  return {
    aiNotice: NORMPILOT_AI_NOTICE,
    normLicenseNotice: NORMPILOT_NORM_LICENSE_NOTICE,
    reviewStateDefault: "UNGEPRUEFT" as const
  }
}

function metadata(prompt: { key: string; version: typeof NORMPILOT_PROMPT_VERSION }, inputHash: string): NormPilotPromptMetadata {
  return {
    bundleKey: NORMPILOT_PROMPT_BUNDLE_KEY,
    promptKey: prompt.key,
    promptVersion: prompt.version,
    providerLabel: "mock",
    modelLabel: "synthetic",
    inputHash
  }
}

function normalizedRequirementId(requirement: NormPilotPipelineRequirementItem, index: number): string {
  return requirement.id ?? shortId("req-item", `${requirement.code}:${requirement.title}:${index}`)
}

function normalizedSourceId(source: NormPilotPipelineEvidenceSource, index: number): string {
  return source.id ?? shortId("evidence-source", `${source.title}:${source.sourceType}:${index}`)
}

function isPromptInjectionText(text?: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return (
    lower.includes("ignoriere alle systemregeln") ||
    lower.includes("ignore all system") ||
    lower.includes("proprietary norm text") ||
    lower.includes("norm-volltext")
  )
}

function anchorForSource(source: NormPilotPipelineEvidenceSource): string {
  const locator = source.locator
  const parts = [source.title]
  if (locator?.page) parts.push(`Seite ${locator.page}`)
  if (locator?.sheet) parts.push(`Sheet ${locator.sheet}`)
  if (locator?.row) parts.push(`Zeile ${locator.row}`)
  return parts.join(", ").slice(0, 280)
}

function buildCandidates(input: NormPilotPipelineInput, inputHash: string): NormPilotEvidenceCandidate[] {
  const injection = isPromptInjectionText(input.documentText)
  return input.evidenceSources.map((source, index) => {
    const id = normalizedSourceId(source, index)
    const anchorText = injection ? DIRECT_NORM_FALLBACK_NOTICE : anchorForSource(source)
    return {
      id,
      documentId: source.documentId,
      sourceType: source.sourceType,
      title: source.title,
      sourceHash: source.sourceHash ?? hashText(`${inputHash}:source:${id}`),
      evidenceHash: hashText(`${inputHash}:evidence:${id}:${anchorText}`),
      locator: source.locator,
      anchorText,
      confidence: injection ? 0.42 : 0.82,
      reviewState: "UNGEPRUEFT",
      retentionUntil: source.retentionUntil
    }
  })
}

function statusForRequirement(
  requirement: NormPilotPipelineRequirementItem,
  sources: NormPilotPipelineEvidenceSource[],
  injection: boolean
): NormPilotEvidenceStatus {
  if (injection) return "NEEDS_REVIEW"
  if (sources.length === 0) return "MISSING"

  const text = `${requirement.code} ${requirement.title} ${requirement.customerText ?? ""}`.toLowerCase()
  const sourceText = sources.map((s) => `${s.title} ${s.sourceType}`).join(" ").toLowerCase()

  if (text.includes("nicht anwendbar")) return "NOT_APPLICABLE"
  if (text.includes("schulung") || text.includes("training")) {
    return sourceText.includes("schulung") || sourceText.includes("training") ? "PARTIAL" : "MISSING"
  }
  if (text.includes("widerspruch") || sourceText.includes("konflikt")) return "CONFLICTING"
  return "COVERED"
}

function severityForStatus(
  requirement: NormPilotPipelineRequirementItem,
  status: NormPilotEvidenceStatus
): NormPilotGapSeverity {
  if (status === "CONFLICTING") return "HIGH"
  if (status === "MISSING") return coerceNormPilotSeverity(requirement.criticality, "HIGH")
  if (status === "PARTIAL" || status === "NEEDS_REVIEW") return "MEDIUM"
  return "LOW"
}

export function runNormPilotMockPipeline(input: NormPilotPipelineInput): NormPilotPipelineResult {
  const inputHash = hashText(
    JSON.stringify({
      caseId: input.caseId,
      requirementSet: input.requirementSet,
      requirements: input.requirements,
      evidenceSources: input.evidenceSources,
      documentText: input.documentText ?? ""
    })
  )
  const policy = evaluateNormPilotPolicy(input)
  const injection = isPromptInjectionText(input.documentText)
  const requirementSetId = input.requirementSet.id ?? shortId("req-set", input.requirementSet.title)
  const evidenceExtractionPrompt = buildNormPilotEvidenceExtractionPrompt()
  const evidenceMappingPrompt = buildNormPilotEvidenceMappingPrompt()
  const gapAnalysisPrompt = buildNormPilotGapAnalysisPrompt()
  const correctivePrompt = buildNormPilotCorrectiveActionPrompt()
  const summaryPrompt = buildNormPilotEvidencePackSummaryPrompt()

  const candidates = buildCandidates(input, inputHash)
  const extraction = normPilotEvidenceExtractionOutputSchema.parse({
    candidates,
    compliance: stageCompliance(),
    promptMetadata: metadata(evidenceExtractionPrompt, inputHash)
  })

  const mappings = input.requirements.map((requirement, index) => {
    const requirementItemId = normalizedRequirementId(requirement, index)
    const candidate = candidates[index % Math.max(candidates.length, 1)]
    const rawStatus = statusForRequirement(requirement, input.evidenceSources, injection)
    const status = coerceNormPilotEvidenceStatus(rawStatus)
    const confidence = clampNormPilotConfidence(
      status === "COVERED" ? 0.82 : status === "PARTIAL" ? 0.64 : status === "MISSING" ? 0.38 : 0.5
    )
    return {
      requirementItemId,
      evidenceSourceId: candidate?.id,
      status,
      confidence,
      rationale: injection
        ? "Dokumentinhalt enthaelt feindliche Instruktionen; als Daten behandelt und zur Pruefung markiert."
        : `Synthetisches Mapping fuer ${requirement.code}.`,
      anchorText: candidate?.anchorText,
      locator: candidate?.locator,
      evidenceHash: candidate?.evidenceHash,
      promptKey: evidenceMappingPrompt.key,
      promptVersion: evidenceMappingPrompt.version,
      provider: "mock",
      model: "synthetic",
      reviewState: "UNGEPRUEFT"
    }
  })

  const mapping = normPilotEvidenceMappingOutputSchema.parse({
    mappings,
    compliance: stageCompliance(),
    promptMetadata: metadata(evidenceMappingPrompt, inputHash)
  })

  const gaps = mapping.mappings
    .map((mappingItem, index) => {
      if (mappingItem.status === "COVERED" || mappingItem.status === "NOT_APPLICABLE") return null
      const requirement = input.requirements[index]
      if (!requirement) return null
      const severity = severityForStatus(requirement, mappingItem.status)
      return {
        requirementSetId,
        requirementItemId: mappingItem.requirementItemId,
        evidenceMappingId: shortId("mapping", `${mappingItem.requirementItemId}:${mappingItem.status}`),
        severity,
        title:
          mappingItem.status === "MISSING"
            ? `${requirement.code}: Nachweis fehlt`
            : `${requirement.code}: Nachweis pruefen`,
        description: injection
          ? DIRECT_NORM_FALLBACK_NOTICE
          : `Synthetischer Gap fuer ${requirement.title} mit Status ${mappingItem.status}.`,
        recommendation:
          mappingItem.status === "MISSING"
            ? "Fehlenden Nachweis beschaffen, pruefen und dem Requirement zuordnen."
            : "Nachweisqualitaet fachlich pruefen und Mapping freigeben oder korrigieren.",
        sourceSummary: [
          {
            requirementCode: requirement.code,
            evidenceSourceTitle: input.evidenceSources[index % Math.max(input.evidenceSources.length, 1)]?.title,
            locator: mappingItem.locator
          }
        ],
        confidence: Math.min(mappingItem.confidence ?? 0.5, 0.98),
        promptKey: gapAnalysisPrompt.key,
        promptVersion: gapAnalysisPrompt.version,
        provider: "mock",
        model: "synthetic",
        reviewState: "UNGEPRUEFT"
      }
    })
    .filter((gap): gap is NonNullable<typeof gap> => gap != null)

  const gapAnalysis = normPilotGapAnalysisOutputSchema.parse({
    gaps,
    fallbackNotice: injection ? DIRECT_NORM_FALLBACK_NOTICE : undefined,
    compliance: stageCompliance(),
    promptMetadata: metadata(gapAnalysisPrompt, inputHash)
  })

  const correctiveActions = gapAnalysis.gaps.map((gap, index) => ({
    gapFindingId: shortId("gap", `${gap.requirementItemId ?? ""}:${gap.title}:${index}`),
    requirementItemId: gap.requirementItemId,
    title: `Massnahme: ${gap.title}`.slice(0, 240),
    description: gap.recommendation,
    ownerRole: "QM",
    ownerLabel: "Rollenplatzhalter",
    status: "DRAFT",
    acceptanceCriteria: "Nachweis ist quellengebunden ergaenzt, intern reviewed und im Evidence Pack sichtbar.",
    reviewState: "UNGEPRUEFT"
  }))

  const correctiveActionDraft = normPilotCorrectiveActionDraftOutputSchema.parse({
    correctiveActions,
    compliance: stageCompliance(),
    promptMetadata: metadata(correctivePrompt, inputHash)
  })

  const evidencePack = buildNormPilotEvidencePackExport({
    requirementSet: {
      id: requirementSetId,
      title: input.requirementSet.title,
      frameworkLabel: input.requirementSet.frameworkLabel,
      scopeLabel: input.requirementSet.scopeLabel,
      versionLabel: input.requirementSet.versionLabel,
      reviewState: "IN_PRUEFUNG"
    },
    requirements: input.requirements.map((requirement, index) => ({
      id: normalizedRequirementId(requirement, index),
      code: requirement.code,
      title: requirement.title,
      normReferenceCode: requirement.normReferenceCode,
      reviewState: requirement.reviewState ?? "UNGEPRUEFT"
    })),
    evidenceMatrix: mapping.mappings.map((mappingItem, index) => ({
      requirementCode: input.requirements[index]?.code ?? `REQ-${index + 1}`,
      evidenceSourceTitle: input.evidenceSources[index % Math.max(input.evidenceSources.length, 1)]?.title,
      status: mappingItem.status,
      confidence: mappingItem.confidence,
      locator: mappingItem.locator,
      anchorText: mappingItem.anchorText,
      evidenceHash: mappingItem.evidenceHash,
      reviewState: mappingItem.reviewState
    })),
    gaps: gapAnalysis.gaps.map((gap, index) => ({
      requirementCode: input.requirements[index]?.code,
      severity: gap.severity,
      title: gap.title,
      description: gap.description,
      recommendation: gap.recommendation,
      reviewState: gap.reviewState
    })),
    correctiveActions: correctiveActionDraft.correctiveActions.map((action) => ({
      title: action.title,
      ownerRole: action.ownerRole,
      ownerLabel: action.ownerLabel,
      status: action.status,
      acceptanceCriteria: action.acceptanceCriteria,
      reviewState: action.reviewState
    })),
    promptMetadata: {
      promptKeys: [
        evidenceExtractionPrompt.key,
        evidenceMappingPrompt.key,
        gapAnalysisPrompt.key,
        correctivePrompt.key,
        summaryPrompt.key
      ],
      promptVersions: [NORMPILOT_PROMPT_VERSION],
      providerLabels: ["mock"],
      modelLabels: ["synthetic"]
    },
    generatedAt: input.generatedAt ?? new Date("2026-06-08T00:00:00.000Z")
  })

  const evidencePackSummary = normPilotEvidencePackSummaryOutputSchema.parse({
    evidencePack,
    compliance: stageCompliance(),
    promptMetadata: metadata(summaryPrompt, inputHash)
  })

  return normPilotPipelineOutputSchema.parse({
    caseId: input.caseId,
    inputHash,
    extraction,
    mapping,
    gapAnalysis,
    correctiveActionDraft,
    evidencePackSummary,
    policy
  })
}

export { DIRECT_NORM_FALLBACK_NOTICE }
