import "server-only"

import { withTenant } from "@/lib/tenant-context.server"
import { getStoredDocumentStats, readStoredDocumentFile } from "@/lib/storage/document-storage"

export type DocumentPreviewMode = "txt" | "pdf" | "office" | "none"

export type DocumentFileAccessContext = {
  documentId: string
  filename: string
  mimeType: string | null
  sizeBytes: number | null
  storageKey: string | null
  hasStorageReference: boolean
  fileAvailable: boolean
  previewMode: DocumentPreviewMode
}

function inferPreviewMode(filename: string, mimeType: string | null): DocumentPreviewMode {
  const lowerFilename = filename.toLowerCase()
  const normalizedMime = mimeType?.toLowerCase() ?? null

  if (normalizedMime === "text/plain" || lowerFilename.endsWith(".txt")) {
    return "txt"
  }

  if (normalizedMime === "application/pdf" || lowerFilename.endsWith(".pdf")) {
    return "pdf"
  }

  if (
    normalizedMime === "application/msword" ||
    normalizedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerFilename.endsWith(".doc") ||
    lowerFilename.endsWith(".docx")
  ) {
    return "office"
  }

  return "none"
}

export async function getDocumentFileAccessContext(
  tenantId: string,
  documentId: string
): Promise<DocumentFileAccessContext | null> {
  const document = await withTenant(tenantId, async (tx) => {
    return tx.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        storageKey: true
      }
    })
  })

  if (!document) {
    return null
  }

  const hasStorageReference = Boolean(document.storageKey)
  const storageStats = document.storageKey ? await getStoredDocumentStats(document.storageKey) : null

  return {
    documentId: document.id,
    filename: document.filename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes ?? storageStats?.sizeBytes ?? null,
    storageKey: document.storageKey,
    hasStorageReference,
    fileAvailable: Boolean(storageStats),
    previewMode: inferPreviewMode(document.filename, document.mimeType)
  }
}

export async function readDocumentTxtPreviewByStorageKey(
  storageKey: string,
  maxChars = 4000
): Promise<string | null> {
  try {
    const raw = await readStoredDocumentFile(storageKey)
    return raw.toString("utf-8", 0, maxChars).trim()
  } catch {
    return null
  }
}
