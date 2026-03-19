import "server-only"

import { DocumentProcessingStatus } from "@prisma/client"

export type AnalysisFieldStatus = "erkannt" | "teilweise erkannt" | "nicht eindeutig erkannt"

export type DocumentDateSignal = {
  label: string
  value: string
}

export type ClauseAreaSignal = {
  key: string
  label: string
  status: AnalysisFieldStatus
}

export type DocumentAnalysisView = {
  analysisStatus: AnalysisFieldStatus
  statusHint: string
  inferredDocumentType: {
    value: string
    status: AnalysisFieldStatus
  }
  parties: {
    values: string[]
    status: AnalysisFieldStatus
  }
  reference: {
    value: string | null
    status: AnalysisFieldStatus
  }
  dateSignals: {
    values: DocumentDateSignal[]
    status: AnalysisFieldStatus
  }
  clauseAreas: ClauseAreaSignal[]
  limitations: string[]
}

type BuildDocumentAnalysisInput = {
  title: string
  documentType: string
  organizationName: string
  description: string | null
  processingStatus: DocumentProcessingStatus
  extractedTextPreview: string | null
}

const clauseAreaMatchers: Array<{ key: string; label: string; patterns: RegExp[] }> = [
  {
    key: "laufzeit-kuendigung",
    label: "Laufzeit / Kündigung",
    patterns: [/laufzeit/i, /kündigung/i, /kuendigungsfrist/i, /vertragsdauer/i]
  },
  {
    key: "vertraulichkeit",
    label: "Vertraulichkeit",
    patterns: [/vertraulich/i, /geheimhaltung/i, /nda/i]
  },
  {
    key: "haftung",
    label: "Haftung",
    patterns: [/haftung/i, /schadensersatz/i, /haftungsbeschränkung/i]
  },
  {
    key: "datenschutz",
    label: "Datenschutz / AVV-Kontext",
    patterns: [/datenschutz/i, /dsgvo/i, /auftragsverarbeitung/i, /avv/i]
  },
  {
    key: "verguetung",
    label: "Vergütung / Leistungsbeschreibung",
    patterns: [/vergütung/i, /verguetung/i, /honorar/i, /leistung/i, /leistungsumfang/i]
  }
]

function cleanupSignal(value: string): string {
  return value.replace(/[\s\t]+/g, " ").trim()
}

function extractParties(text: string): string[] {
  const found = new Set<string>()
  const rolePattern = /(Auftraggeber|Auftragnehmer|Vermieter|Mieter|Arbeitgeber|Arbeitnehmer)\s*:?\s*([^\n,;]+)/gi
  let roleMatch = rolePattern.exec(text)

  while (roleMatch) {
    const normalized = cleanupSignal(roleMatch[2] ?? "")
    if (normalized.length > 1) {
      found.add(`${roleMatch[1]}: ${normalized}`)
    }
    roleMatch = rolePattern.exec(text)
  }

  const betweenPattern = /zwischen\s+([^\n]+?)\s+und\s+([^\n.,;]+)/i
  const betweenMatch = betweenPattern.exec(text)
  if (betweenMatch) {
    const left = cleanupSignal(betweenMatch[1] ?? "")
    const right = cleanupSignal(betweenMatch[2] ?? "")
    if (left) found.add(`Partei A: ${left}`)
    if (right) found.add(`Partei B: ${right}`)
  }

  return Array.from(found).slice(0, 4)
}

function extractReference(text: string): string | null {
  const referencePattern = /(Aktenzeichen|Vertragsnummer|Referenz|Vorgangsnummer)\s*:?\s*([A-Za-z0-9\-\/_.]+)/i
  const match = referencePattern.exec(text)
  if (!match?.[2]) {
    return null
  }

  return cleanupSignal(match[2])
}

function extractDateSignals(text: string): DocumentDateSignal[] {
  const dates: DocumentDateSignal[] = []
  const seen = new Set<string>()
  const patterns: Array<{ label: string; regex: RegExp }> = [
    { label: "Unterzeichnung", regex: /unterzeichnet(?: am)?\s*:?\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/i },
    { label: "Laufzeitbeginn", regex: /(?:laufzeitbeginn|beginn(?: der laufzeit)?)\s*:?\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/i },
    { label: "Frist", regex: /frist(?: bis|ende)?\s*:?\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/i }
  ]

  for (const pattern of patterns) {
    const match = pattern.regex.exec(text)
    const value = cleanupSignal(match?.[1] ?? "")
    if (value && !seen.has(`${pattern.label}:${value}`)) {
      seen.add(`${pattern.label}:${value}`)
      dates.push({ label: pattern.label, value })
    }
  }

  return dates
}

function inferDocumentType(input: BuildDocumentAnalysisInput, text: string): string {
  const source = `${input.documentType} ${input.title} ${text}`.toLowerCase()
  if (source.includes("arbeitsvertrag")) return "Arbeitsvertrag"
  if (source.includes("mietvertrag")) return "Mietvertrag"
  if (source.includes("auftragsverarbeitung") || source.includes("avv")) return "Auftragsverarbeitungsvertrag"
  if (source.includes("dienstvertrag")) return "Dienstvertrag"
  if (source.includes("vertrag")) return "Vertrag"
  return input.documentType
}

function resolveAnalysisStatus(input: BuildDocumentAnalysisInput): { status: AnalysisFieldStatus; hint: string } {
  if (input.processingStatus !== DocumentProcessingStatus.VERARBEITET || !input.extractedTextPreview) {
    return {
      status: "nicht eindeutig erkannt",
      hint: "Die strukturierte Analyse ist erst nach erfolgreicher Textextraktion verfügbar."
    }
  }

  return {
    status: "teilweise erkannt",
    hint: "Die Analyse basiert auf einem begrenzten Textauszug und dient als read-only Orientierung."
  }
}

export function buildDocumentAnalysisView(input: BuildDocumentAnalysisInput): DocumentAnalysisView {
  const text = input.extractedTextPreview ?? ""
  const analysisState = resolveAnalysisStatus(input)

  if (!text) {
    return {
      analysisStatus: analysisState.status,
      statusHint: analysisState.hint,
      inferredDocumentType: {
        value: input.documentType,
        status: "nicht eindeutig erkannt"
      },
      parties: {
        values: [],
        status: "nicht eindeutig erkannt"
      },
      reference: {
        value: null,
        status: "nicht eindeutig erkannt"
      },
      dateSignals: {
        values: [],
        status: "nicht eindeutig erkannt"
      },
      clauseAreas: clauseAreaMatchers.map((entry) => ({
        key: entry.key,
        label: entry.label,
        status: "nicht eindeutig erkannt"
      })),
      limitations: [
        "Für dieses Dokument liegt derzeit noch keine belastbare Textgrundlage vor.",
        "Die strukturierte Analyse zeigt erst nach erfolgreicher Textextraktion belastbare Felder."
      ]
    }
  }

  const inferredType = inferDocumentType(input, text)
  const parties = extractParties(text)
  const reference = extractReference(text)
  const dates = extractDateSignals(text)

  const clauseAreas = clauseAreaMatchers.map((entry) => {
    const matches = entry.patterns.filter((pattern) => pattern.test(text)).length

    if (matches >= 2) {
      return { key: entry.key, label: entry.label, status: "erkannt" as AnalysisFieldStatus }
    }

    if (matches === 1) {
      return { key: entry.key, label: entry.label, status: "teilweise erkannt" as AnalysisFieldStatus }
    }

    return { key: entry.key, label: entry.label, status: "nicht eindeutig erkannt" as AnalysisFieldStatus }
  })

  return {
    analysisStatus: analysisState.status,
    statusHint: analysisState.hint,
    inferredDocumentType: {
      value: inferredType,
      status: inferredType ? "teilweise erkannt" : "nicht eindeutig erkannt"
    },
    parties: {
      values: parties,
      status: parties.length ? "teilweise erkannt" : "nicht eindeutig erkannt"
    },
    reference: {
      value: reference,
      status: reference ? "teilweise erkannt" : "nicht eindeutig erkannt"
    },
    dateSignals: {
      values: dates,
      status: dates.length ? "teilweise erkannt" : "nicht eindeutig erkannt"
    },
    clauseAreas,
    limitations: [
      "Die Analyse ist heuristisch und ersetzt keine juristische Prüfung.",
      "Nicht erkannte Felder bedeuten nicht, dass entsprechende Inhalte im Dokument fehlen."
    ]
  }
}
