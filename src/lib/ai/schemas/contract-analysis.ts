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

const SEVERITY_ALIASES: Record<string, "niedrig" | "mittel" | "hoch"> = {
  niedrig: "niedrig",
  low: "niedrig",
  gering: "niedrig",
  mittel: "mittel",
  medium: "mittel",
  moderat: "mittel",
  hoch: "hoch",
  high: "hoch",
  kritisch: "hoch",
  critical: "hoch"
}

/** Normalisiert LLM-Severity (EN/DE) vor Zod-Validation. */
export function normalizeSeverityValue(value: unknown): unknown {
  if (typeof value !== "string") return value
  return SEVERITY_ALIASES[value.trim().toLowerCase()] ?? value
}

/** Normalisiert riskScore: 75 → 0.75, "0,8" → 0.8 */
export function normalizeRiskScore01(value: unknown): unknown {
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(",", "."))
    if (Number.isFinite(n)) {
      return n > 1 ? n / 100 : n
    }
    return value
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 1) {
    return value / 100
  }
  return value
}

/** Normalisiert confidence: null weg, "85%" → 0.85, 75 → 0.75 */
export function normalizeConfidence01(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1 ? value / 100 : value
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const n = Number.parseFloat(trimmed.replace(",", ".").replace(/%$/, ""))
    if (Number.isFinite(n)) return n > 1 ? n / 100 : n
    return undefined
  }
  return undefined
}

/** Rekursive Vorverarbeitung für Risk-JSON vor Schema-Validation. */
export function preprocessRiskStageJson(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw
  const obj = { ...(raw as Record<string, unknown>) }

  if ("riskScore01" in obj) {
    obj.riskScore01 = normalizeRiskScore01(obj.riskScore01)
  }
  if ("aggregateConfidence" in obj) {
    const normalized = normalizeConfidence01(obj.aggregateConfidence)
    if (normalized === undefined) {
      delete obj.aggregateConfidence
    } else {
      obj.aggregateConfidence = normalized
    }
  }
  if (Array.isArray(obj.findings)) {
    obj.findings = obj.findings.map((f) => {
      if (!f || typeof f !== "object") return f
      const finding = { ...(f as Record<string, unknown>) }
      if ("severity" in finding) {
        finding.severity = normalizeSeverityValue(finding.severity)
      }
      if ("confidence" in finding) {
        const normalized = normalizeConfidence01(finding.confidence)
        if (normalized === undefined) {
          delete finding.confidence
        } else {
          finding.confidence = normalized
        }
      }
      return finding
    })
  }
  return obj
}

/** Kompakte Zod-Fehler für ProviderDecision.errorCode (max 64 Zeichen DB). */
export function formatZodIssuesForErrorCode(error: z.ZodError, maxLen = 64): string {
  const parts = error.issues.slice(0, 3).map((i) => {
    const path = i.path.length ? i.path.join(".") : "root"
    return `${path}:${i.code}`
  })
  const joined = `SCHEMA_INVALID:${parts.join(",")}`
  return joined.length > maxLen ? joined.slice(0, maxLen) : joined
}

/** Volle Zod-Issues für Runtime-Logs. */
export function formatZodIssuesVerbose(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((i) => `${i.path.join(".") || "root"}: ${i.message} (${i.code})`)
    .join(" | ")
}

export const classificationStageSchema = z.object({
  contractClassification: z.string().min(1).max(120),
  partyConstellation: z.string().max(200).optional(),
  agbKontrolleAnwendbar: z.boolean().nullable().optional(),
  b2bOrB2c: z.enum(["b2b", "b2c", "gemischt", "unklar"]).optional(),
  /** Confidence wird auf 0.98 gekappt — 100 % ist für KI-Klassifikation nicht vertretbar. */
  classificationConfidence: z.coerce.number().min(0).max(1).transform((v) => Math.min(v, 0.98)).optional(),
  modelNotes: z.string().max(2000).optional()
})

export type ClassificationStagePayload = z.infer<typeof classificationStageSchema>

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
    "gewährleistung",
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
  /** Confidence wird auf 0.98 gekappt — 100 % ist für KI-Analysen nicht vertretbar. */
  confidence: z.coerce.number().min(0).max(1).transform((v) => Math.min(v, 0.98)).optional(),
  clauseRef: z.string().max(200).optional(),
  /** v2: exaktes Zitat der Originalklausel (max 2000 Zeichen) */
  quote: z.string().max(2000).nullable().optional(),
  /** v2: konkreter Formulierungsvorschlag (neue Klauselfassung) */
  suggestedRevision: z.string().max(4000).nullable().optional(),

  // ── v3: Analyse-Qualität ───────────────────────────────────────────

  /**
   * v3: Rechtliche Risikokategorie — differenziert zwischen zwingendem Recht,
   * AGB-Kontrolle, wirtschaftlichem Nachteil und fehlenden Schutzklauseln.
   * Ermöglicht Priorisierung: direct_mandatory_law_risk > agb_control_risk > missing > economic.
   */
  riskNature: z.enum([
    "direct_mandatory_law_risk",
    "agb_control_risk",
    "economic_negotiation_risk",
    "missing_protection_clause",
    "operational_supply_chain_risk",
    "privacy_or_confidentiality_risk",
    "procedural_litigation_risk"
  ]).optional(),

  /**
   * v3: Finding-Typ — unterscheidet vorhandene problematische Klauseln
   * von fehlenden Schutzklauseln.
   */
  findingType: z.enum(["existing_clause", "missing_clause"]).optional(),

  /**
   * v3: Primäre Rechtsgrundlage(n) für dieses Finding.
   * Bei B2B-AGB: § 307 BGB als Primärnorm.
   */
  primaryLegalBasis: z.array(z.string().max(200)).max(5).optional(),

  /**
   * v3: Referenz-/Indiz-Normen (§§ 308/309 BGB als Wertungsindiz im B2B).
   */
  referenceLegalBasis: z.array(z.string().max(200)).max(5).optional(),

  /** C.4: Konfidenz-Explainability — Aufschlüsselung der Konfidenz-Faktoren */
  confidenceFactors: z
    .object({
      normClarity: z.coerce.number().min(0).max(1),
      clauseClarity: z.coerce.number().min(0).max(1),
      contractContext: z.coerce.number().min(0).max(1),
      industryFit: z.coerce.number().min(0).max(1),
      precedent: z.coerce.number().min(0).max(1),
      limitingFactor: z.string().max(200).optional()
    })
    .nullable()
    .optional(),
  /** Evidence Graph MVP: Strukturierte Begründungskette pro Finding */
  evidenceGraph: z
    .object({
      normBasis: z
        .array(
          z.object({
            norm: z.string().max(200),
            marker: z.enum(["DIREKT", "ZWINGEND", "B2B-INDIZ", "ANALOG"]),
            relevance: z.string().max(500)
          })
        )
        .max(8)
        .optional(),
      reasoningSteps: z
        .array(
          z.object({
            step: z.coerce.number().int().min(1).max(10),
            label: z.string().max(100),
            content: z.string().max(2000)
          })
        )
        .max(10)
        .optional(),
      counterArguments: z.array(z.string().max(1000)).max(5).optional(),
      limitations: z.array(z.string().max(1000)).max(5).optional()
    })
    .nullable()
    .optional()
})

/** C.1: Cross-Clause-Interaktion — Wechselwirkung zwischen Klauseln */
export const clauseInteractionSchema = z.object({
  clauseRefs: z.array(z.string().max(100)).min(2).max(5),
  interactionType: z.enum(["verstärkend", "kompensierend", "widersprüchlich", "kumulativ"]),
  combinedRiskDescription: z.string().min(1).max(3000),
  combinedSeverity: severityLiteral,
  remediation: z.string().max(2000).optional()
})

export const riskFindingsStageSchema = z.object({
  findings: z.array(pipelineFindingSchema).max(40),
  riskScore01: z.coerce.number().min(0).max(1),
  aggregateConfidence: z.coerce.number().min(0).max(1).optional()
})

export const riskGuidanceStageSchema = z.object({
  recommendedMeasures: z.array(z.string().min(1).max(1200)).max(30),
  negotiationHints: z.array(z.string().min(1).max(1200)).max(20),
  explanationSummary: z.string().min(1).max(4000),
  aggregateConfidence: z.coerce.number().min(0).max(1).optional()
})

export const riskAndGuidanceStageSchema = z.object({
  findings: z.array(pipelineFindingSchema).max(40),
  clauseInteractions: z.array(clauseInteractionSchema).max(10).optional(),
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

  // Erst normaler Parse-Versuch
  try {
    return JSON.parse(cleaned) as unknown
  } catch {
    // Zweiter Versuch: LLM-typische JSON-Fehler bereinigen
  }

  let fixed = cleaned
  // Trailing commas vor } oder ] entfernen: ,\s*} → } und ,\s*] → ]
  fixed = fixed.replace(/,\s*([}\]])/g, "$1")
  // Einzeilige Kommentare entfernen (// ...)
  fixed = fixed.replace(/\/\/[^\n]*/g, "")
  // Block-Kommentare entfernen (/* ... */)
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, "")
  // NaN / Infinity durch null ersetzen
  fixed = fixed.replace(/\bNaN\b/g, "null")
  fixed = fixed.replace(/\bInfinity\b/g, "null")
  // Unescaped control characters in Strings entfernen (Newlines in Werten)
  fixed = fixed.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n")

  try {
    return JSON.parse(fixed) as unknown
  } catch {
    // Dritter Versuch: JSON-Block aus dem Text extrahieren (aggressiver)
    const jsonStart = fixed.indexOf("{")
    const jsonEnd = fixed.lastIndexOf("}")
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const block = fixed.slice(jsonStart, jsonEnd + 1)
      return JSON.parse(block) as unknown
    }
    // Alles fehlgeschlagen — Original-Fehler werfen
    return JSON.parse(cleaned) as unknown
  }
}
