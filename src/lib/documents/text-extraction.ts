import "server-only"

import { readStoredDocumentFile } from "@/lib/storage/document-storage"

export type ExtractionMode = "txt-direct" | "unsupported"

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

const MAX_PREVIEW_CHARS = 4000

function isTxtDocument(filename: string, mimeType: string | null): boolean {
  const normalizedMimeType = mimeType?.toLowerCase() ?? null
  const lowerFilename = filename.toLowerCase()

  return normalizedMimeType === "text/plain" || lowerFilename.endsWith(".txt")
}

export async function extractDocumentText(input: ExtractDocumentTextInput): Promise<ExtractDocumentTextResult> {
  if (!input.storageKey) {
    return {
      status: "failed",
      mode: "txt-direct",
      textPreview: null,
      errorHint: "Keine Dateiablage vorhanden"
    }
  }

  if (!isTxtDocument(input.filename, input.mimeType)) {
    return {
      status: "unsupported",
      mode: "unsupported",
      textPreview: null,
      errorHint: "Dateiformat derzeit nicht unterstützt"
    }
  }

  try {
    const buffer = await readStoredDocumentFile(input.storageKey)
    const textPreview = buffer.toString("utf-8", 0, MAX_PREVIEW_CHARS).trim()

    if (!textPreview) {
      return {
        status: "failed",
        mode: "txt-direct",
        textPreview: null,
        errorHint: "Kein extrahierbarer Textinhalt verfügbar"
      }
    }

    return {
      status: "success",
      mode: "txt-direct",
      textPreview,
      errorHint: null
    }
  } catch {
    return {
      status: "failed",
      mode: "txt-direct",
      textPreview: null,
      errorHint: "Datei konnte nicht gelesen werden"
    }
  }
}
