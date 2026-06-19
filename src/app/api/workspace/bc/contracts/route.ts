export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"
import { CRONUS_DEMO_CONTRACTS } from "@/lib/dynamics/demo-data"

function stripText(contracts: typeof CRONUS_DEMO_CONTRACTS) {
  return contracts.map(c => ({
    id: c.id,
    bcId: c.bcId,
    title: c.title,
    vendor: c.vendor,
    contractType: c.contractType,
    amount: c.amount,
    currency: c.currency,
    startDate: c.startDate,
    endDate: c.endDate,
    riskHint: c.riskHint,
    riskDescription: c.riskDescription,
  }))
}

/**
 * GET /api/workspace/bc/contracts
 * Gibt die Liste verfügbarer BC-Verträge zurück.
 * Demo-Modus: gibt Cronus AG Fixtures zurück wenn BC_DEMO_MODE=true
 * oder kein DynamicsIntegration-Record für den Tenant existiert.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const tenantCtx = await resolveTenantContextForUser(session.user.id)
  if (tenantCtx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })
  }
  const tenantId = tenantCtx.tenantId

  const isDemoMode = process.env.BC_DEMO_MODE === "true"

  if (!isDemoMode) {
    const integration = await prisma.dynamicsIntegration.findUnique({
      where: { tenantId },
      select: { id: true }
    })
    if (!integration) {
      return NextResponse.json({
        mode: "demo",
        company: "Cronus AG",
        contracts: stripText(CRONUS_DEMO_CONTRACTS)
      })
    }
  }

  return NextResponse.json({
    mode: "demo",
    company: "Cronus AG",
    contracts: stripText(CRONUS_DEMO_CONTRACTS)
  })
}
