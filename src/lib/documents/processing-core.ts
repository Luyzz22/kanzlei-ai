import "server-only"

import { DocumentProcessingStatus, type Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type DocumentProcessingDetail = {
  processingStatus: DocumentProcessingStatus
  processedAt: Date | null
  processingError: string | null
  extractedTextPreview: string | null
  textExtractedAt: Date | null
}

type PrepareDocumentProcessingInput = {
  tenantId: string
  documentId: string
  actorId?: string
}

export async function prepareDocumentProcessing(
  input: PrepareDocumentProcessingInput
): Promise<DocumentProcessingDetail | null> {
  return withTenant(input.tenantId, async (tx) => {
    const document = await tx.document.findUnique({
      where: { id: input.documentId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        storageKey: true
      }
    })

    if (!document) {
      return null
    }

    const updated = await tx.document.update({
      where: { id: document.id },
      data: {
        processingStatus: DocumentProcessingStatus.AUSSTEHEND,
        processedAt: null,
        processingError: null,
        extractedTextPreview: null,
        textExtractedAt: null
      },
      select: {
        processingStatus: true,
        processedAt: true,
        processingError: true,
        extractedTextPreview: true,
        textExtractedAt: true
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.processing.prepared",
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        filename: document.filename,
        mimeType: document.mimeType,
        hasStorageReference: Boolean(document.storageKey),
        processingStatus: DocumentProcessingStatus.AUSSTEHEND
      } satisfies Prisma.InputJsonValue
    })

    return updated
  })
}

export async function getDocumentProcessingStatus(tenantId: string, documentId: string): Promise<DocumentProcessingDetail | null> {
  return withTenant(tenantId, async (tx) => {
    return tx.document.findUnique({
      where: { id: documentId },
      select: {
        processingStatus: true,
        processedAt: true,
        processingError: true,
        extractedTextPreview: true,
        textExtractedAt: true
      }
    })
  })
}
