"use client"

import { useState } from "react"
import Link from "next/link"

const demoDocs = [
  { id: "doc-001", name: "Supplier Agreement — TechVendor GmbH", type: "Lieferantenvertrag", risk: 78, date: "11.04.2026", status: "analysiert", lang: "EN" },
  { id: "doc-002", name: "NDA — Cloud Provider Inc.", type: "NDA", risk: 42, date: "10.04.2026", status: "analysiert", lang: "EN" },
  { id: "doc-003", name: "SaaS-Vertrag — Analytics Platform", type: "SaaS-Vertrag", risk: 65, date: "09.04.2026", status: "analysiert", lang: "DE" },
  { id: "doc-004", name: "Rahmenvertrag — Logistik AG", type: "Rahmenvertrag", risk: 38, date: "08.04.2026", status: "analysiert", lang: "DE" },
  { id: "doc-005", name: "Arbeitsvertrag — Entwurf Q2", type: "Arbeitsvertrag", risk: null, date: "07.04.2026", status: "ausstehend", lang: "DE" },
]

export default function DokumentePage() {
  const [filter, setFilter] = useState("alle")
  const [search, setSearch] = useState("")

  const filtered = demoDocs.filter(d => {
    if (filter === "analysiert" && d.status !== "analysiert") return false
    if (filter === "ausstehend" && d.status !== "ausstehend") return false
    if (filter === "hochrisiko" && (d.risk === null || d.risk < 70)) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📂 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Dokumenten-Workspace</h1>
          <p className="mt-1 text-[14px] text-gray-500">{demoDocs.length} Dokumente · Mandantengetrennt · RLS aktiv</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workspace/upload" className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">📤 Hochladen</Link>
          <Link href="/workspace/analyse" className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">⚡ Analyse</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">{demoDocs.length}</p>
          <p className="text-[10px] text-gray-400">Gesamt</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-emerald-600">{demoDocs.filter(d => d.status === "analysiert").length}</p>
          <p className="text-[10px] text-gray-400">Analysiert</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-amber-600">{demoDocs.filter(d => d.risk !== null && d.risk >= 70).length}</p>
          <p className="text-[10px] text-gray-400">Hochrisiko</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-blue-600">{demoDocs.filter(d => d.status === "ausstehend").length}</p>
          <p className="text-[10px] text-gray-400">Ausstehend</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "alle", label: "Alle" },
            { key: "analysiert", label: "✅ Analysiert" },
            { key: "ausstehend", label: "⏳ Ausstehend" },
            { key: "hochrisiko", label: "🔴 Hochrisiko" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${filter === f.key ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{f.label}</button>
          ))}
        </div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..." className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
      </div>

      {/* Table */}
      <div className="mt-4 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_120px_80px_100px_80px]">
        <span>Dokument</span><span>Typ</span><span>Risiko</span><span>Datum</span><span>Status</span>
      </div>
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {filtered.map((doc) => (
          <Link key={doc.id} href={`/workspace/dokumente/${doc.id}`} className="grid border-b border-gray-100 bg-white px-5 py-4 last:border-b-0 transition-colors hover:bg-gold-50/30 sm:grid-cols-[1fr_120px_80px_100px_80px] sm:items-center">
            <div>
              <p className="text-[14px] font-medium text-gray-900">{doc.name}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{doc.id} · {doc.lang}</p>
            </div>
            <span className="mt-1 text-[12px] text-gray-500 sm:mt-0">{doc.type}</span>
            <span className={`mt-1 text-[13px] font-semibold sm:mt-0 ${doc.risk === null ? "text-gray-300" : doc.risk >= 70 ? "text-red-600" : doc.risk >= 40 ? "text-amber-600" : "text-emerald-600"}`}>{doc.risk ?? "—"}</span>
            <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{doc.date}</span>
            <span className={`mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-0 ${doc.status === "analysiert" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{doc.status === "analysiert" ? "Analysiert" : "Ausstehend"}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
