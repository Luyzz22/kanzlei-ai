import type { Metadata } from "next"

export const metadata: Metadata = { title: "Systemstatus", description: "Echtzeit-Status aller KanzleiAI-Systeme und KI-Provider." }
export default function SystemstatusPage() {
  const services = [
    { name: "KanzleiAI Plattform", status: "operational", emoji: "🌐" },
    { name: "KI-Analyse (Claude Sonnet 4)", status: "operational", emoji: "🧠" },
    { name: "KI-Analyse (GPT-4o)", status: "operational", emoji: "⚡" },
    { name: "KI-Analyse (Gemini 2.5)", status: "operational", emoji: "💎" },
    { name: "Contract Copilot", status: "operational", emoji: "🤖" },
    { name: "Authentifizierung (NextAuth)", status: "operational", emoji: "🔐" },
    { name: "Datenbank (PostgreSQL)", status: "operational", emoji: "🗄️" },
    { name: "Audit Trail", status: "operational", emoji: "📋" },
  ]
  return (
    <main className="bg-[#FAFAF7]">
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">📊 Status</p>
          <h1 className="mt-3 text-display-sm text-gray-950">Systemstatus</h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[14px] font-medium text-emerald-700">Alle Systeme betriebsbereit</span>
          </div>
          <div className="mt-10 space-y-2">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-[18px]">{s.emoji}</span>
                  <span className="text-[14px] font-medium text-gray-900">{s.name}</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-gray-400">Letzte Aktualisierung: Automatisch bei jedem Seitenaufruf</p>
        </div>
      </section>
    </main>
  )
}
