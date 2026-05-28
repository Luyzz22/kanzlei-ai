import Link from "next/link"

export const dynamic = "force-dynamic"

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💳 Verwaltung</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Abrechnung & Nutzung</h1>
      <p className="mt-2 text-[14px] text-gray-500">Plan, Verbrauch und Rechnungen verwalten.</p>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center">
        <span className="text-[40px]">💳</span>
        <h2 className="mt-4 text-[18px] font-semibold text-gray-900">Abrechnung wird eingerichtet</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-gray-500">
          Ihr Abrechnungsbereich wird gerade konfiguriert. Plan-Details, Verbrauchsübersichten und Rechnungen sind in Kürze hier verfügbar.
        </p>
        <p className="mt-6 text-[14px] text-gray-700">
          Für Fragen zu Ihrem Plan wenden Sie sich direkt an:{" "}
          <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856] underline hover:text-[#00507a]">
            ki@sbsdeutschland.de
          </Link>
        </p>
      </div>

      <div className="mt-6">
        <Link href="/dashboard" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurück zum Dashboard</Link>
      </div>
    </div>
  )
}
