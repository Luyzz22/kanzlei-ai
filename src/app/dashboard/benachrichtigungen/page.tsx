"use client"

import { useState } from "react"
import Link from "next/link"

type Notification = {
  id: string
  type: "analyse" | "review" | "system" | "integration" | "security"
  emoji: string
  title: string
  desc: string
  time: string
  read: boolean
  href?: string
}

const demoNotifications: Notification[] = [
  { id: "n-007", type: "analyse", emoji: "🔴", title: "Hochrisiko-Vertrag erkannt", desc: "Supplier Agreement TechVendor (Score: 78) — automatisch in Review-Queue eingestellt", time: "Vor 2 Stunden", read: false, href: "/workspace/review-queue" },
  { id: "n-006", type: "integration", emoji: "🏗️", title: "Dynamics 365 Sync abgeschlossen", desc: "3 Lieferanten und 12 Bestellungen synchronisiert", time: "Vor 3 Stunden", read: false },
  { id: "n-005", type: "review", emoji: "✅", title: "Review abgeschlossen", desc: "NDA Cloud Provider — akzeptiert mit Auflagen (von demo@kanzlei-ai.com)", time: "Gestern", read: true, href: "/workspace/review-queue" },
  { id: "n-004", type: "system", emoji: "🚀", title: "KanzleiAI v2.0 verfuegbar", desc: "AGB-Vergleich, Benchmarking, 16 Vertragstypen DE/EN, SCIM v2, Microsoft Dynamics", time: "14.04.2026", read: true, href: "/release-notes" },
  { id: "n-003", type: "security", emoji: "🔐", title: "Neuer Login von unbekanntem Geraet", desc: "einkauf@dermalog.de — Hamburg, Deutschland (Chrome, macOS)", time: "14.04.2026", read: true },
  { id: "n-002", type: "analyse", emoji: "🧠", title: "Batch-Analyse abgeschlossen", desc: "3 von 3 Vertraegen analysiert — Ø Risiko-Score: 62", time: "13.04.2026", read: true },
  { id: "n-001", type: "system", emoji: "👋", title: "Willkommen bei KanzleiAI", desc: "Ihr Tenant dermalog-purchasing wurde eingerichtet. Starten Sie mit der Schnellanalyse.", time: "14.04.2026", read: true, href: "/workspace/onboarding" },
]

export default function BenachrichtigungenPage() {
  const [filter, setFilter] = useState("alle")
  const [notifications, setNotifications] = useState(demoNotifications)

  const filtered = filter === "alle" ? notifications : filter === "ungelesen" ? notifications.filter(n => !n.read) : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })))

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔔 Dashboard</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Benachrichtigungen</h1>
          <p className="mt-2 text-[14px] text-gray-500">{unreadCount} ungelesen · {notifications.length} gesamt</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">Alle als gelesen markieren</button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {[
          { key: "alle", label: "Alle" },
          { key: "ungelesen", label: `Ungelesen (${unreadCount})` },
          { key: "analyse", label: "🧠 Analyse" },
          { key: "review", label: "✅ Review" },
          { key: "integration", label: "🏗️ Integration" },
          { key: "security", label: "🔐 Sicherheit" },
          { key: "system", label: "🚀 System" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${filter === f.key ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{f.label}</button>
        ))}
      </div>

      {/* Notifications */}
      <div className="mt-6 space-y-2">
        {filtered.map((n) => (
          <div key={n.id} className={`rounded-xl border bg-white px-5 py-4 transition-colors ${n.read ? "border-gray-100" : "border-gold-200 bg-gold-50/30"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[18px]">{n.emoji}</span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-[14px] ${n.read ? "text-gray-700" : "font-semibold text-gray-900"}`}>{n.title}</h3>
                  <span className="shrink-0 text-[11px] text-gray-400">{n.time}</span>
                </div>
                <p className="mt-0.5 text-[13px] text-gray-500">{n.desc}</p>
                {n.href && <Link href={n.href} className="mt-1 inline-block text-[12px] font-medium text-[#003856] hover:text-[#00507a]">Ansehen →</Link>}
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Benachrichtigungs-Einstellungen</h3>
        <p className="mt-1 text-[12px] text-gray-500">Konfigurierbar unter <Link href="/dashboard/admin/policies" className="font-medium text-[#003856]">Organisationsrichtlinien</Link>. Hochrisiko-Benachrichtigungen koennen via Slack und Webhook weitergeleitet werden.</p>
      </div>
    </div>
  )
}
