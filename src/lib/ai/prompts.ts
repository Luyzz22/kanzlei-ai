import { AnalysisType } from "@/types/ai"

interface PromptOptions {
  language?: "de" | "en"
  documentText: string
  context?: string
}

const languageInstructions = {
  de: "Antworte vollständig auf Deutsch und nutze juristisch präzise Terminologie für den DACH-Raum.",
  en: "Respond in English using precise legal terminology and clear structure."
}

const contractJsonSchema = JSON.stringify(
  {
    type: "object",
    properties: {
      analysisType: { type: "string", enum: ["contract"] },
      summary: { type: "string", description: "Prägnante Zusammenfassung des Vertrags in 2-3 Sätzen: Vertragsparteien, Gegenstand, Laufzeit, wesentliche Konditionen." },
      riskScore: { type: "number", minimum: 0, maximum: 100, description: "Gesamtrisiko-Score: 0=kein Risiko, 100=kritisch. Berücksichtige Haftung, Datenschutz, Laufzeit, Kündigungsfristen." },
      extractedData: {
        type: "object",
        description: "Strukturierte Vertragsdaten als Key-Value-Paare",
        properties: {
          Kunde: { type: "string" },
          Anbieter: { type: "string" },
          Produkt: { type: "string" },
          "Monatliche Gebühr": { type: "string" },
          Abrechnungsintervall: { type: "string" },
          "Mindestlaufzeit (Monate)": { type: "number" },
          "Auto-Renewal": { type: "boolean" },
          "Kündigungsfrist (Tage)": { type: "number" },
          "SLA Uptime (%)": { type: "number" },
          "Support-Level": { type: "string" },
          Datenlokation: { type: "string" },
          "AVV vorhanden": { type: "boolean" },
          Haftungsgrenze: { type: "string" },
          "Datenexport-Klausel": { type: "boolean" }
        }
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Kurzer, prägnanter Titel des Risikos" },
            severity: { type: "string", enum: ["niedrig", "mittel", "hoch"] },
            explanation: { type: "string", description: "Erläuterung des Risikos und warum es relevant ist" },
            quote: { type: "string", description: "Exaktes Zitat der relevanten Vertragsklausel" }
          },
          required: ["title", "severity", "explanation"]
        }
      },
      recommendedActions: {
        type: "array",
        items: { type: "string" },
        description: "Konkrete Handlungsempfehlungen für den Mandanten"
      }
    },
    required: ["analysisType", "summary", "riskScore", "extractedData", "findings", "recommendedActions"]
  },
  null,
  2
)

function baseJsonSchema(type: AnalysisType): string {
  return JSON.stringify(
    {
      type: "object",
      properties: {
        analysisType: { type: "string", enum: [type] },
        summary: { type: "string" },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              severity: { type: "string", enum: ["niedrig", "mittel", "hoch"] },
              explanation: { type: "string" },
              quote: { type: "string" }
            },
            required: ["title", "severity", "explanation"]
          }
        },
        recommendedActions: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["analysisType", "summary", "findings", "recommendedActions"]
    },
    null,
    2
  )
}

export function contractAnalysisPrompt(options: PromptOptions): string {
  const language = options.language ?? "de"
  return `Du bist ein Enterprise-KI-System für juristische Vertragsanalyse, entwickelt für Kanzleien und Rechtsabteilungen im DACH-Raum. ${languageInstructions[language]}

AUFGABE: Analysiere den folgenden Vertrag systematisch und gründlich.

ANALYSE-SCHWERPUNKTE:
1. Extrahiere alle strukturierten Vertragsdaten (Parteien, Konditionen, Laufzeiten, SLA)
2. Bewerte das Gesamtrisiko auf einer Skala von 0-100
3. Identifiziere konkrete Risiken mit Schweregrad und Zitat der betreffenden Klausel
4. Prüfe auf DSGVO-Konformität, fehlende AVV, Datenlokation
5. Bewerte Kündigungsfristen, Auto-Renewal, Haftungsbeschränkungen
6. Formuliere konkrete, umsetzbare Handlungsempfehlungen

Kontext: ${options.context ?? "Standardanalyse ohne Zusatzkontext"}

VERTRAGSDOKUMENT:
${options.documentText}

WICHTIG: Antworte ausschließlich mit einem validen JSON-Objekt (kein Markdown, keine Code-Fences). Schema:
${contractJsonSchema}`
}

export function documentSummaryPrompt(options: PromptOptions): string {
  const language = options.language ?? "de"
  return `Du bist ein KI-Assistent für juristische Zusammenfassungen. ${languageInstructions[language]}

Fasse das Dokument prägnant zusammen und nenne die wichtigsten Kernpunkte.
Dokument:\n${options.documentText}

Ausgabeformat (JSON-Schema):\n${baseJsonSchema(AnalysisType.SUMMARY)}`
}

export function riskAssessmentPrompt(options: PromptOptions): string {
  const language = options.language ?? "de"
  return `Du bist ein KI-Risikoanalyst für Kanzleien. ${languageInstructions[language]}

Identifiziere rechtliche, operative und finanzielle Risiken inklusive Priorisierung.
Dokument:\n${options.documentText}

Ausgabeformat (JSON-Schema):\n${baseJsonSchema(AnalysisType.RISK)}`
}

export function clauseExtractionPrompt(options: PromptOptions): string {
  const language = options.language ?? "de"
  return `Du bist ein KI-System zur Klausel-Extraktion. ${languageInstructions[language]}

Extrahiere relevante Klauseln (z. B. Haftung, Kündigung, Vergütung, Datenschutz) und bewerte deren Risiken.
Dokument:\n${options.documentText}

Ausgabeformat (JSON-Schema):\n${baseJsonSchema(AnalysisType.CLAUSE)}`
}
