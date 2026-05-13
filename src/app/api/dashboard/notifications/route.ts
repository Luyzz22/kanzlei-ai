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

  // Pull recent analysis runs as notifications
  const recentRuns = await prisma.analysisRun.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { startedAt: "desc" },
    take: 15,
    select: {
      id: true,
      status: true,
      riskScore01: true,
      startedAt: true,
      completedAt: true,
      primaryModel: true,
      reviewState: true,
      document: { select: { id: true, title: true } },
      findings: { select: { severity: true } }
    }
  })

  // Pull recent review actions
  const recentReviews = await prisma.analysisFindingReview.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { reviewedAt: "desc" },
    take: 10,
    select: {
      id: true,
      decision: true,
      reviewedAt: true,
      reviewer: { select: { name: true, email: true } },
      finding: { select: { title: true } }
    }
  })

  type Notification = {
    id: string
    type: "analyse" | "review" | "system"
    emoji: string
    title: string
    desc: string
    time: string
    read: boolean
    href?: string
  }

  const notifications: Notification[] = []

  // Convert analysis runs to notifications
  for (const run of recentRuns) {
    const highCount = run.findings.filter(f => f.severity === "HOCH").length
    const isHighRisk = (run.riskScore01 ?? 0) >= 0.7

    if (run.status === "COMPLETED") {
      notifications.push({
        id: `run-${run.id}`,
        type: "analyse",
        emoji: isHighRisk ? "\u{1F534}" : highCount > 0 ? "\u{1F7E1}" : "\u2705",
        title: isHighRisk ? "Hochrisiko-Vertrag erkannt" : "Analyse abgeschlossen",
        desc: `${run.document.title} \u2014 Score: ${run.riskScore01 != null ? (run.riskScore01 * 100).toFixed(0) + "%" : "N/A"}, ${run.findings.length} Findings${highCount > 0 ? ` (${highCount} hoch)` : ""}`,
        time: run.completedAt?.toISOString() ?? run.startedAt.toISOString(),
        read: run.reviewState !== "UNGEPRUEFT",
        href: `/workspace/dokumente/${run.document.id}`
      })
    } else if (run.status === "FAILED") {
      notifications.push({
        id: `run-${run.id}`,
        type: "system",
        emoji: "\u26A0\uFE0F",
        title: "Analyse fehlgeschlagen",
        desc: `${run.document.title} \u2014 bitte erneut versuchen`,
        time: run.startedAt.toISOString(),
        read: true,
        href: `/workspace/dokumente/${run.document.id}`
      })
    }
  }

  // Convert reviews to notifications
  for (const review of recentReviews) {
    const decisionLabel = review.decision === "AKZEPTIERT" ? "akzeptiert" : review.decision === "ABGELEHNT" ? "abgelehnt" : "angepasst"
    notifications.push({
      id: `review-${review.id}`,
      type: "review",
      emoji: review.decision === "AKZEPTIERT" ? "\u2705" : review.decision === "ABGELEHNT" ? "\u274C" : "\u270F\uFE0F",
      title: `Finding ${decisionLabel}`,
      desc: `${review.finding.title} \u2014 von ${review.reviewer.name ?? review.reviewer.email}`,
      time: review.reviewedAt.toISOString(),
      read: true,
    })
  }

  // Sort by time descending
  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // System notification for latest release
  notifications.unshift({
    id: "release-3.1.0",
    type: "system",
    emoji: "🚀",
    title: "KanzleiAI v3.1.0 verfügbar",
    desc: "Review-Pipeline, PDF-Export, Norm-Analogie-Marker und 16 weitere Verbesserungen",
    time: "2026-05-12T10:00:00.000Z",
    read: false,
    href: "/release-notes"
  })

  return NextResponse.json({ notifications: notifications.slice(0, 20) })
}
