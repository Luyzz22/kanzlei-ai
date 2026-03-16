import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

export default function AvvPage() {
  return (
    <PageShell width="narrow">
      <PageHero
        eyebrow="Trust · Vertragsunterlagen"
        title="AVV-Template (Art. 28 DSGVO)"
        description="Dieses Muster dient als Grundlage für den Auftragsverarbeitungsvertrag zwischen Kanzlei als Verantwortlicher und KanzleiAI als Auftragsverarbeiter."
      />

      <FeatureCard title="1. Gegenstand und Dauer" description="Verarbeitung juristischer Falldaten für die Dauer des Hauptvertrages im vereinbarten Mandantenkontext." />

      <InfoPanel title="2. Technische und organisatorische Maßnahmen" tone="muted">
        <ul className="list-disc space-y-1 pl-6 text-slate-700">
          <li>Verschlüsselung at-rest und in-transit</li>
          <li>Rollenbasierte Zugriffskontrolle (RBAC)</li>
          <li>Protokollierung sicherheitsrelevanter Aktionen</li>
        </ul>
      </InfoPanel>
    </PageShell>
  )
}
