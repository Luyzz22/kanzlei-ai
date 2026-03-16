import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { ProcessFlow } from "@/components/marketing/process-flow"
import { SectionIntro } from "@/components/marketing/section-intro"
import { StatusBadge } from "@/components/marketing/status-badge"

const integrationskategorien = [
  {
    title: "Dokumentenquellen",
    description:
      "Typische Anbindungsfelder für den strukturierten Dokumenteneingang, damit Vorgänge im richtigen Organisationskontext erfasst werden.",
    meta: "Vorgesehene Anbindungskategorie"
  },
  {
    title: "Identität und Zugriff",
    description:
      "Einbindung in bestehende Rollen- und Zugriffsmodelle zur kontrollierten Zusammenarbeit zwischen Fachbereichen und Administration.",
    meta: "Rollen- und Governance-Bezug"
  },
  {
    title: "Administrations- und Governance-Anbindung",
    description:
      "Prozessorientierte Übergabe von Zuständigkeiten, Prüfschritten und Nachweisanforderungen entlang interner Kontrollpfade.",
    meta: "Kontrollierte Einbindung"
  },
  {
    title: "Export, Nachweise und Weiterverarbeitung",
    description:
      "Ergebnisse, Prüfstände und Dokumentationsartefakte können für nachgelagerte Abstimmungen im Legal- und Compliance-Kontext aufbereitet werden.",
    meta: "Weiterverarbeitung im Unternehmenskontext"
  },
  {
    title: "Zukünftige Enterprise-Integrationen",
    description:
      "Weitere Anbindungsfelder werden nach Priorität, Governance-Anforderungen und kundenspezifischem Einsatzprofil geplant.",
    meta: "Roadmap-orientierter Ausbau"
  }
]

const workflowBeispiele = [
  {
    title: "Vertragsdokument im Eingang",
    description:
      "Ein Dokument wird übernommen, organisatorisch zugeordnet und für die juristische Prüfung in einen strukturierten Bearbeitungskontext überführt."
  },
  {
    title: "Datenschutzdokumente in der Review-Queue",
    description:
      "Neue Unterlagen werden gebündelt priorisiert, mit Review-Hinweisen versehen und in den Freigabekontext der zuständigen Rollen übergeben."
  },
  {
    title: "Governance-bezogene Abstimmung",
    description:
      "Administrations- und Governance-Rollen dokumentieren Prüfschritte nachvollziehbar, bevor Ergebnisse intern weitergegeben werden."
  },
  {
    title: "Nachweise für Folgeprozesse",
    description:
      "Relevante Bearbeitungsstände werden strukturiert bereitgestellt, um interne Kontrollen und externe Rückfragen konsistent zu unterstützen."
  }
]

export default function IntegrationenPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Integrationen"
        title="Integrationsfähigkeit für kontrollierte Einbindung in bestehende Systemlandschaften"
        description="KanzleiAI ist auf die strukturierte Einbindung in Dokumenten-, Governance- und Administrationsprozesse ausgelegt. Die Seite richtet sich an IT, Legal, Compliance und Beschaffung, die Integrationsrahmen belastbar einordnen möchten."
      />

      <InfoPanel title="Integrationslogik entlang des Prozessflusses" tone="muted">
        <ProcessFlow
          steps={[
            {
              title: "Dokumenteneingang und Intake",
              description:
                "Eingänge werden erfasst und in einen belastbaren Bearbeitungskontext überführt, statt isoliert in Einzelschritten verarbeitet zu werden."
            },
            {
              title: "Organisatorische Zuordnung",
              description:
                "Dokumente werden Rollen, Teams und Organisationskontexten zugeordnet, damit Zuständigkeiten klar abgebildet bleiben."
            },
            {
              title: "Prüfung, Review und Governance",
              description:
                "Juristische und organisatorische Prüfschritte werden nachvollziehbar geführt und für Freigaben dokumentiert."
            },
            {
              title: "Ausgabe und Weiterverarbeitung",
              description:
                "Ergebnisse und Nachweise werden für Folgeprozesse im Legal-, Compliance- und Administrationskontext bereitgestellt."
            }
          ]}
        />
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrationskategorien.map((kategorie) => (
          <FeatureCard
            key={kategorie.title}
            title={kategorie.title}
            description={kategorie.description}
            meta={kategorie.meta}
          />
        ))}
      </section>

      <InfoPanel title="Reifegradmodell für Integrationskontexte">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Verfügbar" tone="success" />
          <StatusBadge label="Vorbereitet" tone="info" />
          <StatusBadge label="Kundenspezifische Anbindung" tone="warning" />
          <StatusBadge label="In Planung" tone="neutral" />
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            Die Einordnung erfolgt je Anwendungsfall, Organisationskontext und Governance-Anforderung; sie ist keine pauschale Live-Zusage für alle Integrationsszenarien.
          </li>
          <li>
            Integrationsfelder werden bewusst konservativ beschrieben, um Beschaffungs-, IT- und Compliance-Prüfungen eine belastbare Grundlage zu geben.
          </li>
        </ul>
      </InfoPanel>

      <InfoPanel title="Integrationsprinzipien und Architekturleitlinien" tone="dark">
        <ul className="list-disc space-y-2 pl-5 text-slate-200">
          <li>Kontrollierte Einbindung statt unstrukturierter Punkt-zu-Punkt-Verknüpfung.</li>
          <li>Verarbeitung im Organisations- und Rollenkontext mit Governance-Bezug.</li>
          <li>Nachvollziehbarkeit von Prüfschritten, Freigaben und Nachweisen.</li>
          <li>Schrittweiser Ausbau entlang priorisierter Enterprise-Anforderungen.</li>
        </ul>
      </InfoPanel>

      <InfoPanel title="Konzeptionelle Workflow-Beispiele">
        <div className="grid gap-4 md:grid-cols-2">
          {workflowBeispiele.map((workflow) => (
            <FeatureCard key={workflow.title} title={workflow.title} description={workflow.description} tone="muted" />
          ))}
        </div>
      </InfoPanel>

      <CtaPanel
        title="Integrationsrahmen strukturiert abstimmen"
        description="Für konkrete Anforderungen aus Beschaffung, IT, Legal und Compliance unterstützen wir eine geordnete Einordnung von Scope, Reifegrad und nächstem Umsetzungsschritt."
        primaryLabel="Enterprise-Kontakt"
        primaryHref="/enterprise-kontakt"
        secondaryLabel="Trust Center"
        secondaryHref="/trust-center"
      />
    </main>
  )
}
