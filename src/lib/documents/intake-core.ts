import "server-only"

import { DocumentIntakeStatus, DocumentProcessingStatus, type Prisma } from "@prisma/client"

import { writeAuditEventTx } from "@/lib/audit-write"
import { withTenant } from "@/lib/tenant-context.server"

export type CreateDocumentIntakeInput = {
  tenantId: string
  actorId: string
  title: string
  documentType: string
  organizationName: string
  description?: string
  filename: string
  mimeType?: string
  sizeBytes?: number
}

export type AttachStoredFileInput = {
  tenantId: string
  actorId: string
  documentId: string
  filename: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  sha256: string
}

export type MarkDocumentStorageFailureInput = {
  tenantId: string
  actorId: string
  documentId: string
  errorMessage: string
}

export async function createDocumentIntake(input: CreateDocumentIntakeInput) {
  return withTenant(input.tenantId, async (tx) => {
    const document = await tx.document.create({
      data: {
        tenantId: input.tenantId,
        uploadedById: input.actorId,
        title: input.title,
        documentType: input.documentType,
        organizationName: input.organizationName,
        description: input.description,
        status: DocumentIntakeStatus.EINGEGANGEN,
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.intake.created",
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        title: input.title,
        documentType: input.documentType,
        organizationName: input.organizationName,
        status: DocumentIntakeStatus.EINGEGANGEN,
        hasDateiMetadaten: Boolean(input.mimeType || input.sizeBytes)
      } satisfies Prisma.InputJsonValue
    })

    return document
  })
}

export async function attachStoredFileToDocument(input: AttachStoredFileInput) {
  return withTenant(input.tenantId, async (tx) => {
    const document = await tx.document.update({
      where: {
        id: input.documentId
      },
      data: {
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        sha256: input.sha256,
        processingStatus: DocumentProcessingStatus.AUSSTEHEND,
        processedAt: null,
        processingError: null
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.file.stored",
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        hasStorageKey: true
      } satisfies Prisma.InputJsonValue
    })

    return document
  })
}

export async function markDocumentStorageFailure(input: MarkDocumentStorageFailureInput) {
  return withTenant(input.tenantId, async (tx) => {
    const document = await tx.document.update({
      where: {
        id: input.documentId
      },
      data: {
        processingStatus: DocumentProcessingStatus.FEHLGESCHLAGEN,
        processedAt: new Date(),
        processingError: input.errorMessage
      }
    })

    await writeAuditEventTx(tx, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: "document.file.store_failed",
      resourceType: "document",
      resourceId: document.id,
      documentId: document.id,
      metadata: {
        processingStatus: DocumentProcessingStatus.FEHLGESCHLAGEN,
        reason: input.errorMessage
      } satisfies Prisma.InputJsonValue
    })

    return document
  })
}
