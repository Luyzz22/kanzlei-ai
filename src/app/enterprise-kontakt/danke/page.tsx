import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Anfrage erhalten", description: "Vielen Dank fuer Ihre Enterprise-Anfrage." }

export default function DankePage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 py-20">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
          <span className="text-[28px]">✅</span>
        </div>
        <h1 className="mt-5 text-[1.5rem] font-semibold tracking-tight text-gray-950">Vielen Dank fuer Ihre Anfrage</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-500">Wir haben Ihre Nachricht erhalten und melden uns innerhalb von 24 Stunden bei Ihnen. Fuer dringende Anfragen erreichen Sie uns direkt unter <Link href="mailto:ki@sbsdeutschland.de" className="font-medium text-[#003856]">ki@sbsdeutschland.de</Link>.</p>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <h2 className="text-[14px] font-semibold text-gray-900">Was passiert als Naechstes?</h2>
          <div className="mt-4 space-y-3 text-left">
            {[
              { step: "1", text: "Wir pruefen Ihre Anfrage und bereiten eine individuelle Demo vor" },
              { step: "2", text: "Sie erhalten einen Terminvorschlag fuer ein 30-Min Erstgespraech" },
              { step: "3", text: "Im Gespraech klären wir Scope, Rollenmodell und Compliance-Kontext" },
              { step: "4", text: "Sie erhalten einen kostenlosen Pilot-Zugang fuer Ihr Team" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#003856] text-[11px] font-bold text-white">{s.step}</span>
                <p className="text-[13px] text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="rounded-full bg-[#003856] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#002a42]">Zur Startseite</Link>
          <Link href="/produkt" className="rounded-full border border-gray-200 bg-white px-6 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50">Produkt ansehen</Link>
        </div>
      </div>
    </main>
  )
}
