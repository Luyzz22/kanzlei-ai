import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

const paketlogik = [
  {
    title: "Team / Einstieg",
    description:
      "Für kleinere Teams mit fokussierten Dokumenten- und Prüfprozessen sowie klar abgegrenztem Rollenset.",
    meta: "Grundlage für geordneten Start"
  },
  {
    title: "Business",
    description:
      "Für wachsende Einheiten mit erweitertem Rollenmodell, höherem Governance-Bedarf und abgestimmten Betriebsprozessen.",
    meta: "Skalierung für Fachbereiche"
  },
  {
    title: "Enterprise",
    description:
      "Für organisationsweite Nutzung mit erweiterten Anforderungen an Administration, Beschaffung, Security-Review und Integration.",
    meta: "Beschaffungsfähiger Unternehmensrahmen"
  }
]

const vergleich = [
  {
    title: "Rollen und Zugriffe",
    description: "Ausprägung des Rollenmodells, Mandanten- und Zugriffsanforderungen je Organisationseinheit."
  },
  {
    title: "Governance und Audit",
    description: "Nachweisumfang, Dokumentationsanforderungen und Einbindung in interne Kontrollprozesse."
  },
  {
    title: "Integrationen, SSO und SCIM",
    description: "Technische Anbindung an bestehende Identitäts- und Systemlandschaften im Unternehmenskontext."
  },
  {
    title: "Support und Beschaffungskontext",
    description: "Abgestimmte Betriebs- und Kommunikationswege für Einführung, Betrieb und organisatorische Abstimmungen."
  }
]

export default function PreisePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Preise"
        title="Paketlogik für B2B- und Enterprise-Beschaffung"
        description="KanzleiAI wird entlang von Umfang, Rollenmodell und Governance-Anforderungen angeboten. Statt fixer Pauschalen erfolgt die Einordnung auf Basis des tatsächlichen Einsatzkontexts."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {paketlogik.map((paket) => (
          <FeatureCard key={paket.title} title={paket.title} description={paket.description} meta={paket.meta} />
        ))}
      </section>

      <InfoPanel title="Vergleichsdimensionen für die Angebotskalkulation">
        <div className="grid gap-4 md:grid-cols-2">
          {vergleich.map((punkt) => (
            <FeatureCard key={punkt.title} title={punkt.title} description={punkt.description} tone="muted" />
          ))}
        </div>
      </InfoPanel>

      <InfoPanel title="Hinweis zur Preis- und Angebotslogik" tone="accent">
        <p>
          Preise und Angebot werden auf Basis von Umfang, Nutzerrollen, Integrationsbedarf und Compliance-Anforderungen
          abgestimmt. Dadurch bleibt die Beschaffung für Kanzleien und Unternehmen transparent und belastbar planbar.
        </p>
      </InfoPanel>

      <CtaPanel
        title="Angebotsrahmen abstimmen"
        description="Für eine belastbare Einordnung klären wir gemeinsam Anforderungen, Rollenszenario und Beschaffungskontext."
        primaryLabel="Enterprise-Kontakt"
        primaryHref="/enterprise-kontakt"
        secondaryLabel="Trust Center"
        secondaryHref="/trust-center"
      />
    </PageShell>
  )
}
