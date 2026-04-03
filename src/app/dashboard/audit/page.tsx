import type { Metadata } from "next"

export const metadata: Metadata = { title: "Audit-Protokoll", description: "Manipulationssichere Audit-Protokollierung." }
export default function AuditPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Governance</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Audit-Protokoll</h1>
      <p className="mt-2 text-[14px] text-gray-500">Manipulationssichere Protokollierung aller sicherheitsrelevanten Aktionen.</p>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">📋</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Audit Trail</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Alle Aktionen werden mit Zeitstempel, Akteur und Mandanten-Kontext protokolliert. Hash-verkettete Einträge garantieren Manipulationssicherheit.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Aktionen heute", value: "—", emoji: "📊" },
            { label: "Letzte Analyse", value: "—", emoji: "🧠" },
            { label: "Aktive Nutzer", value: "—", emoji: "👥" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <span className="text-[18px]">{stat.emoji}</span>
              <p className="mt-1 text-[18px] font-semibold text-gray-900">{stat.value}</p>
              <p className="text-[11px] text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
