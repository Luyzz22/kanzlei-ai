import { z } from "zod"

/** Version der Prompts / Erwartungsstruktur — bei Schema-Änderungen erhöhen. */
export const CONTRACT_ANALYSIS_PROMPT_VERSION = "2025-03-27"

const severityLiteral = z.enum(["niedrig", "mittel", "hoch"])

export const contractPartySchema = z.object({
  name: z.string().min(1).max(400),
  role: z.string().max(200).optional(),
  notes: z.string().max(2000).optional()
})

export const contractTermSchema = z.object({
  startHint: z.string().max(500).nullable().optional(),
  endHint: z.string().max(500).nullable().optional(),
  noticePeriodHint: z.string().max(500).nullable().optional(),
  renewalHint: z.string().max(1000).nullable().optional(),
  terminationSummary: z.string().max(2000).optional()
})

export const legalTopicClusterSchema = z.object({
  topic: z.enum([
    "haftung",
    "gewaehrleistung",
    "vertraulichkeit",
    "datenschutz",
    "gerichtsstand",
    "verguetung",
    "sonstiges"
  ]),
  summary: z.string().max(2000),
  riskHint: severityLiteral
})

export const extractionStageSchema = z.object({
  contractType: z.string().min(1).max(120),
  parties: z.array(contractPartySchema).max(20),
  term: contractTermSchema,
  legalTopics: z.array(legalTopicClusterSchema).max(24),
  extractionConfidence: z.number().min(0).max(1).optional(),
  modelNotes: z.string().max(2000).optional()
})

export const pipelineFindingSchema = z.object({
  category: z.string().min(1).max(64),
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(8000),
  severity: severityLiteral,
  confidence: z.number().min(0).max(1).optional(),
  clauseRef: z.string().max(200).optional()
})

export const riskAndGuidanceStageSchema = z.object({
  findings: z.array(pipelineFindingSchema).max(40),
  riskScore01: z.number().min(0).max(1),
  recommendedMeasures: z.array(z.string().min(1).max(1200)).max(30),
  negotiationHints: z.array(z.string().min(1).max(1200)).max(20),
  explanationSummary: z.string().min(1).max(4000),
  aggregateConfidence: z.number().min(0).max(1).optional()
})

export type ExtractionStagePayload = z.infer<typeof extractionStageSchema>
export type RiskAndGuidanceStagePayload = z.infer<typeof riskAndGuidanceStageSchema>

export const fullContractAnalysisSchema = z.object({
  extraction: extractionStageSchema,
  risk: riskAndGuidanceStageSchema
})

export type FullContractAnalysisPayload = z.infer<typeof fullContractAnalysisSchema>

export function stripCodeFences(raw: string): string {
  const t = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t)
  if (fence?.[1]) return fence[1].trim()
  return t
}

export function parseJsonUnknown(raw: string): unknown {
  const cleaned = stripCodeFences(raw)
  return JSON.parse(cleaned) as unknown
}
