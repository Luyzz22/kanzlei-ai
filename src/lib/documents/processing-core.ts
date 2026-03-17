import "server-only"

import { DocumentProcessingStatus, type Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

import { extractDocumentText } from "./text-extraction"

export type DocumentProcessingDetail = {
  processingStatus: DocumentProcessingStatus
  processedAt: Date | null
  processingError: string | null
  extractedTextPreview: string | null
  textExtractedAt: Date | null
}

type ProcessDocumentForExtractionInput = {
  tenantId: string
  documentId: string
  actorId?: string
}

export async function processDocumentForExtraction(input: ProcessDocumentForExtractionInput): Promise<DocumentProcessingDetail | null> {
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
        processingStatus: DocumentProcessingStatus.AUSSTEHEND
      } satisfies Prisma.InputJsonValue
    })

    const extraction = await extractDocumentText({
      filename: document.filename,
      mimeType: document.mimeType,
      storageKey: document.storageKey
    })

    const processedAt = new Date()

    if (extraction.status === "unsupported") {
      const updated = await tx.document.update({
        where: { id: document.id },
        data: {
          processingStatus: DocumentProcessingStatus.NICHT_UNTERSTUETZT,
          processedAt,
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
          filename: document.filename,
          mimeType: document.mimeType,
          extractionMode: extraction.mode,
          processingStatus: DocumentProcessingStatus.NICHT_UNTERSTUETZT,
          errorHint: extraction.errorHint
        } satisfies Prisma.InputJsonValue
      })

      return updated
    }

    if (extraction.status === "failed") {
      const updated = await tx.document.update({
        where: { id: document.id },
        data: {
          processingStatus: DocumentProcessingStatus.FEHLGESCHLAGEN,
          processedAt,
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
        action: "document.processing.failed",
        resourceType: "document",
        resourceId: document.id,
        documentId: document.id,
        metadata: {
          filename: document.filename,
          mimeType: document.mimeType,
          extractionMode: extraction.mode,
          processingStatus: DocumentProcessingStatus.FEHLGESCHLAGEN,
          errorHint: extraction.errorHint
        } satisfies Prisma.InputJsonValue
      })

      return updated
    }

    const textExtractedAt = new Date()

    const updated = await tx.document.update({
      where: { id: document.id },
      data: {
        processingStatus: DocumentProcessingStatus.VERARBEITET,
        processedAt,
        processingError: null,
        extractedTextPreview: extraction.textPreview,
        textExtractedAt
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
        filename: document.filename,
        mimeType: document.mimeType,
        extractionMode: extraction.mode,
        processingStatus: DocumentProcessingStatus.VERARBEITET,
        textLength: extraction.textPreview?.length ?? 0
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
