import type { Metadata } from "next"

export const metadata: Metadata = { title: "Datenschutz & Aufbewahrung" }

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🗄️ Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Datenschutz & Aufbewahrung</h1>
      <p className="mt-2 text-[14px] text-gray-500">Aufbewahrungsfristen, Löschrichtlinien und DSGVO-Einstellungen.</p>
      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <span className="text-[40px]">🗄️</span>
        <h2 className="mt-4 text-[17px] font-semibold text-gray-900">Datenmanagement</h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-gray-500">Diese Funktion wird im naechsten Release verfuegbar sein. Enterprise-Kunden erhalten priorisierten Zugang.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[12px] font-semibold text-amber-700">In Entwicklung</div>
      </div>
    </div>
  )
}
