import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Support", description: "Kontakt und technischer Support fuer KanzleiAI." }

export default function SupportPage() {
  return (
    <main>
      <section className="bg-[#FAFAF7] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-1.5">
            <span className="text-[14px]">🎧</span>
            <span className="text-[12px] font-medium text-gold-700">Support</span>
          </div>
          <h1 className="text-display text-gray-950">Wie koennen wir helfen?</h1>
          <p className="mt-4 text-[17px] text-gray-500">Unser Team unterstuetzt Sie bei technischen Fragen, Integrationen und Onboarding.</p>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <span className="text-[28px]">📧</span>
              <h3 className="mt-3 text-[17px] font-semibold text-gray-900">E-Mail-Support</h3>
              <p className="mt-2 text-[14px] text-gray-500">Technische Fragen, Bug-Reports und Feature-Requests. Antwort innerhalb von 24 Stunden.</p>
              <Link href="mailto:ki@sbsdeutschland.de" className="mt-4 inline-block text-[14px] font-medium text-[#003856] hover:text-[#00507a]">ki@sbsdeutschland.de →</Link>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <span className="text-[28px]">📞</span>
              <h3 className="mt-3 text-[17px] font-semibold text-gray-900">Enterprise-Support</h3>
              <p className="mt-2 text-[14px] text-gray-500">Dedizierter Ansprechpartner, SLA-basierter Support und Onboarding-Begleitung fuer Business- und Enterprise-Kunden.</p>
              <Link href="/enterprise-kontakt" className="mt-4 inline-block text-[14px] font-medium text-[#003856] hover:text-[#00507a]">Kontakt aufnehmen →</Link>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <span className="text-[28px]">📖</span>
              <h3 className="mt-3 text-[17px] font-semibold text-gray-900">Dokumentation</h3>
              <p className="mt-2 text-[14px] text-gray-500">Erste Schritte, Funktionsuebersicht, FAQ und Anleitungen.</p>
              <Link href="/hilfe" className="mt-4 inline-block text-[14px] font-medium text-[#003856] hover:text-[#00507a]">Hilfe & Dokumentation →</Link>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <span className="text-[28px]">📡</span>
              <h3 className="mt-3 text-[17px] font-semibold text-gray-900">Systemstatus</h3>
              <p className="mt-2 text-[14px] text-gray-500">Live-Status aller Services: Datenbank, KI-Provider, API-Endpunkte.</p>
              <Link href="/systemstatus" className="mt-4 inline-block text-[14px] font-medium text-[#003856] hover:text-[#00507a]">Status pruefen →</Link>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-gold-200 bg-gold-50 p-6 text-center">
            <span className="text-[28px]">🕐</span>
            <h3 className="mt-3 text-[17px] font-semibold text-gray-900">Support-Zeiten</h3>
            <p className="mt-2 text-[14px] text-gray-600">Mo-Fr 09:00-18:00 CET · E-Mail-Antwort innerhalb 24h · Enterprise: SLA-basiert</p>
          </div>
        </div>
      </section>
    </main>
  )
}
