import Link from "next/link"

const topics = [
  { emoji: "📤", title: "Vertrag hochladen", desc: "PDF oder TXT hochladen und KI-Analyse starten. Drag & Drop oder Dateiauswahl." },
  { emoji: "🔍", title: "Schnellanalyse", desc: "Die KI extrahiert Daten, bewertet Risiken und gibt Handlungsempfehlungen in Sekunden." },
  { emoji: "🤖", title: "Contract Copilot", desc: "Stellen Sie Fragen zu Verträgen im Chat. Der Copilot kennt Ihren geladenen Vertrag." },
  { emoji: "📊", title: "Risiko-Score", desc: "Automatische Bewertung von 0-100 basierend auf identifizierten Risiken und Schweregrad." },
  { emoji: "👥", title: "Team & Rollen", desc: "Laden Sie Kollegen ein und weisen Sie Rollen zu (Admin, Jurist, Assistent)." },
  { emoji: "📋", title: "Audit Trail", desc: "Alle Aktionen werden manipulationssicher protokolliert — für Compliance und Nachweise." },
]

export default function HilfePage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💡 Support</p>
            <h1 className="mt-3 text-display-sm text-gray-950">Hilfe & Dokumentation</h1>
            <p className="mt-4 text-[17px] text-gray-500">Alles was Sie für den Einstieg in KanzleiAI brauchen.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <div key={t.title} className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-card">
                <span className="text-[24px]">{t.emoji}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-gray-900">{t.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-[14px] text-gray-500">Weitere Fragen? Kontaktieren Sie uns unter</p>
            <Link href="mailto:ki@sbsdeutschland.de" className="mt-1 inline-block text-[15px] font-medium text-[#003856] hover:text-[#00507a]">ki@sbsdeutschland.de</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
