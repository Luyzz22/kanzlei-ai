import { Prisma, type PrismaClient } from "@prisma/client"

import { computeEventHash, type AuditHashPayload } from "@/lib/audit-hash"

export type AuditEventTxInput = {
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

type AuditTx = PrismaClient | Prisma.TransactionClient

export async function writeAuditEventTx(tx: AuditTx, input: AuditEventTxInput) {
  const now = new Date()

  const last = await tx.auditEvent.findFirst({
    where: { tenantId: input.tenantId, eventHash: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { eventHash: true }
  })

  const prevHash = last?.eventHash ?? null

  const payload: AuditHashPayload = {
    tenantId: input.tenantId,
    actorId: input.actorId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    documentId: input.documentId ?? null,
    analysisLogId: input.analysisLogId ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    requestId: input.requestId ?? null,
    createdAtIso: now.toISOString(),
    metadata: input.metadata ?? null
  }

  const eventHash = computeEventHash(prevHash, payload)

  return tx.auditEvent.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      documentId: input.documentId ?? null,
      analysisLogId: input.analysisLogId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      metadata: input.metadata ?? Prisma.JsonNull,
      createdAt: now,
      prevHash,
      eventHash
    }
  })
}
