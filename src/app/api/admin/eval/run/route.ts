export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"
import { GOLDEN_SET_SPECS } from "@/lib/eval/golden-set-specs"
import { evaluateAnalysisRun } from "@/lib/eval/eval-runner"

async function resolveAdminContext(userId: string) {
  const ctx = await resolveTenantContextForUser(userId)
  if (ctx.status !== "single") return null
  return ctx.tenantId
}

async function assertAdmin(userId: string, role: string | undefined, tenantId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER") return true
  const membership = await prisma.tenantMember.findFirst({
    where: { tenantId, userId },
    select: { role: true }
  })
  return membership?.role === "ADMIN"
}

/** GET — list golden sets + recent completed runs for UI dropdowns */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const tenantId = await resolveAdminContext(session.user.id)
  if (!tenantId) return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const platformRole = (session.user as { role?: string }).role
  if (!(await assertAdmin(session.user.id, platformRole, tenantId))) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const recentRuns = await prisma.analysisRun.findMany({
    where: { tenantId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      completedAt: true,
      contractClassification: true,
      primaryModel: true,
      riskScore01: true,
      document: { select: { title: true } }
    }
  })

  return NextResponse.json({
    goldenSets: GOLDEN_SET_SPECS.map((gs) => ({
      id: gs.id,
      name: gs.name,
      contractType: gs.contractType,
      version: gs.version,
      requiredCount: gs.expectations.requiredFindings.length
    })),
    recentRuns: recentRuns.map((r) => ({
      id: r.id,
      completedAt: r.completedAt?.toISOString() ?? null,
      classification: r.contractClassification,
      model: r.primaryModel,
      riskScore: r.riskScore01,
      documentTitle: r.document?.title ?? "Unbekannt"
    }))
  })
}

/** POST — run evaluation of a specific analysis run against a golden set */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const tenantId = await resolveAdminContext(session.user.id)
  if (!tenantId) return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })

  const platformRole = (session.user as { role?: string }).role
  if (!(await assertAdmin(session.user.id, platformRole, tenantId))) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const body = await request.json() as { analysisRunId?: string; goldenSetId?: string }
  const { analysisRunId, goldenSetId } = body

  if (!analysisRunId || !goldenSetId) {
    return NextResponse.json({ error: "analysisRunId und goldenSetId erforderlich" }, { status: 400 })
  }

  // Verify the run belongs to this tenant
  const run = await prisma.analysisRun.findFirst({
    where: { id: analysisRunId, tenantId },
    select: { id: true }
  })
  if (!run) return NextResponse.json({ error: "Analyse nicht gefunden" }, { status: 404 })

  try {
    const result = await evaluateAnalysisRun(analysisRunId, goldenSetId)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Evaluierung fehlgeschlagen"
    return NextResponse.json({ error: msg }, { status: 422 })
  }
}
