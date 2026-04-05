import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Auftragsverarbeitungsvereinbarung", description: "AVV gemaess Art. 28 DSGVO fuer KanzleiAI." }

export default function AVVPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Rechtliches</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Auftragsverarbeitungsvereinbarung</h1>
          <p className="mt-4 text-[14px] text-gray-500">gemaess Art. 28 DSGVO · Stand: April 2026</p>

          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">1. Gegenstand und Dauer</h2>
              <p className="mt-3">Der Auftragsverarbeiter (SBS Deutschland GmbH & Co. KG) verarbeitet personenbezogene Daten im Auftrag des Verantwortlichen (Kunde) im Rahmen der Nutzung von KanzleiAI. Die Dauer der Verarbeitung entspricht der Laufzeit des Nutzungsvertrags.</p>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">2. Art und Zweck der Verarbeitung</h2>
              <p className="mt-3">Die Verarbeitung umfasst: Speicherung und Verwaltung von Nutzerdaten (Name, E-Mail, Rolle), Verarbeitung von Vertragsdokumenten durch KI-Analyse (Risikobewertung, Datenextraktion), Speicherung von Analyseergebnissen und Audit-Trail-Eintraegen, sowie technische Bereitstellung der Plattform.</p>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">3. Kategorien betroffener Personen</h2>
              <p className="mt-3">Nutzer der Plattform (Anwaelte, juristische Mitarbeiter, Administratoren), sowie in den verarbeiteten Vertragsdokumenten genannte Personen (Vertragsparteien, Kontaktpersonen).</p>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">4. Technische und organisatorische Massnahmen</h2>
              <div className="mt-3 space-y-2">
                {[
                  "TLS 1.3 Verschluesselung fuer alle Datenuebertragungen",
                  "Row-Level Security (RLS) auf PostgreSQL fuer Mandantentrennung",
                  "RBAC-Zugriffskontrolle (Admin, Anwalt, Assistent)",
                  "JWT-basierte Authentifizierung mit 24h Session-Lifetime",
                  "Manipulationssicherer Audit Trail mit Tenant-Kontext",
                  "Security Headers: HSTS, X-Frame-Options DENY, CSP",
                  "Datenbank-Hosting in eu-central-1 (Frankfurt am Main)",
                  "Regelmaessige Sicherheitsupdates und Dependency-Audits",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-2">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[8px] text-emerald-700">✓</span>
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">5. Unterauftragsverarbeiter</h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                <div className="hidden bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-3">
                  <span>Dienstleister</span><span>Zweck</span><span>Standort</span>
                </div>
                {[
                  { name: "Vercel Inc.", purpose: "Hosting, Edge Network", location: "USA (EU-Routing)" },
                  { name: "Neon Inc.", purpose: "PostgreSQL-Datenbank", location: "EU (Frankfurt)" },
                  { name: "Anthropic PBC", purpose: "KI-Analyse (Claude)", location: "USA (EU-Endpoint)" },
                  { name: "OpenAI Inc.", purpose: "KI-Analyse (GPT-4o)", location: "USA (EU-Endpoint)" },
                  { name: "Google LLC", purpose: "KI-Analyse (Gemini)", location: "USA (EU-Endpoint)" },
                  { name: "Resend Inc.", purpose: "E-Mail-Versand", location: "USA" },
                  { name: "Stripe Inc.", purpose: "Zahlungsabwicklung", location: "USA/EU" },
                ].map((sub) => (
                  <div key={sub.name} className="grid border-t border-gray-100 bg-white px-4 py-3 text-[13px] sm:grid-cols-3">
                    <span className="font-medium text-gray-900">{sub.name}</span>
                    <span className="text-gray-600">{sub.purpose}</span>
                    <span className="text-gray-500">{sub.location}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-gray-500">Mit allen Unterauftragsverarbeitern bestehen Standardvertragsklauseln (SCCs) oder gleichwertige Vereinbarungen.</p>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">6. Rechte und Pflichten des Verantwortlichen</h2>
              <p className="mt-3">Der Verantwortliche ist fuer die Rechtmaessigkeit der Verarbeitung verantwortlich. Er erteilt alle Weisungen schriftlich oder in dokumentierter elektronischer Form. Der Auftragsverarbeiter unterstuetzt den Verantwortlichen bei der Erfuellung seiner Pflichten nach Art. 32-36 DSGVO.</p>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">7. Loeschung und Rueckgabe</h2>
              <p className="mt-3">Nach Beendigung des Auftrags werden alle personenbezogenen Daten geloescht oder zurueckgegeben, sofern keine gesetzliche Aufbewahrungspflicht besteht. Die Loeschung wird dokumentiert und auf Anfrage bestaeligt.</p>
            </div>

            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">8. Kontrollrechte</h2>
              <p className="mt-3">Der Verantwortliche hat das Recht, die Einhaltung dieser Vereinbarung zu ueberpruefen. Dies kann durch Audits, Inspektionen oder die Anforderung von Nachweisen erfolgen.</p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-gold-200 bg-gold-50 p-6">
            <p className="text-[14px] font-medium text-gray-900">AVV als Dokument anfordern</p>
            <p className="mt-2 text-[13px] text-gray-600">Fuer eine unterschriftsreife AVV im PDF-Format kontaktieren Sie uns unter <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link>. Enterprise-Kunden erhalten eine individuell angepasste AVV.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
