export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

/**
 * Playbook Miner Alpha (Phase 3B, Wette #2)
 *
 * Mining-Algorithmus:
 * 1. Alle reviewed Findings des Tenants laden
 * 2. Nach Klauselkategorie gruppieren
 * 3. Pro Kategorie: Acceptance-Rate, häufigste Decision, bevorzugte Formulierungen
 * 4. Pattern-Erkennung: ≥3 gleichartige Entscheidungen → Playbook-Regel-Vorschlag
 * 5. Preferred Revisions: häufig verwendete modifiedSuggestedRevision-Texte clustern
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

  const tenantId = ctx.tenantId

  // Alle Findings mit Reviews laden
  const findings = await prisma.analysisFinding.findMany({
    where: { tenantId, reviews: { some: {} } },
    select: {
      id: true,
      category: true,
      title: true,
      severity: true,
      confidence: true,
      suggestedRevision: true,
      reviews: {
        select: {
          decision: true,
          comment: true,
          modifiedSuggestedRevision: true,
          reviewedAt: true,
          reviewer: { select: { name: true } }
        },
        orderBy: { reviewedAt: "desc" },
        take: 1
      }
    }
  })

  // ── Gruppieren nach Kategorie ──
  const categoryMap = new Map<string, {
    total: number
    accepted: number
    rejected: number
    adjusted: number
    noted: number
    severities: Record<string, number>
    preferredRevisions: string[]
    adjustmentComments: string[]
    exampleTitles: string[]
    reviewerNames: Set<string>
    avgConfidence: number[]
  }>()

  for (const f of findings) {
    const cat = f.category
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        total: 0, accepted: 0, rejected: 0, adjusted: 0, noted: 0,
        severities: {}, preferredRevisions: [], adjustmentComments: [],
        exampleTitles: [], reviewerNames: new Set(), avgConfidence: []
      })
    }
    const entry = categoryMap.get(cat)!
    entry.total++
    if (f.confidence != null) entry.avgConfidence.push(f.confidence)
    if (entry.exampleTitles.length < 3 && !entry.exampleTitles.includes(f.title)) {
      entry.exampleTitles.push(f.title)
    }

    // Severity tracking
    const sev = f.severity
    entry.severities[sev] = (entry.severities[sev] ?? 0) + 1

    // Latest review
    const review = f.reviews[0]
    if (!review) continue

    switch (review.decision) {
      case "AKZEPTIERT": entry.accepted++; break
      case "ABGELEHNT": entry.rejected++; break
      case "ANGEPASST": entry.adjusted++; break
      case "KENNTNISGENOMMEN": entry.noted++; break
    }

    if (review.reviewer?.name) entry.reviewerNames.add(review.reviewer.name)
    if (review.modifiedSuggestedRevision) entry.preferredRevisions.push(review.modifiedSuggestedRevision)
    if (review.comment && review.decision === "ANGEPASST") entry.adjustmentComments.push(review.comment)
  }

  // ── Pattern-Erkennung ──
  type PlaybookRule = {
    category: string
    pattern: "AUTO_ACCEPT" | "ALWAYS_REJECT" | "PREFERRED_REVISION" | "NEEDS_REVIEW" | "INCONSISTENT"
    confidence: number
    description: string
    stats: {
      total: number
      accepted: number
      rejected: number
      adjusted: number
      noted: number
      acceptanceRate: number
      overrideRate: number
      dominantSeverity: string
      avgConfidence: number | null
    }
    preferredRevision: string | null
    exampleTitles: string[]
    reviewers: string[]
  }

  const rules: PlaybookRule[] = []
  const MIN_SAMPLES = 3

  for (const [category, data] of categoryMap.entries()) {
    if (data.total < MIN_SAMPLES) continue

    const acceptanceRate = Math.round(((data.accepted + data.noted) / data.total) * 1000) / 10
    const overrideRate = Math.round(((data.rejected + data.adjusted) / data.total) * 1000) / 10
    const avgConf = data.avgConfidence.length > 0
      ? Math.round((data.avgConfidence.reduce((a, b) => a + b, 0) / data.avgConfidence.length) * 100) / 100
      : null

    // Dominant severity
    const dominantSeverity = Object.entries(data.severities)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "UNKNOWN"

    // Find most common preferred revision (simple text matching)
    let preferredRevision: string | null = null
    if (data.preferredRevisions.length >= 2) {
      // Simple frequency: pick the longest common prefix or most frequent
      const revFreq = new Map<string, number>()
      for (const rev of data.preferredRevisions) {
        // Normalize: first 100 chars as key
        const key = rev.slice(0, 100).toLowerCase().trim()
        revFreq.set(key, (revFreq.get(key) ?? 0) + 1)
      }
      const topKey = Array.from(revFreq.entries()).sort(([, a], [, b]) => b - a)[0]
      if (topKey && topKey[1] >= 2) {
        // Use the full text of the first matching revision
        preferredRevision = data.preferredRevisions.find(
          r => r.slice(0, 100).toLowerCase().trim() === topKey[0]
        ) ?? null
      }
    }
    // If only one revision but consistently adjusted, use it
    if (!preferredRevision && data.preferredRevisions.length === 1 && data.adjusted >= MIN_SAMPLES) {
      preferredRevision = data.preferredRevisions[0]
    }

    // Pattern classification
    let pattern: PlaybookRule["pattern"]
    let description: string
    let confidence: number

    if (acceptanceRate >= 90) {
      pattern = "AUTO_ACCEPT"
      description = `Findings der Kategorie "${category}" werden in ${acceptanceRate}% der Fälle akzeptiert. Automatische Akzeptanz als Standardregel geeignet.`
      confidence = Math.min(acceptanceRate / 100, 0.99)
    } else if (overrideRate >= 80) {
      pattern = "ALWAYS_REJECT"
      description = `Findings der Kategorie "${category}" werden in ${overrideRate}% der Fälle abgelehnt oder angepasst. Diese Kategorie erfordert grundsätzlich manuelle Prüfung oder Promptanpassung.`
      confidence = Math.min(overrideRate / 100, 0.99)
    } else if (preferredRevision && data.adjusted >= MIN_SAMPLES) {
      pattern = "PREFERRED_REVISION"
      description = `Bei "${category}" wird die KI-Formulierung regelmäßig angepasst. Eine bevorzugte Standardformulierung wurde erkannt.`
      confidence = Math.min(data.adjusted / data.total, 0.95)
    } else if (acceptanceRate >= 50 && acceptanceRate < 90) {
      pattern = "NEEDS_REVIEW"
      description = `Findings der Kategorie "${category}" haben eine gemischte Akzeptanzrate (${acceptanceRate}%). Individuelle Prüfung empfohlen.`
      confidence = 0.5
    } else {
      pattern = "INCONSISTENT"
      description = `Entscheidungen bei "${category}" sind inkonsistent (${acceptanceRate}% Akzeptanz, ${overrideRate}% Override). Klärung des internen Standards empfohlen.`
      confidence = 0.3
    }

    rules.push({
      category,
      pattern,
      confidence,
      description,
      stats: {
        total: data.total,
        accepted: data.accepted,
        rejected: data.rejected,
        adjusted: data.adjusted,
        noted: data.noted,
        acceptanceRate,
        overrideRate,
        dominantSeverity,
        avgConfidence: avgConf
      },
      preferredRevision,
      exampleTitles: data.exampleTitles,
      reviewers: Array.from(data.reviewerNames)
    })
  }

  // Sort: highest confidence first, then by total samples
  rules.sort((a, b) => b.confidence - a.confidence || b.stats.total - a.stats.total)

  // ── Summary Stats ──
  const totalReviewedFindings = findings.length
  const totalCategories = categoryMap.size
  const categoriesWithPattern = rules.length
  const autoAcceptable = rules.filter(r => r.pattern === "AUTO_ACCEPT").length
  const alwaysReject = rules.filter(r => r.pattern === "ALWAYS_REJECT").length
  const withPreferredRevision = rules.filter(r => r.preferredRevision != null).length

  return NextResponse.json({
    summary: {
      totalReviewedFindings,
      totalCategories,
      categoriesWithPattern,
      autoAcceptable,
      alwaysReject,
      withPreferredRevision,
      minSamplesRequired: MIN_SAMPLES
    },
    rules
  })
}
