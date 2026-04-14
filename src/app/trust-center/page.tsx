import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Trust Center", description: "Datenschutz, Sicherheit, Compliance und KI-Governance bei KanzleiAI." }
export const revalidate = 3600 // ISR: 1 Stunde

const trustPillars = [
  {
    emoji: "🔐",
    title: "Datensicherheit",
    desc: "TLS 1.3, AES-256, HSTS, Row-Level Security auf 12 PostgreSQL-Tabellen. Defense-in-Depth auf jeder Ebene.",
    href: "/sicherheit-compliance",
    link: "Details ansehen →"
  },
  {
    emoji: "🇪🇺",
    title: "DSGVO-Konformitaet",
    desc: "Privacy by Design. Datenminimierung, Zweckbindung, Loeschkonzept. AVV nach Art. 28 DSGVO verfuegbar.",
    href: "/datenschutz",
    link: "Datenschutzerklaerung →"
  },
  {
    emoji: "🤖",
    title: "KI-Transparenz",
    desc: "Kein Training mit Kundendaten. Multi-Provider Architektur dokumentiert. Prompt Governance mit Versionierung.",
    href: "/ki-transparenz",
    link: "KI-Transparenz →"
  },
  {
    emoji: "📋",
    title: "Audit & Nachweise",
    desc: "Manipulationssicherer Audit Trail. Jede Aktion mit Akteur, Mandant und Zeitstempel dokumentiert.",
    href: "/dashboard/audit",
    link: "Audit-Protokoll →"
  },
]

const certifications = [
  { emoji: "🇪🇺", label: "DSGVO", status: "Konform", color: "emerald" },
  { emoji: "🏛️", label: "GoBD-Naehe", status: "Umgesetzt", color: "blue" },
  { emoji: "📊", label: "ISO 27001", status: "Vorbereitet", color: "amber" },
  { emoji: "📜", label: "AVV Art. 28", status: "Verfuegbar", color: "emerald" },
  { emoji: "🔒", label: "SOC 2 Type II", status: "Geplant", color: "gray" },
  { emoji: "🛡️", label: "BSI C5", status: "Roadmap", color: "gray" },
]

const securityMeasures = [
  { label: "Verschluesselung", value: "TLS 1.3 + AES-256", emoji: "🔐" },
  { label: "Mandantentrennung", value: "Row-Level Security (12 Tabellen)", emoji: "🏗️" },
  { label: "Zugriffskontrolle", value: "RBAC (Admin, Anwalt, Assistent)", emoji: "👤" },
  { label: "Session-Sicherheit", value: "JWT, 24h MaxAge", emoji: "⏱️" },
  { label: "Security Headers", value: "HSTS, X-Frame DENY, CSP", emoji: "🛡️" },
  { label: "Datenresidenz", value: "EU (Frankfurt am Main)", emoji: "🇩🇪" },
  { label: "Audit Trail", value: "16 Event-Typen, Tenant-Kontext", emoji: "📋" },
  { label: "Health Monitoring", value: "Live-Checks DB + KI-Provider", emoji: "📡" },
]

export default function TrustCenterPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🛡️</span>
              <span className="text-[12px] font-medium text-gold-700">Trust Center</span>
            </div>
            <h1 className="text-display text-gray-950">Vertrauen durch Transparenz</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">KanzleiAI wurde fuer juristische Teams gebaut, die hoechste Anforderungen an Datenschutz, Sicherheit und Nachvollziehbarkeit haben.</p>
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {trustPillars.map((pillar) => (
              <div key={pillar.title} className="rounded-2xl border border-gray-100 bg-white p-7">
                <span className="text-[32px]">{pillar.emoji}</span>
                <h3 className="mt-4 text-[18px] font-semibold text-gray-900">{pillar.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{pillar.desc}</p>
                <Link href={pillar.href} className="mt-4 inline-block text-[13px] font-medium text-[#003856] hover:text-[#00507a]">{pillar.link}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📜 Compliance-Status</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {certifications.map((cert) => (
              <div key={cert.label} className="rounded-xl border border-gray-100 bg-white p-4 text-center">
                <span className="text-[22px]">{cert.emoji}</span>
                <p className="mt-2 text-[13px] font-semibold text-gray-900">{cert.label}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cert.color === "emerald" ? "bg-emerald-100 text-emerald-700" : cert.color === "blue" ? "bg-blue-100 text-blue-700" : cert.color === "amber" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{cert.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🔧 Technische Massnahmen</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Sicherheitsarchitektur</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {securityMeasures.map((m) => (
              <div key={m.label} className="rounded-xl border border-gray-100 bg-white p-4">
                <span className="text-[18px]">{m.emoji}</span>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{m.label}</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-Processors */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏢 Unterauftragsverarbeiter</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Transparente Lieferkette</h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200">
            <div className="hidden bg-gray-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-3">
              <span>Dienstleister</span><span>Zweck</span><span>Standort</span>
            </div>
            {[
              { name: "Vercel Inc.", purpose: "Hosting, Edge Network", loc: "USA (EU-Routing)" },
              { name: "Neon Inc.", purpose: "PostgreSQL-Datenbank", loc: "EU (Frankfurt)" },
              { name: "Anthropic PBC", purpose: "KI (Claude Sonnet 4)", loc: "USA (EU-Endpoint)" },
              { name: "OpenAI Inc.", purpose: "KI (GPT-4o Fallback)", loc: "USA (EU-Endpoint)" },
              { name: "Google LLC", purpose: "KI (Gemini)", loc: "USA (EU-Endpoint)" },
              { name: "Resend Inc.", purpose: "E-Mail-Versand", loc: "USA" },
              { name: "Stripe Inc.", purpose: "Zahlungsabwicklung", loc: "USA/EU" },
            ].map((sub) => (
              <div key={sub.name} className="grid border-t border-gray-100 bg-white px-5 py-3.5 text-[13px] sm:grid-cols-3">
                <span className="font-medium text-gray-900">{sub.name}</span>
                <span className="text-gray-600">{sub.purpose}</span>
                <span className="text-gray-500">{sub.loc}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-gray-400">Mit allen Unterauftragsverarbeitern bestehen SCCs oder gleichwertige Vereinbarungen.</p>
        </div>
      </section>

      {/* Documents */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📄 Dokumente</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Compliance-Dokumentation</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              { emoji: "📋", title: "Datenschutzerklaerung", href: "/datenschutz", desc: "10 Sektionen, DSGVO-konform" },
              { emoji: "📜", title: "AVV (Art. 28 DSGVO)", href: "/avv", desc: "8 Sektionen, TOM, Sub-Processors" },
              { emoji: "🛡️", title: "Sicherheit & Compliance", href: "/sicherheit-compliance", desc: "6 Security-Layer, Compliance-Status" },
              { emoji: "🤖", title: "KI-Transparenz", href: "/ki-transparenz", desc: "Modelle, Prompt Gov, Human-in-the-Loop" },
              { emoji: "📡", title: "Systemstatus", href: "/systemstatus", desc: "Live-Checks DB + KI-Provider" },
              { emoji: "📝", title: "Release Notes", href: "/release-notes", desc: "Changelog v1.0 bis v1.8" },
            ].map((doc) => (
              <Link key={doc.title} href={doc.href} className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-gold-200 hover:shadow-card">
                <span className="text-[22px]">{doc.emoji}</span>
                <div>
                  <p className="text-[14px] font-medium text-gray-900 group-hover:text-[#003856]">{doc.title}</p>
                  <p className="mt-0.5 text-[12px] text-gray-500">{doc.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-display-sm text-gray-950">Fragen zur Sicherheit?</h2>
          <p className="mt-4 text-[16px] text-gray-500">Wir stellen Ihnen gerne weitere Dokumentation fuer Ihre interne Sicherheitspruefung zur Verfuegung.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Sicherheitsgespraech vereinbaren</Link>
            <Link href="/avv" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">AVV ansehen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
