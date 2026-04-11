import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lösungen", description: "KI-Vertragsanalyse für Kanzleien, Rechtsabteilungen und Compliance-Teams im DACH-Markt." }

export default function LoesungenPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🎯</span>
              <span className="text-[12px] font-medium text-gold-700">Lösungen</span>
            </div>
            <h1 className="text-display text-gray-950">Die richtige Lösung für Ihr Team</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">KanzleiAI passt sich an Ihre Anforderungen an — ob Einzelkanzlei, Großkanzlei oder Rechtsabteilung eines Konzerns.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Kanzleien */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-gold-300 hover:shadow-elevated">
              <span className="text-[36px]">🏛️</span>
              <h2 className="mt-4 text-[22px] font-semibold text-gray-950">Für Kanzleien</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">Mandantenverträge in Sekunden prüfen. Risiken identifizieren, Klauseln bewerten und strukturierte Reports erstellen.</p>
              <ul className="mt-6 space-y-3">
                {["90% schnellere Erstprüfung", "Risiko-Score 0-100 pro Vertrag", "Contract Copilot mit BGB-Kontext", "Mandantentrennung (Row-Level Security)", "PDF + DATEV Export", "Audit Trail für Compliance"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[14px] text-gray-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[10px] text-gold-700">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/loesungen/kanzleien" className="mt-8 inline-flex items-center rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Mehr erfahren →</Link>
            </div>

            {/* Rechtsabteilungen */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-gold-300 hover:shadow-elevated">
              <span className="text-[36px]">🏢</span>
              <h2 className="mt-4 text-[22px] font-semibold text-gray-950">Für Rechtsabteilungen</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">Enterprise-weite Vertragsanalyse mit SSO, RBAC und strukturierten Freigabeprozessen für große Organisationen.</p>
              <ul className="mt-6 space-y-3">
                {["Multi-Tenant für Konzernstrukturen", "Microsoft Entra SSO + SCIM v2", "Review & Freigabe-Workflows", "Portfolio-Risikoanalyse", "Webhook-Integration (n8n/Slack)", "ISO 27001 Dokumentation"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[14px] text-gray-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[10px] text-gold-700">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/loesungen/rechtsabteilungen" className="mt-8 inline-flex items-center rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Mehr erfahren →</Link>
            </div>

            {/* Einkauf */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-gold-300 hover:shadow-elevated">
              <span className="text-[36px]">🛒</span>
              <h2 className="mt-4 text-[22px] font-semibold text-gray-950">Fuer Einkauf & Beschaffung</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">Lieferantenvertraege und NDAs in Deutsch und Englisch pruefen, Konditionen vergleichen und Kuendigungsfristen im Blick behalten.</p>
              <ul className="mt-6 space-y-3">
                {["Lieferantenvertraege (DE/EN)", "NDA-Analyse bilingual", "AGB vs. AEB Abgleich", "Kuendigungsfristen-Monitoring", "Umformulierungsvorschlaege", "Microsoft Dynamics Integration"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[14px] text-gray-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[10px] text-gold-700">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/loesungen/einkauf" className="mt-8 inline-flex items-center rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Mehr erfahren →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💡 Anwendungsfälle</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Wie Teams KanzleiAI nutzen</h2>
          <div className="mt-10 space-y-4">
            {[
              { emoji: "📋", title: "Due Diligence", desc: "50+ Verträge in einem Projekt? KanzleiAI analysiert jeden einzelnen und erstellt einen konsolidierten Risikobericht mit Prioritäten." },
              { emoji: "🔄", title: "Vertragsrevision", desc: "Bestehende Verträge auf neue regulatorische Anforderungen prüfen — z.B. AGB-Update, DSGVO-Konformität, NDA-Standardisierung." },
              { emoji: "⚡", title: "Schnellcheck", desc: "Eingehender Vertrag eines Geschäftspartners: In 30 Sekunden die kritischen Klauseln identifizieren bevor das Meeting beginnt." },
              { emoji: "📊", title: "Portfolio-Reporting", desc: "Risiko-Score-Übersicht über alle analysierten Verträge. Export als CSV/DATEV für Finance oder als PDF-Report für die Geschäftsleitung." },
            ].map((uc) => (
              <div key={uc.title} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6">
                <span className="text-[24px]">{uc.emoji}</span>
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">{uc.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-gray-500">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-display-sm text-gray-950">Nicht sicher welche Lösung passt?</h2>
          <p className="mt-4 text-[16px] text-gray-500">Wir beraten Sie gerne — unverbindlich und auf Ihren Kontext zugeschnitten.</p>
          <Link href="/enterprise-kontakt" className="mt-8 inline-flex rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">📞 Beratungsgespräch vereinbaren</Link>
        </div>
      </section>
    </main>
  )
}
