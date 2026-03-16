import "server-only"

import { DocumentIntakeStatus, type Prisma } from "@prisma/client"

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
