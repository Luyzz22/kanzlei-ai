import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { testDynamicsConnection } from "@/lib/dynamics/core"
import { decryptSecret } from "@/lib/dynamics/crypto"
import { prisma } from "@/lib/prisma"
import { writeAuditEvent } from "@/lib/audit-core"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "No single tenant context" }, { status: 400 })
  }

  try {
    const body = await req.json().catch(() => ({}))

    // Zwei Modi: entweder explizite Credentials (aus Formular) oder gespeicherte Config
    let azureTenantId: string
    let clientId: string
    let clientSecret: string
    let environment: string
    let baseUrl: string
    let source: "form" | "stored"

    if (body.clientSecret) {
      azureTenantId = String(body.azureTenantId ?? "").trim()
      clientId = String(body.clientId ?? "").trim()
      clientSecret = String(body.clientSecret)
      environment = String(body.environment ?? "Production")
      baseUrl = String(body.baseUrl ?? "https://api.businesscentral.dynamics.com/v2.0")
      source = "form"
    } else {
      // Fallback: laden aus DB und Secret entschluesseln
      const row = await prisma.dynamicsIntegration.findUnique({
        where: { tenantId: ctx.tenantId }
      })
      if (!row) {
        return NextResponse.json(
          { error: "Keine gespeicherte Konfiguration. Bitte Formular ausfuellen." },
          { status: 400 }
        )
      }
      azureTenantId = row.azureTenantId
      clientId = row.clientId
      clientSecret = decryptSecret(row.clientSecretEncrypted)
      environment = row.environment
      baseUrl = row.baseUrl
      source = "stored"
    }

    const result = await testDynamicsConnection(
      azureTenantId,
      clientId,
      clientSecret,
      environment,
      baseUrl
    )

    // Audit: jeder Connection-Test wird protokolliert (Enterprise-Nachweis)
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorId: session.user.id,
      action: "dynamics.connection.test",
      resourceType: "dynamics_integration",
      metadata: {
        source,
        success: result.success,
        ...(result.success
          ? { companiesFound: result.companies.length }
          : { stage: result.stage, error: result.error.slice(0, 500) })
      }
    })

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Test failed" },
      { status: 500 }
    )
  }
}
