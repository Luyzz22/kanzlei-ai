import "server-only"

import { DocumentIntakeStatus } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context.server"

export type WorkspaceDocumentStatusTone = "warning" | "info" | "success" | "neutral"

export type WorkspaceDocumentItem = {
  id: string
  title: string
  documentType: string
  organizationName: string
  status: DocumentIntakeStatus
  uploadedByLabel: string
  createdAt: Date
  reviewContext: string
}

export type WorkspaceDocumentDetail = WorkspaceDocumentItem & {
  description: string | null
  filename: string
  mimeType: string | null
  sizeBytes: number | null
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
        description: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
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
      description: document.description,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      createdAt: document.createdAt,
      uploadedByLabel: document.uploadedBy?.name ?? document.uploadedBy?.email ?? "Nicht zugeordnet",
      reviewContext: statusToReviewContext[document.status]
    }
  })
}
