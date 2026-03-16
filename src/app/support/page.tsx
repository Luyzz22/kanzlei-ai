import Link from "next/link"

import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"
import { StatusBadge } from "@/components/marketing/status-badge"
import { supportKategorien } from "@/config/support"

const einordnungTone = {
  "Betriebsnah": "info",
  Organisatorisch: "neutral",
  "Compliance-relevant": "warning"
} as const

export default function SupportPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Support"
        title="Support-Einstieg für operative und organisatorische Anliegen"
        description="Support ist sinnvoll bei konkreten Betriebsproblemen, Zugriffsfragen oder nachweisrelevanten Rückfragen. Für allgemeine Produktorientierung und Selbsthilfe ist primär der Hilfebereich vorgesehen."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {supportKategorien.map((kategorie) => (
          <article key={kategorie.titel} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">{kategorie.titel}</h2>
              <StatusBadge label={kategorie.einordnung} tone={einordnungTone[kategorie.einordnung]} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{kategorie.zweck}</p>
            <FeatureCard
              title="Typische Anwendungsfälle"
              description={`• ${kategorie.anwendungsfaelle.join("\n• ")}`}
              tone="muted"
            />
          </article>
        ))}
      </section>

      <InfoPanel title="Kontakt- und Eskalationswege (read-only Darstellung)" tone="default">
        <div className="space-y-3">
          <p>
            Für konkrete Kontaktaufnahme nutzen Sie den belastbaren Kontaktweg im Impressum. Dieser PR implementiert bewusst keine Formularübermittlung und kein Ticket-Handling.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/impressum" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zum Impressum und Kontaktweg
            </Link>
            <Link href="/hilfe" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Zur Hilfe
            </Link>
          </div>
        </div>
      </InfoPanel>

      <InfoPanel title="Hinweis zum aktuellen Implementierungsumfang" tone="accent">
        <ul className="list-disc space-y-1 pl-5">
          <li>Ticketing, Priorisierung und SLA-nahe Supportlogik folgen in späterem Ausbau.</li>
          <li>Diese Seite dient als strukturierte, read-only Einordnung von Support-Anliegen.</li>
          <li>Es werden keine Supportdaten verarbeitet oder gespeichert.</li>
        </ul>
      </InfoPanel>
    </PageShell>
  )
}
