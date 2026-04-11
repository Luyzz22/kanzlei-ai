import { AnalysisType } from "@/types/ai"

interface PromptOptions {
  language?: "de" | "en" | "auto"
  documentText: string
  context?: string
}

const languageInstructions = {
  de: "Antworte vollständig auf Deutsch und nutze juristisch präzise Terminologie für den DACH-Raum.",
  en: "Respond in English using precise legal terminology and clear structure.",
  auto: "Erkenne die Sprache des Vertrags automatisch. Antworte in der Sprache des Vertrags. Bei englischen Verträgen nutze englische Rechtsterminologie, bei deutschen Verträgen deutsche Rechtsterminologie nach DACH-Standard."
}

const contractJsonSchema = JSON.stringify(
  {
    type: "object",
    properties: {
      analysisType: { type: "string", enum: ["contract"] },
      detectedLanguage: { type: "string", enum: ["de", "en", "other"], description: "Detected language of the contract document" },
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
          "Verlängerungszeitraum": { type: "string" },
          "Vertragsbeginn": { type: "string" },
          "Vertragsende": { type: "string" },
          "SLA Uptime (%)": { type: "number" },
          "Support-Level": { type: "string" },
          Datenlokation: { type: "string" },
          "AVV vorhanden": { type: "boolean" },
          Haftungsgrenze: { type: "string" },
          "Datenexport-Klausel": { type: "boolean" },
          "Gerichtsstand": { type: "string" },
          "Anwendbares Recht": { type: "string" },
          "Geheimhaltungspflicht": { type: "boolean" },
          "Vertragsstrafe": { type: "string" },
          "IP-Rechte": { type: "string" }
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
            quote: { type: "string", description: "Exaktes Zitat der relevanten Vertragsklausel" },
            suggestedRevision: { type: "string", description: "Konkreter Formulierungsvorschlag zur Risikominimierung. Formuliere eine alternative Klausel die das identifizierte Risiko adressiert." }
          },
          required: ["title", "severity", "explanation"]
        }
      },
      recommendedActions: {
        type: "array",
        items: { type: "string" },
        description: "Konkrete Handlungsempfehlungen"
      },
      deadlines: {
        type: "object",
        description: "Alle vertraglichen Fristen und Termine",
        properties: {
          noticePeriodDays: { type: "number", description: "Kündigungsfrist in Tagen" },
          autoRenewal: { type: "boolean", description: "Automatische Verlängerung vorhanden" },
          renewalTermMonths: { type: "number", description: "Verlängerungszeitraum in Monaten" },
          contractStartDate: { type: "string", description: "Vertragsbeginn (ISO oder Freitext)" },
          contractEndDate: { type: "string", description: "Vertragsende (ISO oder Freitext)" },
          nextCancellationDate: { type: "string", description: "Nächstmöglicher Kündigungstermin" },
          warrantyPeriodMonths: { type: "number", description: "Gewährleistungsfrist in Monaten" }
        }
      }
    },
    required: ["analysisType", "summary", "riskScore", "extractedData", "findings", "recommendedActions", "deadlines"]
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
  const language = options.language ?? "auto"
  return `Du bist ein Enterprise-KI-System für juristische Vertragsanalyse, entwickelt für Kanzleien, Rechtsabteilungen und Einkaufsabteilungen. ${languageInstructions[language]}

AUFGABE: Analysiere den folgenden Vertrag systematisch und gründlich.

ANALYSE-SCHWERPUNKTE:
1. Extrahiere alle strukturierten Vertragsdaten (Parteien, Konditionen, Laufzeiten, SLA, Gerichtsstand, anwendbares Recht)
2. Bewerte das Gesamtrisiko auf einer Skala von 0-100
3. Identifiziere konkrete Risiken mit Schweregrad und Zitat der betreffenden Klausel
4. Für jedes Risiko mit Severity "hoch": Formuliere einen konkreten Formulierungsvorschlag (suggestedRevision) der das Risiko adressiert
5. Prüfe auf DSGVO/GDPR-Konformität, fehlende AVV/DPA, Datenlokation
6. Bewerte Kündigungsfristen, Auto-Renewal, Haftungsbeschränkungen, Vertragsstrafen
7. Extrahiere alle Fristen und Termine in das "deadlines"-Objekt (Kündigungsfrist, Auto-Renewal, Vertragsbeginn/-ende, nächster Kündigungstermin)
8. Formuliere konkrete, umsetzbare Handlungsempfehlungen

BESONDERE PRÜFPUNKTE FÜR EINKAUF & BESCHAFFUNG:
- Limitation of Liability / Haftungsbeschränkungen zuungunsten des Auftraggebers
- Indemnification / Freistellungsklauseln
- IP-Rechte und Eigentum an Arbeitsergebnissen
- Gerichtsstand und anwendbares Recht (insb. bei internationalen Verträgen)
- Einseitige Änderungsvorbehalte des Lieferanten
- Preisanpassungsklauseln ohne Obergrenze
- Automatische Verlängerung mit langer Kündigungsfrist
- Fehlende oder eingeschränkte Gewährleistung
- Non-Compete oder Exklusivitätsklauseln

Kontext: ${options.context ?? "Standardanalyse"}

VERTRAGSDOKUMENT:
${options.documentText}

WICHTIG: Antworte ausschließlich mit einem validen JSON-Objekt (kein Markdown, keine Code-Fences). Schema:
${contractJsonSchema}`
}

export function documentSummaryPrompt(options: PromptOptions): string {
  const language = options.language ?? "de"
  const lang = language === "auto" ? "de" : language
  return `Du bist ein KI-Assistent für juristische Zusammenfassungen. ${languageInstructions[lang]}

Fasse das Dokument prägnant zusammen und nenne die wichtigsten Kernpunkte.
Dokument:\n${options.documentText}

Ausgabeformat (JSON-Schema):\n${baseJsonSchema(AnalysisType.SUMMARY)}`
}

export function clauseExtractionPrompt(options: PromptOptions): string {
  const language = options.language === "auto" ? "de" : (options.language ?? "de")
  return `Du bist ein KI-System für Klauselextraktion. ${languageInstructions[language]}

Extrahiere alle wesentlichen Klauseln aus dem Vertrag und kategorisiere sie.
Dokument:\n${options.documentText}

Ausgabeformat (JSON-Schema):\n${baseJsonSchema(AnalysisType.CLAUSE)}`
}

export function riskAssessmentPrompt(options: PromptOptions): string {
  const language = options.language === "auto" ? "de" : (options.language ?? "de")
  return `Du bist ein KI-System für Risikobewertung von Verträgen. ${languageInstructions[language]}

Bewerte die Risiken im folgenden Vertrag systematisch.
Dokument:\n${options.documentText}

Ausgabeformat (JSON-Schema):\n${baseJsonSchema(AnalysisType.RISK)}`
}
