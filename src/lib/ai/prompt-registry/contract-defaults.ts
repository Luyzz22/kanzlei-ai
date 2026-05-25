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

/** Adaptive Finding-Obergrenze — erhöht für Missing-Clause-Detection und granulare § 6-Aufspaltung. */
export function maxFindingsForDocumentLength(charLength: number): number {
  if (charLength >= 80_000) return 8
  if (charLength >= 40_000) return 10
  if (charLength >= 20_000) return 12
  return 16
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

/**
 * B2B-AGB-Qualifier — juristische Dogmatik-Korrektur.
 *
 * Bei B2B-Verträgen gelten §§ 308, 309 BGB NICHT unmittelbar wie im
 * Verbraucherverkehr. Sie sind nur Indiz-/Wertungsmaßstab im Rahmen
 * der Generalklausel § 307 BGB (BGH ständige Rspr.).
 *
 * Dieser Block wird nur eingefügt wenn:
 * - Parteikonstellation enthält "B2B" und
 * - AGB-Kontrolle anwendbar ist oder vermutet wird
 */
function b2bAgbQualifierBlock(classification?: ClassificationStagePayload | null): string {
  if (!classification) return ""

  const isB2b =
    classification.partyConstellation?.toLowerCase().includes("b2b") ?? false
  const agbRelevant = classification.agbKontrolleAnwendbar !== false

  if (!isB2b || !agbRelevant) return ""

  return `
B2B-AGB-QUALIFIKATION (WICHTIG FÜR ALLE FINDINGS):
Bei unterstellter AGB-Einordnung ist dieser Vertrag ein B2B-Vertrag (§ 310 Abs. 1 BGB).
- PRIMÄRNORM: § 307 BGB (unangemessene Benachteiligung).
- §§ 308 und 309 BGB gelten NICHT unmittelbar, sondern nur als Wertungs- und Indizmaßstab.
- NIEMALS formulieren: "verstößt gegen § 309 BGB" oder "§ 308 Nr. X ist verletzt".
- STATTDESSEN formulieren:
  * "AGB-rechtlich erheblich angreifbar nach § 307 BGB"
  * "§ 309 Nr. 7 BGB dient als starkes Wertungsindiz"
  * "unter Heranziehung des Rechtsgedankens des § 308 Nr. X BGB"
- primaryLegalBasis MUSS § 307 BGB enthalten.
- §§ 308/309 BGB kommen in referenceLegalBasis mit Suffix "als Wertungsindiz".
- Ausnahme: § 309 Nr. 7 lit. a BGB (Haftung für Personenschäden) gilt auch im B2B-Verkehr als DIREKT anwendbar (BGH).
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
${b2bAgbQualifierBlock(classification)}
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
      "confidence": "number 0-0.98 (NIEMALS 1.0)",
      "clauseRef": "string",
      "quote": "string (wortwörtliches Zitat, max 1200 Zeichen — gekürzt wenn nötig)",
      "suggestedRevision": "string (optional bei niedrig; max 2000 Zeichen bei mittel/hoch)",
      "riskNature": "direct_mandatory_law_risk|agb_control_risk|economic_negotiation_risk|missing_protection_clause|operational_supply_chain_risk|privacy_or_confidentiality_risk|procedural_litigation_risk",
      "findingType": "existing_clause|missing_clause",
      "primaryLegalBasis": ["§ 307 BGB"],
      "referenceLegalBasis": ["§ 309 Nr. 7 BGB als Wertungsindiz"]
    }
  ],
  "riskScore01": "number 0-1 (NICHT 0-100)",
  "aggregateConfidence": "number 0-0.98 (optional)"
}

REGELN:
- Mindestens 3, maximal ${maxFindings} Findings (priorisiere Geschäftsrisiko).
- severity NUR: niedrig|mittel|hoch (Deutsch, kein "high"/"medium").
- confidence und aggregateConfidence NIEMALS 1.0 — Maximalwert 0.98.
- riskScore01 zwischen 0 und 1 (0.75 = 75% Risiko).
- Jedes Finding MUSS riskNature, findingType und primaryLegalBasis enthalten.
- Bei B2B-Verträgen: § 307 BGB als Primärnorm. §§ 308/309 BGB nur als Wertungsindiz.
- quote: wörtlich aus dem Vertrag; bei fehlender Klausel: null.
- Halte suggestedRevision kompakt — Qualität vor Länge.
- Ausgabe: reines JSON ohne Markdown-Fences.

FINDING-GRANULARITÄT (WICHTIG):
- NICHT mehrere verschiedene Risiken in einem Finding zusammenfassen.
- Jede eigenständige Problemklausel bekommt ein eigenes Finding.
- Lieber 15 granulare Findings als 10 gemischte.

MISSING-CLAUSE-PRÜFUNG (zusätzlich zu vorhandenen Klauseln):
Prüfe ob folgende Schutzklauseln FEHLEN (findingType="missing_clause", riskNature="missing_protection_clause"):
1. Lieferverzugsregelung / Ersatzbeschaffung / Vertragsstrafe bei Verzug
2. Qualitätssicherung / Prüfprotokolle / Zertifikate (bei technischen Waren)
3. Force Majeure / Lieferkettenstörung
4. Produkthaftung / Rückruf (bei Industriekomponenten)
5. Datenschutz-Rollenklärung / AVV (wenn personenbezogene Daten erwähnt)
- Nur Missing-Clauses erzeugen die für den konkreten Vertragstyp relevant sind.
- clauseRef="Nicht geregelt", quote=null.

Der Vertragstext folgt im nächsten Abschnitt.`
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
  "aggregateConfidence": "number 0-0.98 (optional, NIEMALS 1.0)"
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
${b2bAgbQualifierBlock(classification)}
VORAB-EXTRAKTION:
${extractionSummary}

AUFGABE: Klausel- und Risikoanalyse inkl. Handlungsempfehlungen.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "findings": [ {
    "category", "title", "description",
    "severity": "niedrig|mittel|hoch",
    "confidence": "number 0-0.98 (NIEMALS 1.0)",
    "clauseRef",
    "quote": "exaktes Zitat max 1200 Zeichen",
    "suggestedRevision": "max 2000 Zeichen",
    "riskNature": "direct_mandatory_law_risk|agb_control_risk|economic_negotiation_risk|missing_protection_clause|operational_supply_chain_risk|privacy_or_confidentiality_risk|procedural_litigation_risk",
    "findingType": "existing_clause|missing_clause",
    "primaryLegalBasis": ["§ 307 BGB"],
    "referenceLegalBasis": ["§ 309 Nr. 7 BGB als Wertungsindiz"]
  } ],
  "riskScore01": "number 0-1",
  "recommendedMeasures": ["string"],
  "negotiationHints": ["string"],
  "explanationSummary": "string",
  "aggregateConfidence": "number 0-0.98"
}

REGELN:
- Mindestens 3, maximal ${maxFindings} Findings.
- severity auf Deutsch: niedrig|mittel|hoch.
- confidence und aggregateConfidence NIEMALS 1.0 oder 100 % — Maximalwert 0.98.
- riskScore01: 0-1 Skala.
- quote: max 1200 Zeichen.
- suggestedRevision: max 2000 Zeichen.
- Jedes Finding MUSS riskNature, findingType und primaryLegalBasis enthalten.
- Bei B2B-Verträgen: § 307 BGB als Primärnorm. §§ 308/309 BGB nur als Wertungsindiz.
- Ausgabe: reines JSON ohne Markdown-Fences.

FINDING-GRANULARITÄT (WICHTIG):
- NICHT mehrere verschiedene Risiken in einem Finding zusammenfassen.
- Jede eigenständige Problemklausel bekommt ein eigenes Finding:
  * Haftungsbeschränkung (Personenschäden/grobe Fahrlässigkeit) = eigenes Finding
  * Rücktrittsausschluss / Gewährleistungsfristverkürzung = eigenes Finding
  * Rügefristen (24h/48h) = eigenes Finding
  * Aufrechnungs-/Zurückbehaltungsverbot = eigenes Finding
  * Gefahrübergang / Teillieferungsregelung = eigenes Finding
- Das Zusammenfassen verschiedener §§ in ein Finding verfälscht die Priorisierung.
- Lieber 15 granulare Findings als 10 gemischte.

MISSING-CLAUSE-PRÜFUNG (zusätzlich zu vorhandenen Klauseln):
Prüfe ob folgende Schutzklauseln im Vertrag FEHLEN und erzeuge dafür Findings mit findingType="missing_clause" und riskNature="missing_protection_clause":
1. Lieferverzugsregelung / Ersatzbeschaffung / Vertragsstrafe bei Verzug (wenn Lieferant Lieferpflicht hat)
2. Qualitätssicherung / Prüfprotokolle / Zertifikate (wenn technische Komponenten/Waren)
3. Force Majeure / Lieferkettenstörung / Cyber / Energieausfall
4. Produkthaftung / Rückruf / Compliance-Dokumentation (wenn Industriekomponenten)
5. Datenschutz-Rollenklärung / AVV / TOMs (wenn personenbezogene Daten oder "Kundendaten" erwähnt)
6. Salvatorische Klausel mit geltungserhaltender Reduktion (wenn vorhanden → als eigenes Finding bewerten)
- Missing-Clause-Findings: clauseRef="Nicht geregelt", quote=null.
- Nur Missing-Clauses erzeugen die für den konkreten Vertragstyp relevant sind.

Der Vertragstext folgt im nächsten Abschnitt.`
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
