import "server-only"

import { DocumentProcessingStatus } from "@prisma/client"

import { extractDocumentText } from "@/lib/documents/text-extraction"
import { getWorkspaceDocumentById } from "@/lib/documents/workspace-core"

export type DocumentAnalysisTextResult =
  | {
      ok: true
      text: string
      source: "storage_reextract" | "preview"
      charLength: number
    }
  | {
      ok: false
      code: "NOT_FOUND" | "NOT_PROCESSED" | "NO_TEXT" | "REEXTRACT_FAILED"
      message: string
    }

/**
 * Liefert den vollständigen Vertragstext für die KI-Pipeline.
 *
 * `extractedTextPreview` ist auf 16k Zeichen gekappt (UI/PII).
 * Für belastbare Analysen extrahieren wir bei vorhandener `storageKey`
 * den Text erneut aus der Datei — ohne Preview-Truncation.
 *
 * Fallback: Preview wenn Re-Extraktion fehlschlägt oder keine Datei liegt.
 */
export async function getDocumentTextForAnalysis(
  tenantId: string,
  documentId: string
): Promise<DocumentAnalysisTextResult> {
  const doc = await getWorkspaceDocumentById(tenantId, documentId)
  if (!doc) {
    return { ok: false, code: "NOT_FOUND", message: "Dokument nicht gefunden." }
  }
  if (doc.processingStatus !== DocumentProcessingStatus.VERARBEITET) {
    return {
      ok: false,
      code: "NOT_PROCESSED",
      message: "Dokument ist noch nicht verarbeitet."
    }
  }

  const preview = doc.extractedTextPreview?.trim() ?? ""

  if (doc.storageKey) {
    try {
      const extraction = await extractDocumentText({
        filename: doc.filename,
        mimeType: doc.mimeType,
        storageKey: doc.storageKey
      })

      if (extraction.status === "success" && extraction.fullText?.trim()) {
        const text = extraction.fullText.trim()
        return {
          ok: true,
          text,
          source: "storage_reextract",
          charLength: text.length
        }
      }
    } catch (err) {
      console.warn("[document-analysis-text] Re-Extraktion fehlgeschlagen, Fallback auf Preview:", {
        documentId,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  if (!preview) {
    return { ok: false, code: "NO_TEXT", message: "Kein Text für die Analyse verfügbar." }
  }

  return {
    ok: true,
    text: preview,
    source: "preview",
    charLength: preview.length
  }
}
