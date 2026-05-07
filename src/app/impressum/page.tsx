import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum der KanzleiAI-Plattform von SBS Deutschland GmbH & Co. KG gemäß § 5 DDG."
}

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-950">Impressum</h1>
      <p className="mt-2 text-[14px] text-gray-500">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>
      <p className="mt-1 text-[12px] text-gray-400">Stand: Mai 2026</p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Anbieter und verantwortliche Stelle</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-700">
            <p className="font-semibold text-gray-900">SBS Deutschland GmbH & Co. KG</p>
            <p className="mt-2">In der Dell 19</p>
            <p>69469 Weinheim</p>
            <p>Deutschland</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Vertretung</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p><span className="font-medium text-gray-900">Geschäftsführer:</span> Andreas Schenk</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Kontakt</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p>Telefon: +49 (0) 6201 24469</p>
            <p className="mt-1">E-Mail: <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link></p>
            <p className="mt-1">Web: <Link href="https://www.kanzlei-ai.com" className="font-medium text-[#003856]">www.kanzlei-ai.com</Link></p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Handelsregister</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p><span className="font-medium text-gray-900">Registergericht:</span> Amtsgericht Mannheim</p>
            <p className="mt-1"><span className="font-medium text-gray-900">Registernummer:</span> HRA 706204</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Umsatzsteuer-Identifikationsnummer</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p>USt-IdNr. gemäß § 27a UStG: <span className="font-medium text-gray-900">DE345927327</span></p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p className="font-medium text-gray-900">Luis Schenk</p>
            <p className="mt-1">In der Dell 19</p>
            <p>69469 Weinheim, Deutschland</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Hinweis zur Nutzung von Künstlicher Intelligenz</h2>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-[14px] leading-relaxed text-amber-800">
            <p className="font-semibold">Transparenzhinweis gemäß Art. 50 Verordnung (EU) 2024/1689 (KI-Verordnung)</p>
            <p className="mt-2">KanzleiAI nutzt Systeme der Künstlichen Intelligenz zur Vertragsanalyse, Risikoerkennung und Dokumentenverarbeitung. KI-generierte Ergebnisse werden in der Benutzeroberfläche als solche gekennzeichnet. Sämtliche KI-Ergebnisse sind maschinell erzeugte Vorschläge und keine rechts- oder fachverbindlichen Aussagen.</p>
            <p className="mt-2">Kundendaten werden nicht zum Training von KI-Modellen verwendet (Zero Data Retention). Weitere Informationen: <Link href="/ki-transparenz" className="font-medium underline">KI-Transparenz</Link></p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Haftung für Inhalte</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-600">
            <p>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
            <p className="mt-3">Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Urheberrecht</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-600">
            <p>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">EU-Streitschlichtung</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-600">
            <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <Link href="https://ec.europa.eu/consumers/odr/" className="font-medium text-[#003856]" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr/</Link></p>
            <p className="mt-2">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Unsere Dienste richten sich ausschließlich an Unternehmer im Sinne des § 14 BGB.</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Rechtliche Dokumente</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/datenschutz" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">Datenschutzerklärung</Link>
            <Link href="/agb" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">AGB</Link>
            <Link href="/avv" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">AVV</Link>
            <Link href="/trust-center" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">Trust Center</Link>
            <Link href="/sicherheit-compliance" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">Sicherheit</Link>
            <Link href="/ki-transparenz" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-medium text-[#003856] transition-colors hover:bg-stone-50">KI-Transparenz</Link>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-[12px] text-gray-400">Rechtsgrundlage: § 5 DDG (Digitale-Dienste-Gesetz), § 18 MStV (Medienstaatsvertrag). Dieses Impressum gilt für kanzlei-ai.com und www.kanzlei-ai.com.</p>
        </div>
      </div>
    </main>
  )
}
