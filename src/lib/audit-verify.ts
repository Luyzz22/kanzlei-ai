import { Prisma } from "@prisma/client"

import { computeEventHash, type AuditHashPayload } from "@/lib/audit-hash"
import { prisma } from "@/lib/prisma"
import { withTenant } from "@/lib/tenant-context-core"

type VerifyResult = {
  tenantId: string
  verified: boolean
  checked: number
  firstErrorIndex?: number
  detail?: string
}

function toPayload(event: {
  tenantId: string
  actorId: string | null
  action: string
  resourceType: string
  resourceId: string | null
  documentId: string | null
  analysisLogId: string | null
  ip: string | null
  userAgent: string | null
  requestId: string | null
  createdAt: Date
  metadata: Prisma.JsonValue | null
}): AuditHashPayload {
  return {
    tenantId: event.tenantId,
    actorId: event.actorId,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    documentId: event.documentId,
    analysisLogId: event.analysisLogId,
    ip: event.ip,
    userAgent: event.userAgent,
    requestId: event.requestId,
    createdAtIso: event.createdAt.toISOString(),
    metadata: event.metadata
  }
}

export async function verifyAuditChainForTenant(tenantId: string): Promise<VerifyResult> {
  if (!tenantId) throw new Error("tenantId is required")

  const events = await withTenant(tenantId, (tx) =>
    tx.auditEvent.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        tenantId: true,
        actorId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        documentId: true,
        analysisLogId: true,
        ip: true,
        userAgent: true,
        requestId: true,
        createdAt: true,
        metadata: true,
        prevHash: true,
        eventHash: true
      }
    })
  )

  let expectedPrev: string | null = null

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i]
    const payload = toPayload(event)
    const recalculated = computeEventHash(expectedPrev, payload)

    if (event.prevHash !== expectedPrev) {
      return {
        tenantId,
        verified: false,
        checked: i,
        firstErrorIndex: i,
        detail: `prevHash mismatch on event ${event.id}`
      }
    }

    if (!event.eventHash || event.eventHash !== recalculated) {
      return {
        tenantId,
        verified: false,
        checked: i,
        firstErrorIndex: i,
        detail: `eventHash mismatch on event ${event.id}`
      }
    }

    expectedPrev = event.eventHash
  }

  return { tenantId, verified: true, checked: events.length }
}

async function main() {
  const tenantArg = process.argv.find((arg) => arg.startsWith("--tenantId="))
  const tenantId = tenantArg?.split("=")[1] ?? process.argv[2]

  if (!tenantId) {
    console.error('Usage: pnpm audit:verify --tenantId="<tenant-id>"')
    process.exit(1)
  }

  const result = await verifyAuditChainForTenant(tenantId)
  console.log(JSON.stringify(result))
  await prisma.$disconnect()

  if (!result.verified) process.exit(2)
}

main().catch(async (error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : "unknown error" }))
  await prisma.$disconnect()
  process.exit(1)
})
