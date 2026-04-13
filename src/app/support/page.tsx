import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Support", description: "Hilfe und Kontakt fuer KanzleiAI-Nutzer." }

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">💬 Support</p>
      <h1 className="mt-2 text-display text-gray-950">Wie koennen wir helfen?</h1>
      <p className="mt-4 text-[16px] text-gray-500">Unser Team unterstuetzt Sie bei Fragen zur Plattform, Einrichtung und Enterprise-Integration.</p>

      {/* Contact Channels */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <span className="text-[28px]">📧</span>
          <h2 className="mt-3 text-[17px] font-semibold text-gray-900">E-Mail Support</h2>
          <p className="mt-2 text-[14px] text-gray-500">Technische Fragen, Feature-Anfragen und allgemeiner Support.</p>
          <Link href="mailto:ki@sbsdeutschland.de" className="mt-4 inline-block rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">ki@sbsdeutschland.de</Link>
          <p className="mt-3 text-[12px] text-gray-400">Antwortzeit: In der Regel innerhalb von 4 Stunden (Mo-Fr)</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <span className="text-[28px]">🏢</span>
          <h2 className="mt-3 text-[17px] font-semibold text-gray-900">Enterprise Support</h2>
          <p className="mt-2 text-[14px] text-gray-500">Dedizierter Ansprechpartner, SLA-basiert, Onboarding-Begleitung.</p>
          <Link href="/enterprise-kontakt" className="mt-4 inline-block rounded-full bg-[#003856] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#002a42]">Enterprise-Kontakt</Link>
          <p className="mt-3 text-[12px] text-gray-400">Fuer Business- und Enterprise-Kunden mit priorisiertem Support</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-10">
        <h2 className="text-[15px] font-semibold text-gray-900">Schnelle Hilfe</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { emoji: "📖", title: "Hilfe-Center", desc: "Getting Started, Features, FAQ", href: "/hilfe" },
            { emoji: "📋", title: "Release Notes", desc: "Alle Updates und Aenderungen", href: "/release-notes" },
            { emoji: "🔧", title: "Systemstatus", desc: "Echtzeit-Status aller Systeme", href: "/systemstatus" },
            { emoji: "🔐", title: "Sicherheit", desc: "Sicherheitsmassnahmen und Compliance", href: "/sicherheit-compliance" },
            { emoji: "🛡️", title: "Trust Center", desc: "Datenschutz, AVV, Sub-Processors", href: "/trust-center" },
            { emoji: "🤖", title: "KI-Transparenz", desc: "Modelle, Grundsaetze, Datenfluss", href: "/ki-transparenz" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-gold-300 hover:bg-gold-50/30">
              <span className="mt-0.5 text-[16px]">{link.emoji}</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">{link.title}</p>
                <p className="text-[11px] text-gray-500">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div className="mt-10 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900">Support-Zeiten</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="text-[13px] text-gray-600"><span className="font-medium text-gray-900">Mo — Fr:</span> 09:00 — 18:00 CET</div>
          <div className="text-[13px] text-gray-600"><span className="font-medium text-gray-900">Enterprise:</span> Erweiterter Support nach SLA</div>
          <div className="text-[13px] text-gray-600"><span className="font-medium text-gray-900">Sprachen:</span> Deutsch, Englisch</div>
        </div>
      </div>
    </main>
  )
}
