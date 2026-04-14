"use client"

import { useState } from "react"
import Link from "next/link"

const demoEvents = [
  { id: "evt-007", type: "analyse", emoji: "🧠", title: "Vertrag analysiert", detail: "Supplier Agreement — TechVendor GmbH (EN)", user: "einkauf@dermalog.de", tenant: "dermalog-purchasing", time: "Heute, 11:15", severity: "info" },
  { id: "evt-006", type: "vergleich", emoji: "⚖️", title: "AGB-Vergleich durchgefuehrt", detail: "Lieferanten-AGB vs. DERMALOG AEB — 4 Abweichungen", user: "einkauf@dermalog.de", tenant: "dermalog-purchasing", time: "Heute, 11:02", severity: "warning" },
  { id: "evt-005", type: "export", emoji: "📤", title: "PDF-Report exportiert", detail: "Analysebericht Supplier Agreement TechVendor", user: "einkauf@dermalog.de", tenant: "dermalog-purchasing", time: "Heute, 10:58", severity: "info" },
  { id: "evt-004", type: "login", emoji: "🔐", title: "Login erfolgreich", detail: "Credentials — einkauf@dermalog.de", user: "einkauf@dermalog.de", tenant: "dermalog-purchasing", time: "Heute, 10:30", severity: "info" },
  { id: "evt-003", type: "analyse", emoji: "🧠", title: "Vertrag analysiert", detail: "Rahmenvertrag — Logistik AG (DE)", user: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", time: "Gestern, 16:20", severity: "info" },
  { id: "evt-002", type: "review", emoji: "✅", title: "Review abgeschlossen", detail: "NDA Cloud Provider — akzeptiert mit Auflagen", user: "demo@kanzlei-ai.com", tenant: "demo-kanzlei", time: "Gestern, 14:05", severity: "info" },
  { id: "evt-001", type: "admin", emoji: "⚙️", title: "Tenant erstellt", detail: "dermalog-purchasing — DERMALOG Identification Systems GmbH", user: "ki@sbsdeutschland.de", tenant: "sbs-deutschland", time: "14.04.2026", severity: "info" },
]

const filterOptions = [
  { key: "alle", label: "Alle" },
  { key: "analyse", label: "🧠 Analyse" },
  { key: "vergleich", label: "⚖️ Vergleich" },
  { key: "export", label: "📤 Export" },
  { key: "login", label: "🔐 Login" },
  { key: "review", label: "✅ Review" },
  { key: "admin", label: "⚙️ Admin" },
]

export default function AuditAktivitaetenPage() {
  const [filter, setFilter] = useState("alle")

  const filtered = filter === "alle" ? demoEvents : demoEvents.filter(e => e.type === filter)

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Audit</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Aktivitaeten-Protokoll</h1>
          <p className="mt-2 text-[14px] text-gray-500">Chronologisches Log aller sicherheitsrelevanten Aktionen. Hash-verkettet, mandantengetrennt, nicht manipulierbar.</p>
        </div>
        <Link href="/dashboard/audit" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50">← Audit-Dashboard</Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">{demoEvents.length}</p>
          <p className="text-[10px] text-gray-400">Events gesamt</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">{demoEvents.filter(e => e.type === "analyse").length}</p>
          <p className="text-[10px] text-gray-400">Analysen</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-gray-900">2</p>
          <p className="text-[10px] text-gray-400">Tenants aktiv</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
          <p className="text-[18px] font-semibold text-emerald-600">✓</p>
          <p className="text-[10px] text-gray-400">Hash-Kette intakt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {filterOptions.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${filter === f.key ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{f.label}</button>
        ))}
      </div>

      {/* Events */}
      <div className="mt-6 space-y-2">
        {filtered.map((evt) => (
          <div key={evt.id} className="rounded-xl border border-gray-100 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[18px]">{evt.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-medium text-gray-900">{evt.title}</h3>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] text-gray-400">{evt.id}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-gray-500">{evt.detail}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{evt.user} · {evt.tenant}</p>
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">{evt.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Info */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-[12px] text-gray-500">Aufbewahrung: 10 Jahre (§ 257 HGB) · Hash-Algorithmus: SHA-256 · Jeder Eintrag referenziert den vorherigen Hash · <Link href="/sicherheit-compliance" className="font-medium text-[#003856]">Mehr zur Sicherheitsarchitektur →</Link></p>
      </div>
    </div>
  )
}
