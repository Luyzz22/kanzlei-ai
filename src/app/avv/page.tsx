import Link from "next/link"

export default function AVVPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Rechtliches</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Auftragsverarbeitungsvereinbarung (AVV)</h1>
          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
            <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6">
              <p className="text-[15px] font-medium text-gold-800">Eine individuelle Auftragsverarbeitungsvereinbarung gemäß Art. 28 DSGVO wird im Rahmen des Enterprise-Onboardings bereitgestellt.</p>
              <p className="mt-3 text-[14px] text-gold-700">Kontaktieren Sie uns unter ki@sbsdeutschland.de oder über unser Kontaktformular.</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Gegenstand der AVV</h2>
              <p className="mt-3">Die AVV regelt die Verarbeitung personenbezogener Daten durch KanzleiAI im Auftrag des Kunden. Sie umfasst die technischen und organisatorischen Maßnahmen, Unterauftragsverarbeiter, Kontrollrechte und Pflichten bei Datenschutzverletzungen.</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Inhalte der AVV</h2>
              <ul className="mt-3 space-y-2">
                {["Gegenstand und Dauer der Verarbeitung", "Art und Zweck der Verarbeitung", "Art der personenbezogenen Daten", "Kategorien betroffener Personen", "Technische und organisatorische Maßnahmen (TOMs)", "Unterauftragsverarbeiter und Genehmigungsverfahren", "Kontrollrechte des Auftraggebers", "Meldepflichten bei Datenschutzverletzungen", "Löschung und Rückgabe von Daten"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[14px]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4">
              <Link href="/enterprise-kontakt" className="rounded-full bg-[#003856] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#002a42]">AVV anfordern</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
