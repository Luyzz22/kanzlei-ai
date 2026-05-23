import { createHash } from "node:crypto"

import { z } from "zod"

import {
  buildModelExecutionPlan,
  getSelectionReasonForStage,
  type PipelineStage,
  type RouterContext
} from "@/lib/ai/analysis-router"
import {
  buildClassificationPromptBody,
  buildExtractionPromptBody,
  buildRiskAndGuidancePromptBody,
  CONTRACT_CLASSIFICATION_PROMPT_KEY,
  CONTRACT_EXTRACTION_PROMPT_KEY,
  CONTRACT_PROMPT_BUNDLE_KEY,
  CONTRACT_RISK_PROMPT_KEY,
  CONTRACT_ANALYSIS_PROMPT_VERSION
} from "@/lib/ai/prompt-registry/contract-defaults"
import { calculateCost } from "@/lib/ai/cost-tracker"
import { createProvider } from "@/lib/ai/providers"
import {
  type ClassificationStagePayload,
  type ExtractionStagePayload,
  type RiskAndGuidanceStagePayload,
  classificationStageSchema,
  extractionStageSchema,
  parseJsonUnknown,
  riskAndGuidanceStageSchema
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

// ============================================================================
// v5.0 Stage-Chunked Pipeline — Stage-Output Types
// ============================================================================

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
      // Default angeglichen an chatModelId() im OpenAI-Provider — beide nutzen gpt-4o.
      // Der ENUM-Name (GPT_4O_MINI) ist historisch, der echte API-Call läuft mit gpt-4o.
      return process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o"
    case ModelType.CLAUDE_SONNET_4:
      return process.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-sonnet-4-6"
    case ModelType.GEMINI_2_5_PRO:
      // Default auf 2.5-pro angeglichen an geminiModelId() im Gemini-Provider.
      // gemini-1.5-pro ist deprecated und gibt PROVIDER_ERROR.
      return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-2.5-pro"
    case ModelType.LLAMA_COMPAT:
      return process.env.LLAMA_MODEL?.trim() || "llama-compat"
    default:
      return String(model)
  }
}

/**
 * Mapping PipelineStage → Prisma-Enum.
 * CLASSIFICATION ist neu und muss im Prisma-Schema existieren.
 */
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

/**
 * Max-Token-Budget pro Stage.
 *
 * Wir setzen jede Stage so hoch, dass komplexe Verträge nicht trunciert werden,
 * aber unter dem Limit der konservativsten Anbieter bleibt. Die echte Obergrenze
 * pro Anbieter wird dann durch providerMaxOutputTokens() gekappt.
 *
 * Hintergrund:
 * - 64000 wurde von Anthropic Claude Sonnet 4.5 bei manchen Model-Aliasen
 *   (insb. ohne Datum-Suffix) mit 400-Error abgelehnt — Standard-Tier braucht
 *   teils anthropic-beta: output-128k-2025-02-19 Header für > 32k.
 * - 32768 wird von allen aktuellen Modellen ohne Beta-Header akzeptiert.
 * - max_tokens ist nur ein Cap (Anthropic zählt nur tatsächlich generierte
 *   Tokens für OTPM-Rate-Limits), daher hoch ohne Kosten-Nachteil.
 */
function maxTokensForStage(stage: PipelineStage): number {
  switch (stage) {
    case "CLASSIFICATION":
      return 16384
    case "EXTRACTION":
      return 32768
    case "RISK_AND_GUIDANCE":
      // 32768 ist getestet OK bei Anthropic. Höher (z.B. 64000) löst bei
      // einigen Model-Aliasen sofortigen 400 Bad Request aus.
      return 32768
  }
}

/**
 * Pro-Provider maximale Output-Tokens, die der jeweilige API-Endpoint akzeptiert
 * ohne Beta-Header oder Service-Tier-Upgrade.
 *
 * - Claude Sonnet 4.5 (default tier): 32768 sicher; 64000 braucht u.U. Beta-Header.
 * - Gemini 2.5 Pro: 32768 ist konservativ ausreichend (native bis 65536).
 * - OpenAI gpt-4o: 16384 (Provider-Hard-Limit).
 * - LLAMA_COMPAT: 16384.
 */
function providerMaxOutputTokens(model: ModelType): number {
  switch (model) {
    case ModelType.CLAUDE_SONNET_4:
      return 32768
    case ModelType.GEMINI_2_5_PRO:
      return 32768
    case ModelType.GPT_4O_MINI:
      return 16384
    case ModelType.LLAMA_COMPAT:
      return 16384
  }
}

export function normalizeDocumentTextForAnalysis(raw: string, maxChars: number): string {
  const collapsed = raw.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim()
  if (collapsed.length <= maxChars) return collapsed
  return collapsed.slice(0, maxChars)
}

export function hashTextSha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

/** Registry-only resolver (keine DB) — für Tests und Offline-Evals. */
export function createRegistryOnlyContractPromptResolver(): ContractPromptResolver {
  return {
    resolveClassification: async (normalizedDocument: string) => ({
      key: CONTRACT_CLASSIFICATION_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildClassificationPromptBody(normalizedDocument, CONTRACT_ANALYSIS_PROMPT_VERSION),
      source: "registry_default"
    }),
    resolveExtraction: async (normalizedDocument: string, classification?: ClassificationStagePayload | null) => ({
      key: CONTRACT_EXTRACTION_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildExtractionPromptBody(normalizedDocument, CONTRACT_ANALYSIS_PROMPT_VERSION, classification),
      source: "registry_default"
    }),
    resolveRisk: async (
      normalizedDocument: string,
      extractionSummary: string,
      _contractTypeLabel: string,
      classification?: ClassificationStagePayload | null
    ) => ({
      key: CONTRACT_RISK_PROMPT_KEY,
      version: CONTRACT_ANALYSIS_PROMPT_VERSION,
      text: buildRiskAndGuidancePromptBody(
        normalizedDocument,
        extractionSummary,
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
  prompt: string,
  documentText: string,
  stageLogs: StageAttemptLog[],
  fallbackKeys: string[]
): Promise<{ data: T; model: ModelType; tokens: number }> {
  const prismaStage = toPrismaStage(pipelineStage)
  const plan = buildModelExecutionPlan(pipelineStage, ctx)
  if (plan.length === 0) {
    throw new PipelineStageFailureError(prismaStage, "Kein konfigurierter KI-Anbieter für diese Stufe.")
  }

  let primaryLogged = false

  for (let i = 0; i < plan.length; i += 1) {
    const model = plan[i]
    const providerKind = modelTypeToProviderKind(model)
    const reason = getSelectionReasonForStage(pipelineStage, model, ctx)
    const started = Date.now()
    let tokensUsed = 0
    let structuredValid = false
    let errorCode: string | null = null
    const prevProvider = i > 0 ? modelTypeToProviderKind(plan[i - 1]!) : null

    try {
      const provider = createProvider(model)
      const stageMaxTokens = maxTokensForStage(pipelineStage)
      // Stage-Default auf Provider-Obergrenze kappen (OpenAI cappt bei 16384,
      // Claude/Gemini erlauben mehr). Vermeidet "max_tokens out of range"-Errors.
      const effectiveMaxTokens = Math.min(stageMaxTokens, providerMaxOutputTokens(model))
      const response = await provider.analyze({ prompt, documentText, jsonMode: true, maxTokens: effectiveMaxTokens })
      tokensUsed = response.tokensUsed
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

      const validated = schema.safeParse(parsedJson)
      if (!validated.success) {
        errorCode = "SCHEMA_INVALID"
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

      structuredValid = true
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
        structuredValid
      })
      primaryLogged = true

      return { data: validated.data, model, tokens: tokensUsed }
    } catch {
      errorCode = "PROVIDER_ERROR"
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
    "Alle Anbieterversuche für diese Pipeline-Stufe sind fehlgeschlagen.",
    stageLogs,
    fallbackKeys
  )
}

// ============================================================================
// v5.0 Stage-Chunked Pipeline — einzelne Stage-Funktionen + Aggregator
// ============================================================================
// Diese ermöglichen es dem Async-Worker (/api/workspace/analysis/run), jede
// Stage als eigenen Lambda-Aufruf auszuführen, mit DB-State-Persistierung
// zwischen den Stages. Damit umgehen wir den 300s-Hardlimit für Lambdas bei
// langen Vertragsanalysen.
//
// Für Schnellanalyse / synchrone Aufrufe bleibt `runContractAnalysisPipeline`
// als Kompatibilitäts-Shim erhalten (siehe unten).
// ============================================================================

/**
 * Stage 0: Classification.
 * Non-blocking: bei Fehler wird mit classification=null returnt (Pipeline läuft weiter).
 */
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
  } catch (err) {
    console.warn(
      "[Pipeline.v5] Classification (Stage 0) fehlgeschlagen — fahre ohne Klassifikationskontext fort:",
      err instanceof Error ? err.message : err
    )
  }

  return { classification: classificationData, classificationResolved, stageLogs, fallbackKeys }
}

/**
 * Stage 1: Extraction.
 * Blocking: bei Fehler wird PipelineStageFailureError geworfen.
 */
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

/**
 * Stage 2: Risk & Guidance.
 * Blocking. Braucht Extraction-Output als Kontext.
 */
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
    term: extraction.term
  })
  const contractTypeLabel = extraction.contractType ?? ""

  const resolved = await resolver.resolveRisk(
    normalizedText,
    extractionSummary,
    contractTypeLabel,
    classification
  )
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

/**
 * Aggregator: bündelt die drei Stage-Outputs zu einem ContractPipelineSuccess.
 * Reine Funktion, keine I/O. Vom Worker am Ende der Risk-Stage aufgerufen.
 */
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

  const extractionLog = stageLogs.find(
    (l) => l.stage === AnalysisPipelineStageName.EXTRACTION && l.wasSuccessful
  )
  const riskLog = stageLogs.find(
    (l) => l.stage === AnalysisPipelineStageName.RISK_AND_GUIDANCE && l.wasSuccessful
  )
  const classLog = stageLogs.find(
    (l) => l.stage === AnalysisPipelineStageName.CLASSIFICATION && l.wasSuccessful
  )

  const primaryModel = extractionModel
  const totalTokens = stageLogs.reduce((s, l) => s + (l.tokensUsed ?? 0), 0)

  let totalCost = 0
  if (classLog)
    totalCost += calculateCost(classification ? extractionModel : ModelType.GPT_4O_MINI, classLog.tokensUsed)
  if (extractionLog) totalCost += calculateCost(extractionModel, extractionLog.tokensUsed)
  if (riskLog) totalCost += calculateCost(riskModel, riskLog.tokensUsed)

  const routerParts = [
    classification
      ? `Klassifikation: ${classification.contractClassification} (${apiModelLabel(extractionModel)})`
      : "Klassifikation: übersprungen",
    `Extraktion: ${apiModelLabel(extractionModel)}`,
    `Risiko & Empfehlungen: ${apiModelLabel(riskModel)}`,
    fallbackModelKeys.length ? `Fallback-Versuche: ${fallbackModelKeys.join("; ")}` : "Keine Fallbacks nötig"
  ]
  const routerSummary = routerParts.join(" · ")

  const aggregateConfidence =
    risk.aggregateConfidence ?? risk.riskScore01 ?? extraction.extractionConfidence ?? null

  const extractionSource = extractionResolved.source ?? "registry_default"
  const riskSource = riskResolved.source ?? "registry_default"
  const classificationSource = classificationResolved?.source ?? "registry_default"

  return {
    classification,
    extraction,
    risk,
    stageLogs,
    primaryModel,
    primaryProvider: modelTypeToProviderKind(primaryModel),
    totalTokens,
    totalCost,
    routerSummary,
    fallbackModelKeys,
    inputTextHash,
    aggregateConfidence,
    promptMetadata: {
      bundleKey: CONTRACT_PROMPT_BUNDLE_KEY,
      classificationKey: classificationResolved?.key ?? CONTRACT_CLASSIFICATION_PROMPT_KEY,
      classificationVersion: classificationResolved?.version ?? CONTRACT_ANALYSIS_PROMPT_VERSION,
      classificationSource,
      extractionKey: extractionResolved.key,
      extractionVersion: extractionResolved.version,
      extractionSource,
      riskKey: riskResolved.key,
      riskVersion: riskResolved.version,
      riskSource
    }
  }
}

/**
 * Kompatibilitäts-Shim: ruft die 3 Stages sequenziell.
 * Bestehende synchrone Aufrufer (Schnellanalyse, Tests, Eval-Tools) bleiben unverändert.
 * Async-Worker für Tiefenanalyse nutzt die einzelnen Stage-Funktionen direkt.
 */
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
