/**
 * Zentrale Prompt-Templates für Vertragsanalyse — keine verstreuten Inline-Prompts in der Pipeline.
 * Versionen und Keys müssen mit PromptDefinition-Seed und DB-Releases übereinstimmen.
 */
import { CONTRACT_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/schemas/contract-analysis"

export const CONTRACT_PROMPT_BUNDLE_KEY = "contract_analysis.default"

export const CONTRACT_EXTRACTION_PROMPT_KEY = "contract.extraction.default"
export const CONTRACT_RISK_PROMPT_KEY = "contract.risk_guidance.default"

export { CONTRACT_ANALYSIS_PROMPT_VERSION }
/** @deprecated Nutze CONTRACT_ANALYSIS_PROMPT_VERSION */
export const CONTRACT_PROMPT_TEMPLATE_VERSION = CONTRACT_ANALYSIS_PROMPT_VERSION

const baseDe = (version: string) => `Du bist ein KI-System zur Unterstützung von Anwältinnen und Anwälten im DACH-Raum.
Antworte sachlich, auf Deutsch, ohne Rechtsberatung im Sinne des RDG zu simulieren.
Markiere Unsicherheiten klar. Prompt-Key: ${CONTRACT_EXTRACTION_PROMPT_KEY} · Version: ${version}.`

export function buildExtractionPromptBody(normalizedDocument: string, version: string = CONTRACT_ANALYSIS_PROMPT_VERSION): string {
  return `${baseDe(version)}

AUFGABE: Strukturierte Extraktion aus dem Vertrags- oder Geschäftstext.

Gib ausschließlich ein JSON-Objekt mit genau diesen Schlüsseln zurück:
- contractType (string, max 120 Zeichen): Kurzbezeichnung des Vertragstyps
- parties (Array von Objekten mit name, optional role, optional notes)
- term (Objekt mit optional startHint, endHint, noticePeriodHint, renewalHint als string oder null, optional terminationSummary)
- legalTopics (Array von Objekten mit topic aus: haftung | gewaehrleistung | vertraulichkeit | datenschutz | gerichtsstand | verguetung | sonstiges, summary, riskHint aus niedrig|mittel|hoch)
- extractionConfidence (Zahl 0–1, optional)
- modelNotes (string, optional)

TEXT:
${normalizedDocument}`
}

export function buildRiskAndGuidancePromptBody(
  normalizedDocument: string,
  extractionSummary: string,
  version: string = CONTRACT_ANALYSIS_PROMPT_VERSION
): string {
  return `${baseDe(version)}

VORAB-EXTRAKTION (Kontext, ggf. unvollständig):
${extractionSummary}

AUFGABE: Klausel- und Risikoanalyse inkl. Handlungsempfehlungen.

Gib ausschließlich ein JSON-Objekt mit genau diesen Schlüsseln zurück:
- findings (Array: category, title, description, severity niedrig|mittel|hoch, optional confidence 0–1, optional clauseRef)
- riskScore01 (Zahl 0–1, Gesamtrisikoindikator)
- recommendedMeasures (Array von Strings)
- negotiationHints (Array von Strings)
- explanationSummary (string, kompakte Begründung)
- aggregateConfidence (Zahl 0–1, optional)

VOLLTEXT (Referenz):
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
