import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features — KanzleiAI v2.1 Contract Intelligence",
  description:
    "Vertragsradar, Verhandlungssimulator und Contract Intelligence — die neuen Enterprise-Features von KanzleiAI v2.1. Regulatorisches Monitoring für EU AI Act, NIS2, DSGVO und LkSG gegen Ihr Vertragsportfolio.",
}

export const revalidate = 3600 // ISR: 1 Stunde

const heroFeatures = [
  {
    badge: "NEU · v2.1",
    badgeColor: "gold",
    emoji: "🛰️",
    title: "Vertragsradar",
    tagline: "Regulatorisches Compliance-Monitoring",
    description:
      "Automatisierter Abgleich neuer Gesetze und Verordnungen gegen Ihr aktives Vertragsportfolio. EUR-Lex CELLAR Live-Feed, tägliche Synchronisation, mandantenspezifische Relevanzbewertung.",
    bullets: [
      "Täglicher Sync mit EUR-Lex, BGBl und Fachpublikationen",
      "KI-Klassifikation: welche Regulatorik betrifft welche Vertragsart",
      "Priorisierung nach Risiko, Frist und Portfolio-Exposure",
      "Eindeutig im DACH-Markt — keine Kombinationslösung verfügbar",
    ],
    regulatory: [
      "EU AI Act",
      "NIS2",
      "DSGVO",
      "LkSG",
      "Data Act",
      "Cyber Resilience Act",
    ],
    cta: { label: "Zum Vertragsradar", href: "/workspace/vertragsradar" },
  },
  {
    badge: "NEU · v2.1",
    badgeColor: "gold",
    emoji: "🎯",
    title: "Verhandlungssimulator",
    tagline: "Flugsimulator für Vertragsverhandlungen",
    description:
      "Trainieren Sie schwierige Verhandlungsszenarien mit einer adaptiven KI-Gegenpartei. Coach gibt nach jedem Zug Feedback zu Argumentationsqualität, Zugeständnisbereitschaft und strategischer Positionierung.",
    bullets: [
      "Adaptive Gegenpartei reagiert auf Ihre Argumentationslinie",
      "Echtzeit-Coach mit BGB-fundiertem Feedback",
      "Szenario-Bibliothek: Lieferverträge, Lizenzen, Arbeitsrecht",
      "Vollständig auditierbare Trainings-Historie pro Mandant",
    ],
    regulatory: [
      "Training",
      "BGB",
      "HGB",
      "UrhG",
      "ArbZG",
      "AGB-Recht",
    ],
    cta: { label: "Zum Verhandlungssimulator", href: "/workspace/verhandlung" },
  },
]

const intelligenceCapabilities = [
  {
    emoji: "🧬",
    title: "Contract Intelligence Domain Model",
    description:
      "Vier modulare KI-Pipelines für Extraktion, Risikoanalyse, Klauselbewertung und Negotiation Guidance — jeweils mit deterministischer Validierung und Human-in-the-Loop-Freigabe.",
  },
  {
    emoji: "📡",
    title: "EUR-Lex CELLAR Live-Feed",
    description:
      "Direkter Zugriff auf die offizielle EU-Rechtsdatenbank. Tägliche Synchronisation um 03:00 UTC, semantische Klassifikation nach CELEX-Kategorien.",
  },
  {
    emoji: "🔬",
    title: "Multi-Provider KI-Router",
    description:
      "Claude Sonnet 4, GPT-4o und Gemini parallel im Einsatz. Der Router wählt pro Aufgabe das geeignete Modell, Fallback-Routing und strukturierte Validierung inklusive.",
  },
  {
    emoji: "🛡️",
    title: "Evidence-Based Findings",
    description:
      "Jede Risiko-Markierung verweist auf die exakte Quelltextstelle. Kein Halluzinieren — jede KI-Aussage ist am Dokument verankert und nachvollziehbar.",
  },
]

const kernmoduleList = [
  {
    emoji: "⚡",
    title: "Schnellanalyse",
    desc: "Ein Vertrag, unter drei Sekunden. Strukturierter Risikoreport mit BGB-Referenzen.",
    category: "Analyse",
  },
  {
    emoji: "🧠",
    title: "KI-Vertragsanalyse",
    desc: "Tiefenanalyse mit 16 Vertragstypen DE/EN, Multi-Provider KI-Pipeline und auditierbarer Historie.",
    category: "Analyse",
  },
  {
    emoji: "🤖",
    title: "Contract Copilot",
    desc: "Streaming-Chat mit Vertragskontext. Fragen Sie jeden Vertrag — Antworten mit BGB- und Klausel-Referenzen.",
    category: "Analyse",
  },
  {
    emoji: "⚖️",
    title: "AGB-Vergleich",
    desc: "Zwei Dokumente Klausel für Klausel. Abweichungen, Widersprüche und Lücken automatisch markiert.",
    category: "Analyse",
  },
  {
    emoji: "🛰️",
    title: "Vertragsradar",
    desc: "Regulatorisches Monitoring: EU AI Act, NIS2, DSGVO, LkSG gegen Ihr Portfolio gespiegelt.",
    category: "Intelligence",
    badge: "v2.1",
  },
  {
    emoji: "🎯",
    title: "Verhandlungssimulator",
    desc: "Trainings-Sparring mit adaptiver KI-Gegenpartei und Coach-Feedback in Echtzeit.",
    category: "Intelligence",
    badge: "v2.1",
  },
  {
    emoji: "📂",
    title: "Dokumenten-Workspace",
    desc: "Zentrale Arbeitsoberfläche mit Versionshistorie, Tags und mandantenbezogener Ablage.",
    category: "Workspace",
  },
  {
    emoji: "🛡️",
    title: "Review & Freigabe",
    desc: "RBAC-Rollenmodell, Human-in-the-Loop, Vier-Augen-Prinzip und nachvollziehbare Entscheidungspfade.",
    category: "Governance",
  },
  {
    emoji: "📋",
    title: "Audit & Nachweise",
    desc: "Manipulationssichere Hash-Verkettung, ISO-27001-Ready, revisionssichere Exporte.",
    category: "Governance",
  },
  {
    emoji: "📊",
    title: "Lieferanten-Benchmarking",
    desc: "Risiko-Ranking, Konditionen-Vergleich und Trendanalyse aller analysierten Lieferanten.",
    category: "Analytics",
  },
  {
    emoji: "🔗",
    title: "Integrationen & API",
    desc: "REST API, Webhooks, SCIM v2, Entra SSO, DATEV-Export — nahtlose Integration in Ihre Landschaft.",
    category: "Platform",
  },
  {
    emoji: "🏛️",
    title: "Trust Center & Compliance",
    desc: "DSGVO, AVV, Trust Center, Compliance-One-Pager, EU-Datenresidenz (fra1) out-of-the-box.",
    category: "Platform",
  },
]

const categories = ["Analyse", "Intelligence", "Workspace", "Governance", "Analytics", "Platform"]

const enterpriseFoundation = [
  { emoji: "🇪🇺", label: "EU-Datenresidenz", value: "fra1 · eu-central-1" },
  { emoji: "🔐", label: "Auth", value: "NextAuth v5 · Entra SSO · SCIM v2" },
  { emoji: "🧱", label: "Mandantentrennung", value: "Row-Level Security" },
  { emoji: "📝", label: "Audit-Trail", value: "SHA-256 Hash-Chain" },
  { emoji: "🗂️", label: "Retention", value: "Policy-basiert · DSGVO Art. 5" },
  { emoji: "⚖️", label: "Regulatorik", value: "DSGVO · EU AI Act · NIS2" },
]

export default function FeaturesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              <span className="text-[12px] font-medium text-gold-700">KanzleiAI v2.1 · Contract Intelligence</span>
            </div>
            <h1 className="text-display text-gray-950">
              Verträge nicht nur prüfen.<br />
              <span className="text-[#003856]">Verstehen, verhandeln, überwachen.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-gray-500">
              KanzleiAI v2.1 bringt zwei Enterprise-Features, die es im DACH-Markt in dieser Kombination nicht gibt:
              automatisiertes regulatorisches Monitoring Ihrer Verträge und ein KI-Trainingssystem für
              reale Verhandlungen.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/enterprise-kontakt"
                className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98]"
              >
                Demo anfragen
              </Link>
              <Link
                href="#hero-features"
                className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Features entdecken
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Features — Vertragsradar + Verhandlungssimulator */}
      <section id="hero-features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-14 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">✨ Die Neuheiten in v2.1</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Zwei Features, die den Unterschied machen</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
              Während andere Plattformen Verträge analysieren, verlängert KanzleiAI v2.1 die Wertschöpfung
              in die Zukunft: proaktive Regulatorik-Erkennung und realistisches Verhandlungstraining.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {heroFeatures.map((f) => (
              <article
                key={f.title}
                className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all hover:border-gold-200 hover:shadow-elevated sm:p-10"
              >
                {/* Badge */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">{f.badge}</span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003856] to-[#002a42] text-[26px] shadow-inner">
                    {f.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[22px] font-semibold tracking-tight text-gray-950">{f.title}</h3>
                    <p className="mt-1 text-[13px] font-medium text-gold-700">{f.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-6 text-[15px] leading-relaxed text-gray-600">{f.description}</p>

                {/* Bullets */}
                <ul className="mt-6 space-y-2.5">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-gray-700">
                      <svg className="mt-[3px] h-4 w-4 flex-shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Regulatory / Scope Tags */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {f.regulatory.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <Link
                    href={f.cta.href}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#003856] transition-colors hover:text-gold-700"
                  >
                    {f.cta.label}
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Pillar */}
      <section className="border-y border-gray-200 bg-gradient-to-b from-gray-50 to-[#FAFAF7] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🧬 Foundation</p>
              <h2 className="mt-3 text-display-sm text-gray-950">Contract Intelligence als Architektur-Prinzip</h2>
              <p className="mt-5 text-[16px] leading-relaxed text-gray-500">
                KI ist in KanzleiAI kein Feature-Zusatz, sondern die Architektur-Grundlage. Jede Aussage
                ist am Quelldokument verankert, jeder Lauf ist auditierbar, jeder KI-Provider ist ersetzbar.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {intelligenceCapabilities.map((c) => (
                <div key={c.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <span className="text-[24px]">{c.emoji}</span>
                  <h3 className="mt-3 text-[14px] font-semibold text-gray-900">{c.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Feature Matrix */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏗️ Gesamtübersicht</p>
              <h2 className="mt-3 text-display-sm text-gray-950">Alle Kernmodule im Überblick</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                Zwölf produktive Module, sechs strategische Kategorien — eine konsistente
                Plattform für juristische Teams im DACH-Raum.
              </p>
            </div>
            <Link
              href="/produkt"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-[#003856] hover:text-gold-700"
            >
              Zur Produkt-Tiefe
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Category Legend */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-600"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Modules Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kernmoduleList.map((m) => (
              <div
                key={m.title}
                className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-200 hover:shadow-card"
              >
                {m.badge && (
                  <span className="absolute right-5 top-5 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                    {m.badge}
                  </span>
                )}
                <span className="text-[26px]">{m.emoji}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{m.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-gray-500">{m.desc}</p>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-600">
                  {m.category}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Foundation */}
      <section className="border-y border-gray-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏛️ Enterprise Foundation</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Nicht nur Features — die Grundlage ist Enterprise</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
              Datenresidenz, Mandantentrennung, Audit-Trails und regulatorische Compliance
              gehören nicht zu den Optionen — sie sind die Basis jeder Funktion.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enterpriseFoundation.map((e) => (
              <div
                key={e.label}
                className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4"
              >
                <span className="text-[22px]">{e.emoji}</span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{e.label}</p>
                  <p className="mt-0.5 text-[14px] font-medium text-gray-900">{e.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003856] to-[#002a42] text-[28px] shadow-inner">
            🚀
          </div>
          <h2 className="text-display-sm text-gray-950">
            Bereit für Contract Intelligence?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            Wir zeigen Ihnen in einer 30-minütigen Live-Demo wie Vertragsradar und Verhandlungs­simulator
            in Ihrem Mandantenkontext konkret aussehen — inklusive Compliance- und Scope-Check.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/enterprise-kontakt"
              className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#002a42] active:scale-[0.98]"
            >
              Enterprise-Demo anfragen
            </Link>
            <Link
              href="/trust/compliance"
              className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Compliance One-Pager
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
