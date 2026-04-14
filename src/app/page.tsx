import Link from "next/link"
export const revalidate = 3600

const capabilities = [
  {
    emoji: "📋",
    title: "Vertragsprüfung",
    description: "KI-gestützte Analyse von Arbeits-, SaaS-, NDA-, Lieferanten- und weiteren Vertragstypen nach deutschem Recht."
  },
  {
    emoji: "⚠️",
    title: "Risikoerkennung",
    description: "Automatische Identifikation kritischer Klauseln mit Risikobewertung, Handlungsempfehlungen und Gesetzesreferenzen."
  },
  {
    emoji: "✅",
    title: "Review & Freigabe",
    description: "Strukturierte Prüfprozesse mit Rollenkonzept, Human-in-the-Loop und nachvollziehbarer Entscheidungshistorie."
  },
  {
    emoji: "🔒",
    title: "Audit & Nachweise",
    description: "Manipulationssichere Protokollierung aller Entscheidungen für ISO 27001, DSGVO und interne Governance."
  },
]

const trustSignals = [
  { emoji: "🇪🇺", label: "DSGVO-konform", sublabel: "EU-Betrieb" },
  { emoji: "🔐", label: "Mandantentrennung", sublabel: "Row-Level Security" },
  { emoji: "🤖", label: "Multi-Provider KI", sublabel: "OpenAI · Claude · Gemini" },
  { emoji: "📜", label: "Audit Trail", sublabel: "Manipulationssicher" },
]

const contractTypes = [
  { emoji: "👔", label: "Arbeitsverträge" },
  { emoji: "☁️", label: "SaaS-Verträge" },
  { emoji: "🤝", label: "NDAs" },
  { emoji: "🏭", label: "Lieferantenverträge" },
  { emoji: "📋", label: "Dienstleistung" },
  { emoji: "🏢", label: "Mietverträge" },
  { emoji: "🛒", label: "Kaufverträge" },
  { emoji: "⚖️", label: "Allgemeine Verträge" },
]

const processSteps = [
  { step: "01", emoji: "📤", title: "Upload", description: "Vertrag als PDF hochladen. Die KI erkennt den Vertragstyp automatisch." },
  { step: "02", emoji: "🔍", title: "Analyse", description: "Multi-Provider KI extrahiert Daten, identifiziert Risiken und prüft gegen deutsches Recht." },
  { step: "03", emoji: "👨‍⚖️", title: "Review", description: "Juristische Prüfung der KI-Hinweise mit klaren Freigabeschritten und Rollenkonzept." },
  { step: "04", emoji: "📊", title: "Nachweis", description: "Export als PDF-Report, DATEV-Anbindung und manipulationssicheres Audit-Protokoll." },
]

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FAFAF7] pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-36 lg:pt-32">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-gold-200/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#003856]/[0.04] to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            {/* Left: Text */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5 shadow-soft">
                <span className="text-[16px]">⚖️</span>
                <span className="text-[12px] font-medium text-gold-700">KI-Vertragsanalyse für juristische Teams</span>
              </div>

              <h1 className="max-w-xl text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-gray-950 sm:text-[3.25rem]">
                Verträge prüfen.{" "}
                <span className="text-[#003856]">Risiken erkennen.</span>{" "}
                Sicher entscheiden.
              </h1>

              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-gray-500">
                KanzleiAI unterstützt Kanzleien und Rechtsabteilungen bei der strukturierten Prüfung von Verträgen — mit nachvollziehbarer KI und auditfähigen Nachweisen.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/enterprise-kontakt"
                  className="inline-flex items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/12 transition-all hover:bg-[#002a42] active:scale-[0.98]"
                >
                  Demo anfragen →
                </Link>
                <Link
                  href="/produkt"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Produkt ansehen
                </Link>
              </div>

              <p className="mt-8 text-[12px] text-gray-400">
                🇩🇪 Ein Produkt der SBS Deutschland GmbH & Co. KG · Made in Germany
              </p>
            </div>

            {/* Right: Hero Feature Preview */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
                {/* Mini App Preview */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-300" />
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <div className="h-3 w-3 rounded-full bg-emerald-300" />
                  <span className="ml-2 text-[11px] text-gray-400">kanzlei-ai.com/workspace</span>
                </div>

                {/* Simulated Document Row */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[20px]">📄</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-900">Arbeitsvertrag_Mueller.pdf</p>
                      <p className="text-[11px] text-gray-400">8 Risiken erkannt · Score: 72/100</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">Mittleres Risiko</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[20px]">📄</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-900">SaaS_Vertrag_CloudCorp.pdf</p>
                      <p className="text-[11px] text-gray-400">3 Risiken erkannt · Score: 34/100</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Geringes Risiko</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <span className="text-[20px]">📄</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-900">NDA_Partner_GmbH.pdf</p>
                      <p className="text-[11px] text-gray-400">12 Risiken erkannt · Score: 89/100</p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-700">Hohes Risiko</span>
                  </div>
                </div>

                {/* Mini Stats Bar */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-gold-50 p-2.5 text-center">
                    <p className="text-[16px] font-semibold text-gray-900">847</p>
                    <p className="text-[10px] text-gold-700">Verträge</p>
                  </div>
                  <div className="rounded-lg bg-gold-50 p-2.5 text-center">
                    <p className="text-[16px] font-semibold text-gray-900">94%</p>
                    <p className="text-[10px] text-gold-700">Genauigkeit</p>
                  </div>
                  <div className="rounded-lg bg-gold-50 p-2.5 text-center">
                    <p className="text-[16px] font-semibold text-gray-900">&lt;30s</p>
                    <p className="text-[10px] text-gold-700">Analysezeit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-gray-200 bg-gold-50/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4 lg:px-10">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="bg-white px-6 py-6 text-center sm:py-7">
              <p className="text-[18px]">{signal.emoji}</p>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{signal.label}</p>
              <p className="text-[12px] text-gray-500">{signal.sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Metrics */}
      <section className="border-b border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "< 3s", label: "Analyse-Antwortzeit", sub: "Multi-Provider KI-Pipeline" },
              { value: "16", label: "Vertragstypen DE/EN", sub: "8 deutsche + 8 englische" },
              { value: "53+", label: "Enterprise-Seiten", sub: "Analyse bis Audit-Trail" },
              { value: "28", label: "API-Endpunkte", sub: "REST + Webhooks + SCIM" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-[2.5rem] font-semibold tracking-tight text-[#003856]">{m.value}</p>
                <p className="mt-1 text-[14px] font-medium text-gray-900">{m.label}</p>
                <p className="text-[12px] text-gray-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚡ Workflow</p>
            <h2 className="mt-3 text-display-sm text-gray-950">So funktioniert&apos;s</h2>
            <p className="mt-4 text-[16px] text-gray-500">Von Upload bis Export in unter 60 Sekunden — drei Schritte zur vollstaendigen Vertragsanalyse.</p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {[
              { step: "1", emoji: "📤", title: "Vertrag hochladen", desc: "PDF, DOCX oder Text einfuegen. Die KI erkennt Sprache und Vertragstyp automatisch — Deutsch und Englisch.", time: "5 Sekunden" },
              { step: "2", emoji: "🧠", title: "KI analysiert", desc: "Multi-Provider-Pipeline (Claude + GPT-4o + Gemini) extrahiert Daten, bewertet Risiken, identifiziert Klauseln und generiert Formulierungsvorschlaege.", time: "< 3 Sekunden" },
              { step: "3", emoji: "📊", title: "Ergebnis nutzen", desc: "Risiko-Score, Findings mit Vorschlaegen, Kuendigungsfristen-Ampel, Copilot-Chat, PDF-Export oder DATEV-Import.", time: "Sofort verfuegbar" },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-gray-100 bg-white p-7 text-center transition-all hover:border-gold-300 hover:shadow-card">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#003856] text-[15px] font-bold text-white">{s.step}</span>
                <span className="mt-4 block text-[32px]">{s.emoji}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{s.desc}</p>
                <p className="mt-4 inline-block rounded-full bg-gold-50 px-3 py-1 text-[11px] font-semibold text-gold-700">{s.time}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/workspace/analyse" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Jetzt ausprobieren →</Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">
              ✨ Leistungsumfang
            </p>
            <h2 className="mt-3 text-display-sm text-gray-950">
              Strukturierte Dokumentenprüfung, von Intake bis Nachweis
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => (
              <div key={cap.title} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-[24px]">
                  {cap.emoji}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-gray-900">{cap.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Types */}
      <section className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚖️ 8 Vertragstypen</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950">
                Spezialisiert auf deutsches Recht
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
              {contractTypes.map((type) => (
                <span
                  key={type.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-gray-700 shadow-soft"
                >
                  <span className="text-[14px]">{type.emoji}</span>
                  {type.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔄 Prozess</p>
            <h2 className="mt-3 text-display-sm text-gray-950">
              Von Upload bis Nachweis in vier Schritten
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <div key={step.step} className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-[22px]">
                  {step.emoji}
                </div>
                <div className="mt-2 text-[11px] font-bold text-gold-700">{step.step}</div>
                <h3 className="mt-1 text-[15px] font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Groups */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">👥 Zielgruppen</p>
            <h2 className="mt-3 text-display-sm text-gray-950">
              Für Teams, die Verträge professionell prüfen
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: "🏛️",
                title: "Kanzleien",
                description: "Vertragsprüfung, Mandatskontext und strukturierte Teamabstimmung mit klaren Zuständigkeiten.",
                link: { href: "/loesungen/kanzleien", label: "Mehr erfahren →" }
              },
              {
                emoji: "🏢",
                title: "Rechtsabteilungen",
                description: "Einheitliche Review-Abläufe mit definierten Freigabeschritten und nachvollziehbaren Entscheidungspfaden.",
                link: { href: "/loesungen/rechtsabteilungen", label: "Mehr erfahren →" }
              },
              {
                emoji: "🛡️",
                title: "Compliance & Datenschutz",
                description: "Zugriff auf Trust-Informationen, Nachweise und Betriebsdokumentation für Audits und interne Prüfungen.",
                link: { href: "/trust-center", label: "Trust Center →" }
              },
            ].map((group) => (
              <div key={group.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <span className="text-[28px]">{group.emoji}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-gray-900">{group.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{group.description}</p>
                <Link
                  href={group.link.href}
                  className="mt-5 inline-flex items-center text-[13px] font-medium text-[#003856] hover:text-[#00507a]"
                >
                  {group.link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-white py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 sm:grid-cols-4 sm:px-8">
          {[
            { value: "< 3s", label: "Analyse-Antwortzeit" },
            { value: "8", label: "Vertragstypen (DE-Recht)" },
            { value: "3", label: "KI-Provider aktiv" },
            { value: "4", label: "Export-Formate" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-[28px] font-semibold text-[#003856]">{stat.value}</p>
              <p className="mt-1 text-[12px] text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💬 Vertrauen</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Gebaut fuer juristische Teams</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { quote: "Die Kombination aus Risiko-Score und BGB-Referenzen spart uns bei der Erstpruefung erheblich Zeit.", role: "Partner, Wirtschaftskanzlei", location: "Frankfurt" },
              { quote: "Mandantentrennung auf DB-Ebene war fuer uns ein Muss. Die RLS-Architektur hat uns ueberzeugt.", role: "IT-Leiter, Grosskanzlei", location: "Muenchen" },
              { quote: "Der DATEV-Export integriert sich nahtlos in unsere bestehende Buchhaltung.", role: "Rechtsabteilung, Mittelstand", location: "Hamburg" },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => <span key={s} className="text-[14px] text-gold-400">★</span>)}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-[13px] font-medium text-gray-900">{t.role}</p>
                  <p className="text-[11px] text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {[
              { emoji: "🇪🇺", label: "DSGVO-konform" },
              { emoji: "🇩🇪", label: "Hosting in Frankfurt" },
              { emoji: "🔐", label: "Row-Level Security" },
              { emoji: "📋", label: "Audit Trail" },
              { emoji: "🤖", label: "Kein KI-Training" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
                <span className="text-[14px]">{b.emoji}</span>
                <span className="text-[12px] font-medium text-gray-600">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-[28px]">🚀</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Bereit für strukturierte Vertragsprüfung?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            Sprechen Sie mit uns über Ihren Arbeitskontext und Ihre Anforderungen. Unverbindlich, in 30 Minuten.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/enterprise-kontakt"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#003856]/12 transition-all hover:bg-[#002a42] active:scale-[0.98] sm:w-auto"
            >
              📞 Demo anfragen
            </Link>
            <Link
              href="/preise"
              className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              Preise ansehen
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
