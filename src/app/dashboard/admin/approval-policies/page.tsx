import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Freigabeprozesse" }

export default function ApprovalPoliciesPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✅ Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Freigabeprozesse</h1>
      <p className="mt-2 text-[14px] text-gray-500">Mehrstufige Freigabe-Workflows fuer analysierte Vertraege definieren.</p>

      <div className="mt-10 space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-[22px]">🟢</span>
            <div>
              <h3 className="text-[15px] font-semibold text-emerald-900">Aktive Regel: Auto-Review bei Hochrisiko</h3>
              <p className="text-[13px] text-emerald-700">Vertraege mit Risiko-Score ≥ 70 werden automatisch in die Review-Queue eingestellt und erfordern Freigabe durch einen Nutzer mit Rolle ANWALT oder ADMIN.</p>
            </div>
          </div>
        </div>

        <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-wider text-gray-400">Workflow-Schritte</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { step: "1", emoji: "📤", title: "Upload / Analyse", desc: "Vertrag wird hochgeladen und analysiert" },
            { step: "2", emoji: "🔴", title: "Risiko-Bewertung", desc: "Score >= 70 triggert Review-Pflicht" },
            { step: "3", emoji: "👤", title: "Pruefung", desc: "Anwalt prueft Findings und Klauseln" },
            { step: "4", emoji: "✅", title: "Entscheidung", desc: "Freigabe, Nachbesserung oder Ablehnung" },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-gray-100 bg-white p-4 text-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700">{s.step}</span>
              <p className="mt-2 text-[18px]">{s.emoji}</p>
              <p className="mt-1 text-[13px] font-medium text-gray-900">{s.title}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-[13px] text-gray-600">Individuelle Freigabe-Workflows mit mehrstufigen Genehmigungsketten, E-Mail-Benachrichtigungen und Eskalationsregeln sind fuer Enterprise-Kunden verfuegbar. <Link href="/enterprise-kontakt" className="font-medium text-[#003856]">Kontakt aufnehmen →</Link></p>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
