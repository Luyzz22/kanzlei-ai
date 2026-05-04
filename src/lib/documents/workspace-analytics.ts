import "server-only"

import { prisma } from "@/lib/prisma"
import { REGULATION_WATCHLIST, type WatchedRegulation } from "@/lib/regulatory/watchlist"

// ─── Benchmarking ──────────────────────────────────────────

export type VendorBenchmark = {
  vendor: string
  contractCount: number
  avgRiskScore: number
  maxRiskScore: number
  totalFindings: number
  highFindings: number
  lastAnalysisDate: string | null
  contractTypes: string[]
}

export async function getVendorBenchmarks(tenantId: string): Promise<VendorBenchmark[]> {
  const extractions = await prisma.documentExtraction.findMany({
    where: { tenantId },
    select: {
      contractType: true,
      structuredData: true,
      analysisRun: {
        select: {
          riskScore01: true,
          completedAt: true,
          status: true,
          findings: {
            select: { severity: true }
          }
        }
      }
    }
  })

  const vendorMap = new Map<string, {
    contracts: Set<string>
    risks: number[]
    findings: number
    highFindings: number
    lastDate: Date | null
    types: Set<string>
  }>()

  for (const ext of extractions) {
    const sd = ext.structuredData as Record<string, unknown> | null
    const vendor = (sd?.vendor as string) || (sd?.customer as string) || "Nicht zugeordnet"
    const run = ext.analysisRun

    if (!run || run.status !== "COMPLETED") continue

    const entry = vendorMap.get(vendor) ?? {
      contracts: new Set<string>(),
      risks: [],
      findings: 0,
      highFindings: 0,
      lastDate: null,
      types: new Set<string>()
    }

    entry.contracts.add(ext.contractType)
    if (run.riskScore01 != null) entry.risks.push(run.riskScore01)
    entry.findings += run.findings.length
    entry.highFindings += run.findings.filter(f => f.severity === "HOCH").length
    entry.types.add(ext.contractType)

    if (run.completedAt && (!entry.lastDate || run.completedAt > entry.lastDate)) {
      entry.lastDate = run.completedAt
    }

    vendorMap.set(vendor, entry)
  }

  return Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      contractCount: data.contracts.size,
      avgRiskScore: data.risks.length > 0
        ? Math.round((data.risks.reduce((a, b) => a + b, 0) / data.risks.length) * 100) / 100
        : 0,
      maxRiskScore: data.risks.length > 0 ? Math.max(...data.risks) : 0,
      totalFindings: data.findings,
      highFindings: data.highFindings,
      lastAnalysisDate: data.lastDate?.toISOString() ?? null,
      contractTypes: Array.from(data.types)
    }))
    .sort((a, b) => b.avgRiskScore - a.avgRiskScore)
}

// ─── Vertragsradar ──────────────────────────────────────────

export type RadarMatch = {
  regulation: WatchedRegulation
  affectedDocuments: {
    id: string
    title: string
    contractType: string
    riskScore: number | null
    organizationName: string
  }[]
  urgency: "kritisch" | "hoch" | "mittel" | "niedrig"
}

export async function getRadarMatches(tenantId: string): Promise<RadarMatch[]> {
  const extractions = await prisma.documentExtraction.findMany({
    where: { tenantId },
    select: {
      contractType: true,
      document: {
        select: {
          id: true,
          title: true,
          organizationName: true
        }
      },
      analysisRun: {
        select: {
          riskScore01: true,
          status: true
        }
      }
    }
  })

  const completed = extractions.filter(e => e.analysisRun?.status === "COMPLETED")

  const matches: RadarMatch[] = []

  for (const reg of REGULATION_WATCHLIST) {
    const affected = completed.filter(ext =>
      reg.impactedContractTypes.some(type =>
        ext.contractType.toLowerCase().includes(type.toLowerCase()) ||
        type.toLowerCase().includes(ext.contractType.toLowerCase())
      )
    )

    if (affected.length === 0) continue

    const enforcement = new Date(reg.enforcementDate)
    const now = new Date()
    const daysUntil = Math.ceil((enforcement.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let urgency: RadarMatch["urgency"] = "niedrig"
    if (daysUntil < 0) urgency = "kritisch"
    else if (daysUntil < 90) urgency = "hoch"
    else if (daysUntil < 365) urgency = "mittel"

    matches.push({
      regulation: reg,
      affectedDocuments: affected.map(ext => ({
        id: ext.document.id,
        title: ext.document.title,
        contractType: ext.contractType,
        riskScore: ext.analysisRun?.riskScore01 ?? null,
        organizationName: ext.document.organizationName
      })),
      urgency
    })
  }

  return matches.sort((a, b) => {
    const order = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 }
    return order[a.urgency] - order[b.urgency]
  })
}

// ─── Portfolio-Statistiken ──────────────────────────────────

export type PortfolioStats = {
  totalDocuments: number
  analyzedDocuments: number
  avgRiskScore: number
  highRiskCount: number
  contractTypeDistribution: { type: string; count: number }[]
}

export async function getPortfolioStats(tenantId: string): Promise<PortfolioStats> {
  const [totalDocs, runs] = await Promise.all([
    prisma.document.count({ where: { tenantId } }),
    prisma.analysisRun.findMany({
      where: { tenantId, status: "COMPLETED" },
      select: {
        riskScore01: true,
        extraction: { select: { contractType: true } }
      }
    })
  ])

  const riskScores = runs.map(r => r.riskScore01).filter((s): s is number => s != null)
  const avgRisk = riskScores.length > 0
    ? Math.round((riskScores.reduce((a, b) => a + b, 0) / riskScores.length) * 100) / 100
    : 0

  const typeMap = new Map<string, number>()
  for (const run of runs) {
    const ct = run.extraction?.contractType ?? "Sonstiges"
    typeMap.set(ct, (typeMap.get(ct) ?? 0) + 1)
  }

  return {
    totalDocuments: totalDocs,
    analyzedDocuments: runs.length,
    avgRiskScore: avgRisk,
    highRiskCount: riskScores.filter(s => s >= 0.7).length,
    contractTypeDistribution: Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }
}
