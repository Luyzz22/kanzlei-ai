import Link from "next/link"
import type { Metadata } from "next"


export const metadata: Metadata = { title: "Für Kanzleien", description: "Mandantenverträge in Sekunden prüfen mit KI-Copilot." }
export default function KanzleienPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">⚖️</span>
              <span className="text-[12px] font-medium text-gold-700">Für Kanzleien</span>
            </div>
            <h1 className="text-display text-gray-950">KI-Vertragsanalyse für Kanzleien</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Prüfen Sie Mandantenverträge in Sekunden statt Stunden. KanzleiAI unterstützt Anwälte bei der Risikobewertung, Klauselprüfung und DSGVO-Compliance.</p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              { emoji: "⏱️", title: "90% schnellere Erstprüfung", desc: "Claude Sonnet 4 analysiert einen 20-Seiten-Vertrag in unter 30 Sekunden. Risiken, fehlende Klauseln und DSGVO-Verstöße werden sofort identifiziert." },
              { emoji: "🎯", title: "Risiko-Score pro Vertrag", desc: "Jeder Vertrag erhält einen Risiko-Score von 0-100 mit farbcodierten Findings. Priorisieren Sie Ihre Prüfung nach Dringlichkeit." },
              { emoji: "🤖", title: "Contract Copilot", desc: "Stellen Sie dem KI-Assistenten Fragen zu jedem analysierten Vertrag. Erhalten Sie juristische Einschätzungen mit BGB-Referenzen in Sekunden." },
              { emoji: "📊", title: "Strukturierte Datenextraktion", desc: "Parteien, Laufzeiten, Kündigungsfristen, SLA-Werte, Gebühren — automatisch aus dem Vertrag extrahiert und tabellarisch aufbereitet." },
              { emoji: "🔐", title: "Mandantentrennung", desc: "Row-Level Security garantiert vollständige Datentrennung. Kein Mandant kann Daten eines anderen einsehen — DSGVO-konform by Design." },
              { emoji: "📋", title: "Audit Trail", desc: "Jede Analyse wird mit Zeitstempel, Modell und Ergebnis protokolliert. Perfekt für Compliance-Nachweise und Qualitätssicherung." },
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Typische Vertragstypen</p>
            <h2 className="mt-3 text-display-sm text-gray-950">Optimiert für Kanzlei-Alltag</h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["SaaS-Verträge", "Arbeitsverträge", "NDAs", "Dienstleistungsverträge", "Lieferantenverträge", "Mietverträge", "Kaufverträge", "Lizenzverträge"].map((t) => (
              <div key={t} className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-center text-[14px] font-medium text-gray-700">{t}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">⚖️</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Bereit für Ihre Kanzlei?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">Testen Sie KanzleiAI mit Ihren eigenen Verträgen. Unverbindliche Demo in 30 Minuten.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Demo vereinbaren</Link>
            <Link href="/preise" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Preise ansehen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
