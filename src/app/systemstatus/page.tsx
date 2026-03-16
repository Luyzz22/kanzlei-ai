import Link from "next/link"

import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"
import { StatusBadge } from "@/components/marketing/status-badge"
import { betriebsprinzipien, systemstatusModule } from "@/config/system-status"

const statusTone = {
  "Statusdarstellung im Aufbau": "warning",
  "Betriebsnahe Sicht": "info",
  "Monitoring-Ausbau vorgesehen": "neutral"
} as const

export default function SystemstatusPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Systemstatus"
        title="Transparenz zur Betriebslage von KanzleiAI"
        description="Diese Seite bietet eine konservative, strukturierte Einordnung zentraler Produktbereiche. Sie ist aktuell keine vollwertige Live-Statusplattform, sondern eine betriebsnahe Statusdarstellung im Aufbau."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {systemstatusModule.map((modul) => (
          <article key={modul.bereich} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">{modul.bereich}</h2>
              <StatusBadge label={modul.status} tone={statusTone[modul.status]} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{modul.beschreibung}</p>
          </article>
        ))}
      </section>

      <InfoPanel title="Transparenz im Betrieb" tone="muted">
        <ul className="list-disc space-y-1 pl-5">
          {betriebsprinzipien.map((prinzip) => (
            <li key={prinzip}>{prinzip}</li>
          ))}
        </ul>
      </InfoPanel>

      <InfoPanel title="Technischer Referenzpunkt" tone="default">
        <p>
          Für technische Basisprüfungen steht ein Health-Endpunkt zur Verfügung. Die Auswertung bleibt Aufgabe technischer Rollen und ersetzt keine fachliche Statuskommunikation.
        </p>
        <div className="mt-3">
          <Link href="/api/health" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
            Health-Endpunkt öffnen
          </Link>
        </div>
      </InfoPanel>
    </PageShell>
  )
}
