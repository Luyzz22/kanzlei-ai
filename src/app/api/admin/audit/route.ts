import { Role } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { listAuditEvents } from "@/lib/admin/audit-core"
import { auth } from "@/lib/auth"
import { logEvent } from "@/lib/observability"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  action: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  resourceType: z.string().min(1).optional(),
  resourceId: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().min(1).optional()
})

async function resolveTenantIdForUser(userId: string): Promise<string | null> {
  const membership = await prisma.tenantMember.findFirst({ where: { userId }, select: { tenantId: true } })
  return membership?.tenantId ?? null
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    logEvent({ event: "audit.admin.list", source: "audit", outcome: "deny", detail: "unauthenticated" }, "warn")
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }
  if (session.user.role !== Role.ADMIN) {
    logEvent({ event: "audit.admin.list", source: "audit", outcome: "deny", actorId: session.user.id, detail: "role_forbidden" }, "warn")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const tenantId = await resolveTenantIdForUser(session.user.id)
  if (!tenantId) {
    logEvent({ event: "audit.admin.list", source: "audit", outcome: "deny", actorId: session.user.id, detail: "tenant_missing" }, "warn")
    return NextResponse.json({ error: "Kein Mandant gefunden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    action: url.searchParams.get("action") ?? undefined,
    actorId: url.searchParams.get("actorId") ?? undefined,
    resourceType: url.searchParams.get("resourceType") ?? undefined,
    resourceId: url.searchParams.get("resourceId") ?? undefined,
    requestId: url.searchParams.get("requestId") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Anfrage", details: parsed.error.flatten() }, { status: 400 })
  }

  const { events, nextCursor } = await listAuditEvents(tenantId, parsed.data)
  logEvent({ event: "audit.admin.list", source: "audit", outcome: "success", tenantId, actorId: session.user.id, meta: { count: events.length } })
  return NextResponse.json({ events, nextCursor })
}
