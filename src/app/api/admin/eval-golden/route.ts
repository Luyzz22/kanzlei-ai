export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"
import { GOLDEN_SETS, evaluateAgainstGoldenSet } from "@/lib/eval/golden-sets"

/**
 * Golden Set Evaluation API
 *
 * Vergleicht die letzten realen Analysen gegen Golden Set Erwartungen.
 * Matching: contractClassification des AnalysisRun → Golden Set contractType.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })
  }

  // Letzte 100 completed Analysen mit Findings laden
  const runs = await prisma.analysisRun.findMany({
    where: { tenantId: ctx.tenantId, status: "COMPLETED", contractClassification: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 100,
    select: {
      id: true,
      contractClassification: true,
      aggregateConfidence: true,
      completedAt: true,
      riskPromptVersion: true,
      findings: {
        select: { category: true, severity: true, confidence: true }
      }
    }
  })

  // Pro Golden Set: alle passenden Analysen evaluieren
  const results = GOLDEN_SETS.map(gs => {
    const matchingRuns = runs.filter(r => {
      const ct = (r.contractClassification ?? "").toLowerCase()
      const gsType = gs.contractType.toLowerCase()
      return ct.includes(gsType.split("/")[0].trim().split(" ")[0]) || gsType.includes(ct.split("/")[0].trim().split(" ")[0])
    })

    const evaluations = matchingRuns.map(run => {
      const result = evaluateAgainstGoldenSet(gs, run.findings)
      return {
        runId: run.id,
        date: run.completedAt?.toISOString() ?? null,
        promptVersion: run.riskPromptVersion,
        confidence: run.aggregateConfidence,
        ...result
      }
    })

    const passRate = evaluations.length > 0
      ? Math.round((evaluations.filter(e => e.passed).length / evaluations.length) * 1000) / 10
      : null
    const avgScore = evaluations.length > 0
      ? Math.round(evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length)
      : null

    return {
      goldenSet: {
        id: gs.id,
        displayName: gs.displayName,
        contractType: gs.contractType,
        mandatoryCount: gs.mandatoryFindings.length,
        forbiddenCount: gs.forbiddenCategories.length
      },
      matchingRuns: evaluations.length,
      passRate,
      avgScore,
      // Nur die letzten 5 Evaluationen für die UI
      recentEvaluations: evaluations.slice(0, 5)
    }
  })

  const overallPassRate = (() => {
    const withData = results.filter(r => r.matchingRuns > 0)
    if (withData.length === 0) return null
    return Math.round(withData.reduce((s, r) => s + (r.passRate ?? 0), 0) / withData.length * 10) / 10
  })()

  return NextResponse.json({
    goldenSetsTotal: GOLDEN_SETS.length,
    goldenSetsWithData: results.filter(r => r.matchingRuns > 0).length,
    overallPassRate,
    results
  })
}
