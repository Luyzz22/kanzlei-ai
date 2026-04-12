"use client"

import { useState } from "react"
import Link from "next/link"

type ReviewItem = {
  id: string
  title: string
  riskScore: number
  stage: "eingereicht" | "in_pruefung" | "rueckfrage" | "freigegeben"
  assignee: string
  submitted: string
  findings: number
}

const demoItems: ReviewItem[] = [
  { id: "R-001", title: "Supplier Agreement — TechVendor GmbH", riskScore: 78, stage: "eingereicht", assignee: "—", submitted: "Heute, 10:30", findings: 5 },
  { id: "R-002", title: "NDA — Cloud Provider Inc.", riskScore: 65, stage: "in_pruefung", assignee: "demo@kanzlei-ai.com", submitted: "Gestern", findings: 3 },
  { id: "R-003", title: "Rahmenvertrag — Logistik AG", riskScore: 42, stage: "freigegeben", assignee: "ki@sbsdeutschland.de", submitted: "09.04.2026", findings: 2 },
  { id: "R-004", title: "SaaS Agreement — Analytics Ltd", riskScore: 71, stage: "rueckfrage", assignee: "demo@kanzlei-ai.com", submitted: "08.04.2026", findings: 4 },
]

const stages = [
  { key: "eingereicht", label: "Eingereicht", emoji: "📥", color: "bg-blue-500" },
  { key: "in_pruefung", label: "In Pruefung", emoji: "🔍", color: "bg-amber-500" },
  { key: "rueckfrage", label: "Rueckfrage", emoji: "💬", color: "bg-purple-500" },
  { key: "freigegeben", label: "Freigegeben", emoji: "✅", color: "bg-emerald-500" },
]

export default function ReviewQueuePage() {
  const [filter, setFilter] = useState("alle")

  const filtered = filter === "alle" ? demoItems : demoItems.filter(r => r.stage === filter)

  const stageColor = (s: string) => {
    if (s === "freigegeben") return "bg-emerald-100 text-emerald-700"
    if (s === "in_pruefung") return "bg-amber-100 text-amber-700"
    if (s === "rueckfrage") return "bg-purple-100 text-purple-700"
    return "bg-blue-100 text-blue-700"
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✅ Governance</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Review & Freigabe</h1>
      <p className="mt-2 text-[14px] text-gray-500">Strukturierte Pruefprozesse fuer analysierte Vertraege. Hochrisiko-Vertraege (Score ≥ 70) landen automatisch hier.</p>

      {/* Pipeline */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {stages.map((s) => {
          const count = demoItems.filter(r => r.stage === s.key).length
          return (
            <button key={s.key} onClick={() => setFilter(filter === s.key ? "alle" : s.key)} className={`rounded-xl border p-4 text-center transition-all ${filter === s.key ? "border-[#003856] bg-[#003856]/5 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</span>
              </div>
              <p className="mt-1 text-[24px] font-bold text-gray-900">{count}</p>
              <p className="text-[14px]">{s.emoji}</p>
            </button>
          )
        })}
      </div>

      {/* Info Banner */}
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-[16px]">⚡</span>
        <p className="text-[13px] text-amber-800">Vertraege mit Risiko-Score ≥ 70 werden automatisch in die Review-Queue eingereicht. <Link href="/dashboard/admin/approval-policies" className="font-medium underline">Freigabeprozesse konfigurieren →</Link></p>
      </div>

      {/* Table */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_80px_100px_140px_100px]">
        <span>Vertrag</span><span>Risiko</span><span>Status</span><span>Zugewiesen</span><span>Eingereicht</span>
      </div>
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {filtered.map((item) => (
          <div key={item.id} className="grid border-b border-gray-100 bg-white px-5 py-4 last:border-b-0 transition-colors hover:bg-gold-50/30 sm:grid-cols-[1fr_80px_100px_140px_100px] sm:items-center">
            <div>
              <p className="text-[14px] font-medium text-gray-900">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{item.id} · {item.findings} Findings</p>
            </div>
            <div className="mt-1 sm:mt-0">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[12px] font-bold ${item.riskScore >= 70 ? "bg-red-100 text-red-700" : item.riskScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{item.riskScore}</span>
            </div>
            <span className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-0 ${stageColor(item.stage)}`}>{stages.find(s => s.key === item.stage)?.label}</span>
            <span className="mt-1 text-[12px] text-gray-500 sm:mt-0">{item.assignee}</span>
            <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{item.submitted}</span>
          </div>
        ))}
      </div>

      {/* Workflow */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Review-Workflow</h3>
        <div className="mt-4 flex items-center justify-between gap-2">
          {stages.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] text-white ${s.color}`}>{s.emoji}</span>
                <span className="mt-1 text-[10px] font-medium text-gray-500">{s.label}</span>
              </div>
              {i < stages.length - 1 && <div className="h-px w-8 bg-gray-300 sm:w-16" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
