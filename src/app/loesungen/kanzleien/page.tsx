import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { PageHero } from "@/components/marketing/page-hero"
import { PageShell } from "@/components/marketing/page-shell"

const kanzleiUseCases = [
  "Mandatsvereinbarungen",
  "Vertraulichkeitsvereinbarungen (NDA)",
  "Auftragsverarbeitungsverträge (AVV)",
  "Rahmenverträge und Nachträge",
  "Interne Prüf- und Freigabeschritte"
]

const rollenbilder = [
  {
    title: "Partner",
    description: "Steuern Freigaben, priorisieren risikorelevante Fälle und behalten den Nachweisstand für Mandate im Blick."
  },
  {
    title: "Associate / juristische Bearbeitung",
    description: "Bearbeiten Prüfkontexte strukturiert und dokumentieren Hinweise, Rückfragen und Entscheidungsvorlagen."
  },
  {
    title: "Assistenz / Intake",
    description: "Übernehmen Eingang, Vorstrukturierung und korrekte Zuordnung von Dokumenten in den jeweiligen Mandatskontext."
  },
  {
    title: "Datenschutz / Compliance",
    description: "Prüfen Vorgänge auf Nachvollziehbarkeit, Datenschutzbezug und dokumentierte Governance-Schritte."
  }
]

export default function LoesungKanzleienPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Lösungen für Kanzleien"
        title="Strukturierte Dokumentenarbeit für den Kanzleialltag"
        description="KanzleiAI unterstützt Kanzleien dabei, vertrags- und dokumentennahe Arbeit in nachvollziehbaren Prüf- und Freigabekontexten zu organisieren."
      />

      <InfoPanel title="Typische Use-Cases in Kanzleien" tone="muted">
        <ul className="grid gap-2 sm:grid-cols-2">
          {kanzleiUseCases.map((useCase) => (
            <li key={useCase} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {useCase}
            </li>
          ))}
        </ul>
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-2">
        {rollenbilder.map((rolle) => (
          <FeatureCard
            key={rolle.title}
            title={rolle.title}
            description={rolle.description}
            meta="Rollenbild im Kanzleikontext"
          />
        ))}
      </section>

      <InfoPanel title="Strukturierter Nutzen für Kanzleien">
        <ul className="list-disc space-y-2 pl-5">
          <li>Nachvollziehbarkeit in der Bearbeitung von Dokumenten und Verträgen.</li>
          <li>Ordnung in Intake, Prüfung und Ablage über klare Prozessschritte.</li>
          <li>Dokumentenprüfung mit konsistenter Einordnung und Review-Kontext.</li>
          <li>Governance-fähige Nachweise für interne und mandatsnahe Abstimmungen.</li>
        </ul>
      </InfoPanel>

      <CtaPanel
        title="Kanzlei-spezifische Anforderungen besprechen"
        description="Für Teams, Rollenmodelle und Beschaffungsfragen im Kanzleikontext steht ein strukturierter Enterprise-Einstieg bereit."
        primaryLabel="Enterprise-Kontakt"
        primaryHref="/enterprise-kontakt"
        secondaryLabel="Trust Center"
        secondaryHref="/trust-center"
      />
    </PageShell>
  )
}
