import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import {
  getDynamicsConfig,
  upsertDynamicsConfig,
  deleteDynamicsConfig
} from "@/lib/dynamics/core"

async function requireAdminTenant() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const, status: 401 }
  }
  // Only ADMIN role may touch Dynamics config (sensitive)
  if (session.user.role !== "ADMIN") {
    return { error: "Forbidden — ADMIN role required" as const, status: 403 }
  }
  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return { error: "No single tenant context" as const, status: 400 }
  }
  return { tenantId: ctx.tenantId, actorId: session.user.id }
}

export async function GET() {
  const r = await requireAdminTenant()
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status })

  try {
    const config = await getDynamicsConfig(r.tenantId, r.actorId)
    return NextResponse.json({ config })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error loading config" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const r = await requireAdminTenant()
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status })

  try {
    const body = await req.json()
    const result = await upsertDynamicsConfig(r.tenantId, r.actorId, {
      azureTenantId: String(body.azureTenantId ?? "").trim(),
      clientId: String(body.clientId ?? "").trim(),
      clientSecret: String(body.clientSecret ?? ""),
      environment: String(body.environment ?? "Production"),
      companyId: body.companyId ? String(body.companyId) : null,
      companyName: body.companyName ? String(body.companyName) : null,
      baseUrl: body.baseUrl ? String(body.baseUrl) : undefined
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, id: result.id })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Config upsert failed" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const r = await requireAdminTenant()
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status })

  try {
    const result = await deleteDynamicsConfig(r.tenantId, r.actorId)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Config delete failed" },
      { status: 500 }
    )
  }
}
