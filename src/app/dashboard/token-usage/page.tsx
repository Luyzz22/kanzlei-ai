import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { resolveTenantContextForUser } from "@/lib/admin/tenant-access"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

type SourceLabel = { [key: string]: string }
const SOURCE_LABELS: SourceLabel = {
  analysis: "Vertragsanalyse",
  copilot: "Contract Copilot",
  ocr: "Dokument-OCR"
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtCost(cents: number): string {
  if (cents === 0) return "< $0.01"
  return `$${(cents / 100).toFixed(2)}`
}

async function loadTokenData(tenantId: string) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totals, recent, bySource, byProvider, topUsers] = await Promise.all([
    prisma.tenantTokenUsage.aggregate({
      where: { tenantId },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    prisma.tenantTokenUsage.aggregate({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    prisma.tenantTokenUsage.groupBy({
      by: ["source"],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    prisma.tenantTokenUsage.groupBy({
      by: ["provider"],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true }
    }),
    prisma.tenantTokenUsage.groupBy({
      by: ["userId"],
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { inputTokens: true, outputTokens: true, costCentsUsd: true },
      _count: { id: true },
      orderBy: { _sum: { costCentsUsd: "desc" } },
      take: 10
    })
  ])

  const userIds = topUsers.map((u) => u.userId)
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
      })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  return {
    totals: {
      requests: totals._count.id,
      totalTokens: (totals._sum.inputTokens ?? 0) + (totals._sum.outputTokens ?? 0),
      costCentsUsd: totals._sum.costCentsUsd ?? 0
    },
    recent: {
      requests: recent._count.id,
      totalTokens: (recent._sum.inputTokens ?? 0) + (recent._sum.outputTokens ?? 0),
      costCentsUsd: recent._sum.costCentsUsd ?? 0
    },
    bySource: bySource
      .map((s) => ({
        source: s.source,
        requests: s._count.id,
        totalTokens: (s._sum.inputTokens ?? 0) + (s._sum.outputTokens ?? 0),
        costCentsUsd: s._sum.costCentsUsd ?? 0
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens),
    byProvider: byProvider
      .map((p) => ({
        provider: p.provider,
        requests: p._count.id,
        totalTokens: (p._sum.inputTokens ?? 0) + (p._sum.outputTokens ?? 0),
        costCentsUsd: p._sum.costCentsUsd ?? 0
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      name: userMap.get(u.userId)?.name ?? null,
      email: userMap.get(u.userId)?.email ?? u.userId,
      requests: u._count.id,
      totalTokens: (u._sum.inputTokens ?? 0) + (u._sum.outputTokens ?? 0),
      costCentsUsd: u._sum.costCentsUsd ?? 0
    }))
  }
}

export default async function TokenUsagePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const ctx = await resolveTenantContextForUser(session.user.id)
  if (ctx.status !== "single") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-[20px] font-semibold text-gray-950">Mandantenkontext nicht eindeutig</h1>
      </div>
    )
  }

  const platformRole = (session.user as { role?: string }).role
  const isPlatformAdmin = platformRole === "ADMIN" || platformRole === "OWNER"
  if (!isPlatformAdmin) {
    const membership = await prisma.tenantMember.findFirst({
      where: { tenantId: ctx.tenantId, userId: session.user.id },
      select: { role: true }
    })
    if (membership?.role !== "ADMIN") redirect("/dashboard")
  }

  const data = await loadTokenData(ctx.tenantId)
  const isEmpty = data.totals.requests === 0

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📊 Verwaltung</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Token-Verbrauch</h1>
      <p className="mt-2 text-[14px] text-gray-500">KI-Nutzung und Kosten Ihres Mandanten — letzte 30 Tage und gesamt.</p>

      {isEmpty ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center">
          <span className="text-[40px]">📊</span>
          <h2 className="mt-4 text-[18px] font-semibold text-gray-900">Noch keine Daten</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-gray-500">
            Sobald Analysen oder Copilot-Anfragen ausgeführt werden, erscheint hier die Verbrauchsübersicht.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards — Gesamt */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gesamt-Tokens</p>
              <p className="mt-2 text-[28px] font-semibold text-gray-900">{fmt(data.totals.totalTokens)}</p>
              <p className="mt-1 text-[12px] text-gray-400">{data.totals.requests} Anfragen gesamt</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gesamtkosten</p>
              <p className="mt-2 text-[28px] font-semibold text-gray-900">{fmtCost(data.totals.costCentsUsd)}</p>
              <p className="mt-1 text-[12px] text-gray-400">geschätzter USD-Betrag</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Letzte 30 Tage</p>
              <p className="mt-2 text-[28px] font-semibold text-gray-900">{fmt(data.recent.totalTokens)}</p>
              <p className="mt-1 text-[12px] text-gray-400">{fmtCost(data.recent.costCentsUsd)} · {data.recent.requests} Anfragen</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* By Source */}
            {data.bySource.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="border-b border-gray-100 px-5 py-3">
                  <h2 className="text-[13px] font-semibold text-gray-900">Verbrauch nach Quelle (30 Tage)</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {data.bySource.map((s) => (
                    <div key={s.source} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-gray-900">{SOURCE_LABELS[s.source] ?? s.source}</p>
                        <p className="text-[11px] text-gray-400">{s.requests} Anfragen</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-gray-900">{fmt(s.totalTokens)} Tokens</p>
                        <p className="text-[11px] text-gray-400">{fmtCost(s.costCentsUsd)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Provider */}
            {data.byProvider.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white">
                <div className="border-b border-gray-100 px-5 py-3">
                  <h2 className="text-[13px] font-semibold text-gray-900">Verbrauch nach Anbieter (30 Tage)</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {data.byProvider.map((p) => (
                    <div key={p.provider} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 capitalize">{p.provider}</p>
                        <p className="text-[11px] text-gray-400">{p.requests} Anfragen</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-gray-900">{fmt(p.totalTokens)} Tokens</p>
                        <p className="text-[11px] text-gray-400">{fmtCost(p.costCentsUsd)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Users */}
          {data.topUsers.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-100 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <h2 className="text-[13px] font-semibold text-gray-900">Top-Nutzer nach Verbrauch (letzte 30 Tage)</h2>
              </div>
              <div className="hidden grid-cols-[1fr_80px_100px_100px] gap-0 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:grid">
                <span>Nutzer</span><span className="text-right">Anfragen</span><span className="text-right">Tokens</span><span className="text-right">Kosten</span>
              </div>
              <div className="divide-y divide-gray-50">
                {data.topUsers.map((u, i) => (
                  <div key={u.userId} className="grid px-5 py-3 sm:grid-cols-[1fr_80px_100px_100px] sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[11px] font-bold text-gold-700">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900">{u.name ?? u.email}</p>
                        {u.name && <p className="text-[11px] text-gray-400">{u.email}</p>}
                      </div>
                    </div>
                    <p className="mt-1 text-right text-[13px] text-gray-700 sm:mt-0">{u.requests}</p>
                    <p className="mt-1 text-right text-[13px] text-gray-700 sm:mt-0">{fmt(u.totalTokens)}</p>
                    <p className="mt-1 text-right text-[13px] font-medium text-gray-900 sm:mt-0">{fmtCost(u.costCentsUsd)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-[11px] text-gray-400">
            * Kosten sind Schätzwerte in USD basierend auf publizierten Modellpreisen. Kein verbindlicher Rechnungsbetrag.
          </p>
        </>
      )}

      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurück zur Verwaltung</Link>
      </div>
    </div>
  )
}
