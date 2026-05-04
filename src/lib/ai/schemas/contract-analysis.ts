import { z } from "zod"

/** Version der Prompts / Erwartungsstruktur — bei Schema-Änderungen erhöhen. */
export const CONTRACT_ANALYSIS_PROMPT_VERSION = "2026-04-24"

/**
 * UNIFIED ANALYSIS SCHEMA v2 (2026-04-24)
 *
 * Ziel: Single source of truth für beide Analyse-Pipelines (Schnellanalyse
 * und Dokument-Workflow). Alle Felder nullable/optional, damit alte
 * Pipeline-Versionen weiterhin valide sind (Backward Compat).
 *
 * Neu in v2:
 * - findings[].quote              — Klauselzitat aus dem Vertrag
 * - findings[].suggestedRevision  — Konkreter Formulierungsvorschlag
 * - extraction.structuredData     — Kunde/Anbieter/AVV/Haftung/IP/etc.
 * - extraction.deadlines          — Kündigungsfristen, Laufzeiten, etc.
 */

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

export const contractStructuredDataSchema = z.object({
  customer: z.string().max(400).nullable().optional(),
  vendor: z.string().max(400).nullable().optional(),
  product: z.string().max(400).nullable().optional(),
  jurisdiction: z.string().max(200).nullable().optional(),
  applicableLaw: z.string().max(200).nullable().optional(),
  liabilityLimit: z.string().max(500).nullable().optional(),
  confidentialityObligation: z.boolean().nullable().optional(),
  penaltyClause: z.string().max(500).nullable().optional(),
  intellectualProperty: z.string().max(1000).nullable().optional(),
  dataProcessingAgreement: z.boolean().nullable().optional(),
  dataLocation: z.string().max(300).nullable().optional(),
  dataExportClause: z.boolean().nullable().optional()
}).partial()

export const contractDeadlinesSchema = z.object({
  noticePeriodDays: z.nullable(z.coerce.number().int().min(0).max(3650)).optional(),
  autoRenewal: z.boolean().nullable().optional(),
  renewalTermMonths: z.nullable(z.coerce.number().int().min(0).max(600)).optional(),
  contractStartDate: z.string().max(200).nullable().optional(),
  contractEndDate: z.string().max(200).nullable().optional(),
  nextCancellationDate: z.string().max(200).nullable().optional(),
  warrantyPeriodMonths: z.nullable(z.coerce.number().int().min(0).max(600)).optional()
}).partial()

export type ContractStructuredData = z.infer<typeof contractStructuredDataSchema>
export type ContractDeadlines = z.infer<typeof contractDeadlinesSchema>

export const extractionStageSchema = z.object({
  contractType: z.string().min(1).max(120),
  parties: z.array(contractPartySchema).max(20),
  term: contractTermSchema,
  legalTopics: z.array(legalTopicClusterSchema).max(24),
  /** v2: strukturierte Geschäftsdaten (Kunde, Anbieter, AVV, Haftung, etc.) */
  structuredData: contractStructuredDataSchema.nullable().optional(),
  /** v2: explizite Fristenstruktur (Kündigung, Laufzeit, Verlängerung) */
  deadlines: contractDeadlinesSchema.nullable().optional(),
  extractionConfidence: z.coerce.number().min(0).max(1).optional(),
  modelNotes: z.string().max(2000).optional()
})

export const pipelineFindingSchema = z.object({
  category: z.string().min(1).max(64),
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(8000),
  severity: severityLiteral,
  confidence: z.coerce.number().min(0).max(1).optional(),
  clauseRef: z.string().max(200).optional(),
  /** v2: exaktes Zitat der Originalklausel (max 2000 Zeichen) */
  quote: z.string().max(2000).nullable().optional(),
  /** v2: konkreter Formulierungsvorschlag (neue Klauselfassung) */
  suggestedRevision: z.string().max(4000).nullable().optional()
})

export const riskAndGuidanceStageSchema = z.object({
  findings: z.array(pipelineFindingSchema).max(40),
  riskScore01: z.coerce.number().min(0).max(1),
  recommendedMeasures: z.array(z.string().min(1).max(1200)).max(30),
  negotiationHints: z.array(z.string().min(1).max(1200)).max(20),
  explanationSummary: z.string().min(1).max(4000),
  aggregateConfidence: z.coerce.number().min(0).max(1).optional()
})

export type ExtractionStagePayload = z.infer<typeof extractionStageSchema>
export type RiskAndGuidanceStagePayload = z.infer<typeof riskAndGuidanceStageSchema>

export const fullContractAnalysisSchema = z.object({
  extraction: extractionStageSchema,
  risk: riskAndGuidanceStageSchema
})

export type FullContractAnalysisPayload = z.infer<typeof fullContractAnalysisSchema>

/**
 * Entfernt Markdown-Code-Fences (```json ... ```) aus LLM-Antworten.
 *
 * Behandelt alle bekannten Varianten:
 * - ```json ... ```
 * - ``` ... ```  (ohne Sprachkennung)
 * - Preamble-Text vor dem Fence (z.B. "Here is the JSON:\n```json ...")
 * - Trailing-Text nach dem Fence
 * - 3–4 Backticks
 */
export function stripCodeFences(raw: string): string {
  const t = raw.trim()

  // Greedy-Match: suche das ERSTE öffnende Fence und das LETZTE schließende Fence.
  // Damit wird auch Text vor/nach den Fences entfernt.
  const fence = /`{3,4}(?:json|JSON)?\s*\n([\s\S]+?)\n\s*`{3,4}/.exec(t)
  if (fence?.[1]) return fence[1].trim()

  // Fallback: wenn kein Fence gefunden, aber der String mit { oder [ startet,
  // versuche den JSON-Block zu isolieren (z.B. bei Preamble ohne Fences).
  const jsonStart = t.indexOf("{")
  const jsonEnd = t.lastIndexOf("}")
  if (jsonStart >= 0 && jsonEnd > jsonStart && jsonStart <= 200) {
    // Maximal 200 Zeichen Preamble tolerieren
    return t.slice(jsonStart, jsonEnd + 1)
  }

  return t
}

export function parseJsonUnknown(raw: string): unknown {
  const cleaned = stripCodeFences(raw)
  return JSON.parse(cleaned) as unknown
}
