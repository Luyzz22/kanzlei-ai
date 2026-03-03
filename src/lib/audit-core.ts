import { Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export type AuditEventInput = {
  tenantId: string
  actorId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  documentId?: string | null
  analysisLogId?: string | null
  ip?: string | null
  userAgent?: string | null
  requestId?: string | null
  metadata?: Prisma.InputJsonValue
}

export async function writeAuditEvent(input: AuditEventInput) {
  const {
    tenantId,
    actorId,
    action,
    resourceType,
    resourceId,
    documentId,
    analysisLogId,
    ip,
    userAgent,
    requestId,
    metadata
  } = input

  if (!tenantId) throw new Error("writeAuditEvent: tenantId is required")
  if (!action) throw new Error("writeAuditEvent: action is required")
  if (!resourceType) throw new Error("writeAuditEvent: resourceType is required")

  return prisma.auditEvent.create({
    data: {
      tenantId,
      actorId: actorId ?? null,
      action,
      resourceType,
      resourceId: resourceId ?? null,
      documentId: documentId ?? null,
      analysisLogId: analysisLogId ?? null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      requestId: requestId ?? null,
      metadata: metadata ?? Prisma.JsonNull
    }
  })
}
