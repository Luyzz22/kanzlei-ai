"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type HistoryEntry = {
  id: string
  date: string
  model: string
  riskScore: number | null
  summary: string
  findingsCount: number
  product: string
  textLength: number
  analysis: Record<string, unknown>
  textPreview: string
}

function getRiskColor(score: number | null) {
  if (score === null) return { bg: "bg-gray-100", text: "text-gray-500", label: "—" }
  if (score >= 70) return { bg: "bg-red-100", text: "text-red-700", label: "Hoch" }
  if (score >= 40) return { bg: "bg-amber-100", text: "text-amber-700", label: "Mittel" }
  return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Gering" }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kanzlei-analysis-history")
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  const clearHistory = () => {
    if (confirm("Alle gespeicherten Analysen löschen?")) {
      localStorage.removeItem("kanzlei-analysis-history")
      setHistory([])
    }
  }

  const loadInCopilot = (entry: HistoryEntry) => {
    sessionStorage.setItem("kanzlei-copilot-context", JSON.stringify({
      contractText: entry.textPreview,
      analysis: entry.analysis,
      timestamp: entry.date
    }))
    window.location.href = "/workspace/copilot"
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Verlauf</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Analyseverlauf</h1>
          <p className="mt-1 text-[14px] text-gray-500">{history.length} Analysen gespeichert</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">⚡ Neue Analyse</Link>
          {history.length > 0 && (
            <button onClick={clearHistory} className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50">Löschen</button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <span className="text-[36px]">📄</span>
          <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Noch keine Analysen</h2>
          <p className="mt-2 text-[14px] text-gray-500">Analysieren Sie einen Vertrag — er wird automatisch hier gespeichert.</p>
          <Link href="/workspace/analyse" className="mt-6 inline-block rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">⚡ Erste Analyse starten</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => {
            const risk = getRiskColor(entry.riskScore)
            return (
              <div key={entry.id} className="rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold text-gray-900">📄 {entry.product}</h3>
                      {entry.riskScore !== null && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${risk.bg} ${risk.text}`}>
                          {entry.riskScore} · {risk.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-gray-500">{entry.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-400">
                      <span>{new Date(entry.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>{entry.model}</span>
                      <span>{entry.findingsCount} Risiken</span>
                      <span>{entry.textLength.toLocaleString()} Zeichen</span>
                    </div>
                  </div>
                  <button
                    onClick={() => loadInCopilot(entry)}
                    className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700"
                  >
                    🤖 Copilot
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
