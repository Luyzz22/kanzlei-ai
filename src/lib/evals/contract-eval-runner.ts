import type { ContractPipelineSuccess } from "@/lib/ai/analysis-pipeline"
import {
  CONTRACT_ANALYSIS_PROMPT_VERSION,
  CONTRACT_EXTRACTION_PROMPT_KEY,
  CONTRACT_PROMPT_BUNDLE_KEY,
  CONTRACT_RISK_PROMPT_KEY
} from "@/lib/ai/prompt-registry/contract-defaults"
import { extractionStageSchema, riskAndGuidanceStageSchema } from "@/lib/ai/schemas/contract-analysis"
import { ModelType } from "@/types/ai"
import { AiProviderKind } from "@prisma/client"

/** Golden-Dataset-Fall (Datei unter evals/contracts). Keine Mandantendaten. */
export type ContractEvalCaseFile = {
  id: string
  contractTypeHint?: string
  documentText: string
  reviewerNotes?: string
  expected?: {
    contractTypeIncludes?: string
    minParties?: number
    minLegalTopics?: number
    minFindings?: number
    findingTitleIncludes?: string[]
    riskScoreMin?: number
    riskScoreMax?: number
  }
}

export type ContractEvalMetrics = {
  schemaValidExtraction: boolean
  schemaValidRisk: boolean
  extractionCompleteness01: number
  fieldAccuracy01: number
  findingPrecision01: number
  findingRecall01: number
  refusalOrError: boolean
  latencyMs: number
  costEstimate: number
  passed: boolean
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(1, n))
}

export function scoreContractEvalCase(
  evalCase: ContractEvalCaseFile,
  result: ContractPipelineSuccess,
  latencyMs: number
): ContractEvalMetrics {
  const ext = extractionStageSchema.safeParse(result.extraction)
  const risk = riskAndGuidanceStageSchema.safeParse(result.risk)
  const schemaValidExtraction = ext.success
  const schemaValidRisk = risk.success

  const exp = evalCase.expected ?? {}
  let extractionCompleteness01 = 1
  if (schemaValidExtraction && ext.success) {
    const parties = ext.data.parties?.length ?? 0
    const topics = ext.data.legalTopics?.length ?? 0
    const minP = exp.minParties ?? 0
    const minT = exp.minLegalTopics ?? 0
    extractionCompleteness01 =
      minP > 0 || minT > 0
        ? clamp01((parties >= minP ? 0.5 : 0) + (topics >= minT ? 0.5 : 0))
        : parties > 0 && topics >= 0
          ? 1
          : 0.5
    if (exp.contractTypeIncludes) {
      const ct = ext.data.contractType.toLowerCase()
      extractionCompleteness01 *= ct.includes(exp.contractTypeIncludes.toLowerCase()) ? 1 : 0.3
    }
  } else {
    extractionCompleteness01 = 0
  }

  let fieldAccuracy01 = schemaValidExtraction && schemaValidRisk ? 1 : 0
  if (schemaValidExtraction && ext.success && exp.contractTypeIncludes) {
    const ct = ext.data.contractType.toLowerCase()
    fieldAccuracy01 *= ct.includes(exp.contractTypeIncludes.toLowerCase()) ? 1 : 0.4
  }
  if (schemaValidRisk && risk.success && exp.riskScoreMin != null) {
    const rs = risk.data.riskScore01
    if (rs < exp.riskScoreMin) fieldAccuracy01 *= 0.5
  }
  if (schemaValidRisk && risk.success && exp.riskScoreMax != null) {
    const rs = risk.data.riskScore01
    if (rs > exp.riskScoreMax) fieldAccuracy01 *= 0.5
  }
  fieldAccuracy01 = clamp01(fieldAccuracy01)

  const findings = schemaValidRisk && risk.success ? risk.data.findings : []
  const titles = findings.map((f) => f.title.toLowerCase())
  const needles = (exp.findingTitleIncludes ?? []).map((s) => s.toLowerCase())
  let hits = 0
  for (const n of needles) {
    if (titles.some((t) => t.includes(n))) hits += 1
  }
  const findingPrecision01 =
    needles.length === 0 ? 1 : clamp01(hits / needles.length)
  const minF = exp.minFindings ?? 0
  const findingRecall01 =
    minF === 0 ? 1 : clamp01(findings.length / minF)

  const refusalOrError = !schemaValidExtraction || !schemaValidRisk

  const thresholds = {
    schema: true,
    extraction: 0.4,
    fields: 0.4,
    fp: needles.length === 0 ? 0 : 0.5,
    fr: minF === 0 ? 0 : 0.3
  }

  const passed =
    schemaValidExtraction &&
    schemaValidRisk &&
    extractionCompleteness01 >= thresholds.extraction &&
    fieldAccuracy01 >= thresholds.fields &&
    findingPrecision01 >= thresholds.fp &&
    findingRecall01 >= thresholds.fr

  return {
    schemaValidExtraction,
    schemaValidRisk,
    extractionCompleteness01,
    fieldAccuracy01,
    findingPrecision01,
    findingRecall01,
    refusalOrError,
    latencyMs,
    costEstimate: result.totalCost,
    passed
  }
}

/** Deterministische Pipeline-Antwort für CI / lokale Runs ohne API (EVAL_MOCK=true). */
export function buildSyntheticEvalPipelineSuccess(_documentText: string): ContractPipelineSuccess {
  return {
    extraction: {
      contractType: "Mietvertrag Wohnraum",
      parties: [{ name: "Vermieter Müller" }, { name: "Mieter Schmidt" }],
      term: { noticePeriodHint: "drei Monate zum Quartalsende" },
      legalTopics: [
        { topic: "sonstiges" as const, summary: "Kündigungsfrist vereinbart", riskHint: "mittel" as const }
      ],
      extractionConfidence: 0.9
    },
    risk: {
      findings: [
        {
          category: "kuendigung",
          title: "Kündigungsfrist prüfen",
          description: "Es ist eine dreimonatige Kündigungsfrist genannt — Fristbeginn und Form klären.",
          severity: "mittel",
          confidence: 0.75,
          clauseRef: "Kündigungsfrist drei Monate"
        }
      ],
      riskScore01: 0.45,
      recommendedMeasures: ["Fristenklausel mit Mandant abstimmen"],
      negotiationHints: ["Kündigungsfrist ggf. verkürzen verhandeln"],
      explanationSummary: "Eval-Synthetic: typischer Mietkontext.",
      aggregateConfidence: 0.8
    },
    stageLogs: [],
    primaryModel: ModelType.GPT_4O_MINI,
    primaryProvider: AiProviderKind.OPENAI,
    totalTokens: 0,
    totalCost: 0,
    routerSummary: "eval-synthetic",
    fallbackModelKeys: [],
    inputTextHash: "0".repeat(64),
    aggregateConfidence: 0.8,
    promptMetadata: {
      bundleKey: CONTRACT_PROMPT_BUNDLE_KEY,
      extractionKey: CONTRACT_EXTRACTION_PROMPT_KEY,
      extractionVersion: CONTRACT_ANALYSIS_PROMPT_VERSION,
      extractionSource: "registry_default",
      riskKey: CONTRACT_RISK_PROMPT_KEY,
      riskVersion: CONTRACT_ANALYSIS_PROMPT_VERSION,
      riskSource: "registry_default"
    }
  }
}
