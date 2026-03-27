import { CONTRACT_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/schemas/contract-analysis"

const baseDe = `Du bist ein KI-System zur Unterstützung von Anwältinnen und Anwälten im DACH-Raum.
Antworte sachlich, auf Deutsch, ohne Rechtsberatung im Sinne des RDG zu simulieren.
Markiere Unsicherheiten klar. Prompt-Version: ${CONTRACT_ANALYSIS_PROMPT_VERSION}.`

export function extractionStagePrompt(normalizedDocument: string): string {
  return `${baseDe}

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

export function riskAndGuidanceStagePrompt(normalizedDocument: string, extractionSummary: string): string {
  return `${baseDe}

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
