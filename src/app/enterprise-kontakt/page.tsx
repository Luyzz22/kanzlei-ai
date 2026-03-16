import Link from "next/link"

import { CtaPanel } from "@/components/marketing/cta-panel"
import { FeatureCard } from "@/components/marketing/feature-card"
import { InfoPanel } from "@/components/marketing/info-panel"
import { ProcessFlow } from "@/components/marketing/process-flow"
import { SectionIntro } from "@/components/marketing/section-intro"

const anfragekategorien = [
  "Produktdemo und fachlicher Einsatzkontext",
  "Sicherheits- und Compliance-Fragen",
  "Beschaffung und Einkauf",
  "Integrations- und Admin-Anforderungen",
  "Vertrags- und Datenschutzfragen"
]

export default function EnterpriseKontaktPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionIntro
        eyebrow="Enterprise-Kontakt"
        title="Einstieg für Enterprise-Anfragen und Beschaffung"
        description="Dieser Bereich ist für strukturierte Anfragen aus Kanzleien, Rechtsabteilungen und Beschaffungsfunktionen ausgelegt. Ziel ist eine saubere Klärung von Scope, Governance und Anforderungen."
      />

      <InfoPanel title="Anfragekategorien" tone="muted">
        <ul className="grid gap-2 sm:grid-cols-2">
          {anfragekategorien.map((kategorie) => (
            <li key={kategorie} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {kategorie}
            </li>
          ))}
        </ul>
      </InfoPanel>

      <InfoPanel title="Typischer Ablauf der Erstabstimmung">
        <ProcessFlow
          steps={[
            {
              title: "Erstgespräch",
              description: "Ziele, Einsatzbereich und beteiligte Stakeholder werden in einem strukturierten Ersttermin aufgenommen."
            },
            {
              title: "Scope und Anforderungen",
              description: "Fachliche, organisatorische und technische Rahmenbedingungen werden für den Einsatzkontext konkretisiert."
            },
            {
              title: "Trust- und Compliance-Review",
              description: "Sicherheits-, Datenschutz- und Governance-Fragen werden anhand verfügbarer Nachweise eingeordnet."
            },
            {
              title: "Angebot und weitere Abstimmung",
              description: "Auf dieser Grundlage folgen Angebotsrahmen, Beschaffungsklärung und die nächsten gemeinsamen Schritte."
            }
          ]}
        />
      </InfoPanel>

      <section className="grid gap-4 md:grid-cols-2">
        <FeatureCard
          title="Kontaktvorbereitung"
          description="Bitte halten Sie Informationen zu Teamgröße, Rollenmodell, benötigten Integrationen und Governance-Anforderungen bereit."
          meta="Read-only Vorbereitung"
        />
        <FeatureCard
          title="Kontaktpfade"
          description="Verbindliche Kontakt- und Anbieterangaben finden Sie im Impressum. Für Sicherheits- und Nachweisthemen nutzen Sie bitte zusätzlich Trust Center und Sicherheitsbereich."
          meta="Keine Formular-Submission"
        />
      </section>

      <InfoPanel title="Weiterführende Verweise" tone="accent">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/impressum"
            className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Impressum
          </Link>
          <Link
            href="/trust-center"
            className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Trust Center
          </Link>
          <Link
            href="/sicherheit-compliance"
            className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Sicherheit & Compliance
          </Link>
        </div>
      </InfoPanel>

      <CtaPanel
        title="Zum Überblick über Lösungen und Produktbereiche"
        description="Falls Sie zunächst den fachlichen Kontext prüfen möchten, finden Sie strukturierte Einstiegsseiten zu Produkt, Lösungen und Trust-Themen."
        primaryLabel="Produkt ansehen"
        primaryHref="/produkt"
        secondaryLabel="Lösungen für Kanzleien"
        secondaryHref="/loesungen/kanzleien"
      />
    </main>
  )
}
