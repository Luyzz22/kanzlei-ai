import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Datenschutz & Aufbewahrung" }

export default function PrivacyRetentionPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🗄️ Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Datenschutz & Aufbewahrung</h1>
      <p className="mt-2 text-[14px] text-gray-500">Aufbewahrungsfristen, Loeschrichtlinien und DSGVO-Einstellungen.</p>

      <div className="mt-10 space-y-4">
        {[
          { emoji: "📄", label: "Vertragsdokumente", retention: "Vertragslaufzeit + 30 Tage", desc: "Originalvertrag und alle Versionen" },
          { emoji: "🧠", label: "Analyseergebnisse", retention: "Vertragslaufzeit + 30 Tage", desc: "Risiko-Score, Findings, extrahierte Daten" },
          { emoji: "📋", label: "Audit-Trail", retention: "10 Jahre", desc: "Gemaess handelsrechtlicher Aufbewahrungspflichten" },
          { emoji: "👤", label: "Nutzerdaten", retention: "Bis Kontodeaktivierung", desc: "Name, E-Mail, Rolle, Login-Historie" },
          { emoji: "🤖", label: "KI-Interaktionen", retention: "90 Tage", desc: "Copilot-Anfragen und Antworten" },
          { emoji: "📊", label: "Nutzungsstatistiken", retention: "12 Monate", desc: "Anonymisierte Nutzungsdaten" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-[18px]">{r.emoji}</span>
              <div>
                <p className="text-[14px] font-medium text-gray-900">{r.label}</p>
                <p className="text-[11px] text-gray-500">{r.desc}</p>
              </div>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700">{r.retention}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-red-700">Datenloeschung anfragen</h3>
        <p className="mt-2 text-[13px] text-gray-600">DSGVO Art. 17: Sie haben das Recht auf Loeschung Ihrer Daten. Kontaktieren Sie <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link> fuer eine Loeschanfrage. Die Loeschung wird innerhalb von 30 Tagen bearbeitet und im Audit-Trail dokumentiert.</p>
      </div>

      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
