import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

export default function DatenschutzPage() {
  return (
    <PageShell width="narrow">
      <PageHero
        eyebrow="Trust · Datenschutz"
        title="Datenschutzerklärung"
        description="Übersicht zur Verarbeitung personenbezogener Daten im Plattformbetrieb, zur Protokollierung und zur organisatorischen Absicherung im Mandantenkontext."
      />

      <InfoPanel title="Grundlage der Verarbeitung" tone="default">
        Diese Plattform verarbeitet personenbezogene Daten ausschließlich auf Grundlage von Art. 6 DSGVO. Alle Daten
        werden verschlüsselt übertragen und in europäischen Rechenzentren gespeichert.
      </InfoPanel>

      <section className="grid gap-4">
        <FeatureCard title="Bereitstellung der Plattformfunktionen" description="Verarbeitung von Nutzungs- und Organisationsdaten für Arbeitsoberflächen, Rollenmodelle und Mandantenkontext." />
        <FeatureCard title="Sicherheits- und Audit-Logging" description="Erfassung sicherheitsrelevanter Aktionen zur Nachvollziehbarkeit, Fehlersuche und Governance-Dokumentation." />
        <FeatureCard title="Vertragsabwicklung und Support" description="Verarbeitung notwendiger Kontakt- und Vertragsdaten für Betrieb, Betreuung und Abstimmung mit Ansprechpartnern." />
      </section>
    </PageShell>
  )
}
