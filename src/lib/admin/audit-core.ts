import { type Prisma } from "@prisma/client"

import { withTenant } from "@/lib/tenant-context-core"

export type AuditListArgs = {
  action?: string
  actorId?: string
  resourceType?: string
  resourceId?: string
  requestId?: string
  from?: string
  to?: string
  limit?: number
  cursor?: string
}

export async function listAuditEvents(tenantId: string, args: AuditListArgs) {
  const {
    action,
    actorId,
    resourceType,
    resourceId,
    requestId,
    from,
    to,
    limit = 50,
    cursor
  } = args

  const where: Prisma.AuditEventWhereInput = {}
  if (action) where.action = action
  if (actorId) where.actorId = actorId
  if (resourceType) where.resourceType = resourceType
  if (resourceId) where.resourceId = resourceId
  if (requestId) where.requestId = requestId
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {})
    }
  }

  return withTenant(tenantId, async (tx) => {
    const events = await tx.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        tenantId: true,
        createdAt: true,
        action: true,
        resourceType: true,
        resourceId: true,
        requestId: true,
        actorId: true,
        ip: true,
        userAgent: true,
        documentId: true,
        analysisLogId: true,
        metadata: true
      }
    })

    const nextCursor = events.length === limit ? events[events.length - 1]?.id : null
    return { events, nextCursor }
  })
}
