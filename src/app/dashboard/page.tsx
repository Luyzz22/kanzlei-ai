"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ReleaseNotesWidget } from "@/components/dashboard/release-notes-widget"

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
  severityDistribution?: { hoch: number; mittel: number; niedrig: number }
  reviewDistribution?: Array<{ state: string; count: number }>
  classificationDistribution?: Array<{ type: string; count: number }>
  topCategories?: Array<{ category: string; count: number }>
}

const quickActions = [
  { label: "⚡ Schnellanalyse", href: "/workspace/analyse", desc: "PDF hochladen, KI analysiert sofort Risiken — DE & EN", emoji: "\u{1F50D}" },
  { label: "⚖️ AGB-Vergleich", href: "/workspace/vergleich", desc: "Lieferanten-AGB gegen Ihre AEB Klausel für Klausel abgleichen", emoji: "\u{1F4CB}" },
  { label: "\u{1F916} Contract Copilot", href: "/workspace/copilot", desc: "KI-Assistent für Vertragsfragen und Risikoanalyse", emoji: "\u{1F4AC}" },
  { label: "\u{1F4CA} Benchmarking", href: "/workspace/benchmarking", desc: "Lieferanten-Risiko-Ranking und Konditionen-Vergleich", emoji: "\u{1F4C8}" },
  { label: "\u{1F4CB} Analyseverlauf", href: "/workspace/history", desc: "Vergangene Analysen einsehen und im Copilot öffnen", emoji: "\u{1F4CA}" },
  { label: "\u{1F4C1} Faelle & Mandate", href: "/workspace/faelle", desc: "Verträge mandatsbezogen organisieren", emoji: "\u{1F5C2}️" },
  { label: "✅ Review-Queue", href: "/workspace/review-queue", desc: "Offene Prüfvorgänge bearbeiten", emoji: "✏️" },
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

      {!loading && stats && stats.totalAnalyses === 0 && (
        <div className="rounded-2xl border border-dashed border-[#C8985A]/40 bg-[#C8985A]/5 p-8 text-center">
          <span className="text-[48px]">📋</span>
          <h2 className="mt-4 text-[18px] font-semibold text-gray-900">Willkommen bei KanzleiAI</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
            Noch keine Vertragsanalysen vorhanden. Laden Sie Ihren ersten Vertrag hoch — die KI analysiert Risiken, Klauseln und Handlungsempfehlungen in Sekunden.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/workspace/upload" className="inline-flex items-center gap-2 rounded-full bg-[#003856] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#002a42]">
              📤 Ersten Vertrag hochladen
            </a>
            <a href="/workspace/analyse" className="inline-flex items-center gap-2 rounded-full border border-[#003856] px-6 py-2.5 text-[13px] font-semibold text-[#003856] hover:bg-[#003856]/5">
              ⚡ Schnellanalyse starten
            </a>
          </div>
        </div>
      )}

      {/* Release Notes — dynamische 3-Eintrag-Liste (ersetzt vormals hardcoded "v3.1"-Banner) */}
      <ReleaseNotesWidget count={3} />

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

      {/* Analytics Section */}
      {stats && stats.totalFindings > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Analytics</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Severity Distribution */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[12px] font-medium text-gray-400">Severity-Verteilung</p>
              <div className="mt-3 space-y-2">
                {(() => {
                  const sd = stats.severityDistribution ?? { hoch: 0, mittel: 0, niedrig: 0 }
                  const total = sd.hoch + sd.mittel + sd.niedrig
                  if (total === 0) return <p className="text-[11px] text-gray-400">Keine Daten</p>
                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-[11px]"><span className="text-rose-700">Hoch</span><span className="font-semibold text-gray-900">{sd.hoch}</span></div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${(sd.hoch / total) * 100}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px]"><span className="text-amber-700">Mittel</span><span className="font-semibold text-gray-900">{sd.mittel}</span></div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(sd.mittel / total) * 100}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px]"><span className="text-slate-600">Niedrig</span><span className="font-semibold text-gray-900">{sd.niedrig}</span></div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-slate-400 transition-all" style={{ width: `${(sd.niedrig / total) * 100}%` }} /></div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Review Status */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[12px] font-medium text-gray-400">Pr{"ü"}fstatus</p>
              <div className="mt-3 space-y-2">
                {(stats.reviewDistribution ?? []).map((r: { state: string; count: number }) => {
                  const label = r.state === "FREIGEGEBEN" ? "Freigegeben" : r.state === "IN_PRUEFUNG" ? "In Pr\u00fcfung" : r.state === "ANALYSIERT" ? "Analysiert" : r.state === "UNGEPRUEFT" ? "Ungepr\u00fcft" : r.state
                  const color = r.state === "FREIGEGEBEN" ? "bg-emerald-500" : r.state === "IN_PRUEFUNG" ? "bg-[#003856]" : "bg-gray-300"
                  return (
                    <div key={r.state} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      <span className="flex-1 text-[11px] text-gray-600">{label}</span>
                      <span className="text-[12px] font-semibold text-gray-900">{r.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Risk Categories */}
            <div className="rounded-xl border border-gray-100 bg-white p-5">
              <p className="text-[12px] font-medium text-gray-400">H{"ä"}ufigste Risikokategorien</p>
              <div className="mt-3 space-y-1.5">
                {(stats.topCategories ?? []).slice(0, 6).map((c: { category: string; count: number }, i: number) => {
                  const maxCount = stats.topCategories?.[0]?.count ?? 1
                  return (
                    <div key={c.category} className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#003856] transition-all" style={{ width: `${(c.count / maxCount) * 100}%`, opacity: 1 - i * 0.1 }} />
                      </div>
                      <span className="w-24 truncate text-right text-[10px] text-gray-600">{c.category}</span>
                      <span className="w-6 text-right text-[11px] font-semibold text-gray-900">{c.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
