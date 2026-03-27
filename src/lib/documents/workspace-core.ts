import "server-only"

import { DocumentIntakeStatus, DocumentProcessingStatus } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context.server"

export type WorkspaceDocumentStatusTone = "warning" | "info" | "success" | "neutral" | "risk"

export type WorkspaceDocumentItem = {
  id: string
  title: string
  documentType: string
  organizationName: string
  status: DocumentIntakeStatus
  processingStatus: DocumentProcessingStatus
  uploadedByLabel: string
  createdAt: Date
  reviewContext: string
}

export type WorkspaceDocumentDetail = WorkspaceDocumentItem & {
  description: string | null
  filename: string
  mimeType: string | null
  sizeBytes: number | null
  sha256: string | null
  storageKey: string | null
  processedAt: Date | null
  processingError: string | null
  extractedTextPreview: string | null
  textExtractedAt: Date | null
}

const statusToReviewContext: Record<DocumentIntakeStatus, string> = {
  EINGEGANGEN: "Eingang dokumentiert, Erstprüfung ausstehend.",
  IN_PRUEFUNG: "Juristische Prüfung aktiv.",
  FREIGEGEBEN: "Prüfung abgeschlossen, zur Nutzung freigegeben.",
  ARCHIVIERT: "Abgeschlossen und archiviert."
}

export function getWorkspaceDocumentStatusLabel(status: DocumentIntakeStatus): string {
  if (status === DocumentIntakeStatus.EINGEGANGEN) return "Eingegangen"
  if (status === DocumentIntakeStatus.IN_PRUEFUNG) return "In Prüfung"
  if (status === DocumentIntakeStatus.FREIGEGEBEN) return "Freigegeben"
  return "Archiviert"
}

export function getWorkspaceDocumentStatusTone(status: DocumentIntakeStatus): WorkspaceDocumentStatusTone {
  if (status === DocumentIntakeStatus.EINGEGANGEN) return "warning"
  if (status === DocumentIntakeStatus.IN_PRUEFUNG) return "info"
  if (status === DocumentIntakeStatus.FREIGEGEBEN) return "success"
  return "neutral"
}

export function getDocumentProcessingStatusLabel(status: DocumentProcessingStatus): string {
  if (status === DocumentProcessingStatus.AUSSTEHEND) return "Vorbereitet"
  if (status === DocumentProcessingStatus.VERARBEITET) return "Verarbeitet"
  if (status === DocumentProcessingStatus.NICHT_UNTERSTUETZT) return "Nicht unterstützt"
  return "Fehlgeschlagen"
}

export function getDocumentProcessingStatusTone(status: DocumentProcessingStatus): WorkspaceDocumentStatusTone {
  if (status === DocumentProcessingStatus.AUSSTEHEND) return "warning"
  if (status === DocumentProcessingStatus.VERARBEITET) return "success"
  if (status === DocumentProcessingStatus.NICHT_UNTERSTUETZT) return "neutral"
  return "risk"
}

export async function listWorkspaceDocuments(tenantId: string): Promise<WorkspaceDocumentItem[]> {
  return withTenant(tenantId, async (tx) => {
    const documents = await tx.document.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        documentType: true,
        organizationName: true,
        status: true,
        processingStatus: true,
        createdAt: true,
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return documents.map((document) => ({
      id: document.id,
      title: document.title,
      documentType: document.documentType,
      organizationName: document.organizationName,
      status: document.status,
      processingStatus: document.processingStatus,
      uploadedByLabel: document.uploadedBy?.name ?? document.uploadedBy?.email ?? "Nicht zugeordnet",
      createdAt: document.createdAt,
      reviewContext: statusToReviewContext[document.status]
    }))
  })
}

export async function getWorkspaceDocumentById(tenantId: string, documentId: string): Promise<WorkspaceDocumentDetail | null> {
  return withTenant(tenantId, async (tx) => {
    const document = await tx.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        documentType: true,
        organizationName: true,
        status: true,
        processingStatus: true,
        description: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        sha256: true,
        storageKey: true,
        processedAt: true,
        processingError: true,
        extractedTextPreview: true,
        textExtractedAt: true,
        createdAt: true,
        uploadedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!document) {
      return null
    }

    return {
      id: document.id,
      title: document.title,
      documentType: document.documentType,
      organizationName: document.organizationName,
      status: document.status,
      processingStatus: document.processingStatus,
      description: document.description,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sha256: document.sha256,
      storageKey: document.storageKey,
      processedAt: document.processedAt,
      processingError: document.processingError,
      extractedTextPreview: document.extractedTextPreview,
      textExtractedAt: document.textExtractedAt,
      createdAt: document.createdAt,
      uploadedByLabel: document.uploadedBy?.name ?? document.uploadedBy?.email ?? "Nicht zugeordnet",
      reviewContext: statusToReviewContext[document.status]
    }
  })
}
