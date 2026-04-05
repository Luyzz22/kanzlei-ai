import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Review & Freigabe" }

export default function ReviewQueuePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✅ Governance</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Review & Freigabe</h1>
          <p className="mt-2 text-[14px] text-gray-500">Strukturierte Pruef- und Freigabeprozesse fuer analysierte Vertraege.</p>
        </div>
        <Link href="/dashboard/admin/approval-policies" className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">⚙️ Freigabe-Regeln</Link>
      </div>

      {/* Pipeline Stats */}
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-[22px] font-semibold text-amber-700">0</p>
          <p className="text-[11px] font-medium text-amber-600">Ausstehend</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
          <p className="text-[22px] font-semibold text-blue-700">0</p>
          <p className="text-[11px] font-medium text-blue-600">In Pruefung</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
          <p className="text-[22px] font-semibold text-emerald-700">0</p>
          <p className="text-[11px] font-medium text-emerald-600">Freigegeben</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-[22px] font-semibold text-red-700">0</p>
          <p className="text-[11px] font-medium text-red-600">Abgelehnt</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-2">
        {["Alle", "Ausstehend", "In Pruefung", "Freigegeben"].map((tab, i) => (
          <button key={tab} className={`rounded-full px-4 py-2 text-[12px] font-medium ${i === 0 ? "bg-[#003856] text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{tab}</button>
        ))}
      </div>

      {/* Table Header */}
      <div className="mt-6 hidden rounded-t-xl bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_100px_100px_120px_100px]">
        <span>Vertrag</span><span>Risiko</span><span>Status</span><span>Pruefer</span><span>Aktion</span>
      </div>

      {/* Empty State */}
      <div className="rounded-b-xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">✅</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Keine offenen Reviews</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Analysierte Vertraege mit identifizierten Risiken (Score ≥ 70) werden automatisch in die Review-Queue eingestellt. Pruefer koennen Vertraege freigeben oder zur Nachbesserung zurueckweisen.</p>
        <div className="mt-6">
          <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">⚡ Vertrag analysieren</Link>
        </div>
      </div>

      {/* Workflow Info */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <h3 className="text-[14px] font-semibold text-gray-900">So funktioniert der Review-Prozess</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            { step: "1", emoji: "🔍", title: "Analyse", desc: "KI analysiert den Vertrag" },
            { step: "2", emoji: "🔴", title: "Hochrisiko", desc: "Score ≥ 70 → automatisch in Queue" },
            { step: "3", emoji: "👤", title: "Pruefung", desc: "Jurist prueft Findings" },
            { step: "4", emoji: "✅", title: "Freigabe", desc: "Freigabe oder Nachbesserung" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700">{s.step}</span>
              <p className="mt-2 text-[18px]">{s.emoji}</p>
              <p className="mt-1 text-[13px] font-medium text-gray-900">{s.title}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
