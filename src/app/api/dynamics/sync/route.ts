import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { buildDynamicsClientForTenant } from "@/lib/dynamics/core"
import { prisma } from "@/lib/prisma"
import { writeAuditEvent } from "@/lib/audit-core"

/**
 * POST /api/dynamics/sync
 *
 * Body: { entity: "vendors" | "purchaseOrders" | "purchaseInvoices" }
 *
 * Credentials werden aus der gespeicherten Tenant-Config geladen —
 * NIEMALS im Request-Body (Phase-1-Anti-Pattern).
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "No single tenant context" }, { status: 400 })
  }

  try {
    const { entity } = await req.json().catch(() => ({}))
    const validEntities = ["vendors", "purchaseOrders", "purchaseInvoices"]
    if (!validEntities.includes(entity)) {
      return NextResponse.json(
        { error: `Invalid entity. Allowed: ${validEntities.join(", ")}` },
        { status: 400 }
      )
    }

    const config = await prisma.dynamicsIntegration.findUnique({
      where: { tenantId: ctx.tenantId }
    })
    if (!config) {
      return NextResponse.json(
        { error: "Keine Dynamics-Integration konfiguriert. Bitte erst Config einrichten." },
        { status: 400 }
      )
    }
    if (!config.companyId) {
      return NextResponse.json(
        { error: "Keine Company ausgewaehlt. Bitte Config vervollstaendigen." },
        { status: 400 }
      )
    }

    const client = await buildDynamicsClientForTenant(ctx.tenantId)
    if (!client) {
      return NextResponse.json(
        { error: "Dynamics client konnte nicht initialisiert werden." },
        { status: 500 }
      )
    }

    const startedAt = new Date()
    let count = 0

    if (entity === "vendors") {
      const vendors = await client.listVendors(config.companyId)
      count = vendors.length
    } else {
      // purchaseOrders / purchaseInvoices: noch nicht implementiert
      // (kommt in Block 2 — aktuell nur Stub damit UI nicht bricht)
      count = 0
    }

    await prisma.dynamicsIntegration.update({
      where: { tenantId: ctx.tenantId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null
      }
    })

    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorId: session.user.id,
      action: "dynamics.sync.run",
      resourceType: "dynamics_integration",
      resourceId: config.id,
      metadata: {
        entity,
        count,
        companyId: config.companyId,
        durationMs: Date.now() - startedAt.getTime()
      }
    })

    return NextResponse.json({
      success: true,
      entity,
      count,
      syncedAt: new Date().toISOString()
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"

    // Persist failure state
    await prisma.dynamicsIntegration
      .update({
        where: { tenantId: ctx.tenantId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "error",
          lastSyncError: msg.slice(0, 500)
        }
      })
      .catch(() => {})

    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorId: session.user.id,
      action: "dynamics.sync.failed",
      resourceType: "dynamics_integration",
      metadata: { error: msg.slice(0, 500) }
    }).catch(() => {})

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
