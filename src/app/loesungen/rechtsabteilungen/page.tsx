import Link from "next/link"
import type { Metadata } from "next"


export const metadata: Metadata = { title: "Für Rechtsabteilungen", description: "Enterprise-Lösung mit Multi-Tenant, SSO und Portfolio-Analyse." }
export default function RechtsabteilungenPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">🏢</span>
              <span className="text-[12px] font-medium text-gold-700">Für Rechtsabteilungen</span>
            </div>
            <h1 className="text-display text-gray-950">KI-Vertragsanalyse für Rechtsabteilungen</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Standardisieren Sie Ihre Vertragsprüfung unternehmensweit. KanzleiAI bringt Enterprise-KI in Ihre bestehenden Prozesse — DSGVO-konform und mandantengetrennt.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              { emoji: "🏗️", title: "Multi-Tenant Architektur", desc: "Jede Abteilung, Tochtergesellschaft oder Standort kann einen eigenen Mandanten erhalten. Vollständige Datenisolation auf Datenbankebene." },
              { emoji: "👥", title: "Team-Verwaltung & RBAC", desc: "Rollenbasierte Zugriffskontrolle mit Admin, Anwalt und Assistent. SSO-Integration mit Microsoft Entra ID für nahtlosen Zugang." },
              { emoji: "📈", title: "Vertragsportfolio-Analyse", desc: "Analysieren Sie nicht einzelne Verträge, sondern Ihr gesamtes Portfolio. Identifizieren Sie systematische Risiken über Hunderte von Verträgen." },
              { emoji: "🔄", title: "Workflow-Integration", desc: "API-First Architektur für Integration in bestehende Dokumentenmanagementsysteme, SharePoint oder interne Portale." },
              { emoji: "📋", title: "Compliance-Reporting", desc: "Automatische DSGVO-Compliance-Checks für alle Lieferantenverträge. Audit-Trail für regulatorische Nachweise." },
              { emoji: "🤖", title: "Enterprise KI-Governance", desc: "Dokumentierte KI-Entscheidungen, wählbare Modelle (Claude, GPT-4o, Gemini), kein Training mit Ihren Daten." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <span className="text-[28px]">{f.emoji}</span>
                <h3 className="mt-3 text-[17px] font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏭 Einsatzbereiche</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Über die gesamte Organisation</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji: "📑", title: "Einkauf & Beschaffung", desc: "Lieferantenverträge, Rahmenvereinbarungen, AGB-Prüfung" },
              { emoji: "👔", title: "HR & Arbeitsrecht", desc: "Arbeitsverträge, Aufhebungsvereinbarungen, Betriebsvereinbarungen" },
              { emoji: "🏗️", title: "IT & Digitalisierung", desc: "SaaS-Verträge, Lizenzvereinbarungen, Cloud-Verträge" },
              { emoji: "🏦", title: "Finanzen & Treasury", desc: "Kreditverträge, Sicherungsvereinbarungen, Leasingverträge" },
              { emoji: "🔐", title: "Datenschutz & Compliance", desc: "AVV-Prüfung, DSGVO-Konformität, Drittlandtransfer" },
              { emoji: "🤝", title: "Vertrieb & Partnerschaften", desc: "Vertriebsverträge, Kooperationsvereinbarungen, NDAs" },
            ].map((area) => (
              <div key={area.title} className="rounded-2xl border border-gray-100 bg-white p-5">
                <span className="text-[22px]">{area.emoji}</span>
                <h3 className="mt-2 text-[15px] font-semibold text-gray-900">{area.title}</h3>
                <p className="mt-1 text-[13px] text-gray-500">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">🏢</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Enterprise-Lösung für Ihre Rechtsabteilung</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">Individuelle Konfiguration, SSO-Integration und dedizierter Support. Sprechen Sie mit unserem Enterprise-Team.</p>
          <div className="mt-8">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Enterprise-Demo anfragen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
