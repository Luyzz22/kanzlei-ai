import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Richtlinien" }

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📜 Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Organisationsrichtlinien</h1>
      <p className="mt-2 text-[14px] text-gray-500">Richtlinien fuer Vertragsanalyse, Dokumentenverarbeitung und KI-Nutzung.</p>

      <div className="mt-10 space-y-4">
        {[
          { emoji: "🧠", title: "KI-Nutzungsrichtlinie", desc: "Welche Vertragstypen duerfen automatisch analysiert werden? Welche erfordern manuelle Pruefung?", status: "Aktiv", rules: ["Alle 8 Vertragstypen fuer KI-Analyse freigegeben", "Hochrisiko-Vertraege (Score >= 70) erfordern manuellen Review", "Ergebnisse sind Entscheidungshilfen, keine Entscheidungen"] },
          { emoji: "📄", title: "Dokumenten-Policy", desc: "Zulaessige Dateiformate, maximale Dateigroesse und Aufbewahrungsfristen.", status: "Aktiv", rules: ["PDF und TXT zugelassen (max. 120.000 Zeichen)", "Dokumente werden mandantengetrennt gespeichert", "Loeschung nach Vertragsende oder auf Anfrage"] },
          { emoji: "📤", title: "Export-Richtlinie", desc: "Wer darf Analyseergebnisse exportieren und in welchen Formaten?", status: "Aktiv", rules: ["Admin und Anwalt: PDF, JSON, CSV, DATEV", "Assistent: nur PDF-Export", "Alle Exporte werden im Audit-Trail protokolliert"] },
          { emoji: "🔔", title: "Benachrichtigungs-Policy", desc: "Welche Events loesen automatische Benachrichtigungen aus?", status: "Aktiv", rules: ["Hochrisiko-Analysen (Score >= 70) → Slack + n8n", "Neue Team-Mitglieder → Admin-Benachrichtigung", "Fehlgeschlagene Logins → Audit-Log"] },
        ].map((pol) => (
          <div key={pol.title} className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[22px]">{pol.emoji}</span>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{pol.title}</h3>
                  <p className="text-[12px] text-gray-500">{pol.desc}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">{pol.status}</span>
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-4">
              {pol.rules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px] text-gray-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[8px] text-gold-700">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
