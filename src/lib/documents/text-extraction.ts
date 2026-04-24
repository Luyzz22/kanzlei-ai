import "server-only"

import { readStoredDocumentFile } from "@/lib/storage/document-storage"

export type ExtractionMode = "txt-direct" | "pdf-text-layer" | "unsupported"

export type ExtractDocumentTextInput = {
  filename: string
  mimeType: string | null
  storageKey: string | null
}

export type ExtractDocumentTextResult = {
  status: "success" | "unsupported" | "failed"
  mode: ExtractionMode
  textPreview: string | null
  errorHint: string | null
}

/**
 * Maximale Zeichen, die im Document.extractedTextPreview gespeichert werden.
 * Bewusst konservativ gewaehlt — der vollstaendige Text bleibt nur in der
 * Analyse-Pipeline und wird nicht persistiert, um Speicher-/PII-Fussabdruck
 * zu minimieren.
 */
const MAX_PREVIEW_CHARS = 16000

/**
 * Minimale Textlaenge, damit wir ueberhaupt von "erfolgreicher Extraktion"
 * sprechen. Unterhalb davon liegt meist ein defektes/gescanntes PDF vor.
 */
const MIN_VIABLE_TEXT_LENGTH = 50

type FileKind = "txt" | "pdf" | "unsupported"

function classifyFile(filename: string, mimeType: string | null): FileKind {
  const normalizedMimeType = mimeType?.toLowerCase() ?? ""
  const lowerFilename = filename.toLowerCase()

  if (normalizedMimeType === "text/plain" || lowerFilename.endsWith(".txt")) {
    return "txt"
  }
  if (normalizedMimeType === "application/pdf" || lowerFilename.endsWith(".pdf")) {
    return "pdf"
  }
  return "unsupported"
}

/**
 * Extrahiert Text aus einem PDF via pdf-parse.
 *
 * Nutzt dasselbe erprobte Muster wie /api/analyze-quick:
 * - Dynamischer Import (pdf-parse haengt auf Cold Start gelegentlich)
 * - Retry bei transienten Fehlern
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const pdfParse = (await import("pdf-parse")).default
      const data = await pdfParse(buffer)
      return data.text
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("pdf-parse failed")
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
  }

  throw lastError ?? new Error("pdf-parse failed without error")
}

export async function extractDocumentText(input: ExtractDocumentTextInput): Promise<ExtractDocumentTextResult> {
  if (!input.storageKey) {
    return {
      status: "failed",
      mode: "unsupported",
      textPreview: null,
      errorHint: "Keine Dateiablage vorhanden"
    }
  }

  const kind = classifyFile(input.filename, input.mimeType)

  if (kind === "unsupported") {
    return {
      status: "unsupported",
      mode: "unsupported",
      textPreview: null,
      errorHint: `Dateiformat ${input.mimeType ?? "unbekannt"} wird nicht unterstuetzt. Erlaubt: PDF (mit Text-Layer) und TXT.`
    }
  }

  let buffer: Buffer
  try {
    buffer = await readStoredDocumentFile(input.storageKey)
  } catch (e) {
    return {
      status: "failed",
      mode: kind === "pdf" ? "pdf-text-layer" : "txt-direct",
      textPreview: null,
      errorHint: `Datei konnte aus der Ablage nicht gelesen werden${e instanceof Error ? `: ${e.message}` : ""}`
    }
  }

  if (kind === "txt") {
    try {
      const text = buffer.toString("utf-8").trim()
      return buildResult(text, "txt-direct")
    } catch (e) {
      return {
        status: "failed",
        mode: "txt-direct",
        textPreview: null,
        errorHint: `TXT-Datei konnte nicht dekodiert werden${e instanceof Error ? `: ${e.message}` : ""}`
      }
    }
  }

  try {
    const rawText = await extractPdfText(buffer)
    const normalized = rawText.trim()

    if (!normalized) {
      return {
        status: "failed",
        mode: "pdf-text-layer",
        textPreview: null,
        errorHint: "Das PDF enthaelt keinen extrahierbaren Text-Layer (moeglicherweise gescannt). Bitte eine OCR-Variante der Datei erneut hochladen."
      }
    }

    return buildResult(normalized, "pdf-text-layer")
  } catch (e) {
    return {
      status: "failed",
      mode: "pdf-text-layer",
      textPreview: null,
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
      errorHint: `Extrahierter Text ist zu kurz (${text.length} Zeichen) fuer eine belastbare Analyse.`
    }
  }

  const textPreview = text.length > MAX_PREVIEW_CHARS ? text.slice(0, MAX_PREVIEW_CHARS) : text

  return {
    status: "success",
    mode,
    textPreview,
    errorHint: null
  }
}
