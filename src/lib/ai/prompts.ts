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
              explanation: { type: "string" }
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
  return `Du bist ein KI-System für Vertragsanalyse. ${languageInstructions[language]}

Analysiere den folgenden Vertrag auf Risiken, Unklarheiten, fehlende Klauseln und DSGVO/Compliance-Aspekte.
Kontext: ${options.context ?? "Kein Zusatzkontext"}

Dokument:\n${options.documentText}

Gib das Ergebnis ausschließlich als JSON gemäß Schema zurück:\n${baseJsonSchema(AnalysisType.CONTRACT)}`
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
