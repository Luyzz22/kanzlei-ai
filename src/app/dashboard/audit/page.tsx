"use client"

import { useState } from "react"
import Link from "next/link"

const eventTypes = [
  { type: "analysis.completed", emoji: "🧠", label: "Analyse abgeschlossen" },
  { type: "analysis.high_risk", emoji: "🔴", label: "Hochrisiko erkannt" },
  { type: "export.created", emoji: "📄", label: "Export erstellt" },
  { type: "user.login", emoji: "🔑", label: "Nutzer-Login" },
  { type: "user.logout", emoji: "🚪", label: "Nutzer-Logout" },
  { type: "document.uploaded", emoji: "📤", label: "Dokument hochgeladen" },
  { type: "copilot.query", emoji: "🤖", label: "Copilot-Anfrage" },
  { type: "review.approved", emoji: "✅", label: "Review freigegeben" },
]

export default function AuditPage() {
  const [filter, setFilter] = useState("alle")

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Governance</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Audit-Protokoll</h1>
          <p className="mt-2 text-[14px] text-gray-500">Manipulationssichere Protokollierung aller sicherheitsrelevanten Aktionen.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/audit/aktivitaeten" className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">📊 Detail-Ansicht</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">0</p>
          <p className="text-[11px] text-gray-400">Events heute</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">0</p>
          <p className="text-[11px] text-gray-400">Analysen gesamt</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-gray-900">0</p>
          <p className="text-[11px] text-gray-400">Hochrisiko-Events</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
          <p className="text-[22px] font-semibold text-emerald-600">100%</p>
          <p className="text-[11px] text-gray-400">Integritaet</p>
        </div>
      </div>

      {/* Event Types */}
      <div className="mt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Event-Typen</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setFilter("alle")} className={`rounded-full px-4 py-2 text-[12px] font-medium transition-colors ${filter === "alle" ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>Alle Events</button>
          {eventTypes.map((et) => (
            <button key={et.type} onClick={() => setFilter(et.type)} className={`rounded-full px-3 py-2 text-[12px] font-medium transition-colors ${filter === et.type ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
              {et.emoji} {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_140px_120px_100px_80px]">
        <span>Event</span><span>Typ</span><span>Akteur</span><span>Mandant</span><span>Zeit</span>
      </div>

      {/* Empty State */}
      <div className="rounded-b-xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">📋</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Audit Trail aktiv</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Alle Aktionen werden automatisch mit Zeitstempel, Akteur und Mandanten-Kontext protokolliert. Starten Sie eine Analyse um den ersten Audit-Eintrag zu erzeugen.</p>
        <Link href="/workspace/analyse" className="mt-6 inline-block rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">⚡ Analyse starten</Link>
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Audit-Trail Architektur</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="text-center">
            <span className="text-[18px]">🔗</span>
            <p className="mt-1 text-[13px] font-medium text-gray-700">Hash-Verkettung</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Jeder Eintrag referenziert den vorherigen Hash</p>
          </div>
          <div className="text-center">
            <span className="text-[18px]">🏗️</span>
            <p className="mt-1 text-[13px] font-medium text-gray-700">Mandantentrennung</p>
            <p className="mt-0.5 text-[11px] text-gray-500">RLS isoliert Audit-Daten pro Tenant</p>
          </div>
          <div className="text-center">
            <span className="text-[18px]">📤</span>
            <p className="mt-1 text-[13px] font-medium text-gray-700">Export</p>
            <p className="mt-0.5 text-[11px] text-gray-500">CSV und DATEV-kompatible Formate</p>
          </div>
        </div>
      </div>
    </div>
  )
}
