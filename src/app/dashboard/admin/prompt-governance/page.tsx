import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Prompt Governance" }

export default function PromptGovernancePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-700">🤖 Administration</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-gray-950">Prompt Governance</h1>
      <p className="mt-2 text-[14px] text-gray-500">KI-Prompt-Versionen, Release-Prozesse und Qualitaetskontrolle.</p>

      <div className="mt-10">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Aktive Prompt-Versionen</h2>
        <div className="mt-3 space-y-2">
          {[
            { name: "contract-analysis-v2", model: "Claude Sonnet 4", version: "2.0.0", lastUpdate: "05.04.2026", status: "Produktiv" },
            { name: "copilot-conversation-v1", model: "Claude Sonnet 4", version: "1.2.0", lastUpdate: "04.04.2026", status: "Produktiv" },
            { name: "contract-analysis-fallback", model: "GPT-4o", version: "1.0.0", lastUpdate: "03.04.2026", status: "Fallback" },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-3.5">
              <div>
                <code className="text-[13px] font-medium text-[#003856]">{p.name}</code>
                <p className="text-[11px] text-gray-500">{p.model} · v{p.version} · {p.lastUpdate}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === "Produktiv" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">Governance-Regeln</h2>
        <div className="mt-3 space-y-2">
          {[
            { emoji: "📝", rule: "Alle Prompts sind versioniert und im Repository dokumentiert" },
            { emoji: "👀", rule: "Prompt-Aenderungen erfordern Review vor Produktiv-Deployment" },
            { emoji: "🧪", rule: "Neue Versionen werden gegen Referenz-Vertraege getestet" },
            { emoji: "📊", rule: "Ergebnis-Qualitaet wird regelmaessig gegen manuelle Pruefung validiert" },
            { emoji: "🚫", rule: "Keine Kundendaten im Prompt-Text — nur Vertragstext als Input" },
            { emoji: "📋", rule: "Modell-Version und Prompt-Version werden im Audit-Trail protokolliert" },
          ].map((r) => (
            <div key={r.rule} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
              <span className="text-[16px]">{r.emoji}</span>
              <span className="text-[13px] text-gray-700">{r.rule}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard/admin" className="text-[13px] font-medium text-[#003856] hover:text-[#00507a]">← Zurueck zur Verwaltung</Link>
      </div>
    </div>
  )
}
