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
      if (data.url) {
        window.location.href = data.url
      } else if (data.redirect) {
        window.location.href = data.redirect
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💳 Abonnement</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Abrechnung & Plan</h1>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Aktueller Plan</p>
              <p className="mt-1 text-[18px] font-semibold text-gray-900">Demo / Pilot</p>
              <p className="mt-1 text-[13px] text-gray-500">Voller Funktionsumfang während der Testphase</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-semibold text-emerald-700">Aktiv</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-[22px] font-semibold text-gray-900">∞</p>
            <p className="text-[11px] text-gray-400">Analysen verfügbar</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-[22px] font-semibold text-gray-900">3</p>
            <p className="text-[11px] text-gray-400">KI-Provider aktiv</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-[22px] font-semibold text-gray-900">∞</p>
            <p className="text-[11px] text-gray-400">Copilot-Anfragen</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/preise" className="flex-1 rounded-full bg-[#003856] py-3 text-center text-[14px] font-medium text-white hover:bg-[#002a42]">Plan upgraden</Link>
          <button onClick={openPortal} disabled={loading} className="flex-1 rounded-full border border-gray-200 bg-white py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {loading ? "Wird geladen..." : "💳 Rechnungen & Zahlungen"}
          </button>
        </div>
      </div>
    </div>
  )
}
