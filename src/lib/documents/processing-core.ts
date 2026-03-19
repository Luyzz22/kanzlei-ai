import "server-only"

import { DocumentProcessingStatus, type Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { extractDocumentText } from "@/lib/documents/text-extraction"
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

type ProcessDocumentExtractionInput = {
  tenantId: string
  documentId: string
  actorId?: string
}

export async function processDocumentExtraction(
  input: ProcessDocumentExtractionInput
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

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.processing.started",
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        filename: document.filename,
        mimeType: document.mimeType,
        hasStorageReference: Boolean(document.storageKey)
      } satisfies Prisma.InputJsonValue
    })

    const extraction = await extractDocumentText({
      filename: document.filename,
      mimeType: document.mimeType,
      storageKey: document.storageKey
    })

    if (extraction.status === "success") {
      const updated = await tx.document.update({
        where: { id: document.id },
        data: {
          processingStatus: DocumentProcessingStatus.VERARBEITET,
          processedAt: new Date(),
          processingError: null,
          extractedTextPreview: extraction.textPreview,
          textExtractedAt: new Date()
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
        action: "document.processing.completed",
        resourceType: "document",
        resourceId: document.id,
        documentId: document.id,
        metadata: {
          extractionMode: extraction.mode,
          previewLength: extraction.textPreview?.length ?? 0,
          mimeType: document.mimeType
        } satisfies Prisma.InputJsonValue
      })

      return updated
    }

    if (extraction.status === "unsupported") {
      const updated = await tx.document.update({
        where: { id: document.id },
        data: {
          processingStatus: DocumentProcessingStatus.NICHT_UNTERSTUETZT,
          processedAt: new Date(),
          processingError: extraction.errorHint,
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
        action: "document.processing.unsupported",
        resourceType: "document",
        resourceId: document.id,
        documentId: document.id,
        metadata: {
          extractionMode: extraction.mode,
          reason: extraction.errorHint,
          mimeType: document.mimeType
        } satisfies Prisma.InputJsonValue
      })

      return updated
    }

    const updated = await tx.document.update({
      where: { id: document.id },
      data: {
        processingStatus: DocumentProcessingStatus.FEHLGESCHLAGEN,
        processedAt: new Date(),
        processingError: extraction.errorHint ?? "Die Dokumentverarbeitung konnte nicht abgeschlossen werden.",
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
      action: "document.processing.failed",
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        extractionMode: extraction.mode,
        reason: extraction.errorHint,
        mimeType: document.mimeType
      } satisfies Prisma.InputJsonValue
    })

    return updated
  })
}
