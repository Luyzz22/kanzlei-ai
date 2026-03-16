import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { ProcessFlow } from "@/components/marketing/process-flow"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

const kernmodule = [
  {
    title: "Dokumenten-Workspace",
    description:
      "Zentrale Arbeitsoberfläche für vertrags- und dokumentennahe Vorgänge mit klarer Struktur für Intake, Bearbeitung und Ablage.",
    meta: "Dokumente und Organisation"
  },
  {
    title: "Prüf- und Freigabekontext",
    description:
      "Juristische Analyse, Review und Freigaben werden in nachvollziehbaren Schritten geführt, damit Entscheidungen fachlich eingeordnet bleiben.",
    meta: "Prüfpfade und Verantwortung"
  },
  {
    title: "Audit und Nachweise",
    description:
      "Relevante Aktivitäten und Prozesszustände werden nachweisorientiert dokumentiert, um interne Kontrollen und externe Abstimmungen zu unterstützen.",
    meta: "Governance und Transparenz"
  },
  {
    title: "Administration und Rollen",
    description:
      "Mandantenfähige Zugriffssteuerung mit Rollenmodellen und klarer Zuordnung von Zuständigkeiten für Teams, Fachbereiche und Administration.",
    meta: "Rollen und Zugriffe"
  },
  {
    title: "Trust, Compliance und KI-Transparenz",
    description:
      "Sicherheits- und Compliance-Informationen sind strukturiert verfügbar, inklusive Einordnung des KI-Einsatzes für beschaffungsrelevante Fragen.",
    meta: "Trust Layer"
  }
]

export default function ProduktPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Produkt"
        title="KanzleiAI als strukturierte Plattform für Vertrags-, Dokumenten- und Governance-Prozesse"
        description="KanzleiAI bündelt operative Dokumentenarbeit, juristische Prüfung und Governance-Anforderungen in einer konsistenten Arbeitsumgebung für Kanzleien und Unternehmensbereiche."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kernmodule.map((modul) => (
          <FeatureCard key={modul.title} title={modul.title} description={modul.description} meta={modul.meta} />
        ))}
      </section>

      <InfoPanel title="Typischer Ablauf vom Eingang bis zum Nachweis">
        <ProcessFlow
          steps={[
            {
              title: "Eingang und Intake",
              description:
                "Dokumente werden erfasst, organisatorisch zugeordnet und für die weitere Bearbeitung im richtigen Kontext vorbereitet."
            },
            {
              title: "Prüfung und Analyse",
              description:
                "Inhalte werden entlang juristischer und organisatorischer Kriterien bewertet, priorisiert und mit Bearbeitungshinweisen versehen."
            },
            {
              title: "Review und Governance",
              description:
                "Fachliche Freigaben, Rückfragen und Zuständigkeiten werden transparent geführt, damit Entscheidungen nachvollziehbar bleiben."
            },
            {
              title: "Nachweise und Audit",
              description:
                "Relevante Aktivitäten werden für interne Kontrollen und externe Prüfkontexte strukturiert dokumentiert."
            }
          ]}
        />
      </InfoPanel>

      <CtaPanel
        title="Produkt und Beschaffung im Detail abstimmen"
        description="Für Enterprise-Anforderungen unterstützen wir eine strukturierte Erstklärung mit Fokus auf Scope, Rollenmodell, Governance und Compliance-Kontext."
        primaryLabel="Enterprise-Kontakt"
        primaryHref="/enterprise-kontakt"
        secondaryLabel="Trust Center"
        secondaryHref="/trust-center"
      />
    </PageShell>
  )
}
