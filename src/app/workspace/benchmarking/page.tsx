"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type HistoryEntry = {
  id: string
  date: string
  riskScore: number | null
  findingsCount: number
  product: string
  model: string
}

type SupplierData = {
  name: string
  contracts: number
  avgRisk: number
  highRiskCount: number
  totalFindings: number
  lastAnalysis: string
}

export default function BenchmarkingPage() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])
  const [sortBy, setSortBy] = useState<"risk" | "contracts" | "name">("risk")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kanzlei-analysis-history")
      if (!stored) return
      const history: HistoryEntry[] = JSON.parse(stored)

      const supplierMap = new Map<string, { scores: number[]; findings: number; dates: string[] }>()
      for (const entry of history) {
        const name = entry.product || "Unbekannt"
        const existing = supplierMap.get(name) || { scores: [], findings: 0, dates: [] }
        if (entry.riskScore !== null) existing.scores.push(entry.riskScore)
        existing.findings += entry.findingsCount
        existing.dates.push(entry.date)
        supplierMap.set(name, existing)
      }

      const result: SupplierData[] = []
      supplierMap.forEach((data, name) => {
        const avgRisk = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0
        result.push({
          name,
          contracts: data.dates.length,
          avgRisk,
          highRiskCount: data.scores.filter(s => s >= 70).length,
          totalFindings: data.findings,
          lastAnalysis: data.dates.sort().reverse()[0]
        })
      })

      setSuppliers(result)
    } catch {}
  }, [])

  const sorted = [...suppliers].sort((a, b) => {
    if (sortBy === "risk") return b.avgRisk - a.avgRisk
    if (sortBy === "contracts") return b.contracts - a.contracts
    return a.name.localeCompare(b.name)
  })

  const totalContracts = suppliers.reduce((s, x) => s + x.contracts, 0)
  const avgRiskAll = suppliers.length > 0 ? Math.round(suppliers.reduce((s, x) => s + x.avgRisk, 0) / suppliers.length) : 0
  const highRiskSuppliers = suppliers.filter(s => s.avgRisk >= 70).length

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📊 Einkauf</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Lieferanten-Benchmarking</h1>
          <p className="mt-2 text-[14px] text-gray-500">Risiko-Uebersicht und Konditionen-Vergleich aller analysierten Lieferantenvertraege.</p>
        </div>
        <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">+ Vertrag analysieren</Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{suppliers.length}</p>
          <p className="text-[11px] text-gray-400">Lieferanten</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{totalContracts}</p>
          <p className="text-[11px] text-gray-400">Vertraege analysiert</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className={`text-[22px] font-semibold ${avgRiskAll >= 70 ? "text-red-600" : avgRiskAll >= 40 ? "text-amber-600" : "text-emerald-600"}`}>{avgRiskAll || "—"}</p>
          <p className="text-[11px] text-gray-400">Ø Risiko-Score</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-red-600">{highRiskSuppliers}</p>
          <p className="text-[11px] text-gray-400">Hochrisiko-Lieferanten</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mt-6 flex gap-2">
        {[
          { key: "risk" as const, label: "Nach Risiko" },
          { key: "contracts" as const, label: "Nach Vertraegen" },
          { key: "name" as const, label: "Alphabetisch" },
        ].map((s) => (
          <button key={s.key} onClick={() => setSortBy(s.key)} className={`rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${sortBy === s.key ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{s.label}</button>
        ))}
      </div>

      {sorted.length > 0 ? (
        <>
          {/* Table */}
          <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_80px_80px_80px_80px_100px]">
            <span>Lieferant</span><span>Vertraege</span><span>Ø Risiko</span><span>Hochrisiko</span><span>Findings</span><span>Letzte Analyse</span>
          </div>
          <div className="overflow-hidden rounded-b-xl border border-gray-200">
            {sorted.map((s) => (
              <div key={s.name} className="grid border-b border-gray-100 bg-white px-5 py-3.5 last:border-b-0 sm:grid-cols-[1fr_80px_80px_80px_80px_100px] sm:items-center">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white ${s.avgRisk >= 70 ? "bg-red-500" : s.avgRisk >= 40 ? "bg-amber-500" : "bg-emerald-500"}`}>{s.name.charAt(0)}</div>
                  <span className="text-[14px] font-medium text-gray-900">{s.name}</span>
                </div>
                <span className="mt-1 text-[14px] text-gray-700 sm:mt-0">{s.contracts}</span>
                <span className={`mt-1 text-[14px] font-semibold sm:mt-0 ${s.avgRisk >= 70 ? "text-red-600" : s.avgRisk >= 40 ? "text-amber-600" : "text-emerald-600"}`}>{s.avgRisk}</span>
                <span className="mt-1 text-[14px] text-red-600 sm:mt-0">{s.highRiskCount}</span>
                <span className="mt-1 text-[14px] text-gray-500 sm:mt-0">{s.totalFindings}</span>
                <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{new Date(s.lastAnalysis).toLocaleDateString("de-DE")}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <span className="text-[40px]">📊</span>
          <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Noch keine Lieferantendaten</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Analysieren Sie Lieferantenvertraege ueber die Schnellanalyse. Die Ergebnisse erscheinen automatisch im Benchmarking.</p>
          <Link href="/workspace/analyse" className="mt-6 inline-block rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">⚡ Ersten Vertrag analysieren</Link>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">So funktioniert das Benchmarking</h3>
        <p className="mt-2 text-[13px] text-gray-500">Das Benchmarking aggregiert automatisch alle Analyseergebnisse nach Lieferantenname. Je mehr Vertraege Sie analysieren, desto aussagekraeftiger wird die Uebersicht. Der Risiko-Score wird pro Lieferant gemittelt.</p>
      </div>
    </div>
  )
}
