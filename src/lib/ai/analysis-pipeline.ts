import { createHash } from "node:crypto"

import { z } from "zod"

import {
  buildModelExecutionPlan,
  getSelectionReasonForStage,
  type PipelineStage,
  type RouterContext
} from "@/lib/ai/analysis-router"
import { extractionStagePrompt, riskAndGuidanceStagePrompt } from "@/lib/ai/analysis-prompts-pipeline"
import { calculateCost } from "@/lib/ai/cost-tracker"
import { createProvider } from "@/lib/ai/providers"
import {
  type ExtractionStagePayload,
  type RiskAndGuidanceStagePayload,
  extractionStageSchema,
  parseJsonUnknown,
  riskAndGuidanceStageSchema
} from "@/lib/ai/schemas/contract-analysis"
import { ModelType } from "@/types/ai"
import { AiProviderKind, AnalysisPipelineStageName } from "@prisma/client"

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
}

export class PipelineStageFailureError extends Error {
  readonly code = "PIPELINE_STAGE_FAILED"
  constructor(
    readonly stage: AnalysisPipelineStageName,
    message: string
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
      return process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini"
    case ModelType.CLAUDE_SONNET_4:
      return process.env.ANTHROPIC_CHAT_MODEL?.trim() || "claude-3-5-sonnet-latest"
    case ModelType.GEMINI_2_5_PRO:
      return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-1.5-pro"
    case ModelType.LLAMA_COMPAT:
      return process.env.LLAMA_MODEL?.trim() || "llama-compat"
    default:
      return String(model)
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

async function runJsonStage<T>(
  prismaStage: AnalysisPipelineStageName,
  pipelineStage: PipelineStage,
  schema: z.ZodType<T>,
  ctx: RouterContext,
  prompt: string,
  documentText: string,
  stageLogs: StageAttemptLog[],
  fallbackKeys: string[]
): Promise<{ data: T; model: ModelType; tokens: number }> {
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
      const response = await provider.analyze({ prompt, documentText, jsonMode: true })
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

  throw new PipelineStageFailureError(prismaStage, "Alle Anbieterversuche für diese Pipeline-Stufe sind fehlgeschlagen.")
}

export async function runContractAnalysisPipeline(documentText: string, ctx: RouterContext): Promise<ContractPipelineSuccess> {
  const maxChars = Number.parseInt(process.env.AI_MAX_INPUT_CHARS ?? "120000", 10) || 120_000
  const normalized = normalizeDocumentTextForAnalysis(documentText, maxChars)
  const inputTextHash = hashTextSha256(normalized)

  const stageLogs: StageAttemptLog[] = []
  const fallbackModelKeys: string[] = []

  const extraction = await runJsonStage(
    AnalysisPipelineStageName.EXTRACTION,
    "EXTRACTION",
    extractionStageSchema,
    ctx,
    extractionStagePrompt(normalized),
    normalized,
    stageLogs,
    fallbackModelKeys
  )

  const extractionSummary = JSON.stringify({
    contractType: extraction.data.contractType,
    parties: extraction.data.parties,
    term: extraction.data.term
  })

  const risk = await runJsonStage(
    AnalysisPipelineStageName.RISK_AND_GUIDANCE,
    "RISK_AND_GUIDANCE",
    riskAndGuidanceStageSchema,
    ctx,
    riskAndGuidanceStagePrompt(normalized, extractionSummary),
    normalized,
    stageLogs,
    fallbackModelKeys
  )

  const extractionLog = stageLogs.find((l) => l.stage === AnalysisPipelineStageName.EXTRACTION && l.wasSuccessful)
  const riskLog = stageLogs.find((l) => l.stage === AnalysisPipelineStageName.RISK_AND_GUIDANCE && l.wasSuccessful)

  const primaryModel = extraction.model

  const totalTokens = stageLogs.reduce((s, l) => s + (l.tokensUsed ?? 0), 0)
  let totalCost = 0
  if (extractionLog) totalCost += calculateCost(extraction.model, extractionLog.tokensUsed)
  if (riskLog) totalCost += calculateCost(risk.model, riskLog.tokensUsed)

  const routerSummary = [
    `Extraktion: ${apiModelLabel(extraction.model)}`,
    `Risiko & Empfehlungen: ${apiModelLabel(risk.model)}`,
    fallbackModelKeys.length ? `Fallback-Versuche: ${fallbackModelKeys.join("; ")}` : "Keine Fallbacks nötig"
  ].join(" · ")

  const aggregateConfidence =
    risk.data.aggregateConfidence ?? risk.data.riskScore01 ?? extraction.data.extractionConfidence ?? null

  return {
    extraction: extraction.data,
    risk: risk.data,
    stageLogs,
    primaryModel,
    primaryProvider: modelTypeToProviderKind(primaryModel),
    totalTokens,
    totalCost,
    routerSummary,
    fallbackModelKeys,
    inputTextHash,
    aggregateConfidence
  }
}
