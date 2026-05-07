"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type DashboardStats = {
  totalAnalyses: number
  completedAnalyses: number
  avgRiskScore: number | null
  totalFindings: number
  lastAnalysis: {
    completedAt: string | null
    riskScore: number | null
    model: string | null
    title: string | null
  } | null
  history: Array<{
    id: string
    documentId: string
    title: string
    documentType: string
    organizationName: string
    riskScore: number | null
    findingsCount: number
    highFindings: number
    model: string
    completedAt: string | null
  }>
}

const quickActions = [
  { label: "⚡ Schnellanalyse", href: "/workspace/analyse", desc: "PDF hochladen, KI analysiert sofort Risiken — DE & EN", emoji: "\u{1F50D}" },
  { label: "⚖️ AGB-Vergleich", href: "/workspace/vergleich", desc: "Lieferanten-AGB gegen Ihre AEB Klausel für Klausel abgleichen", emoji: "\u{1F4CB}" },
  { label: "\u{1F916} Contract Copilot", href: "/workspace/copilot", desc: "KI-Assistent für Vertragsfragen und Risikoanalyse", emoji: "\u{1F4AC}" },
  { label: "\u{1F4CA} Benchmarking", href: "/workspace/benchmarking", desc: "Lieferanten-Risiko-Ranking und Konditionen-Vergleich", emoji: "\u{1F4C8}" },
  { label: "\u{1F4CB} Analyseverlauf", href: "/workspace/history", desc: "Vergangene Analysen einsehen und im Copilot öffnen", emoji: "\u{1F4CA}" },
  { label: "\u{1F4C1} Faelle & Mandate", href: "/workspace/faelle", desc: "Verträge mandatsbezogen organisieren", emoji: "\u{1F5C2}️" },
  { label: "✅ Review-Queue", href: "/workspace/review-queue", desc: "Offene Prüfvorgaenge bearbeiten", emoji: "✏️" },
  { label: "\u{1F4C2} Dokumente", href: "/workspace/dokumente", desc: "Alle Verträge und Dokumente einsehen", emoji: "\u{1F4C4}" },
]

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Laden...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
      .finally(() => setLoading(false))

    const checkout = searchParams.get("checkout")
    if (checkout === "success") setCheckoutMsg("✅ Plan erfolgreich aktiviert!")
    if (checkout === "cancelled") setCheckoutMsg("ℹ️ Checkout abgebrochen.")
  }, [searchParams])

  const avgRiskPct = stats?.avgRiskScore != null ? Math.round(stats.avgRiskScore * 100) : null

  return (
    <div className="space-y-8">
      {checkoutMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">
          {checkoutMsg}
        </div>
      )}

      {/* What's New Banner */}
      <Link href="/release-notes" className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50 px-5 py-3 transition-colors hover:bg-gold-100/50">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#003856] text-[10px] font-bold text-white">2.2</span>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-gray-900">Neu: Live-Verhandlungssimulator, Copilot Vertrags-Picker & Provider-Fix</p>
          <p className="text-[11px] text-gray-500">Claude Sonnet als Primary, max_tokens 16384, robuster JSON-Parser, Prisma-Fixes</p>
        </div>
        <span className="text-[12px] text-gold-600">Release Notes {"→"}</span>
      </Link>

      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-950">Dashboard</h1>
        <p className="mt-1 text-[14px] text-gray-500">{"Ü"}berblick {"ü"}ber Ihre Vertragsanalysen und Workflows.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/workspace/history" className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-card">
          <p className="text-[12px] font-medium text-gray-400">Analysen gesamt</p>
          <p className="mt-1 text-[1.5rem] font-semibold text-gray-950">{loading ? "…" : stats?.totalAnalyses ?? 0}</p>
          {stats && stats.completedAnalyses < stats.totalAnalyses && (
            <p className="text-[11px] text-gray-400">{stats.completedAnalyses} abgeschlossen</p>
          )}
        </Link>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[12px] font-medium text-gray-400">{"Ø"} Risiko-Score</p>
          <p className={`mt-1 text-[1.5rem] font-semibold ${avgRiskPct != null ? (avgRiskPct >= 70 ? "text-red-600" : avgRiskPct >= 40 ? "text-amber-600" : "text-emerald-600") : "text-gray-950"}`}>
            {loading ? "…" : avgRiskPct != null ? `${avgRiskPct}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[12px] font-medium text-gray-400">Risiken identifiziert</p>
          <p className="mt-1 text-[1.5rem] font-semibold text-gray-950">{loading ? "…" : stats?.totalFindings ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[12px] font-medium text-gray-400">Letzte Analyse</p>
          <p className="mt-1 truncate text-[14px] font-semibold text-gray-950">{loading ? "…" : stats?.lastAnalysis?.title ?? "—"}</p>
          {stats?.lastAnalysis?.completedAt && (
            <p className="text-[11px] text-gray-400">{dateFmt.format(new Date(stats.lastAnalysis.completedAt))}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900">Schnellzugriff</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gold-200 hover:shadow-card">
              <span className="text-[20px]">{action.emoji}</span>
              <div>
                <p className="text-[14px] font-medium text-gray-900">{action.label}</p>
                <p className="mt-0.5 text-[12px] text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Analyses */}
      {stats && stats.history.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900">Letzte Analysen</h2>
            <Link href="/workspace/history" className="text-[12px] font-medium text-gold-700 hover:text-gold-600">Alle anzeigen {"→"}</Link>
          </div>
          <div className="mt-3 space-y-2">
            {stats.history.slice(0, 5).map((entry) => (
              <Link key={entry.id} href={`/workspace/dokumente/${entry.documentId}`} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:bg-stone-50">
                <div className="flex items-center gap-3">
                  <span className="text-[16px]">{"\u{1F4C4}"}</span>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{entry.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {entry.completedAt ? dateFmt.format(new Date(entry.completedAt)) : "—"} {"·"} {entry.organizationName} {"·"} {entry.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.riskScore != null && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${entry.riskScore >= 0.7 ? "bg-red-100 text-red-700" : entry.riskScore >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {(entry.riskScore * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">{entry.findingsCount} Risiken</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-[13px] font-medium text-gray-700">System online</p>
        </div>
        <p className="mt-1 text-[12px] text-gray-500">
          Datenbank verbunden {"·"} Claude Sonnet 4 (Primary) {"·"} Audit Trail aktiv {"·"} max_tokens 16384
        </p>
      </div>
    </div>
  )
}
