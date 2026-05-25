export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

/**
 * Continuous Eval Dashboard API (Phase 2A)
 *
 * Aggregiert aus AnalysisRun + AnalysisFinding + AnalysisFindingReview:
 * - Override-Raten (Drift Detection)
 * - Finding-Akzeptanz-Verteilung
 * - Konfidenz-Kalibrierung
 * - Qualität nach Vertragstyp
 * - Provider/Modell-Vergleich
 * - Kosten-/Latenz-Trends
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
  }

  // Admin/Owner only — eval analytics are privileged data
  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN" && role !== "OWNER") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return NextResponse.json({ error: "Kein Mandant" }, { status: 403 })
  }

  const tenantId = ctx.tenantId
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [
    // 1. Gesamtstatistiken
    totalRuns,
    completedRuns,
    totalFindings,
    totalReviews,
    // 2. Review-Decision-Verteilung
    decisionDist,
    // 3. Override-Rate Zeitfenster: letzte 30 Tage vs. 30-60 Tage (Drift)
    recentReviews,
    previousReviews,
    // 5. Provider/Modell-Metriken
    providerMetrics,
    // 6. Prompt-Version-Vergleich
    promptVersionMetrics,
    // 7. Letzte 30 Runs für Zeitreihen
    recentRuns,
    // 8. Konfidenz-Kalibrierung: Findings mit Review
    findingsWithReview
  ] = await Promise.all([
    // 1
    prisma.analysisRun.count({ where: { tenantId } }),
    prisma.analysisRun.count({ where: { tenantId, status: "COMPLETED" } }),
    prisma.analysisFinding.count({ where: { tenantId } }),
    prisma.analysisFindingReview.count({ where: { tenantId } }),
    // 2
    prisma.analysisFindingReview.groupBy({
      by: ["decision"],
      where: { tenantId },
      _count: { decision: true }
    }),
    // 3a: letzte 30 Tage
    prisma.analysisFindingReview.groupBy({
      by: ["decision"],
      where: { tenantId, reviewedAt: { gte: thirtyDaysAgo } },
      _count: { decision: true }
    }),
    // 3b: 30-60 Tage davor
    prisma.analysisFindingReview.groupBy({
      by: ["decision"],
      where: { tenantId, reviewedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _count: { decision: true }
    }),
    // 5
    prisma.analysisRun.groupBy({
      by: ["primaryModel"],
      where: { tenantId, status: "COMPLETED", primaryModel: { not: null } },
      _count: { primaryModel: true },
      _avg: { aggregateConfidence: true, totalCostEstimate: true, durationMs: true, totalTokensUsed: true }
    }),
    // 6
    prisma.analysisRun.groupBy({
      by: ["riskPromptVersion"],
      where: { tenantId, status: "COMPLETED" },
      _count: { riskPromptVersion: true },
      _avg: { aggregateConfidence: true, riskScore01: true }
    }),
    // 7
    prisma.analysisRun.findMany({
      where: { tenantId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 50,
      select: {
        id: true,
        completedAt: true,
        aggregateConfidence: true,
        riskScore01: true,
        primaryModel: true,
        riskPromptVersion: true,
        totalCostEstimate: true,
        durationMs: true,
        totalTokensUsed: true,
        contractClassification: true,
        findings: {
          select: {
            id: true, severity: true, confidence: true,
            reviews: { select: { decision: true }, orderBy: { reviewedAt: "desc" }, take: 1 }
          }
        }
      }
    }),
    // 8: Findings mit mindestens einem Review für Konfidenz-Kalibrierung
    prisma.analysisFinding.findMany({
      where: { tenantId, reviews: { some: {} } },
      select: {
        confidence: true,
        severity: true,
        reviews: { select: { decision: true }, orderBy: { reviewedAt: "desc" }, take: 1 }
      },
      take: 500
    })
  ])

  // ── Override-Rate berechnen ──
  const overrideDecisions = ["ABGELEHNT", "ANGEPASST"]
  const calcOverrideRate = (dist: Array<{ decision: string; _count: { decision: number } }>) => {
    const total = dist.reduce((s, d) => s + d._count.decision, 0)
    const overrides = dist.filter(d => overrideDecisions.includes(d.decision)).reduce((s, d) => s + d._count.decision, 0)
    return total > 0 ? Math.round((overrides / total) * 1000) / 10 : null
  }

  const overrideRateAll = calcOverrideRate(decisionDist)
  const overrideRateRecent = calcOverrideRate(recentReviews)
  const overrideRatePrevious = calcOverrideRate(previousReviews)

  // ── Drift Detection ──
  const driftDelta = (overrideRateRecent != null && overrideRatePrevious != null)
    ? Math.round((overrideRateRecent - overrideRatePrevious) * 10) / 10
    : null
  const driftAlert = driftDelta != null && driftDelta > 10 // >10pp Anstieg = Alert

  // ── Decision Distribution ──
  const decisions = {
    akzeptiert: decisionDist.find(d => d.decision === "AKZEPTIERT")?._count.decision ?? 0,
    abgelehnt: decisionDist.find(d => d.decision === "ABGELEHNT")?._count.decision ?? 0,
    angepasst: decisionDist.find(d => d.decision === "ANGEPASST")?._count.decision ?? 0,
    kenntnisgenommen: decisionDist.find(d => d.decision === "KENNTNISGENOMMEN")?._count.decision ?? 0
  }

  // ── Override-Rate nach Vertragstyp ──
  const runFindingsMap = new Map<string, { overrides: number; reviewed: number; confidence: number[]; cost: number[]; latency: number[] }>()
  for (const run of recentRuns) {
    const ct = run.contractClassification ?? "Unbekannt"
    if (!runFindingsMap.has(ct)) runFindingsMap.set(ct, { overrides: 0, reviewed: 0, confidence: [], cost: [], latency: [] })
    const entry = runFindingsMap.get(ct)!
    if (run.aggregateConfidence != null) entry.confidence.push(run.aggregateConfidence)
    if (run.totalCostEstimate != null) entry.cost.push(run.totalCostEstimate)
    if (run.durationMs != null) entry.latency.push(run.durationMs)
    for (const f of run.findings) {
      if (f.reviews.length > 0) {
        entry.reviewed++
        if (overrideDecisions.includes(f.reviews[0].decision)) entry.overrides++
      }
    }
  }
  const qualityByContractType = Array.from(runFindingsMap.entries()).map(([type, d]) => ({
    type,
    overrideRate: d.reviewed > 0 ? Math.round((d.overrides / d.reviewed) * 1000) / 10 : null,
    reviewed: d.reviewed,
    avgConfidence: d.confidence.length > 0 ? Math.round((d.confidence.reduce((a, b) => a + b, 0) / d.confidence.length) * 100) / 100 : null,
    avgCost: d.cost.length > 0 ? Math.round((d.cost.reduce((a, b) => a + b, 0) / d.cost.length) * 100) / 100 : null,
    avgLatencyMs: d.latency.length > 0 ? Math.round(d.latency.reduce((a, b) => a + b, 0) / d.latency.length) : null
  })).sort((a, b) => (b.reviewed ?? 0) - (a.reviewed ?? 0))

  // ── Konfidenz-Kalibrierung (Buckets) ──
  const confBuckets = [
    { label: "0.0–0.4", min: 0, max: 0.4, accepted: 0, total: 0 },
    { label: "0.4–0.6", min: 0.4, max: 0.6, accepted: 0, total: 0 },
    { label: "0.6–0.8", min: 0.6, max: 0.8, accepted: 0, total: 0 },
    { label: "0.8–1.0", min: 0.8, max: 1.01, accepted: 0, total: 0 }
  ]
  for (const f of findingsWithReview) {
    if (f.confidence == null || f.reviews.length === 0) continue
    const bucket = confBuckets.find(b => f.confidence! >= b.min && f.confidence! < b.max)
    if (!bucket) continue
    bucket.total++
    if (f.reviews[0].decision === "AKZEPTIERT" || f.reviews[0].decision === "KENNTNISGENOMMEN") bucket.accepted++
  }
  const confidenceCalibration = confBuckets.map(b => ({
    range: b.label,
    total: b.total,
    acceptanceRate: b.total > 0 ? Math.round((b.accepted / b.total) * 1000) / 10 : null
  }))

  // ── Provider-Vergleich ──
  const providers = providerMetrics.map(p => ({
    model: p.primaryModel,
    runs: p._count.primaryModel,
    avgConfidence: p._avg.aggregateConfidence != null ? Math.round(p._avg.aggregateConfidence * 100) / 100 : null,
    avgCostEur: p._avg.totalCostEstimate != null ? Math.round(p._avg.totalCostEstimate * 100) / 100 : null,
    avgLatencyMs: p._avg.durationMs != null ? Math.round(p._avg.durationMs) : null,
    avgTokens: p._avg.totalTokensUsed != null ? Math.round(p._avg.totalTokensUsed) : null
  })).sort((a, b) => b.runs - a.runs)

  // ── Prompt-Version-Vergleich ──
  const promptVersions = promptVersionMetrics.map(v => ({
    version: v.riskPromptVersion,
    runs: v._count.riskPromptVersion,
    avgConfidence: v._avg.aggregateConfidence != null ? Math.round(v._avg.aggregateConfidence * 100) / 100 : null,
    avgRiskScore: v._avg.riskScore01 != null ? Math.round(v._avg.riskScore01 * 100) / 100 : null
  })).sort((a, b) => b.runs - a.runs)

  // ── Zeitreihe (letzte 50 Runs) ──
  const timeline = recentRuns.map(r => ({
    date: r.completedAt?.toISOString() ?? null,
    confidence: r.aggregateConfidence,
    riskScore: r.riskScore01,
    cost: r.totalCostEstimate,
    latencyMs: r.durationMs,
    model: r.primaryModel,
    promptVersion: r.riskPromptVersion,
    contractType: r.contractClassification,
    findingsTotal: r.findings.length,
    findingsReviewed: r.findings.filter(f => f.reviews.length > 0).length,
    findingsOverridden: r.findings.filter(f => f.reviews.length > 0 && overrideDecisions.includes(f.reviews[0].decision)).length
  })).reverse()

  return NextResponse.json({
    // KPIs
    totalRuns,
    completedRuns,
    totalFindings,
    totalReviews,
    overrideRate: overrideRateAll,
    // Drift
    drift: {
      recentOverrideRate: overrideRateRecent,
      previousOverrideRate: overrideRatePrevious,
      delta: driftDelta,
      alert: driftAlert
    },
    // Distributions
    decisions,
    confidenceCalibration,
    qualityByContractType,
    providers,
    promptVersions,
    timeline
  })
}
