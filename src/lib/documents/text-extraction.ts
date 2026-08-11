import "server-only"

import { readStoredDocumentFile } from "@/lib/storage/document-storage"

export type ExtractionMode =
  | "txt-direct"
  | "pdf-text-layer"
  | "docx-mammoth"
  | "unsupported"

export type ExtractDocumentTextInput = {
  filename: string
  mimeType: string | null
  storageKey: string | null
  /** Optional: when provided, OCR eligibility is validated against Tenant AI Governance. */
  tenantId?: string
}

export type ExtractDocumentTextResult = {
  status: "success" | "unsupported" | "failed"
  mode: ExtractionMode
  /** Gekürzte Vorschau für UI/DB (max MAX_PREVIEW_CHARS). */
  textPreview: string | null
  /** Vollständiger extrahierter Text — nur im Prozess/RAM, nicht in DB persistiert. */
  fullText: string | null
  errorHint: string | null
}

/**
 * Maximale Zeichen, die im Document.extractedTextPreview gespeichert werden.
 * Gross genug für eine belastbare KI-Vertragsanalyse, klein genug,
 * um Speicher-/PII-Fussabdruck zu minimieren.
 */
const MAX_PREVIEW_CHARS = 16000

/**
 * Minimale Textlaenge, damit wir ueberhaupt von "erfolgreicher Extraktion"
 * sprechen. Unterhalb davon liegt meist ein defektes oder unbrauchbares
 * Dokument vor.
 */
const MIN_VIABLE_TEXT_LENGTH = 50

type FileKind = "txt" | "pdf" | "docx" | "unsupported"

function classifyFile(filename: string, mimeType: string | null): FileKind {
  const normalizedMimeType = mimeType?.toLowerCase() ?? ""
  const lowerFilename = filename.toLowerCase()

  if (normalizedMimeType === "text/plain" || lowerFilename.endsWith(".txt")) {
    return "txt"
  }
  if (normalizedMimeType === "application/pdf" || lowerFilename.endsWith(".pdf")) {
    return "pdf"
  }
  if (
    normalizedMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerFilename.endsWith(".docx")
  ) {
    return "docx"
  }
  return "unsupported"
}

/**
 * PDF-Text-Layer-Extraktion via unpdf.
 *
 * Ersetzt pdf-parse (v1.1.1 nutzt veraltetes pdfjs v1.10.100 das auf
 * Vercel Serverless mit "bad XRef entry" Fehlern abstuerzt).
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf")
  const uint8 = new Uint8Array(buffer)
  const result = await extractText(uint8)
  return Array.isArray(result.text) ? result.text.join("\n") : String(result.text)
}

/**
 * DOCX-Extraktion via mammoth (Microsoft-Word-XML -> reiner Text).
 *
 * Mammoth ist die Industrie-Standardwahl für DOCX-Extraktion in
 * Node-Serverless-Umgebungen: kein nativer Code, keine System-Deps,
 * robuste Fehlerbehandlung.
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  // Dynamischer Import, damit mammoth auf dem Cold-Start-Pfad
  // anderer Routes nicht im Bundle landet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammothModule: any = await import("mammoth")
  const mammoth = mammothModule.default ?? mammothModule

  // mammoth.extractRawText liefert reinen Text ohne Formatierung.
  // Exakt das, was wir für die Analyse-Pipeline brauchen.
  const result: { value: string; messages: Array<{ type: string; message: string }> } =
    await mammoth.extractRawText({ buffer })

  return result.value
}

export async function extractDocumentText(input: ExtractDocumentTextInput): Promise<ExtractDocumentTextResult> {
  if (!input.storageKey) {
    return {
      status: "failed",
      mode: "unsupported",
      textPreview: null,
      fullText: null,
      errorHint: "Keine Dateiablage vorhanden"
    }
  }

  const kind = classifyFile(input.filename, input.mimeType)

  if (kind === "unsupported") {
    return {
      status: "unsupported",
      mode: "unsupported",
      textPreview: null,
      fullText: null,
      errorHint: `Dateiformat ${input.mimeType ?? "unbekannt"} wird nicht unterstützt. Erlaubt: PDF, DOCX und TXT.`
    }
  }

  let buffer: Buffer
  try {
    buffer = await readStoredDocumentFile(input.storageKey)
  } catch (e) {
    return {
      status: "failed",
      mode: kind === "pdf" ? "pdf-text-layer" : kind === "docx" ? "docx-mammoth" : "txt-direct",
      textPreview: null,
      fullText: null,
      errorHint: `Datei konnte aus der Ablage nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
    }
  }

  // TXT: direktes Decodieren
  if (kind === "txt") {
    try {
      const text = buffer.toString("utf-8").trim()
      return buildResult(text, "txt-direct")
    } catch (e) {
      return {
        status: "failed",
        mode: "txt-direct",
        textPreview: null,
      fullText: null,
        errorHint: `TXT-Datei konnte nicht dekodiert werden${e instanceof Error ? `: ${e.message}` : ""}`
      }
    }
  }

  // DOCX: Mammoth-Extraktion
  if (kind === "docx") {
    try {
      const raw = await extractDocxText(buffer)
      const normalized = raw.trim()
      if (!normalized) {
        return {
          status: "failed",
          mode: "docx-mammoth",
          textPreview: null,
      fullText: null,
          errorHint: "DOCX enthaelt keinen extrahierbaren Text (möglicherweise nur eingebettete Bilder)."
        }
      }
      return buildResult(normalized, "docx-mammoth")
    } catch (e) {
      return {
        status: "failed",
        mode: "docx-mammoth",
        textPreview: null,
      fullText: null,
        errorHint: `DOCX konnte nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
      }
    }
  }

  // PDF: erst Text-Layer-Extraktion, dann OCR-Fallback
  try {
    const rawText = await extractPdfText(buffer)
    const normalized = rawText.trim()

    if (normalized) {
      return buildResult(normalized, "pdf-text-layer")
    }

    // Text-Layer leer. Ein Cloud-OCR-Fallback existiert nicht mehr: OCR läuft
    // bei der Ingestion, also VOR jeder Klassifikation — ein Dokument ginge
    // damit an einen externen Anbieter, bevor überhaupt feststeht, ob es
    // mandatsbezogen ist. Bis lokales OCR in der souveränen Zone bereitsteht,
    // wird hier abgelehnt statt ausgelagert (ADR-0001, fail closed).
    return {
      status: "failed",
      mode: "pdf-text-layer",
      textPreview: null,
      fullText: null,
      errorHint:
        "Das PDF enthaelt keinen extrahierbaren Text-Layer (möglicherweise gescannt). Bitte eine OCR-Variante der Datei erneut hochladen."
    }
  } catch (e) {
    return {
      status: "failed",
      mode: "pdf-text-layer",
      textPreview: null,
      fullText: null,
      errorHint: `PDF konnte nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
    }
  }
}

function buildResult(text: string, mode: ExtractionMode): ExtractDocumentTextResult {
  if (text.length < MIN_VIABLE_TEXT_LENGTH) {
    return {
      status: "failed",
      mode,
      textPreview: null,
      fullText: null,
      errorHint: `Extrahierter Text ist zu kurz (${text.length} Zeichen) für eine belastbare Analyse.`
    }
  }

  const textPreview = text.length > MAX_PREVIEW_CHARS ? text.slice(0, MAX_PREVIEW_CHARS) : text

  return {
    status: "success",
    mode,
    textPreview,
    fullText: text,
    errorHint: null
  }
}
