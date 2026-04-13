"use client"

import { useState } from "react"
import Link from "next/link"

const demoKeys = [
  { id: "key_live_...a8f2", name: "Production API", created: "05.04.2026", lastUsed: "Heute", status: "aktiv", scope: "analyse, copilot, export" },
  { id: "key_test_...b3c1", name: "Development", created: "03.04.2026", lastUsed: "09.04.2026", status: "aktiv", scope: "analyse" },
]

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔑 Administration</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">API-Schluessel</h1>
          <p className="mt-2 text-[14px] text-gray-500">API-Keys fuer die REST API erstellen und verwalten. Dokumentation unter <Link href="/developer" className="font-medium text-[#003856]">/developer</Link>.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">+ Neuer API-Key</button>
      </div>

      {showCreate && (
        <div className="mt-6 rounded-2xl border border-gold-200 bg-gold-50 p-6">
          <h3 className="text-[15px] font-semibold text-gray-900">Neuen API-Key erstellen</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_120px]">
            <input type="text" placeholder="Name (z.B. CI/CD Pipeline)" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200" />
            <select className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900">
              <option>Analyse + Export</option>
              <option>Nur Analyse</option>
              <option>Vollzugriff</option>
            </select>
            <button className="rounded-full bg-[#003856] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">Erstellen</button>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Der Key wird nur einmal angezeigt. Speichern Sie ihn sicher.</p>
        </div>
      )}

      {/* Keys Table */}
      <div className="mt-8 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_120px_100px_80px]">
        <span>Key</span><span>Scope</span><span>Letzter Zugriff</span><span>Status</span>
      </div>
      <div className="overflow-hidden rounded-b-xl border border-gray-200">
        {demoKeys.map((key) => (
          <div key={key.id} className="grid border-b border-gray-100 bg-white px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_120px_100px_80px] sm:items-center">
            <div>
              <p className="text-[14px] font-medium text-gray-900">{key.name}</p>
              <code className="mt-0.5 text-[11px] text-gray-400">{key.id}</code>
            </div>
            <span className="mt-1 text-[12px] text-gray-500 sm:mt-0">{key.scope}</span>
            <span className="mt-1 text-[12px] text-gray-400 sm:mt-0">{key.lastUsed}</span>
            <span className="mt-1 inline-block w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:mt-0">{key.status}</span>
          </div>
        ))}
      </div>

      {/* Rate Limits */}
      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Rate Limits</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            { label: "Analysen / Stunde", value: "60", plan: "Business" },
            { label: "Copilot-Anfragen / Stunde", value: "120", plan: "Business" },
            { label: "Export-Requests / Stunde", value: "30", plan: "Business" },
          ].map((rl) => (
            <div key={rl.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
              <span className="text-[12px] text-gray-600">{rl.label}</span>
              <span className="font-mono text-[13px] font-medium text-[#003856]">{rl.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
