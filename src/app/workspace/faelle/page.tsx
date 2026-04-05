import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Faelle & Mandate" }

export default function FaellePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📁 Workspace</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Faelle & Mandate</h1>
          <p className="mt-2 text-[14px] text-gray-500">Vertraege mandatsbezogen organisieren und nach Projekt oder Geschaeftsbereich zuordnen.</p>
        </div>
        <button disabled className="rounded-full bg-gray-100 px-5 py-2.5 text-[13px] font-medium text-gray-400 cursor-not-allowed">+ Neuer Fall</button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Offene Faelle", value: "0", emoji: "📂" },
          { label: "Vertraege zugeordnet", value: "0", emoji: "📄" },
          { label: "Hochrisiko-Faelle", value: "0", emoji: "🔴" },
          { label: "Abgeschlossen", value: "0", emoji: "✅" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4">
            <span className="text-[16px]">{s.emoji}</span>
            <p className="mt-2 text-[22px] font-semibold text-gray-950">{s.value}</p>
            <p className="text-[11px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">📁</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Fallverwaltung</h2>
        <p className="mx-auto mt-2 max-w-lg text-[14px] text-gray-500">Organisieren Sie Vertraege nach Mandaten, Projekten oder Geschaeftsbereichen. Weisen Sie Analysen einem Fall zu und behalten Sie den Ueberblick ueber Risiken pro Mandat.</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[12px] font-semibold text-amber-700">Verfuegbar ab v2.0</div>
        <div className="mt-6">
          <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">⚡ Schnellanalyse starten</Link>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="mt-8">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Geplante Features</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { emoji: "🏷️", title: "Fall-Tags", desc: "Faelle mit Labels organisieren und filtern" },
            { emoji: "👥", title: "Team-Zuordnung", desc: "Faelle an Teammitglieder zuweisen" },
            { emoji: "📊", title: "Fall-Reporting", desc: "Risiko-Uebersicht pro Fall/Mandat" },
            { emoji: "📧", title: "Benachrichtigungen", desc: "Updates bei neuen Analysen im Fall" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <span className="text-[18px]">{f.emoji}</span>
              <div>
                <p className="text-[13px] font-medium text-gray-700">{f.title}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
