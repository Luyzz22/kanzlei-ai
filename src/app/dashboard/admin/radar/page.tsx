"use client"

import { useState } from "react"
import Link from "next/link"

export default function RadarAdminPage() {
  const [enabled, setEnabled] = useState({ "eu-ai-act": true, "nis2": true, "dsgvo-2026": true, "e-rechnung": true, "lieferketten": true })
  const [interval, setInterval] = useState("daily")

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🛰️ Enterprise</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Vertragsradar — Einstellungen</h1>
      <p className="mt-2 text-[14px] text-gray-500">Regulierungen, Scan-Intervalle und Alert-Kanaele konfigurieren.</p>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Ueberwachte Regulierungen</h2>
        <p className="mt-1 text-[12px] text-gray-500">Feeds: EUR-Lex, BMJ, dejure.org, BMAS</p>
        <div className="mt-4 space-y-2">
          {[
            { id: "eu-ai-act", name: "EU AI Act", emoji: "🤖", date: "02.08.2026" },
            { id: "nis2", name: "NIS2-Umsetzungsgesetz", emoji: "🛡️", date: "18.10.2024" },
            { id: "dsgvo-2026", name: "DSGVO 2026", emoji: "🇪🇺", date: "01.01.2026" },
            { id: "e-rechnung", name: "E-Rechnungspflicht", emoji: "🧾", date: "01.01.2027" },
            { id: "lieferketten", name: "LkSG", emoji: "🔗", date: "01.01.2024" },
          ].map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{r.emoji}</span>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{r.name}</p>
                  <p className="text-[11px] text-gray-400">Wirksam: {r.date}</p>
                </div>
              </div>
              <button onClick={() => setEnabled(e => ({...e, [r.id]: !e[r.id as keyof typeof e]}))} className={`relative h-6 w-11 rounded-full transition-colors ${enabled[r.id as keyof typeof enabled] ? "bg-[#003856]" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled[r.id as keyof typeof enabled] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Scan-Intervall</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {["real-time", "daily", "weekly", "manual"].map((i) => (
            <button key={i} onClick={() => setInterval(i)} className={`rounded-xl border px-4 py-3 text-[12px] font-medium transition-colors ${interval === i ? "border-[#003856] bg-[#003856] text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
              {i === "real-time" ? "Echtzeit" : i === "daily" ? "Taeglich" : i === "weekly" ? "Woechentlich" : "Manuell"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-gray-900">Alert-Kanaele</h2>
        <div className="mt-4 space-y-2">
          {[
            { label: "E-Mail bei kritischen Matches", desc: "ki@sbsdeutschland.de" },
            { label: "Slack-Integration", desc: "#compliance-alerts" },
            { label: "Webhook an n8n", desc: "Workflow-Automatisierung" },
          ].map((a) => (
            <div key={a.label} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-gray-900">{a.label}</p>
                <p className="text-[11px] text-gray-400">{a.desc}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Aktiv</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-[12px] text-blue-800">💡 <span className="font-semibold">EU AI Act Compliance:</span> Vertragsradar ist als Limited Risk System klassifiziert. Alle Scans erfordern Human Review vor Umsetzung. Ergebnisse sind Empfehlungen, keine Entscheidungen.</p>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
