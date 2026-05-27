import { createHash } from "node:crypto"

import { z } from "zod"

import { log } from "@/lib/security/secure-logging"

import {
  anthropicEffectiveMaxOutputTokens,
  contractAnalysisClaudeOnly,
  resolveAnthropicModelProfile
} from "@/lib/ai/claude-model-config"
import {
  buildModelExecutionPlan,
  getSelectionReasonForStage,
  type PipelineStage,
  type RouterContext
} from "@/lib/ai/analysis-router"
import {
  buildClassificationPromptInstructions,
  buildExtractionPromptInstructions,
  buildRiskAndGuidancePromptInstructions,
  buildRiskFindingsPromptInstructions,
  buildRiskGuidancePromptInstructions,
  CONTRACT_CLASSIFICATION_PROMPT_KEY,
  CONTRACT_EXTRACTION_PROMPT_KEY,
  CONTRACT_PROMPT_BUNDLE_KEY,
  CONTRACT_RISK_PROMPT_KEY,
  CONTRACT_ANALYSIS_PROMPT_VERSION,
  shouldSplitRiskStage
} from "@/lib/ai/prompt-registry/contract-defaults"
import { calculateCost } from "@/lib/ai/cost-tracker"
import { createProvider } from "@/lib/ai/providers"
import { formatStageFailureMessage } from "@/lib/ai/pipeline-failure-messages"
import {
  type ClassificationStagePayload,
  type ExtractionStagePayload,
  type RiskAndGuidanceStagePayload,
  classificationStageSchema,
  extractionStageSchema,
  formatZodIssuesForErrorCode,
  parseJsonUnknown,
  preprocessRiskStageJson,
  riskAndGuidanceStageSchema,
  riskFindingsStageSchema,
  riskGuidanceStageSchema
} from "@/lib/ai/schemas/contract-analysis"
import { ModelType } from "@/types/ai"
import { AiProviderKind, AnalysisPipelineStageName } from "@prisma/client"

export type ContractPromptResolver = {
  resolveClassification: (normalizedDocument: string) => Promise<{
    key: string
    version: string
    text: string
    source?: "database" | "registry_default"
  }>
  resolveExtraction: (
    normalizedDocument: string,
    classification?: ClassificationStagePayload | null
  ) => Promise<{
    key: string
    version: string
    text: string
    source?: "database" | "registry_default"
  }>
  resolveRisk: (
    normalizedDocument: string,
    extractionSummary: string,
    contractTypeLabel: string,
    classification?: ClassificationStagePayload | null
  ) => Promise<{
    key: string
    version: string
    text: string
    source?: "database" | "registry_default"
  }>
}

export type ContractPipelinePromptMetadata = {
  bundleKey: string
  classificationKey: string
  classificationVersion: string
  classificationSource: "database" | "registry_default"
  extractionKey: string
  extractionVersion: string
  extractionSource: "database" | "registry_default"
  riskKey: string
  riskVersion: string
  riskSource: "database" | "registry_default"
}

export type StageAttemptLog = {
  stage: AnalysisPipelineStageName
  attemptOrder: number
  provider: AiProviderKind
  model: string
  selectionReason: string
  wasPrimaryChoice: boolean
  wasSuccessful: boolean
  fallbackFromProvider: AiProviderKind | null
  latencyMs: number
  tokensUsed: number
  errorCode: string | null
  structuredValid: boolean
}

export type ContractPipelineSuccess = {
  classification: ClassificationStagePayload | null
  extraction: ExtractionStagePayload
  risk: RiskAndGuidanceStagePayload
  stageLogs: StageAttemptLog[]
  primaryModel: ModelType
  primaryProvider: AiProviderKind
  totalTokens: number
  totalCost: number
  routerSummary: string
  fallbackModelKeys: string[]
  inputTextHash: string
  aggregateConfidence: number | null
  promptMetadata: ContractPipelinePromptMetadata
}

export type StageResolvedPrompt = {
  key: string
  version: string
  source?: "database" | "registry_default"
}

export type ClassificationStageResult = {
  classification: ClassificationStagePayload | null
  classificationResolved: StageResolvedPrompt | null
  stageLogs: StageAttemptLog[]
  fallbackKeys: string[]
}

export type ExtractionStageResult = {
  extraction: ExtractionStagePayload
  extractionModel: ModelType
  extractionTokens: number
  extractionResolved: StageResolvedPrompt
  stageLogs: StageAttemptLog[]
  fallbackKeys: string[]
}

export type RiskStageResult = {
  risk: RiskAndGuidanceStagePayload
  riskModel: ModelType
  riskTokens: number
  riskResolved: StageResolvedPrompt
  stageLogs: StageAttemptLog[]
  fallbackKeys: string[]
}

export class PipelineStageFailureError extends Error {
  readonly code = "PIPELINE_STAGE_FAILED"
  constructor(
    readonly stage: AnalysisPipelineStageName,
    message: string,
    readonly stageLogs: StageAttemptLog[] = [],
    readonly fallbackKeys: string[] = []
  ) {
    super(message)
    this.name = "PipelineStageFailureError"
  }
}

function providerKindToModelType(provider: AiProviderKind): ModelType {
  switch (provider) {
    case AiProviderKind.OPENAI:
      return ModelType.GPT_4O_MINI
    case AiProviderKind.ANTHROPIC:
      return ModelType.CLAUDE_SONNET_4
    case AiProviderKind.GOOGLE_GEMINI:
      return ModelType.GEMINI_2_5_PRO
    case AiProviderKind.LLAMA_COMPAT:
      return ModelType.LLAMA_COMPAT
    default:
      return ModelType.GPT_4O_MINI
  }
}

function totalCostFromStageLogs(stageLogs: StageAttemptLog[]): number {
  return stageLogs
    .filter((l) => l.wasSuccessful)
    .reduce((sum, l) => sum + calculateCost(providerKindToModelType(l.provider), l.tokensUsed), 0)
}

function modelTypeToProviderKind(model: ModelType): AiProviderKind {
  switch (model) {
    case ModelType.GPT_4O_MINI:
      return AiProviderKind.OPENAI
    case ModelType.CLAUDE_SONNET_4:
      return AiProviderKind.ANTHROPIC
    case ModelType.GEMINI_2_5_PRO:
      return AiProviderKind.GOOGLE_GEMINI
    case ModelType.LLAMA_COMPAT:
      return AiProviderKind.LLAMA_COMPAT
    default:
      return AiProviderKind.OPENAI
  }
}

function apiModelLabel(model: ModelType): string {
  switch (model) {
    case ModelType.GPT_4O_MINI:
      return process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o"
    case ModelType.CLAUDE_SONNET_4:
      return resolveAnthropicModelProfile().modelId
    case ModelType.GEMINI_2_5_PRO:
      return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-pro"
    case ModelType.LLAMA_COMPAT:
      return process.env.LLAMA_MODEL?.trim() || "llama-compat"
    default:
      return String(model)
  }
}

function toPrismaStage(stage: PipelineStage): AnalysisPipelineStageName {
  switch (stage) {
    case "CLASSIFICATION":
      return AnalysisPipelineStageName.CLASSIFICATION
    case "EXTRACTION":
      return AnalysisPipelineStageName.EXTRACTION
    case "RISK_AND_GUIDANCE":
      return AnalysisPipelineStageName.RISK_AND_GUIDANCE
  }
}

function maxTokensForStage(stage: PipelineStage): number {
  switch (stage) {
    case "CLASSIFICATION":
      return 16_384
    case "EXTRACTION":
      return 32_768
    case "RISK_AND_GUIDANCE":
      return 64_000
  }
}

function providerMaxOutputTokens(model: ModelType, stage: PipelineStage): number {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4: {
      const useExtended = stage === "RISK_AND_GUIDANCE"
      return anthropicEffectiveMaxOutputTokens(maxTokensForStage(stage), useExtended)
    }
    case ModelType.GEMINI_2_5_PRO:
      return 32_768
    case ModelType.GPT_4O_MINI:
      return 16_384
    case ModelType.LLAMA_COMPAT:
      return 16_384
  }
}

function preprocessForStage(pipelineStage: PipelineStage, parsed: unknown): unknown {
  if (pipelineStage === "RISK_AND_GUIDANCE") {
    return preprocessRiskStageJson(parsed)
  }
  return parsed
}

function providerErrorCode(err: unknown, stopReason?: string | null): string {
  if (stopReason === "max_tokens") return "MAX_TOKENS_HIT"
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("overloaded")) {
    return "RATE_LIMIT"
  }
  if (lower.includes("invalid x-api-key") || lower.includes("authentication") || lower.includes("401")) {
    return "AUTH"
  }
  if (lower.includes("not_found") || lower.includes("model:")) return "MODEL_NOT_FOUND"
  if (
    lower.includes("prompt is too long") ||
    lower.includes("too many tokens") ||
    lower.includes("context length")
  ) {
    return "INPUT_TOO_LONG"
  }
  if (lower.includes("400") || lower.includes("bad request")) return "PROVIDER_BAD_REQUEST"
  if (lower.includes("timeout")) return "TIMEOUT"
  const compact = msg.replace(/\s+/g, " ").slice(0, 60)
  return compact.length > 0 ? compact : "PROVIDER_ERROR"
}

export function normalizeDocumentTextForAnalysis(raw: string, maxChars: number): string {
  const collapsed = raw.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim()
  if (collapsed.length <= maxChars) return collapsed
  return collapsed.slice(0, maxChars)
}

export function hashTextSha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

export function createRegistryOnlyContractPromptResolver(): ContractPromptResolver {
  return {
    resolveClassification: async () => ({
      key: CONTRACT_CLASSIFICATION_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildClassificationPromptInstructions(CONTRACT_ANALYSIS_PROMPT_VERSION),
      source: "registry_default"
    }),
    resolveExtraction: async (_normalizedDocument, classification) => ({
      key: CONTRACT_EXTRACTION_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildExtractionPromptInstructions(CONTRACT_ANALYSIS_PROMPT_VERSION, classification),
      source: "registry_default"
    }),
    resolveRisk: async (normalizedDocument, extractionSummary, _contractTypeLabel, classification) => ({
      key: CONTRACT_RISK_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildRiskAndGuidancePromptInstructions(
        extractionSummary,
        normalizedDocument.length,
        CONTRACT_ANALYSIS_PROMPT_VERSION,
        classification
      ),
      source: "registry_default"
    })
  }
}

async function runJsonStage<T>(
  pipelineStage: PipelineStage,
  schema: z.ZodType<T>,
  ctx: RouterContext,
  promptInstructions: string,
  documentText: string,
  stageLogs: StageAttemptLog[],
  fallbackKeys: string[]
): Promise<{ data: T; model: ModelType; tokens: number }> {
  const prismaStage = toPrismaStage(pipelineStage)
  const plan = buildModelExecutionPlan(pipelineStage, ctx)
  if (plan.length === 0) {
    let message = contractAnalysisClaudeOnly()
      ? "Claude Sonnet ist für Vertragsanalyse vorgeschrieben (AI_CONTRACT_ANALYSIS_CLAUDE_ONLY). ANTHROPIC_API_KEY prüfen."
      : "Kein konfigurierter KI-Anbieter für diese Stufe."
    if (contractAnalysisClaudeOnly() && ctx.preferEuModels) {
      message =
        "Claude ist vorgeschrieben, aber Mandanten-Governance (Nur-EU-Modelle) blockiert Anthropic. Bitte Governance-Einstellung anpassen."
    } else if (
      contractAnalysisClaudeOnly() &&
      ctx.allowedProviders?.length &&
      !ctx.allowedProviders.includes("anthropic")
    ) {
      message = `Claude ist vorgeschrieben, aber erlaubte Anbieter sind: ${ctx.allowedProviders.join(", ")}.`
    }
    throw new PipelineStageFailureError(prismaStage, message)
  }

  let primaryLogged = false

  for (let i = 0; i < plan.length; i += 1) {
    const model = plan[i]
    const providerKind = modelTypeToProviderKind(model)
    const reason = getSelectionReasonForStage(pipelineStage, model, ctx)
    const started = Date.now()
    let tokensUsed = 0
    let errorCode: string | null = null
    const prevProvider = i > 0 ? modelTypeToProviderKind(plan[i - 1]!) : null

    try {
      const provider = createProvider(model)
      const stageMaxTokens = maxTokensForStage(pipelineStage)
      const effectiveMaxTokens = Math.min(stageMaxTokens, providerMaxOutputTokens(model, pipelineStage))

      const response = await provider.analyze({
        prompt: promptInstructions,
        documentText,
        jsonMode: true,
        maxTokens: effectiveMaxTokens
      })

      tokensUsed = response.tokensUsed
      const stopReason = response.stopReason ?? null

      if (stopReason === "max_tokens") {
        errorCode = "MAX_TOKENS_HIT"
        stageLogs.push({
          stage: prismaStage,
          attemptOrder: i + 1,
          provider: providerKind,
          model: apiModelLabel(model),
          selectionReason: reason,
          wasPrimaryChoice: !primaryLogged,
          wasSuccessful: false,
          fallbackFromProvider: prevProvider,
          latencyMs: Date.now() - started,
          tokensUsed,
          errorCode,
          structuredValid: false
        })
        primaryLogged = true
        fallbackKeys.push(`${providerKind}:${apiModelLabel(model)}`)
        continue
      }

      let parsedJson: unknown
      try {
        parsedJson = parseJsonUnknown(response.outputText)
      } catch {
        errorCode = "JSON_PARSE"
        stageLogs.push({
          stage: prismaStage,
          attemptOrder: i + 1,
          provider: providerKind,
          model: apiModelLabel(model),
          selectionReason: reason,
          wasPrimaryChoice: !primaryLogged,
          wasSuccessful: false,
          fallbackFromProvider: prevProvider,
          latencyMs: Date.now() - started,
          tokensUsed,
          errorCode,
          structuredValid: false
        })
        primaryLogged = true
        fallbackKeys.push(`${providerKind}:${apiModelLabel(model)}`)
        continue
      }

      parsedJson = preprocessForStage(pipelineStage, parsedJson)
      const validated = schema.safeParse(parsedJson)
      if (!validated.success) {
        errorCode = formatZodIssuesForErrorCode(validated.error)
        log.warn("pipeline.schema_invalid", {
          stage: pipelineStage,
          provider: providerKind,
          model: apiModelLabel(model),
          tokensUsed,
          issueCount: validated.error.issues.length
        })
        stageLogs.push({
          stage: prismaStage,
          attemptOrder: i + 1,
          provider: providerKind,
          model: apiModelLabel(model),
          selectionReason: reason,
          wasPrimaryChoice: !primaryLogged,
          wasSuccessful: false,
          fallbackFromProvider: prevProvider,
          latencyMs: Date.now() - started,
          tokensUsed,
          errorCode,
          structuredValid: false
        })
        primaryLogged = true
        fallbackKeys.push(`${providerKind}:${apiModelLabel(model)}`)
        continue
      }

      stageLogs.push({
        stage: prismaStage,
        attemptOrder: i + 1,
        provider: providerKind,
        model: apiModelLabel(model),
        selectionReason: reason,
        wasPrimaryChoice: !primaryLogged,
        wasSuccessful: true,
        fallbackFromProvider: prevProvider,
        latencyMs: Date.now() - started,
        tokensUsed,
        errorCode: null,
        structuredValid: true
      })
      primaryLogged = true

      return { data: validated.data, model, tokens: tokensUsed }
    } catch (err) {
      errorCode = providerErrorCode(err)
      log.warn("pipeline.provider_error", {
        stage: pipelineStage,
        provider: providerKind,
        model: apiModelLabel(model),
        errorCode
      })
      stageLogs.push({
        stage: prismaStage,
        attemptOrder: i + 1,
        provider: providerKind,
        model: apiModelLabel(model),
        selectionReason: reason,
        wasPrimaryChoice: !primaryLogged,
        wasSuccessful: false,
        fallbackFromProvider: prevProvider,
        latencyMs: Date.now() - started,
        tokensUsed,
        errorCode,
        structuredValid: false
      })
      primaryLogged = true
      fallbackKeys.push(`${providerKind}:${apiModelLabel(model)}`)
    }
  }

  throw new PipelineStageFailureError(
    prismaStage,
    formatStageFailureMessage(stageLogs),
    stageLogs,
    fallbackKeys
  )
}

export async function runClassificationStage(
  normalizedText: string,
  ctx: RouterContext,
  resolver: ContractPromptResolver
): Promise<ClassificationStageResult> {
  const stageLogs: StageAttemptLog[] = []
  const fallbackKeys: string[] = []
  let classificationData: ClassificationStagePayload | null = null
  let classificationResolved: StageResolvedPrompt | null = null

  try {
    const resolved = await resolver.resolveClassification(normalizedText)
    classificationResolved = {
      key: resolved.key,
      version: resolved.version,
      source: resolved.source
    }
    const result = await runJsonStage(
      "CLASSIFICATION",
      classificationStageSchema,
      ctx,
      resolved.text,
      normalizedText,
      stageLogs,
      fallbackKeys
    )
    classificationData = result.data
  } catch (classErr) {
    if (contractAnalysisClaudeOnly()) {
      throw classErr
    }
    log.warn("pipeline.classification_skipped", { code: "CLASSIFICATION_FAILED" })
  }

  return { classification: classificationData, classificationResolved, stageLogs, fallbackKeys }
}

export async function runExtractionStage(
  normalizedText: string,
  ctx: RouterContext,
  resolver: ContractPromptResolver,
  classification: ClassificationStagePayload | null
): Promise<ExtractionStageResult> {
  const stageLogs: StageAttemptLog[] = []
  const fallbackKeys: string[] = []

  const resolved = await resolver.resolveExtraction(normalizedText, classification)
  const result = await runJsonStage(
    "EXTRACTION",
    extractionStageSchema,
    ctx,
    resolved.text,
    normalizedText,
    stageLogs,
    fallbackKeys
  )

  return {
    extraction: result.data,
    extractionModel: result.model,
    extractionTokens: result.tokens,
    extractionResolved: {
      key: resolved.key,
      version: resolved.version,
      source: resolved.source
    },
    stageLogs,
    fallbackKeys
  }
}

export async function runRiskStage(
  normalizedText: string,
  ctx: RouterContext,
  resolver: ContractPromptResolver,
  classification: ClassificationStagePayload | null,
  extraction: ExtractionStagePayload
): Promise<RiskStageResult> {
  const stageLogs: StageAttemptLog[] = []
  const fallbackKeys: string[] = []

  const extractionSummary = JSON.stringify({
    contractType: extraction.contractType,
    parties: extraction.parties,
    term: extraction.term,
    legalTopics: extraction.legalTopics?.slice(0, 8)
  })
  const contractTypeLabel = extraction.contractType ?? ""

  const resolved = await resolver.resolveRisk(
    normalizedText,
    extractionSummary,
    contractTypeLabel,
    classification
  )

  if (shouldSplitRiskStage(normalizedText.length)) {
    const findingsPrompt = buildRiskFindingsPromptInstructions(
      extractionSummary,
      normalizedText.length,
      resolved.version,
      classification
    )
    const findingsResult = await runJsonStage(
      "RISK_AND_GUIDANCE",
      riskFindingsStageSchema,
      ctx,
      findingsPrompt,
      normalizedText,
      stageLogs,
      fallbackKeys
    )

    const guidancePrompt = buildRiskGuidancePromptInstructions(
      extractionSummary,
      JSON.stringify(findingsResult.data.findings),
      resolved.version
    )
    const guidanceResult = await runJsonStage(
      "RISK_AND_GUIDANCE",
      riskGuidanceStageSchema,
      ctx,
      guidancePrompt,
      "",
      stageLogs,
      fallbackKeys
    )

    const risk: RiskAndGuidanceStagePayload = {
      findings: findingsResult.data.findings,
      riskScore01: findingsResult.data.riskScore01,
      recommendedMeasures: guidanceResult.data.recommendedMeasures,
      negotiationHints: guidanceResult.data.negotiationHints,
      explanationSummary: guidanceResult.data.explanationSummary,
      aggregateConfidence:
        guidanceResult.data.aggregateConfidence ?? findingsResult.data.aggregateConfidence
    }

    return {
      risk,
      riskModel: findingsResult.model,
      riskTokens: findingsResult.tokens + guidanceResult.tokens,
      riskResolved: {
        key: resolved.key,
        version: resolved.version,
        source: resolved.source
      },
      stageLogs,
      fallbackKeys
    }
  }

  const result = await runJsonStage(
    "RISK_AND_GUIDANCE",
    riskAndGuidanceStageSchema,
    ctx,
    resolved.text,
    normalizedText,
    stageLogs,
    fallbackKeys
  )

  return {
    risk: result.data,
    riskModel: result.model,
    riskTokens: result.tokens,
    riskResolved: {
      key: resolved.key,
      version: resolved.version,
      source: resolved.source
    },
    stageLogs,
    fallbackKeys
  }
}

export function assembleContractPipelineSuccess(args: {
  classification: ClassificationStagePayload | null
  classificationResolved: StageResolvedPrompt | null
  extraction: ExtractionStagePayload
  extractionModel: ModelType
  extractionResolved: StageResolvedPrompt
  risk: RiskAndGuidanceStagePayload
  riskModel: ModelType
  riskResolved: StageResolvedPrompt
  stageLogs: StageAttemptLog[]
  fallbackModelKeys: string[]
  inputTextHash: string
}): ContractPipelineSuccess {
  const {
    classification,
    classificationResolved,
    extraction,
    extractionModel,
    extractionResolved,
    risk,
    riskModel,
    riskResolved,
    stageLogs,
    fallbackModelKeys,
    inputTextHash
  } = args

  const primaryModel = extractionModel
  const totalTokens = stageLogs.reduce((s, l) => s + (l.tokensUsed ?? 0), 0)
  const totalCost = totalCostFromStageLogs(stageLogs)

  const routerParts = [
    classification
      ? `Klassifikation: ${classification.contractClassification}`
      : "Klassifikation: übersprungen",
    `Extraktion: ${apiModelLabel(extractionModel)}`,
    `Risiko & Empfehlungen: ${apiModelLabel(riskModel)}`,
    fallbackModelKeys.length ? `Fallback-Versuche: ${fallbackModelKeys.join("; ")}` : "Keine Fallbacks nötig"
  ]

  const aggregateConfidence =
    risk.aggregateConfidence ?? risk.riskScore01 ?? extraction.extractionConfidence ?? null

  return {
    classification,
    extraction,
    risk,
    stageLogs,
    primaryModel,
    primaryProvider: modelTypeToProviderKind(primaryModel),
    totalTokens,
    totalCost,
    routerSummary: routerParts.join(" · "),
    fallbackModelKeys,
    inputTextHash,
    aggregateConfidence,
    promptMetadata: {
      bundleKey: CONTRACT_PROMPT_BUNDLE_KEY,
      classificationKey: classificationResolved?.key ?? CONTRACT_CLASSIFICATION_PROMPT_KEY,
      classificationVersion: classificationResolved?.version ?? CONTRACT_ANALYSIS_PROMPT_VERSION,
      classificationSource: classificationResolved?.source ?? "registry_default",
      extractionKey: extractionResolved.key,
      extractionVersion: extractionResolved.version,
      extractionSource: extractionResolved.source ?? "registry_default",
      riskKey: riskResolved.key,
      riskVersion: riskResolved.version,
      riskSource: riskResolved.source ?? "registry_default"
    }
  }
}

export async function runContractAnalysisPipeline(
  documentText: string,
  ctx: RouterContext,
  resolver: ContractPromptResolver
): Promise<ContractPipelineSuccess> {
  const maxChars = Number.parseInt(process.env.AI_MAX_INPUT_CHARS ?? "120000", 10) || 120_000
  const normalized = normalizeDocumentTextForAnalysis(documentText, maxChars)
  const inputTextHash = hashTextSha256(normalized)

  const cls = await runClassificationStage(normalized, ctx, resolver)
  const ext = await runExtractionStage(normalized, ctx, resolver, cls.classification)
  const risk = await runRiskStage(normalized, ctx, resolver, cls.classification, ext.extraction)

  return assembleContractPipelineSuccess({
    classification: cls.classification,
    classificationResolved: cls.classificationResolved,
    extraction: ext.extraction,
    extractionModel: ext.extractionModel,
    extractionResolved: ext.extractionResolved,
    risk: risk.risk,
    riskModel: risk.riskModel,
    riskResolved: risk.riskResolved,
    stageLogs: [...cls.stageLogs, ...ext.stageLogs, ...risk.stageLogs],
    fallbackModelKeys: [...cls.fallbackKeys, ...ext.fallbackKeys, ...risk.fallbackKeys],
    inputTextHash
  })
}
