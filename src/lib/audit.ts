import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

type AuditParams = {
  tenantId: string
  userId?: string
  action: string
  resource?: string
  details?: Prisma.JsonValue
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(params: AuditParams) {
  try {
    if (!params.tenantId || params.tenantId === "unknown") {
      console.warn("Audit-Event übersprungen: tenantId fehlt", {
        action: params.action,
        userId: params.userId
      })
      return
    }

    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      }
    })
  } catch (error) {
    console.error("Fehler beim Schreiben des Audit-Logs", {
      action: params.action,
      tenantId: params.tenantId,
      error
    })
  }
}
