"use client"

import { useState } from "react"
import Link from "next/link"

const eventTypes = [
  { type: "alle", label: "Alle", emoji: "📋" },
  { type: "analysis", label: "Analyse", emoji: "🧠" },
  { type: "compare", label: "Vergleich", emoji: "⚖️" },
  { type: "export", label: "Export", emoji: "📤" },
  { type: "auth", label: "Authentifizierung", emoji: "🔑" },
  { type: "copilot", label: "Copilot", emoji: "🤖" },
  { type: "admin", label: "Administration", emoji: "⚙️" },
]

const demoEvents = [
  { id: "evt-001", type: "analysis", emoji: "🧠", action: "Vertragsanalyse abgeschlossen", actor: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", detail: "Risiko-Score: 72 · Supplier Agreement · Claude Sonnet 4", time: "Gerade eben", severity: "info" as const },
  { id: "evt-002", type: "analysis", emoji: "🔴", action: "Hochrisiko-Vertrag erkannt", actor: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", detail: "Score >= 70 · Auto-Review ausgeloest", time: "vor 2 Min", severity: "warning" as const },
  { id: "evt-003", type: "copilot", emoji: "🤖", action: "Copilot-Anfrage", actor: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", detail: "Frage zu Kuendigungsfristen · 342 Tokens", time: "vor 5 Min", severity: "info" as const },
  { id: "evt-004", type: "export", emoji: "📄", action: "PDF-Report exportiert", actor: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", detail: "Analyse #A-2026-0412 · 4 Seiten", time: "vor 12 Min", severity: "info" as const },
  { id: "evt-005", type: "auth", emoji: "🔑", action: "Nutzer-Login", actor: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", detail: "JWT Session erstellt · IP 85.x.x.x", time: "vor 30 Min", severity: "info" as const },
]

export default function AktivitaetenPage() {
  const [filter, setFilter] = useState("alle")

  const filtered = filter === "alle" ? demoEvents : demoEvents.filter(e => e.type === filter)

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📊 Audit</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Aktivitaetsprotokoll</h1>
          <p className="mt-2 text-[14px] text-gray-500">Manipulationssichere Protokollierung aller Aktionen mit Zeitstempel, Akteur und Mandanten-Kontext.</p>
        </div>
        <button className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">📥 CSV Export</button>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-2">
        {eventTypes.map((et) => (
          <button key={et.type} onClick={() => setFilter(et.type)} className={`rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${filter === et.type ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {et.emoji} {et.label}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_180px_140px_120px]">
        <span>Event</span><span>Akteur</span><span>Detail</span><span>Zeit</span>
      </div>

      {/* Events */}
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {filtered.map((evt) => (
          <div key={evt.id} className="grid border-b border-gray-100 bg-white px-5 py-3.5 last:border-b-0 sm:grid-cols-[1fr_180px_140px_120px] sm:items-center">
            <div className="flex items-center gap-3">
              <span className="text-[16px]">{evt.emoji}</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">{evt.action}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{evt.detail}</p>
              </div>
            </div>
            <span className="mt-1 text-[12px] text-gray-500 sm:mt-0">{evt.actor}</span>
            <span className="mt-1 text-[11px] text-gray-400 sm:mt-0">{evt.tenant}</span>
            <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{evt.time}</span>
          </div>
        ))}
      </div>

      {/* Architecture Info */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { emoji: "🔗", title: "Hash-Verkettung", desc: "SHA-256 pro Eintrag" },
          { emoji: "🏗️", title: "RLS-isoliert", desc: "Mandantentrennung" },
          { emoji: "📅", title: "10 Jahre", desc: "Aufbewahrungsfrist" },
          { emoji: "📤", title: "Export", desc: "CSV + JSON + DATEV" },
        ].map((a) => (
          <div key={a.title} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
            <span className="text-[16px]">{a.emoji}</span>
            <p className="mt-1 text-[12px] font-medium text-gray-700">{a.title}</p>
            <p className="text-[10px] text-gray-500">{a.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/dashboard/audit" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zum Audit-Dashboard</Link>
      </div>
    </div>
  )
}
