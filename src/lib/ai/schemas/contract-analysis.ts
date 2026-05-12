import { z } from "zod"

/** Version der Prompts / Erwartungsstruktur — bei Schema-Änderungen erhöhen. */
export const CONTRACT_ANALYSIS_PROMPT_VERSION = "2026-05-12"

/**
 * UNIFIED ANALYSIS SCHEMA v3 (2026-05-11)
 *
 * Neu in v3:
 * - Classification Stage (Step 0): Vertragstypklassifikation, Parteikonstellation,
 *   Mandantenrolle, Brancheneinordnung, anwendbare Normen-Matrix
 * - Kontextinjektion in Extraction und Risk Stages
 *
 * Backward-kompatibel: Alle v2-Felder bleiben nullable/optional.
 */

const severityLiteral = z.enum(["niedrig", "mittel", "hoch"])

// =======================================================================
// CLASSIFICATION STAGE (Step 0) — NEU
// =======================================================================

export const contractClassificationEnum = z.enum([
  "AGB",
  "Individualvertrag",
  "Mischform"
])

export const partyConstellationEnum = z.enum([
  "B2B",
  "B2C",
  "Oeffentliche_Hand"
])

export const clientRoleEnum = z.enum([
  "Auftraggeber",
  "Lieferant",
  "Neutral"
])

export const industryClassificationEnum = z.enum([
  "Produktion",
  "Dienstleistung",
  "Finanzprodukt",
  "International",
  "Sonstige"
])

export const classificationStageSchema = z.object({
  /** AGB (einseitig vorformuliert, § 305 BGB), Individualvertrag, Mischform */
  contractClassification: contractClassificationEnum,
  /** Konfidenz der Vertragstyp-Klassifikation (0-1) */
  classificationConfidence: z.coerce.number().min(0).max(1),
  /** Begründung für die Klassifikation */
  classificationReasoning: z.string().min(1).max(2000),
  /** Welche Klauseln als AGB-typisch identifiziert wurden (bei Mischform) */
  agbIndicators: z.array(z.string().max(500)).max(10).optional(),

  /** B2B (beide Vollkaufleute), B2C (ein Verbraucher), Öffentliche Hand */
  partyConstellation: partyConstellationEnum,
  /** Begründung für die Parteikonstellation */
  partyConstellationReasoning: z.string().max(1000).optional(),

  /** Mandantenrolle: Auftraggeber/Käufer, Lieferant/Verkäufer, Neutral */
  clientRole: clientRoleEnum,

  /** Brancheneinordnung für branchenspezifische Normen */
  industryClassification: industryClassificationEnum,
  /** Ob internationaler Bezug vorliegt (CISG, Incoterms etc.) */
  internationalElement: z.boolean(),
  /** CISG ausgeschlossen? */
  cisgExcluded: z.boolean().nullable().optional(),

  /** Anwendbare Rechtsnormen-Matrix */
  applicableNorms: z.array(z.object({
    norm: z.string().max(200),
    relevance: z.enum(["primär", "sekundär", "prüfenswert"]),
    note: z.string().max(500).optional()
  })).max(20),

  /** Kontrolle nach §§ 305-310 BGB anwendbar? */
  agbKontrolleAnwendbar: z.boolean(),

  /** Welcher AGB-Kontroll-Maßstab gilt? */
  agbKontrollmassstab: z.string().max(500).nullable().optional(),

  /** Zusammenfassendes Klassifikations-Statement für nachfolgende Stages */
  classificationSummary: z.string().min(1).max(1500),

  /** Model-Notizen */
  modelNotes: z.string().max(1000).optional()
})

export type ClassificationStagePayload = z.infer<typeof classificationStageSchema>

// =======================================================================
// EXTRACTION STAGE (Step 1) — unverändert
// =======================================================================

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

// =======================================================================
// RISK & GUIDANCE STAGE (Step 2) — unverändert
// =======================================================================

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
  suggestedRevision: z.string().max(4000).nullable().optional(),
  /** C.4: Konfidenz-Explainability — Aufschlüsselung der Konfidenz-Faktoren */
  confidenceFactors: z.object({
    /** Normklarheit (30%): BGH-Rspr eindeutig=1.0, streitig=0.4, kein Präzedenz=0.2 */
    normClarity: z.coerce.number().min(0).max(1),
    /** Klauselklarheit (25%): eindeutig=1.0, mehrdeutig=0.4, widersprüchlich=0.2 */
    clauseClarity: z.coerce.number().min(0).max(1),
    /** Vertragskontext (20%): AGB klar=1.0, Individualvertrag möglich=0.4, unklar=0.2 */
    contractContext: z.coerce.number().min(0).max(1),
    /** Branchenkompatibilität (15%): Standard klar=1.0, unklar=0.4, kein Kontext=0.2 */
    industryFit: z.coerce.number().min(0).max(1),
    /** Präzedenzlage (10%): BGH direkt=1.0, OLG=0.7, nur Literatur=0.4, Neuland=0.2 */
    precedent: z.coerce.number().min(0).max(1),
    /** Welcher Faktor die Konfidenz am stärksten begrenzt */
    limitingFactor: z.string().max(200).optional()
  }).nullable().optional()
})

/** C.1: Cross-Clause-Interaktion — Wechselwirkung zwischen Klauseln */
export const clauseInteractionSchema = z.object({
  /** Betroffene Klauselreferenzen (z.B. ["§ 1", "§ 3"]) */
  clauseRefs: z.array(z.string().max(100)).min(2).max(5),
  /** Art der Interaktion */
  interactionType: z.enum(["verstärkend", "kompensierend", "widersprüchlich", "kumulativ"]),
  /** Beschreibung des kombinierten Risikos */
  combinedRiskDescription: z.string().min(1).max(3000),
  /** Kombinierte Severity (kann höher als Einzelrisiken sein) */
  combinedSeverity: severityLiteral,
  /** Abhilfemaßnahme für die Kombination */
  remediation: z.string().max(2000).optional()
})

export const riskAndGuidanceStageSchema = z.object({
  findings: z.array(pipelineFindingSchema).max(40),
  /** C.1: Klauselinteraktionen — kombinierte Risiken zwischen Klauseln */
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
  classification: classificationStageSchema.optional(),
  extraction: extractionStageSchema,
  risk: riskAndGuidanceStageSchema
})

export type FullContractAnalysisPayload = z.infer<typeof fullContractAnalysisSchema>

// =======================================================================
// JSON-Parsing Utilities
// =======================================================================

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
