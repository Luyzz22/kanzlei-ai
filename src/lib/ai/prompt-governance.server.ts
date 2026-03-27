import "server-only"

import { PromptDefinitionStatus, PromptTaskStage, type PromptDefinition } from "@prisma/client"

import {
  buildExtractionPromptBody,
  buildRiskAndGuidancePromptBody,
  CONTRACT_EXTRACTION_PROMPT_KEY,
  CONTRACT_PROMPT_BUNDLE_KEY,
  CONTRACT_RISK_PROMPT_KEY,
  CONTRACT_ANALYSIS_PROMPT_VERSION
} from "@/lib/ai/prompt-registry/contract-defaults"
import type { ContractPromptResolver } from "@/lib/ai/analysis-pipeline"
import { prisma } from "@/lib/prisma"

export type ResolvedPromptPart = {
  key: string
  version: string
  text: string
  source: "database" | "registry_default"
  definitionId?: string
}

function matchesPattern(contractType: string, pattern: string): boolean {
  if (pattern === "*" || pattern === "") return true
  return contractType.toLowerCase().includes(pattern.toLowerCase()) || pattern.toLowerCase() === contractType.toLowerCase()
}

type ReleaseRow = {
  contractTypePattern: string
  tenantId: string | null
  promptDefinition: PromptDefinition
}

function pickDefinition(rows: ReleaseRow[], tenantId: string, contractTypeHint: string): PromptDefinition | null {
  const active = rows.filter((r) => r.promptDefinition.status === PromptDefinitionStatus.ACTIVE)
  const scoped = [
    ...active.filter((r) => r.tenantId === tenantId),
    ...active.filter((r) => r.tenantId === null)
  ]
  const matched = scoped.filter((r) => matchesPattern(contractTypeHint, r.contractTypePattern))
  const sorted = matched.sort((a, b) => {
    if (a.tenantId && !b.tenantId) return -1
    if (!a.tenantId && b.tenantId) return 1
    return b.contractTypePattern.length - a.contractTypePattern.length
  })
  return sorted[0]?.promptDefinition ?? null
}

async function loadReleaseRows(): Promise<{
  extraction: ReleaseRow[]
  risk: ReleaseRow[]
}> {
  const releases = await prisma.promptRelease.findMany({
    where: { active: true },
    include: { promptDefinition: true },
    orderBy: { effectiveFrom: "desc" }
  })

  const mapRow = (r: (typeof releases)[0]): ReleaseRow => ({
    contractTypePattern: r.contractTypePattern,
    tenantId: r.tenantId,
    promptDefinition: r.promptDefinition
  })

  return {
    extraction: releases.filter((r) => r.taskStage === PromptTaskStage.EXTRACTION).map(mapRow),
    risk: releases.filter((r) => r.taskStage === PromptTaskStage.RISK_AND_GUIDANCE).map(mapRow)
  }
}

export async function resolveExtractionPromptInput(params: {
  tenantId: string
  contractTypeHint: string
  normalizedDocument: string
}): Promise<ResolvedPromptPart> {
  const { extraction } = await loadReleaseRows()
  const def = pickDefinition(extraction, params.tenantId, params.contractTypeHint)
  if (!def) {
    return {
      key: CONTRACT_EXTRACTION_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildExtractionPromptBody(params.normalizedDocument, CONTRACT_ANALYSIS_PROMPT_VERSION),
      source: "registry_default"
    }
  }
  return {
    key: def.key,
    version: def.version,
    text: buildExtractionPromptBody(params.normalizedDocument, def.version),
    source: "database",
    definitionId: def.id
  }
}

export async function resolveRiskPromptInput(params: {
  tenantId: string
  contractTypeHint: string
  normalizedDocument: string
  extractionSummary: string
}): Promise<ResolvedPromptPart> {
  const { risk } = await loadReleaseRows()
  const def = pickDefinition(risk, params.tenantId, params.contractTypeHint)
  if (!def) {
    return {
      key: CONTRACT_RISK_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildRiskAndGuidancePromptBody(
        params.normalizedDocument,
        params.extractionSummary,
        CONTRACT_ANALYSIS_PROMPT_VERSION
      ),
      source: "registry_default"
    }
  }
  return {
    key: def.key,
    version: def.version,
    text: buildRiskAndGuidancePromptBody(params.normalizedDocument, params.extractionSummary, def.version),
    source: "database",
    definitionId: def.id
  }
}

export function createTenantContractPromptResolver(tenantId: string, documentTypeHint: string): ContractPromptResolver {
  return {
    resolveExtraction: async (normalizedDocument: string) =>
      resolveExtractionPromptInput({
        tenantId,
        contractTypeHint: documentTypeHint,
        normalizedDocument
      }),
    resolveRisk: async (normalizedDocument: string, extractionSummary: string, contractTypeLabel: string) =>
      resolveRiskPromptInput({
        tenantId,
        contractTypeHint: contractTypeLabel || documentTypeHint,
        normalizedDocument,
        extractionSummary
      })
  }
}

export class PromptResolutionError extends Error {
  readonly code = "PROMPT_RESOLUTION_FAILED"
  constructor(message: string) {
    super(message)
    this.name = "PromptResolutionError"
  }
}

export { CONTRACT_PROMPT_BUNDLE_KEY }
