import Link from "next/link"
import type { Metadata } from "next"

const trustDomains = [
  {
    emoji: "🔐",
    title: "Datenschutz & DSGVO",
    description: "Personenbezogene Daten werden ausschließlich innerhalb der EU verarbeitet. Alle Prozesse folgen den Anforderungen der DSGVO und sind durch eine AVV abgesichert.",
    items: ["Art. 28 DSGVO-konforme AVV", "EU-Datenresidenz (Frankfurt)", "Datensparsamkeit by Design", "Löschkonzept mit Nachweis"]
  },
  {
    emoji: "🛡️",
    title: "Sicherheitsarchitektur",
    description: "Enterprise-Grade Sicherheit auf allen Ebenen — von der Verschlüsselung über Zugriffskontrollen bis zur manipulationssicheren Protokollierung.",
    items: ["TLS 1.3 End-to-End", "Row-Level Security (Mandantentrennung)", "RBAC mit Rollenkonzept", "Hash-verketteter Audit Trail"]
  },
  {
    emoji: "📋",
    title: "Governance & Compliance",
    description: "Dokumentierte Prozesse, Richtlinien und Nachweise für interne und externe Audits. Bereit für ISO 27001-Prüfungen.",
    items: ["Zentrale Richtlinienverwaltung", "Audit-Protokolle mit Zeitstempel", "Versionierte Prompt-Governance", "Incident-Response-Dokumentation"]
  },
  {
    emoji: "🤖",
    title: "KI-Transparenz",
    description: "Vollständige Nachvollziehbarkeit aller KI-Entscheidungen. Jede Analyse dokumentiert Modell, Provider, Token-Verbrauch und Verarbeitungszeit.",
    items: ["Multi-Provider KI (Claude, GPT, Gemini)", "Modell-Auswahl pro Analyse dokumentiert", "Human-in-the-Loop Pflicht", "Kein Training mit Kundendaten"]
  },
]

const certifications = [
  { emoji: "🇪🇺", label: "DSGVO-konform", status: "Aktiv" },
  { emoji: "🔒", label: "SOC 2 Type II", status: "In Vorbereitung" },
  { emoji: "📋", label: "ISO 27001", status: "In Vorbereitung" },
  { emoji: "🏛️", label: "BSI C5", status: "Geplant" },
]

const faqs = [
  { q: "Wo werden meine Daten gespeichert?", a: "Alle Daten werden auf Servern in Frankfurt am Main (EU) verarbeitet und gespeichert. Es findet kein Transfer in Drittländer statt." },
  { q: "Werden meine Vertragsdaten für KI-Training verwendet?", a: "Nein. Ihre Daten werden ausschließlich zur Vertragsanalyse verarbeitet und niemals für das Training von KI-Modellen verwendet." },
  { q: "Wie ist die Mandantentrennung sichergestellt?", a: "Jeder Mandant hat eine eigene Tenant-ID. Row-Level Security in der Datenbank stellt sicher, dass kein mandantenübergreifender Zugriff möglich ist." },
  { q: "Kann ich eine AVV abschließen?", a: "Ja. Wir stellen eine DSGVO-konforme Auftragsverarbeitungsvereinbarung bereit, die auf Anfrage oder beim Onboarding abgeschlossen wird." },
  { q: "Wie werden KI-Entscheidungen nachvollziehbar gemacht?", a: "Jede Analyse wird mit Modellname, Provider, Token-Verbrauch, Verarbeitungszeit und dem vollständigen Prompt im Audit Trail dokumentiert." },
]


export const metadata: Metadata = { title: "Trust Center — Datenschutz & Sicherheit", description: "Datenschutz, Sicherheit, Compliance und KI-Governance bei KanzleiAI." }
export default function TrustCenterPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🛡️</span>
              <span className="text-[12px] font-medium text-gold-700">Vertrauen & Sicherheit</span>
            </div>
            <h1 className="text-display text-gray-950">Trust Center</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">
              Transparenz über Datenschutz, Sicherheit, Compliance und KI-Governance. Alle Informationen, die Ihr Datenschutzbeauftragter braucht.
            </p>
          </div>
        </div>
      </section>

      {/* Certifications Strip */}
      <section className="border-y border-gray-200 bg-gold-50/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4 lg:px-10">
          {certifications.map((cert) => (
            <div key={cert.label} className="bg-white px-6 py-6 text-center sm:py-7">
              <span className="text-[20px]">{cert.emoji}</span>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{cert.label}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                cert.status === "Aktiv" ? "bg-emerald-100 text-emerald-700" : cert.status === "Geplant" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"
              }`}>{cert.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Domains */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔍 Vier Säulen</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Sicherheit auf allen Ebenen</h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {trustDomains.map((domain) => (
              <div key={domain.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <span className="text-[28px]">{domain.emoji}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-gray-900">{domain.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{domain.description}</p>
                <ul className="mt-4 space-y-2">
                  {domain.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-gray-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">❓ Häufige Fragen</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Datenschutz & Sicherheit FAQ</h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-[15px] font-medium text-gray-900">
                  {faq.q}
                  <svg className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-[14px] leading-relaxed text-gray-600">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">📞</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Fragen zu Datenschutz & Sicherheit?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">
            Unser Team steht für Gespräche mit Datenschutzbeauftragten, IT-Security und Compliance-Abteilungen zur Verfügung.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Sicherheitsgespräch vereinbaren</Link>
            <Link href="/datenschutz" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Datenschutzerklärung</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
