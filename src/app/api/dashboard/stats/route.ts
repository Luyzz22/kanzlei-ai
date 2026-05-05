export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })
  }

  const [totalRuns, completedRuns, totalFindings, lastRun, recentRuns] = await Promise.all([
    prisma.analysisRun.count({ where: { tenantId: ctx.tenantId } }),
    prisma.analysisRun.findMany({
      where: { tenantId: ctx.tenantId, status: "COMPLETED" },
      select: { riskScore01: true }
    }),
    prisma.analysisFinding.count({ where: { tenantId: ctx.tenantId } }),
    prisma.analysisRun.findFirst({
      where: { tenantId: ctx.tenantId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: {
        completedAt: true,
        riskScore01: true,
        primaryModel: true,
        document: { select: { title: true, documentType: true } }
      }
    }),
    prisma.analysisRun.findMany({
      where: { tenantId: ctx.tenantId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        id: true,
        completedAt: true,
        riskScore01: true,
        primaryModel: true,
        document: { select: { id: true, title: true, documentType: true, organizationName: true } },
        findings: { select: { severity: true } }
      }
    })
  ])

  const riskScores = completedRuns.map(r => r.riskScore01).filter((s): s is number => s != null)
  const avgRiskScore = riskScores.length > 0
    ? Math.round((riskScores.reduce((a, b) => a + b, 0) / riskScores.length) * 100) / 100
    : null

  const history = recentRuns.map(run => ({
    id: run.id,
    documentId: run.document.id,
    title: run.document.title,
    documentType: run.document.documentType,
    organizationName: run.document.organizationName,
    riskScore: run.riskScore01,
    findingsCount: run.findings.length,
    highFindings: run.findings.filter(f => f.severity === "HOCH").length,
    model: run.primaryModel ?? "unknown",
    completedAt: run.completedAt?.toISOString() ?? null,
  }))

  return NextResponse.json({
    totalAnalyses: totalRuns,
    completedAnalyses: completedRuns.length,
    avgRiskScore,
    totalFindings,
    lastAnalysis: lastRun ? {
      completedAt: lastRun.completedAt?.toISOString() ?? null,
      riskScore: lastRun.riskScore01,
      model: lastRun.primaryModel,
      title: lastRun.document?.title,
    } : null,
    history,
  })
}
