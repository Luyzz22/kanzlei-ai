"use client"

import { useState } from "react"
import Link from "next/link"

type Fall = {
  id: string
  name: string
  status: "offen" | "in_pruefung" | "abgeschlossen"
  contracts: number
  riskAvg: number
  created: string
  owner: string
}

const demoFaelle: Fall[] = [
  { id: "F-2026-001", name: "DERMALOG Lieferantenvertraege", status: "in_pruefung", contracts: 3, riskAvg: 62, created: "11.04.2026", owner: "demo@kanzlei-ai.com" },
  { id: "F-2026-002", name: "Q2 NDA-Review Zulieferer", status: "offen", contracts: 5, riskAvg: 45, created: "10.04.2026", owner: "demo@kanzlei-ai.com" },
  { id: "F-2026-003", name: "IT-Rahmenvertraege 2026", status: "abgeschlossen", contracts: 8, riskAvg: 38, created: "05.04.2026", owner: "ki@sbsdeutschland.de" },
]

export default function FaellePage() {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState("alle")

  const filtered = filter === "alle" ? demoFaelle : demoFaelle.filter(f => f.status === filter)

  const statusColor = (s: string) => {
    if (s === "abgeschlossen") return "bg-emerald-100 text-emerald-700"
    if (s === "in_pruefung") return "bg-amber-100 text-amber-700"
    return "bg-blue-100 text-blue-700"
  }
  const statusLabel = (s: string) => {
    if (s === "abgeschlossen") return "Abgeschlossen"
    if (s === "in_pruefung") return "In Pruefung"
    return "Offen"
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📁 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Faelle & Mandate</h1>
          <p className="mt-2 text-[14px] text-gray-500">Vertraege mandatsbezogen organisieren und nach Projekt oder Geschaeftsbereich zuordnen.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">+ Neuer Fall</button>
      </div>

      {showCreate && (
        <div className="mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-6">
          <h3 className="text-[15px] font-semibold text-gray-900">Neuen Fall anlegen</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
            <input type="text" placeholder="Fallname (z.B. Q2 NDA-Review)" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
            <button className="rounded-full bg-[#003856] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">Anlegen</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">{demoFaelle.length}</p>
          <p className="text-[11px] text-gray-400">Faelle gesamt</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-blue-600">{demoFaelle.filter(f => f.status === "offen").length}</p>
          <p className="text-[11px] text-gray-400">Offen</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-amber-600">{demoFaelle.filter(f => f.status === "in_pruefung").length}</p>
          <p className="text-[11px] text-gray-400">In Pruefung</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-emerald-600">{demoFaelle.filter(f => f.status === "abgeschlossen").length}</p>
          <p className="text-[11px] text-gray-400">Abgeschlossen</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {[
          { key: "alle", label: "Alle" },
          { key: "offen", label: "Offen" },
          { key: "in_pruefung", label: "In Pruefung" },
          { key: "abgeschlossen", label: "Abgeschlossen" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${filter === f.key ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_100px_80px_80px_100px]">
        <span>Fall</span><span>Status</span><span>Vertraege</span><span>Ø Risiko</span><span>Erstellt</span>
      </div>
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {filtered.map((fall) => (
          <Link key={fall.id} href={`/workspace/faelle`} className="grid border-b border-gray-100 bg-white px-5 py-4 last:border-b-0 transition-colors hover:bg-gold-50/30 sm:grid-cols-[1fr_100px_80px_80px_100px] sm:items-center">
            <div>
              <p className="text-[14px] font-medium text-gray-900">{fall.name}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{fall.id} · {fall.owner}</p>
            </div>
            <span className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-0 ${statusColor(fall.status)}`}>{statusLabel(fall.status)}</span>
            <span className="mt-1 text-[14px] text-gray-700 sm:mt-0">{fall.contracts}</span>
            <span className={`mt-1 text-[14px] font-semibold sm:mt-0 ${fall.riskAvg >= 60 ? "text-amber-600" : "text-emerald-600"}`}>{fall.riskAvg}</span>
            <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{fall.created}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
