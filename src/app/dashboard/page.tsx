"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type HistoryEntry = {
  id: string
  date: string
  riskScore: number | null
  findingsCount: number
  product: string
  model: string
}

const quickActions = [
  { label: "⚡ Schnellanalyse", href: "/workspace/analyse", desc: "PDF hochladen, KI analysiert sofort Risiken — DE & EN", emoji: "🔍" },
  { label: "⚖️ AGB-Vergleich", href: "/workspace/vergleich", desc: "Lieferanten-AGB gegen Ihre AEB Klausel fuer Klausel abgleichen", emoji: "📋" },
  { label: "🤖 Contract Copilot", href: "/workspace/copilot", desc: "KI-Assistent fuer Vertragsfragen und Risikoanalyse", emoji: "💬" },
  { label: "📊 Benchmarking", href: "/workspace/benchmarking", desc: "Lieferanten-Risiko-Ranking und Konditionen-Vergleich", emoji: "📈" },
  { label: "📋 Analyseverlauf", href: "/workspace/history", desc: "Vergangene Analysen einsehen und im Copilot oeffnen", emoji: "📊" },
  { label: "📁 Faelle & Mandate", href: "/workspace/faelle", desc: "Vertraege mandatsbezogen organisieren", emoji: "🗂️" },
  { label: "✅ Review-Queue", href: "/workspace/review-queue", desc: "Offene Pruefvorgaenge bearbeiten", emoji: "✏️" },
  { label: "📂 Dokumente", href: "/workspace/dokumente", desc: "Alle Vertraege und Dokumente einsehen", emoji: "📄" },
]

export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Laden...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kanzlei-analysis-history")
      if (stored) setHistory(JSON.parse(stored))
    } catch {}

    const checkout = searchParams.get("checkout")
    if (checkout === "success") setCheckoutMsg("✅ Plan erfolgreich aktiviert!")
    if (checkout === "cancelled") setCheckoutMsg("ℹ️ Checkout abgebrochen.")
  }, [searchParams])

  const totalAnalyses = history.length
  const avgRisk = history.filter(h => h.riskScore !== null).length > 0
    ? Math.round(history.filter(h => h.riskScore !== null).reduce((sum, h) => sum + (h.riskScore || 0), 0) / history.filter(h => h.riskScore !== null).length)
    : null
  const totalFindings = history.reduce((sum, h) => sum + h.findingsCount, 0)
  const lastAnalysis = history[0]

  return (
    <div className="space-y-8">
      {checkoutMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-700">
          {checkoutMsg}
        </div>
      )}

      <div>
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-950">Dashboard</h1>
        <p className="mt-1 text-[14px] text-gray-500">Überblick über Ihre Vertragsanalysen und Workflows.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/workspace/history" className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-card">
          <p className="text-[12px] font-medium text-gray-400">Analysen gesamt</p>
          <p className="mt-1 text-[1.5rem] font-semibold text-gray-950">{totalAnalyses || "—"}</p>
        </Link>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[12px] font-medium text-gray-400">Ø Risiko-Score</p>
          <p className={`mt-1 text-[1.5rem] font-semibold ${avgRisk !== null ? (avgRisk >= 70 ? "text-red-600" : avgRisk >= 40 ? "text-amber-600" : "text-emerald-600") : "text-gray-950"}`}>
            {avgRisk !== null ? avgRisk : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[12px] font-medium text-gray-400">Risiken identifiziert</p>
          <p className="mt-1 text-[1.5rem] font-semibold text-gray-950">{totalFindings || "—"}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[12px] font-medium text-gray-400">Letzte Analyse</p>
          <p className="mt-1 truncate text-[14px] font-semibold text-gray-950">{lastAnalysis ? lastAnalysis.product : "—"}</p>
          {lastAnalysis && <p className="text-[11px] text-gray-400">{new Date(lastAnalysis.date).toLocaleDateString("de-DE")}</p>}
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
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900">Letzte Analysen</h2>
            <Link href="/workspace/history" className="text-[12px] font-medium text-gold-700 hover:text-gold-600">Alle anzeigen →</Link>
          </div>
          <div className="mt-3 space-y-2">
            {history.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-[16px]">📄</span>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{entry.product}</p>
                    <p className="text-[11px] text-gray-400">{new Date(entry.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {entry.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.riskScore !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${entry.riskScore >= 70 ? "bg-red-100 text-red-700" : entry.riskScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {entry.riskScore}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">{entry.findingsCount} Risiken</span>
                </div>
              </div>
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
          Datenbank verbunden · Claude Sonnet 4 + GPT-4o + Gemini aktiv · Audit Trail aktiv · Security Headers aktiv
        </p>
      </div>
    </div>
  )
}
