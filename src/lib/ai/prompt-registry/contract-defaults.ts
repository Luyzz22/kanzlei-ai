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
- structuredData (Objekt, OPTIONAL — nur gesetzte Felder zurückgeben):
    * customer (Vertragspartner "Kunde" / "Auftraggeber" / "Empfänger")
    * vendor (Vertragspartner "Anbieter" / "Lieferant" / "Offenlegende Partei")
    * product (Kurzbezeichnung des Vertragsgegenstands)
    * jurisdiction (Gerichtsstand)
    * applicableLaw (Anwendbares Recht, z.B. "Deutsches Recht")
    * liabilityLimit (Haftungsgrenze als Freitext, z.B. "EUR 1.000.000" oder "unbegrenzt")
    * confidentialityObligation (boolean: Geheimhaltungspflicht vereinbart?)
    * penaltyClause (Vertragsstrafe als Freitext, z.B. "EUR 250.000 pro Verstoß")
    * intellectualProperty (Regelung zu IP-Rechten als Freitext)
    * dataProcessingAgreement (boolean: AVV vorhanden?)
    * dataLocation (Datenlokation / Hosting-Ort)
    * dataExportClause (boolean: Datenexport-Klausel vorhanden?)
- deadlines (Objekt, OPTIONAL — nur gesetzte Felder zurückgeben):
    * noticePeriodDays (Kündigungsfrist in Tagen, Zahl)
    * autoRenewal (boolean: Automatische Verlängerung vorhanden?)
    * renewalTermMonths (Verlängerungszeitraum in Monaten, Zahl)
    * contractStartDate (Freitext oder ISO-Datum)
    * contractEndDate (Freitext, z.B. "unbegrenzt" oder ISO-Datum)
    * nextCancellationDate (nächstmöglicher Kündigungstermin als Freitext oder ISO)
    * warrantyPeriodMonths (Gewährleistungsfrist in Monaten, Zahl)
- extractionConfidence (Zahl 0–1, optional)
- modelNotes (string, optional)

WICHTIG:
- Gib structuredData und deadlines nur aus, wenn der Text tatsächlich Hinweise enthält.
- Felder, die im Text nicht vorkommen, weglassen (NICHT erfinden, NICHT raten).
- Bei Unsicherheit: Feld weglassen oder extractionConfidence reduzieren.

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
- findings (Array von Objekten):
    * category (string, max 64 Zeichen): Kategorie (z.B. "Haftung", "Datenschutz", "Laufzeit")
    * title (string, max 240 Zeichen): prägnanter Titel des Findings
    * description (string): ausführliche Erläuterung, warum dieses Finding relevant ist
    * severity (niedrig|mittel|hoch)
    * confidence (Zahl 0–1, optional): Wie sicher ist das Finding?
    * clauseRef (string, max 200 Zeichen, optional): Klausel- oder Paragraphenverweis, z.B. "§ 3 Abs. 1"
    * quote (string, max 2000 Zeichen, optional): EXAKTES Zitat der relevanten
      Vertragsklausel aus dem Volltext — Wort für Wort. Nur wenn die Klausel
      klar lokalisierbar ist. Bei fehlenden Klauseln (z.B. "Laufzeitregelung fehlt")
      weglassen oder mit Hinweis "Keine entsprechende Klausel im Vertrag".
    * suggestedRevision (string, max 4000 Zeichen, optional): KONKRETER
      Formulierungsvorschlag — eine alternative Klausel, die das identifizierte
      Risiko adressiert. Muss unmittelbar in einen Vertrag einsetzbar sein.
- riskScore01 (Zahl 0–1, Gesamtrisikoindikator)
- recommendedMeasures (Array von Strings: konkrete Handlungsempfehlungen)
- negotiationHints (Array von Strings: Verhandlungshinweise / Argumentationshilfen)
- explanationSummary (string, kompakte Gesamtbegründung)
- aggregateConfidence (Zahl 0–1, optional)

WICHTIG:
- quote und suggestedRevision sind kein Muss, aber für Enterprise-Nutzer
  der wichtigste fachliche Mehrwert. Nutze sie wo immer möglich.
- Bei suggestedRevision: Formuliere die Alternative SO, dass sie direkt in
  einen Vertrag übernommen werden könnte — juristisch sauber, nicht umgangssprachlich.
- clauseRef folgt deutscher Zitierweise: "§ 4", "§ 3 Abs. 1 Satz 2", etc.

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
