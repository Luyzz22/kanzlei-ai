import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fuer Rechtsabteilungen", description: "KI-Vertragsanalyse fuer Corporate Legal: Review-Workflows, Governance, Compliance und Lieferantenmanagement." }

export default function RechtsabteilungenPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🏢</span>
              <span className="text-[12px] font-medium text-gold-700">Fuer Rechtsabteilungen</span>
            </div>
            <h1 className="text-display text-gray-950">KI-Vertragsanalyse fuer Corporate Legal</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Strukturierte Review-Workflows, mehrstufige Freigaben und auditierbare Nachweise — fuer Rechtsabteilungen die Governance ernst nehmen.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Demo anfragen</Link>
              <Link href="/trust-center" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Trust Center</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Use Cases</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Typische Szenarien in Rechtsabteilungen</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              { emoji: "📥", title: "Eingehende Vertraege pruefen", desc: "Lieferantenvertraege, NDAs und Rahmenvertraege systematisch auf Risiken pruefen — bevor sie unterschrieben werden. Bilinguale Analyse (DE/EN).", features: ["Risiko-Score in < 3 Sekunden", "Procurement-Pruefpunkte automatisch", "Formulierungsvorschlaege fuer Nachverhandlung"] },
              { emoji: "⚖️", title: "AGB-Compliance sicherstellen", desc: "Lieferanten-AGB gegen Ihre eigenen Einkaufsbedingungen abgleichen. Abweichungen, Widersprueche und fehlende Klauseln werden automatisch identifiziert.", features: ["Klausel-fuer-Klausel-Vergleich", "Abweichungs-Severity (hoch/mittel/niedrig)", "Fehlende Klauseln in beiden Dokumenten"] },
              { emoji: "📅", title: "Vertragsportfolio managen", desc: "Kuendigungsfristen, Auto-Renewal und Vertragslaufzeiten im Blick behalten. Keine vergessenen Verlaengerungen mehr.", features: ["Fristen-Ampel (rot/gelb/gruen)", "Lieferanten-Benchmarking", "Faelle & Mandate organisieren"] },
              { emoji: "✅", title: "Review & Governance", desc: "Mehrstufige Freigabeprozesse mit RBAC. Hochrisiko-Vertraege landen automatisch in der Review-Queue.", features: ["4-Stage Pipeline (Eingereicht → Freigabe)", "Auto-Review bei Score >= 70", "Audit Trail fuer jede Entscheidung"] },
            ].map((uc) => (
              <div key={uc.title} className="rounded-2xl border border-gray-100 bg-white p-7">
                <span className="text-[28px]">{uc.emoji}</span>
                <h3 className="mt-3 text-[18px] font-semibold text-gray-900">{uc.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{uc.desc}</p>
                <ul className="mt-4 space-y-2">
                  {uc.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[8px] text-gold-700">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏢 Enterprise</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Fuer Ihre IT- und Compliance-Anforderungen</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji: "🔐", title: "SSO via Microsoft Entra", desc: "SAML/OIDC Single Sign-On fuer nahtlose Authentifizierung." },
              { emoji: "👥", title: "SCIM v2 Provisioning", desc: "Automatische Nutzerverwaltung ueber Ihren Identity Provider." },
              { emoji: "🏗️", title: "Row-Level Security", desc: "Datenbankebene Mandantentrennung — DSGVO-konform by Design." },
              { emoji: "📋", title: "Audit Trail (10 Jahre)", desc: "Hash-verkettete Protokollierung fuer Compliance-Nachweise." },
              { emoji: "🇪🇺", title: "EU-Datenresidenz", desc: "Alle Daten auf Servern in Frankfurt/EU. Keine US-Transfers." },
              { emoji: "📄", title: "AVV & DPA", desc: "Auftragsverarbeitung mit TOM und 7 dokumentierten Sub-Processors." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4">
                <span className="mt-0.5 text-[18px]">{f.emoji}</span>
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-[13px] text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">🏢</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Bereit fuer Ihre Rechtsabteilung?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">Strukturierte Erstgespraech mit Fokus auf Scope, Rollenmodell und Compliance-Kontext.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Enterprise-Demo anfragen</Link>
            <Link href="/sicherheit-compliance" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Sicherheit & Compliance</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
