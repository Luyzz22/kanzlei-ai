import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { SectionIntro } from "@/components/marketing/section-intro"

const inhouseUseCases = [
  "Vertragsprüfung in standardisierten Prüfschritten",
  "Vendor- und Datenschutzdokumente im einheitlichen Kontext",
  "Freigabeprozesse mit klaren Zuständigkeiten",
  "Nachweise für interne Kontrollen und Governance"
]

const stakeholder = [
  {
    title: "Legal",
    description: "Steuert juristische Bewertung, Priorisierung und Freigabeempfehlungen für vertragsnahe Vorgänge."
  },
  {
    title: "Einkauf",
    description: "Arbeitet mit Legal in abgestimmten Prüfpfaden für Beschaffungsvorgänge und Vertragsabstimmungen."
  },
  {
    title: "Datenschutz",
    description: "Prüft datenschutzrelevante Dokumente, Nachweise und Anforderungen in kontrollierten Prozessen."
  },
  {
    title: "IT / Governance",
    description: "Begleitet Zugriffsmodelle, Kontrollanforderungen und Dokumentationspflichten im Betriebskontext."
  }
]

export default function LoesungRechtsabteilungenPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Lösungen für Rechtsabteilungen"
        title="Enterprise-taugliche Struktur für Inhouse Legal und Governance"
        description="KanzleiAI unterstützt Rechtsabteilungen bei der kontrollierten Zusammenarbeit zwischen Legal, Einkauf, Datenschutz und IT in dokumentenbasierten Prozessen."
      />

      <InfoPanel title="Typische Inhouse-Use-Cases" tone="muted">
        <ul className="grid gap-2 sm:grid-cols-2">
          {inhouseUseCases.map((useCase) => (
            <li key={useCase} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {useCase}
            </li>
          ))}
        </ul>
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-2">
        {stakeholder.map((rolle) => (
          <FeatureCard key={rolle.title} title={rolle.title} description={rolle.description} meta="Stakeholder im Inhouse-Kontext" />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          title="Standardisierung"
          description="Einheitliche Prozessmuster für wiederkehrende Vertrags- und Prüfvorgänge reduzieren Abstimmungsaufwand und Kontextwechsel."
          meta="Nutzenblock"
        />
        <FeatureCard
          title="Review-Priorisierung"
          description="Relevante Vorgänge werden nachvollziehbar priorisiert, sodass fachliche Ressourcen auf risikorelevante Inhalte fokussiert bleiben."
          meta="Nutzenblock"
        />
        <FeatureCard
          title="Nachweisfähigkeit"
          description="Dokumentierte Entscheidungen und Prozessschritte unterstützen interne Kontrollanforderungen und Audit-nahe Rückfragen."
          meta="Nutzenblock"
        />
        <FeatureCard
          title="Kontrollierte Zusammenarbeit"
          description="Rechtsabteilung, Einkauf und Governance-Funktionen arbeiten auf einer gemeinsamen, rollenorientierten Informationsbasis."
          meta="Nutzenblock"
        />
      </section>

      <CtaPanel
        title="Abstimmung für Enterprise-Beschaffung"
        description="Für Beschaffungs-, Sicherheits- und Governance-Fragen steht ein strukturierter Enterprise-Kontakt zur Verfügung."
        primaryLabel="Enterprise-Kontakt"
        primaryHref="/enterprise-kontakt"
        secondaryLabel="Sicherheit & Compliance"
        secondaryHref="/sicherheit-compliance"
      />
    </main>
  )
}
