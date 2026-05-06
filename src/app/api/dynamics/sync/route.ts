export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { buildDynamicsClientForTenant } from "@/lib/dynamics/core"
import { prisma } from "@/lib/prisma"
import { syncVendors, syncPurchaseOrders, syncPurchaseInvoices, syncAll } from "@/lib/dynamics/sync-service"

/**
 * POST /api/dynamics/sync
 *
 * Body: { entity: "vendors" | "purchaseOrders" | "purchaseInvoices" | "all" }
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
    const { entity } = await req.json().catch(() => ({ entity: "all" }))
    const validEntities = ["vendors", "purchaseOrders", "purchaseInvoices", "all"]
    if (!validEntities.includes(entity)) {
      return NextResponse.json(
        { error: `Invalid entity. Allowed: ${validEntities.join(", ")}` },
        { status: 400 }
      )
    }

    // Full sync shortcut
    if (entity === "all") {
      const result = await syncAll(ctx.tenantId, session.user.id)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, results: result.results })
    }

    // Single entity sync
    const config = await prisma.dynamicsIntegration.findUnique({
      where: { tenantId: ctx.tenantId }
    })
    if (!config) {
      return NextResponse.json(
        { error: "Keine Dynamics-Integration konfiguriert." },
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
        { error: "Dynamics Client konnte nicht initialisiert werden." },
        { status: 500 }
      )
    }

    let result
    switch (entity) {
      case "vendors":
        result = await syncVendors(ctx.tenantId, config.companyId, client, session.user.id)
        break
      case "purchaseOrders":
        result = await syncPurchaseOrders(ctx.tenantId, config.companyId, client, session.user.id)
        break
      case "purchaseInvoices":
        result = await syncPurchaseInvoices(ctx.tenantId, config.companyId, client, session.user.id)
        break
    }

    await prisma.dynamicsIntegration.update({
      where: { tenantId: ctx.tenantId },
      data: { lastSyncAt: new Date(), lastSyncStatus: "success", lastSyncError: null }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"

    await prisma.dynamicsIntegration
      .update({
        where: { tenantId: ctx.tenantId },
        data: { lastSyncAt: new Date(), lastSyncStatus: "error", lastSyncError: msg.slice(0, 500) }
      })
      .catch(() => {})

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
