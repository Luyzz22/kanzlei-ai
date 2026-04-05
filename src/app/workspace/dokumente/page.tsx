"use client"

import { useState } from "react"
import Link from "next/link"

export default function DokumentePage() {
  const [filter, setFilter] = useState("alle")

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📂 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Dokumenten-Workspace</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/workspace/upload" className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">📤 Hochladen</Link>
          <Link href="/workspace/analyse" className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">⚡ Schnellanalyse</Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto">
        {["alle", "analysiert", "ausstehend", "hochrisiko"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${filter === f ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {f === "alle" ? "Alle Dokumente" : f === "analysiert" ? "✅ Analysiert" : f === "ausstehend" ? "⏳ Ausstehend" : "🔴 Hochrisiko"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mt-4">
        <input type="text" placeholder="Vertraege durchsuchen..." className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
      </div>

      {/* Table Header */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_120px_100px_100px_80px]">
        <span>Dokument</span><span>Typ</span><span>Risiko</span><span>Datum</span><span>Status</span>
      </div>

      {/* Empty State */}
      <div className="rounded-b-xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">📂</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Noch keine Dokumente</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Laden Sie Ihren ersten Vertrag hoch oder nutzen Sie die Schnellanalyse. Alle Dokumente werden mandantengetrennt gespeichert.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/workspace/upload" className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">📤 Ersten Vertrag hochladen</Link>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 flex items-center gap-4 text-[12px] text-gray-400">
        <span>0 Dokumente</span>
        <span>·</span>
        <span>Row-Level Security aktiv</span>
        <span>·</span>
        <span>Mandantengetrennt</span>
      </div>
    </div>
  )
}
