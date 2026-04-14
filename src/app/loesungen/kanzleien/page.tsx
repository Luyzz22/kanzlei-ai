import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fuer Kanzleien & Notare", description: "KI-Vertragsanalyse fuer Kanzleien: Mandantenvertraege in Sekunden pruefen, Risiken bewerten, DSGVO-konform." }
export const revalidate = 3600 // ISR: 1 Stunde

export default function KanzleienPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
              <span className="text-[14px]">⚖️</span>
              <span className="text-[12px] font-medium text-gold-700">Fuer Kanzleien & Notare</span>
            </div>
            <h1 className="text-display text-gray-950">KI-Vertragsanalyse fuer Kanzleien</h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-500">Pruefen Sie Mandantenvertraege in Sekunden statt Stunden. Risikobewertung, Klauselpruefung und Copilot — alles DSGVO-konform und mandantengetrennt.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Demo vereinbaren</Link>
              <Link href="/workspace/analyse" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Jetzt testen</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">⚡ Ihr Workflow</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Von Upload bis Gutachten in 60 Sekunden</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {[
              { step: "1", emoji: "📤", title: "Vertrag hochladen", desc: "Mandantenvertrag als PDF — Sprache wird automatisch erkannt." },
              { step: "2", emoji: "🧠", title: "KI analysiert", desc: "3 KI-Provider pruefen Risiken, extrahieren Daten, identifizieren Klauseln." },
              { step: "3", emoji: "🤖", title: "Copilot befragen", desc: "Rueckfragen zum Vertrag stellen — mit BGB-Referenzen und Kontext." },
              { step: "4", emoji: "📄", title: "Report exportieren", desc: "PDF-Gutachten, DATEV-Export oder JSON fuer Ihr DMS." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#003856] text-[13px] font-bold text-white">{s.step}</span>
                <span className="mt-3 block text-[24px]">{s.emoji}</span>
                <h3 className="mt-2 text-[15px] font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-[13px] text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 bg-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🏗️ Features</p>
          <h2 className="mt-3 text-center text-display-sm text-gray-950">Gebaut fuer den Kanzlei-Alltag</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              { emoji: "⏱️", title: "90% schnellere Erstpruefung", desc: "Ein 20-Seiten-Vertrag in unter 30 Sekunden. Risiken, fehlende Klauseln und DSGVO-Verstoesse sofort identifiziert." },
              { emoji: "🎯", title: "Risiko-Score 0-100", desc: "Farbcodierte Bewertung mit Ampel-System. Priorisieren Sie Ihre Pruefung nach Dringlichkeit — rot, gelb, gruen." },
              { emoji: "🤖", title: "Contract Copilot", desc: "KI-Assistent mit Vertragskontext. BGB-Referenzen, Klausel-Erklaerungen und Formulierungsvorschlaege in Echtzeit." },
              { emoji: "✏️", title: "Formulierungsvorschlaege", desc: "Fuer jedes Hochrisiko-Finding generiert die KI eine alternative Klausel — direkt einsetzbar in Verhandlungen." },
              { emoji: "📅", title: "Fristen-Dashboard", desc: "Kuendigungsfristen, Auto-Renewal, Vertragsende — alles auf einen Blick mit Ampel-System und Export." },
              { emoji: "🔐", title: "Mandantentrennung", desc: "Row-Level Security garantiert vollstaendige Datentrennung. DSGVO-konform by Design." },
              { emoji: "📋", title: "Audit Trail", desc: "Hash-verkettete Protokollierung jeder Aktion. Perfekt fuer Compliance-Nachweise und Qualitaetssicherung." },
              { emoji: "📊", title: "4 Export-Formate", desc: "PDF-Gutachten, DATEV fuer Steuerkanzleien, CSV fuer Excel, JSON fuer Entwickler und DMS-Integration." },
              { emoji: "⚖️", title: "16 Vertragstypen DE/EN", desc: "Spezialisierte Pruefkataloge fuer 8 deutsche und 8 englische Vertragstypen mit sprachspezifischen Risiken." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <span className="text-[24px]">{f.emoji}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="text-[28px]">⚖️</span>
          <h2 className="mt-3 text-display-sm text-gray-950">Bereit fuer Ihre Kanzlei?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-gray-500">Testen Sie KanzleiAI mit Ihren eigenen Mandantenvertraegen. Kostenloser Pilot, persoenliche Einfuehrung.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">Demo vereinbaren</Link>
            <Link href="/preise" className="rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">Preise ansehen</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
