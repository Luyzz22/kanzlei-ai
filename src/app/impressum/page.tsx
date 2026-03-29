export default function ImpressumPage() {
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📋 Rechtliches</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Impressum</h1>
          <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Angaben gemäß § 5 TMG</h2>
              <p className="mt-3">SBS Deutschland GmbH & Co. KG<br/>In der Dell 19<br/>69469 Weinheim<br/>Deutschland</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Vertreten durch</h2>
              <p className="mt-3">Persönlich haftende Gesellschafterin: SBS Deutschland Verwaltungs GmbH<br/>Geschäftsführer: Luis Schenk</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Kontakt</h2>
              <p className="mt-3">E-Mail: ki@sbsdeutschland.de</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Registereintrag</h2>
              <p className="mt-3">Handelsregister: Amtsgericht Mannheim<br/>Registernummer: [wird ergänzt]</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Umsatzsteuer-ID</h2>
              <p className="mt-3">Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [wird ergänzt]</p>
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p className="mt-3">Luis Schenk<br/>In der Dell 19<br/>69469 Weinheim</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
