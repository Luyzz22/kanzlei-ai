import Link from "next/link"

import { PageHero } from "@/components/marketing/page-hero"

const tiers = [
  {
    name: "Starter",
    price: "490",
    period: "/ Monat",
    description: "Für kleine Teams mit fokussierten Prüfprozessen.",
    features: [
      "Bis 5 Nutzer",
      "50 Vertragsanalysen / Monat",
      "8 Vertragstypen (DE-Recht)",
      "PDF-Report-Export",
      "E-Mail-Support",
    ],
    cta: { label: "Demo anfragen", href: "/enterprise-kontakt" },
    highlighted: false,
  },
  {
    name: "Business",
    price: "1.290",
    period: "/ Monat",
    description: "Für wachsende Teams mit erweitertem Governance-Bedarf.",
    features: [
      "Bis 25 Nutzer",
      "250 Vertragsanalysen / Monat",
      "Multi-Provider KI (OpenAI + Claude + Gemini)",
      "Review & Freigabe-Workflows",
      "DATEV-Export + CSV/JSON",
      "Audit Trail + Nachweise",
      "Prioritäts-Support",
    ],
    cta: { label: "Demo anfragen", href: "/enterprise-kontakt" },
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Individuell",
    period: "",
    description: "Für organisationsweite Nutzung mit vollen Compliance-Anforderungen.",
    features: [
      "Unbegrenzte Nutzer",
      "Unbegrenzte Analysen",
      "SSO (Microsoft Entra / SAML)",
      "SCIM v2 Provisioning",
      "Row-Level Security",
      "Dedizierter Tenant",
      "ISO 27001 Dokumentation",
      "SLA + Onboarding-Begleitung",
    ],
    cta: { label: "Enterprise-Kontakt", href: "/enterprise-kontakt" },
    highlighted: false,
  },
]

const faq = [
  {
    q: "Gibt es eine kostenlose Testphase?",
    a: "Ja — wir richten Ihnen einen Pilot-Tenant mit echten Vertragsanalysen ein. 14 Tage, keine Kreditkarte.",
  },
  {
    q: "Welche Vertragstypen werden unterstützt?",
    a: "Arbeitsverträge, SaaS-Verträge, NDAs, Lieferantenverträge, Dienstleistungsverträge, Mietverträge, Kaufverträge und allgemeine Verträge — alle nach deutschem Recht.",
  },
  {
    q: "Wo werden die Daten verarbeitet?",
    a: "Hosting in der EU (Vercel EU Edge), Datenbank in Deutschland. Alle KI-Anfragen über europäische Endpoints. DSGVO-konform mit AV-Vertrag.",
  },
  {
    q: "Können wir den Plan später wechseln?",
    a: "Jederzeit. Up- und Downgrades sind monatlich möglich, ohne Bindung.",
  },
]

export default function PreisePage() {
  return (
    <main>
      <PageHero
        eyebrow="Preise"
        title="Transparente Preise für juristische Teams"
        description="Starten Sie klein, skalieren Sie mit Ihren Anforderungen. Alle Pläne enthalten KI-Vertragsanalyse nach deutschem Recht."
      />

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  tier.highlighted
                    ? "border-gold-400 bg-white shadow-elevated ring-1 ring-gold-300/30"
                    : "border-gray-100 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-6 rounded-full bg-gold-700 px-3 py-1 text-[11px] font-semibold text-white">
                    Empfohlen
                  </div>
                )}

                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-[2rem] font-semibold tracking-tight ${tier.price === "Individuell" ? "text-[1.5rem]" : ""} text-gray-950`}>
                      {tier.price !== "Individuell" ? `€${tier.price}` : tier.price}
                    </span>
                    {tier.period && <span className="text-[14px] text-gray-400">{tier.period}</span>}
                  </div>
                  <p className="mt-2 text-[13px] text-gray-500">{tier.description}</p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.cta.href}
                  className={`mt-8 block rounded-full py-3 text-center text-[14px] font-medium transition-all active:scale-[0.98] ${
                    tier.highlighted
                      ? "bg-[#003856] text-white hover:bg-[#002a42]"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {tier.cta.label}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[12px] text-gray-400">
            Alle Preise zzgl. MwSt. · Monatliche Abrechnung · Keine Mindestlaufzeit
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">FAQ</p>
          <h2 className="mt-3 text-center text-[1.75rem] font-semibold tracking-tight text-gray-950">
            Häufige Fragen
          </h2>
          <div className="mt-10 space-y-6">
            {faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-gray-100 bg-white p-5">
                <h3 className="text-[14px] font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
