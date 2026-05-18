export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

/** GET: Alle gespeicherten Playbook-Regeln des Tenants */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const rules = await prisma.playbookRule.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: [{ isActive: "desc" }, { confidence: "desc" }]
  })

  return NextResponse.json({ rules })
}

/** POST: Neue Regel speichern (aus Playbook Miner) */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const body = await req.json()
  const { category, pattern, confidence, description, preferredRevision, samplesCount, acceptanceRate, overrideRate } = body

  if (!category || !pattern) {
    return NextResponse.json({ error: "category und pattern sind Pflicht" }, { status: 400 })
  }

  // Upsert: eine Regel pro Kategorie pro Tenant
  const rule = await prisma.playbookRule.upsert({
    where: {
      id: await prisma.playbookRule.findFirst({
        where: { tenantId: ctx.tenantId, category },
        select: { id: true }
      }).then(r => r?.id ?? "nonexistent")
    },
    create: {
      tenantId: ctx.tenantId,
      category,
      pattern,
      confidence: confidence ?? 0,
      description,
      preferredRevision,
      samplesCount: samplesCount ?? 0,
      acceptanceRate,
      overrideRate,
      createdBy: session.user.id
    },
    update: {
      pattern,
      confidence: confidence ?? 0,
      description,
      preferredRevision,
      samplesCount: samplesCount ?? 0,
      acceptanceRate,
      overrideRate
    }
  })

  return NextResponse.json({ rule })
}

/** PATCH: Regel aktivieren/deaktivieren */
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const { ruleId, isActive } = await req.json()
  if (!ruleId || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "ruleId und isActive sind Pflicht" }, { status: 400 })
  }

  const rule = await prisma.playbookRule.updateMany({
    where: { id: ruleId, tenantId: ctx.tenantId },
    data: { isActive }
  })

  return NextResponse.json({ updated: rule.count })
}

/** DELETE: Regel löschen */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const { ruleId } = await req.json()
  if (!ruleId) return NextResponse.json({ error: "ruleId ist Pflicht" }, { status: 400 })

  await prisma.playbookRule.deleteMany({
    where: { id: ruleId, tenantId: ctx.tenantId }
  })

  return NextResponse.json({ deleted: true })
}
