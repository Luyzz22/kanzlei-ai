/**
 * Zentrale Prompt-Templates für Vertragsanalyse — keine verstreuten Inline-Prompts in der Pipeline.
 * Versionen und Keys müssen mit PromptDefinition-Seed und DB-Releases übereinstimmen.
 *
 * Hotfix 9: Instructions und Vertragstext sind getrennt.
 * Die Pipeline übergibt den Text EINMAL via provider.analyze({ documentText }).
 */
import {
  CONTRACT_ANALYSIS_PROMPT_VERSION,
  type ClassificationStagePayload
} from "@/lib/ai/schemas/contract-analysis"

export const CONTRACT_PROMPT_BUNDLE_KEY = "contract_analysis.default"

export const CONTRACT_CLASSIFICATION_PROMPT_KEY = "contract.classification.default"
export const CONTRACT_EXTRACTION_PROMPT_KEY = "contract.extraction.default"
export const CONTRACT_RISK_PROMPT_KEY = "contract.risk_guidance.default"

export { CONTRACT_ANALYSIS_PROMPT_VERSION }
/** @deprecated Nutze CONTRACT_ANALYSIS_PROMPT_VERSION */
export const CONTRACT_PROMPT_TEMPLATE_VERSION = CONTRACT_ANALYSIS_PROMPT_VERSION

const baseDe = (version: string, promptKey: string) => `Du bist ein KI-System zur Unterstützung von Anwältinnen und Anwälten im DACH-Raum.
Antworte sachlich, auf Deutsch, ohne Rechtsberatung im Sinne des RDG zu simulieren.
Markiere Unsicherheiten klar. Prompt-Key: ${promptKey} · Version: ${version}.`

/** Adaptive Finding-Obergrenze — reduziert Output-Token-Druck bei langen Verträgen. */
export function maxFindingsForDocumentLength(charLength: number): number {
  if (charLength >= 80_000) return 6
  if (charLength >= 40_000) return 8
  if (charLength >= 20_000) return 10
  return 12
}

function classificationContextBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""
  return `
VORAB-KLASSIFIKATION:
- Vertragstyp: ${classification.contractClassification}
${classification.partyConstellation ? `- Parteikonstellation: ${classification.partyConstellation}` : ""}
${classification.agbKontrolleAnwendbar != null ? `- AGB-Kontrolle anwendbar: ${classification.agbKontrolleAnwendbar ? "ja" : "nein"}` : ""}
`
}

export function buildClassificationPromptInstructions(
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${baseDe(version, CONTRACT_CLASSIFICATION_PROMPT_KEY)}

AUFGABE: Vertragstyp und Parteikonstellation klassifizieren (Stage 0).

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "contractClassification": "string (z.B. Lieferantenvertrag, NDA, Arbeitsvertrag)",
  "partyConstellation": "string (optional, z.B. B2B Kauf vs. Verkauf)",
  "agbKontrolleAnwendbar": "boolean oder null",
  "b2bOrB2c": "b2b|b2c|gemischt|unklar (optional)",
  "classificationConfidence": "number 0-1 (optional)",
  "modelNotes": "string (optional)"
}

REGELN:
- severity-Werte später immer auf Deutsch: niedrig|mittel|hoch
- Ausgabe: reines JSON ohne Markdown-Fences
- Der Vertragstext folgt im nächsten Abschnitt.`
}

export function buildClassificationPromptBody(
  normalizedDocument: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${buildClassificationPromptInstructions(version)}

VERTRAGSTEXT:
${normalizedDocument}`
}

export function buildExtractionPromptInstructions(
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  return `${baseDe(version, CONTRACT_EXTRACTION_PROMPT_KEY)}
${classificationContextBlock(classification)}
AUFGABE: Strukturierte Extraktion aus dem Vertragstext — vollständig und präzise.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt nach folgendem Schema:

{
  "contractType": "string (Vertragstyp, max 120 Zeichen)",
  "parties": [
    { "name": "string", "role": "string (optional)", "notes": "string (optional)" }
  ],
  "term": {
    "startHint": "string oder null",
    "endHint": "string oder null",
    "noticePeriodHint": "string oder null",
    "renewalHint": "string oder null",
    "terminationSummary": "string (optional)"
  },
  "legalTopics": [
    { "topic": "haftung|gewährleistung|vertraulichkeit|datenschutz|gerichtsstand|verguetung|sonstiges",
      "summary": "string",
      "riskHint": "niedrig|mittel|hoch" }
  ],
  "structuredData": { "customer": "string|null", "vendor": "string|null", "..." : "..." },
  "deadlines": { "noticePeriodDays": "number|null", "..." : "..." },
  "extractionConfidence": "number (0-1)",
  "modelNotes": "string (optional)"
}

REGELN:
- Felder auf null wenn nicht im Text — NICHT erfinden.
- riskHint/severity immer: niedrig|mittel|hoch (Deutsch).
- Ausgabe: reines JSON ohne Markdown-Fences.
- Der Vertragstext folgt im nächsten Abschnitt.`
}

export function buildExtractionPromptBody(
  normalizedDocument: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  return `${buildExtractionPromptInstructions(version, classification)}

VERTRAGSTEXT:
${normalizedDocument}`
}

export function buildRiskFindingsPromptInstructions(
  extractionSummary: string,
  documentCharLength: number,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  const maxFindings = maxFindingsForDocumentLength(documentCharLength)
  return `${baseDe(version, CONTRACT_RISK_PROMPT_KEY)}
${classificationContextBlock(classification)}
VORAB-EXTRAKTION:
${extractionSummary}

AUFGABE (Phase 1): Klausel-Findings und Gesamtrisiko-Score.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "findings": [
    {
      "category": "string (max 64 Zeichen)",
      "title": "string (max 240 Zeichen)",
      "description": "string",
      "severity": "niedrig|mittel|hoch",
      "confidence": "number 0-1",
      "clauseRef": "string",
      "quote": "string (wortwörtliches Zitat, max 1200 Zeichen — gekürzt wenn nötig)",
      "suggestedRevision": "string (optional bei niedrig; max 2000 Zeichen bei mittel/hoch)"
    }
  ],
  "riskScore01": "number 0-1 (NICHT 0-100)",
  "aggregateConfidence": "number 0-1 (optional)"
}

REGELN:
- Mindestens 3, maximal ${maxFindings} Findings (priorisiere Geschäftsrisiko).
- severity NUR: niedrig|mittel|hoch (Deutsch, kein "high"/"medium").
- riskScore01 zwischen 0 und 1 (0.75 = 75% Risiko).
- quote: wörtlich aus dem Vertrag; bei fehlender Klausel: "Keine entsprechende Klausel im Vertrag".
- Halte suggestedRevision kompakt — Qualität vor Länge.
- Ausgabe: reines JSON ohne Markdown-Fences.
- Der Vertragstext folgt im nächsten Abschnitt.`
}

export function buildRiskGuidancePromptInstructions(
  extractionSummary: string,
  findingsJson: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${baseDe(version, CONTRACT_RISK_PROMPT_KEY)}

VORAB-EXTRAKTION:
${extractionSummary}

BEREITS ERSTELLTE FINDINGS (Phase 1 — nicht wiederholen):
${findingsJson}

AUFGABE (Phase 2): Handlungsempfehlungen und Verhandlungshinweise.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "recommendedMeasures": ["string", "..."],
  "negotiationHints": ["string", "..."],
  "explanationSummary": "string (kompakte Gesamtbegründung, max 3000 Zeichen)",
  "aggregateConfidence": "number 0-1 (optional)"
}

REGELN:
- Beziehe dich auf die Findings oben.
- Ausgabe: reines JSON ohne Markdown-Fences.`
}

export function buildRiskAndGuidancePromptInstructions(
  extractionSummary: string,
  documentCharLength: number,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  const maxFindings = maxFindingsForDocumentLength(documentCharLength)
  return `${baseDe(version, CONTRACT_RISK_PROMPT_KEY)}
${classificationContextBlock(classification)}
VORAB-EXTRAKTION:
${extractionSummary}

AUFGABE: Klausel- und Risikoanalyse inkl. Handlungsempfehlungen.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "findings": [ { "category", "title", "description", "severity": "niedrig|mittel|hoch", "confidence", "clauseRef", "quote", "suggestedRevision" } ],
  "riskScore01": "number 0-1",
  "recommendedMeasures": ["string"],
  "negotiationHints": ["string"],
  "explanationSummary": "string",
  "aggregateConfidence": "number 0-1"
}

REGELN:
- Mindestens 3, maximal ${maxFindings} Findings.
- severity/riskScore01: siehe Phase-1-Regeln (Deutsch, 0-1 Skala).
- quote max 1200 Zeichen; suggestedRevision max 2000 Zeichen.
- Ausgabe: reines JSON ohne Markdown-Fences.
- Der Vertragstext folgt im nächsten Abschnitt.`
}

/** @deprecated Legacy — enthält eingebetteten Vertragstext (Doppelung wenn Provider documentText nutzt). */
export function buildRiskAndGuidancePromptBody(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION,
  classification?: ClassificationStagePayload | null
): string {
  return `${buildRiskAndGuidancePromptInstructions(
    extractionSummary,
    normalizedDocument.length,
    version,
    classification
  )}

VERTRAGSTEXT:
${normalizedDocument}`
}

export type DefaultContractPromptBundle = {
  bundleKey: typeof CONTRACT_PROMPT_BUNDLE_KEY
  extraction: { key: typeof CONTRACT_EXTRACTION_PROMPT_KEY; version: string; text: string }
  risk: { key: typeof CONTRACT_RISK_PROMPT_KEY; version: string; text: string }
}

export function buildDefaultContractPromptBundle(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): DefaultContractPromptBundle {
  return {
    bundleKey: CONTRACT_PROMPT_BUNDLE_KEY,
    extraction: {
      key: CONTRACT_EXTRACTION_PROMPT_KEY,
      version,
      text: buildExtractionPromptBody(normalizedDocument, version)
    },
    risk: {
      key: CONTRACT_RISK_PROMPT_KEY,
      version,
      text: buildRiskAndGuidancePromptBody(normalizedDocument, extractionSummary, version)
    }
  }
}

/** Ab dieser Dokumentlänge: Risk-Stage in zwei Phasen (Findings + Guidance). */
export function shouldSplitRiskStage(documentCharLength: number): boolean {
  const threshold = Number.parseInt(process.env.AI_RISK_SPLIT_CHAR_THRESHOLD ?? "25000", 10)
  return documentCharLength >= threshold
}
