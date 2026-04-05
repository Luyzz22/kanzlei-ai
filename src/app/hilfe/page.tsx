import Link from "next/link"
import type { Metadata } from "next"

const gettingStarted = [
  { step: "1", emoji: "🔑", title: "Anmelden", desc: "Melden Sie sich mit Ihren Zugangsdaten an oder nutzen Sie den Demo-Zugang (demo@kanzlei-ai.com)." },
  { step: "2", emoji: "📤", title: "Vertrag hochladen", desc: "PDF oder TXT per Drag & Drop oder Dateiauswahl in die Schnellanalyse laden." },
  { step: "3", emoji: "🧠", title: "KI analysiert", desc: "Claude Sonnet 4 extrahiert Daten, bewertet Risiken und identifiziert kritische Klauseln." },
  { step: "4", emoji: "📊", title: "Ergebnisse prüfen", desc: "Risiko-Score, extrahierte Daten, Findings mit Klausel-Zitaten und Handlungsempfehlungen." },
  { step: "5", emoji: "🤖", title: "Copilot nutzen", desc: "Stellen Sie Fragen zum Vertrag — der Copilot kennt den analysierten Kontext." },
  { step: "6", emoji: "📄", title: "Exportieren", desc: "PDF-Report, JSON, CSV oder DATEV-Format — direkt herunterladen." },
]

const topics = [
  { emoji: "⚡", title: "Schnellanalyse", desc: "PDF hochladen → KI-Analyse in unter 30 Sekunden. Risiko-Score, extrahierte Daten, Klausel-Zitate.", href: "/workspace/analyse" },
  { emoji: "🤖", title: "Contract Copilot", desc: "Chat mit KI-Vertragskontext. Fragen zum Vertrag stellen, Klauseln bewerten lassen, BGB-Referenzen.", href: "/workspace/copilot" },
  { emoji: "📋", title: "Analyseverlauf", desc: "Alle Analysen automatisch gespeichert. Suchen, filtern, Statistiken, CSV/DATEV-Export.", href: "/workspace/history" },
  { emoji: "📄", title: "Export-Formate", desc: "PDF (druckoptimiert), JSON (strukturiert), CSV (Excel), DATEV Format 510 (Buchungsstapel).", href: "/workspace/analyse" },
  { emoji: "🔐", title: "Mandantentrennung", desc: "Row-Level Security auf DB-Ebene. Jeder Mandant sieht nur seine eigenen Daten.", href: "/sicherheit-compliance" },
  { emoji: "📡", title: "API & Webhooks", desc: "REST API, Event-Webhooks, n8n/Slack-Integration. Automatisierte Benachrichtigungen.", href: "/developer" },
]

const faq = [
  { q: "Welche Dateiformate werden unterstützt?", a: "PDF und TXT. Die KI extrahiert Text aus PDFs automatisch — auch aus gescannten Dokumenten." },
  { q: "Wie genau ist die KI-Analyse?", a: "KanzleiAI nutzt Claude Sonnet 4 (Anthropic) als primäres Modell. Die Analyse identifiziert typische Risiken nach deutschem Recht, ersetzt aber keine anwaltliche Beratung." },
  { q: "Werden meine Daten für KI-Training verwendet?", a: "Nein. Kein KI-Provider nutzt Ihre Vertragsdaten zum Training. Dies ist vertraglich durch AVVs mit allen Providern abgesichert." },
  { q: "Kann ich KanzleiAI in meine Systeme integrieren?", a: "Ja — über REST API und Webhooks. DATEV-Export, n8n-Automation und Slack-Benachrichtigungen sind bereits verfügbar." },
  { q: "Wie funktioniert die Mandantentrennung?", a: "Row-Level Security auf PostgreSQL-Ebene. Jeder Tenant hat isolierte Datenbereiche. Kein mandantenübergreifender Zugriff ist technisch möglich." },
  { q: "Gibt es eine Testphase?", a: "Ja — wir richten einen Pilot-Tenant mit echten Vertragsanalysen ein. 14 Tage, keine Kreditkarte." },
]

export const metadata: Metadata = { title: "Hilfe & Dokumentation", description: "Erste Schritte, FAQ und Funktionsübersicht für KanzleiAI." }

export default function HilfePage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">💡</span>
              <span className="text-[12px] font-medium text-gold-700">Hilfe</span>
            </div>
            <h1 className="text-display text-gray-950">Hilfe & Dokumentation</h1>
            <p className="mt-4 text-[17px] text-gray-500">Alles was Sie für den Einstieg und die tägliche Arbeit mit KanzleiAI brauchen.</p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🚀 Erste Schritte</p>
          <h2 className="mt-3 text-display-sm text-gray-950">In 6 Schritten zum ersten Ergebnis</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gettingStarted.map((s) => (
              <div key={s.step} className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700">{s.step}</span>
                  <span className="text-[20px]">{s.emoji}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Reference */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📖 Funktionen</p>
          <h2 className="mt-3 text-display-sm text-gray-950">Funktionsübersicht</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <Link key={t.title} href={t.href} className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-gold-200 hover:shadow-card">
                <span className="text-[24px]">{t.emoji}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900 group-hover:text-[#003856]">{t.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">❓ FAQ</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Häufige Fragen</h2>
          <div className="mt-10 space-y-3">
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

      {/* Contact */}
      <section className="border-t border-gray-200 bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-display-sm text-gray-950">Noch Fragen?</h2>
          <p className="mt-4 text-[16px] text-gray-500">Unser Team hilft Ihnen gerne weiter.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="mailto:ki@sbsdeutschland.de" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">📧 ki@sbsdeutschland.de</Link>
            <Link href="/enterprise-kontakt" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Demo anfragen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
