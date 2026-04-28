import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sub-Prozessoren",
  description: "Vollstaendige Sub-Prozessoren-Liste von KanzleiAI nach Art. 28 DSGVO. Alle Auftragsverarbeiter, KI-Provider, Hosting-Dienstleister und deren Standorte."
}
export const revalidate = 3600

type SubProcessor = {
  name: string
  role: string
  purpose: string
  location: string
  cloudActRisk: "keiner" | "mittel" | "hoch"
  dataCategories: string[]
  avvStatus: "verfuegbar" | "integriert" | "vertraglich"
  scc: boolean
  website: string
}

const categories: Array<{ title: string; emoji: string; processors: SubProcessor[] }> = [
  {
    title: "Hosting & Infrastruktur",
    emoji: "☁️",
    processors: [
      {
        name: "Vercel Inc.",
        role: "Frontend-Hosting",
        purpose: "Bereitstellung der Web-Anwendung, Edge-Caching, CDN fuer statische Inhalte.",
        location: "Frankfurt am Main (fra1)",
        cloudActRisk: "hoch",
        dataCategories: ["Session-Cookies", "IP-Adressen (anonymisiert)", "HTTP-Request-Metadaten"],
        avvStatus: "integriert",
        scc: true,
        website: "https://vercel.com/legal/dpa"
      },
      {
        name: "Neon Inc.",
        role: "Datenbank-Hosting",
        purpose: "PostgreSQL-Datenbank mit tenant-spezifischer Row-Level Security. Speicherung von Vertragsmetadaten, Analyse-Ergebnissen, Audit-Logs.",
        location: "Frankfurt (eu-central-1)",
        cloudActRisk: "hoch",
        dataCategories: ["Vertragstexte (verschluesselt)", "Analyse-Ergebnisse", "Audit-Events", "Nutzerdaten"],
        avvStatus: "integriert",
        scc: true,
        website: "https://neon.tech/legal/dpa"
      },
      {
        name: "Cloudflare, Inc.",
        role: "CDN & DDoS-Schutz",
        purpose: "Content Delivery, Bot-Abwehr, TLS-Termination am Edge.",
        location: "Global (EU-Routing bevorzugt)",
        cloudActRisk: "hoch",
        dataCategories: ["IP-Adressen", "Request-Headers", "User-Agent-Strings"],
        avvStatus: "integriert",
        scc: true,
        website: "https://www.cloudflare.com/trust-hub/gdpr/"
      }
    ]
  },
  {
    title: "KI-Anbieter (Multi-Provider-Routing)",
    emoji: "🧠",
    processors: [
      {
        name: "Anthropic PBC",
        role: "Primaeres KI-Modell (claude-sonnet-4.6)",
        purpose: "Vertragsanalyse-Pipeline: Risiko-Bewertung und Formulierungsvorschlaege. Kein Training mit Kundendaten (Zero-Data-Retention-API).",
        location: "AWS us-east-1 (US) — EU-Hosting aktuell nicht verfuegbar",
        cloudActRisk: "hoch",
        dataCategories: ["Extrahierter Vertragstext (Textauszug, max. 16000 Zeichen)"],
        avvStatus: "verfuegbar",
        scc: true,
        website: "https://www.anthropic.com/legal/commercial-terms"
      },
      {
        name: "OpenAI, L.L.C.",
        role: "Sekundaeres KI-Modell (gpt-4o-mini, gpt-4o)",
        purpose: "Extraktionsphase der Vertragsanalyse (strukturierte Daten). Kein Training mit API-Daten (Opt-out-Default).",
        location: "Azure EU-Region (weu) bei Enterprise-Tier, sonst US",
        cloudActRisk: "hoch",
        dataCategories: ["Extrahierter Vertragstext", "Prompt-Metadaten"],
        avvStatus: "verfuegbar",
        scc: true,
        website: "https://openai.com/policies/data-processing-addendum/"
      },
      {
        name: "Google LLC (Gemini API)",
        role: "Optionales KI-Modell + OCR-Fallback (gemini-1.5-flash)",
        purpose: "OCR-Extraktion bei gescannten PDFs ohne Text-Layer. Schnelle Voranalyse.",
        location: "Google Cloud EU (europe-west3)",
        cloudActRisk: "hoch",
        dataCategories: ["PDF-Binaerdaten (nur bei OCR-Fallback)", "Extrahierter Text"],
        avvStatus: "verfuegbar",
        scc: true,
        website: "https://cloud.google.com/terms/data-processing-addendum"
      }
    ]
  },
  {
    title: "Authentifizierung & Identitaet",
    emoji: "🔐",
    processors: [
      {
        name: "NextAuth.js / Auth.js",
        role: "Authentifizierungs-Framework",
        purpose: "Self-hosted Session-Management auf Kunden-Infrastruktur. Keine Daten an Dritte.",
        location: "Inhouse (integriert in Vercel-Deployment)",
        cloudActRisk: "keiner",
        dataCategories: ["Email-Adressen", "Session-Tokens"],
        avvStatus: "integriert",
        scc: false,
        website: "https://authjs.dev"
      }
    ]
  },
  {
    title: "Zahlungsabwicklung",
    emoji: "💳",
    processors: [
      {
        name: "Stripe Payments Europe, Ltd.",
        role: "Zahlungsabwickler (Rechnungen, Abonnements)",
        purpose: "Kreditkartenverarbeitung, SEPA-Lastschrift, Rechnungserstellung.",
        location: "Irland (EU)",
        cloudActRisk: "mittel",
        dataCategories: ["Zahlungsdaten", "Rechnungsadresse", "USt-ID"],
        avvStatus: "integriert",
        scc: true,
        website: "https://stripe.com/legal/dpa"
      }
    ]
  },
  {
    title: "Monitoring & Support",
    emoji: "📊",
    processors: [
      {
        name: "Sentry.io (Functional Software, Inc.)",
        role: "Error-Tracking",
        purpose: "Erfassung von Programmfehlern zur Fehleranalyse. Scrubbing sensibler Felder aktiv.",
        location: "Frankfurt (EU-Region)",
        cloudActRisk: "hoch",
        dataCategories: ["Fehler-Stacktraces", "User-ID (pseudonymisiert)"],
        avvStatus: "integriert",
        scc: true,
        website: "https://sentry.io/legal/dpa/"
      },
      {
        name: "Resend, Inc.",
        role: "Transaktions-E-Mail",
        purpose: "System-E-Mails (Passwort-Reset, Onboarding, Benachrichtigungen). Keine Newsletter.",
        location: "AWS eu-west-1 (Dublin)",
        cloudActRisk: "mittel",
        dataCategories: ["Email-Adressen", "E-Mail-Inhalte (System-generiert)"],
        avvStatus: "integriert",
        scc: true,
        website: "https://resend.com/legal/dpa"
      }
    ]
  }
]

function riskBadge(risk: SubProcessor["cloudActRisk"]): { label: string; className: string } {
  if (risk === "hoch") {
    return { label: "CLOUD Act relevant", className: "bg-rose-50 text-rose-700 border-rose-200" }
  }
  if (risk === "mittel") {
    return { label: "Teilweise relevant", className: "bg-amber-50 text-amber-700 border-amber-200" }
  }
  return { label: "Nicht relevant", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
}

export default function SubProzessorenPage() {
  const totalCount = categories.reduce((acc, cat) => acc + cat.processors.length, 0)
  const cloudActCount = categories.reduce(
    (acc, cat) => acc + cat.processors.filter((p) => p.cloudActRisk === "hoch").length,
    0
  )

  return (
    <main className="bg-[#FAFAF7]">
      <section className="border-b border-gray-200 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
            <span className="text-[14px]">📋</span>
            <span className="text-[12px] font-medium text-gold-700">Trust Center · Art. 28 DSGVO</span>
          </div>
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-[#003856] sm:text-[2.75rem]">
            Sub-Prozessoren
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-gray-600">
            Vollstaendige Liste aller Auftragsverarbeiter, die KanzleiAI zur Erbringung
            seiner Dienstleistungen einsetzt. Jeder Sub-Prozessor ist vertraglich zur
            Einhaltung der DSGVO verpflichtet. Standard-Vertragsklauseln (SCC) gemaess
            EU-Kommission-Beschluss 2021/914 liegen vor.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px]">
              <span className="text-gray-500">Gesamt:</span>{" "}
              <span className="font-semibold text-gray-900">{totalCount} Sub-Prozessoren</span>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[13px]">
              <span className="text-rose-700">CLOUD Act relevant:</span>{" "}
              <span className="font-semibold text-rose-900">{cloudActCount}</span>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px]">
              <span className="text-emerald-700">Stand:</span>{" "}
              <span className="font-semibold text-emerald-900">24. April 2026</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-[15px] font-semibold text-amber-900">
              ⚠️ Hinweis CLOUD Act (US-Behoerden-Zugriff)
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-amber-800">
              Einige Sub-Prozessoren sind US-Konzernen zugeordnet und unterliegen damit
              dem US-amerikanischen CLOUD Act. Auch bei physischer Datenspeicherung in
              der EU kann theoretisch ein Herausgabeverlangen durch US-Behoerden erfolgen.
              Fuer Mandate mit besonders hohen Vertraulichkeitsanforderungen (z.B.
              oeffentliche Hand, regulierte Branchen, strafrechtlich relevante Mandate)
              bieten wir einen <Link href="/trust/eu-ai-act" className="underline">
              EU-Souveraenitaets-Modus
              </Link> mit europaeischen LLM-Providern ohne US-Nexus als Option.
            </p>
          </div>
        </div>
      </section>

      {categories.map((category) => (
        <section key={category.title} className="pb-12">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[24px]">{category.emoji}</span>
              <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#003856]">
                {category.title}
              </h2>
            </div>
            <div className="space-y-4">
              {category.processors.map((p) => {
                const risk = riskBadge(p.cloudActRisk)
                return (
                  <article
                    key={p.name}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[16px] font-semibold text-gray-900">{p.name}</h3>
                        <p className="mt-0.5 text-[12px] font-medium text-gold-700">{p.role}</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
                          {p.purpose}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${risk.className}`}
                      >
                        {risk.label}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Standort
                        </dt>
                        <dd className="mt-0.5 text-[13px] text-gray-800">{p.location}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          AVV-Status
                        </dt>
                        <dd className="mt-0.5 text-[13px] capitalize text-gray-800">
                          {p.avvStatus} {p.scc ? "· SCC vorhanden" : ""}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Verarbeitete Datenkategorien
                        </dt>
                        <dd className="mt-0.5 text-[13px] text-gray-800">
                          {p.dataCategories.join(" · ")}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Vertragsdokumente
                        </dt>
                        <dd className="mt-0.5 text-[13px]">
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold-700 underline-offset-2 hover:underline"
                          >
                            DPA / AVV des Anbieters ansehen →
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-[#003856]">
            Aenderungen an der Sub-Prozessoren-Liste
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
            Kunden werden mindestens 30 Tage vor Aufnahme eines neuen Sub-Prozessors
            schriftlich informiert (Art. 28 Abs. 2 lit. d DSGVO). Die Widerspruchsfrist
            betraegt 14 Tage. Bei begruendetem Widerspruch wird im Einzelfall eine
            alternative Loesung gesucht.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/datenschutz"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Datenschutzerklaerung
            </Link>
            <Link
              href="/trust-center"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Trust Center →
            </Link>
            <a
              href="mailto:datenschutz@sbsdeutschland.de"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#003856] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#002a42]"
            >
              Benachrichtigungen anfordern
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
