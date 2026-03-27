import Link from "next/link"

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */

const capabilities = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Vertragsprüfung",
    description: "KI-gestützte Analyse von Arbeits-, SaaS-, NDA-, Lieferanten- und weiteren Vertragstypen nach deutschem Recht."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Risikoerkennung",
    description: "Automatische Identifikation kritischer Klauseln mit Risikobewertung, Handlungsempfehlungen und Gesetzesreferenzen."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Review & Freigabe",
    description: "Strukturierte Prüfprozesse mit Rollenkonzept, Human-in-the-Loop und nachvollziehbarer Entscheidungshistorie."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: "Audit & Nachweise",
    description: "Manipulationssichere Protokollierung aller Entscheidungen für ISO 27001, DSGVO und interne Governance."
  },
]

const trustSignals = [
  { label: "DSGVO-konform", sublabel: "EU-Betrieb" },
  { label: "Mandantentrennung", sublabel: "Row-Level Security" },
  { label: "Multi-Provider KI", sublabel: "OpenAI · Claude · Gemini" },
  { label: "Audit Trail", sublabel: "Manipulationssicher" },
]

const contractTypes = [
  "Arbeitsverträge", "SaaS-Verträge", "NDAs", "Lieferantenverträge",
  "Dienstleistungsverträge", "Mietverträge", "Kaufverträge", "Allgemeine Verträge"
]

const processSteps = [
  { step: "01", title: "Upload", description: "Vertrag als PDF hochladen. Die KI erkennt den Vertragstyp automatisch." },
  { step: "02", title: "Analyse", description: "Multi-Provider KI extrahiert Daten, identifiziert Risiken und prüft gegen deutsches Recht." },
  { step: "03", title: "Review", description: "Juristische Prüfung der KI-Hinweise mit klaren Freigabeschritten und Rollenkonzept." },
  { step: "04", title: "Nachweis", description: "Export als PDF-Report, DATEV-Anbindung und manipulationssicheres Audit-Protokoll." },
]

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-36 lg:pt-32">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#003856]/[0.04] to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#003856]/[0.03] to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-medium text-gray-600">KI-Vertragsanalyse für juristische Teams</span>
          </div>

          {/* Title */}
          <h1 className="mx-auto max-w-4xl text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-gray-950 sm:text-[3.25rem] lg:text-[3.75rem]">
            Verträge prüfen.{" "}
            <span className="text-[#003856]">Risiken erkennen.</span>{" "}
            Entscheidungen dokumentieren.
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-gray-500 sm:text-lg">
            KanzleiAI unterstützt Kanzleien und Rechtsabteilungen bei der strukturierten Prüfung von Verträgen — mit nachvollziehbarer KI, klaren Freigaben und auditfähigen Nachweisen.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/enterprise-kontakt"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/10 transition-all hover:bg-[#002a42] hover:shadow-xl hover:shadow-[#003856]/15 active:scale-[0.98] sm:w-auto"
            >
              Demo anfragen
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/produkt"
              className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] sm:w-auto"
            >
              Produkt ansehen
            </Link>
          </div>

          {/* SBS Badge */}
          <p className="mt-10 text-[12px] text-gray-400">
            Ein Produkt der SBS Deutschland GmbH & Co. KG · Made in Germany
          </p>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4 lg:px-10">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="bg-white px-6 py-6 text-center sm:py-7">
              <p className="text-[14px] font-semibold text-gray-900">{signal.label}</p>
              <p className="mt-0.5 text-[12px] text-gray-500">{signal.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">
              Leistungsumfang
            </p>
            <h2 className="mt-3 text-display-sm text-gray-950">
              Strukturierte Dokumentenprüfung, von Intake bis Nachweis
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
              KanzleiAI verbindet KI-gestützte Analyse mit juristischen Prüfprozessen in einer konsistenten Plattform.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => (
              <div key={cap.title} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#003856]/[0.06] text-[#003856] transition-colors group-hover:bg-[#003856]/[0.10]">
                  {cap.icon}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-gray-900">{cap.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contract Types ── */}
      <section className="border-y border-gray-100 bg-gray-50/30 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">8 Vertragstypen</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950">
                Spezialisiert auf deutsches Recht
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
              {contractTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-gray-600 shadow-soft"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">Prozess</p>
            <h2 className="mt-3 text-display-sm text-gray-950">
              Von Upload bis Nachweis in vier Schritten
            </h2>
          </div>

          <div className="mt-14 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <div key={step.step} className="relative border-l border-gray-200 py-2 pl-7 lg:border-l-0 lg:border-t lg:pl-0 lg:pr-6 lg:pt-7">
                {/* Step number */}
                <div className="absolute -left-3 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#003856] text-[10px] font-bold text-white lg:-top-3 lg:left-0">
                  {step.step}
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Target Groups ── */}
      <section className="border-t border-gray-100 bg-gray-50/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#003856]">Zielgruppen</p>
            <h2 className="mt-3 text-display-sm text-gray-950">
              Für Teams, die Verträge professionell prüfen
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Kanzleien",
                description: "Vertragsprüfung, Mandatskontext und strukturierte Teamabstimmung mit klaren Zuständigkeiten.",
                link: { href: "/loesungen/kanzleien", label: "Mehr erfahren" }
              },
              {
                title: "Rechtsabteilungen",
                description: "Einheitliche Review-Abläufe mit definierten Freigabeschritten und nachvollziehbaren Entscheidungspfaden.",
                link: { href: "/loesungen/rechtsabteilungen", label: "Mehr erfahren" }
              },
              {
                title: "Compliance & Datenschutz",
                description: "Zugriff auf Trust-Informationen, Nachweise und Betriebsdokumentation für Audits und interne Prüfungen.",
                link: { href: "/trust-center", label: "Trust Center" }
              },
            ].map((group) => (
              <div key={group.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <h3 className="text-[17px] font-semibold text-gray-900">{group.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-500">{group.description}</p>
                <Link
                  href={group.link.href}
                  className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-[#003856] transition-colors hover:text-[#00507a]"
                >
                  {group.link.label}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <h2 className="text-display-sm text-gray-950">Bereit für strukturierte Vertragsprüfung?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            Sprechen Sie mit uns über Ihren Arbeitskontext, vorhandene Prozesse und gewünschte Einführungsschritte. Unverbindlich, in 30 Minuten.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/enterprise-kontakt"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/10 transition-all hover:bg-[#002a42] active:scale-[0.98] sm:w-auto"
            >
              Demo anfragen
            </Link>
            <Link
              href="/preise"
              className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
