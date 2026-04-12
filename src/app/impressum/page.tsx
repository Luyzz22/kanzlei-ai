import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Impressum", description: "Impressum der KanzleiAI-Plattform von SBS Deutschland GmbH & Co. KG." }

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-950">Impressum</h1>
      <p className="mt-2 text-[14px] text-gray-500">Angaben gemaess § 5 TMG</p>

      <div className="mt-10 space-y-8">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Anbieter</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-700">
            <p className="font-semibold text-gray-900">SBS Deutschland GmbH & Co. KG</p>
            <p className="mt-2">Heiligkreuzsteinach, Baden-Wuerttemberg</p>
            <p>Deutschland</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Kontakt</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p>E-Mail: <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link></p>
            <p className="mt-1">Web: <Link href="https://www.kanzlei-ai.com" className="font-medium text-[#003856]">www.kanzlei-ai.com</Link></p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Verantwortlich fuer den Inhalt</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] text-gray-700">
            <p>Verantwortlich gemaess § 55 Abs. 2 RStV:</p>
            <p className="mt-1 font-medium text-gray-900">SBS Deutschland GmbH & Co. KG</p>
            <p>Heiligkreuzsteinach, Deutschland</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Haftungshinweis</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-600">
            <p>Die Inhalte unserer Seiten wurden mit groesster Sorgfalt erstellt. Fuer die Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte koennen wir jedoch keine Gewaehr uebernehmen. Als Diensteanbieter sind wir gemaess § 7 Abs. 1 TMG fuer eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, uebermittelte oder gespeicherte fremde Informationen zu ueberwachen oder nach Umstaenden zu forschen, die auf eine rechtswidrige Taetigkeit hinweisen.</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Urheberrecht</h2>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 text-[14px] leading-relaxed text-gray-600">
            <p>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfaeltigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechtes beduerfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">KI-Hinweis</h2>
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-[14px] leading-relaxed text-amber-800">
            <p>KanzleiAI nutzt kuenstliche Intelligenz (KI) zur Vertragsanalyse. KI-generierte Ergebnisse stellen keine Rechtsberatung dar und ersetzen nicht die Pruefung durch qualifizierte Juristen. Die Verantwortung fuer alle auf Basis der KI-Analyse getroffenen Entscheidungen liegt beim Nutzer. Weitere Informationen: <Link href="/ki-transparenz" className="font-medium underline">KI-Transparenz</Link></p>
          </div>
        </div>

        <div className="flex gap-4 border-t border-gray-200 pt-6 text-[13px]">
          <Link href="/datenschutz" className="font-medium text-[#003856] hover:text-[#00507a]">Datenschutz</Link>
          <Link href="/avv" className="font-medium text-[#003856] hover:text-[#00507a]">AVV</Link>
          <Link href="/trust-center" className="font-medium text-[#003856] hover:text-[#00507a]">Trust Center</Link>
          <Link href="/sicherheit-compliance" className="font-medium text-[#003856] hover:text-[#00507a]">Sicherheit</Link>
        </div>
      </div>
    </main>
  )
}
