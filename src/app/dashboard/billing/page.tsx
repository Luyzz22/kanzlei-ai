"use client"

import { useState } from "react"
import Link from "next/link"

export default function BillingPage() {
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else if (data.redirect) window.location.href = data.redirect
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💳 Verwaltung</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Abrechnung & Nutzung</h1>
      <p className="mt-2 text-[14px] text-gray-500">Plan, Verbrauch und Rechnungen verwalten.</p>

      {/* Current Plan */}
      <div className="mt-8 rounded-2xl border border-gold-200 bg-gold-50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#003856] px-3 py-1 text-[11px] font-bold text-white">BUSINESS</span>
              <span className="text-[12px] text-gray-500">Aktiver Plan</span>
            </div>
            <p className="mt-2 text-[14px] text-gray-700">Bis 10 Nutzer · Alle Module · AGB-Vergleich · Benchmarking · API-Zugriff</p>
          </div>
          <div className="text-right">
            <p className="text-[24px] font-semibold text-gray-900">—</p>
            <p className="text-[12px] text-gray-400">Pilot-Phase (kostenlos)</p>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="mt-8">
        <h2 className="text-[15px] font-semibold text-gray-900">Verbrauch (laufender Monat)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Analysen", used: 12, limit: 500, emoji: "🧠" },
            { label: "Copilot-Anfragen", used: 34, limit: 2000, emoji: "🤖" },
            { label: "Exporte", used: 8, limit: 200, emoji: "📤" },
            { label: "Vergleiche", used: 3, limit: 100, emoji: "⚖️" },
          ].map((u) => (
            <div key={u.label} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-500">{u.label}</span>
                <span className="text-[14px]">{u.emoji}</span>
              </div>
              <p className="mt-2 text-[20px] font-semibold text-gray-900">{u.used} <span className="text-[13px] font-normal text-gray-400">/ {u.limit}</span></p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#003856]" style={{ width: `${Math.min((u.used / u.limit) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button onClick={openPortal} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-4 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" /> : <span>💳</span>}
          Stripe Kundenportal
        </button>
        <Link href="/preise" className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-4 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50">
          📊 Plan vergleichen
        </Link>
      </div>

      {/* Invoices */}
      <div className="mt-8">
        <h2 className="text-[15px] font-semibold text-gray-900">Rechnungen</h2>
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <span className="text-[28px]">📄</span>
          <p className="mt-2 text-[14px] text-gray-500">Noch keine Rechnungen vorhanden. Rechnungen erscheinen hier nach dem ersten kostenpflichtigen Abrechnungszeitraum.</p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-[12px] text-gray-500">Fragen zur Abrechnung? <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link> · Alle Preise netto zzgl. MwSt.</p>
      </div>
    </div>
  )
}
