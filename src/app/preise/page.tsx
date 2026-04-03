import Link from "next/link"
import type { Metadata } from "next"

const tiers = [
  {
    name: "Starter",
    price: "490",
    period: "/ Monat",
    description: "Für kleine Teams mit fokussierten Prüfprozessen.",
    features: ["Bis 5 Nutzer", "50 Vertragsanalysen / Monat", "8 Vertragstypen (DE-Recht)", "PDF-Report-Export", "E-Mail-Support"],
    highlighted: false,
  },
  {
    name: "Business",
    price: "1.290",
    period: "/ Monat",
    description: "Für wachsende Teams mit erweitertem Governance-Bedarf.",
    features: ["Bis 25 Nutzer", "250 Vertragsanalysen / Monat", "Multi-Provider KI (Claude + GPT-4o + Gemini)", "Contract Copilot mit Vertragskontext", "Review & Freigabe-Workflows", "DATEV-Export + CSV/JSON", "Audit Trail + Nachweise", "Prioritäts-Support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Individuell",
    period: "",
    description: "Für organisationsweite Nutzung mit vollen Compliance-Anforderungen.",
    features: ["Unbegrenzte Nutzer", "Unbegrenzte Analysen", "SSO (Microsoft Entra / SAML)", "SCIM v2 Provisioning", "Row-Level Security", "Dedizierter Tenant", "ISO 27001 Dokumentation", "SLA + Onboarding-Begleitung"],
    highlighted: false,
  },
]

const faq = [
  { q: "Gibt es eine kostenlose Testphase?", a: "Ja — wir richten Ihnen einen Pilot-Tenant mit echten Vertragsanalysen ein. 14 Tage, keine Kreditkarte." },
  { q: "Welche Vertragstypen werden unterstützt?", a: "Arbeitsverträge, SaaS-Verträge, NDAs, Lieferantenverträge, Dienstleistungsverträge, Mietverträge, Kaufverträge und allgemeine Verträge — alle nach deutschem Recht." },
  { q: "Wo werden die Daten verarbeitet?", a: "Hosting in der EU, Datenbank in Deutschland (Frankfurt). Alle KI-Anfragen über europäische Endpoints. DSGVO-konform mit AVV." },
  { q: "Können wir den Plan später wechseln?", a: "Jederzeit. Up- und Downgrades sind monatlich möglich, ohne Bindung." },
]


export const metadata: Metadata = { title: "Preise — Transparente Pläne", description: "Transparente Preise für KI-Vertragsanalyse. Starter, Business und Enterprise." }
export default function PreisePage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">💰</span>
              <span className="text-[12px] font-medium text-gold-700">Preise</span>
            </div>
            <h1 className="text-display text-gray-950">Transparente Preise für juristische Teams</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Starten Sie klein, skalieren Sie mit Ihren Anforderungen. Alle Pläne enthalten KI-Vertragsanalyse nach deutschem Recht.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.name} className={`relative flex flex-col rounded-2xl border p-7 ${tier.highlighted ? "border-gold-400 bg-white shadow-elevated ring-1 ring-gold-300/30" : "border-gray-100 bg-white"}`}>
                {tier.highlighted && (
                  <div className="absolute -top-3 left-6 rounded-full bg-gold-700 px-3 py-1 text-[11px] font-semibold text-white">⭐ Empfohlen</div>
                )}
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`font-semibold tracking-tight text-gray-950 ${tier.price === "Individuell" ? "text-[1.5rem]" : "text-[2rem]"}`}>
                      {tier.price !== "Individuell" ? `€${tier.price}` : tier.price}
                    </span>
                    {tier.period && <span className="text-[14px] text-gray-400">{tier.period}</span>}
                  </div>
                  <p className="mt-2 text-[13px] text-gray-500">{tier.description}</p>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[9px] text-gold-700">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/enterprise-kontakt" className={`mt-8 block rounded-full py-3 text-center text-[14px] font-medium transition-all active:scale-[0.98] ${tier.highlighted ? "bg-[#003856] text-white hover:bg-[#002a42]" : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}>
                  {tier.name === "Enterprise" ? "Enterprise-Kontakt" : "Demo anfragen"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[12px] text-gray-400">Alle Preise zzgl. MwSt. · Monatliche Abrechnung · Keine Mindestlaufzeit</p>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">❓ FAQ</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Häufige Fragen</h2>
          <div className="mt-10 space-y-4">
            {faq.map((item) => (
              <details key={item.q} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[15px] font-medium text-gray-900">
                  {item.q}
                  <svg className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-[14px] leading-relaxed text-gray-600">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
