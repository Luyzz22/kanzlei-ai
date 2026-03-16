import { StatusBadge } from "@/components/marketing/status-badge"

const trustSignals = [
  "Mandantengetrennte Datenhaltung",
  "Auditfähige Prozesshistorie",
  "DSGVO-orientierte EU-Betriebsregion",
  "KI-Unterstützung mit Human-in-the-Loop"
]

export function TrustStrip() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Trust-Signale</p>
        {trustSignals.map((signal) => (
          <StatusBadge key={signal} label={signal} tone="neutral" className="bg-slate-50" />
        ))}
      </div>
    </section>
  )
}
