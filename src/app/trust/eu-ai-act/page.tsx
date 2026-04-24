import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EU AI Act — Risiko-Klassifizierung & GPAI-Dokumentation",
  description: "KanzleiAI-Einordnung nach EU AI Act: Risikoklasse, Transparenzpflichten, General Purpose AI (GPAI) Modell-Dokumentation, Hochrisiko-Compliance ab 2. August 2026."
}
export const revalidate = 3600

type GpaiModel = {
  name: string
  provider: string
  role: "extraction" | "risk" | "ocr" | "fallback"
  version: string
  euRegion: boolean
  trainingOptOut: "default" | "contractual" | "not-applicable"
  gpaiTier: "general" | "systemic-risk" | "not-classified"
  modelCardUrl: string
}

const gpaiModels: GpaiModel[] = [
  {
    name: "claude-sonnet-4-20250514",
    provider: "Anthropic",
    role: "risk",
    version: "claude-sonnet-4 · Stand Mai 2025",
    euRegion: false,
    trainingOptOut: "default",
    gpaiTier: "general",
    modelCardUrl: "https://docs.anthropic.com/en/docs/about-claude/models"
  },
  {
    name: "claude-3-5-sonnet-latest",
    provider: "Anthropic",
    role: "risk",
    version: "claude-3-5-sonnet · Stand Oktober 2024",
    euRegion: false,
    trainingOptOut: "default",
    gpaiTier: "general",
    modelCardUrl: "https://docs.anthropic.com/en/docs/about-claude/models"
  },
  {
    name: "gpt-4o-mini",
    provider: "OpenAI",
    role: "extraction",
    version: "gpt-4o-mini · Stand Juli 2024",
    euRegion: false,
    trainingOptOut: "default",
    gpaiTier: "general",
    modelCardUrl: "https://platform.openai.com/docs/models/gpt-4o-mini"
  },
  {
    name: "gpt-4o",
    provider: "OpenAI",
    role: "fallback",
    version: "gpt-4o · Stand Mai 2024",
    euRegion: false,
    trainingOptOut: "default",
    gpaiTier: "general",
    modelCardUrl: "https://platform.openai.com/docs/models/gpt-4o"
  },
  {
    name: "gemini-1.5-flash",
    provider: "Google",
    role: "ocr",
    version: "gemini-1.5-flash · Stand Mai 2024",
    euRegion: true,
    trainingOptOut: "contractual",
    gpaiTier: "general",
    modelCardUrl: "https://ai.google.dev/gemini-api/docs/models/gemini"
  }
]

function roleLabel(role: GpaiModel["role"]): string {
  if (role === "risk") return "Risiko-Analyse & Handlungsempfehlungen"
  if (role === "extraction") return "Strukturierte Extraktion"
  if (role === "ocr") return "OCR-Fallback"
  return "Fallback-Routing"
}

export default function EuAiActPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="border-b border-gray-200 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
            <span className="text-[14px]">🇪🇺</span>
            <span className="text-[12px] font-medium text-gold-700">
              Trust Center · Regulation (EU) 2024/1689
            </span>
          </div>
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-[#003856] sm:text-[2.75rem]">
            EU AI Act Compliance
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-gray-600">
            KanzleiAI-Einordnung nach der EU-Verordnung ueber kuenstliche Intelligenz.
            Risiko-Klassifizierung, Transparenzpflichten, General Purpose AI (GPAI)
            Modell-Dokumentation und Nachweise zur Einhaltung der Hochrisiko-Anforderungen
            ab 2. August 2026.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3">
              <span className="text-[20px]">⏰</span>
              <div>
                <h2 className="text-[15px] font-semibold text-rose-900">
                  Kritische Deadline: 2. August 2026
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-rose-800">
                  Ab diesem Datum gelten die Hochrisiko-Anforderungen nach Annex III der
                  KI-Verordnung. Versto&szlig;-Bu&szlig;gelder: bis 35 Mio. EUR oder 7%
                  des weltweiten Jahresumsatzes. KanzleiAI als Deployer (Betreiber)
                  erfuellt die Vorgaben und unterstuetzt Kunden bei der eigenen
                  Compliance-Dokumentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#003856]">
            Risiko-Klassifizierung
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
            Die Klassifizierung haengt vom konkreten Einsatzkontext beim Kunden ab.
            KanzleiAI liefert pro Einsatzszenario eine eindeutige Einordnung.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">⚠️</span>
                <h3 className="text-[14px] font-semibold text-amber-900">
                  Hochrisiko (Annex III, 4.a)
                </h3>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-amber-800">
                Einsatz bei automatisierten Beschaeftigungsentscheidungen:
                Arbeitsvertraege-Pruefung, die direkt zu Einstellungs- oder
                Kuendigungsentscheidungen fuehrt.
              </p>
              <p className="mt-2 text-[11px] text-amber-700">
                Pflichten: Risiko-Management, Daten-Governance, technische Dokumentation,
                Protokollierung, Transparenz, Human Oversight, Genauigkeit &amp;
                Cybersicherheit.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">📋</span>
                <h3 className="text-[14px] font-semibold text-blue-900">
                  Begrenztes Risiko (Art. 50)
                </h3>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-blue-800">
                Standard-Vertragspruefung ohne beschaeftigungsrechtliche Automatisierung:
                NDA, SaaS-Vertrag, Lieferantenvertrag, Kaufvertrag, Mietvertrag.
              </p>
              <p className="mt-2 text-[11px] text-blue-700">
                Pflichten: Transparenzpflicht gegenueber Endnutzern (KI-Nutzung
                offenlegen), KI-generierte Inhalte kennzeichnen.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#003856]">
            General Purpose AI (GPAI) Modelle
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
            Gemaess Art. 53 EU AI Act muessen Deployer alle eingesetzten GPAI-Modelle
            dokumentieren. Nachstehend die vollstaendige Liste aller in KanzleiAI
            aktiven General-Purpose-Modelle, einschliesslich Version, Herkunft und
            Trainings-Opt-Out-Status.
          </p>

          <div className="mt-6 space-y-3">
            {gpaiModels.map((m) => (
              <article
                key={m.name}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[12px] text-gray-800">
                        {m.name}
                      </code>
                      <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-semibold text-gold-800">
                        {m.provider}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] font-medium text-gray-900">
                      {roleLabel(m.role)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-gray-500">{m.version}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        m.euRegion
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {m.euRegion ? "EU-Region" : "Non-EU Region"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                      GPAI · {m.gpaiTier === "general" ? "Standard" : m.gpaiTier}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Training-Opt-Out
                    </dt>
                    <dd className="mt-0.5 text-[13px] text-gray-800">
                      {m.trainingOptOut === "default"
                        ? "Standardmaessig aktiv (Provider-Policy)"
                        : m.trainingOptOut === "contractual"
                          ? "Vertraglich zugesichert"
                          : "Nicht anwendbar"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Verarbeitungsregion
                    </dt>
                    <dd className="mt-0.5 text-[13px] text-gray-800">
                      {m.euRegion ? "EU (europe-west3)" : "US (us-east-1)"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Model Card
                    </dt>
                    <dd className="mt-0.5 text-[13px]">
                      <a
                        href={m.modelCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold-700 underline-offset-2 hover:underline"
                      >
                        Provider-Dokumentation →
                      </a>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#003856]">
            Umsetzung der Hochrisiko-Anforderungen
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                article: "Art. 9",
                title: "Risiko-Managementsystem",
                status: "Umgesetzt",
                desc: "Kontinuierliche Risiko-Identifikation ueber gesamten Lebenszyklus. Dokumentiert in der internen Risiko-Matrix."
              },
              {
                article: "Art. 10",
                title: "Daten-Governance",
                status: "Umgesetzt",
                desc: "Verarbeitete Daten kommen ausschliesslich vom Kunden. Kein Training mit Mandantendaten. Datenminimierung auf Preview-Laenge (16k Zeichen)."
              },
              {
                article: "Art. 11",
                title: "Technische Dokumentation",
                status: "Umgesetzt",
                desc: "Architektur, Provider-Routing, Prompt-Versionierung und Audit-Trail vollstaendig dokumentiert (Enterprise-Kunden erhalten Technical Dossier)."
              },
              {
                article: "Art. 12",
                title: "Protokollierung",
                status: "Umgesetzt",
                desc: "Hash-verketteter Audit-Trail ueber jede KI-Entscheidung. Akteur, Zeitstempel, Modell, Prompt-Version, Input-Hash, Output-Hash."
              },
              {
                article: "Art. 13",
                title: "Transparenz",
                status: "Umgesetzt",
                desc: "Prompts (Extraktion/Risiko) mit Version im UI sichtbar. Provider-Routing-Matrix pro Lauf in der Historie nachvollziehbar."
              },
              {
                article: "Art. 14",
                title: "Human Oversight",
                status: "Umgesetzt",
                desc: "Human-in-the-Loop-Pflicht nach BRAK-Leitfaden. Jedes KI-Finding mit Review-Controls (Akzeptiert / Abgelehnt / Angepasst)."
              },
              {
                article: "Art. 15",
                title: "Genauigkeit & Cybersicherheit",
                status: "In Vorbereitung (Q3 2026)",
                desc: "Benchmark-Suite gegen 50+ Referenzvertraege im Aufbau. ISO 27001-Zertifizierung in 6-9 Monaten geplant."
              },
              {
                article: "Art. 26",
                title: "Pflichten von Deployern",
                status: "Dokumentiert",
                desc: "Betreiber-Handbuch fuer Kanzlei-Kunden (Checkliste, Logs, Meldepflicht bei Zwischenfaellen) als PDF-Download verfuegbar."
              }
            ].map((item) => (
              <div
                key={item.article}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                      {item.article}
                    </p>
                    <h3 className="mt-0.5 text-[14px] font-semibold text-gray-900">
                      {item.title}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === "Umgesetzt"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "Dokumentiert"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-[#003856]">
            Fragen zur EU AI Act Compliance?
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
            Fuer Enterprise-Kunden stellen wir auf Anfrage ein detailliertes Technical
            Dossier bereit, das alle Anforderungen nach Annex III-4.a EU AI Act
            dokumentiert. Enthalten: Risiko-Assessment, Daten-Governance-Konzept,
            Prompt-Engineering-Dokumentation, Provider-Matrix, Benchmark-Ergebnisse.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/trust/sub-prozessoren"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Sub-Prozessoren →
            </Link>
            <Link
              href="/trust/geheimhaltung-203"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              § 203 StGB Geheimhaltung →
            </Link>
            <a
              href="mailto:compliance@sbsdeutschland.de?subject=EU%20AI%20Act%20Technical%20Dossier"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
            >
              Technical Dossier anfordern
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
