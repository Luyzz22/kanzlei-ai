const trustSignals = [
  "Mandantengetrennte Datenhaltung",
  "Auditfähige Prozesshistorie",
  "DSGVO-orientierte EU-Betriebsregion",
  "KI-Unterstützung mit Human-in-the-Loop"
]

export function TrustStrip() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">Trust-Signale</p>
        {trustSignals.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-[12px] font-medium text-gray-600"
          >
            {signal}
          </span>
        ))}
      </div>
    </section>
  )
}
