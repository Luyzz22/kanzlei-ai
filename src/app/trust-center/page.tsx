import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { ProcessFlow } from "@/components/marketing/process-flow"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"

const trustDomaenen = [
  {
    title: "Datenschutz und Vertraulichkeit",
    description: "Mandats- und Personendaten werden innerhalb klar definierter Verarbeitungszwecke mit dokumentierten Schutzmaßnahmen verarbeitet.",
    meta: "DSGVO-orientierte Betriebsprozesse"
  },
  {
    title: "Sicherheitsbetrieb",
    description: "Zugriffe, Rollen und sicherheitsrelevante Ereignisse werden nachvollziehbar geführt, um operative Transparenz zu gewährleisten.",
    meta: "Kontinuierliche Betriebsüberwachung"
  },
  {
    title: "Governance und Nachweise",
    description: "Richtlinien, Runbooks und Audit-nahe Unterlagen sind zentral abgelegt und in Governance-Prozesse eingebunden.",
    meta: "Prüfbare Dokumentationsbasis"
  }
]

export default function TrustCenterPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Trust Center"
        title="Vertrauens- und Nachweisbereich für KanzleiAI"
        description="Dieser Bereich bündelt Sicherheits-, Datenschutz- und Governance-Informationen in einer strukturierten, prüfbaren Darstellung für Kanzleien, Fachbereiche und Compliance-Verantwortliche."
      />

      <InfoPanel title="Aktueller Betriebsstatus" tone="muted">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label="Plattformbetrieb stabil" tone="success" />
          <StatusBadge label="Audit-Logging aktiv" tone="info" />
          <StatusBadge label="Review-Zyklen terminiert" tone="warning" />
        </div>
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-3">
        {trustDomaenen.map((bereich) => (
          <FeatureCard key={bereich.title} title={bereich.title} description={bereich.description} meta={bereich.meta} />
        ))}
      </section>

      <InfoPanel title="Wie Nachweise bereitgestellt werden">
        <ProcessFlow
          steps={[
            {
              title: "Fachbereich dokumentiert Kontrollstand",
              description: "Richtlinien, Prozessstände und Betriebshinweise werden in standardisierten Nachweisformaten erfasst."
            },
            {
              title: "Compliance prüft Vollständigkeit",
              description: "Inhalte werden auf Relevanz, Aktualität und Nachvollziehbarkeit für Kanzlei- und Mandantenanforderungen geprüft."
            },
            {
              title: "Freigabe für Stakeholder-Sicht",
              description: "Freigegebene Informationen werden im Trust Center konsistent und revisionsnah bereitgestellt."
            },
            {
              title: "Laufende Aktualisierung",
              description: "Wesentliche Änderungen in Prozessen oder Richtlinien werden zeitnah nachgeführt."
            }
          ]}
        />
      </InfoPanel>

      <CtaPanel
        title="Nächster Schritt"
        description="Für konkrete Prüfungen können Sie direkt in die Sicherheits- und Compliance-Detailansicht wechseln oder die Dokumentenübersicht im Workspace öffnen."
        primaryLabel="Sicherheit & Compliance öffnen"
        primaryHref="/sicherheit-compliance"
        secondaryLabel="Zum Dokumenten-Workspace"
        secondaryHref="/workspace/dokumente"
      />
    </main>
  )
}
