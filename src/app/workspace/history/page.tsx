"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type HistoryEntry = {
  id: string
  date: string
  model: string
  riskScore: number | null
  findingsCount: number
  product: string
  result?: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [search, setSearch] = useState("")
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kanzlei-analysis-history")
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  const filtered = search
    ? history.filter(h => h.product.toLowerCase().includes(search.toLowerCase()) || h.model.toLowerCase().includes(search.toLowerCase()))
    : history

  const loadInCopilot = (entry: HistoryEntry) => {
    if (entry.result) {
      sessionStorage.setItem("copilot-contract-context", entry.result)
      sessionStorage.setItem("copilot-contract-name", entry.product)
      window.location.href = "/workspace/copilot"
    }
  }

  const exportCSV = async () => {
    setExporting("csv")
    try {
      const res = await fetch("/api/export/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses: filtered })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `analysen-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExporting(null) }
  }

  const exportDATEV = async () => {
    setExporting("datev")
    try {
      const res = await fetch("/api/export/datev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses: filtered })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `datev-export-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExporting(null) }
  }

  const clearHistory = () => {
    if (confirm("Alle Analysen aus dem Verlauf löschen?")) {
      localStorage.removeItem("kanzlei-analysis-history")
      setHistory([])
    }
  }

  const avgRisk = filtered.filter(h => h.riskScore !== null).length > 0
    ? Math.round(filtered.filter(h => h.riskScore !== null).reduce((s, h) => s + (h.riskScore || 0), 0) / filtered.filter(h => h.riskScore !== null).length)
    : null

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Analyseverlauf</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={!filtered.length || exporting === "csv"} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {exporting === "csv" ? "..." : "📊 CSV"}
          </button>
          <button onClick={exportDATEV} disabled={!filtered.length || exporting === "datev"} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {exporting === "datev" ? "..." : "🏦 DATEV"}
          </button>
          <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]">⚡ Neue Analyse</Link>
        </div>
      </div>

      {/* Stats Bar */}
      {history.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <p className="text-[18px] font-semibold text-gray-950">{filtered.length}</p>
            <p className="text-[11px] text-gray-400">Analysen</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <p className={`text-[18px] font-semibold ${avgRisk !== null ? (avgRisk >= 70 ? "text-red-600" : avgRisk >= 40 ? "text-amber-600" : "text-emerald-600") : "text-gray-400"}`}>
              {avgRisk ?? "—"}
            </p>
            <p className="text-[11px] text-gray-400">Ø Risiko</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <p className="text-[18px] font-semibold text-gray-950">{filtered.reduce((s, h) => s + h.findingsCount, 0)}</p>
            <p className="text-[11px] text-gray-400">Risiken gesamt</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
            <p className="text-[18px] font-semibold text-gray-950">{filtered.filter(h => (h.riskScore ?? 0) >= 70).length}</p>
            <p className="text-[11px] text-gray-400">Hochrisiko</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="🔍 Analysen durchsuchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <span className="text-[40px]">📋</span>
          <h2 className="mt-4 text-[17px] font-semibold text-gray-900">{search ? "Keine Treffer" : "Noch keine Analysen"}</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">{search ? "Versuchen Sie einen anderen Suchbegriff." : "Starten Sie Ihre erste Vertragsanalyse."}</p>
          {!search && <Link href="/workspace/analyse" className="mt-6 inline-block rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">⚡ Schnellanalyse starten</Link>}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.map((entry) => (
            <Link
              key={entry.id}
              href={`/workspace/history/${entry.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all hover:border-gold-300 hover:shadow-card"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${(entry.riskScore ?? 0) >= 70 ? "bg-red-100" : (entry.riskScore ?? 0) >= 40 ? "bg-amber-100" : "bg-emerald-100"}`}>
                  <span className={`text-[14px] font-bold ${(entry.riskScore ?? 0) >= 70 ? "text-red-700" : (entry.riskScore ?? 0) >= 40 ? "text-amber-700" : "text-emerald-700"}`}>
                    {entry.riskScore ?? "—"}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-gray-900">{entry.product}</p>
                  <p className="text-[12px] text-gray-400">
                    {new Date(entry.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{entry.model} · {entry.findingsCount} Risiken
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entry.result && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadInCopilot(entry) }}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    🤖 Copilot
                  </button>
                )}
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${(entry.riskScore ?? 0) >= 70 ? "bg-red-100 text-red-700" : (entry.riskScore ?? 0) >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {(entry.riskScore ?? 0) >= 70 ? "Hoch" : (entry.riskScore ?? 0) >= 40 ? "Mittel" : "Niedrig"}
                </span>
                <span className="text-[14px] text-gray-300">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      {history.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-[12px] text-gray-400">{history.length} Analysen gespeichert (lokal)</p>
          <button onClick={clearHistory} className="text-[12px] font-medium text-red-500 hover:text-red-600">Verlauf löschen</button>
        </div>
      )}
    </div>
  )
}
